/* DEADWALL 1.4 — daylight preparation and bounded night echelons. */
(function initDayworks(root){
 'use strict';
 const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
 const RULES=freeze({version:1,saveVersion:6,firstDay:210,day:240,minDay:180,dayDecay:1.25,maxStep:.25,
  discoveryRadius:210,surveyRange:54,surveySeconds:6,salvageRate:4,dangerRadius:120,siteClearance:28,
  maxSites:18,braceSeconds:8,braceHp:120,braceFraction:.2,braceCost:{wood:12,scrap:8},maxBraces:128,
  restRadius:90,restHeal:.6,restStamina:8,foodPerHealth:.05,prefabRadius:210,prefabBonus:.25,
  fuelPerWork:.04,scrapPerWork:.10,nightMinWave:4,echelonPause:6,maxPlanCells:64,maxId:0x7ffffffe});
 const site=(id,theme,name,text,resource,amount,unlock=null)=>({id,theme,name,text,resource,amount,unlock});
 const SITES=freeze([
  site('housing-1','housing','Le jardin derrière les volets','Une cour oubliée abrite des semences et un cahier de culture. Le relever ouvre la serre de jour.','food',18,'dayGreenhouse'),
  site('housing-2','housing','La remise du menuisier','Des bastaings secs ont été rangés au-dessus du sol. Rapportez-les avant de financer une nouvelle ligne.','wood',32),
  site('housing-3','housing','Le toit effondré','Les pierres triées ne valent rien ici. Leur poids occupera le sac pendant le retour.','stone',24),
  site('market-1','market','Les tiroirs de la droguerie','Sous le comptoir, des pansements ont échappé à la pluie. Les places dans le sac restent limitées.','medicine',5),
  site('market-2','market','Le rideau métallique','Des rails et des pièces de fixation peuvent être récupérés sans démanteler tout le quartier.','scrap',28),
  site('market-3','market','La réserve des commerçants','Quelques conserves intactes attendent derrière les étagères renversées.','food',22),
  site('aid-1','aid','La halte des brancardiers','Le plan d’un petit camp ferme la boucle entre entrepôt, halte et rempart.','medicine',4,'camp'),
  site('aid-2','aid','Le réchaud du camp','Un fond de combustible suffit à quelques heures de service, pas à une industrie perpétuelle.','fuel',16),
  site('aid-3','aid','La tente aux couvertures','Les caisses de ravitaillement sont finies : leur quantité ne revient pas à chaque aube.','food',24),
  site('industry-1','industry','Les gabarits de l’atelier','Les fiches de découpe permettent de monter une aire de préfabrication. Il faudra encore bâtir et alimenter celle-ci.','scrap',20,'prefabYard'),
  site('industry-2','industry','Le lot de traverses','Un lot de bois industriel est resté à l’écart des flammes.','wood',30),
  site('industry-3','industry','Le bac de pièces','Roulements, boulons et chutes de métal : la base de réparations futures.','scrap',26),
  site('transit-1','transit','La consigne du terminus','Des rations attendent dans une consigne ouverte. Le trajet de retour reste à sécuriser.','food',20),
  site('transit-2','transit','Le véhicule d’entretien','Des bidons partiellement pleins sont coincés sous la banquette.','fuel',20),
  site('transit-3','transit','Le ballast trié','Les sacs de granulats pourront renforcer la prochaine enceinte.','stone',30),
  site('checkpoint-1','checkpoint','Le casier du garde','La caisse ne contient qu’un petit lot de cartouches. Il faudra une production stable pour durer.','ammo',24),
  site('checkpoint-2','checkpoint','Le croquis du sas','Deux portes en série ménagent une zone de contrôle. Ce dessin n’enferme aucune unité à votre place.','scrap',18,'airlock'),
  site('checkpoint-3','checkpoint','La barrière couchée','Les madriers encore sains peuvent servir à étayer une porte avant le soir.','wood',24)
 ]);
 const BY_ID=freeze(Object.fromEntries(SITES.map(s=>[s.id,s])));
 const building=(id,name,category,icon,description,cost,health,size,tier,score,extra={})=>freeze({id,name,category,icon,description,cost,health,size,unlockTier:tier,score,buildTime:24,color:'#667361',roof:'#a8ac8b',...extra});
 const BUILDINGS=freeze({
  planningOffice:building('planningOffice','Bureau de chantier','colony','▧','Permet de prévisualiser puis financer des ensembles de chantiers. Aucun bâtiment n’est terminé instantanément.',{wood:50,scrap:35},780,[3,2],1,5,{symbol:'PLAN',light:50}),
  restShelter:building('restShelter','Halte de récupération','colony','⌂','Le jour, restaure lentement santé et endurance du commandant présent et hors danger. Les soins consomment des rations.',{wood:50,scrap:20,food:10},640,[3,2],1,4,{symbol:'HALTE',housing:2}),
  dayGreenhouse:building('dayGreenhouse','Serre de jour','industry','♧','Plan du jardin requis. Produit au calme diurne, avec électricité et carburant ; s’arrête pendant l’alerte et la nuit.',{wood:70,scrap:60,stone:25},660,[4,3],2,8,{symbol:'SERRE',powerUse:2,requires:'farm',production:{food:.72},consumes:{fuel:.04}}),
  prefabYard:building('prefabYard','Aire de préfabrication','industry','▤','Gabarits d’atelier requis. Accélère de 25 % le travail réel sur les chantiers proches pendant le jour, contre ferraille et carburant.',{wood:65,scrap:85,stone:40},960,[4,3],2,9,{symbol:'PRÉFA',powerUse:3,requires:'workshop'})
 });
 const PLANS=freeze([
  {id:'courtyard',name:'Enceinte de chantier',w:11,h:9,unlock:null,description:'34 palissades et une porte. Le centre reste libre pour vos constructions.'},
  {id:'airlock',name:'Sas à deux portes',w:7,h:7,unlock:'airlock',description:'20 palissades et deux portes opposées. Les portes ne se verrouillent pas automatiquement.'},
  {id:'camp',name:'Camp de halte',w:13,h:11,unlock:'camp',description:'42 palissades, une porte, une halte et un entrepôt : tous à construire.'}
 ]);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const finite=(v,min=0,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 const integer=(v,min=0,max=RULES.maxId)=>Number.isInteger(v)&&v>=min&&v<=max;
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const fail=m=>{throw new Error('Registre Aube & Bastions invalide : '+m+'.');};
 function create(){return {version:1,initialized:false,sites:[],day:{wave:0,duration:0},braces:[],night:null,stats:{surveyed:0,salvaged:0,plans:0,bonusWork:0,foodSpent:0,braced:0,absorbed:0}};}
 function normalize(raw){
  if(raw===undefined)return create();if(!object(raw)||raw.version!==1||typeof raw.initialized!=='boolean')fail('version');
  const out=create();out.initialized=raw.initialized;
  if(!Array.isArray(raw.sites)||raw.sites.length>18||(raw.initialized&&raw.sites.length!==18)||(!raw.initialized&&raw.sites.length))fail('découvertes');
  const ids=new Set();out.sites=raw.sites.map(s=>{const spec=BY_ID[s?.id];if(!spec||ids.has(s.id)||!finite(s.x,48,4048)||!finite(s.y,48,4048)||typeof s.seen!=='boolean'||!finite(s.survey,0,RULES.surveySeconds)||!finite(s.remaining,0,spec.amount))fail('point de terrain');
   if(!s.seen&&(s.survey!==0||s.remaining!==spec.amount)||s.survey<RULES.surveySeconds&&s.remaining!==spec.amount)fail('relevé et réserve incohérents');ids.add(s.id);return{id:s.id,x:s.x,y:s.y,seen:s.seen,survey:s.survey,remaining:s.remaining};});
  if(!object(raw.day)||!integer(raw.day.wave,0,1e7)||!finite(raw.day.duration,0,1e12))fail('durée du jour');out.day={wave:raw.day.wave,duration:raw.day.duration};
  if(!Array.isArray(raw.braces)||raw.braces.length>RULES.maxBraces)fail('étais');ids.clear();out.braces=raw.braces.map(b=>{if(!object(b)||!integer(b.id,1)||ids.has(b.id)||!integer(b.wave,1,1e7)||!finite(b.work,0,RULES.braceSeconds)||!finite(b.hp,0,RULES.braceHp)||(b.work<RULES.braceSeconds&&b.hp!==0))fail('étai');ids.add(b.id);return{id:b.id,wave:b.wave,work:b.work,hp:b.hp};});
  if(raw.night!==null){const n=raw.night;if(!object(n)||!integer(n.wave,4,1e7)||!integer(n.total,1,1e12)||!integer(n.emitted,0,n.total)||!integer(n.pauses,0,2)||!Array.isArray(n.fronts)||!n.fronts.length||n.fronts.length>4||new Set(n.fronts).size!==n.fronts.length||n.fronts.some(f=>!['north','east','south','west'].includes(f)))fail('échelons');
   const expected=Math.min(2,Math.floor(n.emitted*3/n.total));if(n.pauses!==expected)fail('pauses d’assaut');out.night={wave:n.wave,total:n.total,emitted:n.emitted,pauses:n.pauses,fronts:n.fronts.slice()};}
  if(!object(raw.stats))fail('statistiques');for(const k of Object.keys(out.stats)){if(!finite(raw.stats[k]))fail(k);out.stats[k]=raw.stats[k];}
  return out;
 }
 function generate(seed,sites,clear=()=>true){
  if(!integer(seed,0,0xffffffff)||!Array.isArray(sites))throw new Error('Carte de terrain invalide.');let state=(seed^0x14a0bed5)>>>0;
  const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;},result=[];
  for(const spec of SITES){const parent=sites.find(s=>s.theme===spec.theme);if(!parent)throw new Error('Quartier absent : '+spec.theme);let chosen=null;
   for(let i=0;i<320;i++){const a=rand()*Math.PI*2,r=170+rand()*(i>150?580:240),x=Math.max(48,Math.min(4048,parent.x+Math.cos(a)*r)),y=Math.max(48,Math.min(4048,parent.y+Math.sin(a)*r));
    if(result.every(s=>Math.hypot(s.x-x,s.y-y)>80)&&clear(x,y)){chosen={id:spec.id,x:Math.round(x*100)/100,y:Math.round(y*100)/100,seen:false,survey:0,remaining:spec.amount};break;}}
   // A fully built legacy map must still load. The point waits for a real open approach; no building is erased.
   if(!chosen)chosen={id:spec.id,x:Math.max(48,Math.min(4048,parent.x)),y:Math.max(48,Math.min(4048,parent.y)),seen:false,survey:0,remaining:spec.amount};result.push(chosen);
  }return result;
 }
 function dayDuration(wave,factor=1,scenarioSeconds=82){if(!integer(wave,1,1e7)||!finite(factor,.1,3)||!finite(scenarioSeconds,0,300))throw new Error('Cycle invalide.');return (wave===1?RULES.firstDay+scenarioSeconds-82:Math.max(RULES.minDay,RULES.day-(wave-1)*RULES.dayDecay))*factor;}
 function clock(phase,remaining,duration,nightProgress=0){const clamp=v=>Math.max(0,Math.min(1,v));if(phase==='calm')return .27+.45*(1-clamp(remaining/Math.max(1,duration)));if(phase==='warning')return .74;if(phase==='assault')return .83+.12*clamp(nightProgress);if(phase==='aftermath')return .98;return .5;}
 function unlocked(state,key){return state.sites.some(s=>s.survey>=RULES.surveySeconds&&BY_ID[s.id].unlock===key);}
 function footprint(planId,gx,gy){const p=PLANS.find(p=>p.id===planId);if(!p||!integer(gx,-128,128)||!integer(gy,-128,128))throw new Error('Projet inconnu.');const list=[],doorX=Math.floor(p.w/2)-1;
  for(let y=0;y<p.h;y++)for(let x=0;x<p.w;x++)if(!x||!y||x===p.w-1||y===p.h-1){const door=(y===p.h-1||p.id==='airlock'&&y===0)&&(x===doorX||x===doorX+1);if(!door)list.push({type:'woodWall',gx:gx+x,gy:gy+y,rotation:0});else if(x===doorX)list.push({type:'gate',gx:gx+x,gy:gy+y,rotation:0});}
  if(p.id==='camp')list.push({type:'restShelter',gx:gx+2,gy:gy+3,rotation:0},{type:'warehouse',gx:gx+7,gy:gy+3,rotation:0});return list;
 }
 function quote(items,catalogue,placement,tier,has){const cost={},occupied=new Set();if(!Array.isArray(items)||!items.length||items.length>RULES.maxPlanCells)return{ok:false,reason:'Ensemble vide ou trop grand.',cost};
  for(const i of items){const d=catalogue[i.type];if(!d)return{ok:false,reason:'Technologie absente.',cost};for(const [k,n]of Object.entries(d.cost))cost[k]=(cost[k]||0)+n;}
  for(const i of items){const d=catalogue[i.type];if(d.unlockTier>tier||d.requires&&!has(d.requires))return{ok:false,reason:'Technologie ou bâtiment requis absent.',cost};
   const w=i.rotation%2?d.size[1]:d.size[0],h=i.rotation%2?d.size[0]:d.size[1];
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(i.gx+x)+':'+(i.gy+y);if(occupied.has(k))return{ok:false,reason:'Chantiers superposés.',cost};occupied.add(k);}
   const check=placement(d,i.gx,i.gy,i.rotation);if(!check.valid)return{ok:false,reason:check.reason,cost};
  }return {ok:true,cost,reason:''};
 }
 function beginNight(wave,total,fronts){if(wave<4)return null;return normalize({...create(),night:{wave,total,emitted:0,pauses:0,fronts}}).night;}
 function frontGroup(n){if(!n)return null;const stage=Math.min(2,Math.floor(n.emitted*3/n.total));return stage===2&&n.fronts.length>2?n.fronts.slice(2):[n.fronts[stage%n.fronts.length]];}
 function emitted(n){if(!n||n.emitted>=n.total)return false;n.emitted++;const p=Math.min(2,Math.floor(n.emitted*3/n.total));const pause=p>n.pauses&&n.emitted<n.total;n.pauses=p;return pause;}
 class Engine{
  constructor(raw){this.state=normalize(raw);}
  snapshot(){return clone(this.state);}
  initialize(seed,sites,clear){if(this.state.initialized)return false;const result=generate(seed,sites,clear);this.state.sites=result;this.state.initialized=true;return true;}
  unlocked(k){return unlocked(this.state,k);}
  discover(player,visible=()=>true){let count=0;for(const s of this.state.sites)if(!s.seen&&Math.hypot(player.x-s.x,player.y-s.y)<=RULES.discoveryRadius&&visible(s)){s.seen=true;count++;}return count;}
  explore(id,dt,ctx){const s=this.state.sites.find(s=>s.id===id);if(!s||!s.seen||!finite(dt,Number.MIN_VALUE,RULES.maxStep)||!ctx.running||!ctx.day||!ctx.accessible||!ctx.secure||ctx.dead)return {survey:0,taken:0};
   if(s.survey<RULES.surveySeconds){const before=s.survey;s.survey=s.survey+dt>=RULES.surveySeconds-1e-8?RULES.surveySeconds:s.survey+dt;if(s.survey===RULES.surveySeconds){this.state.stats.surveyed++;return{survey:s.survey-before,taken:0,completed:true,unlock:BY_ID[id].unlock};}return {survey:s.survey-before,taken:0};}
   const bag=ctx.bag,room=Math.max(0,ctx.capacity-Object.values(bag).reduce((n,a)=>n+a,0)),taken=Math.min(s.remaining,room,dt*RULES.salvageRate);if(!(taken>0))return{survey:0,taken:0};bag[BY_ID[id].resource]=(bag[BY_ID[id].resource]||0)+taken;s.remaining=Math.max(0,s.remaining-taken);this.state.stats.salvaged+=taken;return{survey:0,taken};
  }
  reinforce(id,wave,dt,ctx){if(!integer(id,1)||!integer(wave,1,1e7)||!finite(dt,Number.MIN_VALUE,RULES.maxStep)||!ctx.running||!ctx.day||!ctx.accessible||!ctx.secure||ctx.dead)return false;
   let b=this.state.braces.find(b=>b.id===id);if(b&&b.wave!==wave){this.state.braces.splice(this.state.braces.indexOf(b),1);b=null;}
   if(b?.work===RULES.braceSeconds||!Object.entries(RULES.braceCost).every(([k,v])=>ctx.resources[k]>=v))return false;
   if(!b){if(this.state.braces.length>=RULES.maxBraces)return false;b={id,wave,work:0,hp:0};this.state.braces.push(b);}
   b.work=b.work+dt>=RULES.braceSeconds-1e-8?RULES.braceSeconds:b.work+dt;if(b.work===RULES.braceSeconds){for(const [k,v]of Object.entries(RULES.braceCost))ctx.resources[k]-=v;b.hp=RULES.braceHp;this.state.stats.braced++;return true;}return false;
  }
  absorb(id,wave,damage){const b=this.state.braces.find(b=>b.id===id&&b.wave===wave&&b.work===RULES.braceSeconds);if(!b||!finite(damage,Number.MIN_VALUE))return damage;const used=Math.min(b.hp,damage*RULES.braceFraction);b.hp-=used;this.state.stats.absorbed+=used;return damage-used;}
 }
 function installCatalogue(C){if(!C||C.Dayworks)return;for(const [id,b]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw new Error('Construction en conflit : '+id);C.BUILDINGS[id]=b;}
  const old=C.migrateSaveData;C.migrateSaveData=raw=>{if(!object(raw))return null;if(raw.version===6){if(raw.dayworks===undefined)fail('registre v6 absent');const d=normalize(raw.dayworks),base=old({...raw,version:5});return base?{...base,version:6,dayworks:d}:null;}if(![1,2,3,4,5].includes(raw.version))return null;const base=old(raw);return base?{...base,version:6,dayworks:create()}:null;};
  C.SAVE_VERSION=6;C.SAVE_KEY='deadwall-save-v6';C.SAVE_BACKUP_KEY='deadwall-save-backup-v6';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v5','deadwall-save-backup-v5',...C.LEGACY_SAVE_KEYS])];C.DAYWORKS_RULES=RULES;C.Dayworks=API;
 }
 const API=Object.freeze({RULES,SITES,BY_ID,BUILDINGS,PLANS,create,normalize,generate,dayDuration,clock,unlocked,footprint,quote,beginNight,frontGroup,emitted,Engine,installCatalogue});root.DeadwallDayworks=API;
 if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;if(root.DeadwallCore)installCatalogue(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);
