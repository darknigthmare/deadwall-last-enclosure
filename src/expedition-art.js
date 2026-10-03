/* Deterministic Canvas props for the expedition map; no external image dependency. */
(function(root){'use strict';
 const Core=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),vehicleTypes139=new Map(Object.entries(Core?.WorldEvolution?.RULES?.vehicles||{}).map(([type,profile])=>[profile,type]));
 function legacyCar(c,v){c.save();c.translate(v.x,v.y);c.rotate(v.angle);const dead=v.health<=0;c.fillStyle='rgba(0,0,0,.45)';c.fillRect(-23,-12,50,28);c.fillStyle='#202a25';for(const x of [-15,14]){c.fillRect(x-5,-17,10,7);c.fillRect(x-5,10,10,7)}c.fillStyle=dead?'#4b4d45':'#a99565';c.fillRect(-23,-13,46,26);c.fillStyle=dead?'#303b33':'#304d4f';c.fillRect(6,-10,8,20);c.fillRect(-17,-10,7,20);c.fillStyle='#758574';c.fillRect(-8,-11,14,22);c.strokeStyle='#d2c49a';c.lineWidth=1;c.strokeRect(-9,-12,15,24);c.fillStyle=v.driving?'#eed699':'#b6b89b';c.fillRect(21,-11,4,5);c.fillRect(21,6,4,5);c.fillStyle='#9d6650';c.fillRect(-25,-11,3,5);c.fillRect(-25,6,3,5);if(dead){c.strokeStyle='#242c25';c.lineWidth=3;c.beginPath();c.moveTo(-18,-10);c.lineTo(18,10);c.moveTo(-18,10);c.lineTo(18,-10);c.stroke()}c.restore();if(v.health<320){c.fillStyle='#111e17';c.fillRect(v.x-24,v.y-30,48,4);c.fillStyle='#b79562';c.fillRect(v.x-24,v.y-30,48*v.health/320,3)}}
 function localVehicle(g,v){
  const profile=g?.worldEvolution?.vehicleProfile?.()||Core?.WorldEvolution?.RULES?.vehicles.break||{w:4.6,h:1.85,health:320},type=vehicleTypes139.get(profile)||'break',size=root.DeadwallAssets136?.vehicleSize139(profile,'local')||{w:44,h:17.7,scale:44/4.6};
  return{profile,type,...size,angle:Number.isFinite(v.angle)?v.angle:0};
 }
 function car(c,v){
  const g=root.DEADWALL,p=localVehicle(g,v),paint=root.DeadwallFrontierArt?.car;
  if(!paint)return legacyCar(c,v);
  c.save();c.translate(v.x,v.y);c.scale(p.scale,p.scale);
  paint(c,{...v,x:0,y:0,a:p.angle,w:p.profile.w,h:p.profile.h,type:p.type},!!v.driving,v.health);c.restore();
  if(v.health<p.profile.health){const length=Math.max(28,Math.min(80,p.w)),top=v.y-Math.abs(Math.sin(p.angle))*p.w/2-Math.abs(Math.cos(p.angle))*p.h/2-10;c.fillStyle='#111e17';c.fillRect(v.x-length/2,top,length,4);c.fillStyle='#b79562';c.fillRect(v.x-length/2,top,length*Math.max(0,v.health/p.profile.health),3);}
 }
 function site(c,d,s,selected){c.save();c.translate(d.x,d.y);c.fillStyle='rgba(0,0,0,.38)';c.fillRect(-38,-23,80,56);c.fillStyle=s.reported?'#526852':'#8c876b';c.fillRect(-38,-27,76,48);c.fillStyle='#334b41';c.fillRect(-33,-22,66,35);c.strokeStyle='#b1b495';c.lineWidth=2;c.strokeRect(-38,-27,76,48);
  if(d.kind==='fuel'){c.fillStyle='#bbc0a2';c.fillRect(-28,-17,17,32);c.fillRect(11,-17,17,32);c.fillStyle='#253e38';c.fillRect(-24,-13,9,8);c.fillRect(15,-13,9,8);c.strokeStyle='#242f25';c.beginPath();c.moveTo(28,-8);c.lineTo(34,-5);c.lineTo(34,16);c.stroke();}
  else if(d.kind==='medical'){c.fillStyle='#bcc6aa';c.fillRect(-23,-15,46,26);c.fillStyle='#688c7f';c.fillRect(-4,-10,8,18);c.fillRect(-9,-5,18,8);}
  else if(d.kind==='archives'){c.fillStyle='#c6c9aa';for(let i=0;i<3;i++)c.fillRect(-29+i*20,-15,15,27);c.strokeStyle='#667d73';for(let i=0;i<4;i++){c.beginPath();c.moveTo(-25,-10+i*5);c.lineTo(25,-10+i*5);c.stroke();}}
  else{for(let i=0;i<4;i++){c.fillStyle=i%2?'#9c9a70':'#74856a';c.fillRect(-30+i*17,-13,13,24)}if(d.kind==='garage'){c.strokeStyle='#bcc5a2';c.lineWidth=3;c.beginPath();c.arc(0,0,11,0,Math.PI*2);c.stroke()}}
  c.font='bold 11px sans-serif';c.textAlign='center';c.fillStyle='#e2d5a9';c.fillText(d.name,0,-38);if(selected){c.strokeStyle='#e3c17c';c.setLineDash([6,5]);c.strokeRect(-45,-34,90,64);}c.restore();}
 function building(c,b){if(!['expeditionOffice','expeditionGarage'].includes(b.type))return false;const x=b.left,y=b.top,w=b.w*32,h=b.h*32;c.save();c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x+8,y+10,w-4,h-6);c.fillStyle='#4e6659';c.fillRect(x+3,y+5,w-6,h-8);c.fillStyle='#9aab91';c.fillRect(x+4,y+3,w-8,h*.55);
 if(b.type==='expeditionGarage'){c.fillStyle='#203b30';c.fillRect(x+12,y+h*.56,w-24,h*.36);c.strokeStyle='#acaf8f';for(let i=0;i<4;i++){c.beginPath();c.moveTo(x+13,y+h*.59+i*5);c.lineTo(x+w-13,y+h*.59+i*5);c.stroke();}}else{c.strokeStyle='#d1d3af';c.lineWidth=2;c.beginPath();c.moveTo(b.x,y+10);c.lineTo(b.x,y-23);c.moveTo(b.x-12,y-17);c.lineTo(b.x+12,y-17);c.stroke();c.fillStyle=b.powered?'#d7c282':'#294839';c.fillRect(x+10,y+h-18,w-20,8)}c.restore();return true;}
 function install(g){if(!g.art||g.art.expeditionDraw)return;const old=g.art.drawBuilding.bind(g.art);g.art.drawBuilding=(c,b,...a)=>building(c,b)||old(c,b,...a);g.art.expeditionDraw=true;
 const depth=g.depthEntries.bind(g);g.depthEntries=(view,...a)=>{
  const entries=depth(view,...a),v=g.expeditions.car();
  if(v&&!v.regionAway&&!v.dead){const p=localVehicle(g,v),extent=Math.hypot(p.w,p.h)/2+10,visible=g.visible(v.x,v.y,extent,view);let entry=entries.find(e=>e.kind===6&&e.entity===v);
   if(visible){if(!entry){entry={kind:6,entity:v,id:v.id||0,order:entries.length};entries.push(entry);}entry.depth=v.y+Math.abs(Math.sin(p.angle))*p.w/2+Math.abs(Math.cos(p.angle))*p.h/2;}
   else if(entry)entries.splice(entries.indexOf(entry),1);
   entries.sort((a,b)=>a.depth-b.depth||a.kind-b.kind||a.id-b.id||a.order-b.order);
  }
  return entries;
 };const ground=g.drawGround.bind(g);g.drawGround=(c,v,...a)=>{const r=ground(c,v,...a),data=g.expeditions.overview();for(const s of data.sites)if(g.visible(s.x,s.y,90,v)&&!g.world.at(s.x,s.y))site(c,s,s,data.active?.id===s.id);return r;};}
 const api={car,localVehicle,site,building,install};root.DeadwallExpeditionArt=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
