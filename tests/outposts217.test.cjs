'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),M=require('../src/outposts217.js'),W=require('../src/frontier-world.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.Outposts217Rules,RAID=C.Factions217Rules.raid,root=path.join(__dirname,'..');
const copy=v=>JSON.parse(JSON.stringify(v)),bag=o=>({...C.makeBag(),...o});
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-9,(message||'')+' : '+a+' ≠ '+b);

function campaign(seed='17117'){const {g}=bootDocument134();g.startNew('standard',seed);g.campaignIntro132?.skip?.();return g;}
const saved=g=>g.serialize().expansions127.modules.outposts217;
const watch=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const count=(notes,part)=>notes.filter(t=>t.includes(part)).length;
const row=(g,label)=>g.outposts217.overview().rows.find(r=>r.label===label)?.value;
const tick=g=>g.economyTick(.25);
const toAge=(g,age)=>{const data=g.serialize();data.urban.peakScore=Math.max(data.urban.peakScore,C.CITY_TIERS[age].requiredScore);data.urban.progression151={version:1,age};assert.equal(g.restoreSave(data),true);g.refreshMetrics(true);assert.equal(g.tier.id,age);};
// Lieux infestés ordinaires (hors lieux remarquables), du plus proche de D-17 au plus lointain.
function infested(g){
  const w=g.frontier.world(),marks=new Set(g.remarkable217.list().map(v=>v.id));
  return w.pois.filter(p=>p.occupation==='infected'&&!marks.has(p.id)&&w.threatCount(p)>0).sort((a,b)=>Math.hypot(a.x-w.home.x,a.y-w.home.y)-Math.hypot(b.x-w.home.x,b.y-w.home.y));
}
// Lieu vu et vidé de ses occupants, par une sauvegarde validée (registre régional).
function clearSite(g,p,dead=true){
  const data=g.serialize(),n=g.frontier.world().threatCount(p);
  if(!data.frontier.seen.includes(p.id))data.frontier.seen.push(p.id);
  if(dead){for(let i=0;i<n;i++)data.frontier.enemies[p.id+':e'+i]=0;data.frontier.kills=Object.values(data.frontier.enemies).filter(h=>h===0).length;}
  assert.equal(g.restoreSave(data),true);
}
function soldiers(g,n){
  const core=g.core(),made=[];
  for(let i=0;made.length<n&&i<40;i++){const u=g.createProtectedSurvivor('soldier',core.x-60+(i%8)*18,core.y+80+Math.floor(i/8)*18);if(u)made.push(u);}
  assert.equal(made.length,n);g.refreshMetrics(true);return made;
}
const riflemen=g=>g.units.filter(u=>u.kind==='soldier'&&!u.dead).length;
// Campagne à l'âge requis, un lieu vidé, la garnison disponible.
function ready(age=R.startAge,sites=1){
  const g=campaign();toAge(g,age);
  const list=infested(g).slice(0,sites);for(const p of list)clearSite(g,p);
  soldiers(g,R.garrison*sites+1);
  Object.assign(g.resources,{wood:200,scrap:200,stone:100,food:200,fuel:40,ammo:200});
  return{g,list,p:list[0]};
}

test('avant-postes 217 : règles gelées dans le cœur, bornées ; état validé strictement',()=>{
  const frozen=o=>{assert.ok(Object.isFrozen(o));for(const v of Object.values(o))if(v&&typeof v==='object')frozen(v);};frozen(R);
  assert.ok(R.startAge>=1&&R.startAge<C.CITY_TIERS.length&&R.caps[0].age===R.startAge);
  for(let i=1;i<R.caps.length;i++)assert.ok(R.caps[i].age>R.caps[i-1].age&&R.caps[i].max>R.caps[i-1].max);
  assert.deepEqual([0,1,2,4,5,7,8,10].map(M.cap),[0,0,1,1,2,2,3,3]);assert.equal(M.cap(2.5),0);
  assert.ok(R.garrison>=1&&C.bagTotal(bag(R.cost))>0&&Object.keys(R.cost).every(k=>C.RESOURCE_KEYS.includes(k)));
  assert.ok(R.hold.min>0&&R.hold.max>R.hold.min&&R.convoy.lot>0&&R.convoy.lot<R.hold.min&&R.convoy.fuel>0&&R.convoy.everyWaves>=1&&R.radio.range>0);
  assert.ok(R.convoy.fuel<R.convoy.lot,'un convoi rapporte plus qu’il ne brûle');
  for(const mix of R.hold.mixes){near(Object.values(mix).reduce((a,b)=>a+b,0),1);assert.ok(Object.keys(mix).every(k=>C.RESOURCE_KEYS.includes(k)&&!['fuel','ammo','medicine'].includes(k)),'fonds lourd : matériaux et vivres, pas de ressource rare');}
  const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
  assert.ok(core.indexOf('C.Scenery217Rules=')<core.indexOf('C.Outposts217Rules=')&&core.indexOf('C.Outposts217Rules=')<core.indexOf('C.Weather193Rules='));
  assert.deepEqual(M.validate(undefined),{version:1,active:false,posts:[]});assert.deepEqual(M.fresh(),{version:1,active:true,posts:[]});
  const post=(id,patch={})=>({id,garrison:R.garrison,founded:3,convoy:4,hauled:bag({wood:16}),note:'delivered',sent:16,...patch});
  const ok={version:1,active:true,posts:[post('P0001'),post('P0002',{note:'held',sent:0,convoy:3,hauled:bag({})})]};
  assert.deepEqual(M.validate(ok),ok);assert.notEqual(M.validate(ok),ok);
  const bad=posts=>({version:1,active:true,posts});
  for(const raw of [null,[],'217',{},{version:1,active:true},{...ok,version:2},{...ok,active:1},{...ok,extra:1},{version:1,active:false,posts:[post('P0001')]},
    bad([post('P0002'),post('P0001')]),bad([post('P0001'),post('P0001')]),bad([post('P1')]),bad([post('P0001',{garrison:R.garrison+1})]),bad([post('P0001',{convoy:2})]),
    bad([post('P0001',{note:'lost'})]),bad([post('P0001',{sent:R.convoy.lot+1})]),bad([post('P0001',{sent:-1})]),bad([post('P0001',{hauled:{wood:1}})]),
    bad([post('P0001',{hauled:bag({wood:-1})})]),bad([post('P0001',{hauled:bag({wood:R.hold.max,scrap:1})})]),bad([post('P0001',{extra:1})]),
    bad(['P0001','P0002','P0003','P0004'].map(id=>post(id)))])assert.throws(()=>M.validate(raw),/Avant-postes 217/);
  // Un avant-poste suppose un lieu vu et au moins un occupant tombé dans la même sauvegarde.
  const one=bad([post('P0001')]);
  assert.deepEqual(M.validate(one,{frontier:{seen:['P0001'],enemies:{'P0001:e0':0}}}),one);
  assert.throws(()=>M.validate(one,{frontier:{seen:[],enemies:{'P0001:e0':0}}}),/Avant-postes 217/);
  assert.throws(()=>M.validate(one,{frontier:{seen:['P0001'],enemies:{'P0001:e0':12,'P0002:e0':0}}}),/Avant-postes 217/);
});

test('avant-postes 217 : fonds du lieu, côté de route et lot de convoi sont des fonctions pures',()=>{
  const w=W.create(17117,8,{detailVersion:1,ecologyVersion:1,hydrologyVersion:1}),before=JSON.stringify(w.pois.slice(0,200));
  const seenMix=new Set();
  for(const p of w.pois.slice(0,200)){
    const h=M.holding(w.seed,p),total=C.bagTotal(h);
    assert.deepEqual(M.holding(w.seed,p),h);assert.ok(Number.isInteger(total)&&total>=R.hold.min&&total<=R.hold.max,p.id);
    assert.equal(h.fuel+h.ammo+h.medicine,0);seenMix.add(Object.keys(h).filter(k=>h[k]>0).sort((a,b)=>h[b]-h[a])[0]);
  }
  assert.ok(seenMix.size>=2,'plusieurs compositions selon le lieu');assert.equal(JSON.stringify(w.pois.slice(0,200)),before,'le monde n’est pas touché');
  assert.deepEqual([[5,1],[-5,1],[1,5],[1,-5],[3,3],[-3,-4]].map(([x,y])=>M.sideOf(x,y)),['east','west','south','north','east','north']);
  const full=()=>1e9;
  let l=M.lot(bag({wood:10,scrap:30}),full);near(l.total,R.convoy.lot);assert.deepEqual(l.bag,bag({wood:10,scrap:R.convoy.lot-10}));
  l=M.lot(bag({wood:3}),full);assert.deepEqual(l.bag,bag({wood:3}));
  l=M.lot(bag({wood:10,scrap:30}),k=>k==='wood'?0:4);assert.deepEqual(l.bag,bag({scrap:4}),'jamais plus que la place du dépôt');
  near(M.lot(bag({}),full).total,0);
});

test('avant-postes 217 : campagne neuve active, rien de changé au départ, aucun avant-poste avant l’âge requis',()=>{
  const g=campaign();
  assert.deepEqual(saved(g),M.fresh());assert.equal(g.outposts217.active(),true);assert.equal(g.outposts217.cap(),0);
  assert.equal(g.expansions.get('outposts217').title,'Avant-postes');
  assert.match(row(g,'Avant-postes'),/Aucun avant l’âge « /);assert.deepEqual(g.outposts217.actions(),[]);assert.deepEqual(g.outposts217.roads(),[]);
  assert.equal(g.outposts217.radioInRange(),true);assert.equal(g.outposts217.guards({x:9e3,y:0}),null);
  const p=infested(g)[0];clearSite(g,p);soldiers(g,R.garrison);
  assert.match(g.outposts217.foundQuote(p.id).reason,/Il faut une cité d’âge/);
});

test('avant-postes 217 : établissement payé en hommes et en stock, refus hors conditions',()=>{
  const {g,p}=ready(),notes=watch(g),w=g.frontier.world(),O=g.outposts217;
  const other=infested(g)[1],empty=w.pois.find(q=>q.occupation==='empty'),allied=w.pois.find(q=>q.occupation==='allied');
  assert.match(O.foundQuote('P9999').reason,/pas été visité/);assert.match(O.foundQuote(other.id).reason,/pas été visité/);assert.match(O.foundQuote(7).reason,/pas été visité/);
  clearSite(g,other,false);assert.match(O.foundQuote(other.id).reason,/vidé de ses occupants/);
  clearSite(g,empty,false);assert.match(O.foundQuote(empty.id).reason,/vidé de ses occupants/,'un lieu sans occupant n’a pas été conquis');
  clearSite(g,allied,false);assert.match(O.foundQuote(allied.id).reason,/relais allié/);
  assert.deepEqual(O.candidates(),[p.id]);
  const act=O.actions().find(a=>a.id==='found-'+p.id);assert.equal(act.disabled,false,act.reason);assert.match(act.description,/Coût : 2 fusiliers et 30 bois, 20 ferraille, 20 nourriture, 20 munitions\. Fonds du lieu : .*Route de .*, côté (est|ouest|nord|sud) de D-17\./);
  // Refus sans débit : loin du dépôt, garnison absente, stock insuffisant.
  const x=g.player.x;g.player.x+=900;assert.match(O.foundQuote(p.id).reason,/au dépôt de D-17/);g.player.x=x;
  const wood=g.resources.wood;g.resources.wood=R.cost.wood-1;assert.match(O.found(p.id).reason,/Stock insuffisant/);assert.equal(g.resources.wood,R.cost.wood-1);g.resources.wood=wood;
  const men=g.units.filter(u=>u.kind==='soldier');men[0].regionAbsent=true;men[1].regionAbsent=true;assert.match(O.found(p.id).reason,/2 fusiliers présents/);men[0].regionAbsent=false;men[1].regionAbsent=false;
  assert.equal(riflemen(g),R.garrison+1);assert.deepEqual(saved(g).posts,[]);
  const before={...g.resources},pop=g.population,workers=g.units.filter(u=>u.kind==='worker').length;
  assert.deepEqual(O.found(p.id),{ok:true});
  for(const k of C.RESOURCE_KEYS)near(before[k]-g.resources[k],R.cost[k]||0,k);
  assert.equal(riflemen(g),1,'la garnison a quitté la cité');assert.equal(g.units.filter(u=>u.kind==='worker').length,workers);assert.equal(g.population,pop-R.garrison);
  assert.deepEqual(saved(g).posts,[{id:p.id,garrison:R.garrison,founded:g.wave,convoy:g.wave,hauled:bag({}),note:'held',sent:0}]);
  assert.equal(count(notes,'Avant-poste établi : '),1);assert.match(notes.find(t=>t.includes('Avant-poste établi')),/2 fusiliers quittent la cité ; la route qui y mène \(.*\) est désormais gardée, côté (est|ouest|nord|sud) de D-17\./);
  assert.match(O.foundQuote(p.id).reason,/tient déjà ce lieu/);
  // Plafond de l'âge : un seul avant-poste à l'âge de départ.
  clearSite(g,other);soldiers(g,R.garrison);
  assert.match(O.foundQuote(other.id).reason,/plus de 1 avant-poste à son âge/);assert.equal(O.actions().some(a=>a.id.startsWith('found-')),false);
  assert.equal(row(g,'Avant-postes'),'1 sur 1 à cet âge.');
});

test('avant-postes 217 : route gardée = itinéraire routier existant ; un fourgon qui rentre de ce côté n’est pas barré',()=>{
  const {g,p}=ready(),O=g.outposts217,w=g.frontier.world();
  const Routing=require('../src/frontier-routing.js'),ref=Routing.route(w,{x:w.home.x,y:w.home.y},p);
  assert.ok(ref&&ref.metres>0);assert.equal(O.found(p.id).ok,true);
  const [road]=O.roads();assert.equal(road.id,p.id);near(road.metres,ref.metres);assert.deepEqual(road.path,ref.path.map(q=>({x:q.x,y:q.y})));
  assert.equal(road.side,M.sideOf(p.x-w.home.x,p.y-w.home.y));
  const core=g.core(),dir={east:[1,0],west:[-1,0],south:[0,1],north:[0,-1]},[dx,dy]=dir[road.side];
  assert.equal(typeof O.guards({x:core.x+dx*500,y:core.y+dy*500}),'string');assert.equal(O.guards({x:core.x-dx*500,y:core.y-dy*500}),null,'côté opposé non gardé');
  // Fourgon : troisième retour chargé = barrage attendu. Du côté gardé il passe, sans perte, tribut gardé.
  const data=g.serialize();data.expeditions.vehicle={id:data.nextId++,x:core.x+140,y:core.y+140,health:300,fuel:10,angle:0,driving:false,cargo:bag({})};data.expeditions.stats.built=1;
  assert.equal(g.restoreSave(data),true);const v=g.expeditions.car(),notes=watch(g);
  const sortie=(sx,sy)=>{v.x=core.x+sx*(RAID.awayDistance+50);v.y=core.y+sy*(RAID.awayDistance+50);Object.assign(v.cargo,bag({scrap:40}));tick(g);
    v.x=core.x+sx*(RAID.ambushDistance-10);v.y=core.y+sy*(RAID.ambushDistance-10);tick(g);return C.bagTotal(v.cargo);};
  for(let i=0;i<RAID.period-1;i++)assert.equal(sortie(dx,dy),40);
  assert.equal(sortie(dx,dy),40,'route gardée : pas de barrage');
  assert.equal(count(notes,'Les Rouleurs n’ont pas barré la route du retour : elle est gardée par l’avant-poste'),1);assert.equal(count(notes,'intercepté'),0);
  assert.match(g.factions217.lastAffair('rouleurs'),/pas de barrage, la route du retour est gardée/);assert.equal(g.factions217.reputation('rouleurs'),0);
  assert.equal(g.serialize().expansions127.modules.factions217.affairs.rouleurs.code,'guarded');
  // Par le côté opposé, le barrage suivant prend sa part : la règle des Rouleurs est inchangée ailleurs.
  for(let i=0;i<RAID.period-1;i++)assert.equal(sortie(-dx,-dy),40);
  assert.ok(sortie(-dx,-dy)<40,'côté non gardé : coffre entamé');assert.equal(count(notes,'intercepté'),1);
  // Avant-poste abandonné : la route n'est plus gardée.
  assert.equal(O.abandon(p.id).ok,true);assert.deepEqual(O.roads(),[]);assert.equal(O.guards({x:core.x+dx*500,y:core.y+dy*500}),null);
});

test('avant-postes 217 : le convoi roule seul, lot borné, fonds fini qui s’épuise et le dit',()=>{
  const {g,p}=ready(),O=g.outposts217,notes=watch(g);
  // Relevé du module seul : l'économie de la cité (rations, production) ne brouille pas le compte.
  const tick=()=>O.tick(.25);
  g.resources.fuel=100;g.storage=Math.max(g.storage,2000);
  assert.equal(O.found(p.id).ok,true);
  const hold=O.holding(p.id),total=C.bagTotal(hold),start={...g.resources},wave0=g.wave;
  g.phase='calm';tick();assert.equal(count(notes,'Convoi de'),0,'pas de convoi la vague de l’établissement');
  g.wave=wave0+1;g.phase='assault';tick();assert.equal(count(notes,'Convoi de'),0,'jamais pendant l’assaut');
  g.phase='calm';tick();tick();
  assert.equal(count(notes,'arrivé seul par la route gardée'),1,'un seul convoi par vague');
  const first=O.posts()[0];near(first.sent,Math.min(R.convoy.lot,total));assert.equal(first.note,'delivered');near(C.bagTotal(first.hauled),first.sent);
  near(start.fuel-g.resources.fuel,R.convoy.fuel,'carburant brûlé');
  near(C.RESOURCE_KEYS.filter(k=>k!=='fuel').reduce((n,k)=>n+g.resources[k]-start[k],0),first.sent,'livré au dépôt');
  assert.match(row(g,first.name),/2 fusiliers en garnison · route gardée côté (est|ouest|nord|sud), .* · reste sur place : .* · dernier convoi : 16 unités livrées \(vague \d+\)\./);
  // Pas de carburant : le convoi reste sur place, rien n'est livré ni perdu.
  const fuel=g.resources.fuel;g.resources.fuel=R.convoy.fuel-1;g.wave++;const held={...g.resources};tick();
  assert.equal(O.posts()[0].note,'nofuel');assert.deepEqual({...g.resources},held);assert.equal(count(notes,'il faut 2 carburant au dépôt'),1);near(C.bagTotal(O.posts()[0].hauled),first.sent);
  g.resources.fuel=fuel;
  // Dépôt plein : rien n'entre, rien n'est brûlé.
  const storage=g.storage;g.storage=0;g.wave++;const blocked={...g.resources};tick();
  assert.equal(O.posts()[0].note,'full');assert.deepEqual({...g.resources},blocked);assert.equal(count(notes,'le dépôt n’a pas la place'),1);g.storage=storage;
  // Jusqu'à épuisement : le total livré est exactement le fonds, puis plus rien.
  let guard=0;while(O.posts()[0].note!=='empty'&&guard++<40){g.wave++;tick();}
  const done=O.posts()[0];for(const k of C.RESOURCE_KEYS)near(done.hauled[k],hold[k],k);near(C.bagTotal(done.left),0);
  assert.equal(count(notes,'c’était le dernier convoi'),1);
  const after={...g.resources},lots=count(notes,'arrivé seul par la route gardée');assert.equal(lots,Math.ceil(total/R.convoy.lot));
  for(let i=0;i<5;i++){g.wave++;tick();}
  assert.deepEqual({...g.resources},after,'un lieu vide ne donne plus rien et ne coûte plus rien');assert.equal(count(notes,'arrivé seul par la route gardée'),lots);
  assert.match(row(g,done.name),/reste sur place : rien · lieu vide, plus de convoi\./);
  assert.equal(O.roads().length,1,'la route reste gardée');
});

test('avant-postes 217 : abandon, les hommes sont rendus à la cité, le coût reste perdu',()=>{
  const {g,p}=ready(),O=g.outposts217,notes=watch(g);
  assert.match(O.abandonQuote(p.id).reason,/Aucun avant-poste/);
  const men=riflemen(g),pop=g.population;assert.equal(O.found(p.id).ok,true);assert.equal(riflemen(g),men-R.garrison);
  const act=O.actions().find(a=>a.id==='abandon-'+p.id);assert.equal(act.disabled,false,act.reason);
  const x=g.player.x;g.player.x+=900;assert.match(O.abandon(p.id).reason,/au dépôt de D-17/);g.player.x=x;assert.equal(saved(g).posts.length,1);
  const stock={...g.resources};
  assert.deepEqual(O.abandon(p.id),{ok:true});
  assert.equal(riflemen(g),men);assert.equal(g.population,pop);assert.deepEqual({...g.resources},stock,'rien n’est remboursé');assert.deepEqual(saved(g).posts,[]);
  assert.equal(count(notes,'2 fusiliers rentrent à D-17'),1);
  const core=g.core();for(const u of g.units.filter(u=>u.kind==='soldier'))assert.ok(Math.hypot(u.x-core.x,u.y-core.y)<260&&u.health>0);
  assert.equal(new Set(g.units.map(u=>u.id)).size,g.units.length,'identifiants uniques');
  // Le lieu peut être repris : le fonds déjà transporté n'est pas rendu au lieu… il n'y en avait pas encore.
  assert.equal(O.foundQuote(p.id).ok,true);
});

test('avant-postes 217 : plafond lié à l’âge, deux avant-postes à l’âge suivant',()=>{
  const {g,list}=ready(R.caps[1].age,2),O=g.outposts217;
  assert.equal(O.cap(),2);assert.equal(O.found(list[0].id).ok,true);assert.equal(O.found(list[1].id).ok,true);
  assert.deepEqual(saved(g).posts.map(q=>q.id),list.map(q=>q.id).sort());assert.equal(row(g,'Avant-postes'),'2 sur 2 à cet âge.');
  g.wave++;g.phase='calm';g.resources.fuel=50;const fuel=g.resources.fuel;tick(g);near(fuel-g.resources.fuel,2*R.convoy.fuel,'un convoi par avant-poste');
});

test('avant-postes 217 : sauvegarde et reprise ; sauvegarde abîmée refusée',()=>{
  const {g,p}=ready(),O=g.outposts217;g.resources.fuel=50;g.storage=Math.max(g.storage,2000);
  assert.equal(O.found(p.id).ok,true);g.wave++;g.phase='calm';tick(g);
  const data=copy(g.serialize()),mine=data.expansions127.modules.outposts217;
  assert.equal(mine.posts[0].note,'delivered');assert.equal(g.restoreSave(copy(data)),true);
  assert.deepEqual(saved(g),mine);assert.equal(O.roads().length,1);assert.equal(riflemen(g),1,'la garnison reste hors de la cité après reprise');
  tick(g);assert.deepEqual(saved(g),mine,'pas de second convoi dans la même vague après reprise');
  const broken=patch=>{const d=copy(data);patch(d.expansions127.modules.outposts217,d);return d;};
  for(const d of [broken(m=>{m.posts[0].id='P9999';}),broken(m=>{m.posts[0].sent=99;}),broken(m=>{m.active=false;}),broken(m=>{m.posts[0].hauled.wood=-1;}),
    broken((m,d)=>{d.frontier.seen=d.frontier.seen.filter(id=>id!==p.id);delete d.frontier.enemies[p.id+':e0'];for(const k of Object.keys(d.frontier.enemies))if(k.startsWith(p.id+':'))delete d.frontier.enemies[k];d.frontier.kills=Object.values(d.frontier.enemies).filter(h=>h===0).length;})]){
    let refused=false;try{refused=g.restoreSave(d)===false;}catch(error){refused=true;}
    assert.equal(refused,true);assert.deepEqual(saved(g),mine,'état conservé après refus');
  }
});

test('avant-postes 217 : une ancienne campagne reste sans avant-poste, sans portée radio ni route gardée',()=>{
  const {g,p}=ready(),data=copy(g.serialize());delete data.expansions127.modules.outposts217;
  assert.equal(g.restoreSave(data),true);const O=g.outposts217;
  assert.equal(O.active(),false);assert.deepEqual(saved(g),M.initial());
  assert.match(O.foundQuote(p.id).reason,/ne connaît pas les avant-postes/);assert.equal(O.found(p.id).ok,false);assert.deepEqual(O.actions(),[]);assert.deepEqual(O.candidates(),[]);
  assert.match(O.overview().summary,/a commencé avant cette règle/);assert.equal(row(g,'Avant-postes'),'Sans objet.');
  const before=JSON.stringify(g.resources),men=riflemen(g);g.wave+=3;g.phase='calm';O.tick(.25);
  assert.equal(JSON.stringify(g.resources),before,'aucun convoi, aucun débit');assert.equal(riflemen(g),men);assert.deepEqual(O.roads(),[]);assert.equal(O.guards({x:1e4,y:0}),null);
  assert.equal(O.radioInRange(),true,'portée non limitée');
  assert.match(g.cityRadio217?.overview?.().rows[0].value||'Portée non limitée',/Portée non limitée/);
});

test('avant-postes 217 : portée radio autour de D-17 et des avant-postes ; hors portée, silence, dit au retour',()=>{
  const {g,p}=ready(),O=g.outposts217,w=g.frontier.world();
  assert.equal(O.found(p.id).ok,true);
  const base=JSON.stringify(g.serialize()),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  // Sortie à pied par une sauvegarde validée : premier point accepté parmi quelques candidats.
  const out=points=>{
    for(const q of points.slice(0,24)){
      const d=JSON.parse(base);Object.assign(d.frontier,{active:true,anchor:{x:d.player.x,y:d.player.y},x:q.x,y:q.y});
      try{if(g.restoreSave(d)!==false)return q;}catch(error){/* point refusé : essai suivant */}
    }
    return null;
  };
  const ring=(c,r)=>[0,1,2,3,4,5,6,7].map(i=>({x:c.x+Math.cos(i*Math.PI/4)*r,y:c.y+Math.sin(i*Math.PI/4)*r})).filter(q=>q.x>10&&q.y>10&&q.x<w.size-10&&q.y<w.size-10);
  assert.equal(O.radioInRange(),true,'dans D-17');
  const close=out(ring(w.home,R.radio.range-600));assert.ok(close,'un point à portée de D-17');assert.equal(g.frontier.active(),true);assert.equal(O.radioInRange(),true);
  const far=out([...ring(w.home,R.radio.range+500),...ring(w.home,R.radio.range+900)].filter(q=>dist(q,p)>R.radio.range));
  assert.ok(far,'un point hors de toute portée');assert.equal(O.radioInRange(),false);
  // Un avant-poste lointain relaie : même point, avant-poste déplacé par le calcul seulement.
  const relay=w.pois.filter(q=>q.occupation==='infected'&&w.threatCount(q)>0&&dist(q,w.home)>R.radio.range+1200&&!globalThis.DeadwallRemarkable217.select(w).some(e=>e.id===q.id))
    .sort((a,b)=>dist(a,w.home)-dist(b,w.home))[0];
  assert.ok(relay,'un lieu infesté au-delà de la portée de D-17');
  assert.equal(g.restoreSave(JSON.parse(base)),true);assert.equal(O.abandon(p.id).ok,true);clearSite(g,relay);
  const route=O.foundQuote(relay.id);
  if(route.ok){
    assert.equal(O.found(relay.id).ok,true);const base2=JSON.stringify(g.serialize());
    let reached=null;
    for(const q of [...ring(relay,60),...ring(relay,120),...ring(relay,300)].filter(q=>dist(q,w.home)>R.radio.range)){
      const d=JSON.parse(base2);Object.assign(d.frontier,{active:true,anchor:{x:d.player.x,y:d.player.y},x:q.x,y:q.y});
      try{if(g.restoreSave(d)!==false){reached=q;break;}}catch(error){/* essai suivant */}
    }
    assert.ok(reached,'un point près de l’avant-poste lointain');assert.equal(O.radioInRange(),true,'l’avant-poste relaie la radio');
    const d=JSON.parse(base2);d.expansions127.modules.outposts217.posts=[];Object.assign(d.frontier,{active:true,anchor:{x:d.player.x,y:d.player.y},x:reached.x,y:reached.y});
    assert.equal(g.restoreSave(d),true);assert.equal(O.radioInRange(),false,'sans avant-poste, le même point est hors de portée');
  }
});

test('avant-postes 217 : radio de cité — hors de portée rien n’est reçu, et le journal le dit au retour',()=>{
  const {g,doc}=bootDocument134();
  require('../src/fallback-order.js').install(g,doc);const Radio=require('../src/city-radio217.js');Radio.install(g,doc);
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();
  const texts=()=>g.cityRadio217.journal().map(e=>e.text),step=()=>{g.elapsed+=1;g.cityRadio217.tick();};
  assert.match(g.cityRadio217.overview().rows[0].value,/Portée : 3000 m autour de D-17 et de chaque avant-poste ; au-delà, silence\./);
  // Sortie réelle par la jonction est ; la portée est ensuite simulée par le crochet lu par la radio.
  g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter(),'sortie régionale');
  const P=globalThis.DeadwallAtlasProjection,edge=P.gatesFor(g).find(gate=>gate.id==='east'),data=copy(g.serialize());data.frontier.x=edge.x;data.frontier.y=edge.y;assert.equal(g.restoreSave(data),true);
  assert.equal(g.outposts217.radioInRange(),true,'à la porte, la radio porte');
  step();g.phase='warning';step();
  assert.equal(texts().filter(t=>t.startsWith('Front annoncé')).length,1,'à portée : le fait est reçu');
  const real=g.outposts217;let inRange=false;g.outposts217={...real,radioInRange:()=>inRange};
  const n=texts().length;g.phase='assault';step();step();
  assert.equal(texts().length,n,'hors de portée : silence');
  assert.equal(g.frontier.leave(),true,'retour par la jonction');step();
  assert.equal(texts().length,n+1);assert.match(texts().at(-1),/^Hors de portée pendant la sortie : 1 message n’a pas été reçu\.$/);
  assert.equal(g.serialize().expansions127.modules.cityRadio217.journal.at(-1).text,texts().at(-1),'la ligne est sauvegardée');
  g.outposts217=real;
});

test('avant-postes 217 : aucun tirage, aucune horloge, monde intact, module référencé',()=>{
  const source=fs.readFileSync(path.join(root,'src/outposts217.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','.random(','rng','localStorage','Date.now','performance.now','setTimeout','setInterval','nextId','.health=','.health-=','damage','zombies'])assert.equal(source.includes(forbidden),false,forbidden);
  assert.equal((source.match(/g\.resources\[k\]\+=/g)||[]).length,1,'un seul point de crédit : la livraison d’un convoi');
  assert.equal((source.match(/C\.spend\(/g)||[]).length,1,'un débit : l’établissement');assert.equal((source.match(/g\.resources\.fuel-=/g)||[]).length,1,'un débit : le carburant du convoi');
  for(const file of ['index.html','sw.js','src/expansion-kit.js','src/expansion-ui.js'])assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes('outposts217'),file);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(html.indexOf('src/expansion-kit.js')<html.indexOf('src/outposts217.js')&&html.indexOf('src/frontier-routing.js')<html.indexOf('src/outposts217.js')&&html.indexOf('src/outposts217.js')<html.indexOf('src/expansion-ui.js'));
  assert.match(fs.readFileSync(path.join(root,'src/expansion-kit.js'),'utf8'),/'outposts217','balance217','breach217'\]/);
  // Établissement et convois : le flux aléatoire de la simulation et Math.random ne sont pas consultés ; le monde ne bouge pas.
  const {g,p}=ready(),O=g.outposts217,w=g.frontier.world(),pois=JSON.stringify(w.pois.slice(0,300)),roads=w.roads.length;
  g.resources.fuel=50;g.storage=Math.max(g.storage,2000);
  const random=Math.random,stream=JSON.stringify(g.random);
  Math.random=()=>{throw Error('tirage interdit');};
  try{assert.equal(O.found(p.id).ok,true);for(let i=0;i<4;i++){g.wave++;g.phase='calm';O.tick(.25);}O.overview();O.actions();O.roads();O.radioInRange();O.guards({x:0,y:0});}
  finally{Math.random=random;}
  assert.equal(JSON.stringify(g.random),stream,'flux de simulation intact');
  assert.equal(JSON.stringify(w.pois.slice(0,300)),pois);assert.equal(w.roads.length,roads);
  assert.equal(g.frontier.takenAmount(p.id),0);assert.deepEqual(Object.keys(g.serialize().frontier.taken),[],'le registre des prélèvements n’est pas touché');
});
