/** Prepared construction fixture; one EXISTING native worker, real dispatch/UI and physical delivery. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
const out=resolve(process.env.VERTICAL181_QA_OUT||'/tmp/vertical181-qa');await mkdir(out,{recursive:true});
const report={scope:'Prepared resources, cleared terrain and two completed Refuge supports. The initial native workforce is preserved. Paid bridge/gun and assignment/recall use actual dossier buttons. The worker is never repositioned after new-game creation: ground path, stairs, bridge, delivery and return use production controllers. Explicit RAF suspension and time steps; not a natural campaign or physical-device benchmark.',checks:[],errors:[]};
const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try {
 browser=await chromium.launch({headless:true,...(process.env.DEADWALL_BROWSER_EXECUTABLE?{executablePath:process.env.DEADWALL_BROWSER_EXECUTABLE}:{}),args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.DEADWALL?.vertical175?.population);
 await page.evaluate(()=>DEADWALL.startNew('standard','17117'));await page.locator('#campaignIntro132Skip').click();
 const dossier=()=>page.locator('#vertical175dossier').click(),action=id=>page.locator('#expansionAction-vertical175-'+id).click();
 const tick=seconds=>page.evaluate(seconds=>{for(let n=0;n<seconds-1e-8;n+=.1)DEADWALL.vertical175.step(Math.min(.1,seconds-n));DEADWALL.render();},seconds);
 const fixture=await page.evaluate(()=>{
  const g=DEADWALL,C=DeadwallCore,V=g.vertical175;g.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:100,medicine:20};for(const n of g.world.nodes)n.harvest(n.amount);
  const def=C.BUILDINGS.lookout2a177;let a,b;
  for(let x=36;x<54&&!a;x+=2)for(let y=36;y<54&&!a;y+=2){const bx=x+def.size[0]+2;if(!g.world.placement(def,x,y,0).valid||!g.world.placement(def,bx,y,0).valid)continue;
   if(!g.placeOne('lookout2a177',x,y))continue;a=g.world.atCell(x,y);a.progress=1;a.health=a.maxHealth;
   if(!g.placeOne('lookout2a177',bx,y))throw Error('Second support refused');b=g.world.atCell(bx,y);b.progress=1;b.health=b.maxHealth;
  }
  if(!a||!b)throw Error('No legal cleared support pair');g.refreshMetrics(true);Object.assign(g.player,V.entrance(a));
  const worker=g.units.find(u=>u.kind==='worker'&&u.carry===0);if(!worker)throw Error('No existing available worker');
  window.fixture181={a:a.id,b:b.id,worker:worker.id,ids:g.units.map(u=>u.id)};
  window.shape181=()=>DeadwallVerticalNetwork179.shape({id:1,kind:'link0',a:{site:a.id,level:0},b:{site:b.id,level:0},progress:1,health:1},g.world.buildings,V.presentation().sites);
  window.move181=(x,y)=>{for(let i=0;i<100&&Math.hypot(g.player.x-x,g.player.y-y)>.03;i++)g.moveFriendly(g.player,x-g.player.x,y-g.player.y);if(Math.hypot(g.player.x-x,g.player.y-y)>.05)throw Error('Native commander path obstructed');g.render();};
  window.frame181=()=>{const u=g.units.find(u=>u.id===fixture181.worker);g.camera.x=u.x;g.camera.y=u.y-V.population.pose(u).z*C.VerticalCitadel175.projectedHeight;g.camera.zoom=1.25;g.render();};
  window.ground181=(x,y,range=3)=>{for(let t=0;t<180&&Math.hypot(g.player.x-x,g.player.y-y)>range;t+=.1){g.navigationBudget=20;g.moveUnitToward(g.player,{x,y},.1,136);g.elapsed+=.1;}if(!Number.isFinite(g.player.x)||Math.hypot(g.player.x-x,g.player.y-y)>range+.5)throw Error('Native commander approach obstructed');g.render();};
  window.read181=()=>{const u=g.units.find(u=>u.id===fixture181.worker);return{id:u.id,x:u.x,y:u.y,health:u.health,carry:u.carry,carryType:u.carryType,pose:V.population.pose(u),ammo:g.resources.ammo,gun:fixture181.gun?V.moduleRef(fixture181.gun).m.ammo:0,ids:g.units.map(u=>u.id)};};
  window.advance181=(stage,max=220)=>{for(let t=0;t<max;t+=.1){const u=g.units.find(u=>u.id===fixture181.worker),p=V.population.pose(u),q=shape181();
   if(stage==='stair'&&p.travel&&p.z>.4&&p.z<1.6||stage==='bridge'&&p.bridge!==null&&u.x>q.x*32+16&&u.x<(q.x+q.w)*32-16||stage==='delivery'&&V.moduleRef(fixture181.gun).m.ammo===10||stage==='return'&&!V.population.isAssigned(u.id)){frame181();return read181();}
   g.navigationBudget=C.STRATEGY_RULES?.pathBudget??20;g.updateUnits(.1);V.step(.1);g.elapsed+=.1;
  }throw Error('Worker did not reach '+stage+': '+JSON.stringify({body:read181(),staff:V.population.presentation()}));};
  g.camera.x=(a.x+b.x)/2;g.camera.y=a.y;g.camera.zoom=1;g.render();return{...fixture181,age:g.tier.id};
 });assert.equal(fixture.age,0);
 await page.locator('#vertical175access').click();await tick(4);
 await page.evaluate(()=>{const q=shape181();move181(q.ports[0].x*32,q.ports[0].y*32);});
 await dossier();await action('group-network');await action('network-build-'+fixture.b+'-0');await tick(35);
 assert.equal(await page.evaluate(()=>DEADWALL.vertical175.network.presentation().links[0].link.progress),1);
 await page.evaluate(()=>{const b=DEADWALL.world.buildings.get(fixture181.a);move181(b.x,b.y);});await dossier();await action('group-defense');await action('build-handRifle177');await tick(12);
 await page.evaluate(()=>{fixture181.gun=DEADWALL.vertical175.presentation().sites.find(s=>s.id===fixture181.a).decks[0].modules[0].id;});
 await dossier();await action('down');await tick(5);
 await page.evaluate(()=>{const g=DEADWALL;ground181(g.core().x,g.core().y,120);g.selectBuilding(g.world.buildings.get(fixture181.a));g.render();});
 const before=await page.evaluate(()=>read181());await dossier();await action('staff-assign-'+fixture.worker);
 const assigned=await page.evaluate(()=>read181());assert.deepEqual(assigned,before);report.checks.push({assignmentIsNotTeleportOrDebit:true,existingNativeWorker:fixture.worker,workforce:fixture.ids});
 const stair=await page.evaluate(()=>advance181('stair'));assert.ok(stair.pose.z>0&&stair.pose.z<2);assert.equal(stair.carry,10);assert.equal(stair.ammo,90);assert.deepEqual(stair.ids,fixture.ids);
 const restoredStair=await page.evaluate(()=>{const g=DEADWALL;if(!g.restoreSave(g.serialize()))throw Error('Stair save refused');frame181();return read181();});assert.deepEqual(restoredStair,stair);report.checks.push({physicalStairWithFiniteBag:stair});await page.screenshot({path:out+'/01-native-worker-stair.png'});
 const crossing=await page.evaluate(()=>advance181('bridge'));assert.equal(crossing.pose.z,2);assert.equal(crossing.carry,10);assert.equal(crossing.gun,0);
 const restoredBridge=await page.evaluate(()=>{const g=DEADWALL;if(!g.restoreSave(g.serialize()))throw Error('Personnel bridge save refused');frame181();return read181();});assert.deepEqual(restoredBridge,crossing);report.checks.push({midBridgeSave:crossing});await page.screenshot({path:out+'/02-paid-bridge-courier.png'});
 const paused=await page.evaluate(()=>{const g=DEADWALL,before=read181();g.paused=true;for(let i=0;i<20;i++){g.updateUnits(.1);g.vertical175.step(.1);}const after=read181();g.paused=false;return{before,after};});assert.deepEqual(paused.before,paused.after);
 const delivered=await page.evaluate(()=>advance181('delivery'));assert.equal(delivered.gun,10);assert.equal(delivered.carry,0);assert.equal(delivered.ammo,90);assert.deepEqual(delivered.ids,fixture.ids);report.checks.push({actualDelivery:delivered,pauseConservesState:true});await page.screenshot({path:out+'/03-first-physical-delivery.png'});
 // The courier remains at its genuine delivery location while the commander returns to inspect it in FPS.
 await page.evaluate(()=>{const g=DEADWALL,entry=g.vertical175.entrance(g.world.buildings.get(fixture181.a));ground181(entry.x,entry.y);});
 await page.locator('#vertical175access').click();await tick(4);
 await page.evaluate(()=>{const q=DEADWALL.vertical175.moduleRef(fixture181.gun),p=DeadwallVertical175State.slots(q.b)[q.m.slot];move181((p.x-.7)*32-13,p.y*32);});
 await dossier();await action('control-'+await page.evaluate(()=>fixture181.gun));
 await page.evaluate(()=>DEADWALL.render());await page.locator('#vertical175view').click();
 const fps=await page.evaluate(()=>{const g=DEADWALL,V=g.vertical175,u=g.units.find(u=>u.id===fixture181.worker),a=DeadwallVertical175State.lookAt(V.muzzle(V.moduleRef(fixture181.gun)),{x:u.x/32,y:u.y/32,z:V.population.pose(u).z+1.2});V.aim(a.yaw,a.pitch);g.render();const gl=document.getElementById('vertical175canvas').getContext('webgl');return{view:V.presentation().view,worker:u.id,altitude:V.population.pose(u).z,ammo:V.moduleRef(fixture181.gun).m.ammo,webgl:!!gl,error:gl?.getError()};});
 assert.deepEqual(fps,{view:'fps',worker:fixture.worker,altitude:2,ammo:10,webgl:true,error:0});report.checks.push({sameDeliveredNativeWorkerInFPS:fps});await page.screenshot({path:out+'/05-native-courier-fps.png'});
 await page.locator('#vertical175leave').click();await page.evaluate(()=>{const b=DEADWALL.world.buildings.get(fixture181.a);move181(b.x,b.y);});await dossier();await action('down');await tick(5);
 await page.evaluate(()=>{const g=DEADWALL;ground181(g.core().x,g.core().y,120);});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{DEADWALL.selectBuilding(DEADWALL.world.buildings.get(fixture181.a));DEADWALL.resize();DEADWALL.render();});await dossier();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:out+'/04-mobile-personnel-dossier.png'});await action('staff-recall-'+fixture.worker);
 const returned=await page.evaluate(()=>advance181('return'));assert.equal(returned.carry,0);assert.equal(returned.pose.z,0);assert.equal(returned.ammo,90);assert.equal(returned.gun,10);assert.deepEqual(returned.ids,fixture.ids);report.checks.push({physicalRecall:returned,mobileOverflow:false});
 // Capability check only; the earlier six scenarios separately exercise the station WebGL renderer.
 const gl=await page.evaluate(()=>!!document.createElement('canvas').getContext('webgl'));report.webglAvailable=gl;
 if(process.env.DEADWALL_REQUIRE_WEBGL==='1')assert.equal(gl,true,'Remote GPU qualification must provide WebGL');
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=String(e.stack||e);process.exitCode=1;}
finally{await writeFile(out+'/browser181-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
