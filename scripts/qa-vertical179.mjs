/** Native UI integration fixture. Prepared supplies/support completion are stated, never a natural campaign claim. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
const out=resolve(process.env.VERTICAL179_QA_OUT||'/tmp/vertical179-qa');await mkdir(out,{recursive:true});
const report={scope:'Native server and real dossier/access controls. Declared age 4, harvested nodes, starting supplies and only support completion are prepared. Bridge, equipment, reload, packing, stairs and unloading use production commands and active time. Swept native movement, not teleportation, is used after initial entry placement. No natural campaign, NPC freight or physical-device claim.',checks:[],errors:[]};
const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.DEADWALL?.vertical175?.network&&window.DEADWALL?.vertical175UI);
 await page.evaluate(()=>DEADWALL.startNew('standard','17117'));await page.locator('#campaignIntro132Skip').click();
 const action=id=>page.locator('#expansionAction-vertical175-'+id).click(),dossier=()=>page.locator('#vertical175dossier').click();
 const tick=async t=>page.evaluate(t=>{for(let x=0;x<t-1e-8;x+=.1)DEADWALL.vertical175.step(Math.min(.1,t-x));DEADWALL.render();},t);
 const fixture=await page.evaluate(()=>{
  const g=DEADWALL,C=DeadwallCore,V=g.vertical175,d=g.serialize();d.urban.peakScore=2200;d.urban.progression151={version:1,age:4};d.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:3000,medicine:50};g.restoreSave(d);
  g.paused=false;g.activeOverlay=null;g.state='playing';g.gameOver=false;for(const el of document.querySelectorAll('.overlay'))el.hidden=true;
  for(const node of g.world.nodes)node.harvest(node.amount);
  const type='verticalFoundation6',def=C.BUILDINGS[type];let a,b;
  for(let x=30;x<90&&!a;x+=2)for(let y=30;y<90&&!a;y+=2){const bx=x+def.size[0]+4;
   if(!g.world.placement(def,x,y,0).valid||!g.world.placement(def,bx,y,0).valid)continue;
   if(!g.placeOne(type,x,y))continue;a=g.world.atCell(x,y);a.progress=1;a.health=a.maxHealth;
   if(!g.placeOne(type,bx,y))throw Error('Second support refused');b=g.world.atCell(bx,y);b.progress=1;b.health=b.maxHealth;
  }
  if(!a||!b)throw Error('No legal paired support');g.refreshMetrics(true);Object.assign(g.player,V.entrance(a));
  g.camera.x=(a.x+b.x)/2;g.camera.y=a.y-50;g.camera.zoom=.8;g.render();window.fixture179={a:a.id,b:b.id};
  window.move179=(x,y)=>{for(let i=0;i<100&&Math.hypot(g.player.x-x,g.player.y-y)>.02;i++){const k=V.network.carrying()?C.VerticalNetwork179.carrySpeed:1;g.moveFriendly(g.player,(x-g.player.x)/k,(y-g.player.y)/k);}if(Math.hypot(g.player.x-x,g.player.y-y)>.05)throw Error('Swept native path blocked');g.render();};
  window.shape179=()=>DeadwallVerticalNetwork179.shape({id:1,kind:'link4',a:{site:fixture179.a,level:0},b:{site:fixture179.b,level:0},progress:0,health:1},g.world.buildings,V.presentation().sites);
  return{age:g.tier.id,a:a.id,b:b.id,entry:V.accessQuote(a.id).ok};
 });assert.equal(fixture.entry,true);await page.locator('#vertical175access').click();await tick(10);
 await page.evaluate(()=>{const q=shape179();move179(q.ports[0].x*32,q.ports[0].y*32);});
 const before=await page.evaluate(()=>({stock:{...DEADWALL.resources},quote:DEADWALL.vertical175.network.linkQuote(fixture179.b,0)}));assert.equal(before.quote.ok,true);
 await dossier();await action('group-network');await action('network-build-'+fixture.b+'-0');await tick(2);
 const progress=await page.evaluate(()=>DEADWALL.vertical175.network.presentation().links[0].link.progress);assert.ok(progress>0&&progress<1);
 await page.evaluate(()=>{DEADWALL.paused=true;});await tick(20);assert.equal(await page.evaluate(()=>DEADWALL.vertical175.network.presentation().links[0].link.progress),progress);
 await page.evaluate(()=>{DEADWALL.paused=false;});await tick(40);
 const built=await page.evaluate(()=>({progress:DEADWALL.vertical175.network.presentation().links[0].link.progress,stock:{...DEADWALL.resources},route:DEADWALL.vertical175.network.route(fixture179.b)}));assert.equal(built.progress,1);assert.equal(built.route.ok,true);
 for(const [k,n]of Object.entries(before.quote.cost))assert.equal(built.stock[k],before.stock[k]-n);report.checks.push({paidBridge:built,pausePreserved:true});
 await page.screenshot({path:out+'/01-connected-foundations.png'});
 await page.evaluate(()=>{const b=DEADWALL.world.buildings.get(fixture179.a);move179(b.x,b.y);});await dossier();await action('group-defense');await action('build-handRifle177');await tick(12);
 const gun=await page.evaluate(()=>{const V=DEADWALL.vertical175,b=DEADWALL.world.buildings.get(fixture179.a),m=V.presentation().sites.find(s=>s.id===b.id).decks[0].modules[0],p=DeadwallVertical175State.slots(b)[0];fixture179.gun=m.id;move179((p.x+.7)*32+13,p.y*32);DEADWALL.player.carry.ammo=7;return m.id;});
 await dossier();await action('reload-'+gun);await tick(6);assert.equal(await page.evaluate(()=>DEADWALL.vertical175.moduleRef(fixture179.gun).m.ammo),7);
 await dossier();await action('group-network');await action('network-pack-'+gun);await tick(12);
 assert.equal(await page.evaluate(()=>DEADWALL.vertical175.network.presentation().cargo.id),gun);
 await page.evaluate(()=>{const b=DEADWALL.world.buildings.get(fixture179.a),q=shape179();move179(b.x,b.y);move179(q.ports[0].x*32,q.ports[0].y*32);move179((q.x+q.w/2)*32,(q.y+q.h/2)*32);});
 const carried=await page.evaluate(()=>{const g=DEADWALL,pos={x:g.player.x,y:g.player.y},d=g.serialize(),ok=g.restoreSave(d);g.paused=false;g.activeOverlay=null;g.render();return{ok,before:pos,after:{x:g.player.x,y:g.player.y},height:g.vertical175.pose().z,cargo:g.vertical175.network.presentation().cargo};});
 assert.equal(carried.ok,true);assert.deepEqual(carried.before,carried.after);assert.equal(carried.height,6);assert.equal(carried.cargo.id,gun);assert.equal(carried.cargo.ammo,7);report.checks.push({midspanReload:carried});await page.screenshot({path:out+'/02-carried-equipment-midspan.png'});
 await page.evaluate(()=>{const q=shape179(),b=DEADWALL.world.buildings.get(fixture179.b);move179(q.ports[1].x*32,q.ports[1].y*32);move179(b.x,b.y);});
 await dossier();await action('group-network');await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{DEADWALL.resize();DEADWALL.render();});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:out+'/03-mobile-transport-actions.png'});
 await action('network-unload-1');await tick(12);
 const unpacked=await page.evaluate(()=>{const q=DEADWALL.vertical175.moduleRef(fixture179.gun);return{id:q.m.id,site:q.s.id,level:q.level,ammo:q.m.ammo,health:q.m.health};});assert.equal(unpacked.site,fixture.b);assert.equal(unpacked.id,gun);assert.equal(unpacked.ammo,7);assert.equal(unpacked.health,350);report.checks.push({sameEquipmentUnpacked:unpacked,mobileOverflow:false});
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>{const V=DEADWALL.vertical175,q=V.moduleRef(fixture179.gun),p=DeadwallVertical175State.slots(q.b)[q.m.slot];DEADWALL.resize();move179((p.x-.7)*32-13,p.y*32);});
 await dossier();await action('control-'+gun);
 // RAF is frozen by this fixture: render the genuine control result before looking for its newly visible button.
 const controlled=await page.evaluate(()=>{DEADWALL.render();return DEADWALL.vertical175.presentation().controlled;});assert.equal(controlled,gun,'real dossier control acquired the transported gun');
 await page.locator('#vertical175view').click();await page.evaluate(()=>{DEADWALL.vertical175.aim(Math.PI,-.13);DEADWALL.render();});
 const fps=await page.evaluate(()=>{const gl=document.getElementById('vertical175canvas').getContext('webgl');return{view:DEADWALL.vertical175.presentation().view,webgl:!!gl,error:gl?.getError(),bridges:DEADWALL.vertical175.geometry().filter(b=>b.type==='bridge').length};});assert.equal(fps.view,'fps');assert.equal(fps.webgl,true);assert.equal(fps.error,0);assert.equal(fps.bridges,1);report.checks.push({sharedBridgeGeometryFPS:fps});await page.screenshot({path:out+'/04-bridge-from-relocated-fps.png'});
 await page.locator('#vertical175leave').click();await page.evaluate(()=>{const b=DEADWALL.world.buildings.get(fixture179.b);move179(b.x,b.y);});await dossier();await action('deck');await tick(40);
 await page.evaluate(()=>{const V=DEADWALL.vertical175,q=V.moduleRef(fixture179.gun),p=DeadwallVertical175State.slots(q.b)[q.m.slot];move179((p.x-.7)*32-13,p.y*32);});await dossier();await action('group-network');await action('network-pack-'+gun);await tick(12);
 await page.evaluate(()=>{const b=DEADWALL.world.buildings.get(fixture179.b);move179(b.x,b.y);});await dossier();await action('next');await tick(10);
 assert.equal(await page.evaluate(()=>DEADWALL.vertical175.pose().z),12);await dossier();await action('group-network');await action('network-unload-0');await tick(12);
 const final=await page.evaluate(()=>{const g=DEADWALL,d=g.serialize(),ok=g.restoreSave(d),q=g.vertical175.moduleRef(fixture179.gun);return{ok,height:g.vertical175.pose().z,site:q.s.id,level:q.level,ammo:q.m.ammo,cargo:g.vertical175.network.carrying(),links:g.vertical175.network.presentation().links.length};});assert.deepEqual(final,{ok:true,height:12,site:fixture.b,level:1,ammo:7,cargo:false,links:1});report.checks.push({higherFloorTransfer:final});
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(error){report.status='failed';report.failure=String(error.stack||error);process.exitCode=1;}
finally{await writeFile(out+'/browser179-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
