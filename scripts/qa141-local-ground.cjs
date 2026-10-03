'use strict';
// Full production HTML/installer order, native Canvas and Art loader; simulated DOM only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createCanvas,Image}=require('@napi-rs/canvas');
const project=path.resolve(__dirname,'..'),phase=process.argv[2]||'after',source=process.argv[3]?path.resolve(process.argv[3]):project;
async function run(){
 const {g}=require(path.join(source,'scripts/qa-startup134.cjs')).bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 const canvas=createCanvas(1440,960);g.ctx=canvas.getContext('2d');g.mctx=createCanvas(220,220).getContext('2d');g.width=1440;g.height=960;g.dpr=1;
 const create=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):create(tag);
 globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'&&!v.startsWith('data:')?path.join(source,v):v;}};
 const fresh=globalThis.DeadwallArt.create();await fresh.ready;assert.deepEqual(fresh.diagnostics.failed,[]);for(const key of ['images','rects','actionFrames133','diagnostics','ready'])g.art[key]=fresh[key];
 const generation=g.frontier.position().generation;assert.equal(generation,phase==='before'?6:7);g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;g.paused=true;
 const out=path.join(project,'reports/1.41.0/captures');fs.mkdirSync(out,{recursive:true});const scenes=[];
 function paint(point,name){
  const stableSave=()=>{const value=g.serialize();delete value.timestamp;return value;};
  Object.assign(g.camera,{x:point.x,y:point.y,zoom:1.4,shake:0});const before=stableSave();g.render();assert.deepEqual(stableSave(),before,'Painting must not mutate a saved state (wall-clock save timestamp excluded)');
  const file=`qa141-${phase}-d17-${name}.png`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));scenes.push({file,camera:{...g.camera},generation,visibleNodes:g.depthEntries(g.viewBounds()).filter(e=>e.kind===0).map(e=>({id:e.entity.id,type:e.entity.type,variant:e.entity.variant,amount:e.entity.amount,radius:e.entity.radius,x:e.entity.x,y:e.entity.y}))});
 }
 paint(g.core(),'starting-world');const target=g.world.nodes.find(n=>!n.depleted&&n.type==='wood'&&n.variant!==2&&g.world.nodes.some(q=>!q.depleted&&q.type==='stone'&&Math.hypot(q.x-n.x,q.y-n.y)<400));assert.ok(target);paint(target,'natural-resources');
 const saved=g.serialize();assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.serialize().nodes,saved.nodes);assert.deepEqual(g.resources,saved.resources);assert.deepEqual(g.player.carry,saved.player.carry);assert.equal(g.frontier.position().generation,generation);
 const metadata={phase,seed:17117,generation,method:'Actual generated campaign Game.render after full HTML installation; native shared Art loader. Camera positioned for inspection, simulation paused. Actual save/load conserves resources and node quantities.',browser:false,domSimulated:true,assets:fresh.diagnostics.ready.length,failed:fresh.diagnostics.failed,draws:g.art.diagnostics.draws,scenes};
 if(phase==='after')assert.ok(Object.keys(metadata.draws).some(k=>/^art136(Oak|Beech|Birch|Pine|Fir|Willow|Poplar|Alder|Fruit|Limestone|Granite|Schist|Scree)$/.test(k)),'D17 natural nodes must really draw ecological sprites');
 fs.writeFileSync(path.join(out,`qa141-${phase}-d17-ground.json`),JSON.stringify(metadata,null,2)+'\n');return metadata;
}
run().then(r=>console.log(JSON.stringify({phase,generation:r.generation,assets:r.assets,scenes:r.scenes.length,draws:r.draws}))).catch(e=>{console.error(e.stack);process.exitCode=1;});
