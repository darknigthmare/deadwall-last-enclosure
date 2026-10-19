import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
const server=createGameServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const output='artifacts/qa/recipes159';fs.mkdirSync(output,{recursive:true});
const results=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/?tools=1&fixture=legacy',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>!!window.DEADWALL?.worldCodex&&!!window.DeadwallCodex3000Runtime?.describe);
  const summary=await page.evaluate(()=>{const g=window.DEADWALL;g.startNew('standard','17117');g.campaignIntro132?.skip();g.worldCodex.open();return {count:DeadwallCodex3000Runtime.records.length,recipes:DeadwallCodex3000Runtime.describe('DW-1001').rooms.length};});
  assert.equal(summary.count,3000);assert.equal(summary.recipes,5);
  await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill('DW-1001');
  const card=page.locator('[data-codex-id="programme-DW-1001"]');await card.waitFor();
  const before=await page.evaluate(()=>{const g=window.DEADWALL;g.paused=true;const s=g.serialize();delete s.timestamp;return JSON.stringify(s);});
  await card.locator('summary').click();await card.getByText('PROGRAMME COMPLET : PIÈCES, COURS ET MOBILIER').waitFor();
  const text=await card.innerText();assert.match(text,/Jardin · Extérieur/i);assert.match(text,/Canapé/i);assert.match(text,/Serre de jardin/i);
  const sections=await card.locator('details section').count();assert.equal(sections,5);
  await card.locator('summary').click();await card.locator('summary').click();assert.equal(await card.locator('details section').count(),5);
  const after=await page.evaluate(()=>{const s=window.DEADWALL.serialize();delete s.timestamp;return JSON.stringify(s);});assert.equal(after,before,'Reading programme cannot mutate campaign');
  await page.screenshot({path:output+'/codex-'+viewport.width+'.png',fullPage:false});
  await page.locator('#worldCodexSearch').fill('');assert.ok(await page.locator('#worldCodexResults article').count()<=36);
  const canvas=await page.evaluate(()=>{
   const R=DeadwallCodex3000Runtime,W=DeadwallFrontierWorld,w=W.create(17117,8,{detailVersion:2}),p=w.pois.find(q=>q.type==='villa');
   const c=document.createElement('canvas');c.width=900;c.height=700;const ctx=c.getContext('2d');ctx.fillStyle='#344a36';ctx.fillRect(0,0,900,700);ctx.translate(190,70);ctx.scale(12,12);
   const d=w.detailAt(p,0);for(const o of [...d.interior,...d.outdoor])DeadwallSeedDetailArt157.draw(ctx,o,{game:DEADWALL,seed:17117});
   return {png:c.toDataURL('image/png'),added:d.recipe159.added,nav:d.recipe159.navigationChecked};
  });
  assert.ok(canvas.added>0&&canvas.nav);fs.writeFileSync(output+'/furnishing-'+viewport.width+'.png',Buffer.from(canvas.png.split(',')[1],'base64'));
  results.push({viewport,count:summary.count,sections,added:canvas.added,navigationChecked:canvas.nav});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(output+'/report.json',JSON.stringify({ok:true,results,errors},null,2));console.log(JSON.stringify({ok:true,results,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
