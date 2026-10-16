'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {campaignIdentity}=require('../src/presentation132.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const text=n=>[...n.querySelectorAll('p')].map(p=>p.textContent).join(' ');
const material=g=>{const s=g.serialize();delete s.timestamp;return s;};
function fixture(){const env=bootDocument134(),{g}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.setBuildCollapsed(true);g.updateUI();return env;}
test('184 identity distinguishes historical defaults, generation and detail revisions without mutation',()=>{const old=Object.freeze({generation:7}),current=Object.freeze({generation:10,detailVersion:13,ecologyVersion:1,hydrologyVersion:1});assert.match(campaignIdentity(0,old).summary,/Graine 0.*G7.*Détails 0.*Eau 0/);assert.match(campaignIdentity(0,old).advice,/historique/);assert.match(campaignIdentity(17117,current).summary,/G10.*Détails 13.*Écologie 1.*Eau 1/);assert.match(campaignIdentity(17117,current).advice,/contient le réseau/);assert.equal(campaignIdentity(undefined,current),null);assert.equal(campaignIdentity(1,null),null);});
test('184 pause identity comes from the live campaign and repeated reading preserves all saved owners',()=>{const {g,doc}=fixture(),d=doc.getElementById('campaignIdentity184');assert.ok(d);g.togglePause(true);const before=material(g);d.open=true;for(let i=0;i<20;i++)g.updateUI();assert.equal(d.hidden,false);assert.equal(d.open,true);assert.match(text(d),/Graine 17117.*Région G8/);assert.match(text(d),/Eau 1/);assert.equal(doc.body.querySelectorAll('#campaignIdentity184').length,1);assert.deepEqual(material(g),before);g.returnToMenu();assert.equal(d.hidden,true);assert.equal(d.open,false);});
test('184 pause identity switches campaigns without changing historical geographic revisions',()=>{const {g,doc}=fixture();const save=g.serialize();save.frontier.ecologyVersion=0;save.frontier.hydrologyVersion=0;save.frontier.generation=7;save.frontier.detailVersion=0;assert.equal(g.restoreSave(save),true);g.togglePause(true);const before=material(g);g.updateUI();assert.match(text(doc.getElementById('campaignIdentity184')),/Région G7.*Eau 0/);assert.match(text(doc.getElementById('campaignIdentity184')),/historique/);assert.deepEqual(material(g),before);});
test('184 compact local actions participate in exclusive drawers without losing controls',()=>{const {g,doc}=fixture(),r=g.hud135.regions(),local=doc.getElementById('hud135LocalActions');g.width=844;g.height=390;g.isCompactViewport=()=>true;doc.getElementById('localActions14').classList.remove('hidden');g.hud135.refresh();const before=material(g);r.intel.open=true;r.intel.dispatch('toggle');local.open=true;local.dispatch('toggle');assert.equal(r.intel.open,false);assert.equal(local.open,true);r.tools.open=true;r.tools.dispatch('toggle');assert.equal(local.open,false);assert.equal(r.tools.open,true);assert.ok(local.contains(doc.getElementById('localManage14')));assert.deepEqual(material(g),before);});
test('184 compact local actions close for pause and restore once on resume',()=>{const {g,doc}=fixture(),r=g.hud135.regions(),local=doc.getElementById('hud135LocalActions');g.width=844;g.height=390;g.isCompactViewport=()=>true;doc.getElementById('localActions14').classList.remove('hidden');g.hud135.refresh();local.open=true;local.dispatch('toggle');g.togglePause(true);assert.equal(local.open,false);g.togglePause(false);assert.equal(local.open,true);assert.equal(r.intel.open,false);doc.getElementById('game').focus();assert.equal(g.onEscape(),true);assert.equal(local.open,false);assert.equal(g.paused,false);});

function compactActions(){const f=fixture(),{g,doc}=f;g.width=844;g.height=390;g.isCompactViewport=()=>true;const actions=doc.getElementById('localActions14'),local=doc.getElementById('hud135LocalActions');actions.classList.remove('hidden');actions.hidden=false;g.hud135.refresh();local.open=true;local.dispatch('toggle');return{...f,actions,local};}
for(const hide of ['class','property'])test('186 disappearing '+hide+' local actions close the drawer and Escape reaches pause',()=>{
 const {g,doc,actions,local}=compactActions();if(hide==='class')actions.classList.add('hidden');else actions.hidden=true;
 g.hud135.refresh();assert.equal(local.open,false);assert.ok(local.hidden||local.classList.contains('hidden'));
 doc.getElementById('game').focus();g.onEscape();assert.equal(g.paused,true,'one Escape pauses instead of consuming an invisible drawer');
});
test('186 a hidden drawer holding stale focus never steals Escape or restores its focus',()=>{
 const {g,doc,local}=compactActions(),summary=local.querySelector('summary');summary.focus();local.hidden=true;
 assert.equal(local.open,true,'exercise stale open state without a refresh first');g.onEscape();assert.equal(g.paused,true);assert.notEqual(doc.activeElement,summary);
});
test('186 pause restoration cannot reopen local actions which disappear during a modal',()=>{
 const {g,actions,local}=compactActions();g.togglePause(true);actions.classList.add('hidden');g.togglePause(false);
 assert.equal(local.open,false);assert.equal(g.paused,false);assert.equal(local.classList.contains('hidden'),true);
});
