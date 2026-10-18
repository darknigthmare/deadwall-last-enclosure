import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, visibleInPanel } from './browser-qa-common144.mjs';

const views=[{name:'desktop',width:1366,height:768},{name:'mobile',width:390,height:844,touch:true}],selected=process.env.DEADWALL_QA_PROFILES?.split(',');
if(selected&&(!selected.length||selected.some(name=>!views.some(view=>view.name===name))||new Set(selected).size!==selected.length))throw Error('DEADWALL_QA_PROFILES must contain distinct known Codex profiles');
const profiles=selected?views.filter(v=>selected.includes(v.name)):views;
const harness=await createHarness('codex159','NATIVE: fresh Standard seed903159, actual Pause/Command/Atlas-guide controls, search and usage filters, complete DW-4000 card, G10-compatible DW-0300 contract and honest inactive G8 boundary, exact real city cost/age/support diagnostics, native keyboard Enter on desktop and touch taps on mobile. The native territorial navigation opens Monde & relais without activating G10, payment, discovery or RNG. Actual guide link discloses and focuses the age11 preparation card; its original controller button opens the real building category without purchase or selected future foundation. ADVANCED EXPLICIT FIXTURE: one real generated G8 programme site is added to the notebook through its existing discovery owner; only frontier.seen is assigned and the save is validated. No actor position, inventory, terrain, generation, RNG, tier or simulation step is assigned. Genuine guide controls open/focus its real atlas and choose the guarded saved waypoint. A second real generated but unknown programme stays absent from notebook-filter results. Mobile is emulated. This does not certify natural travel, campaign pace, full-art visual quality, physical devices or production deployment.');
const {browser,base,report,output}=harness;report.profiles=[];
// Exact 180 city-choice identities from main 1.60 (5b8f0ade), before vertical registration.
const historicCityChoices=Object.freeze([
 "building:agroComplex",
 "building:aidStation150",
 "building:alarmTower",
 "building:ammoFactory",
 "building:apartment",
 "building:armoredGate",
 "building:barracks",
 "building:batteryCabinet",
 "building:batteryComplex",
 "building:batteryStation",
 "building:beacon",
 "building:biofuelYard150",
 "building:casemate150",
 "building:cementWorks",
 "building:centralStore",
 "building:cityArsenal",
 "building:clinic",
 "building:concreteWall",
 "building:concreteWatch150",
 "building:continuityArsenal150",
 "building:courtyardGarden150",
 "building:dayGreenhouse",
 "building:districtSearchlight",
 "building:dressingWorkshop",
 "building:dualRecovery150",
 "building:electricCannery150",
 "building:electricGreenhouse150",
 "building:equippedShelter150",
 "building:expeditionGarage",
 "building:expeditionOffice",
 "building:fallbackRedoubt",
 "building:farm",
 "building:fieldKitchen",
 "building:fireCistern",
 "building:fireScreen",
 "building:fireStation",
 "building:frontBattery150",
 "building:fuelWorks",
 "building:garrisonQuarters150",
 "building:gate",
 "building:gateStore150",
 "building:generator",
 "building:heavyTurret",
 "building:hospital",
 "building:house",
 "building:housingComplex",
 "building:logisticsCenter",
 "building:logisticsGarage",
 "building:logisticsHub",
 "building:lumber",
 "building:marketHall",
 "building:medicalComplex150",
 "building:megaHousing",
 "building:megaPower",
 "building:megaReserve",
 "building:megaTower",
 "building:perimeterLight",
 "building:planningOffice",
 "building:powerPlant",
 "building:prefabYard",
 "building:quarry",
 "building:radioRelay",
 "building:rationPlant",
 "building:receptionHall",
 "building:recoveryBench",
 "building:recyclingPlant",
 "building:refinery",
 "building:regionalHospital",
 "building:reinforcedCasemate150",
 "building:residentialTower",
 "building:restShelter",
 "building:roadDepot",
 "building:rowHomes",
 "building:scrapyard",
 "building:searchlight",
 "building:sectorPost",
 "building:solarCourt",
 "building:solarPark150",
 "building:spikes",
 "building:steelWall",
 "building:sterilizationLab150",
 "building:streetlight",
 "building:triageStation150",
 "building:turret",
 "building:twinGun150",
 "building:wallStore150",
 "building:warehouse",
 "building:watchtower",
 "building:woodWall",
 "building:workshop",
 "doctrine:ballistics",
 "doctrine:fortification",
 "doctrine:grid",
 "doctrine:logistics",
 "doctrine:recon",
 "doctrine:sanitation",
 "exercise:coordination",
 "exercise:sapeur",
 "exercise:triage",
 "exercise:veille",
 "fitting:ammoCompact",
 "fitting:netWide",
 "mechanism:ankle",
 "mechanism:blades",
 "mechanism:clamp",
 "mechanism:counterweight",
 "mechanism:guideRail",
 "mechanism:ratchet",
 "plan:airlock",
 "plan:camp",
 "plan:careCourt",
 "plan:continuitySector150",
 "plan:courtyard",
 "plan:electricFoodCourt150",
 "plan:entryBastion",
 "plan:foodCourt",
 "plan:forwardCare150",
 "plan:maintenanceRedoubt",
 "plan:materialsCourt",
 "plan:observationRelay",
 "plan:returnRelay",
 "plan:spikedApproach",
 "plan:watchedBastion150",
 "recipe:assemblyHammer",
 "recipe:bat",
 "recipe:boltNest",
 "recipe:bottleClub",
 "recipe:burst",
 "recipe:carbine",
 "recipe:crowbar",
 "recipe:doubleBarrel",
 "recipe:hammer",
 "recipe:hatchet",
 "recipe:heavyNest",
 "recipe:hunting",
 "recipe:knife",
 "recipe:lever",
 "recipe:longSpear",
 "recipe:machete",
 "recipe:machinePistol",
 "recipe:marksman",
 "recipe:maul",
 "recipe:pickaxe",
 "recipe:pipe",
 "recipe:pistol",
 "recipe:plank",
 "recipe:pocket",
 "recipe:revolver",
 "recipe:rifle",
 "recipe:riotBaton",
 "recipe:semiShotgun",
 "recipe:shortShotgun",
 "recipe:shotgun",
 "recipe:shovel",
 "recipe:singleShot",
 "recipe:slug",
 "recipe:smg",
 "recipe:spear",
 "recipe:spikeFrame",
 "recipe:support",
 "recipe:target",
 "recipe:tripod",
 "recipe:wreckingBar",
 "road:concrete",
 "road:gravel",
 "road:logistics",
 "road:paving",
 "role:engineer",
 "role:medic",
 "role:soldier",
 "role:worker",
 "vehicle:bike",
 "vehicle:break",
 "vehicle:buggy",
 "vehicle:bus",
 "vehicle:compact",
 "vehicle:motorcycle",
 "vehicle:skate",
 "vehicle:truck",
 "vehicle:van"
]);
const ecology164GuideIds=Object.freeze(['biome164-alluvialTerrace','biome164-agriculturalPlateau','biome164-sandyPine','biome164-peatland','ecology164-coherence']);
const hydrology165GuideIds=Object.freeze(['lake','pond','pool','stream','river','sea','ocean','banks','wildlife','infected'].map(id=>'hydrology165-'+id));
const fauna189GuideIds=Object.freeze([
 ...['roeDeer','boar','hare','duck','heron','gull','fox','badger','rabbit','squirrel','hedgehog','chamois','mouflon','redDeer','crow','pigeon','pheasant','partridge','owl','bat','otter','beaver','frog','trout','carp','mullet'].map(id=>'fauna189-'+id),
 ...['meadow','orchard','deciduous','mixed','conifer','heath','riparian','wetland','bocage','limestone','rockyHighland','brownfield','alluvialTerrace','agriculturalPlateau','sandyPine','peatland'].map(id=>'fauna189-biome-'+id),
 'landscape189-profiles'
]);
const material=page=>page.evaluate(()=>{const {timestamp,...s}=DEADWALL.serialize();return JSON.stringify(s);});
async function guide(page,touch){if(await page.locator('#commandModal').isVisible())await activate(page,'#commandTab-field',touch);else await openCommand(page,touch,'field');await activate(page,'#commandPanel-field [data-field-view="world-codex"]',touch);await page.locator('#field-world-codex').waitFor({state:'visible'});}
async function press(page,selector,touch){await page.locator(selector).scrollIntoViewIfNeeded();if(touch)await activate(page,selector,true);else{await page.locator(selector).focus();await page.keyboard.press('Enter');}}
async function button(page,selector,touch,rec,name){await page.locator(selector).scrollIntoViewIfNeeded();const box=await visibleInPanel(page,selector,'.command-body');rec.check(name+': native control stays clipped, hit-testable and at least44px',box.pass&&box.box.height>=44);await press(page,selector,touch);}
try{
 assert.ok(profiles.length,'At least one known Codex profile required');
 for(const viewport of profiles){const profile={viewport};report.profiles.push(profile);let context,page;
  try{
   context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'});page=await context.newPage();page.setDefaultTimeout(30000);const rec=recorder(page,profile,output,viewport.name+'-');
   await page.goto(base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page,'903159');await activate(page,'#campaignIntro132Skip',viewport.touch);await guide(page,viewport.touch);
   const beforeRead=await material(page),totals=await page.evaluate(()=>({summary:document.getElementById('worldCodexCoverage159').textContent,entries:DEADWALL.worldCodex.entries.length,choices:DeadwallCodexActions159.entries.length,programmes:DeadwallCodex3000Runtime.records.length,known:DEADWALL.frontier.discoveries()}));
   profile.catalogueAudit=await page.evaluate(({historic,ecologyIds,waterIds,faunaIds})=>{
    const vertical=Object.keys(DeadwallCore.VerticalCitadel175.bases).map(id=>'building:'+id).sort(),expected=[...historic,...vertical].sort();
    const choices=DeadwallCodexActions159.entries.map(e=>e.choice159).sort(),guide=DEADWALL.worldCodex.entries.filter(e=>e.choice159).map(e=>e.choice159).sort();
    const programmeIds=DeadwallCodex3000Runtime.records.map(r=>r.id).sort(),expectedProgrammes=Array.from({length:4000},(_,i)=>'DW-'+String(i+1).padStart(4,'0'));
    const ecology=DEADWALL.worldCodex.entries.filter(e=>e.id.startsWith('biome164-')||e.id.startsWith('ecology164-')).map(e=>e.id).sort();
    const water=DEADWALL.worldCodex.entries.filter(e=>e.id.startsWith('hydrology165-')).map(e=>e.id).sort();
    const fauna=DEADWALL.worldCodex.entries.filter(e=>e.id.startsWith('fauna189-')||e.id==='landscape189-profiles').map(e=>e.id).sort();
    const missing=(wanted,actual)=>wanted.filter(id=>!actual.includes(id)),duplicates=rows=>rows.filter((id,i)=>rows.indexOf(id)!==i);
    return{historic,vertical,expectedChoices:expected,actualChoices:choices,guideChoices:guide,expectedEcologyIds:ecologyIds,guideEcology:ecology,expectedWaterIds:waterIds,guideWater:water,expectedFaunaIds:faunaIds,guideFauna:fauna,expectedGuideEntries:4435+expected.length+ecologyIds.length+waterIds.length+faunaIds.length,
     missingFauna:missing(faunaIds,fauna),unexpectedFauna:missing(fauna,faunaIds),duplicateFauna:duplicates(fauna),
     missingWater:missing(waterIds,water),unexpectedWater:missing(water,waterIds),duplicateWater:duplicates(water),
     missingEcology:missing(ecologyIds,ecology),unexpectedEcology:missing(ecology,ecologyIds),duplicateEcology:duplicates(ecology),
     missingHistoric:missing(historic,choices),missingVertical:missing(vertical,choices),unexpectedChoices:missing(choices,expected),
     guideMissingChoices:missing(expected,guide),guideUnexpectedChoices:missing(guide,expected),duplicateChoices:duplicates(choices),duplicateGuideChoices:duplicates(guide),
     missingProgrammes:missing(expectedProgrammes,programmeIds),unexpectedProgrammes:missing(programmeIds,expectedProgrammes),duplicateProgrammes:duplicates(programmeIds)};
   },{historic:historicCityChoices,ecologyIds:ecology164GuideIds,waterIds:hydrology165GuideIds,faunaIds:fauna189GuideIds});
   const audit=profile.catalogueAudit;
   rec.check('Actual guide preserves exactly all4000 original programme identities',totals.programmes===4000&&!audit.missingProgrammes.length&&!audit.unexpectedProgrammes.length&&!audit.duplicateProgrammes.length);
   rec.check('Actual guide preserves every one of the exact180 historical city choices',audit.historic.length===180&&!audit.missingHistoric.length&&!audit.duplicateChoices.length);
   rec.check('Actual guide derives exactly all registered vertical supports with no missing or unexpected city choice',audit.vertical.length>0&&!audit.missingVertical.length&&!audit.unexpectedChoices.length&&totals.choices===audit.expectedChoices.length);
   rec.check('Actual guide contains exactly26 regional species,16 biome populations and their landscape profile card',audit.expectedFaunaIds.length===43&&!audit.missingFauna.length&&!audit.unexpectedFauna.length&&!audit.duplicateFauna.length&&audit.guideFauna.length===43);
   rec.check('Every expected city choice has one guide card and the complete guide count matches its exact expansion',!audit.guideMissingChoices.length&&!audit.guideUnexpectedChoices.length&&!audit.duplicateGuideChoices.length&&audit.guideChoices.length===audit.expectedChoices.length&&totals.entries===audit.expectedGuideEntries);
   rec.check('Actual guide contains exactly the four new biome identities and their coherence card',audit.expectedEcologyIds.length===5&&!audit.missingEcology.length&&!audit.unexpectedEcology.length&&!audit.duplicateEcology.length&&audit.guideEcology.length===5);
   rec.check('Actual guide contains the exact ten water and biome population cards',audit.expectedWaterIds.length===10&&!audit.missingWater.length&&!audit.unexpectedWater.length&&!audit.duplicateWater.length&&audit.guideWater.length===10);
   rec.check('Actual guide explains 626 G10 contracts and seed-dependent physical placement',totals.summary.includes('626')&&totals.summary.includes('G10')&&totals.summary.includes('graine'));
   profile.faunaCards=[];
   for(const[id,query,terms]of [['rabbit','Lapin de garenne',['Capture vivante','viande brute','Reproduction possible']],['owl','Chouette',['Capture vivante et élevage indisponibles','activation volontaire']]]){
    await page.locator('#worldCodexSearch').fill(query);const card=page.locator('#worldCodexResults [data-codex-id="fauna189-'+id+'"]');
    const observed=await card.evaluate(n=>({id:n.dataset.codexId,text:n.textContent}));profile.faunaCards.push(observed);
    rec.check('Native '+id+' card explains its actual capture, products and optional behaviour limits',terms.every(term=>observed.text.includes(term)));
    await card.scrollIntoViewIfNeeded();await rec.screenshot('fauna189-'+id);
   }
   rec.check('Reading the regional fauna cards preserves the entire saved campaign and RNG',beforeRead===await material(page));
   await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill('DW-4000');const last='#worldCodexResults [data-codex-id="programme-DW-4000"]';
   await press(page,last+' > details:last-child > summary',viewport.touch);
   await page.waitForFunction(()=>{const n=document.querySelector('[data-codex-source159="programme-DW-4000"]');return n?.open&&n.dataset.recipeLoaded==='true';});
   const authored=profile.authored=await page.locator(last).evaluate(n=>{const source=n.querySelector('[data-codex-source159]');return{id:n.dataset.codexId,text:n.textContent,fields:[...source.querySelectorAll(':scope > p')].filter(p=>p.firstElementChild?.tagName==='STRONG').length,open:source.open};});
   rec.check('The genuine DW-4000 card exposes all9 authored fields and explicit G9 availability',authored.id==='programme-DW-4000'&&authored.fields===9&&authored.open&&authored.text.includes('G9'));
   await page.locator('#worldCodexAvailability159').selectOption('supported');await page.locator('#worldCodexSearch').fill('');
   rec.check('The genuine compatible filter contains all4000 software-supported programmes',/^4000 fiche/.test(await page.locator('#field-world-codex .world-codex-count').innerText()));
   await page.locator('#worldCodexAvailability159').selectOption('unavailable');rec.check('No programme is falsely reported without a software plan',/^0 fiche/.test(await page.locator('#field-world-codex .world-codex-count').innerText()));
   await page.locator('#worldCodexAvailability159').selectOption('context160');rec.check('The real territorial filter contains precisely626 contracts',/^626 fiche/.test(await page.locator('#field-world-codex .world-codex-count').innerText()));
   await page.locator('#worldCodexSearch').fill('DW-0300');const territorial='#worldCodexResults [data-codex-id="programme-DW-0300"]';
   rec.check('The rail contract explains G10 inactivity and exposes no invented known place',await page.locator(territorial).evaluate(n=>n.textContent.includes('G10 n’est pas activée')&&n.textContent.includes('chaque graine')&&n.querySelectorAll('[data-codex-place159]').length===0&&n.querySelectorAll('[data-codex-territories160]').length===1));
   const beforeTerritories=await material(page);await button(page,territorial+' > [data-codex-territories160]',viewport.touch,rec,'Territorial controller navigation');
   profile.territorialNavigation=await page.evaluate(()=>({generation:DEADWALL.frontier.position().generation,selected:document.querySelector('#field-expansions [role="tab"][aria-selected="true"]')?.id,button:document.getElementById('expansionAction-world131-expandTerritories160')?.textContent,disabled:document.getElementById('expansionAction-world131-expandTerritories160')?.disabled,preview:DEADWALL.worldOps131.previewTerritories160()}));
   rec.check('The native link opens Monde & relais and preserves its exact guarded activation owner',profile.territorialNavigation.selected==='expansionTab-world131'&&profile.territorialNavigation.button==='ACTIVER LES 626 PROGRAMMES TERRITORIAUX'&&profile.territorialNavigation.disabled===!profile.territorialNavigation.preview.ok);
   rec.check('Reading the territorial activation performs no migration, payment, discovery or RNG mutation',profile.territorialNavigation.generation===8&&beforeTerritories===await material(page));await guide(page,viewport.touch);
   await page.locator('#worldCodexAvailability159').selectOption('known');await page.locator('#worldCodexSearch').fill('');rec.check('Empty fresh notebook reveals no programme site',totals.known.length===0&&await page.locator('#worldCodexResults article').count()===0);
   await page.locator('#worldCodexAvailability159').selectOption('city');await page.locator('#worldCodexSearch').fill('accumulateur');const future='#worldCodexResults [data-codex-id="city159-building:frontBattery150"]';
   const choice=await page.locator(future).evaluate(n=>({text:n.textContent,cost:DeadwallCore.resourceText(DeadwallCityCatalogue150.create(DeadwallCore).items.find(i=>i.key==='building:frontBattery150').cost),age:DEADWALL.tier.id}));
   rec.check('The future real city card retains exact cost, empty battery and unmet age11',choice.age<10&&choice.text.includes(choice.cost)&&choice.text.includes('Batterie vide')&&choice.text.includes('Âge 11 à atteindre'));
   rec.check('All guide search, filters and live diagnostics preserve the entire saved campaign and RNG',beforeRead===await material(page));await rec.screenshot('future-choice');
   await button(page,future+' > [data-codex-action159]',viewport.touch,rec,'Specific preparation navigation');
   rec.check('Original age catalogue opens age11, discloses the actual building group and focuses its native action',await page.evaluate(()=>DEADWALL.cityCatalogueUI150.selectedAge()===10&&document.activeElement?.dataset.catalogueAction==='building:frontBattery150'&&document.activeElement.closest('details').open&&!document.activeElement.closest('.hidden,[inert]')));
   rec.check('Disclosing and focusing the true preparation card creates no payment or saved mutation',beforeRead===await material(page));
   const controller='#cityCatalogueGroups150 [data-catalogue-action="building:frontBattery150"]';
   await page.locator(controller).evaluate(n=>{const read=()=>({resources:{...DEADWALL.resources},rng:DEADWALL.random.state,ids:[...DEADWALL.world.buildings.keys()],selected:DEADWALL.selectedBuild?.id||null});globalThis.__CODEX159_CONTROLLER__={};n.addEventListener('click',()=>{globalThis.__CODEX159_CONTROLLER__.before=read();},{capture:true});n.addEventListener('click',()=>{globalThis.__CODEX159_CONTROLLER__.after=read();});});
   await button(page,controller,viewport.touch,rec,'Native future building controller');
   profile.controller=await page.evaluate(()=>({observation:globalThis.__CODEX159_CONTROLLER__,category:DEADWALL.currentCategory,expected:DeadwallCore.BUILDINGS.frontBattery150.category,paused:DEADWALL.paused,overlay:DEADWALL.activeOverlay?.id||null,futureOffered:!!document.querySelector('#buildList [data-build-id="frontBattery150"]')}));
   rec.check('The actual future controller opens its real category while keeping its locked model unavailable',profile.controller.category===profile.controller.expected&&!profile.controller.paused&&profile.controller.overlay===null&&!profile.controller.futureOffered);
   rec.check('The native controller event buys nothing, selects no foundation and consumes no RNG',!!profile.controller.observation.before&&JSON.stringify(profile.controller.observation.before)===JSON.stringify(profile.controller.observation.after)&&profile.controller.observation.after.selected===null);
   await guide(page,viewport.touch);
   profile.fixture=await page.evaluate(()=>{const g=DEADWALL,w=g.frontier.world(),known=w.pois.find(p=>p.programme3000),unknown=w.pois.find(p=>p.programme3000&&p.programme3000!==known?.programme3000);if(!known||!unknown||g.frontier.discoveries().length)throw Error('Fresh real G8 native programmes required');
    const rng=g.random.state,resources={...g.resources};g.frontier.revealSites([known.id]);DeadwallSave.validate(g.serialize());if(g.random.state!==rng||JSON.stringify(g.resources)!==JSON.stringify(resources))throw Error('Notebook fixture changed RNG or stock');
    return{type:'prepared-one-known-native-programme',generation:w.generation,known:{id:known.id,code:known.programme3000,name:known.name},unknown:{id:unknown.id,code:unknown.programme3000,name:unknown.name},assignedFields:['frontier.seen[one actual site]'],rngPreserved:true,stockPreserved:true,validated:true};});
   const known=profile.fixture.known;await page.locator('#worldCodexAvailability159').selectOption('known');await page.locator('#worldCodexSearch').fill('');
   const link='#worldCodexResults [data-codex-id="programme-'+known.code+'"]';
   rec.check('Known filter exposes only the prepared notebook programme and excludes its real unknown neighbour',await page.locator('#worldCodexResults article').count()===1&&await page.locator(link).count()===1&&!(await page.locator('#worldCodexResults').innerText()).includes(profile.fixture.unknown.name));
   await page.locator('#worldCodexSearch').fill(profile.fixture.unknown.code);rec.check('Searching a genuinely placed but unknown programme does not reveal it',await page.locator('#worldCodexResults article').count()===0);await page.locator('#worldCodexSearch').fill(known.code);
   await press(page,link+' > details:first-of-type > summary',viewport.touch);const map=link+' [data-codex-place159="'+known.id+'"]:nth-of-type(1)',pin=link+' [data-codex-place159="'+known.id+'"]:nth-of-type(2)';
   await rec.screenshot('known-notebook-links');const beforeMap=await material(page);await button(page,map,viewport.touch,rec,'Known site atlas action');
   rec.check('The native atlas opens and selects the exact already known site',await page.evaluate(id=>DEADWALL.frontierUI.atlas.selected()?.id===id,known.id));rec.check('Viewing the real map changes no saved campaign field',beforeMap===await material(page));
   await guide(page,viewport.touch);await press(page,link+' > details:first-of-type > summary',viewport.touch);const beforePin=JSON.parse(await material(page));await button(page,pin,viewport.touch,rec,'Guarded saved waypoint action');
   const afterPin=JSON.parse(await material(page));rec.check('The real waypoint owner saves only the known selected site',afterPin.frontier.pin===known.id);afterPin.frontier.pin=beforePin.frontier.pin;
   rec.check('Waypoint navigation changes only frontier.pin and preserves stocks, discoveries, IDs and RNG',JSON.stringify(afterPin)===JSON.stringify(beforePin));rec.check('All page, console, HTTP and request collectors remain empty',rec.errors()===0);profile.pass=profile.checks.every(c=>c.pass);
  }catch(error){profile.pass=false;profile.failure=error.stack;if(page){profile.failureState=await page.evaluate(()=>({state:DEADWALL?.state,overlay:DEADWALL?.activeOverlay?.id,focus:document.activeElement?.outerHTML?.slice(0,1500),search:document.getElementById('worldCodexSearch')?.value,usage:document.getElementById('worldCodexAvailability159')?.value,known:DEADWALL?.frontier?.discoveries(),text:document.getElementById('worldCodexResults')?.textContent?.slice(0,4000)})).catch(()=>null);await page.screenshot({path:output+'/'+viewport.name+'-failure.png'}).then(()=>profile.screenshots.push(viewport.name+'-failure.png')).catch(()=>{});}}
  finally{await context?.close();}console.log(JSON.stringify({profile:viewport.name,pass:profile.pass,checks:profile.checks?.length,failure:profile.failure?.split('\n')[0]}));if(!profile.pass)break;
 }
}finally{report.pass=profiles.length>0&&report.profiles.length===profiles.length&&report.profiles.every(p=>p.pass);try{await harness.close();}finally{await harness.finish();}}
if(!report.pass)process.exitCode=1;
