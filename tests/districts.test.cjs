'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),Fallback=require('../src/fallback-order.js'),Districts=require('../src/districts.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const T=globalThis.DeadwallTactics||require('../src/tactics.js');
const root=path.join(__dirname,'..');
const at=(gx,gy)=>({x:(gx+.5)*C.TILE,y:(gy+.5)*C.TILE});
const wall=(id,gx,gy,gate=false,mode='auto')=>({id,type:gate?'gate':'woodWall',gx,gy,rotation:0,health:100,maxHealth:100,dead:false,completed:true,gateMode:mode,...at(gx,gy),def:{name:gate?'Porte':'Palissade',wall:true,gate,size:[1,1]}});
const core=(cx,cy)=>({id:1,type:'core',gx:cx,gy:cy,rotation:0,health:10,dead:false,completed:true,x:(cx+1)*C.TILE,y:(cy+1)*C.TILE,def:{name:'Centre',size:[2,2]}});
// Carré de murs autour d'un centre 2×2 placé en (cx,cy), à `r` cases de distance, avec une porte éventuelle.
function square(base,cx,cy,r,gateAt){
  const list=[];let id=base;
  for(let x=cx-r;x<=cx+r+1;x++)for(const y of [cy-r,cy+r+1])list.push(wall(id++,x,y,Boolean(gateAt&&gateAt[0]===x&&gateAt[1]===y)));
  for(let y=cy-r+1;y<=cy+r;y++)for(const x of [cx-r,cx+r+1])list.push(wall(id++,x,y,Boolean(gateAt&&gateAt[0]===x&&gateAt[1]===y)));
  return list;
}
const house=(id,gx,gy,housing=8)=>({id,type:'house',gx,gy,rotation:0,health:10,dead:false,completed:true,...at(gx,gy),def:{name:'Dortoir',housing,size:[1,1]}});
const unit=(kind,gx,gy)=>({kind,health:10,dead:false,...at(gx,gy)});
// Les définitions de test passent par le même accès que le jeu.
const tactics={...T,operational:b=>Boolean(b&&!b.dead&&b.health>0&&b.completed),isGate:b=>Boolean(b.def?.gate),footprint:b=>({x:b.gx,y:b.gy,width:b.def.size[0],height:b.def.size[1]})};
const two=()=>[core(60,60),...square(100,60,60,3,[60,57]),...square(1000,60,60,8,[60,52])];
const three=()=>[...two(),...square(3000,60,60,14,[75,60])];

test('districts : deux enceintes imbriquées sont reconnues de l’intérieur vers l’extérieur',()=>{
  const list=Districts.rings(C,tactics,two());
  assert.equal(list.length,2);assert.deepEqual(list.map(ring=>ring.name),['Enceinte intérieure','Deuxième enceinte']);
  assert.deepEqual(list.map(ring=>ring.closed),[true,true]);
  assert.deepEqual(list.map(ring=>ring.gates.length),[1,1]);assert.equal(list[0].gates[0].gy,57);assert.equal(list[1].gates[0].gy,52);
  assert.equal(list[0].cells,36,'6×6 cases libres dans l’enceinte intérieure');assert.equal(list[0].works.length,28);
  assert.equal(list[1].cells,256,'16×16 cases dans la deuxième, ouvrages intérieurs compris');assert.equal(list[1].districtCells,220);assert.equal(list[1].works.length,68);
  assert.equal(list[0].contains(at(62,62)),true);assert.equal(list[0].contains(at(60,54)),false);assert.equal(list[0].contains(at(60,57)),false,'se tenir sur la porte n’est pas être rentré');
  assert.equal(list[1].contains(at(62,62)),true,'une enceinte contient les enceintes intérieures');assert.equal(list[1].contains(at(60,54)),true);assert.equal(list[1].contains(at(60,57)),true);
  assert.equal(list[1].contains(at(60,52)),false);assert.equal(list[1].contains(at(60,40)),false);assert.equal(list[1].contains({x:NaN,y:0}),false);assert.equal(list[1].contains({x:-5,y:-5}),false);
  // L’anneau 1 est exactement l’enceinte intérieure du module de repli.
  const inner=Fallback.innerZone(C,tactics,two());
  assert.equal(inner.cells,list[0].cells);assert.deepEqual(inner.gates.map(g=>g.id),list[0].gates.map(g=>g.id));
});

test('districts : trois enceintes, et le relevé reste borné',()=>{
  const view=Districts.survey(C,tactics,three());
  assert.equal(view.rings.length,3);assert.equal(view.rings[2].name,'Troisième enceinte');assert.equal(view.rings[2].gates[0].gx,75);assert.equal(view.capped,false);
  assert.equal(view.districtOf(at(61,61)),1);assert.equal(view.districtOf(at(60,54)),2);assert.equal(view.districtOf(at(60,48)),3);assert.equal(view.districtOf(at(60,20)),0);
  assert.equal(view.looseWorks.length,0);
  const many=[core(60,60)];for(let i=0;i<10;i++)many.push(...square(1000*(i+1),60,60,2+i*2));
  const capped=Districts.survey(C,tactics,many);
  assert.equal(capped.rings.length,Districts.MAX_RINGS);assert.equal(capped.capped,true);assert.equal(capped.districtOf(at(60,60-19)),0,'au-delà de la borne, c’est dehors');
  assert.equal(Districts.rings(C,tactics,[]).length,0);assert.equal(Districts.survey(C,tactics,square(10,60,60,3)).hasCore,false);
});

test('districts : une enceinte extérieure ouverte n’est pas un district',()=>{
  const list=two();list.find(b=>b.id>=1000&&b.gx===69&&b.gy===60).dead=true;
  const view=Districts.survey(C,tactics,list);
  assert.equal(view.rings.length,1);assert.equal(view.rings[0].gates[0].gy,57);
  assert.equal(view.districtOf(at(60,54)),0,'entre les deux lignes, on est dehors');assert.equal(view.looseWorks.length,67,'les ouvrages de la ligne ouverte restent comptés hors enceinte');
  const inner=two();inner.find(b=>b.id<1000&&b.gx===64&&b.gy===60).dead=true;
  const merged=Districts.rings(C,tactics,inner);
  assert.equal(merged.length,1,'ligne intérieure ouverte : la ligne extérieure devient l’enceinte intérieure');assert.equal(merged[0].gates[0].gy,52);assert.equal(merged[0].contains(at(60,54)),true);
  assert.equal(merged[0].gates.length,1,'la porte d’une ligne tombée n’est pas une porte de l’enceinte');assert.equal(merged[0].strayWorks.length,27);assert.equal(merged[0].works.length,68);
  assert.equal(merged[0].contains(at(60,57)),true,'un reste de ligne intérieure est dans la zone');assert.equal(merged[0].cells,256,'16×16 cases, restes de la ligne intérieure compris');
  const both=two();for(const b of both)if(b.gx===64&&b.gy===60||b.gx===69&&b.gy===60)b.dead=true;
  assert.equal(Districts.rings(C,tactics,both).length,0);
});

test('districts : une porte ouverte reste une limite, un mur épais ne crée pas de district vide',()=>{
  const list=two();for(const b of list)if(b.def.gate)b.gateMode='open';
  const open=Districts.rings(C,tactics,list);
  assert.equal(open.length,2);assert.equal(open[0].contains(at(60,54)),false);assert.equal(T.gateMode(open[0].gates[0]),'open');
  const thick=[core(60,60),...square(100,60,60,3,[60,57]),...square(1000,60,60,4,[60,56])];
  const view=Districts.survey(C,tactics,thick);
  assert.equal(view.rings.length,1,'deux épaisseurs collées forment une seule enceinte');assert.equal(view.rings[0].works.length,28+36);assert.equal(view.rings[0].gates.length,2);
  assert.equal(view.districtOf(at(60,50)),0);
});

test('districts : les faits de chaque district sont exacts',()=>{
  const list=two();
  list.find(b=>b.id>=1000&&b.def.gate).gateMode='closed';
  const weak=list.find(b=>b.id>=1000&&b.gx===69&&b.gy===60);weak.health=100*C.BATTLEFIELD_RULES.fragileWallRatio;
  const stub=wall(5000,60,30);stub.health=1;
  const buildings=[...list,house(2000,62,62),house(2001,60,54),house(2002,62,54,4),house(2003,60,40),{...house(2004,63,54),completed:false},stub];
  const units=[unit('worker',61,62),unit('soldier',60,55),unit('soldier',66,60),unit('medic',60,40),{...unit('soldier',60,55),dead:true},{...unit('worker',60,55),regionAbsent:true}];
  const zombies=[unit('walker',60,53),unit('walker',20,20),unit('walker',21,20),{...unit('walker',61,61),health:0}];
  const facts=Districts.facts(C,tactics,Districts.survey(C,tactics,buildings),{buildings,units,zombies,player:{health:10,dead:false,...at(61,61)}});
  assert.deepEqual(facts.map(d=>d.name),['Enceinte intérieure','Deuxième enceinte','Dehors']);assert.deepEqual(facts.map(d=>d.rank),[1,2,0]);assert.deepEqual(facts.map(d=>d.closed),[true,true,false]);
  const [inner,second,outside]=facts;
  assert.deepEqual([inner.buildings,inner.housing,inner.infected,inner.walls,inner.fragileWalls],[2,8,0,28,0],'centre et dortoir');
  assert.deepEqual(inner.defenders,{total:1,byRole:{worker:1}});assert.equal(inner.commander,true);
  assert.deepEqual(inner.gates,[{id:inner.gates[0].id,mode:'auto'}]);assert.deepEqual(inner.gateModes,{auto:1,open:0,closed:0});
  assert.deepEqual([second.buildings,second.housing,second.infected,second.walls,second.fragileWalls],[2,12,1,68,1]);
  assert.deepEqual(second.defenders,{total:2,byRole:{soldier:2}});assert.equal(second.commander,false);assert.deepEqual(second.gateModes,{auto:0,open:0,closed:1});assert.equal(second.cells,220);
  assert.deepEqual([outside.buildings,outside.housing,outside.infected,outside.walls,outside.fragileWalls,outside.gates.length],[1,8,2,1,1,0]);
  assert.deepEqual(outside.defenders,{total:1,byRole:{medic:1}});
  assert.equal(Districts.describe(C,second),'2 bâtiments · 12 logements · 2 équipiers (2 fusiliers) · 1 porte (1 verrouillée) · 68 ouvrages en service, dont 1 fragile · 1 infecté');
  assert.equal(Districts.describe(C,inner),'2 bâtiments · 8 logements · 1 équipier (1 ouvrier) et vous · 1 porte (1 auto) · 28 ouvrages en service · 0 infecté');
  assert.equal(Districts.describe(C,outside),'1 bâtiment · 8 logements · 1 équipier (1 secouriste) · 1 ouvrage hors enceinte fermée, dont 1 fragile · 2 infectés');
  assert.throws(()=>{second.buildings=9;},TypeError,'le relevé est figé');
});

test('districts : le module ne crée ni stock, ni dégât, ni tirage, ni sauvegarde',()=>{
  const source=fs.readFileSync(path.join(root,'src/districts.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','resources','localStorage','serialize','.save(','setGateMode','retreatSquad','setWorkerOrder'])assert.equal(source.includes(forbidden),false,forbidden);
  for(const write of [/\.health\s*[-+*/]?=[^=]/,/gateMode\s*=[^=]/,/workerOrder\s*=[^=]/,/\.squads\s*=[^=]/,/\.(wood|scrap|food|ammo|stone|fuel|medicine|water)\s*[-+]?=[^=]/])assert.doesNotMatch(source,write);
  {const h=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(h.indexOf('src/fallback-order.js')>0&&h.indexOf('src/fallback-order.js')<h.indexOf('src/districts.js'));};
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('"src/districts.js"'));
});

function campaign(){
  const {g,doc}=bootDocument134();Fallback.install(g,doc);Districts.install(g,doc);g.startNew('standard','17117');g.campaignIntro132?.skip?.();
  return {g,doc};
}
// Enceinte de palissades réelle autour du centre, avec une porte (2 cases de large) au nord.
function enclose(g,r){
  const center=g.core(),cells=T.footprint(center),placed=[];
  const put=(type,gx,gy)=>{const B=center.constructor,b=new B(g.nextId++,type,gx,gy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);placed.push(b);return b;};
  const x0=cells.x-r,x1=cells.x+cells.width+r-1,y0=cells.y-r,y1=cells.y+cells.height+r-1,gateX=cells.x;
  for(let x=x0;x<=x1;x++){if(x===gateX)put('gate',x,y0);else if(x!==gateX+1)put('woodWall',x,y0);put('woodWall',x,y1);}
  for(let y=y0+1;y<y1;y++){put('woodWall',x0,y);put('woodWall',x1,y);}
  g.world.navigationVersion++;g.refreshMetrics(true);
  return {placed,gate:placed.find(b=>T.isGate(b)),north:d=>({x:center.x,y:(y0-d+.5)*C.TILE})};
}
const stable=g=>{const save=JSON.parse(JSON.stringify(g.serialize()));delete save.timestamp;return save;};

test('districts : dans une campagne réelle, le carnet liste les districts sans rien modifier',()=>{
  const {g,doc}=campaign();
  assert.deepEqual(g.districts.list().map(d=>d.name),['Dehors']);
  g.districts.refresh();assert.match(doc.getElementById('districtsState').textContent,/^Aucune enceinte fermée/);
  const a=enclose(g,3),b=enclose(g,7);
  const before=stable(g),stock=JSON.stringify(g.resources);
  const list=g.districts.list();g.districts.refresh();g.updateUI();g.districts.rings();g.districts.line();
  assert.deepEqual(stable(g),before,'aucun effet sur la sauvegarde');assert.equal(JSON.stringify(g.resources),stock);
  assert.deepEqual(list.map(d=>d.name),['Enceinte intérieure','Deuxième enceinte','Dehors']);
  assert.deepEqual(g.districts.rings().map(ring=>ring.gates.map(gate=>gate.id)),[[a.gate.id],[b.gate.id]]);
  assert.equal(list[0].walls,a.placed.length);assert.equal(list[1].walls,b.placed.length);
  assert.ok(list[0].buildings>=1,'le centre compte');
  // Les totaux par district recouvrent exactement l’état réel.
  const sum=key=>list.reduce((n,d)=>n+key(d),0);
  assert.equal(sum(d=>d.defenders.total),g.units.filter(u=>!u.dead&&u.health>0&&!u.regionAbsent).length);
  assert.equal(sum(d=>d.infected),g.zombies.filter(z=>!z.dead&&z.health>0).length);
  assert.equal(sum(d=>d.housing),g.housing,'les logements par district font le total de la cité');
  assert.equal(sum(d=>d.commander?1:0),1);
  const rows=doc.getElementById('districtsList').children;
  assert.equal(rows.length,3);assert.equal(rows[1].children[0].textContent,'Deuxième enceinte');assert.equal(rows[1].children[1].textContent,Districts.describe(C,list[1]));
  assert.match(doc.getElementById('districtsState').textContent,/^2 enceintes fermées/);
  assert.equal(doc.getElementById('districtsLine').hidden,false);assert.equal(doc.getElementById('districtsLine').children.length,2);
  // Un infecté réel entre dans la deuxième enceinte : il y est compté, nulle part ailleurs.
  const p=a.north(2);g.zombies.push({id:999999,x:p.x,y:p.y,health:10,dead:false,kind:'walker'});
  const after=g.districts.list();assert.equal(after[1].infected,list[1].infected+1);assert.equal(after[0].infected,list[0].infected);
  // Un mur extérieur tombe : il ne reste qu’un district.
  const top=Math.min(...b.placed.map(w=>w.gy)),lost=b.placed.find(w=>!T.isGate(w)&&w.gy===top&&w.gx===T.footprint(g.core()).x+3);
  lost.health=0;lost.dead=true;g.world.navigationVersion++;
  assert.deepEqual(g.districts.list().map(d=>d.name),['Enceinte intérieure','Dehors']);
  g.districts.refresh();assert.equal(doc.getElementById('districtsList').children.length,2);assert.equal(doc.getElementById('districtsLine').hidden,true);
});

test('districts : la ligne de repli général peut être la deuxième enceinte',()=>{
  const {g}=campaign(),a=enclose(g,3),b=enclose(g,7);
  const status=()=>g.fallbackOrder.status(),between=a.north(2),outside=b.north(3),center={x:g.core().x,y:g.core().y+C.TILE*2};
  assert.equal(g.districts.lineRank(),1,'par défaut : l’enceinte intérieure');assert.equal(status().line,'Enceinte intérieure');
  assert.equal(g.districts.setLine(3),false);assert.equal(g.districts.setLine(0),false);assert.equal(g.districts.setLine(2),true);
  assert.equal(g.districts.lineRank(),2);assert.equal(status().line,'Deuxième enceinte');assert.equal(status().lineGates,1);
  assert.equal(status().closed,true);assert.equal(status().gates,1,'l’état de l’enceinte intérieure reste celui de l’anneau 1');
  const straggler=g.units.find(u=>!u.dead);for(const u of g.units){u.x=between.x;u.y=between.y;}g.player.x=center.x;g.player.y=center.y;
  straggler.x=outside.x;straggler.y=outside.y;
  assert.equal(g.fallbackOrder.everyone(),true);assert.equal(g.workerOrder,'retreat');
  assert.equal(g.districts.setLine(1),false,'pas de changement de ligne pendant un repli général');
  g.fallbackOrder.tick();assert.equal(status().outside,1);assert.equal(T.gateMode(b.gate),'auto','un retardataire au-delà de la ligne : rien n’est fermé');
  straggler.x=between.x;straggler.y=between.y;
  g.fallbackOrder.tick();
  assert.equal(status().sealed,true);assert.equal(T.gateMode(b.gate),'closed','la porte de la deuxième enceinte est verrouillée');
  assert.equal(T.gateMode(a.gate),'auto','la porte intérieure garde son mode : les équipiers entre les deux lignes peuvent encore rentrer');
  assert.equal(g.fallbackOrder.standDown(),true);assert.equal(T.gateMode(b.gate),'auto');assert.equal(g.workerOrder,'auto');
  assert.equal(g.districts.setLine(1),true);
  // La ligne choisie tombe : le repli revient à l’enceinte encore fermée.
  assert.equal(g.districts.setLine(2),true);
  const top=Math.min(...b.placed.map(w=>w.gy)),lost=b.placed.find(w=>!T.isGate(w)&&w.gy===top&&w.gx===T.footprint(g.core()).x+3);
  lost.health=0;lost.dead=true;g.world.navigationVersion++;
  assert.equal(g.districts.lineRank(),1);assert.equal(status().line,'Enceinte intérieure');
  for(const u of g.units){u.x=center.x;u.y=center.y;}
  assert.equal(g.fallbackOrder.everyone(),true);g.fallbackOrder.tick();
  assert.equal(T.gateMode(a.gate),'closed');assert.equal(T.gateMode(b.gate),'auto');
  // Une nouvelle campagne repart de l’enceinte intérieure.
  g.startNew('standard','17118');g.campaignIntro132?.skip?.();assert.equal(g.districts.lineRank(),0);
  enclose(g,3);enclose(g,7);assert.equal(g.districts.lineRank(),1);
});
