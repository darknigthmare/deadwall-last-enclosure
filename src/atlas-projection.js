/* One coordinate contract for atlas, world-view, minimap and gateways. No save writes. */
(function(root){'use strict';const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.AtlasRules;
const Geo=()=>root.DeadwallGeography135||(typeof require==='function'?require('./geography135.js'):null);
function home(context){
 if(context?.home&&Number.isFinite(context.home.x))return context.home;
 const seed=context?.worldSeed??context?.world?.seed??context?.seed;
 const generation=context?.frontier?.position?.().generation??context?.frontier?.generation??context?.generation??3;
 if(generation>=6&&Number.isInteger(seed)){const geo=Geo();if(!geo)throw Error('Géographie régionale absente');return geo.home(seed,generation);}
 return{x:R.center,y:R.center,minX:R.homeMin,minY:R.homeMin,maxX:R.homeMax,maxY:R.homeMax,size:R.homeSize};
}
const finite=(x,y)=>Number.isFinite(x)&&Number.isFinite(y);
function toRegion(x,y,context){const h=home(context);if(!finite(x,y))throw Error('Coordonnées locales invalides');return{x:h.minX+x/R.unitsPerMetre,y:h.minY+y/R.unitsPerMetre};}
function toLocal(x,y,context){const h=home(context);if(!finite(x,y))throw Error('Coordonnées régionales invalides');return{x:(x-h.minX)*R.unitsPerMetre,y:(y-h.minY)*R.unitsPerMetre};}
function gatesFor(context){const h=home(context);return[{id:'east',name:'Est',x:h.maxX,y:h.y,localX:R.localUnits-R.entryInset,localY:R.localUnits/2},{id:'west',name:'Ouest',x:h.minX,y:h.y,localX:R.entryInset,localY:R.localUnits/2},{id:'north',name:'Nord',x:h.x,y:h.minY,localX:R.localUnits/2,localY:R.entryInset},{id:'south',name:'Sud',x:h.x,y:h.maxY,localX:R.localUnits/2,localY:R.localUnits-R.entryInset}];}
const gates=Object.freeze(gatesFor().map(Object.freeze));
function exitSide(p){const side=p.x>4040?'east':p.x<56?'west':p.y>4040?'south':p.y<56?'north':null;if(!side)return null;return((side==='east'||side==='west')?Math.abs(p.y-2048):Math.abs(p.x-2048))<=R.localRoadHalf?side:null;}
function exitPosition(p,side,context){const h=home(context),q=toRegion(p.x,p.y,context);if(side==='east')q.x=h.maxX+4;else if(side==='west')q.x=h.minX-4;else if(side==='north')q.y=h.minY-4;else if(side==='south')q.y=h.maxY+4;else throw Error('Jonction inconnue');return q;}
function entryTarget(p,context){if(p.z!==0)return null;const h=home(context);for(const gate of gatesFor(context)){const ew=gate.id==='east'||gate.id==='west',cross=ew?p.y:p.x,normal=ew?p.x:p.y,max=gate.id==='east'||gate.id==='south',edge=ew?(max?h.maxX:h.minX):(max?h.maxY:h.minY),center=ew?h.y:h.x;if(Math.abs(cross-center)>=R.gateHalf||!(normal>(max?edge-4:edge-1)&&normal<(max?edge+1:edge+4)))continue;const local=(cross-(ew?h.minY:h.minX))*R.unitsPerMetre;return{side:gate.id,x:ew?gate.localX:local,y:ew?local:gate.localY};}return null;}
function homeBarrier(x,y,context){const h=home(context);if(!(x>h.minX&&x<h.maxX&&y>h.minY&&y<h.maxY))return false;return !((Math.abs(y-h.y)<=3.1&&(x<h.minX+4||x>h.maxX-4))||(Math.abs(x-h.x)<=3.1&&(y<h.minY+4||y>h.maxY-4)));}
function footprint(b,context){const p=toRegion(b.left,b.top,context);return{id:b.id,type:b.type,x:p.x,y:p.y,w:b.w*C.TILE/R.unitsPerMetre,h:b.h*C.TILE/R.unitsPerMetre,rotation:b.rotation,complete:!!b.completed,progress:b.progress,health:b.health,maxHealth:b.maxHealth??b.def.health,name:b.def.name,gateMode:b.gateMode,powered:b.powered,underAttack:b.underAttack>0,source:b};}
function gateStatus(g){return gatesFor(g).map(q=>({...q,foot:g.friendlyPositionClear({radius:13},q.localX,q.localY),car:g.friendlyPositionClear({radius:C.Expeditions.RULES.carRadius},q.localX,q.localY)}));}
function playerPosition(g,f){return f.active?{x:f.x,y:f.y,z:f.z}: {...toRegion(g.player.x,g.player.y,g),z:0};}
function model(g){const h=home(g),buildings=[...g.world.buildings.values()].filter(b=>!b.dead&&b.health>0).map(b=>footprint(b,g)),core=g.core();return{seed:g.world.seed,layoutRevision:g.exploration125?.layoutRevision||1,features:g.exploration125?.generation===4?g.exploration125.plan:null,bounds:{x:h.minX,y:h.minY,w:h.size,h:h.size},buildings,gates:gateStatus(g),core:core?toRegion(core.x,core.y,g):{x:h.x,y:h.y},player:g.player.regionAbsent?null:toRegion(g.player.x,g.player.y,g),units:g.units.filter(u=>!u.dead&&u.health>0).map(u=>({id:u.id,kind:u.kind,...toRegion(u.x,u.y,g)})),housing:g.housing,population:g.population,score:g.tier?.name||'',phase:g.phase};}
function scaleBar(pxPerMetre,maxWidth=140){const limit=maxWidth/pxPerMetre,exp=Math.floor(Math.log10(limit)),base=10**exp;let metres=base;for(const n of [1,2,5,10])if(n*base<=limit)metres=n*base;return{metres,pixels:metres*pxPerMetre,label:metres>=1000?(metres/1000).toLocaleString('fr-FR')+' km':metres.toLocaleString('fr-FR')+' m'};}
function camera(width,height,span=R.regionSize){let x=span/2,y=span/2,zoom=R.regionSize/span,extent=span;const scale=()=>Math.min(width,height)/R.regionSize*zoom,clamp=v=>Math.max(0,Math.min(extent,v));return{
 get x(){return x},get y(){return y},get zoom(){return zoom},get width(){return width},get height(){return height},get scale(){return scale()},
 world(sx,sy){return{x:x+(sx-width/2)/scale(),y:y+(sy-height/2)/scale()}},screen(wx,wy){return{x:(wx-x)*scale()+width/2,y:(wy-y)*scale()+height/2}},
 resize(w,h){width=w;height=h},regionSize(size){if(Number.isFinite(size)&&size>=R.regionSize){extent=size;x=clamp(x);y=clamp(y);}return extent;},set(cx,cy,z=zoom){x=clamp(cx);y=clamp(cy);zoom=Math.max(R.minZoom*R.regionSize/extent,Math.min(R.maxZoom,z))},
 fit(cx,cy,metres){this.set(cx,cy,R.regionSize/metres)},pan(dx,dy){x=clamp(x-dx/scale());y=clamp(y-dy/scale())},
 zoomAt(factor,sx=width/2,sy=height/2){const p=this.world(sx,sy);zoom=Math.max(R.minZoom*R.regionSize/extent,Math.min(R.maxZoom,zoom*factor));x=clamp(p.x-(sx-width/2)/scale());y=clamp(p.y-(sy-height/2)/scale());return this.world(sx,sy)},
 bounds(){const a=this.world(0,0),b=this.world(width,height);return{left:a.x,top:a.y,right:b.x,bottom:b.y}},snapshot(){return{x,y,zoom,width,height,scale:scale()}}};}
const api=Object.freeze({RULES:R,home,gatesFor,toRegion,toLocal,gates,exitSide,exitPosition,entryTarget,homeBarrier,footprint,gateStatus,playerPosition,model,scaleBar,camera});root.DeadwallAtlasProjection=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
