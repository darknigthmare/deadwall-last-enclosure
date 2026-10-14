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
 return Object.freeze({rectangle,footprintFrame,vehicle,diagnose,assembly});
});
