'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js');
globalThis.DeadwallCore=C;globalThis.DeadwallFrontierGeometry=G;
require('../src/frontier-art.js');require('../src/essential-art.js');
const A=globalThis.DeadwallFrontierArt,E=globalThis.DeadwallEssentialArt,W=require('../src/world-evolution-art.js');
const view={l:-100,r:100,t:-100,b:100};
function room(angle=0){return{id:'P0',type:'house',x:0,y:0,w:10,h:8,a:angle,parking:[{id:'park',x:12,y:2,w:4.6,h:1.85,a:angle}],outdoor:[],generation:4};}
function fixture(p=room()){
 const plan={rooms:[{name:'Pièce',x:0,y:0,w:10,h:8}],objects:[{id:'desk',kind:'desk',x:3,y:3,w:3,h:1,amount:10}],walls:[{x:0,y:7.7,w:10,h:.3}],stairs:[]};
 const v={x:0,y:0,z:0,a:0,inside:p.id,scale:32,taken:{},seen:[p.id],enemies:[],bullets:[],world:{seed:17117,roads:[],pois:[p],plan:()=>plan,nearPOI:()=>[p],around:()=>[]}};
 const g={elapsed:0,state:'playing',world:{},player:{health:100},settings:{reducedMotion:true},expeditions:{driving:()=>false,car:()=>null},frontier:{active:()=>true,position:()=>v,visibleEnemy:()=>true},worldEvolution:{structureDestroyed:()=>false,overview:()=>({districts:[],companions:[],fleet:{active:'break'}}),groupMembers:()=>[]}};
 return{g,v,p,plan};
}
test('QA plans 1.30 : contact des rectangles et voitures réellement tournés, sans modifier les données',()=>{
 for(const angle of[0,Math.PI/2,Math.PI/3,Math.PI,-Math.PI/2]){const p=room(angle),o={x:2,y:1,w:3,h:2},before=JSON.stringify([p,o]);
  const expected=Math.max(...[[2,1],[5,1],[2,3],[5,3]].map(([x,y])=>G.global(p,x,y).y));assert.equal(A.rectDepth(p,o),expected);
  const c={x:0,y:6,a:angle,w:4,h:2};assert.ok(Math.abs(A.vehicleDepth(c)-(6+Math.abs(Math.sin(angle))*2+Math.abs(Math.cos(angle))))<1e-9);assert.equal(JSON.stringify([p,o]),before);
 }
});
test('QA plans 1.30 : meubles et véhicule ne restent pas toujours sous le joueur',()=>{
 const {g,v,p}=fixture(),tableDepth=A.lotEntries(g,p,v).find(e=>e.id==='desk').depth;
 for(const [y,before]of[[tableDepth-.5,true],[tableDepth+.5,false]]){v.y=y;const entries=A.depthEntries(g,v,view,[p]);assert.equal(entries.findIndex(e=>e.kind==='player')<entries.findIndex(e=>e.id==='desk'),before);}
 v.car={x:20,y:0,a:Math.PI/2};v.y=1;let entries=A.depthEntries(g,v,view,[p]);assert.ok(entries.findIndex(e=>e.kind==='player')<entries.findIndex(e=>e.id==='player-car'));
 v.y=3;entries=A.depthEntries(g,v,view,[p]);assert.ok(entries.findIndex(e=>e.kind==='player')>entries.findIndex(e=>e.id==='player-car'));
 v.car.driving=true;assert.equal(A.depthEntries(g,v,view,[p]).some(e=>e.kind==='player'),false);
});
test('QA plans 1.30 : arbre et rocher partagent la profondeur des pieds ; gisement épuisé retiré',()=>{
 const{g,v}=fixture(),rock={id:'rock',kind:'rock',x:0,y:3,r:1,a:0,amount:10},tree={id:'tree',kind:'tree',x:2,y:5,canopy:2,a:0,amount:10};v.world.around=()=>[{trees:[tree],rocks:[rock]}];v.y=2;
 let entries=A.depthEntries(g,v,view,[]);assert.deepEqual(entries.filter(e=>['player','rock','tree'].includes(e.kind)).map(e=>e.kind),['player','rock','tree']);
 v.y=6;entries=A.depthEntries(g,v,view,[]);assert.deepEqual(entries.filter(e=>['player','rock','tree'].includes(e.kind)).map(e=>e.kind),['rock','tree','player']);
 v.taken.rock=10;v.taken.tree=10;entries=A.depthEntries(g,v,view,[]);assert.equal(entries.some(e=>e.kind==='rock'),false);assert.equal(entries.some(e=>e.kind==='tree'),true,'un arbre récolté garde son petit tronc');
});
test('QA plans 1.30 : toit fermé masque les objets intérieurs mais pas le matériel dans la cour tournée',()=>{
 const{g,v,p}=fixture(room(Math.PI/3)),inside={...G.global(p,4,4),z:0,inside:p.id},outside={...G.global(p,-1,4),z:0,inside:null};v.inside=null;
 assert.equal(A.visiblePoint(g,inside,v),false);assert.equal(A.visiblePoint(g,outside,v),true);
 v.inside=p.id;assert.equal(A.visiblePoint(g,inside,v),true);v.inside=null;p.type='ruin';assert.equal(A.visiblePoint(g,inside,v),true);
 p.type='house';g.worldEvolution.structureDestroyed=()=>true;assert.equal(A.visiblePoint(g,inside,v),true);
});
test('QA plans 1.30 : étage isolé sans toit, voiture, cour ou végétation du rez-de-chaussée',()=>{
 const{g,v,p}=fixture();v.z=1;v.car={x:12,y:3,a:0};v.world.around=()=>{assert.fail('les végétaux extérieurs ne se consultent pas à l’étage');};
 const entries=A.depthEntries(g,v,view,[p]);assert.ok(entries.some(e=>e.id==='desk'));assert.ok(entries.some(e=>e.kind==='wall'));assert.equal(entries.some(e=>['car','roof','outdoor','tree','rock'].includes(e.kind)),false);
 assert.equal(A.visiblePoint(g,{x:0,y:0,z:1,inside:'P1'},v),false);assert.equal(A.visiblePoint(g,{x:0,y:0,z:0,inside:p.id},v),false);assert.equal(A.visiblePoint(g,{x:0,y:0,z:1,inside:p.id},v),true);
});
test('QA plans 1.30 : infectés et compagnons sont entre les meubles selon leur contact, et respectent la pièce à étage',()=>{
 const{g,v,p}=fixture();g.worldEvolution.overview=()=>({districts:[],companions:[{id:'samir',x:1,y:2,z:0,inside:p.id,health:100}]});v.enemies=[{id:'enemy',poi:p.id,x:2,y:3,z:0,hp:50}];
 let entries=A.depthEntries(g,v,view,[p]);assert.ok(entries.some(e=>e.kind==='infected'));assert.ok(entries.some(e=>e.kind==='companion'));assert.ok(entries.findIndex(e=>e.kind==='companion')<entries.findIndex(e=>e.kind==='infected'));
 v.z=1;v.enemies[0].z=1;assert.equal(W.depthEntries(g,v,view).some(e=>e.kind==='infected'),true,'résident utilise son poi comme intérieur');v.enemies[0].poi='P1';assert.equal(W.depthEntries(g,v,view).some(e=>e.kind==='infected'),false);
});
test('QA plans 1.30 : modules essentiels déposés ne flottent plus au-dessus des toits ou dans un autre étage',()=>{
 const{g,v,p}=fixture(),id=C.Essentials.content.jobs[0].id,point={domain:'region',x:0,y:0,z:0,inside:p.id};g.essentials={snapshot:()=>({jobs:{[id]:{stage:'ground',point}},effects:[]}),targets:()=>[]};
 assert.equal(E.depthEntries(g,'region',v,view).length,1);v.inside=null;assert.equal(E.depthEntries(g,'region',v,view).length,0);v.inside=p.id;v.z=1;assert.equal(E.depthEntries(g,'region',v,view).length,0);point.z=1;point.inside='P1';assert.equal(E.depthEntries(g,'region',v,view).length,0);point.inside=p.id;assert.equal(E.depthEntries(g,'region',v,view).length,1);
});
test('QA plans 1.30 : lampes, modules et portage local suivent le tri sans repeindre après les murs',()=>{
 const{game:g}=require('./helpers/expansions127.cjs').boot127();g.startNew('standard','17117');require('../src/essential-art.js');const raw=g.serialize(),id=C.Essentials.content.jobs[0].id;
 raw.nightGear={version:1,serial:3,devices:[{id:1,kind:'lantern',location:'placed',domain:'local',x:2400,y:2420,z:0,inside:null,angle:0,left:100,on:false,used:true},{id:2,kind:'torch',location:'belt',left:100,on:true,used:true}]};raw.frontier.seen.push(g.essentials.targets().find(t=>t.id===id).poi);raw.essentials.jobs[id]={stage:'ground',point:{domain:'local',x:2400,y:2380,z:0,inside:null}};g.restoreSave(raw);
 g.player.x=2400;g.player.y=2400;const entries=g.depthEntries({left:2340,right:2460,top:2340,bottom:2460});const moduleIndex=entries.findIndex(e=>e.entity.__essentialDraw),playerIndex=entries.findIndex(e=>e.kind===4),lightIndex=entries.findIndex(e=>e.entity.__nightGearDraw);assert.ok(moduleIndex>=0&&moduleIndex<playerIndex);assert.ok(lightIndex>playerIndex);
 const ctx=g.ctx,points=[];ctx.translate=(x,y)=>points.push([x,y]);g.drawRally(ctx);assert.equal(points.some(([x,y])=>x===2400&&[2380,2420].includes(y)),false,'aucun doublon par la passe HUD');
 const before=g.nightGear.snapshot();g.depthEntries({left:2340,right:2460,top:2340,bottom:2460,homeProjection:true});assert.deepEqual(g.nightGear.snapshot(),before);
});
test('QA plans 1.30 : le coin bas réel du rocher tourné fixe son contact',()=>{
 const {g,v}=fixture(),rock={id:'rotated-rock',kind:'rock',x:0,y:3,r:2,a:Math.PI/4,amount:10};
 v.world.around=()=>[{trees:[],rocks:[rock]}];v.y=5.5;
 const entries=A.depthEntries(g,v,view,[]),index=entries.findIndex(e=>e.id===rock.id);
 assert.ok(Math.abs(entries[index].depth-(3+2*Math.SQRT2))<1e-9);assert.ok(entries.findIndex(e=>e.kind==='player')<index);
});
test('QA plans 1.30 : une lecture Monde vivant partagée par toutes les passes régionales',()=>{
 const {g,v,p}=fixture();let reads=0;g.worldEvolution.overview=()=>{reads++;return{districts:[],companions:[],fleet:{active:'break'}};};v.car={x:20,y:0,a:0};
 const snapshot=g.worldEvolution.overview(),ctx={};W.drawGround(ctx,g,v,view,snapshot);A.depthEntries(g,v,view,[p],snapshot);
 assert.equal(reads,1,'le tri, la voiture et le sol réutilisent le relevé déjà lu');
});
test('QA plans 1.30 : le plan local ne construit jamais la région et la projection garde les peintres étendus',()=>{
 const{game:g}=require('./helpers/expansions127.cjs').boot127();g.startNew('standard','17117');
 const frontier=g.frontier;g.frontier={...frontier,world:()=>assert.fail('géométrie régionale créée par un rendu local')};
 const view={left:0,right:4096,top:0,bottom:4096,homeProjection:true};assert.ok(g.depthEntries(view).some(e=>e.entity.__exploration125Loot));
 require('../src/atlas-render.js');const render=globalThis.DeadwallAtlasRender;
 const node=g.world.nodes.find(n=>n.__exploration125Loot&&!n.depleted),original=g.drawNode.bind(g);let calls=0;
 g.drawNode=(ctx,n)=>{if(n===node)calls++;return original(ctx,n);};
 render.drawHome(g.ctx,g,{world:true,view:{left:4032,right:4160,top:4032,bottom:4160}});
 assert.equal(calls,1,'le même drawNode étendu est utilisé par D-17 vu de la région');g.frontier=frontier;
});
