'use strict';
const assert=require('node:assert/strict');
const {boot127}=require('./expansions127.cjs');
const C=require('../../src/core.js'),S=require('../../src/vertical-citadel175-state.js'),V=require('../../src/vertical-citadel175.js');
const R=C.VerticalCitadel175,clone=x=>JSON.parse(JSON.stringify(x));
function tick(g,t){for(let x=0;x<t-1e-8;x+=.1)g.vertical175.step(Math.min(.1,t-x));}
function boot(age=10){const {game:g}=boot127();V.install(g);g.startNew('standard','17117');const d=g.serialize();d.urban.peakScore=2200;d.urban.progression151={version:1,age};d.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:3000,medicine:50};assert.equal(g.restoreSave(d),true);assert.equal(g.tier.id,age);return g;}
function build(g,type='verticalFoundation6'){
 // Large late-age foundations need a cleared site; this fixture harvests native nodes without crediting loot.
 const large=C.BUILDINGS[type].size.some(n=>n>=20);if(large)for(const node of g.world.nodes)node.harvest(node.amount);
 function* candidates(){
  for(let x=large?4:38;x<(large?120:85);x+=2)for(let y=large?4:38;y<(large?120:85);y+=2)yield[x,y];
  // Road clearance can leave lawful plots outside the old central even-cell scan.
  for(let y=1;y<C.WORLD_TILES;y++)for(let x=1;x<C.WORLD_TILES;x++)yield[x,y];
 }
 for(const[x,y]of candidates())if(g.world.placement(C.BUILDINGS[type],x,y,0).valid&&g.placeOne(type,x,y)){
  const b=g.world.atCell(x,y);assert.equal(b.type,type);
  // Explicit late-age fixture: only the native paid support is completed here.
  b.progress=1;b.health=b.maxHealth;g.refreshMetrics(true);Object.assign(g.player,g.vertical175.entrance(b));return b;
 }throw Error('No legal support in fixture: '+type);
}
function ascend(g,b,level=0){const q=g.vertical175.accessQuote(b.id,level);assert.ok(q.ok,q.reason);assert.ok(g.vertical175.access(b.id,level).ok);tick(g,q.seconds+.2);assert.equal(g.vertical175.pose().level,level);}
function equip(g,b,kind,slot=0){if(!g.vertical175.pose().site)ascend(g,b);g.player.x=b.x;g.player.y=b.y;const q=g.vertical175.buildModule(kind,slot);assert.ok(q.ok,q.reason);tick(g,R.modules[kind].seconds+.2);const m=g.vertical175.presentation().sites.find(s=>s.id===b.id).decks[g.vertical175.pose().level].modules.find(m=>m.slot===slot);approach(g,b,m);return m;}
function approach(g,b,m){const p=S.slots(b)[m.slot],d=R.modules[m.kind];g.player.x=(p.x+d.size[0]/2)*R.tile+13;g.player.y=p.y*R.tile;assert.ok(g.vertical175.clearAt(g.player.x,g.player.y,g.vertical175.pose().z));}
function lowStock(g){for(const k of C.RESOURCE_KEYS)g.resources[k]=20;}
function snapshot(g){const d=clone(g.serialize());delete d.timestamp;return d;}
module.exports={C,S,R,V,clone,tick,boot,build,ascend,equip,approach,lowStock,snapshot};
