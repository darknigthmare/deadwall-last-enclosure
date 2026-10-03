/* Personal field preparations: finite protection, upkeep, ammunition and tools. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Player131Rules;
const weapons=Object.keys(C.WEAPONS);
const initial=()=>({version:1,armor:0,reserve:0,tools:0,care:Object.fromEntries(weapons.map(k=>[k,0]))});
function validate(raw){
 if(raw===undefined)return initial();
 const bad=()=>{throw Error('Préparations personnelles invalides.');};
 const object=(o,keys)=>{if(!o||Array.isArray(o)||typeof o!=='object'||Object.keys(o).length!==keys.length||Object.keys(o).some(k=>!keys.includes(k)))bad();};
 const number=(v,max,integer=false)=>{if(!Number.isFinite(v)||v<0||v>max||integer&&!Number.isInteger(v))bad();return v;};
 object(raw,['version','armor','reserve','tools','care']);if(raw.version!==1)bad();object(raw.care,weapons);
 return{version:1,armor:number(raw.armor,R.vest.absorption),reserve:number(raw.reserve,R.ammo.capacity),tools:number(raw.tools,R.tools.budget),care:Object.fromEntries(weapons.map(k=>[k,number(raw.care[k],R.service.reloads,true)]))};
}
function install(g){
 if(g.playerOps131)return g.playerOps131;
 if(!g.expansions)throw Error('Le registre des opérations est requis.');
 let state=initial(),task=null,message='';
 const wrap=(name,fn)=>{const previous=g[name].bind(g);g[name]=(...args)=>fn(previous,...args);};
 const running=()=>g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver;
 const alive=()=>g.player&&!g.player.dead&&g.player.health>0;
 const position=()=>{const f=g.frontier.position();return f.active?{domain:'region',x:f.x,y:f.y,z:f.z,inside:f.inside}:{domain:'local',x:g.player.x,y:g.player.y,z:0,inside:null};};
 const driving=()=>g.expeditions.driving()||!!g.frontier.position().car?.driving;
 const manualPost=()=>Boolean(g.fieldcraft?.context?.()?.mounted);
 const depot=()=>!g.frontier.active()&&!driving()&&[...g.world.buildings.values()].some(b=>!b.dead&&b.health>0&&b.completed&&(b.type==='core'||b.type==='warehouse'||b.def.storageDepot)&&g.workerCanWorkAt(g.player,b,R.homeReach));
 const fail=reason=>{message=reason;return{ok:false,reason};};
 function danger(p){
  if(p.domain==='local')return g.nearbyZombies(p.x,p.y,R.safeRadius*32).some(e=>!e.dead&&e.health>0&&Math.hypot(e.x-p.x,e.y-p.y)<R.safeRadius*32);
  return [...g.frontier.overview().enemies,...(g.worldEvolution?.groupMembers?.()||[])].some(e=>e.hp>0&&e.z===p.z&&(p.z===0||e.poi===p.inside)&&Math.hypot(e.x-p.x,e.y-p.y)<R.safeRadius);
 }
 function preview(kind){
  if(!['vest','service','ammo','tools'].includes(kind))return{ok:false,reason:'Préparation inconnue.'};
  if(!g.expansions.canAct()||!alive()||driving()||manualPost()||task||g.expansions.busy('player131')||g.player.reload>0)return{ok:false,reason:'Le commandant doit être libre, à pied.'};
  if(!depot())return{ok:false,reason:'Approchez d’un dépôt de D-17 par un accès libre.'};
  if(danger(position()))return{ok:false,reason:'Sécurisez les abords du dépôt.'};
  if(kind==='service'&&g.arsenal134&&g.arsenal134.weaponSpec()?.category!=='firearm')return{ok:false,reason:'Prenez une arme à feu en main pour nettoyer son mécanisme.'};
  if(kind==='vest'&&state.armor>=R.vest.absorption)return{ok:false,reason:'Votre gilet est déjà ajusté.'};
  if(kind==='tools'&&state.tools>0)return{ok:false,reason:'Utilisez d’abord les outils consommables déjà préparés.'};
  if(kind==='service'&&state.care[g.player.weapon]>=R.service.reloads)return{ok:false,reason:'Cette arme vient d’être entretenue.'};
  const cost=kind==='ammo'?{ammo:Math.min(R.ammo.capacity-state.reserve,Math.floor(g.resources.ammo))}:R[kind].cost;
  if(kind==='ammo'&&cost.ammo<=0)return{ok:false,reason:state.reserve>=R.ammo.capacity?'Cartouchière pleine.':'Aucune munition disponible au dépôt.'};
  if(!C.canAfford(g.resources,cost))return{ok:false,reason:'Matériaux insuffisants dans ce dépôt.'};
  return{ok:true,seconds:R[kind].seconds,cost:{...cost},weapon:g.player.weapon};
 }
 function begin(kind){const q=preview(kind);if(!q.ok)return fail(q.reason);task={kind,...q,elapsed:0,position:position(),health:g.player.health};message=R[kind].name+' — restez sur place.';g.releaseInputs();return{ok:true};}
 function cancel(reason='Préparation interrompue : aucun matériau dépensé.') {if(!task)return false;task=null;message=reason;return true;}
 function finish(t,q){
  // The reserve amount is fixed at the start; a changed stock cannot increase it.
  const cost=t.kind==='ammo'?t.cost:q.cost;if(!C.canAfford(g.resources,cost)){cancel('Le stock a changé : préparation interrompue.');return;}
  C.spend(g.resources,cost);
  if(t.kind==='vest')state.armor=R.vest.absorption;
  if(t.kind==='service')state.care[t.weapon]=R.service.reloads;
  if(t.kind==='ammo')state.reserve+=cost.ammo;
  if(t.kind==='tools')state.tools=R.tools.budget;
  task=null;message=({vest:'Gilet ajusté. Protection limitée ; la course demande plus d’effort.',service:'Rechargements préparés pour cette famille. La réparation de l’arme se fait à l’armurerie.',ammo:'Cartouchière chargée. Ces munitions vous suivent sur la route.',tools:'Outils préparés. Maintenez E au contact d’un chantier pour les utiliser.'})[t.kind];g.notify(message,'good');g.audio.ui?.();g.save(false);
 }
 function step(dt){
  if(!running()||!Number.isFinite(dt)||dt<=0)return;
  if(!alive()){cancel('Mise à terre : préparation interrompue.');return;}
  if(!task)return;
  const t=task,p=position();task=null;const q=preview(t.kind);task=t;
  const moved=p.domain!==t.position.domain||p.z!==t.position.z||p.inside!==t.position.inside||Math.hypot(p.x-t.position.x,p.y-t.position.y)>R.moveTolerance*(p.domain==='local'?32:1);
  if(!q.ok||moved||g.player.health<t.health||g.player.weapon!==t.weapon||t.kind==='ammo'&&state.reserve+t.cost.ammo>R.ammo.capacity){cancel(q.reason||'Préparation interrompue.');return;}
  t.elapsed+=Math.min(dt,R.maxStep);g.interactionText=R[t.kind].name+' · '+Math.floor(t.elapsed/t.seconds*100)+' % · déplacement pour annuler';
  if(t.elapsed+1e-7>=t.seconds)finish(t,q);
 }
 function reloadAvailable(){
  if(!alive()||driving())return 0;
  return state.reserve+Math.max(0,g.player.carry.ammo)+(depot()?Math.max(0,g.resources.ammo):0);
 }
 function spendReload(amount){
  if(!Number.isFinite(amount)||amount<=0||!alive()||driving()||amount>reloadAvailable()+1e-8)return false;
  let left=amount,used=Math.min(state.reserve,left);state.reserve-=used;left-=used;
  used=Math.min(g.player.carry.ammo,left);g.player.carry.ammo-=used;left-=used;
  if(left>1e-8)g.resources.ammo-=left;
  return true;
 }
 function storeAmmo(){
  if(!g.expansions.canAct()||!alive()||manualPost()||!depot()||g.expansions.busy()||g.player.reload>0)return fail('Rejoignez le dépôt librement pour vider la cartouchière.');
  const amount=Math.min(state.reserve,Math.max(0,g.storage-g.resources.ammo));if(amount<=0)return fail('Cartouchière vide ou dépôt plein.');
  state.reserve-=amount;g.resources.ammo+=amount;g.save(false);g.audio.ui?.();return{ok:true,amount};
 }
 function absorbDamage(amount){
  if(!Number.isFinite(amount)||amount<=0||!alive()||g.player.invulnerable>0||driving()||state.armor<=0)return amount;
  cancel('Impact reçu : préparation interrompue.');
  const saved=Math.min(state.armor,amount*R.vest.reduction);state.armor=Math.max(0,state.armor-saved);
  if(state.armor<=1e-8){state.armor=0;g.notify('Gilet déchiré : protection épuisée. Remplacez-le au dépôt.','danger');}
  return amount-saved;
 }
 function constructionFactor(dt){
  if(!running()||!alive()||g.frontier.active()||driving()||!g.input.keys.has('KeyE')||!Number.isFinite(dt)||dt<=0||state.tools<=0)return 1;
  const spent=Math.min(state.tools,Math.min(dt,R.maxStep)*R.tools.bonus);state.tools=Math.max(0,state.tools-spent);
  if(state.tools<=1e-8){state.tools=0;g.notify('Boîte d’outils consommée. Le chantier continue au rythme habituel.');}
  return 1+spent/dt;
 }
 function equipment(){
  const items=[];
  if(state.armor>0)items.push({id:'vest',name:'Gilet de fortune',slot:'torse',quantity:1,kg:R.vest.kg,remaining:state.armor,maximum:R.vest.absorption});
  if(state.tools>0)items.push({id:'tools',name:'Outils consommables',slot:'outils',quantity:1,kg:R.tools.kg*state.tools/R.tools.budget,remaining:state.tools,maximum:R.tools.budget});
  if(state.reserve>0)items.push({id:'ammo',name:'Cartouchière',slot:'cartouchière',quantity:state.reserve,kg:R.ammo.pouchKg+state.reserve*R.ammo.kgPerUnit,remaining:state.reserve,maximum:R.ammo.capacity});
  return{items,weight:items.reduce((n,i)=>n+i.kg,0)};
 }
 function overview(){return{summary:message||'Au dépôt, préparez votre équipement. Sur la route, chaque réserve reste limitée.',rows:[{label:'Gilet',value:state.armor>0?Math.ceil(state.armor)+' dégâts encore absorbables · course +15 % d’effort':'Aucun'},{label:'Nettoyage · recharges aidées',value:state.care[g.player.weapon]+' rechargements aidés'},{label:'Cartouchière',value:state.reserve+' / '+R.ammo.capacity+' munitions'},{label:'Munitions accessibles',value:Math.floor(reloadAvailable())+(depot()?' · dépôt à portée':' · réserve et sac')},{label:'Outils',value:Math.ceil(state.tools)+' s de travail supplémentaire'},{label:'Préparation',value:task?Math.floor(task.elapsed/task.seconds*100)+' %':'Libre'}],task:task?{kind:task.kind,progress:task.elapsed/task.seconds}:null};}
 function actions(){
  const descriptions={vest:'Absorbe 30 % des blessures, dans la limite de 45 dégâts. La course coûte 15 % d’endurance en plus.',service:'Huit prochains rechargements de cette famille 15 % plus courts. Ne répare pas l’usure ; dégâts et munitions inchangés.',ammo:'Transfère jusqu’à 36 munitions du dépôt dans votre réserve personnelle. Recharger au loin consomme cette réserve puis le sac.',tools:'Pendant 60 secondes de construction manuelle, ajoute 50 % de travail. Ne modifie ni les coûts des chantiers ni les ouvriers.'};
  const list=['vest','service','ammo','tools'].map(kind=>{const q=preview(kind),cost=q.cost||(kind==='ammo'?{ammo:R.ammo.capacity}:R[kind].cost);return{id:kind,label:(kind==='service'?'Nettoyer le mécanisme':R[kind].name)+' · '+R[kind].seconds+' s',description:descriptions[kind],disabled:!q.ok,reason:q.reason||C.resourceText(cost)+' · prélevés après travail sur place',close:true,run:()=>begin(kind)};});
  if(task)list.unshift({id:'cancel',label:'Interrompre la préparation',run:()=>({ok:cancel()}),close:false});
  if(state.reserve>0)list.push({id:'storeAmmo',label:'Vider la cartouchière au dépôt',disabled:!depot()||!!task||manualPost(),reason:manualPost()?'Quittez le poste de tir avant de vider la cartouchière.':depot()?'Rend seulement les munitions restantes, dans la limite du stockage.':'Rejoignez un dépôt accessible.',run:storeAmmo});
  return list;
 }
 const api={begin,preview,cancel,step,busy:()=>!!task,reloadAvailable,spendReload,storeAmmo,absorbDamage,constructionFactor,equipment,overview,actions,snapshot:()=>validate(state)};
 g.playerOps131=Object.freeze(api);
 g.expansions.register({id:'player131',title:'Préparation du commandant',overview,actions,busy:()=>!!task,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);task=null;message='';},reset:()=>{state=initial();task=null;message='';}});
 wrap('startReload',(old,...args)=>{
  const before=g.player.reload,weapon=g.player.weapon;
  if(task)return false;
  const result=old(...args);
  if(before<=0&&g.player.reload>0&&state.care[weapon]>0){g.player.reload*=R.service.reloadFactor;g.player.reloadTotal*=R.service.reloadFactor;state.care[weapon]--;}
  return result;
 });
 wrap('updatePlayer',(old,dt)=>{
  const before=g.player.stamina,p=position(),burden=state.armor>0&&running()&&alive()&&!driving()&&g.input.keys.has('ShiftLeft');
  const result=old(dt),after=position();
  if(burden&&g.player.stamina<before&&after.domain===p.domain&&Math.hypot(after.x-p.x,after.y-p.y)>1e-7)g.player.stamina=Math.max(0,g.player.stamina-(before-g.player.stamina)*R.vest.sprintBurden);
  return result;
 });
 wrap('update',(old,dt)=>{
  const run=running();
  if(task&&(!alive()||g.gameOver||g.state!=='playing'))cancel();
  if(run&&task&&(!alive()||g.input.keys.size||g.input.pressed.size||g.input.mouseDown||g.input.touchFire))cancel();
  const result=old(dt);if(task&&(!alive()||g.gameOver||g.state!=='playing'))cancel();if(run)step(dt);return result;
 });
 wrap('returnToMenu',(old,...args)=>{cancel();return old(...args);});
 return api;
}
const api={install,initial,validate};root.DeadwallPlayerPack131=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.DEADWALL?.expansions&&root.document)install(root.DEADWALL);
})(globalThis);
