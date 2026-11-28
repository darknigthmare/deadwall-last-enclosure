import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';
import Coop from '../src/coop.js';
import Session217 from '../src/coop-session217.js';
const {LIMITS,normalizeState,normalizeSpace,spaceKey,parseMessage,coordinate,label}=Coop;
// Protocole 217 (specs/cooperation, tranche C2) : une salle par code, un hôte et trois invités au plus.
// Le relais reste sans autorité : il range les sockets, vérifie la forme des messages et ne route que
// hôte → invité (welcome, refused, frame, closed) et invité → hôte (hello, intent). Il ne lit jamais
// une sauvegarde, une ressource ni un dégât, et le protocole de présence 200 reste inchangé.
const P217 = Session217.PROTOCOL, R217 = Session217.RULES, RELAY217 = globalThis.DeadwallCore.CoopPlay217Rules.relay;
const CODE217 = new RegExp('^[A-Z0-9]{' + R217.codeChars[0] + ',' + R217.codeChars[1] + '}$');
const TO_GUEST217 = new Set(['welcome', 'refused', 'frame', 'closed']);
// C8 : un `hello` peut porter le jeton de reprise reçu dans un `welcome` ; le relais le transmet sans le lire.
const record217 = v => !!v && typeof v === 'object' && !Array.isArray(v);
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function createCoopRelay({ port = 4290, host, joinTimeoutMs = 10000 } = {}) {
  if (!Number.isSafeInteger(joinTimeoutMs) || joinTimeoutMs < 1 || joinTimeoutMs > 30000)
    throw new RangeError('joinTimeoutMs doit être un entier entre 1 et 30000.');
  const relay = new WebSocketServer({ port, maxPayload: LIMITS.messageChars * 4, ...(host ? { host } : {}) });
  const clients = new Map();
  const rooms217 = new Map();
  const send = (socket, message) => {
    if (socket.readyState !== 1) return;
    if (socket.bufferedAmount > LIMITS.bufferedBytes) { socket.terminate(); return; }
    try { socket.send(JSON.stringify(message), error => { if (error) socket.terminate(); }); }
    catch { socket.terminate(); }
  };
  const broadcast = (room, key, message, skip) => {
    for (const [socket, client] of clients) {
      if (socket !== skip && client.room === room && client.spaceKey === key) send(socket, message);
    }
  };

  relay.on('connection', socket => {
    socket.on('error', () => {});
    if (clients.size >= LIMITS.relayClients) { socket.close(1013, 'Relais complet'); return; }
    const id = randomUUID();
    clients.set(socket, { id, room: null, spaceKey:null, space:null, name: 'Survivant', tokens: LIMITS.burst, sampledAt: performance.now(), perSecond: LIMITS.perSecond, burst: LIMITS.burst, role217: null, code217: null, peer217: 0, seat217: null });
    // Admission has a fixed deadline. Invalid messages must not keep a global
    // slot alive, and terminate avoids an additional unbounded close handshake.
    const joinDeadline = setTimeout(() => {
      const waiting = clients.get(socket);
      if (!waiting?.room && !waiting?.role217) socket.terminate();
    }, joinTimeoutMs);
    joinDeadline.unref();
    socket.on('message', (data, isBinary) => {
      const client = clients.get(socket); if (!client || socket.readyState !== 1) return;
      const now = performance.now();
      client.tokens = Math.min(client.burst, client.tokens + Math.max(0, now-client.sampledAt)*client.perSecond/1000);client.sampledAt=now;
      if (client.tokens < 1) { socket.close(1008, 'Cadence de messages excessive'); return; }
      client.tokens--;
      if (isBinary) return;
      const text = String(data);
      // Seul un hôte 217 envoie des images plus longues qu'un message de présence (borne en octets).
      const message = text.length <= LIMITS.messageChars ? parseMessage(text) : client.role217 === 'host' && Buffer.byteLength(text) <= RELAY217.hostChars + 512 ? parse217(text) : null;
      if (!message) return;
      if (message.protocol === P217) { if (!client.room) handle217(socket, client, message, joinDeadline); return; }
      if (client.role217) return;
      if (message.type === 'join' && typeof message.room === 'string' && /^[A-Za-z0-9_-]{2,24}$/.test(message.room)) {
        const scoped=Object.hasOwn(message,'space'),space=scoped?normalizeSpace(message.space):null;
        if(scoped&&(!space||message.protocol!==200))return;
        const key=spaceKey(space);
        if (client.room && (client.room !== message.room||client.spaceKey!==key)) {
          broadcast(client.room, client.spaceKey, { type: 'leave', id: client.id }, socket);
        }
        clearTimeout(joinDeadline);
        client.room = message.room;client.spaceKey=key;client.space=space;
        client.name = label(message.name, 'Survivant');
        send(socket, { type: 'joined', id, ...(space?{protocol:200,space}: {}) });
        return;
      }
      if (!client.room || message.room !== client.room) return;
      if(client.space?spaceKey(message.space)!==client.spaceKey:Object.hasOwn(message,'space'))return;
      const namespace=client.space?{space:client.space}:{};
      if (message.type === 'state') {
        const state=normalizeState(message.state);
        if (state&&(!client.space||state.active===client.space.region&&state.z===client.space.z)) broadcast(client.room, client.spaceKey, { type: 'peer', id: client.id, name: client.name, state, ...namespace }, socket);
      }
      if (message.type === 'ping' && coordinate(message.x) && coordinate(message.y)&&(!client.space||client.space.region)) {
        broadcast(client.room, client.spaceKey, { type: 'ping', id: client.id, name: client.name, x: message.x, y: message.y, ...namespace }, socket);
      }
    });
    socket.on('close', () => {
      clearTimeout(joinDeadline);
      const client = clients.get(socket);
      if (client?.role217) leave217(socket, client);
      if (client?.room) broadcast(client.room, client.spaceKey, { type: 'leave', id: client.id }, socket);
      clients.delete(socket);
    });
  });
  function parse217(text) { try { const m = JSON.parse(text); return record217(m) ? m : null; } catch { return null; } }
  function detach217(client) { client.role217 = null; client.code217 = null; client.peer217 = 0; client.seat217 = null; client.perSecond = LIMITS.perSecond; client.burst = LIMITS.burst; client.tokens = Math.min(client.tokens, client.burst); }
  function closeRoom217(code, socket) {
    const room = rooms217.get(code); if (!room || room.host !== socket) return;
    rooms217.delete(code);
    for (const [, guest] of room.peers) { const c = clients.get(guest); if (c) detach217(c); send(guest, { type: 'closed', protocol: P217, tick: 0 }); }
    room.peers.clear();
  }
  function leave217(socket, client) {
    if (client.role217 === 'host') closeRoom217(client.code217, socket);
    else if (client.role217 === 'guest') {
      const room = rooms217.get(client.code217);
      if (room && room.peers.get(client.peer217) === socket) { room.peers.delete(client.peer217); send(room.host, { type: 'gone', protocol: P217, peer: client.peer217 }); }
    }
    detach217(client);
  }
  function handle217(socket, client, message, deadline) {
    if (message.type === 'host') {
      if (client.role217 || Object.keys(message).length !== 3 || typeof message.code !== 'string' || !CODE217.test(message.code)) { send(socket, { type: 'refused', protocol: P217, reason: 'invalid' }); return; }
      if (rooms217.has(message.code)) { send(socket, { type: 'refused', protocol: P217, reason: 'taken' }); return; }
      clearTimeout(deadline);
      rooms217.set(message.code, { host: socket, peers: new Map(), next: 0 });
      Object.assign(client, { role217: 'host', code217: message.code, perSecond: RELAY217.hostPerSecond, burst: RELAY217.hostBurst });
      send(socket, { type: 'hosting', protocol: P217, code: message.code });
      return;
    }
    if (message.type === 'hello') {
      if (client.role217) return;
      const hello = Session217.normalizeHello(message);
      if (!hello) { send(socket, { type: 'refused', protocol: P217, reason: 'invalid' }); return; }
      const room = rooms217.get(hello.code);
      if (!room) { send(socket, { type: 'refused', protocol: P217, reason: 'absent' }); return; }
      if (room.peers.size >= RELAY217.guestsPerRoom) { send(socket, { type: 'refused', protocol: P217, reason: 'full' }); return; }
      clearTimeout(deadline);
      const peer = ++room.next; room.peers.set(peer, socket);
      Object.assign(client, { role217: 'guest', code217: hello.code, peer217: peer, seat217: hello.role });
      send(room.host, { type: 'relay', protocol: P217, peer, message: { type: 'hello', protocol: P217, code: hello.code, name: hello.name, role: hello.role, ...(hello.resume ? { resume: hello.resume } : {}) } });
      return;
    }
    const room = rooms217.get(client.code217);
    if (!room) return;
    if (client.role217 === 'guest' && message.type === 'intent' && room.peers.get(client.peer217) === socket) {
      // Une intention n'arrive à l'hôte que réécrite champ par champ, dans le rôle annoncé à l'entrée.
      const intent = Session217.normalizeIntent(message, client.seat217);
      if (intent) send(room.host, { type: 'relay', protocol: P217, peer: client.peer217, message: { type: 'intent', protocol: P217, seq: intent.seq, kind: intent.kind, data: intent.data } });
      return;
    }
    if (client.role217 !== 'host' || room.host !== socket) return;
    if (message.type === 'unhost') { closeRoom217(client.code217, socket); detach217(client); socket.close(1000, 'Cité fermée'); return; }
    const target = Number.isSafeInteger(message.peer) ? room.peers.get(message.peer) : null;
    if (!target) return;
    if (message.type === 'drop') { room.peers.delete(message.peer); const c = clients.get(target); if (c) detach217(c); return; }
    if (message.type !== 'send' || !record217(message.message) || message.message.protocol !== P217 || !TO_GUEST217.has(message.message.type)) return;
    if (message.message.type === 'frame') {
      // Budget d'images propre à chaque invité : une image en trop est perdue, jamais mise en file.
      const c = clients.get(target), now = performance.now();
      c.frames217 = Math.min(RELAY217.framesPerSecond, (c.frames217 ?? RELAY217.framesPerSecond) + Math.max(0, now - (c.frameAt217 ?? now)) * RELAY217.framesPerSecond / 1000); c.frameAt217 = now;
      if (c.frames217 < 1) return; c.frames217--;
    }
    send(target, message.message);
    if (message.message.type === 'closed') { room.peers.delete(message.peer); const c = clients.get(target); if (c) detach217(c); }
  }
  return relay;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT || 4290);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT doit être un entier entre 0 et 65535.');
  const relay = createCoopRelay({ port });
  relay.on('listening', () => console.log('DEADWALL coop relay ws://0.0.0.0:' + relay.address().port));
}
