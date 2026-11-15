'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js');
// Plans de référence, calculés avant le chargement du module et du jeu.
const WAVES=Array.from({length:40},(_,i)=>i+1),SIGNATURES=[0,120,400];
const reference=()=>JSON.stringify(Object.values(C.DIFFICULTIES).map(d=>WAVES.map(w=>SIGNATURES.map(s=>C.wavePlan(w,d,s)))));
const PRISTINE=reference(),ENEMIES=JSON.stringify(C.ENEMIES),RULES=JSON.stringify(C.ENEMY_RULES);
const A=require('../src/abominations217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.Abominations217Rules,root=path.join(__dirname,'..'),DT=1/30;

function campaign(seed='17117'){
  const {g,doc}=bootDocument134();g.startNew('standard',seed);g.campaignIntro132?.skip?.();return {g,doc};
}
const state=g=>g.serialize().expansions127.modules.abominations217;
const copy=value=>JSON.parse(JSON.stringify(value));
const watch=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const sum=plan=>Object.values(plan.composition).reduce((a,b)=>a+b,0);
// Place la campagne au calme d'une vague donnée, puis laisse passer une image.
function calm(g,wave,seconds=30){g.wave=wave;g.phase='calm';g.phaseTime=seconds;g.update(DT);}
const body=g=>g.zombies.find(z=>z.id===g.abominations217.leader()?.id);
// Fait sonner l'alerte, relève le plan annoncé, puis lance l'assaut.
function toAssault(g){
  g.phaseTime=0;g.update(DT);assert.equal(g.phase,'warning');
  const announced=copy(g.wavePlan);
  g.phaseTime=0;g.update(DT);assert.equal(g.phase,'assault');
  return announced;
}

test('vagues menées 217 : règles gelées, état validé strictement',()=>{
  assert.ok(Object.isFrozen(R));
  assert.deepEqual({...R},{firstWave:12,every:4,gatherShare:.2,cutShare:.12,standoff:256,spanMin:.3,spanMax:.7});
  assert.ok(R.gatherShare>0&&R.gatherShare<=.25&&R.cutShare>0&&R.cutShare<=.2&&R.every>=2);
  assert.deepEqual(A.validate(undefined),{version:1,active:false,led:null});
  assert.deepEqual(A.initial(),{version:1,active:false,led:null});assert.deepEqual(A.fresh(),{version:1,active:true,led:null});
  const good=[{version:1,active:true,led:null},{version:1,active:true,led:{wave:12,id:9,status:'alive',delta:0}},{version:1,active:true,led:{wave:16,id:9,status:'slain',delta:0}},
    {version:1,active:true,led:{wave:16,id:0,status:'gathered',delta:40}},{version:1,active:true,led:{wave:16,id:9,status:'dispersed',delta:-24}}];
  for(const ok of good){assert.deepEqual(A.validate(ok),ok);assert.notEqual(A.validate(ok),ok);}
  const led={wave:12,id:9,status:'alive',delta:0};
  for(const bad of [null,[],'217',{},{version:1,active:true},{version:2,active:true,led:null},{version:1,active:1,led:null},{version:1,active:true,led:null,extra:1},
    {version:1,active:false,led},{version:1,active:true,led:[]},{version:1,active:true,led:{...led,wave:R.firstWave-1}},{version:1,active:true,led:{...led,wave:12.5}},
    {version:1,active:true,led:{...led,id:-1}},{version:1,active:true,led:{...led,status:'boss'}},{version:1,active:true,led:{...led,delta:5}},
    {version:1,active:true,led:{...led,status:'gathered',delta:-1}},{version:1,active:true,led:{...led,status:'dispersed',delta:1}},
    {version:1,active:true,led:{...led,health:9999}},{version:1,active:true,led:{wave:12,id:9,status:'alive'}}])assert.throws(()=>A.validate(bad),/Vagues menées 217/);
});

test('vagues menées 217 : choix déterministe par la vague et la graine, jamais une vague de géants',()=>{
  const siege=C.VerticalCitadel175.siege;assert.ok(siege.firstWave>0&&siege.spawnWaveInterval>0);
  const giant=w=>w>=siege.firstWave&&w%siege.spawnWaveInterval===0,all=Array.from({length:100},(_,i)=>i+1);
  const offsets=new Set();
  for(const seed of [0,1,42,17117,84329,967313470,1947648717,4294967295]){
    const list=all.filter(w=>A.led(w,seed));
    assert.deepEqual(list,all.filter(w=>A.led(w,seed)),'même réponse à chaque appel');
    assert.ok(list.length>0&&list[0]>=R.firstWave&&list[0]<R.firstWave+R.every);
    for(const w of list){assert.equal((w-list[0])%R.every,0);assert.ok(!giant(w),'vague de géants '+w);}
    // Hors vagues de géants, une vague sur `every`, sans trou.
    for(let w=list[0];w<=100;w+=R.every)assert.equal(A.led(w,seed),!giant(w));
    assert.equal(A.nextLed(1,seed),list[0]);assert.equal(A.nextLed(list[0]+1,seed),list[1]);
    offsets.add(list[0]-R.firstWave);
    for(const w of list.slice(0,6)){
      const p=A.post(seed,w);assert.deepEqual(p,A.post(seed,w));assert.ok(['north','east','south','west'].includes(p.side));
      assert.equal(Math.min(p.x,p.y,C.WORLD_SIZE-p.x,C.WORLD_SIZE-p.y),R.standoff);
      const along=p.side==='north'||p.side==='south'?p.x:p.y;assert.ok(along>=R.spanMin*C.WORLD_SIZE&&along<=R.spanMax*C.WORLD_SIZE);
    }
  }
  assert.ok(offsets.size>1,'le décalage dépend de la graine');
  for(const bad of [0,-4,11.5,NaN,'12',null])assert.equal(A.led(bad,17117),false);
});

test('vagues menées 217 : l’écart est borné, fait d’infectés ordinaires, dans les proportions du plan',()=>{
  for(const difficulty of Object.values(C.DIFFICULTIES))for(const wave of WAVES)for(const signature of SIGNATURES){
    const plan=C.wavePlan(wave,difficulty,signature),before=copy(plan),more=A.gather(plan),less=A.disperse(plan);
    assert.deepEqual(plan,before,'le plan d’origine n’est pas modifié');
    for(const out of [more,less]){
      assert.equal(sum(out),out.total);assert.deepEqual(Object.keys(out.composition),Object.keys(plan.composition));
      assert.equal(out.wave,plan.wave);assert.equal(out.fronts,plan.fronts);assert.equal(out.spawnInterval,plan.spawnInterval);
      for(const n of Object.values(out.composition))assert.ok(Number.isInteger(n)&&n>=0);
    }
    assert.equal(more.total-plan.total,A.gain(plan.total));assert.equal(plan.total-less.total,A.cut(plan.total));
    assert.ok(more.total>=plan.total&&more.total<=plan.total*(1+R.gatherShare)+1e-6);
    assert.ok(less.total<=plan.total&&less.total>=plan.total*(1-R.cutShare)-1e-6&&less.total>=Math.min(plan.total,8));
    for(const kind of Object.keys(plan.composition)){
      if(kind!=='walker')assert.ok(less.composition[kind]<=plan.composition[kind]&&more.composition[kind]>=plan.composition[kind]);
      assert.ok(Math.abs(more.composition[kind]-plan.composition[kind]*more.total/plan.total)<=Object.keys(plan.composition).length);
    }
  }
  const tiny={wave:1,total:8,fronts:1,spawnInterval:.5,composition:{walker:8}};assert.equal(A.disperse(tiny).total,8);
});

test('vagues menées 217 : la Meneuse paraît au calme, ordinaire, immobile, sans tirage dans le flux du jeu',()=>{
  const {g,doc}=campaign(),api=g.abominations217,notes=watch(g);
  assert.deepEqual(state(g),{version:1,active:true,led:null});assert.equal(api.active(),true);assert.deepEqual(api.actions(),[]);
  assert.equal(g.expansions.get('abominations217').title,'Vagues menées');
  const wave=api.next();assert.ok(wave>=R.firstWave);assert.equal(api.led(wave),true);assert.equal(api.led(wave-1),false);
  calm(g,wave-1);assert.equal(api.leader(),null,'aucune Meneuse avant une vague ordinaire');assert.equal(g.zombies.length,0);
  g.wave=wave;g.phase='calm';g.phaseTime=30;
  const random=g.random.state;api.tick();
  assert.equal(g.random.state,random,'la création n’avance pas le flux du jeu');
  const seen=api.leader(),z=body(g),p=A.post(g.world.seed,wave);
  assert.ok(seen&&z);assert.equal(g.zombies.length,1);assert.equal(z.kind,'walker');assert.equal(seen.side,p.side);assert.equal(z.x,p.x);assert.equal(z.y,p.y);
  assert.deepEqual(state(g).led,{wave,id:z.id,status:'alive',delta:0});
  assert.equal(notes.filter(t=>t.startsWith('Vague '+wave+' menée : une Meneuse rassemble la horde '+p.where)).length,1);
  // Points de vie : ceux de n'importe quelle Errante de cette vague, créée par le chemin ordinaire.
  g.spawnZombie('walker');const other=g.zombies[g.zombies.length-1];assert.notEqual(other,z);
  assert.equal(z.maxHealth,other.maxHealth);assert.equal(z.health,z.maxHealth);assert.equal(z.radius,other.radius);
  assert.ok(z.maxHealth<=C.ENEMIES.walker.health*g.difficulty.enemyHealth*1.34+1e-6,'dans le plafond de +34 % du jeu');
  other.dead=true;g.zombies=g.zombies.filter(e=>!e.dead);
  // Seule sur la carte, elle ne bouge pas et ne coûte aucun tirage à la boucle des infectés.
  const before=g.random.state;for(let i=0;i<90;i++)g.updateZombies(DT);
  assert.equal(g.random.state,before);assert.equal(z.x,p.x);assert.equal(z.y,p.y);assert.ok(g.zombies.includes(z));assert.equal(g.zombies.length,1);
  for(let i=0;i<60;i++)g.update(DT);
  assert.equal(z.x,p.x);assert.equal(z.y,p.y);assert.equal(g.zombies.filter(e=>e.id===z.id).length,1);
  assert.equal(notes.filter(t=>t.includes('une Meneuse rassemble')).length,1,'annoncée une seule fois');
  // Dossier de situation et fiche.
  api.render();const line=doc.getElementById('abominations217Line');
  assert.ok(line&&line.textContent.startsWith('Vague '+wave+' menée : Meneuse repérée '+p.where));assert.equal(doc.getElementById('abominations217Readout').hidden,false);
  const view=api.overview();assert.match(view.summary,/c’est le nombre/);assert.equal(view.rows.length,5);assert.match(view.rows[0].value,/\+20 %.*−12 %.*Errante/);
  assert.equal(JSON.stringify(C.ENEMIES),ENEMIES);assert.equal(JSON.stringify(C.ENEMY_RULES),RULES);
});

test('vagues menées 217 : non abattue, elle rassemble — plus d’infectés ordinaires, rien d’autre',()=>{
  const {g}=campaign(),api=g.abominations217,notes=watch(g),wave=api.next();
  calm(g,wave);const z=body(g),health=z.maxHealth;assert.ok(z);
  const announced=toAssault(g);
  assert.equal(notes.filter(t=>t.startsWith('Vague menée : la Meneuse tient toujours')).length,1);
  const plan=g.wavePlan,delta=A.gain(announced.total);
  assert.ok(delta>0);assert.equal(plan.total,announced.total+delta);assert.equal(sum(plan),plan.total);assert.deepEqual(copy(plan),A.gather(announced));
  assert.deepEqual(state(g).led,{wave,id:z.id,status:'gathered',delta});
  assert.equal(notes.filter(t=>t.startsWith('La Meneuse n’a pas été abattue : elle marche avec la horde')&&t.includes(delta+' contacts de plus')).length,1);
  // Elle redevient une infectée comme les autres : plus de marqueur, mêmes points de vie, et elle avance.
  assert.equal(api.leader(),null);assert.ok(g.zombies.includes(z));assert.equal(z.maxHealth,health);assert.equal(z.kind,'walker');
  const x=z.x,y=z.y;for(let i=0;i<60;i++)g.update(DT);assert.ok(z.dead||z.x!==x||z.y!==y,'elle marche avec la horde');
  for(const e of g.zombies)assert.ok(e.maxHealth<=C.ENEMIES[e.kind].health*g.difficulty.enemyHealth*1.34+1e-6,'aucun point de vie gonflé');
  // La tuer maintenant ne change plus rien.
  if(!z.dead)g.killZombie(z,false);g.update(DT);assert.equal(state(g).led.status,'gathered');assert.equal(g.wavePlan.total,announced.total+delta);
  // La sauvegarde en plein assaut reste cohérente avec les échelons de la nuit.
  const data=copy(g.serialize());assert.equal(g.restoreSave(data),true);assert.deepEqual(state(g).led,{wave,id:z.id,status:'gathered',delta});assert.equal(g.wavePlan.total,announced.total+delta);
  assert.match(api.line(),/n’a pas été abattue/);
  assert.equal(JSON.stringify(C.ENEMIES),ENEMIES);assert.equal(JSON.stringify(C.ENEMY_RULES),RULES);
});

test('vagues menées 217 : abattue avant l’assaut, la vague qui suit est réduite d’une part bornée',()=>{
  const {g}=campaign(),api=g.abominations217,notes=watch(g),wave=api.next();
  calm(g,wave);const z=body(g);assert.ok(z);
  const kills=g.stats.kills;g.killZombie(z,false);g.update(DT);
  assert.equal(g.stats.kills,kills+1,'une élimination ordinaire');
  assert.deepEqual(state(g).led,{wave,id:z.id,status:'slain',delta:0});assert.equal(api.leader(),null);
  assert.equal(notes.filter(t=>t.startsWith('Meneuse abattue '+A.post(g.world.seed,wave).where)).length,1);
  assert.match(api.line(),/Meneuse abattue\. La horde arrivera dispersée/);
  for(let i=0;i<30;i++)g.update(DT);assert.equal(g.zombies.length,0,'elle ne reparaît pas');
  const announced=toAssault(g),plan=g.wavePlan,loss=A.cut(announced.total);
  assert.ok(loss>0&&loss<=announced.total*R.cutShare);assert.equal(plan.total,announced.total-loss);assert.equal(sum(plan),plan.total);assert.deepEqual(copy(plan),A.disperse(announced));
  assert.deepEqual(state(g).led,{wave,id:z.id,status:'dispersed',delta:-loss});
  assert.equal(notes.filter(t=>t.startsWith('Meneuse abattue : la horde arrive dispersée, '+loss+' contacts de moins')).length,1);
  assert.equal(notes.filter(t=>t.includes('n’a pas été abattue')).length,0);
  const pending=Object.values(g.pendingSpawns).reduce((a,b)=>a+b,0)+g.spawnQueue.length+g.zombies.length;assert.equal(pending,plan.total,'l’assaut compte exactement le plan réduit');
  const data=copy(g.serialize());assert.equal(g.restoreSave(data),true);assert.equal(g.wavePlan.total,announced.total-loss);
  assert.match(api.overview().rows[4].value,/abattue avant l’assaut/);
});

test('vagues menées 217 : abattue pendant l’alerte, l’effet tient encore',()=>{
  const {g}=campaign(),api=g.abominations217,wave=api.next();
  calm(g,wave);const z=body(g);
  g.phaseTime=0;g.update(DT);assert.equal(g.phase,'warning');const announced=copy(g.wavePlan);
  assert.ok(api.leader(),'toujours visible pendant l’alerte');
  g.killZombie(z,false);g.phaseTime=0;g.update(DT);assert.equal(g.phase,'assault');
  assert.equal(g.wavePlan.total,announced.total-A.cut(announced.total));assert.equal(state(g).led.status,'dispersed');
});

test('vagues menées 217 : sauvegarde et reprise en pleine vague menée',()=>{
  const {g}=campaign(),api=g.abominations217,wave=api.next();
  calm(g,wave);const z=body(g),p=A.post(g.world.seed,wave);
  const data=copy(g.serialize());assert.deepEqual(data.expansions127.modules.abominations217,{version:1,active:true,led:{wave,id:z.id,status:'alive',delta:0}});
  assert.equal(g.restoreSave(copy(data)),true);
  const again=body(g);assert.ok(again&&again!==z);assert.equal(again.id,z.id);assert.equal(again.kind,'walker');assert.equal(again.x,p.x);assert.equal(again.y,p.y);
  const notes=watch(g);for(let i=0;i<60;i++)g.update(DT);
  assert.equal(again.x,p.x);assert.equal(again.y,p.y);assert.equal(g.zombies.length,1,'pas de seconde Meneuse');assert.equal(notes.filter(t=>t.includes('Meneuse')).length,0,'la reprise ne rejoue aucune annonce');
  g.killZombie(again,false);
  // Une sauvegarde prise entre le coup et l'image suivante relève déjà la mort.
  assert.equal(state(g).led.status,'slain');
  const slain=copy(g.serialize());assert.equal(g.restoreSave(slain),true);assert.equal(state(g).led.status,'slain');assert.equal(api.leader(),null);
  const announced=toAssault(g);assert.equal(g.wavePlan.total,announced.total-A.cut(announced.total));
  // État refusé s'il est altéré.
  for(const led of [{wave,id:z.id,status:'alive',delta:3},{wave,id:z.id,status:'boss',delta:0},{wave,id:z.id,status:'alive',delta:0,health:5000}]){
    const bad=copy(data);bad.expansions127.modules.abominations217.led=led;assert.throws(()=>{if(g.restoreSave(bad)!==true)throw Error('refusée');});
  }
});

test('vagues menées 217 : ancienne campagne — aucune vague menée, plans identiques',()=>{
  const {g,doc}=campaign(),api=g.abominations217;
  const data=copy(g.serialize());delete data.expansions127.modules.abominations217;assert.equal(g.restoreSave(data),true);
  assert.equal(api.active(),false);assert.deepEqual(state(g),{version:1,active:false,led:null});assert.equal(api.next(),null);
  const notes=watch(g);
  for(const wave of [11,12,13,14,15,16,17,20,21,24,28,29,33]){
    assert.equal(api.led(wave),false);
    calm(g,wave);assert.equal(api.leader(),null);assert.equal(g.zombies.length,0);
    g.prepareWave();const prepared=copy(g.wavePlan);
    // Le plan préparé est celui du moteur, au bit près, avant même les profils de siège.
    assert.equal(prepared.total,C.wavePlan(wave,g.difficulty,g.signature,g.balance217?.curve()).total);
    g.startAssault();assert.deepEqual(copy(g.wavePlan),prepared,'vague '+wave+' : plan inchangé par l’assaut');
    assert.equal(Object.values(g.pendingSpawns).reduce((a,b)=>a+b,0)+g.spawnQueue.length,prepared.total);
    g.spawnQueue=[];g.pendingSpawns={};g.zombies=[];
  }
  assert.equal(notes.filter(t=>/Meneuse|menée/.test(t)).length,0);assert.equal(api.line(),'');
  api.render();assert.equal(doc.getElementById('abominations217Readout')?.hidden??true,true);
  assert.match(api.overview().summary,/avant cette règle/);assert.deepEqual(state(g),{version:1,active:false,led:null});
  // `C.wavePlan` lui-même n'a pas bougé d'un bit : toutes les difficultés, quarante vagues, trois signatures.
  assert.equal(reference(),PRISTINE);assert.equal(JSON.stringify(C.ENEMIES),ENEMIES);assert.equal(JSON.stringify(C.ENEMY_RULES),RULES);
});

test('vagues menées 217 : une vague ordinaire d’une nouvelle campagne garde son plan',()=>{
  const {g}=campaign(),api=g.abominations217,wave=api.next()+1;assert.equal(api.led(wave),false);
  calm(g,wave);const announced=toAssault(g);assert.deepEqual(copy(g.wavePlan),announced);assert.equal(state(g).led,null);
});

test('vagues menées 217 : module inscrit partout, sans rien créer d’autre que des nombres',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.ok(html.indexOf('src/expansion-kit.js')>0&&html.indexOf('src/expansion-kit.js')<html.indexOf('src/abominations217.js')&&html.indexOf('src/balance217.js')<html.indexOf('src/abominations217.js'));
  assert.equal(html.split('src/abominations217.js').length,2);assert.ok(sw.includes('"src/abominations217.js"'));
  const kit=fs.readFileSync(path.join(root,'src/expansion-kit.js'),'utf8');assert.ok(kit.includes("'abominations217'")&&kit.indexOf("'abominations217'")<kit.indexOf("'balance217','breach217']"));
  const ui=fs.readFileSync(path.join(root,'src/expansion-ui.js'),'utf8');assert.equal(ui.split('abominations217').length-1,5);assert.ok(ui.includes("abominations217:'Vagues menées'"));
  const source=fs.readFileSync(path.join(root,'src/abominations217.js'),'utf8');
  assert.doesNotMatch(source,/Math\.random|setTimeout|setInterval|Date\.now|maxHealth\s*=|\.health\s*[-+*]?=[^=]|damage\s*[-+*]?=|damageBuilding|damagePlayer|damageUnit|resources/);
  assert.match(source,/g\.random=new C\.Random\(hash\(seed\(\),wave\)\)/);
  assert.equal(source.split('g.random=').length-1,2,'le flux du jeu est emprunté puis rendu, rien de plus');
});
