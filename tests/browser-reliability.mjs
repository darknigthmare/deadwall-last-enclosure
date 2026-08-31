// Prepared runner: execution requires explicit browser approval for this project.
// This guard records the prerequisite; it is not itself user approval.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

if(process.env.DEADWALL_QA_BROWSER_APPROVED!=='1')throw new Error('Browser QA not started: obtain approval, then set DEADWALL_QA_BROWSER_APPROVED=1.');
const require=createRequire(import.meta.url),{chromium}=require(process.env.DEADWALL_PLAYWRIGHT_MODULE||'playwright'),Save=require('../src/save.js');
const root=fileURLToPath(new URL('..',import.meta.url)),base=process.env.DEADWALL_QA_URL||'http://127.0.0.1:4322';
const label=(process.env.DEADWALL_QA_LABEL||'reliability-'+new Date().toISOString()).replace(/[^a-zA-Z0-9_-]/g,'_');
const output=path.join(process.env.DEADWALL_QA_OUTPUT_ROOT||path.join(root,'artifacts'),'reliability-qa',label);
const variants=[
  {name:'desktop',width:1440,height:900},{name:'laptop',width:1280,height:720},
  {name:'mobile',width:390,height:844,touch:true},{name:'small-mobile',width:320,height:640,touch:true},
  {name:'tablet',width:1024,height:768,touch:true},{name:'landscape',width:844,height:390,touch:true}
],reports=[];
const ready=()=>globalThis.DEADWALL?.showSettings&&DEADWALL.commandUI&&DEADWALL.art?.diagnostics.ready.length===Object.keys(DeadwallArt.ASSETS).length&&!DEADWALL.art.diagnostics.failed.length;
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.DEADWALL_CHROMIUM||undefined,headless:true});
try{
  for(const viewport of variants){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,deviceScaleFactor:1,acceptDownloads:true});
    const page=await context.newPage(),report={viewport,checks:[],errors:[],httpErrors:[],requestFailures:[],dialogs:[],screenshots:[],fixtures:[]};reports.push(report);
    page.setDefaultTimeout(20000);
    page.on('pageerror',error=>report.errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
    page.on('response',response=>{if(response.status()>=400)report.httpErrors.push({status:response.status(),url:response.url()});});
    page.on('requestfailed',request=>report.requestFailures.push({url:request.url(),failure:request.failure()?.errorText}));
    page.on('dialog',async dialog=>{report.dialogs.push({type:dialog.type(),message:dialog.message()});report.errors.push('Unexpected dialog: '+dialog.message());await dialog.dismiss();});
    const check=(name,condition=true)=>{assert.ok(condition,name);report.checks.push(name);};
    const shot=async name=>{const file=viewport.name+'-'+name+'.png';await page.screenshot({path:path.join(output,file)});report.screenshots.push(file);};
    const state=()=>page.evaluate(()=>({runId:DEADWALL.runId,wave:DEADWALL.wave,resources:JSON.stringify(DEADWALL.resources),primary:localStorage.getItem(DeadwallCore.SAVE_KEY)}));
    const unchanged=async snapshot=>page.evaluate(before=>DEADWALL.runId===before.runId&&DEADWALL.wave===before.wave&&JSON.stringify(DEADWALL.resources)===before.resources&&localStorage.getItem(DeadwallCore.SAVE_KEY)===before.primary,snapshot);
    const settingsFits=()=>page.locator('.settings-card').evaluate(card=>{const box=card.getBoundingClientRect(),review=card.querySelector('#settingsImportReview');return box.x>=-1&&box.y>=-1&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1&&card.scrollWidth<=card.clientWidth+1&&review.scrollWidth<=review.clientWidth+1;});
    const upload=async(name,text)=>page.locator('#settingsImportFile').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});
    const waitPending=async name=>page.waitForFunction(file=>globalThis.__deadwallReliabilityFiles?.pending().includes(file),name);
    const settleFile=async(name,reject=false)=>page.evaluate(async({name,reject})=>{
      await globalThis.__deadwallReliabilityFiles.release(name,reject);
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    },{name,reject});
    const previewWave=async wave=>page.waitForFunction(wave=>!document.getElementById('settingsImportReview').classList.contains('hidden')&&document.getElementById('settingsImportSummary').textContent.startsWith('Vague '+wave+' '),wave);
    const restoreFileFixture=async()=>page.evaluate(()=>{
      const fixture=globalThis.__deadwallReliabilityFiles;if(!fixture)return true;
      const restored=fixture.restore();delete globalThis.__deadwallReliabilityFiles;return restored;
    });
    try{
      const response=await page.goto(base,{waitUntil:'networkidle'});check('document public HTTP 200',response.status()===200);
      await page.waitForFunction(ready);
      check('menu sans sauvegarde initiale',await page.evaluate(()=>DEADWALL.state==='menu'&&!localStorage.getItem(DeadwallCore.SAVE_KEY)));
      await shot('01-menu');
      await page.locator('#mapSeed').fill('17117');await page.locator('#newGameButton').click();
      await page.waitForFunction(()=>DEADWALL.state==='playing'&&!DEADWALL.paused);
      // Reproduction fixture only: six completed walls, carried wood, a quiet phase
      // and fatal damage. The eight-second countdown below advances only via RAF.
      report.fixtures.push(await page.evaluate(()=>{
        const g=DEADWALL,Building=g.core().constructor,walls=[];
        g.releaseInputs();g.cancelPlacement();g.phaseTime=9999;g.setWorkerOrder('retreat');g.player.carry.wood=20;
        for(let gy=61;gy<=66;gy++){const wall=new Building(g.nextId++,'woodWall',66,gy,0,1);g.world.add(wall);walls.push({id:wall.id,gx:wall.gx,gy:wall.gy});}
        g.refreshMetrics(true);g.camera.x=g.core().x;g.camera.y=g.core().y;
        const start={performanceNow:performance.now(),elapsed:g.elapsed};g.damagePlayer(1000);
        globalThis.__deadwallRevivalStart=start;
        return{kind:'fatal-damage-and-adjacent-wall',seed:17117,walls,carriedWood:20,phaseTime:9999,start,initialDownTimer:g.player.downTimer,
          note:'Murs terminés injectés sans coûts ni chantier, phase calme prolongée, cargaison et dommages préparés. Pas de combat naturel, de construction jouée ni de mesure d’équilibre.'};
      }));
      check('commandant effectivement à terre avec huit secondes à attendre',await page.evaluate(()=>DEADWALL.player.dead&&DEADWALL.player.health===0&&DEADWALL.player.downTimer>7));
      await shot('02-reanimation-en-cours');
      await page.waitForFunction(()=>!DEADWALL.player.dead,null,{timeout:30000});
      report.revival=await page.evaluate(()=>{
        const g=DEADWALL,p=g.player,core=g.core(),start=globalThis.__deadwallRevivalStart;
        return{wallMilliseconds:performance.now()-start.performanceNow,simulationSeconds:g.elapsed-start.elapsed,downTimer:p.downTimer,health:p.health,carryWood:p.carry.wood,
          position:{x:p.x,y:p.y},core:{x:core.x,y:core.y},standable:g.friendlyPositionClear(p,p.x,p.y),
          overlapsWall:[...g.world.buildings.values()].some(b=>DeadwallTactics.blocksFriendly(b)&&DeadwallTactics.overlapsBuilding(b,p))};
      });
      check('réanimation attend huit secondes actives par la vraie boucle RAF',report.revival.wallMilliseconds>=7900&&report.revival.simulationSeconds>=8);
      check('timer final nul, santé restaurée, pénalité unique',report.revival.downTimer===0&&report.revival.health===100&&report.revival.carryWood===10);
      check('arrivée intérieure libre face au rempart adjacent',report.revival.standable&&!report.revival.overlapsWall&&report.revival.position.x===report.revival.core.x&&report.revival.position.y===report.revival.core.y);
      // Keyboard events are real browser input on all viewports; this is not a
      // claim that a touch device or gamepad was exercised.
      await page.locator('#game').focus();await page.keyboard.down('ArrowLeft');
      try{await page.waitForFunction(x=>DEADWALL.player.x<x-15,report.revival.core.x,{timeout:4000});}
      finally{await page.keyboard.up('ArrowLeft');}
      check('commandant mobile par entrée clavier après réanimation',await page.evaluate(()=>DEADWALL.friendlyPositionClear(DEADWALL.player,DEADWALL.player.x,DEADWALL.player.y)&&DEADWALL.player.carry.wood===10));
      await shot('03-jeu-apres-reanimation');
      await page.locator('#pauseButton').click();await page.locator('#saveButton').click();
      check('sauvegarde manuelle UI réussie après réanimation',await page.evaluate(()=>DEADWALL.lastSaveStatus.ok&&DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)).player.downTimer===0));
      await page.locator('#pauseSettingsButton').click();
      const exportState=await page.evaluate(()=>({runId:DEADWALL.runId,player:{x:DEADWALL.player.x,y:DEADWALL.player.y},resources:JSON.stringify(DEADWALL.resources)}));
      const downloadEvent=page.waitForEvent('download');await page.locator('#settingsExport').click();const download=await downloadEvent;
      const exportFile=viewport.name+'-revival-export.json';await download.saveAs(path.join(output,exportFile));
      check('export JSON téléchargé sans erreur',await download.failure()===null);
      const exportedBytes=await fs.readFile(path.join(output,exportFile)),exported=Save.parse(exportedBytes.toString('utf8'));
      report.export={file:exportFile,bytes:exportedBytes.length,sha256:createHash('sha256').update(exportedBytes).digest('hex')};
      check('export contient la cité réanimée actuelle',exported.runId===exportState.runId&&exported.player.downTimer===0&&!exported.player.dead&&exported.player.carry.wood===10&&exported.player.x===exportState.player.x&&exported.player.y===exportState.player.y&&JSON.stringify(exported.resources)===exportState.resources);
      check('options sans débordement horizontal',await settingsFits());
      await page.locator('#settingsClose').click();await page.locator('#quitButton').click();
      check('retour au menu ne bloque pas sur une fausse erreur de stockage',await page.evaluate(()=>DEADWALL.state==='menu'&&DEADWALL.lastSaveStatus.ok&&!document.getElementById('continueButton').disabled));
      await page.reload({waitUntil:'networkidle'});await page.waitForFunction(ready);await page.locator('#continueButton').click();
      check('reprise réelle après rechargement conserve la réanimation et sa pénalité unique',await page.evaluate(id=>DEADWALL.state==='playing'&&DEADWALL.runId===id&&!DEADWALL.player.dead&&DEADWALL.player.downTimer===0&&DEADWALL.player.carry.wood===10,exportState.runId));
      await page.locator('#pauseButton').click();await page.locator('#pauseCommandButton').click();await page.locator('#commandTab-enclosure').click();
      report.fixtures.push(await page.evaluate(()=>{
        DEADWALL.activeCrisis={id:'injury',wave:3,status:'pending',remaining:45,targetId:0,choice:null};DEADWALL.commandUI.refresh();
        return{kind:'pending-injury-crisis',waveField:3,note:'Incident injecté, sans affirmer son déclenchement naturel ; paiement et arrivée testés par le vrai bouton A en pause tactique.'};
      }));
      const beforeAdmission=await page.evaluate(()=>({count:DEADWALL.units.length,food:DEADWALL.resources.food,medicine:DEADWALL.resources.medicine,resolved:DEADWALL.stats.crisesResolved}));
      check('accueil disponible avec stocks et logement réels',await page.locator('#commandCrisisA').isEnabled());
      await page.locator('#commandCrisisA').click();
      check('accueil payé une fois, survivant libre derrière le rempart',await page.evaluate(before=>{
        const g=DEADWALL,u=g.units.at(-1),core=g.core();
        return g.paused&&g.units.length===before.count+1&&g.resources.food===before.food-12&&g.resources.medicine===before.medicine-6&&g.stats.crisesResolved===before.resolved+1
          &&u.x===core.x&&u.y===core.y&&g.friendlyPositionClear(u,u.x,u.y)&&![...g.world.buildings.values()].some(b=>DeadwallTactics.blocksFriendly(b)&&DeadwallTactics.overlapsBuilding(b,u));
      },beforeAdmission));
      const admittedId=await page.evaluate(()=>DEADWALL.units.at(-1).id);
      check('arrivée du survivant incluse dans la sauvegarde réelle',await page.evaluate(id=>DEADWALL.lastSaveStatus.ok&&DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)).units.some(u=>u.id===id&&u.x===DEADWALL.core().x&&u.y===DEADWALL.core().y),admittedId));
      await page.keyboard.press('Escape');await page.locator('#pauseSettingsButton').click();
      // File objects and change events come from the real input. Only the timing
      // of named File.text() reads is intercepted, then its descriptor is restored.
      await page.evaluate(()=>{
        const prototype=File.prototype,descriptor=Object.getOwnPropertyDescriptor(prototype,'text'),original=prototype.text,pending=new Map();
        Object.defineProperty(prototype,'text',{configurable:true,writable:true,value:function(){
          if(!this.name.startsWith('deadwall-reliability-delay-'))return original.call(this);
          const file=this;return new Promise((resolve,reject)=>pending.set(file.name,{file,resolve,reject}));
        }});
        globalThis.__deadwallReliabilityFiles={
          pending:()=>[...pending.keys()],
          async release(name,reject=false){
            const item=pending.get(name);if(!item)throw new Error('Missing delayed file: '+name);pending.delete(name);
            if(reject){item.reject(new Error('Fixture: lecture locale ancienne refusée'));return;}
            try{item.resolve(await original.call(item.file));}catch(error){item.reject(error);}
          },
          restore(){
            for(const item of pending.values())item.reject(new Error('Fixture cleanup'));pending.clear();
            if(descriptor)Object.defineProperty(prototype,'text',descriptor);else delete prototype.text;
            return prototype.text===original&&Boolean(Object.getOwnPropertyDescriptor(prototype,'text'))===Boolean(descriptor);
          }
        };
      });
      report.fixtures.push({kind:'file-read-order',method:'File.prototype.text différé uniquement pour les noms deadwall-reliability-delay-* ; fichiers sélectionnés via le vrai input, octets lus avec la méthode native, descripteur restauré en fin de contrôle.',
        waveMetadata:[3,9,8,11,12],note:'Les numéros de vague des fichiers sont des fixtures d’identification ; aucune de ces vagues n’est déclarée jouée ou survécue.'});
      const source=await page.evaluate(()=>JSON.parse(JSON.stringify(DEADWALL.serialize())));
      const payload=wave=>JSON.stringify({...source,wave});
      const firstName='deadwall-reliability-delay-first-A.json',beforeImport=await state();
      await upload(firstName,payload(3));await waitPending(firstName);
      await upload('deadwall-reliability-latest-B.json',payload(9));await previewWave(9);
      check('dernier fichier B affiché, confirmation seule focalisée',await page.evaluate(()=>document.activeElement.id==='settingsImportConfirm'));
      await settleFile(firstName);
      check('ancienne lecture A ne remplace ni aperçu B ni focus',await page.locator('#settingsImportSummary').innerText().then(text=>text.startsWith('Vague 9 '))&&await page.evaluate(()=>document.activeElement.id==='settingsImportConfirm'));
      check('sélection et lectures ne modifient ni cité ni sauvegarde',await unchanged(beforeImport));
      check('aperçu import sans débordement',await settingsFits());
      await page.locator('#settingsImportReview').scrollIntoViewIfNeeded();await shot('04-apercu-dernier-fichier-B');
      await page.locator('#settingsImportConfirm').click();await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.wave===9);
      check('confirmation UI importe uniquement le dernier fichier B',await page.evaluate(()=>!DEADWALL.paused&&document.getElementById('settingsModal').classList.contains('hidden')&&DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)).wave===9));
      await page.locator('#pauseButton').click();await page.locator('#pauseSettingsButton').click();
      const closedName='deadwall-reliability-delay-closed-A.json';
      await upload(closedName,payload(8));await waitPending(closedName);
      check('input vidé immédiatement pendant la lecture, File capturé conservé',await page.locator('#settingsImportFile').evaluate(input=>input.value===''&&input.files.length===0));
      await page.locator('#settingsClose').click();
      const closed=await page.evaluate(()=>({focus:document.activeElement.id,status:document.getElementById('settingsStatus').textContent}));
      await settleFile(closedName);
      check('lecture terminée après fermeture ne vole pas le focus et ne rouvre rien',await page.evaluate(before=>document.getElementById('settingsModal').classList.contains('hidden')&&document.getElementById('settingsImportReview').classList.contains('hidden')&&document.activeElement.id===before.focus&&document.getElementById('settingsStatus').textContent===before.status,closed));
      await page.locator('#pauseSettingsButton').click();
      check('réouverture sans ancien aperçu importable',await page.locator('#settingsImportReview').isHidden()&&await page.evaluate(()=>DEADWALL.wave===9));
      await upload(closedName,payload(8));await waitPending(closedName);
      check('même nom resélectionné via le vrai input après fermeture',await page.locator('#settingsImportFile').evaluate(input=>input.value===''&&input.files.length===0));
      await settleFile(closedName);await previewWave(8);await page.locator('#settingsImportCancel').click();
      check('annulation vide le sélecteur sans remplacer la cité',await page.locator('#settingsImportFile').evaluate(input=>input.value===''&&input.files.length===0)&&await page.evaluate(()=>DEADWALL.wave===9));
      const rejectedName='deadwall-reliability-delay-rejected-A.json';
      await upload(rejectedName,payload(3));await waitPending(rejectedName);
      await upload('deadwall-reliability-valid-B.json',payload(11));await previewWave(11);
      const recentStatus=await page.locator('#settingsStatus').innerText();await settleFile(rejectedName,true);
      check('erreur ancienne ignorée, aperçu B et focus conservés',await page.locator('#settingsStatus').innerText().then(text=>text===recentStatus)&&await page.locator('#settingsImportSummary').innerText().then(text=>text.startsWith('Vague 11 '))&&await page.evaluate(()=>document.activeElement.id==='settingsImportConfirm'));
      await page.locator('#settingsImportCancel').click();
      check('annulation garde la campagne B précédemment confirmée',await page.evaluate(()=>DEADWALL.wave===9&&document.activeElement.id==='settingsImport'));
      const cancelledName='deadwall-reliability-delay-cancelled-A.json',beforeCancel=await state();
      await upload(cancelledName,payload(3));await waitPending(cancelledName);
      await upload('deadwall-reliability-cancelled-B.json',payload(12));await previewWave(12);await page.locator('#settingsImportCancel').click();
      await settleFile(cancelledName);
      check('annuler interdit toute réapparition tardive de A',await page.locator('#settingsImportReview').isHidden()&&await page.evaluate(()=>document.activeElement.id==='settingsImport'&&document.getElementById('settingsStatus').textContent==='Import annulé.'));
      check('annulation concurrente préserve les octets de sauvegarde',await unchanged(beforeCancel));
      await page.locator('#settingsImport').scrollIntoViewIfNeeded();await shot('05-import-annule');
      check('File.prototype.text restauré exactement',await restoreFileFixture());report.filePrototypeRestored=true;
      await page.locator('#settingsClose').click();await page.locator('#quitButton').click();await page.reload({waitUntil:'networkidle'});await page.waitForFunction(ready);await page.locator('#continueButton').click();
      check('reprise finale conserve B, réanimation et survivant accueilli',await page.evaluate(id=>DEADWALL.wave===9&&!DEADWALL.player.dead&&DEADWALL.player.downTimer===0&&DEADWALL.player.carry.wood===10&&DEADWALL.units.some(u=>u.id===id),admittedId));
      await shot('06-jeu-repris');
      check('aucune erreur console, runtime, HTTP ou réseau',report.errors.length===0&&report.httpErrors.length===0&&report.requestFailures.length===0);
      report.pass=true;
    }catch(error){report.pass=false;report.failure=error.stack;await shot('failure').catch(()=>{});console.error(viewport.name+': '+error.message);}
    finally{
      if(!page.isClosed())await restoreFileFixture().then(restored=>{report.filePrototypeRestored=restored;if(!restored){report.pass=false;report.errors.push('File.prototype.text restoration failed');}}).catch(error=>{report.pass=false;report.errors.push('File fixture cleanup: '+error.message);});
      await context.close();
    }
  }
}finally{await browser.close();}
const scope='Six contextes vierges. Réanimation attendue huit secondes actives via la boucle RAF, après injection explicite de murs terminés, cargaison, phase calme prolongée et dommages. Déplacement clavier, sauvegarde, export téléchargé, reprise et choix d’accueil utilisent les véritables contrôles. Incident et numéros de vague des fichiers préparés pour identification, sans parcours naturel ni vagues réellement survécues. Fichiers sélectionnés par le vrai input, ordre des lectures et rejet retardés via File.prototype.text puis descripteur restauré. Captures brutes à inspecter humainement ; aucune certification commerciale, conformité accessibilité globale, performance ou test matériel tactile/manette déduite de ces résultats.';
await fs.writeFile(path.join(output,'report.json'),JSON.stringify({date:new Date().toISOString(),base,label,scope,reports},null,2));
console.log(JSON.stringify(reports.map(({viewport,checks,pass,failure,errors,httpErrors,requestFailures,filePrototypeRestored})=>({viewport,checks:checks.length,pass,failure:failure?.split('\n')[0],errors,httpErrors,requestFailures,filePrototypeRestored})),null,2));
if(reports.some(report=>!report.pass))process.exitCode=1;
