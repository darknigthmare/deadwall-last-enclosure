'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const M=require('../src/city-catalogue150.js');
const clean=g=>{const data=g.serialize();delete data.timestamp;return data;};
const textTree=node=>node.textContent+' '+node.children.map(textTree).join(' ');

test('all eleven ages are inspectable through the shipped preparation UI without spending or consuming RNG',()=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 assert.ok(g.cityCatalogueUI150,'Catalogue mounted from the actual shipped HTML');
 assert.equal(doc.getElementById('cityCatalogueAge150').children.length,11);
 g.cityCatalogueUI150.open();const before=clean(g),next=g.random.next;g.random.next=()=>{throw Error('Catalogue must not consume RNG');};
 try{for(let age=0;age<=10;age++){
  assert.equal(g.cityCatalogueUI150.selectAge(age),true);assert.equal(doc.getElementById('cityCatalogueAge150').value,String(age));
  const choices=doc.getElementById('cityCatalogueGroups150').querySelectorAll('article').map(n=>n.dataset.choice).sort();
  assert.deepEqual(choices,g.cityCatalogueUI150.catalogue.forAge(age).map(n=>n.key).sort());
 }}finally{g.random.next=next;}
 assert.deepEqual(clean(g),before);assert.equal(g.cityCatalogueUI150.selectAge(11),false);
 assert.equal(g.cityCatalogueUI150.selectAge(-1),false);
});

test('catalogue has native keyboard controls, restrained groups, specific costs and honest future prerequisites',()=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.cityCatalogueUI150.open();
 const select=doc.getElementById('cityCatalogueAge150');select.value='10';select.dispatch('change');
 assert.equal(g.cityCatalogueUI150.selectedAge(),10);assert.match(doc.getElementById('cityCatalogueSummary150').textContent,/À atteindre : 1850/);
 assert.equal(select.getAttribute('aria-describedby'),'cityCatalogueSummary150');select.focus();assert.equal(doc.activeElement,select);
 const groups=doc.getElementById('cityCatalogueGroups150');assert.ok([...groups.children].every(n=>n.tagName==='DETAILS'&&!n.open));
 const battery=groups.querySelectorAll('article').find(n=>n.dataset.choice==='building:frontBattery150');
 assert.match(textTree(battery),/Batterie vide/);assert.match(textTree(battery),/À construire et achever/);assert.match(textTree(battery),/820/);
 g.cityCatalogueUI150.selectAge(9);const mechanism=groups.querySelectorAll('article').find(n=>n.dataset.choice==='mechanism:counterweight');assert.match(textTree(mechanism),/Coût dans le sac/);assert.match(textTree(mechanism),/Manque dans le sac/);
 doc.getElementById('cityCatalogueCurrent150').click();assert.equal(g.cityCatalogueUI150.selectedAge(),g.tier.id);
});

test('all advanced training cards show their real benefit and required orders and formation',()=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.cityCatalogueUI150.open();
 const C=globalThis.DeadwallCore;
 for(const id of ['triage','sapeur','veille','coordination']){const def=C.CompanionPackRules.exercises[id];g.cityCatalogueUI150.selectAge(def.tier);
  const row=doc.getElementById('cityCatalogueGroups150').querySelectorAll('article').find(n=>n.dataset.choice==='exercise:'+id);assert.ok(row);
  assert.equal(row.children[1].textContent,def.description);assert.match(textTree(row),/Tenir|Regrouper/);assert.match(textTree(row),/Ligne|Espacement/);assert.match(textTree(row),/Entraînement préalable/);
 }
});

test('hidden preparation dossier skips detailed reads and visible diagnostics refresh after support loss',()=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 let reads=0;const values=g.world.buildings.values.bind(g.world.buildings);g.world.buildings.values=()=>{reads++;return values();};
 assert.equal(g.cityCatalogueUI150.refresh(true),false);assert.equal(reads,0);
 g.cityCatalogueUI150.open();assert.ok(reads>0);g.cityCatalogueUI150.selectAge(1);
 const row=()=>doc.getElementById('cityCatalogueGroups150').querySelectorAll('article').find(n=>n.dataset.choice==='building:lumber');
 assert.match(textTree(row()),/Manque au dépôt|Matériaux présents au dépôt/);
 const supply={...g.resources};g.cityCatalogueUI150.refresh(true);assert.deepEqual(g.resources,supply);
 g.showCommand(true,'workers');reads=0;assert.equal(g.cityCatalogueUI150.refresh(true),false);assert.equal(reads,0);
});

test('catalogue actions open the existing controller without construction or automatic payment',()=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.cityCatalogueUI150.open();
 const groups=doc.getElementById('cityCatalogueGroups150'),stock={...g.resources},structures=g.world.buildings.size;
 const buildingGroup=[...groups.children].find(n=>n.dataset.kind==='building');buildingGroup.open=true;
 const action=groups.querySelectorAll('button').find(n=>n.dataset.catalogueAction==='building:warehouse');action.click();
 assert.equal(g.currentCategory,globalThis.DeadwallCore.BUILDINGS.warehouse.category);assert.equal(g.buildCollapsed,false);assert.equal(g.activeOverlay,null);
 assert.deepEqual(g.resources,stock);assert.equal(g.world.buildings.size,structures);assert.equal(g.selectedBuild,null);
});

test('building navigation from paused preparations resumes the field with visible focus and no purchase',()=>{
 for(const id of ['warehouse','frontBattery150']){
  const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.togglePause(true);g.cityCatalogueUI150.open();
  const C=globalThis.DeadwallCore;g.cityCatalogueUI150.selectAge(C.BUILDINGS[id].unlockTier);
  const groups=doc.getElementById('cityCatalogueGroups150');[...groups.children].find(n=>n.dataset.kind==='building').open=true;
  const stock={...g.resources},rng=g.random.state,count=g.world.buildings.size;
  groups.querySelectorAll('button').find(n=>n.dataset.catalogueAction==='building:'+id).click();
  assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.equal(g.buildCollapsed,false);
  assert.ok(doc.getElementById('pauseMenu').classList.contains('hidden'));
  assert.equal(doc.activeElement.closest('.hidden'),null);assert.equal(doc.activeElement.closest('[inert]'),null);
  assert.deepEqual(g.resources,stock);assert.equal(g.random.state,rng);assert.equal(g.world.buildings.size,count);assert.equal(g.selectedBuild,null);
 }
});

test('final shipped installer paints the front accumulator after the historical battery wrapper',()=>{
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();assert.ok(g.d17Art150);
 const C=globalThis.DeadwallCore,d=C.BUILDINGS.frontBattery150,b={id:99150,type:d.id,def:d,w:d.size[0],h:d.size[1],x:600,y:600,left:552,bottom:648,health:d.health,completed:true,powered:true};
 let chargeReads=0;g.powerGrid={...g.powerGrid,charge:id=>{assert.equal(id,b.id);chargeReads++;return d.battery.capacity/2;}};
 const paints=[],blit=g.art.blit;g.art.images.d17Defense150={};g.art.blit=(ctx,key,rect,...destination)=>{paints.push({key,rect,destination});return true;};
 const before=clean(g);try{assert.equal(g.art.drawBuilding(g.ctx,b),true);}finally{g.art.blit=blit;}
 assert.equal(chargeReads,1);assert.equal(paints.length,1);assert.equal(paints[0].key,'d17Defense150');assert.deepEqual(paints[0].rect,globalThis.DeadwallD17Art150.SPRITES.frontBattery150.rect);assert.deepEqual(clean(g),before);
});
