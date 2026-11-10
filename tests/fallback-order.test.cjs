'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),Fallback=require('../src/fallback-order.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const T=globalThis.DeadwallTactics||require('../src/tactics.js');
const root=path.join(__dirname,'..');
const wall=(id,gx,gy,gate=false,mode='auto')=>({id,type:gate?'gate':'woodWall',gx,gy,rotation:0,health:10,dead:false,completed:true,gateMode:mode,x:(gx+.5)*C.TILE,y:(gy+.5)*C.TILE,def:{name:gate?'Porte':'Palissade',wall:true,gate,size:[1,1]}});
function ring(cx,cy,r,gateAt){
  const list=[{id:1,type:'core',gx:cx,gy:cy,rotation:0,health:10,dead:false,completed:true,x:(cx+1)*C.TILE,y:(cy+1)*C.TILE,def:{name:'Centre',size:[2,2]}}];let id=10;
  for(let x=cx-r;x<=cx+r+1;x++)for(const y of [cy-r,cy+r+1])list.push(wall(id++,x,y,gateAt&&gateAt[0]===x&&gateAt[1]===y));
  for(let y=cy-r+1;y<=cy+r;y++)for(const x of [cx-r,cx+r+1])list.push(wall(id++,x,y,gateAt&&gateAt[0]===x&&gateAt[1]===y));
  return list;
}
// Les définitions de test passent par le même accès que le jeu.
const tactics={...T,operational:b=>Boolean(b&&!b.dead&&b.health>0&&b.completed),isGate:b=>Boolean(b.def?.gate),footprint:b=>({x:b.gx,y:b.gy,width:b.def.size[0],height:b.def.size[1]})};
const at=(gx,gy)=>({x:(gx+.5)*C.TILE,y:(gy+.5)*C.TILE});

test('repli : la zone tenue s’arrête aux murs et aux portes, quel que soit le mode de la porte',()=>{
  const closed=Fallback.innerZone(C,tactics,ring(60,60,4,[60,56]));
  assert.equal(closed.hasCore,true);assert.equal(closed.closed,true);assert.equal(closed.gates.length,1);
  assert.equal(closed.contains(at(62,62)),true);assert.equal(closed.contains(at(60,50)),false,'dehors');assert.equal(closed.contains(at(60,56)),false,'la porte elle-même n’est pas dedans');
  const list=ring(60,60,4,[60,56]);list.find(b=>b.def.gate).gateMode='open';
  assert.equal(Fallback.innerZone(C,tactics,list).closed,true,'une porte ouverte reste la limite de l’enceinte');
  const broken=ring(60,60,4,[60,56]);broken.find(b=>b.gx===65&&b.gy===60).dead=true;
  const open=Fallback.innerZone(C,tactics,broken);assert.equal(open.closed,false,'un mur tombé ouvre la zone');
  assert.equal(Fallback.innerZone(C,tactics,[]).hasCore,false);
  const nested=[...ring(60,60,8,[60,52]).filter(b=>b.type!=='core').map(b=>({...b,id:b.id+1000})),...ring(60,60,3,[60,57])];
  const inner=Fallback.innerZone(C,tactics,nested);assert.equal(inner.closed,true);assert.equal(inner.gates.length,1);assert.equal(inner.gates[0].gy,57,'seule l’enceinte la plus proche du centre compte');
});

test('repli : une brèche est nommée par son côté, vu du centre',()=>{
  const core={x:1000,y:1000};
  assert.equal(Fallback.sideOf(core,{x:1000,y:400}),'north');assert.equal(Fallback.sideOf(core,{x:1900,y:1100}),'east');
  assert.equal(Fallback.sideOf(core,{x:900,y:1700}),'south');assert.equal(Fallback.sideOf(core,{x:200,y:1000}),'west');
  assert.deepEqual(Object.values(Fallback.SIDES),['nord','est','sud','ouest']);
});

test('repli : le module ne crée ni stock, ni dégât, ni tirage et passe par les commandes existantes',()=>{
  const source=fs.readFileSync(path.join(root,'src/fallback-order.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','resources','localStorage'])assert.equal(source.includes(forbidden),false,forbidden);
  for(const write of [/\.health\s*[-+]?=[^=]/,/gateMode\s*=[^=]/,/workerOrder\s*=[^=]/,/\.squads\s*=[^=]/])assert.doesNotMatch(source,write);
  for(const command of ['g.retreatSquad(','g.setWorkerOrder(','g.setGateMode('])assert.ok(source.includes(command),command);
});

function campaign(){
  const {g,doc}=bootDocument134();Fallback.install(g,doc);g.startNew('standard','17117');g.campaignIntro132?.skip?.();
  return {g,doc};
}
function enclose(g){
  // Enceinte de palissades autour du centre, avec une porte au nord, posée dans le monde réel.
  const core=g.core(),cells=T.footprint(core),r=3,placed=[];
  const put=(type,gx,gy)=>{const B=core.constructor,b=new B(g.nextId++,type,gx,gy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);placed.push(b);return b;};
  const x0=cells.x-r,x1=cells.x+cells.width+r-1,y0=cells.y-r,y1=cells.y+cells.height+r-1,gateX=cells.x;
  for(let x=x0;x<=x1;x++){put(x===gateX?'gate':'woodWall',x,y0);put('woodWall',x,y1);}
  for(let y=y0+1;y<y1;y++){put('woodWall',x0,y);put('woodWall',x1,y);}
  g.world.navigationVersion++;g.refreshMetrics(true);
  return {placed,gate:placed.find(b=>T.isGate(b)),inside:{x:core.x,y:core.y+C.TILE*2},outside:{x:core.x,y:(y0-3)*C.TILE}};
}

test('repli des combattants : les sections se replient, les ouvriers et les portes ne changent pas',()=>{
  const {g}=campaign(),{gate}=enclose(g);
  assert.ok(gate,'porte posée');const order=g.workerOrder,mode=T.gateMode(gate),stock=JSON.stringify(g.resources);
  assert.equal(g.fallbackOrder.fighters(),true);
  assert.deepEqual(g.squads.groups.map(group=>group.order),['retreat','retreat','retreat']);
  assert.equal(g.workerOrder,order);assert.equal(T.gateMode(gate),mode);assert.equal(g.fallbackOrder.status().mode,'fighters');
  assert.equal(JSON.stringify(g.resources),stock);
});

test('repli général : les portes ne se verrouillent qu’une fois tout le monde rentré, puis se rétablissent',()=>{
  const {g,doc}=campaign(),{gate,inside,outside}=enclose(g);
  const status=()=>g.fallbackOrder.status();
  assert.equal(status().closed,true);assert.equal(status().gates,1);
  const straggler=g.units.find(u=>!u.dead);for(const unit of g.units){unit.x=inside.x;unit.y=inside.y;}g.player.x=inside.x;g.player.y=inside.y;
  straggler.x=outside.x;straggler.y=outside.y;
  assert.equal(g.fallbackOrder.everyone(),true);
  assert.equal(g.workerOrder,'retreat');assert.equal(status().mode,'everyone');
  g.fallbackOrder.tick();assert.equal(T.gateMode(gate),'auto','un retardataire dehors : la porte reste praticable');assert.equal(status().outside,1);assert.equal(status().sealed,false);
  straggler.x=inside.x;straggler.y=inside.y;g.player.x=outside.x;g.player.y=outside.y;
  g.fallbackOrder.tick();assert.equal(T.gateMode(gate),'auto','le commandant dehors n’est pas enfermé');assert.equal(status().commanderOutside,true);
  g.player.x=inside.x;g.player.y=inside.y;
  g.fallbackOrder.tick();assert.equal(T.gateMode(gate),'closed');assert.equal(status().sealed,true);
  g.fallbackOrder.refresh();assert.match(doc.getElementById('fallbackOrderState').textContent,/enceinte verrouillée/);
  const health=g.world.buildings.get(gate.id).health;
  assert.equal(g.fallbackOrder.standDown(),true);
  assert.equal(T.gateMode(gate),'auto','mode précédent rendu');assert.equal(g.workerOrder,'auto');assert.equal(status().mode,null);
  assert.equal(g.world.buildings.get(gate.id).health,health);
  assert.equal(g.fallbackOrder.standDown(),false,'rien à lever');
});

test('repli général : sans enceinte fermée, l’ordre replie sans rien verrouiller',()=>{
  const {g}=campaign();
  assert.equal(g.fallbackOrder.status().closed,false);
  assert.equal(g.fallbackOrder.everyone(),true);assert.equal(g.workerOrder,'retreat');
  g.fallbackOrder.tick();assert.equal(g.fallbackOrder.status().sealed,false);
});

test('brèche nommée : un mur qui tombe pendant l’assaut est annoncé avec son côté',()=>{
  const {g}=campaign(),{placed}=enclose(g);
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
  g.fallbackOrder.tick();g.phase='assault';
  // Un mur du milieu du côté nord : retirer un angle n’ouvrirait pas l’enceinte.
  const core=g.core(),top=Math.min(...placed.map(b=>b.gy)),north=placed.find(b=>!T.isGate(b)&&b.gy===top&&b.gx===T.footprint(core).x+3);
  assert.equal(Fallback.sideOf(core,north),'north');
  north.health=0;north.dead=true;g.world.navigationVersion++;g.elapsed+=10;
  g.fallbackOrder.tick();
  const breach=notes.filter(text=>text.startsWith('Brèche au '));
  assert.equal(breach.length,1);assert.match(breach[0],/^Brèche au nord \(/);
  assert.equal(g.fallbackOrder.status().lastBreach.side,'north');assert.equal(g.fallbackOrder.status().closed,false);
  g.fallbackOrder.tick();assert.equal(notes.filter(text=>text.startsWith('Brèche au ')).length,1,'une seule annonce par brèche');
});
