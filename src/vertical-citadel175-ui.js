(function(root){'use strict';
 function install(g,doc=root.document){if(!g?.vertical175||!doc||g.vertical175UI)return;const V=g.vertical175,R=root.DeadwallCore.VerticalCitadel175;
  const element=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;};
  const bar=element('div');bar.id='vertical175bar';bar.hidden=true;bar.setAttribute('aria-label','Accès à la citadelle verticale');
  const label=element('span'),access=element('button','MONTER'),dossier=element('button','CITADELLE'),view=element('button','VUE FPS'),leave=element('button','QUITTER L’AFFÛT');
  access.id='vertical175access';dossier.id='vertical175dossier';view.id='vertical175view';leave.id='vertical175leave';for(const n of [label,access,dossier,view,leave])bar.appendChild(n);doc.body.appendChild(bar);
  const panel=element('div');panel.id='vertical175fps';panel.hidden=true;const canvas=element('canvas'),cross=element('div'),status=element('output'),fire=element('button','TIR');canvas.id='vertical175canvas';cross.className='v175-cross';status.id='vertical175status';fire.id='vertical175fire';canvas.setAttribute('aria-label','Vue 3D depuis l’affût ; glissez pour viser');for(const n of [canvas,cross,status,fire])panel.appendChild(n);doc.body.appendChild(panel);
  let renderer=null,drag=null,lastText='',active=false;
  const open=()=>g.expansionUI?.open('vertical175');dossier.addEventListener('click',open);
  access.addEventListener('click',()=>{const b=V.target();if(!b)return;const p=V.pose();V.access(b.id,p.site?(p.level>0?p.level-1:-1):0);});
  leave.addEventListener('click',()=>V.release());
  function release(){drag=null;g.input.mouseDown=false;g.input.touchFire=false;panel.hidden=true;if(doc.pointerLockElement===canvas)doc.exitPointerLock?.();}
  function toggleView(){const state=V.presentation();if(state.controlled===null)return false;if(state.view==='fps'){V.setView('classic');release();return true;}
   if(!renderer)renderer=root.DeadwallVertical175Render.createFPS(canvas);if(!renderer||renderer.lost){g.notify('WebGL indisponible : la vue classique reste jouable.','danger');return false;}return V.setView('fps');
  }
  view.addEventListener('click',toggleView);
  canvas.addEventListener('pointerdown',e=>{if(V.presentation().view!=='fps')return;e.preventDefault();e.stopPropagation();canvas.setPointerCapture?.(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};if(e.pointerType==='mouse')g.input.mouseDown=true;});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const q=V.moduleRef(V.presentation().controlled);if(!q)return;V.aim(q.m.yaw+(e.clientX-drag.x)*.004,q.m.pitch-(e.clientY-drag.y)*.004);drag.x=e.clientX;drag.y=e.clientY;});
  const end=()=>{drag=null;g.input.mouseDown=false;};for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,end);
  fire.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fire.setPointerCapture?.(e.pointerId);g.input.touchFire=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])fire.addEventListener(event,()=>{g.input.touchFire=false;});
  root.addEventListener('blur',end);
  const render=g.render.bind(g);g.render=(...args)=>{const result=render(...args),state=V.presentation(),b=V.target(),shown=g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver&&!g.frontier?.active()&&g.player&&!g.player.dead;
   bar.hidden=!shown||!b&&state.controlled===null;const p=V.pose();label.textContent=p.site?p.z.toFixed(0)+' m · PALIER '+(p.level+1):'ACCÈS INTÉRIEUR';access.textContent=p.site?'DESCENDRE':'MONTER';access.hidden=state.controlled!==null;view.hidden=leave.hidden=state.controlled===null;view.textContent=state.view==='fps'?'VUE CLASSIQUE':'VUE FPS';
   active=shown&&state.controlled!==null&&state.view==='fps';panel.hidden=!active;bar.classList.toggle('is-fps',active);
   if(active){if(!renderer?.draw(g)){V.setView('classic');release();g.notify('Contexte 3D perdu : retour à la vue classique.','danger');return result;}
    const q=V.moduleRef(state.controlled),text=q.def.name+' · '+q.m.ammo+'/'+q.def.capacity+' cartouches · '+Math.round(q.m.heat)+' % chaleur'+(q.m.overheated?' · REFROIDISSEMENT':'')+' · '+p.z.toFixed(0)+' m';if(text!==lastText){status.textContent=text;lastText=text;}
   }else if(drag)end();return result;
  };
  g.vertical175UI={toggleView,release,open};
 }
 const api={install};root.DeadwallVertical175UI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
