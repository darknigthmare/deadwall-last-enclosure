'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),B=require('../src/battlefield.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const origin={x:2000,y:2000},actor=(x,y,extra={})=>({x,y,health:40,dead:false,...extra});
const snapshot=()=>B.inspect(origin,[actor(2000,1800),actor(2500,2000),actor(2500,2000,{dead:true})],[]);
function fixture(){const e=bootDocument134(),g=e.g;g.startNew('standard','54831');g.campaignIntro132.skip();return e;}
function stable(g){const s=g.serialize();delete s.timestamp;return s;}

test('assaut : sépare contacts vivants et arrivées connues, sans annoncer un front vide occupé',()=>{
 const s=B.assaultStatus(snapshot(),17,['north','south'],null,.4);
 assert.equal(s.present,2);assert.equal(s.incoming,17);assert.deepEqual(s.activeFronts.map(f=>[f.id,f.contacts]),[['north',1],['east',1]]);
 assert.deepEqual(s.nextFronts.map(f=>f.id),['north','south']);assert.equal(s.echelon,null);assert.equal(s.pauseSeconds,0);
 const text=B.assaultText(s);assert.match(text,/2 présents.*17 encore à venir/);assert.match(text,/Contacts : NORD 1 \/ EST 1/);assert.match(text,/Arrivées annoncées : NORD \/ SUD/);
 assert.doesNotMatch(text,/Contacts :.*SUD 1/);
});
test('assaut : une pause d’échelon reste un assaut avec contacts et prochains fronts exacts',()=>{
 const n=C.Dayworks.beginNight(10,10,['north','east','south','west']);
 for(let i=0;i<4;i++)C.Dayworks.emitted(n);
 const s=B.assaultStatus(snapshot(),6,n.fronts,n,5.2);
 assert.equal(s.echelon,2);assert.equal(s.pauseSeconds,6);assert.deepEqual(s.nextFronts.map(f=>f.id),['east']);
 assert.match(B.assaultText(s),/reprise des arrivées dans 6 s, assaut toujours actif/);
 C.Dayworks.emitted(n);assert.equal(B.assaultStatus(snapshot(),5,n.fronts,n,.3).pauseSeconds,0);
});
test('assaut : dernier échelon utilise les fronts finaux, puis aucune arrivée fictive',()=>{
 const n=C.Dayworks.beginNight(10,10,['north','east','south','west']);for(let i=0;i<7;i++)C.Dayworks.emitted(n);
 const s=B.assaultStatus(snapshot(),3,n.fronts,n,4);assert.equal(s.echelon,3);assert.deepEqual(s.nextFronts.map(f=>f.id),['south','west']);
 assert.equal(B.assaultStatus(snapshot(),3,n.fronts,n,-.01).pauseSeconds,0);
 for(let i=0;i<3;i++)C.Dayworks.emitted(n);const done=B.assaultStatus(snapshot(),0,n.fronts,n,5);
 assert.equal(done.present,2);assert.deepEqual(done.nextFronts,[]);assert.equal(done.pauseSeconds,0);assert.doesNotMatch(B.assaultText(done),/Arrivées annoncées|reprise/);
});
test('assaut : lire les comptes n’altère ni données de combat ni RNG',()=>{
 const snap=snapshot(),n=C.Dayworks.beginNight(4,10,['north','east']);for(let i=0;i<4;i++)C.Dayworks.emitted(n);
 const prior=JSON.stringify({snap,n}),random=Math.random;Math.random=()=>{throw Error('Lecture sans hasard');};
 try{for(let i=0;i<20;i++)B.assaultText(B.assaultStatus(snap,6,n.fronts,n,5));}finally{Math.random=random;}
 assert.equal(JSON.stringify({snap,n}),prior);
});
test('assaut HUD : le moteur normal garde sa pause et son budget, la reprise ne perd aucun contact',()=>{
 const {g}=fixture();g.wave=4;g.phase='assault';g.prepareWave();g.startAssault();
 const night=g.dayworks.snapshot().night,first=Math.ceil(night.total/3);let guard=0;
 while(g.dayworks.snapshot().night.emitted<first){g.spawnTimer=0;g.updateDirector(.04);assert.ok(++guard<1000);}
 const before=stable(g),count=g.zombies.filter(z=>!z.dead).length,pending=g.spawnQueue.length+C.spawnCount(g.pendingSpawns);
 g.battlefieldUI.refresh(true);g.updateUI();assert.match(g.ui.waveIntel.textContent,new RegExp(count+' présents.*'+pending+' encore à venir'));assert.match(g.ui.waveIntel.textContent,/reprise des arrivées dans \d+ s, assaut toujours actif/);
 assert.equal(g.phase,'assault');assert.deepEqual(stable(g),before,'Le HUD ne distribue pas les contacts ni ne change le timer');
 const budget=g.remainingAssault;assert.ok(g.save(false));assert.ok(g.load());g.battlefieldUI.refresh(true);g.updateUI();
 assert.equal(g.remainingAssault,budget);assert.match(g.ui.waveIntel.textContent,/reprise des arrivées dans \d+ s/);assert.equal(g.dayworks.snapshot().night.emitted,first);
 const retained=g.zombies.length;g.updateDirector(.04);assert.equal(g.zombies.length,retained,'La pause résiste au rechargement');
 g.updateDirector(g.spawnTimer+.01);assert.ok(g.zombies.length>retained);g.battlefieldUI.refresh(true);g.updateUI();assert.doesNotMatch(g.ui.waveIntel.textContent,/reprise des arrivées/);
});
test('assaut : le cache de Situation est isolé, borné et invalidé sur une nouvelle carte',()=>{
 const {g}=fixture();g.phase='assault';g.spawnZombie('walker');Object.assign(g.zombies.at(-1),{x:g.core().x,y:g.core().y-100});g.battlefieldUI.refresh(true);
 const read=g.battlefieldUI.snapshot();assert.equal(read.contacts,1);read.sectors[0].contacts=999;
 assert.equal(g.battlefieldUI.snapshot().sectors[0].contacts,1);g.startNew('standard','17117');g.campaignIntro132.skip();assert.equal(g.battlefieldUI.snapshot().contacts,0);
});
