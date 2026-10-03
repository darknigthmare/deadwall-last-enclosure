'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(process.argv[2]||'.'),generation=Number(process.argv[3]||7),output=process.argv[4];
require(path.join(base,'src/core.js'));
const W=require(path.join(base,'src/frontier-world.js')),G=require(path.join(base,'src/frontier-geometry.js')),Routing=require(path.join(base,'src/frontier-routing.js'));
const checks=[];
for(const seed of[0,42,17117,84329,903145,4294967295]){
 const w=W.create(seed,generation),roadView=generation>=7?Routing.outsideWorld(w):w,graph=Routing.graph(roadView),origin={x:w.home.maxX+3,y:w.home.y},near=roadView.nearestRoad(origin),roadIndex=roadView.roads.indexOf(near.road),queue=[graph.tracks[roadIndex][0].id],seen=new Set(queue),failures=[],variants={};
 for(let i=0;i<queue.length;i++)for(const [id]of graph.edges[queue[i]])if(!seen.has(id)){seen.add(id);queue.push(id);}
 for(const p of w.pois){
  const road=roadView.nearestRoad(p.drive.a),index=roadView.roads.indexOf(road.road);
  if(!graph.tracks[index].some(n=>seen.has(n.id)))failures.push({kind:'disconnected-road',poi:p.id,type:p.type});
  const entry=G.global(p,p.w/2,-1);
  if(!w.line(p.drive.a,entry,0,null,null,W.RULES.footRadius))failures.push({kind:'blocked-approach',poi:p.id,type:p.type});
  const plan=w.plan(p,0),variant=plan.layoutVariant141||'historique';variants[variant]=(variants[variant]||0)+1;
  const route=Routing.route(w,origin,p);
  if(!route||!Number.isFinite(route.metres))failures.push({kind:'no-regional-route',poi:p.id,type:p.type});
  if(generation>=7&&route){const h=w.home,box={x:h.minX+1e-5,y:h.minY+1e-5,w:h.size-2e-5,h:h.size-2e-5};for(let i=1;i<route.path.length;i++)if(G.segmentRect(route.path[i-1],route.path[i],box)){failures.push({kind:'route-through-home',poi:p.id,type:p.type});break;}}
 }
 const item={seed,generation,pois:w.pois.length,types:new Set(w.pois.map(p=>p.type)).size,graphNodes:graph.nodes.length,connectedNodes:seen.size,approachesChecked:w.pois.length,routesChecked:w.pois.length,variants,failures};checks.push(item);process.stderr.write(JSON.stringify({seed,generation,pois:item.pois,failures:failures.length})+'\n');
}
const report={status:checks.every(c=>!c.failures.length)?'passed':'failed',browser:false,method:'Actual streamed world; swept foot disc .32m for every driveway; exterior road graph and returned regional paths; no actor motion or save mutation.',checks};
if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
process.stdout.write(JSON.stringify({status:report.status,seeds:checks.length,approaches:checks.reduce((n,c)=>n+c.approachesChecked,0),failures:checks.reduce((n,c)=>n+c.failures.length,0)})+'\n');
assert.equal(report.status,'passed');
