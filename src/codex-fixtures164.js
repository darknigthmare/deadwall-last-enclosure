/* Optional detail13: actual washrooms and explicitly owned care supports.
 * Fixtures add no loot, plumbing, medicine or service; those owners stay intact. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexFixtures164=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const REVISION=13;
 const normal=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const rect=o=>o&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0;
 const hit=(a,b,gap=0)=>a.x<b.x+b.w+gap&&a.x+a.w>b.x-gap&&a.y<b.y+b.h+gap&&a.y+a.h>b.y-gap;
 const owns=(room,o)=>rect(o)&&o.x+o.w/2>=room.x&&o.y+o.h/2>=room.y&&o.x+o.w/2<room.x+room.w&&o.y+o.h/2<room.y+room.h;
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 function careStyle(kind){return kind==='bed'?'careBed':kind==='shelf'||kind==='medical'?'medicalShelf':kind==='bench'?'firstAidRoll':'treatmentTray';}
 function servicePoints(o){
  const f=o?.front160;if(!rect(f))return [];
  // Sample across the fixture's facing width, never down the clearance strip:
  // a narrow WC has more clearance depth than seat width.
  return [0.25,0.5,0.75].map(t=>Math.round((o.angle160||0)/(Math.PI/2))%2? [f.x+f.w/2,f.y+f.h*t]:[f.x+f.w*t,f.y+f.h/2]);
 }
 function annotatePlan({plan,detailVersion=0}){
  if(detailVersion<REVISION||plan?.fixtures164?.revision===REVISION)return plan;
  if(!Array.isArray(plan?.objects))throw Error('Plan de supports164 invalide.');
  const supports=new Map((plan.operations160||[]).filter(op=>op.kind==='medicalCare'&&typeof op.supportId==='string').map(op=>[op.supportId,op.key]));
  const objects=plan.objects.map(o=>supports.has(o.id)?Object.freeze({...o,fixture164:Object.freeze({revision:REVISION,kind:careStyle(o.kind),operationKey:supports.get(o.id),scope:'presentation-of-existing-paid-care-support'})}):o);
  return Object.freeze({...plan,objects:Object.freeze(objects),fixtures164:Object.freeze({revision:REVISION,careSupports:objects.filter(o=>o.fixture164).length})});
 }
 function requestedKind(source,existing,z){
  if(!source||source.exterior||source.levels&&!source.levels.includes(z))return null;
  const name=normal(source.name),excluded=/\b(outils|modules?|cartons?|coffrets?|lots?|emballages|appareils|preparation|inspection|demontes|deposes|reconditionnement|prototype\w*|essais?|simulation)\b/;
  if(excluded.test(name)||!(/\b(wc|toilettes?|latrines?|sanitaires?)\b/.test(name)||/\bsalle de bain\b/.test(name)))return null;
  const U=root.DeadwallCodexUsage163||(typeof require==='function'?require('./codex-usage163.js'):null);
  const authored=U.kinds(source),physical=existing.filter(o=>['sink','shower','toilet','latrine'].includes(o.kind));
  if(/\blatrines?\b/.test(name)&&authored.includes('latrine'))return 'latrine';
  if(U.classify({...source,props:[...(source.props||[]),...physical.map(o=>({kind:o.kind}))]})?.id!=='bathroom')return null;
  return /\blatrines?\b/.test(name)?'latrine':'toilet';
 }
 function enrich({seed,p,z=0,plan,detail,description,geometry:G,recipes:Q,detailVersion=0,rules:givenRules}){
  if(detailVersion<REVISION||detail?.fixtures164?.revision===REVISION)return detail;
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),rules=givenRules||C?.CodexFixtures164Rules;
  const A=root.DeadwallCodexAnchors160||(typeof require==='function'?require('./codex-anchors160.js'):null),D=root.DeadwallCodexDensity163||(typeof require==='function'?require('./codex-density163.js'):null),Art=root.DeadwallSeedDetailArt157||(typeof require==='function'?require('./seed-detail-art157.js'):null);
  if(rules?.revision!==REVISION||!G||!Q||!A||!D||!Art?.presentationFor||!Number.isInteger(seed)||seed<0||seed>4294967295||!p?.id||!Number.isFinite(p.w+p.h)||p.w<=0||p.h<=0||!p.levels?.includes(z)||!Array.isArray(description?.rooms)||!['rooms','walls','stairs','objects'].every(k=>Array.isArray(plan?.[k]))||!Array.isArray(detail?.interior)||!Array.isArray(detail.outdoor))throw Error('Contrat de sanitaires164 invalide.');
  const budgets=['maxPerSite','maxPerFloor','maxPerRoom','maxCandidates','maxGridAudits'];
  if(budgets.some(k=>!Number.isSafeInteger(rules[k])||rules[k]<1)||rules.maxGridAudits<2||![rules.clearance,rules.collisionGap,rules.roomTolerance,rules.minRoomArea].every(v=>Number.isFinite(v)&&v>=0))throw Error('Budgets de sanitaires164 invalides.');
  const safe=D.reservations(plan,C?.ContextGeometryRules160?.terrainClearance||rules.clearance),nav={...plan,walls:[...plan.walls,...safe]};
  const previous=[...plan.objects,...detail.interior],structure=[...plan.walls,...plan.stairs,...safe],solids=[...structure,...previous.filter(o=>o.solid!==false&&!o.dressing160)];
  const oldFronts=previous.flatMap(D.fronts),added=[],requests=[],budget=D.floorBudget(p,z,rules);
  let gridAudits=0,candidateChecks=0;
  const audit=()=>{gridAudits++;return Q.accessGrid(p,z,nav,detail,added);};
  const base=audit(),keep=Q.anchorCells(p,z,nav,base);
  for(const front of oldFronts)for(const[x,y]of D.samples(front)){const i=base?.at(x,y);if(i>=0&&base.reachable[i])keep.push(i);}
  if(!base?.baseline)return finish(false,'baseline-inaccessible');
  for(const[index,room]of plan.rooms.entries()){
   const existing=previous.filter(o=>owns(room,o)),sources=description.rooms.filter(source=>normal(source.name)===normal(room.name)&&!source.exterior&&(!source.levels||source.levels.includes(z))),kinds=sources.map(source=>requestedKind(source,existing,z));
   const kind=kinds.length&&kinds.every(k=>k===kinds[0])?kinds[0]:null;if(!kind)continue;
   const request={room:index,name:room.name,kind,added:0,reason:'space-or-access',sourceMinimum:null};requests.push(request);
   if(!Art.presentationFor(kind)){request.reason='unrendered-fixture';continue;}
   if(existing.some(o=>['toilet','latrine'].includes(o.kind))){request.reason='already-present';continue;}
   if(room.w*room.h<rules.minRoomArea){request.reason='room-too-small';continue;}
   if(added.length>=budget){request.reason='site-or-floor-capacity';continue;}
   const shape=rules.shapes?.[kind];if(!Array.isArray(shape)||!shape.every(v=>Number.isFinite(v)&&v>0)||shape.length!==2)throw Error('Emprise de sanitaire164 invalide.');
   const walls=A.supportedWalls(room,plan.walls),offset=walls.length?G.hash(seed,p.id,z,index,'fixtures164')%walls.length:0;
   let chosen=null,attempts=0;
   search:for(let n=0;n<rules.maxCandidates&&!chosen;n++)for(let wi=0;wi<walls.length&&!chosen;wi++){
    if(++attempts>rules.maxCandidates)break search;candidateChecks++;
    const fraction=(G.hash(seed,p.id,z,index,n,'fixtures164-slot')%1001)/1000,pose=A.pose(walls[(wi+offset)%walls.length],room,shape[0],shape[1],fraction,rules.clearance);
    if(!pose)continue;
    if(pose.x<room.x-rules.roomTolerance||pose.y<room.y-rules.roomTolerance||pose.x+pose.w>room.x+room.w+rules.roomTolerance||pose.y+pose.h>room.y+room.h+rules.roomTolerance)continue;
    if([...solids,...added].some(o=>hit(pose,o,rules.collisionGap)||hit(pose.front160,o,rules.collisionGap))||[...oldFronts,...added.flatMap(D.fronts)].some(o=>hit(pose,o,rules.collisionGap)))continue;
    if(gridAudits>=rules.maxGridAudits-1){request.reason='navigation-budget';break search;}
    const item=freeze({...pose,id:p.id+':fixture164:'+z+':'+index+':'+kind,kind,z,solid:true,surface:false,decor157:true,anchored160:true,room:room.name,room164:index,fixture164:{revision:REVISION,kind,scope:'derived-personal-washroom-fixture'},utilityConnected164:false,quantitySource164:'derived-use-not-author-minimum'});
    added.push(item);const next=audit();
    if(next?.baseline&&keep.every(i=>next.reachable[i])&&added.every(o=>servicePoints(o).every(([x,y])=>{const i=next.at(x,y);return i>=0&&next.reachable[i];}))){chosen=item;request.added++;request.reason='fixture-present';}
    else added.pop();
   }
  }
  const final=audit(),checked=!!final?.baseline&&keep.every(i=>final.reachable[i])&&added.every(o=>servicePoints(o).every(([x,y])=>{const i=final.at(x,y);return i>=0&&final.reachable[i];}));
  if(!checked)throw Error('Circulation de sanitaires164 invalidée.');return finish(true,null);
  function finish(navigationChecked,reason){
   const interior=Object.freeze([...detail.interior,...added]);
   return Object.freeze({...detail,interior,...(detail.colliders160?{colliders160:Object.freeze({...detail.colliders160,interior:Object.freeze(interior.filter(o=>o.solid))})}:{}),fixtures164:freeze({revision:REVISION,added:added.length,navigationChecked,requests,budget,candidateChecks,gridAudits,maxGridAudits:rules.maxGridAudits,reason})});
  }
 }
 return Object.freeze({REVISION,careStyle,servicePoints,annotatePlan,requestedKind,enrich});
});
