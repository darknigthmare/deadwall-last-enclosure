'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../src/husbandry191.js'),C=require('../src/core.js'),R=C.Husbandry191Rules;
const pen=id=>({id,x:100+id*10,y:200,health:R.health,food:0,water:0,meat:0,hides:0,leather:0,breed:0,meatAge:0,hideAge:0});
const animal=(id,site,extra={})=>({id,pen:site,species:'rabbit',age:R.matureSeconds,health:100,status:'held',...extra});
test('199 reports cover every owned enclosure in ID order and expose finite autonomy without changing state',()=>{
 const state={pens:[{...pen(7),food:3,water:4},{...pen(1),food:1,water:2}],animals:[animal(3,1),animal(4,1,{age:1}),animal(8,7)]},before=JSON.stringify(state);
 const rows=H.penReports(state);assert.deepEqual(rows.map(r=>r.id),[1,7]);assert.equal(rows[0].living,2);assert.equal(rows[0].young,1);assert.equal(rows[0].adults,1);
 assert.equal(rows[0].autonomySeconds,Math.min(1/(2*R.foodPerSecond),2/(2*R.waterPerSecond)));
 assert.equal(JSON.stringify(state),before);rows[0].products.meat=999;rows[0].alerts.push('forged');assert.notEqual(H.penReports(state)[0].products.meat,999);assert.ok(!H.penReports(state)[0].alerts.includes('forged'));
});
test('199 empty pens, stranded animals and spoiled products have explicit non-misleading reports',()=>{
 const state={pens:[pen(1),{...pen(2),health:0,meat:2,meatAge:R.meatLife-.5,hides:1,hideAge:100}],animals:[animal(3,2,{status:'stranded',health:40}),animal(4,1,{status:'dead',health:0})]};
 const rows=H.penReports(state);assert.equal(rows[0].autonomySeconds,null,'no needs is not a fabricated infinite reserve');assert.equal(rows[0].living,0);assert.equal(rows[0].dead,1);
 assert.equal(rows[1].stranded,1);assert.equal(rows[1].autonomySeconds,0);assert.equal(rows[1].products.meatSeconds,.5);
 for(const code of ['ruined','no-food','no-water','injured','stranded'])assert.ok(rows[1].alerts.includes(code),code);
 assert.equal(rows[1].birthSeconds,null,'a ruined enclosure cannot promise a birth');assert.equal(rows[0].products.meatSeconds,null);
});
test('199 the animal-status report uses actual current consumers, never released or processed history',()=>{
 const state={pens:[{...pen(1),food:10,water:10,breed:100}],animals:[animal(2,1,{sex:'female'}),animal(5,1,{sex:'male'}),animal(3,1,{status:'released'}),animal(4,1,{status:'processed',health:0})]};
 const row=H.penReports(state)[0];assert.equal(row.living,2);assert.equal(row.autonomySeconds,Math.min(10/(2*R.foodPerSecond),10/(2*R.waterPerSecond)));assert.equal(row.birthSeconds,R.breedSeconds-100);
 assert.deepEqual(H.penReports({pens:[],animals:[]}),[]);
});
test('199 a real captive remains readable from D-17 without remotely enabling care or changing a save',()=>{
 const {captured}=require('./helpers/husbandry191.cjs'),{g}=captured(),save=g.serialize();
 // Declared saved checkpoint: the commander has returned to the local depot.
 save.frontier.active=false;save.frontier.inside=null;save.frontier.z=0;assert.equal(g.restoreSave(save),true);g.paused=true;
 const before=g.serialize(),rows=g.husbandry191.reports(),overview=g.husbandry191.overview();
 assert.equal(rows.length,1);assert.equal(rows[0].living,1);assert.ok(overview.rows.some(row=>String(row.label).includes('Registre · enclos '+rows[0].id)));
 for(const kind of ['feed','water','cook','tan','slaughter'])assert.equal(g.husbandry191.quote(kind,rows[0].id).ok,false,kind);
 const after=g.serialize();delete before.timestamp;delete after.timestamp;assert.deepEqual(after,before);
 const view=g.husbandry191.view();rows[0].products.meat=999;assert.deepEqual(g.husbandry191.view(),view);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(g.husbandry191.reports().map(r=>r.id),rows.map(r=>r.id));
});
