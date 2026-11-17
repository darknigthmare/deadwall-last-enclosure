/* Original metre-based spatial grammar. Render, navigation and loot use these same transforms. */
(function(root){'use strict';const Settlement=root.DeadwallSettlementPlans||(typeof require==='function'?require('./settlement-plans.js'):null);const Specialists=root.DeadwallFrontierSpecialists||(typeof require==='function'?require('./frontier-specialists.js'):null);const Places=root.DeadwallFrontierPlaces||(typeof require==='function'?require('./frontier-places.js'):null);
const SIZE=8192,CHUNK=256;
function hash(...values){let h=2166136261;for(const v of values)for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,0x7feb352d);return(h^h>>>15)>>>0;}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function noise(seed,x,y,scale){const ix=Math.floor(x/scale),iy=Math.floor(y/scale),sx=x/scale-ix,sy=y/scale-iy,f=t=>t*t*(3-2*t),v=(a,b)=>hash(seed,a,b)/4294967296;return(1-f(sy))*(v(ix,iy)*(1-f(sx))+v(ix+1,iy)*f(sx))+f(sy)*(v(ix,iy+1)*(1-f(sx))+v(ix+1,iy+1)*f(sx));}
function local(p,x,y){const dx=x-p.x,dy=y-p.y,c=Math.cos(p.a),s=Math.sin(p.a);return{x:dx*c+dy*s+p.w/2,y:-dx*s+dy*c+p.h/2};}
function global(p,x,y){const dx=x-p.w/2,dy=y-p.h/2,c=Math.cos(p.a),s=Math.sin(p.a);return{x:p.x+dx*c-dy*s,y:p.y+dx*s+dy*c};}
function bounds(p,pad=0){const c=Math.abs(Math.cos(p.a)),s=Math.abs(Math.sin(p.a)),w=p.w*c+p.h*s+pad*2,h=p.w*s+p.h*c+pad*2;return{l:p.x-w/2,r:p.x+w/2,t:p.y-h/2,b:p.y+h/2};}
const overlap=(a,b,g=0)=>a.l<b.r+g&&a.r>b.l-g&&a.t<b.b+g&&a.b>b.t-g;
function circleRect(x,y,r,b){return(x-clamp(x,b.x,b.x+b.w))**2+(y-clamp(y,b.y,b.y+b.h))**2<r*r-1e-9||x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h;}
function nearest(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy),0,1),x=a.x+dx*t,y=a.y+dy*t;return{x,y,d:Math.hypot(p.x-x,p.y-y),a:Math.atan2(dy,dx),t};}
function segmentRect(a,b,r){let min=0,max=1;for(const [p,q]of [[-(b.x-a.x),a.x-r.x],[b.x-a.x,r.x+r.w-a.x],[-(b.y-a.y),a.y-r.y],[b.y-a.y,r.y+r.h-a.y]]){if(Math.abs(p)<1e-9){if(q<0)return false;}else{const t=q/p;if(p<0)min=Math.max(min,t);else max=Math.min(max,t);if(min>max)return false;}}return true;}
const PRESETS=[
 ['house','Maison de lotissement',14,12,[0],'home','DW-0001'],['duplex','Maison à étage',16,13,[0,1],'home','DW-0003'],['cabin','Chalet forestier',9,8,[0],'cabin','DW-0010'],
 ['apartments','Immeuble de trois étages',30,23,[0,1,2],'apartments','DW-0021'],['mall','Centre commercial régional',82,56,[0,1],'mall','DW-0041'],['hardware','Magasin de bricolage',38,28,[0],'retail','DW-0045'],
 ['grocer','Supérette de quartier',19,15,[0],'food','DW-0061'],['market','Supermarché avec quai',42,30,[0],'food','DW-0062'],['diner','Restaurant routier',25,17,[0],'diner','DW-0069'],
 ['hotel','Hôtel de centre-ville',42,26,[0,1,2],'hotel','DW-0101'],['clinic','Dispensaire rural',23,17,[0],'clinic','DW-0123'],['school','École primaire',38,28,[0,1],'school','DW-0142'],
 ['townhall','Mairie',28,20,[0,1],'civic','DW-0161'],['bunker','Abri communal souterrain',26,21,[-1,0],'bunker','DW-0201'],['warehouse','Entrepôt de messagerie',46,29,[0],'warehouse','DW-0221'],
 ['garage','Garage automobile',25,20,[0],'garage','DW-0241'],['fuel','Station-service',19,14,[0],'fuel','DW-0247'],['sawmill','Scierie de vallée',40,26,[0],'sawmill','DW-0381'],
 ['mine','Mine à galerie',32,25,[-1,0],'mine','DW-0401'],['quarry','Carrière de pierre',30,24,[0],'quarry','DW-0403'],['ruin','Maison effondrée visitable',18,14,[0],'ruin','DW-0481'],['motel','Motel gagné par la forêt',44,19,[0,1],'hotel','DW-0498']
].map(([id,name,w,h,levels,layout,codex])=>Object.freeze({id,name,w,h,levels,layout,codex})).concat(Places.PRESETS,Specialists.PRESETS,Settlement.PRESETS);
const BY=Object.freeze(Object.fromEntries(PRESETS.map(x=>[x.id,x])));
const SHAPES={dentalChair:[2.0,.85],sterilizer:[1.1,.65],steelTable:[2,.8],dishRack:[1.5,.7],timberRack:[3.0,.8],sawBench:[2.4,1.2],clampRack:[1.6,.6],palletStack:[1.2,1.0],generator:[2.3,1.2],electricalRack:[1.5,.6],counter:[2.1,.8],oven:[1.4,1.1],washer:[.85,.85],kennel:[1.2,1.1],plantTray:[2.4,1.1],tirePile:[1.2,1.2],hoseRack:[2.2,.8],bench:[1.8,.65],bed:[2.05,1.6],sofa:[2.2,.95],table:[1.6,.85],desk:[1.4,.7],wardrobe:[1.2,.65],shelf:[2.4,.7],crate:[1.2,.8],fridge:[.8,.8],medical:[1.2,.65],fuel:[.65,.5],workbench:[2,.85],logs:[4.4,1.4],rubble:[1.6,1.3],machine:[2.6,1.6],sink:[.8,.65],pump:[.8,.65],car:[4.6,1.85]};
const RESOURCES={dentalChair:"scrap",sterilizer:"scrap",steelTable:"scrap",dishRack:"scrap",timberRack:"wood",sawBench:"scrap",clampRack:"scrap",palletStack:"wood",generator:"scrap",electricalRack:"scrap",counter:"scrap",oven:"scrap",washer:"scrap",kennel:"scrap",plantTray:"food",tirePile:"scrap",hoseRack:"scrap",bench:"wood",bed:'wood',sofa:'wood',table:'wood',desk:'scrap',wardrobe:'wood',shelf:'scrap',crate:'scrap',fridge:'food',medical:'medicine',fuel:'fuel',workbench:'scrap',logs:'wood',rubble:'stone',machine:'scrap',sink:'scrap',pump:'fuel',car:'scrap'};
function basePlan(p,z=0){if(Settlement.BY[p.type])return basePlan({...p,type:Settlement.BY[p.type].parent},z);if(Specialists.BY[p.type])return Specialists.plan(p,z,api);if(Places.BY[p.type])return Places.plan(p,z,api);const d=BY[p.type];if(!d||!d.levels.includes(z))throw Error('Étage absent');const walls=[],rooms=[],objects=[],stairs=[],floor={x:.25,y:.25,w:p.w-.5,h:p.h-.5};const th=.24,w=p.w,h=p.h,cx=w/2;let next=0;
 const wall=(x,y,ww,hh)=>{if(ww>.01&&hh>.01)walls.push({x,y,w:ww,h:hh});};
 const horizontal=(x,y,len,doorX,door=1.5)=>{wall(x,y,doorX-x-door/2,th);wall(doorX+door/2,y,x+len-doorX-door/2,th);};
 const vertical=(x,y,len,doorY,door=1.5)=>{wall(x,y,th,doorY-y-door/2);wall(x,doorY+door/2,th,y+len-doorY-door/2);};
 horizontal(0,0,w,cx,2.6);horizontal(0,h-th,w,cx,2.0);wall(0,0,th,h);wall(w-th,0,th,h);
 const add=(kind,x,y,a=0,resource=null,room='extérieur')=>{const[ow,oh]=SHAPES[kind],obj={id:p.id+':'+z+':'+next++,kind,x,y,w:ow,h:oh,a,resource:resource||RESOURCES[kind],amount:7+hash(p.id,z,next)%17,room};const box={l:x,r:x+ow,t:y,b:y+oh};if(x<.35||y<.35||x+ow>w-.35||y+oh>h-.35||walls.some(b=>overlap(box,{l:b.x,r:b.x+b.w,t:b.y,b:b.y+b.h},.1))||objects.some(b=>overlap(box,{l:b.x,r:b.x+b.w,t:b.y,b:b.y+b.h},.2)))return false;objects.push(obj);return obj;};
 const room=(name,x,y,rw,rh,kinds)=>{rooms.push({name,x,y,w:rw,h:rh});const positions=[[x+.6,y+.65],[x+.6,y+rh-2.6],[x+rw-3.4,y+.65],[x+rw-3.4,y+rh-2.6]];kinds.forEach((k,i)=>{let [kind,res]=k.split('/');const q=positions[i%positions.length];add(kind,q[0],q[1],0,res||null,name);});};
 const rows=(labels)=>{const hall=2.8,lo=cx-hall/2,hi=cx+hall/2,n=labels.length/2,rh=(h-1)/n;for(let row=0;row<n;row++){const y=.5+row*rh;vertical(lo,y,rh,y+rh/2);vertical(hi,y,rh,y+rh/2);if(row){wall(.25,y,lo-.25,th);wall(hi,y,w-hi-.25,th);}const a=labels[row*2],b=labels[row*2+1];room(a[0],.35,y+.25,lo-.6,rh-.5,a[1]);room(b[0],hi+.35,y+.25,w-hi-.7,rh-.5,b[1]);}};
 const layout=d.layout;
 if(['home','ruin','apartments','clinic','school','civic','bunker'].includes(layout)){
  const home=z>0?[['Chambre',['bed','wardrobe']],['Chambre',['bed','desk']],['Salle d’eau',['sink','wardrobe']],['Réserve',['wardrobe','crate']]]:[['Séjour',['sofa','table']],['Cuisine',['fridge','sink']],['Chambre',['bed','wardrobe']],['Garage / rangement',['workbench','crate']]];
  const labels=layout==='clinic'?[['Accueil',['desk','table']],['Consultation',['medical','desk']],['Soins',['bed','medical']],['Stock médical',['medical','shelf/medicine']]]:layout==='school'?[['Classe',['desk','table']],['Classe',['desk','table']],['Bibliothèque',['shelf/wood','desk']],['Réserve',['wardrobe','crate']]]:layout==='civic'?[['Accueil',['desk','table']],['Bureau',['desk','wardrobe']],['Archives',['shelf/scrap','wardrobe']],['Conseil',['table','desk']]]:layout==='bunker'?[['Vie commune',['table','crate/food']],['Dortoir',['bed','wardrobe']],['Réserve secours',['medical','crate/food']],['Technique',['workbench','fuel']]]:home;
  rows(layout==='apartments'?[...labels,...labels]:labels);if(layout==='ruin'){walls.splice(2,1);room('Débris de façade',.6,.6,3,3,['rubble']);}
 }else if(layout==='cabin'){room('Vie commune',.5,.5,w/2-1,h-1,['sofa','table']);room('Couchage et réserve',cx+1,.5,w/2-1.5,h-1,['bed','fridge']);}
 else if(layout==='hotel'){
  const mid=h/2,hw=3.2,cols=Math.floor(w/7),cw=w/cols;for(let i=0;i<cols;i++)for(let side=0;side<2;side++){const x=i*cw,y=side?mid+hw/2:.4,rh=h/2-hw/2-.4;if(i===Math.floor(cols/2))continue;horizontal(x,side?mid+hw/2:mid-hw/2,cw,x+cw/2,1.5);if(i)wall(x,y,th,rh);room(z===0&&side===0&&i===0?'Réception':'Chambre '+(i+1+side*cols),x+.3,y+.3,cw-.6,rh-.6,z===0&&i===0?['desk','wardrobe']:['bed','wardrobe']);}
 }else if(layout==='mall'){
  const mid=h/2,mall=8,cols=6,cw=w/cols;for(let i=0;i<cols;i++)for(let side=0;side<2;side++){if(i===2||i===3)continue;const x=i*cw,y=side?mid+mall/2:.5,rh=mid-mall/2-.5;horizontal(x,side?mid+mall/2:mid-mall/2,cw,x+cw/2,2.8);wall(x,y,th,rh);const reserveY=side?y+rh-4:y+4;horizontal(x,reserveY,cw,x+cw/2,1.4);room('Boutique '+(i+1+side*cols),x+.4,y+.3,cw-.8,rh-.6,['shelf','shelf/food','crate','desk']);}
  for(const xx of [w*.35,w*.6])room('Boutique ancre',xx,.7,w*.12,12,['shelf','fridge']);
 }else if(['food','retail','fuel','diner'].includes(layout)){
  const stock=h*.68;horizontal(.25,stock,w-.5,cx,2.0);if(layout==='diner'){for(let x=1;x<w-2;x+=4.5)for(let y=1;y<stock-2;y+=3)if(Math.abs(x-cx)>2)add('table',x,y,0,'wood','Salle');}
  else for(let x=1;x<w-3;x+=5.8)for(let y=2;y<stock-2;y+=3.8)if(Math.abs(x-cx)>3)add('shelf',x,y,0,layout==='food'||layout==='fuel'?'food':'scrap','Vente');
  room('Réserve',.5,stock+.6,cx-2,h-stock-1.2,layout==='fuel'?['fuel','crate/food']:['crate/'+(layout==='food'?'food':'scrap'),'fridge']);room('Service et caisse',cx+2,stock+.6,w-cx-2.5,h-stock-1.2,['workbench','desk']);
 }else if(['warehouse','sawmill','garage','quarry','mine'].includes(layout)){
  if(layout==='mine'&&z<0){rows([['Galerie boisée',['logs','rubble']],['Chambre de taille',['rubble','crate']],['Refuge',['crate/food','fuel']],['Front de roche',['rubble','machine']]]);}
  else {const rear=h-6;horizontal(.25,rear,w-.5,cx,2.4);for(let x=1;x<w-4;x+=6)for(let y=2;y<rear-3;y+=4.5)if(Math.abs(x-cx)>3)add(layout==='sawmill'?'logs':layout==='quarry'?'rubble':layout==='garage'?'machine':'shelf',x,y,0,null,'Halle');room('Réserve technique',.5,rear+.5,cx-2,5,['workbench','fuel']);room('Bureau',cx+2,rear+.5,w-cx-2.5,5,['desk','crate']);}
 }
 if(d.levels.length>1)stairs.push({id:p.id+':stairs',x:cx-1.05,y:h-4,w:2.1,h:2.9,levels:d.levels});
 // Room content is generated only after the complete wall graph; accidental wall intersections are rejected.
 const clean=objects.filter(o=>!walls.some(b=>overlap({l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h},{l:b.x,r:b.x+b.w,t:b.y,b:b.y+b.h},.08))&&!stairs.some(b=>overlap({l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h},{l:b.x,r:b.x+b.w,t:b.y,b:b.y+b.h},.15)));
 return{walls,objects:clean,rooms,stairs,floor,entry:global(p,cx,-1),exit:global(p,cx,h+1)};
}
// G7 varies the interior as one spatial contract. Earlier generations retain
// their exact plans, and a reflection keeps every finite container identity.
function layoutVariant(p){return p.generation>=7?hash(p.id,p.type,p.x,p.y,'interior141')&1:0;}
function plan(p,z=0){
 const result=basePlan(p,z);if(p.generation<7||!p.generation)return result;
 const variant=layoutVariant(p);if(!variant)return{...result,layoutVariant141:'original'};
 const reflect=box=>{const copy={...box,x:p.w-box.x-box.w};if(Number.isFinite(box.a))copy.a=box.a===0?0:-box.a;return copy;};
 return{...result,walls:result.walls.map(reflect),rooms:result.rooms.map(reflect),objects:result.objects.map(reflect),stairs:result.stairs.map(reflect),layoutVariant141:'mirrored'};
}
function parking(p){if((p.generation||1)<4){const count=['mall','hotel','market','warehouse'].includes(p.type)?6:['cabin','mine','bunker','quarry'].includes(p.type)?1:3,items=[];for(let i=0;i<count;i++){const side=i%2===0?-1:1,row=Math.floor(i/2),v=global(p,p.w/2+side*(5+row*3),-8);items.push({id:p.id+':car:'+i,kind:'car',x:v.x,y:v.y,w:4.6,h:1.85,a:p.a+Math.PI/2+(hash(p.id,'park',i)%401-200)/10000,resource:'scrap',amount:10+hash(p.id,i)%18});}return items;}const count=['mall','hotel','market','warehouse','superstore','logisticsHall'].includes(p.type)?8:['cabin','mine','bunker','quarry'].includes(p.type)?1:3,models=[['compact',4.05,1.72],['break',4.6,1.85],['van',5.3,2.05],['truck',7.4,2.5],['motorcycle',2.15,.75],['bike',1.8,.65]],items=[];for(let i=0;i<count;i++){const side=i%2===0?-1:1,row=Math.floor(i/2),m=models[hash(p.id,'model',i)%models.length],v=global(p,p.w/2+side*(5+row*3.4),-8);items.push({id:p.id+':car:'+i,kind:'car',type:m[0],x:v.x,y:v.y,w:m[1],h:m[2],a:p.a+Math.PI/2+(hash(p.id,'park',i)%401-200)/10000,resource:'scrap',amount:7+hash(p.id,i)%22});}return items;}
function obb(a,b){const axes=[[Math.cos(a.a),Math.sin(a.a)],[-Math.sin(a.a),Math.cos(a.a)],[Math.cos(b.a),Math.sin(b.a)],[-Math.sin(b.a),Math.cos(b.a)]];for(const[u,v]of axes){const center=Math.abs((a.x-b.x)*u+(a.y-b.y)*v),ra=a.w/2*Math.abs(Math.cos(a.a)*u+Math.sin(a.a)*v)+a.h/2*Math.abs(-Math.sin(a.a)*u+Math.cos(a.a)*v),rb=b.w/2*Math.abs(Math.cos(b.a)*u+Math.sin(b.a)*v)+b.h/2*Math.abs(-Math.sin(b.a)*u+Math.cos(b.a)*v);if(center>=ra+rb-.0001)return false;}return true;}
const api=Object.freeze({SIZE,CHUNK,PRESETS,BY,SHAPES,RESOURCES,hash,rng,noise,local,global,bounds,overlap,circleRect,nearest,segmentRect,obb,plan,layoutVariant,parking,outdoor:p=>Specialists.BY[p.type]?Specialists.outdoor(p,api):Places.outdoor(Settlement.BY[p.type]?{...p,type:Settlement.BY[p.type].parent,generation:2,extendedService:p.generation>=4}:p.generation>=3?{...p,generation:2,extendedService:p.generation>=4}:p,api)});root.DeadwallFrontierGeometry=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
