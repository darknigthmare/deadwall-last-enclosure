'use strict';
// Run normally for local measurements, or pass an unchanged source checkout to
// compare isolated Node processes and verify complete world-output parity.
const path=require('node:path'),{spawnSync}=require('node:child_process'),{performance}=require('node:perf_hooks'),{describeWorld}=require('../tests/helpers/world-generation-digest.cjs');
const source=path.resolve(__dirname,'..'),seeds=[0,17117,84329,4294967295];
if(process.argv[2]==='--worker'){
 const W=require(path.join(process.argv[3],'src/frontier-world.js')),rows=[];
 for(const seed of seeds){const start=performance.now(),world=W.create(seed,7),generationMs=performance.now()-start;rows.push({generationMs,...describeWorld(world)});}
 process.stdout.write(JSON.stringify(rows));
}else{
 const run=dir=>{
  const processResult=spawnSync(process.execPath,[__filename,'--worker',dir],{encoding:'utf8',timeout:120000,maxBuffer:1024*1024});
  if(processResult.status!==0)throw Error(processResult.stderr||processResult.error?.message||'Benchmark worker failed');
  return JSON.parse(processResult.stdout);
 };
 const baseline=process.argv[2]?run(path.resolve(process.argv[2])):null,current=run(source);
 const result={method:'Isolated Node processes; complete G7 construction timed before full geometry, every floor and seven streamed chunks are fingerprinted.',seeds,rows:current.map((row,i)=>{
  if(!baseline)return row;
  const {generationMs:before,...oldOutput}=baseline[i],{generationMs:after,...newOutput}=row,parity=JSON.stringify(oldOutput)===JSON.stringify(newOutput);
  if(!parity)process.exitCode=1;
  return{seed:row.seed,beforeMs:before,afterMs:after,speedup:before/after,parity,output:newOutput};
 })};
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
