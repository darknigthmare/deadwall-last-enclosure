'use strict';
// Renders unmodified game code. It does not alter generated pixels or game files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {createCanvas}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const repo=path.resolve(__dirname,'../deadwall-art233');
const base='f3ba02a5b73a55120c02c21d5703902ea3e901d9';
const Art=require(path.join(repo,'src/campaign-site-art205.js'));
const Residential=require(path.join(repo,'scripts/codex-residential2026.cjs'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(rel,data)=>{const p=path.join(__dirname,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,data);return p;};
const json=(rel,value)=>write(rel,JSON.stringify(value,null,2)+'\n');
const sourceFiles=[];
for(const repositoryPath of ['src/campaign-site-art205.js','src/codex-furnishings2026.js','src/interior-art153.js','src/seed-detail-art157.js','src/world-props-art153.js','src/codex-layouts2026.js','scripts/codex-residential2026.cjs','scripts/codex-world-foundations2026.cjs','docs/codex/suivi-monde2026/RESIDENTIEL_2026.md','assets/art152/vehicles-atlas.png','assets/art152/PROVENANCE_VEHICLES.json']){
  const bytes=cp.execFileSync('git',['-C',repo,'show',base+':'+repositoryPath],{maxBuffer:32*1024*1024});
  const rel='references/repository/'+repositoryPath;
  write(rel,bytes);
  sourceFiles.push({path:rel,repositoryPath,revision:base,gitBlob:cp.execFileSync('git',['-C',repo,'rev-parse',base+':'+repositoryPath],{encoding:'utf8'}).trim(),sha256:hash(bytes),bytes:bytes.length});
}
const targets=[],renders=[];
for(const [kind,type,label,file] of [
 ['touring-caravan','EXT-MONDE-T046','Caravane tractable fermée','touring-caravan_caravane_tractable.png'],
 ['abandoned-caravan','EXT-MONDE-T048','Caravane abandonnée fermée','abandoned-caravan_caravane_abandonnee.png']
]){
  const plan=Residential.build(type,1),sourceId=type+'-V01:parcel:1:caravan',source=plan.structures.find(o=>o.id===sourceId);
  if(!source||source.kind!==kind||source.w!==2.4||source.h!==6.2||source.maxHeightM!==2.8)throw Error('Unexpected caravan source fixture');
  const fixture={...source,x:0,y:0,z:0,rotationRad:0,campaign205:true,campaign205Structural:true};
  const canvas=createCanvas(640,1280),ctx=canvas.getContext('2d'),scale=160,origin={x:128,y:144};
  ctx.translate(origin.x,origin.y);ctx.scale(scale,scale);
  const options={seed:0,floor:0,variant:0,stateAlpha:false,scale};
  const drawn=Art.drawProp(ctx,null,fixture,options);
  if(!drawn||Art.routeFor(kind)!=='structural205')throw Error('Canonical drawProp failed');
  const refRel='references/canonical/'+kind+'_v0.png';
  const refPath=write(refRel,canvas.toBuffer('image/png'));
  const stylePath=path.join(__dirname,'references/repository/assets/art152/vehicles-atlas.png');
  const condition=kind==='abandoned-caravan'?'Abandoned, evacuated version: keep the closed intact shell, dull grey-green metal and several localized rust streaks and shallow zigzag cracks as in image 1. No missing roof, gaping interior or large destroyed section.':'Unoccupied touring version: closed intact shell in faded cream and muted sage paint, modest age, grime and light wear. No severe ruin or open interior.';
  const prompt=`Use case: stylized-concept. Asset type: original DEADWALL source-art sprite of ONE isolated towable caravan, true RGBA transparency.\nInput image 1 is the AUTHORITATIVE CANONICAL GEOMETRY REFERENCE rendered from the unchanged game drawProp, structural205, variant 0. Input image 2 is MATERIAL AND PAINTING STYLE ONLY from the game's original vehicle atlas. Preserve reference 1's silhouette, internal top-view layout and orientation. Do not copy any car, van, motorcycle, multi-object arrangement or background from reference 2.\nCamera: strictly orthographic bird's-eye directly overhead, 90 degrees elevation. The long axis is VERTICAL on the canvas, with the short tow hitch pointing straight UP toward negative screen Y. No diagonal or isometric rotation, no side-view facade, no perspective convergence. Refine the flat source forms with subtle bevels, believable painted metal and carefully painted surface texture while keeping this overhead plan.\nSubject: one long narrow generic caravan with a chamfered rounded rectangular body, closed roof and closed body. A short centered hitch protrudes from the TOP end. Exactly FOUR modest rubber wheels, two on each long side, at TWO widely separated longitudinal positions matching reference 1 (approximately 0.33 and 0.72 of the reference local Y length). Do not substitute a close tandem axle or the ordinary two-wheel trailer stereotype. Keep the middle small rectangular roof panel in the UPPER half and a dark rectangular glazed hatch in the LOWER half, their source positions unchanged. Two slim parallel longitudinal dark roof-edge seams. No extra roof box, solar panel, air conditioner, aerial, ladder, spare wheel, open door or extra detached accessory.\n${condition}\nAuthor-design envelope for this exact V01 source instance: footprint 2.4 metres across screen X by 6.2 metres along screen Y; height envelope 2.8 metres. These are game author-design dimensions, not manufacturer measurements. Keep the same narrow portrait aspect ratio as reference 1. The body takes only the source interior portion of this bounding footprint; do not widen it to fill a square.\nStyle: grounded post-apocalyptic game art, detailed hand-painted pre-rendered appearance, muted cream, sage, gray-green metal, restrained dull rust, tire rubber, small worn edges, soft overhead lighting. No cast ground-shadow plane. Center the complete silhouette with at least 10 percent empty transparent margin on all sides. Preserve every wheel and the hitch inside the canvas.\nNo people, animals, zombies, landscape, grass, gravel, floor, terrain slab, colored background, gradient, text, digits, logos, labels, license plate lettering, watermarks, UI or border. This is one source-art proposal for later calibration, not a certified metric replacement or a newly accessible gameplay interior.`;
  targets.push({key:kind,kind,id:'prop:'+kind+':v0',artId:'prop:'+kind+':v0',label,file,sourceId,sourcePlanId:plan.id,sourceType:type,sourceObject:source,dimensions:{w:source.w,h:source.h,heightM:source.maxHeightM,units:'metres',authority:'author-design'},route:'structural205',canonicalVariant:0,orientation:{longAxis:'Y',hitch:'negative-Y',rotationRad:0},prompt,referenceImages:[refPath,stylePath],referenceFiles:[{path:refPath,relativePath:refRel,sha256:hash(fs.readFileSync(refPath)),role:'canonical-geometry'},{path:stylePath,relativePath:'references/repository/assets/art152/vehicles-atlas.png',sha256:hash(fs.readFileSync(stylePath)),role:'materials-only'}],generator:'OpenAI built-in ImageGen',transparentBackgroundRequested:true,promptIsVerbatim:true});
  renders.push({key:kind,sourcePlanId:plan.id,sourceObject:source,fixture,options,gameArgumentOmitted:true,artArgument:null,exportedApi:'drawProp',privateDelegatedFunction:'drawPropBase',canvas:{width:640,height:1280,pixelsPerMetre:scale,origin},route:Art.routeFor(kind),rendered:true,file:refRel,sha256:hash(fs.readFileSync(refPath))});
}
json('selection-and-prompts.json',{project:'DeadWall',pack:'Art235',sourceMain:base,identityContract:'prop:<kind>:v0; source art only; no runtime integration or new accessible caravan interior',sourceFiles,targets});
json('canonical-render-receipt.json',{base,renderer:'unchanged exported campaign-site-art205.drawProp',canonicalVariant:0,stateAlpha:false,servicesAndWaterOverlays:'inactive: no game passed',imagesEdited:false,targets:renders});
json('references/sources.json',sourceFiles);
console.log(JSON.stringify({targets:targets.map(t=>t.key),sourceFiles:sourceFiles.length,prep:__dirname}));
