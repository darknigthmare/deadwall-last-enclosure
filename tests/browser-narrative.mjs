// Prepared QA runner. Do not run until the standalone browser has been approved.
// DEADWALL_QA_BROWSER_APPROVED=1 is an execution guard, not a substitute for user approval.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

if(process.env.DEADWALL_QA_BROWSER_APPROVED!=='1')throw new Error('Browser QA not started: obtain approval, then set DEADWALL_QA_BROWSER_APPROVED=1.');
const require=createRequire(import.meta.url),{chromium}=require(process.env.DEADWALL_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)),base=process.env.DEADWALL_QA_URL||'http://127.0.0.1:4322';
const label=(process.env.DEADWALL_QA_LABEL||'narrative-'+new Date().toISOString()).replace(/[^a-zA-Z0-9_-]/g,'_'),output=path.join(process.env.DEADWALL_QA_OUTPUT_ROOT||path.join(root,'artifacts'),'narrative-qa',label);
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.DEADWALL_CHROMIUM||undefined,headless:true});
const variants=[{name:'desktop',width:1440,height:900},{name:'laptop',width:1280,height:720},{name:'mobile',width:390,height:844,touch:true},{name:'small-mobile',width:320,height:640,touch:true},{name:'tablet',width:1024,height:768,touch:true},{name:'landscape',width:844,height:390,touch:true}],reports=[];
const ready=()=>globalThis.DEADWALL?.narrativeUI&&globalThis.DeadwallNarrative&&DEADWALL.art?.diagnostics.ready.length===Object.keys(DeadwallArt.ASSETS).length&&!DEADWALL.art.diagnostics.failed.length;
for(const variant of variants){
  const context=await browser.newContext({viewport:{width:variant.width,height:variant.height},hasTouch:!!variant.touch,isMobile:!!variant.touch,deviceScaleFactor:1});
  const page=await context.newPage(),report={viewport:variant,checks:[],errors:[],httpErrors:[],dialogs:[],screenshots:[],fixtures:[]};reports.push(report);let expectedDialog=false;
  page.setDefaultTimeout(16000);
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)report.httpErrors.push({status:response.status(),url:response.url()});});
  page.on('dialog',async dialog=>{report.dialogs.push({type:dialog.type(),message:dialog.message(),expected:expectedDialog});if(!expectedDialog)report.errors.push('Unexpected dialog: '+dialog.message());await dialog.dismiss();});
  const check=(name,value=true)=>{assert.ok(value,name);report.checks.push(name);};
  const shot=async name=>{const filename=variant.name+'-'+name+'.png';await page.screenshot({path:path.join(output,filename)});report.screenshots.push(filename);};
  const card=theme=>page.locator('[data-narrative-sector="'+theme+'"]'),choice=(theme,key)=>page.locator('[data-narrative-theme="'+theme+'"][data-narrative-choice="'+key+'"]');
  const expand=async theme=>{if(!await card(theme).evaluate(node=>node.open))await card(theme).locator('summary').click();};
  const fits=async()=>page.locator('.command-post').evaluate(node=>{const bounds=node.getBoundingClientRect(),body=node.querySelector('.command-body');return bounds.x>=-1&&bounds.y>=-1&&bounds.right<=innerWidth+1&&bounds.bottom<=innerHeight+1&&node.scrollWidth<=node.clientWidth+1&&body.scrollWidth<=body.clientWidth+1&&[...node.querySelectorAll('#commandPanel-journal details,#commandPanel-journal article')].filter(item=>item.getClientRects().length).every(item=>item.scrollWidth<=item.clientWidth+1);});
  const focusContained=async()=>{for(let i=0;i<18;i++){await page.keyboard.press('Tab');const focus=await page.evaluate(()=>({contained:Boolean(document.activeElement.closest('#commandModal'))&&!document.activeElement.closest('[inert],.hidden'),active:document.activeElement.outerHTML.slice(0,500),overlay:DEADWALL.activeOverlay?.id,candidates:DEADWALL.overlayFocusable(DEADWALL.activeOverlay).map(node=>({tag:node.tagName,id:node.id,text:node.textContent.slice(0,50)}))}));assert.equal(focus.contained,true,'Focus left the active command modal at Tab '+i+': '+JSON.stringify(focus));}};
  try{
    const response=await page.goto(base,{waitUntil:'networkidle'});check('document public HTTP 200',response.status()===200);await page.waitForFunction(ready);
    check('campagne unique, export et perte du centre expliqués au menu',await page.locator('#campaignSaveNote').innerText().then(text=>text.includes('sans cloud')&&text.includes('JSON')&&text.includes('destruction du centre')));await shot('menu-campagne-unique');
    await page.locator('#menuRecordsButton').click();await page.locator('#commandTab-journal').click();
    check('journal consultable au menu sans créer de campagne',await page.evaluate(()=>DEADWALL.state==='menu'&&!localStorage.getItem(DeadwallCore.SAVE_KEY)));
    check('six opérations fermées et un chapitre introductif',await page.locator('[data-narrative-sector]').count()===6&&await page.locator('[data-narrative-sector][open]').count()===0&&await page.locator('[data-narrative-chapter]:visible').count()===1);
    await expand('housing');check('menu sans relevé révélé ni récompense accessible',!await card('housing').locator('blockquote').isVisible()&&await choice('housing','A').isDisabled()&&await page.locator('#narrativeReadAll').isDisabled());
    check('journal initial sans débordement',await fits());await focusContained();check('focus et opérations repliables restent dans la modale');await page.locator('.command-body').evaluate(node=>{node.scrollTop=0;});await shot('journal-vierge');
    await page.locator('#commandTab-journal').focus();await page.keyboard.press('ArrowRight');check('navigation clavier respecte les onglets disponibles au menu',await page.locator('#commandTab-records').getAttribute('aria-selected')==='true');
    await page.keyboard.press('Escape');check('retour focus archives',await page.evaluate(()=>document.activeElement.id==='menuRecordsButton'));
    await page.locator('#mapSeed').fill('17117');await page.locator('#newGameButton').click();await page.waitForFunction(()=>DEADWALL.state==='playing');
    check('nouveau jeu ne révèle aucun secteur',await page.evaluate(()=>DeadwallNarrative.status(DEADWALL.narrative).observed===0));
    // Only the approach is a fixture. The first survey advances through held E and real animation frames.
    report.fixtures.push(await page.evaluate(()=>{const g=DEADWALL,site=g.world.sites.find(item=>item.theme==='housing'),excluded=[];g.player.x=site.x;g.player.y=site.y;g.camera.x=site.x;g.camera.y=site.y;g.phaseTime=999;g.cancelPlacement();g.releaseInputs();for(const node of g.world.nodes)if(DeadwallCore.dist(node,site)<100){node.depleted=true;excluded.push(node.id);}return{kind:'survey-position',theme:site.theme,x:site.x,y:site.y,excludedNearbyResourceNodes:excluded,phaseTimeFixture:999,note:'Approche et suppression locale des interactions concurrentes préparées, pas un trajet naturel ni une mesure d’équilibre.'};}));
    await page.locator('#game').focus();const surveyStarted=Date.now();await page.keyboard.down('KeyE');
    await page.waitForFunction(()=>DEADWALL.narrative.sectors.housing.survey>=2);
    check('vrai maintien E produit un relevé partiel',await page.evaluate(()=>DEADWALL.input.keys.has('KeyE')&&DEADWALL.narrative.sectors.housing.survey>0&&DEADWALL.narrative.sectors.housing.survey<8));await shot('releve-maintien-e');
    await page.waitForFunction(()=>DEADWALL.narrative.sectors.housing.survey===8);await page.keyboard.up('KeyE');report.surveyWallMilliseconds=Date.now()-surveyStarted;
    check('huit secondes actives cumulées sans avancer par script',report.surveyWallMilliseconds>=7900&&await page.evaluate(()=>DEADWALL.narrative.sectors.housing.survey===8&&!DEADWALL.input.keys.has('KeyE')));
    await page.locator('#journalCommandButton').click();await expand('housing');check('trace visible mais décision refusée loin du dépôt',await card('housing').locator('blockquote').isVisible()&&await choice('housing','A').isDisabled()&&await card('housing').innerText().then(text=>text.includes('Retournez près du centre')));await shot('trace-retour-requis');
    const still=await page.evaluate(()=>({elapsed:DEADWALL.elapsed,survey:DEADWALL.narrative.sectors.market.survey}));await page.waitForTimeout(250);
    check('journal suspend réellement la simulation et les relevés',await page.evaluate(snapshot=>DEADWALL.paused&&DEADWALL.elapsed===snapshot.elapsed&&DEADWALL.narrative.sectors.market.survey===snapshot.survey,still));
    const markerPosition=await page.evaluate(()=>({x:DEADWALL.player.x,y:DEADWALL.player.y}));await page.locator('[data-narrative-mark="housing"]').click();
    check('marquage narratif ne déplace personne',await page.evaluate(position=>DEADWALL.fieldMarker===DEADWALL.world.sites.find(site=>site.theme==='housing').id&&DEADWALL.player.x===position.x&&DEADWALL.player.y===position.y,markerPosition));
    // The return to the depot is a second explicit fixture; the decision uses its real UI and backend.
    await page.evaluate(()=>{const g=DEADWALL;g.player.x=g.core().x;g.player.y=g.core().y;g.resources.scrap=0;g.narrativeUI.refresh();});report.fixtures.push({kind:'return-to-depot-and-empty-scrap',note:'Position ramenée au dépôt et ferraille fixée à zéro pour exercer le refus.'});
    check('réserves insuffisantes expliquées par choix',await choice('housing','A').isDisabled()&&await choice('housing','A').evaluate(button=>document.getElementById(button.getAttribute('aria-describedby')).textContent.includes('Réserves insuffisantes')));await choice('housing','A').locator('..').evaluate(node=>node.scrollIntoView({block:'start'}));await shot('cout-refuse');
    await page.evaluate(()=>{DEADWALL.resources.scrap=60;DEADWALL.narrativeUI.refresh();});const before=await page.evaluate(()=>({resources:{...DEADWALL.resources},insight:DEADWALL.research.insight}));await choice('housing','A').click();
    check('décision réelle coûte exactement et donne une seule récompense',await page.evaluate(snapshot=>{const g=DEADWALL,option=DeadwallNarrative.SECTORS.find(item=>item.id==='housing').choices.A;return g.narrative.sectors.housing.choice==='A'&&g.research.insight===snapshot.insight+1&&DeadwallCore.RESOURCE_KEYS.every(key=>g.resources[key]===snapshot.resources[key]-(option.cost[key]||0));},before));
    check('choix consigné annoncé et focus revenu au dossier',await page.locator('#commandStatus').innerText().then(text=>text.includes('Décision consignée'))&&await page.evaluate(()=>document.activeElement.matches('[data-narrative-sector="housing"]>summary')));
    const stable=await page.evaluate(()=>JSON.stringify({resources:DEADWALL.resources,insight:DEADWALL.research.insight}));await page.locator('#narrativeReadAll').click();
    check('lecture ne modifie aucun coût ni récompense',await page.evaluate(snapshot=>JSON.stringify({resources:DEADWALL.resources,insight:DEADWALL.research.insight})===snapshot&&DEADWALL.narrative.unread.length===0,stable));check('lecture restaure le focus à l’onglet',await page.evaluate(()=>document.activeElement.id==='commandTab-journal'));
    await expand('housing');check('journal résolu sans débordement',await fits());await focusContained();check('focus maintenu après résolution');await shot('decision-consignee');
    const runId=await page.evaluate(()=>DEADWALL.runId);await page.reload({waitUntil:'networkidle'});await page.waitForFunction(ready);await page.locator('#continueButton').click();await page.locator('#journalCommandButton').click();
    check('reprise conserve relevé, décision et lecture sans nouvelle récompense',await page.evaluate(({runId,insight})=>DEADWALL.runId===runId&&DEADWALL.narrative.sectors.housing.survey===8&&DEADWALL.narrative.sectors.housing.choice==='A'&&DEADWALL.narrative.unread.length===0&&DEADWALL.research.insight===insight,{runId,insight:before.insight+1}));
    await page.evaluate(()=>{DEADWALL.activeCrisis={id:'blackout',wave:3,status:'pending',remaining:20,targetId:0,choice:null};DEADWALL.commandUI.refresh();});report.fixtures.push({kind:'pending-blackout',remaining:20});await page.locator('#commandTab-enclosure').click();
    check('crise visible et décidable dans le commandement suspendu',await page.locator('#commandCrisisB').isEnabled()&&await page.locator('#commandCrisisTimer').innerText().then(text=>text.includes('Décision suspendue')));const crisisTime=await page.evaluate(()=>DEADWALL.activeCrisis.remaining);await page.waitForTimeout(200);check('minuterie crise reste suspendue',await page.evaluate(time=>DEADWALL.activeCrisis.remaining===time,crisisTime));await page.locator('#commandCrisisB').scrollIntoViewIfNeeded();await shot('crise-au-commandement');
    await page.locator('#commandCrisisB').click();check('vrai arbitrage crise et annonce confirmés',await page.evaluate(()=>DEADWALL.activeCrisis.choice==='B'&&DEADWALL.activeCrisis.status==='resolved'&&DEADWALL.activeCrisis.remaining===60&&document.activeElement.id==='commandTab-enclosure'));await shot('crise-resolue');
    // Desktop-only integration fixture exercises the other five surveys and all four chapters.
    // These fixed steps do not represent five natural journeys or three naturally survived waves.
    if(!variant.touch&&variant.name==='desktop'){
      await page.keyboard.press('Escape');
      report.fixtures.push(await page.evaluate(()=>{const g=DEADWALL,visited=[];for(const sector of DeadwallNarrative.SECTORS){if(sector.id==='housing')continue;const site=g.world.sites.find(item=>item.theme===sector.id);g.player.x=site.x;g.player.y=site.y;g.input.keys.add('KeyE');for(let tick=0;tick<200;tick++)g.updateNarrativeSurvey(.04);g.input.keys.delete('KeyE');visited.push({theme:sector.id,survey:g.narrative.sectors[sector.id].survey});}g.player.x=g.core().x;g.player.y=g.core().y;for(const key of DeadwallCore.RESOURCE_KEYS)g.resources[key]=200;g.objectiveIndex=3;g.stats.wavesSurvived=3;g.updateNarrative();return{kind:'scripted-surveys-and-chapter-milestones',visited,objectiveIndex:3,wavesSurvivedFixture:3,note:'Simulation manuelle à pas fixes et positions préparées ; aucune preuve de parcours naturel ou de longue survie.'};}));
      await page.locator('#journalCommandButton').click();
      for(const theme of ['market','aid','industry','transit','checkpoint']){await expand(theme);await choice(theme,'A').click();}
      check('six opérations et quatre chapitres conclus via fixture explicitée',await page.evaluate(()=>DeadwallNarrative.status(DEADWALL.narrative).resolved===6&&DEADWALL.narrative.chapters.length===4&&!DEADWALL.gameOver));
      await page.locator('.command-body').evaluate(node=>{node.scrollTop=0;});await shot('reseau-six-decisions-fixture');
    }
    await page.keyboard.press('Escape');await page.locator('#pauseButton').click();await page.locator('#pauseSettingsButton').click();await page.locator('#settingsContrast').check();await page.locator('#settingsMotion').check();await page.keyboard.press('Escape');await page.locator('#pauseCommandButton').click();await page.locator('#commandTab-journal').click();
    check('contraste et mouvement réduit appliqués aux vraies options',await page.evaluate(()=>DEADWALL.settings.highContrast&&DEADWALL.settings.reducedMotion&&document.body.classList.contains('high-contrast')&&getComputedStyle(document.querySelector('.narrative-chapter p')).color==='rgb(226, 232, 220)'));
    check('journal en contraste élevé sans débordement',await fits());await focusContained();check('focus journal avec contraste élevé');await page.locator('.command-body').evaluate(node=>{node.scrollTop=0;});await shot('journal-contraste');
    await page.keyboard.press('Escape');await page.locator('#quitButton').click();check('retour au menu conserve une campagne continuable',await page.locator('#continueButton').isEnabled());
    const preserved=await page.evaluate(()=>({world:DEADWALL.world.seed,runId:DEADWALL.runId,resources:JSON.stringify(DEADWALL.resources),save:localStorage.getItem(DeadwallCore.SAVE_KEY)}));expectedDialog=true;
    const dismissed=page.waitForEvent('dialog');await page.locator('#newGameButton').click();const dialog=await dismissed;expectedDialog=false;
    check('nouvelle campagne présente une confirmation annulable',dialog.type()==='confirm'&&report.dialogs.at(-1).expected);
    check('annuler préserve monde, réserves et sauvegarde exacte',await page.evaluate(snapshot=>DEADWALL.state==='menu'&&DEADWALL.world.seed===snapshot.world&&DEADWALL.runId===snapshot.runId&&JSON.stringify(DEADWALL.resources)===snapshot.resources&&localStorage.getItem(DeadwallCore.SAVE_KEY)===snapshot.save,preserved));await shot('nouvelle-partie-annulee');
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
    const required=['src/narrative.js','src/narrative-ui.js','narrative.css','src/save.js','src/command-ui.js','assets/infected-expansion-atlas.webp','assets/specialists-atlas.webp','assets/district-props-atlas.webp'];
    await page.waitForFunction(async files=>{const cache=await caches.open('deadwall-v1.0.0-r12');return(await Promise.all(files.map(file=>cache.match(new URL(file,location.href).href)))).every(Boolean);},required);check('cache r12 contient récit, sauvegarde, commandement et atlas');
    await context.setOffline(true);await page.reload({waitUntil:'load'});await page.waitForFunction(ready);await page.locator('#continueButton').click();await page.locator('#journalCommandButton').click();
    check('reprise hors ligne conserve la décision et les modules du journal',await page.evaluate(()=>DEADWALL.narrative.sectors.housing.choice==='A'&&DEADWALL.narrative.sectors.housing.survey===8&&Boolean(DEADWALL.narrativeUI)));
    check('journal hors ligne sans débordement',await fits());await shot('journal-hors-ligne');await context.setOffline(false);
    check('aucune erreur runtime, console ou HTTP',report.errors.length===0&&report.httpErrors.length===0);report.pass=true;
  }catch(error){report.pass=false;report.failure=error.stack;await shot('failure').catch(()=>{});console.error(variant.name+': '+error.message);}
  finally{await context.close();}
}
await browser.close();
await fs.writeFile(path.join(output,'report.json'),JSON.stringify({date:new Date().toISOString(),base,label,scope:'Six contextes vierges. Premier relevé : E maintenu pendant huit secondes réelles après fixture de position et suppression des ressources concurrentes proches ; retour au dépôt préparé. Autres cinq relevés sur desktop : pas de simulation manuels, positions et progression de chapitres préparées. UI, paiements, reprise, annulation et hors ligne exercés réellement. Aucune revendication de parcours naturel, de longue partie, de performance ou d’audit visuel humain fondée uniquement sur ces captures.',reports},null,2));
console.log(JSON.stringify(reports.map(({viewport,checks,errors,httpErrors,pass,failure})=>({viewport,checks:checks.length,errors,httpErrors,pass,failure:failure?.split('\n')[0]})),null,2));
if(reports.some(report=>!report.pass))process.exitCode=1;
