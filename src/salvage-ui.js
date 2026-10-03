/* Add field workers to the existing exploration view; no extra command-post tab. */
(function(root){
 'use strict';const g=root.DEADWALL,C=root.DeadwallCore;if(!g?.salvage||!root.document)return;
 function mount(){if(g.salvageUI)return;const host=document.querySelector('#reconPanel .recon-detail');if(!host)return;
  const el=(t,s,cl)=>{const n=document.createElement(t);if(s!==undefined)n.textContent=s;if(cl)n.className=cl;return n;};
  const section=el('section',undefined,'salvage-section');section.id='salvageSection';
  section.append(el('h3','Faire revenir les ressources'),el('p','Après votre relevé, détachez un ouvrier pour un chargement. Il quitte ses tâches ordinaires, remplit son sac puis revient au centre.','recon-note'));
  const note=el('p','','recon-note'),button=el('button','DÉTACHER UN OUVRIER · 4 RATIONS'),status=el('p','','salvage-notice'),counter=el('p','','recon-note'),rows=el('div');button.type='button';button.id='salvageAssign';status.id='salvageStatus';status.setAttribute('role','status');rows.id='salvageCrews';
  button.addEventListener('click',()=>{const p=g.recon.overview().selected;if(p?.kind==='site'){g.salvage.assign(p.ref);refresh(true);}});
  section.append(note,button,status,counter,rows,el('p','Deux places par entrepôt terminé, quatre équipes maximum. Chaque ouvrier garde son sac de dix ressources. À l’alerte, en cas de danger ou de repli général : retour avec ce qu’il porte. Une porte verrouillée peut empêcher ce retour.','recon-note'));
  host.appendChild(section);let last=-Infinity,key='';
  function refresh(force=false){if(document.getElementById('reconPanel').classList.contains('hidden'))return;if(!force&&performance.now()-last<400)return;last=performance.now();const v=g.salvage.overview(),p=g.recon.overview().selected,q=p?.kind==='site'?g.salvage.status(p.ref):null;
   note.textContent=q?(p.name+' — '+q.reason):'Sélectionnez une découverte déjà relevée, avec des réserves restantes.';button.disabled=!q?.ok;status.textContent=v.notice;counter.textContent=v.crews.length+' / '+v.slots+' places · '+v.stats.returned+' retours · '+v.stats.lost+' pertes';
   const next=JSON.stringify([v.crews.map(c=>[c.id,c.site,c.returning,Math.floor(c.carry*10),c.job]),g.canIssueCommand()]);if(next===key)return;key=next;const focus=document.activeElement?.id;rows.replaceChildren();
   for(const c of v.crews){const row=el('article',undefined,'salvage-row'),title=el('strong','#'+c.id+' · '+c.name),cargo=el('p',c.job,'recon-note'),sack=el('small',c.carry.toFixed(1)+' '+(C.RESOURCE_META[c.resource]?.label.toLowerCase()||'ressources')+' dans le sac');const recall=el('button',c.returning?'RETOUR EN COURS':'RAPPELER');recall.type='button';recall.id='salvageRecall-'+c.id;recall.disabled=c.returning||!g.canIssueCommand();recall.addEventListener('click',()=>{g.salvage.recall(c.id);key='';refresh(true);});row.append(title,cargo,sack,recall);rows.appendChild(row);}
   if(focus?.startsWith('salvageRecall-'))document.getElementById(focus)?.focus({preventScroll:true});
  }
  const previous=g.reconUI;g.reconUI=Object.freeze({...previous,open:(...args)=>{const r=previous.open(...args);refresh(true);return r;},refresh:(...args)=>{const r=previous.refresh(...args);refresh(true);return r;}});
  const old=g.updateUI.bind(g);g.updateUI=(...args)=>{const r=old(...args);refresh();return r;};
  document.getElementById('reconPanel').addEventListener('click',()=>refresh(true));document.querySelector('.field-nav').addEventListener('click',()=>refresh(true));
  // Keep blueprint illustrations functional: generated from the actual footprints, not mockups.
  const plans=document.querySelectorAll('.dw14-plan');for(const card of plans){const b=card.querySelector('button'),id=b?.id.slice(5),plan=C.Dayworks.PLANS.find(p=>p.id===id);if(!plan)continue;const canvas=el('canvas');canvas.width=220;canvas.height=144;canvas.className='worksite-sketch';canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d'),scale=Math.min(200/plan.w,124/plan.h);ctx.fillStyle='#142119';ctx.fillRect(0,0,220,144);ctx.save();ctx.translate((220-plan.w*scale)/2,(144-plan.h*scale)/2);
   for(const p of C.Dayworks.footprint(id,0,0)){const d=C.BUILDINGS[p.type],w=d.size[p.rotation%2?1:0],h=d.size[p.rotation%2?0:1];ctx.fillStyle=d.gate?'#dfc281':d.wall?'#aa9874':d.defense?'#9fada0':d.production?'#849e70':'#b3b69a';ctx.fillRect(p.gx*scale+1,p.gy*scale+1,w*scale-2,h*scale-2);}ctx.restore();card.insertBefore(canvas,card.firstChild);}
  g.salvageUI=Object.freeze({refresh});refresh(true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(globalThis);
