'use strict';
const {legacyAge}=require('./helpers/legacy-city.cjs');
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

function stable(g){const d=g.serialize();delete d.timestamp;return d;}
function setup(){
 const env=bootDocument134(),g=env.g,C=globalThis.DeadwallCore;g.startNew('standard','17117');g.campaignIntro132.skip();g.units=[];
 // The simulated DOM lacks native HTML number-input validation. Emulate its
 // existing integer/range checks; Chromium exercises the native method.
 for(const id of ['x1','y1','x2','y2']){const input=env.doc.getElementById('infra-'+id);input.reportValidity=()=>Number.isInteger(Number(input.value))&&Number(input.value)>=Number(input.min)&&Number(input.value)<=Number(input.max);}
 // The prerequisite buildings and the previously attained age are explicit
 // prepared fixtures. All route materials below come from the native stocks.
 for(const type of ['planningOffice','roadDepot','workshop']){
  let added=false;for(let y=70;y<90&&!added;y++)for(let x=70;x<90&&!added;x++)if(g.world.placement(C.BUILDINGS[type],x,y,0).valid){g.world.add(new(g.core().constructor)(g.nextId++,type,x,y,0,1));added=true;}
  assert.equal(added,true,type+' fixture has a lawful footprint');
 }
 legacyAge(g,85);g.refreshMetrics(true);g.restoreSave(g.serialize());
 let cell;for(let y=58;y<70&&!cell;y++)for(let x=54;x<75&&!cell;x++){
  const p={x,y},q=g.infrastructure.plan(p,p);
  if(q.ok&&g.friendlyPositionClear(g.player,x*32+16,y*32+16))cell=p;
 }
 assert.ok(cell,'a free normal road cell exists');g.infrastructure.cancel();return{...env,g,C,cell};
}
function work(g,cell,done){
 const target={x:cell.x*32+16,y:cell.y*32+16};assert.equal(g.friendlyPositionClear(g.player,target.x,target.y),true);Object.assign(g.player,target);
 if(!g.infrastructure.toolActive())assert.equal(g.infrastructure.equip(),true);
 g.input.keys.add('KeyE');for(let i=0;i<350&&!done();i++)g.updateInteraction(.04);g.input.keys.clear();assert.equal(done(),true,'physical E work finishes');
}
function continueExactly(g,label){const before=stable(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(stable(g),before,label+' preserves every save field');}

test('routes150 : vrai volet, financement payé, pause, ACTION tactile, rénovation et reprise exacte à chaque palier',()=>{
 const {g,doc,C,cell}=setup(),D=globalThis.DeadwallInfrastructure,nodes=JSON.stringify(g.world.nodes.map(n=>[n.id,n.x,n.y,n.amount])),initial={...g.resources};
 g.infrastructure.open();g.infrastructureUI.refresh(true);
 for(const [id,value]of [['x1',cell.x],['y1',cell.y],['x2',cell.x],['y2',cell.y]])doc.getElementById('infra-'+id).value=value;
 assert.equal(doc.getElementById('infraSurface-paving').disabled,false);assert.equal(doc.getElementById('infraSurface-concrete').disabled,true);
 // Entering command pauses the clock but permits explicit financing orders.
 assert.equal(g.paused,true);assert.equal(doc.getElementById('infraPreview').disabled,false);
 doc.getElementById('infraPreview').click();assert.deepEqual(g.resources,initial);doc.getElementById('infraCommit').click();
 assert.equal(g.infrastructure.snapshot().roads.length,1);assert.equal(g.resources.stone,initial.stone-2);assert.equal(g.resources.scrap,initial.scrap-1);
 assert.equal(g.infrastructure.speed(cell.x*32+16,cell.y*32+16,'truck'),1);
 doc.getElementById('infraEquip').click();assert.equal(g.paused,false);
 Object.assign(g.player,{x:cell.x*32+16,y:cell.y*32+16});
 doc.getElementById('touchAction').dispatch('pointerdown');assert.equal(g.input.keys.has('KeyE'),true);
 g.updateInteraction(.04);doc.getElementById('touchAction').dispatch('pointerup');assert.ok(g.infrastructure.snapshot().roads[0].progress>0);
 const paused=g.infrastructure.snapshot();g.togglePause(true);g.input.keys.add('KeyE');for(let i=0;i<10;i++)g.updateInteraction(.04);g.input.keys.clear();assert.deepEqual(g.infrastructure.snapshot(),paused);g.togglePause(false);
 work(g,cell,()=>g.infrastructure.snapshot().roads[0].progress===1);assert.deepEqual(g.infrastructure.snapshot().roads[0],{...cell,progress:1});continueExactly(g,'historical completed gravel');
 for(const id of ['paving','concrete','logistics']){
  const s=D.SURFACES[id];legacyAge(g,C.CITY_TIERS[s.unlockTier].requiredScore);g.refreshMetrics(true);g.infrastructure.open();g.infrastructureUI.refresh(true);
  assert.equal(doc.getElementById('infraSurface-'+id).disabled,false);doc.getElementById('infraSurface-'+id).click();doc.getElementById('infraMode-upgrade').click();
  const previous=D.surface(g.infrastructure.snapshot().roads[0]),stock={...g.resources};doc.getElementById('infraPreview').click();assert.deepEqual(g.resources,stock);
  const quote=g.infrastructure.overview().preview;assert.equal(quote.ok,true);doc.getElementById('infraCommit').click();
  for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(quote.cost[key]||0));
  assert.equal(g.infrastructure.overview().jobs,1);assert.equal(g.infrastructure.speed(cell.x*32+16,cell.y*32+16,'hostile'),previous.hostileSpeed);
  const paid={...g.resources};assert.equal(g.infrastructure.commit().ok,false);assert.deepEqual(g.resources,paid);
  doc.getElementById('infraEquip').click();Object.assign(g.player,{x:cell.x*32+16,y:cell.y*32+16});g.input.keys.add('KeyE');g.updateInteraction(.04);g.input.keys.clear();
  const underWork=g.infrastructure.snapshot();assert.ok(underWork.roads[0].upgrade.progress>0);continueExactly(g,id+' active renovation');assert.deepEqual(g.infrastructure.snapshot(),underWork);
  work(g,cell,()=>!g.infrastructure.snapshot().roads[0].upgrade);assert.equal(g.infrastructure.snapshot().roads[0].surface,id);assert.equal(g.infrastructure.speed(cell.x*32+16,cell.y*32+16,'truck'),s.truckSpeed);assert.equal(g.infrastructure.overview().jobs,0);
  continueExactly(g,id+' finished surface');
 }
 for(const [key,n]of Object.entries(D.SURFACES.logistics.cost))assert.equal(g.resources[key],initial[key]-n);
 assert.equal(JSON.stringify(g.world.nodes.map(n=>[n.id,n.x,n.y,n.amount])),nodes,'roads never regenerate, move or erase finite natural supplies');
 const before=stable(g),world=g.world,bad=g.serialize();bad.infrastructure.roads[0].upgrade={surface:'paving',progress:.2};assert.throws(()=>g.restoreSave(bad),/Réseau de cité invalide/);assert.equal(g.world,world);assert.deepEqual(stable(g),before,'invalid downgrade is rejected before world or stock mutation');
});

test('routes150 : palier/support/stocks/occupation revérifiés au paiement, sans effet partiel',()=>{
 const {g,C,cell}=setup();
 const snapshot=()=>stable(g);
 g.infrastructure.chooseSurface('concrete');let before=snapshot();assert.equal(g.infrastructure.plan(cell,cell).ok,false);assert.deepEqual(snapshot(),before);
 g.infrastructure.chooseSurface('paving');assert.equal(g.infrastructure.plan(cell,cell).ok,true);const depot=[...g.world.buildings.values()].find(b=>b.type==='roadDepot');depot.dead=true;depot.health=0;before=snapshot();assert.equal(g.infrastructure.commit().ok,false);assert.deepEqual(snapshot(),before);
 depot.dead=false;depot.health=depot.maxHealth;assert.equal(g.infrastructure.plan(cell,cell).ok,true);const stone=g.resources.stone;g.resources.stone=0;before=snapshot();assert.equal(g.infrastructure.commit().ok,false);assert.deepEqual(snapshot(),before);g.resources.stone=stone;
 assert.equal(g.infrastructure.plan(cell,cell).ok,true);const b=new(g.core().constructor)(g.nextId++,'woodWall',cell.x,cell.y,0,1);assert.equal(g.world.placement(C.BUILDINGS.woodWall,cell.x,cell.y).valid,true);g.world.add(b);before=snapshot();assert.equal(g.infrastructure.commit().ok,false);assert.deepEqual(snapshot(),before);
});

test('routes150 : tracé tactile respecte le revêtement sélectionné et garde une confirmation payée',()=>{
 const {g,doc,cell}=setup();g.infrastructure.open();g.infrastructureUI.refresh(true);doc.getElementById('infraSurface-paving').click();doc.getElementById('infraTrace').click();assert.equal(g.paused,false);
 const before={...g.resources},pointerId=51,clientX=(cell.x*32+16-g.camera.x)*g.camera.zoom+g.width/2,clientY=(cell.y*32+16-g.camera.y)*g.camera.zoom+g.height/2;
 for(let i=0;i<2;i++){g.canvas.dispatch('pointerdown',{pointerId,pointerType:'touch',clientX,clientY});g.canvas.dispatch('pointerup',{pointerId,pointerType:'touch',clientX,clientY});}
 assert.equal(g.infrastructure.overview().preview.surface,'paving');assert.equal(g.infrastructure.snapshot().roads.length,0);assert.deepEqual(g.resources,before);assert.equal(g.paused,true);
 doc.getElementById('infraCommit').click();assert.equal(g.infrastructure.snapshot().roads[0].surface,'paving');assert.equal(g.infrastructure.snapshot().roads[0].progress,0);assert.equal(g.resources.stone,before.stone-5);
});

test('routes150 : ouvrier payé rejoint les travaux, et routes avancées respectent obstacles et préférences physiques',()=>{
 const {g,cell}=setup(),D=globalThis.DeadwallInfrastructure;
 assert.equal(g.infrastructure.chooseSurface('paving').ok,true);assert.equal(g.infrastructure.plan(cell,cell).ok,true);assert.equal(g.infrastructure.commit().ok,true);
 const food=g.resources.food;assert.equal(g.recruit('worker'),true);assert.equal(g.resources.food,food-25);assert.equal(g.units.length,1);const worker=g.units[0];
 assert.equal(g.infrastructure.assign(worker.id).ok,true);Object.assign(worker,{x:cell.x*32+16,y:cell.y*32+16});assert.equal(g.friendlyPositionClear(worker,worker.x,worker.y),true);
 const initial=g.infrastructure.snapshot();g.paused=true;g.infrastructure.updateAssignedUnit(worker,.25);assert.deepEqual(g.infrastructure.snapshot(),initial);g.paused=false;
 for(let i=0;i<40&&D.unfinished(g.infrastructure.snapshot().roads[0]);i++)g.infrastructure.updateAssignedUnit(worker,.25);
 assert.equal(D.unfinished(g.infrastructure.snapshot().roads[0]),false);assert.equal(g.units.length,1,'detachment creates no worker');assert.equal(g.infrastructure.snapshot().crew[0].id,worker.id);
 const x=worker.x,y=worker.y;g.moveFriendly(worker,3,0);assert.ok(Math.abs(worker.x-x-3*D.SURFACES.paving.friendlySpeed)<1e-7,'actual friendly movement uses the completed surface');worker.x=x;worker.y=y;
 // This runtime search crosses a real advanced road at the exact cell cost;
 // no invalid A* lower bound inherited from the older 1.30 truck cap.
 const route=g.infrastructure.findPath({x:cell.x-1,y:cell.y},{x:cell.x+1,y:cell.y},()=>false,128,128,8192,'truck');assert.ok(route.some(p=>p.x===cell.x&&p.y===cell.y));
 const wall=new(g.core().constructor)(g.nextId++,'woodWall',cell.x,cell.y,0,1);g.world.add(wall);
 for(const kind of ['friendly','truck','hostile'])assert.equal(g.infrastructure.speed(x,y,kind),1,'a completed road does not let '+kind+' pass through a live wall');
});
