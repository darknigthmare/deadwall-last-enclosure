// Districts, première tranche (docs/GAME_BIBLE.md §8.2) : reconnaître toutes les enceintes fermées
// autour du centre et lire, pour chacune, des faits déjà présents dans l'état du jeu.
// Lecture seule : ce module n'ajoute ni stock, ni dégât, ni tirage, ni valeur d'équilibrage, ni état
// sauvegardé. Le seul ordre proposé, le choix de la ligne de repli, est confié au module de repli,
// qui le réalise avec les commandes existantes des sections, des ouvriers et des portes.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallDistricts=api;
 if(root.document){
  const mount=()=>root.setTimeout(()=>{if(root.DEADWALL)api.install(root.DEADWALL,root.document);},0);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 }
})(globalThis,function(root){
 'use strict';
 // Bornes de calcul, pas des règles de jeu : au-delà, ce qui reste compte comme « Dehors ».
 const MAX_RINGS=8,MAX_GRID=128;
 const ORDINALS=Object.freeze(['Enceinte intérieure','Deuxième enceinte','Troisième enceinte','Quatrième enceinte','Cinquième enceinte','Sixième enceinte','Septième enceinte','Huitième enceinte']);
 const OUTSIDE='Dehors';
 const GATE_LABELS=Object.freeze({auto:'auto',open:'ouverte',closed:'verrouillée'});
 const many=(n,one,several)=>n+' '+(n>1?several:one);
 const alive=entity=>Boolean(entity&&!entity.dead&&entity.health>0);
 const ringName=rank=>rank>=1?(ORDINALS[rank-1]||'Enceinte '+rank):OUTSIDE;
 // Relevé des enceintes. Inondation depuis le centre, arrêtée par les murs et les portes quel que soit
 // leur mode : c'est l'anneau 1. On franchit alors les ouvrages touchés et on recommence : anneau 2, etc.
 // L'inondation qui atteint le bord de la carte n'est pas une enceinte : c'est « Dehors ».
 // Chaque case n'est visitée qu'une fois, tous anneaux confondus.
 // Les cases d'un ouvrage appartiennent au district extérieur à cet ouvrage, comme dans le module de repli :
 // se tenir sur une porte, ce n'est pas être rentré.
 function survey(C,T,buildings){
  const size=Math.min(MAX_GRID,C.WORLD_TILES),total=size*size;
  const barrier=new Uint8Array(total),owner=new Int32Array(total).fill(-1),level=new Uint8Array(total),queue=new Int32Array(total);
  const works=[],cellsOf=[];let core=null;
  for(const building of Array.from(buildings)){
   if(!T.operational(building))continue;
   if(building.type==='core'){if(!core)core=building;continue;}
   if(!building.def?.wall)continue;
   const cells=T.footprint(building);if(!cells)continue;
   const index=works.push(building)-1,list=[];
   for(let y=Math.max(0,cells.y);y<Math.min(size,cells.y+cells.height);y++)for(let x=Math.max(0,cells.x);x<Math.min(size,cells.x+cells.width);x++){const cell=y*size+x;barrier[cell]=1;owner[cell]=index;list.push(cell);}
   cellsOf.push(list);
  }
  let count=0;
  // Rang du district où se trouve une entité : 1…n pour une enceinte fermée, 0 pour « Dehors ».
  const districtOf=entity=>{
   if(!entity||!Number.isFinite(entity.x)||!Number.isFinite(entity.y))return 0;
   const x=Math.floor(entity.x/C.TILE),y=Math.floor(entity.y/C.TILE);
   if(x<0||y<0||x>=size||y>=size)return 0;
   const value=level[y*size+x];return value>=1&&value<=count?value:0;
  };
  const origin=core&&T.footprint(core);
  if(!origin)return Object.freeze({hasCore:false,rings:Object.freeze([]),capped:false,looseWorks:Object.freeze(works.slice()),districtOf});
  const crossed=new Uint8Array(works.length);
  let head=0,tail=0,rank=1,edge=false,open=0,filled=0,touched=[];
  const visit=(x,y)=>{
   if(x<0||y<0||x>=size||y>=size){edge=true;return;}
   const cell=y*size+x;if(level[cell])return;
   if(barrier[cell]){const index=owner[cell];if(!crossed[index]){crossed[index]=1;touched.push(index);}return;}
   level[cell]=rank;open++;filled++;queue[tail++]=cell;
  };
  const around=cell=>{const x=cell%size,y=(cell-x)/size;visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);};
  // Le pourtour d'une enceinte = les ouvrages touchés depuis l'intérieur, angles compris : un ouvrage d'angle
  // n'est touché qu'en diagonale, sans que l'inondation passe elle-même en diagonale.
  const corner=(x,y)=>{if(x<0||y<0||x>=size||y>=size)return;const index=owner[y*size+x];if(index>=0&&!crossed[index]){crossed[index]=1;touched.push(index);}};
  const flood=()=>{while(head<tail){const cell=queue[head++],x=cell%size,y=(cell-x)/size;around(cell);corner(x-1,y-1);corner(x+1,y-1);corner(x-1,y+1);corner(x+1,y+1);}};
  for(let y=origin.y;y<origin.y+origin.height;y++)for(let x=origin.x;x<origin.x+origin.width;x++)visit(x,y);
  flood();
  const found=[];let capped=false;
  while(!edge){
   // La zone de rang `rank` est fermée ; `touched` est son pourtour.
   if(found.length>=MAX_RINGS){capped=true;break;}
   let boundary=[],cells=filled,batch=touched,kept=0;
   touched=[];open=0;rank++;
   // Franchir le pourtour : ses cases passent au district suivant, puis l'inondation repart de leurs voisines.
   // Mur épais : tant que franchir ne mène qu'à d'autres ouvrages, ils font partie du même pourtour.
   for(;;){
    const fresh=[];
    for(const index of batch){boundary.push(index);for(const cell of cellsOf[index])if(!level[cell]){level[cell]=rank;filled++;fresh.push(cell);}}
    for(const cell of fresh){const x=cell%size,y=(cell-x)/size;around(cell);corner(x-1,y-1);corner(x+1,y-1);corner(x-1,y+1);corner(x+1,y+1);}
    flood();
    if(edge||open>0||!touched.length)break;
    kept=boundary.length;batch=touched;touched=[];
   }
   // Un ouvrage touché qui ne sépare rien (reste d'une ligne intérieure tombée, mur isolé) n'est pas du pourtour :
   // il ne borde aucune case libre au-delà. Ses cases restent dans la zone où il se trouve.
   const beyond=cell=>{
    const x=cell%size,y=(cell-x)/size;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;
     if(nx<0||ny<0||nx>=size||ny>=size)return true;
     const next=ny*size+nx;if(!barrier[next]&&level[next]===rank)return true;
    }
    return false;
   };
   const stray=[];
   boundary=boundary.filter((index,position)=>{
    if(position<kept||cellsOf[index].some(beyond))return true;
    for(const cell of cellsOf[index])if(level[cell]===rank){level[cell]=rank-1;cells++;}
    stray.push(works[index]);return false;
   });
   found.push({cells,stray,works:boundary.map(index=>works[index]).sort((a,b)=>a.id-b.id)});count=found.length;
   if(!open&&!touched.length)break;
  }
  const inRing=new Set();
  const rings=Object.freeze(found.map((ring,index)=>{
   const number=index+1,own=ring.cells-(index?found[index-1].cells:0);
   for(const work of ring.works)inRing.add(work);for(const work of ring.stray)inRing.add(work);
   return Object.freeze({rank:number,name:ringName(number),closed:true,cells:ring.cells,districtCells:own,works:Object.freeze(ring.works),strayWorks:Object.freeze(ring.stray),gates:Object.freeze(ring.works.filter(work=>T.isGate(work))),
    contains:entity=>{const value=districtOf(entity);return value>=1&&value<=number;}});
  }));
  return Object.freeze({hasCore:true,rings,capped,looseWorks:Object.freeze(works.filter(work=>!inRing.has(work))),districtOf});
 }
 // Enceintes fermées autour du centre, de l'intérieur vers l'extérieur.
 function rings(C,T,buildings){return survey(C,T,buildings).rings;}
 // Faits par district, lus dans l'état réel. Un district = la zone d'une enceinte moins celle des enceintes
 // intérieures ; le dernier élément est « Dehors ». Le seuil de mur fragile est celui du relevé de champ de bataille.
 function facts(C,T,view,state={}){
  const ratio=C.BATTLEFIELD_RULES?.fragileWallRatio;
  const fragile=work=>{const max=Number(work.maxHealth??work.def?.health);return Number.isFinite(ratio)&&max>0&&work.health/max<=ratio;};
  const blank=(rank,ring)=>({rank,name:ringName(rank),closed:Boolean(ring),cells:ring?ring.districtCells:null,buildings:0,housing:0,defenders:{total:0,byRole:{}},commander:false,
   gates:ring?ring.gates.map(gate=>Object.freeze({id:gate.id,mode:T.gateMode(gate)})):[],walls:0,fragileWalls:0,infected:0});
  const list=view.rings.map(ring=>blank(ring.rank,ring)),outside=blank(0,null);
  const at=entity=>list[view.districtOf(entity)-1]||outside;
  view.rings.forEach((ring,index)=>{for(const work of ring.works){if(!T.operational(work))continue;list[index].walls++;if(fragile(work))list[index].fragileWalls++;}});
  for(const work of view.looseWorks){if(!T.operational(work))continue;outside.walls++;if(fragile(work))outside.fragileWalls++;}
  for(const building of Array.from(state.buildings||[])){
   if(!T.operational(building)||building.def?.wall)continue;
   const cells=T.footprint(building);
   const place=Number.isFinite(building.x)&&Number.isFinite(building.y)?building:cells?{x:(cells.x+cells.width/2)*C.TILE,y:(cells.y+cells.height/2)*C.TILE}:null;
   const district=at(place);district.buildings++;district.housing+=Number(building.def?.housing)||0;
  }
  for(const unit of state.units||[]){
   if(!alive(unit)||unit.regionAbsent)continue;
   const district=at(unit),role=String(unit.kind||'unit');district.defenders.total++;district.defenders.byRole[role]=(district.defenders.byRole[role]||0)+1;
  }
  if(alive(state.player)&&!state.player.regionAbsent)at(state.player).commander=true;
  for(const zombie of state.zombies||[])if(alive(zombie))at(zombie).infected++;
  list.push(outside);
  return Object.freeze(list.map(district=>{
   const modes={auto:0,open:0,closed:0};for(const gate of district.gates)modes[gate.mode]++;
   return Object.freeze({...district,gates:Object.freeze(district.gates),gateModes:Object.freeze(modes),defenders:Object.freeze({total:district.defenders.total,byRole:Object.freeze(district.defenders.byRole)})});
  }));
 }
 // Une ligne lisible par district, sans jugement : seulement ce qui est compté.
 function describe(C,district){
  const parts=[many(district.buildings,'bâtiment','bâtiments'),many(district.housing,'logement','logements')];
  const roles=Object.entries(district.defenders.byRole).map(([kind,n])=>n+' '+String(C.SURVIVORS?.[kind]?.name||kind).toLowerCase()+(n>1?'s':''));
  parts.push(many(district.defenders.total,'équipier','équipiers')+(roles.length?' ('+roles.join(', ')+')':'')+(district.commander?' et vous':''));
  if(district.closed){
   const modes=Object.keys(GATE_LABELS).filter(mode=>district.gateModes[mode]).map(mode=>district.gateModes[mode]+' '+GATE_LABELS[mode]+(district.gateModes[mode]>1&&mode!=='auto'?'s':''));
   parts.push(district.gates.length?many(district.gates.length,'porte','portes')+' ('+modes.join(', ')+')':'aucune porte');
   parts.push(many(district.walls,'ouvrage','ouvrages')+' en service'+(district.fragileWalls?', dont '+many(district.fragileWalls,'fragile','fragiles'):''));
  }else if(district.walls)parts.push(many(district.walls,'ouvrage','ouvrages')+' hors enceinte fermée'+(district.fragileWalls?', dont '+many(district.fragileWalls,'fragile','fragiles'):''));
  parts.push(many(district.infected,'infecté','infectés'));
  return parts.join(' · ');
 }
 function install(g,doc){
  const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),T=root.DeadwallTactics||(typeof require==='function'?require('./tactics.js'):null);
  if(!g||!doc?.body||!C||!T||g.districts)return false;
  let cache=null,choice=1;
  const view=()=>{const version=g.world?.navigationVersion;if(!cache||cache.world!==g.world||cache.version!==version)cache={world:g.world,version,view:survey(C,T,g.world.buildings.values())};return cache.view;};
  const playing=()=>g.state==='playing'&&!g.gameOver&&Boolean(g.world);
  const list=()=>playing()?facts(C,T,view(),{buildings:g.world.buildings.values(),units:g.units,zombies:g.zombies,player:g.player}):Object.freeze([]);
  // Ligne de repli : l'enceinte choisie si elle est encore fermée, sinon la plus extérieure qui le soit en deçà.
  const line=()=>{if(!playing())return null;const closed=view().rings;return closed[Math.min(choice,closed.length)-1]||null;};
  const order=g.fallbackOrder,canChoose=typeof order?.holdLine==='function';
  if(canChoose)order.holdLine(line);
  // Le choix ne change pas pendant un repli général : les portes déjà verrouillées restent celles de l'ordre donné.
  function setLine(rank){
   if(!canChoose||!playing()||!Number.isInteger(rank)||rank<1||rank>view().rings.length)return false;
   if(order.status().mode==='everyone')return false;
   choice=rank;return true;
  }
  for(const name of ['startNew','restoreSave']){const old=g[name];if(typeof old!=='function')continue;g[name]=function(...args){const result=old.apply(this,args);if(result===false)return result;cache=null;const saved=name==='restoreSave'?order?.savedLine?.():1;choice=Number.isInteger(saved)&&saved>=1?saved:1;return result;};}
  const host=doc.getElementById('commandPanel-enclosure');
  let refresh=()=>{};
  if(host){
   const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;};
   const write=(node,text)=>{const value=String(text);if(node.textContent!==value)node.textContent=value;};
   const box=el('section',undefined,'districts');box.id='districts';box.setAttribute('aria-labelledby','districtsTitle');
   const title=el('h3','DISTRICTS');title.id='districtsTitle';
   const state=el('p',undefined,'districts-state');state.id='districtsState';state.setAttribute('role','status');
   const rows=el('ul',undefined,'districts-list');rows.id='districtsList';
   const lineTitle=el('h3','LIGNE DE REPLI GÉNÉRAL');lineTitle.id='districtsLineTitle';
   const lineBox=el('div',undefined,'districts-line');lineBox.id='districtsLine';lineBox.setAttribute('role','group');lineBox.setAttribute('aria-labelledby','districtsLineTitle');
   const lineNote=el('p',undefined,'districts-state');lineNote.id='districtsLineNote';
   box.append(title,state,rows,lineTitle,lineBox,lineNote);host.appendChild(box);
   let rowKey='',lineKey='';const rowNodes=[],buttons=[];
   refresh=()=>{
    box.hidden=g.state!=='playing';if(box.hidden)return;
    const districts=list(),closed=districts.filter(district=>district.closed).length,v=playing()?view():null;
    write(state,!v?.hasCore?'Aucun centre en service.':closed?many(closed,'enceinte fermée','enceintes fermées')+' autour du centre'+(v.capped?' (relevé limité à '+MAX_RINGS+')':'')+'.':'Aucune enceinte fermée autour du centre : tout est dehors.');
    const key=districts.map(district=>district.rank).join(',');
    if(key!==rowKey){
     rowKey=key;rows.replaceChildren();rowNodes.length=0;
     for(const district of districts){const item=el('li'),name=el('strong',district.name),text=el('span');item.dataset.district=String(district.rank);item.append(name,text);rows.appendChild(item);rowNodes.push({item,text});}
    }
    districts.forEach((district,index)=>{const node=rowNodes[index];write(node.text,describe(C,district));const mark=district.infected?'true':'false';if(node.item.dataset.infected!==mark)node.item.dataset.infected=mark;});
    const show=canChoose&&closed>1;lineTitle.hidden=!show;lineBox.hidden=!show;lineNote.hidden=!show;
    if(!show){if(lineKey){lineKey='';lineBox.replaceChildren();buttons.length=0;}return;}
    if(lineKey!==String(closed)){
     lineKey=String(closed);lineBox.replaceChildren();buttons.length=0;
     for(let rank=1;rank<=closed;rank++){const node=el('button',ringName(rank).toUpperCase());node.type='button';node.dataset.rank=String(rank);node.addEventListener('click',()=>{if(!node.disabled&&setLine(rank))refresh();});lineBox.appendChild(node);buttons.push(node);}
    }
    const held=line(),locked=order.status().mode==='everyone';
    for(const node of buttons){const pressed=String(Number(node.dataset.rank)===held?.rank);if(node.getAttribute('aria-pressed')!==pressed)node.setAttribute('aria-pressed',pressed);node.disabled=locked;}
    write(lineNote,held?'Le repli général verrouillera '+many(held.gates.length,'porte','portes')+' : '+held.name.toLowerCase()+'. Tout le monde rentre vers le centre ; rien n’est fermé tant que quelqu’un est au-delà de cette ligne.'+(locked?' Levez le repli pour changer de ligne.':''):'');
   };
   const updateUI=g.updateUI;if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);refresh();return result;};
  }
  g.districts=Object.freeze({rings:()=>playing()?view().rings:Object.freeze([]),list,line,lineRank:()=>line()?.rank||0,setLine,refresh:()=>refresh()});
  refresh();return true;
 }
 return Object.freeze({install,survey,rings,facts,describe,ringName,MAX_RINGS,OUTSIDE});
});
