import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
const out=resolve(process.env.VERTICAL175_QA_OUT||'/tmp/vertical175-qa');await mkdir(out,{recursive:true});
const report={scope:'Declared advanced save, native paid foundation placement with instant base completion. Production controllers advance by explicit time steps; RAF is disabled only in this test fixture. Native contextual access, camera and firing buttons are exercised. This is not a full human campaign or physical-device benchmark.',checks:[],errors:[]};
const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.DEADWALL?.vertical175&&window.DEADWALL?.vertical175UI);
 await page.screenshot({path:out+'/01-native-menu.png'});
 report.checks.push({menu:true});
 const setup=await page.evaluate(()=>{const g=DEADWALL,C=DeadwallCore,V=g.vertical175;
  g.startNew('standard','17117');const d=g.serialize();d.urban.peakScore=2200;d.urban.progression151={version:1,age:10};d.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:3000,medicine:50};g.restoreSave(d);g.paused=false;g.activeOverlay=null;g.state='playing';g.gameOver=false;
  for(const el of document.querySelectorAll('.overlay'))el.hidden=true;
  let b=null;for(let x=38;x<85&&!b;x+=2)for(let y=38;y<85&&!b;y+=2)if(g.world.placement(C.BUILDINGS.verticalFoundation6,x,y,0).valid&&g.placeOne('verticalFoundation6',x,y)){b=g.world.atCell(x,y);b.progress=1;b.health=b.maxHealth;}
  if(!b)throw Error('No legal paid support');g.refreshMetrics(true);Object.assign(g.player,V.entrance(b));window.__verticalFixture={base:b.id};g.camera.x=b.x;g.camera.y=b.y;g.camera.zoom=1;g.render();return{tier:g.tier.id,canEnter:V.accessQuote(b.id).ok};
 });assert.equal(setup.canEnter,true);report.checks.push({setup});
 await page.locator('#vertical175access').click();
 const stairs=await page.evaluate(()=>{const g=DEADWALL;for(let i=0;i<80;i++)g.vertical175.step(.1);g.render();return g.vertical175.pose();});assert.equal(stairs.z,6);assert.equal(stairs.level,0);report.checks.push({stairs});
 await page.screenshot({path:out+'/02-native-foundation.png'});
 const gun=await page.evaluate(()=>{const g=DEADWALL,V=g.vertical175,S=DeadwallVertical175State,b=g.world.buildings.get(__verticalFixture.base);
  let result=V.buildModule('sentry',0);if(!result.ok)throw Error(result.reason);for(let i=0;i<300;i++)V.step(.1);const m=V.presentation().sites[0].decks[0].modules[0],p=S.slots(b)[0];g.player.x=p.x*32+45;g.player.y=p.y*32;g.player.carry.ammo=35;
  result=V.reload(m.id);if(!result.ok)throw Error(result.reason);for(let i=0;i<50;i++)V.step(.1);result=V.possess(m.id);if(!result.ok)throw Error(result.reason);
  g.spawnZombie('walker');const z=g.zombies.at(-1),from=V.muzzle(V.moduleRef(m.id));z.x=from.x*32;z.y=(from.y-35)*32;g.rebuildBuckets();const a=S.lookAt(from,{x:z.x/32,y:z.y/32,z:.9});V.aim(a.yaw,a.pitch);g.daylight=()=>1;
  __verticalFixture.gun=m.id;__verticalFixture.enemy=z.id;g.render();return{ammo:m.ammo,health:z.health};
 });assert.equal(gun.ammo,35);report.checks.push({gun});
 await page.locator('#vertical175view').click();await page.evaluate(()=>DEADWALL.render());
 const fps=await page.evaluate(()=>{const c=document.getElementById('vertical175canvas'),gl=c.getContext('webgl');return{view:DEADWALL.vertical175.presentation().view,visible:!document.getElementById('vertical175fps').hidden,webgl:!!gl,width:c.width,height:c.height,error:gl?.getError(),vendor:gl?.getParameter(gl.VENDOR),renderer:gl?.getParameter(gl.RENDERER)};});report.checks.push({fps});
 await page.screenshot({path:out+(fps.view==='fps'?'/03-native-fps.png':'/03-classic-fallback.png')});
 assert.equal(fps.webgl,true,'WebGL unavailable: FPS visual qualification not achieved');assert.equal(fps.view,'fps');assert.equal(fps.visible,true);assert.equal(fps.error,0);
 const fire=await page.locator('#vertical175fire').boundingBox();assert.ok(fire);await page.mouse.move(fire.x+fire.width/2,fire.y+fire.height/2);await page.mouse.down();
 const shot=await page.evaluate(()=>{const g=DEADWALL;g.vertical175.step(.04);g.render();return{ammo:g.vertical175.moduleRef(__verticalFixture.gun).m.ammo,health:g.zombies.find(z=>z.id===__verticalFixture.enemy).health};});await page.mouse.up();assert.equal(shot.ammo,gun.ammo-1);assert.equal(shot.health,gun.health-32);report.checks.push({nativeFpsShot:shot});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{DEADWALL.resize();DEADWALL.render();});
 const mobile=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,view:DEADWALL.vertical175.presentation().view,visible:!document.getElementById('vertical175fps').hidden}));assert.equal(mobile.overflow,false);assert.equal(mobile.view,'fps');report.checks.push({mobile});await page.screenshot({path:out+'/04-native-mobile-fps.png'});
 const saved=await page.evaluate(()=>{const g=DEADWALL,d=g.serialize(),ammo=g.vertical175.moduleRef(__verticalFixture.gun).m.ammo;g.restoreSave(d);g.paused=false;g.render();return{height:g.vertical175.pose().z,controlled:g.vertical175.presentation().controlled,before:ammo,after:g.vertical175.moduleRef(__verticalFixture.gun).m.ammo};});assert.equal(saved.height,6);assert.equal(saved.controlled,null);assert.equal(saved.before,saved.after);report.checks.push({saved});assert.deepEqual(report.errors,[]);report.status='passed';
}catch(error){report.status='failed';report.failure=String(error.stack||error);process.exitCode=1;}
finally{await writeFile(out+'/browser-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
