import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createHarness,recorder,ready,chooseCampaign,activate,openCommand,visibleInPanel} from './browser-qa-common144.mjs';

const harness=await createHarness('codex-inspection2026','Actual author Guide controls on desktop and mobile: source selection, floor observation, walking, wall collision, adjacent stairs, in-memory checkpoint and source changes. Reads compare every paused campaign field before and after. No campaign position, stock, clock, RNG or inspection pose is assigned by this test. The default player title is also checked for absence of author controls.');
const {browser,base,report,output}=harness;
const host='[data-codex-inspection2026="world"]';
const control=name=>host+' [data-inspection2026="'+name+'"]';
const sha=s=>createHash('sha256').update(s).digest('hex');
const state=page=>page.locator(host).evaluate(node=>DeadwallCodexInspectionUI2026.mount(document,node.parentElement).state());
const material=page=>page.evaluate(()=>{const{timestamp,...s}=DEADWALL.serialize();return JSON.stringify(s);});
const views=[{name:'desktop',width:1366,height:900},{name:'mobile',width:390,height:844,touch:true}];
const selected=process.env.DEADWALL_QA_PROFILES?.split(',');
if(selected&&(!selected.length||new Set(selected).size!==selected.length||selected.some(name=>!views.some(v=>v.name===name))))throw Error('Distinct known inspection profiles required');
const profiles=selected?views.filter(v=>selected.includes(v.name)):views;
report.profiles=[];report.pass=false;
async function press(page,name,touch,rec){
 const selector=control(name);await page.locator(selector).scrollIntoViewIfNeeded();
 rec.check(name+' is visible and receives input',(await visibleInPanel(page,selector,'.command-body')).pass);
 await activate(page,selector,touch);
}
try{
 for(const view of profiles){
  const profile={viewport:view};report.profiles.push(profile);
  const context=await browser.newContext({viewport:{width:view.width,height:view.height},hasTouch:!!view.touch,isMobile:!!view.touch,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(30000);const rec=recorder(page,profile,output,view.name+'-');
  try{
   const defaultURL=new URL(base);defaultURL.search='';
   await page.goto(defaultURL.href,{waitUntil:'networkidle'});await ready(page);
   rec.check('Default player entry contains no inspection author panel',await page.locator(host).count()===0);
   await page.goto(base,{waitUntil:'networkidle'});await ready(page);
   await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',view.touch);await openCommand(page,view.touch,'field');
   await activate(page,'#commandPanel-field [data-field-view="world-codex"]',view.touch);
   await page.locator(host+' > summary').scrollIntoViewIfNeeded();await activate(page,host+' > summary',view.touch);
   await page.waitForFunction(()=>document.querySelector('[data-inspection2026="canvas"]')?.dataset.plan==='EXT-MONDE-T065-V01');
   const before=await material(page);
   rec.check('All 80 targets remain visible with thirty-nine available types',await page.locator(control('type')).evaluate(n=>n.options.length===80&&[...n.options].filter(o=>o.textContent.includes('50 plans')).length===39));
   rec.check('All 50 variant identities are selectable',await page.locator(control('variant')+' option').count()===50);
   await page.locator(control('type')).selectOption('EXT-MONDE-T005');
   const start=await state(page);assert.equal(start.planId,'EXT-MONDE-T005-V01');
   await page.locator(control('floor')).selectOption('0');
   rec.check('Observing another level does not move the pedestrian',JSON.stringify(await state(page))===JSON.stringify(start));
   await page.locator(control('view')).selectOption('walk');
   await page.locator(control('canvas')).scrollIntoViewIfNeeded();
   const colors=await page.locator(control('canvas')).evaluate(n=>{const p=n.getContext('2d').getImageData(0,0,n.width,n.height).data,s=new Set();for(let i=0;i<p.length;i+=4*41)s.add(p.slice(i,i+4).join(','));return s.size;});
   rec.check('The real metric canvas renders rooms, walls and equipment',colors>10);
   await rec.screenshot('cargo-walk');
   for(let i=0;i<12;i++)await press(page,'north',view.touch,rec);
   const stopped=await state(page),physical=await page.evaluate(p=>{const scene=DeadwallCodexInspection2026.create('EXT-MONDE-T005',1).scene;return{free:!DeadwallCodexPhysical2026.blocked(scene,p.x,p.y,p.level,.32),blockedLine:!DeadwallCodexPhysical2026.segmentClear(scene,p,{...p,y:p.y-3},p.level,.32)};},stopped.pose);
   rec.check('Repeated walk input stops before a wall without crossing it',start.pose.y-stopped.pose.y<6&&physical.free&&physical.blockedLine&&/arrêté/.test(await page.locator(control('status')).innerText()));
   await press(page,'reset',view.touch,rec);
   rec.check('An adjacent stair is offered at the real entry landing',!await page.locator(control('use-transition')).isDisabled());
   const adjacent=await page.locator(control('transition')).inputValue();await press(page,'use-transition',view.touch,rec);
   const changed=await state(page);profile.transition={id:adjacent,from:start.pose.level,to:changed.pose.level};
   rec.check('Actual stair control moves to an adjacent physical level',Math.abs(changed.pose.level-start.pose.level)===1&&changed.pose.x===start.pose.x&&changed.pose.y===start.pose.y);
   await press(page,'remember',view.touch,rec);const saved=await state(page);
   await press(page,'east',view.touch,rec);rec.check('Actual walk button moves the observer',JSON.stringify((await state(page)).pose)!==JSON.stringify(saved.pose));
   await press(page,'resume',view.touch,rec);rec.check('The inspection checkpoint restores the exact observer and visits',JSON.stringify(await state(page))===JSON.stringify(saved));
   await press(page,'reset',view.touch,rec);
   await page.locator(control('canvas')).focus();
   for(let i=0;i<14;i++)await page.keyboard.press('ArrowRight');
   for(let i=0;i<9;i++)await page.keyboard.press('ArrowUp');
   rec.check('Keyboard walking enters a room through its door',((await state(page)).visitedRooms.length)>start.visitedRooms.length);
   await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot('cargo-room');
   const available=await page.evaluate(()=>[...DeadwallCodexLayouts2026.types]);profile.inspectedTypes=available;
   for(const type of available){
    await page.locator(control('type')).selectOption(type);await page.locator(control('variant')).selectOption('50');
    rec.check(type+' variant50 is built by the visible controls',(await state(page))?.planId===type+'-V50');
   }
   for(const type of ['EXT-MONDE-T053','EXT-MONDE-T054','EXT-MONDE-T055','EXT-MONDE-T056']){
    await page.locator(control('type')).selectOption(type);await page.locator(control('variant')).selectOption('1');await page.locator(control('view')).selectOption('plan');
    await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-industry');
    const layout=await page.evaluate(type=>{const s=DeadwallCodexInspection2026.create(type,1);return{stages:s.author.processFlow.stages.map(n=>n.role),links:s.author.processFlow.links.length,props:s.furnishing.props.length,ok:DeadwallCodexPhysical2026.audit(s.scene).ok,operational:s.author.processFlow.recipesActive};},type);
    rec.check(type+' has a furnished, physically reachable five-stage author layout',layout.ok&&layout.links===4&&layout.stages.join(',')==='receiving,preparation,production,finishing,dispatch'&&layout.props>100&&layout.operational===false);
   }
   for(const type of ['EXT-MONDE-T021','EXT-MONDE-T027','EXT-MONDE-T045','EXT-MONDE-T048']){
    await page.locator(control('type')).selectOption(type);await page.locator(control('variant')).selectOption('1');await page.locator(control('view')).selectOption('plan');
    await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-outdoors');
    const geometry=await page.evaluate(type=>{const s=DeadwallCodexInspection2026.create(type,1);return{areas:s.scene.areas.length,ports:s.author.network.externalPorts.length,ok:DeadwallCodexPhysical2026.audit(s.scene).ok};},type);
    rec.check(type+' gardens and multiple access routes use valid inspection geometry',geometry.ok&&geometry.areas>0&&geometry.ports>=1);
   }
   for(const type of ['EXT-MONDE-T001','EXT-MONDE-T003','EXT-MONDE-T017','EXT-MONDE-T019','EXT-MONDE-T058','EXT-MONDE-T061','EXT-MONDE-T064']){
    await page.locator(control('type')).selectOption(type);await page.locator(control('variant')).selectOption('1');await page.locator(control('view')).selectOption('plan');
    await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-extension');
    const measured=await page.evaluate(type=>{const s=DeadwallCodexInspection2026.create(type,1);return{ok:DeadwallCodexPhysical2026.audit(s.scene).ok,props:s.furnishing.props.length,unknown:s.furnishing.summary.unknownUses,playable:s.author.playable,services:s.furnishing.summary.connectedServices};},type);
    rec.check(type+' exposes a furnished author plan with physical access and no active service',measured.ok&&measured.props>0&&measured.unknown===0&&measured.playable===false&&measured.services===0);
    const closed=await page.locator(control('canvas')).evaluate((canvas,type)=>{
     const s=DeadwallCodexInspection2026.create(type,1).scene,b=s.bounds,r=s.solids.find(r=>r.accessible===false&&!r.roomId),scale=Math.min((canvas.width-80)/b.w,(canvas.height-80)/b.h),bounds=canvas.getBoundingClientRect();
     if(!r)throw Error('No closed volume in '+type);
     return{x:((canvas.width-b.w*scale)/2+(r.x+r.w/2-b.x)*scale)*bounds.width/canvas.width,y:((canvas.height-b.h*scale)/2+(r.y+r.h/2-b.y)*scale)*bounds.height/canvas.height,w:r.w.toFixed(2),h:r.h.toFixed(2)};
    },type);
    await page.locator(control('canvas')).click({position:{x:closed.x,y:closed.y}});
    const details=await page.locator(control('detail')).innerText();
    rec.check(type+' closed volume is selectable at its actual metric footprint',details.includes(closed.w+' × '+closed.h+' m')&&details.includes('fermé et infranchissable'));
   }
   await page.locator(control('type')).selectOption('EXT-MONDE-T009');
   rec.check('An undesigned offshore platform does not receive a fabricated fallback',await state(page)===null&&/PLAN NON PRODUIT/.test(await page.locator(host).innerText()));
   await page.locator(control('type')).selectOption('EXT-MONDE-T065');await page.locator(control('variant')).selectOption('1');await page.locator(control('view')).selectOption('plan');
   await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot('stadium-plan');
   const after=await material(page);profile.campaignBeforeSHA256=sha(before);profile.campaignAfterSHA256=sha(after);
   rec.check('Every saved campaign field is unchanged by the inspection controls',before===after);
   rec.check('No horizontal page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   rec.check('No browser, console, HTTP or request errors',rec.errors()===0);
   profile.pass=true;console.log(JSON.stringify({profile:view.name,pass:true,checks:profile.checks.length}));
  }catch(e){profile.pass=false;profile.failure=e.stack;await rec.screenshot('failure').catch(()=>{});throw e;}
  finally{await context.close();}
 }
 report.pass=report.profiles.length===profiles.length&&report.profiles.every(p=>p.pass);
}finally{await harness.finish();await harness.close();}
