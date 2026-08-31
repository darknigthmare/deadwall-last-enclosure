'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function verifyWindow({ app, window, serveGame, closeSafely, reportRoot, stage, gameURL }) {
  assert.ok(['create','restore'].includes(stage), 'Unknown desktop verification stage');
  fs.mkdirSync(reportRoot, { recursive:true });
  const network = { completed:[], failed:[] };
  // Observe completion/errors only; never replace the shell's onBeforeRequest blocker.
  window.webContents.session.webRequest.onCompleted(details => network.completed.push({url:details.url,status:details.statusCode}));
  window.webContents.session.webRequest.onErrorOccurred(details => network.failed.push({url:details.url,error:details.error}));
  const errors = [];
  let consoleObserverVerified = false;
  window.webContents.on('console-message', details => {
    if (details.message === 'DEADWALL_QA_CONSOLE_OBSERVER') consoleObserverVerified = true;
    if (details.level === 'error') errors.push(details.message);
  });
  const failedLoads = [];
  window.webContents.on('did-fail-load', (_event, code, message, url) => failedLoads.push({ code, message, url }));
  window.setContentSize(1280, 800);
  await window.loadURL(gameURL);
  await window.webContents.executeJavaScript(`new Promise((resolve,reject) => {
    let attempts=0; const check=() => { if(globalThis.DEADWALL) requestAnimationFrame(()=>resolve(true)); else if(attempts++>100) reject(new Error('Game did not initialize')); else setTimeout(check,50); }; check();
  })`);
  const isolation = await window.webContents.executeJavaScript(`({ require:typeof require, process:typeof process, bridge:Object.keys(window.deadwallDesktop).sort(), desktop:window.deadwallDesktop.isDesktop, origin:location.href })`);
  assert.equal(isolation.require, 'undefined');
  assert.equal(isolation.process, 'undefined');
  assert.equal(isolation.desktop, true);
  assert.deepEqual(isolation.bridge, ['isDesktop','platform','quit','toggleFullscreen']);
  assert.equal(isolation.origin, gameURL);
  await window.webContents.executeJavaScript("console.info('DEADWALL_QA_CONSOLE_OBSERVER')");
  assert.equal(consoleObserverVerified, true, 'Electron console observer must receive real messages');
  const preferences = window.webContents.getLastWebPreferences();
  assert.equal(preferences.contextIsolation, true);
  assert.equal(preferences.sandbox, true);
  assert.equal(preferences.nodeIntegration, false);
  assert.equal(preferences.webSecurity, true);
  const assets = await window.webContents.executeJavaScript(`(async () => {
    const game=globalThis.DEADWALL; await game.art.ready;
    return {...game.art.diagnostics,expectedKeys:Object.keys(globalThis.DeadwallArt.ASSETS).sort(),imageKeys:Object.keys(game.art.images).sort()};
  })()`);
  assert.ok(assets.expectedKeys.length > 0, 'The packaged renderer must declare its atlas catalogue');
  assert.deepEqual([...assets.ready].sort(), assets.expectedKeys, 'Every declared bitmap atlas must load exactly once');
  assert.deepEqual(assets.failed, [], 'No atlas may silently fall back to missing art');
  assert.deepEqual(assets.imageKeys, assets.expectedKeys, 'All declared atlases have decoded image data');
  const atlasDrawProbe = await window.webContents.executeJavaScript(`(() => {
    const art=globalThis.DEADWALL.art,canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
    const context=canvas.getContext('2d',{willReadFrequently:true}),draws={};
    for(const [key,spec] of Object.entries(globalThis.DeadwallArt.ASSETS)){
      const source=art.images[key],before=art.diagnostics.draws[key]||0;
      if((source.naturalWidth||source.width)!==spec.width || (source.naturalHeight||source.height)!==spec.height) throw new Error('Atlas dimensions mismatch: '+key);
      context.clearRect(0,0,64,64);
      if(!art.blit(context,key,[0,0,spec.width,spec.height],0,0,64,64)) throw new Error('Atlas draw failed: '+key);
      const pixels=context.getImageData(0,0,64,64).data;let visiblePixels=0;
      for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)visiblePixels++;
      draws[key]={calls:(art.diagnostics.draws[key]||0)-before,visiblePixels};
    }
    return {fixture:'Offscreen atlas draw/readback; not proof of gameplay use',draws};
  })()`);
  assert.deepEqual(Object.keys(atlasDrawProbe.draws).sort(), assets.expectedKeys);
  for (const [key,draw] of Object.entries(atlasDrawProbe.draws)) {
    assert.equal(draw.calls, 1, `${key}: the real atlas renderer must draw`);
    assert.ok(draw.visiblePixels > 0, `${key}: the draw must contain visible pixels`);
  }
  const localResources = await window.webContents.executeJavaScript(`({
    modules:{tactics:typeof globalThis.DeadwallTactics,profile:typeof globalThis.DeadwallProfile,command:typeof globalThis.DEADWALL.showCommand},
    urls:performance.getEntriesByType('resource').map(item=>item.name),
    scripts:[...document.scripts].map(script=>script.src).filter(Boolean),
    styles:[...document.styleSheets].map(sheet=>({href:sheet.href,rules:sheet.cssRules.length}))
  })`);
  assert.deepEqual(localResources.modules, {tactics:'object',profile:'object',command:'function'});
  for (const file of ['src/tactics.js','src/profile.js','src/command-ui.js']) assert.ok(localResources.scripts.includes(new URL(file, gameURL).href), `${file} must initialize from the local document`);
  assert.ok(localResources.styles.some(sheet=>sheet.href===new URL('command.css',gameURL).href && sheet.rules>0), 'Command stylesheet must have loaded rules');
  assert.ok(localResources.urls.every(url => url.startsWith('deadwall://game/') || url.startsWith('data:') || url.startsWith('blob:deadwall://game/')), 'Initial game resources have no external origins');
  await fs.promises.writeFile(path.join(reportRoot, `${stage}-menu.png`), (await window.webContents.capturePage()).toPNG());

  let menuRecords = null;
  if (stage === 'restore') {
    const expected = JSON.parse(await fs.promises.readFile(path.join(reportRoot, 'expected-save.json'), 'utf8'));
    menuRecords = await window.webContents.executeJavaScript(`(() => {
      const game=globalThis.DEADWALL,get=id=>document.getElementById(id),original=game.world;
      get('menuRecordsButton').click();
      if(get('commandModal').classList.contains('hidden') || game.activeOverlay!==get('commandModal')) throw new Error('Menu records did not open');
      if(get('commandTab-records').getAttribute('aria-selected')!=='true' || !get('commandTab-workers').disabled) throw new Error('Menu archives expose invalid tactical controls');
      const profile=game.profile.get(),run=profile.recentRuns.find(item=>item.runId===${JSON.stringify(expected.runId)});
      if(!run || run.seed!==17117 || profile.summary.retainedRuns!==1) throw new Error('Campaign records did not survive process restart');
      if(get('recordBoard').children.length!==3 || get('recentCampaigns').querySelectorAll('.campaign-row').length!==1) throw new Error('Saved record cards are missing');
      get('recentCampaigns').querySelector('button').click();
      if(get('mapSeed').value!=='17117' || game.world!==original || game.state!=='menu' || !get('commandModal').classList.contains('hidden')) throw new Error('Reusing a seed mutated the campaign');
      return {restored:true,runIds:profile.recentRuns.map(item=>item.runId),retainedRuns:profile.summary.retainedRuns,difficultyCards:3,reuseWithoutMutation:true};
    })()`, true);
  }

  const settings = await window.webContents.executeJavaScript(`(() => {
    const game=globalThis.DEADWALL,get=id=>document.getElementById(id);
    if (${JSON.stringify(stage)} === 'restore' && (game.settings.volume !== .25 || !game.settings.reducedMotion)) throw new Error('Options did not survive restart');
    get('menuSettingsButton').click();
    if(get('settingsModal').classList.contains('hidden') || get('settingsQuit').classList.contains('hidden')) throw new Error('Desktop options/quit control missing');
    get('settingsVolume').value='25';get('settingsVolume').dispatchEvent(new Event('input',{bubbles:true}));
    get('settingsMotion').checked=true;get('settingsMotion').dispatchEvent(new Event('change',{bubbles:true}));
    get('settingsMuted').checked=true;get('settingsMuted').dispatchEvent(new Event('change',{bubbles:true}));
    get('settingsClose').click();
    return {volume:game.settings.volume,reducedMotion:game.settings.reducedMotion,muted:game.settings.muted};
  })()`, true);
  assert.deepEqual(settings, {volume:.25,reducedMotion:true,muted:true});

  let save;
  if (stage === 'create') {
    save = await window.webContents.executeJavaScript(`(() => {
      const game=globalThis.DEADWALL,get=id=>document.getElementById(id);
      document.querySelector('input[name="difficulty"][value="story"]').checked=true;
      get('mapSeed').value='17117';get('mapSeed').dispatchEvent(new Event('input',{bubbles:true}));
      get('newGameButton').click();game.togglePause(true);
      if(game.world.seed!==17117 || game.difficulty.id!=='story') throw new Error('Menu seed/difficulty controls were not applied');
      game.resources.wood=137; game.player.x+=32;
      return {seed:game.world.seed, wood:game.resources.wood, x:game.player.x,runId:game.runId,workerOrder:game.workerOrder};
    })()`, true);
    await fs.promises.writeFile(path.join(reportRoot, 'expected-save.json'), JSON.stringify(save));
  } else {
    const expected = JSON.parse(await fs.promises.readFile(path.join(reportRoot, 'expected-save.json'), 'utf8'));
    save = await window.webContents.executeJavaScript(`(() => {
      const game=globalThis.DEADWALL; document.getElementById('continueButton').click(); game.togglePause(true);
      return {seed:game.world.seed, wood:game.resources.wood, x:game.player.x,runId:game.runId,workerOrder:game.workerOrder};
    })()`, true);
    assert.deepEqual(save, expected, 'Save must survive closing and reopening the executable');
  }
  const commandPost = await window.webContents.executeJavaScript(`(async () => {
    const game=globalThis.DEADWALL,get=id=>document.getElementById(id),elapsed=game.elapsed;
    get('pauseCommandButton').click();
    if(get('commandModal').classList.contains('hidden') || !game.paused || game.activeOverlay!==get('commandModal')) throw new Error('Paused command post did not open');
    await new Promise(resolve=>setTimeout(resolve,160));
    if(game.elapsed!==elapsed) throw new Error('Simulation advanced behind command post');
    get('commandTab-workers').click();
    const order=document.querySelector('[data-worker-order="retreat"]');order.click();
    if(game.workerOrder!=='retreat' || order.getAttribute('aria-pressed')!=='true') throw new Error('Worker command button did not apply');
    get('commandTab-research').click();
    const doctrines=[...get('researchLibrary').querySelectorAll('[data-research-id]')].map(card=>({id:card.dataset.researchId,state:card.dataset.state,disabled:card.querySelector('button').disabled,title:card.querySelector('h3').textContent}));
    if(doctrines.length!==6 || new Set(doctrines.map(item=>item.id)).size!==6 || doctrines.some(item=>!item.title || !['locked','unfunded','available','complete'].includes(item.state))) throw new Error('Doctrine library is incomplete');
    if(doctrines.some(item=>['locked','unfunded','complete'].includes(item.state)&&!item.disabled)) throw new Error('Unavailable doctrine became actionable');
    return {openedFromPause:true,simulationSuspended:true,workerOrder:game.workerOrder,doctrines};
  })()`, true);
  await fs.promises.writeFile(path.join(reportRoot, `${stage}-command-doctrines.png`), (await window.webContents.capturePage()).toPNG());
  const commandClosure = await window.webContents.executeJavaScript(`(() => {
    const game=globalThis.DEADWALL,get=id=>document.getElementById(id);
    get('commandTab-records').click();
    if(get('recordBoard').children.length!==3 || get('recentCampaigns').querySelectorAll('.campaign-row').length!==1) throw new Error('In-game local records are missing');
    get('commandClose').click();if(!game.paused || !get('commandModal').classList.contains('hidden')) throw new Error('Command closure lost the original pause');
    game.togglePause(false);get('cityCommandButton').click();
    if(!game.paused || get('commandModal').classList.contains('hidden')) throw new Error('Command post failed to pause active gameplay');
    get('commandClose').click();if(game.paused) throw new Error('Command closure failed to resume active gameplay');
    game.togglePause(true);
    return {pausePreserved:true,openedFromGameplay:true,resumedGameplay:true,localRecords:true};
  })()`, true);
  Object.assign(commandPost, commandClosure);
  save.workerOrder = commandPost.workerOrder;
  const painted = await window.webContents.executeJavaScript(`(() => {
    const game=globalThis.DEADWALL; game.render();
    const pixels=game.ctx.getImageData(0,0,game.canvas.width,game.canvas.height).data;
    let opaque=0; for(let i=3;i<pixels.length;i+=400) if(pixels[i]) opaque++;
    return {state:game.state, paused:game.paused, opaque};
  })()`);
  assert.equal(painted.state, 'playing');
  assert.equal(painted.paused, true);
  assert.ok(painted.opaque > 100, 'The game canvas must really render');
  await fs.promises.writeFile(path.join(reportRoot, `${stage}-game.png`), (await window.webContents.capturePage()).toPNG());

  const exported = new Promise((resolve,reject) => {
    const timeout = setTimeout(() => reject(new Error('Local JSON save export timed out')), 5000);
    window.webContents.session.once('will-download', (_event,item) => item.once('done', (_downloadEvent,state) => { clearTimeout(timeout); state === 'completed' ? resolve(item.getSavePath()) : reject(new Error(`Save export ${state}`)); }));
  });
  await window.webContents.executeJavaScript("document.getElementById('pauseSettingsButton').click(); document.getElementById('settingsExport').click();", true);
  const exportPath = await exported;
  const exportedSave = JSON.parse(await fs.promises.readFile(exportPath, 'utf8'));
  assert.equal(exportedSave.worldSeed, save.seed);
  assert.equal(exportedSave.resources.wood, save.wood);
  assert.equal(exportedSave.runId, save.runId);
  assert.equal(exportedSave.workerOrder, 'retreat', 'Tactical order belongs to the exported campaign');

  const imports = await window.webContents.executeJavaScript(`(async () => {
    const game=globalThis.DEADWALL,get=id=>document.getElementById(id),input=get('settingsImportFile');
    const source=${JSON.stringify(JSON.stringify(exportedSave))};
    const original=game.world,stored=localStorage.getItem(globalThis.DeadwallCore.SAVE_KEY);
    async function choose(text){const files=new DataTransfer();files.items.add(new File([text],'DEADWALL-qa.json',{type:'application/json'}));input.files=files.files;input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,80));}
    await choose(source);
    if(get('settingsImportReview').classList.contains('hidden') || game.world!==original || localStorage.getItem(globalThis.DeadwallCore.SAVE_KEY)!==stored) throw new Error('Import preview mutated the game');
    get('settingsImportCancel').click();
    if(!get('settingsImportReview').classList.contains('hidden') || game.world!==original) throw new Error('Import cancellation changed the game');
    await choose('{invalid');
    if(!get('settingsStatus').textContent.includes('Import refusé') || game.world!==original) throw new Error('Corrupt import was not rejected safely');
    await choose(source);get('settingsImportConfirm').click();
    if(game.world===original || game.world.seed!==${save.seed} || game.resources.wood!==${save.wood} || game.workerOrder!=='retreat' || game.runId!==${JSON.stringify(save.runId)}) throw new Error('Confirmed import failed');
    game.togglePause(true);
    return {preview:true,cancel:true,corruptRejected:true,confirmed:true};
  })()`, true);
  assert.deepEqual(imports, {preview:true,cancel:true,corruptRejected:true,confirmed:true});

  window.webContents.sendInputEvent({ type:'keyDown', keyCode:'F11' });
  window.webContents.sendInputEvent({ type:'keyUp', keyCode:'F11' });
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(window.isFullScreen(), true, 'F11 enters fullscreen');
  await window.webContents.executeJavaScript('window.deadwallDesktop.toggleFullscreen()');
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(window.isFullScreen(), false, 'Safe desktop bridge returns to windowed mode');
  for (const expected of [true,false]) {
    window.webContents.sendInputEvent({ type:'keyDown', keyCode:'Enter', modifiers:['alt'] });
    window.webContents.sendInputEvent({ type:'keyUp', keyCode:'Enter', modifiers:['alt'] });
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(window.isFullScreen(), expected, 'Alt+Enter toggles fullscreen');
  }

  const routes = {};
  const publicPaths = ['/index.html','/styles.css','/command.css','/src/core.js','/src/tactics.js','/src/profile.js','/src/command-ui.js','/assets/icon-512.png'];
  for (const pathname of [...publicPaths,'/package.json','/.env','/.git/config','/desktop/main.cjs','/../package.json','/%2e%2e/package.json','/assets/missing.png']) {
    const response = await serveGame({ url:`deadwall://game${pathname}`, method:'GET' });
    routes[pathname] = response.status;
    assert.equal(response.status, publicPaths.includes(pathname) ? 200 : 404);
  }
  assert.equal((await serveGame({ url:gameURL, method:'POST' })).status, 405);
  let externalBlocked = false;
  try { await window.webContents.session.fetch('https://example.com/'); } catch { externalBlocked = true; }
  assert.equal(externalBlocked, true, 'External network access must be blocked');
  const popup = await window.webContents.executeJavaScript("window.open('https://example.com/') === null");
  assert.equal(popup, true, 'External windows must be blocked');
  await window.webContents.executeJavaScript("location.href='https://example.com/'");
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(window.webContents.getURL(), gameURL, 'External navigation must be blocked');
  assert.deepEqual(network.completed.filter(item=>/^(?:https?|wss?|ftp|file):/i.test(item.url)), [], 'No external network request completed');
  assert.ok(network.failed.some(item=>item.url==='https://example.com/'), 'Native network observer saw the intentionally blocked request');
  assert.deepEqual(errors, [], 'No renderer console errors');
  assert.deepEqual(failedLoads, [], 'No failed document loads');
  if (stage === 'create') {
    save = await window.webContents.executeJavaScript(`(() => {
      const game=globalThis.DEADWALL; game.resources.wood=138;
      return {seed:game.world.seed,wood:game.resources.wood,x:game.player.x,runId:game.runId,workerOrder:game.workerOrder};
    })()`);
    await fs.promises.writeFile(path.join(reportRoot, 'expected-save.json'), JSON.stringify(save));
  }
  const report = { ok:true, stage, packaged:app.isPackaged, versions:process.versions, isolation, preferences:{ sandbox:preferences.sandbox, contextIsolation:preferences.contextIsolation, nodeIntegration:preferences.nodeIntegration, webSecurity:preferences.webSecurity }, assets, atlasDrawProbe, localResources, network, menuRecords, commandPost, settings, imports, save, exportPath, painted, routes, fullscreen:true, externalBlocked, popupBlocked:popup, navigationBlocked:true, consoleObserverVerified, consoleErrors:errors, failedLoads };
  await fs.promises.writeFile(path.join(reportRoot, `${stage}-report.json`), JSON.stringify(report, null, 2));
  console.log(`DEADWALL desktop ${stage} verification passed`);
  // The first stage deliberately leaves its latest changes unsaved: this verifies normal close.
  await closeSafely();
}

module.exports = { verifyWindow };
