'use strict';
const assert=require('node:assert/strict');
const H=require('./vertical177.cjs');const {C,S,R,V,clone,tick,boot,build,ascend,equip,approach,lowStock,snapshot}=H;
const N=require('../../src/vertical-network179.js'),B=C.VerticalNetwork179;
function pair(age=4,type='lookout2a177',gap=2,axis='x'){
 const g=boot(age);for(const n of g.world.nodes)n.harvest(n.amount);
 let a,b;const def=C.BUILDINGS[type];for(const [k,n]of Object.entries(def.cost||{}))g.resources[k]=Math.max(g.resources[k],n*2+1000);
 for(let x=8;x<100&&!a;x+=2)for(let y=8;y<100&&!a;y+=2){
  const bx=axis==='x'?x+def.size[0]+gap:x,by=axis==='y'?y+def.size[1]+gap:y;
  if(!g.world.placement(def,x,y,0).valid||!g.world.placement(def,bx,by,0).valid)continue;
  if(!g.placeOne(type,x,y))continue;a=g.world.atCell(x,y);a.progress=1;a.health=a.maxHealth;
  if(!g.placeOne(type,bx,by))throw Error('Second support unexpectedly unavailable');b=g.world.atCell(bx,by);b.progress=1;b.health=b.maxHealth;
 }
 assert.ok(a&&b,'two legally paid supports');g.refreshMetrics(true);Object.assign(g.player,g.vertical175.entrance(a));ascend(g,a);
 return{g,a,b,v:g.vertical175,n:g.vertical175.network};
}
function geometry(f,kind=B.links[f.g.tier.id].id){return N.shape({id:1,kind,a:{site:f.a.id,level:0},b:{site:f.b.id,level:0},progress:0,health:1},f.g.world.buildings,f.v.presentation().sites);}
function moveTo(f,x,y){for(let i=0;i<100&&Math.hypot(f.g.player.x-x,f.g.player.y-y)>.02;i++){const dx=x-f.g.player.x,dy=y-f.g.player.y,k=f.n.carrying()?B.carrySpeed:1;f.g.moveFriendly(f.g.player,dx/k,dy/k);}assert.ok(Math.hypot(f.g.player.x-x,f.g.player.y-y)<.05,'physical path reaches point');}
function bridge(f,kind){const q=geometry(f,kind);assert.ok(q);moveTo(f,q.ports[0].x*R.tile,q.ports[0].y*R.tile);const quote=f.n.linkQuote(f.b.id,0,kind);assert.ok(quote.ok,quote.reason);assert.ok(f.n.buildLink(f.b.id,0,kind).ok);tick(f.g,quote.seconds+.1);assert.equal(f.n.presentation().links[0].link.progress,1);return q;}
function packGun(f){moveTo(f,f.a.x,f.a.y);const m=equip(f.g,f.a,'handRifle177');m.ammo=7;const quote=f.n.packQuote(m.id);assert.ok(quote.ok,quote.reason);assert.ok(f.n.packModule(m.id).ok);tick(f.g,quote.seconds+.1);assert.equal(f.n.presentation().cargo?.id,m.id);return m;}


function roofInvader(f,level=0){
 const g=f.g;g.spawnZombie('runner');const id=g.zombies.at(-1).id,z=g.zombies.at(-1);
 z.x=f.a.x;z.y=f.a.y;z.lastX=z.x;z.lastY=z.y;
 const d=g.serialize(),v=d.expansions127.modules.vertical175;
 // Declared AI fixture: one native enemy is already on the source deck, no new budget or loot owner.
 v.climbers.push({id,site:f.a.id,level,bridge:null,stair:null,side:0,lane:C.VerticalSiege176.margin,start:0,progress:1,stage:'roof',fallHeight:0});
 assert.ok(g.restoreSave(d));f.a=g.world.buildings.get(f.a.id);f.b=g.world.buildings.get(f.b.id);g.rebuildBuckets();return g.zombies.find(z=>z.id===id);
}
function until(f,predicate,seconds=40,sample=()=>{}){
 for(let t=0;t<seconds;t+=.1){if(predicate())return t;f.g.updateZombies(.1);f.g.rebuildBuckets();sample();}
 assert.ok(predicate(),'AI condition reached within '+seconds+' active seconds');return seconds;
}
module.exports={...H,N,B,pair,geometry,moveTo,bridge,packGun,roofInvader,until};
