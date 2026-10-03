'use strict';
// Actual game painters under a simulated DOM. No browser screenshot is implied.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const project=path.resolve(__dirname,'..'),out=path.join(project,'reports/1.29.0/captures');fs.mkdirSync(out,{recursive:true});
const {game:g}=require('../tests/helpers/expansions127.cjs').boot127(),Art=require('../src/art.js'),P=require('../src/atlas-projection.js'),Atlas=require('../src/atlas-render.js');
const canvas=createCanvas(1280,900),c=canvas.getContext('2d');g.ctx=c;g.width=1280;g.height=900;g.dpr=1;g.settings.reducedMotion=true;globalThis.Image=class{set src(_){this.onerror?.();}};g.art=Art.create();
function save(name){fs.writeFileSync(path.join(out,name+'.png'),canvas.toBuffer('image/png'));}
(async()=>{
 await g.art.ready;
 for(const [key,spec]of Object.entries(Art.ASSETS)){
  const img=await loadImage(path.join(project,spec.url));
  if(['magenta','neutral'].includes(spec.matte)){const imageCanvas=createCanvas(img.width,img.height),ctx=imageCanvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,img.width,img.height);Art.decodeMatte(data.data,img.width,img.height,spec.matte);ctx.putImageData(data,0,0);g.art.images[key]=imageCanvas;const rects=key==='buildings'?Art.BUILDINGS:key==='props'?Art.PROPS:key==='defenses'?Art.DEFENSES:key==='districtProps'?Art.DISTRICT_PROPS:{};for(const[id,r]of Object.entries(rects))g.art.rects[key+':'+id]=Art.tightRect(data.data,img.width,r);}else g.art.images[key]=img;
 }
 g.startNew('standard','991');g.dayClock=.44;g.weather=0;g.phase='calm';g.zombies=[];
 const station=g.exploration125.plan.stations[1],point={x:station.x,y:station.y},view={left:point.x-640,top:point.y-450,right:point.x+640,bottom:point.y+450};g.camera.x=point.x;g.camera.y=point.y;g.camera.zoom=1;
 c.fillStyle='#171c18';c.fillRect(0,0,1280,900);c.save();c.translate(640-point.x,450-point.y);Atlas.drawHomeScene(c,g,view);c.restore();save('d17-local-129');const local=c.getImageData(0,0,1280,900).data;
 g.player.x=4055;g.player.y=2048;assert.equal(g.frontier.enter(),true);const center=P.toRegion(point.x,point.y),a=P.toRegion(view.left,view.top),b=P.toRegion(view.right,view.bottom);
 c.fillStyle='#171c18';c.fillRect(0,0,1280,900);c.save();c.translate(640,450);c.scale(32,32);c.translate(-center.x,-center.y);Atlas.drawHome(c,g,{world:true,scale:32,view:{left:a.x,top:a.y,right:b.x,bottom:b.y}});c.restore();save('d17-projection-region-129');const remote=c.getImageData(0,0,1280,900).data;
 // View crosses the local map clipping boundary: compare only physical D-17 pixels,
 // and exclude its explicit dashed sector border (four local units).
 let different=0,total=0,strong=0,totalError=0,maxError=0;for(let y=0;y<900;y++)for(let x=0;x<1280;x++){const wx=view.left+x,wy=view.top+y;if(wx<8||wx>4088||wy<8||wy>4088)continue;const i=(y*1280+x)*4;total++;const error=Math.max(Math.abs(local[i]-remote[i]),Math.abs(local[i+1]-remote[i+1]),Math.abs(local[i+2]-remote[i+2]));totalError+=error;maxError=Math.max(maxError,error);if(error)different++;if(error>4)strong++;}
 console.log(JSON.stringify({different,total,strong,maxError,meanError:totalError/total}));
 assert.ok(strong/total<.001&&totalError/total<.3,'projected D-17 must retain local paints, accounting for transform raster rounding');
 for(const seed of ['0','991']){g.startNew('standard',seed);c.clearRect(0,0,1280,900);g.exploration125.renderMap(c,1280,900);save('carte-d17-seed-'+seed+'-129');}
 fs.writeFileSync(path.join(out,'maps129.json'),JSON.stringify({renderer:'actual Canvas game painters, simulated DOM',browser:false,fixtures:true,comparison:{seed:991,point,pixels:total,different,strong,maxError,meanError:totalError/total,ratio:different/total},files:['d17-local-129.png','d17-projection-region-129.png','carte-d17-seed-0-129.png','carte-d17-seed-991-129.png']},null,2)+'\n');console.log(JSON.stringify({different,total,out}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
