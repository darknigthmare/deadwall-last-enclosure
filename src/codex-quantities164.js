/* Opt-in revision 4: complete authored furniture series without replacing a saved object. */
(function(root,factory){'use strict';const api=factory();root.DeadwallCodexQuantities164=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const RULES=Object.freeze({revision:4,maxAdded:24,maxPerRoom:6,maxPerKind:8,maxSlotsPerWall:32,
  gap:.12,minClearance:.8,maxClearance:1.8,maxWidth:4,maxDepth:2.5});
 // Repeatable physical furniture only; unsupported assets remain prescriptions.
 // Technical fittings do not gain invented plumbing/power points or production.
 const TYPES=Object.freeze(['bed','sofa','wardrobe','shelf','desk','workbench','counter','medical']);
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 const owns=(room,o)=>o.x+o.w/2>=room.x&&o.x+o.w/2<=room.x+room.w&&o.y+o.h/2>=room.y&&o.y+o.h/2<=room.y+room.h;
 function requestedCount(range,hash){
  if(!Array.isArray(range)||range.length!==2||!range.every(Number.isSafeInteger)||range[0]<0||range[1]<range[0])return null;
  const lo=Math.min(range[0],RULES.maxPerKind),hi=Math.min(range[1],RULES.maxPerKind);
  return lo+(hash>>>0)%(hi-lo+1);
 }
 function enrich({seed,p,z,plan,detail,description,geometry,recipes,anchors}){
  if(!description||!geometry||!recipes||!anchors||!Array.isArray(plan?.rooms)||!Array.isArray(detail?.interior))throw Error('Contrat de séries de mobilier absent');
  if(detail.quantities164?.revision===RULES.revision)return detail;
  const base=recipes.accessGrid(p,z,plan,detail),keep=recipes.anchorCells(p,z,plan,base),reports=[],added=[];
  const previous=[...plan.objects,...detail.interior],obstacles=[...plan.walls,...previous,...plan.stairs];
  const fronts=previous.filter(o=>o.front160).map(o=>o.front160);
  const oldFronts=fronts.map(f=>base?.at(f.x+f.w/2,f.y+f.h/2)).filter(i=>i>=0&&base?.reachable?.[i]);
  const sources=new Map(description.rooms.map(r=>[anchors.norm(r.name),r]));
  if(!base?.baseline)return freeze({...detail,quantities164:{revision:4,added:0,requests:[],navigationChecked:false,reason:'baseline-inaccessible'}});
  for(let ri=0;ri<plan.rooms.length;ri++){
   const room=plan.rooms[ri],source=sources.get(anchors.norm(room.name)),kit=source?.kit||recipes.kitFor(room.name);
   if(!source||source.exterior||['garden','exterior','road','loading'].includes(kit.id))continue;
   const seen=new Set();let roomAdded=0;
   for(const spec of source.authoredProps||[]){
    const kind=spec.asset;if(!TYPES.includes(kind)||seen.has(kind))continue;seen.add(kind);
    const target=requestedCount(spec.quantite_par_espace,geometry.hash('quantity164',seed,p.id,z,ri,kind));
    const existing=previous.filter(o=>o.kind===kind&&owns(room,o)).length;
    const report={room:ri,name:room.name,kind,sourceRange:Array.isArray(spec.quantite_par_espace)?[...spec.quantite_par_espace]:null,sourceCapped:spec.quantite_par_espace?.[1]>RULES.maxPerKind,target,existing,added:0,unplaced:0};reports.push(report);
    if(target===null){report.reason='invalid-source-range';continue;}
    if(target<=existing){report.reason='already-present';continue;}
    const width=spec.gabarit_m?.longueur,depth=spec.gabarit_m?.largeur;
    if(!geometry.SHAPES[kind]||!Number.isFinite(width+depth)||width<=0||depth<=0||width>RULES.maxWidth||depth>RULES.maxDepth){report.reason='unsupported-dimensions';report.unplaced=target-existing;continue;}
    const prescribed=spec.degagement_min_m;
    // A larger authored aisle may not be silently squeezed down to the local cap.
    if(prescribed!==undefined&&(!Number.isFinite(prescribed)||prescribed<0||prescribed>RULES.maxClearance)){report.reason='unsupported-clearance';report.unplaced=target-existing;continue;}
    const clearance=Math.max(RULES.minClearance,prescribed||kit.clearance||RULES.minClearance);
    const walls=anchors.supportedWalls(room,plan.walls),offset=walls.length?geometry.hash('quantity164-wall',seed,p.id,z,ri,kind)%walls.length:0;
    for(let ordinal=existing;ordinal<target&&added.length<RULES.maxAdded&&roomAdded<RULES.maxPerRoom;ordinal++){
     let chosen=null;
     for(let wi=0;wi<walls.length&&!chosen;wi++){
      const support=walls[(wi+offset)%walls.length],vertical=['west','east'].includes(support.side);
      const length=Math.min(vertical?room.y+room.h:room.x+room.w,vertical?support.wall.y+support.wall.h:support.wall.x+support.wall.w)-Math.max(vertical?room.y:room.x,vertical?support.wall.y:support.wall.x);
      const slots=Math.min(RULES.maxSlotsPerWall,Math.floor((length-2*anchors.RULES.edgeMargin+RULES.gap)/(width+RULES.gap)));
      const lo=Math.max(vertical?room.y:room.x,vertical?support.wall.y:support.wall.x)+anchors.RULES.edgeMargin;
      const hi=Math.min(vertical?room.y+room.h:room.x+room.w,vertical?support.wall.y+support.wall.h:support.wall.x+support.wall.w)-anchors.RULES.edgeMargin-width;
      const candidates=[];
      // Continue an existing row before trying evenly spaced empty-wall slots.
      for(const old of [...previous,...added])if(old.kind===kind&&owns(room,old)){
       const a=vertical?old.y:old.x,b=vertical?old.y+old.h:old.x+old.w;
       if(hi>lo)candidates.push((b+RULES.gap-lo)/(hi-lo),(a-RULES.gap-width-lo)/(hi-lo));
      }
      for(let slot=0;slot<slots;slot++)candidates.push(slots===1?.5:slot/(slots-1));
      for(const fraction of [...new Set(candidates.filter(n=>Number.isFinite(n)&&n>=0&&n<=1))].slice(0,RULES.maxSlotsPerWall)){
       if(chosen)break;
       const pose=anchors.pose(support,room,width,depth,fraction,clearance);if(!pose)continue;
       if(pose.x<.25||pose.y<.25||pose.x+pose.w>p.w-.25||pose.y+pose.h>p.h-.25)continue;
       if(pose.x<room.x-.5||pose.y<room.y-.5||pose.x+pose.w>room.x+room.w+.5||pose.y+pose.h>room.y+room.h+.5)continue;
       if(obstacles.some(o=>hit(pose,o,.025))||fronts.some(f=>hit(pose,f,.025))||added.some(o=>hit(pose,o,.05)||hit(pose,o.front160,.025)))continue;
       if([...obstacles,...added].some(o=>hit(pose.front160,o,.025)))continue;
       const i=base.at(pose.front160.x+pose.front160.w/2,pose.front160.y+pose.front160.h/2);if(i<0||!base.reachable[i])continue;
       chosen={...pose,id:p.id+':quantity164:'+z+':'+ri+':'+kind+':'+ordinal,kind,z,solid:true,surface:false,
        decor157:true,anchored160:true,quantity164:true,room160:ri,room:room.name,label:spec.nom||kind,
        origin160:'authored-quantity',programme:description.id,sourceTarget164:target};
      }
     }
     if(chosen){added.push(chosen);roomAdded++;}else break;
    }
   }
  }
  // Preserve old interaction anchors AND the service fronts of previous furniture.
  let audit,ok=false;
  for(;;){
   audit=recipes.accessGrid(p,z,plan,detail,added);
   const newFronts=added.map(o=>audit?.at(o.front160.x+o.front160.w/2,o.front160.y+o.front160.h/2));
   ok=!!audit?.baseline&&keep.every(i=>audit.reachable[i])&&oldFronts.every(i=>audit.reachable[i])&&newFronts.every(i=>i>=0&&audit.reachable[i]);
   if(ok||!added.length)break;added.pop();
  }
  for(const r of reports){
   r.added=added.filter(o=>o.room160===r.room&&o.kind===r.kind).length;
   if(r.target!==null){r.unplaced=Math.max(0,r.target-r.existing-r.added);if(!r.reason)r.reason=r.unplaced?'capacity-space-or-access':'complete';}
  }
  return freeze({...detail,interior:[...detail.interior,...added],quantities164:{revision:4,added:added.length,requests:reports,navigationChecked:ok,preservedAnchors:keep.length+oldFronts.length}});
 }
 return freeze({RULES,TYPES,requestedCount,enrich});
});
