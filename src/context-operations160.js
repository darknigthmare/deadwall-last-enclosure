/* Physical, interruptible maintenance at the G10 sites. Quantities remain in
 * the existing bag/loot owners; only completed access changes are persisted. */
(function(root){'use strict';
 const dependency=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=dependency('DeadwallCore','./core.js'),W=dependency('DeadwallFrontierWorld','./frontier-world.js'),
  G=dependency('DeadwallFrontierGeometry','./frontier-geometry.js'),R=C.ContextRules160,references=new Map();
 const copy=value=>JSON.parse(JSON.stringify(value)),initial=()=>({version:1,completed:[]});
 const operationKey=(site,key)=>site+':160:'+key;
 function operation(p,key){return p?.context160?.operations?.find(o=>o.key===key)||null;}
 function normalize(raw,full){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Registre des ouvrages et services G10 invalide.');};
  if(!raw||Array.isArray(raw)||raw.version!==1||Object.keys(raw).some(k=>!['version','completed'].includes(k))||
    !Array.isArray(raw.completed)||raw.completed.length>R.maxRecords||new Set(raw.completed).size!==raw.completed.length)bad();
  const state=initial();state.completed=raw.completed.map(key=>{
   if(typeof key!=='string'||!/^P\d{4}:160:[a-z][a-zA-Z0-9-]{0,31}$/.test(key))bad();return key;
  });
  if(full&&state.completed.length){
   if(full.frontier?.generation!==10)bad();
   const cacheKey=full.worldSeed+':'+(full.frontier.detailVersion??0);
   let world=references.get(cacheKey);
   if(!world){world=W.create(full.worldSeed,10,{detailVersion:full.frontier.detailVersion??0});references.set(cacheKey,world);if(references.size>3)references.delete(references.keys().next().value);}
   const by=new Map(world.pois.map(p=>[p.id,p]));
   for(const key of state.completed){const[site,,name]=key.split(':'),p=by.get(site),op=operation(p,name),rule=op&&R.operations[op.kind];
    if(!p||p.generation!==10||!op||!rule||rule.repeat||!full.frontier.seen.includes(site))bad();
   }
  }
  return state;
 }
 function install(g){
  if(g.contextOperations160)return g.contextOperations160;
  if(!g.expansions||!g.frontier)return null;
  let state=initial(),completed=new Set(),task=null,message='';
  const pose=()=>g.frontier.position(),world=()=>g.frontier.world();
  const can=()=>g.expansions.canAct()&&!g.expansions.busy('context160')&&g.player.reload<=0&&g.player.shootCooldown<=0&&!g.selectedBuild&&!g.fieldcraft?.context?.().mounted;
  function safe(f,w){
   return![...g.frontier.contacts(),...(g.worldEvolution?.groupMembers?.()||[]),...(g.succession133?.contacts?.()||[])]
    .some(e=>!e.dead&&(e.hp??e.health)>0&&e.z===f.z&&(f.z===0||(e.poi??e.inside)===f.inside)&&
      Math.hypot(e.x-f.x,e.y-f.y)<R.danger&&w.line(f,e,f.z,f.inside,null,.05));
  }
  function preview(site,key,{working=false}={}){
   if(!can()||!working&&task)return{ok:false,reason:'Terminez le rechargement ou l’intervention et libérez vos mains.'};
   const f=pose();if(!f.active||f.generation!==10||f.car?.driving)return{ok:false,reason:'Rejoignez à pied un ouvrage G10 dans la région.'};
   if(!g.frontier.discoveries().includes(site))return{ok:false,reason:'Ce lieu doit être repéré sur place.'};
   const w=world(),p=w.pois.find(p=>p.id===site),op=operation(p,key),rule=op&&R.operations[op.kind];
   if(!p||p.generation!==10||!op||!rule)return{ok:false,reason:'Ce lieu ne possède pas cette intervention.'};
   if(g.worldEvolution?.structureDestroyed?.(p.id))return{ok:false,reason:'Le support de cette intervention a été détruit.'};
   const anchor={...G.global(p,op.anchor.x,op.anchor.y),z:op.anchor.z??0};
   if(f.z!==anchor.z||anchor.z!==0&&f.inside!==p.id||Math.hypot(f.x-anchor.x,f.y-anchor.y)>R.reach||
     !w.line(f,anchor,f.z,f.inside,null,.05))return{ok:false,reason:'Rejoignez le point de travail par un accès libre, sur le bon niveau.'};
   const fullKey=operationKey(site,key);
   if(!rule.repeat&&completed.has(fullKey))return{ok:false,reason:'Cette intervention est déjà achevée.'};
   if(rule.heal&&g.player.health>=g.player.maxHealth-R.healthEpsilon)return{ok:false,reason:'Aucun soin nécessaire.'};
   if(!safe(f,w))return{ok:false,reason:'Sécurisez les abords avant cette intervention.'};
   if(!C.canAfford(g.player.carry,rule.cost))return{ok:false,reason:'Dans le sac : '+C.resourceText(rule.cost)+' nécessaires.'};
   const plan=w.plan(p,anchor.z),support=[...(plan.visuals160||[]),...(plan.gates160||[]),...plan.objects].find(o=>o.id===op.supportId);
   const workTarget=support?{...G.global(p,support.x+support.w/2,support.y+support.h/2),z:anchor.z}:anchor;
   return{ok:true,site,key,fullKey,kind:op.kind,name:rule.name,seconds:rule.seconds,cost:{...rule.cost},anchor,workTarget,
    reason:rule.seconds+' s sur place · '+C.resourceText(rule.cost)+' dans le sac.',heal:rule.heal??0,repeat:rule.repeat};
  }
  function begin(site,key){
   const q=preview(site,key);if(!q.ok){message=q.reason;return q;}
   const f=pose();task={...q,elapsed:0,pulse:0,position:{x:f.x,y:f.y,z:f.z,inside:f.inside},health:g.player.health,
    world:g.world,startedElapsed:g.elapsed,source:g.player.carry,shots:g.stats.shots};
   message=q.name+' en cours…';g.releaseInputs();
   if(g.activeOverlay===g.ui.commandModal){g.showCommand(false);if(g.paused)g.togglePause(false);}
   g.audio.ui?.();return{ok:true};
  }
  function cancel(reason='Intervention interrompue ; aucun matériau dépensé.'){
   if(!task)return false;task=null;message=reason;return true;
  }
  function tick(dt){
   if(!task||!Number.isFinite(dt)||dt<=0||g.paused||g.activeOverlay)return;
   const t=task,f=pose();
   if(g.world!==t.world||g.state!=='playing'||g.gameOver||g.player.dead||g.player.health<=0||
    g.player.health<t.health-R.healthEpsilon||!f.active||Math.hypot(f.x-t.position.x,f.y-t.position.y)>R.moveTolerance||
    f.z!==t.position.z||f.inside!==t.position.inside||g.player.carry!==t.source||g.stats.shots!==t.shots){cancel();return;}
   const q=preview(t.site,t.key,{working:true});if(!q.ok){cancel(q.reason+' Aucun matériau dépensé.');return;}
   const step=Math.min(dt,R.maxStep);t.elapsed+=step;t.pulse-=step;
   g.heroActions133?.observeContextWork160?.(t.kind,step,t.anchor);
   if(t.pulse<=0){g.frontier.signalWork?.();t.pulse=R.noiseInterval;}
   if(t.elapsed+1e-8<t.seconds)return;
   // Final affordability and geometry above precede the sole payment.
   C.spend(g.player.carry,q.cost);
   if(q.heal)g.player.health=Math.min(g.player.maxHealth,g.player.health+q.heal);
   if(!q.repeat){completed.add(q.fullKey);state.completed.push(q.fullKey);}
   message=q.name+' terminé.';task=null;g.audio.ui?.();g.save(false);
  }
  function presentation(fullKey){
   const t=task;if(!t||t.fullKey!==fullKey)return null;
   return Object.freeze({fullKey,kind:t.kind,progress:Math.min(1,t.elapsed/t.seconds),elapsed:t.elapsed,
    start:t.startedElapsed,duration:t.seconds,anchor:Object.freeze({...t.anchor}),workTarget:Object.freeze({...t.workTarget})});
  }
  function nearby(){
   const f=pose();if(!f.active||f.generation!==10)return[];
   const seen=new Set(g.frontier.discoveries());
   return world().nearPOI(f.x,f.y,35).filter(p=>p.generation===10&&seen.has(p.id)&&p.context160)
    .sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y)).slice(0,4);
  }
  function actions(){
   const result=[];
   for(const p of nearby())for(const op of p.context160.operations||[]){
    const q=preview(p.id,op.key),rule=R.operations[op.kind];if(!rule)continue;
    result.push({id:operationKey(p.id,op.key),label:rule.name+' · '+p.name,disabled:!q.ok,reason:q.reason,
     run:()=>begin(p.id,op.key),close:true});
   }
   if(task)result.push({id:'cancel160',label:'Interrompre les travaux',run:()=>({ok:cancel()}),close:true});
   return result;
  }
  function overview(){
   const f=pose(),sites=nearby();
   return{summary:f.generation===10?'Ouvrages, accès et postes de service G10. Chaque travail paie le sac après achèvement ; les réserves du lieu restent finies.':
    'Activez les 626 programmes territoriaux au dépôt de D-17, dans Monde & relais.',
    message,task:task?{kind:task.kind,name:task.name,progress:Math.min(1,task.elapsed/task.seconds)}:null,
    rows:sites.map(p=>({id:p.id,label:p.name,value:p.context160.description||p.context160.archetype})),
    completed:state.completed.length};
  }
  const api=Object.freeze({preview,begin,cancel,step:tick,actions,overview,presentation,operationKey,
   isComplete:key=>completed.has(key),snapshot:()=>copy(state),busy:()=>!!task,activity:()=>task?presentation(task.fullKey):null});
  g.contextOperations160=api;
  g.expansions.register({id:'context160',title:'Ouvrages & services',overview,actions,validate:normalize,snapshot:api.snapshot,
   restore:raw=>{state=normalize(raw);completed=new Set(state.completed);task=null;message='';},
   reset:()=>{state=initial();completed=new Set();task=null;message='';},busy:api.busy});
  const update=g.update.bind(g);g.update=dt=>{if(task&&(g.player.dead||g.gameOver||g.state!=='playing'||g.world!==task.world))cancel();const result=update(dt);tick(dt);return result;};
  const menu=g.returnToMenu.bind(g);g.returnToMenu=(...args)=>{cancel();return menu(...args);};
  return api;
 }
 const api={install,normalize,initial,operationKey};root.DeadwallContextOperations160=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
