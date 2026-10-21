(function (root) {
  'use strict';
  // Transport budgets, not simulation or save limits. Coop remains presence
  // and regional pings; no construction, inventory or combat is authoritative here.
  const LIMITS = Object.freeze({ messageChars: 8192, bufferedBytes: 65536, peers: 64, pings: 64, peerMs: 5000, pingMs: 8000, relayClients: 128, burst: 60, perSecond: 30, joinMs: 10000 });
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const coordinate = value => Number.isFinite(value) && Math.abs(value) <= 1e6;
  const label = (value, fallback) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24) || fallback : fallback;
  const peerId = value => typeof value === 'string' && /^[A-Za-z0-9:_-]{1,80}$/.test(value);
  // A presence namespace is not a shared world or an authentication claim.
  // Exact map revisions, scene, storey and interior must agree before exposure.
  function normalizeSpace(value) {
    const keys=['seed','generation','detail','ecology','hydrology','landscape','region','z','inside'];
    if(!record(value)||Object.keys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k)))return null;
    const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
    if(!integer(value.seed,0,0xffffffff)||!integer(value.generation,1,255)||!integer(value.detail,0,255)||!integer(value.ecology,0,255)||!integer(value.hydrology,0,255))return null;
    if(typeof value.landscape!=='string'||! /^[a-zA-Z0-9_-]{1,32}$/.test(value.landscape)||typeof value.region!=='boolean'||!coordinate(value.z))return null;
    if(value.inside!==null&&(typeof value.inside!=='string'||! /^[A-Za-z0-9:_-]{1,100}$/.test(value.inside)))return null;
    return Object.fromEntries(keys.map(k=>[k,value[k]]));
  }
  const spaceKey=value=>{const space=normalizeSpace(value);return space?JSON.stringify(space):null;};
  function normalizeState(value) {
    if (!record(value) || !coordinate(value.x) || !coordinate(value.y)) return null;
    if (value.active !== undefined && typeof value.active !== 'boolean') return null;
    if (value.z !== undefined && !coordinate(value.z) || value.a !== undefined && !coordinate(value.a)) return null;
    return { active: value.active === true, x: value.x, y: value.y, z: value.z ?? 0, a: value.a ?? 0,
      posture: ['stand', 'crouch', 'prone'].includes(value.posture) ? value.posture : 'stand' };
  }
  function parseMessage(text) {
    if (typeof text !== 'string' || text.length > LIMITS.messageChars) return null;
    try { const message = JSON.parse(text); return record(message) ? message : null; } catch { return null; }
  }
  function install(game) {
    if (game.coop) return game.coop;
    let socket = null, room = '', name = '', timer = 0, notice = '', pings = [];
    const peers = new Map();
    const scoped=typeof game.frontier?.position==='function';
    let joinedKey=undefined,verified=false;
    let admission=null,admissionTimer=null;
    function clearAdmission(){
      admission=null;
      if(admissionTimer!==null)root.clearTimeout?.(admissionTimer);
      admissionTimer=null;
    }
    function expireAdmission(time=performance.now()){
      const pending=admission;
      if(!pending||socket!==pending.connection||joinedKey!==pending.key||verified||time<pending.deadline)return false;
      disconnect();
      notice='Délai de confirmation de la carte dépassé : reconnectez-vous à un relais compatible.';
      return true;
    }
    function armAdmission(connection,key){
      clearAdmission();
      const pending={connection,key,deadline:performance.now()+LIMITS.joinMs};
      admission=pending;
      // Network admission follows wall time, even while gameplay is paused.
      // Legacy embedders without timers still expire on their next update/reply.
      if(typeof root.setTimeout==='function'){
        const check=()=>{
          if(admission!==pending)return;
          // Timer clocks can be rounded: an early callback must not leave a
          // paused game with an admission that will never be checked again.
          if(!expireAdmission()){
            admissionTimer=root.setTimeout(check,Math.max(1,Math.ceil(pending.deadline-performance.now())));
            admissionTimer?.unref?.();
          }
        };
        admissionTimer=root.setTimeout(check,LIMITS.joinMs);
        admissionTimer?.unref?.();
      }
    }
    function position(){
      const p=scoped?game.frontier.position():game.frontier.overview();
      if(!p||p.active||typeof game.vertical175?.pose!=='function')return p;
      // Regional coordinates stay parked while D-17's own stair controller moves
      // the commander. Presence must describe that current local surface instead.
      const deck=game.vertical175.pose();
      return{...p,x:game.player.x,y:game.player.y,a:game.player.facing,
        z:deck.z,inside:deck.site==null?null:'D17:'+deck.site};
    }
    function localSpace(){
      if(!scoped)return null; // Compatibility for legacy embedders, isolated by the relay.
      const p=position();if(!p)return null;
      return normalizeSpace({seed:game.world?.seed,generation:p.generation,detail:p.detailVersion??0,ecology:p.ecologyVersion??0,hydrology:p.hydrologyVersion??0,landscape:p.landscape189||'classic',region:p.active,z:p.z,inside:p.inside??null});
    }
    const matches=message=>!scoped?message.space===undefined:!!localSpace()&&spaceKey(message.space)===spaceKey(localSpace());
    function joinScope(connection){
      if(expireAdmission())return false;
      const space=localSpace();if(scoped&&!space){clearAdmission();joinedKey=undefined;verified=false;peers.clear();pings=[];notice='Carte indisponible : présence suspendue.';return false;}
      const key=spaceKey(space);if(joinedKey===key)return verified;
      clearAdmission();peers.clear();pings=[];verified=false;joinedKey=undefined;
      // A failed send must not leave the previous map looking already joined.
      if(!send(connection,{type:'join',room,name,...(scoped?{protocol:200,space}: {})}))return false;
      joinedKey=key;verified=!scoped;if(scoped)armAdmission(connection,key);notice=scoped?'Relais coop connecté ; vérification de la carte…':'Relais coop connecté.';
      return verified;
    }
    function disconnect() {
      clearAdmission();
      const previous = socket;
      socket = null;joinedKey=undefined;verified=false;
      if (previous) try { previous.close(); } catch {}
      peers.clear();
      pings = [];
      notice = 'Coop déconnectée.';
    }
    function send(connection, message) {
      if (socket !== connection || connection?.readyState !== 1) return false;
      // Position samples are replaceable: never accumulate obsolete movement
      // behind a blocked connection and never let a network error stop Game.update.
      if (connection.bufferedAmount > LIMITS.bufferedBytes) return false;
      try { connection.send(JSON.stringify(message)); return true; }
      catch {
        if (socket === connection) { disconnect(); notice = 'Relais coop inaccessible.'; }
        return false;
      }
    }
    function prune(time) {
      for (const [id, peer] of peers) if (time - peer.time >= LIMITS.peerMs) peers.delete(id);
      pings = pings.filter(ping => time < ping.expires);
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
      name = label(display, 'Survivant');
      timer = 0;
      notice = 'Connexion au relais coop…';
      connection.addEventListener('open', () => {
        if (socket !== connection) return;
        joinScope(connection);
      });
      connection.addEventListener('message', event => {
        if (socket !== connection) return;
        const message = parseMessage(event.data);
        if (!message) return;
        const time = performance.now(); if(expireAdmission(time))return;prune(time);
        if(message.type==='joined'&&scoped){
          if(message.protocol!==200){verified=false;notice='Relais ancien : mettez à jour le relais pour vérifier les cartes.';return;}
          if(matches(message)&&spaceKey(message.space)===joinedKey){clearAdmission();verified=true;notice='Relais coop connecté ; même carte et même étage uniquement.';}
          return;
        }
        if(message.type==='leave'&&peerId(message.id)){peers.delete(message.id);return;}
        if(!verified||!matches(message)||scoped&&spaceKey(localSpace())!==joinedKey)return;
        if (message.type === 'peer' && peerId(message.id)) {
          const state = normalizeState(message.state);
          if (state && (!scoped||state.z===localSpace().z&&state.active===localSpace().region) && (peers.has(message.id) || peers.size < LIMITS.peers))
            peers.set(message.id, { ...state, name: label(message.name, 'Allié'), time });
        }
        if (message.type === 'leave' && peerId(message.id)) peers.delete(message.id);
        if (message.type === 'ping' && coordinate(message.x) && coordinate(message.y)) {
          if (pings.length >= LIMITS.pings) pings.shift();
          pings.push({ x: message.x, y: message.y, name: label(message.name, 'Allié'), expires: time + LIMITS.pingMs });
        }
      });
      connection.addEventListener('close', () => {
        // A previous connection can finish closing after its replacement opens.
        if (socket !== connection) return;
        clearAdmission();socket = null;joinedKey=undefined;verified=false;
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
      if(!joinScope(socket))return false;
      const point = position();
      if (!coordinate(point.x) || !coordinate(point.y)) return false;
      return send(socket, { type: 'ping', room, x: point.x, y: point.y, ...(scoped?{space:localSpace()}: {}) });
    }
    function update(dt) {
      const time=performance.now();prune(time);if(expireAdmission(time))return;
      if (!socket || socket.readyState !== 1) return;
      timer -= Number.isFinite(dt) ? Math.max(0, dt) : 0;
      if (timer > 0) return;
      timer = .2;
      if(!joinScope(socket))return;
      const point = position();
      const state = normalizeState({ active: point.active, x: point.x, y: point.y, z: point.z, a: point.a,
        posture: game.worldEvolution?.posture().key || 'stand' });
      if (state) send(socket, { type: 'state', room, state, ...(scoped?{space:localSpace()}: {}) });
    }
    function overview() {
      const time = performance.now(),compatible=socket?.readyState===1&&verified&&(!scoped||!!localSpace()&&spaceKey(localSpace())===joinedKey);
      return { compatible, scoped, connected: socket?.readyState === 1, connecting: socket?.readyState === 0, room, name, notice,
        peers: (compatible?[...peers.entries()]:[]).filter(([, peer]) => time - peer.time < LIMITS.peerMs).map(([id, peer]) => ({ id, ...peer })),
        pings: (compatible?pings:[]).filter(ping => time < ping.expires).map(({expires, ...ping}) => ({ ...ping, left: (expires - time) / 1000 })) };
    }
    const api = { connect, disconnect, ping, update, overview };
    game.coop = Object.freeze(api);
    const previousUpdate = game.update.bind(game);
    game.update = dt => {
      const result = previousUpdate(dt);
      if (game.state === 'playing' && !game.paused) update(Math.min(.1, dt));
      return result;
    };
    return api;
  }
  root.DeadwallCoop = Object.freeze({ install, LIMITS, normalizeState, normalizeSpace, spaceKey, parseMessage, coordinate, label });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.DeadwallCoop;
})(globalThis);
