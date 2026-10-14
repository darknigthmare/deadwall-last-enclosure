'use strict';
const crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.'),W=require(path.join(root,'src/frontier-world.js'));
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const report=[];
for(const seed of [0,42,17117]){
 const w=W.create(seed,10),ph=crypto.createHash('sha256'),dh=crypto.createHash('sha256');let floors=0;
 for(const p of w.pois)for(const z of p.levels){ph.update(JSON.stringify([p.id,z,w.plan(p,z)]));dh.update(JSON.stringify([p.id,z,w.detailAt(p,z)]));floors++;}
 const chunks=[];for(const [cx,cy] of [[9,1],[69,31],[48,48],[62,37]])chunks.push(w.chunk(cx,cy));
 report.push({seed,sites:w.pois.length,floors,pois:hash(w.pois),roads:hash(w.roads),plans:ph.digest('hex'),details:dh.digest('hex'),scatter:hash(chunks)});
}
console.log(JSON.stringify(report));
