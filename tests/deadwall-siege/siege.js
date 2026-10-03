/* DEADWALL 1.3 — deterministic siege variants and resource-conserving fire response. */
(function initDeadwallSiege(root) {
  'use strict';
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const RULES = freeze({ version: 1, saveVersion: 5, maxStep: .25, maxFires: 32, maxTanks: 128, maxCrew: 16,
    waterCapacity: 120, pumpRate: .55, rainRate: .12, fuelPerWater: .012, bucketCapacity: 8, crewCapacity: 12,
    fillRate: 4, dischargeRate: 2, coolingPerWater: 9, initialHeat: 28, heatGrowth: .28,
    damageBase: 1.4, damageHeat: .048, burnSeconds: 180, spreadSeconds: 4, spreadHeat: 48,
    spreadGap: 38, wetSeconds: 24, ignitionRatio: .45, workRange: 76, dangerRadius: 105,
    crewPerStation: 2, warningBonus: 7, historyLimit: 24, maxCounter: 1e12, maxId: 0x7ffffffe });
  const PROFILES = freeze([
    { id:'compact', name:'La Marée compacte', minWave:3, interval:.8, weights:{walker:2,runner:.65,crawler:.8},
      brief:'Une masse lente et resserrée approche. Le nombre de contacts ne change pas, mais les arrivées se concentrent.', advice:'Gardez de la profondeur derrière la première porte et surveillez les amas de corps.' },
    { id:'rush', name:'La Course des récents', minWave:4, interval:.85, weights:{runner:2.3,crawler:1.5,armored:.65},
      brief:'Davantage d’infectés récents, moins de silhouettes protégées. Les accès mal fermés seront atteints rapidement.', advice:'Couvrez les portes par des tirs croisés. Un mur encombré de corps peut être franchi.' },
    { id:'breakers', name:'Les Colonnes de rupture', minWave:5, interval:1.12, weights:{breacher:2.8,armored:1.3,runner:.7},
      brief:'Les silhouettes de chantier sont nombreuses. Leur poussée menace les structures, pas leur santé maximale.', advice:'Concentrez les tirs sur les briseurs et préparez les ingénieurs derrière la ligne.' },
    { id:'hunters', name:'Les Rues de traverse', minWave:6, interval:.95, weights:{stalker:2.6,runner:1.4,walker:.9},
      brief:'Des traqueurs se mêlent à la migration. Les équipes isolées risquent de devenir leurs cibles.', advice:'Rappelez les ouvriers exposés ; les porteurs d’eau ne doivent pas intervenir seuls au contact.' },
    { id:'burden', name:'Le Poids des dépouilles', minWave:8, interval:1.3, weights:{bloated:2.6,armored:1.8,runner:.6},
      brief:'Plus de silhouettes lourdes et protégées. Leur progression est lente, mais leurs corps chargent les remparts.', advice:'Abattez-les en avant des murs, puis sécurisez un trajet pour les équipes de déblaiement.' },
    { id:'attrition', name:'Le Siège étiré', minWave:9, interval:1.7, weights:{walker:1.3,howler:1.8,stalker:1.2},
      brief:'Les mêmes effectifs arrivent sur une durée plus longue. Les ateliers et l’approvisionnement devront tenir.', advice:'Évitez la surproduction à vide. Préservez carburant, eau et munitions pour la fin de l’assaut.' },
    { id:'pincer', name:'La Prise en tenaille', minWave:10, interval:1, weights:{}, frontPattern:'pincer',
      brief:'Le premier échelon arrive par deux fronts opposés, le deuxième par les deux côtés latéraux, puis le dernier par les quatre côtés. Les effectifs et silhouettes restent ordinaires.', advice:'Répartissez les sections entre les portes opposées, puis gardez une réserve pour les côtés latéraux. Les pauses ne retirent aucun infecté déjà présent.' },
    { id:'flank', name:'Le Débordement latéral', minWave:13, interval:1, weights:{}, frontPattern:'flank',
      brief:'Le premier échelon approche par un côté, le deuxième par ses deux côtés latéraux, et le dernier par le côté opposé. Les mêmes effectifs déplacent la pression autour de la cité.', advice:'Préparez les trajets entre les lignes : ne laissez pas toutes les sections sur le premier front quand les arrivées se déplacent.' }
  ]);
  const PROFILE_BY_ID = Object.freeze(Object.fromEntries(PROFILES.map(p => [p.id,p])));
  const build=(id,name,category,icon,description,cost,health,size,tier,score,extra={})=>freeze({id,name,category,icon,description,cost,health,size,unlockTier:tier,score,buildTime:24,color:'#54645d',roof:'#7e8d83',...extra});
  const BUILDINGS=freeze({
    fireCistern:build('fireCistern','Citerne anti-incendie','industry','◒','Pompe et conserve 120 unités d’eau de secours. Pompe électrique consommant du carburant ; collecte lente de la pluie.',{scrap:60,stone:40,fuel:8},820,[3,2],1,6,{symbol:'EAU',powerUse:2}),
    fireStation:build('fireStation','Poste de secours incendie','colony','✚','Équipe deux ouvriers existants. Ils prennent l’eau en citerne et rejoignent les foyers par les accès libres.',{wood:65,scrap:80,stone:25},1000,[3,3],2,8,{symbol:'SI',powerUse:2,requires:'workshop',light:85}),
    fireScreen:build('fireScreen','Cloison coupe-feu','defense','▥','Paroi incombustible qui interrompt la propagation directe des flammes et bloque le passage. Placez-la sans condamner vos accès.',{scrap:12,stone:10},680,[1,1],2,.6,{symbol:'CF',wall:true,defense:true,buildTime:7}),
    alarmTower:build('alarmTower','Vigie d’alerte','colony','⌁','À partir de la vague 3, ajoute sept secondes à une nouvelle alerte si elle est terminée et alimentée. Le bonus ne se cumule pas.',{wood:70,scrap:65,ammo:10},720,[2,2],1,6,{symbol:'AL',powerUse:1,light:120})
  });
  // Concrete/steel/fire screens are not combustible. Only damaged hot machinery ignites by itself.
  const MATERIALS=freeze({core:.6,house:1,barracks:.85,clinic:.65,farm:1.15,warehouse:.9,lumber:1.3,scrapyard:.55,
    quarry:.35,refinery:1.25,generator:1.15,workshop:.7,ammoFactory:1.2,woodWall:1.3,watchtower:1,
    fieldKitchen:1,dressingWorkshop:.8,recoveryBench:.7,sectorPost:.75,logisticsGarage:.65,fireStation:.6,alarmTower:.8});
  const SOURCES=freeze(['generator','refinery','ammoFactory','fieldKitchen']);
  const REASONS=freeze(['machinery','blast','spread']);
  const EVENTS=freeze(['ignited','extinguished','burnedOut','destroyed','assigned','released','crewLost','wave']);
  const object=x=>Boolean(x&&typeof x==='object'&&!Array.isArray(x));
  const finite=(x,min=0,max=RULES.maxCounter)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
  const int=(x,min=1,max=RULES.maxId)=>Number.isInteger(x)&&x>=min&&x<=max;
  const fail=m=>{throw new Error('Registre de siège invalide : '+m+'.');};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const live=b=>Boolean(b&&!b.dead&&b.health>0);
  const operational=b=>live(b)&&(b.completed===true||b.progress>=1);
  const susceptibility=b=>MATERIALS[b?.type]||0;
  function create(){return {version:1,tanks:[],fires:[],wet:[],crew:[],playerWater:0,lastWave:null,history:[],
    stats:{ignitions:0,extinguished:0,burnedOut:0,destroyed:0,waterProduced:0,waterUsed:0,waterLost:0}};}
  function normalize(raw){
    if(raw===undefined)return create();if(!object(raw)||raw.version!==1)fail('version');
    const out=create();
    const list=(key,max)=>{if(!Array.isArray(raw[key])||raw[key].length>max)fail(key);return raw[key];};
    const seen=(list,id)=>{if(!int(id)||list.has(id))fail('identifiant absent ou dupliqué');list.add(id);return id;};
    let ids=new Set();out.tanks=list('tanks',RULES.maxTanks).map(r=>{if(!object(r)||!finite(r.water,0,RULES.waterCapacity))fail('citerne');return{id:seen(ids,r.id),water:r.water};});
    ids=new Set();out.fires=list('fires',RULES.maxFires).map(r=>{if(!object(r)||!finite(r.heat,Number.MIN_VALUE,100)||!finite(r.age,0,RULES.burnSeconds)||!finite(r.spread,0,RULES.spreadSeconds)||!REASONS.includes(r.origin))fail('foyer');return{id:seen(ids,r.id),heat:r.heat,age:r.age,spread:r.spread,origin:r.origin};});
    ids=new Set();out.wet=list('wet',RULES.maxFires*4).map(r=>{if(!object(r)||!finite(r.seconds,Number.MIN_VALUE,RULES.wetSeconds))fail('humidification');const id=seen(ids,r.id);if(out.fires.some(f=>f.id===id))fail('foyer actif et humidifié');return{id,seconds:r.seconds};});
    ids=new Set();out.crew=list('crew',RULES.maxCrew).map(r=>{if(!object(r)||!finite(r.water,0,RULES.crewCapacity)||typeof r.release!=='boolean')fail('équipe');return{id:seen(ids,r.id),water:r.water,release:r.release};});
    if(!finite(raw.playerWater,0,RULES.bucketCapacity))fail('seau');out.playerWater=raw.playerWater;
    if(raw.lastWave!==null){const w=raw.lastWave;if(!object(w)||!int(w.wave,1,1e7)||!Object.hasOwn(PROFILE_BY_ID,w.id)||PROFILE_BY_ID[w.id].minWave>w.wave||![0,RULES.warningBonus].includes(w.bonus))fail('migration');out.lastWave={wave:w.wave,id:w.id,bonus:w.bonus};}
    out.history=list('history',RULES.historyLimit).map(r=>{if(!object(r)||!EVENTS.includes(r.type)||!int(r.id,0)||!finite(r.at))fail('journal');return{type:r.type,id:r.id,at:r.at};});
    if(!object(raw.stats))fail('statistiques');for(const k of Object.keys(out.stats)){if(!finite(raw.stats[k]))fail(k);out.stats[k]=raw.stats[k];}
    return out;
  }
  function profileFor(wave,seed=0){
    if(!int(wave,1,1e7)||!int(seed,0,0xffffffff))return null;
    const pool=PROFILES.filter(p=>p.minWave<=wave);if(!pool.length)return null;
    // Map seed changes the rotation; consecutive late waves visit every eligible profile.
    return pool[(wave+((Math.imul(seed,2654435761)>>>0)%pool.length))%pool.length];
  }
  function adaptPlan(plan,enemies,seed=0){
    const profile=profileFor(plan?.wave,seed);if(!profile)return {plan,profile:null};
    if(!int(plan.total,1,1e12)||!object(plan.composition)||!finite(plan.spawnInterval,.01,5))throw new Error('Plan de migration invalide.');
    const kinds=Object.keys(enemies).filter(k=>plan.wave>=enemies[k].unlockWave),scores=kinds.map(k=>({kind:k,score:Math.max(0,plan.composition[k]||0)*(profile.weights[k]||1)}));
    if(!scores.length||scores.some(s=>!Number.isFinite(s.score)))throw new Error('Composition invalide.');
    const total=scores.reduce((n,s)=>n+s.score,0);if(total<=0)throw new Error('Composition vide.');
    const composition=Object.fromEntries(Object.keys(enemies).map(k=>[k,0]));let assigned=0;
    for(const s of scores){const exact=s.score/total*plan.total;s.count=Math.floor(exact);s.frac=exact-s.count;assigned+=s.count;composition[s.kind]=s.count;}
    scores.sort((a,b)=>b.frac-a.frac||a.kind.localeCompare(b.kind));
    for(let i=0;i<plan.total-assigned;i++)composition[scores[i%scores.length].kind]++;
    return {profile,plan:{...plan,composition,spawnInterval:Math.max(.04,Math.min(2,plan.spawnInterval*profile.interval))}};
  }
  function rect(b){const w=(b.w||b.def?.size?.[0]||1)*32,h=(b.h||b.def?.size?.[1]||1)*32;return{left:b.left??b.x-w/2,right:b.right??b.x+w/2,top:b.top??b.y-h/2,bottom:b.bottom??b.y+h/2};}
  function edgeDistance(a,b){const x=rect(a),y=rect(b);return Math.hypot(Math.max(0,x.left-y.right,y.left-x.right),Math.max(0,x.top-y.bottom,y.top-x.bottom));}
  function intersects(a,b,r){let lo=0,hi=1;for(const [o,d,min,max]of [[a.x,b.x-a.x,r.left,r.right],[a.y,b.y-a.y,r.top,r.bottom]]){if(Math.abs(d)<1e-9){if(o<min||o>max)return false;}else{lo=Math.max(lo,Math.min((min-o)/d,(max-o)/d));hi=Math.min(hi,Math.max((min-o)/d,(max-o)/d));if(lo>hi)return false;}}return true;}
  function heatClear(a,b,buildings){return !buildings.some(c=>c.id!==a.id&&c.id!==b.id&&operational(c)&&['fireScreen','steelWall','concreteWall'].includes(c.type)&&intersects(a,b,rect(c)));}
  function waterFlow(water,{powered,weather=0,fuel=0},dt=RULES.maxStep){
    if(!finite(water,0,RULES.waterCapacity)||!finite(fuel)||!finite(dt,Number.MIN_VALUE,RULES.maxStep))return{rain:0,pumped:0,cost:0};
    weather=finite(weather,0,1)?weather:0;
    const space=Math.max(0,RULES.waterCapacity-water),rain=Math.min(space,RULES.rainRate*weather*dt);
    const pumped=powered?Math.min(space-rain,RULES.pumpRate*dt,fuel/RULES.fuelPerWater):0;
    return{rain,pumped,cost:pumped*RULES.fuelPerWater};
  }
  class Engine {
    constructor(raw){this.state=normalize(raw);}
    snapshot(){return clone(this.state);}
    addStat(key,value){this.state.stats[key]=Math.min(RULES.maxCounter,this.state.stats[key]+value);}
    log(type,id=0,at=0){this.state.history.push({type,id,at:finite(at)?at:0});if(this.state.history.length>RULES.historyLimit)this.state.history.shift();}
    tank(id){return this.state.tanks.find(t=>t.id===id);}
    fire(id){return this.state.fires.find(f=>f.id===id);}
    member(id){return this.state.crew.find(c=>c.id===id);}
    reconcile(buildings,units=[]){
      const bs=new Map(buildings.filter(live).map(b=>[b.id,b]));
      for(const t of [...this.state.tanks])if(!bs.has(t.id)||bs.get(t.id).type!=='fireCistern'){this.addStat('waterLost',t.water);this.state.tanks.splice(this.state.tanks.indexOf(t),1);}
      for(const b of buildings)if(operational(b)&&b.type==='fireCistern'&&!this.tank(b.id)&&this.state.tanks.length<RULES.maxTanks)this.state.tanks.push({id:b.id,water:0});
      for(const f of [...this.state.fires])if(!bs.has(f.id)){this.state.fires.splice(this.state.fires.indexOf(f),1);this.addStat('destroyed',1);this.log('destroyed',f.id);}
      this.state.wet=this.state.wet.filter(w=>bs.has(w.id));
      for(const c of [...this.state.crew])if(!units.some(u=>live(u)&&u.id===c.id&&u.kind==='worker')){this.addStat('waterLost',c.water);this.state.crew.splice(this.state.crew.indexOf(c),1);this.log('crewLost',c.id);}
    }
    ignite(b,origin='machinery',at=0){
      if(!operational(b)||!int(b.id)||!susceptibility(b)||!REASONS.includes(origin)||this.fire(b.id)||this.state.wet.some(w=>w.id===b.id)||this.state.fires.length>=RULES.maxFires)return false;
      if(origin==='machinery'&&(!SOURCES.includes(b.type)||b.health/(b.maxHealth||b.def.health)>RULES.ignitionRatio))return false;
      this.state.fires.push({id:b.id,heat:RULES.initialHeat,age:0,spread:0,origin});this.addStat('ignitions',1);this.log('ignited',b.id,at);return true;
    }
    explosion(source,buildings,at=0){let count=0;for(const b of buildings.slice().sort((a,b)=>a.id-b.id))if(b.id!==source.id&&edgeDistance(source,b)<=Math.min(70,source.def?.explosive||0)&&heatClear(source,b,buildings))count+=Number(this.ignite(b,'blast',at));return count;}
    step(dt,{buildings,resources,weather=0,running=false,damage,units=[],at=0}){
      if(!running||!finite(dt,Number.MIN_VALUE,RULES.maxStep)||!Array.isArray(buildings)||!object(resources)||!finite(resources.fuel))return false;
      this.reconcile(buildings,units);weather=finite(weather,0,1)?weather:0;
      this.state.wet=this.state.wet.map(w=>({...w,seconds:w.seconds-dt})).filter(w=>w.seconds>0);
      for(const t of this.state.tanks){const b=buildings.find(b=>b.id===t.id);if(!operational(b))continue;
        const flow=waterFlow(t.water,{powered:b.powered&&!this.fire(b.id),weather,fuel:resources.fuel},dt);
        resources.fuel=Math.max(0,resources.fuel-flow.cost);t.water+=flow.rain+flow.pumped;this.addStat('waterProduced',flow.rain+flow.pumped);
      }
      const byId=new Map(buildings.map(b=>[b.id,b]));
      for(const f of [...this.state.fires]){const b=byId.get(f.id);if(!operational(b))continue;
        f.age=Math.min(RULES.burnSeconds,f.age+dt);f.heat=Math.min(100,f.heat+RULES.heatGrowth*(1-weather*.5)*dt);f.spread=Math.min(RULES.spreadSeconds,f.spread+dt);
        if(typeof damage==='function')damage(b,(RULES.damageBase+RULES.damageHeat*f.heat)*susceptibility(b)*dt);
        if(!live(b))continue;
        if(f.age>=RULES.burnSeconds){this.state.fires.splice(this.state.fires.indexOf(f),1);this.addStat('burnedOut',1);this.log('burnedOut',f.id,at);continue;}
        if(f.spread>=RULES.spreadSeconds){f.spread=0;if(f.heat>=RULES.spreadHeat){const target=buildings.filter(c=>operational(c)&&c.id!==b.id&&susceptibility(c)&&!this.fire(c.id)&&!this.state.wet.some(w=>w.id===c.id)&&edgeDistance(b,c)<=RULES.spreadGap&&heatClear(b,c,buildings)).sort((a,c)=>edgeDistance(b,a)-edgeDistance(b,c)||a.id-c.id)[0];if(target)this.ignite(target,'spread',at);}}
      }
      this.reconcile(buildings,units);return true;
    }
    fill(tankId,actor,dt,ctx){
      const t=this.tank(tankId),holder=actor===0?this.state:this.member(actor),key=actor===0?'playerWater':'water',capacity=actor===0?RULES.bucketCapacity:RULES.crewCapacity;
      if(!t||!holder||!ctx.running||!ctx.accessible||ctx.dead||!finite(dt,Number.MIN_VALUE,RULES.maxStep))return 0;
      const n=Math.min(t.water,RULES.fillRate*dt,capacity-holder[key]);if(n<=0)return 0;t.water-=n;holder[key]+=n;return n;
    }
    suppress(fireId,actor,dt,ctx){
      const f=this.fire(fireId),holder=actor===0?this.state:this.member(actor),key=actor===0?'playerWater':'water';
      if(!f||!holder||!ctx.running||!ctx.accessible||!ctx.secure||ctx.dead||!finite(dt,Number.MIN_VALUE,RULES.maxStep))return 0;
      const n=Math.min(holder[key],RULES.dischargeRate*dt,f.heat/RULES.coolingPerWater);if(n<=0)return 0;
      holder[key]=Math.max(0,holder[key]-n);f.heat=Math.max(0,f.heat-n*RULES.coolingPerWater);this.addStat('waterUsed',n);
      if(f.heat<1e-8){this.state.fires.splice(this.state.fires.indexOf(f),1);if(this.state.wet.length>=RULES.maxFires*4)this.state.wet.shift();this.state.wet.push({id:f.id,seconds:RULES.wetSeconds});this.addStat('extinguished',1);this.log('extinguished',f.id,ctx.at||0);}
      return n;
    }
    assign(id,ctx){if(!ctx.canCommand||!ctx.available||!int(id)||this.member(id)||this.state.crew.length>=Math.min(RULES.maxCrew,ctx.slots||0))return false;this.state.crew.push({id,water:0,release:false});this.log('assigned',id);return true;}
    release(id){const c=this.member(id);if(!c)return false;c.release=true;return true;}
    arriveHome(id){const c=this.member(id);if(!c||!c.release)return false;this.addStat('waterLost',c.water);this.state.crew.splice(this.state.crew.indexOf(c),1);this.log('released',id);return true;}
    playerDown(){this.addStat('waterLost',this.state.playerWater);this.state.playerWater=0;}
  }
  function installCatalogue(C){
    if(!C||C.Siege)return;for(const [id,def]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw new Error('Catalogue en conflit : '+id);C.BUILDINGS[id]=def;}
    const prior=C.migrateSaveData;
    C.migrateSaveData=input=>{if(!object(input))return null;if(input.version===5){if(input.siege===undefined)fail('registre v5 absent');const siege=normalize(input.siege),base=prior({...input,version:4});return base?{...base,version:5,siege}:null;}if(![1,2,3,4].includes(input.version))return null;const base=prior(input);return base?{...base,version:5,siege:create()}:null;};
    C.SAVE_VERSION=5;C.SAVE_KEY='deadwall-save-v5';C.SAVE_BACKUP_KEY='deadwall-save-backup-v5';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v4','deadwall-save-backup-v4',...C.LEGACY_SAVE_KEYS])];C.SIEGE_RULES=RULES;C.SIEGE_PROFILES=PROFILES;C.Siege=API;
  }
  const API=Object.freeze({RULES,PROFILES,PROFILE_BY_ID,BUILDINGS,MATERIALS,SOURCES,create,normalize,profileFor,adaptPlan,rect,edgeDistance,heatClear,susceptibility,waterFlow,Engine,installCatalogue});
  if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;root.DeadwallSiege=API;if(root.DeadwallCore)installCatalogue(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);
