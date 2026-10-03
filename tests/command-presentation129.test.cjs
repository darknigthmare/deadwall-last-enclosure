'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { bootGame } = require('./helpers/browser.cjs');
const Presentation = require('../src/command-presentation129.js');
const C = require('../src/core.js'), Art = require('../src/art.js');
function fixture(options={}) {
  delete globalThis.DeadwallArt;
  const env = options.realMap ? require('./helpers/expansions127.cjs').boot127() : bootGame(), g = env.game, doc = globalThis.document;
  const proto = Object.getPrototypeOf(doc.body);
  const append = proto.appendChild, prepend = proto.prepend;
  proto.appendChild = function(n) { if (n.parentNode) n.remove(); return append.call(this, n); };
  proto.prepend = function(n) { if (n.parentNode) n.remove(); return prepend.call(this, n); };
  Object.defineProperty(proto, 'className', { set(value) { this.classList.values = new Set(String(value).split(/\s+/).filter(Boolean)); }, get() { return [...this.classList.values].join(' '); } });
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8').split('<div id="commandModal"')[1].split('<div id="settingsModal"')[0];
  const content = html.slice(html.indexOf('>') + 1).replace(/<\/div>\s*$/, '');
  const stack = [g.ui.commandModal];
  // The real markup supplies the hierarchy. The fixture models DOM events, not layout.
  for (const token of content.match(/<[^>]+>|[^<]+/g)) {
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (token.startsWith('<')) {
      const m = /^<(\w+)/.exec(token); if (!m) continue;
      const n = doc.createElement(m[1]);
      for (const a of token.matchAll(/([\w-]+)="([^"]*)"/g)) {
        if (a[1] === 'id') { n.id = a[2]; env.elements.set(n.id, n); }
        else if (a[1] === 'class') n.className = a[2];
        else n.setAttribute(a[1], a[2]);
      }
      stack.at(-1).appendChild(n); if (!['input','br','img','hr'].includes(m[1])) stack.push(n);
    } else if (token.trim()) stack.at(-1).textContent += token.trim();
  }
  const originalGet = doc.getElementById.bind(doc); doc.getElementById = id => doc.body.querySelectorAll('#' + id)[0] || originalGet(id);
  globalThis.DeadwallArt = Art;
  let illustrations = 0, mapDraws = 0;
  g.art = { rects: {}, blit() { illustrations++; return true; } };
  if(!options.realMap)g.exploration125 = { renderMap(ctx,w,h) { mapDraws++; this.last = { w,h,seed:g.world.seed,regional:g.frontier.active() }; } };
  g.startNew('standard', '17117');
  const path = require.resolve('../src/command-ui.js'); delete require.cache[path]; require(path);
  const gateButtons = ['auto','open','closed'].map(id=>doc.getElementById('gateMode-'+id));
  if (options.strictTokens) {
    // Native DOMTokenList.add validates every token before making any change.
    // The shared simulated document deliberately does not implement this rule.
    const classes = Object.getPrototypeOf(doc.body.classList), add = classes.add;
    classes.add = function (...values) {
      const tokens = values.map(String);
      if (tokens.some(token => token === '')) throw new DOMException('Empty class token', 'SyntaxError');
      if (tokens.some(token => /[\t\n\f\r ]/.test(token))) throw new DOMException('Whitespace in class token', 'InvalidCharacterError');
      return add.apply(this, tokens);
    };
  }
  assert.equal(Presentation.install(g, doc), true);
  return { ...env, g, doc, q: id => doc.getElementById(id), gateButtons, illustrations: () => illustrations, mapDraws: () => mapDraws };
}

test('commandement visuel : installation complète avec la validation native des classes', () => {
  const {g,doc,q}=fixture({strictTokens:true});
  const probe=doc.createElement('div');
  assert.throws(()=>probe.classList.add('valid',''),{name:'SyntaxError'});
  assert.equal(probe.classList.contains('valid'),false,'Les tokens refusés ne doivent pas modifier la liste.');
  assert.throws(()=>probe.classList.add('two tokens'),{name:'InvalidCharacterError'});
  for(const [id,title] of [['enclosure','Situation'],['workers','Personnel'],['research','Doctrines'],['records','Archives'],['field','Opérations'],['journal','Journal']]) {
    const tab=q('commandTab-'+id);
    assert.equal(tab.querySelector('strong').textContent,title);
    assert.equal(tab.querySelector('canvas').classList.contains('command-art129'),true);
  }
  assert.equal(q('commandDashboard129').parentNode,q('commandPanel-enclosure'));
  g.showCommand(true);
  q('commandQuick-crew').click();
  assert.equal(q('commandPanel-workers').classList.contains('hidden'),false);
  assert.equal(g.paused,true);
  q('commandReturn129').click();
  assert.equal(g.activeOverlay,null);
  assert.equal(g.paused,false);
});

test('commandement visuel : six rubriques, contrôleurs conservés, pause et retour exact', () => {
  const f = fixture(), {g,q} = f;
  assert.equal(Presentation.install(g, document), false);
  g.showCommand(true);
  assert.equal(g.paused, true); assert.equal(g.activeOverlay, g.ui.commandModal);
  assert.equal(q('commandDashboard129').parentNode, q('commandPanel-enclosure'));
  assert.equal(q('commandMap129').getAttribute('aria-label').includes('17117'), true);
  assert.equal(q('commandTab-enclosure').querySelector('strong').textContent, 'Situation');
  q('commandQuick-defense').click(); assert.equal(g.commandPresentation.defenses.open, true);
  assert.equal(document.activeElement, g.commandPresentation.defenses.querySelector('summary'));
  assert.ok(f.gateButtons.every((b,i)=>b===q('gateMode-'+['auto','open','closed'][i])));
  q('commandReturn129').click(); assert.equal(g.paused,false); assert.equal(g.activeOverlay,null);
  g.paused=true; g.ui.pauseMenu.classList.remove('hidden'); g.syncOverlayFocus(); g.showCommand(true);
  assert.equal(q('commandReturn129').textContent,'RETOUR À LA PAUSE');
  q('commandReturn129').click(); assert.equal(g.paused,true); assert.equal(g.activeOverlay,g.ui.pauseMenu);
});

test('commandement visuel : clavier vertical/horizontal accède aux six rubriques', () => {
  const {g,q}=fixture(); g.showCommand(true);
  q('commandTab-enclosure').dispatch('keydown',{code:'ArrowDown'});
  assert.equal(q('commandTab-workers').getAttribute('aria-selected'),'true'); assert.equal(document.activeElement,q('commandTab-workers'));
  q('commandTab-workers').dispatch('keydown',{code:'End'}); assert.equal(document.activeElement,q('commandTab-journal'));
  q('commandTab-journal').dispatch('keydown',{code:'ArrowUp'}); assert.equal(document.activeElement,q('commandTab-field'));
  q('commandTab-field').dispatch('keydown',{code:'Home'}); assert.equal(document.activeElement,q('commandTab-enclosure'));
  q('commandTab-enclosure').dispatch('keydown',{code:'ArrowLeft'}); assert.equal(document.activeElement,q('commandTab-journal'));
});

test('commandement visuel : les ordres illustrés modifient le vrai collectif sans doublon', () => {
  const {g,q}=fixture(); g.showCommand(true); q('commandQuick-crew').click();
  const order=q('workerOrders').children.find(n=>n.dataset.workerOrder==='harvest');
  assert.equal(order._listeners.get('click').length,1); assert.ok(order.querySelector('canvas'));
  order.click(); assert.equal(g.workerOrder,'harvest'); assert.equal(order.getAttribute('aria-pressed'),'true');
  assert.equal(g.paused,true); assert.equal(q('commandPanel-workers').classList.contains('hidden'),false);
});

test('commandement visuel : doctrine illustrée garde prix, limite, débit unique et confirmation', () => {
  const {g,q}=fixture(); g.resources.scrap=100; g.resources.food=100; g.research.insight=3; g.showCommand(true,'research');
  const card=q('researchLibrary').children.find(n=>n.dataset.researchId==='logistics');
  const b=card.querySelector('button'); assert.equal(b.disabled,false); assert.ok(card.querySelector('.doctrine-cost').textContent.includes('45'));
  const before={...g.resources}; b.click(); assert.equal(g.resources.scrap,before.scrap-45); assert.equal(g.resources.food,before.food-25);
  assert.equal(g.research.insight,2); assert.equal(g.hasResearch('logistics'),true); assert.equal(b.disabled,true); b.click(); assert.equal(g.resources.scrap,before.scrap-45);
});

test('commandement visuel : informations réelles et alertes sans modifier ressources ni phase', () => {
  const {g,q}=fixture(); g.core().health=g.core().maxHealth*.2; g.resources.food=0;
  const before=g.serialize(); g.showCommand(true);
  const state=g.commandPresentation.status(); assert.equal(state.health,.2); assert.equal(state.danger,true); assert.match(state.warning,/endommagé/);
  assert.equal(q('commandDashboard129').querySelector('progress').value,.2); assert.equal(state.population,g.population);
  assert.equal(g.world.seed,before.worldSeed); assert.deepEqual(g.resources,before.resources);
  assert.equal(g.phase,before.phase); assert.equal(g.phaseTime,before.phaseTime);
});

test('commandement visuel : carte utilise le peintre partagé de la campagne courante', () => {
  const {g,q,mapDraws}=fixture(); g.showCommand(true); assert.deepEqual(g.exploration125.last,{w:640,h:640,seed:17117,regional:false});
  const before=mapDraws(); g.showCommand(true,'research'); for(let i=0;i<30;i++)g.commandPresentation.refresh(true); assert.equal(mapDraws(),before);
  g.showCommand(false); g.startNew('standard','835711'); g.showCommand(true); assert.equal(g.exploration125.last.seed,835711); assert.match(q('commandMap129').getAttribute('aria-label'),/835711/);
});

test('commandement visuel : actualisations conservent DOM/focus et ne dessinent pas en arrière-plan', () => {
  const {g,q,mapDraws,illustrations}=fixture(); const closed=mapDraws(); for(let i=0;i<1000;i++)g.commandPresentation.refresh(); assert.equal(mapDraws(),closed);
  g.showCommand(true); q('commandQuick-defense').focus(); const focus=document.activeElement; const canvas=q('commandMap129'), nodes=g.ui.commandModal.querySelectorAll('canvas,button,article,details').length, art=illustrations();
  for(let i=0;i<500;i++){g.resources.wood=i;g.commandPresentation.refresh(true);}
  assert.equal(document.activeElement,focus); assert.equal(q('commandMap129'),canvas); assert.equal(illustrations(),art);
  assert.equal(g.ui.commandModal.querySelectorAll('canvas,button,article,details').length,nodes);
  assert.equal(q('commandQuick-defense')._listeners.get('click').length,1);
  g.showCommand(false); const ended=mapDraws(); for(let i=0;i<1000;i++)g.commandPresentation.refresh(true); assert.equal(mapDraws(),ended);
});

test('commandement visuel : raccourci opérations appelle le système existant, modale prioritaire respectée', () => {
  const {g,q}=fixture(); let opens=0; g.expansionUI={open(){opens++;g.showCommand(true,'field');}};
  g.showCommand(true); q('commandQuick-field').click(); assert.equal(opens,1); assert.equal(q('commandPanel-field').classList.contains('hidden'),false);
  g.showCommand(false); g.ui.helpModal.classList.remove('hidden'); g.syncOverlayFocus(); g.showCommand(true);
  assert.equal(g.activeOverlay,g.ui.helpModal); assert.equal(g.ui.commandModal.classList.contains('hidden'),true);
});

test('illustrations : ratios source conservés et atlas manquant toléré', () => {
  const {g,doc}=fixture(); const canvas=doc.createElement('canvas'); canvas.width=192;canvas.height=132;
  let args; g.art.blit=(...value)=>{args=value;return true;};
  assert.equal(Presentation.drawIllustration(g,canvas,'core'),true); assert.equal(args[1],'buildings'); assert.equal(args[2],Art.BUILDINGS.core);
  assert.ok(Math.abs(args[5]/args[6]-Art.BUILDINGS.core[2]/Art.BUILDINGS.core[3])<1e-10);
  g.art=null; assert.equal(Presentation.drawIllustration(g,canvas,'core'),false);
});


test('QA croisée commandement : vraie carte locale, région, retour puis nouvelle graine sans désynchronisation',()=>{
  const {g,q}=fixture({realMap:true});
  const calls=[],ctx=new Proxy({measureText:t=>({width:String(t).length*7})},{get(t,k){if(k in t)return t[k];return(...a)=>calls.push([k,...a]);},set(t,k,v){t[k]=v;return true;}});
  q('commandMap129').getContext=()=>ctx;
  g.showCommand(true);assert.ok(calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('CARTE 17117')));
  assert.ok(calls.some(c=>c[0]==='arc'&&c[3]===5&&c[1]===g.player.x*640/4096));
  g.showCommand(false);g.player.x=4055;g.player.y=2048;assert.equal(g.frontier.enter(),true);calls.length=0;
  const seed=g.world.seed,plan=g.exploration125.plan;g.showCommand(true);assert.match(q('commandMap129').getAttribute('aria-label'),/Commandant en région/);
  assert.ok(!calls.some(c=>c[0]==='arc'&&c[3]===5&&c[1]===g.player.x*640/4096));assert.equal(g.world.seed,seed);assert.equal(g.exploration125.plan,plan);
  g.showCommand(false);const d=g.serialize();d.frontier.x=4160;d.frontier.y=4096;g.restoreSave(d);assert.equal(g.frontier.leave(),true);
  calls.length=0;g.showCommand(true);assert.ok(!q('commandMap129').getAttribute('aria-label').includes('en région'));assert.equal(g.exploration125.plan,plan);
  g.showCommand(false);g.startNew('standard','0');calls.length=0;g.showCommand(true);
  assert.match(q('commandMap129').getAttribute('aria-label'),/carte 0/);assert.equal(g.exploration125.plan.seed,0);
  assert.ok(calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('CARTE 0')));
});
