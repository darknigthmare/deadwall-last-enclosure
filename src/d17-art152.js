/* Original utility silhouettes; historical controllers retain every paid support. */
(function(root,factory){
 'use strict';const api=factory();root.DeadwallD17Art152=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ASSETS=Object.freeze({
  d17Services152:Object.freeze({url:'assets/art152/services-atlas.png',width:1536,height:1024,matte:'none'}),
  d17Logistics152:Object.freeze({url:'assets/art152/logistics-atlas.png',width:1536,height:1024,matte:'none'}),
  d17Energy152:Object.freeze({url:'assets/art152/energy-atlas.png',width:1536,height:1024,matte:'none'}),
  d17Lighting152:Object.freeze({url:'assets/art152/lighting-atlas.png',width:1536,height:1024,matte:'none'})
 });
 // Empty alpha gutters delimit complete silhouettes, including aerials and feet.
 const groups={
  d17Services152:{fieldKitchen:[32,127,351,327],dressingWorkshop:[420,107,351,347],recoveryBench:[791,134,347,321],fireStation:[1160,96,352,361],receptionHall:[33,565,578,362],restShelter:[641,577,353,351],planningOffice:[1026,626,465,301]},
  d17Logistics152:{sectorPost:[36,79,291,384],logisticsGarage:[339,120,412,343],fallbackRedoubt:[767,126,323,340],prefabYard:[1109,118,401,346],roadDepot:[41,559,348,353],expeditionOffice:[430,528,435,386],expeditionGarage:[899,560,388,354]},
  d17Energy152:{fireCistern:[35,171,247,312],dayGreenhouse:[330,143,440,348],solarCourt:[800,153,452,330],radioRelay:[1279,18,232,473],batteryCabinet:[31,705,254,225],batteryStation:[322,613,492,328],batteryComplex:[844,559,666,385]},
  d17Lighting152:{beacon:[92,207,163,260],streetlight:[382,49,196,418],searchlight:[724,152,371,316],perimeterLight:[1244,114,226,354],districtSearchlight:[54,571,490,387],alarmTower:[622,478,444,480],fireScreen:[1147,680,332,279]}
 };
 const SPRITES=Object.freeze(Object.fromEntries(Object.entries(groups).flatMap(([atlas,sprites])=>Object.entries(sprites).map(([id,rect])=>[id,Object.freeze({atlas,rect:Object.freeze(rect)})]))));
 const RISE=Object.freeze({sectorPost:28,radioRelay:48,alarmTower:48,beacon:18,streetlight:36,searchlight:18,perimeterLight:28,districtSearchlight:18});
 const LIGHTS=Object.freeze(['beacon','streetlight','searchlight','perimeterLight','districtSearchlight']);
 function spriteFor(value){const id=typeof value==='string'?value:value?.type||value?.id;return Object.hasOwn(SPRITES,id)?SPRITES[id]:null;}
 function riseFor(b){return RISE[b?.type]??18;}
 function measure(b){
  const sprite=spriteFor(b);if(!sprite||![b.x,b.y,b.w,b.h].every(Number.isFinite)||b.w<=0||b.h<=0)return null;
  const inset=3,rise=riseFor(b),scale=Math.min(Math.max(1,b.w*32-inset*2)/sprite.rect[2],Math.max(1,b.h*32+rise-inset*2)/sprite.rect[3]);
  const w=sprite.rect[2]*scale,h=sprite.rect[3]*scale;
  return{atlas:sprite.atlas,source:sprite.rect,destination:[b.x-w/2,b.y+b.h*16-inset-h,w,h],rise};
 }
 function operational(b){return !!(b&&!b.dead&&b.completed===true&&!(b.health<=0));}
 function offline(b){return !!(!b.powered||b.siegeOffline||b.territoryOffline||b.gridOffline||b.dayOffline);}
 function drawCharge(c,b,charge){
  const capacity=b.def?.battery?.capacity;if(!(capacity>0))return;
  const ratio=Number.isFinite(charge)?Math.max(0,Math.min(1,charge/capacity)):0,w=b.w*32;
  c.fillStyle='#141f19';c.fillRect(b.left+5,b.bottom+2,w-10,5);
  c.fillStyle='#c5b778';c.fillRect(b.left+5,b.bottom+2,(w-10)*ratio,5);
 }
 function drawLightState(c,b){
  if(!LIGHTS.includes(b.type))return;
  const active=!offline(b);c.fillStyle=active?'#dfcd94':'#555f53';c.fillRect(b.x-3,b.bottom-6,6,2);
  if(!b.def?.beamHalfAngle)return;
  // The physical light service owns its cone. This small rotating head marker
  // retains the selected heading even in daylight, when the cone is invisible.
  c.save();c.translate(b.x,b.y-17);c.rotate((b.rotation||0)*Math.PI/2);
  c.fillStyle=active?'#dfcd94':'#68746b';c.beginPath();c.moveTo(7,-3);c.lineTo(13,0);c.lineTo(7,3);c.closePath();c.fill();c.restore();
 }
 function drawTerritoryState(c,b,sectorState,frame){
  if(b.type==='sectorPost'){
   c.fillStyle=['held','contested'].includes(sectorState)?'#a6bb92':'#bc9a7b';c.fillRect(b.x-24,b.y+13,45,7);
  }else if(b.type==='fallbackRedoubt'){
   const angle=Number.isFinite(b.turretAngle)?b.turretAngle:0,m=frame||measure(b);if(!m)return;
   // The measured roof pivot is 163,94 inside this 323x340 source cut.
   const x=m.destination[0]+m.destination[2]*163/323,y=m.destination[1]+m.destination[3]*94/340;
   c.strokeStyle='#363e37';c.lineWidth=5;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(angle)*35,y+Math.sin(angle)*35);c.stroke();
  }
 }
 function drawWater(c,b,waterRatio){
  if(b.type!=='fireCistern')return;
  const ratio=Number.isFinite(waterRatio)?Math.max(0,Math.min(1,waterRatio)):0;
  c.fillStyle='#799fb0';c.fillRect(b.x+22,b.y-22,10,44);
  c.fillStyle='#c5e2d9';c.fillRect(b.x+23,b.y+21-ratio*42,8,ratio*42);
 }
 function drawBuilding(c,art,b,{charge=0,sectorState=null,waterRatio=0}={}){
  if(!operational(b))return false;const frame=measure(b);
  if(!frame||!c?.drawImage||!art?.images?.[frame.atlas])return false;
  c.save();
  if(b.def?.powerUse&&offline(b)&&'filter' in c)c.filter='brightness(.50) saturate(.55)';
  const painted=art.blit?art.blit(c,frame.atlas,frame.source,...frame.destination):(c.drawImage(art.images[frame.atlas],...frame.source,...frame.destination),true);
  c.restore();if(!painted)return false;
  c.save();drawCharge(c,b,charge);drawLightState(c,b);drawTerritoryState(c,b,sectorState,frame);drawWater(c,b,waterRatio);c.restore();return true;
 }
 function install(g){
  if(!g?.art||g.d17Art152)return g?.d17Art152||null;
  const previous=g.art.drawBuilding.bind(g.art);
  g.art.drawBuilding=(c,b,...args)=>{
   // Charge is read once from its owner; no snapshot, inventory or RNG during paint.
   const sprite=spriteFor(b),ready=sprite&&operational(b)&&g.art.images?.[sprite.atlas];
   const charge=ready&&b.def?.battery?g.powerGrid?.charge?.(b.id)||0:0;
   const sectorState=ready&&b.type==='sectorPost'?g.territories?.presentationStatus?.(b)||null:null;
   const waterRatio=ready&&b.type==='fireCistern'?g.siege?.presentationWaterRatio?.(b)||0:0;
   return drawBuilding(c,g.art,b,{charge,sectorState,waterRatio})||previous(c,b,...args);
  };
  g.d17Art152=Object.freeze({spriteFor,measure});return g.d17Art152;
 }
 return Object.freeze({ASSETS,SPRITES,LIGHTS,spriteFor,riseFor,measure,operational,drawCharge,drawLightState,drawTerritoryState,drawWater,drawBuilding,install});
});
