/* Opt-in detail12: authored footprints for existing non-loot details only.
 * Building shells, containers and historical detail revisions keep their owners. */
(function(root,factory){'use strict';const api=factory();root.DeadwallCodexSize163=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis,function(){'use strict';
 const REVISION=12,TYPES=Object.freeze(['chair','sign']);
 const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const owns=(r,o)=>o.x+o.w/2>=r.x&&o.y+o.h/2>=r.y&&o.x+o.w/2<r.x+r.w&&o.y+o.h/2<r.y+r.h;
 const finiteRect=o=>o&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0;
 function shapeFor(kind,source){
  if(typeof kind!=='string'||!kind||!Array.isArray(source?.authoredProps))return null;
  const specs=source.authoredProps.filter(s=>s?.asset===kind);
  if(!specs.length)return null;
  const shapes=specs.map(s=>s.gabarit_m);
  if(shapes.some(s=>!s||![s.longueur,s.largeur,s.hauteur].every(n=>Number.isFinite(n)&&n>0)))return null;
  const first=shapes[0];
  if(shapes.some(s=>s.longueur!==first.longueur||s.largeur!==first.largeur||s.hauteur!==first.hauteur))return null;
  return Object.freeze({w:first.longueur,h:first.largeur,height:first.hauteur,source:'authored-footprint'});
 }
 function frameFor(o){
  const layer=o.garden171?'171':o.infill169?'169':o.station170?'170':o.ensemble165?'165':o.anchored160?'160':null;
  if(!layer)return {w:o.w,h:o.h,a:0,layer:null};
  const w=o['spriteWidth'+layer],h=o['spriteHeight'+layer],a=o['angle'+layer];
  return [w,h,a].every(Number.isFinite)&&w>0&&h>0?{w,h,a,layer}:null;
 }
 function extent(w,h,a){
  const clean=v=>v<1e-10?0:Math.abs(1-v)<1e-10?1:v,c=clean(Math.abs(Math.cos(a))),s=clean(Math.abs(Math.sin(a)));
  return {w:w*c+h*s,h:w*s+h*c};
 }
 function enrich({seed,p,z=0,plan,detail,description,recipes:Q}){
  if(!Number.isInteger(seed)||seed<0||seed>4294967295||!p?.id||!p.levels?.includes(z)||!Array.isArray(plan?.rooms)||!Array.isArray(plan?.objects)||!Array.isArray(plan?.walls)||!Array.isArray(plan?.stairs)||!Array.isArray(detail?.interior)||!Array.isArray(detail?.outdoor)||!Array.isArray(description?.rooms)||!Q?.accessGrid)throw Error('Contrat de dimensions auteur invalide.');
  if(detail.size163?.revision===REVISION)return detail;
  const base=Q.accessGrid(p,z,plan,detail),requests=[];
  if(!base?.baseline)return finish(detail.interior,false,'baseline-inaccessible');
  const sources=new Map();
  for(const source of description.rooms){const key=norm(source.name);sources.set(key,sources.has(key)?null:source);}
  const interior=detail.interior.map(o=>{
   if(!TYPES.includes(o.kind)||!o.solid||o.surface||o.dressing160||Object.hasOwn(o,'amount')||Object.hasOwn(o,'resource')||!finiteRect(o))return o;
   const rooms=plan.rooms.filter(r=>owns(r,o)),source=rooms.length===1?sources.get(norm(rooms[0].name)):null;
   const shape=source&&!source.exterior&&(!source.levels||source.levels.includes(z))?shapeFor(o.kind,source):null;
   const request={id:o.id,kind:o.kind,room:rooms.length===1?rooms[0].name:null,reason:'source-unavailable-or-ambiguous'};requests.push(request);
   if(!shape)return o;
   const frame=frameFor(o);if(!frame){request.reason='unsupported-render-frame';return o;}
   request.source=Object.freeze({w:shape.w,h:shape.h,height:shape.height});request.previous=Object.freeze({w:frame.w,h:frame.h});
   if(frame.w===shape.w&&frame.h===shape.h){request.reason='already-exact';return o;}
   const box=extent(shape.w,shape.h,frame.a);
   // A strict subset cannot add a new obstruction or move an interaction owner.
   if(shape.w>frame.w||shape.h>frame.h||box.w>o.w||box.h>o.h){request.reason='source-would-expand';return o;}
   const item={...o,x:o.x+(o.w-box.w)/2,y:o.y+(o.h-box.h)/2,w:box.w,h:box.h,
    size163:Object.freeze({revision:REVISION,room:source.name,source:request.source,previous:request.previous,scope:'authored-floor-footprint-only'})};
   if(frame.layer){item['spriteWidth'+frame.layer]=shape.w;item['spriteHeight'+frame.layer]=shape.h;}
   request.reason='adjusted';return Object.freeze(item);
  });
  const audit=Q.accessGrid(p,z,plan,{...detail,interior}),navigationChecked=!!audit?.baseline&&audit.reachable.length===base.reachable.length&&base.reachable.every((reachable,i)=>!reachable||audit.reachable[i]);
  if(!navigationChecked){for(const r of requests)if(r.reason==='adjusted')r.reason='navigation-regression';return finish(detail.interior,false,'navigation-regression');}
  return finish(interior,true,null);
  function finish(items,navigationChecked,reason){
   const report=Object.freeze({revision:REVISION,adjusted:requests.filter(r=>r.reason==='adjusted').length,navigationChecked,reason,
    requests:Object.freeze(requests.map(r=>Object.freeze({...r,source:r.source&&Object.freeze({...r.source}),previous:r.previous&&Object.freeze({...r.previous})}))),scope:'authored-floor-footprints-not-height-or-building-conformance'});
   return Object.freeze({...detail,interior:items===detail.interior?items:Object.freeze(items),size163:report});
  }
 }
 return Object.freeze({REVISION,TYPES,shapeFor,frameFor,extent,enrich});
});
