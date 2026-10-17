/* One contextual entry in the existing regional drawer; no additional overlay stack. */
(function(root){'use strict';
 function install(g,doc=root.document){
  if(!g?.wildHarvest190||!doc||g.wildHarvestUI190)return false;
  const terrain=doc.getElementById('fieldDockTerrain'),host=terrain?.querySelector('.field-dock-terrain-body');if(!host||!doc.body.contains(host))return false;
  const button=doc.createElement('button');button.id='wildHarvest190Open';button.type='button';button.textContent='FAUNE & RÉCOLTES';
  button.setAttribute('aria-label','Ouvrir les récoltes sauvages : chasse et pêche');host.appendChild(button);
  button.addEventListener('click',()=>{if(!button.disabled){terrain.open=false;g.expansionUI?.open('wildlife190');}});
  const refresh=()=>{const p=g.frontier.position();button.hidden=!p.active||p.z!==0||p.hydrologyVersion!==1;button.disabled=g.gameOver||g.player.dead||!g.canIssueCommand();};
  const previous=g.updateUI.bind(g);g.updateUI=(...a)=>{const result=previous(...a);refresh();return result;};
  g.wildHarvestUI190=Object.freeze({refresh,button});refresh();return true;
 }
 const api=Object.freeze({install});root.DeadwallWildlifeHarvestUI190=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 const mount=()=>install(root.DEADWALL);if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else if(root.document)mount();
})(globalThis);
