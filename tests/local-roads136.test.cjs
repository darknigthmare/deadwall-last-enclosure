'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const E=require('../src/exploration-125.js'),Road=require('../src/region-roadkit.js'),legacy=require('./fixtures/local-roads135-render.json');
let native;try{native=require('@napi-rs/canvas');}catch{}
function recording(){const calls=[],ctx=new Proxy({}, {set(target,key,value){calls.push(['set',key,value]);target[key]=value;return true;},get(target,key){return key in target?target[key]:(...args)=>calls.push([key,...args]);}});return {ctx,calls};}
const view={left:0,top:0,right:4096,bottom:4096};
test('D17 1.36 : les layouts historiques 1/2 gardent exactement leurs commandes de peinture',()=>{
 for(const f of legacy.entries){const plan=E.createFeaturePlan(f.seed,4096,f.revision),{ctx,calls}=recording();E.drawRoadNetwork(ctx,plan,f.view);assert.equal(calls.length,f.commands);assert.equal(crypto.createHash('sha256').update(JSON.stringify(calls)).digest('hex'),f.sha256);}
});
test('D17 1.36 : peinture commune, matériaux, voies et raccords sans mutation du plan ni recalcul par image',()=>{
 const plan=E.createFeaturePlan(17117,4096,3),before=JSON.stringify(plan),calls=[];let spanCalls=0;
 globalThis.DeadwallRoadKit={...Road,markingSpans(...args){spanCalls++;return Road.markingSpans(...args);},drawNetwork(ctx,roads,options){calls.push({roads,options});return Road.drawNetwork(ctx,roads,options);}};
 try{E.drawRoadNetwork(recording().ctx,plan,view);const cold=spanCalls;assert.ok(cold>0);E.drawRoadNetwork(recording().ctx,plan,{left:1500,top:1500,right:2500,bottom:2500});assert.equal(spanCalls,cold);assert.equal(calls[0].roads,calls[1].roads);assert.equal(calls[0].options.spans,calls[1].options.spans);assert.equal(JSON.stringify(plan),before);
  const roads=calls[0].roads;for(const source of plan.roads){const r=roads.find(r=>r.id===source.id);assert.equal(r.width,source.width/32);assert.equal(r.markings,source.lanes>1);if(source.axis==='line'){assert.deepEqual(r.a,{x:source.x1/32,y:source.y1/32});assert.deepEqual(r.b,{x:source.x2/32,y:source.y2/32});}}
  for(const material of['dirt','gravel','concrete']){const source=plan.roads.find(r=>r.surface===material);if(source)assert.match(roads.find(r=>r.id===source.id).surfaceColor,/^#[0-9a-f]{6}$/);}
  const main=roads.find(r=>r.id==='main-west'),len=Math.hypot(main.b.x-main.a.x,main.b.y-main.a.y),spans=calls[0].options.spans.get(main);assert.ok(spans.length);assert.ok(spans.at(-1)[1]<len,'Marquage arrêté avant la desserte du dépôt');
  const oldSegments=roads;Object.assign(plan,E.createFeaturePlan(42,4096,3));E.drawRoadNetwork(recording().ctx,plan,view);assert.notEqual(calls.at(-1).roads,oldSegments);assert.ok(spanCalls>cold);
 }finally{globalThis.DeadwallRoadKit=Road;}
});
test('D17 1.36 : vrai Canvas produit asphalte lisible et axes contrastés, sans voie médiane dans la desserte',{skip:!native},()=>{
 const plan=E.createFeaturePlan(17117,4096,3),canvas=native.createCanvas(2048,2048),c=canvas.getContext('2d');c.fillStyle='#65754f';c.fillRect(0,0,2048,2048);c.scale(.5,.5);E.drawRoadNetwork(c,plan,view);
 const pixel=(x,y)=>Array.from(c.getImageData(Math.floor(x/2),Math.floor(y/2),1,1).data).slice(0,3);
 assert.deepEqual(pixel(600,2080),[80,92,83],'Surface commune avec la région');
 const axis=[];for(let x=200;x<900;x+=2)axis.push(pixel(x,2048));assert.ok(axis.some(rgb=>rgb[0]>145&&rgb[1]>145),'La peinture claire est réellement rendue');
 assert.deepEqual(pixel(1738,1920),[80,92,83],'La desserte simple reste sans ligne centrale');assert.deepEqual(pixel(1808,2048),[101,117,79],'Aucun cap circulaire ne déborde dans la cour au bout de la voie principale');
});
test('D17 1.36 : absence facultative du RoadKit conserve un rendu valide sans supprimer les routes',()=>{
 const previous=globalThis.DeadwallRoadKit;delete globalThis.DeadwallRoadKit;try{const {ctx,calls}=recording();E.drawRoadNetwork(ctx,E.createFeaturePlan(17117,4096,3),view);assert.ok(calls.some(c=>c[0]==='fillRect'));assert.ok(calls.some(c=>c[0]==='stroke'));}finally{globalThis.DeadwallRoadKit=previous;}
});
test('D17 1.36 : HTML et build chargent le peintre partagé avant son usage local',()=>{
 const root=path.resolve(__dirname,'..');for(const file of['index.html','scripts/build.mjs']){const s=fs.readFileSync(path.join(root,file),'utf8');assert.ok(s.indexOf('src/region-roadkit.js')<s.indexOf('src/exploration-125.js'));}
});
test('D17 1.36 : Game.drawGround branche réellement le réseau partagé dans l’ordre HTML livré',{skip:!native},()=>{
 const {g,doc}=require('../scripts/qa-startup134.cjs').bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 const kit=globalThis.DeadwallRoadKit,create=doc.createElement.bind(doc),ground=globalThis.DeadwallGround135;let calls=0;
 globalThis.DeadwallRoadKit={...kit,drawNetwork(...args){calls++;return kit.drawNetwork(...args);}};
 doc.createElement=tag=>tag==='canvas'?native.createCanvas(300,150):create(tag);ground.reset();
 try{const plan=JSON.stringify(g.exploration125.plan),canvas=native.createCanvas(640,480),ctx=canvas.getContext('2d');ctx.translate(320,240);ctx.scale(.5,.5);ctx.translate(-2048,-2048);g.drawGround(ctx,{left:1408,top:1568,right:2688,bottom:2528});assert.equal(calls,1);assert.equal(JSON.stringify(g.exploration125.plan),plan);assert.ok(ctx.getImageData(0,0,640,480).data.some(n=>n!==0));}
 finally{globalThis.DeadwallRoadKit=kit;doc.createElement=create;ground.reset();}
});
