import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.DEADWALL_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)),output=path.join(root,'artifacts','ux-qa'),base=process.env.DEADWALL_QA_URL||'http://127.0.0.1:4322';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.DEADWALL_CHROMIUM||undefined,headless:true});
const reports=[];
const variants=[{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844,touch:true},{name:'small-mobile',width:320,height:640,touch:true},{name:'landscape',width:844,height:390,touch:true}];
for(const variant of variants){
  const context=await browser.newContext({viewport:{width:variant.width,height:variant.height},hasTouch:!!variant.touch,isMobile:!!variant.touch,deviceScaleFactor:1,acceptDownloads:true,serviceWorkers:'block'});
  const page=await context.newPage(),report={viewport:variant,checks:[],errors:[],screenshots:[]};reports.push(report);
  page.on('pageerror',error=>report.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
  const check=(name,value=true)=>{assert.ok(value,name);report.checks.push(name);};
  const shot=async name=>{const file=`${variant.name}-${name}.png`;await page.screenshot({path:path.join(output,file),fullPage:false});report.screenshots.push(file);};
  try{
    await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>globalThis.DEADWALL?.showSettings);
    check('démarrage et contenu réel',await page.locator('#mainMenu').isVisible());await shot('menu');
    await page.locator('#menuSettingsButton').click();await page.locator('#settingsModal').waitFor({state:'visible'});
    const bounds=await page.locator('.settings-card').boundingBox();check('modale dans le viewport',bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=variant.width+1&&bounds.y+bounds.height<=variant.height+1);
    check('champs paramètres sans débordement horizontal',await page.locator('.settings-card').evaluate(card=>{const outer=card.getBoundingClientRect();return card.scrollWidth<=card.clientWidth+1&&[...card.querySelectorAll('fieldset, .settings-row, input:not([hidden]), select')].every(node=>{const box=node.getBoundingClientRect();return box.x>=outer.x&&box.right<=outer.right;});}));
    for(let i=0;i<22;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('#settingsModal'))),true,'le focus quitte les paramètres');}check('focus Tab contenu');
    await page.locator('#settingsVolume').focus();await page.keyboard.press('End');check('volume clavier effectif',await page.evaluate(()=>DEADWALL.settings.volume===1));
    await page.locator('#settingsMotion').check();await page.locator('#settingsContrast').check();await page.locator('#settingsQuality').selectOption('low');
    check('préférences persistées',await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem(DeadwallCore.SETTINGS_KEY));return s.reducedMotion&&s.highContrast&&s.quality==='low';}));
    await page.locator('.settings-card').evaluate(node=>{node.scrollTop=0;});await shot('options');
    await page.keyboard.press('Escape');check('retour au menu après options',await page.locator('#mainMenu').isVisible());
    await page.locator('#newGameButton').click();await page.waitForFunction(()=>DEADWALL.state==='playing'&&!DEADWALL.paused);await shot('jeu');
    await page.locator('#pauseButton').click();await page.locator('#pauseSettingsButton').click();
    const elapsed=await page.evaluate(()=>DEADWALL.elapsed);await page.waitForTimeout(200);check('simulation suspendue dans options',await page.evaluate(time=>DEADWALL.elapsed===time,elapsed));
    const downloadPromise=page.waitForEvent('download');await page.locator('#settingsExport').click();const download=await downloadPromise;const exportedPath=path.join(output,`${variant.name}-export.json`);await download.saveAs(exportedPath);
    const exported=JSON.parse(await fs.readFile(exportedPath,'utf8'));check('export téléchargé valide',exported.version===2&&exported.buildings.some(item=>item.type==='core'));
    const before=await page.evaluate(()=>({wave:DEADWALL.wave,count:DEADWALL.world.buildings.size,save:localStorage.getItem(DeadwallCore.SAVE_KEY)}));
    await page.locator('#settingsImportFile').setInputFiles({name:'corrupt.json',mimeType:'application/json',buffer:Buffer.from('{invalide')});await page.waitForFunction(()=>document.getElementById('settingsStatus').textContent.includes('Import refusé'));
    check('import invalide sans mutation',await page.evaluate(snapshot=>DEADWALL.wave===snapshot.wave&&DEADWALL.world.buildings.size===snapshot.count&&localStorage.getItem(DeadwallCore.SAVE_KEY)===snapshot.save,before));
    const fixture={...exported,wave:3};const upload={name:'deadwall-qa.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))};
    await page.locator('#settingsImportFile').setInputFiles(upload);await page.locator('#settingsImportReview').waitFor({state:'visible'});check('aperçu avant remplacement',await page.evaluate(()=>DEADWALL.wave===1));await shot('import-review');
    await page.locator('#settingsImportCancel').click();check('import annulé',await page.evaluate(()=>DEADWALL.wave===1));
    await page.locator('#settingsImportFile').setInputFiles(upload);await page.locator('#settingsImportReview').waitFor({state:'visible'});await page.locator('#settingsImportConfirm').click();await page.waitForFunction(()=>DEADWALL.wave===3&&!DEADWALL.paused);check('import confirmé sauvegardé',await page.evaluate(()=>JSON.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)).wave===3));
    if(variant.touch){
      if(await page.evaluate(()=>DEADWALL.buildCollapsed))await page.locator('#toggleBuild').click();
      await page.locator('[data-category="defense"]').click();await page.locator('[data-build-id="woodWall"]').click();
      const line=await page.evaluate(()=>{const g=DEADWALL,d=DeadwallCore.BUILDINGS.woodWall;for(let y=Math.ceil(innerHeight*.5);y<innerHeight-70;y+=18)for(let x=36;x<innerWidth-145;x+=18){const end=x+110;if([x,x+55,end].some(px=>document.elementFromPoint(px,y)?.id!=='game'))continue;const cell=px=>({x:DeadwallCore.grid((px-g.width/2)/g.camera.zoom+g.camera.x),y:DeadwallCore.grid((y-g.height/2)/g.camera.zoom+g.camera.y)});const cells=g.world.line(cell(x),cell(end));if(cells.length>=3&&cells.length<=6&&cells.every(c=>g.world.placement(d,c.x,c.y,0).valid))return{x,y,end,count:cells.length};}return null;});
      assert.ok(line,'aucune ligne visible libre pour le test tactile');const buildingsBefore=await page.evaluate(()=>DEADWALL.world.buildings.size),cdp=await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:line.x,y:line.y,id:8}]});
      for(let step=1;step<=5;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:line.x+(line.end-line.x)*step/5,y:line.y,id:8}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);
      check('glisser tactile construit plusieurs murs',await page.evaluate(n=>DEADWALL.world.buildings.size>=n+3,buildingsBefore));
      await page.locator('#touchCommandDrawer summary').click();await page.locator('[data-game-command="cancel"]').click();check('annulation tactile',await page.evaluate(()=>!DEADWALL.selectedBuild));
      if(variant.height>variant.width)check('indication masquée sous le popup Actions portrait',await page.locator('#interactionHint').evaluate(node=>getComputedStyle(node).visibility==='hidden'));
      const zoom=await page.evaluate(()=>DEADWALL.camera.zoom);await page.locator('[data-game-command="zoomIn"]').click();check('zoom tactile',await page.evaluate(old=>DEADWALL.camera.zoom>old,zoom));
      await page.evaluate(()=>{DEADWALL.player.magazine.pistol=2;DEADWALL.player.reload=0;});await page.locator('[data-game-command="reload"]').click();check('rechargement tactile',await page.evaluate(()=>DEADWALL.player.reload>0));await shot('actions');
      await page.locator('#touchCommandDrawer summary').click();await cdp.detach();
      check('indication contextuelle sans chevauchement Actions',await page.evaluate(()=>{
        const hint=document.getElementById('interactionHint'),hidden=hint.classList.contains('hidden');
        hint.classList.remove('hidden');const a=hint.getBoundingClientRect(),b=document.querySelector('#touchCommandDrawer summary').getBoundingClientRect();
        if(hidden)hint.classList.add('hidden');
        return a.right+4<=b.left||a.bottom<=b.top||a.top>=b.bottom;
      }));
      const contextLayout=await page.evaluate(()=>{
        const hint=document.getElementById('interactionHint'),span=hint.querySelector('span'),hidden=hint.classList.contains('hidden'),text=span.textContent;
        hint.classList.remove('hidden');span.textContent='Construire Manufacture de munitions — 99 %';
        const a=hint.getBoundingClientRect(),separate=b=>a.right+4<=b.left||a.left>=b.right+4||a.bottom+4<=b.top||a.top>=b.bottom+4;
        const result={visible:getComputedStyle(hint).visibility==='visible',padClear:[...document.querySelectorAll('#touchControls button')].every(button=>separate(button.getBoundingClientRect())),notificationsClear:separate(document.querySelector('.notifications').getBoundingClientRect())};
        span.textContent=text;if(hidden)hint.classList.add('hidden');return result;
      });
      check('indication longue sans chevauchement des six commandes tactiles',contextLayout.padClear);
      if(variant.height>variant.width){check('indication restaurée après fermeture Actions',contextLayout.visible);check('indication longue distincte des notifications portrait',contextLayout.notificationsClear);}
    }
    await page.evaluate(()=>{const g=DEADWALL;g.units=[];g.resources.fuel=50;g.resources.scrap=50;g.activeCrisis={id:'ammo',wave:4,status:'pending',remaining:60,targetId:0,choice:null};g.setBuildCollapsed(true);g.updateUI();});
    await page.locator('#crisisChoiceA').scrollIntoViewIfNeeded();await shot('crise');await page.locator('#crisisChoiceA').click();
    check('choix de crise accessible par défilement',await page.evaluate(()=>DEADWALL.activeCrisis===null&&DEADWALL.resources.fuel===42&&DEADWALL.resources.scrap===40));
    check('aucune erreur console',report.errors.length===0);report.pass=true;
  }catch(error){report.pass=false;report.failure=error.stack;await shot('failure').catch(()=>{});console.error(`${variant.name}: ${error.message}`);}
  finally{await context.close();}
}
await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify({date:new Date().toISOString(),base,fixtureNote:'Nouvelle partie isolée ; fichier exporté réimporté avec vague=3 ; réserve/crise déterministe et chargeur réduit pour exercer les commandes réelles ; indication de chantier longue temporaire pour mesurer les collisions HUD.',reports},null,2));
console.log(JSON.stringify(reports.map(({viewport,checks,pass,failure,errors})=>({viewport,pass,checks:checks.length,errors,failure:failure?.split('\n')[0]})),null,2));
if(reports.some(report=>!report.pass))process.exitCode=1;
