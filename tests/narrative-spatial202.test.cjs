'use strict';

const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),N=require('../src/narrative.js'),E=require('../src/exploration-125.js'),W=require('../src/world-content.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {bootGame}=require('./helpers/browser.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));
const descendants=node=>node.children.flatMap(child=>[child,...descendants(child)]);
const textTree=node=>[node.textContent,...node.children.map(textTree)].join(' ');

function current(seed='17117'){
  const env=bootDocument134();
  env.g.startNew('story',seed,'rearguard','classic',true);
  assert.equal(env.g.state,'playing');
  env.g.campaignIntro132.skip();env.g.togglePause(false);
  assert.equal(env.g.world.cityGeometry202,1);assert.equal(env.g.exploration125.layoutRevision,4);
  return env;
}
function route(g,point){
  return C.findFriendlyPath({x:C.grid(g.player.x),y:C.grid(g.player.y)},{x:C.grid(point.x),y:C.grid(point.y)},
    (x,y)=>!g.friendlyPositionClear(g.player,C.world(x),C.world(y)));
}
function walk(g,point){
  const path=route(g,point);assert.ok(path,'native grid route to the survey point');
  const goals=path.map(cell=>({x:C.world(cell.x),y:C.world(cell.y)}));goals.push(point);
  let steps=0;
  for(const goal of goals){
    while(C.dist(g.player,goal)>1e-6){
      assert.ok(++steps<20000,'bounded physical walk');
      const dx=goal.x-g.player.x,dy=goal.y-g.player.y,d=Math.hypot(dx,dy),travel=Math.min(4,d),boost=g.infrastructure.speed(g.player.x,g.player.y),before={x:g.player.x,y:g.player.y};
      g.moveFriendly(g.player,dx/d*travel/boost,dy/d*travel/boost);
      assert.ok(C.dist(g.player,before)>1e-7,'the actual movement owner must advance');
      assert.ok(g.friendlyPositionClear(g.player,g.player.x,g.player.y),'every physical step is standable');
    }
  }
  return steps;
}
function preserved(g){
  return clone({seed:g.world.seed,random:g.random.state,nextId:g.nextId,sites:g.world.sites,resources:g.resources,
    carry:g.player.carry,insight:g.research.insight,morale:g.morale,
    nodes:g.world.nodes.map(n=>[n.id,n.x,n.y,n.amount,n.depleted]),buildings:[...g.world.buildings.values()].map(b=>[b.id,b.type,b.gx,b.gy,b.rotation,b.progress,b.health])});
}

test('202 narrative point resolution is bounded, deterministic, pure and explicitly unavailable without free terrain',()=>{
  const site={id:'site-2',theme:'market',x:1767.75,y:3062.87},box={x:1566,y:2957,w:320,h:256},before=clone(site);
  const clear=(p,r)=>!E.circleIntersectsRect(p.x,p.y,r,box);
  const first=N.resolveSurveyPoint(site,clear),second=N.resolveSurveyPoint(clone(site),clear);
  assert.deepEqual(first,second);assert.deepEqual(site,before);
  assert.ok(first&&C.dist(first,site)<=C.NARRATIVE_RULES.surveyPointSearchRadius);
  assert.ok(clear(first,C.NARRATIVE_RULES.surveyPointClearance));
  assert.deepEqual(N.resolveSurveyPoint(site,()=>true),{x:site.x,y:site.y});
  let rejected=0;assert.equal(N.resolveSurveyPoint(site,()=>{rejected++;return false;}),null);
  assert.ok(rejected>0&&rejected<2100,'bounded search, with no fallback to the solid centre');
  for(const invalid of [null,{x:NaN,y:10},{x:10,y:Infinity}])assert.equal(N.resolveSurveyPoint(invalid,()=>true),null);
  assert.equal(N.resolveSurveyPoint(site,()=>true,10),null,'the whole standing clearance must fit inside the world');
});

test('202 survey approach checks quantized goals, physical segments and connectivity rather than just a free disc',()=>{
  const origin={x:48,y:48},size=256,box={x:92,y:64,w:4,h:32},candidate={x:65,y:80};
  const clear=(p,r)=>!E.circleIntersectsRect(p.x,p.y,r,box);
  assert.equal(clear(candidate,C.NARRATIVE_RULES.surveyPointClearance),true);
  assert.equal(clear({x:C.world(C.grid(candidate.x)),y:C.world(C.grid(candidate.y))},C.NARRATIVE_RULES.surveyPointClearance),false);
  const approach=N.createSurveyApproach(origin,clear,size);
  assert.equal(approach(candidate),false,'an obstructed native goal cell is not an approach');
  assert.equal(approach({x:48,y:112}),true);
  const barrier=(p,r)=>Math.abs(p.x-64)>=r;
  assert.equal(barrier({x:48,y:48},16),true);assert.equal(barrier({x:80,y:48},16),true);
  assert.equal(N.createSurveyApproach(origin,barrier,size)({x:80,y:48}),false,'free adjacent cell centres do not allow a segment through a wall');
  const closed=(p,r)=>!E.circleIntersectsRect(p.x,p.y,r,{x:112,y:0,w:32,h:size});
  assert.equal(closed({x:208,y:48},16),true);
  assert.equal(N.createSurveyApproach(origin,closed,size)({x:208,y:48}),false,'a disconnected free area stays unavailable');
  assert.equal(N.createSurveyApproach({x:0,y:0},()=>true,size)(origin),false,'an invalid initial access has no silent substitute');
});

test('202 native metric plans provide clear bounded survey points across deterministic seeds without changing their geometry',()=>{
  for(const seed of [0,1,2,42,17117,903145,4294967295]){
    const plan=E.createFeaturePlan(seed,C.WORLD_SIZE,4),sites=W.generate(seed).sites,index=E.createSpatialIndex(E.physicalSolids134(plan)),before=JSON.stringify({plan,sites});
    const points=sites.map(site=>N.resolveSurveyPoint(site,(p,r)=>E.querySpatialIndexCircle(index,p.x,p.y,r).length===0));
    for(const [i,point]of points.entries()){
      assert.ok(point,`${seed}/${sites[i].theme}: an immutable-terrain point exists`);
      assert.equal(E.querySpatialIndexCircle(index,point.x,point.y,C.NARRATIVE_RULES.surveyPointClearance).length,0);
      assert.ok(C.dist(point,sites[i])<=C.NARRATIVE_RULES.surveyPointSearchRadius);
    }
    assert.equal(JSON.stringify({plan,sites}),before,'resolution never repacks or edits the native plan');
  }
});

test('202 seed17117 market can be reached and surveyed through the native action while identity, time, economy and Continue remain authoritative',()=>{
  const {g,doc}=current(),site=g.world.sites.find(s=>s.theme==='market'),point=g.narrativeSurveyPoint('market'),initial=preserved(g),origin={x:g.player.x,y:g.player.y};
  const solid=E.physicalSolids134(g.exploration125.plan).find(s=>s.building==='settlement-2-building-2');
  assert.ok(solid&&site.x-C.NARRATIVE_RULES.surveyRadius>solid.x&&site.x+C.NARRATIVE_RULES.surveyRadius<solid.x+solid.w&&site.y-C.NARRATIVE_RULES.surveyRadius>solid.y&&site.y+C.NARRATIVE_RULES.surveyRadius<solid.y+solid.h,'the regression really starts with an entirely obstructed historical disc');
  assert.notDeepEqual(point,{x:site.x,y:site.y});
  for(const sector of g.world.sites){
    const p=g.narrativeSurveyPoint(sector.theme);assert.ok(p);assert.ok(g.friendlyPositionClear(g.player,p.x,p.y),sector.theme);
    assert.ok(route(g,p),sector.theme+' is physically reachable from the initial player');
    for(const other of g.world.sites)if(other!==sector)assert.ok(C.dist(p,g.narrativeSurveyPoint(other.theme))>=C.NARRATIVE_RULES.surveyRadius*2,'sector survey identities do not overlap');
  }
  assert.deepEqual(preserved(g),initial,'reading all points changes no native owner');
  point.x+=1000;assert.notEqual(g.narrativeSurveyPoint('market').x,point.x,'callers cannot mutate the cached point');

  // The old invalid centre remains refused; the successful path below starts
  // from the actual spawn and uses the real movement owner on every segment.
  Object.assign(g.player,{x:site.x,y:site.y});g.input.keys.add('KeyE');
  assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),false);
  assert.equal(g.updateNarrativeSurvey(.25),false);assert.equal(g.narrative.sectors.market.survey,0);
  Object.assign(g.player,origin);g.input.keys.clear();assert.ok(walk(g,g.narrativeSurveyPoint('market'))>0);
  g.updateInteraction(.25);assert.equal(g.narrative.sectors.market.survey,0,'passive presence does not survey');
  g.input.keys.add('KeyE');g.togglePause(true);g.updateNarrativeSurvey(.25);assert.equal(g.narrative.sectors.market.survey,0);
  g.togglePause(false);g.input.keys.add('KeyE');
  for(let step=0;step<8;step++)g.updateInteraction(.25);
  assert.equal(g.narrative.sectors.market.survey,2,'real ACTION accumulates the same two active seconds as the Windows smoke');
  assert.deepEqual(preserved(g),initial,'walking and surveying offer no material, insight, morale or RNG draw');
  const saved=clone(g.serialize()),savedPose={x:g.player.x,y:g.player.y},savedPoint=g.narrativeSurveyPoint('market');
  assert.equal(g.restoreSave(saved),true);assert.equal(g.narrative.sectors.market.survey,2);
  assert.deepEqual(preserved(g),initial);assert.deepEqual({x:g.player.x,y:g.player.y},savedPose);assert.deepEqual(g.narrativeSurveyPoint('market'),savedPoint);
  assert.equal(Object.hasOwn(g.serialize().narrative,'surveyPoints'),false,'no second saved spatial register');
  g.togglePause(false);g.input.keys.add('KeyE');
  for(let step=0;step<23;step++)g.updateInteraction(.25);
  assert.equal(g.narrative.sectors.market.survey,7.75);assert.equal(g.narrative.sectors.market.choice,null);
  g.updateInteraction(.25);g.input.keys.clear();assert.equal(g.narrative.sectors.market.survey,8);
  assert.deepEqual(preserved(g),initial);assert.equal(g.narrative.unread.filter(id=>id==='sector:market').length,1);
  assert.equal(g.resolveNarrative('market','A'),false,'surveying does not waive the real return to the depot');

  g.showCommand(true,'journal');const card=descendants(doc.getElementById('narrativeOperations')).find(node=>node.dataset.narrativeSector==='market');
  assert.ok(card&&doc.body.contains(card));card.open=true;
  const marker=descendants(card).find(node=>node.dataset.narrativeMark==='market');assert.ok(marker&&doc.body.contains(marker));
  const beforeMark=preserved(g),beforePosition={x:g.player.x,y:g.player.y};marker.click();
  assert.equal(g.fieldMarker,site.id);assert.deepEqual(preserved(g),beforeMark);assert.deepEqual({x:g.player.x,y:g.player.y},beforePosition);
  const arcs=[],rects=[],ctx=new Proxy({arc(...args){arcs.push(args);},strokeRect(...args){rects.push(args);}},{get:(target,key)=>key in target?target[key]:()=>{}});
  g.contentUI.drawMarker(ctx,{left:0,top:0,right:C.WORLD_SIZE,bottom:C.WORLD_SIZE});
  assert.deepEqual(arcs[0].slice(0,3),[savedPoint.x,savedPoint.y,C.NARRATIVE_RULES.surveyRadius]);
  g.contentUI.drawMinimap(ctx,1,1);assert.ok(rects.some(r=>r[0]===savedPoint.x-3&&r[1]===savedPoint.y-3));
  assert.match(textTree(card),/point de relevé, cellule 55,91/);
  g.showCommand(false);g.togglePause(false);
  const depot=g.fieldcraft.service(g.player,g.core());assert.ok(depot);walk(g,depot);
  g.showCommand(true,'journal');const beforeChoice=clone(g.resources),insight=g.research.insight,choice=N.SECTORS.find(s=>s.id==='market').choices.A;
  assert.equal(g.resolveNarrative('market','A'),true);
  for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],beforeChoice[key]-(choice.cost[key]||0));
  assert.equal(g.research.insight,insight+1);assert.equal(g.narrative.sectors.market.choice,'A');
  const settled=preserved(g),decision=clone(g.narrative);assert.equal(g.restoreSave(g.serialize()),true);
  assert.deepEqual(preserved(g),settled);assert.deepEqual(g.narrative,decision);assert.equal(g.resolveNarrative('market','A'),false);

  g.showCommand(false);g.togglePause(false);
  const fixed=g.narrativeSurveyPoint('industry'),gx=C.grid(fixed.x),gy=C.grid(fixed.y),cost=g.world.definition('woodWall').cost,beforeWall=clone(g.resources);
  assert.equal(g.world.placement(g.world.definition('woodWall'),gx,gy).valid,true,'the later wall uses a legal native plot');
  assert.equal(g.placeOne('woodWall',gx,gy),true);const wall=g.world.atCell(gx,gy);
  for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],beforeWall[key]-(cost[key]||0));
  const service=g.fieldcraft.service(g.player,wall);assert.ok(service);walk(g,service);g.input.keys.add('KeyE');
  let workTicks=0;while(!wall.completed&&workTicks++<200)g.updateInteraction(.1);g.input.keys.clear();
  assert.equal(wall.completed,true,'the paid wall is physically completed through ACTION');assert.ok(workTicks>1);
  assert.deepEqual(g.narrativeSurveyPoint('industry'),fixed,'construction does not move an already derived marker');
  const progress=g.narrative.sectors.industry.survey,clearPose={x:g.player.x,y:g.player.y};
  Object.assign(g.player,{x:wall.x,y:wall.y});g.input.keys.add('KeyE');
  assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),false);assert.equal(g.updateNarrativeSurvey(.25),false);
  assert.equal(g.narrative.sectors.industry.survey,progress,'an obstructed presence still cannot survey');
  Object.assign(g.player,clearPose);g.input.keys.clear();const afterWall=preserved(g),wallSave=clone(g.serialize());
  assert.equal(g.restoreSave(wallSave),true);assert.deepEqual(g.narrativeSurveyPoint('industry'),fixed);
  assert.deepEqual(preserved(g),afterWall);assert.equal(g.world.buildings.get(wall.id).completed,true);
});

for(const seed of ['42','4294967295'])test(`202 all six native survey points remain reachable in current campaign seed${seed}`,()=>{
  const {g}=current(seed),before=preserved(g);
  if(seed==='42'){
    const site=g.world.sites.find(s=>s.theme==='checkpoint'),goal={x:C.world(C.grid(site.x)),y:C.world(C.grid(site.y))};
    assert.equal(g.friendlyPositionClear(g.player,site.x,site.y),true);
    assert.equal(g.friendlyPositionClear(g.player,goal.x,goal.y),false,'the historical goal cell really overlaps the immutable pumps station');
    assert.ok([...g.fieldcraft.props(goal.x,goal.y,g.player.radius)].some(p=>p.id==='exp:pompes'));
    assert.notDeepEqual(g.narrativeSurveyPoint(site.theme),{x:site.x,y:site.y});
  }
  const fixtures=g.fieldcraft.fixtures(),fixtureState=clone(fixtures);fixtures[0].x+=1000;fixtures.pop();
  assert.deepEqual(g.fieldcraft.fixtures(),fixtureState,'the resolver receives copies, never the station owner collection');
  for(const site of g.world.sites){const point=g.narrativeSurveyPoint(site.theme);assert.ok(point,site.theme);assert.ok(g.friendlyPositionClear(g.player,point.x,point.y),site.theme);assert.ok(route(g,point),site.theme+' route');}
  assert.deepEqual(preserved(g),before);
});

test('202 historical surveys keep their anchors and a later player wall cannot relocate a survey or permit work inside it',()=>{
  const {game:g}=bootGame();g.startNew('standard','17117');
  for(const site of g.world.sites)assert.deepEqual(g.narrativeSurveyPoint(site.theme),{x:site.x,y:site.y});
  const site=g.world.sites[0],point=g.narrativeSurveyPoint(site.theme),saved=clone(g.serialize()),id=saved.nextId++;
  saved.buildings.push({id,type:'woodWall',gx:C.grid(point.x),gy:C.grid(point.y),rotation:0,progress:1,health:C.BUILDINGS.woodWall.health});
  saved.urban.peakScore=C.Urban.score(saved.buildings);assert.equal(g.restoreSave(saved),true);
  assert.deepEqual(g.narrativeSurveyPoint(site.theme),point);g.input.keys.add('KeyE');
  Object.assign(g.player,{x:C.world(C.grid(point.x)),y:C.world(C.grid(point.y))});
  assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),false);assert.equal(g.updateNarrativeSurvey(.25),false);
  assert.equal(g.narrative.sectors[site.theme].survey,0);assert.equal(g.world.buildings.has(id),true);
  const before=clone(g.serialize());assert.equal(g.restoreSave(before),true);assert.deepEqual(g.narrativeSurveyPoint(site.theme),point);assert.deepEqual(g.narrative,before.narrative);
});
