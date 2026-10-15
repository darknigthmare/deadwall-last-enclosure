/* In-game inspection of separate native layouts and network traversal.
 * No live campaign controller, stock, RNG, autosave or elapsed-time subscription.
 */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexLab173=api;if(typeof module==='object'&&module.exports)module.exports=api;if(typeof root.document?.addEventListener==='function')api.install(root.document);})(globalThis,function(root){'use strict';
 function mount(doc,owner,id){
  if(owner.querySelector('[data-native-lab173]'))return;
  const el=(t,text)=>{const n=doc.createElement(t);if(text!==undefined)n.textContent=text;return n;},host=el('section');host.dataset.nativeLab173=id;host.className='codex-plan165';
  host.append(el('h5','ARCHITECTURE NATIVE ET RÉSEAUX — LABORATOIRE'),el('p','Plans séparés de G8 : les pièces, répétitions, niveaux et jardins sont reconstruits. Les ouvrages utilisent un terrain d’essai explicite. Aucun nouveau lieu sur la carte, aucun carburant de campagne et aucune sauvegarde de partie modifiée.'));
  const controls=el('div');controls.className='codex-plan165-controls';
  function field(label,n){const l=el('label',label);l.append(n);controls.append(l);return n;}
  function option(n,value,label){const o=el('option',label);o.value=String(value);n.append(o);}
  const seed=field('Graine du laboratoire',el('input'));seed.type='number';seed.min=0;seed.max=4294967295;seed.value=17117;seed.dataset.native173='seed';
  const scene=field('Scène',el('select'));scene.dataset.native173='scene';for(const [v,t]of [['native','Pièces et jardin natifs'],['tunnel','Tunnel — traversée physique du tracé'],['interchange','Échangeur — quatre bretelles'],['port','Port — côte d’essai terre/eau']])option(scene,v,t);
  const level=field('Étage',el('select'));level.dataset.native173='level';option(level,0,'Rez-de-chaussée');
  const mode=field('Déplacement',el('select'));mode.dataset.native173='mode';for(const [v,t]of [['foot','À pied'],['vehicle','Véhicule'],['boat','Bateau']])option(mode,v,t);
  const build=el('button','CONSTRUIRE LA SCÈNE');build.type='button';build.dataset.native173='build';controls.append(build);
  const canvas=el('canvas');canvas.width=canvas.height=1;canvas.hidden=true;canvas.dataset.native173='canvas';canvas.setAttribute('role','img');
  const stateText=el('p');stateText.setAttribute('role','status');stateText.dataset.native173='status';
  const actions=el('div');actions.className='codex-plan165-controls';
  function button(name,tag,run){const b=el('button',name);b.type='button';b.dataset.native173=tag;b.addEventListener('click',()=>{try{run();render();}catch(e){stateText.textContent=e.message;}});actions.append(b);return b;}
  let model=null,electric=null,electricState=null,lastPower=null,inventory={fuel:3},net=null,traveler=null,closed=[],destination=null,saved=null;
  const P=root.DeadwallPower173,T=root.DeadwallTransit173,N=root.DeadwallCodexNative173,I=root.DeadwallSiteInfrastructure173;
  const fuel=button('VERSER 1 UNITÉ DU BANC','fuel',()=>{if(!electric)throw Error('Construisez une scène native.');const r=P.transferFuel(electric.network,electricState,inventory,'generator',1);electricState=r.state;inventory=r.inventory;});
  const toggle=button('BASCULER GROUPE ET ÉCLAIRAGE','power',()=>{if(!electric)throw Error('Circuit natif absent.');const on=!electricState.switches.generator;for(const node of electric.network.nodes)if(node.kind!=='junction')electricState=P.switchNode(electric.network,electricState,node.id,on);lastPower=null;});
  const step=button('SIMULER 10 SECONDES','step',()=>{if(electric){lastPower=P.step(electric.network,electricState,10);electricState=lastPower.state;}if(net){const r=I.advance(net,traveler,destination,10,mode.value==='vehicle'?14:mode.value==='boat'?6:3.5,closed);traveler=r.state;}});
  const block=button('FERMER / OUVRIR LES LIAISONS','block',()=>{if(!net)throw Error('Choisissez un ouvrage.');closed=closed.length?[]:net.edges.filter(e=>scene.value==='interchange'?e.kind==='ramp':scene.value==='tunnel'?e.id==='galleryWest':e.id==='yardAccess'||e.kind==='water').map(e=>e.id);});
  const save=button('MÉMORISER LE BANC','save',()=>{saved=electric?JSON.stringify(I.checkpoint(model,electricState,inventory)):JSON.stringify({scope:'transit-laboratory',state:traveler,closed,destination,topology:net.topology});});
  const restore=button('REPRENDRE LE BANC','restore',()=>{if(!saved)throw Error('Aucun état du banc mémorisé.');const raw=JSON.parse(saved);if(electric){const s=I.restore(model,raw);electricState=s.electric;inventory=s.inventory;lastPower=null;}else{if(raw.scope!=='transit-laboratory'||raw.topology!==net.topology)throw Error('Ouvrage différent.');traveler=I.transitState(net,raw.state);T.route(net,traveler.node,raw.destination,traveler.mode,raw.closed);closed=raw.closed;destination=raw.destination;}});
  function generate(){
   try{
    const n=Number(seed.value);if(!/^\d{1,10}$/.test(seed.value)||!Number.isInteger(n)||n<0||n>4294967295)throw Error('Graine entière requise.');
    saved=null;model=null;electric=null;electricState=null;lastPower=null;net=null;traveler=null;closed=[];inventory={fuel:3};
    if(scene.value==='native'){
     model=N.build(id,n);if(!model.supported){canvas.width=canvas.height=1;canvas.hidden=true;stateText.textContent='Architecture non créée : '+model.reason+'. Utilisez le scénario d’ouvrage pour examiner sa topologie, pas pour le déclarer implanté.';return;}
     electric=I.electrical(model);electricState=P.initial(electric.network);level.replaceChildren();for(const z of model.p.levels)option(level,z,z===0?'Rez-de-chaussée':'Niveau '+z);level.value='0';
    }else{
     net=scene.value==='tunnel'?T.tunnel():scene.value==='interchange'?T.interchange():T.port({a:[-150,0],b:[150,0],waterSide:'left'}).graph;
     const m=mode.value,start=scene.value==='port'?(m==='boat'?'waterWest':'gate'):'west';destination=scene.value==='port'?(m==='boat'?'waterEast':'quayEast'):scene.value==='tunnel'?'east':'south';traveler=I.beginTransit(net,start,m,m==='vehicle'?2.2:.64);
    }
    canvas.width=900;canvas.height=720;canvas.hidden=false;render();
   }catch(e){canvas.hidden=true;stateText.textContent=e.message;}
  }
  function render(){
   fuel.disabled=toggle.disabled=!electric;block.disabled=!net;mode.disabled=scene.value==='native';level.disabled=!electric;
   step.disabled=save.disabled=!(electric||net);restore.disabled=!saved;
   if(canvas.hidden)return;const c=canvas.getContext('2d');c.clearRect(0,0,900,720);c.fillStyle='#17271e';c.fillRect(0,0,900,720);
   const art=root.DEADWALL?.art;
   if(model){
    const z=Number(level.value),f=N.floor(model,z),d=N.details(model,z),scale=Math.min(850/model.plot.w,655/model.plot.h);
    c.save();c.translate(25,25);c.scale(scale,scale);c.fillStyle='#63715b';c.fillRect(0,0,model.plot.w,model.plot.h);
    for(const y of model.yards.filter(y=>y.z===z)){c.fillStyle=y.support==='ground'?'#718158':'#8b7959';c.fillRect(y.x,y.y,y.w,y.h);c.strokeStyle='#ccbb89';c.lineWidth=.12;c.strokeRect(y.x,y.y,y.w,y.h);}
    c.strokeStyle='#b8aa86';c.lineWidth=2;for(const p of model.yardPaths.filter(p=>p.z===z)){c.beginPath();p.points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();}
    c.fillStyle='#999584';c.fillRect(f.floor.x,f.floor.y,f.floor.w,f.floor.h);
    for(const room of f.rooms){c.fillStyle='#b1ac92';c.fillRect(room.x,room.y,room.w,room.h);}
    c.fillStyle='#36463c';for(const b of f.walls)c.fillRect(b.x,b.y,b.w,b.h);
    for(const o of [...d.interior,...d.outdoor])root.DeadwallSeedDetailArt157.draw(c,o,{art,seed:model.seed});
    for(const s of f.stairs){c.fillStyle='#8a9b93';c.fillRect(s.x,s.y,s.w,s.h);c.strokeStyle='#394d43';c.lineWidth=.08;for(let i=1;i<8;i++){c.beginPath();c.moveTo(s.x,s.y+s.h*i/8);c.lineTo(s.x+s.w,s.y+s.h*i/8);c.stroke();}}
    for(const light of electric.fixtures.filter(l=>l.z===z)){const powered=!!lastPower?.loads[light.id]?.powered;c.fillStyle=powered?'rgba(247,221,151,.30)':'#495a48';c.beginPath();c.arc(light.x,light.y,powered?2.2:.22,0,Math.PI*2);c.fill();}
    c.restore();c.font='13px sans-serif';c.fillStyle='#f1e4bf';
    for(const [i,room]of f.rooms.entries())c.fillText((i+1)+'. '+room.name,25+(room.x+.3)*scale,25+(room.y+.8)*scale,Math.max(30,room.w*scale-4));
    const lit=Object.values(lastPower?.loads||{}).filter(l=>l.powered).length;stateText.textContent=model.summary.indoor+' pièces, '+model.summary.outdoor+' extérieurs hors coque, '+model.summary.levels+' niveaux et '+model.summary.stairs+' liaisons d’escalier. '+d.interior.length+' équipements sur cet étage. Éclairage : '+lit+'/'+electric.fixtures.length+'. Carburant groupe : '+electricState.fuel.generator.toFixed(5)+' ; réserve du banc : '+inventory.fuel+'. '+model.issues.map(i=>i.reason==='plot-exceeds-source-envelope'?'Emprise supérieure à la parcelle source : implantation refusée tant que le terrain ne convient pas.':i.reason==='level-inferred'?'Un niveau est déduit pour une source non renseignée.':'').filter(Boolean).slice(0,3).join(' ');
   }else if(net){
    const points=net.edges.flatMap(e=>e.points),minX=Math.min(...points.map(p=>p[0]))-20,maxX=Math.max(...points.map(p=>p[0]))+20,minY=Math.min(...points.map(p=>p[1]))-30,maxY=Math.max(...points.map(p=>p[1]))+30,scale=Math.min(850/(maxX-minX),650/(maxY-minY));
    c.save();c.translate(25,25);c.scale(scale,scale);c.translate(-minX,-minY);
    for(const e of net.edges){c.strokeStyle=closed.includes(e.id)?'#b76d59':e.kind==='water'?'#6498a1':e.kind==='ramp'?'#c0aa70':'#8c9989';c.lineWidth=e.width;c.beginPath();e.points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
    for(const n of net.nodes){c.fillStyle='#e7d1a2';c.beginPath();c.arc(n.x,n.y,2,0,Math.PI*2);c.fill();}
    const pos=I.position(net,traveler);c.fillStyle='#f5e5b9';c.beginPath();c.arc(pos.x,pos.y,4,0,Math.PI*2);c.fill();c.restore();
    stateText.textContent='Ouvrage d’essai '+scene.value+' · '+traveler.mode+' · niveau continu '+pos.level.toFixed(2)+' · destination '+destination+' · '+(closed.length?'liaisons fermées':'liaisons ouvertes')+'. Un croisement sans borne commune ne crée aucun raccord. Le port utilise une côte d’essai, pas une côte de la campagne.';
   }
   canvas.setAttribute('aria-label',stateText.textContent);
  }
  build.addEventListener('click',generate);level.addEventListener('change',()=>{try{render();}catch(e){stateText.textContent=e.message;}});scene.addEventListener('change',generate);mode.addEventListener('change',generate);
  host.addEventListener('keydown',e=>{if(!['Escape','Tab'].includes(e.key))e.stopPropagation();});
  owner.addEventListener('toggle',()=>{if(!owner.open){canvas.width=canvas.height=1;canvas.hidden=true;model=electric=electricState=lastPower=net=traveler=saved=null;}});
  host.append(controls,actions,stateText,canvas);owner.append(host);
 }
 const docs=new WeakSet();function install(doc){if(typeof doc?.addEventListener!=='function'||docs.has(doc))return false;docs.add(doc);doc.addEventListener('toggle',e=>{const d=e.target;if(d?.tagName!=='DETAILS'||!d.open)return;const card=d.parentElement;if(card?.tagName!=='ARTICLE')return;const id=/^programme-(DW-\d{4})$/.exec(card.dataset?.codexId||'')?.[1];if(id&&d.dataset?.codexSource159===card.dataset.codexId)queueMicrotask(()=>{if(d.isConnected&&d.open)mount(doc,d,id);});},true);return true;}
 return Object.freeze({mount,install});
});
