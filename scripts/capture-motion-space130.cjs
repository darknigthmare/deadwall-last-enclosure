'use strict';
// Cross-review: real player painters, local units versus regional metres.
// Prepared save states under a simulated DOM. Health bars are excluded because
// they are intentionally drawn by different HUD paths, not part of the body.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const Art=require('../src/art.js'),{setup,angles,names}=require('../tests/helpers/motion130.cjs');
const project=path.resolve(__dirname,'..'),out=path.join(project,'reports/1.30.0/captures');
function pixels(canvas){return canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;}
function comparison(a,b){const aa=pixels(a),bb=pixels(b);let different=0,max=0,total=0;
 for(let i=0;i<aa.length;i++){const d=Math.abs(aa[i]-bb[i]);if(d)different++;max=Math.max(max,d);total+=d;}
 const bounds=data=>{const xs=[],ys=[];for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++)if(data[(y*a.width+x)*4+3]>=128){xs.push(x);ys.push(y);}return[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];};
 return {differentChannels:different,maximumChannelDifference:max,meanChannelDifference:total/aa.length,localBounds:bounds(aa),regionBounds:bounds(bb)};
}
(async()=>{
 const local=setup(),region=setup(true);region.g.restoreSave(region.base);
 require('../src/essential-art.js');require('../src/frontier-art.js');
 globalThis.Image=class{set src(_){this.onerror?.();}};
 const art=Art.create();await art.ready;art.images.commanderRig=await loadImage(path.join(project,Art.ASSETS.commanderRig.url));
 const id=globalThis.DeadwallCore.Essentials.content.jobs[0].id;
 for(const {g}of[local,region]){
  const raw=g.serialize(),target=g.essentials.targets().find(t=>t.id===id);
  raw.frontier.seen=[...new Set([...raw.frontier.seen,target.poi])];
  raw.essentials.jobs[id]={stage:'player'};
  raw.nightGear={version:1,serial:2,devices:[{id:1,kind:'torch',location:'belt',left:100,on:true,used:true}]};
  g.restoreSave(raw);g.art=art;g.width=1000;g.settings.reducedMotion=true;g.paused=true;g.drawActorBars=()=>{};
 }
 const regionalBase=region.g.serialize(),sheet=createCanvas(1280,410),c=sheet.getContext('2d'),evidence=[];
 // Pixel equivalence requires the same subpixel phase in both coordinate
 // systems; this moves the prepared point by at most 1/64 metre.
 regionalBase.frontier.x=Math.round(regionalBase.frontier.x*32)/32;
 regionalBase.frontier.y=Math.round(regionalBase.frontier.y*32)/32;
 c.fillStyle='#17221e';c.fillRect(0,0,sheet.width,sheet.height);c.fillStyle='#eee3c5';c.font='bold 22px sans-serif';
 c.fillText('ANCRAGE CROISÉ · PERSONNAGE ET MATÉRIEL PORTÉ',20,32);
 c.font='13px sans-serif';c.fillStyle='#bac8b9';c.fillText('Même échelle projetée · torche allumée et module essentiel · Canvas réel, DOM simulé · barres HUD exclues',20,58);
 for(let i=0;i<8;i++){
  const angle=angles[i];Object.assign(local.g.player,{facing:angle,invulnerable:0,shootCooldown:0});local.g.actorPresentation.reset();
  const raw=structuredClone(regionalBase);raw.frontier.a=angle;raw.player.invulnerable=0;raw.player.shootCooldown=0;region.g.restoreSave(raw);region.g.paused=true;
  const a=createCanvas(128,128),b=createCanvas(128,128),ca=a.getContext('2d'),cb=b.getContext('2d');
  ca.translate(64-local.g.player.x,64-local.g.player.y);art.presentation=entity=>entity===local.g.player?local.g.actorPresentation.player():entity;
  local.g.drawPlayer(ca);
  const v=region.g.frontier.overview(),view={l:v.x-4,r:v.x+4,t:v.y-4,b:v.y+4};
  const entries=globalThis.DeadwallFrontierArt.depthEntries(region.g,v,view),entry=entries.find(e=>e.kind==='player');
  assert.ok(entry);assert.equal(entry.depth,v.y,'le corps et son portage partagent le contact au sol');
  cb.translate(64,64);cb.scale(32,32);cb.translate(-v.x,-v.y);art.presentation=entity=>entity;entry.draw(cb);
  const result=comparison(a,b);
  // Canvas rasterizes vector glyphs in different world units. Subpixel edge
  // coverage can differ slightly; the body and portage must keep their bounds
  // and a mean per-channel deviation below 0.05 / 255 at the same screen scale.
  assert.deepEqual(result.localBounds,result.regionBounds,'silhouette et matériel restent ancrés aux mêmes pixels');
  assert.ok(result.meanChannelDifference<.05,'aucun décalage du porteur ou de son équipement entre les deux domaines');
  evidence.push({direction:names[i],depth:entry.depth,...result});
  const x=16+i*158;c.fillStyle='#26322d';c.fillRect(x,78,151,302);c.fillStyle='#eee3c5';c.font='14px sans-serif';c.fillText(names[i],x+8,99);
  c.drawImage(a,x+11,108);c.drawImage(b,x+11,236);c.fillStyle='#bac8b9';c.font='11px sans-serif';c.fillText('D-17',x+8,121);c.fillText('Région · ×32',x+8,249);
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'motion-space130.png'),sheet.toBuffer('image/png'));
 fs.writeFileSync(path.join(out,'motion-space130.json'),JSON.stringify({browser:false,prepared:true,painters:['Game.drawPlayer','DeadwallFrontierArt.depthEntries(player).draw'],excluded:['health and stamina HUD bars'],cases:evidence},null,2));
 console.log(JSON.stringify({cases:evidence.length,aligned:true,maximumMeanChannelDifference:Math.max(...evidence.map(e=>e.meanChannelDifference)),image:'motion-space130.png'}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
