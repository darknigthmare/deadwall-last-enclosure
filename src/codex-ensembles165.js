/* Opt-in revision 5. Tables and seats are one checked composition, not unrelated props. */
(function(root,factory){'use strict';const api=factory();root.DeadwallCodexEnsembles165=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const RULES=freeze({revision:5,maxGroups:6,maxPerRoom:2,maxProps:30,attempts:16,seatWidth:.58,seatDepth:.58,seatGap:.28,accessGap:.2,access:.8,margin:.08});
 const PROFILES=freeze({
  dining:{label:'Repas partagés',table:[1.9,.95],seats:4,max:2,area:48,contents:'dishes'},
  living:{label:'Coin repas du séjour',table:[1.65,.85],seats:2,max:1,area:0,contents:'paper'},
  classroom:{label:'Table de travail scolaire',table:[2.2,.95],seats:4,max:2,area:46,contents:'book'},
  library:{label:'Consultation et lecture',table:[2.1,.95],seats:4,max:2,area:42,contents:'book'},
  office:{label:'Poste de travail partagé',table:[1.7,.8],seats:2,max:2,area:52,contents:'paper'},
  reception:{label:'Accueil et consultation',table:[1.5,.8],seats:2,max:1,area:0,contents:'paper'},
  workshop:{label:'Poste de petit assemblage',table:[2.1,.9],seats:2,max:2,area:62,contents:'tools'},
  terrace:{label:'Repas en terrasse',table:[1.65,.85],seats:2,max:1,area:0,contents:'dishes'}
 });
 // Existing table pictures can contain baked-in chairs. Count them, never add seats to them.
 const TABLE_KINDS=new Set(['table','worktable','desk','officeDesk','workbench','steelTable','sawBench']);
 const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 const within=(a,b,m=0)=>a.x>=b.x+m&&a.y>=b.y+m&&a.x+a.w<=b.x+b.w-m&&a.y+a.h<=b.y+b.h-m;
 const owns=(r,o)=>o.x+o.w/2>=r.x&&o.x+o.w/2<r.x+r.w&&o.y+o.h/2>=r.y&&o.y+o.h/2<r.y+r.h;
 const rect=o=>({x:o.x,y:o.y,w:o.w,h:o.h});
 const normal=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function profileFor(room,source,recipes){
  if(source?.exterior)return null;
  const name=normal(room.name),kit=source?.kit||recipes.kitFor(room.name);
  // An archive store, circulation hall or book warehouse is not a reading room.
  if(kit.id==='library'&&/stock|reserve|archives|fonds ancien/.test(name)&&!/lecture|consult/.test(name))return null;
  if(kit.id==='reception'&&/sas|couloir|hall|porche|entree/.test(name)&&!/attente|accueil/.test(name))return null;
  return PROFILES[kit.id]?kit.id:null;
 }
 function composition({p,z,groupId,cx,cy,width,depth,turn,seats,profile,room,plane,clearance=RULES.access}){
  const local=(u,v,w,h,role,face=0)=>{
   const a=turn*Math.PI/2,c=Math.cos(a),s=Math.sin(a),x=cx+c*u-s*v,y=cy+s*u+c*v,vertical=turn%2;
   return {id:groupId+':'+role,kind:role==='table'?'table':'chair',x:x-(vertical?h:w)/2,y:y-(vertical?w:h)/2,w:vertical?h:w,h:vertical?w:h,
    z,solid:true,surface:false,decor157:true,ensemble165:true,group165:groupId,role165:role,profile165:profile,
    angle165:(turn+face)*Math.PI/2,spriteWidth165:role==='table'?width:RULES.seatWidth,spriteHeight165:role==='table'?depth:RULES.seatDepth,
    room:room.name,label:role==='table'?PROFILES[profile].label:'Assise — '+room.name,plane165:plane};
  };
  const table=local(0,0,width,depth,'table'),items=[table],access=[];
  const distance=depth/2+RULES.seatGap+RULES.seatDepth/2;
  // Two paired sides; four seats use two places on each long edge.
  for(const side of [-1,1])for(let j=0;j<seats/2;j++){
   const u=seats===2?0:(j===0?-1:1)*width*.27,v=side*distance;
   const chair=local(u,v,RULES.seatWidth,RULES.seatDepth,'seat-'+(side<0?'north':'south')+'-'+j,side<0?0:2);
   const zone=local(u,v+side*((RULES.seatDepth+clearance)/2+RULES.accessGap),RULES.seatWidth+.18,clearance,'access');
   chair.access165=rect(zone);items.push(chair);access.push(rect(zone));
  }
  return {id:groupId,profile,room:room.name,plane,items,access,table,seats};
 }
 function enrich({seed,p,z=0,plan,detail,description,geometry:G,recipes:Q}){
  if(!Number.isInteger(seed)||!p?.id||!Number.isFinite(p.w+p.h)||!description||!G||!Q||!Array.isArray(plan?.rooms)||!Array.isArray(detail?.interior)||!Array.isArray(detail?.outdoor))throw Error('Contrat d’ensemble mobilier incomplet');
  if(detail.ensembles165?.revision===RULES.revision)return detail;
  const base=Q.accessGrid(p,z,plan,detail),keep=Q.anchorCells(p,z,plan,base),reports=[],groups=[],extras=[];
  if(!base?.baseline)return freeze({...detail,ensembles165:{revision:5,groups:[],requests:[],added:0,navigationChecked:false,reason:'baseline-inaccessible'}});
  const old=[...plan.objects,...detail.interior,...(z===0?[...(p.outdoor||[]),...detail.outdoor]:[])];
  const obstacles=[...plan.walls,...plan.stairs,...old];
  const oldAccess=old.flatMap(o=>[o.front160,o.access165].filter(Boolean));
  const oldPoints=oldAccess.map(a=>base.at(a.x+a.w/2,a.y+a.h/2)).filter(i=>i>=0&&base.reachable[i]);
  const sources=new Map(description.rooms.map(r=>[normal(r.name),r]));
  const terraceLimit=/habitat individuel|^habitat$|^rural$/i.test(description.family||'')?1:2;
  const rooms=plan.rooms.map((room,i)=>({room,index:'room-'+i,source:sources.get(normal(room.name)),plane:'interior'}));
  if(z===0)for(const [i,support] of detail.outdoor.entries())if(support.kind==='patio'&&support.w>=2&&support.h>=2){
   rooms.push({room:{...rect(support),name:'Terrasse'},index:'patio-'+i,plane:'outdoor',support});
  }
  const vehicleHit=o=>z===0&&(p.parking||[]).some(car=>{const c=G.local(p,car.x,car.y);return G.obb({x:o.x+o.w/2,y:o.y+o.h/2,w:o.w+.16,h:o.h+.16,a:0},{x:c.x,y:c.y,w:car.w,h:car.h,a:car.a-p.a});});
  for(const space of rooms){
   const {room,source,plane,support,index}=space,profile=plane==='outdoor'?'terrace':profileFor(room,source,Q);
   if(!profile)continue;
   const conf=PROFILES[profile],existing=old.filter(o=>TABLE_KINDS.has(o.kind)&&owns(room,o)).length;
   const authored=(source?.authoredProps||[]).find(o=>o.asset==='table');
   let wanted=Math.min(conf.max,conf.max>1&&room.w*room.h>=conf.area?2:1),dimensions=[...conf.table],clearance=Math.max(RULES.access,source?.kit?.clearance||0),reason=null;
   if(authored){
    const range=authored.quantite_par_espace;
    if(!Array.isArray(range)||range.length!==2||!range.every(Number.isSafeInteger)||range[0]<0||range[1]<range[0])reason='invalid-source-quantity';
    else {const lo=Math.min(RULES.maxPerRoom,range[0]),hi=Math.min(RULES.maxPerRoom,range[1]);wanted=lo+G.hash(seed,p.id,z,index,'table-count165')%(hi-lo+1);}
    const w=authored.gabarit_m?.longueur,h=authored.gabarit_m?.largeur;
    if(!Number.isFinite(w+h)||w<1.2||w>3.2||h<.65||h>1.25)reason='unsupported-source-dimensions';else dimensions=[w,h];
    const gap=authored.degagement_min_m;if(gap!==undefined&&(!Number.isFinite(gap)||gap<0||gap>1.8))reason='unsupported-source-clearance';else clearance=Math.max(clearance,gap||0);
   }
   const report={space:index,name:room.name,profile,origin:authored?'source':'kit',sourceRange:authored?.quantite_par_espace||null,sourceCapped:(authored?.quantite_par_espace?.[1]||0)>RULES.maxPerRoom,clearance,target:wanted,existing,added:0,unplaced:0,reason};reports.push(report);
   if(plane==='outdoor'&&groups.filter(g=>g.plane==='outdoor').length>=terraceLimit){reason='parcel-terrace-cap';report.reason=reason;}
   if(reason){report.unplaced=Math.max(0,wanted-existing);continue;}
   const allowed=plane==='interior'?room:{x:-11,y:-15,w:p.w+22,h:p.h+39};
   for(let ordinal=existing;ordinal<wanted&&groups.length<RULES.maxGroups;ordinal++){
    let chosen=null;
    for(let trial=0;trial<RULES.attempts&&!chosen;trial++){
     const roll=G.hash('ensemble165',seed,p.id,z,index,ordinal,trial),turn=(roll>>>4)%2;
     const fractions=[.5,.24,.76,.4,.6],cx=room.x+room.w*fractions[trial===0?0:(trial+roll)%5],cy=room.y+room.h*fractions[trial===0?0:((trial>>>2)+(roll>>>8))%5];
     for(const seats of conf.seats===4?[4,2]:[2]){
      const group=composition({p,z,groupId:p.id+':ensemble165:'+z+':'+index+':'+ordinal,cx,cy,width:dimensions[0],depth:dimensions[1],turn,seats,profile,room,plane,clearance});
      if(extras.length+group.items.length>RULES.maxProps)continue;
      if(group.items.some(o=>!within(o,room,RULES.margin)))continue;
      if(group.access.some(o=>!within(o,allowed,RULES.margin)))continue;
      const other=obstacles.filter(o=>o!==support);
      if(group.items.some(o=>other.some(b=>hit(o,b,.09))||extras.some(b=>hit(o,b,.09))||oldAccess.some(b=>hit(o,b,.05))||groups.some(g=>g.access.some(b=>hit(o,b,.05)))||vehicleHit(o)))continue;
      if(group.access.some(o=>[...other,...extras,...group.items].some(b=>b.solid!==false&&hit(o,b,.03))||vehicleHit(o)))continue;
      const all=[...extras,...group.items],staged={...detail,interior:[...detail.interior,...all.filter(o=>o.plane165==='interior')],outdoor:[...detail.outdoor,...all.filter(o=>o.plane165==='outdoor')]};
      const audit=Q.accessGrid(p,z,plan,staged);
      const required=[...keep,...oldPoints],zones=[...groups.flatMap(g=>g.access),...group.access];
      const points=zones.flatMap(a=>a.w>a.h?[[a.x+a.w/2,a.y+a.h/2],[a.x+a.w/2,a.y+a.h*.25],[a.x+a.w/2,a.y+a.h*.75]]:[[a.x+a.w/2,a.y+a.h/2],[a.x+a.w*.25,a.y+a.h/2],[a.x+a.w*.75,a.y+a.h/2]]).map(([x,y])=>audit?.at(x,y));
      if(!audit?.baseline||required.some(i=>!audit.reachable[i])||points.some(i=>i<0||!audit.reachable[i]))continue;
      chosen=group;break;
     }
    }
    if(!chosen)break;groups.push(chosen);extras.push(...chosen.items);report.added++;
   }
   report.unplaced=Math.max(0,wanted-existing-report.added);report.reason=existing>=wanted?'already-present':report.unplaced?'space-or-access':'complete';
  }
  // Append contents only to the new tables. Old dressing IDs and transforms stay unchanged.
  const contents=groups.map(g=>{const t=g.table,style=PROFILES[g.profile].contents,roll=G.hash(seed,t.id,'contents165');
   const sw=Math.min(.6,t.spriteWidth165*.34),sh=Math.min(.24,t.spriteHeight165*.24),a=t.angle165,vertical=Math.abs(Math.sin(a))>.5,w=vertical?sh:sw,h=vertical?sw:sh;
   // Contents sit on the back half of the actual tabletop, not over the pictured legs.
   const cx=t.x+t.w/2+Math.sin(a)*t.spriteHeight165*.2,cy=t.y+t.h/2-Math.cos(a)*t.spriteHeight165*.2;
   return {id:g.id+':contents',kind:'dressing160',style,label:'Objets posés — '+t.room,x:cx-w/2,y:cy-h/2,w,h,z,
    surfaceAngle165:a,surfaceWidth165:sw,surfaceHeight165:sh,
    solid:false,surface:false,decor157:true,dressing160:true,ensemble165:true,group165:g.id,role165:'contents',variant:roll%2,room:t.room,
    supportId:t.id,supportBounds:rect(t),plane:g.plane==='outdoor'?'yard':'furniture',plane165:g.plane};
  });
  const additions=[...extras,...contents];
  return freeze({...detail,interior:[...detail.interior,...additions.filter(o=>o.plane165==='interior')],outdoor:[...detail.outdoor,...additions.filter(o=>o.plane165==='outdoor')],
   ensembles165:{revision:5,added:extras.length,contents:contents.length,navigationChecked:true,preservedAnchors:keep.length+oldPoints.length,requests:reports,
    groups:groups.map(g=>({id:g.id,profile:g.profile,room:g.room,plane:g.plane,seats:g.seats,tableId:g.table.id,itemIds:g.items.map(o=>o.id),access:g.access}))}});
 }
 return freeze({RULES,PROFILES,profileFor,composition,enrich});
});
