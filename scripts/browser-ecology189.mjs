import path from 'node:path';
import {createHash} from 'node:crypto';
import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
import {activate,saveReloadContinue} from './browser-qa-common144.mjs';
process.env.DEADWALL_QA_ROOT=path.resolve(process.env.DEADWALL_QA_ROOT||'dist');
const h=await createHarness('ecology189','Native profile selection, seed roll and save/menu/Continue on dist. Regional wildlife inspection uses explicitly prepared coordinates; no claim of a human campaign or physical-device benchmark.');
const {browser,base,report,output}=h;report.root=process.env.DEADWALL_QA_ROOT;report.profiles=[];report.pass=false;
try{
 for(const config of [{preset:'balanced',width:1366,height:768},{preset:'large',width:390,height:844,touch:true},{preset:'patchwork',width:844,height:390,touch:true},{preset:'classic',width:1366,height:768}]){
  const p={config};report.profiles.push(p);const context=await browser.newContext({viewport:{width:config.width,height:config.height},hasTouch:!!config.touch,isMobile:!!config.touch,serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(120000);const r=recorder(page,p,output,config.preset+'-');
  try{
   await page.goto(base,{waitUntil:'networkidle',timeout:120000});await ready(page);
   if(!await page.locator('#campaignMap132').evaluate(n=>n.open))await activate(page,'#campaignMap132 > summary',!!config.touch);
   await page.locator('#worldLandscape189').selectOption(config.preset);
   const old=await page.locator('#mapSeed').inputValue();await activate(page,'#randomMapSeedButton',!!config.touch);const first=await page.locator('#mapSeed').inputValue();await activate(page,'#randomMapSeedButton',!!config.touch);const second=await page.locator('#mapSeed').inputValue();
   r.check('Native random seed button produces distinct numeric seeds',/^\d+$/.test(first)&&/^\d+$/.test(second)&&first!==second&&first!==old);
   r.check('Profile selector fits the viewport',await page.locator('#worldLandscape189').evaluate(n=>{const q=n.getBoundingClientRect();return q.width>0&&q.left>=0&&q.right<=innerWidth+1;}));await r.screenshot('menu-profile');
   await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',!!config.touch);await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);
   p.initial=await page.evaluate(()=>{const g=DEADWALL,w=g.frontier.world(),samples=[];for(let y=500;y<24000;y+=1300)for(let x=500;x<24000;x+=1300)samples.push(w.biomeAt(x,y).id);return{seed:w.seed,preset:w.landscape189,saved:g.frontier.snapshot().landscape189||'classic',samples,guide:DeadwallEcologyCodex189.entries().length};});
   r.check('Selected profile reaches the authoritative world and save',p.initial.seed===17117&&p.initial.preset===config.preset&&p.initial.saved===config.preset);r.check('Extended guide is installed',p.initial.guide===43);
   p.terrainSHA256=createHash('sha256').update(JSON.stringify(p.initial.samples)).digest('hex');delete p.initial.samples;
   await r.screenshot('new-campaign');p.recovery=await saveReloadContinue(page,!!config.touch);r.check('Native save/menu/reload/Continue preserves exact persistent owners',p.recovery.pass);
   r.check('Continue preserves the selected profile',await page.evaluate(preset=>(DEADWALL.frontier.snapshot().landscape189||'classic')===preset,config.preset));
   if(config.preset!=='classic'){
    p.encounter=await page.evaluate(()=>{const g=DEADWALL,w=g.frontier.world(),P=DeadwallBiomePopulation165;let chosen,point;
     // Prepared exploration checkpoint on the real generated world, not injected animals.
     for(let cy=0;cy<96&&!chosen;cy++)for(let cx=0;cx<96&&!chosen;cx++)for(let i=0;i<8&&!chosen;i++){const q=P.animal(w,cx,cy,i);if(!q||!P.admitted(w,q)||q.profile.mode!=='land')continue;
      for(let j=0;j<16;j++){const a=j*Math.PI/8,p={x:q.x+Math.cos(a)*4,y:q.y+Math.sin(a)*4};if(!w.blocked(p.x,p.y,.32,0,null)){chosen=q;point=p;break;}}
     }
     if(!chosen)throw Error('No physically admitted wildlife');const s=g.serialize();Object.assign(s.frontier,{active:true,...point,z:0,inside:null,a:0,anchor:{x:s.player.x,y:s.player.y}});g.restoreSave(s);g.campaignIntro132.skip();g.paused=false;g.activeOverlay=null;g.input.keys.clear();g.input.pressed.clear();g.update(.1);g.render();
     const seen=g.frontier.wildlife165().find(a=>a.id===chosen.id);if(!seen)throw Error('Generated animal did not stream into the runtime');return{id:seen.id,species:seen.species,position:point,health:seen.health??seen.hp,preparedCoordinates:true};
    });
    await r.screenshot('regional-wildlife');r.check('Generated native animal streams into the running game',p.encounter.id.startsWith('A189_'));p.wildlifeRecovery=await saveReloadContinue(page,!!config.touch);r.check('Exploration checkpoint including wildlife survives native recovery',p.wildlifeRecovery.pass);
   }
   r.check('No browser or network error',r.errors()===0);
  }finally{await context.close();}
 }
 if(new Set(report.profiles.map(p=>p.terrainSHA256)).size!==4)throw Error('Profiles unexpectedly share a terrain fingerprint');report.pass=true;
}catch(error){report.failure=String(error.stack||error);process.exitCode=1;}
finally{await h.finish();await h.close();console.log(JSON.stringify({pass:report.pass,output,failure:report.failure}));}
