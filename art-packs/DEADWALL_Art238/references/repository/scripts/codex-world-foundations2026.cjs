'use strict';
/* Authoring only. No game installation, live-world mutation, stocks or save writes. */
const fs=require('node:fs'),path=require('node:path');
const DATA='docs/codex/suivi-monde2026/references-metriques2026.json';
const TYPES=['EXT-MONDE-T060','EXT-MONDE-T065','EXT-MONDE-T066'];
const DESIGN=Object.freeze({version:1,variants:50,corridor:1.8,wall:.2,door:1.2,building:[14,10,3.2],roadWidth:4.5,windSpacing:[7,5],windBase:16,windRoadOffset:30,standDepth:[8,12,16,20,24]});
const PROGRAMMES=[
 ['accueil',['réception','consignes','bureau','réserve accueil']],
 ['vestiaires',['vestiaire A','vestiaire B','douches A','douches B']],
 ['sanitaires',['sanitaires A','sanitaires B','entretien','réserve hygiène']],
 ['soins',['accueil soins','salle de soins','repos','réserve médicale']],
 ['maintenance',['atelier','pièces détachées','vestiaire technique','local outillage']],
 ['énergie',['tableau de distribution','groupe de secours','stockage technique','contrôle énergie']],
 ['restauration',['cuisine','réserve sèche','plonge','service']],
 ['sécurité',['poste de contrôle','repos équipe','archives','équipement']],
 ['gestion',['bureau exploitation','réunion','archives','informatique']],
 ['associations',['club-house','rangement sportif','réunion équipe','atelier léger']]
];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
function refs(root=path.resolve(__dirname,'..')){return JSON.parse(fs.readFileSync(path.join(root,DATA),'utf8'));}
function validateReferences(data){
 if(data?.schemaVersion!==1||!Array.isArray(data.sources)||!Array.isArray(data.metrics))throw Error('Référentiel incomplet');
 const ids=new Set();for(const s of data.sources){if(!s.id||ids.has(s.id)||!/^https:\/\//.test(s.url)||!s.checkedAt||!s.scope)throw Error('Source invalide');ids.add(s.id);}
 const keys=new Set();for(const m of data.metrics){if(!m.id||keys.has(m.id)||m.unit!=='m'||!positive(m.value)||!ids.has(m.source)||!m.datum)throw Error('Cote non sourcée ou unité invalide');keys.add(m.id);}
 for(const id of ['pitch.length','pitch.width','pitch.smallEnd','pitch.smallSide','pitch.largeEnd','pitch.largeSide','wind.rotor','wind.hub105','wind.hub123','wind.hub145','wind.hub155','wind.hub166'])if(!keys.has(id))throw Error('Cote requise absente: '+id);
 return true;
}
function build(type,number,data=refs()){
 validateReferences(data);if(!TYPES.includes(type)||!Number.isInteger(number)||number<1||number>50)throw Error('Typologie ou variante invalide');
 const measure=id=>data.metrics.find(m=>m.id===id).value,group=Math.floor((number-1)/10),layout=(number-1)%10;
 const id=type+'-V'+String(number).padStart(2,'0');
 const model={id,type,number,version:1,units:'m',scope:'author-metric-layout-not-live-world',playable:false,
  sourceIds:[],designAssumptions:['Emprises annexes, hauteurs de tribunes, espacements et voies internes sont des choix auteur, non des relevés de bâtiments réels.'],
  bounds:null,buildings:[],structures:[],reservedAreas:[],network:{nodes:[],edges:[],externalPorts:[]},unresolved:['terrain réel et raccords aux réseaux du seed','murs et ouvertures runtime','escaliers et niveaux publics','contenants et budget fini','rencontres et IA','services et énergie','graphismes','sauvegarde et qualification de campagne']};
 const nodes=new Map();
 function node(key,x,y,z=0){if(nodes.has(key))throw Error('Nœud répété');const n={id:id+':'+key,x,y,z};nodes.set(key,n);model.network.nodes.push(n);return n;}
 function edge(a,b,mode='service'){if(!nodes.has(a)||!nodes.has(b))throw Error('Extrémité absente');model.network.edges.push({id:id+':e'+model.network.edges.length,from:nodes.get(a).id,to:nodes.get(b).id,widthM:mode==='pedestrian'?DESIGN.corridor:DESIGN.roadWidth,mode,level:0});}
 function facility(index,x,y,orientation=0){
  const [kind,names]=PROGRAMMES[index],w=DESIGN.building[0],h=DESIGN.building[1],t=DESIGN.wall,cw=DESIGN.corridor;
  const building={id:id+':building:'+kind,kind,x,y,w,h,rotationRad:0,entrySide:orientation===0?'north':'south',heightM:DESIGN.building[2],heightOrigin:'author-design',levels:[0],rooms:[],portals:[],footprintOrigin:'author-design'};
  const corridor={id:building.id+':corridor',name:'circulation',x:(w-cw)/2,y:0,w:cw,h,level:0,clearHeightM:2.8};
  building.rooms.push(corridor);building.entry={x:w/2,y:orientation===0?0:h,level:0,widthM:DESIGN.door};
  const rw=(w-cw)/2-2*t,rh=h/2-2*t;
  for(let i=0;i<4;i++){
   const east=i%2===1,south=i>=2,r={id:building.id+':room:'+i,name:names[i],x:east?(w+cw)/2+t:t,y:(south?h/2:0)+t,w:rw,h:rh,level:0,clearHeightM:2.8};
   // Slots are author reservations only, not live props or new loot containers.
   r.slots=[{id:r.id+':slot:0',kind:'shelf',x:r.x+(east?r.w-1.8:0),y:r.y+.3,w:1.8,h:.5,z:0,lootAssigned:false}];
   const px=east?corridor.x+corridor.w:corridor.x,py=r.y+r.h/2;
   building.portals.push({id:r.id+':door',from:corridor.id,to:r.id,x:px,y:py,widthM:DESIGN.door,wallGapM:t,axis:'y'});building.rooms.push(r);
  }
  model.buildings.push(building);return building;
 }
 if(type==='EXT-MONDE-T060'){
  model.sourceIds=['VESTAS150'];const diameter=measure('wind.rotor'),hub=measure(['wind.hub105','wind.hub123','wind.hub145','wind.hub155','wind.hub166'][group]);
  const configurations=[[1,2],[1,3],[2,2],[1,4],[2,3],[3,2],[2,4],[3,3],[2,5],[3,4]], [rows,cols]=configurations[layout];
  const sx=diameter*DESIGN.windSpacing[0],sy=diameter*DESIGN.windSpacing[1],margin=diameter/2+40;
  model.bounds={x:0,y:0,w:2*margin+(cols-1)*sx,h:2*margin+(rows-1)*sy+50};
  model.maxHeightM=hub+diameter/2;model.heightOrigin='derived: hub + rotor / 2';
  node('gate',margin,0);model.network.externalPorts.push({node:nodes.get('gate').id,requires:'service-road',connectedToWorld:false});node('base',margin,25);edge('gate','base');node('spine',margin-30,25);edge('base','spine');
  let prev='spine';
  for(let r=0;r<rows;r++){
   const rowKey='row:'+r;node(rowKey,margin-30,margin+50+r*sy-DESIGN.windRoadOffset);edge(prev,rowKey);prev=rowKey;
   for(let c=0;c<cols;c++){
    const x=margin+c*sx,y=margin+50+r*sy,roadY=y-DESIGN.windRoadOffset,key='lane:'+r+':'+c;
    node(key,x,roadY);edge(c?'lane:'+r+':'+(c-1):rowKey,key);
    const n='tower:'+r+':'+c;node(n,x,y-DESIGN.windBase/2);edge(key,n);
    model.structures.push({id:id+':'+n,kind:'wind-turbine',x:x-DESIGN.windBase/2,y:y-DESIGN.windBase/2,w:DESIGN.windBase,h:DESIGN.windBase,baseHeightM:.8,hubHeightM:hub,rotorDiameterM:diameter,maxHeightM:hub+diameter/2,sweptEnvelopeIsGroundCollider:false,footprintOrigin:'author-design',heightOrigin:'VESTAS150'});
   }
  }
  for(const [i,kind]of [4,5,8].entries()){const b=facility(kind,margin+30+i*30,8,Math.PI);const n='facility:'+i;node(n,b.x+b.w/2,b.y+b.h);node('junction:'+i,b.x+b.w/2,25);edge(n,'junction:'+i);edge(i?'junction:'+(i-1):'base','junction:'+i,'pedestrian');}
 }else{
  const large=type==='EXT-MONDE-T066';model.sourceIds=['FIFA53'];const l=measure('pitch.length'),w=measure('pitch.width'),end=measure(large?'pitch.largeEnd':'pitch.smallEnd'),side=measure(large?'pitch.largeSide':'pitch.smallSide');
  const safeL=l+2*end,safeW=w+2*side,depth=DESIGN.standDepth[group]*(large?2:1),band=36+2*layout;
  model.bounds={x:0,y:0,w:safeL+2*(depth+band),h:safeW+2*(depth+band)};
  model.maxHeightM=large?36+group*4:7+group*2;model.heightOrigin='author-design';
  const safe={id:id+':safe-pitch',kind:'clear-pitch',x:depth+band,y:depth+band,w:safeL,h:safeW,level:0};
  model.reservedAreas.push(safe,{id:id+':field',kind:'field-of-play',x:safe.x+end,y:safe.y+side,w:l,h:w,level:0,parent:safe.id});
  const stands=[['north',safe.x,safe.y-depth-2,safe.w,depth],['south',safe.x,safe.y+safe.h+2,safe.w,depth],['west',safe.x-depth-2,safe.y,depth,safe.h],['east',safe.x+safe.w+2,safe.y,depth,safe.h]];
  for(const [kind,x,y,sw,sh]of stands)model.structures.push({id:id+':stand:'+kind,kind:'stand',x,y,w:sw,h:sh,maxHeightM:model.maxHeightM,heightOrigin:'author-design',interiorStatus:'not-built'});
  const B=model.bounds;node('gate',B.w/2,0);node('north',B.w/2,4);node('nw',4,4);node('ne',B.w-4,4);node('sw',4,B.h-4);node('south',B.w/2,B.h-4);node('se',B.w-4,B.h-4);
  for(const[a,b]of [['gate','north'],['nw','sw'],['ne','se']])edge(a,b);
  model.network.externalPorts.push({node:nodes.get('gate').id,requires:large?'collector-road':'local-road',connectedToWorld:false});
  for(let i=0;i<10;i++){
   const south=i>=5,j=i%5,dx=(B.w-40)/5,x=20+j*dx,y=south?B.h-24:14;
   const b=facility((i+layout)%10,x,y,south?Math.PI:0),n='facility:'+i,junction='junction:'+i,ry=south?B.h-4:4;
   node(n,b.x+b.w/2,south?b.y+b.h:b.y);node(junction,b.x+b.w/2,ry);edge(n,junction,'pedestrian');
  }
  for(const south of [false,true]){const row=[...nodes.entries()].filter(([key,n])=>n.y===(south?B.h-4:4)).sort((a,b)=>a[1].x-b[1].x);for(let j=1;j<row.length;j++)edge(row[j-1][0],row[j][0]);}
 }
 return freeze(model);
}
const overlap=(a,b)=>a.x<b.x+b.w-1e-8&&a.x+a.w>b.x+1e-8&&a.y<b.y+b.h-1e-8&&a.y+a.h>b.y+1e-8;
const contains=(a,b)=>b.x>=a.x-1e-8&&b.y>=a.y-1e-8&&b.x+b.w<=a.x+a.w+1e-8&&b.y+b.h<=a.y+a.h+1e-8;
function corridorOverlaps(a,b,width,box){
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!positive(length)||!positive(width))return true;
 const ux=dx/length,uy=dy/length,vx=-uy,vy=ux,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
 const tx=box.x+box.w/2-cx,ty=box.y+box.h/2-cy;
 return [[1,0],[0,1],[ux,uy],[vx,vy]].every(([x,y])=>{
  const radius=length/2*Math.abs(x*ux+y*uy)+width/2*Math.abs(x*vx+y*vy)+box.w/2*Math.abs(x)+box.h/2*Math.abs(y);
  return Math.abs(tx*x+ty*y)<radius-1e-8;
 });
}
function audit(p){
 const errors=[],fail=s=>errors.push(s),ids=new Set();
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const finite=(...values)=>values.every(Number.isFinite);
 const identifier=id=>typeof id==='string'&&id.trim().length>0;
 const rectangle=o=>object(o)&&finite(o.x,o.y,o.w,o.h)&&positive(o.w)&&positive(o.h);
 const objects=list=>Array.isArray(list)&&Array.from(list).every(object);
 // Validate the nested containers before traversing them. A malformed author
 // document is a failed audit, not an exception that aborts a batch of plans.
 if(!object(p)||!object(p.bounds)||!object(p.network)||
  ![p.buildings,p.structures,p.reservedAreas,p.network.nodes,p.network.edges,p.network.externalPorts].every(objects)||
  p.buildings.some(b=>!Array.isArray(b.levels)||!objects(b.rooms)||!objects(b.portals)||!object(b.entry)||
   b.rooms.some(r=>r.slots!==undefined&&!objects(r.slots))))return {ok:false,errors:['schema']};
 const result=()=>({ok:errors.length===0,errors:[...new Set(errors)],buildings:p.buildings.length,
  rooms:p.buildings.reduce((n,b)=>n+b.rooms.length,0),structures:p.structures.length,nodes:p.network.nodes.length});
 const levels=p.levels===undefined?[{id:'ground',index:0,elevationM:0,clearHeightM:Number.isFinite(p.maxHeightM)?Math.max(2.8,p.maxHeightM):2.8}]:p.levels;
 if(!objects(levels)||!levels.length||levels.length>64||levels.some((l,i)=>l.index!==i||!identifier(l.id)||!finite(l.elevationM)||!positive(l.clearHeightM))||
  new Set(levels.map(l=>l.id)).size!==levels.length||new Set(levels.map(l=>l.elevationM)).size!==levels.length||levels[0].id!=='ground'||levels[0].elevationM!==0){fail('invalid-levels');return result();}
 const nodeLevel=n=>n.level??0;
 const objectLevels=o=>Array.isArray(o.levels)?o.levels:[o.level??0];
 const sameLevel=(a,b)=>objectLevels(a).some(level=>objectLevels(b).includes(level));
 function register(id){if(!identifier(id)||ids.has(id))fail('duplicate-id');else ids.add(id);}
 function rect(o){register(o.id);if(!rectangle(o))fail('invalid-rectangle');}
 if(p.units!=='m'||p.playable!==false||p.scope!=='author-metric-layout-not-live-world')fail('false-scope');
 if(!rectangle(p.bounds)){fail('bounds');return result();}
 if(!positive(p.maxHeightM)||!identifier(p.heightOrigin))fail('site-height');
 const solids=[...p.buildings,...p.structures];
 for(const b of solids){rect(b);if(!contains(p.bounds,b))fail('outside-site');if(!objectLevels(b).length||objectLevels(b).some(i=>!Number.isInteger(i)||!levels[i]))fail('unbuilt-level');}
 for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++)if(sameLevel(solids[i],solids[j])&&overlap(solids[i],solids[j]))fail('overlap-structures');
 for(const a of p.reservedAreas){rect(a);if(!contains(p.bounds,a))fail('outside-site');if(solids.some(b=>sameLevel(a,b)&&overlap(a,b)))fail('blocked-pitch');}
 if(p.surfaceAreas!==undefined&&!objects(p.surfaceAreas)){fail('invalid-surface-areas');return result();}
 for(const a of p.surfaceAreas||[]){rect(a);if(!contains(p.bounds,a)||!levels[a.level]||a.walkable!==true)fail('invalid-surface-area');}
 for(const b of p.buildings){
  const bound={x:0,y:0,w:b.w,h:b.h};if(!b.levels.length||new Set(b.levels).size!==b.levels.length||b.levels.some(i=>!Number.isInteger(i)||!levels[i]))fail('unbuilt-level');
  const local=new Set();
  for(const r of b.rooms){
   rect(r);local.add(r.id);
   if(!contains(bound,r)||!positive(r.clearHeightM)||r.clearHeightM>b.heightM||!b.levels.includes(r.level)||!levels[r.level]||r.clearHeightM>levels[r.level].clearHeightM)fail('invalid-room');
   for(const s of r.slots||[]){rect(s);if(!contains(r,s)||s.lootAssigned!==false)fail('slot-or-loot');}
  }
  for(let i=0;i<b.rooms.length;i++)for(let j=i+1;j<b.rooms.length;j++)if(b.rooms[i].level===b.rooms[j].level&&overlap(b.rooms[i],b.rooms[j]))fail('room-overlap');
  const baseElevation=b.levels.includes(0)?0:Math.min(...b.levels.map(i=>levels[i]?.elevationM??Infinity));
  if(!positive(b.heightM)||b.heightM>p.maxHeightM||b.heightOrigin!=='author-design'||
   b.rooms.some(r=>levels[r.level]&&levels[r.level].elevationM+r.clearHeightM>Math.min(baseElevation+b.heightM,p.maxHeightM)+1e-8))fail('building-height');
  if(!positive(b.entry.widthM)||b.entry.widthM<.9)fail('entry-too-narrow');
  if(!finite(b.entry.x,b.entry.y)||!b.levels.includes(b.entry.level)||b.rotationRad!==0||!['north','south'].includes(b.entrySide)||
   b.entry.x!==b.w/2||b.entry.y!==(b.entrySide==='north'?0:b.h)||b.entry.x-b.entry.widthM/2<0||b.entry.x+b.entry.widthM/2>b.w)fail('entry-frame');
  if(!p.network.nodes.some(n=>nodeLevel(n)===b.entry.level&&Math.abs(n.x-b.x-b.entry.x)<1e-8&&Math.abs(n.y-b.y-b.entry.y)<1e-8))fail('entry-not-connected');
  const corridors=b.rooms.filter(r=>r.kind==='circulation'||r.name==='circulation'),links=new Set();
  if(b.levels.some(level=>corridors.filter(r=>r.level===level).length!==1))fail('missing-circulation');
  for(const d of b.portals){
   register(d.id);
   const c=corridors.find(r=>r.id===d.from),target=b.rooms.find(r=>r.id===d.to);
   if(!local.has(d.from)||!local.has(d.to)||!c||d.from!==c.id||d.to===c.id||
    !target||target.level!==c.level||!finite(d.x,d.y,d.widthM,d.wallGapM)||d.widthM<.9||d.wallGapM<0||d.axis!=='y'){fail('bad-portal');continue;}
   const r=b.rooms.find(r=>r.id===d.to);
   const at=Math.abs(d.x-c.x)<1e-8||Math.abs(d.x-c.x-c.w)<1e-8;
   const gap=Math.min(Math.abs(r.x+r.w-d.x),Math.abs(r.x-d.x));
   if(!at||Math.abs(gap-d.wallGapM)>1e-8||d.y-d.widthM/2<r.y||d.y+d.widthM/2>r.y+r.h||
    d.y-d.widthM/2<c.y||d.y+d.widthM/2>c.y+c.h)fail('portal-not-on-face');
   links.add(d.to);
  }
  if(b.rooms.filter(r=>!corridors.includes(r)).some(r=>!links.has(r.id)))fail('disconnected-room');
 }
 const nodes=new Map();
 for(const n of p.network.nodes){
  if(!identifier(n.id)||nodes.has(n.id)||!finite(n.x,n.y,n.z)||!Number.isInteger(nodeLevel(n))||!levels[nodeLevel(n)]||n.z!==levels[nodeLevel(n)]?.elevationM)fail('invalid-node');
  // A gate may lie exactly on the boundary, but no authored path can use a
  // node beyond the parcel and silently claim that it is internally connected.
  if(finite(n.x,n.y)&&!contains(p.bounds,{x:n.x,y:n.y,w:0,h:0}))fail('node-outside-site');
  nodes.set(n.id,n);
 }
 const links=new Map([...nodes.keys()].map(id=>[id,[]])),edgeIds=new Set();
 for(const e of p.network.edges){
  if(!identifier(e.id)||edgeIds.has(e.id))fail('duplicate-edge');edgeIds.add(e.id);
  const a=nodes.get(e.from),b=nodes.get(e.to);
  if(!a||!b||a.id===b.id||!finite(a.x,a.y,b.x,b.y)||!positive(Math.hypot(b.x-a.x,b.y-a.y))||
   !positive(e.widthM)||e.level!==nodeLevel(a)||e.level!==nodeLevel(b)||!['service','pedestrian'].includes(e.mode)){fail('bad-edge');continue;}
  links.get(a.id).push(b.id);links.get(b.id).push(a.id);
  const internal=box=>e.mode==='pedestrian'&&box.rooms?.some(r=>(r.kind==='circulation'||r.name==='circulation')&&r.level===e.level&&
   e.widthM<=r.w&&contains({x:box.x+r.x,y:box.y+r.y,w:r.w,h:r.h},{x:a.x,y:a.y,w:0,h:0})&&contains({x:box.x+r.x,y:box.y+r.y,w:r.w,h:r.h},{x:b.x,y:b.y,w:0,h:0}));
  if(solids.some(box=>objectLevels(box).includes(e.level)&&corridorOverlaps(a,b,e.widthM,box)&&!internal(box)))fail('road-crosses-structure');
  if(p.reservedAreas.some(box=>(box.level??0)===e.level&&corridorOverlaps(a,b,e.widthM,box)))fail('road-crosses-protected-area');
 }
 if(p.network.transitions!==undefined&&!objects(p.network.transitions)){fail('invalid-transitions');return result();}
 for(const t of p.network.transitions||[]){
  const a=nodes.get(t.from),b=nodes.get(t.to),al=levels[nodeLevel(a||{})],bl=levels[nodeLevel(b||{})];
  if(!identifier(t.id)||edgeIds.has(t.id)||!a||!b||!al||!bl||nodeLevel(a)===nodeLevel(b)||!['stairs','ladder'].includes(t.kind)||!positive(t.widthM)||t.widthM<.9||
   Math.abs(a.x-b.x)>1e-8||Math.abs(a.y-b.y)>1e-8||Math.abs(al.elevationM-bl.elevationM)>4.8||
   levels.some(l=>l.elevationM>Math.min(al.elevationM,bl.elevationM)+1e-8&&l.elevationM<Math.max(al.elevationM,bl.elevationM)-1e-8)){fail('invalid-transition');continue;}
  edgeIds.add(t.id);links.get(a.id).push(b.id);links.get(b.id).push(a.id);
 }
 const starts=p.network.externalPorts.map(q=>q.node),seen=new Set(starts.filter(s=>nodes.has(s))),queue=[...seen];
 if(!starts.length||starts.some(s=>!nodes.has(s)||nodeLevel(nodes.get(s))!==0)||p.network.externalPorts.some(p=>p.connectedToWorld!==false))fail('false-external-link');
 for(let i=0;i<queue.length;i++)for(const n of links.get(queue[i])||[])if(!seen.has(n)){seen.add(n);queue.push(n);}if(seen.size!==nodes.size)fail('disconnected-network');
 for(const t of p.structures.filter(s=>s.kind==='wind-turbine')){if(t.rotorDiameterM!==150||t.maxHeightM!==t.hubHeightM+t.rotorDiameterM/2||t.sweptEnvelopeIsGroundCollider!==false)fail('rotor-height');const box={x:t.x+t.w/2-75,y:t.y+t.h/2-75,w:150,h:150};if(!contains(p.bounds,box))fail('swept-envelope-outside-site');}
 return result();
}
function auditAll(data=refs()){
 const records=[];for(const type of TYPES)for(let n=1;n<=50;n++){const p=build(type,n,data),q=audit(p);if(!q.ok)throw Error(p.id+': '+q.errors.join(', '));records.push({id:p.id,type,widthM:p.bounds.w,lengthM:p.bounds.h,heightM:p.maxHeightM,heightOrigin:p.heightOrigin,...q});}
 return {schemaVersion:1,scope:'metric-authoring-not-runtime-qualification',typologies:TYPES.length,variants:records.length,playable:0,records};
}
if(require.main===module){const out=path.resolve(process.argv[2]||'artifacts/qa/codex-foundations2026');fs.mkdirSync(out,{recursive:true});const data=refs(),report=auditAll(data);fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2)+'\n');for(const type of TYPES)fs.writeFileSync(path.join(out,type+'.json'),JSON.stringify(Array.from({length:50},(_,i)=>build(type,i+1,data)),null,2)+'\n');console.log(JSON.stringify({typologies:report.typologies,variants:report.variants,playable:0,output:out}));}
module.exports={DESIGN,TYPES,refs,validateReferences,build,audit,auditAll,corridorOverlaps};
