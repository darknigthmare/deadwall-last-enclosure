(function(root,factory){'use strict';
  const packs=typeof module==='object'&&module.exports?{
    nature:require('./world-codex-nature.js'),habitat:require('./world-codex-habitat.js'),
    activites:require('./world-codex-activites.js'),systemes:require('./world-codex-systemes.js'),equipment134:require('./equipment-codex134.js'),biomes135:require('./biomes-codex135.js'),seed157:require('./world-codex-seed157.js'),programmes:require('./world-codex-3000.js')
  }:root.DeadwallCodexPacks;
  const api=factory(packs||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.DeadwallWorldCodex=api;if(root.DEADWALL&&root.document)api.install(root.DEADWALL,root.document);}
})(typeof globalThis!=='undefined'?globalThis:this,function(packs){'use strict';
  const entries=Object.freeze(['nature','habitat','activites','systemes','equipment134','biomes135','seed157','programmes'].flatMap(k=>packs[k]||[]));
  const families=Object.freeze({nature:'Milieux naturels',habitat:'Villes et quartiers',camps:'Camps et refuges',activites:'Activités et services',systemes:'Survie et cité',programmes:'Codex 3 000'});
  const statuses=Object.freeze({jouable:'Disponible en jeu',pilote:'Présent en partie',plan:'Projet de contenu',programme:'Programme procédural'});
  const fields=Object.freeze({layout:'Organisation du lieu',access:'Accès et déplacement',supplies:'Ressources et usage',risks:'Risques et limites',night:'De nuit',variants:'Variantes',interactions:'Liens avec la survie',qa:'Contrôle de cohérence',source:'Portée et référence'});
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const runtime160=globalThis.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null);
  const index=new Map(entries.map(e=>[e.id,normalize(Object.values(e).join(' '))]));
  function query(filters={}){
    const words=normalize(filters.text).split(' ').filter(Boolean),family=filters.family||'all',status=filters.status||'all';
    return entries.filter(e=>(family==='all'||e.family===family)&&(status==='all'||status==='terrain'&&['jouable','pilote'].includes(e.status)||e.status===status)&&words.every(word=>index.get(e.id).includes(word)||(e.id.startsWith('programme-DW-')&&runtime160?.searchDocument(e.id.slice(10)).includes(word))));
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
    function option(select,value,label){const n=el('option',label);n.value=value;select.appendChild(n);}
    option(family,'all','Toutes les familles');for(const[k,v]of Object.entries(families))option(family,k,v);
    option(status,'terrain','Contenu présent');option(status,'all','Présent et projets');option(status,'programme','Les 3 000 programmes');for(const[k,v]of Object.entries(statuses))option(status,k,v);
    family.value='all';status.value='terrain';append(controls,searchLabel,familyLabel,statusLabel);
    const count=el('p','','world-codex-count');count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');
    const list=el('div',undefined,'world-codex-list');list.id='worldCodexResults';
    let visible=36;
    function refresh(reset=true){if(reset!==false)visible=36;const found=query({text:search.value,family:family.value,status:status.value});list.replaceChildren();count.textContent=found.length+' fiche'+(found.length===1?'':'s')+' trouvée(s) · '+entries.length+' dans le guide';
      if(!found.length){list.appendChild(el('p','Aucune fiche pour ces filtres. Essayez un terme plus court ou « Présent et projets ».','world-codex-empty'));return;}
      for(const entry of found.slice(0,visible)){const card=el('article',undefined,'world-codex-card');card.dataset.codexId=entry.id;
        append(card,el('small',families[entry.family]+' · '+statuses[entry.status],'world-codex-status status-'+entry.status),el('h4',entry.title),el('p',entry.summary));
        if(entry.status==='plan')card.appendChild(el('p','Conception : ce programme n’est pas annoncé comme jouable.','world-codex-boundary'));
        if(entry.status==='pilote')card.appendChild(el('p','Une partie du lieu existe. Les variantes et extensions décrites ne sont pas toutes intégrées.','world-codex-boundary'));
        const details=el('details'),summary=el('summary','Accès, ressources et précautions');details.appendChild(summary);
        for(const[key,label]of Object.entries(fields)){if(!entry[key])continue;const p=el('p');append(p,el('strong',label+' — '),el('span',entry[key]));details.appendChild(p);}
        if(entry.id.startsWith('programme-DW-'))details.addEventListener('toggle',()=>{
          if(!details.open||details.dataset.recipeLoaded)return;
          const recipe=globalThis.DeadwallCodex3000Runtime?.describe(entry.id.slice('programme-'.length));if(!recipe)return;
          details.dataset.recipeLoaded='true';details.appendChild(el('h5','PROGRAMME COMPLET : PIÈCES, COURS ET MOBILIER'));
          for(const room of recipe.rooms){const section=el('section');
            section.appendChild(el('h5',room.name+' · '+(room.exterior?'Extérieur':'Intérieur')));
            section.appendChild(el('p','Équipement : '+room.kit.inventory.join(', ')+'. Dégagement proposé : '+room.kit.clearance+' m.'));
            if(room.authoredProps.length)section.appendChild(el('p','Mobilier source : '+room.authoredProps.map(p=>p.nom+' ('+p.quantite_par_espace.join('–')+' ; '+[p.gabarit_m.longueur,p.gabarit_m.largeur,p.gabarit_m.hauteur].join(' × ')+' m ; dégagement '+p.degagement_min_m+' m)').join(' ; ')+'.'));
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
          if(recipe.causal){prescribed.appendChild(el('h5','ÉTAT DU LIEU : '+recipe.causal.name));for(const [key,label]of [['cause','Cause'],['access','Accès'],['loot','Ressources'],['light','Éclairage']])if(recipe.causal[key])prescribed.appendChild(el('p',label+' : '+recipe.causal[key]));}
          if(recipe.loot?.persistance)prescribed.appendChild(el('p',recipe.loot.persistance));
          prescribed.appendChild(el('p',(recipe.implementation||'Programme de conception.')+' Les dimensions et l’éligibilité source ne prouvent ni une présence sur la carte ni une interaction déjà jouable.','world-codex-boundary'));
          details.appendChild(prescribed);
          details.appendChild(el('p','Enrichissement physique optionnel au dépôt. Aucun objet de décor ne fournit de butin supplémentaire.'));
        });
        card.appendChild(details);list.appendChild(card);
      }
      if(found.length>visible){const more=el('button','AFFICHER '+Math.min(36,found.length-visible)+' FICHES SUPPLÉMENTAIRES');more.type='button';more.addEventListener('click',()=>{visible+=36;refresh(false);});list.appendChild(more);}
    }
    for(const control of[search,family,status]){control.addEventListener(control===search?'input':'change',refresh);control.addEventListener('keydown',event=>{if(event.code!=='Escape'&&event.code!=='Tab')event.stopPropagation();});}
    const actions=el('div',undefined,'world-codex-actions');
    const map=el('button','CARTE'),bag=el('button','ÉQUIPEMENT');map.type=bag.type='button';
    map.addEventListener('click',()=>game.exploration125?.openMap?.());bag.addEventListener('click',()=>game.exploration125?.openInventory?.());append(actions,map,bag);
    append(section,heading,intro,controls,count,actions,list);
    const siblings=[...panel.children].filter(n=>n.tagName==='SECTION');const oldButtons=[...nav.querySelectorAll('button')];
    for(const old of oldButtons)old.addEventListener('click',()=>{section.classList.add('hidden');button.setAttribute('aria-pressed','false');});
    const choose=()=>{for(const node of siblings)node.classList.add('hidden');for(const old of oldButtons)old.setAttribute('aria-pressed','false');section.classList.remove('hidden');button.setAttribute('aria-pressed','true');refresh();};
    button.addEventListener('click',choose);nav.appendChild(button);panel.appendChild(section);
    game.worldCodex=Object.freeze({entries,query,open(){game.showCommand?.(true,'field');choose();search.focus({preventScroll:true});},refresh});refresh();return true;
  }
  return Object.freeze({entries,families,statuses,fields,normalize,query,install,sourcePropRows161,accessRows161});
});

