import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHarness,recorder,ready,chooseCampaign,openCommand,activate} from './browser-qa-common144.mjs';
import {armTransaction,readTransaction} from './qa-transaction167.mjs';
const h=await createHarness('ensembles166','Real revision-five depot activation, finite saves and prepared real-world table/seat scenes; not an organic exploration run. Existing stock, actors and geometry unchanged. Mobile views are emulated.');
h.report.profiles=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]){
  const context=await h.browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'}),page=await context.newPage(),profile={viewport};h.report.profiles.push(profile);
  page.setDefaultTimeout(60000);const {check,screenshot,errors}=recorder(page,profile,h.output,viewport.width+'-');
  try{
   await page.goto(h.base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);await activate(page,'#pauseButton',viewport.touch);
   profile.fixture=await page.evaluate(()=>{const g=DEADWALL,point=g.fieldcraft.service(g.player,g.core());if(!point)throw Error('No actual depot service point');const before={x:g.player.x,y:g.player.y};g.player.x=point.x;g.player.y=point.y;g.player.navigation=null;if(!g.friendlyPositionClear(g.player,point.x,point.y))throw Error('Depot fixture collides');return{before,point,assignedFields:['player.x','player.y','player.navigation']};});
   await openCommand(page,viewport.touch);await activate(page,'#expansionFieldTab',viewport.touch);await activate(page,'#expansionGroup-world',viewport.touch);await activate(page,'#expansionTab-world131',viewport.touch);
   const action='#expansionAction-world131-ensembleDetails165';await page.locator(action).scrollIntoViewIfNeeded();check('Table-and-seat composition upgrade is available through the real depot action',await page.locator(action).isEnabled());
   await armTransaction(page,action);
   await activate(page,action,viewport.touch);
   const change=await readTransaction(page,5);profile.transaction=change;
   check('One trusted activation changes only the detail revision, with no added stocks or moved saved objects',change.ok&&change.revision===5&&change.onlyRevision);check('The real action persists revision five and every other field',change.savedRevision===5&&change.storedOnlyRevision);
   await page.evaluate(()=>DEADWALL.worldCodex.open());await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill('DW-0001');const card=page.locator('[data-codex-id="programme-DW-0001"]');await card.getByText('Accès, ressources et précautions',{exact:true}).click();
   await card.getByText('SÉRIES DE MOBILIER — ACTIVATION OPTIONNELLE',{exact:true}).waitFor();check('Programme explains optional series without claiming extra loot',/ni nouveau butin/i.test(await card.innerText()));check('Recipe discloses optional table-and-seat compositions',/COMPOSER TABLES ET ASSISES/.test(await card.innerText()));await screenshot('source-prescription');
   const scenes=await page.evaluate(()=>{const w=DeadwallFrontierWorld.create(17117,8,{detailVersion:5}),subjects=[],types=new Set();for(const p of w.pois){if(types.has(p.type))continue;types.add(p.type);if(w.detailAt(p,0).ensembles165.groups.length>0)subjects.push(p);if(subjects.length===2)break;}
    return subjects.map(p=>{const detail=w.detailAt(p,0),before=JSON.stringify([p,w.plan(p,0),detail]),canvas=document.createElement('canvas');canvas.width=960;canvas.height=820;const c=canvas.getContext('2d'),scale=Math.min(800/(p.w+40),720/(p.h+55));c.fillStyle='#465a3c';c.fillRect(0,0,960,820);c.translate(480,380);c.scale(scale,scale);c.rotate(-p.a);c.translate(-p.x,-p.y);DeadwallFrontierArt.lot(c,p,{world:w,x:p.x,y:p.y,z:0,inside:p.id,taken:{},scale,car:null});return{type:p.type,id:p.id,added:detail.ensembles165.added,groups:detail.ensembles165.groups.length,seats:detail.ensembles165.groups.reduce((n,g)=>n+g.seats,0),navigationChecked:detail.ensembles165.navigationChecked,stocksAbsent:detail.interior.filter(o=>o.ensemble165).every(o=>o.amount===undefined&&o.resource===undefined),unchanged:JSON.stringify([p,w.plan(p,0),w.detailAt(p,0)])===before,png:canvas.toDataURL('image/png')};});});
   check('Two real-world fixtures contain new composed furniture without changing the scene',scenes.length===2&&scenes.every(s=>s.added>0&&s.navigationChecked&&s.stocksAbsent&&s.unchanged));
   for(const [i,scene]of scenes.entries()){await fs.writeFile(path.join(h.output,viewport.width+'-ensembles-'+i+'.png'),Buffer.from(scene.png.split(',')[1],'base64'));delete scene.png;}profile.scenes=scenes;
   await page.reload({waitUntil:'networkidle'});await ready(page);await activate(page,'#continueButton',viewport.touch);await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.frontier.snapshot().detailVersion===5);check('Real Continue restores the saved opt-in revision',true);
   check('Repeated activation is refused',await page.evaluate(()=>DEADWALL.worldOps131.actions().find(a=>a.id==='ensembleDetails165')?.disabled===true));check('No page or HTTP errors',errors()===0);profile.pass=true;
  }catch(e){profile.pass=false;profile.failure=e.stack;await screenshot('failure').catch(()=>{});}finally{await context.close();console.log(JSON.stringify({viewport,pass:profile.pass,checks:profile.checks.length,failure:profile.failure?.split('\n')[0]}));}
 }
}finally{h.report.pass=h.report.profiles.length===3&&h.report.profiles.every(p=>p.pass);await h.close();await h.finish();}
if(!h.report.pass)process.exitCode=1;
