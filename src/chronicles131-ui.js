(function(root){
'use strict';
function install(g,doc){
 if(!g?.chronicles131||!doc||g.chronicles131UI)return null;
 const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.classList.add(cls);if(text)n.textContent=text;return n;};
 const scene=el('aside','chronicles-scene');scene.classList.add('hidden');scene.setAttribute('aria-label','Séquence de terrain');
 const picture=el('canvas','chronicles-picture');picture.width=180;picture.height=100;picture.setAttribute('aria-label','Extrait de la carte active');
 const text=el('div','chronicles-scene-copy'),label=el('small',null,'LIAISON DE TERRAIN'),title=el('strong'),line=el('p');
 line.setAttribute('role','status');line.setAttribute('aria-live','polite');line.setAttribute('aria-atomic','true');
 const dismiss=el('button',null,'Passer');dismiss.type='button';dismiss.setAttribute('aria-label','Passer la séquence de terrain');
 for(const n of [label,title,line])text.appendChild(n);for(const n of [picture,text,dismiss])scene.appendChild(n);doc.body.appendChild(scene);
 let identity='',lastLine='';
 function hide(){scene.classList.add('hidden');scene.inert=true;if(scene.contains(doc.activeElement)&&!g.activeOverlay&&!g.paused)g.canvas.focus({preventScroll:true});}
 dismiss.addEventListener('click',()=>{if(scene.inert)return;g.chronicles131.dismissScene();hide();});
 function refresh(){
  // A cinematic card never controls the camera, the clock or the commander's inputs.
  const s=g.chronicles131.scene();
  const visible=!!s&&g.state==='playing'&&!g.gameOver&&!g.player.dead&&!g.activeOverlay&&!g.paused;
  if(!visible){hide();return;}scene.classList.remove('hidden');scene.inert=false;
  scene.classList.toggle('chronicles-static',!!g.settings?.reducedMotion);
  const key=g.world.seed+':'+s.id;
  if(identity!==key){identity=key;title.textContent=s.title;lastLine='';const c=picture.getContext('2d');if(c&&g.minimap){c.clearRect(0,0,picture.width,picture.height);c.fillStyle='#101a19';c.fillRect(0,0,picture.width,picture.height);c.drawImage(g.minimap,0,0,picture.width,picture.height);c.strokeStyle='#c9b783';c.lineWidth=2;c.strokeRect(7,7,picture.width-14,picture.height-14);}}
  const sentence=s.lines[Math.min(s.lines.length-1,Math.floor(s.progress*s.lines.length))];if(sentence!==lastLine){lastLine=sentence;line.textContent=sentence;}
 }
 const sync=g.syncOverlayFocus.bind(g);g.syncOverlayFocus=(...args)=>{const result=sync(...args);refresh();return result;};
 const update=g.updateUI.bind(g);g.updateUI=(...args)=>{const result=update(...args);refresh();return result;};
 const back=g.returnToMenu.bind(g);g.returnToMenu=(...args)=>{hide();identity='';return back(...args);};
 const api=Object.freeze({refresh,element:scene});g.chronicles131UI=api;return api;
}
const api={install};root.DeadwallChronicles131UI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.DEADWALL&&root.document)install(root.DEADWALL,root.document);
})(globalThis);
