(function initLinecareUI(root){
 'use strict';const g=root.DEADWALL,C=root.DeadwallCore,R=C?.LINECARE_RULES;
 if(!g?.linecare||!root.document)return;
 function mount(){if(g.linecareUI)return;const field=document.getElementById('commandPanel-field'),nav=field?.querySelector('.field-nav');if(!field||!nav)return;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const button=(text,id,fn)=>{const b=el('button',text);b.id=id;b.type='button';b.addEventListener('click',()=>{if(!b.disabled&&!b.closest('[inert]'))fn();});return b;};
  const text=(node,value)=>{value=String(value);if(node.textContent!==value)node.textContent=value;};
  const panel=el('section',undefined,'linecare-panel hidden');panel.id='linecarePanel';field.appendChild(panel);
  const tab=button('ENTRETIEN DES LIGNES','linecareTab',()=>g.linecare.open());tab.dataset.fieldView='linecare';nav.appendChild(tab);
  panel.append(el('small','D-17 / APRÈS LA VAGUE'),el('h2','Dégager. Réparer. Refermer.'),el('p','Les corps au pied des remparts peuvent devenir une rampe. La pelle se manie sur la face extérieure, au calme ou pendant la sécurisation. Elle ne rapporte aucun matériau et ne soigne pas le mur.','linecare-intro'));
  const status=el('p','','linecare-status');status.id='linecareStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.appendChild(status);
  const grid=el('div',undefined,'linecare-grid'),left=el('article',undefined,'linecare-card'),right=el('article',undefined,'linecare-card');grid.append(left,right);panel.appendChild(grid);
  const title=el('h3'),info=el('p'),map=el('canvas');map.width=map.height=512;map.id='linecareMap';map.setAttribute('role','img');map.setAttribute('aria-label','Diagnostic des remparts, portes et accès structurel au centre. Aucun ennemi révélé.');
  left.append(title,info,map,el('p','Le tracé ocre montre un accès par cellules ouvertes dans les remparts, pas le chemin exact des infectés. Les autres bâtiments, les amas et les combats ne sont pas évalués par ce tracé. Une ligne fermée peut encore tomber.','linecare-note'));
  const overlay=button('AFFICHER LE DIAGNOSTIC AU SOL','linecareOverlay',()=>g.linecare.setOverlay(!g.linecare.overview().overlay));left.appendChild(overlay);
  let cityZoom=true;const zoom=button('VOIR TOUTE LA CARTE','linecareZoom',()=>{cityZoom=!cityZoom;text(zoom,cityZoom?'VOIR TOUTE LA CARTE':'RECADRER SUR LA CITÉ');refresh(true);});left.appendChild(zoom);
  right.append(el('h3','Préparer l’intervention'),el('p','Pelle : 1,2 unité de pression retirée par seconde active. Tir, crosse et rechargement sont rangés. K ou Échap range la pelle ; elle est aussi rangée à l’alerte.'));
  const equip=button('ÉQUIPER LA PELLE [K]','linecareEquip',()=>g.linecare.equip()),workers=button('OUVRIERS ORDINAIRES : DÉBLAYER','linecareWorkers',()=>{g.setWorkerOrder('clear');refresh(true);}),retreat=button('RAPPELER LES OUVRIERS','linecareRetreat',()=>{g.setWorkerOrder('retreat');refresh(true);}),auto=button('REPRENDRE LES TÂCHES ORDINAIRES','linecareAuto',()=>{g.setWorkerOrder('auto');refresh(true);});
  const controls=el('div',undefined,'linecare-actions');controls.append(equip,workers,retreat,auto);right.append(controls,el('p','Les ordres utilisent les équipes existantes, sans recrutement. Les affectations spéciales gardent leurs propres règles.','linecare-note'));
  const workerInfo=el('p');right.appendChild(workerInfo);right.append(el('h3','Lire les marques'),el('p','Rouge : intégrité ≤ 30 %. Triangle ocre : amas dépassant le premier seuil de franchissement. Cyan : porte ouverte à tous.'));
  const filters=el('div',undefined,'linecare-filters');panel.appendChild(filters);const filter=el('select'),front=el('select');filter.id='linecareFilter';front.id='linecareFront';filter.setAttribute('aria-label','État des remparts');front.setAttribute('aria-label','Front de la cité');
  for(const[value,label]of [['all','Tous les remparts'],['damaged','À réparer'],['corpses','Amas à déblayer'],['critical','Urgences'],['gates','Portes']]){const o=el('option',label);o.value=value;filter.appendChild(o);}
  for(const[value,label]of [['all','Tous les fronts'],['north','Nord'],['east','Est'],['south','Sud'],['west','Ouest']]){const o=el('option',label);o.value=value;front.appendChild(o);}filters.append(filter,front);
  const choosePage=button('COCHER LES MURS ENDOMMAGÉS DE LA PAGE','linecareChoosePage',()=>{for(const r of current)if(r.damaged&&chosen.size<R.maxBatch)chosen.add(r.id);g.linecare.cancel();listKey='';refresh(true);});
  const clearSelection=button('VIDER LA SÉLECTION','linecareClear',()=>{chosen.clear();g.linecare.cancel();listKey='';refresh(true);});filters.append(choosePage,clearSelection);
  const tally=el('p','','linecare-note'),list=el('div',undefined,'linecare-list');list.id='linecareList';panel.append(tally,list);
  const pager=el('div',undefined,'linecare-actions'),prev=button('PRÉCÉDENTS','linecarePrev',()=>{page--;listKey='';refresh(true);}),counter=el('span'),next=button('SUIVANTS','linecareNext',()=>{page++;listKey='';refresh(true);});pager.append(prev,counter,next);panel.appendChild(pager);
  const repair=el('article',undefined,'linecare-card'),review=el('div',undefined,'linecare-review hidden'),quote=el('p'),quoteCost=el('strong');review.id='linecareReview';
  const preview=button('CALCULER LE DEVIS','linecarePreview',()=>{g.linecare.preview([...chosen]);refresh(true);if(!review.classList.contains('hidden'))yes.focus({preventScroll:true});});
  const yes=button('CONFIRMER LA RÉPARATION','linecareConfirm',()=>{const r=g.linecare.confirm();if(r.ok)chosen.clear();listKey='';refresh(true);preview.focus({preventScroll:true});}),no=button('ANNULER LE DEVIS','linecareCancel',()=>{g.linecare.cancel();refresh(true);preview.focus({preventScroll:true});});
  review.append(quoteCost,quote,yes,no);repair.append(el('h3','Réparer seulement les remparts choisis'),el('p','Jusqu’à 32 structures. Somme des coûts individuels, sans remise. Si un mur change, un nouveau devis est nécessaire. Les réparations n’éteignent pas les feux et ne retirent pas les corps.'),preview,review);panel.appendChild(repair);
  let page=0,last=-Infinity,world=g.world,chosen=new Set(),current=[],listKey='',updating=false;
  const resetFilters=()=>{page=0;listKey='';g.linecare.cancel();refresh(true);};filter.addEventListener('change',resetFilters);front.addEventListener('change',resetFilters);
  function drawMap(v){
   const ctx=map.getContext('2d'),core=g.core();let ox=0,oy=0,span=C.WORLD_TILES;
   if(cityZoom&&core){const bounds=[{gx:core.gx,gy:core.gy,w:core.w,h:core.h},...v.rows];
    const minX=Math.min(...bounds.map(b=>b.gx))-6,minY=Math.min(...bounds.map(b=>b.gy))-6,maxX=Math.max(...bounds.map(b=>b.gx+b.w))+6,maxY=Math.max(...bounds.map(b=>b.gy+b.h))+6;
    span=Math.min(C.WORLD_TILES,Math.max(24,maxX-minX,maxY-minY));ox=Math.max(0,Math.min(C.WORLD_TILES-span,(minX+maxX-span)/2));oy=Math.max(0,Math.min(C.WORLD_TILES-span,(minY+maxY-span)/2));}
   const scale=512/span,X=x=>(x-ox)*scale,Y=y=>(y-oy)*scale;
   ctx.fillStyle='#15251c';ctx.fillRect(0,0,512,512);ctx.strokeStyle='#304333';ctx.lineWidth=1;
   for(let k=0;k<C.WORLD_TILES;k+=4){ctx.beginPath();ctx.moveTo(X(k),0);ctx.lineTo(X(k),512);ctx.moveTo(0,Y(k));ctx.lineTo(512,Y(k));ctx.stroke();}
   const path=v.geometry.path;if(path.length){ctx.strokeStyle='#e2ba76';ctx.lineWidth=2;ctx.beginPath();path.forEach((p,i)=>{const x=X(p.x+.5),y=Y(p.y+.5);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();}
   for(const r of v.rows){ctx.fillStyle=r.critical?'#ec9e83':r.risk!=='none'?'#dec071':r.mode==='open'?'#a3d7dd':'#8fac8c';ctx.fillRect(X(r.gx),Y(r.gy),Math.max(3,r.w*scale),Math.max(3,r.h*scale));if(r.id===v.marked){ctx.strokeStyle='#fff0b9';ctx.lineWidth=2;ctx.strokeRect(X(r.gx)-3,Y(r.gy)-3,r.w*scale+6,r.h*scale+6);}}
   if(core){ctx.fillStyle='#f6e4b3';ctx.fillRect(X(core.gx),Y(core.gy),core.w*scale,core.h*scale);}
   if(g.player){ctx.fillStyle='#9cdef5';ctx.beginPath();ctx.arc(X(g.player.x/C.TILE),Y(g.player.y/C.TILE),4,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle='#d9dfc8';ctx.font='12px sans-serif';ctx.fillText(cityZoom?'VUE CITÉ · tracé recadré':'CARTE ENTIÈRE · remparts seulement',12,20);
  }
  function refresh(force=false){if(updating||panel.classList.contains('hidden'))return;if(!force&&performance.now()-last<R.refreshMs)return;last=performance.now();updating=true;
   try{if(world!==g.world){world=g.world;chosen.clear();listKey='';page=0;}const v=g.linecare.overview(),can=g.canIssueCommand(),live=g.state==='playing'&&!g.gameOver;
    for(const id of chosen)if(!v.rows.some(r=>r.id===id&&r.damaged))chosen.delete(id);
    const rows=v.rows.filter(r=>(front.value==='all'||r.front===front.value)&&(filter.value==='all'||filter.value==='damaged'&&r.damaged||filter.value==='corpses'&&r.load>0||filter.value==='critical'&&(r.critical||r.risk!=='none')||filter.value==='gates'&&r.gate));
    const pages=Math.max(1,Math.ceil(rows.length/R.pageSize));page=Math.max(0,Math.min(page,pages-1));current=rows.slice(page*R.pageSize,(page+1)*R.pageSize);text(tally,rows.length+' rempart(s) filtré(s) · '+chosen.size+' sélectionné(s) sur '+R.maxBatch+' maximum.');text(counter,(page+1)+' / '+pages);prev.disabled=page===0;next.disabled=page===pages-1;
    text(title,!v.geometry.hasCore?'Aucune cité active':v.geometry.reachable?'Un accès structurel rejoint le centre':'Le centre est ceinturé');text(info,v.rows.length+' remparts · '+v.rows.filter(r=>r.damaged).length+' endommagés · '+v.rows.filter(r=>r.risk!=='none').length+' amas au-dessus du premier seuil.');
    text(status,v.message||'Choisissez un front, inspectez les accès et préparez les interventions.');text(equip,v.tool?'RANGER LA PELLE [K]':'ÉQUIPER LA PELLE [K]');equip.setAttribute('aria-pressed',String(v.tool));equip.disabled=!can||g.player.dead||!['calm','aftermath'].includes(g.phase);
    overlay.disabled=!live;overlay.setAttribute('aria-pressed',String(v.overlay));text(overlay,v.overlay?'MASQUER LE DIAGNOSTIC AU SOL':'AFFICHER LE DIAGNOSTIC AU SOL');
    workers.disabled=retreat.disabled=auto.disabled=!can;workers.setAttribute('aria-pressed',String(g.workerOrder==='clear'));retreat.setAttribute('aria-pressed',String(g.workerOrder==='retreat'));auto.setAttribute('aria-pressed',String(g.workerOrder==='auto'));
    const w=g.getWorkerSummary();text(workerInfo,w.total+' ouvriers · '+w.clearing+' au déblaiement · '+w.blocked+' trajet(s) signalé(s) bloqué(s).');
    const key=JSON.stringify([current.map(r=>[r.id,r.health,Math.floor(r.load*10),r.mode,r.risk,chosen.has(r.id)]),can]);
    if(key!==listKey){listKey=key;const focused=document.activeElement?.id;list.replaceChildren();if(!current.length)list.appendChild(el('p','Aucun rempart dans ce filtre.'));
     for(const r of current){const card=el('article',undefined,'linecare-row'),label=el('label'),check=el('input');check.type='checkbox';check.id='linecareSelect-'+r.id;check.checked=chosen.has(r.id);check.disabled=!can||!r.damaged||!chosen.has(r.id)&&chosen.size>=R.maxBatch;check.setAttribute('aria-label','Inclure '+r.name+' #'+r.id+' dans le devis');check.addEventListener('change',()=>{check.checked?chosen.add(r.id):chosen.delete(r.id);g.linecare.cancel();listKey='';refresh(true);});label.append(check,el('strong',r.name+' #'+r.id));
      const copy=el('div');copy.append(label,el('p',r.gx+', '+r.gy+' · '+Math.ceil(r.health)+' / '+r.maxHealth+' PV · amas '+r.load.toFixed(1)+(r.gate?' · '+({auto:'passage allié',open:'ouverte à tous',closed:'verrouillée'}[r.mode]):'')),el('small',r.risk==='all'?'Seuil de tous les récents/rampants dépassé.':r.risk==='some'?'Franchissable par certains récents/rampants.':'Amas sous le premier seuil de franchissement.'));
      const marker=button('REPÉRER','linecareMark-'+r.id,()=>g.linecare.mark(r.id));marker.disabled=!can;card.dataset.risk=r.critical?'critical':r.risk;card.append(copy,marker);list.appendChild(card);}
     if(focused?.startsWith('linecareSelect-'))document.getElementById(focused)?.focus({preventScroll:true});}
    choosePage.disabled=!can||!current.some(r=>r.damaged);clearSelection.disabled=!chosen.size;preview.disabled=!can||!chosen.size;review.classList.toggle('hidden',!v.pending);yes.disabled=no.disabled=!can;
    if(v.pending){text(quoteCost,C.resourceText(v.pending.cost));text(quote,v.pending.rows.length+' rempart(s). '+v.pending.reason);}drawMap(v);
   }finally{updating=false;}
  }
  function open(){for(const n of field.children)if(n.tagName==='SECTION')n.classList.toggle('hidden',n!==panel);for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===tab));refresh(true);}
  nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b!==tab){panel.classList.add('hidden');tab.setAttribute('aria-pressed','false');g.linecare.cancel();}});
  const update=g.updateUI.bind(g);g.updateUI=(...args)=>{const r=update(...args);refresh();return r;};
  const dock=document.getElementById('citySystemsDock')?.querySelector('div');if(dock){const b=button('ENTRETIEN DES LIGNES','linecareHud',()=>g.linecare.open());b.className='city16-open';dock.appendChild(b);}
  g.linecareUI=Object.freeze({open,refresh});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);
