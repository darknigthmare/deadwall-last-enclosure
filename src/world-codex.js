(function(root,factory){'use strict';
  const packs=typeof module==='object'&&module.exports?{
    nature:require('./world-codex-nature.js'),habitat:require('./world-codex-habitat.js'),
    activites:require('./world-codex-activites.js'),systemes:require('./world-codex-systemes.js'),equipment134:require('./equipment-codex134.js'),biomes135:require('./biomes-codex135.js')
  }:root.DeadwallCodexPacks;
  const api=factory(packs||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.DeadwallWorldCodex=api;if(root.DEADWALL&&root.document)api.install(root.DEADWALL,root.document);}
})(typeof globalThis!=='undefined'?globalThis:this,function(packs){'use strict';
  const entries=Object.freeze(['nature','habitat','activites','systemes','equipment134','biomes135'].flatMap(k=>packs[k]||[]));
  const families=Object.freeze({nature:'Milieux naturels',habitat:'Villes et quartiers',camps:'Camps et refuges',activites:'Activités et services',systemes:'Survie et cité'});
  const statuses=Object.freeze({jouable:'Disponible en jeu',pilote:'Présent en partie',plan:'Projet de contenu'});
  const fields=Object.freeze({layout:'Organisation du lieu',access:'Accès et déplacement',supplies:'Ressources et usage',risks:'Risques et limites',night:'De nuit',variants:'Variantes',interactions:'Liens avec la survie',qa:'Contrôle de cohérence',source:'Portée et référence'});
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const index=new Map(entries.map(e=>[e.id,normalize(Object.values(e).join(' '))]));
  function query(filters={}){
    const words=normalize(filters.text).split(' ').filter(Boolean),family=filters.family||'all',status=filters.status||'all';
    return entries.filter(e=>(family==='all'||e.family===family)&&(status==='all'||status==='terrain'&&e.status!=='plan'||e.status===status)&&words.every(word=>index.get(e.id).includes(word)));
  }
  function install(game,document){
    if(!game||!document||game.worldCodex)return false;
    const panel=document.getElementById('commandPanel-field'),nav=panel?.querySelector('.field-nav');if(!panel||!nav)return false;
    const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.classList.add(...cls.split(' '));return n;};
    const append=(parent,...nodes)=>{for(const n of nodes)parent.appendChild(n);return parent;};
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
    option(status,'terrain','Contenu présent');option(status,'all','Présent et projets');for(const[k,v]of Object.entries(statuses))option(status,k,v);
    family.value='all';status.value='terrain';append(controls,searchLabel,familyLabel,statusLabel);
    const count=el('p','','world-codex-count');count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');
    const list=el('div',undefined,'world-codex-list');list.id='worldCodexResults';
    function refresh(){const found=query({text:search.value,family:family.value,status:status.value});list.replaceChildren();count.textContent=found.length+' fiche'+(found.length===1?'':'s')+' · '+entries.length+' fiches dans le guide';
      if(!found.length){list.appendChild(el('p','Aucune fiche pour ces filtres. Essayez un terme plus court ou « Présent et projets ».','world-codex-empty'));return;}
      for(const entry of found){const card=el('article',undefined,'world-codex-card');card.dataset.codexId=entry.id;
        append(card,el('small',families[entry.family]+' · '+statuses[entry.status],'world-codex-status status-'+entry.status),el('h4',entry.title),el('p',entry.summary));
        if(entry.status==='plan')card.appendChild(el('p','Conception : ce programme n’est pas annoncé comme jouable.','world-codex-boundary'));
        if(entry.status==='pilote')card.appendChild(el('p','Une partie du lieu existe. Les variantes et extensions décrites ne sont pas toutes intégrées.','world-codex-boundary'));
        const details=el('details'),summary=el('summary','Accès, ressources et précautions');details.appendChild(summary);
        for(const[key,label]of Object.entries(fields)){if(!entry[key])continue;const p=el('p');append(p,el('strong',label+' — '),el('span',entry[key]));details.appendChild(p);}
        card.appendChild(details);list.appendChild(card);
      }
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
  return Object.freeze({entries,families,statuses,fields,normalize,query,install});
});
