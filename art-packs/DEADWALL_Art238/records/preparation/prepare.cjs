'use strict';
// Source references only: this invokes unchanged exported game painters.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {createCanvas}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const repo=path.resolve(__dirname,'../deadwall-art236');
const base='12e0aa4aa77b9901bd53eb7a8771382a5f753593';
const Art=require(path.join(repo,'src/campaign-site-art205.js'));
const Residential=require(path.join(repo,'scripts/codex-residential2026.cjs'));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...args)=>cp.execFileSync('git',['-C',repo,...args],{maxBuffer:32*1024*1024});
if(git('rev-parse','HEAD').toString().trim()!==base)throw Error('Wrong source checkout');
const write=(rel,bytes)=>{const file=path.join(__dirname,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);return file;};
const json=(rel,value)=>write(rel,JSON.stringify(value,null,2)+'\n');
const paths=[
 'src/campaign-site-art205.js','src/codex-furnishings2026.js','src/interior-art153.js','src/seed-detail-art157.js',
 'src/world-props-art153.js','src/world-variants158.js','src/codex-layouts2026.js',
 'scripts/codex-residential2026.cjs','scripts/codex-world-foundations2026.cjs','docs/codex/suivi-monde2026/RESIDENTIEL_2026.md',
 'docs/GAME_BIBLE.md','assets/art153/props-yard.png','assets/art153/PROPS_PROVENANCE.json',
 'assets/art157/yard-atlas.png','assets/art157/PROVENANCE.json','assets/art158/details.png','assets/art158/PROVENANCE.json'
];
const sourceFiles=paths.map(repositoryPath=>{
 const data=git('show',base+':'+repositoryPath),preparedPath='references/repository/'+repositoryPath;
 write(preparedPath,data);
 return {path:preparedPath,preparedPath,repositoryPath,revision:base,gitBlob:git('rev-parse',base+':'+repositoryPath).toString().trim(),sha256:digest(data),bytes:data.length};
});
const rows=[
 {kind:'fence',number:1,suffix:'site-fence:north-left',label:'Segment de clôture en bois',slug:'cloture_bois',dims:[3,.15,1.2],canvas:[1280,1024],scale:320,style:'assets/art158/details.png',
  details:'A single extremely narrow HORIZONTAL timber boundary segment seen strictly from above. Preserve TWO long parallel wooden rails and exactly THREE short cross-posts at left, centre and right. The authored ground footprint is twenty times longer than its depth: it must remain a thin strip in the image, surrounded by ample transparency. Do not turn this plan into an upright fence facade, a gate, a broad ladder or a panel of vertical pickets. No diagonal brace, wire mesh, extra posts or pointed stakes.',
  analogue:'Art158 already has two generic fence images. This is a separate structural205 v0 source proposal for the exact 3 m authored segment, not evidence that fences have no images. The number of posts changes with source length; it does not cover every fence.'},
 {kind:'garden-shed',number:1,suffix:'parcel:0:shed',label:'Abri de jardin fermé',slug:'abri_jardin',dims:[3.4,3.3,2.4],canvas:[1280,1024],scale:220,style:'assets/art153/props-yard.png',
  details:'One closed compact garden shed, represented by its complete nearly square timber ROOF in overhead plan. Preserve the dark outer edge, muted pale perimeter trim, the central VERTICAL ridge and the five paired short plank seams on either side in the same arrangement as image 1. Keep the small dark entrance indication at the bottom centre as a narrow edge detail. No front-wall elevation, open roof, accessible interior, chimney, skylight, porch or attached object.',
  analogue:'Art153 already contains two generic shed pictures. The source here is the structural205 closed 3.4 by 3.3 m authored garden-shed footprint; no new accessible building or interior is claimed.'},
 {kind:'rain-barrel',number:1,suffix:'parcel:0:water-barrel',label:'Tonneau de pluie inactif',slug:'tonneau_pluie',dims:[.7,.7,1],canvas:[1024,1024],scale:1000,style:'assets/art153/props-yard.png',
  details:'One compact wooden rain barrel viewed exactly from above, showing its closed circular wooden top, dark annular inset and outer timber rim. Preserve exactly TWO transverse metal straps at the upper and lower source positions, ONE small dark bung hole in the upper-right portion of the lid, and the small dull rust-coloured outlet at the lower right. The source top is wooden, not an open blue water surface. No bucket, downpipe, faucet extension, water flow, splashes, active service or full-water indicator.',
  analogue:'Generic barrel and water-tank images already exist in Art153. This is the exact inactive structural205 rain-barrel v0; game-owned water214 overlays and quantities are not baked into the proposed image.'},
 {kind:'compost-bin',number:1,suffix:'parcel:0:compost',label:'Composteur de jardin',slug:'composteur_jardin',dims:[1,1,1],canvas:[1024,1024],scale:720,style:'assets/art157/yard-atlas.png',
  details:'One square low timber compost bin in overhead plan. Preserve its thick wooden perimeter, dark interior and FOUR horizontal timber members at the exact heights in image 1. Inside, preserve the NINE small source clusters in a three-by-three layout as irregular dry leaves and twig scraps in muted brown and olive. Treat the small flat source marks as natural organic matter, not painted ovals or fresh planted crops. No shovel, sack, lid, tall legs, insects, steam, loose ground pile or extra stock.',
  analogue:'Art157 already has two generic compost images. This proposal follows the specific structural205 v0 four-member, nine-cluster arrangement. The fixed matter is decorative source content, not collectible or newly produced compost.'},
 {kind:'closed-pool',number:21,suffix:'communal-pool',label:'Bassin extérieur fermé au public',slug:'bassin_ferme',dims:[8,12,.4],canvas:[1024,1280],scale:60,style:'assets/art157/yard-atlas.png',
  details:'One long rectangular neglected outdoor swimming basin viewed strictly from above, long axis VERTICAL. Closed means unattended and closed to use; the water remains visible, with NO pool cover or roof. Preserve the nested rectangular dark outer edge, pale stone/tile coping and still murky blue-green water. Keep the single fixed THREE-RUNG metal ladder attached at the RIGHT long edge in the upper half, at the exact canonical location, and the FIVE modest dull olive floating-residue patches in the same positions as image 1. Render water and residue naturally, without literal painted ellipses. Include only the source-defined coping; no surrounding terrace, lawn, fence, furniture, people, swimmers, diving board, powered pump, ripples of activity, depth markings or potable-water symbol.',
  analogue:'Art157 already has two generic pool images. This is the 8 by 12 m structural205 basin from authored layout V21, rendered with painter variant0. Layout V21 and painter variant0 are different axes; this does not cover every pool variant or create a new gameplay water reserve.'}
];
const targets=[],renders=[];
for(const row of rows){
 const type='EXT-MONDE-T045',plan=Residential.build(type,row.number),sourceId=plan.id+':'+row.suffix;
 const source=plan.structures.find(o=>o.id===sourceId);
 if(!source||source.kind!==row.kind||[source.w,source.h,source.maxHeightM].some((x,i)=>x!==row.dims[i]))throw Error('Unexpected source fixture '+row.kind);
 const fixture={...source,x:0,y:0,z:0,rotationRad:0,campaign205:true,campaign205Structural:true};
 const before=JSON.stringify(fixture),canvas=createCanvas(...row.canvas),ctx=canvas.getContext('2d');
 const origin={x:(row.canvas[0]-source.w*row.scale)/2,y:(row.canvas[1]-source.h*row.scale)/2};
 ctx.translate(origin.x,origin.y);ctx.scale(row.scale,row.scale);
 const options={seed:0,floor:0,variant:0,stateAlpha:false,scale:row.scale};
 const ok=Art.drawProp(ctx,null,fixture,options);
 if(!ok||JSON.stringify(fixture)!==before||Art.routeFor(row.kind)!=='structural205')throw Error('Bad source render '+row.kind);
 const canonicalRel='references/canonical/'+row.kind+'_v0.png',canonicalPath=write(canonicalRel,canvas.toBuffer('image/png'));
 const styleRel='references/repository/'+row.style,stylePath=path.join(__dirname,styleRel);
 const prompt=`Use case: stylized-concept. Asset type: original DEADWALL game source sprite, one complete isolated ${row.label}.\nINPUTS: Image 1 is the authoritative geometry/layout reference, rendered by the unchanged structural205 game painter for this exact authored source, painter variant0. Image 2 is MATERIAL AND PAINTERLY STYLE ONLY from the original game atlas; do not copy its camera angle, neighbouring sprites, grid or background.\nCAMERA: strict orthographic overhead plan, camera looking vertically down. Keep source X horizontal and source Y down the image; retain the canonical silhouette, aspect ratio, orientation, number of parts and relative positions. Do not make a tilted isometric object or expose a tall facade.\nSUBJECT AND PARTS: ${row.details}\nDESIGN ENVELOPE: ${source.w} m across X by ${source.h} m along Y; separate author-defined height ${source.maxHeightM} m${source.depthM?'; basin depth '+source.depthM+' m':''}. These are author-design dimensions, not manufacturer measurements. Preserve the proportional source footprint rather than filling the canvas with a different-shaped object.\nMATERIALS: serious grounded post-apocalyptic game, detailed restrained hand-painted pre-rendered look; aged wood, dull steel, worn stone and weathered muted olive/brown/grey as the source requires. Natural fine grain, small scuffs, modest corrosion and soft neutral overhead lighting. Readable major components at game scale, idle and unattended. No exaggerated destruction or invented decoration.\nOUTPUT: ONE whole object only, true transparent RGBA background. Centre the complete silhouette with at least 12 percent transparent margin on every side; never cut thin components. No ground plane or cast shadow outside the object, no landscape, scene, frame, lettering, dimensions, logo, UI or watermark. No extra detached tools, people, animals or active effects. This is a source-art proposal for later calibration, not a claim of metric or pixel-for-pixel certification.`;
 targets.push({key:row.kind,kind:row.kind,id:'prop:'+row.kind+':v0',artId:'prop:'+row.kind+':v0',label:row.label,file:row.kind+'_'+row.slug+'.png',sourceId,sourcePlanId:plan.id,sourceType:type,sourceObject:source,dimensions:{w:source.w,h:source.h,heightM:source.maxHeightM,...(source.depthM?{depthM:source.depthM}:{}),units:'metres',authority:'author-design'},route:'structural205',canonicalVariant:0,existingAnalogue:row.analogue,prompt,referenceImages:[canonicalPath,stylePath],referenceFiles:[{path:canonicalPath,relativePath:canonicalRel,sha256:digest(fs.readFileSync(canonicalPath)),role:'canonical-geometry'},{path:stylePath,relativePath:styleRel,sha256:digest(fs.readFileSync(stylePath)),role:'materials-only'}],generator:'OpenAI built-in ImageGen',transparentBackgroundRequested:true,promptIsVerbatim:true});
 renders.push({key:row.kind,id:'prop:'+row.kind+':v0',sourcePlanId:plan.id,sourceObject:source,fixture,options,gameArgumentOmitted:true,artArgument:null,exportedApi:'drawProp',privateDelegatedFunction:'drawPropBase',canvas:{width:row.canvas[0],height:row.canvas[1],pixelsPerMetre:row.scale,origin},route:'structural205',rendered:true,fixtureUnchanged:true,file:canonicalRel,sha256:digest(fs.readFileSync(canonicalPath))});
}
json('selection-and-prompts.json',{project:'DEADWALL — Last Enclosure',pack:'Art238',sourceMain:base,identityContract:'Existing structural205 prop kind and painter v0; source-only proposals. Existing analogous images are documented, not claimed absent.',sourceFiles,targets});
json('canonical-render-receipt.json',{sourceRevision:base,renderer:'unchanged exported campaign-site-art205.drawProp',canonicalVariant:0,stateAlpha:false,servicesAndWaterOverlays:'inactive: no game argument',imagesEdited:false,targets:renders});
json('references/sources.json',sourceFiles);
json('existing-analogues.json',targets.map(t=>({id:t.id,kind:t.kind,existingRoute:t.route,explanation:t.existingAnalogue,bitmapDedicatedToThisAuthoredFixtureFound:false})));
console.log(JSON.stringify({sourceMain:base,targets:targets.map(t=>({key:t.key,id:t.id,sourceId:t.sourceId})),sourceFiles:sourceFiles.length,prep:__dirname}));
