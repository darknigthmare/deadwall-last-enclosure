/* DEADWALL — roads are a ground layer, never walls, stockpiles or free buildings. */
(function initInfrastructure(root) {
  'use strict';
  const VERSION='1.6.0-candidate.1';
  const RULES=Object.freeze({saveVersion:8,tile:32,worldTiles:128,maxRoads:2048,maxTrace:64,maxCrew:8,crewPerDepot:2,maxRuins:96,maxStep:.25,
    cost:Object.freeze({stone:2,scrap:1}),workSeconds:3,playerWork:1.4,workerWork:1,workRange:48,dangerRange:110,homeRange:60,
    friendlySpeed:1.18,truckSpeed:1.30,hostileSpeed:1.10,maxExpanded:8192});
  const BUILDINGS=Object.freeze({roadDepot:Object.freeze({id:'roadDepot',name:'Atelier de voirie',category:'industry',icon:'▱',symbol:'VOIRIE',
    description:'Deux ouvriers existants peuvent être détachés aux pistes financées. Travail diurne, accès physique et alimentation électrique requis.',
    cost:Object.freeze({wood:45,scrap:55,stone:35}),health:850,size:Object.freeze([3,3]),unlockTier:1,requires:'planningOffice',score:6,buildTime:26,powerUse:1,color:'#6b6757',roof:'#aba187',light:60})});
  const finite=(n,a=0,b=1e12)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
  const integer=(n,a=0,b=0x7ffffffe)=>Number.isInteger(n)&&finite(n,a,b);
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const copy=x=>JSON.parse(JSON.stringify(x));
  const key=(x,y)=>y*RULES.worldTiles+x;
  const cell=p=>object(p)&&integer(p.x,1,126)&&integer(p.y,1,126);
  const fail=message=>{throw new Error('Réseau de cité invalide : '+message+'.');};
  function create(){return{version:1,roads:[],crew:[],ruins:[],stats:{laid:0,reconstructed:0,forgotten:0}};}
  function normalize(raw){
    if(raw===undefined)return create();
    if(!object(raw)||raw.version!==1||!Array.isArray(raw.roads)||raw.roads.length>RULES.maxRoads||!Array.isArray(raw.crew)||raw.crew.length>RULES.maxCrew||!Array.isArray(raw.ruins)||raw.ruins.length>RULES.maxRuins)fail('format ou capacité');
    const ids=new Set(),workers=new Set(),ruins=new Set(),positions=new Set();
    const roads=raw.roads.map(p=>{if(!cell(p)||!finite(p.progress,0,1)||ids.has(key(p.x,p.y)))fail('piste dupliquée ou hors carte');ids.add(key(p.x,p.y));return{x:p.x,y:p.y,progress:p.progress};});
    const crew=raw.crew.map(u=>{if(!object(u)||!integer(u.id,1)||typeof u.returning!=='boolean'||workers.has(u.id))fail('équipe');workers.add(u.id);return{id:u.id,returning:u.returning};});
    const blueprints=raw.ruins.map(b=>{
      if(!object(b)||!integer(b.id,1)||typeof b.type!=='string'||!/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(b.type)||b.type==='core'||!integer(b.gx,1,126)||!integer(b.gy,1,126)||!integer(b.rotation,0,3)||!finite(b.at)||ruins.has(b.id)||positions.has(b.gx+':'+b.gy))fail('empreinte de reconstruction');
      ruins.add(b.id);positions.add(b.gx+':'+b.gy);return{id:b.id,type:b.type,gx:b.gx,gy:b.gy,rotation:b.rotation,at:b.at};
    });
    const stats={};for(const name of ['laid','reconstructed','forgotten']){const n=raw.stats?.[name]??0;if(!integer(n,0,1e12))fail('statistique');stats[name]=n;}
    return{version:1,roads,crew,ruins:blueprints,stats};
  }
  function line(a,b){
    if(!cell(a)||!cell(b))return null;
    // One cardinal leg followed by the other. No diagonal gaps; never an unbounded trace.
    if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+1>RULES.maxTrace)return null;
    const out=[{x:a.x,y:a.y}],p={...a};
    while(p.x!==b.x){p.x+=Math.sign(b.x-p.x);out.push({...p});}
    while(p.y!==b.y){p.y+=Math.sign(b.y-p.y);out.push({...p});}
    return out;
  }
  function quote(state,cells,stock,blocked=()=>false){
    if(!Array.isArray(cells)||!cells.length||cells.length>RULES.maxTrace||!object(stock))return{ok:false,reason:'Trace vide, trop longue ou réserves absentes.'};
    const seen=new Set(),existing=new Set(state.roads.map(p=>key(p.x,p.y))),fresh=[];
    for(const p of cells){
      if(!cell(p)||seen.has(key(p.x,p.y)))return{ok:false,reason:'Une cellule de la trace est invalide ou répétée.'};
      if(seen.size){const prev=cells[seen.size-1];if(Math.abs(prev.x-p.x)+Math.abs(prev.y-p.y)!==1)return{ok:false,reason:'La piste doit rester raccordée par ses côtés.'};}
      seen.add(key(p.x,p.y));if(existing.has(key(p.x,p.y)))continue;
      if(blocked(p.x,p.y))return{ok:false,reason:'Une structure ou une ressource empêche ce tronçon.'};fresh.push({x:p.x,y:p.y});
    }
    if(!fresh.length)return{ok:false,reason:'Cette trace est déjà financée.'};
    if(state.roads.length+fresh.length>RULES.maxRoads)return{ok:false,reason:'Limite de 2 048 cellules de piste atteinte.'};
    const cost=Object.fromEntries(Object.entries(RULES.cost).map(([k,n])=>[k,n*fresh.length]));
    if(Object.entries(cost).some(([k,n])=>!finite(stock[k])||stock[k]<n))return{ok:false,reason:'Pierre ou ferraille insuffisante.',cost};
    return{ok:true,cells:fresh,cost,reason:'Financement complet, puis travaux sur place. Aucune piste terminée instantanément.'};
  }
  class Heap{
    constructor(){this.items=[];}
    push(v){let i=this.items.length;this.items.push(v);while(i){const p=(i-1)>>1;if(this.items[p].f<=v.f)break;this.items[i]=this.items[p];i=p;}this.items[i]=v;}
    pop(){const top=this.items[0],end=this.items.pop();if(this.items.length){let i=0;while(i*2+1<this.items.length){let c=i*2+1;if(c+1<this.items.length&&this.items[c+1].f<this.items[c].f)c++;if(this.items[c].f>=end.f)break;this.items[i]=this.items[c];i=c;}this.items[i]=end;}return top;}
  }
  function findRoute(start,goal,blocked,cost=()=>1,width=128,height=128,maxExpanded=RULES.maxExpanded,minCost=1/RULES.truckSpeed){
    const valid=p=>object(p)&&integer(p.x,0,width-1)&&integer(p.y,0,height-1);
    if(!integer(width,1,128)||!integer(height,1,128)||!integer(maxExpanded,1,16384)||!finite(minCost,.1,1)||!valid(start)||!valid(goal)||typeof blocked!=='function'||blocked(goal.x,goal.y))return null;
    const origin=start.y*width+start.x,target=goal.y*width+goal.x;if(origin===target)return[];
    const best=new Float64Array(width*height);best.fill(Infinity);best[origin]=0;
    const previous=new Int32Array(width*height);previous.fill(-1);const open=new Heap();
    const h=(x,y)=>(Math.abs(x-goal.x)+Math.abs(y-goal.y))*minCost;
    open.push({i:origin,g:0,f:h(start.x,start.y)});let expanded=0;
    while(open.items.length&&expanded<maxExpanded){
      const q=open.pop();if(q.g!==best[q.i])continue;
      if(q.i===target){const path=[];for(let k=target;k!==origin;k=previous[k]){if(k<0||path.length>width*height)return null;path.push({x:k%width,y:Math.floor(k/width)});}return path.reverse();}
      expanded++;const x=q.i%width,y=Math.floor(q.i/width);
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height||blocked(nx,ny))continue;
        const rate=cost(nx,ny);if(!finite(rate,minCost,100))return null;
        const i=ny*width+nx,g=q.g+rate;if(g>=best[i]-1e-12)continue;best[i]=g;previous[i]=q.i;open.push({i,g,f:g+h(nx,ny)});
      }
    }return null;
  }
  class Engine{
    constructor(raw){this.state=normalize(raw);this.index=new Map(this.state.roads.map(p=>[key(p.x,p.y),p]));}
    snapshot(){return copy(this.state);}
    road(x,y){return this.index.get(key(x,y))||null;}
    at(x,y){if(!finite(x,0,4096)||!finite(y,0,4096))return null;return this.road(Math.floor(x/32),Math.floor(y/32));}
    multiplier(x,y,kind='friendly'){return this.at(x,y)?.progress===1?(kind==='truck'?RULES.truckSpeed:kind==='hostile'?RULES.hostileSpeed:RULES.friendlySpeed):1;}
    commit(cells,stock,blocked){const q=quote(this.state,cells,stock,blocked);if(!q.ok)return q;
      for(const [k,n]of Object.entries(q.cost))stock[k]-=n;
      for(const p of q.cells){const item={...p,progress:0};this.state.roads.push(item);this.index.set(key(p.x,p.y),item);}return q;
    }
    work(x,y,seconds){const p=this.road(x,y);if(!p||p.progress===1||!finite(seconds,0,RULES.maxStep*RULES.playerWork)||seconds===0)return false;
      p.progress=Math.min(1,p.progress+seconds/RULES.workSeconds);if(p.progress>1-1e-9)p.progress=1;
      if(p.progress===1){this.state.stats.laid=Math.min(1e12,this.state.stats.laid+1);return true;}return false;
    }
    remove(x,y){const p=this.road(x,y);if(!p)return false;this.state.roads=this.state.roads.filter(r=>r!==p);this.index.delete(key(x,y));return true;}
    assign(id){if(!integer(id,1)||this.state.crew.length>=RULES.maxCrew||this.state.crew.some(u=>u.id===id))return false;this.state.crew.push({id,returning:false});return true;}
    recall(id){const u=this.state.crew.find(u=>u.id===id);if(!u)return false;u.returning=true;return true;}
    remember(b,at){const record={id:b.id,type:b.type,gx:b.gx,gy:b.gy,rotation:b.rotation||0,at};
      if(b.type==='core')return false;normalize({...create(),ruins:[record]});
      this.state.ruins=this.state.ruins.filter(r=>r.id!==b.id&&(r.gx!==b.gx||r.gy!==b.gy));this.state.ruins.push(record);
      if(this.state.ruins.length>RULES.maxRuins){this.state.ruins.shift();this.state.stats.forgotten=Math.min(1e12,this.state.stats.forgotten+1);}return true;
    }
    forget(id,rebuilt=false){const i=this.state.ruins.findIndex(r=>r.id===id);if(i===-1)return false;this.state.ruins.splice(i,1);if(rebuilt)this.state.stats.reconstructed=Math.min(1e12,this.state.stats.reconstructed+1);return true;}
  }
  function install(C){
    if(!C||C.Infrastructure)return;
    for(const [id,b]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw Error('Construction en conflit : '+id);C.BUILDINGS[id]=b;}
    const old=C.migrateSaveData;C.migrateSaveData=raw=>{
      if(!object(raw))return null;
      if(raw.version===8){if(raw.infrastructure===undefined)fail('registre v8 absent');const state=normalize(raw.infrastructure),base=old({...raw,version:7});return base?{...base,version:8,infrastructure:state}:null;}
      if(![1,2,3,4,5,6,7].includes(raw.version))return null;const base=old(raw);return base?{...base,version:8,infrastructure:create()}:null;
    };
    const previousPath=C.findFriendlyPath;
    if(typeof previousPath==='function')C.findFriendlyPath=function(...args){return root.DEADWALL?.infrastructure?root.DEADWALL.infrastructure.findPath(...args):previousPath(...args);};
    C.SAVE_VERSION=8;C.SAVE_KEY='deadwall-save-v8';C.SAVE_BACKUP_KEY='deadwall-save-backup-v8';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v7','deadwall-save-backup-v7',...(C.LEGACY_SAVE_KEYS||[])])];C.INFRASTRUCTURE_RULES=RULES;C.Infrastructure=API;
  }
  const API=Object.freeze({VERSION,RULES,BUILDINGS,create,normalize,line,quote,findRoute,Engine,install});root.DeadwallInfrastructure=API;
  if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;if(root.DeadwallCore)install(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);
