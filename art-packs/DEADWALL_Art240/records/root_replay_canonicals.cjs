'use strict';
// Independent public API replay; never edits generated pixels or game sources.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),repo=path.join(root,'deadwall-art236');
const source='12e0aa4aa77b9901bd53eb7a8771382a5f753593',parent='6ebd6707251e675a5b75ded23e91dd28339dfe38',tree='33d089eab2bb23f288e66d57c2794f6a38b3ba84';
const git=(...a)=>cp.execFileSync('git',['-C',repo,...a],{maxBuffer:32*1024*1024});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(git('rev-parse','HEAD').toString().trim(),parent);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),tree);
const {createCanvas}=require(path.join(repo,'node_modules/@napi-rs/canvas'));
const A=require(path.join(repo,'src/campaign-site-art205.js')),R=require(path.join(repo,'scripts/codex-residential2026.cjs'));
const prior=read(path.join(repo,'art-packs/DEADWALL_Art238/coverage/coverage-art222-238.json'));
const oldBySha=new Map(prior.assets.map(a=>[a.sha256,a]));
const settings={fence:[1280,1024,320],'garden-shed':[1280,1024,220],'rain-barrel':[1024,1024,1000],'compost-bin':[1024,1024,720],'closed-pool':[1024,1280,60],'touring-caravan':[640,1280,160],'abandoned-caravan':[640,1280,160]};
let total=0;
for(const n of [239,240,241]){
 const prep=path.join(root,'art'+n+'-prep'),selection=read(path.join(prep,'selection-and-prompts.json'));
 const sources=selection.sourceFiles.map(s=>{
  assert.ok([source,parent].includes(s.revision));
  const raw=git('show',s.revision+':'+s.repositoryPath);
  assert.ok(raw.equals(fs.readFileSync(path.join(repo,s.repositoryPath))),s.repositoryPath+' checkout bytes');
  assert.ok(raw.equals(fs.readFileSync(path.join(prep,s.preparedPath||s.path))),s.repositoryPath+' archived bytes');
  assert.equal(sha(raw),s.sha256);assert.equal(raw.length,s.bytes);
  return {repositoryPath:s.repositoryPath,revision:s.revision,sha256:s.sha256,bytes:s.bytes,exactRevisionBytes:true};
 });
 const sourceBySha=new Map(sources.map(s=>[s.sha256,s]));
 const targets=[];
 for(const t of selection.targets){
  assert.ok([1,2].includes(t.canonicalVariant));assert.equal(t.painterVariant,t.canonicalVariant);
  const plan=R.build(t.sourceType,t.sourcePlanVariant),object=plan.structures.find(o=>o.id===t.sourceId);
  assert.equal(plan.id,t.sourcePlanId);assert.deepEqual(object,t.sourceObject);assert.equal(object.kind,t.kind);
  assert.equal(A.routeFor(t.kind),'structural205');
  const [w,h,scale]=settings[t.kind],canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
  const fixture={...object,x:0,y:0,z:0,rotationRad:0,campaign205:true,campaign205Structural:true};
  const options={seed:0,floor:0,variant:t.canonicalVariant,stateAlpha:false,scale},before=JSON.stringify({fixture,options});
  ctx.translate((w-object.w*scale)/2,(h-object.h*scale)/2);ctx.scale(scale,scale);
  const oldRandom=Math.random;let randomCalls=0;Math.random=()=>{randomCalls++;throw Error('Unexpected random draw');};
  try{assert.equal(A.drawProp(ctx,null,fixture,options),true);}finally{Math.random=oldRandom;}
  assert.equal(JSON.stringify({fixture,options}),before);assert.equal(randomCalls,0);
  const raw=canvas.toBuffer('image/png'),reference=t.referenceFiles[0],canonical=fs.readFileSync(reference.path);
  assert.ok(raw.equals(canonical),t.key+' canonical differs');assert.equal(sha(raw),reference.sha256);
  const styleBindings=t.referenceFiles.slice(1).map(ref=>{
   const rawStyle=fs.readFileSync(ref.path);assert.equal(sha(rawStyle),ref.sha256);
   const old=oldBySha.get(ref.sha256),tracked=sourceBySha.get(ref.sha256);
   assert.ok(old||tracked,t.key+' unbound style image');
   const repositoryPath=old?old.repositoryAssetPath:tracked.repositoryPath;
   assert.ok(rawStyle.equals(git('show',parent+':'+repositoryPath)),t.key+' style differs from parent');
   return {sha256:ref.sha256,repositoryPath,verifiedAtRevision:parent,role:ref.role,existingImageNotNewGeneration:true};
  });
  targets.push({id:t.id,key:t.key,canonicalSha256:sha(raw),replaySha256:sha(raw),bytes:raw.length,replayedBytesIdentical:true,entryPoint:'campaign-site-art205.drawProp',sourcePlanId:plan.id,sourceId:object.id,sourcePlanVariant:t.sourcePlanVariant,painterVariant:t.painterVariant,canonicalVariant:t.canonicalVariant,footprintAuthorMetres:[object.w,object.h],heightAuthorMetres:object.maxHeightM,sourceFixtureAndOptionsUnchanged:true,gameArgumentOmitted:true,rngCalls:randomCalls,styleBindings});
 }
 const receipt={sourceRevision:source,publicationParent:parent,publicationParentTree:tree,reviewer:'root independent public painter replay',method:'Fresh canvases; exact authored fixtures; fixed settings derived from the prior v0 preparation; compare full encoded PNG bytes.',canvasVersion:require(path.join(repo,'node_modules/@napi-rs/canvas/package.json')).version,sources,targets};
 fs.writeFileSync(path.join(prep,'root-canonical-replay.json'),JSON.stringify(receipt,null,2)+'\n');
 total+=targets.length;console.log(JSON.stringify({pack:n,replayed:targets.length,allBytesIdentical:true,verifiedSources:sources.length}));
}
assert.equal(total,14);console.log(JSON.stringify({total,allBytesIdentical:true,generatedImagesEdited:false}));
