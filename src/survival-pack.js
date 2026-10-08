/* Five field systems sharing inventory, light equipment, threats and world geometry. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.SurvivalPackRules;
const initial=()=>({version:1,serial:1,camps:[],meal:{left:0,budget:0},dressing:{left:0,remaining:0}});
function normalize(raw,full){
 if(raw===undefined)return initial();
 const bad=()=>{throw Error('Registre de bivouac invalide.');};
 const number=(v,min,max,integer=false)=>{if(!Number.isFinite(v)||v<min||v>max||integer&&!Number.isInteger(v))bad();return v;};
 if(!raw||raw.version!==1||!Array.isArray(raw.camps)||raw.camps.length>R.maxCamps||!raw.meal||!raw.dressing)bad();
 const W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null),regionSize=W.sizeForGeneration(full?.frontier?.generation??5);
 const out=initial(),seen=new Set();out.serial=number(raw.serial,1,R.maxSerial,true);
 for(const camp of raw.camps){if(!camp||!['local','region'].includes(camp.domain)||camp.z!==0||camp.inside!==null)bad();const q={id:number(camp.id,1,out.serial-1,true),domain:camp.domain,x:number(camp.x,0,camp.domain==='local'?4096:regionSize),y:number(camp.y,0,camp.domain==='local'?4096:regionSize),z:0,inside:null,left:number(camp.left,0,R.campLife),cover:number(camp.cover,0,R.cover.duration)};if(seen.has(q.id)||q.left===0)bad();seen.add(q.id);out.camps.push(q);}
 out.meal={left:number(raw.meal.left,0,R.meal.duration),budget:number(raw.meal.budget,0,R.meal.budget)};
 out.dressing={left:number(raw.dressing.left,0,R.dressing.duration),remaining:number(raw.dressing.remaining,0,R.dressing.heal)};
 if(out.meal.left===0&&out.meal.budget!==0||out.dressing.left===0&&out.dressing.remaining!==0)bad();return out;
}
function install(g){
 if(g.survivalPack)return g.survivalPack;
 if(!g.expansions)throw Error('Installer le registre des extensions avant les bivouacs.');
 let state=initial(),task=null,message='',lastHealth=g.player?.health??100,servicePermit=null;
 const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);};
 const running=()=>g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver;
 const able=()=>g.state==='playing'&&!g.gameOver&&!g.player.dead&&g.player.health>0&&g.canIssueCommand();
 const handsReason=()=>g.fieldcraft?.context?.().mounted?'Libérez le poste de tir avant de préparer ou démonter le bivouac.':g.player.reload>0?'Terminez le rechargement avant de préparer ou démonter le bivouac.':'';
 const frontierPosition=()=>g.frontier.position?.()||g.frontier.snapshot();
 function manipulationReason(){
  if(!able()||g.expeditions.driving()||frontierPosition().car?.driving)return 'Le commandant doit être libre et à pied.';
  if(task||g.expansions.busy('survival')||g.essentials?.busy()||g.fieldSupplies?.busy()||g.nightGear?.busy?.())return 'Terminez l’intervention en cours avant de manipuler le bivouac.';
  return handsReason();
 }
 const position=()=>{const f=frontierPosition();return f.active?{domain:'region',x:f.x,y:f.y,z:f.z,inside:f.inside,angle:f.a||0}:{domain:'local',x:g.player.x,y:g.player.y,z:0,inside:null,angle:g.player.facing||0};};
 const scale=p=>p.domain==='local'?32:1;
 const line=(a,b)=>a.domain==='local'?(g.nightGear?.localLineClear?.(a,b)??g.hostileLineClear(a,b)):g.frontier.world().line(a,b,a.z,a.inside,null,.05);
 const same=(a,b)=>a.domain===b.domain&&a.z===b.z&&(a.z===0||a.inside===b.inside);
 const near=(a,b,d=R.campReach)=>same(a,b)&&Math.hypot(a.x-b.x,a.y-b.y)<=d*scale(a)&&line(a,b);
 const nearestCamp=(p=position())=>state.camps.filter(c=>near(p,c)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null;
 const fail=reason=>{message=reason;return{ok:false,reason};};
 const save=()=>{g.audio.ui?.();g.save(false);return{ok:true};};
 function danger(p){
  if(p.domain==='local')return g.nearbyZombies(p.x,p.y,R.safeRadius*32).some(z=>!z.dead&&z.health>0&&Math.hypot(z.x-p.x,z.y-p.y)<R.safeRadius*32);
  const contacts=[...g.frontier.contacts(),...(g.worldEvolution?.groupMembers?.()||[]),...(g.succession133?.contacts?.()||[])];
  return contacts.some(e=>e.hp>0&&e.z===p.z&&(p.z===0||e.poi===p.inside)&&Math.hypot(e.x-p.x,e.y-p.y)<R.safeRadius&&g.frontier.visibleEnemy(e));
 }
 function outdoors(p){
  if(p.z!==0||p.inside)return false;
  if(p.domain==='local'){const a=g.exploration125?.generation===4?g.exploration125.plan:null;return !a||![...(a.stations||[]),...(a.settlements||[]).flatMap(s=>s.buildings||[]),...(a.backyards||[]).map(y=>y.house)].some(b=>Math.abs(p.x-b.x)<b.w/2+R.campRadius*32&&Math.abs(p.y-b.y)<b.h/2+R.campRadius*32);}
  const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);return !g.frontier.world().nearPOI(p.x,p.y,50).some(b=>{const q=G.local(b,p.x,p.y);return q.x>-R.campRadius&&q.y>-R.campRadius&&q.x<b.w+R.campRadius&&q.y<b.h+R.campRadius;});
 }
 function campPosition(p){const s=scale(p);return{domain:p.domain,x:p.x+Math.cos(p.angle)*R.placeDistance*s,y:p.y+Math.sin(p.angle)*R.placeDistance*s,z:0,inside:null};}
 function clearCamp(p){
  const s=scale(p),bounds=p.domain==='local'?4096:g.frontier.world().size;if(!outdoors(p)||p.x<R.campRadius*s||p.y<R.campRadius*s||p.x>bounds-R.campRadius*s||p.y>bounds-R.campRadius*s)return false;
  if(p.domain==='region'){if(g.frontier.world().blocked(p.x,p.y,R.campRadius,0,null))return false;}
  else for(const [dx,dy]of[[0,0],[R.campRadius,0],[-R.campRadius,0],[0,R.campRadius],[0,-R.campRadius]])if(!g.friendlyPositionClear({radius:10},p.x+dx*s,p.y+dy*s))return false;
  const car=p.domain==='local'?g.expeditions.car():frontierPosition().car;if(car&&Math.hypot(car.x-p.x,car.y-p.y)<(R.campRadius+3)*s)return false;
  return !state.camps.some(c=>same(c,p)&&Math.hypot(c.x-p.x,c.y-p.y)<R.campReach*s);
 }
 function warm(p){return (g.nightGear?.snapshot().devices||[]).some(d=>d.kind==='campfire'&&d.on&&d.left>0&&d.location==='placed'&&near(p,d));}
 function lantern(id,p){return (g.nightGear?.snapshot().devices||[]).find(d=>d.kind==='lantern'&&!d.on&&d.left<C.NightGearRules.types.lantern.duration&&(id===undefined||d.id===id)&&(d.location==='belt'||d.location==='placed'&&near(p,d)));}
 function preview(kind,id,placement,remainingSeconds=R[kind]?.seconds){
  if(!Object.hasOwn(R,kind)||!R[kind]?.cost)return{ok:false,reason:'Préparation inconnue.'};
  const p=position(),occupied=manipulationReason();if(occupied)return{ok:false,reason:occupied};
  if(danger(p))return{ok:false,reason:'Sécurisez les abords avant de préparer le bivouac.'};
  if(!C.canAfford(g.player.carry,R[kind].cost))return{ok:false,reason:'Fournitures manquantes dans le sac : '+Object.entries(R[kind].cost).filter(([k,n])=>(g.player.carry[k]||0)<n).map(([k])=>C.RESOURCE_META[k].label.toLowerCase()).join(', ')+'.'};
  let target=null;
  if(kind==='camp'){
   if(state.camps.length>=R.maxCamps||state.serial>=R.maxSerial)return{ok:false,reason:'Quatre bivouacs maximum ; démontez une ancienne halte.'};
   target=placement||campPosition(p);if(!clearCamp(target)||!line(p,target))return{ok:false,reason:'Un sol extérieur dégagé est requis devant vous.'};
  }
  if(['rest','cover','service','ration','restSheltered'].includes(kind)){target=['ration','restSheltered'].includes(kind)&&id!==undefined?state.camps.find(c=>c.id===id&&near(p,c)):nearestCamp(p);if(!target)return{ok:false,reason:'Approchez d’un bivouac accessible.'};}
  if(['ration','restSheltered'].includes(kind)&&target.left<=remainingSeconds)return{ok:false,reason:'La halte expire avant la fin de cette préparation.'};
  if(['rest','restSheltered'].includes(kind)&&g.player.health>=g.player.maxHealth)return{ok:false,reason:'Vous êtes déjà en bonne santé.'};
  if(kind==='restSheltered'&&target.cover<=remainingSeconds)return{ok:false,reason:'Une bâche doit abriter cette halte jusqu’à la fin de la relève.'};
  if(kind==='ration'&&g.player.stamina>=g.player.maxStamina)return{ok:false,reason:'Votre endurance est déjà pleine.'};
  if(kind==='meal'){if(!warm(p))return{ok:false,reason:'Approchez d’un feu de camp allumé.'};if(state.meal.left>0)return{ok:false,reason:'Le repas précédent vous soutient encore.'};}
  if(['dressing','dressingLight'].includes(kind)){if(g.player.health>=g.player.maxHealth)return{ok:false,reason:'Aucune blessure à panser.'};if(state.dressing.left>0)return{ok:false,reason:'Un pansement est déjà actif.'};}
  if(kind==='cover'&&target.cover>0)return{ok:false,reason:'La bâche est encore en place.'};
  if(kind==='service'){const d=lantern(id,p);if(!d)return{ok:false,reason:'Équipez une lanterne éteinte dont le réservoir est entamé.'};if(!g.nightGear.serviceLantern)return{ok:false,reason:'Entretien d’éclairage indisponible.'};target={camp:target.id,device:d.id};}
  return{ok:true,cost:R[kind].cost,seconds:R[kind].seconds,target};
 }
 function begin(kind,id){const q=preview(kind,id);if(!q.ok)return fail(q.reason);lastHealth=g.player.health;task={kind,id:kind==='service'?q.target.device:['ration','restSheltered'].includes(kind)?q.target.id:id,elapsed:0,seconds:q.seconds,p:position(),health:g.player.health,target:q.target};message=R[kind].name+' — restez immobile, le temps et les menaces continuent.';g.releaseInputs();return{ok:true};}
 function cancel(reason='Préparation interrompue : les fournitures restent dans le sac.'){if(!task)return false;task=null;message=reason;return true;}
 function dismantleStatus(){const reason=manipulationReason();if(reason)return{ok:false,reason};const target=nearestCamp();return target?{ok:true,target}:{ok:false,reason:'Approchez d’un bivouac accessible.'};}
 function dismantle(){const q=dismantleStatus();if(!q.ok)return fail(q.reason);state.camps=state.camps.filter(a=>a.id!==q.target.id);message='Bivouac démonté. Les fournitures usagées ne sont pas récupérables.';return save();}
 function finish(t,q){
  if(t.kind==='service'){let serviced=false;servicePermit={id:t.id,amount:R.service.amount};try{serviced=g.nightGear.serviceLantern(t.id,R.service.amount);}finally{servicePermit=null;}if(!serviced)return cancel('La lanterne a changé ; aucun matériau dépensé.');}
  C.spend(g.player.carry,q.cost);
  if(t.kind==='camp')state.camps.push({...t.target,id:state.serial++,left:R.campLife,cover:0});
  if(['rest','restSheltered'].includes(t.kind))g.player.health=Math.min(g.player.maxHealth,g.player.health+R[t.kind].heal);
  if(t.kind==='ration')g.player.stamina=Math.min(g.player.maxStamina,g.player.stamina+R.ration.stamina);
  if(t.kind==='meal')state.meal={left:R.meal.duration,budget:R.meal.budget};
  if(['dressing','dressingLight'].includes(t.kind))state.dressing={left:R[t.kind].duration,remaining:R[t.kind].heal};
  if(t.kind==='cover')q.target.cover=R.cover.duration;
  task=null;message=({camp:'Bivouac installé pour dix minutes de simulation.',rest:'Relève terminée : vous pouvez reprendre la marche.',restSheltered:'Relève abritée terminée : soin reçu, rations et médicament consommés.',ration:'Ration consommée : endurance restaurée pour reprendre la marche.',meal:'Repas chaud consommé : effort de course réduit pendant deux minutes.',dressing:'Pansement posé : récupération progressive, interrompue par les dégâts.',dressingLight:'Pansement léger posé : récupération progressive, sans cumul avec un autre pansement.',cover:'Bâche tendue : les flammes proches sont abritées pendant cinq minutes.',service:'Lanterne entretenue sur place.'})[t.kind];g.notify(message,'good');save();
 }
 function damageReceived(){
  // Observe the impact before another service can hide it by healing in the same frame.
  const interrupted=state.dressing.left>0;state.dressing={left:0,remaining:0};
  if(task)cancel('Blessure reçue : préparation interrompue.');
  if(interrupted&&!g.player.dead&&g.player.health>0){message='Pansement interrompu par la blessure : le soin restant est perdu.';g.notify(message,'danger');}
 }
 function step(dt){
  if(!running()||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,R.maxStep);
  for(const c of state.camps){c.left=Math.max(0,c.left-dt);c.cover=Math.max(0,c.cover-dt);}state.camps=state.camps.filter(c=>c.left>0);
  state.meal.left=Math.max(0,state.meal.left-dt);if(!state.meal.left)state.meal.budget=0;
  if(g.player.dead||g.player.health<=0||g.player.health<lastHealth-1e-7)damageReceived();
  else if(state.dressing.left>0){const n=Math.min(state.dressing.remaining,R.dressing.heal/R.dressing.duration*dt,Math.max(0,g.player.maxHealth-g.player.health));g.player.health+=n;state.dressing.remaining-=n;state.dressing.left=Math.max(0,state.dressing.left-dt);if(!state.dressing.left||!state.dressing.remaining||g.player.health>=g.player.maxHealth)state.dressing={left:0,remaining:0};}
  if(task){const t=task,p=position();task=null;const q=preview(t.kind,t.id,t.kind==='camp'?t.target:undefined,Math.max(0,t.seconds-t.elapsed-dt));task=t;
   if(!q.ok||!same(p,t.p)||Math.hypot(p.x-t.p.x,p.y-t.p.y)>R.moveTolerance*scale(p)||g.player.health<t.health||g.player.reload>0)cancel(q.reason||undefined);
   else{t.elapsed+=dt;if(t.elapsed+1e-7>=t.seconds)finish(t,q);}
  }
  lastHealth=g.player.health;
 }
 function rainProtection(device,p){const q=device.location==='belt'?p:device;if(!q||q.z!==0||q.inside)return 0;return state.camps.some(c=>c.cover>0&&near(q,c,R.cover.radius))?R.cover.protection:0;}
 function depthEntries(v,view){return state.camps.filter(c=>c.domain==='region'&&v.z===0&&c.x>=view.l-3&&c.x<=view.r+3&&c.y>=view.t-3&&c.y<=view.b+3&&(root.DeadwallFrontierArt?.visiblePoint?.(g,c,v)??true)).map(c=>({kind:'camp',id:'camp:'+c.id,depth:c.y+R.campRadius,draw:ctx=>draw(ctx,'region',c)}));}
 let terrainWorld=null,terrainKey='',terrainRows=[];
 function surroundings(){
  const f=frontierPosition(),key=[f.active,f.generation,f.x,f.y,f.z,f.inside,g.player.x,g.player.y,g.weather,g.exploration125?.generation].join(':');
  if(terrainWorld===g.world&&terrainKey===key)return terrainRows;
  terrainWorld=g.world;terrainKey=key;terrainRows=[];
  if(f.active){
   const biome=f.generation>=6?root.DeadwallBiomes135?.sample(g.world.seed,f.x,f.y,false,{generation:f.generation}):null;
   terrainRows.push({label:'Carte & milieu',value:'Graine '+g.world.seed+(biome?' · '+biome.name:' · région G'+f.generation)});
   const ground=g.worldEvolution?.surface(f);if(ground)terrainRows.push({label:'Sol parcouru',value:ground.name+' · à pied : vitesse '+Math.round(ground.speed*100)+' % · bruit '+Math.round(ground.noise*100)+' %'});
  }else{
   terrainRows.push({label:'Carte & milieu',value:'Graine '+g.world.seed+' · D-17'});
   const ground=g.exploration125?.generation===4?root.DeadwallExploration125?.surfaceAt(g.exploration125.plan,g.player.x,g.player.y,g.weather||0):null;
   if(ground)terrainRows.push({label:'Sol parcouru',value:ground.label+' · à pied : vitesse '+Math.round(ground.multiplier*100)+' %'});
  }
  return terrainRows;
 }
 function overview(){const c=nearestCamp();return{summary:message||'Préparez une halte, vos soins et l’éclairage avec les fournitures du sac.',rows:[{label:'Santé',value:Math.ceil(g.player.health)+' / '+Math.ceil(g.player.maxHealth)+' PV'},{label:'Endurance',value:Math.ceil(g.player.stamina)+' / '+Math.ceil(g.player.maxStamina)},...surroundings(),{label:'Fournitures du sac',value:Math.floor(g.player.carry.food)+' rations · '+Math.floor(g.player.carry.medicine)+' médicaments'},{label:'Bivouacs',value:state.camps.length+' / '+R.maxCamps},{label:'Halte proche',value:c?Math.ceil(c.left)+' s · bâche '+Math.ceil(c.cover)+' s':'Aucune'},{label:'Repas chaud',value:state.meal.left>0?Math.ceil(state.meal.left)+' s · économie restante '+Math.ceil(state.meal.budget):'Aucun'},{label:'Pansement',value:state.dressing.left>0?Math.ceil(state.dressing.remaining)+' vie restante · '+Math.ceil(state.dressing.left)+' s':'Aucun'},{label:'Préparation',value:task?R[task.kind].name+' · '+Math.floor(task.elapsed/task.seconds*100)+' %':'Libre'}],task:task?{kind:task.kind,progress:task.elapsed/task.seconds}:null};}
 function description(kind){return{
  camp:'Halte au sol pour '+R.campLife+' secondes actives. Le repos exige de rester à proximité ; les infectés et les vagues continuent.',
  rest:'Restaure jusqu’à '+R.rest.heal+' PV après la relève. Restez près du bivouac, immobile et hors danger jusqu’à la fin.',
  restSheltered:'Restaure jusqu’à '+R.restSheltered.heal+' PV après '+R.restSheltered.seconds+' s. La halte et sa bâche doivent rester accessibles et durer jusqu’à la fin ; les fournitures viennent du sac.',
  ration:'Ajoute jusqu’à '+R.ration.stamina+' points d’endurance après '+R.ration.seconds+' s près de la halte. La récupération naturelle continue ; aucune ration n’est consommée si l’endurance est pleine avant achèvement.',
  meal:'Économise '+Math.round(R.meal.rebate*100)+' % de l’endurance réellement dépensée en courant pendant '+R.meal.duration+' s, avec un budget de '+R.meal.budget+' points. Le feu doit rester allumé et accessible pendant la préparation.',
  dressing:'Restaure jusqu’à '+R.dressing.heal+' PV sur '+R.dressing.duration+' s après la pose. Marcher est permis ; les dégâts interrompent le soin restant.',
  dressingLight:'Restaure jusqu’à '+R.dressingLight.heal+' PV sur '+R.dressingLight.duration+' s après la pose, dans le même emplacement de pansement. Marcher est permis ; les dégâts interrompent le reste du soin.',
  cover:'Pendant '+R.cover.duration+' s, réduit de '+Math.round(R.cover.protection*100)+' % la surconsommation des flammes due à la pluie dans un rayon accessible de '+R.cover.radius+' m. La combustion normale continue.',
  service:'Ajoute jusqu’à '+R.service.amount+' s à la lanterne éteinte, sans dépasser '+C.NightGearRules.types.lantern.duration+' s. Le bivouac et la lanterne doivent rester accessibles.'
 }[kind];}
 function actions(){const list=['camp','rest','restSheltered','ration','meal','dressing','dressingLight','cover','service'].map(kind=>{const q=preview(kind);return{id:kind,label:R[kind].name+' · '+Object.entries(R[kind].cost).map(([k,n])=>n+' '+C.RESOURCE_META[k].label.toLowerCase()).join(' + ')+' · '+R[kind].seconds+' s',description:description(kind),disabled:!q.ok,reason:q.reason||'Fournitures prélevées à la fin, dans le sac.',close:true,run:()=>begin(kind)};});if(task)list.unshift({id:'cancel',label:'Interrompre la préparation',run:()=>cancel(),close:false});if(nearestCamp()){const q=dismantleStatus();list.push({id:'dismantle',label:'Démonter cette halte sans récupération',disabled:!q.ok,reason:q.reason||'Les fournitures usagées ne sont pas récupérables.',run:dismantle});}return list;}
 function draw(ctx,domain,only=null){const p=position(),s=domain==='local'?32:1;if(p.domain!==domain&&!only)return;for(const c of state.camps){if(only&&c.id!==only.id||c.domain!==domain||!only&&(p.z!==0||Math.hypot(c.x-p.x,c.y-p.y)>90*s))continue;if(g.operationsArt?.draw(ctx,c.cover>0?'tarp':'bedroll',c.x,c.y,(c.cover>0?88:65)*s/32))continue;ctx.save();ctx.translate(c.x,c.y);ctx.scale(s,s);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,.1,1.3,.75,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#706d4b';ctx.fillRect(-1,-.55,2,1.05);ctx.fillStyle='#a29b70';ctx.fillRect(-.83,-.42,.46,.84);ctx.strokeStyle='#423e2e';ctx.lineWidth=.05;ctx.strokeRect(-1,-.55,2,1.05);ctx.fillStyle='#736e50';ctx.fillRect(.56,-.69,.45,.36);if(c.cover>0){ctx.strokeStyle='#a3a57a';ctx.lineWidth=.07;ctx.beginPath();ctx.moveTo(-1.4,.6);ctx.lineTo(-.95,-1);ctx.lineTo(1.1,-.85);ctx.lineTo(1.45,.6);ctx.stroke();ctx.fillStyle='rgba(86,113,84,.62)';ctx.beginPath();ctx.moveTo(-1.16,-.82);ctx.lineTo(.1,-1.25);ctx.lineTo(1.31,-.72);ctx.lineTo(.96,.3);ctx.lineTo(-.95,.24);ctx.closePath();ctx.fill();}ctx.restore();}}
 g.survivalPack=Object.freeze({begin,preview,cancel,dismantle,step,damageReceived,rainProtection,draw,depthEntries,overview,actions,snapshot:()=>normalize(state),busy:()=>!!task,activity:()=>task?{kind:task.kind,progress:task.elapsed/task.seconds}:null,authorizeService:(id,amount)=>!!servicePermit&&servicePermit.id===id&&servicePermit.amount===amount});
 g.expansions.register({id:'survival',title:'Bivouacs & survie',overview,actions,validate:normalize,snapshot:()=>normalize(state),restore:raw=>{state=normalize(raw);task=null;lastHealth=g.player.health;message='';},reset:()=>{state=initial();task=null;lastHealth=g.player.health;message='';}});
 wrap('update',(old,dt)=>{const run=running();if(run&&(g.player.dead||g.player.health<=0)){state.dressing={left:0,remaining:0};cancel('Mise à terre : préparation interrompue.');}if(run&&task&&(g.input.keys.size||g.input.mouseDown||g.input.touchFire))cancel();const result=old(dt);if(run)step(dt);return result;});
 wrap('updatePlayer',(old,dt)=>{const before=g.player.stamina,result=old(dt);if(running()&&state.meal.left>0&&state.meal.budget>0&&g.input.keys.has('ShiftLeft')&&g.player.stamina<before){const n=Math.min((before-g.player.stamina)*R.meal.rebate,state.meal.budget);g.player.stamina=Math.min(g.player.maxStamina,g.player.stamina+n);state.meal.budget-=n;}return result;});
 wrap('returnToMenu',(old,...a)=>{cancel();return old(...a);});
 wrap('depthEntries',(old,view)=>{const entries=old(view);if(g.frontier.active()&&!view?.homeProjection)return entries;for(const camp of state.camps)if(camp.domain==='local'&&g.visible(camp.x,camp.y,48,view))entries.push({kind:1,entity:{id:-127500-camp.id,__survivalCamp:camp},depth:camp.y+R.campRadius*32,id:-127500-camp.id,order:entries.length});entries.sort((a,b)=>a.depth-b.depth||a.kind-b.kind||a.id-b.id||a.order-b.order);return entries;});
 wrap('drawBuilding',(old,ctx,b,...a)=>b.__survivalCamp?draw(ctx,'local',b.__survivalCamp):old(ctx,b,...a));
 return g.survivalPack;
}
const api={install,initial,normalize};root.DeadwallSurvivalPack=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
