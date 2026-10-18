import path from 'node:path';
import {createHarness,recorder,ready,chooseCampaign,activate,resumeCommand,saveReloadContinue} from './browser-qa-common144.mjs';
process.env.DEADWALL_QA_ROOT=path.resolve(process.env.DEADWALL_QA_ROOT||'dist');
const h=await createHarness('weather193','Current desktop and emulated portrait: native new campaign, Operations/Region/weather bulletin, paused observational reads and native save/menu/reload/Continue. Explicit weather checkpoint changes only elapsed, weather and target to observe a real seeded rainy front; this is not a naturally elapsed campaign or a physical-device benchmark. No inventory, enemy, terrain, result, RNG or hit-test replacement.');
const {browser,base,report,output}=h;report.profiles=[];report.pass=false;
try{
 for(const view of [{name:'desktop',width:1366,height:768},{name:'portrait',width:390,height:844,touch:true}]){
  const p={view};report.profiles.push(p);const context=await browser.newContext({viewport:{width:view.width,height:view.height},hasTouch:!!view.touch,isMobile:!!view.touch,serviceWorkers:'block'}),page=await context.newPage(),r=recorder(page,p,output,view.name+'-');page.setDefaultTimeout(120000);
  try{
   await page.goto(base,{waitUntil:'networkidle',timeout:120000});await ready(page);await chooseCampaign(page,'193167');await activate(page,'#campaignIntro132Skip',view.touch);
   await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);
   r.check('New native campaign opts into weather and forage without a second stock',await page.evaluate(()=>DEADWALL.weather193.active()&&DEADWALL.forage193.active()));
   p.checkpoint=await page.evaluate(()=>{const g=DEADWALL;let at=240;while(!DeadwallWeather193.sample(g.world.seed,at).rain)at+=240;g.elapsed=at+150;g.weather=0;g.weatherTarget=0;return{elapsed:g.elapsed,expected:DeadwallWeather193.sample(g.world.seed,g.elapsed),explicitWeatherPreparation:true};});
   await page.waitForFunction(()=>DEADWALL.weather>.025);
   r.check('Rain is driven by the actual active front',await page.evaluate(()=>DEADWALL.weather>0&&DEADWALL.weatherTarget===DEADWALL.weather193.target()));
   await r.screenshot('rain-on-terrain');
   if(!await page.locator('#hud135Tools').evaluate(n=>n.open))await activate(page,'#hud135ToolsToggle',view.touch);
   await activate(page,'#fieldOperations',view.touch);await activate(page,'#expansionGroup-world',view.touch);await page.locator('#expansionTab-weather193').waitFor({state:'visible'});
   const text=await page.locator('#expansionDetail').innerText();r.check('Native Region opens the actual weather dossier',text.includes('Pluie observée')&&text.includes('Prochaine tendance')&&text.includes('Éclairage découvert'));
   r.check('No already-active activation button is offered',await page.locator('#expansionAction-weather193-activate').count()===0);
   const before=await page.evaluate(()=>{const {timestamp,...material}=DEADWALL.serialize();return JSON.stringify(material);});
   p.reads=await page.evaluate(()=>{const g=DEADWALL;for(let i=0;i<20;i++){g.weather193.overview();g.weather193.forecast();g.weather193.current();g.expansionUI.refresh(true);}const {timestamp,...material}=g.serialize();return{after:JSON.stringify(material),excludedTechnicalTimestamp:timestamp,paused:g.paused,front:g.weather193.current()};});
   r.check('Reading forecasts keeps the complete paused save and RNG unchanged',p.reads.paused&&before===p.reads.after);delete p.reads.after;
   r.check('Bulletin exposes the actual next front inside its short lead',p.reads.front.next!==null&&text.includes(p.reads.front.next.name));
   p.layout=await page.locator('#expansionTab-weather193').evaluate(n=>{const b=n.getBoundingClientRect();return{left:b.left,right:b.right,height:b.height,screen:innerWidth};});r.check('Weather tab fits and retains a touch-sized target',p.layout.left>=-1&&p.layout.right<=p.layout.screen+1&&p.layout.height>=44);
   await r.screenshot('weather-bulletin');
   await resumeCommand(page,!!view.touch);p.recovery=await saveReloadContinue(page,!!view.touch);r.check('Native Save/Continue preserves all owners including exact weather target',p.recovery.pass);
   r.check('Continue retains the weather mode',await page.evaluate(()=>DEADWALL.weather193.active()));
   r.check('No page, console, HTTP or request failure',r.errors()===0);
  }finally{await context.close();}
 }
 report.pass=true;
}catch(error){report.failure=String(error.stack||error);process.exitCode=1;}
finally{await h.finish();await h.close();console.log(JSON.stringify({pass:report.pass,output,failure:report.failure}));}
