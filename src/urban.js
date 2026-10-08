/* Persistent knowledge of reached ages; no population, stocks or finished buildings are granted. */
(function(root){
 'use strict';const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.DeadwallCore,D=C.Balance151;
 const live=b=>b&&!b.dead&&b.health>0;
 function install(g){if(g.urban)return g.urban;let state=C.Urban.empty(),world=g.world,pending=null;
  const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...args)=>fn(old,...args);};
  function ensure(){if(world!==g.world){world=g.world;state=C.Urban.normalize(pending||undefined);pending=null;}return state;}
  function facts(includePending=false){
   const buildings=[...g.world.buildings.values()].map(b=>includePending&&live(b)&&!b.completed?{id:b.id,type:b.type,health:b.health,completed:true,priority:b.priority}:b).filter(D.done);
   const def=b=>C.BUILDINGS[b.type],online=b=>!b.siegeOffline&&!b.territoryOffline,enabled=b=>!def(b).powerUse||C.PowerGrid.enabled(g.powerGrid?.circuitMode(b.id)||'on',g.phase);
   const units=g.units.filter(live),outputs=C.makeBag(),annex=g.worldEvolution?.districtEffects()||{housing:0,storage:0,power:0};let consumption=C.makeBag(),thermalPower=0,thermalFuel=0;
   const result={score:D.developmentScore(buildings),population:(live(g.player)?1:0)+units.length,waves:g.stats.wavesSurvived||0,
    workers:units.filter(u=>u.kind==='worker').length,soldiers:units.filter(u=>u.kind==='soldier').length,specialists:units.filter(u=>u.kind==='medic'||u.kind==='engineer').length,
    variety:new Set(buildings.filter(b=>b.type!=='core'&&!def(b).wall).map(b=>b.type)).size,
    housing:Math.max(1,buildings.reduce((n,b)=>n+(def(b).housing||0),0))+annex.housing,storage:Math.max(100,buildings.reduce((n,b)=>n+(def(b).storage||0),0))+annex.storage,power:annex.power,surveys:0,pois:0,biomes:0,generation:0};
   for(const b of buildings){const d=def(b);if(!online(b)||!d.powerGen||d.solar&&g.phase!=='calm')continue;
    const fuelRate=(d.generatorFuel||0)*(g.hasResearch('grid')?.75:1);
    result.power+=d.powerGen;if(fuelRate){thermalPower+=d.powerGen;thermalFuel+=fuelRate;}
   }
   const consumers=buildings.filter(b=>online(b)&&enabled(b)&&def(b).powerUse).map(b=>({id:b.id,need:def(b).powerUse,rank:C.powerPriority(def(b)),priority:b.priority||2,partial:Boolean(def(b).production),light:def(b).urbanKind==='lamp'||b.type==='perimeterLight'}));
   // Persistent generation qualifies; a momentary battery discharge does not.
   const gridPriority=g.powerGrid?.snapshot().priority||'standard';
   function suppliedIndustries(generatorFuel){
    consumption=C.makeBag({fuel:generatorFuel});const industries=[];
    const allocation=new Map(C.PowerGrid.plan({generation:result.power,consumers,batteries:[],phase:g.phase,priority:gridPriority}).allocation.map(a=>[a.id,a]));
    for(const b of buildings){const d=def(b);if(!d.production||!online(b)||!enabled(b)||b.dayOffline||b.type==='dayGreenhouse'&&g.phase!=='calm')continue;
     const a=allocation.get(b.id),factor=d.powerUse?(a?.powered?1:(a?.share||0)*(g.hasResearch('grid')?.7:.35)):1;
     if(factor<=.05)continue;const crisis=d.powerUse&&g.activeCrisis?.id==='blackout'&&g.activeCrisis.status==='resolved'&&g.activeCrisis.choice==='B'?.5:1,rate=factor*crisis;
     industries.push({d,rate,reserve:g.fortificationPack?.inputReserve(b.id)||0});for(const [key,n]of Object.entries(d.consumes||{}))consumption[key]+=n*rate;
    }return industries;
   }
   let industries=suppliedIndustries(thermalFuel);
   // The same finite fuel reserve must support every generator and active industry.
   if(thermalFuel&&(g.resources.fuel||0)+1e-7<consumption.fuel*D.RULES.feedstockSeconds){result.power-=thermalPower;industries=suppliedIndustries(0);}
   for(const {d,rate,reserve}of industries){let supplied=1;for(const key of Object.keys(d.consumes||{}))supplied=Math.min(supplied,Math.max(0,(g.resources[key]||0)-reserve)/Math.max(1e-9,consumption[key]*D.RULES.feedstockSeconds));
    for(const [key,n]of Object.entries(d.production))outputs[key]+=n*rate*Math.max(0,Math.min(1,supplied));
   }
   Object.assign(result,outputs);
   const day=g.dayworks?.snapshot();result.surveys=day?.sites.filter(s=>s.survey>=C.Dayworks.RULES.surveySeconds).length||0;
   const region=g.frontier?.snapshot();if(region){result.generation=region.generation;const totals=new Map();
    for(const [id,n]of Object.entries(region.taken)){const match=/^(P\d{4}):/.exec(id);if(match)totals.set(match[1],(totals.get(match[1])||0)+n);}
    const harvested=[...totals].filter(([,n])=>n+1e-7>=D.RULES.poiHarvest).map(([id])=>id);result.pois=harvested.length;
    if(harvested.length&&region.generation>=6){const world=g.frontier.world(),byId=new Map(world.pois.map(p=>[p.id,p])),B=root.DeadwallBiomes135||(typeof require==='function'?require('./biomes135.js'):null);
     result.biomes=new Set(harvested.map(id=>byId.get(id)).filter(Boolean).map(p=>B.sample(g.world.seed,p.x,p.y,false,{generation:region.generation}).id)).size;
    }
   }
   return result;
  }
  function attain(score){ensure();if(!state.progression151)state.progression151=D.initial(C.cityTier(state.peakScore).id);
   if(Number.isFinite(score)&&score>=0)state.peakScore=Math.max(state.peakScore,score);
   if(state.progression151.age===C.CITY_TIERS.length-1)return C.CITY_TIERS[state.progression151.age];
   const actual=facts();while(state.progression151.age<C.CITY_TIERS.length-1&&D.requirements(state.progression151.age+1,actual).met)state.progression151.age++;
   return C.CITY_TIERS[state.progression151.age];}
  function snapshot(){attain(C.Urban.score(g.world.buildings.values()));return C.Urban.normalize(state);}
  function overview(){const s=snapshot(),age=C.CITY_TIERS[s.progression151.age];return{...s,age,currentScore:g.cityScore,next:C.CITY_TIERS[age.id+1]||null,available:Object.values(C.BUILDINGS).filter(d=>d.unlockTier<=age.id&&!['core','armoredGate'].includes(d.id)).length};}
  // A forecast of already paid foundations, never an award of score or an ETA.
  function planning(){const v=overview(),pending=[];
   for(const b of g.world.buildings.values())if(live(b)&&!b.completed&&b.progress<1)pending.push({id:b.id,name:b.def.name,progress:b.progress,score:b.def.score||0});
   const pendingScore=pending.reduce((n,b)=>n+b.score,0),potentialScore=v.currentScore+pendingScore;
   const models=tier=>Object.values(C.BUILDINGS).filter(d=>d.unlockTier===tier&&!['core','armoredGate'].includes(d.id)).map(d=>{
    const minimumStorage=Math.max(0,...Object.values(d.cost));
    return{id:d.id,name:d.name,description:d.description,cost:{...d.cost},score:d.score||0,requires:d.requires||null,requirementName:d.requires?C.BUILDINGS[d.requires].name:null,requirementMet:!d.requires||g.world.has(d.requires),minimumStorage,storageShortfall:Math.max(0,minimumStorage-g.storage),missing:Object.fromEntries(Object.entries(d.cost).map(([key,n])=>[key,Math.max(0,n-(g.resources[key]||0))]).filter(([,n])=>n>0))};
   });
   const actual=facts(),future=facts(true);let potentialAge=v.age;
   while(potentialAge.id<C.CITY_TIERS.length-1&&D.requirements(potentialAge.id+1,future).met)potentialAge=C.CITY_TIERS[potentialAge.id+1];
   return{...v,pending,pendingScore,potentialScore,potentialAge,developmentScore:actual.score,potentialDevelopmentScore:future.score,facts:actual,nextRequirements:v.next?D.requirements(v.next.id,actual):null,
    remaining:v.next?Math.max(0,v.next.requiredScore-actual.score):0,remainingAfterPending:v.next?Math.max(0,v.next.requiredScore-future.score):0,currentModels:models(v.age.id),nextModels:v.next?models(v.next.id):[]};
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
  g.urban=Object.freeze({attain,snapshot,overview,planning,facts,flashlight,direction,lightingState:()=>{const s=ensure();return{skipNightWave:s.skipNightWave,flashlight:s.flashlight};}});
  wrap('serialize',(old,...args)=>({...old(...args),urban:snapshot()}));
  wrap('restoreSave',(old,input)=>{const d=root.DeadwallSave.validate(input),before=g.world;pending=d.urban;try{return old(d);}finally{if(before!==g.world){ensure();attain(C.Urban.score(g.world.buildings.values()));g.refreshMetrics(true);}pending=null;}});
  wrap('startNew',(old,...args)=>{const before=g.world;pending={...C.Urban.empty(),progression151:D.initial()};try{const r=old(...args);if(before!==g.world){ensure();g.refreshMetrics(true);}return r;}finally{pending=null;}});
  wrap('updateBuildings',(old,dt)=>{const r=old(dt);medical(dt);return r;});
  return g.urban;
 }
 const api={install};root.DeadwallUrban=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
