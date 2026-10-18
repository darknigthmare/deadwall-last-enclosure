/* Contextual preparation links reuse the existing operation dialog and focus. */
(function(root){'use strict';
 function install(g,doc=root.document){
  if(!g?.expansionUI||!g.weather193||!g.forage193||!doc||g.fieldContent193UI)return false;
  const drawer=doc.getElementById('fieldDockTerrain'),host=drawer?.querySelector('.field-dock-terrain-body');
  if(!host||!doc.body.contains(host))return false;
  const links=[['weather193','MÉTÉO & PRÉPARATION','Ouvrir le bulletin météo et ses précautions'],['forage193','CUEILLETTE & RAMASSAGE','Ouvrir les cueillettes proches et leurs conditions'],['campaign','MISSIONS & RETOUR','Ouvrir les opérations et leur feuille de route']].map(([id,label,description])=>{
   const button=doc.createElement('button');button.type='button';button.id=id+'Open193';button.textContent=label;button.setAttribute('aria-label',description);
   button.addEventListener('click',()=>{if(!button.disabled){drawer.open=false;g.expansionUI.open(id);}});host.appendChild(button);return{id,button};
  });
  const refresh=()=>{const p=g.frontier.position();for(const {id,button}of links){button.hidden=!p.active||id==='forage193'&&p.z!==0;button.disabled=g.gameOver||g.player.dead||!g.canIssueCommand();}};
  const previous=g.updateUI.bind(g);g.updateUI=(...args)=>{const result=previous(...args);refresh();return result;};
  g.fieldContent193UI=Object.freeze({refresh});refresh();return true;
 }
 const api=Object.freeze({install});root.DeadwallFieldContent193UI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 const mount=()=>install(root.DEADWALL);if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else if(root.document)mount();
})(globalThis);
