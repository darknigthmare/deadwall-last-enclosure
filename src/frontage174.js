/* Correct derived access, shared by world rendering, surfaces and road guidance.
 * Historical parcel drives remain untouched for identities and scatter budgets. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallFrontage174=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
 const EPS=1e-7,point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y),level=r=>r.z??r.level??0;
 const valid=r=>r&&Number.isFinite(level(r))&&point(r.a)&&point(r.b)&&Number.isFinite(r.width)&&r.width>0&&Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>EPS;
 const cross=(x,y,u,v)=>x*v-y*u;
 function intersection(a,b,c,d){
  const x=b.x-a.x,y=b.y-a.y,u=d.x-c.x,v=d.y-c.y,den=cross(x,y,u,v);
  if(Math.abs(den)<EPS)return null;
  const t=cross(c.x-a.x,c.y-a.y,u,v)/den,s=cross(c.x-a.x,c.y-a.y,x,y)/den;
  return t>=-EPS&&t<=1+EPS&&s>=-EPS&&s<=1+EPS?{t:Math.max(0,Math.min(1,t)),s:Math.max(0,Math.min(1,s)),x:a.x+x*t,y:a.y+y*t}:null;
 }
 function segmentDistance(a,b,c,d){
  if(intersection(a,b,c,d))return 0;
  const distance=(p,u,v)=>Math.hypot(v.x-u.x,v.y-u.y)>EPS?G.nearest(p,u,v).d:Math.hypot(p.x-u.x,p.y-u.y);
  return Math.min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b));
 }
 function capsuleHitsBox(road,box,clearance=0){
  if(!valid(road)||!box||!Number.isFinite(box.x+box.y+box.w+box.h+(box.a||0))||box.w<=0||box.h<=0||!Number.isFinite(clearance)||clearance<0)return true;
  const p={x:box.x,y:box.y,w:box.w,h:box.h,a:box.a||0},a=G.local(p,road.a.x,road.a.y),b=G.local(p,road.b.x,road.b.y),rect={x:0,y:0,w:p.w,h:p.h};
  if(G.segmentRect(a,b,rect))return true;
  const corners=[{x:0,y:0},{x:p.w,y:0},{x:p.w,y:p.h},{x:0,y:p.h}],radius=road.width/2+clearance;
  return corners.some((c,i)=>segmentDistance(a,b,c,corners[(i+1)%4])<radius-EPS);
 }
 function body(drive){return{x:(drive.a.x+drive.b.x)/2,y:(drive.a.y+drive.b.y)/2,w:Math.hypot(drive.b.x-drive.a.x,drive.b.y-drive.a.y),h:drive.width,a:Math.atan2(drive.b.y-drive.a.y,drive.b.x-drive.a.x)};}
 function sameCarriageway(a,b){
  const ax=a.b.x-a.a.x,ay=a.b.y-a.a.y,bx=b.b.x-b.a.x,by=b.b.y-b.a.y;
  return level(a)===level(b)&&Math.abs(cross(ax,ay,bx,by))/(Math.hypot(ax,ay)*Math.hypot(bx,by))<1e-6&&Math.abs(cross(ax,ay,b.a.x-a.a.x,b.a.y-a.a.y))/Math.hypot(ax,ay)<.02;
 }
 function resolve(p,roads,options={}){
  const rules=root.DeadwallCore?.MetricRules174||(typeof require==='function'?require('./core.js').MetricRules174:null);
  const {clearance=rules.roadClearance,minimumJoinSine=rules.minimumJoinSine}=options;
  const fail=(reason,extra={})=>Object.freeze({ok:false,reason,site:p?.id??null,...extra});
  if(!p||!valid(p.drive)||!Array.isArray(roads)||!Number.isFinite(clearance)||clearance<0||!Number.isFinite(minimumJoinSine)||minimumJoinSine<=0||minimumJoinSine>1)return fail('invalid-source-access');
  const original=p.drive,entrance=original.b,len=Math.hypot(original.a.x-entrance.x,original.a.y-entrance.y),dx=(original.a.x-entrance.x)/len,dy=(original.a.y-entrance.y)/len;
  const candidates=roads.filter(r=>valid(r)&&level(r)===level(original)).map(r=>({road:r,join:intersection(entrance,original.a,r.a,r.b)})).filter(q=>q.join).sort((a,b)=>a.join.t-b.join.t||String(a.road.id).localeCompare(String(b.road.id)));
  // Stop at the first encountered carriageway. Never pick a more distant road
  // on the other side of an intervening public road.
  if(!candidates.length)return fail('no-centreline-join');
  const {road,join}=candidates[0];
  if(['motorway','highway','freeway','ramp'].includes(road.roadClass)||road.access==='controlled')return fail('controlled-access-road',{roadId:road.id});
  const rw=Math.hypot(road.b.x-road.a.x,road.b.y-road.a.y),sine=Math.abs(cross(dx,dy,(road.b.x-road.a.x)/rw,(road.b.y-road.a.y)/rw));
  if(sine<minimumJoinSine)return fail('shallow-join',{roadId:road.id});
  const length=join.t*len-road.width/(2*sine);
  if(length<=EPS)return fail('entrance-in-public-road',{roadId:road.id});
  const edge={x:entrance.x+dx*length,y:entrance.y+dy*length};
  const surface={id:'frontage:'+p.id,a:edge,b:{...entrance},width:original.width,z:level(original),roadClass:'frontage',lineCap:'butt',markings:false,road:road.id};
  const corridor=body(surface);
  for(const other of roads)if(valid(other)&&level(other)===level(original)&&other!==road&&!sameCarriageway(other,road)&&capsuleHitsBox(other,corridor,clearance))return fail('foreign-road-corridor',{roadId:road.id,conflict:other.id});
  const connection={...surface,a:{x:join.x,y:join.y}};
  for(const line of[surface,connection]){Object.freeze(line.a);Object.freeze(line.b);Object.freeze(line);}
  return Object.freeze({ok:true,reason:'connected',site:p.id,roadId:road.id,originalRoadId:p.road??null,surface,connection,
   corrected:Math.hypot(join.x-original.a.x,join.y-original.a.y)>.02,removedLength:Math.max(0,(1-join.t)*len),joinSine:sine});
 }
 function groupConflicts(result,p,neighbours=[]){
  if(!result?.ok)return [];
  const swept=body(result.surface),issues=[];
  for(const car of p.parking||[])if(Number.isFinite(car.x+car.y+car.w+car.h+car.a)&&G.obb(swept,car))issues.push({id:car.id,reason:'parked-vehicle'});
  for(const o of p.outdoor||[]){if(o.solid===false)continue;const q=G.global(p,o.x+o.w/2,o.y+o.h/2);if(G.obb(swept,{...q,w:o.w,h:o.h,a:p.a}))issues.push({id:o.id,reason:'outdoor-object'});}
  for(const q of neighbours){if(q.id===p.id||!q.reserve)continue;const b=q.reserve;if(G.obb(swept,{x:(b.l+b.r)/2,y:(b.t+b.b)/2,w:b.r-b.l,h:b.b-b.t,a:0}))issues.push({id:q.id,reason:'foreign-parcel-reserve'});}
  return issues;
 }

 function alternative(p,roads,neighbours=[],clear=null){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),rules=C.MetricRules175;
  if(!p||!valid(p.drive)||typeof clear!=='function')return null;
  const original=p.drive,oldLength=Math.hypot(original.a.x-original.b.x,original.a.y-original.b.y),maxLength=oldLength+rules.frontageExtraLength;
  const candidates=roads.filter(r=>valid(r)&&level(r)===level(original)).map(road=>({road,q:G.nearest(original.b,road.a,road.b)}))
   .filter(c=>c.q.d<=maxLength).sort((a,b)=>a.q.d-b.q.d||String(a.road.id).localeCompare(String(b.road.id))).slice(0,rules.frontageCandidates);
  for(const {road,q}of candidates){
   const roadLength=Math.hypot(road.b.x-road.a.x,road.b.y-road.a.y),used=new Set();
   for(const shift of rules.frontageOffsets){
    const t=Math.max(0,Math.min(1,q.t+shift/roadLength));if(used.has(t))continue;used.add(t);
    const join={x:road.a.x+(road.b.x-road.a.x)*t,y:road.a.y+(road.b.y-road.a.y)*t};
    if(Math.hypot(join.x-original.b.x,join.y-original.b.y)>maxLength)continue;
    const proxy={...p,drive:{...original,a:join}},result=resolve(proxy,roads);
    if(!result.ok||groupConflicts(result,p,neighbours).length||clear(result,p)!==true)continue;
    return Object.freeze({...result,reason:'alternative-clear-frontage',corrected:true,alternative175:true,
     removedLength:Math.max(0,oldLength-Math.hypot(result.connection.a.x-original.b.x,result.connection.a.y-original.b.y)),
     sourceConnection:Object.freeze({...original.a})});
   }
  }return null;
 }
 function createIndex(roads,pois,options={}){
  const bins=new Map(),parcelBins=new Map(),cache=new Map(),sites=new Map(pois.map(p=>[p.id,p])),size=256;let maxRadius=0;
  for(const road of roads){if(!valid(road))continue;maxRadius=Math.max(maxRadius,road.width/2);for(let y=Math.floor(Math.min(road.a.y,road.b.y)/size);y<=Math.floor(Math.max(road.a.y,road.b.y)/size);y++)for(let x=Math.floor(Math.min(road.a.x,road.b.x)/size);x<=Math.floor(Math.max(road.a.x,road.b.x)/size);x++){const key=x+','+y;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(road);}}
  for(const p of pois){const b=p.reserve;if(!b)continue;for(let y=Math.floor(b.t/size);y<=Math.floor(b.b/size);y++)for(let x=Math.floor(b.l/size);x<=Math.floor(b.r/size);x++){const key=x+','+y;if(!parcelBins.has(key))parcelBins.set(key,[]);parcelBins.get(key).push(p);}}
  function forSite(candidate){
   const p=sites.get(candidate?.id);if(!p)return null;
   if(cache.has(p.id))return cache.get(p.id);
   const d=p.drive;if(!valid(d))return resolve(p,[]);
   const rules=root.DeadwallCore?.MetricRules175||(typeof require==='function'?require('./core.js').MetricRules175:null);
   const pad=maxRadius+d.width/2+1+rules.frontageExtraLength,found=new Set();
   for(let y=Math.floor((Math.min(d.a.y,d.b.y)-pad)/size);y<=Math.floor((Math.max(d.a.y,d.b.y)+pad)/size);y++)for(let x=Math.floor((Math.min(d.a.x,d.b.x)-pad)/size);x<=Math.floor((Math.max(d.a.x,d.b.x)+pad)/size);x++)for(const r of bins.get(x+','+y)||[])found.add(r);
   let result=resolve(p,[...found]);
   if(result.ok){const box=G.bounds(body(result.surface)),near=new Set();for(let y=Math.floor(box.t/size);y<=Math.floor(box.b/size);y++)for(let x=Math.floor(box.l/size);x<=Math.floor(box.r/size);x++)for(const q of parcelBins.get(x+','+y)||[])near.add(q);
    const issues=groupConflicts(result,p,[...near]);if(issues.length)result=Object.freeze({ok:false,site:p.id,reason:'blocked-group-access',conflicts:issues});}
   if(!result.ok&&typeof options.clearAlternative==='function'){
    const radius=Math.hypot(d.a.x-d.b.x,d.a.y-d.b.y)+rules.frontageExtraLength,near=new Set();
    for(let y=Math.floor((d.b.y-radius)/size);y<=Math.floor((d.b.y+radius)/size);y++)for(let x=Math.floor((d.b.x-radius)/size);x<=Math.floor((d.b.x+radius)/size);x++)for(const q of parcelBins.get(x+','+y)||[])near.add(q);
    result=alternative(p,[...found],[...near],options.clearAlternative)||result;
   }
   cache.set(p.id,result);return result;
  }
  return Object.freeze({forSite,surface:p=>forSite(p)?.surface||null,connection:p=>sites.has(p?.id)?forSite(p)?.connection||null:p?.drive||null,
   stats:()=>({sites:sites.size,resolved:cache.size,roadBins:bins.size}),audit:()=>pois.map(p=>forSite(p))});
 }
 return Object.freeze({valid,intersection,segmentDistance,capsuleHitsBox,body,sameCarriageway,resolve,groupConflicts,alternative,createIndex});
});
