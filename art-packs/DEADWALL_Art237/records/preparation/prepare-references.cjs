'use strict';
// Read-only extraction from the unchanged current game painters. No engine edits.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const prep=__dirname;
const repo=path.resolve(process.argv[2]||path.join(prep,'../deadwall-art236'));
const {createCanvas,loadImage}=require(path.join(repo,'node_modules/@napi-rs/canvas'));
const sourceMain='12e0aa4aa77b9901bd53eb7a8771382a5f753593';
const sourceTree='663ad5750e49ae401fc0b46bfdebc28942ad1617';
const git=(...args)=>execFileSync('git',['-C',repo,...args],{maxBuffer:64*1024*1024});
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const write=(name,data)=>{const file=path.join(prep,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');};
assert.equal(git('rev-parse','HEAD').toString().trim(),sourceMain);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),sourceTree);
const sourceFiles=[
 'AGENTS.md','README.md','package.json','package-lock.json','docs/ORIGINAL_BRIEF.txt','docs/GAME_DESIGN.md','docs/ARCHITECTURE.md','docs/BALANCING.md','docs/CODEX_MASTER_PROMPT.md','docs/GAMEDEV_GUIDANCE.md','docs/GAME_BIBLE.md',
 'src/core.js','src/art.js','src/trap-art159.js','src/fortification-pack.js','docs/DEFENSES_193.md','assets/art159/PROVENANCE-traps159.json','tests/audit193-trap-art.test.cjs','tests/trap-art159.test.cjs',
 'assets/art159/traps-mechanisms-a.png','assets/art159/traps-supplies-a.png'
];
const sources=sourceFiles.map(repositoryPath=>{
 const raw=fs.readFileSync(path.join(repo,repositoryPath)),committed=git('show',sourceMain+':'+repositoryPath);
 assert.ok(raw.equals(committed),'Source bytes differ from pinned revision: '+repositoryPath);
 const preparedPath='references/repository/'+repositoryPath;
 write(preparedPath,raw);
 return {repositoryPath,preparedPath,absolutePath:path.join(prep,preparedPath),revision:sourceMain,gitBlob:git('rev-parse',sourceMain+':'+repositoryPath).toString().trim(),sha256:sha(raw),bytes:raw.length,worktreeMatchesCommit:true};
});
const C=require(path.join(repo,'src/core.js'));
const T=require(path.join(repo,'src/trap-art159.js'));
const kinds=['runnerCable193','breachClamp193','enduranceRack193','shieldTongs193','quickCable193','siegeBrake193'];
const filenames=['runnerCable193_cable_anti_coureurs.png','breachClamp193_machoire_anti_briseurs.png','enduranceRack193_ratelier_dents_releve.png','shieldTongs193_pinces_anti_protections.png','quickCable193_bobines_couverture_rapide.png','siegeBrake193_frein_chaine_siege.png'];
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
const ownerDefinition=C.CityGeometry202.definition('spikes',1);
assert.deepEqual(ownerDefinition.size,[1,1]);assert.equal(C.TILE,32);
const owner=freeze({id:29,type:'spikes',completed:true,dead:false,health:ownerDefinition.health,rotation:0,left:-16,right:16,top:-16,bottom:16});
const frame=T.ownerFrame(owner);assert.deepEqual(frame,{x:0,y:0,w:26,h:26,angle:0});
const stateOf=c=>{const t=c.getTransform();return {a:t.a,b:t.b,c:t.c,d:t.d,e:t.e,f:t.f,globalAlpha:c.globalAlpha,lineWidth:c.lineWidth};};
async function main(){
 const images={};
 for(const key of ['trap159MechanismsA','trap159SuppliesA'])images[key]=await loadImage(path.join(repo,T.ASSETS[key].url));
 const art={images,blit(ctx,key,rect,...dest){ctx.drawImage(images[key],...rect,...dest);return true;}};
 const rows=[];
 for(let i=0;i<kinds.length;i++){
  const kind=kinds[i],recipe=C.FortificationPackRules.mechanisms[kind],profile=T.PROFILES193[kind];
  const mechanism=freeze({kind,charges:recipe.charges,cooldown:0,caught:[]});
  const view=freeze({kind,phase:'armed',progress:0,motion:0,charges:recipe.charges,capacity:recipe.charges,cooldown:0,held:0});
  const supportView=freeze({phase:'idle',progress:0,motion:0});
  const supportOptions=freeze({variant:0,seed:0,reducedMotion:false,presentation:supportView});
  const options=freeze({variant:0,seed:0,reducedMotion:false,presentation:view});
  const before=JSON.stringify({owner,mechanism,view,supportView,options,supportOptions});
  const canvas=createCanvas(1024,1024),ctx=canvas.getContext('2d');
  ctx.translate(512,512);ctx.scale(24,24);
  const contextBefore=stateOf(ctx);
  let randomCalls=0;
  const oldRandom=Math.random,oldNext=C.Random?.prototype.next;
  Math.random=()=>{randomCalls++;throw Error('Canonical painter consumed Math.random');};
  if(oldNext)C.Random.prototype.next=function(){randomCalls++;throw Error('Canonical painter consumed game Random.next');};
  let supportDrawn,mechanismDrawn;
  try{
   supportDrawn=T.drawSpikes(ctx,art,owner,supportOptions);
   mechanismDrawn=T.drawMechanism(ctx,art,owner,mechanism,options);
  }finally{Math.random=oldRandom;if(oldNext)C.Random.prototype.next=oldNext;}
  assert.equal(supportDrawn,true);assert.equal(mechanismDrawn,true);assert.equal(randomCalls,0);
  assert.equal(JSON.stringify({owner,mechanism,view,supportView,options,supportOptions}),before);
  assert.deepEqual(stateOf(ctx),contextBefore);
  const raw=canvas.toBuffer('image/png'),preparedPath='references/canonical/'+kind+'-v0-armed-mounted.png';
  write(preparedPath,raw);
  const canonicalReference={path:path.join(prep,preparedPath),preparedPath,sha256:sha(raw),bytes:raw.length,width:1024,height:1024,canvasScale:24,pixelsPerMetre:32*24,centre:[512,512],nativeOwnerBounds:[-16,-16,16,16],nativeDrawingInterior:[-13,-13,13,13],owner,ownerFrame:frame,mechanism,presentation:view,supportPresentation:supportView,options,supportOptions,sourceUnmodified:true,nativeProceduralExtraction:true,generatedByImageGen:false,exportedEntryPoints:['DeadwallTrapArt159.drawSpikes','DeadwallTrapArt159.drawMechanism'],renderOrder:['Hérisson support base and hinged spike beam','mechanism base','mechanism mobile1','mechanism mobile2','specialized Canvas193 hardware'],uiOverlaysExcluded:['charge pips','outer status border','flash border'],nativeRendererClippingPreserved:true,rngCalls:randomCalls,immutableInputsUnchanged:true,canvasTransformAlphaAndLineWidthRestored:true,styleGettersAfterDraw:{strokeStyle:ctx.strokeStyle,fillStyle:ctx.fillStyle},canvasIsolation:'Each target uses a fresh canvas; style getters in the native backend retain the last hardware color after save/restore, so full style restoration is not claimed.'};
  rows.push({key:kind,kind,id:'mechanism:'+kind+':v0:armed-mounted',artId:'mechanism:'+kind+':v0:armed-mounted',label:recipe.name,file:filenames[i],variant:0,phase:'armed',motion:0,sourceRecipe:recipe,profile,nativeSpec:{supportKind:'spikes',supportLabel:ownerDefinition.name,footprintMetres:[1,1],supportNativeBounds:[32,32],drawingInteriorUnits:[26,26],heightMetres:null,heightReason:'No mechanism-specific authored height is declared; no height is inferred from generic building defaults.'},existingState:{dedicatedWholeMechanismBitmap:false,renderedBySharedArt159AndCanvas193:true,notMissingRendering:true,notMissingGameplay:true,animatedPartsAlreadyPresent:true},supportParts:T.partsFor('spikes',owner.id,{variant:0,seed:0}),mechanismParts:T.partsFor(kind,owner.id,{variant:0,seed:0}),geometryOwner:'src/core.js#CityGeometry202 and BUILDINGS.spikes',renderOwner:'src/trap-art159.js#drawSpikes + drawMechanism',stateOwner:'src/fortification-pack.js#mechanismPresentation, presentationFor, advanceVisuals',runtimeIntegration:false,replacesExistingAssets:false,canonicalReference});
 }
 write('source-evidence.json',{project:'DEADWALL',batch:'Art237',repository:'darknigthmare/deadwall-last-enclosure',sourceMain,sourceTree,checkout:repo,verifiedAt:new Date().toISOString(),sourceFiles:sources,rendererSourceIsUnmodified:true,simulationMutation:false,nativeRendering:{canvasPackage:'@napi-rs/canvas',canvasPackageVersion:require(path.join(repo,'node_modules/@napi-rs/canvas/package.json')).version,nodeVersion:process.version,installedFromRepositoryLockfile:true},priorAudit:'next-art233-audit/actors-and-equipment',priorAuditRevisionIsHistorical:true});
 write('canonical-receipts.json',{sourceMain,sourceTree,recipe:'One unchanged drawSpikes idle call followed by one unchanged drawMechanism armed call; no status/UI wrapper; fixed explicit variant 0; immutable fixture, no simulation step.',targets:rows});
 write('selection-base.json',{project:'DEADWALL — La Dernière Enceinte',batch:'Art237',sourceMain,sourceBase:sourceMain,sourceTree,scope:'Six dedicated static source-art proposals of existing specialized mechanism assemblies mounted on their existing Hérisson support; no missing gameplay or invisible-object claim, no runtime integration.',identityContract:'mechanism:<kind>:v0:armed-mounted; descriptive source-art key only, no runtime identifier reassignment',targets:rows});
 console.log(JSON.stringify({sourceMain,sourceTree,verifiedSources:sources.length,canonicalReferences:rows.map(r=>({key:r.key,sha256:r.canonicalReference.sha256,bytes:r.canonicalReference.bytes,drawn:true,rngCalls:0}))},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
