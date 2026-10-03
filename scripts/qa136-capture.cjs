'use strict';
// Actual game and map painters, native Canvas, simulated DOM. No browser layout claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const {bootDocument134}=require('./qa-startup134.cjs');
const root=path.resolve(__dirname,'..');
async function run(seed=17117,phase='after',includeBiomes=false){
 const {createCanvas,loadImage,Image:NativeImage}=require('@napi-rs/canvas'),{g}=bootDocument134();
 g.startNew('standard',String(seed));g.campaignIntro132.skip();
 const Art=globalThis.DeadwallArt,Atlas=globalThis.DeadwallAtlasRender,P=globalThis.DeadwallAtlasProjection;
 const canvas=createCanvas(1440,960),ctx=canvas.getContext('2d');g.ctx=ctx;g.mctx=createCanvas(220,220).getContext('2d');g.width=1440;g.height=960;g.dpr=1;
 const create=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):create(tag);
 // Keep the production Art.load path, including dimension checks, matte decode,
 // action-frame isolation and sprite bounds. Only URLs are resolved to local files.
 globalThis.Image=class extends NativeImage{
  set src(value){try{super.src=typeof value==='string'&&!value.startsWith('data:')?path.join(root,value):value;}catch(error){this.onerror?.(error);}}
 };
 g.art=Art.create();await g.art.ready;
 assert.deepEqual(g.art.diagnostics.failed,[],'Tous les assets passent le véritable Art.load');
 assert.equal(g.art.diagnostics.ready.filter(k=>k.startsWith('art136')).length,27,'27 nouveaux PNG chargés par Art.load');
 const art136ImageDraws={},imageKeys=new Map(Object.entries(g.art.images).map(([key,image])=>[image,key])),contextPrototype=Object.getPrototypeOf(ctx),nativeDrawImage=contextPrototype.drawImage;
 contextPrototype.drawImage=function(source,...args){const key=imageKeys.get(source);if(key?.startsWith('art136'))art136ImageDraws[key]=(art136ImageDraws[key]||0)+1;return nativeDrawImage.call(this,source,...args);};
 const art136Draws={},blit=g.art.blit.bind(g.art);g.art.blit=(context,key,...args)=>{const result=blit(context,key,...args);if(key.startsWith('art136')&&result)art136Draws[key]=(art136Draws[key]||0)+1;return result;};
 g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;g.paused=true;
 const out=path.join(root,'reports/1.36.0/captures');fs.mkdirSync(out,{recursive:true});
 const regionActors=[],files=[],write=name=>{const file=`qa136-${phase}-${seed}-${name}.png`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));files.push(file);};
 Object.assign(g.camera,{x:g.player.x,y:g.player.y,zoom:.8,shake:0});g.render();write('d17');
 let equipmentCapture=null;
 if(seed===17117){
  g.paused=false;require('../tests/helpers/physical-fixtures.cjs').standAt(g,g.player,g.core());const arm=g.arsenal134;
  for(const id of ['hatchet','spikeFrame']){assert.equal(arm.begin('craft',id).ok,true,id+' payé au dépôt');for(let i=0;i<350&&arm.busy();i++)g.update(.04);assert.equal(arm.busy(),false);const item=arm.snapshot().locker.find(i=>i.id===id);assert.ok(item);assert.equal(arm.transfer(item.uid,'carried').ok,true);}
  const hatchet=arm.snapshot().carried.find(i=>i.id==='hatchet'),post=arm.snapshot().carried.find(i=>i.id==='spikeFrame');assert.equal(arm.equip(hatchet.uid).ok,true);
  let deployed=false;for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){g.player.facing=angle;if(arm.deploy(post.uid).ok){deployed=true;break;}}assert.ok(deployed,'Défense fabriquée et posée sur un emplacement libre');
  g.paused=true;g.dayClock=.44;g.weather=0;Object.assign(g.camera,{x:g.player.x,y:g.player.y,zoom:2.4,shake:0});g.render();write('equipment-post');equipmentCapture={equipped:'hatchet',post:'spikeFrame',file:files.at(-1),method:'Actual paid assembly, equipping and deployment; prepared camera only'};
 }

 const w=g.frontier.world(),v=g.frontier.overview();v.seen=w.pois.map(p=>p.id);const cam=P.camera(1440,960);cam.regionSize(w.size);cam.fit(w.size/2,w.size/2,w.size*1.04);
 const layers={terrain:true,roads:true,places:true,city:true,units:true,labels:true,gates:true,relays:false,routes:false,travelled:false};
 const t=performance.now();Atlas.render(ctx,g,v,cam,layers);const atlasMs=performance.now()-t,atlasWarmMs=[];for(let i=0;i<3;i++){const tick=performance.now();Atlas.render(ctx,g,v,cam,layers);atlasWarmMs.push(performance.now()-tick);}write('world');
 const home=P.model(g).core;cam.fit(home.x,home.y,4500);Atlas.render(ctx,g,v,cam,layers);write('home-region');
 const towns=w.towns.slice().sort((a,b)=>(b.radius||b.r)-(a.radius||a.r)),townCaptures=[];
 if(phase==='town')for(const [i,town]of [...new Map(towns.map(t=>[t.layout||'historique',t])).values()].entries()){
  cam.fit(town.x,town.y,(town.radius||town.r)*2.8);layers.labels=false;Atlas.render(ctx,g,v,cam,layers);write(i===0?'town':'town-'+town.layout);layers.labels=true;townCaptures.push({id:town.id,name:town.name,layout:town.layout,x:town.x,y:town.y,radius:town.radius||town.r,file:files.at(-1)});
 }
 const pois=w.pois.filter(p=>p.x>8000||p.y>8000),sample=pois[Math.floor(pois.length*.43)]||w.pois[30];
 function regionCapture(point,name,{scale=12,z=0,inside=null}={}){
  const save=g.serialize();Object.assign(save.frontier,{active:true,...point,z,inside,car:null,anchor:{x:g.player.x,y:g.player.y}});g.restoreSave(save);g.paused=true;g.width=canvas.width;g.height=canvas.height;g.dpr=1;g.frontier.scale(scale);Object.assign(g.input,{mouseX:1040,mouseY:480});
  const rv=g.frontier.overview(),p=g.actorPresentation.player(rv);assert.ok(Math.abs(p.x-rv.x*32)<1e-7&&Math.abs(p.y-rv.y*32)<1e-7,'Actor presentation uses actual regional domain');
  const actors=[],draw=g.art.drawActor.bind(g.art);g.art.drawActor=(ctx,entity,kind,...args)=>{const ok=draw(ctx,entity,kind,...args);if(kind==='player')actors.push({x:entity.x,y:entity.y,drawn:ok});return ok;};
  globalThis.DeadwallFrontierArt.render(g,rv);g.art.drawActor=draw;assert.ok(actors.some(a=>a.drawn&&Math.abs(a.x-rv.x*32)<1e-7&&Math.abs(a.y-rv.y*32)<1e-7),'Actual player sprite drawn at screen centre');write(name);regionActors.push({file:files.at(-1),screen:{x:g.width/2,y:g.height/2},position:{x:rv.x,y:rv.y,z:rv.z,inside:rv.inside},actors});
 }
 if(sample){let point={x:sample.x+32,y:sample.y+32};for(let k=0;w.blocked(point.x,point.y,.32)&&k<200;k++)point={x:sample.x+32+(k%20)*2,y:sample.y+32+Math.floor(k/20)*2};assert.equal(w.blocked(point.x,point.y,.32),false);regionCapture(point,'regional');}
 const biomeCaptures=[];
 if(includeBiomes){
  const chosen=JSON.parse(fs.readFileSync(path.join(root,'reports/1.35.0/captures/ground135-soils-gallery.json'),'utf8'));if(chosen.seed!==seed)throw Error('Biome capture points belong to another seed');
  for(const tile of chosen.tiles){let point={x:tile.x,y:tile.y};for(let r=0;w.blocked(point.x,point.y,.32)&&r<30;r++)point={x:tile.x+Math.cos(r)*r,y:tile.y+Math.sin(r)*r};
   const sampled=globalThis.DeadwallBiomes135.sample(seed,point.x,point.y);if(sampled.id!==tile.id)throw Error('Capture no longer in '+tile.id);
   regionCapture(point,'biome-'+tile.id);
   const chunks=w.around(point.x,point.y,60),nodes=chunks.flatMap(c=>[...c.trees,...c.rocks]).filter(n=>Math.abs(n.x-point.x)<60&&Math.abs(n.y-point.y)<40);
   biomeCaptures.push({id:tile.id,...point,trees:nodes.filter(n=>n.kind==='tree').length,rocks:nodes.filter(n=>n.kind==='rock').length,species:[...new Set(nodes.map(n=>n.species))],file:files.at(-1)});
  }
  const contact=createCanvas(1440,840),cc=contact.getContext('2d');cc.fillStyle='#101713';cc.fillRect(0,0,contact.width,contact.height);
  for(let i=0;i<biomeCaptures.length;i++){const b=biomeCaptures[i],x=i%4*360,y=Math.floor(i/4)*280;cc.drawImage(await loadImage(path.join(out,b.file)),x,y,360,240);cc.fillStyle='#e0d8ad';cc.font='13px sans-serif';cc.fillText(globalThis.DeadwallBiomes135.BY[b.id].name,x+10,y+257);cc.font='11px sans-serif';cc.fillText(b.trees+' arbres · '+b.rocks+' roches · extrait du monde généré',x+10,y+272);}
  fs.writeFileSync(path.join(out,'qa136-biomes-generated-contact.png'),contact.toBuffer('image/png'));
 }
 const G=globalThis.DeadwallFrontierGeometry;let technicalCapture=null;
 for(const p of w.pois.filter(p=>p.type==='generatorRoom'||p.type==='basementHouse')){
  for(const z of p.levels){const raw=w.plan(p,z).objects.find(o=>o.kind==='generator');if(!raw)continue;let point;
   for(let i=0;i<48;i++){const q=G.global(p,raw.x+raw.w/2+Math.cos(i*Math.PI/24)*(raw.w/2+.8),raw.y+raw.h/2+Math.sin(i*Math.PI/24)*(raw.h/2+.8)),lp=G.local(p,q.x,q.y);if(lp.x>.35&&lp.x<p.w-.35&&lp.y>.35&&lp.y<p.h-.35&&!w.blocked(q.x,q.y,.32,z,p.id)){point=q;break;}}
   if(point){regionCapture(point,'technical-interior',{scale:44,z,inside:p.id});technicalCapture={poi:p.id,type:p.type,object:raw.id,z,...point,file:files.at(-1)};break;}
  }if(technicalCapture)break;
 }
 assert.ok(technicalCapture,'Un intérieur technique existant est visible avec le joueur dans son vrai domaine');
 const roads=w.roads.filter(r=>Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>40),cardinal=roads.filter(r=>Math.min(Math.abs(r.b.x-r.a.x),Math.abs(r.b.y-r.a.y))/Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)<.025).length;
 const meta={phase,seed,artLoad:{ready:g.art.diagnostics.ready.length,failed:g.art.diagnostics.failed,method:'Production Art.load with native Image/Canvas; local URL paths'},art136:Object.keys(g.art.images).filter(k=>k.startsWith('art136')),art136Draws,art136ImageDraws,browser:false,prepared:true,painters:['Game.render','DeadwallAtlasRender.render','DeadwallFrontierArt.render'],generation:w.generation,extent:w.size,home,homeFraction:{x:home.x/w.size,y:home.y/w.size},roads:w.roads.length,pois:w.pois.length,towns:w.towns.length,cardinalRoadRatio:cardinal/roads.length,atlasMs,atlasWarmMs,biomeCaptures,townCaptures,technicalCapture,equipmentCapture,regionActors,files};
 fs.writeFileSync(path.join(out,`qa136-${phase}-${seed}.json`),JSON.stringify(meta,null,2)+'\n');contextPrototype.drawImage=nativeDrawImage;return meta;
}
module.exports={run};if(require.main===module)run(Number(process.argv[2]||17117),process.argv[3]||'after',process.argv.includes('--biomes')).then(r=>process.stdout.write(JSON.stringify(r)+'\n')).catch(e=>{console.error(e.stack);process.exitCode=1;});
