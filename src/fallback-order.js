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
 function sideOf(core,building){
  const dx=building.x-core.x,dy=building.y-core.y;
  return Math.abs(dx)>Math.abs(dy)?(dx>0?'east':'west'):(dy>0?'south':'north');
 }
 function install(g,doc){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),T=root.DeadwallTactics||(typeof require==='function'?require('./tactics.js'):null);
  if(!g||!doc?.body||!C||!T||g.fallbackOrder)return false;
  let pending=null,cache=null,clock=0,notice='',walls=null,wallWorld=null,lastBreach=null,quietUntil=0;
  const zone=()=>{const version=g.world?.navigationVersion;if(!cache||cache.world!==g.world||cache.version!==version)cache={world:g.world,version,zone:innerZone(C,T,g.world.buildings.values())};return cache.zone;};
  const troops=()=>g.units.filter(alive);
  const commanderOutside=z=>alive(g.player)&&!g.player.regionAbsent&&!z.contains(g.player);
  function status(){
   const playing=g.state==='playing'&&!g.gameOver;
   if(!playing||!g.world)return Object.freeze({available:false,closed:false,gates:0,outside:0,commanderOutside:false,mode:null,sealed:false,notice:'',lastBreach:null,infectedInside:0});
   const z=zone(),outside=troops().filter(unit=>!z.contains(unit)).length;
   return Object.freeze({available:g.canIssueCommand()&&z.hasCore,closed:z.closed,gates:z.gates.length,outside,commanderOutside:commanderOutside(z),mode:pending?.mode||null,sealed:Boolean(pending?.sealed),notice,lastBreach,
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
   const z=zone();
   for(let index=0;index<C.SQUAD_RULES.count;index++)g.retreatSquad(index,g.core());
   if(!g.setWorkerOrder('retreat'))return false;
   const previous=pending?.previous instanceof Map?pending.previous:new Map();
   pending={mode:'everyone',sealed:false,previous};
   if(!z.closed)return say('Repli général : tout le monde revient vers le centre. Aucune enceinte fermée autour du centre : rien à verrouiller.','normal');
   if(!z.gates.length)return say('Repli général : tout le monde revient vers le centre. L’enceinte intérieure n’a aucune porte à verrouiller.','good');
   return say('Repli général : tout le monde revient vers le centre. '+(z.gates.length>1?'Les '+z.gates.length+' portes de l’enceinte intérieure seront verrouillées':'La porte de l’enceinte intérieure sera verrouillée')+' dès que plus personne ne sera dehors.','good');
  }
  function seal(){
   if(!pending||pending.mode!=='everyone'||pending.sealed)return false;
   const z=zone();if(!z.closed||!z.gates.length)return false;
   if(troops().some(unit=>!z.contains(unit))||commanderOutside(z))return false;
   let locked=0;
   for(const gate of z.gates){
    const mode=T.gateMode(gate);
    if(mode==='closed'){locked++;continue;}
    if(!pending.previous.has(gate.id))pending.previous.set(gate.id,mode);
    if(g.setGateMode('closed',gate))locked++;
   }
   if(locked<z.gates.length)return false;
   pending.sealed=true;return say('Enceinte intérieure verrouillée : '+many(locked,'porte fermée','portes fermées')+', tout le monde est à l’intérieur.','good');
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
     const side=sideOf(core,building),z=zone(),inside=z.closed?g.zombies.filter(zombie=>alive(zombie)&&z.contains(zombie)).length:null;
     lastBreach=Object.freeze({side,name:building.def.name,gate:T.isGate(building),wave:g.wave,at:g.elapsed});
     if(g.elapsed>=quietUntil){
      quietUntil=g.elapsed+BREACH_QUIET_SECONDS;
      g.notify('Brèche au '+SIDES[side]+' ('+building.def.name+').'+(inside===null?' Le centre n’est plus couvert par une enceinte fermée.':' '+many(inside,'infecté','infectés')+' dans l’enceinte intérieure.'),'danger');
     }
    }
   }
   walls=current;
  }
  function tick(){
   if(g.state!=='playing'||g.gameOver||!g.world)return;
   watchBreaches();
   if(pending?.mode==='everyone'&&!pending.sealed)seal();
  }
  const update=g.update;
  if(typeof update==='function')g.update=function(dt,...rest){const result=update.call(this,dt,...rest);const now=Number(g.elapsed)||0;if(now<clock||now-clock>=CHECK_SECONDS){clock=now;tick();}return result;};
  for(const name of ['startNew','restoreSave']){const old=g[name];if(typeof old!=='function')continue;g[name]=function(...args){const result=old.apply(this,args);pending=null;cache=null;walls=null;wallWorld=null;lastBreach=null;notice='';clock=-Infinity;quietUntil=0;return result;};}
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
   box.append(title,state,actions);host.appendChild(box);
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
   };
   const updateUI=g.updateUI;if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);refresh();return result;};
  }
  g.fallbackOrder=Object.freeze({status,fighters,everyone,standDown,tick,refresh:()=>refresh(),zone:()=>zone()});
  refresh();return true;
 }
 return Object.freeze({install,innerZone,sideOf,SIDES});
});
