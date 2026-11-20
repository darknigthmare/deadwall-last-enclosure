'use strict';
// Independent execution of the exported game painters. Generated images are never edited.
const fs=require('node:fs'), path=require('node:path'), cp=require('node:child_process'), crypto=require('node:crypto'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),repo=path.join(root,'deadwall-art236');
const base='12e0aa4aa77b9901bd53eb7a8771382a5f753593';
const git=(...a)=>cp.execFileSync('git',['-C',repo,...a],{maxBuffer:32*1024*1024});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const {createCanvas,loadImage}=require(path.join(repo,'node_modules/@napi-rs/canvas'));
const save=(prep,rows,extra)=>fs.writeFileSync(path.join(prep,'root-canonical-replay.json'),JSON.stringify({sourceRevision:base,reviewer:'root independent renderer execution',method:'Fresh canvases, public native entry points, exact pinned source files; compare PNG bytes with prepared canonical references.',...extra,targets:rows},null,2)+'\n');
assert.equal(git('rev-parse','HEAD').toString().trim(),base);
function verifySources(prep,rows){return rows.map(s=>{const rel=s.repositoryPath||s.sourcePath,stored=s.preparedPath||s.archivedPath||s.path;const raw=git('show',base+':'+rel);assert.ok(raw.equals(fs.readFileSync(path.join(repo,rel))),rel+' worktree differs');assert.ok(raw.equals(fs.readFileSync(path.join(prep,stored))),rel+' archive differs');assert.equal(hash(raw),s.sha256);return {repositoryPath:rel,sha256:hash(raw),bytes:raw.length,exactRevisionBytes:true};});}
function compare(id,raw,file,extra){const original=fs.readFileSync(file);assert.ok(raw.equals(original),id+' replay differs');return {id,canonicalSha256:hash(original),replaySha256:hash(raw),bytes:raw.length,replayedBytesIdentical:true,...extra};}
async function main(){
  {
    const prep=path.join(root,'art236-prep'),receipt=read(path.join(prep,'canonical-render-receipt.json'));
    const sources=verifySources(prep,read(path.join(prep,'references/sources.json')).sources);
    const {boot131}=require(path.join(repo,'tests/helpers/expansions131.cjs'));
    const {g}=boot131({seed:'17117'});require(path.join(repo,'src/succession133.js')).install(g);
    g.player.facing=0;g.player.invulnerable=0;g.damagePlayer(1000);
    const body=g.succession133.remains().at(-1);assert.ok(body);assert.equal(body.point.angle,0);assert.notEqual(body.body.phase,'risen');assert.notEqual(typeof g.art?.drawFallen133,'function');
    const snap=()=>{const v=g.serialize();delete v.timestamp;return JSON.stringify(v);};
    const before=snap(),canvas=createCanvas(1536,1024),ctx=canvas.getContext('2d');
    const entry=g.succession133.depthEntries('local',null,{l:body.body.x-512,r:body.body.x+512,t:body.body.y-512,b:body.body.y+512}).find(e=>e.id==='fallen:'+body.id+':body');assert.ok(entry);
    ctx.translate(866.56,501.44);ctx.scale(22,22);ctx.translate(-body.body.x,-body.body.y);entry.draw(ctx);assert.equal(snap(),before);
    const row=compare('succession:body',canvas.toBuffer('image/png'),path.join(prep,receipt.canonicalImage.path),{entryPoint:'succession133.depthEntries / fallen body draw',serializedStateUnchangedExcludingFreshTimestamp:true,fullGroundMarkPreserved:true,metricGeometryCertified:false});
    save(prep,[row],{sources,canvasVersion:require(path.join(repo,'node_modules/@napi-rs/canvas/package.json')).version});
  }
  {
    const prep=path.join(root,'art237-prep'),source=read(path.join(prep,'source-evidence.json')),selection=read(path.join(prep,'canonical-receipts.json'));
    const sources=verifySources(prep,source.sourceFiles),C=require(path.join(repo,'src/core.js')),T=require(path.join(repo,'src/trap-art159.js'));
    const images={};for(const key of ['trap159MechanismsA','trap159SuppliesA'])images[key]=await loadImage(path.join(repo,T.ASSETS[key].url));
    const art={images,blit(ctx,key,rect,...dest){ctx.drawImage(images[key],...rect,...dest);return true;}};
    assert.deepEqual(C.CityGeometry202.definition('spikes',1).size,[1,1]);assert.equal(C.TILE,32);
    const rows=[];
    for(const target of selection.targets){
      const recipe=C.FortificationPackRules.mechanisms[target.kind],r=target.canonicalReference;
      const owner={id:29,type:'spikes',completed:true,dead:false,health:C.CityGeometry202.definition('spikes',1).health,rotation:0,left:-16,right:16,top:-16,bottom:16};
      const mechanism={kind:target.kind,charges:recipe.charges,cooldown:0,caught:[]};
      const supportOptions={variant:0,seed:0,reducedMotion:false,presentation:{phase:'idle',progress:0,motion:0}};
      const options={variant:0,seed:0,reducedMotion:false,presentation:{kind:target.kind,phase:'armed',progress:0,motion:0,charges:recipe.charges,capacity:recipe.charges,cooldown:0,held:0}};
      assert.deepEqual(owner,r.owner);assert.deepEqual(options,r.options);assert.deepEqual(T.ownerFrame(owner),{x:0,y:0,w:26,h:26,angle:0});
      const before=JSON.stringify({owner,mechanism,supportOptions,options}),canvas=createCanvas(1024,1024),ctx=canvas.getContext('2d');ctx.translate(512,512);ctx.scale(24,24);
      const oldRandom=Math.random,oldNext=C.Random?.prototype.next;let randomCalls=0;Math.random=()=>{randomCalls++;throw Error('Unexpected random draw');};if(oldNext)C.Random.prototype.next=function(){randomCalls++;throw Error('Unexpected game RNG draw');};
      try{assert.equal(T.drawSpikes(ctx,art,owner,supportOptions),true);assert.equal(T.drawMechanism(ctx,art,owner,mechanism,options),true);}finally{Math.random=oldRandom;if(oldNext)C.Random.prototype.next=oldNext;}
      assert.equal(JSON.stringify({owner,mechanism,supportOptions,options}),before);assert.equal(randomCalls,0);
      rows.push(compare(target.artId,canvas.toBuffer('image/png'),r.path,{entryPoints:['drawSpikes','drawMechanism'],supportFootprintAuthorMetres:[1,1],stateInputsUnchanged:true,rngCalls:randomCalls,phase:'armed',motion:0,variant:0,heightInferred:false}));
    }
    save(prep,rows,{sources,canvasVersion:require(path.join(repo,'node_modules/@napi-rs/canvas/package.json')).version});
  }
  {
    const prep=path.join(root,'art238-prep'),selection=read(path.join(prep,'selection-and-prompts.json'));
    const sources=verifySources(prep,selection.sourceFiles),A=require(path.join(repo,'src/campaign-site-art205.js')),R=require(path.join(repo,'scripts/codex-residential2026.cjs'));
    const settings={fence:[1,1280,1024,320],'garden-shed':[1,1280,1024,220],'rain-barrel':[1,1024,1024,1000],'compost-bin':[1,1024,1024,720],'closed-pool':[21,1024,1280,60]},rows=[];
    for(const target of selection.targets){const [number,w,h,scale]=settings[target.kind],plan=R.build('EXT-MONDE-T045',number),source=plan.structures.find(p=>p.id===target.sourceId);assert.deepEqual(source,target.sourceObject);assert.equal(A.routeFor(target.kind),'structural205');
      const fixture={...source,x:0,y:0,z:0,rotationRad:0,campaign205:true,campaign205Structural:true},before=JSON.stringify(fixture),canvas=createCanvas(w,h),ctx=canvas.getContext('2d');ctx.translate((w-source.w*scale)/2,(h-source.h*scale)/2);ctx.scale(scale,scale);
      assert.equal(A.drawProp(ctx,null,fixture,{seed:0,floor:0,variant:0,stateAlpha:false,scale}),true);assert.equal(JSON.stringify(fixture),before);
      rows.push(compare(target.artId,canvas.toBuffer('image/png'),target.referenceImages[0],{entryPoint:'campaign-site-art205.drawProp',sourcePlanId:plan.id,sourceId:source.id,footprintAuthorMetres:[source.w,source.h],heightAuthorMetres:source.maxHeightM,sourceFixtureUnchanged:true,gameArgumentOmitted:true,canonicalVariant:0}));
    }
    save(prep,rows,{sources,canvasVersion:require(path.join(repo,'node_modules/@napi-rs/canvas/package.json')).version});
  }
  console.log(JSON.stringify({sourceRevision:base,replayedCanonicalCount:12,allBytesIdentical:true,files:['art236-prep/root-canonical-replay.json','art237-prep/root-canonical-replay.json','art238-prep/root-canonical-replay.json']}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
