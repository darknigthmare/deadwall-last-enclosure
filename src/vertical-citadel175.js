/* One authoritative citadel owner. Cameras read this state; neither creates targets or ammunition. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.VerticalCitadel175;
 const S=root.DeadwallVertical175State||(typeof require==='function'?require('./vertical-citadel175-state.js'):null);
 const copy=o=>JSON.parse(JSON.stringify(o)),live=o=>o&&!o.dead&&o.health>0,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const angle=a=>Math.atan2(Math.sin(a),Math.cos(a)),clamp=C.clamp;
 function install(g){
  if(g.vertical175)return g.vertical175;if(!g.expansions)return null;S.register();
  let state=S.initial(),job=null,travel=null,controlled=null,view='classic',notice='',scanClock=0,personalShot=false;
  const autoTargets=new Map(),wired=new WeakSet(),traces=[],wrap=(key,fn)=>{if(typeof g[key]==='function'){const old=g[key].bind(g);g[key]=(...args)=>fn(old,...args);}};
  const site=id=>state.sites.find(s=>s.id===id),building=id=>g.world?.buildings.get(id),base=b=>b&&R.bases[b.type];
  const online=b=>live(b)&&b.completed&&!b.siegeOffline&&!b.territoryOffline&&!b.gridOffline&&!b.dayOffline&&(!b.def.powerUse||b.powered);
  const can=()=>g.expansions.canAct()&&!g.frontier?.active()&&!g.expeditions?.driving()&&!g.expansions.busy('vertical175')&&!g.fieldcraft?.context().mounted;
  const busy=()=>!!job||!!travel||controlled!==null;
  const no=reason=>({ok:false,reason}),say=q=>{notice=q.reason||'';g.notify?.(notice,q.ok?'good':'danger');return q;};
  const ok=reason=>({ok:true,reason});
  function release(){controlled=null;view='classic';g.releaseInputs?.();g.vertical175UI?.release?.();}
  function stop(reason='Travail interrompu ; l’avancement financé est conservé.'){job=null;travel=null;release();notice=reason;return ok(reason);}
  function moduleRef(id){for(const s of state.sites)for(let level=0;level<s.decks.length;level++){const m=s.decks[level].modules.find(m=>m.id===id);if(m)return{s,b:building(s.id),level,m,def:R.modules[m.kind]};}return null;}
  function wire(b){if(!base(b)||wired.has(b))return;wired.add(b);
   Object.defineProperty(b,'def',{configurable:true,get(){const d=C.BUILDINGS[this.type],s=site(this.id);if(!s||!R.bases[this.type])return d;const n=S.totals(s);return{...d,housing:(d.housing||0)+n.housing,storage:(d.storage||0)+n.storage,powerUse:n.powerUse,score:d.score+n.score,light:n.light,production:n.production,consumes:n.consumes};}});
  }
  function ensure(){for(const b of g.world?.buildings.values()||[])if(base(b)&&live(b)){if(!site(b.id)){if(state.sites.length>=R.maxSites)continue;state.sites.push(S.siteInitial(b.id));}wire(b);}}
  function pose(){const a=state.actor,b=a&&building(a.site),s=a&&site(a.site);const z=b&&s?S.height(s,a.level,base(b)):0;
   const visibleZ=travel?travel.fromZ+(travel.toZ-travel.fromZ)*Math.min(1,travel.elapsed/travel.seconds):z;
   return{x:g.player?.x||0,y:g.player?.y||0,z:visibleZ,site:a?.site??null,level:a?.level??-1,travel:travel?{kind:travel.kind,progress:travel.elapsed/travel.seconds}:null};
  }
  function entrance(b){const q=S.bounds(b),r=(b.rotation||0)%4,offset=1.1;
   const p=r===0?{x:q.x+q.w/2,y:q.y+q.h+offset}:r===1?{x:q.x-offset,y:q.y+q.h/2}:r===2?{x:q.x+q.w/2,y:q.y-offset}:{x:q.x+q.w+offset,y:q.y+q.h/2};return{x:p.x*R.tile,y:p.y*R.tile};
  }
  const target=()=>state.actor?building(state.actor.site):base(g.selectedBuilding)?g.selectedBuilding:[...g.world.buildings.values()].filter(b=>base(b)&&live(b)&&dist(g.player,entrance(b))<R.workReach).sort((a,b)=>dist(g.player,a)-dist(g.player,b))[0]||null;
  function surfaceAt(x,y,z){for(const s of state.sites){const b=building(s.id);if(!live(b)||!b.completed)continue;const q=S.bounds(b);
   if(x<q.x*R.tile||x>=(q.x+q.w)*R.tile||y<q.y*R.tile||y>=(q.y+q.h)*R.tile)continue;
   const level=s.decks.findIndex((d,i)=>d.progress===1&&Math.abs(S.height(s,i,base(b))-z)<.001);if(level>=0)return{s,b,level};
  }return null;}
  function clearAt(x,y,z,r=g.player.radius*.78){
   if(![x,y,z,r].every(Number.isFinite)||r<0)return false;
   for(const [dx,dy]of [[0,0],[-r,0],[r,0],[0,-r],[0,r],[-r*.71,-r*.71],[r*.71,r*.71]])if(!surfaceAt(x+dx,y+dy,z))return false;
   for(const s of state.sites){const b=building(s.id);if(!live(b))continue;const i=s.decks.findIndex((d,k)=>d.progress===1&&Math.abs(S.height(s,k,base(b))-z)<.001);if(i<0)continue;
    for(const m of s.decks[i].modules){const box=S.moduleBox(b,m,z);if(x+r>box.x*R.tile&&x-r<(box.x+box.w)*R.tile&&y+r>box.y*R.tile&&y-r<(box.y+box.h)*R.tile)return false;}
   }return true;
  }
  function accessQuote(id,level=0,kind='stairs'){
   const b=building(id),s=site(id);if(!can()||busy()||g.player.reload>0)return no('Libérez vos mains et terminez le rechargement.');
   if(!live(b)||!b.completed||!s||!Number.isInteger(level)||level<-1||level>=s.decks.length||level>=0&&s.decks[level].progress!==1||!['stairs','lift'].includes(kind))return no('Palier inexistant ou chantier inachevé.');
   if(state.actor&&state.actor.site!==id)return no('Rejoignez la cage intérieure de ce support.');
   if(!state.actor&&level<0||state.actor?.level===level)return no('Vous êtes déjà sur ce palier.');
   const anchor=state.actor?{x:b.x,y:b.y}:entrance(b);
   if(dist(g.player,anchor)>R.workReach||!state.actor&&!g.workerCanWorkAt(g.player,anchor,R.workReach))return no('Rejoignez l’entrée intérieure, ou le palier central.');
   if(kind==='lift'&&(s.lift!==1||!online(b)))return no('Ascenseur inachevé ou hors tension : utilisez les escaliers.');
   const to=level<0?entrance(b):{x:b.x,y:b.y};if(level<0&&!groundClear(g.player,to.x,to.y)||level>=0&&!clearAt(to.x,to.y,S.height(s,level,base(b))))return no('Le palier de sortie est obstrué.');
   const fromZ=pose().z,toZ=level<0?0:S.height(s,level,base(b));return{ok:true,b,s,level,kind,fromZ,toZ,to,seconds:Math.abs(toZ-fromZ)/(kind==='lift'?R.liftSpeed:R.stairSpeed)+R.landingSeconds};
  }
  function access(id,level=0,kind='stairs'){const q=accessQuote(id,level,kind);if(!q.ok)return say(q);
   travel={...q,elapsed:0,world:g.world,health:g.player.health};g.cancelPlacement();g.releaseInputs();notice=(kind==='lift'?'Ascenseur':'Escalier intérieur')+' : progression vers '+q.toZ+' m.';return ok(notice);
  }
  function currentWorkSite(id){const b=building(id),s=site(id);if(!can()||busy()||g.player.reload>0)return no('Une autre action occupe vos mains.');
   if(!live(b)||!b.completed||!s)return no('Achevez le support porteur.');
   if(!state.actor||state.actor.site!==id)return no('Montez sur le support avant de lancer ses travaux.');
   if(dist(g.player,{x:b.x,y:b.y})>R.workReach)return no('Rejoignez le palier central pour travailler.');return{ok:true,b,s,level:state.actor.level};
  }
  function moduleQuote(kind,slot,id=state.actor?.site){const q=currentWorkSite(id),d=R.modules[kind];if(!q.ok)return q;
   if(!d||!Number.isInteger(slot)||slot<0||slot>3)return no('Équipement ou emplacement inconnu.');
   if(g.tier.id<d.tier)return no('Âge requis : '+C.CITY_TIERS[d.tier].name+'.');
   if(q.s.decks[q.level].modules.some(m=>m.slot===slot))return no('Cet emplacement est déjà occupé.');
   if(state.sites.reduce((n,s)=>n+s.decks.reduce((v,d)=>v+d.modules.length,0),0)>=R.maxModules||state.nextId>=Number.MAX_SAFE_INTEGER)return no('Limite de construction atteinte.');
   if(S.mass(q.s)+d.mass>base(q.b).capacity)return no('Charge portante dépassée : utilisez une fondation plus profonde.');
   if(!C.canAfford(g.resources,d.cost))return no('Matériaux manquants au dépôt : '+C.resourceText(d.cost));return{...q,kind,slot,def:d,cost:d.cost};
  }
  function launchJob(q,kind,object,seconds){job={kind,object,id:q.b.id,level:q.level,seconds,x:g.player.x,y:g.player.y,health:g.player.health,world:g.world,elapsed:0};g.releaseInputs();notice='Travaux en cours : restez au palier central.';g.refreshMetrics(true);return ok(notice);}
  function buildModule(kind,slot,id=state.actor?.site){const q=moduleQuote(kind,slot,id);if(!q.ok)return say(q);
   const m={id:state.nextId++,kind,slot,progress:0,health:q.def.health,ammo:0,yaw:-Math.PI/2,pitch:0,heat:0,cooldown:0,overheated:false};C.spend(g.resources,q.cost);q.s.decks[q.level].modules.push(m);return launchJob(q,'module',m,q.def.seconds);
  }
  function deckQuote(id=state.actor?.site){const q=currentWorkSite(id);if(!q.ok)return q;const n=q.s.decks.length;
   if(base(q.b).wall)return no('Les remparts portent leur chemin de ronde ; les quartiers superposés nécessitent des fondations.');
   if(q.level!==n-1||q.s.decks.some(d=>d.progress<1))return no('Rejoignez la dernière dalle achevée.');
   if(n>=R.maxDecks||S.height(q.s,n,base(q.b))>R.maxHeight||S.mass(q.s)+R.deckMass>base(q.b).capacity)return no('Limite de hauteur ou de charge portante atteinte.');
   if(!C.canAfford(g.resources,R.deck.cost))return no('Matériaux requis : '+C.resourceText(R.deck.cost));return q;
  }
  function buildDeck(id=state.actor?.site){const q=deckQuote(id);if(!q.ok)return say(q);const d={progress:0,health:R.deck.health,modules:[]};C.spend(g.resources,R.deck.cost);q.s.decks.push(d);return launchJob(q,'deck',d,R.deck.seconds);}
  function buildLift(id=state.actor?.site){const q=currentWorkSite(id);if(!q.ok)return say(q);if(q.s.lift!==0)return say(no('Ascenseur déjà construit ou en chantier.'));if(!C.canAfford(g.resources,R.lift.cost))return say(no('Matériaux requis : '+C.resourceText(R.lift.cost)));C.spend(g.resources,R.lift.cost);q.s.lift=Number.EPSILON;return launchJob(q,'lift',q.s,R.lift.seconds);}
  function resume(id=state.actor?.site){const q=currentWorkSite(id);if(!q.ok)return say(q);
   const m=q.s.decks[q.level].modules.find(m=>m.progress<1);if(m)return launchJob(q,'module',m,R.modules[m.kind].seconds);
   const d=q.s.decks[q.level+1];if(d&&d.progress<1)return launchJob(q,'deck',d,R.deck.seconds);
   if(q.s.lift>0&&q.s.lift<1)return launchJob(q,'lift',q.s,R.lift.seconds);return say(no('Aucun chantier à reprendre à ce palier.'));
  }
  function nearModule(ref){if(!ref||!online(ref.b)||ref.m.progress!==1||!state.actor||state.actor.site!==ref.s.id||state.actor.level!==ref.level)return false;
   const p=S.slots(ref.b)[ref.m.slot];return Math.hypot(g.player.x-p.x*R.tile,g.player.y-p.y*R.tile)<=R.workReach;
  }
  function reload(id){const q=moduleRef(id);if(!can()||busy()||!nearModule(q)||!q.def.range||g.player.reload>0)return say(no('Rejoignez l’affût, hors tir et rechargement.'));
   const n=Math.min(q.def.capacity-q.m.ammo,Math.floor(g.player.carry.ammo||0));if(n<=0)return say(no('Chargeur plein, ou aucune munition dans votre sac.'));
   job={kind:'reload',id:q.s.id,level:q.level,object:q.m,seconds:R.reloadSeconds,elapsed:0,amount:n,bag:g.player.carry,x:g.player.x,y:g.player.y,health:g.player.health,world:g.world};g.releaseInputs();return ok('Ravitaillement depuis le sac : restez auprès de l’affût.');
  }
  function possess(id){if(controlled===id){release();return ok('Contrôle automatique rétabli.');}const q=moduleRef(id);
   if(!can()||busy()||g.player.reload>0||!nearModule(q)||!q.def.range)return say(no('Rejoignez à pied un affût opérationnel sur ce palier.'));
   controlled=id;view='classic';g.cancelPlacement();g.releaseInputs();return say(ok('Affût contrôlé : viser et tirer ; V change la vue, I rend le contrôle.'));
  }
  function setView(next){if(controlled===null||!['classic','fps'].includes(next))return false;view=next;g.input.mouseDown=false;g.input.touchFire=false;return true;}
  function aim(yaw,pitch){const q=moduleRef(controlled);if(!q||![yaw,pitch].every(Number.isFinite))return false;q.m.yaw=angle(yaw);q.m.pitch=clamp(pitch,-1.45,1.1);return true;}
  function muzzle(q){const p=S.slots(q.b)[q.m.slot],z=S.height(q.s,q.level,base(q.b))+R.muzzleHeight;return{x:p.x,y:p.y,z};}
  function geometry(){const boxes=[];
   for(const b of g.world.buildings.values())if(live(b)&&b.completed){const q=S.bounds(b),s=site(b.id),v=base(b),h=v?.height||(b.def.wall?3:R.structureHeight);
    if(b.def.gate&&b.gateMode==='open')continue;
    boxes.push({...q,z:0,d:h,owner:b.id,type:'structure'});
    if(s)for(let i=0;i<s.decks.length;i++){const d=s.decks[i],z=S.height(s,i,v);if(i&&d.progress===1)boxes.push({...q,z:z-.4,d:.4,owner:b.id,type:'deck'});
     for(const m of d.modules)boxes.push({...S.moduleBox(b,m,z),owner:b.id,module:m.id,type:'module'});
    }
   }return boxes;
  }
  function giantBox(e){const d=R.siege.kinds[e.kind];return{x:e.x/R.tile-d.radius,y:e.y/R.tile-d.radius,z:0,w:d.radius*2,h:d.radius*2,d:d.height};}
  function aimPoint(e){return{x:e.x/R.tile,y:e.y/R.tile,z:R.siege.kinds[e.kind]?R.siege.kinds[e.kind].height*.86:e.kind==='crawler'?.3:.9};}
  function sightQuery(origin,range,ignoreModule=null,boxes=geometry()){
   const blackout=g.nightwatch?.isBlackout?.(),day=blackout?0:clamp(g.daylight?.()??1,0,1),lights=[];
   const clear=(from,to,ignoredOwner=null,ignoredModule=ignoreModule)=>{const a=S.lookAt(from,to),direction=S.direction(a.yaw,a.pitch),distance=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z);return boxes.every(box=>box.owner===ignoredOwner||box.module===ignoredModule||S.rayBox(from,direction,box,Math.max(0,distance-.02))===null);};
   if(day<1){
    for(const l of g.nightwatch?.sources?.(false)||[])if(l.r>0)lights.push({x:l.x/R.tile,y:l.y/R.tile,z:R.eyeHeight,range:l.r/R.tile,owner:l.id??null,angle:l.angle||0,half:l.half??Math.PI});
    for(const s of state.sites){const b=building(s.id);if(!online(b))continue;for(let level=0;level<s.decks.length;level++)for(const m of s.decks[level].modules)if(m.kind==='spotlight'&&m.progress===1){const p=S.slots(b)[m.slot];lights.push({x:p.x,y:p.y,z:S.height(s,level,base(b))+R.muzzleHeight,range:R.modules.spotlight.light/R.tile,owner:null,module:m.id,half:Math.PI});}}
   }
   return e=>{if(!live(e))return false;const to=aimPoint(e),distance=Math.hypot(to.x-origin.x,to.y-origin.y,to.z-origin.z);if(distance>range||!clear(origin,to))return false;
    if(distance<=Math.max(R.nightSight,range*day))return true;
    return lights.some(l=>Math.hypot(to.x-l.x,to.y-l.y,to.z-l.z)<=l.range&&Math.abs(angle(Math.atan2(to.y-l.y,to.x-l.x)-(l.angle||0)))<=l.half&&clear(l,to,l.owner,l.module??null));
   };
  }
  function raycast(origin,yaw,pitch,range,ignoreModule=null,boxes=geometry()){
   const dir=S.direction(yaw,pitch);let best={distance:range,type:'miss',entity:null};
   if(dir.z<0){const d=-origin.z/dir.z;if(d>=0&&d<best.distance)best={distance:d,type:'ground',entity:null};}
   for(const box of boxes){if(box.module===ignoreModule)continue;const d=S.rayBox(origin,dir,box,best.distance);if(d!==null&&d<best.distance)best={distance:d,type:box.type,entity:box};}
   for(const e of g.zombies){if(!live(e))continue;const h=e.kind==='crawler'?.6:1.8,r=e.radius/R.tile,box={x:e.x/R.tile-r,y:e.y/R.tile-r,z:0,w:2*r,h:2*r,d:h};const d=S.rayBox(origin,dir,box,best.distance);if(d!==null&&d<best.distance)best={distance:d,type:'zombie',entity:e};}
   for(const e of state.giants){const d=S.rayBox(origin,dir,giantBox(e),best.distance);if(d!==null&&d<best.distance)best={distance:d,type:'giant',entity:e};}
   return{...best,origin,point:{x:origin.x+dir.x*best.distance,y:origin.y+dir.y*best.distance,z:origin.z+dir.z*best.distance}};
  }
  function hit(result,damage){if(result.type==='zombie'&&live(result.entity)){const from={x:result.origin.x*R.tile,y:result.origin.y*R.tile},applied=g.zombieBulletDamage?.(result.entity,damage,from)??damage;if(applied<damage)result.entity.shieldImpact=.12;result.entity.health-=applied;if(result.entity.health<=0)g.killZombie(result.entity,false);}
   if(result.type==='giant'){const e=result.entity,d=R.siege.kinds[e.kind],weak=result.point.z<d.height*.18||result.point.z>d.height*.84;e.health-=damage*(weak?d.weakDamage:1);if(e.health<=0){state.giants=state.giants.filter(v=>v!==e);g.stats.kills++;notice=d.name+' abattu ; les infectés ordinaires restent actifs.';}}
  }
  function shoot(q){if(!online(q.b)||q.m.progress!==1||q.m.ammo<q.def.ammoPerShot||q.m.cooldown>0||q.m.overheated)return false;
   const origin=muzzle(q),result=raycast(origin,q.m.yaw,q.m.pitch,q.def.range,q.m.id);q.m.ammo-=q.def.ammoPerShot;q.m.cooldown=1/q.def.rate;q.m.heat=Math.min(R.heatLimit,q.m.heat+q.def.heat);if(q.m.heat>=R.heatLimit)q.m.overheated=true;hit(result,q.def.damage);
   if(q.def.splash&&result.type!=='miss')for(const e of [...g.zombies,...state.giants]){if(!live(e)||e===result.entity)continue;const to={x:e.x/R.tile,y:e.y/R.tile,z:1},d=Math.hypot(to.x-result.point.x,to.y-result.point.y,to.z-result.point.z);if(d>q.def.splash)continue;
    const start={...result.point,z:result.point.z+.06},a=S.lookAt(start,to),r=raycast(start,a.yaw,a.pitch,d+.05,q.m.id);if(r.entity===e)hit(r,q.def.damage*(1-d/q.def.splash));
   }
   traces.push({from:origin,to:result.point,life:R.traceLife});if(traces.length>R.maxTraces)traces.shift();g.audio?.shoot?.('rifle');return true;
  }
  function fire(){const q=moduleRef(controlled);return !!q&&can()&&!g.paused&&!g.activeOverlay&&nearModule(q)&&shoot(q);}
  function dropSite(id,height){autoTargets.clear();state.sites=state.sites.filter(s=>s.id!==id);if(job?.id===id)job=null;if(travel?.b.id===id)travel=null;
   if(state.actor?.site!==id)return;release();state.actor=null;let point={x:g.player.x,y:g.player.y};
   if(!groundClear(g.player,point.x,point.y)){let found=false;for(let r=R.tile;r<R.tile*12&&!found;r+=R.tile)for(let i=0;i<16;i++){const p={x:point.x+Math.cos(i*Math.PI/8)*r,y:point.y+Math.sin(i*Math.PI/8)*r};if(groundClear(g.player,p.x,p.y)){point=p;found=true;break;}}}
   g.player.x=point.x;g.player.y=point.y;g.damagePlayer(height*R.fallDamagePerMetre);notice='Support perdu : effondrement des étages et perte de leurs équipements.';
  }
  function workStep(dt){if(!job)return;const j=job,b=building(j.id);if(!live(b)||g.world!==j.world||g.player.health<j.health||g.player.reload>0||dist(g.player,j)>R.workMoveTolerance||!state.actor||state.actor.site!==j.id||state.actor.level!==j.level||g.frontier?.active()||g.input.mouseDown||g.input.touchFire){job=null;notice='Travail interrompu ; chantier conservé.';return;}
   if(j.kind==='reload'){const q=moduleRef(j.object.id);if(!nearModule(q)||g.player.carry!==j.bag){job=null;return;}j.elapsed+=dt;if(j.elapsed>=j.seconds){const n=Math.min(j.amount,Math.floor(j.bag.ammo||0),q.def.capacity-q.m.ammo);j.bag.ammo-=n;q.m.ammo+=n;job=null;notice='Ravitaillement terminé : '+n+' cartouches transférées.';}return;}
   const key=j.kind==='lift'?'lift':'progress';j.object[key]=Math.min(1,j.object[key]+dt/j.seconds);if(j.object[key]===1){job=null;g.refreshMetrics(true);notice='Chantier achevé : '+(j.kind==='module'?R.modules[j.object.kind].name:j.kind==='deck'?R.deck.name:R.lift.name);}
  }
  function travelStep(dt){if(!travel)return;const t=travel;if(!live(t.b)||g.world!==t.world||!live(g.player)||g.player.health<t.health){travel=null;notice='Accès interrompu : retour au dernier palier sûr.';return;}
   if(t.kind==='lift'&&!online(t.b)){travel=null;notice='Coupure de courant : accès interrompu. Les escaliers restent disponibles.';return;}
   t.elapsed+=dt;if(t.elapsed<t.seconds)return;
   if(t.level<0&&!groundClear(g.player,t.to.x,t.to.y)||t.level>=0&&!clearAt(t.to.x,t.to.y,t.toZ)){travel=null;notice='Palier devenu obstrué : trajet annulé.';return;}
   state.actor=t.level<0?null:{site:t.b.id,level:t.level};g.player.x=t.to.x;g.player.y=t.to.y;g.player.vx=g.player.vy=0;travel=null;g.releaseInputs();notice='Palier rejoint : '+t.toZ+' m.';
  }
  function spawnSiege(){if(g.phase!=='assault'||g.wave<R.siege.firstWave||g.wave%R.siege.spawnWaveInterval||state.lastSiegeWave===g.wave||state.giants.length>=R.siege.maxGiants)return;
   const wall=state.sites.map(s=>building(s.id)).find(b=>live(b)&&b.completed&&base(b).wall);if(!wall||g.tier.id<6)return;
   state.lastSiegeWave=g.wave;const kind=g.tier.id>=10?'colossus':g.tier.id>=8?'carrier':'breaker',d=R.siege.kinds[kind],m=(d.radius+2)*R.tile,W=C.WORLD_SIZE;
   const points=[{x:m,y:W*.25},{x:W-m,y:W*.75},{x:W*.75,y:m},{x:W*.25,y:W-m}];
   for(let i=0;i<4;i++){const p=points[(i+g.wave)%4],probe={...p,radius:d.radius*R.tile,kind:'walker'};if(g.hostilePositionClear(probe,p.x,p.y)&&!g.visible(p.x,p.y,120,g.viewBounds())){state.giants.push({id:state.nextId++,kind,...p,health:d.health,cooldown:R.siege.interval,windup:0,target:null,yaw:0});notice=d.name+' repéré sur le front extérieur.';break;}}
  }
  function giantStep(dt){spawnSiege();for(const e of [...state.giants]){const d=R.siege.kinds[e.kind];let target=building(e.target);e.cooldown=Math.max(0,e.cooldown-dt);
   if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(e.windup===0&&live(target)){const near=Math.hypot(e.x-clamp(e.x,target.left,target.right),e.y-clamp(e.y,target.top,target.bottom))/R.tile;if(near<=d.reach+d.radius){g.damageBuilding(target,d.damage*g.difficulty.enemyDamage);if(dist(g.player,e)<(d.radius+R.siege.damageRadius)*R.tile&&pose().z<=d.height)g.damagePlayer(d.damage*.3);}}continue;}
   if(!live(target)){target=state.sites.map(s=>building(s.id)).filter(b=>live(b)&&b.completed).sort((a,b)=>dist(e,a)-dist(e,b))[0]||g.core();e.target=target?.id??null;}if(!live(target))continue;
   const dx=target.x-e.x,dy=target.y-e.y,len=Math.hypot(dx,dy)||1;e.yaw=Math.atan2(dy,dx);
   const reach=Math.hypot(e.x-clamp(e.x,target.left,target.right),e.y-clamp(e.y,target.top,target.bottom))/R.tile;
   if(reach<=d.reach+d.radius){if(e.cooldown<=0){e.windup=R.siege.telegraph;e.cooldown=R.siege.interval;}continue;}
   const step=d.speed*R.tile*dt,nx=e.x+dx/len*step,ny=e.y+dy/len*step,block=g.world.at(nx+dx/len*d.radius*R.tile,ny+dy/len*d.radius*R.tile);
   if(block&&!block.dead&&block!==target){e.target=block.id;continue;}
   if(g.hostilePositionClear({x:e.x,y:e.y,radius:d.radius*R.tile,kind:'walker'},nx,ny)){e.x=nx;e.y=ny;}
  }}
  function step(dt){if(!Number.isFinite(dt)||dt<=0||g.paused||g.activeOverlay||g.state!=='playing'||g.gameOver)return;
   const delta=Math.min(dt,R.step);ensure();if(!live(g.player)){state.actor=null;stop('');}
   for(const s of [...state.sites])if(!live(building(s.id)))dropSite(s.id,pose().z);
   travelStep(delta);workStep(delta);scanClock-=delta;let boxes=null;
   for(const s of state.sites){const b=building(s.id);if(!live(b))continue;for(let level=0;level<s.decks.length;level++)for(const m of s.decks[level].modules){const def=R.modules[m.kind];if(!def.range||m.progress!==1)continue;
    m.cooldown=Math.max(0,m.cooldown-delta);m.heat=Math.max(0,m.heat-R.heatRecovery*delta);if(m.overheated&&m.heat<=R.heatResume)m.overheated=false;
    const q={b,s,level,m,def};if(m.id===controlled){if(!nearModule(q)){release();continue;}if(view==='classic'){const p=muzzle(q),to={x:g.input.mouseWorldX/R.tile,y:g.input.mouseWorldY/R.tile,z:.9},a=S.lookAt(p,to);aim(a.yaw,a.pitch);}if(g.input.mouseDown||g.input.touchFire)fire();}
    else if(online(b)&&m.ammo>=def.ammoPerShot){boxes??=geometry();const origin=muzzle(q);let enemy=autoTargets.get(m.id);
     if(scanClock<=0){const visible=sightQuery(origin,def.range,m.id,boxes),candidates=[];
      for(const e of [...g.zombies,...state.giants]){if(!live(e))continue;const p=aimPoint(e),distance=Math.hypot(p.x-origin.x,p.y-origin.y,p.z-origin.z);if(distance>def.range)continue;let index=candidates.findIndex(v=>v.distance>distance);if(index<0)index=candidates.length;if(index>=R.targetCandidates)continue;candidates.splice(index,0,{e,distance});if(candidates.length>R.targetCandidates)candidates.pop();}
      enemy=candidates.find(v=>visible(v.e))?.e;autoTargets.set(m.id,enemy);
     }
     if(live(enemy)&&m.cooldown<=0&&!m.overheated){const a=S.lookAt(origin,aimPoint(enemy));m.yaw=a.yaw;m.pitch=clamp(a.pitch,-1.45,1.1);shoot(q);}
    }
   }}
   if(scanClock<=0)scanClock=R.scanInterval;for(let i=traces.length-1;i>=0;i--){traces[i].life-=delta;if(traces[i].life<=0)traces.splice(i,1);}giantStep(delta);
  }
  const groundClear=g.friendlyPositionClear.bind(g);
  wrap('friendlyPositionClear',(old,e,x,y)=>e===g.player&&state.actor?clearAt(x,y,pose().z,e.radius*.78):old(e,x,y));
  wrap('moveFriendly',(old,e,dx,dy)=>{if(e!==g.player||!state.actor)return old(e,dx,dy);if(travel||controlled!==null)return;const z=pose().z,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/(e.radius*.5)));for(let i=0;i<n;i++){if(clearAt(e.x+dx/n,e.y,z))e.x+=dx/n;if(clearAt(e.x,e.y+dy/n,z))e.y+=dy/n;}const s=surfaceAt(e.x,e.y,z);if(s)state.actor={site:s.s.id,level:s.level};});
  wrap('workerCanWorkAt',(old,e,t,...args)=>e===g.player&&state.actor?false:old(e,t,...args));
  wrap('hostileLineClear',(old,a,b,...args)=>{if((a===g.player||b===g.player)&&pose().z>2)return false;return old(a,b,...args);});
  wrap('zombieCanClimb',(old,e,b)=>base(b)?(b.corpseLoad>base(b).height*R.climbLoadPerMetre&&old(e,b)):old(e,b));
  wrap('selectBuild',(old,...args)=>state.actor?say(no('Redescendez au sol pour placer une nouvelle fondation.')):old(...args));
  wrap('placeOne',(old,type,...args)=>{if(base({type})&&state.sites.length>=R.maxSites)return false;const result=old(type,...args);if(result&&R.bases[type]){ensure();g.refreshMetrics(true);}return result;});
  wrap('updateInteraction',(old,dt)=>{if(!state.actor&&!travel)return old(dt);g.interactionText=notice||'CITÉ VERTICALE — E : accès intérieur · Préparatifs : équipements et dalles';if(g.input.pressed.has('KeyE')&&!busy()){const b=target();if(b)access(b.id,state.actor?.level>0?state.actor.level-1:-1);}});
  wrap('updatePlayer',(old,dt)=>{if(travel||controlled!==null){g.player.shootCooldown=Math.max(0,g.player.shootCooldown-dt);g.player.meleeCooldown=Math.max(0,g.player.meleeCooldown-dt);g.player.invulnerable=Math.max(0,g.player.invulnerable-dt);g.player.vx=g.player.vy=0;
    if(g.input.pressed.has('KeyI'))release();if(controlled!==null&&g.input.pressed.has('KeyV'))g.vertical175UI?.toggleView?.();if(!live(g.player)){state.actor=null;stop('');return old(dt);}return;}
   return old(dt);
  });
  wrap('shootPlayer',(old,...args)=>{personalShot=!!state.actor;try{return old(...args);}finally{personalShot=false;}});
  wrap('fireFriendly',(old,x,y,yaw,damage,range,...args)=>{if(!personalShot)return old(x,y,yaw,damage,range,...args);const p={x:g.player.x/R.tile,y:g.player.y/R.tile,z:pose().z+R.eyeHeight},to={x:g.input.mouseWorldX/R.tile,y:g.input.mouseWorldY/R.tile,z:.9},a=S.lookAt(p,to),result=raycast(p,a.yaw,a.pitch,range/R.tile);hit(result,damage);traces.push({from:p,to:result.point,life:R.traceLife});if(traces.length>R.maxTraces)traces.shift();});
  wrap('updateProjectiles',(old,dt)=>{if(state.giants.length)for(const p of g.projectiles){if(p.dead||p.owner!=='friendly')continue;const speed=Math.hypot(p.vx,p.vy),origin={x:p.x/R.tile,y:p.y/R.tile,z:R.eyeHeight},result=raycast(origin,Math.atan2(p.vy,p.vx),0,speed*dt/R.tile);if(result.type==='giant'){hit(result,p.damage);p.dead=true;}}return old(dt);});
  wrap('destroyBuilding',(old,b,...args)=>{const z=state.actor?.site===b.id?pose().z:0,result=old(b,...args);if(base(b)&&b.dead){dropSite(b.id,z);g.refreshMetrics(true);}return result;});
  wrap('structureActionStatus',(old,action,b,...args)=>{if(base(b)&&site(b.id)&&(site(b.id).decks.length>1||site(b.id).decks.some(d=>d.modules.length)||site(b.id).lift||state.actor?.site===b.id)&&['demolish','upgrade'].includes(action))return no('Support occupé : ses étages ne peuvent pas être démontés par l’outil au sol.');return old(action,b,...args);});
  wrap('update',(old,dt)=>{const result=old(dt);step(dt);return result;});
  wrap('returnToMenu',(old,...args)=>{stop('');return old(...args);});
  wrap('onEscape',(old,...args)=>{if(busy()){stop();return;}return old(...args);});
  function overview(){const b=target(),s=b&&site(b.id),p=pose();return{summary:'Remparts, fondations et équipements reliés aux stocks et à l’électricité de D-17.',message:notice,
   rows:[{label:'Altitude',value:p.z.toFixed(1)+' m'},{label:'Support',value:b?.def.name||'Approchez une entrée ou sélectionnez une fondation'},{label:'Charge',value:s?S.mass(s)+' / '+base(b).capacity:'—'},{label:'Paliers',value:s?s.decks.filter(d=>d.progress===1).length:'—'},{label:'Accès',value:s?.lift===1?'Escalier + ascenseur alimenté selon le réseau':'Escalier intérieur'},{label:'Travail',value:job?job.kind:travel?travel.kind:controlled!==null?'Affût manuel':'Aucun'}]};}
  function actions(){const b=target(),s=b&&site(b.id),result=[];if(!s)return result;
   const add=(id,label,run,description='')=>result.push({id,label,run,description,close:true});
   if(!state.actor)add('up','Monter par l’escalier intérieur',()=>access(b.id,0));
   else{
    add('down','Descendre au palier inférieur',()=>access(b.id,state.actor.level>0?state.actor.level-1:-1));
    if(s.decks[state.actor.level+1]?.progress===1)add('next','Monter au palier supérieur',()=>access(b.id,state.actor.level+1));
    if(s.lift===1){add('lift-ground','Ascenseur : rez-de-chaussée',()=>access(b.id,-1,'lift'));if(s.decks[state.actor.level+1]?.progress===1)add('lift-up','Ascenseur : palier supérieur',()=>access(b.id,state.actor.level+1,'lift'));}
    add('deck','Financer une dalle supplémentaire (+6 m)',()=>buildDeck(b.id),C.resourceText(R.deck.cost));add('lift','Installer l’ascenseur',()=>buildLift(b.id),C.resourceText(R.lift.cost));add('resume','Reprendre le chantier financé',()=>resume(b.id));
    const deck=s.decks[state.actor.level],free=[0,1,2,3].find(slot=>!deck.modules.some(m=>m.slot===slot));
    if(free!==undefined)for(const [kind,d]of Object.entries(R.modules))add('build-'+kind,'Installer : '+d.name,()=>buildModule(kind,free,b.id),C.resourceText(d.cost)+' · '+d.mass+' charge · emplacement '+(free+1));
    for(const m of deck.modules)if(R.modules[m.kind].range&&m.progress===1){add('control-'+m.id,'Contrôler : '+R.modules[m.kind].name,()=>possess(m.id),'Rejoignez physiquement son emplacement.');add('reload-'+m.id,'Ravitailler : '+R.modules[m.kind].name,()=>reload(m.id),m.ammo+' cartouches · transfert depuis le sac.');}
   }
   if(busy())add('cancel','Interrompre / rendre le contrôle',()=>stop());return result;
  }
  const api={pose,entrance,target,surfaceAt,clearAt,accessQuote,access,moduleQuote,buildModule,deckQuote,buildDeck,buildLift,resume,reload,possess,release,setView,aim,fire,raycast,geometry,giantBox,step,overview,actions,busy,stop,sightQuery,aimPoint,
   hasActiveSiege:()=>state.giants.length>0,snapshot:()=>copy(state),presentation:()=>({sites:state.sites,giants:state.giants,traces,controlled,view,job:job?{kind:job.kind,seconds:job.seconds,elapsed:job.elapsed}:null,notice}),moduleRef,muzzle};g.vertical175=Object.freeze(api);
  g.expansions.register({id:'vertical175',title:'Citadelle verticale',validate:S.normalize,snapshot:api.snapshot,overview,actions,busy,
   restore:raw=>{state=S.normalize(raw);autoTargets.clear();stop('');ensure();g.refreshMetrics(true);},reset:()=>{state=S.initial();stop('');traces.length=0;autoTargets.clear();scanClock=0;}});
  wrap('restoreSave',(old,raw)=>{const p=raw?.player?{x:raw.player.x,y:raw.player.y}:null,result=old(raw);if(result!==false&&state.actor&&p){g.player.x=p.x;g.player.y=p.y;}return result;});
  ensure();return api;
 }
 const api={install};root.DeadwallVerticalCitadel175=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
