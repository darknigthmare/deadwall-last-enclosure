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
    }
    set innerHTML(value) { this._innerHTML = String(value); }
    get innerHTML() { return this._innerHTML; }
    addEventListener(type, handler) { if (!this._listeners.has(type)) this._listeners.set(type, []); this._listeners.get(type).push(handler); }
    removeEventListener() {}
    setPointerCapture() {}
    dispatch(type, extra = {}) { const event = { preventDefault() {}, pointerId: 1, ...extra }; for (const handler of this._listeners.get(type) || []) handler(event); }
    appendChild(node) { if (node) { node.parentNode = this; this.children.push(node); } return node; }
    prepend(node) { if (node) { node.parentNode = this; this.children.unshift(node); } return node; }
    replaceChildren(...nodes) { this.children = []; nodes.forEach(node => this.appendChild(node)); }
    querySelector() { return new FakeElement('span'); }
    querySelectorAll() { return []; }
    setAttribute() {}
    getAttribute() { return null; }
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

  const elements = new Map();
  const document = {
    body: new FakeElement('body', 'body'),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id === 'game' || id === 'minimap' ? 'canvas' : 'div', id));
      return elements.get(id);
    },
    createElement(tag) { return new FakeElement(tag); },
    querySelector(selector) { return selector.includes('difficulty') ? { value: 'standard' } : new FakeElement('input'); },
    querySelectorAll() { return []; }, addEventListener() {}
  };
  const storage = new Map();
  const localStorage = {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key), clear: () => storage.clear()
  };

  Object.assign(globalThis, {
    document, window: globalThis, localStorage, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    location: { search: '', href: 'http://localhost/' },
    addEventListener() {}, removeEventListener() {}, requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}
  });
  return { storage, elements };
}

test('smoke test du jeu complet: démarrage, simulation, horde, rendu et sauvegarde', () => {
  const { storage, elements } = installFakeBrowser();
  const projectRoot = path.resolve(__dirname, '..');
  globalThis.DeadwallCore = require(path.join(projectRoot, 'src/core.js'));
  require(path.join(projectRoot, 'src/game.js'));

  const game = globalThis.DEADWALL;
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
