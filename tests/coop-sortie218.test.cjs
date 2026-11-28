'use strict';
// Coopération, tranche C7 (specs/cooperation, décision D1-B) : chef de sortie dans une seconde bulle régionale
// détachée de `g.player` (src/coop-sortie218.js), avancée par l'enveloppe de `update` de l'hôte (src/coop-host217.js).
// Couvre : admission (un seul chef de sortie), isolement des bulles (faune, poursuites, véhicules), prélèvements et
// registre des contacts partagés, sac versé au dépôt au retour, à la mort et compté à chaque sauvegarde, image
// régionale bornée et peintre sans effet, solo inchangé.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),S=require('../src/coop-session217.js'),Sortie=require('../src/coop-sortie218.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const ROOT=path.join(__dirname,'..'),K=C.CoopSortie217Rules,P=217,CODE='SORTIE18';
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const stamp=d=>{const c={...d};delete c.timestamp;return JSON.stringify(c);};

function campaign(){
 const {g,doc}=bootDocument134();
 globalThis.DeadwallCoopHost217.install(g,doc);globalThis.DeadwallCoopUI217.install(g,doc);
 g.startNew('standard','17117');g.campaignIntro132?.skip?.();
 return{g,doc};
}
function session(g){
 const out=[],link={send:m=>out.push(JSON.parse(JSON.stringify(m))),close(){}};
 assert.equal(g.coopHost217.open({link,code:CODE}).ok,true);g.coopHost217.receive({type:'hosting',protocol:P,code:CODE});
 const guests=new Map();
 const deliver=()=>{for(const m of out.splice(0))if(m.type==='send')guests.get(m.peer)?.receive(m.message);};
 const seat=(peer,name,role)=>{const x=S.createGuest({name,role});guests.set(peer,x);g.coopHost217.receive({type:'relay',protocol:P,peer,message:x.hello(CODE)});const replies=out.filter(m=>m.peer===peer).map(m=>m.message);deliver();return{guest:x,replies};};
 const push=(peer,kind,data)=>{deliver();const m=guests.get(peer).intent(kind,data);assert.ok(m,kind);return g.coopHost217.receive({type:'relay',protocol:P,peer,message:m});};
 return{out,deliver,seat,push};
}
const unit=(dx,dy)=>{const d=Math.hypot(dx,dy);return d?{x:+(dx/d*.999).toFixed(3),y:+(dy/d*.999).toFixed(3)}:{x:0,y:0};};
const so=g=>g.coopHost217.sorties()[0];

test('C7 admission : un chef de sortie en région, détaché de g.player ; un seul à la fois ; image régionale bornée',()=>{
 const {g}=campaign(),s=session(g);
 const player={x:g.player.x,y:g.player.y};
 const {guest,replies}=s.seat(1,'Sam','sortie');
 assert.equal(replies[0].type,'welcome');assert.equal(replies[0].role,'sortie');assert.match(replies[0].resume,/^[A-Z0-9]{16}$/,'jeton de reprise (C8)');
 assert.equal(guest.overview().status,'seated');assert.equal(g.coopHost217.live(),true,'D3 : le temps continue');
 const b=so(g),h=globalThis.DeadwallAtlasProjection.home(g);
 assert.ok(b&&b.start,'bulle placée devant une jonction');
 const dx=Math.max(0,h.minX-b.x,b.x-h.maxX),dy=Math.max(0,h.minY-b.y,b.y-h.maxY);assert.ok(Math.hypot(dx,dy)<=K.avatar.homeReach&&Math.hypot(dx,dy)>0,'hors de D-17, à ses portes');
 assert.equal(b.mag,K.avatar.magazine,'chargeur pris au stock de l’hôte');
 // La bulle de l'hôte reste la sienne : ni sortie déclenchée, ni Commandant déplacé.
 assert.equal(g.frontier.active(),false);assert.equal(g.player.regionAbsent,false);assert.deepEqual({x:g.player.x,y:g.player.y},player);
 // Second chef de sortie refusé (`role`) ; un responsable de district peut toujours s'asseoir.
 assert.equal(s.seat(2,'Noé','sortie').replies[0].reason,'role');
 assert.equal(s.seat(3,'Lise','district').replies[0].type,'welcome');
 assert.deepEqual(g.coopHost217.overview().guests.map(x=>[x.seat,x.role]),[[1,'sortie'],[2,'district']],'le siège refusé est rendu');
 // Ordre (siège, numéro) : deux visées dans le même pas, la seconde l'emporte ; le Commandant ne bouge pas.
 s.push(1,'aim',{a:-1});s.push(1,'aim',{a:1});s.push(1,'move',{x:0,y:-1});
 for(let i=0;i<30;i++)g.update(1/30);
 assert.equal(+so(g).a.toFixed(2),1);assert.ok(so(g).y<b.y-2,'la seconde bulle marche');assert.deepEqual({x:g.player.x,y:g.player.y},player);
 // Image : forme régionale, bornée, sans référence.
 const view=g.coopHost217.view(1);
 for(const k of ['region','self','sites','enemies','bag','home','wave','phase','host'])assert.ok(k in view,k);
 assert.ok(view.sites.length<=K.frame.maxSites&&view.enemies.length<=K.frame.maxEnemies);
 assert.ok(Buffer.byteLength(JSON.stringify(view))<=C.CoopPlay217Rules.relay.hostChars);
 view.self.x=-1;view.sites.length=0;assert.notEqual(so(g).x,-1);
 s.deliver();assert.equal(guest.view().region,1,'l’invité reçoit l’image régionale');
});

test('C7 isolement et partage : faune, véhicule et voiture intacts ; contact abattu et fouille au registre de l’hôte ; sac au dépôt au retour',()=>{
 const {g}=campaign(),s=session(g);
 const before=g.frontier.snapshot(),car=JSON.stringify(g.expeditions?.car?.()||null);
 s.seat(1,'Sam','sortie');
 const keys=Object.keys(g.serialize()).sort();
 const w=g.frontier.world(),start=so(g).start;
 // Lieu occupé le plus proche des portes (graine 17117 : un entrepôt à ~320 m).
 const site=w.nearPOI(start.x,start.y,400).filter(p=>w.threatCount(p)>0).sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y))[0];
 assert.ok(site,'lieu occupé à portée');
 const trail=[],seenHost=new Set();
 for(let i=0;i<30*140;i++){
  const b=so(g);if(i%6===0)trail.push({x:b.x,y:b.y});if(Math.hypot(site.x-b.x,site.y-b.y)<=14)break;
  if(i%5===0)s.push(1,'move',unit(site.x-b.x,site.y-b.y));g.update(1/30);
 }
 s.push(1,'move',{x:0,y:0});
 assert.ok(Math.hypot(site.x-so(g).x,site.y-so(g).y)<=14,'arrivée au lieu');
 // Combat : les contacts de la seconde bulle chassent son seul avatar et ne sont jamais ceux de la bulle de l'hôte.
 let hit=null;
 for(let i=0;i<30*12;i++){const b=so(g),e=b.contacts.find(q=>q.hp>0);if(i%6===0){if(e){hit=hit||e.id;s.push(1,'aim',{a:Math.atan2(e.y-b.y,e.x-b.x)});s.push(1,'fire',{on:true});}else s.push(1,'fire',{on:false});}
  for(const q of g.frontier.contacts())seenHost.add(q.id);g.update(1/30);}
 s.push(1,'fire',{on:false});
 assert.ok(hit,'un contact est apparu au lieu');assert.equal(seenHost.has(hit),false,'aucun contact partagé entre bulles');
 assert.equal(g.frontier.enemyHealth(hit),0,'contact abattu inscrit au registre de l’hôte');
 assert.equal(g.frontier.snapshot().kills,before.kills+1);
 assert.equal(Object.hasOwn(g.frontier.snapshot().tracks,hit),false,'aucune trace laissée dans la bulle de l’hôte');
 assert.equal(g.frontier.recordContact218(hit,10),false,'un contact abattu ne revit pas');
 // Fouille : prélèvement partagé (mêmes contenants, même carnet).
 const stock0=g.frontier.siteStock(site.id),taken0=Object.keys(g.frontier.snapshot().taken).length;
 s.push(1,'search',{on:true});for(let i=0;i<30*15;i++)g.update(1/30);s.push(1,'search',{on:false});g.update(1/30);
 const bag=so(g).carry,load=C.RESOURCE_KEYS.reduce((n,k)=>n+(k==='ammo'?0:bag[k]),0);
 assert.ok(load>0&&load<=K.avatar.carry+1e-6,'sac rempli dans sa capacité : '+load);
 const stock1=g.frontier.siteStock(site.id);
 assert.ok(Math.abs(C.bagTotal(stock0.free)-C.bagTotal(stock1.free)-load)<1e-6,'le lieu perd exactement ce que le sac gagne');
 assert.ok(Object.keys(g.frontier.snapshot().taken).length>taken0,'prélèvements au carnet de l’hôte');
 // D4 : sauvegarde sans clé nouvelle ; sac et chargeur comptés au stock du dépôt.
 const saved=g.serialize();assert.deepEqual(Object.keys(saved).sort(),keys);assert.ok(!/sortie218|guest217/.test(JSON.stringify(saved)));
 for(const k of C.RESOURCE_KEYS)assert.equal(saved.resources[k],Math.min(Math.max(g.storage,g.resources[k]),g.resources[k]+(bag[k]||0)),k);
 // Isolement : faune, véhicule et voiture de l'hôte inchangés par la seconde bulle.
 const after=g.frontier.snapshot();
 assert.deepEqual(after.wildlife165,before.wildlife165,'faune');assert.deepEqual(after.car,before.car,'voiture régionale');
 assert.equal(JSON.stringify(g.expeditions?.car?.()||null),car,'véhicule de la cité');assert.equal(after.active,false);
 // Retour par le même chemin : le sac est versé au dépôt aux portes de D-17 (dans la capacité de stockage).
 const res0={...g.resources};let k=trail.length-1;
 for(let i=0;i<30*140&&k>=0;i++){const b=so(g),p=trail[k];if(Math.hypot(p.x-b.x,p.y-b.y)<=.6){k--;continue;}if(i%5===0)s.push(1,'move',unit(p.x-b.x,p.y-b.y));g.update(1/30);}
 s.push(1,'move',{x:0,y:0});g.update(1/30);
 const back=so(g).carry;assert.ok(C.RESOURCE_KEYS.every(r=>r==='ammo'||back[r]<1e-6||g.resources[r]>=g.storage-1e-6),'sac vidé au dépôt');
 assert.ok(C.RESOURCE_KEYS.filter(r=>r!=='ammo'&&bag[r]>0).some(r=>g.resources[r]>res0[r]),'le dépôt a reçu le sac');
});

test('C7 mort du chef de sortie : sac versé au dépôt, retour aux portes ; départ : sac rendu, bulle retirée',()=>{
 const {g}=campaign();
 const poured=[];const b=Sortie.createBubble(g,{seat:1,name:'Sam',pour:bag=>{poured.push({...bag});let n=0;for(const k of C.RESOURCE_KEYS){n+=bag[k]||0;bag[k]=0;}return n;}});
 assert.ok(b);const start=b.start(),ammo=g.resources.ammo;
 assert.equal(b.hurt(500),false,'invulnérable à l’arrivée');
 b.intent('move',{x:0,y:-1});for(let i=0;i<Math.ceil(K.avatar.invulnerable*30)+3;i++)b.step(1/30);b.intent('move',{x:0,y:0});
 assert.ok(b.pose().y<start.y-1);
 assert.equal(b.hurt(500),true);assert.equal(b.pose().dead,true);
 assert.equal(poured.length,1);assert.equal(poured[0].ammo,K.avatar.magazine,'chargeur rendu au dépôt à la mort');
 for(let i=0;i<Math.ceil(K.avatar.respawnSeconds*30)+3;i++)b.step(1/30);
 assert.equal(b.pose().dead,false);assert.deepEqual({x:b.pose().x,y:b.pose().y},{x:start.x,y:start.y},'retour aux portes');
 assert.ok(g.resources.ammo<=ammo,'aucune munition créée');
 assert.ok(b.dispose()>=0);assert.equal(poured.length,2);assert.equal(b.dispose(),0,'déjà rendu');
 // Sans les accesseurs régionaux, aucune bulle (le rôle est alors refusé par l'hôte).
 assert.equal(Sortie.createBubble({frontier:{world:()=>null}},{seat:1}),null);
});

test('C7 solo inchangé : sans session, la sauvegarde et la région ne voient rien ; registre gardé',()=>{
 const {g}=campaign();
 const a=stamp(g.serialize());
 for(let i=0;i<30;i++)g.update(1/30);
 // Une session ouverte sans invité ne change rien, et le registre refuse les identifiants illisibles.
 const b0=stamp(g.serialize());const s=session(g);assert.equal(stamp(g.serialize()),b0);assert.equal(g.coopHost217.live(),false);
 for(const bad of [null,'P0001',':e1','P9999:e0','x:e1'])assert.equal(g.frontier.recordContact218(bad,1),false,String(bad));
 assert.equal(g.frontier.recordContact218('P0001:e0',-1),false,'santé négative');
 assert.equal(stamp(g.serialize()),b0,'aucune écriture');
 g.coopHost217.close();assert.ok(a.length>0);
 // Câblage : script public après les vues de l'invité ; aucune lecture par la simulation solo.
 const html=read('index.html');assert.ok(html.indexOf('src/coop-sortie218.js')>html.indexOf('src/coop-views218.js'));
 assert.ok(read('sw.js').includes('"src/coop-sortie218.js"'));
 const src=read('src/coop-sortie218.js');assert.ok(!/Math\.random|Date\.now|setTimeout|setInterval|requestAnimationFrame/.test(src),'ni tirage ni horloge');
 for(const file of ['src/game.js','src/frontier.js'])assert.ok(!read(file).includes('DeadwallCoopSortie218'),file);
});

test('C7 peintre de l’invité en région : dessine l’image sans la modifier ; bandeau lisible',()=>{
 const deep=o=>{if(o&&typeof o==='object'){Object.freeze(o);for(const v of Object.values(o))deep(v);}return o;};
 const cur=deep({v:2,region:1,scale:12,radius:70,self:{x:10,y:20,a:.5,hp:80,max:100,dead:0,respawn:0,mag:9,reload:0,speed:3.5,inside:null},bag:{scrap:12},load:12,cap:40,search:['P0001','Entrepôt','scrap'],note:'',kills:1,
  home:[0,0,5,5],atHome:0,sites:[['P0001',12,25,10,8,.3,'Entrepôt','warehouse',30,1],['P0002',40,40,6,6,0,'?','house',0,0]],enemies:[['P0001:e0',14,22,50,60,2]],shots:[[10,20,14,22]],regionHost:[0,0,0],wave:3,phase:'calm',ammo:120,host:{away:0,dead:0,dossier:0}});
 const calls=[];const ctx=new Proxy({},{get:(t,k)=>k==='canvas'?{width:800,height:600}:(...a)=>{calls.push(k);},set:()=>true});
 assert.equal(Sortie.paint(ctx,{prev:null,cur,t:1,self:cur.self,width:800,height:600}),true);
 assert.ok(calls.includes('arc')&&calls.includes('fillRect')&&calls.includes('fillText'));
 assert.equal(Sortie.paint(ctx,{cur:{v:2,self:{x:0,y:0}}}),false,'image de cité : autre peintre');
 const text=Sortie.hud(cur);assert.match(text,/RÉGION/);assert.match(text,/Sac 12\/40/);assert.match(text,/Fouille : Entrepôt/);
});

test('C7 deux bulles en région : poursuites séparées, aucun contact dans les deux bulles, Commandant mû par son seul clavier',()=>{
 const {g}=campaign(),s=session(g),size=(g.local||C.LOCAL_MAP217).size;
 g.player.x=size/2;g.player.y=30;assert.equal(g.frontier.enter(),true,'le Commandant sort par le nord');
 s.seat(1,'Sam','sortie');
 const w=g.frontier.world(),start=so(g).start,site=w.nearPOI(start.x,start.y,400).filter(p=>w.threatCount(p)>0).sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y))[0];
 // Le Commandant marche vers l'ouest (clavier de l'hôte) ; le chef de sortie va au lieu occupé (intentions).
 g.input.keys.add('KeyA');
 let both=0,mine=0,drift=0;
 for(let i=0;i<30*80;i++){
  const b=so(g);if(i%5===0)s.push(1,'move',Math.hypot(site.x-b.x,site.y-b.y)<=14?{x:0,y:0}:unit(site.x-b.x,site.y-b.y));
  const host=g.frontier.position();g.update(1/30);
  drift=Math.max(drift,Math.abs(g.frontier.position().y-host.y));
  const ids=new Set(g.frontier.contacts().map(e=>e.id));mine=Math.max(mine,so(g).contacts.length);
  for(const e of so(g).contacts)if(ids.has(e.id))both++;
 }
 g.input.keys.delete('KeyA');
 assert.equal(both,0,'aucun contact vivant dans les deux bulles');
 assert.ok(mine>0,'la seconde bulle a eu ses contacts');
 assert.ok(drift<.5,'le Commandant ne suit pas les intentions de l’invité');
 assert.equal(g.frontier.active(),true);assert.equal(g.player.regionAbsent,true);
 assert.ok(g.frontier.position().x<start.x-20,'le Commandant a marché de son côté');
});
