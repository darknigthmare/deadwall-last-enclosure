'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{bootDocument134}=require('../scripts/qa-startup134.cjs'),{legacyAge}=require('./helpers/legacy-city.cjs');
const options={cityGeometry202:1},clone=value=>JSON.parse(JSON.stringify(value));
const dimensions=item=>{const d=C.CityGeometry202.definition(item.type,1);return item.rotation%2?[d.size[1],d.size[0]]:d.size;};
function occupied(items,openGates=false){const cells=new Set();for(const item of items){if(openGates&&C.BUILDINGS[item.type].gate)continue;const[w,h]=dimensions(item);for(let x=0;x<w;x++)for(let y=0;y<h;y++){const key=(item.gx+x)+':'+(item.gy+y);assert.ok(!cells.has(key),'physical overlap at '+key);cells.add(key);}}return cells;}
function fresh(){const env=bootDocument134(),g=env.g;g.startNew('standard','17117','classic','classic',true);g.campaignIntro132.skip();assert.equal(g.world.cityGeometry202,1);return env;}
function prepared(g,type){
 const existing=[...g.world.buildings.values()].find(b=>b.type===type&&b.completed&&!b.dead);if(existing)return existing;
 const d=g.world.definition(type);if(d.requires)prepared(g,d.requires);
 // Prior infrastructure is an explicit fixture, outside the northeast service plot.
 for(let y=118-d.size[1];y>=3;y--)for(let x=3;x<118-d.size[0];x++){if(x<111&&x+d.size[0]>68&&y<54&&y+d.size[1]>18)continue;if(g.world.placement(d,x,y,0).valid){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);return b;}}
 throw Error('No prepared site outside the northeast plot for '+type);
}
function planningFixture(){const env=fresh(),g=env.g;legacyAge(g,1850);prepared(g,'planningOffice');for(const key of C.RESOURCE_KEYS)g.resources[key]=g.storage;g.prepareWave();g.refreshMetrics(true);return env;}
function position(g,id){const p=g.dayworks.plans().find(p=>p.id===id);for(let y=3;y<128-p.h;y++)for(let x=3;x<128-p.w;x++){const q=g.dayworks.planStatus(id,x,y);if(q.ok)return{x,y,q};}throw Error('No real site for '+id);}
function stable(g){const data=clone(g.serialize());delete data.timestamp;return data;}

test('202 recomposes every ensemble using real bodies, paid perimeters and exterior service access',()=>{
 const legacy=clone(C.Dayworks.PLANS),plans=C.Dayworks.plansFor(options);assert.equal(plans.length,21);assert.equal(C.Dayworks.plansFor(),C.Dayworks.PLANS);assert.equal(C.Dayworks.plansFor({cityGeometry202:0}),C.Dayworks.PLANS);
 for(const plan of plans){
  const items=C.Dayworks.footprint(plan.id,0,0,options),all=occupied(items),blocked=occupied(items,true),cost={},definitions={};
  assert.ok(Object.isFrozen(plan)&&Object.isFrozen(plan.layout)&&plan.layout.every(Object.isFrozen));assert.ok(plan.w<=44&&plan.h<=36);assert.ok(items.length<=C.Dayworks.RULES.maxPlanCells);
  for(const item of items){const d=C.CityGeometry202.definition(item.type,1),[w,h]=dimensions(item);definitions[item.type]=d;assert.ok(item.gx>=0&&item.gy>=0&&item.gx+w<=plan.w&&item.gy+h<=plan.h);if(d.gate)assert.deepEqual([w,h],[4,1]);for(const[key,n]of Object.entries(d.cost))cost[key]=(cost[key]||0)+n;}
  const quote=C.Dayworks.quote(items,definitions,()=>({valid:true}),10,()=>true);assert.equal(quote.ok,true,plan.id+': '+quote.reason);assert.deepEqual(quote.cost,cost);
  const seen=new Set(['-1:-1']),queue=[[-1,-1]];for(let n=0;n<queue.length;n++){const[x,y]=queue[n];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+':'+ny;if(nx< -1||ny< -1||nx>plan.w||ny>plan.h||blocked.has(key)||seen.has(key))continue;seen.add(key);queue.push([nx,ny]);}}
  for(let x=0;x<plan.w;x++)for(let y=0;y<plan.h;y++)if(!blocked.has(x+':'+y))assert.ok(seen.has(x+':'+y),plan.id+' inaccessible court at '+x+':'+y);
  for(const item of items){const d=definitions[item.type];if(d.wall||d.gate||d.trapDamage)continue;const[w,h]=dimensions(item),faces=[];for(let x=0;x<w;x++)faces.push([item.gx+x,item.gy-1],[item.gx+x,item.gy+h]);for(let y=0;y<h;y++)faces.push([item.gx-1,item.gy+y],[item.gx+w,item.gy+y]);assert.ok(faces.some(([x,y])=>seen.has(x+':'+y)),plan.id+' '+item.type+' has service access');}
  assert.ok(all.size>=items.length);
 }
 assert.deepEqual(C.Dayworks.PLANS,legacy);const camp=C.Dayworks.planFor('camp',options);assert.deepEqual([camp.w,camp.h,camp.layout.length],[14,18,59]);
 assert.throws(()=>C.Dayworks.footprint('camp',NaN,0,options));assert.throws(()=>C.Dayworks.plansFor({cityGeometry202:2}));
});

test('202 every ensemble fits the actual native expansion district without clearing obstacles or changing the campaign',()=>{
 const {g}=fresh(),D=globalThis.DeadwallCore.Dayworks,area=g.exploration125.plan.buildableDistricts202[0],before=stable(g),tile=C.TILE;
 for(const plan of D.plansFor(options)){
  const definitions=Object.fromEntries(plan.layout.map(part=>[part[0],g.world.definition(part[0])]));let found=null,last='';
  // Knowledge and support requirements are supplied to the pure quote. Every
  // physical cell still goes through the real, unmodified native validator.
  for(let y=Math.ceil(area.y/tile);y<=Math.floor((area.y+area.h)/tile)-plan.h&&!found;y++)for(let x=Math.ceil(area.x/tile);x<=Math.floor((area.x+area.w)/tile)-plan.w&&!found;x++){
   const quote=D.quote(D.footprint(plan.id,x,y,options),definitions,(...args)=>g.world.placement(...args),10,()=>true);if(quote.ok)found={x,y};else last=quote.reason;
  }
  assert.ok(found,plan.id+' has no native plot: '+last);
 }
 assert.deepEqual(stable(g),before);
});

test('202 native preview, rotated cistern, funding, cancellation and Continue share one physical footprint',()=>{
 const {g}=planningFixture(),id='returnService201',at=position(g,id),expected=g.dayworks.planStatus(id,at.x,at.y),before=stable(g),stock={...g.resources},capacities=[g.storage,g.housing,g.cityScore];
 assert.equal(g.dayworks.beginPlan(id),true);assert.equal(g.dayworks.anchorPlan(id,at.x,at.y).ok,true);assert.deepEqual(stable(g),before);
 const rects=[],ctx={save(){},restore(){},fillRect(...args){rects.push(args);},strokeRect(){}};g.dayworks.drawPlan(ctx);
 assert.deepEqual(rects,expected.items.map(item=>{const[w,h]=dimensions(item);return[item.gx*C.TILE,item.gy*C.TILE,w*C.TILE,h*C.TILE];}));
 assert.ok(expected.items.some(item=>item.type==='fireCistern'&&item.rotation===1));g.dayworks.cancelPlan();assert.deepEqual(stable(g),before);
 assert.equal(g.dayworks.anchorPlan(id,at.x,at.y).ok,true);const oldIds=new Set(g.world.buildings.keys());assert.equal(g.dayworks.commitPlan(),true);const jobs=[...g.world.buildings.values()].filter(b=>!oldIds.has(b.id));
 assert.equal(jobs.length,expected.items.length);for(let i=0;i<jobs.length;i++){const b=jobs[i],item=expected.items[i];assert.deepEqual([b.type,b.gx,b.gy,b.rotation,b.w,b.h],[item.type,item.gx,item.gy,item.rotation,...dimensions(item)]);assert.equal(b.geometryVersion202,1);assert.equal(b.completed,false);assert.equal(b.progress,0);}
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(expected.cost[key]||0));assert.deepEqual([g.storage,g.housing,g.cityScore],capacities);assert.equal(g.dayworks.commitPlan(),false);
 const funded=stable(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(stable(g),funded);assert.equal(g.world.cityGeometry202,1);assert.deepEqual(g.dayworks.plans(),C.Dayworks.plansFor(options));
});

test('202 funding revalidates an occupied physical body before any spending and rolls back native partial failures',()=>{
 const {g}=planningFixture(),id='returnService201',at=position(g,id);assert.equal(g.dayworks.anchorPlan(id,at.x,at.y).ok,true);
 const first=at.q.items[0],blocker=new(g.core().constructor)(g.nextId++,'warehouse',first.gx,first.gy,0,1);g.world.add(blocker);g.refreshMetrics(true);let before=stable(g);assert.equal(g.dayworks.commitPlan(),false);assert.deepEqual(stable(g),before);g.world.remove(blocker);g.refreshMetrics(true);
 assert.equal(g.dayworks.anchorPlan(id,at.x,at.y).ok,true);before=stable(g);const original=g.placeOne;let calls=0;g.placeOne=function(...args){if(++calls===3)return false;return original.apply(this,args);};try{assert.equal(g.dayworks.commitPlan(),false);}finally{g.placeOne=original;}
 assert.equal(calls,3);assert.deepEqual(stable(g),before);
});

test('202 Dayworks and Codex views use campaign dimensions and return to historical plans for legacy worlds',()=>{
 const {g,doc}=fresh();g.dayworks.open();g.dayworksUI.refresh();const card=doc.getElementById('plan-returnRelay').parentNode;assert.equal(card.children[0].textContent,'24 × 16 MÈTRES');
 g.cityCatalogueUI150.open();let catalogue=g.cityCatalogueUI150.catalogue,house=catalogue.items.find(item=>item.kind==='building'&&item.id==='house'),camp=catalogue.items.find(item=>item.kind==='plan'&&item.id==='camp');assert.ok(house.facts.includes('Emprise au sol : 10 × 8 m.'));assert.ok(camp.facts.includes('59 fondations · emprise 14 × 18 m.'));
 g.startNew('standard','17117');g.campaignIntro132.skip();g.dayworks.open();g.dayworksUI.refresh();assert.equal(card.children[0].textContent,'8 × 7 CELLULES');g.cityCatalogueUI150.open();catalogue=g.cityCatalogueUI150.catalogue;camp=catalogue.items.find(item=>item.kind==='plan'&&item.id==='camp');assert.ok(camp.facts.includes('45 fondations · emprise 13 × 11 cellules.'));assert.equal(catalogue.items.find(item=>item.kind==='building'&&item.id==='house').facts.some(fact=>fact.startsWith('Emprise au sol')),false);
});
