'use strict';
// Cité autonome (bible §7.15, direction 1) : pendant une sortie régionale, D-17 est simulée en entier.
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
const H=require('./helpers/vertical180.cjs');
const C=require('../src/core.js'),V=require('../src/vertical-citadel175.js'),Q=C.VerticalSiege176,R=C.VerticalCitadel175;
const clone=o=>JSON.parse(JSON.stringify(o));
function boot(){const {game:g}=boot127();V.install(g);g.startNew('standard','17117');const d=g.serialize();d.urban.peakScore=2200;d.urban.progression151={version:1,age:10};d.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:3000,medicine:50};assert.equal(g.restoreSave(d),true);return g;}
function support(g,type='rampart12'){
 for(let x=38;x<85;x+=2)for(let y=38;y<85;y+=2)if(g.world.placement(C.BUILDINGS[type],x,y,0).valid){assert.equal(g.placeOne(type,x,y),true);const b=g.world.atCell(x,y);b.progress=1;b.health=b.maxHealth;g.refreshMetrics(true);Object.assign(g.player,g.vertical175.entrance(b));return b;}throw Error('No native support footprint');
}
function climbTime(g,t){for(let n=0;n<t-1e-6;n+=.1){g.updateZombies(Math.min(.1,t-n));g.rebuildBuckets();}}
function verticalTime(g,t){for(let n=0;n<t-1e-6;n+=.1)g.vertical175.step(Math.min(.1,t-n));}
function spawn(g,b,kind='runner'){g.spawnZombie(kind);const z=g.zombies.at(-1);z.x=b.x;z.y=b.top-R.tile;z.lastX=z.x;z.lastY=z.y;g.rebuildBuckets();return z;}
function pressure(b){b.corpseLoad=R.bases[b.type].height*Q.loadPerMetre/Q.corpseFaceShare+100;}
// The Commander really crosses the limit: same exit, same save, same absence flag as in play.
function leave(g){g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter(),'sortie régionale');assert.equal(g.frontier.active(),true);assert.equal(g.player.regionAbsent,true);}
const texts=g=>g.notifications.map(n=>n.text);

test('216 un grimpeur natif progresse jusqu’au chemin de ronde pendant l’absence, sans apparition ni crédit',()=>{
 const g=boot(),b=support(g);leave(g);const z=spawn(g,b);pressure(b);
 const count=g.zombies.length,id=z.id,resources=clone(g.resources),health=g.player.health;
 climbTime(g,1);const p=g.vertical175.enemyPose(z);assert.equal(p.stage,'climb');assert.ok(p.z>0&&p.z<12);
 climbTime(g,10);assert.equal(g.vertical175.enemyPose(z).stage,'roof');assert.equal(g.vertical175.enemyPose(z).z,12);
 assert.equal(g.zombies.length,count);assert.equal(z.id,id);assert.deepEqual(g.resources,resources);assert.equal(g.player.health,health);
 assert.equal(g.frontier.active(),true);
});

test('216 la première arrivée sur le chemin de ronde est annoncée une fois par les notifications existantes',()=>{
 const g=boot(),b=support(g);leave(g);pressure(b);
 const first=spawn(g,b),second=spawn(g,b);second.x=b.x+64;g.rebuildBuckets();
 const before=texts(g).length;climbTime(g,1);
 assert.equal(g.vertical175.snapshot().climbers.length,2);assert.ok(first&&second);
 const added=g.notifications.slice(before).filter(n=>/chemin de ronde/.test(n.text));
 assert.equal(added.length,1);assert.equal(added[0].tone,'danger');assert.match(added[0].text,/^D-17 : /);
 assert.ok(g.ui.notifications.children.some(n=>n.textContent===added[0].text),'même pile d’alertes que le reste du HUD');
});

test('216 présent dans D-17, le Commandant ne reçoit pas cette annonce d’absence',()=>{
 const g=boot(),b=support(g),z=spawn(g,b);pressure(b);const before=texts(g).length;climbTime(g,1);
 assert.equal(g.vertical175.enemyPose(z).stage,'climb');assert.equal(g.notifications.slice(before).filter(n=>/chemin de ronde/.test(n.text)).length,0);
});

test('216 sauvegarde et reprise en pleine ascension pendant l’absence conservent position, altitude et absence',()=>{
 const g=boot(),b=support(g);leave(g);const z=spawn(g,b);pressure(b);climbTime(g,2);
 const d=clone(g.serialize()),before=g.vertical175.enemyPose(z),position={x:z.x,y:z.y},resources=clone(g.resources);
 assert.equal(d.frontier.active,true);assert.equal(d.expansions127.modules.vertical175.actor,null);
 assert.equal(g.restoreSave(d),true);assert.equal(g.frontier.active(),true);assert.equal(g.player.regionAbsent,true);
 const restored=g.zombies.find(e=>e.id===z.id);assert.deepEqual(g.vertical175.enemyPose(restored),before);assert.deepEqual({x:restored.x,y:restored.y},position);assert.deepEqual(g.resources,resources);
 climbTime(g,1);assert.ok(g.vertical175.enemyPose(restored).z>before.z);
 const again=clone(g.serialize());assert.equal(g.restoreSave(again),true);
});

test('216 la pause et les fenêtres suspendent toujours le siège vertical, absence ou non',()=>{
 const g=boot(),b=support(g);leave(g);const z=spawn(g,b);pressure(b);climbTime(g,1);
 const before=clone(g.vertical175.snapshot().climbers),p={x:z.x,y:z.y};g.paused=true;climbTime(g,1);
 assert.deepEqual(g.vertical175.snapshot().climbers,before);assert.deepEqual({x:z.x,y:z.y},p);
});

test('216 un envahisseur de palier s’en prend aux équipements réels, jamais au Commandant absent',()=>{
 const g=boot(),b=support(g),q=g.vertical175.accessQuote(b.id);assert.equal(g.vertical175.access(b.id).ok,true);verticalTime(g,q.seconds+.1);
 assert.equal(g.vertical175.buildModule('quarters',0).ok,true);verticalTime(g,30);
 assert.equal(g.vertical175.access(b.id,-1).ok,true);verticalTime(g,15);assert.equal(g.vertical175.pose().z,0);
 leave(g);const m=g.vertical175.presentation().sites[0].decks[0].modules[0],hp=m.health,health=g.player.health;
 const z=spawn(g,b);pressure(b);climbTime(g,40);
 assert.equal(g.vertical175.enemyPose(z).stage,'roof');assert.ok(m.health<hp,'module réellement attaqué');assert.equal(g.player.health,health);
});

test('216 le personnel affecté rejoint son palier pendant l’absence ; les munitions sont déplacées, jamais créées',()=>{
 const g=H.boot(4);for(const n of g.world.nodes)n.harvest(n.amount);
 const b=H.build(g,'lookout2a177'),core=g.core(),u=g.createProtectedSurvivor('worker',core.x+90,core.y+15);assert.ok(u);
 g.player.x=core.x;g.player.y=core.y;const p=g.vertical175.population;assert.ok(p.assign(u.id,b.id,0).ok);
 leave(g);const ids=g.units.map(v=>v.id),ammo=g.resources.ammo;
 const duty=()=>p.presentation().find(m=>m.id===u.id)?.mode==='duty';
 for(let t=0;t<200&&!duty();t+=.1){g.updateUnits(.1);g.vertical175.step(.1);g.elapsed+=.1;}
 assert.ok(duty(),JSON.stringify(p.presentation()));
 assert.deepEqual(g.units.map(v=>v.id),ids);assert.equal(p.pose(u).z,R.bases.lookout2a177.height);
 assert.equal(g.resources.ammo+u.carry,ammo);
 // Orders still need the Commander in D-17.
 assert.equal(p.recall(u.id).ok,false);assert.equal(p.presentation().find(m=>m.id===u.id).recalled,false);
 assert.ok(g.restoreSave(clone(g.serialize())));assert.equal(g.frontier.active(),true);
});

test('216 le Commandant absent n’encombre aucun passage du personnel vertical',()=>{
 const g=H.boot(4);for(const n of g.world.nodes)n.harvest(n.amount);
 const b=H.build(g,'lookout2a177'),core=g.core(),u=g.createProtectedSurvivor('worker',core.x+90,core.y+15),p=g.vertical175.population;
 g.player.x=core.x;g.player.y=core.y;assert.ok(p.assign(u.id,b.id,0).ok);leave(g);
 // The absent body is not in D-17: parking its stale coordinates on the stair exit must block nobody.
 Object.assign(g.player,g.vertical175.entrance(b));
 const duty=()=>p.presentation().find(m=>m.id===u.id)?.mode==='duty';
 for(let t=0;t<200&&!duty();t+=.1){g.updateUnits(.1);g.vertical175.step(.1);g.elapsed+=.1;}
 assert.ok(duty(),JSON.stringify(p.presentation()));
});

// Les bandes errantes restent suspendues pendant l'absence : une cité des premiers âges, laissée
// le temps d'une sortie aux abords, tombait sans avoir subi une seule vague (parcours de terrain G11).
test('216 les bandes errantes ne frappent pas D-17 pendant l’absence ; leur calendrier attend le retour',()=>{
 const {game:g}=boot127();require('../src/visibility146.js').install(g);g.startNew('standard','17117');g.campaignIntro132?.skip?.();
 g.random=new C.Random(17117);g.daylight=()=>1;g.phase='calm';g.phaseTime=9999;leave(g);
 const ids=new Set(g.zombies.map(z=>z.id)),hordes=g.exploration125.wildHordes||0;
 assert.equal(g.exploration125.spawnWildHorde(),false,'aucune bande n’apparaît pendant l’absence');
 g.exploration125.wildNext=g.elapsed+.05;for(let i=0;i<5;i++)g.update(.05);
 assert.equal(g.exploration125.wildHordes||0,hordes);assert.equal(g.zombies.filter(z=>!ids.has(z.id)).length,0);
});

test('216 une alerte de D-17 émise pendant l’absence rejoint la pile de notifications affichée en région',()=>{
 const g=boot();leave(g);const before=g.ui.notifications.children.length;
 g.notify('Brèche au nord (Porte).','danger');
 const node=g.ui.notifications.children[0];assert.equal(node.textContent,'Brèche au nord (Porte).');assert.equal(node.dataset.tone,'danger');
 assert.ok(g.ui.notifications.children.length>=Math.min(4,before+1));assert.ok(!g.ui.notifications.classList?.contains?.('hidden'));
});
