'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');

test('smoke test du jeu complet: démarrage, simulation, horde, rendu et sauvegarde', () => {
  const { storage, elements, game } = bootGame();
  assert.ok(game, 'le constructeur doit exposer DEADWALL');
  game.startNew('standard');
  assert.equal(game.state, 'playing');
  assert.equal(game.world.buildings.size, 1);
  assert.equal(game.units.length, 3);
  assert.ok(game.world.nodes.length >= 350);

  const touchAction = elements.get('touchAction');
  touchAction.dispatch('pointerdown');
  assert.equal(game.input.keys.has('KeyE'), true, 'ACTION tactile doit maintenir E');
  touchAction.dispatch('pointerup');
  assert.equal(game.input.keys.has('KeyE'), false);

  for (let i = 0; i < 20; i += 1) game.update(0.05);
  assert.ok(Number.isFinite(game.player.x));
  assert.ok(Number.isFinite(game.camera.x));

  game.phase = 'warning'; game.phaseTime = 0;
  game.updateDirector(0.1);
  assert.equal(game.phase, 'assault');
  assert.ok(game.spawnQueue.length > 0);
  game.updateDirector(1);
  assert.ok(game.zombies.length > 0, 'la vague doit produire des infectés');
  const activeZombie = game.zombies[0]; activeZombie.attackCooldown = 0.61;

  assert.doesNotThrow(() => game.render());
  assert.doesNotThrow(() => game.renderMinimap());
  game.research.insight = 5;
  game.launchResearch();
  assert.ok(game.research.completed.includes('logistics'));

  const commandCore = game.core();
  game.selectBuilding(commandCore); game.cyclePriority();
  assert.equal(commandCore.priority, 3, 'la priorité de structure doit être pilotable');

  const depositedBefore = game.depositedResources;
  game.player.x = commandCore.x; game.player.y = commandCore.y; game.player.carry.wood = 5; game.input.keys.add('KeyE');
  game.updateInteraction(0.1); game.input.keys.delete('KeyE');
  assert.equal(game.depositedResources, depositedBefore + 5, 'le dépôt manuel doit créditer le tutoriel');

  game.research.completed.push('fortification');
  const wall = { dead: false, def: { wall: true }, health: 200, underAttack: 0 };
  game.damageBuilding(wall, 100);
  assert.equal(wall.health, 112, 'la doctrine de fortification doit réduire les dégâts de 12 %');

  const originalBuildings = game.world.buildings;
  const oversizedDefense = { dead:false, completed:true, priority:3, def:{ powerUse:6, defense:true } };
  const smallClinic = { dead:false, completed:true, priority:2, def:{ id:'clinic', powerUse:3 } };
  game.world.buildings = new Map([[1, oversizedDefense], [2, smallClinic]]); game.allocatePower(3); game.world.buildings = originalBuildings;
  assert.equal(oversizedDefense.powered, false); assert.equal(smallClinic.powered, true, 'le délestage ne doit pas gaspiller un reliquat utilisable');
  game.save(false);
  assert.ok(storage.has(globalThis.DeadwallCore.SAVE_KEY));

  const previousWave = game.wave;
  game.wave = 99;
  game.load();
  assert.equal(game.wave, previousWave, 'la sauvegarde doit restaurer la vague');
  assert.equal(game.world.buildings.size, 1);
  const restoredZombie = game.zombies.find(z => z.id === activeZombie.id);
  assert.ok(restoredZombie); assert.equal(restoredZombie.attackCooldown, 0.61, 'le cooldown zombie doit survivre au chargement');

  const goodSave = storage.get(globalThis.DeadwallCore.SAVE_KEY);
  storage.set(globalThis.DeadwallCore.SAVE_BACKUP_KEY, goodSave); storage.set(globalThis.DeadwallCore.SAVE_KEY, '{corrompu');
  game.wave = 99; const originalWarn = console.warn; let fallbackWarned = false; console.warn = () => { fallbackWarned = true; };
  try { game.load(); } finally { console.warn = originalWarn; }
  assert.equal(fallbackWarned, true, 'la sauvegarde corrompue doit être diagnostiquée');
  assert.equal(game.wave, previousWave, 'une sauvegarde primaire corrompue doit retomber sur le backup');

  storage.set(globalThis.DeadwallCore.SAVE_KEY, goodSave);
  storage.set(globalThis.DeadwallCore.SAVE_BACKUP_KEY, goodSave);
  storage.set(globalThis.DeadwallCore.LEGACY_SAVE_KEYS[0], goodSave);
  game.triggerGameOver();
  assert.equal(storage.has(globalThis.DeadwallCore.SAVE_KEY), false);
  assert.equal(storage.has(globalThis.DeadwallCore.SAVE_BACKUP_KEY), false);
  assert.equal(storage.has(globalThis.DeadwallCore.LEGACY_SAVE_KEYS[0]), false, 'une partie perdue ne doit pas être ressuscitable');
});

test('interface compacte: resize, tablette tactile et catalogue retiré du focus', () => {
  const { game, compactMedia, elements } = bootGame(); game.startNew();
  globalThis.innerWidth = 390; compactMedia.setMatches(true);
  assert.equal(game.buildCollapsed, true, 'le passage mobile replie le catalogue');
  game.setBuildCollapsed(false);
  assert.equal(game.ui.rightPanel.classList.contains('hidden'), true);
  globalThis.innerWidth = 1280; compactMedia.setMatches(false);
  assert.equal(game.ui.rightPanel.classList.contains('hidden'), false, 'le panneau stratégique revient sur desktop');
  compactMedia.setMatches(true);
  assert.equal(game.buildCollapsed, true, 'une tablette tactile large utilise aussi le mode compact');
  game.setBuildCollapsed(false); game.selectBuild('house');
  assert.equal(game.buildCollapsed, true, 'choisir un chantier libère la vue sur tablette');
  game.setBuildCollapsed(false); game.ui.buildCategories.children[0].focus(); game.setBuildCollapsed(true);
  assert.equal(game.ui.buildCategories.inert, true);
  assert.equal(game.ui.buildList.inert, true);
  assert.equal(document.activeElement, elements.get('toggleBuild'), 'le focus quitte les commandes repliées');
  game.setBuildCollapsed(false); assert.equal(game.ui.buildCategories.inert, false);
});

test('clavier: radios et boutons gardent leurs touches natives, le jeu garde ses commandes', () => {
  const { game, elements, dispatchWindow } = bootGame();
  elements.get('difficultyStandard').focus();
  const radioArrow = dispatchWindow('keydown', { code: 'ArrowRight' });
  assert.equal(radioArrow.defaultPrevented, false, 'les flèches doivent sélectionner la difficulté');
  assert.equal(game.input.keys.has('ArrowRight'), false);
  assert.equal(dispatchWindow('keydown', { code: 'Tab' }).defaultPrevented, true, 'Tab doit boucler depuis le radio sélectionné, pas depuis un radio ignoré par le navigateur');
  assert.equal(document.activeElement, elements.get('newGameButton'));
  elements.get('howToButton').focus();
  assert.equal(dispatchWindow('keydown', { code: 'Space' }).defaultPrevented, false);
  game.startNew(); assert.equal(document.activeElement, game.canvas); game.canvas.focus();
  assert.equal(dispatchWindow('keydown', { code: 'ArrowRight' }).defaultPrevented, true);
  assert.equal(game.input.keys.has('ArrowRight'), true);
  dispatchWindow('keyup', { code: 'ArrowRight' }); assert.equal(game.input.keys.has('ArrowRight'), false);
  elements.get('toggleBuild').focus();
  assert.equal(dispatchWindow('keydown', { code: 'Space' }).defaultPrevented, false);
  assert.equal(game.input.pressed.has('Space'), false, 'activer un bouton ne doit pas donner un coup de crosse');
  game.ui.resources.focus();
  for (const code of ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp']) {
    assert.equal(dispatchWindow('keydown', { code }).defaultPrevented, false, 'les flèches doivent défiler la réserve focalisée');
    assert.equal(game.input.keys.has(code), false, 'faire défiler les réserves ne doit pas déplacer le survivant');
  }
});

test('pause et manuel: focus contenu, commandes arrière inertes et reprise du bon état', () => {
  const { game, elements, dispatchWindow } = bootGame(); game.startNew();
  elements.get('pauseButton').focus(); game.togglePause(true);
  assert.equal(game.ui.hud.inert, true);
  assert.equal(document.activeElement, elements.get('resumeButton'));
  elements.get('quitButton').focus();
  assert.equal(dispatchWindow('keydown', { code: 'Tab' }).defaultPrevented, true);
  assert.equal(document.activeElement, elements.get('resumeButton'));
  dispatchWindow('keydown', { code: 'Tab', shiftKey: true });
  assert.equal(document.activeElement, elements.get('quitButton'));
  const population = game.units.length; elements.get('recruitWorker').dispatch('click');
  assert.equal(game.units.length, population, 'aucune commande économique ne passe derrière la pause');
  elements.get('helpPauseButton').focus(); elements.get('helpPauseButton').dispatch('click');
  assert.equal(game.ui.pauseMenu.inert, true); assert.equal(game.activeOverlay, game.ui.helpModal);
  elements.get('closeHelp').dispatch('click');
  assert.equal(game.paused, true); assert.equal(document.activeElement, elements.get('helpPauseButton'));
  elements.get('resumeButton').dispatch('click');
  assert.equal(game.paused, false); assert.equal(game.ui.hud.inert, false);
  assert.equal(document.activeElement, elements.get('pauseButton'), 'le focus revient au bouton qui a ouvert la pause');
  game.showHelp(true); assert.equal(game.paused, true);
  game.showHelp(false); assert.equal(game.paused, false, 'le manuel ouvert en jeu reprend la simulation à sa fermeture');
  assert.equal(game.activeOverlay, null);
});

test('perte de focus: aucun déplacement, tir ou tracé ne reste maintenu', () => {
  const { game, dispatchWindow, dispatchDocument } = bootGame(); game.startNew();
  const hold = () => { game.input.keys.add('KeyW'); game.input.pressed.add('KeyR'); game.input.mouseDown = true; game.input.touchFire = true; game.wallStart = { x: 1, y: 1 }; game.wallPreview = [{ x: 1, y: 1 }]; };
  const released = () => { assert.equal(game.input.keys.size, 0); assert.equal(game.input.pressed.size, 0); assert.equal(game.input.mouseDown, false); assert.equal(game.input.touchFire, false); assert.equal(game.wallStart, null); assert.deepEqual(game.wallPreview, []); };
  hold(); dispatchWindow('blur'); released();
  hold(); document.hidden = true; dispatchDocument('visibilitychange'); released();
  document.hidden = false;
});

test('mouvement réduit: la caméra ne tremble pas, le menu oublie les alertes de partie', () => {
  const { game } = bootGame(); game.startNew(); game.settings.reducedMotion = true; game.camera.shake = 10;
  const translations = []; game.ctx.translate = (x, y) => translations.push([x, y]);
  const originalRandom = Math.random; Math.random = () => 1;
  try { game.render(); } finally { Math.random = originalRandom; }
  assert.deepEqual(translations[0], [game.width / 2, game.height / 2]);
  game.phase = 'assault'; game.morale = 10; game.updateUI();
  assert.equal(document.body.dataset.phase, 'assault'); assert.equal(document.body.classList.contains('morale-critical'), true);
  game.returnToMenu();
  assert.equal(document.body.dataset.phase, 'menu'); assert.equal(game.ui.hud.dataset.phase, 'menu');
  assert.equal(document.body.classList.contains('morale-critical'), false);
  assert.equal(game.activeOverlay, game.ui.mainMenu);
});

test('menace nord: indicateur visible sous le HUD sur desktop, mobile portrait et tactile paysage', () => {
  const { game, elements, compactMedia } = bootGame(); game.startNew();
  const rect = (left, top, right, bottom) => ({ left, top, right, bottom, width: right-left, height: bottom-top });
  const cases = [
    { width:1280, height:720, compact:false, topbar:72, left:rect(14,88,294,628), right:rect(980,88,1266,360) },
    { width:390, height:844, compact:true, topbar:88, left:rect(-282,100,52,156), right:rect(64,100,382,340) },
    { width:844, height:390, compact:true, topbar:76, left:rect(-266,85,52,141), right:rect(566,85,836,230) }
  ];
  for (const sample of cases) {
    globalThis.innerWidth=sample.width; globalThis.innerHeight=sample.height; compactMedia.setMatches(sample.compact); game.resize();
    game.setBuildCollapsed(sample.compact);
    elements.get('topbar').getBoundingClientRect=()=>rect(0,0,sample.width,sample.topbar);
    game.ui.leftPanel.getBoundingClientRect=()=>sample.left; game.ui.rightPanel.getBoundingClientRect=()=>sample.right;
    game.zombies=[{ x:game.camera.x, y:game.camera.y-3000 }];
    const positions=[]; game.ctx.translate=(x,y)=>positions.push([x,y]); game.drawThreatArrows(game.ctx);
    const [x,y]=positions[0]; assert.equal(x,sample.width/2);
    assert.ok(y-14>=sample.topbar+10, 'la pointe doit rester sous la barre, avec une marge');
    assert.ok(y+14<sample.height, 'le marqueur doit rester dans la fenêtre');
    for(const panel of [sample.left,sample.right]) if(panel.left<x+14&&panel.right>x-14) assert.ok(y-14>=panel.bottom+10, 'le panneau visible ne doit pas recouvrir le marqueur');
  }
});
