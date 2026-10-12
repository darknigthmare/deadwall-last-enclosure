/* Cosmetic contents on real supports. They never own loot or collision. */
(function(root,factory){'use strict';const api=factory();root.DeadwallCodexDressing160=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const PALETTES=Object.freeze({paper:['#cbc2a9','#9a947e'],book:['#797966','#536e68'],tools:['#9ca49a','#636d66'],linen:['#b4baaa','#798c82'],dishes:['#b5beb2','#84998f'],medical:['#b9c5ae','#708b84'],bottle:['#8da392','#637e72'],plants:['#729057','#506b44'],switch:['#b1b4a1','#727f71'],label:['#b9ac85','#857d61']});
 Object.values(PALETTES).forEach(Object.freeze);
 const META=Object.freeze({paper:'Documents et courrier',book:'Livres et cahiers',tools:'Petits outils rangés',linen:'Linge et coussins',dishes:'Vaisselle posée',medical:'Plateaux de soins',bottle:'Flacons',plants:'Semis et feuillage',switch:'Appareillage mural éteint',label:'Étiquettes et signalisation'});
 const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function hash(...values){let h=2166136261;for(const value of values)for(const c of String(value)+'|')h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
 const positive=o=>o&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0;
 function typeFor(o){const room=normalize(o.room),kind=o.kind;
  if(['bed','sofa'].includes(kind))return 'linen';
  if(kind==='bench')return /salon|sejour|terrasse/.test(room)?'linen':'paper';
  if(['shelf','bookshelf','desk','officeDesk','counter','table'].includes(kind)){
   if(/atelier|garage|reparation/.test(room))return 'tools';
   if(/cuisin|repas|restaura|cantine|bar|fournil/.test(room))return 'dishes';
   if(/soin|medical|infirmer|pharm|dent/.test(room))return 'medical';
   return /bibli|classe|archive|lecture/.test(room)?'book':'paper';
  }
  if(['workbench','worktable','steelTable','sawBench'].includes(kind))return /cuisin|plonge|steril/.test(room)?'dishes':'tools';
  if(['medical','dentalChair','sterilizer'].includes(kind))return 'medical';
  if(['sink','shower','washer'].includes(kind))return 'bottle';
  if(kind==='smallCabinet')return /soin|bain|pharm|eau/.test(room)?'bottle':'label';
  if(['wardrobe','locker'].includes(kind))return 'linen';
  if(['plantTray','cropbed','flowerbed','planter'].includes(kind))return 'plants';
  if(['crate','crateStack','pallet','palletStack','container','shelfEnd'].includes(kind))return 'label';
  return null;
 }
 function attach(seed,p,z,support,type,slot,plane){
  const inset=Math.min(support.w,support.h)*.16,w=Math.min(.68,Math.max(.08,(support.w-inset*2)*.40)),h=Math.min(.46,Math.max(.07,(support.h-inset*2)*.52));
  if(w+2*inset>support.w||h+2*inset>support.h)return null;
  const roll=hash('dressing160',seed,p.id,z,support.id,slot),rx=(roll%997)/997,ry=((roll>>>10)%991)/991;
  const x=support.x+inset+rx*(support.w-w-2*inset),y=support.y+inset+ry*(support.h-h-2*inset);
  return Object.freeze({id:p.id+':dress160:'+z+':'+slot,kind:'dressing160',style:type,label:META[type],
   x,y,w,h,z,solid:false,surface:false,decor157:true,dressing160:true,supportId:support.id,plane,variant:roll%2,room:support.room||'',supportBounds:Object.freeze({x:support.x,y:support.y,w:support.w,h:support.h})});
 }
 function enrich({seed,p,z=0,plan,detail}){
  if(!Number.isInteger(seed)||!p?.id||!Array.isArray(plan?.objects)||!Array.isArray(detail?.interior)||!Array.isArray(detail?.outdoor))throw Error('Support de mobilier incomplet');
  detail={...detail,interior:detail.interior.filter(o=>!o.dressing160),outdoor:detail.outdoor.filter(o=>!o.dressing160)};
  const inside=[],outside=[],seen=new Set();let slot=0;
  const add=(o,where,plane)=>{if(inside.length+outside.length>=90||!positive(o)||!o.id||seen.has(o.id))return;seen.add(o.id);const type=typeFor(o);if(!type)return;const child=attach(seed,p,z,o,type,slot++,plane);if(child)where.push(child);};
  for(const o of plan.objects)add(o,inside,'furniture');
  for(const o of detail.interior)if(!o.dressing160)add(o,inside,'furniture');
  if(z===0){for(const o of p.outdoor||[])add(o,outside,'yard');for(const o of detail.outdoor)if(!o.dressing160)add(o,outside,'yard');}
  // Supports are real wall segments. A door gap cannot receive a floating switch.
  let wallCount=0;for(let i=0;i<(plan.walls||[]).length&&wallCount<6;i++){
   const wall=plan.walls[i];if(!positive(wall)||Math.max(wall.w,wall.h)<1.2||hash(seed,p.id,z,i,'wall')%3)continue;
   const support={...wall,id:p.id+':wall160:'+z+':'+i},child=attach(seed,p,z,support,'switch',slot++,'wall');
   if(child){inside.push(child);wallCount++;}
  }
  return Object.freeze({...detail,interior:Object.freeze([...detail.interior,...inside]),outdoor:Object.freeze([...detail.outdoor,...outside]),
   dressing160:Object.freeze({interior:inside.length,outdoor:outside.length,wallMounted:wallCount,collisionAdded:0,lootAdded:0})});
 }
 function valid(o){return positive(o)&&o.kind==='dressing160'&&Object.hasOwn(PALETTES,o.style)&&[0,1].includes(o.variant);}
 function draw(c,o){if(!c||!valid(o))return false;const[x,y,w,h]=[o.x,o.y,o.w,o.h],[base,dark]=PALETTES[o.style],variant=o.variant;
  c.save();try{c.beginPath();c.rect(x,y,w,h);c.clip();c.translate(x,y);c.scale(w,h);
   const fill=(a,b,d,e,col)=>{c.fillStyle=col;c.fillRect(a,b,d,e);};
   const line=(points,col,width=.055)=>{c.strokeStyle=col;c.lineWidth=width;c.beginPath();points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.stroke();};
   const dot=(a,b,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(a,b,r,0,Math.PI*2);c.fill();};
   switch(o.style){
    case 'linen':fill(.08,.12,.84,.74,base);fill(.12,.17,.32,.26,dark);line([[.56,.18],[.56,.79]],dark,.035);break;
    case 'tools':fill(.05,.08,.9,.84,dark);line([[.16,.28],[.76,.7]],base,.1);fill(.55,.18,.25,.18,base);line([[.64,.26],[.37,.74]],base,.07);break;
    case 'dishes':dot(.34,.48,.28,dark);dot(.34,.48,.22,base);dot(.79,.32,.13,base);line([[.78,.55],[.78,.9]],base);break;
    case 'medical':fill(.04,.07,.92,.86,base);fill(.16,.22,.24,.53,dark);line([[.61,.22],[.82,.78]],dark);dot(.68,.65,.1,dark);break;
    case 'bottle':fill(.16,.31,.31,.6,base);fill(.23,.12,.17,.23,dark);fill(.62,.4,.24,.44,dark);fill(.68,.22,.13,.2,base);break;
    case 'plants':for(const[a,b]of[[.17,.3],[.37,.7],[.64,.34],[.8,.7]]){dot(a,b,.16,base);line([[a,b-.12],[a,b+.12]],dark,.03);}break;
    case 'switch':fill(.05,.07,.90,.85,base);if(variant){dot(.33,.48,.08,dark);dot(.66,.48,.08,dark);}else fill(.29,.27,.4,.43,dark);break;
    case 'book':fill(.08,.06,.85,.86,dark);fill(.15,.13,.31,.7,base);fill(.52,.13,.32,.7,base);line([[.5,.13],[.5,.83]],dark,.02);break;
    case 'paper':case 'label':fill(.11,.11,.82,.76,base);for(let i=0;i<3;i++)line([[.2,.28+i*.19],[i===2?.66:.81,.28+i*.19]],dark,.035);if(variant)fill(.12,.13,.17,.11,dark);break;
   }
   return true;
  }finally{c.restore();}
 }

 // Revision 165 is paint-only: revision-3/4 furnishings are appended after the
 // historical dressing pass. Attach their contents while drawing, never by
 // adding objects to a saved floor, collider list or resource container.
 const SURFACE165=Object.freeze({maxPerSupport:3,maxCache:128,minSide:.3,insetRatio:.12});
 const surfaceCache165=new Map(),EMPTY165=Object.freeze([]);
 function surfaceItems165(support,seed=0){
  if(!support?.anchored160||!support.id||!Number.isInteger(seed))return EMPTY165;
  const w=support.spriteWidth160,h=support.spriteHeight160;
  if(!Number.isFinite(w+h)||w<SURFACE165.minSide||h<SURFACE165.minSide||w>8||h>8)return EMPTY165;
  const style=typeFor(support);if(!style)return EMPTY165;
  // Locals are relative to the unrotated sprite, not its world-aligned collider.
  // One entry per immutable support identity/seed; no retained scene references.
  const key=JSON.stringify([seed,support.id,support.kind,support.room||'',support.z??0,w,h]);
  if(surfaceCache165.has(key)){const value=surfaceCache165.get(key);surfaceCache165.delete(key);surfaceCache165.set(key,value);return value;}
  const ix=w*SURFACE165.insetRatio,iy=h*SURFACE165.insetRatio,freeW=w-2*ix,freeH=h-2*iy;
  const slots=Math.min(SURFACE165.maxPerSupport,Math.max(1,Math.floor(freeW/.5)));
  const roll=hash('supported-contents165',seed,support.id,support.kind);
  const count=style==='linen'?Math.min(2,slots):1+roll%slots,cell=freeW/count;
  const children=[];
  for(let i=0;i<count;i++){
   const pick=hash('supported-item165',seed,support.id,i),cw=Math.min(.65,cell*.65),ch=Math.min(.46,freeH*.62);
   const x=-w/2+ix+i*cell+(cell-cw)/2,y=-h/2+iy+(freeH-ch)*((pick%997)/997);
   const itemStyle=style==='medical'&&i%2?'bottle':style==='linen'&&support.kind==='wardrobe'?'label':style;
   children.push(Object.freeze({id:support.id+':surface165:'+i,kind:'dressing160',style:itemStyle,label:META[itemStyle],
    x,y,w:cw,h:ch,z:support.z??0,solid:false,surface:false,decor157:true,dressing160:true,surface165:true,
    supportId:support.id,plane:'furniture',variant:pick%2,room:support.room||'',
    supportBounds:Object.freeze({x:-w/2,y:-h/2,w,h})}));
  }
  const value=Object.freeze(children);surfaceCache165.set(key,value);
  if(surfaceCache165.size>SURFACE165.maxCache)surfaceCache165.delete(surfaceCache165.keys().next().value);
  return value;
 }
 function surfaceCacheStats165(){return Object.freeze({entries:surfaceCache165.size,limit:SURFACE165.maxCache});}
 return Object.freeze({META,PALETTES,typeFor,enrich,valid,draw,SURFACE165,surfaceItems165,surfaceCacheStats165});
});
