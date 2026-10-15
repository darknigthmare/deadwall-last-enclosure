import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
const h=await createHarness('prescriptions161','Real new-game, pause, command and atlas controls. Four emulated viewports; source prescriptions are not proof that every architecture is spawned.');h.report.profiles=[];
try{
 for(const v of [{name:'desktop',width:1440,height:900},{name:'laptop',width:1280,height:720},{name:'mobile',width:390,height:844,touch:true},{name:'landscape',width:844,height:390,touch:true}]){
  const context=await h.browser.newContext({viewport:{width:v.width,height:v.height},hasTouch:!!v.touch,isMobile:!!v.touch,serviceWorkers:'block'}),page=await context.newPage(),report={viewport:v};h.report.profiles.push(report);
  const {check,screenshot,errors}=recorder(page,report,h.output,v.name+'-');page.setDefaultTimeout(45000);
  try{
   await page.goto(h.base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page);
   report.identity=await page.evaluate(()=>({id:DEADWALL.runId,rows:DEADWALL.profile.get().recentRuns.map(r=>({id:r.runId,seed:r.seed}))}));
   check('One new campaign produces exactly one final history identity',report.identity.rows.length===1&&report.identity.rows[0].id===report.identity.id&&report.identity.rows[0].seed===17117);
   await page.locator('#campaignIntro132Skip').click();await page.locator('#pauseButton').click();await page.locator('#pauseCommandButton').click();await page.locator('#commandTab-field').click();await page.getByRole('button',{name:'ATLAS & GUIDE',exact:true}).click();
   await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill('réfrigérateur');
   const card=page.locator('[data-codex-id="programme-DW-0001"]');await card.waitFor();
   const stable=()=>page.evaluate(()=>{const s=DEADWALL.serialize();delete s.timestamp;return JSON.stringify(s);});const before=await stable();
   const snapshot=()=>card.evaluate(node=>{const details=node.querySelector(':scope > details');return {
    sections:[...details.querySelectorAll(':scope > section')].map(section=>({
     preview:section.hasAttribute('data-codex-plan165'),id:section.dataset.codexPlan165||null,heading:section.querySelector(':scope > h5')?.textContent||'',
     props:section.querySelectorAll('.codex-source-prop161').length,content:section.hasAttribute('data-codex-plan165')?null:section.innerHTML,
     controls:section.hasAttribute('data-codex-plan165')?{buttons:section.querySelectorAll('button').length,canvases:section.querySelectorAll('canvas').length}:null
    })),props:details.querySelectorAll('.codex-source-prop161').length,prescriptions:details.querySelectorAll('.codex-prescription161').length};});
   await card.locator('summary').click();await card.locator('.codex-prescription161').waitFor();await card.locator('[data-codex-plan165]').waitFor();
   const expected=await page.evaluate(()=>{const d=DeadwallCodex3000Runtime.describe('DW-0001');return {props:d.rooms.reduce((n,r)=>n+r.authoredProps.length,0),rooms:d.rooms.length,headings:d.rooms.map(r=>r.name+' · '+(r.exterior?'Extérieur':'Intérieur')),propsByRoom:d.rooms.map(r=>r.authoredProps.length),access:d.access.length};});
   check('Every authored furniture specification is exposed once',await card.locator('.codex-source-prop161').count()===expected.props);
   const text=await card.innerText();check('Dimensions, orientation, anchors and source loot status are explicit',text.includes('2,1 × 0,8 × 1,1 m')&&text.includes('Ancrage et support')&&text.includes('Orientation')&&text.includes('pas un stock supplémentaire'));
   check('Access widths, garden contents and non-certification boundary are legible',text.includes('1,35 m minimum proposé')&&text.includes('récupérateur d’eau')&&text.includes('pas une certification réglementaire'));
   check('Source rooms are not silently marked as spawned architectures',text.includes('ne prouvent ni une présence sur la carte'));
   // The lazy plan inspector is its own <section>, not a second source room.
   // Wait for both owners, then check their exact identities and contents separately.
   const original=await snapshot(),rooms=original.sections.filter(s=>!s.preview),previews=original.sections.filter(s=>s.preview);
   report.markup={rooms:rooms.length,props:original.props,previewIds:previews.map(p=>p.id),reopens:[]};
   check('Source room titles and per-room furniture counts match their authored order',rooms.length===expected.rooms&&JSON.stringify(rooms.map(r=>r.heading))===JSON.stringify(expected.headings)&&JSON.stringify(rooms.map(r=>r.props))===JSON.stringify(expected.propsByRoom));
   check('Exactly one separately identified recipe inspector and one prescription block',previews.length===1&&previews[0].id==='DW-0001'&&previews[0].controls.buttons===1&&previews[0].controls.canvases===1&&original.prescriptions===1);
   for(let pass=0;pass<3;pass++){
    await card.locator(':scope > details > summary').click();await page.waitForFunction(()=>!document.querySelector('[data-codex-id="programme-DW-0001"] > details').open);
    await card.locator(':scope > details > summary').click();await page.waitForFunction(()=>document.querySelector('[data-codex-id="programme-DW-0001"] > details').open);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
    const reopened=await snapshot();report.markup.reopens.push({rooms:reopened.sections.filter(s=>!s.preview).length,props:reopened.props,previews:reopened.sections.filter(s=>s.preview).length});
    check('Reopening '+(pass+1)+' does not duplicate or change any source room, furniture or recipe inspector',JSON.stringify(reopened)===JSON.stringify(original));
   }
   check('Reading and reopening leaves the saved campaign unchanged',await stable()===before);
   const fits=await card.evaluate(node=>({card:node.scrollWidth<=node.clientWidth+1,document:document.documentElement.scrollWidth<=innerWidth+1}));check('Specifications do not cause horizontal overflow',fits.card&&fits.document);
   await card.locator('.codex-source-prop161').first().scrollIntoViewIfNeeded();await screenshot('furniture');
   await page.locator('#worldCodexSearch').fill('');check('Catalogue remains paginated',await page.locator('#worldCodexResults article').count()<=36);
   check('No browser errors',errors()===0);report.pass=true;
  }catch(e){report.pass=false;report.failure=e.stack;await screenshot('failure').catch(()=>{});}finally{await context.close();console.log(JSON.stringify({viewport:v.name,pass:report.pass,checks:report.checks.length,failure:report.failure?.split('\n')[0]}));}
 }
}finally{h.report.pass=h.report.profiles.length===4&&h.report.profiles.every(p=>p.pass);await h.close();await h.finish();}
if(!h.report.pass)process.exitCode=1;
