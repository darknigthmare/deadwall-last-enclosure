'use strict';
// Actual game and map painters, native Canvas, simulated DOM. No browser layout claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const {bootDocument134}=require('./qa-startup134.cjs');
const root=path.resolve(__dirname,'..');
async function run(seed=17117,phase='after',includeBiomes=false){
 const {createCanvas,loadImage}=require('@napi-rs/canvas'),{g}=bootDocument134();
 g.startNew('standard',String(seed));g.campaignIntro132.skip();
 const Art=globalThis.DeadwallArt,Atlas=globalThis.DeadwallAtlasRender,P=globalThis.DeadwallAtlasProjection;
 const canvas=createCanvas(1440,960),ctx=canvas.getContext('2d');g.ctx=ctx;g.mctx=createCanvas(220,220).getContext('2d');g.width=1440;g.height=960;g.dpr=1;
 const create=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):create(tag);
 globalThis.Image=class{set src(_){this.onerror?.();}};g.art=Art.create();await g.art.ready;
 for(const [key,spec]of Object.entries(Art.ASSETS)){
  const img=await loadImage(path.join(root,spec.url));
  if(['magenta','neutral'].includes(spec.matte)){
   const bitmap=createCanvas(img.width,img.height),bc=bitmap.getContext('2d');bc.drawImage(img,0,0);const data=bc.getImageData(0,0,img.width,img.height);Art.decodeMatte(data.data,img.width,img.height,spec.matte);bc.putImageData(data,0,0);g.art.images[key]=bitmap;
   const rects=key==='buildings'?Art.BUILDINGS:key==='props'?Art.PROPS:key==='defenses'?Art.DEFENSES:key==='districtProps'?Art.DISTRICT_PROPS:{};for(const [id,r]of Object.entries(rects))g.art.rects[key+':'+id]=Art.tightRect(data.data,img.width,r);
  }else g.art.images[key]=img;
 }
 g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;g.paused=true;
 const out=path.join(root,'reports/1.35.0/captures');fs.mkdirSync(out,{recursive:true});
 const regionActors=[],files=[],write=name=>{const file=`qa135-${phase}-${seed}-${name}.png`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));files.push(file);};
 Object.assign(g.camera,{x:g.player.x,y:g.player.y,zoom:.8,shake:0});g.render();write('d17');
 const w=g.frontier.world(),v=g.frontier.overview();v.seen=w.pois.map(p=>p.id);const cam=P.camera(1440,960);cam.regionSize(w.size);cam.fit(w.size/2,w.size/2,w.size*1.04);
 const layers={terrain:true,roads:true,places:true,city:true,units:true,labels:true,gates:true,relays:false,routes:false,travelled:false};
 const t=performance.now();Atlas.render(ctx,g,v,cam,layers);const atlasMs=performance.now()-t,atlasWarmMs=[];for(let i=0;i<3;i++){const tick=performance.now();Atlas.render(ctx,g,v,cam,layers);atlasWarmMs.push(performance.now()-tick);}write('world');
 const home=P.model(g).core;cam.fit(home.x,home.y,4500);Atlas.render(ctx,g,v,cam,layers);write('home-region');
 const towns=w.towns.slice().sort((a,b)=>(b.radius||b.r)-(a.radius||a.r)),townCaptures=[];
 if(phase==='town')for(const [i,town]of [...new Map(towns.map(t=>[t.layout||'historique',t])).values()].entries()){
  cam.fit(town.x,town.y,(town.radius||town.r)*2.8);layers.labels=false;Atlas.render(ctx,g,v,cam,layers);write(i===0?'town':'town-'+town.layout);layers.labels=true;townCaptures.push({id:town.id,name:town.name,layout:town.layout,x:town.x,y:town.y,radius:town.radius||town.r,file:files.at(-1)});
 }
 const pois=w.pois.filter(p=>p.x>8000||p.y>8000),sample=pois[Math.floor(pois.length*.43)]||w.pois[30];
 function regionCapture(point,name){
  const save=g.serialize();Object.assign(save.frontier,{active:true,...point,z:0,inside:null,car:null,anchor:{x:g.player.x,y:g.player.y}});g.restoreSave(save);g.paused=true;g.width=canvas.width;g.height=canvas.height;g.dpr=1;g.frontier.scale(12);Object.assign(g.input,{mouseX:1040,mouseY:480});
  const rv=g.frontier.overview(),p=g.actorPresentation.player(rv);assert.ok(Math.abs(p.x-rv.x*32)<1e-7&&Math.abs(p.y-rv.y*32)<1e-7,'Actor presentation uses actual regional domain');
  const actors=[],draw=g.art.drawActor.bind(g.art);g.art.drawActor=(ctx,entity,kind,...args)=>{const ok=draw(ctx,entity,kind,...args);if(kind==='player')actors.push({x:entity.x,y:entity.y,drawn:ok});return ok;};
  globalThis.DeadwallFrontierArt.render(g,rv);g.art.drawActor=draw;assert.ok(actors.some(a=>a.drawn&&Math.abs(a.x-rv.x*32)<1e-7&&Math.abs(a.y-rv.y*32)<1e-7),'Actual player sprite drawn at screen centre');write(name);regionActors.push({file:files.at(-1),screen:{x:g.width/2,y:g.height/2},position:{x:rv.x,y:rv.y},actors});
 }
 if(sample){let point={x:sample.x+32,y:sample.y+32};for(let k=0;w.blocked(point.x,point.y,.32)&&k<200;k++)point={x:sample.x+32+(k%20)*2,y:sample.y+32+Math.floor(k/20)*2};assert.equal(w.blocked(point.x,point.y,.32),false);regionCapture(point,'regional');}
 const biomeCaptures=[];
 if(includeBiomes){
  const chosen=JSON.parse(fs.readFileSync(path.join(out,'ground135-soils-gallery.json'),'utf8'));if(chosen.seed!==seed)throw Error('Biome capture points belong to another seed');
  for(const tile of chosen.tiles){let point={x:tile.x,y:tile.y};for(let r=0;w.blocked(point.x,point.y,.32)&&r<30;r++)point={x:tile.x+Math.cos(r)*r,y:tile.y+Math.sin(r)*r};
   const sampled=globalThis.DeadwallBiomes135.sample(seed,point.x,point.y);if(sampled.id!==tile.id)throw Error('Capture no longer in '+tile.id);
   regionCapture(point,'biome-'+tile.id);
   const chunks=w.around(point.x,point.y,60),nodes=chunks.flatMap(c=>[...c.trees,...c.rocks]).filter(n=>Math.abs(n.x-point.x)<60&&Math.abs(n.y-point.y)<40);
   biomeCaptures.push({id:tile.id,...point,trees:nodes.filter(n=>n.kind==='tree').length,rocks:nodes.filter(n=>n.kind==='rock').length,species:[...new Set(nodes.map(n=>n.species))],file:files.at(-1)});
  }
  const contact=createCanvas(1440,840),cc=contact.getContext('2d');cc.fillStyle='#101713';cc.fillRect(0,0,contact.width,contact.height);
  for(let i=0;i<biomeCaptures.length;i++){const b=biomeCaptures[i],x=i%4*360,y=Math.floor(i/4)*280;cc.drawImage(await loadImage(path.join(out,b.file)),x,y,360,240);cc.fillStyle='#e0d8ad';cc.font='13px sans-serif';cc.fillText(globalThis.DeadwallBiomes135.BY[b.id].name,x+10,y+257);cc.font='11px sans-serif';cc.fillText(b.trees+' arbres · '+b.rocks+' roches · extrait du monde généré',x+10,y+272);}
  fs.writeFileSync(path.join(out,'qa135-biomes-generated-contact.png'),contact.toBuffer('image/png'));
 }
 const roads=w.roads.filter(r=>Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>40),cardinal=roads.filter(r=>Math.min(Math.abs(r.b.x-r.a.x),Math.abs(r.b.y-r.a.y))/Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)<.025).length;
 const meta={phase,seed,browser:false,prepared:true,painters:['Game.render','DeadwallAtlasRender.render','DeadwallFrontierArt.render'],generation:w.generation,extent:w.size,home,homeFraction:{x:home.x/w.size,y:home.y/w.size},roads:w.roads.length,pois:w.pois.length,towns:w.towns.length,cardinalRoadRatio:cardinal/roads.length,atlasMs,atlasWarmMs,biomeCaptures,townCaptures,regionActors,files};
 fs.writeFileSync(path.join(out,`qa135-${phase}-${seed}.json`),JSON.stringify(meta,null,2)+'\n');return meta;
}
module.exports={run};if(require.main===module)run(Number(process.argv[2]||17117),process.argv[3]||'after',process.argv.includes('--biomes')).then(r=>process.stdout.write(JSON.stringify(r)+'\n')).catch(e=>{console.error(e.stack);process.exitCode=1;});
