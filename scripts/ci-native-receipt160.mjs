import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const hash=data=>createHash('sha256').update(data).digest('hex');
const requireCondition=(ok,reason)=>{if(!ok)throw Error(reason);};
const footerKeys=['tests','suites','pass','fail','cancelled','skipped','todo'];

export function canonicalSourceMap(map){
  requireCondition(map&&typeof map==='object'&&!Array.isArray(map),'Invalid source map');
  const keys=Object.keys(map).sort();
  for(const key of keys)requireCondition(key&&!/[\x00-\x1f]/.test(key)&&typeof map[key]==='string'&&/^[a-f0-9]{64}$/.test(map[key]),'Invalid source fingerprint');
  return'{'+keys.map(key=>JSON.stringify(key)+':'+JSON.stringify(map[key])).join(',')+'}';
}

export function parseNativeCounts(text){
  const clean=String(text).replace(/\x1b\[[0-9;]*m/g,'').replaceAll('\r\n','\n');
  let counts={},started=false,valid=true;
  for(const line of clean.split('\n')){
    const match=/^\s*(?:[ℹ#]\s*)?(tests|suites|pass|fail|cancelled|skipped|todo)\s+(\d+)\s*$/.exec(line);
    if(!match)continue;
    const[,key,value]=match;
    if(key==='tests'){counts={};started=true;valid=true;}
    if(!started)continue;
    const count=Number(value);if(Object.hasOwn(counts,key)||!Number.isSafeInteger(count))valid=false;
    counts[key]=count;
  }
  const complete=started&&valid&&footerKeys.every(key=>Object.hasOwn(counts,key));
  const negativeCase=/^\s*(?:✖|not ok\s+\d+(?:\s|$))/m.test(clean);
  const skipOrTodoCase=/^\s*(?:ok|not ok)\s+\d+[^\n]*?\s+#\s*(?:SKIP|TODO)\b/im.test(clean);
  return{counts,complete,negativeCase,skipOrTodoCase,
    positive:complete&&!negativeCase&&!skipOrTodoCase&&counts.tests>3364&&counts.tests===counts.pass&&
      ['fail','cancelled','skipped','todo'].every(key=>counts[key]===0)};
}

export function qualifyNativeReceipt(started,sourceAfter,details){
  const parsed=parseNativeCounts(details.log),before=canonicalSourceMap(started.sourceBefore),after=canonicalSourceMap(sourceAfter);
  const changedFiles=[...new Set([...Object.keys(started.sourceBefore),...Object.keys(sourceAfter)])].sort()
    .filter(name=>started.sourceBefore[name]!==sourceAfter[name]);
  const actualExitCode=details.actualExitCode,teeExitCode=details.teeExitCode;
  requireCondition(Number.isSafeInteger(actualExitCode)&&actualExitCode>=0&&actualExitCode<=255&&
    Number.isSafeInteger(teeExitCode)&&teeExitCode>=0&&teeExitCode<=255,'Invalid actual pipeline exit status');
  const sourceStable=before===after,headStable=started.gitHead===details.gitHeadAfter;
  const accepted=actualExitCode===0&&teeExitCode===0&&parsed.positive&&sourceStable&&headStable&&
    started.soakEnabled===true&&details.soakEnabled===true&&details.checkoutClean===true;
  return{label:started.label,command:['npm','run','check'],startedAt:started.startedAt,completedAt:details.completedAt,
    actualExitCode,teeExitCode,soakEnabled:started.soakEnabled===true&&details.soakEnabled===true,
    gitHead:started.gitHead,gitHeadAfter:details.gitHeadAfter,headStable,checkoutClean:details.checkoutClean,
    logSha256:hash(details.logBytes),counts:parsed.counts,footerComplete:parsed.complete,
    negativeCase:parsed.negativeCase,skipOrTodoCase:parsed.skipOrTodoCase,
    sourceBefore:started.sourceBefore,sourceAfter,sourceFiles:Object.keys(started.sourceBefore).length,changedFiles,
    sourceMapSHA256:hash(before),sourceMapAfterSHA256:hash(after),sourceStable,accepted,
    scope:'One actual full native check with endurance, exact tracked source bytes and original npm/tee exit codes. No browser, hardware, human campaign or production qualification is inferred.'};
}

function git(args){return execFileSync('git',['--no-optional-locks',...args],{cwd:root,encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});}
function sourceMap(){
  const names=[...new Set(git(['ls-files','-z']).split('\0').filter(Boolean))].sort(),result={};
  for(const name of names){
    requireCondition(!path.isAbsolute(name)&&!name.split('/').some(part=>part==='..'||part==='.')&&!/[\x00-\x1f]/.test(name),'Invalid tracked source path');
    const filename=path.join(root,name),before=fs.lstatSync(filename);
    requireCondition(before.isFile()&&!before.isSymbolicLink(),'Tracked source must be a regular file: '+name);
    const bytes=fs.readFileSync(filename),after=fs.lstatSync(filename);
    requireCondition(before.size===after.size&&before.mtimeMs===after.mtimeMs&&before.mode===after.mode,'Source changed during capture: '+name);
    result[name]=hash(bytes);
  }
  requireCondition(names.length>4200,'Full tracked source inventory required');return result;
}
const gitHead=()=>{const value=git(['rev-parse','HEAD']).trim();requireCondition(/^[a-f0-9]{40}$/.test(value),'Invalid actual Git HEAD');return value;};
const checkoutClean=()=>git(['status','--porcelain']).trim()==='';
function writeNew(filename,data){fs.writeFileSync(filename,data,{flag:'wx'});}

function main(argv){
  const command=argv.shift(),args={};
  requireCondition(['start','finish'].includes(command),'Expected start or finish');
  while(argv.length){const key=argv.shift();requireCondition(['--label','--directory','--exit-code','--tee-exit-code'].includes(key)&&argv.length&&!Object.hasOwn(args,key),'Invalid or repeated argument');args[key]=argv.shift();}
  const label=args['--label'];requireCondition(/^[a-z0-9][a-z0-9-]{0,95}$/.test(label||''),'Unique label required');
  const directory=args['--directory']||'artifacts/qa/native';
  requireCondition(/^artifacts\/qa\/[a-z0-9][a-z0-9-]*$/.test(directory),'Use a repository artifacts/qa directory');
  const folder=path.join(root,directory),startFile=path.join(folder,label+'.started.json'),receiptFile=path.join(folder,label+'.receipt.json'),logFile=path.join(folder,label+'.log');
  fs.mkdirSync(folder,{recursive:true});
  requireCondition(!fs.existsSync(receiptFile),'Preserve previous receipts; use a new label');
  if(command==='start'){
    requireCondition(!fs.existsSync(startFile)&&!fs.existsSync(logFile),'Preserve previous start journal and log');
    requireCondition(process.env.DEADWALL_SOAK==='1'&&checkoutClean(),'Clean source and actual endurance environment required');
    const head=gitHead(),sourceBefore=sourceMap();requireCondition(gitHead()===head&&checkoutClean(),'Source binding changed before native check');
    const record={label,command:['npm','run','check'],startedAt:new Date().toISOString(),soakEnabled:true,gitHead:head,
      sourceBefore,sourceMapSHA256:hash(canonicalSourceMap(sourceBefore))};
    writeNew(startFile,JSON.stringify(record,null,2)+'\n');return 0;
  }
  requireCondition(/^(?:0|[1-9]\d{0,2})$/.test(args['--exit-code']||'')&&/^(?:0|[1-9]\d{0,2})$/.test(args['--tee-exit-code']||''),'Actual npm and tee exit codes required');
  const started=JSON.parse(fs.readFileSync(startFile,'utf8'));
  requireCondition(started.label===label&&JSON.stringify(started.command)==='["npm","run","check"]'&&
    /^[a-f0-9]{40}$/.test(started.gitHead)&&started.sourceMapSHA256===hash(canonicalSourceMap(started.sourceBefore)),'Invalid start journal');
  const sourceAfter=sourceMap(),logBytes=fs.readFileSync(logFile);
  const record=qualifyNativeReceipt(started,sourceAfter,{actualExitCode:Number(args['--exit-code']),teeExitCode:Number(args['--tee-exit-code']),
    log:logBytes.toString('utf8'),logBytes,gitHeadAfter:gitHead(),soakEnabled:process.env.DEADWALL_SOAK==='1',
    checkoutClean:checkoutClean(),completedAt:new Date().toISOString()});
  const receiptBytes=JSON.stringify(record,null,2)+'\n';writeNew(receiptFile,receiptBytes);
  const notice={label,accepted:record.accepted,counts:record.counts,actualExitCode:record.actualExitCode,teeExitCode:record.teeExitCode,
    gitHead:record.gitHead,headStable:record.headStable,sourceStable:record.sourceStable,soakEnabled:record.soakEnabled,checkoutClean:record.checkoutClean,
    footerComplete:record.footerComplete,negativeCase:record.negativeCase,skipOrTodoCase:record.skipOrTodoCase,
    sourceFiles:record.sourceFiles,sourceMapSHA256:record.sourceMapSHA256,sourceMapAfterSHA256:record.sourceMapAfterSHA256,
    logSHA256:record.logSha256,receiptSHA256:hash(receiptBytes)};
  console.log('::notice title=DEADWALL_NATIVE160::'+JSON.stringify(notice));
  return record.accepted?0:1;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.exitCode=main(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=1;}
}
