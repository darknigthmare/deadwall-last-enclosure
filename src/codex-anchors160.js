/* Append-only, opt-in wall furnishing. Historical floors and detail revisions stay unchanged. */
(function(root,factory){'use strict';const api=factory();root.DeadwallCodexAnchors160=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const RULES=Object.freeze({revision:3,maxAdded:12,wallGap:.04,wallTolerance:.8,edgeMargin:.16,minClearance:.8,maxClearance:1.8,attempts:5});
 const TYPES=Object.freeze(['bed','sofa','wardrobe','shelf','fridge','sink','desk','workbench','counter','medical','oven','washer','electricalRack','hoseRack']);
 const DEFAULTS=Object.freeze({bedroom:['bed','wardrobe'],living:['sofa','shelf'],kitchen:['fridge','sink','oven'],laundry:['washer','shelf'],bathroom:['sink'],pantry:['shelf'],garage:['workbench','shelf'],workshop:['workbench','shelf'],medical:['medical','sink'],pharmacy:['medical','shelf'],classroom:['desk','shelf'],library:['shelf','desk'],office:['desk','shelf'],retail:['shelf','counter'],storage:['shelf'],changing:['wardrobe'],technical:['electricalRack','workbench'],shelter:['bed','shelf']});
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 function supportedWalls(room,walls){
  const found=[];for(let i=0;i<walls.length;i++){const w=walls[i];
   if(w.w<=.55&&w.h>1){
    if(Math.abs(w.x+w.w-room.x)<=RULES.wallTolerance&&w.x<room.x)found.push({wall:w,index:i,side:'west'});
    if(Math.abs(w.x-room.x-room.w)<=RULES.wallTolerance&&w.x>room.x)found.push({wall:w,index:i,side:'east'});
   }
   if(w.h<=.55&&w.w>1){
    if(Math.abs(w.y+w.h-room.y)<=RULES.wallTolerance&&w.y<room.y)found.push({wall:w,index:i,side:'north'});
    if(Math.abs(w.y-room.y-room.h)<=RULES.wallTolerance&&w.y>room.y)found.push({wall:w,index:i,side:'south'});
   }
  }return found;
 }
 function pose(s,room,width,depth,fraction,clearance){
  const vertical=s.side==='west'||s.side==='east',w=vertical?depth:width,h=vertical?width:depth,b=s.wall;
  const lo=Math.max(vertical?room.y:room.x,vertical?b.y:b.x)+RULES.edgeMargin;
  const hi=Math.min(vertical?room.y+room.h:room.x+room.w,vertical?b.y+b.h:b.x+b.w)-RULES.edgeMargin-width;
  if(hi<lo)return null;const along=lo+(hi-lo)*fraction,gap=RULES.wallGap;
  const x=vertical?(s.side==='west'?b.x+b.w+gap:b.x-gap-w):along;
  const y=vertical?along:(s.side==='north'?b.y+b.h+gap:b.y-gap-h);
  const front=s.side==='west'?{x:x+w,y,w:clearance,h}:s.side==='east'?{x:x-clearance,y,w:clearance,h}:s.side==='north'?{x,y:y+h,w,h:clearance}:{x,y:y-clearance,w,h:clearance};
  return{x,y,w,h,angle160:{north:0,east:Math.PI/2,south:Math.PI,west:Math.PI*1.5}[s.side],spriteWidth160:width,spriteHeight160:depth,front160:front,support160:{wall:s.index,side:s.side,gap}};
 }
 function enrich({seed,p,z,plan,detail,description,geometry,recipes}){
  if(!description||!geometry||!recipes)throw Error('Contrat de mobilier ancré absent');
  const base=recipes.accessGrid(p,z,plan,detail),anchors=recipes.anchorCells(p,z,plan,base);
  if(!base?.baseline)return freeze({...detail,anchors160:{revision:3,added:0,rejected:0,navigationChecked:false,reason:'baseline-inaccessible'}});
  const previous=[...plan.objects,...detail.interior],solids=[...plan.walls,...previous,...plan.stairs],added=[],rejected=[];
  const sources=new Map(description.rooms.map(r=>[norm(r.name),r]));
  for(let ri=0;ri<plan.rooms.length&&added.length<RULES.maxAdded;ri++){
   const room=plan.rooms[ri],source=sources.get(norm(room.name)),kit=source?.kit||recipes.kitFor(room.name);
   if(source?.exterior||['garden','exterior','road','loading'].includes(kit.id))continue;
   const authored=(source?.authoredProps||[]).filter(a=>TYPES.includes(a.asset));
   const requested=[...authored.map(a=>({kind:a.asset,spec:a,origin:'authored'})),...(DEFAULTS[kit.id]||[]).map(kind=>({kind,origin:'kit'}))];
   const unique=new Map(requested.map(q=>[q.kind,requested.find(a=>a.kind===q.kind)]));
   for(const [kind,q]of unique){
    if(added.length>=RULES.maxAdded)break;
    if(previous.some(o=>o.kind===kind&&hit(o,room))||added.some(o=>o.kind===kind&&o.room160===ri))continue;
    const shape=geometry.SHAPES[kind];if(!shape)continue;
    const width=q.spec?.gabarit_m?.longueur||shape[0],depth=q.spec?.gabarit_m?.largeur||shape[1];
    if(!Number.isFinite(width+depth)||width<=0||depth<=0||width>4||depth>2.5)continue;
    const clearance=Math.max(RULES.minClearance,Math.min(RULES.maxClearance,q.spec?.degagement_min_m||kit.clearance||.8));
    const walls=supportedWalls(room,plan.walls),offset=walls.length?geometry.hash('anchor160',seed,p.id,z,ri,kind)%walls.length:0;let chosen=null;
    for(let k=0;k<walls.length&&!chosen;k++){const support=walls[(offset+k)%walls.length];
     for(let t=0;t<RULES.attempts&&!chosen;t++){
      const fraction=(geometry.hash('anchor160-slot',seed,p.id,z,ri,kind,t)%1001)/1000;
      const o=pose(support,room,width,depth,fraction,clearance);if(!o)continue;
      if(o.x<.25||o.y<.25||o.x+o.w>p.w-.25||o.y+o.h>p.h-.25)continue;
      if(o.x<room.x-.5||o.y<room.y-.5||o.x+o.w>room.x+room.w+.5||o.y+o.h>room.y+room.h+.5)continue;
      if(solids.some(s=>hit(o,s,.015))||added.some(s=>hit(o,s,.05)||hit(o,s.front160,.02)))continue;
      if([...solids,...added].some(s=>hit(o.front160,s,.025)))continue;
      const at=base.at(o.front160.x+o.front160.w/2,o.front160.y+o.front160.h/2);
      if(at<0||!base.reachable[at])continue;
      chosen={...o,id:p.id+':anchor160:'+z+':'+ri+':'+kind,kind,z,solid:true,surface:false,decor157:true,anchored160:true,room160:ri,room:room.name,label:q.spec?.nom||kind,origin160:q.origin,programme:description.id};
     }
    }if(chosen)added.push(chosen);else rejected.push({room:ri,kind,reason:'no-supported-space'});
   }
  }
  let audit;while(true){
   audit=recipes.accessGrid(p,z,plan,detail,added);
   const fronts=added.map(o=>audit?.at(o.front160.x+o.front160.w/2,o.front160.y+o.front160.h/2));
   if(audit?.baseline&&anchors.every(i=>audit.reachable[i])&&fronts.every(i=>i>=0&&audit.reachable[i]))break;
   if(!added.length)break;rejected.push({id:added.pop().id,reason:'navigation'});
  }
  return freeze({...detail,interior:[...detail.interior,...added],anchors160:{revision:3,added:added.length,rejected:rejected.length,navigationChecked:!!audit?.baseline&&anchors.every(i=>audit.reachable[i]),preservedAnchors:anchors.length}});
 }
 function searchText(description){
  return norm([description.id,description.name,description.family,description.parent,
   ...description.rooms.flatMap(r=>[r.name,r.exterior?'exterieur':'interieur',...r.kit.inventory,...r.authoredProps.map(p=>p.nom)]),
   ...description.gardenOptions.map(g=>g.name)].join(' '));
 }
 return freeze({RULES,TYPES,DEFAULTS,norm,supportedWalls,pose,enrich,searchText});
});
