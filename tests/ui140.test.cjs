'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const source=process.env.DEADWALL_UI140_BASELINE;
const {bootDocument134}=require(source?path.join(source,'scripts/qa-startup134.cjs'):'../scripts/qa-startup134.cjs');
function fixture(){const env=bootDocument134(),{g}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.setBuildCollapsed(true);g.updateUI();return env;}
function activate(doc,button){
 assert.ok(doc.body.contains(button),'Contrôle réellement monté');assert.equal(button.disabled,false);button.focus();button.click();
 // The shared DOM models listeners but not the native onclick property.
 button.onclick?.({target:button});
}
function discoveredFixture(){
 const env=fixture(),{g,doc}=env,w=g.frontier.world(),raw=g.serialize();raw.frontier.seen=w.pois.slice(0,2).map(p=>p.id);g.restoreSave(raw);
 g.frontierUI.open();const filter=doc.getElementById('frontierFilter');filter.value='all';g.frontierUI.refresh(true);return{...env,place:w.pois[0]};
}

test('UI 1.40 : sécuriser une annexe rend le focus à Districts quand le contrôle devient indisponible',()=>{
 const {g,doc}=fixture();g.tier={id:2};Object.assign(g.resources,{wood:500,stone:500,scrap:500});g.worldEvolutionUI.open('districts');
 const before={...g.resources},elapsed=g.elapsed,button=doc.getElementById('claim-east');activate(doc,button);
 assert.equal(g.worldEvolution.snapshot().districts.east.level,1);
 assert.equal(g.resources.wood,before.wood-120);assert.equal(g.resources.stone,before.stone-100);assert.equal(g.resources.scrap,before.scrap-80);
 assert.equal(doc.getElementById('claim-east').disabled,true);assert.equal(doc.body.contains(button),false);
 assert.ok(doc.activeElement===doc.getElementById('evoTab-districts'),'Onglet connecté et utilisable après la sécurisation');
 assert.ok(doc.body.contains(doc.activeElement));assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(g.paused,true);assert.equal(g.elapsed,elapsed);
 const saved=g.serialize();g.restoreSave(saved);assert.equal(g.worldEvolution.snapshot().districts.east.level,1);assert.equal(g.resources.wood,before.wood-120);
});

test('UI 1.40 : choisir un repère dans le carnet conserve le vrai bouton renouvelé',()=>{
 const {g,doc,place}=discoveredFixture(),before=g.serialize(),button=doc.getElementById('pin-'+place.id);activate(doc,button);
 assert.equal(g.frontier.snapshot().pin,place.id);const replacement=doc.getElementById(button.id);assert.notEqual(replacement,button);
 assert.ok(doc.activeElement===replacement,'Le nouveau bouton du lieu choisi reprend le focus');assert.ok(doc.body.contains(doc.activeElement));
 assert.equal(replacement.textContent,'REPÈRE ACTIF');assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.commandModal);
 assert.deepEqual(g.player.carry,before.player.carry);assert.deepEqual(g.resources,before.resources);assert.equal(g.elapsed,before.elapsed);
 g.frontierUI.refresh(true);assert.ok(doc.activeElement===replacement,'Un rafraîchissement inchangé garde le contrôle');
 g.showCommand(false);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.ok(doc.body.contains(doc.activeElement));
});

test('UI 1.40 : une annotation garde son sélecteur et sa valeur après reconstruction du carnet',()=>{
 const {g,doc,place}=discoveredFixture(),list=doc.getElementById('frontierDossier').querySelector('.frontier-pois');
 const select=list.querySelectorAll('select').find(n=>n.dataset.place===place.id);assert.ok(select);select.focus();select.value='danger';select.dispatch('change');
 const next=list.querySelectorAll('select').find(n=>n.dataset.place===place.id);assert.notEqual(next,select);
 assert.equal(g.frontier.snapshot().notes[place.id],'danger');assert.equal(next.value,'danger');
 assert.ok(doc.activeElement===next,'Le sélecteur renouvelé du même lieu reprend le focus');assert.ok(doc.body.contains(doc.activeElement));
 g.frontier.annotate(place.id,'todo');const filter=doc.getElementById('frontierFilter');filter.focus();filter.value='todo';filter.dispatch('change');
 const filtered=list.querySelectorAll('select').find(n=>n.dataset.place===place.id);assert.ok(filtered);filtered.focus();filtered.value='danger';filtered.dispatch('change');
 assert.equal(list.querySelectorAll('select').some(n=>n.dataset.place===place.id),false);assert.ok(doc.activeElement===doc.getElementById('frontierSearch'),'Le champ de recherche reprend le focus si le filtre retire le lieu');
 const saved=g.serialize();g.restoreSave(saved);assert.equal(g.frontier.snapshot().notes[place.id],'danger');
});

test('UI 1.40 : le carnet ne déplace pas un focus extérieur quand son état est rafraîchi',()=>{
 const {g,doc,place}=discoveredFixture(),search=doc.getElementById('frontierSearch');search.focus();assert.equal(g.frontier.pin(place.id),true);g.frontierUI.refresh(true);
 assert.ok(doc.activeElement===search);assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.commandModal);
});

test('UI 1.40 : un district verrouillé par le palier explique son indisponibilité sans payer',()=>{
 const {g,doc}=fixture(),stock={...g.resources},elapsed=g.elapsed;g.worldEvolutionUI.open('districts');
 const button=doc.getElementById('claim-east');assert.ok(doc.body.contains(button));assert.equal(button.disabled,true);assert.match(button.title,/Palier 2/);
 const state=g.worldEvolution.snapshot(),q=g.worldEvolution.previewDistrictClaim('east');assert.equal(q.ok,false);assert.match(q.reason,/Palier 2/);
 button.click();button.onclick?.({target:button});assert.equal(g.worldEvolution.claimDistrict('east'),false);
 assert.deepEqual(g.resources,stock);assert.deepEqual(g.worldEvolution.snapshot(),state);assert.equal(g.elapsed,elapsed);
 assert.equal(g.worldEvolution.previewDistrictClaim('missing').ok,false);assert.equal(g.worldEvolution.claimDistrict('missing'),false);
});

test('UI 1.40 : le devis partagé annonce le budget puis refuse un sac de stocks insuffisant sans mutation',()=>{
 const {g,doc}=fixture();g.tier={id:2};Object.assign(g.resources,{wood:0,stone:500,scrap:500});g.worldEvolutionUI.open('districts');
 const button=doc.getElementById('claim-east');assert.equal(button.disabled,true);assert.match(button.title,/Stocks insuffisants/);
 const before={resources:{...g.resources},state:g.worldEvolution.snapshot()},q=g.worldEvolution.previewDistrictClaim('east');
 assert.equal(q.ok,false);assert.deepEqual(q.cost,{wood:120,stone:100,scrap:80});assert.equal(g.worldEvolution.claimDistrict('east'),false);
 assert.deepEqual(g.resources,before.resources);assert.deepEqual(g.worldEvolution.snapshot(),before.state);
 g.resources.wood=500;g.worldEvolutionUI.refresh(true);const ready=doc.getElementById('claim-east');assert.equal(ready.disabled,false);
 const approved=g.worldEvolution.previewDistrictClaim('east');assert.equal(approved.ok,true);assert.deepEqual(approved.cost,q.cost);
 approved.cost.wood=0;assert.equal(g.worldEvolution.previewDistrictClaim('east').cost.wood,120,'Le devis exposé ne modifie pas le prochain coût');
 assert.equal(g.worldEvolution.snapshot().districts.east.level,0,'Un devis ne sécurise pas le district');
});

test('UI 1.40 : construire dans l’annexe explique le refus, paie une fois et reprend le chantier sauvegardé',()=>{
 const {g,doc}=fixture();g.tier={id:2};Object.assign(g.resources,{wood:500,stone:500,scrap:500});assert.equal(g.worldEvolution.claimDistrict('east'),true);
 g.resources.wood=0;g.worldEvolutionUI.open('districts');const denied=doc.getElementById('build-east-housing');assert.ok(doc.body.contains(denied));assert.equal(denied.disabled,true);assert.match(denied.title,/Stocks insuffisants/);
 const rejected={resources:{...g.resources},state:g.worldEvolution.snapshot()};assert.equal(g.worldEvolution.buildDistrict('east','housing'),false);
 assert.deepEqual(g.resources,rejected.resources);assert.deepEqual(g.worldEvolution.snapshot(),rejected.state);
 g.resources.wood=500;g.worldEvolutionUI.refresh(true);const button=doc.getElementById('build-east-housing'),before={...g.resources},elapsed=g.elapsed;
 const quote=g.worldEvolution.previewDistrictBuild('east','housing');assert.equal(quote.ok,true);assert.deepEqual(quote.cost,globalThis.DeadwallCore.WorldEvolution.RULES.districtBuildings.housing.cost);
 quote.cost.wood=0;assert.equal(g.worldEvolution.previewDistrictBuild('east','housing').cost.wood,90);
 activate(doc,button);const built=g.worldEvolution.snapshot().districts.east.buildings;assert.equal(built.length,1);assert.equal(built[0].slot,0);assert.equal(built[0].progress,0);
 assert.equal(g.resources.wood,before.wood-90);assert.equal(g.resources.stone,before.stone-70);assert.equal(g.resources.scrap,before.scrap-35);
 assert.ok(doc.activeElement===doc.getElementById(button.id));assert.ok(doc.body.contains(doc.activeElement));
 for(let i=0;i<12;i++)g.loop(g.lastFrame+40);assert.equal(g.elapsed,elapsed);assert.equal(g.worldEvolution.snapshot().districts.east.buildings[0].progress,0);
 g.showCommand(false);g.update(.1);const progress=g.worldEvolution.snapshot().districts.east.buildings[0].progress;assert.ok(progress>0&&progress<1);
 const saved=g.serialize(),costs={...g.resources};g.restoreSave(saved);assert.equal(g.worldEvolution.snapshot().districts.east.buildings.length,1);assert.equal(g.worldEvolution.snapshot().districts.east.buildings[0].progress,progress);assert.deepEqual(g.resources,costs);
 assert.equal(g.worldEvolution.previewDistrictBuild('missing','housing').ok,false);assert.equal(g.worldEvolution.buildDistrict('missing','housing'),false);
 assert.equal(g.worldEvolution.previewDistrictBuild('east','missing').ok,false);assert.equal(g.worldEvolution.buildDistrict('east','missing'),false);
});
