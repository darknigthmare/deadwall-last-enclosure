/* Optional revision 9: compose the Codex's garden kits inside attributed ground zones.
 * Existing gardens, plots, doors, roads and finite stocks are never moved or replaced.
 * A kit's modules are not authored furniture minima and are reported separately.
 */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexGardens171=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const rules=()=> (root.DeadwallCore||(typeof require==='function'?require('./core.js'):null)).CodexInfill169Rules;
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const UNIQUE=new Set(['pool','greenhouse','shed','playset']);
 const SOFT=new Set(['flowerbed','cropbed','patio','clothesline','toy','canopy']);
 const NO_WALK=new Set(['flowerbed','cropbed']);
 const ROLES=freeze({residence:['fleurs','potager','terrasse','jeux','verger','piscine','serre','atelier','linge','friche','partage','repos'],
  collective:['fleurs','potager','jeux','linge','friche','partage','repos'],campagne:['fleurs','potager','verger','serre','atelier','friche','partage'],
  hebergement:['fleurs','terrasse','piscine','linge','repos'],restauration:['fleurs','terrasse','repos'],
  medical:['fleurs','repos'],administration:['fleurs','repos'],education:['fleurs','jeux','partage','repos'],loisirs:['fleurs','jeux','repos']});
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 const within=(a,b,m=0)=>a.x>=b.x+m&&a.y>=b.y+m&&a.x+a.w<=b.x+b.w-m&&a.y+a.h<=b.y+b.h-m;
 const rect=o=>({x:o.x,y:o.y,w:o.w,h:o.h});
 function fronts(o){return o.service171||o.service170||o.fronts169||[o.front160,o.access165].filter(Boolean);}
 function samples(f){return [[f.x+f.w/2,f.y+f.h/2],...(f.w>f.h?[[f.x+f.w*.25,f.y+f.h/2],[f.x+f.w*.75,f.y+f.h/2]]:[[f.x+f.w/2,f.y+f.h*.25],[f.x+f.w/2,f.y+f.h*.75]])];}
 function pose(cx,cy,width,depth,turn,clearance,kind){
  const w=turn%2?depth:width,h=turn%2?width:depth,x=cx-w/2,y=cy-h/2,gap=.08;
  const faces=[{x,y:y+h+gap,w,h:clearance},{x:x-clearance-gap,y,w:clearance,h},{x,y:y-clearance-gap,w,h:clearance},{x:x+w+gap,y,w:clearance,h}];
  // Pool maintenance on every edge; raised beds can be tended from both long sides.
  return {x,y,w,h,angle171:turn*Math.PI/2,spriteWidth171:width,spriteHeight171:depth,
   service171:kind==='pool'?faces:kind==='cropbed'?[faces[turn],faces[(turn+2)%4]]:[faces[turn]]};
 }
 function choices(description,zone,family,Q){
  const source=description.rooms[zone.sourceIndex];
  if(!source||source.id!==zone.source||!source.exterior||!source.levels?.includes(0))return [];
  const name=norm(source.name);
  if(/toiture|suspend|quai|rail|route|parking|livraison|materiaux|grumes|poids lourd|cagette|granulat/.test(name))return [];
  if(zone.use!=='garden'&&!/^(cour[s]?|parvis|arriere-cours)$/.test(name))return [];
  const allowed=Object.hasOwn(ROLES,family)?ROLES[family]:(zone.use==='garden'?['fleurs','friche','repos']:[]);
  // These are explicit kit alternatives, not newly fabricated author quantities.
  return Q.GARDENS.filter(g=>allowed.includes(g.id));
 }
 function enrich({seed,p,z=0,plan,detail,description,geometry:G,recipes:Q,shapes,family}){
  const r=rules();
  if(!Number.isInteger(seed)||seed<0||seed>4294967295||!p?.id||!Number.isInteger(z)||!p.levels?.includes(z)||![p.w,p.h].every(n=>Number.isFinite(n)&&n>0)||!G||!Q||!shapes||!Array.isArray(description?.rooms)||!['walls','objects','rooms','stairs'].every(k=>Array.isArray(plan?.[k]))||!Array.isArray(detail?.outdoor)||!Array.isArray(detail?.interior))throw Error('Contrat de composition des jardins invalide.');
  if(detail.gardens171?.revision===9)return detail;
  const empty=reason=>freeze({...detail,gardens171:{revision:9,added:0,groups:[],requests:[],reason,navigationChecked:false,origin:'garden-kit-not-author-minima'}});
  if(z!==0)return empty('ground-floor-only');
  const zones=detail.infill169?.zones||[];if(!zones.length)return empty('no-attributed-ground-zone');
  const yard=[...(p.outdoor||[]),...detail.outdoor],previous=[...plan.objects,...detail.interior,...yard];
  const carBoxes=(p.parking||[]).map(car=>{
   const pts=[[0,0],[car.w,0],[car.w,car.h],[0,car.h]].map(([x,y])=>{const v=G.global(car,x,y);return G.local(p,v.x,v.y);});
   const x=Math.min(...pts.map(q=>q.x)),y=Math.min(...pts.map(q=>q.y));return {x,y,w:Math.max(...pts.map(q=>q.x))-x,h:Math.max(...pts.map(q=>q.y))-y};
  });
  const auditPlan={...plan,objects:[...plan.objects,...carBoxes]},oldFronts=previous.flatMap(fronts);
  const occupied=[{x:0,y:0,w:p.w,h:p.h},...plan.walls,...plan.stairs,...previous.filter(o=>!o.dressing160),...carBoxes];
  const base=Q.accessGrid(p,0,auditPlan,detail);if(!base?.baseline)return empty('baseline-inaccessible');
  const keep=Q.anchorCells(p,0,plan,base),preserve=(x,y)=>{const i=base.at(x,y);if(i>=0&&base.reachable[i])keep.push(i);};
  for(const f of oldFronts)for(const [x,y]of samples(f))preserve(x,y);
  for(const o of yard.filter(o=>!o.dressing160&&!o.surface))for(const[x,y]of [[o.x-.9,o.y+o.h/2],[o.x+o.w+.9,o.y+o.h/2],[o.x+o.w/2,o.y-.9],[o.x+o.w/2,o.y+o.h+.9]])preserve(x,y);
  const anchors=[...new Set(keep)],added=[],groups=[],requests=[],credited=new Set();
  const grid=(items,walk=false)=>Q.accessGrid(p,0,walk?{...auditPlan,objects:[...auditPlan.objects,...yard.filter(o=>NO_WALK.has(o.kind)),...items.filter(o=>NO_WALK.has(o.kind))]}:auditPlan,{...detail,outdoor:[...detail.outdoor,...items]});
  const connected=(audit,areas)=>audit?.baseline&&areas.every(a=>samples(a).every(([x,y])=>{const i=audit.at(x,y);return i>=0&&audit.reachable[i];}));
  // Preserve the existing metric pathways as well as the gameplay's reachable anchors.
  const Sites=root.DeadwallCodexSites162||(typeof require==='function'?require('./codex-sites162.js'):null);
  const oldPaths=Sites?.build({seed,p,detail,geometry:G}).paths||[];
  const onPath=o=>oldPaths.some(s=>G.segmentRect(s.a,s.b,{x:o.x-Q.RULES.radius,y:o.y-Q.RULES.radius,w:o.w+2*Q.RULES.radius,h:o.h+2*Q.RULES.radius}));
  for(const zone of zones.slice(0,r.maxYardZones)){
   if(!zone||![zone.x,zone.y,zone.w,zone.h].every(Number.isFinite)||zone.w<=0||zone.h<=0||!within(zone,{x:-11,y:p.h,w:p.w+22,h:24}))continue;
   const candidates=choices(description,zone,family,Q);if(!candidates.length)continue;
   const free=grid(added,true);let usableArea=0;
   // Count free, reachable area, not the envelope area or unconnected islands.
   for(let y=zone.y+Q.RULES.grid/2;y<zone.y+zone.h;y+=Q.RULES.grid)for(let x=zone.x+Q.RULES.grid/2;x<zone.x+zone.w;x+=Q.RULES.grid){
    const i=free?.at(x,y);if(i>=0&&free.reachable[i]&&!occupied.some(o=>hit({x:x-Q.RULES.grid/2,y:y-Q.RULES.grid/2,w:Q.RULES.grid,h:Q.RULES.grid},o)))usableArea+=Q.RULES.grid**2;
   }
   const existing=yard.filter(o=>!o.dressing160&&within(o,zone)&&!credited.has(o.id));
   const scored=candidates.filter(c=>usableArea+1e-7>=c.minArea).map(c=>({c,score:c.modules.filter(k=>existing.some(o=>o.kind===k)).length,rank:G.hash('garden171-profile',seed,p.id,zone.id,c.id)})).sort((a,b)=>b.score-a.score||a.rank-b.rank);
   if(!scored.length){requests.push({zone:zone.id,name:zone.name,kind:null,reason:'free-area-too-small',unplaced:0,usableArea:Math.floor(usableArea)});continue;}
   const profile=scored[0].c,group={id:p.id+':garden171:'+zone.id,zone:zone.id,source:zone.source,name:profile.name,profile:profile.id,usableArea:Math.floor(usableArea),minimumArea:profile.minArea,existing:[],added:[],unplaced:[],origin:'codex-garden-profile'};
   for(const [slot,kind]of profile.modules.entries()){
    const report={zone:zone.id,name:profile.name,profile:profile.id,kind,existing:0,added:0,unplaced:1,reason:null};requests.push(report);
    const old=existing.find(o=>o.kind===kind&&!credited.has(o.id));
    if(old){credited.add(old.id);group.existing.push(old.id);report.existing=1;report.unplaced=0;report.reason='existing-kind-in-zone';continue;}
    if(UNIQUE.has(kind)&&[...yard,...added].some(o=>o.kind===kind)){report.reason='unique-equipment-elsewhere';group.unplaced.push(kind);continue;}
    const shape=shapes[kind];if(!shape||!shape.slice(0,2).every(n=>Number.isFinite(n)&&n>0)){report.reason='unsupported-kit-shape';group.unplaced.push(kind);continue;}
    if(added.length>=r.maxAdded||group.added.length>=r.maxPerSpace){report.reason='layer-cap';group.unplaced.push(kind);continue;}
    const [width,depth]=shape;let chosen=null;
    // Quasi-random positions share the zone axes; no row of identically offset props.
    for(let trial=0;trial<r.attempts&&!chosen;trial++){
     const roll=G.hash('garden171-pose',seed,p.id,zone.id,profile.id,slot,trial),turn=(roll>>>12)%4;
     const cx=zone.x+zone.w*(.12+.76*(roll%997)/996),cy=zone.y+zone.h*(.12+.76*((roll>>>10)%991)/990);
     const o={...pose(cx,cy,width,depth,turn,r.minClearance,kind),id:group.id+':'+slot,kind,z:0,solid:!!shape[2],surface:SOFT.has(kind),decor157:true,garden171:true,
      zone171:zone.id,source171:zone.source,profile171:profile.id,label:profile.name+' — '+kind,room:zone.name,origin171:'garden-kit',functional171:false};
     if(!within(o,zone,.1)||o.service171.some(f=>!within(f,zone,.08))||onPath(o))continue;
     if(occupied.some(b=>hit(o,b,.06))||added.some(b=>hit(o,b,.1))||[...oldFronts,...added.flatMap(fronts)].some(f=>hit(o,f,.04)))continue;
     if(o.service171.some(f=>[...occupied,...added].some(b=>(b.solid!==false||b.surface)&&hit(f,b,.04))))continue;
     const proposed=[...added,o],actual=grid(proposed);if(!actual?.baseline||anchors.some(i=>!actual.reachable[i]))continue;
     if(!connected(grid(proposed,true),proposed.flatMap(fronts)))continue;
     chosen=o;
    }
    if(chosen){added.push(chosen);group.added.push(chosen.id);report.added=1;report.unplaced=0;report.reason='placed-and-reachable';}
    else {report.reason='space-or-access';group.unplaced.push(kind);}
   }
   group.complete=group.unplaced.length===0;groups.push(group);
  }
  return freeze({...detail,outdoor:[...detail.outdoor,...added],gardens171:{revision:9,added:added.length,groups,requests,navigationChecked:true,preservedAnchors:anchors.length,
   reason:groups.length?null:'no-compatible-garden-profile',origin:'garden-kit-not-author-minima',connections:'not-simulated'}});
 }
 return Object.freeze({ROLES,fronts,samples,pose,choices,enrich});
});
