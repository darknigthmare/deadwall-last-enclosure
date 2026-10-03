/* Persistent fallen survivors. The depot, roads and inventories keep their original owners. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.SuccessionRules;
const copy=o=>JSON.parse(JSON.stringify(o)),weapons=Object.keys(C.WEAPONS),kitKeys=['light','aid','brace','decoy'];
const geometryCache=new Map();
function saveWorld(full){const key=full.worldSeed+':'+full.frontier.generation;if(!geometryCache.has(key)){geometryCache.set(key,root.DeadwallFrontierWorld.create(full.worldSeed,full.frontier.generation));if(geometryCache.size>2)geometryCache.delete(geometryCache.keys().next().value);}return geometryCache.get(key);}
const emptyKits=()=>Object.fromEntries(kitKeys.map(k=>[k,0]));
const initial=()=>({version:1,serial:1,current:{number:1,profile:'commander',weapons:[...weapons]},pending:false,remains:[]});
function validate(raw,full){
 if(raw===undefined)return initial();
 const bad=()=>{throw Error('Registre des survivants tombés invalide.');};
 const obj=(o,keys)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==keys.length||Object.keys(o).some(k=>!keys.includes(k)))bad();};
 const n=(v,min,max,int=false)=>{if(!Number.isFinite(v)||v<min||v>max||int&&!Number.isInteger(v))bad();return v;};
 const owned=a=>{if(!Array.isArray(a)||a.length>weapons.length||new Set(a).size!==a.length||a.some(k=>!weapons.includes(k)))bad();return[...a];};
 const bag=b=>{obj(b,C.RESOURCE_KEYS);return Object.fromEntries(C.RESOURCE_KEYS.map(k=>[k,n(b[k],0,1e12)]));};
 obj(raw,['version','serial','current','pending','remains']);if(raw.version!==1||typeof raw.pending!=='boolean'||!Array.isArray(raw.remains)||raw.remains.length>R.maxRemains)bad();
 obj(raw.current,['number','profile','weapons']);if(!Object.hasOwn(R.profiles,raw.current.profile))bad();
 const out={version:1,serial:n(raw.serial,1,R.maxRemains+1,true),current:{number:n(raw.current.number,1,R.maxRemains+1,true),profile:raw.current.profile,weapons:owned(raw.current.weapons)},pending:raw.pending,remains:[]},ids=new Set(),zids=new Set();
 const regionSize=root.DeadwallFrontierWorld?.sizeForGeneration(full?.frontier?.generation??5)||24576;
 for(const r of raw.remains){
  obj(r,['id','profile','point','bag','magazine','weapons','gear','kits','body','time']);if(ids.has(r.id)||!Object.hasOwn(R.profiles,r.profile))bad();ids.add(r.id);n(r.id,1,out.serial-1,true);
  obj(r.point,['domain','x','y','z','inside','angle']);const p=r.point;if(!['local','region'].includes(p.domain)||p.inside!==null&&!/^P\d{4}$/.test(p.inside)||p.domain==='local'&&(p.z!==0||p.inside!==null)||p.z!==0&&p.inside===null)bad();
  n(p.x,0,p.domain==='local'?C.WORLD_SIZE:regionSize);n(p.y,0,p.domain==='local'?C.WORLD_SIZE:regionSize);n(p.z,-1,2,true);n(p.angle,-Math.PI*2,Math.PI*2);
  obj(r.magazine,weapons);const magazine=Object.fromEntries(weapons.map(k=>[k,n(r.magazine[k],0,C.WEAPONS[k].magazine,true)]));
  obj(r.kits,kitKeys);const kits=Object.fromEntries(kitKeys.map(k=>[k,n(r.kits[k],0,C.Essentials.RULES.beltMax,true)]));if(Object.values(kits).reduce((a,b)=>a+b,0)>C.Essentials.RULES.beltMax)bad();
  const gear=root.DeadwallPlayerPack131.validate(r.gear);obj(r.body,['phase','left','roll','x','y','health','zombieId']);const b=r.body;
  if(!['waiting','rest','risen','neutralized'].includes(b.phase))bad();n(b.left,0,R.reanimationMax);n(b.roll,0,0xffffffff,true);n(b.x,0,p.domain==='local'?C.WORLD_SIZE:regionSize);n(b.y,0,p.domain==='local'?C.WORLD_SIZE:regionSize);n(b.health,0,R.health);if(b.zombieId!==null)n(b.zombieId,1,0x7ffffffe,true);
  if(b.phase==='waiting'&&b.roll/4294967296>=R.reanimationChance||b.phase==='rest'&&b.roll/4294967296<R.reanimationChance||b.phase==='risen'&&b.health<=0||b.phase!=='risen'&&b.zombieId!==null||p.domain==='region'&&b.zombieId!==null)bad();
  if(p.domain==='local'&&b.phase==='risen'){if(b.zombieId===null||zids.has(b.zombieId))bad();zids.add(b.zombieId);if(full&&!full.zombies?.some(z=>z.id===b.zombieId&&z.kind==='walker'&&Math.abs(z.x-b.x)<.001&&Math.abs(z.y-b.y)<.001&&Math.abs(z.health-b.health)<.001))bad();}
  if(full&&p.domain==='region'&&(p.inside!==null||p.z!==0)){
   const w=saveWorld(full),poi=w.pois.find(q=>q.id===p.inside);if(!poi||!poi.levels.includes(p.z))bad();
   const q=root.DeadwallFrontierGeometry.local(poi,p.x,p.y);if(q.x<0||q.y<0||q.x>poi.w||q.y>poi.h)bad();if(p.z!==0){const body=root.DeadwallFrontierGeometry.local(poi,b.x,b.y);if(body.x<0||body.y<0||body.x>poi.w||body.y>poi.h)bad();}
  }
  out.remains.push({id:r.id,profile:r.profile,point:{...p},bag:bag(r.bag),magazine,weapons:owned(r.weapons),gear,kits,body:{...b},time:n(r.time,0,1e12)});
 }
 if(out.serial!==out.remains.length+1||out.current.number!==out.serial||out.remains.some((r,i)=>r.id!==i+1))bad();
 if(out.pending&&(!out.remains.length||out.current.weapons.length))bad();
 if(full){
  if(out.pending!==!!full.player.dead&&!(raw.remains.length===0&&full.player.dead))bad();
  if(out.pending&&(C.bagTotal(full.player.carry)>1e-7||weapons.some(k=>full.player.magazine[k]>0)))bad();
  if(full.player.health>R.profiles[out.current.profile].health||weapons.some(k=>!out.current.weapons.includes(k)&&full.player.magazine[k]>0))bad();
  if(out.remains.length===R.maxRemains&&!out.pending)bad();
 }
 return out;
}
function install(g){
 if(g.succession133)return g.succession133;
 let state=initial(),captured=null,message='',processing=false,lastWorld=g.world;
 const wrap=(name,fn)=>{if(typeof g[name]!=='function')return;const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);};
 const profile=()=>R.profiles[state.current.profile];
 const running=()=>g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver&&!g.player.dead;
 const position=()=>{const f=g.frontier.position();return f.active?{domain:'region',x:f.x,y:f.y,z:f.z,inside:f.inside,angle:f.a||0}:{domain:'local',x:g.player.x,y:g.player.y,z:0,inside:null,angle:g.player.facing||0};};
 const same=(a,b)=>a.domain===b.domain&&a.z===b.z&&(a.z===0||a.inside===b.inside);
 const driving=()=>g.expeditions.driving()||!!g.frontier.position().car?.driving;
 const home=()=>!g.frontier.active()&&!driving()&&!!g.core()&&g.workerCanWorkAt(g.player,g.core(),100);
 const fail=text=>{message=text;return false;};
 const refresh=()=>g.successionUI133?.refresh?.();
 const gearModule=()=>g.expansions.get('player131');
 function syncBodies(){for(const r of state.remains)if(r.point.domain==='local'&&r.body.phase==='risen'){
  const z=g.zombies.find(z=>z.id===r.body.zombieId);if(z&&!z.dead&&z.health>0){r.body.x=z.x;r.body.y=z.y;r.body.health=Math.min(R.health,z.health);}else{if(z){r.body.x=z.x;r.body.y=z.y;}r.body.phase='neutralized';r.body.health=0;r.body.zombieId=null;}
 }}
 function cleanup(point){
  g.releaseInputs();g.cancelPlacement();g.fieldcraft?.cancel?.();g.fieldSupplies?.cancel?.();g.nightGear?.dropOnDeath?.(point);g.essentials?.dropOnDeath?.(point);
  for(const id of ['playerOps131','travel131','worldOps131','chronicles131','survivalPack','explorationPack','campaignPack','defensePack','companionsPack','interventions134','barricades134'])g[id]?.cancel?.();
  const explore=g.explorationPack?.snapshot();if(explore){for(const c of explore.cargo)if(c.stage==='held'){c.stage='ground';c.x=g.player.x;c.y=g.player.y;}g.expansions.get('exploration').restore(explore);}
  const campaign=g.campaignPack?.snapshot();if(campaign?.active){campaign.history.push({kind:campaign.active.kind,wave:campaign.active.wave,result:'lost'});campaign.history=campaign.history.slice(-C.CampaignPackRules.history);campaign.active=null;g.expansions.get('campaign').restore(campaign);}
  const survival=g.survivalPack?.snapshot();if(survival){survival.meal={left:0,budget:0};survival.dressing={left:0,remaining:0};g.expansions.get('survival').restore(survival);}
  g.fieldOperations?.playerDown?.();g.siege?.playerDown?.();
 }
 function captureDeathPoint(point){captured={domain:point.domain,x:point.x,y:point.y,z:point.z,inside:point.inside??null,angle:point.angle||0};}
 function die(){
  if(processing||state.pending||!g.player.dead&&g.player.health>0||g.state!=='playing')return false;
  processing=true;try{
   const point=captured||position();captured=null;const p=g.player;p.dead=true;p.health=0;p.reload=0;p.reloadTotal=0;p.downTimer=0;p.vx=p.vy=0;
   cleanup(point);
   const id=state.serial;g.arsenal134?.takeForDeath(id);const roll=root.DeadwallFrontierGeometry.hash(g.world.seed,id,'fallen-survivor'),gear=g.playerOps131.snapshot(),kits=g.essentials.takeBeltForDeath?.()||emptyKits();
   const r={id,profile:state.current.profile,point,bag:{...p.carry},magazine:{...p.magazine},weapons:[...state.current.weapons],gear,kits,body:{phase:roll/4294967296<R.reanimationChance?'waiting':'rest',left:R.reanimationMin+(root.DeadwallFrontierGeometry.hash(g.world.seed,id,'turn-delay')/4294967296)*(R.reanimationMax-R.reanimationMin),roll,x:point.x,y:point.y,health:R.health,zombieId:null},time:g.elapsed};
   state.remains.push(r);state.serial++;state.current={number:state.serial,profile:state.current.profile,weapons:[]};state.pending=true;
   p.carry=C.makeBag();p.magazine=Object.fromEntries(weapons.map(k=>[k,0]));gearModule().reset();
   g.paused=true;message='Le survivant est mort. Son sac et sa dépouille restent sur place. La relève attend au dépôt.';g.notify(message,'danger');refresh();g.save(false);return true;
  }finally{processing=false;}
 }
 function applyProfile(){g.player.maxHealth=profile().health;g.player.carryCapacity=profile().capacity;g.player.health=Math.min(g.player.health,g.player.maxHealth);}
 function choices(){return Object.entries(R.profiles).filter(([id])=>id!=='commander').map(([id,p])=>({id,...copy(p)}));}
 function select(id){
  if(!state.pending||!Object.hasOwn(R.profiles,id)||id==='commander'||g.gameOver||!g.core()||g.core().dead||g.core().health<=0)return fail('Le dépôt doit encore tenir pour organiser une relève.');
  if(state.remains.length>=R.maxRemains)return fail('Registre de campagne complet : les dépouilles et sacs sont conservés. Exportez cette campagne avant un nouveau départ.');
  const p=g.player,core=g.core(),arrival=g.coreArrivalPosition({radius:13},{x:core.x+100,y:core.y});if(!arrival||!g.friendlyPositionClear({radius:13},arrival.x,arrival.y))return fail('L’accès au dépôt est obstrué. Aucune relève ne peut rejoindre ce point.');
  state.current.profile=id;state.current.weapons=[];state.pending=false;Object.assign(p,{x:arrival.x,y:arrival.y,radius:13,dead:false,health:R.profiles[id].health,maxHealth:R.profiles[id].health,carryCapacity:R.profiles[id].capacity,stamina:100,maxStamina:100,downTimer:0,invulnerable:R.protection,reload:0,reloadTotal:0,shootCooldown:0,meleeCooldown:0,interactionProgress:0,regionAbsent:false,vx:0,vy:0,weapon:'pistol',carry:C.makeBag(),magazine:Object.fromEntries(weapons.map(k=>[k,0]))});
  g.worldEvolution?.setPosture('stand');g.releaseInputs();g.camera.x=p.x;g.camera.y=p.y;g.paused=!!root.document?.hidden;message=R.profiles[id].name+' : rejoignez le sac perdu ou prenez une arme vide au dépôt.';g.notify(message);refresh();g.save(false);return true;
 }
 function ownsWeapon(id){return state.current.weapons.includes(id);}
 function meleeDamage(){return(g.arsenal134?g.arsenal134.visualEquipment()?.category==='firearm':ownsWeapon(g.player.weapon))?R.armedMeleeDamage:R.unarmedDamage;}
 function requisitions(){
  const arsenal=g.arsenal134,record=arsenal?.snapshot(),catalog=C.Arsenal134Rules?.catalog;
  return weapons.filter(k=>!ownsWeapon(k)).map(id=>{
   if(!arsenal)return{id,name:C.WEAPONS[id].name,cost:R.requisition[id],allowed:!state.pending&&home()&&g.tier.id>=C.WEAPONS[id].tier&&g.resources.scrap>=R.requisition[id],reason:!home()?'Rejoignez le dépôt.':g.tier.id<C.WEAPONS[id].tier?'Palier requis non atteint.':g.resources.scrap<R.requisition[id]?'Ferraille insuffisante : '+R.requisition[id]+' requises.':'Arme vide : '+R.requisition[id]+' ferrailles, munitions prélevées séparément.'};
   const item=record.locker.find(i=>i.id===id&&i.condition>0)||record.locker.find(i=>catalog[i.id].category==='firearm'&&catalog[i.id].base===id&&i.condition>0);
   if(item){
    const d=catalog[item.id],mass=record.carried.reduce((n,i)=>n+catalog[i.id].kg,0),ready=running()&&home()&&!arsenal.busy()&&!g.expansions.busy('arsenal134')&&g.player.reload<=0,weightOK=mass+d.kg<=C.Arsenal134Rules.carryKg,tierOK=g.tier.id>=d.tier;
    return{id,name:d.name,action:'take',uid:item.uid,cost:{},rounds:item.rounds,allowed:ready&&weightOK&&tierOK,reason:!ready?'Rejoignez le dépôt avec les mains libres.':!tierOK?'Palier requis non atteint.':!weightOK?'Harnais trop lourd : rangez un équipement.':'Équipement déjà au râtelier : prenez-le sans le fabriquer à nouveau.'};
   }
   const d=catalog[id],q=arsenal.preview('craft',id);
   return{id,name:d.name,action:'craft',cost:{...d.cost},seconds:q.seconds??C.Arsenal134Rules.craftSeconds+Math.ceil(d.kg),allowed:!state.pending&&q.ok,reason:q.ok?'Assemblage au dépôt, puis retrait au râtelier. Aucune munition offerte.':q.reason};
  });
 }
 function requisition(id){
  if(g.arsenal134){
   const row=requisitions().find(r=>r.id===id);if(!row?.allowed)return fail(row?.reason||'Arme indisponible.');
   const result=row.action==='take'?g.arsenal134.transfer(row.uid,'carried'):g.arsenal134.begin('craft',id);
   if(!result.ok)return fail(result.reason);
   if(row.action==='take'){const equipped=g.arsenal134.equip(row.uid);message=equipped.ok?'Arme du râtelier prise en main. Les cartouches présentes sont conservées.':'Arme prise dans le harnais. '+equipped.reason;}
   else message='Assemblage en cours : restez au dépôt, puis prenez l’arme au râtelier.';
   refresh();return true;
  }
  if(!running()||driving()||!requisitions().find(q=>q.id===id)?.allowed)return fail('Arme indisponible : rejoignez le dépôt, vérifiez son palier et les pièces nécessaires.');
  g.resources.scrap-=R.requisition[id];state.current.weapons.push(id);g.player.weapon=id;message='Arme vide prise au dépôt. Rechargez avec les munitions disponibles.';g.save(false);refresh();return true;
 }
 function accessible(r){const p=position(),s=p.domain==='local'?32:1;return same(p,r.point)&&Math.hypot(p.x-r.point.x,p.y-r.point.y)<=R.reach*s&&(p.domain==='local'?g.nightGear.localLineClear(p,r.point):g.frontier.world().line(p,r.point,p.z,p.inside,null,.05));}
 function dangerous(r){const p=position(),s=p.domain==='local'?32:1;if(p.domain==='local')return g.nearbyZombies(p.x,p.y,R.danger*s).some(z=>!z.dead&&z.health>0&&g.hostileLineClear(p,z));return [...g.frontier.contacts(),...g.worldEvolution.groupMembers(),...contacts()].some(z=>z.hp>0&&z.z===p.z&&(p.z===0||z.poi===p.inside)&&Math.hypot(z.x-p.x,z.y-p.y)<R.danger&&g.frontier.world().line(p,z,p.z,p.inside,null,.05));}
 function amount(r){return (g.arsenal134?.fallenCount(r.id)||0)+C.bagTotal(r.bag)+Object.values(r.magazine).reduce((a,b)=>a+b,0)+r.weapons.length+r.gear.armor+r.gear.reserve+r.gear.tools+Object.values(r.gear.care).reduce((a,b)=>a+b,0)+Object.values(r.kits).reduce((a,b)=>a+b,0);}
 function nearestRemains(){const found=state.remains.filter(r=>accessible(r)&&amount(r)>1e-7).sort((a,b)=>Math.hypot(a.point.x-position().x,a.point.y-position().y)-Math.hypot(b.point.x-position().x,b.point.y-position().y))[0];return found?copy(found):null;}
 function loot(id){
  const r=state.remains.find(r=>r.id===id);if(!r||!running()||driving()||g.expansions.busy()||g.player.reload>0||!accessible(r))return fail('Rejoignez le sac à pied, au même étage, par un accès libre.');if(dangerous(r))return fail('Écartez les infectés avant de reprendre le sac.');
  let moved=g.arsenal134?.recoverLegacy(r)||0,room=Math.max(0,g.player.carryCapacity-C.bagTotal(g.player.carry));
  for(const k of C.RESOURCE_KEYS){const mass=root.DeadwallLoadout129?.mass(g.player.carry)||0,weightRoom=(g.player.carryCapacity*C.LoadoutRules.massPerCapacity-mass)/C.LoadoutRules.resources[k].kg;let n=Math.max(0,Math.min(room,r.bag[k],weightRoom));if(n&&root.DeadwallLoadout129?.pack({...g.player.carry,[k]:g.player.carry[k]+n},g.player.carryCapacity).overflow.length)n=0;g.player.carry[k]+=n;r.bag[k]-=n;room-=n;moved+=n;}
  const takenWeapons=new Set();if(!g.arsenal134)for(const id of r.weapons)if(!ownsWeapon(id)){state.current.weapons.push(id);takenWeapons.add(id);moved++;}r.weapons=r.weapons.filter(id=>!takenWeapons.has(id));
  if(!g.arsenal134)for(const k of weapons){if(!ownsWeapon(k))continue;const n=Math.min(C.WEAPONS[k].magazine-g.player.magazine[k],r.magazine[k]);g.player.magazine[k]+=n;r.magazine[k]-=n;moved+=n;}
  const gear=g.playerOps131.snapshot(),limits={armor:C.Player131Rules.vest.absorption,reserve:C.Player131Rules.ammo.capacity,tools:C.Player131Rules.tools.budget};
  for(const k of Object.keys(limits)){const n=Math.min(limits[k]-gear[k],r.gear[k]);gear[k]+=n;r.gear[k]-=n;moved+=n;}
  for(const k of weapons){const n=Math.min(C.Player131Rules.service.reloads-gear.care[k],r.gear.care[k]);gear.care[k]+=n;r.gear.care[k]-=n;moved+=n;}gearModule().restore(gear);
  moved+=g.arsenal134?.recover(r.id)||0;
  const recovered=g.essentials.recoverBelt?.(r.kits)||emptyKits();for(const k of kitKeys){r.kits[k]-=recovered[k];moved+=recovered[k];}
  if(!moved)return fail('Sac personnel plein ou équipement déjà complet. Le reliquat reste au sol.');message=amount(r)>1e-7?'Matériel repris. Le reliquat reste dans le sac au sol.':'Sac vidé. La dépouille reste sur place.';g.notify(message,'good');g.save(false);refresh();return true;
 }
 function regionalMelee(){if(!running()||!g.frontier.active()||driving()||g.player.meleeCooldown>0)return false;const p=position();let struck=false;for(const e of contacts()){const angle=Math.atan2(e.y-p.y,e.x-p.x),delta=Math.atan2(Math.sin(angle-p.angle),Math.cos(angle-p.angle));if(e.z===p.z&&(p.z===0||e.poi===p.inside)&&Math.hypot(e.x-p.x,e.y-p.y)<1.72&&Math.abs(delta)<1.15&&g.frontier.world().line(p,e,p.z,p.inside,null,.015))struck=hit(e.x,e.y,meleeDamage(),e.z,e.poi,e.id)||struck;}g.player.meleeCooldown=.65;return struck;}
 function contacts(){return state.remains.filter(r=>r.point.domain==='region'&&r.body.phase==='risen').map(r=>({id:'fallen:'+r.id,fallen:r.id,poi:r.point.inside,z:r.point.z,x:r.body.x,y:r.body.y,hp:r.body.health,a:0}));}
 function hit(x,y,damage,z,inside,contactId=null){if(!Number.isFinite(damage)||damage<=0||contactId!==null&&typeof contactId!=='string')return false;const r=state.remains.find(r=>(contactId===null||'fallen:'+r.id===contactId)&&r.point.domain==='region'&&r.body.phase==='risen'&&r.point.z===z&&(z===0||r.point.inside===inside)&&Math.hypot(r.body.x-x,r.body.y-y)<.4);if(!r)return false;r.body.health=Math.max(0,r.body.health-damage);if(!r.body.health){r.body.phase='neutralized';g.stats.kills++;}return true;}
 const runtime=new Map();
 function witnessed(r){
  const p=position();if(!same(p,r.point))return false;
  if(p.domain==='local')return g.visible(r.point.x,r.point.y,20,g.viewBounds())&&g.hostileLineClear(g.player,r.point)&&g.nightGear.localLineClear(g.player,r.point)&&(g.nightwatch?.visible(r.point)??true);
  const d=Math.hypot(r.point.x-p.x,r.point.y-p.y),w=g.frontier.world();if(d>20||!w.line(p,r.point,p.z,p.inside,null,.015))return false;
  const dark=g.nightwatch?.isBlackout(),lit=!dark&&(g.daylight()>.45||d<4);if(lit)return true;
  const angle=Math.atan2(r.point.y-p.y,r.point.x-p.x),delta=Math.abs(Math.atan2(Math.sin(angle-p.angle),Math.cos(angle-p.angle)));
  if(g.urban.snapshot().flashlight&&d<9&&delta<.52)return true;
  return [...(g.nightGear?.lights('region')||[]),...(g.essentials?.lights('region')||[])].some(l=>l.z===p.z&&(p.z===0||l.inside===p.inside)&&Math.hypot(l.x-r.point.x,l.y-r.point.y)<l.r&&w.line(l,r.point,p.z,p.inside,null,.015));
 }
 function step(dt){
  if(!running()||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,R.maxStep);syncBodies();
  for(const r of state.remains){const b=r.body;if(b.phase==='waiting'){
   b.left=Math.max(0,b.left-dt);if(!b.left){if(r.point.domain==='local'){
    if(g.zombies.length>=C.PERFORMANCE_LIMITS.zombies||g.nextId>=0x7ffffffe)continue;
    if(g.spawnZombie('walker')===false)continue;const z=g.zombies[g.zombies.length-1];Object.assign(z,{x:r.point.x,y:r.point.y,health:Math.min(R.health,z.maxHealth)});b.health=z.health;b.zombieId=z.id;
   }b.phase='risen';if(witnessed(r))g.notify('Une dépouille s’est relevée. Le sac est resté au point de chute.','danger');}
  }
  if(r.point.domain!=='region'||b.phase!=='risen')continue;const p=position();if(!same(p,r.point)||Math.hypot(b.x-p.x,b.y-p.y)>100)continue;
  let e=runtime.get(r.id);if(!e){e={id:'fallen:'+r.id,poi:r.point.inside,z:r.point.z,x:b.x,y:b.y,hp:b.health,a:0,cool:0,mode:'chase',ttl:5,gx:p.x,gy:p.y,path:null,repath:0};runtime.set(r.id,e);}Object.assign(e,{x:b.x,y:b.y,hp:b.health});
  const w=g.frontier.world(),T=C.FrontierTacticsRules;root.DeadwallFrontierSurvey.step(w,e,{...p,a:g.frontier.position().a},dt,T,{left:T.pathBudget},(x,y)=>w.blocked(x,y,T.enemyRadius,e.z,e.z?e.poi:null)||e.z===0&&g.worldEvolution.districtBlocked(x,y,T.enemyRadius));b.x=e.x;b.y=e.y;
  if(Math.hypot(e.x-p.x,e.y-p.y)<.9&&e.cool<=0&&w.line(e,p,p.z,p.inside,null,.015)){g.frontier.damage(R.damage);e.cool=R.attackInterval;if(g.player.dead){die();break;}}
  }
 }
 function locationLabel(p){return p.domain==='local'?'D-17 · '+Math.round(p.x/32)+' / '+Math.round(p.y/32)+' m':(p.inside||'Région')+' · étage '+p.z+' · '+Math.round(p.x)+' / '+Math.round(p.y)+' m';}
 function view(){const last=state.remains.at(-1);return{pending:state.pending,choices:choices(),current:{...copy(state.current),name:profile().name},lastDeath:last?{...copy(last),name:R.profiles[last.profile].name,locationLabel:locationLabel(last.point)}:null,remainsCount:state.remains.length,remains:state.remains.map(r=>({id:r.id,locationLabel:locationLabel(r.point),phase:r.body.phase,quantity:C.bagTotal(r.bag)})),message,nearby:nearestRemains(),atDepot:home(),canRequisition:!state.pending&&home(),requisitions:requisitions(),reanimationChance:R.reanimationChance};}
 function draw(ctx,r,part,domain){const s=domain==='local'?32:1,p=part==='body'?r.body:r.point;if((part==='bag'||r.body.phase!=='risen')&&g.art?.drawFallen133?.(ctx,{id:r.id,x:p.x,y:p.y,angle:r.point.angle,scale:s/32},part==='bag'?'bag':'corpse'))return;ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);
  if(part==='bag'){ctx.translate(-.6,0);ctx.fillStyle='#252925';ctx.beginPath();ctx.ellipse(.62,.1,.3,.2,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=amount(r)>0?'#65704e':'#454b38';ctx.fillRect(.36,-.19,.48,.48);ctx.strokeStyle='#d1bd87';ctx.lineWidth=.035;ctx.strokeRect(.4,-.14,.39,.34);ctx.beginPath();ctx.arc(.61,-.2,.12,Math.PI,0);ctx.stroke();}
  else if(r.body.phase==='risen'){ctx.restore();ctx.save();ctx.scale(s/32,s/32);const drawn=g.art?.drawActor(ctx,{id:r.id,visualIdentity:'fallen:'+r.id,x:r.body.x*32/s,y:r.body.y*32/s,facing:0,health:r.body.health},'walker',g.elapsed,g.settings.reducedMotion,false);if(!drawn){ctx.translate(r.body.x*32/s,r.body.y*32/s);ctx.fillStyle='#58644e';ctx.beginPath();ctx.ellipse(0,0,11,15,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b49c7d';ctx.beginPath();ctx.arc(4,-8,7,0,Math.PI*2);ctx.fill();}}
  else{ctx.rotate(r.point.angle);ctx.fillStyle='rgba(78,27,23,.5)';ctx.beginPath();ctx.ellipse(0,.09,.67,.36,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#89713e';ctx.fillRect(-.37,-.17,.66,.34);ctx.strokeStyle='#89713e';ctx.lineWidth=.12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(.13,-.13);ctx.lineTo(.04,-.34);ctx.lineTo(-.21,-.36);ctx.moveTo(.1,.14);ctx.lineTo(-.06,.3);ctx.lineTo(-.27,.22);ctx.stroke();ctx.fillStyle='#3b403e';ctx.fillRect(-.69,-.16,.4,.14);ctx.fillRect(-.63,.05,.37,.14);ctx.fillStyle='#493b2e';ctx.fillRect(-.84,-.17,.19,.15);ctx.fillRect(-.78,.05,.2,.15);ctx.fillStyle='#b29372';ctx.beginPath();ctx.arc(.39,0,.17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#504236';ctx.beginPath();ctx.ellipse(.42,-.02,.12,.16,.1,0,Math.PI*2);ctx.fill();}ctx.restore();}
 function depthEntries(domain,v,view){return state.remains.filter(r=>r.point.domain===domain&&(domain==='local'||r.point.z===v.z&&(v.z===0||r.point.inside===v.inside))).flatMap(r=>['body','bag'].filter(part=>!(part==='body'&&domain==='local'&&r.body.phase==='risen')).flatMap(part=>{const p=part==='body'?r.body:r.point;const margin=domain==='local'?32:1;if(view&&(p.x<(view.left??view.l)-margin||p.x>(view.right??view.r)+margin||p.y<(view.top??view.t)-margin||p.y>(view.bottom??view.b)+margin))return[];if(domain==='region'&&!(root.DeadwallFrontierArt?.visiblePoint(g,{...r.point,x:p.x,y:p.y},v)??true))return[];return[{kind:'remains',id:'fallen:'+r.id+':'+part,x:p.x,y:p.y,depth:p.y+(part==='bag'?.2:.08)*(domain==='local'?32:1),draw:ctx=>draw(ctx,r,part,domain)}];}));}
 const api={setOwnedSlots134:slots=>{if(!Array.isArray(slots)||slots.some(k=>!weapons.includes(k)))return false;state.current.weapons=[...new Set(slots)];return true;},ownedWeapons:()=>[...state.current.weapons],pending:()=>state.pending,choices,select,view,remains:()=>copy(state.remains),nearestRemains,loot,requisition,ownsWeapon,meleeDamage,movementFactor:()=>profile().speed,constructionFactor:()=>profile().construction,captureDeathPoint,captureDeath:die,contacts,hit,regionalMelee,step,depthEntries,snapshot:()=>{syncBodies();return copy(state);}};g.succession133=Object.freeze(api);
 const S=root.DeadwallSave;if(!S.__succession133){const old=S.validate.bind(S);S.validate=raw=>{const data=old(raw);data.succession133=validate(raw?.succession133,data);return data;};S.__succession133=true;}
 wrap('serialize',(old,...a)=>{if(!processing&&g.player.dead&&!state.pending)die();syncBodies();return{...old(...a),succession133:copy(state)};});
 wrap('restoreSave',(old,raw)=>{const data=S.validate(raw),next=validate(raw?.succession133,data),result=old(data);if(result===false)return false;state=next;captured=null;runtime.clear();lastWorld=g.world;applyProfile();if(g.player.dead&&!state.pending)die();if(state.pending)g.paused=true;refresh();return result;});
 wrap('startNew',(old,...a)=>{let valid=true;try{root.DeadwallProfile.normalizeSeed(a[1]??'');root.DeadwallScenarios.initialState(a[2]??'classic',a[0]||'standard');}catch{valid=false;}const previous=state,before=g.world;if(valid){state=initial();captured=null;}const result=old(...a);if(g.world===before)state=previous;else{lastWorld=g.world;runtime.clear();applyProfile();}refresh();return result;});
 wrap('damagePlayer',(old,...a)=>{if(!g.player.dead)captureDeathPoint(position());const result=old(...a);if(g.player.dead||g.player.health<=0)die();else captured=null;return result;});
 wrap('updatePlayer',(old,dt)=>{if(g.player.dead||g.player.health<=0){die();return;}const nearby=nearestRemains(),interact=!!nearby&&g.input.keys.has('KeyE');if(interact)g.input.keys.delete('KeyE');const result=old(dt);if(interact){if(!g.player.dead)g.input.keys.add('KeyE');loot(nearby.id);}if(g.player.dead||g.player.health<=0)die();else{const at=nearestRemains();if(at)g.interactionText='E · Reprendre le sac de '+R.profiles[at.profile].name+' · '+Math.ceil(C.bagTotal(at.bag))+' fournitures'+(interact&&message?' · '+message:'');}return result;});
 wrap('update',(old,dt)=>{if(g.player.dead||g.player.health<=0)die();if(state.pending)return;const run=running(),result=old(dt);if(g.player.dead||g.player.health<=0)die();if(run)step(dt);return result;});
 wrap('canIssueCommand',(old,...a)=>!state.pending&&old(...a));
 wrap('updateUI',(old,...a)=>{const result=old(...a);if(g.state==='playing'&&!g.player.dead&&!ownsWeapon(g.player.weapon)){if(g.ui.weaponName)g.ui.weaponName.textContent='Mains libres';if(g.ui.weaponAmmo)g.ui.weaponAmmo.textContent='Espace · frapper';}return result;});
 for(const name of ['shootPlayer','startReload','finishReload'])wrap(name,(old,...a)=>ownsWeapon(g.player.weapon)?old(...a):false);
 wrap('switchWeapon',(old,id)=>ownsWeapon(id)?old(id):fail('Arme absente : reprenez votre équipement ou équipez-vous au dépôt.'));
 wrap('moveFriendly',(old,entity,dx,dy)=>old(entity,dx*(entity===g.player?profile().speed:1),dy*(entity===g.player?profile().speed:1)));
 const prep=g.playerOps131;g.playerOps131=Object.freeze({...prep,constructionFactor:dt=>prep.constructionFactor(dt)*profile().construction});
 wrap('depthEntries',(old,view)=>{const entries=old(view);if(g.frontier.active()&&!view?.homeProjection)return entries;for(const item of depthEntries('local',null,view))entries.push({kind:1,id:-133000-item.x,depth:item.depth,order:entries.length,entity:{__fallenDraw:item.draw}});entries.sort((a,b)=>a.depth-b.depth||a.kind-b.kind||a.id-b.id||a.order-b.order);return entries;});
 wrap('drawBuilding',(old,ctx,b,...a)=>b.__fallenDraw?b.__fallenDraw(ctx):old(ctx,b,...a));
 return api;
}
const api={initial,validate,install};root.DeadwallSuccession133=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.DEADWALL?.playerOps131&&root.document)install(root.DEADWALL);
})(globalThis);
