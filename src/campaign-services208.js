/* Fixed furniture supports for paid G11 services. This module reads geometry;
 * survival/context owners still own permission, work, payment and effects. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCampaignServices208=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const dependency=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const rules=()=>dependency('DeadwallCore','./core.js').CampaignServices208Rules;
 const geometry=()=>dependency('DeadwallFrontierGeometry','./frontier-geometry.js');
 const adapter=()=>dependency('DeadwallCodexCampaign205','./codex-campaign205.js');
 const cache=new WeakMap();
 const finiteRect=r=>!!r&&['x','y','w','h'].every(k=>Number.isFinite(r[k]))&&r.w>0&&r.h>0;
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 const sameProvenance=(a,b)=>!!a&&!!b&&['version','typology','variant','authorPlanId'].every(k=>a[k]===b[k]);
 function site(p){
  if(!p||p.generation!==rules().generation||!/^P\d{4}$/.test(p.id)||!finiteRect(p)||!Number.isFinite(p.a))return false;
  const id=adapter().identity(p.type),v=p.campaign205;
  return !!id&&v?.version===1&&v.typology===id.typology&&v.variant===id.number&&v.authorPlanId===id.typology+'-V'+String(id.number).padStart(2,'0');
 }
 function supportsFor(p,plan,details){
  if(!site(p)||!sameProvenance(p.campaign205,plan?.campaign205)||!sameProvenance(p.campaign205,details?.campaign205)||!Array.isArray(plan.objects)||!Array.isArray(details.interior))return Object.freeze([]);
  const result=[],seen=new Set(),R=rules(),G=geometry();
  for(const o of [...plan.objects,...details.interior]){
   if(!o||o.campaign205!==true||o.solid!==true||o.level!==0||!finiteRect(o)||!finiteRect(o.access)||typeof o.id!=='string'||!o.id.startsWith(p.id+':0:')||!/^\d+$/.test(o.id.slice((p.id+':0:').length))||seen.has(o.id))continue;
   seen.add(o.id);
   const a=o.access;if(a.w<R.actorRadius*2||a.h<R.actorRadius*2||a.x<0||a.y<0||a.x+a.w>p.w||a.y+a.h>p.h)continue;
   const local={x:a.x+a.w/2,y:a.y+a.h/2},work={x:Math.max(o.x,Math.min(o.x+o.w,local.x)),y:Math.max(o.y,Math.min(o.y+o.h,local.y))};
   for(const [action,kinds]of Object.entries(R.supports)){
    if(!kinds.includes(o.kind)||action==='medicalCare'&&!R.medicalTypes.includes(p.campaign205.typology))continue;
    result.push(freeze({siteId:p.id,supportId:o.id,action,supportKind:o.kind,supportLabel:o.name||o.kind,
     anchor:{...G.global(p,local.x,local.y),z:0},workTarget:{...G.global(p,work.x,work.y),z:0},
     room:o.room||o.roomId||'Pièce du site',roomId:o.roomId,siteName:p.name||p.id}));
   }
  }
  return Object.freeze(result.sort((a,b)=>a.supportId.localeCompare(b.supportId)||a.action.localeCompare(b.action)));
 }
 function state(world){let value=cache.get(world);if(!value){value={plans:new Map()};cache.set(world,value);}return value;}
 function descriptors(world,p){
  const s=state(world),plan=world.plan(p,0),details=world.detailAt(p,0),signature=[p.x,p.y,p.a,p.w,p.h,p.type,...Object.values(p.campaign205||{})].join(':'),prior=s.plans.get(p.id);
  if(prior?.p===p&&prior.plan===plan&&prior.details===details&&prior.signature===signature)return prior.supports;
  const supports=supportsFor(p,plan,details);s.plans.delete(p.id);s.plans.set(p.id,{p,plan,details,signature,supports});
  if(s.plans.size>rules().planCache)s.plans.delete(s.plans.keys().next().value);
  return supports;
 }
 function available(world,pose){return !!world&&world.generation===rules().generation&&Array.isArray(world.pois)&&typeof world.plan==='function'&&typeof world.detailAt==='function'&&pose?.active===true&&pose.generation===rules().generation&&Number.isFinite(pose.x)&&Number.isFinite(pose.y);}
 const refused=(reason,support)=>freeze({...support,ok:false,reason});
 function resolve(world,pose,request,discoveries,options={}){
  if(!available(world,pose))return refused('Rejoignez à pied un équipement résidentiel G11.');
  if(!request||!Object.hasOwn(rules().supports,request.action)||typeof request.siteId!=='string'||typeof request.supportId!=='string')return refused('Équipement ou service inconnu.');
  const p=world.pois.find(p=>p.id===request.siteId),support=site(p)&&descriptors(world,p).find(o=>o.supportId===request.supportId&&o.action===request.action);
  if(!support)return refused('Ce lieu ne possède pas ce support de service.');
  if(!Array.isArray(discoveries)||!discoveries.includes(p.id))return refused('Repérez ce site sur place avant de l’utiliser.',support);
  if(typeof options.structureDestroyed!=='function')return refused('État du support indisponible.',support);
  if(options.structureDestroyed(p.id))return refused('Le bâtiment support a été détruit.',support);
  if(pose.car?.driving||pose.z!==0)return refused('Rejoignez à pied le point de service au rez-de-chaussée.',support);
  const R=rules(),anchor=support.anchor;
  if(Math.hypot(pose.x-anchor.x,pose.y-anchor.y)>R.reach)return refused('Approchez du point de service du meuble.',support);
  if(typeof world.blocked!=='function'||typeof world.line!=='function'||typeof world.movementLine!=='function'||
   world.blocked(pose.x,pose.y,R.actorRadius,0,pose.inside)||world.blocked(anchor.x,anchor.y,R.actorRadius,0,pose.inside)||
   !world.line(pose,anchor,0,pose.inside,null,.05)||!world.movementLine(pose,anchor,0,pose.inside,null,R.actorRadius)||
   !world.movementLine(anchor,support.workTarget,0,pose.inside,support.supportId,R.actorRadius))return refused('Le passage ou le geste vers ce support est bloqué.',support);
  if(request.action==='restSheltered'){
   const local=geometry().local(p,pose.x,pose.y),target=geometry().local(p,anchor.x,anchor.y),volumes=world.plan(p,0).volumes160||[],contains=(b,q)=>q.x>b.x&&q.y>b.y&&q.x<b.x+b.w&&q.y<b.y+b.h;
   if(typeof world.coveredAt205!=='function'||world.coveredAt205(pose.x,pose.y,0,pose.inside)!==true||!volumes.some(b=>contains(b,local)&&contains(b,target)))return refused('La relève demande un couchage et une place réellement abrités.',support);
  }
  return freeze({...support,ok:true});
 }
 function distance(p,point){const q=geometry().local(p,point.x,point.y);return Math.hypot(Math.max(0,-q.x,q.x-p.w),Math.max(0,-q.y,q.y-p.h));}
 function list(world,pose,discoveries,options={}){
  if(!available(world,pose))return Object.freeze([]);
  const R=rules(),seen=new Set(Array.isArray(discoveries)?discoveries:[]),candidates=typeof world.nearPOI==='function'?world.nearPOI(pose.x,pose.y,R.nearbyRadius):world.pois,
   sites=candidates.filter(p=>site(p)&&world.pois.includes(p)&&seen.has(p.id)&&distance(p,pose)<=R.nearbyRadius)
   .sort((a,b)=>distance(a,pose)-distance(b,pose)||a.id.localeCompare(b.id)).slice(0,R.maxSites),offered=[];
  for(const p of sites)for(const support of descriptors(world,p))if((!options.action||support.action===options.action)&&Math.hypot(support.anchor.x-pose.x,support.anchor.y-pose.y)<=R.nearbyRadius)offered.push(support);
  return Object.freeze(offered.sort((a,b)=>Math.hypot(a.anchor.x-pose.x,a.anchor.y-pose.y)-Math.hypot(b.anchor.x-pose.x,b.anchor.y-pose.y)||a.supportId.localeCompare(b.supportId)||a.action.localeCompare(b.action))
   .slice(0,R.maxActions).map(support=>resolve(world,pose,support,discoveries,options)));
 }
 return Object.freeze({version:1,supportsFor,list,resolve});
});
