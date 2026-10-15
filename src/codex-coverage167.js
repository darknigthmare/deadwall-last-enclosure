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
  Q:root.DeadwallCodexRecipes159||(typeof require==='function'?require('./codex3000-recipes159.js'):null),
  X:root.DeadwallCodexContext160||(typeof require==='function'?require('./codex-context160.js'):null),
  A:root.DeadwallCodexActions159||(typeof require==='function'?require('./world-codex-actions159.js'):null)});
 const cache=new Map();
 function source(id){
  if(typeof id!=='string'||!/^DW-\d{4}$/.test(id))throw Error('Identifiant de programme invalide.');
  if(cache.has(id)){const v=cache.get(id);cache.delete(id);cache.set(id,v);return v;}
  const {R,G,D,Q,X,A}=deps(),record=R?.get(id);if(!record)throw Error('Programme absent du Codex.');
  const d=R.describe(id),historical=R.template(id),contract=X?.get(id),capability=A?.capability(id);
  const t=contract?{...historical,w:contract.w,h:contract.h,levels:contract.levels,
   adapted:contract.implementation160?.fullyImplementedReference===false||!contract.profile&&historical.adapted}:historical;
  const recipe=contract?!!X.preset(X.typeFor(id)):!!R.preset('codex3000-'+id.slice(3));
  const extra=root.DeadwallCodexInfill169||(typeof require==='function'?require('./codex-infill169.js'):null);
  const shapes={...G.SHAPES,...D.objects,...Q.EXTRA_SHAPES,...extra?.SHAPES},specs=d.rooms.flatMap(r=>r.authoredProps);
  const invalid=specs.filter(s=>!quantity(s.quantite_par_espace)||!dimensions(s.gabarit_m));
  const unknown=[...new Set(specs.filter(s=>!Object.hasOwn(shapes,s.asset)).map(s=>s.asset||s.nom||'non identifié'))].sort();
  const compatible=recipe&&(contract?true:capability?.historicalEligible??R.enabled(record,{townKind:'grande-ville'})),graph=d.access||[],names=new Set(d.rooms.flatMap(r=>[r.id,r.name]));
  const axes=[
   ['programme',compatible?'recipe':'specialized',1,compatible?(contract?'Plan territorial G10 disponible ; l’implantation exige un terrain et des accès compatibles.':'La recette doit encore trouver un terrain compatible.'):'Terrain, réseau ou architecture spécialisée non matérialisé.'],
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
   recipeAvailable:recipe,contextCompatible:compatible,generation:contract?10:record.extension===158?9:8,
   historicalRecipeAvailable:!!R.preset('codex3000-'+id.slice(3)),historicalContextCompatible:capability?.historicalEligible??R.enabled(record,{townKind:'grande-ville'}),
   context160:contract?.context160||null,implementation160:copy(contract?.implementation160),scope:'source-not-live-world',axes,reference:copy(t.reference),
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
   // Allocate source minima before optional surplus, without double-crediting objects.
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
    const footprint=o=>[o.spriteWidth160||o.spriteWidth165||o.spriteWidth169||o.spriteWidth170||o.w,o.spriteHeight160||o.spriteHeight165||o.spriteHeight169||o.spriteHeight170||o.h];
    const exact=items.filter(o=>{const [w,h]=footprint(o);return Math.abs(w-s.gabarit_m?.longueur)<.001&&Math.abs(h-s.gabarit_m?.largeur)<.001;}).length;
    const below=minimum===null?null:Math.max(0,minimum-items.length);
    const belowExact=minimum===null?null:Math.max(0,minimum-exact),footprints=new Map();
    for(const o of items){const [w,h]=footprint(o),key=w+'×'+h;if(!footprints.has(key))footprints.set(key,{w,h,count:0});footprints.get(key).count++;}
    if(below>0)issues.push({kind:'furniture',name:r.name+' — '+(s.nom||s.asset),reason:'below-source-minimum',missing:below});
    if(items.length>exact)issues.push({kind:'dimensions',name:r.name+' — '+(s.nom||s.asset),reason:'footprint-differs',count:items.length-exact});
    return {name:s.nom||s.asset,kind:s.asset,sourceRange:copy(req),dimensions:copy(s.gabarit_m),clearance:s.degagement_min_m??null,
     represented:items.length,minimumForModelRooms:minimum,belowMinimum:below,exactFootprintMatches:exact,objectIds:items.map(o=>o.id),
     actualFootprints:[...footprints.values()],belowExactFootprintMinimum:belowExact,
     unassignedYardCandidates:r.exterior&&z===0?[...(p.outdoor||[]),...detail.outdoor].filter(o=>!o.dressing160&&o.kind===s.asset).map(o=>o.id):[],
     status:r.exterior?'exterior-zone-not-attributed':!indices.length?'room-not-materialized':!req?'quantity-not-specified':below?'below-source-minimum':'count-represented'};
   });
   return {sourceIndex,id:r.id,name:r.name,kit:r.kit.id,exterior:r.exterior,levelExpected:expected,status,modelRoomIndices:indices,
    sourceRepeat:copy(r.repeat),sourceArea:copy(r.area),modelArea:indices.reduce((n,i)=>n+plan.rooms[i].w*plan.rooms[i].h,0),props};
  });
  const layers=['recipe159','anchors160','quantities164','ensembles165','fill168','infill169','stations170','gardens171','packing173','furnishing162'].flatMap(k=>detail[k]?[{id:k,navigationChecked:detail[k].navigationChecked===true,added:detail[k].added||0,
   refused:Array.isArray(detail[k].requests)?detail[k].requests.reduce((n,r)=>n+(r.unplaced||0),0):Array.isArray(detail[k].rejected)?detail[k].rejected.length:0}]:[]);
  const complements169=detail.infill169?{
   revision:7,interior:detail.interior.filter(o=>o.infill169).length,outdoor:detail.outdoor.filter(o=>o.infill169).length,
   zones:detail.infill169.zones.map(zone=>({...zone,representedProps:detail.outdoor.filter(o=>o.infill169&&o.zone169===zone.id).map(o=>({id:o.id,kind:o.kind,source:o.source169}))})),
   remaining:detail.infill169.requests.reduce((n,r)=>n+r.unplaced,0),requests:copy(detail.infill169.requests),zoneRefusals:copy(detail.infill169.zoneRefusals),
   note:'Zones de placement au sol, sans nouvelle clôture ni déplacement du plan historique. Les réseaux et interactions de ces meubles ne sont pas simulés.'
  }:null;
  const stations170=detail.stations170?copy(detail.stations170):null;
  const gardens171=detail.gardens171?copy(detail.gardens171):null;
  return freeze({gardens171,stations170,complements169,furnishing162:copy(detail.furnishing162),source:ref,scope:'isolated-recipe-not-live-world',seed,floor:z,detailVersion:preview.detailVersion??5,rooms,issues,layers,
   unmatchedModelRooms:plan.rooms.flatMap((r,i)=>assignedRooms.has(i)?[]:[{index:i,name:r.name}]),
   totals:{representedRooms:rooms.filter(r=>r.modelRoomIndices.length).length,unmaterialized:rooms.filter(r=>r.status==='not-materialized-on-floor').length,
    exteriorSimplifications:rooms.filter(r=>r.status==='exterior-simplified-inside-shell').length,furnitureBelowMinimum:rooms.flatMap(r=>r.props).reduce((n,q)=>n+(q.belowMinimum||0),0),
    furnitureBelowExactFootprintMinimum:rooms.flatMap(r=>r.props).reduce((n,q)=>n+(q.belowExactFootprintMinimum||0),0),
    footprintMismatches:rooms.flatMap(r=>r.props).reduce((n,q)=>n+q.represented-q.exactFootprintMatches,0),
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
  const s=report?.source||report;
  if(!doc?.createElement||!host?.replaceChildren||!s?.axes||!s?.sourceGaps)throw Error('Contrat d’affichage du bilan invalide.');
  // Both source-only and inspected reports have totals, but only inspected reports
  // contain model rooms and issues. Discriminate by scope, not by that shared key.
  const inspected=report.scope==='isolated-recipe-not-live-world';
  if(inspected&&(!report.totals||!Array.isArray(report.rooms)||!Array.isArray(report.issues)||!Array.isArray(report.unmatchedModelRooms)))throw Error('Bilan de modèle incomplet.');
  const el=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  host.replaceChildren();host.dataset.coverage167=s.id;host.dataset.scope=report.scope||s.scope;host.dataset.floor=report.floor===undefined?'':String(report.floor);host.appendChild(el('h6','BILAN SOURCE / MODÈLE — DIX AXES'));
  const list=el('dl');list.className='codex-specifications161';
  for(const a of s.axes){
   const modelAxis=inspected&&a.key==='representation';
   const count=modelAxis?report.rooms.reduce((n,r)=>n+r.modelRoomIndices.length,0)+report.unmatchedModelRooms.length:a.count;
   const note=modelAxis?'Étage '+report.floor+' de la recette isolée, pas un lieu ajouté à la carte.':a.note;
   list.appendChild(el('dt',a.label));list.appendChild(el('dd',(modelAxis?'Modèle inspecté':STATUS[a.status])+' · '+count+' · '+note));
  }host.appendChild(list);
  host.appendChild(el('p','Les occurrences héritées ne sont pas des architectures indépendantes. Un objet du bon type ne prouve ni sa fonction, ni sa hauteur, ni sa présence sur votre carte.'));
  if(inspected){const t=report.totals;host.appendChild(el('p',t.representedRooms+' espaces source rapprochés du plan · '+t.unmaterialized+' absents de cet étage · '+t.exteriorSimplifications+' extérieurs encore simplifiés dans la coque · '+t.furnitureBelowMinimum+' meubles sous le minimum source. '+t.furnitureBelowExactFootprintMinimum+' minima sans emprise conforme ; '+t.footprintMismatches+' objets aux dimensions adaptées. Les quantités et les dimensions sont contrôlées séparément.'));
   const issues=el('ul'),labels={'not-materialized-on-floor':'espace non matérialisé à cet étage','exterior-simplified-inside-shell':'extérieur encore représenté dans la coque','level-differs-from-source':'niveau différent de la prescription','ambiguous-room-name':'nom ambigu : attribution refusée','below-source-minimum':'quantité sous le minimum auteur','footprint-differs':'dimensions au sol différentes de la source'};
   for(const i of report.issues.slice(0,RULES.displayIssues))issues.appendChild(el('li',i.name+' — '+(labels[i.reason]||i.reason)+(i.missing?' : '+i.missing+' manquant(s)':'')));
   if(report.issues.length>RULES.displayIssues)issues.appendChild(el('li',(report.issues.length-RULES.displayIssues)+' écarts supplémentaires dans le rapport exporté.'));host.appendChild(issues);
   const measured=report.rooms.flatMap(r=>r.props.filter(p=>p.represented>p.exactFootprintMatches&&p.dimensions).map(p=>({room:r.name,...p}))).slice(0,8);
   for(const p of measured)host.appendChild(el('p',p.room+' — '+p.name+' : emprise source '+p.dimensions.longueur+' × '+p.dimensions.largeur+' m ; mesurée '+p.actualFootprints.map(f=>f.w+' × '+f.h+' m ('+f.count+')').join(' ; ')+'.'));
  }
  if(inspected&&report.furnishing162){const f=report.furnishing162;host.appendChild(el('h6','MOBILIER D’USAGE — RÉVISION 11'));host.appendChild(el('p',f.added+' compléments posés selon les usages des pièces et les passages disponibles. Ces compositions ne sont pas des quantités auteur et ne créent ni population, ni stock, ni appareil alimenté.'));}
  if(inspected&&report.complements169){const f=report.complements169;host.appendChild(el('h6','COMPLÉMENTS SOURCE — RÉVISION 7'));
   host.appendChild(el('p',f.interior+' nouveaux objets intérieurs · '+f.outdoor+' nouveaux objets de cour · '+f.zones.length+' zones réservées au sol · '+f.remaining+' compléments non posés. '+f.note));
   const names={'complete':'objectif de placement atteint','already-present':'déjà présent','space-or-access':'place ou accès insuffisants','layer-cap':'limite du plan','baseline-inaccessible':'accès de départ indisponible','requires-building-support':'support technique non matérialisé','unsupported-source-dimensions':'gabarit source non pris en charge','unsupported-source-clearance':'dégagement source non pris en charge','invalid-source-range':'quantité source invalide','duplicate-prescription':'prescription dupliquée','clean-storage-conflict':'réserve propre incompatible'};
   for(const r of f.requests)host.appendChild(el('p',r.name+' — '+r.kind+' : '+r.existing+' déjà présents, '+r.added+' ajoutés, '+r.unplaced+' non posés. '+(names[r.reason]||r.reason)+'.'));
  }
  if(inspected&&report.stations170){const s=report.stations170;host.appendChild(el('h6','ATELIERS ET STOCKAGES — RÉVISION 8'));host.appendChild(el('p',s.added+' équipements statiques ajoutés. Les machines gardent quatre faces de maintenance ; les stocks posés au sol gardent leur accès. Aucune alimentation ni ressource supplémentaire.'));for(const r of s.requests)if(r.unplaced)host.appendChild(el('p',r.name+' — '+r.kind+' : '+r.unplaced+' élément(s) non posé(s), motif '+r.reason+'.'));}
  if(inspected&&report.gardens171){const g=report.gardens171;host.appendChild(el('h6','JARDINS COMPOSÉS — RÉVISION 9'));host.appendChild(el('p',g.added+' équipements ajoutés dans '+g.groups.length+' zones composées. Les équipements de kit restent distincts des minima auteur et des extérieurs encore dans la coque. Aucun nouveau butin ni branchement.'));for(const zone of g.groups)host.appendChild(el('p',zone.name+' : '+zone.existing.length+' objets existants rapprochés, '+zone.added.length+' posés, '+zone.unplaced.length+' non posés. Surface libre accessible avant composition : '+zone.usableArea+' m².'));for(const r of g.requests)if(r.unplaced)host.appendChild(el('p',r.name+' — '+r.kind+' : non posé, '+r.reason+'.'));}
  if(report.scope==='unsupported')host.appendChild(el('p','Aucun plan de substitution produit pour ce programme spécialisé.'));
  if(s.sourceGaps.unmappedKinds.length)host.appendChild(el('p','Gabarits encore absents : '+s.sourceGaps.unmappedKinds.join(', ')+'.'));
  return host;
 }
 return Object.freeze({RULES,LABELS,STATUS,source,compare,catalogue,render,cacheSize:()=>cache.size,clear:()=>cache.clear()});
});
