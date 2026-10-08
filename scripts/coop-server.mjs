import { WebSocketServer } from 'ws';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function createCoopRelay({ port = 4290, host } = {}) {
  const relay = new WebSocketServer({ port, ...(host ? { host } : {}) });
  const clients = new Map();
  const send = (socket, message) => {
    if (socket.readyState === 1) socket.send(JSON.stringify(message));
  };
  const broadcast = (room, message, skip) => {
    for (const [socket, client] of clients) {
      if (socket !== skip && client.room === room) send(socket, message);
    }
  };

  relay.on('connection', socket => {
    const id = Math.random().toString(36).slice(2, 10);
    clients.set(socket, { id, room: null, name: 'Survivant' });
    socket.on('message', data => {
      let message;
      try { message = JSON.parse(String(data)); } catch { return; }
      if (!message || typeof message !== 'object' || Array.isArray(message)) return;
      const client = clients.get(socket);
      if (!client) return;
      if (message.type === 'join' && typeof message.room === 'string' && /^[A-Za-z0-9_-]{2,24}$/.test(message.room)) {
        if (client.room && client.room !== message.room) {
          broadcast(client.room, { type: 'leave', id: client.id }, socket);
        }
        client.room = message.room;
        client.name = String(message.name || 'Survivant').slice(0, 24);
        send(socket, { type: 'joined', id });
        return;
      }
      if (!client.room || message.room !== client.room) return;
      if (message.type === 'state' && message.state && typeof message.state === 'object' && !Array.isArray(message.state)
        && Number.isFinite(message.state.x) && Number.isFinite(message.state.y)) {
        broadcast(client.room, { type: 'peer', id: client.id, name: client.name, state: message.state }, socket);
      }
      if (message.type === 'ping' && Number.isFinite(message.x) && Number.isFinite(message.y)) {
        broadcast(client.room, { type: 'ping', id: client.id, name: client.name, x: message.x, y: message.y }, socket);
      }
    });
    socket.on('error', () => {});
    socket.on('close', () => {
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
