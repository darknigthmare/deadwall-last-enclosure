'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),Geo=require('../src/geography135.js'),W=require('../src/frontier-world.js');
const networks=new Map();function network(seed){if(networks.has(seed))return networks.get(seed);const roads=[],g=Geo.generate(seed,{addRoad:(a,b,width)=>{const r={id:'r'+roads.length,a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]},width};roads.push(r);return r;}});const result={...g,roads};networks.set(seed,result);return result;}
const worlds=new Map();function world(seed=17117){if(!worlds.has(seed))worlds.set(seed,W.create(seed,6));return worlds.get(seed);}
test('G6 : ancre propre à chaque graine, espace généreux des quatre côtés et historique intact',()=>{
 const seen=new Set();for(const seed of[0,42,17117,84329,903145,4294967295]){const h=Geo.home(seed,6);assert.ok(Object.isFrozen(h));assert.ok(h.minX>8000&&h.minY>8000&&24576-h.maxX>8000&&24576-h.maxY>8000);seen.add(h.x+','+h.y);assert.deepEqual(Geo.home(seed,5),{x:4096,y:4096,size:128,minX:4032,minY:4032,maxX:4160,maxY:4160});}assert.equal(seen.size,6);assert.deepEqual(Geo.home(42,6),Geo.home(42,6));
});
test('G6 : réseau déterministe sans grille orthogonale commune',()=>{
 const a=network(17117),b=network(84329);assert.notDeepEqual(a.towns.map(t=>[t.x,t.y]),b.towns.map(t=>[t.x,t.y]));const copy=[],c=Geo.generate(17117,{addRoad:(a,b,width)=>{const r={a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]},width};copy.push(r);return r;}});assert.deepEqual(a.nodes,c.nodes);assert.deepEqual(a.roads.map(({a,b,width})=>({a,b,width})),copy.map(({a,b,width})=>({a,b,width})));assert.equal(a.towns.length,34);const axes=a.roads.filter(r=>Math.abs(r.a.x-r.b.x)<.01||Math.abs(r.a.y-r.b.y)<.01);assert.ok(axes.length/a.roads.length<.06);assert.equal(new Set(a.towns.map(t=>Math.round(t.x))).size,34);
});
test('G6 : chaque agglomération et les quatre limites appartiennent au même réseau',()=>{
 for(const seed of[42,17117,84329]){const n=network(seed),seen=new Set([n.nodes[0].id]);for(let step=0;step<n.nodes.length;step++)for(const e of n.edges){if(seen.has(e.a))seen.add(e.b);if(seen.has(e.b))seen.add(e.a);}assert.equal(seen.size,n.nodes.length);assert.equal(n.nodes.filter(x=>x.kind==='terminal').length,4);for(const r of n.roads)for(const p of[r.a,r.b])assert.ok(p.x>=60&&p.y>=60&&p.x<=24516&&p.y<=24516);}
});
test('G6 : seuls les raccords axiaux D-17 traversent son emprise',()=>{
 for(const seed of[42,17117,84329]){const n=network(seed),h=n.home,box={x:h.minX-20,y:h.minY-20,w:168,h:168};for(const r of n.roads){if(r.roadClass==='approach'){assert.ok(r.a.x===h.x&&r.b.x===h.x||r.a.y===h.y&&r.b.y===h.y);}else assert.equal(G.segmentRect(r.a,r.b,box),false,r.corridor);}}
});
test('G6 : région complète, programmes conservés, secteurs et accès physiques cohérents',()=>{
 const w=world();assert.equal(w.size,24576);assert.deepEqual(w.home,Geo.home(17117,6));assert.equal(w.sectors.length,576);assert.ok(w.pois.length>=350);assert.equal(new Set(w.pois.map(p=>p.type)).size,G.PRESETS.length);for(const p of w.pois){assert.ok(p.generation===6&&p.biome&&p.frontier131);assert.ok(p.reserve.l>=40&&p.reserve.t>=40&&p.reserve.r<=24536&&p.reserve.b<=24536);assert.ok(w.nearestRoad(p.drive.a).d<.05,p.id+' accès');assert.ok(w.sectors.find(s=>s.id===p.sector).sites.includes(p.id));for(const r of w.roads)assert.equal(G.segmentRect(G.local(p,r.a.x,r.a.y),G.local(p,r.b.x,r.b.y),{x:0,y:0,w:p.w,h:p.h}),false,p.id+' route '+r.id);}
});
test('G6 : parcelles et routes de la même graine restent stables entre instances',()=>{
 const a=world(),b=W.create(17117,6);assert.deepEqual(a.pois,b.pois);assert.deepEqual(a.roads,b.roads);assert.deepEqual(a.towns,b.towns);const other=world(84329);assert.notDeepEqual(a.home,other.home);assert.notDeepEqual(a.pois.slice(0,8),other.pois.slice(0,8));
});
test('G6 : le vrai graphe de navigation relie chaque accès à D-17',()=>{
 const Route=require('../src/frontier-routing.js');for(const w of[world(),world(84329)]){const graph=Route.graph(w),origin=graph.tracks[w.roads.indexOf(w.nearestRoad(w.home).road)][0].id,queue=[origin],seen=new Set(queue);for(let i=0;i<queue.length;i++)for(const[next]of graph.edges[queue[i]])if(!seen.has(next)){seen.add(next);queue.push(next);}for(const p of w.pois){const nearest=w.nearestRoad(p.drive.a);assert.ok(graph.tracks[w.roads.indexOf(nearest.road)].some(node=>seen.has(node.id)),p.id+' itinéraire');}}
});
test('G6 : toutes les faces de D-17 débouchent sur un terrain sans obstacle',()=>{
 for(const w of[world(),world(84329)]){const h=w.home;for(let d=-63;d<=63;d+=7)for(const[x,y]of[[h.minX-4,h.y+d],[h.maxX+4,h.y+d],[h.x+d,h.minY-4],[h.x+d,h.maxY+4]]){assert.equal(w.blocked(x,y,.5),false,`${w.seed}:${x},${y}`);assert.equal(w.vehicleClear(x,y,0),true);}}
});
test('G6 : annexes réservées, chaussées entre leurs colonnes et aucun décor dans les futurs bâtiments',()=>{
 for(const w of[world(),world(84329)])for(const d of Geo.annexes(w.seed,6)){
  const pose={...d,w:0,h:0};for(let slot=0;slot<8;slot++){const box={x:-22+slot%2*28,y:-22+Math.floor(slot/2)*13,w:20,h:9};for(const r of w.roads){const pad=r.width/2;assert.equal(G.segmentRect(G.local(pose,r.a.x,r.a.y),G.local(pose,r.b.x,r.b.y),{x:box.x-pad,y:box.y-pad,w:box.w+2*pad,h:box.h+2*pad}),false,d.id+' slot '+slot+' '+r.id);}}
  const reservation=Geo.reservations(w.seed,6).find(p=>p.id===d.id);for(const p of w.pois)assert.equal(G.overlap(p.reserve,reservation),false,d.id+' '+p.id);for(const chunk of w.around(d.x,d.y,45))for(const p of[...chunk.trees,...chunk.rocks])assert.equal(p.x>reservation.l&&p.x<reservation.r&&p.y>reservation.t&&p.y<reservation.b,false,d.id+' '+p.id);
 }
});
test('G6 : un biome rare dispose aussi de routes et de tous ses programmes visitables',()=>{
 const w=world(0);assert.equal(new Set(w.towns.map(t=>t.biome)).size,12);assert.equal(new Set(w.pois.map(p=>p.type)).size,G.PRESETS.length);for(const t of w.towns)assert.ok(w.pois.some(p=>p.town===t.id),t.id+' peuplement');
});
test('G6 : trois implantations urbaines et rues secondaires réparties entre plusieurs carrefours',()=>{
 const w=world();assert.deepEqual([...new Set(w.towns.map(t=>t.layout))].sort(),['bourg','quartier','village-rue']);for(const t of w.towns){const starts=new Map();for(const r of w.geography.roads)if(r.corridor.startsWith(t.id+'_street')&&!starts.has(r.corridor))starts.set(r.corridor,r.a);assert.ok(starts.size>=2,t.id+' rues');assert.ok(new Set([...starts.values()].map(p=>p.x.toFixed(4)+','+p.y.toFixed(4))).size>=2,t.id+' carrefours');for(const p of starts.values())assert.ok(Math.hypot(p.x-t.x,p.y-t.y)>10,t.id+' sommet unique');}
});
test('G6 : éviction de chunks ne recrée pas un décor différent ni ne dépasse le cache',()=>{
 const w=world(),h=w.home,cx=Math.floor((h.x+700)/256),cy=Math.floor((h.y+450)/256),before=structuredClone(w.chunk(cx,cy));for(let i=0;i<40;i++)w.chunk(i,2);assert.ok(w.cacheSize()<=W.RULES.chunkCache);assert.deepEqual(w.chunk(cx,cy),before);for(const item of[...before.trees,...before.rocks]){assert.ok(/^[TR]\d+_\d+_\d+$/.test(item.id));const n=w.nearestRoad(item);assert.ok(n.d>n.road.width/2+item.r);}
});
test('récolte : un rocher épuisé ne laisse pas de collision invisible, les souches restent visibles et petites',()=>{
 const taken={},w=W.create(17117,3,{resourceTaken:id=>taken[id]||0}),c=w.chunk(0,0);c.trees.length=0;c.rocks.length=0;const rock={id:'R0_0_999',x:130,y:130,r:.8,a:0,kind:'rock',resource:'stone',amount:10},tree={id:'T0_0_999',x:140,y:130,r:.4,canopy:3,a:0,kind:'tree',resource:'wood',amount:10};c.rocks.push(rock);c.trees.push(tree);assert.equal(w.blocked(rock.x,rock.y),true);assert.equal(w.line({x:128,y:130},{x:132,y:130}),false);assert.equal(w.vehicleClear(rock.x,rock.y,0),false);taken[rock.id]=10;assert.equal(w.blocked(rock.x,rock.y),false);assert.equal(w.line({x:128,y:130},{x:132,y:130}),true);assert.equal(w.vehicleClear(rock.x,rock.y,0),true);assert.equal(w.blocked(tree.x+.3,tree.y,.05),true);taken[tree.id]=10;assert.equal(w.blocked(tree.x+.3,tree.y,.05),false);assert.equal(w.blocked(tree.x,tree.y,.05),true);assert.equal(w.line({x:139,y:130},{x:141,y:130}),false);
});
