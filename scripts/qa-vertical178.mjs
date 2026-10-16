import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
import {fileURLToPath} from 'node:url';
const rootDirectory=resolve(process.env.DEADWALL_QA_ROOT||fileURLToPath(new URL('..',import.meta.url)));
const out=resolve(process.env.VERTICAL178_QA_OUT||'/tmp/vertical178-qa');
await mkdir(out,{recursive:true});
const report={root:rootDirectory,scope:'Native server, real UI buttons, explicit age/support-completion/supply fixtures and controlled active time. No full natural campaign or physical mobile-device claim.',checks:[],errors:[]};
const server=createGameServer({rootDirectory});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.DEADWALL_BROWSER_EXECUTABLE?{executablePath:process.env.DEADWALL_BROWSER_EXECUTABLE}:{}),args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.DEADWALL?.vertical175UI);
 const tick=async n=>page.evaluate(t=>{for(let x=0;x<t-1e-8;x+=.1)DEADWALL.vertical175.step(Math.min(.1,t-x));DEADWALL.render();},n);
 const action=id=>page.locator('#expansionAction-vertical175-'+id).click();
 const dossier=()=>page.locator('#vertical175dossier').click();
 async function campaign(age,type){
  await page.evaluate(()=>DEADWALL.startNew('standard','17117'));
  await page.locator('#campaignIntro132Skip').click();
  assert.equal(await page.evaluate(()=>DEADWALL.campaignIntro132.isOpen()),false);
  const f=await page.evaluate(({age,type})=>{
   const g=DEADWALL,C=DeadwallCore,V=g.vertical175;
   if(age){const d=g.serialize();d.urban.peakScore=2200;d.urban.progression151={version:1,age};d.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:3000,medicine:50};g.restoreSave(d);}
   g.paused=false;g.activeOverlay=null;g.state='playing';g.gameOver=false;
   for(const el of document.querySelectorAll('.overlay'))el.hidden=true;
   let b;for(let x=38;x<85&&!b;x+=2)for(let y=38;y<85&&!b;y+=2)if(g.world.placement(C.BUILDINGS[type],x,y,0).valid&&g.placeOne(type,x,y)){b=g.world.atCell(x,y);b.progress=1;b.health=b.maxHealth;}
   if(!b)throw Error('No legal paid support');g.refreshMetrics(true);Object.assign(g.player,V.entrance(b));g.camera.x=b.x;g.camera.y=b.y;g.camera.zoom=1;g.render();window.fixture178={base:b.id};return{age:g.tier.id,base:b.id,entry:V.accessQuote(b.id).ok};
  },{age,type});assert.equal(f.age,age);assert.equal(f.entry,true);await page.locator('#vertical175access').click();await tick(8);return f;
 }
 await campaign(0,'lookout2a177');await dossier();await action('build-handRifle177');await tick(11);
 await page.evaluate(()=>{
  const g=DEADWALL,V=g.vertical175,b=g.world.buildings.get(fixture178.base),m=V.presentation().sites[0].decks[0].modules[0],p=DeadwallVertical175State.slots(b)[m.slot];fixture178.gun=m.id;
  g.moveFriendly(g.player,(p.x+.7)*32+13-g.player.x,p.y*32-g.player.y);g.player.carry.ammo=7;for(const k of DeadwallCore.RESOURCE_KEYS)g.resources[k]=100;g.render();
 });
 const gun=await page.evaluate(()=>fixture178.gun);await dossier();await action('reload-'+gun);await tick(5);
 const before=await page.evaluate(()=>({ammo:DEADWALL.vertical175.moduleRef(fixture178.gun).m.ammo,stock:{...DEADWALL.resources}}));assert.equal(before.ammo,7);
 await dossier();await action('group-service');await action('move-'+gun+'-1');await tick(2);
 assert.equal(await page.evaluate(()=>DEADWALL.vertical175.moduleRef(fixture178.gun).m.slot),0);
 await page.evaluate(()=>{DEADWALL.paused=true;});await tick(20);
 assert.equal(await page.evaluate(()=>DEADWALL.vertical175.moduleRef(fixture178.gun).m.slot),0);
 assert.deepEqual(await page.evaluate(()=>({...DEADWALL.resources})),before.stock);
 await page.evaluate(()=>{DEADWALL.paused=false;});await tick(12);
 const moved=await page.evaluate(()=>{const V=DEADWALL.vertical175,m=V.moduleRef(fixture178.gun).m;return{id:m.id,slot:m.slot,ammo:m.ammo,health:m.health,stock:{...DEADWALL.resources}};});
 assert.equal(moved.id,gun);assert.equal(moved.slot,1);assert.equal(moved.ammo,7);assert.equal(moved.stock.wood,before.stock.wood-2);assert.equal(moved.stock.scrap,before.stock.scrap-2);report.checks.push({refugeRelocation:moved,pauseStopsWork:true});
 await dossier();await page.screenshot({path:out+'/01-refuge-reconfiguration.png'});
 const stock=await page.evaluate(()=>JSON.stringify(DEADWALL.resources));
 for(let i=0;i<10;i++)await action('catalogue-1');
 assert.equal(await page.evaluate(()=>DEADWALL.tier.id),0);assert.equal(await page.evaluate(()=>JSON.stringify(DEADWALL.resources)),stock);
 const matrix=await page.evaluate(()=>Array.from({length:11},(_,i)=>{const c=DEADWALL.vertical175.catalogue(i);return{age:i,height:c.height,supports:c.supports.length,modules:c.modules.length};}));
 assert.ok(matrix.every(a=>a.supports>0&&a.modules>0));report.checks.push({allAges:matrix,noUnlockOrDebitFromBrowsing:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{DEADWALL.resize();DEADWALL.render();});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:out+'/02-mobile-age-and-service.png'});report.checks.push({mobileViewport:'390x844',overflow:false});
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>DEADWALL.expansionUI.close());
 // Reconfigure the upper floor and lift through the same player-facing dossier.
 await campaign(4,'verticalFoundation6');await dossier();await action('deck');await tick(36);await dossier();await action('lift');await tick(26);
 await page.evaluate(()=>{for(const k of DeadwallCore.RESOURCE_KEYS)DEADWALL.resources[k]=20;DEADWALL.render();});
 await dossier();await action('group-service');await page.screenshot({path:out+'/03-floor-and-lift-maintenance.png'});
 const original=await page.evaluate(()=>({stock:{...DEADWALL.resources},height:DEADWALL.vertical175.pose().z,power:DEADWALL.world.buildings.get(fixture178.base).def.powerUse}));
 await action('remove-top-deck');assert.equal(await page.evaluate(()=>DEADWALL.vertical175.busy()),false);
 await action('remove-top-deck');await tick(4);assert.equal(await page.evaluate(()=>DEADWALL.vertical175.presentation().sites[0].decks.length),2);
 await tick(18);const floor=await page.evaluate(()=>({count:DEADWALL.vertical175.presentation().sites[0].decks.length,stock:{...DEADWALL.resources},height:DEADWALL.vertical175.pose().z}));
 assert.equal(floor.count,1);assert.equal(floor.height,6);assert.equal(floor.stock.stone,original.stock.stone+63);assert.equal(floor.stock.scrap,original.stock.scrap+31);report.checks.push({topFloorRemovedFromBelow:floor});
 await dossier();await action('remove-lift');assert.equal(await page.evaluate(()=>DEADWALL.vertical175.busy()),false);await action('remove-lift');await tick(20);
 const lift=await page.evaluate(()=>{const g=DEADWALL,V=g.vertical175,b=g.world.buildings.get(fixture178.base);return{lift:V.presentation().sites[0].lift,power:b.def.powerUse,stairs:V.accessQuote(b.id,-1,'stairs').ok,elevator:V.accessQuote(b.id,-1,'lift').ok};});
 assert.equal(lift.lift,0);assert.equal(lift.power,original.power-5);assert.equal(lift.stairs,true);assert.equal(lift.elevator,false);report.checks.push({liftRemovedStairsPreserved:lift});
 const save=await page.evaluate(()=>{const g=DEADWALL,d=g.serialize(),ok=g.restoreSave(d);return{ok,height:g.vertical175.pose().z,floors:g.vertical175.presentation().sites[0].decks.length,lift:g.vertical175.presentation().sites[0].lift};});
 assert.deepEqual(save,{ok:true,height:6,floors:1,lift:0});report.checks.push({roundTrip:save});
 await page.evaluate(()=>{DEADWALL.paused=false;DEADWALL.activeOverlay=null;DEADWALL.render();});await page.screenshot({path:out+'/04-reconfigured-foundation.png'});
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=String(e.stack||e);process.exitCode=1;}
finally{await writeFile(out+'/browser178-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
