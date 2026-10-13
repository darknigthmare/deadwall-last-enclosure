'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/world-codex-actions159.js'),C=require('../src/core.js'),City=require('../src/city-catalogue150.js'),R=require('../src/codex3000-runtime.js'),Guide=require('../src/world-codex.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const fs=require('node:fs'),path=require('node:path');
const textTree=n=>n.textContent+' '+n.children.map(textTree).join(' ');
const clean=g=>{const data=g.serialize();delete data.timestamp;return structuredClone(data);};
function fixture(){
 const saved={seen:['P0100'],pin:null,taken:{'P0100:0:0':4},generation:9},calls=[];
 const hidden={id:'P0101',get name(){throw Error('Hidden name accessed');},get programme3000(){throw Error('Hidden programme accessed');},get codex(){throw Error('Hidden programme accessed');}};
 const frontier={discoveries:()=>saved.seen.slice(),world:()=>({pois:[{id:'P0100',name:'Centre de traitement connu',programme3000:'DW-3001',codex:'DW-3001',levels:[0,1]},hidden]}),pin:id=>{if(!saved.seen.includes(id))return false;saved.pin=id;calls.push(['pin',id]);return true;},overview(){throw Error('Reading must not synchronize tracks');},snapshot(){throw Error('Reading must not synchronize tracks');}};
 const game={state:'playing',gameOver:false,player:{dead:false},canIssueCommand:()=>true,frontier,frontierUI:{open(){calls.push(['open']);return true;},atlas:{focusPOI(id){calls.push(['focus',id]);return saved.seen.includes(id);}}},serialize(){throw Error('Must not serialize');},random:{next(){throw Error('No simulation RNG');}}};
 return{game,saved,calls};
}
test('The shipped HTML loads the operational guide after its catalogue owner and before the guide UI',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(scripts.filter(p=>p==='src/world-codex-actions159.js').length,1);
 assert.ok(scripts.indexOf('src/city-catalogue150.js')<scripts.indexOf('src/world-codex-actions159.js'));
 assert.ok(scripts.indexOf('src/world-codex-actions159.js')<scripts.indexOf('src/world-codex.js'));
});
test('Codex derives every actual city choice, exact costs, prerequisites and all eleven ages',()=>{
 const expected=City.create(C);assert.equal(A.entries.length,expected.items.length);assert.equal(A.entries.length,180);assert.equal(new Set(A.entries.map(e=>e.id)).size,A.entries.length);
 for(const item of expected.items){const entry=A.entries.find(e=>e.choice159===item.key);assert.ok(entry,item.key);assert.equal(entry.status,'jouable');assert.match(entry.summary,new RegExp('âge '+(item.tier+1)+' :'));assert.ok(entry.supplies.includes(C.resourceText(item.cost))||!Object.keys(item.cost).length,item.key);
  for(const condition of item.conditions)assert.ok(entry.access.includes(condition.text),item.key+' '+condition.kind);
  for(const fact of item.facts)assert.ok(entry.layout.includes(fact),item.key);
  for(const tradeoff of item.tradeoffs)assert.ok(entry.risks.includes(tradeoff),item.key);
 }
 assert.equal(new Set(expected.items.map(e=>e.tier)).size,11);
 assert.equal(Guide.entries.filter(e=>e.status==='programme').length,4000);assert.equal(Guide.entries.filter(e=>e.choice159).length,180);
});
test('Capability reports the existing 300 missing presets and 626 unsupported programmes without enabling them',()=>{
 const records=R.records,before=JSON.stringify(records),summary=A.availabilitySummary();assert.deepEqual(summary,{programmes:4000,choices:180,missingPlan:300,unsupported:626});
 assert.equal(A.capability('programme-DW-0300').hasPlan,false);assert.equal(A.capability('DW-0300').eligible,false);assert.match(A.capability('DW-0300').text,/générations actuelles/);
 for(const card of records.filter(p=>p.extension===158)){assert.equal(A.capability(card.id).hasPlan,true);assert.equal(A.capability(card.id).eligible,true);assert.equal(A.capability(card.id).generation,9);}
 assert.equal(A.capability('DW-9999'),null);assert.equal(JSON.stringify(records),before);assert.equal(R.preset('codex3000-0300'),null);
});
test('Known-place lookup filters discoveries before touching hidden programme metadata and returns isolated data',()=>{
 const {game,saved}=fixture(),before=JSON.stringify(saved),places=A.knownPlaces(game,'programme-DW-3001');assert.deepEqual(places,[{id:'P0100',name:'Centre de traitement connu',programme:'DW-3001',levels:[0,1]}]);
 assert.deepEqual(A.knownProgrammes(game),['DW-3001']);assert.ok(Object.isFrozen(places[0]));assert.ok(Object.isFrozen(places[0].levels));assert.equal(JSON.stringify(saved),before);
 assert.deepEqual(A.knownPlaces(game,'DW-3002'),[]);assert.deepEqual(A.knownPlaces(game,'DW-9999'),[]);
 saved.seen=[];game.frontier.world=()=>{throw Error('Empty notebook must not construct or inspect a region');};assert.deepEqual(A.knownPlaces(game,'DW-3001'),[]);assert.deepEqual(A.knownProgrammes(game),[]);
});
test('Map navigation uses native owners and spends nothing; marking uses only the guarded waypoint owner',()=>{
 const {game,saved,calls}=fixture(),before=JSON.stringify(saved);assert.equal(A.placeAction(game,'DW-3001','P0100','map'),true);assert.deepEqual(calls,[['open'],['focus','P0100']]);assert.equal(JSON.stringify(saved),before);
 calls.length=0;assert.equal(A.placeAction(game,'DW-3001','P0100','pin'),true);assert.deepEqual(calls,[['open'],['focus','P0100'],['pin','P0100']]);assert.equal(saved.pin,'P0100');assert.deepEqual(saved.taken,{'P0100:0:0':4});
});
test('Stale, unknown, mismatched and unavailable place actions stop before owner navigation',()=>{
 const {game,saved,calls}=fixture();for(const args of [['DW-3001','P0101','map'],['DW-3002','P0100','pin'],['DW-3001','P0100','teleport']])assert.equal(A.placeAction(game,...args),false);assert.deepEqual(calls,[]);
 saved.seen=[];assert.equal(A.placeAction(game,'DW-3001','P0100','map'),false);assert.deepEqual(calls,[]);
 saved.seen=['P0100'];game.player.dead=true;assert.equal(A.placeAction(game,'DW-3001','P0100','map'),false);game.player.dead=false;game.canIssueCommand=()=>false;assert.equal(A.placeAction(game,'DW-3001','P0100','map'),false);assert.deepEqual(calls,[]);
});
test('Missing and refusing map owners never fall through to waypoint purchase or placement',()=>{
 const {game,calls}=fixture();game.frontierUI.open=()=>false;assert.equal(A.placeAction(game,'DW-3001','P0100','pin'),false);assert.deepEqual(calls,[]);
 game.frontierUI.open=()=>true;game.frontierUI.atlas.focusPOI=()=>false;assert.equal(A.placeAction(game,'DW-3001','P0100','pin'),false);assert.deepEqual(calls,[]);
 delete game.frontierUI;assert.equal(A.placeAction(game,'DW-3001','P0100','map'),false);assert.deepEqual(calls,[]);
});
test('City diagnostics retain real bag/depot, completion, support, insight and storage constraints',()=>{
 const game={tier:{id:10},storage:500,resources:C.makeBag({wood:10000,scrap:10000,stone:10000}),player:{carry:C.makeBag()},research:{completed:[],insight:0},world:{buildings:new Map([[1,{type:'spikes',health:200,completed:true}],[2,{type:'workshop',health:600,completed:false}],[3,{type:'clinic',health:0,completed:true}]])}};
 const before=JSON.stringify(game),trap=A.choiceStatus(game,'mechanism:counterweight');assert.match(trap.text,/dans le sac/);assert.ok(trap.missingBuildings.includes('workshop'));assert.deepEqual(trap.missing,A.catalogue.items.find(i=>i.key==='mechanism:counterweight').cost);
 const reserve=A.choiceStatus(game,'building:megaReserve');assert.equal(reserve.storageShortfall,1000);assert.match(reserve.text,/Capacité nécessaire/);
 const recipe=A.catalogue.items.find(i=>i.kind==='recipe'&&i.conditions.length),result=A.choiceStatus(game,recipe.key);assert.equal(typeof result.text,'string');assert.equal(A.choiceStatus(game,'fake:waterNetwork'),null);assert.equal(JSON.stringify(game),before);
 game.player.carry=C.makeBag(A.catalogue.items.find(i=>i.key==='mechanism:counterweight').cost);assert.deepEqual(A.choiceStatus(game,'mechanism:counterweight').missing,{});
});
test('All city choice types navigate the true age catalogue without firing its action buttons',()=>{
 const calls=[],game={state:'playing',player:{dead:false},canIssueCommand:()=>true,cityCatalogueUI150:{open(){calls.push('open');return true;},selectAge(age){calls.push(age);return true;}}};
 for(const item of A.catalogue.items){calls.length=0;assert.equal(A.openChoice(game,item.key),true);assert.deepEqual(calls,['open',item.tier]);}
 assert.equal(A.openChoice(game,'fake:waterNetwork'),false);game.player.dead=true;assert.equal(A.openChoice(game,A.catalogue.items[0].key),false);
});
test('Guide usage filters show actual choices, known programmes and exclusions without revealing hidden sites',()=>{
 const {game}=fixture();assert.equal(Guide.query({availability:'city'},game).length,180);assert.equal(Guide.query({availability:'unavailable'},game).length,626);assert.equal(Guide.query({availability:'supported'},game).length,3374);
 assert.deepEqual(Guide.query({availability:'known'},game).map(e=>e.id),['programme-DW-3001']);assert.equal(Guide.query({availability:'known',text:'DW-3002'},game).length,0);
});
test('Shipped guide opens a specific real age and card with visible native button focus and no spending or RNG',()=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.worldCodex.open();
 const before=clean(g),rng=g.random.state,next=g.random.next;g.random.next=()=>{throw Error('Guide must not consume simulation RNG');};
 try{const use=doc.getElementById('worldCodexAvailability159'),search=doc.getElementById('worldCodexSearch');use.value='city';use.dispatch('change');search.value='accumulateur';search.dispatch('input');
  const card=doc.getElementById('worldCodexResults').querySelectorAll('article').find(n=>n.dataset.codexId==='city159-building:frontBattery150');assert.ok(card);assert.match(textTree(card),/Batterie vide/);assert.match(textTree(card),/Âge 11 à atteindre/);
  const button=card.querySelectorAll('button').find(n=>n.dataset.codexAction159);assert.equal(button.type,'button');assert.ok(button.getAttribute('aria-label').includes('Accumulateur'));button.click();
  assert.equal(g.cityCatalogueUI150.selectedAge(),10);const target=doc.getElementById('cityCatalogueGroups150').querySelectorAll('article').find(n=>n.dataset.choice==='building:frontBattery150');assert.equal(target.closest('details').open,true);assert.equal(doc.activeElement.dataset.catalogueAction,'building:frontBattery150');assert.equal(doc.activeElement.closest('.hidden'),null);assert.equal(doc.activeElement.closest('[inert]'),null);
  assert.deepEqual(clean(g),before);assert.equal(g.random.state,rng);assert.equal(g.selectedBuild,null);
 }finally{g.random.next=next;}
});
test('Guide live diagnostics update readable limits without replacing focused native controls',()=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.worldCodex.open();const use=doc.getElementById('worldCodexAvailability159'),search=doc.getElementById('worldCodexSearch');use.value='city';use.dispatch('change');search.value='counterweight';search.dispatch('input');
 const card=doc.getElementById('worldCodexResults').querySelectorAll('article').find(n=>n.dataset.codexId==='city159-mechanism:counterweight');assert.ok(card);const button=card.querySelectorAll('button')[0];button.focus();const before=clean(g);g.worldCodex.updateLive(true);assert.equal(doc.activeElement,button);assert.deepEqual(clean(g),before);
 assert.match(doc.getElementById('worldCodexCoverage159').textContent,/626/);assert.match(doc.getElementById('worldCodexCoverage159').textContent,/300/);
 use.value='unavailable';search.value='DW-0300';use.dispatch('change');assert.equal(doc.getElementById('worldCodexStatus').value,'programme');assert.match(textTree(doc.getElementById('worldCodexResults')),/sans plan additionnel implantable/);
});
test('A partial native freight site remains linked despite the complete rail programme being unsupported',()=>{
 const {game}=fixture();game.frontier.world=()=>({pois:[{id:'P0100',name:'Halle fret désaffectée',type:'freight',codex:'DW-0289',levels:[0]}]});
 assert.equal(A.capability('DW-0289').eligible,false);assert.equal(A.knownPlaces(game,'DW-0289')[0].id,'P0100');assert.equal(A.placeAction(game,'DW-0289','P0100','map'),true);
});
test('Shipped regional guide uses the real atlas and saved waypoint without touching unknown sites or resources',()=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();const world=g.frontier.world(),place=world.pois.find(p=>p.programme3000),code=place.programme3000;
 assert.ok(place);g.frontier.revealSites([place.id]);g.worldCodex.open();const before=clean(g),rng=g.random.state,next=g.random.next;g.random.next=()=>{throw Error('Map links must not use simulation RNG');};
 try{const use=doc.getElementById('worldCodexAvailability159'),search=doc.getElementById('worldCodexSearch');use.value='known';search.value=code;use.dispatch('change');const cards=doc.getElementById('worldCodexResults').querySelectorAll('article');assert.equal(cards.length,1);
  const card=cards[0],places=card.querySelectorAll('details').find(n=>n.children[0].textContent==='Lieux de cette fiche déjà repérés');places.open=true;const buttons=places.querySelectorAll('button');assert.equal(buttons.length,2);assert.ok(buttons.every(b=>b.dataset.codexPlace159===place.id));
  buttons[0].click();assert.equal(g.frontierUI.atlas.selected().id,place.id);assert.deepEqual(clean(g),before);
  g.worldCodex.open();doc.getElementById('worldCodexAvailability159').value='known';doc.getElementById('worldCodexSearch').value=code;g.worldCodex.refresh();const selected=doc.getElementById('worldCodexResults').querySelectorAll('article')[0],sites=selected.querySelectorAll('details').find(n=>n.children[0].textContent==='Lieux de cette fiche déjà repérés');sites.open=true;sites.querySelectorAll('button')[1].click();
  const after=clean(g);assert.equal(after.frontier.pin,place.id);after.frontier.pin=before.frontier.pin;assert.deepEqual(after,before);assert.equal(g.random.state,rng);assert.deepEqual(g.frontier.discoveries(),[place.id]);
 }finally{g.random.next=next;}
});
