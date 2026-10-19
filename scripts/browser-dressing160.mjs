import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
const output='artifacts/qa/dressing160';fs.mkdirSync(output,{recursive:true});
const server=createGameServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const results=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?tools=1&fixture=legacy',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>!!globalThis.DEADWALL?.worldCodex);
  await page.evaluate(()=>{const g=DEADWALL;g.startNew('standard','17117');g.campaignIntro132.skip();g.worldCodex.open();});
  await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill('réfrigérateur');
  await page.locator('[data-codex-id="programme-DW-0001"]').waitFor();
  const matches=await page.locator('#worldCodexResults article').count();assert.ok(matches>0&&matches<=36);
  const before=await page.evaluate(()=>{const d=DEADWALL.serialize();delete d.timestamp;return JSON.stringify(d);});
  await page.locator('[data-codex-id="programme-DW-0001"] summary').click();
  await page.locator('[data-codex-id="programme-DW-0001"]').getByText('PROGRAMME COMPLET : PIÈCES, COURS ET MOBILIER').waitFor();
  const text=await page.locator('[data-codex-id="programme-DW-0001"]').innerText();assert.match(text,/Réfrigérateur/i);
  const after=await page.evaluate(()=>{const d=DEADWALL.serialize();delete d.timestamp;return JSON.stringify(d);});assert.equal(after,before);
  await page.screenshot({path:output+'/search-'+viewport.width+'.png'});
  const scene=await page.evaluate(()=>{
   const g=DEADWALL,w=DeadwallFrontierWorld.create(17117,8,{detailVersion:2}),p=w.pois.find(p=>p.type==='villa');
   const v={world:w,x:p.x,y:p.y,a:0,z:0,inside:p.id,taken:{},scale:9,car:null};
   const c=document.createElement('canvas');c.width=900;c.height=700;const ctx=c.getContext('2d');ctx.fillStyle='#344a36';ctx.fillRect(0,0,900,700);
   ctx.translate(450,320);ctx.scale(9,9);ctx.translate(-p.x,-p.y);
   DeadwallFrontierArt.lot(ctx,p,v);
   const d=w.detailAt(p,0),items=[...d.interior,...d.outdoor].filter(o=>o.dressing160),bounds=items.every(o=>o.x>=o.supportBounds.x&&o.y>=o.supportBounds.y&&o.x+o.w<=o.supportBounds.x+o.supportBounds.w+1e-8&&o.y+o.h<=o.supportBounds.y+o.supportBounds.h+1e-8);
   const entries=DeadwallFrontierArt.lotEntries(g,p,v),depth=items.filter(o=>o.plane!=='yard').every(o=>entries.some(e=>e.id===o.id)&&DeadwallFrontierArt.rectDepth(p,o)>DeadwallFrontierArt.rectDepth(p,o.supportBounds));
   return {png:c.toDataURL('image/png'),count:items.length,bounds,depth,solid:items.some(o=>o.solid),loot:items.some(o=>o.amount!==undefined),kindCount:new Set(items.map(o=>o.style)).size};
  });
  assert.ok(scene.count>10&&scene.bounds&&scene.depth&&!scene.solid&&!scene.loot&&scene.kindCount>=3,JSON.stringify({...scene,png:undefined}));
  fs.writeFileSync(output+'/scene-'+viewport.width+'.png',Buffer.from(scene.png.split(',')[1],'base64'));
  results.push({viewport,matches,attachments:scene.count,appearanceFamilies:scene.kindCount,supports:true,depth:true,savedStateUnchanged:true});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(output+'/report.json',JSON.stringify({ok:true,scope:'Prepared seed17117 villa painted through actual lot renderer; real search controls; no claim of natural campaign acquisition or Windows validation.',results,errors},null,2));console.log(JSON.stringify({ok:true,results,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
