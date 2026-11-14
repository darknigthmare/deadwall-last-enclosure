'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),P=require('../src/atlas-projection.js'),Scales=require('../src/exploration-scales.js'),Needs=require('../src/exploration-needs217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const root=path.join(__dirname,'..');
const need=key=>({id:'stock-'+key,kind:'reserve',label:key,detail:'',scale:Scales.RESOURCE_SCALE[key],resource:key});
const node=(id,type,amount,x,y)=>({id,type,amount,x,y,depleted:amount<=0});
const sector=(remaining,stock=0,status='held')=>({status,remaining,stock});
// Cité factice : seuls les registres lus par le module, avec les formes exactes des couches réelles.
function city(extra={}){
  const sectors=Object.fromEntries(C.TERRITORY_SECTORS.map(d=>[d.id,sector(d.reserve,0,'neutral')]));
  const halts=C.Expeditions.initial().sites;
  return{world:{seed:17117,nodes:[],cityGeometry202:0,sites:C.TERRITORY_SECTORS.map((d,i)=>({id:'site-'+(i+1),name:d.name,theme:d.id,x:600+i*500,y:700+i*450}))},
    core:()=>({x:2048,y:2048}),territories:{snapshot:()=>({sectors})},expeditions:{snapshot:()=>({sites:halts})},
    dayworks:{snapshot:()=>({sites:[]})},frontier:{position:()=>({active:false,generation:3}),discoveries:()=>[],takenAmount:()=>0},_sectors:sectors,_halts:halts,...extra};
}
const names=list=>list.map(p=>p.name);

test('lieux : vocabulaire unique, entrées prises dans la table des échelles',()=>{
  assert.deepEqual(Object.keys(Needs.TERMS),['gisement','vestige','cueillette','quartier','halte','site']);
  const entries=Scales.SCALES.flatMap(s=>s.entries.map(e=>s.id+'/'+e.kind+':'+e.id));
  for(const [kind,term]of Object.entries(Needs.TERMS)){
    assert.ok(term.label.length>3&&term.plural.length>3,kind);assert.ok(Object.isFrozen(term)&&Object.isFrozen(term.entry));
    assert.ok(entries.some(e=>e.endsWith('/'+term.entry.kind+':'+term.entry.id)),'contrôle d’origine connu des échelles : '+kind);
    assert.ok(['abords','secteurs','region'].includes(term.scale));
  }
  assert.deepEqual(Needs.SCALE_NAMES,Object.fromEntries(Scales.SCALES.map(s=>[s.id,s.name])),'mêmes noms d’échelle que la première tranche');
  assert.equal(new Set(Object.values(Needs.TERMS).map(t=>t.label)).size,6,'un mot par sorte de lieu');
  assert.equal(Needs.bearing(0,-5),'au nord');assert.equal(Needs.bearing(5,0),'à l’est');assert.equal(Needs.bearing(0,5),'au sud');assert.equal(Needs.bearing(-5,0),'à l’ouest');
  assert.equal(Needs.bearing(5,-5),'au nord-est');assert.equal(Needs.bearing(-5,5),'au sud-ouest');assert.equal(Needs.bearing(0,0),'');
  assert.equal(Needs.metres(37.4),'37 m');assert.equal(Needs.metres(1745),'1,7 km');assert.equal(Needs.metres(12040),'12,0 km');
});

test('besoin de bois : une destination qui a encore du bois, jamais une destination vidée',()=>{
  const g=city();g.world.nodes=[node(1,'wood',40,2048,1728),node(2,'wood',0,2060,2048),node(3,'stone',90,2100,2048)];
  g._halts.find(s=>s.id==='chantier').known=true;
  const [wood]=Needs.proposals(g,[need('wood')]);
  assert.equal(wood.need,'stock-wood');assert.equal(wood.none,null);
  // Les abords d'abord, puis les secteurs du plus proche au plus lointain.
  assert.deepEqual(wood.places.map(p=>p.id),['gisement:wood','halte:chantier','quartier:housing']);
  assert.deepEqual(wood.places.map(p=>p.scale),['abords','secteurs','secteurs']);
  assert.deepEqual(wood.places.map(p=>p.amount),[40,65,900]);assert.ok(wood.places[1].distance<wood.places[2].distance);
  assert.equal(wood.places[0].text,'Gisement · Les abords — encore 40 bois ; 1 point à récolter, le plus proche à 10 m au nord du centre de D-17.');
  assert.match(wood.places[2].text,/^Quartier · Les secteurs — encore 900 bois ; poste à établir, à \d+ m .+ du centre de D-17\.$/);
  assert.match(wood.places[1].text,/^Halte d’expédition · Les secteurs — encore 65 bois ; voiture requise, à \d+ m /);
  assert.deepEqual(wood.places.map(p=>p.entry),[{kind:'fieldView',id:'recon'},{kind:'control',id:'expOpen'},{kind:'fieldView',id:'territories'}]);
  for(const p of wood.places)assert.equal(p.button,'OUVRIR');
  // Chaque lieu se vide pour de bon : il sort des propositions, sans jamais revenir.
  g.world.nodes[0].amount=0;g.world.nodes[0].depleted=true;
  assert.deepEqual(Needs.proposals(g,[need('wood')])[0].places.map(p=>p.id),['halte:chantier','quartier:housing']);
  g._sectors.housing.remaining=0;g._sectors.housing.stock=.4;
  assert.deepEqual(Needs.proposals(g,[need('wood')])[0].places.map(p=>p.id),['halte:chantier'],'moins d’une unité : vidé');
  g._sectors.housing.stock=12;
  assert.match(Needs.proposals(g,[need('wood')])[0].places[1].text,/encore 12 bois ; poste à établir, 12 déjà trié au poste, à /);
  g._sectors.housing.stock=0;g._halts.find(s=>s.id==='chantier').stock.wood=0;
  const none=Needs.proposals(g,[need('wood')])[0];
  assert.deepEqual(none.places,[]);assert.equal(none.none,'Aucune source connue : explorer plus loin.');assert.equal(none.none,Needs.NONE);
  // Le carburant de retour de la même halte reste proposé pour un autre besoin : le stock se lit ressource par ressource.
  assert.deepEqual(Needs.sources(g).find(x=>x.id==='halte:chantier').remaining,{fuel:10});
  assert.equal(Needs.sources(g).some(s=>Object.values(s.remaining).some(v=>v<1)),false);
});

test('lieux : une halte non repérée, un vestige non relevé et un quartier voilé ne sont pas proposés',()=>{
  const g=city();
  assert.equal(Needs.proposals(g,[need('wood')])[0].places.some(p=>p.id==='halte:chantier'),false,'halte inconnue du bureau');
  g.dayworks={snapshot:()=>({sites:[{id:'housing-2',x:2048,y:2368,seen:false,survey:0,remaining:32},{id:'housing-1',x:2048,y:2368,seen:true,survey:6,remaining:0}]})};
  assert.equal(C.Dayworks.BY_ID['housing-2'].resource,'wood');
  assert.equal(Needs.sources(g).some(s=>s.kind==='vestige'),false,'ni vestige non vu, ni vestige vidé');
  g.dayworks={snapshot:()=>({sites:[{id:'housing-2',x:2048,y:2368,seen:true,survey:0,remaining:32}]})};
  const vestige=Needs.sources(g).find(s=>s.kind==='vestige');
  assert.deepEqual({name:vestige.name,remaining:vestige.remaining,scale:vestige.scale,cap:vestige.cap,distance:vestige.distance},{name:C.Dayworks.BY_ID['housing-2'].name,remaining:{wood:32},scale:'abords',cap:'au sud',distance:10});
  // Voile de l'âge : l'onglet des quartiers fermé retire les quartiers, pas le reste.
  const veiled=entry=>!(entry.kind==='fieldView'&&entry.id==='territories');
  const places=Needs.proposals(g,[need('wood'),need('ammo')],{offered:veiled});
  assert.deepEqual(places[0].places.map(p=>p.id),['vestige:housing-2']);
  assert.deepEqual(places[1].places,[]);assert.equal(places[1].none,Needs.NONE,'on ne laisse pas deviner un quartier voilé');
  assert.equal(Needs.proposals(g,[need('ammo')])[0].places[0].id,'quartier:checkpoint');
  // Au plus deux lieux par échelle, les plus proches d'abord, départagés par identifiant.
  for(const s of g._halts)s.known=true;
  const fuel=Needs.proposals(g,[need('fuel')])[0].places;
  assert.equal(fuel.length,2);assert.ok(fuel[0].distance<=fuel[1].distance);assert.ok(fuel.every(p=>p.scale==='secteurs'));
});

test('besoins sans lieu : l’enceinte ne propose rien, l’eau le dit franchement',()=>{
  const g=city(),out=Needs.proposals(g,[{id:'sites',kind:'sites',label:'x',detail:'',scale:null},{id:'water',kind:'water',label:'x',detail:'',scale:'abords'},{id:'housing',kind:'housing',label:'x',detail:'',scale:null}]);
  assert.deepEqual(out,[{need:'sites',places:[],none:null,hint:null},{need:'water',places:[],none:Needs.WATER,hint:null},{need:'housing',places:[],none:null,hint:null}]);
  assert.deepEqual(Needs.proposals(null,[need('wood')]),[]);assert.deepEqual(Needs.sources(null),[]);assert.deepEqual(Needs.landmarks(null),[]);
});

test('région : sites repérés lus dans le registre des prélèvements, sans jamais construire la carte',()=>{
  const g=city(),taken={};let plans=0;
  const home=P.home(g),poi=(id,name,dx,dy,items)=>({id,name,x:home.x+dx,y:home.y+dy,levels:[0],parking:items,outdoor:[]});
  const region={seed:17117,pois:[poi('P1','Scierie des Aulnes',0,-900,[{id:'P1:a',resource:'wood',amount:30},{id:'P1:b',resource:'wood',amount:12}]),poi('P2','Hangar du Gué',2400,0,[{id:'P2:a',resource:'wood',amount:50}]),poi('P3','Ferme jamais vue',10,10,[{id:'P3:a',resource:'wood',amount:99}])],
    plan:()=>{plans++;return{objects:[]};},towns:[]};
  g.frontier={position:()=>({active:false,generation:3}),discoveries:()=>['P1','P2','PX'],takenAmount:id=>taken[id]||0};
  for(const s of Object.values(g._sectors))s.remaining=0;
  // Carte non construite : rien n'est inventé, et le carnet dit ce qu'il ne peut pas relire.
  const blind=Needs.proposals(g,[need('wood')])[0];
  assert.deepEqual(blind.places,[]);assert.equal(blind.none,Needs.NONE);
  assert.equal(blind.hint,'3 sites régionaux repérés non relus ici : ouvrez la carte régionale pour lire leurs réserves.');
  assert.equal(Needs.proposals(g,[need('wood')],{offered:e=>e.id!=='recon'})[0].hint,null);
  const seen=Needs.proposals(g,[need('wood')],{regionWorld:region})[0];
  assert.deepEqual(seen.places.map(p=>[p.id,p.amount,p.scale]),[['site:P1',42,'region'],['site:P2',50,'region']],'le site non repéré reste inconnu');
  assert.equal(seen.places[0].text,'Site régional · La région — encore 42 bois, à 900 m au nord de D-17.');
  assert.equal(seen.places[1].text,'Site régional · La région — encore 50 bois, à 2,4 km à l’est de D-17.');
  assert.equal(seen.hint,null);
  taken['P1:a']=30;taken['P1:b']=11.6;
  assert.deepEqual(Needs.proposals(g,[need('wood')],{regionWorld:region})[0].places.map(p=>p.id),['site:P2'],'site fouillé : retiré');
  taken['P2:a']=20;assert.equal(Needs.proposals(g,[need('wood')],{regionWorld:region})[0].places[0].amount,30);
  assert.ok(plans>0&&plans<=2,'le contenu immuable d’un site n’est lu qu’une fois');
});

test('repères : cap et distance fixes des six quartiers et des douze haltes dans le repère régional',()=>{
  const g=city(),marks=Needs.landmarks(g),home=P.home(g);
  assert.equal(marks.length,18);assert.deepEqual(marks.slice(0,6).map(m=>m.id),C.TERRITORY_SECTORS.map(d=>'quartier:'+d.id));
  assert.deepEqual(marks.slice(6).map(m=>m.id),C.Expeditions.SITES.map(d=>'halte:'+d.id));
  for(const m of marks){
    assert.ok(m.x>=home.minX&&m.x<=home.maxX&&m.y>=home.minY&&m.y<=home.maxY,m.id+' dans le carré de D-17');
    assert.equal(m.distance,Math.hypot(m.x-home.x,m.y-home.y));assert.equal(m.town,null);
    assert.equal(m.text,m.term+' · à '+Needs.metres(m.distance)+(m.cap?' '+m.cap:'')+' du centre de D-17.');
  }
  // Même projection que l'atlas : aucune seconde carte.
  const station=marks.find(m=>m.id==='halte:station'),def=C.Expeditions.BY_ID.station;
  assert.deepEqual({x:station.x,y:station.y},P.toRegion(def.x,def.y,g));
  assert.deepEqual(marks.filter(m=>m.kind==='halte'&&m.known).map(m=>m.id),['halte:station','halte:roseraie','halte:relais'],'les haltes non repérées ne sont pas montrées');
  assert.ok(marks.filter(m=>m.kind==='quartier').every(m=>m.known));
  // Fixes : l'état de la partie ne déplace aucun repère.
  g._sectors.housing.status='lost';g._sectors.housing.remaining=0;g.core=()=>({x:900,y:900});g._halts[0].stock.fuel=0;
  assert.deepEqual(Needs.landmarks(g).map(m=>[m.id,m.x,m.y,m.distance,m.cap]),marks.map(m=>[m.id,m.x,m.y,m.distance,m.cap]));
  // Ville nommée la plus proche, dès que la carte régionale est connue.
  const towns=[{id:'t9',name:'Trop-Loin',kind:'ville',x:home.x+9000,y:home.y},{id:'t1',name:'Val-des-Ormes',kind:'bourg',x:home.x,y:home.y+1500}];
  const withTown=Needs.landmarks(g,{regionWorld:{seed:17117,towns}}).find(m=>m.id==='halte:station');
  assert.equal(withTown.town.name,'Val-des-Ormes');assert.equal(withTown.town.cap,'au sud');
  assert.match(withTown.text,/^Halte d’expédition · à \d+ m au nord du centre de D-17 · ville nommée la plus proche : Val-des-Ormes \(bourg\), à 1,5 km au sud\.$/);
  // Carte métrique : les deux haltes déplacées par la géométrie 2.02 suivent leur position réelle.
  const metric=city();metric.world.cityGeometry202=1;
  const moved=Needs.landmarks(metric).find(m=>m.id==='halte:clinique'),real=C.Expeditions.siteFor('clinique',{cityGeometry202:1});
  assert.deepEqual({x:moved.x,y:moved.y},P.toRegion(real.x,real.y,metric));
});

test('repères : le peintre de l’atlas ne dessine que les lieux connus, et rien à l’échelle de la région',()=>{
  const g=city(),marks=Needs.landmarks(g),calls=[];
  const ctx={save(){},restore(){},beginPath(){calls.push('path');},moveTo(){},lineTo(){},closePath(){},rect(){calls.push('rect');},fill(){},stroke(){},fillText(text){calls.push('text:'+text);},strokeText(){}};
  const cam=scale=>({scale,width:800,height:600,screen:(x,y)=>({x:(x-P.home(g).x)*scale+400,y:(y-P.home(g).y)*scale+300})});
  assert.equal(Needs.drawLandmarks(ctx,cam(.05),marks),0,'vue régionale : les repères tiendraient dans un point');assert.equal(calls.length,0);
  assert.equal(Needs.drawLandmarks(ctx,cam(2),marks),9);
  assert.equal(calls.filter(c=>c==='rect').length,3);assert.equal(calls.filter(c=>c.startsWith('text:')).length,0);
  calls.length=0;assert.equal(Needs.drawLandmarks(ctx,cam(4),marks),9);
  assert.deepEqual(calls.filter(c=>c.startsWith('text:')).map(c=>c.slice(5)),marks.filter(m=>m.known).map(m=>m.name));
  assert.equal(Needs.drawLandmarks(ctx,cam(60),marks)<9,true,'hors cadre : non dessiné');
  assert.equal(Needs.drawLandmarks(null,cam(4),marks),0);assert.equal(Needs.drawLandmarks(ctx,null,marks),0);
});

test('lieux : même état, mêmes propositions ; aucun effet sur le monde ni la sauvegarde',()=>{
  const {g,doc}=bootDocument134();
  const world=globalThis.DeadwallFrontierWorld,create=world.create;let built=0;world.create=(...args)=>{built++;return create(...args);};
  try{
    g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.refreshMetrics(true);
    built=0;// le registre du monde 1.31 construit sa référence au démarrage : ce n'est pas ce module.
    Scales.install(g,doc);Needs.install(g,doc);assert.equal(Needs.install(g,doc),false);
    g.resources.wood=0;g.resources.fuel=0;g.resources.ammo=0;
    const state=()=>JSON.stringify({...g.serialize(),timestamp:0}),saved=state(),stock=JSON.stringify(g.resources);
    const nodes=JSON.stringify(g.world.nodes.map(n=>[n.id,n.amount,n.depleted])),sites=JSON.stringify(g.world.sites);
    const needs=Scales.cityNeeds(g),first=Needs.proposals(g,needs),marks=Needs.landmarks(g),sources=Needs.sources(g);
    for(let i=0;i<4;i++){assert.deepEqual(Needs.proposals(g,needs),first);assert.deepEqual(Needs.landmarks(g),marks);assert.deepEqual(Needs.sources(g),sources);}
    assert.ok(Object.isFrozen(first)&&Object.isFrozen(marks)&&Object.isFrozen(sources));
    assert.equal(built,0,'lire les lieux ne génère pas le monde régional');
    // Le carnet ouvert : la carte régionale d'origine peut construire son monde, pas ce module.
    g.explorationScales.render();g.explorationNeeds217.render();assert.equal(built,0);
    assert.equal(state(),saved,'aucune modification de la campagne');assert.equal(JSON.stringify(g.resources),stock);
    assert.equal(JSON.stringify(g.world.nodes.map(n=>[n.id,n.amount,n.depleted])),nodes);assert.equal(JSON.stringify(g.world.sites),sites);
    assert.equal(Object.hasOwn(g.serialize(),'explorationNeeds217'),false);
    assert.equal([...g.expansions.entries()].some(d=>d.id==='explorationNeeds217'),false,'aucune fiche, aucun registre sauvegardé');
    // Le bois vient réellement des gisements de la carte de cette graine.
    const wood=first.find(p=>p.need==='stock-wood');assert.ok(wood);
    const live=g.world.nodes.filter(n=>n.type==='wood'&&!n.depleted);
    assert.equal(wood.places[0].id,'gisement:wood');assert.equal(wood.places[0].amount,Math.floor(live.reduce((sum,n)=>sum+n.amount,0)));
    // Les six quartiers de la graine gardent leur place après sauvegarde et reprise.
    const raw=JSON.parse(JSON.stringify(g.serialize()));
    assert.equal(g.restoreSave(raw),true);
    assert.deepEqual(Needs.landmarks(g).map(m=>[m.id,m.x,m.y]),marks.map(m=>[m.id,m.x,m.y]));
    assert.deepEqual(Needs.proposals(g,Scales.cityNeeds(g)),first,'même état repris, mêmes propositions');
    assert.equal(built,0,'le monde régional n’est jamais généré par ce module');
  }finally{world.create=create;}
});

test('carnet : chaque besoin affiche ses lieux, un quartier voilé par l’âge n’y figure pas, le bouton ouvre l’onglet d’origine',()=>{
  const {g,doc}=bootDocument134({search:'?agereveal=1'});
  require('../src/age-reveal.js').install(g,doc);Scales.install(g,doc);Needs.install(g,doc);
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.refreshMetrics(true);g.updateUI();
  const nav=doc.getElementById('commandPanel-field').querySelector('.field-nav'),tab=view=>nav.children.find(n=>n.dataset.fieldView===view);
  g.resources.wood=0;g.resources.ammo=0;g.resources.fuel=0;g.showCommand(true,'field');
  const line=id=>doc.getElementById('explorationScalesNeeds').children.find(n=>n.dataset.need===id);
  const rows=id=>line(id).children[3]?.children||[];
  assert.equal(tab('territories').getAttribute('data-age-veiled'),'true');
  assert.equal(line('stock-wood').children[2].textContent,'→ Les abords','la première tranche reste en place');
  assert.deepEqual(rows('stock-wood').map(r=>r.dataset.place),['gisement:wood'],'le quartier du bois reste voilé');
  assert.equal(rows('stock-wood')[0].children[0].textContent,'Autour de D-17');
  assert.match(rows('stock-wood')[0].children[1].textContent,/^Gisement · Les abords — encore \d+ bois ; \d+ points à récolter, le plus proche à \d+ m /);
  // Munitions : seul le quartier du barrage en détient, et il est voilé → on le dit franchement, sans le nommer.
  assert.equal(rows('stock-ammo').length,1);assert.equal(rows('stock-ammo')[0].className,'exploration-need-nowhere');
  assert.equal(rows('stock-ammo')[0].textContent,'Aucune source connue : explorer plus loin.');
  assert.equal(line('stock-ammo').textContent?.includes('dernier feu')??false,false);
  // Carburant : gisement des abords et haltes repérées, à leurs deux échelles.
  assert.deepEqual(rows('stock-fuel').map(r=>r.dataset.place.split(':')[0]),['gisement','halte','halte']);
  // Le bouton délègue au contrôle d'origine : on compte les clics de l'onglet.
  let clicks=0;tab('recon').addEventListener('click',()=>clicks++);
  rows('stock-wood')[0].children[2].click();assert.equal(clicks,1);
  assert.equal(doc.getElementById('reconPanel').classList.contains('hidden'),false);
  // L'âge venu, le quartier reparaît avec ce qu'il lui reste.
  g.tier=C.CITY_TIERS[C.CITY_TIERS.length-1];g.updateUI();g.explorationScales.render();
  assert.deepEqual(rows('stock-wood').map(r=>r.dataset.place),['gisement:wood','quartier:housing']);
  assert.equal(rows('stock-ammo')[0].dataset.place,'quartier:checkpoint');
  assert.match(rows('stock-ammo')[0].children[1].textContent,/^Quartier · Les secteurs — encore 680 munitions ; poste à établir, à \d+ m /);
  let quarters=0;tab('territories').addEventListener('click',()=>quarters++);
  rows('stock-ammo')[0].children[2].click();assert.equal(quarters,1);
});

test('carte régionale : la liste des repères se pose sous l’atlas et ne fait que cadrer la vue',async()=>{
  const e=bootDocument134();await new Promise(r=>setTimeout(r,0));const {g,doc}=e;
  assert.ok(g.explorationNeeds217,'monté par la page');
  g.startNew('standard','17117','classic','balanced',false);g.campaignIntro132.skip();g.refreshMetrics(true);g.updateUI();g.explorationNeeds217.render();
  const box=doc.getElementById('explorationLandmarks217'),list=doc.getElementById('explorationLandmarksList217');
  assert.ok(box&&list);assert.equal(box.tagName,'DETAILS');assert.equal(box.hidden,false);
  const marks=g.explorationNeeds217.landmarks().filter(m=>m.known);
  assert.equal(marks.length,9);assert.deepEqual(list.children.map(n=>n.dataset.landmark),marks.map(m=>m.id));
  assert.equal(list.children[0].children[0].textContent,C.TERRITORY_SECTORS[0].name);assert.equal(list.children[0].children[1].textContent,marks[0].text);
  // Les positions sont celles des sites de la graine, par la projection de l'atlas.
  const site=g.world.sites.find(s=>s.theme==='housing');assert.deepEqual({x:marks[0].x,y:marks[0].y},P.toRegion(site.x,site.y,g));
  const state=()=>JSON.stringify({...g.serialize(),timestamp:0});
  g.showCommand(true,'field');doc.getElementById('explorationScale-fieldView-recon').click();
  assert.equal(doc.getElementById('reconPanel').classList.contains('hidden'),false);
  const canvas=doc.getElementById('frontierMap'),had=canvas.atlas,seen=[];
  const saved=state();canvas.atlas={focusPoint:(x,y,span)=>seen.push([x,y,span])};
  try{list.children[0].children[2].click();}finally{canvas.atlas=had;}
  assert.deepEqual(seen,[[marks[0].x,marks[0].y,60]]);assert.equal(state(),saved,'cadrer la carte ne modifie pas la campagne');
});

test('module : présentation seule, chargé après les échelles, sans règle ni hasard',()=>{
  const source=fs.readFileSync(path.join(root,'src/exploration-needs217.js'),'utf8');
  for(const forbidden of ['Math.random','localStorage','sessionStorage','spend(','.save(','serialize','restoreSave(','.random.','expansions.register','revealSites','W.create','.create(','.pin(','.annotate('])assert.equal(source.includes(forbidden),false,forbidden);
  assert.equal(/(resources|stock|carry|remaining|amount|taken)\s*(\[[^\]]*\]|\.\w+)\s*(=(?!=)|\+=|-=|\+\+|--)/.test(source),false,'aucune écriture de stock');
  assert.equal(C.ExplorationNeeds217Rules,undefined,'aucune valeur d’équilibrage');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const scales=html.indexOf('<script src="src/exploration-scales.js"></script>'),atlas=html.indexOf('<script src="src/atlas-render.js"></script>'),own=html.indexOf('<script src="src/exploration-needs217.js"></script>');
  assert.ok(scales>0&&atlas>0&&own>scales&&own>atlas,'après la table des échelles et le rendu de l’atlas');
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('"src/exploration-needs217.js"'));
  assert.ok(fs.readFileSync(path.join(root,'styles.css'),'utf8').includes('.exploration-need-places'));
});
