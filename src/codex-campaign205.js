/* G11 adapts four authored ground-level compounds to the existing regional
 * movement, finite-container, encounter and relay owners. Author plans remain
 * inspection records; this adapter owns their separate campaign contract. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexCampaign205=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const types=Object.freeze(['EXT-MONDE-T045','EXT-MONDE-T046','EXT-MONDE-T047','EXT-MONDE-T048']);
 const templates=new Map(),adapted=new Map();
 const dependency=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const geometry=()=>dependency('DeadwallFrontierGeometry','./frontier-geometry.js');
 const core=()=>dependency('DeadwallCore','./core.js');
 const rules=()=>core().CampaignSites205Rules;
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const copy=v=>JSON.parse(JSON.stringify(v));
 function typeFor(typology,number){if(!types.includes(typology)||!Number.isInteger(number)||number<1||number>50)return null;return'campaign205-'+typology.slice(-3)+'-'+String(number).padStart(2,'0');}
 function identity(type){const m=/^campaign205-(045|046|047|048)-(\d{2})$/.exec(type||'');if(!m)return null;const typology='EXT-MONDE-T'+m[1],number=Number(m[2]);return typeFor(typology,number)===type?{typology,number}:null;}
 function template(type){
  const id=identity(type);if(!id)throw Error('Plan de campagne205 inconnu.');
  const L=dependency('DeadwallCodexLayouts2026','./codex-layouts2026.js'),P=dependency('DeadwallCodexPhysical2026','./codex-physical2026.js'),F=dependency('DeadwallCodexFurnishings2026','./codex-furnishings2026.js');
  const key=L.sourceHash+':'+type;if(templates.has(key))return templates.get(key);
  const author=L.build(id.typology,id.number),base=P.build(author),furnishing=F.build(author),propsAudit=F.audit(author,furnishing);
  if(!propsAudit.ok||base.levels.length!==1||base.levels[0].index!==0||author.buildings.some(b=>b.levels.length!==1||b.levels[0]!==0))throw Error('Le site205 doit avoir un seul niveau au sol valide.');
  const scene=P.withProps(base,furnishing.props),planAudit=P.audit(scene);
  if(!planAudit.ok)throw Error('Le site205 ne possède pas un accès physique complet.');
  const result=freeze({sourceHash:L.sourceHash,identity:id,author,base,scene,furnishing,planAudit,propsAudit});
  templates.set(key,result);if(templates.size>16)templates.delete(templates.keys().next().value);return result;
 }
 function preset(type){if(!identity(type))return null;const t=template(type),a=t.author;return freeze({id:type,name:a.name,layout:'campaign205',w:a.bounds.w,h:a.bounds.h,levels:[0],entry:[t.base.entry.x,0],exit:[t.base.entry.x,0],campaign205:{version:1,typology:t.identity.typology,variant:t.identity.number,authorPlanId:a.id}});}
 function historicalBudget(p){
  const G=geometry(),profile=rules().parentProfiles[p.campaign205.typology],d=G.BY[profile];
  if(!d)throw Error('Profil de butin historique205 absent.');
  const source={id:p.id,type:d.id,w:d.w,h:d.h,x:0,y:0,a:0,generation:1},budget={};
  // One whole historical profile per parcel, irrespective of its buildings,
  // units, furniture count or cosmetic variant. No city/bag credit is issued.
  for(const z of d.levels)for(const o of G.plan(source,z).objects)budget[o.resource]=(budget[o.resource]||0)+o.amount;
  return budget;
 }
 const preferred=Object.freeze({wood:['wardrobe','shelf','smallCabinet','crate','crateStack'],food:['fridge','counter','shelf','smallCabinet','crate'],scrap:['toolbox','workbench','desk','crateStack','crate','shelf']});
 const roofFamilies=Object.freeze({'mobile-home':'cabin','worker-lodge':'cabin',reception:'civic',sanitary:'service','common-services':'service'});
 function stockProps(props,budget){
  const F=dependency('DeadwallCodexFurnishings2026','./codex-furnishings2026.js'),eligible=props.filter(p=>F.CATALOGUE[p.kind]?.lootEligible),selected=new Map();
  for(const [resource,total]of Object.entries(budget)){
   const order=preferred[resource]||['crate','shelf','smallCabinet'];
   const candidates=eligible.filter(p=>!selected.has(p.id)).sort((a,b)=>{const ai=order.indexOf(a.kind),bi=order.indexOf(b.kind);return(ai<0?999:ai)-(bi<0?999:bi)||a.id.localeCompare(b.id);});
   const relevant=candidates.filter(p=>order.includes(p.kind)),targets=(relevant.length?relevant:candidates).slice(0,rules().containersPerResource);
   if(!targets.length||!Number.isSafeInteger(total)||total<=0)throw Error('Budget205 sans contenant compatible.');
   for(let i=0;i<targets.length;i++){const amount=Math.floor(total/targets.length)+(i<total%targets.length?1:0);if(amount)selected.set(targets[i].id,{resource,amount});}
  }
  return selected;
 }
 function make(p){
  if(!p?.campaign205||p.generation!==11||!/^P\d{4}$/.test(p.id))throw Error('Instance de campagne205 invalide.');
  const d=preset(p.type);if(!d||p.w!==d.w||p.h!==d.h||JSON.stringify(p.campaign205)!==JSON.stringify(d.campaign205))throw Error('Dimensions ou provenance205 incompatibles.');
  const t=template(p.type),key=[t.sourceHash,p.type,p.id,p.x,p.y,p.a].join(':'),prior=adapted.get(key);if(prior)return prior;
  const budget=historicalBudget(p),stocks=stockProps(t.furnishing.props,budget);
  const props=t.furnishing.props.map((o,index)=>({...copy(o),id:p.id+':0:'+index,authorObjectId:o.id,campaign205:true,a:0,room:t.scene.rooms.find(r=>r.id===o.roomId)?.name||'Pièce du site'}));
  const objects=[],interior=[];
  for(const o of props){const stock=stocks.get(o.authorObjectId);if(stock)objects.push({...o,...stock,label:o.name||undefined});else interior.push(o);}
  const outdoor=t.base.solids.map((o,index)=>({...copy(o),id:p.id+':205:static:'+index,campaign205:true,campaign205Structural:true,solid:true,rotationRad:o.rotationRad??0,...(o.kind==='closed-pool'?{opaque:false}:{}),z:0}));
  const volumes=t.author.buildings.map((b,index)=>({id:p.id+':205:building:'+index,authorBuildingId:b.id,name:b.name||b.kind,kind:'building',x:b.x,y:b.y,w:b.w,h:b.h,z:0,roofFamily:roofFamilies[b.kind]||'warehouse',entry:{x:b.x+b.entry.x,y:b.y+b.entry.y},campaign205:true}));
  const terrain=[];
  const nodes=new Map(t.author.network.nodes.map(n=>[n.id,n]));
  for(const e of t.author.network.edges){const a=nodes.get(e.from),b=nodes.get(e.to);if(!a||!b||(a.z??a.level??0)!==0||(b.z??b.level??0)!==0)continue;
   // These authors declare orthogonal paths. Their actual full-width bands
   // are presentation surfaces, never an authority granting vehicle access.
   if(Math.abs(a.x-b.x)>1e-8&&Math.abs(a.y-b.y)>1e-8)continue;
   terrain.push({id:p.id+':205:path:'+terrain.length,kind:'road',x:Math.min(a.x,b.x)-e.widthM/2,y:Math.min(a.y,b.y)-e.widthM/2,w:Math.max(Math.abs(a.x-b.x),.01)+e.widthM,h:Math.max(Math.abs(a.y-b.y),.01)+e.widthM,z:0,allowVehicle:e.mode==='service',campaign205:true});
  }
  const plan=freeze({w:p.w,h:p.h,z:0,campaign205:copy(p.campaign205),walls:copy(t.base.walls),objects,stairs:[],rooms:copy(t.base.rooms),floor:{x:0,y:0,w:p.w,h:p.h},entry:geometry().global(p,t.base.entry.x,0),exit:geometry().global(p,t.base.entry.x,0),volumes160:volumes,terrain160:terrain,visuals160:[],movement160:[],gates160:[],static205:outdoor,areas205:copy(t.base.areas),budget205:budget});
  const details=freeze({interior,outdoor,colliders160:{interior:interior.filter(o=>o.solid),outdoor},campaign205:copy(p.campaign205)});
  const value=freeze({plan,details});adapted.set(key,value);if(adapted.size>32)adapted.delete(adapted.keys().next().value);return value;
 }
 function plan(p,z=0){if(z!==0)throw Error('Le site205 ne possède pas cet étage.');return make(p).plan;}
 function details(p,z=0){if(z!==0)throw Error('Le site205 ne possède pas cet étage.');return make(p).details;}
 function insideBuilding(p,point){if(!p?.campaign205||!point)return false;const q=geometry().local(p,point.x,point.y);return plan(p,0).volumes160.some(b=>q.x>b.x&&q.y>b.y&&q.x<b.x+b.w&&q.y<b.y+b.h);}
 function populate({seed,roads,install,biomes,sectors,spawn,home}){
  const G=geometry(),R=rules(),viable=roads.filter(r=>r.access!=='controlled'&&!['motorway','highway','freeway','ramp','approach'].includes(r.roadClass)&&Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>=R.minimumRoadLength),bySector=new Map(sectors.map(s=>[s.id,s]));
  const placed=[],missing=[];
  for(const typology of types)for(let instance=0;instance<R.instancesPerType;instance++){
   const first=G.hash(seed,typology,'variant205')%50,number=1+(first+instance*(1+G.hash(seed,typology,'variant-stride205')%49))%50,type=typeFor(typology,number),d=preset(type),start=viable.length?G.hash(seed,typology,instance,'road205')%viable.length:0;let accepted=false;
   for(let attempt=0;attempt<R.attemptLimit&&viable.length;attempt++){
    const r=viable[(start+attempt*83)%viable.length],angle=Math.atan2(r.b.y-r.a.y,r.b.x-r.a.x),side=G.hash(seed,type,instance,attempt,'side205')%2?1:-1,f=.12+.76*G.hash(seed,type,instance,attempt,'frontage205')/4294967296,off=r.width/2+R.frontSetback+d.h/2+Math.floor(attempt/32)*R.extraSetback;
    const x=r.a.x+(r.b.x-r.a.x)*f-Math.sin(angle)*off*side,y=r.a.y+(r.b.y-r.a.y)*f+Math.cos(angle)*off*side,biome=biomes.sample(seed,x,y,false,{generation:9});
    if(!R.allowedSpawnBiomes.includes(biome.def.spawnBiome)||R.excludedBiomes.includes(biome.id))continue;
    const p=install(type,x,y,angle+(side<0?Math.PI:0),r);if(!p)continue;
    const occupancy=spawn.roll({seed,id:p.id,biome:biome.def.spawnBiome,distance:Math.hypot(x-home.x,y-home.y)});
    Object.assign(p,{generation:11,campaign205:copy(d.campaign205),biome:biome.id,occupation:occupancy.kind,distanceBand:occupancy.band,zone:'habitat',sector:'S'+Math.floor(x/1024)+'_'+Math.floor(y/1024),frontier131:{role:occupancy.kind==='allied'?'relay':occupancy.kind==='infected'?'contested':'waypoint'}});
    // Prepare before publishing the site to the sector: geometry and finite
    // stock must be acceptable together, never repaired by shrinking props.
    make(p);bySector.get(p.sector)?.sites.push(p.id);placed.push({id:p.id,...copy(p.campaign205)});accepted=true;break;
   }
   if(!accepted)missing.push({typology,variant:number,instance,reason:'no-compatible-dry-road-parcel'});
  }
  return freeze({generation:11,eligibleTypes:types.length,eligibleVariants:types.length*50,maximumSites:R.instancesPerType*types.length,placed:placed.length,sites:placed,missing});
 }
 return Object.freeze({version:1,generation:11,types,variants:50,typeFor,identity,preset,template,plan,details,insideBuilding,historicalBudget,populate});
});
