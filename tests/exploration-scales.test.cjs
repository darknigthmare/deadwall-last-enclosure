'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),Scales=require('../src/exploration-scales.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const root=path.join(__dirname,'..');
const bag=values=>({wood:500,scrap:500,stone:500,food:500,fuel:500,ammo:500,medicine:500,...values});
const city=extra=>({resources:bag(),storage:500,population:1,housing:4,units:[],world:{buildings:new Map()},hasResearch:()=>false,...extra});
const site=(id,type,progress=0)=>({id,type,def:C.BUILDINGS[type],dead:false,health:10,progress,get completed(){return this.progress>=1;}});
const ids=needs=>needs.map(need=>need.id);

test('échelles : la table range des entrées réellement présentes dans le code, sans doublon',()=>{
  assert.deepEqual(Scales.SCALES.map(s=>s.id),['abords','secteurs','region']);
  assert.deepEqual(Scales.SCALES.map(s=>s.name),['Les abords','Les secteurs','La région']);
  assert.ok(Object.isFrozen(Scales.SCALES)&&Object.isFrozen(Scales.SCALES[0].entries)&&Object.isFrozen(Scales.SCALES[0].entries[0]));
  const all=Scales.SCALES.flatMap(s=>s.entries),keys=all.map(e=>e.kind+':'+e.id);
  assert.equal(new Set(keys).size,keys.length);
  const sources=fs.readdirSync(path.join(root,'src')).filter(f=>f.endsWith('.js')&&f!=='exploration-scales.js').map(f=>fs.readFileSync(path.join(root,'src',f),'utf8')).join('\n');
  for(const entry of all){
    assert.ok(['fieldView','control','pack'].includes(entry.kind));assert.ok(entry.label.length>3);
    if(entry.kind==='fieldView')assert.ok(sources.includes("dataset.fieldView='"+entry.id+"'")||sources.includes("dataset.fieldView = '"+entry.id+"'")||sources.includes("['"+entry.id+"',"),'onglet '+entry.id);
    if(entry.kind==='control')assert.ok(sources.includes("'"+entry.id+"'"),'contrôle '+entry.id);
    if(entry.kind==='pack')assert.ok(sources.includes("register({id:'"+entry.id+"'"),'fiche '+entry.id);
  }
  // Chaque ressource rangée dans les secteurs y est réellement proposée par un quartier ou une halte.
  const sectorGoods=new Set([...C.TERRITORY_SECTORS.map(s=>s.resource),...C.Expeditions.SITES.map(s=>s.resource)]);
  assert.deepEqual(Object.keys(Scales.RESOURCE_SCALE),[...C.RESOURCE_KEYS]);
  for(const [key,scale]of Object.entries(Scales.RESOURCE_SCALE)){assert.ok(['abords','secteurs','region'].includes(scale));if(scale==='secteurs')assert.ok(sectorGoods.has(key),key);}
});

test('besoins : une cité pleine et achevée n’a aucun besoin',()=>{
  assert.deepEqual(Scales.cityNeeds(city()),[]);assert.deepEqual(Scales.cityNeeds(null),[]);
  assert.equal(Scales.needsSentence([]),'');
});

test('besoins : les trois réserves les plus basses, classées par taux de remplissage',()=>{
  const g=city({resources:bag({wood:400,scrap:50,fuel:10,medicine:250,stone:499})}),needs=Scales.cityNeeds(g);
  assert.deepEqual(ids(needs),['stock-fuel','stock-scrap','stock-medicine']);
  assert.deepEqual(needs[0],{id:'stock-fuel',kind:'reserve',label:'Carburant au plus bas',detail:'10 / 500 en réserve.',scale:'secteurs',resource:'fuel'});
  assert.deepEqual(needs[1],{id:'stock-scrap',kind:'reserve',label:'Ferraille au plus bas',detail:'50 / 500 en réserve.',scale:'abords',resource:'scrap'});
  assert.equal(needs[2].scale,'secteurs');
  assert.ok(Object.isFrozen(needs)&&Object.isFrozen(needs[0]));
  // À égalité de taux, l'ordre des ressources du jeu départage : le résultat est stable.
  const tie=city({resources:bag({medicine:20,wood:20,ammo:20,food:20})});
  assert.deepEqual(ids(Scales.cityNeeds(tie)),['stock-wood','stock-food','stock-ammo']);
  assert.deepEqual(Scales.cityNeeds(tie),Scales.cityNeeds(tie));
});

test('besoins : l’autonomie vient du bilan logistique existant et ne change pas le classement',()=>{
  const g=city({population:10,housing:60,resources:bag({food:26,wood:5,scrap:5,stone:5})}),needs=Scales.cityNeeds(g);
  const use=C.FieldOperations.logistics({resources:g.resources,storage:500,population:10,buildings:[],hasResearch:()=>false}).rows.find(r=>r.key==='food').consumption;
  assert.ok(use>0&&Math.floor(26/use)>1);
  assert.deepEqual(ids(needs),['stock-wood','stock-scrap','stock-stone'],'trois réserves au plus, par taux de remplissage');
  g.resources.stone=400;const food=Scales.cityNeeds(g).find(n=>n.id==='stock-food');
  assert.equal(food.kind,'reserve');assert.equal(food.label,'Nourriture au plus bas');
  assert.equal(food.detail,'26 / 500 en réserve ; consommation supérieure à la production, environ '+Math.floor(26/use)+' minutes d’autonomie.');
  g.resources.food=500;assert.equal(ids(Scales.cityNeeds(g)).includes('stock-food'),false,'une réserve pleine n’est pas un besoin, même consommée');
});

test('besoins : munitions sous une salve, chantiers en attente, logements pleins, dans cet ordre',()=>{
  const buildings=new Map([[1,site(1,'watchtower',1)],[2,site(2,'watchtower',1)],[3,site(3,'house',.4)],[4,site(4,'house',0)],[5,site(5,'warehouse',.9)]]);
  const dead=site(6,'house',0);dead.dead=true;buildings.set(6,dead);
  assert.ok(C.BUILDINGS.watchtower.range>0);
  const cost=2*(C.BUILDINGS.watchtower.ammoPerShot||1)+1;
  const g=city({population:4,housing:4,units:[{kind:'soldier',health:10},{kind:'soldier',dead:true,health:0},{kind:'worker',health:10}],world:{buildings},resources:bag({ammo:cost-1,wood:100})});
  const needs=Scales.cityNeeds(g);
  assert.deepEqual(ids(needs),['stock-ammo','sites','housing','stock-wood']);
  assert.equal(needs[0].kind,'volley');assert.equal(needs[0].label,'Munitions sous une salve');
  assert.equal(needs[0].detail,(cost-1)+' / 500 en réserve ; une salve de toutes les défenses en coûte '+cost+'.');
  assert.deepEqual(needs[1],{id:'sites',kind:'sites',label:'3 chantiers en attente',detail:'Financés, à bâtir sur place : '+C.BUILDINGS.house.name+' ×2, '+C.BUILDINGS.warehouse.name+'.',scale:null});
  assert.deepEqual(needs[2],{id:'housing',kind:'housing',label:'Logements pleins',detail:'4 / 4 places ; aucune recrue ne peut être accueillie.',scale:null});
  g.resources.ammo=cost;assert.equal(Scales.cityNeeds(g).find(n=>n.id==='stock-ammo').kind,'reserve','une salve payable n’est plus une urgence');
  g.housing=5;assert.equal(ids(Scales.cityNeeds(g)).includes('housing'),false);
  assert.equal(Scales.needsSentence(needs),'Besoins de la cité : munitions sous une salve, 3 chantiers en attente, logements pleins, bois au plus bas.');
});

test('besoins : l’eau de cité n’apparaît que si son module existe, est suivi et manque',()=>{
  const water=(stage,needed=true)=>({needed:()=>needed,stage:()=>stage,reserve:()=>({tanks:2,water:0,capacity:240})});
  assert.deepEqual(Scales.cityNeeds(city({cityWater215:undefined})),[]);
  assert.deepEqual(Scales.cityNeeds(city({cityWater215:water(0)})),[]);
  assert.deepEqual(Scales.cityNeeds(city({cityWater215:water(2,false)})),[]);
  assert.deepEqual(Scales.cityNeeds(city({cityWater215:water(1)})),[{id:'water',kind:'water',label:'Citernes vides',detail:'0 / 240 dans les citernes ; la population se rationne.',scale:'abords'}]);
  const needs=Scales.cityNeeds(city({cityWater215:water(2),resources:bag({wood:1})}));
  assert.deepEqual(ids(needs),['water','stock-wood']);assert.equal(needs[0].label,'Pénurie d’eau');
});

test('échelles : le module ne touche ni aux stocks, ni à la sauvegarde, ni au hasard',()=>{
  const source=fs.readFileSync(path.join(root,'src/exploration-scales.js'),'utf8');
  for(const forbidden of ['Math.random','localStorage','sessionStorage','spend(','.save(','serialize','restoreSave(','.random.','.morale=','.signature='])assert.equal(source.includes(forbidden),false,forbidden);
  assert.equal(/(resources|stock|carry)\s*(\[[^\]]*\]|\.\w+)\s*(=(?!=)|\+=|-=|\+\+|--)/.test(source),false,'aucune écriture de stock');
  assert.equal(C.ExplorationScales,undefined,'la table de présentation reste hors du cœur d’équilibrage');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(html.includes('<script src="src/fallback-order.js"></script>\n  <script src="src/exploration-scales.js"></script>'));
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('"src/exploration-scales.js"'));
});

test('échelles : le carnet affiche besoins et échelles sans modifier la partie',()=>{
  const {g,doc}=bootDocument134();assert.equal(Scales.install(g,doc),true);assert.equal(Scales.install(g,doc),false);
  const box=doc.getElementById('explorationScales');assert.ok(box);assert.equal(box.tagName,'ASIDE','jamais masqué comme une section de dossier');
  assert.equal(box.parentNode,doc.getElementById('commandPanel-field'));assert.equal(box.hidden,true,'rien hors partie');
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.refreshMetrics(true);
  const state=()=>JSON.stringify({...g.serialize(),timestamp:0});
  const saved=state(),stock=JSON.stringify(g.resources);
  const pure=Scales.cityNeeds(g);for(let i=0;i<5;i++)assert.deepEqual(Scales.cityNeeds(g),pure);
  g.explorationScales.render();g.explorationScales.offers();
  assert.equal(state(),saved,'aucune modification de la campagne');assert.equal(JSON.stringify(g.resources),stock);
  assert.equal(box.hidden,false);
  const lines=doc.getElementById('explorationScalesNeeds').children;
  assert.equal(lines.length,Math.max(1,pure.length));
  if(pure.length){assert.equal(lines[0].dataset.need,pure[0].id);assert.equal(lines[0].children[0].textContent,pure[0].label);assert.equal(lines[0].children[1].textContent,pure[0].detail);}
  assert.ok(pure.filter(n=>n.id.startsWith('stock-')).length<=3);
  const cards=doc.getElementById('explorationScalesWhere').children;
  assert.deepEqual(cards.map(card=>card.dataset.scale),['abords','secteurs','region']);
  assert.deepEqual(cards.map(card=>card.children[0].textContent),['1. Les abords','2. Les secteurs','3. La région']);
  // Un besoin réel suit l'état : un chantier posé apparaît, puis disparaît une fois achevé.
  const before=g.explorationScales.needs().some(n=>n.id==='sites');
  const b=[...g.world.buildings.values()].find(x=>x.completed&&x.type!=='core')||[...g.world.buildings.values()][0],progress=b.progress;
  b.progress=.5;assert.equal(g.explorationScales.needs().some(n=>n.id==='sites'),true);b.progress=progress;
  assert.equal(g.explorationScales.needs().some(n=>n.id==='sites'),before);
  assert.equal(state(),saved);
});

test('échelles : une entrée voilée par l’âge n’est jamais proposée, et l’ouverture passe par l’onglet existant',()=>{
  const {g,doc}=bootDocument134({search:'?agereveal=1'});
  require('../src/age-reveal.js').install(g,doc);Scales.install(g,doc);
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.refreshMetrics(true);g.updateUI();
  const nav=doc.getElementById('commandPanel-field').querySelector('.field-nav'),tab=view=>nav.children.find(n=>n.dataset.fieldView===view);
  const offered=()=>g.explorationScales.offers().flatMap(s=>s.entries.map(e=>e.kind+':'+e.id));
  const button=(kind,id)=>doc.getElementById('explorationScale-'+kind+'-'+id);
  assert.equal(tab('operations').getAttribute('data-age-veiled'),'true');assert.equal(tab('territories').getAttribute('data-age-veiled'),'true');
  g.explorationScales.render();
  assert.equal(offered().includes('fieldView:operations'),false);assert.equal(offered().includes('fieldView:territories'),false);
  assert.equal(button('fieldView','operations').hidden,true);assert.equal(button('fieldView','territories').hidden,true);
  assert.equal(g.explorationScales.go(Scales.SCALES[0].entries[0]),false,'aucune ouverture d’un dossier voilé');
  assert.ok(offered().includes('fieldView:recon'),'la carte n’est jamais voilée');assert.equal(button('fieldView','recon').hidden,false);
  for(const key of offered()){const [kind,id]=key.split(':');if(kind==='fieldView')assert.notEqual(tab(id).getAttribute('data-age-veiled'),'true',id);}
  // Chaque besoin nomme son échelle ; un besoin réglé dans l'enceinte le dit.
  g.resources.fuel=0;g.showCommand(true,'field');
  const fuel=doc.getElementById('explorationScalesNeeds').children.find(n=>n.dataset.need==='stock-fuel');
  assert.ok(fuel);assert.equal(g.explorationScales.offers()[1].entries.length>0,true);assert.equal(fuel.children[2].textContent,'→ Les secteurs');
  // Le clic délègue à l'onglet d'origine : on compte ses propres clics.
  let clicks=0;tab('recon').addEventListener('click',()=>clicks++);
  button('fieldView','recon').click();assert.equal(clicks,1);
  assert.equal(doc.getElementById('reconPanel').classList.contains('hidden'),false);
  // L'âge venu, l'entrée reparaît sans autre intervention.
  g.tier=C.CITY_TIERS[C.CITY_TIERS.length-1];g.updateUI();g.explorationScales.render();
  assert.ok(offered().includes('fieldView:operations'));assert.ok(offered().includes('fieldView:territories'));
  assert.equal(button('fieldView','operations').hidden,false);
});

test('bilan de départ : les besoins de la cité s’ajoutent au détail quand le module est chargé',()=>{
  const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.refreshMetrics(true);
  const had=globalThis.DeadwallExplorationScales;
  try{
    delete globalThis.DeadwallExplorationScales;const plain=g.departure130.assess();assert.deepEqual(plain.needs,[]);
    globalThis.DeadwallExplorationScales=Scales;const full=g.departure130.assess(),needs=Scales.cityNeeds(g);
    assert.deepEqual(full.needs,needs);
    assert.equal(full.detail,needs.length?plain.detail+' '+Scales.needsSentence(needs):plain.detail);
    assert.equal(full.tone,plain.tone);assert.equal(full.title,plain.title);assert.equal(full.advice,plain.advice);
  }finally{if(had===undefined)delete globalThis.DeadwallExplorationScales;else globalThis.DeadwallExplorationScales=had;}
});

test('échelles : la section suit le classement du carnet et les fiches passent par le registre existant',async()=>{
  const e=bootDocument134();await new Promise(r=>setTimeout(r,0));const {g,doc}=e;
  assert.equal(g.playerMenus194.mode,'player');assert.ok(g.explorationScales,'monté par la page, après le carnet');
  g.startNew('standard','17117','classic','balanced',false);g.campaignIntro132.skip();g.refreshMetrics(true);
  const box=doc.getElementById('explorationScales'),field=doc.getElementById('commandPanel-field'),nav=field.querySelector('.field-nav');
  const shown=()=>[...field.children].filter(n=>n.tagName==='SECTION'&&!n.classList.contains('hidden')).map(n=>n.id);
  g.showCommand(true,'field');
  assert.equal(g.playerMenus194.view().domain,'terrain');assert.equal(box.hidden,false);
  assert.ok(field.children.indexOf(box)<field.children.findIndex(n=>n.tagName==='SECTION'),'en tête des dossiers');
  assert.equal(field.children[field.children.indexOf(box)-1],nav);
  const state=()=>JSON.stringify({...g.serialize(),timestamp:0}),saved=state();
  // Une fiche du registre : même ouverture que le sélecteur des opérations.
  doc.getElementById('explorationScale-pack-forage193').click();
  assert.deepEqual(shown(),['field-expansions']);assert.equal(doc.getElementById('playerOperationSelect196').value,'forage193');assert.equal(box.hidden,false);
  // Un onglet de terrain : la section reste, le dossier change.
  doc.getElementById('explorationScale-fieldView-recon').click();
  assert.deepEqual(shown(),['reconPanel']);assert.equal(g.playerMenus194.view().selectedField,'reconPanel');assert.equal(box.hidden,false);
  // Un onglet classé « Dans la cité » : le carnet change de classement et la section s'efface.
  const quarters=doc.getElementById('explorationScale-fieldView-territories'),veiled=[...nav.children].find(n=>n.dataset.fieldView==='territories').getAttribute('data-age-veiled')==='true';
  assert.equal(quarters.hidden,veiled);
  if(veiled){quarters.click();assert.deepEqual(shown(),['reconPanel'],'un bouton voilé n’ouvre rien');g.settings.revealAll=true;g.updateUI();g.explorationScales.render();assert.equal(quarters.hidden,false);}
  quarters.click();
  assert.deepEqual(shown(),['field-territories']);assert.equal(g.playerMenus194.view().domain,'city');assert.equal(box.hidden,true);
  doc.getElementById('notebookDomain-terrain').click();g.updateUI();assert.equal(g.playerMenus194.view().domain,'terrain');assert.equal(box.hidden,false);
  g.settings.revealAll=false;assert.equal(state(),saved,'naviguer ne modifie pas la campagne');
  g.showCommand(false);
});
