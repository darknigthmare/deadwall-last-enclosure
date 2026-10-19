'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const R=require('../src/codex3000-runtime.js'),P=require('../src/codex-plan165.js'),N=require('../src/codex-native173.js');
const UI=require('../src/world-codex.js'),Context=require('../src/codex-context160.js');
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const independent=R.records.filter(record=>record.independent);

test('182 independent previews: all 1000 original plans and finite container budgets survive the added furnishing inspector',()=>{
 assert.equal(independent.length,1000);assert.equal(R.summary().count,4000);assert.equal(R.summary().parents,2000);
 const before=digest(R.records);let containers=0,details=0;
 for(const record of independent){
  const seed=42,z=0,site='preview-'+record.id,original=R.floor(record.id,seed,z,site),source=digest(record.details);
  const preview=P.inspect(record.id,seed,z,10);
  assert.equal(preview.supported,true,record.id);assert.equal(preview.p.id,site);assert.equal(preview.detailVersion,10);
  assert.deepEqual(preview.plan,original,record.id+' containers and geometry');
  assert.deepEqual(preview.reference,R.template(record.id,seed,site).reference);
  for(const item of [...preview.details.interior,...preview.details.outdoor]){
   assert.equal(item.amount,undefined,record.id+' decorative resource');assert.equal(item.resource,undefined,record.id+' decorative resource type');
  }
  assert.equal(digest(record.details),source,record.id+' source unchanged');
  containers+=original.objects.length;details+=preview.details.interior.length+preview.details.outdoor.length;
 }
 assert.equal(digest(R.records),before);assert.ok(containers>0);assert.ok(details>0);
 console.log('INDEPENDENT182_PREVIEWS '+JSON.stringify({programmes:independent.length,containers,decorativeDetails:details}));
});

test('182 independent guide: authored access prose remains readable without inventing furniture dimensions or graph links',()=>{
 for(const id of ['DW-3001','DW-3251','DW-3501','DW-3751','DW-4000']){
  const source=R.get(id).details,description=R.describe(id),rows=UI.accessRows161(description);
  assert.deepEqual(description.sourceAccess158,source.access);assert.deepEqual(description.access,[]);
  const keys=['public','service','return'].filter(key=>typeof source.access[key]==='string');
  assert.equal(rows.length,keys.length);keys.forEach((key,index)=>assert.ok(rows[index][1].includes(source.access[key])));
  assert.ok(description.rooms.every(room=>room.authoredProps.length===0&&room.area===null));
  description.rooms.forEach((room,index)=>assert.deepEqual(room.sourceProps158,source.spaces[index].props));
  const name=description.rooms[0].name;assert.ok(R.searchDocument(id).includes(UI.normalize(name)));
  assert.ok(UI.query({family:'programmes',text:name}).some(entry=>entry.id==='programme-'+id));
 }
 assert.equal(UI.query({availability:'context160',status:'programme'}).length,626);
});

test('182 native laboratory: independent layouts remain disposable, specialized G10 territories are not replaced by buildings',()=>{
 const before=digest(R.records),contracts=digest(Context.records);
 for(const id of ['DW-3001','DW-3501','DW-4000']){
  const model=N.build(id,42),description=R.describe(id);
  assert.equal(model.supported,true);assert.equal(model.scope,'native-layout-laboratory-not-campaign');
  assert.ok(!/^P\d{4}$/.test(model.p.id));assert.deepEqual(model,N.build(id,42));
  const instances=[...model.floors.flatMap(floor=>floor.rooms),...model.yards];
  for(const room of description.rooms){const copies=instances.filter(instance=>instance.source===room.id);assert.equal(copies.length,1);assert.equal(copies[0].z,room.levels[0]);}
  const furniture=N.details(model,0);for(const item of [...furniture.interior,...furniture.outdoor]){assert.equal(item.amount,undefined);assert.equal(item.resource,undefined);}
 }
 for(const id of ['DW-0266','DW-0294','DW-0348','DW-0421','DW-0461']){
  const model=N.build(id,42);assert.equal(model.supported,false,id);assert.equal(model.reason,'specialized-terrain-required');
 }
 assert.equal(digest(R.records),before);assert.equal(digest(Context.records),contracts);
});

test('182 source disclosures: shipped plan and native laboratory controls mount only in the authored programme disclosure',async()=>{
 // Source inspectors belong to the explicit author surface, never the player Guide.
 const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{g,doc,dispatchDocument}=bootDocument134({search:'?tools=1&fixture=legacy'});
 // Supply the standard DOM properties/selectors omitted by the lightweight
 // fixture. The actual shipped HTML, owners and toggle listeners remain in use.
 const proto=Object.getPrototypeOf(doc.body),matches=proto.matches;
 Object.defineProperty(proto,'parentElement',{configurable:true,get(){return this.parentNode;}});
 Object.defineProperty(proto,'isConnected',{configurable:true,get(){return doc.body.contains(this)||!!doc.head?.contains(this);}});
 proto.matches=function(selector){const attribute=/^\[data-([\w-]+)(?:="([^"]*)")?\]$/.exec(selector);
  if(!attribute)return matches.call(this,selector);const key=attribute[1].replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
  return Object.hasOwn(this.dataset,key)&&(attribute[2]===undefined||this.dataset[key]===attribute[2]);};
 proto.querySelector=function(selector){return this.querySelectorAll(selector)[0]||null;};
 g.startNew('standard','17117');g.campaignIntro132.skip();g.worldCodex.open();
 doc.getElementById('worldCodexSearch').value='DW-0001';doc.getElementById('worldCodexStatus').value='programme';g.worldCodex.refresh();
 const card=doc.getElementById('worldCodexResults').querySelectorAll('article').find(node=>node.dataset.codexId==='programme-DW-0001');assert.ok(card);
 const disclosures=card.children.filter(node=>node.tagName==='DETAILS'),source=disclosures.find(node=>node.dataset.codexSource159===card.dataset.codexId),known=disclosures.find(node=>!node.dataset.codexSource159);
 assert.ok(source);assert.ok(known);assert.equal(known.children[0].textContent,'Lieux de cette fiche déjà repérés');
 const controls=owner=>owner.querySelectorAll('section').filter(node=>node.dataset.codexPlan165||node.dataset.nativeLab173);
 const checkpoint=()=>{const state=g.serialize();delete state.timestamp;return structuredClone(state);},before=checkpoint(),rng=g.random.state;
 const open=async node=>{node.open=true;node.dispatch('toggle');dispatchDocument('toggle',{target:node});await Promise.resolve();};
 await open(known);assert.equal(controls(known).length,0,'The notebook is not a recipe or architecture laboratory');
 const unrelated=doc.createElement('details');unrelated.dataset.codexSource159='programme-DW-9999';card.appendChild(unrelated);
 await open(unrelated);assert.equal(controls(unrelated).length,0,'A mismatched programme cannot acquire inspector controls');
 await open(source);assert.equal(controls(source).filter(node=>node.dataset.codexPlan165).length,1);assert.equal(controls(source).filter(node=>node.dataset.nativeLab173).length,1);
 await open(source);await open(known);assert.equal(controls(source).length,2,'Repeated toggles do not duplicate either inspector');assert.equal(controls(known).length,0);
 assert.deepEqual(checkpoint(),before);assert.equal(g.random.state,rng);assert.equal(g.frontier.position().generation,8);
});
