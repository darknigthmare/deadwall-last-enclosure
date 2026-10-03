'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const {pose}=require('./helpers/navigation130.cjs');
const C=require('../src/core.js');

function fresh(){const env=boot131({ui:true}),g=env.g;g.phaseTime=999;standAt(g,g.player,g.core());g.player.invulnerable=0;return env;}
function prepare(g,kind){const q=g.playerOps131.preview(kind);assert.ok(q.ok,q.reason);assert.ok(g.playerOps131.begin(kind).ok);for(let i=0;i<Math.ceil(q.seconds/.04);i++)g.playerOps131.step(.04);assert.equal(g.playerOps131.busy(),false);}
function enter(g){g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());assert.equal(g.frontier.position().generation,5);}
function reload(g){g.startReload();assert.ok(g.player.reload>0);for(let i=0;i<100&&g.player.reload>0;i++)g.updatePlayer(.04);assert.equal(g.player.reload,0);}
function closeEnough(a,b){assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);}
function textTree(n){return n.textContent+' '+n.children.map(textTree).join(' ');}

// The map seed does not fix combat RNG. Exercise both live randomness and a
// real headshot/drop before checking that regional fire leaves the depot alone.
for(const clock of [null,87])test('QA04 : impacts produits par les vrais infectés locaux et régionaux entament le même gilet'+(clock===null?'':' (butin, horloge 87)'),()=>{
 const now=Date.now;
 try{
 if(clock!==null)Date.now=()=>clock;
 const {g}=fresh();prepare(g,'vest');g.units=[];assert.ok(g.spawnZombie('walker'));const z=g.zombies.at(-1);Object.assign(z,{x:g.player.x+25,y:g.player.y,attackCooldown:0});g.rebuildBuckets();
 const damage=C.ENEMIES.walker.damage*g.difficulty.enemyDamage;g.updateZombies(.04);closeEnough(g.player.health,100-damage*.7);closeEnough(g.playerOps131.snapshot().armor,45-damage*.3);
 g.player.facing=0;const magazine=g.player.magazine.pistol,hp=z.health;g.shootPlayer();g.updateProjectiles(.04);assert.equal(g.player.magazine.pistol,magazine-1);assert.ok(z.health<hp||z.dead,'le projectile local doit toucher');
 const depotAmmo=g.resources.ammo;
 if(clock===87){assert.equal(g.stats.headshots,1);assert.equal(g.stats.kills,1);assert.equal(depotAmmo,181,'le butin local réel ajoute une munition avant le voyage');}
 g.zombies=[];enter(g);g.update(.04);const enemy=g.frontier.contacts()[0],p=g.frontier.position();assert.ok(enemy);assert.equal(g.frontier.world().blocked(p.x+.65,p.y,.28,0,null),false);Object.assign(enemy,{x:p.x+.65,y:p.y,cool:0});
 g.player.invulnerable=0;const health=g.player.health,armor=g.playerOps131.snapshot().armor;g.updatePlayer(.04);closeEnough(g.player.health,health-8*.7);closeEnough(g.playerOps131.snapshot().armor,armor-8*.3);
 const regionalHp=enemy.hp;g.player.shootCooldown=0;g.input.mouseX=g.width/2+100;g.input.mouseY=g.height/2;g.input.mouseDown=true;g.updatePlayer(.04);g.input.mouseDown=false;assert.ok(enemy.hp<regionalHp,'le projectile régional doit toucher');assert.equal(g.resources.ammo,depotAmmo,'le tir régional ne prélève pas les réserves du dépôt, butin compris');
 }finally{Date.now=now;}
});

test('QA04 : trois chargeurs régionaux, réserve épuisée, sac impair et retour physique sans recharge distante',()=>{
 const {g}=fresh();prepare(g,'ammo');enter(g);const stock=g.resources.ammo,w=C.WEAPONS.pistol,initialMagazine=g.player.magazine.pistol;let shots=0;
 for(let cycle=0;cycle<4;cycle++){
  const rounds=g.player.magazine.pistol;for(let i=0;i<rounds;i++){g.player.shootCooldown=0;assert.equal(g.frontier.shoot(),true);shots++;}
  if(cycle<3){reload(g);assert.equal(g.player.magazine.pistol,w.magazine);}else{g.startReload();assert.equal(g.player.reload,0);}
  assert.equal(g.resources.ammo,stock);
 }
 assert.equal(shots,initialMagazine+36);assert.equal(g.playerOps131.snapshot().reserve,0);g.updateUI();assert.equal(g.ui.weaponAmmo.textContent,'0 / 0');
 g.tier=C.CITY_TIERS[2];g.switchWeapon('shotgun');g.player.magazine.shotgun=0;g.player.carry.ammo=3;reload(g);assert.equal(g.player.magazine.shotgun,1);assert.equal(g.player.carry.ammo,1);assert.equal(g.resources.ammo,stock);
 g.player.magazine.shotgun=0;g.startReload();assert.equal(g.player.reload,0,'une unité ne suffit pas à une cartouche de fusil à pompe');
 pose(g,{x:C.AtlasRules.homeMax+.5,y:C.AtlasRules.center});assert.equal(g.frontier.leave(),true);assert.equal(g.playerOps131.reloadAvailable(),1);standAt(g,g.player,g.core());reload(g);assert.equal(g.player.magazine.shotgun,C.WEAPONS.shotgun.magazine);assert.equal(g.player.carry.ammo,0);assert.equal(g.resources.ammo,stock-15);
});

test('QA04 : la source du rechargement est revérifiée si le joueur quitte le dépôt pendant son animation',()=>{
 const {g}=fresh();prepare(g,'service');g.player.magazine.pistol=0;const stock=g.resources.ammo;g.startReload();assert.ok(g.player.reload>0);assert.equal(g.playerOps131.snapshot().care.pistol,7);
 enter(g);for(let i=0;i<100&&g.player.reload>0;i++)g.updatePlayer(.04);assert.equal(g.player.magazine.pistol,0);assert.equal(g.resources.ammo,stock);assert.equal(g.playerOps131.snapshot().care.pistol,7);
});

test('QA04 : visée quatre directions, postures C et course chargée restent cohérentes en région',()=>{
 const env=fresh(),{g,dispatchWindow}=env;prepare(g,'vest');enter(g);
 for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){g.input.mouseX=g.width/2+dx*100;g.input.mouseY=g.height/2+dy*100;g.updatePlayer(.04);closeEnough(g.frontier.position().a,Math.atan2(dy,dx));closeEnough(g.player.facing,Math.atan2(dy,dx));}
 for(const expected of ['crouch','prone','stand']){dispatchWindow('keydown',{code:'KeyC',target:document.body});g.handlePressed();g.input.pressed.clear();dispatchWindow('keyup',{code:'KeyC'});assert.equal(g.worldEvolution.posture().key,expected);g.player.stamina=80;const before=g.frontier.position();g.input.keys.add('KeyD');g.input.keys.add('ShiftLeft');g.updatePlayer(.04);g.input.keys.clear();assert.ok(g.frontier.position().x>before.x);closeEnough(g.player.stamina,expected==='stand'?80-.04*12*1.15:80+.04*7);}
});

test('QA04 : masses du DOM égales aux réserves réelles après dépenses, sans munitions copiées dans la grille',()=>{
 const {g,doc}=fresh();for(const kind of ['vest','tools','ammo'])prepare(g,kind);assert.equal(g.loadout.transfer('depot','sac','wood',4).amount,4);assert.equal(g.loadout.transfer('depot','sac','ammo',3).amount,3);
 const check=()=>{const bag=g.loadout.view('sac'),eq=g.loadout.equipment();assert.ok(g.loadoutUI.open());const expected=Number((bag.weight+bag.tare+eq.beltWeight+eq.personalWeight).toFixed(2)).toLocaleString('fr-FR');assert.match(doc.body.querySelector('.loadout-total').textContent,new RegExp('^'+expected.replace('.',String.raw`\.`)+' kg'));const personal=textTree(doc.body.querySelector('.loadout-personal'));assert.match(personal,/Gilet de fortune/);assert.equal([...bag.items,...bag.overflow].filter(x=>x.key==='ammo').reduce((n,x)=>n+x.quantity,0),g.player.carry.ammo);g.loadoutUI.close();};
 check();g.player.x=2812;g.player.y=2300;g.player.magazine.pistol=0;reload(g);const reduced=g.playerOps131.equipment();assert.equal(reduced.items.find(x=>x.id==='ammo').quantity,24);closeEnough(reduced.weight,4+1.8+.25+24*.02);check();
 const building=new(g.core().constructor)(g.nextId++,'woodWall',75,72,0,.1);g.world.add(building);g.fieldcraft.setup();standAt(g,g.player,building);for(const key of C.RESOURCE_KEYS)g.player.carry[key]=0;g.input.keys.add('KeyE');g.updateInteraction(.04);g.input.keys.clear();closeEnough(g.playerOps131.equipment().items.find(x=>x.id==='tools').kg,1.8*(30-.02)/30);check();
});

test('QA04 : rotation R de l’inventaire ne recharge pas et les raccourcis système ne pilotent pas le joueur',()=>{
 const {g,dispatchWindow}=fresh();g.player.carry.wood=1;g.player.magazine.pistol=0;assert.ok(g.loadoutUI.open());const item=g.loadoutUI.overlay.querySelector('.loadout-item'),before=g.loadout.view('sac').items[0].rotation;
 item.dispatch('keydown',{code:'KeyR'});dispatchWindow('keydown',{code:'KeyR',target:item});assert.equal(g.loadout.view('sac').items[0].rotation,1-before);assert.equal(g.player.reload,0);assert.equal(g.input.keys.size,0);g.loadoutUI.close();
 for(const modifier of ['ctrlKey','altKey','metaKey'])for(const code of ['KeyR','KeyD','Digit2'])dispatchWindow('keydown',{code,[modifier]:true,target:document.body});assert.equal(g.input.keys.size,0);assert.equal(g.input.pressed.size,0);assert.equal(g.player.reload,0);
 dispatchWindow('keydown',{code:'KeyR',target:document.body});g.handlePressed();assert.ok(g.player.reload>0);dispatchWindow('keyup',{code:'KeyR'});g.input.pressed.clear();
});

test('QA04 : une préparation lancée par le bouton Commandant rend la main puis cède au tir, à R et au changement d’arme',()=>{
 const {g,doc,dispatchWindow}=fresh();
 for(const action of ['fire','KeyR','Digit2']){
  g.player.reload=0;g.player.shootCooldown=0;g.tier=C.CITY_TIERS[2];g.player.magazine.pistol=5;g.player.weapon='pistol';standAt(g,g.player,g.core());g.releaseInputs();
  assert.ok(g.expansionUI.open('player131'));const button=doc.getElementById('expansionAction-player131-tools');assert.equal(button.disabled,false);const stock={...g.resources},shots=g.stats.shots;button.click();assert.equal(g.playerOps131.busy(),true);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
  if(action==='fire')g.canvas.dispatch('mousedown',{button:0,clientX:800,clientY:360,pointerType:'mouse'});else dispatchWindow('keydown',{code:action,target:document.body});
  g.update(.04);assert.equal(g.playerOps131.busy(),false);assert.equal(g.playerOps131.snapshot().tools,0);assert.equal(g.resources.scrap,stock.scrap);assert.equal(g.resources.wood,stock.wood);
  if(action==='fire'){assert.equal(g.stats.shots,shots+1);g.canvas.dispatch('mouseup',{button:0,pointerType:'mouse'});}else if(action==='KeyR')assert.ok(g.player.reload>0);else assert.equal(g.player.weapon,'rifle');
  g.releaseInputs();
 }
});

test('QA04 : pause réelle par inventaire, perte de focus, menu et décès en bord de tick ne terminent pas une préparation',()=>{
 const {g,dispatchWindow}=fresh();const stock={...g.resources};assert.ok(g.playerOps131.begin('tools').ok);g.playerOps131.step(.04);const progress=g.playerOps131.overview().task.progress;
 assert.ok(g.loadoutUI.open());for(let i=0;i<12;i++)g.loop(g.lastFrame+40);assert.equal(g.playerOps131.overview().task.progress,progress);assert.deepEqual(g.resources,stock);dispatchWindow('blur');g.loadoutUI.close();assert.equal(g.paused,true);for(let i=0;i<12;i++)g.loop(g.lastFrame+40);assert.equal(g.playerOps131.overview().task.progress,progress);
 g.returnToMenu();assert.equal(g.playerOps131.busy(),false);assert.deepEqual(g.resources,stock);
 g.startNew('standard','17117');g.phaseTime=999;standAt(g,g.player,g.core());assert.ok(g.playerOps131.begin('vest').ok);for(let i=0;i<249;i++)g.playerOps131.step(.04);g.player.dead=true;g.player.health=0;g.player.downTimer=.001;g.update(.04);assert.equal(g.player.dead,false,'réanimation dans ce même tick');assert.equal(g.playerOps131.busy(),false);assert.equal(g.playerOps131.snapshot().armor,0);assert.equal(g.resources.scrap,120);
});
