// Pyramides de corps visibles (docs/GAME_BIBLE.md §7.5, §8.1 « Gérer le terrain », §8.6).
// Présentation seulement : ce module lit la charge de corps de chaque mur et la règle de franchissement.
// Il ne crée ni corps, ni dégât, ni tirage, ni horloge, et ne modifie aucune sauvegarde.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallCorpseHeaps217=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{try{if(root.DEADWALL)api.install(root.DEADWALL,root.document);}catch(error){/* un affichage facultatif ne bloque jamais le jeu */}},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const lib=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const SIDES=Object.freeze(['north','east','south','west']);
 const LABELS=Object.freeze({north:'nord',east:'est',south:'sud',west:'ouest'});
 const WHERE=Object.freeze({north:'au nord',east:'à l’est',south:'au sud',west:'à l’ouest'});
 const STATES=Object.freeze(['faible','haut','imminent','franchi']);
 // Bornes de lecture, en part du seuil. Ce sont des paliers d'affichage, pas des règles.
 const HIGH=.5,IMMINENT=.85;
 // Plafonds de dessin : le coût reste borné quel que soit le nombre de murs chargés.
 const CAP=600,CAP_LOW=240,SLOTS=24,CREST=8,REFRESH_SECONDS=.5,MARGIN=44;
 // Réserve d'images : nombre d'amas gardés en mémoire et de redessins accordés par image.
 const limits=Object.freeze({cap:CAP,capLow:CAP_LOW,high:HIGH,imminent:IMMINENT,slots:SLOTS,crest:CREST,sprites:420,redraws:28});
 // Infecté de référence : le premier à franchir (identifiant 0, Infecté récent). La question est posée au jeu.
 const PROBE=Object.freeze({id:0,kind:'runner'});
 const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
 // Seuils lus dans les règles d'entretien de la ligne (`rampMin`, `rampMax`), déjà partagées par
 // `linecare.js` et `coordination.js`. Le test du module vérifie leur accord avec `zombieCanClimb`.
 function thresholds(){
  const R=lib('DeadwallCore','./core.js')?.LINECARE_RULES;
  const first=Number(R?.rampMin),all=Number(R?.rampMax);
  return first>0&&all>=first?{first,all}:null;
 }
 function stateOf(ratio,crossed){return crossed?'franchi':ratio>=IMMINENT?'imminent':ratio>=HIGH?'haut':'faible';}
 // Le jeu dit lui-même si l'amas se franchit : la borne stricte de la règle n'est pas recopiée ici.
 function crossable(g,wall,load,limit){
  if(typeof g.zombieCanClimb!=='function')return load>limit.first;
  return !!g.zombieCanClimb(PROBE,wall);
 }
 // Un rempart de citadelle ne se franchit jamais au sol : son amas appartient au siège vertical.
 function groundWall(g,wall){
  if(typeof g.zombieCanClimb!=='function')return true;
  return !!g.zombieCanClimb(PROBE,Object.create(wall,{corpseLoad:{value:Infinity}}));
 }
 // Lecture pure : un relevé par mur ou porte en service portant des corps, du plus haut au plus bas.
 function heaps(g,view){
  const limit=thresholds(),world=g?.world?.buildings;if(!limit||!world||typeof world.values!=='function')return [];
  const T=lib('DeadwallTactics','./tactics.js'),B=lib('DeadwallBattlefield','./battlefield.js');
  let core=null;try{core=typeof g.core==='function'?g.core():null;}catch(error){core=null;}
  if(!core||!T||!B)return [];
  const list=[];
  for(const wall of world.values()){
   const load=Number(wall?.corpseLoad);
   if(!(load>0)||!wall.def?.wall||!T.operational(wall))continue;
   if(view&&(wall.right+MARGIN<view.left||wall.left-MARGIN>view.right||wall.bottom+MARGIN<view.top||wall.top-MARGIN>view.bottom))continue;
   if(!groundWall(g,wall))continue;
   const ratio=load/limit.first,crossed=crossable(g,wall,load,limit);
   // Part des Infectés récents et Rampants qui passent déjà : leur seuil s'étale de `first` à `all`.
   const span=limit.all-limit.first+1,share=crossed?clamp(Math.ceil(load-limit.first)/span,1/span,1):0;
   list.push(Object.freeze({id:wall.id,type:wall.type,gate:!!wall.def.gate,load,threshold:limit.first,fullThreshold:limit.all,ratio,share,
    side:B.direction(core,wall),state:stateOf(ratio,crossed),left:wall.left,top:wall.top,right:wall.right,bottom:wall.bottom}));
  }
  return list.sort((a,b)=>b.ratio-a.ratio||a.id-b.id);
 }
 // Amas le plus haut de chaque côté de la cité.
 function summary(g,list){
  const result={north:null,east:null,south:null,west:null};
  for(const heap of list||heaps(g))if(!result[heap.side])result[heap.side]=heap;
  return result;
 }
 const percent=ratio=>Math.floor(ratio*100+1e-9);
 const decimal=value=>String(Math.round(value*10)/10).replace('.',',');
 // Ce que fait un ouvrier en déblaiement, à la cadence des règles du jeu.
 function clearing(heap){
  const rate=Number(lib('DeadwallCore','./core.js')?.WORKER_RULES?.cleanupPerSecond);if(!(rate>0))return null;
  return Object.freeze({rate,seconds:heap?Math.ceil(heap.load/rate):0,safeSeconds:heap?Math.max(0,Math.ceil((heap.load-heap.threshold*IMMINENT)/rate)):0});
 }
 function sentence(heap){
  if(!heap||(heap.state!=='imminent'&&heap.state!=='franchi'))return '';
  return heap.state==='franchi'?'Amas '+WHERE[heap.side]+' : rampe formée, les infectés agiles peuvent franchir le mur.':'Amas '+WHERE[heap.side]+' : franchissement imminent.';
 }
 // Hachage entier déterministe : identifiant du mur, index du corps, sel.
 function hash(id,index,salt){
  let h=Math.imul((id|0)+1,0x9e3779b1)^0x5bd1e995;
  h=Math.imul(h^(index+1),0x85ebca6b);h^=h>>>13;
  h=Math.imul(h^(salt*31+7),0xc2b2ae35);h^=h>>>16;
  h=Math.imul(h,0x27d4eb2f);h^=h>>>15;
  return (h>>>0)/4294967296;
 }
 function budgetFor(g,wanted){
  const cap=g?.settings?.quality==='low'?CAP_LOW:CAP;
  return Number.isFinite(wanted)?clamp(Math.floor(wanted),0,cap):cap;
 }
 // Corps posés au pied du mur et corps couchés sur sa crête, pour une largeur d'une case.
 function wanted(heap){
  const r=heap.ratio;
  if(heap.state==='faible')return {ground:1+Math.floor(r/HIGH*4),crest:0};
  if(heap.state==='haut')return {ground:6+Math.floor((r-HIGH)/(IMMINENT-HIGH)*6),crest:0};
  if(heap.state==='imminent')return {ground:14+Math.min(4,Math.floor((r-IMMINENT)/(1-IMMINENT)*5)),crest:3};
  return {ground:Math.min(SLOTS,20+Math.floor((r-1)*6)),crest:Math.min(CREST,6+Math.floor((r-1)*3))};
 }
 // Face extérieure : origine, tangente, normale sortante, largeur de face et épaisseur du mur.
 function face(heap){
  const w=heap.right-heap.left,h=heap.bottom-heap.top;
  if(heap.side==='north')return {ox:heap.left,oy:heap.top,tx:1,ty:0,nx:0,ny:-1,width:w,depth:h};
  if(heap.side==='south')return {ox:heap.left,oy:heap.bottom,tx:1,ty:0,nx:0,ny:1,width:w,depth:h};
  if(heap.side==='west')return {ox:heap.left,oy:heap.top,tx:0,ty:1,nx:-1,ny:0,width:h,depth:w};
  return {ox:heap.right,oy:heap.top,tx:0,ty:1,nx:1,ny:0,width:h,depth:w};
 }
 // Emprise du talus vers l'extérieur, en unités du monde : elle suit le rapport charge/seuil.
 function reach(heap){return 8+22*Math.min(1,heap.ratio)+(heap.state==='franchi'?Math.min(8,(heap.ratio-1)*8):0);}
 // Plan d'une image : murs visibles, corps accordés à chacun sous le plafond global.
 function plan(g,options={}){
  const list=options.heaps||heaps(g,options.view),budget=budgetFor(g,options.budget),tile=Number(lib('DeadwallCore','./core.js')?.TILE)||32;
  const items=[];let asked=0;
  for(const heap of list){
   const f=face(heap),unit=Math.max(1,f.width/tile),need=wanted(heap);
   const item={heap,face:f,unit,ground:Math.round(need.ground*unit),crest:Math.round(need.crest*unit),reach:Math.round(reach(heap)/2)*2};
   asked+=item.ground+item.crest;items.push(item);
  }
  // Éclaircissement par paliers au-delà du plafond : un palier fixe évite de redessiner tous les amas dès
  // qu'un seul change. Les amas les plus hauts sont servis d'abord ; l'arrêt net reste la garantie.
  let scale=1;while(asked*scale>budget&&scale>1e-6)scale*=.75;
  let bodies=0;
  for(const item of items){
   const ground=scale<1?Math.max(1,Math.round(item.ground*scale)):item.ground,crest=scale<1&&item.crest?Math.max(1,Math.round(item.crest*scale)):item.crest;
   item.ground=Math.min(ground,Math.max(0,budget-bodies));bodies+=item.ground;
   item.crest=Math.min(crest,Math.max(0,budget-bodies));bodies+=item.crest;
  }
  return {items,bodies,budget};
 }
 // Emplacements fixes : un corps ne change jamais de place, l'amas s'étend à mesure que la charge monte.
 function groundBody(item,index){
  const {heap,face:f,unit}=item,id=heap.id,step=index/unit,extent=7+25*Math.min(1,step/(SLOTS-1));
  const along=hash(id,index,0)*(f.width+8)-4,out=2.5+extent*Math.pow(hash(id,index,1),1.5);
  const layer=step>=12&&out<12?2:step>=5&&out<19?1:0;
  // Près du mur les corps s'alignent contre lui ; plus loin ils tombent en tous sens.
  const lean=out<9?(hash(id,index,2)-.5)*.9:(hash(id,index,2)-.5)*Math.PI;
  return {x:f.ox+f.tx*along+f.nx*out,y:f.oy+f.ty*along+f.ny*out,angle:Math.atan2(f.ty,f.tx)+lean,scale:.88+hash(id,index,3)*.24,layer,tint:hash(id,index,4)<.34?1:0,bend:hash(id,index,5)-.5};
 }
 function crestBody(item,index){
  const {heap,face:f}=item,id=heap.id,crossed=heap.state==='franchi';
  const along=4+hash(id,index,6)*Math.max(1,f.width-8),inward=crossed?6+hash(id,index,7)*Math.max(1,f.depth-24):-4+hash(id,index,7)*8;
  // Corps couchés en travers du mur, tête vers l'intérieur ou vers l'extérieur.
  return {x:f.ox+f.tx*along-f.nx*inward,y:f.oy+f.ty*along-f.ny*inward,angle:Math.atan2(f.ny,f.nx)+(hash(id,index,12)<.5?Math.PI:0)+(hash(id,index,8)-.5)*.7,scale:.84+hash(id,index,9)*.2,layer:2,tint:hash(id,index,10)<.34?1:0,bend:hash(id,index,11)-.5};
 }
 // Teintes éteintes de la palette : bruns de terre et gris-verts des infectés. Le dessus de l'amas est plus
 // clair que sa base : c'est ce dégradé, avec l'emprise, qui donne la hauteur en vue de dessus.
 const FILLS=Object.freeze([['#5a4a3a','#50544a'],['#74614d','#666b56'],['#8f7b65','#7c8169']]);
 const OUTLINE='rgba(12,9,8,.82)';
 // Corps allongé : tronc, tête, deux jambes et un bras. Trois passes pleines par couche, sans contour tracé.
 function drawBodies(ctx,bodies,detail){
  if(!bodies.length)return;
  for(let layer=0;layer<3;layer++){
   // Dessous sombre commun à la couche : il détache chaque corps de ceux qu'il recouvre.
   ctx.beginPath();let any=false;
   for(const b of bodies){
    if(b.layer!==layer)continue;any=true;
    const c=Math.cos(b.angle),s=Math.sin(b.angle),r=b.scale;
    ctx.moveTo(b.x+c*8*r,b.y+s*8*r);ctx.ellipse(b.x,b.y,8*r,4.2*r,b.angle,0,Math.PI*2);
    const hx=b.x+c*8.6*r,hy=b.y+s*8.6*r;ctx.moveTo(hx+3.9*r,hy);ctx.arc(hx,hy,3.9*r,0,Math.PI*2);
   }
   if(!any)continue;
   ctx.fillStyle=OUTLINE;ctx.fill();
   for(let tint=0;tint<2;tint++){
    if(detail){
     ctx.beginPath();any=false;
     for(const b of bodies){
      if(b.layer!==layer||b.tint!==tint)continue;any=true;
      const c=Math.cos(b.angle),s=Math.sin(b.angle),r=b.scale,px=-s,py=c,side=b.bend>=0?1:-1;
      const at=(along,across)=>[b.x+(c*along+px*across)*r,b.y+(s*along+py*across)*r];
      // Une jambe tendue, une jambe repliée, un bras le long du corps ou jeté vers la tête.
      let q=at(-5.6,1.4*side);ctx.moveTo(q[0],q[1]);q=at(-14.6,(2+b.bend*1.6)*side);ctx.lineTo(q[0],q[1]);
      q=at(-5.6,-1.4*side);ctx.moveTo(q[0],q[1]);q=at(-10.4,-(4.4+b.bend*1.2)*side);ctx.lineTo(q[0],q[1]);q=at(-13.4,-(1.6-b.bend)*side);ctx.lineTo(q[0],q[1]);
      q=at(4.6,2.4*side);ctx.moveTo(q[0],q[1]);q=at(2.2-b.bend*9,6.4*side);ctx.lineTo(q[0],q[1]);
     }
     if(any){ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=3.8;ctx.strokeStyle=OUTLINE;ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle=FILLS[layer][tint];ctx.stroke();}
    }
    ctx.beginPath();any=false;
    for(const b of bodies){
     if(b.layer!==layer||b.tint!==tint)continue;any=true;
     const c=Math.cos(b.angle),s=Math.sin(b.angle),r=b.scale;
     ctx.moveTo(b.x+c*7*r,b.y+s*7*r);ctx.ellipse(b.x,b.y,7*r,3.1*r,b.angle,0,Math.PI*2);
     const hx=b.x+c*8.6*r,hy=b.y+s*8.6*r;ctx.moveTo(hx+2.9*r,hy);ctx.arc(hx,hy,2.9*r,0,Math.PI*2);
    }
    if(any){ctx.fillStyle=FILLS[layer][tint];ctx.fill();}
   }
  }
 }
 // Contour du talus : une bande appuyée sur toute la face, d'emprise `out`, au bord extérieur irrégulier.
 // Deux murs voisins de même charge se rejoignent en un talus continu.
 function mound(ctx,f,out,id){
  const point=(along,depth)=>[f.ox+f.tx*along+f.nx*depth,f.oy+f.ty*along+f.ny*depth];
  const steps=Math.max(2,Math.round(f.width/16));
  let p=point(-1,0);ctx.moveTo(p[0],p[1]);
  for(let i=0;i<=steps;i++){p=point(-1+(f.width+2)*i/steps,out*(.86+.28*hash(id,i,12)));ctx.lineTo(p[0],p[1]);}
  p=point(f.width+1,0);ctx.lineTo(p[0],p[1]);ctx.closePath();
 }
 const detailed=g=>g?.settings?.quality!=='low'&&(Number(g?.camera?.zoom)||1)>=.55;
 // Amas d'un mur, en coordonnées du monde : talus puis corps au sol. Chemins courts, propres à ce mur.
 function drawHeap(ctx,item,detail){
  const f=item.face,id=item.heap.id;
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  if(item.heap.ratio>=HIGH){ctx.beginPath();mound(ctx,f,item.reach,id);ctx.fillStyle='rgba(30,21,17,.6)';ctx.fill();}
  if(item.heap.ratio>=IMMINENT){ctx.beginPath();mound(ctx,f,item.reach*.5,id);ctx.fillStyle='rgba(12,8,7,.55)';ctx.fill();}
  const bodies=[];for(let i=0;i<item.ground;i++)bodies.push(groundBody(item,i));
  drawBodies(ctx,bodies,detail);
 }
 // Crête : les corps atteignent le sommet du mur (imminent), puis le recouvrent sur toute son épaisseur (franchi).
 function drawCrest(ctx,item,detail){
  const f=item.face,span=item.heap.state==='franchi'?f.depth:f.depth*.4;
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  const x=f.ox-(f.nx>0?span:0),y=f.oy-(f.ny>0?span:0);
  ctx.fillStyle='rgba(20,14,12,.5)';ctx.fillRect(x,y,f.tx?f.width:span,f.ty?f.width:span);
  const bodies=[];for(let i=0;i<item.crest;i++)bodies.push(crestBody(item,i));
  drawBodies(ctx,bodies,detail);
 }
 const crested=item=>item.heap.state==='imminent'||item.heap.state==='franchi';
 // Cadre d'un amas (sol) ou d'une crête, en unités du monde : tout ce que le dessin peut toucher.
 function bounds(item,part){
  const f=item.face,lo=part==='crest'?-f.depth-4:-18,hi=part==='crest'?26:58;
  const x1=f.ox-f.tx*22+f.nx*lo,y1=f.oy-f.ty*22+f.ny*lo,x2=f.ox+f.tx*(f.width+22)+f.nx*hi,y2=f.oy+f.ty*(f.width+22)+f.ny*hi;
  return {x:Math.floor(Math.min(x1,x2)),y:Math.floor(Math.min(y1,y2)),w:Math.ceil(Math.abs(x2-x1))+1,h:Math.ceil(Math.abs(y2-y1))+1};
 }
 function canvasFactory(){
  if(typeof root.OffscreenCanvas==='function')return (w,h)=>new root.OffscreenCanvas(w,h);
  const doc=root.document;if(!doc||typeof doc.createElement!=='function')return null;
  return (w,h)=>{const canvas=doc.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;};
 }
 // Réserve d'images : chaque amas n'est redessiné que lorsque sa lecture change (nombre de corps, palier,
 // emprise). Une image ordinaire ne coûte alors qu'une copie par mur visible. Sans toile hors écran, ou au
 // premier échec, le dessin direct prend le relais.
 function createStore(factory){
  const cache=new Map();let fresh=0,make=typeof factory==='function'?factory:null;
  function draw(ctx,item,part,detail,scale){
   if(!make||typeof ctx.drawImage!=='function')return null;
   const h=item.heap,f=item.face,key=h.id+':'+part,sig=[h.side,h.state,part==='crest'?item.crest:item.ground,item.reach,detail?1:0,scale,f.ox,f.oy,f.width,f.depth].join('|');
   let entry=cache.get(key);
   try{
    if(!entry||entry.sig!==sig){
     // Budget de redessins par image : au-delà, l'image précédente sert encore, ou l'amas attend l'image suivante.
     if(fresh>=limits.redraws){if(!entry)return false;}
     else{
      const box=bounds(item,part),canvas=make(box.w*scale,box.h*scale),c=canvas?.getContext?.('2d');
      if(!c||typeof c.ellipse!=='function'||typeof c.setTransform!=='function'){make=null;return null;}
      c.setTransform(scale,0,0,scale,-box.x*scale,-box.y*scale);
      if(part==='crest')drawCrest(c,item,detail);else drawHeap(c,item,detail);
      entry={sig,canvas,box};cache.set(key,entry);fresh++;
     }
    }
    ctx.drawImage(entry.canvas,entry.box.x,entry.box.y,entry.box.w,entry.box.h);return true;
   }catch(error){make=null;cache.clear();return null;}
  }
  return {draw,begin(){fresh=0;if(cache.size>limits.sprites)cache.clear();},clear(){cache.clear();},size:()=>cache.size,active:()=>!!make};
 }
 const spriteScale=g=>g?.settings?.quality==='low'?1:(Number(g?.camera?.zoom)||1)*(Number(g?.dpr)||1)>1.15?2:1;
 function drawPart(ctx,item,part,g,store){
  const detail=detailed(g),done=store?store.draw(ctx,item,part,detail,spriteScale(g)):null;
  if(done!==null)return done;
  ctx.save();try{if(part==='crest')drawCrest(ctx,item,detail);else drawHeap(ctx,item,detail);}finally{ctx.restore();}
  return true;
 }
 const ALERT=Object.freeze({imminent:'226,178,84',franchi:'222,96,72'});
 // Bande pleine le long de la face extérieure, de `from` à `from + thick` vers l'intérieur du mur.
 function band(ctx,f,from,thick){
  const x1=f.ox-f.nx*from,y1=f.oy-f.ny*from,x2=f.ox+f.tx*f.width-f.nx*(from+thick),y2=f.oy+f.ty*f.width-f.ny*(from+thick);
  ctx.fillRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));
 }
 // Signal sobre, au-dessus du voile de nuit : liseré sur la face menacée, chevrons vers l'intérieur une fois franchie.
 function drawSignals(ctx,frame,g){
  if(!frame)return 0;
  const still=!!g?.settings?.reducedMotion,time=Number(g?.elapsed)||0;
  // Respiration lente lue dans le temps de jeu ; figée en animations réduites.
  const pulse=(still?.92:.8+.18*Math.sin(time*2.4)).toFixed(3);let drawn=0;
  ctx.save();
  try{
   ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.lineCap='butt';ctx.lineJoin='miter';
   ctx.fillStyle='rgba(10,8,7,.72)';
   for(const item of frame.items)if(crested(item)){band(ctx,item.face,-1.5,6);drawn++;}
   if(!drawn)return 0;
   for(const state of ['imminent','franchi']){
    ctx.fillStyle='rgba('+ALERT[state]+','+pulse+')';
    for(const item of frame.items)if(item.heap.state===state)band(ctx,item.face,0,3);
   }
   for(const item of frame.items){
    if(item.heap.state!=='franchi')continue;
    const f=item.face,ix=-f.nx,iy=-f.ny;ctx.beginPath();
    for(let a=16;a<f.width;a+=32){
     const cx=f.ox+f.tx*a,cy=f.oy+f.ty*a;
     ctx.moveTo(cx-f.tx*6+ix*f.depth*.3,cy-f.ty*6+iy*f.depth*.3);ctx.lineTo(cx+ix*f.depth*.72,cy+iy*f.depth*.72);ctx.lineTo(cx+f.tx*6+ix*f.depth*.3,cy+f.ty*6+iy*f.depth*.3);
    }
    ctx.lineWidth=5;ctx.strokeStyle='rgba(10,8,7,.72)';ctx.stroke();
    ctx.lineWidth=2.6;ctx.strokeStyle='rgba('+ALERT.franchi+','+pulse+')';ctx.stroke();
   }
  }finally{ctx.restore();}
  return drawn;
 }
 function viewOf(g){
  const zoom=Number(g.camera?.zoom)||1,hw=g.width/zoom/2+24,hh=g.height/zoom/2+24;
  return {left:g.camera.x-hw,right:g.camera.x+hw,top:g.camera.y-hh,bottom:g.camera.y+hh};
 }
 function shown(g){
  if(!g||g.state!=='playing'||g.gameOver||!g.camera||!(g.width>0)||!(g.height>0))return false;
  return !(g.frontier?.active?.()||g.player?.regionAbsent);
 }
 function toWorld(ctx,g){
  const zoom=Number(g.camera.zoom)||1;
  ctx.translate(g.width/2+(g.frameShake?.x||0),g.height/2+(g.frameShake?.y||0));ctx.scale(zoom,zoom);ctx.translate(-g.camera.x,-g.camera.y);
 }
 // Peintre complet en une passe (essais, aperçus) : sol, crêtes puis signaux. Renvoie le nombre de corps dessinés.
 function paint(ctx,g,options={}){
  if(!ctx||!shown(g))return 0;
  const frame=plan(g,{view:viewOf(g)});if(!frame.items.length)return 0;
  const store=options.store||null;store?.begin();
  ctx.save();
  try{
   toWorld(ctx,g);
   for(const item of frame.items)drawPart(ctx,item,'ground',g,store);
   for(const item of frame.items)if(crested(item))drawPart(ctx,item,'crest',g,store);
   drawSignals(ctx,frame,g);
  }finally{ctx.restore();}
  return frame.bodies;
 }
 function install(g,doc){
  if(!g||g.corpseHeaps217)return false;
  const store=createStore(canvasFactory());
  let frame=null,byWall=new Map(),drawn=new Set(),card=null,rows=null,title=null,note=null,clock=-Infinity,primed=false,text='';
  const known=new Map();
  // Annonces : une par mur et par épisode. Le premier relevé d'une partie ou d'une reprise reste silencieux.
  function watch(list){
   const fresh={imminent:new Set(),franchi:new Set()},seen=new Set();
   for(const heap of list){
    seen.add(heap.id);
    if(heap.state==='faible'){known.delete(heap.id);continue;}
    let mark=known.get(heap.id);if(!mark){mark={imminent:false,franchi:false};known.set(heap.id,mark);}
    if(heap.state==='franchi'&&!mark.franchi){mark.franchi=mark.imminent=true;if(primed)fresh.franchi.add(heap.side);}
    else if(heap.state==='imminent'&&!mark.imminent){mark.imminent=true;if(primed)fresh.imminent.add(heap.side);}
   }
   for(const id of [...known.keys()])if(!seen.has(id))known.delete(id);
   primed=true;
   if(typeof g.notify!=='function')return 0;
   let sent=0;
   for(const side of SIDES){
    if(fresh.franchi.has(side)){g.notify(sentence({side,state:'franchi'}),'danger');sent++;}
    else if(fresh.imminent.has(side)){g.notify(sentence({side,state:'imminent'}),'normal');sent++;}
   }
   return sent;
  }
  function attach(){
   if(card||!doc?.getElementById||typeof doc.createElement!=='function')return card;
   const box=doc.getElementById('siegeReadout');if(!box||typeof box.appendChild!=='function')return null;
   const el=(tag,value,cls)=>{const node=doc.createElement(tag);if(value!==undefined)node.textContent=value;if(cls)node.className=cls;return node;};
   const node=el('article',undefined,'siege-readout-card corpse-heaps-card');node.id='corpseHeapsCard';
   if(typeof node.appendChild!=='function'){box.appendChild(node);card=node;return card;}
   title=el('h3');title.id='corpseHeapsTitle';note=el('p',undefined,'siege-readout-note');note.id='corpseHeapsNote';
   const list=el('dl');rows=new Map();
   node.appendChild(el('small','AMAS AU PIED DES MURS'));node.appendChild(title);node.appendChild(list);node.appendChild(note);
   if(typeof list.appendChild==='function')for(const side of SIDES){const dd=el('dd','—');dd.id='corpseHeaps-'+side;list.appendChild(el('dt',LABELS[side][0].toUpperCase()+LABELS[side].slice(1)));list.appendChild(dd);rows.set(side,dd);}
   box.appendChild(node);card=node;return card;
  }
  const write=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
  function lines(list){
   const best=summary(g,list),top=list[0]||null,work=clearing(top),limit=thresholds();
   const sides={};for(const side of SIDES)sides[side]=best[side]?percent(best[side].ratio)+' % du seuil · '+best[side].state:'—';
   const head=top?'Le plus haut : '+LABELS[top.side]+', '+percent(top.ratio)+' % du seuil ('+top.state+')':'Aucun amas contre les murs.';
   let foot=limit?'Au-delà d’une charge de '+decimal(limit.first)+', les premiers Infectés récents et Rampants franchissent le mur ; à '+decimal(limit.all)+', tous.':'';
   if(work)foot+=' Un ouvrier en déblaiement retire '+decimal(work.rate)+' corps par seconde'+(top?' : l’amas le plus haut (charge '+decimal(top.load)+') se dégage en '+work.seconds+' s.':'.');
   return {head,sides,foot};
  }
  function render(){
   const playing=g.state==='playing',list=playing?heaps(g):[];
   if(playing)watch(list);
   const node=attach();if(!node)return false;
   node.hidden=!playing;if(!playing)return false;
   const out=lines(list),key=JSON.stringify(out);
   if(key!==text){text=key;if(title){write(title,out.head);write(note,out.foot);for(const side of SIDES)write(rows.get(side),out.sides[side]);}else write(node,out.head+' '+out.foot);}
   return true;
  }
  const reset=()=>{primed=false;known.clear();clock=-Infinity;frame=null;byWall=new Map();drawn=new Set();store.clear();};
  // Sol : après le terrain et les enveloppes déjà posées, avant les cadavres isolés, les bâtiments et les acteurs.
  const ground=g.drawGround;
  if(typeof ground==='function')g.drawGround=function(...args){
   const result=ground.apply(this,args);
   try{
    frame=null;byWall=new Map();drawn=new Set();
    if(args[0]&&shown(g)){
     frame=plan(g,{view:viewOf(g)});store.begin();
     for(const item of frame.items){if(crested(item))byWall.set(item.heap.id,item);if((item.ground>0||item.heap.ratio>=HIGH)&&drawPart(args[0],item,'ground',g,store))drawn.add(item.heap.id);}
    }
   }catch(error){frame=null;}
   return result;
  };
  // Crête : dans la file de profondeur, juste après le mur concerné.
  const building=g.drawBuilding;
  if(typeof building==='function')g.drawBuilding=function(...args){
   const result=building.apply(this,args);
   if(byWall.size&&args[0]&&args[1]){const item=byWall.get(args[1].id);if(item)try{drawPart(args[0],item,'crest',g,store);}catch(error){/* affichage facultatif */}}
   return result;
  };
  // Signaux : après le voile de nuit, sous les flèches de menace et le réticule.
  const night=g.drawNight;
  if(typeof night==='function')g.drawNight=function(...args){
   const result=night.apply(this,args);
   if(frame&&byWall.size&&args[0]&&typeof args[0].save==='function'&&shown(g)){const ctx=args[0];ctx.save();try{toWorld(ctx,g);drawSignals(ctx,frame,g);}catch(error){/* affichage facultatif */}finally{ctx.restore();}}
   return result;
  };
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS||g.state!=='playing'){clock=now;render();}return result;};
  for(const name of ['startNew','restoreSave']){const old=g[name];if(typeof old!=='function')continue;g[name]=function(...args){const result=old.apply(this,args);reset();render();return result;};}
  // `covers` : l'amas de ce mur vient d'être dessiné ; les huit marques héritées de `art.js` s'effacent alors.
  // Un amas faible privé de corps par le plafond n'est pas couvert : ses marques héritées restent.
  g.corpseHeaps217=Object.freeze({render,covers:wall=>!!wall&&drawn.has(wall.id),heaps:view=>heaps(g,view),summary:()=>summary(g),plan:options=>plan(g,options),paint:ctx=>paint(ctx,g,{store}),clearing:()=>clearing(heaps(g)[0]||null)});
  render();return true;
 }
 return Object.freeze({install,heaps,summary,clearing,sentence,plan,paint,createStore,thresholds,states:STATES,limits});
});
