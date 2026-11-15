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
// Butin réel d'un lieu, lu chez son propriétaire ; contenants dans l'ordre du registre régional.
const stockOf=(g,p)=>g.frontier.siteStock(p.id);
function containers(g,p){
  const w=g.frontier.world(),out=[],add=(b,z)=>{if(b&&b.amount>0&&C.RESOURCE_KEYS.includes(b.resource))out.push({...b,poi:p.id,z,left:b.amount-g.frontier.takenAmount(b.id)});};
  for(const z of [...p.levels].sort((a,b)=>a-b))for(const b of w.plan(p,z).objects)add(b,z);
  for(const b of p.outdoor||[])add(b,0);for(const b of p.parking||[])add(b,0);return out;
}
const closed=(g,b)=>Boolean(g.interventions134?.blocksLoot(b));
const takenAt=(g,p)=>Object.entries(g.serialize().frontier.taken).filter(([id])=>id.startsWith(p.id+':'));
const takenSum=(g,p)=>takenAt(g,p).reduce((n,[,v])=>n+v,0);
// Fouille à la main, par une sauvegarde validée : même registre, même format que la touche E.
function handTake(g,id,n){const data=g.serialize();data.frontier.taken[id]=(data.frontier.taken[id]||0)+n;assert.equal(g.restoreSave(data),true);}
const riflemen=g=>g.units.filter(u=>u.kind==='soldier'&&!u.dead).length;
// Campagne à l'âge requis, un lieu vidé, la garnison disponible.
function ready(age=R.startAge,sites=1){
  const g=campaign();toAge(g,age);
  const list=infested(g).slice(0,sites);for(const p of list)clearSite(g,p);
  soldiers(g,R.garrison*sites+1);
  Object.assign(g.resources,{wood:200,scrap:200,stone:100,food:300,fuel:40,ammo:200});
  return{g,list,p:list[0]};
}

test('avant-postes 217 : règles gelées dans le cœur, bornées ; état v2 validé strictement, état v1 converti',()=>{
  const frozen=o=>{assert.ok(Object.isFrozen(o));for(const v of Object.values(o))if(v&&typeof v==='object')frozen(v);};frozen(R);
  assert.ok(R.startAge>=1&&R.startAge<C.CITY_TIERS.length);
  assert.equal(R.caps,undefined,'plus de plafond par âge');assert.equal(R.hold,undefined,'plus de fonds dérivé de l’emprise');
  assert.deepEqual([0,1,2,4,5,7,8,10].map(M.open),[false,false,true,true,true,true,true,true]);assert.equal(M.open(2.5),false);
  assert.ok(R.garrison>=1&&C.bagTotal(bag(R.cost))>0&&Object.keys(R.cost).every(k=>C.RESOURCE_KEYS.includes(k)));
  assert.ok(C.bagTotal(bag(R.upkeep))>0&&Object.keys(R.upkeep).every(k=>C.RESOURCE_KEYS.includes(k)&&R.upkeep[k]>0),'entretien par vague');
  assert.ok(R.convoy.lot>0&&R.convoy.fuel>0&&R.convoy.everyWaves>=1&&R.radio.range>0);
  assert.ok(R.convoy.fuel+C.bagTotal(bag(R.upkeep))<R.convoy.lot,'un convoi rapporte plus que ne coûtent son carburant et l’entretien');
  assert.ok(Number.isInteger(R.limits.posts)&&R.limits.posts>=32&&R.limits.hauled>=1e5,'plafonds techniques larges');
  const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
  assert.ok(core.indexOf('C.Scenery217Rules=')<core.indexOf('C.Outposts217Rules=')&&core.indexOf('C.Outposts217Rules=')<core.indexOf('C.Weather193Rules='));
  assert.deepEqual(M.validate(undefined),{version:2,active:false,posts:[]});assert.deepEqual(M.fresh(),{version:2,active:true,posts:[]});
  const post=(id,patch={})=>({id,garrison:R.garrison,founded:3,convoy:4,hauled:bag({wood:16}),note:'delivered',sent:16,...patch});
  const ok={version:2,active:true,posts:[post('P0001'),post('P0002',{note:'held',sent:0,convoy:3,hauled:bag({})}),post('P0003',{note:'unfed',sent:0}),post('P0004',{hauled:bag({scrap:900,fuel:40})})]};
  assert.deepEqual(M.validate(ok),ok);assert.notEqual(M.validate(ok),ok);
  const bad=(posts,version=2)=>({version,active:true,posts});
  const id=i=>'P'+String(i).padStart(4,'0');
  const many=n=>Array.from({length:n},(_,i)=>post(id(i+1)));
  assert.equal(M.validate(bad(many(R.limits.posts))).posts.length,R.limits.posts,'le registre accepte son plafond technique');
  for(const raw of [null,[],'217',{},{version:2,active:true},{...ok,version:3},{...ok,version:0},{...ok,active:1},{...ok,extra:1},{version:2,active:false,posts:[post('P0001')]},
    bad([post('P0002'),post('P0001')]),bad([post('P0001'),post('P0001')]),bad([post('P1')]),bad([post('P0001',{garrison:R.garrison+1})]),bad([post('P0001',{convoy:2})]),
    bad([post('P0001',{note:'lost'})]),bad([post('P0001',{sent:R.convoy.lot+1})]),bad([post('P0001',{sent:-1})]),bad([post('P0001',{hauled:{wood:1}})]),
    bad([post('P0001',{hauled:bag({wood:-1})})]),bad([post('P0001',{hauled:bag({wood:R.limits.hauled+1})})]),bad([post('P0001',{hauled:bag({wood:NaN})})]),bad([post('P0001',{extra:1})]),
    bad(many(R.limits.posts+1))])assert.throws(()=>M.validate(raw),/Avant-postes 217/);
  // Un avant-poste suppose un lieu vu et au moins un occupant tombé dans la même sauvegarde.
  const single=bad([post('P0001')]);
  assert.deepEqual(M.validate(single,{frontier:{seen:['P0001'],enemies:{'P0001:e0':0}}}),single);
  assert.throws(()=>M.validate(single,{frontier:{seen:[],enemies:{'P0001:e0':0}}}),/Avant-postes 217/);
  assert.throws(()=>M.validate(single,{frontier:{seen:['P0001'],enemies:{'P0001:e0':12,'P0002:e0':0}}}),/Avant-postes 217/);
  // v2 : ce qu'un convoi a rapporté figure dans les prélèvements du même lieu, dans la même sauvegarde.
  const ledger=taken=>({frontier:{seen:['P0001'],enemies:{'P0001:e0':0},taken}});
  assert.deepEqual(M.validate(single,ledger({'P0001:0:3':10,'P0001:out:0':6})),single);
  assert.deepEqual(M.validate(single,ledger({'P0001:0:3':40})),single,'la fouille à la main s’ajoute au registre');
  assert.throws(()=>M.validate(single,ledger({'P0001:0:3':10,'P0002:0:1':50})),/Avant-postes 217/);
  assert.throws(()=>M.validate(single,ledger({})),/Avant-postes 217/);
  // v1 → v2 : validation aux bornes de la première tranche, puis conversion sans perte du lieu.
  const v1={version:1,active:true,posts:[post('P0001',{hauled:bag({wood:80,scrap:48,stone:32}),note:'empty',sent:0}),post('P0002'),post('P0003',{note:'nofuel',sent:0})]};
  assert.deepEqual(M.validate(v1),{version:2,active:true,posts:v1.posts.map(p=>({id:p.id,garrison:R.garrison,founded:p.founded,convoy:p.convoy,hauled:bag({}),note:'held',sent:0}))});
  assert.equal(M.validate(v1,{frontier:{seen:['P0001','P0002','P0003'],enemies:{'P0001:e0':0,'P0002:e1':0,'P0003:e0':0},taken:{}}}).posts.length,3,'un état v1 n’a rien écrit dans les prélèvements : aucun rapprochement exigé');
  assert.deepEqual(M.validate({version:1,active:false,posts:[]}),M.initial());
  for(const raw of [bad(many(4),1),bad([post('P0001',{note:'unfed'})],1),bad([post('P0001',{hauled:bag({wood:161})})],1),bad([post('P0001',{hauled:bag({wood:100,scrap:100})})],1),
    bad([post('P0001',{sent:17})],1),{version:1,active:false,posts:[post('P0001')]}])assert.throws(()=>M.validate(raw),/Avant-postes 217/);
  assert.throws(()=>M.validate(v1,{frontier:{seen:['P0001'],enemies:{'P0001:e0':0}}}),/Avant-postes 217/,'v1 : lieux vus et vidés exigés aussi');
});

test('avant-postes 217 : butin réel lu chez son propriétaire, côté de route et lot de convoi sans effet de bord',()=>{
  const g=campaign(),w=g.frontier.world(),sites=infested(g).slice(0,12),before=JSON.stringify(w.pois.slice(0,200)),ledger=JSON.stringify(g.serialize().frontier.taken);
  assert.equal(typeof g.frontier.siteStock,'function');assert.equal(typeof g.frontier.takeFromSite,'function');
  let withStock=0,withLock=0;
  for(const p of sites){
    const s=stockOf(g,p),list=containers(g,p);
    assert.deepEqual(stockOf(g,p),s);assert.deepEqual(Object.keys(s).sort(),['free','locked']);
    // Le relevé est exactement la somme des contenants du lieu : ouverts d'un côté, sous clé de l'autre.
    for(const k of C.RESOURCE_KEYS){
      near(s.free[k],list.filter(b=>b.resource===k&&!closed(g,b)).reduce((n,b)=>n+b.amount,0),p.id+' libre '+k);
      near(s.locked[k],list.filter(b=>b.resource===k&&closed(g,b)).reduce((n,b)=>n+b.amount,0),p.id+' sous clé '+k);
    }
    for(const b of list)assert.match(b.id,new RegExp('^'+p.id+':(-?\\d+:\\d+|car:\\d+|out:\\d+)$'),'identifiants du registre régional');
    if(C.bagTotal(s.free)>0)withStock++;if(C.bagTotal(s.locked)>0)withLock++;
  }
  assert.ok(withStock>=6,'la plupart des lieux infestés ont un butin prenable');assert.ok(withLock>=1,'des contenants restent sous clé');
  // Lecture seule ; demandes invalides : rien n'est pris, rien n'est écrit.
  assert.equal(g.frontier.siteStock('P9999'),null);assert.equal(g.frontier.siteStock(7),null);assert.equal(g.frontier.siteStock('T1_2_3'),null);
  for(const [id,k,n] of [['P9999','scrap',5],[sites[0].id,'gold',5],[sites[0].id,'scrap',0],[sites[0].id,'scrap',-3],[sites[0].id,'scrap',NaN],[sites[0].id,'scrap',Infinity],[7,'scrap',5]])assert.equal(g.frontier.takeFromSite(id,k,n),0);
  assert.equal(JSON.stringify(g.serialize().frontier.taken),ledger,'le registre des prélèvements n’a pas bougé');
  assert.equal(JSON.stringify(w.pois.slice(0,200)),before,'le monde n’est pas touché');
  assert.deepEqual([[5,1],[-5,1],[1,5],[1,-5],[3,3],[-3,-4]].map(([x,y])=>M.sideOf(x,y)),['east','west','south','north','east','north']);
  const full=()=>1e9;
  let l=M.lot(bag({wood:10,scrap:30}),full);near(l.total,R.convoy.lot);assert.deepEqual(l.bag,bag({wood:10,scrap:R.convoy.lot-10}));
  l=M.lot(bag({wood:3}),full);assert.deepEqual(l.bag,bag({wood:3}));
  l=M.lot(bag({wood:10,scrap:30}),k=>k==='wood'?0:4);assert.deepEqual(l.bag,bag({scrap:4}),'jamais plus que la place du dépôt');
  near(M.lot(bag({}),full).total,0);
});

test('avant-postes 217 : takeFromSite suit le chemin de la fouille — ordre fixe, bornes, contenants sous clé intacts, format sauvegardé',()=>{
  const g=campaign(),p=infested(g).find(q=>{const s=stockOf(g,q);return C.bagTotal(s.free)>30&&C.bagTotal(s.locked)>0;});
  assert.ok(p,'un lieu avec butin libre et butin sous clé');
  const list=containers(g,p),s=stockOf(g,p),k=C.RESOURCE_KEYS.find(r=>s.free[r]>20),open=list.filter(b=>b.resource===k&&!closed(g,b)),shut=list.filter(b=>closed(g,b));
  // Prise partielle : le premier contenant ouvert de la ressource, dans l'ordre du lieu.
  const part=Math.min(open[0].amount,5)-1;
  near(g.frontier.takeFromSite(p.id,k,part),part);near(g.frontier.takenAmount(open[0].id),part);
  assert.deepEqual(takenAt(g,p).map(([id])=>id),[open[0].id]);near(stockOf(g,p).free[k],s.free[k]-part);
  // Demande supérieure au contenu : tout le libre de cette ressource, jamais plus ; chaque contenant plafonné à son contenu.
  near(g.frontier.takeFromSite(p.id,k,1e6),s.free[k]-part);near(stockOf(g,p).free[k],0);
  for(const b of open)near(g.frontier.takenAmount(b.id),b.amount,b.id);
  assert.equal(g.frontier.takeFromSite(p.id,k,10),0,'épuisé : plus rien');
  for(const b of shut)assert.equal(g.frontier.takenAmount(b.id),0,'sous clé : intact '+b.id);
  assert.deepEqual(stockOf(g,p).locked,s.locked);
  // Les autres lieux et les autres ressources ne sont pas touchés ; le registre garde son format et sa validation.
  const taken=g.serialize().frontier.taken;
  assert.deepEqual(Object.keys(taken).sort(),open.map(b=>b.id).sort());
  for(const [id,v] of Object.entries(taken))assert.ok(/^P\d{4}:(-?\d+:\d+|car:\d+|out:\d+)$/.test(id)&&v>0&&v<=1000);
  const data=copy(g.serialize());assert.equal(g.restoreSave(data),true,'la sauvegarde est acceptée par le validateur du registre régional');
  for(const b of open)near(g.frontier.takenAmount(b.id),b.amount);near(stockOf(g,p).free[k],0);
  // Un prélèvement supérieur au contenant reste refusé par le validateur existant.
  const forged=copy(data);forged.frontier.taken[open[0].id]=open[0].amount+1;
  let refused=false;try{refused=g.restoreSave(forged)===false;}catch(error){refused=true;}assert.equal(refused,true);
});

test('avant-postes 217 : campagne neuve active, rien de changé au départ, aucun avant-poste avant l’âge requis',()=>{
  const g=campaign();
  assert.deepEqual(saved(g),M.fresh());assert.equal(g.outposts217.active(),true);assert.equal(g.outposts217.open(),false);
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
  const act=O.actions().find(a=>a.id==='found-'+p.id);assert.equal(act.disabled,false,act.reason);assert.match(act.description,/Coût : 2 fusiliers et 30 bois, 20 ferraille, 20 nourriture, 20 munitions, puis 2 nourriture par vague\. Butin du lieu : .*Route de .*, côté (est|ouest|nord|sud) de D-17\./);
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
  // Aucun plafond par âge : la seule limite est celle des hommes. Un fusilier restant ne suffit pas, deux de plus suffisent.
  clearSite(g,other);assert.equal(riflemen(g),1);
  assert.match(O.foundQuote(other.id).reason,/Il faut 2 fusiliers présents dans la cité pour la garnison\./);assert.equal(O.found(other.id).ok,false);assert.equal(saved(g).posts.length,1);
  const offer=O.actions().find(a=>a.id==='found-'+other.id);assert.equal(offer.disabled,true);assert.match(offer.reason,/2 fusiliers présents/);
  soldiers(g,1);assert.equal(O.foundQuote(other.id).ok,true,'même âge, deuxième avant-poste permis');
  assert.equal(row(g,'Avant-postes'),'1 tenu : 2 fusiliers hors de la cité, 2 nourriture par vague. Pas de plafond : la limite est celle des hommes et du stock.');
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

test('avant-postes 217 : le convoi roule seul, lot borné, butin RÉEL du lieu qui s’épuise et le dit',()=>{
  const {g,p}=ready(),O=g.outposts217,notes=watch(g);
  // Relevé du module seul : l'économie de la cité (rations, production) ne brouille pas le compte.
  const tick=()=>O.tick(.25);
  g.resources.fuel=100;g.storage=Math.max(g.storage,2000);
  assert.equal(O.found(p.id).ok,true);
  const stock=stockOf(g,p),total=C.bagTotal(stock.free),shut=containers(g,p).filter(b=>closed(g,b)),start={...g.resources},wave0=g.wave;
  assert.ok(total>R.convoy.lot*2,'un lieu avec plusieurs convois de butin');assert.deepEqual(O.stock(p.id),stock);assert.deepEqual(O.posts()[0].left,stock.free);
  const delta=(from,k)=>g.resources[k]-from[k];
  g.phase='calm';tick();assert.equal(count(notes,'Convoi de'),0,'pas de convoi la vague de l’établissement');assert.deepEqual({...g.resources},start,'ni entretien la vague de l’établissement');
  g.wave=wave0+1;g.phase='assault';tick();assert.equal(count(notes,'Convoi de'),0,'jamais pendant l’assaut');
  g.phase='calm';tick();tick();
  assert.equal(count(notes,'arrivé seul par la route gardée'),1,'un seul convoi par vague');
  const first=O.posts()[0];near(first.sent,R.convoy.lot);assert.equal(first.note,'delivered');near(C.bagTotal(first.hauled),first.sent);
  for(const k of C.RESOURCE_KEYS){
    near(delta(start,k),first.hauled[k]-(k==='fuel'?R.convoy.fuel:0)-(R.upkeep[k]||0),'dépôt '+k);
    assert.ok(first.hauled[k]<=stock.free[k]+1e-9,'jamais plus que ce que le lieu contient : '+k);
    near(stockOf(g,p).free[k],stock.free[k]-first.hauled[k],'le lieu a perdu ce que le dépôt a reçu : '+k);
  }
  near(takenSum(g,p),first.sent,'écrit dans le registre des prélèvements');
  assert.match(row(g,first.name),/2 fusiliers en garnison · route gardée côté (est|ouest|nord|sud), .* · reste sur place : .* · dernier convoi : 16 unités livrées \(vague \d+\)\./);
  // Pas de carburant : le convoi reste sur place, rien n'est livré ni pris au lieu ; la garnison, elle, est ravitaillée et garde la route.
  const fuel=g.resources.fuel;g.resources.fuel=R.convoy.fuel-1;g.wave++;let held={...g.resources};tick();
  assert.equal(O.posts()[0].note,'nofuel');for(const k of C.RESOURCE_KEYS)near(delta(held,k),-(R.upkeep[k]||0),k);
  assert.equal(count(notes,'il faut 2 carburant au dépôt'),1);near(takenSum(g,p),first.sent);assert.equal(O.roads()[0].guarded,true);
  g.resources.fuel=fuel;
  // Dépôt plein : rien n'entre, rien n'est brûlé, rien ne quitte le lieu.
  const storage=g.storage;g.storage=0;g.wave++;held={...g.resources};tick();
  assert.equal(O.posts()[0].note,'full');for(const k of C.RESOURCE_KEYS)near(delta(held,k),-(R.upkeep[k]||0),k);
  assert.equal(count(notes,'le dépôt n’a pas la place'),1);near(takenSum(g,p),first.sent);g.storage=storage;
  // Jusqu'à épuisement : le total livré est exactement le butin prenable du lieu, puis plus rien.
  let guard=0;while(O.posts()[0].note!=='empty'&&guard++<60){g.wave++;tick();}
  const done=O.posts()[0];for(const k of C.RESOURCE_KEYS)near(done.hauled[k],stock.free[k],k);near(C.bagTotal(done.left),0);near(takenSum(g,p),total);
  assert.equal(count(notes,'c’était le dernier convoi'),1);
  const lots=count(notes,'arrivé seul par la route gardée');assert.equal(lots,Math.ceil(total/R.convoy.lot));
  // Les contenants sous clé n'ont pas été forcés : ils restent au Commandant.
  assert.ok(shut.length>0);for(const b of shut)assert.equal(g.frontier.takenAmount(b.id),0,b.id);assert.deepEqual(stockOf(g,p).locked,stock.locked);
  for(const b of containers(g,p).filter(b=>!shut.some(s=>s.id===b.id)))near(g.frontier.takenAmount(b.id),b.amount,'vidé : '+b.id);
  // Lieu vide : plus de convoi ni de carburant ; l'entretien de la garnison continue, la route reste gardée.
  const after={...g.resources};
  for(let i=0;i<5;i++){g.wave++;tick();}
  for(const k of C.RESOURCE_KEYS)near(delta(after,k),-5*(R.upkeep[k]||0),k);
  assert.equal(count(notes,'arrivé seul par la route gardée'),lots);assert.equal(count(notes,'Convoi : il ne reste rien'),0,'déjà dit par le dernier convoi');
  assert.match(row(g,done.name),/reste sur place : rien \(sous clé : .*\) · plus rien à prendre, plus de convoi\./);
  assert.equal(O.roads().length,1,'la route reste gardée');assert.equal(O.roads()[0].guarded,true);
  assert.equal(g.restoreSave(copy(g.serialize())),true,'registre accepté par ses validateurs après épuisement');
});

test('avant-postes 217 : ce que le Commandant a pris à la main n’est plus au convoi, et inversement',()=>{
  const {g,p}=ready(),O=g.outposts217,notes=watch(g),tick=()=>O.tick(.25);
  g.resources.fuel=100;g.storage=Math.max(g.storage,2000);
  const stock=stockOf(g,p),total=C.bagTotal(stock.free),open=containers(g,p).filter(b=>!closed(g,b));
  // Le Commandant vide un contenant et en entame un autre avant d'établir l'avant-poste.
  const whole=open[0],half=open.find(b=>b.id!==whole.id&&b.amount>4),mine=whole.amount+half.amount/2;
  handTake(g,whole.id,whole.amount);handTake(g,half.id,half.amount/2);
  near(C.bagTotal(stockOf(g,p).free),total-mine,'le relevé du lieu tient compte de la fouille');
  assert.equal(O.found(p.id).ok,true);assert.match(O.actions().find(a=>a.id==='abandon-'+p.id).label,/Abandonner/);
  let guard=0;while(O.posts()[0].note!=='empty'&&guard++<60){g.wave++;g.phase='calm';tick();}
  const done=O.posts()[0];
  near(C.bagTotal(done.hauled),total-mine,'le convoi ne rapporte que ce qui restait');
  near(takenSum(g,p),total,'fouille et convois ensemble : exactement le butin prenable');
  near(g.frontier.takenAmount(whole.id),whole.amount);near(g.frontier.takenAmount(half.id),half.amount);
  // Inversement : ce que le convoi a pris n'est plus à la fouille (le registre lu par la touche E indique zéro restant).
  const Survey=require('../src/frontier-survey.js'),w=g.frontier.world(),taken=g.serialize().frontier.taken;
  for(const b of open)near(Math.max(0,b.amount-(taken[b.id]||0)),0,'plus rien à fouiller : '+b.id);
  assert.equal(typeof Survey.targets,'function');assert.equal(w.containers(p.x,p.y,60,0,null).filter(b=>b.poi===p.id&&open.some(o=>o.id===b.id)).every(b=>b.amount-g.frontier.takenAmount(b.id)<1e-9),true);
  // Second avant-poste sur un lieu que le Commandant a entièrement vidé : aucun convoi, rien de créé.
  const lots=count(notes,'arrivé seul par la route gardée');assert.equal(lots,Math.ceil((total-mine)/R.convoy.lot));
  assert.equal(O.abandon(p.id).ok,true);assert.equal(O.found(p.id).ok,true,'repris');
  const res={...g.resources};g.wave++;tick();
  assert.equal(O.posts()[0].note,'empty');assert.equal(count(notes,'Convoi : il ne reste rien à prendre à'),1);assert.equal(count(notes,'arrivé seul par la route gardée'),lots);
  for(const k of C.RESOURCE_KEYS)near(g.resources[k]-res[k],-(R.upkeep[k]||0),k);
});

test('avant-postes 217 : entretien par vague — garnison non ravitaillée, route non gardée et pas de convoi, jusqu’au ravitaillement',()=>{
  const {g,p}=ready(),O=g.outposts217,notes=watch(g),tick=()=>O.tick(.25),w=g.frontier.world();
  g.resources.fuel=100;g.storage=Math.max(g.storage,2000);
  assert.equal(O.found(p.id).ok,true);
  const core=g.core(),side=O.roads()[0].side,dir={east:[1,0],west:[-1,0],south:[0,1],north:[0,-1]}[side],at={x:core.x+dir[0]*500,y:core.y+dir[1]*500};
  assert.equal(typeof O.guards(at),'string');
  // Dépôt sans nourriture : rien n'est débité, rien ne part, la route n'est plus gardée.
  const food=g.resources.food;g.resources.food=R.upkeep.food-1;g.wave++;g.phase='calm';let held={...g.resources};tick();
  assert.equal(O.posts()[0].note,'unfed');assert.deepEqual({...g.resources},held);assert.equal(takenSum(g,p),0);
  assert.equal(O.guards(at),null,'route non gardée');assert.equal(O.roads()[0].guarded,false);assert.equal(O.roads().length,1,'l’avant-poste tient toujours le lieu');
  assert.equal(count(notes,'non ravitaillé : il faut 2 nourriture au dépôt à chaque vague'),1);
  assert.match(row(g,O.posts()[0].name),/route non gardée côté .* · garnison non ravitaillée \(vague \d+\), pas de convoi\./);
  assert.equal(saved(g).posts[0].note,'unfed');assert.equal(g.restoreSave(copy(g.serialize())),true);assert.equal(O.guards(at),null,'toujours non gardée après reprise');
  g.resources.food=R.upkeep.food-1;g.wave++;tick();assert.equal(count(notes,'non ravitaillé'),1,'dit une fois');assert.equal(O.posts()[0].note,'unfed');
  // Ravitaillée : entretien payé, route de nouveau gardée, le convoi repart dans la même accalmie.
  g.resources.food=food;g.wave++;held={...g.resources};tick();
  assert.equal(count(notes,'de nouveau ravitaillé : sa route est gardée'),1);assert.equal(O.posts()[0].note,'delivered');
  assert.equal(typeof O.guards(at),'string');assert.equal(O.roads()[0].guarded,true);
  near(g.resources.food-held.food,(O.posts()[0].hauled.food||0)-R.upkeep.food,'entretien débité une fois');near(takenSum(g,p),R.convoy.lot);
  assert.equal(w.pois.includes(p),true);
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

test('avant-postes 217 : aucun plafond par âge — quatre avant-postes dès l’âge d’ouverture, limités par les fusiliers',()=>{
  const {g,list}=ready(R.startAge,5),O=g.outposts217,notes=watch(g);
  assert.equal(O.open(),true);assert.equal(riflemen(g),R.garrison*5+1);
  // Quatre de suite au même âge (l'ancien plafond était un, puis trois au plus à l'âge 9).
  for(const q of list.slice(0,4)){Object.assign(g.resources,{wood:200,scrap:200,food:300,ammo:200});assert.deepEqual(O.found(q.id),{ok:true},q.id);}
  assert.deepEqual(saved(g).posts.map(q=>q.id),list.slice(0,4).map(q=>q.id).sort());assert.equal(riflemen(g),R.garrison+1);
  assert.equal(row(g,'Avant-postes'),'4 tenus : 8 fusiliers hors de la cité, 8 nourriture par vague. Pas de plafond : la limite est celle des hommes et du stock.');
  assert.ok(O.actions().some(a=>a.id==='found-'+list[4].id),'l’offre suivante reste ouverte');
  // La limite réelle : les hommes. Un fusilier de moins que la garnison : refus sans débit.
  const spare=g.units.filter(u=>u.kind==='soldier'&&!u.dead);spare[0].regionAbsent=true;spare[1].regionAbsent=true;
  const stock={...g.resources};assert.match(O.found(list[4].id).reason,/Il faut 2 fusiliers présents dans la cité pour la garnison\./);
  assert.deepEqual({...g.resources},stock);assert.equal(saved(g).posts.length,4);spare[0].regionAbsent=false;spare[1].regionAbsent=false;
  // Le coût suit le nombre : un convoi et un entretien par avant-poste et par vague.
  g.storage=Math.max(g.storage,2000);g.wave++;g.phase='calm';g.resources.fuel=50;g.resources.food=100;const before={...g.resources};O.tick(.25);
  assert.equal(count(notes,'arrivé seul par la route gardée'),4);
  const hauled=k=>O.posts().reduce((n,q)=>n+q.hauled[k],0);
  near(before.fuel-g.resources.fuel,4*R.convoy.fuel-hauled('fuel'),'un convoi par avant-poste');near(before.food-g.resources.food,4*R.upkeep.food-hauled('food'),'un entretien par avant-poste');
  // Stock court : seuls les premiers du registre sont ravitaillés, les autres ne gardent plus leur route.
  g.wave++;g.resources.food=R.upkeep.food*2+1;g.resources.fuel=0;O.tick(.25);
  assert.deepEqual(O.posts().map(q=>q.note==='unfed'),[false,false,true,true]);assert.deepEqual(O.roads().map(r=>r.guarded),[true,true,false,false]);
  assert.equal(g.restoreSave(copy(g.serialize())),true);assert.equal(saved(g).posts.length,4,'quatre avant-postes sauvegardés et repris');
});

test('avant-postes 217 : sauvegarde et reprise ; sauvegarde abîmée refusée',()=>{
  const {g,p}=ready(),O=g.outposts217;g.resources.fuel=50;g.storage=Math.max(g.storage,2000);
  assert.equal(O.found(p.id).ok,true);g.wave++;g.phase='calm';tick(g);
  const data=copy(g.serialize()),mine=data.expansions127.modules.outposts217,ledger=copy(data.frontier.taken);
  assert.equal(mine.version,2);assert.equal(mine.posts[0].note,'delivered');near(C.bagTotal(mine.posts[0].hauled),R.convoy.lot);
  near(Object.values(ledger).reduce((a,b)=>a+b,0),R.convoy.lot,'le convoi est dans les prélèvements sauvegardés');
  const left=copy(stockOf(g,p));
  assert.equal(g.restoreSave(copy(data)),true);
  assert.deepEqual(saved(g),mine);assert.deepEqual(g.serialize().frontier.taken,ledger);assert.deepEqual(stockOf(g,p),left,'le butin restant est le même après reprise');
  assert.equal(O.roads().length,1);assert.equal(riflemen(g),1,'la garnison reste hors de la cité après reprise');
  tick(g);assert.deepEqual(saved(g),mine,'pas de second convoi dans la même vague après reprise');assert.deepEqual(g.serialize().frontier.taken,ledger);
  const broken=patch=>{const d=copy(data);patch(d.expansions127.modules.outposts217,d);return d;};
  const key=C.RESOURCE_KEYS.find(k=>mine.posts[0].hauled[k]>0);
  for(const d of [broken(m=>{m.posts[0].id='P9999';}),broken(m=>{m.posts[0].sent=99;}),broken(m=>{m.active=false;}),broken(m=>{m.posts[0].hauled.wood=-1;}),broken(m=>{m.version=3;}),
    broken(m=>{m.posts[0].hauled[key]+=5;}),broken((m,d)=>{d.frontier.taken={};}),
    broken((m,d)=>{d.frontier.seen=d.frontier.seen.filter(id=>id!==p.id);delete d.frontier.enemies[p.id+':e0'];for(const k of Object.keys(d.frontier.enemies))if(k.startsWith(p.id+':'))delete d.frontier.enemies[k];d.frontier.kills=Object.values(d.frontier.enemies).filter(h=>h===0).length;})]){
    let refused=false;try{refused=g.restoreSave(d)===false;}catch(error){refused=true;}
    assert.equal(refused,true);assert.deepEqual(saved(g),mine,'état conservé après refus');
  }
});

test('avant-postes 217 : migration v1 → v2 — l’avant-poste garde son lieu et repart sur le butin réel restant',()=>{
  const {g,list}=ready(R.startAge,2),O=g.outposts217,[p,q]=list,notes=watch(g);g.resources.fuel=50;g.storage=Math.max(g.storage,2000);
  assert.equal(O.found(p.id).ok,true);assert.equal(O.found(q.id).ok,true);
  // Le Commandant a déjà fouillé un contenant du premier lieu : ce prélèvement d'ancienne campagne ne doit pas bouger.
  const first=containers(g,p).find(b=>!closed(g,b));handTake(g,first.id,first.amount);
  const data=copy(g.serialize()),wave=g.wave,taken=copy(data.frontier.taken),stock=copy(stockOf(g,p)),other=copy(stockOf(g,q));
  // État tel que la première tranche l'écrivait : fonds dérivé de l'emprise, entamé pour l'un, « vide » pour l'autre.
  const ids=[p.id,q.id].sort();
  data.expansions127.modules.outposts217={version:1,active:true,posts:[
    {id:ids[0],garrison:R.garrison,founded:wave,convoy:wave,hauled:bag({wood:16,scrap:16}),note:'delivered',sent:16},
    {id:ids[1],garrison:R.garrison,founded:wave,convoy:wave,hauled:bag({scrap:80,stone:48,wood:32}),note:'empty',sent:0}]};
  const stockBefore={...g.resources},men=riflemen(g);
  assert.equal(g.restoreSave(copy(data)),true,'une sauvegarde v1 est acceptée');
  assert.deepEqual(saved(g),{version:2,active:true,posts:ids.map(id=>({id,garrison:R.garrison,founded:wave,convoy:wave,hauled:bag({}),note:'held',sent:0}))});
  assert.deepEqual(g.serialize().frontier.taken,taken,'les prélèvements existants ne changent pas');
  assert.deepEqual({...g.resources},stockBefore,'rien n’est repris au dépôt, rien n’est rendu');assert.equal(riflemen(g),men,'les garnisons restent en place');
  assert.equal(O.roads().length,2);assert.deepEqual(O.roads().map(r=>r.guarded),[true,true]);
  assert.deepEqual(stockOf(g,p),stock);assert.deepEqual(stockOf(g,q),other,'le butin réel restant est celui du registre régional');
  // Pas de convoi rejoué dans la vague déjà servie ; à la suivante, les deux repartent sur le butin réel, même l'ancien « vide ».
  g.phase='calm';O.tick(.25);assert.equal(count(notes,'arrivé seul par la route gardée'),0);
  g.wave++;O.tick(.25);assert.equal(count(notes,'arrivé seul par la route gardée'),2);
  for(const post of O.posts()){assert.equal(post.note,'delivered');near(C.bagTotal(post.hauled),R.convoy.lot);}
  near(takenSum(g,p),first.amount+R.convoy.lot);near(takenSum(g,q),R.convoy.lot);near(g.frontier.takenAmount(first.id),first.amount,'le contenant fouillé n’est pas repris');
  // L'état converti se sauvegarde en v2 et se relit ; un v1 abîmé reste refusé.
  const again=copy(g.serialize());assert.equal(again.expansions127.modules.outposts217.version,2);assert.equal(g.restoreSave(copy(again)),true);
  const kept=saved(g),bad=copy(data);bad.expansions127.modules.outposts217.posts[0].hauled.wood=500;
  let refused=false;try{refused=g.restoreSave(bad)===false;}catch(error){refused=true;}assert.equal(refused,true);assert.deepEqual(saved(g),kept);
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
  assert.equal((source.match(/C\.spend\(/g)||[]).length,2,'deux débits : l’établissement et l’entretien');
  for(const gone of ['holding','R.hold','R.caps','frontier.taken','state.taken','.taken['])assert.equal(source.includes(gone),false,gone+' : le module n’écrit pas le registre régional lui-même');
  assert.equal((source.match(/takeFromSite\(/g)||[]).length,1,'un seul point de prélèvement : le convoi, chez le propriétaire');assert.equal((source.match(/g\.resources\.fuel-=/g)||[]).length,1,'un débit : le carburant du convoi');
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
  const touched=Object.keys(g.serialize().frontier.taken);
  assert.ok(touched.length>0&&touched.every(id=>id.startsWith(p.id+':')),'seuls les contenants du lieu tenu sont prélevés');
  // Empreinte de monde : une région neuve de même graine donne les mêmes lieux, contenants compris.
  const twin=campaign().frontier.world();assert.equal(JSON.stringify(twin.pois.slice(0,300)),pois);
  assert.deepEqual(twin.plan(twin.site(p.id),p.levels[0]).objects.map(b=>[b.id,b.resource,b.amount]),w.plan(p,p.levels[0]).objects.map(b=>[b.id,b.resource,b.amount]));
});
