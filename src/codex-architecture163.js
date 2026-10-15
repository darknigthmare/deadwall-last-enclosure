/* Optional pedestrian inspection planes; authored floor IDs and finite stocks stay separate. */
(function(root,factory){'use strict';
 const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
 const api=factory(root,G);root.DeadwallCodexArchitecture163=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root,G){'use strict';
 const families=Object.freeze({
  'DW-0266':{level:1,name:'Passerelle du viaduc',limit:'Les voies automobiles dénivelées restent fermées.'},
  'DW-0268':{level:-1,name:'Galerie du passage inférieur',limit:'La chaussée basse et ses rampes automobiles restent fermées.'},
  'DW-0269':{level:1,name:'Passerelle d’inspection de l’échangeur',limit:'Les bretelles automobiles dénivelées restent fermées.'},
  'DW-0292':{level:1,name:'Inspection du passage ferroviaire supérieur',limit:'Aucun train ni raccord ferroviaire actif n’est ajouté.'},
  'DW-0294':{level:-1,name:'Quai et sous-passage du métro',limit:'La mezzanine complète et le service ferroviaire restent non réalisés.'},
  'DW-0348':{level:1,name:'Inspection supérieure de l’aqueduc',limit:'Le conduit reste hors service ; aucune distribution d’eau n’est activée.'}
 });
 const layouts=new WeakMap();
 const freeze=value=>{for(const child of Object.values(value))if(child&&typeof child==='object')freeze(child);return Object.freeze(value);};
 const parent=card=>card?.parent||card?.context160?.parent;
 const supports=card=>Object.hasOwn(families,parent(card));
 const levels=card=>{const f=families[parent(card)];return f?[0,f.level].sort((a,b)=>a-b):null;};
 function rules(){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),r=C?.ContextArchitectureRules163;
  if(!r||r.revision!==12||!['walkWidth','stairWidth','stairDepth','footRadius','clearance','railThickness','pierSpacing','maxPiers','placementLimit'].every(k=>Number.isFinite(r[k])&&r[k]>0))throw Error('Règles d’architecture163 absentes ou invalides.');
  return r;
 }
 const bounds=o=>({l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h});
 const overlaps=(a,b,pad=0)=>G.overlap(bounds(a),bounds(b),pad);
 function groundSolids(ground){return [...ground.walls,...ground.objects,...(ground.movement160||[]),...(ground.gates160||[]),...(ground.terrain160||[]).filter(o=>o.blocked&&!o.vehicleOnly)];}
 function segmentFree(solids,a,b,r){
  return !solids.some(o=>G.circleRect(a.x,a.y,r,o)||G.circleRect(b.x,b.y,r,o)||G.segmentRect(a,b,{x:o.x-r,y:o.y-r,w:o.w+2*r,h:o.h+2*r}));
 }
 function reachable(p,ground,solids,to,r){
  const from=ground.entry||{x:p.w/2,y:-1};
  for(const turn of [from,{x:from.x,y:to.y},{x:to.x,y:from.y}])if(segmentFree(solids,from,turn,r)&&segmentFree(solids,turn,to,r))return true;
  const step=r*2,queue=[{x:0,y:0}],seen=new Set(['0:0']),point=c=>({x:from.x+c.x*step,y:from.y+c.y*step}),limit=rules().placementLimit**2;
  for(let head=0;head<queue.length&&head<limit;head++){
   const at=point(queue[head]);if(Math.hypot(at.x-to.x,at.y-to.y)<=step&&segmentFree(solids,at,to,r))return true;
   for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){
    const cell={x:queue[head].x+dx,y:queue[head].y+dy},key=cell.x+':'+cell.y,next=point(cell);
    if(seen.has(key)||next.x<r||next.x>p.w-r||next.y<Math.min(from.y,-r)||next.y>p.h-r||!segmentFree(solids,at,next,r))continue;
    seen.add(key);queue.push(cell);
   }
  }
  return false;
 }
 function staircase(p,ground,r){
  const solids=groundSolids(ground),avoid=(ground.terrain160||[]).filter(o=>['road','bridge','rail','water'].includes(o.kind));
  const rooms=ground.rooms.slice().sort((a,b)=>Number(/maintenance|technique|inspection|accès/i.test(b.name))-Number(/maintenance|technique|inspection|accès/i.test(a.name)));
  let attempts=0;
  for(const room of rooms)for(const fy of [.5,.75,.25])for(const fx of [.5,.75,.25]){
   if(++attempts>r.placementLimit)break;
   const x=room.x+(room.w-r.stairWidth)*fx,y=room.y+(room.h-r.stairDepth)*fy,
    pad={id:p.id+':stairs163',x,y,w:r.stairWidth,h:r.stairDepth,levels:levels(p),architecture163:true};
   if(x<r.walkWidth/2||y<r.walkWidth/2||x+pad.w>p.w-r.walkWidth/2||y+pad.h>p.h-r.walkWidth/2)continue;
   if([...solids,...avoid].some(o=>overlaps(pad,o,r.clearance)))continue;
   const centre={x:x+pad.w/2,y:y+pad.h/2};
   if(reachable(p,ground,solids,centre,r.footRadius))return pad;
  }
  throw Error('Architecture163 sans palier accessible : '+p.programme160);
 }
 function partition(p,surfaces,r){
  const xs=[...new Set([0,p.w,...surfaces.flatMap(s=>[s.x,s.x+s.w])])].sort((a,b)=>a-b),
   ys=[...new Set([0,p.h,...surfaces.flatMap(s=>[s.y,s.y+s.h])])].sort((a,b)=>a-b),cells=[],rails=[];
  const inside=(x,y)=>surfaces.some(s=>x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h),th=r.railThickness;
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
   const x=xs[i],y=ys[j],w=xs[i+1]-x,h=ys[j+1]-y,cx=x+w/2,cy=y+h/2;
   if(!inside(cx,cy)){cells.push({x,y,w,h});continue;}
   if(!inside(x-th,cy))rails.push({x,y,w:th,h});
   if(!inside(x+w+th,cy))rails.push({x:x+w-th,y,w:th,h});
   if(!inside(cx,y-th))rails.push({x,y,w,h:th});
   if(!inside(cx,y+h+th))rails.push({x,y:y+h-th,w,h:th});
  }
  return{voids:cells,rails};
 }
 function layout(p,seed,ground,contract){
  const r=rules(),key=JSON.stringify([seed,p.w,p.h,ground.walls,ground.objects,ground.movement160,ground.gates160,ground.terrain160,r]),cached=layouts.get(p);
  if(cached?.key===key)return cached.value;
  const f=families[parent(contract)],stairs=staircase(p,ground,r),sx=stairs.x+stairs.w/2,sy=stairs.y+stairs.h/2,cy=p.h/2,margin=r.footRadius+r.clearance,
   width=f.level<0&&parent(contract)==='DW-0294'?r.walkWidth*2:r.walkWidth,
   surfaces=[{x:margin,y:cy-width/2,w:p.w-margin*2,h:width},
    {x:sx-r.walkWidth/2,y:Math.min(cy,sy)-r.walkWidth/2,w:r.walkWidth,h:Math.abs(cy-sy)+r.walkWidth}],
   parts=partition(p,surfaces,r),piers=[];
  if(f.level>0){
   const count=Math.min(r.maxPiers,Math.max(2,Math.ceil(p.w/r.pierSpacing))),size=r.footRadius*2,solids=groundSolids(ground),
    protectedAreas=[stairs,...(ground.terrain160||[]).filter(o=>['road','bridge','rail','quay'].includes(o.kind)),
     ...(ground.operations160||[]).map(o=>({x:o.anchor.x-r.walkWidth/2,y:o.anchor.y-r.walkWidth/2,w:r.walkWidth,h:r.walkWidth}))];
   for(let i=0;i<count;i++){
    const baseX=margin+(p.w-margin*2)*(i+.5)/count-size/2;let placed=null;
    for(const offset of [0,-r.walkWidth/2,r.walkWidth/2])for(const y of [cy-r.walkWidth/2,cy-r.walkWidth*2,cy+r.walkWidth*2]){
     const sizeBox={x:baseX+offset,y,w:size,h:size};
     if(sizeBox.x<margin||sizeBox.x+size>p.w-margin||y<margin||y+size>p.h-margin)continue;
     if(protectedAreas.some(o=>overlaps(sizeBox,o,r.clearance))||[...ground.walls,...ground.objects].some(o=>overlaps(sizeBox,o,r.footRadius+r.clearance)))continue;
     // A footing may be in an already blocked bank/water bed, but never seals a working access.
     if(solids.some(o=>o.completedKey&&overlaps(sizeBox,o,r.walkWidth/2)))continue;
     placed=sizeBox;break;
    }
    if(placed)piers.push({...placed,id:p.id+':163:pier:'+i,kind:'bridgePier',z:0,opaque:true,assembly163:p.id+':inspection163'});
   }
  }
  const value=freeze({stairs,surfaces,...parts,piers});layouts.set(p,{key,value});return value;
 }
 function describe(card){
  if(!supports(card))return null;const f=families[parent(card)];
  return{revision:12,parent:parent(card),levels:levels(card),addedLevel:f.level,name:f.name,pedestrianOnly:true,
   fullyImplementedReference:false,text:f.name+' accessible à pied par un escalier ; retour par le même palier. '+f.limit,
   sourceFloorIds:[0],authoredExtraFloorIds:false};
 }
 function plan({p,seed,z,ground,contract=p.context160}){
  const description=describe(contract);if(!description||!description.levels.includes(z))throw Error('Plan d’inspection163 absent.');
  const r=rules(),data=layout(p,seed,ground,contract),architecture163={...description,stairs:data.stairs,surfaces:z===0?[]:data.surfaces},
   adaptation160={...(ground.adaptation160||{}),scope:'pedestrian-inspection-on-two-explicit-planes',fullyImplementedReference:false,
    text:description.text,sourceText160:contract.implementation160?.sourceText160||contract.implementation160?.text||null,inspection163:description,
    closedDomain:'incomplete-full-reference-network',closedDomains:(ground.adaptation160?.closedDomains||[]).map(o=>({...o,kind:'unavailable-complete-author-reference-network'}))};
  if(z===0)return{...ground,stairs:[...ground.stairs,data.stairs],movement160:[...ground.movement160,...data.piers],
   visuals160:[...ground.visuals160,...data.piers],architecture163,adaptation160};
  const gallery=z<0,tag=(o,kind,index)=>({...o,id:p.id+':163:'+kind+':'+index,kind,z,opaque:gallery&&kind==='inspectionRail',assembly163:p.id+':inspection163'}),
   movement160=[...data.voids.map((o,i)=>tag(o,'unsupportedInspection',i)),...data.rails.map((o,i)=>tag(o,'inspectionRail',i))],
   terrain160=data.surfaces.map((o,i)=>({...tag(o,gallery?'quay':'bridge',i),allowVehicle:false,pedestrianPath:true}));
  if(parent(contract)==='DW-0294'){
   // Put the reserved track on the opposite side of the platform from its
   // approach; the staircase connector must never cross a blocked rail bed.
   const cy=p.h/2,above=data.stairs.y+data.stairs.h/2>=cy,
    y=above?cy-r.walkWidth-r.footRadius-r.walkWidth/2:cy+r.walkWidth+r.footRadius;
   terrain160.push({id:p.id+':163:reserved-track',kind:'rail',z,x:margin163(r),y,w:p.w-margin163(r)*2,h:r.walkWidth/2,blocked:true,allowVehicle:false});
  }
  return{w:p.w,h:p.h,z,style:'codex163',programme:p.programme160,walls:[],objects:[],stairs:[data.stairs],
   rooms:data.surfaces.map((o,i)=>({...o,id:p.id+':163:walk:'+i,name:description.name,open:true})),floor:{x:0,y:0,w:p.w,h:p.h},
   entry:{x:data.stairs.x+data.stairs.w/2,y:data.stairs.y+data.stairs.h/2},exit:{x:data.stairs.x+data.stairs.w/2,y:data.stairs.y+data.stairs.h/2},
   terrain160,movement160,gates160:[],visuals160:[],operations160:[],volumes160:[],architecture163,adaptation160};
 }
 const margin163=r=>r.footRadius+r.clearance;
 function draw(c,g,p,plan,options={}){
  if(!plan?.architecture163||!c?.fillRect)return false;const r=rules(),seed=options.seed||0,stair=plan.architecture163.stairs;
  c.save();try{
   for(const rail of plan.movement160||[])if(rail.kind==='inspectionRail'){c.fillStyle='#657569';c.fillRect(rail.x,rail.y,rail.w,rail.h);c.strokeStyle='#b6b8a0';c.lineWidth=r.railThickness/3;c.strokeRect(rail.x,rail.y,rail.w,rail.h);}
   if(plan.z!==0&&plan.architecture163.parent==='DW-0348'){
    const x=margin163(r),y=p.h/2+r.walkWidth/2+r.railThickness,w=p.w-x*2,h=r.footRadius*2;
    c.fillStyle='#747e6d';c.fillRect(x,y,w,h);c.strokeStyle='#c2bca1';c.lineWidth=r.railThickness;c.strokeRect(x,y,w,h);c.fillStyle='#434e43';c.fillRect(x+r.railThickness,y+r.railThickness,w-r.railThickness*2,h-r.railThickness*2);
   }
   const painted=root.DeadwallStructureArt159?.drawStair?.(c,g?.art,stair,{seed,poiId:p.id,floor:plan.z});
   if(!painted){c.fillStyle='#687d70';c.fillRect(stair.x,stair.y,stair.w,stair.h);c.strokeStyle='#c5c5a8';c.lineWidth=r.railThickness/2;for(let y=stair.y;y<stair.y+stair.h;y+=r.footRadius){c.beginPath();c.moveTo(stair.x,y);c.lineTo(stair.x+stair.w,y);c.stroke();}}
   c.fillStyle='#eadbab';c.font='.42px sans-serif';c.textAlign='center';c.fillText('⇅',stair.x+stair.w/2,stair.y+stair.h/2);
  }finally{c.restore();}return true;
 }
 return Object.freeze({supports,levels,describe,plan,draw});
});
