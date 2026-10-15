'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/codex-coverage167.js'),P=require('../src/codex-plan165.js');
function element(tag){return {tagName:tag.toUpperCase(),textContent:'',dataset:{},children:[],appendChild(n){this.children.push(n);return n;},replaceChildren(...nodes){this.children=nodes;}};}
const doc={createElement:element};
const walk=n=>[n,...n.children.flatMap(walk)];
const content=n=>walk(n).map(n=>n.textContent).join(' ');
const axes=n=>walk(n).filter(n=>n.tagName==='DT').length;
test('167 source-only rendering: source totals never masquerade as an inspected model',()=>{
 const report=C.source('DW-0001'),before=JSON.stringify(report),host=element('div');
 assert.ok(report.totals);assert.equal(report.issues,undefined);
 assert.strictEqual(C.render(doc,host,report),host);assert.equal(axes(host),10);
 assert.equal(host.dataset.scope,'source-not-live-world');assert.match(content(host),/Non inspecté/);
 assert.doesNotMatch(content(host),/undefined|NaN|Modèle inspecté|meubles sous le minimum source/);
 assert.equal(JSON.stringify(report),before);const first=JSON.stringify(host);C.render(doc,host,report);assert.equal(JSON.stringify(host),first,'render replaces instead of appending duplicate axes');
});
test('167 inspected and unsupported render states preserve their separate evidence and correct model counts',()=>{
 const preview=P.inspect('DW-0001',42),report=C.compare(preview),host=element('div');
 C.render(doc,host,report);assert.equal(axes(host),10);assert.equal(host.dataset.scope,'isolated-recipe-not-live-world');
 assert.ok(content(host).includes('Modèle inspecté · '+preview.plan.rooms.length));
 assert.match(content(host),/meubles sous le minimum source/);assert.doesNotMatch(content(host),/undefined|NaN/);
 const unsupported=C.compare(P.inspect('DW-0300',42));C.render(doc,host,unsupported);
 assert.equal(axes(host),10);assert.equal(host.dataset.scope,'unsupported');assert.match(content(host),/Aucun plan de substitution/);assert.doesNotMatch(content(host),/Modèle inspecté|undefined|NaN/);
});
test('167 malformed model rendering is rejected before mutating existing DOM',()=>{
 const host=element('div');host.textContent='previous';host.appendChild(element('span'));const before=JSON.stringify(host);
 assert.throws(()=>C.render(doc,host,{source:C.source('DW-0001'),scope:'isolated-recipe-not-live-world',totals:{}}),/incomplet/);
 assert.equal(JSON.stringify(host),before);assert.throws(()=>C.render(doc,host,null),/invalide/);
});
