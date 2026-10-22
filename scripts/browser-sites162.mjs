import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
import {ready} from './browser-qa-common142.mjs';
const output=process.env.DEADWALL_QA_OUTPUT||'artifacts/qa/sites162';fs.mkdirSync(output,{recursive:true});
const server=createGameServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
const profiles=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
  page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/?tools=1&fixture=legacy',{waitUntil:'networkidle'});
  // Wait for the real startup contract before invoking the campaign intro.
  await ready(page);
  await page.waitForFunction(()=>!!globalThis.DEADWALL?.worldCodex&&!!globalThis.DeadwallCodexSites162);
  await page.evaluate(()=>{DEADWALL.startNew('standard','17117');DEADWALL.campaignIntro132.skip();DEADWALL.worldCodex.open();});
  await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill('DW-0001');
  const card=page.locator('[data-codex-id="programme-DW-0001"]');await card.waitFor();
  const before=await page.evaluate(()=>{const d=DEADWALL.serialize();delete d.timestamp;return JSON.stringify(d);});
  await card.getByText('Accès, ressources et précautions',{exact:true}).click();await card.getByText('EXTÉRIEURS ET CHEMINEMENTS',{exact:true}).waitFor();
  const text=await card.innerText();assert.match(text,/Gravier stabilisé/);assert.match(text,/ni bonus de vitesse/);
  await card.getByText('Accès, ressources et précautions',{exact:true}).click();await card.getByText('Accès, ressources et précautions',{exact:true}).click();assert.equal(await card.getByText('EXTÉRIEURS ET CHEMINEMENTS',{exact:true}).count(),1);
  const after=await page.evaluate(()=>{const d=DEADWALL.serialize();delete d.timestamp;return JSON.stringify(d);});assert.equal(before,after);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:output+'/atlas-'+viewport.width+'.png'});
  const scenes=await page.evaluate(()=>{
   const w=DeadwallFrontierWorld.create(17117,8,{detailVersion:3}),S=DeadwallCodexSites162;
   const subjects=[w.pois.find(p=>p.programme3000==='DW-0001')||w.pois.find(p=>p.type==='house'),w.pois.find(p=>p.type==='marketgarden'),w.pois.find(p=>p.type==='warehouse')];
   return subjects.map(p=>{
    const site=S.forWorld(w,p),detail=w.detailAt(p,0),prior=JSON.stringify([p,w.plan(p,0),detail]);
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=820;const c=canvas.getContext('2d');c.fillStyle='#465a3c';c.fillRect(0,0,960,820);
    const scale=Math.min(800/(p.w+40),720/(p.h+55));
    c.translate(480,380);c.scale(scale,scale);c.rotate(-p.a);c.translate(-p.x,-p.y);
    const v={world:w,x:p.x,y:p.y,z:0,inside:p.id,taken:{},scale,car:null};
    DeadwallFrontierArt.lot(c,p,v);
    const stable=JSON.stringify([p,w.plan(p,0),w.detailAt(p,0)])===prior;
    return {type:p.type,programme:p.programme3000||p.codex,profile:site.profile.id,material:site.profile.material,natural:site.profile.natural,segments:site.paths.length,connected:site.connected.length,unreachable:site.unreachable.length,stable,cacheSame:S.forWorld(w,p)===site,png:canvas.toDataURL('image/png')};
   });
  });
  assert.equal(scenes.length,3);assert.equal(scenes[0].natural,true);assert.equal(scenes[1].material,'earth');assert.equal(scenes[2].material,'concrete');
  for(const [i,s]of scenes.entries()){
   assert.ok(s.stable&&s.cacheSame&&s.segments>0&&s.connected>0,JSON.stringify({...s,png:null}));
   fs.writeFileSync(output+'/site-'+viewport.width+'-'+i+'.png',Buffer.from(s.png.split(',')[1],'base64'));delete s.png;
  }
  profiles.push({viewport,sourcePrescriptions:true,noDuplicateSection:true,saveUnchanged:true,noHorizontalOverflow:true,scenes});await context.close();
 }
 assert.deepEqual(errors,[]);
 const report={ok:true,scope:'Real Atlas controls; three prepared G8/G7-derived site scenes painted by actual lot renderer. Not natural campaign acquisition, dynamic-vehicle pathfinding or Windows certification.',profiles,errors};
 fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
