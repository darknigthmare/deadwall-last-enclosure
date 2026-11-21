(function(root){'use strict';
const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null),Road=root.DeadwallRoadKit||(typeof require==='function'?require('./region-roadkit.js'):null);
const profiles=[['bourg',470,70,1100],['village',330,42,520],['ville',620,100,2600],['cite-industrielle',500,72,1800],['grande-ville',760,140,5100],['hameau',260,25,220]];
const HOME=['cottageSmall','house','rowhouse','duplex','bungalow','familyHouse','basementHouse','duplexWide','villa'],CIV=['grocer','clinic','school','townhall','bakery','postoffice','pharmacy','cafe','chapel'],URB=['studioBlock','apartments','longBlock','residence','officeBlock','cornerShop','bank','laundromat','library','gym','medicalCentre'],WORK=['warehouse','garage','joinery','smallWorkshop','reuse','logisticsHall','waterStation','generatorRoom'];
function augment(ctx){const{seed,roads,pois,towns,addRoad,install}=ctx,tt=towns.map((t,i)=>({...t,kind:profiles[i][0],radius:profiles[i][1],r:profiles[i][1],target:profiles[i][2],populationBefore:profiles[i][3]}));
for(const t of tt){const q=(x,y)=>[t.x+x*Math.cos(t.a)-y*Math.sin(t.a),t.y+x*Math.sin(t.a)+y*Math.cos(t.a)],step=t.kind==='grande-ville'?150:t.kind==='hameau'?126:138,n=Math.floor(t.radius/step);for(let k=-n;k<=n;k++){const o=k*step,l=t.radius-Math.abs(k)*10;addRoad(q(-l,o),q(l,o),k===0?(t.kind==='grande-ville'?11:8):5.8);addRoad(q(o,-l),q(o,l),k===0?8:5.8);}if(['hameau','village'].includes(t.kind)){addRoad(q(t.radius*.55,0),q(t.radius+95,62),5.2);addRoad(q(t.radius*.55,0),q(t.radius+90,-58),5.2);}
const local=()=>roads.filter(r=>Math.hypot((r.a.x+r.b.x)/2-t.x,(r.a.y+r.b.y)/2-t.y)<t.radius+95),required=t.kind==='hameau'?['cabin','grocer','smallWorkshop']:t.kind==='village'?['grocer','clinic','school','townhall','bakery','cafe','garage','chapel']:['grocer','clinic','school','townhall','market','firestation','postoffice','pharmacy','library','gym','fuel'];let count=0;
function put(type,n){const list=local(),d=G.BY[type];if(!list.length||!d)return false;const r=list[n%list.length],f=.10+(G.hash(seed,t.id,type,n)%7800)/10000,a=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),side=n%2?1:-1,off=r.width/2+20+d.h/2,x=r.a.x+(r.b.x-r.a.x)*f-Math.sin(a)*off*side,y=r.a.y+(r.b.y-r.a.y)*f+Math.cos(a)*off*side;if(Math.hypot(x-t.x,y-t.y)>t.radius+50)return false;const p=install(type,x,y,a+(side<0?Math.PI:0),r);if(!p)return false;p.town=t.id;p.zone=Math.hypot(x-t.x,y-t.y)<t.radius*.43?'centre':WORK.includes(type)?'activite':'habitat';count++;return true;}
for(const type of required)for(let i=0;i<Math.max(20,local().length*18);i++)if(put(type,i))break;
for(let i=0;i<2200&&count<t.target;i++){const central=i%3===0,pool=t.kind==='cite-industrielle'&&i%4===0?WORK:central&&!['hameau','village'].includes(t.kind)?URB:(i%7===0?CIV:HOME),valid=pool.filter(x=>G.BY[x]);if(valid.length)put(valid[G.hash(seed,t.id,i)%valid.length],i);}t.parcels=count;}
const net=Road.topology(roads,seed);roads.splice(0,roads.length,...net.roads);return{towns:tt,junctions:net.junctions};}
// G7 gives settlements an actual mixed programme. Ecological pools still govern
// isolated sites; shops and homes belong to the human settlement itself.
function populate141(ctx){
 const {seed,roads,towns,install,decorate,biomes}=ctx,C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.WorldTownRules141;
 if(!R)throw Error('Programme territorial 1.41 absent.');
 const at=(r,f,type,side)=>{const d=G.BY[type],a=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),off=r.width/2+R.setback+d.h/2;return{x:r.a.x+(r.b.x-r.a.x)*f-Math.sin(a)*off*side,y:r.a.y+(r.b.y-r.a.y)*f+Math.cos(a)*off*side,a:a+(side<0?Math.PI:0)};};
 const validPool=pool=>Object.fromEntries(Object.entries(pool).filter(([id])=>G.BY[id])),centrePool=validPool(R.centre),housingPools={urban:validPool(R.housing.urban),rural:validPool(R.housing.rural)},roadBiomes=new Map(),workPools=new Map();
 const weighted=(pool,key)=>biomes.weighted(pool,seed,'settlement141',key);
 function workPool(road){
  let id=roadBiomes.get(road);if(!id){id=biomes.sample(seed,(road.a.x+road.b.x)/2,(road.a.y+road.b.y)/2,false,{generation:7}).id;roadBiomes.set(road,id);}
  if(!workPools.has(id)){const specialized=Object.fromEntries(Object.entries(biomes.buildingPool(id)).filter(([type])=>WORK.includes(type)||['sawmill','mine','quarry','farmhouse','marketgarden','scrapyard','freight'].includes(type)));workPools.set(id,validPool({...R.work,...specialized}));}
  return workPools.get(id);
 }
 for(const town of towns){
  const local=roads.filter(r=>r.roadClass==='street'&&Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>38&&Math.hypot((r.a.x+r.b.x)/2-town.x,(r.a.y+r.b.y)/2-town.y)<town.radius+25),frontages=[];
  for(const r of local){const length=Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y),slots=Math.max(1,Math.floor(length/R.frontageStep));for(let i=0;i<slots;i++)for(const side of[-1,1])for(const shift of[0,-.23,.23]){const f=Math.max(.08,Math.min(.92,(i+.5)/slots+shift/slots)),x=r.a.x+(r.b.x-r.a.x)*f,y=r.a.y+(r.b.y-r.a.y)*f;frontages.push({r,f,side,core:Math.hypot(x-town.x,y-town.y),rank:G.hash(seed,town.id,r.id,i,side,shift,'frontage141')});}}
  const ordered=frontages.slice().sort((a,b)=>a.core-b.core||a.rank-b.rank),required=R.required[town.kind]||R.required.village,services={};
  function place(slot,type,role,zone){const point=at(slot.r,slot.f,type,slot.side);if(Math.hypot(point.x-town.x,point.y-town.y)>town.radius+60)return false;if(zone==='activite'&&!Object.hasOwn(R.work,type)&&!Object.hasOwn(biomes.buildingPool(biomes.sample(seed,point.x,point.y,false,{generation:7}).id),type))return false;const p=install(type,point.x,point.y,point.a,slot.r);if(!p)return false;decorate(p,town,role,zone);return p;}
  for(const role of required){
   const choices=R.services[role].filter(id=>G.BY[id]),ranked=choices.slice().sort((a,b)=>G.hash(seed,town.id,role,a)-G.hash(seed,town.id,role,b));let site=null,attempts=0;
   // Try each location with all compatible programme sizes before giving up a
   // street: a large market must not veto a possible small grocery.
   for(const slot of ordered){for(const type of ranked){if(++attempts>R.attemptLimit)break;site=place(slot,type,role,role==='work'?'activite':role==='housing'?'habitat':'centre');if(site)break;}if(site||attempts>R.attemptLimit)break;}
   services[role]=site?.id||null;
  }
  const shuffled=frontages.slice().sort((a,b)=>a.rank-b.rank),urban=['ville','grande-ville'].includes(town.kind),zoneWeights=R.zoning[town.kind]||R.zoning.village;
  for(let i=0;i<shuffled.length&&i<R.attemptLimit&&town.parcels<town.target;i++){
   const slot=shuffled[i],key=town.id+':'+i,zone=slot.core<town.radius*.38?'centre':biomes.weighted(zoneWeights,seed,'settlement141',key+':zone');
   const pool=zone==='centre'?centrePool:zone==='habitat'?housingPools[urban?'urban':'rural']:workPool(slot.r);
   const type=weighted(pool,key+':program');place(slot,type,'district',zone);
  }
  town.program141={required:required.slice(),services,complete:required.every(role=>services[role]),parcels:town.parcels};
 }
}
const api=Object.freeze({augment,populate141});root.DeadwallRegionSettlements=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;})(globalThis);
