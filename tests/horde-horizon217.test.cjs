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
  // Deux plafonds : silhouettes entières (corps, jambes, bras) et têtes de rang (une tête, une ligne d'épaules).
  assert.equal(Horizon.limits.cap,240);assert.equal(Horizon.limits.capLow,96);
  assert.equal(Horizon.limits.heads,1440);assert.equal(Horizon.limits.headsLow,192);
  const whole=list=>list.filter(s=>s.detail).length;
  for(const total of [1,86,740,2095,1e6,1e9]){
    for(const fronts of [['north'],['north','east','south','west']]){
      for(const view of [undefined,{left:0,right:2600,top:0,bottom:1500},{left:SIZE-700,right:SIZE,top:SIZE-400,bottom:SIZE}]){
        const high=Horizon.silhouettes(stub({fronts,wavePlan:{total}}),{view}),low=Horizon.silhouettes(stub({fronts,wavePlan:{total},settings:{quality:'low'}}),{view});
        assert.ok(whole(high)<=240,total+' : plafond des silhouettes');assert.ok(whole(low)<=96,total+' : plafond léger des silhouettes');
        assert.ok(high.length-whole(high)<=Horizon.limits.heads,total+' : plafond des têtes de rang');
        assert.ok(low.length-whole(low)<=Horizon.limits.headsLow,total+' : plafond léger des têtes de rang');
      }
    }
  }
  // Vue la plus large, quatre fronts, marée maximale : le peintre ne dépasse jamais la somme des deux plafonds.
  const g=stub({fronts:['north','west'],wavePlan:{total:2095},width:1600,height:900,camera:{x:800,y:450,zoom:.52}});
  assert.ok(pixels(g).drawn<=240+Horizon.limits.heads);
  assert.ok(pixels({...g,settings:{quality:'low'}}).drawn<=96+Horizon.limits.headsLow);
  const wide=stub({fronts:['north','east','south','west'],wavePlan:{total:1e9},width:1920,height:1080,camera:{x:1920/.6,y:1080/.6,zoom:.3}});
  assert.ok(pixels(wide).drawn<=240+Horizon.limits.heads);
  assert.ok(Horizon.silhouettes(stub({fronts:['north'],wavePlan:{total:2095},settings:{quality:'low'}})).length<Horizon.silhouettes(stub({fronts:['north'],wavePlan:{total:2095}})).length);
  assert.deepEqual(Horizon.silhouettes(stub(),{budget:0}),[]);
  // Un budget réduit borne aussi les têtes de rang.
  const small=Horizon.silhouettes(stub({fronts:['north'],wavePlan:{total:2095}}),{budget:10});
  assert.ok(whole(small)<=10&&small.length<=40);
});

test('marée 217 : trois densités lisibles — petite vague en paquets, vague moyenne compacte, marée profonde',()=>{
  const view={left:300,right:1022,top:0,bottom:400};
  const at=total=>Horizon.silhouettes(stub({phase:'assault',fronts:['north'],wavePlan:{total},spawnQueue:[],pendingSpawns:C.normalizeSpawnCounts({walker:total})}),{view});
  const small=at(18),medium=at(157),large=at(740);
  assert.ok(small.length>=6&&small.length<70,'petite vague : quelques paquets ('+small.length+')');
  assert.ok(medium.length>small.length*2.5,'vague moyenne nettement plus dense');
  assert.ok(large.length>medium.length*1.4,'grande vague plus dense encore');
  const depth=list=>Math.max(...list.map(s=>s.y));
  assert.ok(depth(medium)>depth(small)+30&&depth(large)>depth(medium)+30,'la masse s’épaissit vers la cité');
  // Densité croissante vers le bord : la moitié arrière de la masse porte plus de figures que l'avant-garde.
  const half=depth(large)/2;assert.ok(large.filter(s=>s.y<half).length>large.filter(s=>s.y>=half).length*1.2);
  // Avant-garde en silhouettes entières, rangs arrière en têtes de rang ; tailles et allures variées.
  const front=large.filter(s=>s.detail),back=large.filter(s=>!s.detail);
  assert.ok(front.length>20&&back.length>front.length);
  assert.ok(Math.min(...front.map(s=>s.y))>Math.min(...back.map(s=>s.y)),'les silhouettes entières sont devant');
  assert.ok(new Set(large.map(s=>s.tint)).size>=3&&large.some(s=>s.hunch)&&large.some(s=>s.reach)&&large.some(s=>s.scale>1.25)&&large.some(s=>s.scale<.98));
  // Paquets : une petite vague laisse des portions de bord vides, une marée n'en laisse pas.
  const cover=list=>new Set(list.map(s=>Math.floor((s.x-300)/38))).size/19;
  assert.ok(cover(small)<.7,'petite vague en paquets : '+cover(small));assert.ok(cover(medium)>.9&&cover(large)>.95,'vague moyenne et marée continues');
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
  // Masse hors champ : aucune figure, seulement le repère de bord en haut de l'écran.
  assert.equal(far.drawn,0);assert.ok(far.changed(0,0,640,Horizon.limits.cue)>200,'repère du front hors champ');
  assert.equal(far.changed(0,Horizon.limits.cue+1,640,400),0,'la bande opposée reste intacte');
  const south=pixels(stub({...corner,fronts:['south'],wavePlan:{total:400}}));
  assert.ok(south.changed(0,400-band,540,400)>500);assert.equal(south.changed(0,0,640,400-band-2),0);
  // Hors partie, en région ou partie perdue : rien.
  for(const off of [{state:'menu'},{gameOver:true},{frontier:{active:()=>true}},{player:{regionAbsent:true}},{phase:'calm'}])assert.equal(pixels(stub({fronts:['north'],wavePlan:{total:400},...off})).changed(0,0,640,400),0,JSON.stringify(Object.keys(off)));
});

test('marée 217 : la masse se tient à la limite de la marge cachée par le HUD, et sans HUD elle colle au bord',()=>{
  const band=Math.ceil(Horizon.limits.band),base={fronts:['north','west'],wavePlan:{total:400}};
  // Barre haute de 68 px, panneau gauche de 270 px : le nord se décale de 68, l'ouest de 270.
  const hud={hud135:{safeFrame:()=>({top:68,left:270,right:600,bottom:380})}};
  const shifted=pixels(stub({...base,...hud}));
  // Seule la base sombre continue couvre la marge ; aucune figure n'y est posée.
  const moved=Horizon.silhouettes(stub(base),{clearance:{north:68,west:270}});assert.ok(moved.length>20);
  for(const s of moved)assert.ok((s.front==='north'?s.y:s.x)>=(s.front==='north'?68:270),'figure hors de la marge du HUD');
  assert.ok(shifted.changed(300,68,600,68+band)>500,'masse nord visible sous la barre');
  assert.ok(shifted.changed(270,120,270+band,380)>500,'masse ouest visible à droite du panneau');
  assert.equal(shifted.changed(270+band+2,68+band+2,640,400),0,'jamais au-delà de la bande décalée');
  // La marge ne dépend pas de la position de la caméra : la masse reste ancrée au monde.
  const near=stub({...base,...hud}),away=stub({...base,...hud,camera:{x:420,y:260,zoom:1}});
  Horizon.paint(createCanvas(640,400).getContext('2d'),near);Horizon.paint(createCanvas(640,400).getContext('2d'),away);
  const anchored=g=>Horizon.silhouettes(g,{clearance:{north:68,west:270},view:{left:0,right:900,top:0,bottom:700}});
  assert.deepEqual(anchored(away),anchored(near));
  // Cadre absent ou absurde : aucun décalage, aucune erreur.
  for(const frame of [{top:NaN,left:-50,right:1e9,bottom:Infinity},null])assert.deepEqual(pixels(stub({...base,hud135:{safeFrame:()=>frame}})).after,pixels(stub(base)).after);
  assert.deepEqual(pixels(stub({...base,hud135:{safeFrame:()=>{throw new Error('mesure indisponible');}}})).after,pixels(stub(base)).after);
  const list=Horizon.silhouettes(stub(base),{clearance:{north:1e6,west:-5}});
  for(const s of list)assert.ok((s.front==='north'?s.y:s.x)<=Horizon.limits.band+Horizon.limits.clearance);
});

// Écran d'ordinateur : barre haute, panneaux latéraux larges de plus de 230 px, éléments du bas.
const DESKTOP={width:1280,height:720,hud135:{safeFrame:()=>({left:300,right:1022,top:98,bottom:615})}};
const EDGE_CAMERA={north:{x:SIZE/2,y:360},south:{x:SIZE/2,y:SIZE-360},west:{x:640,y:SIZE/2},east:{x:SIZE-640,y:SIZE/2}};

test('marée 217 : les quatre fronts se voient entre les panneaux d’un écran d’ordinateur',()=>{
  for(const front of ['north','east','south','west']){
    const g=stub({...DESKTOP,fronts:[front],wavePlan:{total:400},camera:{...EDGE_CAMERA[front],zoom:1}});
    const shot=pixels(g);
    assert.ok(shot.drawn>80,front+' : figures dessinées ('+shot.drawn+')');
    // La masse occupe le cadre sûr, pas seulement la marge cachée sous les panneaux.
    assert.ok(shot.changed(300,98,1022,615)>12000,front+' : masse visible dans le cadre sûr ('+shot.changed(300,98,1022,615)+')');
    // Les figures tiennent dans la portion visible : aucune n'est posée sous un panneau.
    const sx=x=>(x-g.camera.x)+640,sy=y=>(y-g.camera.y)+360;
    for(const s of Horizon.silhouettes(g,{view:{left:g.camera.x-640,right:g.camera.x+640,top:g.camera.y-360,bottom:g.camera.y+360},inner:{left:g.camera.x-340-30,right:g.camera.x+382+30,top:g.camera.y-262-30,bottom:g.camera.y+255+30},clearance:{north:98,south:105,west:300,east:258}})){
      assert.ok(sx(s.x)>=300-60&&sx(s.x)<=1022+60&&sy(s.y)>=98-60&&sy(s.y)<=615+60,front+' : figure dans le cadre sûr');
    }
    // Masse visible : pas de repère de bord, et rien au centre de l'écran.
    assert.equal(shot.changed(580,340,740,400),0,front+' : centre de l’écran intact');
  }
  // Même vague, même écran, sans dégagement : l'ancienne bande de bord serait restée sous les panneaux.
  const hidden=Horizon.silhouettes(stub({fronts:['west'],wavePlan:{total:400}}),{view:{left:0,right:1280,top:SIZE/2-360,bottom:SIZE/2+360}});
  assert.ok(hidden.every(s=>s.x<300),'sans cadre sûr, la masse ouest tient entière sous un panneau de 300 px');
});

test('marée 217 : masse hors champ, un repère sobre par front le long du bord visible',()=>{
  const centre={camera:{x:SIZE/2,y:SIZE/2,zoom:1}},cue=Horizon.limits.cue;
  const all=pixels(stub({...DESKTOP,...centre,fronts:['north','east','south','west'],wavePlan:{total:400}}));
  assert.equal(all.drawn,0,'aucune figure à l’écran');
  assert.ok(all.changed(300,98-22,1022,98+cue)>2000,'repère nord');assert.ok(all.changed(300,615-cue,1022,615+22)>2000,'repère sud');
  assert.ok(all.changed(300-22,98,300+cue,615)>2000,'repère ouest');assert.ok(all.changed(1022-cue,98,1022+22,615)>2000,'repère est');
  assert.equal(all.changed(300+150,98+cue+1,1022-150,615-cue-1),0,'centre de l’écran intact');
  // L'ombre part du bord de l'écran, sous le HUD, et s'éteint à une largeur de repère du cadre sûr.
  assert.equal(all.changed(300+cue+1,98+cue+1,1022-cue-1,300),0);assert.equal(all.changed(300+cue+1,460,1022-cue-1,615-cue-1),0);
  // Un seul front : un seul bord marqué.
  const east=pixels(stub({...DESKTOP,...centre,fronts:['east'],wavePlan:{total:400}}));
  assert.ok(east.changed(1022-cue,98,1022+22,615)>2000);assert.equal(east.changed(0,0,1022-150,720),0);
  // Aucune couleur vive : le repère reste dans les gris et les tons terre.
  let saturated=0;for(let i=0;i<all.after.length;i+=4){const r=all.after[i],gr=all.after[i+1],b=all.after[i+2];if(Math.max(r,gr,b)-Math.min(r,gr,b)>70&&!(r===0x6a&&gr===0x85&&b===0x99))saturated++;}
  assert.equal(saturated,0,'ni flèche criarde ni teinte saturée');
  // Écran étroit sans mesure du HUD : le repère tient au bord de l'écran, plus mince.
  const phone=pixels(stub({...centre,width:390,height:700,fronts:['north','west'],wavePlan:{total:400}}));
  assert.ok(phone.changed(0,0,390,40)>500&&phone.changed(0,0,40,700)>500);assert.equal(phone.changed(140,41,390,700),0);
  // Calme, ou file vide : aucun repère.
  assert.equal(pixels(stub({...DESKTOP,...centre,phase:'calm',fronts:['north']})).changed(0,0,1280,720),0);
});

test('marée 217 : la masse ne recouvre jamais le Commandant',()=>{
  const R=Horizon.limits.clearing;assert.ok(R>=60);
  for(const front of ['north','east','south','west']){
    const camera={...EDGE_CAMERA[front],zoom:1};
    // Le Commandant se tient au milieu de la masse, à 5 m du bord visible.
    const offset={north:[0,-360+98+70],south:[0,360-105-70],west:[-640+300+70,0],east:[640-258-70,0]}[front];
    const player={x:camera.x+offset[0],y:camera.y+offset[1]};
    const g=stub({...DESKTOP,fronts:[front],wavePlan:{total:2095},camera,player});
    const view={left:camera.x-640,right:camera.x+640,top:camera.y-360,bottom:camera.y+360},clearance={north:98,south:105,west:300,east:258};
    const around=Horizon.silhouettes(g,{view,clearance,player}),without=Horizon.silhouettes(g,{view,clearance});
    assert.ok(without.some(s=>Math.hypot(s.x-player.x,s.y-(player.y-8))<R),front+' : sans lui, la masse occuperait sa place');
    for(const s of around)assert.ok(Math.hypot(s.x-player.x,s.y-(player.y-8))>=R,front+' : aucune figure sur le Commandant');
    assert.ok(around.length<without.length);
    // Ordre réel d'une image : sol (avec la masse), puis le Commandant, puis la nuit. Son corps reste intact.
    const canvas=createCanvas(1280,720),ctx=canvas.getContext('2d'),order=[];
    const game={...g,nightwatch:{isBlackout:()=>true},daylight:()=>.05,drawGround(c){order.push('sol');c.fillStyle='#6a8599';c.fillRect(view.left,view.top,1280,720);},drawNight(){order.push('nuit');},updateUI(){}};
    game.ctx=ctx;Horizon.install(game,{getElementById:()=>null});
    const px=player.x-camera.x+640,py=player.y-camera.y+360,zone=[Math.round(px-26),Math.round(py-44),52,62];
    ctx.save();ctx.translate(640-camera.x,360-camera.y);game.drawGround(ctx,view);ctx.restore();
    const ground=ctx.getImageData(0,0,1280,720).data;let touched=0;for(let i=0;i<ground.length;i+=4)if(ground[i]!==0x6a||ground[i+1]!==0x85||ground[i+2]!==0x99)touched++;
    assert.ok(touched>20000,front+' : la masse est peinte avec le sol');
    order.push('commandant');ctx.fillStyle='#ff00ff';ctx.fillRect(...zone);
    game.drawNight(ctx);
    assert.deepEqual(order,['sol','commandant','nuit']);
    const body=ctx.getImageData(...zone).data;let covered=0;for(let i=0;i<body.length;i+=4)if(body[i]!==255||body[i+1]!==0||body[i+2]!==255)covered++;
    assert.equal(covered,0,front+' : aucun pixel dessiné sur le Commandant');
    // Les reflets de nuit existent bien ailleurs dans la masse.
    const after=ctx.getImageData(0,0,1280,720).data;let glints=0;for(let i=0;i<after.length;i+=4)if(after[i]!==ground[i]&&!(after[i]===255&&after[i+2]===255))glints++;
    assert.ok(glints>150,front+' : reflets de nuit au-dessus du masque');
  }
  // Un plan ou une projection qui réutilise le peintre de sol ne reçoit pas la masse.
  const other=createCanvas(64,64).getContext('2d'),main=createCanvas(64,64).getContext('2d'),calls=[];
  const game={...stub({fronts:['north'],wavePlan:{total:400},width:64,height:64,camera:{x:32,y:32,zoom:1}}),ctx:main,drawGround(){calls.push('sol');},drawNight(){}};
  Horizon.install(game,{getElementById:()=>null});
  game.drawGround(other,{});assert.equal(other.getImageData(0,0,64,64).data.some(v=>v!==0),false,'autre canvas : rien');
  game.drawGround(main,{homeProjection:true});assert.equal(main.getImageData(0,0,64,64).data.some(v=>v!==0),false,'projection : rien');
  game.drawGround(main,{});assert.equal(main.getImageData(0,0,64,64).data.some(v=>v!==0),true,'scène locale : masse peinte');
});

test('marée 217 : animation lue dans le temps de jeu, figée en animations réduites, lisible de nuit',()=>{
  const base={fronts:['north'],wavePlan:{total:400}},band=Math.ceil(Horizon.limits.band);
  const a=pixels(stub({...base,elapsed:1})).after,b=pixels(stub({...base,elapsed:2.1})).after,again=pixels(stub({...base,elapsed:1})).after;
  assert.notDeepEqual(a,b,'le balancement suit g.elapsed');assert.deepEqual(again,a,'même temps, même image');
  const still={reducedMotion:true,quality:'auto'};
  assert.deepEqual(pixels(stub({...base,settings:still,elapsed:1})).after,pixels(stub({...base,settings:still,elapsed:2.1})).after,'animations réduites : image fixe');
  // Nuit noire : sur fond noir, les reflets laissent des pixels discernables dans la bande, et aucun ailleurs.
  const night=pixels(stub({...base,daylight:()=>.08,nightwatch:{isBlackout:()=>true}}),'#000000');
  assert.ok(night.changed(0,0,640,band)>150,'marée discernable de nuit');
  assert.equal(night.changed(0,band+2,640,400),0,'la nuit noire reste entière hors de la bande');
  let brightest=0;for(let i=0;i<night.after.length;i+=4)brightest=Math.max(brightest,night.after[i],night.after[i+1],night.after[i+2]);
  assert.ok(brightest>30&&brightest<150,'reflets discrets : '+brightest);
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
