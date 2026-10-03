'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let g,C;
test.before(()=>{g=bootDocument134().g;C=globalThis.DeadwallCore;});
function adjacentRemains(){
 g.startNew('standard','17117');g.campaignIntro132.skip();
 for(let i=0;i<2;i++){g.player.invulnerable=0;g.player.carry.food=i+1;g.damagePlayer(10000);assert.equal(g.successionUI133.choose('porter'),true);assert.equal(g.successionUI133.confirm(),true);}
 const w=g.frontier.world();let origin=null;
 for(let x=90;x<160&&!origin;x+=2)for(let y=90;y<160;y+=2){const p={x:w.home.x+x,y:w.home.y+y},end={x:p.x+1.1,y:p.y};if(!w.blocked(p.x,p.y,.8,0,null)&&!w.blocked(end.x,end.y,.8,0,null)&&w.line(p,end,0,null,null,.05)){origin=p;break;}}
 assert.ok(origin,'Fixture : deux contacts proches dans une aire régionale libre.');
 const raw=g.serialize();Object.assign(raw.frontier,{active:true,anchor:{x:g.player.x,y:g.player.y},x:origin.x,y:origin.y,a:0,z:0,inside:null,car:null});
 for(let i=0;i<raw.succession133.remains.length;i++){
  const r=raw.succession133.remains[i],p={domain:'region',x:origin.x+1+i*.1,y:origin.y,z:0,inside:null,angle:0};
  r.point=p;Object.assign(r.body,{phase:'risen',left:0,roll:0,x:p.x,y:p.y,health:C.SuccessionRules.health,zombieId:null});
 }
 assert.equal(g.restoreSave(raw),true);return g.succession133.contacts();
}
test('137 dépouilles adjacentes : une frappe en arc atteint chacune une seule fois et persiste sans déplacer les sacs',()=>{
 const contacts=adjacentRemains(),bags=g.succession133.remains().map(r=>r.bag);
 assert.equal(g.arsenal134.melee(),true);
 assert.deepEqual(g.succession133.contacts().map(e=>e.hp),contacts.map(e=>e.hp-C.SuccessionRules.unarmedDamage));
 assert.equal(g.save(false),true);assert.equal(g.load(),true);
 assert.deepEqual(g.succession133.contacts().map(e=>e.hp),contacts.map(e=>e.hp-C.SuccessionRules.unarmedDamage));
 assert.deepEqual(g.succession133.remains().map(r=>r.bag),bags);
});
test('137 dépouille ciblée : identifiant exact, étage et état vivant restent exigés sans retarget automatique',()=>{
 const [a,b]=adjacentRemains(),kills=g.stats.kills;
 assert.equal(g.succession133.hit(b.x,b.y,7,b.z,b.poi,b.id),true);
 assert.deepEqual(g.succession133.contacts().map(e=>e.hp),[a.hp,b.hp-7]);
 assert.equal(g.succession133.hit(b.x,b.y,7,1,b.poi,b.id),false);
 assert.equal(g.succession133.hit(b.x,b.y,7,b.z,b.poi,'fallen:missing'),false);
 assert.equal(g.succession133.hit(b.x,b.y,100,b.z,b.poi,b.id),true);
 assert.equal(g.stats.kills,kills+1);assert.equal(g.succession133.hit(b.x,b.y,100,b.z,b.poi,b.id),false);
 assert.equal(g.succession133.contacts()[0].hp,a.hp);assert.equal(g.stats.kills,kills+1);
 assert.equal(g.succession133.hit(a.x,a.y,3,a.z,a.poi),true,'Les appels historiques par point restent compatibles.');
});
test('137 tir de compagnon : la dépouille visée reçoit le tir même si un autre corps est à moins de quarante centimètres',()=>{
 const [a,b]=adjacentRemains();
 assert.equal(g.frontier.companionShot({x:b.x+.1,y:b.y,z:b.z,inside:b.poi},2,7),true);
 assert.deepEqual(g.succession133.contacts().map(e=>e.hp),[a.hp,b.hp-7]);
});
