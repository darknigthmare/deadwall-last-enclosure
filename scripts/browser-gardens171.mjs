import fs from 'node:fs/promises';
import path from 'node:path';
import {createHarness,recorder,ready,chooseCampaign,openCommand,activate} from './browser-qa-common144.mjs';
import {armTransaction,readTransaction} from './qa-transaction167.mjs';
const h=await createHarness('gardens171-browser','Actual DOM opt-in, exact save transaction and Continue. The depot is a declared physically clear position fixture. Recipe previews and rendered sites are prepared examples, not naturally explored locations. Mobile is emulated.');
h.report.profiles=[];
try{for(const viewport of [{width:1440,height:900},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]){
 const context=await h.browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'}),page=await context.newPage(),profile={viewport};h.report.profiles.push(profile);page.setDefaultTimeout(60000);
 const {check,screenshot,errors}=recorder(page,profile,h.output,viewport.width+'-');
 try{
  await page.goto(h.base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);await activate(page,'#pauseButton',viewport.touch);
  profile.fixture=await page.evaluate(()=>{const g=DEADWALL,p=g.fieldcraft.service(g.player,g.core());if(!p)throw Error('No depot service point');const before={x:g.player.x,y:g.player.y};g.player.x=p.x;g.player.y=p.y;g.player.navigation=null;if(!g.friendlyPositionClear(g.player,p.x,p.y))throw Error('Depot point blocked');return{before,point:p,assignedFields:['player.x','player.y','player.navigation']};});
  await openCommand(page,viewport.touch);await activate(page,'#expansionFieldTab',viewport.touch);await activate(page,'#expansionGroup-world',viewport.touch);await activate(page,'#expansionTab-world131',viewport.touch);
  const button='#expansionAction-world131-gardens171';await page.locator(button).scrollIntoViewIfNeeded();check('New authored-minimum action is available through the existing depot controller',await page.locator(button).isEnabled());
  await armTransaction(page,button);await activate(page,button,viewport.touch);profile.transaction=await readTransaction(page,9);
  check('Exactly one trusted activation changes only the revision',profile.transaction.ok&&profile.transaction.onlyRevision);
  check('Stored save contains revision 9 with all other fields intact',profile.transaction.storedOnlyRevision);
  await page.evaluate(()=>DEADWALL.worldCodex.open());
  const snapshot=()=>page.evaluate(()=>{const d=DEADWALL.serialize();delete d.timestamp;return JSON.stringify(d);});const before=await snapshot();
  const example=await page.evaluate(()=>{for(const id of ['DW-0001','DW-0002','DW-0024','DW-0046']){const p=DeadwallCodexPlan165.inspect(id,17117,0,9);if(p.details?.gardens171?.added>0)return{id,added:p.details.gardens171.added};}return null;});
  check('Chosen recipe actually contains newly placed equipment',!!example&&example.added>0);profile.example=example;
  await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill(example.id);const card=page.locator('[data-codex-id="programme-'+example.id+'"]');await card.locator(':scope > details > summary').click();
  const inspector=card.locator('[data-codex-plan165]');await inspector.waitFor();await inspector.locator('input[type=number]').fill('17117');await inspector.getByRole('button',{name:'AFFICHER LE PLAN',exact:true}).click();
  const canvas=inspector.locator('canvas');await canvas.waitFor({state:'visible'});await inspector.locator('input[data-stations170]').check();const original=await canvas.evaluate(c=>c.toDataURL());
  check('Garden composition starts unchecked',!await inspector.locator('input[data-gardens171]').isChecked());
  await inspector.locator('input[data-gardens171]').check();
  check('Opt-in preview redraws newly placed furniture using the game painter',original!==await canvas.evaluate(c=>c.toDataURL()));
  check('Inspector reports the actual count without claiming powered appliances',/équipements de jardin placés/.test(await inspector.innerText())&&/sans nouveau butin/.test(await inspector.innerText()));
  await canvas.scrollIntoViewIfNeeded();await screenshot('garden-completion');await canvas.screenshot({path:path.join(h.output,viewport.width+'-recipe.png')});
  await inspector.locator('input[data-gardens171]').uncheck();check('Unchecking gardens restores revision 8 and its exact pixels',original===await canvas.evaluate(c=>c.toDataURL()));
  check('Preview switches preserve the entire campaign and RNG',await snapshot()===before);
  check('No horizontal page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.reload({waitUntil:'networkidle'});await ready(page);await activate(page,'#continueButton',viewport.touch);await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.frontier.snapshot().detailVersion===9);
  check('Real Continue restores the saved completion revision',true);
  check('A repeated upgrade is disabled',await page.evaluate(()=>DEADWALL.worldOps131.actions().find(a=>a.id==='gardens171')?.disabled===true));
  check('No browser, console or HTTP errors',errors()===0);profile.pass=true;
 }catch(error){profile.pass=false;profile.failure=error.stack;await screenshot('failure').catch(()=>{});}finally{await context.close();console.log(JSON.stringify({viewport,pass:profile.pass,checks:profile.checks.length,failure:profile.failure?.split('\n')[0],transaction:profile.transaction,pageErrors:profile.pageErrors}));}
}}finally{h.report.pass=h.report.profiles.length===3&&h.report.profiles.every(p=>p.pass);await h.close();await h.finish();}
if(!h.report.pass)process.exitCode=1;
