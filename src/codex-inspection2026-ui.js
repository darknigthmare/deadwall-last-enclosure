/* Authoring inspection inside the existing Guide. No campaign state or game loop. */
(function(root, factory) {
  'use strict';
  const api = factory(root);
  root.DeadwallCodexInspectionUI2026 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis, function(root) {
  'use strict';
  const mounted = new WeakMap();
  function transportEdges(author) {
    const network = author?.transportNetwork;
    if (network === undefined) return [];
    if (!network || network.scope !== 'author-transport-layout-not-operational' || network.operational !== false || network.inspectionAccess !== 'closed' ||
        !Array.isArray(network.nodes) || !Array.isArray(network.edges)) throw Error('Voies de transport sans statut fermé explicite.');
    const nodes = new Map(), ids = new Set();
    for (const n of network.nodes) {
      if (!n || typeof n.id !== 'string' || !n.id.trim() || nodes.has(n.id) || ![n.x,n.y,n.z].every(Number.isFinite) ||
          (n.level === null ? n.kind !== 'ramp-point' : !Number.isInteger(n.level) || n.level < 0)) throw Error('Point de voie invalide.');
      nodes.set(n.id, n);
    }
    const result = network.edges.map(e => {
      if (!e || typeof e !== 'object') throw Error('Tracé de voie invalide.');
      const a = nodes.get(e.from), b = nodes.get(e.to);
      const ramp = e.kind === 'ramp' || e.kind === 'approach-ramp';
      if (!a || !b || a === b || typeof e.id !== 'string' || !e.id.trim() || ids.has(e.id) || !Number.isFinite(e.widthM) || e.widthM <= 0 ||
          Math.hypot(a.x-b.x,a.y-b.y) <= 1e-8 ||
          !['road','rail','ramp','runway','taxiway','apron'].includes(e.mode) ||
          (ramp ? e.level !== null || Math.abs(a.z-b.z) <= 1e-8 ||
            (e.kind === 'ramp' ? e.mode !== 'ramp' : !['road','rail'].includes(e.mode)) :
            e.level === null || e.mode === 'ramp' || e.level !== a.level || e.level !== b.level || Math.abs(a.z-b.z)>1e-8)) throw Error('Tracé de voie incohérent.');
      ids.add(e.id);
      return {id: e.id, a: {x: a.x,y: a.y,z: a.z}, b: {x: b.x,y: b.y,z: b.z}, widthM: e.widthM,
        mode: e.mode, kind: e.kind, level: e.level, elevationM: (a.z + b.z) / 2};
    });
    return result.sort((a,b) => a.elevationM - b.elevationM || a.id.localeCompare(b.id));
  }
  function mount(doc, owner) {
    if (!owner || mounted.has(owner)) return mounted.get(owner) || null;
    const el = (tag, text, cls) => {
      const n = doc.createElement(tag);
      if (text !== undefined) n.textContent = text;
      if (cls) n.className = cls;
      return n;
    };
    const host = el('details', undefined, 'codex-inspection2026');
    host.dataset.codexInspection2026 = 'world';
    host.append(el('summary', 'CODEX MONDIAL — INSPECTER LES NOUVEAUX PLANS'));
    const content = el('div', undefined, 'inspection2026-content');
    host.append(content);
    content.append(el('p', 'Parcourez les pièces modélisées, vérifiez les proportions et les passages. Les emprises réservées restent fermées. Ces plans de travail ne sont pas encore implantés dans la campagne.', 'inspection2026-intro'));
    const controls = el('div', undefined, 'inspection2026-controls');
    function field(name, node) { const label = el('label', name); label.append(node); controls.append(label); return node; }
    function option(select, value, text) { const n = el('option', text); n.value = String(value); select.append(n); }
    const type = field('Lieu', el('select'));
    type.dataset.inspection2026 = 'type';
    const layouts = root.DeadwallCodexLayouts2026;
    if (!layouts) return null;
    for (const t of layouts.typologies) option(type, t.id, t.name + (t.available ? ' · 50 plans' : ' · à concevoir'));
    type.value = 'EXT-MONDE-T065';
    const variant = field('Variante', el('select'));
    variant.dataset.inspection2026 = 'variant';
    for (let i = 1; i <= 50; i++) option(variant, i, String(i).padStart(2, '0') + ' / 50');
    const floor = field('Étage observé', el('select'));
    floor.dataset.inspection2026 = 'floor';
    const view = field('Vue', el('select'));
    view.dataset.inspection2026 = 'view';
    option(view, 'plan', 'Plan général'); option(view, 'walk', 'À hauteur de déplacement');
    const zoom = field('Champ visible', el('select'));
    for (const m of [16, 32, 64, 128]) option(zoom, m, m + ' mètres');
    zoom.value = '32';
    const load = el('button', 'OUVRIR LE PLAN'); load.type = 'button'; load.dataset.inspection2026 = 'build'; controls.append(load);
    content.append(controls);
    const transportInfo = el('p', '', 'inspection2026-help');
    transportInfo.dataset.inspection2026 = 'transport'; transportInfo.hidden = true; content.append(transportInfo);
    const status = el('p', 'Choisissez un lieu pour commencer.', 'inspection2026-status');
    status.setAttribute('role', 'status'); status.dataset.inspection2026 = 'status';
    const canvas = el('canvas'); canvas.width = 1100; canvas.height = 680;
    canvas.dataset.inspection2026 = 'canvas'; canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Plan métrique. Flèches ou ZQSD / WASD pour marcher ; E pour utiliser un passage entre niveaux.');
    const walk = el('div', undefined, 'inspection2026-walk');
    function button(label, action, fn) {
      const n = el('button', label); n.type = 'button'; n.dataset.inspection2026 = action;
      n.addEventListener('click', () => { try { fn(); render(); } catch (e) { status.textContent = e.message; } });
      walk.append(n); return n;
    }
    button('↑ AVANCER', 'north', () => move(0, -.5));
    button('← GAUCHE', 'west', () => move(-.5, 0));
    button('↓ RECULER', 'south', () => move(0, .5));
    button('→ DROITE', 'east', () => move(.5, 0));
    const transitions = el('select'); transitions.dataset.inspection2026 = 'transition'; transitions.setAttribute('aria-label', 'Passage entre niveaux à proximité'); walk.append(transitions);
    const useTransition = button('EMPRUNTER LE PASSAGE', 'use-transition', () => {
      if (!session) return;
      const result = root.DeadwallCodexInspection2026.transition(session, transitions.value);
      session = result.session; note = result.reason || 'Niveau rejoint par le passage.'; floor.value = String(session.state.pose.level);
    });
    button('REVENIR À L’ENTRÉE DU PLAN', 'reset', () => { if (session) { session = root.DeadwallCodexInspection2026.create(type.value, Number(variant.value)); floor.value = String(session.state.pose.level); note = 'Inspection recommencée.'; } });
    const remember = button('MÉMORISER L’INSPECTION', 'remember', () => { if (session) { checkpoint = root.DeadwallCodexInspection2026.snapshot(session); note = 'Position et pièces visitées mémorisées pour ce plan.'; } });
    const resume = button('REPRENDRE L’INSPECTION', 'resume', () => { if (session && checkpoint) { session = root.DeadwallCodexInspection2026.restore(type.value, Number(variant.value), checkpoint); floor.value = String(session.state.pose.level); note = 'Inspection reprise.'; } });
    const info = el('div', undefined, 'inspection2026-info');
    const roomInfo = el('section'), limitations = el('section'), refs = el('section');
    roomInfo.dataset.inspection2026 = 'detail';
    info.append(roomInfo, limitations, refs);
    content.append(status, canvas, walk, el('p', 'Déplacement : flèches, ZQSD ou WASD dans le plan. E : escalier ou échelle à proximité. Le choix d’un étage change uniquement la vue générale. La mémorisation concerne cette inspection.', 'inspection2026-help'), info);
    let session = null, checkpoint = null, note = '', selected = null, transform = null, closedRoutes = [];
    function generate() {
      session = null; checkpoint = null; selected = null; note = ''; closedRoutes = [];
      transportInfo.hidden = true; transportInfo.textContent = '';
      try {
        session = root.DeadwallCodexInspection2026.create(type.value, Number(variant.value));
        closedRoutes = transportEdges(session.author);
        if (closedRoutes.length) {
          transportInfo.hidden = false;
          transportInfo.textContent = closedRoutes.length + ' tronçons de voies représentés à leur largeur au sol. Ces ouvrages restent fermés : ni conduite, ni trains, ni avions en circulation. Les accès piétons inspectables sont distincts.';
        }
        floor.replaceChildren();
        for (const l of session.scene.levels) option(floor, l.index, 'Niveau ' + l.index + ' · altitude ' + l.elevationM.toFixed(2) + ' m');
        floor.value = String(session.state.pose.level);
        limitations.replaceChildren(el('h5', 'PARTIES ENCORE À RÉALISER'));
        const ul = el('ul');
        for (const line of session.limits) ul.append(el('li', line));
        limitations.append(ul);
        refs.replaceChildren(el('h5', 'RÉFÉRENCES ET MESURES'));
        const ids = session.author.sourceIds || [session.author.reference?.source];
        for (const source of layouts.reference().sources.filter(s => ids.includes(s.id))) {
          const p = el('p'), a = el('a', source.title || source.name || source.id);
          a.href = source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; p.append(a, el('span', ' — ' + source.scope)); refs.append(p);
        }
        refs.append(el('p', 'Les cotes publiées et les compositions créées pour DEADWALL sont distinguées dans les sources. Le diamètre du gabarit piéton est de 0,64 m au sol.'));
      } catch (e) { session = null; closedRoutes = []; note = e.message; }
      render();
    }
    function move(dx, dy) {
      if (!session) return;
      const result = root.DeadwallCodexInspection2026.move(session, dx, dy);
      session = result.session; note = result.blocked ? 'Passage arrêté par un mur, un équipement ou une limite de sol.' : '';
      view.value = 'walk'; floor.value = String(session.state.pose.level);
    }
    function currentRoom() {
      if (!session) return null;
      const p = session.state.pose;
      return session.scene.rooms.find(r => r.level === p.level && p.x >= r.x && p.x <= r.x+r.w && p.y >= r.y && p.y <= r.y+r.h) || null;
    }
    function render() {
      const c = canvas.getContext('2d');
      c.setTransform(1,0,0,1,0,0); c.fillStyle = '#101a19'; c.fillRect(0,0,canvas.width,canvas.height);
      remember.disabled = !session; resume.disabled = !session || !checkpoint;
      floor.disabled = !session || view.value === 'walk'; zoom.disabled = view.value !== 'walk';
      if (!session) {
        status.textContent = note || 'Ouvrez un plan pour vérifier ses accès.';
        transitions.replaceChildren(); useTransition.disabled = true;
        roomInfo.replaceChildren(el('h5', 'PLAN NON PRODUIT'), el('p', 'Cette cible reste dans l’Excel de production. Aucun bâtiment de remplacement n’est généré.'));
        limitations.replaceChildren(); refs.replaceChildren(); return;
      }
      const s = session.scene, p = session.state.pose, level = view.value === 'walk' ? p.level : Number(floor.value);
      const b = s.bounds, scale = view.value === 'walk' ? canvas.width/Number(zoom.value) : Math.min((canvas.width-80)/b.w,(canvas.height-80)/b.h);
      const tx = view.value === 'walk' ? canvas.width/2-p.x*scale : (canvas.width-b.w*scale)/2-b.x*scale;
      const ty = view.value === 'walk' ? canvas.height/2-p.y*scale : (canvas.height-b.h*scale)/2-b.y*scale;
      transform = {scale,tx,ty,level};
      c.save(); c.translate(tx,ty); c.scale(scale,scale);
      const box = (r, color) => { c.fillStyle=color; c.fillRect(r.x,r.y,r.w,r.h); };
      box(b, '#263e39');
      const step = scale>15?1:scale>2?10:100;
      c.strokeStyle='rgba(205,224,207,.10)'; c.lineWidth=1/scale;
      const x0=Math.max(b.x,Math.floor(-tx/scale/step)*step), x1=Math.min(b.x+b.w,(canvas.width-tx)/scale);
      const y0=Math.max(b.y,Math.floor(-ty/scale/step)*step), y1=Math.min(b.y+b.h,(canvas.height-ty)/scale);
      for(let x=x0;x<=x1;x+=step){c.beginPath();c.moveTo(x,y0);c.lineTo(x,y1);c.stroke();}
      for(let y=y0;y<=y1;y+=step){c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();}
      for(const r of s.surfaces.filter(o=>o.level===level))box(r,'#718173');
      for(const area of (s.areas||[]).filter(o=>o.level===level)){
        const kind=area.kind.toLowerCase();
        const planted=/garden|crop|orchard|vine|pasture|field|vegetable|culture|potager|verger/.test(kind);
        box(area,planted?'#526d43':/terrace|patio/.test(kind)?'#a79878':'#858573');
        c.strokeStyle='rgba(36,57,35,.35)';c.lineWidth=.08;
        if(planted)for(let y=area.y+1;y<area.y+area.h;y+=2){c.beginPath();c.moveTo(area.x,y);c.lineTo(area.x+area.w,y);c.stroke();}
      }
      if(session.author.network){
        const nodes=new Map(session.author.network.nodes.map(n=>[n.id,n]));
        for(const edge of session.author.network.edges){
          if(edge.level!==level)continue;
          const a=nodes.get(edge.from),b=nodes.get(edge.to);if(!a||!b)continue;
          c.strokeStyle=edge.mode==='service'?'#9b947e':'#c1b392';c.lineWidth=edge.widthM;c.lineCap='butt';
          c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
        }
      }
      for(const r of s.rooms.filter(o=>o.level===level))box(r,r.kind==='circulation'?'#9c9c83':'#b9b498');
      const closed=s.solids.filter(o=>o.level===level && !o.roomId && o.accessible===false);
      for(const r of closed)box(r,/pool|basin|water|lagoon|clarifier/.test(r.kind)?'#3c707e':/fence|barrier/.test(r.kind)?'#c0b796':'#465652');
      if(level===0)for(const edge of closedRoutes){
        c.lineCap='butt';c.setLineDash([]);
        if(edge.elevationM>0){c.strokeStyle='#25322e';c.lineWidth=edge.widthM+2/scale;c.beginPath();c.moveTo(edge.a.x,edge.a.y);c.lineTo(edge.b.x,edge.b.y);c.stroke();}
        c.strokeStyle={road:'#b5a789',rail:'#b5bab0',ramp:'#c0b08e',runway:'#879394',taxiway:'#ac9a65',apron:'#9e997f'}[edge.mode];
        c.lineWidth=edge.widthM;c.beginPath();c.moveTo(edge.a.x,edge.a.y);c.lineTo(edge.b.x,edge.b.y);c.stroke();
        if(edge.mode==='road'||edge.mode==='ramp'||edge.mode==='runway'){
          c.strokeStyle=edge.mode==='runway'?'#e9e9d9':'#e5d4a7';c.lineWidth=edge.mode==='runway'?.8:.15;c.setLineDash(edge.mode==='runway'?[20,20]:[3,3]);
          c.beginPath();c.moveTo(edge.a.x,edge.a.y);c.lineTo(edge.b.x,edge.b.y);c.stroke();c.setLineDash([]);
        }
      }
      for(const r of s.walls.filter(o=>o.level===level))box(r,'#202d2a');
      for(const prop of session.furnishing.props.filter(o=>o.level===level)){
        if(!root.DeadwallCodexPlanArt204?.drawProp(c,prop,scale)){
          box(prop,prop.lootEligible?'#9c734a':'#65716c');c.strokeStyle='#27302d';c.lineWidth=Math.max(.035,.7/scale);c.strokeRect(prop.x,prop.y,prop.w,prop.h);
        }
      }
      for(const door of s.portals.filter(o=>o.level===level)){c.fillStyle='#deb978';c.beginPath();c.arc(door.x,door.y,.12,0,Math.PI*2);c.fill();}
      for(const t of s.transitions)for(const end of [t.a,t.b])if(end.level===level){c.strokeStyle='#5a3440';c.lineWidth=.1;c.strokeRect(end.x-.45,end.y-.45,.9,.9);}
      if(p.level===level){c.fillStyle='#e9c775';c.beginPath();c.arc(p.x,p.y,.32,0,Math.PI*2);c.fill();c.strokeStyle='#202c28';c.lineWidth=.055;c.stroke();}
      const chosen = selected && [...s.rooms,...(s.areas||[]),...closed].find(r=>r.id===selected&&r.level===level);
      if(chosen){c.strokeStyle='#f2cc7e';c.lineWidth=2/scale;c.strokeRect(chosen.x,chosen.y,chosen.w,chosen.h);}
      c.restore();
      // Draw labels in canvas pixels. Narrow equipment keeps its full name in
      // the room panel instead of squeezing text into an unreadable footprint.
      c.font='11px sans-serif';c.fillStyle='#243c34';
      const closedNames={'cargo-hold':'Cale réservée','sealed-cargo-tank':'Citerne fermée','working-deck':'Pont de travail réservé'};
      const nameOf=r=>r.name||closedNames[r.kind]||r.kind||'Circulation';
      for(const r of [...(s.areas||[]),...s.rooms,...closed].filter(o=>o.level===level)){
        const label=nameOf(r);
        if(r.h*scale>30&&c.measureText(label).width<(r.w-.3)*scale)c.fillText(label,tx+(r.x+.15)*scale,ty+r.y*scale+15);
      }
      if(scale>20){c.font='9px sans-serif';c.fillStyle='#e9e2cc';
        for(const prop of session.furnishing.props.filter(o=>o.level===level)){
          const label=prop.name||prop.kind;
          if(c.measureText(label).width<=prop.w*scale)c.fillText(label,tx+prop.x*scale,ty+prop.y*scale-3);
        }
      }
      const bar=scale>20?2:scale>5?10:scale>1?50:500;
      c.strokeStyle='#e8d8ad';c.lineWidth=2;c.beginPath();c.moveTo(24,canvas.height-27);c.lineTo(24+bar*scale,canvas.height-27);c.stroke();
      c.font='13px sans-serif';c.fillStyle='#eee3c6';c.fillText(bar+' m · sol',24,canvas.height-37);
      const available=root.DeadwallCodexInspection2026.nearTransitions(session);
      const previous=transitions.value;transitions.replaceChildren();
      for(const t of available)option(transitions,t.id,(t.kind==='ladder'?'Échelle':'Escalier')+' · niveau '+(t.from===p.level?t.to:t.from));
      if(available.some(t=>t.id===previous))transitions.value=previous;
      useTransition.disabled=!available.length;
      const currentArea=(s.areas||[]).filter(a=>a.level===p.level&&p.x>=a.x&&p.x<=a.x+a.w&&p.y>=a.y&&p.y<=a.y+a.h).sort((a,b)=>a.w*a.h-b.w*b.h)[0];
      const room=chosen||(level===p.level?(currentRoom()||currentArea):null), props=room?session.furnishing.props.filter(o=>o.roomId===room.id):[];
      roomInfo.replaceChildren(el('h5',room?nameOf(room):'EXTÉRIEUR / CIRCULATION'));
      if(room){roomInfo.append(el('p',room.w.toFixed(2)+' × '+room.h.toFixed(2)+' m · '+(room.w*room.h).toFixed(1)+' m²'),el('p',props.length?props.map(o=>o.name+' ('+o.w.toFixed(2)+' × '+o.h.toFixed(2)+' m)').join(' ; '):'Aucun équipement placé dans cette zone.'));
        if(room.accessible===false){
          const water=/pool|basin|water|lagoon|clarifier/.test(room.kind);
          roomInfo.append(el('p',water?'Eau : volume fermé et infranchissable. La profondeur, les franchissements et la navigation restent à qualifier.':'Volume fermé et infranchissable.'+(Number.isFinite(room.maxHeightM)?' Hauteur auteur : '+room.maxHeightM.toFixed(2)+' m.':'')+' Son intérieur reste à produire.'));
        }
        if(room.inspectionOnly)roomInfo.append(el('p','Aménagement extérieur auteur. Les ressources et services de campagne restent à intégrer.'));
        const rejected=session.furnishing.unplaced.filter(o=>o.roomId===room.id);if(rejected.length)roomInfo.append(el('p',rejected.length+' prescriptions non posées : espace ou dégagement insuffisant.'));
      }else roomInfo.append(el('p','Cliquez une pièce, un jardin, une cour ou un volume fermé pour examiner ses dimensions et son aménagement.'));
      status.textContent=session.author.id+' · '+b.w.toFixed(1)+' × '+b.h.toFixed(1)+' m · '+s.levels.length+(s.levels.length===1?' niveau modélisé · ':' niveaux modélisés · ')+session.furnishing.props.length+' équipements · '+session.state.visitedRooms.length+' pièces visitées. '+note;
      canvas.dataset.level=String(p.level);canvas.dataset.plan=session.author.id;
      canvas.setAttribute('aria-label',status.textContent);
    }
    load.addEventListener('click',generate);
    for(const node of [floor,view,zoom])node.addEventListener('change',render);
    type.addEventListener('change',generate);variant.addEventListener('change',generate);
    canvas.addEventListener('keydown',event=>{
      const key=event.key.toLowerCase(), amount=event.shiftKey?1:.35;
      const dirs={arrowup:[0,-amount],z:[0,-amount],w:[0,-amount],arrowdown:[0,amount],s:[0,amount],arrowleft:[-amount,0],q:[-amount,0],a:[-amount,0],arrowright:[amount,0],d:[amount,0]};
      if(dirs[key]){event.preventDefault();event.stopPropagation();move(...dirs[key]);render();}
      else if(key==='e'){event.preventDefault();event.stopPropagation();if(!useTransition.disabled)useTransition.click();}
    });
    host.addEventListener('keydown',event=>{if(!['Escape','Tab'].includes(event.key))event.stopPropagation();});
    canvas.addEventListener('click',event=>{
      canvas.focus({preventScroll:true});if(!session||!transform)return;
      const rect=canvas.getBoundingClientRect(), t=transform,x=((event.clientX-rect.left)*canvas.width/rect.width-t.tx)/t.scale,y=((event.clientY-rect.top)*canvas.height/rect.height-t.ty)/t.scale;
      const at=r=>r.level===t.level&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
      selected=(session.scene.rooms.find(at)||session.scene.solids.filter(s=>!s.roomId&&s.accessible===false&&at(s)).sort((a,b)=>a.w*a.h-b.w*b.h)[0]||(session.scene.areas||[]).filter(at).sort((a,b)=>a.w*a.h-b.w*b.h)[0])?.id||null;render();
    });
    host.addEventListener('toggle',()=>{if(host.open&&!session)generate();});
    owner.append(host);
    const api=Object.freeze({host,generate,render,state:()=>session?.state||null});mounted.set(owner,api);return api;
  }
  return Object.freeze({mount,transportEdges});
});
