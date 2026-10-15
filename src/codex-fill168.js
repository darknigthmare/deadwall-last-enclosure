/* Revision 6: fill unmet authored furniture minima after the five preserved layers.
 * No layout rewrite, loot budget, utility connection or interaction is invented.
 */
(function(root,factory){'use strict';const api=factory();root.DeadwallCodexFill168=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const RULES=freeze({revision:6,maxAdded:24,maxPerRoom:8,maxPerSpec:8,maxCandidates:40,gap:.12,minClearance:.8,maxClearance:1.8,maxWidth:4,maxDepth:2.5});
 // Each kind already has a real renderer. Tables remain owned by ensembles165;
 // wall signs, machinery and external rooms require their own spatial contracts.
 const TYPES=freeze(['bed','sofa','wardrobe','shelf','desk','workbench','counter','medical','fridge','sink','oven','washer','bench','electricalRack','hoseRack']);
 const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 const owns=(r,o)=>o.x+o.w/2>=r.x&&o.x+o.w/2<r.x+r.w&&o.y+o.h/2>=r.y&&o.y+o.h/2<r.y+r.h;
 const range=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isSafeInteger)&&v[0]>=0&&v[1]>=v[0]?v:null;
 const samples=f=>[[f.x+f.w/2,f.y+f.h/2],...(f.w>=f.h?[[f.x+f.w*.25,f.y+f.h/2],[f.x+f.w*.75,f.y+f.h/2]]:[[f.x+f.w/2,f.y+f.h*.25],[f.x+f.w/2,f.y+f.h*.75]])];
 function fractions(s,room,width,depth,obstacles){
  const vertical=s.side==='west'||s.side==='east',b=s.wall;
  const lo=Math.max(vertical?room.y:room.x,vertical?b.y:b.x)+.16;
  const hi=Math.min(vertical?room.y+room.h:room.x+room.w,vertical?b.y+b.h:b.x+b.w)-.16-width;
  if(hi<lo)return[];if(hi===lo)return[0];
  const positions=[lo,hi,(lo+hi)/2];
  // Try exact edges of occupied wall intervals, not only a few random points.
  for(const o of obstacles){const a=vertical?o.y:o.x,e=vertical?o.y+o.h:o.x+o.w;positions.push(a-RULES.gap-width,e+RULES.gap);}
  const slots=Math.min(16,Math.max(2,Math.ceil((hi-lo)/(width+RULES.gap))+1));
  for(let i=0;i<slots;i++)positions.push(lo+(hi-lo)*i/(slots-1));
  return [...new Set(positions.filter(n=>n>=lo&&n<=hi).map(n=>Math.round((n-lo)/(hi-lo)*1e7)/1e7))].slice(0,RULES.maxCandidates);
 }
 function enrich({seed,p,z=0,plan,detail,description,geometry:G,recipes:Q,anchors:A}){
  if(!Number.isInteger(seed)||seed<0||seed>4294967295||!p?.id||!Number.isFinite(p.w+p.h)||!p.levels?.includes(z)||!Array.isArray(plan?.rooms)||!Array.isArray(plan.objects)||!Array.isArray(plan.walls)||!Array.isArray(plan.stairs)||!Array.isArray(detail?.interior)||!Array.isArray(detail.outdoor)||!description?.rooms||!G||!Q||!A)throw Error('Contrat de complément mobilier incomplet.');
  if(detail.fill168?.revision===RULES.revision)return detail;
  const base=Q.accessGrid(p,z,plan,detail),keep=Q.anchorCells(p,z,plan,base),added=[],requests=[],unmapped=[];
  const previous=[...plan.objects,...detail.interior].filter(o=>!o.dressing160);
  const obstacles=[...plan.walls,...plan.stairs,...previous.filter(o=>o.solid!==false)];
  const oldFronts=[...previous,...(z===0?[...(p.outdoor||[]),...detail.outdoor]:[])].flatMap(o=>[o.front160,o.access165].filter(Boolean));
  const oldPoints=oldFronts.flatMap(samples).map(([x,y])=>base?.at(x,y)).filter(i=>i>=0&&base?.reachable[i]);
  const sources=new Map();for(const r of description.rooms){const key=A.norm(r.name);if(!sources.has(key))sources.set(key,[]);sources.get(key).push(r);}
  const claimed=new Set(),work=[];
  for(let ri=0;ri<plan.rooms.length;ri++){
   const room=plan.rooms[ri],matches=sources.get(A.norm(room.name))||[];
   if(matches.length!==1){unmapped.push({room:ri,name:room.name,reason:matches.length?'ambiguous-source-room':'no-source-room'});continue;}
   const source=matches[0];
   if(source.exterior){unmapped.push({room:ri,name:room.name,reason:'exterior-requires-native-zone'});continue;}
   if(Array.isArray(source.levels)&&!source.levels.includes(z)){unmapped.push({room:ri,name:room.name,reason:'level-differs-from-source'});continue;}
   for(const [si,spec]of (source.authoredProps||[]).entries()){
    const required=range(spec.quantite_par_espace),kind=spec.asset;
    const candidates=previous.filter(o=>o.kind===kind&&owns(room,o)&&!claimed.has(o.id));
    // Minimum-first attribution, including duplicate asset prescriptions.
    const existing=required?Math.min(required[0],candidates.length):0;
    candidates.slice(0,existing).forEach(o=>claimed.add(o.id));
    const missing=required?Math.max(0,required[0]-existing):null,target=missing===null?null:Math.min(RULES.maxPerSpec,missing);
    const report={room:ri,source:si,name:room.name,label:spec.nom||kind,kind,sourceRange:required?[...required]:null,minimum:required?.[0]??null,existing,target,added:0,unplaced:missing,sourceCapped:missing>RULES.maxPerSpec,reason:null};requests.push(report);
    if(!required){report.reason='invalid-source-range';continue;}
    if(!missing){report.reason='minimum-already-present';continue;}
    if(!TYPES.includes(kind)||!G.SHAPES[kind]){report.reason='unsupported-kind';continue;}
    const width=spec.gabarit_m?.longueur,depth=spec.gabarit_m?.largeur,height=spec.gabarit_m?.hauteur;
    if(![width,depth,height].every(v=>Number.isFinite(v)&&v>0)||width>RULES.maxWidth||depth>RULES.maxDepth){report.reason='unsupported-dimensions';continue;}
    const gap=spec.degagement_min_m,clearance=Math.max(RULES.minClearance,gap??source.kit?.clearance??RULES.minClearance);
    if(gap!==undefined&&(!Number.isFinite(gap)||gap<0)||!Number.isFinite(clearance)||clearance>RULES.maxClearance){report.reason='unsupported-clearance';continue;}
    if(/plafond|suspendu|îlot|ilot|central|milieu|mur uniquement|sur le mur/i.test(spec.ancrage||'')){report.reason='special-support-required';continue;}
    const supports=A.supportedWalls(room,plan.walls),offset=supports.length?G.hash('fill168-wall',seed,p.id,z,ri,si)%supports.length:0;
    report.reason='space-or-access';work.push({report,room,ri,si,kind,spec,width,depth,clearance,supports,offset,attempts:0,exhausted:false});
   }
  }
  if(!base?.baseline)return freeze({...detail,fill168:{revision:6,added:0,requests,unmapped,navigationChecked:false,reason:'baseline-inaccessible',preservedAnchors:0}});
  // Round-robin unmet minima: a stockroom cannot consume the entire plan budget
  // before the kitchen receives its first missing essential appliance.
  for(let round=0;round<RULES.maxPerSpec&&added.length<RULES.maxAdded;round++){
   let progress=false;
   for(const job of work){
    const {report:r,room,ri,si,kind,spec,width,depth,clearance,supports,offset}=job;
    if(job.exhausted||r.added>=r.target||added.length>=RULES.maxAdded)continue;
    if(added.filter(o=>o.room160===ri).length>=RULES.maxPerRoom){r.reason='room-capacity';job.exhausted=true;continue;}
    let selected=null;
    for(let wi=0;wi<supports.length&&!selected;wi++){
     const support=supports[(wi+offset)%supports.length];
     for(const fraction of fractions(support,room,width,depth,[...obstacles,...added])){
      const pose=A.pose(support,room,width,depth,fraction,clearance);job.attempts++;
      if(!pose||pose.x<.25||pose.y<.25||pose.x+pose.w>p.w-.25||pose.y+pose.h>p.h-.25)continue;
      if(pose.x<room.x-.5||pose.y<room.y-.5||pose.x+pose.w>room.x+room.w+.5||pose.y+pose.h>room.y+room.h+.5)continue;
      const others=[...obstacles,...added],fronts=[...oldFronts,...added.map(o=>o.front160)];
      if(others.some(o=>hit(pose,o,.025)||hit(pose.front160,o,.025))||fronts.some(f=>hit(pose,f,.025)))continue;
      const item={...pose,id:p.id+':fill168:'+z+':'+ri+':'+si+':'+r.added,kind,z,solid:true,surface:false,decor157:true,anchored160:true,fill168:true,room160:ri,room:room.name,label:spec.nom||kind,programme:description.id,source168:si,sourceHeight168:spec.gabarit_m.hauteur,utilityConnected168:false};
      const proposed=[...added,item],audit=Q.accessGrid(p,z,plan,detail,proposed);
      if(!audit?.baseline||[...keep,...oldPoints].some(i=>!audit.reachable[i]))continue;
      const frontsOK=proposed.every(o=>samples(o.front160).every(([x,y])=>{const i=audit.at(x,y);return i>=0&&audit.reachable[i];}));
      if(!frontsOK)continue;selected=item;break;
     }
    }
    if(selected){added.push(selected);r.added++;r.unplaced=Math.max(0,r.minimum-r.existing-r.added);r.reason=r.unplaced?'space-or-capacity':'minimum-completed';progress=true;}
    else job.exhausted=true;
   }
   if(!progress)break;
  }
  const audit=Q.accessGrid(p,z,plan,detail,added);
  const navigationChecked=!!audit?.baseline&&[...keep,...oldPoints].every(i=>audit.reachable[i])&&added.every(o=>samples(o.front160).every(([x,y])=>{const i=audit.at(x,y);return i>=0&&audit.reachable[i];}));
  if(!navigationChecked)throw Error('Invariant de navigation du complément mobilier violé.');
  return freeze({...detail,interior:[...detail.interior,...added],fill168:{revision:6,added:added.length,requests,unmapped,navigationChecked,preservedAnchors:keep.length+oldPoints.length,attempts:work.reduce((n,w)=>n+w.attempts,0)}});
 }
 return freeze({RULES,TYPES,range,samples,fractions,enrich});
});
