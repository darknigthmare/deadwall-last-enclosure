'use strict';
const fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),A=require('../src/codex-campaign205.js'),G=require('../src/frontier-geometry.js');
const ROOT=path.resolve(__dirname,'..');
const Sources=require('./campaign-sources205.cjs');
const INPUTS=Object.freeze(Sources.sourceNames(ROOT));
const capture=()=>Sources.capture(ROOT);
const sums=objects=>objects.reduce((sum,o)=>(sum[o.resource]=(sum[o.resource]||0)+o.amount,sum),{});
const equalBudget=(a,b)=>C.RESOURCE_KEYS.every(k=>(a[k]||0)===(b[k]||0));
function auditVariant205(typology,number){
 const campaignType=A.typeFor(typology,number),d=A.preset(campaignType),t=A.template(campaignType),p={...d,type:campaignType,id:'P'+String(9000+A.types.indexOf(typology)*50+number-1),x:1000,y:1000,a:0,generation:11},plan=A.plan(p),detail=A.details(p),loot=sums(plan.objects);
 const catalogue=require('../src/codex-furnishings2026.js').CATALOGUE;
 const finiteLoot=equalBudget(loot,A.historicalBudget(p))&&plan.objects.every(o=>Number.isSafeInteger(o.amount)&&o.amount>0&&C.RESOURCE_KEYS.includes(o.resource)&&/^P\d{4}:0:\d+$/.test(o.id)&&catalogue[o.kind]?.lootEligible)&&![...detail.interior,...detail.outdoor].some(o=>Object.hasOwn(o,'amount')||Object.hasOwn(o,'resource'));
 const planAudit=t.planAudit.ok&&t.author.playable===false&&plan.w===t.author.bounds.w&&plan.h===t.author.bounds.h&&plan.volumes160.length===t.author.buildings.length;
 const propsAudit=t.propsAudit.ok&&t.furnishing.unplaced.length===0&&plan.objects.length+detail.interior.length===t.furnishing.props.length;
 const doorsReachable=t.planAudit.ok&&t.scene.rooms.every(r=>t.scene.nodes.some(n=>n.level===r.level&&Math.abs(n.x-r.x-r.w/2)<1e-8&&Math.abs(n.y-r.y-r.h/2)<1e-8));
 return{id:t.author.id,typologyId:typology,number,campaignType,pass:planAudit&&propsAudit&&finiteLoot&&doorsReachable,planAudit,propsAudit,finiteLoot,doorsReachable,buildings:plan.volumes160.length,props:t.furnishing.props.length,lootContainers:plan.objects.length,parentBudgetProfile:C.CampaignSites205Rules.parentProfiles[typology],budget:loot};
}
function auditPlacements205(seed){
 const W=require('../src/frontier-world.js'),effects={detailVersion:13,ecologyVersion:1,hydrologyVersion:1},old=W.create(seed,10,effects),w=W.create(seed,11,effects),sites=[];
 if(JSON.stringify(w.pois.slice(0,old.pois.length))!==JSON.stringify(old.pois)||JSON.stringify(w.roads)!==JSON.stringify(old.roads))throw Error('G11 modified historical sites or roads.');
 for(const p of w.pois.filter(p=>p.campaign205)){
  const t=A.template(p.type),nodes=t.scene.nodes,nativePathClear=t.scene.edges.filter(e=>e.kind==='walk').every(e=>{const a=nodes.find(n=>n.id===e.from),b=nodes.find(n=>n.id===e.to);return w.movementLine(G.global(p,a.x,a.y),G.global(p,b.x,b.y),0,p.id,null,.32);});
  const door=G.global(p,t.base.entry.x,.75),doorClear=!w.blocked(door.x,door.y,.32,0,p.id),roadEntryClear=w.movementLine(p.drive.a,door,0,null,null,.32),frontage=w.frontageFor(p),physicalAudit=nativePathClear&&doorClear&&roadEntryClear&&frontage.ok;
  sites.push({id:p.id,authorPlanId:p.campaign205.authorPlanId,campaignType:p.type,typologyId:p.campaign205.typology,number:p.campaign205.variant,x:p.x,y:p.y,physicalAudit,physicalChecks:{nativePathClear,doorClear,roadEntryClear,frontageClear:frontage.ok,frontageReason:frontage.reason,...(frontage.conflict?{frontageConflict:frontage.conflict}:{})}});
 }
 return{seed,generation:11,pass:sites.length<=8&&sites.every(s=>s.physicalAudit),historicalPrefixUnchanged:true,sites};
}
function run(options={}){
 const sources=capture(),records=[];for(const typology of A.types)for(let n=1;n<=50;n++)records.push(auditVariant205(typology,n));
 const placements=(options.seeds||[]).map(auditPlacements205),sourcesAfter=capture(),sourceStable=JSON.stringify(sourcesAfter)===JSON.stringify(sources);
 return{version:1,scope:'campaign205-eligibility-audit',generation:11,pass:sourceStable&&records.length===200&&records.every(r=>r.pass)&&placements.every(p=>p.pass),sourceStable,sources,sourcesAfter,records,placements,eligibleVariants:200,maximumSites:8,...(sourceStable?{}:{failure:'Campaign audit sources changed while executing.'}),scopeLimit:'Eligibility of200 variants is distinct from seeded physical instances; campaign services and save/restore are qualified separately.'};
}
if(require.main===module){
 const args=process.argv.slice(2),output=args[0],seeds=args.slice(1).map(Number);if(!output||seeds.some(n=>!Number.isInteger(n)||n<0||n>4294967295))throw Error('Usage: node scripts/audit-campaign-sites205.cjs OUTPUT.json [seed ...]');
 const report=run({seeds});fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,variants:report.records.length,placements:report.placements.map(p=>({seed:p.seed,sites:p.sites.length,pass:p.pass})),output}));if(!report.pass)process.exitCode=1;
}
module.exports={auditVariant205,auditPlacements205,run,INPUTS};
