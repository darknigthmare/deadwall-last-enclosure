// Repli sur l'enceinte intérieure et brèches nommées (docs/GAME_BIBLE.md §8.1).
// Ce module compose des ordres déjà existants : repli des sections, ordre de repli des ouvriers
// et mode des portes. Il n'ajoute ni stock, ni dégât, ni tirage, ni valeur d'équilibrage :
// chaque effet passe par la commande de son propriétaire, avec ses propres refus.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallFallbackOrder=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{if(root.DEADWALL)api.install(root.DEADWALL,root.document);},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 const CHECK_SECONDS=.5,BREACH_QUIET_SECONDS=4;
 const SIDES=Object.freeze({north:'nord',east:'est',south:'sud',west:'ouest'});
 const many=(n,one,several)=>n+' '+(n>1?several:one);
 const alive=entity=>Boolean(entity&&!entity.dead&&entity.health>0);
 // Zone tenue autour du centre : tout ce qu'on atteint depuis le centre sans franchir un mur ni une porte,
 // quel que soit le mode de la porte. `closed` vaut faux si cette zone touche le bord de la carte.
 function innerZone(C,T,buildings){
  const size=C.WORLD_TILES,total=size*size,barrier=new Uint8Array(total),owner=new Int32Array(total).fill(-1),inside=new Uint8Array(total),queue=new Int32Array(total);
  const list=Array.from(buildings),walls=[];let core=null;
  for(const building of list){
   if(!T.operational(building))continue;
   if(building.type==='core'){core=building;continue;}
   if(!building.def?.wall)continue;
   const cells=T.footprint(building);if(!cells)continue;
   const index=walls.push(building)-1;
   for(let y=Math.max(0,cells.y);y<Math.min(size,cells.y+cells.height);y++)for(let x=Math.max(0,cells.x);x<Math.min(size,cells.x+cells.width);x++){barrier[y*size+x]=1;owner[y*size+x]=index;}
  }
  const empty=Object.freeze({hasCore:false,closed:false,cells:0,gates:Object.freeze([]),contains:()=>false});
  const origin=core&&T.footprint(core);if(!origin)return empty;
  let head=0,tail=0,closed=true;const touched=new Set();
  const visit=(x,y)=>{
   if(x<0||y<0||x>=size||y>=size){closed=false;return;}
   const cell=y*size+x;if(inside[cell])return;
   if(barrier[cell]){touched.add(owner[cell]);return;}
   inside[cell]=1;queue[tail++]=cell;
  };
  for(let y=origin.y;y<origin.y+origin.height;y++)for(let x=origin.x;x<origin.x+origin.width;x++)visit(x,y);
  while(head<tail){const cell=queue[head++],x=cell%size,y=(cell-x)/size;visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);}
  const gates=Object.freeze([...touched].map(index=>walls[index]).filter(building=>T.isGate(building)).sort((a,b)=>a.id-b.id));
  const contains=entity=>{
   if(!entity||!Number.isFinite(entity.x)||!Number.isFinite(entity.y))return false;
   const x=Math.floor(entity.x/C.TILE),y=Math.floor(entity.y/C.TILE);
   return x>=0&&y>=0&&x<size&&y<size&&inside[y*size+x]===1;
  };
  return Object.freeze({hasCore:true,closed,cells:tail,gates,contains});
 }
 // État d'un secteur (un côté de la cité), déduit de faits observés. Aucune valeur d'équilibrage.
 //   tenu      : ligne intacte, aucun contact
 //   menacé    : ligne intacte, contacts ou murs fragiles pendant l'alerte ou l'assaut
 //   contesté  : ligne ouverte, personne encore à l'intérieur
 //   perdu     : ligne ouverte et infectés à l'intérieur
 const STATES=Object.freeze({held:'tenu',threatened:'menacé',contested:'contesté',lost:'perdu'});
 function sectorState({breached=false,contacts=0,innerContacts=0,fragileWalls=0,fighting=false}={}){
  if(breached)return innerContacts>0?'lost':'contested';
  return fighting&&(contacts>0||fragileWalls>0)?'threatened':'held';
 }
 // Reconquête en trois temps (GAME_BIBLE §8.3), lue sur l'état réel.
 function reconquest({breaches=0,intruders=0,order=null}={}){
  const isolate=breaches===0,clear=intruders===0,restore=isolate&&clear&&!order;
  return Object.freeze([
   Object.freeze({id:'isolate',label:'Isoler',detail:'refermer la brèche',done:isolate}),
   Object.freeze({id:'clear',label:'Nettoyer',detail:'éliminer ce qui est entré',done:clear}),
   Object.freeze({id:'restore',label:'Rétablir',detail:'lever le repli, rouvrir les portes, déblayer',done:restore})
  ]);
 }
 function sideOf(core,building){
  const dx=building.x-core.x,dy=building.y-core.y;
  return Math.abs(dx)>Math.abs(dy)?(dx>0?'east':'west'):(dy>0?'south':'north');
 }
 function install(g,doc){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),T=root.DeadwallTactics||(typeof require==='function'?require('./tactics.js'):null);
  if(!g||!doc?.body||!C||!T||g.fallbackOrder)return false;
  let pending=null,cache=null,clock=0,notice='',walls=null,wallWorld=null,lastBreach=null,quietUntil=0;
  const B=root.DeadwallBattlefield||null,breaches=new Map(),known=new Map();let nightLog={wave:0,lost:[],retaken:[]};
  const sideIds=Object.keys(SIDES);
  const zone=()=>{const version=g.world?.navigationVersion;if(!cache||cache.world!==g.world||cache.version!==version)cache={world:g.world,version,zone:innerZone(C,T,g.world.buildings.values())};return cache.zone;};
  const troops=()=>g.units.filter(alive);
  // Ligne de repli général. Par défaut l'enceinte intérieure ; le module des districts peut en proposer une autre,
  // qui n'est retenue que si elle est fermée. Seule l'enceinte dont on verrouille les portes change.
  let line=null;
  const hold=()=>{const chosen=typeof line==='function'?line():null;return chosen&&chosen.closed&&Array.isArray(chosen.gates)&&typeof chosen.contains==='function'?chosen:zone();};
  const nameOf=z=>typeof z.name==='string'&&z.name?z.name:'Enceinte intérieure';
  const the=z=>{const name=nameOf(z).toLowerCase();return(/^[aeéèiou]/.test(name)?'l’':'la ')+name;};
  const commanderOutside=z=>alive(g.player)&&!g.player.regionAbsent&&!z.contains(g.player);
  function status(){
   const playing=g.state==='playing'&&!g.gameOver;
   if(!playing||!g.world)return Object.freeze({available:false,closed:false,gates:0,outside:0,commanderOutside:false,mode:null,sealed:false,notice:'',lastBreach:null,infectedInside:0});
   const z=zone(),h=hold(),outside=troops().filter(unit=>!h.contains(unit)).length;
   return Object.freeze({available:g.canIssueCommand()&&z.hasCore,closed:z.closed,gates:z.gates.length,line:nameOf(h),lineGates:h.gates.length,outside,commanderOutside:commanderOutside(h),mode:pending?.mode||null,sealed:Boolean(pending?.sealed),notice,lastBreach,
    infectedInside:z.closed?g.zombies.filter(zombie=>alive(zombie)&&z.contains(zombie)).length:0});
  }
  function say(text,tone){notice=text;g.notify(text,tone);return true;}
  // Ordre 1 : les trois sections se replient vers le centre, par la commande existante des sections.
  function fighters(){
   if(!g.canIssueCommand()||!g.core?.())return false;
   const count=C.SQUAD_RULES.count;let sent=0;
   for(let index=0;index<count;index++)if(g.retreatSquad(index,g.core()))sent++;
   if(!sent)return false;
   if(!pending)pending={mode:'fighters',sealed:false,previous:new Map()};
   return say('Repli des combattants : les sections reviennent vers le centre. Les ouvriers gardent leurs ordres.','good');
  }
  // Ordre 2 : tout le monde se replie, puis les portes de l'enceinte intérieure sont verrouillées
  // dès que plus personne n'est dehors. Le verrouillage passe par la commande des portes et ses refus.
  function everyone(){
   if(!g.canIssueCommand()||!g.core?.())return false;
   const z=hold();
   for(let index=0;index<C.SQUAD_RULES.count;index++)g.retreatSquad(index,g.core());
   if(!g.setWorkerOrder('retreat'))return false;
   const previous=pending?.previous instanceof Map?pending.previous:new Map();
   pending={mode:'everyone',sealed:false,previous};
   if(!z.closed)return say('Repli général : tout le monde revient vers le centre. Aucune enceinte fermée autour du centre : rien à verrouiller.','normal');
   if(!z.gates.length)return say('Repli général : tout le monde revient vers le centre. '+nameOf(z)+' : aucune porte à verrouiller.','good');
   return say('Repli général : tout le monde revient vers le centre. '+(z.gates.length>1?'Les '+z.gates.length+' portes de '+the(z)+' seront verrouillées':'La porte de '+the(z)+' sera verrouillée')+' dès que plus personne ne sera dehors.','good');
  }
  function seal(){
   if(!pending||pending.mode!=='everyone'||pending.sealed)return false;
   const z=hold();if(!z.closed||!z.gates.length)return false;
   if(troops().some(unit=>!z.contains(unit))||commanderOutside(z))return false;
   let locked=0;
   for(const gate of z.gates){
    const mode=T.gateMode(gate);
    if(mode==='closed'){locked++;continue;}
    if(!pending.previous.has(gate.id))pending.previous.set(gate.id,mode);
    if(g.setGateMode('closed',gate))locked++;
   }
   if(locked<z.gates.length)return false;
   pending.sealed=true;return say(nameOf(z)+' verrouillée : '+many(locked,'porte fermée','portes fermées')+', tout le monde est à l’intérieur.','good');
  }
  // Lever le repli : les portes verrouillées par cet ordre retrouvent leur mode, les ouvriers reprennent.
  function standDown(){
   if(!g.canIssueCommand()||!pending)return false;
   let restored=0;
   for(const [id,mode]of pending.previous){const gate=g.world.buildings.get(id);if(gate&&T.operational(gate)&&T.gateMode(gate)==='closed'&&g.setGateMode(mode,gate))restored++;}
   if(pending.mode==='everyone'&&g.workerOrder==='retreat')g.setWorkerOrder('auto');
   pending=null;
   return say('Repli levé : '+(restored?many(restored,'porte rendue','portes rendues')+' à leur mode précédent, ':'')+'les ouvriers reprennent leurs ordres. Redonnez un point de ralliement aux sections.','normal');
  }
  // Brèche nommée : un mur ou une porte de l'enceinte tombe pendant l'alerte ou l'assaut.
  function watchBreaches(){
   const current=new Map();
   for(const building of g.world.buildings.values())if(building.def?.wall&&T.operational(building))current.set(building.id,building);
   if(wallWorld!==g.world||!walls){walls=current;wallWorld=g.world;return;}
   const core=g.core?.();
   if(core&&['warning','assault'].includes(g.phase)){
    for(const [id,building]of walls){
     if(current.has(id)||g.world.buildings.get(id)===building&&alive(building))continue;
     const side=(B?.direction||sideOf)(core,building),z=zone(),inside=z.closed?g.zombies.filter(zombie=>alive(zombie)&&z.contains(zombie)).length:null;
     lastBreach=Object.freeze({side,name:building.def.name,gate:T.isGate(building),wave:g.wave,at:g.elapsed});
     const cells=T.footprint(building);if(cells)breaches.set(building.id,Object.freeze({side,name:building.def.name,cells}));
     if(g.elapsed>=quietUntil){
      quietUntil=g.elapsed+BREACH_QUIET_SECONDS;
      g.notify('Brèche au '+SIDES[side]+' ('+building.def.name+').'+(inside===null?' Le centre n’est plus couvert par une enceinte fermée.':' '+many(inside,'infecté','infectés')+' dans l’enceinte intérieure.'),'danger');
     }
    }
   }
   // Une brèche est refermée quand un mur ou une porte en service recouvre de nouveau son emplacement.
   for(const [id,breach]of breaches){
    const c=breach.cells;let covered=false;
    for(const wall of current.values()){const f=T.footprint(wall);if(f&&f.x<c.x+c.width&&f.x+f.width>c.x&&f.y<c.y+c.height&&f.y+f.height>c.y){covered=true;break;}}
    if(covered)breaches.delete(id);
   }
   walls=current;
  }
  function sectors(){
   const core=g.core?.(),fighting=['warning','assault'].includes(g.phase);
   const view=B&&core?B.inspect(core,g.zombies,g.world.buildings.values()):null;
   return sideIds.map(id=>{
    const facts=view?.sectors.find(sector=>sector.id===id)||{contacts:0,innerContacts:0,fragileWalls:0};
    const open=[...breaches.values()].filter(breach=>breach.side===id).length;
    const state=sectorState({breached:open>0,contacts:facts.contacts,innerContacts:facts.innerContacts,fragileWalls:facts.fragileWalls,fighting});
    return Object.freeze({id,name:SIDES[id],state,label:STATES[state],breaches:open,contacts:facts.contacts,innerContacts:facts.innerContacts});
   });
  }
  // Annonce les secteurs perdus et repris, une fois par changement.
  function watchSectors(){
   if(nightLog.wave!==g.wave)nightLog={wave:g.wave,lost:[],retaken:[]};
   for(const sector of sectors()){
    const before=known.get(sector.id)||'held';
    if(sector.state===before)continue;
    known.set(sector.id,sector.state);
    if(sector.state==='lost'){if(!nightLog.lost.includes(sector.id))nightLog.lost.push(sector.id);g.notify('Secteur '+sector.name+' perdu : '+many(sector.innerContacts,'infecté est entré','infectés sont entrés')+' par la brèche.','danger');}
    else if((before==='lost'||before==='contested')&&sector.breaches===0){if(!nightLog.retaken.includes(sector.id))nightLog.retaken.push(sector.id);g.notify('Secteur '+sector.name+' repris : la ligne est refermée.','good');}
   }
  }
  function plan(){
   const list=sectors(),open=list.reduce((n,sector)=>n+sector.breaches,0),intruders=list.reduce((n,sector)=>n+sector.innerContacts,0);
   return Object.freeze({needed:open>0||list.some(sector=>sector.state==='lost'),steps:reconquest({breaches:open,intruders,order:pending?.mode||null})});
  }
  function tick(){
   if(g.state!=='playing'||g.gameOver||!g.world)return;
   watchBreaches();watchSectors();
   if(pending?.mode==='everyone'&&!pending.sealed)seal();
  }
  const update=g.update;
  if(typeof update==='function')g.update=function(dt,...rest){const result=update.call(this,dt,...rest);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=CHECK_SECONDS){clock=now;tick();}return result;};
  for(const name of ['startNew','restoreSave']){const old=g[name];if(typeof old!=='function')continue;g[name]=function(...args){const result=old.apply(this,args);pending=null;cache=null;walls=null;wallWorld=null;lastBreach=null;notice='';clock=-Infinity;quietUntil=0;breaches.clear();known.clear();nightLog={wave:0,lost:[],retaken:[]};return result;};}
  // Interface : une section dans l'onglet Situation du carnet.
  const host=doc.getElementById('commandPanel-enclosure');
  let refresh=()=>{};
  if(host){
   const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;};
   const write=(node,text)=>{const value=String(text);if(node.textContent!==value)node.textContent=value;};
   const box=el('section',undefined,'fallback-order');box.id='fallbackOrder';box.setAttribute('aria-labelledby','fallbackOrderTitle');
   const title=el('h3','REPLI SUR L’ENCEINTE INTÉRIEURE');title.id='fallbackOrderTitle';
   const state=el('p',undefined,'fallback-order-state');state.id='fallbackOrderState';state.setAttribute('role','status');
   const button=(id,label,hint,run)=>{const node=el('button');node.id=id;node.type='button';node.append(el('span',label),el('small',hint));node.addEventListener('click',()=>{if(!node.disabled){run();refresh();}});return node;};
   const bFighters=button('fallbackFighters','REPLI DES COMBATTANTS','sections vers le centre · ouvriers inchangés',fighters);
   const bEveryone=button('fallbackEveryone','REPLI GÉNÉRAL','tout le monde rentre · portes verrouillées ensuite',everyone);
   const bStand=button('fallbackStandDown','LEVER LE REPLI','portes et ouvriers rendus à leurs ordres',standDown);
   const actions=el('div',undefined,'fallback-order-actions');actions.append(bFighters,bEveryone,bStand);
   const sectorTitle=el('h3','ÉTAT DES SECTEURS'),sectorList=el('ul',undefined,'fallback-sectors');sectorList.id='fallbackSectors';
   const chips=new Map();for(const id of sideIds){const chip=el('li');chip.dataset.sector=id;sectorList.appendChild(chip);chips.set(id,chip);}
   const steps=el('ol',undefined,'fallback-reconquest');steps.id='fallbackReconquest';
   box.append(title,state,actions,sectorTitle,sectorList,steps);host.appendChild(box);
   refresh=()=>{
    const s=status();box.hidden=g.state!=='playing';if(box.hidden)return;
    bFighters.disabled=!s.available;bEveryone.disabled=!s.available;bStand.disabled=!s.available||!s.mode;
    const lines=[];
    lines.push(s.closed?'Enceinte intérieure fermée, '+many(s.gates,'porte','portes')+'.':'Aucune enceinte fermée autour du centre.');
    if(s.mode==='fighters')lines.push('Repli des combattants en cours.');
    if(s.mode==='everyone')lines.push(s.sealed?'Repli général : enceinte verrouillée.':'Repli général : '+many(s.outside+(s.commanderOutside?1:0),'personne','personnes')+' encore dehors'+(s.commanderOutside?', dont vous':'')+'.');
    if(s.infectedInside)lines.push(many(s.infectedInside,'infecté','infectés')+' à l’intérieur.');
    if(s.lastBreach)lines.push('Dernière brèche : '+SIDES[s.lastBreach.side]+', vague '+s.lastBreach.wave+'.');
    write(state,lines.join(' '));
    for(const sector of sectors()){const chip=chips.get(sector.id);write(chip,sector.name.toUpperCase()+' · '+sector.label+(sector.breaches?' · '+many(sector.breaches,'brèche','brèches'):''));if(chip.dataset.state!==sector.state)chip.dataset.state=sector.state;}
    const p=plan();steps.hidden=!p.needed;
    if(p.needed){const key=p.steps.map(step=>step.done?1:0).join('');if(steps.dataset.key!==key){steps.dataset.key=key;steps.replaceChildren();for(const step of p.steps){const item=el('li',(step.done?'Fait — ':'À faire — ')+step.label+' : '+step.detail+'.');item.dataset.done=String(step.done);steps.appendChild(item);}}}
   };
   const updateUI=g.updateUI;if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);refresh();return result;};
  }
  g.fallbackOrder=Object.freeze({holdLine:provider=>{line=typeof provider==='function'?provider:null;return true;},status,fighters,everyone,standDown,tick,refresh:()=>refresh(),zone:()=>zone(),sectors,plan,nightLog:()=>Object.freeze({wave:nightLog.wave,lost:Object.freeze([...nightLog.lost]),retaken:Object.freeze([...nightLog.retaken])})});
  refresh();return true;
 }
 return Object.freeze({install,innerZone,sideOf,sectorState,reconquest,SIDES,STATES});
});
