'use strict';
// Actual ground and scenery painters, native Canvas; specimens are staged, not gameplay positions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createCanvas,Image}=require('@napi-rs/canvas');
const project=path.resolve(__dirname,'..'),phase=process.argv[2]||'after',source=process.argv[3]?path.resolve(process.argv[3]):project;
const B=require(path.join(source,'src/biomes135.js')),D=require(path.join(source,'src/ground135.js')),A=require(path.join(source,'src/assets136.js'));
globalThis.document={createElement:()=>createCanvas(1,1)};
async function run(){
 globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'&&!v.startsWith('data:')?path.join(source,v):v;}};
 const art=require(path.join(source,'src/art.js')).create();await art.ready;assert.deepEqual(art.diagnostics.failed,[]);globalThis.DEADWALL={art};
 const seed=17117,found={},generation=phase==='before'?6:7;
 // Fixed real G6 locations permit a direct presentation comparison; G7 examples follow below.
 for(let y=512;y<24000;y+=512)for(let x=512;x<24000;x+=512){const b=B.sample(seed,x,y);if(!found[b.id])found[b.id]={x,y};}
 const out=path.join(project,'reports/1.41.0/captures');fs.mkdirSync(out,{recursive:true});
 const gallery=createCanvas(1800,1470),c=gallery.getContext('2d'),panels=[];
 c.fillStyle='#18241d';c.fillRect(0,0,gallery.width,gallery.height);c.font='23px sans-serif';c.fillStyle='#eedfbc';c.fillText('MATIÈRES DU MONDE · '+phase.toUpperCase()+' · graine 17117 · peintres du jeu',24,34);
 c.font='15px sans-serif';c.fillText('12 positions réelles G6 identiques ; arbres, roches et petit décor placés pour comparer les silhouettes. Canvas natif, aucun navigateur.',24,58);
 for(let i=0;i<B.defs.length;i++){
  const def=B.defs[i],p=found[def.id],sx=i%4*450,sy=Math.floor(i/4)*460+76,w={seed,generation:6,biomeAt:(x,y)=>B.sample(seed,x,y)},view={l:p.x-12.5,r:p.x+12.5,t:p.y-11.5,b:p.y+11.5};
  c.save();c.beginPath();c.rect(sx,sy,450,414);c.clip();c.translate(sx+225,sy+207);c.scale(18,18);c.translate(-p.x,-p.y);D.draw(c,w,view,{scale:18});
  const tree=Object.keys(def.trees)[0],rock=Object.keys(def.rocks)[0];D.drawScenery(c,{id:'tree-'+i,x:p.x-5,y:p.y,r:.36,canopy:3.3,a:.8,kind:'tree',species:tree},{world:w,x:p.x,y:p.y},false);D.drawScenery(c,{id:'rock-'+i,x:p.x+5,y:p.y+2,r:1.1,a:.4,kind:'rock',species:rock},{world:w,x:p.x,y:p.y},false);
  const kinds=Object.keys(def.decor);for(let k=0;k<kinds.length;k++)D.drawDecor(c,{id:'specimen-'+i+'-'+k,x:p.x-8+k*4,y:p.y+7,a:k*1.7,r:.6,kind:kinds[k],color:['pebbles','rubble'].includes(kinds[k])?def.palette.rock:def.palette.grass});
  c.restore();c.fillStyle='#eddfb9';c.font='18px sans-serif';c.fillText(def.name,sx+12,sy+438);panels.push({id:def.id,...p,tree,rock,materials:D.materialAt?.(w,p.x,p.y)||null});
 }
 fs.writeFileSync(path.join(out,`qa141-${phase}-ground-gallery.png`),gallery.toBuffer('image/png'));
 const detail=createCanvas(1600,900),dc=detail.getContext('2d'),p=found.conifer,world={seed,generation,biomeAt:(x,y)=>B.sample(seed,x,y,true,{generation})},view={l:p.x-25,r:p.x+25,t:p.y-14.0625,b:p.y+14.0625};
 dc.scale(32,32);dc.translate(-view.l,-view.t);D.draw(dc,world,view,{scale:32});fs.writeFileSync(path.join(out,`qa141-${phase}-conifer-ground.png`),detail.toBuffer('image/png'));
 const actualScenes=[];
 if(phase==='after'){
  const G=require(path.join(source,'src/frontier-geometry.js')),Road=require(path.join(source,'src/region-roadkit.js'));require(path.join(source,'src/frontier-art.js'));const F=globalThis.DeadwallFrontierArt,w=require(path.join(source,'src/frontier-world.js')).create(seed,7),g=globalThis.DEADWALL;
  function paint(point,name,metadata){
   const canvas=createCanvas(1600,1000),ctx=canvas.getContext('2d'),scale=metadata.scale||20,v={x:point.x,y:point.y,z:0,inside:null,scale,taken:{},world:w},box={l:point.x-800/scale,r:point.x+800/scale,t:point.y-500/scale,b:point.y+500/scale},places=w.nearPOI(point.x,point.y,70),entries=[];
   ctx.scale(scale,scale);ctx.translate(-box.l,-box.t);D.draw(ctx,w,box,{scale});
   for(const chunk of w.around(point.x,point.y,65)){for(const d of chunk.decor||[])if(d.x>box.l-2&&d.x<box.r+2&&d.y>box.t-2&&d.y<box.b+2)D.drawDecor(ctx,d);for(const t of [...chunk.trees,...chunk.rocks])if(t.x>box.l-6&&t.x<box.r+6&&t.y>box.t-6&&t.y<box.b+6)entries.push({id:t.id,depth:t.y+(t.kind==='rock'?t.r:0),draw:c=>D.drawScenery(c,t,v,false)});}
   for(const p of places)F.lotGround(ctx,p,v);Road.drawNetwork(ctx,[...w.roads,...places.map(p=>p.drive)],{view:box});
   for(const p of places){F.lotFloor(ctx,p,v,g);entries.push(...F.lotEntries(g,p,v));}
   for(const entry of F.sortEntries(entries))entry.draw(ctx);
   const file=`qa141-after-${name}.png`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));actualScenes.push({file,point,view:box,scale,method:'Actual generated G7 ground, decorations, harvestable scenery, roads and parcels. Production painters; no actors or simulation reward staged.',...metadata});
  }
  const cabin=w.pois.find(p=>p.type==='cabin');assert.ok(cabin);paint(cabin,'natural-parcel',{place:{id:cabin.id,type:cabin.type,biome:cabin.biome},planObjects:w.plan(cabin,0).objects.length});
  for(const [kind,biomeName]of [['reeds','wetland'],['fallenBranch','conifer']]){
   const centre=found[biomeName],cx=Math.floor(centre.x/256),cy=Math.floor(centre.y/256);let target;
   for(let dy=-1;dy<=1&&!target;dy++)for(let dx=-1;dx<=1&&!target;dx++)target=w.chunk(cx+dx,cy+dy).decor?.find(d=>d.kind===kind&&!w.around(d.x,d.y,6).some(q=>q.trees.some(t=>Math.hypot(t.x-d.x,t.y-d.y)<t.canopy+1)));
   assert.ok(target,'Generated '+kind+' decoration required');const before=art.diagnostics.draws[kind==='reeds'?'art141Reeds':'art141FallenBranch']||0;
   paint(target,'generated-'+kind,{scale:44,decor:{...target},biome:w.biomeAt(target.x,target.y).id,habitat:w.biomeAt(target.x,target.y).habitat});
   assert.ok(art.diagnostics.draws[kind==='reeds'?'art141Reeds':'art141FallenBranch']>before,'Generated sprite must really blit');
  }
 }
 const metadata={phase,seed,generation,renderer:'Production ground135.draw/drawScenery/drawDecor, common native Art loader; gallery specimens staged only. Actual G7 scenes separately identified. Not browser or CSS QA',browser:false,panels,detail:{biome:'conifer',...p,view},actualScenes,assets:Object.keys(art.images),draws:art.diagnostics.draws,cache:D.cacheInfo()};
 fs.writeFileSync(path.join(out,`qa141-${phase}-ground.json`),JSON.stringify(metadata,null,2)+'\n');return metadata;
}
run().then(r=>console.log(JSON.stringify({phase,panels:r.panels.length,cache:r.cache,draws:r.draws}))).catch(e=>{console.error(e.stack);process.exitCode=1;});
