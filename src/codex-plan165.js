/* Read-only inspection of an existing recipe. No live world, save or RNG ownership. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexPlan165=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root.document?.addEventListener)api.install(root.document);
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
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
 function inspect(id,rawSeed=0,z=0){
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
  const contents=details.interior.filter(o=>o.anchored160).reduce((n,o)=>n+(S?.surfaceItems165?.(o,seed).length||0),0);
  const source=R.describe(id),exteriorNames=new Set(source.rooms.filter(r=>r.exterior).map(r=>r.name));
  const approximated=plan.rooms.filter(r=>exteriorNames.has(r.name)).map(r=>r.name);
  return {id,seed,z,levels:[...template.levels],supported:true,p,plan,details,
   summary:Object.freeze({rooms:plan.rooms.length,sourceObjects:plan.objects.length,
    solidDetails:details.interior.filter(o=>o.solid).length,anchoredContents:contents,
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
 const CSS='.codex-plan165{border:1px solid #687557;padding:12px;margin:14px 0;min-width:0}.codex-plan165-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:end}.codex-plan165 label{display:flex;flex-direction:column;gap:5px;min-width:0;font-size:12px}.codex-plan165 input,.codex-plan165 select,.codex-plan165 button{min-height:44px;box-sizing:border-box;max-width:100%;font:inherit}.codex-plan165 input{width:170px}.codex-plan165 button{white-space:normal;padding:8px 12px}.codex-plan165 canvas{display:block;max-width:100%;width:100%;height:auto;margin-top:10px}.codex-plan165 [hidden]{display:none!important}.codex-plan165-status{overflow-wrap:anywhere;line-height:1.5}.codex-plan165 :focus-visible{outline:2px solid #e4c78e;outline-offset:2px}';
 function mount(doc,details,id){
  if(details.querySelector('[data-codex-plan165]'))return;
  const el=(tag,text)=>{const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  const host=el('section');host.className='codex-plan165';host.dataset.codexPlan165=id;
  host.append(el('h5','APERÇU DU PLAN DE RECETTE'),el('p','Lecture seule : gabarit simplifié, pas la carte de votre partie ni un lieu ajouté. Les prescriptions non matérialisées restent signalées.'));
  const controls=el('div');controls.className='codex-plan165-controls';
  const seedLabel=el('label','Graine de prévisualisation'),seed=el('input');seed.type='number';seed.min='0';seed.max=String(RULES.maxSeed);seed.step='1';
  seed.value=String((root.DEADWALL?.world?.seed??0)>>>0);seedLabel.append(seed);
  const floorLabel=el('label','Niveau'),floor=el('select');floorLabel.append(floor);
  const show=el('button','AFFICHER LE PLAN');show.type='button';
  const status=el('p');status.className='codex-plan165-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const canvas=el('canvas');canvas.width=RULES.width;canvas.height=RULES.height;canvas.hidden=true;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Plan simplifié du programme '+id);
  try{for(const z of dependencies().runtime.template(id,0,'preview-'+id).levels){const option=el('option',z===0?'Rez-de-chaussée':z<0?'Sous-sol '+Math.abs(z):'Étage '+z);option.value=String(z);floor.append(option);}floor.value='0';}
  catch(e){show.disabled=true;status.textContent=e.message;}
  let visible=false;
  const generate=()=>{try{
    const preview=inspect(id,seed.value,Number(floor.value));
    if(!preview.supported){canvas.hidden=true;status.textContent=preview.reason;return;}
    if(!render(canvas,preview))throw Error('Le peintre du jeu est indisponible.');
    const s=preview.summary;
    status.textContent=s.rooms+' pièces · '+s.sourceObjects+' objets du plan · '+s.solidDetails+' détails solides · '+s.anchoredContents+' petits ensembles décoratifs sur les meubles ajoutés. '+s.quantityUnplaced+' compléments demandés non posés faute de capacité, d’espace ou d’accès.'
     +(s.adapted?' Dimensions adaptées au gabarit simplifié.':'')
     +(s.exteriorSpacesSimplified.length?' Extérieurs source encore simplifiés : '+s.exteriorSpacesSimplified.join(', ')+'.':'');
    canvas.hidden=false;visible=true;show.textContent='ACTUALISER LE PLAN';
   }catch(e){canvas.hidden=true;status.textContent=e.message;}};
  show.addEventListener('click',e=>{e.stopPropagation();generate();});
  floor.addEventListener('change',()=>{if(visible)generate();});
  host.addEventListener('keydown',e=>{if(e.code!=='Escape'&&e.code!=='Tab')e.stopPropagation();});
  controls.append(seedLabel,floorLabel,show);host.append(controls,status,canvas);details.append(host);
  if(!doc.getElementById('codex-plan165-style')){const style=el('style',CSS);style.id='codex-plan165-style';(doc.head||doc.documentElement).append(style);}
 }
 const documents=new WeakSet();
 function install(doc){
  if(!doc?.addEventListener||documents.has(doc))return false;documents.add(doc);
  doc.addEventListener('toggle',event=>{
   const details=event.target;if(details?.tagName!=='DETAILS'||!details.open)return;
   const card=details.parentElement;if(card?.tagName!=='ARTICLE')return;
   const id=/^programme-(DW-\d{4})$/.exec(card.dataset?.codexId||'')?.[1];if(!id)return;
   // Let the owning Atlas handler finish its source fields before adding the inspector.
   queueMicrotask(()=>{if(details.isConnected&&details.open)mount(doc,details,id);});
  },true);return true;
 }
 return Object.freeze({RULES,validateSeed,inspect,render,mount,install});
});
