/* Read-only inspection of an existing recipe. No live world, save or RNG ownership. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexPlan165=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root.document?.addEventListener)api.install(root.document);
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const Coverage=root.DeadwallCodexCoverage167||(typeof require==='function'?require('./codex-coverage167.js'):null);
 const RULES=Object.freeze({width:900,height:720,minSeed:0,maxSeed:4294967295});
 function dependencies(){return {
  runtime:root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null),
  geometry:root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null),
  detail:root.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null),
  dressing:root.DeadwallCodexDressing160||(typeof require==='function'?require('./codex-dressing160.js'):null)
 };}
 function validateSeed(value){
  if(typeof value==='string'&&!/^\d{1,10}$/.test(value.trim()))throw Error('Graine entière requise, entre 0 et 4 294 967 295.');
  if(!['string','number'].includes(typeof value))throw Error('Graine entière requise.');
  const seed=Number(value);if(!Number.isSafeInteger(seed)||seed<RULES.minSeed||seed>RULES.maxSeed)throw Error('Graine entière requise, entre 0 et 4 294 967 295.');return seed;
 }
 function inspect(id,rawSeed=0,z=0,detailVersion=5){
  if(![5,6,7,8,9,10].includes(detailVersion))throw Error('Révision d’aperçu inconnue.');
  if(typeof id!=='string'||!/^DW-\d{4}$/.test(id))throw Error('Identifiant de programme invalide.');
  const seed=validateSeed(rawSeed),{runtime:R,geometry:G,detail:D,dressing:S}=dependencies();
  const programme=R?.get(id);if(!programme||!G||!D)throw Error('Programme ou générateur indisponible.');
  const template=R.template(id,seed,'preview-'+id);
  if(!Number.isInteger(z)||!template.levels.includes(z))throw Error('Niveau absent du programme.');
  // Do not draw an office-shaped surrogate for a port, tunnel or full district.
  const preset=R.preset('codex3000-'+id.slice(3));
  if(!preset)return Object.freeze({id,seed,z,levels:[...template.levels],supported:false,
   reason:'Aucun gabarit de bâtiment disponible pour cet aperçu. Les ouvrages et terrains spécialisés restent à développer.'});
  const p={id:'preview-'+id,type:preset.id,codex:id,programme3000:id,name:programme.name,
   w:template.w,h:template.h,levels:[...template.levels],x:template.w/2,y:template.h/2,a:0,generation:8};
  p.outdoor=G.outdoor(p);p.parking=G.parking(p);
  const plan=R.floor(id,seed,z,p.id);
  let details=D.make(seed,p,z,plan,{family:R.detailFamily(programme.family),story:R.programmeProps(programme.state)});
  details=R.enrich({seed,p,z,plan,detail:details,programme:id,shapes:D.objects});
  details=R.dress({seed,p,z,plan,detail:details});
  details=R.anchored({seed,p,z,plan,detail:details,programme:id});
  details=R.quantities({seed,p,z,plan,detail:details,programme:id});
  details=R.ensembles({seed,p,z,plan,detail:details,programme:id});
  if(detailVersion>=6)details=R.fill({seed,p,z,plan,detail:details,programme:id});
  if(detailVersion>=7)details=R.infill({seed,p,z,plan,detail:details,programme:id});
  if(detailVersion>=8)details=R.stations({seed,p,z,plan,detail:details,programme:id});
  if(detailVersion>=9)details=R.gardens({seed,p,z,plan,detail:details,programme:id});
  if(detailVersion>=10)details=R.packing({seed,p,z,plan,detail:details,programme:id});
  const contents=details.interior.filter(o=>o.anchored160).reduce((n,o)=>n+(S?.surfaceItems165?.(o,seed).length||0),0);
  const source=R.describe(id),exteriorNames=new Set(source.rooms.filter(r=>r.exterior).map(r=>r.name));
  const approximated=plan.rooms.filter(r=>exteriorNames.has(r.name)).map(r=>r.name);
  return {id,seed,z,detailVersion,levels:[...template.levels],supported:true,p,plan,details,
   summary:Object.freeze({rooms:plan.rooms.length,sourceObjects:plan.objects.length,
    solidDetails:details.interior.filter(o=>o.solid).length,anchoredContents:contents,
    composedGroups:details.ensembles165?.groups?.length||0,composedSeats:(details.ensembles165?.groups||[]).reduce((n,g)=>n+g.seats,0),
    groupUnplaced:(details.ensembles165?.requests||[]).reduce((n,r)=>n+(r.unplaced||0),0),
    exteriorSpacesSimplified:approximated,adapted:template.adapted===true,
    quantityUnplaced:(details.quantities164?.requests||[]).reduce((n,r)=>n+(r.unplaced||0),0)}),
   reference:template.reference};
 }
 function render(canvas,preview){
  const art=root.DeadwallFrontierArt;
  if(!preview?.supported||!canvas?.getContext||typeof art?.lot!=='function')return false;
  const c=canvas.getContext('2d');if(!c)return false;
  const {p,plan,details,z,seed}=preview,scale=Math.min((canvas.width-48)/(p.w+28),(canvas.height-48)/(p.h+48));
  c.save();try{
   c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#28382e';c.fillRect(0,0,canvas.width,canvas.height);
   c.translate((canvas.width-(p.w+28)*scale)/2+14*scale,24+18*scale);c.scale(scale,scale);
   // The existing painter receives a disposable read-only view, never the live region.
   art.lot(c,p,{world:{seed,plan:()=>plan,detailAt:()=>details},x:p.w/2,y:p.h/2,z,inside:p.id,taken:{},scale,car:null});
  }finally{c.restore();}
  return true;
 }
 const CSS='.codex-plan165{border:1px solid #687557;padding:12px;margin:14px 0;min-width:0}.codex-plan165-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:end}.codex-plan165 label{display:flex;flex-direction:column;gap:5px;min-width:0;font-size:12px}.codex-plan165 input,.codex-plan165 select,.codex-plan165 button{min-height:44px;box-sizing:border-box;max-width:100%;font:inherit}.codex-plan165 input{width:170px}.codex-plan165 button{white-space:normal;padding:8px 12px}.codex-plan165 canvas{display:block;max-width:100%;width:100%;height:auto;margin-top:10px}.codex-plan165 [hidden]{display:none!important}.codex-plan165-status{overflow-wrap:anywhere;line-height:1.5}.codex-plan165 :focus-visible{outline:2px solid #e4c78e;outline-offset:2px}.codex-coverage167{border-top:1px solid #687557;margin-top:12px;padding-top:8px;overflow-wrap:anywhere;min-width:0}.codex-coverage167 h6{font-size:13px}.codex-coverage167 li{font-size:12px;line-height:1.55;margin:5px 0}';
 function mount(doc,details,id){
  if(details.querySelector('[data-codex-plan165]'))return;
  const el=(tag,text)=>{const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  const host=el('section');host.className='codex-plan165';host.dataset.codexPlan165=id;
  host.append(el('h5','APERÇU DU PLAN DE RECETTE'),el('p','Lecture seule : gabarit simplifié, pas la carte de votre partie ni un lieu ajouté. Les prescriptions non matérialisées restent signalées. Les ensembles table-assises de la révision 5 sont visibles ici ; dans la partie, COMPOSER TABLES ET ASSISES au dépôt reste une activation volontaire, sans nouveau butin.'));
  const controls=el('div');controls.className='codex-plan165-controls';
  const seedLabel=el('label','Graine de prévisualisation'),seed=el('input');seed.type='number';seed.min='0';seed.max=String(RULES.maxSeed);seed.step='1';
  seed.value=String((root.DEADWALL?.world?.seed??0)>>>0);seedLabel.append(seed);
  const floorLabel=el('label','Niveau'),floor=el('select');floorLabel.append(floor);
  const fillLabel=el('label','Compléter les minima auteur (révision 6)'),fillToggle=el('input');fillToggle.type='checkbox';fillToggle.dataset.fill168='revision';fillToggle.style.width='24px';fillLabel.append(fillToggle);
  const yardLabel=el('label','Compléter pièces et cours (révision 7, inclut la 6)'),yardToggle=el('input');yardToggle.type='checkbox';yardToggle.dataset.infill169='revision';yardToggle.style.width='24px';yardLabel.append(yardToggle);
  const stationLabel=el('label','Compléter ateliers et stockages (révision 8, inclut 6–7)'),stationToggle=el('input');stationToggle.type='checkbox';stationToggle.dataset.stations170='revision';stationToggle.style.width='24px';stationLabel.append(stationToggle);
  const gardenLabel=el('label','Composer les jardins et cours (révision 9, inclut 6–8)'),gardenToggle=el('input');gardenToggle.type='checkbox';gardenToggle.dataset.gardens171='revision';gardenToggle.style.width='24px';gardenLabel.append(gardenToggle);
  const packLabel=el('label','Compléter les travées intérieures (révision 10)'),packToggle=el('input');packToggle.type='checkbox';packToggle.dataset.packing173='revision';packToggle.style.width='24px';packLabel.append(packToggle);
  const show=el('button','AFFICHER LE PLAN');show.type='button';
  const status=el('p');status.className='codex-plan165-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const canvas=el('canvas');canvas.width=1;canvas.height=1;canvas.hidden=true;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Plan simplifié du programme '+id);
  try{for(const z of dependencies().runtime.template(id,0,'preview-'+id).levels){const option=el('option',z===0?'Rez-de-chaussée':z<0?'Sous-sol '+Math.abs(z):'Étage '+z);option.value=String(z);floor.append(option);}floor.value='0';}
  catch(e){show.disabled=true;status.textContent=e.message;}
  const coverage=el('div');coverage.className='codex-coverage167';
  if(Coverage)Coverage.render(doc,coverage,Coverage.source(id));
  let visible=false;
  const generate=()=>{try{
    const preview=inspect(id,seed.value,Number(floor.value),packToggle.checked?10:gardenToggle.checked?9:stationToggle.checked?8:yardToggle.checked?7:fillToggle.checked?6:5);
    if(Coverage)Coverage.render(doc,coverage,Coverage.compare(preview));
    if(!preview.supported){canvas.hidden=true;canvas.width=canvas.height=1;status.textContent=preview.reason;return;}
    canvas.width=RULES.width;canvas.height=RULES.height;
    if(!render(canvas,preview))throw Error('Le peintre du jeu est indisponible.');
    const s=preview.summary;
    status.textContent=s.rooms+' pièces · '+s.sourceObjects+' objets du plan · '+s.solidDetails+' détails solides · '+s.anchoredContents+' petits ensembles décoratifs sur les meubles ajoutés. '+s.quantityUnplaced+' compléments demandés non posés faute de capacité, d’espace ou d’accès.'
     +' '+s.composedGroups+' ensembles table-assises · '+s.composedSeats+' sièges composés · '+s.groupUnplaced+' ensembles non posés. Aperçu de la révision '+preview.detailVersion+', activation volontaire au dépôt.'
     +(preview.details.packing173?' '+preview.details.packing173.added+' compléments de travées réellement posés, sans nouveau butin.':'')
     +(preview.details.fill168?' '+preview.details.fill168.added+' équipements manquants effectivement ajoutés ; aucun stock ni branchement supplémentaire.':'')
     +(preview.details.infill169?' '+preview.details.infill169.added+' compléments de pièces et cours ; '+preview.details.infill169.zones.length+' zones de placement extérieures. Aucun jardin natif complet garanti.':'')
     +(preview.details.stations170?' '+preview.details.stations170.added+' machines, palettes ou caisses placées ; zones de service libres, appareils non alimentés.':'')
     +(preview.details.gardens171?' '+preview.details.gardens171.added+' équipements de jardin placés ; composition par zones et chemins préservés, sans nouveau butin.':'')
     +(s.adapted?' Dimensions adaptées au gabarit simplifié.':'')
     +(s.exteriorSpacesSimplified.length?' Extérieurs source encore simplifiés : '+s.exteriorSpacesSimplified.join(', ')+'.':'');
    canvas.hidden=false;visible=true;show.textContent='ACTUALISER LE PLAN';
   }catch(e){canvas.hidden=true;status.textContent=e.message;}};
  show.addEventListener('click',e=>{e.stopPropagation();generate();});
  floor.addEventListener('change',()=>{if(visible)generate();});
  host.addEventListener('keydown',e=>{if(e.code!=='Escape'&&e.code!=='Tab')e.stopPropagation();});
  fillToggle.addEventListener('change',()=>{if(visible)generate();});
  const syncRevisions=()=>{gardenToggle.disabled=packToggle.checked;stationToggle.disabled=packToggle.checked||gardenToggle.checked;yardToggle.disabled=packToggle.checked||gardenToggle.checked||stationToggle.checked;fillToggle.disabled=packToggle.checked||gardenToggle.checked||stationToggle.checked||yardToggle.checked;if(visible)generate();};
  yardToggle.addEventListener('change',syncRevisions);stationToggle.addEventListener('change',syncRevisions);gardenToggle.addEventListener('change',syncRevisions);packToggle.addEventListener('change',syncRevisions);
  controls.append(seedLabel,floorLabel,fillLabel,yardLabel,stationLabel,gardenLabel,packLabel,show);host.append(controls,status,canvas,coverage);details.append(host);
  details.addEventListener('toggle',()=>{if(!details.open){canvas.width=canvas.height=1;canvas.hidden=true;visible=false;show.textContent='AFFICHER LE PLAN';}});
  if(!doc.getElementById('codex-plan165-style')){const style=el('style',CSS);style.id='codex-plan165-style';(doc.head||doc.documentElement).append(style);}
 }
 const documents=new WeakSet();
 function install(doc){
  if(!doc?.addEventListener||documents.has(doc))return false;documents.add(doc);
  doc.addEventListener('toggle',event=>{
   const details=event.target;if(details?.tagName!=='DETAILS'||!details.open)return;
   const card=details.parentElement;if(card?.tagName!=='ARTICLE')return;
   const id=/^programme-(DW-\d{4})$/.exec(card.dataset?.codexId||'')?.[1];if(!id||details.dataset?.codexSource159!==card.dataset.codexId)return;
   // Let the owning Atlas handler finish its source fields before adding the inspector.
   queueMicrotask(()=>{if(details.isConnected&&details.open)mount(doc,details,id);});
  },true);return true;
 }
 return Object.freeze({RULES,validateSeed,inspect,render,mount,install});
});
