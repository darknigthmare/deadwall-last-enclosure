'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),E=require('../src/earthworks217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const T=globalThis.DeadwallTactics||require('../src/tactics.js');
const R=C.Earthworks217Rules,ID='ditch217',TILE=C.TILE,root=path.join(__dirname,'..');
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-6,(message||'')+' : '+a+' ≠ '+b);

function campaign(){const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();return g;}
const state=g=>g.serialize().expansions127.modules.earthworks217;
function old(g){const data=JSON.parse(JSON.stringify(g.serialize()));delete data.expansions127.modules.earthworks217;assert.equal(g.restoreSave(data),true);return g;}
const watch=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const home=g=>{const core=g.core();return{x:C.grid(core.x),y:C.grid(core.y)};};
const run=(g,seconds,dt=.05)=>{for(let t=0;t<seconds-1e-9;t+=dt)g.update(dt);};
// Fossé déjà creusé, posé par la sauvegarde : le chemin d'une reprise ordinaire.
function withDitches(g,list){const data=JSON.parse(JSON.stringify(g.serialize()));data.expansions127.modules.earthworks217={version:1,active:true,ditches:list};assert.equal(g.restoreSave(data),true);return g;}
const dugAt=(x,y,fill=0)=>({x,y,dug:R.digSeconds,fill});
const entry=g=>[...g.ui.buildList.children].find(n=>n.dataset.buildId===ID)||null;
const showDefense=g=>{g.currentCategory='defense';g.refreshBuildMenu(true);};
// Un errant seul, loin des vivants et des ouvrages, au centre d'une case.
function walker(g,gx,gy){
  g.fronts=['north'];assert.notEqual(g.spawnZombie('walker'),false);const z=g.zombies.at(-1);
  z.x=z.lastX=gx*TILE+TILE/2;z.y=z.lastY=gy*TILE+TILE/2;return z;
}

test('travaux de terrain : règles gelées dans le cœur, état validé strictement',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.cost));
  assert.deepEqual(JSON.parse(JSON.stringify(R)),{unlockTier:0,cost:{wood:4},digSeconds:10,slowFactor:.55,flowCost:14,capacity:6,rimDistance:10,workRange:48,cityRadiusTiles:44,maxDitches:256});
  assert.ok(R.slowFactor>0&&R.slowFactor<1&&R.flowCost>0&&Number.isInteger(R.capacity)&&R.capacity>0);
  const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
  assert.equal(core.match(/C\.Earthworks217Rules=/g).length,1);
  assert.deepEqual(E.validate(undefined),{version:1,active:false,ditches:[]});assert.deepEqual(E.initial(),{version:1,active:false,ditches:[]});assert.deepEqual(E.fresh(),{version:1,active:true,ditches:[]});
  const ok={version:1,active:true,ditches:[{x:70,y:64,dug:R.digSeconds,fill:2.5},{x:71,y:64,dug:3,fill:0},{x:72,y:64,dug:R.digSeconds,fill:R.capacity}]};
  assert.deepEqual(E.validate(ok),ok);assert.notEqual(E.validate(ok).ditches[0],ok.ditches[0]);
  const one=d=>({version:1,active:true,ditches:[d]}),d={x:70,y:64,dug:R.digSeconds,fill:1};
  for(const bad of [null,[],'fossé',{},{version:1,active:true},{...ok,version:2},{...ok,active:1},{...ok,extra:1},{...ok,ditches:{}},{...ok,active:false},
    one(null),one([]),one({x:70,y:64,dug:1}),one({...d,extra:1}),one({...d,x:70.5}),one({...d,x:0}),one({...d,y:C.WORLD_TILES-2}),one({...d,x:'70'}),
    one({...d,dug:-1}),one({...d,dug:R.digSeconds+1}),one({...d,dug:NaN}),one({...d,fill:-1}),one({...d,fill:R.capacity+.5}),one({...d,fill:'1'}),
    one({...d,dug:R.digSeconds-1}),{version:1,active:true,ditches:[d,{...d,fill:0}]},
    {version:1,active:true,ditches:Array.from({length:R.maxDitches+1},(_,i)=>({x:1+i%120,y:1+Math.floor(i/120),dug:0,fill:0}))}])assert.throws(()=>E.validate(bad),/Travaux de terrain 217/);
});

test('travaux de terrain : un corps tombe dans le fossé ouvert le plus proche, bord compris',()=>{
  const a={x:10,y:10,dug:R.digSeconds,fill:0},b={x:11,y:10,dug:R.digSeconds,fill:0};
  assert.equal(E.rimDistance(a,10*TILE+5,10*TILE+5),0);near(E.rimDistance(a,10*TILE-3,10*TILE+5),3);near(E.rimDistance(a,10*TILE-3,10*TILE-4),5);
  assert.equal(E.catcher([a,b],10*TILE+5,10*TILE+5),a);assert.equal(E.catcher([a,b],11*TILE+5,10*TILE+5),b);
  assert.equal(E.catcher([a],10*TILE-R.rimDistance,10*TILE+5),a,'au bord');
  assert.equal(E.catcher([a],10*TILE-R.rimDistance-1,10*TILE+5),null,'au-delà du bord');
  assert.equal(E.catcher([{...a,dug:R.digSeconds-1}],10*TILE+5,10*TILE+5),null,'un chantier ne reçoit rien');
  assert.equal(E.catcher([{...a,fill:R.capacity},b],10*TILE+TILE-1,10*TILE+5),b,'un fossé comblé laisse le corps au voisin');
  assert.equal(E.catcher([{...a,fill:R.capacity}],10*TILE+5,10*TILE+5),null);
});

test('travaux de terrain : le fossé est au catalogue d’une nouvelle campagne et se pose comme un chantier financé',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),notes=watch(g);
  assert.equal(api.active(),true);assert.equal(api.unlocked(),true);assert.deepEqual(state(g),{version:1,active:true,ditches:[]});
  assert.equal(Object.hasOwn(C.BUILDINGS,ID),false,'le fossé n’est pas un ouvrage du monde');
  showDefense(g);const node=entry(g);assert.ok(node,'entrée au catalogue, onglet Défense');assert.match(node.innerHTML,/Fossé/);assert.match(node.innerHTML,/4/);
  g.currentCategory='colony';g.refreshBuildMenu(true);assert.equal(entry(g),null,'absent des autres onglets');
  showDefense(g);g.selectBuild(ID);assert.equal(g.selectedBuild,ID);assert.match(entry(g).className,/selected/);
  const wood=g.resources.wood,placed=g.stats.buildingsPlaced,buildings=g.world.buildings.size;
  assert.equal(g.placeOne(ID,h.x+6,h.y,0),true);
  assert.equal(g.resources.wood,wood-R.cost.wood);assert.equal(g.world.buildings.size,buildings,'aucun ouvrage créé');assert.equal(g.stats.buildingsPlaced,placed);
  assert.deepEqual(state(g).ditches,[{x:h.x+6,y:h.y,dug:0,fill:0}]);
  assert.equal(g.placeOne(ID,h.x+6,h.y,0),false,'case déjà creusée');assert.equal(g.placeOne(ID,h.x,h.y,0),false,'case occupée par le centre');
  assert.equal(g.placeOne(ID,h.x+R.cityRadiusTiles+1,h.y,0),false,'hors de l’emprise');assert.equal(g.placeOne(ID,0,0,0),false);
  assert.equal(g.resources.wood,wood-R.cost.wood,'aucun refus ne coûte');assert.equal(state(g).ditches.length,1);
  assert.ok(notes.some(t=>/occupe déjà/.test(t))&&notes.some(t=>/emprise/.test(t)));
  g.resources.wood=R.cost.wood-1;assert.equal(g.placeOne(ID,h.x+7,h.y,0),false);assert.match(notes.at(-1),/Ressources insuffisantes/);g.resources.wood=wood;
  // Aucun ouvrage ne se pose sur un fossé, et la pose ordinaire reste intacte à côté.
  assert.deepEqual(g.world.placement(C.BUILDINGS.woodWall,h.x+6,h.y,0),{valid:false,reason:'Fossé à remblayer d’abord'});
  assert.equal(g.world.placement(C.BUILDINGS.house,h.x+5,h.y,0).valid,false,'emprise large qui recouvre le fossé');
  assert.equal(g.world.placement(C.BUILDINGS.woodWall,h.x+7,h.y,0).valid,true);
  assert.equal(g.placeOne('woodWall',h.x+7,h.y,0),true);assert.equal(g.world.buildings.size,buildings+1);
  g.cancelPlacement();assert.equal(g.selectedBuild,null);
});

test('travaux de terrain : un chantier ne ralentit rien ; les ouvriers le creusent, puis le fossé ralentit sans rien bloquer',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),notes=watch(g),x=h.x+6,y=h.y+1,px=x*TILE+TILE/2,py=y*TILE+TILE/2;
  const enclosure=JSON.stringify(g.enclosureStatus?.()??null);
  assert.equal(g.placeOne(ID,x,y,0),true);
  assert.equal(api.speed(px,py),1);assert.equal(g.world.movementCost(x,y),10,'chantier : coût d’une case libre');
  assert.equal(g.workerOrder||'auto','auto');
  for(let i=0;i<1200&&!api.at(x,y).dug;i++)g.update(.05);
  assert.equal(api.at(x,y).dug,true,'creusé par les ouvriers en ordre auto');assert.equal(api.at(x,y).open,true);
  assert.equal(notes.filter(t=>t.startsWith('Fossé creusé')).length,1);
  assert.equal(api.speed(px,py),R.slowFactor);assert.equal(api.speed(px+TILE,py),1);
  assert.equal(g.world.movementCost(x,y),10+R.flowCost);assert.equal(g.world.movementCost(x+1,y),10);
  // Jamais un obstacle : ni pour les infectés, ni pour les vivants, ni pour l'analyse d'enceinte.
  assert.equal(g.world.atCell(x,y),null);assert.ok(!g.world.solidForFriendly(px,py));
  assert.equal(g.friendlyPositionClear(g.player,px,py),true);assert.equal(g.hostilePositionClear({radius:11},px,py),true);
  assert.equal(JSON.stringify(g.enclosureStatus?.()??null),enclosure);
  assert.ok(g.units.every(u=>u.kind!=='worker'||!u.dead),'aucun ouvrier perdu');
  // Les ouvriers reprennent leur travail ordinaire une fois le fossé creusé.
  run(g,3);assert.ok(g.units.filter(u=>u.kind==='worker').every(u=>!(u.state==='build'&&u.targetBuilding===-1)));
});

test('travaux de terrain : un infecté traverse le fossé ouvert au ralenti, sans dégât ; comblé, le fossé n’a plus d’effet',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),x=h.x+10,y=h.y+1;
  assert.equal(g.world.movementCost(x,y),10);
  withDitches(g,[dugAt(x,y)]);
  g.flow.rebuild(g.world,g.core());
  const step=()=>{const z=walker(g,x,y),health=z.health,sx=z.x,sy=z.y;g.rebuildBuckets?.();g.updateZombies(.05);
    const moved=Math.hypot(z.x-sx,z.y-sy);assert.equal(z.health,health,'aucun dégât');assert.equal(z.dead,false);g.zombies=g.zombies.filter(o=>o!==z);return moved;};
  const slowed=step();
  assert.ok(slowed>0,'il avance toujours : le fossé ne bloque pas');
  // Même infecté, même case, fossé comblé : vitesse ordinaire.
  for(let i=0;i<R.capacity;i++)assert.equal(api.receive(x*TILE+5,y*TILE+5),true);
  assert.equal(api.at(x,y).full,true);assert.equal(api.receive(x*TILE+5,y*TILE+5),false,'plus de place');
  assert.equal(api.speed(x*TILE+5,y*TILE+5),1);assert.equal(g.world.movementCost(x,y),10);
  const free=step();
  near(slowed/free,R.slowFactor,'rapport des vitesses');
});

test('travaux de terrain : les infectés abattus comblent le fossé, puis les ouvriers le déblaient à l’ordre « déblayer »',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),x=h.x+6,y=h.y+1,notes=watch(g);
  withDitches(g,[dugAt(x,y),{x:x+1,y,dug:2,fill:0}]);
  const fell=(dx,dy)=>{const z=walker(g,x,y);z.x=x*TILE+dx;z.y=y*TILE+dy;g.killZombie(z,false);assert.equal(z.dead,true);g.zombies=g.zombies.filter(o=>!o.dead);};
  fell(TILE/2,TILE/2);assert.equal(api.at(x,y).fill,1);
  fell(TILE/2,-R.rimDistance+1);assert.equal(api.at(x,y).fill,2,'au bord');
  fell(TILE/2,-R.rimDistance-6);assert.equal(api.at(x,y).fill,2,'trop loin');
  assert.equal(api.at(x+1,y).fill,0,'le chantier voisin ne reçoit rien');
  for(let i=2;i<R.capacity;i++)fell(8+i,8+i);
  assert.equal(api.at(x,y).full,true);assert.equal(api.at(x,y).fill,R.capacity);
  fell(TILE/2,TILE/2);assert.equal(api.at(x,y).fill,R.capacity,'jamais au-delà de la capacité');
  assert.equal(notes.filter(t=>t.startsWith('Un fossé est comblé')).length,1);
  assert.equal(api.speed(x*TILE+5,y*TILE+5),1);assert.equal(g.world.movementCost(x,y),10);
  const tally=api.tally();assert.deepEqual({total:tally.total,site:tally.site,open:tally.open,full:tally.full,bodies:tally.bodies},{total:2,site:1,open:0,full:1,bodies:R.capacity});
  assert.match(api.overview().summary,/1 fossé comblé/);
  // Sauvegarde et reprise d'un fossé comblé.
  const saved=JSON.parse(JSON.stringify(g.serialize()));
  assert.deepEqual(saved.expansions127.modules.earthworks217.ditches,[{x,y,dug:R.digSeconds,fill:R.capacity},{x:x+1,y,dug:2,fill:0}]);
  assert.equal(g.restoreSave(saved),true);assert.deepEqual(state(g),saved.expansions127.modules.earthworks217);
  assert.equal(g.earthworks217.at(x,y).full,true);
  // En ordre auto, les ouvriers finissent le chantier voisin mais ne déblaient pas.
  const corpses=g.corpses.length;
  assert.equal(g.setWorkerOrder('clear'),true);
  for(let i=0;i<800&&api.at(x,y).fill>0;i++)g.update(.05);
  assert.equal(api.at(x,y).fill,0,'déblayé');assert.equal(api.at(x,y).open,true);
  assert.equal(notes.filter(t=>t.startsWith('Fossé rouvert')).length,1);
  assert.ok(g.corpses.length<=corpses,'les corps visibles partent avec la charge');
  assert.equal(api.speed(x*TILE+5,y*TILE+5),R.slowFactor);assert.equal(g.world.movementCost(x,y),10+R.flowCost);
  assert.equal(api.at(x+1,y).work,2,'l’ordre « déblayer » ne creuse pas');
});

test('travaux de terrain : sauvegarde et reprise ; le coût de passage n’est jamais compté deux fois',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g);
  withDitches(g,[dugAt(h.x+8,h.y,3),{x:h.x+9,y:h.y,dug:4.5,fill:0},dugAt(h.x+8,h.y+1,R.capacity)]);
  const first=state(g);
  for(let i=0;i<3;i++){const data=JSON.parse(JSON.stringify(g.serialize()));assert.equal(g.restoreSave(data),true);g.update(.05);}
  assert.deepEqual(state(g),first);
  assert.equal(g.world.movementCost(h.x+8,h.y),10+R.flowCost);assert.equal(g.world.movementCost(h.x+9,h.y),10);assert.equal(g.world.movementCost(h.x+8,h.y+1),10);
  assert.equal(api.speed((h.x+8)*TILE+1,h.y*TILE+1),R.slowFactor);
  // Une sauvegarde incohérente est refusée en bloc, sans toucher à la campagne en cours.
  const bad=JSON.parse(JSON.stringify(g.serialize()));bad.expansions127.modules.earthworks217.ditches[1].fill=1;
  assert.throws(()=>g.restoreSave(bad),/Travaux de terrain 217/);assert.deepEqual(state(g),first);
  // Un ouvrage posé par un autre chemin sur un fossé le remblaie.
  const core=g.core(),B=core.constructor,wall=new B(g.nextId++,'woodWall',h.x+9,h.y,0,1);wall.health=wall.def.health;g.world.add(wall);
  assert.deepEqual(state(g).ditches.map(d=>[d.x,d.y]),[[h.x+8,h.y],[h.x+8,h.y+1]]);
  // Nouvelle campagne : registre vide.
  g.startNew('standard','17118');g.campaignIntro132?.skip?.();assert.deepEqual(state(g),{version:1,active:true,ditches:[]});
});

test('travaux de terrain : le Commandant immobile creuse à portée ; le remblai referme la case',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),x=h.x+6,y=h.y+2;
  assert.equal(g.placeOne(ID,x,y,0),true);
  g.setWorkerOrder('harvest');
  assert.equal(api.backfillQuote().ok,false,'trop loin');
  g.player.x=x*TILE+TILE/2;g.player.y=(y+1)*TILE+TILE/2;
  api.tick(.25);assert.equal(api.at(x,y).work,0,'le premier pas constate seulement l’immobilité');
  api.tick(.25);near(api.at(x,y).work,.25,'travail du Commandant');
  g.player.x+=4;api.tick(.25);near(api.at(x,y).work,.25,'en marchant, rien');
  g.selectedBuild='woodWall';api.tick(.25);api.tick(.25);near(api.at(x,y).work,.25,'mains prises, rien');g.selectedBuild=null;
  for(let i=0;i<60;i++)api.tick(.25);
  assert.equal(api.at(x,y).open,true);
  const wood=g.resources.wood,action=api.actions().find(a=>a.id==='backfill');assert.equal(action.disabled,false);
  assert.deepEqual(action.run(),{ok:true});assert.equal(api.at(x,y),null);assert.equal(g.resources.wood,wood,'rien n’est rendu');
  assert.equal(g.world.movementCost(x,y),10);assert.equal(g.world.placement(C.BUILDINGS.woodWall,x,y,0).valid,true);
  g.phase='assault';assert.equal(g.placeOne(ID,x,y,0),true);assert.match(api.backfillQuote().reason,/assaut/);
});

test('travaux de terrain : une campagne commencée avant la règle n’a ni entrée au catalogue ni fossé',()=>{
  const g=old(campaign()),api=g.earthworks217,h=home(g),notes=watch(g);
  assert.equal(api.active(),false);assert.deepEqual(state(g),{version:1,active:false,ditches:[]});
  showDefense(g);assert.equal(entry(g),null);
  const wood=g.resources.wood;assert.equal(g.placeOne(ID,h.x+6,h.y,0),false);assert.equal(g.resources.wood,wood);
  assert.match(notes.at(-1),/avant les travaux de terrain/);
  assert.equal(api.receive(h.x*TILE,h.y*TILE),false);assert.equal(api.speed(h.x*TILE,h.y*TILE),1);
  assert.deepEqual(api.actions(),[]);assert.match(api.overview().summary,/avant les travaux de terrain/);
  run(g,2);assert.deepEqual(state(g),{version:1,active:false,ditches:[]});
  // La reprise d'une nouvelle campagne retire puis remet l'entrée, selon la sauvegarde.
  const fresh=campaign();showDefense(fresh);assert.ok(entry(fresh));old(fresh);fresh.refreshBuildMenu();assert.equal(entry(fresh),null);
});

test('travaux de terrain : aucun tirage aléatoire, aucun dégât, aucune horloge propre',()=>{
  const source=fs.readFileSync(path.join(root,'src/earthworks217.js'),'utf8');
  for(const banned of [/Math\.random/,/\.random\b/,/Date\.now/,/performance\.now/,/setTimeout|setInterval/,/damage(Zombie|Building|Unit|Player)/,/\.health\s*[-+*]?=/])assert.doesNotMatch(source,banned);
  const g=campaign(),api=g.earthworks217,h=home(g);
  withDitches(g,[dugAt(h.x+6,h.y+1,2),{x:h.x+7,y:h.y+1,dug:1,fill:0}]);
  const draws=JSON.stringify(g.random),stock={...g.resources};
  api.tick(.25);api.receive((h.x+6)*TILE+3,(h.y+1)*TILE+3);api.speed(0,0);api.overview();api.actions();api.quote(h.x+9,h.y);
  for(const u of g.units)api.updateAssignedUnit(u,.05);
  assert.equal(JSON.stringify(g.random),draws,'aucun tirage');assert.deepEqual({...g.resources},stock,'aucun stock créé ni consommé');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.ok(html.indexOf('src/expansion-kit.js')<html.indexOf('src/earthworks217.js'));assert.ok(sw.includes('"src/earthworks217.js"'));
  assert.ok(g.expansions.get('earthworks217'));
});
