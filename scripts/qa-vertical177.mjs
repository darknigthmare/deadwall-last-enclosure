import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
const out=resolve(process.env.VERTICAL177_QA_OUT||'/tmp/vertical177-qa');await mkdir(out,{recursive:true});
const report={scope:'Native server and UI. Explicit support completion and advanced-age fixtures; native traversal, costs, construction, maintenance and firing. No full human campaign or physical-device benchmark.',checks:[],errors:[]};
const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.DEADWALL_BROWSER_EXECUTABLE?{executablePath:process.env.DEADWALL_BROWSER_EXECUTABLE}:{}),args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.DEADWALL?.vertical175UI);
 const setup=await page.evaluate(()=>{
  const g=DEADWALL,C=DeadwallCore,V=g.vertical175;g.startNew('standard','17117');g.paused=false;g.activeOverlay=null;g.state='playing';g.gameOver=false;for(const el of document.querySelectorAll('.overlay'))el.hidden=true;
  let b;for(let x=38;x<85&&!b;x+=2)for(let y=38;y<85&&!b;y+=2)if(g.world.placement(C.BUILDINGS.lookout2a177,x,y,0).valid&&g.placeOne('lookout2a177',x,y)){b=g.world.atCell(x,y);b.progress=1;b.health=b.maxHealth;}
  if(!b)throw Error('No legal early support');g.refreshMetrics(true);Object.assign(g.player,V.entrance(b));g.camera.x=b.x;g.camera.y=b.y;g.camera.zoom=1;g.render();window.fixture177={base:b.id};
  window.tick177=seconds=>{for(let x=0;x<seconds-1e-8;x+=.1)V.step(Math.min(.1,seconds-x));g.render();};
  return{age:g.tier.id,entry:V.accessQuote(b.id).ok,stock:{...g.resources}};
 });assert.equal(setup.age,0);assert.equal(setup.entry,true);report.checks.push({earlySetup:setup});
 await page.locator('#vertical175access').click();await page.evaluate(()=>tick177(4));assert.equal(await page.evaluate(()=>DEADWALL.vertical175.pose().z),2);
 await page.locator('#vertical175dossier').click();await page.evaluate(()=>DEADWALL.render());
 await page.locator('#expansionAction-vertical175-build-handRifle177').click();await page.evaluate(()=>tick177(11));
 const equipment=await page.evaluate(()=>{const g=DEADWALL,V=g.vertical175,b=g.world.buildings.get(fixture177.base),m=V.presentation().sites[0].decks[0].modules[0],p=DeadwallVertical175State.slots(b)[m.slot];fixture177.gun=m.id;g.moveFriendly(g.player,(p.x+.7)*32+13-g.player.x,p.y*32-g.player.y);g.player.carry.ammo=7;g.render();return{kind:m.kind,progress:m.progress,ammo:m.ammo};});assert.equal(equipment.kind,'handRifle177');assert.equal(equipment.progress,1);assert.equal(equipment.ammo,0);report.checks.push({physicalBuild:equipment});
 await page.locator('#vertical175dossier').click();await page.locator('#expansionAction-vertical175-reload-'+await page.evaluate(()=>fixture177.gun)).click();await page.evaluate(()=>tick177(5));
 const supply=await page.evaluate(()=>({loaded:DEADWALL.vertical175.moduleRef(fixture177.gun).m.ammo,carried:DEADWALL.player.carry.ammo}));assert.deepEqual(supply,{loaded:7,carried:0});report.checks.push({supply});
 await page.locator('#vertical175dossier').click();await page.locator('#expansionAction-vertical175-control-'+await page.evaluate(()=>fixture177.gun)).click();
 const gun=await page.evaluate(()=>{const g=DEADWALL,V=g.vertical175,q=V.moduleRef(fixture177.gun),from=V.muzzle(q);g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=from.x*32;z.y=(from.y-25)*32;fixture177.enemy=z.id;g.rebuildBuckets();const a=DeadwallVertical175State.lookAt(from,V.aimPoint(z));V.aim(a.yaw,a.pitch);g.daylight=()=>1;g.render();return{health:z.health,ammo:q.m.ammo};});
 await page.locator('#vertical175view').click();await page.evaluate(()=>DEADWALL.render());assert.equal(await page.evaluate(()=>DEADWALL.vertical175.presentation().view),'fps');
 await page.screenshot({path:out+'/01-refuge-manual-fps.png'});
 await page.locator('#vertical175fire').focus();await page.keyboard.down('Space');await page.evaluate(()=>{DEADWALL.vertical175.step(.04);DEADWALL.render();});await page.keyboard.up('Space');
 const fired=await page.evaluate(()=>({ammo:DEADWALL.vertical175.moduleRef(fixture177.gun).m.ammo,health:DEADWALL.zombies.find(z=>z.id===fixture177.enemy).health}));assert.equal(fired.ammo,6);assert.equal(fired.health,gun.health-26);report.checks.push({manualShot:fired});
 await page.locator('#vertical175leave').click();
 const hp=await page.evaluate(()=>{const V=DEADWALL.vertical175;V.damageModule(fixture177.gun,100);DEADWALL.render();return V.moduleRef(fixture177.gun).m.health;});
 await page.locator('#vertical175dossier').click();await page.locator('#expansionAction-vertical175-group-service').click();
 await page.screenshot({path:out+'/02-maintenance-catalogue.png'});
 await page.locator('#expansionAction-vertical175-repair-'+await page.evaluate(()=>fixture177.gun)).click();await page.evaluate(()=>tick177(9));
 const repaired=await page.evaluate(()=>DEADWALL.vertical175.moduleRef(fixture177.gun).m.health);assert.equal(repaired,hp+100);report.checks.push({repair:repaired});
 await page.locator('#vertical175dossier').click();const id=await page.evaluate(()=>fixture177.gun),ammoBefore=await page.evaluate(()=>DEADWALL.resources.ammo);
 await page.locator('#expansionAction-vertical175-dismantle-'+id).click();assert.equal(await page.evaluate(()=>DEADWALL.vertical175.busy()),false);
 await page.locator('#expansionAction-vertical175-dismantle-'+id).click();await page.evaluate(()=>tick177(11));
 const dismantled=await page.evaluate(()=>({removed:DEADWALL.vertical175.moduleRef(fixture177.gun)===null,ammo:DEADWALL.resources.ammo}));assert.equal(dismantled.removed,true);assert.equal(dismantled.ammo,ammoBefore+6);report.checks.push({dismantled});
 await page.locator('#vertical175dossier').click();const stock=await page.evaluate(()=>JSON.stringify(DEADWALL.resources));
 for(let i=0;i<10;i++)await page.locator('#expansionAction-vertical175-catalogue-1').click();
 assert.equal(await page.evaluate(()=>DEADWALL.tier.id),0);assert.equal(await page.evaluate(()=>JSON.stringify(DEADWALL.resources)),stock);report.checks.push({allElevenAgePages:true,ageUnchanged:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{DEADWALL.resize();DEADWALL.render();});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:out+'/03-mobile-age-catalogue.png'});
 // Final-age fixture retains actual paid placement and timed access.
 await page.setViewportSize({width:1440,height:900});const late=await page.evaluate(()=>{
  const g=DEADWALL,C=DeadwallCore,V=g.vertical175;g.startNew('standard','17117');const d=g.serialize();d.urban.peakScore=2200;d.urban.progression151={version:1,age:10};d.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:3000,medicine:50};g.restoreSave(d);g.paused=false;g.activeOverlay=null;g.state='playing';g.gameOver=false;for(const el of document.querySelectorAll('.overlay'))el.hidden=true;
  for(const n of g.world.nodes)n.harvest(n.amount);let b;for(let x=4;x<120&&!b;x+=2)for(let y=4;y<120&&!b;y+=2)if(g.world.placement(C.BUILDINGS.rampart72a177,x,y,0).valid&&g.placeOne('rampart72a177',x,y)){b=g.world.atCell(x,y);b.progress=1;b.health=b.maxHealth;}
  if(!b)throw Error('No legal late wall');g.refreshMetrics(true);Object.assign(g.player,V.entrance(b));g.camera.x=b.x;g.camera.y=b.y-180;g.camera.zoom=.75;g.resize();g.render();return{age:g.tier.id,height:b.def.height,quote:V.accessQuote(b.id).ok};
 });assert.equal(late.quote,true);assert.equal(late.height,72);
 await page.locator('#vertical175access').click();await page.evaluate(()=>tick177(40));
 const ending=await page.evaluate(()=>{const g=DEADWALL,d=g.serialize();const ok=g.restoreSave(d);g.paused=false;g.activeOverlay=null;g.render();return{ok,height:g.vertical175.pose().z,age:g.tier.id};});assert.deepEqual(ending,{ok:true,height:72,age:10});report.checks.push({lateSave:ending});await page.screenshot({path:out+'/04-megacity72-classic.png'});
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=String(e.stack||e);process.exitCode=1;}
finally{await writeFile(out+'/browser177-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
