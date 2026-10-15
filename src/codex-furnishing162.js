/* Opt-in revision 11. Existing independent source slots keep their identities,
 * loot and positions. Complements are inferred uses, not authored minima. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexFurnishing162=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis,function(root){'use strict';
 const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const hit=(a,b,gap=0)=>a.x<b.x+b.w+gap&&a.x+a.w>b.x-gap&&a.y<b.y+b.h+gap&&a.y+a.h>b.y-gap;
 const within=(a,r,m=0)=>a.x>=r.x+m&&a.y>=r.y+m&&a.x+a.w<=r.x+r.w-m&&a.y+a.h<=r.y+r.h-m;
 const owns=(r,o)=>o.x+o.w/2>=r.x&&o.y+o.h/2>=r.y&&o.x+o.w/2<r.x+r.w&&o.y+o.h/2<r.y+r.h;
 const overlapArea=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 const fronts=o=>o.service173||o.service171||o.service170||o.fronts169||[o.front160,o.access165].filter(Boolean);
 const samples=f=>[[f.x+f.w/2,f.y+f.h/2],...(f.w>=f.h?[[f.x+f.w*.25,f.y+f.h/2],[f.x+f.w*.75,f.y+f.h/2]]:[[f.x+f.w/2,f.y+f.h*.25],[f.x+f.w/2,f.y+f.h*.75]])];

 // Room-kit substring matches are deliberately insufficient: a vestibule may
 // mention a séjour, and an industrial test room may mention a cooking module.
 function usage(source){
  const name=norm(source?.name),kinds=new Set((source?.sourceProps158||[]).map(o=>o.kind));
  if(kinds.has('bed')&&/^(couchage|chambre|dortoir|repos des|logement)/.test(name)&&!/prototype|essai|module|lot|fermeture|composant/.test(name))return 'sleeping';
  if(kinds.has('shelf')&&/archive|classement|documentation|bibliothe|reserve|stock|conservation/.test(name))return 'archives';
  if((kinds.has('wardrobe')||kinds.has('fridge'))&&/^vestiaire/.test(name)&&!/outils|pieces|materiaux|module|prototype/.test(name))return 'changing';
  if(kinds.has('desk')&&/^(vestibule|reception|accueil|entree|guichet)/.test(name))return 'reception';
  if(kinds.has('medical')&&/soins|consultation|infirmerie|clinique/.test(name)&&!/prototype|module|materiau/.test(name))return 'medical';
  if((kinds.has('fridge')||kinds.has('sink')||kinds.has('oven'))&&/^(cuisine|plonge|refectoire)|preparation alimentaire|repas des residents/.test(name))return 'kitchen';
  if(kinds.has('washer')&&/linge|buanderie|lavage textile/.test(name))return 'laundry';
  if([...kinds].some(k=>['workbench','sawBench','clampRack'].includes(k)))return 'workshop';
  if(kinds.has('desk'))return 'office';
  return null;
 }
 function floorBudget(p,z,r){
  const levels=[...new Set(p.levels)].sort((a,b)=>a-b),i=levels.indexOf(z);
  return Math.min(r.maxPerFloor,Math.floor(r.maxPerSite/levels.length)+(i<r.maxPerSite%levels.length?1:0));
 }
 function target(spec,room,source,z){
  const area=room.w*room.h;
  if(area<spec.minArea||spec.groundOnly&&z!==0||spec.collective&&!/residents|dortoir|couchages|couchage des|collectif/.test(norm(source.name)))return 0;
  return spec.areaPerTarget?Math.max(1,Math.min(spec.target,Math.floor(area/spec.areaPerTarget))):spec.target;
 }
 function equivalent(kind,o){return kind==='shelf'?['shelf','bookshelf','shelfEnd'].includes(o.kind):kind===o.kind;}
 function fractions(s,room,width,obstacles,r){
  const vertical=s.side==='west'||s.side==='east',wall=s.wall;
  const lo=Math.max(vertical?room.y:room.x,vertical?wall.y:wall.x)+.16;
  const hi=Math.min(vertical?room.y+room.h:room.x+room.w,vertical?wall.y+wall.h:wall.x+wall.w)-.16-width;
  if(hi<lo)return [];
  if(hi===lo)return [0];
  const positions=[lo,hi,(lo+hi)/2];
  for(const o of obstacles){const a=vertical?o.y:o.x,b=vertical?o.y+o.h:o.x+o.w;positions.push(a-r.gap-width,b+r.gap);}
  for(let i=0;i<r.wallSamples;i++)positions.push(lo+(hi-lo)*i/(r.wallSamples-1));
  return [...new Set(positions.filter(v=>v>=lo&&v<=hi).map(v=>Math.round((v-lo)/(hi-lo)*1e7)/1e7))];
 }
 function enrich({seed,p,z=0,plan,detail,description,geometry:G,recipes:Q}){
  if(!/^DW-\d{4}$/.test(description?.id||'')||Number(description.id.slice(3))<=3000||Number(description.id.slice(3))>4000)return detail;
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),r=C?.CodexFurnishingRules162;
  const A=root.DeadwallCodexAnchors160||(typeof require==='function'?require('./codex-anchors160.js'):null);
  const D=root.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null);
  if(!r||!A||!D||!G||!Q||!Number.isInteger(seed)||seed<0||seed>4294967295||!p?.id||!p.levels?.includes(z)||!['rooms','walls','stairs','objects'].every(k=>Array.isArray(plan?.[k]))||!Array.isArray(detail?.interior)||!Array.isArray(detail.outdoor)||!Array.isArray(description.rooms))throw Error('Contrat de complément d’usage invalide.');
  if(detail.furnishing162?.revision===r.revision)return detail;
  const previous=[...plan.objects,...detail.interior.filter(o=>o.solid&&!o.dressing160)],obstacles=[...plan.walls,...plan.stairs,...previous];
  const base=Q.accessGrid(p,z,plan,detail),keep=Q.anchorCells(p,z,plan,base),oldFronts=[...plan.objects,...detail.interior,...(z===0?[...(p.outdoor||[]),...detail.outdoor]:[])].flatMap(fronts);
  for(const f of oldFronts)for(const [x,y]of samples(f)){const i=base?.at(x,y);if(i>=0&&base.reachable[i])keep.push(i);}
  const added=[],requests=[],jobs=[],budget=floorBudget(p,z,r),sources=new Map();
  for(const source of description.rooms){const k=norm(source.name);sources.set(k,sources.has(k)?null:source);}
  for(const [ri,room]of plan.rooms.entries()){
   const source=sources.get(norm(room.name)),profile=source&&!source.exterior&&(!source.levels||source.levels.includes(z))?usage(source):null;
   if(!profile){requests.push({room:ri,name:room.name,usage:null,unplaced:0,reason:source?'usage-unresolved-or-wrong-level':'source-room-unresolved'});continue;}
   const freeArea=Math.max(0,room.w*room.h-obstacles.reduce((n,o)=>n+overlapArea(room,o),0));
   const maxRoom=Math.min(r.maxPerRoom,Math.max(1,Math.floor(freeArea/r.areaPerSupplement)));
   if(freeArea<r.minRoomArea){requests.push({room:ri,name:room.name,usage:profile,unplaced:0,reason:'room-too-small'});continue;}
   for(const spec of r.profiles[profile]){
    const desired=target(spec,room,source,z);if(!desired)continue;
    const existing=previous.filter(o=>owns(room,o)&&equivalent(spec.kind,o)).length;
    const request={room:ri,name:room.name,usage:profile,kind:spec.kind,existing,derivedTarget:desired,sourceMinimum:null,added:0,unplaced:Math.max(0,desired-existing),reason:desired>existing?'space-or-access':'already-present'};requests.push(request);
    if(request.unplaced)jobs.push({ri,room,source,spec,request,maxRoom});
   }
  }
  if(!base?.baseline)return finish(false,'baseline-inaccessible');
  for(let pass=0;pass<r.maxPasses&&added.length<budget;pass++){
   let progress=false;const visited=new Set();
   for(const job of jobs){
    const {ri,room,spec,request,maxRoom}=job;if(visited.has(ri)||job.exhausted||request.unplaced===0||added.length>=budget)continue;
    if(added.filter(o=>o.room162===ri).length>=maxRoom){request.reason='room-capacity';continue;}
    const shape=G.SHAPES[spec.kind]||D.objects[spec.kind];if(!shape){request.reason='unsupported-rendered-kind';job.exhausted=true;continue;}
    const [width,depth]=shape,clearance=Math.max(r.minimumClearance,Math.min(r.maxClearance,r.clearance));
    const supports=A.supportedWalls(room,plan.walls),start=supports.length?G.hash(seed,p.id,z,ri,spec.kind,'furnishing162')%supports.length:0;
    let chosen=null,attempts=0;
    for(let wi=0;wi<supports.length&&!chosen&&attempts<r.maxCandidates;wi++){
     const support=supports[(wi+start)%supports.length];
     for(const fraction of fractions(support,room,width,[...obstacles,...added],r)){
      if(++attempts>r.maxCandidates)break;const pose=A.pose(support,room,width,depth,fraction,clearance);
      // Room labels inset their rectangles from the real walls. Keep the
      // centre assigned to that room; the actual wall remains the hard limit.
      if(!pose||!owns(room,pose)||!within(pose,room,-r.roomEnvelopeTolerance)||!within(pose.front160,room,r.roomMargin))continue;
      if([...obstacles,...added].some(o=>hit(pose,o,r.collisionGap)||hit(pose.front160,o,r.collisionGap)))continue;
      if([...oldFronts,...added.map(o=>o.front160)].some(f=>hit(pose,f,r.collisionGap)))continue;
      const item={...pose,id:p.id+':furnishing162:'+z+':'+ri+':'+spec.kind+':'+request.added,kind:spec.kind,z,solid:true,surface:false,decor157:true,anchored160:true,furnishing162:true,room162:ri,room:room.name,usage162:request.usage,quantitySource162:'derived-capacity-not-author-minimum',utilityConnected162:false};
      const proposed=[...added,item],audit=Q.accessGrid(p,z,plan,detail,proposed);
      if(!audit?.baseline||keep.some(i=>!audit.reachable[i]))continue;
      if(proposed.some(o=>samples(o.front160).some(([x,y])=>{const i=audit.at(x,y);return i<0||!audit.reachable[i];})))continue;
      chosen=freeze(item);break;
     }
    }
    if(chosen){added.push(chosen);request.added++;request.unplaced--;request.reason=request.unplaced?'capacity-target-partial':'derived-target-present';visited.add(ri);progress=true;}
    else{request.reason=supports.length?'space-or-access':'no-real-wall-support';job.exhausted=true;}
   }
   if(!progress)break;
  }
  if(added.length>=budget)for(const request of requests)if(request.unplaced&&request.reason==='space-or-access')request.reason='site-or-floor-capacity';
  const audit=Q.accessGrid(p,z,plan,detail,added),navigationChecked=!!audit?.baseline&&keep.every(i=>audit.reachable[i])&&added.every(o=>samples(o.front160).every(([x,y])=>{const i=audit.at(x,y);return i>=0&&audit.reachable[i];}));
  if(!navigationChecked)throw Error('Circulation du complément d’usage invalidée.');
  return finish(true,null);
  function finish(navigationChecked,reason){return Object.freeze({...detail,interior:Object.freeze([...detail.interior,...added]),furnishing162:freeze({revision:r.revision,added:added.length,navigationChecked,requests,floorBudget:budget,reason,scope:'derived-usage-not-authored-minima'})});}
 }
 return Object.freeze({usage,floorBudget,fronts,samples,enrich});
});
