/* Original world objects; variant selection and paint never touch simulation. */
(function(root,factory){
 'use strict';const api=factory();root.DeadwallWorldPropsArt153=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ASSETS=Object.freeze(Object.fromEntries(Object.entries({"worldPropsScenery153":{"url":"assets/art153/props-scenery.png","width":1536,"height":1024,"matte":"none"},"worldPropsLights153":{"url":"assets/art153/props-lights.png","width":1536,"height":1024,"matte":"none"},"worldPropsKits153":{"url":"assets/art153/props-kits.png","width":1536,"height":1024,"matte":"none"},"worldPropsOperations153":{"url":"assets/art153/props-operations.png","width":1536,"height":1024,"matte":"none"},"worldPropsResources153":{"url":"assets/art153/props-resources.png","width":1536,"height":1024,"matte":"none"},"worldPropsRoad153":{"url":"assets/art153/props-road.png","width":1536,"height":1024,"matte":"none"},"worldPropsYard153":{"url":"assets/art153/props-yard.png","width":1536,"height":1024,"matte":"none"}}).map(([key,spec])=>[key,Object.freeze(spec)])));
 const FAMILIES=Object.freeze(Object.fromEntries(Object.entries({"tent":[{"atlas":"worldPropsScenery153","rect":[76,49,223,187],"family":"tent","variant":0},{"atlas":"worldPropsScenery153","rect":[436,66,277,181],"family":"tent","variant":1}],"container":[{"atlas":"worldPropsScenery153","rect":[849,71,208,166],"family":"container","variant":0},{"atlas":"worldPropsScenery153","rect":[1238,40,222,214],"family":"container","variant":1}],"waterTank":[{"atlas":"worldPropsScenery153","rect":[120,288,148,237],"family":"waterTank","variant":0},{"atlas":"worldPropsScenery153","rect":[468,338,230,183],"family":"waterTank","variant":1}],"powerPylon":[{"atlas":"worldPropsScenery153","rect":[898,281,118,241],"family":"powerPylon","variant":0},{"atlas":"worldPropsScenery153","rect":[1259,272,163,249],"family":"powerPylon","variant":1}],"concreteBarricade":[{"atlas":"worldPropsScenery153","rect":[80,579,238,167],"family":"concreteBarricade","variant":0},{"atlas":"worldPropsScenery153","rect":[449,603,262,143],"family":"concreteBarricade","variant":1}],"streetLamp":[{"atlas":"worldPropsScenery153","rect":[906,557,139,190],"family":"streetLamp","variant":0},{"atlas":"worldPropsScenery153","rect":[1242,560,207,179],"family":"streetLamp","variant":1}],"ambulance":[{"atlas":"worldPropsScenery153","rect":[43,779,309,190],"family":"ambulance","variant":0},{"atlas":"worldPropsScenery153","rect":[427,777,312,189],"family":"ambulance","variant":1}],"bus":[{"atlas":"worldPropsScenery153","rect":[819,793,277,172],"family":"bus","variant":0},{"atlas":"worldPropsScenery153","rect":[1189,797,302,165],"family":"bus","variant":1}],"branch":[{"atlas":"worldPropsLights153","rect":[57,33,291,216],"family":"branch","variant":0},{"atlas":"worldPropsLights153","rect":[462,35,265,214],"family":"branch","variant":1}],"torch":[{"atlas":"worldPropsLights153","rect":[838,22,262,225],"family":"torch","variant":0},{"atlas":"worldPropsLights153","rect":[1235,25,258,223],"family":"torch","variant":1}],"campfire":[{"atlas":"worldPropsLights153","rect":[48,282,295,222],"family":"campfire","variant":0},{"atlas":"worldPropsLights153","rect":[454,260,258,251],"family":"campfire","variant":1}],"flare":[{"atlas":"worldPropsLights153","rect":[846,287,225,196],"family":"flare","variant":0},{"atlas":"worldPropsLights153","rect":[1251,285,204,202],"family":"flare","variant":1}],"chemlight":[{"atlas":"worldPropsLights153","rect":[79,523,229,216],"family":"chemlight","variant":0},{"atlas":"worldPropsLights153","rect":[453,518,252,232],"family":"chemlight","variant":1}],"lantern":[{"atlas":"worldPropsLights153","rect":[885,493,168,262],"family":"lantern","variant":0},{"atlas":"worldPropsLights153","rect":[1263,502,179,245],"family":"lantern","variant":1}],"worklight":[{"atlas":"worldPropsLights153","rect":[76,758,236,244],"family":"worklight","variant":0},{"atlas":"worldPropsLights153","rect":[454,769,249,233],"family":"worklight","variant":1}],"beacon":[{"atlas":"worldPropsLights153","rect":[864,789,206,205],"family":"beacon","variant":0},{"atlas":"worldPropsLights153","rect":[1236,760,237,234],"family":"beacon","variant":1}],"essentialLight":[{"atlas":"worldPropsKits153","rect":[46,32,324,236],"family":"essentialLight","variant":0},{"atlas":"worldPropsKits153","rect":[422,46,318,219],"family":"essentialLight","variant":1}],"essentialAid":[{"atlas":"worldPropsKits153","rect":[801,42,319,230],"family":"essentialAid","variant":0},{"atlas":"worldPropsKits153","rect":[1168,52,336,221],"family":"essentialAid","variant":1}],"essentialBrace":[{"atlas":"worldPropsKits153","rect":[28,315,354,202],"family":"essentialBrace","variant":0},{"atlas":"worldPropsKits153","rect":[418,308,348,219],"family":"essentialBrace","variant":1}],"essentialDecoy":[{"atlas":"worldPropsKits153","rect":[848,290,251,225],"family":"essentialDecoy","variant":0},{"atlas":"worldPropsKits153","rect":[1197,307,285,208],"family":"essentialDecoy","variant":1}],"barricadePlanks":[{"atlas":"worldPropsKits153","rect":[25,557,358,193],"family":"barricadePlanks","variant":0},{"atlas":"worldPropsKits153","rect":[412,555,357,199],"family":"barricadePlanks","variant":1}],"barricadeSheet":[{"atlas":"worldPropsKits153","rect":[796,541,342,207],"family":"barricadeSheet","variant":0},{"atlas":"worldPropsKits153","rect":[1162,545,358,208],"family":"barricadeSheet","variant":1}],"barricadeBraced":[{"atlas":"worldPropsKits153","rect":[36,780,336,198],"family":"barricadeBraced","variant":0},{"atlas":"worldPropsKits153","rect":[425,778,340,200],"family":"barricadeBraced","variant":1}],"solar":[{"atlas":"worldPropsKits153","rect":[862,747,203,238],"family":"solar","variant":0},{"atlas":"worldPropsKits153","rect":[1190,754,301,257],"family":"solar","variant":1}],"cache":[{"atlas":"worldPropsOperations153","rect":[34,30,315,213],"family":"cache","variant":0},{"atlas":"worldPropsOperations153","rect":[419,34,299,207],"family":"cache","variant":1}],"cargo":[{"atlas":"worldPropsOperations153","rect":[780,38,331,207],"family":"cargo","variant":0},{"atlas":"worldPropsOperations153","rect":[1174,23,345,228],"family":"cargo","variant":1}],"routeMarker":[{"atlas":"worldPropsOperations153","rect":[164,269,136,218],"family":"routeMarker","variant":0},{"atlas":"worldPropsOperations153","rect":[454,254,180,247],"family":"routeMarker","variant":1}],"bedroll":[{"atlas":"worldPropsOperations153","rect":[733,293,391,205],"family":"bedroll","variant":0},{"atlas":"worldPropsOperations153","rect":[1166,297,351,189],"family":"bedroll","variant":1}],"tarp":[{"atlas":"worldPropsOperations153","rect":[22,493,334,258],"family":"tarp","variant":0},{"atlas":"worldPropsOperations153","rect":[362,499,402,244],"family":"tarp","variant":1}],"ammoBox":[{"atlas":"worldPropsOperations153","rect":[820,544,250,167],"family":"ammoBox","variant":0},{"atlas":"worldPropsOperations153","rect":[1145,572,371,131],"family":"ammoBox","variant":1}],"repairKit":[{"atlas":"worldPropsOperations153","rect":[30,768,322,199],"family":"repairKit","variant":0},{"atlas":"worldPropsOperations153","rect":[396,751,367,226],"family":"repairKit","variant":1}],"casualtyBag":[{"atlas":"worldPropsOperations153","rect":[785,725,336,265],"family":"casualtyBag","variant":0},{"atlas":"worldPropsOperations153","rect":[1154,746,350,235],"family":"casualtyBag","variant":1}],"sedan":[{"atlas":"worldPropsResources153","rect":[112,6,168,299],"family":"sedan","variant":0},{"atlas":"worldPropsResources153","rect":[481,7,171,293],"family":"sedan","variant":1}],"scrap":[{"atlas":"worldPropsResources153","rect":[780,37,349,231],"family":"scrap","variant":0},{"atlas":"worldPropsResources153","rect":[1166,19,349,260],"family":"scrap","variant":1},{"atlas":"worldPropsResources153","rect":[802,766,325,241],"family":"scrap","variant":2},{"atlas":"worldPropsResources153","rect":[1160,759,359,248],"family":"scrap","variant":3}],"fuel":[{"atlas":"worldPropsResources153","rect":[74,313,239,189],"family":"fuel","variant":0},{"atlas":"worldPropsResources153","rect":[434,312,267,191],"family":"fuel","variant":1}],"crops":[{"atlas":"worldPropsResources153","rect":[776,304,330,205],"family":"crops","variant":0},{"atlas":"worldPropsResources153","rect":[1164,319,355,167],"family":"crops","variant":1}],"supplies":[{"atlas":"worldPropsResources153","rect":[34,518,321,221],"family":"supplies","variant":0},{"atlas":"worldPropsResources153","rect":[442,526,248,209],"family":"supplies","variant":1}],"utilityTruck":[{"atlas":"worldPropsResources153","rect":[756,535,362,211],"family":"utilityTruck","variant":0},{"atlas":"worldPropsResources153","rect":[1169,504,352,251],"family":"utilityTruck","variant":1}],"tanker":[{"atlas":"worldPropsResources153","rect":[8,753,375,240],"family":"tanker","variant":0},{"atlas":"worldPropsResources153","rect":[409,761,354,230],"family":"tanker","variant":1}],"cone":[{"atlas":"worldPropsRoad153","rect":[93,8,184,245],"family":"cone","variant":0},{"atlas":"worldPropsRoad153","rect":[489,68,197,181],"family":"cone","variant":1}],"roadSign":[{"atlas":"worldPropsRoad153","rect":[871,9,199,247],"family":"roadSign","variant":0},{"atlas":"worldPropsRoad153","rect":[1274,7,160,251],"family":"roadSign","variant":1}],"roadBarrier":[{"atlas":"worldPropsRoad153","rect":[56,283,268,204],"family":"roadBarrier","variant":0},{"atlas":"worldPropsRoad153","rect":[414,268,333,229],"family":"roadBarrier","variant":1}],"bollard":[{"atlas":"worldPropsRoad153","rect":[909,289,110,195],"family":"bollard","variant":0},{"atlas":"worldPropsRoad153","rect":[1297,261,110,245],"family":"bollard","variant":1}],"tirePile":[{"atlas":"worldPropsRoad153","rect":[38,523,308,203],"family":"tirePile","variant":0},{"atlas":"worldPropsRoad153","rect":[436,506,302,229],"family":"tirePile","variant":1}],"luggage":[{"atlas":"worldPropsRoad153","rect":[813,529,301,202],"family":"luggage","variant":0},{"atlas":"worldPropsRoad153","rect":[1185,526,325,212],"family":"luggage","variant":1}],"shoppingCart":[{"atlas":"worldPropsRoad153","rect":[49,740,275,272],"family":"shoppingCart","variant":0},{"atlas":"worldPropsRoad153","rect":[468,742,212,263],"family":"shoppingCart","variant":1}],"pallet":[{"atlas":"worldPropsRoad153","rect":[789,754,338,250],"family":"pallet","variant":0},{"atlas":"worldPropsRoad153","rect":[1186,764,321,235],"family":"pallet","variant":1}],"shed":[{"atlas":"worldPropsYard153","rect":[78,7,296,279],"family":"shed","variant":0},{"atlas":"worldPropsYard153","rect":[465,5,247,270],"family":"shed","variant":1}],"barrel":[{"atlas":"worldPropsYard153","rect":[870,9,174,281],"family":"barrel","variant":0},{"atlas":"worldPropsYard153","rect":[1227,8,192,275],"family":"barrel","variant":1}],"mailbox":[{"atlas":"worldPropsYard153","rect":[140,291,132,215],"family":"mailbox","variant":0},{"atlas":"worldPropsYard153","rect":[505,290,188,222],"family":"mailbox","variant":1}],"drain":[{"atlas":"worldPropsYard153","rect":[823,339,274,141],"family":"drain","variant":0},{"atlas":"worldPropsYard153","rect":[1191,298,279,208],"family":"drain","variant":1}],"manhole":[{"atlas":"worldPropsYard153","rect":[80,512,287,247],"family":"manhole","variant":0},{"atlas":"worldPropsYard153","rect":[452,513,282,242],"family":"manhole","variant":1}],"marker":[{"atlas":"worldPropsYard153","rect":[914,520,93,231],"family":"marker","variant":0},{"atlas":"worldPropsYard153","rect":[1233,516,187,243],"family":"marker","variant":1}],"crack":[{"atlas":"worldPropsYard153","rect":[80,767,282,243],"family":"crack","variant":0},{"atlas":"worldPropsYard153","rect":[467,775,262,227],"family":"crack","variant":1}],"litter":[{"atlas":"worldPropsYard153","rect":[821,767,267,226],"family":"litter","variant":0},{"atlas":"worldPropsYard153","rect":[1192,765,265,227],"family":"litter","variant":1}]}).map(([id,frames])=>[id,Object.freeze(frames.map(frame=>Object.freeze({...frame,rect:Object.freeze(frame.rect)})))])));
 const ALIASES=Object.freeze({light:'essentialLight',aid:'essentialAid',brace:'essentialBrace',decoy:'essentialDecoy',
  planks:'barricadePlanks',sheet:'barricadeSheet',braced:'barricadeBraced',
  markerOperation:'routeMarker',ammo:'ammoBox',support:'repairKit',casualty:'casualtyBag',
  barrier:'roadBarrier',toolbox:'repairKit',crate:'cache'});
 const SCENERY=Object.freeze(['tent','container','waterTank','powerPylon','concreteBarricade','streetLamp','ambulance','bus','utilityTruck','tanker']);
 const LIGHTS=Object.freeze(['branch','torch','campfire','flare','chemlight','lantern','worklight','beacon','solar']);
 const OPERATIONS=Object.freeze({cache:'cache',cargo:'cargo',marker:'routeMarker',bedroll:'bedroll',tarp:'tarp',ammo:'ammoBox',support:'repairKit'});
 const ROAD_BOUNDS=Object.freeze({cone:[14,18],roadSign:[20,28],barrier:[36,8],bollard:[6,18],tirePile:[26,22],
  luggage:[18,12],shoppingCart:[26,22],pallet:[26,18],toolbox:[20,12],crate:[20,18],tarp:[26,16]});
 // Measured emitter positions in each source silhouette, including two heads
 // on the dual worklight. Marks stay on hardware when model proportions differ.
 const LIGHT_HEADS=Object.freeze({branch:[[[.93,.10]],[[.90,.08]]],torch:[[[.86,.09]],[[.86,.10]]],
  campfire:[[[.50,.50]],[[.52,.44]]],flare:[[[.10,.86]],[[.80,.10]]],chemlight:[[[.45,.59]],[[.45,.59]]],
  lantern:[[[.47,.57]],[[.52,.61]]],worklight:[[[.48,.20]],[[.21,.20],[.66,.20]]],
  beacon:[[[.52,.29]],[[.50,.14]]],solar:[[[.57,.36]],[[.89,.43]]]});
 function familyFor(kind){if(typeof kind!=='string')return null;return Object.hasOwn(FAMILIES,kind)?kind:Object.hasOwn(ALIASES,kind)?ALIASES[kind]:null;}
 function hash(seed,identity,family){
  let h=(Number.isFinite(seed)?seed>>>0:0)^2166136261;
  const text=String(identity??'')+':'+family;
  for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);
  return h>>>0;
 }
 function select(kind,identity='',seed=0,variant){
  const family=familyFor(kind);if(!family)return null;const choices=FAMILIES[family];
  const index=Number.isInteger(variant)?((variant%choices.length)+choices.length)%choices.length:hash(seed,identity,family)%choices.length;
  return choices[index];
 }
 function measure(kind,identity,x,y,width,height=width,{seed=0,variant,pivot=[.5,.5]}={}){
  const sprite=select(kind,identity,seed,variant);
  if(!sprite||!Array.isArray(pivot)||pivot.length!==2||![x,y,width,height,...pivot].every(Number.isFinite)||width<=0||height<=0||pivot.some(v=>v<0||v>1))return null;
  const r=sprite.rect,s=Math.min(width/r[2],height/r[3]),w=r[2]*s,h=r[3]*s;
  return{sprite,source:r,destination:[x-w*pivot[0],y-h*pivot[1],w,h]};
 }
 function drawSprite(c,art,kind,identity,x,y,width,height=width,options={}){
  const frame=measure(kind,identity,x,y,width,height,options),image=frame&&art?.images?.[frame.sprite.atlas];
  if(!frame||!image||!c?.drawImage||!Number.isFinite(options.alpha??1)||!Number.isFinite(options.angle??0))return false;
  c.save();c.globalAlpha*=Math.max(0,Math.min(1,options.alpha??1));
  if(options.angle){c.translate(x,y);c.rotate(options.angle);frame.destination[0]-=x;frame.destination[1]-=y;}
  if(art.blit)art.blit(c,frame.sprite.atlas,frame.source,...frame.destination);else c.drawImage(image,...frame.source,...frame.destination);
  c.restore();return true;
 }
 function resourceFamily(node){
  if(!node)return null;if(SCENERY.includes(node.sceneryKind))return node.sceneryKind;
  if(node.sceneryKind)return null;
  const v=Math.abs(node.variant||0)%4;
  return node.type==='scrap'?(v===0?'scrap':v===1?'sedan':null):node.type==='fuel'?(v%2?null:'fuel'):
   node.type==='food'?(v===3?'supplies':'crops'):node.type==='ammo'?'ammoBox':node.type==='medicine'?'essentialAid':null;
 }
 function drawSceneryNode(c,art,node,{seed=0,rect}={}){
  const family=resourceFamily(node);if(!family)return false;
  const size=node.renderSize||node.radius*2.65||90;
  const width=rect?rect.r-rect.l:size,height=rect?rect.b-rect.t:size;
  const ratio=node.maxAmount>0?Math.max(.45,Math.min(1,node.amount/node.maxAmount)):1;
  return drawSprite(c,art,family,node.id,node.x,node.y,width,height,{seed,alpha:ratio});
 }
 function drawLight(c,art,kind,x,y,scale=1,{identity=kind,seed=0,on=false,time=0,reducedMotion=false}={}){
  if(!LIGHTS.includes(kind)||!Number.isFinite(scale)||scale<=0)return false;
  if(!drawSprite(c,art,kind,identity,x,y,scale*1.2,scale*1.5,{seed}))return false;
  if(on!==true)return true;
  const frame=measure(kind,identity,x,y,scale*1.2,scale*1.5,{seed}),[dx,dy,w,h]=frame.destination;
  const heads=LIGHT_HEADS[kind][frame.sprite.variant];
  c.save();
  for(const [ax,ay]of heads){c.save();c.translate(dx+w*ax,dy+h*ay);c.scale(scale,scale);
  if(['branch','torch','campfire'].includes(kind)){
   const drift=reducedMotion?0:Math.sin((Number.isFinite(time)?time:0)*7)*.035;
   c.fillStyle='#e69c42';c.beginPath();c.moveTo(-.16,.08);c.quadraticCurveTo(-.2,-.1,drift,-.42);c.quadraticCurveTo(.2,-.1,.13,.08);c.closePath();c.fill();
   c.fillStyle='#ffe2a0';c.beginPath();c.ellipse(0,-.025,.06,.11,0,0,Math.PI*2);c.fill();
  }else{
   c.fillStyle=kind==='flare'?'#e89975':kind==='chemlight'?'#91c9a0':kind==='solar'?'#c8d4b3':'#e3d2a3';
   c.beginPath();c.ellipse(0,0,kind==='chemlight'?.07:.10,.06,0,0,Math.PI*2);c.fill();
  }
  c.restore();}
  c.restore();return true;
 }
 function drawEssential(c,art,kind,x,y,scale=1,{identity=kind,seed=0}={}){
  const family=ALIASES[kind];if(!['essentialLight','essentialAid','essentialBrace','essentialDecoy'].includes(family)||!Number.isFinite(scale)||scale<=0)return false;
  return drawSprite(c,art,family,identity,x,y,scale*.95,scale*.72,{seed});
 }
 function drawOperation(c,art,type,x,y,size,{identity=type,seed=0,variant}={}){
  if(!Object.hasOwn(OPERATIONS,type))return false;
  return drawSprite(c,art,OPERATIONS[type],identity,x,y,size,size,{seed,variant});
 }
 function drawRoadProp(c,art,prop,{seed=0,rect}={}){
  if(!prop)return false;const family=prop.kind==='debris'?null:familyFor(prop.kind);
  const bounds=ROAD_BOUNDS[prop.kind];if(!family||!bounds)return false;
  // Historical roadProps.size is a culling marker, not the painted collider.
  const width=rect?rect.r-rect.l:bounds[0],height=rect?rect.b-rect.t:bounds[1];
  return drawSprite(c,art,family,prop.id??prop.eventId??(prop.x+':'+prop.y),prop.x,prop.y,width,height,{seed,angle:prop.angle||0});
 }
 function drawYardProp(c,art,prop,{seed=0,rect}={}){
  if(!prop||!['shed','barrel','mailbox'].includes(prop.kind))return false;
  const size=prop.size;if(!Number.isFinite(size)||size<=0)return false;
  // Sheds and barrels retain the exact owner rectangle; elevation is visual.
  const width=rect?rect.r-rect.l:prop.kind==='shed'?size*.9:prop.kind==='barrel'?size*.72:14;
  const height=rect?rect.b-rect.t:prop.kind==='shed'?size*.7:prop.kind==='barrel'?size*.72:23;
  const y=rect?(rect.t+rect.b)/2:prop.kind==='mailbox'?prop.y+4.5:prop.y;
  return drawSprite(c,art,prop.kind,prop.id??(prop.x+':'+prop.y),prop.x,y,width,height,{seed});
 }
 function drawTerrainDecor(c,art,prop,{seed=0}={}){
  if(!prop||!['drain','manhole','marker','crack','litter'].includes(prop.kind))return false;
  const sizes={drain:[22,10],manhole:[20,16],marker:[12,18],crack:[32,20],litter:[24,16]},[w,h]=sizes[prop.kind];
  return drawSprite(c,art,prop.kind,prop.id??(prop.x+':'+prop.y),prop.x,prop.y,w,h,{seed,angle:prop.angle||0});
 }
 return Object.freeze({ASSETS,FAMILIES,ALIASES,SCENERY,LIGHTS,OPERATIONS,ROAD_BOUNDS,familyFor,select,measure,resourceFamily,
  drawSprite,drawSceneryNode,drawLight,drawEssential,drawOperation,drawRoadProp,drawYardProp,drawTerrainDecor});
});
