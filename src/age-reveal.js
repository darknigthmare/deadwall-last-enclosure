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
 function query(name){try{return new URLSearchParams(root.location?.search||'').get(name);}catch{return null;}}
 // Les parcours automatisés et l'atelier auteur gardent l'interface complète, sauf demande explicite.
 function bypassed(){
  if(query('agereveal')==='1')return false;
  if(query('agereveal')==='0'||query('tools')==='1')return true;
  return root.navigator?.webdriver===true;
 }
 function install(g,doc){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
  if(!g||!doc||!C?.AgeReveal||g.ageReveal)return false;
  const rules=C.AgeReveal,off=bypassed();
  const revealAll=()=>off||g.settings?.revealAll===true;
  const age=()=>rules.normalizeAge(g.tier?.id);
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
   for(const entry of rules.entries){
    const veiled=active&&!rules.visible(entry,current,all);
    for(const node of nodes(entry)){
     const has=node.getAttribute?.(ATTRIBUTE)==='true';
     if(veiled&&!has)node.setAttribute(ATTRIBUTE,'true');
     else if(!veiled&&has)node.removeAttribute(ATTRIBUTE);
    }
   }
   const note=doc.getElementById('settingsRevealNote');
   if(note){
    const next=rules.next(current,all),text=all?'Tous les menus sont affichés.':next?`Prochain âge, ${next.name} : ${next.entries.map(entry=>entry.label).join(', ')}.`:'Tous les menus de votre cité sont ouverts.';
    if(note.textContent!==text)note.textContent=text;
   }
   return true;
  }
  const wrap=name=>{const old=g[name];if(typeof old!=='function')return;g[name]=function(...args){const result=old.apply(this,args);apply();return result;};};
  wrap('updateUI');wrap('showCommand');
  g.ageReveal=Object.freeze({apply,bypassed:off,pending:()=>rules.pending(age(),revealAll()),next:()=>rules.next(age(),revealAll())});
  apply();return true;
 }
 return Object.freeze({install,ATTRIBUTE,bypassed});
});
