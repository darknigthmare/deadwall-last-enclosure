(function initDeadwallSave(global) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./core.js') : global.DeadwallCore;
  const N = typeof module !== 'undefined' && module.exports ? require('./narrative.js') : global.DeadwallNarrative;
  const Q = typeof module !== 'undefined' && module.exports ? require('./squads.js') : global.DeadwallSquads;
  const S = typeof module !== 'undefined' && module.exports ? require('./scenarios.js') : global.DeadwallScenarios;
  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const MAX_ENTITY_ID = 0x7ffffffe;
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
    const scenarioId = S.normalize(data.scenarioId);
    const ids = new Set(), nodeIds = new Set(), occupied = new Set(); let maximumId = 0, cores = 0;
    const entityId = raw => { const id = integer(raw.id, undefined, 1, MAX_ENTITY_ID, 'identifiant'); if (ids.has(id)) fail('identifiant dupliqué'); ids.add(id); maximumId = Math.max(maximumId, id); return id; };
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
      return { id:entityId(raw),kind:raw.kind,squad:Q.unitGroup(raw.kind,raw.squad),...position(raw),health:number(raw.health,C.SURVIVORS[raw.kind].health,.001,C.SURVIVORS[raw.kind].health,'santé survivant'),carry,carryType:C.RESOURCE_KEYS.includes(raw.carryType)?raw.carryType:null,state:['idle','move','haul','gather','build','repair','clear','return','flee'].includes(raw.state)?raw.state:carry>0?'return':'idle',targetNode:integer(raw.targetNode,-1,-1,1e9,'cible récolte'),targetBuilding:integer(raw.targetBuilding,-1,-1,Number.MAX_SAFE_INTEGER,'cible chantier'),targetUnit:integer(raw.targetUnit,-1,-1,0x7ffffffe,'cible soins'),fireCooldown:number(raw.fireCooldown,0,0,120,'cadence survivant') };
    });
    const assignments=Q.assignments(units);for(const unit of units)if(assignments.has(unit.id))unit.squad=assignments.get(unit.id);
    const unitIds=new Set(units.map(unit=>unit.id));
    const zombies = list(data.zombies, [], C.PERFORMANCE_LIMITS.zombies, 'infectés').map(value => {
      const raw=object(value,'infecté');if(!owns(C.ENEMIES,raw.kind))fail('type infecté');
      const out={id:entityId(raw),kind:raw.kind,...position(raw),health:number(raw.health,1,.001,1e6,'santé infecté'),attackCooldown:number(raw.attackCooldown,0,0,120,'cadence infecté')};
      out.stagger=number(raw.stagger,0,0,120,'entrave infecté');out.rage=number(raw.rage,0,0,120,'agitation infecté');
      // Historical saves did not retain the howl timer. Leave it absent so
      // their initial delay is supplied by the existing constructor.
      if(raw.kind==='howler'&&raw.howl!==undefined)out.howl=number(raw.howl,undefined,0,120,'délai de cri infecté');
      if(raw.kind==='stalker'){
        if(raw.huntThink!==undefined)out.huntThink=number(raw.huntThink,undefined,0,C.ENEMY_RULES.stalkThinkSeconds,'délai de traque');
        if(raw.preyId!==undefined){
          out.preyId=raw.preyId===null?null:integer(raw.preyId,undefined,0,MAX_ENTITY_ID,'proie infecté');
          if(out.preyId!==null&&out.preyId!==0&&!unitIds.has(out.preyId))fail('proie absente');
        }
      }
      if(raw.kind==='shielded'||raw.kind==='charger'){
        const core=buildings.find(b=>b.type==='core'),size=C.BUILDINGS.core.size;
        const facing=Math.atan2((core.gy+size[1]/2)*C.TILE-out.y,(core.gx+size[0]/2)*C.TILE-out.x);
        out.facing=number(raw.facing,facing,-Math.PI,Math.PI,'orientation infecté');
      }
      if(raw.kind==='charger'){
        if(raw.charge===undefined)out.charge={stage:'ready',timer:0,angle:out.facing};
        else{
          const charge=object(raw.charge,'ruée infecté'),r=C.ENEMY_RULES.charge;
          if(!['ready','windup','rush','recover'].includes(charge.stage))fail('phase de ruée');
          const maximum=charge.stage==='ready'?0:charge.stage==='windup'?r.windupSeconds:charge.stage==='rush'?r.rushSeconds:r.recoverySeconds;
          out.charge={stage:charge.stage,timer:number(charge.timer,undefined,0,maximum,'durée de ruée'),angle:number(charge.angle,undefined,-Math.PI,Math.PI,'direction de ruée')};
        }
      }
      return out;
    });
    const nextId = Math.max(integer(data.nextId, maximumId + 1, 1, MAX_ENTITY_ID, 'prochain ID'), maximumId + 1);
    // Validate the derived counter too. Reject exhaustion before any world
    // replacement; do not renumber surviving entities or silently reuse IDs.
    if (nextId >= MAX_ENTITY_ID) fail('prochain ID épuisé');
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
    const research={completed:list(data.research?.completed,[],C.RESEARCH.length,'doctrines').filter(id=>C.RESEARCH.some(item=>item.id===id)),insight:number(data.research?.insight,0,0,C.RESEARCH_INSIGHT_MAX,'insight'),active:null};
    const narrative=N.normalize(data.narrative);
    const squads=Q.normalize(data.squads,data.rally?position(data.rally):{x:C.WORLD_SIZE/2,y:C.WORLD_SIZE/2},buildings);
    const objectiveIndex=integer(data.objectiveIndex,0,0,C.OBJECTIVES.length,'objectif');
    const objectiveProgress=number(data.objectiveProgress,0,0,1e12,'progression');
    const objectiveReady=data.objectiveReady===undefined?false:data.objectiveReady;
    if(typeof objectiveReady!=='boolean'||objectiveReady&&(objectiveIndex>=C.OBJECTIVES.length||objectiveProgress<C.OBJECTIVES[objectiveIndex].target))fail('récompense d’objectif');
    return { version:C.SAVE_VERSION,timestamp:number(data.timestamp,Date.now(),0,1e15,'date'),difficulty:owns(C.DIFFICULTIES,data.difficulty)?data.difficulty:'standard',worldSeed:integer(data.worldSeed,17117,0,0xffffffff,'graine'),workerOrder:['auto','harvest','build','clear','retreat'].includes(data.workerOrder)?data.workerOrder:'auto',runId:typeof data.runId==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(data.runId)?data.runId:'legacy:'+(owns(C.DIFFICULTIES,data.difficulty)?data.difficulty:'standard')+':'+(data.worldSeed??17117)+(scenarioId==='classic'?'':':'+scenarioId),randomState:integer(data.randomState,data.worldSeed||17117,0,0xffffffff,'aléatoire'),resources:bag(data.resources),player,buildings,units,zombies,
      scenarioId,
      squads,
      narrative,nodes:list(data.nodes,[],50000,'gisements').map(row=>{if(!Array.isArray(row)||row.length!==2)fail('gisement');const id=integer(row[0],undefined,0,1e9,'gisement ID');if(nodeIds.has(id))fail('gisement dupliqué');nodeIds.add(id);return[id,number(row[1],0,0,1e12,'gisement quantité')];}),
      wave,phase,phaseTime:number(data.phaseTime,20,-1e12,1e12,'chronomètre'),spawnQueue:legacy.slice(),pendingSpawns:{...pending},spawnTimer:number(data.spawnTimer,0,-1e12,1e12,'cadence migration'),fronts:list(data.fronts,[],4,'fronts').filter(front=>['north','east','south','west'].includes(front)),wavePlan:plan,
      elapsed:number(data.elapsed,0,0,1e12,'temps'),dayClock:number(data.dayClock,.2,0,1,'heure'),weather:number(data.weather,0,0,1,'météo'),morale:number(data.morale,100,0,100,'moral'),rally:data.rally?position(data.rally):{x:C.WORLD_SIZE/2,y:C.WORLD_SIZE/2},stats,objectiveIndex,objectiveProgress:objectiveReady?C.OBJECTIVES[objectiveIndex].target:objectiveProgress,objectiveReady,nextId,research,activeCrisis:C.normalizeCrisis?C.normalizeCrisis(data.activeCrisis):null,depositedResources:number(data.depositedResources,0,0,1e12,'dépôts') };
  }
  function parse(text) {
    if (typeof text !== 'string' || text.length > MAX_FILE_BYTES) fail('fichier trop volumineux');
    if (new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES) fail('fichier trop volumineux');
    return validate(JSON.parse(text));
  }
  // Keep portable copies within the same byte limit and validator chain as imports.
  // Later extensions replace api.validate/api.parse, so resolve them when exporting.
  function stringify(input) {
    const payload = JSON.stringify(api.validate(input));
    api.parse(payload);
    return payload;
  }
  const api={MAX_FILE_BYTES,validate,parse,stringify}; if(typeof module!=='undefined'&&module.exports)module.exports=api; global.DeadwallSave=api;
})(typeof globalThis!=='undefined'?globalThis:this);


/* DEADWALL OPERATIONS 1.1 — BEGIN */
/* Appended to src/save.js after the original validator. */
(function installOperationsSave(root){
  'use strict';
  const C=root.DeadwallCore,O=root.DeadwallOperations,S=root.DeadwallSave;
  if(!C||!O||!S)throw new Error('Dépendances de sauvegarde des sorties absentes.');
  if(S.fieldOperationsVersion)return;
  const original=S.validate;
  function validate(input){
    // Do not let the old validator discard the extension's state.
    const fieldOps=O.normalize((input?.version===3||input?.version===4||input?.version===5)?input.fieldOps:undefined);
    if((input?.version===3||input?.version===4||input?.version===5)&&input.fieldOps===undefined)throw new Error('Sauvegarde v3 sans registre des sorties.');
    const base=original(input);
    return {...base,fieldOps};
  }
  function parse(text){
    if(typeof text!=='string'||text.length>S.MAX_FILE_BYTES||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw new Error('Sauvegarde trop volumineuse (8 Mio maximum).');
    return validate(JSON.parse(text));
  }
  S.validate=validate;S.parse=parse;S.fieldOperationsVersion=O.RULES.version;
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL OPERATIONS 1.1 — END */


/* DEADWALL TERRITORIES 1.2 — BEGIN */
/* Preserves both extension registries before any candidate world is committed. */
(function installTerritorySave(root){
 'use strict';
 const S=root.DeadwallSave,T=root.DeadwallTerritories,C=root.DeadwallCore;
 if(!S||!T||!C)throw new Error('Dépendances de sauvegarde des territoires absentes.');
 if(S.territoriesVersion)return;
 const original=S.validate;
 function validate(input){
   if((input?.version===4||input?.version===5)&&input.territories===undefined)throw new Error('Sauvegarde v4 sans territoires.');
   const territories=T.normalize((input?.version===4||input?.version===5)?input.territories:undefined);
   const base=original(input);
   // Cross-reference IDs, not array positions. No free replacement worker on load.
   if(Array.isArray(base.units)&&Array.isArray(base.buildings)){
     const units=new Map(base.units.map(u=>[u.id,u])),buildings=new Map(base.buildings.map(b=>[b.id,b]));
     for(const sector of Object.values(territories.sectors)){
       if(sector.workerId!==null&&units.get(sector.workerId)?.kind!=='worker')throw new Error('Ouvrier de secteur absent ou incompatible.');
       if(sector.postId!==null&&buildings.get(sector.postId)?.type!=='sectorPost')throw new Error('Poste de secteur absent ou incompatible.');
     }
     if(territories.withdrawing.some(id=>units.get(id)?.kind!=='worker'))throw new Error('Ouvrier en repli absent.');
     if(territories.fallbackId!==null&&buildings.get(territories.fallbackId)?.type!=='fallbackRedoubt')throw new Error('Redoute de repli absente.');
   }
   return {...base,territories};
 }
 function parse(text){if(typeof text!=='string'||text.length>S.MAX_FILE_BYTES||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw new Error('Sauvegarde trop volumineuse (8 Mio maximum).');return validate(JSON.parse(text));}
 S.validate=validate;S.parse=parse;S.territoriesVersion=1;
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL TERRITORIES 1.2 — END */


/* DEADWALL SIEGE 1.3 — BEGIN */
/* Last validator in the chain: validate references before replacing the candidate world. */
(function installSiegeSave(root){
  'use strict';
  const S=root.DeadwallSave,F=root.DeadwallSiege;
  if(!S||!F)throw new Error('Dépendances de sauvegarde du siège absentes.');
  if(S.siegeVersion)return;
  const original=S.validate;
  function validate(input){
    if(input?.version===5&&input.siege===undefined)throw new Error('Sauvegarde v5 sans registre de siège.');
    const siege=F.normalize(input?.version===5?input.siege:undefined),base=original(input);
    if(!Array.isArray(base.buildings)||!Array.isArray(base.units))throw new Error('Entités de campagne absentes.');
    const buildings=new Map(base.buildings.map(b=>[b.id,b])),units=new Map(base.units.map(u=>[u.id,u]));
    for(const t of siege.tanks)if(buildings.get(t.id)?.type!=='fireCistern'||buildings.get(t.id).progress<1)throw new Error('Citerne absente ou inachevée.');
    for(const f of siege.fires)if(!F.susceptibility(buildings.get(f.id))||buildings.get(f.id).progress<1)throw new Error('Foyer sur une structure absente, inachevée ou incombustible.');
    for(const w of siege.wet)if(!buildings.has(w.id))throw new Error('Humidification sur une structure absente.');
    const detached=new Set([...(base.territories?.withdrawing||[]),...Object.values(base.territories?.sectors||{}).map(s=>s.workerId)]);
    for(const c of siege.crew)if(units.get(c.id)?.kind!=='worker'||detached.has(c.id))throw new Error('Secouriste absent ou déjà détaché dans un quartier.');
    if(base.player.dead&&siege.playerWater>0)throw new Error('Un commandant à terre ne conserve pas un seau rempli.');
    if(siege.lastWave&&siege.lastWave.wave>base.wave)throw new Error('Compte rendu d’une migration future.');
    return {...base,siege};
  }
  S.validate=validate;
  S.parse=text=>{if(typeof text!=='string'||text.length>S.MAX_FILE_BYTES||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw new Error('Sauvegarde trop volumineuse (8 Mio maximum).');return validate(JSON.parse(text));};
  S.siegeVersion=1;
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL SIEGE 1.3 — END */


/* DEADWALL DAYWORKS 1.4 — BEGIN */
(function installDayworksSave(root){
 'use strict';
 const S=root.DeadwallSave,D=root.DeadwallDayworks,C=root.DeadwallCore;if(!S||!D||!C)throw new Error('Sauvegarde Aube & Bastions : dépendances absentes.');if(S.dayworksVersion)return;
 const previous=S.validate;
 function validate(input){
  const extended=input?.version===6;if(extended&&input.dayworks===undefined)throw new Error('Sauvegarde v6 sans carnet de reconstruction.');
  const state=D.normalize(extended?input.dayworks:undefined);
  // Feed the previous validator the last format it understands, preserving every old registry.
  const base=previous(extended?{...input,version:5}:input),byId=new Map(base.buildings.map(b=>[b.id,b]));
  for(const b of state.braces){const gate=byId.get(b.id);if(!gate||!C.BUILDINGS[gate.type]?.gate||gate.progress<1||b.wave!==base.wave)throw new Error('Étai sans porte achevée ou réservé à une autre vague.');}
  if(state.day.wave>base.wave)throw new Error('Journée future.');
  if(state.night){if(state.night.wave!==base.wave||!['assault','aftermath'].includes(base.phase)||!base.wavePlan||state.night.total!==base.wavePlan.total)throw new Error('Échelons incompatibles avec l’assaut sauvegardé.');
   const pending=Object.values(base.pendingSpawns||{}).reduce((n,v)=>n+v,0)+(base.spawnQueue?.length||0);
   if(base.phase==='assault'&&state.night.emitted!==state.night.total-pending)throw new Error('Contacts d’échelons incohérents.');
   if(state.night.fronts.some(f=>!base.fronts.includes(f))||state.night.fronts.length!==base.fronts.length)throw new Error('Fronts d’échelons incohérents.');
  }
  return {...base,version:6,dayworks:state};
 }
 S.validate=validate;S.parse=text=>{if(typeof text!=='string'||text.length>S.MAX_FILE_BYTES||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw new Error('Sauvegarde trop volumineuse (8 Mio maximum).');return validate(JSON.parse(text));};S.dayworksVersion=1;
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL DAYWORKS 1.4 — END */


/* DEADWALL CITADEL 1.5 — BEGIN */
(function installCitadelSave(root){
  'use strict';const S=root.DeadwallSave,C=root.DeadwallCore,D=root.DeadwallCitadel;if(!S||!C||!D)throw Error('Dépendances du registre de cité absentes.');if(S.citadelVersion)return;
  const previous=S.validate;
  function validate(input){const extended=input?.version===7;if(extended&&input.citadel===undefined)throw Error('Sauvegarde v7 sans registre de cité.');
    const state=D.normalize(extended?input.citadel:undefined),base=previous(extended?{...input,version:6}:input);
    const buildings=new Map(base.buildings.map(b=>[b.id,b])),units=new Map(base.units.map(u=>[u.id,u]));
    for(const id of state.suspended){const b=buildings.get(id);if(!b||b.progress>=1||b.type==='core')throw Error('Chantier suspendu absent ou déjà terminé.');}
    const detached=new Set([...(base.territories?.withdrawing||[]),...Object.values(base.territories?.sectors||{}).map(s=>s.workerId),...(base.siege?.crew||[]).map(s=>s.id)]);
    for(const call of state.calls)if(D.ACTIVE.includes(call.status)){const u=units.get(call.unitId);if(!u||u.kind!==D.BY_ID[call.id].kind||u.dead||u.health<=0||detached.has(u.id))throw Error('Escorte absente, invalide ou déjà affectée.');}
    for(const call of state.calls)if(call.status==='delivered'&&units.has(call.citizenId)&&units.get(call.citizenId).kind!==D.BY_ID[call.id].kind)throw Error('Identité du résident incompatible.');
    if(state.baseline&&(state.baseline.wave!==base.wave||!['warning','assault','aftermath'].includes(base.phase)||state.baseline.at>base.elapsed))throw Error('Début de nuit incompatible.');
    if(state.history.some(h=>h.wave>base.wave))throw Error('Bilan futur.');
    return{...base,version:7,citadel:state};
  }
  S.validate=validate;S.parse=text=>{if(typeof text!=='string'||text.length>S.MAX_FILE_BYTES||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse (8 Mio maximum).');return validate(JSON.parse(text));};S.citadelVersion=1;
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL CITADEL 1.5 — END */


/* DEADWALL INFRASTRUCTURE 1.6 — BEGIN */
(function installInfrastructureSave(root){
 'use strict';const S=root.DeadwallSave,C=root.DeadwallCore,D=root.DeadwallInfrastructure;
 if(!S||!C||!D)throw Error('Dépendances de sauvegarde du réseau absentes.');if(S.infrastructureVersion)return;
 const prior=S.validate;
 function validate(input){
  const extended=input?.version===8;if(extended&&input.infrastructure===undefined)throw Error('Sauvegarde v8 sans réseau de voirie.');
  const state=D.normalize(extended?input.infrastructure:undefined),base=prior(extended?{...input,version:7}:input);
  const units=new Map(base.units.map(u=>[u.id,u])),structures=new Map(base.buildings.map(b=>[b.id,b]));
  const taken=new Set([...(base.territories?.withdrawing||[]),...Object.values(base.territories?.sectors||{}).map(s=>s.workerId),...(base.siege?.crew||[]).map(c=>c.id),...(base.citadel?.calls||[]).map(c=>c.unitId)]);
  for(const member of state.crew){const u=units.get(member.id);if(!u||u.kind!=='worker'||u.dead||u.health<=0||taken.has(member.id))throw Error('Ouvrier de voirie absent ou déjà affecté.');}
  for(const b of state.ruins){const d=Object.hasOwn(C.BUILDINGS,b.type)&&C.BUILDINGS[b.type];if(!d||structures.has(b.id)||units.has(b.id)||(Number.isSafeInteger(base.nextId)&&b.id>=base.nextId))throw Error('Empreinte inconnue ou structure pas détruite.');
    const [w,h]=b.rotation%2?[d.size[1],d.size[0]]:d.size;
    if(b.gx+w>=127||b.gy+h>=127||b.at>(base.elapsed??0))throw Error('Empreinte hors carte ou datée du futur.');
    if(base.buildings.some(s=>s.type===b.type&&s.gx===b.gx&&s.gy===b.gy&&(s.rotation||0)===b.rotation))throw Error('Empreinte déjà reconstruite.');
  }
  return{...base,version:8,infrastructure:state};
 }
 S.validate=validate;S.parse=text=>{if(typeof text!=='string'||text.length>S.MAX_FILE_BYTES||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse (8 Mio maximum).');return validate(JSON.parse(text));};S.infrastructureVersion=1;
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL INFRASTRUCTURE 1.6 — END */

(function installSalvageSave(root){
 'use strict';const S=root.DeadwallSave,C=root.DeadwallCore;if(S.salvageVersion)return;const old=S.validate;
 function validate(input){
  const modern=input?.version===9;if(modern&&input.salvage===undefined)throw Error('Sauvegarde v9 sans registre de récupération.');
  const state=C.Salvage.normalize(modern?input.salvage:undefined),base=old(modern?{...input,version:8}:input);
  const units=new Map(base.units.map(u=>[u.id,u])),sites=new Map(base.dayworks.sites.map(s=>[s.id,s]));
  const busy=new Set([...(base.territories.withdrawing||[]),...Object.values(base.territories.sectors).map(s=>s.workerId),...base.siege.crew.map(c=>c.id),...base.infrastructure.crew.map(c=>c.id),...base.citadel.calls.map(c=>c.unitId)]);
  for(const c of state.crews){const u=units.get(c.id),s=sites.get(c.site);if(!u||u.kind!=='worker'||u.health<=0||busy.has(c.id))throw Error('Récupérateur absent ou déjà affecté.');if(!s||!s.seen||s.survey!==C.Dayworks.RULES.surveySeconds)throw Error('Récupération sans relevé terminé.');if(u.carry>C.WORKER_RULES.carryCapacity+.000001||c.prepared&&u.carry>0&&u.carryType!==C.Dayworks.BY_ID[c.site].resource)throw Error('Sac de récupération incohérent.');}
  return{...base,version:9,salvage:state};
 }
 S.validate=validate;S.parse=text=>{if(typeof text!=='string'||text.length>S.MAX_FILE_BYTES||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse (8 Mio maximum).');return validate(JSON.parse(text));};S.salvageVersion=1;
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
 'use strict';const C=root.DeadwallCore,S=root.DeadwallSave;if(S.urbanVersion)return;const old=S.validate;
 function validate(input){const modern=input?.version===10;if(modern&&input.urban===undefined)throw Error('Sauvegarde v10 sans registre urbain.');const u=C.Urban.normalize(modern?input.urban:undefined),base=old(modern?{...input,version:9}:input);const current=C.Urban.score(base.buildings);
  if(modern&&(u.peakScore+.000001<current||u.skipNightWave>base.wave))throw Error('Historique urbain incompatible avec la campagne.');
  if(!modern){u.peakScore=current;u.skipNightWave=base.phase==='calm'?0:base.wave;}
  return{...base,version:10,urban:u};}
 S.validate=validate;S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse (8 Mio maximum).');return validate(JSON.parse(text));};S.urbanVersion=1;
})(globalThis);

(function(root){
 'use strict';const C=root.DeadwallCore,S=root.DeadwallSave;if(S.powerGridVersion)return;const old=S.validate;
 function validate(input){const modern=input?.version===11;if(modern&&input.powerGrid===undefined)throw Error('Sauvegarde v11 sans réserve électrique.');const state=C.PowerGrid.normalize(modern?input.powerGrid:undefined),base=old(modern?{...input,version:10}:input),map=new Map(base.buildings.map(b=>[b.id,b]));
  for(const b of state.batteries){const host=map.get(b.id),def=host&&C.BUILDINGS[host.type];if(!host||host.progress!==1||!def.battery||b.charge>def.battery.capacity)throw Error('Batterie absente, inachevée ou surchargée.');}
  for(const c of state.circuits){const host=map.get(c.id);if(!host||host.progress!==1||!C.BUILDINGS[host.type].powerUse)throw Error('Circuit sans consommateur achevé.');}
  for(const b of base.buildings)if(b.progress===1&&C.BUILDINGS[b.type].battery&&!state.batteries.some(v=>v.id===b.id)){if(modern)throw Error('Charge électrique manquante.');state.batteries.push({id:b.id,charge:0,mode:'night'});}
  return{...base,version:11,powerGrid:state};
 }
 S.validate=validate;S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse (8 Mio maximum).');return validate(JSON.parse(text));};S.powerGridVersion=1;
})(globalThis);

(function(root){'use strict';const C=root.DeadwallCore,S=root.DeadwallSave;if(S.expeditionsVersion)return;const old=S.validate;
 function validate(input){const modern=input?.version===12;if(modern&&input.expeditions===undefined)throw Error('Sauvegarde v12 sans registre des expéditions.');const e=C.Expeditions.normalize(modern?input.expeditions:undefined),base=old(modern?{...input,version:11}:input);if(!modern)e.trade.wave=base.wave;
  const ids=new Set([...base.buildings,...base.units,...base.zombies,...(base.projectiles||[])].map(x=>x.id)),units=new Map(base.units.map(u=>[u.id,u]));
  if(e.vehicle&&(ids.has(e.vehicle.id)||e.vehicle.id>=base.nextId||e.vehicle.driving&&(base.player.dead||Math.hypot(base.player.x-e.vehicle.x,base.player.y-e.vehicle.y)>1)))throw Error('Véhicule ou conducteur incohérent.');
  if(e.active&&(!e.vehicle||e.vehicle.health<=0||e.active.wave>base.wave||!e.sites.find(s=>s.id===e.active.id)?.known)||e.trade.wave>base.wave)throw Error('Sortie active incohérente.');
  if(e.analyst){const a=e.analyst,u=units.get(a.id),post=base.buildings.find(b=>b.id===a.post),busy=new Set([...(base.territories.withdrawing||[]),...Object.values(base.territories.sectors).map(s=>s.workerId),...base.siege.crew.map(c=>c.id),...base.infrastructure.crew.map(c=>c.id),...base.citadel.calls.map(c=>c.unitId),...base.salvage.crews.map(c=>c.id)]);if(!u||u.kind!=='worker'||busy.has(a.id)||!a.returning&&(!post||post.type!=='expeditionOffice'||post.progress!==1))throw Error('Analyste absent ou déjà affecté.');}
  return{...base,version:12,expeditions:e};}
 S.validate=validate;S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse (8 Mio maximum).');return validate(JSON.parse(text));};S.expeditionsVersion=1;
})(globalThis);

(function(root){
 'use strict';const C=root.DeadwallCore,S=root.DeadwallSave,old=S.validate;
 function validate(input){const modern=input?.version===13;if(modern&&!input.fieldcraft)throw Error('Terrain manquant.');const legacyEmpty=modern&&input.fieldcraft?.legacyLayout===true&&Array.isArray(input.fieldcraft.nodes)&&input.fieldcraft.nodes.length===0;const r=C.Fieldcraft.normalize(modern?input.fieldcraft:undefined),b=old(modern?{...input,version:12}:input);if(modern&&!legacyEmpty){const ids=new Set(b.nodes.map(n=>n[0]));if(r.nodes.length!==ids.size||r.nodes.some(n=>!ids.has(n[0])))throw Error('Décors étrangers à la carte.');}return{...b,version:13,fieldcraft:legacyEmpty?{...r,legacyLayout:true}:r};}
 S.validate=validate;S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).length>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse.');return validate(JSON.parse(text));};
})(globalThis);

(function(root){'use strict';const C=root.DeadwallCore,S=root.DeadwallSave,previous=S.validate;S.validate=raw=>{const modern=raw?.version===14;if(modern&&raw.frontier===undefined)throw Error('Sauvegarde v14 sans registre régional.');const d=previous(modern?{...raw,version:13}:raw),frontier=C.Frontier.validate(modern?raw.frontier:undefined,d);return{...d,version:14,frontier};};S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse.');return S.validate(JSON.parse(text));};})(globalThis);

(function(root){'use strict';const S=root.DeadwallSave,old=S.validate;S.validate=raw=>{const modern=raw?.version===15;if(modern&&raw.frontier?.version!==2)throw Error('Sauvegarde v15 sans carnet régional.');const d=old(modern?{...raw,version:14}:raw);return{...d,version:15};};S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse.');return S.validate(JSON.parse(text));};})(globalThis);

(function(root){'use strict';const S=root.DeadwallSave,old=S.validate;S.validate=raw=>{const modern=raw?.version===16;if(modern&&(raw.frontier?.version!==2||typeof raw.frontier.quiet!=='boolean'||!raw.frontier.tracks))throw Error('Sauvegarde v16 sans reconnaissance');const d=old(modern?{...raw,version:15}:raw);return{...d,version:16};};S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse');return S.validate(JSON.parse(text));};})(globalThis);

(function(root){'use strict';const C=root.DeadwallCore,S=root.DeadwallSave,old=S.validate;S.validate=raw=>{const modern=raw?.version===17;if(modern&&!raw.fieldSupplies)throw Error('Sauvegarde v17 sans relais.');const d=old(modern?{...raw,version:16}:raw);return{...d,version:17,fieldSupplies:C.FieldSupplies.validate(modern?raw.fieldSupplies:undefined,d)};};S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse.');return S.validate(JSON.parse(text));};})(globalThis);

(function(root){'use strict';const C=root.DeadwallCore,S=root.DeadwallSave,old=S.validate;S.validate=raw=>{const modern=raw?.version===18;if(modern&&!raw.fieldAtlas)throw Error('Sauvegarde v18 sans reconnaissance régionale.');const d=old(modern?{...raw,version:17}:raw);return{...d,version:18,fieldAtlas:C.FieldAtlas.validate(modern?raw.fieldAtlas:undefined,d)};};S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse.');return S.validate(JSON.parse(text));};})(globalThis);

(function(root){'use strict';const C=root.DeadwallCore,S=root.DeadwallSave,old=S.validate;S.validate=raw=>{const modern=raw?.version===19;if(modern&&!raw.essentials)throw Error('Sauvegarde v19 sans services.');const d=old(modern?{...raw,version:18}:raw);return{...d,version:19,essentials:C.Essentials.validate(modern?raw.essentials:undefined,d)};};S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse.');return S.validate(JSON.parse(text));};})(globalThis);

(function(root){'use strict';const C=root.DeadwallCore,S=root.DeadwallSave,old=S.validate;S.validate=raw=>{const modern=raw?.version===20;if(modern&&!raw.worldEvolution)throw Error('Sauvegarde v20 sans évolution.');const d=old(modern?{...raw,version:19}:raw);return{...d,version:20,worldEvolution:C.WorldEvolution.validate(modern?raw.worldEvolution:undefined,d)};};S.parse=text=>{if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw Error('Sauvegarde trop volumineuse.');return S.validate(JSON.parse(text));};})(globalThis);
