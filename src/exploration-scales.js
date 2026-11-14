// Exploration en trois échelles (docs/GAME_BIBLE.md §7.9) : besoins de la cité et rangement des sorties.
// Présentation seulement : ce module lit l'état de la cité et renvoie vers des contrôles existants.
// Il ne modifie aucun stock, aucune règle, aucun tirage et aucune sauvegarde ; il n'ouvre rien lui-même.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallExplorationScales=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{if(root.DEADWALL)api.install(root.DEADWALL,root.document);},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const VEIL='data-age-veiled',REFRESH_SECONDS=.5,RESOURCE_NEEDS=3;
 const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
 // Table de présentation : chaque entrée désigne un contrôle déjà présent, que ce module ne fait qu'actionner.
 // `fieldView` : onglet de dossier · `control` : bouton existant par identifiant · `pack` : fiche du registre des opérations.
 const SCALES=freeze([
  {id:'abords',order:1,name:'Les abords',text:'À pied depuis la porte, retour avant la nuit.',entries:[
   {kind:'fieldView',id:'operations',label:'Sorties'},
   {kind:'fieldView',id:'sectors',label:'Vestiges des six secteurs'},
   {kind:'fieldView',id:'world125',label:'Plan de D-17 et de ses environs'},
   {kind:'pack',id:'forage193',label:'Cueillette et ramassage'},
   {kind:'pack',id:'wildlife190',label:'Chasse et pêche'},
   {kind:'pack',id:'exploration',label:'Trajets et récupération'}]},
  {id:'secteurs',order:2,name:'Les secteurs',text:'Postes tenus et lignes de fourgons.',entries:[
   {kind:'fieldView',id:'territories',label:'Quartiers tenus et fourgons'},
   {kind:'control',id:'expOpen',label:'Expéditions et voiture'}]},
  {id:'region',order:3,name:'La région',text:'Carte lointaine, voyages longs.',entries:[
   {kind:'fieldView',id:'recon',label:'Carte et exploration'},
   {kind:'pack',id:'exploration131',label:'Voyages lointains'},
   {kind:'pack',id:'world131',label:'Monde et relais'},
   {kind:'pack',id:'campaign',label:'Opérations de campagne'}]}
 ]);
 const SCALE_BY_ID=freeze(Object.fromEntries(SCALES.map(s=>[s.id,s])));
 // Où chercher chaque ressource : les abords donnent les ressources de tous les jours (§7.9) ;
 // carburant, munitions et médicaments viennent des secteurs tenus et des haltes d'expédition.
 const RESOURCE_SCALE=freeze({wood:'abords',scrap:'abords',stone:'abords',food:'abords',fuel:'secteurs',ammo:'secteurs',medicine:'secteurs'});
 const core=()=>root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 const whole=value=>Math.max(0,Math.floor(Number(value)||0));
 const plural=(n,one,many)=>n+' '+(n>1?many:one);
 const name=(C,key)=>{const label=C.RESOURCE_META?.[key]?.label||key;return label.charAt(0)+label.slice(1).toLowerCase();};
 const alive=e=>Boolean(e&&!e.dead&&!(e.health<=0));
 function buildings(g){const list=g.world?.buildings;return list?[...(typeof list.values==='function'?list.values():list)]:[];}
 // Coût d'une salve de toutes les défenses en service et de tous les fusiliers : le coût par tir que lit déjà le bilan de départ.
 function volley(g,list){
  let cost=0;
  for(const b of list)if(alive(b)&&b.completed&&b.def?.range)cost+=b.def.ammoPerShot||1;
  for(const u of g.units||[])if(u.kind==='soldier'&&alive(u))cost+=1;
  return cost;
 }
 // Besoins réels de la cité, du plus pressant au moins pressant. Fonction pure : elle ne fait que lire `g`.
 function cityNeeds(g){
  const C=core(),needs=[];if(!g||!C)return freeze(needs);
  const list=buildings(g),stock=g.resources||{},cap=Number(g.storage)||0;
  // 1. Eau de cité : seulement si la campagne la suit et que les citernes ne servent plus (stades du module propriétaire).
  const water=g.cityWater215;
  if(water&&typeof water.stage==='function'&&water.needed?.()){
   const stage=water.stage(),reserve=water.reserve?.()||{water:0,capacity:0};
   if(stage>0)needs.push({id:'water',kind:'water',label:stage>=2?'Pénurie d’eau':'Citernes vides',detail:whole(reserve.water)+' / '+whole(reserve.capacity)+' dans les citernes'+(stage>=2?' ; le moral baisse.':' ; la population se rationne.'),scale:'abords'});
  }
  // 2. Réserves : munitions sous une salve d'abord, puis taux de remplissage ; aucun seuil propre à ce module.
  // Le bilan logistique existant précise l'autonomie d'une réserve que la cité consomme plus vite qu'elle ne la produit.
  const logistics=C.FieldOperations?.logistics,rows=new Map();
  if(typeof logistics==='function'&&cap>0){
   const report=logistics({resources:stock,storage:cap,population:g.population,buildings:list,hasResearch:id=>Boolean(g.hasResearch?.(id)),inputReserve:id=>g.fortificationPack?.inputReserve?.(id)||0,activeCrisis:g.activeCrisis,siegeFuelUse:g.siege?.pumpFuelPerMinute?.()||0});
   for(const row of report.rows)rows.set(row.key,row);
  }
  const salvo=volley(g,list),ranked=[];
  (C.RESOURCE_KEYS||[]).forEach((key,index)=>{
   const have=Math.max(0,Number(stock[key])||0),ratio=cap>0?have/cap:1,row=rows.get(key);
   const minutes=row&&row.net<0?have/-row.net:Infinity,short=key==='ammo'&&salvo>0&&have<salvo;
   if(ratio>=1&&!short)return;
   ranked.push({key,index,have,ratio,minutes,short});
  });
  ranked.sort((a,b)=>Number(b.short)-Number(a.short)||a.ratio-b.ratio||a.index-b.index);
  const reserves=ranked.slice(0,RESOURCE_NEEDS).map(r=>{
   let detail=whole(r.have)+' / '+whole(cap)+' en réserve';
   if(r.key==='ammo'&&salvo>0)detail+=' ; une salve de toutes les défenses en coûte '+salvo;
   if(r.minutes<Infinity)detail+=' ; consommation supérieure à la production, '+(r.minutes<1?'moins d’une minute':'environ '+plural(Math.floor(r.minutes),'minute','minutes'))+' d’autonomie';
   return{id:'stock-'+r.key,kind:r.short?'volley':'reserve',label:name(C,r.key)+(r.short?' sous une salve':' au plus bas'),detail:detail+'.',scale:RESOURCE_SCALE[r.key]||'abords',resource:r.key,urgent:r.short};
  });
  needs.push(...reserves.filter(n=>n.urgent));
  // 3. Chantiers financés qui attendent des bras : le coût est payé à la pose, il reste le travail.
  const sites=list.filter(b=>alive(b)&&!b.completed);
  if(sites.length){
   const counts=new Map();for(const b of sites){const label=b.def?.name||b.type||'Chantier';counts.set(label,(counts.get(label)||0)+1);}
   const names=[...counts].slice(0,3).map(([label,n])=>n>1?label+' ×'+n:label),more=counts.size-names.length;
   needs.push({id:'sites',kind:'sites',label:plural(sites.length,'chantier en attente','chantiers en attente'),detail:'Financé'+(sites.length>1?'s':'')+', à bâtir sur place : '+names.join(', ')+(more>0?' et '+plural(more,'autre type','autres types'):'')+'.',scale:null});
  }
  // 4. Logements pleins : la règle de recrutement existante refuse toute recrue à ce point.
  const population=whole(g.population),housing=whole(g.housing);
  if(housing>0&&population>=housing)needs.push({id:'housing',kind:'housing',label:'Logements pleins',detail:population+' / '+housing+' places ; aucune recrue ne peut être accueillie.',scale:null});
  needs.push(...reserves.filter(n=>!n.urgent));
  return freeze(needs.map(({urgent,...need})=>need));
 }
 // Phrase courte pour le bilan de départ.
 function needsSentence(needs){return needs?.length?'Besoins de la cité : '+needs.map(n=>n.label.toLowerCase()).join(', ')+'.':'';}
 function install(g,doc){
  if(!g||!doc?.body||g.explorationScales)return false;
  const field=doc.getElementById('commandPanel-field'),nav=field?.querySelector?.('.field-nav');if(!field||!nav)return false;
  const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;};
  const write=(node,text)=>{const value=String(text);if(node.textContent!==value)node.textContent=value;};
  // Un `aside`, pas une `section` : les dossiers masquent toutes les sections sœurs à chaque changement d'onglet.
  const box=el('aside',undefined,'exploration-scales');box.id='explorationScales';box.setAttribute('aria-label','Besoins de la cité et échelles d’exploration');
  const needsCard=el('div',undefined,'exploration-scales-needs'),needsList=el('ul');needsList.id='explorationScalesNeeds';
  needsCard.append(el('small','BESOINS DE LA CITÉ'),needsList);
  const whereCard=el('div',undefined,'exploration-scales-where'),whereList=el('div',undefined,'exploration-scales-list');whereList.id='explorationScalesWhere';
  whereCard.append(el('small','OÙ ALLER'),whereList);
  box.append(needsCard,whereCard);
  const tab=view=>[...(nav.children||[])].find(node=>node.dataset?.fieldView===view)||null;
  // Le contrôle existant qui porte l'entrée ; `null` si le système n'est pas monté dans cette partie.
  function target(entry){
   if(entry.kind==='fieldView')return tab(entry.id);
   if(entry.kind==='control')return doc.getElementById(entry.id);
   if(entry.kind==='pack')return g.expansionUI&&[...(g.expansions?.entries?.()||[])].some(d=>d?.id===entry.id)?tab('expansions'):null;
   return null;
  }
  const veiled=node=>node?.getAttribute?.(VEIL)==='true';
  const offered=entry=>{const node=target(entry);return Boolean(node)&&!veiled(node);};
  // L'ouverture reste celle du contrôle d'origine : clic sur l'onglet, ou sélection de la fiche par le registre.
  function go(entry){
   if(!offered(entry))return false;
   if(entry.kind==='pack')return g.expansionUI.open(entry.id)!==false;
   target(entry).click();return true;
  }
  const scaleNodes=new Map();
  for(const scale of SCALES){
   const card=el('article',undefined,'exploration-scale');card.dataset.scale=scale.id;
   const links=el('div',undefined,'exploration-scale-links'),empty=el('p','Rien d’ouvert à cette échelle pour l’instant.','exploration-scale-empty');
   const buttons=scale.entries.map(entry=>{const b=el('button',entry.label);b.type='button';b.id='explorationScale-'+entry.kind+'-'+entry.id;b.dataset.entry=entry.id;b.addEventListener('click',()=>{if(!b.disabled&&!b.hidden){go(entry);render();}});links.appendChild(b);return[entry,b];});
   card.append(el('h3',scale.order+'. '+scale.name),el('p',scale.text),links,empty);whereList.appendChild(card);scaleNodes.set(scale.id,{card,buttons,empty});
  }
  // Certains environnements minimaux n'offrent ni `after` ni `insertBefore` : la section se place alors en fin de panneau.
  if(typeof nav.after==='function')nav.after(box);else if(typeof field.insertBefore==='function')field.insertBefore(box,nav.nextSibling||null);else field.appendChild(box);
  const offers=()=>SCALES.map(scale=>({id:scale.id,name:scale.name,entries:scale.entries.filter(offered)}));
  let clock=-Infinity,needsKey='';
  // Visible en partie, dans le classement « Sur le terrain » du carnet (toujours dans l'atelier auteur, qui n'a pas de classement).
  function visible(){const view=g.playerMenus194?.view?.();return g.state==='playing'&&!g.gameOver&&(!view||view.domain==='terrain'&&!view.maintenance);}
  function render(){
   const shown=visible();box.hidden=!shown;if(!shown)return false;
   const open=offers();
   for(const scale of open){
    const nodes=scaleNodes.get(scale.id);
    for(const [entry,b]of nodes.buttons){const on=scale.entries.includes(entry);if(b.hidden!==!on)b.hidden=!on;}
    nodes.empty.hidden=scale.entries.length>0;
   }
   const needs=cityNeeds(g).map(need=>({need,where:need.scale?SCALE_BY_ID[need.scale].name+(open.find(o=>o.id===need.scale)?.entries.length?'':' · pas encore ouverts dans votre carnet'):'Dans l’enceinte'}));
   // Deuxième tranche : les lieux connus qui répondent à chaque besoin, lus par le module voisin s'il est chargé.
   const isOpen=entry=>open.some(scale=>scale.entries.some(e=>e.kind===entry.kind&&e.id===entry.id));
   const places=root.DeadwallExplorationNeeds217?.proposals(g,needs.map(n=>n.need),{offered:isOpen})||[];
   const key=JSON.stringify([needs.map(n=>[n.need.id,n.need.label,n.need.detail,n.where]),places.map(p=>[p.places.map(x=>[x.id,x.name,x.text]),p.none,p.hint])]);
   if(key!==needsKey){
    needsKey=key;needsList.replaceChildren();
    if(!needs.length)needsList.appendChild(el('li','Aucun besoin pressant : réserves pleines, chantiers achevés.','exploration-need-none'));
    needs.forEach(({need,where},index)=>{
     const item=el('li');item.dataset.need=need.id;
     item.append(el('strong',need.label),el('span',need.detail),el('em','→ '+where));
     const found=places[index];
     if(found&&(found.places.length||found.none||found.hint)){
      const rows=el('div',undefined,'exploration-need-places');
      for(const place of found.places){
       const row=el('p');row.dataset.place=place.id;
       const b=el('button',place.button);b.type='button';b.setAttribute('aria-label','Ouvrir : '+place.name);b.addEventListener('click',()=>{go(place.entry);render();});
       row.append(el('b',place.name),el('i',place.text),b);rows.appendChild(row);
      }
      if(found.none)rows.appendChild(el('p',found.none,'exploration-need-nowhere'));
      if(found.hint)rows.appendChild(el('p',found.hint,'exploration-need-hint'));
      item.appendChild(rows);
     }
     needsList.appendChild(item);
    });
   }
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=REFRESH_SECONDS||visible()===box.hidden){clock=now;render();}return result;};
  for(const method of ['showCommand','startNew','restoreSave']){const old=g[method];if(typeof old!=='function')continue;g[method]=function(...args){const result=old.apply(this,args);needsKey='';clock=Number(g.elapsed)||0;render();return result;};}
  // Un changement d'onglet ou de classement doit rafraîchir la visibilité sans attendre l'horloge.
  field.addEventListener?.('click',()=>render());
  g.explorationScales=Object.freeze({render,needs:()=>cityNeeds(g),offers,go});
  render();return true;
 }
 return Object.freeze({install,cityNeeds,needsSentence,SCALES,RESOURCE_SCALE});
});
