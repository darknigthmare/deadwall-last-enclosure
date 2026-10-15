'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const P = require('../src/power-network173.js'), T = require('../src/transit-network173.js');
const spec = () => ({ id:'yard-power', nodes:[
  {id:'generator',kind:'source',capacityW:1000,fuelPerKWh:.4,idleFuelPerHour:.1,tankCapacity:10,level:0},
  {id:'panel',kind:'breaker',level:0},{id:'lamp',kind:'load',demandW:100,priority:10,level:0},
  {id:'pump',kind:'load',demandW:800,priority:1,level:0}
],edges:[{id:'feed',from:'generator',to:'panel',capacityW:1000},{id:'light',from:'panel',to:'lamp',capacityW:1000},{id:'motor',from:'panel',to:'pump',capacityW:1000}]});
function filled(net, fuel=1){let s=P.transferFuel(net,P.initial(net),{fuel},'generator',fuel).state;for(const id of ['generator','panel','lamp','pump'])s=P.switchNode(net,s,id,true);return s;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('électricité : aucune réserve ni source active à la création ou migration vide',()=>{
 const n=P.compile(spec()),a=P.initial(n);assert.equal(a.fuel.generator,0);assert.ok(Object.values(a.switches).every(x=>x===false));assert.deepEqual(P.normalize(n,undefined),a);const r=P.step(n,a,60);assert.equal(r.energyWh,0);assert.equal(r.state.fuel.generator,0);
});
test('électricité : carburant réellement transféré, réservoir borné, réserve et entrées conservées',()=>{
 const n=P.compile(spec()),a=P.initial(n),inventory={fuel:12,scrap:7},r=P.transferFuel(n,a,inventory,'generator',12);assert.equal(r.moved,10);assert.equal(r.inventory.fuel,2);assert.equal(r.state.fuel.generator,10);assert.equal(a.fuel.generator,0);assert.deepEqual(inventory,{fuel:12,scrap:7});assert.equal(r.inventory.scrap,7);assert.throws(()=>P.transferFuel(n,filled(n),inventory,'generator',1));
});
test('électricité : puissance et consommation à vide sont payées une fois, avec débit proportionnel',()=>{
 const n=P.compile(spec()),s=filled(n),before=JSON.stringify(s),r=P.step(n,s,60);assert.equal(r.loads.lamp.powered,true);assert.equal(r.loads.pump.powered,true);assert.equal(r.sourceUsage.generator,900);assert.equal(r.usage.feed,900);near(r.energyWh,15);near(r.consumed.generator,.006+.1/60);near(r.state.fuel.generator,1-r.consumed.generator);assert.equal(JSON.stringify(s),before);
});
test('électricité : 60 pas et un pas de 60 secondes conservent la même réserve',()=>{
 const n=P.compile(spec()),s=filled(n),a=P.step(n,s,60);let b=s,wh=0;for(let i=0;i<60;i++){const r=P.step(n,b,1);b=r.state;wh+=r.energyWh;}near(b.fuel.generator,a.state.fuel.generator);near(wh,a.energyWh);
});
test('électricité : pause, temps nul, coupure source, tableau et câble arrêtent le débit utile',()=>{
 const n=P.compile(spec()),s=filled(n);assert.deepEqual(P.step(n,s,60,{paused:true}).state,s);assert.deepEqual(P.step(n,s,0).state,s);
 for(const disabled of [P.switchNode(n,s,'generator',false),P.switchNode(n,s,'panel',false),P.cableState(n,s,'feed',false)])assert.equal(P.step(n,disabled,60).energyWh,0);
 const r=P.step(n,P.cableState(n,s,'motor',false),60);assert.equal(r.loads.lamp.powered,true);assert.equal(r.loads.pump.reason,'cable-broken');
});
test('électricité : priorités ne dépassent ni le câble commun ni la source, carburant épuisé non négatif',()=>{
 const d=spec();d.edges[0].capacityW=500;const n=P.compile(d),r=P.step(n,filled(n),60);assert.equal(r.loads.lamp.powered,true);assert.equal(r.loads.pump.reason,'cable-capacity');assert.equal(r.usage.feed,100);
 const depleted=P.step(n,filled(n,.00001),60);assert.equal(depleted.energyWh,0);assert.equal(depleted.state.fuel.generator,0);
});
test('électricité : sauvegarde détachée et rejet des valeurs, identifiants, niveaux et doubles alimentations',()=>{
 const n=P.compile(spec()),s=filled(n);assert.deepEqual(P.normalize(n,JSON.parse(JSON.stringify(s))),s);
 for(const value of [-1,NaN,Infinity,'1',null])assert.throws(()=>P.normalize(n,{...s,fuel:{generator:value}}));
 assert.throws(()=>P.normalize(n,{...s,intact:{...s.intact,foreign:true}}));assert.throws(()=>P.switchNode(n,s,'ghost',true));
 const d=spec();d.nodes[2].level=1;assert.throws(()=>P.compile(d));d.edges[1].riser=true;assert.ok(P.compile(d));
 d.edges.push({id:'double-feed',from:'generator',to:'lamp',capacityW:1000,riser:true});assert.throws(()=>P.compile(d));
 for(const dt of [-1,61,NaN,Infinity,'1'])assert.throws(()=>P.step(n,s,dt));
});
test('électricité : boucle non alimentée refusée et charge isolée reste hors tension',()=>{
 assert.throws(()=>P.compile({id:'loop',nodes:[{id:'a',kind:'junction'},{id:'b',kind:'junction'}],edges:[{id:'ab',from:'a',to:'b',capacityW:10},{id:'ba',from:'b',to:'a',capacityW:10}]}));
 const n=P.compile({id:'isolated',nodes:[{id:'lamp',kind:'load',demandW:100}],edges:[]}),s=P.switchNode(n,P.initial(n),'lamp',true);assert.equal(P.step(n,s,1).loads.lamp.reason,'no-source');
});
test('tunnel : entrée, galerie et sortie reliées, route croisée en surface non raccordée',()=>{
 const n=T.tunnel(),r=T.route(n,'west','east','vehicle');assert.equal(r.length,360);assert.equal(r.steps.length,4);assert.equal(T.route(n,'west','surfaceNorth','vehicle'),null);assert.equal(T.route(n,'west','refuge','vehicle'),null);assert.ok(T.route(n,'west','refuge','foot'));
});
test('tunnel : fermeture physique et trajet inverse sont déterministes sans mutation',()=>{
 const n=T.tunnel(),before=JSON.stringify(n);assert.equal(T.route(n,'west','east','vehicle',['galleryEast']),null);const r=T.route(n,'east','west','vehicle');assert.equal(r.steps[0].from,'east');assert.deepEqual(r.steps[0].points[0],[180,0]);assert.equal(JSON.stringify(n),before);assert.deepEqual(T.route(n,'east','west','vehicle'),r);
});
test('échangeur : quatre bretelles explicites, aucune jonction inventée entre pont et chaussée',()=>{
 const n=T.interchange();assert.equal(n.edges.filter(e=>e.kind==='ramp').length,4);
 for(const from of ['west','east','north','south'])for(const to of ['west','east','north','south'])assert.ok(T.route(n,from,to,'vehicle'));
 const closed=n.edges.filter(e=>e.kind==='ramp').map(e=>e.id);assert.equal(T.route(n,'west','north','vehicle',closed),null);assert.ok(T.route(n,'west','east','vehicle',closed));assert.ok(T.route(n,'north','south','vehicle',closed));assert.equal(T.route(n,'west','east','foot'),null);
});
test('ports : côte obligatoire, voies terrestres et nautiques séparées à toutes orientations',()=>{
 assert.throws(()=>T.port());assert.throws(()=>T.port({a:[0,0],b:[20,0],waterSide:'left'}));
 for(const b of [[300,0],[0,300],[-300,0],[0,-300]])for(const waterSide of ['left','right']){
  const p=T.port({a:[0,0],b,waterSide}),n=p.graph;assert.ok(T.route(n,'gate','quayEast','vehicle'));assert.ok(T.route(n,'waterWest','waterEast','boat'));assert.equal(T.route(n,'gate','waterWest','foot'),null);assert.equal(T.route(n,'waterWest','waterEast','vehicle'),null);assert.equal(p.loadingPairs.length,2);assert.ok(Object.isFrozen(p));
 }
});
test('réseau : borne absente, escaliers carrossables, rampe trop raide et tracés incohérents sont refusés',()=>{
 const nodes=[{id:'a',x:0,y:0,level:0},{id:'b',x:20,y:0,level:1}],edge={id:'ab',from:'a',to:'b',modes:['vehicle']};
 assert.throws(()=>T.compile({id:'bad',nodes,edges:[edge]}));assert.throws(()=>T.compile({id:'bad',nodes,edges:[{...edge,kind:'stairs'}]}));assert.throws(()=>T.compile({id:'bad',nodes,edges:[{...edge,kind:'ramp',riseM:6}]}));
 assert.throws(()=>T.compile({id:'bad',nodes,edges:[{...edge,kind:'portal',points:[[0,0],[99,0]]}]}));assert.throws(()=>T.route(T.tunnel(),'unknown','east'));
});

test('navigateurs : modules hors ligne exposés sans stockage, DOM, timer ou réseau',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),context={};vm.createContext(context);
 for(const name of ['../src/power-network173.js','../src/transit-network173.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,name),'utf8'),context);
 assert.equal(typeof context.DeadwallPower173.step,'function');assert.equal(typeof context.DeadwallTransit173.route,'function');
});
