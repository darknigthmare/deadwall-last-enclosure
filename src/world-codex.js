(function(root,factory){'use strict';
  const packs=typeof module==='object'&&module.exports?{
    nature:require('./world-codex-nature.js'),habitat:require('./world-codex-habitat.js'),
    activites:require('./world-codex-activites.js'),systemes:require('./world-codex-systemes.js'),equipment134:require('./equipment-codex134.js'),biomes135:require('./biomes-codex135.js'),seed157:require('./world-codex-seed157.js'),programmes:require('./world-codex-3000.js')
  }:root.DeadwallCodexPacks;
  const actions=root.DeadwallCodexActions159||(typeof require==='function'?require('./world-codex-actions159.js'):null);
  const api=factory(packs||{},actions);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.DeadwallWorldCodex=api;if(root.DEADWALL&&root.document)api.install(root.DEADWALL,root.document);}
})(typeof globalThis!=='undefined'?globalThis:this,function(packs,actions159){'use strict';
  const ecology164=globalThis.DeadwallEcologyCodex164||(typeof require==='function'?require('./biomes-codex164.js'):null);
  const hydrology165=globalThis.DeadwallHydrologyCodex165||(typeof require==='function'?require('./hydrology-codex165.js'):null);
  const entries=Object.freeze([...['nature','habitat','activites','systemes','equipment134','biomes135','seed157','programmes'].flatMap(k=>packs[k]||[]),...(ecology164?.entries()||[]),...(hydrology165?.entries()||[]),...((globalThis.DeadwallEcologyCodex189||(typeof require==='function'?require('./ecology-codex189.js'):null))?.entries()||[]),...(actions159?.entries||[])]);
  const families=Object.freeze({nature:'Milieux naturels',habitat:'Villes et quartiers',camps:'Camps et refuges',activites:'Activités et services',systemes:'Survie et cité',programmes:'Codex 4 000'});
  const statuses=Object.freeze({jouable:'Disponible en jeu',pilote:'Présent en partie',plan:'Projet de contenu',programme:'Programme procédural'});
  const fields=Object.freeze({layout:'Organisation du lieu',access:'Accès et déplacement',supplies:'Ressources et usage',risks:'Risques et limites',night:'De nuit',variants:'Variantes',interactions:'Liens avec la survie',qa:'Contrôle de cohérence',source:'Portée et référence'});
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const runtime160=globalThis.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null);
  const index=new Map(entries.map(e=>[e.id,normalize(Object.values(e).join(' '))]));
  function query(filters={},game=null){
    const words=normalize(filters.text).split(' ').filter(Boolean),family=filters.family||'all',status=filters.status||'all';
    const availability=filters.availability||'all',known=availability==='known'?new Set(actions159?.knownProgrammes(game)||[]):null;
    return entries.filter(e=>(family==='all'||e.family===family)&&(status==='all'||status==='terrain'&&['jouable','pilote'].includes(e.status)||e.status===status)&&words.every(word=>index.get(e.id).includes(word)||(e.id.startsWith('programme-DW-')&&runtime160?.searchDocument(e.id.slice(10)).includes(word)))&&
      (availability==='all'||availability==='city'&&!!e.choice159||availability==='known'&&known.has(e.id.replace(/^programme-/,''))||
       availability==='context160'&&e.status==='programme'&&!!actions159?.capability(e.id)?.context160||
       ['supported','unavailable'].includes(availability)&&e.status==='programme'&&actions159?.capability(e.id)?.eligible===(availability==='supported')));
  }
  const sourceNumber161=value=>Number.isFinite(value)?String(value).replace('.',','):'non renseigné';
  function sourceRange161(value){return Array.isArray(value)&&value.length===2&&value.every(Number.isFinite)?(value[0]===value[1]?sourceNumber161(value[0]):value.map(sourceNumber161).join(' à ')):'non renseignée';}
  function sourcePropRows161(prop={}){
    const size=prop.gabarit_m||{},rows=[['Quantité par espace',sourceRange161(prop.quantite_par_espace)],
      ['Gabarit source (L × l × h)',[size.longueur,size.largeur,size.hauteur].map(sourceNumber161).join(' × ')+' m']];
    if(Number.isFinite(prop.degagement_min_m))rows.push(['Dégagement minimum proposé',sourceNumber161(prop.degagement_min_m)+' m']);
    for(const [key,label]of [['ancrage','Ancrage et support'],['rotation','Orientation'],['collider','Collision prescrite']])if(typeof prop[key]==='string'&&prop[key])rows.push([label,prop[key]]);
    if(typeof prop.loot_eligible==='boolean')rows.push(['Butin dans le programme source',prop.loot_eligible?'Éligible au budget fini du lieu, pas un stock supplémentaire':'Non éligible']);
    return rows;
  }
  const MODULE_LABELS161=Object.freeze({flowerbed:'massifs fleuris',planter:'bacs plantés',bench:'bancs',cropbed:'planches potagères',compost:'composteur',waterButt:'récupérateur d’eau',patio:'terrasse',barbecue:'barbecue',playset:'jeux de jardin',toy:'jouets',tree:'arbres',pool:'piscine',greenhouse:'serre',shed:'abri',worktable:'établi',toolbox:'outillage',clothesline:'étendoir',laundryBasket:'panier à linge',hedge:'haie',bikeRack:'range-vélos',canopy:'abri toilé'});
  function accessRows161(recipe={}){
    if(recipe.sourceAccess158){const access=recipe.sourceAccess158,labels={public:'Accès public',service:'Accès de service',return:'Retour'};
      return Object.entries(labels).filter(([key])=>typeof access[key]==='string').map(([key,label])=>[label,access[key]+(Number.isFinite(access.width_m)?' · '+sourceNumber161(access.width_m)+' m de largeur prescrite':'')]);}
    const names=new Map((recipe.rooms||[]).map(room=>[room.id,room.name]));
    const place=id=>names.get(id)||String(id??'accès').replaceAll('_',' ');
    return (recipe.access||[]).map(link=>[place(link.de)+' → '+place(link.vers),
      [Number.isFinite(link.largeur_min_m)?sourceNumber161(link.largeur_min_m)+' m minimum proposé':null,typeof link.contrainte==='string'?link.contrainte:null].filter(Boolean).join(' · ')||'Largeur non renseignée']);
  }

  function install(game,document){
    if(!game||!document||game.worldCodex)return false;
    const panel=document.getElementById('commandPanel-field'),nav=panel?.querySelector('.field-nav');if(!panel||!nav)return false;
    const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.classList.add(...cls.split(' '));return n;};
    const append=(parent,...nodes)=>{for(const n of nodes)parent.appendChild(n);return parent;};
    function specifications161(parent,rows){const list=el('dl',undefined,'codex-specifications161');for(const [label,value]of rows){append(list,el('dt',label),el('dd',value));}parent.appendChild(list);return list;}
    function furniture161(parent,room){for(const prop of room.authoredProps||[]){const box=el('div',undefined,'codex-source-prop161');box.dataset.asset=prop.asset||'';box.appendChild(el('h6',prop.nom||'Mobilier source'));specifications161(box,sourcePropRows161(prop));parent.appendChild(box);}}

    const section=el('section',undefined,'world-codex hidden');section.id='field-world-codex';
    const button=el('button','ATLAS & GUIDE');button.type='button';button.dataset.fieldView='world-codex';button.setAttribute('aria-controls',section.id);button.setAttribute('aria-pressed','false');
    const heading=el('h3','LIEUX, SURVIE ET NUITS'),intro=el('p','Retrouvez les usages des lieux, les ressources à chercher et les précautions à prendre. Les fiches « Projet de contenu » décrivent des extensions possibles. Elles ne signalent pas des lieux déjà présents sur votre carte.','command-note');
    const controls=el('div',undefined,'world-codex-controls');
    const search=el('input');search.type='search';search.id='worldCodexSearch';search.placeholder='Forêt, port, lampe, ressources…';search.maxLength=120;
    const searchLabel=el('label','RECHERCHER');searchLabel.setAttribute('for',search.id);searchLabel.appendChild(search);
    const family=el('select');family.id='worldCodexFamily';const familyLabel=el('label','FAMILLE');familyLabel.setAttribute('for',family.id);familyLabel.appendChild(family);
    const status=el('select');status.id='worldCodexStatus';const statusLabel=el('label','COUVERTURE');statusLabel.setAttribute('for',status.id);statusLabel.appendChild(status);
    const availability=el('select');availability.id='worldCodexAvailability159';const availabilityLabel=el('label','USAGE');availabilityLabel.setAttribute('for',availability.id);availabilityLabel.appendChild(availability);
    function option(select,value,label){const n=el('option',label);n.value=value;select.appendChild(n);}
    option(family,'all','Toutes les familles');for(const[k,v]of Object.entries(families))option(family,k,v);
    option(status,'terrain','Contenu présent');option(status,'all','Présent et projets');option(status,'programme','Les 4 000 programmes');for(const[k,v]of Object.entries(statuses))if(k!=='programme')option(status,k,v);
    option(availability,'all','Tous les usages');option(availability,'known','Lieux de cette fiche déjà repérés');option(availability,'city','Choix réels de D-17');option(availability,'supported','Programmes compatibles');option(availability,'context160','Territoires G10');option(availability,'unavailable','Programmes sans plan');
    family.value='all';status.value='terrain';availability.value='all';append(controls,searchLabel,familyLabel,statusLabel,availabilityLabel);
    const count=el('p','','world-codex-count');count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');
    const list=el('div',undefined,'world-codex-list');list.id='worldCodexResults';
    const coverage=el('p',undefined,'world-codex-boundary');coverage.id='worldCodexCoverage159';const totals=actions159?.availabilitySummary();
    const territorialEntry=entries.find(entry=>entry.status==='programme'&&actions159?.capability(entry.id)?.context160);
    const territories=el('button','VOIR L’ACTIVATION DES TERRITOIRES G10');territories.type='button';territories.id='worldCodexTerritories160';territories.dataset.codexTerritories160=territorialEntry?.id||'';
    territories.hidden=!territorialEntry;territories.addEventListener('click',()=>{if(!territories.disabled&&!territories.closest('[inert]'))actions159.openTerritories160(game,territorialEntry.id);});
    let visible=36,lastLive=-Infinity,lastSignature='',lastWorld=null;const liveNodes=new Map();
    function actionButton(label,entry,fn,place=null){const node=el('button',label);node.type='button';node.dataset.codexAction159=entry.id;if(place)node.dataset.codexPlace159=place.id;node.setAttribute('aria-label',label+' — '+(place?.name||entry.title));node.addEventListener('click',()=>{if(!node.disabled&&!node.closest('[inert]'))fn();});return node;}
    function updateLive(force=false){
      if(!force&&(section.closest('.hidden')||game.activeOverlay!==game.ui.commandModal))return false;
      const now=globalThis.performance?.now?.()??Date.now();if(!force&&now-lastLive<450)return false;lastLive=now;
      const context=actions159?.choiceContext(game),discoveries=game.frontier?.discoveries?.()||[],canNavigate=actions159?.canNavigate(game)||false;
      const generation=game.frontier?.position?.().generation;
      const signature=JSON.stringify([context,discoveries,canNavigate,generation]);if(!force&&lastWorld===game.world&&signature===lastSignature)return true;
      lastWorld=game.world;lastSignature=signature;
      coverage.textContent=totals?totals.choices+' choix de D-17 reliés à leurs catalogues. '+totals.programmes+' programmes, dont '+totals.contextual160+' contrats territoriaux G10. '+
       (generation===10?'G10 est activée dans cette campagne. ':'Leur activation se consulte volontairement au dépôt depuis Monde & relais. ')+
       'La présence de chaque programme dépend de la graine et des accès. Les lieux affichés et les repères proviennent seulement de votre carnet.':'';
      territories.disabled=!territorialEntry||!actions159.canOpenTerritories160(game,territorialEntry.id);
      territories.textContent=generation===10?'TERRITOIRES G10 ACTIVÉS':'VOIR L’ACTIVATION DES TERRITOIRES G10';
      for(const [entry,view]of liveNodes){
        if(entry.choice159){const state=actions159?.choiceStatus(game,entry.choice159,context);view.status.textContent=state?.text||'Catalogue de D-17 indisponible.';view.conditions.textContent=state?.conditions.join(' ')||'';view.button.disabled=!canNavigate||!game.cityCatalogueUI150;continue;}
        const places=actions159?.knownPlaces(game,entry.id)||[];view.status.textContent=actions159?.programmeStatus(game,entry.id)?.text||'';
        if(view.activation)view.activation.disabled=!actions159.canOpenTerritories160(game,entry.id);
        view.known.textContent=places.length?places.length+' lieu(x) de cette fiche déjà repéré(s) dans le carnet.':'Aucun lieu de cette fiche dans votre carnet. La consultation ne révèle pas les lieux inconnus.';
        const placeSignature=JSON.stringify([places,canNavigate,!!game.frontierUI]);if(view.signature===placeSignature)continue;view.signature=placeSignature;view.sites.replaceChildren();
        for(const place of places){const line=el('div',undefined,'world-codex-actions world-codex-site159'),name=el('span',place.name,'world-codex-site-name159'),map=actionButton('VOIR CE LIEU',entry,()=>actions159.placeAction(game,entry.id,place.id,'map'),place),pin=actionButton('CHOISIR COMME REPÈRE',entry,()=>actions159.placeAction(game,entry.id,place.id,'pin'),place);
          map.disabled=pin.disabled=!canNavigate||!game.frontierUI;append(line,name,map,pin);view.sites.appendChild(line);}
      }
      return true;
    }
    function refresh(reset=true){if(reset!==false)visible=36;const found=query({text:search.value,family:family.value,status:status.value,availability:availability.value},game);list.replaceChildren();liveNodes.clear();lastSignature='';count.textContent=found.length+' fiche'+(found.length===1?'':'s')+' trouvée(s) · '+entries.length+' dans le guide';
      if(!found.length){list.appendChild(el('p','Aucune fiche pour ces filtres. Essayez un terme plus court ou « Présent et projets ».','world-codex-empty'));return;}
      for(const entry of found.slice(0,visible)){const card=el('article',undefined,'world-codex-card');card.dataset.codexId=entry.id;
        append(card,el('small',families[entry.family]+' · '+statuses[entry.status],'world-codex-status status-'+entry.status),el('h4',entry.title),el('p',entry.summary));
        if(entry.status==='plan')card.appendChild(el('p','Conception : ce programme n’est pas annoncé comme jouable.','world-codex-boundary'));
        if(entry.status==='pilote')card.appendChild(el('p','Une partie du lieu existe. Les variantes et extensions décrites ne sont pas toutes intégrées.','world-codex-boundary'));
        const details=el('details'),summary=el('summary','Accès, ressources et précautions');details.dataset.codexSource159=entry.id;details.appendChild(summary);
        for(const[key,label]of Object.entries(fields)){if(!entry[key])continue;const p=el('p');append(p,el('strong',label+' — '),el('span',entry[key]));details.appendChild(p);}
        if(entry.status==='programme'&&actions159){const state=el('p',undefined,'world-codex-boundary'),known=el('p'),sites=el('details'),siteHeading=el('summary','Lieux de cette fiche déjà repérés'),siteList=el('div');append(sites,siteHeading,siteList);append(card,state,known,sites);
          let activation=null;if(actions159.capability(entry.id)?.context160){activation=actionButton('VOIR L’ACTIVATION AU DÉPÔT',entry,()=>actions159.openTerritories160(game,entry.id));activation.dataset.codexTerritories160=entry.id;card.appendChild(activation);}
          liveNodes.set(entry,{status:state,known,sites:siteList,activation,signature:''});}
        if(entry.choice159&&actions159){const state=el('p',undefined,'world-codex-boundary'),conditions=el('p'),open=actionButton('OUVRIR CE CHOIX DANS PRÉPARATIFS',entry,()=>actions159.openChoice(game,entry.choice159,document));append(card,state,conditions,open);liveNodes.set(entry,{status:state,conditions,button:open});}
        if(entry.id.startsWith('programme-DW-'))details.addEventListener('toggle',()=>{
          if(!details.open||details.dataset.recipeLoaded)return;
          const recipe=globalThis.DeadwallCodex3000Runtime?.describe(entry.id.slice('programme-'.length));if(!recipe)return;
          details.dataset.recipeLoaded='true';details.appendChild(el('h5','PROGRAMME COMPLET : PIÈCES, COURS ET MOBILIER'));
          details.appendChild(el('h5','SÉRIES DE MOBILIER — ACTIVATION OPTIONNELLE'));
          details.appendChild(el('p','Révision 7 — COMPLÉTER LES PIÈCES ET LES COURS au dépôt : les minima de la révision 6 sont conservés, puis casiers, armoires, brancards, bidons, bacs, bancs et panneaux complètent les emplacements libres. Zones de placement de cour, sans nouvelle géométrie de jardin ni réseau alimenté. Les refus sont conservés.'));
          details.appendChild(el('p','Au dépôt D-17, « COMPLÉTER LES SÉRIES DE MOBILIER » active la révision 4 : répétitions de meubles compatibles d’après les quantités auteur, selon les emplacements libres. Jusqu’à 24 compléments par étage et 6 par pièce ; aucun remplacement des meubles présents ni nouveau butin. Les dimensions, faces de service et passages restent prioritaires. Une quantité source reste un objectif, pas une garantie de pose. Les équipements sans quantité ou support exploitable restent des prescriptions.'));

          for(const room of recipe.rooms){const section=el('section');
            section.appendChild(el('h5',room.name+' · '+(room.exterior?'Extérieur':'Intérieur')));
            section.appendChild(el('p','Équipement : '+room.kit.inventory.join(', ')+'. Dégagement proposé : '+room.kit.clearance+' m.'));
            if(room.sourceProps158?.length)section.appendChild(el('p','Contenants prévus dans cet espace : '+room.sourceProps158.map(prop=>prop.kind).join(', ')+'. Leur budget de fouille reste celui du lieu.'));
            if(room.area)section.appendChild(el('p','Surface source : '+room.area.join('–')+' m². Les maxima ne se cumulent pas sur une parcelle minimale.'));
            if(room.classificationSource==='inference')section.appendChild(el('p','Intérieur/extérieur déduit du nom : prescription à vérifier avant nouvelle architecture.'));
            section.appendChild(el('p','Niveaux prescrits : '+(room.levels||[]).map(z=>z===0?'rez-de-chaussée':z<0?'sous-sol '+Math.abs(z):'étage '+z).join(', ')+' · Répétitions : '+sourceRange161(room.repeat)+'.'));
            if(room.placement)section.appendChild(el('p',room.placement));
            furniture161(section,room);
            details.appendChild(section);
          }
          if(recipe.gardenOptions.length)details.appendChild(el('p','Jardins possibles : '+recipe.gardenOptions.map(v=>v.name+' (au moins '+v.minArea+' m² libres)').join(' ; ')+'.'));
          const prescribed=el('div',undefined,'codex-prescription161');prescribed.appendChild(el('h5','ACCÈS ET AMÉNAGEMENTS PRESCRITS'));
          const access=accessRows161(recipe);if(access.length)specifications161(prescribed,access);else prescribed.appendChild(el('p','Accès détaillés non renseignés dans cette source : à définir avant une architecture native.','world-codex-boundary'));
          if(recipe.plot){const plot=recipe.plot;prescribed.appendChild(el('p','Parcelle source : '+(plot.enveloppe_min_m||[]).map(sourceNumber161).join(' × ')+' à '+(plot.enveloppe_max_m||[]).map(sourceNumber161).join(' × ')+' m · Stationnements : '+sourceRange161(plot.places_stationnement)+'.'));
            if(plot.implantation)prescribed.appendChild(el('p',plot.implantation));if(plot.attention)prescribed.appendChild(el('p',plot.attention,'world-codex-boundary'));}
          if(recipe.gardenOptions.length)specifications161(prescribed,recipe.gardenOptions.map(garden=>[garden.name,(garden.modules||[]).map(id=>MODULE_LABELS161[id]||id).join(', ')+' · '+sourceNumber161(garden.minArea)+' m² libres minimum proposés'+(garden.unique?' · Sans duplication de '+(MODULE_LABELS161[garden.unique]||garden.unique):'')]));
          const site=globalThis.DeadwallCodexSites162?.describe(recipe.id);if(site){prescribed.appendChild(el('h5','EXTÉRIEURS ET CHEMINEMENTS'));prescribed.appendChild(el('p',site.name+' — '+site.purpose+'. Sol : '+globalThis.DeadwallCodexSites162.MATERIALS[site.material].name+'. Les tracés suivent uniquement les passages libres des lieux réellement implantés ; ils ne créent ni route, ni accès forcé, ni bonus de vitesse.'));}
          if(recipe.causal){prescribed.appendChild(el('h5','ÉTAT DU LIEU : '+recipe.causal.name));for(const [key,label]of [['cause','Cause'],['access','Accès'],['loot','Ressources'],['light','Éclairage']])if(recipe.causal[key])prescribed.appendChild(el('p',label+' : '+recipe.causal[key]));}
          if(recipe.loot?.persistance)prescribed.appendChild(el('p',recipe.loot.persistance));
          prescribed.appendChild(el('p',(recipe.implementation||'Programme de conception.')+' Les dimensions et l’éligibilité source ne prouvent ni une présence sur la carte ni une interaction déjà jouable.','world-codex-boundary'));
          details.appendChild(prescribed);
          details.appendChild(el('p','Enrichissement physique optionnel au dépôt. Aucun objet de décor ne fournit de butin supplémentaire.'));
        });
        card.appendChild(details);list.appendChild(card);
      }
      if(found.length>visible){const more=el('button','AFFICHER '+Math.min(36,found.length-visible)+' FICHES SUPPLÉMENTAIRES');more.type='button';more.addEventListener('click',()=>{visible+=36;refresh(false);});list.appendChild(more);}
      updateLive(true);
    }
    for(const control of[search,family,status,availability]){control.addEventListener(control===search?'input':'change',()=>{if(control===availability){if(['known','supported','context160','unavailable'].includes(availability.value)){status.value='programme';family.value='programmes';}else if(availability.value==='city'){status.value='all';family.value='systemes';}}refresh();});control.addEventListener('keydown',event=>{if(event.code!=='Escape'&&event.code!=='Tab')event.stopPropagation();});}
    const actions=el('div',undefined,'world-codex-actions');
    const map=el('button','CARTE'),bag=el('button','ÉQUIPEMENT');map.type=bag.type='button';
    map.addEventListener('click',()=>game.exploration125?.openMap?.());bag.addEventListener('click',()=>game.exploration125?.openInventory?.());append(actions,map,bag);
    append(section,heading,intro,controls,count,coverage,territories,actions,list);
    const siblings=[...panel.children].filter(n=>n.tagName==='SECTION');const oldButtons=[...nav.querySelectorAll('button')];
    for(const old of oldButtons)old.addEventListener('click',()=>{section.classList.add('hidden');button.setAttribute('aria-pressed','false');});
    const choose=()=>{for(const node of siblings)node.classList.add('hidden');for(const old of oldButtons)old.setAttribute('aria-pressed','false');section.classList.remove('hidden');button.setAttribute('aria-pressed','true');refresh();};
    button.addEventListener('click',choose);nav.appendChild(button);panel.appendChild(section);
    if(typeof game.updateUI==='function'){const previous=game.updateUI.bind(game);game.updateUI=(...args)=>{const result=previous(...args);updateLive();return result;};}
    game.worldCodex=Object.freeze({entries,query:filters=>query(filters,game),open(){game.showCommand?.(true,'field');choose();search.focus({preventScroll:true});},refresh,updateLive});refresh();return true;
  }
  return Object.freeze({entries,families,statuses,fields,normalize,query,install,sourcePropRows161,accessRows161});
});

