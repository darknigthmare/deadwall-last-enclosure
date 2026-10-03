/* Read-only road guidance. It neither moves actors nor promises an obstacle-free off-road connector. */
(function(root){'use strict';
const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null),graphs=new WeakMap(),metadata=new WeakMap();
const SOURCE_CACHE_LIMIT=4,JOIN_TOLERANCE=.02;
const exteriors=new WeakMap();
function outsideWorld(world,H=world.home){
 if(exteriors.has(world))return exteriors.get(world);const roads=[];
 for(const road of world.roads){const dx=road.b.x-road.a.x,dy=road.b.y-road.a.y;let lo=0,hi=1,hit=true;for(const[p,q]of [[-dx,road.a.x-H.minX],[dx,H.maxX-road.a.x],[-dy,road.a.y-H.minY],[dy,H.maxY-road.a.y]]){if(Math.abs(p)<1e-10){if(q<0){hit=false;break;}}else{const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>=hi){hit=false;break;}}}const point=t=>({x:road.a.x+dx*t,y:road.a.y+dy*t}),mid=point((lo+hi)/2);if(!(mid.x>H.minX&&mid.x<H.maxX&&mid.y>H.minY&&mid.y<H.maxY))hit=false;const ranges=hit?[[0,lo],[hi,1]]:[[0,1]];for(const[a,b]of ranges)if(b-a>1e-8)roads.push({...road,id:road.id+':outside:'+a,a:point(a),b:point(b)});}
 const result={roads,home:H,sourceGeneration:world.generation??world.sourceGeneration,nearestRoad(p){let best=null;for(const road of roads){const q=G.nearest(p,road.a,road.b);if(!best||q.d<best.d)best={...q,road};}return best;}};exteriors.set(world,result);return result;
}

function boundsTree(boxes){
 const box={l:Infinity,r:-Infinity,t:Infinity,b:-Infinity};for(const p of boxes){box.l=Math.min(box.l,p.l);box.r=Math.max(box.r,p.r);box.t=Math.min(box.t,p.t);box.b=Math.max(box.b,p.b);}
 if(boxes.length<=8)return{...box,items:boxes};const axis=box.r-box.l>box.b-box.t?'x':'y';boxes.sort((a,b)=>axis==='x'?(a.l+a.r)-(b.l+b.r):(a.t+a.b)-(b.t+b.b));const mid=boxes.length>>1;return{...box,left:boundsTree(boxes.slice(0,mid)),right:boundsTree(boxes.slice(mid))};
}
function candidates(tree,box,index,out){
 if(box.l>tree.r+JOIN_TOLERANCE||box.r<tree.l-JOIN_TOLERANCE||box.t>tree.b+JOIN_TOLERANCE||box.b<tree.t-JOIN_TOLERANCE)return;
 if(tree.items){for(const other of tree.items)if(other.index>index&&box.l<=other.r+JOIN_TOLERANCE&&box.r>=other.l-JOIN_TOLERANCE&&box.t<=other.b+JOIN_TOLERANCE&&box.b>=other.t-JOIN_TOLERANCE)out.push(other.index);return;}
 candidates(tree.left,box,index,out);candidates(tree.right,box,index,out);
}
function graph(world){
 if(graphs.has(world))return graphs.get(world);
 const roads=world.roads,stops=roads.map(()=>[0,1]),nodes=[],edges=[],ids=new Map(),point=(r,t)=>({x:r.a.x+(r.b.x-r.a.x)*t,y:r.a.y+(r.b.y-r.a.y)*t});
 const add=p=>{const key=Math.round(p.x*100)+','+Math.round(p.y*100);if(!ids.has(key)){ids.set(key,nodes.length);nodes.push(p);edges.push([]);}return ids.get(key);};
 const boxes=roads.map((r,index)=>({index,l:Math.min(r.a.x,r.b.x),r:Math.max(r.a.x,r.b.x),t:Math.min(r.a.y,r.b.y),b:Math.max(r.a.y,r.b.y)})),tree=boundsTree(boxes.slice());let pairChecks=0;
 for(let i=0;i<roads.length;i++){
  const nearby=[];candidates(tree,boxes[i],i,nearby);nearby.sort((a,b)=>a-b);
  // Keep historical road-pair order: centimetre node merges and equal routes stay deterministic.
  for(const j of nearby){pairChecks++;const a=roads[i],b=roads[j],ax=a.b.x-a.a.x,ay=a.b.y-a.a.y,bx=b.b.x-b.a.x,by=b.b.y-b.a.y,den=ax*by-ay*bx,dx=b.a.x-a.a.x,dy=b.a.y-a.a.y;
   if(Math.abs(den)>1e-8){const t=(dx*by-dy*bx)/den,u=(dx*ay-dy*ax)/den;if(t>=0&&t<=1&&u>=0&&u<=1){stops[i].push(t);stops[j].push(u);}}
   else{for(const p of [a.a,a.b]){const q=G.nearest(p,b.a,b.b);if(q.d<JOIN_TOLERANCE)stops[j].push(q.t);}for(const p of [b.a,b.b]){const q=G.nearest(p,a.a,a.b);if(q.d<JOIN_TOLERANCE)stops[i].push(q.t);}}
  }
 }
 const tracks=roads.map((r,i)=>{const ts=[...new Set(stops[i])].sort((a,b)=>a-b),out=ts.map(t=>({t,id:add(point(r,t))}));for(let k=1;k<out.length;k++){const a=out[k-1].id,b=out[k].id,d=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y);edges[a].push([b,d]);edges[b].push([a,d]);}return out;});
 const value={nodes,edges,tracks};graphs.set(world,value);metadata.set(value,{roadIndex:new Map(roads.map((r,i)=>[r,i])),sources:new Map(),pairChecks,searches:0,cacheHits:0});return value;
}
// Equal distances pop the lowest node ID, matching the previous exhaustive scan.
const before=(a,b)=>a.distance<b.distance||(a.distance===b.distance&&a.id<b.id);
function push(heap,item){let i=heap.length;heap.push(item);while(i){const p=(i-1)>>1;if(!before(item,heap[p]))break;heap[i]=heap[p];i=p;}heap[i]=item;}
function pop(heap){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&before(heap[c+1],heap[c]))c++;if(!before(heap[c],last))break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;}
function search(g,near,index){
 const meta=metadata.get(g),key=index+':'+near.x+':'+near.y,cache=meta.sources;
 if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);meta.cacheHits++;return value;}
 const dist=new Float64Array(g.nodes.length),parent=new Int32Array(g.nodes.length),done=new Uint8Array(g.nodes.length),heap=[];dist.fill(Infinity);parent.fill(-1);meta.searches++;
 for(const p of g.tracks[index])dist[p.id]=Math.hypot(g.nodes[p.id].x-near.x,g.nodes[p.id].y-near.y);
 for(const p of g.tracks[index])push(heap,{id:p.id,distance:dist[p.id]});
 while(heap.length){const {id:u,distance:best}=pop(heap);if(done[u]||best!==dist[u])continue;done[u]=1;for(const [v,cost]of g.edges[u])if(best+cost<dist[v]){dist[v]=best+cost;parent[v]=u;push(heap,{id:v,distance:dist[v]});}}
 const value={dist,parent};cache.set(key,value);if(cache.size>SOURCE_CACHE_LIMIT)cache.delete(cache.keys().next().value);return value;
}
function route(world,from,poi){
 if(!from||!Number.isFinite(from.x)||!Number.isFinite(from.y)||!world?.roads?.length||!poi?.drive||![poi.drive.a,poi.drive.b].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;
 let homeBarrier=null,homeOrigin=null;
 if((world.generation>=7||world.sourceGeneration>=7)&&world.home){homeBarrier=world.home;const inside=p=>p.x>homeBarrier.minX&&p.x<homeBarrier.maxX&&p.y>homeBarrier.minY&&p.y<homeBarrier.maxY;if(inside(poi.drive.a)||inside(poi.drive.b))return null;world=world.sourceGeneration>=7?world:outsideWorld(world,homeBarrier);if(inside(from)){const portal=world.nearestRoad(from);if(!portal)return null;homeOrigin={...from};from={x:portal.x,y:portal.y};}}
 const g=graph(world),a=world.nearestRoad(from),end=poi.drive.a,b=world.nearestRoad(end);if(!a?.road||!b?.road)return null;
 const roadIndex=metadata.get(g).roadIndex,ai=roadIndex.get(a.road),bi=roadIndex.get(b.road);if(ai===undefined||bi===undefined)return null;const {dist,parent}=search(g,a,ai);
 let last=-1,roadLength=Infinity;for(const p of g.tracks[bi]){const d=Math.hypot(g.nodes[p.id].x-b.x,g.nodes[p.id].y-b.y);if(dist[p.id]+d<roadLength){roadLength=dist[p.id]+d;last=p.id;}}
 let pts=[];if(ai===bi&&Math.hypot(a.x-b.x,a.y-b.y)<=roadLength){roadLength=Math.hypot(a.x-b.x,a.y-b.y);}else{if(last<0)return null;for(let id=last;id>=0;id=parent[id])pts.push(g.nodes[id]);pts.reverse();}
 // Copy graph vertices: displayed routes must never mutate the shared road graph.
 const arrival=poi.drive.b,connector=a.d+Math.hypot(arrival.x-b.x,arrival.y-b.y),path=[{x:from.x,y:from.y},{x:a.x,y:a.y},...pts.map(p=>({x:p.x,y:p.y})),{x:b.x,y:b.y},{x:arrival.x,y:arrival.y}];if(homeBarrier){const box={x:homeBarrier.minX+1e-6,y:homeBarrier.minY+1e-6,w:homeBarrier.size-2e-6,h:homeBarrier.size-2e-6};for(let i=1;i<path.length;i++)if(G.segmentRect(path[i-1],path[i],box))return null;}return{path,metres:roadLength+connector,roadMetres:roadLength,connectorMetres:connector,...(homeOrigin?{localSegmentRequired:true,homeOrigin}: {})};
}
function stats(world){if(world.generation>=7&&world.home)world=outsideWorld(world);const g=graphs.get(world),m=g&&metadata.get(g);return m?{nodes:g.nodes.length,pairChecks:m.pairChecks,searches:m.searches,cacheHits:m.cacheHits,sources:m.sources.size,sourceLimit:SOURCE_CACHE_LIMIT,sourceBytes:m.sources.size*g.nodes.length*12}:{nodes:0,pairChecks:0,searches:0,cacheHits:0,sources:0,sourceLimit:SOURCE_CACHE_LIMIT,sourceBytes:0};}
const api={route,graph,stats,outsideWorld};root.DeadwallFrontierRouting=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
