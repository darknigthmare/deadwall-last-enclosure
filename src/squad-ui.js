(function initDeadwallSquadUI(){
  'use strict';
  const game=globalThis.DEADWALL,C=globalThis.DeadwallCore,root=document.getElementById('squadCommandPanel');
  if(!game||!C||!root)return;
  const node=(tag,text,className)=>{const item=document.createElement(tag);if(text!==undefined)item.textContent=text;if(className)item.className=className;return item;};
  root.classList.add('squad-command');root.setAttribute('aria-labelledby','squadHeading');
  const heading=node('h3','SECTIONS DE FUSILIERS');heading.id='squadHeading';
  const intro=node('p','Trois sections partagent les mêmes munitions. Les nouvelles recrues renforcent la section la moins peuplée. Les ordres ne déplacent personne instantanément.','command-note');
  const shortcuts=node('p','Clavier en jeu : 4 / 5 / 6 sélectionnent une section, G prépare son point, T ordonne son repli. Le ralliement général commande les trois sections.','command-note');
  const cards=node('div',undefined,'squad-grid'),status=node('p','','squad-status');status.id='squadStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const views=[];
  for(let index=0;index<C.SQUAD_RULES.count;index++){
    const card=node('article',undefined,'squad-card');card.dataset.squad=String(index);
    const select=node('button',undefined,'squad-select');select.type='button';select.dataset.squadSelect=String(index);
    const name=node('strong',C.SQUAD_RULES.labels[index]),count=node('span','0 fusilier');select.appendChild(name);select.appendChild(count);
    select.setAttribute('aria-label','Sélectionner la section '+C.SQUAD_RULES.labels[index]);select.setAttribute('aria-pressed','false');
    const order=node('p','','squad-order'),access=node('p','','squad-access'),buttons=node('div',undefined,'squad-actions');
    const rally=node('button','POINT AU SOL · REPREND LE JEU'),here=node('button','RALLIER MA POSITION'),retreat=node('button','REPLI AU CENTRE');
    for(const [button,action]of [[rally,'rally'],[here,'here'],[retreat,'retreat']]){button.type='button';button.dataset.squadAction=action;button.dataset.squadIndex=String(index);button.setAttribute('aria-label',button.textContent+' — section '+C.SQUAD_RULES.labels[index]);buttons.appendChild(button);}
    select.addEventListener('click',()=>{if(game.selectSquad(index)){game.audio.ui();announce('Section '+C.SQUAD_RULES.labels[index]+' sélectionnée.');}});
    rally.addEventListener('click',()=>game.beginSquadRally(index));
    here.addEventListener('click',()=>game.setSquadRally(index,{x:game.player.x,y:game.player.y}));
    retreat.addEventListener('click',()=>game.retreatSquad(index));
    for(const item of [select,order,access,buttons])card.appendChild(item);cards.appendChild(card);views.push({card,select,count,order,access,rally,here,retreat});
  }
  root.replaceChildren(heading,intro,cards,shortcuts,status);
  function announce(text){status.textContent=text;}
  function refresh(){
    const allowed=game.canCommandSquads(),summary=game.getSquadSummary();
    for(const group of summary){
      const view=views[group.index];
      view.card.dataset.selected=String(group.selected);view.select.setAttribute('aria-pressed',String(group.selected));view.select.disabled=!allowed;
      view.count.textContent=group.count+' fusilier'+(group.count===1?'':'s');
      view.order.textContent=group.order==='retreat'?'ORDRE : REPLI AU CENTRE':'RALLIEMENT : '+C.grid(group.rally.x)+' / '+C.grid(group.rally.y);
      view.access.textContent=!group.count?'Section en attente de recrutement.':group.blocked?group.blocked+' trajet'+(group.blocked===1?'':'s')+' bloqué'+(group.blocked===1?'':'s')+' : contrôlez les portes.':group.order==='retreat'?'Repli physique ; riposte conservée, aucune poursuite.':'Contact hostile prioritaire, puis retour au point de section.';
      view.rally.disabled=!allowed;view.here.disabled=!allowed||game.player.dead;view.retreat.disabled=!allowed;
      view.retreat.setAttribute('aria-pressed',String(group.order==='retreat'));
    }
    const shortcut=document.getElementById('squadCommandButton');
    if(shortcut){shortcut.disabled=game.state!=='playing'||game.gameOver;shortcut.setAttribute('aria-label','Sections de fusiliers — '+summary.reduce((total,g)=>total+g.count,0)+' présents');}
  }
  function drawMarkers(ctx,view){
    if(game.state!=='playing'||game.gameOver||!game.squads)return;
    const counts=globalThis.DeadwallSquads.counts(game.units),core=game.core(),selected=game.squads.selected;
    ctx.save();ctx.lineWidth=1.5;ctx.font='bold 10px monospace';ctx.textAlign='center';
    game.squads.groups.forEach((group,index)=>{
      if(!counts[index])return;const point=group.order==='retreat'?core:group.rally;
      if(!point||!game.visible(point.x,point.y,60,view))return;
      ctx.strokeStyle=index===selected?'#e0b45e':'#9baa86';ctx.fillStyle='#111911dc';
      ctx.beginPath();ctx.arc(point.x,point.y,18+index*5,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=index===selected?'#ffe0a1':'#d1d8c5';ctx.fillText(String.fromCharCode(65+index)+' · '+(group.order==='retreat'?'REPLI':counts[index]),point.x,point.y-27-index*13);
    });
    for(const unit of game.units){
      if(unit.kind!=='soldier'||unit.dead||unit.squad!==selected||!game.visible(unit.x,unit.y,30,view))continue;
      ctx.strokeStyle='#e0b45e';ctx.beginPath();ctx.arc(unit.x,unit.y,unit.radius+4,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffe0a1';ctx.fillText(String.fromCharCode(65+selected),unit.x,unit.y-unit.radius-8);
    }
    ctx.restore();
  }
  document.getElementById('squadCommandButton')?.addEventListener('click',()=>game.showCommand?.(true,'workers'));
  game.squadUI={refresh,announce,drawMarkers};refresh();
})();
