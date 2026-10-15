/* Pure bindings between native rooms, powered light fixtures and explicit transit edges.
 * These states belong to the laboratory until a campaign-site adapter is validated.
 */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallSiteInfrastructure173=api;if(typeof module==='object'&&module.exports)module.exports=api;})(globalThis,function(root){'use strict';
 const deps=()=>({C:root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),P:root.DeadwallPower173||(typeof require==='function'?require('./power-network173.js'):null),T:root.DeadwallTransit173||(typeof require==='function'?require('./transit-network173.js'):null)});
 function electrical(model){
  if(!model?.supported||!Array.isArray(model.floors))throw Error('Architecture native requise.');
  const {C,P}=deps(),r=C.CodexInfrastructure173Rules,id='native:'+model.id+':'+model.seed,nodes=[{id:'generator',kind:'source',level:0,capacityW:r.generatorW,tankCapacity:r.tank,fuelPerKWh:r.fuelPerKWh,idleFuelPerHour:r.idleFuel}],edges=[],fixtures=[];
  for(const f of model.floors){const breaker='breaker:'+f.z;nodes.push({id:breaker,kind:'breaker',level:f.z});edges.push({id:'riser:'+f.z,from:'generator',to:breaker,riser:f.z!==0,capacityW:r.floorW});
   for(const room of f.rooms){const load='light:'+room.sourceIndex+':'+room.occurrence;nodes.push({id:load,kind:'load',level:f.z,demandW:r.lampW,priority:/soin|secours|urgence/.test(room.name)?2:1});edges.push({id:'wire:'+load,from:breaker,to:load,capacityW:r.lampW});fixtures.push({id:load,room:room.id,z:f.z,x:room.x+room.w/2,y:room.y+room.h/2,kind:'light',mount:'ceiling'});}
  }
  return {network:P.compile({id,nodes,edges}),fixtures,source:{x:model.p.w/2,y:model.p.h+2,z:0,kind:'generator'},scope:'native-laboratory-only'};
 }
 function beginTransit(net,node,mode='foot',width=.64){
  const {T}=deps();T.route(net,node,node,mode);
  if(!Number.isFinite(width)||width<=0||width>20)throw Error('Gabarit invalide.');
  return {version:1,network:net.id,topology:net.topology,node,mode,width,edge:null,from:null,to:null,distance:0};
 }
 function transitState(net,raw){
  if(!raw||raw.version!==1||raw.network!==net.id||raw.topology!==net.topology||!Number.isFinite(raw.distance)||raw.distance<0)throw Error('Sauvegarde de trajet incompatible.');
  const s=beginTransit(net,raw.node,raw.mode,raw.width);
  if(raw.edge===null){if(raw.from!==null||raw.to!==null||raw.distance!==0)throw Error('Position de borne invalide.');return s;}
  const e=net.edges.find(e=>e.id===raw.edge);if(!e||!e.modes.includes(raw.mode)||e.width<raw.width||raw.distance>=e.length||raw.from!==raw.node||!((e.from===raw.from&&e.to===raw.to)||(e.bidirectional&&e.to===raw.from&&e.from===raw.to)))throw Error('Position de liaison invalide.');
  return {...s,edge:e.id,from:raw.from,to:raw.to,distance:raw.distance};
 }
 function position(net,raw){
  const s=transitState(net,raw),node=net.nodes.find(n=>n.id===s.node);if(!s.edge)return{x:node.x,y:node.y,level:node.level,atNode:true};
  const edge=net.edges.find(e=>e.id===s.edge),to=net.nodes.find(n=>n.id===s.to),points=edge.from===s.from?edge.points:edge.points.slice().reverse();let left=s.distance;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(left<=len&&len>0){const t=left/len;return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,level:node.level+(to.level-node.level)*s.distance/edge.length,atNode:false};}left-=len;}
  throw Error('Distance hors tracé.');
 }
 function advance(net,raw,destination,dt,speed,closed=[]){
  const {T,C}=deps(),r=C.CodexInfrastructure173Rules;
  if(!Number.isFinite(dt)||dt<0||dt>r.maxStep||!Number.isFinite(speed)||speed<0||speed>r.maxSpeed)throw Error('Pas de déplacement invalide.');
  let state=transitState(net,raw),left=dt*speed,moved=0,reason=null;T.route(net,state.node,destination,state.mode,closed);
  // Wide vehicles reroute rather than entering a narrow link and clipping its walls.
  const banned=[...new Set([...closed,...net.edges.filter(e=>e.width<state.width).map(e=>e.id)])];
  for(let i=0;i<=net.edges.length*2+1&&left>1e-9;i++){
   if(state.edge){
    if(banned.includes(state.edge)){reason='edge-closed';break;}
    const e=net.edges.find(e=>e.id===state.edge),remaining=e.length-state.distance,step=Math.min(left,remaining);state.distance+=step;left-=step;moved+=step;
    if(state.distance>=e.length-1e-9)state={...state,node:state.to,edge:null,from:null,to:null,distance:0};else break;
   }else{
    if(state.node===destination)break;const route=T.route(net,state.node,destination,state.mode,banned);if(!route){reason='no-compatible-route';break;}
    const step=route.steps[0];state={...state,edge:step.edge,from:step.from,to:step.to,distance:0};
   }
  }
  return{state,position:position(net,state),moved,remainingDistance:left,arrived:state.edge===null&&state.node===destination,reason};
 }
 function checkpoint(model,electric,inventory){
  const {P}=deps();if(!inventory||!Number.isFinite(inventory.fuel)||inventory.fuel<0)throw Error('Inventaire de laboratoire invalide.');
  const {network}=electrical(model);return{version:1,scope:'native-laboratory-only',programme:model.id,seed:model.seed,electric:P.normalize(network,electric),inventory:JSON.parse(JSON.stringify(inventory))};
 }
 function restore(model,raw){if(!raw||raw.version!==1||raw.scope!=='native-laboratory-only'||raw.programme!==model.id||raw.seed!==model.seed)throw Error('Scénario natif incompatible.');return checkpoint(model,raw.electric,raw.inventory);}
 return Object.freeze({electrical,beginTransit,transitState,position,advance,checkpoint,restore});
});
