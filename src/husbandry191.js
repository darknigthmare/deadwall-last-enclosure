/* Physical regional enclosures, finite custody and on-site production. */
(function(root){'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Husbandry191Rules;
const W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null);
const P=root.DeadwallBiomePopulation165||(typeof require==='function'?require('./biome-population165.js'):null);
const Wild=root.DeadwallWildlife189||(typeof require==='function'?require('./wildlife189.js'):null);
const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
const clone=v=>JSON.parse(JSON.stringify(v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const vehicleHitsPen=(p,car)=>G.obb(car,{x:p.x,y:p.y,a:0,w:R.penSize,h:R.penSize});
const initial=()=>({version:1,next:1,behaviors:false,pens:[],animals:[]});
const worlds=new Map();
function worldFor(full){const f=full.frontier,key=[full.worldSeed,f.generation,f.detailVersion,f.ecologyVersion,f.hydrologyVersion,f.landscape189||'classic'].join(':');
 if(!worlds.has(key)){const row={full,world:null};row.world=W.create(full.worldSeed,f.generation,{detailVersion:f.detailVersion,ecologyVersion:f.ecologyVersion,hydrologyVersion:f.hydrologyVersion,...(f.landscape189?{landscape189:f.landscape189}:{}),resourceTaken:id=>row.full.frontier.taken?.[id]||0,structureDestroyed:id=>(row.full.worldEvolution?.structures?.[id]??1)<=.001});worlds.set(key,row);if(worlds.size>2)worlds.delete(worlds.keys().next().value);}
 const row=worlds.get(key);row.full=full;return row.world;
}
function validate(raw,full){
 if(raw===undefined)return initial();
 const bad=()=>{throw Error('Registre des enclos et productions invalide.');};
 const fields=(o,keys)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join('|')!==keys.slice().sort().join('|'))bad();};
 const num=(v,min,max,int=false)=>{if(!Number.isFinite(v)||v<min||v>max||int&&!Number.isInteger(v))bad();return v;};
 fields(raw,['version','next','behaviors','pens','animals']);if(raw.version!==1||typeof raw.behaviors!=='boolean'||!Array.isArray(raw.pens)||raw.pens.length>R.maxPens||!Array.isArray(raw.animals)||raw.animals.length>R.maxAnimals)bad();
 num(raw.next,1,1000000,true);const ids=new Set(),sources=new Set(),id=n=>{num(n,1,raw.next-1,true);if(ids.has(n))bad();ids.add(n);};
 for(const p of raw.pens){fields(p,['id','x','y','health','food','water','meat','hides','leather','breed','meatAge','hideAge']);id(p.id);
  num(p.x,R.penSize,W.sizeForGeneration(10)-R.penSize);num(p.y,R.penSize,W.sizeForGeneration(10)-R.penSize);num(p.health,0,R.health);
  for(const k of ['food','water','meat','hides','leather'])num(p[k],0,R.stockCapacity);
  num(p.breed,0,R.breedSeconds);num(p.meatAge,0,R.meatLife);num(p.hideAge,0,R.hideLife);
  if(raw.pens.some(q=>q!==p&&distance(q,p)<R.spacing))bad();
 }
 const pens=new Map(raw.pens.map(p=>[p.id,p]));
 for(const a of raw.animals){fields(a,['id','source','species','pen','sex','age','health','status','parents']);id(a.id);
  if(!R.captive[a.species]||!pens.has(a.pen)||!['female','male'].includes(a.sex)||!['held','stranded','released','dead','processed'].includes(a.status)||!Array.isArray(a.parents))bad();
  num(a.age,0,1e9);num(a.health,0,100);if((a.status==='dead'||a.status==='processed')!==(a.health===0))bad();
  if(a.source!==null){if(typeof a.source!=='string'||!/^A189_(0|[1-9]\d{0,2})_(0|[1-9]\d{0,2})_[0-7]$/.test(a.source)||sources.has(a.source)||a.parents.length)bad();sources.add(a.source);}
  else {if(a.status==='stranded'||a.parents.length!==2||a.parents[0]===a.parents[1]||!R.captive[a.species].breed)bad();for(const parentId of a.parents){const parent=raw.animals.find(p=>p.id===parentId);if(!parent||parent.id>=a.id||parent.species!==a.species)bad();}const [mother,father]=a.parents.map(i=>raw.animals.find(p=>p.id===i));if(mother.sex===father.sex)bad();}
 }
 for(const p of raw.pens){const held=raw.animals.filter(a=>a.pen===p.id&&['held','stranded'].includes(a.status));if(held.length>R.penCapacity||new Set(held.map(a=>a.species)).size>1||held.some(a=>p.health>0?a.status==='stranded':a.status==='held'))bad();}
 if(full&&(raw.pens.length||raw.animals.length||raw.behaviors)){
  if(!full.frontier?.landscape189||full.frontier.hydrologyVersion!==1)bad();const w=worldFor(full);
  for(const p of raw.pens){if(p.x>=w.size-R.penSize||p.y>=w.size-R.penSize)bad();if(p.health>0&&full.frontier.active&&full.frontier.z===0&&Math.abs(full.frontier.x-p.x)<R.penSize/2+.32&&Math.abs(full.frontier.y-p.y)<R.penSize/2+.32)bad();if(distance(p,w.home)<C.BiomePopulation165Rules.homeExclusion)bad();const road=w.nearestRoad(p);if(road&&road.d<road.road.width/2+R.penSize)bad();
   if(p.health>0&&full.frontier.car){const vehicle=C.WorldEvolution?.RULES?.vehicles?.[full.worldEvolution?.fleet?.active]||C.WorldEvolution?.RULES?.vehicles?.break||{w:4.6,h:1.85};if(vehicleHitsPen(p,{...full.frontier.car,w:vehicle.w,h:vehicle.h}))bad();}
   for(const dx of [-1.5,-1,-.5,0,.5,1,1.5])for(const dy of [-1.5,-1,-.5,0,.5,1,1.5])if(w.blocked(p.x+dx,p.y+dy,.35,0,null)||w.hydrology.sample(p.x+dx,p.y+dy).water)bad();
  }
  for(const a of raw.animals)if(a.source){const q=P.candidate(w,a.source),saved=full.frontier.wildlife165?.[a.source];if(!q||q.species!==a.species||!saved)bad();
   if(a.status!=='released'&&distance(saved,raw.pens.find(p=>p.id===a.pen))>R.capturePenReach+.000001)bad();
   if(['held','stranded'].includes(a.status)&&saved.hp<=0||['dead','processed'].includes(a.status)&&saved.hp!==0)bad();
   if(a.sex!==(G.hash(full.worldSeed,a.source,'sex191')%2?'female':'male'))bad();
  }
 }
 return clone(raw);
}
// Read-only logistics estimates for already owned pens. No world generation,
// clock advancement, inferred journey, resource transfer or new save fields.
function penReports(state){
 return state.pens.map(p=>{
  const all=state.animals.filter(a=>a.pen===p.id),live=all.filter(a=>['held','stranded'].includes(a.status)),young=live.filter(a=>a.age<R.matureSeconds).length;
  const eligible=live.filter(a=>a.status==='held'&&a.age>=R.matureSeconds&&a.health>=75&&R.captive[a.species]?.breed);
  const pair=eligible.some(a=>eligible.some(b=>b.species===a.species&&b.sex!==a.sex));
  const alerts=[];if(p.health<=0)alerts.push('ruined');
  if(live.length&&p.food<=0)alerts.push('no-food');if(live.length&&p.water<=0)alerts.push('no-water');
  if(live.some(a=>a.health<100))alerts.push('injured');if(live.some(a=>a.status==='stranded'))alerts.push('stranded');
  const products={meat:p.meat,hides:p.hides,leather:p.leather,meatSeconds:p.meat>0?Math.max(0,R.meatLife-p.meatAge):null,hideSeconds:p.hides>0?Math.max(0,R.hideLife-p.hideAge):null};
  return {id:p.id,x:p.x,y:p.y,health:p.health,living:live.length,adults:live.length-young,young,stranded:live.filter(a=>a.status==='stranded').length,dead:all.filter(a=>a.status==='dead').length,
   food:p.food,water:p.water,species:[...new Set(live.map(a=>a.species))],alerts,products,
   autonomySeconds:live.length?Math.min(p.food/(live.length*R.foodPerSecond),p.water/(live.length*R.waterPerSecond)):null,
   birthSeconds:p.health>0&&p.breed>0&&pair&&live.length<R.penCapacity&&state.animals.length<R.maxAnimals?Math.max(0,R.breedSeconds-p.breed):null};
 }).sort((a,b)=>a.id-b.id);
}
function reportRows(state){
 const time=seconds=>seconds===null?'sans besoin actuel':seconds<60?Math.floor(seconds)+' s':Math.floor(seconds/60)+' min';
 const warnings={'ruined':'clôture détruite','no-food':'rations épuisées','no-water':'eau épuisée','injured':'animaux affaiblis','stranded':'origine de libération obstruée'};
 return penReports(state).map(r=>({label:'Registre · enclos '+r.id+' — '+(r.species.map(id=>Wild.species()[id]?.name||id).join(', ')||'vide'),
  value:r.adults+' adulte(s), '+r.young+' jeune(s) · intégrité '+Math.floor(r.health)+' % · rations/eau '+r.food.toFixed(1)+' / '+r.water.toFixed(1)+' · autonomie estimée '+time(r.autonomySeconds)+' aux besoins actuels (hors naissance). '+
   (r.alerts.length?r.alerts.map(code=>warnings[code]).join(' ; ')+'. ':'')+
   (r.products.meat?'Viande '+r.products.meat+' : péremption dans '+time(r.products.meatSeconds)+'. ':'')+
   (r.products.hides?'Peaux '+r.products.hides+' : péremption dans '+time(r.products.hideSeconds)+'. ':'')+
   (r.products.leather?'Cuir '+r.products.leather+'. ':'')+
   (r.birthSeconds!==null?'Reproduction : '+time(r.birthSeconds)+' restantes, entretien et intrants requis. ':'')+
   'Coordonnées régionales '+r.x.toFixed(1)+' / '+r.y.toFixed(1)+' m. Entretien sur place uniquement.'}));
}
function install(g){
 if(g.husbandry191)return g.husbandry191;if(!g.expansions||!g.wildHarvest190)return null;
 let s=initial(),task=null,message='',cooldowns=new Map(),soundLeft=0;
 const pos=()=>g.frontier.position(),world=()=>g.frontier.world();
 const pen=id=>s.pens.find(p=>p.id===id),held=id=>s.animals.filter(a=>a.pen===id&&['held','stranded'].includes(a.status));
 const claimed=id=>s.animals.some(a=>a.source===id&&a.status!=='released');
 const conscious=()=>g.state==='playing'&&!g.gameOver&&!g.player.dead&&g.player.health>0;
 const owns=id=>s.animals.some(a=>a.source===id&&['held','stranded'].includes(a.status));
 const access=p=>({x:p.x,y:p.y+R.penSize/2+.7});
 const near=p=>!!p&&pos().active&&pos().z===0&&distance(pos(),access(p))<=R.reach&&world().movementLine(pos(),access(p),0,pos().inside,null,.1);
 const visible=q=>g.visibility?.frame?.()?.canSeeRegionalPoint?.(q)??world().line(pos(),q,0,null,null,.05);
 const armed=()=>{const a=g.arsenal134?.snapshot();return a?.carried.find(i=>i.uid===a.equipped&&C.WildlifeHarvest190Rules.knives.includes(i.id)&&i.condition>0);};
 const hostiles=()=>[...g.frontier.contacts(),...(g.worldEvolution?.groupMembers?.()||[]),...(g.succession133?.contacts?.()||[])].filter(e=>!e.dead&&(e.hp??e.health)>0&&(e.z??0)===0);
 const danger=()=>hostiles().some(e=>distance(e,pos())<R.dangerRange&&world().line(e,pos(),0,null,null,.05));
 const bad=reason=>({ok:false,reason});
 function base(continuing=false){if(!conscious()||!g.expansions.canAct())return 'Commandant indisponible.';const p=pos();
  if(!p.active||p.z!==0||!p.landscape189||p.hydrologyVersion!==1)return 'À pied au sol dans un paysage naturel régional.';
  if(p.car?.driving||g.expeditions?.driving()||g.player.reload>0||g.selectedBuild||!continuing&&task||g.expansions.busy('husbandry191'))return 'Libérez vos mains et terminez les autres interventions.';
  if(danger())return 'Éloignez les infectés avant le travail.';return '';
 }
 function placement(){const p=pos();return{x:p.x,y:p.y-R.placementDistance};}
 function placeReason(q,rebuilding=null){const w=world();if(rebuilding===null&&(s.pens.length>=R.maxPens||s.next>=1000000))return 'Limite des enclos atteinte.';
  if(distance(q,w.home)<C.BiomePopulation165Rules.homeExclusion)return 'Gardez les enclos hors du refuge D-17.';
  if(s.pens.some(p=>p.id!==rebuilding&&distance(q,p)<R.spacing))return 'Éloignez les enclos les uns des autres.';
  const road=w.nearestRoad(q);if(road&&road.d<road.road.width/2+R.penSize)return 'Préservez la chaussée et ses abords.';
  const companions=(g.worldEvolution?.overview?.()?.companions||[]).filter(a=>a.health>0&&!a.riding&&Number.isFinite(a.x)&&Number.isFinite(a.y));
  const occupants=[pos(),...hostiles(),...g.frontier.wildlife165(),...companions];
  if(occupants.some(a=>(a.z??0)===0&&Math.abs(a.x-q.x)<R.penSize/2+(a.radius||.4)+.25&&Math.abs(a.y-q.y)<R.penSize/2+(a.radius||.4)+.25))return 'Un occupant se trouve dans cette emprise.';
  const car=pos().car;if(car){const profile=g.worldEvolution?.vehicleProfile?.()||{w:4.6,h:1.85};if(vehicleHitsPen(q,{...car,w:profile.w,h:profile.h}))return 'Déplacez le véhicule garé hors de cette emprise.';}
  for(const dx of[-1.5,-1,-.5,0,.5,1,1.5])for(const dy of[-1.5,-1,-.5,0,.5,1,1.5])if(w.blocked(q.x+dx,q.y+dy,.35,0,null)||w.hydrology.sample(q.x+dx,q.y+dy).water)return 'Choisissez trois mètres de sol sec et libre.';
  if(!w.movementLine(pos(),access(q),0,pos().inside,null,.32))return 'L’accès sud doit rester libre.';return '';
 }
 function freshWater(p){const w=world(),from=access(p);for(let i=0;i<24;i++){const a=i*Math.PI/12,q={x:from.x+Math.cos(a)*R.reach,y:from.y+Math.sin(a)*R.reach};const h=w.hydrology.sample(q.x,q.y);if(h.water&&!h.crossing&&(h.salinity===0||h.salinity==='fresh')&&w.wildlifeWaterLine(from,q,.05))return q;}return null;}
 function quote(kind,id=null,target=null,continuing=false){const why=base(continuing);if(why)return bad(why);let cost={},seconds=0,site=pen(id),q=null,tool=null;
  if(kind==='build'){q=task&&continuing?task.point:placement();const no=placeReason(q);if(no)return bad(no);cost=R.penCost;seconds=R.buildSeconds;}
  else if(kind==='behaviors'){if(s.behaviors)return bad('Comportements naturels déjà actifs.');}
  else {
   if(!site||!near(site))return bad('Rejoignez l’accès sud de l’enclos.');
   if(kind==='rebuild'){
    if(site.health>0)return bad('Enclos encore utilisable : réparez la clôture.');
    const no=placeReason(site,site.id);if(no)return bad(no);cost=R.penCost;seconds=R.buildSeconds;
   }else if(site.health<=0&&kind!=='release')return bad('Enclos détruit : reconstruisez sa clôture sur place.');
   else if(kind==='capture'){
    q=g.frontier.wildlifeStatus165(target);if(!q||q.hp<=0||claimed(target)||!R.captive[q.species]||!g.frontier.wildlife165().some(a=>a.id===target))return bad('Animal vivant capturable absent.');
    if(s.animals.length>=R.maxAnimals&&!s.animals.some(a=>a.source===target)||s.next>=1000000)return bad('Carnet de captivité plein.');
    if(held(id).length>=R.penCapacity||held(id).some(a=>a.species!==q.species))return bad('Enclos plein ou espèce incompatible.');
    if(distance(pos(),q)>R.captureReach||distance(site,q)>R.capturePenReach||!visible(q)||!world().movementLine(pos(),q,0,pos().inside,null,.05))return bad('Approchez l’animal depuis l’accès de l’enclos, sans obstacle.');
    cost=R.captureCost;seconds=R.captureSeconds;
   }else if(kind==='feed'){if(site.food>=R.stockCapacity)return bad('Mangeoire pleine.');cost={food:Math.min(R.feedPortion,R.stockCapacity-site.food)};}
   else if(kind==='water'){if(site.water>=R.stockCapacity||!freshWater(site))return bad('Eau douce réelle à portée de l’accès requise, abreuvoir non plein.');seconds=R.waterSeconds;}
   else if(kind==='release'||kind==='slaughter'){
    q=held(id).find(a=>a.id===target);if(!q)return bad('Animal captif absent.');
    if(kind==='release'&&!q.source)return bad('La remise en liberté des animaux nés en enclos reste indisponible.');
    if(kind==='slaughter'){tool=armed();if(!tool)return bad('Équipez un couteau ou une machette en état.');const d=R.captive[q.species];if(site.meat+d.meat>R.stockCapacity||site.hides+d.hides>R.stockCapacity)return bad('Stock de viande ou de peaux plein.');if(q.age<R.matureSeconds)return bad('Les jeunes ne sont pas transformables.');seconds=R.slaughterSeconds;}
   }else if(kind==='cook'){if(site.meat<1||C.bagTotal(g.player.carry)>=g.player.carryCapacity)return bad('Viande crue et place dans le sac requises.');cost={fuel:R.cookFuel};seconds=R.cookSeconds;}
   else if(kind==='tan'){if(site.hides<1||site.water<R.tanWater||site.leather>=R.stockCapacity)return bad('Peau brute, eau et place dans le stock de cuir requises.');cost={fuel:R.tanFuel};seconds=R.tanSeconds;}
   else if(kind==='lining'){if(site.leather<2)return bad('Deux cuirs sont requis pour renforcer l’enclos.');if(site.health>=R.health)return bad('Enclos déjà intact.');}
   else return bad('Intervention inconnue.');
  }
  if(!continuing&&!C.canAfford(g.player.carry,cost))return bad('Fournitures requises dans le sac : '+Object.entries(cost).map(([k,n])=>n+' '+C.RESOURCE_META[k].label).join(', '));
  return{ok:true,kind,id,target,cost:{...cost},seconds,point:kind==='build'?q:null,tool:tool?.uid??null};
 }
 function notify(text){const stored=g.save(false);message=text+(stored?'':' Stockage indisponible : exportez la partie.');g.notify(message,stored?'good':'danger');}
 function cancel(reason='Travail interrompu. Les fournitures déjà engagées ne sont pas remboursées.'){if(!task)return false;task=null;message=reason;return true;}
 function commit(t){const p=pen(t.id);
  if(t.kind==='build')s.pens.push({id:s.next++,...t.point,health:R.health,food:0,water:0,meat:0,hides:0,leather:0,breed:0,meatAge:0,hideAge:0});
  if(t.kind==='rebuild'){p.health=R.health;p.breed=0;for(const a of held(p.id))if(a.status==='stranded')a.status='held';}
  if(t.kind==='behaviors')s.behaviors=true;
  if(t.kind==='feed')p.food+=t.cost.food;
  if(t.kind==='water')p.water=Math.min(R.stockCapacity,p.water+R.waterPortion);
  if(t.kind==='capture'){const q=g.frontier.wildlifeStatus165(t.target),old=s.animals.find(a=>a.source===t.target);
   const a={id:old?.id??s.next++,source:q.id,species:q.species,pen:p.id,sex:G.hash(g.world.seed,q.id,'sex191')%2?'female':'male',age:R.matureSeconds,health:100*q.hp/q.profile.health,status:'held',parents:[]};if(old)Object.assign(old,a);else s.animals.push(a);
  }
  if(t.kind==='release'){const a=s.animals.find(a=>a.id===t.target);if(!g.frontier.releaseCaptive191(a.source))return bad('Registre sauvage indisponible.');a.status='released';p.breed=0;}
  if(t.kind==='slaughter'){const a=s.animals.find(a=>a.id===t.target);if(a.source&&!g.frontier.retireWildlife191(a.source))return bad('Registre sauvage indisponible.');const d=R.captive[a.species];a.health=0;a.status='processed';p.meat+=d.meat;p.hides+=d.hides;p.breed=0;/* Old stock sets the conservative common expiry. */}
  if(t.kind==='cook'){const n=Math.min(R.cookPortion,p.meat,g.player.carryCapacity-C.bagTotal(g.player.carry));p.meat-=n;g.player.carry.food+=n;if(!p.meat)p.meatAge=0;}
  if(t.kind==='tan'){p.hides--;p.water-=R.tanWater;p.leather++;if(!p.hides)p.hideAge=0;}
  if(t.kind==='lining'){p.leather-=2;p.health=Math.min(R.health,p.health+25);}
  notify(t.kind==='cook'?'Provisions cuites dans le sac : rapportez-les au dépôt.':t.kind==='capture'?'Animal placé vivant dans l’enclos. Nourrissez et abreuvez-le.':'Intervention terminée ; stocks et captivité sauvegardés.');return{ok:true};
 }
 function begin(kind,id,target){const q=quote(kind,id,target);if(!q.ok){message=q.reason;return q;}if(!C.spend(g.player.carry,q.cost))return bad('Fournitures indisponibles.');
  if(!q.seconds)return commit(q);task={...q,elapsed:0,origin:{...pos()},health:g.player.health,world:g.world};g.frontier.signalAt(pos(),R.noise);g.save(false);return{ok:true};
 }
 function upkeep(dt){
  for(const p of s.pens){
   // Ruins must not freeze perishable products until the fence is rebuilt.
   if(p.meat){p.meatAge=Math.min(R.meatLife,p.meatAge+dt);if(p.meatAge>=R.meatLife){p.meat=0;p.meatAge=0;}}
   if(p.hides){p.hideAge=Math.min(R.hideLife,p.hideAge+dt);if(p.hideAge>=R.hideLife){p.hides=0;p.hideAge=0;}}
   const animals=held(p.id),needFood=animals.length*R.foodPerSecond*dt,needWater=animals.length*R.waterPerSecond*dt;
   const fed=p.food+1e-9>=needFood&&p.water+1e-9>=needWater;p.food=Math.max(0,p.food-needFood);p.water=Math.max(0,p.water-needWater);
   for(const a of animals){a.age=Math.min(1e9,a.age+dt);if(!fed)a.health=Math.max(0,a.health-R.starveDamage*dt);if(!a.health){if(a.source)g.frontier.retireWildlife191(a.source);a.status='dead';p.breed=0;}}
   if(!p.health){p.breed=0;continue;}
   if(pos().active&&pos().z===0){const pressure=hostiles().filter(e=>Math.max(Math.abs(e.x-p.x),Math.abs(e.y-p.y))<R.penSize/2+.75&&world().line(e,p,0,null,null,.05)).length;p.health=Math.max(0,p.health-pressure*R.penContactDamage*dt);if(!p.health){for(const a of animals)if(a.status==='held')a.status=a.source&&!g.frontier.releaseCaptive191(a.source)?'stranded':'released';p.breed=0;message=animals.some(a=>a.status==='stranded')?'Clôture détruite : une origine sauvage est obstruée. Le sujet reste sous votre garde ; dégagez son origine pour le libérer ou reconstruisez. Son entretien continue.':'Clôture détruite : animaux dispersés, jeunes sortis de la simulation détaillée.';continue;}}
   const eligible=animals.filter(a=>a.status==='held'&&a.age>=R.matureSeconds&&a.health>=75&&R.captive[a.species].breed),mother=eligible.find(a=>a.sex==='female'),father=eligible.find(a=>a.sex==='male');
   if(!fed||!mother||!father||animals.length>=R.penCapacity||s.animals.length>=R.maxAnimals){p.breed=0;continue;}
   p.breed=Math.min(R.breedSeconds,p.breed+dt);if(p.breed+1e-7>=R.breedSeconds&&p.food>=R.birthFood&&p.water>=R.birthWater&&s.next<1000000){const id=s.next++;p.food-=R.birthFood;p.water-=R.birthWater;p.breed=0;
    s.animals.push({id,source:null,species:mother.species,pen:p.id,sex:G.hash(g.world.seed,p.id,id,'birth191')%2?'female':'male',age:0,health:100,status:'held',parents:[mother.id,father.id]});message='Naissance dans l’enclos '+p.id+' ; entretien supplémentaire nécessaire.';}
  }
 }
 function step(dt){if(!conscious()){cancel();return;}if(g.paused||g.activeOverlay)return;if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(R.maxStep,dt);upkeep(dt);
  if(task){const t=task,q=quote(t.kind,t.id,t.target,true);if(!q.ok||t.world!==g.world||g.player.health<t.health||distance(pos(),t.origin)>R.moveTolerance||q.tool!==t.tool){cancel(q.reason);return;}
   t.elapsed+=dt;if(t.tool)g.arsenal134.wearTool('butcher',dt);g.interactionText='Enclos · '+t.kind+' · '+Math.floor(t.elapsed/t.seconds*100)+' %';
   if(t.elapsed+1e-7>=t.seconds){const final=quote(t.kind,t.id,t.target,true);if(!final.ok||final.tool!==t.tool){cancel(final.reason);return;}task=null;commit(t);}
  }
  soundLeft-=dt;if(soundLeft<=0){soundLeft=R.soundInterval;sound();}
 }
 function solid(x,y,r=0){return s.pens.some(p=>p.health>0&&Math.abs(x-p.x)<R.penSize/2+r&&Math.abs(y-p.y)<R.penSize/2+r);}
 function vehicleBlocked(x,y,a,w,h){return s.pens.some(p=>p.health>0&&vehicleHitsPen(p,{x,y,a,w,h}));}
 function lineClear(a,b,r=.05){const steps=Math.ceil(distance(a,b)/.2);for(let i=0;i<=steps;i++)if(solid(a.x+(b.x-a.x)*i/Math.max(1,steps),a.y+(b.y-a.y)*i/Math.max(1,steps),r))return false;return true;}
 function naturalIntent(e){if(cooldowns.size>R.maxAnimals)for(const[id,time]of cooldowns)if(time<g.elapsed)cooldowns.delete(id);if(!s.behaviors||!e.id.startsWith('A189_')||task?.target===e.id||claimed(e.id))return null;
  const p=pos(),w=world(),now=g.elapsed,prey=R.prey[e.species];
  if(e.species==='boar'&&e.hp<e.profile.health&&e.alarm>0&&distance(e,p)<=R.boarReach&&w.movementLine(e,p,0,null,null,.1)){
   if((cooldowns.get(e.id)||0)<=now){g.frontier.damage(R.boarDamage);cooldowns.set(e.id,now+R.boarCooldown);}return null;
  }
  if(!prey||e.alarm>0||!Wild.awake(e.profile,g.dayClock))return null;
  const target=g.frontier.wildlife165().filter(a=>a.id!==e.id&&prey.includes(a.species)&&distance(e,a)<R.predatorRange&&w.movementLine(e,a,0,null,null,e.radius)).sort((a,b)=>distance(e,a)-distance(e,b)||a.id.localeCompare(b.id))[0];
  if(!target)return null;
  if(distance(e,target)<=R.attackReach&&(cooldowns.get(e.id)||0)<=now){g.frontier.hitWildlife165(target.id,R.attackDamage);cooldowns.set(e.id,now+R.predatorCooldown);}
  return{a:Math.atan2(target.y-e.y,target.x-e.x),speed:R.predatorSpeed};
 }
 function sound(){if(!pos().active||pos().z!==0||g.settings?.muted||g.settings?.volume===0)return;const choices=g.frontier.wildlife165().filter(a=>a.profile.mode!=='swim'&&distance(pos(),a)<R.soundRange&&Wild.awake(a.profile,g.dayClock));
  if(!choices.length)return;const a=choices[G.hash(g.world.seed,Math.floor(g.elapsed/R.soundInterval),'call191')%choices.length],v=R.soundVolume*(1-distance(pos(),a)/R.soundRange)*(world().line(pos(),a,0,null,null,.05)?1:.2),signature=G.hash(a.species,'voice191');
  // Stylised synthesis through the existing master/mute/voice-budget path; not recordings.
  try{g.audio.tone(180+signature%1200,.08+(signature%5)*.035,'sine',v,40+signature%120);if(a.profile.mode==='air')g.audio.tone(300+signature%1500,.12,'triangle',v*.5,-70);}catch{}
 }
 function view(){const point=task?.kind==='build'?task.point:task?.kind==='rebuild'?pen(task.id):null;return{...clone(s),task:task?{kind:task.kind,id:task.id,target:task.target,point:point?{x:point.x,y:point.y}:null,progress:Math.min(1,task.elapsed/task.seconds)}:null};}
 function overview(){const p=s.pens.find(near);return{summary:message||'Enclos régionaux fixes : capture locale au filet, entretien, naissances et transformation. Les stocks bruts restent sur place.',
   rows:[{label:'Enclos',value:s.pens.length+' / '+R.maxPens},{label:'Animaux captifs',value:s.animals.filter(a=>['held','stranded'].includes(a.status)).length},{label:'Origines obstruées',value:s.animals.filter(a=>a.status==='stranded').length+' sujets gardés en ruine ; entretien maintenu, libération après dégagement ou reconstruction'},{label:'Capture',value:'Lapin, canard, lièvre, faisan, perdrix ; filet local près de l’enclos'},{label:'Reproduction',value:'Lapins / canards adultes, sexes différents, rations et eau ; 15 minutes simulées'},{label:'Abreuvement',value:'Eau douce à portée de l’accès sud ; pas de puisage distant'},{label:'Comportements sauvages',value:s.behaviors?'Prédation locale et défense du sanglier actives':'Inactifs ; activation volontaire'},
  ...reportRows(s),...(p?[{label:'Enclos '+p.id,value:held(p.id).length+' / '+R.penCapacity+' animaux ; intégrité '+p.health.toFixed(0)},{label:'Rations / eau',value:p.food.toFixed(1)+' / '+p.water.toFixed(1)},{label:'Viande / peaux / cuir',value:[p.meat,p.hides,p.leather].map(n=>n.toFixed(1)).join(' / ')}]:[])],task:view().task};}
 function actions(){if(task)return[{id:'cancel',label:'Interrompre',description:'Les intrants engagés restent consommés.',close:false,run:()=>({ok:cancel()})}];
  const offered=[['build',null,null,'Construire un enclos au nord de soi (10 bois, 6 ferraille)']];if(!s.behaviors)offered.push(['behaviors',null,null,'Activer la prédation locale et la défense du sanglier']);
  const p=s.pens.find(near);if(p){if(p.health<=0)offered.push(['rebuild',p.id,null,'Reconstruire cet enclos (10 bois, 6 ferraille)']);
   for(const[k,label]of[['feed','Ajouter des rations'],['water','Puiser de l’eau douce à portée'],['cook','Cuire la viande (0,5 carburant)'],['tan','Tanner une peau (eau + 0,5 carburant)'],['lining','Réparer la clôture (2 cuirs)']])offered.push([k,p.id,null,label]);
   for(const a of g.frontier.wildlife165().filter(a=>R.captive[a.species]&&distance(pos(),a)<R.captureReach+1).slice(0,4))offered.push(['capture',p.id,a.id,'Capturer : '+a.profile.name]);
   for(const a of held(p.id)){offered.push(['release',p.id,a.id,'Libérer '+Wild.species()[a.species].name+' #'+a.id]);offered.push(['slaughter',p.id,a.id,'Transformer '+Wild.species()[a.species].name+' #'+a.id]);}
  }
  return offered.map(([kind,id,target,label])=>{const q=quote(kind,id,target);return{id:kind+':'+id+':'+target,label,description:q.reason||'Travail sur place. Les jeunes et les animaux non compatibles sont protégés.',disabled:!q.ok,reason:q.reason||'',close:!!q.seconds,run:()=>begin(kind,id,target)};});
 }
 const api=Object.freeze({begin,cancel,quote,step,view,reports:()=>penReports(s),overview,actions,busy:()=>!!task,claimed,owns,solid,vehicleBlocked,lineClear,naturalIntent,access,
  healthFraction:id=>(s.animals.find(a=>a.source===id&&['held','stranded'].includes(a.status))?.health??0)/100,
  restrained:id=>task?.kind==='capture'&&task.target===id,snapshot:()=>validate(s)});g.husbandry191=api;
 g.expansions.register({id:'husbandry191',title:'Enclos & transformation',validate,snapshot:api.snapshot,overview,actions,busy:()=>!!task,restore:raw=>{s=validate(raw);task=null;message='';cooldowns.clear();soundLeft=R.soundInterval;},reset:()=>{s=initial();task=null;message='';cooldowns.clear();soundLeft=R.soundInterval;}});
 const update=g.update.bind(g);g.update=dt=>{if(task&&!g.paused&&!g.activeOverlay&&(g.input.mouseDown||g.input.touchFire||[...g.input.keys,...g.input.pressed].some(k=>/^Key[WAZQSDERF]$|^Arrow|^Page/.test(k))))cancel();const result=update(dt);step(dt);return result;};
 const damage=g.damagePlayer?.bind(g);if(damage)g.damagePlayer=(...args)=>{const health=g.player.health,result=damage(...args);if(g.player.health<health)cancel('Blessure : travail interrompu. Les fournitures engagées restent consommées.');return result;};
 const start=g.startNew?.bind(g);if(start)g.startNew=(...args)=>{const previous={state:s,task,message,world:g.world};try{return start(...args);}finally{if(g.world===previous.world){s=previous.state;task=previous.task;message=previous.message;}}};
 const menu=g.returnToMenu.bind(g);g.returnToMenu=(...a)=>{cancel();return menu(...a);};return api;
}
const api=Object.freeze({initial,validate,install,penReports});root.DeadwallHusbandry191=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
