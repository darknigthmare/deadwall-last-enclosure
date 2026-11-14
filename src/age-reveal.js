// Révélation de l'interface par âge (docs/GAME_BIBLE.md §6).
// Présentation seulement : ce module pose ou retire un attribut sur des contrôles existants.
// Il ne lit ni n'écrit aucun stock, aucune règle, aucun tirage et aucune sauvegarde.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallAgeReveal=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{if(root.DEADWALL)api.install(root.DEADWALL,root.document);},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const ATTRIBUTE='data-age-veiled';
 // Table de présentation, pas d'équilibrage : `age` est l'indice de CITY_TIERS (0 = Refuge).
 // Elle vit ici et non dans core.js parce qu'aucune règle de simulation ne la lit.
 function rules(C){
  const tiers=C.CITY_TIERS,entries=Object.freeze([
   {key:'soldiers',label:'Fusiliers',age:C.SURVIVORS.soldier.tier,ids:['recruitSoldier']},
   {key:'rally',label:'Point de ralliement',age:1,ids:['setRally']},
   {key:'crew',label:'Dossier de l’équipe',age:1,fieldViews:['crew']},
   {key:'specialists',label:'Spécialistes',age:Math.min(C.SURVIVORS.medic.tier,C.SURVIVORS.engineer.tier),ids:['specialistCommandButton']},
   {key:'sorties',label:'Sorties',age:2,fieldViews:['operations']},
   {key:'siege',label:'Siège et secours',age:2,fieldViews:['siege']},
   {key:'linecare',label:'Entretien des lignes',age:2,fieldViews:['linecare']},
   {key:'squads',label:'Sections de fusiliers',age:3,ids:['squadCommandButton','hud143Squads']},
   {key:'logistics',label:'Logistique',age:3,fieldViews:['logistics']},
   {key:'weather',label:'Bulletin météo',age:4,ids:['weather193Open193']},
   {key:'territories',label:'Quartiers',age:5,fieldViews:['territories']}
  ].map(entry=>Object.freeze({key:entry.key,label:entry.label,age:entry.age,ids:Object.freeze(entry.ids||[]),fieldViews:Object.freeze(entry.fieldViews||[])})));
  const normalizeAge=age=>{const n=Math.floor(Number(age));return Number.isFinite(n)?Math.max(0,Math.min(tiers.length-1,n)):0;};
  const visible=(entry,age,revealAll=false)=>revealAll===true||normalizeAge(age)>=entry.age;
  const pending=(age,revealAll=false)=>revealAll===true?[]:entries.filter(entry=>!visible(entry,age,false));
  const next=(age,revealAll=false)=>{const list=pending(age,revealAll);if(!list.length)return null;const target=Math.min(...list.map(entry=>entry.age));return Object.freeze({age:target,name:tiers[target].name,entries:Object.freeze(list.filter(entry=>entry.age===target))});};
  return Object.freeze({version:1,entries,normalizeAge,visible,pending,next});
 }
 function query(name){try{return new URLSearchParams(root.location?.search||'').get(name);}catch{return null;}}
 // Les parcours automatisés et l'atelier auteur gardent l'interface complète, sauf demande explicite.
 function bypassed(){
  if(query('agereveal')==='1')return false;
  if(query('agereveal')==='0'||query('tools')==='1')return true;
  return root.navigator?.webdriver===true;
 }
 function install(g,doc){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
  if(!g||!doc||!C?.CITY_TIERS||g.ageReveal)return false;
  const table=rules(C),off=bypassed();
  const revealAll=()=>off||g.settings?.revealAll===true;
  const age=()=>table.normalizeAge(g.tier?.id);
  function nodes(entry){
   const found=[];
   for(const id of entry.ids){const node=doc.getElementById(id);if(node)found.push(node);}
   if(entry.fieldViews.length){
    const nav=doc.getElementById('commandPanel-field')?.querySelector?.('.field-nav');
    for(const node of nav?.children||[])if(entry.fieldViews.includes(node.dataset?.fieldView))found.push(node);
   }
   return found;
  }
  function apply(){
   const active=g.state==='playing',current=age(),all=revealAll();
   for(const entry of table.entries){
    const veiled=active&&!table.visible(entry,current,all);
    for(const node of nodes(entry)){
     const has=node.getAttribute?.(ATTRIBUTE)==='true';
     if(veiled&&!has)node.setAttribute(ATTRIBUTE,'true');
     else if(!veiled&&has)node.removeAttribute(ATTRIBUTE);
    }
   }
   const note=doc.getElementById('settingsRevealNote');
   if(note){
    const next=table.next(current,all),text=all?'Tous les menus sont affichés.':next?`Prochain âge, ${next.name} : ${next.entries.map(entry=>entry.label).join(', ')}.`:'Tous les menus de votre cité sont ouverts.';
    if(note.textContent!==text)note.textContent=text;
   }
   return true;
  }
  const wrap=name=>{const old=g[name];if(typeof old!=='function')return;g[name]=function(...args){const result=old.apply(this,args);apply();return result;};};
  wrap('updateUI');wrap('showCommand');
  g.ageReveal=Object.freeze({apply,bypassed:off,pending:()=>table.pending(age(),revealAll()),next:()=>table.next(age(),revealAll())});
  apply();return true;
 }
 return Object.freeze({install,rules,ATTRIBUTE,bypassed});
});
