/* Persistent light parcels, streamed interiors and vegetation. Legacy parcel geometry is untouched. */
(function(root){'use strict';
function augment({seed,roads,pois,addRoad,install,G,size}){
 // G4 removes streets but keeps their IDs; array length is no longer a free ID.
 const appendRoad=addRoad;let nextRoad=0;addRoad=(...args)=>{const road=appendRoad(...args);road.id='r131_'+nextRoad++;return road;};
 const Spawn=root.DeadwallWorldSpawns131||(typeof require==='function'?require('./world-spawns131.js'):null),sectors=[],towns=[],centres=new Map(),rural=['cabin','sawmill','mine','quarry','fuel'],industrial=['warehouse','garage','fuel','hardware','mine'],suburban=['house','duplex','grocer','clinic','school'],forest=['cabin','sawmill','motel','ruin'];
 const edge=root.DeadwallCore?.WorldStreamRules131?.sector||1024,old=8192,tiles=size/edge;
 for(let y=0;y<tiles;y++)for(let x=0;x<tiles;x++)if(x>=old/edge||y>=old/edge)centres.set(x+','+y,{x:x*edge+512+(G.hash(seed,x,y,'junction-x')%281-140),y:y*edge+512+(G.hash(seed,x,y,'junction-y')%281-140)});
 const horizontal=new Map();
 for(const [key,p]of centres){const [x,y]=key.split(',').map(Number),next=centres.get((x+1)+','+y),down=centres.get(x+','+(y+1));if(next)horizontal.set(key,addRoad([p.x,p.y],[next.x,next.y],y%4===0?9:7));else horizontal.set(key,addRoad([p.x,p.y],[size-80,p.y],5.8));if(down&&(x%3===2||G.hash(seed,key,'minor-road')%100<24))addRoad([p.x,p.y],[down.x,down.y],x%4===0?9:7);}
 // The two old road ends are joined physically, with no coordinate jump.
 const east=centres.get('8,4'),south=centres.get('4,8');addRoad([8160,4170],[east.x,east.y],7);addRoad([4096,8160],[south.x,south.y],7);
 for(const [key,p]of centres){
  const [sx,sy]=key.split(',').map(Number),roll=G.noise(seed^8311,p.x,p.y,3200)*100,biome=roll<35?'forest':roll<65?'rural':roll<85?'suburban':'industrial';
  const sector={id:'S'+sx+'_'+sy,x:sx*edge,y:sy*edge,w:edge,h:edge,biome,sites:[]};sectors.push(sector);
  const r=horizontal.get(key)||horizontal.get((sx-1)+','+sy);if(!r)continue;
  const pool={forest,rural,suburban,industrial}[biome],count=biome==='suburban'?3:2;
  for(let i=0;i<count;i++){
   const h=G.hash(seed,key,i,'parcel131'),type=pool[h%pool.length],d=G.BY[type],sign=i%2?1:-1,t=sx===tiles-1?.12+i*.31:.12+i*.12,angle=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),off=r.width/2+24+d.h/2,x=r.a.x+(r.b.x-r.a.x)*t-Math.sin(angle)*off*sign,y=r.a.y+(r.b.y-r.a.y)*t+Math.cos(angle)*off*sign,site=install(type,x,y,angle+(sign<0?Math.PI:0),r);
   if(!site)continue;
   const distance=Math.hypot(site.x-4096,site.y-4096),spawn=Spawn?.roll({seed,id:site.id,biome,distance})||{kind:'infected',band:distance>=6000?'far':'middle'};
   site.generation=5;site.sector=sector.id;if(biome==='suburban'&&G.hash(seed,key,'label')%3===0)site.town='T131_'+key;site.biome=biome;site.occupation=spawn.kind;site.distanceBand=spawn.band;site.zone=biome==='industrial'?'activite':'habitat';site.frontier131={role:spawn.kind==='allied'?'relay':spawn.kind==='infected'?'contested':'waypoint'};
   if(distance>=6000&&['mine','quarry','warehouse','fuel','clinic'].includes(type)){
    const resource=type==='clinic'?'medicine':type==='fuel'?'fuel':type==='warehouse'?'ammo':'scrap',amount=root.DeadwallCore.WorldOpsRules131.reserveAmounts[resource];
    for(let step=0;step<12;step++){const o={x:2+(step%4)*(site.w-5)/3,y:site.h+3+Math.floor(step/4)*2,w:1.2,h:.8};if(site.outdoor.some(b=>o.x<b.x+b.w+.5&&o.x+o.w+.5>b.x&&o.y<b.y+b.h+.5&&o.y+o.h+.5>b.y))continue;
     const index=1+Math.max(-1,...site.outdoor.map(b=>Number(b.id.split(':').at(-1))));const crate={...o,id:site.id+':out:'+index,kind:'crate',resource,amount,label:'Réserve scellée de '+({medicine:'soins',fuel:'carburant',ammo:'munitions',scrap:'pièces mécaniques'}[resource]),sealed131:true};site.outdoor.push(crate);site.frontier131.reserve=crate.id;break;
    }
   }
   site.name=d.name+' · '+String(sx+1).padStart(2,'0')+'-'+String(sy+1).padStart(2,'0')+(i?String.fromCharCode(65+i):'');sector.sites.push(site.id);
  }
  if(biome==='suburban'&&G.hash(seed,key,'label')%3===0)towns.push({id:'T131_'+key,name:['Les Frênes','La Combe','Les Saules','Montfaucon','Les Brandes','Belle-Rive','La Futaie','Le Haut-Chêne','Les Granges','La Varenne'][G.hash(seed,key,'name')%10]+' '+(sx+1)+'-'+(sy+1),x:p.x,y:p.y,r:430,radius:430,kind:'quartier',parcels:sector.sites.length});
 }
 return{sectors,towns};
}
const api=Object.freeze({augment});root.DeadwallWorldStream131=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
