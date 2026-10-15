/* Optional revision 12. Composition uses actual free space and existing props;
 * no source container, previous detail, resource or utility is changed. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexDensity163=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const normal=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 const serviceIndices=(o,grid)=>fronts(o).flatMap(f=>samples(f).map(([x,y])=>grid.at(x,y))).filter(index=>index>=0);
 const rect=o=>o&&Number.isFinite(o.x+o.y+o.w+o.h)&&o.w>0&&o.h>0;
 const hit=(a,b,gap=0)=>a.x<b.x+b.w+gap&&a.x+a.w>b.x-gap&&a.y<b.y+b.h+gap&&a.y+a.h>b.y-gap;
 const inside=(o,r,margin=0)=>o.x>=r.x+margin&&o.y>=r.y+margin&&o.x+o.w<=r.x+r.w-margin&&o.y+o.h<=r.y+r.h-margin;
 const owns=(r,o)=>o.x+o.w/2>=r.x&&o.y+o.h/2>=r.y&&o.x+o.w/2<r.x+r.w&&o.y+o.h/2<r.y+r.h;
 function fronts(o){
  const values=[o.front160,o.access165];
  for(const key of ['service173','service171','service170','fronts169','service163'])values.push(...(Array.isArray(o[key])?o[key]:[o[key]]));
  return values.filter(rect);
 }
 function samples(r){return [[r.x+r.w/2,r.y+r.h/2],...(r.w>=r.h?[[r.x+r.w*.25,r.y+r.h/2],[r.x+r.w*.75,r.y+r.h/2]]:[[r.x+r.w/2,r.y+r.h*.25],[r.x+r.w/2,r.y+r.h*.75]])];}

 // Union avoids subtracting the same wall, reservation or overlapping historic
 // object twice. These are planar footprints, not a claim about 3D capacity.
 function unionArea(room,obstacles){
  const boxes=obstacles.filter(rect).map(o=>({x:Math.max(room.x,o.x),y:Math.max(room.y,o.y),right:Math.min(room.x+room.w,o.x+o.w),bottom:Math.min(room.y+room.h,o.y+o.h)})).filter(o=>o.right>o.x&&o.bottom>o.y);
  const xs=[...new Set(boxes.flatMap(o=>[o.x,o.right]))].sort((a,b)=>a-b);let area=0;
  for(let i=1;i<xs.length;i++){
   const intervals=boxes.filter(o=>o.x<xs[i]&&o.right>xs[i-1]).map(o=>[o.y,o.bottom]).sort((a,b)=>a[0]-b[0]);
   let length=0,lo=null,hi=null;
   for(const [a,b]of intervals){if(lo===null){lo=a;hi=b;}else if(a<=hi)hi=Math.max(hi,b);else{length+=hi-lo;lo=a;hi=b;}}
   if(lo!==null)length+=hi-lo;area+=(xs[i]-xs[i-1])*length;
  }
  return area;
 }
 function floorBudget(p,z,rules){
  const levels=[...new Set(p.levels)].sort((a,b)=>a-b),index=levels.indexOf(z);
  return Math.min(rules.maxPerFloor,Math.floor(rules.maxPerSite/levels.length)+(index<rules.maxPerSite%levels.length?1:0));
 }
 function reservations(plan,clearance){
  const result=[...(plan.movement160||[]),...(plan.gates160||[]),...(plan.terrain160||[]).filter(o=>o.blocked)].filter(o=>!o.vehicleOnly&&rect(o)).map(o=>({...o}));
  const supports=[...plan.objects,...(plan.visuals160||[]),...(plan.movement160||[]),...(plan.gates160||[])];
  for(const operation of plan.operations160||[]){
   const a=operation.anchor,s=supports.find(o=>o.id===operation.supportId),b=s?{x:s.x+s.w/2,y:s.y+s.h/2}:a;
   if(!a||!b||!Number.isFinite(a.x+a.y+b.x+b.y))continue;
   result.push({x:Math.min(a.x,b.x)-clearance,y:Math.min(a.y,b.y)-clearance,w:Math.abs(a.x-b.x)+2*clearance,h:Math.abs(a.y-b.y)+2*clearance});
  }
  return result;
 }
 function wallFractions(s,room,width,obstacles,rules,edgeMargin){
  const vertical=s.side==='west'||s.side==='east',wall=s.wall;
  const lo=Math.max(vertical?room.y:room.x,vertical?wall.y:wall.x)+edgeMargin;
  const hi=Math.min(vertical?room.y+room.h:room.x+room.w,vertical?wall.y+wall.h:wall.x+wall.w)-edgeMargin-width;
  if(hi<lo)return [];if(hi===lo)return [0];
  const values=[lo,hi,(lo+hi)/2];
  for(const o of obstacles)values.push((vertical?o.y:o.x)-rules.gap-width,(vertical?o.y+o.h:o.x+o.w)+rules.gap);
  for(let i=0;i<rules.wallSamples;i++)values.push(lo+(hi-lo)*i/(rules.wallSamples-1));
  return [...new Set(values.filter(v=>v>=lo&&v<=hi).map(v=>Math.round((v-lo)/(hi-lo)*1e7)/1e7))];
 }
 function rasterCoordinates(p,z,Q,cells){
  const layout=Q.gridLayout?.(p,z);if(!layout)return [];
  const {cell,left,top,cols}=layout;
  return [...new Set(cells)].map(index=>({x:left+(index%cols+.5)*cell,y:top+(Math.floor(index/cols)+.5)*cell}));
 }
 function coversCell(pose,point,radius){return point.x>pose.x-radius+1e-8&&point.x<pose.x+pose.w+radius-1e-8&&point.y>pose.y-radius+1e-8&&point.y<pose.y+pose.h+radius-1e-8;}
 function islandPose(room,width,depth,ix,iy,turn,steps,clearance,margin){
  const w=turn%2?depth:width,h=turn%2?width:depth,spaceX=room.w-2*margin-w,spaceY=room.h-2*margin-h;
  if(spaceX<0||spaceY<0)return null;
  const x=room.x+margin+spaceX*(ix+1)/(steps+1),y=room.y+margin+spaceY*(iy+1)/(steps+1);
  const front160=turn===0?{x,y:y+h,w,h:clearance}:turn===1?{x:x-clearance,y,w:clearance,h}:turn===2?{x,y:y-clearance,w,h:clearance}:{x:x+w,y,w:clearance,h};
  return {x,y,w,h,front160,angle160:turn*Math.PI/2,spriteWidth160:width,spriteHeight160:depth};
 }
 function enrich({seed,p,z=0,plan,detail,description,geometry:G,recipes:Q,rules:givenRules,classify:givenClassifier,shapeFor,reserved=[]}){
  if(p?.context160?.profile)return detail;
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),rules=givenRules||C?.CodexDensity163Rules;
  const A=root.DeadwallCodexAnchors160||(typeof require==='function'?require('./codex-anchors160.js'):null);
  const D=root.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null);
  const Art=root.DeadwallSeedDetailArt157||(typeof require==='function'?require('./seed-detail-art157.js'):null);
  const U=givenClassifier?null:root.DeadwallCodexUsage163||(typeof require==='function'?require('./codex-usage163.js'):null),classify=givenClassifier||U?.classify;
  if(!rules||rules.revision!==12||!A||!D||!Art?.presentationFor||!G||!Q||typeof classify!=='function'||!Number.isInteger(seed)||seed<0||seed>4294967295||!p?.id||!p.levels?.includes(z)||!/^DW-\d{4}$/.test(description?.id||'')||!['rooms','walls','stairs','objects'].every(k=>Array.isArray(plan?.[k]))||!Array.isArray(detail?.interior)||!Array.isArray(detail.outdoor)||!Array.isArray(description.rooms)||!Array.isArray(reserved))throw Error('Contrat de densité163 invalide.');
  if(!Number.isFinite(p.w+p.h)||p.w<=0||p.h<=0||!['maxPerSite','maxPerFloor','maxPerRoom','maxPerKind','maxPasses','maxCandidates','islandSteps'].every(key=>Number.isSafeInteger(rules[key])&&rules[key]>0)||!Number.isSafeInteger(rules.wallSamples)||rules.wallSamples<2||!Number.isSafeInteger(rules.maxGridAudits)||rules.maxGridAudits<2)throw Error('Budgets de densité163 invalides.');
  if(detail.density163?.revision===rules.revision)return detail;
  const safe=reservations(plan,C?.ContextGeometryRules160?.terrainClearance||rules.clearance).concat(reserved).filter(rect);
  const navPlan=safe.length?{...plan,walls:[...plan.walls,...safe]}:plan;
  const placementReservations=detail.interior.filter(o=>o.placementOnly162);
  const previous=[...plan.objects,...detail.interior.filter(o=>o.solid&&!o.dressing160&&!o.placementOnly162)],structure=[...plan.walls,...plan.stairs,...safe,...placementReservations],obstacles=[...structure,...previous];
  const oldFronts=[...plan.objects,...detail.interior,...(z===0?[...(p.outdoor||[]),...detail.outdoor]:[])].flatMap(fronts);
  const added=[],requests=[],jobs=[],budget=floorBudget(p,z,rules),candidateBudget=rules.maxCandidates*budget;
  let gridAudits=0,candidateChecks=0;
  const audit=items=>{gridAudits++;return Q.accessGrid(p,z,navPlan,detail,items);};
  const base=audit([]),keep=Q.anchorCells(p,z,navPlan,base);let currentGrid=base;
  for(const f of oldFronts)for(const [x,y]of samples(f)){const i=base?.at(x,y);if(i>=0&&base.reachable[i])keep.push(i);}
  const protectedCells=rasterCoordinates(p,z,Q,keep),rasterRadius=Q.RULES?.radius||0;
  for(const [index,room]of plan.rooms.entries()){
   const candidates=description.rooms.filter(s=>normal(s.name)===normal(room.name)&&!s.exterior&&(!s.levels||s.levels.includes(z)));
   const classified=candidates.map(source=>({source,role:classify(source,{family:description.family,programmeName:description.name})})).filter(value=>value.role);
   const roles=new Set(classified.map(value=>value.role.id)),match=roles.size===1&&classified.length===candidates.length?classified[0]:null,profile=match&&rules.profiles[match.role.id];
   const existing=previous.filter(o=>rect(o)&&owns(room,o)),area=room.w*room.h,usableArea=Math.max(0,area-unionArea(room,structure)),freeArea=Math.max(0,area-unionArea(room,obstacles)),footprint=unionArea(room,existing);
   const request={room:index,name:room.name,usage:match?.role.id||null,confidence:match?.role.confidence||null,area,usableArea,freeArea,existing:existing.length,existingFootprint:footprint,derivedTarget:0,sourceMinimum:null,added:0,unplaced:0,reason:profile?'already-present':candidates.length?'usage-unresolved':'source-room-unresolved'};requests.push(request);
   if(!profile)continue;
   if(usableArea<rules.minRoomArea||freeArea<rules.areaPerAddition){request.reason='room-too-small';continue;}
   const target=Math.min(profile.maxItems,rules.maxPerRoom,Math.ceil(usableArea/profile.areaPerItem));
   request.derivedTarget=target;
   if(footprint>=usableArea*profile.targetCoverage){request.reason='existing-footprint-sufficient';continue;}
   request.unplaced=Math.max(0,target-existing.length);
   const limit=Math.min(rules.maxPerRoom,Math.floor(freeArea/rules.areaPerAddition),usableArea<=rules.smallRoomArea?rules.smallRoomMax:rules.maxPerRoom);
   if(request.unplaced&&limit>0)jobs.push({room,index,source:match.source,profile,request,limit,exhausted:new Set()});
  }
  if(!base?.baseline)return finish(false,'baseline-inaccessible');
  let stopped=null;
  outer:for(let pass=0;pass<rules.maxPasses&&added.length<budget;pass++){
   let progress=false;
   for(const job of jobs){
    const {room,index,source,profile,request}=job,current=[...previous,...added].filter(o=>rect(o)&&owns(room,o)),local=added.filter(o=>o.room163===index);
    if(!request.unplaced)continue;
    if(local.length>=job.limit){request.reason='room-capacity';continue;}
    if(unionArea(room,current)>=request.usableArea*profile.targetCoverage){request.reason='footprint-capacity';continue;}
    const kinds=[...new Set(profile.kinds)].filter(kind=>!job.exhausted.has(kind)).map((kind,order)=>({kind,order,count:current.filter(o=>o.kind===kind).length})).filter(value=>value.count<rules.maxPerKind).sort((a,b)=>a.count-b.count||a.order-b.order);
    let chosen=null,chosenGrid=null;
    for(const {kind}of kinds){
     if(!Art.presentationFor(kind)){(request.unsupportedKinds||(request.unsupportedKinds=[])).push(kind);job.exhausted.add(kind);continue;}
     const shape=shapeFor?.(kind,source)||G.SHAPES[kind]||D.objects[kind],width=Array.isArray(shape)?shape[0]:shape?.w,depth=Array.isArray(shape)?shape[1]:shape?.h;
     if(!Number.isFinite(width+depth)||width<=0||depth<=0){job.exhausted.add(kind);continue;}
     const clearance=Math.max(rules.minimumClearance,Math.min(rules.maxClearance,rules.clearance));
     const supports=A.supportedWalls(room,plan.walls),start=supports.length?G.hash(seed,p.id,z,index,kind,'density163')%supports.length:0,wallPoses=[],islandPoses=[];
     for(let i=0;i<supports.length;i++){
      const support=supports[(start+i)%supports.length];
      for(const fraction of wallFractions(support,room,width,[...obstacles,...added],rules,A.RULES.edgeMargin)){const pose=A.pose(support,room,width,depth,fraction,clearance);if(pose)wallPoses.push({...pose,placement163:'wall'});}
     }
     if(profile.islands){
      const steps=rules.islandSteps,offset=G.hash(seed,p.id,z,index,kind,'density163-island')%(steps*steps),turn=G.hash(seed,p.id,z,index,kind,'density163-turn')%4;
      for(let n=0;n<steps*steps;n++){const cell=(n+offset)%(steps*steps),pose=islandPose(room,width,depth,cell%steps,Math.floor(cell/steps),turn,steps,clearance,rules.roomMargin);if(pose)islandPoses.push({...pose,placement163:'island'});}
     }
     // Alternate the preferred placement, while giving both wall and island
     // candidates a share of the bounded search even in a long warehouse.
     const first=profile.islands&&request.added%2===1?islandPoses:wallPoses,second=first===wallPoses?islandPoses:wallPoses,poses=[];
     for(let i=0;poses.length<rules.maxCandidates&&(i<first.length||i<second.length);i++){if(i<first.length)poses.push(first[i]);if(i<second.length&&poses.length<rules.maxCandidates)poses.push(second[i]);}
     let attempts=0;
     for(const pose of poses){
      if(++attempts>rules.maxCandidates)break;
      if(candidateChecks>=candidateBudget){stopped='candidate-budget';break outer;}candidateChecks++;
      if(!owns(room,pose)||!inside(pose,room,-rules.roomEnvelopeTolerance)||!inside(pose.front160,room,rules.roomMargin))continue;
      if([...obstacles,...added].some(o=>hit(pose,o,rules.collisionGap)||hit(pose.front160,o,rules.collisionGap)))continue;
      if([...oldFronts,...added.flatMap(fronts)].some(front=>hit(pose,front,rules.collisionGap)))continue;
      if(unionArea(room,[...current,pose])>request.usableArea*profile.targetCoverage)continue;
      // Adding a solid cannot reopen a blocked cell. Reject those impossible
      // candidates before the expensive flood fill, using its actual raster.
      const newServiceCells=samples(pose.front160).map(([x,y])=>currentGrid.at(x,y));
      if(newServiceCells.some(index=>index<0||!currentGrid.reachable[index]))continue;
      if(protectedCells.some(point=>coversCell(pose,point,rasterRadius)))continue;
      if(rasterCoordinates(p,z,Q,newServiceCells).some(point=>coversCell(pose,point,rasterRadius)))continue;
      if(gridAudits>=rules.maxGridAudits-1){stopped='navigation-budget';break outer;}
      const item={...pose,id:p.id+':density163:'+z+':'+index+':'+kind+':'+request.added,kind,z,solid:true,surface:false,decor157:true,anchored160:true,density163:true,room163:index,room:room.name,usage163:request.usage,quantitySource163:'derived-usable-area-not-author-minimum',utilityConnected163:false};
      const next=audit([...added,item]);
      if(!next?.baseline||keep.some(i=>!next.reachable[i]))continue;
      if([...added,item].some(o=>fronts(o).some(f=>samples(f).some(([x,y])=>{const i=next.at(x,y);return i<0||!next.reachable[i];}))))continue;
      chosen=freeze(item);chosenGrid=next;break;
     }
     if(chosen)break;job.exhausted.add(kind);
    }
    if(chosen){added.push(chosen);currentGrid=chosenGrid;protectedCells.push(...rasterCoordinates(p,z,Q,serviceIndices(chosen,currentGrid)));request.added++;request.unplaced--;request.reason=request.unplaced?'derived-target-partial':'derived-target-present';progress=true;}
    else request.reason=profile.kinds.every(kind=>request.unsupportedKinds?.includes(kind))?'unsupported-rendered-kind':'space-or-access';
    if(added.length>=budget){stopped='site-or-floor-capacity';break outer;}
   }
   if(!progress)break;
  }
  const final=audit(added),navigationChecked=!!final?.baseline&&keep.every(i=>final.reachable[i])&&added.every(o=>fronts(o).every(f=>samples(f).every(([x,y])=>{const i=final.at(x,y);return i>=0&&final.reachable[i];})));
  if(!navigationChecked)throw Error('Circulation de densité163 invalidée.');
  if(stopped)for(const request of requests)if(request.unplaced&&request.reason==='space-or-access')request.reason=stopped;
  return finish(true,stopped);
  function finish(navigationChecked,reason){
   const interior=Object.freeze([...detail.interior,...added]);
   return Object.freeze({...detail,interior,...(detail.colliders160?{colliders160:Object.freeze({...detail.colliders160,interior:Object.freeze(interior.filter(o=>o.solid))})}:{}),density163:freeze({revision:rules.revision,added:added.length,navigationChecked,requests,floorBudget:budget,candidateChecks,candidateBudget,gridAudits,maxGridAudits:rules.maxGridAudits,reason,scope:'derived-usable-area-not-authored-minima'})});
  }
 }
 return Object.freeze({enrich,unionArea,floorBudget,reservations,fronts,samples});
});
