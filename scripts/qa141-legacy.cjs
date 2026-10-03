'use strict';
// Compare the actual historical generators, plans and finite node contents.
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const source=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const W=require(path.join(source,'src/frontier-world.js'));
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const rows=[];
for(const seed of [17117,84329])for(let generation=1;generation<=6;generation++){
 const w=W.create(seed,generation),plans=w.pois.slice(0,6).flatMap(p=>p.levels.map(z=>w.plan(p,z))),chunks=[[0,0],[15,16],[31,31],[48,48],[62,37],[95,95]].map(([x,y])=>w.chunk(x,y));
 rows.push({seed,generation,size:w.size,home:w.home,roads:w.roads.length,pois:w.pois.length,geometry:hash({roads:w.roads,pois:w.pois,towns:w.towns}),plans:hash(plans),finiteNodes:hash(chunks)});
}
const text=JSON.stringify({method:'actual G1–G6 geometry, 6 plans per world and 6 chunks per world',rows},null,2)+'\n';
if(process.argv[3])fs.writeFileSync(process.argv[3],text);else process.stdout.write(text);
