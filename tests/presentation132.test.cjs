'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { boot131 } = require('./helpers/expansions131.cjs');
const Presentation = require('../src/presentation132.js');
function fixture({intro=false}={}) {
  const env = boot131({ ui: true }), g = env.g, doc = document;
  require('../src/command-presentation129.js').install(g, doc);
  const menu = g.ui.mainMenu, originals = new Map(['newGameButton','continueButton','howToButton','menuSettingsButton','mapSeed','startScenario','randomMapSeedButton','menuRecordsButton'].map(id => [id, doc.getElementById(id)]));
  menu.replaceChildren();
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8').split('<div id="mainMenu"')[1].split('<div id="pauseMenu"')[0];
  const content = html.slice(html.indexOf('>') + 1).replace(/<\/div>\s*$/, ''), stack = [menu];
  const proto = Object.getPrototypeOf(doc.body), append = proto.appendChild, prepend = proto.prepend;
  proto.appendChild = function (n) { if (n.parentNode) n.remove(); return append.call(this,n); };
  proto.prepend = function (n) { if (n.parentNode) n.remove(); return prepend.call(this,n); };
  for (const token of content.match(/<[^>]+>|[^<]+/g)) {
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (token.startsWith('<')) {
      const m = /^<(\w+)/.exec(token); if (!m) continue;
      const id = /id="([^"]+)"/.exec(token)?.[1], n = originals.get(id) || doc.createElement(m[1]);
      n.tagName = m[1].toUpperCase();
      for (const a of token.matchAll(/([\w-]+)="([^"]*)"/g)) {
        if (a[1] === 'id') { n.id = a[2]; env.elements.set(n.id,n); }
        else if (a[1] === 'class') n.className = a[2];
        else if (['value','type','name'].includes(a[1])) n[a[1]] = a[2];
        else n.setAttribute(a[1],a[2]);
      }
      stack.at(-1).appendChild(n); if (!['input','br','img','hr'].includes(m[1])) stack.push(n);
    } else if (token.trim()) stack.at(-1).textContent += token.trim();
  }
  g.scenarioUI = { refresh() { const s = globalThis.DeadwallScenarios.get(doc.getElementById('startScenario').value || 'classic'); doc.getElementById('startScenarioDescription').textContent = s.description; } };
  doc.getElementById('startScenario').value = 'classic';
  g.returnToMenu(); g.scenarioUI.refresh();
  const save = g.serialize(), buttons = new Map([...originals].map(([id,node]) => [id,node._listeners.get('click')?.length || 0]));
  if (intro) require('../src/campaign-intro132.js').install(g,doc);
  assert.equal(Presentation.install(g,doc),true);
  return { ...env, g, doc, menu, originals, buttons, save, q:id => doc.getElementById(id) };
}

test('présentation 132 : les contrôles du titre sont déplacés sans duplication ni perte de handlers', () => {
  const {g,doc,menu,originals,buttons,q} = fixture();
  assert.equal(Presentation.install(g,doc),false);
  for (const [id,node] of originals) {
    assert.equal(q(id),node,id); assert.equal(menu.querySelectorAll('#'+id).length,1,id);
    assert.equal(node._listeners.get('click')?.length || 0,buttons.get(id),id);
  }
  assert.equal(q('startScenario').closest('.title-brief132')?.getAttribute('aria-labelledby'),'titleBriefHeading132');
  assert.equal(q('newGameButton').closest('.title-identity132')?.tagName,'SECTION');
  assert.equal(q('campaignSaveNote').closest('details').id,'campaignStorage132');
  assert.equal(q('startScenarioFacts').closest('details').id,'scenarioSupply132');
  assert.equal(q('mapSeed').closest('details').id,'campaignMap132');
  let starts = 0; g.requestNewGame = () => { starts++; return true; };
  q('newGameButton').click(); assert.equal(starts,1);
  const pause=q('pauseButton');
  assert.equal(pause.querySelectorAll('svg').length,1,'Le symbole de pause ne dépend plus d’un glyphe de police');
  assert.equal(pause.querySelector('svg').getAttribute('aria-hidden'),'true');
});

test('présentation 132 : quatre briefings cohérents, sans toucher aux règles ni aux réserves', () => {
  const {g,q,doc,save} = fixture(), select = q('startScenario'), original = select;
  for (const id of ['convoy','reconstruction','rearguard','classic']) {
    select.value = id; select.dispatch('change');
    const portrait = doc.querySelectorAll('.title-portrait132')[0];
    assert.equal(portrait.dataset.scenario,id);
    assert.match(portrait.querySelector('small').textContent,/D-17/);
    assert.equal(select,original); assert.equal(portrait.querySelectorAll('svg').length,1);
  }
  assert.deepEqual(g.resources,save.resources); assert.equal(g.phaseTime,save.phaseTime);
  assert.equal(g.world.seed,save.worldSeed);
});

test('présentation 132 : réutiliser une carte ouvre son champ avant la restitution du focus', () => {
  const {g,q,doc} = fixture(); q('campaignMap132').open = false;
  q('mapSeed').value = '835711'; q('startScenario').value = 'convoy'; g.scenarioUI.refresh();
  assert.equal(q('campaignMap132').open,true);
  assert.equal(doc.querySelectorAll('.title-portrait132')[0].dataset.scenario,'convoy');
  q('mapSeed').focus(); assert.equal(doc.activeElement,q('mapSeed'));
  q('campaignMap132').open = false; q('mapSeed').dispatch('invalid'); assert.equal(q('campaignMap132').open,true);
});

test('présentation 132 : la difficulté rafraîchit le dossier depuis les radios réelles sans IDs supposés', () => {
  const {g,menu} = fixture(); let refreshes = 0; g.scenarioUI = { refresh() { refreshes++; } };
  const radios = menu.querySelectorAll('input').filter(n => n.name === 'difficulty'); assert.equal(radios.length,3);
  for (const radio of radios) radio.dispatch('change');
  assert.equal(refreshes,3);
});

test('présentation 132 : navigation du commandement et ordres gardent leurs contrôleurs', () => {
  const {g,q,doc} = fixture(); g.startNew('standard','17117'); g.showCommand(true);
  const tab = q('commandTab-records'); assert.equal(tab.querySelector('strong').textContent,'Campagnes');
  assert.equal(tab.getAttribute('aria-label'),'Campagnes — bilans et records');
  assert.equal(q('menuRecordsButton').textContent,'BILANS DE CAMPAGNE');
  assert.equal(q('commandQuick-field').querySelector('small').textContent,'Matériel, itinéraires et expéditions');
  q('commandTab-enclosure').dispatch('keydown',{code:'ArrowDown'});
  assert.equal(doc.activeElement,q('commandTab-workers')); assert.equal(g.paused,true);
  q('commandTab-enclosure').click(); q('commandQuick-defense').click(); assert.equal(g.commandPresentation.defenses.open,true);
  q('commandReturn129').click(); assert.equal(g.activeOverlay,null); assert.equal(g.paused,false);
});

test('présentation 132 : les pictogrammes sont décoratifs et les actualisations sont stables', () => {
  const {g,doc,q} = fixture();
  const glyph = q('commandTab-enclosure').querySelector('svg');
  assert.equal(glyph.getAttribute('aria-hidden'),'true'); assert.equal(glyph.getAttribute('focusable'),'false');
  assert.equal(glyph.getAttribute('viewBox'),'0 0 24 24');
  const original = q('newGameButton'), count = doc.body.querySelectorAll('svg').length;
  original.focus(); for (let i=0;i<500;i++) g.presentation132.refreshScenario();
  assert.equal(doc.body.querySelectorAll('svg').length,count); assert.equal(doc.activeElement,original);
  assert.equal(q('newGameButton'),original);
});


test('présentation 132 : revoir le prologue depuis la pause revient au bouton sans reprendre la simulation', () => {
  const {g,q,doc} = fixture({intro:true}); g.startNew('standard','17117'); g.campaignIntro132.skip(); g.togglePause(true);
  const replay = q('replayIntro132'); assert.equal(replay.disabled,false); replay.focus();
  const stable = () => { const save = g.serialize(); delete save.timestamp; return save; };
  const before = stable(), elapsed = g.elapsed; replay.click();
  assert.equal(g.campaignIntro132.isOpen(),true); assert.equal(g.campaignIntro132.view().replay,true);
  g.campaignIntro132.skip(); assert.equal(g.activeOverlay,g.ui.pauseMenu); assert.equal(g.paused,true);
  assert.equal(doc.activeElement,replay); assert.equal(g.elapsed,elapsed); assert.deepEqual(stable(),before);
});
