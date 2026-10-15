/* Seeded parcel details. Pictures never own collisions, floor plans or loot. */
(function(root,factory){
 'use strict';const api=factory(root);root.DeadwallSeedDetailArt157=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const Props=typeof require==='function'?require('./world-props-art153.js'):null;
 const Nature=typeof require==='function'?require('./nature-art153.js'):null;
 const Interior=typeof require==='function'?require('./interior-art153.js'):null;
 const Variants158=root.DeadwallWorldVariants158||(typeof require==='function'?require('./world-variants158.js'):null);
 const route=(owner,family)=>Object.freeze({owner,family});
 const PRESENTATIONS=Object.freeze({
  machine:route('furniture','machine'),crate:route('furniture','crate'),
  table:route('furniture','table'),
  bed:route('furniture','bed'),sofa:route('furniture','sofa'),shelf:route('furniture','shelf'),fridge:route('furniture','fridge'),desk:route('furniture','desk'),workbench:route('furniture','workbench'),counter:route('furniture','counter'),medical:route('furniture','medical'),oven:route('furniture','oven'),washer:route('furniture','washer'),electricalRack:route('furniture','electricalRack'),hoseRack:route('furniture','hoseRack'),
  pool:route('props','pool157'),greenhouse:route('props','greenhouse157'),bench:route('props','bench157'),playset:route('props','playset157'),
  barbecue:route('props','barbecue157'),clothesline:route('props','clothesline157'),laundryLine:route('props','clothesline157'),bikeRack:route('props','bikeRack157'),compost:route('props','compost157'),
  chair:route('props','chair157'),tv:route('props','tv157'),rug:route('props','rug157'),smallCabinet:route('props','wardrobe157'),shelfEnd:route('props','bookshelf157'),
  wardrobe:route('props','wardrobe157'),bookshelf:route('props','bookshelf157'),sink:route('props','sink157'),shower:route('props','shower157'),officeDesk:route('props','officeDesk157'),
  tree:route('nature','fruit'),flowerbed:route('nature','flowers'),planter:route('furniture','plantTray'),cropbed:route('props','crops'),
  shed:route('props','shed'),waterButt:route('props','waterTank'),pallet:route('props','pallet'),lamp:route('props','streetLamp'),barrel:route('props','barrel'),crateStack:route('props','cache'),
  sign:route('props','roadSign'),cart:route('props','shoppingCart'),canopy:route('props','tarp'),container:route('props','container'),tire:route('props','tirePile'),worktable:route('furniture','workbench'),
  scrapHeap:route('props','scrap'),bollard:route('props','bollard'),display:route('furniture','shelf'),countertop:route('furniture','table'),fallenStock:route('props','supplies'),toolbox:route('props','repairKit'),
  fence:route('canvas','fence'),hedge:route('canvas','hedge'),patio:route('canvas','patio'),trash:route('canvas','trash'),paper:route('canvas','paper'),toy:route('canvas','toy'),
  laundryBasket:route('canvas','laundryBasket'),basket:route('canvas','basket'),menu:route('canvas','menu'),tray:route('canvas','tray'),screen:route('canvas','screen'),notice:route('canvas','notice'),palletMark:route('canvas','palletMark'),
  toilet:route('canvas','toilet'),latrine:route('canvas','latrine')
 });
 function presentationFor(kind){return typeof kind==='string'&&Object.hasOwn(PRESENTATIONS,kind)?PRESENTATIONS[kind]:null;}
 function valid(o){return !!o&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0&&!!presentationFor(o.kind);}
 function variantFor(o,seed=0,count=2){
  let h=(Number.isFinite(seed)?seed>>>0:0)^2166136261;
  const identity=String(o?.id??[o?.kind,o?.x,o?.y,o?.z??0].join(':'))+':'+o?.kind;
  for(let i=0;i<identity.length;i++)h=Math.imul(h^identity.charCodeAt(i),16777619);
  return(h>>>0)%count;
 }
 function paintImage(c,o,art,seed){
  if(Variants158?.drawDetail(c,art,o,{seed}))return true;
  const spec=presentationFor(o.kind),x=o.x+o.w/2,y=o.y+o.h/2;
  const p=root.DeadwallWorldPropsArt153||Props,n=root.DeadwallNatureArt153||Nature,i=root.DeadwallInteriorArt153||Interior;
  if(spec.owner==='props')return !!p?.drawSprite(c,art,spec.family,o.id,x,y,o.w,o.h,{seed,...(o.profile165&&o.kind==='chair'?{variant:['office','reception'].includes(o.profile165)?1:0}:{})});
  if(spec.owner==='nature')return !!n?.drawSprite(c,art,o.kind==='tree'&&n.TREES.includes(o.species)?o.species:spec.family,o.id,x,y,o.w,o.h,{seed});
  if(spec.owner==='furniture'){
   // The historical first table image already includes chairs. New groups use
   // the bare second table, or the real workbench for an assembly station.
   const family=o.kind==='table'&&o.profile165==='workshop'?'workbench':spec.family;
   const forms=i?.FURNITURE?.[family];
   const index=o.kind==='table'&&o.profile165&&family==='table'?1:variantFor(o,seed,forms?.length||1);
   const sprite=forms?.[index];return !!sprite&&!!i.paint(c,art,sprite,o,{fit:true});
  }
  return false;
 }
 // Fallbacks use named, readable physical shapes. Small surface marks can stay
 // procedural. Every pixel stays inside the same generated support rectangle.
 function fallback(c,o,seed=0){
  const{x,y,w,h,kind}=o,v=variantFor(o,seed),wood=v?'#877255':'#a08c68',metal=v?'#778b86':'#94a198';
  const fill=(a,b,d,e,color)=>{c.fillStyle=color;c.fillRect(x+a*w,y+b*h,d*w,e*h);};
  const box=(a,b,d,e,color,t=.04)=>{c.strokeStyle=color;c.lineWidth=Math.min(w,h)*t;c.strokeRect(x+a*w,y+b*h,d*w,e*h);};
  const oval=(a,b,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x+a*w,y+b*h,rx*w,ry*h,0,0,Math.PI*2);c.fill();};
  const line=(points,color,t=.04)=>{c.strokeStyle=color;c.lineWidth=Math.min(w,h)*t;c.beginPath();points.forEach(([a,b],k)=>k?c.lineTo(x+a*w,y+b*h):c.moveTo(x+a*w,y+b*h));c.stroke();};
  if(!o.surface)fill(.025,.035,.95,.93,'rgba(18,31,24,.20)');
  switch(kind){
   case 'pool':{
    const dry=['dry','empty','drained'].includes(o.poolState);
    fill(.02,.02,.96,.96,v?'#969b8d':'#c0b698');fill(.08,.11,.84,.78,dry?'#6e7964':v?'#427a80':'#4e8d98');box(.045,.06,.91,.88,'#dbceb2',.065);
    if(!dry)for(let k=0;k<3;k++)line([[.15,.28+k*.19],[.44,.25+k*.19],[.82,.29+k*.19]],'#9bb9aa',.018);
    line([[.72,.03],[.72,.23],[.79,.23],[.79,.03]],metal,.027);break;
   }
   case 'fence':{
    const vertical=h>w,count=Math.max(3,Math.min(28,Math.ceil(Math.max(w,h)/.7)));
    fill(vertical?.25:.04,vertical?.04:.25,vertical?.5:.92,vertical?.92:.5,v?'#75817a':'#9a8e72');
    for(let k=0;k<count;k++){const t=.06+k*.88/(count-1);fill(vertical?.12:t,vertical?t:.12,vertical?.76:.025,vertical?.025:.76,wood);}
    if(v){line(vertical?[[.14,.05],[.86,.96]]:[[.05,.14],[.96,.86]],'#a5b0a3',.025);line(vertical?[[.86,.05],[.14,.96]]:[[.05,.86],[.96,.14]],'#a5b0a3',.025);}break;
   }
   case 'hedge':{
    const vertical=h>w,count=Math.max(3,Math.min(28,Math.ceil(Math.max(w,h)/.55)));
    for(let k=0;k<count;k++){const t=.08+k*.84/(count-1);oval(vertical?.5:t,vertical?t:.5,vertical?.46:.085,vertical?.085:.46,k%2?'#527340':'#66834e');}
    if(v)line(vertical?[[.50,.06],[.48,.96]]:[[.06,.52],[.96,.48]],'#819257');break;
   }
   case 'tree':fill(.45,.38,.10,.3,wood);for(const[a,b]of[[.35,.34],[.62,.34],[.34,.61],[.65,.58],[.50,.45]])oval(a,b,.27,.26,v?'#527347':'#668451');break;
   case 'cropbed':case 'flowerbed':case 'planter':
    fill(.03,.07,.94,.86,'#675541');box(.05,.09,.90,.82,wood,.06);for(let a=0;a<4;a++)for(let b=0;b<3;b++)oval(.15+a*.23,.21+b*.27,.06,.095,kind==='flowerbed'&&((a+b+v)%3===0)?'#b7a66d':'#758e50');break;
   case 'greenhouse':fill(.04,.06,.92,.9,'#6c8070');box(.05,.08,.90,.82,metal);for(let k=1;k<5;k++)line([[k/5,.08],[k/5,.9]],'#a4bca9',.03);fill(.42,.74,.17,.20,'#40594f');break;
   case 'shed':case 'container':fill(.04,.04,.92,.92,v?'#6d7b73':'#8d8771');for(let k=0;k<5;k++)fill(.09+k*.18,.035,.035,.90,'#afb2a0');fill(.62,.43,.24,.48,'#414e45');box(.04,.04,.92,.92,wood);break;
   case 'playset':line([[.13,.92],[.24,.09],[.78,.09],[.9,.92]],wood,.07);line([[.30,.12],[.30,.70],[.66,.70],[.66,.12]],metal,.035);fill(.25,.68,.46,.10,v?'#9a8061':'#657f65');break;
   case 'patio':fill(.02,.04,.96,.92,v?'#918e78':'#aca58e');for(let k=1;k<5;k++)line([[k/5,.05],[k/5,.95]],'#767e6c',.025);for(let k=1;k<3;k++)line([[.03,k/3],[.96,k/3]],'#7b8270',.03);break;
   case 'rug':fill(.03,.05,.94,.90,v?'#657766':'#9b7a63');box(.12,.15,.76,.70,'#b4a37c',.075);line(v?[[.18,.28],[.80,.76]]:[[.18,.5],[.8,.5]],'#d3bb93',.065);break;
   case 'palletMark':box(.05,.05,.90,.90,'#aea48c',.05);for(const a of[.1,.82])line([[a,.12],[a+.07,.26],[a,.44],[a+.07,.63],[a,.86]],'#9c9780',.05);break;
   case 'table':case 'bench':case 'worktable':case 'officeDesk':case 'countertop':fill(.07,.14,.86,.70,wood);for(let k=0;k<4;k++)fill(.1,.21+k*.16,.80,.035,'#4d5845');box(.04,.09,.92,.80,metal,.045);break;
   case 'chair':fill(.16,.11,.68,.78,wood);fill(.22,.38,.56,.40,v?'#6b826b':'#baac82');box(.14,.11,.72,.78,metal,.07);line([[.24,.19],[.76,.19]],'#dcc4a0',.08);break;
   case 'smallCabinet':case 'wardrobe':fill(.04,.07,.92,.85,wood);box(.04,.07,.92,.85,metal,.035);line([[.5,.10],[.5,.89]],'#4b5245');fill(.42,.42,.04,.16,metal);fill(.55,.42,.04,.16,metal);break;
   case 'shelfEnd':case 'bookshelf':case 'display':fill(.04,.06,.92,.90,wood);for(let k=0;k<3;k++){fill(.10,.10+k*.28,.80,.05,metal);for(let j=0;j<4;j++)fill(.12+j*.2,.16+k*.25,.13,.14,['#8c8c6f','#637f72','#a99678'][(j+k+v)%3]);}break;
   case 'barbecue':oval(.50,.47,.42,.38,'#38443e');oval(.50,.47,.33,.28,metal);for(let k=0;k<5;k++)line([[.2,.28+k*.085],[.8,.28+k*.085]],'#35403a');fill(.15,.89,.13,.08,metal);fill(.75,.89,.13,.08,metal);break;
   case 'trash':if(v){fill(.13,.11,.75,.82,'#71816d');box(.12,.10,.76,.83,'#a8ae99',.05);fill(.14,.14,.72,.12,'#4c6157');}else{oval(.5,.5,.43,.46,'#87907b');oval(.5,.48,.30,.33,'#47584d');line([[.25,.30],[.75,.30]],metal,.07);}break;
   case 'compost':fill(.09,.11,.83,.82,'#514f3d');for(let k=0;k<4;k++)line([[.09,.15+k*.21],[.91,.15+k*.21]],wood,.09);box(.09,.11,.83,.82,wood,.09);oval(.48,.49,.25,.25,v?'#7a7247':'#576b43');break;
   case 'waterButt':case 'barrel':oval(.50,.50,.43,.46,v?'#73887a':'#91876c');oval(.5,.44,.34,.30,kind==='waterButt'?'#597e82':'#59695c');box(.40,.32,.2,.2,metal,.06);break;
   case 'basket':case 'laundryBasket':if(v)oval(.50,.51,.43,.40,wood);else fill(.07,.16,.85,.76,wood);box(.10,.15,.80,.69,'#c0b692',.075);for(let k=1;k<5;k++)line([[.13,.2+k*.10],[.86,.2+k*.10]],'#5a614c');if(kind==='laundryBasket'){oval(.36,.30,.20,.13,'#aab9ac');oval(.64,.33,.18,.15,'#d0c4a2');}break;
   case 'tire':oval(.5,.5,.46,.45,'#404c42');oval(.5,.5,.25,.25,'#9a9f83');box(.2,.18,.6,.63,'#555e51',.035);break;
   case 'crate':case 'pallet':case 'crateStack':case 'fallenStock':case 'scrapHeap':for(let k=0;k<3;k++){fill(.05+k*.09,.08+k*.20,.83-k*.05,.20,kind==='scrapHeap'?metal:wood);box(.06+k*.09,.09+k*.20,.81-k*.05,.17,'#bac1a4',.03);}break;
   case 'lamp':oval(.5,.5,.34,.40,'#66786c');oval(.5,.5,.20,.24,'#c0b78d');line([[.25,.50],[.73,.50]],metal,.06);break;
   case 'bikeRack':for(let k=0;k<4;k++)box(.08+k*.23,.15,.17,.70,metal,.075);line([[.03,.88],[.96,.88]],'#536b5c',.055);break;
   case 'clothesline':case 'laundryLine':line([[.03,.25],[.97,.25]],'#b1b397',.045);for(let k=0;k<4;k++){fill(.10+k*.22,.26,.15,.60,['#d0c5a8','#8faaa0','#8d9273'][(k+v)%3]);line([[.13+k*.22,.14],[.13+k*.22,.31]],wood);}break;
   case 'sign':fill(.09,.16,.82,.62,v?'#5b796b':'#aa9d75');box(.09,.16,.82,.62,metal,.045);line([[.21,.47],[.75,.47],[.63,.30]],'#d1cbae',.08);fill(.17,.82,.06,.11,metal);fill(.76,.82,.06,.11,metal);break;
   case 'cart':box(.20,.13,.64,.61,metal,.07);for(let k=0;k<4;k++)line([[.25+k*.16,.19],[.25+k*.16,.70]],'#506b5e',.035);line([[.04,.10],[.14,.10],[.22,.74],[.85,.74]],metal,.065);oval(.29,.87,.07,.065,'#34453a');oval(.77,.87,.07,.065,'#34453a');break;
   case 'canopy':fill(.05,.07,.90,.86,v?'#687965':'#aaa187');line([[.06,.12],[.94,.85]],'#c8c3a7');line([[.94,.12],[.06,.85]],'#8b9a82',.035);for(const a of[.08,.90])for(const b of[.09,.88])fill(a,b,.025,.035,'#354f43');break;
   case 'bollard':oval(.5,.5,.33,.39,metal);oval(.5,.48,.22,.27,'#d2bc89');line([[.31,.43],[.70,.43]],'#6b7465',.08);break;
   case 'tv':fill(.03,.06,.94,.83,v?'#424d46':'#566458');fill(.12,.14,.76,.58,'#203d3a');line([[.2,.21],[.58,.21]],'#728c7d',.027);fill(.39,.9,.24,.055,metal);break;
   case 'paper':case 'menu':case 'notice':fill(.08,.08,.83,.84,kind==='notice'?'#938063':v?'#b9b494':'#d4caae');if(kind==='notice'){fill(.22,.22,.50,.59,'#d3c9a8');oval(.48,.16,.035,.05,'#746047');}for(let k=0;k<3;k++)line([[.24,.29+k*.18],[k===2?.61:.76,.29+k*.18]],'#827d67',.035);break;
   case 'tray':if(v){oval(.5,.50,.43,.40,metal);oval(.5,.50,.32,.28,'#b7c0ac');}else{fill(.04,.08,.92,.83,metal);box(.12,.20,.76,.56,'#c6ccba',.06);}break;
   case 'screen':fill(.07,.07,.86,.81,v?'#62796e':'#8b9c84');box(.08,.08,.84,.80,metal,.07);line([[.15,.26],[.80,.26]],'#b2c2a5',.08);fill(.18,.92,.64,.04,metal);break;
   case 'toy':if(v){oval(.5,.53,.31,.30,'#ad9465');oval(.29,.22,.12,.16,'#a49068');oval(.70,.22,.12,.16,'#a49068');oval(.46,.46,.035,.045,'#384940');oval(.60,.46,.035,.045,'#384940');}else{oval(.50,.5,.44,.44,'#b6ad84');line([[.15,.24],[.86,.74]],'#718573',.075);line([[.23,.84],[.76,.15]],'#718573',.075);}break;
   case 'toolbox':fill(.08,.28,.84,.61,'#56726a');box(.31,.10,.38,.19,metal,.065);fill(.10,.29,.8,.10,metal);box(.08,.28,.84,.61,'#a8ad95',.06);fill(.43,.41,.13,.17,'#c2b08a');break;
   case 'sink':fill(.04,.04,.92,.92,metal);oval(.5,.52,.34,.34,'#4e665c');oval(.5,.52,.23,.24,'#bac7b6');line([[.50,.14],[.50,.32],[.63,.32]],'#d0d1bd',.06);break;
   case 'shower':fill(.04,.04,.92,.92,'#bec2ac');box(.06,.05,.89,.90,metal,.07);oval(.76,.22,.07,.075,'#687f73');line([[.76,.21],[.76,.54]],metal,.06);oval(.30,.72,.04,.045,'#556b5e');break;
   case 'toilet':{
    const form=variantFor(o,seed,4),porcelain=['#c8c9b4','#b8c4b6','#d0c9b2','#aebdb4'][form];
    if(form===0){
     fill(.10,.07,.80,.24,porcelain);box(.10,.07,.80,.24,'#6a7a70',.045);fill(.20,.13,.12,.06,metal);
     oval(.50,.62,.34,.30,porcelain);oval(.50,.62,.25,.23,'#788a7e');oval(.50,.63,.17,.17,'#455f56');fill(.38,.90,.24,.05,metal);
    }else if(form===1){
     fill(.13,.05,.74,.19,porcelain);box(.13,.05,.74,.19,'#6a7a70',.04);fill(.76,.24,.11,.055,metal);fill(.46,.20,.08,.12,porcelain);
     oval(.50,.60,.28,.35,porcelain);oval(.50,.61,.20,.28,'#788a7e');oval(.50,.62,.13,.21,'#455f56');fill(.41,.91,.18,.04,metal);
    }else if(form===2){
     oval(.50,.18,.40,.13,porcelain);oval(.50,.17,.055,.035,metal);
     oval(.50,.61,.35,.33,'#788a7e');oval(.50,.60,.31,.29,porcelain);
     line([[.34,.39],[.66,.39]],'#6a7a70',.025);line([[.34,.73],[.57,.78]],'#dcd9c2',.025);
    }else{
     fill(.20,.06,.60,.16,porcelain);box(.20,.06,.60,.16,'#6a7a70',.03);fill(.39,.11,.08,.05,metal);fill(.52,.11,.11,.05,metal);
     fill(.44,.21,.12,.11,porcelain);oval(.50,.64,.38,.28,porcelain);oval(.50,.65,.29,.20,'#788a7e');oval(.50,.66,.21,.13,'#455f56');
    }
    line([[.32,.35],[.68,.35]],'#e0dbc2',.035);break;
   }
   case 'latrine':{
    const form=variantFor(o,seed,4),planks=['#8b7758','#9c8765','#726b50','#a38b62'][form];
    fill(.05,.08,.90,.84,planks);box(.05,.08,.90,.84,'#4b5546',.055);
    if(form===0){
     for(let k=0;k<4;k++)line([[.10,.18+k*.20],[.90,.18+k*.20]],'#544f3e',.025);
     oval(.50,.56,.26,.27,'#c0ab7b');oval(.50,.56,.18,.19,'#303f34');fill(.10,.12,.12,.12,'#c7bea0');
    }else if(form===1){
     for(let k=0;k<4;k++)line([[.18+k*.20,.12],[.18+k*.20,.88]],'#544f3e',.025);
     fill(.23,.24,.54,.57,'#b19a6d');box(.23,.24,.54,.57,'#5c5e48',.025);oval(.50,.55,.17,.21,'#303f34');fill(.77,.12,.12,.12,'#c7bea0');
    }else if(form===2){
     for(const[a,b]of[[.12,.32],[.12,.57],[.12,.82],[.32,.88],[.57,.88]])line([[a,b],[Math.min(.88,a+.55),Math.max(.12,b-.55)]],'#4b5240',.025);
     fill(.13,.28,.18,.47,'#b29d70');fill(.69,.28,.18,.47,'#b29d70');oval(.50,.55,.13,.25,'#303f34');
     for(const a of[.17,.73])for(let k=0;k<3;k++)line([[a,.38+k*.12],[a+.10,.38+k*.12]],'#766e50',.025);
    }else{
     for(let k=0;k<3;k++)line([[.10,.24+k*.28],[.90,.24+k*.28]],'#544f3e',.035);
     fill(.22,.28,.56,.53,'#b6a174');box(.22,.28,.56,.53,'#565d47',.035);line([[.22,.32],[.78,.32]],metal,.035);
     fill(.43,.64,.14,.055,'#4b5a48');fill(.26,.27,.08,.05,metal);fill(.66,.27,.08,.05,metal);
    }
    line([[.13,.87],[.87,.87]],metal,.035);break;
   }
   case 'machine':fill(.04,.07,.92,.86,'#53675e');box(.06,.09,.88,.81,metal,.05);fill(.12,.2,.30,.60,'#8a9a8c');fill(.47,.24,.42,.52,'#293f35');for(let k=0;k<4;k++)fill(.52+k*.08,.25,.03,.5,metal);oval(.28,.49,.10,.18,'#334e42');fill(.14,.13,.20,.05,'#b6a574');break;
   case 'bed':case 'sofa':case 'shelf':case 'fridge':case 'desk':case 'workbench':case 'counter':case 'medical':case 'oven':case 'washer':case 'electricalRack':case 'hoseRack':fill(.04,.06,.92,.88,wood);box(.04,.06,.92,.88,metal,.05);fill(.12,.17,.76,.16,metal);break;
   default:return false;
  }
  return true;
 }
 function signFootprint163(c,o,seed){
  // The upright road atlas cannot fit a thin overhead board: its pole would
  // shrink the whole image to a dot. Detail12 uses the actual board footprint.
  const v=variantFor(o,seed,4),{x,y,w,h}=o,panel=['#7d8a7f','#9b8870','#586e63','#a49d80'][v];
  c.fillStyle='#35483e';c.fillRect(x,y,w,h);
  c.fillStyle=panel;c.fillRect(x+w*.025,y+h*.12,w*.95,h*.76);
  c.fillStyle='#c2b994';c.fillRect(x+w*.04,y+h*.15,w*.92,h*.09);
  c.fillStyle='#5d5745';
  for(let i=0;i<4;i++)c.fillRect(x+w*(.13+i*.23),y+h*(i%2?.62:.28),w*(v%2?.07:.04),h*.17);
  c.fillStyle=v===2?'#d0c5a4':'#9b9d87';
  for(const edge of [.045,.925])c.fillRect(x+w*edge,y+h*.32,w*.03,h*.36);
  return true;
 }
 function paintFixture164(c,o,{seed=0}={}){
  const kind=o?.fixture164?.kind;
  if(!c||o?.fixture164?.revision!==13||!['careBed','medicalShelf','firstAidRoll','treatmentTray'].includes(kind)||![o.x,o.y,o.w,o.h].every(Number.isFinite)||o.w<=0||o.h<=0)return false;
  const{x,y,w,h}=o,v=variantFor(o,seed,4),sheet=['#b3c3b6','#c5c4ab','#9eb6ac','#c9ccb7'][v],trim=['#567c6c','#697e78','#617c68','#827c62'][v];
  const fill=(a,b,d,e,color)=>{c.fillStyle=color;c.fillRect(x+a*w,y+b*h,d*w,e*h);};
  const cross=(a,b,size)=>{fill(a+size*.37,b,size*.26,size,'#dfd7b8');fill(a,b+size*.37,size,size*.26,'#dfd7b8');};
  const line=(points,color,t=.025)=>{c.strokeStyle=color;c.lineWidth=Math.min(w,h)*t;c.beginPath();points.forEach(([a,b],k)=>k?c.lineTo(x+a*w,y+b*h):c.moveTo(x+a*w,y+b*h));c.stroke();};
  const oval=(a,b,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x+a*w,y+b*h,rx*w,ry*h,0,0,Math.PI*2);c.fill();};
  const bottle=(a,b,width,height)=>{fill(a,b,width,height,sheet);fill(a,b,width,height*.16,'#496e61');fill(a+width*.15,b+height*.48,width*.70,height*.17,'#dfd7b8');};
  c.save();try{
   c.beginPath();c.rect(x,y,w,h);c.clip();
   if(kind==='careBed'){
    fill(.11,.12,.78,.76,sheet);
    if(v===0){fill(.13,.15,.16,.69,'#d5d2b7');fill(.36,.15,.05,.69,trim);fill(.73,.15,.05,.69,trim);fill(.44,.33,.24,.34,trim);cross(.49,.39,.14);}
    else if(v===1){fill(.70,.15,.16,.69,'#d5d2b7');fill(.12,.15,.26,.69,trim);for(const b of[.23,.42,.61])line([[.15,b],[.34,b]],sheet);fill(.48,.40,.15,.25,trim);cross(.51,.45,.09);}
    else if(v===2){fill(.14,.18,.18,.26,'#d5d2b7');fill(.14,.56,.18,.26,'#d5d2b7');fill(.36,.53,.50,.30,trim);line([[.39,.58],[.83,.58]],sheet);cross(.55,.62,.12);}
    else{fill(.14,.16,.20,.63,'#d5d2b7');for(const a of[.37,.70]){fill(a,.14,.065,.72,trim);fill(a-.006,.45,.077,.10,'#c0b590');}fill(.49,.31,.16,.31,trim);cross(.52,.40,.10);for(const b of[.06,.89])fill(.17,b,.23,.045,'#94a398');}
   }else if(kind==='medicalShelf'){
    if(v===0)for(let k=0;k<3;k++){const a=.10+k*.28;fill(a,.22,.22,.53,sheet);fill(a,.22,.22,.10,trim);cross(a+.065,.39,.09);fill(a+.03,.68,.16,.025,'#777e6b');}
    else if(v===1){for(const a of[.12,.53]){fill(a,.20,.30,.59,sheet);fill(a,.20,.30,.12,trim);cross(a+.09,.41,.12);}fill(.15,.80,.69,.045,trim);}
    else if(v===2){fill(.10,.23,.35,.54,sheet);fill(.10,.23,.35,.10,trim);cross(.22,.42,.11);for(const a of[.51,.64,.77])bottle(a,.29,.085,.43);}
    else{for(let k=0;k<3;k++){fill(.10+k*.018,.20+k*.18,.36,.14,k%2?trim:sheet);line([[.14,.25+k*.18],[.42,.25+k*.18]],'#d3cfb5',.015);}fill(.61,.20,.28,.56,trim);fill(.65,.23,.20,.49,sheet);cross(.70,.40,.10);for(const b of[.29,.66])fill(.64,b,.22,.035,'#768a7b');bottle(.51,.39,.055,.30);}
   }else if(kind==='firstAidRoll'){
    if(v===0){fill(.11,.24,.62,.50,sheet);fill(.18,.24,.05,.50,trim);fill(.59,.24,.05,.50,trim);fill(.74,.25,.17,.45,trim);cross(.77,.37,.10);}
    else if(v===1){fill(.11,.22,.28,.56,trim);cross(.18,.37,.14);for(const b of[.25,.49]){fill(.50,b,.40,.16,sheet);fill(.57,b,.035,.16,trim);fill(.79,b,.035,.16,trim);}}
    else if(v===2){for(const a of[.10,.36]){fill(a,.28,.21,.46,sheet);line([[a+.10,.31],[a+.10,.71]],trim,.035);}fill(.65,.24,.16,.53,'#bba781');fill(.68,.33,.10,.055,trim);fill(.68,.59,.10,.055,trim);fill(.83,.42,.07,.17,sheet);}
    else{fill(.10,.24,.20,.52,sheet);fill(.32,.20,.44,.60,trim);fill(.37,.29,.34,.42,'#415c50');for(let k=0;k<3;k++)line([[.39,.36+k*.12],[.68,.36+k*.12]],sheet,.035);bottle(.82,.29,.065,.39);}
   }else{
    fill(.15,.16,.70,.68,'#526e62');fill(.20,.22,.60,.56,'#a8b8aa');
    if(v===0){fill(.55,.28,.22,.40,trim);cross(.59,.39,.13);for(const a of[.25,.35])bottle(a,.30,.065,.34);}
    else if(v===1){fill(.23,.27,.25,.38,trim);cross(.29,.38,.12);for(const a of[.57,.69]){line([[a,.31],[a,.65]],'#d7d3b7',.035);line([[a-.025,.35],[a+.025,.35]],'#d7d3b7',.025);}fill(.24,.70,.50,.035,sheet);}
    else if(v===2){fill(.23,.27,.17,.44,sheet);fill(.27,.27,.035,.44,trim);for(const a of[.49,.60,.71])bottle(a,.30,.055,.35);fill(.48,.67,.28,.08,trim);}
    else{oval(.47,.49,.25,.23,'#4d6a5e');oval(.47,.49,.20,.17,'#bec7b1');line([[.35,.40],[.57,.56]],trim,.035);line([[.37,.57],[.54,.43]],'#d7d3b7',.025);bottle(.23,.30,.06,.31);fill(.68,.27,.10,.19,trim);cross(.70,.32,.065);}
   }
   return true;
  }finally{c.restore();}
 }
 function draw(c,o,{art=root.DEADWALL?.art,seed=root.DEADWALL?.world?.seed??0}={}){
  if(o?.garden171){
   const {spriteWidth171:w,spriteHeight171:h,angle171:a}=o;if(!c||![o.x,o.y,o.w,o.h,w,h,a].every(Number.isFinite)||w<=0||h<=0||o.w<=0||o.h<=0)return false;
   c.save();try{c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.translate(o.x+o.w/2,o.y+o.h/2);c.rotate(a);return draw(c,{...o,garden171:false,x:-w/2,y:-h/2,w,h},{art,seed});}finally{c.restore();}
  }
  if(o?.infill169){
   const painter=root.DeadwallCodexInfill169Art||(typeof require==='function'?require('./codex-infill169-art.js'):null);
   if(!c||![o.x,o.y,o.w,o.h,o.angle169,o.spriteWidth169,o.spriteHeight169].every(Number.isFinite)||o.w<=0||o.h<=0||o.spriteWidth169<=0||o.spriteHeight169<=0)return false;
   c.save();try{c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.translate(o.x+o.w/2,o.y+o.h/2);c.rotate(o.angle169);
    const local={...o,infill169:false,x:-o.spriteWidth169/2,y:-o.spriteHeight169/2,w:o.spriteWidth169,h:o.spriteHeight169};
    return painter?.draw(c,local)||draw(c,local,{art,seed});
   }finally{c.restore();}
  }
  if(o?.station170){
   const {spriteWidth170:w,spriteHeight170:h,angle170:a}=o;if(!c||![o.x,o.y,o.w,o.h,w,h,a].every(Number.isFinite)||w<=0||h<=0)return false;
   c.save();try{c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.translate(o.x+o.w/2,o.y+o.h/2);c.rotate(a);return draw(c,{...o,station170:false,x:-w/2,y:-h/2,w,h},{art,seed});}finally{c.restore();}
  }
  if(o?.dressing160){const painter=root.DeadwallCodexDressing160||(typeof require==='function'?require('./codex-dressing160.js'):null);
   if(c&&Number.isFinite(o.surfaceAngle165)){const sw=o.surfaceWidth165,sh=o.surfaceHeight165;if(!Number.isFinite(sw+sh)||sw<=0||sh<=0)return false;
    c.save();try{c.translate(o.x+o.w/2,o.y+o.h/2);c.rotate(o.surfaceAngle165);return painter?.draw(c,{...o,x:-sw/2,y:-sh/2,w:sw,h:sh})||false;}finally{c.restore();}
   }return painter?.draw(c,o)||false;
  }
  if(!c||!valid(o))return false;c.save();
  if(o.ensemble165&&Number.isFinite(o.angle165)){
   const sw=o.spriteWidth165,sh=o.spriteHeight165;if(!Number.isFinite(sw+sh)||sw<=0||sh<=0){c.restore();return false;}
   try{c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.translate(o.x+o.w/2,o.y+o.h/2);c.rotate(o.angle165);
    return draw(c,{...o,ensemble165:false,x:-sw/2,y:-sh/2,w:sw,h:sh},{art,seed});
   }finally{c.restore();}
  }
  if(o.anchored160){
   const a=o.angle160,sw=o.spriteWidth160,sh=o.spriteHeight160;
   if(!Number.isFinite(a+sw+sh)||sw<=0||sh<=0){c.restore();return false;}
   try{const cx=o.x+o.w/2,cy=o.y+o.h/2;
    c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.translate(cx,cy);c.rotate(a);
    const painted=draw(c,{...o,anchored160:false,x:-sw/2,y:-sh/2,w:sw,h:sh},{art,seed});
    // Contents share the real furniture transform and clip, including quarter turns.
    // Rendering must not append colliders or turn source prescriptions into loot.
    const contents=root.DeadwallCodexDressing160||(typeof require==='function'?require('./codex-dressing160.js'):null);
    if(painted&&contents?.surfaceItems165)for(const child of contents.surfaceItems165(o,seed))contents.draw(c,child);
    return painted;
   }finally{c.restore();}
  }
  try{
   // Parcel rotation and current floor belong to the caller. Uniform source
   // scaling plus this clip preserves the physical blocker and open entrances.
   if(typeof c.rect==='function'&&typeof c.clip==='function'){c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();}
   if(o.kind==='sign'&&(o.size163?.revision===12||o.density163===true))return signFootprint163(c,o,seed);
   return paintImage(c,o,art,seed)||fallback(c,o,seed);
  }finally{c.restore();}
 }
 return Object.freeze({PRESENTATIONS,presentationFor,variantFor,valid,paintImage,fallback,paintFixture164,draw});
});
