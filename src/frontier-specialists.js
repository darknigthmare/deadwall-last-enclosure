/* Original game locations for region generation 3. */
(function(root){'use strict';
const PRESETS=[
['basementHouse','Maison sur sous-sol',18,15,[-1,0],'DW-0004'],
['pharmacy','Pharmacie commerciale',24,18,[0],'DW-0053'],
['centralKitchen','Cuisine centrale',38,29,[0],'DW-0073'],
['dental','Cabinet dentaire',25,20,[0],'DW-0126'],
['reuse','Recyclerie',40,28,[0],'DW-0237'],
['freight','Halle fret désaffectée',46,24,[0],'DW-0289'],
['joinery','Atelier de menuiserie',35,26,[0],'DW-0306'],
['generatorRoom','Local groupe électrogène',16,13,[0],'DW-0331']
].map(([id,name,w,h,levels,codex])=>Object.freeze({id,name,w,h,levels,codex,layout:'specialists117'}));
const BY=Object.freeze(Object.fromEntries(PRESETS.map(p=>[p.id,p])));
function plan(p,z,G){const d=BY[p.type];if(!d?.levels.includes(z))throw Error('Plan absent');const w=p.w,h=p.h,mid=w/2,lo=mid-1.6,hi=mid+1.6,t=.24,walls=[],rooms=[],objects=[],stairs=[];let seq=0;
const wall=(x,y,w,h)=>{if(w>.01&&h>.01)walls.push({x,y,w,h});};
function horizontal(x,y,len,door,width=1.7){wall(x,y,door-width/2-x,t);wall(door+width/2,y,x+len-door-width/2,t);}
function vertical(x,y,len,door,width=1.7){wall(x,y,t,door-width/2-y);wall(x,door+width/2,t,y+len-door-width/2);}
horizontal(0,0,w,mid,3);horizontal(0,h-t,w,mid,2.3);wall(0,0,t,h);wall(w-t,0,t,h);
function add(kind,x,y,room,resource){const shape=G.SHAPES[kind];if(!shape)throw Error('Gabarit absent');objects.push({id:p.id+':'+z+':'+seq++,kind,x,y,w:shape[0],h:shape[1],a:0,resource:resource||G.RESOURCES[kind]||'scrap',amount:7+G.hash(p.id,z,'specialist',seq)%16,room});}
function room(name,x,y,rw,rh,items){rooms.push({name,x,y,w:rw,h:rh});const pos=[[x+.6,y+.6],[x+.6,y+rh-3],[x+rw-3.7,y+.6],[x+rw-3.7,y+rh-3]];items.forEach((spec,i)=>{const[k,res]=spec.split('/'),q=pos[i%4];add(k,q[0],q[1],name,res||null);});}
function cells(left,right){const n=Math.max(left.length,right.length),rh=(h-.8)/n;for(let i=0;i<n;i++){const y=.4+i*rh;if(i){wall(.24,y,lo-.24,t);wall(hi,y,w-hi-.24,t);}vertical(lo,y,rh,y+rh/2);vertical(hi,y,rh,y+rh/2);const l=left[i%left.length],r=right[i%right.length];room(l[0],.35,y+.25,lo-.65,rh-.5,l[1]);room(r[0],hi+.35,y+.25,w-hi-.7,rh-.5,r[1]);}}
if(p.type==='basementHouse')cells(z===0?[['Séjour et repas',['sofa','table']],['Chambre et rangement',['bed','wardrobe']]]:[['Cave à provisions',['shelf/food','crate/food']],['Atelier domestique',['workbench','crate']]],z===0?[['Cuisine familiale',['fridge','sink']],['Salle d’eau et cellier',['sink','wardrobe']]]:[['Buanderie',['washer','sink']],['Chaufferie arrêtée',['generator','fuel']]]);
if(p.type==='dental')cells([['Accueil et attente',['counter','bench']],['Salle de soins A',['dentalChair','medical']],['Salle de soins B',['dentalChair','desk']]], [['Stérilisation',['sterilizer','sink']],['Stock propre',['medical','shelf/medicine']],['Vestiaire et bureau',['wardrobe','desk']]]);
if(p.type==='centralKitchen')cells([['Réception des denrées',['crate/food','sink']],['Préparation froide',['steelTable','fridge']],['Cuisson — four arrêté',['oven','steelTable']]], [['Réserve alimentaire',['shelf/food','fridge']],['Conditionnement et expédition',['steelTable','crate/food']],['Plonge et retour sale',['sink','dishRack']]]);
if(p.type==='pharmacy'){const back=h-7;horizontal(.24,back,w-.48,mid,1.8);room('Vente et conseil',.5,.5,lo-.8,back-.9,['counter','shelf/medicine']);room('Comptoir et attente',hi+.35,.5,w-hi-.8,back-.9,['counter','bench']);vertical(lo,back,h-back-.24,back+3);vertical(hi,back,h-back-.24,back+3);room('Préparation et lavabos',.4,back+.4,lo-.7,6.2,['medical','sink']);room('Réserve — hors public',hi+.4,back+.4,w-hi-.8,6.2,['shelf/medicine','medical']);}
if(['joinery','freight','reuse'].includes(p.type)){const cut=h-7;horizontal(.24,cut,w-.48,mid,3);const a=p.type==='joinery'?['Bois et débit — machines arrêtées',['timberRack/wood','sawBench','logs']]:p.type==='freight'?['Tri et anciens quais',['palletStack/wood','crate','shelf']]:['Réception et tri',['crate','workbench','wardrobe']];const b=p.type==='joinery'?['Assemblage et finition',['workbench','clampRack','timberRack/wood']]:p.type==='freight'?['Stockage avant expédition',['shelf','palletStack/wood','crate']]:['Meubles remis en vente',['sofa','table','shelf/wood']];room(a[0],.4,.5,lo-.8,cut-1,a[1]);room(b[0],hi+.4,.5,w-hi-.8,cut-1,b[1]);room(p.type==='reuse'?'Réparation et diagnostic':'Bureau et archives',.4,cut+.4,lo-.8,6.1,p.type==='reuse'?['workbench','desk']:['desk','wardrobe']);room('Réserve et petit matériel',hi+.4,cut+.4,w-hi-.8,6.1,['crate','workbench']);}
if(p.type==='generatorRoom'){const back=h-4.5;horizontal(.24,back,w-.48,mid,2);room('Groupe arrêté et entretien',.4,.5,lo-.8,back-.8,['generator','workbench']);room('Baies et réserve technique',hi+.4,.5,w-hi-.8,back-.8,['electricalRack','fuel']);room('Vestiaire',.4,back+.4,lo-.8,3.7,['wardrobe']);room('Réserve',hi+.4,back+.4,w-hi-.8,3.7,['crate']);}
if(d.levels.length>1)stairs.push({id:p.id+':stairs',x:mid-1.05,y:h-4,w:2.1,h:2.9,levels:d.levels});
const clean=[];for(const o of objects){const box={l:o.x,r:o.x+o.w,t:o.y,b:o.y+o.h};if(o.x<.32||o.y<.32||box.r>w-.32||box.b>h-.32||[...walls,...stairs,...clean].some(b=>G.overlap(box,{l:b.x,r:b.x+b.w,t:b.y,b:b.y+b.h},.18)))continue;clean.push(o);}
return{walls,rooms,objects:clean,stairs,floor:{x:.24,y:.24,w:w-.48,h:h-.48},entry:G.global(p,mid,-1),exit:G.global(p,mid,h+1),style:p.type};}
function outdoor(p,G){if(p.generation<3)return[];const out=[];const add=(kind,x,y,resource,room='Cour de livraison')=>{const[w,h]=G.SHAPES[kind];out.push({id:p.id+':out:'+out.length,kind,x,y,w,h,a:0,resource:resource||G.RESOURCES[kind]||'scrap',amount:6+G.hash(p.id,'court117',out.length)%14,room});};
if(p.type==='joinery'){add('timberRack',1,p.h+5,'wood');add('palletStack',7,p.h+5,'wood');add('logs',p.w-7,p.h+5,'wood');}
else if(p.type==='centralKitchen'){add('crate',2,p.h+5,'food');add('crate',6,p.h+5,'food');add('dishRack',p.w-5,p.h+5,'scrap','Retour de plonge');}
else if(p.type==='freight'||p.type==='reuse'){add('palletStack',2,p.h+5,'wood');add('crate',7,p.h+5,'scrap');add('crate',p.w-5,p.h+5,'scrap');}
else if(p.type==='generatorRoom'){add('fuel',-4,4,'fuel','Réserve d’entretien');add('electricalRack',p.w+3,5,'scrap');}
else if(p.type==='basementHouse'){add('table',1,p.h+5,'wood','Jardin');add('crate',p.w-4,p.h+5,'wood','Remise');}
else add('crate',2,p.h+5,'scrap','Retour d’emballages');return out;}
const api={PRESETS,BY,plan,outdoor};root.DeadwallFrontierSpecialists=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
