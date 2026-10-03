/* Persistent knowledge of reached ages; no population, stocks or finished buildings are granted. */
(function(root){
 'use strict';const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.DeadwallCore;
 const live=b=>b&&!b.dead&&b.health>0;
 function install(g){if(g.urban)return g.urban;let state=C.Urban.empty(),world=g.world,pending=null;
  const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...args)=>fn(old,...args);};
  function ensure(){if(world!==g.world){world=g.world;state=C.Urban.normalize(pending||undefined);pending=null;}return state;}
  function attain(score){ensure();if(Number.isFinite(score)&&score>=0)state.peakScore=Math.max(state.peakScore,score);return C.cityTier(state.peakScore);}
  function snapshot(){attain(C.Urban.score(g.world.buildings.values()));return C.Urban.normalize(state);}
  function overview(){const s=snapshot(),age=C.cityTier(s.peakScore);return{...s,age,currentScore:g.cityScore,next:C.CITY_TIERS[age.id+1]||null,available:Object.values(C.BUILDINGS).filter(d=>d.unlockTier<=age.id&&!['core','armoredGate'].includes(d.id)).length};}
  // A forecast of already paid foundations, never an award of score or an ETA.
  function planning(){const v=overview(),pending=[];
   for(const b of g.world.buildings.values())if(live(b)&&!b.completed&&b.progress<1)pending.push({id:b.id,name:b.def.name,progress:b.progress,score:b.def.score||0});
   const pendingScore=pending.reduce((n,b)=>n+b.score,0),potentialScore=v.currentScore+pendingScore;
   const models=tier=>Object.values(C.BUILDINGS).filter(d=>d.unlockTier===tier&&!['core','armoredGate'].includes(d.id)).map(d=>{
    const minimumStorage=Math.max(0,...Object.values(d.cost));
    return{id:d.id,name:d.name,description:d.description,cost:{...d.cost},score:d.score||0,requires:d.requires||null,requirementName:d.requires?C.BUILDINGS[d.requires].name:null,requirementMet:!d.requires||g.world.has(d.requires),minimumStorage,storageShortfall:Math.max(0,minimumStorage-g.storage),missing:Object.fromEntries(Object.entries(d.cost).map(([key,n])=>[key,Math.max(0,n-(g.resources[key]||0))]).filter(([,n])=>n>0))};
   });
   return{...v,pending,pendingScore,potentialScore,potentialAge:C.cityTier(Math.max(v.peakScore,potentialScore)),remaining:v.next?Math.max(0,v.next.requiredScore-v.currentScore):0,remainingAfterPending:v.next?Math.max(0,v.next.requiredScore-potentialScore):0,currentModels:models(v.age.id),nextModels:v.next?models(v.next.id):[]};
  }
  function flashlight(value){ensure();if(!g.canIssueCommand()||g.player.dead||typeof value!=='boolean')return false;state.flashlight=value;g.nightwatch?.invalidate();g.audio?.ui();g.save(false);return true;}
  function direction(id,value){const b=g.world.buildings.get(id);if(!g.canIssueCommand()||!live(b)||!b.completed||!b.def.beamHalfAngle||!Number.isInteger(value)||value<0||value>3)return false;
   if(b.rotation===value)return true;const cells=g.world.cells(b);b.rotation=value;g.world.rewrite(b,cells);g.nightwatch?.invalidate();g.save(false);g.audio?.ui();return true;}
  function medical(dt){if(!Number.isFinite(dt)||dt<=0||dt>.25||g.state!=='playing'||g.gameOver||g.paused||g.activeOverlay)return;
   for(const b of g.world.buildings.values())if(live(b)&&b.completed&&b.powered&&!b.siegeOffline&&!b.territoryOffline&&b.def.medicalRadius){
    for(const u of [g.player,...g.units])if(live(u)&&u.health<u.maxHealth&&Math.hypot(u.x-b.x,u.y-b.y)<=b.def.medicalRadius&&g.workerCanWorkAt(u,b,b.def.medicalRadius)){
     const n=Math.max(0,Math.min(u.maxHealth-u.health,b.def.healRate*dt,g.resources.medicine/b.def.medicinePerHealth));if(n>0){g.resources.medicine=Math.max(0,g.resources.medicine-n*b.def.medicinePerHealth);u.health+=n;}
    }
   }
  }
  g.urban=Object.freeze({attain,snapshot,overview,planning,flashlight,direction,lightingState:()=>{const s=ensure();return{skipNightWave:s.skipNightWave,flashlight:s.flashlight};}});
  wrap('serialize',(old,...args)=>({...old(...args),urban:snapshot()}));
  wrap('restoreSave',(old,input)=>{const d=root.DeadwallSave.validate(input),before=g.world;pending=d.urban;try{return old(d);}finally{if(before!==g.world){ensure();attain(C.Urban.score(g.world.buildings.values()));g.refreshMetrics(true);}pending=null;}});
  wrap('startNew',(old,...args)=>{pending=null;const r=old(...args);ensure();g.refreshMetrics(true);return r;});
  wrap('updateBuildings',(old,dt)=>{const r=old(dt);medical(dt);return r;});
  return g.urban;
 }
 const api={install};root.DeadwallUrban=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
