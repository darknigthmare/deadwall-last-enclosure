// Prepared only: the root agent must obtain browser approval before execution.
// Setting this variable is an execution guard, not a substitute for approval.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

if(process.env.DEADWALL_QA_BROWSER_APPROVED!=='1')throw new Error('Browser QA not started: obtain approval, then set DEADWALL_QA_BROWSER_APPROVED=1.');
const require=createRequire(import.meta.url),{chromium}=require(process.env.DEADWALL_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)),base=process.env.DEADWALL_QA_URL||'http://127.0.0.1:4322';
const label=(process.env.DEADWALL_QA_LABEL||'completion-'+new Date().toISOString()).replace(/[^a-zA-Z0-9_-]/g,'_');
const output=path.join(process.env.DEADWALL_QA_OUTPUT_ROOT||path.join(root,'artifacts'),'completion-qa',label);
const variants=[
  {name:'desktop',width:1440,height:900},{name:'laptop',width:1280,height:720},
  {name:'mobile',width:390,height:844,touch:true},{name:'small-mobile',width:320,height:640,touch:true},
  {name:'tablet',width:1024,height:768,touch:true},{name:'landscape',width:844,height:390,touch:true}
],reports=[];
const ready=()=>globalThis.DEADWALL?.scenarioUI&&DEADWALL.squadUI&&DEADWALL.battlefieldUI&&DEADWALL.art?.diagnostics.ready.length===Object.keys(DeadwallArt.ASSETS).length&&!DEADWALL.art.diagnostics.failed.length;
const required=['src/scenarios.js','src/scenario-ui.js','src/squads.js','src/squad-ui.js','src/battlefield.js','src/battlefield-ui.js','squads.css','finish.css'];
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.DEADWALL_CHROMIUM||undefined,headless:true});
try{
  for(const viewport of variants){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,deviceScaleFactor:1});
    const page=await context.newPage(),report={viewport,checks:[],errors:[],httpErrors:[],requestFailures:[],screenshots:[],fixtures:[]};reports.push(report);let offline=false;
    page.setDefaultTimeout(20000);
    page.on('pageerror',error=>report.errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
    page.on('response',response=>{if(response.status()>=400)report.httpErrors.push({status:response.status(),url:response.url()});});
    page.on('requestfailed',request=>report.requestFailures.push({url:request.url(),failure:request.failure()?.errorText,offlineExpected:offline}));
    page.on('dialog',async dialog=>{report.errors.push('Unexpected dialog: '+dialog.message());await dialog.dismiss();});
    const check=(name,condition=true)=>{assert.ok(condition,name);report.checks.push(name);};
    const shot=async name=>{const file=viewport.name+'-'+name+'.png';await page.screenshot({path:path.join(output,file)});report.screenshots.push(file);};
    const fits=async selector=>page.locator(selector).evaluate(node=>{
      const box=node.getBoundingClientRect();
      return box.x>=-1&&box.y>=-1&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1&&node.scrollWidth<=node.clientWidth+1
        &&[...node.querySelectorAll('.squad-card,.battlefield-sector,.debrief-metric')].every(child=>child.scrollWidth<=child.clientWidth+1);
    });
    const focusInside=async(selector,steps=18)=>{
      for(let n=0;n<steps;n++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(selector=>Boolean(document.activeElement.closest(selector))&&!document.activeElement.closest('[inert],.hidden'),selector),'Focus escaped '+selector+' at Tab '+n);}
    };
    const key=async(code,predicate)=>{await page.locator('#game').focus();await page.keyboard.press(code);if(predicate)await page.waitForFunction(predicate);};
    const sameStart=()=>page.evaluate(()=>{
      const g=DEADWALL,saved=DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)),expected=DeadwallScenarios.initialState('rearguard','standard');
      return{ok:g.scenarioId==='rearguard'&&g.difficulty.id==='standard'&&!g.gameOver&&saved.wave===1&&saved.stats.wavesSurvived===0&&saved.phaseTime===expected.calmSeconds
        &&JSON.stringify(saved.resources)===JSON.stringify(expected.resources)&&saved.units.filter(u=>u.kind==='worker').length===2&&saved.units.filter(u=>u.kind==='soldier').length===1
        &&saved.buildings.find(b=>b.type==='core').health===expected.coreHealth,runId:g.runId,seed:g.world.seed};
    });
    try{
      const response=await page.goto(base,{waitUntil:'networkidle'});check('document public HTTP 200',response.status()===200);await page.waitForFunction(ready);
      check('quatre départs accessibles dans un véritable select',await page.locator('#startScenario option').count()===4);
      for(const id of ['classic','convoy','reconstruction','rearguard']){
        await page.locator('#startScenario').selectOption(id);
        check('description et contrepartie du départ '+id,await page.evaluate(id=>{
          const def=DeadwallScenarios.get(id),description=document.getElementById('startScenarioDescription').textContent,facts=document.getElementById('startScenarioFacts').textContent;
          return description.includes(def.description)&&description.includes(def.tradeoff)&&facts.includes('Réserves :')&&facts.includes('Les records sont séparés');
        },id));
      }
      check('menu responsive sans débordement horizontal',await fits('.menu-card'));
      await page.locator('#startScenario').scrollIntoViewIfNeeded();await shot('01-menu-arriere-garde');
      await page.locator('#mapSeed').fill('17117');
      await page.locator('#newGameButton').click();await page.waitForFunction(()=>DEADWALL.state==='playing');
      const initial=await sameStart();check('Arrière-garde réellement lancée avec sa composition et ses réserves',initial.ok&&initial.seed===17117);
      check('fusilier de départ immédiatement affecté à Alpha',await page.evaluate(()=>DEADWALL.units.find(u=>u.kind==='soldier').squad===0));
      report.fixtures.push(await page.evaluate(()=>{DEADWALL.phaseTime=9999;return{kind:'quiet-phase',phaseTime:9999,note:'Calme prolongé uniquement pour isoler les commandes et la reprise des apparitions naturelles ; aucune mesure d’équilibre.'};}));
      await page.locator('#squadCommandButton').click();
      check('sections dans l’onglet Équipes existant, sans onglet supplémentaire',await page.locator('#commandTab-workers').getAttribute('aria-selected')==='true'&&await page.locator('[data-squad]').count()===3&&await page.locator('[role="tab"]').count()===6);
      const beforeOrder=await page.evaluate(()=>({units:DEADWALL.units.map(u=>({id:u.id,x:u.x,y:u.y})),resources:JSON.stringify(DEADWALL.resources)}));
      await page.locator('[data-squad-select="0"]').click();await page.locator('[data-squad-action="retreat"][data-squad-index="0"]').click();
      check('sélection et repli transmis via UI, sans coût ni déplacement en pause',await page.evaluate(before=>DEADWALL.paused&&DEADWALL.squads.selected===0&&DEADWALL.squads.groups[0].order==='retreat'&&JSON.stringify(DEADWALL.resources)===before.resources&&DEADWALL.units.every(u=>{const old=before.units.find(item=>item.id===u.id);return old&&old.x===u.x&&old.y===u.y;}),beforeOrder));
      check('état de repli accessible annoncé',await page.locator('[data-squad-action="retreat"][data-squad-index="0"]').getAttribute('aria-pressed')==='true'&&await page.locator('#squadStatus').innerText().then(text=>text.includes('ALPHA')));
      check('équipes sans débordement',await fits('.command-post'));await focusInside('#commandModal');check('focus des équipes reste dans la modale');
      await page.locator('#squadHeading').scrollIntoViewIfNeeded();await shot('02-equipes');
      const beforePlacement=await page.evaluate(()=>{const u=DEADWALL.units.find(u=>u.kind==='soldier');return{x:u.x,y:u.y,elapsed:DEADWALL.elapsed};});
      await page.locator('[data-squad-action="rally"][data-squad-index="0"]').click();
      check('placement au sol ferme la modale et reprend explicitement le jeu',await page.evaluate(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay&&DEADWALL.rallyPlacement?.squad===0&&document.activeElement===DEADWALL.canvas));
      const point=await page.evaluate(()=>{
        const g=DEADWALL;
        for(const dy of [90,-90,40,-40,0])for(const dx of [85,-85,0,140,-140]){
          const x=innerWidth/2+dx,y=innerHeight/2+dy,world={x:(x-g.width/2)/g.camera.zoom+g.camera.x,y:(y-g.height/2)/g.camera.zoom+g.camera.y};
          if(x>20&&x<innerWidth-20&&y>20&&y<innerHeight-20&&document.elementFromPoint(x,y)===g.canvas&&g.squadRallyStatus(world).ok)return{x,y,world};
        }
        return null;
      });
      check('point cliquable et physiquement valide identifié sur le canvas',Boolean(point));
      await page.mouse.click(point.x,point.y);await page.waitForFunction(()=>!DEADWALL.rallyPlacement);
      check('clic réel place le point Alpha sans toucher les autres sections',await page.evaluate(point=>DeadwallCore.dist(DEADWALL.squads.groups[0].rally,point)<3&&DEADWALL.squads.groups[0].order==='rally'&&DEADWALL.squads.groups[1].order==='rally'&&DEADWALL.squads.groups[2].order==='rally',point.world));
      await page.waitForFunction(before=>{const u=DEADWALL.units.find(u=>u.kind==='soldier');return DeadwallCore.dist(u,before)>3;},beforePlacement);
      check('la section se déplace dans le temps de simulation, sans téléportation',await page.evaluate(before=>{const u=DEADWALL.units.find(u=>u.kind==='soldier');return DeadwallCore.dist(u,before)<=u.speed*(DEADWALL.elapsed-before.elapsed)+2;},beforePlacement));
      for(const [code,index]of [['Digit4',0],['Digit5',1],['Digit6',2]]){await key(code);await page.waitForFunction(index=>DEADWALL.squads.selected===index,index);check('sélection clavier '+code,await page.evaluate(index=>DEADWALL.squads.selected===index,index));}
      await key('KeyT',()=>DEADWALL.squads.groups[2].order==='retreat');check('repli T appliqué uniquement à Charlie',await page.evaluate(()=>DEADWALL.squads.groups[2].order==='retreat'&&DEADWALL.squads.groups[0].order==='rally'));
      await key('KeyG',()=>DEADWALL.rallyPlacement?.squad===2);await page.keyboard.press('Escape');check('G prépare et Échap annule le point Charlie',await page.evaluate(()=>!DEADWALL.rallyPlacement));
      await page.locator('#squadCommandButton').click();const selected=await page.evaluate(()=>DEADWALL.squads.selected);
      await page.keyboard.press('Digit4');await page.keyboard.press('KeyT');await page.keyboard.press('KeyG');
      check('raccourcis ignorés derrière le poste de commandement',await page.evaluate(selected=>DEADWALL.squads.selected===selected&&!DEADWALL.rallyPlacement,selected));
      const checkpoint=await page.evaluate(()=>({runId:DEADWALL.runId,squads:JSON.stringify(DEADWALL.squads)}));
      await page.keyboard.press('Escape');await page.locator('#pauseButton').click();await page.locator('#saveButton').click();await page.locator('#quitButton').click();
      await page.reload({waitUntil:'networkidle'});await page.waitForFunction(ready);await page.locator('#continueButton').click();
      check('reprise recharge scénario, ordres et sélection sauvegardés',await page.evaluate(before=>DEADWALL.scenarioId==='rearguard'&&DEADWALL.world.seed===17117&&DEADWALL.runId===before.runId&&JSON.stringify(DEADWALL.squads)===before.squads,checkpoint));
      await page.locator('#pauseButton').click();await page.locator('#saveButton').click();await page.locator('#quitButton').click();
      await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
      await page.waitForFunction(async files=>{const cache=await caches.open('deadwall-v1.0.0-r12');return(await Promise.all(files.map(file=>cache.match(new URL(file,location.href).href)))).every(Boolean);},required);
      check('cache r12 contient les six modules JS et deux CSS ajoutés');
      offline=true;await context.setOffline(true);await page.reload({waitUntil:'load'});await page.waitForFunction(ready);await page.locator('#continueButton').click();await page.locator('#squadCommandButton').click();
      check('PWA hors ligne reprend les mêmes sections et départ',await page.evaluate(before=>DEADWALL.scenarioId==='rearguard'&&DEADWALL.runId===before.runId&&JSON.stringify(DEADWALL.squads)===before.squads&&Boolean(DEADWALL.scenarioUI&&DEADWALL.squadUI&&DEADWALL.battlefieldUI),checkpoint));
      check('équipes hors ligne sans débordement',await fits('.command-post'));
      await page.locator('#squadHeading').scrollIntoViewIfNeeded();await shot('03-equipes-hors-ligne');await context.setOffline(false);offline=false;
      await page.locator('#commandTab-enclosure').click();
      report.fixtures.push(await page.evaluate(()=>{
        const g=DEADWALL,core=g.core(),Building=core.constructor;
        g.zombies=[];g.pendingSpawns=DeadwallCore.normalizeSpawnCounts();g.spawnQueue=[];
        const contacts=[{dx:0,dy:-100},{dx:0,dy:-200},{dx:450,dy:0},{dx:0,dy:50},{dx:-400,dy:0},{dx:0,dy:-80,dead:true}];
        for(const item of contacts){g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=core.x+item.dx;z.y=core.y+item.dy;if(item.dead){z.dead=true;z.health=0;}}
        const north=new Building(g.nextId++,'woodWall',63,59,0,1);north.health=north.maxHealth*.25;g.world.add(north);
        const east=new Building(g.nextId++,'woodWall',70,64,0,1);g.world.add(east);g.rebuildBuckets();g.refreshMetrics(true);g.battlefieldUI.refresh(true);
        return{kind:'front-snapshot',contacts,walls:[{direction:'north',integrityRatio:.25},{direction:'east',integrityRatio:1}],note:'Six infectés positionnés, dont un mort, et deux murs injectés en pause. Cinq contacts actifs, trois dans le rayon de proximité ; aucune brèche ni vague jouée n’est affirmée.'};
      }));
      check('quatre fronts réels affichés',await page.locator('#battlefieldSectors .battlefield-sector').count()===4);
      const fronts=await page.locator('#battlefieldSectors .battlefield-sector').evaluateAll(cards=>cards.map(card=>({name:card.querySelector('h4').textContent,contacts:card.querySelector('strong').textContent,near:card.querySelector('p').textContent,walls:card.querySelector('small').textContent,alert:card.dataset.alert})));
      check('contacts vivants répartis N2/E1/S1/O1, mort exclu',fronts.map(front=>front.contacts).join('|')==='2 contacts actifs|1 contacts actifs|1 contacts actifs|1 contacts actifs');
      check('proximité N2/S1 distinguée des fronts éloignés',fronts[0].near==='2 près du centre'&&fronts[2].near==='1 près du centre'&&fronts[1].near==='Aucun contact près du centre'&&fronts[3].near==='Aucun contact près du centre');
      check('intégrité des murs analysée sans inventer une cause de brèche',fronts[0].walls==='1 remparts fragiles / 1'&&fronts[1].walls==='0 remparts fragiles / 1');
      check('alerte de proximité nomme seulement les fronts proches',await page.locator('#innerRingAlert').innerText().then(text=>text.includes('NORD')&&text.includes('SUD')&&!text.includes('EST')&&!text.includes('OUEST')));
      check('fronts sans débordement',await fits('.command-post'));await page.locator('#battlefieldTitle').scrollIntoViewIfNeeded();await shot('04-fronts-fixture');
      await page.keyboard.press('Escape');
      report.fixtures.push(await page.evaluate(()=>{
        const g=DEADWALL;
        Object.assign(g.stats,{wavesSurvived:6,kills:27,peakPopulation:9,peakBuildings:12,unitsLost:2,buildingsLost:3,playSeconds:123});
        g.resources.ammo=0;const core=g.core();g.damageBuilding(core,core.health+1);
        return{kind:'defeat-and-identifiable-records',statistics:{wavesSurvived:6,kills:27,peakPopulation:9,peakBuildings:12,unitsLost:2,buildingsLostBeforeCore:3,playSeconds:123},ammo:0,
          note:'Statistiques de test injectées pour identifier chaque métrique et le compartiment de records. Destruction via damageBuilding ; aucune de ces vagues, pertes ou 123 secondes n’est déclarée issue d’une partie naturelle.'};
      }));
      await page.waitForFunction(()=>DEADWALL.gameOver&&DEADWALL.activeOverlay?.id==='gameOver');
      const metricValues=await page.locator('#debriefMetrics .debrief-metric strong').allTextContents();
      check('débrief contient six métriques distinctes et perte du centre comptée',metricValues.join('|')==='6|27|9|12|2|4');
      check('identité de campagne et durée explicitement affichées',await page.locator('#debriefCampaign').innerText().then(text=>text.includes('Arrière-garde')&&text.includes('17117')&&text.includes('Standard'))&&await page.locator('#debriefDuration').innerText().then(text=>text.includes('centre de commandement détruit')));
      check('conseil munitions décrit une réserve observée sans cause inventée',await page.locator('#debriefLessons').innerText().then(text=>text.includes('réserve commune de munitions était vide')));
      check('défaite efface campagne active et secours mais conserve les records',await page.evaluate(()=>!localStorage.getItem(DeadwallCore.SAVE_KEY)&&!localStorage.getItem(DeadwallCore.SAVE_BACKUP_KEY)&&DEADWALL.profile.get().byScenario.rearguard.standard.wavesSurvived===6));
      check('scores de test Arrière-garde séparés des trois autres départs',await page.evaluate(()=>{const p=DEADWALL.profile.get();return p.byScenario.rearguard.standard.wavesSurvived===6&&['classic','convoy','reconstruction'].every(id=>p.byScenario[id].standard.wavesSurvived===0)&&p.byDifficulty.standard.wavesSurvived===0;}));
      check('débrief sans débordement',await fits('.gameover-card'));await focusInside('#gameOver',12);check('focus débrief contenu');
      await page.locator('.gameover-card').evaluate(node=>{node.scrollTop=0;});await shot('05-debrief-fixture');
      await page.locator('#restartButton').click();const replay=await sameStart();
      check('rejouer conserve carte et conditions, crée une campagne neuve sans bonus',replay.ok&&replay.seed===17117&&replay.runId!==initial.runId);
      report.fixtures.push(await page.evaluate(()=>{const g=DEADWALL,core=g.core();g.damageBuilding(core,core.health+1);return{kind:'second-core-destruction',note:'Destruction immédiate de la nouvelle campagne pour vérifier le second bouton de rejeu, sans simulation de combat.'};}));
      await page.locator('#gameOverNewMapButton').click();const newMap=await sameStart();
      check('nouvelle carte conserve les conditions Arrière-garde et crée une autre identité',newMap.ok&&newMap.runId!==replay.runId&&newMap.seed!==17117);report.newMapSeed=newMap.seed;
      report.fixtures.push(await page.evaluate(()=>{const g=DEADWALL,core=g.core();g.damageBuilding(core,core.health+1);return{kind:'third-core-destruction',note:'Destruction de test pour revenir aux archives via le débrief.'};}));
      await page.locator('#gameOverMenuButton').click();await page.locator('#menuRecordsButton').click();await page.locator('#recordScenario').selectOption('rearguard');
      check('filtre archives Arrière-garde affiche le score de fixture',await page.locator('#recordBoard .record-card').nth(1).locator('strong').innerText()==='6');
      await page.locator('#recordScenario').selectOption('classic');
      check('filtre archives classique reste distinct à zéro',await page.locator('#recordBoard .record-card').nth(1).locator('strong').innerText()==='0');
      check('archives après rejeux sans débordement',await fits('.command-post'));await shot('06-archives-classiques-distinctes');
      check('aucune erreur console, runtime, HTTP ou réseau inattendue',report.errors.length===0&&report.httpErrors.length===0&&!report.requestFailures.some(item=>!item.offlineExpected));
      report.pass=true;
    }catch(error){report.pass=false;report.failure=error.stack;await shot('failure').catch(()=>{});console.error(viewport.name+': '+error.message);}
    finally{await context.setOffline(false).catch(()=>{});await context.close();}
  }
}finally{await browser.close();}
const scope='Six contextes vierges. Vrais select, boutons, navigation clavier, clic de point au sol, sauvegarde, reprise et PWA r12 hors ligne. Entrées clavier et souris automatisées à toutes les tailles, pas une certification matérielle tactile/manette. Le calme est prolongé pour isoler les commandes. Contacts, murs, statistiques et destructions du centre sont des fixtures précisément décrites ; elles ne constituent pas des vagues jouées, une mesure de difficulté ou un équilibrage humain. Débrief et séparation des records contrôlés contre ces fixtures. Captures brutes à inspecter, sans certification commerciale ni conformité globale d’accessibilité.';
await fs.writeFile(path.join(output,'report.json'),JSON.stringify({date:new Date().toISOString(),base,label,scope,reports},null,2));
console.log(JSON.stringify(reports.map(({viewport,checks,pass,failure,errors,httpErrors,requestFailures})=>({viewport,checks:checks.length,pass,failure:failure?.split('\n')[0],errors,httpErrors,requestFailures})),null,2));
if(reports.some(report=>!report.pass))process.exitCode=1;
