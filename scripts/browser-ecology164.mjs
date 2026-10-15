import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createHarness,recorder,ready,chooseCampaign,activate,openCommand,visibleInPanel,persistedSnapshot,comparePersistentRestore} from './browser-qa-common144.mjs';
import {armTransaction,differencePaths} from './qa-transaction167.mjs';

const views=[{name:'desktop',width:1366,height:768},{name:'mobile',width:390,height:844,touch:true},{name:'mobile-landscape',width:844,height:390,touch:true}];
const selected=process.env.DEADWALL_QA_PROFILES?.split(',');
if(selected&&(!selected.length||new Set(selected).size!==selected.length||selected.some(name=>!views.some(v=>v.name===name))))throw Error('Distinct known ecology164 profiles required');
const profiles=selected?views.filter(v=>selected.includes(v.name)):views;
const harness=await createHarness('ecology164','Actual Standard seed17117 menu creation, shared D17/regional ecology1 provider, five native guide entries, bounded chunk/ground-cache eviction, trusted depot G9/G10 and revision12→13 actions, WC and existing paid-care preview painters, Save/menu/reload/Continue. EXPLICIT FINITE-HISTORY FIXTURE: a validated save marks one existing finite container exhausted and records that actual site; only frontier.taken and frontier.seen are assigned, without inventory, resources, age, RNG or actor-position gifts. Recipe seed42 previews and offscreen paints inspect real generators/painters; they are not natural travel, active plumbing, free medical treatment or physical-device performance certification. Set DEADWALL_QA_OUTPUT to keep reports and screenshots outside the checkout.');
const {browser,base,report,output}=harness;report.profiles=[];report.pass=false;
const material=page=>page.evaluate(()=>{const{timestamp,...s}=DEADWALL.serialize();return JSON.stringify(s);});
const sha=value=>createHash('sha256').update(value).digest('hex');

async function guide(page,touch){
 if(await page.locator('#commandModal').isVisible())await activate(page,'#commandTab-field',touch);else await openCommand(page,touch,'field');
 await activate(page,'#commandPanel-field [data-field-view="world-codex"]',touch);
 await page.locator('#field-world-codex').waitFor({state:'visible'});
}
async function operations(page,touch){
 if(!await page.locator('#commandModal').isVisible())await openCommand(page,touch,'field');else await activate(page,'#commandTab-field',touch);
 for(const selector of ['#expansionFieldTab','#expansionGroup-world','#expansionTab-world131'])await activate(page,selector,touch);
}
async function programme(page,touch,id){
 await guide(page,touch);
 await page.locator('#worldCodexAvailability159').selectOption('all');await page.locator('#worldCodexFamily').selectOption('all');
 await page.locator('#worldCodexStatus').selectOption('programme');await page.locator('#worldCodexSearch').fill(id);
 const details='#worldCodexResults [data-codex-id="programme-'+id+'"] [data-codex-source159]';
 await page.locator(details+' > summary').scrollIntoViewIfNeeded();
 if(!await page.locator(details).evaluate(n=>n.open))await activate(page,details+' > summary',touch);
 const host=details+' [data-codex-plan165="'+id+'"]';await page.locator(host).waitFor();return host;
}
async function transaction(page,touch,id,field,value){
 await operations(page,touch);const selector='#expansionAction-world131-'+id;
 await page.locator(selector).scrollIntoViewIfNeeded();const visible=(await visibleInPanel(page,selector,'.command-body')).pass;
 await armTransaction(page,selector);await activate(page,selector,touch);
 const data=await page.evaluate(()=>{
  const audit=globalThis.__transaction167;if(!audit)throw Error('Trusted depot action probe absent');audit.cleanup();
  const stored=DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));delete stored.timestamp;
  const result={...audit.state,stored};delete globalThis.__transaction167;return result;
 });
 const{started,beforeRestore,input,after,stored}=data;
 if(!started||!after||!input)throw Error('Trusted '+id+' action did not reach its native restore controller');
 const normalize=s=>{const copy=structuredClone(s);copy.frontier[field]=started.frontier[field];return copy;};
 const changes={beforeClick:differencePaths(data.armed,started),preRestore:differencePaths(started,beforeRestore),submitted:differencePaths(started,normalize(input)),restored:differencePaths(started,normalize(after)),stored:differencePaths(started,normalize(stored))};
 const result={id,field,value,actual:after.frontier[field],storedValue:stored.frontier[field],visible,trusted:data.trusted,calls:data.calls,
  ecologyBefore:started.frontier.ecologyVersion,ecologyAfter:after.frontier.ecologyVersion,changes,
  ledgerPreserved:JSON.stringify(started.frontier.taken)===JSON.stringify(after.frontier.taken),rngPreserved:started.randomState===after.randomState,
  pass:visible&&data.ok&&data.trusted&&data.calls===1&&after.frontier[field]===value&&stored.frontier[field]===value&&after.frontier.ecologyVersion===1&&Object.values(changes).every(paths=>paths.length===0)};
 return result;
}

function sharedProvider(){
 const g=DEADWALL,w=g.frontier.world(),canvas=document.createElement('canvas');canvas.width=canvas.height=192;
 const c=canvas.getContext('2d');g.drawGround(c,{left:0,right:192,top:0,bottom:192});
 const node=g.world.nodes.find(n=>!n.depleted&&!n.sceneryKind&&(n.type==='stone'||n.type==='wood'&&Math.abs(n.variant||0)%4!==2));
 if(!node)throw Error('An actual local botanical/mineral resource is required');
 c.save();c.translate(96,96);c.scale(.3,.3);c.translate(-node.x,-node.y);const painted=g.art.drawNode(c,node,g);c.restore();
 const selected=g.art.nodeSpecies?.get(node),q=DeadwallAtlasProjection.toRegion(node.x,node.y,g),kind=node.type==='wood'?'pickTree':'pickRock',expected=w.biomes[kind](w.seed,q.x,q.y,'local:'+node.id,{generation:w.generation});
 return{ecology:w.ecologyVersion,definitions:w.biomes.defs.length,groundUsesExactRegionalWorld:g.groundEcology164?.world===w,
  node:{id:node.id,type:node.type,species:selected?.species,expected:expected.species,painted},botanyUsesExactRegionalProvider:selected?.biomes===w.biomes,
  pass:w.ecologyVersion===1&&w.biomes.defs.length===16&&g.groundEcology164?.world===w&&selected?.biomes===w.biomes&&painted&&selected.species===expected.species};
}
function cacheReplay(){
 const w=DEADWALL.frontier.world(),G=DeadwallGround135,limit=DeadwallFrontierWorld.RULES.chunkCache,
  first=w.chunk(2,2),before=JSON.stringify(first),sample=JSON.stringify(w.biomeAt(640,640));
 const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const c=canvas.getContext('2d');
 const paint=()=>{c.setTransform(16,0,0,16,-640*16,-640*16);G.draw(c,w,{left:640,right:646,top:640,bottom:646},{scale:16});return canvas.toDataURL();};
 const pixels=paint();for(let i=0;i<=limit;i++)w.chunk(40+i,50);G.reset();const after=w.chunk(2,2),repainted=paint();
 return{before,after:JSON.stringify(after),rebuilt:first!==after,cacheSize:w.cacheSize(),limit,groundCache:G.cacheInfo(),sampleStable:sample===JSON.stringify(w.biomeAt(640,640)),groundPixelsStable:pixels===repainted,
  pass:first!==after&&before===JSON.stringify(after)&&w.cacheSize()<=limit&&sample===JSON.stringify(w.biomeAt(640,640))&&pixels===repainted};
}
function priorDepletion(){
 const g=DEADWALL,w=g.frontier.world();let selected;
 for(const p of w.pois){if(!p.programme3000)continue;for(const z of p.levels){const o=w.plan(p,z).objects.find(o=>o.id&&o.amount>=2&&o.resource);if(o){selected={p,z,o};break;}}if(selected)break;}
 if(!selected)throw Error('An actual finite seeded container is required');
 const before=g.serialize(),raw=structuredClone(before);raw.frontier.taken[selected.o.id]=selected.o.amount;raw.frontier.seen=[...new Set([...raw.frontier.seen,selected.p.id])];
 g.restoreSave(DeadwallSave.validate(raw));g.togglePause(true);const after=g.serialize(),copy=structuredClone(after),restoreNormalization=[];delete before.timestamp;delete copy.timestamp;
 copy.frontier.taken=before.frontier.taken;copy.frontier.seen=before.frontier.seen;
 if(before.wavePlan===null){before.wavePlan=DeadwallCore.wavePlan(before.wave,DeadwallCore.DIFFICULTIES[before.difficulty],0);restoreNormalization.push({field:'wavePlan',reason:'Native restoreSave reconstruction of an absent calm-phase plan',expected:before.wavePlan});}
 if(JSON.stringify(copy)!==JSON.stringify(before))throw Error('Finite-history fixture changed an undeclared saved owner');
 return{kind:'explicit-validated-prior-finite-exhaustion-and-notebook-record',site:selected.p.id,programme:selected.p.programme3000,container:selected.o.id,level:selected.z,
  originalAmount:selected.o.amount,originalResource:selected.o.resource,taken:selected.o.amount,assignedFields:['frontier.taken[existing container]','frontier.seen[actual site]'],restoreNormalization,
  noInventoryResourceAgeRngGift:true,noActorPositionAssigned:true};
}

async function ecologicalCards(page,touch){
 await guide(page,touch);await page.locator('#worldCodexAvailability159').selectOption('all');await page.locator('#worldCodexFamily').selectOption('all');await page.locator('#worldCodexStatus').selectOption('all');
 const ids=['biome164-alluvialTerrace','biome164-agriculturalPlateau','biome164-sandyPine','biome164-peatland','ecology164-coherence'],cards=[];
 for(const id of ids){
  await page.locator('#worldCodexSearch').fill(id);const selector='#worldCodexResults [data-codex-id="'+id+'"]',summary=selector+' [data-codex-source159] > summary';
  await page.locator(summary).scrollIntoViewIfNeeded();await activate(page,summary,touch);
  cards.push(await page.locator(selector).evaluate(node=>{
   const heading=node.querySelector('h4'),r=heading.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(heading);
   const lines=[...range.getClientRects()];return{id:node.dataset.codexId,title:heading.textContent,detailsOpen:node.querySelector('details').open,
    readable:heading.checkVisibility()&&lines.length>0&&lines.every(q=>q.left>=r.left-1&&q.right<=r.right+1)&&r.left>=-1&&r.right<=innerWidth+1,
    text:node.textContent};
  }));
 }
 return{cards,pass:cards.length===5&&cards.every(card=>card.detailsOpen&&card.readable&&card.title.length>10&&(card.id==='ecology164-coherence'?/récolter/i.test(card.text):card.text.includes('réserves finies')))};
}
async function armPainter(page,host){
 await page.locator(host).evaluate(node=>{
  const key='DeadwallSeedDetailArt157',original=globalThis[key],descriptor=Object.getOwnPropertyDescriptor(globalThis,key),canvas=node.querySelector('canvas'),hits=[];
  const observe=(name,c,o,result)=>{if(c.canvas===canvas&&(name==='draw'&&['toilet','latrine'].includes(o.kind)||name==='care'&&o.fixture164))hits.push({name,id:o.id,kind:o.kind,fixture:o.fixture164?.kind||null,painted:result===true});return result;};
  globalThis[key]={...original,draw(c,o,options){return observe('draw',c,o,original.draw(c,o,options));},paintFixture164(c,o,options){return observe('care',c,o,original.paintFixture164(c,o,options));}};
  globalThis.__ECOLOGY164_PAINTER__={hits,restore(){Object.defineProperty(globalThis,key,descriptor);return globalThis[key]===original;}};
 });
}
async function drawPreview(page,touch,host,id,seed,revision=13){
 await page.locator(host+' input[type="number"]').fill(String(seed));await page.locator(host+' select').selectOption('0');
 const button=host+' button';await page.locator(button).scrollIntoViewIfNeeded();const hit=(await visibleInPanel(page,button,'.command-body')).pass;
 await armPainter(page,host);let observer;
 try{await activate(page,button,touch);}
 finally{observer=await page.evaluate(()=>{const audit=__ECOLOGY164_PAINTER__,result={hits:audit.hits,restored:audit.restore()};delete globalThis.__ECOLOGY164_PAINTER__;return result;});}
 const value=await page.locator(host).evaluate((node,{id,seed,revision})=>{
  const model=DeadwallCodexPlan165.inspect(id,seed,0,revision),legacy=DeadwallCodexPlan165.inspect(id,seed,0,12),canvas=node.querySelector('canvas'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();
  for(let i=0;i<pixels.length;i+=4*197)colors.add(pixels.slice(i,i+4).join(','));
  const plain=plan=>JSON.stringify({...plan,objects:plan.objects.map(o=>{const{fixture164,...physical}=o;return physical;}),fixtures164:undefined});
  return{id,seed,revision,supported:model.supported,checked:node.querySelector('[data-fixtures164="revision"]').checked,status:node.querySelector('[role="status"]').textContent,
   fixtures:model.details.fixtures164||null,care:model.plan.fixtures164||null,
   toiletIds:model.details.interior.filter(o=>['toilet','latrine'].includes(o.kind)&&o.fixture164?.revision===13).map(o=>o.id),
   careIds:model.plan.objects.filter(o=>o.fixture164?.revision===13).map(o=>o.id),
   unchangedSourcePlan:plain(model.plan)===plain(legacy.plan),plan:JSON.stringify(model.plan),details:JSON.stringify(model.details),image:canvas.toDataURL(),
   canvas:{visible:!canvas.hidden,width:canvas.width,height:canvas.height,colors:colors.size}};
 },{id,seed,revision});
 value.planSHA256=sha(value.plan);value.detailsSHA256=sha(value.details);value.imageSHA256=sha(value.image);delete value.plan;delete value.details;delete value.image;
 value.observer=observer;value.controlVisible=hit;value.pass=hit&&observer.restored&&value.supported&&value.checked===(revision===13)&&value.canvas.visible&&value.canvas.width===900&&value.canvas.height===720&&value.canvas.colors>2&&value.status.includes('révision '+revision)&&value.unchangedSourcePlan;
 return value;
}
async function checkpoint(page,touch){
 if(await page.locator('#commandModal').isVisible())await activate(page,'#commandReturn129',touch);
 if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',touch);
 await activate(page,'#saveButton',touch);const saved=await persistedSnapshot(page);assert.ok(saved.ok);
 await activate(page,'#quitButton',touch);await page.reload({waitUntil:'networkidle'});await ready(page);
 await page.evaluate(()=>{
  const g=DEADWALL,original=g.restoreSave,descriptor=Object.getOwnPropertyDescriptor(g,'restoreSave');globalThis.__ECOLOGY164_RESTORE__={g,original,descriptor};
  g.restoreSave=function(...args){const result=original.apply(this,args),{timestamp,...s}=DeadwallSave.validate(g.serialize());globalThis.__DEADWALL_QA_RESTORED_144__=structuredClone(s);g.togglePause(true);return result;};
 });
 try{await activate(page,'#continueButton',touch);await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.paused);saved.comparison=await comparePersistentRestore(page,saved);}
 finally{saved.wrapperRestored=await page.evaluate(()=>{const s=__ECOLOGY164_RESTORE__;if(s.descriptor)Object.defineProperty(s.g,'restoreSave',s.descriptor);else delete s.g.restoreSave;const ok=s.g.restoreSave===s.original;delete globalThis.__ECOLOGY164_RESTORE__;return ok;});}
 return saved;
}

try{
 for(const viewport of profiles){
  const profile={viewport,transactions:[],previews:[]};report.profiles.push(profile);let context,page,rec;
  try{
   context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'});
   page=await context.newPage();page.setDefaultTimeout(60000);rec=recorder(page,profile,output,viewport.name+'-');
   await page.goto(base,{waitUntil:'networkidle'});await ready(page);await rec.screenshot('menu');await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);await guide(page,viewport.touch);
   rec.check('Actual new-game menu starts Standard seed17117 in G8 with ecology1',await page.evaluate(()=>DEADWALL.world.seed===17117&&DEADWALL.difficulty.id==='standard'&&DEADWALL.frontier.snapshot().generation===8&&DEADWALL.frontier.snapshot().ecologyVersion===1));
   const beforeReads=await material(page);profile.provider=await page.evaluate(sharedProvider);rec.check('D17 ground and actual local botany share the exact regional ecology provider',profile.provider.pass);
   profile.cards=await ecologicalCards(page,viewport.touch);rec.check('The four added biome cards and coherence card are readable through actual Guide search controls',profile.cards.pass);await rec.screenshot('ecology-guide');
   profile.cache=await page.evaluate(cacheReplay);profile.cache.beforeSHA256=sha(profile.cache.before);profile.cache.afterSHA256=sha(profile.cache.after);delete profile.cache.before;delete profile.cache.after;
   rec.check('Actual bounded chunk eviction and ground-cache reset preserve exact ecology, finite resources and pixels',profile.cache.pass);
   rec.check('Guide, offscreen painters and cache reads leave all campaign fields and RNG unchanged',beforeReads===await material(page));
   profile.depletionFixture=await page.evaluate(priorDepletion);rec.check('Declared finite-history fixture changes only validated taken/seen without gifts or actor placement',profile.depletionFixture.noInventoryResourceAgeRngGift&&profile.depletionFixture.noActorPositionAssigned);
   for(const[id,value]of [['expandCodex4000',9],['expandTerritories160',10]]){const result=await transaction(page,viewport.touch,id,'generation',value);profile.transactions.push(result);rec.check('Trusted depot '+id+' changes only generation and preserves ecology1, finite history, resources and RNG',result.pass);}
   await operations(page,viewport.touch);const health='#expansionAction-world131-sanitationMedical164';
   profile.guard=await page.locator(health).evaluate(node=>({disabled:node.disabled,text:node.parentElement.textContent,revision:DEADWALL.frontier.snapshot().detailVersion}));
   rec.check('The actual sanitary command is disabled until revision12 with its explicit reason',profile.guard.disabled&&profile.guard.revision<12&&/révision 12/.test(profile.guard.text));
   const composition=await transaction(page,viewport.touch,'completeCodex163','detailVersion',12);profile.transactions.push(composition);rec.check('Trusted depot composition reaches revision12 with every other saved field intact',composition.pass);
   await operations(page,viewport.touch);await page.locator(health).scrollIntoViewIfNeeded();rec.check('Sanitary revision13 is now available at the real depot and its control is hit-testable',await page.locator(health).isEnabled()&&(await visibleInPanel(page,health,'.command-body')).pass);
   const healthResult=await transaction(page,viewport.touch,'sanitationMedical164','detailVersion',13);profile.transactions.push(healthResult);rec.check('Trusted sanitary action changes only revision12→13 without resources, care or RNG gifts',healthResult.pass);
   await operations(page,viewport.touch);rec.check('The acquired revision13 command cannot activate twice',await page.locator(health).isDisabled());
   const beforePreview=await material(page),wcHost=await programme(page,viewport.touch,'DW-0012'),toggle=wcHost+' [data-fixtures164="revision"]';
   await page.locator(wcHost+' [data-density163="revision"]').check();const baseline=await drawPreview(page,viewport.touch,wcHost,'DW-0012',42,12);profile.previews.push(baseline);
   await page.locator(toggle).scrollIntoViewIfNeeded();profile.fixtureControl=(await visibleInPanel(page,toggle,'.command-body')).pass;await page.locator(toggle).check();
   const wc=await drawPreview(page,viewport.touch,wcHost,'DW-0012',42);profile.previews.push(wc);
   rec.check('Actual revision13 checkbox and native preview painter display a real source-backed WC',profile.fixtureControl&&baseline.pass&&wc.pass&&wc.fixtures?.added>0&&wc.toiletIds.length>0&&wc.toiletIds.every(id=>wc.observer.hits.some(hit=>hit.id===id&&hit.name==='draw'&&hit.painted))&&wc.imageSHA256!==baseline.imageSHA256);
   await page.locator(wcHost+' canvas').scrollIntoViewIfNeeded();await rec.screenshot('washroom-preview');await page.locator(wcHost+' canvas').screenshot({path:path.join(output,viewport.name+'-washroom-canvas.png')});profile.screenshots.push(viewport.name+'-washroom-canvas.png');
   profile.previews.push(await drawPreview(page,viewport.touch,wcHost,'DW-0012',84329));const replay=await drawPreview(page,viewport.touch,wcHost,'DW-0012',42);profile.previews.push(replay);
   rec.check('Returning to the same preview seed restores exact geometry, sanitary identities and pixels',replay.pass&&wc.planSHA256===replay.planSHA256&&wc.detailsSHA256===replay.detailsSHA256&&wc.imageSHA256===replay.imageSHA256);
   profile.medicalSite=await page.evaluate(()=>{
    const w=DEADWALL.frontier.world(),sites=w.contextSites160(),p=['DW-1241','DW-1246','DW-0476'].map(id=>sites.find(p=>p.programme160===id)).find(p=>p&&w.plan(p,0).fixtures164?.careSupports>0);
    if(!p)throw Error('A real seeded G10 paid-care support with revision13 is required');const plan=w.plan(p,0);return{site:p.id,programme:p.programme160,careSupports:plan.fixtures164.careSupports,operations:plan.operations160.filter(op=>op.kind==='medicalCare'),actorPositionAssigned:false};
   });
   const careHost=await programme(page,viewport.touch,profile.medicalSite.programme);await page.locator(careHost+' [data-fixtures164="revision"]').check();const care=await drawPreview(page,viewport.touch,careHost,profile.medicalSite.programme,42);profile.previews.push(care);
   rec.check('The real preview paints every annotated existing paid-care support without moving its source objects',care.pass&&care.care?.careSupports>0&&care.careIds.length===care.care.careSupports&&care.careIds.every(id=>care.observer.hits.some(hit=>hit.name==='care'&&hit.id===id&&hit.painted))&&/service reste payé/.test(care.status));
   await page.locator(careHost+' canvas').scrollIntoViewIfNeeded();await rec.screenshot('medical-preview');await page.locator(careHost+' canvas').screenshot({path:path.join(output,viewport.name+'-medical-canvas.png')});profile.screenshots.push(viewport.name+'-medical-canvas.png');
   rec.check('All sanitary seed/revision previews preserve every saved owner, inventory and RNG',beforePreview===await material(page));
   profile.checkpoint=await checkpoint(page,viewport.touch);rec.check('Real Save/menu/reload/Continue restores every saved field and removes the temporary observer',profile.checkpoint.comparison&&profile.checkpoint.wrapperRestored);
   rec.check('Continue retains seed17117, G10, ecology1, revision13 and the exact finite depletion',await page.evaluate(depletion=>{const s=DEADWALL.frontier.snapshot();return DEADWALL.world.seed===17117&&s.generation===10&&s.ecologyVersion===1&&s.detailVersion===13&&s.taken[depletion.container]===depletion.taken;},profile.depletionFixture));
   profile.continuedContainer=await page.evaluate(depletion=>{
    const w=DEADWALL.frontier.world(),p=w.pois.find(p=>p.id===depletion.site),o=p&&w.plan(p,depletion.level).objects.find(o=>o.id===depletion.container),taken=DEADWALL.frontier.snapshot().taken[depletion.container]||0;
    return{site:p?.id,container:o?.id,sourceAmount:o?.amount,sourceResource:o?.resource,taken,available:o?Math.max(0,o.amount-taken):null,
     pass:!!o&&o.amount===depletion.originalAmount&&o.resource===depletion.originalResource&&taken===depletion.taken&&Math.max(0,o.amount-taken)===0};
   },profile.depletionFixture);
   rec.check('The reconstructed original container retains its source stock and has zero resources available after Continue',profile.continuedContainer.pass);
   profile.continuedProvider=await page.evaluate(sharedProvider);rec.check('Continued D17 still shares its restored regional ecology provider',profile.continuedProvider.pass);await rec.screenshot('continued-d17');
   rec.check('No horizontal page overflow or browser/console/HTTP/request errors',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)&&rec.errors()===0);
   profile.pass=true;console.log(JSON.stringify({profile:viewport.name,pass:true,checks:profile.checks.length,ecology:profile.continuedProvider.ecology,revision:13}));
  }catch(error){profile.pass=false;profile.failure=error.stack;if(page)profile.failureState=await page.evaluate(()=>({state:globalThis.DEADWALL?.state,paused:globalThis.DEADWALL?.paused,overlay:globalThis.DEADWALL?.activeOverlay?.id,frontier:globalThis.DEADWALL?.frontier?.position?.(),messages:document.querySelector('#notifications')?.textContent})).catch(()=>null);if(rec)await rec.screenshot('failure').catch(()=>{});throw error;}
  finally{await context?.close();}
 }
 report.pass=report.profiles.length===profiles.length&&report.profiles.every(profile=>profile.pass);
}finally{await harness.finish();await harness.close();}
