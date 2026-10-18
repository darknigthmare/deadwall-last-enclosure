/* A bulletin over the existing rain owner, with seeded fronts for opted-in runs. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Weather193Rules;
 function unit(seed,index,salt){
  let n=(seed^Math.imul(index,0x9e3779b1)^salt)>>>0;
  n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);
  return ((n^(n>>>16))>>>0)/4294967296;
 }
 function front(seed,index){
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(index)||index<0)throw Error('Front météo invalide.');
  const wet=unit(seed,Math.floor(index/R.spellFronts),193071)<R.wetSpellChance;
  const pool=wet?R.wetPool:R.dryPool,id=index===0?'dry':pool[Math.floor(unit(seed,index,193093)*pool.length)];
  const def=R.fronts[id];return{id,index,...def,wind:def.wind*(unit(seed,index,193117)<.5?-1:1)};
 }
 function sample(seed,elapsed){
  if(!Number.isFinite(elapsed)||elapsed<0||elapsed>1e12)throw Error('Temps météo invalide.');
  const index=Math.floor(elapsed/R.frontSeconds),left=(index+1)*R.frontSeconds-elapsed;
  return{...front(seed,index),left,next:left<=R.forecastLead?front(seed,index+1):null};
 }
 function initial(){return{version:1,active:false};}
 function validate(raw){
  if(raw===undefined)return initial();
  if(!raw||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||Object.keys(raw).length!==2||Object.keys(raw).some(k=>!['version','active'].includes(k)))throw Error('Bulletin météo193 invalide.');
  return{version:1,active:raw.active};
 }
 function install(g){
  if(g.weather193)return g.weather193;if(!g.expansions)throw Error('Installer les opérations avant la météo.');
  let state=initial();
  const current=()=>sample(g.world.seed,g.elapsed),target=()=>current().rain;
  const active=()=>state.active;
  function activationQuote(){
   if(active())return{ok:false,reason:'Les fronts météorologiques sont déjà actifs pour cette campagne.'};
   const core=g.core(),p=g.frontier?.position?.();
   if(!g.expansions.canAct()||g.expansions.busy('weather193')||g.player.reload>0||g.selectedBuild||g.fieldcraft?.context?.().mounted||p?.active||g.expeditions?.driving?.()||!core||!g.workerCanWorkAt(g.player,core,R.activationReach))return{ok:false,reason:'Consultez le bulletin au dépôt de D-17, à pied et les mains libres.'};
   return{ok:true};
  }
  function activate(){const q=activationQuote();if(!q.ok)return q;state.active=true;g.notify?.('Bulletin météo actif : la pluie évolue par fronts liés à la graine.');g.audio?.ui?.();g.save(false);return{ok:true};}
  const percentage=n=>Math.round(Math.max(0,Math.min(1,n))*100)+' %';
  function overview(){
   const f=current(),rain=g.weather||0,delta=g.weatherTarget-rain;
   return{summary:active()?f.note:'La campagne conserve sa météo historique. Le bulletin peut être activé une fois au dépôt.',rows:[
    {label:'Pluie observée',value:percentage(rain)+(delta>.03?' · en renforcement':delta<-.03?' · en diminution':' · stable')},
    {label:'Front en cours',value:active()?f.name+' · '+Math.ceil(f.left)+' s avant la relève':'Météo historique'},
    {label:'Prochaine tendance',value:active()?(f.next?f.next.name+' · pluie visée '+percentage(f.next.rain):'Bulletin disponible '+R.forecastLead+' s avant la relève'):'Non prévue par le modèle historique'},
    {label:'Éclairage découvert',value:'Les flammes exposées s’usent sous la pluie. Préparez un éclairage protégé avant la sortie.'},
    {label:'Sol de D-17',value:rain>.62?'Terrain naturel et chemins de terre ralentis par la pluie ; privilégiez les accès empierrés ou revêtus.':'Pluie faible : repérez vos chemins avant de vous éloigner du refuge.'},
    {label:'Région',value:'Repérez un pont pour franchir un cours d’eau et gardez une route de retour vers D-17.'}
   ]};
  }
  function actions(){if(active())return[];const q=activationQuote();return[{id:'activate',label:'Activer les fronts météo pour cette campagne',description:'Conserve le monde et les stocks. La météo future devient liée à la graine et au temps actif. Activation durable, sans retour au modèle historique.',disabled:!q.ok,reason:q.reason||'Aucun matériau consommé ; la météo ne crée aucun stock.',run:activate}];}
  const api=Object.freeze({active,current,target,forecast:()=>current().next,overview,actions,activationQuote,activate,snapshot:()=>validate(state)});g.weather193=api;
  g.expansions.register({id:'weather193',title:'Météo & préparation',overview,actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);},reset:()=>{state={version:1,active:true};}});
  return api;
 }
 const api=Object.freeze({front,sample,initial,validate,install});root.DeadwallWeather193=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
