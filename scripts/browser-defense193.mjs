import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, visibleInPanel } from './browser-qa-common144.mjs';
import { defenseCampFixture, defenseServiceFixture, defenseContactFixture, defenseHeldContactDepartureFixture, defenseMechanismState } from './browser-defenses-fixtures148.mjs';

const known=[{name:'desktop',width:1366,height:768},{name:'mobile',width:390,height:844,touch:true}];
const selected=process.env.DEADWALL_QA_PROFILES?.split(','),views=known.filter(v=>!selected||selected.includes(v.name));
const harness=await createHarness('defense193','Real installation/rearm DOM buttons, ordinary RAF, real pause/save/quit/reload/Continue, desktop mouse and mobile emulated touch. Advanced scenes explicitly prepare four legal completed supports and inherited age knowledge, finite depot/bag material and one physical ordinary-health runner. No mechanism, charges, trap damage, cooldown, hold, simulation time or RNG are assigned. This is a focused prepared defender flow, not organic campaign progression, physical-device or frame-rate qualification.');
const{browser,base,report,output}=harness;report.profiles=[];
const kinds=['runnerCable193','breachClamp193','enduranceRack193','shieldTongs193','quickCable193','siegeBrake193'];
const snapshot=page=>page.evaluate(()=>({elapsed:DEADWALL.elapsed,paused:DEADWALL.paused,bag:{...DEADWALL.player.carry},stock:{...DEADWALL.resources},
 fitting:DEADWALL.fortificationPack.snapshot(),job:DEADWALL.fortificationPack.job?{kind:DEADWALL.fortificationPack.job.kind,elapsed:DEADWALL.fortificationPack.job.elapsed,seconds:DEADWALL.fortificationPack.job.seconds}:null}));
async function fortifications(page,touch){
 if(await page.locator('#commandModal').isVisible())await activate(page,'#commandTab-field',touch);else await openCommand(page,touch,'field');
 await activate(page,'#expansionFieldTab',touch);await activate(page,'#expansionGroup-defense',touch);await activate(page,'#expansionTab-fortification',touch);
}
async function resume(page,touch){if(await page.locator('#pauseMenu').isVisible())await activate(page,'#resumeButton',touch);await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);}
async function control(page,selector,check,label){
 await page.locator(selector).scrollIntoViewIfNeeded();const box=await visibleInPanel(page,selector,'.command-body');
 check(label+': actual control is visible, hit-testable and at least44px high',box.pass&&box.box.height>=44);
}
async function saveContinue(page,touch){
 const camp=await page.evaluate(()=>globalThis.__DEFENSE148_CAMP__);
 if(await page.locator('#commandModal').isVisible())await activate(page,'#commandReturn129',touch);
 if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',touch);
 await activate(page,'#saveButton',touch);
 const expected=await page.evaluate(()=>{const{timestamp,...data}=DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));return{ok:DEADWALL.lastSaveStatus.ok,data};});
 assert.ok(expected.ok,'The actual save button succeeds');
 await activate(page,'#quitButton',touch);await page.reload({waitUntil:'networkidle'});await ready(page);
 await page.evaluate(()=>{const g=DEADWALL,restore=g.restoreSave.bind(g);g.restoreSave=(...args)=>{const result=restore(...args);const{timestamp,...data}=DeadwallSave.validate(g.serialize());globalThis.__DEFENSE193_RESTORED__=data;g.togglePause(true);return result;};});
 await activate(page,'#continueButton',touch);await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.paused);
 await page.evaluate(camp=>{for(const[type,id]of Object.entries(camp))if(DEADWALL.world.buildings.get(id)?.type!==type)throw Error('Support identity changed');globalThis.__DEFENSE148_CAMP__=camp;},camp);
 return page.evaluate(expected=>{const actual=globalThis.__DEFENSE193_RESTORED__,keys=new Set([...Object.keys(expected),...Object.keys(actual||{})]),changedKeys=[...keys].filter(k=>JSON.stringify(expected[k])!==JSON.stringify(actual?.[k]));
  return{pass:!changedKeys.length,changedKeys,normalizedFields:[],fortification:DEADWALL.fortificationPack.snapshot(),expectedRNG:expected.randomState,restoredRNG:actual?.randomState};},expected.data);
}

try{
 assert.ok(views.length,'At least one known defense193 viewport is required');
 for(const view of views){
  const p={viewport:view,fixtures:[],checkpoints:[]};report.profiles.push(p);let context,page;
  try{
   context=await browser.newContext({viewport:{width:view.width,height:view.height},hasTouch:!!view.touch,isMobile:!!view.touch,serviceWorkers:'block'});
   page=await context.newPage();page.setDefaultTimeout(30000);const rec=recorder(page,p,output,view.name+'-'),check=rec.check;
   await page.goto(base,{waitUntil:'networkidle'});await ready(page);
   const startup=Date.now();page.setDefaultTimeout(120000);await chooseCampaign(page,'903148');p.newCampaignWallMs=Date.now()-startup;page.setDefaultTimeout(30000);
   await activate(page,'#campaignIntro132Skip',view.touch);
   await fortifications(page,view.touch);
   for(const kind of kinds){const button=page.locator('#expansionAction-fortification-mechanism-'+kind);check('Fresh campaign explains unavailable '+kind,await button.isDisabled());}
   check('Rapid coverage description explicitly promises zero damage',(await page.locator('#expansionAction-fortification-mechanism-quickCable193-description').innerText()).includes('Zéro dégât'));
   await activate(page,'#commandReturn129',view.touch);
   p.fixtures.push(await page.evaluate(defenseCampFixture));
   p.fixtures.push(await page.evaluate(defenseServiceFixture,{type:'spikes',bag:{wood:12,scrap:24}}));
   check('Prepared logistics respects the real unexpanded36-unit backpack',await page.evaluate(()=>DEADWALL.player.carryCapacity===36&&DeadwallCore.bagTotal(DEADWALL.player.carry)===36));
   await fortifications(page,view.touch);
   const install='#expansionAction-fortification-mechanism-runnerCable193';await control(page,install,check,'Runner cable installation');
   check('Prepared workshop and acquired age enable the real paid installation',await page.locator(install).isEnabled());await rec.screenshot('installation-price');
   const before=await snapshot(page);await activate(page,install,view.touch);await resume(page,view.touch);
   await page.waitForFunction(()=>DEADWALL.fortificationPack.job?.kind==='mechanism'&&DEADWALL.fortificationPack.job.elapsed>.25);
   await activate(page,'#pauseButton',view.touch);const paused=await snapshot(page);await page.waitForTimeout(400);const pausedLater=await snapshot(page);
   check('Real pause freezes work and keeps the whole bag before final payment',paused.job&&paused.job.elapsed===pausedLater.job?.elapsed&&JSON.stringify(paused.bag)===JSON.stringify(before.bag)&&JSON.stringify(pausedLater.bag)===JSON.stringify(before.bag));
   await resume(page,view.touch);await page.waitForFunction(()=>!DEADWALL.fortificationPack.busy(),null,{timeout:30000});await rec.screenshot('paid-mount-world');await activate(page,'#pauseButton',view.touch);
   const installed=await snapshot(page),mount=await page.evaluate(defenseMechanismState);p.installation={before,paused,after:installed,mount};
   check('Ordinary work completes eight paid runner cable charges without debiting the depot',mount.mechanism.kind==='runnerCable193'&&mount.mechanism.charges===8&&installed.bag.wood===before.bag.wood-8&&installed.bag.scrap===before.bag.scrap-16&&installed.stock.wood===before.stock.wood&&installed.stock.scrap===before.stock.scrap);
   p.fixtures.push(await page.evaluate(defenseServiceFixture,{type:'core'}));const contact=await page.evaluate(defenseContactFixture,{kind:'runner',trap:true,count:1});p.fixtures.push(contact);
   await resume(page,view.touch);await page.waitForFunction(defenseMechanismState,{id:mount.support.id,charges:7});await activate(page,'#pauseButton',view.touch);
   const fired=await page.evaluate(defenseMechanismState);p.trigger=fired;
   check('One physical runner consumes exactly one charge and receives a real finite hold',fired.mechanism.charges===7&&fired.mechanism.caught.some(c=>c.id===contact.ids[0]&&c.left>0));
   p.checkpoints.push(await saveContinue(page,view.touch));check('Real Continue preserves paid profile, missing charge, held contact and every saved field exactly',p.checkpoints.at(-1).pass);
   p.fixtures.push(await page.evaluate(defenseHeldContactDepartureFixture));await resume(page,view.touch);await page.waitForFunction(defenseMechanismState,{id:mount.support.id,heldEmpty:true});await activate(page,'#pauseButton',view.touch);
   check('Ordinary RAF releases the departed runner without spending another charge',(await page.evaluate(defenseMechanismState)).mechanism.charges===7);
   p.fixtures.push(await page.evaluate(defenseServiceFixture,{type:'spikes'}));await fortifications(page,view.touch);
   const rearm='#expansionAction-fortification-rearm-mechanism';await control(page,rearm,check,'Partial rearm');
   const quote=await page.evaluate(()=>{const q=DEADWALL.fortificationPack.previewMechanismRearm();return{ok:q.ok,amount:q.amount,cost:q.cost,seconds:q.seconds,text:DeadwallCore.resourceText(q.cost)};});
   check('Rearm button announces its true one-charge price and work time',quote.ok&&quote.amount===1&&quote.cost.wood===1&&quote.cost.scrap===2&&Math.abs(quote.seconds-1.2)<1e-7&&(await page.locator(rearm+'-description').innerText()).includes(quote.text));
   check('Accessible rearm description includes its actual price',(await page.locator(rearm).getAttribute('aria-describedby')).includes('rearm-mechanism-description'));
   await rec.screenshot('partial-rearm-price');const rearmBefore=await snapshot(page);await activate(page,rearm,view.touch);await resume(page,view.touch);
   await page.waitForFunction(()=>!DEADWALL.fortificationPack.busy(),null,{timeout:10000});await rec.screenshot('rearmed-world');await activate(page,'#pauseButton',view.touch);
   const rearmAfter=await snapshot(page),rearmed=await page.evaluate(defenseMechanismState);p.rearm={quote,before:rearmBefore,after:rearmAfter,mount:rearmed};
   check('Actual rearm completes the missing charge with one final prorated bag debit',rearmed.mechanism.charges===8&&rearmAfter.bag.wood===rearmBefore.bag.wood-1&&rearmAfter.bag.scrap===rearmBefore.bag.scrap-2&&rearmAfter.stock.wood===rearmBefore.stock.wood&&rearmAfter.stock.scrap===rearmBefore.stock.scrap);
   p.checkpoints.push(await saveContinue(page,view.touch));check('Real Continue preserves the rearmed mount and every saved field exactly',p.checkpoints.at(-1).pass);
   check('Page, console, HTTP and request error collectors are empty',rec.errors()===0);p.pass=p.checks.every(c=>c.pass);
  }catch(error){p.pass=false;p.failure=error.stack;if(page){p.failureState=await snapshot(page).catch(()=>null);await page.screenshot({path:output+'/'+view.name+'-failure.png'}).then(()=>p.screenshots?.push(view.name+'-failure.png')).catch(()=>{});}}
  finally{try{await context?.close();}catch(error){p.pass=false;p.cleanupFailure=error.stack;}}
  console.log(JSON.stringify({viewport:view.name,pass:p.pass,checks:p.checks?.length,failure:p.failure?.split('\n')[0]}));if(!p.pass)break;
 }
}finally{report.pass=report.profiles.length===views.length&&report.profiles.every(p=>p.pass);try{await harness.close();}finally{await harness.finish();}}
if(!report.pass)process.exitCode=1;
