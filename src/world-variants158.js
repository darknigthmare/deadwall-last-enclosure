/* Cosmetic owner views. Stable identities choose pictures, never simulation RNG. */
(function(root,factory){
 'use strict';const api=factory();root.DeadwallWorldVariants158=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const asset=(name,width=1536,height=1024)=>Object.freeze({url:'assets/art158/'+name+'.png',width,height,matte:'none'});
 const ASSETS=Object.freeze({
  art158ActorsA:asset('actors-a'),art158ActorsB:asset('actors-b'),art158ActorsC:asset('actors-c'),
  art158Crawler:asset('crawler'),
  art158Bloated:asset('bloated'),
  art158Vehicles:asset('vehicles'),art158HeavyVehicles:asset('heavy-vehicles'),art158Mechanisms:asset('mechanisms'),
  art158Details:asset('details',948,1659),art158PlayerGear:asset('player-gear',1774,887)
 });
 const ACTOR_GROUPS=Object.freeze({
  art158ActorsA:Object.freeze(['runner','armored',null,'howler']),
  art158ActorsB:Object.freeze(['breacher','stalker',null,'shielded']),
  art158ActorsC:Object.freeze(['charger','medic','engineer']),art158Crawler:Object.freeze(['crawler']),art158Bloated:Object.freeze(['bloated'])
 });
 const ACTOR_LAYOUTS=Object.freeze({
  art158ActorsA:Object.freeze({columns:8,rows:4}),art158ActorsB:Object.freeze({columns:8,rows:4}),
  art158ActorsC:Object.freeze({columns:8,rows:4}),
  // The prone bodies occupy the lower part of each source row. These fixed
  // ground anchors keep the crawler centred on its owner through all poses.
  art158Crawler:Object.freeze({columns:4,rows:2,pivotY:Object.freeze([306,790])}),
  art158Bloated:Object.freeze({columns:4,rows:2})
 });
 const VEHICLE_TYPES=Object.freeze(['skate','bike','motorcycle','compact','break','buggy','van','bus','truck']);
 const MECHANISM_TYPES=Object.freeze(['ankle','blades','guideRail','ratchet','clamp','counterweight']);
 const DETAIL_TYPES=Object.freeze(['patio','hedge','trash','paper','toy','laundryBasket','basket','menu','tray','screen','notice','palletMark','fence']);
 // Measured alpha gutters isolate the original source drawings without editing
 // the PNGs. Two crawler poses cross their nominal 384-pixel column boundary.
 // A frame keeps its nominal anchor even when the transparent margin differs.
 const grid=(atlas,columns,rows)=>Object.freeze(Array.from({length:columns*rows},(_,i)=>Object.freeze([
  Math.floor((i%columns)*ASSETS[atlas].width/columns),Math.floor(Math.floor(i/columns)*ASSETS[atlas].height/rows),
  Math.floor(ASSETS[atlas].width/columns),Math.floor(ASSETS[atlas].height/rows)
 ])));
 const CUTS=Object.freeze({
  art158ActorsA:Object.freeze([[14,79,179,177],[193,79,190,194],[391,79,188,191],[579,76,178,193],[762,81,205,190],[975,79,175,193],[1162,79,185,188],[1372,79,158,170],[19,312,173,201],[220,307,159,211],[408,311,164,206],[596,310,165,207],[802,311,149,206],[994,312,148,208],[1191,307,148,212],[1373,311,150,205],...grid('art158ActorsA',8,4).slice(16,24),[20,760,160,221],[218,762,159,217],[399,759,156,225],[592,763,179,220],[790,765,170,220],[984,764,167,221],[1180,764,162,216],[1362,764,158,217]].map(Object.freeze)),
  art158ActorsB:Object.freeze([[17,55,182,178],[220,54,185,182],[422,56,172,185],[604,57,183,175],[805,54,181,180],[992,49,176,192],[1174,55,173,188],[1369,57,156,176],[13,303,173,174],[217,303,183,188],[413,302,180,189],[608,304,166,180],[803,303,161,178],[990,303,179,182],[1174,303,173,189],[1368,306,156,177],...grid('art158ActorsB',8,4).slice(16,24),[19,784,187,192],[215,786,191,195],[414,785,182,198],[606,786,170,182],[800,785,191,191],[999,783,177,199],[1178,784,173,206],[1370,785,151,190]].map(([x,y,w,h],i)=>Object.freeze(i>=16&&i<24?[x,y,w,h]:[x-2,y-2,w+4,h+4]))),
  art158Crawler:Object.freeze([[14,239,369,134],[398,230,372,158],[786,221,339,153],[1164,216,358,174],[12,698,378,162],[401,719,340,146],[787,718,349,148],[1162,712,353,173]].map(Object.freeze)),
  art158Bloated:Object.freeze([[48,34,285,462],[415,34,309,462],[794,34,336,457],[1186,36,322,456],[31,529,323,460],[422,531,333,459],[803,527,331,465],[1167,530,339,460]].map(Object.freeze)),
  art158ActorsC:Object.freeze([[12,52,196,174],[211,50,190,178],[409,49,194,188],[605,51,168,183],[786,53,182,182],[977,56,189,175],[1171,54,192,184],[1366,51,166,180],[21,284,157,220],[219,282,160,227],[420,283,166,229],[623,285,143,228],[802,285,154,228],[998,281,167,228],[1193,285,149,227],[1373,284,141,233],[17,531,189,235],[207,534,195,239],[402,533,199,246],[604,540,182,235],[793,537,179,233],[990,533,169,242],[1172,534,174,243],[1365,538,156,241]].map(Object.freeze)),
  art158Vehicles:Object.freeze([[29,118,450,148],[520,46,501,250],[1056,46,459,250],[20,353,457,271],[501,352,535,269],[1054,364,462,253],[14,686,471,276],[498,690,520,281],[1028,678,493,289]].map(Object.freeze)),
  art158HeavyVehicles:Object.freeze([[30,67,1479,423],[54,520,1434,438]].map(Object.freeze)),
  art158Mechanisms:Object.freeze([[42,36,336,261],[425,113,341,144],[815,36,302,264],[1169,66,346,210],[18,415,382,164],[421,320,347,314],[818,341,297,293],[1166,375,352,242],[29,679,354,294],[429,664,314,300],[794,664,333,310],[1154,696,361,268]].map(Object.freeze)),
  art158Details:Object.freeze([[25,87,222,118],[257,42,210,208],[477,86,214,143],[700,100,233,105],[45,281,157,184],[276,285,170,183],[482,288,209,182],[746,308,154,137],[25,547,217,104],[282,488,167,216],[474,516,219,152],[706,517,223,152],[15,753,240,127],[274,731,192,169],[526,734,129,166],[707,739,221,160],[20,973,237,136],[266,975,223,128],[504,985,261,131],[814,947,100,191],[26,1197,225,158],[272,1200,208,153],[490,1190,210,180],[721,1211,194,140],[24,1435,224,118],[261,1435,211,119]].map(([x,y,w,h])=>Object.freeze([x-3,y-3,w+6,h+6]))),
  art158PlayerGear:Object.freeze([[179,70,639,729],[1013,73,606,717]].map(Object.freeze))
 });
 // The crowded crawler row of A is explicitly unused. Its eight replacement
 // poses live in a roomy 4-by-2 original atlas; no neighbouring pixels are cut.
 const UNUSED_SOURCE_CUTS=Object.freeze({art158ActorsA:Object.freeze([Object.freeze([0,520,1536,230])]),art158ActorsB:Object.freeze([Object.freeze([0,500,1536,260])]),art158Vehicles:Object.freeze(CUTS.art158Vehicles.slice(7))});
 const UNUSED_SOURCE_INDICES=Object.freeze({art158ActorsA:Object.freeze([16,17,18,19,20,21,22,23]),art158ActorsB:Object.freeze([16,17,18,19,20,21,22,23]),art158Vehicles:Object.freeze([7,8])});
 const sprite=(atlas,index,family,variant)=>Object.freeze({atlas,rect:CUTS[atlas][index],family,variant});
 const ACTORS=Object.freeze(Object.fromEntries(Object.entries(ACTOR_GROUPS).flatMap(([atlas,ids])=>ids.flatMap((kind,row)=>kind?[[
  kind,Object.freeze({atlas,row,frames:Object.freeze(Array.from({length:8},(_,frame)=>sprite(atlas,row*8+frame,kind,1)))})
 ]]:[]))));
 const VEHICLES=Object.freeze(Object.fromEntries(VEHICLE_TYPES.map((kind,index)=>[kind,index<7?sprite('art158Vehicles',index,kind,1):sprite('art158HeavyVehicles',index-7,kind,1)])));
 const pairs=(atlas,types)=>Object.freeze(Object.fromEntries(types.map((kind,index)=>[kind,Object.freeze([0,1].map(v=>sprite(atlas,index*2+v,kind,v)))])));
 const MECHANISMS=pairs('art158Mechanisms',MECHANISM_TYPES),DETAILS=pairs('art158Details',DETAIL_TYPES);
 const PLAYER_GEAR=Object.freeze([0,1].map(v=>sprite('art158PlayerGear',v,'player',v)));
 function hash(seed,identity,family){
  let value=(Number.isFinite(seed)?seed>>>0:0)^2166136261;
  const text=String(identity??'')+':'+family;
  for(let n=0;n<text.length;n++)value=Math.imul(value^text.charCodeAt(n),16777619);
  // Mix the low bits so sequential IDs and seeds with the same parity do not
  // turn a two-form palette into a fixed alternating/checkerboard pattern.
  value=Math.imul(value^(value>>>16),0x7feb352d);
  value=Math.imul(value^(value>>>15),0x846ca68b);
  return(value^(value>>>16))>>>0;
 }
 function variantFor(seed,identity,family,count=2,variant){
  if(!Number.isInteger(count)||count<=0)return null;
  return Number.isInteger(variant)?((variant%count)+count)%count:hash(seed,identity,family)%count;
 }
 function selectPair(registry,kind,identity,{seed=0,variant}={}){
  if(typeof kind!=='string'||!Object.hasOwn(registry,kind))return null;
  const forms=registry[kind];return forms[variantFor(seed,identity,kind,forms.length,variant)];
 }
 function actorFrame(kind,identity,frame,{seed=0,variant}={}){
  if(typeof kind!=='string'||!Object.hasOwn(ACTORS,kind)||!Number.isInteger(frame)||frame<0||frame>7||variantFor(seed,identity,kind,2,variant)!==1)return null;
  return ACTORS[kind].frames[frame];
 }
 function vehicleSprite(kind,identity,{seed=0,variant}={}){
  if(typeof kind!=='string'||!Object.hasOwn(VEHICLES,kind)||identity===undefined||identity===null||variantFor(seed,identity,'vehicle:'+kind,2,variant)!==1)return null;
  return VEHICLES[kind];
 }
 function fit(sprite,x,y,w,h){
  if(!sprite||![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)return null;
  const r=sprite.rect,scale=Math.min(w/r[2],h/r[3]),dw=r[2]*scale,dh=r[3]*scale;
  return{sprite,source:r,destination:[x-dw/2,y-dh/2,dw,dh]};
 }
 function paint(c,art,frame){
  if(!frame||!c?.drawImage||!art?.images?.[frame.sprite.atlas])return false;
  if(typeof art.blit==='function')return !!art.blit(c,frame.sprite.atlas,frame.source,...frame.destination);
  c.drawImage(art.images[frame.sprite.atlas],...frame.source,...frame.destination);return true;
 }
 function measureVehicle(kind,identity,w,h,options={}){const sprite=vehicleSprite(kind,identity,options);if(!options.groundFootprint)return fit(sprite,0,0,w,h);const M=globalThis.DeadwallMetric174||(typeof require==='function'?require('./metric-contract174.js'):null),frame=sprite&&M?.footprintFrame(sprite.rect,w,h);return frame?{sprite,...frame}:null;}
 function drawActor(c,art,kind,identity,frame,size,options={}){
  const chosen=actorFrame(kind,identity,frame,options);if(!chosen||!Number.isFinite(size)||size<=0)return false;
  const spec=ASSETS[chosen.atlas],layout=ACTOR_LAYOUTS[chosen.atlas],cellW=spec.width/layout.columns,cellH=spec.height/layout.rows,scale=size/(kind==='crawler'?cellW:Math.max(cellW,cellH)),r=chosen.rect,index=ACTORS[kind].row*8+frame;
  const anchorY=layout.pivotY?.[Math.floor(index/layout.columns)]??(Math.floor(index/layout.columns)+.5)*cellH;
  return paint(c,art,{sprite:chosen,source:r,destination:[(r[0]-(index%layout.columns+.5)*cellW)*scale,(r[1]-anchorY)*scale,r[2]*scale,r[3]*scale]});
 }
 function drawDetail(c,art,o,{seed=0,variant}={}){
  if(!o||![o.x,o.y,o.w,o.h].every(Number.isFinite)||o.w<=0||o.h<=0)return false;
  const chosen=selectPair(DETAILS,o.kind,o.id,{seed,variant});if(!chosen||!art?.images?.[chosen.atlas]||!c?.drawImage)return false;
  const vertical=['hedge','fence'].includes(o.kind)&&o.h>o.w;
  c.save();c.translate(o.x+o.w/2,o.y+o.h/2);if(vertical)c.rotate(Math.PI/2);
  try{return paint(c,art,fit(chosen,0,0,vertical?o.h:o.w,vertical?o.w:o.h));}finally{c.restore();}
 }
 function drawMechanism(c,art,b,m,{seed=0,variant}={}){
  if(!b||!m||!b.completed||b.dead||![b.left,b.top,b.right,b.bottom].every(Number.isFinite))return false;
  const chosen=selectPair(MECHANISMS,m.kind,b.id,{seed,variant}),w=b.right-b.left-6,h=b.bottom-b.top-6;
  if(!chosen||!art?.images?.[chosen.atlas]||!c?.drawImage||w<=0||h<=0)return false;
  c.save();if(m.charges<=0)c.globalAlpha*=.5;
  try{return paint(c,art,fit(chosen,(b.left+b.right)/2,(b.top+b.bottom)/2,w,h));}finally{c.restore();}
 }
 function drawPlayerGear(c,art,entity,{seed=0,variant,compact=false}={}){
  if(!entity||!c?.drawImage||![entity.x,entity.y].every(Number.isFinite))return false;
  // The commander ID is intentionally restored as sentinel 0. Campaign seed
  // plus this stable owner name survives that historical ID migration.
  const chosen=PLAYER_GEAR[variantFor(seed,'commander','player-gear',2,variant)];if(!art?.images?.[chosen.atlas])return false;
  const angle=entity.visualUpperFacing??entity.facing??0;if(!Number.isFinite(angle))return false;
  const low=entity.dead||entity.visualPosture==='prone',crouch=entity.visualPosture==='crouch',scale=compact?1.1:1;
  c.save();c.translate(entity.x,entity.y);c.rotate(angle);c.scale(scale,scale);
  if(entity.invulnerable>0&&Math.floor(entity.invulnerable*10)%2===0)c.globalAlpha*=.5;
  // The existing arm, weapon, posture and leg frames keep their own animation.
  // Only a torso-attached pack changes; no new action or walking phase is made.
  try{return paint(c,art,fit(chosen,low?-6:-10,0,low?15:crouch?12:13,low?9:crouch?13:16));}finally{c.restore();}
 }
 return Object.freeze({ASSETS,ACTOR_GROUPS,ACTOR_LAYOUTS,ACTORS,VEHICLE_TYPES,VEHICLES,MECHANISM_TYPES,MECHANISMS,DETAIL_TYPES,DETAILS,PLAYER_GEAR,CUTS,UNUSED_SOURCE_CUTS,UNUSED_SOURCE_INDICES,hash,variantFor,selectPair,actorFrame,vehicleSprite,fit,paint,measureVehicle,drawActor,drawDetail,drawMechanism,drawPlayerGear});
});
