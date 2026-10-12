import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),driver=process.env.DEADWALL_PLAYWRIGHT_MODULE||'playwright',{chromium}=require(driver);
const output=path.resolve(process.env.DEADWALL_QA_OUTPUT||'artifacts/qa/infill169-fixture');await fs.mkdir(output,{recursive:true});
const modules=['frontier-specialists','frontier-places','settlement-plans','frontier-geometry','seed-detail157','seed-detail-art157','world-props-art153','interior-art153','nature-art153','codex3000-live-data','codex3000-runtime','frontier-art','world-codex-3000','world-codex'];
const specs=Object.assign({},...['world-props-art153','interior-art153','nature-art153'].map(n=>require('../src/'+n+'.js').ASSETS));
const payload=await Promise.all(Object.entries(specs).map(async([id,s])=>[id,'data:image/'+(s.url.endsWith('.svg')?'svg+xml':'png')+';base64,'+(await fs.readFile(s.url)).toString('base64')]));
const scripts=await Promise.all(modules.map(m=>fs.readFile('src/'+m+'.js','utf8')));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
const report={scope:'Isolated DOM fixture, actual recipe modules and decoded project atlases. No live campaign, navigation, native persistence or PWA certification.',browser:browser.version(),automation:require(driver+'/package.json').version,profiles:[]};
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width!==1440}),page=await context.newPage(),profile={viewport,checks:[],errors:[]};report.profiles.push(profile);page.setDefaultTimeout(15000);
  const check=(name,result)=>{profile.checks.push({name,pass:!!result});assert.ok(result,name);};page.on('pageerror',e=>profile.errors.push(e.stack||e.message));
  try{
   await page.setContent('<!doctype html><meta charset="utf-8"><style>body{box-sizing:border-box;margin:0;padding:12px;background:#142019;color:#e5e7ce;font-family:sans-serif}.hidden{display:none}</style><section id="commandPanel-field"><nav class="field-nav"></nav><section></section></section>');
   await page.addStyleTag({content:await fs.readFile('world-codex.css','utf8')});
   await page.evaluate(rules=>{globalThis.DeadwallCore={CodexInfill169Rules:rules};globalThis.__read169=0;globalThis.DEADWALL={world:{seed:17117},worldSeed:17117,art:null,showCommand(){},serialize(){__read169++;throw Error('A read-only recipe fixture must not serialize a campaign');}};},require('../src/core.js').CodexInfill169Rules);
   for(const content of scripts)await page.addScriptTag({content});
   const decoded=await page.evaluate(async images=>{const registry={};for(const[key,uri]of images){const img=new Image();img.src=uri;await img.decode();registry[key]=img;}DEADWALL.art={images:registry,blit(c,key,source,...dest){const img=registry[key];if(!img)return false;c.drawImage(img,...source,...dest);return true;}};return Object.keys(registry).length;},payload);
   check('The selected original project atlases decode',decoded===payload.length);
   await page.locator('[data-field-view="world-codex"]').click();await page.locator('#worldCodexStatus').selectOption('programme');
   const open=async id=>{await page.locator('#worldCodexSearch').fill(id);const card=page.locator('[data-codex-id="programme-'+id+'"]');await card.locator(':scope > details > summary').click();await card.locator('[data-codex-plan165]').waitFor();return card;};
   let card=await open('DW-0002'),plan=card.locator('[data-codex-plan165]');
   check('The default inspector retains the legacy revision',!await plan.locator('[data-fill168]').isChecked()&&!await plan.locator('[data-infill169]').isChecked());
   check('Opening a prescription does not allocate an image buffer',await plan.locator('canvas').evaluate(c=>c.width===1&&c.height===1));
   await plan.locator('input[type=number]').fill('42');await plan.getByRole('button',{name:'AFFICHER LE PLAN',exact:true}).click();
   const before=await plan.locator('canvas').evaluate(c=>c.toDataURL());await plan.locator('[data-infill169]').check();
   check('Revision seven changes actual rendered pixels',await plan.locator('canvas').evaluate(c=>c.toDataURL())!==before);
   check('Source complements and their remaining gaps are visible',await plan.getByText('COMPLÉMENTS SOURCE — RÉVISION 7',{exact:true}).count()===1&&/non posés/.test(await plan.innerText()));
   const summary=await page.evaluate(()=>{const d=DeadwallCodexPlan165.inspect('DW-0002',42,0,7).details.infill169;return{sourceComplements:d.added,sourceZones:d.zones.length};});profile.courtyard=summary;check('This courtyard contains newly placed physical props',summary.sourceComplements>0&&summary.sourceZones>0);
   await plan.locator('canvas').screenshot({path:path.join(output,viewport.width+'-courtyard.png')});
   check('No horizontal overflow in the fixture',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   for(let i=0;i<2;i++){await card.locator(':scope > details > summary').click();await page.waitForTimeout(30);check('Close '+(i+1)+' releases the canvas',await plan.locator('canvas').evaluate(c=>c.width===1&&c.height===1));await card.locator(':scope > details > summary').click();await plan.waitFor();check('Reopen '+(i+1)+' keeps a single inspector',await card.locator('[data-codex-plan165]').count()===1);}
   card=await open('DW-0004');plan=card.locator('[data-codex-plan165]');await plan.locator('input[type=number]').fill('42');await plan.locator('[data-infill169]').check();await plan.getByRole('button',{name:'AFFICHER LE PLAN',exact:true}).click();
   const interior=await page.evaluate(()=>{const p=DeadwallCodexPlan165.inspect('DW-0004',42,0,7);return p.details.interior.filter(o=>o.infill169).map(o=>o.kind);});profile.interiorKinds=[...new Set(interior)];check('Service rooms contain new lockers and technical cabinets',interior.includes('locker')&&interior.includes('cabinet'));
   await plan.locator('canvas').screenshot({path:path.join(output,viewport.width+'-service-rooms.png')});
   card=await open('DW-0027');plan=card.locator('[data-codex-plan165]');await plan.locator('input[type=number]').fill('42');await plan.locator('[data-infill169]').check();await plan.getByRole('button',{name:'AFFICHER LE PLAN',exact:true}).click();
   check('A medical room contains a stretcher with two free service sides',await page.evaluate(()=>DeadwallCodexPlan165.inspect('DW-0027',42,0,7).details.interior.some(o=>o.kind==='stretcher'&&o.fronts169.length===2)));
   await plan.locator('canvas').screenshot({path:path.join(output,viewport.width+'-medical.png')});
   check('Read-only inspection does not call a campaign serializer',await page.evaluate(()=>__read169===0));check('No JavaScript errors in the fixture',profile.errors.length===0);profile.pass=true;
  }catch(e){profile.pass=false;profile.failure=e.stack;await page.screenshot({path:path.join(output,viewport.width+'-failure.png')}).catch(()=>{});}finally{await context.close();console.log(JSON.stringify(profile));}
 }
}finally{await browser.close();report.pass=report.profiles.length===3&&report.profiles.every(p=>p.pass);await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
if(!report.pass)process.exitCode=1;
