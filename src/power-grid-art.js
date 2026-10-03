(function(root){
 'use strict';
 function draw(ctx,b,charge=0){const spec=b.def.battery;if(!spec)return false;const x=b.left,y=b.top,w=b.w*32,h=b.h*32,ratio=Math.max(0,Math.min(1,charge/spec.capacity));ctx.save();
  ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(x+8,y+10,w-8,h-8);ctx.fillStyle='#435d4b';ctx.fillRect(x+2,y+4,w-4,h-6);ctx.fillStyle='#8e9b7c';ctx.fillRect(x+4,y+2,w-8,10);
  const columns=b.type==='batteryCabinet'?2:b.type==='batteryStation'?4:5,rows=b.type==='batteryCabinet'?1:b.type==='batteryStation'?2:3;
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){const cw=(w-16)/columns,ch=(h-27)/rows,px=x+8+c*cw,py=y+15+r*ch;ctx.fillStyle='#223b30';ctx.fillRect(px+1,py+1,cw-3,ch-4);ctx.fillStyle='#aeb798';ctx.fillRect(px+4,py+5,cw-9,3);ctx.fillStyle=ratio>0?'#c7bc72':'#535e45';ctx.fillRect(px+5,py+ch-10,(cw-11)*ratio,4);}
  ctx.strokeStyle='#d4c69a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+9,y+h-9);ctx.lineTo(x+w-9,y+h-9);ctx.stroke();ctx.fillStyle='#141f19';ctx.fillRect(x+5,y+h+2,w-10,5);ctx.fillStyle='#c5b778';ctx.fillRect(x+5,y+h+2,(w-10)*ratio,5);ctx.restore();return true;
 }
 function install(g){if(!g?.art||g.art.powerGridDraw)return;const old=g.art.drawBuilding.bind(g.art);g.art.drawBuilding=(ctx,b,...a)=>draw(ctx,b,g.powerGrid?.charge(b.id)||0)||old(ctx,b,...a);g.art.powerGridDraw=true;}
 const api={draw,install};root.DeadwallPowerGridArt=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
