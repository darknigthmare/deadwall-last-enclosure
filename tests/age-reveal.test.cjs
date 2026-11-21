'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),Reveal=require('../src/age-reveal.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const root=path.join(__dirname,'..');
test('révélation par âge : la table est déclarative, bornée et sans effet sur les règles',()=>{
  const R=Reveal.rules(C);assert.equal(R.version,1);assert.ok(Object.isFrozen(R.entries));
  assert.equal(new Set(R.entries.map(entry=>entry.key)).size,R.entries.length);
  for(const entry of R.entries){
    assert.ok(Number.isInteger(entry.age)&&entry.age>=1&&entry.age<C.CITY_TIERS.length,entry.key);
    assert.ok(entry.ids.length+entry.fieldViews.length>0,entry.key);assert.ok(entry.label.length>2);
  }
  assert.equal(R.entries.find(entry=>entry.key==='soldiers').age,C.SURVIVORS.soldier.tier,'le menu suit le prérequis réel du fusilier');
  assert.equal(R.entries.find(entry=>entry.key==='specialists').age,C.SURVIVORS.medic.tier);
  assert.equal(R.normalizeAge(-4),0);assert.equal(R.normalizeAge(99),C.CITY_TIERS.length-1);assert.equal(R.normalizeAge('x'),0);
  assert.equal(R.pending(0).length,R.entries.length);assert.equal(R.pending(0,true).length,0);
  assert.equal(R.pending(C.CITY_TIERS.length-1).length,0,'le dernier âge ouvre tout');
  let previous=Infinity;for(let age=0;age<C.CITY_TIERS.length;age++){const count=R.pending(age).length;assert.ok(count<=previous,'un âge ne referme jamais un menu');previous=count;}
  const next=R.next(0);assert.equal(next.age,1);assert.equal(next.name,C.CITY_TIERS[1].name);assert.ok(next.entries.length>0);
  assert.equal(R.next(C.CITY_TIERS.length-1),null);
});

test('révélation par âge : les objectifs du début et les ordres de base ne sont jamais masqués',()=>{
  const veiled=new Set(Reveal.rules(C).entries.flatMap(entry=>[...entry.ids,...entry.fieldViews]));
  for(const id of ['recruitWorker','repairAll','researchButton','cityCommandButton','journalCommandButton','settingsToggle','soundToggle','toggleBuild','coordination','infected','sectors','recon'])assert.equal(veiled.has(id),false,id);
});

test('révélation par âge : le module ne touche ni aux stocks, ni à la sauvegarde, ni au hasard',()=>{
  const source=fs.readFileSync(path.join(root,'src/age-reveal.js'),'utf8');
  assert.equal(C.AgeReveal,undefined,'la table de présentation reste hors du cœur d’équilibrage');
  for(const forbidden of ['resources','serialize','Math.random','localStorage','rng','spend(','.save('])assert.equal(source.includes(forbidden),false,forbidden);
  assert.match(fs.readFileSync(path.join(root,'styles.css'),'utf8'),/\[data-age-veiled="true"\] \{ display: none !important; \}/);
});

test('révélation par âge : le réglage survit au stockage et vaut faux par défaut',()=>{
  const {bootGame}=require('./helpers/browser.cjs');
  const {game}=bootGame();assert.equal(game.settings.revealAll,false);
  game.settings.revealAll=true;assert.equal(game.saveSettings(),true);assert.equal(game.loadSettings().revealAll,true);
  localStorage.setItem(C.SETTINGS_KEY,JSON.stringify({revealAll:'oui'}));assert.equal(game.loadSettings().revealAll,false,'seul un vrai booléen est accepté');
});

test('révélation par âge : une nouvelle cité masque les menus tardifs, puis les ouvre avec l’âge ou le réglage',()=>{
  const booted=bootDocument134(),g=booted.g||booted.game,doc=booted.doc||booted.document;
  assert.ok(g&&doc,'document complet démarré');
  Reveal.install(g,doc);assert.ok(g.ageReveal);assert.equal(g.ageReveal.bypassed,false);
  const veiled=id=>doc.getElementById(id).getAttribute(Reveal.ATTRIBUTE)==='true';
  g.ageReveal.apply();assert.equal(veiled('recruitSoldier'),false,'rien n’est masqué hors partie');
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.updateUI();
  assert.equal(g.tier.id,0);
  for(const id of ['recruitSoldier','setRally','specialistCommandButton','squadCommandButton'])assert.equal(veiled(id),true,id);
  for(const id of ['recruitWorker','repairAll','researchButton','cityCommandButton'])assert.equal(veiled(id),false,id);
  const nav=doc.getElementById('commandPanel-field').querySelector('.field-nav'),view=key=>[...nav.children].find(node=>node.dataset.fieldView===key);
  assert.equal(view('operations').getAttribute(Reveal.ATTRIBUTE),'true');assert.equal(view('territories').getAttribute(Reveal.ATTRIBUTE),'true');
  assert.notEqual(view('coordination').getAttribute(Reveal.ATTRIBUTE),'true');
  const before=JSON.stringify(g.resources),tier=g.tier;
  g.tier=C.CITY_TIERS[1];g.updateUI();
  assert.equal(veiled('recruitSoldier'),false);assert.equal(veiled('setRally'),false);assert.equal(veiled('squadCommandButton'),true);
  g.tier=C.CITY_TIERS[5];g.updateUI();
  for(const entry of Reveal.rules(C).entries)for(const id of entry.ids)if(doc.getElementById(id))assert.equal(veiled(id),false,id);
  assert.notEqual(view('territories').getAttribute(Reveal.ATTRIBUTE),'true');
  g.tier=tier;g.updateUI();assert.equal(veiled('squadCommandButton'),true);
  g.settings.revealAll=true;g.ageReveal.apply();
  assert.equal(veiled('squadCommandButton'),false,'« tout afficher » ouvre tout');assert.equal(g.ageReveal.pending().length,0);
  g.settings.revealAll=false;g.ageReveal.apply();assert.equal(veiled('squadCommandButton'),true);
  assert.equal(JSON.stringify(g.resources),before,'aucun stock modifié');
  assert.match(doc.getElementById('settingsRevealNote').textContent,/Prochain âge/);
});

test('révélation par âge : l’ouverture de la filière des corps est annoncée une fois, au passage de l’âge, jamais à la reprise',()=>{
  const start=C.CorpseChain217Rules.startAge,name=C.CITY_TIERS[start].name;
  const run=(old)=>{
    const {g,doc}=bootDocument134();Reveal.install(g,doc);g.startNew('standard','17117');g.campaignIntro132?.skip?.();
    if(old){const data=JSON.parse(JSON.stringify(g.serialize()));delete data.expansions127.modules.corpseChain217;assert.equal(g.restoreSave(data),true);}
    const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
    g.updateUI();g.tier=C.CITY_TIERS[start-1];g.updateUI();g.tier=C.CITY_TIERS[start];g.updateUI();g.updateUI();g.tier=C.CITY_TIERS[start+1];g.updateUI();
    const said=notes.filter(t=>t.includes('la filière des corps s’ouvre'));
    // Reprise d'une campagne déjà à cet âge : rien n'est rejoué. L'âge est recalculé au chargement par le moteur ;
    // ici, la mesure d'âge est forcée pour que la campagne reprise soit bien à cet âge dès son chargement.
    const data=JSON.parse(JSON.stringify(g.serialize()));const urban=g.urban;g.urban={...urban,attain:()=>C.CITY_TIERS[start]};
    assert.equal(g.restoreSave(data),true);assert.equal(g.tier.id,start);g.updateUI();g.updateUI();g.urban=urban;
    return {said,again:notes.filter(t=>t.includes('la filière des corps s’ouvre')).length};
  };
  const fresh=run(false);
  assert.equal(fresh.said.length,1);assert.ok(fresh.said[0].startsWith(name.charAt(0)+name.slice(1).toLowerCase()+' : la filière des corps s’ouvre.'));assert.match(fresh.said[0],/Corps et salubrité/);
  assert.equal(fresh.again,1,'la reprise ne répète pas l’annonce');
  assert.equal(run(true).said.length,0,'ancienne campagne : la filière reste fermée, rien n’est annoncé');
});
