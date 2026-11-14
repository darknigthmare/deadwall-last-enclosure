'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas');
const C=require('../src/core.js'),Heaps=require('../src/corpse-heaps217.js'),Horizon=require('../src/horde-horizon217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const T=globalThis.DeadwallTactics||require('../src/tactics.js'),B=globalThis.DeadwallBattlefield||require('../src/battlefield.js');
const root=path.join(__dirname,'..'),TILE=C.TILE,LIMIT=Heaps.thresholds(),FIRST=LIMIT.first,ALL=LIMIT.all;

// État minimal : seuls les champs lus par le module existent. Le centre est en (320, 200).
function wall(id,gx,gy,load,extra={}){
  const left=gx*TILE,top=gy*TILE;
  return {id,type:'woodWall',def:{wall:true},progress:1,health:100,maxHealth:100,corpseLoad:load,left,top,right:left+TILE,bottom:top+TILE,x:left+TILE/2,y:top+TILE/2,...extra};
}
function stub(walls,overrides={}){
  const core={id:1,type:'core',x:320,y:200};
  return {state:'playing',gameOver:false,elapsed:3,world:{buildings:new Map(walls.map(w=>[w.id,w]))},core:()=>core,settings:{reducedMotion:false,quality:'auto'},
    width:640,height:400,camera:{x:320,y:200,zoom:1},frameShake:{x:0,y:0},...overrides};
}
function pixels(g,options,background='#55604f'){
  const canvas=createCanvas(g.width,g.height),ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,g.width,g.height);
  const before=Buffer.from(ctx.getImageData(0,0,g.width,g.height).data),drawn=Heaps.paint(ctx,g,options),after=Buffer.from(ctx.getImageData(0,0,g.width,g.height).data);
  const changed=(x0,y0,x1,y1)=>{let n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*g.width+x)*4;if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])n++;}return n;};
  return {drawn,changed,after};
}
function campaign(){
  const {g,doc}=bootDocument134();require('../src/siege-readout.js').install(g,doc);Heaps.install(g,doc);
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();return {g,doc};
}
function enclose(g){
  // Enceinte de palissades autour du centre, porte au nord, posée dans le monde réel (scène préparée).
  const core=g.core(),cells=T.footprint(core),r=3,placed=[];
  const put=(type,gx,gy)=>{const K=core.constructor,b=new K(g.nextId++,type,gx,gy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);placed.push(b);return b;};
  const x0=cells.x-r,x1=cells.x+cells.width+r-1,y0=cells.y-r,y1=cells.y+cells.height+r-1,gateX=cells.x;
  for(let x=x0;x<=x1;x++){if(x===gateX)put('gate',x,y0);else if(x!==gateX+1)put('woodWall',x,y0);put('woodWall',x,y1);}
  for(let y=y0+1;y<y1;y++){put('woodWall',x0,y);put('woodWall',x1,y);}
  g.world.navigationVersion++;g.refreshMetrics(true);
  const at=(gx,gy)=>placed.find(b=>b.gx===gx&&b.gy===gy);
  return {placed,gate:placed.find(b=>T.isGate(b)),north:at(x0+1,y0),south:at(x0+1,y1),west:at(x0,y0+3),east:at(x1,y0+3),x0,x1,y0,y1};
}

test('amas 217 : le seuil lu dans les règles est exactement celui de zombieCanClimb',()=>{
  const {g}=campaign(),{north}=enclose(g),span=ALL-FIRST+1;
  assert.equal(FIRST,C.LINECARE_RULES.rampMin);assert.equal(ALL,C.LINECARE_RULES.rampMax);
  // Chaque identifiant a son seuil, étalé de `rampMin` à `rampMax` ; la borne est stricte. Si la règle du
  // jeu change (base, étalement, espèces), cet essai échoue et le module doit être relu.
  for(let id=0;id<span*3;id++){
    const own=FIRST+id%span;
    for(const kind of ['runner','crawler']){
      north.corpseLoad=own;assert.equal(g.zombieCanClimb({id,kind},north),false,kind+' '+id+' : au seuil, pas encore');
      north.corpseLoad=own+1e-6;assert.equal(g.zombieCanClimb({id,kind},north),true,kind+' '+id+' : juste au-dessus');
    }
  }
  north.corpseLoad=FIRST;for(let id=0;id<200;id++)assert.equal(g.zombieCanClimb({id,kind:'runner'},north),false,'personne ne passe au premier seuil');
  north.corpseLoad=ALL+1e-6;for(let id=0;id<200;id++)assert.equal(g.zombieCanClimb({id,kind:'crawler'},north),true,'tous passent au-delà du dernier seuil');
  north.corpseLoad=1e6;for(const kind of Object.keys(C.ENEMIES))assert.equal(g.zombieCanClimb({id:0,kind},north),kind==='runner'||kind==='crawler',kind);
  // La lecture du module suit la règle de part et d'autre du seuil, pour un Infecté récent.
  const read=()=>g.corpseHeaps217.heaps().find(h=>h.id===north.id);
  north.corpseLoad=FIRST;assert.equal(read().state,'imminent','100 % exactement : la règle stricte ne laisse encore passer personne');assert.equal(read().ratio,1);assert.equal(read().share,0);
  north.corpseLoad=FIRST+1e-6;assert.equal(read().state,'franchi');assert.equal(g.zombieCanClimb({id:0,kind:'runner'},north),true);
  // Part des agiles qui passent : comptée ici en interrogeant le jeu pour chaque seuil.
  for(const load of [FIRST+.5,FIRST+1,FIRST+1.5,FIRST+9.2,ALL,ALL+.5,90]){
    north.corpseLoad=load;let passing=0;for(let id=0;id<span;id++)if(g.zombieCanClimb({id,kind:'runner'},north))passing++;
    assert.ok(Math.abs(read().share-passing/span)<1e-12,'part à la charge '+load);
  }
});

test('amas 217 : relevé exact sur des murs construits, états aux bornes 50 %, 85 % et 100 %',()=>{
  const {g}=campaign(),{placed,north,south,west,east,gate}=enclose(g),api=g.corpseHeaps217;
  assert.deepEqual(api.heaps(),[],'aucune charge, aucun amas');
  const cases=[[FIRST*.5-1e-9,'faible'],[FIRST*.5,'haut'],[FIRST*.85-1e-9,'haut'],[FIRST*.85,'imminent'],[FIRST,'imminent'],[FIRST+1e-9,'franchi'],[FIRST*1.2,'franchi'],[.01,'faible']];
  for(const [load,state]of cases){
    north.corpseLoad=load;const list=api.heaps();assert.equal(list.length,1);const heap=list[0];
    assert.equal(heap.state,state,'charge '+load);assert.equal(heap.load,load);assert.equal(heap.threshold,FIRST);assert.equal(heap.fullThreshold,ALL);
    assert.equal(heap.ratio,load/FIRST);assert.equal(heap.id,north.id);assert.ok(Object.isFrozen(heap));
  }
  // Côté de la cité : même lecture que le champ de bataille.
  north.corpseLoad=3;south.corpseLoad=8;west.corpseLoad=13;east.corpseLoad=20;gate.corpseLoad=14;
  const list=api.heaps(),by=id=>list.find(h=>h.id===id),core=g.core();
  assert.equal(list.length,5);
  assert.deepEqual([by(north.id).side,by(south.id).side,by(west.id).side,by(east.id).side,by(gate.id).side],['north','south','west','east','north']);
  for(const b of [north,south,west,east,gate])assert.equal(by(b.id).side,B.direction(core,b));
  assert.deepEqual([by(north.id).state,by(south.id).state,by(west.id).state,by(east.id).state,by(gate.id).state],['faible','haut','imminent','franchi','imminent']);
  assert.equal(by(gate.id).gate,true);assert.equal(by(north.id).gate,false);
  assert.deepEqual(list.map(h=>h.id),[east.id,gate.id,west.id,south.id,north.id],'du plus haut au plus bas');
  const best=api.summary();assert.equal(best.north.id,gate.id,'le plus haut du côté nord');assert.equal(best.east.id,east.id);assert.equal(best.south.id,south.id);assert.equal(best.west.id,west.id);
  // Hors service ou hors sujet : chantier, mur détruit, bâtiment qui n'est pas un mur.
  const other=placed.find(b=>b!==north&&b!==south&&b!==west&&b!==east&&b!==gate&&b.type==='woodWall'),extra=placed.filter(b=>b.type==='woodWall'&&b!==other&&![north,south,west,east].includes(b));
  other.corpseLoad=30;other.progress=.5;assert.equal(api.heaps().length,5,'un chantier ne porte pas d’amas lisible');other.progress=1;assert.equal(api.heaps().length,6);
  extra[0].corpseLoad=30;extra[0].dead=true;assert.equal(api.heaps().length,6);extra[0].dead=false;extra[0].corpseLoad=0;
  core.corpseLoad=40;assert.equal(api.heaps().length,6);core.corpseLoad=0;
  // Un mur que le jeu déclare infranchissable au sol (rempart de citadelle) est laissé au siège vertical.
  const climb=g.zombieCanClimb;g.zombieCanClimb=(e,b)=>b.id===east.id?false:climb.call(g,e,b);
  assert.equal(api.heaps().some(h=>h.id===east.id),false);g.zombieCanClimb=climb;
});

test('amas 217 : lecture pure sur un état minimal, sans jeu complet',()=>{
  assert.deepEqual(Heaps.heaps(null),[]);assert.deepEqual(Heaps.heaps({}),[]);assert.deepEqual(Heaps.heaps(stub([])),[]);
  assert.deepEqual(Heaps.heaps({world:{buildings:new Map([[2,wall(2,9,3,9)]])},core:()=>null}),[],'sans centre, pas de côté');
  const g=stub([wall(2,9,3,FIRST*.95),wall(3,9,9,FIRST*.7),wall(4,4,6,FIRST*.3),wall(5,15,6,FIRST*1.2),wall(6,9,1,0),wall(7,9,0,NaN)]);
  assert.deepEqual(Heaps.heaps(g).map(h=>[h.id,h.side,h.state]),[[5,'east','franchi'],[2,'north','imminent'],[3,'south','haut'],[4,'west','faible']]);
  // Fenêtre de vue : seuls les murs proches de l'écran sont relevés.
  assert.deepEqual(Heaps.heaps(g,{left:0,right:200,top:0,bottom:400}).map(h=>h.id),[4]);
  assert.equal(Heaps.sentence(Heaps.heaps(g)[1]),'Amas au nord : franchissement imminent.');
  assert.equal(Heaps.sentence(Heaps.heaps(g)[0]),'Amas à l’est : rampe formée, les infectés agiles peuvent franchir le mur.');
  assert.equal(Heaps.sentence(Heaps.heaps(g)[2]),'');assert.equal(Heaps.sentence(null),'');
  // Déblaiement : cadence lue dans les règles des ouvriers.
  const work=Heaps.clearing(Heaps.heaps(g)[0]);
  assert.equal(work.rate,C.WORKER_RULES.cleanupPerSecond);assert.equal(work.seconds,Math.ceil(FIRST*1.2/C.WORKER_RULES.cleanupPerSecond));
  assert.equal(work.safeSeconds,Math.ceil((FIRST*1.2-FIRST*.85)/C.WORKER_RULES.cleanupPerSecond));
});

test('amas 217 : plan déterministe, dérivé de l’identifiant du mur, et corps qui ne changent pas de place',()=>{
  const walls=()=>[wall(2,9,3,FIRST*.95),wall(3,9,9,FIRST*.7),wall(4,4,6,FIRST*.3),wall(5,15,6,FIRST*1.2)];
  const a=Heaps.plan(stub(walls())),b=Heaps.plan(stub(walls(),{elapsed:999}));
  assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),'le temps ne déplace rien');
  assert.ok(a.bodies>20);assert.equal(a.bodies,a.items.reduce((n,item)=>n+item.ground+item.crest,0));
  // Hauteur et emprise suivent le rapport charge/seuil.
  const at=ratio=>Heaps.plan(stub([wall(2,9,3,FIRST*ratio)])).items[0];
  let previous=at(.05);
  for(const ratio of [.2,.45,.5,.7,.84,.85,.99,1.01,1.5,2.2]){
    const next=at(ratio);
    assert.ok(next.ground>=previous.ground,ratio+' : jamais moins de corps');assert.ok(next.reach>=previous.reach,ratio+' : emprise croissante');
    previous=next;
  }
  assert.equal(at(.3).crest,0);assert.equal(at(.7).crest,0);assert.ok(at(.9).crest>0,'imminent : les corps atteignent la crête');assert.ok(at(1.3).crest>at(.9).crest,'franchi : ils la recouvrent');
  assert.ok(at(.3).ground<at(.7).ground&&at(.7).ground<at(.9).ground&&at(.9).ground<at(1.3).ground,'quatre paliers distincts');
  // Même image pour le même état ; image différente pour un autre mur.
  const first=pixels(stub(walls())).after,second=pixels(stub(walls())).after;assert.deepEqual(second,first);
  const moved=walls();moved[0].id=77;assert.notDeepEqual(pixels(stub(moved)).after,first,'autre identifiant, autre enchevêtrement');
});

test('amas 217 : budget respecté quel que soit le nombre de murs, allégé en qualité basse',()=>{
  assert.equal(Heaps.limits.cap,600);assert.ok(Heaps.limits.capLow<Heaps.limits.cap);
  const many=[];for(let y=0;y<60;y++)for(let x=0;x<60;x++)if(x!==10||y!==6)many.push(wall(100+y*60+x,x,y,FIRST*(.2+((x*7+y*3)%23)/10)));
  const all={left:-1e9,right:1e9,top:-1e9,bottom:1e9};
  for(const count of [1,10,40,400,many.length]){
    const g=stub(many.slice(0,count)),low=stub(many.slice(0,count),{settings:{quality:'low'}});
    const high=Heaps.plan(g,{view:all}),light=Heaps.plan(low,{view:all});
    assert.equal(high.items.length,count);
    assert.ok(high.bodies<=Heaps.limits.cap,count+' murs : plafond');assert.ok(light.bodies<=Heaps.limits.capLow,count+' murs : plafond léger');
    assert.equal(high.bodies,high.items.reduce((n,item)=>n+item.ground+item.crest,0));
  }
  assert.equal(Heaps.plan(stub(many),{view:all}).bodies,Heaps.limits.cap,'au plafond exactement quand la demande le dépasse de loin');
  // Au-delà du plafond, les amas les plus hauts gardent leurs corps ; les derniers n'ont plus que leur talus.
  const crowded=Heaps.plan(stub(many),{view:all}).items;assert.ok(crowded[0].ground>=1&&crowded.at(-1).ground===0);
  const tight=Heaps.plan(stub(many.slice(0,60)),{view:all});assert.ok(tight.bodies>Heaps.limits.cap*.5&&tight.items.every(item=>item.ground>=1),'éclaircissement par paliers : chacun garde des corps');
  assert.deepEqual(Heaps.plan(stub(many),{view:all,budget:0}).bodies,0);assert.ok(Heaps.plan(stub(many),{view:all,budget:1e9}).bodies<=Heaps.limits.cap);
  // Le peintre ne relève que les murs proches de l'écran : 640 × 400 à l'échelle 1.
  const g=stub(many),seen=pixels(g);
  assert.ok(seen.drawn>0&&seen.drawn<=Heaps.limits.cap);
  const visible=Heaps.heaps(g,{left:-24,right:664,top:-24,bottom:424}).length;assert.ok(visible<400&&visible>100,'murs visibles : '+visible);
  assert.ok(pixels(stub(many,{settings:{quality:'low'}})).drawn<=Heaps.limits.capLow);
  assert.ok(pixels(stub(many,{width:1600,height:900,camera:{x:900,y:900,zoom:.5}})).drawn<=Heaps.limits.cap);
});

test('amas 217 : un mur chargé modifie des pixels du côté extérieur, et aucun du côté intérieur',()=>{
  // Pour chaque côté : rectangle extérieur (au-delà de la face), empreinte du mur, puis tout l'intérieur.
  const cases={
    north:{at:[9,3],outside:[0,0,640,95],inside:[0,130,640,400],body:[288,96,320,128]},
    south:{at:[9,9],outside:[0,321,640,400],inside:[0,0,640,286],body:[288,288,320,320]},
    west:{at:[4,6],outside:[0,0,127,400],inside:[162,0,640,400],body:[128,192,160,224]},
    east:{at:[15,6],outside:[513,0,640,400],inside:[0,0,478,400],body:[480,192,512,224]}
  };
  for(const [side,c]of Object.entries(cases)){
    const seen={};
    for(const [state,ratio]of [['faible',.3],['haut',.7],['imminent',.95],['franchi',1.3]]){
      const g=stub([wall(2,c.at[0],c.at[1],FIRST*ratio)]);assert.equal(Heaps.heaps(g)[0].side,side);assert.equal(Heaps.heaps(g)[0].state,state);
      const shot=pixels(g);seen[state]=shot.changed(...c.outside);
      assert.ok(shot.drawn>0,side+' '+state);
      assert.ok(seen[state]>40,side+' '+state+' : amas dessiné à l’extérieur ('+seen[state]+')');
      assert.equal(shot.changed(...c.inside),0,side+' '+state+' : rien à l’intérieur de l’enceinte');
      // Même garantie avec la réserve d'images hors écran.
      const store=Heaps.createStore((w,h)=>createCanvas(w,h)),cached=pixels(g,{store});
      assert.equal(store.active(),true);assert.ok(store.size()>=1);
      assert.ok(cached.changed(...c.outside)>40,side+' '+state+' : réserve, extérieur');assert.equal(cached.changed(...c.inside),0,side+' '+state+' : réserve, intérieur');
      const body=shot.changed(...c.body);
      if(state==='faible'||state==='haut')assert.ok(body<140,side+' '+state+' : le mur reste presque nu ('+body+')');
      else assert.ok(body>(state==='franchi'?520:200),side+' '+state+' : crête et liseré sur le mur ('+body+')');
    }
    assert.ok(seen.faible<seen.haut&&seen.haut<seen.imminent&&seen.imminent<seen.franchi,side+' : emprise croissante '+JSON.stringify(seen));
  }
  // Hors partie, partie perdue, expédition régionale ou mur sans charge : rien.
  for(const off of [{state:'menu'},{gameOver:true},{frontier:{active:()=>true}},{player:{regionAbsent:true}}])assert.equal(pixels(stub([wall(2,9,3,FIRST)],off)).changed(0,0,640,400),0,JSON.stringify(Object.keys(off)));
  assert.equal(pixels(stub([wall(2,9,3,0)])).changed(0,0,640,400),0);
  // Mur hors champ : aucun pixel.
  assert.equal(pixels(stub([wall(2,60,60,FIRST*2)])).drawn,0);
});

test('amas 217 : signal sobre, figé en animations réduites, et amas sans horloge',()=>{
  const still={reducedMotion:true,quality:'auto'},alert=[wall(2,9,3,FIRST*.95),wall(3,9,9,FIRST*1.4)],calm=[wall(2,9,3,FIRST*.7),wall(3,9,9,FIRST*.3)];
  const a=pixels(stub(alert,{elapsed:1})).after,b=pixels(stub(alert,{elapsed:1.6})).after;
  assert.notDeepEqual(a,b,'le liseré respire avec g.elapsed');assert.deepEqual(pixels(stub(alert,{elapsed:1})).after,a,'même temps, même image');
  assert.deepEqual(pixels(stub(alert,{elapsed:1,settings:still})).after,pixels(stub(alert,{elapsed:1.6,settings:still})).after,'animations réduites : image fixe');
  assert.deepEqual(pixels(stub(calm,{elapsed:1})).after,pixels(stub(calm,{elapsed:7.3})).after,'sous le palier imminent, rien ne bouge');
  // Le liseré utilise les teintes d'alerte, sans saturation fluorescente, sur la face extérieure du mur.
  const shot=pixels(stub([wall(2,9,3,FIRST*.95)],{settings:still})),data=shot.after,pixel=(x,y)=>[data[(y*640+x)*4],data[(y*640+x)*4+1],data[(y*640+x)*4+2]];
  const [r,gr,bl]=pixel(304,97);assert.ok(r>170&&gr>120&&bl<130&&r>bl+60,'liseré ambré : '+[r,gr,bl]);
  const red=pixels(stub([wall(2,9,3,FIRST*1.3)],{settings:still})).after,q=[red[(97*640+304)*4],red[(97*640+304)*4+1],red[(97*640+304)*4+2]];
  assert.ok(q[0]>170&&q[1]<140&&q[0]>q[1]+60,'liseré rouge une fois franchi : '+q);
  // Qualité basse : moins de corps, même lecture.
  const low=pixels(stub([wall(2,9,3,FIRST*.95)],{settings:{quality:'low'}}));assert.ok(low.changed(0,0,640,95)>40);assert.equal(low.changed(0,130,640,400),0);
});

test('amas 217 : la réserve d’images borne les redessins et retombe sur le dessin direct',()=>{
  const walls=[];for(let x=0;x<10;x++){walls.push(wall(100+x,x+5,3,FIRST*1.3));walls.push(wall(200+x,x+5,9,FIRST*.7));}
  let made=0;const store=Heaps.createStore((w,h)=>{made++;return createCanvas(w,h);}),g=stub(walls);
  pixels(g,{store});assert.ok(made>0&&made<=Heaps.limits.redraws,'première image : '+made+' redessins');
  for(let i=0;i<6;i++)pixels(g,{store});
  const settled=made;assert.equal(settled,10*2+10,'un sol par mur, une crête par mur franchi');
  pixels(g,{store});pixels(stub(walls,{elapsed:50}),{store});assert.equal(made,settled,'état inchangé : aucune image refaite');
  walls[0].corpseLoad=FIRST*.3;pixels(g,{store});assert.equal(made,settled+1,'seul le mur qui change est redessiné');
  assert.deepEqual(pixels(g,{store}).after,pixels(g,{store}).after);
  // Fabrique défaillante ou toile sans contexte : dessin direct, sans erreur.
  for(const factory of [()=>{throw new Error('pas de toile');},()=>null,()=>({getContext:()=>null}),null]){
    const broken=Heaps.createStore(factory),shot=pixels(stub([wall(2,9,3,FIRST*.95)]),{store:broken});
    assert.equal(broken.active(),false);assert.ok(shot.changed(0,0,640,95)>40);assert.equal(shot.changed(0,130,640,400),0);
  }
});

test('amas 217 : dans le jeu complet, ni tirage, ni changement d’état sauvegardé',()=>{
  const {g}=campaign(),{north,south,west,east,gate}=enclose(g);
  north.corpseLoad=FIRST*1.2;south.corpseLoad=FIRST*.95;west.corpseLoad=FIRST*.3;east.corpseLoad=FIRST*.7;gate.corpseLoad=FIRST*1.6;
  g.corpseHeaps217.render();
  const state=()=>JSON.stringify({...g.serialize(),timestamp:0});
  const saved=state(),random=g.random.state,horde=g.zombies.length,stock=JSON.stringify(g.resources),loads=[north,south,west,east,gate].map(b=>b.corpseLoad),health=[north,south,west,east,gate].map(b=>b.health);
  const canvas=createCanvas(640,400),ctx=canvas.getContext('2d'),size={width:g.width,height:g.height,x:g.camera.x,y:g.camera.y,zoom:g.camera.zoom};
  g.width=640;g.height=400;g.camera.x=g.core().x;g.camera.y=g.core().y;g.camera.zoom=1;
  let drawn=0;for(let i=0;i<3;i++)drawn=g.corpseHeaps217.paint(ctx);
  assert.ok(drawn>40,'les cinq amas sont dessinés : '+drawn);
  // Les trois points d'accroche réels : sol, bâtiment, voile de nuit.
  g.drawGround(ctx,g.viewBounds());assert.equal(g.corpseHeaps217.covers(north),true);assert.equal(g.corpseHeaps217.covers(g.core()),false);
  g.drawBuilding(ctx,north);
  g.corpseHeaps217.heaps();g.corpseHeaps217.plan();g.corpseHeaps217.summary();g.corpseHeaps217.render();
  Object.assign(g,{width:size.width,height:size.height});g.camera.x=size.x;g.camera.y=size.y;g.camera.zoom=size.zoom;
  assert.equal(g.random.state,random,'aucun tirage consommé');assert.equal(g.zombies.length,horde);assert.equal(JSON.stringify(g.resources),stock);
  assert.deepEqual([north,south,west,east,gate].map(b=>b.corpseLoad),loads);assert.deepEqual([north,south,west,east,gate].map(b=>b.health),health);
  assert.ok(state()===saved,'le rendu ne change pas l’état sauvegardé');
  assert.equal(Object.hasOwn(north,'corpseLoad'),true);assert.equal(Object.keys(JSON.parse(saved).expansions127?.modules||{}).some(key=>/heap|amas/i.test(key)),false,'aucun état sauvegardé par le module');
});

test('amas 217 : une annonce par mur et par épisode, jamais à la reprise',()=>{
  const {g}=campaign(),{north,south,east}=enclose(g),api=g.corpseHeaps217;
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push([String(text),tone]);return notify(text,tone);};
  const amas=()=>notes.filter(([text])=>text.startsWith('Amas '));
  api.render();assert.deepEqual(amas(),[]);
  north.corpseLoad=FIRST*.7;api.render();assert.deepEqual(amas(),[],'haut : pas d’annonce');
  north.corpseLoad=FIRST*.9;api.render();assert.deepEqual(amas(),[['Amas au nord : franchissement imminent.','normal']]);
  api.render();api.render();north.corpseLoad=FIRST*.99;api.render();assert.equal(amas().length,1,'pas de répétition');
  north.corpseLoad=FIRST*1.1;api.render();
  assert.deepEqual(amas()[1],['Amas au nord : rampe formée, les infectés agiles peuvent franchir le mur.','danger']);
  api.render();north.corpseLoad=FIRST*.9;api.render();north.corpseLoad=FIRST*1.3;api.render();north.corpseLoad=FIRST*.6;api.render();north.corpseLoad=FIRST*1.3;api.render();
  assert.equal(amas().length,2,'même épisode tant que l’amas ne retombe pas sous 50 %');
  // L'épisode se termine quand l'amas redevient faible ; le suivant est annoncé à nouveau.
  north.corpseLoad=FIRST*.3;api.render();north.corpseLoad=FIRST*1.3;api.render();
  assert.equal(amas().length,3);assert.match(amas()[2][0],/^Amas au nord : rampe formée/,'passage direct à franchi : une seule annonce');
  // Deux murs du même côté dans le même relevé : une seule annonce ; un autre côté a la sienne.
  const twin=[...g.world.buildings.values()].find(b=>b.type==='woodWall'&&b.gy===south.gy&&b!==south);
  south.corpseLoad=twin.corpseLoad=FIRST*.9;east.corpseLoad=FIRST*.9;api.render();
  assert.deepEqual(amas().slice(3).map(([text])=>text),['Amas à l’est : franchissement imminent.','Amas au sud : franchissement imminent.']);
  // Rafraîchissement du HUD : cadencé par le temps de jeu, sans annonce supplémentaire.
  for(let i=0;i<5;i++){g.elapsed+=1;g.updateUI();}
  assert.equal(amas().length,5);
  // Reprise de sauvegarde : l'état est relevé en silence, puis seuls les nouveaux passages sont annoncés.
  const saved=JSON.parse(JSON.stringify(g.serialize()));notes.length=0;
  assert.equal(g.restoreSave(saved),true);
  const loaded=[...g.world.buildings.values()].filter(b=>b.corpseLoad>0);assert.equal(loaded.length,4,'les charges sont reprises');
  api.render();g.elapsed+=5;g.updateUI();api.render();
  assert.deepEqual(amas(),[],'aucune annonce à la reprise');
  const west=[...g.world.buildings.values()].find(b=>b.type==='woodWall'&&b.corpseLoad===0&&B.direction(g.core(),b)==='west');
  west.corpseLoad=FIRST*.9;api.render();assert.deepEqual(amas().map(([text])=>text),['Amas à l’ouest : franchissement imminent.']);
  // Nouvelle partie : même silence au premier relevé.
  notes.length=0;g.startNew('standard','17117');g.campaignIntro132?.skip?.();api.render();assert.deepEqual(amas(),[]);
});

test('amas 217 : carte du dossier Situation, cadence de déblaiement lue dans les règles',()=>{
  const {g,doc}=campaign(),{north,south,west}=enclose(g),api=g.corpseHeaps217;
  api.render();
  const card=doc.getElementById('corpseHeapsCard');assert.ok(card,'carte ajoutée');assert.equal(card.parentNode,doc.getElementById('siegeReadout'));
  assert.equal(doc.getElementById('siegeReadout').children.at(-1),card,'après les cartes de la lecture de siège');
  const text=id=>doc.getElementById(id).textContent,rate=String(C.WORKER_RULES.cleanupPerSecond).replace('.',',');
  assert.equal(text('corpseHeapsTitle'),'Aucun amas contre les murs.');
  for(const side of ['north','east','south','west'])assert.equal(text('corpseHeaps-'+side),'—');
  assert.equal(text('corpseHeapsNote'),'Au-delà d’une charge de '+FIRST+', les premiers Infectés récents et Rampants franchissent le mur ; à '+ALL+', tous. Un ouvrier en déblaiement retire '+rate+' corps par seconde.');
  north.corpseLoad=FIRST*1.2;south.corpseLoad=FIRST*.954;west.corpseLoad=FIRST*.3;api.render();
  assert.equal(text('corpseHeapsTitle'),'Le plus haut : nord, 120 % du seuil (franchi)');
  assert.equal(text('corpseHeaps-north'),'120 % du seuil · franchi');assert.equal(text('corpseHeaps-south'),'95 % du seuil · imminent');
  assert.equal(text('corpseHeaps-west'),'30 % du seuil · faible');assert.equal(text('corpseHeaps-east'),'—');
  assert.ok(text('corpseHeapsNote').endsWith('Un ouvrier en déblaiement retire '+rate+' corps par seconde : l’amas le plus haut (charge '+String(FIRST*1.2).replace('.',',')+') se dégage en '+Math.ceil(FIRST*1.2/C.WORKER_RULES.cleanupPerSecond)+' s.'),text('corpseHeapsNote'));
  // 99,9 % n'est jamais arrondi à 100 % : le seuil n'est pas atteint.
  north.corpseLoad=FIRST*.9994;south.corpseLoad=0;west.corpseLoad=0;api.render();assert.equal(text('corpseHeaps-north'),'99 % du seuil · imminent');
  assert.equal(Heaps.install(g,doc),false,'une seule installation');
  // Hors partie, la carte se cache.
  const playing=g.state;g.state='menu';api.render();assert.equal(card.hidden,true);g.state=playing;api.render();assert.equal(card.hidden,false);
});

test('amas 217 : installation dans un DOM minimal, enveloppes chaînées avec la marée dans les deux ordres',()=>{
  for(const order of [[Horizon,Heaps],[Heaps,Horizon]]){
    const calls={ground:0,night:0,building:0,ui:0};
    const bare={state:'playing',phase:'calm',drawGround(){calls.ground++;return 'ground';},drawNight(){calls.night++;return 'night';},drawBuilding(){calls.building++;return 'building';},updateUI(){calls.ui++;return 'ui';}};
    for(const module of order)assert.equal(module.install(bare,{body:{},getElementById:()=>null}),true);
    assert.ok(bare.hordeHorizon217&&bare.corpseHeaps217);
    assert.equal(bare.drawGround({},{}),'ground');assert.equal(bare.drawNight({}),'night');assert.equal(bare.drawBuilding({},{id:3}),'building');assert.equal(bare.updateUI(),'ui');
    assert.equal(bare.drawGround(),'ground');assert.equal(bare.drawNight(),'night');assert.equal(bare.drawBuilding(),'building');
    assert.deepEqual(calls,{ground:2,night:2,building:2,ui:1},'chaque méthode d’origine appelée une fois par appel');
    assert.equal(bare.corpseHeaps217.render(),false);assert.deepEqual(bare.corpseHeaps217.heaps(),[]);assert.equal(bare.corpseHeaps217.covers({id:3}),false);
  }
  assert.equal(Heaps.install({},undefined),true);assert.equal(Heaps.install(null,null),false);
  // Dans le jeu complet, la marée reste dessinée par `drawNight` une fois les amas installés, et inversement.
  const {g,doc}=bootDocument134();Heaps.install(g,doc);Horizon.install(g,doc);require('../src/siege-readout.js').install(g,doc);
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();const {north}=enclose(g);north.corpseLoad=FIRST*1.3;
  g.phaseTime=.01;g.updateDirector(.05);assert.equal(g.phase,'warning');
  assert.ok(g.hordeHorizon217.horizon(),'la marée lit toujours le plan de vague');assert.ok(g.hordeHorizon217.silhouettes().length>0);assert.equal(g.corpseHeaps217.heaps()[0].state,'franchi');
  g.hordeHorizon217.render();g.corpseHeaps217.render();
  assert.ok(doc.getElementById('hordeHorizonLine')&&doc.getElementById('corpseHeapsCard'),'les deux lectures cohabitent dans le dossier');
  // Boîte sans `insertBefore` ni `after`, éléments sans `appendChild` : l'ajout se fait par `appendChild`, sans erreur.
  const kids=[],box={appendChild:n=>kids.push(n)},flat={state:'playing',world:{buildings:new Map([[2,wall(2,9,3,FIRST*.95)]])},core:()=>({x:320,y:200}),notify(){throw new Error('pas d’annonce au premier relevé');}};
  Heaps.install(flat,{body:{},createElement:()=>({}),getElementById:id=>id==='siegeReadout'?box:null});
  assert.equal(kids.length,1);assert.equal(kids[0].id,'corpseHeapsCard');assert.equal(kids[0].hidden,false);
  assert.match(kids[0].textContent,/^Le plus haut : nord, 95 % du seuil \(imminent\) Au-delà d’une charge de 15/);
});

test('amas 217 : source en lecture seule, sans hasard ni horloge propre',()=>{
  const source=fs.readFileSync(path.join(root,'src/corpse-heaps217.js'),'utf8');
  for(const forbidden of ['Math.random','.random','Date.now','performance.now','setInterval','requestAnimationFrame','localStorage','g.save','serialize','insertBefore','.after(','.push(new','spend('])assert.equal(source.includes(forbidden),false,forbidden);
  for(const field of ['corpseLoad','health','maxHealth','zombies','resources','corpses','progress','gateMode','priority','phase','dayClock'])assert.equal(new RegExp('\\.'+field+'\\s*(?:=(?!=)|\\+=|-=|\\*=|\\+\\+|--|\\.(?:push|pop|shift|splice|length\\s*=))').test(source),false,'écriture de '+field);
  assert.equal(/\bzombies\b/.test(source),false);assert.equal(/\bresources\b/.test(source),false);assert.equal(/\bhealth\b/.test(source),false);
  // Le seuil n'est écrit nulle part dans le module : il vient des règles du jeu.
  assert.equal(/(?<![.\d])(?:15|18|32)\s*[+*%]|[+*%]\s*(?:15|18)(?![.\d])/.test(source.replace(/\/\/.*$/gm,'')),false,'aucune formule de seuil recopiée');
  assert.equal((source.match(/corpseLoad/g)||[]).length,2,'la charge est lue en un seul endroit, plus la sonde qui interroge le jeu');assert.ok(source.includes('rampMin')&&source.includes('rampMax'));
  // Chargé après la marée, et servi hors ligne.
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.match(html,/<script src="src\/horde-horizon217\.js"><\/script>\s*<script src="src\/corpse-heaps217\.js"><\/script>/);
  assert.ok(sw.includes('"src/horde-horizon217.js","src/corpse-heaps217.js",'));
  // La retouche de `art.js` est une garde : les marques héritées restent pour tout mur que le module ne couvre pas.
  const art=fs.readFileSync(path.join(root,'src/art.js'),'utf8');
  assert.ok(art.includes('if (b.corpseLoad > 4 && !globalThis.DEADWALL?.corpseHeaps217?.covers?.(b)) {'));
  assert.ok(art.includes('for (let i = 0; i < Math.min(8, b.corpseLoad / 3); i++) {'),'les huit marques existent toujours');
});
