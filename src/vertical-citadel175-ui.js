(function(root){'use strict';
 function install(g,doc=root.document){if(!g?.vertical175||!doc||g.vertical175UI)return;const V=g.vertical175,R=root.DeadwallCore.VerticalCitadel175;
  const element=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;};
  const bar=element('div');bar.id='vertical175bar';bar.hidden=true;bar.setAttribute('aria-label','Accès à la citadelle verticale');
  const label=element('span'),access=element('button','MONTER'),dossier=element('button','CITADELLE'),view=element('button','VUE FPS'),leave=element('button','QUITTER L’AFFÛT');
  access.id='vertical175access';dossier.id='vertical175dossier';view.id='vertical175view';leave.id='vertical175leave';for(const n of [label,access,dossier,view,leave])bar.appendChild(n);doc.body.appendChild(bar);
  const panel=element('div');panel.id='vertical175fps';panel.hidden=true;const canvas=element('canvas'),cross=element('div'),status=element('output'),fire=element('button','TIR');canvas.id='vertical175canvas';cross.className='v175-cross';status.id='vertical175status';fire.id='vertical175fire';canvas.setAttribute('aria-label','Vue 3D depuis l’affût ; glissez pour viser. Souris : clic gauche pour tirer, clic droit pour viser sans tirer.');for(const n of [canvas,cross,status,fire])panel.appendChild(n);doc.body.appendChild(panel);
  let renderer=null,drag=null,firePointer=null,firePointerType=null,fireMouseHeld=false,lastText='',active=false;
  const fireKeys=new Set();
  function discardRenderer(){const previous=renderer;renderer=null;try{previous?.dispose();}catch{/* Recovery keeps the simulation and classic view available. */}}
  const canInteract=()=>g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver&&!doc.hidden&&!g.frontier?.active?.()&&g.player&&!g.player.dead&&V.presentation().view==='fps'&&V.presentation().controlled!=null;
  const syncFire=()=>{g.input.touchFire=(firePointer!==null&&(firePointerType!=='mouse'||fireMouseHeld))||fireKeys.size>0;};
  const open=()=>g.expansionUI?.open('vertical175');dossier.addEventListener('click',open);
  access.addEventListener('click',()=>{const b=V.target();if(!b)return;const p=V.pose();V.access(b.id,p.site?(p.level>0?p.level-1:-1):0);});
  leave.addEventListener('click',()=>V.release());
  function release(){halt();panel.hidden=true;if(doc.pointerLockElement===canvas)doc.exitPointerLock?.();}
  function toggleView(){const state=V.presentation();if(state.controlled==null||g.state!=='playing'||g.paused||g.activeOverlay||g.gameOver||!g.player||g.player.dead||doc.hidden||g.frontier?.active?.())return false;if(state.view==='fps'){V.setView('classic');release();return true;}
   if(renderer?.lost)discardRenderer();if(!renderer)try{renderer=root.DeadwallVertical175Render.createFPS(canvas);}catch{renderer=null;}if(!renderer||renderer.lost){g.notify('WebGL indisponible : la vue classique reste jouable.','danger');return false;}return V.setView('fps');
  }
  view.addEventListener('click',toggleView);
  canvas.addEventListener('contextmenu',e=>{if(canInteract())e.preventDefault();});
  canvas.addEventListener('pointerdown',e=>{
   if(!canInteract()||drag&&drag.id!==e.pointerId)return;
   if(e.pointerType==='mouse'&&e.button!==0&&e.button!==2)return;
   e.preventDefault();e.stopPropagation();canvas.setPointerCapture?.(e.pointerId);drag={id:e.pointerId,type:e.pointerType,x:e.clientX,y:e.clientY};
   if(e.pointerType==='mouse')g.input.mouseDown=e.button===0;
  });
  canvas.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId||!canInteract())return;const q=V.moduleRef(V.presentation().controlled);if(!q)return;
   V.aim(q.m.yaw+(e.clientX-drag.x)*.004,q.m.pitch-(e.clientY-drag.y)*.004);drag.x=e.clientX;drag.y=e.clientY;
   if(e.pointerType==='mouse')g.input.mouseDown=!!(e.buttons&1);
  });
  const end=e=>{if(e&&(!drag||drag.id!==e.pointerId))return;drag=null;g.input.mouseDown=false;};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,end);
  fire.addEventListener('pointerdown',e=>{
   if(!canInteract()||firePointer!==null||e.pointerType==='mouse'&&e.button!==0)return;
   e.preventDefault();e.stopPropagation();fire.setPointerCapture?.(e.pointerId);firePointer=e.pointerId;firePointerType=e.pointerType;fireMouseHeld=e.pointerType==='mouse';syncFire();
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])fire.addEventListener(event,e=>{if(e.pointerId===firePointer){firePointer=null;firePointerType=null;fireMouseHeld=false;syncFire();}});
  // A chord changes buttons through pointermove, even without cursor movement.
  // Compatibility mouse events may be suppressed by pointerdown.preventDefault().
  fire.addEventListener('pointermove',e=>{
   if(e.pointerId!==firePointer||firePointerType!=='mouse'||!canInteract())return;
   fireMouseHeld=!!(e.buttons&1);syncFire();
  });
  const releaseCapture=(node,id)=>{if(id!=null&&node.hasPointerCapture?.(id))try{node.releasePointerCapture(id);}catch{}};
  const halt=()=>{const aim=drag?.id,trigger=firePointer;end();firePointer=null;firePointerType=null;fireMouseHeld=false;fireKeys.clear();syncFire();releaseCapture(canvas,aim);releaseCapture(fire,trigger);};root.addEventListener('blur',halt);
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)halt();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();halt();V.setView('classic');release();});
  canvas.addEventListener('webglcontextrestored',()=>{discardRenderer();halt();g.notify('Rendu 3D rétabli : VUE FPS est de nouveau disponible.','good');});
  fire.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(canInteract()){fireKeys.add(e.code||e.key);syncFire();}}});
  fire.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();fireKeys.delete(e.code||e.key);syncFire();}});fire.addEventListener('blur',halt);
  let classicPaints=0,fpsPaints=0,auxiliaryFrame=0;
  const render=g.render.bind(g),classic=args=>{classicPaints++;return render(...args);};
  g.render=(...args)=>{let result;const state=V.presentation(),b=V.target(),shown=g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver&&!doc.hidden&&!g.frontier?.active()&&g.player&&!g.player.dead;
   bar.hidden=!shown||!b&&state.controlled===null&&!V.network.carrying()&&!V.network.hasNearbyCrate();const p=V.pose();label.textContent=(p.site?p.z.toFixed(0)+' m · PALIER '+(p.level+1):'ACCÈS INTÉRIEUR')+(V.network.carrying()?' · CHARGE PORTÉE':'');access.textContent=p.site?'DESCENDRE':'MONTER';access.hidden=state.controlled!==null||!b;view.hidden=leave.hidden=state.controlled===null;view.textContent=state.view==='fps'?'VUE CLASSIQUE':'VUE FPS';
   const wasActive=active;active=shown&&state.controlled!==null&&state.view==='fps';panel.hidden=!active;bar.classList.toggle('is-fps',active);
   // Classic access shares the contextual layout; only the fullscreen FPS bar floats.
   const host=active?doc.body:g.hud135?.regions().context||doc.body;if(bar.parentNode!==host)host.appendChild(bar);
   if(active){
    if(auxiliaryFrame++%3===0)g.fieldcraftUI?.refresh?.();
    let drawn=false;try{drawn=renderer?.draw(g)===true;}catch{drawn=false;}
    if(!drawn){discardRenderer();V.setView('classic');release();active=false;bar.classList.remove('is-fps');const fallbackHost=g.hud135?.regions().context||doc.body;if(bar.parentNode!==fallbackHost)fallbackHost.appendChild(bar);view.textContent='VUE FPS';result=classic(args);g.notify('Contexte 3D perdu : retour à la vue classique.','danger');return result;}
    fpsPaints++;
    const q=V.moduleRef(state.controlled),text=q.def.name+' · '+q.m.ammo+'/'+q.def.capacity+' cartouches · '+Math.round(q.m.heat)+' % chaleur'+(q.m.overheated?' · REFROIDISSEMENT':'')+' · '+p.z.toFixed(0)+' m';if(text!==lastText){status.textContent=text;lastText=text;}
   }else{if(wasActive||drag||firePointer!==null||fireKeys.size)halt();result=classic(args);}return result;
  };
  g.vertical175UI={toggleView,release,open,diagnostics:()=>renderer?{...renderer.diagnostics?.(),classicPaints,fpsPaints}:null};
 }
 const api={install};root.DeadwallVertical175UI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
