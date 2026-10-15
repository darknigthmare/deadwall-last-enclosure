/* Opt-in revision 10: fill free-standing source minima without moving any old object. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexPacking173=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis,function(root){'use strict';
 const TYPES=Object.freeze(['shelf','counter','table','pallet','crate','stretcher','machine','fuel_can']);
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const range=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isSafeInteger)&&v[0]>=0&&v[1]>=v[0]?v:null;
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 const within=(a,b,m=0)=>a.x>=b.x+m&&a.y>=b.y+m&&a.x+a.w<=b.x+b.w-m&&a.y+a.h<=b.y+b.h-m;
 const owns=(r,o)=>o.x+o.w/2>=r.x&&o.y+o.h/2>=r.y&&o.x+o.w/2<r.x+r.w&&o.y+o.h/2<r.y+r.h;
 const fronts=o=>o.service173||o.service171||o.service170||o.fronts169||[o.front160,o.access165].filter(Boolean);
 const samples=f=>[[f.x+f.w/2,f.y+f.h/2],...(f.w>f.h?[[f.x+f.w*.25,f.y+f.h/2],[f.x+f.w*.75,f.y+f.h/2]]:[[f.x+f.w/2,f.y+f.h*.25],[f.x+f.w/2,f.y+f.h*.75]])];
 function enrich({seed,p,z=0,plan,detail,description,geometry:G,recipes:Q}){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),r=C.CodexPacking173Rules,limits=C.CodexInfill169Rules;
  const station=root.DeadwallCodexStations170||(typeof require==='function'?require('./codex-stations170.js'):null);
  if(!r||!Number.isInteger(seed)||seed<0||seed>4294967295||!p?.id||!p.levels?.includes(z)||!['rooms','walls','stairs','objects'].every(k=>Array.isArray(plan?.[k]))||!Array.isArray(detail?.interior)||!Array.isArray(detail.outdoor)||!description?.rooms||!G||!Q)throw Error('Contrat de travées intérieures invalide.');
  if(detail.packing173?.revision===r.revision)return detail;
  const previous=[...plan.objects,...detail.interior],surroundings=[...previous,...(z===0?[...(p.outdoor||[]),...detail.outdoor]:[])];
  const obstacles=[...plan.walls,...plan.stairs,...previous.filter(o=>!o.dressing160)];
  const oldFronts=surroundings.flatMap(fronts),base=Q.accessGrid(p,z,plan,detail),keep=Q.anchorCells(p,z,plan,base),added=[],requests=[],claimed=new Set();
  for(const f of oldFronts)for(const [x,y]of samples(f)){const i=base?.at(x,y);if(i>=0&&base.reachable[i])keep.push(i);}
  const sources=new Map();for(const s of description.rooms){const k=norm(s.name);sources.set(k,sources.has(k)?null:s);}
  const work=[];
  for(const [ri,room]of plan.rooms.entries()){
   const source=sources.get(norm(room.name));if(!source||source.exterior||source.levels&&!source.levels.includes(z))continue;
   for(const [si,spec]of source.authoredProps.entries()){
    if(!TYPES.includes(spec.asset))continue;const q=range(spec.quantite_par_espace),pool=previous.filter(o=>o.kind===spec.asset&&!claimed.has(o.id)&&owns(room,o));
    const existing=q?Math.min(q[0],pool.length):0;pool.slice(0,existing).forEach(o=>claimed.add(o.id));
    const missing=q?Math.max(0,q[0]-existing):null,report={room:ri,spec:si,name:room.name,kind:spec.asset,minimum:q?.[0]??null,existing,added:0,unplaced:missing,reason:null};requests.push(report);
    if(!q){report.reason='invalid-source-range';continue;}if(!missing){report.reason='minimum-present';continue;}
    if(/paroi|au mur|cloison|suspend|rail|sur le mur/i.test(spec.ancrage||'')){report.reason='fixed-support-required';continue;}
    if(spec.asset==='machine'&&(z!==0||/bedroom|living|medical|pharmacy|classroom|dining|library/.test(source.kit.id))){report.reason='structural-or-use-restriction';continue;}
    const w=spec.gabarit_m?.longueur,h=spec.gabarit_m?.largeur,height=spec.gabarit_m?.hauteur,clear=spec.degagement_min_m;
    if(![w,h,height].every(v=>Number.isFinite(v)&&v>0)||w>limits.maxWidth||h>limits.maxDepth||height>limits.maxHeight){report.reason='unsupported-dimensions';continue;}
    if(!Number.isFinite(clear)||clear<0||clear>limits.maxClearance){report.reason='unsupported-clearance';continue;}
    if(!base?.baseline){report.reason='baseline-inaccessible';continue;}
    report.reason='space-or-access';work.push({source,room,ri,si,spec,w,h,height,clear:Math.max(clear,limits.minClearance),report});
   }
  }
  for(let round=0;round<r.maxPerSpec&&added.length<r.maxAdded;round++){
   let progress=false;
   for(const job of work){const {source,room,ri,si,spec,w,h,height,clear,report}=job;
    if(job.exhausted||report.unplaced<=0||added.length>=r.maxAdded)continue;
    if(added.filter(o=>o.room173===ri).length>=r.maxPerRoom){report.reason='room-capacity';job.exhausted=true;continue;}
    const fractions=Array.from({length:r.gridSteps},(_,i)=>(i+1)/(r.gridSteps+1)),roll=G.hash(seed,p.id,z,ri,si,'packing173');let chosen=null;
    // Enumerate all cells/orientations instead of repeatedly sampling the same few positions.
    for(let k=0;k<r.maxCandidates&&!chosen;k++){
     const i=(k+roll)%(r.gridSteps*r.gridSteps*4),turn=Math.floor(i/(r.gridSteps*r.gridSteps)),n=i%(r.gridSteps*r.gridSteps);
     const cx=room.x+room.w*fractions[n%r.gridSteps],cy=room.y+room.h*fractions[Math.floor(n/r.gridSteps)];
     const pose=station.pose(cx,cy,w,h,turn,clear,['table','machine'].includes(spec.asset));
     if(['shelf','stretcher'].includes(spec.asset))pose.service170=[...pose.service170,...station.pose(cx,cy,w,h,(turn+2)%4,clear,false).service170];
     if(!within(pose,room,.1)||pose.service170.some(f=>!within(f,room,.08)))continue;
     if([...obstacles,...added].some(o=>hit(pose,o,.06))||[...oldFronts,...added.flatMap(fronts)].some(f=>hit(pose,f,.04)))continue;
     if(pose.service170.some(f=>[...obstacles,...added].some(o=>(o.solid!==false||o.surface)&&hit(f,o,.03))))continue;
     const item={...pose,id:p.id+':packing173:'+z+':'+ri+':'+si+':'+report.added,kind:spec.asset,z,solid:true,surface:false,decor157:true,packing173:true,station170:true,room173:ri,source173:sourceId(source),sourceSpec173:si,room:room.name,label:spec.nom||spec.asset,sourceHeight173:height,utilityConnected173:false,...(spec.asset==='table'?{profile165:'dining'}:{})};
     const proposal=[...added,item],audit=Q.accessGrid(p,z,plan,detail,proposal);
     if(!audit?.baseline||keep.some(i=>!audit.reachable[i])||proposal.flatMap(fronts).some(f=>samples(f).some(([x,y])=>{const i=audit.at(x,y);return i<0||!audit.reachable[i];})))continue;
     chosen=item;
    }
    if(chosen){added.push(chosen);report.added++;report.unplaced--;report.reason=report.unplaced?'space-or-capacity':'minimum-completed';progress=true;}else job.exhausted=true;
   }if(!progress)break;
  }
  return freeze({...detail,interior:[...detail.interior,...added],packing173:{revision:r.revision,added:added.length,requests,navigationChecked:!!base?.baseline,scope:'append-only-authored-minima'}});
 }
 function sourceId(s){return s.id||s.name;}
 return Object.freeze({TYPES,fronts,samples,enrich});
});
