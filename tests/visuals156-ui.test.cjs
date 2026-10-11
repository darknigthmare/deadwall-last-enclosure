'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,pose}=require('./helpers/navigation130.cjs');
const C=require('../src/core.js');

function team(){const env=fixture({ui:true});env.g.population=10;env.g.resources.food=100;env.g.worldEvolutionUI.open('people');return env;}
test('visuals156: live team refresh preserves the attached native activation target and its focus without a transaction',()=>{
 const {g,doc}=team(),button=doc.getElementById('comp-samir'),card=doc.getElementById('evoCompanion-samir'),before=g.serialize();button.focus();
 for(let i=0;i<4;i++)g.worldEvolutionUI.refresh(true);
 assert.equal(doc.getElementById('comp-samir'),button);assert.equal(doc.getElementById('evoCompanion-samir'),card);assert.ok(doc.body.contains(button));assert.equal(doc.activeElement,button);
 const after=g.serialize();delete before.timestamp;delete after.timestamp;assert.deepEqual(after,before);
});
test('visuals156: the retained team button updates its callback from assignment to removal with exactly one paid fee',()=>{
 const {g,doc}=team(),button=doc.getElementById('comp-samir');assert.equal(button.disabled,false);button.onclick();
 assert.equal(doc.getElementById('comp-samir'),button);assert.equal(button.textContent,'RETIRER');assert.equal(g.resources.food,98);assert.deepEqual(g.worldEvolution.overview().companions.map(p=>p.id),['samir']);
 g.worldEvolutionUI.refresh(true);button.onclick();assert.equal(g.resources.food,98);assert.deepEqual(g.worldEvolution.overview().companions,[]);assert.equal(button.textContent,'AFFECTER');
});
test('visuals156: a newly unaffordable retained assignment cannot spend stock or leave focus on its disabled action',()=>{
 const {g,doc}=team(),button=doc.getElementById('comp-samir');button.focus();g.resources.food=1;g.worldEvolutionUI.refresh(true);
 assert.equal(doc.getElementById('comp-samir'),button);assert.equal(button.disabled,true);assert.equal(doc.activeElement.id,'evoTab-people');button.onclick();assert.equal(g.resources.food,1);assert.deepEqual(g.worldEvolution.overview().companions,[]);
});
test('visuals156: claiming a real district inserts paid build options without replacing the existing claim target or card',()=>{
 const {g,doc}=fixture({ui:true});g.tier={id:10};g.resources.wood=g.resources.stone=g.resources.scrap=500;g.worldEvolutionUI.open('districts');
 const card=doc.getElementById('evoDistrict-east'),claim=doc.getElementById('claim-east'),quote=g.worldEvolution.previewDistrictClaim('east'),before={...g.resources};assert.equal(claim.disabled,false);claim.onclick();
 assert.equal(doc.getElementById('evoDistrict-east'),card);assert.equal(doc.getElementById('claim-east'),claim);assert.equal(claim.disabled,true);
 for(const [key,value]of Object.entries(quote.cost))assert.equal(g.resources[key],before[key]-value);
 const build=doc.getElementById('build-east-housing'),buildQuote=g.worldEvolution.previewDistrictBuild('east','housing'),paid={...g.resources};assert.ok(card.contains(build));assert.equal(build.disabled,false);build.onclick();
 assert.equal(doc.getElementById('build-east-housing'),build);for(const [key,value]of Object.entries(buildQuote.cost))assert.equal(g.resources[key],paid[key]-value);
 assert.deepEqual(g.worldEvolution.overview().districts.find(d=>d.id==='east').buildings,[{type:'housing',slot:0,progress:0}]);
});
test('visuals156: fleet refresh keeps the selection target while using the live shared vehicle controller',()=>{
 const {g,doc}=fixture({ui:true});g.tier={id:10};g.worldEvolutionUI.open('fleet');const button=doc.getElementById('fleet-bike');button.focus();g.worldEvolutionUI.refresh(true);
 assert.equal(doc.getElementById('fleet-bike'),button);assert.equal(doc.activeElement,button);assert.equal(button.disabled,false);button.onclick();assert.equal(g.worldEvolution.overview().fleet.selected,'bike');assert.equal(button.textContent,'SÉLECTIONNÉ');
});
test('visuals156: fleet preparation explains the regional refusal and does not select an unavailable model',()=>{
 const {g,doc}=fixture({ui:true});pose(g,{x:4800,y:4300});g.worldEvolutionUI.open('fleet');const selected=g.worldEvolution.overview().fleet.selected;
 for(const id of Object.keys(C.WorldEvolution.RULES.vehicles)){const b=doc.getElementById('fleet-'+id);assert.equal(b.disabled,true);assert.match(b.title,/Revenez à D-17/);b.onclick();}
 assert.equal(g.worldEvolution.overview().fleet.selected,selected);
});
test('visuals156: switching away removes the old team controls and restores focus to the selected tab',()=>{
 const {g,doc}=team(),button=doc.getElementById('comp-samir');button.focus();doc.getElementById('evoTab-campaign').onclick();
 assert.equal(doc.body.contains(button),false);assert.equal(doc.activeElement.id,'evoTab-campaign');assert.deepEqual(g.worldEvolution.overview().companions,[]);assert.equal(g.resources.food,100);
});
