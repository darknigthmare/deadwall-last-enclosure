'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { WebSocket } = require('ws');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function relayFixture(t) {
  const { createCoopRelay } = await import('../scripts/coop-server.mjs');
  const relay = createCoopRelay({ port: 0, host: '127.0.0.1' });
  await once(relay, 'listening');
  const sockets = [];
  t.after(async () => {
    for (const socket of sockets) socket.terminate();
    await new Promise(resolve => relay.close(resolve));
  });
  async function connect() {
    const socket = new WebSocket('ws://127.0.0.1:' + relay.address().port);
    sockets.push(socket);
    await once(socket, 'open');
    socket.messages = [];
    socket.on('message', data => socket.messages.push(JSON.parse(String(data))));
    return socket;
  }
  return { connect };
}

function nextMessage(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off('message', read); reject(new Error('Réponse coop absente.')); }, 2000);
    function read(data) {
      const message = JSON.parse(String(data));
      if (!predicate(message)) return;
      clearTimeout(timer);
      socket.off('message', read);
      resolve(message);
    }
    socket.on('message', read);
  });
}

async function join(socket, room, name = 'Audit') {
  const reply = nextMessage(socket, message => message.type === 'joined');
  socket.send(JSON.stringify({ type: 'join', room, name }));
  return reply;
}

test('coop relais : messages JSON sans objet ignorés, les vrais clients restent connectés', async t => {
  const { connect } = await relayFixture(t);
  const [first, second] = await Promise.all([connect(), connect()]);
  await join(first, 'audit');
  await join(second, 'audit');
  for (const data of ['null', '[]', '42', 'true', '"texte"', '{invalide']) second.send(data);
  const incoming = nextMessage(first, message => message.type === 'ping');
  second.send(JSON.stringify({ type: 'ping', room: 'audit', x: 10, y: 20 }));
  const ping = await incoming;
  assert.equal(ping.x, 10);
  assert.equal(ping.y, 20);
  assert.equal(first.readyState, WebSocket.OPEN);
  assert.equal(second.readyState, WebSocket.OPEN);
});

test('coop relais : changement de salon retire le pair précédent et isole les nouvelles positions', async t => {
  const { connect } = await relayFixture(t);
  const [first, second, third] = await Promise.all([connect(), connect(), connect()]);
  await join(first, 'ancien');
  const { id } = await join(second, 'ancien');
  await join(third, 'nouveau');
  const original = nextMessage(first, message => message.type === 'peer');
  second.send(JSON.stringify({ type: 'state', room: 'ancien', state: { active: true, x: 10, y: 20, z: 0, a: 0 } }));
  assert.equal((await original).id, id);
  const leaving = nextMessage(first, message => message.type === 'leave');
  assert.equal((await join(second, 'nouveau')).id, id);
  assert.equal((await leaving).id, id);
  const transferred = nextMessage(third, message => message.type === 'peer');
  second.send(JSON.stringify({ type: 'state', room: 'ancien', state: { x: 999, y: 999 } }));
  second.send(JSON.stringify({ type: 'state', room: 'nouveau', state: { active: true, x: 30, y: 40, z: 1, a: 0 } }));
  assert.equal((await transferred).state.x, 30);
  assert.equal(first.messages.filter(message => message.type === 'peer').length, 1);
  assert.equal(third.messages.filter(message => message.type === 'peer').length, 1);
});

test('coop relais : une coordonnée nulle ou booléenne ne devient jamais une position numérique', async t => {
  const { connect } = await relayFixture(t);
  const [first, second] = await Promise.all([connect(), connect()]);
  await join(first, 'audit');
  await join(second, 'audit');
  for (const x of [null, false, '10', {}, []]) {
    second.send(JSON.stringify({ type: 'ping', room: 'audit', x, y: 0 }));
    second.send(JSON.stringify({ type: 'state', room: 'audit', state: { x, y: 0 } }));
  }
  const accepted = nextMessage(first, message => message.type === 'ping');
  second.send(JSON.stringify({ type: 'ping', room: 'audit', x: -10, y: 20 }));
  await accepted;
  assert.equal(first.messages.filter(message => message.type === 'peer').length, 0);
  assert.deepEqual(first.messages.filter(message => message.type === 'ping').map(message => [message.x, message.y]), [[-10, 20]]);
});

function clientFixture() {
  class Socket {
    static instances = [];
    constructor(url) {
      if (url === 'ws://') throw new Error('URL invalide');
      this.readyState = 0;
      this.sent = [];
      this.listeners = new Map();
      Socket.instances.push(this);
    }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    send(data) { this.sent.push(JSON.parse(data)); }
    close() { this.readyState = 2; }
    emit(type, data) { if (type === 'open') this.readyState = 1; if (type === 'close') this.readyState = 3; this.listeners.get(type)?.({ data }); }
  }
  const context = vm.createContext({ WebSocket: Socket, performance: { now: () => 1000 } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/coop.js'), 'utf8'), context);
  const game = { state: 'playing', paused: false, update() {}, frontier: { active: () => true, overview: () => ({ active: true, x: 10, y: 20, z: 0, a: 0 }) } };
  const api = context.DeadwallCoop.install(game);
  return { api, game, Socket };
}

test('coop client : les événements tardifs de l’ancien socket ne détruisent pas la reconnexion', () => {
  const { api, game, Socket } = clientFixture();
  assert.equal(api.connect('ws://first', 'ancien', 'Premier'), true);
  const first = Socket.instances[0];
  assert.equal(api.connect('ws://second', 'nouveau', 'Second'), true);
  const second = Socket.instances[1];
  first.emit('open');
  first.emit('message', JSON.stringify({ type: 'peer', id: 'ancien', state: { x: 1, y: 2 } }));
  second.emit('open');
  first.emit('close');
  assert.equal(first.sent.length, 0);
  assert.equal(api.overview().connected, true);
  assert.equal(api.overview().room, 'nouveau');
  assert.equal(api.overview().peers.length, 0);
  assert.equal(second.sent[0].type, 'join');
  assert.equal(second.sent[0].room, 'nouveau');
  game.update(.1);
  assert.equal(second.sent[1].type, 'state');
  assert.equal(api.ping(), true);
  assert.equal(second.sent[2].type, 'ping');
});

test('coop client : JSON invalide ignoré, fermeture efface les repères et adresse invalide reste contrôlée', () => {
  const { api, Socket } = clientFixture();
  api.connect('ws://first', 'audit', 'Audit');
  const first = Socket.instances[0];
  first.emit('open');
  for (const data of ['null', '[]', '42', '{invalide']) assert.doesNotThrow(() => first.emit('message', data));
  first.emit('message', JSON.stringify({ type: 'peer', id: 'pair', state: { x: null, y: 0 } }));
  first.emit('message', JSON.stringify({ type: 'ping', x: false, y: 0 }));
  assert.equal(api.overview().peers.length, 0);
  assert.equal(api.overview().pings.length, 0);
  first.emit('message', JSON.stringify({ type: 'peer', id: 'pair', state: { x: 10, y: 20 } }));
  first.emit('message', JSON.stringify({ type: 'ping', x: 10, y: 20 }));
  assert.equal(api.overview().peers.length, 1);
  assert.equal(api.overview().pings.length, 1);
  first.emit('close');
  assert.equal(api.overview().connected, false);
  assert.equal(api.overview().peers.length, 0);
  assert.equal(api.overview().pings.length, 0);
  assert.equal(api.connect('ws://', 'audit', 'Audit'), false);
  assert.match(api.overview().notice, /invalide/);
});
