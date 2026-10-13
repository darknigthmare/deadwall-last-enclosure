/* Native structural surfaces, clipped to their existing physical geometry. */
(function(root,factory){
 'use strict';const api=factory();root.DeadwallStructureArt159=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const freeze=value=>{for(const item of Object.values(value))if(item&&typeof item==='object')freeze(item);return Object.freeze(value);};
 const ASSETS=freeze({art159Structures:{url:'assets/art159/structures.png',width:1536,height:1024,matte:'none'}});
 const FAMILIES=freeze({
  stair:[{atlas:'art159Structures',rect:[106,61,282,646],material:'timber'},{atlas:'art159Structures',rect:[623,58,288,647],material:'steel'},{atlas:'art159Structures',rect:[1142,59,290,647],material:'concrete'}],
  partition:[{atlas:'art159Structures',rect:[24,815,457,116],material:'plaster'},{atlas:'art159Structures',rect:[539,815,458,116],material:'brick'},{atlas:'art159Structures',rect:[1053,815,458,116],material:'concrete'}]
 });
 function hash(...parts){let result=2166136261;for(const part of parts)for(const char of String(part)){result^=char.charCodeAt(0);result=Math.imul(result,16777619);}return result>>>0;}
 function select(family,identity,{seed=0,floor=0,variant}={}){
  if(!Object.hasOwn(FAMILIES,family))return null;const choices=FAMILIES[family];
  if(variant!==undefined&&(!Number.isInteger(variant)||variant<0||variant>=choices.length))return null;
  const index=variant??hash(seed,identity,family,family==='stair'?0:floor)%choices.length;
  return choices[index];
 }
 function validRect(rect){return !!(rect&&[rect.x,rect.y,rect.w,rect.h].every(Number.isFinite)&&rect.w>0&&rect.h>0);}
 function ready(art,sprite){const image=sprite&&art?.images?.[sprite.atlas];return !!(image&&image.width>=sprite.rect[0]+sprite.rect[2]&&image.height>=sprite.rect[1]+sprite.rect[3]);}
 function blit(ctx,art,sprite,...target){
  if(typeof art.blit==='function')return art.blit(ctx,sprite.atlas,sprite.rect,...target)!==false;
  ctx.drawImage(art.images[sprite.atlas],...sprite.rect,...target);return true;
 }
 function drawStair(ctx,art,stair,options={}){
  if(!ctx||!validRect(stair))return false;
  // One physical staircase keeps its material when traversing its levels.
  const identity=options.poiId+':'+(stair.id??[stair.x,stair.y].join(':')),sprite=select('stair',identity,options);
  if(!ready(art,sprite))return false;ctx.save();ctx.beginPath();ctx.rect(stair.x,stair.y,stair.w,stair.h);ctx.clip();
  try{return blit(ctx,art,sprite,stair.x,stair.y,stair.w,stair.h);}finally{ctx.restore();}
 }
 function drawPartition(ctx,art,wall,options={}){
  if(!ctx||!validRect(wall))return false;
  // All walls on this floor share a structural material. Door openings remain
  // the spaces between the exact source rectangles; no new wall is inferred.
  const sprite=select('partition',options.poiId??'building',options);if(!ready(art,sprite))return false;
  const vertical=wall.h>wall.w,length=vertical?wall.h:wall.w,thickness=vertical?wall.w:wall.h,preferredTile=thickness*sprite.rect[2]/sprite.rect[3];
  if(!(preferredTile>0)||!Number.isFinite(preferredTile))return false;
  const maxPartitionSegments=256,count=Math.max(1,Math.min(maxPartitionSegments,Math.ceil(length/preferredTile))),tile=Math.max(preferredTile,length/count);
  ctx.save();ctx.beginPath();ctx.rect(wall.x,wall.y,wall.w,wall.h);ctx.clip();
  if(vertical){ctx.translate(wall.x+wall.w,wall.y);ctx.rotate(Math.PI/2);}else ctx.translate(wall.x,wall.y);
  try{for(let index=0;index<count;index++)if(!blit(ctx,art,sprite,index*tile,0,tile,thickness))return false;return true;}finally{ctx.restore();}
 }
 return{ASSETS,FAMILIES,select,drawStair,drawPartition};
});
