(function initLinecare(root) {
  'use strict';
  const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.DeadwallCore;
  const T=typeof module!=='undefined'&&module.exports?require('./tactics.js'):root.DeadwallTactics;
  const R=C.LINECARE_RULES;
  const alive=b=>Boolean(b&&!b.dead&&b.health>0);
  const operational=b=>alive(b)&&T.operational(b);
  const walls=g=>[...g.world.buildings.values()].filter(b=>operational(b)&&b.def.wall);
  function direction(origin,b){const x=b.x-origin.x,y=b.y-origin.y;return Math.abs(x)>Math.abs(y)?x>=0?'east':'west':y>=0?'south':'north';}
  function inspectRows(g){const core=g.core();if(!core)return[];
    return walls(g).map(b=>{const ratio=b.health/b.maxHealth,load=Math.max(0,b.corpseLoad||0),risk=load>R.rampMax?'all':load>R.rampMin?'some':'none';
      return {id:b.id,type:b.type,name:b.def.name,gx:b.gx,gy:b.gy,w:b.w,h:b.h,health:b.health,maxHealth:b.maxHealth,load,risk,
        critical:ratio<=.3,damaged:ratio<1,gate:Boolean(b.def.gate),mode:b.def.gate?T.gateMode(b):null,front:direction(core,b),
        score:(ratio<=.3?100:0)+(risk==='all'?80:risk==='some'?50:0)+(T.openGate(b)?30:0)+(1-ratio)*20};
    }).sort((a,b)=>b.score-a.score||a.id-b.id);
  }
  // Structural access only: non-wall buildings and corpse ramps are deliberately not obstacles here.
  // Keep the same cardinal connectivity as analyzeEnclosure; do not invent an enemy route or ring count.
  function traceAccess(buildings,target,width=C.WORLD_TILES,height=C.WORLD_TILES){
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>C.WORLD_TILES||height>C.WORLD_TILES)throw new RangeError('Grille de diagnostic invalide.');
    const size=width*height,barrier=new Uint8Array(size),parents=new Int32Array(size);parents.fill(-2);
    const queue=new Int32Array(size),list=Array.from(buildings);let head=0,tail=0;
    for(const b of list)if(T.blocksEnclosure(b)){const f=T.footprint(b);for(let y=Math.max(0,f.y);y<Math.min(height,f.y+f.height);y++)for(let x=Math.max(0,f.x);x<Math.min(width,f.x+f.width);x++)barrier[y*width+x]=1;}
    const f=operational(target)?T.footprint(target):null;
    if(!f||f.x<0||f.y<0||f.x+f.width>width||f.y+f.height>height)return {hasCore:false,reachable:false,path:[],barrier,visited:0,width,height};
    const visit=(i,parent)=>{if(!barrier[i]&&parents[i]===-2){parents[i]=parent;queue[tail++]=i;}};
    for(let x=0;x<width;x++){visit(x,-1);visit((height-1)*width+x,-1);}for(let y=1;y<height-1;y++){visit(y*width,-1);visit(y*width+width-1,-1);}
    let found=-1;
    while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);if(x>=f.x&&x<f.x+f.width&&y>=f.y&&y<f.y+f.height){found=i;break;}
      if(x>0)visit(i-1,i);if(x+1<width)visit(i+1,i);if(y>0)visit(i-width,i);if(y+1<height)visit(i+width,i);}
    const path=[];for(let i=found;i>=0;i=parents[i])path.push({x:i%width,y:Math.floor(i/width)});path.reverse();
    return {hasCore:true,reachable:found>=0,path,barrier,visited:head,width,height};
  }
  function repairQuote(g,ids){
    const refuse=reason=>({ok:false,reason,cost:{},rows:[]});
    if(!g.canIssueCommand())return refuse('Ouvrez le commandement pendant la campagne.');
    if(!Array.isArray(ids)||!ids.length||ids.length>R.maxBatch||new Set(ids).size!==ids.length||ids.some(id=>!Number.isInteger(id)))return refuse('Sélectionnez de 1 à '+R.maxBatch+' remparts distincts.');
    const rows=[],cost={};
    for(const id of ids){const b=g.world.buildings.get(id);if(!operational(b)||!b.def.wall||b.health>=b.maxHealth)return refuse('Un rempart est absent, intact ou encore en chantier. Actualisez la sélection.');
      const q=g.structureActionStatus('repair',b);if(!q.ok)return refuse(q.reason);
      rows.push({id,type:b.type,gx:b.gx,gy:b.gy,rotation:b.rotation,health:b.health,maxHealth:b.maxHealth,progress:b.progress});
      for(const[k,n]of Object.entries(q.cost))cost[k]=(cost[k]||0)+n;
    }
    if(!C.canAfford(g.resources,cost))return{ok:false,reason:'Stocks insuffisants pour la totalité du devis.',cost,rows};
    return {ok:true,reason:'Somme des réparations individuelles. Ni extinction ni déblaiement.',cost,rows};
  }
  function install(g){
    if(!g||g.linecare)return g?.linecare;
    let world=g.world,cache=null,overlay=false,tool=false,marked=null,pending=null,message='',scrape=0;
    const wrap=(name,fn)=>{if(typeof g[name]!=='function')return;const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);};
    const playing=()=>g.state==='playing'&&!g.gameOver;
    const running=()=>playing()&&!g.paused&&!g.activeOverlay;
    const stow=()=>{tool=false;scrape=0;};
    const reset=()=>{world=g.world;cache=null;overlay=false;stow();marked=null;pending=null;message='';};
    const sync=()=>{if(world!==g.world)reset();if(marked&&!g.world.buildings.has(marked))marked=null;};
    const say=text=>{message=text;g.linecareUI?.refresh(true);return text;};
    const geometry=()=>{sync();if(!cache||cache.revision!==g.world.navigationVersion||cache.core!==g.core())cache={revision:g.world.navigationVersion,core:g.core(),value:traceAccess(g.world.buildings.values(),g.core())};return cache.value;};
    function competing(){return Boolean(g.siege?.toolActive()||(g.dayworks&&g.dayworks.overview().tool!=='none')||(g.infrastructure&&g.infrastructure.overview().tool!=='none'));}
    function active(){if(tool&&competing())stow();return tool;}
    function equip(){if(g.frontier?.active()||!playing()||!alive(g.player)||!['calm','aftermath'].includes(g.phase)||g.activeOverlay&&g.activeOverlay!==g.ui.commandModal)return false;
      if(active()){stow();g.releaseInputs();say('Pelle rangée. Armes et actions ordinaires disponibles.');return true;}
      g.cancelPlacement();const d=g.dayworks?.overview().tool;if(d&&d!=='none')g.dayworks.setTool(d);if(g.siege?.toolActive())g.siege.toggleTool();
      if(g.infrastructure?.toolActive())g.infrastructure.equip();g.infrastructure?.cancel();
      g.showCommand?.(false);g.releaseInputs();g.player.reload=0;tool=true;scrape=0;
      say('Pelle équipée. Rejoignez la face extérieure du rempart et maintenez ACTION / E. K pour ranger.');return true;
    }
    function target(){const selected=g.selectedBuilding;
      const candidates=walls(g).filter(b=>b.corpseLoad>0).map(b=>({b,point:g.workerCleanupPoint(g.player,b)}));
      const reachable=candidates.filter(v=>g.workerCanWorkAt(g.player,v.point,R.workRange));
      return reachable.find(v=>v.b===selected)||reachable.sort((a,b)=>C.distSq(g.player,a.point)-C.distSq(g.player,b.point))[0]||null;
    }
    function secure(point){return !g.zombies.some(z=>alive(z)&&C.distSq(z,point)<=R.dangerRadius**2&&g.hostileLineClear(z,point));}
    function clear(dt){if(!active()||!running()||!alive(g.player)||!Number.isFinite(dt)||dt<=0)return 0;
      if(!['calm','aftermath'].includes(g.phase)){stow();return 0;}
      const v=target();if(!v){g.interactionText='Pelle : rejoignez la face extérieure d’un amas accessible. K pour ranger.';return 0;}
      if(!secure(g.player)||!secure(v.point)){g.interactionText='Infectés proches : le déblaiement est suspendu.';return 0;}
      g.interactionText='ACTION / E : déblayer '+v.b.def.name+' · amas '+v.b.corpseLoad.toFixed(1)+' · K pour ranger';
      if(!g.input.keys.has('KeyE'))return 0;
      const work=Math.min(dt,R.maxStep)*R.shovelPerSecond/C.WORKER_RULES.cleanupPerSecond;
      const done=g.clearCorpsesWithWorker(g.player,v.b,work);
      if(done>0){marked=v.b.id;scrape+=Math.min(dt,R.maxStep);if(scrape>=.4){scrape=0;g.audio.noise?.(.04,.015,900);}if(v.b.corpseLoad<=0)g.notify('Amas dégagé. Le rempart reste à réparer si nécessaire.','good');}
      return done;
    }
    function preview(ids){sync();const q=repairQuote(g,ids);pending=q.ok?{world:g.world,ids:ids.slice(),stamp:JSON.stringify([q.rows,q.cost]),quote:q}:null;say(q.reason);return q;}
    function confirm(){sync();if(!pending)return {ok:false,reason:say('Aucun devis à confirmer.')};const p=pending;pending=null;
      const q=repairQuote(g,p.ids);if(p.world!==g.world||!q.ok||JSON.stringify([q.rows,q.cost])!==p.stamp)return{ok:false,reason:say('Le devis a changé. Actualisez la sélection : aucun matériau prélevé.')};
      if(!C.spend(g.resources,q.cost))return{ok:false,reason:say('Stocks insuffisants. Aucun rempart réparé.')};
      for(const row of q.rows){const b=g.world.buildings.get(row.id);b.health=b.maxHealth;b.underAttack=0;}
      g.audio.build();g.updateSelectionUI();const saved=g.save(false);const text=q.rows.length+' rempart(s) réparé(s). Les amas et incendies sont inchangés.'+(saved?'':' Sauvegarde locale non effectuée.');g.notify(text,saved?'good':'danger');say(text);return{ok:true,count:q.rows.length,cost:q.cost,saved};
    }
    function cancel(){pending=null;say('Devis annulé. Aucun matériau prélevé.');}
    function mark(id){sync();const b=g.world.buildings.get(id);if(!g.canIssueCommand()||!operational(b)||!b.def.wall)return false;marked=id;overlay=true;g.selectBuilding(b);g.showCommand?.(false);say('Rempart repéré. Rejoignez sa face extérieure pour déblayer.');return true;}
    function setOverlay(value){if(!playing()||typeof value!=='boolean')return false;overlay=value;g.linecareUI?.refresh(true);return true;}
    function overview(){sync();return{tool:active(),overlay,marked,pending:pending?{...pending.quote,rows:pending.quote.rows.map(r=>({...r})),cost:{...pending.quote.cost}}:null,message,rows:inspectRows(g),geometry:geometry()};}
    function drawGround(ctx){if(!overlay||!playing())return;const data=geometry();if(!data.path.length)return;ctx.save();ctx.strokeStyle='rgba(235,181,99,.62)';ctx.lineWidth=3/Math.max(.5,g.camera.zoom);ctx.setLineDash([12,9]);ctx.beginPath();data.path.forEach((p,i)=>{const x=p.x*C.TILE+C.TILE/2,y=p.y*C.TILE+C.TILE/2;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.restore();}
    function drawWall(ctx,b){if(!playing()||(!overlay&&marked!==b.id)||!operational(b)||!b.def.wall)return;
      const danger=b.corpseLoad>R.rampMin,critical=b.health/b.maxHealth<=.3;
      ctx.save();ctx.strokeStyle=critical?'#ee8e78':danger?'#e7b663':T.openGate(b)?'#a3d7dd':'#8fac8c';ctx.lineWidth=(marked===b.id?3:1.5)/Math.max(.5,g.camera.zoom);ctx.strokeRect(b.left-3,b.top-3,b.w*C.TILE+6,b.h*C.TILE+6);
      if(danger){ctx.fillStyle='#e7b663';ctx.beginPath();ctx.moveTo(b.x,b.top-16);ctx.lineTo(b.x-6,b.top-5);ctx.lineTo(b.x+6,b.top-5);ctx.fill();}
      if(marked===b.id){ctx.fillStyle='#f2dc9e';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('REPÈRE · '+b.def.name,b.x,b.top-23);const p=g.workerCleanupPoint(g.player,b);ctx.setLineDash([3,3]);ctx.strokeStyle='#c4e1d7';ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.stroke();}
      ctx.restore();}
    wrap('updateInteraction',(old,dt)=>active()?(clear(dt),undefined):old(dt));
    for(const name of ['shootPlayer','melee','startReload'])wrap(name,(old,...args)=>active()?false:old(...args));
    wrap('updateDirector',(old,dt)=>{const phase=g.phase,result=old(dt);if(tool&&phase!==g.phase&&!['calm','aftermath'].includes(g.phase)){stow();g.releaseInputs();g.notify('Alerte : pelle rangée, armes disponibles.');}return result;});
    wrap('updatePlayer',(old,dt)=>{const result=old(dt);if(!alive(g.player)||g.frontier?.active())stow();return result;});
    for(const name of ['selectBuild','cancelPlacement','beginSquadRally'])wrap(name,(old,...a)=>{stow();return old(...a);});
    for(const name of ['startNew','restoreSave'])wrap(name,(old,...a)=>{const before=g.world,result=old(...a);if(g.world!==before)reset();return result;});
    wrap('showCommand',(old,show,...a)=>{if(!show)pending=null;return old(show,...a);});
    for(const name of ['returnToMenu','triggerGameOver'])wrap(name,(old,...a)=>{reset();return old(...a);});
    wrap('onEscape',(old,...a)=>{if(!g.activeOverlay&&active()){stow();g.releaseInputs();say('Pelle rangée.');return;}return old(...a);});
    wrap('drawGround',(old,ctx,...a)=>{const r=old(ctx,...a);drawGround(ctx);return r;});
    wrap('drawBuilding',(old,ctx,b,...a)=>{const r=old(ctx,b,...a);drawWall(ctx,b);return r;});
    wrap('drawPlayer',(old,ctx,...a)=>{const r=old(ctx,...a);if(active()&&!g.heroActions133?.pose()){ctx.save();ctx.translate(g.player.x,g.player.y);ctx.rotate(g.player.facing);ctx.strokeStyle='#c5aa79';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,11);ctx.lineTo(23,11);ctx.stroke();ctx.fillStyle='#afbbb0';ctx.fillRect(20,7,10,8);ctx.restore();}return r;});
    const api=Object.freeze({overview,geometry,inspect:()=>inspectRows(g),equip,toolActive:active,clear,preview,confirm,cancel,mark,setOverlay,drawGround,drawWall,open:()=>{g.showCommand?.(true,'field');g.linecareUI?.open();}});
    g.linecare=api;
    if(root.document)document.addEventListener('keydown',e=>{if(e.code==='KeyK'&&!e.repeat&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&running()&&!e.target?.closest?.('input,select,textarea,button,summary,a,[contenteditable]')){e.preventDefault();equip();}});
    return api;
  }
  const api=Object.freeze({RULES:R,inspectRows,traceAccess,repairQuote,install});root.DeadwallLinecare=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root.DEADWALL)install(root.DEADWALL);
})(typeof globalThis!=='undefined'?globalThis:this);
