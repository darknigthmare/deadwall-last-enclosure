(function initDeadwallProfile(global) {
  'use strict';

  const VERSION = 1;
  const PROFILE_KEY = 'deadwall-profile-v1';
  const BACKUP_KEY = 'deadwall-profile-v1-backup';
  const RECOVERY_KEY = 'deadwall-profile-v1-recovery';
  const MAX_RECENT_RUNS = 10;
  const MAX_PROFILE_BYTES = 64 * 1024;
  const MAX_RECOVERY_BYTES = 256 * 1024;
  const DIFFICULTIES = ['story', 'standard', 'brutal'];
  const METRICS = ['wavesSurvived', 'kills', 'playSeconds', 'peakPopulation', 'peakBuildings'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const issue = (code, message) => ({ code, message });
  const invalid = field => { throw new RangeError(`Profil invalide : ${field}.`); };

  function normalizeSeed(text) {
    if (text === null || text === undefined || (typeof text === 'string' && !text.trim())) return null;
    if (typeof text !== 'number' && typeof text !== 'string') throw new RangeError('La carte doit être un entier entre 0 et 4294967295.');
    const value = typeof text === 'string' ? text.trim() : String(text);
    if (!/^\d{1,10}$/.test(value)) throw new RangeError('La carte doit être un entier entre 0 et 4294967295.');
    const seed = Number(value);
    if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('La carte doit être un entier entre 0 et 4294967295.');
    return seed;
  }

  function counter(value, field, integer = true) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER || (integer && !Number.isSafeInteger(value))) invalid(field);
    return value;
  }

  function identity(value, allowLegacy) {
    if (!object(value) || !DIFFICULTIES.includes(value.difficulty)) invalid('difficulté');
    // Existing versioned saves can contain a uint32 seed; new map input is intentionally narrower.
    const seed = counter(value.seed, 'graine');
    if (seed > 0xffffffff) invalid('graine');
    let runId = value.runId;
    if (allowLegacy && (runId === undefined || runId === null || runId === '')) runId = `legacy:${value.difficulty}:${seed}`;
    if (typeof runId !== 'string' || !/^[a-zA-Z0-9:_-]{1,128}$/.test(runId)) invalid('identifiant de partie');
    return { runId, seed, difficulty:value.difficulty };
  }

  function metrics(value) {
    if (!object(value)) invalid('records');
    return Object.fromEntries(METRICS.map(key => [key,counter(value[key], key, key !== 'playSeconds')]));
  }

  function summarize(profile) {
    profile.summary = {
      retainedRuns:profile.recentRuns.length,
      completedRuns:profile.recentRuns.filter(run => run.ended).length,
      inProgressRuns:profile.recentRuns.filter(run => !run.ended).length
    };
    return profile;
  }

  function empty() {
    return summarize({ version:VERSION, updatedAt:0, byDifficulty:Object.fromEntries(DIFFICULTIES.map(id => [id,Object.fromEntries(METRICS.map(key => [key,0]))])), recentRuns:[] });
  }

  function mergeRun(left, right) {
    if (left.runId !== right.runId || left.seed !== right.seed || left.difficulty !== right.difficulty) invalid('identifiant réutilisé pour une autre carte ou difficulté');
    return { ...left, ...Object.fromEntries(METRICS.map(key => [key,Math.max(left[key],right[key])])), ended:left.ended || right.ended, startedAt:Math.min(left.startedAt,right.startedAt), updatedAt:Math.max(left.updatedAt,right.updatedAt) };
  }

  function merge(left, right) {
    const result = clone(left);
    for (const difficulty of DIFFICULTIES) for (const key of METRICS) result.byDifficulty[difficulty][key] = Math.max(left.byDifficulty[difficulty][key],right.byDifficulty[difficulty][key]);
    const runs = new Map(left.recentRuns.map(run => [run.runId,clone(run)]));
    for (const run of right.recentRuns) runs.set(run.runId, runs.has(run.runId) ? mergeRun(runs.get(run.runId),run) : clone(run));
    result.recentRuns = [...runs.values()].sort((a,b) => b.updatedAt-a.updatedAt || (a.runId<b.runId?-1:a.runId>b.runId?1:0)).slice(0,MAX_RECENT_RUNS);
    for (const run of result.recentRuns) for (const key of METRICS) result.byDifficulty[run.difficulty][key] = Math.max(result.byDifficulty[run.difficulty][key],run[key]);
    result.updatedAt = Math.max(left.updatedAt,right.updatedAt,...result.recentRuns.map(run => run.updatedAt));
    return summarize(result);
  }

  function validate(value) {
    if (!object(value) || value.version !== VERSION || !object(value.byDifficulty) || !Array.isArray(value.recentRuns) || value.recentRuns.length > MAX_RECENT_RUNS) invalid('format ou version');
    const profile = empty();
    profile.updatedAt = counter(value.updatedAt,'date');
    for (const difficulty of DIFFICULTIES) profile.byDifficulty[difficulty] = metrics(value.byDifficulty[difficulty]);
    const ids = new Set();
    profile.recentRuns = value.recentRuns.map(value => {
      const run = { ...identity(value,false), ...metrics(value), startedAt:counter(value.startedAt,'début'), updatedAt:counter(value.updatedAt,'mise à jour') };
      if (typeof value.ended !== 'boolean' || run.updatedAt < run.startedAt || ids.has(run.runId)) invalid('historique');
      ids.add(run.runId); run.ended=value.ended; return run;
    });
    return merge(empty(),profile);
  }

  function parse(raw) {
    if (typeof raw !== 'string' || raw.length > MAX_PROFILE_BYTES) invalid('taille');
    return validate(JSON.parse(raw));
  }

  function create(storage, options = {}) {
    let profile = empty(), loaded = false, dirty = false, persisted = false, source = 'empty', lastError = null;
    const now = typeof options.now === 'function' ? options.now : Date.now;
    const result = changed => ({ profile:clone(profile), persisted, source, changed:Boolean(changed), error:lastError });

    function readStore() {
      const entries = [];
      let readError = false;
      for (const key of [PROFILE_KEY,BACKUP_KEY]) {
        let raw = null, data = null;
        try {
          if (!storage || typeof storage.getItem !== 'function') throw new Error('Unavailable storage');
          raw = storage.getItem(key);
          if (raw !== null) { try { data=parse(raw); } catch {} }
        } catch { readError=true; }
        entries.push({key,raw,data});
      }
      return { entries, readError, valid:entries.filter(entry => entry.data), invalid:entries.filter(entry => entry.raw !== null && !entry.data) };
    }

    function mergeStored(state) {
      let merged = profile;
      for (const entry of state.valid) merged=merge(merged,entry.data);
      profile=merged;
    }

    function load() {
      const state = readStore();
      try { mergeStored(state); }
      catch { lastError=issue('identity-conflict','Historique incohérent : les données existantes restent conservées.'); persisted=false; source='memory'; loaded=true; return result(false); }
      loaded=true;
      persisted=!dirty && state.valid.length>0;
      source=state.valid[0]?.key===PROFILE_KEY?'primary':state.valid.length?'backup':dirty?'memory':'empty';
      lastError=state.readError?issue('storage-unavailable','Historique local indisponible. Les nouveaux records restent en mémoire.'):
        state.invalid.length&&!state.valid.length?issue('profile-corrupt','Historique illisible conservé sans écrasement. Les nouveaux records restent en mémoire.'):
        state.invalid.length?issue('profile-recovered','Historique récupéré depuis une copie valide ; la copie illisible sera conservée avant réparation.'):null;
      return result(false);
    }

    function preserveCorruption(entries) {
      if (!entries.length) return;
      const previous=storage.getItem(RECOVERY_KEY);
      let recovery={version:VERSION,entries:[]};
      if(previous!==null){
        if(typeof previous!=='string'||previous.length>MAX_RECOVERY_BYTES)throw new Error('Recovery archive unavailable');
        recovery=JSON.parse(previous);
        if(!object(recovery)||recovery.version!==VERSION||!Array.isArray(recovery.entries)||recovery.entries.length>4||recovery.entries.some(entry=>!object(entry)||![PROFILE_KEY,BACKUP_KEY].includes(entry.key)||typeof entry.raw!=='string'))throw new Error('Recovery archive invalid');
      }
      for(const {key,raw} of entries)if(!recovery.entries.some(entry=>entry.key===key&&entry.raw===raw))recovery.entries.push({key,raw});
      const payload=JSON.stringify(recovery);
      if(recovery.entries.length>4||payload.length>MAX_RECOVERY_BYTES)throw new Error('Recovery archive full');
      if(payload!==previous)storage.setItem(RECOVERY_KEY,payload);
    }

    function save() {
      if(!loaded)load();
      const state=readStore();
      if(state.readError){persisted=false;lastError=issue('storage-unavailable','Historique local indisponible. Les nouveaux records restent en mémoire.');return result(false);}
      if(state.invalid.length&&!state.valid.length){persisted=false;lastError=issue('profile-corrupt','Historique illisible conservé sans écrasement. Les nouveaux records restent en mémoire.');return result(false);}
      try {
        mergeStored(state);
        if(!storage||typeof storage.setItem!=='function')throw new Error('Unavailable storage');
        const payload=JSON.stringify(profile);
        if(payload.length>MAX_PROFILE_BYTES)throw new Error('Profile too large');
        preserveCorruption(state.invalid);
        // Preserve the old primary exactly unless the backup contains additional history.
        // In that case make their union durable first: a later primary quota failure
        // must not erase records that existed only in the formerly divergent backup.
        const oldPrimary=state.entries.find(entry=>entry.key===PROFILE_KEY&&entry.data);
        const oldBackup=state.entries.find(entry=>entry.key===BACKUP_KEY&&entry.data);
        let backup=oldPrimary?oldPrimary.raw:state.valid[0]?state.valid[0].raw:payload;
        if(oldPrimary&&oldBackup){const durable=merge(oldPrimary.data,oldBackup.data);if(JSON.stringify(durable)!==JSON.stringify(oldPrimary.data))backup=JSON.stringify(durable);}
        if(state.entries[1].raw!==backup)storage.setItem(BACKUP_KEY,backup);
        if(state.entries[0].raw!==payload)storage.setItem(PROFILE_KEY,payload);
        dirty=false;persisted=true;source='primary';lastError=null;
      } catch {
        dirty=true;persisted=false;source='memory';lastError=issue('storage-write-failed','Écriture des records impossible. L’historique existant est conservé et les nouveaux records restent en mémoire.');
      }
      return result(false);
    }

    function record(snapshot) {
      if(!loaded)load();
      let incoming;
      try {
        const id=identity(snapshot,true), ended=snapshot.ended===undefined?false:snapshot.ended;
        if(typeof ended!=='boolean')invalid('état de partie');
        incoming={...id,wavesSurvived:counter(snapshot.wavesSurvived,'vagues survécues'),kills:counter(snapshot.kills,'infectés éliminés'),playSeconds:counter(snapshot.playSeconds,'durée',false),peakPopulation:counter(snapshot.population,'population'),peakBuildings:counter(snapshot.buildings,'structures'),ended};
        const previous=profile.recentRuns.find(run=>run.runId===incoming.runId);
        if(previous&&(previous.seed!==incoming.seed||previous.difficulty!==incoming.difficulty))invalid('identifiant réutilisé');
        if(previous){
          for(const key of METRICS)incoming[key]=Math.max(incoming[key],previous[key]);
          incoming.ended ||= previous.ended;
          if(METRICS.every(key=>incoming[key]===previous[key])&&incoming.ended===previous.ended){if(persisted)lastError=null;return dirty?save():result(false);}
        }
        const stamp=counter(Math.max(counter(now(),'date'),profile.updatedAt+1),'date');
        incoming.startedAt=previous?.startedAt??stamp;incoming.updatedAt=stamp;
        const update=empty();update.updatedAt=stamp;update.recentRuns=[incoming];
        profile=merge(profile,update);dirty=true;source='memory';
      } catch {
        lastError=issue('invalid-snapshot','Record refusé : les données de cette partie sont invalides ou son identifiant est réutilisé.');
        return result(false);
      }
      const saved=save();saved.changed=true;return saved;
    }

    return Object.freeze({ load, save, record, get:()=>clone(profile) });
  }

  const api={VERSION,PROFILE_KEY,BACKUP_KEY,RECOVERY_KEY,MAX_RECENT_RUNS,MAX_PROFILE_BYTES,normalizeSeed,validate,create,load:storage=>create(storage).load()};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.DeadwallProfile=api;
})(typeof globalThis!=='undefined'?globalThis:this);
