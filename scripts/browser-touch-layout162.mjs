import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
const h=await createHarness('touch-layout162','Real touch toggles and viewport rotation with native and wide fallback fonts. Emulated Chromium; no physical-device certification.');h.report.profiles=[];
try{
 for(const v of [{width:844,height:390},{width:667,height:375},{width:568,height:320},{width:390,height:844}]){
  const context=await h.browser.newContext({viewport:v,hasTouch:true,isMobile:true,serviceWorkers:'block'}),page=await context.newPage(),report={viewport:v};h.report.profiles.push(report);
  const {check,screenshot,errors}=recorder(page,report,h.output,v.width+'-');
  try{
   await page.goto(h.base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page);await page.locator('#campaignIntro132Skip').click();
   report.states=[];
   for(const font of [null,'DejaVu Sans','serif']){
    await page.evaluate(font=>{document.getElementById('urbanTorchHud').style.fontFamily=font||'';},font);
    for(const on of [false,true,false]){
     if(await page.evaluate(()=>DEADWALL.urban.snapshot().flashlight)!==on)await page.locator('#urbanTorchHud').tap();
     await page.waitForFunction(on=>document.getElementById('urbanTorchHud').getAttribute('aria-pressed')===String(on),on);
     const state=await page.evaluate(()=>{
      const button=document.getElementById('urbanTorchHud'),box=button.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(button);
      const controls=[...document.querySelectorAll('#touchControls button')].map(n=>({id:n.id,box:n.getBoundingClientRect().toJSON()}));
      const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      return {on:DEADWALL.urban.snapshot().flashlight,label:button.textContent,font:getComputedStyle(button).font,box:box.toJSON(),text:[...range.getClientRects()].map(r=>r.toJSON()),
       fits:button.scrollWidth<=button.clientWidth+1&&button.scrollHeight<=button.clientHeight+1&&[...range.getClientRects()].every(r=>r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom),
       pointer:document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)?.closest('#urbanTorchHud')===button,
       controlsInside:controls.every(c=>c.box.width>=40&&c.box.height>=40&&c.box.left>=0&&c.box.top>=0&&c.box.right<=innerWidth&&c.box.bottom<=innerHeight),
       overlap:controls.some((a,i)=>controls.slice(i+1).some(b=>hit(a.box,b.box))),field:document.getElementById('hud135Center').getBoundingClientRect().height};
     });
     report.states.push(state);check('Full torch label, real toggle and pointer with '+(font||'native font')+' / '+on,state.on===on&&state.label.includes(on?'ALLUMÉE':'ÉTEINTE')&&state.fits&&state.pointer);
     check('Touch controls are distinct and fit the screen',state.controlsInside&&!state.overlap);
    }
   }
   await screenshot('touch-shelf');
   await page.setViewportSize({width:v.height,height:v.width});await page.setViewportSize(v);
   await page.waitForFunction(()=>!DEADWALL.paused||DEADWALL.activeOverlay?.id==='pauseMenu');
   check('Rotation preserves a single torch control',await page.locator('#urbanTorchHud').count()===1);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   if(await page.locator('#resumeButton').isVisible())await page.locator('#resumeButton').tap();
   for(const on of [true,false]){
    await page.locator('#urbanTorchHud').tap();
    await page.waitForFunction(on=>document.getElementById('urbanTorchHud').getAttribute('aria-pressed')===String(on),on);
    const rotated=await page.locator('#urbanTorchHud').evaluate(button=>{
     const box=button.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(button);
     return {on:DEADWALL.urban.snapshot().flashlight,fits:[...range.getClientRects()].every(r=>r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom),
      pointer:document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)?.closest('#urbanTorchHud')===button};
    });
    check('After rotation the real touch toggle remains readable / '+on,rotated.on===on&&rotated.fits&&rotated.pointer);
   }
   check('No browser errors',errors()===0);report.pass=true;
  }catch(e){report.pass=false;report.failure=e.stack;await screenshot('failure').catch(()=>{});}finally{await context.close();console.log(JSON.stringify({viewport:v,pass:report.pass,checks:report.checks.length,failure:report.failure?.split('\n')[0]}));}
 }
}finally{h.report.pass=h.report.profiles.length===4&&h.report.profiles.every(p=>p.pass);await h.close();await h.finish();}
if(!h.report.pass)process.exitCode=1;
