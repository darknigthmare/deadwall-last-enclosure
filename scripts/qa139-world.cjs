'use strict';
// Actual production HTML modules under the shared DOM fixture. Late-campaign
// poses are prepared only after their physical emprises are verified.
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.DEADWALL_QA_ROOT||path.resolve(__dirname,'..');
const {bootDocument134}=require(path.join(root,'scripts/qa-startup134.cjs'));
const copy=v=>JSON.parse(JSON.stringify(v));
function start(){
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();const C=globalThis.DeadwallCore,c=g.core();let garage;
 for(let x=67;x<82&&!garage;x++)for(let y=59;y<77;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){garage=new(c.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(garage);break;}
 assert.ok(garage);g.refreshMetrics(true);g.resources.wood=g.resources.scrap=500;
 const before=copy(g.resources);assert.equal(g.expeditions.buildCar().ok,true);for(const[k,n]of Object.entries(g.worldEvolution.vehicleProfile().cost))assert.equal(g.resources[k],before[k]-n);
 return g;
}
function stage(g,point,driving=true,vehiclePoint=point,site){
 const raw=g.serialize(),v=raw.expeditions.vehicle,w=g.frontier.world(),vp=g.worldEvolution.vehicleProfile();
 assert.equal(w.vehicleClear(vehiclePoint.x,vehiclePoint.y,vehiclePoint.a||0,vp.w,vp.h),true,'Le véhicule préparé a une emprise libre.');
 assert.equal(w.blocked(point.x,point.y,.32,0,point.inside||null),false,'La pose préparée du commandant est libre.');
 v.fuel=10;v.cargo=globalThis.DeadwallCore.makeBag({fuel:2});v.driving=false;v.angle=vehiclePoint.a||0;
 Object.assign(raw.frontier,{active:true,...point,z:0,inside:point.inside||null,a:0,anchor:{x:raw.player.x,y:raw.player.y},car:{id:v.id,x:vehiclePoint.x,y:vehiclePoint.y,a:vehiclePoint.a||0,driving}});
 if(site){if(!raw.frontier.seen.includes(site.id))raw.frontier.seen.push(site.id);for(let i=0;i<w.threatCount(site);i++)raw.frontier.enemies[site.id+':e'+i]=0;raw.frontier.kills=Object.values(raw.frontier.enemies).filter(v=>v===0).length;}
 assert.equal(g.restoreSave(raw),true);assert.equal(g.frontier.vehiclePresent(),true);return g.expeditions.car();
}
function nearby(g,driving=true){const w=g.frontier.world();return stage(g,{x:w.home.maxX+30,y:w.home.y},driving);}
function actualReload(g){g.player.magazine.pistol=2;g.player.carry.ammo=10;g.startReload();assert.equal(g.player.reload,1.35);}
function persist(g){const f=g.frontier.position(),v=copy(g.expeditions.car()),bag=copy(g.player.carry);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.frontier.position(),f);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.expeditions.car().cargo,v.cargo);assert.equal(g.expeditions.car().fuel,v.fuel);assert.equal(g.expeditions.car().id,v.id);}
function refuelDriving(observe=false){
 const g=start();nearby(g);g.player.carry.fuel=3;const before={fuel:g.expeditions.car().fuel,bag:g.player.carry.fuel,cargo:g.expeditions.car().cargo.fuel,driving:g.frontier.position().car.driving},accepted=g.frontier.refuel(),after={fuel:g.expeditions.car().fuel,bag:g.player.carry.fuel,cargo:g.expeditions.car().cargo.fuel,driving:g.frontier.position().car.driving};
 if(observe)return{scenario:'refuel-driving',before,accepted,after};
 assert.equal(accepted,false,'Aucun ravitaillement pendant la conduite.');assert.deepEqual(after,before);assert.equal(g.frontier.board(),true,'Le débarquement reste disponible.');assert.equal(g.frontier.refuel(),true);assert.equal(g.expeditions.car().fuel,15);assert.equal(g.player.carry.fuel,0);assert.equal(g.expeditions.car().cargo.fuel,0);persist(g);
 return{scenario:'refuel-driving',status:'passed',browser:false,before,accepted,after,afterLegalRefuel:g.expeditions.car().fuel};
}
function boardReload(observe=false){
 const g=start();nearby(g);assert.equal(g.frontier.board(),true);actualReload(g);const before=g.frontier.position(),remaining=g.player.reload,accepted=g.frontier.board(),after=g.frontier.position();
 if(observe)return{scenario:'board-reload',remaining,before,accepted,after,reload:g.player.reload};
 assert.equal(accepted,false,'La portière ne permet pas de conduire tout en rechargeant.');assert.deepEqual(after,before);assert.equal(g.player.reload,remaining);for(let i=0;i<40&&g.player.reload>0;i++)g.update(.04);assert.equal(g.player.reload,0);assert.ok(g.player.magazine.pistol>2);assert.equal(g.frontier.board(),true);assert.equal(g.frontier.position().car.driving,true);persist(g);
 return{scenario:'board-reload',status:'passed',browser:false,before,accepted,after,completedReload:g.player.magazine.pistol,legalBoard:g.frontier.position().car.driving};
}
function materialReload(observe=false){
 const g=start();nearby(g);assert.equal(g.frontier.board(),true);actualReload(g);g.player.carry.wood=1.25;g.player.carry.fuel=1;
 const record=()=>({bag:copy(g.player.carry),cargo:copy(g.expeditions.car().cargo),fuel:g.expeditions.car().fuel,reload:g.player.reload}),before=record(),transferAccepted=g.frontier.transfer(),refuelAccepted=g.frontier.refuel(),after=record();
 if(observe)return{scenario:'material-reload',before,transferAccepted,refuelAccepted,after};
 assert.equal(transferAccepted,false);assert.equal(refuelAccepted,false);assert.deepEqual(after,before,'Les gestes refusés ne déplacent aucun stock.');for(let i=0;i<40&&g.player.reload>0;i++)g.update(.04);assert.equal(g.player.reload,0);
 assert.equal(g.frontier.transfer(),true);assert.equal(g.expeditions.car().cargo.wood,1.25);assert.equal(g.player.carry.wood,0);assert.equal(g.frontier.refuel(),true);assert.equal(g.expeditions.car().fuel,13);persist(g);
 return{scenario:'material-reload',status:'passed',browser:false,before,transferAccepted,refuelAccepted,after,fuelAfterLegal:g.expeditions.car().fuel,cargoWood:g.expeditions.car().cargo.wood};
}
function supplyReload(observe=false){
 const g=start();nearby(g);assert.equal(g.frontier.board(),true);actualReload(g);g.player.carry.wood=1.25;
 const record=()=>({bag:copy(g.player.carry),cargo:copy(g.expeditions.car().cargo),fuel:g.expeditions.car().fuel,reload:g.player.reload}),before=record(),deposit=g.fieldSupplies.transfer('car','wood','deposit',1.25),withdraw=g.fieldSupplies.transfer('car','fuel','withdraw',1.5),after=record();
 if(observe)return{scenario:'supply-reload',before,deposit,withdraw,after};
 assert.equal(deposit.ok,false);assert.equal(withdraw.ok,false);assert.deepEqual(after,before,'SAC & RELAIS ne contourne pas le refus de manipulation pendant une recharge.');
 for(let i=0;i<40&&g.player.reload>0;i++)g.update(.04);assert.equal(g.player.reload,0);
 assert.deepEqual(g.fieldSupplies.transfer('car','wood','deposit',1.25),{ok:true,amount:1.25});assert.deepEqual(g.fieldSupplies.transfer('car','fuel','withdraw',1.5),{ok:true,amount:1.5});assert.equal(g.expeditions.car().cargo.wood,1.25);assert.equal(g.expeditions.car().cargo.fuel,.5);assert.equal(g.player.carry.wood,0);assert.equal(g.player.carry.fuel,1.5);persist(g);
 return{scenario:'supply-reload',status:'passed',browser:false,before,deposit,withdraw,after,cargoAfterLegal:copy(g.expeditions.car().cargo),bagAfterLegal:copy(g.player.carry)};
}
function paidLock(observe=false){
 const g=start(),C=globalThis.DeadwallCore,S=globalThis.DeadwallFrontierSurvey,w=g.frontier.world(),vp=g.worldEvolution.vehicleProfile();let chosen;
 for(const site of w.pois){for(const o of site.parking){if(!g.interventions134.blocksLoot(o))continue;for(let d=1.25;d<3;d+=.3){for(let i=0;i<24;i++){const p={x:o.x+Math.cos(i*Math.PI/12)*d,y:o.y+Math.sin(i*Math.PI/12)*d,z:0,inside:null};if(w.blocked(p.x,p.y,.32,0,null)||!S.targets(w,p,{},C.InterventionRules134.reach).some(v=>v.id===o.id))continue;
 for(let j=0;j<24;j++){const a=j*Math.PI/12,v={x:p.x+Math.cos(a)*3.7,y:p.y+Math.sin(a)*3.7,a};if(w.vehicleClear(v.x,v.y,a,vp.w,vp.h)&&w.line(p,v,0,null,null,.05)){chosen={site,o,p,v};break;}}if(chosen)break;}if(chosen)break;}if(chosen)break;}if(chosen)break;}
 assert.ok(chosen,'Un verrou réel et un véhicule peuvent être approchés sans collision.');stage(g,chosen.p,false,chosen.v,chosen.site);g.player.carry=C.makeBag({scrap:18,fuel:3,wood:1.25});assert.equal(g.interventions134.begin(chosen.o.id).ok,true);const cost=C.InterventionRules134.lock.cost;
 assert.equal(g.player.carry.scrap,18-(cost.scrap||0));const before={position:g.frontier.position(),bag:copy(g.player.carry),cargo:copy(g.expeditions.car().cargo),fuel:g.expeditions.car().fuel,session:copy(g.interventions134.view().session),attempts:copy(g.interventions134.snapshot().attempts)};
 const transferAccepted=g.frontier.transfer(),refuelAccepted=g.frontier.refuel(),boardAccepted=g.frontier.board(),after={position:g.frontier.position(),bag:copy(g.player.carry),cargo:copy(g.expeditions.car().cargo),fuel:g.expeditions.car().fuel,session:copy(g.interventions134.view().session),attempts:copy(g.interventions134.snapshot().attempts)};
 if(observe)return{scenario:'paid-lock',id:chosen.o.id,cost,before,boardAccepted,transferAccepted,refuelAccepted,after};
 assert.equal(boardAccepted,false);assert.equal(transferAccepted,false);assert.equal(refuelAccepted,false);assert.deepEqual(after,before,'Tentative payée maintenue sans mouvement du stock ou perte de contexte.');assert.equal(g.interventions134.cancel(),true);assert.deepEqual(g.player.carry,before.bag,'Annuler conserve le coût déjà engagé.');assert.equal(g.frontier.refuel(),true);assert.equal(g.expeditions.car().fuel,15);persist(g);assert.equal(g.interventions134.snapshot().attempts[chosen.o.id],1);
 return{scenario:'paid-lock',status:'passed',browser:false,id:chosen.o.id,cost,before,boardAccepted,transferAccepted,refuelAccepted,after,paidOnce:1};
}
function stairsCare(){
 const g=start(),C=globalThis.DeadwallCore,G=globalThis.DeadwallFrontierGeometry,w=g.frontier.world();let chosen;
 for(const site of w.pois.filter(p=>p.levels.includes(0)&&p.levels.includes(1))){const pad=w.plan(site,0).stairs[0];if(!pad)continue;const q=G.global(site,pad.x+pad.w/2,pad.y+pad.h/2);if(!w.blocked(q.x,q.y,.32,0,site.id)&&!w.blocked(q.x,q.y,.32,1,site.id)){chosen={site,q};break;}}
 assert.ok(chosen);const raw=g.serialize();Object.assign(raw.frontier,{active:true,...chosen.q,z:0,inside:chosen.site.id,car:null,anchor:{x:raw.player.x,y:raw.player.y}});if(!raw.frontier.seen.includes(chosen.site.id))raw.frontier.seen.push(chosen.site.id);
 for(const near of w.nearPOI(chosen.q.x,chosen.q.y,150))for(let i=0;i<w.threatCount(near);i++){raw.frontier.enemies[near.id+':e'+i]=0;delete raw.frontier.tracks[near.id+':e'+i];}raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
 assert.equal(g.restoreSave(raw),true);g.player.health=50;g.player.carry=C.makeBag({medicine:20,food:10});const bag=copy(g.player.carry),point=g.frontier.position();assert.equal(g.fieldSupplies.begin('heal').ok,true);assert.equal(g.frontier.stairs(1),false,'Le bouton de changement d’étage refuse une opération de terrain en cours.');assert.deepEqual(g.frontier.position(),point);assert.equal(g.fieldSupplies.busy(),true);
 g.input.pressed.add('PageUp');g.update(.04);g.input.pressed.clear();assert.equal(g.fieldSupplies.busy(),false,'La commande de déplacement interrompt le pansement avant la montée.');assert.equal(g.frontier.position().z,1);assert.equal(g.player.health,50);assert.deepEqual(g.player.carry,bag,'L’opération interrompue ne consomme rien et ne soigne pas.');persist(g);assert.equal(g.frontier.stairs(-1),true);assert.equal(g.frontier.position().z,0);
 return{scenario:'stairs-care',status:'passed',browser:false,controlOnly:true,site:chosen.site.id,firstRefused:true,keyboardInterruptThenStairs:true,health:g.player.health,bag};
}
function supplyMounted(observe=false){
 const g=start(),doc=globalThis.document,C=globalThis.DeadwallCore,core=g.core();let tower;
 for(let dy=-7;dy<=7&&!tower;dy++)for(let dx=-7;dx<=7;dx++){
  if(!g.world.placement(C.BUILDINGS.watchtower,core.gx+dx,core.gy+dy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'watchtower',core.gx+dx,core.gy+dy,0,1);g.world.add(b);const p=g.fieldcraft.service(g.player,b);
  if(p){Object.assign(g.player,p);if(g.arsenal134.preview('craft','plank').ok){g.refreshMetrics(true);assert.equal(g.fieldcraft.control(b),true);tower=b;break;}}
  g.world.remove(b);
 }
 assert.ok(tower,'Mirador contrôlable sur un accès physique commun au dépôt.');assert.equal(g.workerCanWorkAt(g.player,core,125),true);
 g.resources.scrap=20;g.player.carry.scrap=0;g.fieldSuppliesUI.open();assert.equal(g.fieldcraft.context().mounted,tower.id,'Ouvrir le dossier conserve le poste contrôlé.');
 const endpoint=doc.getElementById('supplyEndpoint'),quantity=doc.getElementById('supplyQuantity'),button=doc.getElementById('supplyWithdraw-scrap');assert.ok(endpoint&&quantity&&button&&doc.body.contains(button));endpoint.value='depot';quantity.value='1';g.fieldSuppliesUI.refresh(true);
 const quote=g.fieldSupplies.previewTransfer('depot','scrap','withdraw',1);assert.equal(quote.ok,false);assert.match(quote.reason,/poste de tir/);assert.equal(button.disabled,true,'Le vrai bouton signale les mains occupées avant tout clic.');assert.equal(button.title,quote.reason);assert.equal(button.getAttribute('aria-description'),quote.reason);
 const ui={disabled:button.disabled,title:button.title,description:button.getAttribute('aria-description')},before={bag:g.player.carry.scrap,stock:g.resources.scrap,mounted:g.fieldcraft.context().mounted};
 const conservation=()=>({bag:copy(g.player.carry),stock:copy(g.resources),mounted:g.fieldcraft.context().mounted,deposited:g.depositedResources}),untouched=conservation(),message=g.fieldSupplies.overview().message;
 button.click();assert.deepEqual(conservation(),untouched,'Le clic du bouton désactivé ne consomme rien et conserve le poste.');assert.equal(g.fieldSupplies.overview().message,message,'Le bouton désactivé ne lance pas la transaction.');
 const refused=g.fieldSupplies.transfer('depot','scrap','withdraw',1);assert.deepEqual(refused,{ok:false,reason:quote.reason},'L’API refuse aussi une manipulation directe pendant le contrôle du poste.');assert.deepEqual(conservation(),untouched);
 const after={bag:g.player.carry.scrap,stock:g.resources.scrap,mounted:g.fieldcraft.context().mounted};
 if(observe)return{scenario:'supply-mounted',before,after,ui,refused,button:'supplyWithdraw-scrap',endpoint:endpoint.value,quantity:quantity.value};
 assert.deepEqual(after,before,'Le panneau historique ne manipule aucun stock lorsque les mains servent le poste.');
 g.showCommand(false);assert.equal(g.fieldcraft.control(),true);assert.equal(g.fieldcraft.context().mounted,null);g.fieldSuppliesUI.open();endpoint.value='depot';quantity.value='1';g.fieldSuppliesUI.refresh(true);assert.equal(button.disabled,false);button.click();assert.equal(g.player.carry.scrap,1);assert.equal(g.resources.scrap,19,'Une seule unité passe après libération du poste.');g.showCommand(false);persist(g);assert.equal(g.player.carry.scrap,1);assert.equal(g.resources.scrap,19);assert.equal(g.fieldcraft.context().mounted,null);
 return{scenario:'supply-mounted',status:'passed',browser:false,before,after,ui,refused,button:'supplyWithdraw-scrap',endpoint:'depot',quantity:1,afterLegal:{bag:g.player.carry.scrap,stock:g.resources.scrap,mounted:g.fieldcraft.context().mounted}};
}
const scenarios={'refuel-driving':refuelDriving,'board-reload':boardReload,'material-reload':materialReload,'supply-reload':supplyReload,'paid-lock':paidLock,'stairs-care':stairsCare,'supply-mounted':supplyMounted};module.exports={scenarios};
if(require.main===module){try{const name=process.argv[2];if(!scenarios[name])throw Error('Scénario inconnu '+name);process.stdout.write(JSON.stringify(scenarios[name](process.argv.includes('--observe')))+'\n');}catch(error){console.error(error.stack);process.exitCode=1;}}
