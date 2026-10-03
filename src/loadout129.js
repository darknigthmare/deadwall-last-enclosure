/* Resource quantities stay in their original owner. Only grid positions are serialized here. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.LoadoutRules;
const clone=x=>JSON.parse(JSON.stringify(x)),owns=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const initial=()=>({version:1,layouts:[]}),mass=bag=>C.RESOURCE_KEYS.reduce((n,k)=>n+(bag[k]||0)*R.resources[k].kg,0);
const dimensions=capacity=>({cols:R.columns,rows:Math.min(R.maxRows,Math.max(R.minRows,Math.ceil(capacity/6)+2))});
function validate(raw){
 if(raw===undefined)return initial();
 const fail=()=>{throw Error('Rangement des conteneurs invalide.');};
 if(!raw||Array.isArray(raw)||raw.version!==1||Object.keys(raw).some(k=>!['version','layouts'].includes(k))||!Array.isArray(raw.layouts)||raw.layouts.length>R.maxLayouts)fail();
 const keys=new Set(),cells=new Set(),layouts=[];
 for(const p of raw.layouts){
  if(!p||Object.keys(p).some(k=>!['container','item','x','y','rotation'].includes(k))||! /^(sac|car:[1-9][0-9]{0,9}|companion:(lea|samir|ines|malik))$/.test(p.container)||typeof p.item!=='string')fail();
  const m=p.item.match(/^(wood|scrap|stone|food|fuel|ammo|medicine):([0-9]{1,3})$/);if(!m||+m[2]>R.maxLayouts||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||![0,1].includes(p.rotation))fail();
  const d=R.resources[m[1]].shape,[w,h]=p.rotation?[d[1],d[0]]:d;if(p.x+w>R.columns||p.y+h>R.maxRows)fail();
  const id=p.container+'/'+p.item;if(keys.has(id))fail();keys.add(id);
  for(let y=p.y;y<p.y+h;y++)for(let x=p.x;x<p.x+w;x++){const id=p.container+'/'+x+','+y;if(cells.has(id))fail();cells.add(id);}
  layouts.push({...p});
 }
 return{version:1,layouts};
}
function stacks(bag){
 const list=[];
 for(const key of C.RESOURCE_KEYS){const d=R.resources[key],amount=Math.max(0,bag[key]||0);let left=amount,i=0;
  while(left>1e-7&&i<R.maxLayouts){const quantity=i===R.maxLayouts-1?left:Math.min(d.stack,left);list.push({id:key+':'+i,key,quantity,kg:quantity*d.kg,w:d.shape[0],h:d.shape[1],rotation:0});left-=quantity;i++;}
 }
 return list;
}
function pack(bag,capacity,layout=[]){
 const {cols,rows}=dimensions(capacity),cells=new Set(),items=[],overflow=[];
 const fit=p=>p.x>=0&&p.y>=0&&p.x+p.w<=cols&&p.y+p.h<=rows&&Array.from({length:p.h},(_,dy)=>Array.from({length:p.w},(_,dx)=>!cells.has((p.y+dy)*cols+p.x+dx))).flat().every(Boolean);
 const occupy=p=>{for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)cells.add(y*cols+x);items.push(p);};
 const all=stacks(bag),waiting=[];
 for(const i of all){const old=layout.find(p=>p.item===i.id);const p=old?{...i,x:old.x,y:old.y,rotation:old.rotation,...(old.rotation?{w:i.h,h:i.w}:{})}:null;if(p&&fit(p))occupy(p);else waiting.push(i);}
 waiting.sort((a,b)=>b.w*b.h-a.w*a.h||a.id.localeCompare(b.id));
 for(const i of waiting){let found=null;for(let rotation=0;rotation<2&&!found;rotation++)for(let y=0;y<rows&&!found;y++)for(let x=0;x<cols;x++){const p={...i,x,y,rotation,...(rotation?{w:i.h,h:i.w}:{})};if(fit(p)){found=p;break;}}if(found)occupy(found);else overflow.push(i);}
 return{cols,rows,items,overflow};
}
function install(g){
 if(g.loadout)return g.loadout;let state=initial();
 const fpos=()=>g.frontier.position?.()||g.frontier.snapshot();
 const can=()=>g.state==='playing'&&!g.gameOver&&!g.player.dead&&g.player.health>0&&g.canIssueCommand()&&(!g.activeOverlay||g.activeOverlay===g.ui.commandModal||g.loadoutUI?.isOpen());
 const home=()=>!g.frontier.active()&&!g.expeditions.driving()&&!!g.core()&&g.workerCanWorkAt(g.player,g.core(),R.homeReach);
 const fail=reason=>({ok:false,reason});
 function access(c){
  if(!can())return'Le commandant doit être disponible.';
  if(g.expeditions.driving()||fpos().car?.driving)return'Descendez du véhicule pour manipuler votre matériel.';
  if(c.id==='sac')return'';
  if(c.id==='depot')return home()?'':'Rejoignez le dépôt de D-17 par un accès libre.';
  if(c.id.startsWith('car:')){
   if(g.frontier.active())return g.frontier.vehiclePresent()?'':'Rejoignez le coffre par un accès libre.';
   const v=g.expeditions.car();return v&&!v.regionAway&&Math.hypot(g.player.x-v.x,g.player.y-v.y)<=R.localReach&&g.workerCanWorkAt(g.player,v,R.localReach)?'':'Rejoignez le coffre par un accès libre.';
  }
  if(c.id.startsWith('companion:')){
   const id=c.id.slice(10),team=g.worldEvolution.snapshot().companions;
   if(!team.some(x=>x.id===id&&x.health>0))return'Équipier non affecté ou indisponible.';
   if(!g.frontier.active())return home()?'':'Votre équipe vous attend au dépôt.';
   const p=g.companionsPack.snapshot().positions[id],f=fpos();
   return p&&p.z===f.z&&(p.z===0||p.inside===f.inside)&&Math.hypot(p.x-f.x,p.y-f.y)<=R.companionReach&&g.frontier.world().line(p,f,f.z,f.inside,null,.05)?'':'Rapprochez-vous de cet équipier au même étage, par un accès libre.';
  }
  return'Conteneur indisponible.';
 }
 function containers(withAccess=true){
  const list=[{id:'sac',name:'Sac de terrain',subtitle:'SUR VOUS',bag:g.player.carry,capacity:g.player.carryCapacity,tare:R.emptyPackMass}],v=g.expeditions.car();
  if(v&&v.health>0){const vp=g.worldEvolution.vehicleProfile();list.push({id:'car:'+v.id,name:vp.name,subtitle:'COFFRE',bag:v.cargo,capacity:vp.cargo,tare:0});}
  const reserves=g.companionsPack?.snapshot().reserves||{};
  for(const c of g.worldEvolution?.snapshot().companions||[])if(c.health>0&&reserves[c.id])list.push({id:'companion:'+c.id,name:'Sacoche de '+C.WorldEvolution.RULES.companions[c.id].name,subtitle:'ÉQUIPE',bag:reserves[c.id],capacity:Object.values(C.CompanionPackRules.reserve).reduce((a,b)=>a+b,0),limits:C.CompanionPackRules.reserve,tare:R.emptyPouchMass});
  return list.map(c=>({...c,bag:{...c.bag},weight:mass(c.bag),maxWeight:c.capacity*R.massPerCapacity,reason:withAccess?access(c):''}));
 }
 function resolve(id){if(id==='depot')return{id,name:'Dépôt de D-17',bag:g.resources,capacity:Infinity,tare:0,weight:mass(g.resources),maxWeight:Infinity};return containers().find(c=>c.id===id);}
 function synchronize(){const list=containers(false),next=[];for(const c of list){const p=pack(c.bag,c.capacity,state.layouts.filter(p=>p.container===c.id));for(const item of p.items)next.push({container:c.id,item:item.id,x:item.x,y:item.y,rotation:item.rotation});}state.layouts=next.slice(0,R.maxLayouts);return list;}
 function view(id='sac'){const list=synchronize(),c=list.find(c=>c.id===id)||list[0];return{...c,reason:access(c),...pack(c.bag,c.capacity,state.layouts.filter(p=>p.container===c.id)),total:C.bagTotal(c.bag)};}
 function move(container,item,x,y,rotation=0){
  if(!can())return fail('Rangement indisponible.');const v=view(container);if(v.id!==container)return fail('Conteneur absent.');if(v.reason)return fail(v.reason);
  if(!Number.isInteger(x)||!Number.isInteger(y)||![0,1].includes(rotation))return fail('Case invalide.');
  const found=v.items.find(i=>i.id===item)||v.overflow.find(i=>i.id===item);if(!found)return fail('Objet absent.');const d=R.resources[found.key].shape,[w,h]=rotation?[d[1],d[0]]:d;
  if(x<0||y<0||x+w>v.cols||y+h>v.rows||v.items.some(i=>i.id!==item&&x<i.x+i.w&&x+w>i.x&&y<i.y+i.h&&y+h>i.y))return fail('Ces cases sont occupées ou hors du conteneur.');
  state.layouts=state.layouts.filter(p=>p.container!==container||p.item!==item);state.layouts.push({container,item,x,y,rotation});g.save(false);return{ok:true};
 }
 function tidy(id){const c=resolve(id);if(!c||c.id==='depot'||access(c))return fail('Rejoignez ce conteneur.');state.layouts=state.layouts.filter(p=>p.container!==id);synchronize();g.save(false);return{ok:true};}
 function transfer(from,to,key,amount){
  if(g.fieldcraft?.context?.().mounted)return fail('Rendez le contrôle du poste de tir avant de transférer du matériel.');
  if(!can()||g.player.reload>0||g.expansions?.busy())return fail('Terminez le rechargement ou l’intervention avant de transférer du matériel.');
  const a=resolve(from),b=resolve(to);if(!a||!b||from===to||from!=='sac'&&to!=='sac'||!owns(R.resources,key)||!Number.isFinite(amount)||amount<=0)return fail('Transfert invalide.');
  const reason=access(a)||access(b);if(reason)return fail(reason);
  if(b.limits&&!owns(b.limits,key))return fail('Cette sacoche accepte seulement munitions, médicaments et pièces métalliques.');
  const room=to==='depot'?Math.max(0,g.storage-g.resources[key]):Math.max(0,b.capacity-C.bagTotal(b.bag));
  const limit=b.limits?Math.max(0,b.limits[key]-b.bag[key]):Infinity,weightRoom=(b.maxWeight-b.weight)/R.resources[key].kg;
  const n=Math.min(amount,a.bag[key]||0,room,limit,weightRoom);if(n<=1e-7)return fail('Conteneur plein ou réserve épuisée.');
  const next={...b.bag,[key]:(b.bag[key]||0)+n};if(to!=='depot'&&pack(next,b.capacity,state.layouts.filter(p=>p.container===to)).overflow.length)return fail('Pas assez de cases libres. Rangez le conteneur.');
  // Validate the complete companion state before touching either authoritative bag.
  let companion=null;const cid=[from,to].find(id=>id.startsWith('companion:'));
  if(cid){companion=g.companionsPack.snapshot();const id=cid.slice(10);companion.reserves[id][key]+=to===cid?n:-n;root.DeadwallCompanionsPack?.validate?.(companion);}
  const mutate=(id,delta)=>{if(id==='sac')g.player.carry[key]+=delta;else if(id==='depot')g.resources[key]+=delta;else if(id.startsWith('car:'))g.expeditions.car().cargo[key]+=delta;};
  if(companion)g.companionsPack.restore(companion);mutate(from,-n);mutate(to,n);
  if(to==='depot'){if(Number.isFinite(g.depositedResources))g.depositedResources+=n;g.chronicles131?.recordDeposit(n);}
  synchronize();g.save(false);return{ok:true,amount:n};
 }
 function equipment(){
  const essential=g.essentials.snapshot(),lights=g.nightGear.snapshot().devices.filter(d=>d.location==='belt');
  const belt=[...Object.entries(essential.belt).filter(([,n])=>n>0).map(([id,quantity])=>({id:'kit:'+id,key:id,name:C.Essentials.RULES.kits[id].name,quantity,kg:quantity*(R.kitMass[id]||.5)})),...lights.map(d=>({id:'light:'+d.id,key:d.kind,name:C.NightGearRules.types[d.kind].name,quantity:1,kg:R.lightMass[d.kind]||.5,left:d.left,on:d.on}))];
  const load=g.explorationPack?.snapshot().cargo.find(c=>c.stage==='held'),mission=g.campaignPack?.snapshot().active,job=Object.entries(essential.jobs).find(([,v])=>v.stage==='player');
  const heavy=load?{name:'Ballot de '+C.RESOURCE_META[load.type||load.resource||'wood'].label,detail:(load.amount||24)+' portions · portage lourd',kind:'ballot'}:job?{name:C.Essentials.content.byId[job[0]].title,detail:'Module scellé · à livrer au dépôt',kind:'module'}:g.campaignPack?.carrying()?{name:mission?.kind==='evacuation'?'Blessé sur brancard':'Colis de mission',detail:'Chargement de mission · retour au dépôt',kind:'mission'}:null;
  const personal=g.playerOps131?.equipment?.()||{items:[],weight:0};
  const armory=g.arsenal134?.view(),catalog=C.Arsenal134Rules?.catalog;
  const weapons=armory?armory.carried.filter(i=>catalog[i.id].category!=='deployed').map(i=>{const d=catalog[i.id];return{...d,id:'arsenal:'+i.uid,catalogId:i.id,uid:i.uid,icon:i.id,owned:true,available:g.tier.id>=d.tier,active:armory.equipped===i.uid,rounds:i.rounds,condition:i.condition};}):Object.entries(C.WEAPONS).map(([id,w])=>({id,...w,icon:id,category:'firearm',available:g.tier.id>=w.tier&&(!g.succession133||g.succession133.ownsWeapon(id)),owned:!g.succession133||g.succession133.ownsWeapon(id),active:g.player.weapon===id&&(!g.succession133||g.succession133.ownsWeapon(id)),rounds:g.player.magazine[id]}));
  return{personal:personal.items,personalWeight:personal.weight,belt,beltCount:belt.reduce((n,i)=>n+i.quantity,0),beltCapacity:C.NightGearRules.beltMax,beltWeight:belt.reduce((n,i)=>n+i.kg,0),heavy,weapons,armamentWeight:armory?.weight||0,armamentCapacity:armory?.capacity||0,deployables:armory?armory.carried.filter(i=>catalog[i.id].category==='deployed').map(i=>({...i,...catalog[i.id]})):[]};
 }
 function equipWeapon(id){if(typeof id==='string'&&id.startsWith('arsenal:')){const uid=Number(id.slice(8));if(!can()||!Number.isSafeInteger(uid)||uid<1||!g.arsenal134)return fail('Équipement absent.');return g.arsenal134.equip(uid);}if(!can()||!owns(C.WEAPONS,id)||g.expeditions.driving()||fpos().car?.driving)return fail('Arme indisponible.');if(C.WEAPONS[id].tier>g.tier.id)return fail('Palier requis non atteint.');if(g.player.reload>0)return fail('Terminez le rechargement.');g.switchWeapon(id);g.save(false);return{ok:g.player.weapon===id};}
 const api={containers,view,move,tidy,transfer,equipment,equipWeapon,atHome:home,can,access,weight:mass,snapshot:()=>{synchronize();return clone(state);}};g.loadout=Object.freeze(api);
 const S=root.DeadwallSave;if(!S.__loadout129){const old=S.validate.bind(S);S.validate=raw=>{const data=old(raw);data.loadout129=validate(raw?.loadout129);return data;};S.__loadout129=true;}
 const serialize=g.serialize.bind(g);g.serialize=(...a)=>({...serialize(...a),loadout129:api.snapshot()});
 const restore=g.restoreSave.bind(g);g.restoreSave=raw=>{const next=validate(raw?.loadout129),result=restore(raw);if(result===false)return result;state=next;synchronize();g.loadoutUI?.dismiss();return result;};
 const start=g.startNew.bind(g);g.startNew=(...a)=>{
  const before=g.world,previous=state;let valid=true;
  try{root.DeadwallProfile?.normalizeSeed(a[1]??'');root.DeadwallScenarios?.initialState(a[2]??'classic',typeof a[0]==='string'&&owns(C.DIFFICULTIES,a[0])?a[0]:'standard');}catch{valid=false;}
  // Fresh layout must be in place before the base game's first automatic save.
  if(valid)state=initial();let result;try{result=start(...a);}catch(error){state=previous;throw error;}
  if(g.world===before)state=previous;else g.loadoutUI?.dismiss();return result;
 };
 return api;
}
const api={install,validate,pack,stacks,mass,dimensions};root.DeadwallLoadout129=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;else if(root.DEADWALL)install(root.DEADWALL);
})(globalThis);
