'use strict';



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
      if (selector === '[data-game-command]') return Boolean(this.dataset.gameCommand);
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
    click() { if (!this.disabled && !this.closest('[inert], .hidden')) this.dispatch('click'); }
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
    body: ['game','hud','mainMenu','pauseMenu','helpModal','gameOver','settingsModal','commandModal'],
    hud: ['leftPanel','rightPanel','touchControls','pauseButton','resources','topbar'],
    leftPanel: ['toggleBuild','buildCategories','buildList'],
    rightPanel: ['recruitWorker','recruitSoldier','repairSelected','upgradeSelected','demolishSelected','prioritySelected','researchButton','settingsToggle','soundToggle','setRally','repairAll','closeSelection'],
    mainMenu: ['newGameButton','continueButton','howToButton','menuSettingsButton','difficultyStory','difficultyStandard','difficultyBrutal'],
    pauseMenu: ['resumeButton','saveButton','helpPauseButton','quitButton'],
    helpModal: ['closeHelp'], gameOver: ['restartButton','gameOverMenuButton'], touchControls: ['touchAction','touchFire']
  };
  for (const [parent, children] of Object.entries(tree)) for (const id of children) (parent === 'body' ? document.body : document.getElementById(parent)).appendChild(document.getElementById(id));
  for(const id of ['settingsClose','settingsSaveNow','settingsExport','settingsImport','settingsFullscreen','settingsQuit']){const node=document.getElementById(id);node.tagName='BUTTON';document.getElementById('settingsModal').appendChild(node);}
  for(const id of ['settingsVolume','settingsMuted','settingsContrast','settingsMotion','settingsQuality','settingsStatus','settingsVolumeValue','settingsImportFile']){const node=document.getElementById(id);node.tagName=id==='settingsQuality'?'SELECT':id==='settingsStatus'||id==='settingsVolumeValue'?'DIV':'INPUT';document.getElementById('settingsModal').appendChild(node);}
  const review=document.getElementById('settingsImportReview');review.classList.add('hidden');document.getElementById('settingsModal').appendChild(review);
  for(const id of ['settingsImportSummary','settingsImportConfirm','settingsImportCancel']){const node=document.getElementById(id);node.tagName=id==='settingsImportSummary'?'P':'BUTTON';review.appendChild(node);}
  document.getElementById('menuSettingsButton').tagName='BUTTON';
  for (const id of ['hud','pauseMenu','helpModal','gameOver','settingsModal','commandModal']) document.getElementById(id).classList.add('hidden');
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
  const env = installFakeBrowser(), projectRoot = path.resolve(__dirname, '..', '..'), gamePath = path.join(projectRoot, 'src/game.js');
  globalThis.DeadwallCore = require(path.join(projectRoot, 'src/core.js'));
  globalThis.DeadwallSave = require(path.join(projectRoot, 'src/save.js')); globalThis.DeadwallTactics = require(path.join(projectRoot, 'src/tactics.js')); globalThis.DeadwallProfile = require(path.join(projectRoot, 'src/profile.js'));
  delete require.cache[require.resolve(gamePath)]; require(gamePath);
  return { ...env, game: globalThis.DEADWALL };
}


module.exports = { installFakeBrowser, bootGame };
