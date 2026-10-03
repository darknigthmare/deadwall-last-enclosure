'use strict';
// Integration checks boot the shipped HTML scripts in their real order.
// The document is simulated: no CSS, GPU, audio or human-playthrough claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {bootDocument134}=require('./qa-startup134.cjs');
const root=path.resolve(__dirname,'..');
const digest=w=>crypto.createHash('sha256').update(JSON.stringify({home:w.home,roads:w.roads,pois:w.pois,towns:w.towns})).digest('hex');
function start(){const env=bootDocument134();env.g.startNew('standard','17117');env.g.campaignIntro132.skip();require('../tests/helpers/generation141.cjs').legacy(env.g);assert.equal(env.g.frontier.position().generation,6,'La fixture historique garde G6');return env;}
function campaign(){
 const {g}=start(),P=globalThis.DeadwallAtlasProjection,W=globalThis.DeadwallFrontierWorld,results=[];
 for(const seed of [17117,84329,1]){
  if(seed!==17117){assert.notEqual(g.startNew('standard',String(seed)),false);g.campaignIntro132.skip();require('../tests/helpers/generation141.cjs').legacy(g);}
  const w=g.frontier.world(),h=P.home(g),hash=digest(w);assert.equal(w.generation,6);
  assert.ok(h.x>w.size*.3&&h.x<w.size*.7&&h.y>w.size*.3&&h.y<w.size*.7,'D17 entouré de région dans les quatre directions');
  assert.deepEqual(P.model(g).core,{x:h.x,y:h.y});
  for(const [x,y]of [[0,0],[4096,4096],[311.7,2781.5]]){const q=P.toRegion(x,y,g),p=P.toLocal(q.x,q.y,g);assert.ok(Math.abs(p.x-x)<1e-7&&Math.abs(p.y-y)<1e-7,'Projection réversible par campagne');}
  const save=g.serialize();assert.equal(save.frontier.generation,6);assert.equal(g.save(false),true);assert.equal(g.restoreSave(save),true);assert.equal(digest(g.frontier.world()),hash,'Reprise sans changement des routes/parcelles');
  assert.equal(digest(W.create(seed,6)),hash,'Même graine, même carte indépendamment du cache');
  results.push({seed,home:h,hash,pois:w.pois.length,roads:w.roads.length});
 }
 assert.equal(new Set(results.map(x=>x.home.x+','+x.home.y)).size,results.length,'La graine change la position D17');assert.equal(new Set(results.map(x=>x.hash)).size,results.length,'La graine change la géographie');
 return{scenario:'campaign',status:'passed',browser:false,results};
}
function gateways(){
 const {g}=start(),P=globalThis.DeadwallAtlasProjection,C=globalThis.DeadwallCore,visited=[];
 for(const side of ['north','west','south','east']){
  const ew=side==='east'||side==='west',high=side==='east'||side==='south';let local;
  for(const cross of [970,1470,2520,3150,2048]){const p={x:ew?(high?4070:26):cross,y:ew?cross:(high?4070:26)};if(g.friendlyPositionClear(g.player,p.x,p.y)){local=p;break;}}
  assert.ok(local,'Face accessible '+side);Object.assign(g.player,local);assert.equal(g.frontier.enter(),true,'Sortie par '+side);const f=g.frontier.position(),expected=P.exitPosition(local,side,g);
  assert.ok(Math.abs(f.x-expected.x)<1e-8&&Math.abs(f.y-expected.y)<1e-8,'Sortie cohérente avec projection');
  assert.equal(g.save(false),true);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.frontier.active(),true);g.paused=false;
  const key={east:'KeyA',west:'KeyD',north:'KeyS',south:'KeyW'}[side];g.input.keys.add(key);
  for(let i=0;i<24&&g.frontier.active();i++)g.updatePlayer(.1);g.input.keys.clear();
  assert.equal(g.frontier.active(),false,'Retour physique depuis '+side);assert.ok(g.player.x>=0&&g.player.x<=C.WORLD_SIZE&&g.player.y>=0&&g.player.y<=C.WORLD_SIZE);
  assert.ok(Math.abs((ew?g.player.y:g.player.x)-(ew?local.y:local.x))<30,'Face traversée au même point latéral');visited.push({side,out:f,returned:{x:g.player.x,y:g.player.y}});
 }
 return{scenario:'gateways',status:'passed',browser:false,visited};
}
function legacy(){
 const {g}=start(),P=globalThis.DeadwallAtlasProjection,raw=JSON.parse(fs.readFileSync(path.join(root,'reports/1.35.0/legacy-g5-start-save.json'),'utf8'));
 assert.equal(raw.frontier.generation,5);assert.equal(g.restoreSave(raw),true);assert.equal(g.frontier.position().generation,5);const w=g.frontier.world();assert.equal(w.generation,5);assert.deepEqual(P.model(g).core,{x:4096,y:4096});assert.equal(w.pois.length,1783);assert.equal(w.roads.length,2432);
 assert.equal(g.save(false),true);const saved=g.serialize();g.restoreSave(saved);assert.equal(g.frontier.world().pois.length,1783);assert.deepEqual(g.serialize().frontier.taken,saved.frontier.taken);
 return{scenario:'legacy',status:'passed',browser:false,generation:5,pois:w.pois.length,roads:w.roads.length,home:P.model(g).core};
}
function depleted(){
 const {g}=start(),checks=[];
 for(const generation of [6,5]){
  if(generation===5)g.restoreSave(JSON.parse(fs.readFileSync(path.join(root,'reports/1.35.0/legacy-g5-start-save.json'),'utf8')));
  const w=g.frontier.world();let rock,point;
  for(let cx=20;cx<40&&!rock;cx++)for(let cy=20;cy<40&&!rock;cy++)for(const r of w.chunk(cx,cy).rocks){
   if(w.blocked(r.x,r.y,.2,0,null,r.id))continue;
   const p={x:r.x+r.r+.5,y:r.y};if(w.blocked(p.x,p.y,.32)||!w.line(p,{x:r.x+r.r,y:r.y},0,null,r.id,.025))continue;rock=r;point=p;break;
  }
  assert.ok(rock,'Roche isolée pour la vérification');assert.equal(w.blocked(rock.x,rock.y,.01),true);
  const s=g.serialize();Object.assign(s.frontier,{active:true,x:point.x,y:point.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y},car:null});s.frontier.taken[rock.id]=rock.amount-3;s.player.carry.stone=0;g.restoreSave(s);g.paused=false;
  g.input.keys.add('KeyE');for(let i=0;i<25;i++)g.updatePlayer(.1);g.input.keys.clear();
  assert.ok(Math.abs(g.frontier.takenAmount(rock.id)-rock.amount)<1e-7,'Dernières unités réellement récoltées via E');assert.ok(Math.abs(g.player.carry.stone-3)<1e-7,'Conservation collecte');
  const check=()=>{const world=g.frontier.world(),v=g.frontier.overview(),view={l:rock.x-3,r:rock.x+3,t:rock.y-3,b:rock.y+3};assert.equal(globalThis.DeadwallFrontierArt.depthEntries(g,v,view,[]).some(e=>e.id===rock.id),false,'Roche épuisée absente du peintre');assert.equal(world.blocked(rock.x,rock.y,.01),false,'Aucun obstacle invisible après collecte');assert.equal(world.line({x:rock.x-rock.r-1,y:rock.y},{x:rock.x+rock.r+1,y:rock.y},0,null,null,.01),true,'Rayon physique libéré');};
  check();assert.equal(g.save(false),true);g.restoreSave(g.serialize());check();checks.push({generation,rock:rock.id,remaining:rock.amount-g.frontier.takenAmount(rock.id),carried:g.player.carry.stone});
 }
 return{scenario:'depleted',status:'passed',browser:false,checks};
}
function atlas(){
 const {g,doc}=start(),P=globalThis.DeadwallAtlasProjection,w=g.frontier.world(),home=P.home(g),before=g.serialize();
 assert.equal(g.frontierUI.open(),true);const a=g.frontierUI.atlas,canvas=doc.getElementById('frontierMap');
 doc.getElementById('atlasHome').click();assert.equal(a.position().x,home.x);assert.equal(a.position().y,home.y);assert.equal(g.hud135.snapshot().blocked,true);
 function clickWorld(x,y){const p=a.screen(x,y),camera=a.position(),box=canvas.getBoundingClientRect(),clientX=box.left+p.x*box.width/camera.width,clientY=box.top+p.y*box.height/camera.height;canvas.dispatch('pointerdown',{clientX,clientY,pointerId:17,pointerType:'mouse'});canvas.dispatch('pointerup',{clientX,clientY,pointerId:17,pointerType:'mouse',type:'pointerup'});}
 clickWorld(home.x,home.y);assert.deepEqual(a.selected(),{kind:'building',id:g.core().id},'La sélection retrouve le vrai dépôt sur son ancre mobile');
 for(const gate of P.gatesFor(g)){doc.getElementById('atlasGate-'+gate.id).click();assert.equal(a.position().x,gate.x);assert.equal(a.position().y,gate.y);assert.deepEqual(a.selected(),{kind:'gate',id:gate.id});}
 doc.getElementById('atlasReset').click();assert.equal(a.position().x,w.size/2);assert.equal(a.position().y,w.size/2);
 g.showCommand(false);assert.equal(g.hud135.snapshot().blocked,false);const after=g.serialize();assert.deepEqual(after.player,before.player,'L’atlas ne téléporte pas le personnage');assert.deepEqual(after.resources,before.resources);assert.deepEqual(after.frontier,before.frontier,'Les gestes cartographiques ne modifient pas la région');
 return{scenario:'atlas',status:'passed',browser:false,home,fullMapCenter:{x:a.position().x,y:a.position().y}};
}
const scenarios={campaign,gateways,legacy,depleted,atlas};module.exports={scenarios};
if(require.main===module){const name=process.argv[2]||'campaign';try{if(!scenarios[name])throw Error('Unknown scenario: '+name);Promise.resolve(scenarios[name]()).then(r=>process.stdout.write(JSON.stringify(r)+'\n')).catch(e=>{console.error(e.stack);process.exitCode=1;});}catch(e){console.error(e.stack);process.exitCode=1;}}
