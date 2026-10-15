/* G10 spatial contexts. Earlier world generations never call this grammar. */
(function(root,factory){'use strict';
 const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
 const R=root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null);
 const api=factory(root,G,R);root.DeadwallCodexGeometry160=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,G,R){'use strict';
 const defaults=Object.freeze({attemptLimit:96,frontSetback:26,roadWidth:8,walkWidth:3.2,
  bridgeWidth:10,wallThickness:.28,contextBandWidth:8,gateWidth:3.2,terrainClearance:1,
  clusterBlockWidth:18,clusterBlockHeight:14,clusterGap:12});
 const rules=()=>({...defaults,...root.DeadwallCore?.ContextGeometryRules160});
 const contractFor=p=>p.context160?.id?p.context160:
  (root.DeadwallCodexContext160||(typeof require==='function'?require('./codex-context160.js'):null))?.get(p.programme160||p.codex);
 const box=o=>({l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h});
 const hit=(a,b,pad=0)=>G.overlap(box(a),box(b),pad);
 const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const openUsage=s=>/rue|voie|chaussee|trottoir|quai|cour|jardin|place|parking|bassin|ponton|approche|liaison|friche|allee|rangee|table|pompe|prise|filet/.test(normal(s));
 function roofFor(label){const s=normal(label);return/maison|logement|heberge|dortoir/.test(s)?'house':/hopital|clinique|soin/.test(s)?'clinic':/mairie|bureau|commande|personnel/.test(s)?'townhall':/commerce|vitrine|restauration/.test(s)?'grocer':'warehouse';}
 function rects(plan,effects={},options={}){
  const active=o=>!o.completedKey||effects.contextCompleted160?.(o.completedKey)!==true;
  return [...(plan.movement160||[]),...(plan.gates160||[]),...(plan.terrain160||[]).filter(o=>o.blocked)]
   .filter(o=>active(o)&&(!o.vehicleOnly||options.vehicle===true)&&(!options.optical||o.opaque===true));
 }
 function ellipseVehicle(o,vehicle){
  const cx=o.x+o.w/2,cy=o.y+o.h/2,rx=o.w/2,ry=o.h/2,
   centre=G.local(vehicle,cx,cy);
  if(centre.x>=0&&centre.y>=0&&centre.x<=vehicle.w&&centre.y<=vehicle.h)return true;
  const c=Math.cos(vehicle.a),s=Math.sin(vehicle.a),corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{
   const x=u*vehicle.w/2,y=v*vehicle.h/2;
   return{x:(vehicle.x+x*c-y*s-cx)/rx,y:(vehicle.y+x*s+y*c-cy)/ry};
  });
  for(let i=0;i<4;i++){
   const a=corners[i],b=corners[(i+1)%4],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,-(a.x*dx+a.y*dy)/(dx*dx+dy*dy)));
   if((a.x+t*dx)**2+(a.y+t*dy)**2<1-1e-9)return true;
  }
  return false;
 }
 function ellipseCircle(o,x,y,r){
  const rx=o.w/2,ry=o.h/2,dx=Math.abs(x-o.x-rx),dy=Math.abs(y-o.y-ry),q=(dx/rx)**2+(dy/ry)**2;
  if(q<1-1e-9)return true;if(r<=0)return false;
  let lo=0,hi=Math.max(rx*rx,ry*ry)*(Math.sqrt(q)+1);
  for(let i=0;i<40;i++){const t=(lo+hi)/2,n=(rx*dx/(t+rx*rx))**2+(ry*dy/(t+ry*ry))**2;if(n>1)lo=t;else hi=t;}
  const t=(lo+hi)/2,px=rx*rx*dx/(t+rx*rx),py=ry*ry*dy/(t+ry*ry);
  return(dx-px)**2+(dy-py)**2<r*r-1e-9;
 }
 function terrainMovement(p,plan,x,y,r=.32,vehicle=false,effects={}){
  if(!Number.isFinite(x+y+r)||r<0)return true;
  if(vehicle&&typeof vehicle==='object'&&(![vehicle.x,vehicle.y,vehicle.a,vehicle.w,vehicle.h].every(Number.isFinite)||vehicle.w<=0||vehicle.h<=0))return true;
  return rects(plan,effects,{vehicle:!!vehicle}).some(o=>o.shape==='ellipse'?
   vehicle&&typeof vehicle==='object'?ellipseVehicle(o,vehicle):ellipseCircle(o,x,y,r):
   vehicle&&typeof vehicle==='object'?G.obb(vehicle,{x:o.x+o.w/2,y:o.y+o.h/2,w:o.w,h:o.h,a:0}):G.circleRect(x,y,r,o));
 }
 function optical(p,plan,x,y,r=.05,effects={}){
  if(!Number.isFinite(x+y+r)||r<0)return true;
  return rects(plan,effects,{optical:true}).some(o=>G.circleRect(x,y,r,o));
 }
 function shell(plan,x,y,w,h,label,key,th){
  const opening=Math.min(3.2,w/3),cx=x+w/2;
  for(const edge of [y,y+h-th]){
   plan.walls.push({x,y:edge,w:cx-opening/2-x,h:th},{x:cx+opening/2,y:edge,w:x+w-cx-opening/2,h:th});
  }
  plan.walls.push({x,y,w:th,h},{x:x+w-th,y,w:th,h});
  const room={id:key,name:label,x:x+th+.4,y:y+th+.4,w:w-2*th-.8,h:h-2*th-.8};
  plan.rooms.push(room);plan.volumes160.push({id:key,x,y,w,h,z:plan.z,kind:'building',roofFamily:'industrial',entry:{x:cx,y:y-.5},exit:{x:cx,y:y+h+.5}});
  return room;
 }
 function context(plan,p,kind,x,y,w,h,extra={}){
  if(!(w>0&&h>0))return null;
  const id=p.id+':160:'+kind+':'+plan.terrain160.length;
  const o={id,kind,x,y,w,h,z:0,opaque:false,variant:G.hash(p.id,p.type,kind)%2,...extra};
  plan.terrain160.push(o);return o;
 }
 function obstacle(plan,p,kind,x,y,w,h,extra={}){
  const o={id:p.id+':160:'+kind+':'+plan.movement160.length,kind,x,y,w,h,z:0,opaque:false,...extra};
  plan.movement160.push(o);plan.visuals160.push({...o});return o;
 }
 function operation(plan,p,key,kind,barrier,anchor,supportId){
  const completedKey=p.id+':160:'+key;
  if(barrier){barrier.completedKey=completedKey;barrier.key=key;const visual=plan.visuals160.find(o=>o.id===barrier.id);if(visual)visual.completedKey=completedKey;}
  plan.operations160.push({key,kind,anchor:{...anchor,z:0},...(barrier?{barrierId:barrier.id}:{}),...(supportId?{supportId}:{})});
 }
 function requestedOperations(card){
  const value=card.operationCandidates||card.profile?.geometry?.operationCandidates||card.profile?.operations||card.contextProfile?.operations||card.operations||[];
  return value.map(o=>typeof o==='string'?o:o.kind).filter(Boolean);
 }
 function addOperations(plan,p,card){
  for(const kind of new Set(requestedOperations(card))){
   if(kind==='restoreAccess'){
    // A service spur is optional: closing it never traps the public entrance.
    const gate={id:p.id+':160:access-gate',kind:'lockGate',x:p.w/2+7,y:p.h+4,w:rules().gateWidth,h:.55,z:0,opaque:true};
    plan.gates160.push(gate);plan.visuals160.push({...gate});operation(plan,p,'access',kind,gate,{x:gate.x+gate.w/2,y:gate.y-1.2},gate.id);
   }else if(kind==='pumpBasin'){
    const width=Math.max(3,Math.min(8,p.w/4));
    const basin=context(plan,p,'water',1,p.h+4,width,8,{blocked:true,serviceBasin:true});
    const pump={id:p.id+':160:pump-control',kind:'pumpBase',x:width+2,y:p.h+4,w:1.4,h:1.1,z:0};
    plan.visuals160.push(pump);plan.movement160.push({...pump,opaque:true});
    operation(plan,p,'pump',kind,basin,{x:pump.x+pump.w/2,y:pump.y-1.2},pump.id);
   }else if(kind==='switchTrack'){
    const gate={id:p.id+':160:switch-gate',kind:'railSignal',x:p.w/2+7,y:p.h+9,w:rules().gateWidth,h:.55,z:0,opaque:true};
    plan.gates160.push(gate);plan.visuals160.push({...gate});operation(plan,p,'switch',kind,gate,{x:gate.x+gate.w/2,y:gate.y-1.2},gate.id);
   }else if(kind==='medicalCare'){
    const candidates=plan.objects.slice().sort((a,b)=>{
     const rank=o=>o.kind==='medical'?0:o.kind==='bed'?1:o.kind==='workbench'?2:3;
     return rank(a)-rank(b);
    });
    const solids=[...plan.walls,...plan.objects,...rects(plan)];let support=null,anchor=null;
    for(const object of candidates){
     const points=[{x:object.x+object.w+.5,y:object.y+object.h/2},{x:object.x-.5,y:object.y+object.h/2},
      {x:object.x+object.w/2,y:object.y-.5},{x:object.x+object.w/2,y:object.y+object.h+.5}];
     anchor=points.find(point=>!solids.some(o=>G.circleRect(point.x,point.y,.32,o)));
     if(anchor){support=object;break;}
    }
    if(!support)throw Error('Poste de soins160 sans face de travail libre : '+p.programme160);
    operation(plan,p,'care',kind,null,anchor,support.id);
   }
  }
 }
 function addLegacyContext(plan,p,card){
  if(plan.z!==0)return;
  const module=card.context160||card.module||'',name=normal(module),band=rules().contextBandWidth,right=card.contextSide160==='right',
   side={x:right?p.w+2:-10,y:2,w:band,h:Math.max(8,p.h-4)},nearX=right?p.w:-2;
  if(/port|plage|lac|coast|lake|water/.test(name)&&(card.profile?.geometry?.waterRelation!=='not-required'||card.contextSource160)){
   context(plan,p,'water',side.x,side.y,side.w,side.h,{blocked:true,...(card.contextSource160?{contextSource160:card.contextSource160}:{})});
   context(plan,p,/plage|coast/.test(name)?'bank':'quay',nearX,2,2,p.h-4);
   plan.visuals160.push({id:p.id+':160:bank:'+plan.visuals160.length,kind:/plage|coast/.test(name)?'sandBank':'riverBank',...side,z:0});
  }
  if(/montagne|mountain/.test(name)){
   context(plan,p,'cliff',side.x,side.y,side.w,side.h,{blocked:true});
   context(plan,p,'ramp',nearX,2,2,p.h-4);
   plan.visuals160.push({id:p.id+':160:cliff:'+plan.visuals160.length,kind:'cliffFace',...side,z:0});
  }
  if(/gare|rail/.test(name)||card.profile?.geometry?.waterRelation==='not-required'&&!card.contextSource160){
   const trackX=right?side.x+band-1.4:side.x;
   context(plan,p,'rail',trackX,3,1.4,p.h-6);
   context(plan,p,'quay',right?p.w+1:side.x+3,2,4,p.h-4);
   obstacle(plan,p,'railSignal',trackX+.7,2,.45,.45,{opaque:true});
  }
  if(/foret|forest/.test(name)){
   context(plan,p,'forest',side.x,side.y,side.w,side.h);
   // Only physical trunks occupy the forest band; the service corridor stays open.
   for(let i=0;i<4;i++)obstacle(plan,p,'tree',side.x+2+(i%2)*3,3+Math.floor(i/2)*Math.max(3,(p.h-8)/2),.5,.5,{opaque:true});
  }
  if(/aride|arid/.test(name)){
   context(plan,p,'arid',side.x,side.y,side.w,side.h);
   obstacle(plan,p,'shoreRock',side.x+2,4,2,1.4);
  }
  if(/routes|road/.test(name))context(plan,p,'road',p.w/2-4,-12,8,12);
  if(/camp/.test(name)){
   plan.visuals160.push({id:p.id+':160:camp',kind:'shelter',x:side.x+2,y:p.h+4,w:5,h:4,z:0});
   obstacle(plan,p,'campFence',side.x,p.h+2,5,.3,{opaque:true});
   plan.service160={kind:name.includes('hostile')?'abandoned-hostile-camp':'abandoned-allied-camp',humanFaction:false};
  }
  if(/soins|medical/.test(name))plan.service160={kind:'medical',finite:true};
  addOperations(plan,p,card);
 }
 function supplement(plan,p,card){
  if(card.profile&&card.contextProfile&&card.module&&card.module!==card.context160)addLegacyContext(plan,p,
   {...card,context160:card.module,contextSide160:'right',contextSource160:card.module,operationCandidates:[]});
 }
 function spatialOpen(p,seed,z,card){
  const K=rules(),w=p.w,h=p.h,cx=w/2,road=K.roadWidth;
  const plan={w,h,z,walls:[],objects:[],stairs:[],rooms:[],floor:{x:0,y:0,w,h},
   entry:{x:cx,y:-1},exit:{x:cx,y:h+1},style:'codex160',programme:card.id,
   terrain160:[],movement160:[],gates160:[],visuals160:[],operations160:[],volumes160:[],publicAccess160:{x:cx-road/2,y:-1,w:road,h:h+2}};
  const geometry=card.profile?.geometry||{},
   terrainProfile=normal(geometry.terrain),contextKind=card.context160,
   crossing=geometry.crossing?.type||null,
   roundabout=geometry.footprint==='annular-lane-with-tangent-arms',
   wet=geometry.waterRelation!=='not-required'&&(['water','port'].includes(contextKind)||/shore|waterfront|lake/.test(terrainProfile)),
   rail=contextKind==='rail'||geometry.waterRelation==='not-required'||/rail/.test(normal(geometry.network)),
   tube=['tunnel','rail-tunnel'].includes(crossing),
   crossRoad=contextKind==='roads'&&['connected-cross-arms','directed-ramp-branches-between-road-axes'].includes(geometry.footprint);
  if(!roundabout)context(plan,p,'road',cx-road/2,0,road,h);
  else{
   const cy=h/2,ry=Math.min(h/2-1,road+4),rx=Math.min(w/3,ry+road),innerRx=rx-road,innerRy=ry-road;
   if(innerRx<=0||innerRy<=0)throw Error('Anneau160 sans gabarit de voie : '+card.id);
   context(plan,p,'road',cx-rx,cy-ry,rx*2,ry*2,{shape:'annulus',innerRx,innerRy,allowVehicle:true});
   // Tangential arms remain inside the reserved lot and rejoin the existing
   // frontage. They do not create a fictitious upper/lower regional crossing.
   context(plan,p,'road',cx+rx-road,-8,road,cy+8);
   context(plan,p,'road',cx-rx,cy,road,h+8-cy);
   context(plan,p,'road',cx-road/2,-8,rx+road/2,road);
   context(plan,p,'road',cx-rx,h,rx+road/2,8);
   context(plan,p,'bank',cx-innerRx,cy-innerRy,innerRx*2,innerRy*2,{shape:'ellipse',blocked:true,vehicleOnly:true});
   context(plan,p,'bank',cx-K.walkWidth/2,0,K.walkWidth,h,{allowVehicle:false,pedestrianPath:true});
   plan.roundabout160={centre:{x:cx,y:cy},outer:{rx,ry},inner:{rx:innerRx,ry:innerRy},tangentArms:2,
    carPoint:{x:cx+rx-road/2,y:cy,a:Math.PI/2}};
  }
  const templates=card.parentRooms?.filter(r=>(r.z??(Array.isArray(r)?r[2]:0))===z)||[];
  const roomNames=templates.map(r=>r.name||r.title||(Array.isArray(r)?r[0]:'Usage'));
  const names=roomNames.length?roomNames:['Accueil technique','Réserve de maintenance','Accès de service'];
  if(['bridge','viaduct','rail-bridge','ford'].includes(crossing)){
   const bw=K.bridgeWidth,top=h*.35,depth=Math.max(4,h*.3),underlay=card.profile?.geometry?.crossing?.underlay,
    terrain=crossing!=='ford'&&underlay&&underlay!=='water'?'cliff':'water';
   context(plan,p,terrain,0,top,cx-bw/2,depth,{blocked:true});
   context(plan,p,terrain,cx+bw/2,top,w-cx-bw/2,depth,{blocked:true});
   context(plan,p,crossing==='ford'?'water':'bridge',cx-bw/2,top,bw,depth,{allowVehicle:true,...(crossing==='ford'?{blocked:false,depthClass:'shallow'}:{})});
   if(crossing!=='ford'){
    obstacle(plan,p,'bridgePier',cx-bw/2-.4,top,.4,depth,{opaque:true});
    obstacle(plan,p,'bridgePier',cx+bw/2,top,.4,depth,{opaque:true});
   }
  }else if(wet&&!(card.mode==='cluster'&&w<60)){
   const end=Math.max(2,cx-road/2-3);
   context(plan,p,'water',0,h*.25,end,h*.6,{blocked:true});
   context(plan,p,'quay',end,h*.2,3,h*.7);
   plan.visuals160.push({id:p.id+':160:pump',kind:'pumpBase',x:cx+road/2+1,y:h-3,w:1.4,h:1.1,z:0});
  }
  if(tube){
   const opening=K.walkWidth,door=h/2;
   for(const x of [cx-road/2-K.wallThickness,cx+road/2])plan.walls.push({x,y:0,w:K.wallThickness,h:door-opening/2},{x,y:door+opening/2,w:K.wallThickness,h:h-door-opening/2});
   plan.volumes160.push({id:p.id+':160:tunnel-roof',x:cx-road/2,y:0,w:road,h,z,kind:'building',roofFamily:'warehouse',entry:{x:cx,y:-1},exit:{x:cx,y:h+1}});
   plan.visuals160.push({id:p.id+':160:tunnel',kind:'tunnelPortal',x:cx-road/2-.7,y:0,w:road+1.4,h:2,z:0});
  }
  if(rail){
   const y=h*.65;
   // The pedestrian/road crossing is an explicit interruption of the rail fence.
   context(plan,p,'rail',0,y,cx-road/2,1.5);
   context(plan,p,'rail',cx+road/2,y,w-cx-road/2,1.5);
   context(plan,p,'quay',0,y+2,Math.max(1,cx-road/2-1),3);
   obstacle(plan,p,'railSignal',Math.max(1,cx-road/2-2),y,.45,.45,{opaque:true});
  }
  if(crossRoad)context(plan,p,'road',0,h/2-road/2,w,road);
  if(card.mode==='cluster'){
   const crossWidth=h>=80?road:K.walkWidth;
   context(plan,p,'road',0,h/2-crossWidth/2,w,crossWidth,{allowVehicle:h>=80});
   // An announced cross-site street has a real supported surface. Split the
   // water itself at that surface; never override a positive collision veto.
   const crossTop=h/2-crossWidth/2,crossBottom=crossTop+crossWidth;
   for(const water of plan.terrain160.filter(o=>o.kind==='water'&&o.blocked&&o.y<crossBottom&&o.y+o.h>crossTop)){
    plan.terrain160.splice(plan.terrain160.indexOf(water),1);
    if(water.y<crossTop)plan.terrain160.push({...water,id:water.id+':north',h:crossTop-water.y});
    if(water.y+water.h>crossBottom)plan.terrain160.push({...water,id:water.id+':south',y:crossBottom,h:water.y+water.h-crossBottom});
    context(plan,p,'bridge',water.x,crossTop,water.w,crossWidth,{allowVehicle:h>=80,...(h<80?{blocked:true,vehicleOnly:true}:{})});
   }
   const closedNames=names.filter(label=>!openUsage(label)),publicNames=names.filter(openUsage),
    closedCount=card.context160==='district'?Math.max(4,closedNames.length):closedNames.length,
    count=closedCount+publicNames.length,
    blockW=Math.min(K.clusterBlockWidth,Math.max(7,(w-road-8)/6)),
    blockH=Math.min(K.clusterBlockHeight,Math.max(6,(h-8)/2),wet&&w>=60?h*.25-K.walkWidth:Infinity),
    candidates=[];
   for(const side of [0,1])for(let y=2;y+blockH<=h-2;y+=blockH+4)
    for(let x=side?cx+road/2+2:2;x+blockW<=(side?w-2:cx-road/2-2);x+=blockW+4){
     const area={x,y,w:blockW,h:blockH};
     if(rects(plan).some(o=>hit(area,o,.5))||plan.terrain160.some(o=>['road','rail','quay'].includes(o.kind)&&hit(area,o,o.kind==='road'?.25:.8)))continue;
     candidates.push(area);
    }
   if(candidates.length<count)throw Error('Quartier160 sans emprise de circulation : '+card.id);
   const offset=G.hash(seed,card.parent,'volume160')%candidates.length;
   for(let i=0;i<count;i++){
    const area=candidates[(offset+i)%candidates.length];
    if(i<closedCount){
     const label=closedNames[i%closedNames.length]||'Réserve technique';
     shell(plan,area.x,area.y,area.w,area.h,label,p.id+':160:volume:'+i,K.wallThickness);
     plan.volumes160.at(-1).roofFamily=roofFor(label);
    }else plan.rooms.push({id:p.id+':160:public:'+i,name:publicNames[i-closedCount],...area,open:true});
   }
  }else{
   const columns=Math.max(1,Math.ceil(names.length/2)),cellH=(h-2)/columns;
   for(let i=0;i<names.length;i++){
    const side=i%2,x=side?cx+road/2+2:1,roomW=side?w-x-1:cx-road/2-3;
    plan.rooms.push({id:p.id+':160:usage:'+i,name:names[i],x,y:1+Math.floor(i/2)*cellH,w:roomW,h:cellH-.5});
   }
  }
  // Reuse the parent's finite container identities and amounts; a larger site
  // redistributes the same budget rather than paying loot per extra volume.
  const parent=R.floor(card.id,seed,z,p.id),used=[];
  for(const source of parent.objects){
   let placed=null;
   const ordered=plan.rooms.slice().sort((a,b)=>Number(b.name===source.room)-Number(a.name===source.room));
   for(const room of ordered){
    const spots=[[room.x+.45,room.y+.45],[room.x+room.w-source.w-.45,room.y+.45],
     [room.x+.45,room.y+room.h-source.h-.45],[room.x+room.w-source.w-.45,room.y+room.h-source.h-.45]];
    for(const [x,y]of spots){
     const o={...source,x,y};
     if(x<room.x+.2||y<room.y+.2||x+o.w>room.x+room.w-.2||y+o.h>room.y+room.h-.2)continue;
     if(hit(o,plan.publicAccess160,.5)||plan.walls.some(b=>hit(o,b,.15))||rects(plan).some(b=>hit(o,b,.25))||used.some(b=>hit(o,b,.25)))continue;
     if(plan.terrain160.some(b=>['road','rail','quay'].includes(b.kind)&&hit(o,b,.5)))continue;
     placed=o;break;
    }
    if(placed)break;
   }
   if(!placed)throw Error('Contenant160 sans accès physique : '+card.id+' / '+source.id);
   used.push(placed);plan.objects.push(placed);
  }
  if(p.levels.length>1){
   const stairs={id:p.id+':stairs',x:cx-1.05,y:h-3.8,w:2.1,h:2.9,levels:p.levels};
   plan.stairs.push(stairs);
  }
  if(z===0){
   if(card.mode==='cluster'&&w<60)addLegacyContext(plan,p,card);else addOperations(plan,p,card);
   if(/forest|mountain|hill-relief|mountain-gradient/.test(terrainProfile))addLegacyContext(plan,p,{...card,context160:/forest/.test(terrainProfile)?'foret-profonde':'montagne',operationCandidates:[]});
   supplement(plan,p,card);
   const adapted=new Set(['DW-0266','DW-0268','DW-0269','DW-0292','DW-0348']);
   if(adapted.has(card.parent)){
    const closed=obstacle(plan,p,'closedRuinedDeck',1,h+14,Math.min(10,w/3),6,{opaque:true});
    plan.adaptation160={fullyImplementedReference:false,scope:'single-ground-plane-visitable-route',closedDomains:[{id:closed.id,kind:'unavailable-upper-or-lower-reference-route'}]};
   }
  }
  return plan;
 }
 function sourcePlan(p,seed,z=0){
  const card=contractFor(p);if(!card||!p.levels?.includes(z))throw Error('Programme ou niveau160 absent');
  if(card.mode!=='building')return spatialOpen(p,seed,z,card);
  const base=R.floor(card.id,seed,z,p.id),template=R.template(card.id),sx=card.profile?p.w/template.w:1,sy=card.profile?p.h/(base.floor.h+.48):1,
   scale=o=>({...o,x:o.x*sx,y:o.y*sy,w:o.w*sx,h:o.h*sy}),
   result={...base,w:p.w,h:p.h,z,
   ...(card.profile?{walls:base.walls.map(scale),rooms:base.rooms.map(scale),stairs:base.stairs.map(scale),
    objects:base.objects.map(o=>({...o,x:o.x*sx,y:o.y*sy})),floor:{x:.24,y:.24,w:p.w-.48,h:p.h-.48},entry:{x:p.w/2,y:-1},exit:{x:p.w/2,y:p.h+1}}:{}),
   style:'codex160',terrain160:[],movement160:[],gates160:[],visuals160:[],operations160:[],volumes160:[]};
  if(card.profile)result.volumes160.push({id:p.id+':160:volume:0',x:0,y:0,w:p.w,h:p.h,z,kind:'building',roofFamily:'industrial',entry:{x:p.w/2,y:-1},exit:{x:p.w/2,y:p.h+1}});
  addLegacyContext(result,p,card);supplement(result,p,card);
  if(z===0&&card.parent==='DW-0294'){
   const closed=obstacle(result,p,'closedRuinedDeck',1,p.h+14,Math.min(10,p.w/3),6,{opaque:true});
   result.adaptation160={fullyImplementedReference:false,scope:'covered-station-on-authored-floor-zero',closedDomains:[{id:closed.id,kind:'unavailable-subpassage-reference-route'}]};
  }
  return result;
 }
 function architecture163(){
  const A=root.DeadwallCodexArchitecture163||(typeof require==='function'?require('./codex-architecture163.js'):null);
  if(!A)throw Error('Architecture physique163 absente.');return A;
 }
 function plan(p,seed,z=0,detailVersion=0){
  const contract=contractFor(p);
  const value=detailVersion>=12&&architecture163().supports(contract)?architecture163().plan({p,seed,z,ground:sourcePlan({...p,levels:contract.levels},seed,0),contract}):sourcePlan(p,seed,z);
  if(detailVersion<13)return value;
  const fixtures=root.DeadwallCodexFixtures164||(typeof require==='function'?require('./codex-fixtures164.js'):null);
  if(!fixtures)throw Error('Équipements sanitaires164 absents.');
  return fixtures.annotatePlan({plan:value,detailVersion});
 }
 // Revision11 adds only non-loot furnishing to the326 preserved interiors.
 // Terrain and work faces constrain placement without becoming real plan walls.
 function details(p,seed,z=0,detailVersion=0,sourcePlan=plan(p,seed,z,detailVersion)){
  const card=contractFor(p),programme=R.get(p.programme160||p.codex);
  const empty={interior:[],outdoor:[],variant:p.context160?.archetype||null,programme3000:p.programme160,
   programmeState:programme?.state||null,context160:sourcePlan};
  if(detailVersion<11||card?.profile)return empty;
  const D=root.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null);
  if(!D||!programme)throw Error('Programme ou mobilier160 absent');
  const reserved=rects(sourcePlan).map(o=>({...o}));
  for(const operation of sourcePlan.operations160||[]){
   const anchor=operation.anchor,support=[...sourcePlan.objects,...sourcePlan.visuals160,...sourcePlan.movement160,...sourcePlan.gates160].find(o=>o.id===operation.supportId);
   const target=support?{x:support.x+support.w/2,y:support.y+support.h/2}:anchor,pad=rules().terrainClearance;
   reserved.push({x:Math.min(anchor.x,target.x)-pad,y:Math.min(anchor.y,target.y)-pad,
    w:Math.abs(anchor.x-target.x)+2*pad,h:Math.abs(anchor.y-target.y)+2*pad});
  }
  const barriers=reserved.map((o,index)=>({...o,id:p.id+':reserved-furnishing162:'+index,kind:'reserved-context162',solid:true,placementOnly162:true}));
  const placementPlan={...sourcePlan,walls:[...sourcePlan.walls,...barriers]},args={seed,p,z,plan:sourcePlan,programme:programme.id,shapes:D.objects};
  let value=D.make(seed,p,z,placementPlan,{story:R.programmeProps(programme.state),family:R.detailFamily(programme.family)});
  // Keep synthetic barriers out of wall support selection and cosmetic painting.
  value={...value,interior:[...value.interior,...barriers],outdoor:value.outdoor.filter(o=>!reserved.some(barrier=>hit(o,barrier)))};
  value=R.enrich({...args,detail:value});value=R.dress({...args,detail:value});
  for(const layer of ['anchored','quantities','ensembles','fill','infill','stations','gardens','packing'])value=R[layer]({...args,detail:value});
  if(detailVersion>=12)value=R.complete({...args,detail:value,detailVersion});
  const interior=Object.freeze(value.interior.filter(o=>!o.placementOnly162)),outdoor=Object.freeze(value.outdoor.filter(o=>!o.placementOnly162));
  const colliders160=Object.freeze({interior:Object.freeze(interior.filter(o=>o.solid)),outdoor:Object.freeze(outdoor.filter(o=>o.solid))});
  return Object.freeze({...value,interior,outdoor,colliders160,programme3000:programme.id,programmeState:programme.state||null,context160:sourcePlan});
 }
 function decorate(p,seed,detailVersion=0){
  const contract=contractFor(p);
  if(detailVersion>=12&&architecture163().supports(contract)){
   p.legacyLevels160=[...contract.levels];p.levels=architecture163().levels(contract);p.architecture163=architecture163().describe(contract);
  }
  const ground=plan(p,seed,0,detailVersion);
  p.context160={...contract,operations:ground.operations160,service:ground.service160||null,
   implementation160:{...(contract.implementation160||{scope:'physical-ground-context-and-finite-parent-budget',fullyImplementedReference:false}),...(ground.adaptation160||{})}};
  return p;
 }
 const FOREST_ARCHETYPES164=new Set(['forest-rest-stop','working-forest-track','forest-working-village','compact-forest-water-capture']);
 const AGRICULTURAL_ARCHETYPES164=new Set(['agricultural-parcel-road','dispersed-farming-village','farm-well-head','field-edge-irrigation-station']);
 const RELIEF_ARCHETYPES164=new Set(['road-tunnel-tube','rail-tunnel-gallery','hilltop-stepped-village','mountain-slope-hamlet']);
 function naturalRequirements164(card){
  const required=[];
  if(card.context160==='foret-profonde'||card.family==='Forêts et filière bois'||FOREST_ARCHETYPES164.has(card.archetype))required.push('forest');
  if(card.family==='Agriculture'||AGRICULTURAL_ARCHETYPES164.has(card.archetype))required.push('agriculture');
  if(card.family==='Mines et matériaux')required.push('mineral');
  if(card.context160==='montagne'||RELIEF_ARCHETYPES164.has(card.archetype))required.push('relief');
  if(card.context160==='terre-aride')required.push('dry');
  if(card.archetype==='compact-forest-water-capture')required.push('wet');
  return Object.freeze(required);
 }
 // Only the new ecological facade opts in. Historical G10 placement, including
 // its order of IDs and physical installation attempts, stays byte-for-byte.
 function ecologyAdmission164(card,biome,biomes){
  const requirements=naturalRequirements164(card);
  if(biomes?.ecologyVersion!==1||!requirements.length)return Object.freeze({allowed:true,requirements,reasons:Object.freeze([])});
  const aliases=new Set([biome?.id,...(biomes.aliasesFor?.(biome?.id)||biomes.compatibleIds?.(biome?.id)||[])]),
   any=ids=>ids.some(id=>aliases.has(id)),pool=biome?.def?.buildings||{},
   conditions={forest:any(['deciduous','mixed','conifer','riparian'])||biome?.def?.spawnBiome==='forest',
    agriculture:pool.farmhouse>0||pool.marketgarden>0,
    mineral:pool.mine>0||pool.quarry>0,
    relief:any(['conifer','limestone','rockyHighland']),
    dry:any(['heath','limestone','agriculturalPlateau']),
    wet:any(['riparian','wetland'])};
  const reasons=Object.freeze(requirements.filter(requirement=>!conditions[requirement]));
  return Object.freeze({allowed:!reasons.length,requirements,reasons});
 }
 function populate({seed,roads,install,contracts,biomes,sectors,spawn,home,detailVersion=0}){
  if(!contracts||contracts.ids.length!==626)throw Error('Contrats160 incomplets');
  const viable=roads.filter(r=>r.roadClass!=='approach'&&Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>=55),bySector=new Map(sectors.map(s=>[s.id,s]));
  const ecological=biomes?.ecologyVersion===1,refusals={},omissions=[];
  let placed=0,rejected=0,screenedProgrammes=0,rejectedCandidates=0;const missing=[];
  for(const card of contracts.records){
   const d=contracts.preset('codex160-'+card.id.slice(3)),requirements=ecological?naturalRequirements164(card):null;
   let accepted=false,ecologicalRejects=0,placementRejects=0,compatibleCandidates=0;
   if(requirements?.length)screenedProgrammes++;
   const start=G.hash(seed,card.id,'context-road160')%viable.length;
   for(let attempt=0;attempt<rules().attemptLimit&&viable.length;attempt++){
    const r=viable[(start+attempt*83)%viable.length],a=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),side=G.hash(seed,card.id,attempt,'side160')%2?1:-1,
     f=.12+.76*G.hash(seed,card.id,attempt,'frontage160')/4294967296,
     off=r.width/2+rules().frontSetback+d.h/2+Math.floor(attempt/24)*Math.max(45,d.h*.4),
     x=r.a.x+(r.b.x-r.a.x)*f-Math.sin(a)*off*side,y=r.a.y+(r.b.y-r.a.y)*f+Math.cos(a)*off*side;
    let biome;
    if(requirements?.length){
     biome=biomes.sample(seed,x,y,false,{generation:9});
     const admission=ecologyAdmission164(card,biome,biomes);
     if(!admission.allowed){ecologicalRejects++;rejectedCandidates++;for(const reason of admission.reasons)refusals[reason]=(refusals[reason]||0)+1;continue;}
    }
    compatibleCandidates++;
    const p=install(d.id,x,y,a+(side<0?Math.PI:0),r);if(!p){placementRejects++;continue;}
    biome=biome||biomes.sample(seed,x,y,false,{generation:9});
    const distance=Math.hypot(x-home.x,y-home.y),occupancy=spawn.roll({seed,id:p.id,biome:biome.def.spawnBiome,distance});
    Object.assign(p,{generation:10,programme160:card.id,context160:card,biome:biome.id,
     occupation:occupancy.kind,distanceBand:occupancy.band,zone:'activite',
     sector:'S'+Math.floor(p.x/1024)+'_'+Math.floor(p.y/1024),
     frontier131:{role:occupancy.kind==='allied'?'relay':occupancy.kind==='infected'?'contested':'waypoint'}});
    decorate(p,seed,detailVersion);bySector.get(p.sector)?.sites.push(p.id);placed++;accepted=true;break;
   }
   if(!accepted){
    rejected++;missing.push(card.id);
    if(ecological)omissions.push(Object.freeze({id:card.id,requirements,ecologicalRejects,placementRejects,compatibleCandidates,
     reason:!viable.length?'no-road-candidate':requirements.length&&!compatibleCandidates?'no-compatible-environment':'placement-unavailable'}));
   }
  }
  return Object.freeze({generation:10,eligible:contracts.records.length,placed,rejected,unsupported:0,programmeCount:626,missing:Object.freeze(missing),
   ...(ecological?{ecology164:Object.freeze({version:1,screenedProgrammes,rejectedCandidates,refusals:Object.freeze(refusals),
    ecologicalOmissions:omissions.filter(row=>row.reason==='no-compatible-environment').length,omissions:Object.freeze(omissions)})}:{})});
 }
 return Object.freeze({plan,details,decorate,populate,terrainMovement,optical,rects,rules,naturalRequirements164,ecologyAdmission164});
});
