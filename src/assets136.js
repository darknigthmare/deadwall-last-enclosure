/* Shared visual catalogue. Images are loaded once by Art; equipment identity stays in Arsenal. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallAssets136=api;if(typeof module==='object'&&module.exports)module.exports=api;})(globalThis,function(root){
'use strict';
const FILES=Object.freeze({
 Oak:'assets/art136/oak.png',Pine:'assets/art136/pine.png',Willow:'assets/art136/willow.png',Limestone:'assets/art136/limestone.png',
 Beech:'assets/art136/beech.png',Birch:'assets/art136/birch.png',Fir:'assets/art136/fir.png',Poplar:'assets/art136/poplar.png',Alder:'assets/art136/alder.png',Fruit:'assets/art136/fruit.png',Granite:'assets/art136/granite.png',Schist:'assets/art136/schist.png',Scree:'assets/art136/scree.png',
 ForestFloor:'assets/art136/forest-floor.png',WetGround:'assets/art136/wet-ground.png',Generator:'assets/art136/generator.png',ElectricalPanel:'assets/art136/electrical-panel.png',
 LockChest:'assets/art136/lock-chest.png',Shotgun:'assets/art136/shotgun.png',Crowbar:'assets/art136/crowbar.png',Hatchet:'assets/art136/hatchet.png',Hammer:'assets/art136/hammer.png',Machete:'assets/art136/machete.png',
 Tripod:'assets/art136/tripod.png',HeavyNest:'assets/art136/heavy-nest.png',BoltNest:'assets/art136/bolt-nest.png',SpikeFrame:'assets/art136/spike-frame.png'
});
const DIMENSIONS=Object.freeze({Oak:[1254,1254],Pine:[1254,1254],Willow:[1254,1254],Limestone:[1254,1254],Beech:[1254,1254],Birch:[1254,1254],Fir:[1254,1254],Poplar:[1254,1254],Alder:[1254,1254],Fruit:[1254,1254],Granite:[1254,1254],Schist:[1254,1254],Scree:[1254,1254],ForestFloor:[1254,1254],WetGround:[1254,1254],Generator:[1536,1024],ElectricalPanel:[1254,1254],LockChest:[1448,1086],Shotgun:[2178,722],Crowbar:[1254,1254],Hatchet:[1254,1254],Hammer:[1254,1254],Machete:[1254,1254],Tripod:[1254,1254],HeavyNest:[1254,1254],BoltNest:[1254,1254],SpikeFrame:[1263,1246]});
const ASSETS=Object.freeze(Object.fromEntries(Object.entries(FILES).map(([id,file])=>['art136'+id,Object.freeze({url:file,width:DIMENSIONS[id]?.[0]||1024,height:DIMENSIONS[id]?.[1]||1024,matte:'none'})])));
// Material presentation is deliberately restricted to the existing industrial types.
// It adds no collision, floor, material inventory or generator metadata.
const ASSETS138=Object.freeze({
 art138RoofMetal:Object.freeze({url:'assets/art138/roof-metal.png',width:1254,height:1254,matte:'none'}),
 art138InteriorConcrete:Object.freeze({url:'assets/art138/interior-concrete.png',width:1254,height:1254,matte:'none'})
});
const ASSETS139=Object.freeze({
 art139Bus:Object.freeze({url:'assets/art139/bus.png',width:1983,height:793,matte:'none'}),
 art139Truck:Object.freeze({url:'assets/art139/truck.png',width:2157,height:729,matte:'none'})
});
const VEHICLE_SPRITES139=Object.freeze({bus:'art139Bus',truck:'art139Truck'});
const ASSETS140=Object.freeze({
 art140Van:Object.freeze({url:'assets/art140/van.png',width:2016,height:780,matte:'none'}),
 art140Buggy:Object.freeze({url:'assets/art140/buggy.png',width:1774,height:887,matte:'none'})
});
const ASSETS141=Object.freeze({art141Reeds:Object.freeze({url:'assets/art141/reeds.png',width:1356,height:1160,matte:'none'}),art141FallenBranch:Object.freeze({url:'assets/art141/fallen-branch.png',width:1536,height:1024,matte:'none'})});
const VEHICLE_SPRITES140=Object.freeze({van:'art140Van',buggy:'art140Buggy'});
// D-17's established driving footprint uses this compact conversion, while the
// regional rectangle is in metres. Presentation must follow each real support.
function vehicleSize139(profile,domain='region'){
 const scale=domain==='local'?2*22/4.6:1;
 return{w:profile.w*scale,h:profile.h*scale,scale};
}
function drawVehicle139(c,art,type,w,h,{hp=1,opened=false,dismantled=false,exhausted=false,active=false}={}){
 const key=VEHICLE_SPRITES139[type]||VEHICLE_SPRITES140[type];if(!key||!c||![w,h].every(Number.isFinite)||w<=0||h<=0)return false;
 const image=art?.images?.[key],spec=ASSETS139[key]||ASSETS140[key];
 if(image&&spec){
  const r=art.rects?.[key+':sprite']||[0,0,image.width||spec.width,image.height||spec.height],scale=Math.min(w/r[2],h/r[3]);
  c.save();if(hp<=0)c.globalAlpha*=.7;
  if(art.blit)art.blit(c,key,r,-r[2]*scale/2,-r[3]*scale/2,r[2]*scale,r[3]*scale);else c.drawImage(image,...r,-r[2]*scale/2,-r[3]*scale/2,r[2]*scale,r[3]*scale);c.restore();
 }else{
  // Failed/slow images keep the correct closed van or open buggy silhouette.
  c.fillStyle=hp>0?'#a79b70':'#55574d';c.fillRect(-w/2,-h*(type==='buggy'?.27:.43),w,h*(type==='buggy'?.54:.86));
  c.fillStyle='#293b37';for(const x of [-w*.32,w*.3]){c.fillRect(x-w*.045,-h/2,w*.09,h*.16);c.fillRect(x-w*.045,h*.34,w*.09,h*.16);}
  c.fillStyle='#314e50';c.fillRect(w*.32,-h*(type==='buggy'?.22:.36),w*.09,h*(type==='buggy'?.44:.72));
  if(type==='bus'){for(let x=-w*.4;x<w*.25;x+=w*.085){c.fillRect(x,-h*.42,w*.065,h*.08);c.fillRect(x,h*.34,w*.065,h*.08);}c.fillStyle='#849183';for(const x of [-w*.24,w*.04])c.fillRect(x,-h*.23,w*.13,h*.46);}
  else if(type==='truck'){c.fillStyle='#718275';c.fillRect(w*.24,-h*.42,w*.2,h*.84);c.fillStyle='#6d6b54';c.fillRect(-w*.46,-h*.38,w*.65,h*.76);c.strokeStyle='#b5a58a';c.lineWidth=h*.035;for(let x=-w*.4;x<w*.14;x+=w*.13){c.beginPath();c.moveTo(x,-h*.36);c.lineTo(x,h*.36);c.stroke();}}
  else if(type==='van'){c.fillStyle='#b2ac91';c.fillRect(-w*.45,-h*.35,w*.7,h*.7);c.strokeStyle='#797f6e';c.lineWidth=h*.02;for(let x=-w*.36;x<w*.2;x+=w*.16){c.beginPath();c.moveTo(x,-h*.3);c.lineTo(x,h*.3);c.stroke();}}
  else{c.fillStyle='#293b37';c.fillRect(-w*.22,-h*.3,w*.46,h*.6);c.fillStyle='#8d7957';for(const y of [-h*.25,h*.05])c.fillRect(-w*.16,y,w*.22,h*.2);c.strokeStyle='#bac0a7';c.lineWidth=h*.05;c.strokeRect(-w*.24,-h*.3,w*.48,h*.6);c.beginPath();c.moveTo(-w*.24,-h*.3);c.lineTo(w*.24,h*.3);c.moveTo(-w*.24,h*.3);c.lineTo(w*.24,-h*.3);c.stroke();}
 }
 if(hp<=0){c.save();c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();c.fillStyle='rgba(24,30,25,.35)';c.beginPath();c.ellipse(w*.12,0,w*.15,h*.35,0,0,Math.PI*2);c.fill();c.strokeStyle='#a99b7e';c.lineWidth=h*.025;c.beginPath();c.moveTo(w*.35,-h*.28);c.lineTo(w*.39,0);c.lineTo(w*.32,h*.21);c.moveTo(w*.39,0);c.lineTo(w*.43,h*.13);c.stroke();c.restore();}
 // The open buggy has its engine behind the seats and storage in its front nose.
 if(dismantled){c.save();if(type==='buggy')c.scale(-1,1);c.fillStyle='#222a26';c.fillRect(w*.25,-h*.35,w*.19,h*.7);c.strokeStyle='#b5a58a';c.lineWidth=h*.025;c.strokeRect(w*.25,-h*.35,w*.19,h*.7);c.beginPath();c.moveTo(w*.43,-h*.35);c.lineTo(w*.56,-h*.62);c.lineTo(w*.3,-h*.53);c.stroke();if(exhausted){c.strokeStyle='#68736c';c.beginPath();c.moveTo(w*.28,-h*.25);c.lineTo(w*.4,h*.25);c.moveTo(w*.4,-h*.25);c.lineTo(w*.28,h*.25);c.stroke();}c.restore();}
 if(opened){c.save();if(type==='buggy')c.scale(-1,1);c.fillStyle='rgba(25,34,27,.85)';c.fillRect(-w*.49,-h*.32,w*.1,h*.64);c.strokeStyle='#ead7a2';c.lineWidth=h*.028;c.strokeRect(-w*.49,-h*.32,w*.1,h*.64);c.beginPath();c.moveTo(-w*.5,-h*.38);c.lineTo(-w*.59,-h*.57);c.lineTo(-w*.57,h*.3);c.lineTo(-w*.5,h*.38);c.stroke();c.restore();}
 if(active&&hp>0){c.fillStyle='#eed699';c.fillRect(w*.47,-h*.35,w*.023,h*.11);c.fillRect(w*.47,h*.24,w*.023,h*.11);}
 return true;
}
const INDUSTRIAL138=Object.freeze(['warehouse','selfstorage','garage','sawmill','freight','logisticsHall','smallWorkshop','generatorRoom']);
let surfacePatterns138=new WeakMap(),surfaceTiles138=new WeakMap();
function surfaceFor138(type,part,{z=0,domain='region'}={}){
 const industrial=domain==='local'?type==='workshop':INDUSTRIAL138.includes(type);
 if(part==='roof'&&industrial)return'art138RoofMetal';
 if(part==='floor'&&(industrial||domain==='region'&&type==='basementHouse'&&z<0))return'art138InteriorConcrete';
 return null;
}
function drawSurface138(c,art,key,x,y,w,h,{tile=4,alpha=.65}={}){
 const image=art?.images?.[key];if(!ASSETS138[key]||!image||!c?.createPattern||![x,y,w,h,tile,alpha].every(Number.isFinite)||w<=0||h<=0||tile<=0)return false;
 let patterns=surfacePatterns138.get(c);if(!patterns){patterns=new Map();surfacePatterns138.set(c,patterns);}
 let entry=patterns.get(key);if(!entry||entry.image!==image){
  let source=surfaceTiles138.get(image);
  if(!source){source=root.document?.createElement?.('canvas');if(source){source.width=source.height=256;const cc=source.getContext('2d');cc.imageSmoothingEnabled=true;cc.imageSmoothingQuality='high';cc.drawImage(image,0,0,256,256);}else source=image;surfaceTiles138.set(image,source);}
  entry={image,source,pattern:c.createPattern(source,'repeat')};patterns.set(key,entry);
 }
 if(!entry.pattern)return false;
 // Context scale fixes real material size; the pattern origin stays in the lot
 // coordinate system and therefore cannot swim when camera/zoom changes.
 const scale=tile/(entry.source.width||ASSETS138[key].width);
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.globalAlpha*=Math.max(0,Math.min(1,alpha));c.scale(scale,scale);c.fillStyle=entry.pattern;c.fillRect(x/scale,y/scale,w/scale,h/scale);c.restore();
 if(art.diagnostics?.draws)art.diagnostics.draws[key]=(art.diagnostics.draws[key]||0)+1;return true;
}
const TREE_SPRITES=Object.freeze({oak:'art136Oak',beech:'art136Beech',birch:'art136Birch',pine:'art136Pine',fir:'art136Fir',willow:'art136Willow',poplar:'art136Poplar',alder:'art136Alder',fruit:'art136Fruit'});
const ROCK_SPRITES=Object.freeze({limestone:'art136Limestone',granite:'art136Granite',schist:'art136Schist',scree:'art136Scree'});
const BITMAPS=Object.freeze({shotgun:'art136Shotgun',crowbar:'art136Crowbar',hatchet:'art136Hatchet',hammer:'art136Hammer',machete:'art136Machete',tripod:'art136Tripod',heavyNest:'art136HeavyNest',boltNest:'art136BoltNest',spikeFrame:'art136SpikeFrame'});
const LEGACY=Object.freeze({pistol:[0,3],rifle:[1,3],pickaxe:[2,3],shovel:[3,3]});
const PATHS=Object.freeze({
 firearm:'M12 24H87V33H48L42 52H30L35 33H12ZM87 26H112V31H87M16 25L6 41H27',
 shotgun:'M8 33L28 23H111V28H52V36H31L14 46ZM63 26V33H88V26',
 knife:'M18 50L40 30L49 39L28 58ZM40 30L106 7L77 39L49 39Z',
 machete:'M13 49L33 34L43 42L25 57ZM33 34L97 9L111 17L95 32L43 42Z',
 hatchet:'M26 58L78 9L86 17L33 62ZM66 14L76 3L109 19L98 39L84 24Z',
 crowbar:'M23 55L81 11L91 7L105 16L109 24L101 29L95 18L87 18L29 61Z',
 hammer:'M25 57L78 13L84 20L32 63ZM65 10L76 1L95 15L112 17L113 24L95 26Z',
 assemblyHammer:'M19 58L74 15L82 22L27 63ZM57 11L69 1L100 22L92 33L78 23L64 20Z',
 wreckingBar:'M13 57L87 7Q97 0 107 10L113 22L102 27L98 17L91 15L21 63ZM14 54L7 53L3 60L12 63Z',
 pickaxe:'M24 60L75 16L82 21L31 63ZM50 11Q82 0 113 29L90 19L68 18Z',
 shovel:'M21 57L45 35L49 39L28 62ZM45 35L80 8L87 14L53 42ZM71 9L84 2L98 10L85 21Z',
 plank:'M15 48L95 9L111 21L27 61Z',pipe:'M18 51L100 10L105 20L24 60Z',
 bottleClub:'M25 50L68 25L77 27L99 11L110 23L87 42L78 40L32 59Z',
 spear:'M10 58L84 20L89 23L14 62ZM83 20L111 4L104 26L89 23Z',
 longSpear:'M5 59L81 18L85 22L8 63ZM80 18L113 3L105 25L85 22Z',
 bat:'M17 56L55 29L67 16Q91 4 101 12Q108 23 91 34L65 40L23 62Z',
 maul:'M25 58L73 19L81 25L32 63ZM61 12L76 1L110 30L96 42Z',
 riotBaton:'M19 52L95 10L102 19L27 61ZM64 34L46 13L39 19L56 39Z',
 tripod:'M18 55L50 29L86 55M50 29V62M34 19H78V37H34ZM78 23H112V30H78',
 heavyNest:'M12 48L23 26H86L108 48V59H12ZM45 15H79V32H45ZM79 19H114V25H79',
 boltNest:'M18 56L51 30L89 56M51 30V61M30 11Q58 30 29 47M31 13L97 28L31 45M50 28H110',
 spikeFrame:'M15 51H108M20 29H106M28 60V12L24 19M51 59V8L47 15M77 59V12L73 19M101 60V9L97 16',
 ammo:'M14 25H105V57H14ZM10 18H110V25H10ZM44 18V9H77V18M40 35V46M57 35V46M74 35V46',
 fuel:'M33 14H84L92 22V58H25V23ZM37 14V6H69V14M37 28L78 49M78 28L37 49',
 deployed:'M18 55L50 29L86 55M50 29V62M34 19H78V37H34ZM78 23H112V30H78'
});
function path(id,category){return PATHS[id]||PATHS[category]||PATHS.firearm;}
function bitmap(id){return ASSETS[BITMAPS[id]]||null;}
function icon(doc,id,{category='',className='',art=root.DEADWALL?.art}={}){
 const box=doc.createElement('span');box.className=className;box.setAttribute('aria-hidden','true');box.dataset.equipment=id;
 if(['ammo','fuel'].includes(id)&&art?.images?.[id==='ammo'?'operations':'props']){const canvas=doc.createElement('canvas');canvas.width=96;canvas.height=64;canvas.style.width='100%';canvas.style.height='100%';canvas.style.objectFit='contain';const c=canvas.getContext('2d'),atlas=id==='ammo'?'operations':'props',r=id==='ammo'?[503,616,263,284]:art.rects?.['props:fuel']||[627,313,313,314],s=Math.min(88/r[2],60/r[3]);art.blit(c,atlas,r,(96-r[2]*s)/2,(64-r[3]*s)/2,r[2]*s,r[3]*s);box.style.backgroundImage='none';box.appendChild(canvas);return box;}
 const spec=bitmap(id);
 if(spec&&art?.images?.[BITMAPS[id]]){const img=doc.createElement('img');img.src=spec.url;img.alt='';img.decoding='async';img.style.width='100%';img.style.height='100%';img.style.objectFit='contain';box.style.backgroundImage='none';box.appendChild(img);return box;}
 if(LEGACY[id]){const[x,y]=LEGACY[id],crop=doc.createElement('span');crop.style.display='block';crop.style.height='100%';crop.style.width='auto';crop.style.aspectRatio='1';crop.style.backgroundImage="url('assets/loadout-items129.png')";crop.style.backgroundSize='400% 400%';crop.style.backgroundRepeat='no-repeat';crop.style.backgroundPosition=(x*100/3)+'% '+(y*100/3)+'%';box.style.display='flex';box.style.justifyContent='center';box.style.backgroundImage='none';box.appendChild(crop);return box;}
 const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg'),p=doc.createElementNS('http://www.w3.org/2000/svg','path');svg.setAttribute('viewBox','0 0 120 64');svg.style.width='100%';svg.style.height='100%';p.setAttribute('d',path(id,category));p.setAttribute('fill','none');p.setAttribute('stroke','currentColor');p.setAttribute('stroke-width','4');p.setAttribute('stroke-linejoin','round');svg.appendChild(p);box.style.backgroundImage='none';box.appendChild(svg);return box;
}
function drawSprite(ctx,art,key,x,y,width,height=width,{alpha=1,angle=0}={}){
 const image=art?.images?.[key],spec=ASSETS[key]||ASSETS141[key];if(!image||!spec||!ctx||![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return false;
 const r=art.rects?.[key+':sprite']||[0,0,image.width||spec.width,image.height||spec.height],s=Math.min(width/r[2],height/r[3]),w=r[2]*s,h=r[3]*s;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;
 if(art.blit)art.blit(ctx,key,r,-w/2,-h/2,w,h);else ctx.drawImage(image,...r,-w/2,-h/2,w,h);ctx.restore();return true;
}
// These compact overhead tools are intentional vector counterparts to inventory illustrations.
// No firearm bitmap is painted behind a melee weapon, including low postures and attacks.
function drawHeld(ctx,id){
 ctx.save();ctx.translate(9,8);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle=['pipe','crowbar','riotBaton'].includes(id)?'#a4aaa1':'#a58b60';ctx.fillStyle='#b5b8a9';
 const long=['spear','longSpear'].includes(id),len=long?42:id==='hatchet'?16:id==='hammer'?13:id==='assemblyHammer'?22:id==='wreckingBar'?34:id==='knife'?13:id==='machete'?23:28;
 ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(len,0);ctx.stroke();
 if(long){ctx.beginPath();ctx.moveTo(len-3,-3);ctx.lineTo(len+12,0);ctx.lineTo(len-3,3);ctx.closePath();ctx.fill();}
 else if(id==='knife'||id==='machete'){ctx.beginPath();ctx.moveTo(4,-3);ctx.lineTo(len+7,-2);ctx.lineTo(len+11,0);ctx.lineTo(4,3);ctx.closePath();ctx.fill();}
 else if(['hatchet','hammer','maul','pickaxe'].includes(id)){if(id==='pickaxe'){ctx.beginPath();ctx.moveTo(len-3,-12);ctx.quadraticCurveTo(len+8,0,len-3,12);ctx.stroke();}else{if(id==='hatchet')ctx.fillRect(len-3,-6,5,8);else if(id==='hammer')ctx.fillRect(len-3,-4,6,8);else ctx.fillRect(len-4,-7,11,14);}}
 else if(id==='crowbar'){ctx.beginPath();ctx.moveTo(len,0);ctx.quadraticCurveTo(len+8,-9,len-1,-9);ctx.stroke();}
 else if(id==='assemblyHammer'){ctx.fillRect(len-5,-5,10,10);ctx.beginPath();ctx.moveTo(len-5,-4);ctx.lineTo(len-11,-9);ctx.lineTo(len-14,-6);ctx.stroke();}
 else if(id==='wreckingBar'){ctx.beginPath();ctx.moveTo(len,0);ctx.quadraticCurveTo(len+9,-11,len-2,-11);ctx.moveTo(-5,0);ctx.lineTo(-11,4);ctx.lineTo(-13,1);ctx.stroke();}
 else if(id==='shovel'){ctx.beginPath();ctx.ellipse(len+4,0,9,5,0,0,Math.PI*2);ctx.fill();}
 else if(id==='riotBaton'){ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(7,-9);ctx.stroke();}
 else if(['bat','plank','bottleClub'].includes(id)){ctx.lineWidth=id==='plank'?7:6;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(len+2,0);ctx.stroke();}
 ctx.restore();
}
return Object.freeze({ASSETS,ASSETS138,ASSETS139,ASSETS140,ASSETS141,VEHICLE_SPRITES139,VEHICLE_SPRITES140,vehicleSize139,drawVehicle139,INDUSTRIAL138,surfaceFor138,drawSurface138,FILES,TREE_SPRITES,ROCK_SPRITES,BITMAPS,LEGACY,PATHS,bitmap,icon,path,drawSprite,drawHeld});
});
