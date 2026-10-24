'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const UI=require('../src/codex-inspection2026-ui.js');
const Civil=require('../scripts/codex-civil-networks2026.cjs');
const Transport=require('../scripts/codex-transport-sites2026.cjs');
const Foundation=require('../scripts/codex-world-foundations2026.cjs');
const Utilities=require('../scripts/codex-utilities2026.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));
const sample=()=>({transportNetwork:{scope:'author-transport-layout-not-operational',operational:false,inspectionAccess:'closed',
  nodes:[{id:'a',x:0,y:0,z:0,level:0,kind:'junction'},{id:'b',x:12,y:0,z:0,level:0,kind:'destination'}],
  edges:[{id:'edge',from:'a',to:'b',widthM:6,mode:'road',kind:'axis',level:0}],externalPorts:[]}});
const ramp=()=>{const p=sample();Object.assign(p.transportNetwork.nodes[1],{z:8,level:1});Object.assign(p.transportNetwork.edges[0],{level:null,kind:'approach-ramp'});return p;};
const rename=(p,index,id)=>{const n=p.transportNetwork.nodes[index],old=n.id;n.id=id;for(const e of p.transportNetwork.edges){if(e.from===old)e.from=id;if(e.to===old)e.to=id;}};

test('transport UI : les 16 types civils et de transport préservent 1/50, largeurs, modes et extrémités',()=>{
  const modes=new Set();let sites=0,edges=0;
  for(const generator of [Civil,Transport])for(const type of generator.TYPES)for(const number of [1,50]) {
    const p=generator.build(type,number),before=JSON.stringify(p),rows=UI.transportEdges(p);
    const ns=new Map(p.transportNetwork.nodes.map(n=>[n.id,n])),source=new Map(p.transportNetwork.edges.map(e=>[e.id,e]));
    assert.equal(rows.length,source.size,p.id);assert.equal(new Set(rows.map(e=>e.id)).size,rows.length);
    for(const row of rows) {
      const e=source.get(row.id),a=ns.get(e.from),b=ns.get(e.to);
      assert.deepEqual(row.a,{x:a.x,y:a.y,z:a.z});assert.deepEqual(row.b,{x:b.x,y:b.y,z:b.z});
      assert.equal(row.widthM,e.widthM);assert.equal(row.mode,e.mode);assert.equal(row.kind,e.kind);assert.equal(row.level,e.level);
      assert.equal(row.elevationM,(a.z+b.z)/2);modes.add(row.mode);
    }
    const sorted=[...rows].sort((a,b)=>a.elevationM-b.elevationM||a.id.localeCompare(b.id));
    assert.deepEqual(rows,sorted,p.id+' ordre des altitudes');assert.equal(JSON.stringify(p),before,p.id+' mutation auteur');
    sites++;edges+=rows.length;
  }
  assert.equal(sites,32);assert.ok(edges>500);assert.deepEqual([...modes].sort(),['apron','rail','ramp','road','runway','taxiway']);
});

test('transport UI : les croisements superposés gardent leurs altitudes sans jonction implicite',()=>{
  const p=Civil.build('EXT-MONDE-T033',1),n=p.transportNetwork.nodes;
  const upper=n.find(v=>v.level===1&&n.some(w=>w.x===v.x&&w.y===v.y&&w.z!==v.z));
  assert.ok(upper);const lower=n.find(v=>v.x===upper.x&&v.y===upper.y&&v.level===0);
  assert.ok(lower);assert.notEqual(lower.z,upper.z);
  const rows=UI.transportEdges(p);
  assert.equal(rows.length,p.transportNetwork.edges.length);
  for(const row of rows) {
    const e=p.transportNetwork.edges.find(e=>e.id===row.id);
    if(e.level!==null){assert.equal(row.a.z,row.b.z);assert.equal(row.elevationM,row.a.z);}
    assert.ok(!(row.a.x===upper.x&&row.a.y===upper.y&&row.b.x===lower.x&&row.b.y===lower.y&&row.a.z!==row.b.z),'liaison verticale inventée');
  }
});

test('transport UI : les résultats sont des copies, les plans gelés et les appels suivants restent intacts',()=>{
  const p=Transport.build('EXT-MONDE-T070',50),before=JSON.stringify(p),first=UI.transportEdges(p),snapshot=clone(first);
  first[0].a.x+=123;first[0].b.z+=77;first[0].widthM=999;first.reverse();first.pop();
  assert.equal(JSON.stringify(p),before);assert.deepEqual(UI.transportEdges(p),snapshot);
  const r=UI.transportEdges(p);assert.notEqual(r,first);assert.notEqual(r[0],first[0]);
});

test('transport UI : les anciens plans de stade et d’énergie n’inventent aucune voie de transport',()=>{
  for(const p of [Foundation.build('EXT-MONDE-T065',1),Foundation.build('EXT-MONDE-T060',50),Utilities.build('EXT-MONDE-T057',1)]) {
    assert.equal(p.transportNetwork,undefined);const before=JSON.stringify(p);
    assert.deepEqual(UI.transportEdges(p),[]);assert.equal(JSON.stringify(p),before);
  }
});

test('transport UI : les statuts ouvert, opérationnel ou incomplet sont refusés',()=>{
  const cases=[p=>p.transportNetwork=null,p=>p.transportNetwork.scope='live-world',p=>p.transportNetwork.operational=true,
    p=>delete p.transportNetwork.operational,p=>p.transportNetwork.inspectionAccess='open',p=>delete p.transportNetwork.inspectionAccess,
    p=>p.transportNetwork.nodes={},p=>p.transportNetwork.edges=null];
  for(const change of cases){const p=sample();change(p);assert.throws(()=>UI.transportEdges(p));}
});

test('transport UI : les nœuds malformés, absents, répétés et sans identifiant sont refusés',()=>{
  const cases=[p=>p.transportNetwork.nodes[0]=null,p=>p.transportNetwork.nodes[0]=undefined,
    p=>p.transportNetwork.nodes.push({...p.transportNetwork.nodes[0]}),p=>p.transportNetwork.nodes[0].x=NaN,
    p=>p.transportNetwork.nodes[0].z=Infinity,p=>p.transportNetwork.nodes[0].level=-1,
    p=>p.transportNetwork.nodes[0].level='0',p=>p.transportNetwork.nodes[0].level=null,
    p=>rename(p,0,''),p=>rename(p,0,'   '),p=>rename(p,0,123)];
  for(const [index,change] of cases.entries()){const p=sample();change(p);assert.throws(()=>UI.transportEdges(p),'nœud invalide '+index);}
});

test('transport UI : les arêtes malformées, nulles, répétées, sans extrémité ou identifiant sont refusées',()=>{
  const cases=[p=>p.transportNetwork.edges[0]=null,p=>p.transportNetwork.edges[0]=undefined,
    p=>p.transportNetwork.edges.push({...p.transportNetwork.edges[0]}),p=>p.transportNetwork.edges[0].id='',
    p=>p.transportNetwork.edges[0].id='  ',p=>p.transportNetwork.edges[0].from='missing',p=>p.transportNetwork.edges[0].to='a',
    p=>p.transportNetwork.edges[0].widthM=0,p=>p.transportNetwork.edges[0].widthM=Infinity,
    p=>p.transportNetwork.edges[0].widthM='6',p=>p.transportNetwork.edges[0].mode='water'];
  for(const [index,change] of cases.entries()){const p=sample();change(p);assert.throws(()=>UI.transportEdges(p),'arête invalide '+index);}
});

test('transport UI : des identifiants distincts ne légitiment pas une voie de longueur nulle',()=>{
  const p=sample();Object.assign(p.transportNetwork.nodes[1],{x:0,y:0,z:0});
  assert.throws(()=>UI.transportEdges(p));
  const vertical=ramp();Object.assign(vertical.transportNetwork.nodes[1],{x:0,y:0});
  assert.throws(()=>UI.transportEdges(vertical));
});

test('transport UI : plans fixes, niveaux et rampes incohérents sont refusés',()=>{
  const fixedCases=[p=>p.transportNetwork.nodes[1].z=1,p=>p.transportNetwork.nodes[1].level=1,
    p=>p.transportNetwork.edges[0].level=1,p=>Object.assign(p.transportNetwork.edges[0],{mode:'ramp',kind:'ramp'})];
  for(const change of fixedCases){const p=sample();change(p);assert.throws(()=>UI.transportEdges(p));}
  const rampCases=[p=>p.transportNetwork.edges[0].kind='axis',p=>p.transportNetwork.edges[0].mode='runway',
    p=>p.transportNetwork.edges[0].mode='apron',p=>p.transportNetwork.edges[0].level=0,
    p=>p.transportNetwork.nodes[1].z=0];
  for(const [index,change] of rampCases.entries()){const p=ramp();change(p);assert.throws(()=>UI.transportEdges(p),'rampe invalide '+index);}
});
