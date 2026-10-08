/* Native civilian silhouettes, fitted to the caller's real vehicle rectangle. */
(function(root,factory){
 'use strict';const api=factory();root.DeadwallVehicleArt152=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ASSETS=Object.freeze({d17Vehicles152:Object.freeze({url:'assets/art152/vehicles-atlas.png',width:1536,height:1024,matte:'none'})});
 const cuts={compact:[13,189,476,294],break:[503,181,600,313],motorcycle:[1104,197,422,274],skate:[14,688,486,167],bike:[514,644,594,245]};
 const SPRITES=Object.freeze(Object.fromEntries(Object.entries(cuts).map(([id,rect])=>[id,Object.freeze({atlas:'d17Vehicles152',rect:Object.freeze(rect)})])));
 function measure(type,w,h){
  if(!Object.hasOwn(SPRITES,type)||![w,h].every(Number.isFinite)||w<=0||h<=0)return null;
  const sprite=SPRITES[type],scale=Math.min(w/sprite.rect[2],h/sprite.rect[3]),dw=sprite.rect[2]*scale,dh=sprite.rect[3]*scale;
  return{atlas:sprite.atlas,source:sprite.rect,destination:[-dw/2,-dh/2,dw,dh]};
 }
 function drawStates(c,type,w,h,{hp,opened,dismantled,exhausted,active}){
  if(hp<=0){
   c.save();c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();c.fillStyle='rgba(24,30,25,.35)';c.beginPath();c.ellipse(w*.12,0,w*.15,h*.35,0,0,Math.PI*2);c.fill();c.strokeStyle='#a99b7e';c.lineWidth=h*.025;c.beginPath();c.moveTo(w*.35,-h*.28);c.lineTo(w*.39,0);c.lineTo(w*.32,h*.21);c.moveTo(w*.39,0);c.lineTo(w*.43,h*.13);c.stroke();c.restore();
  }
  // The historical small open profiles have neither a trunk nor a hood.
  if(type==='compact'||type==='break'){
   if(dismantled){
    c.fillStyle='#222a26';c.fillRect(w*.25,-h*.35,w*.19,h*.7);c.strokeStyle='#b5a58a';c.lineWidth=h*.025;c.strokeRect(w*.25,-h*.35,w*.19,h*.7);c.beginPath();c.moveTo(w*.43,-h*.35);c.lineTo(w*.56,-h*.62);c.lineTo(w*.3,-h*.53);c.stroke();
    if(exhausted){c.strokeStyle='#68736c';c.beginPath();c.moveTo(w*.28,-h*.25);c.lineTo(w*.4,h*.25);c.moveTo(w*.4,-h*.25);c.lineTo(w*.28,h*.25);c.stroke();}
   }
   if(opened){c.fillStyle='rgba(25,34,27,.85)';c.fillRect(-w*.49,-h*.32,w*.1,h*.64);c.strokeStyle='#ead7a2';c.lineWidth=h*.028;c.strokeRect(-w*.49,-h*.32,w*.1,h*.64);c.beginPath();c.moveTo(-w*.5,-h*.38);c.lineTo(-w*.59,-h*.57);c.lineTo(-w*.57,h*.3);c.lineTo(-w*.5,h*.38);c.stroke();}
  }
  if(active&&hp>0&&['compact','break','motorcycle'].includes(type)){
   c.fillStyle='#eed699';
   if(type==='motorcycle')c.fillRect(w*.47,-h*.06,w*.023,h*.12);
   else{c.fillRect(w*.47,-h*.35,w*.023,h*.11);c.fillRect(w*.47,h*.24,w*.023,h*.11);}
  }
 }
 function drawVehicle(c,art,type,w,h,{hp=1,opened=false,dismantled=false,exhausted=false,active=false}={}){
  const frame=measure(type,w,h);if(!frame||!c?.drawImage||!art?.images?.[frame.atlas])return false;
  c.save();if(hp<=0)c.globalAlpha*=.7;
  const painted=art.blit?art.blit(c,frame.atlas,frame.source,...frame.destination):(c.drawImage(art.images[frame.atlas],...frame.source,...frame.destination),true);
  c.restore();if(!painted)return false;
  // Service indicators attach to the scaled silhouette, while the caller keeps
  // its physical collision rectangle, sunlight shadow and depth unchanged.
  c.save();drawStates(c,type,frame.destination[2],frame.destination[3],{hp,opened,dismantled,exhausted,active});c.restore();return true;
 }
 return Object.freeze({ASSETS,SPRITES,measure,drawStates,drawVehicle});
});
