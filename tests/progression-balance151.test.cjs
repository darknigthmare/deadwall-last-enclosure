'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),D=C.Balance151;
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const {legacyAge}=require('./helpers/legacy-city.cjs');
function fresh(){const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();return{g,doc};}
function site(g,type){const d=C.BUILDINGS[type],core=g.core();for(let r=6;r<60;r++)for(let y=core.gy-r;y<=core.gy+r;y++)for(let x=core.gx-r;x<=core.gx+r;x++)if(Math.max(Math.abs(x-core.gx),Math.abs(y-core.gy))===r&&g.world.placement(d,x,y).valid)return{x,y};throw Error('No legal fixture footprint '+type);}
// Explicit completed infrastructure fixtures isolate qualification readers.
// They are not paid campaign trajectories or timing evidence.
function put(g,type){const p=site(g,type),b=new(g.core().constructor)(g.nextId++,type,p.x,p.y,0,1);g.world.add(b);g.refreshMetrics(true);return b;}
function paidHouse(g){const p=site(g,'house'),before={...g.resources};assert.equal(g.placeOne('house',p.x,p.y),true);const b=g.world.atCell(p.x,p.y);for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],before[key]-(C.BUILDINGS.house.cost[key]||0));standAt(g,g.player,b);g.input.keys.add('KeyE');for(let tick=0;tick<300&&!b.completed;tick++)g.updateInteraction(.1);g.input.keys.clear();assert.equal(b.completed,true);return b;}
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,actual+' / '+expected);
const stable=g=>{const raw=g.serialize();delete raw.timestamp;return JSON.stringify(raw);};

test('151 progression: a native paid house earns Camp before the first horde; score alone cannot award later ages',()=>{
 const {g}=fresh();assert.deepEqual(g.urban.snapshot().progression151,{version:1,age:0});paidHouse(g);assert.equal(g.tier.id,1);assert.equal(g.stats.wavesSurvived,0);
 g.urban.attain(10000);for(let n=0;n<33;n++)put(g,'lumber');assert.equal(g.tier.id,1);assert.ok(g.cityScore>=210);assert.equal(g.urban.facts().score,33);assert.equal(g.urban.planning().nextRequirements.criteria.find(c=>c.id==='waves').met,false);
 assert.equal(g.urban.planning().nextRequirements.criteria.find(c=>c.id==='population').current,4);
});

test('151 progression: marginal development caps leave full physical capacity and raw attraction score',()=>{
 const list=[{type:'core',progress:1,health:1},...Array.from({length:60},()=>({type:'lumber',progress:1,health:1}))];near(D.developmentScore(list),29);near(C.Urban.score(list),368);
 const walls=[{type:'core',progress:1,health:1},...Array.from({length:260},()=>({type:'woodWall',progress:1,health:1}))];near(D.developmentScore(walls),53);near(C.Urban.score(walls),73);
 list[1].dead=true;list[2].health=0;list[3].progress=.5;near(D.developmentScore(list),29,'remaining copies occupy the first slots');
});

test('151 progression: every threshold and variety gate is mathematically attainable before its new catalogue',()=>{
 for(const target of C.CITY_TIERS.slice(1)){
  const models=Object.values(C.BUILDINGS).filter(d=>d.unlockTier<target.id&&!['core','dayGreenhouse','prefabYard'].includes(d.id));
  // Even the stricter ordinary model cap for walls suffices: no huge wall bonus is needed.
  const maximum=8+models.reduce((n,d)=>n+(d.score||0)*(D.RULES.fullModels+D.RULES.partialModels*D.RULES.partialFactor),0);
  assert.ok(maximum>=target.requiredScore,target.name+' available '+maximum+' / '+target.requiredScore);
  assert.ok(models.filter(d=>!d.wall).length>=D.TIER_REQUIREMENTS[target.id].variety);
  for(const key of C.RESOURCE_KEYS)if(D.TIER_REQUIREMENTS[target.id][key]>0)assert.ok(models.some(d=>d.production?.[key]>0),target.name+' accessible '+key+' producer');
 }
 assert.equal(D.TIER_REQUIREMENTS[3].ammo,0);assert.equal(D.TIER_REQUIREMENTS[5].medicine,0);assert.ok(D.TIER_REQUIREMENTS[6].medicine>0);
});

test('151 progression: each missing qualifying condition blocks advancement; old regions bypass only the biome gate',()=>{
 for(const spec of D.TIER_REQUIREMENTS.slice(1)){
  const facts={...spec,generation:7};assert.equal(D.requirements(spec.age,facts).met,true);
  for(const [id,value]of Object.entries(spec))if(id!=='age'&&value>0){const deficient={...facts,[id]:value/2};assert.equal(D.requirements(spec.age,deficient).met,false,spec.age+' '+id);}
 }
 const final={...D.TIER_REQUIREMENTS[10],generation:3,biomes:0};assert.equal(D.requirements(10,final).met,true);final.pois=0;assert.equal(D.requirements(10,final).met,false);
});

test('151 progression: a fully qualified prepared settlement earns its next age through actual world facts',()=>{
 const {g}=fresh();paidHouse(g);for(const type of ['warehouse','farm','generator','barracks','lumber','scrapyard'])put(g,type);
 const Unit=g.units[0].constructor;for(const kind of ['worker','worker','soldier','soldier']){const u=new Unit(g.nextId++,kind,g.player.x,g.player.y);standAt(g,u,g.core());g.units.push(u);}g.refreshMetrics(true);
 assert.equal(g.tier.id,1,'score and live services still owe surveys and survived waves');
 // Prepared historical wave and survey records isolate the last qualification,
 // rather than claiming this fixture survived combat or travelled to the site.
 const raw=g.serialize();raw.wave=3;raw.wavePlan=null;raw.stats.wavesSurvived=2;raw.dayworks.day={wave:3,duration:C.Dayworks.dayDuration(3)};
 raw.dayworks.sites[0].seen=true;raw.dayworks.sites[0].survey=C.Dayworks.RULES.surveySeconds;raw.dayworks.stats.surveyed=1;
 g.restoreSave(raw);assert.equal(g.tier.id,2);assert.equal(g.urban.snapshot().progression151.age,2);assert.equal(D.requirements(2,g.urban.facts()).met,true);
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.equal(g.urban.snapshot().progression151.age,2);
});

test('151 progression: completed services require actual aggregate fuel, online circuits and available shared feedstock',()=>{
 const {g}=fresh();for(let n=0;n<4;n++)put(g,'powerPlant');g.resources.fuel=2;near(g.urban.facts().power,8);
 g.resources.fuel=8;near(g.urban.facts().power,368);g.research.completed.push('grid');g.resources.fuel=6;near(g.urban.facts().power,368);
 const mills=[put(g,'recyclingPlant'),put(g,'recyclingPlant'),put(g,'recyclingPlant')];g.resources.fuel=6;near(g.urban.facts().power,8,'same reserve also owes industry fuel');
 g.resources.fuel=30;near(g.urban.facts().scrap,3.6);mills[0].territoryOffline=true;near(g.urban.facts().scrap,2.4);mills[1].siegeOffline=true;near(g.urban.facts().scrap,1.2);
 assert.equal(g.powerGrid.setCircuit(mills[2].id,'off'),true);near(g.urban.facts().scrap,0);
});

test('151 progression: full output storage preserves useful production capacity; missing intrants do not',()=>{
 const {g}=fresh();put(g,'generator');const factory=put(g,'ammoFactory');g.resources.ammo=g.storage;g.resources.scrap=10;near(g.urban.facts().ammo,.9);
 g.resources.scrap=0;near(g.urban.facts().ammo,0);g.resources.scrap=10;factory.health=0;near(g.urban.facts().ammo,0);
});

test('151 progression: a physically paid regulator preserves its actual input reserve in qualification',()=>{
 const {g}=fresh(),factory=put(g,'ammoFactory');standAt(g,g.player,factory);const scrap=g.resources.scrap;
 assert.equal(g.fortificationPack.equip('regulator',factory.id).ok,true);assert.equal(g.resources.scrap,scrap-C.FortificationPackRules.regulatorCost.scrap);
 g.resources.scrap=10;g.resources.ammo=0;near(g.urban.facts().ammo,0);g.economyTick(1);near(g.resources.ammo,0);near(g.resources.scrap,10);
 g.resources.scrap=C.FortificationPackRules.inputReserve+C.BUILDINGS.ammoFactory.consumes.scrap*D.RULES.feedstockSeconds;near(g.urban.facts().ammo,.9);
});

test('151 progression: paid completed annexes add exactly their real services, never development or building variety',()=>{
 const {g}=fresh();legacyAge(g,24);
 // Finite prepared stocks isolate real paid annex commands and their construction.
 Object.assign(g.resources,{wood:500,stone:500,scrap:500,fuel:50,food:100});
 const before=g.urban.facts(),claim=g.worldEvolution.previewDistrictClaim('east'),stock={...g.resources};assert.equal(claim.ok,true);assert.equal(g.worldEvolution.claimDistrict('east'),true);
 for(const key of C.RESOURCE_KEYS)near(g.resources[key],stock[key]-(claim.cost[key]||0));
 for(const type of ['housing','depot','power']){const q=g.worldEvolution.previewDistrictBuild('east',type),stock={...g.resources};assert.equal(q.ok,true);assert.equal(g.worldEvolution.buildDistrict('east',type),true);for(const key of C.RESOURCE_KEYS)near(g.resources[key],stock[key]-(q.cost[key]||0));}
 const unfinished=g.urban.facts();for(const key of ['housing','storage','power','score','variety'])near(unfinished[key],before[key]);
 const raw=g.serialize(),world=g.world;raw.worldEvolution.districts.east.buildings[0].type='fakeHousing';assert.throws(()=>g.restoreSave(raw));assert.equal(g.world,world);near(g.urban.facts().housing,before.housing);
 for(let tick=0;tick<260;tick++)g.update(.1);g.refreshMetrics(true);
 const effects=g.worldEvolution.districtEffects(),actual=g.urban.facts();assert.deepEqual(effects,{housing:8,storage:140,power:4});
 for(const key of ['housing','storage','power'])near(actual[key],before[key]+effects[key]);near(actual.housing,g.housing);near(actual.storage,g.storage);near(actual.power,g.powerGenerated);
 near(actual.score,before.score);near(actual.variety,before.variety);
});

test('151 progression: physically harvested POIs count finite taken quantities, not seen markers or notes',()=>{
 const {g}=fresh(),world=g.frontier.world(),poi=world.pois.find(p=>p.levels.includes(0)&&world.plan(p,0).objects.some(o=>o.amount>=12));assert.ok(poi);
 const object=world.plan(poi,0).objects.find(o=>o.amount>=12),raw=g.serialize();raw.frontier.seen.push(poi.id);raw.frontier.notes[poi.id]='visited';g.restoreSave(raw);assert.equal(g.urban.facts().pois,0);
 const partial=g.serialize();partial.frontier.taken[object.id]=11;g.restoreSave(partial);assert.equal(g.urban.facts().pois,0);
 const recovered=g.serialize();recovered.frontier.taken[object.id]=12;g.restoreSave(recovered);assert.equal(g.urban.facts().pois,1);assert.equal(g.urban.facts().biomes,1);
 const before=stable(g);for(let i=0;i<3;i++)g.urban.planning();assert.equal(stable(g),before,'reading existing evidence changes no stock, RNG or campaign record');
});

test('151 progression: Continue remembers earned knowledge; legacy absence imports historical age without promoting its next age',()=>{
 const {g}=fresh(),b=paidHouse(g),current=g.urban.snapshot();assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(g.urban.snapshot(),current);
 g.destroyBuilding(g.world.buildings.get(b.id));assert.equal(g.tier.id,1);assert.equal(g.urban.facts().housing,6);
 legacyAge(g,750);assert.equal(g.tier.id,8);assert.equal(g.urban.snapshot().progression151.age,8);g.urban.attain(100000);assert.equal(g.tier.id,8);assert.equal(C.Urban.knownTier(g.urban.snapshot()).id,8);
 g.startNew('standard','17117');g.campaignIntro132.skip();assert.equal(g.tier.id,0);assert.deepEqual(g.urban.snapshot().progression151,{version:1,age:0});assert.equal(g.urban.snapshot().peakScore,8);
});

test('151 progression: malformed or impossible knowledge markers reject before world replacement',()=>{
 const {g}=fresh(),world=g.world,raw=g.serialize();for(const value of [null,{version:2,age:0},{version:1,age:-1},{version:1,age:11},{version:1,age:2},{version:1,age:NaN}]){const bad=structuredClone(raw);bad.urban.progression151=value;assert.throws(()=>g.restoreSave(bad),/Progression urbaine/);assert.equal(g.world,world);}
});

test('151 progression: inherited low-age legacy fittings remain saveable after migration creates the age marker',()=>{
 const {g}=fresh(),spikes=put(g,'spikes'),wall=put(g,'woodWall'),baseline=g.serialize(),R=C.FortificationPackRules;
 near(baseline.urban.peakScore,C.Urban.score(baseline.buildings));assert.equal(C.cityTier(baseline.urban.peakScore).id,0);
 // Prepared historical equipment records protect migration compatibility;
 // this fixture claims neither native purchases nor newly qualified campaign ages.
 for(const kind of ['ankle','blades','netWide']){
  const raw=structuredClone(baseline);delete raw.urban.progression151;
  const fitting={id:kind==='netWide'?wall.id:spikes.id,ammo:0,repair:0,net:kind==='netWide'?R.variants.netWide.capacity:0,regulator:false};
  if(kind!=='netWide')fitting.mechanism={kind,charges:R.mechanisms[kind].charges,cooldown:0,caught:[]};
  raw.expansions127.modules.fortification={version:1,fittings:[fitting],debris:[]};
  const before=structuredClone(raw.resources);g.restoreSave(raw);const saved=g.serialize(),validated=globalThis.DeadwallSave.validate(saved);
  assert.deepEqual(saved.urban.progression151,{version:1,age:0});assert.equal(g.tier.id,0);near(saved.urban.peakScore,baseline.urban.peakScore);
  for(const data of [saved,validated]){assert.deepEqual(data.expansions127.modules.fortification.fittings,[fitting],kind);assert.deepEqual(data.resources,before,kind);}
 }
});

test('151 progression: save-time strict mechanisms respect qualified knowledge despite a high construction peak',()=>{
 const {g}=fresh();put(g,'spikes');const raw=g.serialize(),support=raw.buildings.find(b=>b.type==='spikes');raw.urban.peakScore=1850;
 raw.expansions127.modules.fortification={version:1,fittings:[{id:support.id,ammo:0,repair:0,net:0,regulator:false,mechanism:{kind:'guideRail',charges:8,cooldown:0,caught:[]}}],debris:[]};
 assert.throws(()=>g.restoreSave(raw),/montage mécanique invalide/);assert.equal(g.urban.snapshot().progression151.age,0);
});

test('151 progression: Preparatifs exposes actual deficits without granting a forecast age',()=>{
 const {g,doc}=fresh();paidHouse(g);g.coordinationUI.open();g.urbanUI.refresh(true);
 const rows=doc.getElementById('urbanAgeRequirements').children;assert.ok(rows.length>=10);const waves=rows.find(n=>n.dataset.requirement==='waves');assert.equal(waves.dataset.met,'false');assert.match(waves.textContent,/0 \/ 2/);
 assert.match(doc.getElementById('urbanRemaining').textContent,/condition\(s\)/);assert.equal(g.urban.planning().potentialAge.id,1);
 const before=stable(g);g.urbanUI.refresh(true);assert.equal(stable(g),before);
});
