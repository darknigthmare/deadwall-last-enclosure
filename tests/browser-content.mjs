import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url),{chromium}=require(process.env.DEADWALL_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)),base=process.env.DEADWALL_QA_URL||'http://127.0.0.1:4322';
const label=(process.env.DEADWALL_QA_LABEL||'local').replace(/[^a-zA-Z0-9_-]/g,'_'),output=path.join(root,'artifacts','content-qa',label);
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.DEADWALL_CHROMIUM||undefined,headless:true});
const variants=[{name:'desktop',width:1440,height:900},{name:'laptop',width:1280,height:720},{name:'mobile',width:390,height:844,touch:true},{name:'small-mobile',width:320,height:640,touch:true},{name:'tablet',width:1024,height:768,touch:true},{name:'landscape',width:844,height:390,touch:true}];
const reports=[];
const ready=()=>globalThis.DEADWALL?.contentUI&&globalThis.DeadwallWorldContent&&globalThis.DeadwallArt&&Object.keys(DeadwallArt.ASSETS).length===10&&DEADWALL.art.diagnostics.ready.length===10&&!DEADWALL.art.diagnostics.failed.length;
for(const variant of variants){
  const context=await browser.newContext({viewport:{width:variant.width,height:variant.height},hasTouch:!!variant.touch,isMobile:!!variant.touch,deviceScaleFactor:1});
  const page=await context.newPage(),report={viewport:variant,checks:[],errors:[],httpErrors:[],screenshots:[],canvasFixtures:[]};reports.push(report);
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)report.httpErrors.push({status:response.status(),url:response.url()});});
  const check=(name,value=true)=>{assert.ok(value,name);report.checks.push(name);};
  const shot=async name=>{const file=variant.name+'-'+name+'.png';await page.screenshot({path:path.join(output,file)});report.screenshots.push(file);};
  const shotCanvas=async name=>{const file=variant.name+'-'+name+'-canvas.jpg',url=await page.locator('#game').evaluate(canvas=>canvas.toDataURL('image/jpeg',.86));await fs.writeFile(path.join(output,file),Buffer.from(url.split(',')[1],'base64'));report.canvasFixtures.push({file,note:'Image du canvas réellement rendu, sans les couches DOM du HUD ; fixture de caméra.'});};
  const fits=async()=>page.locator('.command-post').evaluate(node=>{
    const bounds=node.getBoundingClientRect(),body=node.querySelector('.command-body');
    return bounds.x>=-1&&bounds.y>=-1&&bounds.right<=innerWidth+1&&bounds.bottom<=innerHeight+1&&node.scrollWidth<=node.clientWidth+1&&body.scrollWidth<=body.clientWidth+1&&[...node.querySelectorAll('#commandPanel-field article')].filter(card=>card.getClientRects().length&&getComputedStyle(card).visibility!=='hidden').every(card=>card.scrollWidth<=card.clientWidth+1);
  });
  const focusContained=async()=>{
    for(let i=0;i<14;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('#commandModal'))&&!document.activeElement.closest('[inert],.hidden')),true,'focus hors de la modale ou sur une vue cachée');}
  };
  const checkPortraits=async selector=>page.locator(selector+' canvas').evaluateAll(canvases=>canvases.map(canvas=>{
    const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let opaque=0,magenta=0;
    for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>32){opaque++;if(pixels[i]>120&&pixels[i+2]>120&&Math.min(pixels[i],pixels[i+2])-pixels[i+1]>65)magenta++;}
    return{opaque,magenta,ok:opaque>300&&magenta/Math.max(1,opaque)<.01};
  }));
  try{
    const response=await page.goto(base,{waitUntil:'networkidle'});check('document public HTTP 200',response.status()===200);await page.waitForFunction(ready);
    check('dix atlas chargés sans échec',await page.evaluate(()=>DEADWALL.art.diagnostics.ready.length===10));
    await page.locator('#menuRecordsButton').click();await page.locator('#commandTab-field').click();
    check('dossiers accessibles au menu sans commencer une campagne',await page.evaluate(()=>DEADWALL.state==='menu'&&document.getElementById('commandTab-field').getAttribute('aria-selected')==='true'));
    await page.locator('[data-field-view="infected"]').click();check('huit profils infectés lisibles',await page.locator('article[data-enemy-profile]').count()===8);
    check('seuils de vagues exacts et aucun texte indéfini',await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('article[data-enemy-profile]')],waves=cards.map(card=>DeadwallCore.ENEMIES[card.dataset.enemyProfile].unlockWave);
      return !document.getElementById('commandPanel-field').textContent.includes('undefined')&&cards.every((card,index)=>card.querySelector('small').textContent.includes('DÈS LA VAGUE '+waves[index]+' · ')&&(!index||waves[index]>=waves[index-1]));
    }));
    report.infectedPortraits=await checkPortraits('article[data-enemy-profile]');check('portraits infectés non vides et sans fond magenta',report.infectedPortraits.every(result=>result.ok));
    check('dossier infectés sans débordement',await fits());await focusContained();check('focus contenu dans le dossier infectés');
    await page.locator('.command-body').evaluate(node=>{node.scrollTop=0;});await shot('dossier-infectes');
    await page.locator('[data-field-view="crew"]').click();check('quatre profils alliés lisibles',await page.locator('article[data-survivor-profile]').count()===4);
    check('aucun recrutement depuis le menu',await page.locator('[data-recruit-kind]').evaluateAll(buttons=>buttons.every(button=>button.disabled)));
    report.crewPortraits=await checkPortraits('article[data-survivor-profile]');check('portraits alliés non vides et sans fond magenta',report.crewPortraits.every(result=>result.ok));
    check('dossier équipe sans débordement',await fits());await focusContained();check('focus contenu dans le dossier équipe');
    await page.locator('[data-field-view="sectors"]').click();check('six secteurs consultables au menu',await page.locator('[data-mark-site]').count()===6);
    check('repérage sans commande de campagne au menu',await page.locator('[data-mark-site]').evaluateAll(buttons=>buttons.every(button=>button.disabled)));
    check('dossier secteurs sans débordement',await fits());await focusContained();check('focus contenu dans le dossier secteurs');
    await page.keyboard.press('Escape');check('focus restitué après consultation au menu',await page.evaluate(()=>document.activeElement.id==='menuRecordsButton'&&DEADWALL.state==='menu'));
    await page.locator('#mapSeed').fill('17117');await page.locator('#newGameButton').click();await page.waitForFunction(()=>DEADWALL.state==='playing');
    check('carte 4096 avec six sites et 48 gisements de décor',await page.evaluate(()=>DeadwallCore.WORLD_SIZE===4096&&DEADWALL.world.seed===17117&&DEADWALL.world.sites.length===6&&DEADWALL.world.nodes.filter(node=>node.sceneryKind).length===48));
    await page.locator('#specialistCommandButton').click();
    check('bouton spécialistes ouvre équipe et suspend le jeu',await page.evaluate(()=>DEADWALL.paused&&DEADWALL.activeOverlay.id==='commandModal'&&document.querySelector('[data-field-view="crew"]').getAttribute('aria-pressed')==='true'));
    check('spécialistes verrouillés avant leurs prérequis',await page.locator('[data-recruit-kind="medic"]').isDisabled()&&await page.locator('[data-recruit-kind="engineer"]').isDisabled());
    report.recruitFixture=await page.evaluate(()=>{
      const g=DEADWALL,B=g.core().constructor;
      for(const [type,x,y]of [['house',75,75],['house',79,75],['clinic',75,79],['workshop',80,79]])g.world.add(new B(g.nextId++,type,x,y,0,1));
      for(const key of DeadwallCore.RESOURCE_KEYS)g.resources[key]=200;
      g.refreshMetrics(true);g.updateUI();g.commandUI.refresh();
      return{tier:g.tier.id,score:g.cityScore,housing:g.housing,population:g.population};
    });
    check('fixture palier deux issue de structures réelles',report.recruitFixture.tier===2&&report.recruitFixture.score>=24&&report.recruitFixture.housing>report.recruitFixture.population);
    const before=await page.evaluate(()=>({...DEADWALL.resources,population:DEADWALL.population}));
    await page.locator('[data-recruit-kind="medic"]').click();await page.locator('[data-recruit-kind="engineer"]').click();
    check('deux recrutements réels et coûts exacts une seule fois',await page.evaluate(snapshot=>{
      const g=DEADWALL;return g.units.filter(u=>u.kind==='medic').length===1&&g.units.filter(u=>u.kind==='engineer').length===1&&g.population===snapshot.population+2&&g.resources.food===snapshot.food-70&&g.resources.medicine===snapshot.medicine-8&&g.resources.scrap===snapshot.scrap-35;
    },before));
    check('deux spécialistes listés avec leur santé',await page.locator('#fieldRoster').innerText().then(text=>text.includes('Secouriste')&&text.includes('Ingénieur')&&text.includes('90 / 90 PV')&&text.includes('105 / 105 PV')));
    await page.locator('[data-survivor-profile="medic"]').scrollIntoViewIfNeeded();check('recrutement mobile sans débordement',await fits());await shot('recrutement-specialistes');
    await page.evaluate(()=>{const g=DEADWALL;g.qaHousing=g.housing;g.housing=g.population;g.contentUI.refresh();});
    check('logements pleins annoncés et recrutement désactivé',await page.locator('[data-recruit-kind="medic"]').isDisabled()&&await page.locator('[data-survivor-profile="medic"] .field-state').innerText()==='Logements complets.');
    await page.evaluate(()=>{DEADWALL.housing=DEADWALL.qaHousing;DEADWALL.contentUI.refresh();});
    await page.locator('[data-field-view="sectors"]').click();const siteId=await page.locator('[data-mark-site]').first().getAttribute('data-mark-site');
    const position=await page.evaluate(()=>({x:DEADWALL.player.x,y:DEADWALL.player.y}));await page.locator('[data-mark-site]').first().click();
    check('repère posé sans déplacer le commandant',await page.evaluate(({id,position})=>DEADWALL.fieldMarker===id&&DEADWALL.player.x===position.x&&DEADWALL.player.y===position.y,{id:siteId,position}));
    await page.locator('.command-body').evaluate(node=>{node.scrollTop=0;});await shot('secteurs-repere');
    await page.locator('[data-mark-site]').first().click();check('repère effaçable',await page.evaluate(()=>DEADWALL.fieldMarker===null));
    const mapBefore=await page.locator('.field-sector-map').evaluate(canvas=>canvas.toDataURL());
    await page.keyboard.press('Escape');await page.evaluate(()=>{DEADWALL.player.x+=100;});
    await page.locator('#specialistCommandButton').click();await page.locator('[data-field-view="sectors"]').click();
    check('carte joueur redessinée à la réouverture après déplacement de fixture',await page.locator('.field-sector-map').evaluate((canvas,before)=>canvas.toDataURL()!==before,mapBefore));
    const snapshot=await page.evaluate(()=>{
      const g=DEADWALL,node=g.world.nodes.find(n=>n.sceneryKind==='ambulance'),medic=g.units.find(u=>u.kind==='medic'),engineer=g.units.find(u=>u.kind==='engineer');
      const extracted=node.harvest(1.5);g.player.carry.medicine+=extracted;medic.targetUnit=0;medic.state='repair';
      return{nodeId:node.id,amount:node.amount,medicId:medic.id,engineerId:engineer.id,sites:JSON.stringify(g.world.sites),population:g.population};
    });
    await page.keyboard.press('Escape');await page.locator('#pauseButton').click();await page.locator('#saveButton').click();
    check('sauvegarde UI contient les deux profils et le gisement partiel',await page.evaluate(data=>{
      const save=JSON.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));return save.units.some(u=>u.id===data.medicId&&u.kind==='medic')&&save.units.some(u=>u.id===data.engineerId&&u.kind==='engineer')&&save.nodes.some(([id,amount])=>id===data.nodeId&&amount===data.amount);
    },snapshot));
    await page.reload({waitUntil:'networkidle'});await page.waitForFunction(ready);await page.locator('#continueButton').click();await page.locator('#specialistCommandButton').click();
    check('rechargement conserve équipe, sites, extrait et santé maximale des rôles',await page.evaluate(data=>{
      const g=DEADWALL,m=g.units.find(u=>u.id===data.medicId),e=g.units.find(u=>u.id===data.engineerId),node=g.world.nodes.find(n=>n.id===data.nodeId);
      return m?.kind==='medic'&&m.maxHealth===90&&e?.kind==='engineer'&&e.maxHealth===105&&g.population===data.population&&JSON.stringify(g.world.sites)===data.sites&&node.amount===data.amount&&g.player.carry.medicine===1.5;
    },snapshot));
    await page.keyboard.press('Escape');
    // Explicit render fixtures: position/camera are moved for coverage, not through a claimed natural playthrough.
    await page.evaluate(()=>{const g=DEADWALL;g.paused=true;g.releaseInputs();g.dayClock=.5;g.weather=g.weatherTarget=0;g.camera.shake=0;g.qaDrawnProps=new Set();g.qaDrawNode=g.art.drawNode;g.art.drawNode=function(ctx,node){const result=g.qaDrawNode.call(this,ctx,node);if(result&&node.sceneryKind)g.qaDrawnProps.add(node.sceneryKind);return result;};});
    report.siteVisits=[];
    for(let i=0;i<6;i++){
      const visit=await page.evaluate(index=>{const g=DEADWALL,site=g.world.sites[index],before=g.art.diagnostics.draws.districtProps||0;g.player.x=site.x;g.player.y=site.y;g.camera.x=site.x;g.camera.y=site.y;g.camera.zoom=.65;g.fieldMarker=site.id;g.render();return{id:site.id,name:site.name,draws:(g.art.diagnostics.draws.districtProps||0)-before};},i);
      check('rendu effectif du site '+visit.id,visit.draws>=7);report.siteVisits.push(visit);await shot('terrain-'+(i+1));if(i===0)await shotCanvas('terrain-1');
    }
    check('seize types de décor dessinés par le renderer réel',await page.evaluate(()=>DEADWALL.qaDrawnProps.size===16));
    report.hordeFixture=await page.evaluate(()=>{
      const g=DEADWALL,C=DeadwallCore;g.art.drawNode=g.qaDrawNode;const before={...g.art.diagnostics.draws};
      g.wave=8;g.phase='assault';g.wavePlan=C.wavePlan(8,g.difficulty,0);g.startAssault();g.zombies=[];
      const kinds=Object.keys(C.ENEMIES);for(const [index,kind]of kinds.entries()){g.spawnZombie(kind);const zombie=g.zombies.at(-1);zombie.x=g.core().x-120+(index%4)*80;zombie.y=g.core().y-100+Math.floor(index/4)*90;}
      const medic=g.units.find(u=>u.kind==='medic'),engineer=g.units.find(u=>u.kind==='engineer');medic.x=g.core().x-80;medic.y=g.core().y+100;engineer.x=g.core().x+80;engineer.y=g.core().y+100;
      g.player.x=g.core().x;g.player.y=g.core().y+170;g.camera.x=g.core().x;g.camera.y=g.core().y;g.camera.zoom=.8;g.fieldMarker=null;g.render();
      return{types:g.zombies.map(z=>z.kind),composition:g.wavePlan.composition,atlasDelta:Object.fromEntries(['infectedExpansion','specialists'].map(key=>[key,(g.art.diagnostics.draws[key]||0)-(before[key]||0)]))};
    });
    check('huit types engendrés avec composition de vague huit',report.hordeFixture.types.length===8&&new Set(report.hordeFixture.types).size===8&&Object.values(report.hordeFixture.composition).every(count=>count>0));
    check('atlases nouveaux infectés et spécialistes réellement dessinés',report.hordeFixture.atlasDelta.infectedExpansion>=3&&report.hordeFixture.atlasDelta.specialists>=2);await shot('horde-huit-profils-fixture');await shotCanvas('horde-huit-profils-fixture');
    await page.evaluate(()=>{DEADWALL.paused=false;DEADWALL.restoreSave(JSON.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)));});
    await page.locator('#pauseButton').click();await page.locator('#quitButton').click();
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
    const required=['assets/infected-expansion-atlas.webp','assets/specialists-atlas.webp','assets/district-props-atlas.webp','src/world-content.js','src/content-ui.js','content.css','src/narrative.js','src/narrative-ui.js','narrative.css'];
    await page.waitForFunction(async files=>{const cache=await caches.open('deadwall-v1.0.0-r11');return(await Promise.all(files.map(file=>cache.match(new URL(file,location.href).href)))).every(Boolean);},required);
    check('cache r11 contient les trois nouveaux atlas, modules de contenu et récit');
    await context.setOffline(true);await page.reload({waitUntil:'load'});await page.waitForFunction(ready);
    await page.locator('#menuRecordsButton').click();await page.locator('#commandTab-field').click();await page.locator('[data-field-view="crew"]').click();
    check('portraits et dossiers fonctionnent après rechargement hors ligne',(await checkPortraits('article[data-survivor-profile]')).every(result=>result.ok));
    await page.keyboard.press('Escape');await page.locator('#continueButton').click();
    check('campagne avec spécialistes et six sites reprend hors ligne',await page.evaluate(()=>DEADWALL.units.some(u=>u.kind==='medic')&&DEADWALL.units.some(u=>u.kind==='engineer')&&DEADWALL.world.sites.length===6));
    await page.locator('#specialistCommandButton').click();check('dossiers hors ligne sans débordement',await fits());await shot('hors-ligne');
    await context.setOffline(false);
    await page.keyboard.press('Escape');await page.locator('#pauseButton').click();await page.locator('#pauseSettingsButton').click();
    await page.locator('#settingsContrast').check();await page.locator('#settingsMotion').check();await page.keyboard.press('Escape');
    await page.locator('#pauseCommandButton').click();await page.locator('#commandTab-field').click();await page.locator('[data-field-view="crew"]').click();
    check('contraste équipe et mouvement réduit appliqués depuis les vrais paramètres',await page.evaluate(()=>DEADWALL.settings.highContrast&&DEADWALL.settings.reducedMotion&&document.body.classList.contains('high-contrast')&&document.body.classList.contains('reduced-motion')&&getComputedStyle(document.querySelector('[data-survivor-profile="medic"] .field-counter')).color==='rgb(226, 232, 220)'));
    check('équipe en contraste élevé sans débordement',await fits());await focusContained();check('focus équipe conservé avec les options de confort');
    await page.locator('[data-survivor-profile="medic"]').scrollIntoViewIfNeeded();await shot('equipe-contraste');
    check('aucune erreur runtime, console ou HTTP',report.errors.length===0&&report.httpErrors.length===0);report.pass=true;
  }catch(error){report.pass=false;report.failure=error.stack;await shot('failure').catch(()=>{});console.error(variant.name+': '+error.message);}
  finally{await context.close();}
}
await browser.close();
await fs.writeFile(path.join(output,'report.json'),JSON.stringify({date:new Date().toISOString(),base,label,fixture:'Contextes isolés. Palier obtenu par quatre structures terminées ajoutées et réserves fixées pour exercer les vrais boutons. Extraction partielle préparée pour save/load. Visites des six sites et disposition de huit infectés : fixtures de position/caméra, pas une preuve de parcours naturel ni d’équilibre. Navigation UI, recrutements, sauvegarde, rechargement et hors ligne réellement exécutés.',reports},null,2));
console.log(JSON.stringify(reports.map(({viewport,checks,errors,httpErrors,pass,failure})=>({viewport,checks:checks.length,errors,httpErrors,pass,failure:failure?.split('\n')[0]})),null,2));
if(reports.some(report=>!report.pass))process.exitCode=1;
