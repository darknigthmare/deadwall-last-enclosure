'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{bootDocument134}=require('../scripts/qa-startup134.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
function start(){const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();require('./helpers/generation141.cjs').legacy(g);return g;}
test('reconnaissance G6 : un vrai dossier du nord-ouest se finance, progresse, se sauvegarde et devient une tournée',()=>{
 const g=start(),C=globalThis.DeadwallCore,w=g.frontier.world();assert.equal(w.generation,6);
 const p=w.pois.find(p=>p.x<8192&&p.y<8192),town=C.FieldAtlas.district(p,w);assert.match(town.id,/^T135_/);assert.ok(w.towns.some(t=>t.id===town.id));
 const b=new(g.core().constructor)(g.nextId++,'expeditionOffice',72,65,0,1);g.world.add(b);g.refreshMetrics(true);g.fieldcraft.setup();g.resources.food=250;assert.ok(g.expeditions.assign().ok);const u=g.units.find(u=>u.id===g.expeditions.snapshot().analyst.id);standAt(g,u,b);
 const food=g.resources.food;assert.ok(g.fieldAtlas.commission(town.id).ok);assert.equal(g.resources.food,food-5);
 for(let i=0;i<80;i++)g.expeditions.updateAssignedUnit(u,.25);const mid=g.fieldAtlas.snapshot();assert.equal(mid.job.progress,20);assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.fieldAtlas.snapshot(),mid);
 const analyst=g.units.find(u=>u.id===g.expeditions.snapshot().analyst.id);for(let i=0;i<80;i++)g.expeditions.updateAssignedUnit(analyst,.25);
 const completed=g.fieldAtlas.snapshot();assert.equal(completed.job,null);assert.equal(completed.reports.length,3);assert.ok(completed.reports.every(r=>r.town===town.id));assert.equal(g.resources.food,food-5);
 assert.ok(g.fieldAtlas.add(completed.reports[0].id));assert.ok(g.fieldAtlas.start());const map=g.fieldAtlas.mapView(),details=g.fieldAtlas.overview();assert.deepEqual(map.reports,details.reports);assert.deepEqual(map.steps,details.steps);assert.equal(map.reports[0].confirmed,false);assert.ok(g.fieldAtlas.planning().legs.length);const before=g.fieldAtlas.snapshot();assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.fieldAtlas.snapshot(),before);
 // Map reads must not scan all towns or change the saved campaign.
 const district=C.FieldAtlas.district;C.FieldAtlas.district=()=>{throw Error('Unexpected district eligibility scan');};try{assert.equal(g.fieldAtlas.mapView().reports.length,3);}finally{C.FieldAtlas.district=district;}
 assert.deepEqual(g.fieldAtlas.snapshot(),before);
});
test('reconnaissance 1.36 : les villes historiques restent distinctes et les faux T135 sont refusés',()=>{
 const g=start(),C=globalThis.DeadwallCore,A=C.FieldAtlas,p={x:4700,y:4070};
 assert.equal(A.district(p,{generation:5,towns:[{id:'T135_0',x:4700,y:4070}]}).id,'t0');
 for(const town of['T135_34','T135_-1','T135_00','T135_999']){const s=A.initial();s.job={town,progress:0,targets:['P0000']};assert.throws(()=>A.normalize(s));}
 const save=g.serialize(),site=g.frontier.world().pois.find(p=>p.x<8192&&p.y<8192);const historical=A.district(site,{generation:5,towns:[]}).id;save.fieldAtlas.reports=[{id:site.id,town:historical,at:0}];g.restoreSave(save);assert.deepEqual(g.fieldAtlas.snapshot().reports,save.fieldAtlas.reports);const before=g.world;save.fieldAtlas.reports[0].town=historical==='t0'?'t1':'t0';assert.throws(()=>g.restoreSave(save));assert.equal(g.world,before);
 const jobSave=g.serialize(),oldTargets=g.frontier.world().pois.filter(p=>p.x<8192&&p.y<8192&&A.district(p,{generation:5,towns:[]}).id===historical).slice(0,3).map(p=>p.id);jobSave.fieldAtlas.reports=[];jobSave.fieldAtlas.job={town:historical,targets:oldTargets,progress:20};g.restoreSave(jobSave);assert.deepEqual(g.fieldAtlas.snapshot().job,jobSave.fieldAtlas.job);
});
test('peintre carte 1.36 : calques masqués sans lecture lourde, calques actifs via mapView',()=>{
 require('../src/field-atlas-art.js');const draw=globalThis.DeadwallFieldAtlasArt.draw;let calls=0;const g={fieldAtlas:{overview(){throw Error('Full analyst overview must not be used');},mapView(){calls++;return{reports:[],steps:[]};}}},c={save(){},restore(){}},cam={scale:1};draw(c,g,{},cam,{intelligence:false,tours:false});assert.equal(calls,0);draw(c,g,{},cam,{intelligence:true,tours:true});assert.equal(calls,1);
});
test('interface reconnaissance 1.36 : les options du bureau suivent les villes et noms de la campagne active',()=>{
 const g=start(),show=()=>{document.getElementById('reconPanel').classList.remove('hidden');document.getElementById('fieldAtlasPanel').open=true;g.fieldAtlasUI.refresh(true);return document.getElementById('fieldAtlasDistrict');};
 const first=show(),expected=g.frontier.world().towns.map(t=>[t.id,t.name]);assert.deepEqual([...first.children].map(o=>[o.value,o.textContent]),expected);assert.match(first.value,/^T135_/);
 g.startNew('standard','84329');g.campaignIntro132.skip();require('./helpers/generation141.cjs').legacy(g);const next=show(),changed=g.frontier.world().towns.map(t=>[t.id,t.name]);assert.deepEqual([...next.children].map(o=>[o.value,o.textContent]),changed);assert.notDeepEqual(changed,expected);assert.ok(changed.some(([id])=>id===next.value));
});
