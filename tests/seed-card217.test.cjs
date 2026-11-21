'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),Card=require('../src/seed-card217.js'),World=require('../src/frontier-world.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const root=path.join(__dirname,'..');
const region=seed=>World.create(seed,8,{ecologyVersion:1,hydrologyVersion:1});
const centre=C.WORLD_SIZE/2;
const node=(type,dx,dy,maxAmount=40)=>({type,x:centre+dx,y:centre+dy,maxAmount,amount:1});
const ring=(type,count,radius)=>Array.from({length:count},(_,i)=>node(type,Math.cos(i)*radius,Math.sin(i)*radius));
// Monde factice minimal : seules les données lues par la fiche.
const fake=extra=>({seed:9,generation:8,landscape189:'balanced',home:{x:5000,y:5000},towns:[],pois:[],...extra});
const sea=(points,side='west')=>({features:[],coast:{side,points}});

test('fiche de graine : deux graines donnent deux fiches, une même graine redonne la même fiche',()=>{
  const nodes=[...ring('wood',9,300),...ring('stone',2,500),...ring('scrap',7,700)];
  const a=Card.describe({seed:17117,world:region(17117),nodes}),again=Card.describe({seed:17117,world:region(17117),nodes}),b=Card.describe({seed:42,world:region(42),nodes});
  assert.deepEqual(again,a,'fonction pure : deux mondes retracés pour la même graine');assert.equal(again.share,a.share);
  assert.notEqual(b.share,a.share);assert.notDeepEqual(b.biomes,a.biomes);assert.notDeepEqual(b.density,a.density);assert.notDeepEqual(b.home,a.home);
  assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.biomes)&&Object.isFrozen(a.lines)&&Object.isFrozen(a.places.items));
  for(const card of [a,b]){
    assert.equal(card.biomes.known,true);assert.ok(card.biomes.dominant.name.length>3);assert.ok(card.biomes.others.length>=1&&card.biomes.others.length<=3);
    assert.ok(card.biomes.others.every(o=>o.share<=card.biomes.dominant.share&&o.share>=Card.RULES.biomeMinShare));
    assert.equal(card.water.known,true);assert.ok(card.water.river.distance>=0&&card.water.coast.distance>0);
    assert.ok(['isolé','rural','périurbain','urbain'].includes(card.density.word));
    assert.deepEqual(card.lines.map(l=>l[0]),['Milieu','Eau','Densité','Ouverture','Premières grandes agglomérations']);
    assert.equal(card.places.source,'towns');assert.equal(card.places.items.length,3);
    assert.ok(card.advice.length>10);assert.ok(card.share.startsWith('DEADWALL — Graine '+card.seed+' · Paysage historique\n'));
    assert.equal(card.share.includes('undefined'),false);assert.equal(card.share.includes('NaN'),false);
  }
  // Les noms sont ceux des biomes existants, et les distances celles des données générées.
  const w=region(17117),names=new Set(Object.values(w.biomes.BY).map(d=>d.name));
  assert.ok(names.has(a.biomes.dominant.name));for(const o of a.biomes.others)assert.ok(names.has(o.name));
  const nearest=Math.min(...w.towns.map(t=>Math.hypot(t.x-w.home.x,t.y-w.home.y)));
  assert.ok(Math.abs(a.density.nearestTown.distance-nearest)<1e-9);
  assert.equal(a.density.towns,w.towns.filter(t=>Math.hypot(t.x-w.home.x,t.y-w.home.y)<=Card.RULES.townWide).length);
  assert.equal(a.density.places,w.pois.filter(p=>Math.hypot(p.x-w.home.x,p.y-w.home.y)<=Card.RULES.placeRadius).length);
  assert.ok(a.water.river.distance>=w.hydrologyAt(w.home.x,w.home.y).distanceToWater-1e-6,'la rivière n’est jamais plus proche que l’eau la plus proche');
});

test('fiche de graine : la lecture ne modifie pas le monde tracé',()=>{
  const w=region(17117),before=JSON.stringify([w.streamStats(),w.towns.length,w.pois.length,w.home,w.hydrology.stats()]);
  const nodes=ring('wood',6,200),copy=JSON.stringify(nodes);
  for(let i=0;i<3;i++)Card.describe({seed:17117,world:w,nodes});
  assert.equal(JSON.stringify([w.streamStats(),w.towns.length,w.pois.length,w.home,w.hydrology.stats()]),before,'aucun tronçon chargé, aucun lieu ajouté');
  assert.equal(JSON.stringify(nodes),copy);
});

test('fiche de graine : distances, directions et mots de densité',()=>{
  assert.equal(Card.distanceText(4),'10 m');assert.equal(Card.distanceText(434),'430 m');assert.equal(Card.distanceText(1745),'1,7 km');assert.equal(Card.distanceText(3000),'3 km');assert.equal(Card.distanceText(NaN),'');
  assert.equal(Card.direction(10,0),'à l’est');assert.equal(Card.direction(0,-10),'au nord');assert.equal(Card.direction(-7,7),'au sud-ouest');assert.equal(Card.direction(0,0),'');
  const town=(id,dx,kind='village')=>({id,name:'Bourg '+id,kind,x:5000+dx,y:5000});
  const word=towns=>Card.describe({world:fake({towns})}).density.word;
  assert.equal(word([]),'isolé');assert.equal(word([town('a',3400)]),'isolé');
  assert.equal(word([town('a',2600)]),'rural');
  assert.equal(word([town('a',2600),town('b',-2900)]),'périurbain');assert.equal(word([town('a',1500)]),'périurbain');
  assert.equal(word([town('a',1500),town('b',-1900)]),'urbain');assert.equal(word([town('a',1800,'ville')]),'urbain');
  const d=Card.describe({world:fake({towns:[town('a',2600),town('b',-900,'hameau')],pois:[{x:5100,y:5000},{x:5000,y:6400},{x:9000,y:5000}]})}).density;
  assert.equal(d.places,2);assert.equal(d.nearestTown.name,'Bourg b');
  assert.equal(d.text,'Périurbain : 2 agglomérations à moins de 3 km, 2 lieux recensés à moins de 1,5 km ; la plus proche, Bourg b (hameau), est à 900 m à l’ouest.');
});

test('fiche de graine : l’eau se lit dans le réseau tracé, ou « aucune eau proche »',()=>{
  const coast=[{x:1000,y:0},{x:1000,y:20000}];
  const dry=Card.describe({world:fake({hydrology:sea(coast),hydrologyAt:()=>({nearestKind:'pond',distanceToWater:2600})})}).water;
  assert.equal(dry.none,true);assert.equal(dry.river,null);assert.equal(dry.text,'Aucune eau proche · côte à 4 km à l’ouest.');
  const river={kind:'river',width:8,points:[{x:0,y:4600},{x:9000,y:4600}]},stream={kind:'stream',width:2,points:[{x:5000,y:5001},{x:5000,y:5002}]};
  const wet=Card.describe({world:fake({hydrology:{...sea(coast),features:[stream,river]},hydrologyAt:()=>({nearestKind:'pool',distanceToWater:120})})}).water;
  assert.equal(wet.none,false);assert.equal(wet.river.distance,396,'bord de rivière, ruisseaux ignorés');
  assert.equal(wet.text,'Mare à 120 m · rivière à 400 m au nord · côte à 4 km à l’ouest.');
  const old=Card.describe({world:fake({})});
  assert.equal(old.water.known,false);assert.equal(old.biomes.known,false);assert.equal(old.water.text,'Eau non relevée sur cette génération de carte.');
  // Une ancienne génération (région de 8 192, sans biomes ni rivières) reste lisible.
  const legacy=Card.describe({seed:5,world:World.create(5,3,{}),nodes:[]});
  assert.equal(legacy.biomes.known,false);assert.equal(legacy.water.known,false);assert.equal(legacy.share.includes('undefined'),false);assert.ok(legacy.density.nearestTown);
  assert.doesNotThrow(()=>Card.describe({}));assert.doesNotThrow(()=>Card.describe(null));
});

test('fiche de graine : ressources d’ouverture et conseil déduits des gisements du site',()=>{
  const biome={biomeAt:()=>({id:'meadow',primary:'meadow',name:'Prairies ouvertes'})};
  const quarry={type:'quarry',x:5000,y:2600},sawmill={type:'sawmill',x:6200,y:5000};
  const plain=Card.describe({world:fake({...biome,pois:[quarry,sawmill]}),nodes:[...ring('wood',16,400),...ring('scrap',8,600),node('stone',5000,0),node('food',10,10)]});
  assert.deepEqual([plain.opening.wood.count,plain.opening.stone.count,plain.opening.scrap.count],[16,0,8]);
  assert.deepEqual([plain.opening.wood.level,plain.opening.stone.level,plain.opening.scrap.level],['plenty','scarce','fair']);
  assert.equal(plain.opening.wood.amount,640,'quantités d’origine, pas le reste après récolte');
  assert.equal(plain.opening.text,'Bois abondant (16 gisements, 640) · Pierre rare (0 gisement, 0) · Ferraille présente (8 gisements, 320) — à moins de 28 m du centre.');
  assert.ok(plain.advice.startsWith('Aucune pierre à portée de marche : la carrière la plus proche est à 2,4 km au nord ; ouvrez en bois.'),plain.advice);
  assert.equal(plain.biomes.text,'Prairies ouvertes (100 %) ; milieu unique à la ronde.');
  const noQuarry=Card.describe({world:fake(biome),nodes:[...ring('wood',16,400),...ring('scrap',8,600)]});
  assert.ok(noQuarry.advice.startsWith('Aucune pierre à portée de marche : la carrière sera loin ; ouvrez en bois.'),noQuarry.advice);
  const bare=Card.describe({world:fake({...biome,pois:[quarry,sawmill]}),nodes:[...ring('stone',9,300),...ring('scrap',9,300),node('wood',20,0)]});
  assert.ok(bare.advice.startsWith('Peu de bois à portée de marche : la scierie la plus proche est à 1,2 km à l’est ; la pierre, elle, est sur place.'),bare.advice);
  const rich=Card.describe({world:fake(biome),nodes:[...ring('wood',9,300),...ring('stone',9,300),...ring('scrap',9,300)]});
  assert.ok(rich.advice.startsWith('Bois, pierre et ferraille à portée de marche : l’ouverture est libre.'));
  assert.ok(rich.advice.includes('Aucune agglomération à moins de 3 km'),'le second conseil vient de la densité');
  // La récolte ne change pas la fiche : un gisement épuisé compte toujours pour sa quantité d'origine.
  const nodes=ring('stone',9,300),first=Card.describe({world:fake(biome),nodes}).opening;for(const n of nodes){n.amount=0;n.depleted=true;}
  assert.deepEqual(Card.describe({world:fake(biome),nodes}).opening,first);
});

test('fiche de graine : lieux remarquables s’ils existent, sinon les plus grandes agglomérations, sinon rien',()=>{
  const towns=[{id:'t1',name:'Petit',kind:'hameau',x:5200,y:5000},{id:'t2',name:'Grande',kind:'grande-ville',x:5000,y:9000},{id:'t3',name:'Ville',kind:'ville',x:2000,y:5000},{id:'t4',name:'Bourg',kind:'bourg',x:5000,y:4000}];
  const byTown=Card.describe({world:fake({towns})});
  assert.equal(byTown.places.source,'towns');assert.deepEqual(byTown.places.items.map(p=>p.name),['Bourg','Ville','Grande'],'bourgs et villes, du plus proche au plus lointain ; le hameau voisin est écarté');
  assert.equal(byTown.lines.at(-1)[0],'Premières grandes agglomérations');
  assert.equal(byTown.lines.at(-1)[1],'Bourg (bourg) à 1 km au nord · Ville (ville) à 3 km à l’ouest · Grande (grande ville) à 4 km au sud.');
  const small=Card.describe({world:fake({towns:towns.slice(0,1)})});
  assert.equal(small.lines.at(-1)[0],'Premières agglomérations');assert.equal(small.lines.at(-1)[1],'Petit (hameau) à 200 m à l’est.');
  const remarkable=[{id:'r2',name:'Barrage',kind:'ouvrage',x:5000,y:7000,distance:2000},{id:'r1',name:'Phare',kind:'repère',x:5300,y:5000,distance:300},{id:'bad'},{id:'r3',name:'Fort',kind:'ruine',x:1,y:1,distance:9000},{id:'r4',name:'Mine',kind:'site',x:5000,y:3000}];
  const byMark=Card.describe({world:fake({towns}),remarkable});
  assert.equal(byMark.places.source,'remarkable');assert.equal(byMark.places.title,'Premiers lieux remarquables');
  assert.deepEqual(byMark.places.items.map(p=>p.name),['Phare','Barrage','Mine']);
  assert.equal(byMark.lines.at(-1)[1],'Phare (repère) à 300 m à l’est · Barrage (ouvrage) à 2 km au sud · Mine (site) à 2 km au nord.');
  const none=Card.describe({world:fake({}),remarkable:[]});
  assert.equal(none.places.source,'none');assert.equal(none.lines.length,4);
  // `inputs` lit `nearest()` puis `list()`, et tolère un module absent ou en panne.
  const g=extra=>({world:{seed:9,nodes:[]},frontier:{world:()=>fake({towns})},...extra});
  assert.equal(Card.inputs(g({})).remarkable,null);
  assert.deepEqual(Card.inputs(g({remarkable217:{nearest:()=>[remarkable[1]]}})).remarkable,[remarkable[1]]);
  assert.deepEqual(Card.inputs(g({remarkable217:{nearest:()=>remarkable[1]}})).remarkable,[remarkable[1]]);
  assert.deepEqual(Card.inputs(g({remarkable217:{list:()=>remarkable}})).remarkable,remarkable);
  assert.equal(Card.inputs(g({remarkable217:{list:()=>{throw Error('panne');}}})).remarkable,null);
});

test('fiche de graine : la copie tolère l’absence de presse-papiers',async()=>{
  const had=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const set=value=>Object.defineProperty(globalThis,'navigator',{value,configurable:true,writable:true});
  try{
    set(undefined);assert.equal(await Card.copyText('17117',null),false);assert.equal(await Card.copyText('17117',{}),false);
    const written=[];set({clipboard:{writeText:text=>{written.push(text);return Promise.resolve();}}});
    assert.equal(await Card.copyText('17117',null),true);assert.deepEqual(written,['17117']);
    set({clipboard:{writeText:()=>Promise.reject(Error('refus'))}});assert.equal(await Card.copyText('17117',null),false);
    set({clipboard:{writeText:()=>{throw Error('interdit');}}});
    const made=[],doc={body:{appendChild:n=>made.push(n)},createElement:()=>({style:{},select(){},remove(){}}),execCommand:name=>name==='copy'};
    assert.equal(await Card.copyText('17117',doc),true,'repli sur l’ancienne commande');assert.equal(made[0].value,'17117');
  }finally{if(had)Object.defineProperty(globalThis,'navigator',had);else delete globalThis.navigator;}
});

test('fiche de graine : présentation seule, sans stock, sans sauvegarde, sans hasard, sans règle au cœur',()=>{
  const source=fs.readFileSync(path.join(root,'src/seed-card217.js'),'utf8');
  for(const forbidden of ['Math.random','localStorage','sessionStorage','spend(','.save(','serialize','restoreSave(','.random.','expansions.register','.rng(','.hash(','setInterval','requestAnimationFrame'])assert.equal(source.includes(forbidden),false,forbidden);
  assert.equal(/(resources|stock|carry)\s*(\[[^\]]*\]|\.\w+)\s*(=(?!=)|\+=|-=|\+\+|--)/.test(source),false,'aucune écriture de stock');
  assert.equal(C.SeedCard217Rules,undefined,'seuils de lecture hors du cœur d’équilibrage');assert.ok(Object.isFrozen(Card.RULES)&&Object.isFrozen(Card.RULES.biomeRings));
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const after=html.indexOf('<script src="src/exploration-scales.js"></script>'),own=html.indexOf('<script src="src/seed-card217.js"></script>');
  assert.ok(after>0&&own>after,'chargé après les échelles d’exploration');
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('"src/seed-card217.js"'));
  assert.ok(fs.readFileSync(path.join(root,'styles.css'),'utf8').includes('.seed-card217{'));
});

test('fiche de graine : un DOM factice ou incomplet ne casse rien',()=>{
  assert.equal(Card.install(null,null),false);assert.equal(Card.install({},{body:{},getElementById:()=>null}),false,'pas de carnet : pas de fiche');
  // Nœuds sans `after`, `insertBefore`, `replaceChildren` natif ni écouteurs.
  const make=tag=>({tagName:tag.toUpperCase(),children:[],textContent:'',hidden:false,dataset:{},setAttribute(){},append(...n){this.children.push(...n);},appendChild(n){this.children.push(n);return n;},replaceChildren(...n){this.children=n;}});
  const nav=make('nav'),field=make('section');field.querySelector=()=>nav;field.children.push(nav);
  const doc={body:make('body'),createElement:make,getElementById:id=>id==='commandPanel-field'?field:null};
  const calls=[];
  const g={state:'menu',elapsed:0,world:{seed:9,nodes:[node('wood',0,0)],cityGeometry202:0},frontier:{position:()=>({generation:8,landscape189:'balanced'}),world:()=>{calls.push(1);return fake({});}},updateUI(){},startNew(){this.state='playing';return true;},restoreSave(){return true;},returnToMenu(){this.state='menu';}};
  assert.equal(Card.install(g,doc),true);assert.equal(Card.install(g,doc),false);
  const box=field.children.at(-1);assert.equal(box.id,'seedCard217');assert.equal(box.hidden,true);assert.equal(calls.length,0,'rien n’est lu hors partie');
  g.startNew();assert.equal(box.hidden,false);assert.equal(calls.length,1);
  for(let i=0;i<50;i++){g.elapsed+=.2;g.updateUI();}
  assert.equal(calls.length,1,'une seule lecture par graine : aucun coût par image');
  assert.equal(g.seedCard217.card().title,'Graine 9 · Régions naturelles');
  g.world={...g.world,seed:10};g.startNew();assert.equal(calls.length,2);g.world={...g.world,seed:9};g.startNew();assert.equal(calls.length,2,'fiche gardée en cache par graine');
  assert.doesNotThrow(()=>g.returnToMenu());assert.equal(box.hidden,true);
});

test('fiche de graine : le carnet l’affiche pour toute campagne sans toucher à la partie ni à la sauvegarde',async()=>{
  const {g,doc}=bootDocument134();
  require('../src/exploration-scales.js').install(g,doc);
  assert.equal(Card.install(g,doc),true);assert.equal(Card.install(g,doc),false);
  const box=doc.getElementById('seedCard217');assert.ok(box);assert.equal(box.tagName,'ASIDE','jamais masqué comme une section de dossier');
  const field=doc.getElementById('commandPanel-field');assert.equal(box.parentNode,field);assert.equal(box.hidden,true,'rien hors partie');
  const order=[...field.children].map(n=>n.id);assert.ok(order.indexOf('seedCard217')>order.indexOf('explorationScales')&&order.indexOf('explorationScales')>=0,'près des échelles d’exploration');
  const menu=doc.getElementById('seedCard217Menu');assert.ok(menu);assert.equal(menu.hidden,true,'aucune graine inconnue décrite au menu');
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.refreshMetrics(true);
  const state=()=>JSON.stringify({...g.serialize(),timestamp:0});
  const saved=state(),stock=JSON.stringify(g.resources),position=JSON.stringify(g.frontier.position()),nodes=JSON.stringify(g.world.nodes.map(n=>[n.id,n.amount,n.depleted]));
  g.seedCard217.render();
  const card=g.seedCard217.card();
  assert.equal(g.seedCard217.card(),card,'même graine, même fiche, sans recalcul');
  assert.deepEqual(Card.describe(Card.inputs(g)),card,'recalcul identique');
  assert.equal(card.seed,17117);assert.equal(card.title,'Graine 17117 · Paysage historique');
  assert.equal(box.hidden,false);assert.equal(doc.getElementById('seedCard217Title').textContent,card.title);
  const facts=doc.getElementById('seedCard217Facts').children;assert.equal(facts.length,card.lines.length*2);
  assert.equal(facts[0].textContent,'Milieu');assert.equal(facts[1].textContent,card.lines[0][1]);
  assert.equal(doc.getElementById('seedCard217Advice').textContent,card.advice);
  assert.ok(card.opening.known&&card.opening.wood.count+card.opening.stone.count+card.opening.scrap.count>0,'gisements du site lus');
  // La copie signale son échec au lieu de lever une erreur quand rien ne permet de copier.
  const had=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  try{
    Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:()=>Promise.reject(Error('refus'))}},configurable:true,writable:true});
    assert.equal(await g.seedCard217.copy('seed'),false);assert.equal(doc.getElementById('seedCard217Status').textContent,'Copie impossible ici : notez la graine 17117.');
    const written=[];Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:t=>{written.push(t);return Promise.resolve();}}},configurable:true,writable:true});
    assert.equal(await g.seedCard217.copy('seed'),true);assert.equal(await g.seedCard217.copy('card'),true);
    assert.deepEqual(written,['17117',card.share]);assert.equal(doc.getElementById('seedCard217Status').textContent,'Fiche copiée.');
  }finally{if(had)Object.defineProperty(globalThis,'navigator',had);else delete globalThis.navigator;}
  assert.equal(state(),saved,'aucune modification de la campagne');assert.equal(JSON.stringify(g.resources),stock);
  assert.equal(JSON.stringify(g.frontier.position()),position);assert.equal(JSON.stringify(g.world.nodes.map(n=>[n.id,n.amount,n.depleted])),nodes);
  assert.equal(Object.hasOwn(g.serialize(),'seedCard217'),false,'aucun état sauvegardé');
  // Une campagne reprise (ancienne ou non) retrouve la même fiche, même après récolte.
  for(const n of g.world.nodes.slice(0,40)){n.amount=0;n.depleted=true;}
  const raw=JSON.parse(JSON.stringify(g.serialize()));
  assert.notEqual(g.restoreSave(raw),false);
  assert.deepEqual(Card.describe(Card.inputs(g)),card,'la fiche ne dépend pas de l’avancement');
  // Une autre graine donne une autre fiche ; le menu ne résume que la carte en cours.
  g.startNew('standard','42');g.campaignIntro132?.skip?.();
  const other=g.seedCard217.card();assert.equal(other.seed,42);assert.notEqual(other.share,card.share);assert.notEqual(other.summary,card.summary);
  g.seedCard217.render();assert.equal(doc.getElementById('seedCard217Title').textContent,'Graine 42 · Paysage historique');
  g.returnToMenu();assert.equal(box.hidden,true);
  assert.equal(menu.hidden,false);assert.ok(menu.textContent.startsWith('Carte en cours — graine 42 (Paysage historique) : '+other.summary+'.'),menu.textContent);
  const input=doc.getElementById('mapSeed');
  if(input){input.value='777';g.seedCard217.menu();assert.equal(menu.hidden,true,'une graine saisie inconnue n’est pas décrite');input.value='42';g.seedCard217.menu();assert.equal(menu.hidden,false);input.value='';}
});

// ---- Deuxième tranche : le milieu qui compte, les lieux remarquables réels, l'aperçu avant le départ. ----
const Biome=require('../src/biome217.js'),Remarkable=require('../src/remarkable217.js');

test('fiche de graine : le milieu de la cité s’affiche avec son avantage et sa contrainte chiffrés, et porte le conseil',()=>{
  const biome={biomeAt:()=>({id:'sandyPine',primary:'sandyPine',name:'Pinèdes sur sols sableux'})};
  const nodes=[...ring('wood',16,400),...ring('scrap',8,600),node('stone',40,0)];
  const forest=Card.describe({world:fake(biome),nodes,milieu:{active:true,profile:Biome.describe('forest')}});
  assert.deepEqual(forest.lines.map(l=>l[0]),['Milieu','Effet du milieu','Eau','Densité','Ouverture']);
  assert.equal(forest.lines[1][1],'Forêt : récolte du bois +15 %, nourriture des fermes protégées −10 %.');
  assert.equal(forest.milieu.family,'forest');assert.equal(forest.milieu.bonus.factor,C.Biome217Rules.families.forest.bonus.factor);assert.equal(forest.milieu.malus.percent,'−10 %');
  assert.equal(forest.adviceLines[0],'Forêt : bois +15 %, fermes −10 % — ouvrez en bois, prévoyez plus de fermes.');
  // L'accord fautif (« Pinèdes sur sols sableux pauvre en pierre ») a disparu : la phrase a son propre sujet.
  assert.equal(forest.adviceLines[1],'Peu de pierre à portée de marche : la carrière sera loin.');
  assert.equal(forest.advice.includes('Pinèdes'),false);assert.ok(forest.share.includes('Effet du milieu : Forêt : récolte du bois +15 %'));
  assert.equal(fs.readFileSync(path.join(root,'src/seed-card217.js'),'utf8').includes('pauvre en'),false,'plus d’adjectif accordé avec un nom de milieu');
  // Les cinq familles : chiffres lus dans les règles, jamais recopiés.
  for(const [id,d]of Object.entries(C.Biome217Rules.families)){
    const card=Card.describe({world:fake(biome),nodes,milieu:{active:true,profile:Biome.describe(id)}}),pct=x=>Math.round(Math.abs(x-1)*100)+' %';
    assert.ok(card.adviceLines[0].startsWith(d.name+' : '),id);assert.ok(card.adviceLines[0].includes('+'+pct(d.bonus.factor))&&card.adviceLines[0].includes('−'+pct(d.malus.factor)),card.adviceLines[0]);
    assert.equal(/undefined|NaN|profitez-en|compensez/.test(card.share),false,id);
    assert.equal(card.lines[1][1],d.name+' : '+Biome.describe(id).bonus.text+', '+Biome.describe(id).malus.text+'.');
  }
  // Ancienne campagne (règle inactive) ou module absent : aucun effet affiché, conseil sans chiffres.
  for(const milieu of [undefined,null,{active:false,profile:Biome.describe('forest')}]){
    const old=Card.describe({world:fake(biome),nodes,milieu});
    assert.deepEqual(old.lines.map(l=>l[0]),['Milieu','Eau','Densité','Ouverture']);assert.equal(old.milieu.active,false);assert.equal(old.milieu.family,null);
    assert.equal(old.advice.includes('%'),false);assert.equal(old.share.includes('Effet du milieu'),false);
    assert.equal(old.adviceLines[0],'Peu de pierre à portée de marche : la carrière sera loin ; ouvrez en bois.');
  }
  // Campagne neuve sans milieu marqué : dit, sans chiffre inventé.
  const neutral=Card.describe({world:fake(biome),nodes,milieu:{active:true,profile:Biome.describe(null)}});
  assert.equal(neutral.lines[1][1],'Aucun milieu marqué autour de D-17 : rendements inchangés.');assert.equal(neutral.advice.includes('%'),false);
  // `inputs` lit la famille figée de la campagne, et rien pour une campagne inactive ou un module en panne.
  const g=extra=>({world:{seed:9,nodes:[]},frontier:{world:()=>fake({})},...extra});
  assert.deepEqual(Card.inputs(g({})).milieu,{active:false,profile:null});
  assert.deepEqual(Card.inputs(g({biome217:{active:()=>false,profile:()=>Biome.describe('forest')}})).milieu,{active:false,profile:null});
  assert.equal(Card.inputs(g({biome217:{active:()=>true,profile:()=>Biome.describe('highland')}})).milieu.profile.family,'highland');
  assert.deepEqual(Card.inputs(g({biome217:{active:()=>true,profile:()=>{throw Error('panne');}}})).milieu,{active:false,profile:null});
  // Avec l'état du module sous la main, la fiche ne fait jamais avancer le relevé : elle ne touche pas à `profile()`.
  const had=globalThis.DeadwallBiome217;globalThis.DeadwallBiome217=Biome;
  try{
    const never=()=>{throw Error('la fiche ne doit pas figer la famille');},peat={home:{x:5000,y:5000},towns:[],pois:[],biomeAt:()=>({id:'peatland'})};
    const live=(family,world)=>Card.inputs({world:{seed:9,nodes:[]},frontier:{world:()=>world},biome217:{active:()=>true,snapshot:()=>({version:1,active:true,family,announced:false}),profile:never}}).milieu;
    assert.equal(live('highland',peat).profile.family,'highland','famille figée, même si le relevé d’aujourd’hui dirait autre chose');
    assert.equal(live(null,peat).profile.family,'wetland','relevé en attente : même relevé pur que la fondation');
    assert.equal(live('neutral',peat).profile.family,null);
  }finally{if(had===undefined)delete globalThis.DeadwallBiome217;else globalThis.DeadwallBiome217=had;}
});

test('fiche de graine : lieux remarquables mesurés depuis D-17 sur leurs coordonnées, avec genre ; nid et lot une fois repérés',()=>{
  // Forme de `g.remarkable217.list()` : `distance` y est mesurée depuis le joueur, ici volontairement fausse.
  const view=(id,name,label,dx,dy,nest,resource,amount,distance)=>({id,name,kind:'water',label,x:5000+dx,y:5000+dy,distance,nest,reward:{resource,amount,left:amount},state:'nest',sighted:true,objective:false});
  const list=[view('P0004','Silo Nord','silo',0,-3000,11,'fuel',24,10),view('P0001','Château d’eau','château d’eau',1200,0,12,'medicine',24,99999),
    view('P0003','Caserne','caserne',0,2000,16,'ammo',36,5),view('P0002','Gare','gare',-1500,0,10,'fuel',30,1)];
  const card=Card.describe({world:fake({}),remarkable:list});
  assert.equal(card.places.source,'remarkable');assert.deepEqual(card.places.items.map(p=>p.id),['P0001','P0002','P0003'],'les trois plus proches de D-17, pas du joueur');
  assert.deepEqual(card.places.items.map(p=>p.distance),[1200,1500,2000]);assert.deepEqual(card.places.items.map(p=>p.nest),[12,10,16]);
  assert.equal(card.lines.at(-1)[1],'Château d’eau (château d’eau, nid de 12, lot : 24 médicaments) à 1,2 km à l’est · Gare (gare, nid de 10, lot : 30 carburant) à 1,5 km à l’ouest · Caserne (caserne, nid de 16, lot : 36 munitions) à 2 km au sud.');
  // Décision de divulgation : sans repérage, nom, genre, direction et distance seulement — ni nid, ni lot, nulle part.
  const hidden=Card.describe({world:fake({}),remarkable:list.map(v=>({...v,sighted:false}))});
  assert.equal(hidden.lines.at(-1)[1],'Château d’eau (château d’eau) à 1,2 km à l’est · Gare (gare) à 1,5 km à l’ouest · Caserne (caserne) à 2 km au sud.');
  assert.ok(hidden.places.items.every(p=>p.sighted===false&&p.nest===0&&p.lot===''&&p.detail===''&&p.state===''));
  assert.equal(/nid|lot|médicaments|munitions|carburant/.test(hidden.share),false,hidden.share);
  assert.deepEqual(hidden.places.items.map(p=>[p.id,p.name,p.kind,p.distance,p.direction]),card.places.items.map(p=>[p.id,p.name,p.kind,p.distance,p.direction]));
  // Un seul lieu repéré : lui seul est détaillé.
  const one=Card.describe({world:fake({}),remarkable:list.map(v=>({...v,sighted:v.id==='P0002'}))});
  assert.equal(one.lines.at(-1)[1],'Château d’eau (château d’eau) à 1,2 km à l’est · Gare (gare, nid de 10, lot : 30 carburant) à 1,5 km à l’ouest · Caserne (caserne) à 2 km au sud.');
  // État réel d'un lieu repéré : nid vidé, lot entamé, lot emporté — jamais les valeurs d'origine une fois périmées.
  const lived=Card.describe({world:fake({}),remarkable:[
    {...list[1],state:'cleared'},{...list[3],state:'cleared',reward:{resource:'fuel',amount:30,left:11.5}},{...list[2],state:'rewarded',reward:{resource:'ammo',amount:36,left:0}}]});
  assert.equal(lived.lines.at(-1)[1],'Château d’eau (château d’eau, nid vidé, lot à charger : 24 médicaments) à 1,2 km à l’est · Gare (gare, nid vidé, reste du lot : 12 carburant) à 1,5 km à l’ouest · Caserne (caserne, nid vidé, lot emporté) à 2 km au sud.');
  assert.deepEqual(lived.places.items.map(p=>[p.state,p.nest,p.lot]),[['cleared',0,'24 médicaments'],['cleared',0,'12 carburant'],['rewarded',0,'']]);
  // L'aperçu ne détaille jamais, même si on lui passe des lieux marqués repérés.
  const peek=Card.describe({world:fake({}),remarkable:list,preview:true});
  assert.equal(peek.lines.at(-1)[1],hidden.lines.at(-1)[1]);assert.deepEqual(peek.places,hidden.places);
  // Le joueur se déplace : la liste rend d'autres distances, la fiche ne bouge pas.
  const moved=list.map(v=>({...v,distance:v.distance+777}));
  assert.deepEqual(Card.describe({world:fake({}),remarkable:moved}).places,card.places);
  // Sans coordonnées, la distance fournie sert de repli.
  assert.equal(Card.describe({world:fake({}),remarkable:[{id:'a',name:'Repère',distance:640}]}).places.items[0].distance,640);
  // `inputs` préfère la liste entière (coordonnées) au seul lieu le plus proche.
  const g={world:{seed:9,nodes:[]},frontier:{world:()=>fake({})},remarkable217:{list:()=>list,nearest:()=>list[0]}};
  assert.equal(Card.inputs(g).remarkable,list);
  // La sélection pure du module donne la même fiche que sa liste en campagne (mêmes lieux, mêmes nids, mêmes lots).
  const w=region(17117),picked=Remarkable.select(w),byPure=Card.describe({seed:17117,world:w,remarkable:picked});
  assert.equal(byPure.places.items.length,3);assert.ok(byPure.places.items.every(p=>p.kind&&p.name&&p.direction&&p.nest===0&&p.lot===''&&p.detail===''),'la sélection pure ne porte aucun repérage : rien n’est divulgué');
  assert.equal(/nid|lot :/.test(byPure.lines.at(-1)[1]),false);
  const expect=[...picked].sort((a,b)=>Math.hypot(a.x-w.home.x,a.y-w.home.y)-Math.hypot(b.x-w.home.x,b.y-w.home.y)).slice(0,3);
  assert.deepEqual(byPure.places.items.map(p=>p.id),expect.map(e=>e.id));assert.ok(byPure.places.items[0].distance>=C.Remarkable217Rules.homeClearance);
});

// Parties de la fiche que l'aperçu peut établir sans carte locale : tout, sauf les gisements à portée du centre.
const SHARED=['seed','generation','profile','home','biomes','milieu','water','density','sources','places','summary'];
const shared=card=>JSON.parse(JSON.stringify(Object.fromEntries(SHARED.map(key=>[key,card[key]]))));
const linesOf=card=>card.lines.filter(l=>l[0]!=='Ouverture');
// Lieux d'une fiche sans ce que seul le repérage en campagne révèle (nid, lot, état).
const undisclosed=places=>({...places,items:places.items.map(p=>({...p,sighted:false,state:'',nest:0,lot:'',detail:''}))});
const blind=inputs=>({...inputs,remarkable:inputs.remarkable?.map(v=>({...v,sighted:false}))});

test('fiche de graine : aperçu d’une graine avant le départ, sans campagne, sans sauvegarde, identique à la fiche réelle',async()=>{
  const {g,doc}=bootDocument134();
  require('../src/exploration-scales.js').install(g,doc);
  assert.equal(Card.install(g,doc),true);
  const Pack=globalThis.DeadwallWorldPack131,World=globalThis.DeadwallFrontierWorld;
  const button=doc.getElementById('seedCard217PreviewButton'),box=doc.getElementById('seedCard217Preview'),input=doc.getElementById('mapSeed');
  assert.ok(button&&box&&input);assert.equal(button.textContent,'Aperçu de la carte');assert.equal(box.hidden,true,'rien n’est calculé ni affiché sans clic');
  const siblings=[...doc.getElementById('seedHint').parentNode.children].map(n=>n.id);
  assert.ok(siblings.indexOf('seedCard217PreviewButton')>siblings.indexOf('seedHint')&&siblings.indexOf('seedCard217Preview')>siblings.indexOf('seedCard217PreviewButton'),'sous le champ de graine');
  // Compteur de régions tracées : l'aperçu doit en tracer une par graine, jamais deux.
  let created=0;const create=World.create;World.create=function(...args){created++;return create.apply(this,args);};
  try{
    const trace=()=>JSON.stringify({state:g.state,runId:g.runId||null,seed:g.world?.seed??null,ready:g.frontier.worldReady(),save:localStorage.getItem(C.SAVE_KEY),keys:localStorage.length,prepared:g.previewMapSeed135??null});
    const world=g.world,before=trace();
    // Champ vide ou graine invalide : un message, aucun calcul.
    input.value='';assert.equal(await g.seedCard217.preview(),null);assert.equal(box.hidden,false);assert.match(doc.getElementById('seedCard217PreviewTitle').textContent,/^Saisissez ou tirez une graine/);
    input.value='abc';assert.equal(await g.seedCard217.preview(),null);assert.match(doc.getElementById('seedCard217PreviewTitle').textContent,/entier entre 0 et 4294967295/);
    assert.equal(created,0);assert.equal(g.seedCard217.previewCount(),0);
    // Graine 17117 : état « calcul en cours », bouton verrouillé, un seul calcul même sur double clic.
    input.value='17117';
    const first=g.seedCard217.preview();
    assert.equal(g.seedCard217.previewBusy(),true);assert.equal(button.disabled,true);assert.match(doc.getElementById('seedCard217PreviewTitle').textContent,/^Calcul en cours… la région de la graine 17117/);
    assert.equal(g.seedCard217.preview(),first,'un second clic ne relance rien');
    const a=await first;
    assert.equal(created,1);assert.equal(g.seedCard217.previewBusy(),false);assert.equal(button.disabled,false);
    assert.equal(a.preview,true);assert.equal(a.seed,17117);assert.equal(a.title,'Aperçu · Graine 17117 · '+C.Landscape189Rules.presets[Card.startChoice(doc).landscape].name);
    assert.equal(doc.getElementById('seedCard217PreviewTitle').textContent,a.title);
    const facts=doc.getElementById('seedCard217PreviewFacts').children;assert.equal(facts.length,a.lines.length*2);assert.equal(facts[2].textContent,'Effet du milieu');
    assert.equal(doc.getElementById('seedCard217PreviewAdvice').textContent,a.advice);assert.match(doc.getElementById('seedCard217PreviewNote').textContent,/aucune campagne créée, aucune sauvegarde touchée/);
    // Ce qui exige la carte locale est dit, pas inventé.
    assert.equal(a.opening.known,false);assert.match(a.lines.find(l=>l[0]==='Ouverture')[1],/relevés au départ seulement/);
    assert.equal(a.milieu.active,true);assert.ok(a.milieu.family);assert.equal(a.places.source,'remarkable');assert.equal(a.places.items.length,3);
    // Divulgation : l'aperçu nomme et situe les lieux, sans nid ni lot, dans la fiche comme dans le texte affiché.
    assert.ok(a.places.items.every(p=>p.name&&p.kind&&p.direction&&p.distance>0&&p.sighted===false&&p.nest===0&&p.lot===''&&p.detail===''));
    assert.equal(/nid de|lot :|nid vidé/.test(a.share),false,a.share);assert.equal(/nid de|lot :/.test(box.textContent||[...facts].map(n=>n.textContent).join(' ')),false);
    assert.match(doc.getElementById('seedCard217PreviewNote').textContent,/Nids et lots des lieux remarquables se découvrent en campagne/);
    // Graine impraticable : l'aperçu ne prétend pas le savoir, il dit ce que fait le départ.
    assert.match(doc.getElementById('seedCard217PreviewNote').textContent,/une carte impraticable, cas rare, est remplacée au départ par une autre graine/);
    assert.equal(g.seedCard217.previewMode(),'direct','sans worker (Node) : calcul direct');
    // Cache par graine : le même objet, sans nouveau tracé.
    assert.equal(await g.seedCard217.preview(),a);assert.equal(created,1);
    // Deuxième graine : un autre aperçu.
    input.value='42';const b=await g.seedCard217.preview();
    assert.equal(created,2);assert.equal(b.seed,42);assert.notEqual(b.share,a.share);assert.notDeepEqual(b.places,a.places);assert.notDeepEqual(b.home,a.home);assert.notDeepEqual(b.density,a.density);
    assert.equal(doc.getElementById('seedCard217PreviewTitle').textContent,b.title);
    assert.equal(g.seedCard217.previewCount(),2);
    // Aucune trace : pas de campagne, pas de sauvegarde, monde de la partie en cours intact, région du jeu non tracée.
    assert.equal(trace(),before);assert.equal(g.world,world);assert.equal(g.state,'menu');
    // Départ réel de la graine 17117, avec les arguments du menu : la fiche du carnet reprend l'aperçu.
    const choice=Card.startChoice(doc);assert.equal(choice.current,true);
    g.startNew('standard','17117','classic',choice.landscape,choice.current);g.campaignIntro132?.skip?.();g.refreshMetrics(true);
    const p=g.frontier.position(),v=Pack.startVersions(C.Frontier.normalize(C.Frontier.initial()),undefined,choice.current,choice.landscape);
    assert.deepEqual([v.generation,v.detailVersion,v.ecologyVersion,v.hydrologyVersion,v.landscape189||'classic'],[p.generation,p.detailVersion,p.ecologyVersion,p.hydrologyVersion,p.landscape189||'classic'],'versions de l’aperçu = versions du départ');
    const real=g.seedCard217.card();
    assert.equal(real.preview,false);assert.equal(real.opening.known,true);
    // Identique au bit près, hors ce que seul le repérage révèle : la fiche réelle sans repérage EST l'aperçu.
    const unseen=Card.describe(blind(Card.inputs(g)));
    assert.deepEqual(shared(unseen),shared(a),'milieu, effets, eau, densité, lieux remarquables : identiques');
    assert.deepEqual(linesOf(unseen),linesOf(a));assert.equal(real.adviceLines[0],a.adviceLines[0]);assert.equal('Aperçu · '+real.title,a.title);
    assert.deepEqual(shared({...real,places:undisclosed(real.places)}),shared(a));
    for(const key of SHARED.filter(k=>k!=='places'))assert.deepEqual(JSON.parse(JSON.stringify(real[key])),JSON.parse(JSON.stringify(a[key])),key);
    // Carnet : nid et lot pour les seuls lieux repérés par la campagne, tels que le module les annonce.
    const live=new Map(g.remarkable217.list().map(v=>[v.id,v])),label=r=>C.RESOURCE_META[r].label.toLowerCase();
    // Au départ, rien n'est repéré : un lieu ne se repère qu'en sortie (src/remarkable217.js). Ni nid ni lot sur la fiche.
    assert.ok(real.places.items.every(p=>p.sighted===false&&p.nest===0&&p.lot===''&&p.detail===''),'au départ : aucun lieu repéré depuis la cité');
    g.remarkable217.tick();for(let i=0;i<12;i++)g.update(.05);g.refreshMetrics(true);
    assert.deepEqual(g.remarkable217.snapshot().sighted,[]);assert.deepEqual(Card.describe(Card.inputs(g)).places,real.places,'la cité ne repère rien en jouant');
    for(const item of real.places.items){
      const v=live.get(item.id);assert.equal(item.sighted,v.sighted);
      assert.equal(item.detail,v.sighted?'nid de '+v.nest+', lot : '+v.reward.amount+' '+label(v.reward.resource):'');
      assert.equal(real.lines.at(-1)[1].includes(item.name+' ('+item.kind+(item.detail?', '+item.detail:'')+')'),true);
    }
    assert.match(doc.getElementById('seedCard217Note')?.textContent||'',/s’affichent une fois le lieu repéré/);
    // Nid vidé puis lot chargé : la fiche suit l'état réel de la campagne, sans rien écrire dans la sauvegarde.
    const pristine=JSON.parse(JSON.stringify(g.serialize()));
    const target=real.places.items[0],site=live.get(target.id),moduleState=()=>JSON.stringify(g.remarkable217.snapshot());
    const withState=(taken)=>{
      const raw=JSON.parse(JSON.stringify(g.serialize())),m=raw.expansions127.modules.remarkable217;
      for(let i=0;i<site.nest;i++)raw.frontier.enemies[site.id+':e'+i]=0;raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
      m.sighted=[...new Set([...m.sighted,site.id])].sort();m.cleared=[site.id];m.taken=taken?{[site.id]:taken}:{};
      assert.notEqual(g.restoreSave(raw),false);g.refreshMetrics(true);return g.seedCard217.card();
    };
    const emptied=withState(0),at=card=>card.places.items.find(p=>p.id===site.id);
    assert.equal(at(emptied).detail,'nid vidé, lot à charger : '+site.reward.amount+' '+label(site.reward.resource));
    const started=withState(site.reward.amount/2);assert.equal(at(started).detail,'nid vidé, reste du lot : '+Math.ceil(site.reward.amount/2)+' '+label(site.reward.resource));
    const before217=moduleState(),gone=withState(site.reward.amount);
    assert.equal(at(gone).detail,'nid vidé, lot emporté');assert.equal(at(gone).state,'rewarded');assert.equal(/nid de \d+, lot : /.test(gone.lines.at(-1)[1].split(' · ').find(t=>t.startsWith(target.name))),false,'plus de valeurs d’origine');
    assert.notEqual(before217,moduleState());const frozen=moduleState();g.seedCard217.render();g.seedCard217.card();assert.equal(moduleState(),frozen,'la fiche lit l’état, elle ne l’écrit pas');
    assert.equal(Object.hasOwn(g.serialize(),'seedCard217'),false);assert.equal(JSON.stringify(g.serialize()).includes('seedCard217'),false,'aucun état sauvegardé');
    // Hors divulgation, rien d'autre n'a bougé : même fiche que l'aperçu.
    assert.deepEqual(shared({...gone,places:undisclosed(gone.places)}),shared(a));
    // Retour à la sauvegarde d'avant : la fiche retrouve le nid et le lot annoncés.
    assert.notEqual(g.restoreSave(pristine),false);g.refreshMetrics(true);assert.deepEqual(g.seedCard217.card(),real);
    assert.equal(real.milieu.family,g.biome217.profile().family,'famille figée de la campagne');
    // Le joueur s'éloigne : la liste du module change de distances, la fiche du carnet non.
    const far=g.remarkable217.list().map(e=>e.distance);g.player.x+=600;g.player.y+=400;
    assert.notDeepEqual(g.remarkable217.list().map(e=>e.distance),far);assert.deepEqual(Card.describe(Card.inputs(g)),real);
    // Ancienne campagne : même sauvegarde sans les deux règles, aucun effet de milieu affiché.
    const raw=JSON.parse(JSON.stringify(g.serialize()));delete raw.expansions127.modules.biome217;delete raw.expansions127.modules.remarkable217;
    assert.notEqual(g.restoreSave(raw),false);assert.equal(g.biome217.active(),false);
    const old=g.seedCard217.card();
    assert.equal(old.milieu.active,false);assert.equal(old.lines.some(l=>l[0]==='Effet du milieu'),false);assert.equal(old.advice.includes('%'),false);assert.equal(old.places.source,'towns');
    assert.deepEqual(old.biomes,real.biomes);
    // L'autre contenu de départ (région historique G8) suit le même chemin de versions.
    const legacy=Card.preview({seed:'17117',landscape:'classic',current:false});
    g.startNew('standard','17117','classic','classic',false);g.campaignIntro132?.skip?.();g.refreshMetrics(true);
    assert.equal(g.frontier.position().generation,8);assert.equal(legacy.generation,8);
    const old8=g.seedCard217.card();
    assert.deepEqual(shared({...old8,places:undisclosed(old8.places)}),shared(legacy));assert.deepEqual(shared(Card.describe(blind(Card.inputs(g)))),shared(legacy));
    // Contenu historique : l'aperçu part du registre régional neuf, comme le départ — mêmes versions, détail compris.
    const p8=g.frontier.position(),v8=Pack.startVersions(C.Frontier.normalize(C.Frontier.initial()),undefined,false,'classic');
    assert.deepEqual([v8.generation,v8.detailVersion,v8.ecologyVersion,v8.hydrologyVersion,v8.landscape189||'classic'],[p8.generation,p8.detailVersion,p8.ecologyVersion,p8.hydrologyVersion,p8.landscape189||'classic']);
  }finally{World.create=create;}
});

// ---- Troisième tranche : divulgation réduite, aperçu tracé hors du fil principal, graine impraticable annoncée. ----
const vm=require('node:vm');

test('fiche de graine : le script sert de Web Worker et rend la même fiche que le calcul direct',()=>{
  // Portée de worker simulée : ni `require`, ni `document`, ni jeu. `importScripts` charge les fichiers de `src/`.
  const sent=[],loaded=[],scope={postMessage:m=>sent.push(m)};scope.self=scope;
  const context=vm.createContext(scope);
  scope.importScripts=(...names)=>{for(const name of names){assert.match(name,/^[a-z0-9-]+\.js$/);loaded.push(name);vm.runInContext(fs.readFileSync(path.join(root,'src',name),'utf8'),context,{filename:name});}};
  vm.runInContext(fs.readFileSync(path.join(root,'src/seed-card217.js'),'utf8'),context,{filename:'seed-card217.js'});
  assert.equal(typeof scope.onmessage,'function','service installé dès le chargement dans un worker');assert.equal(loaded.length,0,'rien n’est chargé avant la première demande');
  scope.onmessage({data:{id:7,choice:{seedText:'42',landscape:'classic',current:false}}});
  assert.deepEqual(loaded,[...Card.WORKER_SCRIPTS]);assert.equal(sent.length,1);assert.equal(sent[0].id,7);assert.equal(sent[0].error,undefined,sent[0].error);
  // Même fiche, au bit près, que le calcul direct de la page.
  const had=globalThis.DeadwallGeography135;globalThis.DeadwallGeography135=require('../src/geography135.js');
  try{
    const direct=Card.preview({seedText:'42',landscape:'classic',current:false}),got=JSON.parse(JSON.stringify(sent[0].card));
    assert.equal(direct.generation,8);assert.deepEqual(got,JSON.parse(JSON.stringify(direct)));assert.equal(got.share,direct.share);
    assert.equal(/nid de|lot :/.test(got.share),false);
  }finally{if(had===undefined)delete globalThis.DeadwallGeography135;else globalThis.DeadwallGeography135=had;}
  // Seconde demande : scripts déjà chargés. Graine invalide : une erreur dite, pas une exception.
  scope.onmessage({data:{id:8,choice:{seedText:'abc',landscape:'classic',current:false}}});
  assert.equal(loaded.length,Card.WORKER_SCRIPTS.length);assert.equal(sent[1].id,8);assert.equal(sent[1].card,undefined);assert.match(sent[1].error,/entier entre 0 et 4294967295/);assert.equal(sent[1].unloaded,false);
  // Chargement impossible : erreur signalée comme telle, pour que la page reprenne le calcul.
  const lost=[],dead={importScripts(){throw Error('réseau');},postMessage:m=>lost.push(m)};
  assert.equal(Card.serve(dead),true);dead.onmessage({data:{id:3,choice:{seedText:'1'}}});assert.deepEqual(lost,[{id:3,error:'réseau',unloaded:true}]);
});

test('fiche de graine : les scripts du worker sont publics, en cache hors ligne et dans l’ordre de la page',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  let last=-1;
  for(const name of Card.WORKER_SCRIPTS){
    const at=html.indexOf('<script src="src/'+name+'"></script>');
    assert.ok(at>last,name+' : présent dans index.html, dans l’ordre');last=at;
    assert.ok(sw.includes('"src/'+name+'"'),name+' : en cache du service worker');
  }
  assert.ok(html.indexOf('<script src="src/seed-card217.js"></script>')>last,'la fiche est chargée après ses dépendances');
  assert.ok(Object.isFrozen(Card.WORKER_SCRIPTS)&&new Set(Card.WORKER_SCRIPTS).size===Card.WORKER_SCRIPTS.length);
  assert.match(fs.readFileSync(path.join(root,'vercel.json'),'utf8'),/worker-src 'self'/,'la politique du site autorise un worker de même origine');
  // L'application de bureau interdit les workers : le repli sur le fil principal y est le chemin normal.
  assert.match(fs.readFileSync(path.join(root,'desktop/policy.cjs'),'utf8'),/worker-src 'none'/);
});

test('fiche de graine : aperçu dans un worker quand il existe, repli direct sinon, abandon au départ',async()=>{
  const {g,doc}=bootDocument134();
  require('../src/exploration-scales.js').install(g,doc);
  // Worker factice : note ce qu'il reçoit, répond sur commande.
  const made=[];let mode='answer';
  const canned=seed=>JSON.parse(JSON.stringify(Card.describe({seed,world:fake({seed}),preview:true,remarkable:[{id:'P0001',name:'Gare',label:'gare',x:6500,y:5000,nest:12,sighted:true,reward:{resource:'fuel',amount:30}}]})));
  class FakeWorker{
    constructor(url){if(mode==='refuse')throw Error('worker-src none');this.url=url;this.posted=[];this.terminated=false;made.push(this);}
    postMessage(message){
      this.posted.push(message);
      if(mode==='answer')setTimeout(()=>this.onmessage({data:{id:message.id,card:canned(Number(message.choice.seedText))}}),5);
      if(mode==='crash')setTimeout(()=>this.onerror({preventDefault(){}}),5);
      if(mode==='unloaded')setTimeout(()=>this.onmessage({data:{id:message.id,error:'réseau',unloaded:true}}),5);
    }
    terminate(){this.terminated=true;}
  }
  assert.equal(Card.install(g,doc,{Worker:FakeWorker,url:'http://jeu.test/src/seed-card217.js'}),true);
  const World=globalThis.DeadwallFrontierWorld,create=World.create;let created=0;
  // Tracé direct remplacé par une région factice : ce test vérifie l'aiguillage, pas la génération.
  World.create=seed=>{created++;return fake({seed});};
  const input=doc.getElementById('mapSeed'),button=doc.getElementById('seedCard217PreviewButton'),title=()=>doc.getElementById('seedCard217PreviewTitle').textContent;
  try{
    assert.match(button.title,/quelques secondes de calcul, sans créer de campagne/,'le coût est annoncé avant le clic');
    // 1. Worker disponible : rien n'est tracé sur le fil principal, le menu reste utilisable.
    input.value='11';const first=g.seedCard217.preview();
    assert.match(title(),/^Calcul en cours… la région de la graine 11 est tracée, quelques secondes\. Le menu reste utilisable\.$/);
    assert.equal(g.seedCard217.previewBusy(),true);assert.equal(button.disabled,true);assert.equal(g.seedCard217.preview(),first);
    const a=await first;
    assert.equal(created,0,'aucun tracé sur le fil principal');assert.equal(g.seedCard217.previewMode(),'worker');
    assert.equal(made.length,1);assert.equal(made[0].url,'http://jeu.test/src/seed-card217.js');assert.equal(made[0].terminated,true,'un worker par aperçu, arrêté ensuite');
    assert.deepEqual(made[0].posted.map(m=>m.choice),[{seedText:'11',landscape:Card.startChoice(doc).landscape,current:true}],'seul le choix de départ part au worker');
    assert.equal(a.seed,11);assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.lines));assert.equal(title(),a.title);assert.equal(button.disabled,false);
    assert.equal(/nid|lot :/.test(a.share),false);
    assert.equal(await g.seedCard217.preview(),a,'gardé en cache : pas de second worker');assert.equal(made.length,1);
    // 2. Le worker plante : la page trace elle-même et prévient que le menu se fige.
    mode='crash';input.value='12';const second=g.seedCard217.preview();
    await new Promise(r=>setTimeout(r,20));
    assert.match(title(),/Le menu ne répond pas pendant ce calcul\.$/);
    const b=await second;assert.equal(b.seed,12);assert.equal(created,1);assert.equal(g.seedCard217.previewMode(),'direct');assert.equal(made.length,2);assert.equal(made[1].terminated,true);
    // 3. Après un échec de chargement, plus aucun worker n'est tenté.
    mode='answer';input.value='13';const c=await g.seedCard217.preview();assert.equal(c.seed,13);assert.equal(made.length,2);assert.equal(created,2);
  }finally{World.create=create;}
});

test('fiche de graine : worker refusé ou muet — repli, puis abandon propre quand une partie démarre',async()=>{
  const {g,doc}=bootDocument134();
  require('../src/exploration-scales.js').install(g,doc);
  const made=[];let mode='refuse';
  class FakeWorker{constructor(){if(mode==='refuse')throw Error('worker-src none');this.terminated=false;made.push(this);}postMessage(){}terminate(){this.terminated=true;}}
  assert.equal(Card.install(g,doc,{Worker:FakeWorker,url:'x'}),true);
  const World=globalThis.DeadwallFrontierWorld,create=World.create;let created=0;
  World.create=seed=>{created++;return fake({seed});};
  const input=doc.getElementById('mapSeed');
  try{
    // Politique de sécurité qui refuse le worker (application de bureau) : calcul direct, résultat normal.
    input.value='21';const a=await g.seedCard217.preview();
    assert.equal(a.seed,21);assert.equal(created,1);assert.equal(made.length,0);assert.equal(g.seedCard217.previewMode(),'direct');
  }finally{World.create=create;}
  // Autre installation, worker qui ne répond jamais : un départ abandonne l'aperçu sans rien tracer de plus.
  const second=bootDocument134();
  require('../src/exploration-scales.js').install(second.g,second.doc);
  mode='silent';assert.equal(Card.install(second.g,second.doc,{Worker:FakeWorker,url:'x'}),true);
  second.doc.getElementById('mapSeed').value='22';
  const pending=second.g.seedCard217.preview();assert.equal(second.g.seedCard217.previewBusy(),true);assert.equal(made.length,1);
  const before=JSON.stringify({state:second.g.state,seed:second.g.world?.seed??null,save:localStorage.getItem(C.SAVE_KEY)});
  await new Promise(r=>setTimeout(r,30));
  assert.equal(JSON.stringify({state:second.g.state,seed:second.g.world?.seed??null,save:localStorage.getItem(C.SAVE_KEY)}),before,'un aperçu en cours ne touche ni au jeu ni à la sauvegarde');
  second.g.startNew('standard','17117');second.g.campaignIntro132?.skip?.();
  assert.equal(await pending,null);assert.equal(made[0].terminated,true);assert.equal(second.g.seedCard217.previewBusy(),false);assert.equal(second.g.seedCard217.previewCount(),0);
  assert.equal(second.doc.getElementById('seedCard217PreviewButton').disabled,false);assert.equal(second.g.world.seed,17117);
});
