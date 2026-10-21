/* Original building silhouettes selected from stable world identity, never simulation RNG. */
(function(root,factory){
 'use strict';const api=factory(root);root.DeadwallBuildingVariants157=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const freeze=value=>{for(const child of Object.values(value))if(child&&typeof child==='object')freeze(child);return Object.freeze(value);};
 const ASSETS=freeze({
  d17Buildings157:{url:'assets/art157/d17-buildings-atlas.png',width:1536,height:1024,matte:'none'},
  d17Alternates157A:{url:'assets/art157/d17-alternates-a.png',width:1536,height:1024,matte:'none'},
  d17Alternates157B:{url:'assets/art157/d17-alternates-b.png',width:1536,height:1024,matte:'none'},
  d17Apartment157:{url:'assets/art157/d17-apartment.png',width:1254,height:1254,matte:'none'}
 });
 // Measured full alpha cuts. Chimneys and equipment cross nominal row boundaries.
 const cuts={
  house:[[57,30,306,234],[430,30,311,233],[806,42,318,227],[1180,33,317,239]],
  warehouse:[[43,280,328,220],[413,277,337,227],[791,287,346,227],[1179,277,327,242]],
  workshop:[[37,523,340,226],[416,511,337,236],[792,521,343,230],[1175,528,329,222]],
  clinic:[[39,765,331,225],[417,759,333,232],[798,757,337,236],[1177,759,329,230]]
 };
 const FAMILIES=freeze(Object.fromEntries(Object.entries(cuts).map(([family,rects])=>[family,rects.map((rect,index)=>({atlas:'d17Buildings157',family,index,rect}))])));
 const ANNEX_FAMILIES=freeze({housing:'house',depot:'warehouse',workshop:'workshop',clinic:'clinic'});
 // A second drawing of each existing model, not a new age, service or floor class.
 const alternateCuts={
  d17Alternates157A:{coreRefuge:[65,36,249,195],coreSteel:[435,51,261,185],coreConcrete:[813,48,244,183],housingLow:[1178,81,280,150],storage:[419,303,289,162],hospital:[811,310,264,142],food:[1172,311,294,156],power:[76,538,260,175],manufacture:[433,523,286,184],housingBlock:[850,492,177,227],housingComplex:[1211,489,232,228],housingFortified:[117,715,202,270],housingTower:[496,722,152,269],barracks:[775,815,305,143],farm:[1169,791,301,195]},
  d17Alternates157B:{generator:[80,63,241,171],lumber:[432,56,278,181],scrapyard:[801,61,289,184],quarry:[1205,58,277,183],refinery:[71,280,268,205],ammoFactory:[425,287,303,204],woodWall:[832,307,257,183],steelWall:[1196,322,284,174],concreteWall:[55,543,292,186],gate:[429,552,296,150],armoredGate:[809,550,302,150],spikes:[1205,546,284,173],watchtower:[124,748,152,230],turret:[439,811,251,144],heavyTurret:[810,794,293,174]},
  d17Apartment157:{housingApartment:[258,211,799,771]}
 };
 const ALTERNATES=freeze(Object.fromEntries(Object.entries(alternateCuts).flatMap(([atlas,models])=>Object.entries(models).map(([modelId,rect])=>[modelId,{modelId,atlas,rect}]))));
 const ANNEX_ALTERNATES=freeze({watch:'watchtower',power:'generator'});
 const selections=new WeakMap(),finite=(...values)=>values.every(Number.isFinite);
 function variant(identity,seed=0,family=''){
  const serial=Number.isSafeInteger(identity)&&identity>=0?identity:null;let hash=(Number.isFinite(seed)?seed:0)>>>0;
  for(const code of family+':'+String(serial===null?identity??'':'')){hash=Math.imul(hash^code.charCodeAt(0),16777619)>>>0;hash^=hash>>>13;}
  hash=Math.imul(hash^(hash>>>16),2246822507)>>>0;hash=Math.imul(hash^(hash>>>13),3266489909)>>>0;
  // Newly built D17 copies receive consecutive numeric IDs. Cycle their four
  // forms with a seeded family offset instead of accidentally repeating one row.
  return(((hash^(hash>>>16))>>>0)%4+(serial===null?0:serial%4))%4;
 }
 function select(family,identity,seed=0){return Object.hasOwn(FAMILIES,family)?FAMILIES[family][variant(identity,seed,family)]:null;}
 function alternateIndex(identity,seed=0,modelId=''){return variant(identity,seed,modelId)%2;}
 function alternateFor(modelId,identity,seed=0,images){
  const spec=Object.hasOwn(ALTERNATES,modelId)?ALTERNATES[modelId]:null;
  return spec&&alternateIndex(identity,seed,modelId)===1&&(!images||images[spec.atlas])?spec:null;
 }
 function spriteFor(b,seed=0){
  if(!b||typeof b!=='object')return null;
  const family=b.type,identity=b.id??[b.gx,b.gy,family].join(':'),cached=selections.get(b);
  if(cached&&cached.family===family&&cached.identity===identity&&cached.seed===seed)return cached.sprite;
  const sprite=select(family,identity,seed);selections.set(b,{family,identity,seed,sprite});return sprite;
 }
 function operational(b){return !!(b&&!b.dead&&b.completed===true&&!(b.health<=0));}
 const METRIC_BASES202=new Set(['core','house','warehouse','workshop','clinic','barracks','farm','lumber','scrapyard','quarry','generator','refinery','ammoFactory','watchtower','turret','heavyTurret']);
 const core202=()=>root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 function profile202(b,model=b.type){
  const type=b.type,kind=b.def?.urbanKind||'',name=type+' '+model;
  if(b.def?.wall)return{kind:'wall',roof:'service'};
  if(['watchtower','turret','heavyTurret','concreteWatch150','casemate150','reinforcedCasemate150','twinGun150','fallbackRedoubt'].includes(type))return{kind:'platform',roof:'service'};
  if(type==='farm'||/courtyardGarden/.test(name))return{kind:'crops',roof:'garden'};
  if(kind==='solar'||/solarPark|solarCourt/.test(name))return{kind:'solar',roof:'industrial'};
  if(['lumber','scrapyard','quarry'].includes(type))return{kind:'yard',roof:'industrial'};
  if(kind==='lamp'||/searchlight|perimeterLight|districtLight|courtyardLight/.test(name))return{kind:'light',roof:'service'};
  if(/Cistern/.test(name))return{kind:'tank',roof:'service'};
  if(kind==='housing'||type==='house'||/Shelter|Quarters/.test(name))return{kind:'building',roof:(b.def?.floors||1)>2?'apartments':'house'};
  if(type==='core')return{kind:'building',roof:'townhall'};
  if(/clinic|hospital|medical|triage|sterilization|aidStation/i.test(name))return{kind:'building',roof:'clinic'};
  if(/greenhouse/i.test(name))return{kind:'building',roof:'garden'};
  if(/workshop|repair|recovery/i.test(name))return{kind:'building',roof:'garage'};
  return{kind:'building',roof:'warehouse'};
 }
 /** The new projection uses the owner's metre footprint, never an inferred alpha footprint. */
 function metricFrame202(b,{seed=0,model=b?.type,sprite=null}={}){
  const C=core202(),r=C?.CityGeometry202?.presentation,units=C?.Frontier?.RULES?.metreUnits;
  if(b?.geometryVersion202!==1||!r||!finite(b.x,b.y,b.w,b.h,b.rotation,units)||b.w<=0||b.h<=0||units<=0||!Number.isInteger(b.rotation)||b.rotation<0||b.rotation>3)return null;
  if(!['storeyHeightMetres','projectedHeightUnitsPerMetre','doorWidthMetres','doorHeightMetres','wallThicknessMetres','roofOverhangMetres'].every(k=>Number.isFinite(r[k])&&r[k]>0))return null;
  const profile=profile202(b,model),floors=Number.isSafeInteger(b.def?.floors)&&b.def.floors>0?b.def.floors:1;
  const w=b.w*units,h=b.h*units,left=b.x-w/2,top=b.y-h/2,bottom=top+h;
  const rise=['crops','solar','yard'].includes(profile.kind)?0:floors*r.storeyHeightMetres*r.projectedHeightUnitsPerMetre,eave=r.roofOverhangMetres*units;
  const margin=Math.max(eave+Math.max(1,r.wallThicknessMetres*units*.3)/2,r.wallThicknessMetres*units);
  const side=['south','west','north','east'][b.rotation],entrance=b.rotation===0?{x:b.x,y:bottom}:b.rotation===1?{x:left,y:b.y}:b.rotation===2?{x:b.x,y:top}:{x:left+w,y:b.y};
  return{projection:'metric-roof-plane202',angle:0,rotation:b.rotation,ground:{x:left,y:top,w,h},rise,floors,profile,
   destination:[left,top-rise,w,h],contact:[b.x,bottom],bounds:{x:left-margin,y:top-rise-margin,w:w+margin*2,h:h+rise+margin*2},
   door:{x:entrance.x-r.doorWidthMetres*units/2,y:entrance.y-r.doorHeightMetres*r.projectedHeightUnitsPerMetre,w:r.doorWidthMetres*units,h:r.doorHeightMetres*r.projectedHeightUnitsPerMetre,side,ground:entrance,visibleFacade:side==='south'},
   units,eave,storeyRise:r.storeyHeightMetres*r.projectedHeightUnitsPerMetre,wall:r.wallThicknessMetres*units,
   variant:variant(b.id??[b.gx,b.gy,b.type].join(':'),seed,'metric202:'+model),
   atlas:sprite?.atlas,source:sprite?.rect,sprite:{...sprite,gunPivot:[.5,.5],turretPivot:[.5,.5],directionPivot:[.5,.5],waterGauge:[.78,.22,.06,.58]}};
 }
 function metricFacade202(c,b,f){
  const q=f.ground,{x,y,w,h}=f.door,bottom=q.y+q.h,front=bottom-f.rise;
  c.fillStyle=b.def?.color||'#667064';c.fillRect(q.x,front,q.w,f.rise);c.fillStyle='rgba(15,24,19,.24)';c.fillRect(q.x,front,q.w,f.rise);
  const pitch=w*1.8,columns=Math.max(0,Math.floor((q.w-w*2)/pitch)),windowW=w*.72,windowH=Math.min(f.storeyRise*.32,h*.5);
  for(let floor=0;floor<f.floors;floor++){
   const yy=bottom-(floor+1)*f.storeyRise+f.storeyRise*.25;
   c.fillStyle='#9ba392';c.fillRect(q.x,yy-f.storeyRise*.25,q.w,Math.max(1,f.wall*.18));
   for(let column=0;column<columns;column++){
    const xx=b.x+(column-(columns-1)/2)*pitch-windowW/2;if(floor===0&&f.door.visibleFacade&&xx<x+w&&xx+windowW>x)continue;
    c.fillStyle=b.powered&&!b.siegeOffline&&!b.territoryOffline&&((column+floor+f.variant)%4!==0)?'#c4b37d':'#293d38';c.fillRect(xx,yy,windowW,windowH);
    c.strokeStyle='#a5aa96';c.lineWidth=Math.max(1,f.wall*.15);c.strokeRect(xx,yy,windowW,windowH);
   }
  }
  if(f.door.visibleFacade){c.fillStyle='#28372e';c.fillRect(x,y,w,h);c.strokeStyle='#aea181';c.lineWidth=Math.max(1,f.wall*.24);c.strokeRect(x,y,w,h);
   c.fillStyle='#c7b483';c.fillRect(x+w*.78,y+h*.58,Math.max(1,w*.055),Math.max(1,h*.055));}
 }
 function metricRoof202(c,art,b,f,seed){
  const [worldX,worldY,worldW,worldH]=f.destination,e=f.eave,roof={x:worldX-e,y:worldY-e,w:worldW+e*2,h:worldH+e*2},Interior=root.DeadwallInteriorArt153;
  // Rotate the roof plan, while walls, doors and gravity retain their world projection.
  const w=b.rotation%2?worldH:worldW,h=b.rotation%2?worldW:worldH,x=-w/2,y=-h/2,local={x:x-e,y:y-e,w:w+e*2,h:h+e*2};
  c.save();c.beginPath();c.rect(roof.x,roof.y,roof.w,roof.h);c.clip();c.translate(b.x,b.y-f.rise);c.rotate(b.rotation*Math.PI/2);
  c.fillStyle=b.def?.roof||['#707366','#667665','#7a735e','#69736c'][f.variant];c.fillRect(local.x,local.y,local.w,local.h);
  Interior?.drawRoof?.(c,art,{id:'city202:'+(b.id??[b.gx,b.gy,b.type].join(':')),type:f.profile.roof},local,{seed});
  c.strokeStyle='rgba(36,48,37,.58)';c.lineWidth=Math.max(1,f.wall*.2);c.beginPath();
  if(f.variant===0){c.moveTo(x,y+h/2);c.lineTo(x+w,y+h/2);c.moveTo(x,y);c.lineTo(x+w/2,y+h/2);c.lineTo(x,y+h);c.moveTo(x+w,y);c.lineTo(x+w/2,y+h/2);c.lineTo(x+w,y+h);}
  else if(f.variant===1)for(let xx=x+f.door.w;xx<x+w;xx+=f.door.w*1.5){c.moveTo(xx,y);c.lineTo(xx,y+h);}
  else if(f.variant===2)for(let row=0;row<2;row++)for(let col=0;col<2;col++){const xx=x+w*(.22+col*.42),yy=y+h*(.22+row*.42);c.rect(xx,yy,Math.min(w*.16,f.door.w*1.6),Math.min(h*.16,f.door.w));}
  else for(let row=1;row<4;row++){const yy=y+h*row/4;c.moveTo(x,yy);c.lineTo(x+w,yy);c.moveTo(x+w*row/5,yy);c.lineTo(x+w*row/5,yy-h/4);}
  c.stroke();c.restore();c.strokeStyle='#a8ad96';c.lineWidth=Math.max(1,f.wall*.3);c.strokeRect(roof.x,roof.y,roof.w,roof.h);
 }
 function metricOpen202(c,b,f){
  const q=f.ground;c.fillStyle=f.profile.kind==='crops'?'#625b40':f.profile.kind==='solar'?'#56634c':'#737064';c.fillRect(q.x,q.y,q.w,q.h);
  const cols=Math.max(1,Math.floor(q.w/(f.door.w*2))),rows=Math.max(1,Math.floor(q.h/(f.door.w*1.5))),cw=q.w/cols,ch=q.h/rows;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x=q.x+col*cw+f.wall,y=q.y+row*ch+f.wall,w=Math.max(1,cw-f.wall*2),h=Math.max(1,ch-f.wall*2);
   c.fillStyle=f.profile.kind==='solar'?'#304b5b':f.profile.kind==='crops'?((col+row+f.variant)%2?'#65834f':'#78935a'):'#8a7b5e';c.fillRect(x,y,w,h);
   c.strokeStyle=f.profile.kind==='solar'?'#91aaa7':'#49533b';c.lineWidth=Math.max(1,f.wall*.16);c.strokeRect(x,y,w,h);
   if(f.profile.kind==='solar'){c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.moveTo(x,y+h/2);c.lineTo(x+w,y+h/2);c.stroke();}
  }
 }
 function drawMetricBuilding202(c,art,b,{seed=0,model=b?.type,frame=metricFrame202(b,{seed,model})}={}){
  if(!frame||!c?.fillRect)return false;
  c.save();try{
   const f=frame,q=f.ground;c.fillStyle='#4f594a';c.fillRect(q.x,q.y,q.w,q.h);
   if(f.profile.kind==='building'&&f.door.side!=='north'){
    const p=f.door.ground;c.fillStyle='#9b957e';
    if(f.door.side==='south')c.fillRect(p.x-f.door.w/2,p.y-f.wall/2,f.door.w,f.wall);
    else c.fillRect(p.x-(f.door.side==='west'?f.wall:0),p.y-f.door.w/2,f.wall,f.door.w);
   }
   if(['crops','solar','yard'].includes(f.profile.kind))metricOpen202(c,b,f);
   else if(f.profile.kind==='light'){
    c.strokeStyle='#a7b1a0';c.lineWidth=Math.max(2,f.wall*.65);c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x,b.y-f.rise);c.stroke();
    c.fillStyle='#657363';c.fillRect(b.x-f.door.w/3,b.y-f.rise-f.door.h/8,f.door.w*2/3,f.door.h/4);
   }else if(f.profile.kind==='tank'){
    c.fillStyle='#859588';c.beginPath();c.ellipse(b.x,b.y-f.rise/2,q.w*.42,q.h*.42,0,0,Math.PI*2);c.fill();c.strokeStyle='#bcc2ac';c.lineWidth=Math.max(2,f.wall*.4);c.stroke();
   }else if(f.profile.kind==='wall'){
    c.fillStyle='#8d9382';c.fillRect(q.x,q.y-f.rise,q.w,q.h+f.rise);c.strokeStyle='#c0c4ae';c.lineWidth=Math.max(1,f.wall*.2);c.strokeRect(q.x,q.y-f.rise,q.w,q.h+f.rise);
   }else if(f.profile.kind==='platform'){
    c.fillStyle='#687263';c.fillRect(q.x,q.y+q.h-f.rise,q.w,f.rise);metricRoof202(c,art,b,f,seed);
    c.strokeStyle='#353e34';c.lineWidth=Math.max(2,f.wall*.5);c.strokeRect(q.x+f.wall,q.y-f.rise+f.wall,q.w-f.wall*2,q.h-f.wall*2);
   }else{metricFacade202(c,b,f);metricRoof202(c,art,b,f,seed);}
   return true;
  }finally{c.restore();}
 }
 function drawMetricConstruction202(c,b,{seed=0}={}){
  const f=metricFrame202(b,{seed});if(!f||!c?.fillRect)return false;
  const q=f.ground,phase=b.progress<.34?0:b.progress<.72?1:2,rise=phase?f.rise*(phase===1?.55:1):0;
  c.save();try{
   c.fillStyle='rgba(103,105,85,.72)';c.fillRect(q.x,q.y,q.w,q.h);c.strokeStyle='#b4aa88';c.lineWidth=f.wall;
   c.strokeRect(q.x+f.wall/2,q.y+f.wall/2,q.w-f.wall,q.h-f.wall);
   c.lineWidth=Math.max(1,f.wall*.3);c.beginPath();
   for(let x=q.x+f.door.w*2;x<q.x+q.w;x+=f.door.w*2){c.moveTo(x,q.y);c.lineTo(x,q.y+q.h);if(phase){c.moveTo(x,q.y+q.h);c.lineTo(x,q.y+q.h-rise);}}
   if(phase){c.moveTo(q.x,q.y+q.h);c.lineTo(q.x,q.y+q.h-rise);c.lineTo(q.x+q.w,q.y+q.h-rise);c.lineTo(q.x+q.w,q.y+q.h);}
   if(phase===2){c.moveTo(q.x,q.y-rise);c.lineTo(q.x+q.w,q.y-rise);c.lineTo(q.x+q.w,q.y+q.h-rise);c.moveTo(q.x,q.y-rise);c.lineTo(q.x,q.y+q.h-rise);}
   c.stroke();return true;
  }finally{c.restore();}
 }
 function measure(b,seed=0){
  const sprite=spriteFor(b,seed);
  if(!sprite||!finite(b.x,b.y,b.w,b.h,b.rotation)||b.w<=0||b.h<=0||!Number.isInteger(b.rotation)||b.rotation<0||b.rotation>3)return null;
  if(b.geometryVersion202===1)return metricFrame202(b,{seed,sprite});
  // Logical dimensions already include the quarter turn. Recover local ground
  // dimensions before applying that same turn to the silhouette and contact.
  const width=(b.rotation%2?b.h:b.w)*32,height=(b.rotation%2?b.w:b.h)*32,inset=3,rise=18;
  const scale=Math.min(Math.max(1,width-inset*2)/sprite.rect[2],Math.max(1,height+rise-inset*2)/sprite.rect[3]);
  const w=sprite.rect[2]*scale,h=sprite.rect[3]*scale;
  return {atlas:sprite.atlas,source:sprite.rect,destination:[-w/2,height/2-inset-h,w,h],angle:b.rotation*Math.PI/2,rise,contact:[0,height/2-inset]};
 }
 function drawBuilding(c,art,b,world){
  if(!operational(b))return false;
  if(b.geometryVersion202===1&&METRIC_BASES202.has(b.type))return drawMetricBuilding202(c,art,b,{seed:world?.seed??0});
  const frame=measure(b,world?.seed??0);
  if(!frame||!c?.drawImage||!art?.images?.[frame.atlas])return false;
  c.save();c.translate(b.x,b.y);c.rotate(frame.angle);
  const painted=typeof art.blit==='function'?art.blit(c,frame.atlas,frame.source,...frame.destination):(c.drawImage(art.images[frame.atlas],...frame.source,...frame.destination),true);
  c.restore();return painted!==false;
 }
 function annexSprite(type,identity,seed=0){return Object.hasOwn(ANNEX_FAMILIES,type)?select(ANNEX_FAMILIES[type],identity,seed):Object.hasOwn(ANNEX_ALTERNATES,type)?alternateFor(ANNEX_ALTERNATES[type],identity,seed):null;}
 function measureAnnex(type,identity,seed,x,y){
  const sprite=annexSprite(type,identity,seed);if(!sprite||!finite(x,y))return null;
  const scale=Math.min(20/sprite.rect[2],13/sprite.rect[3]),w=sprite.rect[2]*scale,h=sprite.rect[3]*scale;
  return {atlas:sprite.atlas,source:sprite.rect,destination:[x+(20-w)/2,y+9-h,w,h]};
 }
 function drawAnnex(c,art,type,identity,seed,x,y){
  const frame=measureAnnex(type,identity,seed,x,y);if(!frame||!c?.drawImage||!art?.images?.[frame.atlas])return false;
  return typeof art.blit==='function'?art.blit(c,frame.atlas,frame.source,...frame.destination)!==false:(c.drawImage(art.images[frame.atlas],...frame.source,...frame.destination),true);
 }
 return freeze({ASSETS,FAMILIES,ALTERNATES,ANNEX_FAMILIES,ANNEX_ALTERNATES,variant,select,alternateIndex,alternateFor,spriteFor,operational,metricFrame202,drawMetricBuilding202,drawMetricConstruction202,measure,drawBuilding,annexSprite,measureAnnex,drawAnnex});
});
