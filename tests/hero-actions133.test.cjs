'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {bootGame}=require('./helpers/browser.cjs'),{boot131}=require('./helpers/expansions131.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const P=require('../src/actor-presentation.js'),H=require('../src/hero-actions133.js'),A=require('../src/art.js'),C=require('../src/core.js'),G=require('../src/frontier-geometry.js');
function fresh(){const{game:g}=bootGame();g.startNew('standard','17117');g.art={};P.install(g);H.install(g);g.phaseTime=999;return g;}
function node(g,type){const Node=g.world.nodes[0].constructor,n=new Node(99000,type,1000,1000,20,14,0);g.world.nodes=[n];g.player.carry=C.makeBag();g.input.keys.clear();standAt(g,g.player,n);g.input.keys.add('KeyE');return n;}
function building(g,type,x,y,progress=1){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,progress);g.world.add(b);return b;}
function pose(g){return g.actorPresentation.player().visualAction133;}

test('actions133 : les gestes de récolte suivent une quantité retirée de chaque gisement',()=>{
 for(const [type,kind]of [['wood','chop'],['stone','pick'],['scrap','pry'],['fuel','pry'],['food','handle']]){
  const g=fresh(),n=node(g,type),amount=n.amount;g.updateInteraction(.04);assert.ok(n.amount<amount);assert.equal(pose(g)?.kind,kind);
  const first=pose(g).elapsed;g.updateInteraction(.04);assert.ok(pose(g).elapsed>first);
  g.player.carry.wood=g.player.carryCapacity;g.updateInteraction(.04);assert.equal(pose(g),null,'sac plein ne joue pas un geste fictif');
 }
});
test('actions133 : chantier réellement avancé et E à vide ne sont pas confondus',()=>{
 const g=fresh();g.world.nodes=[];const b=building(g,'house',36,31,0);standAt(g,g.player,b);g.input.keys.add('KeyE');g.updateInteraction(.04);assert.ok(b.progress>0);assert.equal(pose(g)?.kind,'build');
 g.input.keys.clear();g.updateInteraction(.04);assert.equal(pose(g),null);g.player.x=300;g.player.y=300;g.input.keys.add('KeyE');g.updateInteraction(.04);assert.equal(pose(g),null);
});
test('actions133 : déposer joue une action courte une fois, sans modifier les quantités',()=>{
 const g=fresh();g.player.carry.wood=7;standAt(g,g.player,g.core());g.input.keys.add('KeyE');const stock=g.resources.wood;g.updateInteraction(.04);assert.equal(g.resources.wood,stock+7);assert.equal(pose(g)?.kind,'handle');assert.equal(pose(g).oneShot,true);
 g.input.keys.clear();for(let i=0;i<18;i++)g.updateInteraction(.04);assert.equal(pose(g),null);assert.equal(g.resources.wood,stock+7);
});
test('actions133 : pause fige le geste, mouvement, tir, décès et reprise le retirent',()=>{
 const g=fresh();node(g,'wood');g.updateInteraction(.08);const p={...pose(g)};g.paused=true;g.updateInteraction(.04);assert.deepEqual(pose(g),p);g.paused=false;
 g.player.x+=10;assert.equal(pose(g),null);g.heroActions133.reset();node(g,'stone');g.updateInteraction(.04);assert.equal(pose(g).kind,'pick');g.input.mouseDown=true;assert.equal(pose(g),null);
 g.input.mouseDown=false;g.updateInteraction(.04);g.player.dead=true;assert.equal(pose(g),null);g.player.dead=false;g.updateInteraction(.04);g.startNew('standard','17118');assert.equal(pose(g),null);
});
test('actions133 : postures basses conservent leur silhouette, marche réelle conserve le rig',()=>{
 const g=fresh();node(g,'wood');g.updateInteraction(.04);g.player.posture='crouch';assert.equal(pose(g),null);g.player.posture='prone';assert.equal(pose(g),null);
 g.player.posture='stand';g.world.nodes=[];Object.assign(g.player,{x:1000,y:1000});g.input.keys.clear();g.input.keys.add('KeyD');g.updatePlayer(.04);const p=g.actorPresentation.player();assert.equal(p.visualMoving,true);assert.equal(p.visualArticulated,true);assert.equal(p.visualAction133,null);
});
test('actions133 : pelle reliée uniquement au retrait réel de pression et aucun revenu ajouté',()=>{
 const g=fresh(),b=building(g,'woodWall',63,57);b.corpseLoad=25;Object.assign(g.player,g.workerCleanupPoint(g.player,b));assert.equal(g.linecare.equip(),true);g.input.keys.add('KeyE');const bag={...g.resources};g.updateInteraction(.04);assert.ok(b.corpseLoad<25);assert.equal(pose(g)?.kind,'dig');assert.deepEqual(g.resources,bag);g.input.keys.clear();g.updateInteraction(.04);assert.equal(pose(g),null);
});
test('actions133 : ouverture d’une réserve suit sa progression et l’annulation range le geste',()=>{
 const{game:g}=boot131();H.install(g);const p=g.frontier.world().pois.find(p=>p.frontier131?.reserve),d=g.serialize(),q=G.global(p,p.w/2,-2);Object.assign(d.frontier,{active:true,x:q.x,y:q.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});if(!d.frontier.seen.includes(p.id))d.frontier.seen.push(p.id);for(let i=0;i<g.frontier.world().threatCount(p);i++)d.frontier.enemies[p.id+':e'+i]=0;d.frontier.kills=Object.values(d.frontier.enemies).filter(n=>n===0).length;g.restoreSave(d);g.player.carry=C.makeBag({wood:16,scrap:16,food:8,medicine:4});g.phaseTime=999;
 const begin=g.worldOps131.begin('reserve',p.id);assert.equal(begin.ok,true,begin.reason);g.update(.04);assert.equal(g.heroActions133.pose()?.kind,'open');const before=g.worldOps131.activity().progress;g.paused=true;g.update(.04);assert.equal(g.worldOps131.activity().progress,before);g.paused=false;g.worldOps131.cancel();g.update(.04);assert.equal(g.heroActions133.pose(),null);assert.equal(g.worldOps131.opened(p.id),false);
});
for(const recipe of ['dressing','dressingLight'])test('actions133 : '+recipe+' n’apparaît que durant une préparation réellement avancée',()=>{
 const{game:g}=boot131();H.install(g);g.player.health=50;g.player.carry.medicine=4;const q=g.survivalPack.begin(recipe);assert.equal(q.ok,true,q.reason);g.update(.04);assert.equal(g.heroActions133.pose()?.kind,'dressing');g.survivalPack.cancel();g.update(.04);assert.equal(g.heroActions133.pose(),null);assert.equal(g.player.carry.medicine,4);
});
test('actions133 : huit poses de chaque geste, boucles, réduction de mouvement et priorité combat',()=>{
 assert.equal(Object.keys(A.HERO_ACTIONS133).length,8);
 for(const[kind,spec]of Object.entries(A.HERO_ACTIONS133)){
  const frames=new Set(Array.from({length:8},(_,i)=>A.heroActionPose133({visualAction133:{kind,elapsed:(i+.1)*spec.seconds/8}},false).frame));assert.equal(frames.size,8);
  assert.equal(A.heroActionPose133({visualAction133:{kind,elapsed:4}},true).frame,0);assert.equal(A.heroActionPose133({visualAction133:{kind,elapsed:4},dead:true}),null);assert.equal(A.heroActionPose133({visualAction133:{kind,elapsed:4},reload:1}),null);
 }
 assert.equal(A.heroActionPose133({visualAction133:{kind:'handle',elapsed:10,oneShot:true}}).frame,7);
});
test('actions133 : pivots mesurés dans deux vraies planches RGBA, 32 poses chacune',()=>{
 for(const[atlas,rows]of Object.entries(A.HERO_ACTION_PIVOTS133)){
  const spec=A.ASSETS[atlas],png=fs.readFileSync(path.resolve(__dirname,'..',spec.url));assert.equal(png.readUInt32BE(16),spec.width);assert.equal(png.readUInt32BE(20),spec.height);assert.equal(png[25],6);
  assert.equal(rows.length,4);for(const row of rows){assert.equal(row.length,8);for(const[x,y]of row){assert.ok(x>=0&&x<spec.width&&y>=0&&y<spec.height);}}
 }
});
test('actions133 : découpage alpha isole les voisins, conserve le pivot et ignore le RGB transparent',()=>{
 const w=14,h=8,rgba=new Uint8ClampedArray(w*h*4);for(let y=1;y<=6;y++)for(let x=1;x<=5;x++)rgba.set([110,70,25,255],(y*w+x)*4);for(let y=1;y<=6;y++)for(let x=8;x<=12;x++)rgba.set([20,80,100,255],(y*w+x)*4);rgba.set([250,0,255,0],0);
 const frames=A.isolateHeroFrames133(rgba,w,h,[[[3,3],[10,3]]]);assert.equal(frames.length,2);assert.deepEqual(frames[0].rect,[1,1,5,6]);assert.deepEqual(frames[0].pivot,[2,2]);for(let i=0;i<frames[0].data.length;i+=4)assert.equal(frames[0].data[i],110);assert.throws(()=>A.isolateHeroFrames133(new Uint8ClampedArray(4),w,h,[[[3,3]]]),/incomplets/);
});
test('actions133 : un successeur sans arme ne dessine aucun atlas armé, même sans nouvelle image',async()=>{
 const g=fresh();g.succession133={ownsWeapon:()=>false};assert.equal(g.actorPresentation.player().visualUnarmed,true);
 const old=global.Image;global.Image=class{set src(_){this.onerror();}};try{const art=A.create();await art.ready;art.images.commander={};const used=[];art.blit=(_c,atlas)=>{used.push(atlas);return true;};const ctx=new Proxy({},{get:(_t,k)=>typeof k==='symbol'?undefined:()=>{},set:()=>true});assert.equal(art.drawActor(ctx,{x:0,y:0,visualUnarmed:true},'player',1,false,false),true);assert.deepEqual(used,[]);}finally{global.Image=old;}
});

test('actions133 : récolte régionale, cible réelle et reprise ne créent aucun état persistant de pose',()=>{
 const g=fresh();g.worldEvolution.enableWorld4();Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);const w=g.frontier.world(),p=w.pois.find(p=>p.type==='mine'),o=p.outdoor[0],q=G.global(p,o.x+o.w/2,o.y-1),d=g.serialize();Object.assign(d.frontier,{x:q.x,y:q.y,z:0,inside:p.id});if(!d.frontier.seen.includes(p.id))d.frontier.seen.push(p.id);for(const place of w.nearPOI(q.x,q.y,150))for(let i=0;i<w.threatCount(place);i++){d.frontier.enemies[place.id+':e'+i]=0;delete d.frontier.tracks[place.id+':e'+i];}d.frontier.kills=Object.values(d.frontier.enemies).filter(v=>v===0).length;g.restoreSave(d);g.input.keys.add('KeyE');g.updatePlayer(.04);g.updatePlayer(.04);assert.ok(g.frontier.snapshot().taken[o.id]>0);assert.equal(g.heroActions133.pose()?.kind,'pry');const save=g.serialize();assert.equal(Object.hasOwn(save,'heroActions133'),false);g.restoreSave(save);assert.equal(g.heroActions133.pose(),null);assert.equal(g.frontier.snapshot().taken[o.id],save.frontier.taken[o.id]);
});
