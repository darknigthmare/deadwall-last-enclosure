'use strict';
// Production Art loader/painter on native Canvas. Prepared poses, no browser claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,Image}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
async function run(phase='before'){
 globalThis.document={createElement:()=>createCanvas(1,1)};
 globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'&&!v.startsWith('data:')?path.join(root,v):v;}};
 const Art=require('../src/art.js'),art=Art.create();await art.ready;assert.deepEqual(art.diagnostics.failed,[]);
 const canvas=createCanvas(1440,1040),c=canvas.getContext('2d');c.fillStyle='#404d44';c.fillRect(0,0,1440,1040);
 const equipment=[['pistol','firearm'],['rifle','firearm'],['hatchet','tool'],['unarmed',null]],states=['stand','reload','crouch','prone'];
 for(let row=0;row<states.length;row++)for(let col=0;col<equipment.length;col++){
  const [id,category]=equipment[col],state=states[row],entity={id:0,x:0,y:0,facing:0,weapon:id==='pistol'?'pistol':'rifle',visualUnarmed:!category,visualEquipmentId:category?id:null,visualEquipmentCategory:category,visualEquipmentRate:1.1,visualPosture:['prone','crouch'].includes(state)?state:'stand',visualArticulated:state==='stand',visualLowerFacing:0,visualUpperFacing:0,visualStride:0,visualMoving:false,visualMotionReset:true,reload:state==='reload'?1:0,reloadTotal:2};
  if(state==='reload'&&category!=='firearm'){c.fillStyle='#a9b3a6';c.font='16px sans-serif';c.fillText('Pas de rechargement pour cet équipement',col*360+15,row*260+125);continue;}
  c.save();c.translate(col*360+180,row*260+125);c.scale(3,3);assert.equal(art.drawActor(c,entity,'player',0,false,false),true);c.restore();c.fillStyle='#f1e4b4';c.font='18px sans-serif';c.fillText(id+' · '+state,col*360+15,row*260+242);
 }
 const out=path.join(root,'reports/1.37.0/captures');fs.mkdirSync(out,{recursive:true});const file=path.join(out,'qa137-'+phase+'-actor-poses.png');fs.writeFileSync(file,canvas.toBuffer('image/png'));
 const zoomCanvas=createCanvas(960,660),zc=zoomCanvas.getContext('2d');zc.fillStyle='#404d44';zc.fillRect(0,0,960,660);
 for(const [row,posture]of ['crouch','prone','stand'].entries())for(const [col,zoom]of [.7,1,2.4].entries()){
  for(const [i,weapon]of ['pistol','rifle'].entries()){const e={id:0,x:0,y:0,facing:Math.PI/6,weapon,visualEquipmentCategory:'firearm',visualPosture:posture,visualUpperFacing:Math.PI/6,visualLowerFacing:Math.PI/6,visualArticulated:posture==='stand',reload:posture==='stand'?1:0,reloadTotal:2};zc.save();zc.translate(col*320+90+i*140,row*220+95);zc.scale(zoom,zoom);art.drawActor(zc,e,'player',0,false,false);zc.restore();}
  zc.fillStyle='#f1e4b4';zc.font='16px sans-serif';zc.fillText((posture==='stand'?'Recharge debout':posture)+' · zoom '+zoom,col*320+18,row*220+190);
 }
 const zoomFile=path.join(out,'qa137-'+phase+'-actor-zoom.png');fs.writeFileSync(zoomFile,zoomCanvas.toBuffer('image/png'));
 const meta={file,zoomFile,method:'Art.load and Art.drawActor, prepared presentation fixtures, native Canvas, no browser',assets:art.diagnostics.ready.length,failed:art.diagnostics.failed,newPoses:art.diagnostics.ready.filter(k=>k.endsWith('137')),draws:art.diagnostics.draws};fs.writeFileSync(file.replace('.png','.json'),JSON.stringify(meta,null,2)+'\n');return meta;
}
module.exports={run};if(require.main===module)run(process.argv[2]||'before').then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1;});
