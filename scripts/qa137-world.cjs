'use strict';
// Production HTML order; the DOM is simulated. Only long-distance approaches and
// cleared threats are prepared. Movement, stairs, harvest and persistence are real.
const assert=require('node:assert/strict');
const {bootDocument134}=require('./qa-startup134.cjs');
const copy=v=>JSON.parse(JSON.stringify(v));
function start(){const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();assert.equal(g.frontier.position().generation,7);return g;}
function at(g,p,q,z=0){
 const raw=g.serialize(),w=g.frontier.world();
 Object.assign(raw.frontier,{active:true,anchor:raw.frontier.anchor||{x:raw.player.x,y:raw.player.y},x:q.x,y:q.y,z,inside:p.id,seen:[...new Set([...raw.frontier.seen,p.id])]});
 for(const near of w.nearPOI(q.x,q.y,150))for(let i=0;i<w.threatCount(near);i++){const id=near.id+':e'+i;raw.frontier.enemies[id]=0;delete raw.frontier.tracks[id];}
 raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
 assert.equal(g.restoreSave(raw),true);return raw;
}
function ticks(g,n=1){for(let i=0;i<n;i++){g.update(.04);g.input.pressed.clear();}}
function walk(g,q){
 for(let i=0;i<180;i++){const f=g.frontier.position(),dx=q.x-f.x,dy=q.y-f.y;if(Math.hypot(dx,dy)<.16){g.input.keys.clear();return;}
  g.input.keys.clear();if(Math.abs(dx)>.07)g.input.keys.add(dx>0?'KeyD':'KeyA');if(Math.abs(dy)>.07)g.input.keys.add(dy>0?'KeyS':'KeyW');ticks(g);
 }
 g.input.keys.clear();assert.fail('Actual movement did not reach '+JSON.stringify(q));
}
function sample(g,type,reason){
 const G=globalThis.DeadwallFrontierGeometry,w=g.frontier.world(),p=w.pois.find(p=>p.type===type),z=0,delta=type==='mine'?-1:1,t=w.plan(p,z).stairs[0],center=G.global(p,t.x+t.w/2,t.y+t.h/2);
 for(let iy=-18;iy<=18;iy++)for(let ix=-18;ix<=18;ix++){const dx=ix/10,dy=iy/10;if(Math.hypot(dx,dy)>1.8)continue;const q={x:center.x+dx,y:center.y+dy},local=G.local(p,q.x,q.y);
  if(local.x<.32||local.y<.32||local.x>p.w-.32||local.y>p.h-.32||w.blocked(q.x,q.y,.32,z,p.id))continue;
  if(reason==='arrival'?w.blocked(q.x,q.y,.32,z+delta,p.id)&&w.line(q,center,z,p.id,null,.32):!w.line(q,center,z,p.id,null,.32))return{p,q,center,delta};
 }throw Error('No generated reproduction: '+type+'/'+reason);
}
function access(){const g=start(),{p,q,delta}=sample(g,'duplex','access');at(g,p,q);const before=g.frontier.snapshot(),bag=copy(g.player.carry);assert.equal(g.frontier.stairs(delta),false);assert.deepEqual(g.frontier.snapshot(),before);assert.deepEqual(g.player.carry,bag);return{scenario:'access',status:'passed',browser:false,poi:p.id,type:p.type,seed:g.world.seed,refused:'stair through wall',position:q};}
function landing(){const g=start(),{p,q,delta,center}=sample(g,'mine','arrival');at(g,p,q);const before=g.frontier.snapshot(),bag=copy(g.player.carry);assert.equal(g.frontier.stairs(delta),false);assert.deepEqual(g.frontier.snapshot(),before);walk(g,center);assert.equal(g.frontier.stairs(delta),true);const after=g.frontier.position();assert.equal(g.frontier.world().blocked(after.x,after.y,.32,after.z,after.inside),false);assert.equal(after.z,-1);assert.deepEqual(g.player.carry,bag);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.frontier.position(),after);assert.equal(g.frontier.stairs(1),true);return{scenario:'landing',status:'passed',browser:false,poi:p.id,type:p.type,seed:g.world.seed,refused:q,validArrival:after};}
function recover(){const g=start(),{p,q,delta,center}=sample(g,'mine','arrival');at(g,p,q);const old=g.serialize();old.frontier.z=delta;assert.equal(g.frontier.world().blocked(q.x,q.y,.32,-1,p.id),true);const bag=copy(old.player.carry),taken=copy(old.frontier.taken),stock=copy(old.resources),oldCopy=copy(old);assert.equal(g.restoreSave(old),true);const after=g.frontier.position();assert.deepEqual(old,oldCopy,'Validation does not mutate the supplied save');assert.ok(Math.hypot(after.x-center.x,after.y-center.y)<1e-7);assert.equal(g.frontier.world().blocked(after.x,after.y,.32,-1,p.id),false);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stock);assert.deepEqual(g.frontier.snapshot().taken,taken);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.frontier.position(),after);assert.equal(g.frontier.stairs(1),true);return{scenario:'recover',status:'passed',browser:false,poi:p.id,oldPosition:q,newPosition:after,preserved:['resources','carry','taken','level'],method:'Legacy 1.36 obstructed stair arrival supplied to actual restoreSave'};}
function passage(){
 const g=start(),G=globalThis.DeadwallFrontierGeometry,A=globalThis.DeadwallFrontierArt,w=g.frontier.world(),p=w.pois.find(p=>p.type==='duplex'),pad=w.plan(p,0).stairs[0],door=G.global(p,p.w/2,p.h+1.2),center=G.global(p,pad.x+pad.w/2,pad.y+pad.h/2),plans=p.levels.map(z=>JSON.stringify(w.plan(p,z)));
 assert.equal(w.blocked(door.x,door.y,.32),false);at(g,p,door);ticks(g);assert.equal(g.frontier.position().inside,null);
 const bag=copy(g.player.carry),workerDeposits=[],deposit=g.depositWorker.bind(g);g.depositWorker=(unit,...args)=>{const before=copy(g.resources),r=deposit(unit,...args);for(const key of Object.keys(before))if(g.resources[key]!==before[key])workerDeposits.push({worker:unit.id,resource:key,amount:g.resources[key]-before[key],time:g.elapsed});return r;};for(let i=0;i<2;i++){
  walk(g,center);assert.equal(g.frontier.position().inside,p.id);const beforeStairs=copy(g.resources);g.input.pressed.add('PageUp');g.handlePressed();g.input.pressed.clear();assert.equal(g.frontier.position().z,1);assert.deepEqual(g.resources,beforeStairs,'La montée ne crée ni ne consomme de stock.');
  const v=g.frontier.overview();assert.equal(v.focus,null);assert.equal(v.action,null);assert.equal(v.choices,0);assert.ok(A.lotEntries(g,p,v).some(e=>e.kind==='furniture'&&e.id.includes(':1:')));assert.equal(A.lotEntries(g,p,v).some(e=>e.kind==='roof'),false);
  const beforeRestore=copy(g.resources);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.frontier.position().z,1);assert.deepEqual(g.resources,beforeRestore,'La reprise ne crée ni ne consomme de stock.');assert.equal(g.frontier.stairs(-1),true);assert.deepEqual(g.resources,beforeRestore,'La descente ne crée ni ne consomme de stock.');walk(g,door);assert.equal(g.frontier.position().inside,null);assert.ok(A.lotEntries(g,p,g.frontier.overview()).some(e=>e.kind==='roof'));
 }
 for(let i=0;i<70;i++)w.chunk(i%64,Math.floor(i/64));for(const site of w.pois.slice(0,70))w.plan(site,0);
 assert.ok(w.cacheSize()<=25);assert.ok(w.planCacheSize()<=48);assert.deepEqual(p.levels.map(z=>JSON.stringify(w.plan(p,z))),plans);assert.deepEqual(g.player.carry,bag);
 // Workers and upkeep keep running while the player walks. Conservation is
 // asserted around each instantaneous stair transition and restore above.
 return{scenario:'passage',status:'passed',browser:false,poi:p.id,seed:g.world.seed,roundTrips:2,workerDeposits,prepared:'Approach at rear doorway; finite nearby threats marked already cleared',steps:'Actual input movement, PageUp, save/reload, stairs down, input exit, cache eviction',position:g.frontier.position()};
}
function wreck(){
 const g=start(),G=globalThis.DeadwallFrontierGeometry,w=g.frontier.world(),A=globalThis.DeadwallFrontierArt;let p,cv,q;
 for(const site of w.pois){for(const car of site.parking){const point={x:car.x-Math.cos(car.a)*(car.w/2+.7),y:car.y-Math.sin(car.a)*(car.w/2+.7)};if(!g.interventions134.blocksLoot(car)&&!w.blocked(point.x,point.y,.32)){p=site;cv=car;q=point;break;}}if(p)break;}
 assert.ok(cv);at(g,p,q);ticks(g);for(let i=0;g.frontier.overview().focus?.id!==cv.id&&i<12;i++)g.frontier.cycle();assert.equal(g.frontier.overview().focus?.id,cv.id);assert.equal(paintedOpen(),false,'Coffre fermé avant la vraie fouille.');g.input.keys.add('KeyE');ticks(g,12);g.input.keys.clear();const n=g.frontier.takenAmount(cv.id),bag=copy(g.player.carry);assert.ok(n>0);assert.ok(bag.scrap>0);
 // Inspect the actual car painter path: the opened trunk extends behind the rear bumper.
 function paintedOpen(){const paths=[],ctx=new Proxy({globalAlpha:1},{get(o,k){if(k in o)return o[k];return(...a)=>{paths.push([k,...a]);};},set(o,k,v){o[k]=v;return true;}}),entry=A.lotEntries(g,p,g.frontier.overview()).find(e=>e.id===cv.id);assert.ok(entry);entry.draw(ctx);return paths.some(([method,x,y])=>method==='lineTo'&&x<-cv.w/2-.01&&y<-cv.h/2-.01);}
 assert.equal(paintedOpen(),true);for(let i=0;i<70;i++)w.chunk(i%64,Math.floor(i/64));assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.frontier.takenAmount(cv.id),n);assert.deepEqual(g.player.carry,bag);assert.equal(paintedOpen(),true);
 return{scenario:'wreck',status:'passed',browser:false,poi:p.id,vehicle:cv.id,kind:cv.type,taken:n,trunkOpenBeforeAndAfter:true,method:'Actual E harvest and real car painter command trace; no browser screenshot'};
}
function companion(){
 const g=start();g.player.x=4058;g.player.y=2048;assert.equal(g.frontier.enter(),true);ticks(g);const w=g.frontier.world();let point;
 for(const r of w.roads){const q={x:(r.a.x+r.b.x)/2,y:(r.a.y+r.b.y)/2};if(Math.hypot(q.x-w.home.x,q.y-w.home.y)<800||w.nearPOI(q.x,q.y,120).length)continue;if([0,1,1.25].every(dx=>!w.blocked(q.x+dx,q.y,.4))&&w.line(q,{x:q.x+1.25,y:q.y},0,null,null,.015)){point=q;break;}}
 assert.ok(point);const raw=g.serialize(),h=raw.worldEvolution.groups[0];assert.ok(h);Object.assign(raw.frontier,{...point,z:0,inside:null,a:0});Object.assign(h,{x:point.x+1,y:point.y,kind:'resting',contacts:{},injuries:{},fallen:[],lost:0,wound:0});
 for(const[index,dx]of [[0,1.25],[1,1]])h.contacts[index]={x:point.x+dx,y:point.y,z:0,a:Math.PI,mode:'idle',ttl:0,gx:point.x+dx,gy:point.y,cool:0};
 assert.equal(g.restoreSave(raw),true);const origin={...point,z:0},target=g.worldEvolution.groupMembers().sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0];assert.equal(target.id,h.id+':1');
 assert.equal(g.frontier.companionShot(origin,3,17),true);const after=g.worldEvolution.snapshot().groups.find(group=>group.id===h.id);assert.deepEqual(after.injuries,{'1':17},'Le tir atteint le contact sélectionné, pas le premier voisin de la liste.');
 assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.worldEvolution.snapshot().groups.find(group=>group.id===h.id).injuries,after.injuries);
 return{scenario:'companion',status:'passed',browser:false,group:h.id,target:target.id,injuries:after.injuries,prepared:'Two close contacts on a physically clear generated road; actual companion targeting and damage API'};
}
const scenarios={access,landing,recover,passage,wreck,companion};module.exports={scenarios};
if(require.main===module){try{const name=process.argv[2];if(!scenarios[name])throw Error('Unknown scenario '+name);process.stdout.write(JSON.stringify(scenarios[name]())+'\n');}catch(e){console.error(e.stack);process.exitCode=1;}}
