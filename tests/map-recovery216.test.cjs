'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Recovery=require('../src/map-recovery216.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
// Graines relevées par la CI : en contenu actuel, le décor métrique n'y trouve aucune parcelle libre.
const UNFIT=['3033422227','139741324','4075956896'];
const current=(g,seed)=>g.startNew('standard',seed,'classic','classic',true);

test('216 le défaut d’origine est réel : ces graines interrompent la création de campagne',()=>{
  // Témoin : le même document, chargé sans le module de reprise.
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),read=fs.readFileSync;
  fs.readFileSync=(file,...rest)=>{const text=read(file,...rest);return String(file).endsWith('index.html')&&typeof text==='string'?text.replace('  <script src="src/map-recovery216.js"></script>\n',''):text;};
  let g;try{g=bootDocument134().g;}finally{fs.readFileSync=read;}
  assert.ok(html.includes('<script src="src/map-recovery216.js"></script>'));assert.equal(g.mapRecovery216,undefined,'module absent de ce témoin');
  assert.throws(()=>current(g,UNFIT[0]),/Décor métrique sans parcelle libre/);
});

test('216 une carte impraticable est remplacée par une autre, annoncée au joueur',()=>{
  const {g}=bootDocument134();assert.ok(g.mapRecovery216,'installé dès le chargement');assert.equal(Recovery.install(g),false);
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
  const draws=[];g.freshMapSeed=()=>{const seed=17117+draws.length;draws.push(seed);return seed;};
  for(const seed of UNFIT){
    draws.length=0;notes.length=0;
    assert.notEqual(current(g,seed),false);
    assert.equal(g.state,'playing');assert.equal(g.world.seed,17117);assert.deepEqual(draws,[17117]);
    assert.deepEqual(g.mapRecovery216.last(),{refused:Number(seed),seed:17117,redraws:1});
    assert.equal(notes.filter(text=>text.startsWith('La carte '+seed+' ne pouvait pas accueillir D-17')).length,1);
    assert.doesNotThrow(()=>g.restoreSave(JSON.parse(JSON.stringify(g.serialize()))),'la campagne obtenue se sauvegarde et se reprend');
  }
});

test('216 une carte qui fonctionne donne exactement le même monde, avec ou sans le module',()=>{
  const fingerprint=g=>JSON.stringify({seed:g.world.seed,nodes:g.world.nodes.map(n=>[n.id,n.type,Math.round(n.x*100),Math.round(n.y*100),n.amount])});
  const read=fs.readFileSync;fs.readFileSync=(file,...rest)=>{const text=read(file,...rest);return String(file).endsWith('index.html')&&typeof text==='string'?text.replace('  <script src="src/map-recovery216.js"></script>\n',''):text;};
  let plain;try{plain=bootDocument134().g;}finally{fs.readFileSync=read;}
  assert.equal(plain.mapRecovery216,undefined);current(plain,'17117');const before=fingerprint(plain);
  const {g}=bootDocument134();assert.ok(g.mapRecovery216);let drawn=0;const draw=g.freshMapSeed.bind(g);g.freshMapSeed=()=>{drawn++;return draw();};
  current(g,'17117');
  assert.equal(fingerprint(g),before);assert.equal(drawn,0,'aucun tirage de remplacement');assert.equal(g.mapRecovery216.last(),null);
});

test('216 les autres erreurs, les refus et les recettes de carte rejouées ne sont pas maquillés',()=>{
  assert.equal(Recovery.unfit(Error('Décor métrique sans parcelle libre : 443 · seed 1')),true);
  assert.equal(Recovery.unfit(Error('Autre défaut')),false);assert.equal(Recovery.unfit('Décor métrique sans parcelle libre'),false);
  const calls=[],fake={world:{seed:5},freshMapSeed:()=>99,startNew(...args){calls.push(args);if(args[1]==='boom')throw Error('Autre défaut');if(args[1]==='non')return false;throw Error('Décor métrique sans parcelle libre : 1 · seed 5');}};
  Recovery.install(fake);
  assert.throws(()=>fake.startNew('standard','boom'),/Autre défaut/);assert.equal(calls.length,1);
  assert.equal(fake.startNew('standard','non'),false);
  calls.length=0;assert.throws(()=>fake.startNew('standard','5','classic','classic',true,{recette:1}),/Décor métrique/);assert.equal(calls.length,1,'une recette rejouée garde sa graine');
  calls.length=0;assert.throws(()=>fake.startNew('standard','5'),/Décor métrique/);assert.equal(calls.length,Recovery.MAX_REDRAWS+1,'tirages bornés');
  const source=fs.readFileSync(path.join(__dirname,'../src/map-recovery216.js'),'utf8');
  for(const forbidden of ['Math.random','resources','localStorage','.nodes'])assert.equal(source.includes(forbidden),false,forbidden);
});
