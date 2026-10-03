'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),P=require('../src/player-pack131.js'),R=C.Player131Rules;
function fresh(){const{game:g}=boot127();P.install(g);g.startNew('standard','17117');g.phaseTime=999;standAt(g,g.player,g.core());g.player.invulnerable=0;return g;}
function step(g,seconds){for(let i=0;i<Math.ceil(seconds/.04);i++)g.playerOps131.step(.04);}
function prepare(g,kind){const q=g.playerOps131.preview(kind);assert.ok(q.ok,q.reason);assert.ok(g.playerOps131.begin(kind).ok);step(g,q.seconds);assert.equal(g.playerOps131.busy(),false);}
function away(g){g.player.x=2812;g.player.y=2300;}
function installState(g,next){const raw=g.serialize();raw.expansions127.modules.player131={...P.initial(),...next};g.restoreSave(raw);}
test('joueur 1.31 : migration vide, quatre préparations et aucun cadeau à la reprise',()=>{
 const g=fresh();assert.deepEqual(g.playerOps131.snapshot(),P.initial());assert.equal(g.playerOps131.actions().length,4);
 const raw=g.serialize(),resources={...g.resources};delete raw.expansions127.modules.player131;g.restoreSave(raw);assert.deepEqual(g.playerOps131.snapshot(),P.initial());assert.deepEqual(g.resources,resources);
});
test('joueur 1.31 : préparations financées une seule fois après travail physique au dépôt',()=>{
 const g=fresh(),before={...g.resources};prepare(g,'vest');assert.equal(g.playerOps131.snapshot().armor,45);assert.equal(g.resources.scrap,before.scrap-18);assert.equal(g.resources.food,before.food-3);
 assert.equal(g.playerOps131.preview('vest').ok,false);prepare(g,'tools');assert.equal(g.resources.scrap,before.scrap-28);assert.equal(g.resources.wood,before.wood-6);assert.equal(g.playerOps131.snapshot().tools,30);assert.equal(g.playerOps131.preview('tools').ok,false);
});
test('joueur 1.31 : aucun assemblage distant, en véhicule, mort ou derrière un accès bloqué',()=>{
 const g=fresh();away(g);assert.equal(g.playerOps131.preview('vest').ok,false);standAt(g,g.player,g.core());g.player.dead=true;assert.equal(g.playerOps131.preview('vest').ok,false);g.player.dead=false;
 const old=g.workerCanWorkAt;g.workerCanWorkAt=()=>false;assert.equal(g.playerOps131.preview('vest').ok,false);g.workerCanWorkAt=old;
 g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());assert.equal(g.playerOps131.preview('ammo').ok,false);
});
test('joueur 1.31 : pause, commandement et interruptions conservent les matériaux',()=>{
 const g=fresh(),before={...g.resources};g.paused=true;g.activeOverlay=g.ui.commandModal;g.ui.commandModal.classList.remove('hidden');assert.ok(g.playerOps131.begin('vest').ok);step(g,20);assert.equal(g.playerOps131.overview().task.progress,0);
 g.paused=false;g.activeOverlay=null;g.ui.commandModal.classList.add('hidden');step(g,2);g.player.x+=8;step(g,.04);assert.equal(g.playerOps131.busy(),false);assert.deepEqual(g.resources,before);
 standAt(g,g.player,g.core());assert.ok(g.playerOps131.begin('vest').ok);g.player.health-=1;step(g,.04);assert.equal(g.playerOps131.busy(),false);assert.deepEqual(g.resources,before);
});
test('joueur 1.31 : actual update interrompt avant départ et ne termine aucun travail après décès',()=>{
 const g=fresh(),before={...g.resources};assert.ok(g.playerOps131.begin('service').ok);g.input.keys.add('KeyD');g.update(.04);assert.equal(g.playerOps131.busy(),false);assert.deepEqual(g.resources.scrap,before.scrap);
 g.input.keys.clear();standAt(g,g.player,g.core());assert.ok(g.playerOps131.begin('service').ok);g.player.dead=true;g.update(.04);assert.equal(g.playerOps131.busy(),false);assert.equal(g.playerOps131.snapshot().care.pistol,0);
});
test('joueur 1.31 : réduction réelle partielle des blessures locales, réserve finie et aucun soin',()=>{
 const g=fresh();prepare(g,'vest');g.player.health=100;g.damagePlayer(20);assert.equal(g.player.health,86);assert.equal(g.playerOps131.snapshot().armor,39);
 const armor=g.playerOps131.snapshot().armor;g.player.invulnerable=1;g.damagePlayer(20);assert.equal(g.player.health,86);assert.equal(g.playerOps131.snapshot().armor,armor);g.player.invulnerable=0;
 g.damagePlayer(200);assert.equal(g.player.health,0);assert.equal(g.player.dead,true);assert.equal(g.playerOps131.snapshot().armor,0);
});
test('joueur 1.31 : gilet raccordé aux dégâts des infectés régionaux et préserve invulnérabilité',()=>{
 const g=fresh();prepare(g,'vest');g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());g.player.invulnerable=0;g.player.health=100;
 g.frontier.damage(10);assert.equal(g.player.health,93);assert.equal(g.playerOps131.snapshot().armor,42);g.frontier.damage(10);assert.equal(g.player.health,93);assert.equal(g.playerOps131.snapshot().armor,42);
});
test('joueur 1.31 : gilet impose son effort supplémentaire seulement lors d’une vraie course',()=>{
 const g=fresh();prepare(g,'vest');away(g);g.player.stamina=80;g.input.keys.add('KeyD');g.input.keys.add('ShiftLeft');const before={x:g.player.x,stamina:g.player.stamina};g.updatePlayer(.04);
 assert.ok(g.player.x>before.x);assert.ok(before.stamina-g.player.stamina>1.1);g.input.keys.clear();g.updatePlayer(.04);assert.ok(g.player.stamina>78.85);
});
test('joueur 1.31 : entretien et rechargement actif ne créent ni munitions ni charges supplémentaires',()=>{
 const g=fresh();prepare(g,'service');const p=g.player,w=C.WEAPONS.pistol,before=g.resources.ammo;p.magazine.pistol=0;g.startReload();assert.ok(Math.abs(p.reload-w.reload*.85)<1e-8);assert.equal(g.playerOps131.snapshot().care.pistol,7);g.startReload();assert.equal(g.playerOps131.snapshot().care.pistol,7);
 p.reload=0;g.finishReload();assert.equal(p.magazine.pistol,w.magazine);assert.equal(g.resources.ammo,before-w.magazine*w.ammoPerReload);assert.equal(p.health,100);
});
test('joueur 1.31 : cartouchière conserve les munitions et recharge au loin sans puiser D-17',()=>{
 const g=fresh(),before=g.resources.ammo;prepare(g,'ammo');assert.equal(g.playerOps131.snapshot().reserve,36);assert.equal(g.resources.ammo,before-36);away(g);g.player.carry.ammo=2;g.player.magazine.pistol=0;
 const stock=g.resources.ammo,w=C.WEAPONS.pistol;assert.equal(g.playerOps131.reloadAvailable(),38);g.startReload();assert.ok(g.player.reload>0);g.player.reload=0;g.finishReload();assert.equal(g.player.magazine.pistol,w.magazine);assert.equal(g.resources.ammo,stock);assert.equal(g.playerOps131.snapshot().reserve,36-w.magazine*w.ammoPerReload);assert.equal(g.player.carry.ammo,2);
});
test('joueur 1.31 : réserve vide au loin bloque recharge malgré un dépôt plein',()=>{
 const g=fresh();away(g);g.player.magazine.pistol=0;g.resources.ammo=180;g.player.carry.ammo=0;g.startReload();assert.equal(g.player.reload,0);g.finishReload();assert.equal(g.player.magazine.pistol,0);assert.equal(g.resources.ammo,180);
 g.player.carry.ammo=3;g.startReload();assert.ok(g.player.reload>0);g.player.reload=0;g.finishReload();assert.equal(g.player.magazine.pistol,3/C.WEAPONS.pistol.ammoPerReload);assert.equal(g.player.carry.ammo,0);assert.equal(g.resources.ammo,180);
});
test('joueur 1.31 : prélèvement atomique, dépôt plafonné et réapprovisionnement sans duplication',()=>{
 const g=fresh();prepare(g,'ammo');const s=g.playerOps131.snapshot(),bag={...g.player.carry},stock={...g.resources};assert.equal(g.playerOps131.spendReload(NaN),false);assert.equal(g.playerOps131.spendReload(1e9),false);assert.deepEqual(g.playerOps131.snapshot(),s);assert.deepEqual(g.resources,stock);assert.deepEqual(g.player.carry,bag);
 g.resources.ammo=g.storage-5;assert.equal(g.playerOps131.storeAmmo().amount,5);assert.equal(g.resources.ammo,g.storage);assert.equal(g.playerOps131.snapshot().reserve,31);assert.equal(g.playerOps131.storeAmmo().ok,false);
});
test('joueur 1.31 : outils accélèrent seulement le vrai chantier manuel puis s’épuisent',()=>{
 const g=fresh();prepare(g,'tools');const b=new(g.core().constructor)(g.nextId++,'woodWall',75,72,0,.1);g.world.add(b);g.fieldcraft.setup();standAt(g,g.player,b);for(const k of C.RESOURCE_KEYS)g.player.carry[k]=0;
 const before=b.progress,work=R.tools.budget;g.input.keys.add('KeyE');g.updateInteraction(.04);assert.ok(Math.abs((b.progress-before)-.04*3.7*1.5/b.def.buildTime)<1e-8);assert.ok(Math.abs(g.playerOps131.snapshot().tools-(work-.02))<1e-8);
 g.input.keys.clear();g.updateInteraction(.04);assert.equal(g.playerOps131.snapshot().tools,work-.02);g.paused=true;g.input.keys.add('KeyE');g.updateInteraction(.04);assert.equal(g.playerOps131.snapshot().tools,work-.02);
});
test('joueur 1.31 : sauvegarde conserve réserves et usages, annule le travail puis refuse état malformé avant mutation',()=>{
 const g=fresh();prepare(g,'vest');prepare(g,'ammo');prepare(g,'service');const snapshot=g.playerOps131.snapshot();assert.ok(g.playerOps131.begin('tools').ok);step(g,1);const raw=g.serialize();g.restoreSave(raw);assert.equal(g.playerOps131.busy(),false);assert.deepEqual(g.playerOps131.snapshot(),snapshot);
 for(const next of [{armor:Infinity},{reserve:37},{tools:-1},{care:{pistol:9,rifle:0,shotgun:0}},{extra:true}]){const bad=g.serialize(),before=g.world;bad.expansions127.modules.player131={...bad.expansions127.modules.player131,...next};assert.throws(()=>g.restoreSave(bad));assert.equal(g.world,before);assert.deepEqual(g.playerOps131.snapshot(),snapshot);}
 g.startNew('standard','17118');assert.deepEqual(g.playerOps131.snapshot(),P.initial());
});
test('joueur 1.31 : équipement et masses proviennent des mêmes réserves, aucun état créé par aperçu',()=>{
 const g=fresh();prepare(g,'vest');prepare(g,'ammo');prepare(g,'tools');const s=g.playerOps131.snapshot(),stock={...g.resources},e=g.playerOps131.equipment();assert.equal(e.items.length,3);assert.ok(Math.abs(e.weight-(4+1.8+.25+36*.02))<1e-8);
 for(let i=0;i<10;i++){g.playerOps131.overview();g.playerOps131.actions();g.playerOps131.equipment();}assert.deepEqual(g.playerOps131.snapshot(),s);assert.deepEqual(g.resources,stock);
});
test('joueur 1.31 : une préparation bloque les autres systèmes puis se libère sans coût à l’annulation',()=>{
 const g=fresh();g.player.health=50;g.player.carry.medicine=4;assert.ok(g.playerOps131.begin('vest').ok);assert.equal(g.expansions.busy('survival'),true);assert.equal(g.survivalPack.preview('dressing').ok,false);g.playerOps131.cancel();assert.equal(g.expansions.busy('survival'),false);
});
test('joueur 1.31 : cartouchière partielle fixe son devis et ne vide aucun stock devenu insuffisant',()=>{
 const g=fresh();g.resources.ammo=5;assert.ok(g.playerOps131.begin('ammo').ok);g.resources.ammo=100;step(g,5);assert.equal(g.playerOps131.snapshot().reserve,5);assert.equal(g.resources.ammo,95);
 assert.ok(g.playerOps131.begin('ammo').ok);g.resources.ammo=2;step(g,5);assert.equal(g.playerOps131.snapshot().reserve,5);assert.equal(g.resources.ammo,2);assert.equal(g.playerOps131.busy(),false);
});
test('joueur 1.31 : huit entretiens maximum, même si les rechargements sont interrompus',()=>{
 const g=fresh();prepare(g,'service');const w=C.WEAPONS.pistol;g.player.magazine.pistol=0;
 for(let i=0;i<8;i++){g.startReload();assert.ok(Math.abs(g.player.reload-w.reload*.85)<1e-8);g.player.reload=0;}
 assert.equal(g.playerOps131.snapshot().care.pistol,0);g.startReload();assert.equal(g.player.reload,w.reload);assert.equal(g.player.magazine.pistol,0);
});
test('joueur 1.31 : dernière fraction des outils ne multiplie jamais le bonus et le mode pause ne consomme rien',()=>{
 const g=fresh();installState(g,{tools:.01});const b=new(g.core().constructor)(g.nextId++,'woodWall',75,72,0,.1);g.world.add(b);g.fieldcraft.setup();standAt(g,g.player,b);g.input.keys.add('KeyE');
 const before=b.progress;g.updateInteraction(.04);assert.ok(Math.abs((b.progress-before)-(.04+.01)*3.7/b.def.buildTime)<1e-8);assert.equal(g.playerOps131.snapshot().tools,0);
 const next=b.progress;g.updateInteraction(.04);assert.ok(Math.abs((b.progress-next)-.04*3.7/b.def.buildTime)<1e-8);
});
