import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, holdInput, visibleInPanel } from './browser-qa-common144.mjs';
import { loadedAssets } from './browser-qa-common142.mjs';

// The collision-sampled movement and manual-work helpers preserve the native
// D17/1.50 journey: they read geometry, then dispatch held keyboard/touch input.
async function withHold(page, context, touch, key, selector, action) {
  if (touch) {
    // Wait for the real control after drawers/overlays finish changing layout.
    // CDP touch dispatch does not perform Playwright's normal hit-test checks.
    try {
      await page.waitForFunction(selector => {
        const n = document.querySelector(selector), r = n?.getBoundingClientRect();
        if (!n || !r || n.closest('[inert],.hidden') || !n.checkVisibility({ checkVisibilityCSS: true }) || r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return false;
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return hit === n || n.contains(hit);
      }, selector, { timeout: 10000 });
    } catch (error) {
      error.deadwallTouchTarget = await page.locator(selector).evaluate(n => { const r = n.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { selector: n.dataset.dir || n.id, box: { x: r.x, y: r.y, width: r.width, height: r.height }, hit: hit?.id || hit?.className, visibility: n.checkVisibility({ checkVisibilityCSS: true }), hiddenAncestor: n.closest('[inert],.hidden')?.id, viewport: { width: innerWidth, height: innerHeight } }; });
      throw error;
    }
  }
  return holdInput(page, context, touch, key, selector, action);
}

async function planRoute(page, request) {
  return page.evaluate(request => {
    const game = DEADWALL, actor = game.player;
    const target = request.kind === 'node'
      ? game.world.nodes.filter(node => !node.depleted && node.type === request.type && node.amount >= request.amount)
        .sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y))[0]
      : game.world.buildings.get(request.id);
    if (!target) throw Error('No live route target: ' + JSON.stringify(request));
    const range = request.range, finishing = Boolean(target.def && !target.completed);
    // Real touch release can arrive several movement frames after a sampled
    // waypoint. Approach unfinished footprints from a wider exterior band.
    const desired = finishing ? Math.min(70, range - 4) : Math.min(36, range * .65), spacing = 16;
    const marginForBody = actor.radius + (finishing ? 32 : 5);
    const start = { x: actor.x, y: actor.y }, targetBox = target.def && {
      left: target.left - marginForBody, right: target.right + marginForBody,
      top: target.top - marginForBody, bottom: target.bottom + marginForBody
    };
    const goal = point => {
      const probe = { ...actor, ...point };
      if (targetBox && point.x >= targetBox.left && point.x <= targetBox.right && point.y >= targetBox.top && point.y <= targetBox.bottom) return false;
      return game.fieldcraft.distance(point, target) <= desired && game.workerCanWorkAt(probe, target, range);
    };
    for (const margin of [128, 256, 512]) {
      const bounds = { left: Math.min(start.x, target.x) - margin, right: Math.max(start.x, target.x) + margin,
        top: Math.min(start.y, target.y) - margin, bottom: Math.max(start.y, target.y) + margin };
      const key = (x, y) => x + ':' + y, queue = [{ x: 0, y: 0 }], parents = new Map([[key(0, 0), null]]), clear = new Map();
      const pointAt = cell => ({ x: start.x + cell.x * spacing, y: start.y + cell.y * spacing });
      const free = cell => {
        const id = key(cell.x, cell.y);
        if (!clear.has(id)) {
          const point = pointAt(cell);
          clear.set(id, point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom && game.friendlyPositionClear(actor, point.x, point.y));
        }
        return clear.get(id);
      };
      let found;
      for (let head = 0; head < queue.length && head < 12000; head++) {
        const current = queue[head], point = pointAt(current);
        if (goal(point)) { found = current; break; }
        for (const [dx, dy] of [[1, 0], [0, -1], [-1, 0], [0, 1]]) {
          const next = { x: current.x + dx, y: current.y + dy }, id = key(next.x, next.y);
          if (parents.has(id) || !free(next)) continue;
          const nextPoint = pointAt(next);
          if (![.25, .5, .75].every(t => game.friendlyPositionClear(actor, point.x + (nextPoint.x - point.x) * t, point.y + (nextPoint.y - point.y) * t))) continue;
          parents.set(id, current); queue.push(next);
        }
      }
      if (!found) continue;
      const cells = [];
      for (let cell = found; cell; cell = parents.get(key(cell.x, cell.y))) cells.push(cell);
      cells.reverse();
      const segments = [];
      for (let i = 1; i < cells.length; i++) {
        const previous = cells[i - 1], cell = cells[i], direction = cell.x > previous.x ? 'right' : cell.x < previous.x ? 'left' : cell.y > previous.y ? 'down' : 'up';
        if (segments.at(-1)?.direction === direction) segments.at(-1).target = pointAt(cell);
        else segments.push({ direction, target: pointAt(cell) });
      }
      return { target: { id: target.id, x: target.x, y: target.y, type: target.type, amount: target.amount }, segments };
    }
    throw Error('No sampled collision-safe route to ' + target.id);
  }, request);
}

async function navigate(page, context, touch, request) {
  const route = await planRoute(page, request);
  const keys = { up: 'w', down: 's', left: 'a', right: 'd' };
  for (const segment of route.segments) {
    const axis = ['left', 'right'].includes(segment.direction) ? 'x' : 'y';
    const sign = ['left', 'up'].includes(segment.direction) ? -1 : 1;
    await withHold(page, context, touch, keys[segment.direction], '#touchControls [data-dir="' + segment.direction + '"]', () =>
      page.waitForFunction(({ axis, sign, target }) => sign * (DEADWALL.player[axis] - target[axis]) >= -2,
        { axis, sign, target: segment.target }, { timeout: 15000 }));
  }
  await page.waitForFunction(() => DEADWALL.input.keys.size === 0);
  return route;
}

async function readEconomy(page) {
  return page.evaluate(() => ({ elapsed: DEADWALL.elapsed, resources: { ...DEADWALL.resources }, carry: { ...DEADWALL.player.carry },
    gathered: DEADWALL.stats.gathered, deposited: DEADWALL.depositedResources, prologue: DEADWALL.chronicles131.snapshot().prologue,
    player: { x: DEADWALL.player.x, y: DEADWALL.player.y }, workerOrder: DEADWALL.workerOrder }));
}

async function chooseSite(page, type, plannedSite = null) {
  return page.evaluate(({ type, plannedSite }) => {
    const game = DEADWALL, core = game.core(), def = DeadwallCore.BUILDINGS[type], safe = game.hud135.measure(), candidates = [];
    const origin = { gx: Math.floor(game.player.x / 32), gy: Math.floor(game.player.y / 32) };
    for (let gy = origin.gy - 12; gy <= origin.gy + 12; gy++) for (let gx = origin.gx - 12; gx <= origin.gx + 12; gx++) {
      if (plannedSite && (gx !== plannedSite.gx || gy !== plannedSite.gy)) continue;
      if (!game.world.placement(def, gx, gy, 0).valid) continue;
      const left = gx * 32, top = gy * 32, right = (gx + def.size[0]) * 32, bottom = (gy + def.size[1]) * 32;
      if ([game.player, ...game.units].some(actor => actor.x + actor.radius + 5 > left && actor.x - actor.radius - 5 < right && actor.y + actor.radius + 5 > top && actor.y - actor.radius - 5 < bottom)) continue;
      const x = (gx + .5) * 32, y = (gy + .5) * 32;
      const screen = { x: (x - game.camera.x) * game.camera.zoom + game.width / 2, y: (y - game.camera.y) * game.camera.zoom + game.height / 2 };
      if (screen.x < safe.left + 10 || screen.x > safe.right - 10 || screen.y < safe.top + 10 || screen.y > safe.bottom - 10) continue;
      if (document.elementFromPoint(screen.x, screen.y)?.id !== 'game') continue;
      candidates.push({ gx, gy, screen, cost: def.cost, distance: Math.hypot((left + right) / 2 - game.player.x, (top + bottom) / 2 - game.player.y) });
    }
    candidates.sort((a, b) => a.distance - b.distance || a.gy - b.gy || a.gx - b.gx);
    if (!candidates.length) throw Error('No valid visible unoccupied placement for ' + type);
    return candidates[0];
  }, { type, plannedSite });
}


async function workManually(page, context, touch, id) {
  const route = await navigate(page, context, touch, { kind: 'building', id, range: 78 });
  const observeWorkPoint = () => page.evaluate(id => {
    const g = DEADWALL, p = g.player, b = g.world.buildings.get(id);
    const closest = { x: Math.max(b.left, Math.min(b.right, p.x)), y: Math.max(b.top, Math.min(b.bottom, p.y)) };
    const clearance = Math.hypot(p.x - closest.x, p.y - closest.y);
    return { x: p.x, y: p.y, radius: p.radius, clearance, bodyOutside: clearance >= p.radius + 4, canWork: g.workerCanWorkAt(p, b, 78), held: [...g.input.keys] };
  }, id);
  route.afterRelease = await observeWorkPoint(); route.physicalCorrections = [];
  for (let attempt = 0; attempt < 3 && (!route.afterRelease.bodyOutside || !route.afterRelease.canWork); attempt++) {
    route.physicalCorrections.push(await navigate(page, context, touch, { kind: 'building', id, range: 78 }));
    route.afterRelease = await observeWorkPoint();
  }
  assert.ok(route.afterRelease.bodyOutside && route.afterRelease.canWork && route.afterRelease.held.length === 0,
    'Actual released player body must remain outside the footprint and within physical work range: ' + JSON.stringify(route.afterRelease));
  route.workStarted = await page.evaluate(id => ({ elapsed: DEADWALL.elapsed, progress: DEADWALL.world.buildings.get(id).progress }), id);
  await withHold(page, context, touch, 'e', '#touchAction', () => page.waitForFunction(id => DEADWALL.world.buildings.get(id)?.completed, id, { timeout: 45000 }));
  await page.waitForFunction(() => !DEADWALL.input.keys.has('KeyE'));
  route.workCompleted = await page.evaluate(id => ({ elapsed: DEADWALL.elapsed, progress: DEADWALL.world.buildings.get(id).progress }), id);
  route.ordinarySimulationWorkSeconds = route.workCompleted.elapsed - route.workStarted.elapsed;
  return route;
}


async function placeHouse(page, touch) {
  if (await page.evaluate(() => DEADWALL.buildCollapsed)) await activate(page, '#toggleBuild', touch);
  await activate(page, '#buildCategories [data-category="colony"]', touch);
  await activate(page, '#buildList [data-build-id="house"]', touch);
  await page.waitForFunction(() => DEADWALL.selectedBuild === 'house');
  const site=await chooseSite(page,'house');
  await page.evaluate(() => {
    const g=DEADWALL,original=g.placeOne;globalThis.__BALANCE151_PAYMENT__=null;
    g.placeOne=function(...args){const before={...g.resources},result=original.apply(this,args);if(args[0]==='house'){globalThis.__BALANCE151_PAYMENT__={before,after:{...g.resources},result};g.placeOne=original;}return result;};
  });
  if(touch)await page.touchscreen.tap(site.screen.x,site.screen.y);else await page.mouse.click(site.screen.x,site.screen.y);
  await page.waitForFunction(site=>[...DEADWALL.world.buildings.values()].some(b=>b.type==='house'&&b.gx===site.gx&&b.gy===site.gy),site);
  const result=await page.evaluate(site=>{const b=[...DEADWALL.world.buildings.values()].find(b=>b.type==='house'&&b.gx===site.gx&&b.gy===site.gy);return{id:b.id,gx:b.gx,gy:b.gy,completed:b.completed,progress:b.progress,payment:globalThis.__BALANCE151_PAYMENT__};},site);
  assert.equal(result.payment?.result,true,'Native canvas placement succeeds');
  for(const[key,cost]of Object.entries(site.cost))assert.ok(Math.abs(result.payment.before[key]-result.payment.after[key]-cost)<1e-6,'House pays exact '+key+' cost');
  assert.equal(result.completed,false,'House starts as an unfinished physical worksite');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!DEADWALL.selectedBuild);
  if(!await page.evaluate(()=>DEADWALL.buildCollapsed))await activate(page,'#toggleBuild',touch);
  return{...result,cost:site.cost,input:'Real build catalogue and canvas pointer; Escape cancels selection'};
}

async function growthReadout(page,touch,rec,label,expectedAge){
  if(!await page.locator('#commandModal').isVisible())await openCommand(page,touch,'field');
  else await activate(page,'#commandTab-field',touch);
  const before=await page.evaluate(()=>{const{timestamp,...raw}=DEADWALL.serialize();return JSON.stringify(raw);});
  await activate(page,'#coordinationTab',touch);
  await page.locator('#urbanAgeRequirements').waitFor({state:'visible'});
  const model=await page.evaluate(()=>DEADWALL.urban.planning());
  assert.equal(model.age.id,expectedAge,'Planning shows the acquired age');
  assert.ok(model.nextRequirements?.criteria?.length,'The next age exposes measured requirements');
  const rows=[];
  for(const criterion of model.nextRequirements.criteria){
    const selector='#urbanAgeRequirements [data-requirement="'+criterion.id+'"]';
    await page.locator(selector).scrollIntoViewIfNeeded();
    const geometry=await visibleInPanel(page,selector,'.command-body');
    const row=await page.locator(selector).evaluate(n=>({id:n.dataset.requirement,met:n.dataset.met,text:n.textContent}));
    assert.ok(geometry.pass,'Requirement remains readable in its scrolling panel: '+criterion.id);
    assert.ok(row.text.includes(criterion.label),'Requirement uses its real model label');
    assert.equal(row.met,String(criterion.met),'Rendered requirement state agrees with its owner');
    rows.push({...row,geometry});
  }
  const after=await page.evaluate(()=>{const{timestamp,...raw}=DEADWALL.serialize();return JSON.stringify(raw);});
  assert.equal(after,before,'Native requirement navigation changes no saved state');
  await page.locator('#urbanRemaining').scrollIntoViewIfNeeded();
  const headerGeometry=await visibleInPanel(page,'#urbanRemaining','.command-body');
  assert.ok(headerGeometry.pass,'Growth summary fits the current viewport panel');
  await rec.screenshot(label);
  return{model,rows,headerGeometry,header:await page.locator('#urbanRemaining').textContent(),allSavedFieldsUnchanged:true};
}

async function readonlyProbe(page){
  return page.evaluate(()=>{
    const g=DEADWALL;
    const snap=()=>{const{timestamp,...raw}=g.serialize();return{raw,serialized:JSON.stringify(raw),rng:g.random.state,resources:{...g.resources},seen:g.frontier.discoveries(),fog:raw.frontier,progression:raw.urban.progression151};};
    const before=snap();
    g.updateUI();g.urbanUI.refresh(true);g.urban.planning();g.render();g.renderMinimap();
    const after=snap();
    return{pass:before.serialized===after.serialized,rngUnchanged:before.rng===after.rng,resourcesUnchanged:JSON.stringify(before.resources)===JSON.stringify(after.resources),fogUnchanged:JSON.stringify(before.fog)===JSON.stringify(after.fog),discoveriesUnchanged:JSON.stringify(before.seen)===JSON.stringify(after.seen),progressionUnchanged:JSON.stringify(before.progression)===JSON.stringify(after.progression),beforeRNG:before.rng,afterRNG:after.rng};
  });
}

async function futureProbe(page,score){
  return page.evaluate(score=>{
    const g=DEADWALL,before={age:g.tier.id,progression:g.urban.snapshot().progression151,resources:{...g.resources},rng:g.random.state,score:g.cityScore},returned=g.urban.attain(score);
    g.refreshMetrics(true);const after={age:g.tier.id,progression:g.urban.snapshot().progression151,resources:{...g.resources},rng:g.random.state,score:g.cityScore};
    return{scope:'Direct public owner refusal probe, not human progression',requestedScore:score,returnedAge:returned.id,before,after,planning:g.urban.planning(),ageUnchanged:before.age===after.age,resourcesUnchanged:JSON.stringify(before.resources)===JSON.stringify(after.resources),rngUnchanged:before.rng===after.rng,actualScoreUnchanged:before.score===after.score};
  },score);
}

async function saveContinue(page,touch,output,name){
  if(await page.locator('#commandModal').isVisible())await activate(page,'#commandReturn129',touch);
  if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',touch);
  await activate(page,'#saveButton',touch);
  const expected=await page.evaluate(()=>({ok:DEADWALL.lastSaveStatus.ok,text:localStorage.getItem(DeadwallCore.SAVE_KEY)}));
  assert.ok(expected.ok,'The real Save button succeeds');
  const saved=JSON.parse(expected.text);assert.deepEqual(saved.urban.progression151,{version:1,age:1},'The actual persisted acquired-age record is present');
  await writeFile(path.join(output,name+'-native-save-raw.json'),expected.text+'\n');
  await activate(page,'#quitButton',touch);await page.reload({waitUntil:'networkidle'});await ready(page);
  await page.evaluate(()=>{
    const g=DEADWALL,restore=g.restoreSave;globalThis.__BALANCE151_RESTORED__=null;
    g.restoreSave=function(...args){const result=restore.apply(this,args);globalThis.__BALANCE151_RESTORED__=g.serialize();g.togglePause(true);return result;};
  });
  await activate(page,'#continueButton',touch);await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.paused);
  const restored=await page.evaluate(()=>globalThis.__BALANCE151_RESTORED__);
  assert.deepEqual(restored.urban,saved.urban,'Continue preserves the raw urban record before any resumed RAF');
  assert.deepEqual(restored.resources,saved.resources,'Continue preserves depot stocks');
  assert.deepEqual(restored.frontier.seen,saved.frontier.seen,'Continue preserves explored sites');
  assert.equal(restored.randomState,saved.randomState,'Continue preserves simulation RNG');
  assert.equal(restored.runId,saved.runId,'Continue preserves campaign identity');
  return{pass:true,source:'Raw JSON.parse of real saved text and raw serialize at installed restore return; no Save.validate/value normalization',savedUrban:saved.urban,restoredUrban:restored.urban,expectedRNG:saved.randomState,restoredRNG:restored.randomState,normalizedFields:[],rawFile:name+'-native-save-raw.json'};
}

async function importLegacy(page,touch,output,name,rec){
  if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',touch);
  await activate(page,'#pauseSettingsButton',touch);await page.locator('#settingsModal').waitFor({state:'visible'});
  const fixture=await page.evaluate(()=>{
    const data=DEADWALL.serialize();delete data.urban.progression151;data.urban.peakScore=DeadwallCore.CITY_TIERS[8].requiredScore;
    return{scope:'Explicit historical-import fixture: remove only the 1.51 marker and assign the historical age-8 peak. No claim of human progression.',data,expectedAge:8};
  });
  const payload=JSON.stringify(fixture.data);await writeFile(path.join(output,name+'-legacy-age8-import.json'),payload+'\n');
  const before=await page.evaluate(()=>({age:DEADWALL.tier.id,urban:DEADWALL.urban.snapshot(),resources:{...DEADWALL.resources},rng:DEADWALL.random.state}));
  await page.locator('#settingsImportFile').setInputFiles({name:'declared-legacy-age8.json',mimeType:'application/json',buffer:Buffer.from(payload)});
  await page.locator('#settingsImportReview').waitFor({state:'visible'});
  const reviewed=await page.evaluate(()=>({age:DEADWALL.tier.id,urban:DEADWALL.urban.snapshot(),resources:{...DEADWALL.resources},rng:DEADWALL.random.state}));
  assert.deepEqual(reviewed,before,'Selecting a legacy file does not replace or debit the current campaign before confirmation');
  await activate(page,'#settingsImportConfirm',touch);
  await page.waitForFunction(()=>DEADWALL.tier.id===8&&DEADWALL.urban.snapshot().progression151.age===8);
  const imported=await page.evaluate(()=>({age:DEADWALL.tier.id,raw:globalThis.__BALANCE151_RESTORED__,urban:DEADWALL.urban.snapshot(),resources:{...DEADWALL.resources},rng:DEADWALL.random.state,seen:DEADWALL.frontier.discoveries()}));
  assert.deepEqual(imported.urban.progression151,{version:1,age:8},'A marker-free historical age survives the explicit native import');
  assert.deepEqual(imported.resources,fixture.data.resources,'Legacy migration grants no material');
  assert.equal(imported.rng,fixture.data.randomState,'Legacy import consumes no simulation RNG');
  assert.deepEqual(imported.seen,fixture.data.frontier.seen,'Legacy import reveals no new sites');
  await activate(page,'#pauseSettingsButton',touch);
  await page.locator('#settingsModal').waitFor({state:'visible'});
  await rec.screenshot('legacy-imported-settings');
  await activate(page,'#settingsClose',touch);
  return{scope:fixture.scope,pass:true,reviewUnchanged:true,rawFile:name+'-legacy-age8-import.json',importedAge:imported.age,urban:imported.urban,rawUrban:imported.raw?.urban,resourcesPreserved:true,rngPreserved:true,discoveriesPreserved:true};
}

const views=[{name:'desktop',width:1366,height:768},{name:'mobile',width:390,height:844,touch:true}];
const selected=process.env.DEADWALL_QA_PROFILES?.split(','),profiles=selected?views.filter(v=>selected.includes(v.name)):views;
const scope='NATIVE: Standard seed17117 menu, genuine keyboard/touch movement, finite harvest and personal deposit, real paid house placement and held manual construction to Camp before the first horde. Actual Preparatifs requirement rows are checked against their measured owner. Public attain calls are declared refusal probes. Raw Save/menu/reload/Continue preserves urban.progression151 before any resumed RAF. EXPLICIT LEGACY FIXTURE: a native confirmation imports a marker-free historical age-8 peak; current stocks, RNG and discoveries are preserved, and future age remains gated. These checks do not measure a human 6–10 hour campaign, certify balance endurance, or certify physical hardware.';
const harness=await createHarness('balance151',scope),{browser,base,report,output}=harness;
report.profiles=[];report.normalizedFields=[];
try{
  assert.ok(profiles.length,'At least one known balance QA profile is required');
  for(const viewport of profiles){
    const profile={viewport,nativeChecks:[],advancedChecks:[],controllerProbes:[],fixtures:[],checkpoints:[]};report.profiles.push(profile);
    let context,page,rec;
    try{
      context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'});
      page=await context.newPage();page.setDefaultTimeout(30000);rec=recorder(page,profile,output,viewport.name+'-');
      const check=(name,pass,scope='native')=>{profile[scope==='native'?'nativeChecks':'advancedChecks'].push({name,pass:!!pass,scope});rec.check(name,pass);};
      await page.goto(base,{waitUntil:'networkidle'});await ready(page);profile.art=await loadedAssets(page,harness.assetKeys);
      await rec.screenshot('menu');await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);
      await page.waitForFunction(()=>DEADWALL.state==='playing'&&!DEADWALL.paused&&!DEADWALL.activeOverlay);
      profile.start=await readEconomy(page);
      check('Native Standard campaign starts at Refuge with the 1.51 acquired-age marker',await page.evaluate(()=>DEADWALL.difficulty.id==='standard'&&DEADWALL.world.seed===17117&&DEADWALL.tier.id===0&&DEADWALL.urban.snapshot().progression151?.age===0));
      profile.refugeRequirements=await growthReadout(page,viewport.touch,rec,'native-refuge-requirements',0);
      check('Refuge exposes actual missing next-age conditions',profile.refugeRequirements.model.nextRequirements.missing.length>0);
      await activate(page,'#commandTab-workers',viewport.touch);await activate(page,'[data-worker-order="retreat"]',viewport.touch);await resumeCommand(page,viewport.touch);
      profile.harvestRoute=await navigate(page,context,viewport.touch,{kind:'node',type:'scrap',amount:24,range:62});
      const beforeHarvest=await readEconomy(page);
      const nodeBefore=await page.evaluate(id=>DEADWALL.world.nodes.find(n=>n.id===id)?.amount,profile.harvestRoute.target.id);
      await withHold(page,context,viewport.touch,'e','#touchAction',()=>page.waitForFunction(()=>DEADWALL.player.carry.scrap>=16,null,{timeout:15000}));
      const afterHarvest=await readEconomy(page),nodeAfter=await page.evaluate(id=>DEADWALL.world.nodes.find(n=>n.id===id)?.amount,profile.harvestRoute.target.id);
      profile.harvest={before:beforeHarvest,after:afterHarvest,nodeId:profile.harvestRoute.target.id,nodeBefore,nodeAfter};
      check('Held native input removes finite scrap into the actual bag',afterHarvest.carry.scrap>=16&&afterHarvest.gathered>beforeHarvest.gathered&&afterHarvest.resources.scrap===beforeHarvest.resources.scrap&&Math.abs(nodeBefore-nodeAfter-(afterHarvest.carry.scrap-beforeHarvest.carry.scrap))<1e-6);
      profile.depositRoute=await navigate(page,context,viewport.touch,{kind:'building',id:await page.evaluate(()=>DEADWALL.core().id),range:100});
      const beforeDeposit=await readEconomy(page);
      await withHold(page,context,viewport.touch,'e','#touchAction',()=>page.waitForFunction(()=>DEADWALL.player.carry.scrap<.01,null,{timeout:15000}));
      const afterDeposit=await readEconomy(page);profile.deposit={before:beforeDeposit,after:afterDeposit};
      check('Native personal deposit transfers exactly the accepted finite bag',Math.abs(afterDeposit.resources.scrap-beforeDeposit.resources.scrap-beforeDeposit.carry.scrap)<1e-6);
      profile.house=await placeHouse(page,viewport.touch);await rec.screenshot('native-paid-house');
      profile.house.workRoute=await workManually(page,context,viewport.touch,profile.house.id);
      await page.waitForFunction(()=>DEADWALL.tier.id===1);
      profile.nativeCompletion=await page.evaluate(()=>({elapsed:DEADWALL.elapsed,wave:DEADWALL.wave,phase:DEADWALL.phase,survived:DEADWALL.stats.wavesSurvived,age:DEADWALL.tier.id,score:DEADWALL.cityScore}));
      check('The actually paid and manually completed house reaches Camp before the first horde',profile.nativeCompletion.age===1&&profile.nativeCompletion.survived===0&&profile.nativeCompletion.wave===1&&profile.nativeCompletion.phase==='calm');
      profile.campRequirements=await growthReadout(page,viewport.touch,rec,'native-camp-requirements',1);
      profile.readonly=await readonlyProbe(page);check('UI, planning, render and minimap preserve every saved field, stocks, fog and RNG',Object.entries(profile.readonly).filter(([key])=>key==='pass'||key.endsWith('Unchanged')).every(([,value])=>value));
      const rejected=await futureProbe(page,1000);profile.controllerProbes.push(rejected);
      check('Bare attain(1000) grants no future age, construction score, stock or RNG',rejected.ageUnchanged&&rejected.actualScoreUnchanged&&rejected.resourcesUnchanged&&rejected.rngUnchanged&&rejected.after.progression.age===1&&rejected.planning.nextRequirements.missing.length>0,'controller refusal probe');
      profile.checkpoints.push(await saveContinue(page,viewport.touch,output,viewport.name));
      check('Raw native Save/Continue preserves urban.progression151 exactly',profile.checkpoints.at(-1).pass);
      const imported=await importLegacy(page,viewport.touch,output,viewport.name,rec);profile.fixtures.push(imported);
      const legacyRefusal=await futureProbe(page,100000);profile.controllerProbes.push(legacyRefusal);
      check('Historical age 8 stays acquired while unsupported future ages remain gated',imported.importedAge===8&&legacyRefusal.ageUnchanged&&legacyRefusal.after.progression.age===8&&legacyRefusal.planning.nextRequirements.missing.length>0&&legacyRefusal.resourcesUnchanged&&legacyRefusal.rngUnchanged,'explicit historical import fixture');
      profile.legacyRequirements=await growthReadout(page,viewport.touch,rec,'legacy-age8-requirements',8);
      check('The historical import leaves readable measured requirements for its next age',profile.legacyRequirements.model.nextRequirements.missing.length>0,'explicit historical import fixture');
      check('All browser error collectors remain empty',rec.errors()===0);
      profile.pass=true;console.log(JSON.stringify({profile:viewport.name,stage:'complete',checks:profile.checks.length,nativeSeconds:profile.nativeCompletion.elapsed-profile.start.elapsed,fixtures:profile.fixtures.length,errors:rec.errors()}));
    }catch(error){
      profile.pass=false;profile.failure=error.stack;profile.inputFailure=error.deadwallInput;profile.touchTargetFailure=error.deadwallTouchTarget;
      if(page){const diagnostic=await page.evaluate(()=>{const g=globalThis.DEADWALL;if(!g)return null;return{raw:g.serialize(),persistedText:localStorage.getItem(DeadwallCore.SAVE_KEY),state:g.state,paused:g.paused,overlay:g.activeOverlay?.id,age:g.tier.id,phase:g.phase,elapsed:g.elapsed,held:[...g.input.keys],player:{...g.player},camera:{...g.camera},selectedBuild:g.selectedBuild,requirements:g.urban.planning().nextRequirements,notifications:g.notifications.map(n=>n.text)};}).catch(()=>null);
        if(diagnostic){const file=viewport.name+'-failure-raw.json';await writeFile(path.join(output,file),JSON.stringify({capturedAt:new Date().toISOString(),source:'Actual raw serialize and exact persisted text; no value normalization',...diagnostic},null,2)+'\n');profile.failureDiagnostic=file;}
      }
      await rec?.screenshot('failure').catch(()=>{});console.error(JSON.stringify({profile:viewport.name,stage:'failed',failure:profile.failure}));
    }finally{await context?.close();}
  }
  report.pass=report.profiles.length===profiles.length&&report.profiles.every(p=>p.pass);
  if(!report.pass)process.exitCode=1;
}catch(error){report.pass=false;report.failure=error.stack;process.exitCode=1;}
finally{try{await harness.close();}finally{await harness.finish();}}
