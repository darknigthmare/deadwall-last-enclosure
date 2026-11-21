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
// État de la deuxième tranche, posé par la sauvegarde.
function withState(g,value){const data=JSON.parse(JSON.stringify(g.serialize()));data.expansions127.modules.earthworks217=value;assert.equal(g.restoreSave(data),true);return g;}
const cell=(x,y,o={})=>({x,y,dug:R.digSeconds,fill:0,wet:false,back:null,...o});
const stand=(g,x,y)=>{g.player.x=x*TILE+TILE/2;g.player.y=y*TILE+TILE/2;};
// Un pas du Commandant qui tient ACTION / E, sans autre action proposée sur la touche.
const press=(g,dt)=>{g.interactionText='';g.input.keys.add('KeyE');g.earthworks217.tick(dt);g.input.keys.delete('KeyE');};
const entry=g=>[...g.ui.buildList.children].find(n=>n.dataset.buildId===ID)||null;
const showDefense=g=>{g.currentCategory='defense';g.refreshBuildMenu(true);};
// Un errant seul, loin des vivants et des ouvrages, au centre d'une case.
function walker(g,gx,gy){
  g.fronts=['north'];assert.notEqual(g.spawnZombie('walker'),false);const z=g.zombies.at(-1);
  z.x=z.lastX=gx*TILE+TILE/2;z.y=z.lastY=gy*TILE+TILE/2;return z;
}

test('travaux de terrain : règles gelées dans le cœur, état validé strictement',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.cost)&&Object.isFrozen(R.talus)&&Object.isFrozen(R.moat)&&Object.isFrozen(R.backfill));
  assert.deepEqual(JSON.parse(JSON.stringify(R)),{unlockTier:0,cost:{wood:4},digSeconds:10,slowFactor:.55,flowCost:14,capacity:6,rimDistance:10,workRange:48,cityRadiusTiles:44,maxDitches:256,
    earthPerDitch:1,maxEarth:999,maxLine:32,talus:{earth:2,buildSeconds:6,rampBonus:8,slowFactor:.85,maxBanks:256},
    moat:{fillWater:4,upkeepPerSecond:.004,slowFactor:.4,flowCost:20,capacity:12},backfill:{earth:1,stone:2,seconds:5}});
  // Une douve ralentit plus qu'un fossé sec et se comble plus lentement ; un talus n'arrête jamais un infecté.
  assert.ok(R.moat.slowFactor<R.slowFactor&&R.moat.flowCost>R.flowCost&&R.moat.capacity>R.capacity&&R.talus.slowFactor>0&&R.talus.slowFactor<1&&R.talus.rampBonus>0);
  assert.ok(R.slowFactor>0&&R.slowFactor<1&&R.flowCost>0&&Number.isInteger(R.capacity)&&R.capacity>0);
  const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
  assert.equal(core.match(/C\.Earthworks217Rules=/g).length,1);
  assert.deepEqual(E.validate(undefined),{version:2,active:false,earth:0,ditches:[],banks:[]});assert.deepEqual(E.initial(),{version:2,active:false,earth:0,ditches:[],banks:[]});assert.deepEqual(E.fresh(),{version:2,active:true,earth:0,ditches:[],banks:[]});
  // Première tranche : acceptée et convertie ; la terre des cases déjà creusées entre dans la réserve.
  const ok={version:1,active:true,ditches:[{x:70,y:64,dug:R.digSeconds,fill:2.5},{x:71,y:64,dug:3,fill:0},{x:72,y:64,dug:R.digSeconds,fill:R.capacity}]};
  const up=E.validate(ok);
  assert.deepEqual(up,{version:2,active:true,earth:2*R.earthPerDitch,ditches:ok.ditches.map(d=>({...d,wet:false,back:null})),banks:[]});assert.notEqual(up.ditches[0],ok.ditches[0]);
  assert.deepEqual(E.validate(up),up,'la forme convertie se relit telle quelle');
  assert.deepEqual(E.validate({version:1,active:false,ditches:[]}),E.initial());
  const one=d=>({version:1,active:true,ditches:[d]}),d={x:70,y:64,dug:R.digSeconds,fill:1};
  for(const bad of [null,[],'fossé',{},{version:1,active:true},{...ok,version:3},{...ok,version:2},{...ok,active:1},{...ok,extra:1},{...ok,ditches:{}},{...ok,active:false},
    one(null),one([]),one({x:70,y:64,dug:1}),one({...d,extra:1}),one({...d,x:70.5}),one({...d,x:0}),one({...d,y:C.WORLD_TILES-2}),one({...d,x:'70'}),
    one({...d,dug:-1}),one({...d,dug:R.digSeconds+1}),one({...d,dug:NaN}),one({...d,fill:-1}),one({...d,fill:R.capacity+.5}),one({...d,fill:'1'}),
    one({...d,dug:R.digSeconds-1}),{version:1,active:true,ditches:[d,{...d,fill:0}]},
    {version:1,active:true,ditches:Array.from({length:R.maxDitches+1},(_,i)=>({x:1+i%120,y:1+Math.floor(i/120),dug:0,fill:0}))}])assert.throws(()=>E.validate(bad),/Travaux de terrain 217/);
  // Deuxième tranche : terre, talus, douve et remblai validés case par case.
  const c=(o={})=>({x:70,y:64,dug:R.digSeconds,fill:0,wet:false,back:null,...o}),m=(o={})=>({x:70,y:66,built:R.talus.buildSeconds,...o});
  const v2=(o={})=>({version:2,active:true,earth:3,ditches:[c(),c({x:71,wet:true,fill:R.moat.capacity}),c({x:72,back:1.5}),c({x:73,dug:2})],banks:[m(),m({x:71,built:2})],...o});
  assert.deepEqual(E.validate(v2()),v2());
  for(const bad of [v2({earth:-1}),v2({earth:R.maxEarth+1}),v2({earth:'3'}),v2({banks:{}}),v2({extra:1}),{...v2(),banks:undefined},v2({active:false}),{version:2,active:false,earth:1,ditches:[],banks:[]},
    v2({ditches:[c({wet:1})]}),v2({ditches:[c({back:-1})]}),v2({ditches:[c({back:R.backfill.seconds})]}),v2({ditches:[c({back:1,wet:true})]}),v2({ditches:[c({back:1,fill:1})]}),
    v2({ditches:[c({dug:2,wet:true})]}),v2({ditches:[c({dug:2,back:0})]}),v2({ditches:[c({fill:R.moat.capacity+1})]}),v2({ditches:[c({extra:1})]}),v2({ditches:[{x:70,y:64,dug:1,fill:0}]}),
    v2({banks:[m({built:-1})]}),v2({banks:[m({built:R.talus.buildSeconds+1})]}),v2({banks:[m({extra:1})]}),v2({banks:[m(),m()]}),v2({ditches:[c()],banks:[m({y:64})]}),
    v2({banks:Array.from({length:R.talus.maxBanks+1},(_,i)=>m({x:1+i%120,y:1+Math.floor(i/120)}))})])assert.throws(()=>E.validate(bad),/Travaux de terrain 217/);
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
  assert.equal(api.active(),true);assert.equal(api.unlocked(),true);assert.deepEqual(state(g),{version:2,active:true,earth:0,ditches:[],banks:[]});
  assert.equal(Object.hasOwn(C.BUILDINGS,ID),false,'le fossé n’est pas un ouvrage du monde');
  showDefense(g);const node=entry(g);assert.ok(node,'entrée au catalogue, onglet Défense');assert.match(node.innerHTML,/Fossé/);assert.match(node.innerHTML,/4/);
  g.currentCategory='colony';g.refreshBuildMenu(true);assert.equal(entry(g),null,'absent des autres onglets');
  showDefense(g);g.selectBuild(ID);assert.equal(g.selectedBuild,ID);assert.match(entry(g).className,/selected/);
  const wood=g.resources.wood,placed=g.stats.buildingsPlaced,buildings=g.world.buildings.size;
  assert.equal(g.placeOne(ID,h.x+6,h.y,0),true);
  assert.equal(g.resources.wood,wood-R.cost.wood);assert.equal(g.world.buildings.size,buildings,'aucun ouvrage créé');assert.equal(g.stats.buildingsPlaced,placed);
  assert.deepEqual(state(g).ditches,[{x:h.x+6,y:h.y,dug:0,fill:0,wet:false,back:null}]);
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
  assert.deepEqual(saved.expansions127.modules.earthworks217.ditches,[{x,y,dug:R.digSeconds,fill:R.capacity,wet:false,back:null},{x:x+1,y,dug:2,fill:0,wet:false,back:null}]);
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
  g.startNew('standard','17118');g.campaignIntro132?.skip?.();assert.deepEqual(state(g),{version:2,active:true,earth:0,ditches:[],banks:[]});
});

test('travaux de terrain : le Commandant creuse à portée en tenant ACTION / E ; le remblai se paie puis se travaille',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),x=h.x+6,y=h.y+2,notes=watch(g);
  assert.equal(g.placeOne(ID,x,y,0),true);
  g.setWorkerOrder('harvest');
  assert.equal(api.backfillQuote().ok,false,'trop loin');
  stand(g,x,y+1);
  // Geste explicite : à portée, immobile ou non, rien ne se fait sans la touche d'action ; le libellé l'annonce.
  g.interactionText='';api.tick(.25);assert.equal(api.at(x,y).work,0,'sans la touche, rien');assert.match(g.interactionText,/ACTION \/ E : creuser le fossé · 0 %/);
  press(g,.25);near(api.at(x,y).work,.25,'travail du Commandant');
  g.player.x+=4;press(g,.25);near(api.at(x,y).work,.5,'en marchant, toujours à portée');
  g.selectedBuild='woodWall';press(g,.25);near(api.at(x,y).work,.5,'mains prises, rien');g.selectedBuild=null;
  // Une action du jeu déjà proposée sur la touche passe d'abord : jamais deux travaux pour une pression.
  g.input.keys.add('KeyE');g.interactionText='Récolter bois';api.tick(.25);g.input.keys.delete('KeyE');near(api.at(x,y).work,.5,'la touche sert déjà une autre action');
  for(let i=0;i<60;i++)press(g,.25);
  assert.equal(api.at(x,y).open,true);assert.equal(api.earth(),R.earthPerDitch,'la terre de la case creusée');
  // Remblai payant : terre d'abord, puis du travail ; tant qu'il dure, la case n'a plus d'effet et reste occupée.
  const wood=g.resources.wood,stone=g.resources.stone,action=api.actions().find(a=>a.id==='backfill');assert.equal(action.disabled,false);
  assert.deepEqual(action.run(),{ok:true});assert.equal(api.earth(),R.earthPerDitch-R.backfill.earth);assert.equal(g.resources.stone,stone);
  assert.equal(api.at(x,y).back,0);assert.equal(api.at(x,y).open,false);assert.equal(g.world.movementCost(x,y),10);assert.equal(api.speed(x*TILE+5,y*TILE+5),1);
  assert.equal(g.world.placement(C.BUILDINGS.woodWall,x,y,0).valid,false,'remblai à finir');
  assert.match(api.backfillQuote().reason,/déjà financé/);
  g.interactionText='';api.tick(.25);assert.match(g.interactionText,/remblayer le fossé/);
  for(let i=0;i<R.backfill.seconds/.25+2&&api.at(x,y);i++)press(g,.25);
  assert.equal(api.at(x,y),null,'remblai fini');assert.equal(g.resources.wood,wood,'le bois du chantier n’est pas rendu');
  assert.equal(g.world.placement(C.BUILDINGS.woodWall,x,y,0).valid,true);assert.ok(notes.some(t=>/Fossé remblayé/.test(t)));
  // À défaut de terre, la pierre ; sans l'une ni l'autre, refus sans coût. Un charnier se déblaie d'abord.
  withState(g,{version:2,active:true,earth:0,ditches:[cell(x,y),cell(x+1,y,{fill:2})],banks:[]});stand(g,x,y+1);
  g.resources.stone=R.backfill.stone-1;assert.match(api.backfillQuote().reason,/terre ou .* pierre/);
  g.resources.stone=R.backfill.stone+3;assert.deepEqual(api.backfill(),{ok:true});assert.equal(g.resources.stone,3);assert.equal(api.at(x,y).back,0);
  stand(g,x+1,y+1);g.player.x+=TILE/2;assert.match(api.backfillQuote().reason,/Déblayez d’abord/);
  // Un chantier jamais creusé s'annule sans rien coûter de plus.
  assert.equal(g.placeOne(ID,x+2,y+1,0),true);stand(g,x+2,y+2);const before={...g.resources},earth=api.earth();
  assert.deepEqual(api.backfill(),{ok:true});assert.equal(api.at(x+2,y+1),null);assert.deepEqual({...g.resources},before);assert.equal(api.earth(),earth);
  g.phase='assault';assert.equal(g.placeOne(ID,x+2,y+1,0),true);assert.match(api.backfillQuote().reason,/assaut/);
});

test('travaux de terrain : une campagne commencée avant la règle n’a ni entrée au catalogue ni fossé',()=>{
  const g=old(campaign()),api=g.earthworks217,h=home(g),notes=watch(g);
  assert.equal(api.active(),false);assert.deepEqual(state(g),{version:2,active:false,earth:0,ditches:[],banks:[]});
  showDefense(g);assert.equal(entry(g),null);
  const wood=g.resources.wood;assert.equal(g.placeOne(ID,h.x+6,h.y,0),false);assert.equal(g.resources.wood,wood);
  assert.match(notes.at(-1),/avant les travaux de terrain/);
  assert.equal(api.receive(h.x*TILE,h.y*TILE),false);assert.equal(api.speed(h.x*TILE,h.y*TILE),1);
  assert.deepEqual(api.actions(),[]);assert.match(api.overview().summary,/avant les travaux de terrain/);
  // Deuxième tranche absente, elle aussi : ni talus, ni douve, ni tracé, ni règle de franchissement changée.
  assert.equal(api.plan(ID,[{x:h.x+6,y:h.y},{x:h.x+9,y:h.y}]).placeable,0);assert.equal(api.raise(h.x+6,h.y).ok,false);assert.equal(g.placeWallLine(ID,[{x:h.x+6,y:h.y},{x:h.x+9,y:h.y}]),false);
  assert.match(api.floodQuote().reason,/avant les travaux de terrain/);assert.equal(api.moatBodies(),0);assert.equal(api.earth(),0);assert.equal(api.upkeep(1),0);
  const core=g.core(),wall=new core.constructor(g.nextId++,'woodWall',h.x+7,h.y+5,0,1);wall.health=wall.def.health;g.world.add(wall);wall.corpseLoad=C.LINECARE_RULES.rampMin+1;
  assert.equal(api.rampBonus(wall),0);assert.equal(g.zombieCanClimb({id:0,kind:'runner'},wall),true);
  assert.equal(g.isLineWall(C.BUILDINGS.woodWall),true);assert.equal(g.isLineWall(C.BUILDINGS.house),false);
  assert.throws(()=>E.validate({version:2,active:false,earth:0,ditches:[],banks:[{x:5,y:5,built:0}]}),/Travaux de terrain 217/);
  run(g,2);assert.deepEqual(state(g),{version:2,active:false,earth:0,ditches:[],banks:[]});
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
  api.plan(ID,[{x:h.x+6,y:h.y+3},{x:h.x+12,y:h.y+3}]);api.plan('bank217',[{x:h.x+6,y:h.y+2},{x:h.x+8,y:h.y+2}]);api.bankQuote(h.x+6,h.y+2);api.floodQuote();api.drainQuote();api.levelQuote();api.backfillQuote();
  api.upkeep(.25);api.moatBodies();api.tally();g.input.keys.add('KeyE');g.interactionText='Récolter bois';api.tick(.25);g.input.keys.delete('KeyE');
  for(const u of g.units)api.updateAssignedUnit(u,.05);
  assert.equal(JSON.stringify(g.random),draws,'aucun tirage');assert.deepEqual({...g.resources},stock,'aucun stock créé ni consommé');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.ok(html.indexOf('src/expansion-kit.js')<html.indexOf('src/earthworks217.js'));assert.ok(sw.includes('"src/earthworks217.js"'));
  assert.ok(g.expansions.get('earthworks217'));
});

const BANK='bank217',K=R.talus,M=R.moat;
function cistern(g,water){
  const core=g.core(),B=core.constructor,f=T.footprint(core),b=new B(g.nextId++,'fireCistern',f.x+8,f.y,0,1);b.health=b.def.health;g.world.add(b);g.refreshMetrics(true);
  g.siege.snapshot();const data=g.serialize();const tank=data.siege.tanks.find(t=>t.id===b.id);assert.ok(tank,'citerne reconnue');tank.water=water;
  assert.equal(g.restoreSave(data),true);return b.id;
}
const water=g=>g.siege.cityReserve215().water;

test('talus : fait avec la terre des fossés, dressé à la main, il rend le fossé qu’il borde plus lent sans fermer aucune case',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),x=h.x+6,y=h.y+3,notes=watch(g);
  g.setWorkerOrder('harvest');
  withState(g,{version:2,active:true,earth:0,ditches:[cell(x,y,{dug:R.digSeconds-.25}),cell(x+1,y,{dug:R.digSeconds-.25})],banks:[]});
  showDefense(g);const node=[...g.ui.buildList.children].find(n=>n.dataset.buildId===BANK);assert.ok(node,'talus au catalogue');assert.match(node.innerHTML,/Talus/);assert.match(node.innerHTML,/2 terre/);
  assert.match(api.bankQuote(x,y+1).reason,/Terre insuffisante/);
  stand(g,x,y+1);press(g,.25);stand(g,x+1,y+1);press(g,.25);
  assert.equal(api.earth(),2*R.earthPerDitch,'chaque case creusée donne sa terre');assert.equal(state(g).earth,2*R.earthPerDitch,'terre sauvegardée');
  assert.match(api.bankQuote(x+4,y+4).reason,/s’adosse à un mur ou borde un fossé/);
  assert.match(api.bankQuote(x,y).reason,/fossé occupe/);
  const stock={...g.resources};
  assert.deepEqual(api.raise(x,y+1),{ok:true});assert.equal(api.earth(),0);assert.deepEqual({...g.resources},stock,'le talus ne coûte que de la terre');
  assert.deepEqual(state(g).banks,[{x,y:y+1,built:0}]);
  assert.equal(api.speed(x*TILE+5,y*TILE+5),R.slowFactor,'un chantier de talus n’a pas d’effet');
  stand(g,x,y+1);g.interactionText='';api.tick(.25);assert.match(g.interactionText,/dresser le talus/);
  for(let i=0;i<K.buildSeconds/.25+2&&!api.bankAt(x,y+1).built;i++)press(g,.25);
  assert.equal(api.bankAt(x,y+1).built,true);assert.ok(notes.some(t=>/Talus dressé/.test(t)));
  near(api.speed(x*TILE+5,y*TILE+5),R.slowFactor*K.slowFactor,'fossé bordé d’un talus');
  assert.equal(api.speed((x+1)*TILE+5,y*TILE+5),R.slowFactor,'le voisin en diagonale ne compte pas');
  // Jamais un obstacle : la case du talus reste libre pour tous et garde son coût de passage.
  const px=x*TILE+TILE/2,py=(y+1)*TILE+TILE/2;
  assert.equal(g.world.atCell(x,y+1),null);assert.equal(g.world.movementCost(x,y+1),10);assert.equal(api.speed(px,py),1);
  assert.ok(!g.world.solidForFriendly(px,py));assert.equal(g.friendlyPositionClear(g.player,px,py),true);assert.equal(g.hostilePositionClear({radius:11},px,py),true);
  assert.deepEqual(g.world.placement(C.BUILDINGS.woodWall,x,y+1,0),{valid:false,reason:'Talus à araser d’abord'});
  // Sauvegarde, reprise, puis arasement : la terre revient.
  const saved=state(g);assert.equal(g.restoreSave(JSON.parse(JSON.stringify(g.serialize()))),true);assert.deepEqual(state(g),saved);
  stand(g,x,y+1);assert.deepEqual(api.actions().find(a=>a.id==='level').run(),{ok:true});
  assert.equal(api.earth(),K.earth);assert.equal(api.bankAt(x,y+1),null);assert.equal(api.speed(x*TILE+5,y*TILE+5),R.slowFactor);
});

test('talus adossé à un mur : il faut plus de corps pour le franchir, jamais un mur infranchissable',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),x=h.x+7,y=h.y+5,runner={id:0,kind:'runner'},walker={id:0,kind:'walker'};
  withState(g,{version:2,active:true,earth:0,ditches:[],banks:[{x,y:y+1,built:K.buildSeconds},{x:x+3,y:y+1,built:2}]});
  const core=g.core(),B=core.constructor,add=gx=>{const w=new B(g.nextId++,'woodWall',gx,y,0,1);w.health=w.def.health;g.world.add(w);return w;};
  const wall=add(x),site=add(x+3),bare=add(x+6),first=C.LINECARE_RULES.rampMin;
  assert.equal(api.rampBonus(wall),K.rampBonus);assert.equal(api.rampBonus(site),0,'un talus en chantier ne compte pas');assert.equal(api.rampBonus(bare),0);
  for(const w of [wall,site,bare])w.corpseLoad=first+1;
  assert.equal(g.zombieCanClimb(runner,bare),true);assert.equal(g.zombieCanClimb(runner,site),true);
  assert.equal(g.zombieCanClimb(runner,wall),false,'adossé : l’amas ordinaire ne suffit plus');
  wall.corpseLoad=first+K.rampBonus;assert.equal(g.zombieCanClimb(runner,wall),false);
  wall.corpseLoad=first+K.rampBonus+1;assert.equal(g.zombieCanClimb(runner,wall),true,'un amas plus haut franchit toujours');
  wall.corpseLoad=Infinity;assert.equal(g.zombieCanClimb(runner,wall),true,'jamais infranchissable');
  assert.equal(g.zombieCanClimb(walker,wall),false,'la règle du jeu garde ses grimpeurs');
  assert.equal(wall.corpseLoad,Infinity,'la charge réelle du mur est intacte');
  // Le talus ne change ni la vie du mur, ni les dégâts, ni la règle de pose voisine.
  assert.equal(wall.health,wall.def.health);
  // Le terrain d'un talus contre un mur est accepté : seule la terre manque ici.
  assert.match(api.bankQuote(x,y-1).reason,/Terre insuffisante/);
});

test('douve : mise en eau au prix de l’eau de cité, plus lente, comblée plus tard ; ses corps comptent pour la salubrité ; en pénurie elle se vide',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),x=h.x+6,y=h.y+4,notes=watch(g);
  cistern(g,2*M.fillWater+.01);
  withState(g,{version:2,active:true,earth:0,ditches:[cell(x,y),cell(x+1,y),cell(x+2,y),cell(x+5,y)],banks:[]});
  assert.equal(g.cityWater215.active(),true);
  stand(g,x,y+1);
  const action=api.actions().find(a=>a.id==='flood');assert.ok(action);assert.equal(action.disabled,false);assert.match(action.reason,/2 cases sur 3/);
  const left=g.corpseChain217.left();
  assert.deepEqual(action.run(),{ok:true,count:2});
  near(water(g),.01,'eau tirée des citernes');assert.ok(notes.some(t=>/Mise en eau partielle : 2 cases sur 3/.test(t)));
  assert.equal(api.at(x,y).wet,true);assert.equal(api.at(x+1,y).wet,true);assert.equal(api.at(x+2,y).wet,false,'les citernes ne suivent pas');assert.equal(api.at(x+5,y).wet,false,'tranchée séparée');
  api.tick(0);assert.equal(api.speed(x*TILE+5,y*TILE+5),M.slowFactor);assert.equal(g.world.movementCost(x,y),10+M.flowCost);assert.equal(g.world.movementCost(x+2,y),10+R.flowCost);
  const px=x*TILE+TILE/2,py=y*TILE+TILE/2;assert.equal(g.world.atCell(x,y),null);assert.equal(g.hostilePositionClear({radius:11},px,py),true);assert.equal(g.friendlyPositionClear(g.player,px,py),true);
  stand(g,x+2,y+1);assert.match(api.floodQuote().reason,/Citernes trop basses/);stand(g,x,y+1);
  // Se comble plus tard : une douve absorbe plus de corps ; ils restent dans l'eau et comptent pour la salubrité.
  for(let i=0;i<R.capacity+1;i++)assert.equal(api.receive(x*TILE+5,y*TILE+5),true);
  assert.equal(api.at(x,y).open,true,'au-delà de la capacité d’un fossé sec');
  assert.equal(api.moatBodies(),R.capacity+1);assert.equal(g.corpseChain217.left(),left+R.capacity+1);
  api.receive((x+5)*TILE+5,y*TILE+5);assert.equal(g.corpseChain217.left(),left+R.capacity+1,'les corps d’un fossé sec n’y comptent pas');
  // Entretien : tiré après la population, exactement.
  g.economyTick(.25);near(water(g),.01-2*M.upkeepPerSecond*.25,'entretien exact');assert.equal(api.at(x,y).wet,true);
  // Pénurie : la douve se vide et redevient un fossé ; trop chargée pour un fossé sec, elle est comblée.
  for(let i=0;i<20&&api.at(x,y).wet;i++)g.economyTick(.25);
  assert.equal(api.at(x,y).wet,false);assert.equal(api.at(x+1,y).wet,false);assert.ok(notes.some(t=>/Pénurie d’eau : les douves se vident/.test(t)));
  assert.equal(api.at(x,y).full,true);assert.equal(api.speed(x*TILE+5,y*TILE+5),1);assert.equal(api.speed((x+1)*TILE+5,y*TILE+5),R.slowFactor);
  assert.equal(api.moatBodies(),0);assert.equal(g.corpseChain217.left(),left,'vidée, la douve redevient un fossé : ses corps sortent du compte comme ceux d’un fossé sec');
  const saved=state(g);assert.equal(g.restoreSave(JSON.parse(JSON.stringify(g.serialize()))),true);assert.deepEqual(state(g),saved);
  assert.equal(api.actions().some(a=>a.id==='drain'),false);
});

test('douve : vidée sur ordre, sans eau rendue ; jamais proposée sans eau de cité active',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),x=h.x+6,y=h.y+4;
  cistern(g,M.fillWater+1);withState(g,{version:2,active:true,earth:0,ditches:[cell(x,y)],banks:[]});stand(g,x,y+1);
  assert.deepEqual(api.flood(),{ok:true,count:1});near(water(g),1);
  assert.deepEqual(api.actions().find(a=>a.id==='drain').run(),{ok:true});assert.equal(api.at(x,y).wet,false);near(water(g),1,'l’eau n’est pas rendue');
  assert.equal(api.speed(x*TILE+5,y*TILE+5),R.slowFactor);
  // Campagne sans eau de cité suivie : aucune douve.
  const data=JSON.parse(JSON.stringify(g.serialize()));delete data.expansions127.modules.cityWater215;assert.equal(g.restoreSave(data),true);
  assert.equal(g.cityWater215.active(),false);stand(g,x,y+1);
  assert.equal(api.actions().some(a=>a.id==='flood'),false);assert.match(api.floodQuote().reason,/ne suit pas l’eau de cité/);assert.equal(api.flood().ok,false);
  assert.match(api.overview().rows.find(r=>r.label==='Douve').value,/Sans objet/);
});

test('tracé en ligne : aperçu et coût total, refus partiel propre quand le stock manque ou qu’une case est prise',()=>{
  const g=campaign(),api=g.earthworks217,h=home(g),y=h.y+3,notes=watch(g),a={x:h.x+6,y},b={x:h.x+11,y};
  assert.equal(g.placeOne('woodWall',h.x+8,y,0),true);
  g.resources.wood=R.cost.wood*3+1;
  g.selectBuild(ID);assert.equal(g.isLineWall(C.BUILDINGS[ID]),true,'le glissé des murs sert au fossé');assert.equal(g.isLineWall(C.BUILDINGS.house),false);assert.equal(g.isLineWall(C.BUILDINGS.woodWall),true);
  const stock={...g.resources},p=api.plan(ID,[a,b]);
  assert.deepEqual({...g.resources},stock,'l’aperçu ne coûte rien');
  assert.deepEqual(p.cells.map(c=>c.status),['ok','ok','blocked','ok','short','short']);
  assert.deepEqual({placeable:p.placeable,blocked:p.blocked,short:p.short,cost:p.cost},{placeable:3,blocked:1,short:2,cost:{wood:3*R.cost.wood}});
  assert.match(p.text,/3 cases · .*12 · stock épuisé pour 2 · 1 refusée/);
  // Aperçu dessiné au curseur pendant le glissé, coût total au bout de la ligne.
  const drawn=[];const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:k==='fillText'?(t=>drawn.push(t)):k==='measureText'?(()=>({width:40})):()=>{},set:(o,k,v)=>{o[k]=v;return true;}});
  g.wallStart=a;g.wallPreview=g.world.line(a,b);g.drawPlacement(ctx);assert.deepEqual(drawn,[p.text]);g.wallStart=null;g.wallPreview=[];
  assert.equal(g.placeWallLine(ID,[a,b]),true);
  assert.deepEqual(api.list().map(d=>d.x-h.x),[6,7,9]);assert.equal(g.resources.wood,1);
  assert.ok(notes.some(t=>/Tracé partiel : 3 cases de fossés sur 6 · stock épuisé pour 2 · 1 case refusée/.test(t)));
  // Plus de stock : refus entier, rien posé, rien payé.
  const n=notes.length;assert.equal(g.placeWallLine(ID,[{x:h.x+6,y:y+1},{x:h.x+9,y:y+1}]),false);assert.equal(api.list().length,3);assert.equal(g.resources.wood,1);assert.match(notes.slice(n).join(' '),/Tracé refusé/);
  // Une ligne trop longue est bornée.
  g.resources.wood=1e4;assert.equal(api.plan(ID,[{x:h.x-20,y:y+12},{x:h.x+30,y:y+12}]).cells.length,R.maxLine);
  // Talus en ligne le long des fossés : la terre manque après le premier.
  withState(g,{version:2,active:true,earth:K.earth+1,ditches:api.list(),banks:[]});
  const q=api.plan(BANK,[{x:h.x+6,y:y+1},{x:h.x+9,y:y+1}]);
  assert.deepEqual(q.cells.map(c=>c.status),['ok','short','short','short']);assert.deepEqual(q.cost,{earth:K.earth});
  assert.equal(g.placeWallLine(BANK,[{x:h.x+6,y:y+1},{x:h.x+9,y:y+1}]),true);assert.equal(api.banks().length,1);assert.equal(api.earth(),1);
  // Les murs gardent leur tracé ordinaire.
  g.resources.wood=1e4;g.placeWallLine('woodWall',[{x:h.x+6,y:y+6},{x:h.x+8,y:y+6}]);assert.ok(g.world.atCell(h.x+7,y+6)?.def.wall);
});
