'use strict';
// Source references only. No private painter extraction and no generated-pixel edits.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../deadwall-art236');
const sourceMain='12e0aa4aa77b9901bd53eb7a8771382a5f753593';
const sourceCheckoutHead='e728993ee81f50b1bcc241ffe9503304a19e6ae0';
const sourcePublishedHead='6ebd6707251e675a5b75ded23e91dd28339dfe38';
const sourceTree='33d089eab2bb23f288e66d57c2794f6a38b3ba84';
const git=(...args)=>cp.execFileSync('git',['-C',repo,...args],{maxBuffer:32*1024*1024});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(rel,bytes)=>{const p=path.join(__dirname,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes);return p;};
const json=(rel,value)=>write(rel,JSON.stringify(value,null,2)+'\n');
if(fs.existsSync(path.join(__dirname,'results.json')))throw Error('Preparation is frozen after generation starts');
if(git('rev-parse','HEAD').toString().trim()!==sourceCheckoutHead||git('rev-parse','HEAD^{tree}').toString().trim()!==sourceTree)throw Error('Unexpected checkout head/tree');
if(git('status','--porcelain').length)throw Error('Source checkout is not clean');
const {createCanvas}=require(path.join(repo,'node_modules/@napi-rs/canvas'));
const Art=require(path.join(repo,'src/campaign-site-art205.js'));
const Residential=require(path.join(repo,'scripts/codex-residential2026.cjs'));
const oldRoot='art-packs/DEADWALL_Art235';
const sourcePaths=[
 'AGENTS.md','docs/ORIGINAL_BRIEF.txt','docs/GAME_DESIGN.md','docs/ARCHITECTURE.md','docs/BALANCING.md',
 'docs/CODEX_MASTER_PROMPT.md','docs/GAMEDEV_GUIDANCE.md','docs/GAME_BIBLE.md',
 'src/campaign-site-art205.js','src/codex-furnishings2026.js','src/interior-art153.js',
 'src/seed-detail-art157.js','src/world-props-art153.js','src/codex-layouts2026.js',
 'scripts/codex-residential2026.cjs','scripts/codex-world-foundations2026.cjs',
 'docs/codex/suivi-monde2026/RESIDENTIEL_2026.md',
 oldRoot+'/assets/art235/props/touring-caravan_caravane_tractable.png',
 oldRoot+'/assets/art235/props/abandoned-caravan_caravane_abandonnee.png',
 oldRoot+'/PROVENANCE.json',oldRoot+'/qa/visual-review-records.json',oldRoot+'/SHA256SUMS.txt',
 oldRoot+'/records/preparation/selection-and-prompts.json'
];
const sourceFiles=sourcePaths.map(repositoryPath=>{
 const data=git('show',sourceMain+':'+repositoryPath),working=fs.readFileSync(path.join(repo,repositoryPath));
 if(!data.equals(working)||!data.equals(git('show',sourceCheckoutHead+':'+repositoryPath)))throw Error('Source differs from main '+repositoryPath);
 const preparedPath='references/repository/'+repositoryPath;write(preparedPath,data);
 return {path:preparedPath,preparedPath,repositoryPath,revision:sourceMain,checkoutRevision:sourceCheckoutHead,gitBlob:git('rev-parse',sourceMain+':'+repositoryPath).toString().trim(),sha256:hash(data),bytes:data.length,workingAndCheckoutMatchMain:true};
});
const rows=[
 {kind:'touring-caravan',type:'EXT-MONDE-T046',label:'Caravane tractable fermée et inoccupée',styleFile:'touring-caravan_caravane_tractable.png',condition:'Unoccupied touring caravan. Keep the complete closed shell, modest age and light grime; no severe ruin, inhabitants or signs of occupation. Use the pale desaturated cream/blue-grey palette in canonical variant 1, or the pale cream/tan/olive palette in canonical variant 2. The old v0 reference supplies weathered painted-metal rendering only.'},
 {kind:'abandoned-caravan',type:'EXT-MONDE-T048',label:'Caravane abandonnée fermée et évacuée',styleFile:'abandoned-caravan_caravane_abandonnee.png',condition:'Abandoned and evacuated caravan. Retain the closed complete shell with source-defined shallow zigzag cracks and localized dull rust streaks in the same positions as image 1. Muted grey-blue metal in variant 1 or grey-olive metal in variant 2. No roof collapse, holes into a visible interior, missing wheels, wreckage, occupants or active light.'}
];
const targets=[],renders=[],plans=[];
for(const row of rows){
 const plan=Residential.build(row.type,1),sourceId=plan.id+':parcel:1:caravan',source=plan.structures.find(o=>o.id===sourceId);
 if(!source||source.kind!==row.kind||source.w!==2.4||source.h!==6.2||source.maxHeightM!==2.8||source.lootAssigned!==false||source.utilityConnected!==false||source.interiorStatus!=='closed-towable-interior-not-built')throw Error('Unexpected authored source '+row.kind);
 const planBytes=Buffer.from(JSON.stringify(plan,null,2)+'\n'),planFile='references/authored-plans/'+plan.id+'.json';write(planFile,planBytes);
 plans.push({sourceType:row.type,sourcePlanVariant:1,sourcePlanId:plan.id,sourceId,file:planFile,sha256:hash(planBytes),bytes:planBytes.length,sourceObject:source,exportedApi:'Residential.build(type,1)'});
 for(const variant of [1,2]){
  const key=row.kind+':v'+variant,file=row.kind+'_v'+variant+'.png';
  const fixture={...source,x:0,y:0,z:0,rotationRad:0,campaign205:true,campaign205Structural:true},before=JSON.stringify(fixture);
  const width=640,height=1280,scale=160,origin={x:128,y:144},canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
  ctx.translate(origin.x,origin.y);ctx.scale(scale,scale);
  const options={seed:0,floor:0,variant,stateAlpha:false,scale};
  const painted=Art.drawProp(ctx,null,fixture,options);
  if(!painted||before!==JSON.stringify(fixture)||Art.routeFor(row.kind)!=='structural205'||Art.variantFor(fixture,options)!==variant)throw Error('Canonical draw failed '+key);
  const canonicalRel='references/canonical/'+row.kind+'_v'+variant+'.png',canonicalPath=write(canonicalRel,canvas.toBuffer('image/png'));
  const styleRel='references/repository/'+oldRoot+'/assets/art235/props/'+row.styleFile,stylePath=path.join(__dirname,styleRel);
  const variantDetails=variant===1?
   'VARIANT 1 ROOF: exactly TWO small closed metal roof panels in a vertical sequence, one near the upper quarter and one near the lower third. Preserve the larger central rectangular dark seam/frame that spans between and partly around them, including its two slim longitudinal inset highlights. Follow image 1 for overlap and positions. These are shallow CLOSED roof details, not windows into rooms and not rooftop cargo. Do not retain the v0 single-panel/dark-hatch arrangement from the style image.':
   'VARIANT 2 ROOF: exactly ONE broad shallow closed rectangular metal roof panel in the upper-middle region, ONE small warm-weathered WOODEN rectangular patch in the lower-right roof region with its single diagonal seam, and ONE thin longitudinal metal strip just LEFT of centre, extending from the upper region towards the lower middle. Preserve their exact relative locations and overlaps from image 1. This is a small fixed source-defined patch, not loose planks or roof cargo. Do not retain the v0 single-panel/dark-hatch arrangement from the style image.';
  const prompt=`Use case: stylized-concept. Asset type: original DEADWALL game source-art sprite of ONE complete isolated ${row.kind}, painter variant ${variant}.\nINPUT IMAGES: Image 1 is the AUTHORITATIVE canonical geometry and palette, rendered by the unchanged public campaign-site-art205.drawProp API for this exact authored instance, painter variant ${variant}. Image 2 is the already accepted Art235 variant 0 for MATERIAL TEXTURE AND PAINTERLY STYLE ONLY; ignore its v0 roof fittings and follow image 1 for all variant-specific parts.\nCAMERA AND SILHOUETTE: strict orthographic overhead plan, camera looking vertically down. Long axis vertical, short tow hitch pointing straight UP to negative screen Y, no diagonal turn, perspective or visible tall side facade. Preserve the narrow chamfered rectangular closed body, dark outer contour and two longitudinal roof-edge seams. The authored source footprint is 2.4 m across X by 6.2 m along Y, with a separate height envelope of 2.8 m; these are author-design values, not manufacturer dimensions. Retain the source proportions.\nWHEELS AND HITCH: exactly FOUR small visible rubber wheels, two at each side, at TWO widely separated longitudinal stations (roughly one-third and three-quarters down the canonical footprint). Preserve this source geometry, not an ordinary close tandem axle. Keep the short centered tow tongue and transverse tip completely visible at the top.\n${variantDetails}\nCONDITION: ${row.condition} Both roof and body remain closed; the source instance has no authored accessible interior, no loot assignment and no utility connection. These decorative source images must not imply a new service, stock, electrical operation or gameplay state.\nSTYLE: detailed restrained hand-painted pre-rendered post-apocalyptic game art matching image 2, with believable worn painted metal, rubber, shallow bevels, modest fine grain and neutral overhead lighting. No photo background, dramatic lighting or exaggerated distress. Preserve image 1's variant colour family rather than forcing the v0 palette.\nOUTPUT: ONE object only, whole and centred, true transparent RGBA background with at least 12 percent empty margin on all sides. Every wheel and the tow hitch must stay inside the image. No ground plane or external cast shadow. No people, animals, plants, ground debris, extra accessories, awning, solar panel, aerial, chimney, ladder, air-conditioning box, spare wheel, open door, exposed interior, readable text, logo, labels, numbers, border or watermark. No active effects. Source-art proposal for later calibration; not a metric or pixel-for-pixel certification.`;
  const referenceFiles=[{path:canonicalPath,relativePath:canonicalRel,sha256:hash(fs.readFileSync(canonicalPath)),role:'canonical-geometry-and-variant-palette'},{path:stylePath,relativePath:styleRel,sha256:hash(fs.readFileSync(stylePath)),role:'Art235-v0-material-texture-and-style-only'}];
  targets.push({key,kind:row.kind,id:'prop:'+row.kind+':v'+variant,artId:'prop:'+row.kind+':v'+variant,label:row.label+' — variante '+variant,file,sourceId,sourcePlanId:plan.id,sourceType:row.type,sourcePlanVariant:1,sourceObject:source,dimensions:{w:source.w,h:source.h,heightM:source.maxHeightM,units:'metres',authority:'author-design'},route:'structural205',canonicalVariant:variant,painterVariant:variant,orientation:{longAxis:'Y',hitch:'negative-Y',rotationRad:0},existingAnalogue:'Art235 already supplies accepted v0 for this same family and authored instance; this is an optional existing painter variant, not a new family or a runtime replacement.',prompt,referenceImages:referenceFiles.map(f=>f.path),referenceFiles,generator:'OpenAI built-in ImageGen',transparentBackgroundRequested:true,promptIsVerbatim:true});
  renders.push({key,kind:row.kind,id:'prop:'+row.kind+':v'+variant,sourcePlanId:plan.id,sourcePlanVariant:1,sourceObject:source,fixture,options,gameArgumentOmitted:true,artArgument:null,exportedApi:'drawProp',privateDelegatedFunction:'drawPropBase',canvas:{width,height,pixelsPerMetre:scale,origin},route:'structural205',canonicalVariant:variant,painterVariant:variant,rendered:true,fixtureUnchanged:true,file:canonicalRel,sha256:hash(fs.readFileSync(canonicalPath))});
 }
}
json('selection-and-prompts.json',{project:'DEADWALL — Last Enclosure',pack:'Art241',sourceMain,sourceCheckoutHead,sourcePublishedHead,sourceTree,identityContract:'key kind:vN; id/artId prop:kind:vN; native kind unchanged. Two existing prop families, four existing painter variants. No new runtime identity or accessible caravan interior.',sourceFiles,targets});
json('canonical-render-receipt.json',{sourceRevision:sourceMain,sourceCheckoutHead,sourcePublishedHead,sourceTree,renderer:'unchanged exported campaign-site-art205.drawProp',canvasPackage:require(path.join(repo,'node_modules/@napi-rs/canvas/package.json')).version,stateAlpha:false,servicesAndWaterOverlays:'inactive: no game argument',imagesEdited:false,targets:renders});
json('source-plans.json',{sourceRevision:sourceMain,sourcePlanVariantIsDistinctFromPainterVariant:true,plans});
json('references/sources.json',sourceFiles);
json('existing-analogues.json',targets.map(t=>({key:t.key,id:t.id,kind:t.kind,painterVariant:t.painterVariant,existingRoute:t.route,explanation:t.existingAnalogue,priorFinal:t.referenceFiles[1]})));
console.log(JSON.stringify({pack:'Art241',sourceMain,sourceCheckoutHead,sourceTree,sourceFiles:sourceFiles.length,keys:targets.map(t=>t.key),canonicalSha256:renders.map(t=>({key:t.key,sha256:t.sha256}))}));
