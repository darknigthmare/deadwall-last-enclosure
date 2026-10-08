(function (root) {
  'use strict';
  function install(game) {
    if (game.coop) return game.coop;
    let socket = null, room = '', name = '', timer = 0, notice = '', pings = [];
    const peers = new Map();
    function disconnect() {
      const previous = socket;
      socket = null;
      if (previous) try { previous.close(); } catch {}
      peers.clear();
      pings = [];
      notice = 'Coop déconnectée.';
    }
    function connect(url, roomId, display) {
      disconnect();
      if (typeof WebSocket === 'undefined') { notice = 'Coop indisponible dans cet environnement.'; return false; }
      if (typeof url !== 'string' || !/^wss?:\/\//.test(url)) { notice = 'Adresse du relais coop invalide.'; return false; }
      if (typeof roomId !== 'string' || !/^[A-Za-z0-9_-]{2,24}$/.test(roomId)) {
        notice = 'Salle invalide : 2 à 24 lettres, chiffres, tirets ou traits de soulignement.';
        return false;
      }
      let connection;
      try { connection = new WebSocket(url); } catch {
        notice = 'Adresse du relais coop invalide.';
        return false;
      }
      socket = connection;
      room = roomId;
      name = String(display || 'Survivant').slice(0, 24);
      timer = 0;
      notice = 'Connexion au relais coop…';
      connection.addEventListener('open', () => {
        if (socket !== connection) return;
        connection.send(JSON.stringify({ type: 'join', room, name }));
        notice = 'Relais coop connecté.';
      });
      connection.addEventListener('message', event => {
        if (socket !== connection) return;
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        if (!message || typeof message !== 'object' || Array.isArray(message)) return;
        if (message.type === 'peer' && message.id && message.state && typeof message.state === 'object'
          && !Array.isArray(message.state) && Number.isFinite(message.state.x) && Number.isFinite(message.state.y)) {
          peers.set(message.id, { ...message.state, name: message.name || 'Allié', time: performance.now() });
        }
        if (message.type === 'leave') peers.delete(message.id);
        if (message.type === 'ping' && Number.isFinite(message.x) && Number.isFinite(message.y)) {
          pings.push({ x: message.x, y: message.y, name: message.name || 'Allié', left: 8 });
        }
      });
      connection.addEventListener('close', () => {
        // A previous connection can finish closing after its replacement opens.
        if (socket !== connection) return;
        socket = null;
        peers.clear();
        pings = [];
        if (notice !== 'Relais coop inaccessible.') notice = 'Relais coop fermé.';
      });
      connection.addEventListener('error', () => {
        if (socket === connection) notice = 'Relais coop inaccessible.';
      });
      return true;
    }
    function ping() {
      if (!socket || socket.readyState !== 1 || !game.frontier.active()) return false;
      const position = game.frontier.overview();
      socket.send(JSON.stringify({ type: 'ping', room, x: position.x, y: position.y }));
      return true;
    }
    function update(dt) {
      for (const ping of pings) ping.left -= dt;
      pings = pings.filter(ping => ping.left > 0);
      if (!socket || socket.readyState !== 1) return;
      timer -= dt;
      if (timer > 0) return;
      timer = .2;
      const position = game.frontier.overview();
      socket.send(JSON.stringify({ type: 'state', room, state: {
        active: position.active, x: position.x, y: position.y, z: position.z, a: position.a,
        posture: game.worldEvolution?.posture().key || 'stand'
      } }));
      for (const [id, peer] of peers) if (performance.now() - peer.time > 5000) peers.delete(id);
    }
    const api = { connect, disconnect, ping, update, overview: () => ({
      connected: socket?.readyState === 1, connecting: socket?.readyState === 0, room, name, notice,
      peers: [...peers.entries()].map(([id, peer]) => ({ id, ...peer })), pings: [...pings]
    }) };
    game.coop = Object.freeze(api);
    const previousUpdate = game.update.bind(game);
    game.update = dt => {
      const result = previousUpdate(dt);
      if (game.state === 'playing' && !game.paused) update(Math.min(.1, dt));
      return result;
    };
    return api;
  }
  root.DeadwallCoop = { install };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.DeadwallCoop;
})(globalThis);
