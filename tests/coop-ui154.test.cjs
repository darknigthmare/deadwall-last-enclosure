'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

function fixture() {
  const env = bootDocument134();
  env.g.startNew('standard', '17117');
  env.g.campaignIntro132.skip();
  env.g.worldEvolutionUI.open('coop');
  return env;
}

test('coop UI : adresse refusée annoncée sans effacer les champs ni déplacer le focus', () => {
  const { g, doc } = fixture();
  const address = doc.getElementById('coopServer'), room = doc.getElementById('coopRoom'), name = doc.getElementById('coopName');
  address.value = 'invalide'; room.value = 'audit'; name.value = 'Éclaireuse'; name.focus();
  doc.getElementById('coopConnect').onclick();
  const status = doc.getElementById('coopStatus');
  assert.match(status.textContent, /invalide|indisponible/);
  assert.equal(status.getAttribute('role'), 'status');
  assert.equal(status.getAttribute('aria-live'), 'polite');
  assert.equal(doc.getElementById('coopServer'), address);
  assert.equal(address.value, 'invalide');
  assert.equal(name.value, 'Éclaireuse');
  assert.equal(doc.activeElement, name);
  assert.equal(doc.getElementById('coopPing').disabled, true);
  const elapsed = g.elapsed;
  g.worldEvolutionUI.refresh(true);
  assert.equal(g.elapsed, elapsed);
  assert.equal(doc.activeElement, name);
});

test('coop UI : connexion et échec asynchrones actualisent le statut en conservant les vrais contrôles', t => {
  const previousSocket = globalThis.WebSocket;
  class Socket {
    constructor() { this.readyState = 0; this.listeners = new Map(); Socket.current = this; }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    send() {}
    close() { this.readyState = 3; }
    emit(type) { if (type === 'open') this.readyState = 1; if (type === 'close') this.readyState = 3; this.listeners.get(type)?.({}); }
  }
  globalThis.WebSocket = Socket;
  t.after(() => { if (previousSocket === undefined) delete globalThis.WebSocket; else globalThis.WebSocket = previousSocket; });
  const { g, doc } = fixture();
  const address = doc.getElementById('coopServer'), room = doc.getElementById('coopRoom'), connect = doc.getElementById('coopConnect');
  address.value = 'ws://127.0.0.1:4290'; room.value = 'audit'; connect.focus(); connect.onclick();
  assert.match(doc.getElementById('coopStatus').textContent, /Connexion/);
  assert.equal(doc.getElementById('coopDisconnect').disabled, false, 'une connexion en attente peut être annulée');
  Socket.current.emit('open');
  g.worldEvolutionUI.refresh(true);
  assert.match(doc.getElementById('coopStatus').textContent, /connecté.*Salle audit.*0 présence/);
  assert.equal(doc.getElementById('coopPing').disabled, true, 'D17 ne transmet pas un signal régional');
  assert.match(doc.getElementById('coopPing').title, /Sortez dans la région/);
  Socket.current.emit('error'); Socket.current.emit('close');
  g.worldEvolutionUI.refresh(true);
  assert.match(doc.getElementById('coopStatus').textContent, /inaccessible/);
  assert.equal(doc.getElementById('coopDisconnect').disabled, true);
  assert.equal(doc.getElementById('coopServer'), address);
  assert.equal(doc.getElementById('coopConnect'), connect);
  assert.equal(doc.activeElement, connect);
});
