'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),B=require('../src/balance217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.Balance217Rules,S=R.signature,M=R.morale,D=M.depart,T=b=>globalThis.DeadwallTactics.footprint(b);
const legacyState=()=>({version:1,signatureCurve:'legacy',moraleTiers:false,low:0,departs:0});
const freshState=()=>({version:1,signatureCurve:'open',moraleTiers:true,low:0,departs:0});
const near=(a,b,message,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,(message||'')+' : '+a+' ≠ '+b);
const open=s=>B.attraction(s,'open'),capped=s=>B.attraction(s,'legacy');
const DIFFICULTIES=['story','standard','brutal'].map(id=>C.DIFFICULTIES[id]);
// Effectif d'origine, recopié ici à dessein : c'est la référence que le moteur ne doit pas quitter.
const legacyTotal=(wave,d,s)=>Math.max(8,Math.floor((10+wave*5+Math.pow(wave,1.62)*2.35)*d.enemyCount*(1+Math.max(0,Math.min(.8,s/360)))));

test('équilibrage 217 : règles gelées dans le cœur, paliers ordonnés, plancher hérité',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(S)&&Object.isFrozen(M)&&Object.isFrozen(M.tiers)&&Object.isFrozen(D)&&M.tiers.every(Object.isFrozen));
  assert.deepEqual({...S},{cap:.8,divisor:360,gain:.234,scale:120});
  assert.equal(DIFFICULTIES.length,3);assert.ok(DIFFICULTIES.every(Boolean));
  assert.deepEqual(M.tiers.map(t=>[t.min,t.factor]),[[60,1],[40,.94],[20,.88],[0,.82]]);
  for(let i=1;i<M.tiers.length;i++){assert.ok(M.tiers[i].min<M.tiers[i-1].min);assert.ok(M.tiers[i].factor<M.tiers[i-1].factor);}
  assert.equal(M.tiers[0].factor,1);assert.equal(M.tiers.at(-1).min,0);assert.equal(M.tiers.at(-1).factor,.82,'jamais pire que le ×0,82 d’origine');
  assert.ok(D.below>0&&D.below<M.tiers.at(-2).min&&D.warnSeconds>0&&D.warnSeconds<D.seconds&&D.interval>0);
  assert.deepEqual({...D},{below:10,warnSeconds:120,seconds:300,interval:180});
});

test('équilibrage 217 : sous +80 %, la courbe ouverte est la courbe d’origine au flottant près',()=>{
  const grid=[];for(let s=0;s<=288;s++)grid.push(s);grid.push(-5,.001,17.3,143.999,287.5,287.999999,288);
  for(const s of grid){
    assert.equal(open(s),capped(s),'signature '+s);assert.equal(open(s),Math.max(0,Math.min(.8,s/360)),'signature '+s);
    for(const d of DIFFICULTIES)for(const wave of [1,2,5,12,30,100])assert.deepEqual(C.wavePlan(wave,d,s,open),C.wavePlan(wave,d,s),'vague '+wave+', signature '+s);
  }
  assert.equal(open(288),.8,'continuité : le raccord se fait exactement au plafond hérité');
  assert.ok(open(288+1e-9)-open(288)>=0&&open(288+1e-9)-open(288)<1e-9);near(open(289)-open(288),S.gain*Math.log1p(1/S.scale),'pente au raccord');
  for(const s of [NaN,Infinity,-Infinity])assert.equal(Object.is(open(s),capped(s)),true,'valeur hors domaine : comme l’héritée');
  assert.throws(()=>B.attraction(100,'autre'),/Courbe/);
});

test('équilibrage 217 : au-delà, l’attirance monte toujours, de plus en plus lentement',()=>{
  let previous=open(288),gain=Infinity;
  for(let s=289;s<=6000;s++){const now=open(s),step=now-previous;assert.ok(now>previous,'croissance stricte à '+s);assert.ok(step<gain+1e-12,'ralentissement à '+s);gain=step;previous=now;}
  assert.ok(open(1e6)>open(1e5)&&open(1e9)>open(1e6),'jamais de plafond');
  for(const s of [289,420,600,2600,1e5])assert.equal(capped(s),.8,'l’héritée reste plafonnée');
  near(open(600),1.10,'Grande métropole : environ +110 %',.01);near(open(2600),1.50,'Mégaville III : environ +150 %',.01);
  near(open(600),.8+.234*Math.log(1+312/120),'forme retenue');
  // Effectifs : plus nombreux qu'en hérité dès que la signature dépasse 288, dans les trois difficultés.
  for(const d of DIFFICULTIES)for(const wave of [8,20,60]){
    assert.ok(C.wavePlan(wave,d,600,open).total>C.wavePlan(wave,d,600).total);
    assert.ok(C.wavePlan(wave,d,2600,open).total>C.wavePlan(wave,d,600,open).total);
    const plan=C.wavePlan(wave,d,2600,open);assert.equal(C.spawnCount(plan.composition),plan.total,'composition complète');
    assert.equal(plan.fronts,C.wavePlan(wave,d,0).fronts);assert.equal(plan.spawnInterval,C.wavePlan(wave,d,0).spawnInterval);
  }
});

test('équilibrage 217 : C.wavePlan sans quatrième argument reste strictement celui d’origine',()=>{
  for(const d of DIFFICULTIES)for(const wave of [1,2,3,7,12,20,45,100,500])for(const s of [0,50,143.2,287,288,289,360,420,600,1000,2600,1e5]){
    const plan=C.wavePlan(wave,d,s);
    assert.equal(plan.total,legacyTotal(wave,d,s),'vague '+wave+', signature '+s);
    assert.equal(C.spawnCount(plan.composition),plan.total);
    for(const same of [C.wavePlan(wave,d,s,null),C.wavePlan(wave,d,s,undefined),C.wavePlan(wave,d,s,capped)])assert.deepEqual(same,plan);
  }
  assert.deepEqual(C.wavePlan(9),C.wavePlan(9,C.DIFFICULTIES.standard,0,null));
  assert.equal(C.wavePlan.length,1,'aucun paramètre obligatoire ajouté');
});

test('équilibrage 217 : état validé strictement, absent des anciennes sauvegardes = hérité',()=>{
  assert.deepEqual(B.validate(undefined),legacyState());assert.deepEqual(B.initial(),legacyState());assert.deepEqual(B.fresh(),freshState());
  assert.deepEqual([0,299.99,300,479.99,480,660].map(B.departSlots),[0,0,1,1,2,3]);
  const ok={...freshState(),low:481.5,departs:2};assert.deepEqual(B.validate(ok),ok);assert.notEqual(B.validate(ok),ok);
  for(const good of [freshState(),legacyState(),{...freshState(),low:481.5,departs:0},{...freshState(),signatureCurve:'legacy'},{...legacyState(),signatureCurve:'open'}])assert.deepEqual(B.validate(good),good);
  for(const bad of [null,[],'217',{},{...ok,version:2},{...ok,extra:1},(({departs,...rest})=>rest)(ok),{...ok,signatureCurve:'libre'},{...ok,signatureCurve:null},{...ok,moraleTiers:1},
    {...ok,low:-1},{...ok,low:NaN},{...ok,low:'12'},{...ok,low:1e10},{...ok,departs:3},{...ok,departs:-1},{...ok,departs:1.5},{...ok,low:100,departs:1},
    {...legacyState(),low:5},{...ok,moraleTiers:false}])assert.throws(()=>B.validate(bad),/Équilibrage 217/);
});

test('équilibrage 217 : facteur exact à chaque borne de palier',()=>{
  for(const [morale,factor] of [[100,1],[60,1],[59.999,.94],[40,.94],[39.999,.88],[20,.88],[19.999,.82],[10,.82],[0,.82]])assert.equal(B.tier(morale).factor,factor,'moral '+morale);
});

function campaign(){const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();return g;}
const state=g=>g.serialize().expansions127.modules.balance217;
function old(g){const data=g.serialize();delete data.expansions127.modules.balance217;assert.equal(g.restoreSave(data),true);return g;}
const row=(g,label)=>g.balance217.overview().rows.find(r=>r.label===label).value;
const watch=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const count=(notes,start)=>notes.filter(t=>t.startsWith(start)).length;
const mine=notes=>notes.filter(t=>t.startsWith('Moral'));
const expectedPlan=(g,curve)=>{const base=C.wavePlan(g.wave,g.difficulty,g.signature,curve),adapted=C.Siege.adaptPlan(base,C.ENEMIES,g.world.seed);return adapted.profile?adapted.plan:base;};

test('équilibrage 217 : une nouvelle campagne suit la courbe ouverte et les paliers ; fiche sans action',()=>{
  const g=campaign();
  assert.deepEqual(state(g),freshState());assert.equal(g.balance217.curveName(),'open');assert.equal(g.balance217.moraleTiers(),true);
  assert.equal(typeof g.balance217.curve(),'function');assert.equal(g.balance217.curve()(600),open(600));
  assert.deepEqual(g.balance217.actions(),[]);assert.deepEqual(g.expansions.get('balance217').actions(),[]);
  assert.match(g.balance217.overview().summary,/sans plafond.*paliers/);assert.match(row(g,'Courbe de signature'),/^Sans plafond/);
  g.signature=600;assert.equal(row(g,'Attirance actuelle'),'+110 % d’infectés pour une signature de 600.');
  g.signature=144;assert.equal(row(g,'Attirance actuelle'),'+40 % d’infectés pour une signature de 144.');
  g.morale=100;assert.match(row(g,'Moral'),/^100 \/ 100 · aucun ralentissement$/);
  g.morale=45;assert.equal(row(g,'Moral'),'45 / 100 · déplacement des unités, travail des ouvriers (récolte, chantiers, déblaiement) et cadence de tir des fusiliers ×0,94');
  assert.equal(row(g,'Paliers de moral'),'60 et plus : ×1 · 40 à 60 : ×0,94 · 20 à 40 : ×0,88 · moins de 20 : ×0,82');
  assert.match(row(g,'Départs'),/^Aucun tant que le moral reste à 10 ou plus\. En dessous pendant 05:00 de suite, un ouvrier part, puis un autre toutes les 03:00\.$/);
  const doc=fs.readFileSync(path.join(__dirname,'../src/expansion-ui.js'),'utf8');
  for(const table of ['ORDER','GROUPS','API_NAMES','LABELS'])assert.ok(doc.split('\n').find(l=>l.includes(table+' ')||l.includes(table+'=')).includes('balance217'),table);
});

test('équilibrage 217 : le plan d’une nouvelle campagne grossit avec une grande signature, pas celui d’une ancienne',()=>{
  const g=campaign();g.wave=12;g.signature=600;g.prepareWave();
  const modern=structuredClone(g.wavePlan),legacy=C.wavePlan(12,g.difficulty,600);
  assert.equal(modern.total,C.wavePlan(12,g.difficulty,600,open).total);assert.ok(modern.total>legacy.total,modern.total+' > '+legacy.total);
  near(modern.total/C.wavePlan(12,g.difficulty,0).total,1+open(600),'effectif proportionnel à l’attirance',.02);
  assert.deepEqual(modern,expectedPlan(g,open));assert.equal(C.spawnCount(modern.composition),modern.total);
  // Sous 288, la nouvelle campagne tire exactement le plan d'origine.
  g.signature=200;g.prepareWave();assert.deepEqual(g.wavePlan,expectedPlan(g,null));
  // Ancienne campagne : même monde, module absent de la sauvegarde.
  old(g);assert.deepEqual(state(g),legacyState());assert.equal(g.balance217.curve(),null);assert.equal(g.balance217.curveName(),'legacy');
  for(const signature of [200,288,600,2600]){g.wave=12;g.signature=signature;g.prepareWave();assert.deepEqual(g.wavePlan,expectedPlan(g,null),'signature '+signature);assert.equal(g.wavePlan.total,legacyTotal(12,g.difficulty,signature));}
  assert.match(g.balance217.overview().summary,/avant ces règles.*ne s’activent pas en cours de campagne/);assert.match(row(g,'Courbe de signature'),/^Plafonnée à \+80 %, atteints à une signature de 288\.$/);
  g.signature=2600;assert.equal(row(g,'Attirance actuelle'),'+80 % d’infectés pour une signature de 2600.');
  assert.deepEqual(g.balance217.actions(),[],'aucune activation pour une ancienne campagne');
  // Une sauvegarde relue garde la marque de l'ancienne campagne.
  const again=g.serialize();assert.deepEqual(again.expansions127.modules.balance217,legacyState());assert.equal(g.restoreSave(again),true);assert.equal(g.balance217.curve(),null);
});

test('équilibrage 217 : la lecture de siège affiche la courbe réellement en vigueur',()=>{
  const Readout=require('../src/siege-readout.js'),g=campaign();g.wave=12;g.signature=600;
  let effect=Readout.hordeEffect(C,g);
  assert.equal(effect.actual,C.wavePlan(12,g.difficulty,600,open).total);assert.equal(effect.quiet,C.wavePlan(12,g.difficulty,0).total);assert.ok(effect.percent>100&&effect.percent<115);
  g.prepareWave();assert.equal(g.wavePlan.total,effect.actual,'l’effectif affiché est celui que le moteur tire');
  old(g);g.wave=12;g.signature=600;effect=Readout.hordeEffect(C,g);
  assert.equal(effect.actual,C.wavePlan(12,g.difficulty,600).total);assert.ok(effect.percent<=81);
  assert.equal(Readout.hordeEffect(C,{wave:12,difficulty:g.difficulty,signature:600}).actual,effect.actual,'sans module : courbe héritée');
});

test('équilibrage 217 : une reprise en plein assaut ne retire pas un plan déjà tiré',()=>{
  const g=campaign();g.wave=9;g.signature=900;g.phaseTime=0;g.updateDirector(.04);assert.equal(g.phase,'warning');
  g.phaseTime=0;g.updateDirector(.04);assert.equal(g.phase,'assault');
  const plan=structuredClone(g.wavePlan);assert.equal(plan.total,C.wavePlan(9,g.difficulty,900,open).total);
  const saved=JSON.parse(JSON.stringify(g.serialize())),rng=saved.randomState;assert.deepEqual(saved.wavePlan,plan);
  assert.doesNotThrow(()=>require('../src/save.js').validate(JSON.parse(JSON.stringify(saved))));
  assert.equal(g.restoreSave(JSON.parse(JSON.stringify(saved))),true);
  assert.deepEqual(g.wavePlan,plan);assert.equal(g.random.state,rng,'aucun tirage à la reprise');assert.equal(g.phase,'assault');
  // La signature recalculée du monde repris (faible) ne touche pas au plan en cours.
  g.refreshMetrics(true);assert.ok(g.signature<288);g.updateDirector(.04);assert.deepEqual(g.wavePlan,plan);
  // Même plan relu sans le module : il n'est pas recalculé non plus avec la courbe héritée.
  const stripped=JSON.parse(JSON.stringify(saved));delete stripped.expansions127.modules.balance217;
  assert.equal(g.restoreSave(stripped),true);assert.deepEqual(g.wavePlan,plan);assert.equal(g.balance217.curve(),null);
});

// Une cité avec un fusilier en plus de ses ouvriers.
function garrison(){const g=campaign(),Unit=g.units[0].constructor,core=g.core(),u=new Unit(g.nextId++,'soldier',core.x+70,core.y+110);g.units.push(u);g.ensureSquads();g.refreshMetrics(true);return g;}
// Vitesse des unités après un pas d'économie au moral donné (cité nourrie).
function speeds(g,morale){g.resources.food=300;g.morale=morale;g.economyTick(.25);return g.units.map(u=>u.speed);}
// Distance réellement parcourue par un ouvrier sur un même pas, depuis le même point.
function walked(g,morale){
  speeds(g,morale);const u=g.units.find(x=>x.kind==='worker'),x=u.x,y=u.y;u.navigation=null;
  g.moveUnitToward(u,{x:x+C.TILE*6,y},.1);const d=Math.hypot(u.x-x,u.y-y);u.x=x;u.y=y;u.navigation=null;return d;
}

test('équilibrage 217 : le moral ralentit le déplacement de toutes les unités, par paliers',()=>{
  const g=garrison();assert.ok(g.units.some(u=>u.kind==='worker')&&g.units.some(u=>u.kind==='soldier'));
  for(const [morale,factor] of [[100,1],[61,1],[59,.94],[41,.94],[39,.88],[21,.88],[19,.82],[1,.82]]){
    assert.deepEqual(speeds(g,morale),g.units.map(u=>C.SURVIVORS[u.kind].speed*factor),'moral '+morale);assert.equal(g.balance217.moveFactor(),factor);assert.equal(g.balance217.effort(),factor);
  }
  const full=walked(g,90),slow=walked(g,50),slower=walked(g,30),slowest=walked(g,5);
  assert.ok(full>0);near(slow/full,.94,'déplacement mesuré, palier 40–60',1e-6);near(slower/full,.88,'palier 20–40',1e-6);near(slowest/full,.82,'plancher',1e-6);
});

test('équilibrage 217 : une ancienne campagne garde exactement le moral d’origine',()=>{
  const g=old(garrison());
  assert.equal(g.balance217.moraleTiers(),false);assert.equal(g.balance217.moveFactor(),null);
  for(const [morale,factor] of [[100,1],[59,1],[41,1],[39,1],[21,1],[20.5,1],[19,.82],[1,.82]]){
    assert.deepEqual(speeds(g,morale),g.units.map(u=>C.SURVIVORS[u.kind].speed*factor),'moral '+morale);assert.equal(g.balance217.effort(),1,'ni travail ni tir ralentis');
  }
  near(walked(g,30)/walked(g,90),1,'aucun ralentissement au-dessus de 20',1e-9);near(walked(g,5)/walked(g,90),.82,'×0,82 en dessous',1e-6);
  assert.match(row(g,'Paliers de moral'),/^Règle d’origine/);assert.match(row(g,'Départs'),/^Sans objet/);
  g.morale=5;assert.equal(row(g,'Moral'),'5 / 100 · déplacement des unités ×0,82');g.morale=50;assert.equal(row(g,'Moral'),'50 / 100 · aucun ralentissement');
});

// Un ouvrier à pied d'œuvre : il ne réfléchit pas pendant la mesure, aucun infecté à proximité.
function worker(g){g.zombies=[];g.rebuildBuckets?.();const u=g.units.find(x=>x.kind==='worker');u.think=1e6;u.carry=0;u.carryType=null;return u;}
function gathered(g,morale,dt=.1){
  const u=worker(g);let node=null;
  // Premier gisement abordable : l'ouvrier est posé à portée de travail, comme après sa marche.
  search:for(const n of g.world.nodes){
    if(n.depleted||n.amount<50||g.resources[n.type]>=g.storage-1)continue;
    for(let a=0;a<16;a++)for(const reach of [n.radius+8,n.radius+2,n.radius-4]){u.x=n.x+Math.cos(a*Math.PI/8)*reach;u.y=n.y+Math.sin(a*Math.PI/8)*reach;if(g.workerCanWorkAt(u,n,n.radius+12)){node=n;break search;}}
  }
  assert.ok(node,'ouvrier au gisement');
  u.state='gather';u.targetNode=node.id;g.setWorkerOrder('harvest');g.morale=morale;const before=node.amount;
  g.updateUnits(dt);const got=u.carry;assert.ok(Math.abs(before-node.amount-got)<1e-9,'récolté = prélevé');u.carry=0;u.carryType=null;u.state='idle';return got;
}
function wallWithCorpses(g){
  const type=Object.values(C.BUILDINGS).find(d=>d.wall&&!d.gate).id,core=g.core(),W=core.constructor;
  const wall=new W(g.nextId++,type,T(core).x+10,T(core).y,0,1);wall.health=wall.def.health;g.world.add(wall);g.refreshMetrics(true);return wall;
}
function cleared(g,wall,morale,dt=.1){
  const u=worker(g),point=g.workerCleanupPoint(u,wall);u.x=point.x;u.y=point.y;
  u.state='clear';u.targetBuilding=wall.id;g.setWorkerOrder('clear');wall.corpseLoad=20;g.morale=morale;
  g.updateUnits(dt);const done=20-wall.corpseLoad;u.state='idle';return done;
}
function site(g){
  const core=g.core(),W=core.constructor,type=Object.values(C.BUILDINGS).find(d=>d.wall&&!d.gate).id;
  const b=new W(g.nextId++,type,T(core).x+12,T(core).y+4,0,0);b.health=1;g.world.add(b);return b;
}
function built(g,b,morale,dt=.1){
  const u=worker(g);u.x=b.x+C.TILE*1.2;u.y=b.y;assert.ok(!globalThis.DeadwallTactics.overlapsBuilding(b,u)&&g.workerCanWorkAt(u,b,62),'ouvrier au chantier');
  u.state='build';u.targetBuilding=b.id;g.setWorkerOrder('auto');b.progress=.1;g.morale=morale;
  g.updateUnits(dt);const done=b.progress-.1;u.state='idle';return done;
}

test('équilibrage 217 : le moral ralentit récolte, chantiers et déblaiement des ouvriers',()=>{
  const g=campaign(),wall=wallWithCorpses(g),b=site(g);
  const harvest=gathered(g,90),clear=cleared(g,wall,90),build=built(g,b,90);
  near(harvest,.1*3.4*g.difficulty.resourceYield*(g.hasResearch('logistics')?1.18:1),'cadence de récolte d’origine à bon moral');
  near(clear,.1*C.WORKER_RULES.cleanupPerSecond,'cadence de déblaiement d’origine à bon moral');
  near(build,.1*(g.hasResearch('logistics')?1.22:1.05)/Math.max(1,b.def.buildTime),'cadence de chantier d’origine à bon moral');
  for(const [morale,factor] of [[60,1],[50,.94],[30,.88],[5,.82]]){
    near(gathered(g,morale)/harvest,factor,'récolte au moral '+morale);near(cleared(g,wall,morale)/clear,factor,'déblaiement au moral '+morale);near(built(g,b,morale)/build,factor,'chantier au moral '+morale);
  }
  // Le Commandant déblaie à sa cadence : le moral ne touche que les ouvriers.
  const u=worker(g),point=g.workerCleanupPoint(u,wall);u.x=point.x;u.y=point.y;wall.corpseLoad=20;g.morale=5;
  near(g.clearCorpsesWithWorker(u,wall,1),C.WORKER_RULES.cleanupPerSecond,'le geste de déblaiement lui-même n’est pas modifié');
  // Ancienne campagne : cadences d'origine à tout moral.
  old(g);const wall2=[...g.world.buildings.values()].find(x=>x.id===wall.id),b2=[...g.world.buildings.values()].find(x=>x.id===b.id);
  for(const morale of [90,50,30,5]){near(gathered(g,morale),harvest,'récolte héritée au moral '+morale);near(cleared(g,wall2,morale),clear,'déblaiement hérité');near(built(g,b2,morale),build,'chantier hérité');}
});

// Cadence de tir d'un fusilier : délai armé après un tir sur un infecté à portée.
function shot(g,morale){
  const u=g.units.find(x=>x.kind==='soldier');g.zombies=[];g.spawnZombie('walker');const enemy=g.zombies[0];enemy.x=u.x+100;enemy.y=u.y;g.rebuildBuckets();
  u.fireCooldown=0;g.resources.ammo=50;g.morale=morale;const shots=g.projectiles.length;
  g.updateUnits(.04);assert.equal(g.resources.ammo,49,'un tir, une munition');assert.equal(g.projectiles.length,shots+1);
  const cooldown=u.fireCooldown;g.zombies=[];g.rebuildBuckets();return cooldown;
}

test('équilibrage 217 : le moral ralentit la cadence de tir des fusiliers, pas les tourelles',()=>{
  const g=garrison(),base=C.SQUAD_RULES.fireCooldown;
  assert.equal(shot(g,90),base,'cadence d’origine à bon moral');assert.equal(shot(g,60),base);
  for(const [morale,factor] of [[50,.94],[30,.88],[5,.82]]){const cooldown=shot(g,morale);near(base/cooldown,factor,'cadence au moral '+morale);assert.ok(cooldown>base);}
  const source=fs.readFileSync(path.join(__dirname,'../src/game.js'),'utf8');
  assert.equal(source.match(/balance217\?\.effort\(\)/g).length,4,'récolte, chantier, déblaiement, tir des fusiliers : rien d’autre');
  assert.equal(source.match(/balance217/g).length,6,'six points d’application dans le moteur');
  assert.equal(source.includes('b.fireCooldown=1/b.def.fireRate/'),false,'tourelles inchangées');
  old(g);for(const morale of [90,50,30,5])assert.equal(shot(g,morale),base,'cadence héritée au moral '+morale);
});

// Une cité affamée (moral au plancher) avec exactement les habitants demandés.
function city(kinds){
  const g=campaign(),Unit=g.units[0].constructor,core=g.core();
  g.units=kinds.map((kind,i)=>new Unit(g.nextId++,kind,core.x+60+i*14,core.y+90));g.refreshMetrics(true);
  return {g,notes:watch(g)};
}
const starve=(g,seconds)=>{for(let t=0;t<seconds;t++){g.resources.food=0;g.morale=Math.min(g.morale,5);g.economyTick(1);}};
const feed=(g,seconds,morale=50)=>{g.morale=morale;for(let t=0;t<seconds;t++){g.resources.food=300;g.economyTick(1);}};
const alive=g=>g.units.filter(u=>!u.dead&&u.health>0),workers=g=>alive(g).filter(u=>u.kind==='worker').length;
const validSave=g=>{const saved=JSON.parse(JSON.stringify(g.serialize()));assert.doesNotThrow(()=>require('../src/save.js').validate(JSON.parse(JSON.stringify(saved))));return saved;};

test('équilibrage 217 : aucun départ tant que le moral tient au-dessus du seuil',()=>{
  const {g,notes}=city(['worker','worker','worker','soldier']);
  for(const morale of [100,45,25,D.below]){g.morale=morale;for(let t=0;t<700;t++){g.resources.food=300;g.morale=morale;g.economyTick(1);}}
  assert.equal(alive(g).length,4);assert.deepEqual(state(g),freshState());assert.equal(mine(notes).length,0);
});

test('équilibrage 217 : moral très bas qui dure → annonce, puis un ouvrier part par échéance, jamais le dernier',()=>{
  const {g,notes}=city(['worker','worker','worker','soldier']);
  starve(g,D.warnSeconds-1);assert.equal(mine(notes).length,0,'rien avant l’annonce');assert.match(row(g,'Départs'),/^Moral sous 10 depuis 01:59\. Annonce dans 00:01, premier départ dans 03:01/);
  starve(g,1);assert.equal(count(notes,'Moral au plus bas : des habitants parlent de quitter la cité'),1);assert.equal(alive(g).length,4);
  assert.match(row(g,'Départs'),/Prochain départ dans 03:00/);
  starve(g,D.seconds-D.warnSeconds-1);assert.equal(workers(g),3,'pas avant l’échéance');assert.equal(mine(notes).length,1);
  starve(g,1);assert.equal(workers(g),2,'premier départ à l’échéance');assert.equal(count(notes,'Moral au plus bas : un ouvrier a quitté la cité.'),1);
  assert.deepEqual(state(g),{...freshState(),low:D.seconds,departs:1});assert.match(row(g,'Départs'),/Prochain départ dans 03:00/);
  let saved=validSave(g);assert.equal(saved.units.length,3,'la sauvegarde ne porte plus l’ouvrier parti');
  starve(g,D.interval-1);assert.equal(workers(g),2);starve(g,1);assert.equal(workers(g),1,'un départ par intervalle');assert.equal(count(notes,'Moral au plus bas : un ouvrier a quitté'),2);
  starve(g,D.interval*3);assert.equal(workers(g),1,'le dernier ouvrier ne part jamais');assert.equal(alive(g).filter(u=>u.kind==='soldier').length,1,'seuls des ouvriers partent');
  assert.equal(count(notes,'Moral au plus bas : un ouvrier a quitté'),2,'aucune annonce sans départ');assert.equal(state(g).departs,5,'les échéances passées sont tenues pour échues');
  assert.equal(g.cityWater215.snapshot().left,0,'le bilan de l’eau ne compte que ses propres départs');
  saved=validSave(g);assert.equal(g.restoreSave(saved),true);assert.equal(workers(g),1);assert.equal(alive(g).length,2);
  // Un pas de temps très long ne fait partir qu'un ouvrier.
  const big=city(['worker','worker','worker','worker']);big.g.resources.food=0;big.g.morale=0;big.g.economyTick(D.seconds+D.interval*3);
  assert.equal(workers(big.g),3);assert.equal(state(big.g).departs,4);
});

test('équilibrage 217 : les départs cessent dès que le moral remonte, et l’échéancier repart de zéro',()=>{
  const {g,notes}=city(['worker','worker','worker']);
  starve(g,D.seconds);assert.equal(workers(g),2);
  feed(g,1,D.below);assert.deepEqual(state(g),freshState());assert.equal(count(notes,'Moral : la cité se reprend'),1);
  feed(g,D.interval*2,D.below+5);assert.equal(workers(g),2,'plus aucun départ');assert.equal(count(notes,'Moral : la cité se reprend'),1);
  // Une rechute recommence par l'annonce, après le délai entier.
  starve(g,D.seconds-1);assert.equal(workers(g),2);assert.equal(count(notes,'Moral au plus bas : des habitants parlent'),2);
  feed(g,1);starve(g,D.warnSeconds-1);feed(g,1);assert.equal(workers(g),2);assert.equal(count(notes,'Moral : la cité se reprend'),2,'une brève chute sans annonce ne s’annonce pas en retour');
  assert.equal(count(notes,'Moral au plus bas : des habitants parlent'),2);
});

test('équilibrage 217 : sauvegarde et reprise au milieu de l’échéance, sans annonce rejouée',()=>{
  const {g,notes}=city(['worker','worker','worker']);
  starve(g,D.warnSeconds+60);assert.equal(mine(notes).length,1);
  const saved=validSave(g);assert.deepEqual(saved.expansions127.modules.balance217,{...freshState(),low:D.warnSeconds+60,departs:0});
  const before=notes.length;assert.equal(g.restoreSave(JSON.parse(JSON.stringify(saved))),true);assert.deepEqual(state(g),saved.expansions127.modules.balance217);
  starve(g,D.seconds-D.warnSeconds-61);assert.equal(notes.length,before,'la reprise ne répète rien');assert.equal(workers(g),3);
  starve(g,1);assert.equal(workers(g),2,'l’échéance tombe où elle devait');assert.equal(count(notes,'Moral au plus bas : un ouvrier a quitté'),1);
  // Reprise juste après un départ : pas de second départ pour la même échéance.
  const after=validSave(g);assert.equal(g.restoreSave(after),true);starve(g,D.interval-1);assert.equal(workers(g),2);
  // Reprise avant l'annonce : elle vient une seule fois, à son heure.
  const early=city(['worker','worker']);starve(early.g,D.warnSeconds-10);assert.equal(early.g.restoreSave(validSave(early.g)),true);
  starve(early.g,9);assert.equal(mine(early.notes).length,0);starve(early.g,1);assert.equal(mine(early.notes).length,1);
  // Un état corrompu est refusé avant toute modification de la partie.
  const broken=validSave(g);broken.expansions127.modules.balance217.departs=99;
  assert.throws(()=>g.restoreSave(broken),/Équilibrage 217/);assert.equal(workers(g),2);
});

test('équilibrage 217 : une pénurie d’eau garde son seul échéancier, le moral ne fait pas partir deux fois',()=>{
  const WR=C.CityWater215Rules,g=campaign(),core=g.core(),W=core.constructor,Unit=g.units[0].constructor;
  const tank=new W(g.nextId++,'fireCistern',T(core).x+8,T(core).y,0,1);tank.health=tank.def.health;g.world.add(tank);g.refreshMetrics(true);g.siege.snapshot();
  const data=g.serialize();data.siege.tanks.find(t=>t.id===tank.id).water=0;data.urban.peakScore=Math.max(data.urban.peakScore,C.CITY_TIERS[WR.startAge].requiredScore);data.urban.progression151={version:1,age:WR.startAge};
  assert.equal(g.restoreSave(data),true);g.refreshMetrics(true);assert.equal(g.cityWater215.needed(),true);
  g.units=Array(6).fill('worker').map((kind,i)=>new Unit(g.nextId++,kind,core.x+60+i*14,core.y+90));g.refreshMetrics(true);const notes=watch(g);
  for(let t=0;t<WR.departSeconds+WR.departInterval*3+40;t++){g.resources.food=1e5;g.economyTick(1);}
  assert.ok(g.morale<D.below,'la pénurie a bien vidé le moral');assert.ok(g.cityWater215.snapshot().dry-WR.graceSeconds>D.seconds+100/(WR.moraleDrain-.08),'assez longtemps pour un départ de moral');
  assert.equal(workers(g),2,'quatre départs : ceux de l’eau, pas un de plus');assert.equal(count(notes,'Pénurie d’eau : un ouvrier a quitté la cité'),4);
  assert.equal(mine(notes).length,0);assert.deepEqual(state(g),freshState());assert.match(row(g,'Départs'),/^Suspendus : la pénurie d’eau/);
});

test('équilibrage 217 : sans eau de cité ni paliers, personne ne part',()=>{
  const {g,notes}=city(['worker','worker','worker']);old(g);const quiet=watch(g);
  starve(g,D.seconds+D.interval*2);assert.equal(workers(g),3);assert.deepEqual(state(g),legacyState());assert.equal(mine(quiet).length,0);assert.equal(mine(notes).length,0);
  // Le retrait appartient à l'eau de cité : refusé hors partie, sans message, et sans ouvrier disponible.
  const fresh=city(['worker']).g;assert.equal(fresh.cityWater215.departWorker('Moral au plus bas : un ouvrier a quitté la cité.'),false,'jamais le dernier ouvrier');
  const two=city(['worker','worker']).g;assert.equal(two.cityWater215.departWorker(''),false);assert.equal(two.cityWater215.departWorker(),false);assert.equal(workers(two),2);
  assert.equal(two.cityWater215.departWorker('Un ouvrier a quitté la cité.'),true);assert.equal(workers(two),1);assert.equal(two.cityWater215.snapshot().left,0);
  two.gameOver=true;assert.equal(two.cityWater215.departWorker('Un ouvrier a quitté la cité.'),false);
});

test('équilibrage 217 : aucune ressource créée, aucun hasard, module chargé après les lois',()=>{
  // Deux campagnes jumelles, nourries, bon moral : avec ou sans les règles, les stocks évoluent à l'identique.
  const modern=campaign(),legacy=old(campaign());
  const rng=[modern.random.state,legacy.random.state];
  for(const g of [modern,legacy]){g.morale=90;for(let t=0;t<120;t++)g.economyTick(.25);}
  assert.deepEqual(modern.resources,legacy.resources);assert.equal(modern.morale,legacy.morale);
  // Moral bas : l'économie de la cité (rations, production) ne dépend pas des paliers.
  for(const g of [modern,legacy]){g.morale=30;for(let t=0;t<120;t++){g.morale=30;g.economyTick(.25);}}
  assert.deepEqual(modern.resources,legacy.resources);assert.deepEqual([modern.random.state,legacy.random.state],rng,'aucun tirage');
  const source=fs.readFileSync(path.join(__dirname,'../src/balance217.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','.random(','localStorage','Date.now','resources','.morale=','.morale =','.dead=','.health=','spend(','setTimeout'])assert.equal(source.includes(forbidden),false,forbidden);
  for(const file of ['index.html','sw.js'])assert.ok(fs.readFileSync(path.join(__dirname,'..',file),'utf8').includes('src/balance217.js'),file);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.includes('<script src="src/city-laws217.js"></script>\n<script src="src/balance217.js"></script>'),'chargé juste après les lois de cité');
});
