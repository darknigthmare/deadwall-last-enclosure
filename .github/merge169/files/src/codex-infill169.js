/* Revision 7: bounded, append-only completion of source furniture and real yard zones. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexInfill169=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const SHAPES=freeze({bin:[.6,.75,true],cabinet:[1,.6,true],locker:[.45,.5,true],stretcher:[2.1,.75,true],fuel_can:[.35,.19,true]});
 const TYPES=Object.freeze([...Object.keys(SHAPES),'bench','sign']);
 const rules=()=> (root.DeadwallCore||(typeof require==='function'?require('./core.js'):null)).CodexInfill169Rules;
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 const within=(a,b,m=0)=>a.x>=b.x+m&&a.y>=b.y+m&&a.x+a.w<=b.x+b.w-m&&a.y+a.h<=b.y+b.h-m;
 const owns=(r,o)=>o.x+o.w/2>=r.x&&o.y+o.h/2>=r.y&&o.x+o.w/2<r.x+r.w&&o.y+o.h/2<r.y+r.h;
 const rect=o=>({x:o.x,y:o.y,w:o.w,h:o.h});
 const validRange=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isSafeInteger)&&v[0]>=0&&v[1]>=v[0];
 const fronts=o=>o.fronts169||[o.front160,o.access165].filter(Boolean);
 function requestedCount(range,hash){if(!validRange(range))return null;const cap=rules().maxPerSpec,lo=Math.min(cap,range[0]),hi=Math.min(cap,range[1]);return lo+(hash>>>0)%(hi-lo+1);}
 function yardUse(room){
  if(!room.exterior||!room.levels?.includes(0))return null;
  const name=norm(room.name);
  if(/suspend|toiture|haut|pont|quai|berge|bassin|voie|route|rail|piste|stationnement|parking|poids lourd/.test(name))return null;
  if(/^(jardin[s]?|pelouse[s]?|parc|prairie|pepiniere)$/.test(name))return 'garden';
  if(/^(cour[s]?|cour de service|cour materiaux|cour a cagettes|cour grumes|arriere-cours|parvis|allee)$/.test(name))return 'service';
  return null;
 }
 function zonesFor(p,description){
  const r=rules(),mid=p.w/2,plots=[{x:-8,y:p.h+2.3,w:mid+5.6,h:18},{x:mid+2.4,y:p.h+2.3,w:mid+5.6,h:18}];
  const zones=[],refusals=[];
  for(const [index,source] of description.rooms.entries()){
   if(!source.exterior||!source.levels?.includes(0))continue;const use=yardUse(source);
   if(!use){refusals.push({source:source.id,reason:'specialized-exterior'});continue;}
   const slot=plots[zones.length];
   if(!slot||zones.length>=r.maxYardZones){refusals.push({source:source.id,reason:'yard-zone-cap'});continue;}
   if(!Array.isArray(source.area)||!source.area.every(Number.isFinite)||source.area[0]<=0||source.area[1]<source.area[0]){refusals.push({source:source.id,reason:'source-area-absent'});continue;}
   if(slot.w*slot.h<source.area[0]){refusals.push({source:source.id,reason:'source-area-does-not-fit'});continue;}
   zones.push({id:p.id+':zone169:'+index,source:source.id,sourceIndex:index,name:source.name,use,...slot,
    sourceArea:[...source.area],area:slot.w*slot.h,scope:'reserved-yard-area',boundary:'existing-only'});
  }
  return {zones,refusals};
 }
 // Direction zero faces +Y; the collider and every service face turn with the sprite.
 function freePose(cx,cy,width,depth,turn,clearance,both=false){
  const a=turn*Math.PI/2,c=Math.round(Math.cos(a)),s=Math.round(Math.sin(a));
  const box=(u,v,w,h)=>{const x=cx+c*u-s*v,y=cy+s*u+c*v,vertical=turn%2;return{x:x-(vertical?h:w)/2,y:y-(vertical?w:h)/2,w:vertical?h:w,h:vertical?w:h};};
  const item=box(0,0,width,depth),faces=[box(0,(depth+clearance)/2+.08,width,clearance)];
  if(both)faces.push(box(0,-(depth+clearance)/2-.08,width,clearance));
  return {...item,angle169:a,spriteWidth169:width,spriteHeight169:depth,fronts169:faces,support169:'floor'};
 }
 function enrich({seed,p,z=0,plan,detail,description,geometry:G,recipes:Q,anchors:A}){
  const r=rules();
  if(!Number.isInteger(seed)||seed<0||seed>4294967295||!p?.id||![p.w,p.h].every(n=>Number.isFinite(n)&&n>0)||!Number.isInteger(z)||!p.levels?.includes(z)||!G||!Q||!A||!Array.isArray(description?.rooms)||!['rooms','objects','walls','stairs'].every(k=>Array.isArray(plan?.[k]))||!Array.isArray(detail?.interior)||!Array.isArray(detail?.outdoor))throw Error('Contrat de compléments source invalide.');
  if(detail.infill169?.revision===7)return detail;
  const zoneInfo=z===0?zonesFor(p,description):{zones:[],refusals:[]},requests=[],added=[],claims=[],claimed=new Set();
  // Conservative car bounds participate in the raster too, not merely in prop overlap.
  const cars=z===0?(p.parking||[]):[],carBounds=cars.map(car=>{
   const points=[[0,0],[car.w,0],[car.w,car.h],[0,car.h]].map(([x,y])=>{const q=G.global(car,x,y);return G.local(p,q.x,q.y);});
   const x=Math.min(...points.map(q=>q.x)),y=Math.min(...points.map(q=>q.y));return{x,y,w:Math.max(...points.map(q=>q.x))-x,h:Math.max(...points.map(q=>q.y))-y};
  });
  const auditPlan=carBounds.length?{...plan,objects:[...plan.objects,...carBounds]}:plan;
  const base=Q.accessGrid(p,z,auditPlan,detail),keep=Q.anchorCells(p,z,plan,base);
  const existing=[...plan.objects,...detail.interior,...(z===0?[...(p.outdoor||[]),...detail.outdoor]:[])];
  const oldFronts=existing.flatMap(fronts),occupied=[...plan.walls,...plan.stairs,...existing,...carBounds];
  const keepPoint=(x,y)=>{const i=base?.at(x,y);if(i>=0&&base.reachable[i])keep.push(i);};
  for(const f of oldFronts)keepPoint(f.x+f.w/2,f.y+f.h/2);
  // Preserve available approaches to old finite outdoor containers and decorations.
  if(z===0)for(const o of [...(p.outdoor||[]),...detail.outdoor].filter(o=>!o.surface&&!o.dressing160))for(const [x,y] of [[o.x-.9,o.y+o.h/2],[o.x+o.w+.9,o.y+o.h/2],[o.x+o.w/2,o.y-.9],[o.x+o.w/2,o.y+o.h+.9]])keepPoint(x,y);
  const preserved=[...new Set(keep)];
  const sources=new Map();for(const source of description.rooms){const key=norm(source.name);sources.set(key,sources.has(key)?null:source);}
  const spaces=plan.rooms.flatMap((room,i)=>{const source=sources.get(norm(room.name));return source&&!source.exterior&&(!source.levels||source.levels.includes(z))?[{room,source,key:'room-'+i,plane:'interior'}]:[];});
  for(const zone of zoneInfo.zones)spaces.push({room:zone,source:description.rooms[zone.sourceIndex],key:zone.id,plane:'outdoor',zone});
  const parcel={x:-11,y:-15,w:p.w+22,h:p.h+39};
  const perSpace=new Map();
  const audits=()=>Q.accessGrid(p,z,auditPlan,{...detail,interior:[...detail.interior,...added.filter(o=>o.plane169==='interior')],outdoor:[...detail.outdoor,...added.filter(o=>o.plane169==='outdoor')]});
  const vehicleHit=o=>cars.some(car=>{const c=G.local(p,car.x,car.y);return G.obb({x:o.x+o.w/2,y:o.y+o.h/2,w:o.w+.1,h:o.h+.1,a:0},{x:c.x,y:c.y,w:car.w,h:car.h,a:car.a-p.a});});
  function acceptable(o,space){
   if(!within(o,space.room,-.18)||!within(o,parcel,.1)||o.fronts169.some(f=>!within(f,space.room,-.18)))return false;
   if(space.plane==='outdoor'&&hit(o,{x:-.5,y:-.5,w:p.w+1,h:p.h+1}))return false;
   if(occupied.some(b=>hit(o,b,.035))||oldFronts.some(b=>hit(o,b,.04))||added.some(b=>hit(o,b,.06)||fronts(b).some(f=>hit(o,f,.04)))||vehicleHit(o))return false;
   if(o.fronts169.some(f=>occupied.some(b=>(b.solid!==false||b.surface)&&hit(f,b,.025))||added.some(b=>hit(f,b,.025))||vehicleHit(f)))return false;
   if(!base?.baseline||o.fronts169.some(f=>{const i=base.at(f.x+f.w/2,f.y+f.h/2);return i<0||!base.reachable[i];}))return false;
   return true;
  }
  for(const space of spaces){
   const {source,room}=space,seen=new Set();
   for(const [si,spec] of (source.authoredProps||[]).entries()){
    if(!TYPES.includes(spec.asset))continue;
    const kind=spec.asset,target=requestedCount(spec.quantite_par_espace,G.hash('infill169',seed,p.id,z,space.key,si));
    const prior=existing.filter(o=>o.kind===kind&&!claimed.has(o.id)&&owns(room,o)&&(space.plane==='outdoor'?((p.outdoor||[]).includes(o)||detail.outdoor.includes(o)):plan.objects.includes(o)||detail.interior.includes(o)));
    const report={source:source.id,sourceIndex:si,name:source.name,kind,plane:space.plane,zone:space.zone?.id||null,space:space.key,
     sourceRange:validRange(spec.quantite_par_espace)?[...spec.quantite_par_espace]:null,target,existing:0,added:0,unplaced:0,capped:validRange(spec.quantite_par_espace)&&spec.quantite_par_espace[1]>r.maxPerSpec,reason:null};requests.push(report);
    if(seen.has(kind)){report.reason='duplicate-prescription';continue;}seen.add(kind);
    if(target===null){report.reason='invalid-source-range';continue;}
    for(const o of prior.slice(0,target)){claimed.add(o.id);report.existing++;claims.push({id:o.id,source:source.id,spec:si,zone:space.zone?.id||null,scope:'existing-kind-presence'});}
    report.unplaced=Math.max(0,target-report.existing);
    if(!report.unplaced){report.reason='already-present';continue;}
    if(!base?.baseline){report.reason='baseline-inaccessible';continue;}
    if(space.plane==='outdoor'&&!['bin','bench','sign'].includes(kind)){report.reason='requires-building-support';continue;}
    if(kind==='bin'&&['kitchen','pantry','pharmacy'].includes(source.kit?.id)){report.reason='clean-storage-conflict';continue;}
    const width=spec.gabarit_m?.longueur,depth=spec.gabarit_m?.largeur,height=spec.gabarit_m?.hauteur,clear=spec.degagement_min_m;
    if(![width,depth,height].every(n=>Number.isFinite(n)&&n>0)||width>r.maxWidth||depth>r.maxDepth||height>r.maxHeight){report.reason='unsupported-source-dimensions';continue;}
    if(!Number.isFinite(clear)||clear<0||clear>r.maxClearance){report.reason='unsupported-source-clearance';continue;}
    const clearance=Math.max(r.minClearance,clear),supports=A.supportedWalls(room,plan.walls),offset=G.hash('infill169-pose',seed,p.id,z,space.key,si);
    for(let ordinal=report.existing;ordinal<target&&added.length<r.maxAdded&&(perSpace.get(space.key)||0)<r.maxPerSpace;ordinal++){
     let chosen=null;
     for(let trial=0;trial<r.attempts&&!chosen;trial++){
      let pose;
      if(space.plane==='interior'&&!['stretcher','fuel_can'].includes(kind)){
       if(!supports.length)break;const support=supports[(trial+offset)%supports.length],fraction=((offset>>>8)+Math.floor(trial/supports.length)*173)%997/996;
       const anchored=A.pose(support,room,width,depth,fraction,clearance);if(!anchored)continue;
       pose={...rect(anchored),angle169:anchored.angle160,spriteWidth169:width,spriteHeight169:depth,fronts169:[anchored.front160],support169:{...anchored.support160,type:'wall'}};
      }else{
       const turn=space.plane==='outdoor'?(room.x<p.w/2?3:1):(trial+offset)%2;
       const fraction=(G.hash(offset,trial,ordinal)%997)/996;
       const cx=space.plane==='outdoor'?(room.x<p.w/2?room.x+room.w-depth/2-.15:room.x+depth/2+.15):room.x+room.w*(.25+.5*fraction);
       const cy=room.y+room.h*(.18+.64*((trial*7+ordinal*3)%17)/16);
       pose=freePose(cx,cy,width,depth,turn,clearance,kind==='stretcher');
       // Face toward the existing central garden lane, not through a perimeter fence.
       if(space.plane==='outdoor'){
        const shift=clearance+.18;pose.x+=room.x<p.w/2?-shift:shift;pose.fronts169.forEach(f=>{f.x+=room.x<p.w/2?-shift:shift;});
       }
      }
      const o={...pose,id:p.id+':infill169:'+z+':'+space.key+':'+si+':'+ordinal,kind,label:spec.nom||kind,z,solid:true,surface:false,decor157:true,infill169:true,
       plane169:space.plane,source169:source.id,sourceSpec169:si,zone169:space.zone?.id||null,height169:height,programme:description.id,room:room.name,
       functional169:false};
      if(!acceptable(o,space))continue;
      added.push(o);const audit=audits(),newFronts=added.flatMap(fronts),okay=audit?.baseline&&preserved.every(i=>audit.reachable[i])&&newFronts.every(f=>{const i=audit.at(f.x+f.w/2,f.y+f.h/2);return i>=0&&audit.reachable[i];});
      if(!okay){added.pop();continue;}chosen=o;
     }
     if(!chosen)break;report.added++;perSpace.set(space.key,(perSpace.get(space.key)||0)+1);
    }
    report.unplaced=Math.max(0,target-report.existing-report.added);report.reason=report.unplaced?(added.length>=r.maxAdded?'layer-cap':'space-or-access'):'complete';
   }
  }
  return freeze({...detail,interior:[...detail.interior,...added.filter(o=>o.plane169==='interior')],outdoor:[...detail.outdoor,...added.filter(o=>o.plane169==='outdoor')],
   infill169:{revision:7,added:added.length,requests,claims,zones:zoneInfo.zones,zoneRefusals:zoneInfo.refusals,
    navigationChecked:!!base?.baseline,preservedAnchors:preserved.length,scope:'append-only-source-complements',connections:'not-simulated'}});
 }
 return Object.freeze({get RULES(){return rules();},SHAPES,TYPES,norm,yardUse,zonesFor,requestedCount,freePose,fronts,enrich});
});
