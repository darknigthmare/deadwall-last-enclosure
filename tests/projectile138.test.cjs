'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
function scene(side=1,distance=16){
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 g.player.carry.wood=10;g.player.carry.scrap=2;
 const t=globalThis.DeadwallBarricades134.localTargets(g.exploration125.plan).find(t=>t.id==='local:station-1:window:broken-east');assert.ok(t);
 const n={x:-Math.sin(t.angle)*side,y:Math.cos(t.angle)*side},p={x:t.x+n.x*distance,y:t.y+n.y*distance},q={x:t.x-n.x*42,y:t.y-n.y*42},work={x:t.x+n.x*32,y:t.y+n.y*32};
 assert.ok(g.friendlyPositionClear(g.player,work.x,work.y));assert.ok(g.hostilePositionClear({radius:12},q.x,q.y));assert.equal(g.exploration125.firstObstruction(p,q,2,true),null,'La fenêtre générée est ouverte avant renforcement');
 Object.assign(g.player,work);assert.equal(g.barricades134.begin('build',t.id,'planks').ok,true);while(g.barricades134.busy())g.barricades134.step(.1);
 g.random.range=(a,b)=>(a+b)/2;g.random.chance=()=>false;
 g.spawnZombie('walker');const z=g.zombies.at(-1);Object.assign(z,q);g.rebuildBuckets();
 const angle=Math.atan2(q.y-p.y,q.x-p.x);Object.assign(g.player,p,{facing:angle,shootCooldown:0});
 return{g,t,p,q,z,angle};
}
for(const side of [1,-1])test('Projectiles 1.38 : une barricade proche arrête le tir du joueur, face '+side,()=>{
 const {g,t,p,q,z,angle}=scene(side);assert.ok(g.friendlyPositionClear(g.player,p.x,p.y),'Tireur sur un emplacement physique libre');
 assert.ok(g.barricades134.firstObstruction(p,q,2));const health=z.health,spec=g.arsenal134.weaponSpec(),ammo=g.player.magazine.pistol,condition=g.arsenal134.snapshot().carried.find(i=>i.id==='pistol').condition,stock={...g.resources};
 assert.equal(health,z.maxHealth,'La scène conserve la santé réelle du profil infecté.');
 g.shootPlayer();g.updateProjectiles(.1);
 assert.equal(z.health,health,'La balle ne naît pas derrière la barricade');assert.equal(g.barricades134.snapshot().records.find(r=>r.target===t.id).hp,120-spec.damage);
 assert.equal(g.player.magazine.pistol,ammo-1);assert.equal(g.stats.shots,1);assert.equal(g.arsenal134.snapshot().carried.find(i=>i.id==='pistol').condition,condition-spec.wear);assert.deepEqual(g.resources,stock);
 assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.barricades134.snapshot().records.find(r=>r.target===t.id).hp,120-spec.damage);assert.equal(g.zombies.find(e=>e.id===z.id).health,health);
 // Once physically destroyed, the same opening again permits a normal shot.
 assert.equal(g.barricades134.damage(t.id,1000),true);assert.equal(g.barricades134.firstObstruction(p,q,2),null);
 // Aim and RNG controls are transient test inputs, and the ordinary Game.update
 // rebuilds this spatial index before resolving projectiles after a load.
 g.player.facing=angle;g.player.shootCooldown=0;g.random.range=(a,b)=>(a+b)/2;g.random.chance=()=>false;g.rebuildBuckets();
 g.shootPlayer();assert.equal(g.projectiles.length,1);assert.equal(g.projectiles[0].damage,spec.damage);g.updateProjectiles(.1);
 assert.equal(g.zombies.find(e=>e.id===z.id).health,health-spec.damage);assert.equal(g.player.magazine.pistol,ammo-2);assert.equal(g.stats.shots,2);assert.deepEqual(g.resources,stock);
});
test('Projectiles 1.38 : les tirs alliés respectent aussi leur segment de départ',()=>{
 const {g,t,p,z,angle}=scene(1,12.2);assert.ok(g.friendlyPositionClear({radius:10},p.x,p.y));
 const health=z.health,stock={...g.resources};g.fireFriendly(p.x,p.y,angle,31,520,'#ffe0a0');g.updateProjectiles(.1);
 assert.equal(z.health,health);assert.equal(g.barricades134.snapshot().records.find(r=>r.target===t.id).hp,89);assert.deepEqual(g.resources,stock);assert.equal(g.stats.headshots,0);
});
