'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),Breach=require('../src/breach217.js'),Fallback=require('../src/fallback-order.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const T=globalThis.DeadwallTactics||require('../src/tactics.js');
const R=C.Breach217Rules,RATIO=C.BATTLEFIELD_RULES.fragileWallRatio,root=path.join(__dirname,'..');
// Les scénarios se construisent sur le réglage lu dans le cœur : N ouvrages pour menacer, M emportés au plus.
const N=R.minLength,M=R.maxCollapse,many=n=>n+' ouvrage'+(n>1?'s':''),range=n=>Array.from({length:n},(_,i)=>i);

function campaign(withFallback=false){
  const {g,doc}=bootDocument134();if(withFallback)Fallback.install(g,doc);
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();return g;
}
const state=g=>g.serialize().expansions127.modules.breach217;
function old(g){const data=JSON.parse(JSON.stringify(g.serialize()));delete data.expansions127.modules.breach217;assert.equal(g.restoreSave(data),true);return g;}
const watch=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const count=(notes,start)=>notes.filter(t=>t.startsWith(start)).length;
const native=notes=>notes.filter(t=>t.endsWith(' détruit — le secteur est ouvert !')).length;
// Pose un ouvrage achevé, en pleine santé, à une case donnée par rapport au coin haut-gauche du centre.
function builder(g){
  const core=g.core(),cells=T.footprint(core),W=core.constructor;
  return (type,dx,dy,rotation=0)=>{const b=new W(g.nextId++,type,cells.x+dx,cells.y+dy,rotation,1);b.progress=1;b.health=b.def.health;g.world.add(b);g.world.navigationVersion++;return b;};
}
const weaken=(...list)=>{for(const b of list.flat())b.health=b.maxHealth*RATIO*.5;};
const repair=b=>{b.health=b.maxHealth*(RATIO+.05);};
const kill=(g,b)=>g.damageBuilding(b,1e7);
// Une ligne de `n` palissades vers l'est, au nord du centre.
const line=(put,n,dx=-4,dy=-6,type='woodWall')=>Array.from({length:n},(_,i)=>put(type,dx+i,dy));
const at=(g,b)=>[...g.world.buildings.values()].find(o=>o.gx===b.gx&&o.gy===b.gy&&o.type===b.type);
const pansOf=g=>Breach.survey(g.world.buildings.values(),g.core());
const ids=pan=>pan.members.map(b=>b.id);
// Palissades, porte (deux cases, en dx -1 et 0), palissades : `lefts+1+rights` ouvrages sur une même rangée.
function gated(put,dy,lefts=N-2,rights=1){
  const left=range(lefts).map(i=>put('woodWall',-1-lefts+i,dy)),gate=put('gate',-1,dy),right=range(rights).map(i=>put('woodWall',1+i,dy));
  return {left,gate,right,all:[...left,gate,...right]};
}
// Angle : rangée de `rowN` ouvrages finissant au coin, colonne de `colN` ouvrages partant du coin vers le sud.
function angle(put,rowN,colN){
  const row=range(rowN).map(i=>put('woodWall',-4-(rowN-1)+i,-6)),corner=row[rowN-1],col=[corner,...range(colN-1).map(i=>put('woodWall',-4,-5+i))];
  return {row,col,corner};
}

test('brèche 217 : règles gelées dans le cœur, un seul seuil de fragilité, état validé strictement',()=>{
  // Réglage décidé : un pan menace à partir de 4 ouvrages, une rupture en emporte 6 au plus.
  assert.ok(Object.isFrozen(R));assert.deepEqual({...R},{minLength:4,maxCollapse:6});assert.equal(N,4);assert.equal(M,6);
  assert.ok(R.minLength>=2&&R.maxCollapse>=R.minLength);assert.equal(RATIO,.3);
  assert.ok(N>=3&&M>N,'les scénarios de ce fichier supposent une rupture plus large que la longueur minimale');
  const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
  assert.equal(core.match(/fragileWallRatio/g).length,2,'le seuil reste celui du champ de bataille, cité une fois en commentaire');
  assert.ok(core.indexOf('C.Balance217Rules=')<core.indexOf('C.Breach217Rules=')&&core.indexOf('C.Breach217Rules=')<core.indexOf('C.Weather193Rules='),'placée juste après Balance217Rules');
  assert.deepEqual(Breach.validate(undefined),{version:1,active:false});assert.deepEqual(Breach.initial(),{version:1,active:false});assert.deepEqual(Breach.fresh(),{version:1,active:true});
  const ok={version:1,active:true};assert.deepEqual(Breach.validate(ok),ok);assert.notEqual(Breach.validate(ok),ok);
  for(const bad of [null,[],'217',{},{version:1},{version:2,active:true},{version:1,active:1},{version:1,active:'oui'},{version:1,active:true,extra:1},{version:1,active:true,pans:[]}])assert.throws(()=>Breach.validate(bad),/Brèche 217/);
});

test('brèche 217 : nouvelle campagne active, fiche sans action, module inscrit partout',()=>{
  const g=campaign();
  assert.deepEqual(state(g),{version:1,active:true});assert.equal(g.breach217.active(),true);
  assert.deepEqual(g.breach217.actions(),[]);assert.deepEqual(g.expansions.get('breach217').actions(),[]);assert.deepEqual(g.breach217.threatened(),[]);
  const view=g.breach217.overview();
  assert.match(view.summary,/^Un pan de 4 ouvrages de mur voisins ou plus, tous sous 30 % de leur solidité, cède d’un seul coup/);assert.match(view.summary,/ne s’active pas en cours de campagne/);
  assert.ok(view.summary.startsWith('Un pan de '+N+' ouvrages de mur voisins ou plus,'),'la fiche lit le réglage du cœur');
  const rule=view.rows.find(r=>r.label==='Règle').value;
  assert.equal(view.rows.find(r=>r.label==='Pans menacés').value,'Aucun.');assert.match(rule,/au plus 6 ouvrages/);assert.ok(rule.includes('au plus '+M+' ouvrages'));
  const ui=fs.readFileSync(path.join(root,'src/expansion-ui.js'),'utf8');
  for(const table of ['ORDER','GROUPS','API_NAMES','LABELS'])assert.ok(ui.split('\n').find(l=>l.includes(table+' ')||l.includes(table+'=')).includes('breach217'),table);
  assert.ok(fs.readFileSync(path.join(root,'src/expansion-kit.js'),'utf8').includes("'balance217','breach217']"));
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('"src/breach217.js"'));
  assert.ok(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('<script src="src/balance217.js"></script>\n<script src="src/breach217.js"></script>'),'chargé juste après l’équilibrage');
});

test('pans : contigus seulement, longueur minimale, un ouvrage sain ou inachevé coupe le pan',()=>{
  // Deux suites de N ouvrages de part et d'autre d'un ouvrage central.
  const g=campaign(),put=builder(g),walls=line(put,2*N+1),mid=walls[N];
  assert.deepEqual(pansOf(g),[],'murs sains : aucun pan');
  weaken(walls.slice(0,N-1));assert.deepEqual(pansOf(g),[],'un ouvrage de moins que la longueur minimale : aucun pan');
  weaken(walls[N-1]);let pans=pansOf(g);
  assert.equal(pans.length,1);assert.deepEqual(ids(pans[0]),walls.slice(0,N).map(b=>b.id));assert.equal(pans[0].length,N);assert.equal(pans[0].axis,'row');assert.equal(pans[0].side,'north');assert.equal(pans[0].gates,0);
  assert.deepEqual(pans[0].cells,{x:walls[0].gx,y:walls[0].gy,width:N,height:1});
  // Un ouvrage sain au milieu : deux suites de N de part et d'autre, pas un seul pan de 2N+1.
  weaken(walls);repair(mid);pans=pansOf(g);
  assert.deepEqual(pans.map(ids),[walls.slice(0,N).map(b=>b.id),walls.slice(N+1).map(b=>b.id)]);
  // Exactement au seuil : fragile, comme pour le décompte du champ de bataille.
  mid.health=mid.maxHealth*RATIO;assert.equal(pansOf(g)[0].length,2*N+1);
  mid.health=mid.maxHealth*RATIO+1;assert.equal(pansOf(g).length,2);
  // Un ouvrage en chantier n'est pas un mur en service.
  weaken(mid);mid.progress=.5;assert.equal(pansOf(g).length,2);mid.progress=1;assert.equal(pansOf(g).length,1);
  // Une case vide coupe le pan ; un ouvrage tombé aussi.
  g.world.remove(mid);mid.dead=true;assert.deepEqual(pansOf(g).map(p=>p.length),[N,N]);
  g.world.remove(walls[1]);walls[1].dead=true;assert.deepEqual(pansOf(g).map(ids),[walls.slice(N+1).map(b=>b.id)]);
});

test('pans : une porte fragile fait partie du pan, une porte saine le coupe',()=>{
  const g=campaign(),put=builder(g);
  // Palissades, porte (deux cases), palissade : N ouvrages sur N+1 cases.
  const {gate,all}=gated(put,-6);
  assert.deepEqual(T.footprint(gate),{x:gate.gx,y:gate.gy,width:2,height:1});
  weaken(all.filter(b=>b!==gate));assert.deepEqual(pansOf(g),[],'sans la porte : N-1 ouvrages fragiles, aucun pan');
  weaken(gate);let pans=pansOf(g);
  assert.equal(pans.length,1);assert.deepEqual(ids(pans[0]),all.map(b=>b.id));assert.equal(pans[0].length,N,'une porte compte pour un ouvrage');assert.equal(pans[0].gates,1);assert.equal(pans[0].cells.width,N+1);
  repair(gate);assert.deepEqual(pansOf(g),[],'porte saine : les palissades de part et d’autre ne font plus un pan');
  // Une porte tournée (verticale) n'entre pas dans un pan horizontal.
  const a=put('woodWall',4,-6),turned=put('gate',5,-6,1),b=put('woodWall',6,-6);weaken(a,turned,b);
  assert.deepEqual(T.footprint(turned),{x:turned.gx,y:turned.gy,width:1,height:2});assert.deepEqual(pansOf(g),[]);
});

test('pans : un pan ne tourne pas le coin ; un mur d’angle peut appartenir à deux pans droits',()=>{
  const g=campaign(),put=builder(g);
  // Angle de N-1 ouvrages par ligne, coin commun : 2N-3 ouvrages contigus par un côté, mais sur deux lignes : aucun pan.
  const {row:rowWalls,col:colWalls,corner}=angle(put,N-1,N-1);weaken(rowWalls,colWalls);
  assert.ok(2*N-3>=N,'assez d’ouvrages pour un pan s’il tournait le coin');
  assert.deepEqual(pansOf(g),[],'N-1 ouvrages par ligne : aucun pan');
  // Diagonale de N ouvrages : jamais voisins.
  weaken(range(N).map(i=>put('woodWall',2+i,-6+i)));assert.deepEqual(pansOf(g),[]);
  // N ouvrages sur chaque ligne : deux pans, l'angle est dans les deux.
  const a0=put('woodWall',-4-(N-1),-6),down2=put('woodWall',-4,-6+N-1);weaken(a0,down2);
  const pans=pansOf(g);assert.equal(pans.length,2);
  const row=pans.find(p=>p.axis==='row'),column=pans.find(p=>p.axis==='column');
  assert.deepEqual(ids(row),[a0,...rowWalls].map(b=>b.id));assert.deepEqual(ids(column),[...colWalls,down2].map(b=>b.id));
  assert.equal(row.length,N);assert.equal(column.length,N);
  assert.deepEqual(column.cells,{x:corner.gx,y:corner.gy,width:1,height:N});
});

test('menace : annoncée une fois par pan et par épisode, levée par une seule réparation',()=>{
  const g=campaign(),put=builder(g),walls=line(put,N+2),notes=watch(g);
  g.breach217.tick();assert.equal(g.breach217.threatened().length,0);
  // Un ouvrage de moins que la longueur minimale : ni menace, ni annonce.
  weaken(walls.slice(0,N-1));g.elapsed+=1;g.breach217.tick();assert.deepEqual(notes,[]);assert.deepEqual(g.breach217.threatened(),[]);
  weaken(walls[N-1]);g.elapsed+=1;g.breach217.tick();
  assert.deepEqual(notes,['Le mur nord menace de céder sur '+many(N)+'.']);
  const seen=g.breach217.threatened();
  assert.equal(seen.length,1);assert.ok(Object.isFrozen(seen)&&Object.isFrozen(seen[0])&&Object.isFrozen(seen[0].ids));
  assert.deepEqual({...seen[0],ids:[...seen[0].ids],cells:{...seen[0].cells}},{key:'row:'+walls[0].gx+':'+walls[0].gy,axis:'row',side:'north',name:'nord',length:N,gates:0,ids:walls.slice(0,N).map(b=>b.id),cells:{x:walls[0].gx,y:walls[0].gy,width:N,height:1}});
  assert.equal(g.breach217.threatened(),seen,'lecture sans recalcul entre deux relevés');
  for(let i=0;i<5;i++){g.elapsed+=1;g.breach217.tick();}assert.equal(notes.length,1,'une seule annonce tant que le pan dure');
  // Le pan s'allonge : pas de nouvelle annonce, mais la fiche et l'affichage suivent.
  weaken(walls[N]);g.elapsed+=1;g.breach217.tick();assert.equal(notes.length,1);assert.equal(g.breach217.threatened()[0].length,N+1);
  const rows=g.breach217.overview().rows;
  assert.equal(rows.find(r=>r.label==='Pans menacés').value,'mur nord : '+many(N+1));assert.match(rows.find(r=>r.label==='Lever la menace').value,/^Réparez un seul ouvrage de chaque pan au-dessus de 30 %/);
  // Une seule réparation : il reste deux ouvrages d'un côté et N-2 de l'autre, la menace disparaît.
  repair(walls[2]);g.elapsed+=1;g.breach217.tick();
  assert.deepEqual(g.breach217.threatened(),[]);assert.equal(g.breach217.overview().rows.find(r=>r.label==='Pans menacés').value,'Aucun.');assert.equal(notes.length,1,'pas d’annonce de levée');
  // Nouvel épisode : le pan se reforme, il est annoncé de nouveau, passé le délai de silence du côté.
  weaken(walls[2]);g.elapsed+=30;g.breach217.tick();
  assert.deepEqual(notes,['Le mur nord menace de céder sur '+many(N)+'.','Le mur nord menace de céder sur '+many(N+1)+'.']);
  // Une porte dans le pan est dite.
  const g2=campaign(),put2=builder(g2),notes2=watch(g2),door=gated(put2,6);
  g2.breach217.tick();weaken(door.all);g2.elapsed+=1;g2.breach217.tick();
  assert.deepEqual(notes2,['Le mur sud menace de céder sur '+many(N)+', porte comprise.']);
});

test('menace : le relevé suit l’horloge du jeu, sans tirage ni ressource',()=>{
  const g=campaign(),put=builder(g),walls=line(put,N);weaken(walls);
  const rng=g.random.state,stock=JSON.stringify(g.resources);
  for(let i=0;i<20;i++){g.elapsed+=1;g.breach217.tick();g.breach217.threatened();g.breach217.overview();g.breach217.snapshot();}
  assert.equal(g.random.state,rng,'aucun tirage');assert.equal(JSON.stringify(g.resources),stock);assert.equal(g.breach217.threatened().length,1);
  assert.deepEqual(walls.map(b=>b.health),walls.map(b=>b.maxHealth*RATIO*.5),'le relevé ne touche à aucune santé');
  // Le relevé est branché sur la mise à jour du jeu : la menace apparaît sans appel direct.
  const g2=campaign(),put2=builder(g2),notes=watch(g2);for(let i=0;i<4;i++)g2.update(.2);
  weaken(line(put2,N));for(let i=0;i<6;i++)g2.update(.2);
  assert.equal(count(notes,'Le mur nord menace de céder sur '+many(N)+'.'),1);
});

test('rupture : détruire un ouvrage d’un pan menacé emporte exactement le pan, rien d’autre',()=>{
  // Pan de P ouvrages (un de plus que le minimum, sans dépasser la borne), un ouvrage sain, puis un fragile isolé.
  const P=Math.min(N+1,M),g=campaign(),put=builder(g),walls=line(put,P+2),healthy=walls[P],alone=walls[P+1],far=line(put,N,-4,7);
  const notes=watch(g);g.breach217.tick();assert.equal(notes.length,0);
  weaken(walls.slice(0,P));weaken(alone);weaken(far);g.elapsed+=1;g.breach217.tick();
  assert.equal(count(notes,'Le mur nord menace de céder sur '+many(P)+'.'),1);assert.equal(count(notes,'Le mur sud menace de céder sur '+many(N)+'.'),1);
  const lost=g.stats.buildingsLost,total=g.world.buildings.size,stock=JSON.stringify(g.resources),core=g.core(),coreHealth=core.health,healthBefore=healthy.health,zombies=g.zombies.length,units=g.units.length;
  notes.length=0;kill(g,walls[1]);
  assert.deepEqual(walls.map(b=>b.dead),[...range(P).map(()=>true),false,false],'tout le pan, pas l’ouvrage sain ni le fragile isolé derrière lui');
  assert.equal(g.stats.buildingsLost,lost+P);assert.equal(g.world.buildings.size,total-P);
  for(const b of walls.slice(0,P))assert.equal(g.world.buildings.has(b.id),false);
  assert.equal(healthy.health,healthBefore,'ouvrage sain : santé inchangée');assert.equal(alone.health,alone.maxHealth*RATIO*.5,'fragile isolé : santé inchangée');
  assert.ok(far.every(b=>!b.dead&&b.health===b.maxHealth*RATIO*.5),'un autre pan menacé ne cède pas : aucune chaîne');
  assert.equal(core.dead,false);assert.equal(core.health,coreHealth);assert.equal(g.gameOver,false);
  assert.equal(JSON.stringify(g.resources),stock,'aucune ressource créée');assert.equal(g.zombies.length,zombies);assert.equal(g.units.length,units);
  assert.deepEqual(notes.filter(t=>t.startsWith('Rupture')),['Rupture au nord : '+many(P)+' ont cédé d’un coup.']);
  assert.equal(native(notes),1,'l’annonce de destruction du jeu n’est pas répétée pour chaque ouvrage emporté');assert.equal(notes.length,2);
  assert.equal(Object.hasOwn(g,'notify'),true,'l’annonce du jeu est rendue telle quelle');g.notify('essai');assert.equal(notes.at(-1),'essai');
  // Le relevé est à jour aussitôt : il ne reste que le pan sud.
  assert.deepEqual(g.breach217.threatened().map(p=>p.side),['south']);
  // Ce qui reste tombe ouvrage par ouvrage.
  notes.length=0;kill(g,alone);assert.equal(g.stats.buildingsLost,lost+P+1);assert.equal(healthy.dead,false);assert.equal(count(notes,'Rupture'),0);
});

test('rupture : bornée, les ouvrages les plus proches cèdent, les autres restent debout',()=>{
  // Pan deux fois plus long que la borne : une rupture en emporte M, les M autres restent.
  const L=2*M,g=campaign(),put=builder(g),walls=line(put,L,-6,-7);weaken(walls);
  const notes=watch(g);g.elapsed+=1;g.breach217.tick();assert.equal(g.breach217.threatened()[0].length,L);
  const lost=g.stats.buildingsLost;kill(g,walls[2]);
  // Depuis l'indice 2 : les M ouvrages les plus proches, l'ouest d'abord à distance égale (2, 1, 3, 0, 4, puis 5…).
  const nearest=new Set(range(L).sort((a,b)=>Math.abs(a-2)-Math.abs(b-2)||a-b).slice(0,M));
  assert.deepEqual(walls.map(b=>b.dead),range(L).map(i=>nearest.has(i)));
  // Réglage décidé (6 emportés) : les indices 0 à 5 tombent, les six suivants restent debout.
  assert.deepEqual(walls.map(b=>b.dead),[true,true,true,true,true,true,false,false,false,false,false,false]);
  assert.equal(g.stats.buildingsLost,lost+M);assert.deepEqual(notes.filter(t=>t.startsWith('Rupture')),['Rupture au nord : '+many(M)+' ont cédé d’un coup.']);
  assert.deepEqual(notes.filter(t=>t.startsWith('Rupture')),['Rupture au nord : 6 ouvrages ont cédé d’un coup.']);
  assert.ok(walls.slice(M).every(b=>!b.dead&&b.health===b.maxHealth*RATIO*.5));
  // Les M restants forment encore un pan : il cédera à son tour, mais seulement si l'un d'eux est détruit.
  assert.equal(g.breach217.threatened()[0].length,M);
  kill(g,walls[L-2]);assert.ok(walls.every(b=>b.dead));assert.equal(g.stats.buildingsLost,lost+L);
  assert.deepEqual(Breach.collapse(walls[0],[]),null);
  // Un ouvrage de plus que la borne : exactement un ouvrage du pan reste debout, le plus éloigné.
  const g2=campaign(),put2=builder(g2),w=line(put2,M+1,-6,-7);weaken(w);g2.elapsed+=1;g2.breach217.tick();
  const lost2=g2.stats.buildingsLost;kill(g2,w[0]);
  assert.deepEqual(w.map(b=>b.dead),[...range(M).map(()=>true),false]);assert.equal(g2.stats.buildingsLost,lost2+M);assert.deepEqual(g2.breach217.threatened(),[]);
});

test('rupture : une porte fragile cède avec le pan, une réparation de dernière seconde l’arrête',()=>{
  const g=campaign(),put=builder(g);
  // N-1 palissades, la porte, puis deux palissades : N+2 ouvrages, dont N jusqu'à la porte comprise.
  const {left,gate,right:[c,d],all}=gated(put,-6,N-1,2),a=left[0];
  weaken(all);g.elapsed+=1;g.breach217.tick();assert.equal(g.breach217.threatened()[0].length,N+2);
  // Réparé après le relevé : l'ouvrage sain arrête le pan à l'instant de la chute.
  repair(c);const lost=g.stats.buildingsLost;kill(g,a);
  assert.deepEqual(all.map(x=>x.dead),[...range(N).map(()=>true),false,false]);assert.ok(gate.dead,'la porte cède avec le pan');assert.equal(d.dead,false);
  assert.equal(g.stats.buildingsLost,lost+N);assert.equal(c.health,c.maxHealth*(RATIO+.05));
  // Même relevé, la réparation ne laisse que N-1 ouvrages : la menace est levée avant même le relevé suivant.
  const g2=campaign(),put2=builder(g2),w=line(put2,N+1);weaken(w);g2.elapsed+=1;g2.breach217.tick();repair(w[N-1]);
  const lost2=g2.stats.buildingsLost;kill(g2,w[0]);assert.deepEqual(w.map(x=>x.dead),[true,...range(N).map(()=>false)]);assert.equal(g2.stats.buildingsLost,lost2+1);
  // La porte elle-même peut être l'ouvrage qui tombe.
  const g3=campaign(),put3=builder(g3),third=gated(put3,-6);weaken(third.all);g3.elapsed+=1;g3.breach217.tick();
  const notes=watch(g3);kill(g3,third.gate);assert.ok(third.all.every(b=>b.dead));assert.deepEqual(notes.filter(t=>t.startsWith('Rupture')),['Rupture au nord : '+many(N)+' ont cédé d’un coup.']);
});

test('rupture : jamais sans menace relevée ; un mur d’angle n’emporte qu’un pan, le plus long',()=>{
  const g=campaign(),put=builder(g),walls=line(put,N+1);
  g.breach217.tick();weaken(walls);
  // Fragilisés depuis le dernier relevé : pas encore annoncés, donc pas de rupture.
  const lost=g.stats.buildingsLost;kill(g,walls[0]);assert.deepEqual(walls.map(b=>b.dead),[true,...range(N).map(()=>false)]);assert.equal(g.stats.buildingsLost,lost+1);
  // Angle : rangée de N et colonne de N+1 partageant le coin.
  const g2=campaign(),put2=builder(g2),long=angle(put2,N,N+1);
  weaken(long.row,long.col);g2.elapsed+=1;g2.breach217.tick();assert.equal(g2.breach217.threatened().length,2);
  const notes=watch(g2);kill(g2,long.corner);
  assert.ok(long.col.every(b=>b.dead),'la colonne, plus longue');assert.ok(long.row.slice(0,-1).every(b=>!b.dead),'la rangée ne suit pas');
  assert.equal(notes.filter(t=>t.startsWith('Rupture')&&t.endsWith(' : '+many(N+1)+' ont cédé d’un coup.')).length,1);assert.equal(count(notes,'Rupture'),1);assert.deepEqual(g2.breach217.threatened(),[]);
  // À longueur égale, le pan horizontal.
  const g3=campaign(),put3=builder(g3),even=angle(put3,N,N);
  weaken(even.row,even.col);g3.elapsed+=1;g3.breach217.tick();assert.equal(g3.breach217.threatened().length,2);kill(g3,even.corner);
  assert.ok(even.row.every(b=>b.dead));assert.ok(even.col.slice(1).every(b=>!b.dead));
  // Un ouvrage du bout de la rangée n'emporte que la rangée, coin compris ; la colonne perd son coin et sa menace.
  const g4=campaign(),put4=builder(g4),end=angle(put4,N,N);
  weaken(end.row,end.col);g4.elapsed+=1;g4.breach217.tick();kill(g4,end.row[0]);
  assert.ok(end.row.every(b=>b.dead));assert.ok(end.col.slice(1).every(b=>!b.dead));assert.deepEqual(g4.breach217.threatened(),[]);
});

test('rupture : le centre de commandement n’est jamais emporté, même fragile et aligné',()=>{
  const g=campaign(),put=builder(g),core=g.core(),cells=T.footprint(core);
  // N-1 palissades à l'ouest du centre et N à l'est, sur sa première rangée : 2N ouvrages alignés avec lui.
  const left=range(N-1).map(i=>put('woodWall',-(N-1)+i,0)),right=range(N).map(i=>put('woodWall',cells.width+i,0));
  weaken(left,right);core.health=core.maxHealth*.1;g.elapsed+=1;g.breach217.tick();
  const pans=pansOf(g);assert.deepEqual(pans.map(ids),[right.map(b=>b.id)],'le centre n’est pas un ouvrage de mur : il coupe la ligne');
  assert.ok(g.breach217.threatened().every(p=>!p.ids.includes(core.id)));
  kill(g,right[0]);assert.ok(right.every(b=>b.dead));assert.ok(left.every(b=>!b.dead));
  assert.equal(core.dead,false);assert.equal(core.health,core.maxHealth*.1);assert.equal(g.gameOver,false);assert.equal(g.state,'playing');
});

// Deux campagnes jumelles portant la même ligne ; la seconde est une campagne d'avant la règle.
function twins(n,weak){
  const make=()=>{const g=campaign(),put=builder(g),walls=line(put,n);weaken(weak.map(i=>walls[i]));return {g,walls};};
  const modern=make(),legacy=make();old(legacy.g);legacy.walls=legacy.walls.map(b=>at(legacy.g,b));
  assert.ok(legacy.walls.every(Boolean));assert.equal(legacy.g.breach217.active(),false);
  for(const side of [modern,legacy]){side.g.refreshMetrics(true);side.g.elapsed+=1;side.g.breach217.tick();}
  // Les jumelles partent du même point du flux de hasard du jeu.
  legacy.g.random.state=modern.g.random.state;
  return {modern,legacy};
}

test('sans pan menacé : la destruction d’un mur isolé est exactement celle d’origine',()=>{
  const {modern,legacy}=twins(5,[0,1,3]);
  assert.deepEqual(modern.g.breach217.threatened(),[]);assert.equal(modern.g.random.state,legacy.g.random.state,'jumelles au même point');
  const notes=[watch(modern.g),watch(legacy.g)];
  for(const side of [modern,legacy])kill(side.g,side.walls[1]);
  for(const side of [modern,legacy])assert.deepEqual(side.walls.map(b=>b.dead),[false,true,false,false,false]);
  assert.deepEqual(notes[0],notes[1]);assert.equal(native(notes[0]),1);
  assert.equal(modern.g.random.state,legacy.g.random.state,'mêmes tirages de débris');assert.deepEqual(modern.g.stats,legacy.g.stats);
  assert.deepEqual(modern.g.resources,legacy.g.resources);assert.equal(modern.g.world.buildings.size,legacy.g.world.buildings.size);
  // Un ouvrage qui n'est pas un mur, une cible déjà tombée : chemin d'origine.
  const lost=modern.g.stats.buildingsLost;modern.g.destroyBuilding(modern.walls[1]);assert.equal(modern.g.stats.buildingsLost,lost,'déjà tombé : rien');
});

test('campagne ancienne : aucune rupture, aucune menace, comportement d’origine',()=>{
  // Un pan de M ouvrages : la campagne moderne le perd entier, l'ancienne un ouvrage à la fois.
  const {modern,legacy}=twins(M,range(M)),g=legacy.g,notes=watch(g);
  assert.deepEqual(state(g),{version:1,active:false});assert.deepEqual(g.breach217.threatened(),[]);assert.deepEqual(g.breach217.actions(),[],'aucune activation');
  for(let i=0;i<5;i++){g.elapsed+=1;g.breach217.tick();}assert.equal(notes.length,0,'aucune annonce de menace');
  const view=g.breach217.overview();assert.match(view.summary,/avant cette règle.*ouvrage par ouvrage.*ne s’active pas en cours de campagne/);assert.equal(view.rows.find(r=>r.label==='Pans menacés').value,'Sans objet.');
  const lost=g.stats.buildingsLost;kill(g,legacy.walls[2]);
  assert.deepEqual(legacy.walls.map(b=>b.dead),range(M).map(i=>i===2));assert.equal(g.stats.buildingsLost,lost+1);assert.equal(count(notes,'Rupture'),0);assert.equal(native(notes),1);
  // La campagne ancienne relue reste ancienne.
  const again=JSON.parse(JSON.stringify(g.serialize()));assert.deepEqual(again.expansions127.modules.breach217,{version:1,active:false});
  assert.equal(g.restoreSave(again),true);assert.equal(g.breach217.active(),false);
  // La jumelle moderne, elle, perd tout le pan.
  kill(modern.g,modern.walls[2]);assert.ok(modern.walls.every(b=>b.dead));
});

test('rupture : mêmes statistiques et mêmes tirages que les mêmes chutes une à une',()=>{
  const {modern,legacy}=twins(5,[0,1,2,3,4]);
  assert.ok(N<=5&&M>=5,'un pan de cinq est menacé et cède entier');assert.equal(modern.g.breach217.threatened()[0].length,5);
  assert.equal(modern.g.random.state,legacy.g.random.state);
  const before=modern.g.random.state;kill(modern.g,modern.walls[2]);assert.ok(modern.walls.every(b=>b.dead));
  // Ordre de la rupture : l'ouvrage détruit, puis ses voisins du plus proche au plus lointain.
  for(const i of [2,1,3,0,4])kill(legacy.g,legacy.walls[i]);
  assert.notEqual(modern.g.random.state,before,'les débris sont ceux de la destruction du jeu');
  assert.equal(modern.g.random.state,legacy.g.random.state,'aucun tirage propre à la rupture');
  assert.deepEqual(modern.g.stats,legacy.g.stats);assert.deepEqual(modern.g.resources,legacy.g.resources);
  assert.equal(modern.g.world.buildings.size,legacy.g.world.buildings.size);assert.equal(modern.g.particles.length,legacy.g.particles.length);
});

// Enceinte réelle autour du centre, comme dans le test du repli : porte au nord, sur deux cases.
function enclose(g){
  const core=g.core(),cells=T.footprint(core),r=3,placed=[];
  const put=(type,gx,gy)=>{const W=core.constructor,b=new W(g.nextId++,type,gx,gy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);placed.push(b);return b;};
  const x0=cells.x-r,x1=cells.x+cells.width+r-1,y0=cells.y-r,y1=cells.y+cells.height+r-1,gateX=cells.x;
  for(let x=x0;x<=x1;x++){if(x===gateX)put('gate',x,y0);else if(x!==gateX+1)put('woodWall',x,y0);put('woodWall',x,y1);}
  for(let y=y0+1;y<y1;y++){put('woodWall',x0,y);put('woodWall',x1,y);}
  g.world.navigationVersion++;g.refreshMetrics(true);
  const north=placed.filter(b=>b.gy===y0).sort((a,b)=>a.gx-b.gx);
  return {placed,north,gate:placed.find(b=>T.isGate(b))};
}
const validSave=g=>{const saved=JSON.parse(JSON.stringify(g.serialize()));assert.doesNotThrow(()=>require('../src/save.js').validate(JSON.parse(JSON.stringify(saved))));return saved;};

test('sauvegarde : un pan menacé n’est pas réannoncé à la reprise, et il peut toujours rompre',()=>{
  const g=campaign(),{north}=enclose(g),notes=watch(g);
  g.breach217.tick();weaken(north);g.elapsed+=1;g.breach217.tick();
  assert.deepEqual(notes.filter(t=>t.startsWith('Le mur')),['Le mur nord menace de céder sur '+north.length+' ouvrages, porte comprise.']);
  const saved=validSave(g);assert.deepEqual(saved.expansions127.modules.breach217,{version:1,active:true});
  assert.equal(g.restoreSave(JSON.parse(JSON.stringify(saved))),true);notes.length=0;
  assert.deepEqual(g.breach217.threatened(),[],'rien avant le premier relevé');
  // Avant le premier relevé de la reprise, aucune rupture n'est possible ; ensuite le pan est relevé en silence.
  for(let i=0;i<4;i++){g.elapsed+=1;g.breach217.tick();}
  assert.equal(count(notes,'Le mur'),0,'la reprise ne répète pas la menace');assert.equal(g.breach217.threatened().length,1);assert.equal(g.breach217.threatened()[0].length,north.length);
  const line=north.map(b=>at(g,b)),lost=g.stats.buildingsLost;kill(g,line[1]);
  const fallen=line.filter(b=>b.dead).length;assert.equal(fallen,Math.min(R.maxCollapse,line.length));assert.equal(g.stats.buildingsLost,lost+fallen);
  assert.equal(count(notes,'Rupture au nord : '+fallen+' ouvrages ont cédé d’un coup.'),1);
  // La sauvegarde reste valide après une rupture et se relit.
  const after=validSave(g);assert.equal(after.buildings.length,saved.buildings.length-fallen);
  assert.equal(g.restoreSave(after),true);assert.equal(g.stats.buildingsLost,lost+fallen);assert.equal(g.breach217.active(),true);
  // Un état corrompu est refusé avant toute modification de la partie.
  const broken=validSave(g);broken.expansions127.modules.breach217.active='oui';assert.throws(()=>g.restoreSave(broken),/Brèche 217/);
  // Une nouvelle campagne après une ancienne redevient active, sans pan hérité.
  old(g);assert.equal(g.breach217.active(),false);g.startNew('standard','17117');assert.equal(g.breach217.active(),true);assert.deepEqual(g.breach217.threatened(),[]);
});

test('rupture et repli : une annonce de destruction, une de rupture, une de brèche',()=>{
  const g=campaign(true),{north}=enclose(g),notes=watch(g);
  g.fallbackOrder.tick();g.phase='assault';weaken(north);g.elapsed+=1;g.breach217.tick();notes.length=0;
  kill(g,north[2]);g.elapsed+=10;g.fallbackOrder.tick();g.breach217.tick();
  const fallen=north.filter(b=>b.dead).length;assert.equal(fallen,Math.min(R.maxCollapse,north.length));
  assert.equal(native(notes),1);assert.equal(count(notes,'Rupture au nord : '+fallen+' ouvrages'),1);assert.equal(count(notes,'Brèche au '),1,'le repli n’annonce qu’une brèche pour tout le pan');
  assert.ok(notes.length<=4,'tout tient dans les quatre lignes de notification : '+notes.join(' | '));
  assert.deepEqual(notes.slice(0,2),[north[2].def.name+' détruit — le secteur est ouvert !','Rupture au nord : '+fallen+' ouvrages ont cédé d’un coup.']);
  // Le repli a enregistré chaque ouvrage tombé comme une brèche ouverte du secteur nord.
  assert.equal(g.fallbackOrder.sectors().find(s=>s.id==='north').breaches,fallen);
  g.elapsed+=10;g.fallbackOrder.tick();g.breach217.tick();assert.equal(count(notes,'Brèche au '),1);assert.equal(count(notes,'Rupture'),1);
});

test('brèche 217 : source sans hasard, sans stock, sans écriture de santé',()=>{
  const source=fs.readFileSync(path.join(root,'src/breach217.js'),'utf8');
  for(const forbidden of ['Math.random','.random.','.random(','random','localStorage','Date.now','resources','setTimeout','spawnZombie','damageBuilding','.dead=','.dead =','world.remove','buildingsLost'])assert.equal(source.includes(forbidden),false,forbidden);
  for(const write of [/\.health\s*[-+*]?=[^=]/,/\.progress\s*[-+]?=[^=]/,/\.corpseLoad\s*[-+]?=[^=]/])assert.doesNotMatch(source,write);
  assert.equal(source.match(/g\.destroyBuilding\(/g).length,1,'les ouvrages emportés passent par la destruction du jeu');
  assert.ok(source.includes('C.BATTLEFIELD_RULES.fragileWallRatio'));assert.equal(/fragileWallRatio\s*[:=]\s*[\d.]/.test(source),false,'pas de second seuil');
  const game=fs.readFileSync(path.join(root,'src/game.js'),'utf8');assert.equal(game.includes('breach217'),false,'le moteur n’est pas modifié');
});
