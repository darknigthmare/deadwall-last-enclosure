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
  assert.deepEqual(copy(R),{firstWave:12,every:4,gatherShare:.2,cutShare:.12,standoff:256,spanMin:.3,spanMax:.7,
    escort:{base:6,perLed:2,max:18,share:.08,ringMin:46,ringMax:110,wake:260,shot:150},post:{tries:6,step:128},
    cap:3,filler:{firstWave:14,every:6,lead:.1,radius:96,extra:1,minDitches:1},dragger:{firstWave:18,every:7,lead:.1,reach:40,load:12}});
  assert.ok(Object.isFrozen(R.filler)&&Object.isFrozen(R.dragger));
  assert.ok(Object.isFrozen(R.escort)&&Object.isFrozen(R.post));
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
  // Escorte : clé facultative (absente d'une sauvegarde de la première tranche), validée strictement.
  const escort={wave:12,ids:[10,11],kinds:['walker','runner'],woken:false,taken:0};
  const withEscort=[{version:1,active:true,led,escort},{version:1,active:true,led:{...led,status:'slain'},escort:{...escort,woken:true}},
    {version:1,active:true,led:{wave:12,id:9,status:'gathered',delta:40},escort:{...escort,woken:true,taken:2}},{version:1,active:true,led:{wave:12,id:9,status:'dispersed',delta:-20},escort:{...escort,ids:[],kinds:[],woken:true}}];
  for(const ok of withEscort){assert.deepEqual(A.validate(ok),ok);assert.notEqual(A.validate(ok).escort,ok.escort);}
  for(const bad of [{...escort,wave:16},{...escort,ids:[9,10]},{...escort,ids:[10,10]},{...escort,ids:[0,11]},{...escort,kinds:['walker','boss']},{...escort,kinds:['walker']},
    {...escort,woken:1},{...escort,taken:1},{...escort,extra:1},{...escort,ids:Array.from({length:R.escort.max+1},(_,i)=>i+20),kinds:Array(R.escort.max+1).fill('walker')}])
    assert.throws(()=>A.validate({version:1,active:true,led,escort:bad}),/Vagues menées 217/);
  assert.throws(()=>A.validate({version:1,active:true,led:null,escort}),/Vagues menées 217/);
  assert.throws(()=>A.validate({version:1,active:true,led:{wave:12,id:0,status:'absent',delta:0},escort}),/Vagues menées 217/);
  // Décidée (assaut lancé) : l'escorte est forcément réveillée ; avant, rien n'est encore pris sur le plan.
  assert.throws(()=>A.validate({version:1,active:true,led:{wave:12,id:9,status:'gathered',delta:40},escort}),/Vagues menées 217/);
  assert.throws(()=>A.validate({version:1,active:true,led,escort:{...escort,taken:1,woken:true}}),/Vagues menées 217/);
});

test('vagues menées 217 : escorte bornée, croissante, d’infectés ordinaires du plan, prise sur son effectif',()=>{
  const E=R.escort;
  for(const difficulty of Object.values(C.DIFFICULTIES))for(const wave of WAVES.filter(w=>w>=R.firstWave))for(const signature of SIGNATURES){
    const plan=C.wavePlan(wave,difficulty,signature),n=A.escortSize(wave,plan.total);
    assert.ok(Number.isInteger(n)&&n>=0&&n<=E.max&&n<=Math.floor(plan.total*E.share+1e-9));
    const kinds=A.escortKinds(plan,n);assert.equal(kinds.length,n);
    for(const kind of kinds){assert.ok(plan.composition[kind]>0,'type du plan');assert.ok(Object.hasOwn(C.ENEMIES,kind));}
    const before=copy(plan),{plan:rest,taken}=A.take(plan,kinds);assert.deepEqual(plan,before,'le plan d’origine n’est pas modifié');
    assert.equal(taken,n);assert.equal(rest.total,plan.total-n);assert.equal(sum(rest),rest.total);
    for(const kind of Object.keys(plan.composition))assert.ok(rest.composition[kind]>=0&&rest.composition[kind]<=plan.composition[kind]);
  }
  // Croissante avec la vague, plafonnée.
  const big=1e5,sizes=Array.from({length:60},(_,i)=>A.escortSize(R.firstWave+i,big));
  for(let i=1;i<sizes.length;i++)assert.ok(sizes[i]>=sizes[i-1]);
  assert.equal(sizes[0],E.base);assert.equal(sizes[R.every],E.base+E.perLed);assert.equal(sizes[sizes.length-1],E.max);
  for(const bad of [[R.firstWave-1,300],[12.5,300],[20,0],[20,NaN]])assert.equal(A.escortSize(...bad),0);
  // Places autour du poste : fonction pure, dans l'anneau réglé.
  const ring=A.ring(17117,16,8);assert.deepEqual(ring,A.ring(17117,16,8));assert.equal(ring.length,8);
  for(const spot of ring)assert.ok(spot.radius>=E.ringMin&&spot.radius<=E.ringMax);
  // Autres postes du même côté, dans un ordre fixe, le poste d'origine d'abord.
  for(const seed of [0,1,42,17117,4294967295])for(const wave of [12,16,20,24]){
    const list=A.posts(seed,wave),p=A.post(seed,wave);
    assert.deepEqual(list,A.posts(seed,wave));assert.ok(list.length>1);assert.equal(list[0].x,p.x);assert.equal(list[0].y,p.y);
    for(const q of list){assert.equal(q.side,p.side);const along=q.side==='north'||q.side==='south'?q.x:q.y;assert.ok(along>=R.spanMin*C.WORLD_SIZE&&along<=R.spanMax*C.WORLD_SIZE);
      const depth=Math.min(q.x,q.y,C.WORLD_SIZE-q.x,C.WORLD_SIZE-q.y);assert.ok(depth===R.standoff||depth===R.standoff+R.post.step);}
  }
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
  const seen=api.leader(),z=body(g),p=A.post(g.world.seed,wave),escort=api.escort();
  assert.ok(seen&&z&&escort);assert.equal(z.kind,'walker');assert.equal(seen.side,p.side);assert.equal(z.x,p.x);assert.equal(z.y,p.y);
  // Escorte : infectés ordinaires, des types du plan, tout autour du poste.
  const plan=C.wavePlan(wave,g.difficulty,g.signature,g.balance217?.curve()),n=A.escortSize(wave,plan.total);
  assert.ok(n>=R.escort.base);assert.equal(escort.size,n);assert.equal(escort.standing,n);assert.equal(escort.woken,false);assert.equal(escort.taken,0);
  assert.equal(g.zombies.length,1+n);assert.deepEqual([...escort.kinds],A.escortKinds(plan,n));
  const guards=g.zombies.filter(e=>e!==z);
  for(const e of guards){
    assert.ok(plan.composition[e.kind]>0);const d=Math.hypot(e.x-p.x,e.y-p.y);assert.ok(d>=R.escort.ringMin*.5-1e-6&&d<=R.escort.ringMax+1e-6);
    assert.ok(e.maxHealth<=C.ENEMIES[e.kind].health*g.difficulty.enemyHealth*1.34+1e-6,'points de vie ordinaires');assert.equal(e.health,e.maxHealth);
  }
  assert.deepEqual(state(g).led,{wave,id:z.id,status:'alive',delta:0});
  assert.deepEqual(state(g).escort,{wave,ids:guards.map(e=>e.id),kinds:[...escort.kinds],woken:false,taken:0});
  const spots=guards.map(e=>[e.x,e.y]);
  assert.equal(notes.filter(t=>t.startsWith('Vague '+wave+' menée : une Meneuse rassemble la horde '+p.where)).length,1);
  // Points de vie : ceux de n'importe quelle Errante de cette vague, créée par le chemin ordinaire.
  g.spawnZombie('walker');const other=g.zombies[g.zombies.length-1];assert.notEqual(other,z);
  assert.equal(z.maxHealth,other.maxHealth);assert.equal(z.health,z.maxHealth);assert.equal(z.radius,other.radius);
  for(const e of guards){g.spawnZombie(e.kind);const twin=g.zombies[g.zombies.length-1];assert.equal(e.maxHealth,twin.maxHealth,e.kind+' : mêmes points de vie');assert.equal(e.radius,twin.radius);twin.dead=true;}
  g.zombies=g.zombies.filter(e=>!e.dead);
  assert.ok(z.maxHealth<=C.ENEMIES.walker.health*g.difficulty.enemyHealth*1.34+1e-6,'dans le plafond de +34 % du jeu');
  other.dead=true;g.zombies=g.zombies.filter(e=>!e.dead);
  // Seule avec son escorte, sans personne à proximité : personne ne bouge, aucun tirage dans la boucle des infectés.
  const before=g.random.state;for(let i=0;i<90;i++)g.updateZombies(DT);
  assert.equal(g.random.state,before);assert.equal(z.x,p.x);assert.equal(z.y,p.y);assert.ok(g.zombies.includes(z));assert.equal(g.zombies.length,1+n);
  for(let i=0;i<60;i++)g.update(DT);
  assert.equal(z.x,p.x);assert.equal(z.y,p.y);assert.equal(g.zombies.filter(e=>e.id===z.id).length,1);
  assert.deepEqual(guards.map(e=>[e.x,e.y]),spots,'escorte immobile');assert.equal(api.escort().woken,false);
  assert.equal(notes.filter(t=>t.includes('une Meneuse rassemble')).length,1,'annoncée une seule fois');
  // Dossier de situation et fiche.
  api.render();const line=doc.getElementById('abominations217Line');
  assert.ok(line&&line.textContent.startsWith('Vague '+wave+' menée : Meneuse repérée '+p.where));assert.equal(doc.getElementById('abominations217Readout').hidden,false);
  assert.match(line.textContent,/Escorte : \d+ infectés ordinaires immobiles/);
  const view=api.overview();assert.match(view.summary,/c’est le nombre/);assert.equal(view.rows.length,5);assert.match(view.rows[0].value,/\+20 %.*−12 %.*Errante/);assert.match(view.rows[3].value,/escorte/);
  assert.equal(JSON.stringify(C.ENEMIES),ENEMIES);assert.equal(JSON.stringify(C.ENEMY_RULES),RULES);
});

test('vagues menées 217 : non abattue, elle rassemble — plus d’infectés ordinaires, rien d’autre',()=>{
  const {g}=campaign(),api=g.abominations217,notes=watch(g),wave=api.next();
  calm(g,wave);const z=body(g),health=z.maxHealth;assert.ok(z);
  const announced=toAssault(g);
  assert.equal(notes.filter(t=>t.startsWith('Vague menée : la Meneuse tient toujours')).length,1);
  const plan=g.wavePlan,delta=A.gain(announced.total),taken=state(g).escort.ids.length;
  // L'escorte fait partie de l'effectif : le moteur fait entrer le plan rassemblé, moins elle, déjà sur place.
  assert.ok(delta>0&&taken>0);assert.equal(plan.total,announced.total+delta-taken);assert.equal(sum(plan),plan.total);assert.deepEqual(copy(plan),A.take(A.gather(announced),state(g).escort.kinds).plan);
  assert.deepEqual(state(g).led,{wave,id:z.id,status:'gathered',delta});assert.equal(state(g).escort.taken,taken);assert.equal(state(g).escort.woken,true);
  const f=api.forecast();assert.equal(f.real,announced.total+delta);assert.equal(f.entering,plan.total);assert.equal(f.decided,true);
  assert.equal(Object.values(g.pendingSpawns).reduce((a,b)=>a+b,0)+g.spawnQueue.length+g.zombies.length,announced.total+delta+1,'à entrer + escorte + Meneuse');
  assert.equal(notes.filter(t=>t.startsWith('La Meneuse n’a pas été abattue : elle marche avec la horde')&&t.includes(delta+' contacts de plus')).length,1);
  // Elle redevient une infectée comme les autres : plus de marqueur, mêmes points de vie, et elle avance.
  assert.equal(api.leader(),null);assert.ok(g.zombies.includes(z));assert.equal(z.maxHealth,health);assert.equal(z.kind,'walker');
  const x=z.x,y=z.y;for(let i=0;i<60;i++)g.update(DT);assert.ok(z.dead||z.x!==x||z.y!==y,'elle marche avec la horde');
  for(const e of g.zombies)assert.ok(e.maxHealth<=C.ENEMIES[e.kind].health*g.difficulty.enemyHealth*1.34+1e-6,'aucun point de vie gonflé');
  // La tuer maintenant ne change plus rien.
  if(!z.dead)g.killZombie(z,false);g.update(DT);assert.equal(state(g).led.status,'gathered');assert.equal(g.wavePlan.total,announced.total+delta-taken);
  // La sauvegarde en plein assaut reste cohérente avec les échelons de la nuit (total de la nuit = total du plan).
  const data=copy(g.serialize());assert.equal(data.dayworks.night.total,data.wavePlan.total);
  assert.equal(g.restoreSave(data),true);assert.deepEqual(state(g).led,{wave,id:z.id,status:'gathered',delta});assert.equal(g.wavePlan.total,announced.total+delta-taken);
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
  assert.equal(api.escort().woken,true,'la mort de la Meneuse réveille son escorte');
  for(let i=0;i<30;i++)g.update(DT);assert.equal(g.zombies.filter(e=>e.id===z.id).length,0,'elle ne reparaît pas');
  const standing=api.escort().standing,taken=api.escort().size;assert.equal(standing,g.zombies.length,'l’escorte reste sur la carte');
  const announced=toAssault(g),plan=g.wavePlan,loss=A.cut(announced.total);
  assert.ok(loss>0&&loss<=announced.total*R.cutShare);assert.equal(plan.total,announced.total-loss-taken);assert.equal(sum(plan),plan.total);assert.deepEqual(copy(plan),A.take(A.disperse(announced),state(g).escort.kinds).plan);
  assert.deepEqual(state(g).led,{wave,id:z.id,status:'dispersed',delta:-loss});
  assert.equal(notes.filter(t=>t.startsWith('Meneuse abattue : la horde arrive dispersée, '+loss+' contacts de moins')).length,1);
  assert.equal(notes.filter(t=>t.includes('n’a pas été abattue')).length,0);
  const pending=Object.values(g.pendingSpawns).reduce((a,b)=>a+b,0)+g.spawnQueue.length+g.zombies.length;assert.equal(pending,announced.total-loss,'l’assaut compte exactement le plan réduit, escorte comprise');
  const data=copy(g.serialize());assert.equal(g.restoreSave(data),true);assert.equal(g.wavePlan.total,announced.total-loss-taken);
  assert.match(api.overview().rows[4].value,/abattue avant l’assaut/);
});

test('vagues menées 217 : abattue pendant l’alerte, l’effet tient encore',()=>{
  const {g}=campaign(),api=g.abominations217,wave=api.next();
  calm(g,wave);const z=body(g);
  g.phaseTime=0;g.update(DT);assert.equal(g.phase,'warning');const announced=copy(g.wavePlan);
  assert.ok(api.leader(),'toujours visible pendant l’alerte');
  g.killZombie(z,false);g.phaseTime=0;g.update(DT);assert.equal(g.phase,'assault');
  assert.equal(g.wavePlan.total+state(g).escort.taken,announced.total-A.cut(announced.total));assert.equal(state(g).led.status,'dispersed');
});

test('vagues menées 217 : sauvegarde et reprise en pleine vague menée',()=>{
  const {g}=campaign(),api=g.abominations217,wave=api.next();
  calm(g,wave);const z=body(g),p=A.post(g.world.seed,wave),escort=copy(state(g).escort),n=escort.ids.length;
  const data=copy(g.serialize());assert.deepEqual(data.expansions127.modules.abominations217,{version:1,active:true,led:{wave,id:z.id,status:'alive',delta:0},escort});
  const spots=g.zombies.filter(e=>e!==z).map(e=>[e.id,e.kind,e.x,e.y]);
  assert.equal(g.restoreSave(copy(data)),true);
  const again=body(g);assert.ok(again&&again!==z);assert.equal(again.id,z.id);assert.equal(again.kind,'walker');assert.equal(again.x,p.x);assert.equal(again.y,p.y);
  assert.deepEqual(g.zombies.filter(e=>e!==again).map(e=>[e.id,e.kind,e.x,e.y]),spots,'escorte retrouvée par ses identifiants');
  const notes=watch(g);for(let i=0;i<60;i++)g.update(DT);
  assert.equal(again.x,p.x);assert.equal(again.y,p.y);assert.equal(g.zombies.length,1+n,'pas de seconde Meneuse ni de seconde escorte');assert.equal(notes.filter(t=>t.includes('Meneuse')).length,0,'la reprise ne rejoue aucune annonce');
  assert.deepEqual(g.zombies.filter(e=>e!==again).map(e=>[e.id,e.kind,e.x,e.y]),spots,'toujours immobile après la reprise');
  g.killZombie(again,false);
  // Une sauvegarde prise entre le coup et l'image suivante relève déjà la mort.
  assert.equal(state(g).led.status,'slain');
  const slain=copy(g.serialize());assert.equal(g.restoreSave(slain),true);assert.equal(state(g).led.status,'slain');assert.equal(api.leader(),null);
  const announced=toAssault(g);assert.equal(g.wavePlan.total,announced.total-A.cut(announced.total)-n);
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

test('vagues menées 217 : l’escorte se réveille quand le Commandant approche, et la Meneuse frappe comme une Errante',()=>{
  const {g}=campaign(),api=g.abominations217,notes=watch(g),wave=api.next();
  calm(g,wave);const z=body(g),p=A.post(g.world.seed,wave),n=api.escort().size;
  // Juste hors de portée : rien ne bouge.
  g.player.x=p.x;g.player.y=p.y+(p.y>C.WORLD_SIZE/2?-1:1)*(R.escort.wake+R.escort.ringMax+40);api.tick();assert.equal(api.escort().woken,false);
  g.player.x=p.x;g.player.y=p.y+(p.y>C.WORLD_SIZE/2?-1:1)*(R.escort.wake-10);api.tick();
  assert.equal(api.escort().woken,true);assert.equal(state(g).escort.woken,true);assert.equal(state(g).led.status,'alive','dérangée, elle n’est pas abattue');
  assert.equal(notes.filter(t=>t.startsWith('Meneuse dérangée')&&t.includes(n+' infectés ordinaires')).length,1);
  // Elle et son escorte reviennent dans la boucle des infectés : elles marchent.
  const x=z.x,y=z.y,guards=g.zombies.filter(e=>e!==z),before=guards.map(e=>[e.x,e.y]);
  for(let i=0;i<45;i++)g.update(DT);
  assert.ok(z.dead||z.x!==x||z.y!==y,'la Meneuse marche');assert.ok(guards.some((e,i)=>e.dead||e.x!==before[i][0]||e.y!==before[i][1]),'l’escorte marche');
  assert.equal(notes.filter(t=>t.startsWith('Meneuse dérangée')).length,1,'annoncé une fois');
  // Toujours une Errante ordinaire : mêmes points de vie, même type.
  assert.equal(z.kind,'walker');assert.ok(z.maxHealth<=C.ENEMIES.walker.health*g.difficulty.enemyHealth*1.34+1e-6);
  assert.match(api.line(),/dérangée : elle marche et frappe comme une Errante/);
});

test('vagues menées 217 : un tir qui passe, ou un membre touché, réveille l’escorte',()=>{
  for(const how of ['shot','hit']){
    const {g}=campaign(),api=g.abominations217,wave=api.next();
    calm(g,wave);const z=body(g),guard=g.zombies.find(e=>e!==z);
    if(how==='shot'){
      const far={x:guard.x+R.escort.shot+R.escort.ringMax*2+60,y:guard.y,dead:false};
      g.projectiles.push(far);api.tick();assert.equal(api.escort().woken,false,'un tir lointain ne réveille personne');
      far.x=guard.x+R.escort.shot-5;api.tick();g.projectiles.splice(g.projectiles.indexOf(far),1);
    }else{guard.health-=1;api.tick();}
    assert.equal(api.escort().woken,true,how);
  }
});

test('vagues menées 217 : sauvegarde en plein assaut mené — contrôles des échelons verts, puis refus d’une sauvegarde incohérente',()=>{
  const {g}=campaign(),api=g.abominations217,wave=api.next();
  calm(g,wave);toAssault(g);
  for(let i=0;i<120;i++)g.update(DT);
  const data=copy(g.serialize()),night=data.dayworks.night;
  const pending=Object.values(data.pendingSpawns).reduce((a,b)=>a+b,0)+data.spawnQueue.length;
  assert.ok(night.emitted>0,'des contacts sont déjà entrés');assert.equal(night.total,data.wavePlan.total);assert.equal(night.emitted,night.total-pending);
  assert.equal(g.restoreSave(copy(data)),true);assert.equal(api.forecast().real,api.forecast().entering+state(g).escort.taken);
  // Le contrôle de save.js reste actif : une escorte comptée deux fois serait refusée.
  const twice=copy(data);twice.wavePlan.total+=state(g).escort.taken;assert.throws(()=>{if(g.restoreSave(twice)!==true)throw Error('refusée');});
});

test('vagues menées 217 : sauvegarde et reprise en pleine journée menée, escorte réveillée',()=>{
  const {g}=campaign(),api=g.abominations217,wave=api.next();
  calm(g,wave);const z=body(g),guard=g.zombies.find(e=>e!==z);guard.health-=1;api.tick();
  for(let i=0;i<20;i++)g.update(DT);
  const data=copy(g.serialize());assert.equal(data.expansions127.modules.abominations217.escort.woken,true);
  assert.equal(g.restoreSave(copy(data)),true);const again=body(g);assert.ok(again);
  const x=again.x,y=again.y;for(let i=0;i<30;i++)g.update(DT);assert.ok(again.dead||again.x!==x||again.y!==y,'reprise : elle marche toujours');
  const announced=toAssault(g),taken=state(g).escort.taken;assert.equal(taken,data.expansions127.modules.abominations217.escort.ids.length);
  assert.equal(g.wavePlan.total,announced.total+A.gain(announced.total)-taken);
});

test('vagues menées 217 : une sauvegarde de la première tranche (sans escorte) reprend telle quelle',()=>{
  const {g}=campaign(),api=g.abominations217,wave=api.next();
  calm(g,wave);const z=body(g);
  const data=copy(g.serialize()),mod=data.expansions127.modules.abominations217;
  // Sauvegarde de la première tranche : la Meneuse seule, pas de clé d'escorte.
  const ids=new Set(mod.escort.ids);delete mod.escort;data.zombies=data.zombies.filter(e=>!ids.has(Array.isArray(e)?e[0]:e.id));
  assert.equal(g.restoreSave(data),true);assert.equal(api.escort(),null);assert.equal(g.zombies.length,1);
  for(let i=0;i<30;i++)g.update(DT);assert.equal(body(g).x,z.x,'immobile comme avant');assert.equal(api.escort(),null,'aucune escorte ajoutée en cours de vague');
  const announced=toAssault(g);assert.equal(g.wavePlan.total,announced.total+A.gain(announced.total),'aucun prélèvement sans escorte');
  assert.equal(state(g).escort,undefined);
});

test('vagues menées 217 : le poste est vérifié contre le décor, d’autres points du même côté sont essayés',()=>{
  const {g}=campaign(),api=g.abominations217,notes=watch(g),wave=api.next(),list=A.posts(g.world.seed,wave);
  const clear=g.friendlyPositionClear;
  // Le poste d'origine et ses abords immédiats sont bloqués : la Meneuse prend le premier point libre de la liste.
  const blocked=(x,y)=>Math.hypot(x-list[0].x,y-list[0].y)<R.post.step*.6;
  g.friendlyPositionClear=function(e,x,y){return !blocked(x,y)&&clear.call(this,e,x,y);};
  calm(g,wave);const z=body(g);assert.ok(z);assert.notDeepEqual([z.x,z.y],[list[0].x,list[0].y]);
  const used=list.find(q=>q.x===z.x&&q.y===z.y);assert.ok(used,'un point de la liste fixe');assert.equal(used.side,list[0].side);
  for(const e of g.zombies)assert.ok(!blocked(e.x,e.y),'personne sur le sol bloqué');
  // Même campagne, même graine : même poste.
  const again=campaign().g;again.friendlyPositionClear=g.friendlyPositionClear;calm(again,wave);
  assert.deepEqual([body(again).x,body(again).y],[z.x,z.y]);
  // Tout le côté bloqué : pas de Meneuse, vague ordinaire, annoncé (avec la règle s'il s'agit de la première vague menée).
  const {g:h}=campaign(),hn=watch(h);h.friendlyPositionClear=()=>false;calm(h,wave);
  assert.equal(h.abominations217.leader(),null);assert.equal(h.zombies.length,0);assert.equal(h.serialize().expansions127.modules.abominations217.led.status,'absent');
  assert.equal(hn.filter(t=>t.includes('ne laisse aucun poste')).length,1);
  assert.equal(hn.filter(t=>t.includes('Première vague menée de la campagne')).length,A.nextLed(R.firstWave,h.world.seed)===wave?1:0);
  const announced=toAssault(h);assert.deepEqual(copy(h.wavePlan),announced,'vague ordinaire');assert.equal(h.abominations217.forecast(),null);
});

test('vagues menées 217 : prévision et annonce de migration donnent l’effectif réel',()=>{
  const Readout=require('../src/siege-readout.js'),{g,doc}=campaign(),api=g.abominations217,wave=api.next();Readout.install(g,doc);
  calm(g,wave);
  let f=api.forecast();assert.equal(f.decided,false);assert.equal(f.alive,f.plan+A.gain(f.plan));assert.equal(f.slain,f.plan-A.cut(f.plan));assert.equal(f.escort,api.escort().size);
  g.phaseTime=0;g.update(DT);assert.equal(g.phase,'warning');
  // Le texte affiché est celui qui atteint le moteur, après la réécriture du module.
  const total=g.wavePlan.total,migration=g.notifications.map(n=>n.text).find(t=>t.startsWith('Migration détectée'));
  assert.equal(migration,'Migration détectée — vague menée : '+(total+A.gain(total))+' contacts si la Meneuse vit à l’assaut, '+(total-A.cut(total))+' si elle tombe (plan : '+total+'), dont '+f.escort+' de l’escorte déjà sur place.');
  f=api.forecast();assert.equal(f.plan,total);
  // Lecture de siège : la fourchette, puis l'effectif réel une fois l'assaut lancé.
  g.siegeReadout.render();assert.equal(doc.getElementById('siegeReadoutLed').hidden,false);
  assert.equal(doc.getElementById('siegeReadoutLed').textContent,'Vague '+wave+' menée : '+f.alive+' infectés si la Meneuse vit à l’assaut, '+f.slain+' si elle tombe ('+total+' au plan, dont '+f.escort+' de l’escorte déjà sur place).');
  g.phaseTime=0;g.update(DT);f=api.forecast();g.siegeReadout.render();
  assert.equal(f.real,total+A.gain(total));assert.match(doc.getElementById('siegeReadoutLed').textContent,new RegExp('^Vague '+wave+' menée : '+f.real+' infectés en tout \\('+total+' au plan, \\+'+A.gain(total)+' rassemblés'));
  // Une vague ordinaire : migration inchangée, aucune ligne.
  const {g:h,doc:hd}=campaign();Readout.install(h,hd);calm(h,wave+1);h.phaseTime=0;h.update(DT);
  assert.equal(h.notifications.map(n=>n.text).find(t=>t.startsWith('Migration détectée')),'Migration détectée — '+h.wavePlan.total+' contacts estimés.');
  h.siegeReadout.render();assert.equal(hd.getElementById('siegeReadoutLed').hidden,true);
});

// ——— Troisième tranche : Comble-fossé et Traîne-épave (module `abominationsSiege217`) ———
const siege=g=>g.serialize().expansions127.modules.abominationsSiege217;
const E217=C.Earthworks217Rules;
// Fossés creusés et ouverts, posés par la sauvegarde : une ligne de six cases libres au sud-est du centre.
function ditched(g){
  const core=g.core(),cx=C.grid(core.x),cy=C.grid(core.y),cells=[];
  for(let x=cx+20;cells.length<6&&x<cx+40;x++)if(!g.world.atCell(x,cy+20))cells.push({x,y:cy+20,dug:E217.digSeconds,fill:0,wet:false,back:null});
  const data=copy(g.serialize());data.expansions127.modules.earthworks217.ditches=cells;assert.equal(g.restoreSave(data),true);
  assert.equal(g.earthworks217.tally().open,cells.length);return cells;
}
const centre=c=>({x:c.x*C.TILE+C.TILE/2,y:c.y*C.TILE+C.TILE/2});
// Mur achevé posé à côté du centre, comme dans les tests de la brèche.
function wall(g,dx=-4,dy=-6,type='woodWall'){
  const core=g.core(),T=require('../src/tactics.js'),cells=T.footprint(core),W=core.constructor;
  const b=new W(g.nextId++,type,cells.x+dx,cells.y+dy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);g.world.navigationVersion++;return b;
}
// Assaut jusqu'à l'entrée de l'abomination.
function untilNamed(g,api){
  for(let i=0;i<3000&&api.current()?.status==='expected';i++)g.update(DT);
  assert.equal(api.current()?.status,'alive','abomination entrée');return g.zombies.find(z=>z.id===api.current().id);
}

test('abominations du siège 217 : règles, état versionné strict, choix déterministe sans géants ni vague menée',()=>{
  assert.deepEqual(A.siegeValidate(undefined),{version:1,active:false,current:null});
  assert.deepEqual(A.siegeFresh(),{version:1,active:true,current:null});
  const cur={wave:14,kind:'fill',status:'alive',from:5,id:9,side:'north',count:3,wall:0};
  const good=[{version:1,active:true,current:null},{version:1,active:true,current:cur},{version:1,active:true,current:{...cur,status:'slain'}},
    {version:1,active:true,current:{wave:14,kind:'fill',status:'expected',from:0,id:0,side:'',count:0,wall:0}},{version:1,active:true,current:{wave:18,kind:'drag',status:'alive',from:5,id:9,side:'east',count:1,wall:44}}];
  for(const ok of good){assert.deepEqual(A.siegeValidate(ok),ok);assert.notEqual(A.siegeValidate(ok),ok);}
  for(const bad of [null,{},{version:2,active:true,current:null},{version:1,active:false,current:cur},{version:1,active:true,current:null,x:1},
    {version:1,active:true,current:{...cur,kind:'boss'}},{version:1,active:true,current:{...cur,wave:13}},{version:1,active:true,current:{...cur,id:4}},
    {version:1,active:true,current:{...cur,side:''}},{version:1,active:true,current:{...cur,wall:3}},{version:1,active:true,current:{...cur,status:'expected'}},
    {version:1,active:true,current:{...cur,health:9999}},{version:1,active:true,current:{...cur,kind:'drag',wave:18,count:1,wall:0}},{version:1,active:true,current:{...cur,kind:'drag',wave:18,count:2,wall:4}}])
    assert.throws(()=>A.siegeValidate(bad),/Abominations du siège 217/);
  const siegeR=C.VerticalCitadel175.siege,giant=w=>w>=siegeR.firstWave&&w%siegeR.spawnWaveInterval===0,all=Array.from({length:120},(_,i)=>i+1);
  for(const seed of [0,1,42,17117,84329,967313470,1947648717,4294967295]){
    const fill=all.filter(w=>A.siegeWave('fill',w,seed)),drag=all.filter(w=>A.siegeWave('drag',w,seed));
    assert.deepEqual(fill,all.filter(w=>A.siegeWave('fill',w,seed)),'même réponse');assert.ok(fill.length>5&&drag.length>5);
    for(const w of fill){assert.ok(w>=R.filler.firstWave&&!giant(w)&&!A.led(w,seed));}
    for(const w of drag){assert.ok(w>=R.dragger.firstWave&&!giant(w)&&!A.led(w,seed)&&!fill.includes(w));}
    assert.equal(A.nextSiege('fill',1,seed),fill[0]);assert.equal(A.nextSiege('drag',fill[0],seed),drag.find(w=>w>=fill[0]));
  }
  for(const bad of [0,13.5,NaN,'14',null])assert.equal(A.siegeWave('fill',bad,17117),false);
});

test('Comble-fossé 217 : sans fossé, elle ne vient pas ; avec fossés, annoncée, entrée ordinaire, sans tirage ni infecté de plus',()=>{
  const {g}=campaign(),api=g.abominationsSiege217,wave=api.next('fill');assert.ok(api.active());assert.equal(api.wave('fill',wave),true);
  let notes=watch(g);calm(g,wave);const plain=toAssault(g);assert.equal(api.current(),null);assert.deepEqual(copy(g.wavePlan),plain);
  assert.equal(notes.filter(t=>/Comble-fossé/.test(t)).length,0,'aucune annonce sans fossé');
  const {g:h,doc}=campaign(),hapi=h.abominationsSiege217;ditched(h);notes=watch(h);calm(h,wave);
  h.phaseTime=0;h.update(DT);assert.equal(h.phase,'warning');assert.equal(hapi.current().status,'expected');
  assert.equal(notes.filter(t=>t.startsWith('Vague '+wave+' : une Comble-fossé marche dans la horde')).length,1,'annoncée avant');
  const announced=copy(h.wavePlan);h.phaseTime=0;h.update(DT);assert.equal(h.phase,'assault');assert.deepEqual(copy(h.wavePlan),announced,'plan inchangé');
  const z=untilNamed(h,hapi);assert.ok(z&&!z.dead);assert.equal(z.kind,'walker');
  assert.equal(notes.filter(t=>t.startsWith('Comble-fossé entrée')).length,1,'annoncée pendant');
  // Aucun infecté ajouté : à entrer + présents + abattus = plan.
  assert.equal(Object.values(h.pendingSpawns).reduce((a,b)=>a+b,0)+h.spawnQueue.length+h.zombies.length,announced.total);
  // Points de vie ordinaires : ceux d'une Errante de la même vague.
  h.spawnZombie('walker');const twin=h.zombies[h.zombies.length-1];assert.equal(z.maxHealth,twin.maxHealth);assert.equal(z.radius,twin.radius);twin.dead=true;h.zombies=h.zombies.filter(e=>!e.dead);
  // Sa désignation ne tire rien dans le flux du jeu.
  const {g:k}=campaign(),kapi=k.abominationsSiege217;ditched(k);calm(k,wave);toAssault(k);
  const lead=()=>k.wavePlan.total-k.spawnQueue.length-Object.values(k.pendingSpawns).reduce((a,b)=>a+b,0)>=Math.ceil(k.wavePlan.total*R.filler.lead);
  // Le moteur avance seul jusqu'au seuil (la désignation suit dans la même image) ; la relève directe ne tire rien.
  for(let i=0;i<3000&&!lead();i++)k.update(DT);
  const before=k.random.state;kapi.tick();assert.equal(k.random.state,before,'aucun tirage');assert.equal(kapi.current().status,'alive');
  // Marqueur au sol, dans la marée, ligne du dossier.
  const m=hapi.mark();assert.equal(m.mark,'COMBLE-FOSSÉ');assert.equal(m.x,z.x);assert.equal(m.health,z.health);
  hapi.render();assert.match(doc.getElementById('abominationsSiege217Line').textContent,/^Vague \d+ : Comble-fossé dans la horde/);
  const Horizon=require('../src/horde-horizon217.js');assert.equal(Horizon.siegeOf(h).kind,'fill');assert.match(Horizon.siegeSentence(Horizon.siegeOf(h)),/Comble-fossé dans la horde/);
  assert.equal(JSON.stringify(C.ENEMIES),ENEMIES);assert.equal(JSON.stringify(C.ENEMY_RULES),RULES);
});

test('Comble-fossé 217 : les corps tombés près d’elle comptent double dans le fossé ; abattue tôt, effet évité',()=>{
  const {g}=campaign(),api=g.abominationsSiege217,wave=api.next('fill'),cells=ditched(g);calm(g,wave);toAssault(g);
  const z=untilNamed(g,api),a=centre(cells[0]),far=centre(cells[5]);
  z.x=a.x+20;z.y=a.y;
  const victims=g.zombies.filter(e=>e!==z&&!e.dead).slice(0,2);assert.equal(victims.length,2);
  victims[0].x=a.x;victims[0].y=a.y;g.killZombie(victims[0],false);
  assert.equal(g.earthworks217.at(cells[0].x,cells[0].y).fill,2,'près d’elle : deux corps dans le fossé');assert.equal(api.current().count,1);
  victims[1].x=far.x;victims[1].y=far.y;g.killZombie(victims[1],false);
  assert.equal(g.earthworks217.at(cells[5].x,cells[5].y).fill,1,'loin d’elle : un corps, la règle des travaux de terrain');
  // Sauvegarde et reprise pendant qu'elle vit : même infectée, même compte, contrôles des échelons verts.
  const data=copy(g.serialize());assert.deepEqual(data.expansions127.modules.abominationsSiege217.current,copy(api.current()));
  assert.equal(data.dayworks.night.total,data.wavePlan.total);
  assert.equal(g.restoreSave(copy(data)),true);const again=g.zombies.find(e=>e.id===z.id);assert.ok(again);assert.equal(api.current().status,'alive');assert.equal(api.current().count,1);
  const notes=watch(g);g.killZombie(again,false);g.update(DT);assert.equal(api.current().status,'slain');
  assert.equal(notes.filter(t=>t.startsWith('Comble-fossé abattue')&&t.includes('1 corps de plus')).length,1,'annoncée après');
  const next=g.zombies.find(e=>!e.dead);
  if(next){next.x=a.x;next.y=a.y;const before=g.earthworks217.at(cells[0].x,cells[0].y).fill;g.killZombie(next,false);assert.equal(g.earthworks217.at(cells[0].x,cells[0].y).fill,before+1,'abattue : plus d’effet');}
  // Abattue avant la ligne : aucun corps de plus.
  const {g:h}=campaign(),hapi=h.abominationsSiege217,hc=ditched(h);calm(h,wave);toAssault(h);
  const hz=untilNamed(h,hapi);h.killZombie(hz,false);h.update(DT);
  const v=h.zombies.find(e=>!e.dead),p=centre(hc[0]);v.x=p.x;v.y=p.y;h.killZombie(v,false);
  assert.equal(h.earthworks217.at(hc[0].x,hc[0].y).fill,1);assert.equal(hapi.current().count,0);assert.match(hapi.line(),/abattue .*avant les fossés/);
  // État altéré refusé.
  const bad=copy(data);bad.expansions127.modules.abominationsSiege217.current.id=0;assert.throws(()=>{if(g.restoreSave(bad)!==true)throw Error('refusée');});
});

test('Traîne-épave 217 : au contact d’un mur, son épave ajoute à la charge de corps et fait rampe ; abattue avant, rien',()=>{
  const {g}=campaign(),api=g.abominationsSiege217,wave=api.next('drag');assert.ok(wave>=R.dragger.firstWave);
  const w=wall(g),notes=watch(g);calm(g,wave);g.phaseTime=0;g.update(DT);
  assert.equal(notes.filter(t=>t.startsWith('Vague '+wave+' : une Traîne-épave marche dans la horde')).length,1);
  g.phaseTime=0;g.update(DT);const z=untilNamed(g,api);assert.equal(z.kind,'walker');
  const probe={id:0,kind:'runner'};w.corpseLoad=10;assert.equal(g.zombieCanClimb(probe,w),false);
  z.x=w.left-12;z.y=(w.top+w.bottom)/2;api.tick();
  assert.equal(w.corpseLoad,10+R.dragger.load,'épave = charge de corps');assert.deepEqual([api.current().count,api.current().wall],[1,w.id]);
  assert.equal(g.zombieCanClimb(probe,w),true,'l’amas fait rampe : mécanique de franchissement du jeu');
  assert.equal(w.health,w.def.health,'aucun dégât');
  api.tick();assert.equal(w.corpseLoad,10+R.dragger.load,'une seule épave');
  assert.equal(notes.filter(t=>t.startsWith('Traîne-épave contre le mur')).length,1);
  const data=copy(g.serialize());assert.equal(g.restoreSave(data),true);assert.deepEqual(copy(api.current()),data.expansions127.modules.abominationsSiege217.current);
  // Abattue loin du mur : aucune épave.
  const {g:h}=campaign(),hapi=h.abominationsSiege217,hw=wall(h);calm(h,wave);toAssault(h);const hz=untilNamed(h,hapi);
  h.killZombie(hz,false);h.update(DT);hz.x=hw.left-12;hz.y=(hw.top+hw.bottom)/2;hapi.tick();
  assert.equal(hw.corpseLoad,0);assert.equal(hapi.current().status,'slain');assert.equal(hapi.current().count,0);
  // Sans mur, elle ne vient pas.
  const {g:k}=campaign(),kapi=k.abominationsSiege217;calm(k,wave);toAssault(k);assert.equal(kapi.current(),null);
});

test('abominations du siège 217 : plafond de trois avec les géants et la Meneuse',()=>{
  const {g}=campaign(),api=g.abominationsSiege217,wave=api.next('fill');ditched(g);calm(g,wave);toAssault(g);
  const v=g.vertical175;g.vertical175={...v,presentation:()=>({...v.presentation(),giants:[{},{},{}]})};
  const notes=watch(g);for(let i=0;i<3000&&api.current().status==='expected';i++)g.update(DT);
  assert.equal(api.current().status,'absent');assert.equal(notes.filter(t=>t.includes('abominations sont déjà là')).length,1);
  g.vertical175=v;assert.equal(api.present(),0);
});

test('abominations du siège 217 : ancienne campagne (et campagne des vagues menées) inchangée',()=>{
  const {g,doc}=campaign(),api=g.abominationsSiege217,wave=api.next('fill');ditched(g);
  const data=copy(g.serialize());delete data.expansions127.modules.abominationsSiege217;assert.equal(g.restoreSave(data),true);
  assert.equal(api.active(),false);assert.deepEqual(siege(g),{version:1,active:false,current:null});assert.equal(api.next('fill'),null);assert.equal(g.abominations217.active(),true,'les vagues menées restent');
  const notes=watch(g);calm(g,wave);const announced=toAssault(g);
  for(let i=0;i<300;i++)g.update(DT);
  assert.equal(api.current(),null);assert.deepEqual(copy(g.wavePlan),announced);assert.equal(notes.filter(t=>/Comble-fossé|Traîne-épave/.test(t)).length,0);
  assert.equal(api.line(),'');api.render();assert.equal(doc.getElementById('abominationsSiege217Readout')?.hidden??true,true);assert.match(api.overview().summary,/avant cette règle/);
  assert.equal(reference(),PRISTINE);
});

test('abominations du siège 217 : inscrit partout, sans tirage, sans dégât',()=>{
  const kit=fs.readFileSync(path.join(root,'src/expansion-kit.js'),'utf8');assert.ok(kit.indexOf("'abominationsSiege217'")>0&&kit.indexOf("'abominationsSiege217'")<kit.indexOf("'balance217','breach217']"));
  const ui=fs.readFileSync(path.join(root,'src/expansion-ui.js'),'utf8');assert.equal(ui.split('abominationsSiege217').length-1,5);assert.ok(ui.includes("abominationsSiege217:'Abominations du siège'"));
  const source=fs.readFileSync(path.join(root,'src/abominations217.js'),'utf8'),part=source.slice(source.indexOf('Troisième tranche'));
  assert.doesNotMatch(part,/random|spawnZombie\(|\.push\(new|damage|\.health\s*[-+*]?=[^=]|maxHealth\s*=/);
});
