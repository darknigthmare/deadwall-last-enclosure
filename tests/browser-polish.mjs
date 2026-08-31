// Prepared runner only: browser execution requires project approval.
// The environment guard records that prerequisite; it is not approval itself.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

if(process.env.DEADWALL_QA_BROWSER_APPROVED!=='1')throw new Error('Browser QA not started: obtain approval, then set DEADWALL_QA_BROWSER_APPROVED=1.');
const require=createRequire(import.meta.url),{chromium}=require(process.env.DEADWALL_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)),base=process.env.DEADWALL_QA_URL||'http://127.0.0.1:4322';
const label=(process.env.DEADWALL_QA_LABEL||'r12-'+new Date().toISOString()).replace(/[^a-zA-Z0-9_-]/g,'_');
const output=path.join(process.env.DEADWALL_QA_OUTPUT_ROOT||path.join(root,'artifacts'),'completion-qa',label+'-polish');
const variants=[
  {name:'desktop',width:1440,height:900},{name:'laptop',width:1280,height:720},
  {name:'mobile',width:390,height:844,touch:true},{name:'small-mobile',width:320,height:640,touch:true},
  {name:'tablet',width:1024,height:768,touch:true},{name:'landscape',width:844,height:390,touch:true}
],reports=[];
const ready=()=>globalThis.DEADWALL?.scenarioUI&&DEADWALL.structureActionStatus&&DEADWALL.confirmDemolition&&
  DEADWALL.art?.diagnostics.ready.length===Object.keys(DeadwallArt.ASSETS).length&&!DEADWALL.art.diagnostics.failed.length;
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.DEADWALL_CHROMIUM||undefined,headless:true});
try{
  for(const viewport of variants){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,deviceScaleFactor:1});
    const page=await context.newPage(),report={viewport,checks:[],errors:[],httpErrors:[],requestFailures:[],screenshots:[],fixtures:[],observations:{}};reports.push(report);
    page.setDefaultTimeout(20000);
    page.on('pageerror',error=>report.errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
    page.on('response',response=>{if(response.status()>=400)report.httpErrors.push({status:response.status(),url:response.url()});});
    page.on('requestfailed',request=>report.requestFailures.push({url:request.url(),failure:request.failure()?.errorText}));
    page.on('dialog',async dialog=>{report.errors.push('Unexpected dialog: '+dialog.message());await dialog.dismiss();});
    const check=(name,condition=true)=>{assert.ok(condition,name);report.checks.push(name);};
    const frames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const shot=async name=>{await frames();const file=viewport.name+'-'+name+'.png';await page.screenshot({path:path.join(output,file)});report.screenshots.push(file);};
    const focusState=()=>page.evaluate(()=>{
      const node=document.activeElement,box=node?.getBoundingClientRect(),x=box?box.x+box.width/2:-1,y=box?box.y+box.height/2:-1,hit=document.elementFromPoint(x,y);
      return{id:node?.id,visible:!!box&&box.width>0&&box.height>0&&x>=0&&y>=0&&x<innerWidth&&y<innerHeight&&
        !node.closest('[inert],.hidden')&&(hit===node||node.contains(hit)),box:box?{x:box.x,y:box.y,width:box.width,height:box.height}:null};
    });
    const panelFits=()=>page.locator('#rightPanel').evaluate(panel=>{
      const box=panel.getBoundingClientRect();
      return box.x>=-1&&box.y>=-1&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1&&panel.scrollWidth<=panel.clientWidth+1&&
        [...panel.querySelectorAll('.maintenance-quotes,.demolition-review,.selection-actions')].every(node=>node.scrollWidth<=node.clientWidth+1);
    });
    try{
      const response=await page.goto(base,{waitUntil:'networkidle'});check('document public HTTP 200',response.status()===200);await page.waitForFunction(ready);
      await page.locator('#startScenario').selectOption('classic');await page.locator('#mapSeed').fill('17117');await page.locator('#newGameButton').click();
      await page.waitForFunction(()=>DEADWALL.state==='playing'&&!DEADWALL.paused);
      report.fixtures.push(await page.evaluate(()=>{
        const g=DEADWALL,node=g.world.nodes.find(candidate=>candidate.type==='wood');
        g.releaseInputs();g.cancelPlacement();g.setBuildCollapsed(true);g.phaseTime=9999;g.units=[];
        g.player.x=node.x;g.player.y=node.y;g.camera.x=node.x;g.camera.y=node.y;g.player.carry=DeadwallCore.makeBag();
        g.objectiveIndex=0;g.objectiveProgress=0;g.depositedResources=0;g.updateUI();
        globalThis.__deadwallPolish={gatherStart:g.elapsed,counters:[],progress:[],escapeEvents:[]};
        addEventListener('keydown',event=>{if(event.code==='Escape')globalThis.__deadwallPolish.escapeEvents.push({repeat:event.repeat});});
        return{kind:'manual-collection-isolation',nodeId:node.id,position:{x:node.x,y:node.y},phaseTime:9999,removedWorkers:true,
          note:'Position/caméra et compteur préparés ; équipe retirée pour isoler le portage manuel. Aucun temps, rendement ou progrès avancé par le test.'};
      }));
      await page.locator('#game').focus();await page.keyboard.down('KeyE');
      try{
        await page.waitForFunction(()=>{
          const g=DEADWALL,f=globalThis.__deadwallPolish;f.counters.push(document.getElementById('objectiveCounter').textContent);f.progress.push(g.objectiveProgress);
          return g.elapsed-f.gatherStart>=1.2&&g.player.carry.wood>=6;
        });
      }finally{await page.keyboard.up('KeyE');}
      report.observations.collection=await page.evaluate(()=>({carried:DEADWALL.player.carry.wood,deposited:DEADWALL.depositedResources,counters:globalThis.__deadwallPolish.counters,progress:globalThis.__deadwallPolish.progress}));
      check('E récolte par la vraie boucle RAF sans faire osciller le compteur de dépôt',report.observations.collection.carried>=6&&report.observations.collection.deposited===0&&
        report.observations.collection.counters.length>3&&report.observations.collection.counters.every(value=>value==='0 / 30')&&report.observations.collection.progress.every(value=>value===0));
      await page.locator('#objectiveCounter').scrollIntoViewIfNeeded();await shot('01-tutoriel-recolte-non-deposee');

      report.fixtures.push(await page.evaluate(()=>{
        const g=DEADWALL,core=g.core();g.releaseInputs();g.world.nodes=[];g.player.x=core.x+80;g.player.y=core.y;g.camera.x=g.player.x;g.camera.y=g.player.y;
        g.player.carry=DeadwallCore.makeBag({wood:10});g.resources.wood=g.storage;
        globalThis.__deadwallPolish.fullStart=g.elapsed;
        return{kind:'full-depot',wood:g.resources.wood,capacity:g.storage,carriedWood:10,removedNodes:true,
          note:'Stock saturé et sac préparés au dépôt ; aucun autre travail disponible. ACTION est ensuite déclenchée par clavier réel.'};
      }));
      await page.locator('#game').focus();await page.keyboard.down('KeyE');
      try{await page.waitForFunction(()=>DEADWALL.elapsed-globalThis.__deadwallPolish.fullStart>=.3&&DEADWALL.interactionText.startsWith('Stockage plein'));}
      finally{await page.keyboard.up('KeyE');}
      check('stock plein annoncé, ressources et cargaison conservées après E',await page.evaluate(()=>DEADWALL.resources.wood===DEADWALL.storage&&DEADWALL.player.carry.wood===10&&DEADWALL.depositedResources===0));
      check('message de saturation effectivement visible dans le HUD',await page.locator('#interactionHint').isVisible()&&await page.locator('#interactionHint span').innerText().then(text=>text.startsWith('Stockage plein')));
      await shot('02-depot-sature');
      report.fixtures.push(await page.evaluate(()=>{
        const g=DEADWALL;const placed=g.placeOne('woodWall',66,64);if(!placed)throw new Error('Site fixture unavailable');
        const wall=[...g.world.buildings.values()].find(building=>building.type==='woodWall');g.resources.wood=g.storage;
        globalThis.__deadwallPolish.site={id:wall.id,progress:wall.progress,start:g.elapsed};
        return{kind:'construction-next-to-full-depot',siteId:wall.id,gx:wall.gx,gy:wall.gy,refilledWood:g.resources.wood,
          note:'Palissade planifiée via placeOne puis réserve remise au plafond pour reproduire le conflit ; sa construction reste avancée seulement par RAF et E.'};
      }));
      await page.locator('#game').focus();await page.keyboard.down('KeyE');
      try{await page.waitForFunction(()=>{const f=globalThis.__deadwallPolish.site;return DEADWALL.world.buildings.get(f.id).progress>=f.progress+.2;},null,{timeout:5000});}
      finally{await page.keyboard.up('KeyE');}
      report.observations.construction=await page.evaluate(()=>{
        const g=DEADWALL,f=globalThis.__deadwallPolish.site,b=g.world.buildings.get(f.id);
        return{progress:b.progress,delta:b.progress-f.progress,simulationSeconds:g.elapsed-f.start,buildTime:b.def.buildTime,hint:g.interactionText,carry:g.player.carry.wood,stock:g.resources.wood,capacity:g.storage};
      });
      const built=report.observations.construction;
      check('E construit près du dépôt plein au-delà du seul progrès passif',built.delta>.2&&built.delta>built.simulationSeconds*.075/built.buildTime+.1&&built.hint.startsWith('Construire')&&built.carry===10&&built.stock===built.capacity);
      await shot('03-chantier-accessible-stock-plein');

      await page.locator('#game').focus();await page.keyboard.down('Escape');await frames();
      const pausedElapsed=await page.evaluate(()=>DEADWALL.elapsed);
      try{for(let repeat=0;repeat<4;repeat++)await page.keyboard.down('Escape');await frames();}
      finally{await page.keyboard.up('Escape');}
      report.observations.escapeEvents=await page.evaluate(()=>globalThis.__deadwallPolish.escapeEvents.slice());
      check('clavier natif émet une première pression puis des répétitions Échap',report.observations.escapeEvents.length===5&&!report.observations.escapeEvents[0].repeat&&report.observations.escapeEvents.slice(1).every(event=>event.repeat));
      check('Échap maintenu garde la pause et le temps exactement figé',await page.evaluate(time=>DEADWALL.paused&&DEADWALL.activeOverlay===DEADWALL.ui.pauseMenu&&DEADWALL.elapsed===time,pausedElapsed));
      await page.locator('#pauseSettingsButton').click();await page.keyboard.down('Escape');
      try{await page.keyboard.down('Escape');await page.keyboard.down('Escape');await frames();}
      finally{await page.keyboard.up('Escape');}
      check('Échap répété ferme seulement les options sans traverser la pause',await page.evaluate(()=>DEADWALL.paused&&DEADWALL.activeOverlay===DEADWALL.ui.pauseMenu&&document.getElementById('settingsModal').classList.contains('hidden')));
      report.observations.pauseFocus=await focusState();check('focus de retour options visible après deux RAF',report.observations.pauseFocus.visible);
      await shot('04-pause-echap-maintenu');await page.keyboard.press('Escape');await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);

      report.fixtures.push(await page.evaluate(()=>{
        const g=DEADWALL,Building=g.core().constructor;g.releaseInputs();g.cancelPlacement();
        for(const b of [...g.world.buildings.values()])if(b.type!=='core'){g.world.remove(b);b.dead=true;}
        const wall=new Building(g.nextId++,'woodWall',70,64,0,1);g.world.add(wall);g.damageBuilding(wall,180);
        g.player.carry=DeadwallCore.makeBag();g.resources=DeadwallCore.makeBag({wood:200,scrap:200,stone:100,food:100,fuel:45,ammo:180,medicine:12});
        g.setBuildCollapsed(true);g.selectBuilding(wall);g.refreshMetrics(true);g.updateUI();
        globalThis.__deadwallPolish.wallId=wall.id;
        return{kind:'maintenance-wall',wallId:wall.id,health:wall.health,maxHealth:wall.maxHealth,resources:{...g.resources},
          note:'Mur achevé ajouté puis endommagé via damageBuilding et stocks préparés. Sélection par API ; réparation et démontage exclusivement par vrais boutons.'};
      }));
      const repair=await page.evaluate(()=>{const g=DEADWALL;return{cost:g.structureActionStatus('repair').cost,stocks:{...g.resources},quote:DeadwallCore.resourceText(g.structureActionStatus('repair').cost)};});
      await page.locator('#selectionRepairQuote').scrollIntoViewIfNeeded();check('coût de réparation affiché avant action',await page.locator('#selectionRepairQuote').innerText().then(text=>text.includes(repair.quote)));
      check('devis de réparation relié au bouton accessible',await page.locator('#repairSelected').getAttribute('aria-describedby')==='selectionRepairQuote');
      check('devis et sélection sans débordement horizontal',await panelFits());await shot('05-devis-reparation');
      await page.locator('#repairSelected').click();await page.waitForFunction(()=>{const b=DEADWALL.world.buildings.get(globalThis.__deadwallPolish.wallId);return b.health===b.maxHealth;});
      check('vrai clic répare au coût exact sans double débit',await page.evaluate(before=>{
        const g=DEADWALL;return Object.entries(before.cost).every(([key,cost])=>Math.abs(g.resources[key]-(before.stocks[key]-cost))<1e-8)&&document.getElementById('repairSelected').disabled;
      },repair));
      const beforeDemolition=await page.evaluate(()=>({wood:DEADWALL.resources.wood,buildings:DEADWALL.world.buildings.size}));
      await page.locator('#demolishSelected').click();await frames();
      check('premier clic ouvre la révision sans détruire ou rembourser',await page.evaluate(before=>Boolean(DEADWALL.world.buildings.get(globalThis.__deadwallPolish.wallId))&&DEADWALL.resources.wood===before.wood&&DEADWALL.world.buildings.size===before.buildings&&!document.getElementById('demolitionReview').classList.contains('hidden')&&document.getElementById('demolishSelected').getAttribute('aria-expanded')==='true',beforeDemolition));
      report.observations.demolitionFocus=await focusState();await shot('06-demolition-focus-conserver');
      check('la confirmation donne un focus visible à CONSERVER après deux RAF',report.observations.demolitionFocus.id==='demolitionCancel'&&report.observations.demolitionFocus.visible);
      check('révision de démontage sans débordement horizontal',await panelFits());
      await page.locator('#demolitionCancel').click();await frames();
      check('CONSERVER annule sans mutation et rend le focus au bouton',await page.evaluate(before=>!DEADWALL.pendingDemolition&&Boolean(DEADWALL.world.buildings.get(globalThis.__deadwallPolish.wallId))&&DEADWALL.resources.wood===before.wood&&document.getElementById('demolitionReview').classList.contains('hidden')&&document.activeElement.id==='demolishSelected',beforeDemolition));
      await page.locator('#demolishSelected').click();
      const dismantle=await page.evaluate(()=>({wood:DEADWALL.resources.wood,refund:DEADWALL.structureActionStatus('demolish').refund.wood,cap:DEADWALL.structureActionStatus('demolish').cap}));
      await page.locator('#demolitionConfirm').click();await frames();
      check('DÉMONTER détruit une seule structure et crédite seulement le remboursement annoncé',await page.evaluate(before=>!DEADWALL.world.buildings.has(globalThis.__deadwallPolish.wallId)&&DEADWALL.resources.wood===Math.min(before.cap,before.wood+before.refund)&&!DEADWALL.pendingDemolition,dismantle));
      report.observations.afterDemolitionFocus=await focusState();check('après démontage le focus revient au terrain',report.observations.afterDemolitionFocus.id==='game');

      report.fixtures.push(await page.evaluate(()=>{
        const g=DEADWALL,warehouse=new(g.core().constructor)(g.nextId++,'warehouse',70,70,0,1);g.world.add(warehouse);g.refreshMetrics(true);
        g.resources.wood=900;g.selectBuilding(warehouse);g.updateUI();globalThis.__deadwallPolish.warehouseId=warehouse.id;
        return{kind:'warehouse-capacity-loss',warehouseId:warehouse.id,wood:900,capacity:g.storage,
          note:'Entrepôt achevé et 900 bois préparés pour vérifier une perte de capacité de 1100 à 500 ; aucune production naturelle revendiquée.'};
      }));
      await page.locator('#demolishSelected').click();await frames();
      const warehouseSummary=await page.locator('#demolitionSummary').innerText();report.observations.warehouseSummary=warehouseSummary;
      check('entrepôt annonce capacité restante et excédent réellement perdu avant confirmation',warehouseSummary.includes('Capacité restante : 500 par ressource.')&&warehouseSummary.includes('Excédent perdu : B 400.'));
      check('entrepôt saturé ne promet pas un remboursement de bois impossible',await page.evaluate(()=>{const q=DEADWALL.structureActionStatus('demolish');return q.cap===500&&q.refund.wood===0&&q.lost.wood===400;}));
      await page.locator('#demolitionSummary').scrollIntoViewIfNeeded();check('devis long sans débordement horizontal',await panelFits());await shot('07-entrepot-perte-capacite');
      await page.locator('#demolitionCancel').click();
      check('annuler conserve entrepôt, capacité et stock excédentaire',await page.evaluate(()=>DEADWALL.world.buildings.has(globalThis.__deadwallPolish.warehouseId)&&DEADWALL.storage===1100&&DEADWALL.resources.wood===900));
      report.fixtures.push(await page.evaluate(()=>{DEADWALL.selectBuilding(DEADWALL.core());DEADWALL.updateUI();return{kind:'core-selection',note:'Sélection du centre par API pour vérifier les restrictions visibles ; aucune destruction appelée.'};}));
      await page.locator('#demolishSelected').scrollIntoViewIfNeeded();check('centre indémontable, bouton désactivé avec motif',await page.locator('#demolishSelected').isDisabled()&&await page.locator('#demolishSelected').getAttribute('title').then(text=>text.includes('ne peut pas être démonté')));
      await shot('08-centre-protege');
      check('aucune erreur console, runtime, HTTP ou requête',report.errors.length===0&&report.httpErrors.length===0&&report.requestFailures.length===0);
      report.pass=true;
    }catch(error){report.pass=false;report.failure=error.stack;await shot('failure').catch(()=>{});console.error(viewport.name+': '+error.message);}
    finally{await page.keyboard.up('KeyE').catch(()=>{});await page.keyboard.up('Escape').catch(()=>{});await context.close();}
  }
}finally{await browser.close();}
const scope='Six contextes vierges, graine17117 et départ classique. Positions, stocks, équipe, calme et structures préparés sont décrits dans chaque fixture. La récolte et le chantier avancent par RAF et clavier réel ; aucune boucle update manuelle. Réparation, ouverture/annulation/confirmation du démontage et navigation options utilisent les vrais contrôles. Le maintien d’Échap est émis avec keyboard.down répété, sans événement synthétique injecté. Captures et observations de focus après deux RAF. Entrées clavier/souris à toutes les tailles : aucune certification tactile matérielle, d’équilibrage humain, de PWA, de FPS ni d’accessibilité exhaustive.';
await fs.writeFile(path.join(output,'report.json'),JSON.stringify({date:new Date().toISOString(),base,label,scope,reports},null,2));
console.log(JSON.stringify(reports.map(({viewport,checks,pass,failure,errors,httpErrors,requestFailures})=>({viewport,checks:checks.length,pass,failure:failure?.split('\n')[0],errors,httpErrors,requestFailures})),null,2));
if(reports.some(report=>!report.pass))process.exitCode=1;
