/* Native enemies keep their IDs, health, loot and wave budget; only their supported altitude is owned here. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.VerticalCitadel175,Q=C.VerticalSiege176;
 const S=root.DeadwallVertical175State||(typeof require==='function'?require('./vertical-citadel175-state.js'):null);
 const live=e=>e&&!e.dead&&e.health>0;
 function create(g,h){
  let piles=[],claims=new Map(),clock=0;
  const records=()=>h.state().climbers;
  const record=e=>e&&records().find(c=>c.id===e.id);
  const active=()=>g.state==='playing'&&!g.gameOver&&!g.paused&&!g.activeOverlay&&!g.frontier?.active();
  function enemyPose(e){const c=record(e),b=c&&h.building(c.site);return c&&b?{z:c.stage==='roof'?R.bases[b.type].height:S.climbPoint(b,c).z,site:c.site,stage:c.stage}: {z:0,site:null,stage:'ground'};}
  function approach(b,z){const q=S.bounds(b),x=z.x/R.tile,y=z.y/R.tile;
   const options=[{side:0,lane:x-q.x,start:q.y-y,span:q.w},{side:1,lane:y-q.y,start:x-q.x-q.w,span:q.h},{side:2,lane:x-q.x,start:y-q.y-q.h,span:q.w},{side:3,lane:y-q.y,start:q.x-x,span:q.h}];
   return options.filter(p=>p.start>=0&&p.start<=Q.apron&&p.lane>=Q.margin&&p.lane<=p.span-Q.margin).sort((a,b)=>a.start-b.start||a.side-b.side)[0]||null;
  }
  function prepare(dt){if(!active()||!Number.isFinite(dt)||dt<=0)return;clock-=Math.min(dt,R.step);if(clock>0)return;clock=Q.scanSeconds;
   const walls=h.state().sites.map(s=>h.building(s.id)).filter(b=>live(b)&&b.completed&&R.bases[b.type]?.wall&&!(b.def.gate&&b.gateMode==='open'));
   const lifted=new Set(records().map(c=>c.id)),map=new Map();piles=[];claims=new Map();
   for(const b of walls)for(let side=0;side<4;side++){const p={site:b.id,side,living:0,load:Math.max(0,b.corpseLoad||0)*Q.corpseFaceShare,height:0};map.set(b.id+':'+side,p);piles.push(p);}
   for(const z of g.zombies){if(!live(z)||lifted.has(z.id))continue;let best=null;
    for(const b of walls){const a=approach(b,z);if(!a||best&&a.start>=best.a.start)continue;
     const q=S.bounds(b),point={x:C.clamp(z.x,q.x*R.tile,(q.x+q.w)*R.tile),y:C.clamp(z.y,q.y*R.tile,(q.y+q.h)*R.tile)};
     if(!h.groundLine(z,point,false,b))continue;best={b,a};
    }
    if(best){const p=map.get(best.b.id+':'+best.a.side);p.living++;p.load+=(C.ENEMIES[z.kind]?.corpseLoad||1)*Q.livingWeight;claims.set(z.id,best);}
   }
   for(const p of piles)p.height=Math.min(R.bases[h.building(p.site).type].height,p.load/Q.loadPerMetre);
  }
  function pile(id,side){return piles.find(p=>p.site===id&&p.side===side);}
  function forget(id){h.state().climbers=records().filter(c=>c.id!==id);claims.delete(id);clock=0;}
  function removeSupport(id){const ids=records().filter(c=>c.site===id).map(c=>c.id);h.state().climbers=records().filter(c=>c.site!==id);
   for(const n of ids){const z=g.zombies.find(e=>e.id===n);if(live(z))g.killZombie(z,false);}clock=0;
  }
  function canStand(b,x,y,r){const surface=h.surfaceAt(x,y,R.bases[b.type].height);return surface?.b.id===b.id&&h.clearAt(x,y,R.bases[b.type].height,r);}
  function line(from,to,ignoredModule=null){const a=S.lookAt(from,to),direction=S.direction(a.yaw,a.pitch),distance=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z);
   return h.geometry().every(b=>b.module===ignoredModule||S.rayBox(from,direction,b,Math.max(0,distance-.03))===null);
  }
  function roof(z,c,b,dt){const height=R.bases[b.type].height,origin={x:z.x/R.tile,y:z.y/R.tile,z:height+.8};let target=null;
   const player=h.pose();if(live(g.player)&&player.site===b.id&&Math.abs(player.z-height)<.1&&line(origin,{x:g.player.x/R.tile,y:g.player.y/R.tile,z:height+.8}))target={x:g.player.x,y:g.player.y,kind:'player'};
   if(!target){const s=h.state().sites.find(s=>s.id===b.id);let best=Infinity;
    for(const m of s.decks[0].modules){const box=S.moduleBox(b,m,height),x=C.clamp(z.x,box.x*R.tile,(box.x+box.w)*R.tile),y=C.clamp(z.y,box.y*R.tile,(box.y+box.h)*R.tile),d=Math.hypot(z.x-x,z.y-y);
     if(d<best&&line(origin,{x:x/R.tile,y:y/R.tile,z:height+.8},m.id)){target={x,y,kind:'module',id:m.id};best=d;}
    }
   }
   if(!target)return;
   const dx=target.x-z.x,dy=target.y-z.y,d=Math.hypot(dx,dy),def=C.ENEMIES[z.kind];z.facing=Math.atan2(dy,dx);
   if(d<=Q.meleeReach*R.tile+z.radius){if(z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;const amount=def.damage*g.difficulty.enemyDamage;
     if(target.kind==='player')g.damagePlayer(amount);else h.damageModule(target.id,amount*(def.structureDamage||1));g.recordActorAction159?.(z,'attack',z.attackCooldown,{facing:z.facing});}return;}
   const distance=Q.roofSpeed*R.tile*dt*(z.stagger>0?.35:1),steps=Math.max(1,Math.ceil(distance/(Q.roofStep*R.tile)));
   for(let i=0;i<steps;i++){let move=null,score=Infinity;for(const turn of [0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2]){const a=Math.atan2(target.y-z.y,target.x-z.x)+turn,x=z.x+Math.cos(a)*distance/steps,y=z.y+Math.sin(a)*distance/steps;
     if(!canStand(b,x,y,z.radius*.78))continue;const v=Math.hypot(x-target.x,y-target.y);if(v<score){move={x,y};score=v;}}
    if(move){z.x=move.x;z.y=move.y;}
   }
  }
  function update(z,dt){let c=record(z);if(!active()||!Number.isFinite(dt)||dt<=0)return !!c;dt=Math.min(dt,R.step);
   if(!c){if(!['runner','crawler'].includes(z.kind)||records().length>=Q.maxClimbers)return false;const claim=claims.get(z.id);if(!claim)return false;
    const {b,a}=claim,p=pile(b.id,a.side);if(!live(b)||!b.completed||!p||p.height+Q.reach<R.bases[b.type].height)return false;
    const current=approach(b,z);if(!current||current.side!==a.side)return false;
    c={id:z.id,site:b.id,side:current.side,lane:current.lane,start:current.start,progress:0,stage:'climb',fallHeight:0};const end=S.climbPoint(b,{...c,progress:1});
    if(!canStand(b,end.x*R.tile,end.y*R.tile,z.radius*.78))return false;records().push(c);h.notice('La horde atteint le chemin de ronde !');
   }
   const b=h.building(c.site);if(!live(b)){forget(z.id);g.killZombie(z,false);return true;}
   if(c.stage==='roof'){roof(z,c,b,dt);return true;}
   const height=R.bases[b.type].height,pressure=pile(b.id,c.side);
   if(c.stage==='climb'&&((b.def.gate&&b.gateMode==='open')||!pressure||pressure.height+Q.reach<S.climbPoint(b,c).z)){c.fallHeight=S.climbPoint(b,c).z;c.stage='fall';}
   if(c.stage==='fall'){c.progress=Math.max(0,c.progress-Q.fallSpeed*dt/height);}
   else c.progress=Math.min(1,c.progress+Q.climbSpeed*dt/height*(z.stagger>0?.35:1));
   const p=S.climbPoint(b,c);z.x=p.x*R.tile;z.y=p.y*R.tile;z.lastX=z.x;z.lastY=z.y;z.stuck=0;
   if(c.stage==='fall'&&c.progress===0){forget(z.id);z.health-=c.fallHeight*Q.fallDamagePerMetre;if(z.health<=0)g.killZombie(z,false);else z.stagger=Math.max(z.stagger,1);return true;}
   if(c.progress===1){if(canStand(b,z.x,z.y,z.radius*.78))c.stage='roof';else{c.fallHeight=height;c.stage='fall';}}
   return true;
  }
  function reset(){piles=[];claims.clear();clock=0;}
  function canMelee(a,b){const az=a===g.player?h.pose().z:enemyPose(a).z,bz=b===g.player?h.pose().z:enemyPose(b).z;if(Math.abs(az-bz)>Q.meleeReach)return false;
   return line({x:a.x/R.tile,y:a.y/R.tile,z:az+.8},{x:b.x/R.tile,y:b.y/R.tile,z:bz+.8});
  }
  return Object.freeze({prepare,update,enemyPose,forget,removeSupport,reset,canMelee,pressure:()=>piles.map(p=>({...p}))});
 }
 const api={create};root.DeadwallVerticalSiege176=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
