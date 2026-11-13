'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas');
const C=require('../src/core.js'),Horizon=require('../src/horde-horizon217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const root=path.join(__dirname,'..'),SIZE=C.WORLD_SIZE;

// État minimal : seuls les champs lus par le module existent.
function stub(overrides={}){
  return {state:'playing',gameOver:false,phase:'warning',phaseTime:0,wave:6,elapsed:12,fronts:['north'],wavePlan:{total:86},spawnQueue:[],pendingSpawns:C.normalizeSpawnCounts(),
    world:{seed:17117},settings:{reducedMotion:false,quality:'auto'},width:640,height:400,camera:{x:320,y:200,zoom:1},frameShake:{x:0,y:0},daylight:()=>1,...overrides};
}
function pixels(g,background='#6a8599'){
  const canvas=createCanvas(g.width,g.height),ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,g.width,g.height);
  const before=Buffer.from(ctx.getImageData(0,0,g.width,g.height).data),drawn=Horizon.paint(ctx,g),after=Buffer.from(ctx.getImageData(0,0,g.width,g.height).data);
  // Nombre de pixels modifiés dans un rectangle d'écran.
  const changed=(x0,y0,x1,y1)=>{let n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*g.width+x)*4;if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])n++;}return n;};
  return {drawn,changed,after};
}

test('marée 217 : rien à lire au calme ni pendant la sécurisation',()=>{
  assert.equal(Horizon.horizon(stub({phase:'calm'})),null);
  assert.equal(Horizon.horizon(stub({phase:'aftermath'})),null);
  assert.equal(Horizon.horizon(null),null);
  assert.equal(Horizon.sentence(null),'');
  assert.deepEqual(Horizon.silhouettes(stub({phase:'calm'})),[]);
});

test('marée 217 : en alerte, les fronts annoncés et l’effectif total du plan, sans partage inventé',()=>{
  const state=Horizon.horizon(stub({fronts:['north','east'],wavePlan:{total:86}}));
  assert.deepEqual({...state,fronts:[...state.fronts],entering:[...state.entering]},{phase:'warning',wave:6,fronts:['north','east'],entering:[],remaining:86,total:86,perFront:null});
  assert.ok(Object.isFrozen(state)&&Object.isFrozen(state.fronts));
  assert.equal(Horizon.sentence(state),'Horde en approche : nord, est — 86 contacts restant à entrer');
  assert.equal(Horizon.sentence(Horizon.horizon(stub({fronts:['west'],wavePlan:{total:1}}))),'Horde en approche : ouest — 1 contact restant à entrer');
  // Fronts inconnus ou répétés écartés ; sans plan ni front, rien n'est affiché.
  assert.deepEqual([...Horizon.horizon(stub({fronts:['south','south','up','west']})).fronts],['south','west']);
  assert.equal(Horizon.horizon(stub({wavePlan:null})),null);
  assert.equal(Horizon.horizon(stub({fronts:[]})),null);
});

test('marée 217 : en assaut, exactement la file restante, puis plus rien quand elle est vide',()=>{
  const pending=C.normalizeSpawnCounts({walker:30,runner:5});
  const g=stub({phase:'assault',fronts:['south','west'],wavePlan:{total:86},spawnQueue:['walker','walker','runner'],pendingSpawns:pending});
  const state=Horizon.horizon(g);
  assert.equal(state.remaining,3+C.spawnCount(pending));assert.equal(state.remaining,38);assert.equal(state.total,86);
  assert.deepEqual([...state.fronts],['south','west']);
  g.spawnQueue.pop();assert.equal(Horizon.horizon(g).remaining,37,'la lecture suit la file');
  // Repli du directeur : sans front, les arrivées entrent par le nord.
  assert.deepEqual([...Horizon.horizon(stub({phase:'assault',fronts:[],spawnQueue:['walker']})).fronts],['north']);
  const empty=stub({phase:'assault',spawnQueue:[],pendingSpawns:C.normalizeSpawnCounts()});
  assert.equal(Horizon.horizon(empty),null);assert.deepEqual(Horizon.silhouettes(empty),[]);
  assert.equal(pixels(empty).drawn,0);
});

test('marée 217 : en assaut échelonné, seuls les fronts des échelons restants gardent une masse',()=>{
  // Même projection que le directeur : `Dayworks.frontGroup` sur la nuit sauvegardée, sans tirage.
  const fronts=['east','north','south','west'],night=C.Dayworks.beginNight(8,90,fronts.slice());
  const g=stub({phase:'assault',wave:8,fronts,wavePlan:{total:90},spawnQueue:[],pendingSpawns:C.normalizeSpawnCounts({walker:90}),dayworks:{snapshot:()=>({night:{...night,fronts:night.fronts.slice()}})},siege:{assaultPattern:()=>undefined}});
  const group=emitted=>C.Dayworks.frontGroup({...night,emitted});
  let state=Horizon.horizon(g);
  assert.deepEqual([...state.entering],group(0));assert.deepEqual([...state.fronts].sort(),[...new Set([...group(0),...group(30),...group(60)])].sort());
  for(const emitted of [30,60,89]){
    night.emitted=emitted;g.pendingSpawns=C.normalizeSpawnCounts({walker:90-emitted});state=Horizon.horizon(g);
    const pending=new Set();for(const at of [emitted,30,60].filter(n=>n>=Math.floor(emitted/30)*30))for(const front of group(at))pending.add(front);
    assert.deepEqual([...state.entering].sort(),group(emitted).slice().sort(),emitted+' : échelon en cours');
    assert.deepEqual([...state.fronts].sort(),[...pending].sort(),emitted+' : fronts encore attendus');
    assert.equal(state.remaining,90-emitted);
    assert.deepEqual([...new Set(Horizon.silhouettes(g).map(s=>s.front))].sort(),[...pending].sort(),emitted+' : masses dessinées');
  }
  assert.deepEqual([...Horizon.horizon(g).fronts],group(89),'dernier échelon : seuls ses fronts restent');
  // Une nuit d'une autre vague est ignorée : on retombe sur les fronts annoncés.
  const stale=stub({phase:'assault',wave:9,fronts:['north','east'],spawnQueue:['walker'],dayworks:{snapshot:()=>({night})}});
  assert.deepEqual([...Horizon.horizon(stale).fronts],['north','east']);assert.deepEqual([...Horizon.horizon(stale).entering],['north','east']);
});

test('marée 217 : silhouettes déterministes, dérivées de la graine, de la vague et de l’index',()=>{
  const g=stub({fronts:['north','east'],wavePlan:{total:300}});
  const first=Horizon.silhouettes(g),second=Horizon.silhouettes(g);
  assert.ok(first.length>20);assert.deepEqual(second,first);
  assert.notDeepEqual(Horizon.silhouettes(stub({fronts:['north','east'],wavePlan:{total:300},wave:7})),first,'autre vague, autre masse');
  assert.notDeepEqual(Horizon.silhouettes(stub({fronts:['north','east'],wavePlan:{total:300},world:{seed:4242}})),first,'autre graine, autre masse');
  // Le temps ne déplace aucun emplacement : seule l'animation du peintre le lit.
  assert.deepEqual(Horizon.silhouettes(stub({fronts:['north','east'],wavePlan:{total:300},elapsed:999})),first);
  for(const s of first){
    const inward=s.front==='north'?s.y:s.front==='south'?SIZE-s.y:s.front==='west'?s.x:SIZE-s.x;
    assert.ok(inward>0&&inward<=Horizon.limits.band,'dans la bande de bord');
    assert.ok(s.x>=0&&s.x<=SIZE&&s.y>=0&&s.y<=SIZE);
  }
});

test('marée 217 : la masse s’amenuise avec la file, sans déplacer les silhouettes restantes',()=>{
  const view={left:0,right:900,top:0,bottom:500},key=s=>s.front+':'+s.x.toFixed(4)+':'+s.y.toFixed(4);
  const at=n=>Horizon.silhouettes(stub({phase:'assault',fronts:['north'],wavePlan:{total:400},spawnQueue:Array(Math.min(n,64)).fill('walker'),pendingSpawns:C.normalizeSpawnCounts({walker:Math.max(0,n-64)})}),{view});
  let previous=at(400);assert.ok(previous.length>60);
  for(const n of [300,200,120,60,20,5]){
    const next=at(n),known=new Set(previous.map(key));
    assert.ok(next.length<=previous.length,n+' : jamais plus dense');
    for(const s of next)assert.ok(known.has(key(s)),n+' : aucune silhouette nouvelle ou déplacée');
    previous=next;
  }
  assert.ok(previous.length<20&&at(400).length>previous.length*3);
  assert.deepEqual(at(0),[]);
});

test('marée 217 : coût borné quel que soit l’effectif, allégé en qualité basse',()=>{
  assert.equal(Horizon.limits.cap,240);
  for(const total of [1,86,740,2095,1e6,1e9]){
    for(const fronts of [['north'],['north','east','south','west']]){
      for(const view of [undefined,{left:0,right:2600,top:0,bottom:1500},{left:SIZE-700,right:SIZE,top:SIZE-400,bottom:SIZE}]){
        const high=Horizon.silhouettes(stub({fronts,wavePlan:{total}}),{view}),low=Horizon.silhouettes(stub({fronts,wavePlan:{total},settings:{quality:'low'}}),{view});
        assert.ok(high.length<=240,total+' : plafond');assert.ok(low.length<=Horizon.limits.capLow,total+' : plafond léger');
      }
    }
  }
  const g=stub({fronts:['north','west'],wavePlan:{total:2095},width:1600,height:900,camera:{x:800,y:450,zoom:.52}});
  assert.ok(pixels(g).drawn<=240);
  assert.ok(pixels({...g,settings:{quality:'low'}}).drawn<=96);
  assert.ok(Horizon.silhouettes(stub({fronts:['north'],wavePlan:{total:2095},settings:{quality:'low'}})).length<Horizon.silhouettes(stub({fronts:['north'],wavePlan:{total:2095}})).length);
  assert.deepEqual(Horizon.silhouettes(stub(),{budget:0}),[]);
});

test('marée 217 : le rendu d’alerte touche la bande du front annoncé, jamais la bande opposée ni l’intérieur',()=>{
  const band=Math.ceil(Horizon.limits.band);
  // Caméra au coin nord-ouest : le bord nord est en haut de l'écran, le bord ouest à gauche.
  const north=pixels(stub({fronts:['north'],wavePlan:{total:400}}));
  assert.ok(north.drawn>10);
  assert.ok(north.changed(100,0,640,band)>500,'bande nord dessinée');
  assert.equal(north.changed(0,band+2,640,400),0,'rien hors de la bande : le terrain jouable reste visible');
  const west=pixels(stub({fronts:['west'],wavePlan:{total:400}}));
  assert.ok(west.changed(0,100,band,400)>500,'bande ouest dessinée');
  assert.equal(west.changed(band+2,0,640,400),0,'aucun pixel le long du bord nord');
  // Caméra au coin sud-est : un front nord ne dessine rien à l'écran, un front sud dessine en bas.
  const corner={camera:{x:SIZE-320,y:SIZE-200,zoom:1}};
  const far=pixels(stub({...corner,fronts:['north'],wavePlan:{total:400}}));
  assert.equal(far.drawn,0);assert.equal(far.changed(0,0,640,400),0,'la bande opposée reste intacte');
  const south=pixels(stub({...corner,fronts:['south'],wavePlan:{total:400}}));
  assert.ok(south.changed(0,400-band,540,400)>500);assert.equal(south.changed(0,0,640,400-band-2),0);
  // Hors partie, en région ou partie perdue : rien.
  for(const off of [{state:'menu'},{gameOver:true},{frontier:{active:()=>true}},{player:{regionAbsent:true}},{phase:'calm'}])assert.equal(pixels(stub({fronts:['north'],wavePlan:{total:400},...off})).changed(0,0,640,400),0,JSON.stringify(Object.keys(off)));
});

test('marée 217 : la bande se dégage du HUD sans dépasser sa marge, et sans HUD elle colle au bord',()=>{
  const band=Math.ceil(Horizon.limits.band),base={fronts:['north','west'],wavePlan:{total:400}};
  // Barre haute de 68 px, panneau gauche de 270 px : le nord se décale de 68, l'ouest plafonne à 96.
  const hud={hud135:{safeFrame:()=>({top:68,left:270,right:600,bottom:380})}};
  const shifted=pixels(stub({...base,...hud}));
  // Seul le voile continu couvre la marge ; aucune silhouette n'y est posée.
  const moved=Horizon.silhouettes(stub(base),{clearance:{north:68,west:96}});assert.ok(moved.length>20);
  for(const s of moved)assert.ok((s.front==='north'?s.y:s.x)>=(s.front==='north'?68:96),'silhouette hors de la marge du HUD');
  assert.ok(shifted.changed(300,68,640,68+band)>500,'masse nord visible sous la barre');
  assert.equal(shifted.changed(band+Horizon.limits.clearance+2,68+band+2,640,400),0,'jamais au-delà de la bande décalée');
  assert.ok(shifted.changed(96,200,96+band,400)>500);
  // Bord hors écran ou cadre absurde : aucun décalage, aucune erreur.
  for(const frame of [{top:NaN,left:-50,right:1e9,bottom:Infinity},null])assert.deepEqual(pixels(stub({...base,hud135:{safeFrame:()=>frame}})).after,pixels(stub(base)).after);
  const list=Horizon.silhouettes(stub(base),{clearance:{north:1e6,west:-5}});
  for(const s of list)assert.ok((s.front==='north'?s.y:s.x)<=Horizon.limits.band+Horizon.limits.clearance);
});

test('marée 217 : animation lue dans le temps de jeu, figée en animations réduites, lisible de nuit',()=>{
  const base={fronts:['north'],wavePlan:{total:400}},band=Math.ceil(Horizon.limits.band);
  const a=pixels(stub({...base,elapsed:1})).after,b=pixels(stub({...base,elapsed:2.1})).after,again=pixels(stub({...base,elapsed:1})).after;
  assert.notDeepEqual(a,b,'le balancement suit g.elapsed');assert.deepEqual(again,a,'même temps, même image');
  const still={reducedMotion:true,quality:'auto'};
  assert.deepEqual(pixels(stub({...base,settings:still,elapsed:1})).after,pixels(stub({...base,settings:still,elapsed:2.1})).after,'animations réduites : image fixe');
  // Nuit noire : sur fond noir, le liseré laisse des pixels discernables dans la bande, et aucun ailleurs.
  const night=pixels(stub({...base,daylight:()=>.08,nightwatch:{isBlackout:()=>true}}),'#000000');
  assert.ok(night.changed(0,0,640,band)>150,'marée discernable de nuit');
  assert.equal(night.changed(0,band+2,640,400),0,'la nuit noire reste entière hors de la bande');
  let brightest=0;for(let i=0;i<night.after.length;i+=4)brightest=Math.max(brightest,night.after[i],night.after[i+1],night.after[i+2]);
  assert.ok(brightest>30&&brightest<150,'liseré discret : '+brightest);
  // L'alerte fait grossir la masse à mesure que le préavis s'écoule.
  assert.ok(Horizon.silhouettes(stub({...base,phaseTime:10})).length<Horizon.silhouettes(stub({...base,phaseTime:0})).length);
});

test('marée 217 : dans le jeu complet, ni tirage, ni changement d’état, et la ligne suit la phase',()=>{
  const {g,doc}=bootDocument134();
  require('../src/siege-readout.js').install(g,doc);Horizon.install(g,doc);assert.ok(g.hordeHorizon217);
  assert.equal(Horizon.install(g,doc),false,'une seule installation');
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();
  const line=doc.getElementById('hordeHorizonLine');assert.ok(line,'ligne ajoutée au dossier Situation');
  assert.equal(line.parentNode,doc.getElementById('siegeReadoutSignature'));
  g.hordeHorizon217.render();assert.equal(line.hidden,true,'rien au calme');assert.equal(line.textContent,'');
  // Passage réel en alerte par le directeur du jeu.
  g.phaseTime=.01;g.updateDirector(.05);assert.equal(g.phase,'warning');
  const state=()=>JSON.stringify({...g.serialize(),timestamp:0});
  const saved=state(),random=g.random.state,horde=g.zombies.length,stock=JSON.stringify(g.resources);
  const canvas=createCanvas(640,400),ctx=canvas.getContext('2d');
  const size={width:g.width,height:g.height,x:g.camera.x,y:g.camera.y};
  g.width=640;g.height=400;g.camera.x=320;g.camera.y=200;
  for(let i=0;i<3;i++)g.hordeHorizon217.paint(ctx);
  g.hordeHorizon217.silhouettes();g.hordeHorizon217.render();
  g.width=size.width;g.height=size.height;g.camera.x=size.x;g.camera.y=size.y;
  assert.equal(g.random.state,random,'aucun tirage consommé');assert.equal(g.zombies.length,horde);assert.equal(JSON.stringify(g.resources),stock);
  assert.ok(state()===saved,'le rendu ne change pas l’état sauvegardé');
  assert.equal(line.hidden,false);
  assert.equal(line.textContent,'Horde en approche : '+g.fronts.map(f=>({north:'nord',east:'est',south:'sud',west:'ouest'})[f]).join(', ')+' — '+g.wavePlan.total+' contact'+(g.wavePlan.total>1?'s':'')+' restant à entrer');
  // Assaut : la ligne lit la file réelle du directeur.
  g.phaseTime=.01;g.updateDirector(.05);assert.equal(g.phase,'assault');g.hordeHorizon217.render();
  const left=g.spawnQueue.length+C.spawnCount(g.pendingSpawns);
  assert.equal(g.hordeHorizon217.horizon().remaining,left);assert.match(line.textContent,new RegExp('— '+left+' contacts? restant à entrer$'));
  g.spawnQueue.length=0;for(const kind of Object.keys(g.pendingSpawns))g.pendingSpawns[kind]=0;
  g.hordeHorizon217.render();assert.equal(line.hidden,true,'file vide : plus de ligne');
});

test('marée 217 : installation sans erreur dans un DOM minimal, et source en lecture seule',()=>{
  const bare={state:'playing',phase:'calm',drawNight(){return 'night';},updateUI(){return 'ui';}};
  assert.equal(Horizon.install(bare,{body:{},getElementById:()=>null}),true);
  assert.equal(bare.drawNight({}),'night');assert.equal(bare.updateUI(),'ui');assert.equal(bare.hordeHorizon217.render(),false);
  assert.equal(Horizon.install({},undefined),true);assert.equal(Horizon.install(null,null),false);
  // Carte sans `insertBefore` ni `after` : l'ajout se fait par `appendChild`.
  const kids=[],card={appendChild:n=>kids.push(n)},boxed={state:'playing',phase:'warning',fronts:['east'],wavePlan:{total:12},wave:2};
  Horizon.install(boxed,{body:{},createElement:()=>({}),getElementById:id=>id==='siegeReadout'?card:null});
  assert.equal(kids.length,1);assert.equal(kids[0].textContent,'Horde en approche : est — 12 contacts restant à entrer');assert.equal(kids[0].hidden,false);
  const source=fs.readFileSync(path.join(root,'src/horde-horizon217.js'),'utf8');
  for(const forbidden of ['Math.random','.random','Date.now','performance.now','setInterval','requestAnimationFrame','localStorage','g.save','serialize','insertBefore','.after(','.push(new','spend('])assert.equal(source.includes(forbidden),false,forbidden);
  for(const field of ['zombies','resources','spawnQueue','pendingSpawns','fronts','wavePlan','phase','phaseTime'])assert.equal(new RegExp('\\.'+field+'\\s*(?:=(?!=)|\\+=|-=|\\.(?:push|pop|shift|splice|length\\s*=))').test(source),false,'écriture de '+field);
  assert.equal(/\bzombies\b/.test(source),false);assert.equal(/\bresources\b/.test(source),false);
});
