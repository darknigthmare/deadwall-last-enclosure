// Opt-in laboratory profile, not a gameplay, GPU, balance or minimum-spec certification.
// The environment flag records prior browser approval; it does not grant approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

if(process.env.DEADWALL_QA_BROWSER_APPROVED!=='1')throw new Error('Performance profile not started: obtain browser approval, then set DEADWALL_QA_BROWSER_APPROVED=1.');
const require=createRequire(import.meta.url),{chromium}=require(process.env.DEADWALL_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)),base=process.env.DEADWALL_QA_URL||'http://127.0.0.1:4322';
const label=(process.env.DEADWALL_QA_LABEL||'performance-'+new Date().toISOString()).replace(/[^a-zA-Z0-9_-]/g,'_');
function setting(name,fallback,min,max){const value=Number(process.env[name]??fallback);assert.ok(Number.isFinite(value)&&value>=min&&value<=max,`${name} must be between ${min} and ${max}`);return value;}
const config={viewport:{width:1280,height:720},deviceScaleFactor:setting('DEADWALL_PERF_DPR',2,1,2),warmupMilliseconds:setting('DEADWALL_PERF_WARMUP_MS',2000,1000,5000),sampleMilliseconds:setting('DEADWALL_PERF_SAMPLE_MS',6000,3000,30000),chunkMilliseconds:1000,seed:17117,qualities:['auto','low'],scenes:['quiet','enclosed-720'],headless:process.env.DEADWALL_PERF_HEADED!=='1'};
const parent=path.resolve(process.env.DEADWALL_PERF_OUTPUT||path.join(root,'artifacts','performance-qa'));
await fs.mkdir(parent,{recursive:true});const output=await fs.mkdtemp(path.join(parent,label+'-'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const localSources=Object.fromEntries(await Promise.all(['src/core.js','src/game.js','src/art.js'].map(async file=>[file,sha(await fs.readFile(path.join(root,file)))])));
function git(args){try{return execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim();}catch{return null;}}
const report={date:new Date().toISOString(),base,output,config,scope:'Sequential, fresh isolated Chromium contexts at 1280x720. Real RAF warm-up and sampling; no direct update(dt) stepping. CPU wall time includes nested instrumentation, JavaScript, synchronous Canvas commands, DOM work and pauses; render() return is not GPU presentation completion. RAF pacing also includes compositor, instrumentation and external machine load. Quiet and injected 720-enemy scenes are not a natural campaign, maximum-content combat, accessibility test, minimum-spec test or FPS guarantee. No hardware equivalence is inferred from emulated DPR. No audio, user input, service worker or network activity is intentionally added during sampling. Do not run concurrently with builds, tests or other browser QA. Repeat on target hardware before publishing system requirements.',source:{revision:git(['rev-parse','HEAD']),workingTree:git(['status','--short']),localSources},host:{platform:os.platform(),release:os.release(),architecture:os.arch(),node:process.version,cpuModels:[...new Set(os.cpus().map(cpu=>cpu.model))],logicalCpus:os.cpus().length,totalMemoryBytes:os.totalmem(),freeMemoryBytesAtStart:os.freemem()},runs:[]};
const ready=()=>globalThis.DEADWALL?.showSettings&&DEADWALL.commandUI&&DEADWALL.art?.diagnostics.ready.length===Object.keys(DeadwallArt.ASSETS).length&&!DEADWALL.art.diagnostics.failed.length;

// Serialized into the page: every non-natural scene intervention is returned below.
function prepareFixture({scene,quality,seed}){
  const g=DEADWALL,C=DeadwallCore;g.audio.setMuted(true);g.settings.muted=true;g.settings.quality=quality;g.settings.reducedMotion=false;g.resize();
  g.startNew('standard',String(seed));g.random=new C.Random(seed);g.releaseInputs();g.cancelPlacement();g.phaseTime=9999;g.saveTimer=0;
  const core=g.core(),buildingLayout=[],actorCounts={},enemyCounts={};
  g.player.x=core.x;g.player.y=core.y;g.camera.x=core.x;g.camera.y=core.y;
  g.units.forEach((unit,index)=>{unit.x=core.x-40+index*40;unit.y=core.y+20;unit.offset={x:(index-1)*30,y:20};});
  if(scene==='enclosed-720'){
    const Building=core.constructor,Unit=g.units[0].constructor;
    function add(type,gx,gy,rotation=0){const b=new Building(g.nextId++,type,gx,gy,rotation,1);if(g.world.cells(b).some(cell=>g.world.atCell(cell.x,cell.y)))throw new Error('Overlapping performance structure '+[type,gx,gy]);g.world.add(b);buildingLayout.push({type,gx,gy,rotation});return b;}
    for(const radius of [10,16]){
      const lo=64-radius,hi=64+radius;
      for(let x=lo;x<=hi;x++){add('concreteWall',x,lo);add('concreteWall',x,hi);}
      for(let y=lo+1;y<hi;y++){add('concreteWall',lo,y);if(y!==64&&y!==65)add('concreteWall',hi,y);}
      add('armoredGate',hi,64,1).gateMode='closed';
    }
    for(const gy of [55,59,68,71])for(const gx of [55,60,65,70])add('house',gx,gy);
    g.units=[];
    const roles=['worker','soldier','medic','engineer'];
    for(let index=0;index<48;index++){
      const kind=roles[index%roles.length],unit=new Unit(g.nextId++,kind,core.x+(index%8-3.5)*12,core.y+(Math.floor(index/8)-2.5)*12);
      unit.offset={x:(index%8-3.5)*12,y:(Math.floor(index/8)-2.5)*12};unit.think=(index%6)/10;g.units.push(unit);
    }
    g.resources.ammo=0;g.rally={x:core.x,y:core.y};g.setWorkerOrder('retreat');g.wave=12;
    const kinds=Object.keys(C.ENEMIES);
    for(let index=0;index<C.PERFORMANCE_LIMITS.zombies;index++){
      const kind=kinds[index%kinds.length];g.spawnZombie(kind);const z=g.zombies.at(-1),front=index%4,rank=Math.floor(index/4),offset=(rank%60-29.5)*17,depth=570+Math.floor(rank/60)*20;
      z.x=core.x+(front===1?depth:front===3?-depth:offset);z.y=core.y+(front===0?-depth:front===2?depth:offset);
      z.lastX=z.x;z.lastY=z.y;z.bias=index*.731;z.anim=index%10;z.howl=2+index%7;z.huntThink=(index%10)/20;
    }
    g.dayClock=0;g.weather=.65;g.weatherTarget=.65;g.camera.zoom=.52;
    for(const node of g.world.nodes)if(g.world.at(node.x,node.y)){node.amount=0;node.depleted=true;}
  }else{g.dayClock=.5;g.weather=0;g.weatherTarget=0;g.camera.zoom=1;}
  g.refreshMetrics(true);g.flow.rebuild(g.world,core);g.rebuildBuckets();g.updateUI();g.renderMinimap();
  for(const u of g.units)actorCounts[u.kind]=(actorCounts[u.kind]||0)+1;
  for(const z of g.zombies)enemyCounts[z.kind]=(enemyCounts[z.kind]||0)+1;
  return{scene,seed,quality,backingCanvas:{width:g.canvas.width,height:g.canvas.height,dpr:g.dpr},startingStructures:g.world.buildings.size,buildingLayout,actorCounts,enemyCounts,startingZombies:g.zombies.length,startingVisibleZombies:g.zombies.filter(z=>g.visible(z.x,z.y,28,g.viewBounds())).length,zoom:g.camera.zoom,startingDayClock:g.dayClock,weather:g.weather,ammo:g.resources.ammo,enclosed:g.getEnclosureStatus().enclosed,notes:scene==='quiet'?'Fresh map with three workers; commander centred and worker positions/RNG normalized; calm prolonged. Ordinary worker AI and economy remain enabled. No player input.':'Completed, unpaid two-ring concrete enclosure with closed powered gates and sixteen houses injected. Forty-eight unpaid full-health mixed-role units placed inside; retreat order; ammunition deliberately zero so no friendly bullets/casualties lower the 720-enemy count. Eight profiles evenly mixed at normal wave-12 health, manually placed on four flanks. Nodes beneath structures depleted. Night, rain, camera and actor variation normalized. No resurrection, health reset, enemy replenishment or method stubbing during sampling. This omits a firing army, projectiles, a natural economy and a naturally built city.'};
}

function installProfiler(){
  const g=DEADWALL,originals=[],samples={},visibilityChanges=[];let active=false,frameCount=0,lastRaf=null,rafId,startWall=0,startElapsed=0,startState=null;
  const pacing=[],population={zombies:{min:Infinity,max:0},structures:{min:Infinity,max:0},units:{min:Infinity,max:0},particles:{min:Infinity,max:0},visibleZombies:{min:Infinity,max:0}};
  function state(){const view=g.viewBounds();return{elapsed:g.elapsed,phase:g.phase,wave:g.wave,gameOver:g.gameOver,paused:g.paused,coreHealth:g.core()?.health,zombies:g.zombies.filter(z=>!z.dead).length,structures:g.world.buildings.size,units:g.units.filter(u=>!u.dead).length,particles:g.particles.length,visibleZombies:g.zombies.filter(z=>!z.dead&&g.visible(z.x,z.y,28,view)).length,projectiles:g.projectiles.length,corpses:g.corpses.length,documentVisibility:document.visibilityState};}
  function wrap(owner,key,label=key){
    const original=owner[key];if(typeof original!=='function')throw new Error('Missing profiled method '+label);
    const descriptor=Object.getOwnPropertyDescriptor(owner,key);originals.push({owner,key,descriptor});samples[label]=[];
    owner[key]=function(...args){if(!active)return original.apply(this,args);const start=performance.now();try{return original.apply(this,args);}finally{samples[label].push(performance.now()-start);}};
  }
  for(const method of ['update','render','updateBuildings','updateUnits','updateZombies','rebuildBuckets','updateProjectiles','updateEffects','economyTick','refreshMetrics','updateUI','renderMinimap','drawGround','drawNight','drawRain','drawThreatArrows'])wrap(g,method);
  wrap(g.flow,'rebuild','flow.rebuild');
  function observe(timestamp){
    if(active){if(lastRaf!==null)pacing.push(timestamp-lastRaf);lastRaf=timestamp;frameCount++;
      // One coarse sample per 30 frames, outside both measured game functions.
      if(frameCount===1||frameCount%30===0){const current=state();for(const [key,limits]of Object.entries(population)){limits.min=Math.min(limits.min,current[key]);limits.max=Math.max(limits.max,current[key]);}}
    }
    rafId=requestAnimationFrame(observe);
  }
  function onVisibility(){if(active)visibilityChanges.push({at:performance.now(),value:document.visibilityState});}
  document.addEventListener('visibilitychange',onVisibility);rafId=requestAnimationFrame(observe);
  function summarize(values){const sorted=[...values].sort((a,b)=>a-b),n=sorted.length;if(!n)return{calls:0,totalMilliseconds:0,medianMilliseconds:null,p95Milliseconds:null,maxMilliseconds:null};const total=values.reduce((sum,v)=>sum+v,0);return{calls:n,totalMilliseconds:total,meanMilliseconds:total/n,medianMilliseconds:n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2,p95Milliseconds:sorted[Math.max(0,Math.ceil(n*.95)-1)],maxMilliseconds:sorted[n-1]};}
  globalThis.__deadwallProfile={
    begin(){for(const values of Object.values(samples))values.length=0;pacing.length=0;visibilityChanges.length=0;frameCount=0;lastRaf=null;startState=state();startWall=performance.now();startElapsed=g.elapsed;active=true;return startState;},
    finish(){active=false;const endWall=performance.now(),endState=state();for(const [key,limits]of Object.entries(population)){limits.min=Math.min(limits.min,endState[key]);limits.max=Math.max(limits.max,endState[key]);}return{wallMilliseconds:endWall-startWall,simulationSeconds:g.elapsed-startElapsed,frameCount,rafInterval:summarize(pacing),rafIntervalOver25ms:pacing.filter(ms=>ms>25).length,rafIntervalOver50ms:pacing.filter(ms=>ms>50).length,methods:Object.fromEntries(Object.entries(samples).map(([key,values])=>[key,summarize(values)])),observedPopulation:population,visibilityChanges,startState,endState,raw:{rafIntervalMilliseconds:pacing,methodMilliseconds:samples},measurementNotes:'Inclusive per-call durations. Nested method totals overlap update/render totals and must not be summed. Two bucket rebuilds per update are timed as two calls. performance.now resolution may produce zeroes. RAF observer and periodic population counts run outside update/render timers but still affect frame pacing. No forced GPU readback. One context per scene/quality; results are not statistically independent hardware trials.'};},
    restore(){active=false;cancelAnimationFrame(rafId);document.removeEventListener('visibilitychange',onVisibility);for(const {owner,key,descriptor}of originals.reverse()){if(descriptor)Object.defineProperty(owner,key,descriptor);else delete owner[key];}delete globalThis.__deadwallProfile;return true;}
  };
}

async function rafWait(page,milliseconds){
  let timer;
  try{return await Promise.race([page.evaluate(duration=>new Promise(resolve=>{const start=performance.now();let frames=0;function next(){frames++;if(performance.now()-start>=duration)resolve(frames);else requestAnimationFrame(next);}requestAnimationFrame(next);}),milliseconds),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('RAF sampling stalled for 15 seconds')),15000);})]);}
  finally{clearTimeout(timer);}
}

const browser=await chromium.launch({executablePath:process.env.DEADWALL_CHROMIUM||undefined,headless:config.headless});
report.browserVersion=browser.version();
try{
  for(const quality of config.qualities)for(const scene of config.scenes){
    const context=await browser.newContext({viewport:config.viewport,deviceScaleFactor:config.deviceScaleFactor,serviceWorkers:'block',reducedMotion:'no-preference'}),page=await context.newPage();
    const run={quality,scene,errors:[],httpErrors:[],requestFailures:[],loadedSources:{},checks:[]},sourceReads=[];report.runs.push(run);
    page.on('pageerror',error=>run.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')run.errors.push(message.text());});
    page.on('requestfailed',request=>run.requestFailures.push({url:request.url(),failure:request.failure()?.errorText}));
    page.on('response',response=>{if(response.status()>=400)run.httpErrors.push({status:response.status(),url:response.url()});const file=new URL(response.url()).pathname.replace(/^\//,'');if(Object.hasOwn(localSources,file))sourceReads.push(response.body().then(bytes=>{run.loadedSources[file]=sha(bytes);}).catch(error=>run.errors.push('Cannot hash '+file+': '+error.message)));});
    page.setDefaultTimeout(20000);
    const check=(name,value)=>{assert.ok(value,name);run.checks.push(name);};
    try{
      console.log(`[profile] ${quality}/${scene}: loading isolated context`);
      const response=await page.goto(base,{waitUntil:'networkidle'});check('public document HTTP 200',response.status()===200);await page.waitForFunction(ready);await Promise.all(sourceReads);
      check('loaded game/core/art match the recorded local source',Object.entries(localSources).every(([file,hash])=>run.loadedSources[file]===hash));
      run.environment=await page.evaluate(()=>{
        const probe=document.createElement('canvas'),gl=probe.getContext('webgl'),extension=gl?.getExtension('WEBGL_debug_renderer_info');
        const gpu=gl?{vendor:gl.getParameter(extension?extension.UNMASKED_VENDOR_WEBGL:gl.VENDOR),renderer:gl.getParameter(extension?extension.UNMASKED_RENDERER_WEBGL:gl.RENDERER),version:gl.getParameter(gl.VERSION)}:null;
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
        return{userAgent:navigator.userAgent,platform:navigator.platform,hardwareConcurrency:navigator.hardwareConcurrency,deviceMemoryGiB:navigator.deviceMemory??null,devicePixelRatio,innerWidth,innerHeight,visibility:document.visibilityState,gpuDiagnostic:gpu,canvas2dAttributes:DEADWALL.ctx.getContextAttributes?.()??null};
      });
      run.fixture=await page.evaluate(prepareFixture,{scene,quality,seed:config.seed});
      check('fixture starts playing and visible',await page.evaluate(()=>DEADWALL.state==='playing'&&!DEADWALL.paused&&!DEADWALL.gameOver&&document.visibilityState==='visible'));
      if(scene==='enclosed-720')check('720 mixed infecteds inside render culling area and a sealed enclosure',run.fixture.startingZombies===720&&run.fixture.startingVisibleZombies===720&&run.fixture.enclosed);
      await page.evaluate(installProfiler);
      console.log(`[profile] ${quality}/${scene}: RAF warm-up ${config.warmupMilliseconds} ms`);run.warmupFrames=await rafWait(page,config.warmupMilliseconds);
      await page.evaluate(()=>__deadwallProfile.begin());
      for(let sampled=0;sampled<config.sampleMilliseconds;sampled+=config.chunkMilliseconds){await rafWait(page,Math.min(config.chunkMilliseconds,config.sampleMilliseconds-sampled));console.log(`[profile] ${quality}/${scene}: sampled ${Math.min(config.sampleMilliseconds,sampled+config.chunkMilliseconds)}/${config.sampleMilliseconds} ms`);}
      run.measurement=await page.evaluate(()=>__deadwallProfile.finish());
      check('active real RAF update and render samples collected',run.measurement.frameCount>=3&&run.measurement.methods.update.calls>=3&&run.measurement.methods.render.calls>=3&&run.measurement.simulationSeconds>0);
      check('page stayed visible and simulation stayed live',run.measurement.visibilityChanges.length===0&&run.measurement.startState.documentVisibility==='visible'&&run.measurement.endState.documentVisibility==='visible'&&!run.measurement.endState.gameOver&&!run.measurement.endState.paused);
      if(scene==='enclosed-720')check('all 720 infecteds retained throughout observed samples',run.measurement.observedPopulation.zombies.min===720&&run.measurement.observedPopulation.zombies.max===720);
      check('no runtime, console, HTTP or request error',!run.errors.length&&!run.httpErrors.length&&!run.requestFailures.length);
      run.screenshot=`${quality}-${scene}.png`;await page.screenshot({path:path.join(output,run.screenshot)});run.pass=true;
      console.log(JSON.stringify({quality,scene,frames:run.measurement.frameCount,update:run.measurement.methods.update,render:run.measurement.methods.render,rafInterval:run.measurement.rafInterval}));
    }catch(error){run.pass=false;run.failure=error.stack;console.error(`[profile] ${quality}/${scene}: ${error.message}`);}
    finally{
      if(!page.isClosed())await page.evaluate(()=>globalThis.__deadwallProfile?.restore()).then(value=>{run.instrumentationRestored=value??'not installed';}).catch(error=>{run.pass=false;run.errors.push('Profiler cleanup failed: '+error.message);});
      await context.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
    }
  }
}finally{await browser.close();}
report.completedAt=new Date().toISOString();report.host.freeMemoryBytesAtEnd=os.freemem();
report.source.unchangedDuringRun=(await Promise.all(Object.entries(localSources).map(async([file,hash])=>sha(await fs.readFile(path.join(root,file)))===hash))).every(Boolean);
report.pass=report.runs.length===4&&report.runs.every(run=>run.pass)&&report.source.unchangedDuringRun;
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({output,pass:report.pass,sourceUnchanged:report.source.unchangedDuringRun,runs:report.runs.map(run=>({quality:run.quality,scene:run.scene,pass:run.pass,checks:run.checks.length,failure:run.failure?.split('\n')[0]}))},null,2));
if(!report.pass)process.exitCode=1;
