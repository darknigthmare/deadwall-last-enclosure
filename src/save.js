(function initDeadwallSave(global) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./core.js') : global.DeadwallCore;
  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const owns = (table,key) => typeof key==='string' && Object.prototype.hasOwnProperty.call(table,key);
  const fail = label => { throw new Error(`Sauvegarde invalide : ${label}.`); };
  const object = (value, label) => value && typeof value === 'object' && !Array.isArray(value) ? value : fail(label);
  const number = (value, fallback, min, max, label) => {
    const result = value === undefined ? fallback : value;
    if (typeof result !== 'number' || !Number.isFinite(result) || result < min || result > max) fail(label);
    return result;
  };
  const integer = (value, fallback, min, max, label) => { const result = number(value, fallback, min, max, label); if (!Number.isInteger(result)) fail(label); return result; };
  const list = (value, fallback, max, label) => { const result = value === undefined ? fallback : value; if (!Array.isArray(result) || result.length > max) fail(label); return result; };
  const bag = value => { const raw = object(value === undefined ? {} : value, 'ressources'); return Object.fromEntries(C.RESOURCE_KEYS.map(key => [key, number(raw[key], 0, 0, 1e12, key)])); };
  const position = raw => ({ x: number(raw.x, undefined, -64, C.WORLD_SIZE + 64, 'position X'), y: number(raw.y, undefined, -64, C.WORLD_SIZE + 64, 'position Y') });

  function validate(input) {
    const source = object(input, 'document');
    const data = C.migrateSaveData(source); if (!data) fail('version incompatible');
    const ids = new Set(), occupied = new Set(); let maximumId = 0, cores = 0;
    const entityId = raw => { const id = integer(raw.id, undefined, 1, 0x7ffffffe, 'identifiant'); if (ids.has(id)) fail('identifiant dupliqué'); ids.add(id); maximumId = Math.max(maximumId, id); return id; };
    const buildings = list(data.buildings, [], C.WORLD_TILES ** 2, 'structures').map(value => {
      const raw = object(value, 'structure');if(!owns(C.BUILDINGS,raw.type))fail('type de structure');const def=C.BUILDINGS[raw.type];
      const id = entityId(raw), rotation = integer(raw.rotation, 0, 0, 3, 'rotation');
      const [width, height] = rotation % 2 ? [def.size[1], def.size[0]] : def.size;
      const gx = integer(raw.gx, undefined, 0, C.WORLD_TILES-width, 'cellule X'), gy = integer(raw.gy, undefined, 0, C.WORLD_TILES-height, 'cellule Y');
      for (let y=gy;y<gy+height;y++) for (let x=gx;x<gx+width;x++) { const cell=y*C.WORLD_TILES+x; if (occupied.has(cell)) fail('structures superposées'); occupied.add(cell); }
      const progress=number(raw.progress,1,0,1,'chantier'); if(raw.type==='core'){cores++;if(progress!==1)fail('centre incomplet');}
      return { id,type:raw.type,gx,gy,rotation,progress,health:number(raw.health,def.health,0.001,def.health,'intégrité'),corpseLoad:number(raw.corpseLoad,0,0,1e9,'pression des corps'),priority:integer(raw.priority,2,1,3,'priorité'),gateMode:['auto','open','closed'].includes(raw.gateMode)?raw.gateMode:'auto' };
    });
    if (cores !== 1) fail('centre de commandement absent ou multiple');
    const units = list(data.units, [], 10000, 'survivants').map(value => {
      const raw=object(value,'survivant');if(!owns(C.SURVIVORS,raw.kind))fail('type de survivant');
      const carry=number(raw.carry,0,0,1000,'portage survivant');if(carry>0&&!C.RESOURCE_KEYS.includes(raw.carryType))fail('ressource transportée');
      return { id:entityId(raw),kind:raw.kind,...position(raw),health:number(raw.health,C.SURVIVORS[raw.kind].health,.001,C.SURVIVORS[raw.kind].health,'santé survivant'),carry,carryType:C.RESOURCE_KEYS.includes(raw.carryType)?raw.carryType:null,state:['idle','move','haul','gather','build','repair','clear','return','flee'].includes(raw.state)?raw.state:carry>0?'return':'idle',targetNode:integer(raw.targetNode,-1,-1,1e9,'cible récolte'),targetBuilding:integer(raw.targetBuilding,-1,-1,Number.MAX_SAFE_INTEGER,'cible chantier'),targetUnit:integer(raw.targetUnit,-1,-1,0x7ffffffe,'cible soins'),fireCooldown:number(raw.fireCooldown,0,0,120,'cadence survivant') };
    });
    const zombies = list(data.zombies, [], C.PERFORMANCE_LIMITS.zombies, 'infectés').map(value => { const raw=object(value,'infecté');if(!owns(C.ENEMIES,raw.kind))fail('type infecté');return {id:entityId(raw),kind:raw.kind,...position(raw),health:number(raw.health,1,.001,1e6,'santé infecté'),attackCooldown:number(raw.attackCooldown,0,0,120,'cadence infecté')}; });
    const rawPlayer=object(data.player,'joueur'), health=number(rawPlayer.health,100,0,100,'santé joueur'), weapon=owns(C.WEAPONS,rawPlayer.weapon)?rawPlayer.weapon:'pistol';
    const magazine=Object.fromEntries(Object.entries(C.WEAPONS).map(([key,def])=>[key,integer(rawPlayer.magazine?.[key],def.magazine,0,def.magazine,'chargeur')]));
    const player={...position(rawPlayer),health,weapon,magazine,carry:bag(rawPlayer.carry),dead:health<=0||rawPlayer.dead===true,stamina:number(rawPlayer.stamina,100,0,100,'endurance'),downTimer:number(rawPlayer.downTimer,health<=0?8:0,0,120,'réanimation'),invulnerable:number(rawPlayer.invulnerable,0,0,120,'protection'),reload:number(rawPlayer.reload,0,0,120,'rechargement'),reloadTotal:number(rawPlayer.reloadTotal,0,0,120,'durée rechargement'),shootCooldown:number(rawPlayer.shootCooldown,0,0,120,'cadence joueur'),meleeCooldown:number(rawPlayer.meleeCooldown,0,0,120,'crosse')};
    if(player.dead && player.downTimer<=0)player.downTimer=8;
    const wave=integer(data.wave,1,1,1e7,'vague');
    const phase=['calm','warning','assault','aftermath'].includes(data.phase)?data.phase:fail('phase');
    const legacy=list(data.spawnQueue,[],2e6,'file de migration');for(const kind of legacy)if(!owns(C.ENEMIES,kind))fail('migration inconnue');
    const pending=object(data.pendingSpawns||{},'migration');for(const [key,value]of Object.entries(pending)){if(!owns(C.ENEMIES,key))fail('migration inconnue');integer(value,0,0,Number.MAX_SAFE_INTEGER/10,'effectif migration');}
    let plan=null;if(data.wavePlan){const raw=object(data.wavePlan,'plan de migration'),composition=Object.fromEntries(Object.keys(C.ENEMIES).map(kind=>[kind,integer(raw.composition?.[kind],0,0,1e12,'composition migration')]));const total=integer(raw.total,undefined,1,1e12,'total migration');if(Object.values(composition).reduce((a,b)=>a+b,0)!==total)fail('composition migration incohérente');plan={wave,total,fronts:integer(raw.fronts,1,1,4,'fronts migration'),spawnInterval:number(raw.spawnInterval,.3,.01,5,'intervalle migration'),composition};}
    const stats=Object.fromEntries(Object.keys(C.createStats()).map(key=>[key,number(data.stats?.[key],0,0,1e15,'statistiques')]));
    const research={completed:list(data.research?.completed,[],C.RESEARCH.length,'doctrines').filter(id=>C.RESEARCH.some(item=>item.id===id)),insight:number(data.research?.insight,0,0,1e12,'insight'),active:null};
    return { version:C.SAVE_VERSION,timestamp:number(data.timestamp,Date.now(),0,1e15,'date'),difficulty:owns(C.DIFFICULTIES,data.difficulty)?data.difficulty:'standard',worldSeed:integer(data.worldSeed,17117,0,0xffffffff,'graine'),workerOrder:['auto','harvest','build','clear','retreat'].includes(data.workerOrder)?data.workerOrder:'auto',runId:typeof data.runId==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(data.runId)?data.runId:'legacy:'+(owns(C.DIFFICULTIES,data.difficulty)?data.difficulty:'standard')+':'+(data.worldSeed??17117),randomState:integer(data.randomState,data.worldSeed||17117,0,0xffffffff,'aléatoire'),resources:bag(data.resources),player,buildings,units,zombies,
      nodes:list(data.nodes,[],50000,'gisements').map(row=>{if(!Array.isArray(row)||row.length!==2)fail('gisement');return[integer(row[0],undefined,0,1e9,'gisement ID'),number(row[1],0,0,1e12,'gisement quantité')];}),
      wave,phase,phaseTime:number(data.phaseTime,20,-1e12,1e12,'chronomètre'),spawnQueue:legacy.slice(),pendingSpawns:{...pending},spawnTimer:number(data.spawnTimer,0,-1e12,1e12,'cadence migration'),fronts:list(data.fronts,[],4,'fronts').filter(front=>['north','east','south','west'].includes(front)),wavePlan:plan,
      elapsed:number(data.elapsed,0,0,1e12,'temps'),dayClock:number(data.dayClock,.2,0,1,'heure'),weather:number(data.weather,0,0,1,'météo'),morale:number(data.morale,100,0,100,'moral'),rally:data.rally?position(data.rally):{x:C.WORLD_SIZE/2,y:C.WORLD_SIZE/2},stats,objectiveIndex:integer(data.objectiveIndex,0,0,C.OBJECTIVES.length,'objectif'),objectiveProgress:number(data.objectiveProgress,0,0,1e12,'progression'),nextId:Math.max(integer(data.nextId,maximumId+1,1,0x7ffffffe,'prochain ID'),maximumId+1),research,activeCrisis:C.normalizeCrisis?C.normalizeCrisis(data.activeCrisis):null,depositedResources:number(data.depositedResources,0,0,1e12,'dépôts') };
  }
  function parse(text) { if(typeof text!=='string'||text.length>MAX_FILE_BYTES)fail('fichier trop volumineux');return validate(JSON.parse(text)); }
  const api={MAX_FILE_BYTES,validate,parse}; if(typeof module!=='undefined'&&module.exports)module.exports=api; global.DeadwallSave=api;
})(typeof globalThis!=='undefined'?globalThis:this);
