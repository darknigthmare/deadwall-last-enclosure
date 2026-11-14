'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),Readout=require('../src/siege-readout.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const root=path.join(__dirname,'..');

test('lecture de siège : les quatre parts reproduisent exactement la signature du moteur',()=>{
  const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.refreshMetrics(true);
  const sig=Readout.signatureParts(g),sum=sig.parts.reduce((n,part)=>n+part.value,0);
  assert.equal(sig.parts.length,4);assert.ok(Math.abs(sum-g.signature)<1e-9,'somme des parts = signature');assert.equal(sig.total,g.signature);
  assert.ok(Object.isFrozen(sig)&&Object.isFrozen(sig.parts));
});

test('lecture de siège : l’effet sur la horde est lu dans le plan de vague, sans formule recopiée',()=>{
  for(const [wave,signature]of [[1,0],[5,180],[12,288],[30,2000]]){
    const g={wave,difficulty:C.DIFFICULTIES.standard,signature},effect=Readout.hordeEffect(C,g);
    assert.equal(effect.actual,C.wavePlan(wave,C.DIFFICULTIES.standard,signature).total);
    assert.equal(effect.quiet,C.wavePlan(wave,C.DIFFICULTIES.standard,0).total);
    assert.equal(effect.extra,effect.actual-effect.quiet);assert.ok(effect.percent>=0&&effect.percent<=81,'plafond d’attraction respecté');
  }
  assert.equal(Readout.hordeEffect(C,{wave:3,difficulty:C.DIFFICULTIES.brutal,signature:0}).extra,0);
  const source=fs.readFileSync(path.join(root,'src/siege-readout.js'),'utf8');
  for(const forbidden of ['360','1.62','Math.random','localStorage','.resources','spend(','.save(','serialize'])assert.equal(source.includes(forbidden),false,forbidden);
});

test('lecture de siège : le bilan se lit en une phrase et accorde ses pluriels',()=>{
  const night=(kills,unitsLost,buildingsLost)=>({wave:7,seconds:95,outcome:'secured',partial:false,metrics:{kills,unitsLost,buildingsLost,shots:12}});
  assert.equal(Readout.nightSentence(night(1,0,0)),'Bilan de la vague 7 : 1 éliminé, aucune perte, aucune structure perdue.');
  assert.equal(Readout.nightSentence(night(84,2,1)),'Bilan de la vague 7 : 84 éliminés, 2 équipiers perdus, 1 structure perdue.');
});

test('lecture de siège : les cartes suivent la partie sans toucher aux stocks ni à la sauvegarde',()=>{
  const {g,doc}=bootDocument134();Readout.install(g,doc);assert.ok(g.siegeReadout);
  const box=doc.getElementById('siegeReadout');assert.equal(box.hidden,true,'rien hors partie');
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.refreshMetrics(true);
  const state=()=>JSON.stringify({...g.serialize(),timestamp:0});
  const stock=JSON.stringify(g.resources),saved=state();
  g.siegeReadout.render();
  assert.equal(box.hidden,false);
  assert.equal(doc.getElementById('siegeReadoutSignatureTitle').textContent,String(Math.round(g.signature)));
  assert.match(doc.getElementById('siegeReadoutEffect').textContent,/^Vague 1 : /);
  assert.match(doc.getElementById('siegeReadoutNightTitle').textContent,/premier bilan/);
  assert.equal(JSON.stringify(g.resources),stock);assert.ok(state()===saved,'la lecture ne change pas l’état sauvegardé');
  const before=g.signature;g.signature=before+200;g.siegeReadout.render();
  assert.match(doc.getElementById('siegeReadoutEffect').textContent,/\+\d+ % d’infectés/);g.signature=before;
  assert.equal(doc.getElementById('siegeReadoutNight').querySelectorAll('dd').length,0);
});

test('lecture de siège : une nuit sécurisée est annoncée une seule fois, jamais à la reprise',()=>{
  const {g,doc}=bootDocument134();Readout.install(g,doc);
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
  const history=[],citadel=g.citadel;
  Object.defineProperty(g,'citadel',{configurable:true,value:Object.freeze({...citadel,snapshot:()=>({...citadel.snapshot(),history})})});
  g.siegeReadout.render();
  history.push({wave:1,seconds:61,outcome:'secured',partial:false,metrics:{kills:23,unitsLost:0,buildingsLost:2,shots:40,rescued:0,escortLosses:0,ignitions:0,extinguished:0}});
  g.phase='aftermath';g.siegeReadout.render();g.siegeReadout.render();
  const bilans=notes.filter(text=>text.startsWith('Bilan de la vague 1'));
  assert.equal(bilans.length,1);assert.equal(bilans[0],'Bilan de la vague 1 : 23 éliminés, aucune perte, 2 structures perdues.');
  assert.equal(doc.getElementById('siegeReadoutNightTitle').textContent,'Vague 1 · sécurisée');
  assert.equal(doc.getElementById('siegeReadoutNight').querySelectorAll('dd').length,5);
  assert.equal(g.restoreSave(g.serialize()),true);g.phase='calm';g.siegeReadout.render();g.phase='aftermath';g.siegeReadout.render();
  assert.equal(notes.filter(text=>text.startsWith('Bilan de la vague 1')).length,1,'une reprise ne répète pas le bilan');
});
