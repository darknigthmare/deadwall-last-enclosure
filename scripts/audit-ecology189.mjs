import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),C=require('../src/core.js'),W=require('../src/frontier-world.js'),P=require('../src/biome-population165.js'),F=require('../src/wildlife189.js');
const out=process.env.ECOLOGY189_OUT||'artifacts/qa/ecology189';await fs.mkdir(out,{recursive:true});
const report={scope:'Descriptor census over fixed sampled chunks; actual habitat and physical admission checked. Not a campaign or a guarantee of every species in each seed.',profiles:[],pass:false};
try{
 for(const landscape189 of ['balanced','large','patchwork']){
  const seed=17117,w=W.create(seed,8,{ecologyVersion:1,hydrologyVersion:1,landscape189}),species={},biomes={},modes={},samples=[];let generated=0,rejected=0;
  // A 2-chunk stride is deterministic and covers the complete region, not only D-17.
  for(let cy=0;cy<w.size/256;cy+=2)for(let cx=0;cx<w.size/256;cx+=2){
   const biome=w.biomeAt(cx*256+128,cy*256+128);biomes[biome.id]=(biomes[biome.id]||0)+1;samples.push([cx,cy,biome.id]);
   for(let i=0;i<8;i++){const q=P.animal(w,cx,cy,i);if(!q)continue;generated++;if(!P.admitted(w,q)){rejected++;continue;}
    assert.ok(F.habitat(q.profile,w.hydrology.sample(q.x,q.y)));species[q.species]=(species[q.species]||0)+1;modes[q.profile.mode]=(modes[q.profile.mode]||0)+1;
   }
  }
  assert.ok(Object.keys(biomes).length>=13);assert.ok(Object.keys(species).length>=24);assert.equal(Object.keys(modes).length,4);
  report.profiles.push({seed,landscape189,biomes,species,modes,generated,rejected,admitted:generated-rejected,terrainHash:createHash('sha256').update(JSON.stringify(samples)).digest('hex')});
  await fs.writeFile(out+'/census.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({landscape189,species:Object.keys(species).length,admitted:generated-rejected,complete:false}));
 }
 assert.equal(new Set(report.profiles.map(p=>p.terrainHash)).size,3);
 const missing=Object.keys(F.species()).filter(id=>!report.profiles.some(p=>p.species[id]));report.missingSpecies=missing;assert.deepEqual(missing,[],'Each advertised species must be physically admitted in the census');
 report.pass=true;
}catch(error){report.failure=String(error.stack||error);process.exitCode=1;}
finally{await fs.writeFile(out+'/census.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
