/* Original independent post parts. Only observed simulation strikes drive motion. */
(function(root,factory){
 'use strict';const api=factory();root.DeadwallPostArt159=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 const ASSETS=freeze({
  postPartsA159:{url:'assets/art159/posts-a.png',width:1536,height:1024,matte:'none'},
  postPartsB159:{url:'assets/art159/posts-b.png',width:1536,height:1024,matte:'none'}
 });
 // Full alpha components, measured on unchanged ImageGen PNGs.
 const CUTS=freeze({
  postPartsA159:[[83,44,220,235],[379,140,388,75],[842,39,230,242],[1147,142,371,75],[106,375,150,76],[379,377,393,100],[867,363,167,103],[1126,385,376,99],[32,519,282,256],[365,583,395,125],[782,512,295,276],[1115,599,397,115],[71,831,252,133],[371,848,403,120],[815,837,276,126],[1123,827,388,142]],
  postPartsB159:[[108,38,252,305],[417,41,321,305],[861,39,258,316],[1169,51,323,295],[101,416,228,79],[427,414,312,83],[851,421,242,80],[1178,404,293,97],[70,585,277,161],[478,585,241,169],[822,585,271,159],[1243,575,228,184],[119,825,195,125],[470,808,250,161],[871,829,209,118],[1233,799,231,177]]
 });
 const PIVOTS=freeze({
  tripod:[[.36,.51],[.35,.49]],heavyNest:[[.54,.49],[.51,.50]],
  boltNest:[[.38,.51],[.40,.48]],spikeFrame:[[.5,.5],[.5,.5]]
 });
 const WEAPON_PIVOTS=freeze({tripod:[[.33,.49],[.35,.51]],heavyNest:[[.33,.54],[.36,.52]],boltNest:[[.32,.51],[.32,.51]],spikeFrame:[[.13,.50],[.14,.52]]});
 const SIZES=freeze({tripod:{base:[39,40],weapon:[40,11]},heavyNest:{base:[53,48],weapon:[45,15]},boltNest:{base:[39,45],weapon:[43,41]},spikeFrame:{base:[43,30],weapon:[31,24]}});
 const sprite=(atlas,index,pivot=[.5,.5])=>freeze({atlas,rect:CUTS[atlas][index],pivot});
 const TYPES=freeze(Object.fromEntries(['tripod','heavyNest','boltNest','spikeFrame'].map((kind,index)=>{
  const atlas=index<2?'postPartsA159':'postPartsB159',row=index%2*8;
  return[kind,[0,1].map(v=>({base:sprite(atlas,row+v*2,PIVOTS[kind][v]),weapon:sprite(atlas,row+v*2+1,WEAPON_PIVOTS[kind][v]),supply:sprite(atlas,row+4+v*2),wreck:sprite(atlas,row+5+v*2,WEAPON_PIVOTS[kind][v])}))];
 })));
 function variantFor(seed,identity,kind){let h=(Number.isFinite(seed)?seed>>>0:0)^2166136261;for(const ch of String(identity)+':post159:'+kind)h=Math.imul(h^ch.charCodeAt(0),16777619);h=Math.imul(h^(h>>>16),0x7feb352d);return(h^(h>>>15))>>>0&1;}
 function select(kind,identity,seed=0){return Object.hasOwn(TYPES,kind)?TYPES[kind][variantFor(seed,identity,kind)]:null;}
 function pose(def,p,presentation,reducedMotion=false){
  const age=presentation?.shotElapsed,duration=presentation?.shotDuration;
  const active=!reducedMotion&&p.health>0&&Number.isFinite(age)&&age>=0&&Number.isFinite(duration)&&duration>0&&age<duration;
  const phase=active?age/duration:1,pulse=active?Math.sin(phase*Math.PI):0;
  return freeze({active,phase,recoil:def?.id==='spikeFrame'?pulse*7:-pulse*3,boltRetract:def?.id==='boltNest'?pulse*5:0,muzzle:active&&def?.ammoPerReload>0&&def.id!=='boltNest'&&phase<.22,empty:!!(def?.ammoPerReload>0&&p.item?.rounds<=0),broken:p.health<=0||p.item?.condition<=0});
 }
 function drawPart(c,art,s,width,height,x=0,y=0){
  const r=s.rect,scale=Math.min(width/r[2],height/r[3]),w=r[2]*scale,h=r[3]*scale,d=[x-w*s.pivot[0],y-h*s.pivot[1],w,h];
  return art.blit?art.blit(c,s.atlas,r,...d)!==false:(c.drawImage(art.images[s.atlas],...r,...d),true);
 }
 function drawPost(c,art,p,def,{seed=0,reducedMotion=false,presentation=null}={}){
  const kind=def?.id||p?.item?.id,parts=select(kind,p?.item?.uid,seed),size=SIZES[kind];
  if(!parts||!p?.item||![p.x,p.y,p.angle,p.health,p.item.condition].every(Number.isFinite)||!c?.drawImage||!art?.images?.[parts.base.atlas])return false;
  const state=pose(def,p,presentation,reducedMotion);
  c.save();
  try{
   c.translate(p.x,p.y);if(p.health<=0)c.globalAlpha*=.68;
   // The support never rotates with target acquisition. Only its mounted part turns.
   if(!drawPart(c,art,parts.base,...size.base))return false;
   c.save();try{c.rotate(p.angle);if(!drawPart(c,art,state.broken?parts.wreck:parts.weapon,...size.weapon,state.recoil,0))return false;
    if(kind==='spikeFrame'&&!state.broken){if(!drawPart(c,art,parts.supply,13,8,-9-state.recoil*.25,0))return false;}
    else if(!state.empty&&!state.broken){if(!drawPart(c,art,parts.supply,kind==='heavyNest'?16:11,kind==='boltNest'?5:9,kind==='boltNest'?state.boltRetract:-7,kind==='boltNest'?0:11))return false;}
    if(state.muzzle&&typeof art.drawEffect==='function')art.drawEffect(c,'muzzle',size.weapon[0]*(1-parts.weapon.pivot[0])+state.recoil,0,15,state.phase/.22,.8);
   }finally{c.restore();}
   if(state.empty&&p.health>0){c.strokeStyle='#a78f63';c.lineWidth=1.2;c.beginPath();c.moveTo(-4,17);c.lineTo(4,17);c.stroke();}
   return true;
  }finally{c.restore();}
 }
 return freeze({ASSETS,CUTS,TYPES,PIVOTS,WEAPON_PIVOTS,SIZES,variantFor,select,pose,drawPart,drawPost});
});
