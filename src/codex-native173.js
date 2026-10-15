/* Separate native-layout laboratory. G1–G8 plans and saved site IDs never change here. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexNative173=api;if(typeof module==='object'&&module.exports)module.exports=api;})(globalThis,function(root){'use strict';
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const deps=()=>({C:root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R:root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null),G:root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null)});
 function build(id,seed=17117){
  const {C,R,G}=deps(),r=C.CodexNative173Rules;
  if(typeof id!=='string'||!/^DW-\d{4}$/.test(id)||!R.get(id)||!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Programme ou graine native invalide.');
  const card=R.get(id),reference=R.template(id),description=R.describe(id);
  if(!R.preset('codex3000-'+id.slice(3))||!R.enabled(card,{townKind:'grande-ville'}))return freeze({id,seed,supported:false,scope:'native-layout-laboratory',reason:'specialized-terrain-required',reference:reference.reference});
  const requested=new Set([0,...reference.reference.levels,...description.rooms.flatMap(s=>s.levels||[])]);
  if([...requested].some(z=>!Number.isInteger(z)||z<r.minLevel||z>r.maxLevel))return freeze({id,seed,supported:false,reason:'unsupported-source-level',scope:'native-layout-laboratory'});
  const levels=Array.from({length:Math.max(...requested)-Math.min(...requested)+1},(_,i)=>i+Math.min(...requested));
  const spaces=[],issues=[];let count=0;
  for(const [si,s]of description.rooms.entries()){
   const q=s.repeat,valid=Array.isArray(q)&&q.length===2&&q.every(Number.isSafeInteger)&&q[0]>=0&&q[1]>=q[0];
   if(!valid){issues.push({source:s.id,reason:'invalid-repeat-range'});continue;}
   const repetitions=q[0]+G.hash(seed,id,s.id,'repetitions173')%(q[1]-q[0]+1);
   let choices=s.levels;
   if(!Array.isArray(choices)||!choices.length){
    const n=norm(s.name),upper=levels.find(z=>z>0),lower=levels.find(z=>z<0);
    choices=[upper!==undefined&&/chambre|dortoir|etage/.test(n)?upper:lower!==undefined&&/cave|sous.sol/.test(n)?lower:0];
    issues.push({source:s.id,reason:'level-inferred',levels:choices.slice()});
   }
   for(let n=0;n<repetitions;n++){
    if(++count>r.maxSpaces)throw Error('Capacité du laboratoire dépassée ; aucun espace supprimé silencieusement.');
    const z=choices[n%choices.length];
    const specified=Array.isArray(s.area)&&s.area.length===2&&s.area.every(Number.isFinite)&&s.area[0]>0&&s.area[1]>=s.area[0];
    const furnitureArea=s.authoredProps.reduce((sum,p)=>sum+(p.quantite_par_espace?.[0]||0)*((p.gabarit_m?.longueur||0)+(p.degagement_min_m||0))*((p.gabarit_m?.largeur||0)+(p.degagement_min_m||0)),0);
    const desired=Math.max(s.exterior?r.defaultYardArea:r.defaultRoomArea,furnitureArea/r.furnitureOccupancy);
    const area=specified?Math.min(s.area[1],Math.max(s.area[0],desired)):desired;
    const w=Math.max(r.minimumRoomSide,Math.sqrt(area)),h=Math.max(r.minimumRoomSide,area/w);
    spaces.push({id:id+':native:'+si+':'+n,source:s.id,sourceIndex:si,occurrence:n,name:s.name,z,exterior:s.exterior===true,w,h,sourceArea:specified?s.area.slice():null,sourceRepeat:q.slice(),areaInferred:!specified});
    if(specified&&w*h>s.area[1]+1e-8)issues.push({source:s.id,reason:'minimum-door-clearance-exceeds-area-range'});
   }
  }
  const indoor=spaces.filter(s=>!s.exterior),columns=[r.minimumRoomSide,r.minimumRoomSide];
  for(const z of levels)indoor.filter(s=>s.z===z).forEach((s,i)=>columns[i%2]=Math.max(columns[i%2],s.w));
  columns[0]=columns[1]=Math.max(...columns);
  const w=columns[0]+columns[1]+r.corridor+4*r.wall,mid=columns[0]+2*r.wall+r.corridor/2;
  const floors=[],allDoors=[],transitions=[];let largestH=r.stairLength+4;
  for(const z of levels){
   const rooms=indoor.filter(s=>s.z===z),walls=[],doors=[];let y=r.wall+1;
   const wall=(x,y,w,h)=>{if(w>1e-8&&h>1e-8)walls.push({x,y,w,h});};
   for(let i=0;i<rooms.length;i+=2){
    const pair=rooms.slice(i,i+2),rowH=Math.max(...pair.map(s=>s.h));
    for(let side=0;side<pair.length;side++){
     const s=pair[side];s.x=side?mid+r.corridor/2+r.wall:mid-r.corridor/2-r.wall-s.w;s.y=y;
     wall(s.x-r.wall,y-r.wall,s.w+2*r.wall,r.wall);wall(s.x-r.wall,y+s.h,s.w+2*r.wall,r.wall);
     const outerX=side?s.x+s.w:s.x-r.wall,doorX=side?s.x-r.wall:s.x+s.w,doorY=y+s.h/2;
     wall(outerX,y,r.wall,s.h);wall(doorX,y,r.wall,s.h/2-r.door/2);wall(doorX,doorY+r.door/2,r.wall,s.h/2-r.door/2);
     doors.push({id:s.id+':door',source:s.source,room:s.id,z,x:side?s.x:s.x+s.w,y:doorY,width:r.door,axis:'y',corridor:{x:mid,y:doorY},inside:{x:side?s.x+.8:s.x+s.w-.8,y:doorY}});
    }y+=rowH+2*r.wall;
   }
   const h=y+r.stairLength+2*r.wall;largestH=Math.max(largestH,h);
   const stairs=levels.length>1?[{id:id+':stairs:'+z,x:mid-r.stairWidth/2,y:y+.5,w:r.stairWidth,h:r.stairLength,levels:levels.slice()}]:[];
   floors.push({z,rooms,walls,doors,objects:[],stairs,floor:{x:0,y:0,w,h},entry:{x:mid,y:-1},exit:{x:mid,y:h+1},style:'native173',programme:id,connectorOnly:rooms.length===0});
   allDoors.push(...doors);
  }
  // Align the shared shaft on every level; different floor populations cannot move a landing.
  for(const f of floors){f.floor.h=largestH;f.exit.y=largestH+1;if(f.stairs[0])f.stairs[0].y=largestH-r.stairLength-.5;
   f.walls.push({x:0,y:0,w:mid-r.door/2,h:r.wall},{x:mid+r.door/2,y:0,w:w-mid-r.door/2,h:r.wall},{x:0,y:largestH-r.wall,w:mid-r.door/2,h:r.wall},{x:mid+r.door/2,y:largestH-r.wall,w:w-mid-r.door/2,h:r.wall},{x:0,y:0,w:r.wall,h:largestH},{x:w-r.wall,y:0,w:r.wall,h:largestH});
  }
  for(let i=1;i<levels.length;i++)transitions.push({id:id+':stairs-link:'+i,from:levels[i-1],to:levels[i],x:mid,y:largestH-r.stairLength/2-.5,mode:'foot',kind:'stairs',bidirectional:true});
  const yards=[],yardPaths=[];const ends=new Map(levels.map(z=>[z,1]));
  for(const s of spaces.filter(s=>s.exterior)){
   s.x=w+r.yardLane*2;s.y=ends.get(s.z);ends.set(s.z,s.y+s.h+r.yardLane);
   const zone={...s,support:s.z===0?'ground':'requires-structural-validation',boundary:'zone-reservation',roofed:false};yards.push(zone);
   yardPaths.push({id:s.id+':path',z:s.z,source:s.source,width:r.yardLane,points:[{x:mid,y:largestH+1},{x:w+r.yardLane,y:largestH+1},{x:w+r.yardLane,y:s.y+s.h/2},{x:s.x,y:s.y+s.h/2}],requiresStructure:s.z!==0});
  }
  const plot={x:0,y:0,w:Math.max(w,...yards.map(s=>s.x+s.w))+r.yardLane,h:Math.max(largestH+3,...yards.map(s=>s.y+s.h))+r.yardLane};
  const max=reference.reference.max;
  if(plot.w>max[0]||plot.h>max[1])issues.push({reason:'plot-exceeds-source-envelope',required:[plot.w,plot.h],sourceMax:max.slice()});
  return freeze({id,name:card.name,seed,supported:true,scope:'native-layout-laboratory-not-campaign',p:{id:'native-'+id,type:'codex3000-'+id.slice(3),codex:id,w,h:largestH,x:w/2,y:largestH/2,a:0,levels,outdoor:[],parking:[]},plot,floors,yards,yardPaths,doors:allDoors,transitions,issues,reference:reference.reference,sourceAccess:description.access,
   summary:{sourceSpaces:description.rooms.length,instances:spaces.length,indoor:indoor.length,outdoor:yards.length,levels:levels.length,doors:allDoors.length,stairs:transitions.length,sourceMinRepeats:description.rooms.reduce((n,s)=>n+(s.repeat?.[0]||0),0)}});
 }

 const detailCache=new WeakMap();
 function details(model,z=0){
  const f=floor(model,z);if(!detailCache.has(model))detailCache.set(model,new Map());const cache=detailCache.get(model);if(cache.has(z))return cache.get(z);
  const {C,R,G}=deps(),desc=R.describe(model.id),Q=root.DeadwallCodexRecipes159||(typeof require==='function'?require('./codex3000-recipes159.js'):null),A=root.DeadwallCodexAnchors160||(typeof require==='function'?require('./codex-anchors160.js'):null),I=root.DeadwallCodexInfill169||(typeof require==='function'?require('./codex-infill169.js'):null);
  const reserved=f.doors.map(door=>{const room=f.rooms.find(r=>r.id===door.room),x=Math.min(door.corridor.x,room.x+room.w/2),right=Math.max(door.corridor.x,room.x+room.w/2),b={x:x-.1,y:door.y-C.CodexNative173Rules.door/2,w:right-x+.2,h:C.CodexNative173Rules.door};return{...b,id:door.id+':reserved-way',kind:'reserved-native-way',solid:false,surface:false,reserved173:true,front160:{...b}};});
  const args={seed:model.seed,p:model.p,z,plan:f,programme:model.id};let value={interior:reserved,outdoor:[]};
  value=R.anchored({...args,detail:value});value=R.quantities({...args,detail:value});value=R.ensembles({...args,detail:value});value=R.fill({...args,detail:value});
  value=I.enrich({...args,detail:value,description:{...desc,rooms:desc.rooms.filter(s=>!s.exterior)},geometry:G,recipes:Q,anchors:A});
  value=R.stations({...args,detail:value});value=R.packing({...args,detail:value});
  const gardens=z===0?gardenDetails(model,desc):[];
  const out=freeze({...value,interior:value.interior.filter(o=>!o.reserved173),outdoor:gardens,scope:'native-laboratory-no-loot'});cache.set(z,out);return out;
 }
 function gardenDetails(model,desc){
  const {C,R,G}=deps(),r=C.CodexNative173Rules,Q=root.DeadwallCodexRecipes159||(typeof require==='function'?require('./codex3000-recipes159.js'):null),D=root.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null),J=root.DeadwallCodexGardens171||(typeof require==='function'?require('./codex-gardens171.js'):null),out=[];
  const intersects=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
  for(const zone of model.yards.filter(s=>s.z===0&&/jardin|potager|verger|terrasse|cour commune|cour familiale/.test(norm(s.name)))){
   const gate=zone.y+zone.h/2,parts=[{x:zone.x,y:zone.y,w:zone.w,h:.15},{x:zone.x,y:zone.y+zone.h-.15,w:zone.w,h:.15},{x:zone.x+zone.w-.15,y:zone.y,w:.15,h:zone.h},{x:zone.x,y:zone.y,w:.15,h:zone.h/2-r.door/2},{x:zone.x,y:gate+r.door/2,w:.15,h:zone.h/2-r.door/2}];
   const fences=parts.map((p,i)=>({...p,id:zone.id+':fence:'+i,kind:'fence',z:0,solid:true,decor157:true,source173:zone.source,room:zone.name}));out.push(...fences);
   const options=desc.gardenOptions.filter(k=>k.minArea<=zone.w*zone.h&&(R.detailFamily(desc.family)==='residence'||!['pool','playset'].includes(k.unique)));
   if(!options.length)continue;const choice=options[G.hash(model.seed,zone.id,'native-garden173')%options.length];
   const lane={x:zone.x,y:gate-r.door/2,w:zone.w*.55,h:r.door};
   for(const [index,kind]of choice.modules.entries()){
    const shape=D.objects[kind]||Q.EXTRA_SHAPES[kind];if(!shape)continue;
    for(let trial=0;trial<r.gardenAttempts;trial++){
     const n=(trial+G.hash(model.seed,zone.id,kind))%36,cx=zone.x+zone.w*(.1+(n%6)*.16),cy=zone.y+zone.h*(.1+Math.floor(n/6)*.16),pose=J.pose(cx,cy,shape[0],shape[1],trial%4,.8,kind);
     const box=pose,inside=b=>b.x>zone.x+.3&&b.y>zone.y+.3&&b.x+b.w<zone.x+zone.w-.3&&b.y+b.h<zone.y+zone.h-.3;
     if(!inside(box)||pose.service171.some(f=>!inside(f))||intersects(box,lane,.1)||out.some(o=>intersects(box,o,.1)||(o.service171||[]).some(f=>intersects(box,f,.05)))||pose.service171.some(f=>out.some(o=>intersects(f,o,.05))))continue;
     out.push({...pose,id:zone.id+':garden:'+index,kind,z:0,solid:shape[2]===true,surface:shape[2]!==true,decor157:true,garden171:true,source173:zone.source,gardenProfile173:choice.id,room:zone.name});break;
    }
   }
  }return out;
 }

 function floor(model,z=0){const value=model?.floors?.find(f=>f.z===z);if(!value)throw Error('Étage natif absent.');return value;}
 function blocked(model,x,y,z=0,radius=.32){
  if(![x,y,radius].every(Number.isFinite)||radius<0)return true;const {G}=deps(),f=floor(model,z);
  const bounds=z===0?model.plot:model.p;if(x<radius||y<radius||x>bounds.w-radius||y>bounds.h-radius)return true;
  const d=details(model,z);return [...f.walls,...d.interior.filter(o=>o.solid),...d.outdoor.filter(o=>o.solid)].some(b=>G.circleRect(x,y,radius,b));
 }
 function moveLevel(model,state,direction){
  if(!state||![state.x,state.y].every(Number.isFinite)||!model.p.levels.includes(state.z)||![-1,1].includes(direction))throw Error('Transition native invalide.');
  if(state.mode&&state.mode!=='foot')return{ok:false,state:{...state},reason:'stairs-foot-only'};
  const to=state.z+direction,edge=model.transitions.find(t=>(t.from===state.z&&t.to===to)||(t.to===state.z&&t.from===to));
  if(!edge||Math.hypot(state.x-edge.x,state.y-edge.y)>1.2||blocked(model,edge.x,edge.y,to))return{ok:false,state:{...state},reason:'landing-unavailable'};
  return{ok:true,state:{...state,x:edge.x,y:edge.y,z:to}};
 }
 return Object.freeze({build,floor,details,blocked,moveLevel});
});
