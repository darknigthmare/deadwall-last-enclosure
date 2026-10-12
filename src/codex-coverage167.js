/* Source/model reconciliation, not another generator. All results are read-only. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexCoverage167=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const RULES=Object.freeze({revision:167,sourceCache:64,displayIssues:60});
 const LABELS=Object.freeze({programme:'Programme et contexte',plot:'Parcelle et niveaux',rooms:'Pièces et usages',furniture:'Mobilier auteur',gardens:'Jardins et annexes',access:'Accès et passages',resources:'Stocks et ressources',night:'Nuit et alimentation',state:'État du lieu',representation:'Réalisation dans le modèle'});
 const STATUS=Object.freeze({recipe:'Recette disponible',specialized:'Système spécialisé requis',adapted:'Modèle adapté',described:'Décrit dans la source',partial:'Prescriptions incomplètes',kit:'Kit sans quantités auteur',proposed:'Options de composition',missing:'Non renseigné',uninspected:'Non inspecté',inspected:'Modèle inspecté'});
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const copy=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const quantity=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isSafeInteger)&&v[0]>=0&&v[1]>=v[0]?v:null;
 const dimensions=v=>v&&[v.longueur,v.largeur,v.hauteur].every(n=>Number.isFinite(n)&&n>0);
 const inside=(r,o)=>o.x+o.w/2>=r.x&&o.y+o.h/2>=r.y&&o.x+o.w/2<r.x+r.w&&o.y+o.h/2<r.y+r.h;
 const deps=()=>({R:root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null),
  G:root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null),
  D:root.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null),
  Q:root.DeadwallCodexRecipes159||(typeof require==='function'?require('./codex3000-recipes159.js'):null)});
 const cache=new Map();
 function source(id){
  if(typeof id!=='string'||!/^DW-\d{4}$/.test(id))throw Error('Identifiant de programme invalide.');
  if(cache.has(id)){const v=cache.get(id);cache.delete(id);cache.set(id,v);return v;}
  const {R,G,D,Q}=deps(),record=R?.get(id);if(!record)throw Error('Programme absent du Codex.');
  const d=R.describe(id),t=R.template(id),recipe=!!R.preset('codex3000-'+id.slice(3));
  const shapes={...G.SHAPES,...D.objects,...Q.EXTRA_SHAPES},specs=d.rooms.flatMap(r=>r.authoredProps);
  const invalid=specs.filter(s=>!quantity(s.quantite_par_espace)||!dimensions(s.gabarit_m));
  const unknown=[...new Set(specs.filter(s=>!Object.hasOwn(shapes,s.asset)).map(s=>s.asset||s.nom||'non identifié'))].sort();
  const compatible=recipe&&R.enabled(record,{townKind:'grande-ville'}),graph=d.access||[],names=new Set(d.rooms.flatMap(r=>[r.id,r.name]));
  const axes=[
   ['programme',compatible?'recipe':'specialized',1,compatible?'La recette doit encore trouver un terrain compatible.':'Terrain, réseau ou architecture spécialisée non matérialisé.'],
   ['plot',t.adapted?'adapted':'described',t.levels.length,'Emprise et niveaux du modèle comparés aux limites auteur.'],
   ['rooms',d.rooms.length?'described':'missing',d.rooms.length,d.rooms.filter(r=>r.exterior).length+' espaces extérieurs source, distincts des pièces couvertes.'],
   ['furniture',invalid.length||unknown.length?'partial':specs.length?'described':'kit',specs.length,invalid.length+' prescriptions incomplètes ; '+unknown.length+' types sans gabarit physique connu.'],
   ['gardens',d.gardenOptions.length||d.exteriorOptions.length?'proposed':'missing',d.gardenOptions.length,'Options alternatives selon la surface libre, pas des installations garanties simultanément.'],
   ['access',graph.length?'described':'missing',graph.length,'Liens auteur, pas une liste de portes déjà construites.'],
   ['resources',d.loot?'described':'missing',specs.filter(p=>p.loot_eligible===true).length,'Éligibilité source uniquement : aucun nouveau stock attribué par cette lecture.'],
   ['night',d.causal?.light?'described':'missing',d.causal?.light?1:0,'Une prescription lumineuse ne crée ni courant ni halo fonctionnel.'],
   ['state',d.causal||d.postFall?'described':'missing',d.causal||d.postFall?1:0,'État décrit, distinct des dégâts et pannes effectivement simulés.'],
   ['representation','uninspected',0,'Choisir une graine et un étage pour examiner les objets réellement produits.']
  ].map(([key,status,count,note])=>({key,label:LABELS[key],status,count,note}));
  const out=freeze({revision:167,id,parent:record.parent,name:record.name,family:record.family,module:record.module||null,state:record.state||null,
   recipeAvailable:recipe,contextCompatible:compatible,scope:'source-not-live-world',axes,reference:copy(t.reference),
   model:{w:t.w,h:t.h,levels:[...t.levels],adapted:t.adapted},
   sourceGaps:{invalidFurniture:invalid.map(s=>s.nom||s.asset),unmappedKinds:unknown,
    externalOrUnresolvedAccess:[...new Set(graph.flatMap(a=>[a.de,a.vers]).filter(x=>!names.has(x)))]},
   totals:{rooms:d.rooms.length,exteriors:d.rooms.filter(r=>r.exterior).length,furniture:specs.length,accessLinks:graph.length,gardens:d.gardenOptions.length}});
  cache.set(id,out);if(cache.size>RULES.sourceCache)cache.delete(cache.keys().next().value);return out;
 }
 function compare(preview){
  if(!preview?.id)throw Error('Aperçu de recette requis.');
  const ref=source(preview.id);
  if(!preview.supported)return freeze({source:ref,scope:'unsupported',rooms:[],issues:[{kind:'architecture',name:ref.name,reason:'Aucun plan de substitution produit.'}]});
  const {p,plan,details:detail,z,seed}=preview;
  if(!p||!Number.isInteger(z)||!p.levels.includes(z)||!Array.isArray(plan?.rooms)||!Array.isArray(detail?.interior)||!Array.isArray(detail?.outdoor))throw Error('Plan de comparaison invalide.');
  const {R}=deps(),d=R.describe(ref.id),issues=[],assignedObjects=new Set(),assignedRooms=new Set();
  const physical=[...plan.objects,...detail.interior].filter(o=>!o.dressing160);
  const duplicateNames=new Set(d.rooms.filter((r,i,all)=>all.some((x,j)=>j!==i&&norm(x.name)===norm(r.name))).map(r=>norm(r.name)));
  const rooms=d.rooms.map((r,sourceIndex)=>{
   const ambiguous=duplicateNames.has(norm(r.name));
   const indices=ambiguous?[]:plan.rooms.flatMap((x,i)=>!assignedRooms.has(i)&&norm(x.name)===norm(r.name)?[i]:[]);indices.forEach(i=>assignedRooms.add(i));
   const expected=!Array.isArray(r.levels)||r.levels.includes(z);
   const status=ambiguous?'ambiguous-room-name':indices.length?(r.exterior?'exterior-simplified-inside-shell':!expected?'level-differs-from-source':'represented'):expected?'not-materialized-on-floor':'not-requested-on-floor';
   if(!['represented','not-requested-on-floor'].includes(status))issues.push({kind:'room',name:r.name,reason:status});
   const specs=r.authoredProps||[],allocations=new Map();
   // Reserve each specification's minimum first, then distribute surplus up to its
   // maximum. One object can never satisfy two specifications of the same kind.
   for(const kind of new Set(specs.map(s=>s.asset))){
    const pool=r.exterior?[]:physical.filter(o=>!assignedObjects.has(o.id)&&o.kind===kind&&indices.some(i=>inside(plan.rooms[i],o)));
    const related=specs.map((s,i)=>({s,i,range:quantity(s.quantite_par_espace)})).filter(x=>x.s.asset===kind);
    let cursor=0;
    for(const x of related){const take=x.range?Math.min(pool.length-cursor,x.range[0]*indices.length):0;allocations.set(x.i,pool.slice(cursor,cursor+take));cursor+=take;}
    for(const x of related){if(!x.range)continue;const list=allocations.get(x.i),take=Math.min(pool.length-cursor,Math.max(0,x.range[1]*indices.length-list.length));list.push(...pool.slice(cursor,cursor+take));cursor+=take;}
    for(const x of related)for(const o of allocations.get(x.i))assignedObjects.add(o.id);
   }
   const props=specs.map((s,i)=>{
    const req=quantity(s.quantite_par_espace),items=allocations.get(i)||[],minimum=req&&!r.exterior?req[0]*indices.length:null;
    const exact=items.filter(o=>Math.abs((o.spriteWidth160||o.spriteWidth165||o.w)-s.gabarit_m?.longueur)<.001&&Math.abs((o.spriteHeight160||o.spriteHeight165||o.h)-s.gabarit_m?.largeur)<.001).length;
    const below=minimum===null?null:Math.max(0,minimum-items.length);
    if(below>0)issues.push({kind:'furniture',name:r.name+' — '+(s.nom||s.asset),reason:'below-source-minimum',missing:below});
    if(items.length>exact)issues.push({kind:'dimensions',name:r.name+' — '+(s.nom||s.asset),reason:'footprint-differs',count:items.length-exact});
    return {name:s.nom||s.asset,kind:s.asset,sourceRange:copy(req),dimensions:copy(s.gabarit_m),clearance:s.degagement_min_m??null,
     represented:items.length,minimumForModelRooms:minimum,belowMinimum:below,exactFootprintMatches:exact,objectIds:items.map(o=>o.id),
     unassignedYardCandidates:r.exterior&&z===0?[...(p.outdoor||[]),...detail.outdoor].filter(o=>!o.dressing160&&o.kind===s.asset).map(o=>o.id):[],
     status:r.exterior?'exterior-zone-not-attributed':!indices.length?'room-not-materialized':!req?'quantity-not-specified':below?'below-source-minimum':'count-represented'};
   });
   return {sourceIndex,id:r.id,name:r.name,kit:r.kit.id,exterior:r.exterior,levelExpected:expected,status,modelRoomIndices:indices,
    sourceRepeat:copy(r.repeat),sourceArea:copy(r.area),modelArea:indices.reduce((n,i)=>n+plan.rooms[i].w*plan.rooms[i].h,0),props};
  });
  const layers=['recipe159','anchors160','quantities164','ensembles165'].flatMap(k=>detail[k]?[{id:k,navigationChecked:detail[k].navigationChecked===true,added:detail[k].added||0,
   refused:Array.isArray(detail[k].requests)?detail[k].requests.reduce((n,r)=>n+(r.unplaced||0),0):Array.isArray(detail[k].rejected)?detail[k].rejected.length:0}]:[]);
  return freeze({source:ref,scope:'isolated-recipe-not-live-world',seed,floor:z,detailVersion:preview.detailVersion??5,rooms,issues,layers,
   unmatchedModelRooms:plan.rooms.flatMap((r,i)=>assignedRooms.has(i)?[]:[{index:i,name:r.name}]),
   totals:{representedRooms:rooms.filter(r=>r.modelRoomIndices.length).length,unmaterialized:rooms.filter(r=>r.status==='not-materialized-on-floor').length,
    exteriorSimplifications:rooms.filter(r=>r.status==='exterior-simplified-inside-shell').length,furnitureBelowMinimum:rooms.flatMap(r=>r.props).reduce((n,q)=>n+(q.belowMinimum||0),0),
    sourceObjects:plan.objects.length,decorativeObjects:detail.interior.length+detail.outdoor.length,
    newLootRecords:[...detail.interior,...detail.outdoor].filter(o=>o.amount!==undefined||o.resource!==undefined).length}});
 }
 function catalogue(){
  const {R}=deps(),families=new Map(),parents=new Set();let inspectable=0,recipes=0,sourceRooms=0,sourceProps=0;
  for(const r of R.records){const s=source(r.id);if(!families.has(s.family))families.set(s.family,{name:s.family,programmes:0,parents:0,inspectable:0,requiresSystem:0,sourceRooms:0,sourceFurniture:0});
   const f=families.get(s.family);f.programmes++;if(s.contextCompatible){f.inspectable++;inspectable++;}else f.requiresSystem++;
   if(s.recipeAvailable)recipes++;
   if(!parents.has(s.parent)){parents.add(s.parent);f.parents++;f.sourceRooms+=s.totals.rooms;f.sourceFurniture+=s.totals.furniture;sourceRooms+=s.totals.rooms;sourceProps+=s.totals.furniture;}
  }
  return freeze({revision:167,programmes:R.records.length,parents:parents.size,inspectable,recipeTemplates:recipes,requiresSystem:R.records.length-inspectable,
   distinctParentSourceRooms:sourceRooms,distinctParentFurnitureReferences:sourceProps,families:[...families.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr')),scope:'catalogue-not-world-population'});
 }
 function render(doc,host,report){
  const s=report.source||report,el=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  host.replaceChildren();host.dataset.coverage167=s.id;host.dataset.scope=report.scope||s.scope;host.dataset.floor=report.floor===undefined?'':String(report.floor);host.appendChild(el('h6','BILAN SOURCE / MODÈLE — DIX AXES'));
  const list=el('dl');list.className='codex-specifications161';
  for(const a of s.axes){list.appendChild(el('dt',a.label));list.appendChild(el('dd',(a.key==='representation'&&report.totals?'Modèle inspecté':STATUS[a.status])+' · '+a.count+' · '+a.note));}host.appendChild(list);
  host.appendChild(el('p','Les occurrences héritées ne sont pas des architectures indépendantes. Un objet du bon type ne prouve ni sa fonction, ni sa hauteur, ni sa présence sur votre carte.'));
  if(report.totals){const t=report.totals;host.appendChild(el('p',t.representedRooms+' espaces source rapprochés du plan · '+t.unmaterialized+' absents de cet étage · '+t.exteriorSimplifications+' extérieurs encore simplifiés dans la coque · '+t.furnitureBelowMinimum+' meubles sous le minimum source.'));
   const issues=el('ul'),labels={'not-materialized-on-floor':'espace non matérialisé à cet étage','exterior-simplified-inside-shell':'extérieur encore représenté dans la coque','level-differs-from-source':'niveau différent de la prescription','ambiguous-room-name':'nom ambigu : attribution refusée','below-source-minimum':'quantité sous le minimum auteur','footprint-differs':'dimensions au sol différentes de la source'};
   for(const i of report.issues.slice(0,RULES.displayIssues))issues.appendChild(el('li',i.name+' — '+(labels[i.reason]||i.reason)+(i.missing?' : '+i.missing+' manquant(s)':'')));
   if(report.issues.length>RULES.displayIssues)issues.appendChild(el('li',(report.issues.length-RULES.displayIssues)+' écarts supplémentaires dans le rapport exporté.'));host.appendChild(issues);
  }
  if(s.sourceGaps.unmappedKinds.length)host.appendChild(el('p','Gabarits encore absents : '+s.sourceGaps.unmappedKinds.join(', ')+'.'));
  return host;
 }
 return Object.freeze({RULES,LABELS,STATUS,source,compare,catalogue,render,cacheSize:()=>cache.size,clear:()=>cache.clear()});
});
