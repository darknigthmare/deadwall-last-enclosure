'use strict';
const {legacyAge}=require('./helpers/legacy-city.cjs');
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{bootGame}=require('./helpers/browser.cjs');
const Kit=require('../src/expansion-kit.js'),Pack=require('../src/fortification-pack.js');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const ids=['spikedApproach','maintenanceRedoubt'];
const stable=g=>{const d=g.serialize();delete d.timestamp;return JSON.stringify(d);};
function free(g,type){
 for(let y=58;y<100;y++)for(let x=70;x<105;x++)if(g.world.placement(C.BUILDINGS[type],x,y,0).valid)return{x,y};
 throw Error('Infrastructure de fixture inaccessible : '+type);
}
function fresh(withDocument=false){
 const env=withDocument?require('../scripts/qa-startup134.cjs').bootDocument134():bootGame(),g=env.g||env.game;
 Kit.install(g);Pack.install(g);g.startNew('standard','903148');if(withDocument)g.campaignIntro132.skip();g.units=[];
 // Explicit advanced fixture: completed office/storage and paid planning below.
 for(const type of ['planningOffice','warehouse']){
  const p=free(g,type),b=new(g.core().constructor)(g.nextId++,type,p.x,p.y,0,1);g.world.add(b);
 }
 legacyAge(g,48);g.refreshMetrics(true);
 for(const k of C.RESOURCE_KEYS)g.resources[k]=Math.min(2000,g.storage);
 g.restoreSave(g.serialize());return withDocument?{...env,g}:g;
}
function position(g,id){
 for(let y=12;y<106;y+=2)for(let x=12;x<106;x+=2){const q=g.dayworks.planStatus(id,x,y);if(q.ok)return{x,y,q};}
 throw Error('Aucun emplacement physique pour '+id);
}
for(const id of ids){
 test('plans148 '+id+' : empreintes séparées, côtés ouverts et accès entre les lignes',()=>{
  const p=C.Dayworks.PLANS.find(p=>p.id===id),items=C.Dayworks.footprint(id,0,0),cells=new Map();
  assert.equal(items.length,id==='spikedApproach'?17:27);
  for(const item of items){const d=C.BUILDINGS[item.type];
   for(let y=item.gy;y<item.gy+d.size[1];y++)for(let x=item.gx;x<item.gx+d.size[0];x++){
    const key=x+':'+y;assert.ok(x>=0&&y>=0&&x<p.w&&y<p.h);assert.ok(!cells.has(key));cells.set(key,item.type);
   }
  }
  if(id==='spikedApproach')for(let y=0;y<p.h;y++)for(const x of [5,6])assert.ok(!cells.has(x+':'+y)||cells.get(x+':'+y)==='gate');
  else{
   for(let x=0;x<p.w;x++)assert.ok(!cells.has(x+':5'),'liaison transversale libre entre portes décalées');
   for(const [x,y] of [[5,1],[6,1],[7,6],[8,6]])assert.equal(cells.get(x+':'+y),'gate');
  }
  const q=C.Dayworks.quote(items,C.BUILDINGS,()=>({valid:true}),2,()=>true);
  assert.equal(q.ok,true);assert.deepEqual(q.cost,id==='spikedApproach'?{wood:255,scrap:119,ammo:40}:{scrap:520,stone:105,wood:270,ammo:40,fuel:20});
 });
 test('plans148 '+id+' : aperçu gratuit, financement exact unique, fondations et reprise',()=>{
  const g=fresh(),p=position(g,id),before=stable(g),count=g.world.buildings.size,stock={...g.resources},score=g.cityScore;
  assert.equal(g.dayworks.anchorPlan(id,p.x,p.y).ok,true);assert.equal(stable(g),before);
  assert.equal(g.dayworks.commitPlan(),true);assert.equal(g.world.buildings.size,count+p.q.items.length);
  for(const k of C.RESOURCE_KEYS)assert.equal(g.resources[k],stock[k]-(p.q.cost[k]||0));
  assert.equal(g.cityScore,score);assert.equal([...g.world.buildings.values()].filter(b=>!b.completed).length,p.q.items.length);
  assert.equal(g.dayworks.commitPlan(),false);const paid=stable(g);
  assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.equal(stable(g),paid);
  assert.equal(g.dayworks.snapshot().stats.plans,1);
  assert.deepEqual(g.expansions.snapshot().modules.fortification.fittings,[],'aucun montage fourni avec les fondations');
 });
 test('plans148 '+id+' : changement de stocks après aperçu, refus sans dépense',()=>{
  const g=fresh(),p=position(g,id);assert.equal(g.dayworks.anchorPlan(id,p.x,p.y).ok,true);g.resources.scrap=0;
  const before=stable(g);assert.equal(g.dayworks.commitPlan(),false);assert.equal(stable(g),before);
 });
 test('plans148 '+id+' : bureau disparu et nuit refusent le financement',()=>{
  const g=fresh(),p=position(g,id);g.dayworks.anchorPlan(id,p.x,p.y);
  const office=[...g.world.buildings.values()].find(b=>b.type==='planningOffice');office.dead=true;office.health=0;
  let before=stable(g);assert.equal(g.dayworks.commitPlan(),false);assert.equal(stable(g),before);
  office.dead=false;office.health=office.maxHealth;g.phase='warning';before=stable(g);
  assert.equal(g.dayworks.commitPlan(),false);assert.equal(stable(g),before);
 });
 test('plans148 '+id+' : un placement échoué au milieu annule le paiement et les fondations',()=>{
  const g=fresh(),p=position(g,id);g.dayworks.anchorPlan(id,p.x,p.y);const before=stable(g),original=g.placeOne;let calls=0;
  g.placeOne=function(...args){if(++calls===5)return false;return original.apply(this,args);};
  assert.equal(g.dayworks.commitPlan(),false);g.placeOne=original;assert.equal(calls,5);assert.equal(stable(g),before);
 });
}
test('plans148 : le mirador exige du travail réel avant de devenir observateur',()=>{
 const g=fresh(),p=position(g,'spikedApproach');g.dayworks.anchorPlan('spikedApproach',p.x,p.y);assert.equal(g.dayworks.commitPlan(),true);
 const tower=[...g.world.buildings.values()].find(b=>b.type==='watchtower');assert.equal(tower.completed,false);
 g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=tower.x+100;z.y=tower.y;
 g.player.x=4000;g.player.y=4000;assert.equal(g.visibility.canSeeLocal(z),false);
 standAt(g,g.player,tower);g.input.keys.add('KeyE');for(let i=0;i<1000&&!tower.completed;i++)g.updateInteraction(.1);g.input.keys.clear();
 assert.equal(tower.completed,true);g.player.x=4000;g.player.y=4000;assert.equal(g.visibility.canSeeLocal(z),true);
 tower.dead=true;tower.health=0;assert.equal(g.visibility.canSeeLocal(z),false);
});

// The lightweight DOM omits event propagation. Route its real registered
// document-capture handlers before the actual canvas/control callbacks. Physical
// Chromium retargeting is covered separately by browser-defenses148 unchanged.
function gestureEvent(env,type,target,extra){
 const event=env.dispatchDocument(type,{target,...extra});
 if(!event.propagationStopped&&!event.immediatePropagationStopped){
  if(type==='click')target.click();else target.dispatch(type,extra);
 }
 return event;
}
function anchorGesture(env,{id='maintenanceRedoubt',pointerId=21,valid=true,pointerType='touch',mouse=false}={}){
 const {g,doc}=env,p=valid?position(g,id):{x:0,y:0};
 g.dayworks.open();const button=doc.getElementById('plan-'+id);assert.ok(doc.body.contains(button));assert.equal(button.disabled,false);button.click();
 assert.equal(g.dayworks.workContext().placing,true);assert.equal(g.paused,false);
 // Explicit viewpoint fixture only; the actual handler derives the anchor.
 g.camera.x=(p.x+.5)*C.TILE;g.camera.y=(p.y+.5)*C.TILE;
 const rect=g.canvas.getBoundingClientRect(),extra={pointerId,pointerType:mouse?'mouse':pointerType,button:0,clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2};
 gestureEvent(env,'pointerdown',g.canvas,extra);
 if(mouse)gestureEvent(env,'mousedown',g.canvas,extra);
 const preview=g.dayworks.overview().preview;assert.equal(preview.id,id);assert.equal(preview.gx,p.x);assert.equal(preview.gy,p.y);assert.equal(preview.quote.ok,valid);
 assert.equal(g.activeOverlay,g.ui.commandModal);return {pointerId,pointerType:extra.pointerType,preview};
}
for(const targetId of ['plan-maintenanceRedoubt','dayworksCommit'])test('plans148 tactile : le click retargeté vers '+targetId+' appartient au seul geste d’ancrage',()=>{
 const env=fresh(true),{g,doc}=env,before=stable(g),gesture=anchorGesture(env),target=doc.getElementById(targetId);
 gestureEvent(env,'pointerup',g.canvas,gesture);gestureEvent(env,'lostpointercapture',g.canvas,gesture);
 const event=gestureEvent(env,'click',target,{...gesture,detail:1});
 assert.equal(event.defaultPrevented,true);assert.equal(event.immediatePropagationStopped,true);assert.deepEqual(g.dayworks.overview().preview,gesture.preview);assert.equal(g.dayworks.workContext().placing,false);assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(stable(g),before,'Aucun financement ni RNG par la fin du toucher');
 const cost=gesture.preview.quote.cost,stock={...g.resources},count=g.world.buildings.size;
 const finance=doc.getElementById('dayworksCommit');gestureEvent(env,'pointerdown',finance,{pointerId:22,pointerType:'touch',button:0});
 const next=gestureEvent(env,'click',finance,{pointerId:22,pointerType:'touch',detail:1});assert.equal(next.defaultPrevented,false);
 assert.equal(g.world.buildings.size,count+gesture.preview.quote.items.length);for(const k of C.RESOURCE_KEYS)assert.equal(g.resources[k],stock[k]-(cost[k]||0));assert.equal(g.dayworks.overview().preview,null);
});
test('plans148 tactile : aperçu invalide protégé, nouveau toucher au même bouton accepté',()=>{
 const env=fresh(true),{g,doc}=env,before=stable(g),gesture=anchorGesture(env,{valid:false}),plan=doc.getElementById('plan-maintenanceRedoubt');
 const blocked=gestureEvent(env,'click',plan,{...gesture,detail:1});assert.equal(blocked.defaultPrevented,true);assert.deepEqual(g.dayworks.overview().preview,gesture.preview);assert.equal(stable(g),before);assert.equal(doc.getElementById('dayworksCommit').disabled,true);
 gestureEvent(env,'pointerdown',plan,{pointerId:22,pointerType:'touch',button:0});const next=gestureEvent(env,'click',plan,{pointerId:22,pointerType:'touch',detail:1});assert.equal(next.defaultPrevented,false);assert.equal(g.dayworks.workContext().placing,true);assert.equal(g.dayworks.overview().preview,null);assert.equal(g.paused,false);
});
test('plans148 tactile : une garde sans click ne bloque ni nouveau geste ni clavier ou souris',()=>{
 const env=fresh(true),{g,doc}=env;
 let gesture=anchorGesture(env),plan=doc.getElementById('plan-maintenanceRedoubt');
 // Tab/lost capture do not release the debt before the old finger's click.
 env.dispatchDocument('keydown',{code:'Tab'});gestureEvent(env,'click',doc.getElementById('dayworksTab'),{pointerId:-1,pointerType:'',detail:0});
 assert.equal(gestureEvent(env,'click',plan,{...gesture,detail:1}).defaultPrevented,true);
 gesture=anchorGesture(env,{pointerId:31});gestureEvent(env,'pointerdown',plan,{pointerId:31,pointerType:'touch',button:0});
 assert.equal(gestureEvent(env,'click',plan,{pointerId:31,pointerType:'touch',detail:1}).defaultPrevented,false);assert.equal(g.dayworks.workContext().placing,true);
 gesture=anchorGesture(env,{pointerId:41});const finance=doc.getElementById('dayworksCommit'),count=g.world.buildings.size;
 assert.equal(gestureEvent(env,'click',finance,{pointerId:-1,pointerType:'',detail:0}).defaultPrevented,false);assert.ok(g.world.buildings.size>count,'Financement au clavier réellement accepté');
 gesture=anchorGesture(env,{id:'spikedApproach',pointerId:1,mouse:true});
 assert.equal(gestureEvent(env,'click',doc.getElementById('dayworksCommit'),{...gesture,detail:1}).defaultPrevented,false);assert.equal(g.dayworks.overview().preview,null,'Le clic souris conserve le financement normal');
});
test('plans148 tactile : annulation, décès, relève, reprise et nouvelle campagne nettoient le geste',()=>{
 for(const mode of ['pointercancel','cancelPlan','cancelPlacement','escape','tool','death-revive','legacy-revive','restore','newcampaign','defeat','menu']){
  const env=fresh(true),{g,doc}=env,gesture=anchorGesture(env),before=g.serialize();
  if(mode==='pointercancel')gestureEvent(env,'pointercancel',g.canvas,gesture);
  if(mode==='cancelPlan')g.dayworks.cancelPlan();if(mode==='cancelPlacement')g.cancelPlacement();if(mode==='escape')g.onEscape();if(mode==='tool')g.dayworks.setTool('none');
  if(mode==='death-revive'){g.player.invulnerable=0;g.damagePlayer(200);g.player.dead=false;g.player.health=100;}
  if(mode==='legacy-revive'){g.player.health=0;g.player.dead=true;g.update(.04);g.player.dead=false;g.player.health=100;}
  if(mode==='restore')g.restoreSave(before);if(mode==='newcampaign')g.startNew('standard','903149');if(mode==='defeat')g.triggerGameOver();if(mode==='menu')g.returnToMenu();
  const target=doc.createElement('button');let clicks=0;target.addEventListener('click',()=>clicks++);doc.body.appendChild(target);
  const event=gestureEvent(env,'click',target,{...gesture,detail:1});assert.equal(event.defaultPrevented,false,mode);assert.equal(clicks,1,mode+' : aucune dette persistante');
 }
});
