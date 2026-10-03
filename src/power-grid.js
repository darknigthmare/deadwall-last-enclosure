/* One city-wide network, as in the base game. No cables, teleporting fuel or free battery refill. */
(function(root){
 'use strict';const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.DeadwallCore,D=C.PowerGrid,R=D.RULES;
 const live=b=>b&&!b.dead&&b.health>0,done=b=>live(b)&&b.completed;
 function install(g){if(g.powerGrid)return g.powerGrid;let state=D.empty(),world=g.world,pending=null,last=null,notice='',computing=false,productionWindow=0,work=new Map();
  const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);};
  function ensure(){if(world!==g.world){world=g.world;state=D.normalize(pending||undefined);pending=null;last=null;notice='';productionWindow=0;work.clear();}return state;}
  function reconcile(){ensure();const map=g.world.buildings;state.batteries=state.batteries.filter(b=>done(map.get(b.id))&&map.get(b.id).def.battery);state.circuits=state.circuits.filter(c=>done(map.get(c.id))&&map.get(c.id).def.powerUse);
   for(const b of map.values())if(done(b)&&b.def.battery&&!state.batteries.some(s=>s.id===b.id)&&state.batteries.length<R.maxBatteries)state.batteries.push({id:b.id,charge:0,mode:'night'});
  }
  function circuitMode(id){ensure();return state.circuits.find(c=>c.id===id)?.mode||'on';}
  function online(b){return !b.siegeOffline&&!b.territoryOffline;}
  function annexGeneration(){return g.worldEvolution?.districtEffects().power||0;}
  function generation(){let value=annexGeneration();for(const b of g.world.buildings.values())if(done(b)&&online(b)&&b.def.powerGen){if((b.type==='generator'||b.def.generatorFuel)&&g.resources.fuel<=0||b.def.solar&&g.phase!=='calm')continue;value+=b.def.powerGen;}return value;}
  function compute(dt=R.previewStep,available=undefined){reconcile();const consumers=[],modes=new Map(state.circuits.map(c=>[c.id,c.mode]));for(const b of g.world.buildings.values()){b.gridOffline=Boolean(done(b)&&b.def.powerUse&&!D.enabled(modes.get(b.id)||'on',g.phase));if(!done(b)||!b.def.powerUse)continue;
    if(b.gridOffline||!online(b)){b.powered=false;b.powerShare=0;continue;}
    consumers.push({id:b.id,need:b.def.powerUse,rank:C.powerPriority(b.def),priority:b.priority||2,partial:Boolean(b.def.production),light:b.def.urbanKind==='lamp'||b.type==='perimeterLight'});
   }
   const batteries=state.batteries.filter(s=>online(g.world.buildings.get(s.id))).map(s=>({...s,...g.world.buildings.get(s.id).def.battery}));
   return D.plan({generation:available===undefined?generation():available+annexGeneration(),consumers,batteries,phase:g.phase,priority:state.priority,dt});
  }
  function apply(p){last=p;g.powerGenerated=p.generation;g.powerBatteryOutput=p.batteryOutput;g.powerUsed=p.demand;g.powerAvailable=p.generation+p.batteryOutput;g.powerRatio=p.demand?Math.min(1,g.powerAvailable/p.demand):1;for(const a of p.allocation){const b=g.world.buildings.get(a.id);if(b){b.powered=a.powered;b.powerShare=a.share;}}g.nightwatch?.invalidate();}
  function preview(available=undefined){if(computing||!g.world)return;computing=true;try{apply(compute(R.previewStep,available));}finally{computing=false;}}
  function step(dt,recordProduction=false){if(!Number.isFinite(dt)||dt<=0||dt>R.maxStep||g.state!=='playing'||g.gameOver||g.paused||g.activeOverlay)return false;const p=compute(dt);for(const c of p.changes){const s=state.batteries.find(s=>s.id===c.id);if(s)s.charge=c.charge;}apply(p);
   if(recordProduction){productionWindow+=dt;for(const b of g.world.buildings.values())if(done(b)&&b.def.production){
    let f=b.gridOffline||b.siegeOffline||b.territoryOffline||b.dayOffline?0:b.def.powerUse?(b.powered?1:b.powerShare*(g.hasResearch('grid')?.7:.35)):1;
    if(f<=.05)f=0;if(b.def.powerUse&&g.activeCrisis?.id==='blackout'&&g.activeCrisis.status==='resolved'&&g.activeCrisis.choice==='B')f*=.5;
    work.set(b.id,(work.get(b.id)||0)+dt*f);
   }}return true;}
  function changed(message){notice=message;g.refreshMetrics(true);g.save(false);g.audio?.ui();g.powerGridUI?.refresh(true);return true;}
  function setBattery(id,mode){reconcile();const b=state.batteries.find(s=>s.id===id);if(!g.canIssueCommand()||!b||!D.MODES.includes(mode))return false;b.mode=mode;return changed('Consigne de réserve appliquée. La charge stockée est inchangée.');}
  function setCircuit(id,mode){reconcile();const b=g.world.buildings.get(id);if(!g.canIssueCommand()||!done(b)||!b.def.powerUse||!D.CIRCUITS.includes(mode))return false;
   const before=state.circuits.find(c=>c.id===id);if(!before&&mode!=='on'&&state.circuits.length>=R.maxCircuits)return false;state.circuits=state.circuits.filter(c=>c.id!==id);if(mode!=='on')state.circuits.push({id,mode});return changed('Circuit réglé : '+b.def.name+'.');}
  function setPriority(value){if(!g.canIssueCommand()||!['standard','lights'].includes(value))return false;ensure().priority=value;return changed(value==='lights'?'Éclairage servi en premier. Vérifiez les ateliers et soins restants.':'Ordre électrique habituel rétabli.');}
  function snapshot(){reconcile();return D.normalize(state);}
  function overview(){reconcile();const p=compute(),sum=state.batteries.reduce((n,b)=>n+b.charge,0),cap=state.batteries.reduce((n,b)=>n+g.world.buildings.get(b.id).def.battery.capacity,0);const deficit=Math.max(0,p.demand-p.generation),usable=state.batteries.filter(s=>s.mode!=='isolated'&&(s.mode!=='night'||g.phase!=='calm')&&online(g.world.buildings.get(s.id))).reduce((n,s)=>n+s.charge,0);
   return{...p,charge:sum,capacity:cap,priority:state.priority,notice,autonomy:deficit>0&&p.shortfall<R.epsilon?usable/deficit:null,
    batteries:state.batteries.map(s=>{const b=g.world.buildings.get(s.id),flow=p.changes.find(c=>c.id===s.id);return{...s,name:b.def.name,capacity:b.def.battery.capacity,chargeRate:b.def.battery.chargeRate,output:b.def.battery.output,offline:!online(b),flow:flow?flow.input-flow.output:0};}),
    circuits:[...g.world.buildings.values()].filter(b=>done(b)&&b.def.powerUse).map(b=>({id:b.id,name:b.def.name,kind:b.def.production?'industry':b.def.defense?'defense':b.def.light?'light':'services',mode:circuitMode(b.id),need:b.def.powerUse,powered:!!b.powered,share:b.powerShare,disabled:b.gridOffline,offline:!online(b)}))};
  }
  g.powerGrid=Object.freeze({productionSeconds:(b,dt,power,crisis)=>productionWindow>0?(work.get(b.id)||0)*Math.min(1,dt/productionWindow):b.gridOffline?0:dt*power*crisis,hasProduction:id=>(work.get(id)||0)>0,preview,step,snapshot,overview,setBattery,setCircuit,setPriority,circuitMode,charge:id=>{ensure();return state.batteries.find(b=>b.id===id)?.charge||0}});
  g.allocatePower=available=>preview(available);
  wrap('placeOne',(old,type,...a)=>{if(C.BUILDINGS[type]?.battery&&[...g.world.buildings.values()].filter(b=>live(b)&&b.def.battery).length>=R.maxBatteries){g.notify('Limite de 128 réserves électriques atteinte.','danger');return false;}return old(type,...a);});
  wrap('economyTick',(old,...a)=>{try{return old(...a);}finally{productionWindow=0;work.clear();}});
  wrap('serialize',(old,...a)=>({...old(...a),powerGrid:snapshot()}));
  wrap('restoreSave',(old,input)=>{const data=root.DeadwallSave.validate(input),before=g.world;pending=data.powerGrid;try{return old(data);}finally{if(g.world!==before){ensure();reconcile();g.refreshMetrics(true);}pending=null;}});
  wrap('startNew',(old,...a)=>{pending=null;const r=old(...a);ensure();reconcile();g.refreshMetrics(true);return r;});
  return g.powerGrid;
 }
 const api={install};root.DeadwallPowerGrid=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
