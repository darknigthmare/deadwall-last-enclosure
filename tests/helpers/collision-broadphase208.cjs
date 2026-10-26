'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),filename=path.join(root,'src/frontier-world.js'),localRequire=createRequire(filename);
const C=localRequire('./core.js'),G=localRequire('./frontier-geometry.js'),D=localRequire('./seed-detail157.js'),R=localRequire('./codex3000-runtime.js'),X=localRequire('./codex-geometry160.js');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const effects11={detailVersion:13,ecologyVersion:1,hydrologyVersion:1,landscape189:'balanced'};
function countingWorld208({source=fs.readFileSync(filename,'utf8'),generation=11,effects=effects11}={}){
 const counts={details:0,enrich:0,context:0},sandbox={module:{exports:{}},require:localRequire,DeadwallCore:C,
  DeadwallSeedDetail157:{...D,make(...a){counts.details++;return D.make(...a);}},
  DeadwallCodex3000Runtime:{...R,enrich(...a){counts.enrich++;return R.enrich(...a);}},
  DeadwallCodexGeometry160:{...X,details(...a){counts.context++;return X.details(...a);}}};
 vm.runInNewContext(source,sandbox,{filename});const api=sandbox.module.exports,world=api.create(17117,generation,{...effects});
 return{api,world,counts,generation,effects:{...effects}};
}
const point208=Object.freeze({x:14577.412856171773,y:2632.806636736753});
function query208(f){const w=f.world,a=point208,b={x:a.x+.11,y:a.y};return{blocked:w.blocked(a.x,a.y,.32,0,'P3174'),optical:w.line(a,b,0,'P3174',null,.32),movement:w.movementLine(a,b,0,'P3174',null,.32)};}
function churn208(f){const w=f.world,near=new Set(w.nearPOI(point208.x,point208.y,10)),sites=w.pois.filter(p=>!p.programme160&&!p.campaign205&&!near.has(p)).slice(0,67);for(const p of sites){w.plan(p,0);w.detailAt(p,0);}return sites;}
function samples208(w){
 const selected=[w.pois.find(p=>p.id==='P1125'),w.pois.find(p=>p.programme160),w.pois.find(p=>p.campaign205),...w.pois.filter(p=>!p.programme160&&!p.campaign205).slice(0,4)].filter(Boolean),queries=[];
 const poolSite=w.pois.filter(p=>p.campaign205).find(p=>w.detailAt(p,0).outdoor.some(o=>o.kind==='closed-pool'));if(poolSite)selected.push(poolSite);
 const sites=[...new Set(selected)];
 for(const p of sites){const d=w.detailAt(p,0),solids=d.colliders160?.outdoor||[],outside=solids.find(o=>o.x<0||o.y<0||o.x+o.w>p.w||o.y+o.h>p.h),pool=solids.find(o=>o.opaque===false),objects=[...new Set([outside,pool,solids[0]].filter(Boolean))];
  for(const o of objects){for(const r of[0,.32,1.25])for(const offset of[-1e-7,0,1e-7]){const a=G.global(p,o.x-r+offset,o.y+o.h/2),b=G.global(p,o.x+o.w+r-offset,o.y+o.h/2);queries.push({site:p.id,object:o.id,kind:o.kind,opaque:o.opaque??true,r,ignore:null,a,b,scope:'tangent-and-rotated-crossing'});}
   const a=G.global(p,o.x+o.w*.4,o.y+o.h*.4),b=G.global(p,o.x+o.w*.6,o.y+o.h*.6);for(const ignore of[null,o.id])queries.push({site:p.id,object:o.id,kind:o.kind,opaque:o.opaque??true,r:.05,ignore,a,b,scope:'inside-and-ignore'});
  }
 }
 return{sites,queries};
}
function evaluate208(w,q){return{blocked:w.blocked(q.a.x,q.a.y,q.r,0,q.site,q.ignore),optical:w.line(q.a,q.b,0,q.site,q.ignore,q.r),movement:w.movementLine(q.a,q.b,0,q.site,q.ignore,q.r)};}
function geometry208(w,sites){return{world:hash({generation:w.generation,home:w.home,roads:w.roads,pois:w.pois,towns:w.towns,sectors:w.sectors,coverage:w.campaignCoverage205}),sites:sites.map(p=>({id:p.id,plan:hash(w.plan(p,0)),details:hash(w.detailAt(p,0)),ids:hash([...w.plan(p,0).objects,...w.detailAt(p,0).interior,...w.detailAt(p,0).outdoor].map(o=>o.id)),stocks:hash(w.plan(p,0).objects.map(o=>[o.id,o.resource,o.amount]))}))};}
module.exports={countingWorld208,query208,churn208,samples208,evaluate208,geometry208,effects11,point208,hash};
