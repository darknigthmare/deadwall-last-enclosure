/* Twenty original paid-support silhouettes; existing owners retain every rule. */
(function(root,factory){
 'use strict';const api=factory(root);root.DeadwallD17Art150=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const A149=root.DeadwallD17Art149||(typeof require==='function'?require('./d17-art149.js'):null);
 const ASSETS=Object.freeze({
  d17Defense150:Object.freeze({url:'assets/art150/defense-atlas.png',width:1536,height:1024,matte:'none'}),
  d17Medical150:Object.freeze({url:'assets/art150/medical-atlas.png',width:1536,height:1024,matte:'none'}),
  d17Production150:Object.freeze({url:'assets/art150/production-atlas.png',width:1536,height:1024,matte:'none'}),
  d17District150:Object.freeze({url:'assets/art150/district-atlas.png',width:1536,height:1024,matte:'none'})
 });
 // Complete alpha components, measured rather than divided into nominal cells.
 const SPRITES=Object.freeze(Object.fromEntries(Object.entries({
  casemate150:{atlas:'d17Defense150',rect:[38,45,431,360]},
  reinforcedCasemate150:{atlas:'d17Defense150',rect:[531,51,456,368]},
  twinGun150:{atlas:'d17Defense150',rect:[1080,46,425,372]},
  concreteWatch150:{atlas:'d17Defense150',rect:[101,422,314,558]},
  frontBattery150:{atlas:'d17Defense150',rect:[547,520,443,430]},
  aidStation150:{atlas:'d17Medical150',rect:[107,191,356,262]},
  triageStation150:{atlas:'d17Medical150',rect:[573,150,391,301]},
  sterilizationLab150:{atlas:'d17Medical150',rect:[1032,55,464,398]},
  medicalComplex150:{atlas:'d17Medical150',rect:[56,527,494,412]},
  equippedShelter150:{atlas:'d17Medical150',rect:[614,511,493,419]},
  courtyardGarden150:{atlas:'d17Production150',rect:[44,32,414,401]},
  biofuelYard150:{atlas:'d17Production150',rect:[488,27,508,413]},
  electricCannery150:{atlas:'d17Production150',rect:[1023,43,496,401]},
  electricGreenhouse150:{atlas:'d17Production150',rect:[18,508,575,456]},
  continuityArsenal150:{atlas:'d17Production150',rect:[602,493,581,482]},
  gateStore150:{atlas:'d17District150',rect:[52,63,399,375]},
  solarPark150:{atlas:'d17District150',rect:[513,28,504,437]},
  garrisonQuarters150:{atlas:'d17District150',rect:[1048,46,450,430]},
  wallStore150:{atlas:'d17District150',rect:[35,517,481,398]},
  dualRecovery150:{atlas:'d17District150',rect:[580,528,427,395]}
 }).map(([id,s])=>[id,Object.freeze({atlas:s.atlas,rect:Object.freeze(s.rect)})])));
 const GUNS=Object.freeze({casemate150:1,reinforcedCasemate150:1,twinGun150:2,concreteWatch150:1});
 function spriteFor(value){const type=typeof value==='string'?value:value?.type||value?.id;return Object.hasOwn(SPRITES,type)?SPRITES[type]:null;}
 function riseFor(b){return b?.def?.family150==='watch'?56:b?.def?.floors?Math.min(108,b.def.floors*5):18;}
 function measure(b){
  const s=spriteFor(b);if(!s||![b.x,b.y,b.w,b.h].every(Number.isFinite)||b.w<=0||b.h<=0)return null;
  const inset=3,rise=riseFor(b),scale=Math.min(Math.max(1,b.w*32-inset*2)/s.rect[2],Math.max(1,b.h*32+rise-inset*2)/s.rect[3]);
  const w=s.rect[2]*scale,h=s.rect[3]*scale;
  return {atlas:s.atlas,source:s.rect,destination:[b.x-w/2,b.y+b.h*16-inset-h,w,h],rise};
 }
 function operational(b){return !!(b&&!b.dead&&b.completed===true&&!(b.health<=0));}
 function drawBuilding(c,art,b,{charge=0}={}){
  if(!operational(b))return false;const frame=measure(b);if(!frame||!c?.drawImage||!art?.images?.[frame.atlas])return false;
  c.save();
  if(b.def?.powerUse&&(!b.powered||b.siegeOffline||b.territoryOffline||b.gridOffline)&&'filter' in c)c.filter='brightness(.50) saturate(.55)';
  if(art.blit)art.blit(c,frame.atlas,frame.source,...frame.destination);else c.drawImage(art.images[frame.atlas],...frame.source,...frame.destination);
  if(b.type==='frontBattery150'){
   const capacity=b.def?.battery?.capacity,ratio=Number.isFinite(charge)&&Number.isFinite(capacity)&&capacity>0?Math.max(0,Math.min(1,charge/capacity)):0;
   const w=b.w*32;c.fillStyle='#141f19';c.fillRect(b.left+5,b.bottom+2,w-10,5);c.fillStyle='#c5b778';c.fillRect(b.left+5,b.bottom+2,(w-10)*ratio,5);
  }
  c.restore();return true;
 }
 function drawGun(c,art,b){
  if(!operational(b)||!Object.hasOwn(GUNS,b.type)||!Number.isFinite(b.x)||!Number.isFinite(b.y)||!Number.isFinite(b.turretAngle)||!c?.save)return false;
  c.save();c.translate(b.x,b.y-3);c.rotate(b.turretAngle);
  const barrels=GUNS[b.type],offsets=barrels===2?[-5,5]:[0];
  for(const y of offsets){c.fillStyle='#242c29';c.fillRect(-8,y-3,18,6);c.fillStyle='#858d7f';c.fillRect(1,y-2,26,4);c.fillStyle='#414a41';c.fillRect(15,y-3,10,6);c.fillStyle='#bac0aa';c.fillRect(3,y-1,19,1);}
  if(b.flash>0){
   if(art?.drawEffect)for(const y of offsets)art.drawEffect(c,'muzzle',31,y,18,.25,.9);
   else {c.fillStyle='#ffd06f';for(const y of offsets){c.beginPath();c.moveTo(29,y);c.lineTo(40,y-5);c.lineTo(37,y);c.lineTo(40,y+5);c.closePath();c.fill();}}
  }
  c.restore();return true;
 }
 function drawFallback(c,art,b){
  if(!operational(b)||!spriteFor(b))return false;
  if(!b.def?.sprite149||!A149?.drawSprite)return false;
  c.save();if(b.def?.powerUse&&(!b.powered||b.siegeOffline||b.territoryOffline||b.gridOffline)&&'filter' in c)c.filter='brightness(.50) saturate(.55)';
  const painted=A149.drawSprite(c,art,b.def.sprite149,b,{rise:riseFor(b)});c.restore();return painted;
 }
 function install(g){
  if(!g?.art||g.d17Art150)return g?.d17Art150||null;
  const old=g.art.drawBuilding.bind(g.art);
  g.art.drawBuilding=(c,b,...args)=>drawBuilding(c,g.art,b,{charge:b.type==='frontBattery150'?(g.powerGrid?.charge?.(b.id)||0):0})||old(c,b,...args);
  if(typeof g.art.drawTurret==='function'){const oldGun=g.art.drawTurret.bind(g.art);g.art.drawTurret=(c,b,...args)=>drawGun(c,g.art,b)||oldGun(c,b,...args);}
  g.d17Art150=Object.freeze({spriteFor,measure});return g.d17Art150;
 }
 return Object.freeze({ASSETS,SPRITES,GUNS,spriteFor,riseFor,measure,operational,drawBuilding,drawGun,drawFallback,install});
});
