import {createHarness,recorder,ready,chooseCampaign,openCommand,activate} from './browser-qa-common144.mjs';
const h=await createHarness('coverage167','Actual Codex DOM inspection. Source/model reports never modify campaign state; isolated recipe scenes are not discovered locations. Mobile views are emulated.');h.report.profiles=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]){
  const context=await h.browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'}),page=await context.newPage(),profile={viewport};h.report.profiles.push(profile);page.setDefaultTimeout(30000);
  const {check,screenshot,errors}=recorder(page,profile,h.output,viewport.width+'-');
  page.on('pageerror',error=>console.log('COVERAGE167_PAGE_ERROR '+JSON.stringify({viewport,message:error.message,stack:error.stack})));
  try{
   await page.goto(h.base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);await openCommand(page,viewport.touch,'field');await activate(page,'[data-field-view="world-codex"]',viewport.touch);
   await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill('DW-0001');
   const card=page.locator('[data-codex-id="programme-DW-0001"]'),saved=()=>page.evaluate(()=>{const d=DEADWALL.serialize();delete d.timestamp;return JSON.stringify(d);}),before=await saved();
   await card.locator(':scope > details > summary').click();const plan=card.locator('[data-codex-plan165]'),coverage=card.locator('[data-coverage167]');await coverage.waitFor();
   check('Exactly ten evidence axes accompany the original recipe inspector',await coverage.locator('dt').count()===10&&await plan.count()===1);
   check('Opening source prescriptions does not allocate a drawing buffer',await plan.locator('canvas').evaluate(c=>c.width===1&&c.height===1));
   await plan.getByRole('button',{name:'AFFICHER LE PLAN',exact:true}).click();await plan.locator('canvas').waitFor({state:'visible'});
   check('Model inspection reports exterior simplifications and missing furniture',/extérieurs encore simplifiés/.test(await coverage.innerText())&&/meubles sous le minimum source/.test(await coverage.innerText()));
   check('The actual displayed recipe is identified separately from the campaign',await coverage.getAttribute('data-scope')==='isolated-recipe-not-live-world');
   check('Pixels were rendered for the inspected recipe',await plan.locator('canvas').evaluate(c=>c.width===900&&c.height===720&&c.getContext('2d').getImageData(0,0,1,1).data[3]===255));
   profile.comparison=await page.evaluate(()=>DeadwallCodexCoverage167.compare(DeadwallCodexPlan165.inspect('DW-0001',42,0)).totals);
   await screenshot('source-model');
   for(let pass=0;pass<3;pass++){
    await card.locator(':scope > details > summary').click();await page.waitForFunction(()=>!document.querySelector('[data-codex-id="programme-DW-0001"] > details').open);await page.evaluate(()=>new Promise(requestAnimationFrame));
    check('Close '+(pass+1)+' releases the canvas buffer',await plan.locator('canvas').evaluate(c=>c.width===1&&c.height===1));
    await card.locator(':scope > details > summary').click();await coverage.waitFor();
    check('Reopen '+(pass+1)+' keeps one inspector and ten axes',await plan.count()===1&&await coverage.count()===1&&await coverage.locator('dt').count()===10);
   }
   check('All inspection operations preserve every saved field',await saved()===before);
   check('The ten-axis report fits the mobile/desktop card',await coverage.evaluate(n=>n.scrollWidth<=n.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1));
   check('No JavaScript or HTTP errors',errors()===0);profile.pass=true;
  }catch(error){profile.pass=false;profile.failure=error.stack;await screenshot('failure').catch(()=>{});}finally{
   await context.close();console.log(JSON.stringify({viewport,pass:profile.pass,checks:profile.checks.length,failure:profile.failure,pageErrors:profile.pageErrors,consoleErrors:profile.consoleErrors,httpErrors:profile.httpErrors,requestFailures:profile.requestFailures}));
  }
 }
}finally{h.report.pass=h.report.profiles.length===3&&h.report.profiles.every(p=>p.pass);await h.close();await h.finish();}
if(!h.report.pass)process.exitCode=1;
