/* Native equipment parts and fallen bodies. Selection is presentation-only. */
(function(root,factory){'use strict';const api=factory();root.DeadwallEquipmentArt159=api;if(typeof module==='object'&&module.exports)module.exports=api;})(globalThis,function(){
'use strict';
const ASSETS=Object.freeze({
 art159EquipmentFirearmsA:Object.freeze({url:'assets/art159/equipment-firearms-a.png',width:1536,height:1024,matte:'none'}),
 art159EquipmentFirearmsB:Object.freeze({url:'assets/art159/equipment-firearms-b.png',width:1536,height:1024,matte:'none'}),
 art159EquipmentHeldA:Object.freeze({url:'assets/art159/equipment-held-a.png',width:1536,height:1024,matte:'none'}),
 art159EquipmentHeldB:Object.freeze({url:'assets/art159/equipment-held-b.png',width:1536,height:1024,matte:'none'}),
 art159EquipmentToolsA:Object.freeze({url:'assets/art159/equipment-tools-a.png',width:1536,height:1024,matte:'none'}),
 art159EquipmentToolsB:Object.freeze({url:'assets/art159/equipment-tools-b.png',width:1536,height:1024,matte:'none'}),
 art159Corpses:Object.freeze({url:'assets/art159/corpses.png',width:1536,height:1024,matte:'none'})
});
const CROPS=Object.freeze({
 "equipment-firearms-a.png":Object.freeze([[78,116,177,104],[390,122,139,98],[650,111,223,113],[948,118,271,103],[1273,109,210,131],[15,360,302,107],[322,372,285,76],[611,364,314,90],[929,374,303,78],[1249,355,263,121],[17,588,274,115],[302,587,299,99],[609,590,323,104],[937,603,298,74],[1240,596,285,89],[19,847,262,75],[291,825,314,99],[611,842,321,80],[937,840,295,87]].map(r=>Object.freeze(r))),
 "equipment-firearms-b.png":Object.freeze([[50,110,222,141],[386,118,148,122],[636,109,256,145],[944,111,276,139],[1278,103,221,163],[9,370,304,115],[317,389,285,83],[606,370,326,104],[935,382,290,88],[1246,370,272,134],[14,595,287,126],[308,598,295,101],[609,590,322,129],[936,616,295,87],[1235,617,291,85],[18,849,269,100],[311,829,295,107],[607,853,325,89],[935,851,302,93]].map(r=>Object.freeze(r))),
 "equipment-held-a.png":Object.freeze([[32,147,244,57],[376,148,155,51],[623,138,264,61],[928,140,296,63],[1249,139,258,74],[15,372,294,60],[320,374,280,67],[611,374,309,61],[930,377,292,57],[1248,367,267,69],[14,596,275,71],[305,598,298,67],[611,598,310,85],[930,607,294,61],[1237,608,286,58],[17,833,266,61],[301,818,293,78],[609,833,304,62],[930,836,300,54]].map(r=>Object.freeze(r))),
 "equipment-held-b.png":Object.freeze([[46,114,254,66],[399,121,164,57],[627,116,280,70],[942,119,277,58],[1244,111,256,78],[12,372,299,62],[336,369,268,73],[622,366,303,67],[941,376,284,60],[1243,372,266,66],[18,608,278,79],[309,610,299,67],[616,573,305,116],[936,624,286,52],[1238,622,281,52],[23,854,261,63],[307,834,301,78],[628,853,294,58],[931,852,287,63]].map(r=>Object.freeze(r))),
 "equipment-tools-a.png":Object.freeze([[15,156,240,81],[277,175,234,44],[532,151,227,90],[776,167,252,60],[1040,174,205,56],[1263,149,260,86],[10,485,260,64],[275,452,244,131],[531,495,218,90],[757,490,308,61],[1074,469,192,120],[1273,474,249,84],[20,768,220,120],[261,784,257,92],[527,734,226,194],[768,782,222,101],[999,782,271,69]].map(r=>Object.freeze(r))),
 "equipment-tools-b.png":Object.freeze([[7,199,250,79],[268,219,245,42],[526,194,228,91],[770,209,253,58],[1030,204,234,62],[1275,191,253,79],[6,475,258,67],[269,448,247,133],[526,485,239,88],[771,476,252,62],[1030,456,230,128],[1273,470,256,93],[8,744,236,133],[263,763,255,89],[526,700,216,223],[764,721,239,156],[1016,774,260,55]].map(r=>Object.freeze(r))),
 "corpses.png":Object.freeze([[61,44,335,172],[435,70,287,105],[791,44,338,162],[1184,82,292,108],[57,222,340,170],[436,245,293,123],[787,229,344,171],[1193,248,297,116],[61,404,342,183],[439,438,282,107],[788,415,344,173],[1181,437,298,124],[58,607,349,164],[436,634,292,109],[789,601,341,187],[1168,626,311,136],[55,796,337,190],[441,814,291,147],[782,807,351,167],[1186,834,289,116]].map(r=>Object.freeze(r)))
});
const FIREARMS=Object.freeze(["pistol","pocket","revolver","target","machinePistol","rifle","carbine","hunting","lever","smg","burst","marksman","support","shotgun","doubleBarrel","shortShotgun","slug","semiShotgun","singleShot"]);
const TOOLS=Object.freeze(["plank","pipe","bottleClub","spear","knife","bat","machete","maul","riotBaton","longSpear","hatchet","crowbar","hammer","shovel","pickaxe","assemblyHammer","wreckingBar"]);
const CORPSE_KINDS=Object.freeze(["walker","runner","armored","crawler","howler","breacher","stalker","bloated","shielded","charger"]);
// These lengths position illustrations in the established hand rig; they are
// neither weapon ranges nor collision dimensions.
const HELD_LENGTHS=Object.freeze({pistol:20,pocket:17,revolver:23,target:25,machinePistol:25,rifle:39,carbine:36,hunting:45,lever:38,smg:31,burst:37,marksman:45,support:46,shotgun:40,doubleBarrel:42,shortShotgun:32,slug:41,semiShotgun:42,singleShot:40,plank:35,pipe:36,bottleClub:35,spear:57,knife:21,bat:38,machete:34,maul:38,riotBaton:34,longSpear:64,hatchet:26,crowbar:38,hammer:26,shovel:42,pickaxe:34,assemblyHammer:36,wreckingBar:50});
const corpseSelections=new WeakMap();
// Source-space grip points are measured separately for asymmetric shafts and
// receivers. They attach the native component to the existing hand transform.
const HAND_ANCHORS=Object.freeze({
 "equipment-held-a.png":Object.freeze([[0.21,0.5],[0.21,0.5196],[0.21,0.5328],[0.21,0.5317],[0.21,0.4257],[0.36,0.5083],[0.36,0.4104],[0.36,0.4344],[0.36,0.3947],[0.36,0.4855],[0.36,0.5],[0.36,0.3955],[0.36,0.3118],[0.36,0.3361],[0.36,0.3707],[0.36,0.3525],[0.36,0.4295],[0.36,0.3306],[0.36,0.3426]].map(p=>Object.freeze(p))),
 "equipment-held-b.png":Object.freeze([[0.21,0.553],[0.21,0.5175],[0.21,0.5214],[0.21,0.5086],[0.21,0.4808],[0.36,0.4435],[0.36,0.4041],[0.36,0.3955],[0.36,0.3417],[0.36,0.4621],[0.36,0.462],[0.36,0.4552],[0.36,0.5905],[0.36,0.375],[0.36,0.4135],[0.36,0.373],[0.36,0.4423],[0.36,0.4224],[0.36,0.4048]].map(p=>Object.freeze(p))),
 "equipment-tools-a.png":Object.freeze([[0.18,0.4877],[0.18,0.5114],[0.18,0.5056],[0.18,0.525],[0.22,0.4732],[0.18,0.5291],[0.18,0.5859],[0.18,0.5153],[0.18,0.1833],[0.18,0.5164],[0.18,0.3792],[0.18,0.6488],[0.18,0.5458],[0.05,0.473],[0.18,0.5026],[0.18,0.4802],[0.18,0.6594]].map(p=>Object.freeze(p))),
 "equipment-tools-b.png":Object.freeze([[0.18,0.5506],[0.18,0.5119],[0.18,0.5],[0.18,0.5431],[0.22,0.5242],[0.18,0.4873],[0.18,0.5149],[0.18,0.4925],[0.18,0.1761],[0.18,0.5242],[0.18,0.3867],[0.18,0.4677],[0.18,0.5226],[0.05,0.343],[0.18,0.5045],[0.18,0.5994],[0.18,0.7364]].map(p=>Object.freeze(p)))
});
function hash(seed,identity,salt=''){
 let h=2166136261;const text=String(seed)+'|'+String(identity??'')+'|'+salt;
 for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
 return h>>>0;
}
function variantFor(seed,identity,variant,salt){
 return variant===0||variant===1?variant:hash(seed,identity,salt)%2;
}
function weaponSprite(id,{seed=0,identity=id,variant,held=false}={}){
 let index=FIREARMS.indexOf(id),file,atlas;const v=variantFor(seed,identity,variant,'equipment:'+id);
 if(index>=0){file='equipment-'+(held?'held':'firearms')+'-'+(v?'b':'a')+'.png';atlas=held?(v?'art159EquipmentHeldB':'art159EquipmentHeldA'):(v?'art159EquipmentFirearmsB':'art159EquipmentFirearmsA');}
 else {index=TOOLS.indexOf(id);if(index<0)return null;file='equipment-tools-'+(v?'b':'a')+'.png';atlas=v?'art159EquipmentToolsB':'art159EquipmentToolsA';}
 return Object.freeze({id,variant:v,atlas,rect:CROPS[file][index],anchor:held?HAND_ANCHORS[file][index]:null,length:HELD_LENGTHS[id],firearm:FIREARMS.includes(id)});
}
function ready(ctx,art,sprite){
 return !!(ctx&&sprite&&art?.images?.[sprite.atlas]&&typeof ctx.drawImage==='function');
}
function paint(ctx,art,sprite,x,y,w,h){
 if(art.blit)art.blit(ctx,sprite.atlas,sprite.rect,x,y,w,h);
 else ctx.drawImage(art.images[sprite.atlas],...sprite.rect,x,y,w,h);
}
function drawHeld(ctx,art,id,x=9,y=8,angle=0,opts={}){
 const sprite=weaponSprite(id,{...opts,held:true});
 if(!ready(ctx,art,sprite)||![x,y,angle,opts.alpha??1,opts.scale??1].every(Number.isFinite)||(opts.scale??1)<=0)return false;
 const length=sprite.length*(opts.scale??1),height=length*sprite.rect[3]/sprite.rect[2];
 // Place the actual hand on the grip or shaft. A long weapon extends behind
 // the hand; a blade, spear or muzzle extends in the direction of the aim.
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=Math.max(0,Math.min(1,opts.alpha??1));
 paint(ctx,art,sprite,-length*sprite.anchor[0],-height*sprite.anchor[1],length,height);ctx.restore();return true;
}
function drawIcon(ctx,art,id,x=0,y=0,w=96,h=64,opts={}){
 const sprite=weaponSprite(id,opts);
 if(!ready(ctx,art,sprite)||![x,y,w,h,opts.alpha??1].every(Number.isFinite)||w<=0||h<=0)return false;
 const scale=Math.min(w/sprite.rect[2],h/sprite.rect[3]),dw=sprite.rect[2]*scale,dh=sprite.rect[3]*scale;
 ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,opts.alpha??1));paint(ctx,art,sprite,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();return true;
}
function corpseSprite(c,{seed=0,variant}={}){
 const index=CORPSE_KINDS.indexOf(c?.kind);if(index<0)return null;
 const previous=corpseSelections.get(c);
 if(previous&&previous.seed===seed&&previous.variant===variant&&previous.kind===c.kind&&previous.id===c.id&&previous.x===c.x&&previous.y===c.y&&previous.rotation===c.rotation&&previous.scale===c.scale)return previous.sprite;
 const identity=c.id??[c.kind,c.x,c.y,c.rotation,c.scale].join(':');
 const v=variantFor(seed,identity,variant,'corpse');
 const sprite=Object.freeze({id:c.kind,variant:v,atlas:'art159Corpses',rect:CROPS['corpses.png'][index*2+v]});
 corpseSelections.set(c,{seed,variant,kind:c.kind,id:c.id,x:c.x,y:c.y,rotation:c.rotation,scale:c.scale,sprite});return sprite;
}
function drawCorpse(ctx,art,c,opts={}){
 const sprite=corpseSprite(c,opts);
 if(!ready(ctx,art,sprite)||![c.x,c.y,c.rotation,c.scale,c.age].every(Number.isFinite)||c.scale<=0||c.age<0||c.alive===true||c.dead===false)return false;
 // Reuse the owner's historical lifetime and opacity. Nothing is advanced
 // by painting, so pause and repeated draws preserve the same fallen pose.
 const alpha=Math.max(0,Math.min(.65,1-Math.max(0,c.age-70)/25));
 const length=(c.kind==='bloated'?38:['armored','breacher','shielded'].includes(c.kind)?35:32)*c.scale;
 const height=length*sprite.rect[3]/sprite.rect[2];
 ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rotation);ctx.globalAlpha=alpha;
 paint(ctx,art,sprite,-length/2,-height/2,length,height);ctx.restore();return true;
}
return Object.freeze({ASSETS,CROPS,HAND_ANCHORS,FIREARMS,TOOLS,CORPSE_KINDS,HELD_LENGTHS,hash,weaponSprite,corpseSprite,drawHeld,drawIcon,drawCorpse});
});

