'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),C=require('../src/core.js'),Save=require('../src/save.js');
function legacy(){const e=bootGame();e.game.startNew('standard','903145');const d=e.game.serialize();d.version=12;delete d.fieldcraft;return{...e,raw:d};}
for(const path of ['validated','stored'])test('terrain146 : migration v12 '+path+' conserve le packing physique historique',()=>{
 const {game:g,storage,raw}=legacy();
 const generated=new g.world.constructor(raw.worldSeed).nodes.map(n=>[n.id,n.x,n.y]);
 g.restoreSave(raw);const packed=g.fieldcraft.snapshot().nodes;
 assert.notDeepEqual(packed,generated,'la migration doit réellement dégager les réserves physiques');
 const stocks={...g.resources},amounts=g.serialize().nodes,random=g.random.state;
 const parsed=Save.validate(raw);assert.equal(parsed.fieldcraft.legacyLayout,true);assert.deepEqual(parsed.fieldcraft.nodes,[]);
 if(path==='validated')g.restoreSave(parsed);
 else{storage.clear();storage.set(C.SAVE_KEY,JSON.stringify(raw));assert.equal(g.load(),true);}
 assert.deepEqual(g.fieldcraft.snapshot().nodes,packed);
 assert.deepEqual(g.resources,stocks);assert.deepEqual(g.serialize().nodes,amounts);assert.equal(g.random.state,random);
 const current=g.serialize();assert.equal(current.version,20);
 for(let i=0;i<3;i++){g.restoreSave(Save.validate(current));assert.deepEqual(g.fieldcraft.snapshot().nodes,packed);}
});
