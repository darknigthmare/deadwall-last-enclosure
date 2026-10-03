(function(root){'use strict';
function install(g){if(g.worldEvolution)return g.worldEvolution;const C=root.DeadwallCore,S=C.WorldEvolution,R=S.RULES,G=root.DeadwallFrontierGeometry,K=C.RegionContactRules,Survey=root.DeadwallFrontierSurvey;const contactRuntime=new Map();let campaignTimer=0,contacts=[],state=S.initial(),pending=null,worldRef=g.world,notice='',hitCd=0;const wrap=(n,fn)=>{const old=g[n].bind(g);g[n]=(...a)=>fn(old,...a);},world=()=>g.frontier.world(),alive=h=>h.count-h.lost;
function ensure(){if(worldRef!==g.world){worldRef=g.world;state=S.normalize(pending||undefined);pending=null;rt.clear();contacts=[];contactRuntime.clear();}return state;}
function enableWorld4(){ensure();const f=g.frontier.snapshot();if(f.generation>=4)return true;if(f.generation!==3||f.active||f.seen.length||Object.keys(f.taken).length||!g.canIssueCommand())return false;const d=g.serialize();d.frontier={...d.frontier,generation:4};pending=state;g.restoreSave(d);notice='Monde étendu 1.23 activé.';g.save(false);return true;}
function spawnInitial(){if(g.frontier.position().generation<4||state.groups.length)return;const w=world();for(let i=0;i<12;i++){for(let k=0;k<60;k++){const id='W'+String(state.serial).padStart(4,'0'),r=w.roads[G.hash(w.seed,id,k)%w.roads.length],t=(G.hash(id,k,'t')%8001+1000)/10000,x=r.a.x+(r.b.x-r.a.x)*t,y=r.a.y+(r.b.y-r.a.y)*t;if(Math.hypot(x-(w.home?.x??4096),y-(w.home?.y??4096))<R.homeExclusion+220)continue;state.groups.push({id,kind:['resting','migrating','frenzied'][G.hash(id,'kind')%3],count:80+G.hash(id,'count')%281,lost:0,wound:0,fallen:[],injuries:{},contacts:{},x,y,a:Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x)+(G.hash(id,'dir')%2?0:Math.PI),seen:false});state.serial++;break;}}state.nextHorde=state.clock+R.eventMin+G.hash(w.seed,'next')%(R.eventMax-R.eventMin+1);}
function spawnLater(){if(state.groups.length>=R.groupLimit)return;const w=world(),f=g.frontier.position();for(let k=0;k<70;k++){const id='W'+String(state.serial).padStart(4,'0'),r=w.roads[G.hash(w.seed,id,k)%w.roads.length],t=(G.hash(id,k,'t')%10001)/10000,x=r.a.x+(r.b.x-r.a.x)*t,y=r.a.y+(r.b.y-r.a.y)*t;if(Math.hypot(x-f.x,y-f.y)<900||Math.hypot(x-(w.home?.x??4096),y-(w.home?.y??4096))<R.homeExclusion+160)continue;state.groups.push({id,kind:['resting','migrating','frenzied'][G.hash(id,'kind')%3],count:70+G.hash(id,'count')%291,lost:0,wound:0,fallen:[],injuries:{},contacts:{},x,y,a:Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),seen:false});state.serial++;notice='Une horde sauvage a été signalée au loin.';return;}}
function surface(f){if(f.generation<4)return{key:'asphalt',...R.surfaces.asphalt};if(f.z!==0)return{key:'floor',...R.surfaces.floor};const w=world(),r=w.nearestRoad(f);if((r&&r.d<r.road.width/2+1)||w.drivewayAt?.(f.x,f.y,1))return{key:'asphalt',...R.surfaces.asphalt};if(w.nearPOI(f.x,f.y,15).some(p=>f.x>p.reserve.l&&f.x<p.reserve.r&&f.y>p.reserve.t&&f.y<p.reserve.b))return{key:'gravel',...R.surfaces.gravel};if(w.generation>=6&&root.DeadwallBiomes135){const sample=root.DeadwallBiomes135.sample(w.seed,f.x,f.y,true,{generation:w.generation}),key=sample.surface||sample.definition?.surface||sample.def?.surface;if(R.surfaces[key])return{key,...R.surfaces[key]};}const n=G.noise(w.seed^4451,f.x,f.y,160);return n<.16?{key:'mud',...R.surfaces.mud}:n>.64?{key:'forest',...R.surfaces.forest}:{key:'grass',...R.surfaces.grass};}
function posture(){ensure();return{key:state.posture,...R.postures[state.posture]};}function setPosture(k){ensure();if(!Object.hasOwn(R.postures,k))return false;state.posture=k;return true;}function cyclePosture(){ensure();if(!g.frontier.active()||g.frontier.snapshot().car?.driving)return false;state.posture=state.posture==='stand'?'crouch':state.posture==='crouch'?'prone':'stand';g.save(false);return true;}
function hear(p,radius){Survey.hear(world(),contacts,p,radius,C.FrontierTacticsRules);for(const e of contacts)if(!e.group.fallen.includes(e.index))e.group.contacts[e.index]=Survey.record(e);for(const h of state.groups)if(h.kind!=='resting'&&Math.hypot(h.x-p.x,h.y-p.y)<radius*1.6)h.a=Math.atan2(p.y-h.y,p.x-h.x);}
function groupRadius(h){return 5+Math.sqrt(Math.max(1,alive(h)))*.7;}
function wound(h){h.wound=Object.values(h.injuries)[0]||0;h.lost=h.fallen.length;}
function damageContact(h,index,damage){
 if(h.fallen.includes(index)||damage<=0)return false;
 const amount=(h.injuries[index]||0)+damage;
 if(amount>=R.enemyHealth){h.fallen.push(index);h.fallen.sort((a,b)=>a-b);delete h.injuries[index];delete h.contacts[index];}
 else h.injuries[index]=amount;
 wound(h);h.seen=true;return true;
}
// The area-damage API remains for existing scripted events. Bullets use hitContact.
function hitPoint(x,y,damage){
 if(!Number.isFinite(damage)||damage<=0)return false;
 const h=state.groups.filter(h=>alive(h)>0&&Math.hypot(h.x-x,h.y-y)<groupRadius(h)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];if(!h)return false;
 for(let i=0;i<h.count&&damage>0;i++){if(h.fallen.includes(i))continue;const used=Math.min(damage,R.enemyHealth-(h.injuries[i]||0));damageContact(h,i,used);damage-=used;}
 return true;
}
function hitContact(x,y,damage,contactId=null){
 if(!Number.isFinite(damage)||damage<=0)return false;
 const e=contacts.find(e=>(contactId===null||e.id===contactId)&&!e.group.fallen.includes(e.index)&&Math.hypot(e.x-x,e.y-y)<=K.contactRadius);
 return e?damageContact(e.group,e.index,damage):false;
}
function groupMembers(){
 ensure();const f=g.frontier.position();if(!f.active||f.z!==0)return[];
 // A saved, paused encounter is already present before its first resumed tick.
 if(!contacts.length)for(const h of state.groups){if(Math.hypot(h.x-f.x,h.y-f.y)>K.streamRange+groupRadius(h))continue;for(const[index,p]of Object.entries(h.contacts)){if(contacts.length>=K.contactBudget)break;const id=h.id+':'+index,e={...p,id,index:Number(index),group:h,poi:null,hp:R.enemyHealth-(h.injuries[index]||0)};contacts.push(e);contactRuntime.set(id,e);}}
 return contacts.filter(e=>!e.group.fallen.includes(e.index));
}
function initialContact(h,index,w){
 const angle=index*2.399963229728653+G.hash(h.id,'formation')/4294967296*Math.PI*2,radius=K.formationSpacing*Math.sqrt(index),original={x:h.x+Math.cos(angle)*radius,y:h.y+Math.sin(angle)*radius};
 for(let k=0;k<25;k++){
  const a=angle+k*2.399963229728653,r=k?Math.sqrt(k)*.5:0,p={x:original.x+Math.cos(a)*r,y:original.y+Math.sin(a)*r};
  if(p.x<.32||p.y<.32||p.x>w.size-.32||p.y>w.size-.32||w.blocked(p.x,p.y,C.FrontierTacticsRules.enemyRadius,0,null)||districtBlocked(p.x,p.y,C.FrontierTacticsRules.enemyRadius))continue;
  return{...p,z:0,a:h.a,mode:'idle',ttl:0,gx:p.x,gy:p.y,cool:0};
 }
 return null;
}
function stepContacts(dt,f){
 contacts=[];const w=world(),T=C.FrontierTacticsRules,budget={left:T.pathBudget};
 const nearby=state.groups.filter(h=>alive(h)>0&&Math.hypot(h.x-f.x,h.y-f.y)<K.streamRange+groupRadius(h)).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y));
 for(const h of nearby){
  const dead=new Set(h.fallen);
  for(let i=0;i<h.count&&contacts.length<K.contactBudget;i++){
   if(dead.has(i))continue;const p=h.contacts[i]||(h.contacts[i]=initialContact(h,i,w));if(!p){delete h.contacts[i];continue;}
   const id=h.id+':'+i,e=contactRuntime.get(id)||{};Object.assign(e,p,{id,index:i,group:h,poi:null,z:0,hp:R.enemyHealth-(h.injuries[i]||0)});contactRuntime.set(id,e);contacts.push(e);
   const blocked=(x,y)=>{if(w.blocked(x,y,T.enemyRadius,0,null)||districtBlocked(x,y,T.enemyRadius))return true;if(f.car){const v=vehicleProfile(),q=G.local({...f.car,w:v.w,h:v.h},x,y);if(G.circleRect(q.x,q.y,T.enemyRadius,{x:0,y:0,w:v.w,h:v.h}))return true;}return false;};
   Survey.step(w,e,f,dt,T,budget,blocked);
   if(!g.frontier.active()){h.contacts[i]=Survey.record(e);continue;}
   const target=f.car?.driving?Survey.edge(e,{...f.car,w:vehicleProfile().w,h:vehicleProfile().h}):f;
   if(Math.hypot(e.x-target.x,e.y-target.y)<K.attackReach&&e.cool===0&&w.line(e,target,0,f.inside,null,.015)){g.frontier.damage?.(R.attack);e.cool=K.attackInterval;}h.contacts[i]=Survey.record(e);
  }
 }
 const active=new Set(contacts.map(e=>e.id));for(const id of contactRuntime.keys())if(!active.has(id))contactRuntime.delete(id);
}
function structureIntegrity(id){return state.structures[id]??1;}function structureDestroyed(id){return structureIntegrity(id)<=.001;}
function stepGroups(dt){spawnInitial();const w=world(),f=g.frontier.position();state.clock+=dt;if(state.clock>=state.nextHorde){spawnLater();state.nextHorde=state.clock+R.eventMin+G.hash(w.seed,state.serial,'next')%(R.eventMax-R.eventMin+1);}hitCd=Math.max(0,hitCd-dt);for(const h of state.groups){if(!alive(h))continue;const dist=Math.hypot(h.x-f.x,h.y-f.y);if(dist<550)h.seen=true;const rule=R.behaviours[h.kind];if(rule.speed){const nr=w.nearestRoad(h),ra=Math.atan2(nr.road.b.y-nr.road.a.y,nr.road.b.x-nr.road.a.x),blend=h.kind==='migrating'?.86:.45;h.a=Math.atan2(Math.sin(h.a)*(1-blend)+Math.sin(ra)*blend,Math.cos(h.a)*(1-blend)+Math.cos(ra)*blend);if(h.kind==='frenzied')h.a+=(G.hash(h.id,Math.floor(state.clock))%2001-1000)/9000;let nx=h.x+Math.cos(h.a)*rule.speed*dt,ny=h.y+Math.sin(h.a)*rule.speed*dt;if(Math.hypot(nx-(w.home?.x??4096),ny-(w.home?.y??4096))<R.homeExclusion){h.a=Math.atan2(h.y-(w.home?.y??4096),h.x-(w.home?.x??4096));nx=h.x+Math.cos(h.a)*rule.speed*dt;ny=h.y+Math.sin(h.a)*rule.speed*dt;}if(nx<45||nx>w.size-45||ny<45||ny>w.size-45)h.a+=Math.PI;else{const dx=nx-h.x,dy=ny-h.y;for(const p of Object.values(h.contacts)){if(p.mode==='pursuit'||p.mode==='investigate')continue;const tx=p.x+dx,ty=p.y+dy;if(!w.blocked(tx,ty,C.FrontierTacticsRules.enemyRadius,0,null)&&!districtBlocked(tx,ty,C.FrontierTacticsRules.enemyRadius)){p.x=tx;p.y=ty;p.gx+=dx;p.gy+=dy;}}h.x=nx;h.y=ny;}}if(alive(h)>30){const p=w.nearPOI(h.x,h.y,16).find(p=>h.x>p.reserve.l&&h.x<p.reserve.r&&h.y>p.reserve.t&&h.y<p.reserve.b);if(p){const old=state.structures[p.id]??1,rate=(h.kind==='frenzied'?2:h.kind==='migrating'?1:.35)*alive(h)*.00003;state.structures[p.id]=Math.max(0,old-rate*dt);}}}}
const DPOS={east:{x:4270,y:4096,a:0},west:{x:3922,y:4096,a:Math.PI},north:{x:4096,y:3922,a:-Math.PI/2},south:{x:4096,y:4270,a:Math.PI/2},outer:{x:4235,y:4235,a:.75}};
function districts(){const home=root.DeadwallAtlasProjection.home(g),poses=g.frontier.position().generation>=6?root.DeadwallGeography135.annexes(g.world.seed,g.frontier.position().generation):null;return Object.entries(state.districts).map(([id,d])=>({id,...d,pos:poses?poses.find(p=>p.id===id):{...DPOS[id],x:DPOS[id].x-4096+home.x,y:DPOS[id].y-4096+home.y},complete:d.buildings.filter(b=>b.progress>=1).length}));}
function districtEffects(){ensure();let housing=0,storage=0,power=0;for(const d of Object.values(state.districts))for(const b of d.buildings)if(b.progress>=1){const x=R.districtBuildings[b.type];housing+=x.housing||0;storage+=x.storage||0;power+=x.power||0;}return{housing,storage,power};}
function previewDistrictClaim(id){
 ensure();const d=state.districts[id],need={east:2,west:2,north:3,south:3,outer:4}[id];
 if(!d)return{ok:false,reason:'District inconnu.'};
 if(d.level)return{ok:false,reason:'Ce district est déjà sécurisé.'};
 if(g.tier.id<need)return{ok:false,reason:'Palier '+need+' requis pour sécuriser ce district.'};
 if(g.frontier.active())return{ok:false,reason:'Revenez à D-17 pour sécuriser ce district.'};
 if(!g.canIssueCommand())return{ok:false,reason:'Sécurisation disponible dans le commandement en partie.'};
 const cost={wood:80+need*20,stone:60+need*20,scrap:50+need*15};
 if(!C.canAfford(g.resources,cost))return{ok:false,cost,reason:'Stocks insuffisants : '+C.resourceText(cost)+' nécessaires.'};
 return{ok:true,cost};
}
function claimDistrict(id){const q=previewDistrictClaim(id);if(!q.ok)return false;C.spend(g.resources,q.cost);state.districts[id].level=1;g.save(false);return true;}
function previewDistrictBuild(id,type){
 const d=state.districts[id],def=R.districtBuildings[type];
 if(!d?.level)return{ok:false,reason:'Sécurisez ce district avant de construire.'};
 if(!def)return{ok:false,reason:'Bâtiment annexe inconnu.'};
 if(d.buildings.length>=R.districtSlots)return{ok:false,reason:'Les '+R.districtSlots+' emplacements de ce district sont occupés.'};
 if(g.frontier.active())return{ok:false,reason:'Revenez à D-17 pour construire dans ce district.'};
 if(!g.canIssueCommand())return{ok:false,reason:'Construction disponible dans le commandement en partie.'};
 if(!C.canAfford(g.resources,def.cost))return{ok:false,cost:{...def.cost},reason:'Stocks insuffisants : '+C.resourceText(def.cost)+' nécessaires.'};
 return{ok:true,cost:{...def.cost}};
}
function buildDistrict(id,type){const q=previewDistrictBuild(id,type);if(!q.ok)return false;const d=state.districts[id];C.spend(g.resources,q.cost);const slot=[0,1,2,3,4,5,6,7].find(n=>!d.buildings.some(b=>b.slot===n));d.buildings.push({type,slot,progress:0});g.save(false);return true;}
function districtBlocked(x,y,r=.32,vehicle=null){for(const d of districts()){if(!d.level)continue;const dx=x-d.pos.x,dy=y-d.pos.y,c=Math.cos(-d.pos.a),s=Math.sin(-d.pos.a),lx=dx*c-dy*s,ly=dx*s+dy*c;for(const b of d.buildings){const col=b.slot%2,row=Math.floor(b.slot/2),bx=-22+col*28,by=-22+row*13;if(vehicle){if(G.obb({x:lx,y:ly,a:vehicle.a-d.pos.a,w:vehicle.w,h:vehicle.h},{x:bx+10,y:by+4.5,a:0,w:20,h:9}))return true;}else if(lx+r>bx&&lx-r<bx+20&&ly+r>by&&ly-r<by+9)return true;}}return false;}
function vehicleProfile(){return R.vehicles[state.fleet.active]||R.vehicles.break;}function selectVehicle(id){const p=R.vehicles[id];if(!p||g.tier.id<p.tier||g.expeditions.car()?.health>0||g.frontier.active()||!g.canIssueCommand())return false;state.fleet.selected=id;g.save(false);return true;}function activateSelected(){state.fleet.active=state.fleet.selected;return vehicleProfile();}
const rt=new Map();function assignCompanion(id){if(!Object.hasOwn(R.companions,id)||state.companions.some(c=>c.id===id)||state.companions.length>=R.companionRules.maxCompanions||g.population<R.companionRules.minimumPopulation||g.frontier.active()||!g.canIssueCommand()||g.resources.food<R.companionRules.assignmentFood)return false;g.resources.food-=R.companionRules.assignmentFood;rt.delete(id);state.companions.push({id,health:100,order:'follow'});g.save(false);return true;}function removeCompanion(id){if(g.frontier.active())return false;state.companions=state.companions.filter(c=>c.id!==id);rt.delete(id);g.save(false);return true;}
function companionStep(dt,f){
 const rules=R.companionRules,T=C.FrontierTacticsRules,Survey=root.DeadwallFrontierSurvey,w=world();
 const blocked=(x,y)=>{if(w.blocked(x,y,rules.radius,f.z,f.inside)||f.z===0&&districtBlocked(x,y,rules.radius))return true;if(f.z===0&&f.car){const v=vehicleProfile(),q=G.local({...f.car,w:v.w,h:v.h},x,y);if(G.circleRect(q.x,q.y,rules.radius,{x:0,y:0,w:v.w,h:v.h}))return true;}return false;};
 const clear=(a,b)=>w.line(a,b,f.z,f.inside,null,rules.radius)&&!blocked(b.x,b.y);
 for(let i=0;i<state.companions.length;i++){
  const c=state.companions[i];if(c.health<=0)continue;
  if(f.car?.driving){rt.set(c.id,{x:f.x,y:f.y,z:f.z,inside:f.inside,a:f.a,riding:true});g.companionsPack?.record(c.id,rt.get(c.id));continue;}
  const side=i?1:-1,goal={x:f.x-Math.cos(f.a)*rules.followDistance+Math.cos(f.a+Math.PI/2)*1.5*side,y:f.y-Math.sin(f.a)*rules.followDistance+Math.sin(f.a+Math.PI/2)*1.5*side};
  let p=rt.get(c.id);
  if(!p||p.z!==f.z||p.riding){
   p=g.companionsPack?.resumePosition(c.id,f)||null;if(p&&blocked(p.x,p.y))p=null;for(let k=0;!p&&k<24;k++){const a=f.a+k*Math.PI/12,r=.8+Math.floor(k/8)*.55,q={x:f.x+Math.cos(a)*r,y:f.y+Math.sin(a)*r};if(clear(f,q)){p={...q,z:f.z,inside:f.inside,a:f.a,repath:0,cool:0};break;}}
   if(!p)continue;rt.set(c.id,p);
  }
  p.inside=f.inside;p.cool=Math.max(0,(p.cool||0)-dt);p.repath=Math.max(0,(p.repath||0)-dt);
  const control=g.companionsPack?.control(c.id,f,i,p)||{},desired=control.goal||goal;
  if(control.token!==undefined&&p.controlToken!==control.token){p.path=null;p.repath=0;p.controlToken=control.token;}
  if(control.hold===false||control.hold===undefined&&c.order!=='hold'){
   const target=blocked(desired.x,desired.y)?{x:f.x,y:f.y}:desired;let next=target;
   if(!clear(p,target)){
    if(!p.path&&p.repath===0){p.path=Survey?.path(w,{...p,poi:f.inside},target,T,blocked);p.repath=T.pathCooldown;}
    while(p.path?.length&&Math.hypot(p.path[0].x-p.x,p.path[0].y-p.y)<.2)p.path.shift();
    next=p.path?.[0];
   }else p.path=null;
   if(next){const dx=next.x-p.x,dy=next.y-p.y,d=Math.hypot(dx,dy);if(d>.2){const amount=Math.min(d,rules.speed*dt),q={x:p.x+dx/d*amount,y:p.y+dy/d*amount};if(clear(p,q)){p.x=q.x;p.y=q.y;}else p.path=null;}}
  }
  p.a=Math.atan2(f.y-p.y,f.x-p.x);const distance=Math.hypot(f.x-p.x,f.y-p.y),near=distance<=rules.healRange&&clear(p,f);
  if(c.id==='lea'&&f.z===0)for(const h of state.groups)if(Math.hypot(h.x-p.x,h.y-p.y)<rules.scoutRange*(control.scoutMultiplier||1))h.seen=true;
  const working=!!(g.fieldSupplies?.busy()||g.essentials?.busy()||g.expansions?.busy());
  if(!working&&c.id==='samir'&&near&&!g.player.dead){const hp=Math.max(0,g.player.maxHealth-g.player.health),n=Math.min(hp,rules.healPerSecond*(control.healMultiplier||1)*dt,g.player.carry.medicine/rules.medicinePerHealth);if(n>0){g.player.carry.medicine=Math.max(0,g.player.carry.medicine-n*rules.medicinePerHealth);g.player.health+=n;}}
  if(!working&&c.id==='ines'&&f.z===0&&f.car){const car=g.expeditions.car(),profile=vehicleProfile(),edge=Survey.edge(p,{...f.car,w:profile.w,h:profile.h});if(car&&car.health>0&&Math.hypot(edge.x-p.x,edge.y-p.y)<=rules.repairRange&&w.line(p,edge,0,null,null,.05)){const n=Math.min(profile.health-car.health,rules.repairPerSecond*(control.repairMultiplier||1)*dt,g.player.carry.scrap/rules.scrapPerHealth);if(n>0){g.player.carry.scrap=Math.max(0,g.player.carry.scrap-n*rules.scrapPerHealth);car.health+=n;}}}
  if(!working&&control.fire!==false&&c.id==='malik'&&p.cool===0&&g.player.carry.ammo>=rules.shotAmmo&&g.frontier.companionShot?.(p,control.shotRange||rules.shotRange,rules.shotDamage*(control.damageMultiplier||1))){g.player.carry.ammo-=rules.shotAmmo;p.cool=rules.shotInterval;g.audio.shot('pistol');}
  g.companionsPack?.record(c.id,p);
 }
}
function campaignStep(){const discovered=g.frontier.discoveries(),seen=discovered.length,towns=new Set(discovered.map(id=>world().pois.find(p=>p.id===id)?.town).filter(Boolean)).size,annex=Object.values(state.districts).some(d=>d.level),kills=state.groups.reduce((n,h)=>n+h.lost,0),done=[seen>=20,towns>=3,annex,kills>=20,state.fleet.active!=='break',state.companions.length>0,Object.values(state.districts).reduce((n,d)=>n+d.buildings.filter(b=>b.progress>=1).length,0)>=10];while(state.campaign.chapter<R.campaign.length&&done[state.campaign.chapter]){state.campaign.flags.push(R.campaign[state.campaign.chapter].id);state.campaign.chapter++;}}
function update(dt){ensure();if(!g.frontier.active()){rt.clear();contacts=[];contactRuntime.clear();}if(g.frontier.active()&&g.frontier.position().generation>=4){const f=g.frontier.position();if(f.z===0){stepGroups(dt);stepContacts(dt,f);}else contacts=[];companionStep(dt,f);campaignTimer-=dt;if(campaignTimer<=0){campaignStep();campaignTimer=1;}}if(g.phase==='calm')for(const d of Object.values(state.districts))for(const b of d.buildings)if(b.progress<1)b.progress=Math.min(1,b.progress+dt/25);const e=districtEffects();state.civil.morale=Math.max(0,Math.min(100,50+Math.min(20,g.resources.food/20)+e.housing*.5));state.civil.safety=Math.max(0,Math.min(100,45+e.power*2+Object.values(state.districts).reduce((n,d)=>n+d.buildings.filter(b=>b.progress>=1).length*2,0)));}
function overview(){ensure();const f=g.frontier.position();return{posture:posture(),surface:f.active?surface(f):null,groups:state.groups.map(h=>({...h,alive:alive(h)})),visibleGroups:state.groups.filter(h=>h.seen).map(h=>({...h,alive:alive(h)})),districts:districts(),fleet:{...state.fleet,selectedProfile:R.vehicles[state.fleet.selected],activeProfile:vehicleProfile()},companions:state.companions.map(c=>({...c,...R.companions[c.id],...(rt.get(c.id)||{})})),campaign:{...state.campaign,next:R.campaign[state.campaign.chapter]||null},civil:{...state.civil},notice};}
const api={enableWorld4,overview,posture,setPosture,cyclePosture,surface,hear,hitPoint,hitContact,groupMembers,groupRadius,structureIntegrity,structureDestroyed,districtBlocked,previewDistrictClaim,claimDistrict,previewDistrictBuild,buildDistrict,districtEffects,vehicleProfile,selectVehicle,activateSelected,assignCompanion,removeCompanion,snapshot:()=>S.normalize(state)};g.worldEvolution=Object.freeze(api);
wrap('serialize',(old,...a)=>{ensure();return{...old(...a),worldEvolution:S.normalize(state)};});wrap('restoreSave',(old,raw)=>{const d=root.DeadwallSave.validate(raw);pending=d.worldEvolution;try{return old(d);}finally{ensure();pending=null;}});wrap('startNew',(old,...a)=>{const before=g.world,r=old(...a);if(g.world!==before){pending=null;ensure();state=S.initial();contacts=[];contactRuntime.clear();}return r;});wrap('update',(old,dt)=>{const r=old(dt);if(g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay)update(Math.min(.1,dt));return r;});wrap('refreshMetrics',(old,...a)=>{const r=old(...a),e=districtEffects();g.housing+=e.housing;g.storage+=e.storage;return r;});return g.worldEvolution;}
const api={install};root.DeadwallWorldEvolution=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;})(globalThis);
