'use strict';
// Independent replay, in memory only, of each recorded canonical renderer call.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),repo=path.join(root,'deadwall-art233');
const {createCanvas}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const A=require(path.join(repo,'src/campaign-site-art205.js')),C=require(path.join(repo,'src/codex-furnishings2026.js')).CATALOGUE;
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const base='f3ba02a5b73a55120c02c21d5703902ea3e901d9';
if(cp.execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==base)throw Error('Wrong base');
if(cp.execFileSync('git',['-C',repo,'diff','--name-only','--','src'],{encoding:'utf8'}).trim())throw Error('Runtime source modified');
const all=[];
for(const pack of [233,234,235]){
 const prep=path.join(root,'art'+pack+'-prep'),selection=read(path.join(prep,'selection-and-prompts.json'));
 const receipt=pack===233?null:read(path.join(prep,'canonical-render-receipt.json'));
 const results=[];
 for(const t of selection.targets){
  let prop,options,width,height,origin=[0,0],scale,file,expected,art=null;
  if(pack===233){
   const r=t.canonicalReference;prop=r.prop;scale=r.pixelsPerMetre;width=r.width;height=r.height;file=r.path;expected=r.sha256;
   options={variant:0,seed:0,floor:0,stateAlpha:false,scale};art={images:{}};
  }else if(pack===234){
   const r=receipt.render.find(x=>x.kind===t.kind);prop=r.prop;options=r.options;width=r.canvas.width;height=r.canvas.height;origin=r.canvas.translate;scale=r.canvas.pixelsPerMetre;file=r.file;expected=r.sha256;
  }else{
   const r=receipt.targets.find(x=>x.key===t.key);prop=r.fixture;options=r.options;width=r.canvas.width;height=r.canvas.height;origin=[r.canvas.origin.x,r.canvas.origin.y];scale=r.canvas.pixelsPerMetre;file=path.join(prep,r.file);expected=r.sha256;
   const R=require(path.join(repo,'scripts/codex-residential2026.cjs')),native=R.build(t.sourceType,1).structures.find(x=>x.id===t.sourceId);
   if(JSON.stringify(native)!==JSON.stringify(t.sourceObject))throw Error('Caravan source object mismatch');
  }
  const native=pack===235?{w:2.4,h:6.2}:C[t.kind];
  if(prop.kind!==t.kind||prop.w!==native.w||prop.h!==native.h||options.variant!==0||options.stateAlpha!==false||options.game)throw Error('Wrong fixture or state');
  const snapshot=JSON.stringify(prop),canvas=createCanvas(width,height),ctx=canvas.getContext('2d');ctx.translate(...origin);ctx.scale(scale,scale);
  if(!A.drawProp(ctx,art,prop,options))throw Error('Native draw failed');
  const rerendered=canvas.toBuffer('image/png'),original=fs.readFileSync(file);
  if(hash(rerendered)!==expected||!rerendered.equals(original)||JSON.stringify(prop)!==snapshot)throw Error('Replay differs: '+t.kind);
  results.push({id:t.artId,kind:t.kind,sourceRoute:A.routeFor(t.kind),canonicalSha256:expected,referenceBytes:original.length,replayedBytesIdentical:true,sourceObjectUnchanged:true,nativeFootprintVerified:true,gameProvided:false,variant:0,stateAlpha:false});
 }
 const report={reviewer:'root',sourceRevision:base,method:'Independent in-memory replay of the recorded public drawProp call against the unchanged repository code; byte-for-byte PNG comparison, source-footprint and object-mutation checks.',imageEditingPerformed:false,targets:results};
 fs.writeFileSync(path.join(prep,'root-canonical-replay.json'),JSON.stringify(report,null,2)+'\n');all.push({pack,count:results.length,allByteIdentical:true});
}
console.log(JSON.stringify(all));
