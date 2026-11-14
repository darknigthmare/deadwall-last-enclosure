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
  assert.ok(plain.advice.startsWith('Prairies ouvertes sans pierre à portée : la carrière la plus proche est à 2,4 km au nord ; ouvrez en bois.'),plain.advice);
  assert.equal(plain.biomes.text,'Prairies ouvertes (100 %) ; milieu unique à la ronde.');
  const noQuarry=Card.describe({world:fake(biome),nodes:[...ring('wood',16,400),...ring('scrap',8,600)]});
  assert.ok(noQuarry.advice.startsWith('Prairies ouvertes sans pierre à portée : la carrière sera loin ; ouvrez en bois.'),noQuarry.advice);
  const bare=Card.describe({world:fake({...biome,pois:[quarry,sawmill]}),nodes:[...ring('stone',9,300),...ring('scrap',9,300),node('wood',20,0)]});
  assert.ok(bare.advice.startsWith('Prairies ouvertes pauvre en bois à portée : la scierie la plus proche est à 1,2 km à l’est ; la pierre, elle, est sur place.'),bare.advice);
  const rich=Card.describe({world:fake(biome),nodes:[...ring('wood',9,300),...ring('stone',9,300),...ring('scrap',9,300)]});
  assert.ok(rich.advice.startsWith('Prairies ouvertes : bois, pierre et ferraille à portée de marche, l’ouverture est libre.'));
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
