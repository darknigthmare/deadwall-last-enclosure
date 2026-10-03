/* Persistent field records. Reading never resurrects an author or creates supplies. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Chronicles131Rules;
const D=root.DeadwallChronicles131Data||(typeof require==='function'?require('./chronicles131-data.js'):null);
const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
const ids=D.records.map(r=>r.id),sceneIds=Object.keys(D.scenes),copy=v=>JSON.parse(JSON.stringify(v));
function initial(legacy=false){return{version:1,siteGeneration:null,collected:[],read:[],choices:{},voices:[],selected:0,page:0,prologue:{status:legacy?'skipped':'available',stage:0,gathered:0,deposited:0,completed:[]},scenes:legacy?[...sceneIds]:[]};}
function normalize(raw){
 if(raw===undefined)return initial(true);
 const fail=()=>{throw Error('Chroniques de D-17 invalides.');},s=initial();
 if(!raw||Array.isArray(raw)||Object.keys(raw).some(k=>!Object.hasOwn(s,k))||raw.version!==1)fail();
 if(raw.siteGeneration!==undefined&&raw.siteGeneration!==null&&![4,5,6,7].includes(raw.siteGeneration))fail();s.siteGeneration=raw.siteGeneration??null;
 const list=(value,allowed)=>{if(!Array.isArray(value)||value.length>allowed.length||new Set(value).size!==value.length||value.some(k=>!allowed.includes(k)))fail();return[...value];};
 s.collected=list(raw.collected,ids);s.read=list(raw.read,s.collected);s.scenes=list(raw.scenes,sceneIds);s.voices=list(raw.voices,D.voices.map(v=>v.id));
 if(s.voices.some(id=>!s.collected.includes(D.voices.find(v=>v.id===id).arc+'-0')))fail();
 if(!Number.isInteger(raw.selected)||raw.selected<0||raw.selected>=D.arcs.length||!Number.isInteger(raw.page)||raw.page<0||raw.page>2)fail();
 s.selected=raw.selected;s.page=raw.page;
 if(!raw.choices||Array.isArray(raw.choices)||typeof raw.choices!=='object')fail();
 for(const[id,value]of Object.entries(raw.choices)){const a=D.arcs.find(a=>a.id===id);if(!a?.choice||!a.choice.options.some(o=>o[0]===value)||a.records.some((_,i)=>!s.collected.includes(id+'-'+i)))fail();s.choices[id]=value;}
 for(const a of D.arcs)for(let i=1;i<3;i++)if(s.collected.includes(a.id+'-'+i)&&!s.collected.includes(a.id+'-'+(i-1)))fail();
 const p=raw.prologue;
 if(!p||Object.keys(p).some(k=>!Object.hasOwn(s.prologue,k))||!['available','active','done','skipped'].includes(p.status)||!Number.isInteger(p.stage)||p.stage<0||p.stage>3||p.status==='done'&&p.stage!==3||p.status==='active'&&p.stage===3||!Number.isFinite(p.gathered)||p.gathered<0||p.gathered>1e15||!Number.isFinite(p.deposited)||p.deposited<0||p.deposited>1e15||!Array.isArray(p.completed)||p.completed.length>R.maxBaselineBuildings||new Set(p.completed).size!==p.completed.length||p.completed.some(id=>!Number.isSafeInteger(id)||id<1))fail();
 s.prologue=copy(p);return s;
}
function install(g){
 if(g.chronicles131)return g.chronicles131;
 if(!g.expansions)throw Error('Installer les opérations avant les chroniques.');
 let state=initial(true),task=null,scene=null,message='',worldRef=null,placements=null,lastActive=false,lastWave=g.stats?.wavesSurvived||0;
 const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);},fail=reason=>({ok:false,reason}),can=()=>g.expansions.canAct();
 const local=()=>!g.frontier.active(),home=()=>local()&&!g.expeditions.driving()&&g.core()&&g.workerCanWorkAt(g.player,g.core(),R.homeReach);
 const running=()=>g.state==='playing'&&!g.gameOver&&!g.paused&&!g.activeOverlay&&!g.player.dead&&g.player.health>0;
 const point=()=>{const f=g.frontier.position();return f.active?{domain:'region',x:f.x,y:f.y,z:f.z,inside:f.inside}:{domain:'local',x:g.player.x,y:g.player.y,z:0,inside:null};};
 function announce(text){message=text;g.notify?.(text);}
 function sites(){
  const w=g.frontier.world();if(w===worldRef&&placements)return placements;
  worldRef=w;placements=new Map();const used=new Set();
  for(const r of D.records){if(!r.types)continue;
   // Opening new roads must not move a clue already described by an old campaign.
   const candidates=w.pois.filter(p=>(!state.siteGeneration||(p.generation||4)<=state.siteGeneration)&&r.types.includes(p.type)&&!used.has(p.id)).sort((a,b)=>G.hash(w.seed,r.id,a.id)-G.hash(w.seed,r.id,b.id)||a.id.localeCompare(b.id));
   for(const p of candidates){let position=null;for(const offset of R.doorOffsets){const q=G.global(p,p.w/2,offset);if(!w.blocked(q.x,q.y,R.markerRadius,0,null)&&w.line(q,p.drive.a,0,null,null,.05)){position={...q,z:0,inside:null,domain:'region',poi:p.id,name:p.name};break;}}
    if(position){placements.set(r.id,position);used.add(p.id);break;}
   }
  }
  return placements;
 }
 function location(id){const r=D.records.find(r=>r.id===id);if(!r)return null;if(!r.types){const b=g.core();return b?{domain:'local',x:b.x,y:b.y,z:0,inside:null,poi:null,name:'Registre du dépôt'}:null;}return sites().get(id)||null;}
 function next(arc=D.arcs[state.selected]){return D.records.find(r=>r.arc===arc.id&&!state.collected.includes(r.id))||null;}
 function known(id){const p=location(id);return p&&(p.domain==='local'||g.frontier.snapshot().seen.includes(p.poi));}
 function safe(p){
  if(p.domain==='local')return home()&&!g.zombies.some(z=>!z.dead&&z.health>0&&Math.hypot(z.x-g.player.x,z.y-g.player.y)<R.localDanger);
  const f=g.frontier.position();if(!f.active||f.z!==0||f.inside||f.car?.driving||Math.hypot(f.x-p.x,f.y-p.y)>R.reach||!g.frontier.world().line(f,p,0,null,null,.05))return false;
  const v=g.frontier.overview();if(v.enemies.some(e=>e.hp>0&&e.z===0&&Math.hypot(e.x-f.x,e.y-f.y)<R.danger&&g.frontier.visibleEnemy(e)))return false;
  return !(g.worldEvolution?.groupMembers?.()||[]).some(e=>e.hp>0&&Math.hypot(e.x-f.x,e.y-f.y)<R.danger);
 }
 function preview(id=next()?.id){
  const r=D.records.find(r=>r.id===id);
  if(!r||state.collected.includes(id))return fail('Aucun document à relever.');
  if(r.index&&!state.collected.includes(r.arc+'-'+(r.index-1)))return fail('Relevez la trace précédente de ce dossier.');
  if(!can()||task||g.expansions.busy('lore131')||g.player.reload>0)return fail('Terminez votre intervention en cours.');
  const p=location(id);if(!p)return fail('Aucun accès compatible dans cette région.');
  if(!known(id))return fail('Explorez les lieux indiqués dans le dossier ; cet accès n’est pas encore reconnu.');
  if(!safe(p))return fail(p.domain==='local'?'Approchez le dépôt à pied, hors de portée des infectés.':'Approchez la pochette à l’entrée, au rez-de-chaussée et hors de portée des infectés.');
  return{ok:true,point:{...p},seconds:R.readSeconds};
 }
 function begin(id=next()?.id){const q=preview(id);if(!q.ok)return q;task={id,elapsed:0,health:g.player.health,position:point()};g.releaseInputs();if(g.activeOverlay===g.ui.commandModal)g.showCommand(false);message='Relevé en cours. Restez sur place.';return{ok:true};}
 function cancel(){if(!task)return false;task=null;message='Relevé interrompu. Le document reste sur place.';return true;}
 function changed(p,q){return p.domain!==q.domain||p.z!==q.z||p.inside!==q.inside||Math.hypot(p.x-q.x,p.y-q.y)>(p.domain==='local'?R.localMove:R.move);}
 function collectTick(dt){if(!task)return;const t=task;task=null;const q=preview(t.id);task=t;
  if(!q.ok||changed(t.position,point())||g.player.health<t.health){cancel();return;}
  t.elapsed+=dt;if(t.elapsed<R.readSeconds)return;
  state.collected.push(t.id);const r=D.records.find(r=>r.id===t.id);state.selected=D.arcs.findIndex(a=>a.id===r.arc);state.page=r.index;task=null;announce('Document relevé : '+r.title+'. Consultez le carnet quand vous êtes à l’abri.');g.audio.ui?.();g.save(false);
 }
 function read(id){if(!can()||!state.collected.includes(id))return fail('Ce document n’a pas été relevé.');const r=D.records.find(r=>r.id===id);state.selected=D.arcs.findIndex(a=>a.id===r.arc);state.page=r.index;if(!state.read.includes(id)){state.read.push(id);g.save(false);}return{ok:true};}
 function choose(id,value){const a=D.arcs.find(a=>a.id===id);if(!can()||!home()||!a?.choice||state.choices[id]||!a.choice.options.some(o=>o[0]===value)||a.records.some((_,i)=>!state.collected.includes(id+'-'+i)))return fail('Décision disponible au dépôt, une fois le dossier complet.');state.choices[id]=value;announce(a.choice.options.find(o=>o[0]===value)[2]);g.save(false);return{ok:true};}
 function companionAvailable(id){return home()&&!!g.worldEvolution?.snapshot().companions.some(c=>c.id===id&&c.health>0);}
 function speak(id){const v=D.voices.find(v=>v.id===id);if(!can()||!v||state.voices.includes(id)||!state.collected.includes(v.arc+'-0')||!companionAvailable(id))return fail('Retrouvez cet équipier vivant au dépôt après le premier relevé du dossier.');state.voices.push(id);state.selected=D.arcs.findIndex(a=>a.id===v.arc);announce(v.name+' a confié son souvenir au carnet.');g.save(false);return{ok:true};}
 function startPrologue(){if(!can()||!home()||state.prologue.status!=='available')return fail('Les premiers gestes se préparent au dépôt.');state.prologue={status:'active',stage:0,gathered:g.stats.gathered,deposited:0,completed:[...g.world.buildings.values()].filter(b=>b.completed&&!b.dead).map(b=>b.id).slice(0,R.maxBaselineBuildings)};g.save(false);return{ok:true,message:'Rapportez quelques matériaux : chaque main compte.'};}
 function skipPrologue(){if(!can()||!['available','active'].includes(state.prologue.status))return fail('Prologue déjà terminé.');state.prologue.status='skipped';g.save(false);return{ok:true,message:'Les premiers gestes restent décrits dans l’aide du dépôt.'};}
 // Called once by the owner of a completed personal deposit, including modal
 // transfers. Worker deliveries never enter this observer.
 function recordDeposit(amount){if(!Number.isFinite(amount)||amount<=0||!local())return false;if(state.prologue.status==='active')state.prologue.deposited=Math.min(1e15,state.prologue.deposited+amount);trigger('return');return true;}
 function prologueTick(){const p=state.prologue;if(p.status!=='active')return;const old=p.stage;
  if(p.stage===0&&g.stats.gathered-p.gathered>=R.prologueGather)p.stage=1;
  if(p.stage===1&&p.deposited>=R.prologueDeposit)p.stage=2;
  if(p.stage===2&&[...g.world.buildings.values()].some(b=>b.type!=='core'&&!b.dead&&b.completed&&!p.completed.includes(b.id))){p.stage=3;p.status='done';announce('Une première place tient debout. Préparez sa défense avant la nuit.');}
  if(old!==p.stage)g.save(false);
 }
 function trigger(id){if(state.scenes.includes(id))return false;state.scenes.push(id);scene={id,elapsed:0};g.audio.tone?.(440,.1,'sine',.025);g.audio.noise?.(.08,.01,900);g.save(false);return true;}
 function dismissScene(){if(!scene)return false;scene=null;return true;}
 function tick(dt){if(!Number.isFinite(dt)||dt<=0||!running())return;
  dt=Math.min(dt,R.maxStep);collectTick(dt);prologueTick();
  const active=g.frontier.active(),waves=g.stats.wavesSurvived;
  if(scene){scene.elapsed+=dt;if(scene.elapsed>=R.sceneSeconds)scene=null;}
  // Each event has a real edge. Migration and restore only prime these baselines.
  if(active&&!lastActive)trigger('road');else if(waves>lastWave&&!g.gameOver)trigger('dawn');
  lastActive=active;lastWave=waves;
 }
 function consequence(arc){
  const parts=[];
  if(['neighbors','radio'].includes(arc)&&state.choices.doors)parts.push(state.choices.doors==='public'?'Consigne affichée : partager les règles, masquer les noms.':'Consigne de relève : garder les documents nominatifs au registre.');
  if(['road','care','radio'].includes(arc)&&state.choices.radio)parts.push(state.choices.radio==='facts'?'Liaison : ne transmettre que des lieux visités et des faits datés.':'Liaison : noter les appels incertains dans une colonne séparée.');
  return parts.join(' ');
 }
 function prologueText(){return state.prologue.status==='active'?['Récoltez '+R.prologueGather+' matériaux avec vos mains.','Déposez '+R.prologueDeposit+' matériaux au dépôt.','Terminez une nouvelle construction et gardez ses accès libres.'][state.prologue.stage]:state.prologue.status==='available'?'Trois premiers gestes facultatifs : récolter, déposer, bâtir.':state.prologue.status==='done'?'Premiers gestes accomplis. La défense continue.':'Premiers gestes passés.';}
 function overview(){
  const a=D.arcs[state.selected],r=D.records.find(r=>r.arc===a.id&&r.index===state.page),found=state.collected.includes(r.id),n=next(a),p=n?location(n.id):null,k=n&&known(n.id),decision=state.choices[a.id];
  const counts=D.arcs.map(a=>({id:a.id,title:a.title,count:state.collected.filter(id=>id.startsWith(a.id+'-')).length}));
  const rows=[{label:'Dossier',value:(state.selected+1)+' / '+D.arcs.length+' · '+a.title},{label:'Prochaine piste',value:n?(p?.domain==='local'?'Registre de D-17':k?p.name+' · accès extérieur':n.types.map(t=>G.BY[t]?.name||t).join(' / ')):'Dossier complet'},{label:'Documents',value:state.collected.length+' / '+ids.length+' · '+(state.collected.length-state.read.length)+' non lus'},{label:'Premiers gestes',value:prologueText()}];
  if(found){rows.push({label:r.title,value:r.source},{label:r.kind==='transcription'?'Copie écrite · aucun son conservé':r.kind,value:r.text});}
  else rows.push({label:'Page '+(state.page+1),value:'Cette trace reste à relever sur place.'});
  if(consequence(a.id))rows.push({label:'Consigne retenue',value:consequence(a.id)});
  if(decision)rows.push({label:'Décision consignée',value:a.choice.options.find(o=>o[0]===decision)[2]});
  for(const v of D.voices.filter(v=>v.arc===a.id&&state.voices.includes(v.id)))rows.push({label:'Propos recueillis auparavant · '+v.name+' · '+v.title,value:v.text});
  return{summary:a.mission+(consequence(a.id)?' '+consequence(a.id):''),rows,arcs:counts,record:found?{...r,read:state.read.includes(r.id)}:null,target:k?p:null,task:task?{kind:'document',progress:task.elapsed/R.readSeconds}:null,prologue:copy(state.prologue),scene:scene?{...D.scenes[scene.id],id:scene.id,progress:scene.elapsed/R.sceneSeconds}:null,message};
 }
 function selectArc(delta){if(!can())return fail('Campagne active requise.');state.selected=(state.selected+delta+D.arcs.length)%D.arcs.length;state.page=0;return{ok:true};}
 function actions(){const a=D.arcs[state.selected],n=next(a),q=preview(n?.id),record=a.id+'-'+state.page,out=[
  {id:'previous-arc',label:'Dossier précédent',run:()=>selectArc(-1)},{id:'next-arc',label:'Dossier suivant',run:()=>selectArc(1)},
  ...a.records.map((r,i)=>({id:'page-'+i,label:(i+1)+' · '+r[1],disabled:!state.collected.includes(a.id+'-'+i),reason:state.collected.includes(a.id+'-'+i)?'Lire la copie au carnet.':'À relever sur place.',run:()=>read(a.id+'-'+i)}))
 ];
  if(n){out.push({id:'collect',label:task?'Relevé en cours':'Relever la prochaine trace · '+R.readSeconds+' s',disabled:!q.ok,reason:q.reason||'La simulation reprend pendant le relevé.',run:()=>begin(n.id),close:true});const p=location(n.id);if(p?.domain==='region'&&known(n.id))out.push({id:'pin',label:'Repérer cet accès',run:()=>({ok:g.frontier.pin(p.poi)})});}
  if(task)out.push({id:'cancel',label:'Interrompre le relevé',run:()=>({ok:cancel()})});
  if(a.choice&&!state.choices[a.id]&&!n)for(const [value,label]of a.choice.options)out.push({id:'choice-'+value,label,reason:a.choice.question+' Décision unique au dépôt, sans gain de matériel.',disabled:!home(),run:()=>choose(a.id,value)});
  for(const v of D.voices.filter(v=>v.arc===a.id&&!state.voices.includes(v.id)))if(state.collected.includes(v.arc+'-0'))out.push({id:'talk-'+v.id,label:'Échanger avec '+v.name,reason:'Retrouver cet équipier vivant et affecté à votre équipe au dépôt.',disabled:!companionAvailable(v.id),run:()=>speak(v.id)});
  if(state.prologue.status==='available')out.push({id:'prologue',label:'Jouer les premiers gestes',disabled:!home(),reason:'Récolter, déposer, construire ; aucun saut de temps.',run:startPrologue,close:true});
  if(['available','active'].includes(state.prologue.status))out.push({id:'skip-prologue',label:'Passer les premiers gestes',run:skipPrologue});
  if(foundUnread(record))out.push({id:'mark-read',label:'Marquer cette copie comme lue',run:()=>read(record)});
  if(scene)out.push({id:'dismiss-scene',label:'Passer la séquence',run:()=>({ok:dismissScene()})});return out;
 }
 function foundUnread(id){return state.collected.includes(id)&&!state.read.includes(id);}
 function drawMarker(ctx,p,scale=1){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.12);ctx.fillStyle='#c6bfa5';ctx.strokeStyle='#3c443d';ctx.lineWidth=.05*scale;ctx.fillRect(-.18*scale,-.23*scale,.36*scale,.46*scale);ctx.strokeRect(-.18*scale,-.23*scale,.36*scale,.46*scale);ctx.strokeStyle='#5d6459';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-.1*scale,(-.1+i*.1)*scale);ctx.lineTo(.1*scale,(-.1+i*.1)*scale);ctx.stroke();}ctx.restore();}
 function depthEntries(v,view){if(v.z!==0||v.inside)return[];const out=[];for(const a of D.arcs){const r=next(a);if(!r?.types)continue;const p=location(r.id);if(!p||p.x<view.l||p.x>view.r||p.y<view.t||p.y>view.b||!v.world.line(v,p,0,null,null,.01))continue;out.push({kind:'record',id:'record:'+r.id,depth:p.y+.35,draw:c=>drawMarker(c,p)});}return out;}
 function prime(){task=null;scene=null;message='';worldRef=null;placements=null;lastActive=g.frontier.active();lastWave=g.stats?.wavesSurvived||0;}
 function restore(raw){state=normalize(raw);prime();}
 function reset(){state=initial();prime();lastActive=false;lastWave=0;}
 const api=Object.freeze({overview,actions,preview,begin,cancel,read,choose,speak,startPrologue,skipPrologue,recordDeposit,location,placements:()=>new Map(sites()),depthEntries,drawMarker,tick,dismissScene,scene:()=>scene?{...D.scenes[scene.id],id:scene.id,progress:scene.elapsed/R.sceneSeconds}:null,snapshot:()=>normalize(state),restore,reset,busy:()=>!!task});g.chronicles131=api;
 g.expansions.register({id:'lore131',title:'Chroniques de D-17',overview,actions,validate:normalize,snapshot:api.snapshot,restore,reset,busy:api.busy});
 // The shared depositedResources counter also includes workers. Only the player's
 // actual interaction can advance these first personal gestures or frame this return.
 wrap('updateInteraction',(old,...args)=>{const before=g.depositedResources,result=old(...args),amount=g.depositedResources-before;if(running()&&local())recordDeposit(amount);return result;});
 wrap('update',(old,dt)=>{if(g.player.dead||g.player.health<=0||g.gameOver){cancel();scene=null;}const wasRunning=running();if(wasRunning&&task&&(g.input.mouseDown||g.input.touchFire||['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyZ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','KeyF','KeyR','PageUp','PageDown'].some(k=>g.input.keys.has(k)||g.input.pressed.has(k))))cancel();const result=old(dt);if(wasRunning)tick(dt);if(g.player.dead||g.gameOver){cancel();scene=null;}return result;});
 wrap('returnToMenu',(old,...args)=>{cancel();scene=null;return old(...args);});return api;
}
const api={install,initial,normalize};root.DeadwallChronicles131=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
