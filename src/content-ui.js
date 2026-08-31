(function initFieldDossiers() {
  'use strict';
  const game=globalThis.DEADWALL,C=globalThis.DeadwallCore,A=globalThis.DeadwallArt;
  const get=id=>document.getElementById(id),modal=get('commandModal');if(!game||!modal)return;
  const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
  const panel=get('commandPanel-field');if(!panel)return;panel.replaceChildren();
  const nav=el('nav',undefined,'field-nav');nav.setAttribute('aria-label','Dossiers de terrain');panel.appendChild(nav);
  const sections={},buttons={},portraits=[],recruitCards=new Map();let current='infected',rosterKey='',sectorKey='';
  for(const [id,label]of [['infected','INFECTÉS'],['crew','ÉQUIPE'],['sectors','SECTEURS']]){
    const button=el('button',label);button.type='button';button.dataset.fieldView=id;nav.appendChild(button);buttons[id]=button;
    const section=el('section');section.id='field-'+id;sections[id]=section;panel.appendChild(section);
    button.setAttribute('aria-controls',section.id);button.addEventListener('click',()=>choose(id));
  }
  function choose(id){if(!sections[id])return;current=id;for(const name of Object.keys(sections)){sections[name].classList.toggle('hidden',name!==id);buttons[name].setAttribute('aria-pressed',String(name===id));}refresh();}
  function portraitCard(kind,title,meta){
    const card=el('article',undefined,'field-card'),head=el('div',undefined,'field-card-header'),canvas=el('canvas'),copy=el('div');
    canvas.width=160;canvas.height=140;canvas.setAttribute('aria-hidden','true');portraits.push({canvas,kind});
    copy.append(el('small',meta),el('h3',title));head.append(canvas,copy);card.appendChild(head);return card;
  }
  sections.infected.appendChild(el('p','Huit profils, des réponses différentes. Les seuils indiquent l’entrée dans la composition des hordes ; l’effectif de chaque profil dépend ensuite de la vague. Les points de vie ci-dessous sont les valeurs de base, avant protocole et progression.','command-note'));
  const bestiary=el('div',undefined,'field-grid');sections.infected.appendChild(bestiary);
  for(const [kind,def]of Object.entries(C.ENEMIES).sort((a,b)=>a[1].unlockWave-b[1].unlockWave)){
    const card=portraitCard(kind,def.name,'DÈS LA VAGUE '+def.unlockWave+' · '+def.health+' PV');card.dataset.enemyProfile=kind;
    card.append(el('p',def.description),el('p','RÉPONSE : '+def.weakness,'field-counter'));bestiary.appendChild(card);
  }
  sections.crew.appendChild(el('p','Chaque survivant occupe une place de logement et consomme des rations. Les spécialistes fuient les menaces proches et suivent l’ordre REPLI des ouvriers ; les fusiliers gardent leur ralliement. Aucun bonus permanent ni personnage immortel.','command-note'));
  const crewCards=el('div',undefined,'field-grid');sections.crew.appendChild(crewCards);
  const details={
    worker:'Rapporte les ressources avant leur utilisation. Les portes et l’accès aux chantiers déterminent son efficacité.',
    soldier:'Tirs payés sur le stock de munitions ; aucune balle sans réserve.',
    medic:'Soins de terrain : '+C.NPC_RULES.healPerSecond+' PV/s, '+(1/C.NPC_RULES.medicinePerHealth)+' PV par médicament. Cible vivante accessible ; aucune résurrection. La clinique conserve ses soins de proximité.',
    engineer:'Réparation : '+C.NPC_RULES.repairPerSecond+' PV/s au contact accessible. Ferraille, plus bois ou pierre pour les murs correspondants. Arrêt dès que les matériaux manquent.'
  };
  for(const [kind,def]of Object.entries(C.SURVIVORS)){
    const card=portraitCard(kind,def.name,(def.requires?C.BUILDINGS[def.requires].name+' · ':'')+C.CITY_TIERS[def.tier].name);card.dataset.survivorProfile=kind;
    card.append(el('p',def.description),el('p',details[kind],'field-counter'),el('p','RECRUTEMENT · '+Object.entries(def.cost).map(([k,n])=>n+' '+C.RESOURCE_META[k].label.toLowerCase()).join(' · '),'field-cost'));
    const button=el('button','RECRUTER'),status=el('p','','field-state');button.type='button';button.dataset.recruitKind=kind;card.append(button,status);crewCards.appendChild(card);recruitCards.set(kind,{button,status});
    button.addEventListener('click',()=>{if(game.recruit(kind)){get('commandStatus').textContent=def.name+' rejoint la cité. Ordres appliqués à la reprise.';refresh();}});
  }
  sections.crew.appendChild(el('h3','PERSONNEL EN SERVICE'));
  const roster=el('ul',undefined,'field-roster');roster.id='fieldRoster';sections.crew.appendChild(roster);
  sections.sectors.appendChild(el('p','Six secteurs de récupération sont répartis loin du dépôt initial. Leurs vestiges et véhicules sont des gisements traversables, pas des abris défensifs. Récoltez puis déposez : rien n’est crédité à distance. La même graine conserve les mêmes emplacements.','command-note'));
  const sectorLegend=el('p','','command-note');sections.sectors.appendChild(sectorLegend);
  const sectorMap=el('canvas',undefined,'field-sector-map');sectorMap.width=480;sectorMap.height=480;sectorMap.setAttribute('role','img');sectorMap.setAttribute('aria-label','Carte des secteurs : les coordonnées et ressources sont détaillées dans la liste suivante.');sections.sectors.appendChild(sectorMap);
  const sectorList=el('div',undefined,'field-sector-list');sections.sectors.appendChild(sectorList);
  const names=['Camille','Sacha','Alex','Lou','Charlie','Noa','Dominique','Claude','Morgan','Alix','Andrea','Eden'];
  const tasks={idle:'Disponible',move:'En déplacement',haul:'Transport',gather:'Récolte',build:'Chantier',repair:'Soutien',clear:'Déblaiement',return:'Retour au dépôt',flee:'Mise à l’abri'};
  function drawPortraits(){for(const {canvas,kind}of portraits){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,160,140);ctx.save();ctx.translate(80,73);ctx.scale(2.2,2.2);game.art.drawActor(ctx,{id:0,x:0,y:0,facing:0},kind,0,true,false);ctx.restore();}}
  function drawMap(sites){
    const ctx=sectorMap.getContext('2d'),s=480/C.WORLD_SIZE;ctx.fillStyle='#0c1710';ctx.fillRect(0,0,480,480);
    ctx.strokeStyle='#354231';ctx.lineWidth=1;for(let i=0;i<=8;i++){ctx.beginPath();ctx.moveTo(i*60,0);ctx.lineTo(i*60,480);ctx.moveTo(0,i*60);ctx.lineTo(480,i*60);ctx.stroke();}
    ctx.strokeStyle='#586144';for(const r of [650,1100,1600]){ctx.beginPath();ctx.arc(240,240,r*s,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#dec177';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillRect(235,235,10,10);ctx.fillText('DÉPÔT D-17',240,226);
    for(const [i,site]of sites.entries()){const x=site.x*s,y=site.y*s;ctx.fillStyle=game.fieldMarker===site.id?'#ffe29a':'#a5b798';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#132016';ctx.fillText(String(i+1),x,y+4);}
    if(game.state==='playing'){ctx.fillStyle='#f2e5be';ctx.beginPath();ctx.arc(game.player.x*s,game.player.y*s,4,0,Math.PI*2);ctx.fill();}
  }
  function refresh(){
    if(modal.classList.contains('hidden'))return;const playing=game.state==='playing'&&!game.gameOver;
    for(const [kind,{button,status}]of recruitCards){const def=C.SURVIVORS[kind];button.disabled=!game.canRecruit(kind);
      status.textContent=!playing?'Disponible pendant une campagne.':game.population>=game.housing?'Logements complets.':game.tier.id<def.tier?'Palier '+C.CITY_TIERS[def.tier].name+' requis.':def.requires&&!game.world.has(def.requires)?C.BUILDINGS[def.requires].name+' terminée requise.':!C.canAfford(game.resources,def.cost)?'Réserves insuffisantes.':'Une place sera occupée.';}
    if(current==='crew'){
      const units=playing?game.units.filter(u=>!u.dead):[],key=game.world.seed+':'+units.map(u=>[u.id,u.kind,Math.ceil(u.health),u.state,u.supportActive].join('/')).join(',');
      if(key!==rosterKey){rosterKey=key;roster.replaceChildren();if(!units.length)roster.appendChild(el('li','Aucun personnel en service dans ce dossier.'));
        for(const u of units.slice(0,100)){const row=el('li'),copy=el('div'),hash=Math.floor(C.seededHash(u.id,73,game.world.seed)*1e8);copy.append(el('strong',names[hash%names.length]+' '+String.fromCharCode(65+Math.floor(hash/names.length)%26)+'. · '+C.SURVIVORS[u.kind].name),el('small',u.supportActive?(u.kind==='medic'?'Soins en cours':'Réparation en cours'):(tasks[u.state]||'Disponible')));row.append(copy,el('span',Math.ceil(u.health)+' / '+u.maxHealth+' PV'));roster.appendChild(row);}
        if(units.length>100)roster.appendChild(el('li',(units.length-100)+' autres survivants en service.'));}}
    if(current==='sectors'){
      const sites=game.world.sites||[],key=[game.world.seed,playing,game.fieldMarker,...sites.map(site=>game.world.nodes.filter(n=>n.siteId===site.id&&!n.depleted).map(n=>n.id+':'+Math.floor(n.amount)).join(','))].join('/');
      sectorLegend.textContent='CARTE '+game.world.seed+(playing?' · Campagne en cours.':' · Aperçu de démonstration, distinct de la graine facultative du menu.');drawMap(sites);
      if(key!==sectorKey){sectorKey=key;sectorList.replaceChildren();for(const [i,site]of sites.entries()){
        const nodes=game.world.nodes.filter(n=>n.siteId===site.id&&!n.depleted),stock=C.makeBag();for(const n of nodes)stock[n.type]+=n.amount;
        const card=el('article');card.dataset.siteId=site.id;card.dataset.marked=String(game.fieldMarker===site.id);
        card.append(el('h3',(i+1)+' · '+site.name),el('p',({housing:'Lotissement',market:'Commerces',aid:'Secours',industry:'Industrie',transit:'Transport',checkpoint:'Barrage'})[site.theme]+' · '+Math.floor(site.x/C.TILE)+','+Math.floor(site.y/C.TILE)+' · '+Math.round(Math.hypot(site.x-C.WORLD_SIZE/2,site.y-C.WORLD_SIZE/2))+' unités du dépôt'),el('p',nodes.length?C.resourceText(stock)+' · '+nodes.length+' gisements restants':'Secteur épuisé ou recouvert par la cité.'));
        const button=el('button',game.fieldMarker===site.id?'EFFACER LE REPÈRE':'MARQUER SUR LA CARTE');button.type='button';button.disabled=!playing;button.dataset.markSite=site.id;card.appendChild(button);
        button.addEventListener('click',()=>{game.fieldMarker=game.fieldMarker===site.id?null:site.id;sectorKey='';get('commandStatus').textContent=game.fieldMarker?'Repère posé : '+site.name+'. Il ne donne aucun ordre de déplacement.':'Repère retiré.';refresh();sectorList.querySelector('[data-mark-site="'+site.id+'"]')?.focus({preventScroll:true});});
        sectorList.appendChild(card);}}
    }
  }
  function drawMarker(ctx,view){
    const site=(game.world.sites||[]).find(s=>s.id===game.fieldMarker);if(!site||!game.visible(site.x,site.y,100,view))return;
    ctx.save();ctx.strokeStyle='#ddc17c';ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(site.x,site.y,100,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#121b14dd';ctx.fillRect(site.x-100,site.y-122,200,22);ctx.fillStyle='#ead59b';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(site.name,site.x,site.y-107,190);ctx.restore();
  }
  function drawMinimap(ctx,sx,sy){for(const [i,site]of (game.world.sites||[]).entries()){const marked=game.fieldMarker===site.id;ctx.strokeStyle=marked?'#ffe29a':'#919c79';ctx.lineWidth=marked?2:1;ctx.strokeRect(site.x*sx-3,site.y*sy-3,6,6);if(marked){ctx.fillStyle='#ffe29a';ctx.font='10px sans-serif';ctx.fillText(String(i+1),site.x*sx+5,site.y*sy+3);}}}
  game.contentUI={refresh,drawMarker,drawMinimap,choose};
  get('specialistCommandButton')?.addEventListener('click',()=>{game.showCommand(true,'field');choose('crew');});
  game.art?.ready.then(drawPortraits);choose('infected');
})();
