(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DeadwallArt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  'use strict';
  const Artwork136=root.DeadwallAssets136||(typeof require==='function'?require('./assets136.js'):null);
  const D17Art149=root.DeadwallD17Art149||(typeof require==='function'?require('./d17-art149.js'):null);
  const D17Art150=root.DeadwallD17Art150||(typeof require==='function'?require('./d17-art150.js'):null);
  const D17Art152=root.DeadwallD17Art152||(typeof require==='function'?require('./d17-art152.js'):null);
  const BuildingVariants157=root.DeadwallBuildingVariants157||(typeof require==='function'?require('./building-variants157.js'):null);
  const D17ExtendedVariants157=root.DeadwallD17ExtendedVariants157||(typeof require==='function'?require('./d17-extended-variants157.js'):null);
  const VehicleArt152=root.DeadwallVehicleArt152||(typeof require==='function'?require('./vehicle-art152.js'):null);
  const NatureArt153=root.DeadwallNatureArt153||(typeof require==='function'?require('./nature-art153.js'):null);
  const WorldPropsArt153=root.DeadwallWorldPropsArt153||(typeof require==='function'?require('./world-props-art153.js'):null);
  const InteriorArt153=root.DeadwallInteriorArt153||(typeof require==='function'?require('./interior-art153.js'):null);
  const RenderCache153=root.DeadwallRenderCache153||(typeof require==='function'?require('./render-cache153.js'):null);
  const WorldVariants158=root.DeadwallWorldVariants158||(typeof require==='function'?require('./world-variants158.js'):null);
  const StructureArt159=root.DeadwallStructureArt159||(typeof require==='function'?require('./structure-art159.js'):null);
  const TrapArt159=root.DeadwallTrapArt159||(typeof require==='function'?require('./trap-art159.js'):null);
  const EquipmentArt159=root.DeadwallEquipmentArt159||(typeof require==='function'?require('./equipment-art159.js'):null);
  const ActorActions159=root.DeadwallActorActions159||(typeof require==='function'?require('./actor-actions159.js'):null);
  const PostArt159=root.DeadwallPostArt159||(typeof require==='function'?require('./post-art159.js'):null);
  const ExpeditionSprites159=root.DeadwallExpeditionSprites159||(typeof require==='function'?require('./expedition-sprites159.js'):null);
  const ContextArt160=root.DeadwallContextArt160||(typeof require==='function'?require('./context-art160.js'):null);
  const localEcology164=new WeakMap();
  function nodeEcology(game,pose){
    if(pose?.ecologyVersion!==1){localEcology164.delete(game);return root.DeadwallBiomes135;}
    let saved=localEcology164.get(game);
    if(!saved||saved.world!==game.world||saved.seed!==game.world.seed||saved.generation!==pose.generation||saved.ecologyVersion!==pose.ecologyVersion||saved.hydrologyVersion!==(pose.hydrologyVersion||0)||saved.landscape189!==(pose.landscape189||'classic')||saved.frontier!==game.frontier){
      const regional=game.frontier?.world?.();
      saved={world:game.world,seed:game.world.seed,generation:pose.generation,ecologyVersion:pose.ecologyVersion,hydrologyVersion:pose.hydrologyVersion||0,landscape189:pose.landscape189||'classic',frontier:game.frontier,regional};localEcology164.set(game,saved);
    }
    return saved.regional?.ecologyVersion===1?saved.regional.biomes:null;
  }
  // Original OpenAI atlases. Matte decoding is performed once at upload, never per frame.
  const ASSETS = Object.freeze({
    ...(ContextArt160?.ASSETS||{}),
    ...(Artwork136?.ASSETS||{}),
    ...(Artwork136?.ASSETS138||{}),
    ...(Artwork136?.ASSETS139||{}),
    ...(Artwork136?.ASSETS140||{}),
    ...(Artwork136?.ASSETS141||{}),
    ...(D17Art149?.ASSETS||{}),
    ...(D17Art150?.ASSETS||{}),
    ...(D17Art152?.ASSETS||{}),
    ...(BuildingVariants157?.ASSETS||{}),
    ...(D17ExtendedVariants157?.ASSETS||{}),
    ...(VehicleArt152?.ASSETS||{}),
    ...(NatureArt153?.ASSETS||{}),
    ...(WorldPropsArt153?.ASSETS||{}),
    ...(InteriorArt153?.ASSETS||{}),
    ...(WorldVariants158?.ASSETS||{}),
    ...(TrapArt159?.ASSETS||{}),
    ...(StructureArt159?.ASSETS||{}),
    ...(EquipmentArt159?.ASSETS||{}),
    ...(ActorActions159?.ASSETS||{}),
    ...(PostArt159?.ASSETS||{}),
    ...(ExpeditionSprites159?.ASSETS||{}),
    buildings: { url: 'assets/buildings-atlas.webp', width: 1254, height: 1254, matte: 'neutral' },
    props: { url: 'assets/props-atlas.webp', width: 1254, height: 1254, matte: 'magenta' },
    survivors: { url: 'assets/survivors-atlas.webp', width: 1774, height: 887, matte: 'magenta' },
    commander: { url: 'assets/commander-actions-atlas.png', width: 1024, height: 1536, matte: 'none' },
    commanderPistol: { url: 'assets/commander-pistol-atlas.png', width: 1024, height: 1536, matte: 'none' },
    commanderRig: { url: 'assets/commander-rig130.png', width: 1774, height: 887, matte: 'none' },
    heroCrouch137: { url: 'assets/art137/survivor-crouch.png', width: 1469, height: 1071, matte: 'none' },
    heroProne137: { url: 'assets/art137/survivor-prone.png', width: 1774, height: 887, matte: 'none' },
    heroHarvest133: { url: 'assets/hero-harvest133.png', width: 1536, height: 1024, matte: 'none' },
    heroActions133: { url: 'assets/hero-actions133.png', width: 1536, height: 1024, matte: 'none' },
    operations: { url: 'assets/operations-atlas.png', width: 1536, height: 1024, matte: 'none' },
    infected: { url: 'assets/infected-atlas.webp', width: 1774, height: 887, matte: 'magenta' },
    effects: { url: 'assets/vfx-atlas.webp', width: 1254, height: 1254, matte: 'additive' },
    defenses: { url: 'assets/defenses-atlas.webp', width: 1254, height: 1254, matte: 'magenta' },
    ground: { url: 'assets/terrain-earth.webp', width: 1254, height: 1254, matte: 'none' },
    infectedExpansion: { url: 'assets/infected-expansion-atlas.webp', width: 1774, height: 887, matte: 'magenta' },
    specialists: { url: 'assets/specialists-atlas.webp', width: 1774, height: 887, matte: 'magenta' },
    districtProps: { url: 'assets/district-props-atlas.webp', width: 1254, height: 1254, matte: 'magenta' }
  });
  const BUILDINGS = Object.freeze({
    core: [0, 0, 335, 365], house: [350, 0, 255, 365], warehouse: [640, 0, 275, 365],
    barracks: [950, 0, 304, 365], clinic: [0, 385, 315, 300], farm: [335, 385, 280, 300],
    generator: [640, 385, 280, 300], lumber: [930, 385, 324, 300],
    scrapyard: [0, 695, 315, 265], quarry: [335, 695, 280, 265],
    refinery: [635, 695, 285, 265], workshop: [925, 695, 329, 265],
    ammoFactory: [0, 970, 335, 284], watchtower: [345, 970, 265, 284],
    turret: [630, 970, 290, 284], heavyTurret: [930, 970, 324, 284]
  });
  const PROPS = Object.freeze({
    tree: [0, 0, 313, 313], pine: [313, 0, 314, 313], logs: [627, 0, 313, 313], rocks: [940, 0, 314, 313],
    scrap: [0, 313, 313, 314], crops: [313, 313, 314, 314], fuel: [627, 313, 313, 314], supplies: [940, 313, 314, 314],
    sedan: [0, 627, 313, 373], pickup: [313, 627, 314, 373], van: [627, 627, 313, 373], truck: [940, 627, 314, 373],
    woodWall: [0, 1000, 313, 254], steelWall: [313, 1000, 314, 254],
    concreteWall: [627, 1000, 313, 254], gate: [940, 1000, 314, 254]
  });
  const ACTORS = Object.freeze({
    player: ['survivors', 0], worker: ['survivors', 1], soldier: ['survivors', 2], walker: ['survivors', 3],
    runner: ['infected', 0], armored: ['infected', 1], crawler: ['infected', 2], howler: ['infected', 3],
    breacher: ['infectedExpansion', 0], stalker: ['infectedExpansion', 1], bloated: ['infectedExpansion', 2], walkerAlt: ['infectedExpansion', 3],
    shielded: ['infected', 1], charger: ['infected', 0],
    medic: ['specialists', 0], engineer: ['specialists', 1], workerAlt: ['specialists', 2], soldierAlt: ['specialists', 3]
  });
  const DISTRICT_PROPS = Object.freeze({...Object.fromEntries([
    'ruinedHouse','ruinedShop','warehouseShell','guardBooth','ambulance','bus','utilityTruck','tanker',
    'tent','container','waterTank','powerPylon','concreteBarricade','burntTree','rubble','streetLamp'
  ].map((kind,i)=>[kind,frameRect('districtProps',Math.floor(i/4),i%4,4)])),
    // Observed silhouettes cross the nominal grid. Keep the complete hangar,
    // exclude its neighbour from the booth, and exclude rubble from the tree.
    warehouseShell:[620,0,356,314],guardBooth:[976,0,278,314],burntTree:[326,920,268,334],rubble:[596,940,344,314]
  });
  // Appearance is derived from identity, so reloads never reroll a survivor or infected.
  function actorVariant(kind,id) {
    return ['worker','soldier','walker'].includes(kind)&&Math.abs(id||0)%3===1?kind+'Alt':kind;
  }
  // These two native rows cross their nominal cells. Measured cuts retain the
  // crawler's fingers and the rifle muzzle without borrowing a neighbour.
  // The nominal cell remains the pivot and scale reference; PNGs are unchanged.
  const ACTOR_FRAME_CUTS154 = Object.freeze({
    'infected:2':Object.freeze([[28,506,203,83],[253,510,190,81],[469,509,198,89],[690,512,201,80],
      [913,509,187,80],[1127,508,180,90],[1341,510,199,77],[1553,510,196,84]].map(Object.freeze)),
    'specialists:3':Object.freeze([[65,673,142,175],[283,673,158,175],[499,673,156,172],[736,672,150,167],
      [954,671,144,172],[1184,672,163,170],[1405,672,166,169],[1624,672,142,174]].map(Object.freeze))
  });
  function actorFrameRect(atlas,row,frame) {
    return ACTOR_FRAME_CUTS154[atlas+':'+row]?.[frame%8]||frameRect(atlas,row,frame);
  }
  const DEFENSES = Object.freeze({
    spikes: [0,0,610,627], armoredGate: [610,0,644,627],
    turret: [0,627,627,627], heavyTurret: [627,627,627,627]
  });
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  // Actual measured transparent gutters, rather than a nominal grid which would
  // clip the prone weapon and the raised crowbar. Source images remain unchanged.
  const HERO_STATES = Object.freeze(['idle','walk','sprint','crouch','prone','shoot','reload','work']);
  const HERO_FRAMES = Object.freeze({
    commander: [[[0,52,267,144],[267,52,253,144],[520,52,250,144],[770,52,254,144]],[[0,221,277,152],[277,221,249,152],[526,221,257,152],[783,221,241,152]],[[0,409,277,157],[277,409,257,157],[534,409,246,157],[780,409,244,157]],[[0,607,274,141],[274,607,250,141],[524,607,253,141],[777,607,247,141]],[[0,788,278,113],[278,788,248,113],[526,788,246,113],[772,788,252,113]],[[0,931,274,167],[274,931,271,167],[545,931,230,167],[775,931,249,167]],[[0,1118,258,172],[258,1118,263,172],[521,1118,255,172],[776,1118,248,172]],[[0,1292,277,209],[277,1292,235,209],[512,1292,296,209],[808,1292,216,209]]],
    commanderPistol: [[[0,44,261,154],[261,44,253,154],[514,44,255,154],[769,44,255,154]],[[0,216,271,162],[271,216,251,162],[522,216,255,162],[777,216,247,162]],[[0,410,273,160],[273,410,256,160],[529,410,246,160],[775,410,249,160]],[[0,607,268,145],[268,607,253,145],[521,607,253,145],[774,607,250,145]],[[0,786,268,119],[268,786,252,119],[520,786,246,119],[766,786,258,119]],[[0,929,266,171],[266,929,282,171],[548,929,220,171],[768,929,256,171]],[[0,1116,264,176],[264,1116,255,176],[519,1116,256,176],[775,1116,249,176]],[[0,1294,279,218],[279,1294,234,218],[513,1294,288,218],[801,1294,223,218]]]
  });
  const HERO_PIVOT_Y = Object.freeze([120,296,486,675,845,1010,1200,1405]);
  function heroPose(entity, time, reducedMotion, inferredMoving=false) {
    const moving = typeof entity.visualMoving === 'boolean' ? entity.visualMoving : inferredMoving;
    const posture = entity.visualPosture || 'stand';
    const recoil = typeof entity.visualRecoil === 'boolean' ? entity.visualRecoil : entity.shootCooldown > 0;
    let state = entity.dead ? 'prone' : posture === 'prone' ? 'prone' : posture === 'crouch' ? 'crouch' :
      entity.reload > 0 ? 'reload' : entity.meleeCooldown > 0 || entity.visualAction === 'work' ? 'work' :
      recoil ? 'shoot' : moving ? entity.sprinting ? 'sprint' : 'walk' : 'idle';
    let frame = Math.floor(Math.max(0,time) * ({idle:2,walk:8,sprint:12,crouch:6,prone:5,shoot:15,reload:4,work:8}[state])) % 4;
    if(state==='reload')frame=clamp(Math.floor((1-entity.reload/Math.max(entity.reload,entity.reloadTotal||entity.reload))*4),0,3);
    if(state==='work'&&entity.meleeCooldown>0)frame=clamp(Math.floor((1-entity.meleeCooldown/.65)*4),0,3);
    if((state==='crouch'||state==='prone')&&!moving||entity.dead||reducedMotion)frame=0;
    return {state,row:HERO_STATES.indexOf(state),frame};
  }
  // Orthographic pieces share a pelvis anchor in the ground plane. Both source
  // rows face right: no artificial leg rotation or perspective correction.
  const HERO_RIG = Object.freeze({
    scale:.105,idleLower:1,
    upper:[
      {rect:[24,130,470,276],pivot:[185,268]},
      {rect:[500,130,400,276],pivot:[661,268]},
      {rect:[918,130,461,276],pivot:[1080,268]},
      {rect:[1390,130,368,276],pivot:[1550,268]}
    ],
    lower:[
      {rect:[99,516,293,248],pivot:[158,645]},
      {rect:[550,530,231,230],pivot:[606,645]},
      {rect:[970,530,274,230],pivot:[1032,645]},
      {rect:[1410,530,236,230],pivot:[1472,645]}
    ]
  });
  function canArticulate(entity){
    const reloading=entity.reload>0&&!entity.visualUnarmed&&(!entity.visualEquipmentCategory||entity.visualEquipmentCategory==='firearm');
    return Boolean((entity.visualArticulated||reloading)&&!entity.dead&&(!entity.visualPosture||entity.visualPosture==='stand')&&
      !(entity.meleeCooldown>0)&&entity.visualAction!=='work'&&
      Number.isFinite(entity.visualLowerFacing)&&Number.isFinite(entity.visualUpperFacing));
  }
  // Native PNGs are unchanged. Head/hand anchors are measured in their source
  // images; constant uniform scale preserves their anatomy in both domains.
  const HERO_LOW137=Object.freeze({
    crouch:Object.freeze({atlas:'heroCrouch137',rect:[327,166,886,778],pivot:[732,530],scale:.040}),
    prone:Object.freeze({atlas:'heroProne137',rect:[47,248,1677,472],pivot:[1320,480],scale:.040})
  });
  function reloadPose137(entity){
    if(!(entity.reload>0))return null;
    const phase=clamp(1-entity.reload/Math.max(entity.reload,entity.reloadTotal||entity.reload),0,1);
    return{phase,reach:Math.sin(phase*Math.PI),insert:phase<.5?phase*2:(1-phase)*2};
  }
  function heroRigPose(entity,reducedMotion=false){
    const phase=Number.isFinite(entity.visualStride)?entity.visualStride:0;
    return {upper:(entity.weapon==='pistol'?1:0)+(entity.visualRecoil?2:0),
      lower:reducedMotion||!entity.visualMoving&&!entity.visualPivoting?HERO_RIG.idleLower:Math.floor(((phase/(Math.PI*2))%1+1)%1*4)};
  }
  // Measured head/pelvis anchors. Source gutters are not regular: several tool
  // swings cross nominal cells. Cache isolated alpha components once at load.
  const HERO_ACTION_PIVOTS133 = Object.freeze({
    heroHarvest133:[
      [[90,158],[307,149],[508,158],[676,161],[871,159],[1066,173],[1263,157],[1450,156]],
      [[90,414],[302,405],[509,413],[677,416],[860,413],[1065,426],[1260,414],[1450,413]],
      [[92,668],[302,661],[507,671],[675,668],[868,671],[1063,676],[1264,669],[1454,667]],
      [[96,892],[296,891],[507,891],[681,890],[874,892],[1074,888],[1278,890],[1453,891]]
    ],
    heroActions133:[
      [[97,146],[284,145],[495,141],[673,146],[856,153],[1055,157],[1250,160],[1440,147]],
      [[87,369],[278,375],[489,376],[675,385],[857,380],[1053,374],[1241,372],[1431,374]],
      [[110,621],[290,620],[480,619],[676,620],[867,620],[1049,620],[1239,620],[1431,619]],
      [[99,846],[282,848],[482,850],[674,846],[868,846],[1049,851],[1240,851],[1436,846]]
    ]
  });
  const HERO_ACTIONS133 = Object.freeze({
    chop:{atlas:'heroHarvest133',row:0,seconds:.96},pick:{atlas:'heroHarvest133',row:1,seconds:1.04},
    pry:{atlas:'heroHarvest133',row:2,seconds:.88},handle:{atlas:'heroHarvest133',row:3,seconds:.72},
    build:{atlas:'heroActions133',row:0,seconds:.88},dig:{atlas:'heroActions133',row:1,seconds:1.04},
    dressing:{atlas:'heroActions133',row:2,seconds:1.2},open:{atlas:'heroActions133',row:3,seconds:.96}
  });
  function heroActionPose133(entity,reducedMotion=false){
    const a=entity.visualAction133,spec=a&&HERO_ACTIONS133[a.kind];
    if(!spec||entity.dead||entity.visualMoving||entity.reload>0||entity.meleeCooldown>0||entity.visualPosture&&entity.visualPosture!=='stand')return null;
    const elapsed=Math.max(0,Number.isFinite(a.elapsed)?a.elapsed:0),phase=a.oneShot?Math.min(.999999,elapsed/spec.seconds):elapsed/spec.seconds%1;
    return{...spec,frame:reducedMotion?0:Math.floor(phase*8),facing:Number.isFinite(a.facing)?a.facing:entity.facing||0};
  }
  function isolateHeroFrames133(pixels,width,height,pivots){
    if(pixels.length!==width*height*4)throw Error('Pixels de planche incomplets.');
    const seeds=pivots.flat(),labels=new Int16Array(width*height);labels.fill(-1);
    const queue=new Int32Array(width*height);let head=0,tail=0;
    for(let i=0;i<seeds.length;i++){const [x,y]=seeds[i],at=y*width+x;if(pixels[at*4+3]<48)throw Error('Pivot hors silhouette.');labels[at]=i;queue[tail++]=at;}
    if(pivots===HERO_ACTION_PIVOTS133.heroActions133){for(const [id,x,y]of [[3,761,151],[4,791,150]]){const at=y*width+x;if(pixels[at*4+3]>=48){labels[at]=id;queue[tail++]=at;}}}
    const visit=(at,id)=>{if(labels[at]<0&&pixels[at*4+3]>=48){labels[at]=id;queue[tail++]=at;}};
    while(head<tail){const at=queue[head++],x=at%width,id=labels[at];if(x)visit(at-1,id);if(x+1<width)visit(at+1,id);if(at>=width)visit(at-width,id);if(at+width<labels.length)visit(at+width,id);}
    // Restore antialiased edge pixels without admitting another silhouette or
    // the unused RGB hidden beneath transparent areas of the generated PNG.
    const bounds=seeds.map(()=>[width,height,-1,-1]);
    for(let at=0;at<labels.length;at++){
      if(!pixels[at*4+3])continue;let id=labels[at];const x=at%width,y=Math.floor(at/width);
      if(id<0)outer:for(let radius=1;radius<=2;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
        const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;const near=yy*width+xx;
        if(pixels[near*4+3]>=48&&labels[near]>=0){id=labels[near];break outer;}
      }
      if(id<0)continue;labels[at]=id;const b=bounds[id];b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);
    }
    return seeds.map((pivot,id)=>{
      const [x,y,right,bottom]=bounds[id],w=right-x+1,h=bottom-y+1,data=new Uint8ClampedArray(w*h*4);
      for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const at=(y+yy)*width+x+xx;if(labels[at]===id){const src=at*4,dst=(yy*w+xx)*4;data[dst]=pixels[src];data[dst+1]=pixels[src+1];data[dst+2]=pixels[src+2];data[dst+3]=pixels[src+3];}}
      return{rect:[x,y,w,h],pivot:[pivot[0]-x,pivot[1]-y],data};
    });
  }
  function frameRect(atlas, row, frame, columns = 8, rows = 4) {
    const a = ASSETS[atlas], x = Math.round((frame % columns) * a.width / columns), y = Math.round(row * a.height / rows);
    return [x, y, Math.round(((frame % columns) + 1) * a.width / columns) - x, Math.round((row + 1) * a.height / rows) - y];
  }
  function decodeMatte(pixels, width, height, mode) {
    if (mode === 'magenta') {
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], excess = Math.min(r, b) - g;
        if (excess > 18 && Math.min(r, b) > g * 1.35 + 8) pixels[i + 3] = 0;
        else if (excess > 35 && r > 90 && b > 90) {
          pixels[i + 3] = Math.round(pixels[i + 3] * (1 - clamp((excess - 35) / 65, 0, 1)));
          // Remove the chroma fringe from anti-aliased silhouette edges.
          pixels[i] = Math.min(r, g + 25); pixels[i + 2] = Math.min(b, g + 25);
        }
      }
    } else if (mode === 'neutral') {
      // Only border-connected pale matte is removed. Roof markings stay opaque.
      const seen = new Uint8Array(width * height), queue = new Int32Array(width * height);
      let head = 0, tail = 0;
      function visit(index) {
        if (index < 0 || index >= seen.length || seen[index]) return;
        seen[index] = 1; const i = index * 4;
        const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]), max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (min >= 154 && max - min < 22) {
          queue[tail++] = index;
          pixels[i + 3] = Math.round(pixels[i + 3] * clamp((194 - min) / 40, 0, 1));
        }
      }
      for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
      for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
      while (head < tail) {
        const p = queue[head++], x = p % width;
        if (x) visit(p - 1); if (x < width - 1) visit(p + 1);
        visit(p - width); visit(p + width);
      }
    }
    return pixels;
  }
  function tightRect(pixels, width, rect) {
    const [left, top, w, h] = rect;
    let minX = left + w, minY = top + h, maxX = left, maxY = top;
    for (let y = top; y < top + h; y++) for (let x = left; x < left + w; x++) {
      if (pixels[(y * width + x) * 4 + 3] < 80) continue;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    return minX > maxX ? rect : [minX, minY, maxX - minX + 1, maxY - minY + 1];
  }
  const metricVehicles202=new Set(['sedan','pickup','van','truck','ambulance','bus','utilityTruck','tanker']);
  const metricRuins202=new Set(['ruinedHouse','ruinedShop','warehouseShell']);
  const metricProps202=new Set(['container','tent','guardBooth','waterTank','powerPylon','concreteBarricade','streetLamp','rubble']);
  function metricSceneryFrame202(node,{seed=0,rect=null}={}) {
    if(node?.metric202!==1||!node.body202||![node.x,node.y,node.body202.w,node.body202.h].every(Number.isFinite)||node.body202.w<=0||node.body202.h<=0)return null;
    const variant=Math.abs(node.variant||0)%4,kind=node.sceneryKind||(node.type==='scrap'?['scrap','sedan','van','truck'][variant]:node.type==='fuel'&&variant%2?'pickup':null);
    if(!metricVehicles202.has(kind)&&!metricRuins202.has(kind)&&!metricProps202.has(kind))return null;
    const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),p=C?.CityGeometry202?.presentation,u=C?.TILE;
    if(!p||!Number.isFinite(u)||u<=0)return null;
    const w=node.body202.w,h=node.body202.h,body={l:node.x-w/2,t:node.y-h/2,r:node.x+w/2,b:node.y+h/2};
    if(rect&&(!['l','t','r','b'].every(k=>Number.isFinite(rect[k]))||Object.keys(body).some(k=>Math.abs(body[k]-rect[k])>1e-6)))return null;
    const identity=node.id??[kind,node.x,node.y].join(':'),style=InteriorArt153.hash(seed,identity,kind)%4,storey=p.storeyHeightMetres*p.projectedHeightUnitsPerMetre;
    const rise=metricRuins202.has(kind)||kind==='guardBooth'?storey:kind==='powerPylon'?storey*2:kind==='streetLamp'?storey*1.5:kind==='concreteBarricade'?storey/3:0;
    return{kind,body,w,h,units:u,rise,identity,style,wall:p.wallThicknessMetres*u,doorWidth:p.doorWidthMetres*u,doorHeight:p.doorHeightMetres*p.projectedHeightUnitsPerMetre,bounds:{x:body.l,y:body.t-rise,w,h:h+rise}};
  }
  // Source cuts isolate paintings only. The node's body202 remains the sole
  // physical footprint; no alpha measurement participates in placement or size.
  const METRIC_PLAN_SKINS202=Object.freeze(Object.fromEntries(Object.entries({
    sedan:{atlas:'props',source:[91,654,136,284],turn:Math.PI/2},
    pickup:{atlas:'props',source:[393,650,150,302],turn:Math.PI/2},
    van:{atlas:'props',source:[690,654,150,303],turn:-Math.PI/2},
    truck:{atlas:'props',source:[997,647,158,314],turn:Math.PI/2},
    bus:{atlas:'art139Bus',source:[52,160,1884,467],turn:0},
    utilityTruck:{atlas:'art139Truck',source:[90,16,1974,668],turn:0},
    ambulance:{atlas:'art140Van',source:[153,88,1709,590],turn:0},
    tanker:{atlas:'art139Truck',source:[90,16,1974,668],turn:0}
  }).map(([kind,s])=>[kind,Object.freeze({...s,source:Object.freeze(s.source),projection:'orthographic-owner-plan202'})])));
  function metricVehicleSkin202(f,art) {
    const original=METRIC_PLAN_SKINS202[f?.kind];if(!original)return null;
    const model={sedan:'break',van:'van',truck:'truck',bus:'bus',utilityTruck:'truck',ambulance:'van',tanker:'truck'}[f.kind],sprite=model&&WorldVariants158?.VEHICLES?.[model];
    const alternative=sprite?{atlas:sprite.atlas,source:sprite.rect,turn:0,projection:'orthographic-owner-plan202'}:null;
    return(f.style%2?[alternative,original]:[original,alternative]).find(s=>s&&art?.images?.[s.atlas])||null;
  }
  function metricSource202(c,art,atlas,source,destination,alpha=1) {
    if(!art?.images?.[atlas])return false;c.save();try{c.globalAlpha*=alpha;
      return typeof art.blit==='function'?art.blit(c,atlas,source,...destination)!==false:(c.drawImage(art.images[atlas],...source,...destination),true);
    }finally{c.restore();}
  }
  function metricVehicle202(c,art,f) {
    const skin=metricVehicleSkin202(f,art);if(!skin)return metricVehicleFallback202(c,f);
    const{l:x,t:y}=f.body,{w,h}=f;c.save();c.translate(x+w/2,y+h/2);if(skin.turn)c.rotate(skin.turn);
    // Reviewed overhead plans use explicit XY normalization, just as the
    // regional vehicle contract174 does. Rotate a vertical source, never its body.
    metricSource202(c,art,skin.atlas,skin.source,skin.turn?[-h/2,-w/2,h,w]:[-w/2,-h/2,w,h]);c.restore();
    if(f.kind==='ambulance'){
      const roof={x:x+w*.07,y:y+h*.13,w:w*.58,h:h*.74};c.fillStyle='#b6b5a1';c.fillRect(roof.x,roof.y,roof.w,roof.h);
      metricSource202(c,art,'worldPropsScenery153',[92,791,155,38],[roof.x,roof.y,roof.w,roof.h]);
      const cross=h*.17;c.fillStyle='#9e4138';c.fillRect(x+w*.34-cross*.32,y+h*.5-cross,cross*.64,cross*2);c.fillRect(x+w*.34-cross,y+h*.5-cross*.32,cross*2,cross*.64);
      c.strokeStyle='#ded2b3';c.lineWidth=Math.max(1,f.units*.035);c.strokeRect(roof.x,roof.y,roof.w,roof.h);
      c.fillStyle='#8f3938';c.fillRect(x+w*.67,y+h*.16,f.units*.09,h*.22);c.fillStyle='#3b6476';c.fillRect(x+w*.67,y+h*.62,f.units*.09,h*.22);
    }else if(f.kind==='tanker'){
      const cx=x+w*.35,cy=y+h/2,rx=w*.30,ry=h*.39;c.save();c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);c.clip();c.fillStyle='#989e8c';c.fillRect(cx-rx,cy-ry,rx*2,ry*2);
      if(!metricSource202(c,art,'worldPropsResources153',[55,804,177,58],[cx-rx,cy-ry,rx*2,ry*2]))metricSource202(c,art,'art138RoofMetal',[0,0,1254,1254],[cx-rx,cy-ry,rx*2,ry*2]);
      const light=c.createLinearGradient(0,cy-ry,0,cy+ry);light.addColorStop(0,'rgba(18,29,25,.48)');light.addColorStop(.4,'rgba(240,235,207,.10)');light.addColorStop(1,'rgba(17,27,23,.44)');c.fillStyle=light;c.fillRect(cx-rx,cy-ry,rx*2,ry*2);c.restore();
      c.strokeStyle='#bbc0a8';c.lineWidth=Math.max(1,f.units*.045);c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);c.stroke();
      for(const xx of[.18,.36,.54]){c.strokeStyle='rgba(49,63,50,.75)';c.lineWidth=f.units*.07;c.beginPath();c.moveTo(x+w*xx,y+h*.19);c.lineTo(x+w*xx,y+h*.81);c.stroke();}
      c.fillStyle='#576854';c.beginPath();c.ellipse(cx,cy-h*.06,h*.10,h*.08,0,0,Math.PI*2);c.fill();c.strokeStyle='#b2b797';c.stroke();
    }
    // Small identity-bound scratches retain all four cosmetic states without
    // replacing the painted body by a flat coloured panel.
    const px=x+w*(.22+f.style*.11),py=y+h*.36;c.strokeStyle='rgba(224,195,145,.58)';c.lineWidth=Math.max(.6,f.units*.02);c.beginPath();c.moveTo(px,py);c.lineTo(px+w*.045,py+h*.12);c.lineTo(px+w*.025,py+h*.26);c.stroke();
    return true;
  }
  function metricVehicleFallback202(c,f) {
    const {l:x,t:y}=f.body,{w,h,kind,style}=f,paint=['#657366','#8b7762','#657480','#867569'][style];
    c.fillStyle='#232d29';for(const xx of[x+w*.15,x+w*.74])for(const yy of[y,y+h*.84])c.fillRect(xx,yy,w*.12,h*.16);
    c.fillStyle=kind==='ambulance'?'#b9b9a6':paint;c.fillRect(x,y+h*.16,w,h*.68);c.fillRect(x+w*.025,y+h*.07,w*.95,h*.86);
    c.strokeStyle='#b1b5a0';c.lineWidth=Math.max(1,f.units*.035);c.strokeRect(x+w*.025,y+h*.07,w*.95,h*.86);
    const heavy=['truck','utilityTruck','tanker','ambulance'].includes(kind),cab=heavy?.25:.43,cabX=x+w*(heavy?.72:.30),cabW=w*cab;
    c.fillStyle='#293f40';c.fillRect(cabX,y+h*.13,cabW,h*.74);c.fillStyle=paint;c.fillRect(cabX+cabW*.16,y+h*.20,cabW*.56,h*.60);
    if(kind==='bus'){
      c.fillStyle=paint;c.fillRect(x+w*.07,y+h*.19,w*.86,h*.62);c.fillStyle='#293f40';
      for(let i=0;i<9;i++){c.fillRect(x+w*(.09+i*.088),y+h*.075,w*.057,h*.15);c.fillRect(x+w*(.09+i*.088),y+h*.775,w*.057,h*.15);}
      for(const xx of[.24,.49,.74]){c.fillStyle='#9a9e8c';c.fillRect(x+w*xx,y+h*.38,w*.07,h*.24);}
    }else if(['truck','utilityTruck','pickup'].includes(kind)){
      const bed=kind==='pickup'?.40:.64;c.fillStyle='#414b40';c.fillRect(x+w*.06,y+h*.18,w*bed,h*.64);c.strokeStyle='#a09d83';c.strokeRect(x+w*.08,y+h*.22,w*(bed-.04),h*.56);
      for(let xx=x+w*.12;xx<x+w*(bed+.04);xx+=f.units*.5){c.beginPath();c.moveTo(xx,y+h*.25);c.lineTo(xx,y+h*.75);c.stroke();}
    }else if(kind==='tanker'){
      c.fillStyle='#a1a493';c.beginPath();c.ellipse(x+w*.36,y+h/2,w*.29,h*.40,0,0,Math.PI*2);c.fill();c.strokeStyle='#687362';c.lineWidth=f.units*.08;
      for(const xx of[.20,.37,.54]){c.beginPath();c.moveTo(x+w*xx,y+h*.16);c.lineTo(x+w*xx,y+h*.84);c.stroke();}
    }else if(kind==='ambulance'){
      c.fillStyle='#c8c6b3';c.fillRect(x+w*.06,y+h*.12,w*.61,h*.76);c.fillStyle='#a25348';const cross=h*.19;c.fillRect(x+w*.34-cross*.35,y+h*.5-cross,cross*.7,cross*2);c.fillRect(x+w*.34-cross,y+h*.5-cross*.35,cross*2,cross*.7);
      c.fillStyle='#8f4e46';c.fillRect(x+w*.67,y+h*.12,f.units*.1,h*.76);
    }else if(kind==='van'){
      c.fillStyle=paint;c.fillRect(x+w*.08,y+h*.15,w*.54,h*.70);c.strokeStyle='#aaa993';c.strokeRect(x+w*.13,y+h*.24,w*.43,h*.52);
    }
    // Small damaged panels vary by saved identity; they never roll while painting.
    c.fillStyle='rgba(56,43,31,.48)';c.fillRect(x+w*(.13+style*.13),y+h*.29,w*.08,h*.18);
    c.fillStyle='#c1b38b';c.fillRect(x+w*.975,y+h*.18,w*.025,h*.12);c.fillRect(x+w*.975,y+h*.70,w*.025,h*.12);
  }
  function metricRuin202(c,art,node,f,seed) {
    const {l,t,r,b}=f.body,{w,h,wall,units:u}=f,type=f.kind==='ruinedHouse'?'house':f.kind==='ruinedShop'?'grocer':'warehouse';
    c.fillStyle=f.kind==='ruinedHouse'?'#74694e':'#777869';c.fillRect(l,t,w,h);
    c.save();c.globalAlpha*=.32;InteriorArt153.drawFloor(c,art,{id:f.identity,type},{x:l+wall,y:t+wall,w:w-wall*2,h:h-wall*2},{seed,tile:u*3});c.restore();
    c.strokeStyle='rgba(39,46,35,.38)';c.lineWidth=1;for(let x=l+u;x<r;x+=u){c.beginPath();c.moveTo(x,t);c.lineTo(x,b);c.stroke();}for(let y=t+u;y<b;y+=u){c.beginPath();c.moveTo(l,y);c.lineTo(r,y);c.stroke();}
    const masonry=(x,y,bw,height)=>{c.fillStyle='#686e60';c.fillRect(x,y-height,bw,height+wall);c.fillStyle='#a3a18a';c.fillRect(x,y-height,bw,Math.max(1,wall*.35));c.strokeStyle='#434e40';c.lineWidth=1;c.strokeRect(x,y-height,bw,height+wall);c.strokeStyle='rgba(49,56,44,.45)';for(let yy=y-height+u*.18;yy<y;yy+=u*.18){c.beginPath();c.moveTo(x,yy);c.lineTo(x+bw,yy);c.stroke();}};
    const count=Math.ceil(w/(u*.8)),pitch=w/count;
    for(let i=0;i<count;i++){const n=InteriorArt153.hash(seed,f.identity,'wall',i)%5;if(n!==f.style)masonry(l+i*pitch,t,pitch-wall*.15,f.rise*(.35+n*.14));}
    masonry(l,t+h*.36,wall,f.rise*.7);masonry(r-wall,t+h*.73,wall,f.rise*.8);
    const doorX=node.x-f.doorWidth/2;masonry(l,b,doorX-l,f.rise*.65);masonry(doorX+f.doorWidth,b,r-doorX-f.doorWidth,f.rise*.55);
    c.fillStyle='#29392f';c.fillRect(doorX,b-f.doorHeight,f.doorWidth,f.doorHeight);c.strokeStyle='#aaa68c';c.lineWidth=Math.max(1,wall*.2);c.strokeRect(doorX,b-f.doorHeight,f.doorWidth,f.doorHeight);
    const roof={x:l,y:t-f.rise,w,h},patches=[[l,t-f.rise,w*.40,h*.29],[r-w*.33,t-f.rise+h*.61,w*.33,h*.28]];
    for(const[x,y,pw,ph]of patches){c.save();c.beginPath();c.moveTo(x,y);c.lineTo(x+pw,y+wall);c.lineTo(x+pw*.86,y+ph);c.lineTo(x+pw*.36,y+ph-wall);c.lineTo(x,y+ph*.67);c.closePath();c.clip();c.fillStyle='#786d54';c.fillRect(x,y,pw,ph);InteriorArt153.drawRoof(c,art,{id:'ruin-roof:'+f.identity,type},roof,{seed});c.restore();}
    c.save();c.beginPath();c.rect(l+wall,t+wall,w-wall*2,h-wall*2);c.clip();c.globalAlpha*=.75;
    // Crop loose masonry inside the isolated source. A complete perspective
    // ruin would read as a second miniature house standing on this floor.
    const choices=InteriorArt153.RUINS[f.kind],source=choices?.[InteriorArt153.variantFor(node,{seed},'ruin:'+f.kind,choices.length)];
    if(source&&art?.images?.[source.atlas]){const[sx,sy,sw,sh]=source.rect,size=Math.min(u*3,w*.36,h*.42),cut=[sx+sw*.28,sy+sh*.36,sw*.34,sh*.31],scale=Math.min(size/cut[2],size/cut[3]),destination=[l+w*.56,t+h*.38,cut[2]*scale,cut[3]*scale];
      if(typeof art.blit==='function')art.blit(c,source.atlas,cut,...destination);else c.drawImage(art.images[source.atlas],...cut,...destination);}
    c.restore();
    c.fillStyle='#9d957c';for(let i=0;i<18;i++){const n=InteriorArt153.hash(seed,f.identity,'debris',i),x=l+wall+(n%997)/997*(w-wall*3),y=t+wall+((n>>>10)%991)/991*(h-wall*3);c.fillRect(x,y,u*(.10+(n%4)*.045),u*(.08+(n%3)*.05));}
  }
  function metricProp202(c,art,node,f,seed) {
    const{l:x,t:y}=f.body,{w,h,kind,units:u}=f;
    if(kind==='guardBooth'){
      c.fillStyle='#7c8574';c.fillRect(x,y+h-f.rise,w,f.rise);c.fillStyle='#9a9d89';c.fillRect(x,y-f.rise,w,h);c.strokeStyle='#4a5948';c.lineWidth=Math.max(1,u*.04);c.strokeRect(x+1,y-f.rise+1,w-2,h-2);
      metricSource202(c,art,'art138InteriorConcrete',[120,150,460,460],[x+1,y-f.rise+1,w-2,h-2],.68);
      const dx=x+w-f.doorWidth-u*.12,dy=y+h-f.doorHeight;c.fillStyle='#2c3d32';c.fillRect(dx,dy,f.doorWidth,f.doorHeight);c.strokeStyle='#b3ad8d';c.strokeRect(dx,dy,f.doorWidth,f.doorHeight);
      c.fillStyle='#314843';c.fillRect(x+u*.12,y+h-f.rise+u*.2,u*.6,u*.38);c.fillStyle='#737e6b';c.fillRect(node.x-u*.2,node.y-f.rise-u*.2,u*.4,u*.4);return;
    }
    if(kind==='rubble'){
      c.fillStyle='rgba(99,96,77,.45)';c.fillRect(x,y,w,h);for(let i=0;i<30;i++){const n=InteriorArt153.hash(seed,f.identity,i),xx=x+(n%991)/991*(w-u*.32),yy=y+((n>>>10)%997)/997*(h-u*.28);c.fillStyle=['#777a67','#9a9077','#626d59'][i%3];c.fillRect(xx,yy,u*.32,u*.28);}return;
    }
    if(kind==='streetLamp'||kind==='powerPylon'){
      c.fillStyle='#737966';c.fillRect(x,y,w,h);c.strokeStyle='#8e9582';c.lineWidth=Math.max(2,u*.07);c.beginPath();
      if(kind==='streetLamp'){c.moveTo(node.x,node.y);c.lineTo(node.x,node.y-f.rise);c.lineTo(node.x+w*.35,node.y-f.rise);}
      else{c.moveTo(x,y+h);c.lineTo(node.x,node.y-f.rise);c.lineTo(x+w,y+h);for(let i=0;i<4;i++){const yy=node.y-f.rise*(i+1)/5;c.moveTo(x+w*.15,yy);c.lineTo(x+w*.85,yy);}}
      c.stroke();c.fillStyle='#a4aa94';c.fillRect(node.x-w*.25,node.y-f.rise,w*.5,Math.max(2,u*.08));return;
    }
    if(kind==='waterTank'){c.save();c.beginPath();c.ellipse(node.x,node.y,w/2,h/2,0,0,Math.PI*2);c.clip();c.fillStyle='#909b89';c.fillRect(x,y,w,h);metricSource202(c,art,'worldPropsScenery153',[146,306,91,45],[x,y,w,h]);
      const shade=c.createLinearGradient(x,y,x+w,y+h);shade.addColorStop(0,'rgba(244,236,206,.18)');shade.addColorStop(1,'rgba(19,33,27,.4)');c.fillStyle=shade;c.fillRect(x,y,w,h);c.restore();c.strokeStyle='#535f51';c.lineWidth=u*.1;c.beginPath();c.ellipse(node.x,node.y,w/2,h/2,0,0,Math.PI*2);c.stroke();c.fillStyle='#5e6e5b';c.beginPath();c.arc(node.x+w*.15,node.y-h*.12,Math.min(w,h)*.10,0,Math.PI*2);c.fill();return;}
    c.fillStyle=kind==='tent'?'#738065':kind==='concreteBarricade'?'#969c88':['#737c70','#8b7d66','#6b7c80','#807b6b'][f.style];c.fillRect(x,y-f.rise,w,h+f.rise);
    c.strokeStyle='#3c493b';c.lineWidth=Math.max(1,u*.05);c.strokeRect(x+1,y-f.rise+1,w-2,h+f.rise-2);
    if(kind==='tent'){metricSource202(c,art,'worldPropsScenery153',[149,111,73,53],[x+1,y+1,w-2,h-2],.9);c.beginPath();c.moveTo(x,y+h/2);c.lineTo(x+w/2,y+h*.08);c.lineTo(x+w,y+h/2);c.moveTo(x+w/2,y+h*.08);c.lineTo(x+w/2,y+h*.92);c.stroke();c.fillStyle='#2a3c2e';c.fillRect(node.x-f.doorWidth/2,y+h*.78,f.doorWidth,h*.22);}
    else if(kind==='container'){metricSource202(c,art,'art138RoofMetal',[32,48,610,1050],[x+1,y+1,w-2,h-2]);for(let xx=x+u*.22;xx<x+w;xx+=u*.32){c.beginPath();c.moveTo(xx,y+u*.12);c.lineTo(xx,y+h-u*.12);c.stroke();}c.lineWidth=u*.08;c.strokeRect(x+w-u*.22,y+u*.18,u*.12,h-u*.36);}
    else{c.fillStyle='#777f6d';c.fillRect(x,y+h-f.rise,w,f.rise);c.strokeStyle='#abb199';c.beginPath();c.moveTo(x,y-f.rise);c.lineTo(x+w,y-f.rise);c.stroke();}
  }
  function drawMetricScenery202(ctx,art,node,{seed=0,rect=null}={}) {
    const f=metricSceneryFrame202(node,{seed,rect});if(!f||!ctx?.fillRect)return false;
    ctx.save();try{
      const ratio=Number.isFinite(node.amount)&&node.maxAmount>0?clamp(node.amount/node.maxAmount,node.sceneryKind ? .5 : .45,1):1;ctx.globalAlpha*=ratio;
      ctx.beginPath();ctx.rect(f.bounds.x,f.bounds.y,f.bounds.w,f.bounds.h);ctx.clip();
      if(metricVehicles202.has(f.kind))metricVehicle202(ctx,art,f);else if(metricRuins202.has(f.kind))metricRuin202(ctx,art,node,f,seed);else metricProp202(ctx,art,node,f,seed);
      if(node.flash>0){const q=f.body;ctx.strokeStyle='rgba(231,205,143,.8)';ctx.lineWidth=Math.min(2,f.wall/2);ctx.strokeRect(q.l+1,q.t+1,f.w-2,f.h-2);}
      return true;
    }finally{ctx.restore();}
  }
  class Art {
    constructor() {
      this.images = {}; this.rects = {}; this.actionFrames133 = {}; this.motion = new WeakMap(); this.namedMotion = new Map(); this.nodeSpecies = new WeakMap();
      this.diagnostics = { ready: [], failed: [], draws: {} };
      this.renderCache153=RenderCache153?.create();
      this.assetRequests160=new Map();this.lazyQueue160=[];this.activeLazyLoads160=0;
      this.ready = Promise.all(Object.entries(ASSETS).filter(([,spec])=>spec.lazy!==true).map(([key,spec])=>{
        const pending=this.load(key,spec);
        this.assetRequests160.set(key,pending.then(()=>!!this.images[key]&&!this.diagnostics.failed.includes(key),()=>false));
        return pending;
      }));
    }
    ensure(key) {
      if(typeof key!=='string'||!Object.hasOwn(ASSETS,key))return Promise.resolve(false);
      const existing=this.assetRequests160.get(key);if(existing)return existing;
      if(this.images[key]&&!this.diagnostics.failed.includes(key)){
        const ready=Promise.resolve(true);this.assetRequests160.set(key,ready);return ready;
      }
      const pending=new Promise(resolve=>this.lazyQueue160.push({key,resolve}));
      this.assetRequests160.set(key,pending);this.drainLazy160();return pending;
    }
    ensureAssets(keys) {
      return Promise.all(Array.isArray(keys)?keys.map(key=>this.ensure(key)):[]);
    }
    drainLazy160() {
      while(this.activeLazyLoads160<2&&this.lazyQueue160.length){
        const job=this.lazyQueue160.shift();this.activeLazyLoads160++;
        const finish=ok=>{
          this.activeLazyLoads160--;job.resolve(ok);this.drainLazy160();
        };
        // Deferred images share the historical dimension and matte decoder.
        // Failed requests stay settled so painting cannot retry each frame.
        Promise.resolve().then(()=>this.load(job.key,ASSETS[job.key])).then(
          ()=>finish(!!this.images[job.key]&&!this.diagnostics.failed.includes(job.key)),
          ()=>{if(!this.diagnostics.failed.includes(job.key))this.diagnostics.failed.push(job.key);finish(false);}
        );
      }
    }
    load(key, spec) {
      return new Promise(resolve => {
        const source = new Image();
        source.onload = () => {
          try {
            if (source.naturalWidth !== spec.width || source.naturalHeight !== spec.height) throw new Error('dimensions');
            if(HERO_ACTION_PIVOTS133[key]){
              const canvas=document.createElement('canvas');canvas.width=spec.width;canvas.height=spec.height;
              const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
              const frames=isolateHeroFrames133(ctx.getImageData(0,0,spec.width,spec.height).data,spec.width,spec.height,HERO_ACTION_PIVOTS133[key]);
              this.actionFrames133[key]=frames.map(frame=>{const image=document.createElement('canvas');image.width=frame.rect[2];image.height=frame.rect[3];const c=image.getContext('2d'),data=c.createImageData(image.width,image.height);data.data.set(frame.data);c.putImageData(data,0,0);return{image,pivot:frame.pivot,rect:frame.rect};});
              this.images[key]=source;
            }else if (spec.matte === 'magenta' || spec.matte === 'neutral') {
              const canvas = document.createElement('canvas'); canvas.width = spec.width; canvas.height = spec.height;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              ctx.drawImage(source, 0, 0);
              const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
              decodeMatte(data.data, canvas.width, canvas.height, spec.matte); ctx.putImageData(data, 0, 0);
              this.images[key] = canvas;
              const rects = key === 'buildings' ? BUILDINGS : key === 'props' ? PROPS : key === 'defenses' ? DEFENSES : key === 'districtProps' ? DISTRICT_PROPS : {};
              for (const [id, rect] of Object.entries(rects)) this.rects[key + ':' + id] = tightRect(data.data, canvas.width, rect);
            } else {
              this.images[key] = source;
              if(Artwork136?.ASSETS141?.[key]||Artwork136?.ASSETS140?.[key]||Artwork136?.ASSETS139?.[key]||Artwork136?.ASSETS[key]&&!['art136ForestFloor','art136WetGround','art136LockChest','art136ElectricalPanel'].includes(key)){
                const canvas=document.createElement('canvas');canvas.width=spec.width;canvas.height=spec.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(source,0,0);
                this.rects[key+':sprite']=tightRect(c.getImageData(0,0,spec.width,spec.height).data,spec.width,[0,0,spec.width,spec.height]);
              }
            }
            this.diagnostics.ready.push(key);
          } catch { this.diagnostics.failed.push(key); }
          resolve();
        };
        source.onerror = () => { this.diagnostics.failed.push(key); resolve(); };
        source.src = spec.url;
      });
    }
    blit(ctx, atlas, rect, x, y, w, h) {
      const image = this.images[atlas]; if (!image) return false;
      const cached=this.renderCache153?.get(ctx,atlas,image,rect,w,h);
      if(cached)ctx.drawImage(cached.image,0,0,cached.width,cached.height,x,y,w,h);
      else ctx.drawImage(image, ...rect, x, y, w, h);
      this.diagnostics.draws[atlas] = (this.diagnostics.draws[atlas] || 0) + 1;
      return true;
    }
    drawGround(ctx, view, worldSize) {
      const image = this.images.ground; if (!image) return false;
      const size = 512;
      ctx.save(); ctx.globalAlpha = .7;
      for (let y = Math.max(0, Math.floor(view.top / size)); y < Math.min(Math.ceil(worldSize / size), Math.ceil(view.bottom / size)); y++)
        for (let x = Math.max(0, Math.floor(view.left / size)); x < Math.min(Math.ceil(worldSize / size), Math.ceil(view.right / size)); x++)
          this.blit(ctx, 'ground', [0, 0, image.width, image.height], x * size, y * size, size + .5, size + .5);
      ctx.restore(); return true;
    }
    drawBuilding(ctx, b, world) {
      const g=root.DEADWALL;
      if(b.type==='spikes'&&TrapArt159?.drawSpikes(ctx,this,b,{seed:world?.seed??0,reducedMotion:!!g?.settings?.reducedMotion,presentation:g?.fortificationPack?.presentation(b)?.spikes}))return true;
      if(BuildingVariants157?.drawBuilding(ctx,this,b,world))return true;
      const seed=world?.seed??0;
      if(D17Art152?.drawBuilding(ctx,this,b,{seed})||D17Art150?.drawBuilding(ctx,this,b,{seed})||D17Art150?.drawFallback(ctx,this,b))return true;
      const originalAtlas = b.type === 'spikes' || b.type === 'armoredGate' ? 'defenses' : b.def.wall ? 'props' : 'buildings';
      const id = b.type;
      const alternate=BuildingVariants157?.operational(b)?BuildingVariants157.alternateFor(id,b.id??[b.gx,b.gy,id].join(':'),world?.seed??0,this.images):null;
      const atlas=alternate?.atlas||originalAtlas,rect=alternate?.rect||this.rects[originalAtlas + ':' + id]; if (!rect) return false;
      let width = b.w * 32, height = b.h * 32, angle = b.rotation * Math.PI / 2;
      if (b.def.wall && !b.def.gate) {
        const up = world.atCell(b.gx, b.gy - 1), down = world.atCell(b.gx, b.gy + 1);
        const left = world.atCell(b.gx - 1, b.gy), right = world.atCell(b.gx + 1, b.gy);
        angle = (Number(Boolean(up?.def.wall)) + Number(Boolean(down?.def.wall))) >
          (Number(Boolean(left?.def.wall)) + Number(Boolean(right?.def.wall))) ? Math.PI / 2 : 0;
        width = 34; height = 30;
      } else if (b.rotation % 2) [width, height] = [height, width];
      // New silhouettes retain their native proportions inside the original
      // local display area and contact. Occupancy and connection axes stay owned
      // by the existing building and wall logic above.
      const nativeScale=alternate?Math.min((width+4)/rect[2],(height+7)/rect[3]):1;
      const nativeWidth=rect[2]*nativeScale,nativeHeight=rect[3]*nativeScale,nativeTop=height/2+2-nativeHeight;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(angle);
      ctx.fillStyle = 'rgba(10,15,12,.22)'; ctx.beginPath();ctx.ellipse(0,height*.32,width*.48,height*.22,0,0,Math.PI*2);ctx.fill();
      if (!alternate&&(id === 'house' || id === 'barracks')) {
        ctx.rotate(Math.PI / 2); this.blit(ctx, atlas, rect, -height / 2, -width / 2, height, width);
      } else if (b.def.gate && b.gateMode === 'open') {
        // Reuse the original gate leaves: compressed at their jambs, with an actual visible passage.
        const [sx,sy,sw,sh]=rect;
        const top=alternate?nativeTop:-height/2-5,leafHeight=alternate?nativeHeight:height+7;
        this.blit(ctx,atlas,[sx,sy,sw/2,sh],-width/2-2,top,width*.24,leafHeight);
        this.blit(ctx,atlas,[sx+sw/2,sy,sw/2,sh],width*.26+2,top,width*.24,leafHeight);
        ctx.strokeStyle='#e2bd71';ctx.lineWidth=1.5;
        for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(-4,sign*height*.2);ctx.lineTo(0,sign*height*.32);ctx.lineTo(4,sign*height*.2);ctx.stroke();}
      } else if(alternate)this.blit(ctx,atlas,rect,-nativeWidth/2,nativeTop,nativeWidth,nativeHeight);
      else this.blit(ctx, atlas, rect, -width / 2 - 2, -height / 2 - 5, width + 4, height + 7);
      if(b.def.gate&&b.gateMode==='closed'){ctx.fillStyle='#dfb06e';ctx.fillRect(-4,-height*.46,8,6);ctx.strokeStyle='#dfb06e';ctx.lineWidth=1.5;ctx.strokeRect(-2.5,-height*.46-4,5,5);}
      ctx.restore();
      if (b.corpseLoad > 4) {
        ctx.fillStyle = 'rgba(64,39,32,.8)';
        for (let i = 0; i < Math.min(8, b.corpseLoad / 3); i++) {
          ctx.beginPath(); ctx.ellipse(b.left + 4 + i * width / 8, b.top + height + 1, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      return true;
    }
    drawWorldNode153(ctx, node, seed, rect) {
      if(node.sceneryKind&&this.drawMetricScenery202(ctx,node,seed,rect))return true;
      ctx.save();
      if(node.flash>0){ctx.translate(node.x,node.y);ctx.scale(1.03,1.03);ctx.translate(-node.x,-node.y);}
      let painted=NatureArt153?.drawSceneryNode(ctx,this,node,{seed})||WorldPropsArt153?.drawSceneryNode(ctx,this,node,{seed,rect});
      if(!painted&&node.sceneryKind){
        ctx.globalAlpha*=clamp(node.amount/node.maxAmount,.5,1);
        painted=InteriorArt153?.drawSceneryRuin(ctx,this,node,{seed,size:node.renderSize||90});
      }
      if(!painted&&!node.sceneryKind&&['wood','stone'].includes(node.type)){
        const variant=Math.abs(node.variant||0)%4;
        const family=node.type==='stone'?'limestone':variant===1?'pine':variant===2?'logs':'oak';
        const size=node.radius*(node.type==='wood'&&variant!==2?3.5:2.65);
        painted=NatureArt153?.drawSprite(ctx,this,family,node.id,node.x,node.y,size,size,{seed,alpha:clamp(node.amount/node.maxAmount,.45,1)});
      }
      ctx.restore();return !!painted;
    }
    drawNode(ctx, node, game) {
      if(!node.sceneryKind&&this.drawMetricScenery202(ctx,node,game?.world?.seed||0,game?.fieldcraft?.rect(node)))return true;
      if(node.sceneryKind){
        this.nodeSpecies?.delete(node);
        if(this.drawWorldNode153(ctx,node,game?.world?.seed||0,game?.fieldcraft?.rect(node)))return true;
        const rect=this.rects['districtProps:'+node.sceneryKind];if(!rect)return false;
        const size=node.renderSize||90,ratio=rect[2]/rect[3],w=ratio>1?size:size*ratio,h=ratio>1?size/ratio:size;
        ctx.save();ctx.translate(node.x,node.y);ctx.globalAlpha=clamp(node.amount/node.maxAmount,.5,1);
        if(node.flash>0)ctx.scale(1.03,1.03);
        this.blit(ctx,'districtProps',rect,-w/2,-h/2,w,h);ctx.restore();return true;
      }
      const variant = Math.abs(node.variant || 0) % 4;
      // Local G7/G8 botanical appearance shares the region's ecology. This is a
      // painter only: collision radius, finite amount and saved IDs are untouched.
      const pose=game?.frontier?.position?.(),generation=pose?.generation,ecologyVersion=pose?.ecologyVersion||0,hydrologyVersion=pose?.hydrologyVersion||0,landscape189=pose?.landscape189||'classic';
      if(generation>=7&&(node.type==='stone'||node.type==='wood'&&variant!==2)){
        const B=nodeEcology(game,pose),P=root.DeadwallAtlasProjection;
        if(B&&P&&Artwork136){
          const q=P.toRegion(node.x,node.y,game),seed=game.world.seed,cache=this.nodeSpecies||(this.nodeSpecies=new WeakMap());
          let saved=cache.get(node);
          // Only the pure species choice is cached, one record per live node.
          // Resolved regional coordinates cover custom homes and worldSeed origins.
          if(!saved||saved.world!==game.world||saved.seed!==seed||saved.generation!==generation||saved.ecologyVersion!==ecologyVersion||saved.hydrologyVersion!==hydrologyVersion||saved.landscape189!==landscape189||saved.id!==node.id||saved.type!==node.type||saved.variant!==variant||saved.x!==node.x||saved.y!==node.y||saved.qx!==q.x||saved.qy!==q.y||saved.biomes!==B||saved.projection!==P){
            const species=(node.type==='wood'?B.pickTree(seed,q.x,q.y,'local:'+node.id,{generation}):B.pickRock(seed,q.x,q.y,'local:'+node.id,{generation})).species;
            saved={world:game.world,seed,generation,ecologyVersion,hydrologyVersion,landscape189,id:node.id,type:node.type,variant,x:node.x,y:node.y,qx:q.x,qy:q.y,biomes:B,projection:P,species};cache.set(node,saved);
          }
          const key=(node.type==='wood'?Artwork136.TREE_SPRITES:Artwork136.ROCK_SPRITES)[saved.species],size=node.radius*(node.type==='wood'?3.5:2.65);
          const alpha=clamp(node.amount/node.maxAmount,.45,1);
          if(NatureArt153?.drawSprite(ctx,this,saved.species,node.id,node.x,node.y,size,size,{seed,alpha}))return true;
          if(Artwork136.drawSprite(ctx,this,key,node.x,node.y,size,size,{alpha}))return true;
        }
      }else this.nodeSpecies?.delete(node);
      if(this.drawWorldNode153(ctx,node,game?.world?.seed||0,game?.fieldcraft?.rect(node)))return true;
      const key = node.type === 'wood' ? ['tree', 'pine', 'logs', 'tree'][variant] :
        node.type === 'scrap' ? ['scrap', 'sedan', 'van', 'truck'][variant] :
        node.type === 'fuel' ? (variant % 2 ? 'pickup' : 'fuel') : node.type === 'stone' ? 'rocks' : variant === 3 ? 'supplies' : 'crops';
      const rect = this.rects['props:' + key]; if (!rect) return false;
      const size = node.radius * (key === 'tree' || key === 'pine' ? 3.5 : 2.65);
      const ratio = rect[2] / rect[3], w = ratio > 1 ? size : size * ratio, h = ratio > 1 ? size / ratio : size;
      ctx.save(); ctx.translate(node.x, node.y); ctx.globalAlpha = clamp(node.amount / node.maxAmount, .45, 1);
      if (node.flash > 0) ctx.scale(1.04, 1.04);
      this.blit(ctx, 'props', rect, -w / 2, -h / 2, w, h); ctx.restore(); return true;
    }
    drawMetricScenery202(ctx,node,seed=0,rect=null) { return drawMetricScenery202(ctx,this,node,{seed,rect}); }
    drawCommanderRig(ctx,entity,reducedMotion,compact){
      if(!this.images.commanderRig||!canArticulate(entity))return false;
      const pose=heroRigPose(entity,reducedMotion),scale=HERO_RIG.scale*(compact?1.1:1);
      const part=(piece,rotation,size)=>{
        const [x,y,w,h]=piece.rect;ctx.save();ctx.rotate(rotation);
        this.blit(ctx,'commanderRig',piece.rect,(x-piece.pivot[0])*size,(y-piece.pivot[1])*size,w*size,h*size);ctx.restore();
      };
      part(HERO_RIG.lower[pose.lower],entity.visualLowerFacing,scale);
      if(entity.visualUnarmed){
        const upper=this.actionFrames133.heroHarvest133?.[24];ctx.save();ctx.rotate(entity.visualUpperFacing);
        if(upper){const s=.225*(compact?1.1:1),h=Math.min(upper.image.height,upper.pivot[1]+43);ctx.drawImage(upper.image,0,0,upper.image.width,h,-upper.pivot[0]*s,-upper.pivot[1]*s,upper.image.width*s,h*s);}
        else this.drawUnarmedTorso133(ctx);
        ctx.restore();
      }else if(entity.visualEquipmentCategory==='firearm'&&this.images[EquipmentArt159?.weaponSprite(entity.visualEquipmentId,{held:true,seed:root.DEADWALL?.world?.seed??0,identity:entity.id})?.atlas]){
        const reload=reloadPose137(entity),rotation=entity.visualUpperFacing+(reload&&!reducedMotion?-.12*reload.reach:0);
        ctx.save();ctx.rotate(rotation);
        const upper=this.actionFrames133.heroHarvest133?.[24];
        if(upper){const s=.225*(compact?1.1:1),h=Math.min(upper.image.height,upper.pivot[1]+43);ctx.drawImage(upper.image,0,0,upper.image.width,h,-upper.pivot[0]*s,-upper.pivot[1]*s,upper.image.width*s,h*s);}
        else this.drawUnarmedTorso133(ctx);
        if(compact)ctx.scale(1.1,1.1);
        EquipmentArt159.drawHeld(ctx,this,entity.visualEquipmentId,12-(entity.visualRecoil&&!reducedMotion?1.8:0),5,0,{seed:root.DEADWALL?.world?.seed??0,identity:entity.id});
        if(reload)this.drawReload137(ctx,entity,reducedMotion);
        ctx.restore();
      }else {
        const reload=reloadPose137(entity),rotation=entity.visualUpperFacing+(reload&&!reducedMotion?-.12*reload.reach:0);
        part(HERO_RIG.upper[reload?(entity.weapon==='pistol'?1:0):pose.upper],rotation,scale);
        if(reload){ctx.save();ctx.rotate(rotation);if(compact)ctx.scale(1.1,1.1);this.drawReload137(ctx,entity,reducedMotion);ctx.restore();}
      }
      return true;
    }
    drawReload137(ctx,entity,reducedMotion){
      const pose=reloadPose137(entity);if(!pose)return;
      const pistol=entity.weapon==='pistol',x=pistol?12:18,y=4+(reducedMotion?6:pose.insert*11);
      ctx.save();ctx.translate(x,y);ctx.rotate(reducedMotion?0:pose.reach*.32);ctx.fillStyle='#151b19';ctx.fillRect(-2,-2,4,pistol?5:7);ctx.fillStyle='#777c70';ctx.fillRect(-1,-1,1,pistol?4:6);ctx.restore();
    }
    drawLowBody137(ctx,entity,reducedMotion,compact){
      const pose=HERO_LOW137[entity.visualPosture];if(!pose||!this.images[pose.atlas]||entity.dead)return false;
      const scale=pose.scale*(compact?1.1:1),[x,y,w,h]=pose.rect;
      ctx.save();ctx.rotate(entity.visualUpperFacing??entity.facing??0);
      if(!reducedMotion&&entity.visualMoving)ctx.translate(0,Math.sin(entity.visualStride||0)*.4);
      this.blit(ctx,pose.atlas,pose.rect,(x-pose.pivot[0])*scale,(y-pose.pivot[1])*scale,w*scale,h*scale);ctx.restore();return true;
    }
    drawLowFirearm137(ctx,entity,reducedMotion,compact){
      if(entity.visualUnarmed||['melee','tool','improvised'].includes(entity.visualEquipmentCategory)||!this.drawLowBody137(ctx,entity,reducedMotion,compact))return false;
      ctx.save();ctx.rotate(entity.visualUpperFacing??entity.facing??0);if(compact)ctx.scale(1.1,1.1);
      const pistol=entity.weapon==='pistol',shotgun=entity.weapon==='shotgun',recoil=!reducedMotion&&entity.visualRecoil?-1.8:0;
      ctx.translate(recoil,3);
      if(entity.visualEquipmentCategory==='firearm'&&EquipmentArt159?.drawHeld(ctx,this,entity.visualEquipmentId,13,0,0,{seed:root.DEADWALL?.world?.seed??0,identity:entity.id})){
        // The native low body contains no weapon; the model owns its silhouette.
      }else if(this.images.commanderRig){
        // Reuse the measured weapon-only area, without copying a second torso.
        if(pistol)this.blit(ctx,'commanderRig',[798,239,96,32],13,-2,13,13/3);
        else this.blit(ctx,'commanderRig',[269,230,217,92],11,-5,27,27*92/217);
      }else{
        ctx.fillStyle='#242a26';ctx.fillRect(11,-3,pistol?16:27,pistol?5:4);
        ctx.fillStyle=shotgun?'#715333':'#4b5547';if(!pistol)ctx.fillRect(18,-3,shotgun?12:9,5);
        ctx.fillStyle='#8b9082';ctx.fillRect(13,-2,pistol?12:25,1);ctx.fillStyle='#171d19';ctx.fillRect(pistol?13:17,1,4,pistol?4:6);
      }
      ctx.restore();if(entity.reload>0){ctx.save();ctx.rotate(entity.visualUpperFacing??entity.facing??0);if(compact)ctx.scale(1.1,1.1);this.drawReload137(ctx,entity,reducedMotion);ctx.restore();}return true;
    }
    drawUnarmedTorso133(ctx){
      ctx.fillStyle='#958245';ctx.beginPath();ctx.ellipse(0,0,9,12,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#505b45';ctx.fillRect(-11,-7,5,14);ctx.fillStyle='#493e32';ctx.beginPath();ctx.arc(1,0,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#343a36';for(const y of [-10,8])ctx.fillRect(7,y,7,4);
    }
    drawUnarmed133(ctx,entity,reducedMotion,compact){
      if(!entity.visualUnarmed)return false;if(this.drawLowBody137(ctx,entity,reducedMotion,compact)||this.drawCommanderRig(ctx,entity,reducedMotion,compact))return true;
      ctx.save();ctx.rotate(entity.facing||0);const s=compact?1.1:1;ctx.scale(s,s);
      if(entity.dead||entity.visualPosture==='prone')ctx.scale(1.45,.68);else if(entity.visualPosture==='crouch')ctx.scale(.92,.9);
      this.drawUnarmedTorso133(ctx);ctx.restore();return true;
    }
    drawHandheld136(ctx,entity,reducedMotion,compact){
      if(!Artwork136||!['melee','tool','improvised'].includes(entity.visualEquipmentCategory))return false;
      const stand=(!entity.visualPosture||entity.visualPosture==='stand')&&!entity.dead;
      const body={...entity,visualUnarmed:true,visualArticulated:stand,meleeCooldown:0,visualAction:''};
      if(!this.drawCommanderRig(ctx,body,reducedMotion,compact))this.drawUnarmed133(ctx,body,reducedMotion,compact);
      const duration=1/Math.max(.1,entity.visualEquipmentRate||1),phase=clamp(1-(entity.meleeCooldown||0)/duration,0,1);
      const swing=!reducedMotion&&entity.meleeCooldown>0?Math.sin(phase*Math.PI*2)*.8:0;
      ctx.save();ctx.rotate((entity.visualUpperFacing??entity.facing??0)+swing);const s=compact?1.1:1;ctx.scale(s,s);
      const low=HERO_LOW137[entity.visualPosture];
      if(low&&this.images[low.atlas]&&!entity.dead)ctx.translate(7,-4);
      else if(entity.dead||entity.visualPosture==='prone')ctx.scale(1.25,.7);else if(entity.visualPosture==='crouch')ctx.scale(.92,.9);
      Artwork136.drawHeld(ctx,entity.visualEquipmentId,this,{seed:root.DEADWALL?.world?.seed??0,identity:entity.id});ctx.restore();return true;
    }
    drawHeroAction133(ctx,entity,reducedMotion,compact){
      const pose=heroActionPose133(entity,reducedMotion),frame=pose&&this.actionFrames133[pose.atlas]?.[pose.row*8+pose.frame];if(!frame)return false;
      const scale=.225*(compact?1.1:1);ctx.save();ctx.rotate(pose.facing);
      ctx.drawImage(frame.image,-frame.pivot[0]*scale,-frame.pivot[1]*scale,frame.image.width*scale,frame.image.height*scale);ctx.restore();
      this.diagnostics.draws[pose.atlas]=(this.diagnostics.draws[pose.atlas]||0)+1;return true;
    }
    drawActor(ctx, entity, kind, time, reducedMotion, compact) {
      entity = this.presentation?.(entity, kind) || entity;
      const visualSeed=root.DEADWALL?.world?.seed??0;
      const upright=kind==='player'?!!entity.visualUpright:(ActorActions159?.uprightAppearance?.(kind,entity.id,{seed:visualSeed,images:this.images})??!!entity.visualUpright);
      const atlas=entity.weapon==='pistol'&&this.images.commanderPistol?'commanderPistol':'commander';
      const alternative=WorldVariants158?.actorFrame(kind,entity.id,0,{seed:visualSeed});
      const spec = ACTORS[actorVariant(kind,entity.id)]; if (!spec || (!this.images[spec[0]] && !this.images[alternative?.atlas] && !(kind==='player'&&(this.images[atlas]||this.images.commanderRig&&canArticulate(entity)||this.actionFrames133[heroActionPose133(entity,reducedMotion)?.atlas]||entity.visualUnarmed||entity.visualEquipmentCategory)))) return false;
      const motions=entity.visualIdentity?this.namedMotion:this.motion,key=entity.visualIdentity||entity;
      let previous = motions.get(key);
      if (!previous || entity.visualMotionReset || time < previous.time) { previous = { x: entity.x, y: entity.y, time, moving: false, until: -1 }; motions.set(key, previous); }
      if(this.namedMotion.size>2048)this.namedMotion.delete(this.namedMotion.keys().next().value);
      const distance=Math.hypot(entity.x - previous.x, entity.y - previous.y),dt=time-previous.time;
      // Repeated paints preserve a paused pose; a new stationary simulation
      // sample stops it. Slow movement must not depend on the display rate.
      const inferredMoving=dt===0&&distance<1e-8?previous.moving:dt>0&&dt<=.25&&distance>1e-5&&distance<100;
      const moving=typeof entity.visualMoving==='boolean'?entity.visualMoving:inferredMoving;
      previous.x = entity.x; previous.y = entity.y; previous.time=time; previous.moving=moving; previous.until=moving?time:-1;
      // Regional owners use text IDs. Adding them to time would concatenate and
      // turn the frame into NaN; a stable cosmetic hash preserves their cycle.
      const phase = Number.isFinite(entity.id) ? entity.id : typeof entity.id==='string' ? (WorldVariants158?.hash(0,entity.id,'actor-phase')??0)%8 : 0;
      const frame = reducedMotion || previous.until < time || kind==='charger'&&entity.charge?.stage==='windup' ? 0 : Math.floor(time * (kind === 'runner'||kind==='charger'&&entity.charge?.stage==='rush' ? 13 : 9) + phase) % 8;
      const size = (kind === 'player' ? 57 : ['armored','breacher','bloated','shielded'].includes(kind) ? 62 : kind === 'crawler' ? 49 : 55) * (compact ? 1.1 : 1);
      ctx.save(); ctx.translate(entity.x, entity.y);
      if (kind === 'player') { ctx.strokeStyle = '#ddba69'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 3, 16, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
      if (kind === 'player' && entity.invulnerable > 0 && Math.floor(entity.invulnerable * 10) % 2 === 0) ctx.globalAlpha = .5;
      if(kind==='player'&&this.drawHeroAction133(ctx,entity,reducedMotion,compact)){ctx.restore();WorldVariants158?.drawPlayerGear(ctx,this,entity,{seed:visualSeed,compact});return true;}
      if(kind==='player'&&this.drawHandheld136(ctx,entity,reducedMotion,compact)){ctx.restore();WorldVariants158?.drawPlayerGear(ctx,this,entity,{seed:visualSeed,compact});return true;}
      if(kind==='player'&&this.drawUnarmed133(ctx,entity,reducedMotion,compact)){ctx.restore();WorldVariants158?.drawPlayerGear(ctx,this,entity,{seed:visualSeed,compact});return true;}
      if(kind==='player'&&this.drawLowFirearm137(ctx,entity,reducedMotion,compact)){ctx.restore();WorldVariants158?.drawPlayerGear(ctx,this,entity,{seed:visualSeed,compact});return true;}
      if(kind==='player'&&this.drawCommanderRig(ctx,entity,reducedMotion,compact)){ctx.restore();WorldVariants158?.drawPlayerGear(ctx,this,entity,{seed:visualSeed,compact});return true;}
      const actionPresentation=kind!=='player'?root.DEADWALL?.actorActionPresentation159?.(entity):null;
      if(kind!=='player'&&ActorActions159?.draw(ctx,this,entity,{kind,time,size,reducedMotion,moving,upright,presentation:actionPresentation})){ctx.restore();this.drawInfectedEquipment(ctx,{...entity,facing:actionPresentation?.facing??entity.facing},kind,compact);return true;}
      if(upright){if(Math.cos(entity.facing||0)<0)ctx.scale(-1,1);}
      else ctx.rotate(entity.facing || 0);
      if(kind==='player'&&this.images[atlas]){
        const pose=heroPose(entity,time,reducedMotion,previous.until>=time),rect=HERO_FRAMES[atlas][pose.row][pose.frame];
        const scale=.27*(compact?1.1:1),pivotX=128+pose.frame*256-rect[0],pivotY=HERO_PIVOT_Y[pose.row]-rect[1];
        this.blit(ctx,atlas,rect,-pivotX*scale,-pivotY*scale,rect[2]*scale,rect[3]*scale);
      }else if(!WorldVariants158?.drawActor(ctx,this,kind,entity.id,frame,size,{seed:visualSeed})) {
        const nominal=frameRect(spec[0],spec[1],frame),rect=actorFrameRect(spec[0],spec[1],frame);
        this.blit(ctx,spec[0],rect,(rect[0]-nominal[0])*size/nominal[2]-size/2,
          (rect[1]-nominal[1])*size/nominal[3]-size/2,rect[2]*size/nominal[2],rect[3]*size/nominal[3]);
      }
      ctx.restore();if(kind==='player')WorldVariants158?.drawPlayerGear(ctx,this,entity,{seed:visualSeed,compact});this.drawInfectedEquipment(ctx,entity,kind,compact); return true;
    }
    drawInfectedEquipment(ctx,entity,kind,compact){
      if(kind!=='shielded'&&kind!=='charger')return;
      ctx.save();ctx.translate(entity.x,entity.y);ctx.rotate(entity.facing||0);if(compact)ctx.scale(1.1,1.1);
      if(kind==='shielded'){
        ctx.fillStyle=entity.shieldImpact>0?'#bcc1b9':'#536169';ctx.strokeStyle='#a0aba9';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(13,-15);ctx.lineTo(20,-11);ctx.lineTo(20,11);ctx.lineTo(13,15);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#29373d';ctx.fillRect(15,-7,3,14);
      }else{
        const stage=entity.charge?.stage||'ready';ctx.strokeStyle=stage==='recover'?'#5c554e':'#cab6a0';ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(-8,-10);ctx.lineTo(8,-10);ctx.moveTo(-8,10);ctx.lineTo(8,10);ctx.stroke();
        if(stage==='windup'){ctx.strokeStyle='#c6a46e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(22,-7);ctx.lineTo(29,0);ctx.lineTo(22,7);ctx.stroke();}
        if(stage==='recover'){ctx.strokeStyle='#a89782';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(4,0);ctx.lineTo(-8,8);ctx.stroke();}
      }
      ctx.restore();
    }
    drawEffect(ctx, kind, x, y, size, phase = 0, alpha = 1, rotation = 0) {
      if (!this.images.effects) return false;
      const row = { muzzle: 0, spark: 0, dust: 1, fire: 2, smoke: 3 }[kind]; if (row === undefined) return false;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.globalCompositeOperation = 'screen';
      this.blit(ctx, 'effects', frameRect('effects', row, clamp(Math.floor(phase * 4), 0, 3), 4), -size / 2, -size / 2, size, size);
      ctx.restore(); return true;
    }
    drawTurret(ctx, building) {
      if(D17Art150?.drawGun(ctx,this,building))return true;
      const kind = building.type === 'heavyTurret' ? 'heavyTurret' : 'turret';
      const rect = this.rects['defenses:' + kind]; if (!rect) return false;
      const size = kind === 'heavyTurret' ? 66 : building.type === 'watchtower' ? 45 : 57;
      ctx.save();ctx.translate(building.x,building.y-3);ctx.rotate(building.turretAngle||0);
      this.blit(ctx,'defenses',rect,-size*.2,-size*.24,size,size*.48);
      if(building.flash>0)this.drawEffect(ctx,'muzzle',size*.78,0,24,.25,.9);
      ctx.restore();return true;
    }
  }
  // These buildings use the dedicated Canvas painters installed by the extension runtimes.
  // They have no atlas rectangle; the integration suite renders each painter in Chromium.
  const PROCEDURAL_BUILDINGS = Object.freeze({
    ...Object.fromEntries(Object.keys((typeof module!=='undefined'&&module.exports?require('./core.js'):globalThis.DeadwallCore)?.CityContent150?.BUILDINGS||{}).map(id=>[id,'CityContent150'])),
    ...Object.fromEntries(Object.keys((typeof module!=='undefined'&&module.exports?require('./core.js'):globalThis.DeadwallCore)?.Expeditions?.BUILDINGS||{}).map(id=>[id,'Expeditions'])),
    ...Object.fromEntries(Object.keys((typeof module!=='undefined'&&module.exports?require('./core.js'):globalThis.DeadwallCore)?.PowerGrid?.BUILDINGS||{}).map(id=>[id,'PowerGrid'])),
    ...Object.fromEntries(Object.keys((typeof module!=='undefined'&&module.exports?require('./core.js'):globalThis.DeadwallCore)?.Urban?.BUILDINGS||{}).map(id=>[id,'Urban'])),
    fieldKitchen:'FieldOperations', dressingWorkshop:'FieldOperations', recoveryBench:'FieldOperations', perimeterLight:'FieldOperations',
    sectorPost:'Territories', logisticsGarage:'Territories', fallbackRedoubt:'Territories',
    fireCistern:'Siege', fireStation:'Siege', fireScreen:'Siege', alarmTower:'Siege',
    planningOffice:'Dayworks', restShelter:'Dayworks', dayGreenhouse:'Dayworks', prefabYard:'Dayworks',
    receptionHall:'Citadel', radioRelay:'Citadel', roadDepot:'Infrastructure'
  });
  return { ASSETS, BUILDINGS, PROPS, DEFENSES, DISTRICT_PROPS, PROCEDURAL_BUILDINGS, ACTORS, HERO_STATES, HERO_FRAMES, HERO_PIVOT_Y, HERO_RIG, HERO_LOW137, HERO_ACTIONS133, HERO_ACTION_PIVOTS133, heroActionPose133, isolateHeroFrames133, heroRigPose, heroPose, reloadPose137, actorVariant, ACTOR_FRAME_CUTS154, actorFrameRect, frameRect, decodeMatte, tightRect, metricSceneryFrame202,metricVehicleSkin202,drawMetricScenery202,create: () => new Art() };
});
