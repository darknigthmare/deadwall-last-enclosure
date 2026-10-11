/* Original overhead furniture and roof variants; all physical plans remain with their owners. */
(function(root,factory){
 'use strict';const api=factory(root);root.DeadwallInteriorArt153=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const ASSETS=Object.freeze({
  interiorHome153:Object.freeze({url:'assets/art153/interior-home-atlas.png',width:1536,height:1024,matte:'none'}),
  interiorService153:Object.freeze({url:'assets/art153/interior-service-atlas.png',width:1536,height:1024,matte:'none'}),
  interiorWorkshop153:Object.freeze({url:'assets/art153/interior-workshop-atlas.png',width:1536,height:1024,matte:'none'}),
  interiorUtility153:Object.freeze({url:'assets/art153/interior-utility-atlas.png',width:1536,height:1024,matte:'none'}),
  habitatResidential153:Object.freeze({url:'assets/art153/habitat-residential-atlas.png',width:1536,height:1024,matte:'none'}),
  habitatServices153:Object.freeze({url:'assets/art153/habitat-services-atlas.png',width:1536,height:1024,matte:'none'}),
  habitatRuins153:Object.freeze({url:'assets/art153/habitat-ruins-atlas.png',width:1536,height:1024,matte:'none'}),
  habitatRoofs157:Object.freeze({url:'assets/art157/roofs-atlas.png',width:1536,height:1024,matte:'none'}),
  interiorSurfaces153:Object.freeze({url:'assets/art153/interior-surfaces.svg',width:1024,height:1024,matte:'none'}),
  interiorVending153:Object.freeze({url:'assets/art153/interior-vending.svg',width:256,height:128,matte:'none'})
 });
 const furnitureGroups=Object.freeze({
  interiorHome153:Object.freeze(['bed','sofa','table','desk','wardrobe','shelf','fridge','sink']),
  interiorService153:Object.freeze(['dentalChair','sterilizer','steelTable','dishRack','counter','oven','washer','kennel']),
  interiorWorkshop153:Object.freeze(['timberRack','sawBench','clampRack','palletStack','generator','electricalRack','workbench','machine']),
  interiorUtility153:Object.freeze(['plantTray','tirePile','hoseRack','bench','crate','medical','fuel','pump'])
 });
 const roofGroups=Object.freeze({
  habitatResidential153:Object.freeze(['cottage','farm','rowhouse','collective','hotel','retail','civic','chapel']),
  habitatServices153:Object.freeze(['school','clinic','industrial','workshop','service','greenhouse','underground','ruin'])
 });
 const RUIN_FAMILIES=Object.freeze(['ruinedHouse','ruinedShop','warehouseShell','guardBooth']);
 const FURNITURE_FAMILIES=Object.freeze([...Object.values(furnitureGroups).flat(),'vending']);
 const ROOF_FAMILIES=Object.freeze(Object.values(roofGroups).flat());
 const ROOF_ALIASES=Object.freeze({
  house:'cottage',duplex:'cottage',cabin:'cottage',basementHouse:'cottage',cottageSmall:'cottage',bungalow:'cottage',familyHouse:'cottage',villa:'cottage',duplexWide:'cottage',
  farmhouse:'farm',rowhouse:'rowhouse',apartments:'collective',studioBlock:'collective',longBlock:'collective',residence:'collective',
  hotel:'hotel',motel:'hotel',inn:'hotel',mall:'retail',hardware:'retail',grocer:'retail',market:'retail',diner:'retail',bakery:'retail',postoffice:'retail',pharmacy:'retail',cornerShop:'retail',superstore:'retail',cafe:'retail',reuse:'retail',
  townhall:'civic',library:'civic',bank:'civic',officeBlock:'civic',chapel:'chapel',school:'school',gym:'school',
  clinic:'clinic',veterinary:'clinic',dental:'clinic',medicalCentre:'clinic',warehouse:'industrial',sawmill:'industrial',selfstorage:'industrial',freight:'industrial',joinery:'industrial',logisticsHall:'industrial',
  garage:'workshop',scrapyard:'workshop',generatorRoom:'workshop',smallWorkshop:'workshop',waterStation:'workshop',fuel:'service',firestation:'service',centralKitchen:'service',laundry:'service',garden:'greenhouse',marketgarden:'greenhouse',
  bunker:'underground',mine:'underground',quarry:'underground',ruin:'ruin'
 });
 const LOCAL_ROOFS=Object.freeze({bungalow:'cottage',twoStorey:'cottage',rowHouse:'rowhouse',farmhouse:'farm',houseSmall:'cottage',houseWide:'cottage',shop:'retail',workshop:'workshop',clinic:'clinic',diner:'retail'});
 // Measured cuts replace the whole grid cells, so no adjacent silhouette can bleed into a sprite.
 const CUTS=Object.freeze({"interiorHome153":[[97,12,236,243],[452,14,225,240],[807,44,310,189],[1187,53,308,179],[71,269,289,216],[432,293,299,178],[815,267,291,217],[1203,257,278,229],[108,497,215,239],[494,503,172,224],[802,503,319,224],[1243,506,196,218],[145,754,141,243],[468,741,225,256],[824,747,272,249],[1213,742,256,255]],"interiorService153":[[56,15,292,238],[472,9,244,246],[838,37,243,201],[1232,27,224,221],[46,276,299,186],[424,277,307,185],[803,303,314,149],[1189,295,308,153],[28,515,334,182],[411,530,334,169],[829,498,261,216],[1227,492,238,227],[93,720,203,276],[458,716,235,278],[826,732,268,263],[1206,728,272,267]],"interiorWorkshop153":[[41,61,328,172],[421,73,323,161],[815,42,298,206],[1186,41,303,203],[67,275,284,191],[439,283,286,183],[835,288,260,175],[1196,277,289,190],[50,525,328,190],[461,506,245,205],[872,497,195,220],[1275,491,141,219],[47,761,324,189],[430,761,310,197],[794,758,347,199],[1277,723,163,262]],"interiorUtility153":[[47,54,295,172],[432,51,305,172],[837,22,250,221],[1213,18,266,225],[47,309,295,162],[436,300,294,173],[804,311,318,160],[1191,308,308,170],[54,535,281,196],[441,543,284,184],[879,511,166,231],[1205,550,278,170],[115,769,166,215],[474,779,216,191],[874,754,187,241],[1260,753,195,242]],"habitatResidential153":[[37,41,286,188],[362,47,315,179],[711,45,424,182],[1158,47,360,179],[26,299,362,171],[413,299,302,173],[746,274,377,213],[1150,279,359,207],[26,523,362,223],[414,533,333,202],[773,535,332,199],[1127,533,390,203],[28,766,341,218],[396,774,315,204],[747,776,359,197],[1146,748,366,225]],"habitatServices153":[[17,18,369,238],[409,40,343,204],[789,39,345,212],[1167,41,352,209],[18,279,359,224],[406,284,357,217],[791,291,342,206],[1164,295,353,202],[43,528,260,228],[341,530,414,227],[786,537,346,214],[1164,534,354,216],[34,781,333,212],[402,787,347,204],[776,766,361,229],[1158,763,365,241]],"habitatRuins153":[[26,61,380,395],[413,64,387,397],[825,85,349,355],[1197,102,312,352],[42,503,410,433],[474,507,399,425],[935,575,235,318],[1227,567,250,333]]});
 function gridSprites(groups,rowHeight=256){
  const result={};for(const [atlas,families]of Object.entries(groups))families.forEach((family,i)=>{
   result[family]=Object.freeze([0,1].map(variant=>{const cell=i*2+variant,x=(cell%4)*384,y=Math.floor(cell/4)*rowHeight;
    return Object.freeze({atlas,family,variant,rect:Object.freeze(CUTS[atlas]?.[cell]||[x+3,y+3,378,rowHeight-6])});
   }));
  });return Object.freeze(result);
 }
 const FURNITURE=Object.freeze({...gridSprites(furnitureGroups),vending:Object.freeze([
  Object.freeze({atlas:'interiorVending153',family:'vending',variant:0,rect:Object.freeze([20,6,88,116])}),
  Object.freeze({atlas:'interiorVending153',family:'vending',variant:1,rect:Object.freeze([156,9,73,113])})
 ])}),RUINS=gridSprites({habitatRuins153:RUIN_FAMILIES},512);
 // Alpha-measured cuts keep chimneys and parapets, without borrowing another cell.
 const ROOF_CUTS157=Object.freeze([
  [58,73,291,171],[431,63,298,180],[815,71,292,173],[1188,71,289,174],
  [55,300,299,180],[430,302,306,179],[805,289,313,190],[1188,303,298,175],
  [53,544,302,177],[428,534,310,187],[809,541,306,182],[1184,544,307,177],
  [53,774,303,184],[432,777,304,179],[804,777,313,183],[1203,777,266,184]
 ].map(Object.freeze));
 const ROOF_MODELS157=Object.freeze([
  'terracotta-hipped','terracotta-dormer','slate-mansard','patched-metal',
  'concrete-services','flat-water-tank','slate-three-dormers','terracotta-double-ridge',
  'corrugated-metal','industrial-sawtooth','concrete-ducts','rusted-metal',
  'terracotta-skylight','concrete-ventilation','metal-skylights','weathered-flat'
 ]);
 const ROOF_GROUPS157=Object.freeze({
  cottage:Object.freeze([0,1,2,3]),farm:Object.freeze([0,1,3,7]),
  rowhouse:Object.freeze([4,5,6,7]),collective:Object.freeze([4,5,6,7]),hotel:Object.freeze([4,5,6,7]),
  industrial:Object.freeze([8,9,10,11]),workshop:Object.freeze([8,9,10,11]),
  retail:Object.freeze([12,13,14,15]),civic:Object.freeze([12,13,14,15]),school:Object.freeze([12,13,14,15]),
  clinic:Object.freeze([12,13,14,15]),service:Object.freeze([12,13,14,15])
 });
 const ROOFS=Object.freeze(Object.fromEntries(Object.entries(gridSprites(roofGroups)).map(([family,historical])=>[
  family,Object.freeze([...historical,...(ROOF_GROUPS157[family]||[]).map((cell,i)=>Object.freeze({
   atlas:'habitatRoofs157',family,variant:historical.length+i,model:ROOF_MODELS157[cell],rect:ROOF_CUTS157[cell]
  }))])
 ])));
 const CABIN_ROOFS=Object.freeze([ROOFS.cottage[0],ROOFS.cottage[1],ROOFS.cottage[2],ROOFS.cottage[5]]);
 const selections=new WeakMap();
 function hash(...values){let h=2166136261;for(const value of values){const text=String(value??'');for(const ch of text.length+':'+text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}}h^=h>>>16;h=Math.imul(h,0x7feb352d);return(h^h>>>15)>>>0;}
 function variantFor(item,{seed=0,floor=0,variant}={},kind='furniture',count=2){
  if(!Number.isSafeInteger(count)||count<=0)return 0;
  if(Number.isSafeInteger(variant))return((variant%count)+count)%count;
  const identity=item?.id??[item?.kind||item?.type||'',item?.x??'',item?.y??''].join(':'),cacheable=item&&typeof item==='object',cached=cacheable?selections.get(item):null;
  if(cached&&cached.identity===identity&&cached.seed===seed&&cached.floor===floor&&cached.kind===kind&&cached.count===count)return cached.index;
  const index=hash(seed,identity,floor,kind)%count;
  if(cacheable)selections.set(item,{identity,seed,floor,kind,count,index});return index;
 }
 function spriteForFurniture(item,options={}){const kind=typeof item==='string'?item:item?.kind||item?.type;const sprites=Object.hasOwn(FURNITURE,kind)?FURNITURE[kind]:null;return sprites?.[variantFor(typeof item==='string'?{kind:item}:item,options,'furniture:'+kind,sprites.length)]||null;}
 const programmeRoofs=new Map();
 const CODEX_ROOFS=Object.freeze({residence:'cottage',collective:'collective',magasins:'retail',alimentation:'retail',artisanat:'workshop',hebergement:'hotel',medical:'clinic',education:'school',administration:'civic',securite:'service',logistique:'industrial',reseaux:'service',industrie:'industrial',campagne:'farm',loisirs:'civic',ruines:'ruin'});
 function programmeRoof(kind){
  if(!/^codex3000-\d{4}$/.test(kind||''))return null;
  if(programmeRoofs.has(kind))return programmeRoofs.get(kind);
  // Resolve at use time: the browser loads the furniture owner before the Codex runtime.
  const codex=root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null),preset=codex?.preset?.(kind);
  if(!preset)return null;const card=codex.get?.(preset.codex),parent=codex.parentFor?.(card),detail=codex.detailFamily?.(preset.family);
  const name=[preset.name,parent?.[0]].filter(Boolean).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let family=CODEX_ROOFS[detail]||null;
  if(detail==='ruines')family='ruin';
  else if(/\bserres?\b/.test(name))family='greenhouse';
  else if(/chapelle|eglise|paroisse|sanctuaire/.test(name))family='chapel';
  else if(/\babris?\b|bunker|souterrain|mine a galeries/.test(name))family='underground';
  else if(detail==='collective')family='collective';
  else if(/ecole|universite|college|lycee|maternelle|gymnase/.test(name))family='school';
  else if(/clinique|dispensaire|hopital|cabinet medical|maison de soins|centre medical|infirmerie/.test(name))family='clinic';
  else if(/\bhotel\b|motel|auberge/.test(name))family='hotel';
  else if(/mairie|bibliotheque|banque|administration/.test(name))family='civic';
  else if(/scierie|fonderie|manufacture|entrepot|depot de bois|depot logistique/.test(name))family='industrial';
  else if(/garage|carrosserie/.test(name)||detail!=='industrie'&&/atelier/.test(name))family='workshop';
  else if(/ferme|grange|bergerie|etable/.test(name))family='farm';
  else if(/cabane|chalet/.test(name))family='cottage';
  else if(/pompier|commissariat|poste de controle|station.service/.test(name))family='service';
  if(!family)return null;const result=Object.freeze({family,cabin:family==='cottage'&&/cabane|chalet/.test(name)});programmeRoofs.set(kind,result);return result;
 }
 function roofFamily(item){const kind=typeof item==='string'?item:item?.type||item?.kind;return Object.hasOwn(ROOF_ALIASES,kind)?ROOF_ALIASES[kind]:programmeRoof(kind)?.family||null;}
 function roofChoices(item,{local=false}={}){const kind=typeof item==='string'?item:local?item?.kind||item?.type:item?.type||item?.kind;
  const family=local?(Object.hasOwn(LOCAL_ROOFS,kind)?LOCAL_ROOFS[kind]:programmeRoof(kind)?.family||null):roofFamily(item);return family?(kind==='cabin'||programmeRoof(kind)?.cabin?CABIN_ROOFS:ROOFS[family]):null;}
 function spriteForRoof(item,options={}){const family=roofFamily(item),sprites=roofChoices(item);return sprites?.[variantFor(typeof item==='string'?{type:item}:item,{...options,floor:0},'roof:'+family,sprites.length)]||null;}
 function validRect(rect){return rect&&[rect.x,rect.y,rect.w,rect.h].every(Number.isFinite)&&rect.w>0&&rect.h>0;}
 function paint(c,art,sprite,rect,{fit=false,alpha=1}={}){
  const img=art?.images?.[sprite?.atlas];if(!img||!c?.drawImage||!validRect(rect))return false;
  const source=sprite.rect;let {x,y,w,h}=rect;
  if(fit){const scale=Math.min(w/source[2],h/source[3]),dw=source[2]*scale,dh=source[3]*scale;x+=(w-dw)/2;y+=(h-dh)/2;w=dw;h=dh;}
  c.save();c.globalAlpha*=alpha;
  const painted=art.blit?art.blit(c,sprite.atlas,source,x,y,w,h):(c.drawImage(img,...source,x,y,w,h),true);
  c.restore();return !!painted;
 }
 function drawFurniture(c,art,item,{taken=0,stateAlpha=true,alignLongAxis=false,...options}={}){
  const sprite=spriteForFurniture(item,options);if(!sprite||!c?.drawImage||!validRect(item)||!art?.images?.[sprite.atlas])return false;
  const empty=Number.isFinite(item.amount)&&Number.isFinite(taken)&&taken>=item.amount-.001;
  // Opening, finite cargo and cache overlays remain in the existing renderer; a picture never grants contents.
  const alpha=stateAlpha&&empty?.55:1,[,,sourceW,sourceH]=sprite.rect;
  const opposite=alignLongAxis&&validRect(item)&&((sourceW>sourceH*1.25&&item.h>item.w*1.25)||(sourceH>sourceW*1.25&&item.w>item.h*1.25));
  if(!opposite)return paint(c,art,sprite,item,{fit:true,alpha});
  // Local fuel stations have long shelves along either wall; their same support, not another collision, determines orientation.
  c.save();c.translate(item.x+item.w/2,item.y+item.h/2);c.rotate(Math.PI/2);
  const done=paint(c,art,sprite,{x:-item.h/2,y:-item.w/2,w:item.h,h:item.w},{fit:true,alpha});c.restore();return done;
 }
 function roofPlane(c,art,sprite,family,rect){
  if(!sprite||!art?.images?.[sprite.atlas]||!validRect(rect))return false;
  c.save();c.beginPath();c.rect(rect.x,rect.y,rect.w,rect.h);c.clip();
  c.fillStyle=family==='greenhouse'?'#687a65':'#625f53';c.fillRect(rect.x,rect.y,rect.w,rect.h);
  const done=paint(c,art,sprite,rect);c.restore();return done;
 }
 function drawRoof(c,art,item,rect={x:.2,y:.2,w:item?.w-.4,h:item?.h-.4},options={}){
  return roofPlane(c,art,spriteForRoof(item,options),roofFamily(item),rect);
 }
 function drawLocalRoof(c,art,item,rect,options={}){
  const kind=item?.kind||item?.type,type=Object.hasOwn(LOCAL_ROOFS,kind)?LOCAL_ROOFS[kind]:programmeRoof(kind)?.family||null;if(!type)return false;
  // Only the already-projected roof plane is decorated. Facades, entrances and shadows stay with the local painter.
  const sprites=roofChoices(item,{local:true});return roofPlane(c,art,sprites[variantFor(item,{...options,floor:0},'roof:'+type,sprites.length)],type,rect);
 }
 function drawSceneryRuin(c,art,item,{size=item?.def?.renderSize||item?.renderSize||100,seed=0,variant}={}){
  const kind=item?.sceneryKind||item?.kind||item?.type,sprites=Object.hasOwn(RUINS,kind)?RUINS[kind]:null;
  if(!sprites||!Number.isFinite(size)||size<=0)return false;
  const sprite=sprites[variantFor(item,{seed,variant},'ruin:'+kind,sprites.length)];
  return paint(c,art,sprite,{x:item.x-size/2,y:item.y-size/2,w:size,h:size},{fit:true});
 }
 const FLOOR_FAMILIES=Object.freeze(['wood','tile','concrete','rubber']);
 function floorFamily(item,floor=0){
  if(floor<0)return'concrete';const family=roofFamily(item);
  if(['clinic','retail','service','greenhouse'].includes(family))return'tile';
  if(['industrial','workshop','underground','ruin'].includes(family))return'concrete';
  if(item?.type==='gym')return'rubber';return family?'wood':null;
 }
 const patterns=new WeakMap();
 function materialPattern(c,art,family,variant){
  const image=art?.images?.interiorSurfaces153;if(!image||!c?.createPattern)return null;
  let cache=patterns.get(c);if(!cache){cache=new Map();patterns.set(c,cache);}
  const key=family+':'+variant,cached=cache.get(key);if(cached?.image===image)return cached.pattern;
  const tile=root.document?.createElement?.('canvas')||(typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(256,256):null);
  if(!tile)return null;tile.width=tile.height=256;const cc=tile.getContext('2d');if(!cc)return null;
  const row=FLOOR_FAMILIES.indexOf(family);cc.drawImage(image,variant*256,row*256,256,256,0,0,256,256);
  const pattern=c.createPattern(tile,'repeat');if(pattern)cache.set(key,{image,pattern});return pattern;
 }
 function drawFloor(c,art,item,rect={x:.24,y:.24,w:item?.w-.48,h:item?.h-.48},{seed=0,floor=0,tile=3}={}){
  if(!validRect(rect)||!Number.isFinite(tile)||tile<=0)return false;const family=floorFamily(item,floor);if(!family)return false;
  const variant=variantFor(item,{seed,floor},'floor',4),pattern=materialPattern(c,art,family,variant);if(!pattern)return false;
  // The tile scale is fixed in the owner's local metres, independent of camera and zoom.
  const scale=tile/256;c.save();c.beginPath();c.rect(rect.x,rect.y,rect.w,rect.h);c.clip();c.scale(scale,scale);c.fillStyle=pattern;c.fillRect(rect.x/scale,rect.y/scale,rect.w/scale,rect.h/scale);c.restore();return true;
 }
 return Object.freeze({ASSETS,FURNITURE,ROOFS,RUINS,ROOF_CUTS157,ROOF_MODELS157,ROOF_GROUPS157,FURNITURE_FAMILIES,ROOF_FAMILIES,RUIN_FAMILIES,ROOF_ALIASES,LOCAL_ROOFS,FLOOR_FAMILIES,hash,variantFor,spriteForFurniture,roofFamily,roofChoices,spriteForRoof,floorFamily,validRect,paint,drawFurniture,drawRoof,drawLocalRoof,drawSceneryRuin,drawFloor});
});
