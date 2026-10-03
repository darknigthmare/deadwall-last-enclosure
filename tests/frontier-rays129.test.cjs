'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js');
function fixture(){let destroyed=false;const w=W.create(17117,3,{structureDestroyed:()=>destroyed}),p=w.pois.find(p=>p.type==='duplex');p.a=.731;p.parking=[];p.outdoor=[];const plan=w.plan(p,0);plan.walls=[];plan.objects=[];return{w,p,plan,line:(a,b,r=.05,z=0,ignore=null)=>w.line(G.global(p,...a),G.global(p,...b),z,z?p.id:null,ignore,r),destroy:()=>destroyed=true};}
test('1.29 rayons : porte ouverte, fermée et mur détruit lus sans cache périmé',()=>{
 const f=fixture();f.plan.walls=[{x:7,y:0,w:.22,h:4},{x:7,y:6,w:.22,h:7}];assert.equal(f.line([2,5],[12,5],.3),true);assert.equal(f.line([2,3],[12,3],.3),false);f.plan.walls.push({x:7,y:4,w:.22,h:2});assert.equal(f.line([2,5],[12,5],.3),false);f.destroy();assert.equal(f.line([2,5],[12,5],.3),true);
});
test('1.29 rayons : balayage rond respecte coins tangents et évite le carré de marge artificiel',()=>{
 const f=fixture();f.plan.objects=[{id:'fixture-box',x:8,y:4,w:2,h:2}];
 assert.equal(f.line([7,3.7],[11,3.7],.3),false,'tangence plane traitée comme frontière solide');
 assert.equal(f.line([7,3.69],[11,3.69],.3),true);assert.equal(f.line([7,3.71],[11,3.71],.3),false);
 assert.equal(f.line([7.74,3.74],[7.76,3.76],.3),true,'coin arrondi libre, malgré présence dans boîte élargie');
 assert.equal(f.line([7.8,3.8],[7.82,3.82],.3),false,'coin rond effectivement touché');
});
test('1.29 rayons : origine, cible, point nul et segments sous18cm sont physiques',()=>{
 const f=fixture();f.plan.objects=[{id:'fixture-box',x:8,y:4,w:.015,h:2}];
 assert.equal(f.line([7.96,5],[8.06,5],.005),false,'un trait de 10 cm ne saute plus le meuble mince');
 assert.equal(f.line([8.007,5],[9,5],.005),false);assert.equal(f.line([7,5],[8.007,5],.005),false);assert.equal(f.line([8.007,5],[8.007,5],.005),false);assert.equal(f.line([7,5],[7,5],.005),true);
 assert.equal(f.line([7,5],[9,5],.005,0,'fixture-box'),true);assert.equal(f.line([7,5],[9,5],.005,0,'foreign-id'),false);
});
test('1.29 rayons : étage strict, mobilier propre au niveau, cible hors pièce refusée',()=>{
 const f=fixture(),up=f.w.plan(f.p,1);up.walls=[];up.objects=[{id:'up-object',x:7,y:4,w:1,h:2}];
 assert.equal(f.line([2,5],[12,5],.05,0),true);assert.equal(f.line([2,5],[12,5],.05,1),false);assert.equal(f.line([2,5],[12,5],.05,1,'up-object'),true);assert.equal(f.line([2,5],[f.p.w+1,5],.05,1),false);assert.equal(f.w.line(G.global(f.p,2,5),G.global(f.p,12,5),1,null),false);
});
for(const seed of[17117,42,903145])test('1.29 rayons : comparaison aux colliders du monde sur angles et longueurs graine '+seed,()=>{
 const w=W.create(seed,4),rnd=G.rng(seed);let verified=0,addedBlocking=0;
 for(let i=0;i<180;i++){
  const p=w.pois[i%w.pois.length],angle=rnd()*Math.PI*2,length=.1+rnd()*70,a=G.global(p,-10+rnd()*(p.w+20),-10+rnd()*(p.h+20)),b={x:a.x+Math.cos(angle)*length,y:a.y+Math.sin(angle)*length},radius=[.005,.05,.3][i%3];
  const clear=w.line(a,b,0,null,null,radius),n=Math.ceil(length/.025);let sampledBlocked=false;
  for(let k=0;k<=n;k++)if(w.blocked(a.x+(b.x-a.x)*k/n,a.y+(b.y-a.y)*k/n,radius)){sampledBlocked=true;break;}
  if(clear)assert.equal(sampledBlocked,false,'aucun obstacle effectivement échantillonné ne doit être traversé');else if(!sampledBlocked)addedBlocking++;
  verified++;
 }
 assert.equal(verified,180);assert.ok(addedBlocking<=5,'divergences bornées aux détails plus fins que 2,5 cm : '+addedBlocking);
});
test('1.29 rayons : arbres ronds, identifiant ignoré et longueur régionale',()=>{
 const w=W.create(17117,3);let tree;for(let y=0;y<5&&!tree;y++)for(let x=0;x<5&&!tree;x++)tree=w.chunk(x,y).trees.find(t=>!w.nearPOI(t.x,t.y,3).length);assert.ok(tree);const a={x:tree.x-1,y:tree.y},b={x:tree.x+1,y:tree.y};assert.equal(w.line(a,b),false);assert.equal(w.line(a,b,0,null,tree.id),true);assert.equal(w.line({x:1,y:1},{x:8191,y:8191}),false);
});
