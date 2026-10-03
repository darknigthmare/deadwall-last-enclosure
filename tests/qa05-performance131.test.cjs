'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),G=require('../src/frontier-geometry.js');
require('../src/core.js');
const W=require('../src/frontier-world.js'),Routing=require('../src/frontier-routing.js'),{boot131}=require('./helpers/expansions131.cjs');
// Frozen pre-optimization oracle: independent graph construction and exhaustive Dijkstra.
const Legacy=(()=>{const module={exports:{}},globalThis={DeadwallFrontierGeometry:G};
/* Read-only road guidance. It neither moves actors nor promises an obstacle-free off-road connector. */
(function(root){'use strict';const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null),graphs=new WeakMap();
function graph(world){if(graphs.has(world))return graphs.get(world);const roads=world.roads,stops=roads.map(r=>[0,1]),nodes=[],edges=[],ids=new Map(),point=(r,t)=>({x:r.a.x+(r.b.x-r.a.x)*t,y:r.a.y+(r.b.y-r.a.y)*t});
 const add=(p)=>{const key=Math.round(p.x*100)+','+Math.round(p.y*100);if(!ids.has(key)){ids.set(key,nodes.length);nodes.push(p);edges.push([]);}return ids.get(key);};
 for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){const a=roads[i],b=roads[j],ax=a.b.x-a.a.x,ay=a.b.y-a.a.y,bx=b.b.x-b.a.x,by=b.b.y-b.a.y,den=ax*by-ay*bx,dx=b.a.x-a.a.x,dy=b.a.y-a.a.y;if(Math.abs(den)>1e-8){const t=(dx*by-dy*bx)/den,u=(dx*ay-dy*ax)/den;if(t>=0&&t<=1&&u>=0&&u<=1){stops[i].push(t);stops[j].push(u);}}else{for(const p of [a.a,a.b]){const q=G.nearest(p,b.a,b.b);if(q.d<.02)stops[j].push(q.t);}for(const p of [b.a,b.b]){const q=G.nearest(p,a.a,a.b);if(q.d<.02)stops[i].push(q.t);}}}
 const tracks=roads.map((r,i)=>{const ts=[...new Set(stops[i])].sort((a,b)=>a-b),out=ts.map(t=>({t,id:add(point(r,t))}));for(let k=1;k<out.length;k++){const a=out[k-1].id,b=out[k].id,d=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y);edges[a].push([b,d]);edges[b].push([a,d]);}return out;});const value={nodes,edges,tracks};graphs.set(world,value);return value;}
function route(world,from,poi){if(!from||!Number.isFinite(from.x)||!Number.isFinite(from.y)||!world?.roads?.length||!poi?.drive||![poi.drive.a,poi.drive.b].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;const g=graph(world),a=world.nearestRoad(from),end=poi.drive.a,b=world.nearestRoad(end);if(!a?.road||!b?.road)return null;const ai=world.roads.indexOf(a.road),bi=world.roads.indexOf(b.road);if(ai<0||bi<0)return null;const dist=new Float64Array(g.nodes.length),parent=new Int32Array(g.nodes.length),done=new Uint8Array(g.nodes.length);dist.fill(Infinity);parent.fill(-1);
 const links=(near,index)=>g.tracks[index].map(p=>[p.id,Math.hypot(g.nodes[p.id].x-near.x,g.nodes[p.id].y-near.y)]);for(const[id,d]of links(a,ai))dist[id]=d;
 for(let count=0;count<g.nodes.length;count++){let u=-1,best=Infinity;for(let i=0;i<dist.length;i++)if(!done[i]&&dist[i]<best){best=dist[i];u=i;}if(u<0)break;done[u]=1;for(const[v,cost]of g.edges[u])if(best+cost<dist[v]){dist[v]=best+cost;parent[v]=u;}}
 let last=-1,roadLength=Infinity;for(const[id,d]of links(b,bi))if(dist[id]+d<roadLength){roadLength=dist[id]+d;last=id;}
 let pts=[];if(ai===bi&&Math.hypot(a.x-b.x,a.y-b.y)<=roadLength){roadLength=Math.hypot(a.x-b.x,a.y-b.y);}else{if(last<0)return null;for(let id=last;id>=0;id=parent[id])pts.push(g.nodes[id]);pts.reverse();}const arrival=poi.drive.b,connector=a.d+Math.hypot(arrival.x-b.x,arrival.y-b.y),path=[{x:from.x,y:from.y},{x:a.x,y:a.y},...pts,{x:b.x,y:b.y},{x:arrival.x,y:arrival.y}];return{path,metres:roadLength+connector,roadMetres:roadLength,connectorMetres:connector};}
const api={route,graph};root.DeadwallFrontierRouting=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);

return module.exports;})();
function custom(segments){const roads=segments.map(([x1,y1,x2,y2],id)=>({id:'test'+id,a:{x:x1,y:y1},b:{x:x2,y:y2}}));return{roads,nearestRoad:p=>{let best;for(const road of roads){const n=G.nearest(p,road.a,road.b);if(!best||n.d<best.d)best={...n,road};}return best;}};}
const target=p=>({drive:{a:{...p},b:{x:p.x+.037,y:p.y-.019}}});
let large;const world=()=>large||(large=W.create(17117,5));
function compare(w,from,to){assert.deepEqual(Routing.route(w,from,to),Legacy.route(w,from,to));}

test('QA05 : graphes et chemins exactement identiques à l’oracle G1–G5, y compris chemins égaux',()=>{
 for(const generation of [1,2,3,4,5]){const w=generation===5?world():W.create(17117,generation);assert.deepEqual(Routing.graph(w),Legacy.graph(w),'graphe G'+generation);for(let i=0;i<9;i++){const p=w.pois[Math.floor(i*(w.pois.length-1)/8)];compare(w,{x:4096+i*.017,y:4096-i*.029},p);}}
 const segments=[[0,0,10,0],[10,0,10,10],[10,10,0,10],[0,10,0,0],[5,0,5,10],[0,5,10,5],[10,.019,20,.019],[20,.0201,30,.0201],[4,0,6,0],[4,0,4,0],[40,40,50,50]];
 for(let i=0;i<30;i++)segments.push([G.hash(i,'a')%30,G.hash(i,'b')%30,G.hash(i,'c')%30,G.hash(i,'d')%30]);
 const w=custom(segments);assert.deepEqual(Routing.graph(w),Legacy.graph(w));for(const from of [{x:0,y:0},{x:5,y:0},{x:4.000001,y:0},{x:40,y:40}])for(const end of [{x:10,y:10},{x:10,y:5},{x:10.0001,y:.019},{x:49,y:49}])compare(w,from,target(end));
});

test('QA05 : arrivées fractionnaires, routes déconnectées et entrées invalides conservées',()=>{
 const w=custom([[0,0,10,0],[10,0,10,10],[20,20,30,20]]);
 for(const x of [0,Number.EPSILON,.0000001,.4999999,.5,9.9999999,10])for(const y of [0,.0000001,.5,9.9999999,10])compare(w,{x,y:0},target({x:10,y}));
 assert.equal(Routing.route(w,{x:0,y:0},target({x:29,y:20})),null);
 for(const p of [null,{x:NaN,y:0},{x:0,y:Infinity},{x:'0',y:0}])assert.equal(Routing.route(w,p,target({x:10,y:1})),null);
 assert.equal(Routing.route(w,{x:0,y:0},{drive:{a:{x:1,y:1},b:{x:NaN,y:0}}}),null);
 const a=Routing.route(w,{x:.000001,y:0},target({x:10,y:1})),b=Routing.route(w,{x:.000002,y:0},target({x:10,y:1}));assert.notEqual(a.metres,b.metres);assert.notEqual(a.path[0].x,b.path[0].x);
});

test('QA05 : cache des sources exact, LRU borné à quatre et isolé par monde',()=>{
 const w=custom([[0,0,100,0],[100,0,100,100]]),to=target({x:100,y:80}),at=x=>Routing.route(w,{x,y:0},to);
 for(const x of [1,2,3,4])at(x);assert.equal(Routing.stats(w).searches,4);at(1);at(5);const hot=Routing.stats(w);at(1);assert.equal(Routing.stats(w).searches,hot.searches);const before=Routing.stats(w);at(2);assert.equal(Routing.stats(w).searches,before.searches+1);
 for(let i=0;i<100;i++)at(20+i/200);assert.equal(Routing.stats(w).sources,4);assert.equal(Routing.stats(w).sourceBytes,Routing.graph(w).nodes.length*12*4);
 const result=at(2);result.path[0].x=999;assert.equal(at(2).path[0].x,2);
 const other=custom([[0,0,100,0],[100,0,100,100]]);assert.equal(Routing.stats(other).sources,0);compare(other,{x:2,y:0},to);assert.equal(Routing.stats(other).searches,1);
});

test('QA05 : réseau G5 couvert, travail de jonction réduit et parcours de tous les lieux sans génération détaillée',()=>{
 const w=world(),g=Routing.graph(w),start={x:4096,y:4096};assert.ok(Routing.stats(w).pairChecks<w.roads.length*(w.roads.length-1)/40);assert.ok(g.nodes.length>1000);
 const chunks=w.cacheSize(),plans=w.planCacheSize();for(const p of w.pois){const r=Routing.route(w,start,p);assert.ok(r&&Number.isFinite(r.metres),p.id);assert.deepEqual(r.path.at(-1),p.drive.b);}
 assert.equal(w.cacheSize(),chunks);assert.equal(w.planCacheSize(),plans);assert.ok(Routing.stats(w).sources<=4);
});

test('QA05 : eviction des chunks/plans conserve géométrie, prélèvements et victimes sauvegardées',()=>{
 const {g}=boot131(),w=g.frontier.world(),chunk=w.chunk(95,95),tree=chunk.trees[0],p=w.pois.find(p=>w.threatCount(p)>0),raw=g.serialize();assert.ok(tree);
 raw.frontier.taken[tree.id]=Math.min(3,tree.amount);raw.frontier.enemies[p.id+':e0']=0;raw.frontier.kills=1;raw.frontier.seen=[p.id];g.restoreSave(raw);
 const active=g.frontier.world(),before=g.frontier.snapshot(),first=active.chunk(95,95),detail=active.plan(p,0);
 for(let i=0;i<24;i++)active.chunk(i,80);assert.equal(active.chunk(95,95),first);active.chunk(24,80);assert.equal(active.chunk(95,95),first,'recently used chunk survives');
 const old=active.chunk(0,80);for(let i=30;i<80;i++){active.chunk(i,80);assert.ok(active.cacheSize()<=25);}assert.notEqual(active.chunk(0,80),old);assert.deepEqual(active.chunk(95,95),first);
 const others=active.pois.filter(q=>q!==p);for(const place of others.slice(0,47))active.plan(place,0);assert.equal(active.plan(p,0),detail);active.plan(others[47],0);assert.equal(active.plan(p,0),detail,'recently used plan survives');
 const coldPlan=active.plan(others[0],0);for(const place of others.slice(48,110)){active.plan(place,0);assert.ok(active.planCacheSize()<=48);}assert.notEqual(active.plan(others[0],0),coldPlan);assert.deepEqual(active.plan(p,0),detail);
 assert.deepEqual(g.frontier.snapshot(),before);const saved=g.serialize();assert.equal(saved.frontier.taken[tree.id],3);assert.equal(saved.frontier.enemies[p.id+':e0'],0);g.restoreSave(saved);assert.equal(g.frontier.snapshot().taken[tree.id],3);assert.equal(g.frontier.snapshot().enemies[p.id+':e0'],0);
});

test('QA05 : mesures CPU contextuelles du calcul GPS, sans seuil de cadence',t=>{
 const w=W.create(17117,5),clock=fn=>{const start=performance.now();fn();return performance.now()-start;},oldGraphMs=clock(()=>Legacy.graph(w)),graphMs=clock(()=>Routing.graph(w));
 const cases=Array.from({length:32},(_,i)=>({from:{x:4096+i/7,y:4096+i/13},to:w.pois.at(-1-i)})),baselineRoutesMs=clock(()=>cases.forEach(c=>Legacy.route(w,c.from,c.to))),routesMs=clock(()=>cases.forEach(c=>Routing.route(w,c.from,c.to)));
 const from={x:4096,y:4096},to=w.pois.at(-1);Routing.route(w,from,to);const cachedRoutes512Ms=clock(()=>{for(let i=0;i<512;i++)Routing.route(w,from,to);});
 t.diagnostic(JSON.stringify({kind:'qa05-routing-cpu',node:process.version,roads:w.roads.length,...Routing.stats(w),baselinePairs:w.roads.length*(w.roads.length-1)/2,oldGraphMs,graphMs,baselineRoutes32Ms:baselineRoutesMs,routes32Ms:routesMs,cachedRoutes512Ms,heapUsedBytes:process.memoryUsage().heapUsed,note:'Shared Node executor; CPU timings are contextual samples, not browser FPS or retained-heap measurements.'}));
});
