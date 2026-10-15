import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
const h=await createHarness('plan165','Actual Atlas controls and existing lot painter; read-only recipe previews are not physical visits or 3000 completed native architectures. Touch viewports are emulated.');
h.report.profiles=[];
const stamp=page=>page.evaluate(()=>{const s=DEADWALL.serialize();delete s.timestamp;return JSON.stringify(s);});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]){
  const context=await h.browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'}),page=await context.newPage(),result={viewport};
  h.report.profiles.push(result);page.setDefaultTimeout(30000);const {check,screenshot,errors}=recorder(page,result,h.output,viewport.width+'-');
  try{
   await page.goto(h.base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page,'17117');await page.locator('#campaignIntro132Skip').click();
   await page.evaluate(()=>DEADWALL.worldCodex.open());await page.locator('#worldCodexStatus').selectOption('programme');
   await page.locator('#worldCodexSearch').fill('DW-0501');
   const card=page.locator('[data-codex-id="programme-DW-0501"]');await card.waitFor();const before=await stamp(page);
   check('No inspection canvas is created for a closed card',await card.locator('[data-codex-plan165]').count()===0);
   await card.getByText('Accès, ressources et précautions',{exact:true}).click();const host=card.locator('[data-codex-plan165]');await host.waitFor();
   check('Opening source fields adds one read-only inspector',await host.count()===1&&(await host.innerText()).includes('Lecture seule'));
   check('Opening a card alone does not generate or display a plan',!await host.locator('canvas').isVisible());
   await host.locator('input[type=number]').fill('42');await host.getByRole('button').click();await host.locator('canvas').waitFor({state:'visible'});
   const canvas=host.locator('canvas'),image=await canvas.evaluate(c=>c.toDataURL());
   check('Existing lot painter generated visible pixels',await canvas.evaluate(c=>{const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let different=0;for(let i=0;i<p.length;i+=4)if(p[i]!==40||p[i+1]!==56||p[i+2]!==46)different++;return different>1000;}));
   check('Counts disclose source objects and unplaced requests',/objets du plan/.test(await host.innerText())&&/non posés/.test(await host.innerText()));
   await host.getByRole('button').click();check('Same seed and level reproduce identical rendered pixels',image===await canvas.evaluate(c=>c.toDataURL()));
   check('Authored upper floor is selectable',await host.locator('select option[value="1"]').count()===1);
   await host.locator('select').selectOption('1');check('Selecting upstairs redraws instead of reusing the ground floor',image!==await canvas.evaluate(c=>c.toDataURL()));
   await host.locator('select').selectOption('0');check('Returning downstairs reproduces the previous image',image===await canvas.evaluate(c=>c.toDataURL()));
   await host.locator('input[type=number]').fill('17118');await host.getByRole('button').click();check('Another seed changes the recipe presentation',image!==await canvas.evaluate(c=>c.toDataURL()));
   await host.locator('input[type=number]').fill('-1');await host.getByRole('button').click();check('Invalid seed is explained with no stale visible canvas',!await canvas.isVisible()&&/Graine entière/.test(await host.innerText()));
   await host.locator('input[type=number]').fill('42');await host.getByRole('button').click();
   // Closing intentionally releases the canvas buffer. Reopening the source
   // disclosure must not regenerate a plan until the user requests it again.
   const lastValid=await canvas.evaluate(c=>c.toDataURL());
   await card.getByText('Accès, ressources et précautions',{exact:true}).click();
   // The laboratory has its own dormant canvas; wait for the recipe owner's
   // asynchronous toggle cleanup before asserting its actual buffer size.
   await page.waitForFunction(()=>{const c=document.querySelector('[data-codex-plan165="DW-0501"] > canvas');return c?.hidden&&c.width===1&&c.height===1;},null,{timeout:5000});
   check('Closing releases the hidden drawing buffer',await canvas.evaluate(c=>c.hidden&&c.width===1&&c.height===1));
   await card.getByText('Accès, ressources et précautions',{exact:true}).click();await host.waitFor();
   check('Reopening never duplicates the inspector',await card.locator('[data-codex-plan165]').count()===1);
   check('Reopening source fields leaves the plan dormant',!await canvas.isVisible()&&await canvas.evaluate(c=>c.width===1&&c.height===1));
   await host.getByRole('button',{name:'AFFICHER LE PLAN',exact:true}).click();
   await canvas.waitFor({state:'visible'});
   check('Explicit regeneration after reopening reproduces the exact plan',lastValid===await canvas.evaluate(c=>c.toDataURL()));
   await canvas.scrollIntoViewIfNeeded();await screenshot('recipe-plan');check('No horizontal document overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   check('All inspection controls leave the persisted campaign and RNG untouched',before===await stamp(page));
   await page.locator('#worldCodexSearch').fill('DW-0300');const unsupported=page.locator('[data-codex-id="programme-DW-0300"]');await unsupported.getByText('Accès, ressources et précautions',{exact:true}).click();const unavailable=unsupported.locator('[data-codex-plan165]');await unavailable.waitFor();await unavailable.getByRole('button').click();
   check('Specialized unsupported sites never receive an invented building',!await unavailable.locator('canvas').isVisible()&&/spécialisés/.test(await unavailable.innerText()));
   check('Unsupported inspection also preserves the campaign',before===await stamp(page));
   check('No browser or asset errors',errors()===0);result.pass=true;
  }catch(error){result.pass=false;result.failure=error.stack;await screenshot('failure').catch(()=>{});}
  finally{await context.close();console.log(JSON.stringify({viewport,pass:result.pass,checks:result.checks.length,failure:result.failure?.split('\n')[0]}));}
 }
}finally{h.report.pass=h.report.profiles.length===3&&h.report.profiles.every(p=>p.pass);await h.close();await h.finish();}
if(!h.report.pass)process.exitCode=1;
