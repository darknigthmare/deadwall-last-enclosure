'use strict';
const crypto=require('node:crypto');
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Full public geometry and every populated floor are covered. Streamed nodes
// cover corners, the old region boundary, distant terrain and the actual home.
function describeWorld(world){
 const geometry={generation:world.generation,size:world.size,home:world.home,geography:world.geography,roads:world.roads,pois:world.pois,towns:world.towns,sectors:world.sectors,junctions:world.junctions};
 const plans=crypto.createHash('sha256');let floors=0;
 for(const p of world.pois)for(const z of p.levels){plans.update(JSON.stringify([p.id,z,world.plan(p,z)])+'\n');floors++;}
 const last=world.size/256-1,coordinates=[[0,0],[15,16],[31,31],[48,48],[62,37],[last,last],[Math.floor(world.home.x/256),Math.floor(world.home.y/256)]];
 const nodes=coordinates.map(([x,y])=>world.chunk(x,y));
 return{seed:world.seed,generation:world.generation,size:world.size,roads:world.roads.length,pois:world.pois.length,floors,geometry:digest(geometry),plans:plans.digest('hex'),finiteNodes:digest(nodes),threats:digest(world.pois.map(p=>[p.id,world.threatCount(p)]))};
}
module.exports={describeWorld};
