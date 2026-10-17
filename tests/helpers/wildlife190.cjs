'use strict';
const assert=require('node:assert/strict');
const {bootDocument134}=require('../../scripts/qa-startup134.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));
let prepared=null;const checkpoints=new Map();
function ready(){
 const env=bootDocument134(),g=env.g;
 if(prepared){assert.equal(g.restoreSave(clone(prepared)),true);g.paused=false;g.activeOverlay=null;return env;}
 g.startNew('standard','17117','classic','balanced');g.campaignIntro132.skip();
 const stock=g.resources.scrap,quote=g.arsenal134.preview('craft','knife');assert.equal(quote.ok,true,quote.reason);
 assert.equal(g.arsenal134.begin('craft','knife').ok,true);for(let i=0;i<200&&g.arsenal134.busy();i++)g.arsenal134.step(.1);
 assert.equal(g.resources.scrap,stock-DeadwallCore.Arsenal134Rules.catalog.knife.cost.scrap);
 const item=g.arsenal134.snapshot().locker.find(i=>i.id==='knife');assert.ok(item);
 assert.equal(g.arsenal134.transfer(item.uid,'carried').ok,true);assert.equal(g.arsenal134.equip(item.uid).ok,true);
 for(const k of ['wood','scrap','food'])assert.equal(g.loadout.transfer('depot','sac',k,3).ok,true);
 prepared=clone(g.serialize());return env;
}
function checkpoint(g,kind){
 if(checkpoints.has(kind))return checkpoints.get(kind);
 const w=g.frontier.world(),P=DeadwallBiomePopulation165,R=DeadwallCore.WildlifeHarvest190Rules;
 for(let cy=0;cy<96;cy++)for(let cx=0;cx<96;cx++)for(let i=0;i<8;i++){
  const q=P.animal(w,cx,cy,i);if(!q||!P.admitted(w,q))continue;
  if(kind==='land'&&(q.profile.mode!=='land'||R.yields[q.species]<8))continue;
  if(kind==='fish'&&q.profile.mode!=='swim')continue;
  const distances=kind==='fish'?[1,2,3,4,5,6]:[1.4];
  for(const d of distances)for(let n=0;n<24;n++){
   const p={x:q.x+Math.cos(n/24*Math.PI*2)*d,y:q.y+Math.sin(n/24*Math.PI*2)*d};
   if(w.blocked(p.x,p.y,.32,0,null)||w.hydrology.sample(p.x,p.y).water)continue;
   if(!(kind==='fish'?w.wildlifeWaterLine(p,q,.04):w.movementLine(p,q,0,null,null,.05)))continue;
   const value={id:q.id,species:q.species,point:p,original:{x:q.x,y:q.y}};checkpoints.set(kind,value);return value;
  }
 }
 throw Error('No seeded physical checkpoint for '+kind);
}
function arrive(g,kind){
 const q=checkpoint(g,kind),d=g.serialize();Object.assign(d.frontier,{active:true,...q.point,z:0,inside:null,a:Math.atan2(q.original.y-q.point.y,q.original.x-q.point.x),anchor:{x:d.player.x,y:d.player.y}});
 assert.equal(g.restoreSave(d),true);g.paused=false;g.activeOverlay=null;g.input.keys.clear();g.input.pressed.clear();g.dayClock=.4;g.update(.1);
 assert.ok(g.frontier.wildlife165().some(a=>a.id===q.id),'checkpoint uses a live generated animal');return q;
}
function dead(g){const q=arrive(g,'land');assert.equal(g.frontier.hitWildlife165(q.id,80),true);return q;}
function finish(g,{simulation=false}={}){for(let n=0;n<150&&g.wildHarvest190.busy();n++)simulation?g.update(.1):g.wildHarvest190.step(.1);assert.equal(g.wildHarvest190.busy(),false,g.wildHarvest190.overview().summary);}
module.exports={ready,arrive,dead,finish,clone};
