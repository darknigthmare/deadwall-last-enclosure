'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function installFakeBrowser() {
  class FakeClassList {
    constructor() { this.values = new Set(); }
    add(...values) { values.forEach(value => this.values.add(value)); }
    remove(...values) { values.forEach(value => this.values.delete(value)); }
    toggle(value, force) {
      if (force === undefined) {
        if (this.values.has(value)) { this.values.delete(value); return false; }
        this.values.add(value); return true;
      }
      if (force) this.values.add(value); else this.values.delete(value);
      return Boolean(force);
    }
    contains(value) { return this.values.has(value); }
  }

  const gradient = { addColorStop() {} };
  const ctxBase = {
    createRadialGradient() { return gradient; },
    createLinearGradient() { return gradient; },
    measureText(text) { return { width: String(text).length * 7 }; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    setTransform() {}, resetTransform() {}, save() {}, restore() {}
  };
  const context = new Proxy(ctxBase, {
    get(target, property) {
      if (property in target) return target[property];
      if (typeof property === 'symbol') return undefined;
      return () => {};
    },
    set(target, property, value) { target[property] = value; return true; }
  });

  class FakeElement {
    constructor(tag = 'div', id = '') {
      this.tagName = tag.toUpperCase(); this.id = id; this.classList = new FakeClassList();
      this.style = {}; this.dataset = {}; this.children = []; this.textContent = ''; this.disabled = false;
      this.value = ''; this.width = 220; this.height = 220; this.clientWidth = 1280; this.clientHeight = 720;
      this.parentNode = null; this._innerHTML = ''; this._listeners = new Map();
      this.attributes = new Map(); this.inert = false;
    }
    set innerHTML(value) { this._innerHTML = String(value); }
    get innerHTML() { return this._innerHTML; }
    addEventListener(type, handler) { if (!this._listeners.has(type)) this._listeners.set(type, []); this._listeners.get(type).push(handler); }
    removeEventListener() {}
    setPointerCapture() {}
    dispatch(type, extra = {}) { const event = { preventDefault() {}, pointerId: 1, target: this, ...extra }; for (const handler of this._listeners.get(type) || []) handler(event); }
    appendChild(node) { if (node) { node.parentNode = this; this.children.push(node); } return node; }
    prepend(node) { if (node) { node.parentNode = this; this.children.unshift(node); } return node; }
    replaceChildren(...nodes) { this.children = []; nodes.forEach(node => this.appendChild(node)); }
    matches(selector) {
      if (selector === '[inert]') return this.inert;
      if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
      if (selector.startsWith('#')) return this.id === selector.slice(1);
      if (selector === '[tabindex]') return this.attributes.has('tabindex');
      if (selector === '[contenteditable="true"]') return this.getAttribute('contenteditable') === 'true';
      if (selector === '[role="button"]') return this.getAttribute('role') === 'button';
      if (selector === 'a[href]') return this.tagName === 'A' && this.attributes.has('href');
      return this.tagName === selector.toUpperCase();
    }
    closest(selector) { for (let node = this; node; node = node.parentNode) if (selector.split(',').some(part => node.matches(part.trim()))) return node; return null; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || new FakeElement('span'); }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(selector.split(',').some(part => child.matches(part.trim())) ? [child] : []), ...child.querySelectorAll(selector)]); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    focus() { if (!this.closest('[inert], .hidden')) document.activeElement = this; }
    getClientRects() { return this.closest('.hidden') ? [] : [this.getBoundingClientRect()]; }
    remove() {
      if (!this.parentNode) return;
      const index = this.parentNode.children.indexOf(this);
      if (index >= 0) this.parentNode.children.splice(index, 1);
    }
    get lastElementChild() { return this.children[this.children.length - 1] || null; }
    get firstElementChild() { return this.children[0] || null; }
    getContext() { return context; }
    getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; }
  }

  const elements = new Map(), windowListeners = new Map(), documentListeners = new Map();
  const buttons = new Set(['newGameButton','continueButton','howToButton','helpPauseButton','closeHelp','pauseButton','resumeButton','saveButton','quitButton','restartButton','gameOverMenuButton','toggleBuild','closeSelection','repairSelected','upgradeSelected','demolishSelected','recruitWorker','recruitSoldier','setRally','repairAll','prioritySelected','researchButton','settingsToggle','soundToggle','touchAction','touchFire']);
  const listen = (listeners, type, handler) => { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(handler); };
  const dispatch = (listeners, type, extra = {}) => { const event = { code: '', target: document.activeElement, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra }; for (const handler of listeners.get(type) || []) handler(event); return event; };
  const document = {
    body: new FakeElement('body', 'body'),
    activeElement: null, hidden: false,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id === 'game' || id === 'minimap' ? 'canvas' : buttons.has(id) ? 'button' : 'div', id));
      return elements.get(id);
    },
    createElement(tag) { return new FakeElement(tag); },
    querySelector(selector) { return selector.includes('difficulty') ? document.getElementById('difficultyStandard') : new FakeElement('input'); },
    querySelectorAll(selector) { return selector === '#touchControls button[data-dir]' ? document.getElementById('touchControls').children.filter(node => node.dataset.dir) : document.body.querySelectorAll(selector); },
    addEventListener(type, handler) { listen(documentListeners, type, handler); }
  };
  const tree = {
    body: ['game','hud','mainMenu','pauseMenu','helpModal','gameOver'],
    hud: ['leftPanel','rightPanel','touchControls','pauseButton','resources','topbar'],
    leftPanel: ['toggleBuild','buildCategories','buildList'],
    rightPanel: ['recruitWorker','recruitSoldier','repairSelected','upgradeSelected','demolishSelected','prioritySelected','researchButton','settingsToggle','soundToggle','setRally','repairAll','closeSelection'],
    mainMenu: ['newGameButton','continueButton','howToButton','difficultyStory','difficultyStandard','difficultyBrutal'],
    pauseMenu: ['resumeButton','saveButton','helpPauseButton','quitButton'],
    helpModal: ['closeHelp'], gameOver: ['restartButton','gameOverMenuButton'], touchControls: ['touchAction','touchFire']
  };
  for (const [parent, children] of Object.entries(tree)) for (const id of children) (parent === 'body' ? document.body : document.getElementById(parent)).appendChild(document.getElementById(id));
  for (const id of ['hud','pauseMenu','helpModal','gameOver']) document.getElementById(id).classList.add('hidden');
  for (const value of ['story','standard','brutal']) { const difficulty = document.getElementById(`difficulty${value[0].toUpperCase()}${value.slice(1)}`); difficulty.tagName = 'INPUT'; difficulty.type = 'radio'; difficulty.name = 'difficulty'; difficulty.value = value; difficulty.checked = value === 'standard'; }
  const buildHelp = new FakeElement(); buildHelp.classList.add('build-help'); document.getElementById('leftPanel').appendChild(buildHelp);
  for (const dir of ['up','left','right','down']) { const button = new FakeElement('button'); button.dataset.dir = dir; document.getElementById('touchControls').appendChild(button); }
  document.activeElement = document.body;
  const storage = new Map();
  const localStorage = {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key), clear: () => storage.clear()
  };

  const mediaListeners = [], compactMedia = { matches: false, addEventListener(type, callback) { if (type === 'change') mediaListeners.push(callback); }, setMatches(value) { this.matches = value; mediaListeners.forEach(callback => callback({ matches: value })); } };
  Object.assign(globalThis, {
    document, window: globalThis, localStorage, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    location: { search: '', href: 'http://localhost/' },
    matchMedia(query) { return query.includes('(pointer: coarse)') ? compactMedia : { matches: false }; },
    addEventListener(type, handler) { listen(windowListeners, type, handler); }, removeEventListener() {}, requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}
  });
  return { storage, elements, compactMedia, dispatchWindow: (type, extra) => dispatch(windowListeners, type, extra), dispatchDocument: (type, extra) => dispatch(documentListeners, type, extra) };
}

function bootGame() {
  const env = installFakeBrowser(), projectRoot = path.resolve(__dirname, '..'), gamePath = path.join(projectRoot, 'src/game.js');
  globalThis.DeadwallCore = require(path.join(projectRoot, 'src/core.js'));
  delete require.cache[require.resolve(gamePath)]; require(gamePath);
  return { ...env, game: globalThis.DEADWALL };
}

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
