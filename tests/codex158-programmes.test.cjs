'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const D=require('../src/codex3000-live-data.js'),R=require('../src/codex3000-runtime.js'),G=require('../src/frontier-geometry.js'),C=require('../src/world-codex.js');
const extension=R.records.filter(p=>p.extension===158);
test('No usable road refuses placement and reports only the generation-specific programme pool',()=>{
 for(const generation of [8,9])assert.deepEqual(R.populateRegion({generation,roads:[],install(){throw Error('unqualified road must not install a site');}}),
  {eligible:0,placed:0,unsupported:generation===8?3000:4000});
});
test('1.58 preserves every archived compiled value while adding exactly 1,000 self-parent programmes',()=>{
 const parents=Object.fromEntries(Object.entries(D.parents).filter(([id])=>Number(id)<=1000));
 const legacy={parents,programmes:D.programmes.slice(0,3000),modules:D.modules,states:D.states};
 const digest=crypto.createHash('sha256').update(JSON.stringify(legacy)).digest('hex');
 assert.equal(digest,'afb769009c0a77246056e0b4b3d77258b77df19509094cec25dc4ee0bef72195','archived compiled source changed');
 assert.equal(extension.length,1000);assert.equal(R.summary().parents,2000);assert.equal(R.summary().legacyCount,3000);
 const names=new Set(R.records.slice(0,3000).map(p=>p.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()));
 for(let i=0;i<1000;i++){const p=extension[i];assert.equal(p.id,'DW-'+(3001+i));assert.equal(p.parent,p.id);assert.equal(p.independent,true);assert.equal(p.module,'');assert.equal(p.state,'');
  const key=p.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();assert.ok(!names.has(key),'reused programme name '+p.id);names.add(key);
  assert.ok(p.details.purpose.length>=30);assert.ok(p.details.spaces.length>=6);assert.equal(p.details.id,p.id);
 }
});
test('Four source lots validate against the same author contract and reject malformed programme dimensions and props',async()=>{
 const V=await import('../codex-3000/addendum-1.58/validation.mjs'),base=path.join(__dirname,'../codex-3000/addendum-1.58');
 const lots=V.LOTS.map(file=>JSON.parse(fs.readFileSync(path.join(base,file),'utf8')));
 assert.equal(V.validateAll(lots,R.records.slice(0,3000).map(p=>p.name)).length,1000);
 const pristine=lots[0].fiches[0];for(const alter of [p=>p.id='DW-1001',p=>p.architecture.levels=[-1,0,1,2],p=>p.spaces[0].props[0].kind='magicGenerator',p=>p.spaces[0].props[0].resource='gold',p=>p.placement.biomes=['ocean'],p=>p.access.width_m=.3]){
  const invalid=structuredClone(pristine);alter(invalid);assert.throws(()=>V.validateRecord(invalid));
 }
});
function reachableFrom(plan,start){
 const step=.55,r=.32,columns=Math.ceil((plan.floor.w+.48)/step),rows=Math.ceil((plan.floor.h+.48)/step),cell=(x,y)=>[Math.round(x/step),Math.round(y/step)],key=(x,y)=>y*columns+x;
 const blocked=(x,y)=>plan.walls.some(o=>G.circleRect(x,y,r,o))||plan.objects.some(o=>G.circleRect(x,y,r,o));
 const [sx,sy]=cell(start.x,start.y),queue=[[sx,sy]],seen=new Uint8Array(columns*rows);seen[key(sx,sy)]=1;
 for(let n=0;n<queue.length;n++){const [x,y]=queue[n];
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=key(a,b);if(a<1||b<1||a>=columns-1||b>=rows-1||seen[k])continue;if(blocked(a*step,b*step)){seen[k]=2;continue;}seen[k]=1;queue.push([a,b]);}}
 return target=>{const [tx,ty]=cell(target.x,target.y);for(let y=ty-1;y<=ty+1;y++)for(let x=tx-1;x<=tx+1;x++)if(seen[key(x,y)]===1&&Math.hypot(x*step-target.x,y*step-target.y)<.8)return true;return false;};
}
test('Every new programme floor preserves its author spaces, finite identities, corridors and physical return',()=>{
 const layouts=new Map();let floors=0,containers=0;
 for(const p of extension){const t=R.template(p.id,17117,'P8765');assert.equal(t.architecture,p.details.architecture);assert.ok(t.levels.length<=3);
  for(const z of t.levels){const plan=R.floor(p.id,17117,z,'P8765'),copy=R.floor(p.id,17117,z,'P8765');assert.deepEqual(plan,copy,p.id);floors++;
   assert.equal(plan.rooms.length,p.details.spaces.filter(s=>s.z===z).length);assert.equal(plan.layout158,p.details.architecture.layout);
   assert.ok(plan.objects.length>=plan.rooms.length,p.id+' insufficient actual furniture');assert.equal(new Set(plan.objects.map(o=>o.id)).size,plan.objects.length);
   const reaches=reachableFrom(plan,{x:t.w/2,y:1});assert.ok(reaches({x:t.w/2,y:t.h-1}),p.id+' blocked return '+z);
   for(const room of plan.rooms){assert.ok(reaches({x:room.x+room.w/2,y:room.y+room.h/2}),p.id+' inaccessible room '+room.name);}
   for(const stair of plan.stairs)assert.ok(reaches({x:stair.x+stair.w/2,y:stair.y+stair.h/2}),p.id+' inaccessible landing');
   for(const o of plan.objects){containers++;assert.ok(G.SHAPES[o.kind]);assert.ok(o.amount>=3&&o.amount<=12);assert.ok(o.x>=.3&&o.y>=.3&&o.x+o.w<t.w&&o.y+o.h<t.h);
    assert.ok(!plan.walls.some(w=>G.overlap({l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h},{l:w.x,r:w.x+w.w,t:w.y,b:w.y+w.h},.18)),p.id+' object intersects wall');}
   if(!layouts.has(plan.layout158))layouts.set(plan.layout158,JSON.stringify([t.w,t.h,plan.walls]));
  }
 }
 assert.equal(layouts.size,4);assert.equal(new Set(layouts.values()).size,4);assert.ok(floors>=1000);assert.ok(containers>=6000);
});
test('Complete new programme cards expose concrete rooms, access and risks without claiming every programme is placed',()=>{
 for(const p of extension){const e=C.entries.find(q=>q.id==='programme-'+p.id);assert.ok(e);assert.equal(e.status,'programme');
  for(const key of ['summary','layout','access','supplies','risks','night','variants','interactions','qa','source'])assert.ok(e[key].length>20,p.id+' incomplete '+key);
  assert.ok(e.layout.includes(p.details.spaces[0].name));assert.ok(e.source.includes('G9'));
 }
 assert.ok(C.query({text:'DW-4000',status:'programme'}).some(e=>e.id==='programme-DW-4000'));
 assert.equal(C.query({text:'DW-4000',status:'terrain'}).length,0);
});
test('Offline new-programme reader preserves all 1,000 full records, filters, paginates and exposes their detailed programmes',async()=>{
 const M=await import('../codex-3000/addendum-1.58/reader.mjs'),directory=path.join(__dirname,'../codex-3000/addendum-1.58'),records=extension.map(p=>p.details),html=fs.readFileSync(path.join(directory,'LIRE_1000_NOUVEAUX.html'),'utf8'),index=JSON.parse(fs.readFileSync(path.join(directory,'INDEX_1000.json'),'utf8'));
 assert.equal(html,M.renderReader(records));assert.deepEqual(index,M.makeIndex(records));assert.equal(index.count,1000);assert.equal(index.independentParents,1000);
 assert.equal(/<(?:link|script)[^>]+(?:src|href)=/i.test(html),false,'offline reader depends on an external request');
 const data=html.split('<script id="codex158-data" type="application/json">')[1].split('</script>')[0],script=html.split('</script><script>')[1].split('</script>')[0];
 assert.deepEqual(JSON.parse(data),records);
 const {installFakeBrowser}=require('./helpers/browser.cjs');installFakeBrowser();const proto=Object.getPrototypeOf(document.createElement('div'));
 proto.append=function(...nodes){for(const node of nodes)this.appendChild(node);};proto.scrollIntoView=function(){};
 document.getElementById('codex158-data').textContent=data;for(const id of ['search','family','lot'])document.getElementById(id).value='';
 require('node:vm').runInNewContext(script,{document});
 const results=document.getElementById('results'),search=document.getElementById('search'),lot=document.getElementById('lot'),family=document.getElementById('family');
 assert.equal(results.children.length,24);assert.equal(document.getElementById('count').textContent,'1000 programmes trouvés sur 1000 parents indépendants');
 document.getElementById('next').dispatch('click');assert.equal(document.getElementById('page').textContent,'2 / 42');
 search.value='DW-4000';search.dispatch('input');assert.equal(results.children.length,1);assert.match(results.children[0].querySelectorAll('h2')[0].textContent,/DW-4000/);
 const details=results.children[0].querySelectorAll('details')[0],headings=details.querySelectorAll('h3').map(n=>n.textContent);assert.ok(headings.includes('Espaces, flux et contenants'));assert.ok(headings.includes('Contrôles'));
 search.value='';search.dispatch('input');lot.value='A';lot.dispatch('change');assert.equal(document.getElementById('count').textContent,'250 programmes trouvés sur 1000 parents indépendants');
 family.value=records[0].family;family.dispatch('change');assert.equal(results.children.length,Math.min(24,records.slice(0,250).filter(p=>p.family===records[0].family).length));
 search.value='aucunmotnecorrespond';search.dispatch('input');assert.equal(results.querySelectorAll('article').length,0);
});
for(const seed of [17117,84329])test('G9 appends new independent sites and preserves every G8 site, floor and detail on seed '+seed,()=>{
 const W=require('../src/frontier-world.js'),B=require('../src/biomes135.js'),old=W.create(seed,8),next=W.create(seed,9);
 assert.equal(old.codexCoverage.programmeCount,3000);assert.equal(next.codexCoverage.programmeCount,4000);
 assert.deepEqual(next.roads,old.roads);assert.deepEqual(next.home,old.home);
 assert.deepEqual(next.pois.slice(0,old.pois.length),old.pois,'G8 IDs or envelopes were replaced');
 let floors=0;for(const p of old.pois){const q=next.pois.find(o=>o.id===p.id);for(const z of p.levels){
  assert.deepEqual(next.plan(q,z),old.plan(p,z),p.id+' floor changed '+z);
  assert.deepEqual(next.detailAt(q,z),old.detailAt(p,z),p.id+' decoration changed '+z);floors++;
 }}assert.ok(floors>100);
 const added=next.pois.slice(old.pois.length);assert.ok(added.length>=10,'no new functional programme sites');
 const areas=new Set();for(const p of added){assert.equal(p.generation,9);assert.ok(Number(p.programme3000.slice(3))>3000);
  const card=R.get(p.programme3000);assert.equal(card.parent,card.id);assert.equal(card.independent,true);assert.ok(next.nearestRoad(p.drive.a).d<.15);
  areas.add(Math.floor(p.x/256)+','+Math.floor(p.y/256));}
 const nativeProps=new Set();for(const p of added.slice(0,30)){for(const o of next.plan(p,0).objects)nativeProps.add(o.kind);const before=B.sample(seed,p.x,p.y,false,{generation:8}),after=B.sample(seed,p.x,p.y,false,{generation:9});assert.deepEqual(after,before,'G9 replaced the base habitat');}
 assert.ok(nativeProps.size>=5,'new programmes all collapsed to one type of furniture');
 // Tombstones retain the exact finite universe even under new reservations.
 for(const key of [...areas].slice(0,12)){const [cx,cy]=key.split(',').map(Number),all=world=>{const c=world.chunk(cx,cy);return[...c.trees,...c.rocks,...(c.cleared||[])].sort((a,b)=>a.id.localeCompare(b.id));};
  assert.deepEqual(all(next),all(old),'resource IDs or budgets changed in '+key);}
});
