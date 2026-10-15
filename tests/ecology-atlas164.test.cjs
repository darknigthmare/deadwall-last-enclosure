'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../src/core.js'),B=require('../src/biomes135.js'),E=require('../src/biomes164.js'),P=require('../src/atlas-projection.js'),Atlas=require('../src/field-atlas.js');
const {installFakeBrowser}=require('./helpers/browser.cjs');
function fixture(){
 const biomes=E.create({base:B,seed:42,settlements:[]}),newDefs=biomes.defs.filter(d=>!B.BY[d.id]);
 // Explicit named-site fixture isolates the knowledge boundary and UI catalogue.
 // It neither grants these discoveries in a campaign nor asserts a seed places every reference.
 const pois=newDefs.map((d,i)=>({id:'P'+String(i).padStart(4,'0'),name:'Lieu connu '+i,x:8600+i*80,y:9100,type:'house',biome:d.id,drive:{a:{x:8600+i*80,y:9050},b:{x:8600+i*80,y:9100}}}));
 const hidden={...pois[0],id:'P0099',name:'Lieu secret',x:9300};pois.push(hidden);
 let w={seed:42,generation:10,ecologyVersion:1,biomes,pois,towns:[],size:24576},f={version:2,generation:10,ecologyVersion:1,active:false,seen:pois.slice(0,4).map(p=>p.id),car:null};
 const g={world:{seed:42,buildings:new Map()},player:{dead:false,health:100},state:'playing',gameOver:false,resources:{food:100},units:[],elapsed:0,frontier:{world:()=>w,snapshot:()=>structuredClone(f),discoveries:()=>[...f.seen],active:()=>false},expeditions:{snapshot:()=>({analyst:null}),car:()=>null},canIssueCommand:()=>true,save:()=>true,serialize:()=>({}),restoreSave:()=>true,startNew(){},update(){},updateUI(){},frontierUI:{refresh(){},open(){},atlas:{focusPoint(){}}}};
 const previous={Core:globalThis.DeadwallCore,P:globalThis.DeadwallAtlasProjection};globalThis.DeadwallCore=C;globalThis.DeadwallAtlasProjection=P;Atlas.install(g);
 return{g,get w(){return w;},get f(){return f;},newDefs,hidden,replace(next){w=next;},restore(){globalThis.DeadwallCore=previous.Core;globalThis.DeadwallAtlasProjection=previous.P;}};
}
test('164 atlas: four added biome names and surfaces are available only for confirmed sites, with no save or RNG writes',()=>{
 const s=fixture();try{
  const before=JSON.stringify(s.f),random=Math.random;Math.random=()=>assert.fail('A guide consultation consumed randomness');
  try{const choices=s.g.fieldAtlas.biomeChoices();assert.deepEqual(choices.map(d=>d.id),s.newDefs.map(d=>d.id));assert.ok(choices.every(d=>d.known===1&&d.available===1));assert.equal(s.g.fieldAtlas.add(s.hidden.id),false);
   for(const p of s.w.pois.slice(0,4))assert.equal(s.g.fieldAtlas.add(p.id),true);
   const markers=s.g.fieldAtlas.mapView().steps;for(let i=0;i<markers.length;i++){assert.equal(markers[i].biome,s.newDefs[i].id);assert.equal(markers[i].biomeName,s.newDefs[i].name);assert.equal(markers[i].surface,s.newDefs[i].surface);assert.equal(markers[i].confirmed,true);}
   assert.ok(s.g.fieldAtlas.biomeChoices().every(d=>d.available===0));assert.equal(JSON.stringify(s.f),before);assert.equal(s.g.fieldAtlas.mapView().reports.length,0);
  }finally{Math.random=random;}
 }finally{s.restore();}
});
test('164 atlas UI: new biome selectors and known-site cards render native names and refresh for a replacement provider',()=>{
 installFakeBrowser({readyState:'interactive'});const s=fixture(),doc=globalThis.document,oldGame=globalThis.DEADWALL;globalThis.DEADWALL=s.g;
 try{
  for(const id of ['frontierDossier','frontierHud','reconPanel'])doc.body.append(doc.getElementById(id));
  const file=path.join(__dirname,'../src/field-atlas-ui.js');vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
  const get=id=>doc.body.querySelector('#'+id),panel=get('fieldAtlasPanel');assert.ok(panel);panel.open=true;s.g.fieldAtlasUI.refresh(true);
  assert.deepEqual(get('fieldAtlasBiome').children.map(n=>n.value),s.newDefs.map(d=>d.id));assert.ok(get('fieldAtlasBiome').children.every((n,i)=>n.textContent.startsWith(s.newDefs[i].name)));
  const filter=get('fieldAtlasFilter');filter.value='known';filter.dispatch('change');let labels=get('fieldAtlasCards').querySelectorAll('p').map(n=>n.textContent).join(' ');for(const d of s.newDefs)assert.ok(labels.includes(d.name),d.name);assert.ok(!labels.includes(s.hidden.name));
  const renamed={...s.w.biomes,defs:s.w.biomes.defs.map(d=>d.id===s.newDefs[0].id?{...d,name:'Terrasse réévaluée'}:d)};s.replace({...s.w,biomes:renamed});s.g.fieldAtlasUI.refresh(true);
  labels=get('fieldAtlasCards').querySelectorAll('p').map(n=>n.textContent).join(' ');assert.ok(labels.includes('Terrasse réévaluée'));assert.ok(get('fieldAtlasBiome').children[0].textContent.startsWith('Terrasse réévaluée'));assert.equal(s.g.fieldAtlas.snapshot().tour.stops.length,0);
 }finally{globalThis.DEADWALL=oldGame;s.restore();}
});
test('164 shipped game: new D17 ground forwards the exact regional provider and caches resolution across paint frames',()=>{
 const {g}=require('../scripts/qa-startup134.cjs').bootDocument134();g.startNew('standard','42');g.campaignIntro132.skip();
 const pose=g.frontier.position(),w=g.frontier.world(),Ground=globalThis.DeadwallGround135;assert.equal(pose.ecologyVersion,1);assert.equal(w.ecologyVersion,1);assert.equal(w.biomes.defs.length,16);
 const oldGround=Ground.draw,frontier=g.frontier,calls=[];let resolutions=0;g.frontier={...frontier,world(){resolutions++;return frontier.world();}};delete g.groundEcology164;
 Ground.draw=function(c,world,view,options){calls.push({world,view,options});return oldGround(c,world,view,options);};
 const canvas=require('@napi-rs/canvas').createCanvas(192,192),c=canvas.getContext('2d'),v={left:0,right:192,top:0,bottom:192},before=JSON.stringify(g.frontier.snapshot());
 try{
  for(let i=0;i<3;i++)g.drawGround(c,v);assert.equal(calls.length,3);assert.ok(calls.every(q=>q.world===w));assert.equal(resolutions,1,'Repeated paints do not resolve or reconstruct the full regional world per frame');
  const h=P.home(g);assert.deepEqual(calls[0].view,{left:h.minX,right:h.minX+6,top:h.minY,bottom:h.minY+6});assert.equal(calls[0].options.scale,g.camera.zoom*32);
  const pixels=c.getImageData(6,6,180,180).data;for(let i=3;i<pixels.length;i+=4)assert.equal(pixels[i],255);assert.equal(JSON.stringify(g.frontier.snapshot()),before,'Painting leaves saved ecological state and discoveries untouched');
 }finally{Ground.draw=oldGround;g.frontier=frontier;}
 // Prepare a real generated discovery explicitly to inspect its actual notebook entry.
 const site=w.pois.find(p=>!B.BY[p.biome]);assert.ok(site,'The chosen new seed has a real location in an added biome');g.frontier.revealSites([site.id]);
 const doc=globalThis.document;doc.getElementById('reconPanel').classList.remove('hidden');doc.getElementById('frontierFilter').value='all';g.frontierUI.refresh(true);
 const name=w.biomes.BY[site.biome].name,search=doc.getElementById('frontierSearch');search.value=name;search.dispatch('input');
 const card=doc.body.querySelectorAll('.frontier-place-card').find(n=>n.querySelector('strong').textContent===site.name);assert.ok(card,'Searching the added biome finds only already confirmed places');assert.ok(card.querySelector('small').textContent.includes(name));
 let edge=null;for(let y=500;y<w.size&&!edge;y+=1000)for(let x=500;x<w.size;x+=1000){const sample=w.biomeAt(x,y);if(!B.BY[sample.secondary]&&sample.blend>=.2){edge={x,y,sample};break;}}
 assert.ok(edge,'A real ecological transition leads toward an added biome');const snapshot=JSON.stringify(g.frontier.snapshot());g.frontierUI.atlas.focusPoint(edge.x,edge.y,220);
 assert.ok(doc.getElementById('atlasCoordinates').textContent.includes('transition vers '+w.biomes.BY[edge.sample.secondary].name));assert.equal(JSON.stringify(g.frontier.snapshot()),snapshot);
});
