'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const base=__dirname;
const repo=path.resolve(base,'../deadwall-art236');
const revision='12e0aa4aa77b9901bd53eb7a8771382a5f753593';
const tree='663ad5750e49ae401fc0b46bfdebc28942ad1617';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...args)=>cp.execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
const writeJSON=(file,v)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(v,null,2)+'\n');};
if(git('rev-parse','HEAD')!==revision||git('rev-parse','HEAD^{tree}')!==tree)throw Error('Unexpected source checkout');
const sourcePaths=[
 'src/succession133.js','src/art.js','src/core.js','src/game.js','src/actor-presentation.js','src/hero-actions133.js',
 'assets/art137/survivor-prone.png','assets/commander-rig130.png','assets/commander-rig130.json','assets/hero-actions133.png',
 'docs/SUCCESSION_1_33.md','docs/VISUEL_1_37.md','assets/art137/PROMPTS.md',
 'AGENTS.md','docs/ORIGINAL_BRIEF.txt','docs/GAME_DESIGN.md','docs/ARCHITECTURE.md','docs/BALANCING.md',
 'docs/CODEX_MASTER_PROMPT.md','docs/GAMEDEV_GUIDANCE.md','docs/GAME_BIBLE.md',
 'tests/helpers/expansions131.cjs','tests/helpers/navigation130.cjs','tests/succession133.test.cjs'
];
const sources=sourcePaths.map(sourcePath=>{
 const blob=git('rev-parse',revision+':'+sourcePath);
 const original=fs.readFileSync(path.join(repo,sourcePath));
 const committed=cp.execFileSync('git',['-C',repo,'show',revision+':'+sourcePath],{maxBuffer:20*1024*1024});
 if(!original.equals(committed))throw Error('Working file differs from source commit: '+sourcePath);
 const archivedPath=path.join('references','repository',sourcePath);
 const dest=path.join(base,archivedPath);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(repo,sourcePath),dest);
 return{sourcePath,sourceRevision:revision,gitBlob:blob,sha256:sha(original),bytes:original.length,archivedPath};
});
writeJSON(path.join(base,'references/sources.json'),{sourceRepository:'DEADWALL',sourceRevision:revision,sourceTree:tree,sources});
const auditSource=path.resolve(base,'../publication-art233-235/fallen-survivor-scope-audit.json');
const auditArchive=path.join(base,'references/fallen-survivor-scope-audit.json');
fs.copyFileSync(auditSource,auditArchive);
const fixturePath=path.join(repo,'tests/helpers/expansions131.cjs');
const {boot131}=require(fixturePath);
const {g}=boot131({seed:'17117'});
require(path.join(repo,'src/succession133.js')).install(g);
g.player.facing=0;g.player.invulnerable=0;
g.damagePlayer(1000);
const remains=g.succession133.remains();
const r=remains.at(-1);
if(!r||r.body.phase==='risen')throw Error('Expected inert remains after existing death transition');
if(r.point.angle!==0)throw Error('Expected angle zero');
if(typeof g.art?.drawFallen133==='function')throw Error('A runtime sprite hook exists, refusing to label fallback canonical');
const before=g.serialize(),beforeTimestamp=before.timestamp;delete before.timestamp;
const stateBefore=JSON.stringify(before);
const {createCanvas}=require(path.join(repo,'node_modules/@napi-rs/canvas'));
const canvas=createCanvas(1536,1024),ctx=canvas.getContext('2d');
const entries=g.succession133.depthEntries('local',null,{l:r.body.x-512,r:r.body.x+512,t:r.body.y-512,b:r.body.y+512});
const entry=entries.find(e=>e.id==='fallen:'+r.id+':body');
if(!entry)throw Error('Body entry not exposed');
const originPx={x:866.56,y:501.44},outerScale=22;
ctx.translate(originPx.x,originPx.y);ctx.scale(outerScale,outerScale);ctx.translate(-r.body.x,-r.body.y);
entry.draw(ctx);
const after=g.serialize(),afterTimestamp=after.timestamp;delete after.timestamp;
const stateAfter=JSON.stringify(after);
if(stateBefore!==stateAfter){
 const differences=[];
 function diff(a,b,p=''){if(JSON.stringify(a)===JSON.stringify(b))return;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[k],b[k],p+'/'+k);}else differences.push({path:p,before:a,after:b});}
 diff(JSON.parse(stateBefore),JSON.parse(stateAfter));
 console.log(JSON.stringify({serializationDifferences:differences}));
 throw Error('Serialized state differs; inspect before accepting render');
}
const canonicalPath=path.join(base,'references/canonical/survivor-inert-angle0.png');
fs.mkdirSync(path.dirname(canonicalPath),{recursive:true});
const png=canvas.toBuffer('image/png');fs.writeFileSync(canonicalPath,png);
writeJSON(path.join(base,'canonical-render-receipt.json'),{
 schemaVersion:1,sourceRevision:revision,sourceTree:tree,createdAt:new Date().toISOString(),
 entryPoint:'g.succession133.depthEntries(local, null, view).find(entry.id === fallen:<id>:body).draw(ctx)',
 fallbackSourcePath:'src/succession133.js',fallbackSourceSha256:sources.find(s=>s.sourcePath==='src/succession133.js').sha256,
 seed:'17117',fixture:'tests/helpers/expansions131.cjs:boot131',fixtureDeathTransition:'g.player.facing=0; g.player.invulnerable=0; g.damagePlayer(1000)',
 fixtureRemainsId:r.id,phase:r.body.phase,angleRadians:r.point.angle,domain:'local',
 canvas:{width:1536,height:1024,format:'PNG',background:'transparent',renderer:'@napi-rs/canvas',rendererVersion:require(path.join(repo,'node_modules/@napi-rs/canvas/package.json')).version,readOnlyNativeRender:true},
 transform:{outerTranslationPx:originPx,outerScale,removeWorldBodyTranslation:{x:-r.body.x,y:-r.body.y},runtimeLocalScale:32,combinedPixelsPerNormalizedUnit:704},
 axes:{x:'right',y:'down',angleZero:'head right, boots left',positiveRotation:'clockwise in Canvas pixel coordinates',bodyOrigin:'r.body.x/y; schematic torso origin, not live prone head anchor'},
 canonicalBodyGeometry:{head:[0.39,0],upperArm:[[0.13,-0.13],[0.04,-0.34],[-0.21,-0.36]],lowerArm:[[0.1,0.14],[-0.06,0.3],[-0.27,0.22]],schematicBodyBounds:[-0.84,-0.42,0.56,0.36]},
 stateBeforeSha256:sha(stateBefore),stateAfterSha256:sha(stateAfter),serializedGameStateUnchanged:true,
 serializationComparison:{excludedFields:['timestamp'],reason:'src/game.js serialize emits a fresh Date.now() timestamp on each call. Only this metadata field is excluded; all game-state fields are compared verbatim.',beforeTimestamp,afterTimestamp},
 canonicalImage:{path:path.relative(base,canonicalPath),sha256:sha(png),bytes:png.length},
 fullFallbackPreserved:true,
 groundMark:'The original unchanged fallback includes a translucent dark-red ellipse. It is retained in this canonical reference. The new source sprite is body-only and deliberately excludes ground, blood and this ellipse. No fallback, renderer or runtime ownership is modified.',
 metricLimits:'Schematic Canvas geometry is not a metric/anatomical measurement or a certified runtime raster pivot. The generated anatomy may interpret it while preserving the visible orientation and limb arrangement.',
 audit:{path:path.relative(base,auditArchive),sha256:sha(fs.readFileSync(auditArchive)),boundedFinding:'Visible Canvas fallback exists; no specific inert shared-survivor raster identified. Existing Art137 prone is living and includes an olive backpack.'}
});
console.log(JSON.stringify({sourceRevision:revision,sources:sources.length,canonicalPath,canonicalSha256:sha(png),phase:r.body.phase,serializedGameStateUnchanged:true}));
