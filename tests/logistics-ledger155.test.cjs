'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fresh,prepare,standAt,stable}=require('./helpers/city-content150.cjs');
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,actual+' / '+expected);
const row=(report,key)=>report.rows.find(r=>r.key===key);
function ledger(g,withReserve=true){
 return globalThis.DeadwallCore.FieldOperations.logistics({
  resources:g.resources,storage:g.storage,population:g.population,
  buildings:[...g.world.buildings.values()],hasResearch:id=>g.hasResearch(id),
  activeCrisis:g.activeCrisis,siegeFuelUse:g.siege?.pumpFuelPerMinute()||0,
  ...(withReserve?{inputReserve:id=>g.fortificationPack?.inputReserve(id)||0}:{})
 });
}
// Completed supports and doctrine records below are explicit prepared fixtures.
// Real paid equipment commands and economy ticks verify the reader; no campaign
// duration, unlocked age trajectory or construction financing is claimed.
test('155 logistique : les trois générations thermiques indiquent le carburant réellement consommé, avec et sans doctrine',()=>{
 const {g}=fresh(),supports=['generator','powerPlant','megaPower'].map(type=>prepare(g,type));
 for(const grid of [false,true])for(const active of supports){
  g.research.completed=grid?['grid']:[];
  for(const b of supports)b.territoryOffline=b!==active;
  g.resources.fuel=100;g.refreshMetrics(true);
  const report=ledger(g),before=g.resources.fuel;
  g.economyTick(.25);
  const observedPerMinute=(before-g.resources.fuel)/.25*60;
  near(row(report,'fuel').consumption,observedPerMinute);
  near(report.generatorUse,observedPerMinute);
  assert.ok(observedPerMinute>0,active.type+' operates');
 }
});

test('155 logistique : arrêt territorial, arrêt de siège, chantier et réserve vide ne brûlent aucun carburant fictif',()=>{
 const {g}=fresh(),supports=['generator','powerPlant','megaPower'].map(type=>prepare(g,type));
 for(const active of supports)for(const state of ['territory','siege','construction','empty']){
  for(const b of supports){b.territoryOffline=b!==active;b.siegeOffline=false;b.progress=1;}
  active.territoryOffline=state==='territory';active.siegeOffline=state==='siege';
  if(state==='construction')active.progress=.5;
  g.resources.fuel=state==='empty'?0:100;g.refreshMetrics(true);
  const report=ledger(g),before=g.resources.fuel;g.economyTick(.25);
  near(before-g.resources.fuel,0);near(row(report,'fuel').consumption,0);near(report.generatorUse,0);
 }
});

test('155 logistique : un régulateur payé protège ses intrants et le bilan suit les ticks réels avant et après Continue',()=>{
 const {g,C}=fresh(),factory=prepare(g,'ammoFactory');
 standAt(g,g.player,factory);
 const scrapBefore=g.resources.scrap;
 assert.equal(g.fortificationPack.equip('regulator',factory.id).ok,true);
 near(g.resources.scrap,scrapBefore-C.FortificationPackRules.regulatorCost.scrap);
 const reserve=g.fortificationPack.inputReserve(factory.id);assert.ok(reserve>0);
 g.resources.scrap=reserve;g.resources.ammo=0;g.refreshMetrics(true);
 assert.equal(factory.powered,true,'the protected input, rather than power, stops the factory');
 let report=ledger(g),before={...g.resources};g.economyTick(.25);
 near(row(report,'ammo').production,0);near(row(report,'scrap').consumption,0);
 near(g.resources.ammo,before.ammo);near(g.resources.scrap,before.scrap);
 assert.equal(report.pausedIndustry,1);
 // The optional reader preserves historical callers without a fitting service.
 assert.ok(row(ledger(g,false),'ammo').production>0);
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 const restored=g.world.buildings.get(factory.id);
 near(g.fortificationPack.inputReserve(restored.id),reserve);
 report=ledger(g);near(row(report,'ammo').production,0);
 // Supply enough excess for one native quarter-second tick. The displayed
 // per-minute rate represents that current allocation, not a 60-second promise.
 g.resources.scrap=reserve+restored.def.consumes.scrap*.25;
 g.refreshMetrics(true);report=ledger(g);before={...g.resources};g.economyTick(.25);
 near(row(report,'ammo').production,(g.resources.ammo-before.ammo)/.25*60);
 near(row(report,'scrap').consumption,(before.scrap-g.resources.scrap)/.25*60);
 near(g.resources.scrap,reserve);
 g.resources.scrap=reserve;report=ledger(g);near(row(report,'ammo').production,0);
});

test('155 logistique : réserve limitée, saturation, circuit coupé et lectures répétées restent cohérents et sans mutation',()=>{
 const {g,C}=fresh(),factory=prepare(g,'ammoFactory');standAt(g,g.player,factory);
 assert.equal(g.fortificationPack.equip('regulator',factory.id).ok,true);
 const reserve=g.fortificationPack.inputReserve(factory.id);
 g.resources.ammo=0;g.resources.scrap=reserve+factory.def.consumes.scrap*.125;g.refreshMetrics(true);
 let report=ledger(g),before={...g.resources};g.economyTick(.25);
 near(row(report,'ammo').production,(g.resources.ammo-before.ammo)/.25*60);
 near(row(report,'scrap').consumption,(before.scrap-g.resources.scrap)/.25*60);
 g.resources.scrap=reserve+10;g.resources.ammo=g.storage;g.refreshMetrics(true);
 report=ledger(g);before={...g.resources};g.economyTick(.25);
 near(row(report,'ammo').production,0);near(row(report,'scrap').consumption,0);
 near(g.resources.scrap,before.scrap);
 g.resources.ammo=0;assert.equal(g.powerGrid.setCircuit(factory.id,'off'),true);
 report=ledger(g);before={...g.resources};g.economyTick(.25);
 near(row(report,'ammo').production,0);near(g.resources.ammo,before.ammo);near(g.resources.scrap,before.scrap);
 assert.equal(g.powerGrid.setCircuit(factory.id,'on'),true);
 const snapshot=stable(g);for(let n=0;n<20;n++)ledger(g);
 assert.deepEqual(stable(g),snapshot,'stocks, fitted reserve, campaign, RNG and grid are unchanged');
 assert.equal(C.SAVE_VERSION,20);
});

test('155 logistique : le panneau livré reçoit la réserve physique et affiche la centrale réellement active',()=>{
 const {g,doc}=fresh(),factory=prepare(g,'ammoFactory');prepare(g,'powerPlant');
 standAt(g,g.player,factory);assert.equal(g.fortificationPack.equip('regulator',factory.id).ok,true);
 g.resources.scrap=g.fortificationPack.inputReserve(factory.id);g.resources.ammo=0;g.resources.fuel=100;
 g.refreshMetrics(true);g.fieldOperations.open();
 const button=doc.getElementById('commandPanel-field').querySelectorAll('button').find(b=>b.dataset.fieldView==='logistics');
 assert.ok(button);button.click();g.fieldOperations.refresh();
 const panel=doc.getElementById('field-logistics');assert.equal(panel.classList.contains('hidden'),false);
 const rows=panel.querySelector('tbody').children;
 const ammo=rows.find(r=>r.children[0].textContent==='MUNITIONS'),fuel=rows.find(r=>r.children[0].textContent==='CARBURANT');
 assert.equal(ammo.children[2].textContent,'0,0','the native panel passes the installed reserve to its reader');
 const report=ledger(g),format=n=>n.toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1});
 assert.equal(fuel.children[3].textContent,format(row(report,'fuel').consumption));
 assert.ok(row(report,'fuel').consumption>1.08,'the active power plant is included alongside its generator');
 assert.match(panel.children.at(-1).textContent,/1 industrie\(s\) arrêtée\(s\)/);
});
