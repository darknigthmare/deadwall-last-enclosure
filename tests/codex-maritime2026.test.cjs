'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../scripts/codex-maritime2026.cjs'),F=require('../scripts/codex-world-foundations2026.cjs');
const clone=v=>JSON.parse(JSON.stringify(v)),sample=()=>clone(M.build('EXT-MONDE-T006',1));
test('250 distinct maritime layouts retain reference lengths, widths and unknown real heights',()=>{
 const audit=M.auditAll();assert.equal(audit.variants,250);assert.equal(audit.playable,0);
 for(const type of Object.keys(M.PROFILES)){const variants=new Set();for(let n=1;n<=50;n++){
  const p=M.build(type,n);assert.deepEqual(p,M.build(type,n));assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.rooms));assert.equal(M.audit(p).ok,true);
  assert.equal(p.reference.realTotalHeightM,null);assert.equal(p.playable,false);assert.equal(p.hull.w,p.reference.lengthM);assert.equal(p.hull.h,p.reference.beamM);
  variants.add(JSON.stringify(p.rooms.map(r=>[r.x,r.y,r.w,r.h,r.z])));
  assert.ok(p.boarding.every(b=>b.connectedToWorld===false));assert.ok(p.reservations.every(r=>r.walkable===false));
 }assert.equal(variants.size,50,type);}
});
test('keel, waterline, deck elevation and air draft use different declared datums',()=>{
 const p=M.build('EXT-MONDE-T006',1);assert.equal(p.reference.lengthM,183.06);assert.equal(p.reference.beamM,32.2);assert.equal(p.reference.draftM,13.258);
 assert.equal(p.mainDeck.keelHeightM,19.2);assert.equal(p.mainDeck.elevationM,19.2-13.258);assert.ok(p.levels.some(l=>l.elevationM<0));
 for(const type of Object.keys(M.PROFILES)){const q=M.build(type,1);assert.equal(q.hull.keelElevationM,-q.reference.draftM);assert.equal(q.authorTopKeelM-q.reference.draftM,q.authorAirDraftM);}
});
test('the cargo hold keeps its reference dimensions and is not falsely declared accessible',()=>{
 const r=M.build('EXT-MONDE-T005',50).reservations[0];assert.equal(r.w,60.35);assert.equal(r.h,12.6);assert.equal(r.clearHeightM,9.59);assert.equal(r.walkable,false);assert.equal(r.connected,false);
});
test('all compartments have located doors; every declared node is connected to boarding',()=>{
 for(const type of Object.keys(M.PROFILES)){const p=M.build(type,37);assert.equal(p.portals.length,p.rooms.filter(r=>r.kind==='compartment').length);assert.ok(M.audit(p).ok);assert.ok(p.portals.every(d=>d.widthM>=.85));}
});
test('vertical links never become same-level corridors, distant teleports or uncontrolled gaps',()=>{
 for(const mutate of [p=>p.links.find(e=>e.kind==='stairs').kind='corridor',p=>p.nodes.find(n=>n.id.endsWith('deck-1:shaft')).x+=3,p=>p.nodes.find(n=>n.id.endsWith('deck-1:shaft')).z+=15]){const p=sample();mutate(p);assert.equal(M.audit(p).ok,false);}
});
test('a wrong door path, off-wall portal or disconnected room is refused',()=>{
 for(const mutate of [p=>p.portals[0].x+=5,p=>p.portals[0].y+=1,p=>p.portals.pop(),p=>p.links.find(e=>e.kind==='door').from=p.nodes[0].id,p=>p.links.find(e=>e.kind==='door').widthM=.2]){const p=sample();mutate(p);assert.equal(M.audit(p).ok,false);}
});
test('full corridor width, not just node connectivity, is checked',()=>{const p=sample();p.links.find(e=>e.kind==='corridor').widthM=20;assert.ok(M.audit(p).errors.includes('corridor-width'));});
test('rooms crossing hull, decks, neighbouring rooms or closed tank volumes are refused',()=>{
 for(const mutate of [p=>p.rooms[1].x=-1,p=>p.rooms[1].h=30,p=>p.rooms[1].z=p.rooms[0].z+1,p=>{p.rooms[2].x=p.rooms[1].x;p.rooms[2].y=p.rooms[1].y;},p=>{const tank=p.reservations[0],room=p.rooms[1];room.x=tank.x;room.y=tank.y;room.z=tank.z;}]){const p=sample();mutate(p);assert.equal(M.audit(p).ok,false);}
});
test('reservations, new vehicle access, invented real heights and false world connections fail closed',()=>{
 for(const mutate of [p=>p.reservations[0].walkable=true,p=>p.reservations[0].connected=true,p=>p.links[0].modes.push('vehicle'),p=>p.reference.realTotalHeightM=20,p=>p.boarding[0].connectedToWorld=true,p=>p.hull.w+=1,p=>p.playable=true]){const p=sample();mutate(p);assert.equal(M.audit(p).ok,false);}
});
test('malformed shapes, missing endpoints, repeated IDs and nonfinite coordinates fail closed',()=>{
 for(const bad of [null,{},[],{...sample(),rooms:[null]},{...sample(),hull:null}])assert.equal(M.audit(bad).ok,false);
 for(const mutate of [p=>p.nodes[0].x=NaN,p=>p.links[0].from='absent',p=>p.links.push({...p.links[0]}),p=>p.rooms[1].w=Infinity,p=>p.nodes.push({...p.nodes[0]})]){const p=sample();mutate(p);assert.equal(M.audit(p).ok,false);}
});
test('only named typologies and integer variants are accepted; references cannot be silently omitted',()=>{
 for(const type of ['unknown','__proto__',null])assert.throws(()=>M.build(type,1));for(const n of [0,51,'1',1.5,NaN])assert.throws(()=>M.build('EXT-MONDE-T005',n));
 const r=F.refs();r.metrics=r.metrics.filter(m=>m.id!=='cargo.length');assert.throws(()=>M.build('EXT-MONDE-T005',1,r),/absente/);
});
test('inspection never mutates plans or reference data and declares no loot or spawn budget',()=>{
 const ref=F.refs(),before=JSON.stringify(ref),p=M.build('EXT-MONDE-T008',50,ref),serialized=JSON.stringify(p);M.audit(p);assert.equal(JSON.stringify(p),serialized);assert.equal(JSON.stringify(ref),before);assert.doesNotMatch(serialized,/"(?:amount|resource|spawnWeight)":/);
});
