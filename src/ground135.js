/* Regional ground and botanical silhouettes. All samples use world metres, never camera or chunk RNG. */
(function(root){'use strict';
const TILE_CACHE_LIMIT=64,cache=new Map(),paletteCache=new Map();let textureStamps136=new WeakMap();
// Presentation scales are in metres. These fields never change movement, loot or collision.
const MATERIAL141={warp:24,warpAmplitude:8,patch:37,fine:7,density:18,detailStep:1.9};
const artwork=()=>root.DEADWALL?.art;
const texturesReady136=()=>['art136ForestFloor','art136WetGround'].map(k=>artwork()?.images?.[k]?1:0).join('');
const FALLBACK={base:'#69714a',secondary:'#5b653f',soil:'#8d7858',accent:'#b7a36e',rock:'#a49f8b',grass:'#849064',water:'#50645a'};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
function hash(seed,x,y,salt=0){let h=(seed^Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(salt,1442695041))>>>0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function noise(seed,x,y,w,salt){x/=w;y/=w;const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return mix(mix(hash(seed,ix,iy,salt),hash(seed,ix+1,iy,salt),u),mix(hash(seed,ix,iy+1,salt),hash(seed,ix+1,iy+1,salt),u),v);}
function rgb(hex){if(Array.isArray(hex))return hex;hex=String(hex||'#68704b').replace('#','');if(hex.length===3)hex=hex.split('').map(s=>s+s).join('');return[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)||0);}
function palette(p){p=p||FALLBACK;const key=Object.values(p).join('');if(paletteCache.has(key))return paletteCache.get(key);const out={};for(const k of Object.keys(FALLBACK))out[k]=rgb(p[k]||FALLBACK[k]);paletteCache.set(key,out);if(paletteCache.size>128)paletteCache.delete(paletteCache.keys().next().value);return out;}
function biome(world,x,y){return world.biomeAt?.(x,y)||root.DeadwallBiomes135?.sample(world.seed,x,y,true,{generation:world.generation})||{id:'meadow',palette:FALLBACK};}
function materials(world,x,y,b=biome(world,x,y)){
 const weights=b.weights||{[b.id]:1},sum=(...ids)=>ids.reduce((n,id)=>n+(weights[id]||0),0),habitat=b.habitat,
  forest=sum('deciduous','mixed','conifer'),wet=sum('wetland','riparian'),stone=sum('limestone','rockyHighland'),dry=sum('heath','limestone'),field=sum('meadow','bocage','orchard'),industrial=sum('brownfield'),
  wx=x+(noise(world.seed,x,y,MATERIAL141.warp,912)-.5)*MATERIAL141.warpAmplitude,wy=y+(noise(world.seed,x,y,MATERIAL141.warp,913)-.5)*MATERIAL141.warpAmplitude,
  patch=noise(world.seed,wx,wy,MATERIAL141.patch,921),fine=noise(world.seed,wx,wy,MATERIAL141.fine,922),cover=noise(world.seed,wx,wy,MATERIAL141.density,923),
  canopy=habitat?.canopy??forest,openness=habitat?.openness??clamp(1-forest*.68),mineral=habitat?.mineral??stone,wetness=habitat?.wetness??wet;
 const orchardRow=habitat?.rowStrength||0;
 return{forest,wet,stone,dry,field,industrial,canopy,openness,mineral,wetness,orchardRow,
  litter:clamp(canopy*(.30+patch*.62)+sum('orchard')*.17),
  soil:clamp((fine-.30)*.67+dry*(.15+patch*.28)+industrial*(.10+patch*.27)+(1-openness)*.10+orchardRow*.42),
  mineralCover:clamp(mineral*(.14+Math.pow(patch,1.4)*.72)+industrial*fine*.20),
  damp:clamp(wetness*(.16+fine*.64)),
  grassCover:clamp((.23+cover*.73)*(1-mineral*.56)*(1-canopy*.47)),patch,fine,cover};
}
function materialAt(world,x,y){return materials(world,x,y);}
function tinted(world,x,y){
 const b=biome(world,x,y),p=palette(b.palette||b.def?.palette),m=materials(world,x,y,b),dry=clamp((noise(world.seed,x,y,110,79)-.40)*.50);
 return[0,1,2].map(i=>{
  let value=mix(p.base[i],p.secondary[i],dry);
  value=mix(value,p.soil[i],m.soil*.70+m.litter*.24);
  value=mix(value,p.rock[i],m.mineralCover*.48);
  value=mix(value,p.grass[i],m.grassCover*m.openness*.12);
  // Dark damp earth remains a walkable mud surface; no fake pond is painted.
  return value*(1-m.damp*.12-m.litter*.055);
 });
}
// Interpolate a world-anchored colour lattice: neighbouring tiles share exactly the same edge samples.
function colorAt(world,x,y,spacing=4){const a=Math.floor(x/spacing)*spacing,b=Math.floor(y/spacing)*spacing,fx=(x-a)/spacing,fy=(y-b)/spacing,p=tinted(world,a,b),q=tinted(world,a+spacing,b),r=tinted(world,a,b+spacing),s=tinted(world,a+spacing,b+spacing),n=(noise(world.seed,x,y,1.8,52)-.5)*11+(noise(world.seed,x,y,.24,82)-.5)*6;return[0,1,2].map(i=>Math.round(clamp(mix(mix(p[i],q[i],fx),mix(r[i],s[i],fx),fy)+n,0,255)));}
function canvas(w,h){let out;if(typeof root.OffscreenCanvas==='function')out=new root.OffscreenCanvas(w,h);else out=root.document?.createElement?.('canvas');if(!out)return null;out.width=w;out.height=h;return out;}
function chooseLOD(scale,map){if(map||scale<.15)return{span:4096,res:64,spacing:512,detail:false};if(scale<1.25)return{span:512,res:128,spacing:32,detail:false};if(scale<6)return{span:128,res:192,spacing:8,detail:true};return{span:32,res:256,spacing:4,detail:true};}
function tile(world,tx,ty,lod){const key=[world.seed,world.generation,lod.span,tx,ty,texturesReady136()].join(':');if(cache.has(key)){const out=cache.get(key);cache.delete(key);cache.set(key,out);return out;}
 const mpp=lod.span/lod.res,edge=lod.res+2,c=canvas(edge,edge),ctx=c?.getContext?.('2d');if(!ctx||typeof ctx.createImageData!=='function')return null;
 const data=ctx.createImageData(edge,edge);if(!data?.data||data.data.length!==edge*edge*4)return null;const buf=data.data,startX=tx*lod.span,startY=ty*lod.span,spacing=lod.spacing,cols=new Map();
 const at=(x,y)=>{const k=x+':'+y;let p=cols.get(k);if(!p){p=tinted(world,x,y);cols.set(k,p);}return p;};
 for(let py=0;py<edge;py++){const y=startY+(py-.5)*mpp,gy=Math.floor(y/spacing)*spacing,fy=(y-gy)/spacing;
  for(let px=0;px<edge;px++){const x=startX+(px-.5)*mpp,gx=Math.floor(x/spacing)*spacing,fx=(x-gx)/spacing,p=at(gx,gy),q=at(gx+spacing,gy),r=at(gx,gy+spacing),s=at(gx+spacing,gy+spacing),variation=lod.detail?(noise(world.seed,x,y,1.8,52)-.5)*11+(noise(world.seed,x,y,.24,82)-.5)*6:0,i=(py*edge+px)*4;
   for(let k=0;k<3;k++)buf[i+k]=clamp(Math.round(mix(mix(p[k],q[k],fx),mix(r[k],s[k],fx),fy)+variation),0,255);buf[i+3]=255;
  }
 }
 ctx.putImageData(data,0,0);if(lod.detail){ctx.save();ctx.translate(1-startX/mpp,1-startY/mpp);ctx.scale(1/mpp,1/mpp);const view={l:startX-mpp,r:startX+lod.span+mpp,t:startY-mpp,b:startY+lod.span+mpp};textureDetail136(ctx,world,view);detail(ctx,world,view);ctx.restore();}
 const out={canvas:c,mpp,span:lod.span,res:lod.res};cache.set(key,out);if(cache.size>TILE_CACHE_LIMIT)cache.delete(cache.keys().next().value);return out;
}
function textureStamp136(image){
 if(textureStamps136.has(image))return textureStamps136.get(image);const out=canvas(256,256),c=out?.getContext('2d');if(!c)return null;
 c.drawImage(image,0,0,256,256);c.globalCompositeOperation='destination-in';const fade=c.createRadialGradient(128,128,48,128,128,128);fade.addColorStop(0,'#fff');fade.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=fade;c.fillRect(0,0,256,256);textureStamps136.set(image,out);return out;
}
function textureDetail136(c,world,view){
 const art=artwork(),forest=art?.images?.art136ForestFloor,wet=art?.images?.art136WetGround;if(!forest&&!wet)return;
 const step=6,pad=12;for(let iy=Math.floor((view.t-pad)/step);iy<=Math.floor((view.b+pad)/step);iy++)for(let ix=Math.floor((view.l-pad)/step);ix<=Math.floor((view.r+pad)/step);ix++){
  const x=(ix+hash(world.seed,ix,iy,736))*step+(noise(world.seed,ix*step,iy*step,27,745)-.5)*3,y=(iy+hash(world.seed,ix,iy,737))*step+(noise(world.seed,ix*step,iy*step,27,746)-.5)*3,b=biome(world,x,y),m=materials(world,x,y,b),f=m.litter*.75+m.forest*.25,w=m.wet*.50+m.damp*.50;
  const image=w>f?wet:forest,strength=Math.max(f,w);if(!image||strength<.04||hash(world.seed,ix,iy,740)>.30+m.patch*.85)continue;const stamp=textureStamp136(image);if(!stamp)continue;
  const size=step*(.85+hash(world.seed,ix,iy,738)*1.05);c.save();c.translate(x,y);c.rotate(hash(world.seed,ix,iy,739)*Math.PI*2);c.scale(1,.70+hash(world.seed,ix,iy,741)*.58);c.globalAlpha=(.28+hash(world.seed,ix,iy,742)*.17)*strength;c.drawImage(stamp,-size/2,-size/2,size,size);c.restore();
 }
}
function microKind(b,m,n){
 const w=b.weights||{[b.id]:1},entries=[['stone',.12+m.stone*4+m.dry+m.industrial*1.6],['leaf',m.forest*3+(w.orchard||0)],['needle',(w.conifer||0)*3],['reeds',m.wet*3],['rubble',m.industrial*3.2],['dryGrass',m.dry*3+m.field*.55],['flowers',(w.meadow||0)*1.2+(w.orchard||0)*1.4+(w.heath||0)*.65],['twig',m.forest+m.wet*.3],['grass',.45+m.field*3+m.wet+m.forest*.7]];
 let target=n*entries.reduce((sum,[,weight])=>sum+weight,0);for(const [kind,weight]of entries){target-=weight;if(target<0)return kind;}return'grass';
}
function detail(c,world,view){const step=MATERIAL141.detailStep,pad=1.1,seed=world.seed;
 for(let iy=Math.floor((view.t-pad)/step);iy<=Math.floor((view.b+pad)/step);iy++)for(let ix=Math.floor((view.l-pad)/step);ix<=Math.floor((view.r+pad)/step);ix++){
  const n=hash(seed,ix,iy,311),x=(ix+hash(seed,ix,iy,312))*step,y=(iy+hash(seed,ix,iy,313))*step,b=biome(world,x,y),m=materials(world,x,y,b);
  if(n>.18+m.cover*.67+m.mineralCover*.10)continue;
  const p=b.palette||b.def?.palette||FALLBACK,angle=hash(seed,ix,iy,314)*Math.PI*2,size=.09+hash(seed,ix,iy,315)*.26,kind=microKind(b,m,hash(seed,ix,iy,316));
  c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=.40+hash(seed,ix,iy,318)*.32;c.strokeStyle=p.grass;c.lineWidth=.026;c.beginPath();
  if(kind==='rubble'){c.fillStyle=n<.23?p.rock:p.soil;c.fillRect(-size*.55,-size*.3,size*1.1,size*.6);c.strokeStyle=p.accent;c.moveTo(-size*.4,-size*.1);c.lineTo(size*.28,size*.18);c.stroke();}
  else if(kind==='stone'){c.fillStyle=p.rock;for(let i=0;i<2+(m.stone>.35?2:0);i++){c.beginPath();c.ellipse((hash(seed,ix+i,iy,319)-.5)*size*2,(hash(seed,ix,iy+i,320)-.5)*size,size*(.30+hash(seed,ix+i,iy,321)*.34),size*.20,i,0,Math.PI*2);c.fill();}c.fillStyle=p.accent;c.beginPath();c.ellipse(size*.16,-size*.08,size*.20,size*.10,0,0,Math.PI*2);c.fill();}
  else if(kind==='leaf'){c.fillStyle=n<.30?p.soil:p.accent;for(let i=0;i<4;i++){c.beginPath();c.ellipse((i-1.5)*size*.47,i%2*size*.39,size*.40,size*.17,i*.9,0,Math.PI*2);c.fill();}}
  else if(kind==='needle'){c.strokeStyle=p.soil;c.lineWidth=.023;for(let i=0;i<5;i++){const x=(i-2)*size*.3;c.moveTo(x,-size*.2);c.lineTo(x+size*.6,size*.7);}c.stroke();}
  else if(kind==='reeds'){c.globalAlpha*=.42;c.fillStyle=p.soil;c.beginPath();c.ellipse(0,0,size*1.65,size*.88,0,0,Math.PI*2);c.fill();c.globalAlpha=.70;c.strokeStyle=p.grass;c.beginPath();for(let i=-1;i<2;i++){c.moveTo(i*size*.46,size*.1);c.lineTo(i*size*.51,-size*(1.1+hash(seed,ix+i,iy,322)*.8));}c.stroke();}
  else if(kind==='twig'){c.strokeStyle=p.soil;c.lineWidth=.045;c.moveTo(-size,0);c.lineTo(size*.9,size*.16);c.moveTo(-size*.3,size*.02);c.lineTo(size*.10,-size*.33);c.stroke();}
  else{c.strokeStyle=kind==='dryGrass'?p.accent:p.grass;for(let i=0;i<3;i++){const xx=(i-1)*size*.4;c.moveTo(xx,size*.2);c.quadraticCurveTo(xx-size*.12,-size*.32,xx+(i-1)*size*.25,-size*(.85+hash(seed,ix+i,iy,323)*.55));}c.stroke();if(kind==='flowers'){c.fillStyle=p.accent;for(let i=0;i<3;i++){c.beginPath();c.arc((i-1)*size*.54,-size,.035,0,Math.PI*2);c.fill();}}}c.restore();
 }
}
function bounds(v){return{l:v.l??v.left,r:v.r??v.right,t:v.t??v.top,b:v.b??v.bottom};}
function draw(c,world,rawView,{scale=32,map=false}={}){if(!world||world.generation<6)return false;const v=bounds(rawView);if(!Object.values(v).every(Number.isFinite))return false;const lod=chooseLOD(scale,map);c.save();c.beginPath();c.rect(v.l,v.t,v.r-v.l,v.b-v.t);c.clip();c.imageSmoothingEnabled=true;
 for(let ty=Math.floor(v.t/lod.span);ty<Math.ceil(v.b/lod.span);ty++)for(let tx=Math.floor(v.l/lod.span);tx<Math.ceil(v.r/lod.span);tx++){
  const t=tile(world,tx,ty,lod);if(t)c.drawImage(t.canvas,tx*t.span-t.mpp,ty*t.span-t.mpp,t.span+t.mpp*2,t.span+t.mpp*2);else{c.fillStyle=biome(world,tx*lod.span,ty*lod.span).palette?.base||FALLBACK.base;c.fillRect(tx*lod.span,ty*lod.span,lod.span,lod.span);}
 }c.restore();return true;}
function identifier(s){let h=0;for(const a of String(s))h=(Math.imul(h,31)+a.charCodeAt(0))>>>0;return h;}
function polygon(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();}
function drawRock(c,t,seed){const key=root.DeadwallAssets136?.ROCK_SPRITES[t.species];if(key&&root.DeadwallAssets136.drawSprite(c,artwork(),key,t.x,t.y,(t.r||.8)*2,(t.r||.8)*2,{angle:t.a||0}))return;const r=t.r||.8,limestone=['limestone','chalk'].includes(t.species),slate=['schist','slate','scree'].includes(t.species),base=root.DeadwallBiomes135?.ROCKS?.[t.species]?.color||(limestone?'#b8b39d':slate?'#777f7b':'#96988b');
 const points=[];for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=r*(1.09+hash(seed,i,0,6)*.045);points.push([Math.cos(a)*rr,Math.sin(a)*rr]);}
 c.save();c.translate(t.x,t.y);c.rotate(t.a||0);c.fillStyle='rgba(16,21,18,.22)';c.beginPath();c.ellipse(.11,.17,r*1.2,r*.94,0,0,Math.PI*2);c.fill();polygon(c,points);c.fillStyle=base;c.fill();c.strokeStyle=slate?'#57605c':'#797d6c';c.lineWidth=.045;c.stroke();
 polygon(c,[points[5],points[6],points[7],[r*.22,-r*.11],[-r*.32,r*.2]]);c.fillStyle=root.DeadwallBiomes135?.ROCKS?.[t.species]?.highlight||(limestone?'#d7d2b7':slate?'#a0aaa0':'#b9b9a6');c.fill();polygon(c,[points[0],points[1],points[2],points[3],[-r*.32,r*.2],[r*.22,-r*.11]]);c.fillStyle=limestone?'#989d82':slate?'#636e69':'#777f6d';c.fill();
 c.strokeStyle='rgba(38,51,40,.35)';c.lineWidth=.045;c.beginPath();c.moveTo(-r*.55,-r*.1);c.lineTo(-r*.16,r*.04);c.lineTo(r*.18,r*.48);c.stroke();c.fillStyle='rgba(89,111,61,.45)';for(let i=0;i<4;i++){c.beginPath();c.arc((hash(seed,i,8)-.5)*r,(hash(seed,i,9)-.5)*r,.045+hash(seed,i,10)*.09,0,Math.PI*2);c.fill();}c.restore();}
function drawTree(c,t,v,used,seed){const species=t.species||'oak',r=used?Math.min(t.r||.3,.18):(t.r||.3),canopy=t.canopy||3,conifer=['pine','fir','scrubPine','juniper'].includes(species),willow=species==='willow',birch=species==='birch',fruit=['fruit','apple','pear','olive'].includes(species);
 c.save();c.translate(t.x,t.y);c.fillStyle='rgba(15,26,17,.14)';c.beginPath();c.ellipse(.28,.40,(used?r*1.35:canopy*.83),(used?r:canopy*.59),0,0,Math.PI*2);c.fill();c.fillStyle=root.DeadwallBiomes135?.TREES?.[species]?.bark||(birch?'#c4c5ae':'#78674c');c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.strokeStyle='#443e2e';c.lineWidth=.05;c.stroke();
 if(used){c.fillStyle='#baa174';c.beginPath();c.arc(0,0,r*.78,0,Math.PI*2);c.fill();c.strokeStyle='#796845';c.lineWidth=.035;c.beginPath();c.arc(0,0,r*.47,0,Math.PI*2);c.stroke();c.restore();return;}
 const near=Math.hypot(t.x-v.x,t.y-v.y)<canopy; c.globalAlpha=near?.32:.97;c.rotate(t.a||0);
 const key=root.DeadwallAssets136?.TREE_SPRITES[species];if(key&&root.DeadwallAssets136.drawSprite(c,artwork(),key,0,0,canopy*2,canopy*2)){c.restore();return;}
if(species==='poplar')c.scale(.64,1.08);
 c.strokeStyle=birch?'#aeb19a':'#756a4a';c.lineWidth=r*.47;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*canopy*.66,Math.sin(a)*canopy*.66);c.stroke();}
 if(conifer){
  for(let layer=0;layer<3;layer++){const len=canopy*(1-layer*.22),pts=[];for(let i=0;i<36;i++){const a=(i+hash(seed,i,layer,2)*.35)*Math.PI/18,rr=len*(i%3===0?.77+hash(seed,i,layer,7)*.23:.48+hash(seed,i,layer,19)*.30);pts.push([Math.cos(a)*rr,Math.sin(a)*rr*.86]);}polygon(c,pts);const grad=c.createRadialGradient(-len*.2,-len*.2,0,0,0,len);grad.addColorStop(0,(species==='fir'?['#48685a','#597867','#728b71']:['#596e4d','#637b54','#7b8f62'])[layer]);grad.addColorStop(1,(species==='fir'?['#263e35','#314b3e','#3c5d49']:['#304838','#395440','#486248'])[layer]);c.fillStyle=grad;c.fill();}
  c.lineWidth=.035;for(let i=0;i<42;i++){const a=hash(seed,i,31)*Math.PI*2,d=(.13+hash(seed,i,32)*.64)*canopy,x=Math.cos(a)*d,y=Math.sin(a)*d*.8;c.strokeStyle=i%2?'rgba(163,174,117,.35)':'rgba(20,40,29,.32)';c.beginPath();c.moveTo(x,y);c.lineTo(x-Math.cos(a-.25)*canopy*.19,y-Math.sin(a-.25)*canopy*.19);c.moveTo(x,y);c.lineTo(x-Math.cos(a+.25)*canopy*.19,y-Math.sin(a+.25)*canopy*.19);c.stroke();}
 }else{
  const colors=willow?['#586944','#6c7c48','#84935a']:birch?['#6a7b47','#7e9054','#9aab6e']:fruit?['#4e6740','#637b49','#7c8a4d']:species==='beech'?['#5d663c','#738046','#8e965c']:species==='alder'?['#385540','#51714b','#769064']:species==='poplar'?['#617443','#839358','#a1b275']:['#455e3d','#597444','#78884e'];
  const count=willow?12:9;for(let i=0;i<count;i++){const a=i*Math.PI*2/count,d=(i===count-1?0:canopy*(.34+hash(seed,i,1,6)*.18)),rx=canopy*(.40+hash(seed,i,2,9)*.10),ry=rx*(willow?1.23:.88);const xx=Math.cos(a)*d,yy=Math.sin(a)*d,grad=c.createRadialGradient(xx-rx*.26,yy-ry*.30,rx*.03,xx,yy,Math.max(rx,ry));grad.addColorStop(0,colors[2]);grad.addColorStop(.53,colors[1]);grad.addColorStop(1,colors[0]);c.fillStyle=grad;c.beginPath();c.ellipse(xx,yy,rx,ry,a*.15,0,Math.PI*2);c.fill();}
  for(let i=0;i<37;i++){const a=hash(seed,i,4,8)*Math.PI*2,d=hash(seed,i,7,4)*canopy*.73;c.fillStyle=i%3===0?'rgba(180,189,109,.27)':'rgba(26,55,27,.16)';c.beginPath();c.ellipse(Math.cos(a)*d,Math.sin(a)*d,canopy*(.035+hash(seed,i,9,7)*.040),canopy*.021,a,0,Math.PI*2);c.fill();}
  if(fruit){c.fillStyle='#bb9763';for(let i=0;i<5;i++){c.beginPath();c.arc((hash(seed,i,12)-.5)*canopy,(hash(seed,i,13)-.5)*canopy,.065,0,Math.PI*2);c.fill();}}
  if(willow){c.strokeStyle='rgba(160,171,99,.36)';c.lineWidth=.055;for(let i=0;i<8;i++){const x=(i/7-.5)*canopy*1.4;c.beginPath();c.moveTo(x,-canopy*.24);c.quadraticCurveTo(x+.12,canopy*.42,x-.1,canopy*.81);c.stroke();}}
 }
 c.restore();}
function drawScenery(c,t,v,used){if((v.world?.generation??t.generation??0)<6)return false;const seed=identifier(t.id);if(t.kind==='rock')drawRock(c,t,seed);else drawTree(c,t,v,used,seed);return true;}
function drawDecor(c,d){c.save();c.translate(d.x,d.y);c.rotate(d.a||0);const r=Math.min(1.4,d.r||.5),seed=identifier(d.id||[d.x,d.y,d.kind].join(':'));c.globalAlpha=.82;c.strokeStyle=d.color||'#929068';c.fillStyle=d.color||'#929068';c.lineWidth=.045;
 const sprite=d.kind==='reeds'?'art141Reeds':d.kind==='fallenBranch'?'art141FallenBranch':null;
 if(sprite&&root.DeadwallAssets136?.drawSprite(c,artwork(),sprite,0,0,r*2,r*2)){c.restore();return;}
 if(['grass','dryGrass','reeds'].includes(d.kind)){c.beginPath();for(let i=0;i<7;i++){const angle=i*Math.PI*2/7,len=r*(.46+hash(seed,i,3)*.45);c.moveTo(0,0);c.quadraticCurveTo(Math.cos(angle-.25)*len*.7,Math.sin(angle-.25)*len*.7,Math.cos(angle)*len,Math.sin(angle)*len);}c.stroke();if(d.kind==='reeds'){c.strokeStyle='#827354';c.lineWidth=.06;c.beginPath();for(let i=0;i<3;i++){const angle=i*Math.PI*2/3;c.moveTo(0,0);c.lineTo(Math.cos(angle)*r*.63,Math.sin(angle)*r*.63);}c.stroke();}}
 else if(d.kind==='fallenBranch'){c.strokeStyle=d.color||'#77664b';c.lineWidth=.10;c.beginPath();c.moveTo(-r,0);c.quadraticCurveTo(-r*.1,-r*.12,r,.09);c.stroke();c.lineWidth=.045;c.beginPath();c.moveTo(-r*.3,-r*.03);c.lineTo(-r*.14,-r*.43);c.moveTo(r*.31,0);c.lineTo(r*.67,r*.31);c.moveTo(-r*.78,0);c.lineTo(-r*.66,r*.18);c.stroke();}
 else for(let i=0;i<4;i++){const x=Math.cos(i*2.4)*r*.6,y=Math.sin(i*2.4)*r*.6;c.beginPath();c.ellipse(x,y,d.kind==='flowers'?.055:r*.20,d.kind==='leaves'?.055:r*.13,i,0,Math.PI*2);c.fill();}c.restore();}
const api={draw,drawScenery,drawDecor,colorAt,materialAt,noise,chooseLOD,cacheInfo:()=>({tiles:cache.size,limit:TILE_CACHE_LIMIT,palettes:paletteCache.size}),reset(){cache.clear();paletteCache.clear();textureStamps136=new WeakMap();}};
root.DeadwallGround135=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
