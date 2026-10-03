'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let env,C;
test.before(()=>{env=bootDocument134();C=globalThis.DeadwallCore;});
function start(){const {g}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;g.player.carry=C.makeBag({wood:18,scrap:7,food:4,medicine:2});return env;}
function step(g,seconds){for(let i=0;i<Math.round(seconds/.04);i++)g.survivalPack.step(.04);}
function installCamp(g,doc){const core=g.core();let found=false;
 for(let dy=-160;dy<=160&&!found;dy+=20)for(let dx=-160;dx<=160&&!found;dx+=20){g.player.x=core.x+dx;g.player.y=core.y+dy;if(!g.expeditions.carClear(g.player.x,g.player.y)||!g.playerOps131.preview('ammo').ok)continue;for(let a=0;a<16&&!found;a++){g.player.facing=a*Math.PI/8;found=g.survivalPack.preview('camp').ok;}}
 assert.ok(found,'Une vraie place libre partage les accès du dépôt et de la halte');g.expansionUI.open('survival');const b=doc.getElementById('expansionAction-survival-camp');assert.equal(b.disabled,false);b.click();step(g,C.SurvivalPackRules.camp.seconds);assert.equal(g.survivalPack.snapshot().camps.length,1);assert.equal(g.player.carry.wood,6);assert.equal(g.player.carry.scrap,1);
}
test('survie : une commande de démontage ancienne respecte l’intervention déjà engagée et ne retire ni camp ni fournitures',()=>{
 const {g,doc}=start();installCamp(g,doc);g.expansionUI.open('survival');const button=doc.getElementById('expansionAction-survival-dismantle');assert.equal(button.disabled,false);assert.equal(g.playerOps131.begin('ammo').ok,true);assert.equal(g.expansions.busy('survival'),true);
 const before=g.survivalPack.snapshot(),bag={...g.player.carry};button.click();assert.deepEqual(g.survivalPack.snapshot(),before);assert.deepEqual(g.player.carry,bag);assert.equal(button.disabled,true);assert.match(doc.getElementById(button.id+'-reason').textContent,/intervention|libre/i);assert.equal(g.survivalPack.dismantle().ok,false);assert.equal(g.playerOps131.busy(),true);
 g.playerOps131.cancel();g.expansionUI.refresh(true);assert.equal(button.disabled,false);button.click();assert.equal(g.survivalPack.snapshot().camps.length,0);assert.deepEqual(g.player.carry,bag,'Démonter à pied ne rembourse pas les fournitures usagées');
});
test('survie : le vrai véhicule interdit le démontage depuis le siège, puis une sortie physique permet la manipulation',()=>{
 const {g,doc}=start();installCamp(g,doc);const save=g.serialize(),id=g.nextId++;save.nextId=g.nextId;save.expeditions.vehicle={id,x:g.player.x,y:g.player.y,health:320,fuel:1,angle:0,driving:false,cargo:C.makeBag()};assert.equal(g.restoreSave(save),true);assert.equal(g.expeditions.board().ok,true);assert.equal(g.expeditions.driving(),true);
 const before=g.survivalPack.snapshot(),bag={...g.player.carry};g.expansionUI.open('survival');const button=doc.getElementById('expansionAction-survival-dismantle');assert.equal(button.disabled,true);assert.equal(g.survivalPack.dismantle().ok,false);assert.deepEqual(g.survivalPack.snapshot(),before);assert.deepEqual(g.player.carry,bag);
 g.expansionUI.close();assert.equal(g.expeditions.board().ok,true);assert.equal(g.expeditions.driving(),false);const camp=g.survivalPack.snapshot().camps[0];Object.assign(g.player,{x:camp.x,y:camp.y});assert.equal(g.survivalPack.dismantle().ok,true);assert.deepEqual(g.player.carry,bag);
});
test('survie : un pansement rompu par les dégâts annonce sa perte une seule fois et ne restitue ni soin ni médicament',()=>{
 const {g}=start();g.player.health=50;assert.equal(g.survivalPack.begin('dressing').ok,true);step(g,C.SurvivalPackRules.dressing.seconds);step(g,2);assert.equal(g.player.carry.medicine,0);assert.ok(g.survivalPack.snapshot().dressing.remaining>0);
 const notifications=[],notify=g.notify;g.notify=(message,tone)=>{notifications.push({message,tone});return notify.call(g,message,tone);};try{g.damagePlayer(4);const hurt=g.player.health;step(g,.04);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0});assert.match(g.survivalPack.overview().summary,/Pansement interrompu/);assert.equal(notifications.filter(n=>/Pansement interrompu/.test(n.message)).length,1);step(g,30);assert.equal(g.player.health,hurt);assert.equal(g.player.carry.medicine,0);assert.equal(notifications.filter(n=>/Pansement interrompu/.test(n.message)).length,1);}finally{g.notify=notify;}
});
test('survie : le dossier affiche l’état réel du sac et le sol appliqué, sans modifier une campagne locale ou régionale',()=>{
 const {g,doc}=start();g.player.health=80;g.player.stamina=25;g.expansionUI.open('survival');let rows=g.survivalPack.overview().rows;assert.match(rows.find(r=>r.label==='Santé').value,/80.*100/);assert.match(rows.find(r=>r.label==='Endurance').value,/25.*100/);assert.match(rows.find(r=>r.label==='Fournitures du sac').value,/2 médicaments/);assert.ok(doc.getElementById('expansionDetail').querySelectorAll('dd').some(n=>n.textContent.includes('80 / 100')));assert.match(g.survivalPack.actions().find(a=>a.id==='dressing').description,/18.*30/);g.expansionUI.close();
 Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);g.expansionUI.open('survival');const f=g.frontier.position(),ground=g.worldEvolution.surface(f),saved=g.serialize();delete saved.timestamp;
 for(let i=0;i<6;i++)g.expansionUI.refresh(true);rows=g.survivalPack.overview().rows;const soil=rows.find(r=>r.label==='Sol parcouru').value;assert.ok(soil.includes(ground.name));assert.ok(soil.includes(Math.round(ground.speed*100)+' %'));assert.ok(soil.includes(Math.round(ground.noise*100)+' %'));assert.ok(rows.find(r=>r.label==='Carte & milieu').value.includes(String(g.world.seed)));const after=g.serialize();delete after.timestamp;assert.deepEqual(after,saved,'Lire les conséquences du milieu ne soigne pas, ne consomme rien et ne révèle aucun lieu');
});
