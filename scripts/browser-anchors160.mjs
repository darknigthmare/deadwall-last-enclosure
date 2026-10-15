import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
const output='artifacts/qa/anchors160';fs.mkdirSync(output,{recursive:true});
const server=createGameServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const results=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>!!globalThis.DEADWALL?.worldCodex);
  await page.evaluate(()=>{const g=DEADWALL;g.startNew('standard','17117');g.campaignIntro132.skip();g.worldCodex.open();});
  const stamp=()=>page.evaluate(()=>{const d=DEADWALL.serialize();delete d.timestamp;return JSON.stringify(d);});
  const before=await stamp();await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill('DW-1001 réfrigérateur');
  const card=page.locator('[data-codex-id="programme-DW-1001"]');await card.waitFor();await card.locator('summary').click();
  await card.getByText('PROGRAMME COMPLET : PIÈCES, COURS ET MOBILIER').waitFor();const text=await card.innerText();
  assert.match(text,/Réfrigérateur/i);assert.match(text,/0\.8 × 0\.8 × 1\.85 m/);assert.match(text,/dégagement 0\.8 m/i);assert.equal(await stamp(),before);
  await page.locator('#worldCodexSearch').fill('miroir');assert.ok(await page.locator('#worldCodexResults article').count()>0);
  await page.screenshot({path:output+'/search-'+viewport.width+'.png'});
  const sample=await page.evaluate(()=>{
   const G=DeadwallFrontierGeometry,R=DeadwallCodex3000Runtime,D=DeadwallSeedDetail157,d=G.BY.clinic;
   const p={...d,type:d.id,id:'P0510',x:320,y:600,a:0,generation:7};p.parking=G.parking(p);p.outdoor=G.outdoor(p);const plan=G.plan(p,0);
   const detail=R.enrich({seed:42,p,z:0,plan,detail:D.make(42,p,0,plan),programme:p.codex,shapes:D.objects});
   const enriched=R.anchored({seed:42,p,z:0,plan,detail,programme:p.codex}),props=enriched.interior.filter(o=>o.anchored160);
   const canvas=document.createElement('canvas');canvas.width=900;canvas.height=600;canvas.dataset.qa='wall-furniture';const ctx=canvas.getContext('2d');ctx.scale(12,12);
   for(const o of props)DeadwallSeedDetailArt157.draw(ctx,o,{art:DEADWALL.art,seed:42});
   const alpha=ctx.getImageData(0,0,900,600).data.filter((_,i)=>i%4===3).some(n=>n>0);
   return{count:props.length,painted:alpha,navigation:enriched.anchors160.navigationChecked,png:canvas.toDataURL()};
  });
  assert.ok(sample.count>0&&sample.painted&&sample.navigation);fs.writeFileSync(output+'/furniture-'+viewport.width+'.png',Buffer.from(sample.png.split(',')[1],'base64'));
  results.push({viewport,search:true,exactDimensions:true,saveUnchanged:true,anchored:sample.count,painted:sample.painted,navigation:sample.navigation});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(output+'/report.json',JSON.stringify({ok:true,results,errors},null,2));console.log(JSON.stringify({ok:true,results,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
