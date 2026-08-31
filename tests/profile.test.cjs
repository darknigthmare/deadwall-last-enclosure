'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const P=require('../src/profile.js');

function memory(initial={}) {
  const values=new Map(Object.entries(initial)), reads=[], writes=[];
  const store={values,reads,writes,readError:false,failKey:null,
    getItem(key){reads.push(key);if(this.readError)throw new Error('Storage denied');return values.get(key)??null;},
    setItem(key,value){writes.push({key,value});if(this.failKey===key||this.failKey==='all')throw new Error('Quota exceeded');values.set(key,String(value));}
  };
  return store;
}
const snapshot=(extra={})=>({runId:'run-1',seed:123,difficulty:'standard',wavesSurvived:3,kills:24,playSeconds:90.5,population:8,buildings:12,ended:false,...extra});
function controller(store=memory()) {let tick=1000;return P.create(store,{now:()=>++tick});}
function storedProfile(extra={}) {const store=memory();controller(store).record(snapshot(extra));return store.values.get(P.PROFILE_KEY);}

test('cartes : graines canoniques bornées, vide laissé au tirage aléatoire du jeu',()=>{
  for(const empty of ['', '   ', '\n\t', null, undefined])assert.equal(P.normalizeSeed(empty),null);
  for(const [input,expected]of [['000000001',1],[' 123 ',123],[0,0],['0000000001',1],[999999999,999999999],['4294967295',4294967295]])assert.equal(P.normalizeSeed(input),expected);
  for(const invalid of [-1,1.5,4294967296,Infinity,NaN,{},true,'1e3','0x10','+2','-2','2.0','1 000','１２３','123a','00000000001'])assert.throws(()=>P.normalizeSeed(invalid),RangeError,String(invalid));
});

test('profil : lecture vide sans écriture et copies indépendantes',()=>{
  const store=memory(),p=controller(store),loaded=p.load();
  assert.equal(loaded.source,'empty');assert.equal(loaded.persisted,false);assert.equal(loaded.error,null);assert.equal(store.writes.length,0);
  assert.deepEqual(loaded.profile.summary,{retainedRuns:0,completedRuns:0,inProgressRuns:0});
  loaded.profile.byDifficulty.standard.kills=900;assert.equal(p.get().byDifficulty.standard.kills,0);
  assert.deepEqual([...new Set(store.reads)].sort(),[P.PROFILE_KEY,P.BACKUP_KEY].sort());
});

test('records : chaque sauvegarde met à jour la même partie et conserve les pics',()=>{
  const store=memory(),p=controller(store);
  assert.equal(p.record(snapshot()).persisted,true);
  const writes=store.writes.length;
  assert.equal(p.record(snapshot()).changed,false);assert.equal(store.writes.length,writes);
  for(let i=1;i<=40;i++)p.record(snapshot({playSeconds:90.5+i,population:4,buildings:5}));
  const completed=p.record(snapshot({wavesSurvived:7,kills:66,playSeconds:140,population:2,buildings:1,ended:true}));
  assert.deepEqual(completed.profile.summary,{retainedRuns:1,completedRuns:1,inProgressRuns:0});
  assert.equal(completed.profile.recentRuns[0].peakPopulation,8);assert.equal(completed.profile.recentRuns[0].peakBuildings,12);
  const older=p.record(snapshot({wavesSurvived:1,kills:1,playSeconds:1,population:1,buildings:0,ended:false}));
  assert.equal(older.changed,false);assert.equal(older.profile.recentRuns[0].ended,true);
  assert.equal(older.profile.byDifficulty.standard.wavesSurvived,7);assert.equal(older.profile.byDifficulty.standard.kills,66);
});

test('records : difficultés séparées et vague atteinte non confondue avec vague survécue',()=>{
  const p=controller();p.record(snapshot({difficulty:'story',runId:'story',wavesSurvived:30}));p.record(snapshot({runId:'standard',wave:999,wavesSurvived:3}));
  const result=p.record(snapshot({difficulty:'brutal',runId:'brutal',wavesSurvived:1})).profile;
  assert.equal(result.byDifficulty.story.wavesSurvived,30);assert.equal(result.byDifficulty.standard.wavesSurvived,3);assert.equal(result.byDifficulty.brutal.wavesSurvived,1);
});

test('historique : dix parties uniques maximum sans perdre les records plus anciens',()=>{
  const p=controller();
  for(let i=0;i<25;i++)p.record(snapshot({runId:`run-${i}`,seed:i+1,wavesSurvived:i===0?200:2,ended:i%2===0}));
  const current=p.get();assert.equal(current.recentRuns.length,10);assert.equal(new Set(current.recentRuns.map(run=>run.runId)).size,10);
  assert.equal(current.byDifficulty.standard.wavesSurvived,200);assert.equal(current.summary.retainedRuns,10);assert.equal(current.summary.completedRuns,5);
  assert.ok(!current.recentRuns.some(run=>run.runId==='run-0'));
  p.record(snapshot({runId:'run-24',seed:25,wavesSurvived:2,ended:true}));assert.equal(p.get().recentRuns.length,10);
  p.record(snapshot({runId:'run-0',seed:1,wavesSurvived:200,ended:true}));assert.equal(p.get().recentRuns.length,10);assert.equal(p.get().summary.retainedRuns,10);
});

test('identité : anciens fichiers ont un identifiant stable, nouvelles graines restent distinctes',()=>{
  const p=controller();for(let i=0;i<10;i++)p.record(snapshot({runId:undefined,playSeconds:100+i}));
  assert.equal(p.get().recentRuns.length,1);assert.equal(p.get().recentRuns[0].runId,'legacy:standard:123');
  p.record(snapshot({runId:undefined,seed:456}));assert.equal(p.get().recentRuns.length,2);
  p.record(snapshot({runId:undefined,seed:0xffffffff}));assert.ok(p.get().recentRuns.some(run=>run.seed===0xffffffff));
});

test('identité : réutiliser un runId avec une autre carte ou difficulté ne modifie rien',()=>{
  const store=memory(),p=controller(store);p.record(snapshot());const before=p.get(),raw=store.values.get(P.PROFILE_KEY),writes=store.writes.length;
  for(const extra of [{seed:456},{difficulty:'brutal'}]){const result=p.record(snapshot(extra));assert.equal(result.error.code,'invalid-snapshot');assert.equal(result.changed,false);assert.deepEqual(result.profile,before);}
  assert.equal(store.values.get(P.PROFILE_KEY),raw);assert.equal(store.writes.length,writes);
});

test('validation : snapshot malformé ou compteur invalide préserve le profil sain',()=>{
  const store=memory(),p=controller(store);p.record(snapshot());const before=p.get(),raw=store.values.get(P.PROFILE_KEY);
  for(const extra of [{kills:NaN},{kills:Infinity},{kills:1.5},{kills:-1},{wavesSurvived:'8'},{population:[]},{buildings:-1},{playSeconds:Infinity},{ended:'yes'},{seed:2**32},{runId:'<script>'},{runId:'a'.repeat(129)},{difficulty:'impossible'}]){
    const result=p.record(snapshot(extra));assert.equal(result.error.code,'invalid-snapshot');assert.deepEqual(result.profile,before);
  }
  assert.equal(p.record(null).error.code,'invalid-snapshot');assert.equal(store.values.get(P.PROFILE_KEY),raw);
});

test('récupération : backup chargé et contenu corrompu archivé avant réparation',()=>{
  const valid=storedProfile({wavesSurvived:9}),bad='{historique cassé';
  const store=memory({[P.PROFILE_KEY]:bad,[P.BACKUP_KEY]:valid}),p=controller(store);
  const loaded=p.load();assert.equal(loaded.source,'backup');assert.equal(loaded.profile.byDifficulty.standard.wavesSurvived,9);assert.equal(store.writes.length,0);
  const saved=p.record(snapshot({wavesSurvived:11}));assert.equal(saved.persisted,true);assert.equal(saved.error,null);
  assert.equal(JSON.parse(store.values.get(P.RECOVERY_KEY)).entries[0].raw,bad);
  assert.equal(P.validate(JSON.parse(store.values.get(P.PROFILE_KEY))).byDifficulty.standard.wavesSurvived,11);
  assert.equal(store.values.get(P.BACKUP_KEY),valid);
});

test('récupération : deux copies illisibles ou version future ne sont jamais remplacées par un profil vide',()=>{
  for(const primary of ['{cassé','',JSON.stringify({version:999})]){
    const store=memory({[P.PROFILE_KEY]:primary,[P.BACKUP_KEY]:'backup-cassé'}),p=controller(store);
    assert.equal(p.load().error.code,'profile-corrupt');
    const saved=p.record(snapshot());assert.equal(saved.persisted,false);assert.equal(saved.error.code,'profile-corrupt');assert.equal(saved.profile.byDifficulty.standard.kills,24);
    assert.equal(store.values.get(P.PROFILE_KEY),primary);assert.equal(store.values.get(P.BACKUP_KEY),'backup-cassé');assert.equal(store.writes.length,0);
  }
});

test('quota : échec de copie de secours laisse le primaire intact et permet de réessayer',()=>{
  const store=memory(),p=controller(store);p.record(snapshot({wavesSurvived:1}));p.record(snapshot({wavesSurvived:2}));
  const primary=store.values.get(P.PROFILE_KEY),backup=store.values.get(P.BACKUP_KEY);store.failKey=P.BACKUP_KEY;
  const failed=p.record(snapshot({wavesSurvived:10}));assert.equal(failed.persisted,false);assert.equal(failed.error.code,'storage-write-failed');assert.equal(failed.profile.byDifficulty.standard.wavesSurvived,10);
  assert.equal(store.values.get(P.PROFILE_KEY),primary);assert.equal(store.values.get(P.BACKUP_KEY),backup);
  store.failKey=null;const saved=p.save();assert.equal(saved.persisted,true);assert.equal(P.load(store).profile.byDifficulty.standard.wavesSurvived,10);
});

test('quota : échec du primaire conserve le dernier historique valide dans les deux clés',()=>{
  const store=memory(),p=controller(store);p.record(snapshot({wavesSurvived:1}));p.record(snapshot({wavesSurvived:2}));const old=store.values.get(P.PROFILE_KEY);store.failKey=P.PROFILE_KEY;
  const failed=p.record(snapshot({wavesSurvived:20}));assert.equal(failed.persisted,false);assert.equal(store.values.get(P.PROFILE_KEY),old);assert.equal(store.values.get(P.BACKUP_KEY),old);
  assert.equal(P.load(store).profile.byDifficulty.standard.wavesSurvived,2);
  store.failKey=null;assert.equal(p.save().persisted,true);assert.equal(P.load(store).profile.byDifficulty.standard.wavesSurvived,20);
});

test('quota : primaire ancien et backup divergent gardent leurs deux historiques après échec',()=>{
  const primary=storedProfile({runId:'alpha',wavesSurvived:4}),backup=storedProfile({runId:'beta',difficulty:'brutal',wavesSurvived:15});
  const store=memory({[P.PROFILE_KEY]:primary,[P.BACKUP_KEY]:backup}),p=controller(store);
  store.failKey=P.PROFILE_KEY;
  const failed=p.record(snapshot({runId:'gamma',difficulty:'story',wavesSurvived:9}));
  assert.equal(failed.persisted,false);assert.equal(store.values.get(P.PROFILE_KEY),primary);
  const durable=P.load(store).profile;
  assert.deepEqual(durable.recentRuns.map(run=>run.runId).sort(),['alpha','beta']);
  assert.equal(durable.byDifficulty.standard.wavesSurvived,4);assert.equal(durable.byDifficulty.brutal.wavesSurvived,15);
  assert.equal(failed.profile.byDifficulty.story.wavesSurvived,9);
  store.failKey=null;assert.equal(p.save().persisted,true);assert.equal(P.load(store).profile.recentRuns.length,3);
});

test('stockage désactivé : records en mémoire, aucun accès à un autre profil et reprise sans perte',()=>{
  const store=memory(),p=controller(store);store.readError=true;
  const result=p.record(snapshot({wavesSurvived:8}));assert.equal(result.persisted,false);assert.equal(result.error.code,'storage-unavailable');assert.equal(result.profile.byDifficulty.standard.wavesSurvived,8);assert.equal(store.writes.length,0);
  store.readError=false;assert.equal(p.save().persisted,true);assert.equal(P.load(store).profile.byDifficulty.standard.wavesSurvived,8);
  assert.ok(store.reads.every(key=>[P.PROFILE_KEY,P.BACKUP_KEY,P.RECOVERY_KEY].includes(key)));
  assert.equal(P.create(null).record(snapshot()).persisted,false);
});

test('écritures successives de deux contrôleurs fusionnent leurs records avant sauvegarde',()=>{
  const store=memory(),first=controller(store),second=controller(store);first.load();second.load();
  first.record(snapshot({runId:'alpha',wavesSurvived:12}));second.record(snapshot({runId:'beta',difficulty:'brutal',wavesSurvived:4}));first.record(snapshot({runId:'alpha',wavesSurvived:13}));
  const restored=P.load(store).profile;assert.equal(restored.recentRuns.length,2);assert.equal(restored.byDifficulty.standard.wavesSurvived,13);assert.equal(restored.byDifficulty.brutal.wavesSurvived,4);
});

test('archive de récupération invalide : aucune écriture destructive sur les copies existantes',()=>{
  const valid=storedProfile(),store=memory({[P.PROFILE_KEY]:valid,[P.BACKUP_KEY]:'corrompu',[P.RECOVERY_KEY]:'archive invalide'}),p=controller(store);
  const result=p.record(snapshot({wavesSurvived:8}));assert.equal(result.persisted,false);assert.equal(store.values.get(P.PROFILE_KEY),valid);assert.equal(store.values.get(P.BACKUP_KEY),'corrompu');assert.equal(store.values.get(P.RECOVERY_KEY),'archive invalide');
});

test('validation persistante : format incomplet, doublons et dates invalides refusés',()=>{
  const valid=JSON.parse(storedProfile());assert.throws(()=>P.validate({version:1}),RangeError);
  for(const invalid of [{...valid,recentRuns:[valid.recentRuns[0],valid.recentRuns[0]]},{...valid,updatedAt:-1},{...valid,byDifficulty:{}},{...valid,recentRuns:[{...valid.recentRuns[0],startedAt:99999}]}])assert.throws(()=>P.validate(invalid),RangeError);
  const store=memory({[P.PROFILE_KEY]:'x'.repeat(P.MAX_PROFILE_BYTES+1)});assert.equal(P.load(store).error.code,'profile-corrupt');
});

test('module UMD : aucune dépendance réseau, moteur ou stockage à son évaluation',()=>{
  const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/profile.js'),'utf8'),sandbox);
  assert.equal(typeof sandbox.DeadwallProfile.create,'function');assert.equal(sandbox.DeadwallProfile.normalizeSeed('42'),42);
});
