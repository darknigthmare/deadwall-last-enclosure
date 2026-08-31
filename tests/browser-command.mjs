import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.DEADWALL_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)),base=process.env.DEADWALL_QA_URL||'http://127.0.0.1:4322';
const output=path.join(root,'artifacts','command-qa',process.env.DEADWALL_QA_LABEL||'local');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.DEADWALL_CHROMIUM||undefined,headless:true});
const reports=[];
for(const variant of [{name:'desktop',width:1440,height:900},{name:'laptop',width:1280,height:720},{name:'mobile',width:390,height:844,touch:true},{name:'small-mobile',width:320,height:640,touch:true},{name:'tablet',width:1024,height:768,touch:true},{name:'landscape',width:844,height:390,touch:true}]){
  const context=await browser.newContext({viewport:variant,hasTouch:!!variant.touch,isMobile:!!variant.touch,deviceScaleFactor:1});
  const page=await context.newPage(),report={viewport:variant,checks:[],errors:[]};reports.push(report);
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')report.errors.push(msg.text());});
  const check=(name,value=true)=>{assert.ok(value,name);report.checks.push(name);};
  const shot=async name=>{await page.waitForTimeout(200);return page.screenshot({path:path.join(output,variant.name+'-'+name+'.png')});};
  const fits=async()=>page.locator('.command-post').evaluate(node=>{const b=node.getBoundingClientRect();return b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1&&node.scrollWidth<=node.clientWidth+1&&node.querySelector('.command-body').scrollWidth<=node.querySelector('.command-body').clientWidth+1;});
  try{
    await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>DEADWALL?.showCommand&&DEADWALL.art?.diagnostics.ready.length===7);
    await page.locator('#menuRecordsButton').click();check('archives vierges et commandes de campagne verrouillées',await page.locator('#commandTab-enclosure').isDisabled());
    check('archives dans le viewport',await fits());await shot('archives-vierges');await page.keyboard.press('Escape');
    check('focus rendu au bouton archives',await page.evaluate(()=>document.activeElement.id==='menuRecordsButton'));
    await page.locator('#mapSeed').fill('invalide');await page.locator('#newGameButton').click();
    check('graine invalide ne démarre pas une campagne',await page.evaluate(()=>DEADWALL.state==='menu'));
    await page.locator('#mapSeed').fill('17117');await page.locator('#newGameButton').click();
    await page.waitForFunction(()=>DEADWALL.state==='playing');
    check('carte demandée et identité persistée',await page.evaluate(()=>DEADWALL.world.seed===17117&&JSON.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)).runId===DEADWALL.runId));
    await page.locator('#cityCommandButton').click();
    check('ouverture suspend la simulation et rend le HUD inerte',await page.evaluate(()=>DEADWALL.paused&&DEADWALL.activeOverlay.id==='commandModal'&&document.getElementById('hud').inert));
    const elapsed=await page.evaluate(()=>DEADWALL.elapsed);await page.waitForTimeout(150);
    check('temps de vague réellement arrêté',await page.evaluate(time=>DEADWALL.elapsed===time,elapsed));
    check('poste tactique dans le viewport',await fits());await shot('perimetre-initial');
    for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('#commandModal'))),true);}
    check('focus contenu dans la modale');
    await page.locator('#commandTab-enclosure').focus();await page.keyboard.press('ArrowRight');
    check('onglets accessibles aux flèches',await page.locator('#commandTab-workers').getAttribute('aria-selected')==='true');
    await page.locator('[data-worker-order="clear"]').click();
    check('déblaiement réellement affecté et sauvegardé',await page.evaluate(()=>DEADWALL.workerOrder==='clear'&&JSON.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)).workerOrder==='clear'));
    await page.locator('[data-worker-order="retreat"]').click();check('ordre repli',await page.evaluate(()=>DEADWALL.workerOrder==='retreat'));
    await page.locator('[data-worker-order="auto"]').click();await shot('ouvriers');
    await page.locator('#commandTab-research').click();check('six doctrines présentées',await page.locator('[data-research-id]').count()===6);
    check('doctrines est le seul onglet sélectionné',await page.locator('.command-tabs [aria-selected="true"]').count()===1&&await page.locator('#commandTab-research').getAttribute('aria-selected')==='true');
    check('achat impossible sans insight',await page.locator('[data-research-buy="logistics"]').isDisabled());
    await page.evaluate(()=>{DEADWALL.research.insight=6;for(const key of DeadwallCore.RESOURCE_KEYS)DEADWALL.resources[key]=400;DEADWALL.updateUI();});
    await page.locator('[data-research-buy="logistics"]').click();
    check('achat explicite payé une fois',await page.evaluate(()=>DEADWALL.hasResearch('logistics')&&DEADWALL.research.insight===5&&DEADWALL.resources.scrap===355&&DEADWALL.resources.food===375));
    check('doctrine achetée indisponible au rachat',await page.locator('[data-research-buy="logistics"]').isDisabled());
    await shot('doctrines');await page.keyboard.press('Escape');
    check('fermeture reprend le jeu',await page.evaluate(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay));
    await page.locator('#pauseButton').click();await page.locator('#pauseCommandButton').click();await page.keyboard.press('Escape');
    check('fermeture depuis pause conserve la pause',await page.evaluate(()=>DEADWALL.paused&&DEADWALL.activeOverlay.id==='pauseMenu'));
    await page.locator('#resumeButton').click();await page.locator('#cityCommandButton').click();
    await page.evaluate(()=>{
      const g=DEADWALL,B=g.core().constructor;
      const add=(type,x,y,rot=0)=>{const b=new B(g.nextId++,type,x,y,rot,1);g.world.add(b);return b;};
      for(let x=57;x<=72;x++){if(x!==64&&x!==65)add('woodWall',x,57);add('woodWall',x,72);}
      for(let y=58;y<72;y++){add('woodWall',57,y);add('woodWall',72,y);}
      const gate=add('gate',64,57);g.qaGateId=gate.id;
      g.player.x=g.core().x;g.player.y=g.core().y;g.workerOrder='retreat';
      g.refreshMetrics(true);g.updateUI();
    });
    await page.locator('#commandTab-enclosure').click();
    check('enceinte réellement fermée reconnue',await page.locator('#perimeterResult').innerText()==='CENTRE CEINTURÉ');
    await page.locator('#gateMode-open').click();
    check('ouverture crée une exposition réelle',await page.evaluate(()=>!DEADWALL.getEnclosureStatus().enclosed));
    await page.evaluate(()=>{const g=DEADWALL,b=g.world.buildings.get(g.qaGateId);g.player.x=b.x;g.player.y=b.y;});
    await page.locator('#gateMode-closed').click();
    check('verrouillage occupé refusé et expliqué',await page.evaluate(()=>DEADWALL.world.buildings.get(DEADWALL.qaGateId).gateMode==='open'&&document.getElementById('commandStatus').textContent.includes('refusé')));
    await page.evaluate(()=>{DEADWALL.player.x=DEADWALL.core().x;DEADWALL.player.y=DEADWALL.core().y;});
    await page.locator('#gateMode-closed').click();
    check('verrouillage libre sauvegardé et referme enceinte',await page.evaluate(()=>DEADWALL.getEnclosureStatus().enclosed&&JSON.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)).buildings.find(b=>b.id===DEADWALL.qaGateId).gateMode==='closed'));
    await shot('enceinte-fermee');await page.locator('#gateMode-auto').click();
    await page.evaluate(()=>{const g=DEADWALL,b=g.world.buildings.get(g.qaGateId);g.camera.x=b.x;g.camera.y=b.y+40;g.camera.zoom=1.65;g.dayClock=.5;g.render();});
    await page.keyboard.press('Escape');await page.locator('#pauseButton').click();await shot('porte-auto');
    await page.locator('#pauseCommandButton').click();await page.locator('#gateMode-open').click();await page.keyboard.press('Escape');await shot('porte-ouverte');
    await page.locator('#pauseCommandButton').click();await page.locator('#gateMode-closed').click();
    await page.locator('#commandTab-records').click();
    check('une campagne sans duplication après sauvegardes',await page.locator('.campaign-row').count()===1);
    await shot('archives');await page.keyboard.press('Escape');await page.locator('#quitButton').click();
    await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>DEADWALL?.showCommand);
    await page.locator('#menuRecordsButton').click();check('records survivent au redémarrage',await page.locator('.campaign-row').count()===1);
    await page.locator('.campaign-row button').click();check('réutilisation remplit la graine sans commencer',await page.evaluate(()=>document.getElementById('mapSeed').value==='17117'&&DEADWALL.state==='menu'));
    await page.locator('#continueButton').click();
    check('reprise conserve doctrine, ordre et portes',await page.evaluate(()=>DEADWALL.hasResearch('logistics')&&DEADWALL.workerOrder==='retreat'&&[...DEADWALL.world.buildings.values()].some(b=>b.def.gate&&b.gateMode==='closed')));
    await page.locator('#cityCommandButton').click();await page.locator('#commandTab-workers').click();
    check('confort réduit et contraste ne cassent pas le poste',await page.evaluate(()=>{document.body.classList.add('reduced-motion','high-contrast');return document.querySelector('.command-post').scrollWidth<=document.querySelector('.command-post').clientWidth;}));await shot('contraste');
    check('aucune erreur runtime/console',report.errors.length===0);
    await page.keyboard.press('Escape');await page.locator('#pauseButton').click();await page.locator('#quitButton').click();
    if(variant.name==='desktop'){
      await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
      await page.waitForFunction(async()=>{const cache=await caches.open('deadwall-v1.0.0-r7');return !!(await cache.match(new URL('src/command-ui.js',location.href).href));});
      await context.setOffline(true);await page.reload({waitUntil:'load'});await page.waitForFunction(()=>DEADWALL?.showCommand&&DEADWALL.art?.diagnostics.ready.length===7);
      await page.locator('#menuRecordsButton').click();check('poste et archives hors ligne',await page.locator('.campaign-row').count()===1);
      await context.setOffline(false);
    }
    report.pass=true;
  }catch(error){report.pass=false;report.failure=error.stack;await shot('failure').catch(()=>{});}
  finally{await context.close();}
}
await browser.close();
await fs.writeFile(path.join(output,'report.json'),JSON.stringify({date:new Date().toISOString(),base,fixture:'Nouvelles parties isolées. Insight/réserves et enceinte ajoutés pour exercer les commandes ; pas une preuve d’équilibre.',reports},null,2));
console.log(JSON.stringify(reports.map(({viewport,checks,errors,pass,failure})=>({viewport,checks:checks.length,errors,pass,failure:failure?.split('\n')[0]})),null,2));
if(reports.some(r=>!r.pass))process.exitCode=1;
