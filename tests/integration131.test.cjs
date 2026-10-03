'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const C=require('../src/core.js'),A=C.FieldAtlas;
test('1.31 atlas : anciens identifiants inchangés, neuf secteurs sans collision',()=>{
 const ids=new Set();for(let y=0;y<192;y++)for(let x=0;x<192;x++){const id=A.cell(x*128+64,y*128+64);assert.ok(id>=0&&id<36864);assert.equal(ids.has(id),false);ids.add(id);if(x<64&&y<64)assert.equal(id,y*64+x);}assert.equal(ids.size,36864);assert.equal(A.cell(24576,0),-1);assert.equal(A.cell(-1,0),-1);
});
test('1.31 atlas : reprise lointaine sans déplacement des visites historiques',()=>{
 const {g}=boot131(),raw=g.serialize();raw.fieldAtlas.cells=[0,2048,4095,A.cell(17000,21000)];g.restoreSave(raw);assert.deepEqual([...g.fieldAtlas.travelled()],raw.fieldAtlas.cells);const old=structuredClone(raw);old.frontier.generation=4;assert.throws(()=>g.restoreSave(old),/Secteurs hors/);assert.equal(g.frontier.world().size,24576);assert.deepEqual([...g.fieldAtlas.travelled()],raw.fieldAtlas.cells);
});
test('1.31 atlas : archives lointaines appartiennent au vrai lieu-dit de la graine',()=>{
 const{g}=boot131(),w=g.frontier.world(),p=w.pois.find(p=>p.generation===5),town=A.district(p,w),raw=g.serialize();raw.fieldAtlas.reports=[{id:p.id,town:town.id,at:0}];g.restoreSave(raw);assert.equal(g.fieldAtlas.overview().reports[0].id,p.id);const wrong=g.serialize();wrong.fieldAtlas.reports[0].town='T131_99,99';assert.throws(()=>g.restoreSave(wrong),/Signalement étranger/);
});
test('1.31 intégration : dix modules et cinq domaines, navigation clavier et HUD de tâche',()=>{
 const{g,doc}=boot131({ui:true}),find=id=>doc.body.querySelectorAll('#'+id)[0];assert.equal(g.expansions.entries().length,10);
 for(const[id,group]of [['defense131','defense'],['exploration131','exploration'],['player131','player'],['world131','world'],['lore131','lore']]){assert.ok(g.expansionUI.open(id));assert.equal(find('expansionGroup-'+group).getAttribute('aria-pressed'),'true');assert.equal(find('expansionTab-'+id).getAttribute('aria-selected'),'true');assert.equal(g.paused,true);g.expansionUI.close();assert.equal(g.paused,false);}
});
