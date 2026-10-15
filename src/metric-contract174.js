/* Shared metre/support contracts. UI icons are not physical world objects. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallMetric174=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const core=()=>root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 function rectangle(r){return !!r&&['x','y','w','h'].every(k=>finite(r[k]))&&r.w>0&&r.h>0;}
 function footprintFrame(source,w,h){
  if(!Array.isArray(source)||source.length!==4||!source.every(finite)||source[0]<0||source[1]<0||source[2]<=0||source[3]<=0||!finite(w)||!finite(h)||w<=0||h<=0)return null;
  // The reviewed vehicle drawings are plan views. Map their complete source
  // footprint to the authoritative body, not into a square icon with letterboxing.
  // This is explicit XY normalization, not a perspective-height operation.
  return {source:[...source],destination:[-w/2,-h/2,w,h],projection:'ground-footprint',scaleX:w/source[2],scaleY:h/source[3]};
 }
 function vehicle(profile,{domain='region',metric=false}={}){
  if(!profile||!finite(profile.w)||!finite(profile.h)||profile.w<=0||profile.h<=0||!['local','region'].includes(domain))throw Error('Gabarit ou domaine du véhicule invalide.');
  const C=core(),units=C.Frontier.RULES.metreUnits;
  const scale=domain==='region'?1:metric?units:2*C.Expeditions.RULES.carRadius/C.WorldEvolution.RULES.vehicles.break.w;
  return {w:profile.w*scale,h:profile.h*scale,scale,metres:{length:profile.w,width:profile.h},legacyCompressed:domain==='local'&&!metric};
 }
 function diagnose({id,kind,bounds,domain='region',source=null,role='ground'}={}){
  const errors=[];if(typeof id!=='string'||!id)errors.push('missing-identity');if(!rectangle(bounds))errors.push('invalid-footprint');
  if(!['local','region'].includes(domain))errors.push('unknown-domain');if(!['ground','upright','canopy','surface'].includes(role))errors.push('unknown-role');
  const units=domain==='local'?core().Frontier.RULES.metreUnits:1;
  const metres=rectangle(bounds)?{length:bounds.w/units,width:bounds.h/units}:null;
  const reference=2*core().Frontier.RULES.footRadius;
  return {id,kind,domain,role,metres,reference:{footDiameter:reference,unit:'m'},bodyRatios:metres?{length:metres.length/reference,width:metres.width/reference}:null,
   source,errors,status:errors.length?'invalid':source?'dimensioned':'unattributed'};
 }
 function assembly(group){
  if(!group||!rectangle(group.bounds)||!Array.isArray(group.members))throw Error('Ensemble métrique invalide.');
  const ids=new Set(),issues=[],b=group.bounds,eps=core().MetricRules174.assemblyEpsilon;
  for(const item of group.members){const row=diagnose(item);issues.push(...row.errors.map(reason=>({id:item.id,reason})));
   if(ids.has(item.id))issues.push({id:item.id,reason:'duplicate-member'});ids.add(item.id);
   if(item.domain!==group.domain)issues.push({id:item.id,reason:'mixed-domains'});
   if(!rectangle(item.bounds))continue;
   const r=item.bounds,a=item.angle??0;if(!finite(a)){issues.push({id:item.id,reason:'invalid-angle'});continue;}
   const cx=r.x+r.w/2,cy=r.y+r.h/2,c=Math.cos(a),s=Math.sin(a);
   const points=[[-r.w/2,-r.h/2],[r.w/2,-r.h/2],[r.w/2,r.h/2],[-r.w/2,r.h/2]].map(([x,y])=>({x:cx+x*c-y*s,y:cy+x*s+y*c}));
   if(points.some(p=>p.x<b.x-eps||p.y<b.y-eps||p.x>b.x+b.w+eps||p.y>b.y+b.h+eps))issues.push({id:item.id,reason:'outside-reserved-assembly'});
  }
  return {id:group.id,members:group.members.length,issues,ok:issues.length===0};
 }

 // World bodies use a centre and an angle; catalogue bounds use a top-left.
 // These helpers never inspect pixels, move an owner or allocate an entity ID.
 // Transient actor bindings are not serialized. A driving commander borrows
 // the authoritative vehicle body; dismounting restores the ordinary foot disc.
 const bodyOwners175=new WeakMap();
 function bindBody175(owner,provider){
  if(!owner||typeof owner!=='object'||typeof provider!=='function')throw Error('Propriétaire physique invalide.');
  bodyOwners175.set(owner,provider);
 }
 function ownerBody175(owner){
  const provider=owner&&typeof owner==='object'?bodyOwners175.get(owner):null;
  if(!provider)return null;
  const body=provider();return bodyValid(body)?{...body}:null;
 }
 function bodyValid(b){return !!b&&['x','y','w','h','a'].every(k=>finite(b[k]))&&b.w>0&&b.h>0;}
 function bodyCorners(b){
  if(!bodyValid(b))throw Error('Corps orienté invalide.');
  const c=Math.cos(b.a),s=Math.sin(b.a);
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({x:b.x+x*b.w*c/2-y*b.h*s/2,y:b.y+x*b.w*s/2+y*b.h*c/2}));
 }
 function bodyBounds(b){const points=bodyCorners(b),xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
 function bodyDistance(b,p){
  if(!bodyValid(b)||!p||!finite(p.x)||!finite(p.y))return Infinity;
  const c=Math.cos(b.a),s=Math.sin(b.a),x=(p.x-b.x)*c+(p.y-b.y)*s,y=-(p.x-b.x)*s+(p.y-b.y)*c;
  return Math.hypot(Math.max(0,Math.abs(x)-b.w/2),Math.max(0,Math.abs(y)-b.h/2));
 }
 function bodyCircle(b,p,r=0){
  if(!bodyValid(b)||!p||!finite(p.x)||!finite(p.y)||!finite(r)||r<0)return true;
  const d=bodyDistance(b,p);return r===0?d===0:d<r-1e-7;
 }
 function bodyOverlap(a,b,clearance=0){
  if(!bodyValid(a)||!bodyValid(b)||!finite(clearance)||clearance<0)return true;
  const axes=o=>[{x:Math.cos(o.a),y:Math.sin(o.a)},{x:-Math.sin(o.a),y:Math.cos(o.a)}],aa=axes(a),bb=axes(b);
  for(const n of [...aa,...bb]){
   const radius=(o,axes)=>Math.abs(n.x*axes[0].x+n.y*axes[0].y)*(o.w/2+clearance/2)+Math.abs(n.x*axes[1].x+n.y*axes[1].y)*(o.h/2+clearance/2);
   if(Math.abs((b.x-a.x)*n.x+(b.y-a.y)*n.y)>=radius(a,aa)+radius(b,bb)-1e-7)return false;
  }return true;
 }
 function boxBody(b){
  if(b?.oriented){const o=b.oriented;return{x:o.x,y:o.y,w:o.w,h:o.h,a:o.angle??o.a??0};}
  return{x:b?.x+b?.w/2,y:b?.y+b?.h/2,w:b?.w,h:b?.h,a:0};
 }
 // Interpolate the complete rigid body, including a rotation in place. At each
 // sample, inflate it by the maximum travel of any corner before the next one.
 // This conservative swept bound catches a thin wall between two valid poses.
 function sweepBody(from,to,clear,{step=2,maxSteps=512}={}){
  if(!bodyValid(from)||!bodyValid(to)||from.w!==to.w||from.h!==to.h||typeof clear!=='function'||!finite(step)||step<=0||!Number.isSafeInteger(maxSteps)||maxSteps<1)return false;
  const angle=Math.atan2(Math.sin(to.a-from.a),Math.cos(to.a-from.a)),distance=Math.hypot(to.x-from.x,to.y-from.y),radius=Math.hypot(from.w,from.h)/2;
  const travel=distance+Math.abs(angle)*radius,steps=Math.max(1,Math.ceil(travel/step));if(steps>maxSteps)return false;
  const pad=travel/(2*steps);
  for(let i=0;i<=steps;i++){const t=i/steps,pose={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,a:from.a+angle*t,w:from.w,h:from.h};if(!clear(pose,pad))return false;}
  return true;
 }
 return Object.freeze({rectangle,footprintFrame,vehicle,diagnose,assembly,bodyValid,bodyCorners,bodyBounds,bodyDistance,bodyCircle,bodyOverlap,boxBody,sweepBody,bindBody175,ownerBody175});
});
