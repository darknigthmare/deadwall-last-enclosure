'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H190=require('./wildlife190.cjs');
let checkpoint=null;
const copy=v=>JSON.parse(JSON.stringify(v));
function candidate(g){
 if(checkpoint)return checkpoint;
 const w=g.frontier.world(),P=DeadwallBiomePopulation165,R=DeadwallCore.Husbandry191Rules;
 for(let cy=0;cy<96;cy++)for(let cx=0;cx<96;cx++)for(let i=0;i<8;i++){
  const a=P.animal(w,cx,cy,i);if(!a||a.species!=='rabbit'||!P.admitted(w,a))continue;
  const centre={x:a.x,y:a.y-3},point={x:a.x,y:a.y+.4},road=w.nearestRoad(centre);
  const neighbors=P.around(w,a.x,a.y,8).animals;if(neighbors.some(n=>n.id!==a.id&&Math.abs(n.x-centre.x)<1.5+n.radius+.6&&Math.abs(n.y-centre.y)<1.5+n.radius+.6))continue;
  if(road&&road.d<road.road.width/2+R.penSize||w.nearPOI(a.x,a.y,30).some(p=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(p.w,p.h)+20))continue;
  if([-1.5,0,1.5].some(dx=>[-1.5,0,1.5].some(dy=>w.blocked(centre.x+dx,centre.y+dy,.4,0,null)||w.hydrology.sample(centre.x+dx,centre.y+dy).water)))continue;
  checkpoint={a:copy(a),centre,point};return checkpoint;
 }throw Error('No physical seeded rabbit checkpoint');
}
function setup(){const env=H190.ready(),g=env.g,q=candidate(g),d=g.serialize();
 Object.assign(d.frontier,{active:true,...q.point,z:0,inside:null,a:-Math.PI/2,quiet:true,anchor:{x:d.player.x,y:d.player.y}});
 assert.equal(g.restoreSave(d),true);g.paused=false;g.activeOverlay=null;g.dayClock=.4;g.update(.01);
 return{...env,q};}
function supplies(g){const d=g.serialize();/* Declared logistics fixture: stocked bag for transaction tests, not a naturally completed expedition. */d.player.carry={...d.player.carry,wood:15,scrap:10,food:10,fuel:4};g.restoreSave(d);g.paused=false;g.activeOverlay=null;g.update(.01);}
function finish(g){for(let i=0;i<150&&g.husbandry191.view().task;i++)g.husbandry191.step(.1);assert.equal(g.husbandry191.view().task,null,g.husbandry191.overview().summary);}
function build(){const env=setup(),g=env.g;supplies(g);const before=copy(g.player.carry);const quote=g.husbandry191.quote('build');assert.ok(quote.ok,quote.reason);assert.ok(g.husbandry191.begin('build').ok);finish(g);const pen=g.husbandry191.view().pens[0];assert.ok(pen);assert.equal(g.player.carry.wood,before.wood-10);assert.equal(g.player.carry.scrap,before.scrap-6);return{...env,pen};}
function captured(){const env=build(),{g,q,pen}=env;const quote=g.husbandry191.quote('capture',pen.id,q.a.id);assert.ok(quote.ok,quote.reason);const food=g.player.carry.food;assert.equal(g.husbandry191.begin('capture',pen.id,q.a.id).ok,true);finish(g);assert.equal(g.player.carry.food,food-1);return env;}

module.exports={setup,build,captured,supplies,finish,candidate};
