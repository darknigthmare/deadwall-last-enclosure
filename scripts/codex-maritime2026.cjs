'use strict';
/* Authoring library: no runtime registration, save mutations, encounters or loot. */
const fs=require('node:fs'),path=require('node:path');
const Reference=require('./codex-world-foundations2026.cjs');
const RULES=Object.freeze({variants:50,wall:.18,corridor:1.8,door:1.2,subCorridor:1.1,subDoor:.85,headroom:2.4,subHeadroom:2.1,shaftLength:7,clearance:.25});
const PROFILES=Object.freeze({
 'EXT-MONDE-T005':{key:'cargo',source:'DAMEN5000',name:'Cargo polyvalent',mainKeel:12.4,floors:[3,6.1,9.2,12.4,15.4,18.4],region:[.025,.17,.14,.72],themes:['machines','machines','services','vie à bord','cabines','passerelle'],fixedHold:true,holdStartFraction205:.26,furnishing205:true},
 'EXT-MONDE-T006':{key:'tanker',source:'SOCATRA',name:'Pétrolier',mainMetric:'tanker.mouldedDepth',floors:[4,7.8,11.6,15.4,19.2,22.4,25.6],region:[.03,.18,.13,.74],themes:['machines','machines','services','services','vie à bord','cabines','passerelle'],tanks:true},
 'EXT-MONDE-T007':{key:'cruiser',source:'LITTLEROCK',name:'Croiseur déclassé',mainKeel:10.2,floors:[3.8,7,10.2,13.4],region:[.15,.7,.16,.68],themes:['machines','équipage','services','commandement']},
 'EXT-MONDE-T008':{key:'submarine',source:'TORSK',name:'Sous-marin en surface',mainKeel:6.3,floors:[3.5],region:[.14,.72,.03,.94],themes:['compartiments'],sub:true,furnishing205:true},
 'EXT-MONDE-T011':{key:'psv',source:'DAMENPSV',name:'Soutien offshore',mainMetric:'psv.mouldedDepth',floors:[3,7.5,10.5,13.5],region:[.625,.36875,0,1],themes:['machines','vie à bord','cabines','passerelle'],workDeck:true,furnishing205:true}
});
// Authored room widths, not vessel survey data or reduced furniture sizes.
// The two rows need different bay widths: a machine room and a linen store do
// not become equally narrow merely because they face the same corridor.
const BAYS205=Object.freeze({
 machines:[2.56,2,2,2.72,2.82,2.46,1.96,2.2],
 services:[2.51,2.3,2.72,2,1.96,1.8,2.51,2.3],
 'vie à bord':[2.72,2.2,1.96,1.8,2.3,2.2,2,1.9],
 cabines:[2.3,1.8,2.3,2.2,2.68,1.9,2.3,2.3],
 passerelle:[2.1,2.1,2.3,2.3,2,2.3,2.1,1.8]
});
const USES=Object.freeze({
 machines:['atelier mécanique','distribution électrique','pompes de service','magasin technique','ventilation','groupe auxiliaire','vestiaire technique','contrôle machines'],
 'vie à bord':['cuisine','réserve sèche','mess','sanitaires','infirmerie','buanderie','bureau logistique','local nettoyage'],
 cabines:['cabine équipage','sanitaires équipage','cabine officier','lingerie','salon équipage','réserve hygiène','repos de quart','cabine technicien'],
 passerelle:['navigation','communications','cartes','repos de quart','bureau capitaine','archives','électronique','sanitaires de quart'],
 équipage:['dortoir équipage','cuisine','mess','sanitaires','infirmerie','buanderie','rangement individuel','réserve sèche'],
 services:['atelier','infirmerie','stockage fermé','poste de garde','réfectoire','sanitaires','maintenance','archives'],
 commandement:['navigation','communications','cartes','bureau commandement','repos de quart','archives','électronique','poste observation'],
 compartiments:['stockage avant inerte','repos équipage','vie à bord','contrôle central','communications','diesel avant','diesel arrière','moteurs électriques','stockage arrière inerte','réserve technique','sanitaires','batteries isolées']
});
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
Object.values(PROFILES).forEach(freeze);Object.values(USES).forEach(freeze);
Object.values(BAYS205).forEach(freeze);
const finite=(...v)=>v.every(Number.isFinite),positive=v=>Number.isFinite(v)&&v>0;
const overlap=(a,b)=>a.x<b.x+b.w-1e-8&&a.x+a.w>b.x+1e-8&&a.y<b.y+b.h-1e-8&&a.y+a.h>b.y+1e-8;
const contains=(a,b)=>finite(a.x,a.y,a.w,a.h,b.x,b.y,b.w,b.h)&&b.x>=a.x-1e-8&&b.y>=a.y-1e-8&&b.x+b.w<=a.x+a.w+1e-8&&b.y+b.h<=a.y+a.h+1e-8;
function build(type,number,reference=Reference.refs()){
 Reference.validateReferences(reference);
 const profile=PROFILES[type];if(!profile||!Number.isInteger(number)||number<1||number>RULES.variants)throw Error('Typologie maritime ou variante invalide');
 const metric=id=>{const m=reference.metrics.find(m=>m.id===id);if(!m||!positive(m.value)||m.unit!=='m')throw Error('Cote maritime absente : '+id);return m.value;};
 const L=metric(profile.key+'.length'),B=metric(profile.key+'.beam'),draft=metric(profile.key+(profile.tanks?'.summerDraft':'.draft'));
 const main=profile.mainMetric?metric(profile.mainMetric):profile.mainKeel,cw=profile.sub?RULES.subCorridor:RULES.corridor,dw=profile.sub?RULES.subDoor:RULES.door;
 const group=Math.floor((number-1)/10),pattern=(number-1)%10,columns=profile.fixedHold?2+Math.floor(group/2):(profile.sub?4:2)+group,shaftLength=profile.fixedHold?5+group*.3:RULES.shaftLength;
 const id=type+'-V'+String(number).padStart(2,'0'),levels=profile.floors.map((k,i)=>({id:'deck-'+i,keelHeightM:k,elevationM:k-draft,origin:'author-design',clearHeightM:profile.sub?RULES.subHeadroom:RULES.headroom}));
 const p={schemaVersion:1,id,typologyId:type,number,name:profile.name,units:'m',scope:'author-maritime-layout-not-live-world',playable:false,
  reference:{source:profile.source,lengthM:L,beamM:B,draftM:draft,draftDatum:profile.tanks?'summer':profile.sub?'mean':'published',realTotalHeightM:null},
  hull:{x:0,y:0,w:L,h:B,keelElevationM:-draft,waterlineM:0,geometryOrigin:'author-envelope-not-lines-plan'},
  mainDeck:{keelHeightM:main,elevationM:main-draft,origin:profile.mainMetric?'source-moulded-depth-used-as-author-deck-datum':'author-design'},
  ...(profile.furnishing205?{furnishingLayout205:1}:{}),levels,rooms:[],portals:[],reservations:[],links:[],nodes:[],boarding:[],requiredServices:['electricity','water','ventilation'],
  unresolved:['hauteur hors tout du navire réel','formes exactes de coque et plans généraux','marches/échelles et ouvertures du moteur','objets, butin fini et rencontres','raccord au rivage et au réseau nautique','services, collisions et sauvegarde de campagne']};
 const [start,span,offset,width]=profile.region;
 // The hold keeps its published envelope. Its longitudinal location and the
 // superstructure remain author choices inside the unchanged rectangular hull.
 const holdStart=profile.fixedHold?L*profile.holdStartFraction205:null;
 const area=profile.fixedHold?{x:RULES.wall,y:0,w:holdStart-RULES.wall*2,h:B}:{x:L*start,y:B*offset,w:L*span,h:B*width};
 if(area.w<=shaftLength+2)throw Error('Superstructure trop courte');
 const addNode=(key,x,y,z)=>{const n={id:key.startsWith(id+':')?key:id+':'+key,x,y,z};p.nodes.push(n);return n.id;};
 const edge=(from,to,kind,widthM)=>p.links.push({id:id+':link-'+p.links.length,from,to,kind,widthM,modes:['pedestrian']});
 let prevShaft=null;
 for(const [di,level] of levels.entries()){
  const cy=area.y+area.h/2,corridor={id:id+':'+level.id+':corridor',name:'circulation',kind:'circulation',x:area.x,y:cy-cw/2,w:area.w,h:cw,level:level.id,z:level.elevationM,clearHeightM:level.clearHeightM};p.rooms.push(corridor);
  const shaft=addNode(level.id+':shaft',area.x+shaftLength/2,cy,level.elevationM);
  if(prevShaft)edge(prevShaft,shaft,profile.sub?'ladder':'stairs',profile.sub?.75:1.2);prevShaft=shaft;
  const usable=area.w-shaftLength,weights=Array.from({length:columns},(_,i)=>1+((i+pattern)%10)*.035),total=weights.reduce((a,b)=>a+b,0);let x=area.x+shaftLength,previous=shaft;
  const theme=USES[profile.themes[di]];
  if(profile.fixedHold){
   const rows=[0,1].map(side=>{
    const minima=weights.map((_,col)=>BAYS205[profile.themes[di]][(col*2+side+pattern)%theme.length]+RULES.wall*2);
    const slack=usable-minima.reduce((a,b)=>a+b,0);
    if(slack<0)throw Error('Programme maritime trop large pour la travée');
    let cursor=x;
    return weights.map((weight,col)=>{const bay=minima[col]+slack*weight/total,rect={x:cursor,bay};cursor+=bay;return rect;});
   });
   const previousBySide=[shaft,shaft];
   for(let col=0;col<columns;col++)for(const side of [0,1]){
    const bay=rows[side][col].bay,rx=rows[side][col].x,cx=rx+bay/2;
    const junction=addNode(level.id+':junction-'+col+'-'+side,cx,cy,level.elevationM);edge(previousBySide[side],junction,'corridor',cw);previousBySide[side]=junction;
    const rh=(area.h-cw)/2-RULES.wall*2,r={id:id+':'+level.id+':room-'+col+'-'+side,name:theme[(col*2+side+pattern)%theme.length],kind:'compartment',x:rx+RULES.wall,y:side?cy+cw/2+RULES.wall:area.y+RULES.wall,w:bay-RULES.wall*2,h:rh,level:level.id,z:level.elevationM,clearHeightM:level.clearHeightM};
    if(r.w<dw+.2||r.h<.7)throw Error('Compartiment trop étroit');
    const door={id:r.id+':door',from:corridor.id,to:r.id,x:cx,y:side?r.y:r.y+r.h,z:r.z,axis:'x',widthM:dw,level:level.id,origin:'author-design'};
    p.rooms.push(r);p.portals.push(door);const interior=addNode(r.id+':center',cx,r.y+r.h/2,r.z);edge(junction,interior,'door',dw);
   }
   continue;
  }
  for(let col=0;col<columns;col++){
   const bay=usable*weights[col]/total,cx=x+bay/2,junction=addNode(level.id+':junction-'+col,cx,cy,level.elevationM);edge(previous,junction,'corridor',cw);previous=junction;
   for(const side of [0,1]){
    const rh=(area.h-cw)/2-RULES.wall*2,r={id:id+':'+level.id+':room-'+col+'-'+side,name:theme[(col*2+side+pattern)%theme.length],kind:'compartment',x:x+RULES.wall,y:side?cy+cw/2+RULES.wall:area.y+RULES.wall,w:bay-RULES.wall*2,h:rh,level:level.id,z:level.elevationM,clearHeightM:level.clearHeightM};
    if(r.w<dw+.2||r.h<.7)throw Error('Compartiment trop étroit');
    const door={id:r.id+':door',from:corridor.id,to:r.id,x:cx,y:side?r.y:r.y+r.h,z:r.z,axis:'x',widthM:dw,level:level.id,origin:'author-design'};
    p.rooms.push(r);p.portals.push(door);const interior=addNode(r.id+':center',cx,r.y+r.h/2,r.z);edge(junction,interior,'door',dw);
   }
   x+=bay;
  }
 }
 // An external boarding port is a requirement, not a path magically spanning the sea.
 const entryLevel=profile.sub?levels[0]:levels.find(l=>Math.abs(l.keelHeightM-main)<.01),entry=p.nodes.find(n=>n.id.endsWith(entryLevel.id+':shaft'));
 p.boarding.push({id:id+':boarding',node:entry.id,mode:profile.sub?'hatch':'gangway',side:pattern%2?'port':'starboard',connectedToWorld:false,requires:['reachable-landing','clear-boarding-volume']});
 if(profile.sub){const exterior=addNode('surface-hatch',entry.x,entry.y,main-draft);edge(entry.id,exterior,'ladder',.75);p.boarding[0].node=exterior;}
 if(profile.fixedHold)p.reservations.push({id:id+':hold',kind:'cargo-hold',x:holdStart,y:(B-metric('cargo.holdBeam'))/2,w:metric('cargo.holdLength'),h:metric('cargo.holdBeam'),z:1-draft,clearHeightM:metric('cargo.holdHeight'),walkable:false,connected:false,origin:'source-dimensions-author-position'});
 if(profile.tanks)for(let i=0;i<4+group;i++)p.reservations.push({id:id+':tank-'+i,kind:'sealed-cargo-tank',x:L*.23+i*L*.54/(4+group),y:B*.15,w:L*.54/(4+group)-1,h:B*.7,z:2-draft,clearHeightM:main-3,walkable:false,connected:false,origin:'author-design'});
 if(profile.workDeck)p.reservations.push({id:id+':work-deck',kind:'working-deck',x:5,y:1.5,w:L*.56,h:B-3,z:main-draft,clearHeightM:null,walkable:false,connected:false,origin:'author-design-not-entire-published-deck-area'});
 p.authorTopKeelM=Math.max(main,...levels.map(l=>l.keelHeightM+l.clearHeightM))+(profile.sub?4:2);
 p.authorAirDraftM=p.authorTopKeelM-draft;p.heightOrigin='author-design-not-measured-total-height';
 return freeze(p);
}
function inspectPlan(p){
 const errors=[],bad=x=>errors.push(x),rect=o=>finite(o?.x,o?.y,o?.w,o?.h)&&positive(o.w)&&positive(o.h);
 if(!p||!Array.isArray(p.rooms)||!Array.isArray(p.links)||!Array.isArray(p.nodes)||!Array.isArray(p.levels)||!Array.isArray(p.portals)||!Array.isArray(p.reservations)||!Array.isArray(p.boarding))return {ok:false,errors:['schema']};
 if(p.units!=='m'||p.scope!=='author-maritime-layout-not-live-world'||p.playable!==false)bad('false-scope');
 const revised=Object.prototype.hasOwnProperty.call(PROFILES,p.typologyId)&&PROFILES[p.typologyId].furnishing205;
 if(revised?p.furnishingLayout205!==1:Object.prototype.hasOwnProperty.call(p,'furnishingLayout205'))bad('furnishing-layout-revision');
 if(!positive(p.reference?.lengthM)||!positive(p.reference?.beamM)||p.hull?.w!==p.reference.lengthM||p.hull?.h!==p.reference.beamM||!rect(p.hull)||p.hull.waterlineM!==0||!positive(p.reference?.draftM)||Math.abs(p.hull.keelElevationM+p.reference.draftM)>1e-7||p.reference.realTotalHeightM!==null||p.heightOrigin!=='author-design-not-measured-total-height')bad('datum');
 if(!positive(p.authorAirDraftM)||!positive(p.authorTopKeelM)||Math.abs(p.authorAirDraftM-p.authorTopKeelM+p.reference.draftM)>1e-7)bad('height');
 const ids=new Set(),register=id=>{if(typeof id!=='string'||!id||ids.has(id))bad('duplicate-id');ids.add(id);};
 const levels=new Map();for(const l of p.levels){register(l.id);levels.set(l.id,l);if(!finite(l.keelHeightM,l.elevationM,l.clearHeightM)||!positive(l.clearHeightM)||Math.abs(l.elevationM-l.keelHeightM+p.reference.draftM)>1e-7)bad('level-datum');}
 const rooms=new Map();for(const r of p.rooms){register(r.id);rooms.set(r.id,r);const level=levels.get(r.level);if(!rect(r)||!contains(p.hull,r)||!level||!finite(r.z,r.clearHeightM)||r.z!==level.elevationM||r.clearHeightM!==level.clearHeightM||r.z+r.clearHeightM>p.authorAirDraftM)bad('room-bounds');}
 for(let i=0;i<p.rooms.length;i++)for(let j=i+1;j<p.rooms.length;j++){const a=p.rooms[i],b=p.rooms[j];if(a.z<b.z+b.clearHeightM-1e-7&&a.z+a.clearHeightM>b.z+1e-7&&overlap(a,b))bad('room-overlap');}
 for(const r of p.reservations){register(r.id);if(!rect(r)||!contains(p.hull,r)||r.walkable!==false||r.connected!==false||!Number.isFinite(r.z)||r.clearHeightM!==null&&!positive(r.clearHeightM))bad('reservation');
  if(r.clearHeightM!==null&&p.rooms.some(b=>r.z<b.z+b.clearHeightM&&r.z+r.clearHeightM>b.z&&overlap(r,b)))bad('reservation-overlap');}
 const nodes=new Map();for(const n of p.nodes){register(n.id);nodes.set(n.id,n);if(!finite(n.x,n.y,n.z)||!contains(p.hull,{x:n.x,y:n.y,w:0,h:0}))bad('node-bounds');}
 const adjacency=new Map([...nodes.keys()].map(k=>[k,[]]));
 for(const e of p.links){register(e.id);const a=nodes.get(e.from),b=nodes.get(e.to);if(!a||!b||a.id===b.id||!positive(e.widthM)||JSON.stringify(e.modes)!=='["pedestrian"]'){bad('edge');continue;}adjacency.get(a.id).push(b.id);adjacency.get(b.id).push(a.id);
  if(['stairs','ladder'].includes(e.kind)){if(a.x!==b.x||a.y!==b.y||a.z===b.z||Math.abs(a.z-b.z)>4.8)bad('vertical-teleport');}
  else if(!['corridor','door'].includes(e.kind)||a.z!==b.z)bad('level-crossing');
  if(e.kind==='corridor'){
   const c=p.rooms.find(r=>r.kind==='circulation'&&r.z===a.z&&contains(r,{x:Math.min(a.x,b.x),y:a.y-e.widthM/2,w:Math.abs(b.x-a.x),h:e.widthM}));
   if(a.y!==b.y||e.widthM<RULES.subCorridor||!c)bad('corridor-width');
  }
  if(e.kind==='door'){
   const d=p.portals.find(d=>e.to===d.to+':center'),r=d&&rooms.get(d.to),c=d&&rooms.get(d.from);
   if(!d||!r||!c||e.widthM!==d.widthM||Math.abs(a.x-d.x)>1e-7||Math.abs(b.x-d.x)>1e-7||Math.abs(a.y-c.y-c.h/2)>1e-7||Math.abs(b.y-r.y-r.h/2)>1e-7)bad('door-path');
  }
 }
 const served=new Set();for(const d of p.portals){register(d.id);const r=rooms.get(d.to),c=rooms.get(d.from);if(!r||!c||c.kind!=='circulation'||d.level!==r.level||r.level!==c.level||d.z!==r.z||!positive(d.widthM)||d.widthM<RULES.subDoor||d.axis!=='x'){bad('portal');continue;}
  if(d.x-d.widthM/2<r.x||d.x+d.widthM/2>r.x+r.w||Math.min(Math.abs(d.y-r.y),Math.abs(d.y-r.y-r.h))>1e-7)bad('portal-face');
  if(!p.links.some(e=>e.kind==='door'&&e.to===r.id+':center'))bad('portal-link');served.add(d.to);
 }
 if(p.rooms.some(r=>r.kind==='compartment'&&!served.has(r.id)))bad('room-disconnected');
 if(!p.boarding.length||p.boarding.some(b=>b.connectedToWorld!==false||!nodes.has(b.node)))bad('false-boarding');
 const seen=new Set(p.boarding.map(b=>b.node).filter(id=>nodes.has(id))),queue=[...seen];for(let i=0;i<queue.length;i++)for(const n of adjacency.get(queue[i])||[])if(!seen.has(n)){seen.add(n);queue.push(n);}
 if(seen.size!==nodes.size)bad('network-disconnected');
 return {ok:errors.length===0,errors:[...new Set(errors)],rooms:p.rooms.filter(r=>r.kind==='compartment').length,levels:p.levels.length,links:p.links.length,unconnectedReservations:p.reservations.length};
}
function audit(p){try{return inspectPlan(p);}catch{return {ok:false,errors:['schema']};}}
function auditAll(){const records=[];for(const type of Object.keys(PROFILES))for(let number=1;number<=RULES.variants;number++){const p=build(type,number),a=audit(p);if(!a.ok)throw Error(p.id+' '+a.errors.join(','));records.push({id:p.id,type,number,...a});}return {scope:'author-maritime-not-playable',variants:records.length,playable:0,records};}
if(require.main===module){const out=path.resolve(process.argv[2]||'artifacts/qa/codex-maritime2026');fs.mkdirSync(out,{recursive:true});const a=auditAll();fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(a,null,2)+'\n');for(const type of Object.keys(PROFILES))fs.writeFileSync(path.join(out,type+'.json'),JSON.stringify(Array.from({length:50},(_,i)=>build(type,i+1)))+'\n');console.log(JSON.stringify({variants:a.variants,rooms:a.records.reduce((n,r)=>n+r.rooms,0),playable:0}));}
module.exports={RULES,PROFILES,build,audit,auditAll,contains,overlap};
