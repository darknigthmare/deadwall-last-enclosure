/* Faune et épaves des cantons du monde sans bord (docs/GAME_BIBLE.md §7.13, specs/monde-sans-bord/tasks.md T5.4).
   Une campagne NOUVELLE de génération 12 (option « Sans bord — expérimental ») reçoit la faune régionale de la région finie,
   avec la même logique et le même équilibrage : deux groupes candidats par morceau de 256 m, présence, espèces des guildes
   de chaque milieu (`Landscape189Rules`), espèces d'eau douce et salée selon l'eau la plus proche, dérive, alarme, fuite,
   repos et activité du jour (`src/wildlife189.js`). Seuls changent l'adressage et les tirages :
   - un animal est nommé par son canton : `K<cx>_<cy>:faune:<n>` (n = morceau × 8 + emplacement) ;
   - ses tirages viennent d'un flux NOUVEAU dérivé de la graine et du canton (`K.stream(graine, cx, cy, 'faune-…')`), jamais
     d'un flux existant : les mondes et les campagnes G1–G11 ne changent pas ;
   - l'eau est lue sur les mailles et les rivières du canton (mer, lacs, rivières, ruisseaux ; un pont n'est pas de l'eau).
   La boucle régionale (`src/frontier.js`) anime ces animaux comme ceux de la région finie ; leurs fiches vivantes restent en
   mémoire. Sauvegarde creuse (module d'extension `openlife217`) : seuls les animaux abattus, rangés par canton, avec la pose
   de leur dépouille. Les épaves (véhicules garés des lieux) se fouillent déjà par le registre régional ; leur démontage
   (`src/exploration-pack131.js`) s'ouvre aux campagnes de ce module. Une campagne sans l'option ne lit rien de ce module
   (forme inactive seule) ; une ancienne campagne sans bord (sans clé) reste sans faune. */
(function(root){'use strict';
 const node=typeof require==='function';
 const need=(name,file)=>root[name]||(node?require(file):null);
 const C=need('DeadwallCore','./core.js');
 const R=C.OpenLife217Rules;
 const K=()=>need('DeadwallWorldCantons217','./world-cantons217.js');
 const Gen=()=>need('DeadwallWorldCantonGen217','./world-canton-gen217.js');
 const Wild=()=>need('DeadwallWildlife189','./wildlife189.js');
 const O=()=>need('DeadwallOpenWorld217','./openworld217.js');
 const P=()=>C.Landscape189Rules.population,B=()=>C.BiomePopulation165Rules;
 const INT='(0|-?[1-9]\\d{0,6})',ID=new RegExp('^K'+INT+'_'+INT+':'+R.kind+':(0|[1-9]\\d{0,4})$');
 const owns=id=>typeof id==='string'&&ID.test(id);
 const slots=()=>P().groups*P().members,per=()=>K().SIZE/B().chunk,perCanton=()=>per()*per()*slots();
 const finite=(...v)=>v.every(Number.isFinite);
 const far=(dx,dy)=>Math.sqrt(dx*dx+dy*dy);
 function pointSegment(px,py,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;let t=l?((px-a.x)*dx+(py-a.y)*dy)/l:0;t=t<0?0:t>1?1:t;return far(px-a.x-dx*t,py-a.y-dy*t);}

 // --- Eau : échantillon de la forme de `hydrology.sample` de la région finie -------------------------
 const rivers=new WeakMap();
 function riverSegments(c){let s=rivers.get(c);if(s)return s;s=[];for(const r of c.rivers||[]){const p=r.points||[];for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],pad=r.width/2;s.push({a,b,width:r.width,kind:r.kind,l:Math.min(a.x,b.x)-pad,r:Math.max(a.x,b.x)+pad,t:Math.min(a.y,b.y)-pad,b2:Math.max(a.y,b.y)+pad});}}rivers.set(c,s);return s;}
 function cellWater(w,gx,gy){const CELL=Gen().CELL,N=Gen().CELLS,x=(gx+.5)*CELL,y=(gy+.5)*CELL;if(!w.contains(x,y))return Gen().WATER.sea;const c=w.cantonAt(x,y),i=(gy-Math.round(c.bounds.y/CELL))*N+(gx-Math.round(c.bounds.x/CELL));return c.water[i];}
 const still=v=>v===Gen().WATER.sea||v===Gen().WATER.lake;
 // Distance à l'eau la plus proche (mer et lacs par mailles, rivières et ruisseaux par leur tracé), jusqu'à `waterSearch` m.
 // `local` : seulement l'eau sous le point (espèces terrestres, dont l'habitat ne lit pas la distance aux berges).
 function water(w,x,y,local=false){
  if(!w?.unbounded||!finite(x,y)||!w.contains(x,y))return null;
  const W=Gen().WATER,CELL=Gen().CELL,S=local?0:R.waterSearch;let best=Infinity,kind=null,salt=false,river=null;
  for(let gy=Math.floor((y-S)/CELL);gy<=Math.floor((y+S)/CELL);gy++)for(let gx=Math.floor((x-S)/CELL);gx<=Math.floor((x+S)/CELL);gx++){
   const v=cellWater(w,gx,gy);if(!still(v))continue;const d=far(Math.max(gx*CELL-x,0,x-(gx+1)*CELL),Math.max(gy*CELL-y,0,y-(gy+1)*CELL));
   if(d<best){best=d;kind=v===W.sea?'sea':'lake';salt=v===W.sea;river=null;}
  }
  const k=K(),a=k.at(x-S,y-S),z=k.at(x+S,y+S);
  for(let cy=a.cy;cy<=z.cy;cy++)for(let cx=a.cx;cx<=z.cx;cx++)for(const s of riverSegments(w.canton(cx,cy))){
   if(x<s.l-S||x>s.r+S||y<s.t-S||y>s.b2+S)continue;const centre=pointSegment(x,y,s.a,s.b),d=centre-s.width/2;
   if(d<best){best=d;kind=s.kind;salt=false;river={centre,width:s.width};}
  }
  const inside=best<=0,blocked=inside&&w.waterBlocked(x,y,0),crossing=inside&&!blocked;
  let shore=0;
  if(blocked){
   if(river)shore=river.width/2-river.centre;
   else{shore=2*CELL;const gx0=Math.floor(x/CELL),gy0=Math.floor(y/CELL);for(let gy=gy0-2;gy<=gy0+2;gy++)for(let gx=gx0-2;gx<=gx0+2;gx++){if(still(cellWater(w,gx,gy)))continue;const d=far(Math.max(gx*CELL-x,0,x-(gx+1)*CELL),Math.max(gy*CELL-y,0,y-(gy+1)*CELL));if(d<shore)shore=d;}}
  }
  return Object.freeze({water:blocked,crossing,movementBlocked:blocked,salinity:salt?'salt':0,kind,distanceToWater:Number.isFinite(best)?Math.max(0,best):S+1,distanceToShore:shore});
 }

 // --- Animaux ------------------------------------------------------------------------------------
 const memos=new WeakMap();
 function memo(w,id,build){let m=memos.get(w);if(!m){m=new Map();memos.set(w,m);}if(m.has(id)){const v=m.get(id);m.delete(id);m.set(id,v);return v;}const v=build();m.set(id,v);if(m.size>B().candidateCache)m.delete(m.keys().next().value);return v;}
 function weighted(choices,u){let n=u*choices.reduce((s,r)=>s+r[1],0),out=choices.at(-1)[0];for(const[id,v]of choices){n-=v;if(n<0){out=id;break;}}return out;}
 // Groupe candidat (canton, morceau j, groupe) : un flux propre, toujours le même nombre de tirages (un rejet ne décale rien).
 function draws(seed,kx,ky,j,group){const d=K().stream(seed,kx,ky,R.kind+'-'+j+'-'+group);return Array.from({length:6+2*P().members},()=>d());}
 function anchor(w,x,y,box,u){
  // Second groupe d'un morceau : ancré sur l'eau du morceau quand il y en a (berges, rivières, lacs), comme la région finie.
  const out=[],accept=p=>{if(out.length<P().aquaticAttempts&&p.x>box.x+1&&p.x<box.x+box.w-1&&p.y>box.y+1&&p.y<box.y+box.h-1&&water(w,p.x,p.y)?.water)out.push(p);};
  const k=K(),c=w.canton(Math.floor(box.x/k.SIZE),Math.floor(box.y/k.SIZE));
  for(const s of riverSegments(c)){if(s.r<box.x||s.l>box.x+box.w||s.b2<box.y||s.t>box.y+box.h)continue;const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,l=dx*dx+dy*dy;let t=l?((x-s.a.x)*dx+(y-s.a.y)*dy)/l:0;t=t<0?0:t>1?1:t;accept({x:s.a.x+dx*t,y:s.a.y+dy*t});if(out.length>=P().aquaticAttempts)break;}
  for(const lake of c.lakes||[])if(out.length<P().aquaticAttempts)accept({x:lake.x,y:lake.y});
  return out.length?out[Math.floor(u*out.length)]:null;
 }
 function build(w,kx,ky,index){
  const k=K(),S=slots(),j=Math.floor(index/S),slot=index%S,group=Math.floor(slot/P().members),member=slot%P().members,chunk=B().chunk,n=per();
  const box={x:kx*k.SIZE+(j%n)*chunk,y:ky*k.SIZE+Math.floor(j/n)*chunk,w:chunk,h:chunk},u=draws(w.seed,kx,ky,j,group);
  if(u[0]>=P().chance)return null;
  let x=box.x+(.15+u[1]*.7)*chunk,y=box.y+(.15+u[2]*.7)*chunk;
  if(group===1){const p=anchor(w,x,y,box,u[3]);if(p)({x,y}=p);}
  const here=water(w,x,y),biome=w.biomeAt(x,y);if(!here||!biome)return null;
  const choices=Object.entries(Wild().pool(biome,here));if(!choices.length)return null;
  const d=Wild().species()[weighted(choices,u[4])];if(member>=d.group)return null;
  if(member){const a=u[6+2*member]*Math.PI*2,rr=(.4+.6*u[5])*P().groupSpread*member/P().members;x+=Math.cos(a)*rr;y+=Math.sin(a)*rr;}
  if(far(x-w.home.x,y-w.home.y)<B().homeExclusion||!w.contains(x,y,1)||!Wild().habitat(d,water(w,x,y)))return null;
  const road=w.nearestRoad({x,y});if(road&&road.d<road.road.width/2+B().roadClearance)return null;
  return Object.freeze({id:k.entityId(kx,ky,R.kind,index),x,y,z:0,poi:null,species:d.id,variant:Math.floor(u[7+2*member]*4)%4,radius:d.radius,length:d.length,width:d.width,profile:d,biome:biome.id,group189:k.entityId(kx,ky,R.kind,j*S+group*P().members),canton:k.id(kx,ky),open217:true});
 }
 // Descripteur pur de (graine, canton, rang) ; aucune fiche sauvegardée n'est créée par la lecture.
 function animal(w,kx,ky,index){
  if(!w?.unbounded||!Number.isInteger(kx)||!Number.isInteger(ky)||!Number.isInteger(index)||index<0||index>=perCanton())return null;
  const max=K().RULES.maxCoordinate;if(Math.abs(kx)>max||Math.abs(ky)>max)return null;
  return memo(w,K().entityId(kx,ky,R.kind,index),()=>build(w,kx,ky,index));
 }
 function candidate(w,id){if(!owns(id))return null;const e=K().parseEntity(id);return e&&e.kind===R.kind?animal(w,e.cx,e.cy,e.index):null;}
 // Mêmes vetos que `wildlife189.clear` : habitat, puis obstacles (l'eau naturelle ne bloque que les animaux terrestres).
 function clear(w,q,x=q?.x,y=q?.y){
  if(!w?.unbounded||!q?.profile||!finite(x,y))return false;
  const d=q.profile,r=Math.max(.32,q.radius);if(!w.contains(x,y,r)||!Wild().habitat(d,water(w,x,y,d.water==='land')))return false;
  if(d.mode==='land')return!w.blocked(x,y,q.radius,0,null);
  if(!w.wildlifeWaterClear?.(x,y,q.radius))return false;
  if(d.mode==='swim')for(const[dx,dy]of[[-q.radius,0],[q.radius,0],[0,-q.radius],[0,q.radius]])if(!Wild().habitat(d,water(w,x+dx,y+dy)))return false;
  return true;
 }
 // Ligne libre sans l'eau naturelle (oiseaux, nageurs, amphibies) : habitat et obstacles échantillonnés, milieu compris.
 function waterLine(w,a,b,r,profile=null){
  if(![a?.x,a?.y,b?.x,b?.y,r].every(Number.isFinite)||r<=0)return false;const length=far(b.x-a.x,b.y-a.y);
  if(length>C.Hydrology165Rules.spatial.maxLineLength)return false;
  let count=Math.max(2,Math.ceil(length/Math.min(r,B().maxStep)));if(count%2)count++;
  for(let i=0;i<=count;i++){const x=a.x+(b.x-a.x)*i/count,y=a.y+(b.y-a.y)*i/count;if(profile&&!Wild().habitat(profile,water(w,x,y,profile.water==='land')))return false;if(!w.wildlifeWaterClear?.(x,y,r))return false;}
  return true;
 }
 function line(w,q,a,b){return q.profile.mode==='land'?w.movementLine(a,b,0,null,null,q.radius):waterLine(w,a,b,q.radius,q.profile);}
 function admitted(w,q){if(!q||!clear(w,q))return false;const m=B().parcelClearance;for(const p of w.nearPOI(q.x,q.y,60)){const b=p.reserve;if(b&&q.x>b.l-m&&q.x<b.r+m&&q.y>b.t-m&&q.y<b.b+m)return false;}return true;}
 // Animaux à moins de `range` m, du plus proche au plus lointain ; aucun contact naturel (`contacts` vide) dans cette tranche.
 function around(w,x,y,range=B().streamRange){
  const animals=[],contacts=[];if(!w?.unbounded||!finite(x,y,range))return{animals,contacts};
  const chunk=B().chunk,n=per(),S=slots();
  for(let cy=Math.floor((y-range)/chunk);cy<=Math.floor((y+range)/chunk);cy++)for(let cx=Math.floor((x-range)/chunk);cx<=Math.floor((x+range)/chunk);cx++){
   const kx=Math.floor(cx/n),ky=Math.floor(cy/n),j=(cy-ky*n)*n+(cx-kx*n);
   for(let i=0;i<S;i++){const q=animal(w,kx,ky,j*S+i);if(q&&far(q.x-x,q.y-y)<=range)animals.push(q);}
  }
  animals.sort((a,b)=>far(a.x-x,a.y-y)-far(b.x-x,b.y-y)||(a.id<b.id?-1:a.id>b.id?1:0));return{animals,contacts};
 }

 // --- Module d'extension : prélèvements creux par canton ----------------------------------------------
 const KEYS=Object.freeze(['version','active','revision','kills']);
 const initial=()=>({version:1,active:false,revision:null,kills:{}});
 const fresh=()=>({version:1,active:true,revision:R.version,kills:{}});
 const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const worlds=new Map();
 function worldOf(seed){if(!worlds.has(seed)){worlds.set(seed,O().region(seed));if(worlds.size>2)worlds.delete(worlds.keys().next().value);}return worlds.get(seed);}
 function validate(raw,full){
  const f=full?.frontier;
  if(raw===undefined)return initial();
  const bad=m=>{throw Error(m||'Faune des cantons 217 invalide.');};
  if(!plain(raw)||raw.version!==1||typeof raw.active!=='boolean'||Object.keys(raw).length!==KEYS.length||KEYS.some(k=>!(k in raw))||!plain(raw.kills))bad();
  if(!raw.active){if(raw.revision!==null||Object.keys(raw.kills).length)bad();return initial();}
  if(!Number.isInteger(raw.revision)||raw.revision<1||raw.revision>1e6)bad();
  if(full&&f?.generation!==12)bad('Faune des cantons sur une campagne à région finie.');
  const k=K(),out={version:1,active:true,revision:raw.revision,kills:{}},drift=B().animalDrift+1;let total=0;
  for(const[cid,list]of Object.entries(raw.kills)){
   const c=k.parse(cid);if(!c||k.id(c.cx,c.cy)!==cid||!plain(list)||!Object.keys(list).length)bad();const b=k.bounds(c.cx,c.cy),row={};
   for(const[n,pose]of Object.entries(list)){
    if(!/^(0|[1-9]\d{0,4})$/.test(n)||Number(n)>=perCanton()||!Array.isArray(pose)||pose.length!==3||!finite(...pose))bad();
    const[x,y,a]=pose;if(x<b.x-drift||x>b.x+b.w+drift||y<b.y-drift||y>b.y+b.h+drift||Math.abs(a)>1e5)bad();row[n]=[x,y,a];
    if(++total>R.maxKills)bad('Trop d’animaux abattus.');
   }
   out.kills[cid]=row;
  }
  // Monde de la même révision : les cantons cités les plus proches du commandant sont vérifiés contre la graine.
  const w=f&&raw.revision===R.version&&total?worldOf(full.worldSeed):null;
  if(w&&f.reliefVersion===w.reliefVersion&&f.sitesVersion===w.sitesVersion){
   const here=k.at(f.x,f.y),list=Object.keys(out.kills).map(id=>({id,...k.parse(id)})).sort((p,q)=>Math.max(Math.abs(p.cx-here.cx),Math.abs(p.cy-here.cy))-Math.max(Math.abs(q.cx-here.cx),Math.abs(q.cy-here.cy))||p.cy-q.cy||p.cx-q.cx).slice(0,R.strictCantons);
   for(const c of list)for(const[n,[x,y]]of Object.entries(out.kills[c.id])){const q=animal(w,c.cx,c.cy,Number(n));if(!q||far(x-q.x,y-q.y)>B().animalDrift+1e-6)bad('Animal abattu absent de cette graine.');}
  }
  return out;
 }
 function install(g){
  if(!g||g.openLife217)return g?.openLife217||null;
  if(!g.expansions)return null;
  let state=initial(),pending=false,pruned=-Infinity;const records={};
  const clearRecords=()=>{for(const id of Object.keys(records))delete records[id];};
  const load=kills=>{clearRecords();for(const cid of Object.keys(kills)){const c=K().parse(cid);for(const[n,[x,y,a]]of Object.entries(kills[cid]))records[K().entityId(c.cx,c.cy,R.kind,Number(n))]={x,y,a,hp:0,alarm:0,stride:0};}};
  // Fiches vivantes loin du commandant : élaguées (l'animal reprendra sa place d'origine à son retour, comme après une reprise).
  function prune(){
   const t=Number.isFinite(g.elapsed)?g.elapsed:0;if(t-pruned<R.pruneSeconds&&t>=pruned)return;pruned=t;
   const live=Object.keys(records).filter(id=>records[id].hp>0);if(live.length<=R.maxLive)return;
   const p=g.frontier?.position?.();if(!p)return;const keep=B().streamRange+2*B().animalDrift;
   for(const id of live)if(far(records[id].x-p.x,records[id].y-p.y)>keep)delete records[id];
  }
  const active=()=>state.active;
  function kills(){
   const p=g.frontier?.position?.(),rows=[];
   for(const[id,r]of Object.entries(records))if(r.hp===0){const e=K().parseEntity(id);rows.push({e,pose:[r.x,r.y,r.a],d:p?far(r.x-p.x,r.y-p.y):0});}
   // Plafond : au-delà, les dépouilles les plus lointaines sont oubliées (l'animal revient à sa place d'origine).
   if(rows.length>R.maxKills){rows.sort((a,b)=>a.d-b.d);rows.length=R.maxKills;}
   const by=new Map();for(const r of rows){if(!by.has(r.e.canton))by.set(r.e.canton,{c:r.e,list:[]});by.get(r.e.canton).list.push(r);}
   const out={};for(const{c,list}of[...by.values()].sort((a,b)=>a.c.cy-b.c.cy||a.c.cx-b.c.cx)){const row={};for(const r of list.sort((a,b)=>a.e.index-b.e.index))row[String(r.e.index)]=r.pose;out[c.canton]=row;}
   return out;
  }
  const snapshot=()=>state.active?{version:1,active:true,revision:state.revision,kills:kills()}:initial();
  function overview(){
   if(!state.active)return{summary:'Faune des cantons : campagne sans faune de canton (région finie, ou campagne sans bord créée avant cette tranche).',rows:[{label:'Faune',value:'Sans objet.'}]};
   const k=snapshot().kills,cantons=Object.keys(k).length,n=Object.values(k).reduce((s,r)=>s+Object.keys(r).length,0),wrecks=g.travel131?.snapshot?.()?.wrecks?.filter(r=>/^K/.test(r.id)).length??0;
   return{summary:'Monde sans bord : la faune et les épaves des cantons suivent les règles de la région finie. Seuls les animaux abattus et les épaves fouillées ou démontées sont gardés.',rows:[
    {label:'Animaux abattus',value:n+' dans '+cantons+' canton'+(cantons>1?'s':'')},
    {label:'Épaves démontées',value:String(wrecks)},
    {label:'Faune',value:'Mêmes espèces, densités et guildes par milieu que la région finie ; l’eau douce ou salée la plus proche décide des espèces des berges.'}]};
  }
  const api=Object.freeze({active,records:()=>{prune();return records;},snapshot,overview,kills:()=>kills()});
  g.openLife217=api;
  g.expansions.register({id:'openlife217',title:'Faune des cantons',overview,actions:()=>[],validate,snapshot,available:()=>state.active,
   restore:raw=>{state=raw&&raw.active?{version:1,active:true,revision:raw.revision,kills:{}}:initial();load(raw&&raw.active?raw.kills:{});pruned=-Infinity;},
   reset:()=>{state=pending?fresh():initial();clearRecords();pruned=-Infinity;}});
  // Même option de menu que `openworld217` (septième argument de startNew) ; elle ne vaut que pour ce départ.
  const start=g.startNew.bind(g);
  g.startNew=(...a)=>{const before=pending;pending=a[6]===true||a[5]?.generation===12;try{return start(...a);}finally{pending=before;}};
  return api;
 }

 const api=Object.freeze({RULES:R,owns,water,animal,candidate,clear,line,waterLine,admitted,around,speed:(...a)=>Wild().speed(...a),awake:(...a)=>Wild().awake(...a),
  initial,fresh,validate,install,cacheSize:w=>memos.get(w)?.size||0});
 root.DeadwallOpenLife217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
