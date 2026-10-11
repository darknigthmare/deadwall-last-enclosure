/* Original building silhouettes selected from stable world identity, never simulation RNG. */
(function(root,factory){
 'use strict';const api=factory();root.DeadwallBuildingVariants157=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
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
 function measure(b,seed=0){
  const sprite=spriteFor(b,seed);
  if(!sprite||!finite(b.x,b.y,b.w,b.h,b.rotation)||b.w<=0||b.h<=0||!Number.isInteger(b.rotation)||b.rotation<0||b.rotation>3)return null;
  // Logical dimensions already include the quarter turn. Recover local ground
  // dimensions before applying that same turn to the silhouette and contact.
  const width=(b.rotation%2?b.h:b.w)*32,height=(b.rotation%2?b.w:b.h)*32,inset=3,rise=18;
  const scale=Math.min(Math.max(1,width-inset*2)/sprite.rect[2],Math.max(1,height+rise-inset*2)/sprite.rect[3]);
  const w=sprite.rect[2]*scale,h=sprite.rect[3]*scale;
  return {atlas:sprite.atlas,source:sprite.rect,destination:[-w/2,height/2-inset-h,w,h],angle:b.rotation*Math.PI/2,rise,contact:[0,height/2-inset]};
 }
 function drawBuilding(c,art,b,world){
  if(!operational(b))return false;const frame=measure(b,world?.seed??0);
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
 return freeze({ASSETS,FAMILIES,ALTERNATES,ANNEX_FAMILIES,ANNEX_ALTERNATES,variant,select,alternateIndex,alternateFor,spriteFor,operational,measure,drawBuilding,annexSprite,measureAnnex,drawAnnex});
});
