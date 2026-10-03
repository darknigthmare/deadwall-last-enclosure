/* Footprint-preserving 2.5D architecture. Floors are visible volumes, not visitable interiors. */
(function(root){
 'use strict';const C=root.DeadwallCore||require('./core.js');
 const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 function volume(c,x,y,w,h,z,color){
  rect(c,x+8,y+8,w,h,'rgba(0,0,0,.35)');rect(c,x,y-z,w,h+z,'#28372f');rect(c,x+3,y-z+4,w-6,h+z-7,color);rect(c,x+3,y-z+3,w-6,h*.55,'#94a08e');
  c.strokeStyle='#c1c6ac';c.lineWidth=1;c.strokeRect(x+4,y-z+4,w-8,h*.55-1);rect(c,x+w-9,y-z+9,6,h+z-13,'#3d5045');
 }
 function draw(c,b){const d=b.def;if(!d.urbanKind)return false;const w=b.w*32,h=b.h*32,x=b.left,y=b.top,kind=d.urbanKind,lit=b.powered&&!b.siegeOffline;
  c.save();
  if(kind==='lamp'){
   rect(c,x+4,y+6,w-8,h-10,'#424f45');c.strokeStyle='#a7b2a1';c.lineWidth=4;c.beginPath();c.moveTo(b.x,b.y+8);c.lineTo(b.x,b.y-17);c.stroke();
   c.save();c.translate(b.x,b.y-17);c.rotate((b.rotation||0)*Math.PI/2);rect(c,-8,-7,d.beamHalfAngle?24:16,14,'#87927e');rect(c,d.beamHalfAngle?12:-5,-5,d.beamHalfAngle?5:10,10,lit?'#ecdbaa':'#36483e');c.restore();
  }else if(kind==='housing'){
   const z=Math.min(108,(d.floors||3)*5),side=w>=190;volume(c,x+8,y+12,w*.45,h-24,z,'#64756a');volume(c,x+w*.5,y+20,w*.44,h-28,z*(side?.72:.85),'#647063');
   const rows=d.floors||3,spacing=Math.max(4,Math.min(8,(z+h*.4-20)/rows));for(let row=0;row<rows;row++)for(let col=0;col<Math.floor(w/19);col++){const wx=x+13+col*19,wy=y+h-19-row*spacing;if(wx>x+w*.43&&wx<x+w*.53)continue;rect(c,wx,wy,7,4,lit&&((row*7+col+b.id)%4)!==0?'#c9b778':'#263f3e');}
   rect(c,x+w*.44,y+h-21,w*.1,20,'#1b2d22');rect(c,x+w*.43,y+h-3,w*.14,4,'#a4a68c');
  }else if(kind==='solar'){
   rect(c,x+4,y+6,w-8,h-10,'#54624b');for(let row=0;row<3;row++)for(let col=0;col<4;col++){const sx=x+9+col*(w-16)/4,sy=y+10+row*(h-18)/3;rect(c,sx,sy,(w-28)/4,(h-28)/3,'#344f62');c.strokeStyle='#93aeb2';c.lineWidth=1;c.strokeRect(sx,sy,(w-28)/4,(h-28)/3);}
  }else if(kind==='hospital'){
   volume(c,x+8,y+10,w-16,h-18,25,'#77877b');volume(c,x+w*.33,y+12,w*.35,h*.62,38,'#8e9b89');rect(c,b.x-5,y-5,10,24,'#557971');rect(c,b.x-12,y+2,24,10,'#557971');for(let i=0;i<6;i++)rect(c,x+14+i*(w-24)/6,y+h-25,11,7,lit?'#d2c799':'#3a5050');
  }else if(kind==='storage'){
   volume(c,x+5,y+8,w-10,h-14,15,'#6d7965');for(let i=0;i<Math.floor(w/34);i++){const dx=x+13+i*34;rect(c,dx,y+h-36,25,28,'#293c35');rect(c,dx+2,y+h-32,21,5,'#8e9a81');rect(c,dx+7,y+h-6,13,8,'#b4a782');}
   for(let i=0;i<3;i++)rect(c,x+13+i*28,y+8,18,10,'#9aac8b');
  }else if(kind==='power'||kind==='fuel'){
   volume(c,x+5,y+h*.55,w-10,h*.4,14,'#7b785a');for(let i=0;i<3;i++){const cx=x+30+i*(w-60)/2,cy=y+h*.34;c.fillStyle=kind==='fuel'?'#a59770':'#839588';c.beginPath();c.ellipse(cx,cy,20,28,0,0,Math.PI*2);c.fill();c.strokeStyle='#c1bea6';c.lineWidth=3;c.beginPath();c.ellipse(cx,cy-8,16,8,0,0,Math.PI*2);c.stroke();}
   c.strokeStyle='#b2a675';c.lineWidth=4;c.beginPath();c.moveTo(x+15,y+h*.65);c.lineTo(x+w-16,y+h*.65);c.stroke();
  }else if(kind==='food'){
   volume(c,x+6,y+h*.5,w-12,h*.43,14,'#788367');for(let i=0;i<4;i++){const dx=x+9+i*(w-18)/4;rect(c,dx,y+5,(w-26)/4,h*.42,'#637f62');for(let j=0;j<4;j++)rect(c,dx+4,y+10+j*h*.08,(w-50)/4,3,'#a5b586');}rect(c,x+w*.72,y+h*.55,w*.17,h*.26,'#d0c6a0');
  }else {
   volume(c,x+6,y+8,w-12,h-16,18,kind==='ammo'?'#6c7461':'#798278');for(let i=0;i<4;i++)rect(c,x+15+i*(w-32)/4,y+4,13,h*.6,'#4b5b56');
   c.fillStyle=kind==='stone'?'#b3afa0':kind==='scrap'?'#98aa9c':'#c0ad7d';for(let i=0;i<5;i++){c.beginPath();c.arc(x+17+i*(w-32)/5,y+h-25,9,0,Math.PI*2);c.fill();}
  }
  c.textAlign='center';c.font='bold 10px sans-serif';c.fillStyle='#e6ddbd';c.fillText(d.symbol,b.x,y+h-8,Math.max(24,w-15));c.restore();return true;
 }
 function install(g){if(!g?.art||g.art.urbanDraw)return;const old=g.art.drawBuilding.bind(g.art);g.art.drawBuilding=(c,b,...a)=>draw(c,b)||old(c,b,...a);g.art.urbanDraw=true;}
 const api={draw,install};root.DeadwallUrbanArt=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
