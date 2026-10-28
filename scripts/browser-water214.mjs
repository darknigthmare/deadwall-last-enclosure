import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHarness, recorder, ready, chooseCampaign} from './browser-qa-common142.mjs';
import {activate, openCommand, visibleInPanel, persistedSnapshot, persistentRestoreComparison} from './browser-qa-common144.mjs';

const require = createRequire(import.meta.url), Manifest = require('./public-manifest183.cjs');
const Sources = require('./campaign-sources205.cjs');
const repository = fileURLToPath(new URL('..', import.meta.url)), self = fileURLToPath(import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex'), equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
process.env.DEADWALL_QA_ROOT ||= path.join(repository, 'dist');
const servedRoot = path.resolve(process.env.DEADWALL_QA_ROOT), sourceScriptSha256 = sha(await fs.readFile(self));
const views = [{name:'desktop', width:1440, height:900}, {name:'mobile', width:390, height:844, touch:true}];
const selected = process.env.DEADWALL_QA_PROFILES?.split(',');
if (selected && (new Set(selected).size !== selected.length || selected.some(name => !views.some(v => v.name === name)))) throw Error('Unknown or repeated water214 QA profile');
const profiles = selected ? views.filter(v => selected.includes(v.name)) : views;
const harness = await createHarness('water214', 'Ordinary player entry and one declared initial G11 scene per desktop/emulated-touch profile: a real exposed rain barrel, one discovery, a free starting pose just outside work reach, finite wood8/scrap8, and an initial legacy storm with weather=weatherTarget=1 and weather193 inactive. No collector, bucket water, enemy removal, city reinforcement, clock or RNG is prepared. Afterwards only native input, actual operation buttons, pause and Save/Menu/Continue advance gameplay. Passive transaction/render/restore observers are removed and checked. Rain may naturally change; no timer is invented. This is an automated prepared journey, not a human campaign or physical-device/FPS qualification.');
const {browser, report, output, version} = harness, ordinary = new URL(harness.base);
ordinary.searchParams.delete('tools'); ordinary.searchParams.delete('fixture');
Object.assign(report, {surface:'Ordinary player URL with one explicitly declared initial rain scene.', version, servedRoot,
  sourceScriptSha256, sourceBefore:Sources.capture(repository), distribution:[], profiles:[],
  limits:['The natural 24-unit reservoir saturation and full 8-unit bucket refusal have separate native tests; this short journey checks their bounds, useful transfers and empty refusals, without accelerating rainfall.']});
let fixtureFingerprint;
const selector = id => '[id="' + id + '"]';
const near = (a, b, epsilon = 1e-7) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= epsilon;
const exactPayment = (a, b, cost) => [...new Set([...Object.keys(a), ...Object.keys(b), ...Object.keys(cost)])].every(k => near((a[k] || 0) - (b[k] || 0), cost[k] || 0));
const state = page => page.evaluate(() => {
  const g = DEADWALL, owner = g.campaignWater214;
  return {state:g.state, gameOver:!!g.gameOver, elapsed:g.elapsed, pose:g.frontier.position(), health:g.player.health,
    carry:{...g.player.carry}, depot:{...g.resources}, water:owner.snapshot(), bucket:g.siege.carriedWater199(),
    activity:owner.activity(), busy:owner.busy(), weather:g.weather, weatherTarget:g.weatherTarget,
    weatherMode:g.weather193.snapshot(), siege:g.siege.snapshot(), taken:g.frontier.snapshot().taken,
    paused:g.paused, overlay:g.activeOverlay?.id ?? null};
});
async function pause(page, touch) {
  if (!await page.locator('#pauseMenu').isVisible()) await activate(page, '#pauseButton', touch);
  await page.waitForFunction(() => DEADWALL.paused);
}
async function resume(page, touch) {
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandReturn129', touch);
  if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}
async function notebook(page, touch) {
  if (!await page.locator('#commandModal').isVisible()) await openCommand(page, touch, 'field');
  else await activate(page, '#commandTab-field', touch);
  await activate(page, '#notebookDomain-terrain', touch);
  await activate(page, '#expansionFieldTab', touch);
  await page.locator('#playerOperationSelect196').selectOption('water214');
  await page.waitForFunction(() => document.getElementById('playerOperationSelect196').value === 'water214');
}
async function button(page, touch, kind, support) {
  await notebook(page, touch);
  const id = 'expansionAction-water214-water214-' + kind + '-' + support.supportId, css = selector(id);
  await page.locator(css).waitFor({state:'attached'});
  if (!await page.locator(css).isVisible()) {
    const details = page.locator(css).locator('xpath=ancestor::details[1]');
    if (await details.count() && !await details.evaluate(n => n.open)) await activate(page, '#unavailableActions194 > summary', touch);
  }
  await page.locator(css).scrollIntoViewIfNeeded();
  return {id, selector:css, label:await page.locator(css).innerText(), disabled:await page.locator(css).isDisabled(),
    layout:await visibleInPanel(page, css, '.command-body')};
}
async function beginUI(page, touch, kind, support, check) {
  const control = await button(page, touch, kind, support);
  check(kind + ': real operation button is visible, hit-testable and enabled', control.layout.pass && control.layout.box.height >= 44 && !control.disabled);
  await activate(page, control.selector, touch); await resume(page, touch);
  await page.waitForFunction(() => DEADWALL.gameOver || DEADWALL.campaignWater214.busy());
  assert.ok(await page.evaluate(() => !DEADWALL.gameOver && DEADWALL.campaignWater214.busy()), 'Actual water job began through its UI');
  return control;
}
async function bucketToolUI(page, touch, wanted) {
  if (await page.evaluate(() => DEADWALL.siege.toolActive()) === wanted) return;
  if (!await page.locator('#commandModal').isVisible()) await openCommand(page, touch, 'field');
  else await activate(page, '#commandTab-field', touch);
  await activate(page, '#notebookDomain-city', touch);
  await activate(page, '[data-field-view="siege"]', touch);
  await page.locator('#siegeTool').scrollIntoViewIfNeeded();
  await activate(page, '#siegeTool', touch);
  assert.equal(await page.evaluate(() => DEADWALL.siege.toolActive()), wanted);
}
async function zoom(page, touch) {
  if (touch && !await page.locator('#touchCommandDrawer').evaluate(n => n.open)) await activate(page, '#touchCommandDrawer > summary', true);
  if (!touch) {const box = await page.locator('#game').boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);}
  let inputs = 0;
  while (!near(await page.evaluate(() => DEADWALL.frontier.scale()), 44) && inputs++ < 20) {
    const up = await page.evaluate(() => DEADWALL.frontier.scale()) < 44;
    if (touch) await activate(page, '[data-game-command="' + (up ? 'zoomIn' : 'zoomOut') + '"]', true);
    else await page.mouse.wheel(0, up ? -100 : 100);
    await page.waitForTimeout(35);
  }
  if (touch && await page.locator('#touchCommandDrawer').evaluate(n => n.open)) await activate(page, '#touchCommandDrawer > summary', true);
  return {inputs, actual:await page.evaluate(() => DEADWALL.frontier.scale())};
}

function prepareRainScene214() {
  const g = DEADWALL, w = g.frontier.world(), H = DeadwallCampaignWaterSupports214, C = DeadwallCore, R = C.CampaignWater214Rules;
  if (w.generation !== 11 || g.frontier.active() || g.campaignWater214.busy() || g.campaignWater214.snapshot().collectors.length || g.siege.carriedWater199() !== 0) throw Error('A fresh ordinary idle G11 with an empty shared bucket and no collector is required');
  const raw = DeadwallSave.validate(g.serialize()), options = {structureDestroyed:id => g.worldEvolution.structureDestroyed(id)};
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
  const protectedState = save => {
    const value = structuredClone(save); delete value.timestamp; delete value.weather; delete value.weatherTarget; delete value.player.carry;
    for (const key of ['active', 'x', 'y', 'z', 'inside', 'a', 'anchor', 'seen']) delete value.frontier[key];
    delete value.expansions127.modules.weather193;
    // Bag rectangles are derived from the one explicitly prepared finite bag;
    // layouts belonging to cars and companions remain protected.
    if (value.loadout129) value.loadout129.layouts = value.loadout129.layouts.filter(item => item.container !== 'sac');
    return JSON.stringify(canonical(value));
  };
  const before = protectedState(raw), candidates = [];
  for (const p of w.pois.filter(p => p.campaign205 && w.threatCount(p) === 0).sort((a, b) => a.id.localeCompare(b.id))) {
    const seen = [...new Set([...raw.frontier.seen, p.id])];
    for (const descriptor of H.supportsFor(p, w.plan(p, 0), w.detailAt(p, 0))) {
      if (w.coveredAt205(descriptor.center.x, descriptor.center.y, 0, null) !== false) continue;
      let support;
      for (const face of descriptor.approaches) {
        const q = H.resolve(w, {active:true, generation:11, ...face.anchor, inside:null, car:null}, descriptor, seen, options);
        if (q.ok) {support = q; break;}
      }
      if (!support) continue;
      for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const start = {x:support.anchor.x + dx * (R.reach + .5), y:support.anchor.y + dy * (R.reach + .5), z:0};
        if (w.blocked(start.x, start.y, .38, 0, null) || !w.movementLine(start, support.anchor, 0, null, null, .38)) continue;
        if (w.pois.some(q => w.threatCount(q) > 0 && Math.hypot(q.x - start.x, q.y - start.y) < Math.hypot(q.w, q.h) / 2 + 24)) continue;
        candidates.push({p, support, start}); break;
      }
    }
  }
  if (!candidates.length) throw Error('No real exposed, initially unprepared G11 rain barrel has a short clear approach outside work reach');
  const {p, support, start} = candidates[0];
  Object.assign(raw.frontier, {active:true, ...start, inside:null, a:p.a, anchor:{x:g.player.x, y:g.player.y}});
  raw.frontier.seen = [...new Set([...raw.frontier.seen, p.id])];
  raw.player.carry = C.makeBag(); Object.assign(raw.player.carry, {wood:8, scrap:8});
  raw.weather = 1; raw.weatherTarget = 1; raw.expansions127.modules.weather193 = {version:1, active:false};
  if (protectedState(raw) !== before) throw Error('Initial fixture modified an undeclared persistent owner');
  if (g.restoreSave(DeadwallSave.validate(raw)) !== true) throw Error('Initial prepared rain scene was refused');
  g.togglePause(true); g.updateUI();
  if (protectedState(DeadwallSave.validate(g.serialize())) !== before) throw Error('Initial fixture restoration changed a protected owner');
  const current = g.frontier.position(), refused = H.resolve(g.frontier.world(), current, support, g.frontier.discoveries(), options);
  if (refused.ok || g.campaignWater214.snapshot().collectors.length || g.siege.carriedWater199() !== 0) throw Error('Fixture must start outside reach without manufacturing any water or collector');
  return {kind:'single-initial-real-G11-exposed-rain-barrel', seed:g.world.seed,
    site:{id:p.id, type:p.type, typology:p.campaign205.typology, variant:p.campaign205.variant, nativeThreats:w.threatCount(p)},
    support, start, clearPath:[start, support.anchor], costs:{...R.prepare.cost}, durations:{prepare:R.prepare.seconds, draw:R.draw.seconds, pour:R.pour.seconds},
    assignedFields:['one initial regional pose and site discovery', 'finite carry wood8/scrap8 with its derived bag rectangles', 'weather1/target1 and legacy weather193 inactive', 'initial pause'],
    noCollectorPrepared:true, bucketInitiallyEmpty:true, noInventedWeatherTimer:true, initialRefusal:refused,
    protectedOwnersPreserved:true, enemyNeutralisations:[], coordinateAssignmentsAfterFixture:0};
}

async function walk(page, context, touch, target, {support, interrupt = false} = {}) {
  const result = {nativeEvents:0, coordinateAssignments:0, samples:[], holds:[]}, initial = await page.evaluate(() => DEADWALL.frontier.position());
  const keys = {left:'a', right:'d', up:'w', down:'s'}, boxes = {}; let session;
  if (touch) {session = await context.newCDPSession(page); for (const name of Object.keys(keys)) {const b = await page.locator('#touchControls [data-dir="' + name + '"]').boundingBox(); assert.ok(b); boxes[name] = {x:b.x + b.width / 2, y:b.y + b.height / 2};}}
  else await page.locator('#game').focus();
  try {
    for (let count = 0; count < 90; count++) {
      const q = await page.evaluate(({target, support, interrupt, initial, touch}) => {
        const g = DEADWALL, p = g.frontier.position(), w = g.frontier.world(), clear = !w.blocked(p.x, p.y, .32, 0, p.inside);
        const resolved = support && DeadwallCampaignWaterSupports214.resolve(w, p, support, g.frontier.discoveries(), {structureDestroyed:id => g.worldEvolution.structureDestroyed(id)});
        const moved = Math.hypot(p.x - initial.x, p.y - initial.y), distance = Math.hypot(target.x - p.x, target.y - p.y);
        const done = interrupt ? moved > .01 && !g.campaignWater214.busy() : resolved?.ok || distance < .055;
        const vectors = touch ? [[1,0], [0,1], [-1,0], [0,-1]] : [[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
        const steering = vectors.map(([dx,dy]) => {const n = Math.hypot(dx,dy), at = {x:p.x + dx / n * .24, y:p.y + dy / n * .24}; return {dx,dy,score:Math.hypot(at.x-target.x,at.y-target.y),clear:!w.blocked(at.x,at.y,.32,0,p.inside) && w.movementLine(p,at,0,p.inside,null,.32)};}).filter(v => v.clear).sort((a,b) => a.score-b.score)[0];
        return {pose:p, clear, done, moved, distance, resolved, steering, alive:g.state === 'playing' && !g.gameOver && g.player.health > 0 && !g.paused && !g.activeOverlay, keys:[...g.input.keys]};
      }, {target, support, interrupt, initial, touch:!!touch});
      result.samples.push(q); assert.ok(q.alive && q.clear && q.keys.length === 0, 'Native walker stays alive, unpaused, released and outside real solids');
      if (q.done) {result.arrival = q; return result;}
      assert.ok(q.steering, 'A real body-radius movement ray is available');
      const {dx,dy} = q.steering, names = []; if (dx) names.push(dx > 0 ? 'right' : 'left'); if (dy) names.push(dy > 0 ? 'down' : 'up');
      const touchDirection = dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), hold = {from:q.pose, dx, dy, plannedMilliseconds:70}, started = Date.now();
      const down = touch ? session.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[boxes[touchDirection]]}) : Promise.all(names.map(n => page.keyboard.down(keys[n])));
      const up = new Promise(resolve => setTimeout(resolve, 70)).then(async () => {hold.releaseEnqueuedMilliseconds = Date.now()-started; if (touch) await session.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]}); else await Promise.all(names.map(n => page.keyboard.up(keys[n])));});
      result.nativeEvents += touch ? 2 : names.length * 2;
      try {await down;} finally {await up;}
      hold.actualWallMilliseconds = Date.now()-started; result.holds.push(hold);
    }
    throw Error('Short native water approach did not reach the unchanged product permission');
  } finally {
    for (const key of Object.values(keys)) await page.keyboard.up(key).catch(() => {});
    if (session) {await session.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]}).catch(() => {}); await session.detach();}
  }
}
async function nudge(page, context, touch) {
  const target = await page.evaluate(() => {
    const g = DEADWALL, p = g.frontier.position(), w = g.frontier.world();
    for (const [dx,dy] of [[.28,0], [-.28,0], [0,.28], [0,-.28]]) {const q = {x:p.x+dx,y:p.y+dy}; if (!w.blocked(q.x,q.y,.38,0,null) && w.movementLine(p,q,0,null,null,.38)) return q;}
    throw Error('No real collision-free interruption step');
  });
  return walk(page, context, touch, target, {interrupt:true});
}

async function startObservers(page, supportId) {
  return page.evaluate(supportId => {
    const g = DEADWALL, C = DeadwallCore, spendDescriptor = Object.getOwnPropertyDescriptor(C, 'spend'), siegeDescriptor = Object.getOwnPropertyDescriptor(g, 'siege'), saveDescriptor = Object.getOwnPropertyDescriptor(g, 'save');
    if (globalThis.__WATER214_OBSERVER__ || !spendDescriptor?.writable || !siegeDescriptor?.writable || saveDescriptor?.writable === false) throw Error('Original writable owner facades are required for passive observation');
    const material = () => {const {timestamp,...v}=g.serialize(); return JSON.stringify(v);}, before = material();
    const observer = {g,C,spendDescriptor,siegeDescriptor,saveDescriptor,spend:spendDescriptor.value,siege:g.siege,save:g.save,payments:[],transfers:[],preparations:[],pending:null};
    const capture = () => ({reservoir:g.campaignWater214.status(supportId)?.water ?? null,bucket:observer.siege.carriedWater199(),carry:{...g.player.carry},depot:{...g.resources},elapsed:g.elapsed});
    Object.defineProperty(C, 'spend', {...spendDescriptor, value:function(source,cost,...rest) {
      const watched = source === g.player.carry, b = watched ? capture() : null, result = Reflect.apply(observer.spend,this,[source,cost,...rest]);
      if (watched) {const record={before:b,after: capture(),cost:{...cost},result}; observer.payments.push(record);observer.pending={kind:'prepare',record};}
      return result;
    }});
    const facade = Object.freeze({...observer.siege, transferFieldWater199:function(direction,requested) {
      const b=capture(), accepted=Reflect.apply(observer.siege.transferFieldWater199,observer.siege,[direction,requested]), afterBucket=capture();
      const record={direction,requested,accepted,before:b,afterBucket}; observer.transfers.push(record);
      observer.pending={kind:'transfer',record};
      return accepted;
    }});
    // finish() invokes the real save synchronously after committing its fixed
    // reservoir. A microtask would run too late when one RAF has several ticks.
    Object.defineProperty(g,'save',{configurable:true,writable:true,enumerable:saveDescriptor?.enumerable??false,value:function(...args) {
      const pending=observer.pending;observer.pending=null;
      if(pending?.kind==='prepare') {
        const committed=capture(),siteId=supportId.split(':')[0];
        observer.preparations.push({committed,checkpoint:'entry-to-native-owner-save',
          emptyDraw:g.campaignWater214.preview('draw',siteId,supportId),repeatPrepare:g.campaignWater214.preview('prepare',siteId,supportId)});
      } else if(pending?.kind==='transfer') {
        pending.record.afterReservoir=capture();pending.record.checkpoint='entry-to-native-owner-save';
      }
      return Reflect.apply(observer.save,this,args);
    }});
    Object.defineProperty(g,'siege',{...siegeDescriptor,value:facade}); globalThis.__WATER214_OBSERVER__=observer;
    return {persistentUnchanged:before===material(),scope:'Passive Core.spend, frozen siege facade and native save-entry wrappers; no stock, source, time or input value replaced.'};
  }, supportId);
}
async function stopObservers(page) {
  return page.evaluate(() => {
    const s=globalThis.__WATER214_OBSERVER__;if(!s)return {restored:false};const material=()=>{const{timestamp,...v}=s.g.serialize();return JSON.stringify(v);},before=material();
    Object.defineProperty(s.C,'spend',s.spendDescriptor);Object.defineProperty(s.g,'siege',s.siegeDescriptor);
    if(s.saveDescriptor)Object.defineProperty(s.g,'save',s.saveDescriptor);else delete s.g.save;
    delete globalThis.__WATER214_OBSERVER__;
    return {payments:s.payments,transfers:s.transfers,preparations:s.preparations,pendingCommit:!!s.pending,persistentUnchanged:before===material(),restored:s.C.spend===s.spend&&s.g.siege===s.siege&&s.g.save===s.save};
  });
}
async function artReadout(page, supportId) {
  return page.evaluate(async supportId => {
    const g=DEADWALL,original=DeadwallCampaignSiteArt205,descriptor=Object.getOwnPropertyDescriptor(globalThis,'DeadwallCampaignSiteArt205');
    const material=()=>{const{timestamp,...v}=g.serialize();return JSON.stringify(v);},before=material(),calls=[];
    globalThis.DeadwallCampaignSiteArt205={...original,drawProp(...args) {
      if(args[2]?.id===supportId)calls.push({gamePassed:args[3]?.game===g,view:original.waterPresentation214(g,args[2],args[3]?.floor??0),hero:g.heroActions133.pose()});
      return original.drawProp(...args);
    }};
    try {await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}
    finally {if(descriptor)Object.defineProperty(globalThis,'DeadwallCampaignSiteArt205',descriptor);else delete globalThis.DeadwallCampaignSiteArt205;}
    return {calls,persistentUnchanged:before===material(),restored:globalThis.DeadwallCampaignSiteArt205===original,paused:g.paused};
  },supportId);
}
async function saveContinue(page,touch) {
  await pause(page,touch);await activate(page,'#saveButton',touch);const checkpoint=await persistedSnapshot(page);assert.ok(checkpoint.ok);
  await activate(page,'#quitButton',touch);await page.reload({waitUntil:'networkidle'});await ready(page);
  await page.evaluate(() => {
    const g=DEADWALL,descriptor=Object.getOwnPropertyDescriptor(g,'restoreSave'),original=g.restoreSave;
    globalThis.__WATER214_RESTORE__={g,descriptor,original};globalThis.__DEADWALL_QA_RESTORED_144__=null;
    g.restoreSave=function(...args) {const result=original.apply(this,args),{timestamp,...v}=DeadwallSave.validate(g.serialize());globalThis.__DEADWALL_QA_RESTORED_144__=structuredClone(v);return result;};
  });
  try {await activate(page,'#continueButton',touch);await page.waitForFunction(()=>DEADWALL.state==='playing');checkpoint.comparison=await page.evaluate(persistentRestoreComparison,{material:checkpoint.material,cp:checkpoint});checkpoint.pass=checkpoint.comparison.pass;}
  finally {checkpoint.wrapperRestored=await page.evaluate(()=>{const s=__WATER214_RESTORE__;if(s.descriptor)Object.defineProperty(s.g,'restoreSave',s.descriptor);else delete s.g.restoreSave;const okay=s.g.restoreSave===s.original;delete globalThis.__WATER214_RESTORE__;delete globalThis.__DEADWALL_QA_RESTORED_144__;return okay;});}
  return checkpoint;
}
async function compactSummary(complete) {
  const file=path.join(output,complete?'report.json':'report.partial.json'),bytes=await fs.readFile(file);
  const summary={kind:'water214-browser-summary',version,complete,pass:complete&&report.pass===true,sourceScriptSha256,
    report:{file:path.basename(file),bytes:bytes.length,sha256:sha(bytes)},profiles:report.profiles.map(p=>({name:p.viewport.name,pass:p.pass===true,
      checks:p.checks.length,passed:p.checks.filter(c=>c.pass).length,failure:p.failure?.slice(0,1200),simulatedSeconds:p.simulatedSeconds,
      errors:{page:p.pageErrors.length,console:p.consoleErrors.length,http:p.httpErrors.length,request:p.requestFailures.length}}))};
  const text=JSON.stringify(summary,null,2)+'\n';assert.ok(Buffer.byteLength(text)<8192);await fs.writeFile(path.join(output,'water214-summary.json'),text);
}

try {
  const entries=Manifest.readPublicEntries(repository),expected=['index.html',...entries.scripts,...entries.styles];
  for(const name of expected) {const source=await fs.readFile(path.join(repository,name)),dist=await fs.readFile(path.join(servedRoot,name));assert.equal(sha(source),sha(dist),'Build/source mismatch '+name);report.distribution.push({path:name,bytes:dist.length,sha256:sha(dist)});}
  for(const viewport of profiles) {
    const profile={viewport,walks:[],jobs:[],recoveries:[],art:[],realStartedUtc:new Date().toISOString()};report.profiles.push(profile);
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'}),page=await context.newPage();
    page.setDefaultTimeout(120000);const rec=recorder(page,profile,output,viewport.name+'-'),check=(name,value)=>{rec.check(name,value);console.log(JSON.stringify({profile:viewport.name,check:name,pass:true}));};
    try {
      profile.servedDistribution=[];
      for(let from=0;from<report.distribution.length;from+=8)await Promise.all(report.distribution.slice(from,from+8).map(async row=>{
        const response=await context.request.get(new URL(row.path,ordinary.origin+'/').href),bytes=await response.body(),type=response.headers()['content-type']?.split(';')[0];
        assert.equal(response.status(),200,row.path);assert.equal(sha(bytes),row.sha256,row.path);
        assert.ok(row.path.endsWith('.css')?type==='text/css':row.path.endsWith('.html')?type==='text/html':['application/javascript','text/javascript'].includes(type),'MIME '+row.path);
        profile.servedDistribution.push({path:row.path,bytes:bytes.length,sha256:sha(bytes),type});
      }));
      check('All actual entry scripts and styles are served byte-identical with their MIME contracts',profile.servedDistribution.length===expected.length);
      await page.goto(ordinary.href,{waitUntil:'networkidle',timeout:120000});await ready(page);await page.waitForFunction(()=>DEADWALL.playerMenus194?.mode==='player');
      check('Ordinary player entry has no author or legacy query',new URL(page.url()).search==='');
      await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);
      await pause(page,viewport.touch);profile.fixture=await page.evaluate(prepareRainScene214);
      const fingerprint=sha(JSON.stringify({site:profile.fixture.site,support:profile.fixture.support,start:profile.fixture.start}));
      if(fixtureFingerprint)check('Both profiles resolve the same real seeded rain barrel and physical approach',fixtureFingerprint===fingerprint);else fixtureFingerprint=fingerprint;
      check('Single declared fixture preserves all protected owners and invents no collector, bucket, enemy, time or RNG',profile.fixture.protectedOwnersPreserved&&profile.fixture.noCollectorPrepared&&profile.fixture.bucketInitiallyEmpty&&profile.fixture.enemyNeutralisations.length===0);
      profile.initial=await state(page);check('Initial finite bag, actual storm and empty fixed/shared water owners are explicit',equal(profile.initial.carry,{wood:8,scrap:8,stone:0,food:0,fuel:0,ammo:0,medicine:0})&&profile.initial.bucket===0&&profile.initial.water.collectors.length===0&&profile.initial.weather===1&&profile.initial.weatherTarget===1&&!profile.initial.weatherMode.active);
      const pureBefore=await state(page),refusals=await page.evaluate(s=>({outside:DEADWALL.campaignWater214.preview('prepare',s.siteId,s.supportId),unknown:DEADWALL.campaignWater214.preview('prepare','P0000','P0000:205:static:999999'),wrongKind:DEADWALL.campaignWater214.preview('drink',s.siteId,s.supportId)}),profile.fixture.support);
      profile.initialPreviews=refusals;
      check('Outside native reach, unknown source and unsupported drinking are refused without saved changes',!profile.fixture.initialRefusal.ok&&Object.values(refusals).every(q=>!q.ok)&&equal(pureBefore,await state(page)));
      await resume(page,viewport.touch);profile.zoom=await zoom(page,viewport.touch);check('Native zoom exposes actual metric barrel art',near(profile.zoom.actual,44));
      profile.walks.push(await walk(page,context,viewport.touch,profile.fixture.support.anchor,{support:profile.fixture.support}));
      check('Actual keyboard or touch movement crosses the short collision-free approach into native work reach',profile.walks[0].nativeEvents>0&&profile.walks[0].coordinateAssignments===0&&profile.walks[0].arrival.resolved.ok);
      await bucketToolUI(page,viewport.touch,true);const handsBefore=await state(page),handsButton=await button(page,viewport.touch,'prepare',profile.fixture.support);
      check('Equipping the real siege tool refuses water work without a payment',handsButton.disabled&&await page.evaluate(s=>!DEADWALL.campaignWater214.preview('prepare',s.siteId,s.supportId).ok,profile.fixture.support)&&equal(handsBefore,await state(page)));
      await bucketToolUI(page,viewport.touch,false);await resume(page,viewport.touch);

      await beginUI(page,viewport.touch,'prepare',profile.fixture.support,check);await page.waitForFunction(()=>DEADWALL.campaignWater214.activity()?.elapsed>.25);await pause(page,viewport.touch);
      const partial=await state(page);check('Unfinished preparation has real work presentation but no prepaid collector or water',partial.busy&&partial.activity?.kind==='prepare'&&partial.water.collectors.length===0&&partial.bucket===0&&equal(partial.carry,profile.initial.carry));
      await page.waitForTimeout(350);check('Native pause freezes preparation and all rain collection',equal(partial,await state(page)));
      const art=await artReadout(page,profile.fixture.support.supportId);profile.art.push(art);check('Paused natural barrel renderer reads the active owner and is persistent-state pure',art.restored&&art.persistentUnchanged&&art.calls.length>0&&art.calls.every(c=>c.gamePassed&&c.view?.activity?.kind==='prepare'&&c.hero?.kind==='build'&&!c.hero.oneShot&&near(c.hero.elapsed,c.view.activity.elapsed)));
      const abandoned=await saveContinue(page,viewport.touch);profile.recoveries.push(abandoned);check('Real unpaid Save/Menu/Continue is exact and abandons transient preparation',abandoned.pass&&abandoned.wrapperRestored);
      await pause(page,viewport.touch);const continued=await state(page);check('Continue creates no collector, water, refund or resurrected task',!continued.busy&&!continued.activity&&continued.water.collectors.length===0&&continued.bucket===0&&equal(continued.carry,profile.initial.carry));await resume(page,viewport.touch);
      await beginUI(page,viewport.touch,'prepare',profile.fixture.support,check);await page.waitForFunction(()=>DEADWALL.campaignWater214.activity()?.elapsed>.2);
      profile.walks.push(await nudge(page,context,viewport.touch));await pause(page,viewport.touch);const cancelled=await state(page);
      check('Actual movement cancels the unpaid preparation with no inventory or water gain',!cancelled.busy&&!cancelled.activity&&cancelled.water.collectors.length===0&&equal(cancelled.carry,profile.initial.carry));await resume(page,viewport.touch);
      if(!await page.evaluate(s=>DEADWALL.campaignWater214.preview('prepare',s.siteId,s.supportId).ok,profile.fixture.support))profile.walks.push(await walk(page,context,viewport.touch,profile.fixture.support.anchor,{support:profile.fixture.support}));

      for(const kind of ['prepare','draw','pour']) {
        const support=profile.fixture.support;
        if(kind==='draw') {
          await resume(page,viewport.touch);await page.waitForFunction(id=>DEADWALL.gameOver||(DEADWALL.campaignWater214.status(id)?.water??0)>=2.05,support.supportId,{timeout:150000});await pause(page,viewport.touch);
          const rainy=await state(page);check('Unmodified playable weather naturally filled the prepared exposed reservoir',!rainy.gameOver&&rainy.elapsed>profile.initial.elapsed&&rainy.water.collectors[0].water>=2.05&&rainy.bucket===0);
          const emptyBucket=await button(page,viewport.touch,'pour',support);check('Actual pour button refuses an empty shared bucket',emptyBucket.disabled);
          await resume(page,viewport.touch);await beginUI(page,viewport.touch,'draw',support,check);await page.waitForFunction(()=>DEADWALL.campaignWater214.activity()?.elapsed>.15);
          await pause(page,viewport.touch);const beforeAbandon=await state(page);profile.abandonedDrawBefore=beforeAbandon;
          check('Native pause captures a genuinely incomplete draw before Save/Continue',beforeAbandon.busy&&beforeAbandon.activity?.kind==='draw'&&beforeAbandon.activity.elapsed<beforeAbandon.activity.duration&&beforeAbandon.bucket===0);
          const saved=await saveContinue(page,viewport.touch);profile.recoveries.push(saved);check('Real partial transfer Save/Menu/Continue preserves water exactly and cancels its task',saved.pass&&saved.wrapperRestored);
          await pause(page,viewport.touch);const afterAbandon=await state(page);check('Abandoned transfer never credits the shared bucket',!afterAbandon.busy&&!afterAbandon.activity&&afterAbandon.bucket===0&&equal(afterAbandon.carry,beforeAbandon.carry));await resume(page,viewport.touch);
        }
        const before=await state(page),observer=await startObservers(page,support.supportId);let active,after,observed;
        try {
          const control=await beginUI(page,viewport.touch,kind,support,check);await page.waitForFunction(()=>DEADWALL.campaignWater214.activity()?.elapsed>.2);
          const liveBefore=await state(page);await rec.screenshot(kind+'-live-game');const liveAfter=await state(page);
          check(kind+': archived PNG shows actual active gameplay rather than a Pause overlay',!liveBefore.paused&&!liveBefore.overlay&&!liveAfter.paused&&!liveAfter.overlay&&liveBefore.activity?.kind===kind&&liveAfter.activity?.kind===kind);
          await pause(page,viewport.touch);active=await state(page);const art=await artReadout(page,support.supportId);profile.art.push(art);
          check(kind+': natural paused renderer has exact owner-bound pieces and a pure pose read',art.restored&&art.persistentUnchanged&&art.calls.length>0&&art.calls.every(c=>c.gamePassed&&c.view?.activity?.kind===kind&&c.hero?.kind===(kind==='prepare'?'build':'handle')&&!c.hero.oneShot&&near(c.hero.elapsed,c.view.activity.elapsed)));
          const frozen=await state(page);await page.waitForTimeout(300);check(kind+': actual pause freezes job, reservoir, bucket and weather',equal(frozen,await state(page)));
          await resume(page,viewport.touch);await page.waitForFunction(()=>DEADWALL.gameOver||!DEADWALL.campaignWater214.busy(),null,{timeout:65000});await pause(page,viewport.touch);after=await state(page);
          profile.jobs.push({kind,control,before,active,after,instrumentation:observer});
        } finally {observed=await stopObservers(page);}
        profile.jobs.at(-1).observer=observed;
        check(kind+': passive synchronous observers are restored without persistent mutation',observer.persistentUnchanged&&observed.restored&&observed.persistentUnchanged&&!observed.pendingCommit&&!after.gameOver&&!after.busy);
        check(kind+': fixed reserve and the single shared bucket remain in their real finite bounds',after.water.collectors.length===1&&after.water.collectors[0].water>=0&&after.water.collectors[0].water<=24&&after.bucket>=0&&after.bucket<=8&&equal(before.taken,after.taken));
        if(kind==='prepare') {
          const payment=observed.payments[0],commit=observed.preparations[0];
          check('Preparation pays the exact carried materials once and does not debit the depot',observed.payments.length===1&&exactPayment(payment.before.carry,payment.after.carry,profile.fixture.costs)&&equal(payment.before.depot,payment.after.depot)&&exactPayment(before.carry,after.carry,profile.fixture.costs));
          check('The newly committed collector is actually empty before its first later rain step',observed.preparations.length===1&&commit.committed.reservoir===0&&commit.committed.bucket===0&&!commit.emptyDraw.ok&&commit.emptyDraw.reason.includes('Réserve vide')&&observed.transfers.length===0);
          check('Already-prepared support refuses another setup despite enough remaining materials',!commit.repeatPrepare.ok&&commit.repeatPrepare.reason.includes('déjà aménagé')&&after.carry.wood>=4&&after.carry.scrap>=4);
        } else {
          const transfer=observed.transfers[0],sign=kind==='draw'?1:-1;
          check(kind+': one actual shared-owner acceptance conserves the exact source and destination volume',observed.payments.length===0&&observed.transfers.length===1&&transfer.afterReservoir&&transfer.accepted>0&&transfer.accepted<=2&&near(transfer.afterBucket.bucket-transfer.before.bucket,sign*transfer.accepted)&&near(transfer.afterReservoir.reservoir-transfer.before.reservoir,-sign*transfer.accepted)&&equal(transfer.before.carry,transfer.afterReservoir.carry)&&equal(transfer.before.depot,transfer.afterReservoir.depot));
          check(kind+': continuous natural rain is kept separate from the atomic bucket transfer',after.water.collectors[0].water-before.water.collectors[0].water+sign*transfer.accepted>=-1e-7&&equal(before.carry,after.carry));
        }
        const recovery=await saveContinue(page,viewport.touch);profile.recoveries.push(recovery);check(kind+': native completed Save/Menu/Continue preserves every paid owner exactly',recovery.pass&&recovery.wrapperRestored);
        await pause(page,viewport.touch);const restored=await state(page);check(kind+': Continue neither duplicates water nor resurrects work',!restored.busy&&!restored.activity&&restored.bucket===after.bucket);
        const idle=await artReadout(page,support.supportId);profile.art.push(idle);check(kind+': idle persistent fittings have no active flow and remain pure',idle.restored&&idle.persistentUnchanged&&idle.calls.length>0&&idle.calls.every(c=>c.gamePassed&&c.view?.status?.prepared&&!c.view.activity&&!c.hero));
        await resume(page,viewport.touch);
      }
      await pause(page,viewport.touch);profile.final=await state(page);
      check('Round-trip water ends in the fixed reservoir with an empty unique carried bucket',profile.final.water.collectors.length===1&&profile.final.water.collectors[0].water>0&&near(profile.final.bucket,0)&&!profile.final.busy);
      check('All movement is native and page, console, HTTP and request collectors stay empty',profile.walks.every(w=>w.coordinateAssignments===0)&&rec.errors()===0);
      profile.pass=true;
    } catch(error) {
      profile.pass=false;profile.failure=error.stack;profile.failureState=await state(page).catch(()=>null);await stopObservers(page).catch(()=>{});await rec.screenshot('failure').catch(()=>{});
    } finally {
      await context.close();profile.realCompletedUtc=new Date().toISOString();if(profile.initial&&(profile.final||profile.failureState))profile.simulatedSeconds=(profile.final??profile.failureState).elapsed-profile.initial.elapsed;
    }
    await fs.writeFile(path.join(output,'report.partial.json'),JSON.stringify(report,null,2)+'\n');await compactSummary(false);
    console.log(JSON.stringify({profile:viewport.name,pass:profile.pass,checks:profile.checks.length,failure:profile.failure?.split('\n')[0]}));if(!profile.pass)break;
  }
  report.sourceAfter=Sources.capture(repository);assert.deepEqual(report.sourceAfter,report.sourceBefore,'Runtime source changed during water qualification');
  assert.equal(sha(await fs.readFile(self)),sourceScriptSha256,'Water scenario changed while running');
  report.pass=report.profiles.length===profiles.length&&report.profiles.every(p=>p.pass);
} catch(error) {report.pass=false;report.failure=error.stack;}
finally {try {await harness.close();}finally {await harness.finish();await compactSummary(true);}}
if(!report.pass)process.exitCode=1;
