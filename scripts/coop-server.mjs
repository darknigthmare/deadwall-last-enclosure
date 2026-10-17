import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';
import Coop from '../src/coop.js';
const {LIMITS,normalizeState,parseMessage,coordinate,label}=Coop;
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function createCoopRelay({ port = 4290, host, joinTimeoutMs = 10000 } = {}) {
  if (!Number.isSafeInteger(joinTimeoutMs) || joinTimeoutMs < 1 || joinTimeoutMs > 30000)
    throw new RangeError('joinTimeoutMs doit être un entier entre 1 et 30000.');
  const relay = new WebSocketServer({ port, maxPayload: LIMITS.messageChars * 4, ...(host ? { host } : {}) });
  const clients = new Map();
  const send = (socket, message) => {
    if (socket.readyState !== 1) return;
    if (socket.bufferedAmount > LIMITS.bufferedBytes) { socket.terminate(); return; }
    try { socket.send(JSON.stringify(message), error => { if (error) socket.terminate(); }); }
    catch { socket.terminate(); }
  };
  const broadcast = (room, message, skip) => {
    for (const [socket, client] of clients) {
      if (socket !== skip && client.room === room) send(socket, message);
    }
  };

  relay.on('connection', socket => {
    socket.on('error', () => {});
    if (clients.size >= LIMITS.relayClients) { socket.close(1013, 'Relais complet'); return; }
    const id = randomUUID();
    clients.set(socket, { id, room: null, name: 'Survivant', tokens: LIMITS.burst, sampledAt: performance.now() });
    // Admission has a fixed deadline. Invalid messages must not keep a global
    // slot alive, and terminate avoids an additional unbounded close handshake.
    const joinDeadline = setTimeout(() => {
      if (!clients.get(socket)?.room) socket.terminate();
    }, joinTimeoutMs);
    joinDeadline.unref();
    socket.on('message', (data, isBinary) => {
      const client = clients.get(socket); if (!client || socket.readyState !== 1) return;
      const now = performance.now();
      client.tokens = Math.min(LIMITS.burst, client.tokens + Math.max(0, now-client.sampledAt)*LIMITS.perSecond/1000);client.sampledAt=now;
      if (client.tokens < 1) { socket.close(1008, 'Cadence de messages excessive'); return; }
      client.tokens--;
      if (isBinary) return;
      const message = parseMessage(String(data)); if (!message) return;
      if (message.type === 'join' && typeof message.room === 'string' && /^[A-Za-z0-9_-]{2,24}$/.test(message.room)) {
        if (client.room && client.room !== message.room) {
          broadcast(client.room, { type: 'leave', id: client.id }, socket);
        }
        clearTimeout(joinDeadline);
        client.room = message.room;
        client.name = label(message.name, 'Survivant');
        send(socket, { type: 'joined', id });
        return;
      }
      if (!client.room || message.room !== client.room) return;
      if (message.type === 'state') {
        const state=normalizeState(message.state);
        if (state) broadcast(client.room, { type: 'peer', id: client.id, name: client.name, state }, socket);
      }
      if (message.type === 'ping' && coordinate(message.x) && coordinate(message.y)) {
        broadcast(client.room, { type: 'ping', id: client.id, name: client.name, x: message.x, y: message.y }, socket);
      }
    });
    socket.on('close', () => {
      clearTimeout(joinDeadline);
      const client = clients.get(socket);
      if (client?.room) broadcast(client.room, { type: 'leave', id: client.id }, socket);
      clients.delete(socket);
    });
  });
  return relay;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT || 4290);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT doit être un entier entre 0 et 65535.');
  const relay = createCoopRelay({ port });
  relay.on('listening', () => console.log('DEADWALL coop relay ws://0.0.0.0:' + relay.address().port));
}
