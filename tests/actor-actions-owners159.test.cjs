'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),C=require('../src/core.js'),G=require('../src/frontier-geometry.js');

function fresh(ids=[]){
 const {game:g}=bootGame();g.startNew('standard','17117');g.worldEvolution.enableWorld4();g.population=10;g.resources.food=100;g.phaseTime=9999;
 for(const id of ids)assert.equal(g.worldEvolution.assignCompanion(id),true);
 Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);
 return g;
}
const tick=(g,n=1)=>{for(let i=0;i<n;i++)g.update(.05);};
function capture(g){const calls=[],old=g.recordActorAction159.bind(g);g.recordActorAction159=(actor,action,seconds,options)=>{calls.push({actor:{...actor},action,seconds,options});return old(actor,action,seconds,options);};return calls;}
function encounter(g){
 const w=g.frontier.world();let place,point;
 for(const p of w.pois){if(!w.threatCount(p))continue;
  for(let y=1;y<p.h-1&&!point;y+=.75)for(let x=1;x<p.w-1&&!point;x+=.75){const q=G.global(p,x,y);if(!w.blocked(q.x,q.y,.5,0,p.id)){place=p;point=q;}}
  if(point)break;
 }
 assert.ok(point,'Prepared encounter has real accessible ground geometry');const raw=g.serialize();Object.assign(raw.frontier,point,{z:0,inside:place.id,seen:[place.id]});g.restoreSave(raw);tick(g);
 const e=g.frontier.contacts().find(e=>e.z===0);assert.ok(e);const p=g.frontier.position();let near;
 for(let i=0;i<16&&!near;i++){const a=i*Math.PI/8,q={x:p.x+Math.cos(a)*.55,y:p.y+Math.sin(a)*.55};if(!w.blocked(q.x,q.y,C.FrontierTacticsRules.enemyRadius,0,e.poi)&&w.line(q,p,0,e.poi,null,.015))near=q;}
 assert.ok(near);for(const other of g.frontier.contacts())if(other!==e){other.x=p.x+30;other.y=p.y+30;other.cool=1.15;}
 Object.assign(e,near,{cool:0,a:Math.atan2(p.y-near.y,p.x-near.x)});return e;
}

test('159 regional hits: the physical enemy records an attack only after useful damage, and loaded cooldowns invent no gesture',()=>{
 const g=fresh(),e=encounter(g),calls=capture(g),health=g.player.health;
 g.player.invulnerable=2;g.updatePlayer(.04);assert.equal(g.player.health,health);assert.equal(calls.filter(c=>c.action==='attack').length,0);
 e.cool=0;g.player.invulnerable=0;g.updatePlayer(.04);assert.ok(g.player.health<health);const hit=calls.find(c=>c.action==='attack');assert.ok(hit);assert.equal(hit.actor.visualActionOwner159,'region:'+e.id);assert.equal(hit.seconds,e.biomeProfile?.interval??1.15);
 const painted={id:G.hash(e.id),visualActionOwner159:'region:'+e.id};assert.equal(g.actorActionPresentation159(painted).action,'attack');
 const raw=g.serialize();g.restoreSave(raw);assert.equal(g.actorActionPresentation159(painted),null,'A cooldown is gameplay state, not an observed new hit');
});

test('159 regional damage result: invulnerability rejects the hit while a real health decrease is reported',()=>{
 const g=fresh();g.player.health=60;g.player.invulnerable=1;assert.equal(g.frontier.damage(8),false);assert.equal(g.player.health,60);
 g.player.invulnerable=0;assert.equal(g.frontier.damage(8),true);assert.equal(g.player.health,52);
});

test('159 Samir: the heal gesture requires useful health gain and finite medicine consumption, and pause does not create new work',()=>{
 const g=fresh(['samir']);tick(g,3);const calls=capture(g);g.player.health=60;g.player.carry.medicine=2;
 const before=g.player.health,medicine=g.player.carry.medicine;tick(g,2);assert.ok(g.player.health>before);assert.ok(g.player.carry.medicine<medicine);
 const event=calls.find(c=>c.actor.visualActionOwner159==='companion:samir'&&c.action==='heal');assert.ok(event);assert.equal(event.options.continuous,true);
 assert.ok(Math.abs(medicine-g.player.carry.medicine-(g.player.health-before)*C.WorldEvolution.RULES.companionRules.medicinePerHealth)<1e-9);
 calls.length=0;g.paused=true;tick(g,2);assert.equal(calls.length,0);g.paused=false;g.player.carry.medicine=0;tick(g,2);assert.equal(calls.some(c=>c.action==='heal'),false);
});

test('159 Malik: a failed shot emits no action, and a successful shot uses the real hit direction while paying its existing ammunition',()=>{
 const g=fresh(['malik']),e=encounter(g);g.player.invulnerable=20;g.player.carry.ammo=0;tick(g,2);const calls=capture(g);tick(g);assert.equal(calls.some(c=>c.action==='shoot'),false);
 const companion=g.worldEvolution.overview().companions.find(c=>c.id==='malik'),f=g.frontier.position(),w=g.frontier.world();let position;
 for(let i=0;i<16&&!position;i++){const a=i*Math.PI/8,q={x:companion.x+Math.cos(a)*3,y:companion.y+Math.sin(a)*3};if(!w.blocked(q.x,q.y,.3,0,e.poi)&&w.line(companion,q,0,e.poi,null,.015)&&Math.hypot(q.x-f.x,q.y-f.y)>1.1)position=q;}
 assert.ok(position);Object.assign(e,position,{cool:1.15,hp:60});g.player.carry.ammo=3;const ammo=g.player.carry.ammo;tick(g);
 const shot=calls.find(c=>c.action==='shoot'&&c.actor.visualActionOwner159==='companion:malik');assert.ok(shot);assert.equal(ammo-g.player.carry.ammo,C.WorldEvolution.RULES.companionRules.shotAmmo);assert.ok(e.hp<60);
 const after=g.worldEvolution.overview().companions.find(c=>c.id==='malik');assert.ok(Math.abs(shot.options.facing-Math.atan2(e.y-after.y,e.x-after.x))<.1,'The action faces the target hit, not the commandant');
});

test('159 vehicle and Ines: damage is reported on the real car, then repair requires its finite scrap and faces its physical edge',()=>{
 const {game:g}=bootGame();g.startNew('standard','17117');g.worldEvolution.enableWorld4();g.population=10;g.resources.food=100;assert.equal(g.worldEvolution.assignCompanion('ines'),true);
 g.world.add(new(g.core().constructor)(g.nextId++,'expeditionGarage',77,65,0,1));g.refreshMetrics(true);g.fieldcraft.setup();g.resources.wood=g.resources.scrap=300;
 const {standAt}=require('./helpers/physical-fixtures.cjs');standAt(g,g.player,g.core());assert.equal(g.expeditions.buildCar().ok,true);const car=g.expeditions.car();g.player.x=car.x+35;g.player.y=car.y;assert.equal(g.expeditions.board().ok,true);
 car.x=g.player.x=4058;car.y=g.player.y=2048;assert.equal(g.frontier.enter(),true);g.player.invulnerable=0;const health=g.player.health,before=car.health;
 assert.equal(g.frontier.damage(20),true);assert.ok(car.health<before);assert.equal(g.player.health,health,'Vehicle impact does not invent a wound on its passenger');
 assert.equal(g.frontier.board(),true);g.player.carry.scrap=2;const calls=capture(g),damaged=car.health,scrap=g.player.carry.scrap;tick(g,5);
 assert.ok(car.health>damaged);assert.ok(g.player.carry.scrap<scrap);assert.ok(calls.some(c=>c.action==='repair'&&c.actor.visualActionOwner159==='companion:ines'));
 assert.ok(Math.abs(scrap-g.player.carry.scrap-(car.health-damaged)*C.WorldEvolution.RULES.companionRules.scrapPerHealth)<1e-9);
 calls.length=0;g.player.carry.scrap=0;tick(g,3);assert.equal(calls.some(c=>c.action==='repair'),false);
});
