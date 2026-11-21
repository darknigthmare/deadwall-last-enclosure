#!/usr/bin/env node
// Sonde hors jeu du générateur de cantons (specs/monde-sans-bord, T2.4 et T3) : coût et contenu
// moyens d'un canton sur un carré de cantons — falaises, cols, eau, agglomérations, site de D-17. Usage : node scripts/probe-cantons217.cjs [graine] [rayon]
'use strict';
const path=require('node:path');
const G=require(path.join(__dirname,'..','src','world-canton-gen217.js'));
function probe(seed=17117,radius=10){
 G.forget();
 const levels=new Array(G.RULES.levels).fill(0),biomes={},times=[],sum={cliffs:0,slopes:0,shore:0,cols:0,cuts:0,towns:0,rivers:0,lakes:0,roads:0,deadEnds:0,sites:0,ramps:0,bridges:0,gates:0,blockedSea:0,blockedCliff:0},sinks={sea:0,lake:0,none:0},towns={hameau:0,bourg:0,ville:0},water={cantons:0,lowland:0,lowlandWatered:0};let widths=0,natural=0;
 for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
  const start=process.hrtime.bigint(),c=G.generate(seed,x,y);times.push(Number(process.hrtime.bigint()-start)/1e6);
  for(const l of c.levels)levels[l]++;for(const b of c.biomes)biomes[G.BIOMES[b]]=(biomes[G.BIOMES[b]]||0)+1;
  sum.cliffs+=c.counts.cliffs;sum.slopes+=c.counts.slopes;sum.shore+=c.counts.shore;sum.cols+=c.counts.cols;sum.cuts+=c.counts.cuts;
  for(const k of c.cols)if(k.kind==='naturel'){natural++;widths+=k.width;}
  for(const t of c.towns)if(t.vx===x&&t.vy===y){sum.towns++;towns[t.kind]++;}
  // « Hors hauts plateaux » : cantons dont le point bas est sous le seuil des sources rares.
  if(c.rivers.length)water.cantons++;if(c.drain.low>=1&&c.drain.low<G.RULES.water.highLevel){water.lowland++;if(c.rivers.length)water.lowlandWatered++;}
  sum.rivers+=c.rivers.length;sum.lakes+=c.lakes.length;sum.roads+=c.roads.length;sum.deadEnds+=c.roads.filter(r=>r.deadEnd).length;
  sum.sites+=c.sites.length;sum.ramps+=c.ramps.length;sum.bridges+=c.bridges.length;sinks[c.drain.sink||'none']++;
  for(const side of ['north','east','south','west']){const k=c.crossings[side];if(k.road)sum.gates++;if(k.blocked==='mer')sum.blockedSea++;if(k.blocked==='falaise')sum.blockedCliff++;}
 }
 const n=times.length,sorted=[...times].sort((a,b)=>a-b),cells=n*G.CELLS*G.CELLS,per=Object.fromEntries(Object.entries(sum).map(([k,v])=>[k,Math.round(v/n*100)/100]));
 return{seed,cantons:n,ms:{mean:Math.round(times.reduce((a,b)=>a+b,0)/n*1000)/1000,median:Math.round(sorted[n>>1]*1000)/1000,p95:Math.round(sorted[Math.floor(n*.95)]*1000)/1000,max:Math.round(sorted[n-1]*1000)/1000},
  cliffPerRamp:Math.round(sum.cliffs/Math.max(1,sum.slopes)*100)/100,colWidth:Math.round(widths/Math.max(1,natural)*100)/100,towns,water:{...water,lowlandShare:Math.round(water.lowlandWatered/Math.max(1,water.lowland)*1000)/10},foundation:G.foundation(seed),
  levelShare:levels.map(v=>Math.round(v/cells*1000)/10),perCanton:per,sinks,biomeShare:Object.fromEntries(Object.entries(biomes).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,Math.round(v/cells*1000)/10]))};
}
if(require.main===module){const seed=process.argv[2]===undefined?17117:Number(process.argv[2]),radius=process.argv[3]===undefined?10:Number(process.argv[3]);console.log(JSON.stringify(probe(seed,radius),null,1));}
module.exports={probe};
