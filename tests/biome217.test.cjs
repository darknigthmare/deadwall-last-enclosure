'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),B=require('../src/biome217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const root=path.join(__dirname,'..'),R=C.Biome217Rules,F=R.families,IDS=Object.keys(F),T=b=>globalThis.DeadwallTactics.footprint(b);
const near=(a,b,message,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,(message||'')+' : '+a+' ≠ '+b);
const EFFECTS=['wood','stone','scrap','farm','rain'];
// Familles attendues pour les graines de référence (monde par défaut d'une campagne neuve).
const FOREST='17117',HIGHLAND='1';
const fake=(pick,home={x:5000,y:5000})=>({home,biomeAt:(x,y)=>{const id=pick(x-home.x,y-home.y);return id?{id}:null;}});

test('milieu 217 : règles gelées, cinq familles, exactement un avantage et une contrainte chacune',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(F));assert.deepEqual(IDS,['forest','farmland','wetland','highland','brownfield']);
  assert.equal(R.radius,768);assert.equal(R.step,128);assert.equal(R.radius%R.step,0);
  for(const id of IDS){
    const d=F[id];assert.ok(Object.isFrozen(d)&&Object.isFrozen(d.biomes)&&Object.isFrozen(d.bonus)&&Object.isFrozen(d.malus),id);
    assert.deepEqual(Object.keys(d).sort(),['biomes','bonus','malus','name'],id+' : un avantage, une contrainte, rien d’autre');
    assert.ok(EFFECTS.includes(d.bonus.key)&&EFFECTS.includes(d.malus.key)&&d.bonus.key!==d.malus.key,id);
    assert.ok(d.bonus.factor>=1.1&&d.bonus.factor<=1.2,id+' : avantage modeste');assert.ok(d.malus.factor>=.8&&d.malus.factor<=.9,id+' : contrainte modeste');
    // Hors de ses deux effets, une famille ne change rien.
    for(const key of [...EFFECTS,'food','fuel','medicine','ammo','autre'])assert.equal(B.factorOf(id,key),key===d.bonus.key?d.bonus.factor:key===d.malus.key?d.malus.factor:1,id+'/'+key);
    const p=B.describe(id);assert.deepEqual(Object.keys(p),['family','name','bonus','malus']);assert.equal(p.family,id);assert.equal(p.name,d.name);
    assert.match(p.bonus.text,/ \+\d+ %$/);assert.match(p.malus.text,/ −\d+ %$/);
  }
  assert.deepEqual(IDS.map(id=>[F[id].bonus.key,F[id].bonus.factor,F[id].malus.key,F[id].malus.factor]),
    [['wood',1.15,'farm',.9],['farm',1.15,'stone',.85],['rain',1.2,'scrap',.85],['stone',1.2,'rain',.85],['scrap',1.2,'wood',.85]]);
  assert.deepEqual(new Set(IDS.map(id=>F[id].bonus.key)).size,5,'cinq avantages distincts');
  for(const key of EFFECTS)assert.equal(B.factorOf('neutral',key),1);assert.equal(B.factorOf(null,'wood'),1);assert.equal(B.factorOf('toString','wood'),1);
  assert.deepEqual({...B.describe(null)},{family:null,name:'Sans effet',bonus:null,malus:null});
});

test('milieu 217 : les seize milieux du monde appartiennent chacun à une seule famille',()=>{
  const W=require('../src/frontier-world.js'),w=W.create(17117,8,{ecologyVersion:1,hydrologyVersion:1}),ids=w.biomes.defs.map(d=>d.id);
  assert.equal(ids.length,16);const listed=IDS.flatMap(id=>F[id].biomes);
  assert.equal(listed.length,16);assert.deepEqual([...listed].sort(),[...ids].sort());
  for(const id of ids)assert.ok(IDS.includes(B.familyOf(id)),id);assert.equal(B.familyOf('inconnu'),null);assert.equal(B.familyOf(undefined),null);
});

test('milieu 217 : relevé pur autour de D-17, majorité, égalité tranchée par l’ordre de la table',()=>{
  const side=2*R.radius/R.step+1,total=side*side;
  assert.deepEqual(B.survey(fake(()=>'conifer')),{counts:{forest:total,farmland:0,wetland:0,highland:0,brownfield:0},total});
  assert.equal(B.dominant(fake(()=>'conifer')),'forest');assert.equal(B.dominant(fake(()=>'brownfield')),'brownfield');
  assert.equal(B.dominant(fake(dx=>dx<0?'meadow':'limestone')),'highland','la moitié est, colonne centrale comprise, l’emporte');
  assert.equal(B.dominant(fake(dx=>dx<=0?'meadow':'limestone')),'farmland');
  // Le relevé ne sort pas du carré annoncé et ne lit que des points de grille.
  const seen=[];B.survey(fake((dx,dy)=>{seen.push([dx,dy]);return'heath';}));
  assert.equal(seen.length,total);assert.ok(seen.every(([dx,dy])=>Math.abs(dx)<=R.radius&&Math.abs(dy)<=R.radius&&dx%R.step===0&&dy%R.step===0));
  // Égalité stricte : deux points chacun, la première famille de la table gagne.
  const tie=fake((dx,dy)=>dy===0&&dx===0?'heath':dy===0&&dx===R.step?'heath':dy===R.step&&dx===0?'conifer':dy===R.step&&dx===R.step?'mixed':null);
  assert.deepEqual(B.survey(tie).counts,{forest:2,farmland:0,wetland:0,highland:2,brownfield:0});assert.equal(B.dominant(tie),'forest');
  // Milieux inconnus ou monde sans milieux : aucun profil inventé.
  for(const w of [null,undefined,{},{home:{x:1,y:1}},fake(()=>null),fake(()=>'inconnu'),{home:{x:NaN,y:0},biomeAt:()=>({id:'heath'})}]){assert.equal(B.survey(w),null);assert.equal(B.dominant(w),null);assert.equal(B.profileFor(w).family,null);}
  assert.equal(B.profileFor(fake(()=>'peatland')).family,'wetland');
  // Pur : même monde, même réponse, et le monde n'est pas modifié.
  const w=Object.freeze(fake((dx,dy)=>(dx+dy)%256===0?'orchard':'wetland'));assert.deepEqual(B.survey(w),B.survey(w));
});

test('milieu 217 : état sauvegardé strict',()=>{
  assert.deepEqual(B.validate(undefined),{version:1,active:false,family:null,announced:false});assert.deepEqual(B.initial(),B.validate(undefined));
  assert.deepEqual(B.fresh(),{version:1,active:true,family:null,announced:false});
  for(const family of [null,'neutral',...IDS])assert.deepEqual(B.validate({version:1,active:true,family,announced:family!==null}),{version:1,active:true,family,announced:family!==null});
  assert.deepEqual(B.validate({version:1,active:true,family:'forest',announced:false}),{version:1,active:true,family:'forest',announced:false});
  for(const bad of [null,[],'217',{},{version:1},{version:2,active:true,family:null,announced:false},{version:1,active:1,family:null,announced:false},
    {version:1,active:true,family:'jungle',announced:false},{version:1,active:true,family:'toString',announced:false},{version:1,active:true,family:1,announced:false},
    {version:1,active:true,family:null,announced:true},{version:1,active:true,family:null,announced:0},{version:1,active:false,family:'forest',announced:false},
    {version:1,active:false,family:null,announced:true},{version:1,active:true,family:null,announced:false,extra:1},{version:1,active:true,family:null}])
    assert.throws(()=>B.validate(bad),/Milieu de cité 217 invalide/);
});

test('milieu 217 : pluie des citernes et bilan de production, facteurs facultatifs du cœur',()=>{
  const S=C.Siege,K=C.SIEGE_RULES,base=S.waterFlow(0,{powered:false,weather:.5,fuel:0},.25);
  assert.deepEqual(S.waterFlow(0,{powered:false,weather:.5,fuel:0,rainFactor:1},.25),base,'facteur 1 : rien ne change');
  near(S.waterFlow(0,{powered:false,weather:.5,fuel:0,rainFactor:1.2},.25).rain,base.rain*1.2);near(S.waterFlow(0,{powered:false,weather:.5,fuel:0,rainFactor:.85},.25).rain,base.rain*.85);
  for(const bad of [NaN,-1,Infinity,'2',null,99])assert.deepEqual(S.waterFlow(0,{powered:false,weather:.5,fuel:0,rainFactor:bad},.25),base,'facteur invalide : ignoré');
  // Une citerne presque pleine ne déborde pas, avec ou sans avantage ; la pompe ne prend que la place restante.
  assert.equal(S.waterFlow(K.waterCapacity-.001,{powered:false,weather:1,fuel:0,rainFactor:1.2},.25).rain<=.001+1e-12,true);
  const pumped=S.waterFlow(K.waterCapacity-.5,{powered:true,weather:1,fuel:100,rainFactor:1.2},.25);assert.ok(pumped.rain+pumped.pumped<=.5+1e-12);
  const farm={completed:true,type:'farm',def:C.BUILDINGS.farm},lumber={completed:true,type:'lumber',def:C.BUILDINGS.lumber};
  const ctx=extra=>({resources:{wood:0,scrap:0,stone:0,food:0,fuel:0,ammo:0,medicine:0},storage:1000,population:0,buildings:[farm,lumber],hasResearch:()=>false,...extra});
  const O=globalThis.DeadwallOperations,plain=O.logistics(ctx()),row=(report,key)=>report.rows.find(r=>r.key===key).production;
  near(row(plain,'food'),C.BUILDINGS.farm.production.food*60);
  const scaled=O.logistics(ctx({yieldFactor:(b,key)=>b.type==='farm'&&key==='food'?.9:1}));
  near(row(scaled,'food'),row(plain,'food')*.9);assert.equal(row(scaled,'wood'),row(plain,'wood'));
});

function boot(){const {g}=bootDocument134(),notes=[],notify=g.notify.bind(g);g.notify=(message,kind)=>{notes.push(String(message));return notify(message,kind);};return{g,notes};}
function start(g,seed){assert.notEqual(g.startNew('standard',seed),false);g.campaignIntro132?.skip?.();return g;}
const state=g=>g.serialize().expansions127.modules.biome217,mine=notes=>notes.filter(m=>m.startsWith('Milieu de la cité'));
function old(g){const data=JSON.parse(JSON.stringify(g.serialize()));delete data.expansions127.modules.biome217;assert.equal(g.restoreSave(data),true);return g;}
// Cadence réelle d'un ouvrier sur un gisement : premier prélèvement d'un pas de 0,1 s, rapporté à la cadence de base.
function workerRate(g,type){
  const u=g.units.find(u=>u.kind==='worker'&&!u.dead),node=g.world.nodes.filter(n=>n.type===type&&!n.depleted&&n.amount>20).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
  g.workerOrder='hold';u.carry=0;u.carryType=type;u.state='gather';u.targetNode=node.id;
  for(let i=0;i<900;i++){const carry=u.carry,left=node.amount;g.update(.1);if(u.carry>carry){assert.ok(left-node.amount>=u.carry-carry-1e-9,'rien n’est porté qui ne sorte du gisement (un autre ouvrier peut y travailler aussi)');return(u.carry-carry)/(.1*3.4*g.difficulty.resourceYield);}}
  assert.fail('ouvrier jamais arrivé au gisement de '+type);
}
// Cadence réelle du Commandant, par le point de calcul du moteur (ACTION maintenue près d'un gisement).
function handRate(g,type){
  const p=g.player,node=g.world.nodes.filter(n=>n.type===type&&!n.depleted&&n.amount>20).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
  const at={x:p.x,y:p.y};
  // Poste de travail : le premier point dégagé autour du gisement, comme le ferait le joueur.
  search:for(const reach of [24,30,36,44])for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){p.x=node.x+dx*(node.radius+reach);p.y=node.y+dy*(node.radius+reach);if(g.workerCanWorkAt(p,node,62))break search;}
  for(const key of Object.keys(p.carry))p.carry[key]=0;
  g.input.keys.add('KeyE');const gathered=g.stats.gathered;
  try{g.updateInteraction(.1);}finally{g.input.keys.delete('KeyE');p.x=at.x;p.y=at.y;}
  const got=Object.entries(p.carry).find(([,n])=>n>0);assert.ok(got,'le Commandant a récolté');near(g.stats.gathered-gathered,got[1]);
  for(const key of Object.keys(p.carry))p.carry[key]=0;
  return{type:got[0],rate:got[1]/(.1*10*g.difficulty.resourceYield*(g.arsenal134?.toolFactor(got[0])??1))};
}
function building(g,type,dx){const core=g.core(),Building=core.constructor,b=new Building(g.nextId++,type,T(core).x+dx,T(core).y,0,1);b.health=b.def.health;g.world.add(b);g.refreshMetrics(true);return b;}
// Nourriture réellement produite par une ferme protégée en une seconde, rapportée à son débit nominal.
function farmRate(g){
  const farm=[...g.world.buildings.values()].find(b=>b.type==='farm')||building(g,'farm',8);assert.equal(farm.completed,true);
  g.resources.food=100;const before=g.resources.food;g.economyTick(1);
  return(g.resources.food-before+g.population*.0065)/C.BUILDINGS.farm.production.food;
}
// Pluie réellement recueillie par une citerne sans pompe, rapportée au débit de pluie du moteur.
function rainRate(g){
  const tank=[...g.world.buildings.values()].find(b=>b.type==='fireCistern')||building(g,'fireCistern',-8);g.resources.fuel=0;g.weather=.5;g.weatherTarget=.5;
  const water=()=>g.siege.cityReserve215().water,before=water();g.update(.1);
  assert.ok(tank.completed&&g.weather>0);return(water()-before)/(C.SIEGE_RULES.rainRate*g.weather*.1);
}
function rates(g){
  // Le calme est prolongé : une horde arrêterait la ferme et disperserait les ouvriers pendant la mesure.
  assert.equal(g.phase,'calm');g.phaseTime=1e6;
  const farm=farmRate(g),rain=rainRate(g),hand=handRate(g,'wood');
  return{farm,rain,hand,wood:workerRate(g,'wood'),stone:workerRate(g,'stone'),scrap:workerRate(g,'scrap'),food:workerRate(g,'food')};
}

test('milieu 217 : deux graines, deux familles, des rendements différents dans le sens annoncé ; ancienne campagne inchangée',()=>{
  const {g,notes}=boot();
  // Forêt : le bois se récolte plus vite, les fermes rendent moins ; le reste ne bouge pas.
  start(g,FOREST);assert.deepEqual(state(g),B.fresh(),'famille pas encore relevée à la création');
  assert.equal(g.biome217.active(),true);assert.equal(g.biome217.factor('wood'),1.15,'le premier usage relève le milieu');
  assert.deepEqual(state(g),{version:1,active:true,family:'forest',announced:false});
  assert.equal(B.dominant(g.frontier.world()),'forest');assert.deepEqual(g.biome217.profile(),B.profileFor(g.frontier.world()));
  assert.deepEqual(Object.keys(g.biome217.profile()),['family','name','bonus','malus']);assert.equal(g.biome217.profile().name,'Forêt');
  const forest=rates(g);
  near(forest.wood,1.15,'bois, forêt',1e-6);near(forest.stone,1,'pierre, forêt',1e-6);near(forest.scrap,1,'ferraille, forêt',1e-6);near(forest.food,1,'vivres ramassés, forêt',1e-6);
  near(forest.farm,.9,'ferme, forêt',1e-6);near(forest.rain,1,'pluie, forêt',1e-6);near(forest.hand.rate,g.biome217.factor(forest.hand.type),'récolte à la main, forêt',1e-6);
  assert.equal(mine(notes).length,1,'une seule annonce');
  assert.equal(mine(notes)[0],'Milieu de la cité : Forêt. Avantage : récolte du bois +15 %. Contrainte : nourriture des fermes protégées −10 %.');
  for(let i=0;i<50;i++)g.update(.1);assert.equal(mine(notes).length,1,'jamais rejouée');
  // Fiche : famille, avantage et contrainte chiffrés.
  const view=g.biome217.overview(),value=label=>view.rows.find(r=>r.label===label).value;
  assert.equal(value('Milieu'),'Forêt');assert.equal(value('Avantage'),'Récolte du bois +15 % (×1,15)');assert.equal(value('Contrainte'),'Nourriture des fermes protégées −10 % (×0,9)');
  assert.match(value('Autres milieux'),/Hauteurs pierreuses : récolte de la pierre \+20 %, pluie recueillie par les citernes −15 %/);
  assert.deepEqual(g.biome217.actions(),[]);assert.equal(g.expansions.get('biome217').title,'Milieu de la cité');
  // Seule la ferme protégée est concernée : une serre garde son débit.
  assert.equal(g.biome217.yieldFactor({type:'farm'},'food'),.9);assert.equal(g.biome217.yieldFactor({type:'dayGreenhouse'},'food'),1);assert.equal(g.biome217.yieldFactor({type:'farm'},'wood'),1);assert.equal(g.biome217.yieldFactor(null,'food'),1);
  // La même campagne privée de la règle (ancienne sauvegarde) : tout revient à 1, sans annonce.
  const before=mine(notes).length;old(g);
  assert.deepEqual(state(g),B.initial());assert.equal(g.biome217.active(),false);assert.equal(g.biome217.profile().family,null);
  const legacy=rates(g);
  for(const key of ['wood','stone','scrap','food','farm','rain'])near(legacy[key],1,key+', ancienne campagne',1e-6);near(legacy.hand.rate,1,'main, ancienne campagne',1e-6);
  for(const key of EFFECTS)assert.equal(g.biome217.factor(key),1);
  for(let i=0;i<30;i++)g.update(.1);assert.deepEqual(state(g),B.initial(),'jamais activée en cours de campagne');assert.equal(mine(notes).length,before);
  assert.match(g.biome217.overview().summary,/commencé avant cette règle/);assert.equal(g.biome217.overview().rows[0].value,'Sans effet');
  const again=JSON.parse(JSON.stringify(g.serialize()));assert.deepEqual(again.expansions127.modules.biome217,B.initial());assert.equal(g.restoreSave(again),true);assert.equal(g.biome217.active(),false);

  // Hauteurs pierreuses : la pierre se récolte plus vite, les citernes recueillent moins de pluie.
  notes.length=0;start(g,HIGHLAND);
  const highland=rates(g);assert.equal(state(g).family,'highland');
  near(highland.stone,1.2,'pierre, hauteurs',1e-6);near(highland.rain,.85,'pluie, hauteurs',1e-6);near(highland.wood,1,'bois, hauteurs',1e-6);near(highland.scrap,1,'ferraille, hauteurs',1e-6);near(highland.farm,1,'ferme, hauteurs',1e-6);
  near(highland.hand.rate,g.biome217.factor(highland.hand.type),'récolte à la main, hauteurs',1e-6);
  assert.ok(forest.wood>highland.wood&&highland.stone>forest.stone&&forest.farm<highland.farm&&highland.rain<forest.rain,'les deux graines ne se jouent pas pareil');
  assert.deepEqual(mine(notes),['Milieu de la cité : Hauteurs pierreuses. Avantage : récolte de la pierre +20 %. Contrainte : pluie recueillie par les citernes −15 %.']);
});

test('milieu 217 : sauvegarde et reprise, famille figée, registre strict',()=>{
  const {g,notes}=boot();start(g,FOREST);for(let i=0;i<5;i++)g.update(.1);
  const saved=JSON.parse(JSON.stringify(g.serialize()));assert.doesNotThrow(()=>require('../src/save.js').validate(JSON.parse(JSON.stringify(saved))));
  assert.deepEqual(saved.expansions127.modules.biome217,{version:1,active:true,family:'forest',announced:true});assert.equal(mine(notes).length,1);
  assert.equal(g.restoreSave(JSON.parse(JSON.stringify(saved))),true);for(let i=0;i<20;i++)g.update(.1);
  assert.deepEqual(state(g),saved.expansions127.modules.biome217);assert.equal(mine(notes).length,1,'la reprise ne rejoue pas l’annonce');assert.equal(g.biome217.factor('wood'),1.15);
  // La famille sauvegardée fait foi : elle n'est jamais relevée de nouveau, même si le relevé donnerait autre chose.
  const frozen=JSON.parse(JSON.stringify(saved));frozen.expansions127.modules.biome217.family='wetland';
  assert.equal(g.restoreSave(frozen),true);for(let i=0;i<20;i++)g.update(.1);
  assert.equal(B.dominant(g.frontier.world()),'forest');assert.equal(state(g).family,'wetland');assert.equal(g.biome217.profile().name,'Zone humide');
  assert.equal(g.biome217.factor('rain'),1.2);assert.equal(g.biome217.factor('scrap'),.85);assert.equal(g.biome217.factor('wood'),1);assert.equal(mine(notes).length,1);
  // Sauvegarde prise avant le relevé : la reprise relève et annonce une fois.
  const pending=JSON.parse(JSON.stringify(saved));pending.expansions127.modules.biome217={version:1,active:true,family:null,announced:false};
  assert.equal(g.restoreSave(pending),true);for(let i=0;i<5;i++)g.update(.1);
  assert.deepEqual(state(g),{version:1,active:true,family:'forest',announced:true});assert.equal(mine(notes).length,2);
  // Région sans milieu marqué : profil neutre, aucune annonce.
  const neutral=JSON.parse(JSON.stringify(saved));neutral.expansions127.modules.biome217={version:1,active:true,family:'neutral',announced:false};
  assert.equal(g.restoreSave(neutral),true);for(let i=0;i<5;i++)g.update(.1);
  assert.deepEqual(state(g),{version:1,active:true,family:'neutral',announced:true});assert.equal(mine(notes).length,2);
  for(const key of EFFECTS)assert.equal(g.biome217.factor(key),1);assert.equal(g.biome217.profile().family,null);assert.match(g.biome217.overview().summary,/pas de milieu marqué/);
  // Registre invalide : refusé en bloc, la campagne en cours reste intacte.
  const broken=JSON.parse(JSON.stringify(saved));broken.expansions127.modules.biome217.family='jungle';
  assert.throws(()=>g.restoreSave(broken),/Milieu de cité 217/);assert.equal(state(g).family,'neutral');
});

test('milieu 217 : aucun effet de bord, module inscrit partout',()=>{
  const {g}=boot();start(g,FOREST);
  const nodes=g.world.nodes.map(n=>[n.id,n.type,n.amount,n.x,n.y]),resources={...g.resources},rng=g.serialize().randomState,health=g.core().maxHealth;
  g.biome217.profile();g.biome217.overview();for(const key of EFFECTS)g.biome217.factor(key);g.biome217.tick();g.biome217.snapshot();
  assert.deepEqual(g.world.nodes.map(n=>[n.id,n.type,n.amount,n.x,n.y]),nodes,'ni gisement déplacé ni quantité changée');
  assert.deepEqual({...g.resources},resources,'aucun stock créé');assert.deepEqual(g.serialize().randomState,rng,'aucun tirage');assert.equal(g.core().maxHealth,health);
  assert.equal(typeof g.frontier.worldReady(),'boolean');
  const source=fs.readFileSync(path.join(root,'src/biome217.js'),'utf8');
  for(const forbidden of ['Math.random','g.random','.health','damage','setTimeout','Date.now'])assert.equal(source.includes(forbidden),false,forbidden);
  const ui=fs.readFileSync(path.join(root,'src/expansion-ui.js'),'utf8');
  for(const table of ['ORDER','GROUPS','API_NAMES','LABELS'])assert.ok(ui.split('\n').find(l=>l.includes(table+' ')||l.includes(table+'=')).includes('biome217'),table);
  assert.ok(fs.readFileSync(path.join(root,'src/expansion-kit.js'),'utf8').includes("'biome217','balance217','breach217']"));
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('"src/biome217.js"'));
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),at=html.indexOf('src/biome217.js');
  assert.ok(at>html.indexOf('src/expansion-kit.js')&&at>html.indexOf('src/core.js')&&at>html.indexOf('src/frontier.js')&&at>0);
});
