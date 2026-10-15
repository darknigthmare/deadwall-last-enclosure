/* Shared original context components; only explicit G10 fields request these optional atlases. */
(function(root,factory){'use strict';
 const dependency=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const api=factory(root,dependency('DeadwallInteriorArt153','./interior-art153.js'),dependency('DeadwallWorldPropsArt153','./world-props-art153.js'),dependency('DeadwallNatureArt153','./nature-art153.js'));
 root.DeadwallContextArt160=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,Interior,Props,Nature){'use strict';
 const freeze=value=>{for(const item of Object.values(value))if(item&&typeof item==='object')freeze(item);return Object.freeze(value);};
 const ASSETS=freeze({"civilRail160":{"url":"assets/art160/civil-rail.png","width":1536,"height":1024,"matte":"none","lazy":true},"waterPort160":{"url":"assets/art160/water-port.png","width":1536,"height":1024,"matte":"none","lazy":true},"shoreServices160":{"url":"assets/art160/shore-services.png","width":1536,"height":1024,"matte":"none","lazy":true}});
 const CUTS=freeze({"bridgePier":[{"atlas":"civilRail160","rect":[35,12,313,231],"variant":0,"pivot":[0.5,1]},{"atlas":"civilRail160","rect":[420,13,310,234],"variant":1,"pivot":[0.5,1]}],"tunnelPortal":[{"atlas":"civilRail160","rect":[807,12,307,235],"variant":0,"pivot":[0.5,1]},{"atlas":"civilRail160","rect":[1198,12,297,234],"variant":1,"pivot":[0.5,1]}],"railTrack":[{"atlas":"civilRail160","rect":[17,330,350,128],"variant":0,"pivot":[0.5,1]},{"atlas":"civilRail160","rect":[399,330,353,127],"variant":1,"pivot":[0.5,1]}],"railSwitch":[{"atlas":"civilRail160","rect":[786,271,348,212],"variant":0,"pivot":[0.5,1]},{"atlas":"civilRail160","rect":[1170,272,346,210],"variant":1,"pivot":[0.5,1]}],"platformCanopy":[{"atlas":"civilRail160","rect":[16,545,354,192],"variant":0,"pivot":[0.5,1]},{"atlas":"civilRail160","rect":[398,545,357,193],"variant":1,"pivot":[0.5,1]}],"railSignal":[{"atlas":"civilRail160","rect":[920,514,81,242],"variant":0,"pivot":[0.5,1]},{"atlas":"civilRail160","rect":[1267,514,152,242],"variant":1,"pivot":[0.5,1]}],"locomotive":[{"atlas":"civilRail160","rect":[16,790,359,189],"variant":0,"pivot":[0.5,1]},{"atlas":"civilRail160","rect":[398,787,356,190],"variant":1,"pivot":[0.5,1]}],"freightWagon":[{"atlas":"civilRail160","rect":[777,808,366,169],"variant":0,"pivot":[0.5,1]},{"atlas":"civilRail160","rect":[1160,812,367,158],"variant":1,"pivot":[0.5,1]}],"pumpBase":[{"atlas":"waterPort160","rect":[66,24,360,223],"variant":0,"pivot":[0.5,1]},{"atlas":"waterPort160","rect":[514,27,339,224],"variant":1,"pivot":[0.5,1]}],"pumpRotor":[{"atlas":"waterPort160","rect":[940,50,195,196],"variant":0,"pivot":[0.5,0.5]},{"atlas":"waterPort160","rect":[1258,50,195,195],"variant":1,"pivot":[0.5,0.5]}],"valveBody":[{"atlas":"waterPort160","rect":[95,290,306,215],"variant":0,"pivot":[0.5,1]},{"atlas":"waterPort160","rect":[530,291,283,201],"variant":1,"pivot":[0.5,1]}],"valveWheel":[{"atlas":"waterPort160","rect":[933,294,220,211],"variant":0,"pivot":[0.5,0.5]},{"atlas":"waterPort160","rect":[1253,291,222,214],"variant":1,"pivot":[0.5,0.5]}],"lockGate":[{"atlas":"waterPort160","rect":[51,536,363,238],"variant":0,"pivot":[0.065,0.5]},{"atlas":"waterPort160","rect":[502,534,350,241],"variant":1,"pivot":[0.065,0.5]}],"craneBase":[{"atlas":"waterPort160","rect":[937,523,232,243],"variant":0,"pivot":[0.5,1]},{"atlas":"waterPort160","rect":[1256,523,229,242],"variant":1,"pivot":[0.5,1]}],"craneBoom":[{"atlas":"waterPort160","rect":[35,843,444,121],"variant":0,"pivot":[0.075,0.8]},{"atlas":"waterPort160","rect":[508,835,453,132],"variant":1,"pivot":[0.075,0.8]}],"craneHook":[{"atlas":"waterPort160","rect":[1050,781,96,207],"variant":0,"pivot":[0.5,1]},{"atlas":"waterPort160","rect":[1316,781,96,208],"variant":1,"pivot":[0.5,1]}],"waterTower":[{"atlas":"shoreServices160","rect":[111,10,159,302],"variant":0,"pivot":[0.5,1]},{"atlas":"shoreServices160","rect":[485,6,169,309],"variant":1,"pivot":[0.5,1]}],"treatmentBasin":[{"atlas":"shoreServices160","rect":[785,9,338,298],"variant":0,"pivot":[0.5,1]},{"atlas":"shoreServices160","rect":[1170,9,340,305],"variant":1,"pivot":[0.5,1]}],"waterFilter":[{"atlas":"shoreServices160","rect":[68,324,244,225],"variant":0,"pivot":[0.5,1]},{"atlas":"shoreServices160","rect":[444,320,249,233],"variant":1,"pivot":[0.5,1]}],"reed":[{"atlas":"shoreServices160","rect":[778,314,352,234],"variant":0,"pivot":[0.5,1]},{"atlas":"shoreServices160","rect":[1175,320,338,238],"variant":1,"pivot":[0.5,1]}],"shoreRock":[{"atlas":"shoreServices160","rect":[37,562,326,214],"variant":0,"pivot":[0.5,1]},{"atlas":"shoreServices160","rect":[408,564,327,224],"variant":1,"pivot":[0.5,1]}],"cliffFace":[{"atlas":"shoreServices160","rect":[782,555,349,258],"variant":0,"pivot":[0.5,1]},{"atlas":"shoreServices160","rect":[1174,561,331,246],"variant":1,"pivot":[0.5,1]}],"sandBank":[{"atlas":"shoreServices160","rect":[21,805,347,208],"variant":0,"pivot":[0.5,1]},{"atlas":"shoreServices160","rect":[400,802,354,205],"variant":1,"pivot":[0.5,1]}],"riverBank":[{"atlas":"shoreServices160","rect":[780,813,356,194],"variant":0,"pivot":[0.5,1]},{"atlas":"shoreServices160","rect":[1163,813,353,194],"variant":1,"pivot":[0.5,1]}]});
 const ROOF_TYPES=freeze({residence:'residence',industrial:'warehouse',cottage:'house',farm:'farmhouse',collective:'apartments',hotel:'hotel',retail:'mall',civic:'townhall',school:'school',clinic:'clinic',workshop:'garage',service:'fuel',greenhouse:'garden'});
 const RISE=freeze({railSignal:1.1,platformCanopy:1.1,tunnelPortal:.35,waterTower:1.6,waterFilter:.2});
 function valid(o){return !!o&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0;}
 function hash(seed,id,kind){let h=(Number.isFinite(seed)?seed>>>0:0)^2166136261;for(const c of String(id??'')+':'+kind){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 function select(kind,identity,{seed=0,variant}={}){if(!Object.hasOwn(CUTS,kind==='closedRuinedDeck'?'cliffFace':kind))return null;const a=CUTS[kind==='closedRuinedDeck'?'cliffFace':kind],index=Number.isSafeInteger(variant)?((variant%a.length)+a.length)%a.length:hash(seed,identity,kind)%a.length;return a[index];}
 function measure(kind,o,{seed=0,variant=o?.variant,angle=0}={}){
  if(!valid(o)||!Number.isFinite(angle))return null;const sprite=select(kind,o.id,{seed,variant});if(!sprite)return null;
  const h=o.h+(RISE[kind]||0),scale=Math.min(o.w/sprite.rect[2],h/sprite.rect[3]),w=sprite.rect[2]*scale,dh=sprite.rect[3]*scale;
  return {sprite,source:sprite.rect,destination:[o.x+(o.w-w)/2,o.y+o.h-dh,w,dh],footprint:{x:o.x,y:o.y,w:o.w,h:o.h},angle};
 }
 function request(art,key){if(!art?.images?.[key]&&typeof art?.ensure==='function')art.ensure(key);}
 function paint(c,art,frame,{angle=frame?.angle||0,alpha=1}={}){
  if(!frame||!c?.drawImage)return false;const s=frame.sprite,img=art?.images?.[s.atlas];if(!img){request(art,s.atlas);return false;}
  const d=frame.destination;c.save();try{c.globalAlpha*=Math.max(0,Math.min(1,alpha));
   if(angle){const x=d[0]+d[2]*s.pivot[0],y=d[1]+d[3]*s.pivot[1];c.translate(x,y);c.rotate(angle);if(art.blit)return !!art.blit(c,s.atlas,s.rect,d[0]-x,d[1]-y,d[2],d[3]);c.drawImage(img,...s.rect,d[0]-x,d[1]-y,d[2],d[3]);}
   else if(art.blit)return !!art.blit(c,s.atlas,s.rect,...d);else c.drawImage(img,...s.rect,...d);return true;
  }finally{c.restore();}
 }
 function drawSprite(c,art,o,options={}){return paint(c,art,measure(o?.kind,o,options),options);}
 function transform(c,p){c.translate(p.x,p.y);c.rotate(p.a||0);c.translate(-p.w/2,-p.h/2);}
 function globalPoint(p,x,y){const a=p.a||0,dx=x-p.w/2,dy=y-p.h/2;return{x:p.x+Math.cos(a)*dx-Math.sin(a)*dy,y:p.y+Math.sin(a)*dx+Math.cos(a)*dy};}
 function bounds(p,o){const points=[[o.x,o.y],[o.x+o.w,o.y],[o.x,o.y+o.h],[o.x+o.w,o.y+o.h]].map(([x,y])=>globalPoint(p,x,y));return{l:Math.min(...points.map(q=>q.x)),r:Math.max(...points.map(q=>q.x)),t:Math.min(...points.map(q=>q.y)),b:Math.max(...points.map(q=>q.y))};}
 function inView(p,o,view){if(!view||![view.l,view.r,view.t,view.b].every(Number.isFinite))return true;const q=bounds(p,o);return q.r>=view.l&&q.l<=view.r&&q.b>=view.t&&q.t<=view.b;}
 function complete(g,world,key){if(!key)return false;return g?.contextOperations160?.isComplete?.(key)===true||world?.contextCompleted160?.(key)===true;}
 function fullKey(p,plan,o){if(o.completedKey)return o.completedKey;const kind=o.kind==='pumpBase'?'pumpBasin':o.kind==='railSwitch'?'switchTrack':o.kind==='valveBody'?'restoreAccess':null;const op=kind&&plan?.operations160?.find(q=>q.kind===kind&&(!q.supportId||q.supportId===o.id));return op?p.id+':160:'+op.key:null;}
 function pose(g,p,plan,o,{world}={}){const key=fullKey(p,plan,o),job=key?g?.contextOperations160?.presentation?.(key):null,progress=job&&Number.isFinite(job.progress)?Math.max(0,Math.min(1,job.progress)):0;
  return Object.freeze({fullKey:key,active:!!job,kind:job?.kind||null,progress,elapsed:job?.elapsed??0,complete:complete(g,world,key),angle:job?(g?.settings?.reducedMotion?0:progress*Math.PI*6):0});
 }
 function fallback(c,o,seed=0){if(!valid(o))return false;const metal=hash(seed,o.id,o.kind)%2?'#7c8074':'#8b8069';c.save();try{c.fillStyle=metal;c.strokeStyle='#39463c';c.lineWidth=.05;
  if(o.kind==='railSignal'){c.fillRect(o.x+o.w*.43,o.y,o.w*.14,o.h);c.fillStyle='#354238';c.fillRect(o.x+o.w*.25,o.y,o.w*.5,o.h*.55);}
  else if(o.kind==='tunnelPortal'){c.fillRect(o.x,o.y,o.w*.16,o.h);c.fillRect(o.x+o.w*.84,o.y,o.w*.16,o.h);c.fillRect(o.x,o.y,o.w,o.h*.2);}
  else if(['shoreRock','cliffFace'].includes(o.kind)){c.beginPath();c.moveTo(o.x,o.y+o.h*.8);c.lineTo(o.x+o.w*.16,o.y+o.h*.1);c.lineTo(o.x+o.w*.65,o.y);c.lineTo(o.x+o.w,o.y+o.h*.65);c.closePath();c.fill();}
  else if(o.kind==='pumpBase'||o.kind==='waterFilter'){c.fillRect(o.x,o.y+o.h*.7,o.w,o.h*.3);c.fillRect(o.x+o.w*.18,o.y+o.h*.15,o.w*.35,o.h*.65);c.fillRect(o.x+o.w*.62,o.y+o.h*.3,o.w*.3,o.h*.4);c.fillRect(o.x,o.y+o.h*.4,o.w*.2,o.h*.15);}
  else if(o.kind==='shelter'){c.fillStyle='#776f4e';c.beginPath();c.moveTo(o.x,o.y+o.h);c.lineTo(o.x+o.w*.5,o.y);c.lineTo(o.x+o.w,o.y+o.h);c.closePath();c.fill();}
  else c.fillRect(o.x,o.y,o.w,o.h);return true;
 }finally{c.restore();}}
 const forestSelections=new WeakMap();
 function ecology(world){return world?.ecologyVersion===1?world.biomes:root.DeadwallBiomes135;}
 function forestKind(o,p,world,seed,index,x,y){
  const provider=ecology(world);let state=forestSelections.get(o);const key=[seed,world?.generation,world?.ecologyVersion||0,p.x,p.y,p.a||0,p.w,p.h,o.id,o.x,o.y,o.w,o.h].join(':');
  if(!state||state.world!==world||state.provider!==provider||state.key!==key){state={world,provider,key,kinds:[]};forestSelections.set(o,state);}
  if(state.kinds[index])return state.kinds[index];const point=globalPoint(p,x,y);
  const botanical=provider?.pickTree?.(seed,point.x,point.y,o.id+':'+index,{generation:world?.generation??10}),biome=botanical?null:world?.biomeAt?.(point.x,point.y),species=Object.keys(biome?.def?.trees||{oak:1});
  const kind=botanical?.species||species[hash(seed,o.id,index)%species.length]||'oak';state.kinds[index]=Nature?.TREES?.includes(kind)?kind:'oak';return state.kinds[index];
 }
 const physicalTrees=new WeakMap();
 function physicalTree(o,p,world,seed){
  const provider=ecology(world),key=[seed,world?.generation,world?.ecologyVersion||0,p.x,p.y,p.a||0,p.w,p.h,o.id,o.x,o.y,o.w,o.h,o.species].join(':');let cached=physicalTrees.get(o);
  if(cached?.world===world&&cached.provider===provider&&cached.key===key)return cached.tree;
  const x=o.x+o.w/2,y=o.y+o.h/2,species=Nature?.TREES?.includes(o.species)?o.species:forestKind(o,p,world,seed,0,x,y),def=provider?.TREES?.[species],range=def?.canopy;
  const canopy=Array.isArray(range)&&range.length===2&&range.every(n=>Number.isFinite(n)&&n>0)?range[0]+hash(seed,o.id,'canopy')/4294967296*(range[1]-range[0]):3;
  const tree={id:o.id,species,x,y,r:Math.min(o.w,o.h)/2,canopy,a:hash(seed,o.id,'tree-angle')/4294967296*Math.PI*2,point:globalPoint(p,x,y),bark:def?.bark||'#715d41',crown:def?.crown||'#51653e'};
  physicalTrees.set(o,{world,provider,key,tree});return tree;
 }
 function treeFallback(c,t,seed,alpha){
  c.save();try{c.translate(t.x,t.y);c.rotate(t.a);c.globalAlpha*=alpha;c.fillStyle=t.bark;c.beginPath();c.arc(0,0,t.r,0,Math.PI*2);c.fill();c.strokeStyle=t.bark;c.lineWidth=Math.max(.04,t.r*.5);
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*t.canopy*.65,Math.sin(a)*t.canopy*.65);c.stroke();}
   c.fillStyle=t.crown;
   if(['pine','fir'].includes(t.species)){c.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,r=t.canopy*(i%2?.5:.8+hash(seed,t.id,i)/4294967296*.2),x=Math.cos(a)*r,y=Math.sin(a)*r*.88;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fill();}
   else{const narrow=t.species==='poplar',drooping=t.species==='willow';for(let i=0;i<7;i++){const a=i*Math.PI/3,r=t.canopy*(.34+hash(seed,t.id,i)/4294967296*.08),x=i===6?0:Math.cos(a)*r,y=i===6?0:Math.sin(a)*r;c.beginPath();c.ellipse(x*(narrow?.6:1),y,t.canopy*(narrow?.3:.52),t.canopy*(drooping?.59:.48),0,0,Math.PI*2);c.fill();}}
   return true;
  }finally{c.restore();}
 }
 function drawVisual(c,g,p,plan,o,options={}){
  if(!valid(o))return false;const art=g?.art,seed=options.world?.seed??g?.world?.seed??0,state=pose(g,p,plan,o,options);
  // The small native footprint is the trunk collider, not the size of its crown.
  if(o.kind==='tree'){const t=physicalTree(o,p,options.world??g?.world,seed),v=options.v,alpha=v&&Math.hypot(v.x-t.point.x,v.y-t.point.y)<t.canopy?.32:.97;return Nature?.drawTree?.(c,art,t,{seed,alpha})||treeFallback(c,t,seed,alpha);}
  if(o.kind==='bridgePier'&&o.h>o.w*5){c.save();try{c.fillStyle='#7b8071';c.fillRect(o.x,o.y,o.w,o.h);const n=Math.min(64,Math.ceil(o.h/Math.max(.7,o.w*3)));for(let i=0;i<n;i++){const part={...o,id:o.id+':'+i,y:o.y+i*o.h/n,h:o.h/n};drawSprite(c,art,part,{seed,variant:select(o.kind,o.id,{seed,variant:o.variant})?.variant});}}finally{c.restore();}return true;}
  if(o.kind==='shelter'){const done=Props?.drawSprite?.(c,art,'tent',o.id,o.x+o.w/2,o.y+o.h/2,o.w,o.h,{seed});return done||fallback(c,o,seed);}
  if(state.complete&&o.completedKey&&['lockGate','railSignal'].includes(o.kind)){
   const rest={...o,x:o.x,y:o.y,w:Math.min(.4,o.w),h:o.h};return drawSprite(c,art,rest,{seed})||fallback(c,rest,seed);
  }
  const done=drawSprite(c,art,o,{seed})||fallback(c,o,seed);
  if(o.kind==='pumpBase'){
   const rotor={id:o.id+':rotor',kind:'pumpRotor',x:o.x+o.w*.65,y:o.y+o.h*.3,w:o.w*.28,h:o.h*.45,variant:select(o.kind,o.id,{seed,variant:o.variant})?.variant};
   drawSprite(c,art,rotor,{seed,angle:state.active&&state.kind==='pumpBasin'?state.angle:0});
  }else if(o.kind==='valveBody'){
   const wheel={id:o.id+':wheel',kind:'valveWheel',x:o.x+o.w*.35,y:o.y+o.h*.02,w:o.w*.42,h:o.h*.52,variant:select(o.kind,o.id,{seed,variant:o.variant})?.variant};drawSprite(c,art,wheel,{seed,angle:state.angle});
  }
  // Maintenance progress follows its real owner; a gate stays closed until the physical completion.
  if(state.active&&state.kind==='restoreAccess'&&o.kind==='lockGate'){c.save();c.strokeStyle='#c0b986';c.lineWidth=.05;c.beginPath();const x=o.x+o.w*.065,y=o.y+o.h*.5;c.arc(x,y,.13,state.angle,state.angle+Math.PI*1.5);c.stroke();c.restore();}
  if(o.kind==='railSignal'&&o.completedKey){c.save();c.strokeStyle=state.active?'#c4b986':'#8c8773';c.lineWidth=Math.min(.12,o.h*.35);c.beginPath();c.moveTo(o.x+Math.min(.5,o.w),o.y+o.h*.5);c.lineTo(o.x+o.w,o.y+o.h*.5);c.stroke();c.restore();}
  return done;
 }
 function surfaceColor(kind,drained=false){return kind==='water'?(drained?'#5d6253':'#3f6f72'):kind==='bank'?'#9b9273':kind==='cliff'?'#696d61':kind==='forest'?'#455a3b':kind==='arid'?'#a19575':kind==='bridge'?'#8c8775':kind==='rail'?'#766f5d':kind==='quay'?'#9a9887':kind==='ramp'?'#8f8e76':'#77796b';}
 function drawTerrain(c,g,p,plan,options={}){
  if(!p?.context160||!Array.isArray(plan?.terrain160)||!c?.fillRect)return false;let drawn=false;const floor=options.v?.z??plan.z??0,seed=options.world?.seed??g?.world?.seed??0,art=g?.art;
  for(const o of plan.terrain160){if(!valid(o)||(o.z??0)!==floor||!inView(p,o,options.view))continue;const drained=complete(g,options.world,o.completedKey);c.save();try{
   c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();if(o.shape==='ellipse'){c.beginPath();c.ellipse(o.x+o.w/2,o.y+o.h/2,o.w/2,o.h/2,0,0,Math.PI*2);c.clip();}const ring=o.kind==='road'&&o.shape==='annulus'&&Number.isFinite(o.innerRx)&&Number.isFinite(o.innerRy)&&o.innerRx>0&&o.innerRy>0&&o.innerRx<o.w/2&&o.innerRy<o.h/2;if(ring){c.beginPath();c.ellipse(o.x+o.w/2,o.y+o.h/2,o.w/2,o.h/2,0,0,Math.PI*2);c.ellipse(o.x+o.w/2,o.y+o.h/2,o.innerRx,o.innerRy,0,0,Math.PI*2);c.clip('evenodd');}c.fillStyle=surfaceColor(o.kind,drained);c.fillRect(o.x,o.y,o.w,o.h);drawn=true;
   if(o.kind==='rail'){
    const vertical=o.h>o.w,length=vertical?o.h:o.w,count=Math.max(1,Math.min(128,Math.ceil(length/3)));
    for(let i=0;i<count;i++){const at=i*length/count,size=length/count,part={id:o.id+':'+i,kind:'railTrack',x:vertical?o.x:o.x+at,y:vertical?o.y+at:o.y,w:vertical?o.h/count:o.w/count,h:vertical?o.w:o.h,variant:o.variant};
     if(vertical){c.save();c.translate(o.x+o.w/2,o.y+at+size/2);c.rotate(Math.PI/2);part.x=-size/2;part.y=-o.w/2;part.w=size;part.h=o.w;drawSprite(c,art,part,{seed});c.restore();}else drawSprite(c,art,part,{seed});}
    c.strokeStyle='#b0b0a0';c.lineWidth=.06;c.beginPath();if(vertical){c.moveTo(o.x+o.w*.28,o.y);c.lineTo(o.x+o.w*.28,o.y+o.h);c.moveTo(o.x+o.w*.72,o.y);c.lineTo(o.x+o.w*.72,o.y+o.h);}else{c.moveTo(o.x,o.y+o.h*.28);c.lineTo(o.x+o.w,o.y+o.h*.28);c.moveTo(o.x,o.y+o.h*.72);c.lineTo(o.x+o.w,o.y+o.h*.72);}c.stroke();
   }else if(['road','bridge','ramp','quay'].includes(o.kind)){
    c.strokeStyle=o.kind==='quay'?'#686c60':'#c2bc99';c.lineWidth=.045;c.setLineDash(o.kind==='road'?[1.3,1.2]:[]);if(ring){c.beginPath();c.ellipse(o.x+o.w/2,o.y+o.h/2,o.w/2-.08,o.h/2-.08,0,0,Math.PI*2);c.ellipse(o.x+o.w/2,o.y+o.h/2,o.innerRx+.08,o.innerRy+.08,0,0,Math.PI*2);c.stroke();}else c.strokeRect(o.x+.08,o.y+.08,Math.max(.01,o.w-.16),Math.max(.01,o.h-.16));
   }else if(o.kind==='water'&&!drained){
    // Ambient ripples are presentation only, on the simulation clock and clipped to actual water.
    const drift=g?.settings?.reducedMotion?0:Math.sin((g?.elapsed||0)*.8+hash(seed,o.id,'water')%7)*.12;c.strokeStyle='rgba(191,208,184,.28)';c.lineWidth=.035;c.beginPath();const rows=Math.min(40,Math.ceil(o.h/1.2));for(let i=1;i<rows;i++){const y=o.y+i*o.h/rows;c.moveTo(o.x+.15,y+drift);c.lineTo(o.x+o.w-.15,y-drift);}c.stroke();
   }else if(o.kind==='forest'){
    const count=Math.max(1,Math.min(24,Math.ceil(o.w*o.h/18)));for(let i=0;i<count;i++){const q=hash(seed,o.id,i),x=o.x+.4+(q%1000)/1000*Math.max(0,o.w-.8),y=o.y+.4+((q>>>10)%1000)/1000*Math.max(0,o.h-.8);const kind=forestKind(o,p,options.world,seed,i,x,y);Nature?.drawSprite?.(c,art,kind,o.id+':'+i,x,y,1.8,2.1,{seed});}
   }
  }finally{c.restore();}}
  return drawn;
 }
 function viewerInside(v,p,volume){if(!v||![v.x,v.y].every(Number.isFinite)||(v.z??0)!==(volume.z??0))return false;const a=p.a||0,dx=v.x-p.x,dy=v.y-p.y,x=dx*Math.cos(a)+dy*Math.sin(a)+p.w/2,y=-dx*Math.sin(a)+dy*Math.cos(a)+p.h/2;return x>volume.x&&x<volume.x+volume.w&&y>volume.y&&y<volume.y+volume.h;}
 function roofEntry(g,p,volume,options){
  const item={id:volume.id,type:ROOF_TYPES[volume.roofFamily]||volume.roofFamily||'warehouse'},seed=options.world?.seed??g?.world?.seed??0;
  return{kind:'context-roof160',id:volume.id+':roof',depth:bounds(p,volume).b,draw(c){c.save();try{transform(c,p);if(!Interior?.drawRoof?.(c,g?.art,item,volume,{seed})){c.fillStyle='#717165';c.fillRect(volume.x,volume.y,volume.w,volume.h);}c.strokeStyle='#c0b597';c.lineWidth=.1;c.strokeRect(volume.x,volume.y,volume.w,volume.h);}finally{c.restore();}}};
 }
 function depthEntries(g,p,plan,options={}){
  if(!p?.context160||!plan)return[];const result=[],floor=options.v?.z??plan.z??0;
  for(const o of plan.visuals160||[]){if(!valid(o)||(o.z??0)!==floor)continue;const rise=RISE[o.kind]||0;let visual={...o,y:o.y-rise,h:o.h+rise};if(o.kind==='tree'){const t=physicalTree(o,p,options.world??g?.world,options.world?.seed??g?.world?.seed??0),r=t.canopy*(Math.abs(Math.cos(t.a))+Math.abs(Math.sin(t.a)));visual={x:t.x-r,y:t.y-r,w:r*2,h:r*2};}if(!inView(p,visual,options.view))continue;
   result.push({kind:'context-visual160',id:o.id,depth:bounds(p,o).b,draw(c){c.save();try{transform(c,p);drawVisual(c,g,p,plan,o,options);}finally{c.restore();}}});
  }
  for(const volume of plan.volumes160||[])if(valid(volume)&&(volume.z??0)===floor&&inView(p,volume,options.view)&&!viewerInside(options.v,p,volume))result.push(roofEntry(g,p,volume,options));
  return result;
 }
 function drawWorld(c,g,v,view){
  const world=v?.world;if(!world?.contextSites160||typeof world.contextPlan160!=='function')return false;const entries=[];let drawn=false;
  for(const p of world.contextSites160()){if(!p.context160||!p.levels?.includes(v.z??0)||!inView(p,{x:-16,y:-16,w:p.w+32,h:p.h+32},view))continue;const plan=world.contextPlan160(p,v.z??0);c.save();try{transform(c,p);drawn=drawTerrain(c,g,p,plan,{world,v,view})||drawn;}finally{c.restore();}entries.push(...depthEntries(g,p,plan,{world,v,view}));}
  entries.sort((a,b)=>a.depth-b.depth||String(a.id).localeCompare(String(b.id)));for(const entry of entries){entry.draw(c);drawn=true;}return drawn;
 }
 return Object.freeze({ASSETS,CUTS,FAMILIES:CUTS,RISE,ROOF_TYPES,select,measure,pose,drawSprite,drawVisual,drawTerrain,viewerInside,depthEntries,drawWorld});
});
