import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHarness,recorder,ready,activate } from './browser-qa-common144.mjs';
import { loadedAssets } from './browser-qa-common142.mjs';
import { spriteCampFixture159,spriteMechanismFixture159,spriteActorFixture159,spriteContactBody159,spritePictures159 } from './browser-sprites-fixtures159.mjs';

const require=createRequire(import.meta.url),root=fileURLToPath(new URL('..',import.meta.url)),Art=require('../src/art.js');
const views=[{name:'desktop',width:1366,height:768},{name:'mobile',width:390,height:844,touch:true},{name:'mobile-landscape',width:844,height:390,touch:true}];
const selected=process.env.DEADWALL_QA_PROFILES?.split(','),profiles=selected?views.filter(v=>selected.includes(v.name)):views;
assert.ok(profiles.length,'At least one known sprite QA profile is required');
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
const runtimeFiles=[...new Set(['index.html',...Array.from(html.matchAll(/<script src="([^"]+)"/g),m=>m[1]),...Array.from(html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g),m=>m[1]),...Object.values(Art.ASSETS).map(s=>s.url)])].sort();
const digest=b=>createHash('sha256').update(b).digest('hex');
async function sourceSnapshot(){return Object.fromEntries(await Promise.all(runtimeFiles.map(async f=>[f,digest(await fs.readFile(path.join(root,f)))])));}
const beforeSource=await sourceSnapshot();
const qaFiles=['scripts/browser-sprites159.mjs','scripts/browser-sprites-fixtures159.mjs','scripts/browser-qa-common142.mjs','scripts/browser-qa-common144.mjs','scripts/server.mjs'];
const qaSnapshot=async()=>Object.fromEntries(await Promise.all(qaFiles.map(async f=>[f,digest(await fs.readFile(path.join(root,f)))])));
const beforeQA=await qaSnapshot();
const harness=await createHarness('sprites159','NATIVE: fresh G8 Standard seed903159, introduction skip and Pause/Resume controls on desktop, emulated mobile and mobile landscape. Every actual Art asset loads and its dimensions agree with the shipped declaration. EXPLICIT PREPARED SCENE: nine legal completed supports, inherited age9 knowledge, finite depot and carried recipe material, isolated starting units and physically free points. All six mechanisms are made and paid through their original timed API; installed game.update runs in bounded0.04s steps. One ordinary native spawn is positioned at a physical contact and then the same surviving contact is moved beyond mount reach; neither health, charge, cooldown, action event, radius, AI nor elapsed is assigned. Original master Game.drawBuilding and Art paint its separate native pieces; a real funded foundation and ordinary worker update generate construction events. Paused repeated paintings and Save/Reload/Continue preserve persistent fields. Offscreen Chromium Canvas gallery captures are declared prepared render evidence, separate from the actual world screenshots. No natural late-age progression, balance, endurance, physical-device, frame-rate or deployment certification.');
const{browser,base,report,output}=harness;report.profiles=[];
const material=page=>page.evaluate(()=>{const{timestamp,...saved}=DEADWALL.serialize();return JSON.stringify(saved);});
async function pause(page,touch){if(!await page.evaluate(()=>DEADWALL.paused))await activate(page,'#pauseButton',touch);await page.waitForFunction(()=>DEADWALL.paused&&DEADWALL.activeOverlay?.id==='pauseMenu');}
async function nativeCampaign(page,touch){
 if(!await page.locator('#campaignMap132').evaluate(n=>n.open))await activate(page,'#campaignMap132 > summary',touch);
 await page.locator('#mapSeed').fill('903159');
 await page.evaluate(()=>{
  const game=DEADWALL,button=document.getElementById('newGameButton'),original=game.startNew;
  const clock=globalThis.__SPRITES159_STARTUP_CLOCK__={beforeInput:performance.now(),events:[]};
  const observe=event=>{if(event.target===button||button.contains(event.target))clock.events.push({type:event.type,at:performance.now(),trusted:event.isTrusted});};
  for(const type of ['pointerdown','touchstart','click'])document.addEventListener(type,observe,true);
  const wrapped=function(...args){clock.engineStarted=performance.now();try{return original.apply(this,args);}finally{clock.engineReturned=performance.now();clock.returnedPlayingIntro=this.state==='playing'&&this.campaignIntro132.isOpen();}};
  game.startNew=wrapped;
  clock.cleanup=()=>{for(const type of ['pointerdown','touchstart','click'])document.removeEventListener(type,observe,true);if(game.startNew===wrapped)game.startNew=original;};
 });
 const start=performance.now();let actionMilliseconds,timings;
 try{
  if(touch)await page.locator('#newGameButton').tap({timeout:120000});else await page.locator('#newGameButton').click({timeout:120000});
  actionMilliseconds=performance.now()-start;
  await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.campaignIntro132.isOpen(),null,{timeout:120000});
 }finally{
  timings=await page.evaluate(()=>{const c=__SPRITES159_STARTUP_CLOCK__,observed=performance.now();c.cleanup();return{beforeInputToObservedPlayingIntroMilliseconds:observed-c.beforeInput,beforeInputToNativePlayingIntroMilliseconds:c.returnedPlayingIntro?c.engineReturned-c.beforeInput:null,nativeStartNewMilliseconds:c.engineReturned-c.engineStarted,firstInputDelayMilliseconds:c.events[0]?.at-c.beforeInput,inputEvents:c.events.map(e=>({...e,at:e.at-c.beforeInput})),returnedPlayingIntro:c.returnedPlayingIntro};});
 }
 return{milliseconds:performance.now()-start,actionMilliseconds,...timings,input:touch?'native Playwright touch tap':'native mouse click',timeoutMilliseconds:120000,note:'Observed cloud browser timings include native seed/world preparation and Playwright action latency. This is not a physical-device, responsiveness or frame-rate certification.'};
}
async function saveContinue(page,touch){
 await pause(page,touch);await activate(page,'#saveButton',touch);
 const expected=await page.evaluate(()=>{const{timestamp,...saved}=DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));return{ok:DEADWALL.lastSaveStatus.ok,material:JSON.stringify(saved)};});assert.ok(expected.ok,'Native save must succeed');
 await activate(page,'#quitButton',touch);await page.reload({waitUntil:'networkidle'});await ready(page);
 await page.evaluate(()=>{const g=DEADWALL,restore=g.restoreSave.bind(g);g.restoreSave=(...args)=>{const result=restore(...args);const{timestamp,...saved}=DeadwallSave.validate(g.serialize());globalThis.__SPRITES159_RESTORED__=JSON.stringify(saved);g.togglePause(true);return result;};});
 await activate(page,'#continueButton',touch);await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.paused);
 return page.evaluate(expected=>{const actual=__SPRITES159_RESTORED__,before=JSON.parse(expected),after=JSON.parse(actual),keys=new Set([...Object.keys(before),...Object.keys(after)]);return{pass:expected===actual,changedKeys:[...keys].filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k])),runId:after.runId,generation:after.frontier.generation,rng:after.randomState,allPersistentFieldsCompared:true};},expected.material);
}

try{
 for(const viewport of profiles){const profile={viewport,fixtures:[],mechanisms:[]};report.profiles.push(profile);let context,page;const bodies=[];const browserHashes={};
  try{
   context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'});page=await context.newPage();page.setDefaultTimeout(30000);
   const rec=recorder(page,profile,output,viewport.name+'-');
   page.on('response',response=>{const url=new URL(response.url()),baseURL=new URL(base);if(url.origin!==baseURL.origin||response.status()!==200)return;let file=decodeURIComponent(url.pathname.slice(baseURL.pathname.replace(/[^/]*$/,'').length));if(!file)file='index.html';if(!Object.hasOwn(beforeSource,file))return;bodies.push(response.body().then(b=>{browserHashes[file]=digest(b);}).catch(error=>{profile.bodyFailures||=[];profile.bodyFailures.push({file,error:String(error)});}));});
   const response=await page.goto(base,{waitUntil:'networkidle'});rec.check('Actual sprite document returns HTTP200',response?.status()===200);await ready(page);profile.assets=await loadedAssets(page,harness.assetKeys);
   const dimensions=await page.evaluate(()=>Object.entries(DeadwallArt.ASSETS).map(([id,s])=>({id,declared:[s.width,s.height],loaded:[DEADWALL.art.images[id]?.width,DEADWALL.art.images[id]?.height]})));
   rec.check('Every shipped sprite and material has its actual declared decoded dimensions',dimensions.every(d=>JSON.stringify(d.declared)===JSON.stringify(d.loaded)));profile.assetDimensions=dimensions;
   profile.nativeStartup=await nativeCampaign(page,viewport.touch);rec.check('Fresh native campaign preserves standard G8 generation and opens the introduction',await page.evaluate(()=>DEADWALL.frontier.position().generation===8&&DEADWALL.campaignIntro132.isOpen()));
   await activate(page,'#campaignIntro132Skip',viewport.touch);await pause(page,viewport.touch);const nativeBefore=await material(page);await rec.screenshot('native-fresh-d17-paused');
   await activate(page,'#resumeButton',viewport.touch);await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);await pause(page,viewport.touch);
   rec.check('Actual native Pause/Resume controls keep the commander alive and the same campaign',await page.evaluate(expected=>{const before=JSON.parse(expected);return DEADWALL.player.health>0&&DEADWALL.runId===before.runId&&DEADWALL.world.seed===before.worldSeed;},nativeBefore));
   profile.fixtures.push(await page.evaluate(spriteCampFixture159));
   for(const kind of ['ankle','blades','guideRail','ratchet','clamp','counterweight']){
    const r=await page.evaluate(spriteMechanismFixture159,kind);profile.mechanisms.push(r);
    rec.check(kind+': original timed job pays exactly its finite transported recipe once',Object.entries(r.recipe.cost).every(([key,n])=>Math.abs(r.payment.carryBefore[key]-r.payment.carryAfter[key]-n)<1e-6));
    rec.check(kind+': one native physical contact spends one actual charge and its actual damage',r.event.chargesBefore-r.event.chargesAfter===1&&Math.abs(r.event.hpBefore-r.event.hpAfter-r.recipe.damage)<1e-6);
    rec.check(kind+': real owner cooldown supplies armed, trigger and action states',r.event.trigger.phase==='trigger'&&r.event.action.phase==='action'&&r.paint.first.calls.length>0);
    rec.check(kind+': master building painter draws three separate native components and moves their transforms',r.paint.separateParts&&r.paint.partsMoved&&r.paint.unchangedOldWhole);
    rec.check(kind+': every master paint preserves the complete save and RNG',r.paint.first.materialUnchanged&&r.paint.first.rngUnchanged&&r.paint.second.materialUnchanged&&r.paint.second.rngUnchanged&&r.paint.paused.materialUnchanged&&r.paint.paused.rngUnchanged);
    rec.check(kind+': repeated Pause paint preserves the exact native mechanical picture',r.paint.pauseIdentical);
   }
   profile.actor=await page.evaluate(spriteActorFixture159);const a=profile.actor;
   rec.check('A real native worker advances an actually funded physical foundation before any body action',a.progressAfter>a.progressBefore&&a.firstPose?.action==='build'&&a.secondPose?.action==='build');
   rec.check('The actual body uses its separate construction sheet and changes pixels between normal steps',a.paint.usesActionSheet&&a.paint.first.hash!==a.paint.second.hash);
   rec.check('Worker action picture freezes during Pause and its master paintings preserve every saved field',a.paint.pauseIdentical&&a.paint.first.materialUnchanged&&a.paint.second.materialUnchanged&&a.paint.first.rngUnchanged&&a.paint.second.rngUnchanged);
   profile.contactBody=await page.evaluate(spriteContactBody159);const body=profile.contactBody;
   rec.check('A visible real contact hurts the live commander before its own attack action exists',body.physicallyVisible&&body.playerAfter<body.playerBefore&&body.firstPose?.action==='attack'&&body.secondPose?.action==='attack');
   rec.check('Actual infected attack uses its dedicated native body sheet and advances pixels through normal simulation',body.paint.usesActionSheet&&body.paint.first.hash!==body.paint.second.hash);
   rec.check('Actual infected body freezes in Pause without changing the saved world or RNG by drawing',body.paint.pauseIdentical&&body.paint.first.materialUnchanged&&body.paint.second.materialUnchanged&&body.paint.first.rngUnchanged&&body.paint.second.rngUnchanged);
   const oldActions=await page.evaluate(()=>({harvest:DEADWALL.art.actionFrames133.heroHarvest133?.length,actions:DEADWALL.art.actionFrames133.heroActions133?.length,held:DEADWALL.arsenal134.visualEquipment(),paint:__SPRITES159__.capture('Commandant • équipement réellement détenu',DEADWALL.player,'player')}));
   delete oldActions.paint.rawData;profile.commander=oldActions;
   rec.check('All64 original commander work/action poses remain available beside the new parts',oldActions.harvest===32&&oldActions.actions===32);
   rec.check('Actual equipped commander paints its real native held model without changing material or RNG',oldActions.held?.category==='firearm'&&oldActions.paint.calls.some(c=>/^art159EquipmentHeld/.test(c.atlas))&&oldActions.paint.materialUnchanged&&oldActions.paint.rngUnchanged);
   const pictures=await page.evaluate(spritePictures159),file=viewport.name+'-prepared-native-owner-gallery.png';await fs.writeFile(path.join(output,file),Buffer.from(pictures.data.split(',')[1],'base64'));profile.preparedCanvasGallery={file,count:pictures.count,names:pictures.names,scope:'Prepared offscreen Chromium Canvas pictures through unchanged master native owners; not an organic campaign or product UI screenshot.'};
   await page.evaluate(()=>{const g=DEADWALL;g.camera.x=g.player.x;g.camera.y=g.player.y;g.render();});await rec.screenshot('prepared-actual-world');profile.checkpoint=await saveContinue(page,viewport.touch);
   rec.check('Actual Save/Reload/Continue preserves every persistent field, finite charge and material exactly',profile.checkpoint.pass&&profile.checkpoint.generation===8);
   rec.check('Continue invents no transient body action before an actual new simulation event',await page.evaluate(()=>DEADWALL.units.every(u=>DEADWALL.actorActionPresentation159(u)===null)));
   await Promise.all(bodies);const observed=Object.keys(browserHashes),mismatch=observed.filter(f=>browserHashes[f]!==beforeSource[f]),missing=runtimeFiles.filter(f=>!Object.hasOwn(browserHashes,f));profile.sourceBinding={observedFiles:observed.length,expectedFiles:runtimeFiles.length,mismatch,missing,browserHashes};
   rec.check('Actual browser responses match every current shipped runtime and art source byte',mismatch.length===0&&missing.length===0&&!profile.bodyFailures?.length);
   rec.check('All page, console, HTTP and request collectors remain empty',rec.errors()===0);profile.pass=profile.checks.every(c=>c.pass);
  }catch(error){profile.pass=false;profile.failure=error.stack;if(page){profile.failureState=await page.evaluate(()=>({state:DEADWALL?.state,paused:DEADWALL?.paused,overlay:DEADWALL?.activeOverlay?.id,elapsed:DEADWALL?.elapsed,seed:DEADWALL?.world?.seed,job:DEADWALL?.fortificationPack?.job?{kind:DEADWALL.fortificationPack.job.kind,elapsed:DEADWALL.fortificationPack.job.elapsed}:null})).catch(()=>null);await page.screenshot({path:path.join(output,viewport.name+'-failure.png')}).then(()=>profile.screenshots.push(viewport.name+'-failure.png')).catch(()=>{});}}
  finally{await context?.close();}console.log(JSON.stringify({profile:viewport.name,pass:profile.pass,checks:profile.checks?.length,failure:profile.failure?.split('\n')[0]}));if(!profile.pass)break;
 }
}finally{const afterSource=await sourceSnapshot(),afterQA=await qaSnapshot(),changedFiles=[...runtimeFiles.filter(f=>beforeSource[f]!==afterSource[f]),...qaFiles.filter(f=>beforeQA[f]!==afterQA[f])];report.sourceBinding={before:beforeSource,after:afterSource,qaBefore:beforeQA,qaAfter:afterQA,changedFiles};report.pass=changedFiles.length===0&&report.profiles.length===profiles.length&&report.profiles.every(p=>p.pass);try{await harness.close();}finally{await harness.finish();}}
if(!report.pass)process.exitCode=1;
