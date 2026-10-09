(function(root){'use strict';const G=root.DeadwallFrontierGeometry;let mask=null,opacity=0,last=null;
const fill=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
// Parcel orientation rotates surfaces, never the shared world-space sunlight.
function localShadow(angle=0,x=.08,y=.12){const a=Number.isFinite(angle)?angle:0;return{x:Math.cos(a)*x+Math.sin(a)*y,y:-Math.sin(a)*x+Math.cos(a)*y};}
function surface138(c,p,part,x,y,w,h,z=0){const a=root.DeadwallAssets136,key=a?.surfaceFor138(p.type,part,{z});return key&&a.drawSurface138(c,root.DEADWALL?.art,key,x,y,w,h,{tile:part==='roof'?8:3,alpha:part==='roof'?.72:.58});}
function car(c,v,active=false,hp=320){const w=v.w||4.6,h=v.h||1.85,type=v.type||'break';c.save();c.translate(v.x,v.y);c.rotate(v.a);const shade=localShadow(v.a);fill(c,-w/2+shade.x,-h/2+shade.y,w,h,'rgba(0,0,0,.25)');if(root.DeadwallVehicleArt152?.drawVehicle(c,root.DEADWALL?.art,type,w,h,{hp,opened:v.opened,dismantled:v.dismantled,exhausted:v.exhausted,active})||root.DeadwallAssets136?.drawVehicle139(c,root.DEADWALL?.art,type,w,h,{hp,opened:v.opened,dismantled:v.dismantled,exhausted:v.exhausted,active})){}else if(['bike','motorcycle','skate'].includes(type)){c.strokeStyle=hp>0?'#b9a873':'#565950';c.lineWidth=.13;c.beginPath();c.moveTo(-w*.35,0);c.lineTo(w*.35,0);c.stroke();for(const x of [-w*.36,w*.36]){c.beginPath();c.arc(x,0,h*.34,0,Math.PI*2);c.stroke();}}else{fill(c,-w/2,-h/2,w,h,hp>0?(active?'#a79b70':'#7c887d'):'#535549');fill(c,-w*.28,-h*.43,w*.42,h*.86,'#314e50');fill(c,w*.17,-h*.42,w*.2,h*.84,'#718275');if(v.dismantled){fill(c,w*.18,-h*.4,w*.28,h*.8,'#222a26');c.strokeStyle='#b5a58a';c.lineWidth=.065;c.strokeRect(w*.18,-h*.4,w*.28,h*.8);c.beginPath();c.moveTo(w*.46,-h*.4);c.lineTo(w*.62,-h*.8);c.lineTo(w*.2,-h*.66);c.stroke();if(v.exhausted){c.strokeStyle='#68736c';c.beginPath();c.moveTo(w*.22,-h*.28);c.lineTo(w*.4,h*.28);c.moveTo(w*.4,-h*.28);c.lineTo(w*.22,h*.28);c.stroke();}}if(v.opened){c.strokeStyle='#ead7a2';c.lineWidth=.08;c.beginPath();c.moveTo(-w/2,-h/2);c.lineTo(-w/2-.8,-h*.85);c.lineTo(-w/2+.15,h/2);c.stroke();}}c.restore();}
function special(c,o){const{x,y,w,h,kind}=o;if(kind==='generator'&&root.DeadwallAssets136?.drawSprite(c,root.DEADWALL?.art,'art136Generator',x+w/2,y+h/2,w,h))return true;if(!['dentalChair','sterilizer','steelTable','dishRack','timberRack','sawBench','clampRack','palletStack','generator','electricalRack'].includes(kind))return false;
if(kind==='dentalChair'){fill(c,x,y,w,h,'#728f8c');fill(c,x+.15,y+.22,w-.35,h-.4,'#a8b9ae');fill(c,x+.16,y+.1,.3,h-.2,'#d4d8bb');fill(c,x+w-.35,y+.15,.15,h-.3,'#475f59');}
if(kind==='sterilizer'||kind==='electricalRack'){fill(c,x,y,w,h,'#a4b4a8');fill(c,x+.12,y+.12,w-.24,h-.24,'#314f49');for(let k=0;k<3;k++)fill(c,x+.2+k*.3,y+.19,.08,.05,'#c6c49b');}
if(kind==='steelTable'){fill(c,x,y,w,h,'#7c9390');fill(c,x+.1,y+.08,w-.2,h-.16,'#c1c9b6');fill(c,x+.2,y+.2,.3,.25,'#839c8b');}
if(kind==='dishRack'){fill(c,x,y,w,h,'#547668');c.strokeStyle='#c1cab5';c.lineWidth=.05;for(let k=.15;k<w;k+=.2){c.beginPath();c.moveTo(x+k,y+.08);c.lineTo(x+k,y+h-.08);c.stroke();}}
if(kind==='timberRack'||kind==='palletStack'){fill(c,x,y,w,h,'#6f6045');for(let k=.08;k<h;k+=.18){fill(c,x+.05,y+k,w-.1,.12,kind==='timberRack'?'#b29b71':'#b4a982');}if(kind==='timberRack'){fill(c,x+.25,y,.07,h,'#415f53');fill(c,x+w-.3,y,.07,h,'#415f53');}}
if(kind==='sawBench'){fill(c,x,y,w,h,'#849284');fill(c,x+.12,y+.12,w-.24,h-.24,'#b4bba4');c.fillStyle='#556d68';c.beginPath();c.arc(x+w/2,y+h/2,.24,0,Math.PI*2);c.fill();fill(c,x+.25,y+h*.7,w-.5,.065,'#4d6358');}
if(kind==='clampRack'){fill(c,x,y,w,h,'#9d8b66');for(let k=.16;k<w;k+=.3){fill(c,x+k,y+.08,.05,h-.16,'#3f5751');fill(c,x+k,y+.08,.14,.06,'#b4bda4');}}
if(kind==='generator'){fill(c,x,y,w,h,'#616f5a');for(let k=0;k<3;k++){c.fillStyle='#b5b99e';c.beginPath();c.arc(x+.4+k*.68,y+h/2,.25,0,Math.PI*2);c.fill();}fill(c,x+.12,y+.08,w-.24,.08,'#363f37');}
return true;}
function object(c,o,taken=0,angle=0,{game=root.DEADWALL,seed=game?.world?.seed??0,floor=0}={}){
c.save();const{x,y,w,h}=o,shade=localShadow(angle);if(taken>=o.amount-.001)c.globalAlpha=.55;
const art=game?.art,interiors=root.DeadwallInteriorArt153,sprite=interiors?.spriteForFurniture?.(o,{seed,floor});let painted=false;
if(sprite&&art?.images?.[sprite.atlas]){
 fill(c,x+shade.x,y+shade.y,w,h,'rgba(0,0,0,.25)');
 if(['counter','shelf','workbench'].includes(o.kind)){
  fill(c,x,y,w,h,o.kind==='shelf'?'#626b5d':o.kind==='counter'&&sprite.variant===1?'#858b80':'#796449');
  c.strokeStyle='#3f5549';c.lineWidth=.045;c.strokeRect(x,y,w,h);
 }
 painted=interiors.drawFurniture(c,art,o,{seed,floor,taken,stateAlpha:false});
}else if(['logs','rubble'].includes(o.kind)){
 painted=!!root.DeadwallNatureArt153?.drawSprite?.(c,art,o.kind,o.id,x+w/2,y+h/2,w,h,{seed,alpha:1,angle:0});
}
if(!painted){const detailedGenerator=o.kind==='generator'&&!!art?.images?.art136Generator;if(!detailedGenerator){fill(c,x+shade.x,y+shade.y,w,h,'rgba(0,0,0,.25)');fill(c,x,y,w,h,['bed','sofa'].includes(o.kind)?'#859080':['fridge','medical','sink'].includes(o.kind)?'#bcc5b2':o.kind==='logs'?'#9e8056':'#8c805f');c.strokeStyle='#3f5549';c.lineWidth=.045;c.strokeRect(x,y,w,h);}
if(special(c,o)){}
else if(o.kind==='bed'){fill(c,x+.1,y+.1,.43,h-.2,'#d8d6b9');fill(c,x+.7,y+.08,w-.8,h-.16,'#718376');}
else if(o.kind==='shelf'){for(let i=0;i<Math.floor(w/.32);i++)fill(c,x+.06+i*.32,y+.08,.25,h-.16,['#a9a88b','#789184','#b49c72'][i%3]);}
else if(o.kind==='medical'){fill(c,x+w/2-.08,y+.07,.16,h-.14,'#6d8e80');fill(c,x+.14,y+h/2-.07,w-.28,.14,'#6d8e80');}
else if(o.kind==='desk'||o.kind==='workbench'){fill(c,x+.12,y+.1,.5,.23,'#354c49');fill(c,x+.85,y+.16,.23,.13,'#d0cab0');}
else if(o.kind==='logs'){for(let i=0;i<4;i++){fill(c,x,y+i*h/4,w,h/5,'#796044');fill(c,x+w-.14,y+i*h/4,.14,h/5,'#c6ae7e');}}
else if(o.kind==='washer'){fill(c,x,y,w,h,'#b2c0b3');c.fillStyle='#405d66';c.beginPath();c.arc(x+w/2,y+h/2,w*.3,0,Math.PI*2);c.fill();fill(c,x+.08,y+.05,w-.16,.1,'#dce0c4');}
else if(o.kind==='plantTray'){fill(c,x,y,w,h,'#887351');for(let i=0;i<5;i++)for(let j=0;j<2;j++){c.fillStyle=i%2?'#719953':'#466e45';c.beginPath();c.arc(x+.26+i*.43,y+.28+j*.46,.18,0,Math.PI*2);c.fill();}}
else if(o.kind==='oven'){fill(c,x,y,w,h,'#8f9e93');fill(c,x+.12,y+.15,w-.24,h-.33,'#33463f');for(let yy=y+.3;yy<y+h-.1;yy+=.25)fill(c,x+.2,yy,w-.4,.04,'#b4ab8a');}
else if(o.kind==='kennel'){fill(c,x,y,w,h,'#7e9285');c.strokeStyle='#c0cabc';c.lineWidth=.04;for(let xx=x+.15;xx<x+w;xx+=.18){c.beginPath();c.moveTo(xx,y+.06);c.lineTo(xx,y+h-.06);c.stroke();}}
else if(o.kind==='tirePile'){for(let i=0;i<2;i++)for(let j=0;j<2;j++){c.fillStyle='#29372d';c.beginPath();c.arc(x+.3+i*.6,y+.3+j*.6,.28,0,Math.PI*2);c.fill();c.fillStyle='#788b78';c.beginPath();c.arc(x+.3+i*.6,y+.3+j*.6,.1,0,Math.PI*2);c.fill();}}
else if(o.kind==='hoseRack'){fill(c,x,y,w,h,'#6c8576');for(let i=0;i<4;i++){c.strokeStyle='#c3aa70';c.lineWidth=.09;c.beginPath();c.arc(x+.3+i*.48,y+h/2,.19,0,Math.PI*2);c.stroke();}}
else if(o.kind==='pump'){fill(c,x,y,w,h,'#a69c73');fill(c,x+.1,y+.08,w-.2,h*.3,'#2a4541');}
else if(o.kind==='bench'||o.kind==='counter'){fill(c,x+.08,y+.09,w-.16,h-.18,'#b5a078');for(let yy=y+.17;yy<y+h;yy+=.22)fill(c,x+.1,yy,w-.2,.035,'#715b42');}
else if(o.kind==='fuel'){fill(c,x+.12,y+.06,w-.24,.12,'#2c4c3c');}
else{c.beginPath();c.moveTo(x+.08,y+.08);c.lineTo(x+w-.08,y+h-.08);c.stroke();}}
// Opening and cache indicators follow the owner's live finite state, above either picture or fallback.
if(taken>.001&&['crate','wardrobe','fridge','shelf','medical','desk','fuel'].includes(o.kind)){c.strokeStyle='#ead7a2';c.lineWidth=.06;c.beginPath();c.moveTo(x,y);c.lineTo(x+w*.6,y-.35);c.stroke();}
const cache=game?.fieldSupplies?.cacheSummary(o.id);if(cache){c.globalAlpha=1;c.strokeStyle='#d8c78a';c.lineWidth=.075;c.strokeRect(x-.08,y-.08,w+.16,h+.16);fill(c,x,y+h+.04,w,.1,'#3c5648');fill(c,x,y+h+.04,w*cache.amount/cache.capacity,.1,'#d8c78a');c.fillStyle='#f0e7c1';c.font='.28px sans-serif';c.textAlign='center';c.fillText('R',x+w/2,y+h/2+.1);}c.restore();}
const NATURAL_LOTS141=new Set(['house','duplex','cabin','ruin','garden','marketgarden','basementHouse','cottageSmall','rowhouse','bungalow','familyHouse','farmhouse','villa','duplexWide','chapel']);
function wornPad141(c,x,y,w,h,seed,color){
 const jitter=i=>(G.hash(seed,i)%1000)/1000,edge=Math.min(.75,Math.min(w,h)*.15);
 c.fillStyle=color;c.beginPath();c.moveTo(x+edge*jitter(1),y+edge*jitter(2));c.lineTo(x+w-edge*jitter(3),y+edge*jitter(4));c.lineTo(x+w-edge*jitter(5),y+h-edge*jitter(6));c.lineTo(x+edge*jitter(7),y+h-edge*jitter(8));c.closePath();c.fill();
 c.globalAlpha*=.34;c.fillStyle='#bbb18e';for(let i=0;i<12;i++){c.beginPath();c.ellipse(x+w*jitter(i+31),y+h*jitter(i+55),.08+jitter(i+74)*.16,.035+jitter(i+92)*.07,jitter(i+108)*Math.PI,0,Math.PI*2);c.fill();}c.globalAlpha/=.34;
}
function lotGround141(c,p){
 const natural=NATURAL_LOTS141.has(p.type),seed=G.hash(p.id,p.x,p.y),pad=natural?.65:1.5;
 if(!natural)wornPad141(c,-11,-17,p.w+22,16,seed,'#707a68');
 wornPad141(c,-pad,-pad,p.w+pad*2,p.h+pad*2,seed^351,natural?'#898d70':'#a2a38a');
 // Existing drive, parking and objects decide the service surfaces; vegetation stays visible between rural supports.
 wornPad141(c,p.w/2-1.5,-17,3,17,seed^625,natural?'#9d9477':'#a8a894');
 for(const cv of p.parking||[]){
  const q=G.local(p,cv.x,cv.y),w=Math.max(5.5,(cv.w||4.6)+.8),h=Math.max(2.7,(cv.h||1.85)+.8);
  c.save();c.translate(q.x,q.y);c.rotate((cv.a||0)-(p.a||0));if(natural)wornPad141(c,-w/2-.25,-h/2-.25,w+.5,h+.5,G.hash(seed,cv.id),'#929178');
  else{c.strokeStyle='#d2cba6';c.lineWidth=.065;c.strokeRect(-w/2,-h/2,w,h);}c.restore();
 }
 if(!natural)wornPad141(c,-8,p.h+2,p.w+16,7,seed^961,'#858a72');
 else for(const o of p.outdoor||[])if(['generator','electricalRack','machine','workbench'].includes(o.kind))wornPad141(c,o.x-.3,o.y-.3,o.w+.6,o.h+.6,G.hash(seed,o.id),'#9a9d84');
}
function lotGround(c,p,v){if(v.z!==0)return;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.translate(-p.w/2,-p.h/2);if(p.generation>=7)lotGround141(c,p);else{fill(c,-11,-17,p.w+22,16,'#707a68');fill(c,-2,-2,p.w+4,p.h+4,'#a2a38a');c.strokeStyle='#d2cba6';c.lineWidth=.065;for(const cv of p.parking){const q=G.local(p,cv.x,cv.y),w=Math.max(5.5,(cv.w||4.6)+.8),h=Math.max(2.7,(cv.h||1.85)+.8);c.save();c.translate(q.x,q.y);c.rotate((cv.a||0)-(p.a||0));c.strokeRect(-w/2,-h/2,w,h);c.restore();}fill(c,p.w/2-1.5,-17,3,17,'#a8a894');fill(c,-8,p.h+2,p.w+16,7,'#858a72');}c.restore();}
// Floors are painted before the shared queue; their furniture, walls and roofs
// participate in the same world-space depth ordering as actors and equipment.
function inLot(c,p,draw){c.save();c.translate(p.x,p.y);c.rotate(p.a);c.translate(-p.w/2,-p.h/2);draw();c.restore();}
function openLot(g,p,v){return v.inside===p.id||p.type==='ruin'||!!g?.worldEvolution?.structureDestroyed(p.id);}
function rectDepth(p,o){return Math.max(...[[o.x,o.y],[o.x+o.w,o.y],[o.x,o.y+o.h],[o.x+o.w,o.y+o.h]].map(([x,y])=>G.global(p,x,y).y));}
function vehicleDepth(v){return v.y+Math.abs(Math.sin(v.a||0))*(v.w||4.6)/2+Math.abs(Math.cos(v.a||0))*(v.h||1.85)/2;}
function visiblePoint(g,p,v){
 if((p.z??0)!==v.z||v.z!==0&&p.inside!==v.inside)return false;
 if(v.z===0)for(const place of v.world?.nearPOI?.(p.x,p.y,2)||[]){
  if(openLot(g,place,v))continue;const q=G.local(place,p.x,p.y);
  if(q.x>0&&q.x<place.w&&q.y>0&&q.y<place.h)return false;
 }
 return true;
}
function lotFloor(c,p,v,g=root.DEADWALL){const entered=v.inside===p.id,pl=v.world.plan(p,entered?v.z:0),destroyed=!!g?.worldEvolution?.structureDestroyed(p.id);inLot(c,p,()=>{
 fill(c,0,0,p.w,p.h,'#bab79e');if(openLot(g,p,v)){
  for(const room of pl.rooms){fill(c,room.x,room.y,room.w,room.h,['#b9b79f','#a8b49b','#b8ac93'][G.hash(room.name)%3]);c.strokeStyle='rgba(60,80,60,.12)';c.lineWidth=.015;for(let x=room.x;x<room.x+room.w;x+=.7){c.beginPath();c.moveTo(x,room.y);c.lineTo(x,room.y+room.h);c.stroke();}}
  if(!root.DeadwallInteriorArt153?.drawFloor?.(c,g?.art,p,{x:.24,y:.24,w:p.w-.48,h:p.h-.48},{seed:v.world.seed??g?.world?.seed??0,floor:entered?v.z:0}))surface138(c,p,'floor',.24,.24,p.w-.48,p.h-.48,entered?v.z:0);
  if(destroyed)fill(c,0,0,p.w,p.h,'#625f52');
  for(const t of destroyed?[]:pl.stairs){fill(c,t.x,t.y,t.w,t.h,'#6d8271');c.strokeStyle='#c4c7a9';c.lineWidth=.07;for(let y=t.y;y<t.y+t.h;y+=.27){c.beginPath();c.moveTo(t.x,y);c.lineTo(t.x+t.w,y);c.stroke();}c.fillStyle='#eadbab';c.font='.42px sans-serif';c.textAlign='center';c.fillText('⇅',t.x+t.w/2,t.y+t.h/2);}
  if(p.type==='gym'&&entered){c.strokeStyle='#ede3b9';c.lineWidth=.075;c.strokeRect(2,2,p.w-4,p.h-10);c.beginPath();c.moveTo(p.w/2,2);c.lineTo(p.w/2,p.h-8);c.stroke();c.beginPath();c.arc(p.w/2,(p.h-6)/2,2.5,0,Math.PI*2);c.stroke();}
 }
 if(v.z===0&&p.generation>=2&&['market','bakery','postoffice','warehouse','selfstorage'].includes(p.type)){c.fillStyle='#dfd2a1';c.font='.45px sans-serif';c.textAlign='center';c.fillText('LIVRAISONS',p.w/2,p.h+3);}
 fill(c,p.w/2-1.3,-.05,2.6,.22,'#b6aa7e');});}
function lotRoof(c,p,v=null,g=root.DEADWALL){inLot(c,p,()=>{
const painted=root.DeadwallInteriorArt153?.drawRoof?.(c,g?.art,p,{x:.2,y:.2,w:p.w-.4,h:p.h-.4},{seed:v?.world?.seed??g?.world?.seed??0});
if(!painted){fill(c,.2,.2,p.w-.4,p.h-.4,['#797663','#6c7b65','#7c846c','#706b56'][G.hash(p.id)%4]);surface138(c,p,'roof',.2,.2,p.w-.4,p.h-.4);c.strokeStyle='#a0a088';c.lineWidth=.05;for(let x=.7;x<p.w;x+=1.5){c.beginPath();c.moveTo(x,.3);c.lineTo(x,p.h-.3);c.stroke();}fill(c,p.w/2-.12,.2,.24,p.h-.4,'#b5ae8b');if(p.w>23){fill(c,p.w*.18,p.h*.3,2,1.4,'#4c6458');fill(c,p.w*.18+.2,p.h*.3+.2,1.6,1,'#97b2a4');}}
c.strokeStyle='#c6bea1';c.lineWidth=.15;c.strokeRect(.13,.13,p.w-.26,p.h-.26);
 if(p.type==='garden'){fill(c,1,1,p.w-2,p.h-2,'rgba(133,185,166,.30)');c.strokeStyle='#c7d4b4';c.lineWidth=.09;for(let xx=2;xx<p.w;xx+=3){c.beginPath();c.moveTo(xx,1);c.lineTo(xx,p.h-1);c.stroke();}}
 });}
function lotEntries(g,p,v){const entries=[],add=(kind,id,depth,draw)=>entries.push({kind,id,depth,draw}),pl=v.world.plan(p,v.inside===p.id?v.z:0),destroyed=!!g?.worldEvolution?.structureDestroyed(p.id);
 if(openLot(g,p,v)){
  for(const o of pl.objects)add('furniture',o.id,rectDepth(p,o),c=>inLot(c,p,()=>object(c,o,v.taken[o.id]||0,p.a,{game:g,seed:v.world.seed??g?.world?.seed??0,floor:v.inside===p.id?v.z:0})));
  for(const [i,b]of (destroyed?[]:pl.walls).entries())add('wall',p.id+':wall:'+i,rectDepth(p,b),c=>inLot(c,p,()=>{const shade=localShadow(p.a,.12,.16);fill(c,b.x+shade.x,b.y+shade.y,b.w,b.h,'rgba(0,0,0,.23)');fill(c,b.x,b.y,b.w,b.h,'#506652');fill(c,b.x,b.y,b.w,Math.min(.075,b.h),'#b7c09e');}));
 }else add('roof',p.id,rectDepth(p,{x:0,y:0,w:p.w,h:p.h}),c=>lotRoof(c,p,v,g));
 if(v.z===0){for(const o of p.outdoor||[])add('outdoor',o.id,rectDepth(p,o),c=>inLot(c,p,()=>object(c,o,v.taken[o.id]||0,p.a,{game:g,seed:v.world.seed??g?.world?.seed??0,floor:0})));for(const cv of p.parking||[])add('car',cv.id,vehicleDepth(cv),c=>{const salvage=g?.travel131?.wreckVisual?.(cv.id);car(c,{...cv,opened:(v.taken[cv.id]||0)>0,dismantled:salvage?.dismantled,exhausted:salvage?.exhausted});});}
 return entries;
}
function lotLabel(c,p,v){const q=G.global(p,p.w/2,-19);c.fillStyle='#eee4bd';c.font=12/(v.scale||32)+'px sans-serif';c.textAlign='center';c.fillText(p.name,q.x,q.y);}
// Screen-space text stays readable at every regional zoom. Nearby/current
// places win when their measured labels would overlap; geometry stays untouched.
function lotLabels(c,places,v,{width,height,dpr=1,gates=[]}){
 const used=[],priority=p=>p.id===v.inside?0:p.id===v.pin?1:p.id===v.focus?.poi?2:3;
 const candidates=places.map(p=>({id:p.id,text:p.name,point:G.global(p,p.w/2,-19),priority:priority(p),distance:Math.hypot(p.x-v.x,p.y-v.y)}));
 for(const gate of gates)candidates.push({id:'gate:'+gate.id,text:'D-17 / RETOUR',point:{x:gate.x,y:gate.y-4},priority:2,distance:Math.hypot(gate.x-v.x,gate.y-v.y)});
 candidates.sort((a,b)=>a.priority-b.priority||a.distance-b.distance||String(a.id).localeCompare(String(b.id)));
 c.save();c.setTransform(dpr,0,0,dpr,0,0);c.font='12px sans-serif';c.textAlign='center';c.textBaseline='middle';
 const maxText=Math.max(20,Math.min(310,width-26));
 for(const item of candidates){const x=(item.point.x-v.x)*v.scale+width/2,y=(item.point.y-v.y)*v.scale+height/2;if(x<6||x>width-6||y<10||y>height-10)continue;
  let text=item.text;if(c.measureText(text).width>maxText){while(text.length&&c.measureText(text+'…').width>maxText)text=text.slice(0,-1);text+='…';}
  const w=c.measureText(text).width+10,box={id:item.id,text,x:x-w/2,y:y-9,w,h:18};
  if(box.x<6||box.x+w>width-6||used.some(r=>box.x<r.x+r.w+4&&box.x+box.w>r.x-4&&box.y<r.y+r.h+4&&box.y+box.h>r.y-4))continue;
  c.fillStyle='rgba(16,28,21,.84)';c.fillRect(box.x,box.y,box.w,box.h);c.fillStyle=item.priority<3?'#f2dca1':'#eee4bd';c.fillText(text,x,y);used.push(box);
 }
 c.restore();return used;
}
function sortEntries(entries){return entries.sort((a,b)=>a.depth-b.depth||String(a.id).localeCompare(String(b.id)));}
function lot(c,p,v,ground=true){if(ground)lotGround(c,p,v);lotFloor(c,p,v);for(const entry of sortEntries(lotEntries(root.DEADWALL,p,v)))entry.draw(c);if(v.z===0)lotLabel(c,p,v);}
function person(c,g,e,kind){c.save();c.scale(1/32,1/32);g.art.drawActor(c,kind==='player'&&g.actorPresentation?.player?g.actorPresentation.player(e):{id:e.id||0,visualIdentity:'region:'+kind+':'+e.id,x:e.x*32,y:e.y*32,facing:e.a||0,health:e.hp||100},kind,g.elapsed,g.settings.reducedMotion,false);c.restore();}
function kitLightHole(c,g,v,e){
 const sx=x=>(x-v.x)*v.scale+g.width/2,sy=y=>(y-v.y)*v.scale+g.height/2,r=e.r,points=[];
 c.save();c.beginPath();for(let i=0;i<=48;i++){const a=i*Math.PI*2/48,cos=Math.cos(a),sin=Math.sin(a);let len=r;for(let d=.3;d<=r;d+=.3)if(v.world.blocked(e.x+cos*d,e.y+sin*d,.01,v.z,v.inside)){len=d;break;}const point={x:sx(e.x+cos*len),y:sy(e.y+sin*len)};points.push(point);i?c.lineTo(point.x,point.y):c.moveTo(point.x,point.y);}
 c.closePath();c.clip();c.globalCompositeOperation='destination-out';const gradient=c.createRadialGradient(sx(e.x),sy(e.y),0,sx(e.x),sy(e.y),r*v.scale);gradient.addColorStop(0,'rgba(0,0,0,1)');gradient.addColorStop(.65,'rgba(0,0,0,.95)');gradient.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gradient;c.fillRect(sx(e.x)-r*v.scale,sy(e.y)-r*v.scale,2*r*v.scale,2*r*v.scale);c.restore();return{points,x:sx(e.x),y:sy(e.y),r:r*v.scale,color:e.color};
}
function tintLight(c,l){c.save();c.beginPath();l.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();c.globalCompositeOperation='screen';c.globalAlpha=opacity*.17;const gradient=c.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r);gradient.addColorStop(0,l.color);gradient.addColorStop(.45,l.color+'b0');gradient.addColorStop(1,l.color+'00');c.fillStyle=gradient;c.fillRect(l.x-l.r,l.y-l.r,l.r*2,l.r*2);c.restore();}

function night(g,v){const target=g.nightwatch.isBlackout()?1:Math.max(0,(1-g.daylight())*.82),dt=Math.max(0,Math.min(.1,g.elapsed-(last??g.elapsed)));last=g.elapsed;opacity+=Math.sign(target-opacity)*Math.min(Math.abs(target-opacity),dt/8);if(opacity<.005)return;if(!mask)mask=document.createElement('canvas');if(mask.width!==g.width||mask.height!==g.height){mask.width=g.width;mask.height=g.height;}const c=mask.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,g.width,g.height);c.globalCompositeOperation='source-over';fill(c,0,0,g.width,g.height,'rgba(0,0,0,'+opacity+')');const drive=v.car?.driving&&g.expeditions.car()?.fuel>0,torch=g.urban.lightingState().flashlight;if(drive||torch||target<1){const range=drive?22:torch?9:4,half=drive?.46:torch?.52:Math.PI;c.save();c.beginPath();c.moveTo(g.width/2,g.height/2);for(let i=0;i<=40;i++){const a=v.a-half+2*half*i/40,cos=Math.cos(a),sin=Math.sin(a);let r=range;for(let d=.35;d<range;d+=.35)if(v.world.blocked(v.x+cos*d,v.y+sin*d,.01,v.z,v.inside)){r=d;break;}c.lineTo(g.width/2+cos*r*v.scale,g.height/2+sin*r*v.scale);}c.closePath();c.clip();c.globalCompositeOperation='destination-out';const grad=c.createRadialGradient(g.width/2,g.height/2,0,g.width/2,g.height/2,range*v.scale);grad.addColorStop(0,'rgba(0,0,0,1)');grad.addColorStop(.65,'rgba(0,0,0,.95)');grad.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=grad;c.fillRect(0,0,g.width,g.height);c.restore();}const colored=[];for(const e of [...(g.essentials?.lights('region')||[]),...(g.nightGear?.lights('region')||[]),...(g.interventions134?.lights()||[])])if(e.z===v.z&&(e.z===0||e.inside===v.inside)){const x=(e.x-v.x)*v.scale+g.width/2,y=(e.y-v.y)*v.scale+g.height/2,r=e.r*v.scale;if(x+r<0||y+r<0||x-r>g.width||y-r>g.height)continue;const shape=kitLightHole(c,g,v,e);if(e.color)colored.push(shape);}g.ctx.drawImage(mask,0,0,g.width,g.height);for(const shape of colored)tintLight(g.ctx,shape);}
function scenery(c,t,v,used){if(root.DeadwallGround135?.drawScenery(c,t,v,used))return;c.save();c.translate(t.x,t.y);c.rotate(t.a);if(t.kind==='rock'){fill(c,-t.r,-t.r,t.r*2,t.r*2,'#9ba18a');fill(c,-t.r*.6,-t.r*.6,t.r,t.r,'#b5b8a0');}else{fill(c,-.18,-.18,.36,.36,'#715b3a');if(!used){c.globalAlpha=Math.hypot(t.x-v.x,t.y-v.y)<t.canopy?.28:.88;for(let i=0;i<5;i++){const a=i*Math.PI*.4;c.fillStyle=i%2?'#385334':'#4b633e';c.beginPath();c.arc(Math.cos(a)*t.canopy*.3,Math.sin(a)*t.canopy*.3,t.canopy*.56,0,Math.PI*2);c.fill();}}}c.restore();}
function depthEntries(g,v,view,places=v.world.nearPOI(v.x,v.y,Math.max(view.r-view.l,view.b-view.t)/2+30),evolution=g.worldEvolution?.overview()){
 const entries=[],add=(kind,id,depth,draw)=>entries.push({kind,id,depth,draw});
 for(const p of places)if(v.z===0||p.id===v.inside)entries.push(...lotEntries(g,p,v));
 if(v.z===0){
  if(v.car){const p=g.worldEvolution?.vehicleProfile?.()||{w:4.6,h:1.85},cv={...v.car,type:evolution?.fleet?.active||'break',w:p.w,h:p.h};add('car','player-car',vehicleDepth(cv),c=>car(c,cv,true,g.expeditions.car()?.health||0));}
  const r=Math.max(view.r-view.l,view.b-view.t)/2+30;
  for(const chunk of v.world.around(v.x,v.y,r))for(const t of [...chunk.trees,...chunk.rocks]){if(t.x<view.l-6||t.x>view.r+6||t.y<view.t-6||t.y>view.b+6)continue;const used=(v.taken[t.id]||0)>=t.amount-.001;if(used&&t.kind==='rock')continue;add(t.kind,t.id,t.y+(t.kind==='rock'?t.r*(Math.abs(Math.cos(t.a||0))+Math.abs(Math.sin(t.a||0))):0),c=>scenery(c,t,v,used));}
 }
 entries.push(...(root.DeadwallWorldEvolutionArt?.depthEntries?.(g,v,view,evolution)||[]));
 entries.push(...(root.DeadwallEssentialArt?.depthEntries?.(g,'region',v,view)||[]));
 entries.push(...(g.nightGear?.depthEntries?.('region',v,view)||[]));
 entries.push(...(g.survivalPack?.depthEntries?.(v,view)||[]));
 entries.push(...(g.campaignPack?.depthEntries?.(v,view)||[]));
 entries.push(...(g.worldOps131?.depthEntries?.(v,view)||[]));
 entries.push(...(g.chronicles131?.depthEntries?.(v,view)||[]));
 entries.push(...(g.succession133?.depthEntries?.('region',v,view)||[]));
 entries.push(...(g.barricades134?.depthEntries?.('region',v,view)||[]));
 entries.push(...(g.interventions134?.depthEntries?.('region',v,view)||[]));
 entries.push(...(g.arsenal134?.depthEntries?.('region',v,view)||[]));
 if(!v.car?.driving&&!g.player.dead)add('player','player',v.y,c=>{person(c,g,v,'player');root.DeadwallEssentialArt?.carried(c,g,v.x,v.y,1);g.nightGear?.drawCarried?.(c,'region',v);g.campaignPack?.draw(c,'region',v,{ground:false});});
 return sortEntries(entries);
}
function render(g,v){const c=g.ctx,s=v.scale,r=Math.max(g.width,g.height)/s/2+30,view={l:v.x-g.width/s/2-8,r:v.x+g.width/s/2+8,t:v.y-g.height/s/2-8,b:v.y+g.height/s/2+8};c.setTransform(g.dpr,0,0,g.dpr,0,0);fill(c,0,0,g.width,g.height,'#1e3023');c.save();c.translate(g.width/2,g.height/2);c.scale(s,s);c.translate(-v.x,-v.y);
 const places=v.z===0?v.world.nearPOI(v.x,v.y,r):v.world.pois.filter(p=>p.id===v.inside);
 if(v.z===0){if(!root.DeadwallGround135?.draw(c,v.world,view,{scale:s})){fill(c,view.l,view.t,view.r-view.l,view.b-view.t,'#65754f');for(let y=Math.floor(view.t/3)*3;y<view.b;y+=3)for(let x=Math.floor(view.l/3)*3;x<view.r;x+=3){const n=G.noise(v.world.seed,x,y,38);fill(c,x,y,3.04,3.04,'rgba(29,67,41,'+(n*.34)+')');}}if(v.world.generation>=6)for(const chunk of v.world.around(v.x,v.y,r))for(const d of chunk.decor||[])if(d.x>=view.l-2&&d.x<=view.r+2&&d.y>=view.t-2&&d.y<=view.b+2)root.DeadwallGround135?.drawDecor(c,d);for(const p of places)lotGround(c,p,v);const roads=[...v.world.roads,...places.map(p=>p.drive),...(root.DeadwallAtlasRender.getApproaches?.(g)||[])];root.DeadwallRoadKit.drawNetwork(c,roads,{view});}
 for(const p of places)lotFloor(c,p,v,g);
 const evolution=g.worldEvolution?.overview();
 if(v.z===0){root.DeadwallAtlasRender.drawHome(c,g,{world:true,scale:s,view:{left:view.l,right:view.r,top:view.t,bottom:view.b}});root.DeadwallWorldEvolutionArt?.drawGround?.(c,g,v,view,evolution);}
 for(const entry of depthEntries(g,v,view,places,evolution))entry.draw(c);
 if(v.z===0)lotLabels(c,places,v,{width:g.width,height:g.height,dpr:g.dpr,gates:root.DeadwallAtlasProjection.gatesFor?.(g)||[]});
 if(v.focus){c.strokeStyle='#e5cd84';c.lineWidth=.07;c.beginPath();c.arc(v.focus.x,v.focus.y,Math.max(.8,Math.hypot(v.focus.w||0,v.focus.h||0)/2+.15),0,Math.PI*2);c.stroke();}
 for(const b of v.bullets){c.strokeStyle='#f4d798';c.lineWidth=.05;c.beginPath();c.moveTo(b.x-b.dx*.3,b.y-b.dy*.3);c.lineTo(b.x,b.y);c.stroke();}if(v.action){c.strokeStyle='#e3ce90';c.lineWidth=.08;c.beginPath();c.arc(v.action.x,v.action.y,1.15,-Math.PI/2,-Math.PI/2+Math.PI*2*v.action.p);c.stroke();}c.restore();g.drawRain(c);night(g,v);g.drawCrosshair(c);}
function minimap(g,v){
 const vision=g.visibility?.frame?.(),c=g.mctx,w=g.minimap.width,h=g.minimap.height,indoor=v.z!==0&&v.poi,span=indoor?Math.max(24,Math.hypot(v.poi.w,v.poi.h)+8):320,s=w/span,view={l:v.x-span/2,r:v.x+span/2,t:v.y-h/s/2,b:v.y+h/s/2},seen=new Set(v.seen),places=v.world.nearPOI(v.x,v.y,Math.hypot(span/2,h/s/2)),guide=g.frontier.guidance?.();
 c.setTransform(1,0,0,1,0,0);fill(c,0,0,w,h,'#34492f');c.save();c.translate(w/2,h/2);c.scale(s,s);c.translate(-v.x,-v.y);
 // The outdoor GPS and the current floor have distinct, physical plans.
 if(!indoor){
 // Use the regional ground noise and live roads, not a second random map.
 if(!root.DeadwallGround135?.draw(c,v.world,view,{scale:s}))for(let y=Math.floor(view.t/16)*16;y<view.b;y+=16)for(let x=Math.floor(view.l/16)*16;x<view.r;x+=16)fill(c,x,y,16.04,16.04,'rgba(29,67,41,'+(G.noise(v.world.seed,x,y,38)*.34)+')');
 root.DeadwallRoadKit.drawNetwork(c,[...v.world.roads,...places.filter(p=>seen.has(p.id)).map(p=>p.drive),...(root.DeadwallAtlasRender.getApproaches?.(g)||[])],{view,markings:false,scale:s,minWidth:1.2,surface:'#a9ad86',shoulder:'#626e55',shoulderWidth:.65});
 root.DeadwallAtlasRender.drawHome(c,g,{scale:s,resources:true,units:true,view:{left:view.l,right:view.r,top:view.t,bottom:view.b}});
 for(const p of places)if(seen.has(p.id)){c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle='#d9c28c';c.fillRect(-p.w/2,-p.h/2,p.w,p.h);c.strokeStyle='#655f42';c.lineWidth=.7/s;c.strokeRect(-p.w/2,-p.h/2,p.w,p.h);c.restore();}
 }
 if(indoor){const p=v.poi,plan=v.world.plan(p,v.z);c.save();c.translate(p.x,p.y);c.rotate(p.a);c.translate(-p.w/2,-p.h/2);fill(c,0,0,p.w,p.h,'#536453');for(const a of plan.objects)fill(c,a.x,a.y,a.w,a.h,'#93a08b');for(const a of plan.walls)fill(c,a.x,a.y,a.w,a.h,'#dfd9bf');for(const a of plan.stairs)fill(c,a.x,a.y,a.w,a.h,'#e5bd70');c.restore();}
 if(!indoor&&guide?.path?.length){c.strokeStyle='#f5d278';c.lineWidth=2/s;c.setLineDash([5/s,3/s]);c.beginPath();guide.path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.setLineDash([]);}
 const field={w:g.width/v.scale,h:g.height/v.scale};c.strokeStyle='rgba(244,231,190,.58)';c.lineWidth=.8/s;c.setLineDash([3/s,3/s]);c.strokeRect(v.x-field.w/2,v.y-field.h/2,field.w,field.h);c.setLineDash([]);
 const marked=new Set();
 for(const e of [...(v.enemies||[]),...(g.worldEvolution?.groupMembers?.()||[]),...(g.succession133?.contacts?.()||[])])if(!marked.has(e.id)&&e.z===v.z&&vision?.canSeeRegional(e)){marked.add(e.id);c.fillStyle='#cb8270';c.beginPath();c.arc(e.x,e.y,1.7/s,0,Math.PI*2);c.fill();}
 if(!indoor)for(const e of g.zombies||[])if(vision?.canSeeLocal(e)){const q=root.DeadwallAtlasProjection.toRegion(e.x,e.y,g);c.fillStyle='#cb8270';c.beginPath();c.arc(q.x,q.y,1.7/s,0,Math.PI*2);c.fill();}
 if(v.car&&!indoor){c.save();c.translate(v.car.x,v.car.y);c.rotate(v.car.a);c.strokeStyle='#dcc88e';c.lineWidth=1/s;c.strokeRect(-3/s,-1.7/s,6/s,3.4/s);c.restore();}
 c.restore();c.save();c.translate(w/2,h/2);c.rotate(v.a);c.fillStyle='#fff0bd';c.strokeStyle='#283328';c.lineWidth=1;c.beginPath();c.moveTo(6,0);c.lineTo(-4,-4);c.lineTo(-2,0);c.lineTo(-4,4);c.closePath();c.fill();c.stroke();c.restore();
 // Border bearings stay useful beyond the 320 m window; they are not teleports.
 const marker=(point,label,color)=>{if(!point)return;const dx=(point.x-v.x)*s,dy=(point.y-v.y)*s,ratio=Math.max(1,Math.abs(dx)/(w/2-19),Math.abs(dy)/(h/2-33)),x=w/2+dx/ratio,y=h/2+dy/ratio;c.save();c.translate(x,y);c.fillStyle=color;c.strokeStyle='#142019';c.lineWidth=1.5;c.beginPath();if(ratio>1){c.rotate(Math.atan2(dy,dx));c.moveTo(6,0);c.lineTo(-4,-4);c.lineTo(-4,4);}else{c.moveTo(0,-4);c.lineTo(4,0);c.lineTo(0,4);c.lineTo(-4,0);}c.closePath();c.fill();c.stroke();c.restore();c.font='bold 9px sans-serif';c.textAlign=x>w*.7?'right':x<w*.3?'left':'center';c.fillStyle=color;c.fillText(label,x,y+13);};
 const home=g.core?.(),homePoint=home?root.DeadwallAtlasProjection.toRegion(home.x,home.y,g):null;
 if(!indoor)marker(homePoint,'D-17','#afe1cf');
 if(guide?.target&&!indoor)marker(guide.target,Math.round(guide.metres)+' m','#f8d176');
 if(guide){fill(c,0,0,w,19,'rgba(17,31,23,.94)');c.font='9px sans-serif';c.fillStyle='#f1d38e';c.textAlign='left';c.fillText(guide.status==='level-required'?'GPS · Rejoindre le rez-de-chaussée':guide.name,5,13,w-25);}
 fill(c,0,h-16,w,16,'rgba(17,31,23,.88)');c.font='9px sans-serif';c.textAlign='left';c.fillStyle='#c6cfae';c.fillText((indoor?(v.z<0?'Sous-sol':'Étage '+v.z):Math.round(span)+' m')+' · Graine '+v.world.seed,4,h-5);c.textAlign='right';c.fillText('N ↑',w-5,guide?31:12);c.textAlign='left';
 const label=root.document?.getElementById('minimapWrap')?.querySelector('.minimap-label');if(label)label.textContent=(indoor?'GPS · '+(v.z<0?'SOUS-SOL':'ÉTAGE '+v.z):'GPS RÉGIONAL')+' · M';
 g.minimap.setAttribute?.('aria-label','GPS régional, graine '+v.world.seed+', '+v.x.toFixed(1)+' / '+v.y.toFixed(1)+' mètres, niveau '+v.z+'. Contacts actuellement observés seulement.'+(guide?', destination '+guide.name:''));
 return{seed:v.world.seed,scale:s,field,level:v.z,position:{x:v.x,y:v.y},destination:guide?.id||null,places:places.filter(p=>seen.has(p.id)).map(p=>p.id)};
}

root.DeadwallFrontierArt={render,minimap,car,object,localShadow,lot,lotGround,lotFloor,lotEntries,lotLabels,depthEntries,rectDepth,vehicleDepth,visiblePoint,sortEntries,reset(){opacity=0;last=null;}};
})(globalThis);
