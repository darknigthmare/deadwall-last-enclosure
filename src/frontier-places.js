/* 1.16: additional codex plans. New region generation only; historical layouts remain reproducible. */
(function(root){'use strict';
const PRESETS=[
['bakery','Boulangerie artisanale',22,17,[0],'DW-0065'],['library','Bibliothèque municipale',32,24,[0,1],'DW-0153'],['garden','Jardinerie',36,28,[0],'DW-0046'],['veterinary','Clinique vétérinaire',26,20,[0],'DW-0097'],
['laundry','Laverie automatique',21,15,[0],'DW-0085'],['firestation','Caserne de pompiers',36,28,[0,1],'DW-0181'],['selfstorage','Garde-meubles',36,26,[0],'DW-0224'],['marketgarden','Exploitation maraîchère',32,24,[0],'DW-0367'],
['postoffice','Bureau postal',28,22,[0],'DW-0082'],['gym','Gymnase municipal',38,28,[0],'DW-0444'],['inn','Auberge de village',28,23,[0,1],'DW-0104'],['scrapyard','Casse automobile',35,25,[0],'DW-0251']
].map(([id,name,w,h,levels,codex])=>Object.freeze({id,name,w,h,levels,layout:'places116',codex}));
const BY=Object.freeze(Object.fromEntries(PRESETS.map(p=>[p.id,p])));
function plan(p,z,G){const d=BY[p.type];if(!d?.levels.includes(z))throw Error('Plan de lieu inconnu');const w=p.w,h=p.h,mid=w/2,hall=3.2,lo=mid-hall/2,hi=mid+hall/2,t=.24,walls=[],rooms=[],objects=[],stairs=[];let count=0;
 const wall=(x,y,w,h)=>{if(w>.01&&h>.01)walls.push({x,y,w,h});};
 const horizontal=(x,y,w,door,width=1.7)=>{wall(x,y,door-width/2-x,t);wall(door+width/2,y,x+w-door-width/2,t);};
 const vertical=(x,y,h,door,width=1.7)=>{wall(x,y,t,door-width/2-y);wall(x,door+width/2,t,y+h-door-width/2);};
 horizontal(0,0,w,mid,3);horizontal(0,h-t,w,mid,2.3);wall(0,0,t,h);wall(w-t,0,t,h);
 function add(kind,x,y,room,resource=null){const shape=G.SHAPES[kind]||G.SHAPES.crate;objects.push({id:p.id+':'+z+':'+count++,kind,x,y,w:shape[0],h:shape[1],a:0,resource:resource||G.RESOURCES[kind]||'scrap',amount:6+G.hash(p.id,z,count)%16,room});}
 function room(name,x,y,rw,rh,kinds,density=1){rooms.push({name,x,y,w:rw,h:rh});const poses=[[x+.65,y+.65],[x+rw-3.6,y+.65],[x+.65,y+rh-2.7],[x+rw-3.6,y+rh-2.7]];kinds.forEach((v,i)=>{const[k,r]=v.split('/'),q=poses[i%4];add(k,q[0],q[1],name,r)});if(density>1)for(let yy=y+3.6;yy<y+rh-3;yy+=3.8)add(kinds[0].split('/')[0],x+.7,yy,name,kinds[0].split('/')[1]);}
 function cells(left,right){const n=Math.max(left.length,right.length),rh=(h-.8)/n;for(let i=0;i<n;i++){const yy=.4+i*rh;if(i){wall(.24,yy,lo-.24,t);wall(hi,yy,w-hi-.24,t);}vertical(lo,yy,rh,yy+rh/2);vertical(hi,yy,rh,yy+rh/2);const l=left[i%left.length],r=right[i%right.length];room(l[0],.35,yy+.25,lo-.65,rh-.5,l[1],l[2]);room(r[0],hi+.35,yy+.25,w-hi-.7,rh-.5,r[1],r[2]);}}
 const type=p.type;
 if(type==='bakery')cells([['Boutique — pains et conserves',['shelf/food','counter/food']],['Fournil — four et pétrin',['oven','machine','workbench']]], [['Réserve de farine',['crate/food','shelf/food']],['Plonge et vestiaire',['sink','wardrobe']]]);
 if(type==='veterinary')cells([['Accueil et dossiers',['counter','desk']],['Consultation',['medical','table']],['Soins et nettoyage',['medical','sink']]], [['Pharmacie vétérinaire',['medical','shelf/medicine']],['Chenil vide',['kennel','kennel']],['Réserve alimentation',['crate/food','shelf/food']]]);
 if(type==='library')cells(z===0?[['Prêts et accueil',['counter','desk']],['Rayons — littérature',['shelf/wood','shelf/wood'],2],['Lecture et presse',['table','desk']]]:[['Consultation calme',['desk','table']],['Fonds ancien',['shelf/wood','wardrobe']],['Atelier documentaire',['desk','crate']]], [['Collections',['shelf/wood','shelf/wood'],2],['Réserve documentaire',['wardrobe','crate/wood']],['Bureau et local technique',['desk','workbench']]]);
 if(type==='selfstorage'){const left=[],right=[];for(let i=0;i<4;i++){left.push(['Box '+(i*2+1),i%2?['sofa','wardrobe']:['crate','shelf']]);right.push(['Box '+(i*2+2),i%2?['bed','table']:['workbench','crate']]);}cells(left,right);}
 if(type==='inn'&&z===1)cells([['Chambre 1',['bed','wardrobe']],['Chambre 3',['bed','desk']],['Lingerie',['wardrobe','crate/wood']]], [['Chambre 2',['bed','wardrobe']],['Chambre 4',['bed','wardrobe']],['Salle d’eau',['sink','wardrobe']]]);
 if(type==='firestation'&&z===1)cells([['Repos de garde',['bed','wardrobe']],['Repos de garde',['bed','desk']],['Réfectoire',['table','fridge']]], [['Vestiaires',['wardrobe','medical']],['Salle de coordination',['desk','counter']],['Archives techniques',['shelf','workbench']]]);
 if(type==='laundry'){const split=h-4.8;horizontal(.24,split,w-.48,mid,2.3);room('Salle de lavage',.4,.4,lo-.5,split-.7,['washer','washer'],3);room('Pliage et attente',hi+.3,.4,w-hi-.6,split-.7,['table','bench','counter']);room('Maintenance arrière',.4,split+.5,lo-.5,4,['workbench','crate']);room('Rangements',hi+.3,split+.5,w-hi-.6,4,['shelf','sink']);}
 if(['garden','marketgarden','postoffice','scrapyard'].includes(type)){const cut=h-6.5;horizontal(.24,cut,w-.48,mid,2.3);const front=type==='garden'?['Serre de vente',['plantTray/food','plantTray/food']]:type==='marketgarden'?['Lavage et tri des récoltes',['sink','table','crate/food']]:type==='postoffice'?['Accueil et tri des colis',['counter','shelf','crate']]:['Atelier de démontage',['machine','workbench','tirePile']];room(front[0],.4,.5,lo-.6,cut-.8,front[1],2);room(type==='postoffice'?'Casiers et expédition':type==='scrapyard'?'Pièces détachées':'Préparation et réserve',hi+.3,.5,w-hi-.6,cut-.8,type==='scrapyard'?['shelf','tirePile','fuel']:type==='postoffice'?['shelf','crate','desk']:['plantTray/food','crate/food','workbench'],2);room('Bureau',.4,cut+.5,lo-.6,5.5,['desk','wardrobe']);room('Stock et livraison',hi+.3,cut+.5,w-hi-.6,5.5,type==='scrapyard'?['fuel','crate']:['crate','workbench']);}
 if(type==='firestation'&&z===0){const cut=h-7;horizontal(.24,cut,w-.48,mid,3);room('Remise matériel',.4,.5,lo-.7,cut-1,['hoseRack','workbench','medical'],2);room('Atelier et équipements',hi+.3,.5,w-hi-.6,cut-1,['machine','wardrobe','fuel'],2);room('Accueil',.4,cut+.5,lo-.7,6,['counter','desk']);room('Réserve secours',hi+.3,cut+.5,w-hi-.6,6,['medical','crate/food']);}
 if(type==='gym'){const cut=h-6;horizontal(.24,cut,w-.48,mid,2.5);rooms.push({name:'Plateau sportif',x:.4,y:.4,w:w-.8,h:cut-.6});add('bench',1,4,'Bancs');add('bench',w-3,4,'Bancs');room('Vestiaires',.4,cut+.5,lo-.6,5,['wardrobe','bench']);room('Matériel sportif',hi+.3,cut+.5,w-hi-.6,5,['shelf','crate']);}
 if(type==='inn'&&z===0){const cut=h-7;horizontal(.24,cut,w-.48,mid,2);room('Salle commune',.4,.5,lo-.6,cut-.8,['table','table','sofa'],2);room('Comptoir et repas',hi+.3,.5,w-hi-.6,cut-.8,['counter/food','table','fridge']);room('Cuisine',.4,cut+.5,lo-.6,6,['oven','sink','fridge']);room('Cellier et livraison',hi+.3,cut+.5,w-hi-.6,6,['crate/food','shelf/food']);}
 if(d.levels.length>1)stairs.push({id:p.id+':stairs',x:mid-1.05,y:h-4,w:2.1,h:2.9,levels:d.levels});
 const clean=[];for(const o of objects){const b={l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h};if(o.x<.32||o.y<.32||b.r>w-.32||b.b>h-.32||walls.some(a=>G.overlap(b,{l:a.x,r:a.x+a.w,t:a.y,b:a.y+a.h},.1))||stairs.some(a=>G.overlap(b,{l:a.x,r:a.x+a.w,t:a.y,b:a.y+a.h},.2))||clean.some(a=>G.overlap(b,{l:a.x,r:a.x+a.w,t:a.y,b:a.y+a.h},.2)))continue;clean.push(o);}
 return{walls,rooms,objects:clean,stairs,floor:{x:.24,y:.24,w:w-.48,h:h-.48},entry:G.global(p,mid,-1),exit:G.global(p,mid,h+1),style:type};
}
function outdoor(p,G){if(p.generation!==2)return[];const out=[],w=p.w,h=p.h;const add=(kind,x,y,resource)=>{const shape=G.SHAPES[kind]||[1.2,.8];out.push({id:p.id+':out:'+out.length,kind,x,y,w:shape[0],h:shape[1],a:0,resource:resource||G.RESOURCES[kind]||'scrap',amount:5+G.hash(p.id,'out',out.length)%16,room:'Cour de service'});};
if(['fuel','garage','scrapyard','firestation'].includes(p.type)){add('fuel',-5,h*.4,'fuel');add('tirePile',w+3,h*.4,'scrap');add(p.type==='fuel'?'pump':'workbench',-5,h*.4+4,p.type==='fuel'?'fuel':'scrap');}
else if(['garden','marketgarden'].includes(p.type)){for(let i=0;i<3;i++){add('plantTray',2+i*5,h+6,'food');add('crate',2+i*5,h+10,'wood');}}
else if(p.type==='sawmill'){for(let i=0;i<3;i++)add('logs',1+i*6,h+6,'wood');}
else if(['mall','market','warehouse','selfstorage','postoffice','hardware','bakery'].includes(p.type)){for(let i=0;i<3;i++)add('crate',2+i*3,h+5,p.type==='bakery'||p.type==='market'?'food':'scrap');add('shelf',w-5,h+5,'scrap');}
else if(['clinic','veterinary'].includes(p.type)){add('medical',2,h+4,'medicine');add('crate',w-3,h+4,'scrap');}
else if(['house','duplex','cabin','inn'].includes(p.type)){add('table',2,h+5,'wood');add('crate',w-3,h+5,'wood');}
if(p.extendedService&&out.length===0){
 // Service yards reuse the existing finite-container economy; no repeatable grant is created.
 if(['mine','quarry'].includes(p.type)){add('rubble',2,h+5,'stone');add(p.type==='mine'?'timberRack':'palletStack',7,h+5,'wood');add('fuel',w-3,h+5,'fuel');}
 else if(['school','library','townhall','gym'].includes(p.type)){add('bench',2,h+5,'wood');add('crate',w-4,h+5,p.type==='library'?'wood':'scrap');}
 else if(['hotel','motel'].includes(p.type)){add('washer',2,h+5,'scrap');add('crate',7,h+5,'wood');add('shelf',w-5,h+5,'scrap');}
 else if(p.type==='diner'){add('crate',2,h+5,'food');add('dishRack',w-4,h+5,'scrap');}
 else if(p.type==='bunker'){add('crate',2,h+5,'food');add('medical',w-4,h+5,'medicine');}
 else if(p.type==='ruin'){add('rubble',2,h+5,'stone');add('timberRack',w-5,h+5,'wood');}
 else if(p.type==='apartments'){add('bench',2,h+5,'wood');add('crate',w-4,h+5,'scrap');}
}
return out;
}
const api=Object.freeze({PRESETS,BY,plan,outdoor});root.DeadwallFrontierPlaces=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
