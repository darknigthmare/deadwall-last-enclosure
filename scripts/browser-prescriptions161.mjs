import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
const h=await createHarness('prescriptions161','Real new-game, pause, command and atlas controls. Four emulated viewports; source prescriptions are not proof that every architecture is spawned.');h.report.profiles=[];
try{
 for(const v of [{name:'desktop',width:1440,height:900},{name:'laptop',width:1280,height:720},{name:'mobile',width:390,height:844,touch:true},{name:'landscape',width:844,height:390,touch:true}]){
  const context=await h.browser.newContext({viewport:{width:v.width,height:v.height},hasTouch:!!v.touch,isMobile:!!v.touch,serviceWorkers:'block'}),page=await context.newPage(),report={viewport:v};h.report.profiles.push(report);
  const {check,screenshot,errors}=recorder(page,report,h.output,v.name+'-');page.setDefaultTimeout(45000);
  try{
   await page.goto(h.base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page);
   report.identity=await page.evaluate(()=>({id:DEADWALL.runId,rows:DEADWALL.profile.get().recentRuns.map(r=>({id:r.runId,seed:r.seed}))}));
   check('One new campaign produces exactly one final history identity',report.identity.rows.length===1&&report.identity.rows[0].id===report.identity.id&&report.identity.rows[0].seed===17117);
   await page.locator('#campaignIntro132Skip').click();await page.locator('#pauseButton').click();await page.locator('#pauseCommandButton').click();await page.locator('#commandTab-field').click();await page.getByRole('button',{name:'ATLAS & GUIDE',exact:true}).click();
   await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill('réfrigérateur');
   const card=page.locator('[data-codex-id="programme-DW-0001"]');await card.waitFor();
   const stable=()=>page.evaluate(()=>{const s=DEADWALL.serialize();delete s.timestamp;return JSON.stringify(s);});const before=await stable();
   await card.locator('summary').click();await card.locator('.codex-prescription161').waitFor();
   const expected=await page.evaluate(()=>{const d=DeadwallCodex3000Runtime.describe('DW-0001');return {props:d.rooms.reduce((n,r)=>n+r.authoredProps.length,0),rooms:d.rooms.length,access:d.access.length};});
   check('Every authored furniture specification is exposed once',await card.locator('.codex-source-prop161').count()===expected.props);
   const text=await card.innerText();check('Dimensions, orientation, anchors and source loot status are explicit',text.includes('2,1 × 0,8 × 1,1 m')&&text.includes('Ancrage et support')&&text.includes('Orientation')&&text.includes('pas un stock supplémentaire'));
   check('Access widths, garden contents and non-certification boundary are legible',text.includes('1,35 m minimum proposé')&&text.includes('récupérateur d’eau')&&text.includes('pas une certification réglementaire'));
   check('Source rooms are not silently marked as spawned architectures',text.includes('ne prouvent ni une présence sur la carte'));
   const count=await card.locator('.codex-source-prop161').count();await card.locator('summary').click();await card.locator('summary').click();
   check('Reopening does not duplicate room details',await card.locator('.codex-source-prop161').count()===count&&await card.locator('details section').count()===expected.rooms);
   check('Reading and reopening leaves the saved campaign unchanged',await stable()===before);
   const fits=await card.evaluate(node=>({card:node.scrollWidth<=node.clientWidth+1,document:document.documentElement.scrollWidth<=innerWidth+1}));check('Specifications do not cause horizontal overflow',fits.card&&fits.document);
   await card.locator('.codex-source-prop161').first().scrollIntoViewIfNeeded();await screenshot('furniture');
   await page.locator('#worldCodexSearch').fill('');check('Catalogue remains paginated',await page.locator('#worldCodexResults article').count()<=36);
   check('No browser errors',errors()===0);report.pass=true;
  }catch(e){report.pass=false;report.failure=e.stack;await screenshot('failure').catch(()=>{});}finally{await context.close();console.log(JSON.stringify({viewport:v.name,pass:report.pass,checks:report.checks.length,failure:report.failure?.split('\n')[0]}));}
 }
}finally{h.report.pass=h.report.profiles.length===4&&h.report.profiles.every(p=>p.pass);await h.close();await h.finish();}
if(!h.report.pass)process.exitCode=1;
