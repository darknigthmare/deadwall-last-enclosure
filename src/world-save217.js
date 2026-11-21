// Sauvegarde creuse d'une campagne de la génération 12, sans bord (docs/GAME_BIBLE.md §7.13,
// specs/monde-sans-bord/ouverture.md, tranche O3). Le registre régional G12 a la forme du
// registre des générations 1 à 11 (version 2 de `frontier-state`) et ne garde que les écarts
// au monde généré : prélèvements, lieux repérés et annotés, occupants blessés ou tués,
// poursuites, plus le registre `cantons` des cantons vus. Un canton traversé sans y toucher ne
// pèse que son identifiant dans `cantons`.
// La validation ne régénère jamais le monde entier : elle ne charge que les cantons cités par
// les identifiants (lieux, contenants, arbres et rochers, occupants), au plus `maxCantons`, les
// plus proches du joueur d'abord ; au-delà, contrôle de forme seul (décision D4). Les
// identifiants G12 (`K…`) et ceux des générations 1 à 11 (`P…`, `T…`, `R…`, `N165…`) ne se
// mélangent jamais.
// Hors jeu : non chargé par index.html ; `frontier-state` ne prend ce chemin que si le module
// est présent et que `WorldSave217Rules.open` est vrai, ce qui n'arrive pas avant O9.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallWorldSave217=api;
})(globalThis,function(root){
 'use strict';
 const node=typeof require==='function';
 const C=root.DeadwallCore||(node?require('./core.js'):null);
 const K=root.DeadwallWorldCantons217||(node?require('./world-cantons217.js'):null);
 const O=root.DeadwallWorldOpen217||(node?require('./world-open217.js'):null);
 const S=root.DeadwallWorldSites217||(node?require('./world-sites217.js'):null);
 const F=root.DeadwallFrontierGeometry||(node?require('./frontier-geometry.js'):null);
 const R=C.WorldSave217Rules,L=O.LIMITS,SITES=S.RULES,PER=K.SIZE/SITES.chunk;
 const CELLS=K.SIZE/C.FieldAtlas.RULES.cell;
 const INT='(?:0|-?[1-9]\\d{0,6})',SITE='K'+INT+'_'+INT+':site:(?:0|[1-9]\\d{0,4})';
 const SITE_ID=new RegExp('^'+SITE+'$'),TAKEN_SITE=new RegExp('^('+SITE+'):(-?[0-9]|car|out):(0|[1-9]\\d{0,5})$'),ENEMY=new RegExp('^('+SITE+'):e(0|[1-9]\\d{0,2})$');
 const SCENERY=Object.freeze({arbre:SITES.trees,roche:SITES.rocks});
 const KEYS=Object.freeze(['version','generation','reliefVersion','sitesVersion','detailVersion','ecologyVersion','hydrologyVersion','quiet','tracks','notes','pin','active','x','y','z','inside','a','anchor','car','seen','taken','enemies','wildlife165','distance','shots','kills','cantons']);
 const NOTES=Object.freeze(['todo','visited','cleared','danger']),MODES=Object.freeze(['idle','investigate','pursuit','search']);
 const bad=message=>{throw Error(message);};
 const num=(v,lo,hi,int=false)=>{if(!Number.isFinite(v)||v<lo||v>hi||int&&!Number.isInteger(v))bad('Valeur régionale invalide.');return v;};
 const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const opened=()=>R.open===true;
 // Lieu G12 valide de forme : identifiant canonique, coordonnées et rang dans les bornes de l'adressage.
 const siteOK=id=>typeof id==='string'&&SITE_ID.test(id)&&K.parseEntity(id)?.kind==='site';
 const cantonOf=id=>K.parseEntity(id).canton;
 // Morceau de 256 m d'un arbre ou d'un rocher, retrouvé depuis son rang dans le canton.
 function sceneryOf(id){
  const e=K.parseEntity(id);if(!e||!SCENERY[e.kind])return null;const rule=SCENERY[e.kind],j=Math.floor(e.index/rule.slots),i=e.index%rule.slots;
  if(j>=PER*PER||i>=rule.grid*rule.grid)return null;
  return{...e,chunk:{cx:e.cx*PER+j%PER,cy:e.cy*PER+Math.floor(j/PER)}};
 }
 const versions=()=>({reliefVersion:C.WorldRelief217Rules.version,sitesVersion:SITES.version,detailVersion:SITES.detailVersion});
 // Registre neuf d'une campagne G12 : le joueur est à D-17, au centre du site de fondation.
 function initial(home){
  if(!home||!Number.isFinite(home.x)||!Number.isFinite(home.y)||!L.contains(home.x,home.y))bad('Fondation G12 invalide.');
  const v=versions();
  return{version:2,generation:12,reliefVersion:v.reliefVersion,sitesVersion:v.sitesVersion,detailVersion:v.detailVersion,ecologyVersion:0,hydrologyVersion:0,quiet:false,tracks:{},notes:{},pin:null,active:false,x:home.x,y:home.y,z:0,inside:null,a:0,anchor:null,car:null,seen:[],taken:{},enemies:{},wildlife165:{},distance:0,shots:0,kills:0,cantons:[K.at(home.x,home.y)].map(c=>K.id(c.cx,c.cy))};
 }

 // Contrôle de forme seul, sans charger de canton. Clés exactes, plafonds, identifiants G12.
 function normalize(raw){
  if(!plain(raw)||raw.version!==2||raw.generation!==12)bad('Registre régional G12 invalide.');
  if(Object.keys(raw).some(k=>!KEYS.includes(k))||KEYS.some(k=>!(k in raw)))bad('Registre régional G12 incomplet.');
  const v=versions();if(raw.reliefVersion!==v.reliefVersion||raw.sitesVersion!==v.sitesVersion||raw.detailVersion!==v.detailVersion)bad('Règles de génération G12 différentes.');
  if(raw.ecologyVersion!==0||raw.hydrologyVersion!==0||!plain(raw.wildlife165)||Object.keys(raw.wildlife165).length)bad('Population naturelle incompatible avec la génération 12.');
  if(typeof raw.quiet!=='boolean'||typeof raw.active!=='boolean')bad('État régional invalide.');
  const s={version:2,generation:12,...v,ecologyVersion:0,hydrologyVersion:0,quiet:raw.quiet,tracks:{},notes:{},pin:null,active:raw.active,x:0,y:0,z:0,inside:null,a:0,anchor:null,car:null,seen:[],taken:{},enemies:{},wildlife165:{},distance:0,shots:0,kills:0,cantons:[]};
  s.x=num(raw.x,L.axisMin(.32),L.axisMax(.32));s.y=num(raw.y,L.axisMin(.32),L.axisMax(.32));s.z=num(raw.z,-1,2,true);s.a=num(raw.a,-1e5,1e5);
  if(raw.inside!==null&&!siteOK(raw.inside))bad('Lieu absent.');s.inside=raw.inside;
  if(raw.anchor!==null){if(!plain(raw.anchor)||Object.keys(raw.anchor).length!==2)bad('Ancre absente');s.anchor={x:num(raw.anchor.x,0,4096),y:num(raw.anchor.y,0,4096)};}
  if(s.active&&!s.anchor)bad('Sortie sans point de retour.');if(!s.active&&s.z!==0)bad('Étage hors région.');if(s.z!==0&&s.inside===null)bad('Étage sans lieu.');
  if(raw.car!==null){const c=raw.car;if(!plain(c)||typeof c.driving!=='boolean'||Object.keys(c).length!==5)bad('État de voiture invalide.');s.car={id:num(c.id,1,2147483646,true),x:num(c.x,L.axisMin(3),L.axisMax(3)),y:num(c.y,L.axisMin(3),L.axisMax(3)),a:num(c.a,-1e5,1e5),driving:c.driving};if(c.driving&&(!s.active||s.z!==0||Math.hypot(c.x-s.x,c.y-s.y)>.001))bad('Conducteur et voiture désynchronisés.');}
  // Cantons vus : identifiants canoniques, sans doublon, plafonnés.
  if(!Array.isArray(raw.cantons)||raw.cantons.length>R.maxSeenCantons)bad('Trop de cantons vus.');
  for(const id of raw.cantons)if(typeof id!=='string'||!K.parse(id)||K.id(K.parse(id).cx,K.parse(id).cy)!==id)bad('Canton vu invalide.');
  if(new Set(raw.cantons).size!==raw.cantons.length)bad('Canton vu en double.');s.cantons=[...raw.cantons];
  const known=new Set(s.cantons);
  if(!Array.isArray(raw.seen)||raw.seen.length>R.maxSeen)bad('Trop de découvertes.');
  if(raw.seen.some(id=>!siteOK(id)))bad('Identifiant de découverte invalide.');if(new Set(raw.seen).size!==raw.seen.length)bad('Découverte en double.');s.seen=[...raw.seen];
  if(s.seen.some(id=>!known.has(cantonOf(id))))bad('Lieu repéré dans un canton jamais vu.');
  if(s.active&&!known.has((c=>K.id(c.cx,c.cy))(K.at(s.x,s.y))))bad('Position dans un canton jamais vu.');
  if(!plain(raw.notes)||Object.keys(raw.notes).length>R.maxSeen)bad('Carnet invalide');
  for(const[id,n]of Object.entries(raw.notes)){if(!siteOK(id)||!NOTES.includes(n))bad('Note invalide');s.notes[id]=n;}
  if(raw.pin!==null&&!siteOK(raw.pin))bad('Repère invalide');s.pin=raw.pin;
  const seen=new Set(s.seen);if(Object.keys(s.notes).some(id=>!seen.has(id))||s.pin!==null&&!seen.has(s.pin))bad('Repère sur lieu non découvert');
  if(!plain(raw.taken)||Object.keys(raw.taken).length>R.maxTaken)bad('Registre régional trop grand.');
  for(const[id,v]of Object.entries(raw.taken)){if(!TAKEN_SITE.test(id)&&!sceneryOf(id)||TAKEN_SITE.test(id)&&!siteOK(TAKEN_SITE.exec(id)[1]))bad('Identifiant régional invalide.');s.taken[id]=num(v,0,1000);}
  if(!plain(raw.enemies)||Object.keys(raw.enemies).length>R.maxEnemies)bad('Registre régional trop grand.');
  for(const[id,v]of Object.entries(raw.enemies)){const m=ENEMY.exec(id);if(!m||!siteOK(m[1]))bad('Identifiant régional invalide.');s.enemies[id]=num(v,0,80);}
  if(!plain(raw.tracks)||Object.keys(raw.tracks).length>R.maxEnemies)bad('Suivi régional invalide');
  for(const[id,b]of Object.entries(raw.tracks)){const m=ENEMY.exec(id);if(!m||!siteOK(m[1])||!plain(b)||!MODES.includes(b.mode)||Object.keys(b).length!==9)bad('Poursuite invalide');
   if(s.enemies[id]===0)bad('Poursuite hors niveau');
   s.tracks[id]={x:num(b.x,L.axisMin(.32),L.axisMax(.32)),y:num(b.y,L.axisMin(.32),L.axisMax(.32)),z:num(b.z,-1,2,true),a:num(b.a,-1e5,1e5),mode:b.mode,ttl:num(b.ttl,0,16),gx:num(b.gx,L.axisMin(.32),L.axisMax(.32)),gy:num(b.gy,L.axisMin(.32),L.axisMax(.32)),cool:num(b.cool,0,2)};}
  s.distance=num(raw.distance,0,1e9);s.shots=num(raw.shots,0,1e9,true);s.kills=num(raw.kills,0,1e8,true);
  if(s.kills!==Object.values(s.enemies).filter(h=>h===0).length)bad('Compteur régional contradictoire.');
  return s;
 }

 // Cantons cités par les identifiants du registre, chacun avec ce qu'il porte, dans l'ordre de
 // validation : distance de Tchebychev au canton du joueur, puis ligne, puis colonne.
 function cited(s){
  const map=new Map(),bucket=id=>{let b=map.get(id);if(!b){const p=K.parse(id);b={id,cx:p.cx,cy:p.cy,seen:[],inside:false,taken:[],enemies:new Set()};map.set(id,b);}return b;};
  for(const id of s.seen)bucket(cantonOf(id)).seen.push(id);
  if(s.inside!==null)bucket(cantonOf(s.inside)).inside=true;
  for(const id of Object.keys(s.taken)){const m=TAKEN_SITE.exec(id);bucket(m?cantonOf(m[1]):sceneryOf(id).canton).taken.push(id);}
  for(const id of [...Object.keys(s.enemies),...Object.keys(s.tracks)])bucket(cantonOf(ENEMY.exec(id)[1])).enemies.add(id);
  const c=K.at(s.x,s.y),d=b=>Math.max(Math.abs(b.cx-c.cx),Math.abs(b.cy-c.cy));
  return[...map.values()].sort((a,b)=>d(a)-d(b)||a.cy-b.cy||a.cx-b.cx);
 }

 let last=null;
 // Validation d'un registre G12 contre son monde. Seuls les cantons cités sont chargés, au plus
 // `maxCantons` ; le monde est neuf à chaque validation (seul le canton de fondation, que tout
 // monde G12 charge à sa création, s'y ajoute). `data` porte la graine, la voiture et le joueur.
 function validate(state,data,options={}){
  const s=normalize(state);
  if(s.car&&data?.expeditions?.vehicle?.id!==s.car.id)bad('Voiture étrangère à la campagne.');
  if(s.active&&Math.hypot(data.player.x-s.anchor.x,data.player.y-s.anchor.y)>.01)bad('Position locale modifiée en sortie.');
  const list=cited(s),cap=options.maxCantons??R.maxCantons;
  if(!Number.isInteger(cap)||cap<0||cap>R.maxCantons)bad('Plafond de cantons invalide.');
  const strict=list.slice(0,cap),loose=list.slice(cap);
  // Cache de cantons assez grand pour garder tous les cantons vérifiés : aucun n'est généré deux fois.
  const w=S.create(data.worldSeed,{open:{cache:{capacity:R.maxCantons+25}}}),before=w.streamStats().generated;
  if(w.reliefVersion!==s.reliefVersion||w.sitesVersion!==s.sitesVersion)bad('Règles de génération G12 différentes.');
  for(const b of strict){
   const site=id=>w.site(id);
   for(const id of b.seen)if(!site(id))bad('Lieu absent de cette graine.');
   if(b.inside){const p=site(s.inside);if(!p)bad('Intérieur absent de cette graine.');if(!p.levels.includes(s.z))bad('Étage non construit.');
    if(s.z!==0){const q=F.local(p,s.x,s.y);if(q.x<0||q.y<0||q.x>p.w||q.y>p.h)bad('Position hors étage.');}}
   for(const id of b.taken){let obj;const m=TAKEN_SITE.exec(id);
    if(m){const p=site(m[1]);if(!p)bad('Contenant dans un lieu absent.');const z=m[2];obj=z==='out'?(p.outdoor||[]).find(q=>q.id===id):z==='car'?p.parking.find(q=>q.id===id):p.levels.includes(Number(z))?w.plan(p,Number(z)).objects.find(q=>q.id===id):null;}
    else{const e=sceneryOf(id),c=w.chunk(e.chunk.cx,e.chunk.cy);obj=(e.kind==='arbre'?c.trees:c.rocks).find(q=>q.id===id);}
    if(!obj||s.taken[id]>obj.amount+.000001)bad('Prélèvement supérieur au contenant.');}
   for(const id of b.enemies){const m=ENEMY.exec(id),p=site(m[1]),n=Number(m[2]);if(!p||n>=w.threatCount(p))bad('Menace régionale inexistante.');
    const o=w.occupants(p)[n];if(s.enemies[id]!==undefined&&s.enemies[id]>o.health)bad('Intégrité de contact incompatible avec son profil.');
    const t=s.tracks[id];if(t){if(t.z!==o.z)bad('Poursuite hors niveau');if(t.z!==0){const q=F.local(p,t.x,t.y),g=F.local(p,t.gx,t.gy);if(q.x<.3||q.y<.3||q.x>p.w-.3||q.y>p.h-.3||g.x<.3||g.y<.3||g.x>p.w-.3||g.y>p.h-.3)bad('Poursuite hors bâtiment');}}}
  }
  last=Object.freeze({cited:list.length,strict:Object.freeze(strict.map(b=>b.id)),formOnly:Object.freeze(loose.map(b=>b.id)),generated:w.streamStats().generated-before+1,cantons:Object.freeze(w.streamStats())});
  return s;
 }

 // Cellules de reconnaissance d'une campagne G12 : `K…:cell:n`, n = rang de la maille de
 // `FieldAtlas.RULES.cell` mètres dans son canton (8 × 8 mailles de 128 m). Le carnet dense des
 // générations 1 à 11 (`field-atlas-state`) ne change pas.
 function cell(x,y){if(!Number.isFinite(x)||!Number.isFinite(y)||!L.contains(x,y))return null;const c=K.toLocal(x,y),n=Math.floor(c.y/C.FieldAtlas.RULES.cell)*CELLS+Math.floor(c.x/C.FieldAtlas.RULES.cell);return K.entityId(c.cx,c.cy,'cell',n);}
 // Carnet de reconnaissance G12 : cellules seulement ; archives et tournées ne s'ouvrent pas
 // encore en G12 (registres vides exigés). Chaque cellule appartient à un canton vu.
 function normalizeAtlas(raw,frontier){
  const A=C.FieldAtlas.RULES;
  if(!plain(raw)||raw.version!==1||Object.keys(raw).length!==5)bad('Carnet de reconnaissance invalide.');
  if(!Array.isArray(raw.cells)||raw.cells.length>A.maxCells||new Set(raw.cells).size!==raw.cells.length)bad('Secteurs parcourus invalides.');
  for(const id of raw.cells){const e=K.parseEntity(id);if(!e||e.kind!=='cell'||e.index>=CELLS*CELLS)bad('Secteurs parcourus invalides.');}
  const t=raw.tour;if(!Array.isArray(raw.reports)||raw.reports.length||raw.job!==null||!plain(t)||!Array.isArray(t.stops)||t.stops.length||t.active!==false||t.index!==0||!['east','west','north','south'].includes(t.gate)||!['foot','car'].includes(t.mode))bad('Archives et tournées indisponibles en génération 12.');
  if(frontier){const known=new Set(frontier.cantons);if(raw.cells.some(id=>!known.has(cantonOf(id))))bad('Secteur parcouru dans un canton jamais vu.');}
  return{version:1,cells:[...raw.cells],reports:[],job:null,tour:{stops:[],active:false,index:0,gate:t.gate,mode:t.mode}};
 }

 return Object.freeze({RULES:R,opened,initial,normalize,cited,validate,lastValidation:()=>last,cell,normalizeAtlas,sceneryOf,cantonOf});
});
