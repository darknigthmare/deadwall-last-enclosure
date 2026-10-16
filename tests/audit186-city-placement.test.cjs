'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const fixtures=import('../scripts/browser-city-fixtures150.mjs');
const intersects=(actor,site,margin,C)=>{
 const d=C.BUILDINGS[site.type],l=site.gx*32,t=site.gy*32,r=l+d.size[0]*32,b=t+d.size[1]*32;
 return actor.x+actor.radius+margin>l&&actor.x-actor.radius-margin<r&&actor.y+actor.radius+margin>t&&actor.y-actor.radius-margin<b;
};
for(const request of ['casemate150','electricCannery150','continuityArsenal150',{type:'casemate150',protectCore:true}])test('186 construction fixture '+JSON.stringify(request)+' avoids an occupied safety margin without moving workers or gifting resources',async()=>{
 const type=typeof request==='string'?request:request.type,F=await fixtures,{g}=bootDocument134(),C=globalThis.DeadwallCore;
 g.startNew('standard','17117');g.campaignIntro132.skip();g.togglePause(true);F.prepareAge150(10);F.prepareSupports150();
 const initial=F.prepareConstruction150(request),d=C.BUILDINGS[type],u=g.units.find(u=>u.kind==='worker'),r=u.radius;
 const l=initial.site.gx*32,t=initial.site.gy*32,right=l+d.size[0]*32,bottom=t+d.size[1]*32;
 const positions=[{x:(l+right)/2,y:bottom+r+2},{x:(l+right)/2,y:t-r-2},{x:l-r-2,y:(t+bottom)/2},{x:right+r+2,y:(t+bottom)/2}];
 const p=positions.find(p=>g.friendlyPositionClear(u,p.x,p.y));assert.ok(p,'a legal exposed test position exists');
 Object.assign(u,p);const before=g.serialize(),rng=g.random.state,actors=before.units.map(u=>({id:u.id,x:u.x,y:u.y,health:u.health,carry:u.carry,carryType:u.carryType}));
 assert.equal(intersects(u,initial.site,0,C),false,'original body-only test admitted this actor');
 assert.equal(intersects(u,initial.site,5,C),true,'real construction input rejects its five-unit safety overlap');
 const selected=F.prepareConstruction150(request),after=g.serialize();
 assert.ok(!g.units.some(a=>intersects(a,selected.site,37,C)),'selected site respects the existing worker-clearance buffer, not only body bounds');
 assert.deepEqual(after.units.map(u=>({id:u.id,x:u.x,y:u.y,health:u.health,carry:u.carry,carryType:u.carryType})),actors);
 assert.deepEqual(after.resources,before.resources);assert.deepEqual(after.buildings,before.buildings);assert.deepEqual(after.nodes,before.nodes);assert.equal(g.random.state,rng);
 assert.ok(g.world.placement(d,selected.site.gx,selected.site.gy,0).valid,'the replacement footprint is legally free');
});
test('186 placement still revalidates every body and margin synchronously at the actual payment',()=>{
 const source=fs.readFileSync('scripts/browser-city-content150.mjs','utf8');
 assert.ok(source.includes('const finalPlacement = await chooseSite(page, type, { gx: site.gx, gy: site.gy });'));
 assert.ok(source.includes('payment.placement.actors.length === 0'));
 assert.ok(source.includes('const margin = 5 + 32;'),'ordinary movement-clearance test was not relaxed');
 assert.ok(source.includes("await activate(page, '[data-worker-order=\"harvest\"]', touch)"));
});
