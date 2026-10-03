/* Physical armory: finite possessions, magazines, wear, depot work and defense posts. */
(function(root){'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Arsenal134Rules,D=R.catalog,copy=o=>JSON.parse(JSON.stringify(o));
const initial=()=>({version:1,initialized:false,next:1,equipped:null,carried:[],locker:[],fallen:[],posts:[]});
function validate(raw){
 if(raw===undefined)return initial();const bad=()=>{throw Error('Registre de l’armurerie invalide.');},obj=(v,k)=>{if(!v||Array.isArray(v)||typeof v!=='object'||Object.keys(v).length!==k.length||Object.keys(v).some(x=>!k.includes(x)))bad();},n=(v,min,max,int=false)=>{if(!Number.isFinite(v)||v<min||v>max||int&&!Number.isInteger(v))bad();return v;};
 obj(raw,['version','initialized','next','equipped','carried','locker','fallen','posts']);if(raw.version!==1||typeof raw.initialized!=='boolean')bad();n(raw.next,1,1e9,true);const ids=new Set();
 const item=v=>{obj(v,['uid','id','condition','rounds']);if(typeof v.id!=='string'||!Object.hasOwn(D,v.id))bad();n(v.uid,1,raw.next-1,true);if(ids.has(v.uid))bad();ids.add(v.uid);n(v.condition,0,100);n(v.rounds,0,D[v.id].magazine,true);return{...v};};
 const list=v=>{if(!Array.isArray(v)||v.length>R.maxItems)bad();return v.map(item);};
 const out={version:1,initialized:raw.initialized,next:raw.next,equipped:raw.equipped,carried:list(raw.carried),locker:list(raw.locker),fallen:[],posts:[]};
 if(out.carried.reduce((s,i)=>s+D[i.id].kg,0)>R.carryKg+1e-7)bad();
 if(raw.equipped!==null&&!out.carried.some(i=>i.uid===raw.equipped&&D[i.id].category!=='deployed'))bad();
 if(!Array.isArray(raw.fallen)||raw.fallen.length>C.SuccessionRules.maxRemains||!Array.isArray(raw.posts)||raw.posts.length>R.maxPosts)bad();const fallenIds=new Set();
 for(const f of raw.fallen){obj(f,['remains','items']);n(f.remains,1,C.SuccessionRules.maxRemains,true);if(fallenIds.has(f.remains))bad();fallenIds.add(f.remains);out.fallen.push({remains:f.remains,items:list(f.items)});}
 for(const p of raw.posts){obj(p,['item','x','y','angle','health','cooldown']);const i=item(p.item),d=D[i.id];if(d.category!=='deployed')bad();n(p.x,R.postRadius,C.WORLD_SIZE-R.postRadius);n(p.y,R.postRadius,C.WORLD_SIZE-R.postRadius);n(p.angle,-Math.PI*2,Math.PI*2);n(p.health,0,d.health);n(p.cooldown,0,120);out.posts.push({...p,item:i});}
 if(ids.size>R.maxItems||!raw.initialized&&(ids.size||raw.next!==1||raw.equipped!==null))bad();return out;
}
function install(g){
 if(g.arsenal134)return g.arsenal134;let state=initial(),task=null,message='';
 const wrap=(name,fn)=>{if(typeof g[name]!=='function')return;const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);};
 const alive=()=>g.state==='playing'&&!g.gameOver&&g.player&&!g.player.dead&&g.player.health>0;
 const running=()=>alive()&&!g.paused&&!g.activeOverlay;
 const driving=()=>g.expeditions?.driving()||g.frontier?.position().car?.driving;
 const manualPost=()=>Boolean(g.fieldcraft?.context?.()?.mounted);
 const weight=()=>state.carried.reduce((s,i)=>s+D[i.id].kg,0);
 const home=()=>alive()&&!driving()&&!g.frontier?.active()&&!!g.core()&&g.workerCanWorkAt(g.player,g.core(),R.homeReach);
 const clear=()=>!g.nearbyZombies(g.player.x,g.player.y,R.danger).some(z=>!z.dead&&z.health>0);
 const permitted=()=>alive()&&!driving()&&!manualPost()&&(!g.activeOverlay||g.activeOverlay===g.ui.commandModal||g.activeOverlay===g.arsenalUI134?.element||g.activeOverlay===g.loadoutUI?.overlay);
 function handReason(continuing=null){
  if(!permitted()||g.player.regionAbsent||task&&task!==continuing||g.expansions.busy('arsenal134')||g.player.reload>0)return 'Libérez vos mains et terminez l’action en cours.';
  const field=g.fieldcraft?.context?.(),day=g.dayworks?.workContext?.()||g.dayworks?.overview?.();
  if(g.selectedBuild||g.rallyPlacement||field?.moving||field?.quote||g.siege?.toolActive?.()||g.linecare?.toolActive?.()||g.infrastructure?.toolActive?.()||(day?.tool||'none')!=='none'||day?.placing||day?.preview)return 'Rangez les outils et quittez le placement avant le travail d’atelier.';
  return '';
 }
 function stationFor(d,continuing=null){
  if(!alive()||driving()||g.frontier?.active()||g.player.regionAbsent)return null;
  const candidates=continuing?.station?[continuing.station]:[...g.world.buildings.values()].filter(b=>b.type===d.requires);
  for(const b of candidates){
   if(g.world.buildings.get(b.id)!==b||b.type!==d.requires||b.dead||!(b.health>0)||!b.completed||!b.powered||b.siegeOffline||b.territoryOffline||b.gridOffline||b.dayOffline)continue;
   const nearest={x:Math.max(b.left,Math.min(b.right,g.player.x)),y:Math.max(b.top,Math.min(b.bottom,g.player.y))};
   if(Math.hypot(g.player.x-nearest.x,g.player.y-nearest.y)>R.homeReach)continue;
   const service=g.fieldcraft?.service?.(g.player,b);
   if(service&&g.workerCanWorkAt(g.player,b,R.homeReach)&&g.workerCanWorkAt(g.player,service,R.homeReach))return b;
  }
  return null;
 }
 const active=()=>state.carried.find(i=>i.uid===state.equipped)||null;
 const fail=reason=>{message=reason;return{ok:false,reason};};
 function sync(){const i=active();if(i&&D[i.id].category==='firearm')i.rounds=Math.max(0,Math.min(D[i.id].magazine,Math.floor(g.player.magazine[D[i.id].base]||0)));}
 function slots(){return [...new Set(state.carried.filter(i=>D[i.id].category==='firearm').map(i=>D[i.id].base))];}
 function apply(){const i=active();g.player.magazine=Object.fromEntries(R.legacy.map(k=>[k,0]));if(i){const d=D[i.id];g.player.weapon=d.base;if(d.category==='firearm')g.player.magazine[d.base]=i.rounds;}g.succession133?.setOwnedSlots134?.(slots());}
 function ensure(raw){if(state.initialized||g.state!=='playing')return;const owned=raw?.succession133?.current?.weapons||g.succession133?.ownedWeapons?.()||g.succession133?.view().current.weapons||R.legacy;state.initialized=true;for(const id of owned){if(!R.legacy.includes(id))continue;const i={uid:state.next++,id,condition:100,rounds:Math.min(D[id].magazine,g.player.magazine[id]||0)};state.carried.push(i);if(id===g.player.weapon)state.equipped=i.uid;}if(state.equipped===null&&state.carried.length)state.equipped=state.carried[0].uid;apply();}
 function save(){sync();g.save(false);g.arsenalUI134?.refresh?.();}
 function weaponSpec(){ensure();const i=active();if(!i)return null;const d=D[i.id];return{...C.WEAPONS[d.base],...d,range:d.range*32};}
 function quote(kind,id,continuing=null){
  ensure();const d=typeof id==='string'&&Object.hasOwn(D,id)?D[id]:null;
  if(!d||!['craft','repair'].includes(kind))return{ok:false,reason:'Équipement inconnu.'};
  const hands=handReason(continuing);if(hands)return{ok:false,reason:hands};
  const station=kind==='craft'&&d.requires?stationFor(d,continuing):null;
  if(kind==='craft'&&d.requires&&!station)return{ok:false,reason:'Rejoignez un '+C.BUILDINGS[d.requires].name.toLowerCase()+' achevé, alimenté et accessible à pied.'};
  if(!station&&!home())return{ok:false,reason:'Rejoignez le dépôt de D-17 par un accès libre.'};
  if(!clear())return{ok:false,reason:'Sécurisez les abords de l’atelier.'};
  if(g.tier.id<d.tier)return{ok:false,reason:'Palier '+d.tier+' requis.'};
  if(kind==='craft'&&(state.next>=1e9||state.carried.length+state.locker.length+state.fallen.reduce((s,f)=>s+f.items.length,0)+state.posts.length>=R.maxItems))return{ok:false,reason:'Capacité du registre atteinte.'};
  const cost=kind==='craft'?d.cost:{scrap:Math.max(1,Math.ceil((d.cost.scrap||d.cost.wood||4)*R.repairFraction))};
  if(!C.canAfford(g.resources,cost))return{ok:false,reason:'Matériaux insuffisants au dépôt.'};
  return{ok:true,cost:{...cost},seconds:kind==='craft'?R.craftSeconds+Math.ceil(d.kg):R.repairSeconds,station};
 }
 function preview(kind,id){const q=quote(kind,id);return q.station?{...q,station:{id:q.station.id,name:q.station.def.name}}:q;}
 function begin(kind,id,uid=null){const q=quote(kind,id);if(!q.ok)return fail(q.reason);if(kind==='repair'){const i=[...state.carried,...state.locker].find(i=>i.uid===uid&&i.id===id);if(!i||i.condition>=100)return fail('Sélectionnez un équipement usé.');}task={kind,id,uid,cost:q.cost,seconds:q.seconds,station:q.station,elapsed:0,x:g.player.x,y:g.player.y,health:g.player.health};message=(kind==='craft'?'Assemblage':'Réparation')+' en cours : restez '+(q.station?'auprès de cet atelier.':'au dépôt.');g.releaseInputs();return{ok:true};}
 function cancel(reason='Travail interrompu ; matériaux conservés.'){if(!task)return false;task=null;message=reason;return true;}
 function equip(uid){ensure();if(!permitted()||task||g.expansions.busy('arsenal134')||g.player.reload>0)return fail('Terminez l’action en cours.');const i=state.carried.find(i=>i.uid===uid);if(!i||D[i.id].category==='deployed')return fail('Équipement indisponible en main.');if(g.tier.id<D[i.id].tier)return fail('Palier requis non atteint.');sync();state.equipped=uid;apply();g.player.shootCooldown=Math.max(g.player.shootCooldown,.2);message=D[i.id].name+' en main.';save();return{ok:true};}
 function transfer(uid,to){if(!permitted()||!home()||task||g.expansions.busy('arsenal134')||g.player.reload>0)return fail('Rejoignez le dépôt avec les mains libres.');sync();const src=to==='carried'?state.locker:to==='locker'?state.carried:null,dst=to==='carried'?state.carried:state.locker;if(!src)return fail('Destination inconnue.');const i=src.find(i=>i.uid===uid);if(!i)return fail('Objet absent.');if(to==='carried'&&weight()+D[i.id].kg>R.carryKg)return fail('Harnais trop lourd : limite '+R.carryKg+' kg.');src.splice(src.indexOf(i),1);dst.push(i);if(state.equipped===uid)state.equipped=null;apply();message=to==='carried'?'Équipement pris au dépôt.':'Équipement rangé au dépôt.';save();return{ok:true};}
 function beforeShot(){ensure();const i=active();if(!i)return false;if(D[i.id].category!=='firearm'){melee();return false;}if(!running()||driving()||manualPost()||task||g.expansions.busy('arsenal134')||i.condition<=0){if(i.condition<=0)message='Arme hors service : réparation nécessaire au dépôt.';return false;}return true;}
 function afterShot(){const i=active();if(!i)return;const d=D[i.id];i.condition=Math.max(0,i.condition-d.wear);sync();if(i.condition===0)g.notify('Arme hors service. Réparez-la au dépôt.','danger');}
 function melee(){ensure();const i=active(),held=i&&D[i.id],contact=held&&held.category!=='firearm'&&held.category!=='deployed',region=g.frontier.active();
  if(!running()||driving()||manualPost()||task||g.expansions.busy('arsenal134')||g.player.meleeCooldown>0||g.player.reload>0)return true;
  // The historic local shove remains authoritative, after the shared hand locks.
  if(!contact&&!region)return false;
  const d=contact?held:{range:R.buttRange,arc:R.buttArc,fireRate:1/R.buttCooldown,damage:held?.category==='firearm'?C.SuccessionRules.armedMeleeDamage:C.SuccessionRules.unarmedDamage,targets:Infinity,stamina:0,wear:0};
  if(contact&&i.condition<=0){message='Équipement brisé : réparation nécessaire.';return true;}if(g.player.stamina<d.stamina){message='Reprenez votre souffle.';return true;}
  const p=region?g.frontier.position():g.player,scale=region?1:32,facing=region?p.a:p.facing,reach=d.range*scale;
  if(region)g.frontier.signalAt({...p,z:p.z},4);
  const all=region?[...g.frontier.contacts(),...(g.worldEvolution?.groupMembers()||[]),...(g.succession133?.contacts()||[])]:g.nearbyZombies(p.x,p.y,reach);
  const targets=all.filter(e=>{if(e.dead||(e.hp??e.health)<=0||region&&(e.z!==p.z||p.z!==0&&e.poi!==p.inside))return false;const a=Math.atan2(e.y-p.y,e.x-p.x),delta=Math.atan2(Math.sin(a-facing),Math.cos(a-facing));return Math.hypot(e.x-p.x,e.y-p.y)<=reach&&Math.abs(delta)<=d.arc&&(region?g.frontier.world().line(p,e,p.z,p.inside,null,.015):g.hostileLineClear(p,e));}).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,d.targets);
  g.player.stamina-=d.stamina;g.player.meleeCooldown=1/d.fireRate;g.player.shootCooldown=Math.max(g.player.shootCooldown,1/d.fireRate);if(contact)i.condition=Math.max(0,i.condition-d.wear);
  for(const e of targets){if(region){if(e.fallen)g.succession133.hit(e.x,e.y,d.damage,e.z,e.poi,e.id);else if(e.group)g.worldEvolution.hitContact(e.x,e.y,d.damage,e.id);else g.frontier.hitEnemy(e.id,d.damage);}else{e.health-=d.damage;e.stagger=R.meleeStagger;if(e.health<=0)g.killZombie(e,false);}}
  g.audio.tone(targets.length?85:155,.09,'square',.05,-35);g.camera.shake=Math.max(g.camera.shake,2);return true;
 }
 function takeForDeath(remains){ensure();sync();cancel('Décès : travail interrompu.');if(state.carried.length)state.fallen.push({remains,items:state.carried});state.carried=[];state.equipped=null;apply();}
 function recoverLegacy(r){let moved=0;sync();for(const id of [...r.weapons]){if(state.next>=1e9||state.carried.length+state.locker.length+state.fallen.reduce((n,f)=>n+f.items.length,0)+state.posts.length>=R.maxItems)break;if(weight()+D[id].kg>R.carryKg)continue;state.carried.push({uid:state.next++,id,condition:100,rounds:r.magazine[id]});r.magazine[id]=0;r.weapons.splice(r.weapons.indexOf(id),1);moved++;}for(const id of R.legacy)if(!r.weapons.includes(id)&&r.magazine[id]>0){r.bag.ammo+=r.magazine[id]*C.WEAPONS[id].ammoPerReload;r.magazine[id]=0;}if(moved){if(state.equipped===null)state.equipped=state.carried.find(i=>D[i.id].category!=='deployed')?.uid??null;apply();}return moved;}
 function recover(remains){const f=state.fallen.find(f=>f.remains===remains);if(!f)return 0;let moved=0;for(const i of [...f.items])if(weight()+D[i.id].kg<=R.carryKg){state.carried.push(i);f.items.splice(f.items.indexOf(i),1);moved++;}if(!f.items.length)state.fallen=state.fallen.filter(x=>x!==f);if(state.equipped===null){const i=state.carried.find(i=>D[i.id].category!=='deployed');if(i)state.equipped=i.uid;}apply();return moved;}
 function postNear(uid){return state.posts.find(p=>p.item.uid===uid&&!g.frontier.active()&&Math.hypot(p.x-g.player.x,p.y-g.player.y)<=R.postReach&&g.nightGear.localLineClear(g.player,p));}
 function deploy(uid){if(!running()||driving()||manualPost()||g.frontier.active()||task||g.expansions.busy('arsenal134')||g.player.reload>0||state.posts.length>=R.maxPosts)return fail('Déployez à pied à D-17, hors des menus et les mains libres.');const i=state.carried.find(i=>i.uid===uid),d=i&&D[i.id];if(!d||d.category!=='deployed'||i.condition<=0)return fail('Équipement déployable absent ou brisé.');const p={x:g.player.x+Math.cos(g.player.facing)*R.deployDistance,y:g.player.y+Math.sin(g.player.facing)*R.deployDistance};if(!g.friendlyPositionClear({radius:R.postRadius},p.x,p.y)||!g.nightGear.localLineClear(g.player,p)||state.posts.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<R.postRadius*3))return fail('Sol ou accès obstrué : choisissez un autre emplacement.');state.carried.splice(state.carried.indexOf(i),1);state.posts.push({item:i,...p,angle:g.player.facing,health:d.health*i.condition/100,cooldown:0});save();return{ok:true};}
 function servicePost(uid,kind){if(!permitted()||task||g.expansions.busy('arsenal134')||g.player.reload>0)return fail('Terminez l’action en cours.');const p=postNear(uid);if(!p)return fail('Rejoignez le poste par un accès libre.');const d=D[p.item.id];if(g.nearbyZombies(p.x,p.y,R.danger).some(z=>!z.dead&&z.health>0))return fail('Écartez les infectés avant la maintenance.');
  if(kind==='clear'){if(p.health>0)return fail('Le poste est encore utilisable.');state.posts.splice(state.posts.indexOf(p),1);save();return{ok:true};}if(p.health<=0)return fail('Poste détruit : déblayez cette épave.');
  if(kind==='pickup'){if(weight()+d.kg>R.carryKg)return fail('Harnais trop lourd.');p.item.condition=Math.min(p.item.condition,100*p.health/d.health);state.carried.push(p.item);state.posts.splice(state.posts.indexOf(p),1);}else if(kind==='ammo'){const n=Math.min(d.magazine-p.item.rounds,Math.floor(g.player.carry.ammo/d.ammoPerReload));if(!d.ammoPerReload||n<=0)return fail('Emportez des munitions dans le sac ; chargeur plein ou vide de réserve.');g.player.carry.ammo-=n*d.ammoPerReload;p.item.rounds+=n;}else if(kind==='repair'){const cost=Math.max(1,Math.ceil((d.health-p.health)/30+(100-p.item.condition)/15));if(p.health>=d.health&&p.item.condition>=100)return fail('Poste intact.');if(g.player.carry.scrap<cost)return fail(cost+' ferrailles transportées requises.');g.player.carry.scrap-=cost;p.health=d.health;p.item.condition=100;}else return fail('Opération inconnue.');save();return{ok:true};
 }
 function toolFactor(kind){const i=active();if(!i||i.condition<=0)return 1;const d=D[i.id],special=d.workBonuses&&Object.hasOwn(d.workBonuses,kind)?d.workBonuses[kind]:null,bonus=R.toolBonuses[kind];return special??(bonus&&i.id===bonus.id?bonus.factor:1);}
 function wearTool(kind,seconds){const i=active();if(!alive()||!i||toolFactor(kind)===1||!Number.isFinite(seconds)||seconds<=0)return false;i.condition=Math.max(0,i.condition-(D[i.id].workWear??R.toolWear)*Math.min(seconds,120));return true;}
 function postsStep(dt){for(const p of state.posts){if(p.health<=0)continue;const d=D[p.item.id];p.cooldown=Math.max(0,p.cooldown-dt);const near=g.nearbyZombies(p.x,p.y,Math.max(d.range*32,45)).filter(z=>!z.dead&&z.health>0);for(const z of near)if(Math.hypot(z.x-p.x,z.y-p.y)<R.postRadius+z.radius+8&&g.hostileLineClear(z,p))p.health=Math.max(0,p.health-(z.def?.damage||8)*dt*.5);if(!p.health||p.item.condition<=0||p.cooldown>0||d.ammoPerReload&&p.item.rounds<=0)continue;const target=near.filter(z=>Math.hypot(z.x-p.x,z.y-p.y)<=d.range*32&&g.hostileLineClear(p,z)&&(!d.ammoPerReload||(g.nightwatch?.visible(z)??true))).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!target)continue;if(d.ammoPerReload)p.item.rounds--;p.item.condition=Math.max(0,p.item.condition-d.wear);p.cooldown=1/d.fireRate;target.health-=d.ammoPerReload?(g.zombieBulletDamage?.(target,d.damage,p)??d.damage):d.damage;target.stagger=.12;if(target.health<=0)g.killZombie(target,false);p.angle=Math.atan2(target.y-p.y,target.x-p.x);}}
 function step(dt){
  if(!Number.isFinite(dt)||dt<=0||g.state!=='playing'||g.paused||g.activeOverlay||g.gameOver)return;
  ensure();dt=Math.min(dt,R.maxStep);postsStep(dt);if(!task)return;
  const t=task,q=quote(t.kind,t.id,t);
  if(!q.ok||g.player.health<t.health||Math.hypot(g.player.x-t.x,g.player.y-t.y)>3||g.input.mouseDown||g.input.touchFire||g.input.keys.size){cancel(q.reason||undefined);return;}
  t.elapsed+=dt;g.interactionText=(t.kind==='craft'?'Assemblage':'Réparation')+' · '+Math.floor(t.elapsed/t.seconds*100)+' %';
  if(t.elapsed+1e-8<t.seconds)return;
  if(t.kind==='repair'){
   const i=[...state.carried,...state.locker].find(i=>i.uid===t.uid&&i.id===t.id);
   if(!i||i.condition>=100){cancel('Équipement absent ou déjà réparé ; matériaux conservés.');return;}
   if(!C.spend(g.resources,t.cost)){cancel();return;}i.condition=100;message=D[t.id].name+' réparé.';
  }else{
   if(!C.spend(g.resources,t.cost)){cancel();return;}
   state.locker.push({uid:state.next++,id:t.id,condition:100,rounds:0});message=D[t.id].name+' prêt dans le râtelier.';
  }
  task=null;g.notify(message,'good');g.audio.ui?.();save();
 }
 function taskView(){if(!task)return null;const {station,...value}=task;return{...copy(value),stationId:station?.id??null,progress:task.elapsed/task.seconds};}
 function view(){ensure();sync();return{...copy(state),weight:weight(),capacity:R.carryKg,atHome:home(),message,task:taskView(),catalog:Object.values(D).map(d=>({...d,craft:preview('craft',d.id)})),posts:state.posts.map(p=>({...copy(p),near:!!postNear(p.item.uid)}))};}
 function overview(){const v=view();return{summary:message||'Préparez votre armement au dépôt. Chaque arme a son chargeur, son état et son poids.',rows:[{label:'En main',value:active()?D[active().id].name:'Mains libres'},{label:'Harnais',value:v.weight.toFixed(1)+' / '+R.carryKg+' kg'},{label:'Râtelier',value:state.locker.length+' équipements'},{label:'Défenses posées',value:state.posts.filter(p=>p.health>0).length+' / '+R.maxPosts}],task:v.task};}
 function actions(){return[{id:'open',label:'Ouvrir l’armurerie',description:'Comparer, assembler, réparer et équiper les armes et postes défensifs.',close:false,run:()=>{g.arsenalUI134?.open();return{ok:true};}}];}
 function drawPost(ctx,p){
  const d=D[p.item.id],visual={tripod:['art136Tripod',50],heavyNest:['art136HeavyNest',56],boltNest:['art136BoltNest',52],spikeFrame:['art136SpikeFrame',48]}[p.item.id];
  ctx.save();ctx.translate(p.x,p.y);
  const painted=p.health>0&&visual&&root.DeadwallAssets136?.drawSprite(ctx,g.art,visual[0],0,0,visual[1],visual[1],{angle:p.angle});
  if(!painted){
   ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,5,25,11,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p.health>0?'#706c54':'#463f36';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-19,12);ctx.lineTo(0,-8);ctx.lineTo(19,12);ctx.moveTo(0,-8);ctx.lineTo(0,19);ctx.stroke();
   if(p.health>0){ctx.save();ctx.rotate(p.angle);ctx.fillStyle='#434b48';ctx.fillRect(-10,-9,25,18);ctx.fillStyle='#a39670';ctx.fillRect(8,-3,d.id==='spikeFrame'?17:32,6);if(d.id==='spikeFrame'){ctx.strokeStyle='#a39670';ctx.lineWidth=3;for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(0,j*9);ctx.lineTo(26,j*9);ctx.stroke();}}ctx.restore();}
  }
  if(p.health>0){ctx.fillStyle='#20241e';ctx.fillRect(-20,25,40,3);ctx.fillStyle=p.item.condition>0?'#a2b281':'#b56643';ctx.fillRect(-20,25,40*p.health/d.health,3);}
  ctx.restore();
 }
 const api={visualEquipment:()=>{const i=active(),d=i&&D[i.id];return d?{id:i.id,category:d.category,condition:i.condition,fireRate:d.fireRate}:null;},view,overview,actions,preview,begin,cancel,step,equip,transfer,weaponSpec,beforeShot,afterShot,melee,deploy,servicePost,takeForDeath,recover,recoverLegacy,toolFactor,wearTool,fallenCount:id=>state.fallen.find(f=>f.remains===id)?.items.length||0,ownsSlot:id=>slots().includes(id),busy:()=>!!task,snapshot:()=>{ensure();sync();return validate(state);}};g.arsenal134=Object.freeze(api);
 const S=root.DeadwallSave;if(!S.__arsenal134){const previous=S.validate.bind(S);S.validate=raw=>{const data=previous(raw),a=data.expansions127?.modules?.arsenal134;if(a?.initialized){const remainIds=new Set(data.succession133?.remains.map(r=>r.id)||[]);if(a.fallen.some(f=>!remainIds.has(f.remains)))throw Error('Sac d’armes sans dépouille correspondante.');const held=a.carried.find(i=>i.uid===a.equipped),d=held&&D[held.id],slots=[...new Set(a.carried.filter(i=>D[i.id].category==='firearm').map(i=>D[i.id].base))];if(R.legacy.some(k=>(data.player.magazine[k]||0)!==(d?.category==='firearm'&&d.base===k?held.rounds:0))||d&&data.player.weapon!==d.base)throw Error('Chargeur actif et armurerie incohérents.');if(data.succession133&&(slots.length!==data.succession133.current.weapons.length||slots.some(k=>!data.succession133.current.weapons.includes(k))))throw Error('Armes portées et relève incohérentes.');if(data.player.dead&&a.carried.length)throw Error('Le matériel du défunt doit rester sur place.');}return data;};S.__arsenal134=true;}
 g.expansions.register({id:'arsenal134',title:'Armurerie & défenses',overview,actions,busy:api.busy,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);task=null;message='';},reset:()=>{state=initial();task=null;message='';}});
 wrap('startNew',(old,...a)=>{const world=g.world,result=old(...a);if(g.world!==world)ensure();return result;});
 wrap('restoreSave',(old,raw)=>{const result=old(raw);if(result!==false){ensure(raw);apply();}return result;});
 wrap('update',(old,dt)=>{if(task&&(!alive()||g.gameOver))cancel();const run=g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver,result=old(dt);if(run)step(dt);return result;});
 wrap('switchWeapon',(old,id)=>{ensure();const i=state.carried.find(i=>i.id===id&&D[i.id].category==='firearm')||state.carried.find(i=>D[i.id].base===id&&D[i.id].category==='firearm');return i?equip(i.uid):fail('Aucune arme de cette famille dans le harnais.');});
 wrap('shootPlayer',(old,...a)=>{if(active()&&D[active().id].category!=='firearm'){melee();return;}return old(...a);});
 wrap('startReload',(old,...a)=>{const i=active();if(!running()||driving()||!i||D[i.id].category!=='firearm'||i.condition<=0||task||g.expansions.busy('arsenal134'))return false;return old(...a);});
 wrap('finishReload',(old,...a)=>{const result=old(...a);sync();return result;});
 wrap('updateUI',(old,...a)=>{const result=old(...a),i=active();if(g.state==='playing'&&i){const d=D[i.id];g.ui.weaponName.textContent=d.name+' · '+Math.ceil(i.condition)+' %';g.ui.weaponAmmo.textContent=d.category==='firearm'?g.player.magazine[d.base]+' / '+Math.floor(g.playerOps131.reloadAvailable()):'Espace / clic · '+d.stamina+' endurance';}else if(g.state==='playing'){g.ui.weaponName.textContent='Mains libres';g.ui.weaponAmmo.textContent='Espace · frapper';}return result;});
 wrap('returnToMenu',(old,...a)=>{cancel();g.arsenalUI134?.close?.();return old(...a);});
 wrap('depthEntries',(old,v)=>{const entries=old(v);if(g.frontier.active()&&!v?.homeProjection)return entries;for(const p of state.posts)if(!v||g.visible(p.x,p.y,45,v))entries.push({kind:1,id:-134000-p.item.uid,depth:p.y+15,order:entries.length,entity:{__arsenalDraw:ctx=>drawPost(ctx,p)}});entries.sort((a,b)=>a.depth-b.depth||a.kind-b.kind||a.id-b.id||a.order-b.order);return entries;});
 wrap('drawBuilding',(old,ctx,b,...a)=>b.__arsenalDraw?b.__arsenalDraw(ctx):old(ctx,b,...a));
 ensure();return api;
}
const api={initial,validate,install};root.DeadwallArsenal134=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.DEADWALL?.succession133&&root.document)install(root.DEADWALL);
})(globalThis);
