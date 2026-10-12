/* Optional revision 8: source machines and floor-level storage, after revisions 0–7.
 * Same historical plans, containers and budgets. No machine is powered by decoration.
 */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexStations170=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const TYPES=Object.freeze(['machine','pallet','crate']);
 const rules=()=> (root.DeadwallCore||(typeof require==='function'?require('./core.js'):null)).CodexInfill169Rules;
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const range=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isSafeInteger)&&v[0]>=0&&v[1]>=v[0]?v:null;
 const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 const within=(a,b,m=0)=>a.x>=b.x+m&&a.y>=b.y+m&&a.x+a.w<=b.x+b.w-m&&a.y+a.h<=b.y+b.h-m;
 const owns=(r,o)=>o.x+o.w/2>=r.x&&o.y+o.h/2>=r.y&&o.x+o.w/2<r.x+r.w&&o.y+o.h/2<r.y+r.h;
 function fronts(o){return o.service170||o.fronts169||[o.front160,o.access165].filter(Boolean);}
 function samples(f){return [[f.x+f.w/2,f.y+f.h/2],...(f.w>f.h?[[f.x+f.w*.25,f.y+f.h/2],[f.x+f.w*.75,f.y+f.h/2]]:[[f.x+f.w/2,f.y+f.h*.25],[f.x+f.w/2,f.y+f.h*.75]])];}
 function pose(cx,cy,width,depth,turn,clearance,machine){
  const vertical=turn%2,w=vertical?depth:width,h=vertical?width:depth,x=cx-w/2,y=cy-h/2,gap=.08;
  const front=[{x,y:y+h+gap,w,h:clearance},{x:x-clearance-gap,y,w:clearance,h},{x,y:y-clearance-gap,w,h:clearance},{x:x+w+gap,y,w:clearance,h}];
  return {x,y,w,h,angle170:turn*Math.PI/2,spriteWidth170:width,spriteHeight170:depth,service170:machine?front:[front[turn]]};
 }
 function enrich({seed,p,z=0,plan,detail,description,geometry:G,recipes:Q}){
  const r=rules();if(!Number.isInteger(seed)||seed<0||seed>4294967295||!p?.levels?.includes(z)||!Number.isInteger(z)||![p.w,p.h].every(n=>Number.isFinite(n)&&n>0)||!p.id||!G||!Q||!Array.isArray(description?.rooms)||!['rooms','objects','walls','stairs'].every(k=>Array.isArray(plan?.[k]))||!Array.isArray(detail?.interior)||!Array.isArray(detail?.outdoor))throw Error('Contrat des postes et stocks au sol invalide.');
  if(detail.stations170?.revision===8)return detail;
  const previous=[...plan.objects,...detail.interior,...(z===0?[...(p.outdoor||[]),...detail.outdoor]:[])];
  const cars=z===0?(p.parking||[]):[],carBoxes=cars.map(car=>{
   const pts=[[0,0],[car.w,0],[car.w,car.h],[0,car.h]].map(([x,y])=>{const a=G.global(car,x,y);return G.local(p,a.x,a.y);});
   const x=Math.min(...pts.map(a=>a.x)),y=Math.min(...pts.map(a=>a.y));return{x,y,w:Math.max(...pts.map(a=>a.x))-x,h:Math.max(...pts.map(a=>a.y))-y};
  });
  const auditPlan={...plan,objects:[...plan.objects,...carBoxes]},obstacles=[...plan.walls,...plan.stairs,...previous.filter(o=>!o.dressing160),...carBoxes];
  const base=Q.accessGrid(p,z,auditPlan,detail),keep=Q.anchorCells(p,z,plan,base),oldFronts=previous.flatMap(fronts);
  for(const f of oldFronts)for(const [x,y]of samples(f)){const i=base?.at(x,y);if(i>=0&&base.reachable[i])keep.push(i);}
  if(z===0)for(const o of [...(p.outdoor||[]),...detail.outdoor].filter(o=>!o.dressing160&&!o.surface))for(const[x,y]of [[o.x-.9,o.y+o.h/2],[o.x+o.w+.9,o.y+o.h/2],[o.x+o.w/2,o.y-.9],[o.x+o.w/2,o.y+o.h+.9]]){const i=base?.at(x,y);if(i>=0&&base.reachable[i])keep.push(i);}
  const preserved=[...new Set(keep)],added=[],requests=[],claims=new Set(),work=[],bySource=new Map();
  for(const source of description.rooms){const key=norm(source.name);bySource.set(key,bySource.has(key)?null:source);}
  const spaces=plan.rooms.flatMap((room,i)=>{const source=bySource.get(norm(room.name));return source&&!source.exterior&&(!source.levels||source.levels.includes(z))?[{room,source,key:'room-'+i,plane:'interior'}]:[];});
  if(z===0)for(const zone of detail.infill169?.zones||[]){const source=description.rooms[zone.sourceIndex];if(zone.use==='service'&&source?.id===zone.source&&source.exterior)spaces.push({room:zone,source,key:zone.id,plane:'outdoor',zone});}
  for(const space of spaces)for(const [si,spec]of (space.source.authoredProps||[]).entries()){
   if(!TYPES.includes(spec.asset))continue;const kind=spec.asset,q=range(spec.quantite_par_espace);
   const pool=previous.filter(o=>!claims.has(o.id)&&o.kind===kind&&owns(space.room,o)&&(space.plane==='interior'?plan.objects.includes(o)||detail.interior.includes(o):(p.outdoor||[]).includes(o)||detail.outdoor.includes(o)));
   const count=q?Math.min(q[0],pool.length):0;pool.slice(0,count).forEach(o=>claims.add(o.id));
   const missing=q?Math.max(0,q[0]-count):null,report={source:space.source.id,spec:si,space:space.key,name:space.room.name,kind,plane:space.plane,sourceRange:q?[...q]:null,existing:count,minimum:q?.[0]??null,target:missing===null?null:Math.min(missing,r.maxPerSpec),added:0,unplaced:missing,reason:null};requests.push(report);
   if(!q){report.reason='invalid-source-quantity';continue;}if(!missing){report.reason='minimum-present';continue;}
   if(kind==='machine'&&(space.plane!=='interior'||z!==0)){report.reason='load-bearing-enclosure-unverified';continue;}
   if(kind==='machine'&&/bedroom|living|bathroom|medical|pharmacy|dining|classroom|library/.test(space.source.kit?.id||'')){report.reason='incompatible-room-use';continue;}
   const w=spec.gabarit_m?.longueur,h=spec.gabarit_m?.largeur,height=spec.gabarit_m?.hauteur,clear=spec.degagement_min_m;
   if(![w,h,height].every(n=>Number.isFinite(n)&&n>0)||w>r.maxWidth||h>r.maxDepth||height>r.maxHeight){report.reason='unsupported-dimensions';continue;}
   if(!Number.isFinite(clear)||clear<0||clear>r.maxClearance){report.reason='unsupported-clearance';continue;}
   if(/suspend|toiture|mur uniquement|sur le mur|rail/i.test(spec.ancrage||'')){report.reason='special-support-required';continue;}
   if(!base?.baseline){report.reason='baseline-inaccessible';continue;}
   report.reason='space-or-access';work.push({space,si,spec,kind,w,h,height,clear:Math.max(clear,r.minClearance),report,exhausted:false});
  }
  const audit=items=>Q.accessGrid(p,z,auditPlan,{...detail,interior:[...detail.interior,...items.filter(o=>o.plane170==='interior')],outdoor:[...detail.outdoor,...items.filter(o=>o.plane170==='outdoor')]});
  for(let round=0;round<r.maxPerSpec&&added.length<r.maxAdded;round++){
   let progress=false;
   for(const job of work){const{space,si,spec,kind,w,h,height,clear,report}=job;
    if(job.exhausted||report.added>=report.target||added.length>=r.maxAdded)continue;
    if(added.filter(o=>o.space170===space.key).length>=r.maxPerSpace){report.reason='space-cap';job.exhausted=true;continue;}
    let chosen=null;const room=space.room,roll=G.hash('station170',seed,p.id,z,space.key,si),f=[.18,.35,.5,.65,.82];
    for(let trial=0;trial<r.attempts&&!chosen;trial++){
     const turn=(roll+trial)%4,cx=room.x+room.w*f[(trial+roll)%5],cy=room.y+room.h*f[(Math.floor(trial/5)+(roll>>>4))%5];
     const o={...pose(cx,cy,w,h,turn,clear,kind==='machine'),id:p.id+':station170:'+z+':'+space.key+':'+si+':'+report.added,kind,z,solid:true,surface:false,decor157:true,station170:true,plane170:space.plane,space170:space.key,
      source170:space.source.id,sourceSpec170:si,sourceHeight170:height,zone170:space.zone?.id||null,room:room.name,label:spec.nom||kind,utilityConnected170:false};
     if(!within(o,room,.1)||o.service170.some(a=>!within(a,room,.08)))continue;
     if(obstacles.some(b=>hit(o,b,.06))||added.some(b=>hit(o,b,.08))||[...oldFronts,...added.flatMap(fronts)].some(b=>hit(o,b,.04)))continue;
     if(o.service170.some(a=>[...obstacles.filter(b=>b.solid!==false||b.surface),...added].some(b=>hit(a,b,.03))))continue;
     const grid=audit([...added,o]);if(!grid?.baseline||preserved.some(i=>!grid.reachable[i]))continue;
     if([...added,o].flatMap(fronts).some(a=>samples(a).some(([x,y])=>{const i=grid.at(x,y);return i<0||!grid.reachable[i];})))continue;
     chosen=o;
    }
    if(chosen){added.push(chosen);report.added++;report.unplaced=report.minimum-report.existing-report.added;report.reason=report.unplaced?'capacity-or-space':'minimum-completed';progress=true;}else job.exhausted=true;
   }if(!progress)break;
  }
  return freeze({...detail,interior:[...detail.interior,...added.filter(o=>o.plane170==='interior')],outdoor:[...detail.outdoor,...added.filter(o=>o.plane170==='outdoor')],stations170:{revision:8,added:added.length,requests,navigationChecked:!!base?.baseline,preservedAnchors:preserved.length,scope:'static-source-equipment',connections:'not-simulated'}});
 }
 return Object.freeze({TYPES,fronts,samples,pose,enrich});
});
