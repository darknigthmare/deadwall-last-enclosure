/* Atlas et minicarte d'un monde sans bord (docs/GAME_BIBLE.md §7.13, specs/monde-sans-bord/ouverture.md, tranche O10 ;
   tasks.md, T6). Présentation seule, pour une campagne « Sans bord — expérimental » (génération 12) ; une campagne à région
   finie ne lit rien de ce module (aucune clé de sauvegarde, aucun tirage, aucun monde chargé).
   - Fenêtre glissante : l'atlas se cadre sur les cantons vus (registre `cantons` de la sortie), plus une marge, au plus
     `C.OpenAtlas217Rules.window.max` cantons de côté centrés sur le joueur ; la caméra se déplace sans butée fixe dans cette
     fenêtre, qui suit le joueur. Hors des cantons vus : brouillard.
   - Ce que peint l'atlas vient de ce que le jeu a déjà chargé : relevé du canton du commandant au moment où il y est (routes,
     eau, agglomérations) et lieux repérés de l'anneau voisin. Le relief d'un canton vu est lu par `levelAt` (fonction pure de la
     graine, identique aux paliers du canton) ; un canton vu mais pas encore relevé dans cette session (après une reprise) montre
     ses passages de couture reliés à son centre, en tirets (tracé approché). La peinture ne lit aucun canton du monde : ouvrir
     l'atlas ne change pas `streamStats` (E9).
   - Rayon d'action du véhicule : carburant du réservoir, du coffre et du sac, moins la réserve choisie, converti en mètres par le
     barème du véhicule (`travel131.fuelDistance`), puis divisé par le détour routier supposé ; ellipse « retour à D-17 ».
   - GPS au-delà de l'itinéraire borné du monde (`C.OpenAtlas217Rules.detailed`, 25 cantons) : graphe macro des coutures (passages routiers de `seam`, fonction pure
     de la graine), parcouru par A* dans un couloir borné, préparé par petites tranches à chaque lecture du guidage (jamais
     d'attente) ; le premier tronçon reste l'itinéraire détaillé du monde (`world.route`), la suite est un tracé approché.
   Aucun stock, dégât, tirage ni horloge : les mémoires de ce module ne servent qu'à l'affichage et se reconstruisent. */
(function(root,factory){
 const api=factory(root);
 root.DeadwallOpenWorld217Atlas=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document){try{api.install(root.DEADWALL,root.document);}catch(error){/* un affichage facultatif ne bloque jamais le jeu */}}
})(globalThis,function(root){
 'use strict';
 const node=typeof require==='function';
 const need=(name,file)=>root[name]||(node?require(file):null);
 const C=need('DeadwallCore','./core.js'),R=C.OpenAtlas217Rules;
 const K=()=>need('DeadwallWorldCantons217','./world-cantons217.js');
 const Gen=()=>need('DeadwallWorldCantonGen217','./world-canton-gen217.js');
 const P=()=>need('DeadwallAtlasProjection','./atlas-projection.js');
 const far=(dx,dy)=>Math.sqrt(dx*dx+dy*dy);
 const finite=(...a)=>a.every(Number.isFinite);
 const keep=(map,key,value,cap)=>{map.delete(key);map.set(key,value);while(map.size>cap)map.delete(map.keys().next().value);return value;};
 const km=m=>m>=1000?(m/1000).toLocaleString('fr-FR',{maximumFractionDigits:1})+' km':Math.round(m)+' m';
 // Mêmes teintes que la peinture du relief régional (openworld217.paint).
 const LEVEL=['#4d5d48','#5d6c4f','#6c7955','#7b865d','#8b9366','#9a9f70'],WATER_COLOR={1:'#3e5f6b',2:'#46697a',3:'#4f7686',4:'#5a8190'};
 const FOG='#16221b',FOG_LINE='rgba(150,160,130,.07)';

 // --- Mémoire d'affichage, par monde ------------------------------------------------------------
 const memories=new WeakMap();
 function memory(w){let m=memories.get(w);if(!m){m={summaries:new Map(),places:new Map(),plans:new Map(),route:null};memories.set(w,m);}return m;}
 // Relevé d'un canton chargé : ce que l'atlas en peint (aucun calcul de plus).
 function summarize(c){
  return Object.freeze({id:c.id,cx:c.cx,cy:c.cy,bounds:c.bounds,water:Uint8Array.from(c.water),
   roads:Object.freeze(c.roads.map(r=>Object.freeze({id:r.id,class:r.class,width:r.width,points:r.points}))),
   rivers:Object.freeze((c.rivers||[]).map(r=>Object.freeze({id:r.id,width:r.width,points:r.points}))),
   towns:Object.freeze((c.towns||[]).map(t=>Object.freeze({id:t.id,name:t.name,kind:t.kind,x:t.x,y:t.y})))});
 }
 const openWorld=g=>{const f=g?.frontier;if(!f?.position)return null;const p=f.position();if(p.generation!==12)return null;const w=f.world?.();return w?.unbounded?{f,p,w}:null;};
 // Appelé après chaque mise à jour du jeu, sortie en cours seulement : relève le canton où se tient le commandant (déjà chargé
 // par la boucle régionale) et au plus un lieu repéré de l'anneau voisin (préparé par l'anneau de chargement).
 function capture(g){
  const o=openWorld(g);if(!o||!o.p.active||!finite(o.p.x,o.p.y))return false;
  const k=K(),m=memory(o.w),c=k.at(o.p.x,o.p.y),id=k.id(c.cx,c.cy);let done=false;
  if(!m.summaries.has(id)){keep(m.summaries,id,summarize(o.w.canton(c.cx,c.cy)),R.summaries);done=true;}
  for(const sid of o.f.discoveries()){
   if(m.places.has(sid))continue;const q=k.parseEntity(sid);if(!q||q.kind!=='site'||Math.max(Math.abs(q.cx-c.cx),Math.abs(q.cy-c.cy))>1)continue;
   keep(m.places,sid,o.w.site(sid)||null,R.places);done=true;break;
  }
  return done;
 }

 // --- Fenêtre glissante -------------------------------------------------------------------------
 function cantonOf(x,y){const k=K();return finite(x,y)?k.at(x,y):null;}
 function slide(g,v){
  const k=K(),S=k.SIZE,M=R.window.margin,max=R.window.max,list=[];
  for(const id of v?.cantons||[]){const q=k.parse(id);if(q)list.push(q);}
  const pp=P().playerPosition(g,v),me=cantonOf(pp.x,pp.y),home=P().home(g),hc=cantonOf(home.x,home.y);
  for(const q of [me,hc])if(q)list.push(q);
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const q of list){x0=Math.min(x0,q.cx);y0=Math.min(y0,q.cy);x1=Math.max(x1,q.cx);y1=Math.max(y1,q.cy);}
  x0-=M;y0-=M;x1+=M;y1+=M;const centre=me||hc;
  if(x1-x0+1>max){x0=Math.min(Math.max(x0,centre.cx-((max-1)>>1)),x1-max+1);x1=x0+max-1;}
  if(y1-y0+1>max){y0=Math.min(Math.max(y0,centre.cy-((max-1)>>1)),y1-max+1);y1=y0+max-1;}
  const minX=x0*S,minY=y0*S,maxX=(x1+1)*S,maxY=(y1+1)*S;
  return Object.freeze({x0,y0,x1,y1,minX,minY,maxX,maxY,x:(minX+maxX)/2,y:(minY+maxY)/2,w:maxX-minX,h:maxY-minY,size:Math.max(maxX-minX,maxY-minY)});
 }
 const seenSet=v=>new Set(v?.cantons||[]);

 // --- Relief des cantons vus (fonction pure de la graine), mis en cache par graine -------------------
 const rasters=new Map();
 function levels(seed,cx,cy){
  const key=seed+':'+cx+':'+cy;if(rasters.has(key))return keep(rasters,key,rasters.get(key),R.summaries);
  const G=Gen(),N=G.CELLS,CELL=G.CELL,x0=cx*K().SIZE,y0=cy*K().SIZE,out=new Uint8Array(N*N);
  for(let i=0;i<N*N;i++)out[i]=G.levelAt(seed,x0+(i%N+.5)*CELL,y0+(Math.floor(i/N)+.5)*CELL);
  return keep(rasters,key,out,R.summaries);
 }
 // Image d'un canton (une case par pixel) quand le document sait en faire ; sinon, cases peintes une à une.
 const images=new Map();
 function image(doc,seed,cx,cy,summary){
  const key=seed+':'+cx+':'+cy+':'+(summary?'r':'m');if(images.has(key))return keep(images,key,images.get(key),R.summaries);
  const G=Gen(),N=G.CELLS,lv=levels(seed,cx,cy),colors=new Array(N*N);
  for(let i=0;i<N*N;i++){const w=summary?summary.water[i]:0;colors[i]=w?WATER_COLOR[w]||WATER_COLOR[1]:LEVEL[Math.max(0,Math.min(LEVEL.length-1,lv[i]))];}
  let canvas=null;
  try{canvas=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(N,N):doc?.createElement?.('canvas')||null;if(canvas){canvas.width=N;canvas.height=N;const x=canvas.getContext?.('2d');if(!x||typeof x.createImageData!=='function'||typeof x.putImageData!=='function')canvas=null;else{const d=x.createImageData(N,N);for(let i=0;i<N*N;i++){const h=colors[i];d.data[i*4]=parseInt(h.slice(1,3),16);d.data[i*4+1]=parseInt(h.slice(3,5),16);d.data[i*4+2]=parseInt(h.slice(5,7),16);d.data[i*4+3]=255;}x.putImageData(d,0,0);}}}catch{canvas=null;}
  return keep(images,key,{canvas,colors},R.summaries);
 }
 // Passages routiers des coutures d'un canton (fonction pure de la graine) : tracé approché d'un canton vu non relevé.
 const seams=new Map(),SEAM_CAP=16384;
 function seamsOf(seed,cx,cy){
  const key=seed+':'+cx+':'+cy;if(seams.has(key))return keep(seams,key,seams.get(key),SEAM_CAP);
  const k=K(),G=Gen(),out=[];for(const n of k.neighbours(cx,cy)){const s=G.seam(seed,cx,cy,n.side);if(s.road)out.push(Object.freeze({id:s.edge,side:n.side,x:s.road.x,y:s.road.y,class:s.road.class,width:s.road.width}));}
  return keep(seams,key,Object.freeze(out),SEAM_CAP);
 }
 const centreOf=(cx,cy)=>{const S=K().SIZE;return{x:(cx+.5)*S,y:(cy+.5)*S};};

 // --- Peinture de l'atlas (repère du monde ; `c` est déjà mis à l'échelle de la caméra) -----------
 // Cantons de la vue dans la fenêtre : vus (relief, eau relevée) ou brouillard. Rend la liste des cantons peints.
 function drawTerrain(c,g,v,cam,layers,win=slide(g,v)){
  const k=K(),S=k.SIZE,b=cam.bounds(),seed=v.world.seed,seen=seenSet(v),m=memory(v.world),doc=root.document;
  const x0=Math.max(win.x0,Math.floor(b.left/S)),x1=Math.min(win.x1,Math.floor(b.right/S)),y0=Math.max(win.y0,Math.floor(b.top/S)),y1=Math.min(win.y1,Math.floor(b.bottom/S));
  const out={seen:0,fog:0,pending:0};let budget=R.rasters;
  c.save();c.fillStyle=FOG;c.fillRect(win.minX,win.minY,win.w,win.h);
  for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
   const id=k.id(cx,cy),bx=cx*S,by=cy*S;
   if(!seen.has(id)){out.fog++;c.strokeStyle=FOG_LINE;c.lineWidth=Math.max(1/cam.scale,2);c.beginPath();for(let t=128;t<2*S;t+=128){c.moveTo(bx+Math.max(0,t-S),by+Math.min(S,t));c.lineTo(bx+Math.min(S,t),by+Math.max(0,t-S));}c.stroke();continue;}
   if(!layers?.terrain){c.fillStyle='#1e3426';c.fillRect(bx,by,S,S);out.seen++;continue;}
   const summary=m.summaries.get(id)||null,key=seed+':'+cx+':'+cy+':'+(summary?'r':'m');
   if(!images.has(key)&&budget--<=0){out.pending++;c.fillStyle='#34452f';c.fillRect(bx,by,S,S);continue;}
   const img=image(doc,seed,cx,cy,summary),CELL=Gen().CELL,N=Gen().CELLS;out.seen++;
   if(img.canvas&&typeof c.drawImage==='function'){const smooth=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(img.canvas,bx,by,S,S);c.imageSmoothingEnabled=smooth;}
   else for(let i=0;i<N*N;i++){c.fillStyle=img.colors[i];c.fillRect(bx+(i%N)*CELL,by+Math.floor(i/N)*CELL,CELL+.05,CELL+.05);}
  }
  // Grille des cantons et bord de la fenêtre (repères, pas des murs).
  c.strokeStyle='rgba(225,215,175,.12)';c.lineWidth=1/cam.scale;c.beginPath();
  for(let x=x0;x<=x1+1;x++){c.moveTo(x*S,Math.max(win.minY,b.top));c.lineTo(x*S,Math.min(win.maxY,b.bottom));}
  for(let y=y0;y<=y1+1;y++){c.moveTo(Math.max(win.minX,b.left),y*S);c.lineTo(Math.min(win.maxX,b.right),y*S);}c.stroke();
  c.strokeStyle='rgba(225,215,175,.35)';c.setLineDash?.([8/cam.scale,6/cam.scale]);c.strokeRect(win.minX,win.minY,win.w,win.h);c.setLineDash?.([]);
  c.restore();return out;
 }
 // Routes et rivières relevées des cantons vus, tracé approché (couture → centre) des cantons vus non relevés, allées des lieux.
 function drawRoads(c,g,v,cam,layers,win=slide(g,v)){
  const k=K(),S=k.SIZE,b=cam.bounds(),seen=seenSet(v),m=memory(v.world),roads=[],sketch=[],rivers=[];let exact=0,approx=0;
  for(const id of seen){const q=k.parse(id);if(!q||q.cx<win.x0||q.cx>win.x1||q.cy<win.y0||q.cy>win.y1)continue;const bx=q.cx*S,by=q.cy*S;if(bx>b.right||by>b.bottom||bx+S<b.left||by+S<b.top)continue;
   const s=m.summaries.get(id);
   if(s){exact++;for(const r of s.roads){const p=r.points;for(let i=1;i<p.length;i++)roads.push({id:r.id+':'+i,a:p[i-1],b:p[i],width:r.width});}for(const r of s.rivers)rivers.push(r);}
   else{approx++;const o=centreOf(q.cx,q.cy);for(const p of seamsOf(v.world.seed,q.cx,q.cy))sketch.push({a:p,b:o,width:p.width});}
  }
  c.save();c.lineCap='round';c.lineJoin='round';
  for(const r of rivers){c.strokeStyle='#4f7686';c.lineWidth=Math.max(r.width||4,1.2/cam.scale);c.beginPath();r.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
  c.restore();
  if(layers?.city)roads.push(...(root.DeadwallAtlasRender?.getApproaches?.(g)||[]));
  if(layers?.places&&cam.scale>.5)for(const p of seenPlaces(v)){const d=v.world.driveFor?.(p)||p.drive;if(d)roads.push(d);}
  if(roads.length){if(root.DeadwallRoadKit?.drawNetwork)root.DeadwallRoadKit.drawNetwork(c,roads,{view:{l:b.left,r:b.right,t:b.top,b:b.bottom},scale:cam.scale,minWidth:1,markings:false,shoulder:'#777e68',surface:'#9f9d80'});
   else{c.save();c.strokeStyle='#9f9d80';for(const r of roads){c.lineWidth=Math.max(r.width||4,1/cam.scale);c.beginPath();c.moveTo(r.a.x,r.a.y);c.lineTo(r.b.x,r.b.y);c.stroke();}c.restore();}}
  if(sketch.length){c.save();c.strokeStyle='rgba(190,186,150,.75)';c.lineWidth=Math.max(2,1.4/cam.scale);c.setLineDash?.([6/cam.scale,5/cam.scale]);c.beginPath();for(const r of sketch){c.moveTo(r.a.x,r.a.y);c.lineTo(r.b.x,r.b.y);}c.stroke();c.setLineDash?.([]);c.restore();}
  return{exact,approx,segments:roads.length,sketch:sketch.length};
 }
 // Lieux repérés relevés (lus quand leur canton était chargé), dans l'ordre du carnet.
 function seenPlaces(v){const m=memory(v.world),out=[];for(const id of v.seen||[]){const p=m.places.get(id);if(p)out.push(p);}return out;}
 function place(v,id){return memory(v.world).places.get(id)||null;}
 // Agglomérations des cantons vus relevés (une seule fois chacune).
 function towns(v){const m=memory(v.world),out=new Map();for(const id of seenSet(v)){const s=m.summaries.get(id);if(s)for(const t of s.towns)if(!out.has(t.id))out.set(t.id,t);}return[...out.values()];}

 // --- Milieu d'un point vu (fonction pure de la graine), sans lire le monde --------------------------
 let biomeDefs=null;
 function biome(v,x,y){
  if(!v?.world?.unbounded||!finite(x,y))return null;const k=K(),q=k.at(x,y);if(!seenSet(v).has(k.id(q.cx,q.cy)))return null;
  if(!biomeDefs)biomeDefs=new Map([...C.BiomeRules135.defs,...C.EcologyRules164.defs].map(d=>[d.id,d]));
  const d=biomeDefs.get(Gen().biomeAt(v.world.seed,x,y));return d?{id:d.id,name:d.name,surface:d.surface,palette:d.palette}:null;
 }
 function biomeText(v,x,y){if(!v||!finite(x,y))return '';const k=K(),q=k.at(x,y);if(!seenSet(v).has(k.id(q.cx,q.cy)))return 'brouillard · canton '+k.id(q.cx,q.cy)+' non parcouru';const b=biome(v,x,y);return b?b.name+' · canton '+k.id(q.cx,q.cy):'';}

 // --- Rayon d'action -----------------------------------------------------------------------------
 function range(g,v){
  const car=g.expeditions?.car?.(),profile=g.worldEvolution?.vehicleProfile?.(),rate=profile?.fuel??C.Frontier.RULES.fuelPerMetre;
  const food=Number(g.player?.carry?.food)||0;
  if(!car||car.health<=0||!(rate>0)||profile?.tank===0)return{vehicle:false,food,reason:car&&car.health<=0?'véhicule hors d’usage':!car?'aucun véhicule':'véhicule sans carburant'};
  const P0=P(),f=v||g.frontier?.overview?.(),pos=f?.car?{x:f.car.x,y:f.car.y}:car.regionAway?null:P0.toRegion(car.x,car.y,g);
  if(!pos||!finite(pos.x,pos.y))return{vehicle:false,food,reason:'véhicule introuvable'};
  const fuel=(Number(car.fuel)||0)+(f?.car||!f?.active?Number(car.cargo?.fuel)||0:0)+(Number(g.player?.carry?.fuel)||0);
  const reserve=Math.max(0,Number(g.fieldSupplies?.snapshot?.().reserve)||0),usable=Math.max(0,fuel-reserve);
  const metres=g.travel131?.fuelDistance?g.travel131.fuelDistance(usable,rate,car.id??null):usable/rate;
  const reach=Number.isFinite(metres)?metres/R.range.detour:0,home=P0.home(g),gap=far(home.x-pos.x,home.y-pos.y);
  return{vehicle:true,food,fuel,reserve,usable,rate,metres:Number.isFinite(metres)?metres:0,reach,x:pos.x,y:pos.y,home:{x:home.x,y:home.y},gap,back:reach>=gap};
 }
 function drawRange(c,g,v,cam){
  const r=range(g,v);if(!r.vehicle||!(r.reach>0))return r;c.save();
  c.strokeStyle='rgba(232,200,122,.85)';c.fillStyle='rgba(232,200,122,.05)';c.lineWidth=2/cam.scale;c.setLineDash?.([10/cam.scale,6/cam.scale]);
  c.beginPath();c.arc(r.x,r.y,r.reach,0,Math.PI*2);c.fill();c.stroke();c.setLineDash?.([]);
  // Ellipse « aller puis retour à D-17 » : foyers au véhicule et à la cité, somme des distances égale à la portée.
  if(r.back&&r.reach>r.gap+1){const a=r.reach/2,e=r.gap/2,bb=Math.sqrt(Math.max(0,a*a-e*e)),mx=(r.x+r.home.x)/2,my=(r.y+r.home.y)/2,rot=Math.atan2(r.home.y-r.y,r.home.x-r.x);
   c.strokeStyle='rgba(150,205,190,.85)';c.lineWidth=1.6/cam.scale;c.beginPath();if(typeof c.ellipse==='function')c.ellipse(mx,my,a,bb,rot,0,Math.PI*2);else c.arc(mx,my,bb,0,Math.PI*2);c.stroke();}
  c.restore();return r;
 }
 function rangeText(r){
  const food=r.food>0?' · vivres au sac : '+r.food.toFixed(1)+' (endurance, pas de portée)':'';
  if(!r.vehicle)return 'Rayon d’action : '+r.reason+' — à pied, sans limite de carburant'+food+'.';
  return 'Rayon d’action : '+km(r.reach)+' à vol d’oiseau ('+r.usable.toFixed(1)+' carburant'+(r.reserve?' hors réserve '+r.reserve:'')+', détour ×'+R.range.detour+')'+(r.back?' · retour à D-17 assuré dans l’ellipse':' · retour à D-17 hors de portée ('+km(r.gap)+')')+food+'.';
 }
 function rangeLabel(g,v,cam,label){
  const r=range(g,v);if(r.vehicle&&r.reach>0){const q=cam.screen(r.x,r.y-r.reach);label('Rayon d’action · '+km(r.reach),q.x,q.y+16,false,'#ecd08c');}return r;
 }
 function provenance(g,v,win=slide(g,v)){
  const h=P().home(g),n=(v.cantons||[]).length;
  return 'Graine '+v.world.seed+' · monde sans bord (G12, expérimental) · '+n+' canton'+(n>1?'s':'')+' vu'+(n>1?'s':'')+' · fenêtre '+(win.w/1000).toFixed(0)+' × '+(win.h/1000).toFixed(0)+' km · D-17 : '+(h.x/1000).toFixed(3)+' / '+(h.y/1000).toFixed(3)+' km. Brouillard hors des cantons parcourus ; tirets : tracé approché. '+rangeText(range(g,v));
 }

 // --- Minicarte : brouillard des cantons non vus, autonomie ------------------------------------------
 function drawMinimap(g){
  const o=openWorld(g);if(!o||!o.p.active||o.p.z!==0||o.p.inside)return null;
  const c=g.mctx,w=g.minimap?.width,h=g.minimap?.height;if(!c||!w||!h)return null;
  const v=g.frontier.overview(),k=K(),S=k.SIZE,span=320,s=w/span,l=v.x-span/2,t=v.y-h/s/2,r=v.x+span/2,b=v.y+h/s/2,seen=seenSet(v);let fog=0;
  c.save();c.translate(w/2,h/2);c.scale(s,s);c.translate(-v.x,-v.y);
  for(let cy=Math.floor(t/S);cy<=Math.floor(b/S);cy++)for(let cx=Math.floor(l/S);cx<=Math.floor(r/S);cx++){if(seen.has(k.id(cx,cy)))continue;fog++;const x0=Math.max(l,cx*S),y0=Math.max(t,cy*S),x1=Math.min(r,(cx+1)*S),y1=Math.min(b,(cy+1)*S);c.fillStyle='rgba(18,28,22,.55)';c.fillRect(x0,y0,x1-x0,y1-y0);}
  c.restore();
  const rr=range(g,v);if(rr.vehicle){const text='Autonomie '+km(rr.reach)+(rr.back?'':' · retour hors portée');c.save();c.font='9px sans-serif';const tw=Number(c.measureText?.(text)?.width)||110;c.fillStyle='rgba(17,31,23,.82)';c.fillRect(w-tw-10,h-29,tw+10,13);c.textAlign='right';c.fillStyle=rr.back?'#e7cf8f':'#e09c7c';c.fillText(text,w-5,h-19);c.restore();}
  return{fog,range:rr};
 }

 // --- GPS : graphe macro des coutures ---------------------------------------------------------------
 // Nœuds : passages routiers des coutures (identifiant de couture, partagé par ses deux cantons). Arêtes : d'un passage à un
 // autre passage d'un même canton par son centre (le carrefour n'est connu qu'en générant le canton). Coût en mètres, toujours
 // supérieur ou égal au vol d'oiseau : A* guidé par la distance à l'arrivée trouve le plus court chemin du graphe.
 function edgeCantons(id){const k=K(),e=k.parseEdge(id);return e.axis==='v'?[{cx:e.x-1,cy:e.y},{cx:e.x,cy:e.y}]:[{cx:e.x,cy:e.y-1},{cx:e.x,cy:e.y}];}
 function plan(seed,from,to){
  const k=K(),a=k.at(from.x,from.y),b=k.at(to.x,to.y),M=R.macro.margin;
  const box={x0:Math.min(a.cx,b.cx)-M,y0:Math.min(a.cy,b.cy)-M,x1:Math.max(a.cx,b.cx)+M,y1:Math.max(a.cy,b.cy)+M};
  const p={seed,from:{x:from.x,y:from.y},to:{x:to.x,y:to.y},start:a,end:b,box,status:'preparing',nodes:new Map(),heap:[],popped:0,evaluated:0,result:null};
  if(Math.max(Math.abs(a.cx-b.cx),Math.abs(a.cy-b.cy))>R.macro.maxSpan){p.status='too-far';return p;}
  const add=(id,x,y,g0,parent)=>{const n=p.nodes.get(id);if(n&&n.g<=g0)return;const h=far(to.x-x,to.y-y);p.nodes.set(id,{id,x,y,g:g0,f:g0+h,parent,done:false});push(p.heap,{id,f:g0+h,g:g0});};
  p.add=add;p.seeded=false;return p;
 }
 const less=(x,y)=>x.f<y.f||(x.f===y.f&&(x.g>y.g||(x.g===y.g&&x.id<y.id)));
 function push(h,item){let i=h.length;h.push(item);while(i){const j=(i-1)>>1;if(!less(item,h[j]))break;h[i]=h[j];i=j;}h[i]=item;}
 function pop(h){const first=h[0],last=h.pop();if(h.length){let i=0;while(i*2+1<h.length){let c=i*2+1;if(c+1<h.length&&less(h[c+1],h[c]))c++;if(!less(h[c],last))break;h[i]=h[c];i=c;}h[i]=last;}return first;}
 const inBox=(p,q)=>q.cx>=p.box.x0&&q.cx<=p.box.x1&&q.cy>=p.box.y0&&q.cy<=p.box.y1;
 // Avance la recherche d'au plus `R.macro.perCall` cantons évalués (chaque canton : quatre coutures lues une fois).
 function advance(p){
  if(p.status!=='preparing')return p;
  const cache=new Set(),evaluate=(cx,cy)=>{const key=cx+','+cy;if(!cache.has(key)&&!seams.has(p.seed+':'+cx+':'+cy)){cache.add(key);p.evaluated++;}return seamsOf(p.seed,cx,cy);};
  const S0=p.start,E=p.end,goal='@goal';let spent=0;
  if(!p.seeded){p.seeded=true;for(const s of evaluate(S0.cx,S0.cy)){const o=centreOf(S0.cx,S0.cy);p.add(s.id,s.x,s.y,far(o.x-p.from.x,o.y-p.from.y)+far(s.x-o.x,s.y-o.y),null);}spent++;}
  while(p.heap.length){
   if(spent>=R.macro.perCall)return p;
   const top=pop(p.heap),n=p.nodes.get(top.id);if(!n||n.done||top.g!==n.g)continue;n.done=true;p.popped++;
   if(n.id===goal){const path=[];for(let q=n;q;q=q.parent?p.nodes.get(q.parent):null)if(q.id!==goal)path.push({id:q.id,x:q.x,y:q.y});path.reverse();p.result={seams:path,metres:n.g};p.status='ready';return p;}
   if(p.popped>R.macro.maxNodes){p.status='none';return p;}
   for(const q of edgeCantons(n.id)){
    if(!inBox(p,q))continue;const o=centreOf(q.cx,q.cy),before=cache.size;const list=evaluate(q.cx,q.cy);if(cache.size>before)spent++;
    const via=n.g+far(o.x-n.x,o.y-n.y);
    if(q.cx===E.cx&&q.cy===E.cy)p.add(goal,p.to.x,p.to.y,via+far(p.to.x-o.x,p.to.y-o.y),n.id);
    for(const s of list)if(s.id!==n.id)p.add(s.id,s.x,s.y,via+far(s.x-o.x,s.y-o.y),n.id);
   }
  }
  p.status='none';return p;
 }
 // Plan préparé pour (graine, départ, arrivée) : réutilisé tant que le canton de départ et l'arrivée restent les mêmes, ou que
 // le joueur se tient dans un canton traversé par le plan (la suite du plan reste valable).
 function macroPlan(world,from,to){
  const k=K(),m=memory(world),c=k.at(from.x,from.y),key=Math.round(to.x*100)+','+Math.round(to.y*100);
  let p=m.plans.get(key);
  if(p&&p.status==='ready'){const ids=new Set();for(const s of p.result.seams)for(const q of edgeCantons(s.id))ids.add(q.cx+','+q.cy);if(!ids.has(c.cx+','+c.cy)&&!(p.start.cx===c.cx&&p.start.cy===c.cy))p=null;}
  else if(p&&(p.start.cx!==c.cx||p.start.cy!==c.cy))p=null;
  if(!p)p=keep(m.plans,key,plan(world.seed,from,to),R.macro.plans);else keep(m.plans,key,p,R.macro.plans);
  return advance(p);
 }
 // Itinéraire GPS au-delà de l'itinéraire borné du monde. Rend null si le monde sait déjà répondre (ou refuse pour une autre
 // raison qu'une distance trop grande), sinon un guidage : en préparation (cap direct, sans prétendre suivre les routes), ou
 // premier tronçon détaillé par `world.route` puis passages de couture jusqu'à l'arrivée (tracé approché).
 function guide(world,from,poi){
  if(!world?.unbounded||!from||!finite(from.x,from.y))return null;
  const drive=world.connectionFor?.(poi)||poi?.drive;if(!drive||!finite(drive.a?.x,drive.a?.y,drive.b?.x,drive.b?.y))return null;
  const k=K(),Rw=R.detailed,fits=(p,q)=>{const a=k.at(p.x,p.y),b=k.at(q.x,q.y);return(Math.abs(a.cx-b.cx)+1+2*Rw.margin)*(Math.abs(a.cy-b.cy)+1+2*Rw.margin)<=Rw.maxCantons;};
  if(fits(from,drive.a))return null;
  const p=macroPlan(world,from,drive.a),tail=far(drive.b.x-drive.a.x,drive.b.y-drive.a.y),straight=far(drive.b.x-from.x,drive.b.y-from.y);
  if(p.status==='preparing')return{path:[{x:from.x,y:from.y},{x:drive.b.x,y:drive.b.y}],metres:straight,roadMetres:0,connectorMetres:straight,macro:'preparing',note:'itinéraire en préparation',evaluated:p.evaluated};
  if(p.status!=='ready')return null;
  // Suite du plan depuis le canton du joueur : on saute les passages déjà franchis.
  let list=p.result.seams;const here=k.at(from.x,from.y);
  for(let i=list.length-1;i>=0;i--)if(edgeCantons(list[i].id).some(q=>q.cx===here.cx&&q.cy===here.cy)){list=list.slice(i);break;}
  // Premier tronçon détaillé par l'itinéraire borné du monde, jusqu'au dernier passage dont les deux cantons touchent le canton
  // du joueur (anneau déjà préparé par la boucle régionale : la recherche ne fait pas générer la région devant le joueur).
  const near=s=>edgeCantons(s.id).every(q=>Math.max(Math.abs(q.cx-here.cx),Math.abs(q.cy-here.cy))<=1);
  let j=-1;for(let i=0;i<list.length;i++)if(near(list[i])&&fits(from,list[i]))j=i;
  let head=null;for(let i=j;i>=Math.max(0,j-1)&&!head;i--){head=world.route(from,list[i]);if(head){j=i;}}
  const rest=head?list.slice(j+1):list,points=[...(head?head.path:[{x:from.x,y:from.y}]),...rest.map(s=>({x:s.x,y:s.y})),{x:drive.a.x,y:drive.a.y},{x:drive.b.x,y:drive.b.y}];
  let macro=0;const startAt=head?head.path.at(-1):from;let prev=startAt;for(const q of [...rest,drive.a]){macro+=far(q.x-prev.x,q.y-prev.y);prev=q;}
  const metres=(head?head.metres:0)+macro+tail;
  return{path:points,metres,roadMetres:head?head.roadMetres:0,connectorMetres:(head?head.connectorMetres:0)+tail,macro:'ready',note:'tracé approché au-delà de '+Rw.maxCantons+' cantons',seams:list.length,detailed:!!head,evaluated:p.evaluated};
 }

 // --- Installation (enveloppes de présentation) ----------------------------------------------------
 function install(g,doc=root.document){
  if(!g||g.openAtlas217)return g?.openAtlas217||null;
  const label=()=>doc?.getElementById?.('minimapWrap')?.querySelector?.('.minimap-label')||null;
  const original=label()?.textContent||'SECTEUR D-17';
  // Libellé de la minicarte au retour dans la cité : le GPS régional ne reste pas affiché sur la carte de la cité.
  const relabel=()=>{const o=openWorld(g);if(!o||o.p.active)return false;const l=label();if(l&&/^GPS/.test(l.textContent||'')){l.textContent=original;return true;}return false;};
  if(typeof g.update==='function'){const old=g.update;g.update=function(...a){const r=old.apply(this,a);try{capture(g);relabel();}catch(error){/* affichage seulement */}return r;};}
  if(typeof g.renderMinimap==='function'){const old=g.renderMinimap;g.renderMinimap=function(...a){const r=old.apply(this,a);try{if(!relabel())drawMinimap(g);}catch(error){/* affichage seulement */}return r;};}
  const api=Object.freeze({capture:()=>capture(g),window:v=>slide(g,v||g.frontier.overview()),range:v=>range(g,v||g.frontier.overview()),relabel,memory:()=>{const o=openWorld(g);if(!o)return null;const m=memory(o.w);return{summaries:[...m.summaries.keys()],places:[...m.places.keys()],plans:m.plans.size};}});
  g.openAtlas217=api;return api;
 }

 return Object.freeze({RULES:R,install,capture,summarize,window:slide,drawTerrain,drawRoads,seenPlaces,place,towns,biome,biomeText,range,rangeText,drawRange,rangeLabel,provenance,drawMinimap,levels,seamsOf,plan,advance,macroPlan,guide,memory});
});
