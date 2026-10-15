/** Declared late-age fixture: native budget, paid bridge/deck/modules, real UI, actual enemy movement. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
const out=resolve(process.env.VERTICAL180_QA_OUT||'/tmp/vertical180-qa');await mkdir(out,{recursive:true});
const report={scope:'Prepared age 4, supplies, cleared resources, completed support footprints and corpse pressure. Connections, added deck, manual gun and supply use real dossier actions. One native infecté climbs, walks and uses stairs through updateZombies; no position injection after its initial ground spawn. RAF/time stepping are explicit. Not a natural campaign, device benchmark or rigid-body crowd claim.',checks:[],errors:[]};
const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.DEADWALL?.vertical175UI);
 await page.evaluate(()=>DEADWALL.startNew('standard','17117'));await page.locator('#campaignIntro132Skip').click();
 const dossier=()=>page.locator('#vertical175dossier').click(),action=id=>page.locator('#expansionAction-vertical175-'+id).click();
 const tick=seconds=>page.evaluate(t=>{for(let n=0;n<t-1e-8;n+=.1)DEADWALL.vertical175.step(Math.min(.1,t-n));DEADWALL.render();},seconds);
 const fixture=await page.evaluate(()=>{
  const g=DEADWALL,C=DeadwallCore,V=g.vertical175,d=g.serialize();d.urban.peakScore=2200;d.urban.progression151={version:1,age:4};d.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:3000,medicine:50};g.restoreSave(d);
  g.paused=false;g.activeOverlay=null;g.state='playing';g.gameOver=false;for(const el of document.querySelectorAll('.overlay'))el.hidden=true;
  for(const n of g.world.nodes)n.harvest(n.amount);
  const da=C.BUILDINGS.rampart12,db=C.BUILDINGS.refugeDeck12a177;let a,b;
  for(let x=30;x<90&&!a;x+=2)for(let y=30;y<90&&!a;y+=2){
   const bx=x+da.size[0]+4;if(!g.world.placement(da,x,y,0).valid||!g.world.placement(db,bx,y,0).valid)continue;
   if(!g.placeOne('rampart12',x,y))continue;a=g.world.atCell(x,y);a.progress=1;a.health=a.maxHealth;
   if(!g.placeOne('refugeDeck12a177',bx,y))throw Error('Foundation refused');b=g.world.atCell(bx,y);b.progress=1;b.health=b.maxHealth;
  }
  if(!a||!b)throw Error('No legal paired footprint');g.refreshMetrics(true);Object.assign(g.player,V.entrance(a));
  window.fixture180={a:a.id,b:b.id};window.shape180=()=>DeadwallVerticalNetwork179.shape({id:1,kind:'link4',a:{site:a.id,level:0},b:{site:b.id,level:0},progress:1,health:1},g.world.buildings,V.presentation().sites);
  window.move180=(x,y)=>{for(let n=0;n<100&&Math.hypot(g.player.x-x,g.player.y-y)>.03;n++)g.moveFriendly(g.player,x-g.player.x,y-g.player.y);if(Math.hypot(g.player.x-x,g.player.y-y)>.05)throw Error('Native path obstructed');g.render();};
  window.enemy180=()=>g.zombies.find(z=>z.id===fixture180.enemy);
  window.read180=()=>{const z=enemy180();return{id:z.id,x:z.x,y:z.y,health:z.health,count:g.zombies.length,pose:V.enemyPose(z)};};
  window.advance180=(mode,limit=60)=>{for(let t=0;t<limit;t+=.1){const e=enemy180(),p=V.enemyPose(e),q=shape180();if(mode==='climb'&&p.stage==='climb'&&p.z>3||mode==='bridge'&&p.bridge!==null&&e.x>q.x*32+45&&e.x<(q.x+q.w)*32-45||mode==='stairs'&&p.stage==='stairs'&&p.z>13||mode==='upper'&&p.level===1){g.render();return read180();}g.updateZombies(.1);g.rebuildBuckets();}throw Error('Enemy never reached '+mode+': '+JSON.stringify(read180()));};
  g.camera.x=(a.x+b.x)/2;g.camera.y=a.y-70;g.camera.zoom=.85;g.render();return{a:a.id,b:b.id};
 });
 await page.locator('#vertical175access').click();await tick(12);
 await page.evaluate(()=>{const q=shape180();move180(q.ports[0].x*32,q.ports[0].y*32);});
 await dossier();await action('group-network');await action('network-build-'+fixture.b+'-0');await tick(50);
 assert.equal(await page.evaluate(()=>DEADWALL.vertical175.network.presentation().links[0].link.progress),1);
 await page.evaluate(()=>{const q=shape180(),b=DEADWALL.world.buildings.get(fixture180.b);move180(q.ports[1].x*32,q.ports[1].y*32);move180(b.x,b.y);});
 await dossier();await action('deck');await tick(40);await dossier();await action('next');await tick(10);
 assert.equal(await page.evaluate(()=>DEADWALL.vertical175.pose().z),18);
 await dossier();await action('group-defense');await action('build-handRifle177');await tick(12);
 const gun=await page.evaluate(()=>{const g=DEADWALL,b=g.world.buildings.get(fixture180.b),m=g.vertical175.presentation().sites.find(s=>s.id===b.id).decks[1].modules[0],p=DeadwallVertical175State.slots(b)[m.slot];fixture180.gun=m.id;move180((p.x+.7)*32+13,p.y*32);g.player.carry.ammo=7;return m.id;});
 await dossier();await action('reload-'+gun);await tick(6);
 const spawned=await page.evaluate(()=>{const g=DEADWALL,b=g.world.buildings.get(fixture180.a);g.spawnZombie('runner');const z=g.zombies.at(-1);z.x=b.x;z.y=b.top-32;z.lastX=z.x;z.lastY=z.y;fixture180.enemy=z.id;b.corpseLoad=2000;g.rebuildBuckets();return read180();});
 const climb=await page.evaluate(()=>advance180('climb'));assert.equal(climb.id,spawned.id);assert.equal(climb.count,spawned.count);assert.ok(climb.pose.z>0&&climb.pose.z<12);report.checks.push({nativeClimb:climb});await page.screenshot({path:out+'/01-native-network-climb.png'});
 const crossing=await page.evaluate(()=>advance180('bridge'));assert.equal(crossing.pose.z,12);assert.equal(crossing.count,spawned.count);
 const resumed=await page.evaluate(()=>{const g=DEADWALL,d=g.serialize();if(!g.restoreSave(d))throw Error('Bridge restore refused');g.paused=false;g.activeOverlay=null;g.render();return read180();});assert.deepEqual(resumed,crossing);report.checks.push({midspanSave:resumed});await page.screenshot({path:out+'/02-invader-crossing-paid-bridge.png'});
 const stair=await page.evaluate(()=>advance180('stairs'));assert.ok(stair.pose.z>12&&stair.pose.z<18);assert.equal(stair.pose.site,fixture.b);
 const resumedStair=await page.evaluate(()=>{const g=DEADWALL,d=g.serialize();if(!g.restoreSave(d))throw Error('Stair restore refused');g.paused=false;g.activeOverlay=null;g.render();return read180();});assert.deepEqual(resumedStair,stair);report.checks.push({midStairSave:stair});
 await page.setViewportSize({width:390,height:844});await dossier();await action('group-network');await page.evaluate(()=>{DEADWALL.resize();DEADWALL.render();});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:out+'/03-mobile-network-dossier.png'});
 // Close through the actual dossier action, with no simulation-time shortcut for the enemy.
 await action('group-defense');await action('control-'+gun);await page.evaluate(()=>DEADWALL.render());
 const upper=await page.evaluate(()=>advance180('upper'));assert.equal(upper.pose.z,18);assert.equal(upper.count,spawned.count);assert.equal(upper.id,spawned.id);
 await page.setViewportSize({width:1440,height:900});await page.locator('#vertical175view').click();
 const before=await page.evaluate(()=>{const g=DEADWALL,V=g.vertical175,q=V.moduleRef(fixture180.gun),a=DeadwallVertical175State.lookAt(V.muzzle(q),V.aimPoint(enemy180()));V.aim(a.yaw,a.pitch);g.resize();g.render();const gl=document.getElementById('vertical175canvas').getContext('webgl');return{ammo:q.m.ammo,health:enemy180().health,view:V.presentation().view,glError:gl?.getError()};});assert.equal(before.view,'fps');assert.equal(before.glError,0);
 await page.locator('#vertical175fire').focus();await page.keyboard.down('Space');await page.evaluate(()=>{DEADWALL.vertical175.step(.05);DEADWALL.render();});await page.keyboard.up('Space');
 const after=await page.evaluate(()=>({ammo:DEADWALL.vertical175.moduleRef(fixture180.gun).m.ammo,enemy:read180()}));assert.equal(after.ammo,before.ammo-1);assert.ok(after.enemy.health<before.health);assert.equal(after.enemy.id,spawned.id);report.checks.push({sameNativeEnemyAt18m:upper,sharedFPSShot:{before,after},mobileOverflow:false});await page.screenshot({path:out+'/04-upper-floor-network-invader-fps.png'});
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=String(e.stack||e);process.exitCode=1;}
finally{await writeFile(out+'/browser180-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
