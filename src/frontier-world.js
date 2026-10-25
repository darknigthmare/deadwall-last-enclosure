/* Streamed regional world. The defending city keeps its bounded historical simulation. */
(function(root){'use strict';const Settle=root.DeadwallRegionSettlements||(typeof require==='function'?require('./region-settlements.js'):null),G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
const Detail157=root.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null);
const Codex3000=root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null);
const sizeForGeneration=g=>g>=5?(root.DeadwallCore?.WorldStreamRules131?.size||24576):8192;
const threatCount=(seed,p)=>p.generation>=5&&['allied','empty'].includes(p.occupation)?0:1+G.hash(seed,p.id,'threat')%4;
const RULES=Object.freeze({size:8192,chunk:256,chunkCache:25,planCache:48,metreUnits:32,footRadius:.32,carRadius:2.5,walk:3.5,run:5.0,roadSpeed:18,offroadSpeed:7.2,fuelPerMetre:.004,lootRate:3,maxEnemy:48,baseMin:4032,baseMax:4160,discover:65,lootReach:1.6});
const TOWNS=[{id:'t0',name:'Les Verrières',x:4700,y:4070,r:500,a:.06},{id:'t1',name:'Val-des-Ormes',x:2550,y:2600,r:600,a:-.12},{id:'t2',name:'Saint-Roch',x:6300,y:2250,r:600,a:.1},{id:'t3',name:'La Briqueterie',x:2600,y:6250,r:600,a:.03},{id:'t4',name:'Moulin-Neuf',x:5900,y:6300,r:620,a:-.1},{id:'t5',name:'Bois-Mort',x:1200,y:4100,r:430,a:.15}];
const LINES=[[[32,4096],[1200,4100],[2650,4096],[4032,4096],[4160,4096],[4700,4070],[6500,4190],[8160,4170]],[[4096,32],[3910,1500],[4096,2700],[4096,4032],[4096,4160],[4000,5500],[4160,7000],[4096,8160]],[[1200,4100],[1700,3250],[2550,2600],[4096,2700],[5150,2350],[6300,2250],[7400,2650]],[[1200,4100],[1500,5100],[2600,6250],[4000,5500],[4950,5900],[5900,6300],[7300,6050],[7650,4850],[6500,4190]],[[6300,2250],[6500,3300],[6500,4190]],[[2550,2600],[2100,1350],[3200,900],[3910,1500]],[[2600,6250],[2650,7350],[4160,7000],[5900,6300]]];
function create(seed,requestedGeneration=3,effects={}){const baseGeneration=Math.min(requestedGeneration,9),isG6=requestedGeneration>=6,generation=isG6?baseGeneration:Math.min(requestedGeneration,4),size=sizeForGeneration(requestedGeneration);if(![1,2,3,4,5,6,7,8,9,10,11].includes(requestedGeneration))throw Error("Version du monde inconnue");if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Graine régionale invalide');const Landscape189=root.DeadwallLandscape189||(typeof require==='function'?require('./landscape189.js'):null),landscape189=Landscape189.normalize(effects.landscape189);if(landscape189!=='classic'&&(requestedGeneration<8||effects.ecologyVersion!==1||effects.hydrologyVersion!==1))throw Error('Paysage189 incompatible avec cette génération');const ecologyVersion=effects.ecologyVersion===undefined?0:effects.ecologyVersion;if(![0,1].includes(ecologyVersion)||ecologyVersion===1&&requestedGeneration<7)throw Error('Écologie régionale inconnue');const hydrologyVersion=effects.hydrologyVersion===undefined?0:effects.hydrologyVersion;if(![0,1].includes(hydrologyVersion)||hydrologyVersion===1&&(requestedGeneration<8||ecologyVersion!==1))throw Error('Hydrologie régionale inconnue');const Context160=requestedGeneration>=10?(root.DeadwallCodexContext160||(typeof require==='function'?require('./codex-context160.js'):null)):null,Geometry160=requestedGeneration>=10?(root.DeadwallCodexGeometry160||(typeof require==='function'?require('./codex-geometry160.js'):null)):null;if(requestedGeneration>=10&&(!Context160||!Geometry160))throw Error('Contextes physiques160 absents');const Campaign205=requestedGeneration===11?(root.DeadwallCodexCampaign205||(typeof require==='function'?require('./codex-campaign205.js'):null)):null;if(requestedGeneration===11&&!Campaign205)throw Error('Plans de campagne205 absents');let campaignCoverage205=null;const random=G.rng(G.hash(seed,'region1')),roads=[],pois=[],chunks=new Map(),plans=new Map(),bins=new Map(),roadBins=new Map();let codexCoverage=null,contextCoverage160=null,settlementData=null,outerBuilding=false,roadIndexReady=false,nearestChecks=0,roadTree=null,historicRoads=null,historicRoadTree=null,extensionRoadTree=null;const roadOrder=new Map(),driveBins=new Map(),detailCache=new Map();const Geo=root.DeadwallGeography135||(typeof require==='function'?require('./geography135.js'):null),HistoricBiomes=isG6?(root.DeadwallBiomes135||(typeof require==='function'?require('./biomes135.js'):null)):null,BaseBiomes=landscape189==='classic'?HistoricBiomes:Landscape189.create({base:HistoricBiomes,seed,preset:landscape189}),home=Geo?Geo.home(seed,baseGeneration):{x:4096,y:4096,minX:4032,minY:4032,maxX:4160,maxY:4160,size:128};const Ecology164=ecologyVersion===1?(root.DeadwallBiomes164||(typeof require==='function'?require('./biomes164.js'):null)):null;if(ecologyVersion===1&&!Ecology164)throw Error('Écologie164 absente');let Biomes=ecologyVersion===1?Ecology164.create({base:BaseBiomes,seed,settlements:[]}):BaseBiomes;const annexReservations=isG6?Geo.reservations(seed,baseGeneration):[];let geography=null,hydrology=null;
const addRoad=(a,b,width=7)=>{const r={id:'r'+roads.length,a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]},width};roads.push(r);return r;};
const placementRoadBins=new Map();let placementRoadPad=0;
// Construction-only broad phase: a parcel includes its reserved lot and paved
// approach. Exact overlap/corridor predicates below still decide every veto.
// These bins live for one generation pass and are released before play begins.
const placementParcelBins=new Map();
function placementParcels(box,pad=1){
 const found=new Set();for(let y=Math.floor((box.t-pad)/256);y<=Math.floor((box.b+pad)/256);y++)for(let x=Math.floor((box.l-pad)/256);x<=Math.floor((box.r+pad)/256);x++)for(const p of placementParcelBins.get(x+','+y)||[])found.add(p);return found;
}
function indexPlacementParcel(p){
 const d=p.drive,pad=d.width/2+1,box={l:Math.min(p.reserve.l,d.a.x-pad,d.b.x-pad),r:Math.max(p.reserve.r,d.a.x+pad,d.b.x+pad),t:Math.min(p.reserve.t,d.a.y-pad,d.b.y-pad),b:Math.max(p.reserve.b,d.a.y+pad,d.b.y+pad)};
 for(let y=Math.floor(box.t/256);y<=Math.floor(box.b/256);y++)for(let x=Math.floor(box.l/256);x<=Math.floor(box.r/256);x++){const key=x+','+y;if(!placementParcelBins.has(key))placementParcelBins.set(key,[]);placementParcelBins.get(key).push(p);}
}
function preparePlacementRoads(){for(const r of roads){placementRoadPad=Math.max(placementRoadPad,r.width/Math.SQRT2);for(let y=Math.floor(Math.min(r.a.y,r.b.y)/256);y<=Math.floor(Math.max(r.a.y,r.b.y)/256);y++)for(let x=Math.floor(Math.min(r.a.x,r.b.x)/256);x<=Math.floor(Math.max(r.a.x,r.b.x)/256);x++){const key=x+','+y;if(!placementRoadBins.has(key))placementRoadBins.set(key,[]);placementRoadBins.get(key).push(r);}}}
function placementRoads(box){if(requestedGeneration<7)return roads;const found=new Set();for(let y=Math.floor((box.t-placementRoadPad)/256);y<=Math.floor((box.b+placementRoadPad)/256);y++)for(let x=Math.floor((box.l-placementRoadPad)/256);x<=Math.floor((box.r+placementRoadPad)/256);x++)for(const r of placementRoadBins.get(x+','+y)||[])found.add(r);return found;}
if(!isG6){for(const poly of LINES)for(let i=1;i<poly.length;i++)addRoad(poly[i-1],poly[i]);
for(const t of TOWNS){const point=(x,y)=>[t.x+x*Math.cos(t.a)-y*Math.sin(t.a),t.y+x*Math.sin(t.a)+y*Math.cos(t.a)];for(let n=-2;n<=2;n++){const off=n*132;addRoad(point(-350,off),point(370-(n%2)*50,off),5.8);addRoad(point(off,-320),point(off,330),5.8);}const p=point(0,0);addRoad([t.x,t.y],point(0,-320),5.8);}
}
if(isG6){if(!Geo||!Biomes)throw Error('Géographie ou biomes 1.35 absents');geography=Geo.generate(seed,{addRoad,biomes:Biomes,generation:baseGeneration});const Road=root.DeadwallRoadKit||(typeof require==='function'?require('./region-roadkit.js'):null),network=Road.topology(roads,seed);roads.splice(0,roads.length,...network.roads);settlementData={towns:geography.towns,sectors:geography.sectors,junctions:network.junctions};if(ecologyVersion===1)Biomes=Ecology164.create({base:BaseBiomes,seed,settlements:geography.towns});outerBuilding=true;}
// Natural water is constructed once from immutable geography, before any parcel IDs.
// Coast clipping produces real coastal dead ends; freshwater road intersections are bridges.
if(hydrologyVersion===1){
 const Hydro=root.DeadwallHydrology165||(typeof require==='function'?require('./hydrology165.js'):null);
 if(!Hydro)throw Error('Hydrologie165 absente');
 hydrology=Hydro.create({seed,size,home,settlements:geography.towns,roads,biomes:Biomes});
 const Road=root.DeadwallRoadKit||(typeof require==='function'?require('./region-roadkit.js'):null),coastalRoads=roads.flatMap(r=>hydrology.clipRoad(r,r.width/2+(root.DeadwallCore||(typeof require==='function'?require('./core.js'):null)).Hydrology165Rules.crossings.edgeClearance)),network=Road.topology(coastalRoads,seed);
 roads.splice(0,roads.length,...network.roads);settlementData.junctions=network.junctions;
 hydrology=hydrology.withRoads(roads);
 Biomes=Ecology164.create({base:BaseBiomes,seed,settlements:geography.towns,hydrology});
}
if(isG6&&requestedGeneration>=7)preparePlacementRoads();
function nearestRoad(point,tree=roadTree){
 let result=null;const check=r=>{nearestChecks++;const n=G.nearest(point,r.a,r.b);if(!result||n.d<result.d||(n.d===result.d&&(roadOrder.get(r)??roads.indexOf(r))<(roadOrder.get(result.road)??roads.indexOf(result.road))))result={...n,road:r};};
 if(!roadIndexReady){for(const r of roads)check(r);return result;}
 const distance=b=>{const dx=Math.max(b.l-point.x,0,point.x-b.r),dy=Math.max(b.t-point.y,0,point.y-b.b);return dx*dx+dy*dy;},stack=[tree];
 while(stack.length){const node=stack.pop();if(result&&distance(node)>result.d*result.d+1e-9)continue;if(node.items){for(const r of node.items)check(r);continue;}const dl=distance(node.left),dr=distance(node.right);if(dl<dr){stack.push(node.right,node.left);}else stack.push(node.left,node.right);}
 return result;
}
function install(type,x,y,a,road,name){const d=G.BY[type]||Codex3000?.preset(type)||Context160?.preset(type)||Campaign205?.preset(type);if(!d)return false;const isCampaign=d.layout==='campaign205';if(isCampaign&&pois.length>=5000)return false;const isContext=d.layout==='codex160';if(isContext&&pois.length>=10000)return false;const p={id:'P'+String(pois.length).padStart(4,'0'),type,x,y,a,w:d.w,h:d.h,name:name||d.name,levels:d.levels,codex:d.codex,road:road.id,generation:isCampaign?11:isContext?10:generation,...(isCampaign?{campaign205:JSON.parse(JSON.stringify(d.campaign205))}:{})};const service=G.global(p,p.w/2,p.h/2+5),lot={x:service.x,y:service.y,w:p.w+26,h:p.h+48,a};const b=G.bounds(lot),limit=outerBuilding?size:8192;
 if(b.l<40||b.t<40||b.r>limit-40||b.b>limit-40||G.overlap(b,{l:home.minX-16,r:home.maxX+16,t:home.minY-16,b:home.maxY+16}))return false;const nearby=requestedGeneration>=7?[...placementParcels(b)]:pois;if(nearby.some(q=>G.overlap(b,q.reserve,1))||annexReservations.some(q=>G.overlap(b,q,2)))return false;
 // Any public road through a prospective built/service envelope vetoes this parcel.
 const prohibited={x:-10,y:-17,w:p.w+20,h:p.h+32};for(const r of placementRoads(b)){const pad=requestedGeneration>=7?r.width/2:0,box=pad?{x:prohibited.x-pad,y:prohibited.y-pad,w:prohibited.w+pad*2,h:prohibited.h+pad*2}:prohibited;if(G.segmentRect(G.local(p,r.a.x,r.a.y),G.local(p,r.b.x,r.b.y),box))return false;}
 const entryX=isCampaign?d.entry[0]:p.w/2,front=G.global(p,entryX,-19),near=G.nearest(front,road.a,road.b);p.drive={a:{x:near.x,y:near.y},b:G.global(p,entryX,0),width:4};p.reserve=b;
 if(requestedGeneration>=7){
  const corridorHits=(drive,box)=>G.segmentRect(drive.a,drive.b,{x:box.l-drive.width/2,y:box.t-drive.width/2,w:box.r-box.l+drive.width,h:box.b-box.t+drive.width});
  const d=p.drive,corridor={l:Math.min(d.a.x,d.b.x),r:Math.max(d.a.x,d.b.x),t:Math.min(d.a.y,d.b.y),b:Math.max(d.a.y,d.b.y)},approaches=placementParcels(corridor,d.width/2+1);
  if([...approaches].some(q=>corridorHits(p.drive,q.reserve))||nearby.some(q=>corridorHits(q.drive,b))||annexReservations.some(q=>corridorHits(p.drive,q)))return false;
 }
 // Pure water vetoes run after the cheaper parcel, road and corridor refusals.
 if(hydrology){
  if(hydrology.intersects({x:b.l,y:b.t,w:b.r-b.l,h:b.b-b.t}))return false;
  const r=p.drive.width/2,pad=r+1e-6,driveBox={x:Math.min(p.drive.a.x,p.drive.b.x)-pad,y:Math.min(p.drive.a.y,p.drive.b.y)-pad,w:Math.abs(p.drive.b.x-p.drive.a.x)+pad*2,h:Math.abs(p.drive.b.y-p.drive.a.y)+pad*2};
  // An empty in-world broad phase proves this whole driveway dry. Outside it,
  // retain the coastal half-plane semantics and the original physical radius.
  if(driveBox.x<0||driveBox.y<0||driveBox.x+driveBox.w>size||driveBox.y+driveBox.h>size||hydrology.featuresIn(driveBox).length){if(hydrology.lineBlocked(p.drive.a,p.drive.b,r))return false;}
 }
 // A dry approach may still join a junction across a foreign carriageway.
 // G11 must satisfy the same frontage owner as routing before publishing its
 // parcel or consuming an ID; historical generations keep their exact pass.
 if(isCampaign){const Frontage205=root.DeadwallFrontage174||(typeof require==='function'?require('./frontage174.js'):null);if(!Frontage205.resolve(p,roads).ok)return false;}
 p.parking=isContext||isCampaign?[]:G.parking(p);p.outdoor=isContext||isCampaign?[]:G.outdoor(p);pois.push(p);if(requestedGeneration>=7)indexPlacementParcel(p);return p;
}
if(!isG6){const east=roads.find(r=>r.a.x===4160&&r.a.y===4096);if(east){install('house',4248,4142,0,east,'La Maison du chemin est');install('grocer',4390,4156,0,east,'L’Épicerie des retours');install('fuel',4530,3990,Math.PI,east,'Les Pompes des Verrières');}
for(const r of [...roads]){const len=Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y),angle=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x);for(let at=40+random()*40;at<len-40;at+=65+random()*90){const x=r.a.x+(r.b.x-r.a.x)*at/len,y=r.a.y+(r.b.y-r.a.y)*at/len,urban=Math.max(...TOWNS.map(t=>Math.max(0,1-Math.hypot(x-t.x,y-t.y)/t.r)));if(random()>(urban>.1?.82:.21))continue;
 const pool=urban>.1?['house','house','duplex','apartments','grocer','garage','clinic','hotel','school','townhall','market','diner','hardware','mall','ruin']:['cabin','sawmill','mine','quarry','warehouse','fuel','motel','ruin'];const type=pool[Math.floor(random()*pool.length)],d=G.BY[type],side=random()<.5?-1:1,a=angle+(side<0?Math.PI:0),off=r.width/2+22+d.h/2;
 install(type,x-Math.sin(angle)*off*side,y+Math.cos(angle)*off*side,a,r);}}
// Ensure each active plan is represented, without putting an inaccessible specimen off-road.
for(const d of G.PRESETS.filter(d=>d.layout!=='settlements123'&&(generation===3||(d.layout!=='specialists117'&&(generation===2||d.layout!=='places116')))))if(!pois.some(p=>p.type===d.id)){let done=false;for(let k=0;k<400&&!done;k++){const r=roads[k%roads.length],f=.1+(k%9)*.09,angle=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),off=r.width/2+22+d.h/2+(Math.floor(k/roads.length)%3)*30;done=!!install(d.id,r.a.x+(r.b.x-r.a.x)*f-Math.sin(angle)*off,r.a.y+(r.b.y-r.a.y)*f+Math.cos(angle)*off,angle,r);}}
if(generation===4)settlementData=Settle.augment({seed,roads,pois,towns:TOWNS,addRoad,install});
for(const d of G.PRESETS.filter(d=>generation===4&&d.layout==='settlements123'))if(!pois.some(p=>p.type===d.id)){let done=false;for(let k=0;k<500&&!done;k++){const r=roads[k%roads.length],f=.08+(k%10)*.085,angle=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),off=r.width/2+24+d.h/2+(Math.floor(k/roads.length)%4)*30;done=!!install(d.id,r.a.x+(r.b.x-r.a.x)*f-Math.sin(angle)*off,r.a.y+(r.b.y-r.a.y)*f+Math.cos(angle)*off,angle,r);}}
// Append missing specialist/service sites after the historical G4 parcels: saved IDs remain stable.
if(generation===4)for(const d of G.PRESETS)if(!pois.some(p=>p.type===d.id)){let done=false;for(let k=0;k<700&&!done;k++){const r=roads[k%roads.length],f=.08+(k%10)*.085,a=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),off=r.width/2+24+d.h/2+(Math.floor(k/roads.length)%4)*30;done=!!install(d.id,r.a.x+(r.b.x-r.a.x)*f-Math.sin(a)*off,r.a.y+(r.b.y-r.a.y)*f+Math.cos(a)*off,a,r);}}
// Later town streets must not cut through already occupied parcels. Keep IDs and lot coordinates.
if(generation===4){
 const removed=new Set();for(const r of roads){const pad=r.width/2+.4;if(pois.some(p=>G.segmentRect(G.local(p,r.a.x,r.a.y),G.local(p,r.b.x,r.b.y),{x:-pad,y:-pad,w:p.w+pad*2,h:p.h+pad*2})))removed.add(r.id);}
 if(removed.size){roads.splice(0,roads.length,...roads.filter(r=>!removed.has(r.id)));const Road=root.DeadwallRoadKit||(typeof require==='function'?require('./region-roadkit.js'):null);settlementData.junctions=settlementData.junctions.map(j=>{const arms=j.arms.filter(a=>!removed.has(a.road));return{...j,arms,kind:Road.classify(arms)};}).filter(j=>j.arms.length);}
 for(const p of pois)if(nearestRoad(p.drive.a).d>.05){const front=G.global(p,p.w/2,-1),choices=roads.map(road=>({...G.nearest(front,road.a,road.b),road})).sort((a,b)=>a.d-b.d);const pick=choices.find(q=>G.local(p,q.x,q.y).y<-.5&&!pois.some(o=>o!==p&&G.segmentRect(G.local(o,front.x,front.y),G.local(o,q.x,q.y),{x:-2,y:-2,w:o.w+4,h:o.h+4})));if(pick){p.drive.a={x:pick.x,y:pick.y};p.road=pick.road.id;}}
}
if(requestedGeneration>=5){
 historicRoads=roads.slice();outerBuilding=true;const Stream=root.DeadwallWorldStream131||(typeof require==='function'?require('./world-stream131.js'):null);
 if(!Stream)throw Error('Générateur régional 1.31 absent.');
 const extension=Stream.augment({seed,roads,pois,addRoad,install,G,size});
 settlementData={towns:[...(settlementData?.towns||TOWNS),...extension.towns],junctions:settlementData?.junctions||null,sectors:extension.sectors};
}
}
if(requestedGeneration>=7){
 populateG7();
 if(requestedGeneration>=8){
  const Spawn=root.DeadwallWorldSpawns131||(typeof require==='function'?require('./world-spawns131.js'):null);
  if(!Codex3000||Codex3000.summary().legacyCount!==3000)throw Error('Codex 3000 runtime incomplet');
  codexCoverage=Codex3000.populateRegion({seed,roads,install,biomes:Biomes,
   towns:settlementData.towns,sectors:settlementData.sectors,spawn:Spawn,home,generation:baseGeneration});
 }
 // Complete the historical G9 pass first. G10 appends its own types without
 // changing compatibility, IDs, parcel coordinates or plans of that prefix.
 if(requestedGeneration>=10){const Spawn=root.DeadwallWorldSpawns131||(typeof require==='function'?require('./world-spawns131.js'):null);contextCoverage160=Geometry160.populate({seed,roads,install,contracts:Context160,biomes:Biomes,sectors:settlementData.sectors,spawn:Spawn,home,detailVersion:effects.detailVersion??0});}
 if(Campaign205){const Spawn=root.DeadwallWorldSpawns131||(typeof require==='function'?require('./world-spawns131.js'):null);campaignCoverage205=Campaign205.populate({seed,roads,install,biomes:Biomes,sectors:settlementData.sectors,spawn:Spawn,home});}
 placementRoadBins.clear();placementParcelBins.clear();
}else if(isG6)populateG6();
for(const r of roads)for(let y=Math.floor(Math.min(r.a.y,r.b.y)/256);y<=Math.floor(Math.max(r.a.y,r.b.y)/256);y++)for(let x=Math.floor(Math.min(r.a.x,r.b.x)/256);x<=Math.floor(Math.max(r.a.x,r.b.x)/256);x++){
 if(!G.segmentRect(r.a,r.b,{x:x*256,y:y*256,w:256,h:256}))continue;const key=x+','+y;if(!roadBins.has(key))roadBins.set(key,[]);roadBins.get(key).push(r);
}
function buildRoadTree(items){const l=Math.min(...items.map(r=>Math.min(r.a.x,r.b.x))),r=Math.max(...items.map(r=>Math.max(r.a.x,r.b.x))),t=Math.min(...items.map(r=>Math.min(r.a.y,r.b.y))),b=Math.max(...items.map(r=>Math.max(r.a.y,r.b.y)));if(items.length<=8)return{l,r,t,b,items};const axis=r-l>b-t?'x':'y',sorted=items.slice().sort((a,b)=>(a.a[axis]+a.b[axis])-(b.a[axis]+b.b[axis]));const mid=Math.floor(sorted.length/2);return{l,r,t,b,left:buildRoadTree(sorted.slice(0,mid)),right:buildRoadTree(sorted.slice(mid))};}
roads.forEach((r,i)=>roadOrder.set(r,i));roadTree=buildRoadTree(roads);
if(historicRoads){historicRoadTree=buildRoadTree(historicRoads);extensionRoadTree=buildRoadTree(roads.slice(historicRoads.length));}
roadIndexReady=true;
for(const p of pois){for(let cy=Math.floor(p.reserve.t/256);cy<=Math.floor(p.reserve.b/256);cy++)for(let cx=Math.floor(p.reserve.l/256);cx<=Math.floor(p.reserve.r/256);cx++){const key=cx+','+cy;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(p);}}
// Driveways can extend beyond a building reserve. Index their entire paved
// approach so vegetation cannot grow between the public road and the front door.
const frontage174=(root.DeadwallFrontage174||(typeof require==='function'?require('./frontage174.js'):null)).createIndex(roads,pois,{clearAlternative(result){
 const d=result.surface,length=Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y),steps=Math.max(1,Math.ceil(length)),angle=Math.atan2(d.b.y-d.a.y,d.b.x-d.a.x);
 for(let i=0;i<steps;i++){
  const t=(i+.5)/steps,x=d.a.x+(d.b.x-d.a.x)*t,y=d.a.y+(d.b.y-d.a.y)*t;
  if(!vehicleClear(x,y,angle,length/steps,d.width))return false;
 }
 return true;
}});
const driveOwners174=new Map(pois.map(p=>[p.drive,p]));
const programmeDrives=new Set(pois.filter(p=>p.generation>=8).map(p=>p.drive));
for(const p of pois){const d=p.drive,pad=d.width/2+7;for(let cy=Math.floor((Math.min(d.a.y,d.b.y)-pad)/256);cy<=Math.floor((Math.max(d.a.y,d.b.y)+pad)/256);cy++)for(let cx=Math.floor((Math.min(d.a.x,d.b.x)-pad)/256);cx<=Math.floor((Math.max(d.a.x,d.b.x)+pad)/256);cx++){const key=cx+','+cy;if(!driveBins.has(key))driveBins.set(key,[]);driveBins.get(key).push(d);}}
function populateG6(){
 const Spawn=root.DeadwallWorldSpawns131||(typeof require==='function'?require('./world-spawns131.js'):null),towns=settlementData.towns,sectors=new Map(settlementData.sectors.map(s=>[s.id,s])),placed=new Map(),compatibleRoads=new Map();
 for(const r of roads)if(r.roadClass!=='approach'&&Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>38){const pool=Biomes.buildingPool(Biomes.sample(seed,(r.a.x+r.b.x)/2,(r.a.y+r.b.y)/2).id);for(const type of Object.keys(pool)){if(!compatibleRoads.has(type))compatibleRoads.set(type,[]);compatibleRoads.get(type).push(r);}}
 function decorate(p,town){
  if(!p)return false;const profile=Biomes.sample(seed,p.x,p.y),distance=Math.hypot(p.x-home.x,p.y-home.y),spawn=Spawn.roll({seed,id:p.id,biome:profile.def.spawnBiome,distance});
  p.generation=6;p.biome=profile.id;p.occupation=spawn.kind;p.distanceBand=spawn.band;p.sector='S'+Math.floor(p.x/1024)+'_'+Math.floor(p.y/1024);p.zone=profile.def.spawnBiome==='industrial'?'activite':'habitat';p.frontier131={role:spawn.kind==='allied'?'relay':spawn.kind==='infected'?'contested':'waypoint'};
  if(town){p.town=town.id;p.name=G.BY[p.type].name+' · '+town.name;town.parcels++;}else p.name=G.BY[p.type].name+' · '+profile.name;
  sectors.get(p.sector)?.sites.push(p.id);placed.set(p.type,(placed.get(p.type)||0)+1);
  if(distance>=6000&&['mine','quarry','warehouse','fuel','clinic'].includes(p.type)){
   const resource=p.type==='clinic'?'medicine':p.type==='fuel'?'fuel':p.type==='warehouse'?'ammo':'scrap',amount=root.DeadwallCore.WorldOpsRules131.reserveAmounts[resource];
   for(let step=0;step<12;step++){const o={x:2+(step%4)*(p.w-5)/3,y:p.h+3+Math.floor(step/4)*2,w:1.2,h:.8};if(p.outdoor.some(b=>o.x<b.x+b.w+.5&&o.x+o.w+.5>b.x&&o.y<b.y+b.h+.5&&o.y+o.h+.5>b.y))continue;const index=1+Math.max(-1,...p.outdoor.map(b=>Number(b.id.split(':').at(-1))));const crate={...o,id:p.id+':out:'+index,kind:'crate',resource,amount,label:'Réserve scellée de '+({medicine:'soins',fuel:'carburant',ammo:'munitions',scrap:'pièces mécaniques'}[resource]),sealed131:true};p.outdoor.push(crate);p.frontier131.reserve=crate.id;break;}
  }
  return p;
 }
 function put(r,t,type,side,offset=0){const d=G.BY[type];if(!d)return false;const a=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),off=r.width/2+24+d.h/2+offset,x=r.a.x+(r.b.x-r.a.x)*t-Math.sin(a)*off*side,y=r.a.y+(r.b.y-r.a.y)*t+Math.cos(a)*off*side,town=towns.find(q=>Math.hypot(x-q.x,y-q.y)<q.radius+60);return decorate(install(type,x,y,a+(side<0?Math.PI:0),r),town);}

 // Preserve every existing visitable program. Prefer sites whose biome catalogue
 // includes it; the physical placement predicate still has the final authority.
 for(const d of G.PRESETS)if(!placed.has(d.id)){
  const compatible=compatibleRoads.get(d.id)||[];
  const options=compatible.length?compatible:roads.filter(r=>r.roadClass==='street');let done=false;
  for(let k=0;k<Math.min(options.length*3,900)&&!done;k++){const r=options[(G.hash(seed,d.id,'ensure')+k)%options.length];done=!!put(r,.22+(k%3)*.28,d.id,k%2?1:-1,Math.floor(k/options.length)*18);}
 }
 for(const r of roads){const len=Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y);if(len<38||r.roadClass==='approach')continue;const mid={x:(r.a.x+r.b.x)/2,y:(r.a.y+r.b.y)/2},town=towns.find(q=>Math.hypot(mid.x-q.x,mid.y-q.y)<q.radius+60),attempts=town?2:1;
  for(let i=0;i<attempts;i++){const value=G.hash(seed,r.id,i,'parcel135');if(!town&&value%100>31)continue;const at=town?.22+i*.53:.2+(value%5800)/10000,profile=Biomes.sample(seed,mid.x,mid.y),pool=Biomes.buildingPool(profile.id),types=Object.keys(pool).filter(type=>G.BY[type]);let type=Biomes.pickBuilding(seed,mid.x,mid.y,r.id+':'+i);if(!G.BY[type])type=types[value%types.length]||'house';put(r,at,type,value%2?1:-1);}
 }
}
function populateG7(){
 const C=root.DeadwallCore,R=C.WorldTownRules141,Spawn=root.DeadwallWorldSpawns131||(typeof require==='function'?require('./world-spawns131.js'):null),towns=settlementData.towns,sectors=new Map(settlementData.sectors.map(s=>[s.id,s])),placed=new Set(),specialized=new Set(['mine','quarry','sawmill','marketgarden']);
 const sample=(x,y)=>Biomes.sample(seed,x,y,false,{generation:7});
 function decorate(p,town,role='roadside',zone='activite',profile=sample(p.x,p.y)){
  const distance=Math.hypot(p.x-home.x,p.y-home.y),spawn=Spawn.roll({seed,id:p.id,biome:profile.def.spawnBiome,distance});
  Object.assign(p,{generation:7,biome:profile.id,...(ecologyVersion===1?{biomeAliases:Biomes.compatibleIds(profile.id)}:{}),occupation:spawn.kind,distanceBand:spawn.band,sector:'S'+Math.floor(p.x/1024)+'_'+Math.floor(p.y/1024),zone,program141:{kind:town?'settlement':'isolated',role},frontier131:{role:spawn.kind==='allied'?'relay':spawn.kind==='infected'?'contested':'waypoint'}});
  if(town){p.town=town.id;p.name=G.BY[p.type].name+' · '+town.name;town.parcels++;}else p.name=G.BY[p.type].name+' · '+profile.name;
  sectors.get(p.sector)?.sites.push(p.id);placed.add(p.type);
  if(distance>=6000&&['mine','quarry','warehouse','fuel','clinic'].includes(p.type)){
   const resource=p.type==='clinic'?'medicine':p.type==='fuel'?'fuel':p.type==='warehouse'?'ammo':'scrap',amount=C.WorldOpsRules131.reserveAmounts[resource];
   for(let step=0;step<12;step++){const o={x:2+(step%4)*(p.w-5)/3,y:p.h+3+Math.floor(step/4)*2,w:1.2,h:.8};if(p.outdoor.some(b=>o.x<b.x+b.w+.5&&o.x+o.w+.5>b.x&&o.y<b.y+b.h+.5&&o.y+o.h+.5>b.y))continue;const index=1+Math.max(-1,...p.outdoor.map(b=>Number(b.id.split(':').at(-1))));const crate={...o,id:p.id+':out:'+index,kind:'crate',resource,amount,label:'Réserve scellée de '+({medicine:'soins',fuel:'carburant',ammo:'munitions',scrap:'pièces mécaniques'}[resource]),sealed131:true};p.outdoor.push(crate);p.frontier131.reserve=crate.id;break;}
  }
  return p;
 }
 Settle.populate141({seed,roads,towns,install,decorate,biomes:Biomes});
 function put(r,f,type,side,role){
  const d=G.BY[type],a=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),off=r.width/2+R.setback+d.h/2,x=r.a.x+(r.b.x-r.a.x)*f-Math.sin(a)*off*side,y=r.a.y+(r.b.y-r.a.y)*f+Math.cos(a)*off*side,town=towns.find(t=>Math.hypot(x-t.x,y-t.y)<t.radius+60);let profile;
  if(!town||specialized.has(type)){profile=sample(x,y);if(!Object.hasOwn(Biomes.buildingPool(profile.id),type))return false;}
  const p=install(type,x,y,a+(side<0?Math.PI:0),r);return p?decorate(p,town,role,town?(specialized.has(type)?'activite':'centre'):'activite',profile):false;
 }
 // Keep every historical building programme available, but place human services
 // inside a settlement and extraction in an actually compatible environment.
 const viable=roads.filter(r=>r.roadClass!=='approach'&&Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>38);
 for(const d of G.PRESETS)if(!placed.has(d.id)){
  // Hash once per road, rather than twice for every sort comparison. Stable
  // sorting retains historical road order when two ranks happen to be equal.
  const ordered=viable.map(r=>({r,rank:G.hash(seed,d.id,r.id,'coverage141')})).sort((a,b)=>a.rank-b.rank).map(item=>item.r);let done=false;
  for(let k=0;k<Math.min(ordered.length*4,R.attemptLimit)&&!done;k++){const r=ordered[k%ordered.length],pass=Math.floor(k/ordered.length),f=.18+(pass%2)*.58;done=!!put(r,f,d.id,pass%2?1:-1,'supplement');}
 }
 for(const r of viable){
  const x=(r.a.x+r.b.x)/2,y=(r.a.y+r.b.y)/2;if(towns.some(t=>Math.hypot(x-t.x,y-t.y)<t.radius+95)||G.hash(seed,r.id,'roadside141')/4294967296>R.roadsideChance)continue;
  const key=r.id+':roadside141',f=.18+G.hash(seed,key,'frontage')/4294967296*.64,profile=sample(x,y),type=Biomes.pickBuilding(seed,x,y,key,{generation:7});
  if(!G.BY[type]||!Object.hasOwn(Biomes.buildingPool(profile.id),type))continue;put(r,f,type,G.hash(seed,key,'side')%2?1:-1,'roadside');
 }
 for(const town of towns)town.program141.parcels=town.parcels;
}
function nearPOI(x,y,r=80){const set=new Set();for(let cy=Math.floor((y-r)/256);cy<=Math.floor((y+r)/256);cy++)for(let cx=Math.floor((x-r)/256);cx<=Math.floor((x+r)/256);cx++)for(const p of bins.get(cx+','+cy)||[])set.add(p);return [...set];}
// Read the existing paved approaches, including the part outside a parcel.
// Return copied coordinates so a surface/guide lookup cannot move generation geometry.
// A road shoulder follows the real ellipse, including the inner edge of a ring.
// Signed distance avoids replacing either curved boundary with its bounding box.
function ellipseDistance160(x,y,rx,ry){
 let a=rx,b=ry,u=Math.abs(x),v=Math.abs(y);
 if(a<b){[a,b]=[b,a];[u,v]=[v,u];}
 const inside=(u/a)**2+(v/b)**2<=1;
 if(Math.abs(a-b)<1e-10)return Math.hypot(u,v)-a;
 let px,py;
 if(v===0){const n=a*u,d=a*a-b*b;if(n<d){px=a*n/d;py=b*Math.sqrt(Math.max(0,1-(n/d)**2));}else{px=a;py=0;}}
 else{
  let lo=inside?-b*b:0,hi=inside?0:Math.max(a*a,b*b)*(Math.hypot(u/a,v/b)+1);
  for(let i=0;i<40;i++){const t=(lo+hi)/2,value=(a*u/(t+a*a))**2+(b*v/(t+b*b))**2;if(value>1)lo=t;else hi=t;}
  const t=(lo+hi)/2;px=a*a*u/(t+a*a);py=b*b*v/(t+b*b);
 }
 const distance=Math.hypot(u-px,v-py);return inside?-distance:distance;
}
function terrainContains160(o,x,y,margin=0){
 if(x<o.x-margin||y<o.y-margin||x>o.x+o.w+margin||y>o.y+o.h+margin)return false;
 if(o.shape!=='ellipse'&&o.shape!=='annulus')return true;
 const dx=x-o.x-o.w/2,dy=y-o.y-o.h/2,rx=o.w/2,ry=o.h/2;
 if(rx<=0||ry<=0)return false;
 const ellipse=(a,b)=>margin===0?(dx/a)**2+(dy/b)**2<=1:ellipseDistance160(dx,dy,a,b)<=margin;
 if(!ellipse(rx,ry))return false;
 if(o.shape!=='annulus')return true;
 if(!(o.innerRx>0&&o.innerRy>0&&o.innerRx<rx&&o.innerRy<ry))return false;
 return margin===0?(dx/o.innerRx)**2+(dy/o.innerRy)**2>=1:ellipseDistance160(dx,dy,o.innerRx,o.innerRy)>=-margin;
}
function drivewayAt(x,y,margin=0){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(margin)||margin<0||x<0||y<0||x>size||y>size)return null;
 const seen=new Set(),last=size/256-1;
 for(let cy=Math.max(0,Math.floor((y-margin)/256));cy<=Math.min(last,Math.floor((y+margin)/256));cy++)for(let cx=Math.max(0,Math.floor((x-margin)/256));cx<=Math.min(last,Math.floor((x+margin)/256));cx++)for(const d of driveBins.get(cx+','+cy)||[]){
  if(seen.has(d))continue;seen.add(d);
  const actual=frontage174.surface(driveOwners174.get(d));
  if(actual&&G.nearest({x,y},actual.a,actual.b).d<actual.width/2+margin)return{a:{...actual.a},b:{...actual.b},width:actual.width};
 }
 if(Geometry160)for(const p of contextSites160(x,y,margin+1)){
  const q=G.local(p,x,y);
  for(const o of plan(p,0).terrain160||[]){
   if(!['road','bridge','quay'].includes(o.kind)||o.allowVehicle===false||!terrainContains160(o,q.x,q.y,margin))continue;
   const horizontal=o.w>o.h,a=G.global(p,horizontal?o.x:o.x+o.w/2,horizontal?o.y+o.h/2:o.y),b=G.global(p,horizontal?o.x+o.w:o.x+o.w/2,horizontal?o.y+o.h/2:o.y+o.h);
   return{a,b,width:horizontal?o.h:o.w,context160:p.id};
  }
 }
 return null;
}
function chunk(cx,cy){if(!Number.isInteger(cx)||!Number.isInteger(cy)||cx<0||cy<0||cx>=size/256||cy>=size/256)return{cx,cy,trees:[],rocks:[]};const id=cx+','+cy;if(chunks.has(id)){const c=chunks.get(id);chunks.delete(id);chunks.set(id,c);return c;}if(isG6){
 const ps=bins.get(id)||[],drives=driveBins.get(id)||[];
 const clearFor=(parcels,approaches)=>(x,y,pad=0)=>{
  if(x<pad||y<pad||x>size-pad||y>size-pad||x>home.minX-24-pad&&x<home.maxX+24+pad&&y>home.minY-24-pad&&y<home.maxY+24+pad)return false;
  if(hydrology&&hydrology.intersects({x:x-pad,y:y-pad,w:pad*2,h:pad*2}))return false;
  if(annexReservations.some(p=>x>p.l-pad&&x<p.r+pad&&y>p.t-pad&&y<p.b+pad))return false;
  if(parcels.some(p=>x>p.reserve.l-pad&&x<p.reserve.r+pad&&y>p.reserve.t-pad&&y<p.reserve.b+pad))return false;
  const n=nearestRoad({x,y});return n.d>n.road.width/2+pad+1&&!approaches.some(d=>G.nearest({x,y},d.a,d.b).d<d.width/2+pad+1);
 };
 const clear=clearFor(ps,drives),historicalClear=requestedGeneration>=8?clearFor(ps.filter(p=>p.generation<8),drives.filter(d=>!programmeDrives.has(d))):clear;
 const c=Biomes.scatter(seed,cx,cy,{clear:historicalClear,home,generation:baseGeneration});
 if(requestedGeneration>=8){
  // First reproduce G7 resources exactly, then clear only the new reservations.
  // These finite tombstones validate old harvests without granting new loot.
  const cleared=[];
  for(const items of [c.trees,c.rocks])for(let i=items.length-1;i>=0;i--){const o=items[i],pad=o.kind==='tree'?o.canopy+.6:o.r+.6;if(!clear(o.x,o.y,pad))cleared.push(...items.splice(i,1));}
  c.decor=c.decor.filter(o=>clear(o.x,o.y,.4));
  if(cleared.length)c.cleared=cleared;
 }
 if(Geometry160)c.contexts160=ps.filter(p=>p.programme160).map(p=>p.id);
 chunks.set(id,c);if(chunks.size>RULES.chunkCache)chunks.delete(chunks.keys().next().value);return c;
}const rnd=G.rng(G.hash(seed,cx,cy,'patches1')),trees=[],rocks=[],historic=!!historicRoadTree&&cx<8192/256&&cy<8192/256,ps=(bins.get(id)||[]).filter(p=>!historic||p.generation<5),terrainRoadTree=historic?historicRoadTree:roadTree;
for(let i=0;i<1100;i++){const x=cx*256+rnd()*256,y=cy*256+rnd()*256;if(x>4010&&x<4182&&y>4010&&y<4182)continue;const density=G.noise(seed^7931,x,y,310)*.7+G.noise(seed^9981,x,y,74)*.3,nr=nearestRoad({x,y},terrainRoadTree);if(nr.d<nr.road.width/2+5||ps.some(p=>x>p.reserve.l&&x<p.reserve.r&&y>p.reserve.t&&y<p.reserve.b))continue;if(rnd()>Math.max(0,density-.3)*1.25)continue;const tree={id:'T'+cx+'_'+cy+'_'+i,x,y,r:.2+rnd()*.28,canopy:2.6+rnd()*2.6,a:rnd()*Math.PI*2,kind:'tree',resource:'wood',amount:7+Math.floor(rnd()*17)};if(trees.some(q=>Math.hypot(q.x-x,q.y-y)<2.4))continue;trees.push(tree);}
for(let i=0;i<16;i++){const x=cx*256+rnd()*256,y=cy*256+rnd()*256,nr=nearestRoad({x,y},terrainRoadTree);if(G.noise(seed^6139,x,y,220)<.67||nr.d<nr.road.width/2+6||ps.some(p=>x>p.reserve.l&&x<p.reserve.r&&y>p.reserve.t&&y<p.reserve.b)||trees.some(t=>Math.hypot(t.x-x,t.y-y)<3.5)||x>4000&&x<4192&&y>4000&&y<4192)continue;rocks.push({id:'R'+cx+'_'+cy+'_'+i,x,y,r:.55+rnd()*.45,a:rnd()*Math.PI*2,kind:'rock',resource:'stone',amount:8+Math.floor(rnd()*17)});}
// Keep the historical RNG stream, IDs and amounts, then clear only new road corridors.
const cleared=[];if(historic){for(const [items,clearance]of[[trees,5],[rocks,6]])for(let i=items.length-1;i>=0;i--){const n=nearestRoad(items[i],extensionRoadTree);if(n.d<n.road.width/2+clearance)cleared.push(...items.splice(i,1));}}
// Post-filter only: do not consume RNG, renumber resources or forget historical
// harvest records. Cleared tombstones remain valid to the save validator.
const drives=driveBins.get(id)||[],localRoads=new Set();for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++)for(const r of roadBins.get(xx+','+yy)||[])localRoads.add(r);
const paved=[...localRoads];for(const items of [trees,rocks])for(let i=items.length-1;i>=0;i--){const item=items[i],pad=item.kind==='tree'?item.canopy+.8:item.r+.6;if(drives.some(d=>G.nearest(item,d.a,d.b).d<d.width/2+pad)||paved.some(r=>G.nearest(item,r.a,r.b).d<r.width/2+pad))cleared.push(...items.splice(i,1));}
const c={cx,cy,trees,rocks,...(cleared.length?{cleared}:{})};chunks.set(id,c);if(chunks.size>RULES.chunkCache)chunks.delete(chunks.keys().next().value);return c;}
function prefetch(x,y,budget=1){const cx=Math.floor(x/256),cy=Math.floor(y/256),order=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];let loaded=0;for(const [dx,dy]of order){const a=cx+dx,b=cy+dy;if(a<0||b<0||a>=size/256||b>=size/256||chunks.has(a+','+b))continue;chunk(a,b);if(++loaded>=budget)break;}return loaded;}
function around(x,y,r=100){const out=[];for(let cy=Math.floor((y-r)/256);cy<=Math.floor((y+r)/256);cy++)for(let cx=Math.floor((x-r)/256);cx<=Math.floor((x+r)/256);cx++)out.push(chunk(cx,cy));return out;}
function plan(p,z=0){const k=p.id+':'+z;if(plans.has(k)){const v=plans.get(k);plans.delete(k);plans.set(k,v);return v;}const v=p.campaign205?Campaign205.plan(p,z):p.programme160?{...Geometry160.plan(p,seed,z,effects.detailVersion??0),entry:G.global(p,p.w/2,-1),exit:G.global(p,p.w/2,p.h+1)}:p.programme3000?{...Codex3000.floor(p.programme3000,seed,z,p.id),entry:G.global(p,p.w/2,-1),exit:G.global(p,p.w/2,p.h+1)}:G.plan(p,z);plans.set(k,v);if(plans.size>RULES.planCache)plans.delete(plans.keys().next().value);return v;}
function sceneryRadius(t){const depleted=(effects.resourceTaken?.(t.id)||0)>=t.amount-.001;return depleted?(t.kind==='rock'?0:Math.min(t.r,.18)):t.r;}
function detailAt(p,z=0){
 if(p?.campaign205)return Campaign205.details(p,z);
 if(p?.programme160){
  if(effects.detailVersion<11||effects.detailVersion===undefined||p.context160?.profile)return Geometry160.details(p,seed,z,effects.detailVersion??0,plan(p,z));
  const key=p.id+':'+z;if(detailCache.has(key)){const value=detailCache.get(key);detailCache.delete(key);detailCache.set(key,value);return value;}
  const value=Geometry160.details(p,seed,z,effects.detailVersion,plan(p,z));detailCache.set(key,value);
  if(detailCache.size>64)detailCache.delete(detailCache.keys().next().value);return value;
 }
 if(requestedGeneration<7||!Detail157||!p||!p.levels?.includes(z))return{interior:[],outdoor:[],variant:null};
 const key=p.id+':'+z;if(detailCache.has(key)){const val=detailCache.get(key);detailCache.delete(key);detailCache.set(key,val);return val;}
 const programme=p.programme3000?Codex3000?.get(p.programme3000):Codex3000?.forParcel(seed,p,{
  biome:p.biome,townKind:settlementData?.towns?.find(t=>t.id===p.town)?.kind});
 let detail=Detail157.make(seed,p,z,plan(p,z),{story:Codex3000?.programmeProps(programme?.state)||[],family:Codex3000?.detailFamily(programme?.family)});
 if(effects.detailVersion>=2&&programme)detail=Codex3000.enrich({seed,p,z,plan:plan(p,z),detail,programme:programme.id,shapes:Detail157.objects});
 // Legacy G7 saves keep their collision graph. New campaigns opt in explicitly;
 // programme-native G8 sites have physical details from their creation.
 const layer=p.generation>=8||effects.detailVersion>=1?detail:{...detail,interior:Object.freeze(detail.interior.map(o=>Object.freeze({...o,solid:false}))),outdoor:Object.freeze(detail.outdoor.map(o=>Object.freeze({...o,solid:false})))};
 let dressed=Codex3000?.dress?.({seed,p,z,plan:plan(p,z),detail:layer})||layer;
 if(effects.detailVersion>=3&&programme)dressed=Codex3000.anchored({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});
 if(effects.detailVersion>=4&&programme)dressed=Codex3000.quantities({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});
 if(effects.detailVersion>=5&&programme)dressed=Codex3000.ensembles({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});
 if(effects.detailVersion>=6&&programme)dressed=Codex3000.fill({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});
 if(effects.detailVersion>=7&&programme)dressed=Codex3000.infill({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});
 if(effects.detailVersion>=8&&programme)dressed=Codex3000.stations({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});
 if(effects.detailVersion>=9&&programme)dressed=Codex3000.gardens({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});
 if(effects.detailVersion>=10&&programme)dressed=Codex3000.packing({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});
 if(effects.detailVersion>=11&&programme?.extension===158)dressed=Codex3000.furnish({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});
 if(effects.detailVersion>=12&&programme)dressed=Codex3000.complete({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id,detailVersion:effects.detailVersion});
 const colliders160=Object.freeze({interior:Object.freeze(dressed.interior.filter(o=>o.solid)),outdoor:Object.freeze(dressed.outdoor.filter(o=>o.solid))});
 const val=Object.freeze({...dressed,colliders160,programme3000:programme?.id||null,programmeState:programme?.state||null});
 detailCache.set(key,val);
 if(detailCache.size>64)detailCache.delete(detailCache.keys().next().value);
 return val;
}
function detailSolids(p,z,part,optical=false){const items=detailAt(p,z).colliders160?.[part]||[];return optical&&p.campaign205?items.filter(o=>o.opaque!==false):items;}
function blocked(x,y,r=.32,z=0,inside=null,ignore=null,optical=false,naturalWaterIgnored=false){if(!Number.isFinite(x)||!Number.isFinite(y)||x<r||y<r||x>size-r||y>size-r)return true;
if(z===0&&!optical&&!naturalWaterIgnored&&hydrology?.blockedCircle(x,y,r))return true;
if(z!==0){const p=pois.find(p=>p.id===inside);if(!p||!p.levels.includes(z))return true;const q=G.local(p,x,y);if(q.x<r||q.y<r||q.x>p.w-r||q.y>p.h-r)return true;}
for(const p of nearPOI(x,y,r+3)){const destroyed=!!effects.structureDestroyed?.(p.id);if(z!==0&&p.id!==inside)continue;if(!p.levels.includes(z))continue;const q=G.local(p,x,y);if(p.programme160){const pl=plan(p,z);if((optical?Geometry160.optical(p,pl,q.x,q.y,r,effects):Geometry160.terrainMovement(p,pl,q.x,q.y,r,false,effects)))return true;}if(q.x>-r&&q.y>-r&&q.x<p.w+r&&q.y<p.h+r){const pl=plan(p,z);if(!destroyed&&pl.walls.some(b=>G.circleRect(q.x,q.y,r,b)))return true;if(pl.objects.some(b=>b.id!==ignore&&G.circleRect(q.x,q.y,r,b)))return true;if(detailSolids(p,z,'interior',optical).some(b=>b.id!==ignore&&G.circleRect(q.x,q.y,r,b)))return true;}
if(z===0){for(const b of p.outdoor||[])if(b.id!==ignore&&G.circleRect(q.x,q.y,r,b))return true;for(const b of detailSolids(p,0,'outdoor',optical))if(b.id!==ignore&&G.circleRect(q.x,q.y,r,b))return true;}
if(z===0)for(const car of p.parking){if(car.id===ignore)continue;const v=G.local(car,x,y);if(G.circleRect(v.x,v.y,r,{x:0,y:0,w:car.w,h:car.h}))return true;}}
if(z===0)for(const c of around(x,y,r+4))for(const t of [...c.trees,...c.rocks])if(t.id!==ignore&&sceneryRadius(t)>0&&Math.hypot(t.x-x,t.y-y)<sceneryRadius(t)+r)return true;return false;}
// Sweep the same collision disc against real geometry. Sampling blocked() every
// 18 cm multiplied every crowd sight ray into hundreds of repeated chunk scans.
function line(a,b,z=0,inside=null,ignore=null,r=.05,purpose='optical'){
 if(!Number.isFinite(a.x+a.y+b.x+b.y+r)||r<0||[a,b].some(p=>p.x<r||p.y<r||p.x>size-r||p.y>size-r))return false;
 if(z===0&&purpose==='movement'&&hydrology?.lineBlocked(a,b,r))return false;
 const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;if(len2<1e-12)return!blocked(b.x,b.y,r,z,inside,ignore,purpose==='optical',purpose==='wildlifeWater');
 const circle=(p,radius,u=a,v=b)=>{const vx=v.x-u.x,vy=v.y-u.y,length=vx*vx+vy*vy,t=Math.max(0,Math.min(1,((p.x-u.x)*vx+(p.y-u.y)*vy)/length));return(p.x-u.x-vx*t)**2+(p.y-u.y-vy*t)**2<radius*radius-1e-9;};
 const rect=(u,v,o)=>G.segmentRect(u,v,{x:o.x-r,y:o.y,w:o.w+2*r,h:o.h})||G.segmentRect(u,v,{x:o.x,y:o.y-r,w:o.w,h:o.h+2*r})||r>0&&[[o.x,o.y],[o.x+o.w,o.y],[o.x,o.y+o.h],[o.x+o.w,o.y+o.h]].some(([x,y])=>circle({x,y},r,u,v));
 if(z!==0){const p=pois.find(p=>p.id===inside);if(!p||!p.levels.includes(z))return false;for(const point of[a,b]){const q=G.local(p,point.x,point.y);if(q.x<r||q.y<r||q.x>p.w-r||q.y>p.h-r)return false;}}
 const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,reach=Math.sqrt(len2)/2+r+4;
 for(const p of nearPOI(mx,my,reach)){
  if(z!==0&&p.id!==inside||!p.levels.includes(z))continue;const u=G.local(p,a.x,a.y),v=G.local(p,b.x,b.y);
  if(p.programme160&&Geometry160.rects(plan(p,z),effects,{optical:purpose==='optical'}).some(o=>o.id!==ignore&&rect(u,v,o)))return false;
  if(G.segmentRect(u,v,{x:-r,y:-r,w:p.w+2*r,h:p.h+2*r})){const pl=plan(p,z);if(!effects.structureDestroyed?.(p.id)&&pl.walls.some(o=>rect(u,v,o)))return false;if(pl.objects.some(o=>o.id!==ignore&&rect(u,v,o)))return false;if(detailSolids(p,z,'interior',purpose==='optical').some(o=>o.id!==ignore&&rect(u,v,o)))return false;}
  if(z===0){if((p.outdoor||[]).some(o=>o.id!==ignore&&rect(u,v,o)))return false;if(detailSolids(p,0,'outdoor',purpose==='optical').some(o=>o.id!==ignore&&rect(u,v,o)))return false;for(const car of p.parking){if(car.id===ignore)continue;const ca=G.local(car,a.x,a.y),cb=G.local(car,b.x,b.y);if(rect(ca,cb,{x:0,y:0,w:car.w,h:car.h}))return false;}}
 }
 if(z===0)for(const c of around(mx,my,reach))for(const items of[c.trees,c.rocks])for(const p of items)if(p.id!==ignore&&sceneryRadius(p)>0&&circle(p,sceneryRadius(p)+r))return false;
 return true;
}
function containers(x,y,r=3,z=0,inside=null){const out=[];for(const p of nearPOI(x,y,r+8)){if(z!==0&&p.id!==inside||!p.levels.includes(z))continue;for(const b of plan(p,z).objects){const point=G.global(p,b.x+b.w/2,b.y+b.h/2),reach=Math.hypot(b.w,b.h)/2+r;if(Math.hypot(point.x-x,point.y-y)<reach)out.push({...b,...point,worldAngle:p.a,poi:p.id,z});}if(z===0)for(const b of p.outdoor||[]){const point=G.global(p,b.x+b.w/2,b.y+b.h/2);if(Math.hypot(point.x-x,point.y-y)<r+Math.hypot(b.w,b.h)/2)out.push({...b,...point,worldAngle:p.a,poi:p.id,z:0});}if(z===0)for(const b of p.parking)if(Math.hypot(x-b.x,y-b.y)<r+2.4)out.push({...b,poi:p.id,z:0});}if(z===0)for(const c of around(x,y,r+5))for(const t of [...c.trees,...c.rocks])if(Math.hypot(x-t.x,y-t.y)<r+t.r)out.push({...t,z:0});return out;}
function vehicleClear(x,y,a,w=4.8,h=2.03){const car={x,y,w,h,a},pad=Math.max(w,h)/2+.5;if(x<pad||y<pad||x>size-pad||y>size-pad)return false;if(hydrology){
 const corners=[[0,0],[w,0],[w,h],[0,h]].map(([xx,yy])=>G.global(car,xx,yy));
 if(hydrology.blockedCircle(x,y,0)||corners.some((q,i)=>hydrology.lineBlocked(q,corners[(i+1)%4],0)))return false;
}for(const p of nearPOI(x,y,9)){const pl=plan(p,0),destroyed=!!effects.structureDestroyed?.(p.id);if(p.programme160){const q=G.local(p,x,y),localCar={x:q.x,y:q.y,a:a-p.a,w,h};if(Geometry160.terrainMovement(p,pl,q.x,q.y,0,localCar,effects))return false;}for(const o of [...(destroyed?[]:pl.walls),...pl.objects,...(p.outdoor||[]),...detailSolids(p,0,'interior'),...detailSolids(p,0,'outdoor')]){const center=G.global(p,o.x+o.w/2,o.y+o.h/2);if(G.obb(car,{...center,w:o.w,h:o.h,a:p.a}))return false;}for(const v of p.parking)if(G.obb(car,v))return false;}for(const c of around(x,y,7))for(const t of [...c.trees,...c.rocks]){const q=G.local(car,t.x,t.y);const radius=sceneryRadius(t);if(radius>0&&G.circleRect(q.x,q.y,radius,{x:0,y:0,w:car.w,h:car.h}))return false;}return true;}
function coveredAt205(x,y,z=0,inside=null){if(!Campaign205||z!==0||!Number.isFinite(x+y))return null;const candidate=inside?pois.find(p=>p.id===inside&&p.campaign205):null,site=candidate||nearPOI(x,y,1).find(p=>{if(!p.campaign205)return false;const q=G.local(p,x,y);return q.x>=0&&q.y>=0&&q.x<=p.w&&q.y<=p.h;});return site?!effects.structureDestroyed?.(site.id)&&Campaign205.insideBuilding(site,{x,y}):null;}
const contextSites160=(x,y,r=100)=>Number.isFinite(x)&&Number.isFinite(y)?nearPOI(x,y,r).filter(p=>p.programme160):pois.filter(p=>p.programme160);
function terrainAt160(x,y,z=0){if(z!==0||!Geometry160||!Number.isFinite(x)||!Number.isFinite(y))return null;for(const p of contextSites160(x,y,1)){const q=G.local(p,x,y);for(const o of [...(plan(p,0).terrain160||[])].reverse())if(terrainContains160(o,q.x,q.y))return{...o,poi:p.id,completed:o.completedKey?effects.contextCompleted160?.(o.completedKey)===true:false};}return null;}
return{seed,generation:requestedGeneration,landscape189,ecologyVersion,hydrologyVersion,hydrology,hydrologyAt:(x,y)=>hydrology?.sample(x,y)||null,biomes:Biomes,size,home,geography,biomeAt:(x,y)=>isG6?Biomes.sample(seed,x,y,true,{generation:baseGeneration}):null,bounds:{x:0,y:0,w:size,h:size},sectors:settlementData?.sectors||[],codexCoverage,contextCoverage160,...(Campaign205?{campaignCoverage205,coveredAt205}:{}),contextSites160,contextPlan160:plan,terrainAt160,contextCompleted160:key=>effects.contextCompleted160?.(key)===true,opticalBlocked:(x,y,r=.05,z=0,inside=null,ignore=null)=>blocked(x,y,r,z,inside,ignore,true),movementLine:(a,b,z=0,inside=null,ignore=null,r=.32)=>line(a,b,z,inside,ignore,r,'movement'),streamStats:()=>({chunks:chunks.size,plans:plans.size,roadBins:roadBins.size,nearestChecks}),wildlifeWaterClear:(x,y,r)=>!blocked(x,y,r,0,null,null,false,true),wildlifeWaterLine:(a,b,r)=>line(a,b,0,null,null,r,'wildlifeWater'),roads,pois,towns:settlementData?.towns||TOWNS,junctions:settlementData?.junctions||null,nearestRoad,drivewayAt,frontageFor:frontage174.forSite,driveFor:frontage174.surface,connectionFor:frontage174.connection,nearPOI,plan,detailAt,chunk,prefetch,around,threatCount:p=>threatCount(seed,p),blocked,vehicleClear,line,containers,cacheSize:()=>chunks.size,planCacheSize:()=>plans.size};
}
const api={RULES,TOWNS,LINES,create,sizeForGeneration,threatCount};root.DeadwallFrontierWorld=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
