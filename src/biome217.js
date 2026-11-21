/* Milieu de la cité 217 (docs/GAME_BIBLE.md §7.13, « des graines qui comptent ») : NOUVELLES campagnes seulement.
   Le milieu dominant autour de D-17 est relevé une fois, par une fonction pure du monde déjà généré (aucun tirage,
   aucune retouche de la génération ni du placement des ressources), puis figé dans la sauvegarde : il ne dérive pas
   si le relevé change un jour. Chaque famille de milieux donne un avantage et une contrainte, facteurs modestes
   appliqués à des calculs existants (src/game.js, src/core.js) :
   - wood / stone / scrap : cadence de récolte des gisements de D-17, à la main et par les ouvriers ;
   - farm : nourriture produite par les fermes protégées ;
   - rain : pluie recueillie par les citernes.
   Une campagne commencée avant cette règle garde tous ses facteurs à 1, sans activation possible. Ce module ne crée
   aucun stock, ne touche ni points de vie ni dégâts et ne tire aucun hasard. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Biome217Rules,F=R.families,IDS=Object.keys(F);
 const KEYS=['version','active','family','announced'],NEUTRAL='neutral';
 const LABELS=Object.freeze({wood:'récolte du bois',stone:'récolte de la pierre',scrap:'récolte de la ferraille',farm:'nourriture des fermes protégées',rain:'pluie recueillie par les citernes'});
 function initial(){return{version:1,active:false,family:null,announced:false};}
 function fresh(){return{version:1,active:true,family:null,announced:false};}
 function validate(raw){
  if(raw===undefined)return initial();
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||typeof raw.announced!=='boolean'
   ||Object.keys(raw).length!==KEYS.length||Object.keys(raw).some(k=>!KEYS.includes(k))
   ||raw.family!==null&&raw.family!==NEUTRAL&&!(typeof raw.family==='string'&&Object.hasOwn(F,raw.family))
   ||!raw.active&&(raw.family!==null||raw.announced)||raw.announced&&raw.family===null)throw Error('Milieu de cité 217 invalide.');
  return{version:1,active:raw.active,family:raw.family,announced:raw.announced};
 }
 // Famille d'un milieu ; nulle pour un milieu inconnu.
 function familyOf(biomeId){return IDS.find(id=>F[id].biomes.includes(biomeId))||null;}
 // Relevé pur : nombre de points de grille par famille autour de D-17. Nul si le monde n'a pas de milieux.
 function survey(world){
  const h=world?.home;if(!h||typeof world.biomeAt!=='function'||!Number.isFinite(h.x)||!Number.isFinite(h.y))return null;
  const counts=Object.fromEntries(IDS.map(id=>[id,0]));let total=0;
  for(let dy=-R.radius;dy<=R.radius;dy+=R.step)for(let dx=-R.radius;dx<=R.radius;dx+=R.step){
   const family=familyOf(world.biomeAt(h.x+dx,h.y+dy)?.id);if(family){counts[family]++;total++;}
  }
  return total?{counts,total}:null;
 }
 // Famille dominante ; à égalité, la première de la table l'emporte. Nulle sans milieux.
 function dominant(world){
  const s=survey(world);if(!s)return null;
  let best=IDS[0];for(const id of IDS)if(s.counts[id]>s.counts[best])best=id;
  return best;
 }
 const percent=factor=>(factor>=1?'+':'−')+Math.round(Math.abs(factor-1)*100)+' %';
 function effect(e){return Object.freeze({key:e.key,factor:e.factor,label:LABELS[e.key],text:LABELS[e.key]+' '+percent(e.factor)});}
 // Profil lisible d'une famille : `{family,name,bonus,malus}` ; sans famille, tout est neutre.
 function describe(family){
  const d=Object.hasOwn(F,family)?F[family]:null;
  return d?Object.freeze({family,name:d.name,bonus:effect(d.bonus),malus:effect(d.malus)}):Object.freeze({family:null,name:'Sans effet',bonus:null,malus:null});
 }
 // Profil qu'aurait une campagne neuve sur ce monde (fiche de graine) : pur, sans campagne en cours.
 function profileFor(world){return describe(dominant(world));}
 function factorOf(family,key){
  const d=Object.hasOwn(F,family)?F[family]:null;
  return !d?1:d.bonus.key===key?d.bonus.factor:d.malus.key===key?d.malus.factor:1;
 }
 const capital=s=>s.charAt(0).toUpperCase()+s.slice(1);
 function install(g){
  if(g.biome217)return g.biome217;if(!g.expansions)throw Error('Installer les opérations avant le milieu de la cité.');
  let state=initial();
  const active=()=>state.active;
  // Le relevé a lieu une seule fois, sur la région de la campagne en cours ; il n'est jamais refait ensuite.
  // Une région sans milieux (ou illisible) donne un profil neutre plutôt qu'une famille inventée.
  function resolve(){
   if(!state.active||state.family!==null||g.state!=='playing'||typeof g.frontier?.world!=='function')return;
   let family=null;try{family=dominant(g.frontier.world());}catch{family=null;}
   state.family=family||NEUTRAL;
  }
  const family=()=>{resolve();return Object.hasOwn(F,state.family)?state.family:null;};
  const factor=key=>state.active?factorOf(family(),key):1;
  // Seule la ferme protégée est une « ferme » : serres, halles et usines gardent leur débit.
  const yieldFactor=(b,key)=>key==='food'&&b?.type==='farm'?factor('farm'):1;
  // Lecture seule pour l'affichage (fiche, fiche de graine) : ne fige rien dans la sauvegarde. Si la région existe déjà,
  // le relevé est calculé sans être enregistré ; la simulation l'enregistrera au premier usage d'un facteur.
  let peeked=null;
  function peek(){
   if(!state.active)return null;
   if(state.family!==null)return Object.hasOwn(F,state.family)?state.family:null;
   if(g.state!=='playing'||!g.frontier?.worldReady?.())return null;
   if(peeked===null){try{peeked=dominant(g.frontier.world())||NEUTRAL;}catch{peeked=NEUTRAL;}}
   return Object.hasOwn(F,peeked)?peeked:null;
  }
  const profile=()=>describe(peek());
  function tick(){
   if(!state.active||state.announced||g.state!=='playing'||g.gameOver)return;
   // La région est construite dès le premier affichage du sol ; sans affichage, le premier usage d'un facteur la relève.
   if(state.family===null&&g.frontier?.worldReady?.())resolve();
   if(state.family===null)return;
   state.announced=true;const p=describe(family());
   if(p.family)g.notify?.('Milieu de la cité : '+p.name+'. Avantage : '+p.bonus.text+'. Contrainte : '+p.malus.text+'.');
  }
  function overview(){
   if(!state.active)return{summary:'Cette campagne a commencé avant cette règle : le milieu de D-17 reste un décor, tous ses rendements sont inchangés. Elle ne s’active pas en cours de campagne.',
    rows:[{label:'Milieu',value:'Sans effet'},{label:'Avantage',value:'Aucun'},{label:'Contrainte',value:'Aucune'}]};
   const p=profile();
   if(!p.family)return{summary:state.family===null?'Le milieu de la cité sera relevé à la première sortie de la région.':'Cette région n’a pas de milieu marqué autour de D-17 : aucun rendement n’est modifié.',
    rows:[{label:'Milieu',value:state.family===null?'Relevé en attente':'Sans effet'},{label:'Avantage',value:'Aucun'},{label:'Contrainte',value:'Aucune'}]};
   return{summary:'D-17 est bâtie en '+p.name.toLowerCase()+'. Le milieu a été relevé à la fondation, autour de la cité ; il vaut pour toute la campagne.',
    rows:[
     {label:'Milieu',value:p.name},
     {label:'Avantage',value:capital(p.bonus.text)+' (×'+String(p.bonus.factor).replace('.',',')+')'},
     {label:'Contrainte',value:capital(p.malus.text)+' (×'+String(p.malus.factor).replace('.',',')+')'},
     {label:'Portée',value:'Récolte : cadence à la main et par les ouvriers sur les gisements de D-17. Fermes : fermes protégées seulement. Pluie : citernes de la cité. Les quantités des gisements ne changent pas.'},
     {label:'Autres milieux',value:IDS.filter(id=>id!==p.family).map(id=>{const o=describe(id);return o.name+' : '+o.bonus.text+', '+o.malus.text;}).join(' · ')}
    ]};
  }
  const update=g.update;
  g.update=function(dt,...rest){const result=update.call(this,dt,...rest);tick();return result;};
  const api=Object.freeze({active,family,factor,yieldFactor,profile,tick,overview,actions:()=>[],snapshot:()=>validate(state)});g.biome217=api;
  g.expansions.register({id:'biome217',title:'Milieu de la cité',overview,actions:api.actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);peeked=null;},reset:()=>{state=fresh();peeked=null;}});
  return api;
 }
 const api=Object.freeze({initial,fresh,validate,familyOf,survey,dominant,describe,profileFor,factorOf,install});root.DeadwallBiome217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
