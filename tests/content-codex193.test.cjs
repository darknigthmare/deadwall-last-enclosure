'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),Guide=require('../src/content-codex193.js');
const FORAGE=['blackberry','blackthorn','rosehip','hazelnut','walnut','chestnut','apple','pear','plum','raspberry','blueberry','wildStrawberry','chanterelle','bolete','fallenBranch','flint'];
const WEATHER=['dry','drizzle','showers','rain','downpour','clearing'];
const CAMPAIGN=['ruralSurvey','farmSupply','fuelRecovery','archiveRescue','agroRecovery','triageSearch','engineeringRecovery','watchDuty'];
const MECHANISMS=['runnerCable193','breachClamp193','enduranceRack193','shieldTongs193','quickCable193','siegeBrake193'];
const expected=[...FORAGE.map(id=>'forage193-'+id),...WEATHER.map(id=>'weather193-'+id),...CAMPAIGN.map(id=>'campaign193-'+id),'water214-rain-collector'].sort();
const source=fs.readFileSync(require.resolve('../src/content-codex193.js'),'utf8');

test('193 guide retains its30 entries and adds one real water service without duplicating trap cards',()=>{
 const entries=Guide.entries();assert.equal(entries.length,31);assert.deepEqual(entries.map(e=>e.id).sort(),expected);
 assert.deepEqual([...Guide.CAMPAIGNS],CAMPAIGN);assert.equal(new Set(entries.map(e=>e.id)).size,31);
 for(const e of entries){
  assert.equal(e.status,'jouable');assert.ok(['nature','systemes'].includes(e.family));
  for(const key of ['title','summary','layout','access','supplies','risks','night','variants','interactions','qa','source']){assert.equal(typeof e[key],'string',e.id+' '+key);assert.ok(e[key].length>(key==='title'?5:20),e.id+' '+key);assert.doesNotMatch(e[key],/undefined|NaN|À COMPLÉTER/);}
 }
 assert.ok(Object.isFrozen(entries)&&entries.every(Object.isFrozen));assert.strictEqual(Guide.entries(),entries);
 const choices=require('../src/world-codex-actions159.js').entries.filter(e=>MECHANISMS.includes(e.choice159?.split(':')[1]));
 assert.deepEqual(choices.map(e=>e.choice159).sort(),MECHANISMS.map(id=>'mechanism:'+id).sort());
 for(const id of MECHANISMS){const e=choices.find(e=>e.choice159==='mechanism:'+id),d=C.FortificationPackRules.mechanisms[id];assert.ok(e.summary.includes(d.description));assert.ok(e.interactions.includes(d.charges+' déclenchement(s)'));assert.ok(!entries.some(item=>item.id.includes(id)));}
});

test('214 guide derives rain limits and paid preparation from their owner without promising potable water',()=>{
 const R=C.CampaignWater214Rules,e=Guide.entries().find(e=>e.id==='water214-rain-collector');
 assert.ok(e.supplies.includes(R.prepare.seconds+' s'));
 for(const[k,n]of Object.entries(R.prepare.cost))assert.ok(e.supplies.includes(n+' '+C.RESOURCE_META[k].label.toLowerCase()));
 assert.ok(e.layout.includes(R.capacity+' unités'));assert.match(e.summary,/Eau non potable/);assert.match(e.risks,/aucune pluie rétroactive/);assert.match(e.interactions,/débite exactement sa source/);
 const sandbox={DeadwallCore:{...C,CampaignWater214Rules:{...R,capacity:17,prepare:{seconds:19,cost:{wood:7,scrap:9}}}}};vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const before=sandbox.DeadwallContentCodex193.entries(),changed=before.find(e=>e.id==='water214-rain-collector');assert.match(changed.layout,/17 unités/);assert.match(changed.supplies,/19 s.*7 bois.*9 ferraille/);
 sandbox.DeadwallCore={...sandbox.DeadwallCore,CampaignWater214Rules:{...R,capacity:13}};
 const after=sandbox.DeadwallContentCodex193.entries();assert.notStrictEqual(before,after);assert.match(after.find(e=>e.id==='water214-rain-collector').layout,/13 unités/);
});

test('193 forage guide states finite gains, real footprint and backpack-only commitments',()=>{
 for(const id of FORAGE){const d=C.Forage193Rules.species[id],e=Guide.entries().find(e=>e.id==='forage193-'+id),n=x=>String(x).replace('.',',');
  assert.ok(e.title.includes(d.name));assert.ok(e.summary.includes(d.amount.join(' à ')+' unités'));assert.ok(e.summary.includes(d.seconds+' s sur place'));assert.ok(e.layout.includes(n(d.length)+' × '+n(d.width)+' m'));
  assert.match(e.access,/ancienne campagne.*inactif/);assert.match(e.access,/4 nourriture du sac/);assert.match(e.supplies,/lot entier doit tenir dans le sac/);assert.match(e.supplies,/Aucune repousse/);assert.match(e.risks,/sans paiement ni gain/);assert.match(e.risks,/aucun mécanisme de poison/);assert.match(e.night,/reprise de sauvegarde ne relance pas/);
 }
});

test('193 weather and missions retain activation, budget ownership, deadlines and integrity limits',()=>{
 for(const id of WEATHER){const d=C.Weather193Rules.fronts[id],e=Guide.entries().find(e=>e.id==='weather193-'+id);assert.ok(e.summary.includes(Math.round(d.rain*100)+' %'));assert.match(e.summary,/progressivement/);assert.match(e.layout,/240 s de temps actif/);assert.match(e.layout,/90 s/);assert.match(e.access,/météo historique.*activation volontaire et définitive/);assert.match(e.risks,/Aucun froid corporel, gel, crue, eau potable/);}
 const costs=o=>Object.entries(o).map(([id,n])=>n+' '+C.RESOURCE_META[id].label.toLowerCase()).join(' + ')||'aucun';
 for(const id of CAMPAIGN){const d=C.CampaignPackRules.definitions[id],e=Guide.entries().find(e=>e.id==='campaign193-'+id);assert.equal(e.summary,d.brief);assert.ok(e.access.includes(C.CITY_TIERS[d.tier].name));assert.match(e.access,/Une seule tentative/);assert.ok(e.supplies.includes('au dépôt dès l’engagement : '+costs(d.fee)));assert.match(e.supplies,/Récompense après retour et compte rendu au dépôt/);if(d.waveLimit)assert.ok(e.risks.includes('avant '+d.waveLimit+' changements de vague'));if(!d.defense){assert.ok(e.supplies.includes(costs(d.fieldCost)));assert.ok(e.layout.includes(d.seconds+' s de travail par accès'));}}
 const watch=Guide.entries().find(e=>e.id==='campaign193-watchDuty');assert.match(watch.layout,/2 vagues réellement repoussées/);assert.match(watch.layout,/80 %.*pendant tout/);assert.match(watch.layout,/réparer après une chute.*ne rétablit pas/);
});

test('193 provider resolves Core lazily, follows changed owners and never reads game/storage or RNG',()=>{
 let reads=0;const sandbox={Math:Object.assign(Object.create(Math),{random(){throw Error('RNG consulted');}})};
 Object.defineProperty(sandbox,'DeadwallCore',{configurable:true,get(){reads++;return undefined;}});
 for(const key of ['DEADWALL','localStorage'])Object.defineProperty(sandbox,key,{get(){throw Error('Live state consulted: '+key);}});
 vm.createContext(sandbox);vm.runInContext(source,sandbox);assert.equal(reads,0);assert.throws(()=>sandbox.DeadwallContentCodex193.entries(),/absentes/);
 const F=structuredClone(C.Forage193Rules),W=structuredClone(C.Weather193Rules),P=structuredClone(C.CampaignPackRules);F.species.blackberry.amount=[9,12];F.species.blackberry.seconds=11;F.reach=2.3;F.staminaCost=6;F.activationCost.food=7;W.frontSeconds=333;W.forecastLead=87;W.fronts.rain.rain=.71;P.definitions.farmSupply.fee.food=41;P.definitions.farmSupply.cargoSpeed=.63;P.definitions.watchDuty.minimumCore=.91;
 const changed={...C,Forage193Rules:F,Weather193Rules:W,CampaignPackRules:P},before=JSON.stringify([F,W,P]);Object.defineProperty(sandbox,'DeadwallCore',{value:changed,writable:true,configurable:true});
 const entries=sandbox.DeadwallContentCodex193.entries(),by=new Map(entries.map(e=>[e.id,e]));assert.match(by.get('forage193-blackberry').summary,/9 à 12 unités.*11 s/);assert.match(by.get('forage193-blackberry').access,/7 nourriture du sac.*2,3 m/);assert.match(by.get('forage193-blackberry').supplies,/6 points d’endurance/);assert.match(by.get('weather193-rain').summary,/71 %/);assert.match(by.get('weather193-rain').layout,/333 s.*87 s/);assert.match(by.get('campaign193-farmSupply').supplies,/41 nourriture/);assert.match(by.get('campaign193-farmSupply').layout,/63 %/);assert.match(by.get('campaign193-watchDuty').layout,/91 %/);assert.equal(JSON.stringify([F,W,P]),before);assert.strictEqual(sandbox.DeadwallContentCodex193.entries(),entries);
 sandbox.DeadwallCore=C;assert.notStrictEqual(sandbox.DeadwallContentCodex193.entries(),entries);
});
