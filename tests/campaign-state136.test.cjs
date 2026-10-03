'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let env,g,C;
test.before(()=>{env=bootDocument134();g=env.g;C=globalThis.DeadwallCore;});
function begin(){g.startNew('standard','17117');g.campaignIntro132.skip();assert.equal(g.frontier.position().generation,7);}
function successor(){g.player.invulnerable=0;g.damagePlayer(10000);assert.equal(g.successionUI133.isOpen(),true);assert.equal(g.successionUI133.choose('porter'),true);assert.equal(g.successionUI133.confirm(),true);}
function click(id){const b=env.doc.getElementById(id);assert.ok(env.doc.body.contains(b),id+' monté');assert.equal(b.disabled,false,id+' disponible');b.click();}
const text=n=>[n.textContent,...n.children.map(text)].join(' ');

test('136 relève assemblée : le bouton fabrique puis retire réellement l’arme du râtelier, sans paiement doublé',()=>{
 begin();const run=g.runId;successor();g.successionUI133.refresh();
 let row=g.succession133.view().requisitions.find(r=>r.id==='pistol');assert.equal(row.action,'craft');assert.deepEqual(row.cost,C.Arsenal134Rules.catalog.pistol.cost);
 assert.match(text(env.doc.getElementById('succession133Requisition-pistol')),/ASSEMBLER/);
 const scrap=g.resources.scrap,ammo=g.resources.ammo;click('succession133Requisition-pistol');assert.equal(g.arsenal134.busy(),true);assert.equal(g.resources.scrap,scrap);assert.equal(g.arsenal134.snapshot().carried.length,0);assert.match(g.succession133.view().message,/Assemblage en cours/);
 for(let i=0;i<200&&g.arsenal134.busy();i++)g.update(.04);assert.equal(g.arsenal134.busy(),false);assert.equal(g.resources.scrap,scrap-row.cost.scrap);
 g.successionUI133.refresh();row=g.succession133.view().requisitions.find(r=>r.id==='pistol');assert.equal(row.action,'take');assert.equal(row.allowed,true);assert.match(text(env.doc.getElementById('succession133Requisition-pistol')),/PRENDRE/);
 const saved=g.serialize(),uid=row.uid;assert.equal(g.restoreSave(saved),true);assert.equal(g.succession133.view().requisitions.find(r=>r.id==='pistol').uid,uid);
 g.successionUI133.refresh();click('succession133Requisition-pistol');const a=g.arsenal134.snapshot();assert.equal(a.equipped,uid);assert.equal(a.carried.find(i=>i.uid===uid).rounds,0);assert.equal(a.locker.some(i=>i.uid===uid),false);assert.equal(g.resources.scrap,scrap-C.Arsenal134Rules.catalog.pistol.cost.scrap);assert.equal(g.resources.ammo,ammo);assert.equal(g.runId,run);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.arsenal134.snapshot().equipped,uid);
});

test('136 réquisition : atelier occupé ou menacé indisponible ; départ refusé conserve le travail en cours',()=>{
 begin();successor();assert.equal(g.succession133.requisition('pistol'),true);g.arsenal134.step(.1);const task=g.arsenal134.view().task,world=g.world,remains=g.succession133.remains(),stock={...g.resources};g.previewMapSeed135=84329;
 assert.equal(g.startNew('standard','incorrect'),false);assert.equal(g.world,world);assert.deepEqual(g.arsenal134.view().task,task);assert.deepEqual(g.succession133.remains(),remains);assert.deepEqual(g.resources,stock);assert.equal(g.previewMapSeed135,84329);assert.equal(g.succession133.view().requisitions.find(r=>r.id==='pistol').allowed,false);
 g.arsenal134.cancel();g.spawnZombie('walker');const z=g.zombies.at(-1);Object.assign(z,{x:g.player.x+50,y:g.player.y});g.buckets.clear();const key=Math.floor(z.x/g.bucketSize)+Math.floor(z.y/g.bucketSize)*1000;g.buckets.set(key,[z]);
 const row=g.succession133.view().requisitions.find(r=>r.id==='pistol');assert.equal(row.allowed,false);assert.match(row.reason,/Sécurisez/);assert.equal(g.succession133.requisition('pistol'),false);assert.deepEqual(g.resources,stock);
});

test('136 mains libres : les armes simplement portées ne donnent pas les dégâts de crosse',()=>{
 begin();const raw=g.serialize();raw.expansions127.modules.arsenal134.equipped=null;raw.player.magazine={pistol:0,rifle:0,shotgun:0};g.restoreSave(raw);
 assert.ok(g.succession133.ownsWeapon('pistol'));assert.equal(g.arsenal134.visualEquipment(),null);assert.equal(g.succession133.meleeDamage(),C.SuccessionRules.unarmedDamage);assert.equal(g.save(false),true);
});

test('136 reprise : sauvegarde 1.34 conserve G5 et récupération de secours reste transactionnelle',()=>{
 begin();const legacy=JSON.parse(fs.readFileSync(require.resolve('../reports/1.35.0/legacy-g5-start-save.json'),'utf8'));
 assert.equal(g.restoreSave(legacy),true);const original=g.serialize();assert.equal(original.frontier.generation,5);assert.equal(g.frontier.world().home.x,4096);assert.deepEqual(original.frontier.taken,legacy.frontier.taken);assert.equal(g.save(false),true);
 localStorage.setItem(C.SAVE_BACKUP_KEY,JSON.stringify(original));localStorage.setItem(C.SAVE_KEY,'{ invalid');const warn=console.warn;console.warn=()=>{};try{assert.equal(g.load(),true);}finally{console.warn=warn;}
 assert.equal(g.frontier.position().generation,5);assert.equal(g.world.seed,original.worldSeed);assert.equal(g.runId,original.runId);assert.deepEqual(g.serialize().expansions127.modules,original.expansions127.modules);
 const world=g.world,bad=g.serialize();bad.succession133.current.profile='absent';assert.throws(()=>g.restoreSave(bad));assert.equal(g.world,world);assert.deepEqual(g.serialize().frontier,original.frontier);
});

test('136 relève : une arme déjà chargée au râtelier est reprise sans fabriquer ni perdre ses cartouches',()=>{
 begin();const item=g.arsenal134.snapshot().carried.find(i=>i.id==='pistol');assert.equal(g.arsenal134.transfer(item.uid,'locker').ok,true);successor();
 const row=g.succession133.view().requisitions.find(r=>r.id==='pistol'),scrap=g.resources.scrap,ammo=g.resources.ammo;assert.equal(row.action,'take');assert.equal(row.uid,item.uid);assert.equal(row.rounds,item.rounds);assert.equal(g.succession133.requisition('pistol'),true);
 const carried=g.arsenal134.snapshot().carried.find(i=>i.uid===item.uid);assert.deepEqual(carried,item);assert.equal(g.player.magazine.pistol,item.rounds);assert.equal(g.resources.scrap,scrap);assert.equal(g.resources.ammo,ammo);assert.equal(g.arsenal134.busy(),false);assert.equal(g.save(false),true);
});
