'use strict';
// Coopération hôte/invités, tranches C2 à C5 (specs/cooperation) : relais 217, session de bout en bout,
// responsable de district (D1, D4, D5), temps continu (D3), image bornée (D7), peintre de l'invité sans effet.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{once}=require('node:events');
const {WebSocket}=require('ws');
const C=require('../src/core.js'),S=require('../src/coop-session217.js'),UI=require('../src/coop-ui217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const ROOT=path.join(__dirname,'..'),R=C.CoopPlay217Rules,P=217,CODE='DEAD17WL';
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');

// ---------- Relais (C2) ----------
async function relay(t){
 const {createCoopRelay}=await import('../scripts/coop-server.mjs');
 const server=createCoopRelay({port:0,host:'127.0.0.1'});await once(server,'listening');const sockets=[];
 t.after(async()=>{for(const s of sockets)s.terminate();for(const s of server.clients)s.terminate();await new Promise(r=>server.close(r));});
 const url='ws://127.0.0.1:'+server.address().port;
 async function client(){const c=new WebSocket(url);sockets.push(c);c.inbox=[];c.on('message',d=>c.inbox.push(JSON.parse(String(d))));await once(c,'open');return c;}
 return{url,client};
}
function next(c,predicate,ms=2000){
 return new Promise((resolve,reject)=>{
  const found=c.inbox.findIndex(predicate);if(found>=0){resolve(c.inbox.splice(found,1)[0]);return;}
  const timer=setTimeout(()=>{c.off('message',read);reject(Error('réponse du relais absente'));},ms);
  function read(){const i=c.inbox.findIndex(predicate);if(i>=0){clearTimeout(timer);c.off('message',read);resolve(c.inbox.splice(i,1)[0]);}}
  c.on('message',read);
 });
}
const quiet=ms=>new Promise(r=>setTimeout(r,ms));
const json=(c,m)=>c.send(JSON.stringify(m));
const hello=(code=CODE,role='district',name='Lise')=>({type:'hello',protocol:P,code,name,role});

test('C2 relais 217 : salle par code, routage hôte ↔ invités seulement, refus et fermeture',async t=>{
 const {client}=await relay(t),host=await client(),a=await client(),b=await client(),c=await client(),d=await client(),intrus=await client();
 json(host,{type:'host',protocol:P,code:CODE});assert.deepEqual(await next(host,m=>m.type==='hosting'),{type:'hosting',protocol:P,code:CODE});
 json(intrus,{type:'host',protocol:P,code:CODE});assert.equal((await next(intrus,m=>m.type==='refused')).reason,'taken');
 json(intrus,hello('ZZZZ99'));assert.equal((await next(intrus,m=>m.type==='refused')).reason,'absent');
 json(intrus,{...hello(),role:'commandant'});assert.equal((await next(intrus,m=>m.type==='refused')).reason,'invalid');
 json(a,hello());const relayed=await next(host,m=>m.type==='relay');
 assert.deepEqual(relayed,{type:'relay',protocol:P,peer:1,message:hello()});
 json(host,{type:'send',protocol:P,peer:1,message:{type:'welcome',protocol:P,seat:1,role:'district',name:'Lise',tick:0}});
 assert.equal((await next(a,m=>m.type==='welcome')).seat,1);
 // Une intention est réécrite champ par champ ; un champ ajouté ou une vitesse trop grande ne passent pas.
 json(a,{type:'intent',protocol:P,seq:1,kind:'move',data:{x:0,y:1,speed:999}});
 json(a,{type:'intent',protocol:P,seq:2,kind:'move',data:{x:3,y:0}});
 json(a,{type:'intent',protocol:P,seq:3,kind:'fire',data:{on:true}});
 assert.deepEqual(await next(host,m=>m.type==='relay'),{type:'relay',protocol:P,peer:1,message:{type:'intent',protocol:P,seq:3,kind:'fire',data:{on:true}}});
 // Un invité ne peut ni émettre une image, ni parler à la place de l'hôte.
 json(a,{type:'frame',protocol:P,tick:9,seat:1,ack:0,view:{}});json(a,{type:'send',protocol:P,peer:1,message:{type:'frame',protocol:P}});
 json(host,{type:'send',protocol:P,peer:1,message:{type:'state',protocol:P}});
 await quiet(120);assert.equal(host.inbox.filter(m=>m.type==='relay').length,0);assert.equal(a.inbox.length,0);
 // Images : budget propre à chaque invité, l'excédent est perdu.
 for(let tick=1;tick<=40;tick++)json(host,{type:'send',protocol:P,peer:1,message:{type:'frame',protocol:P,tick,seat:1,ack:0,view:{n:tick}}});
 await quiet(250);const frames=a.inbox.filter(m=>m.type==='frame');assert.ok(frames.length>=R.relay.framesPerSecond-1&&frames.length<=R.relay.framesPerSecond+4,'images : '+frames.length);
 a.inbox.length=0;
 // Trois invités au plus dans une salle.
 json(b,hello(CODE,'district','B'));json(c,hello(CODE,'district','C'));await next(host,m=>m.type==='relay'&&m.peer===2);await next(host,m=>m.type==='relay'&&m.peer===3);
 json(d,hello(CODE,'district','D'));assert.equal((await next(d,m=>m.type==='refused')).reason,'full');
 // Départ d'un invité : l'hôte l'apprend ; fermeture de l'hôte : chaque invité restant reçoit `closed`.
 b.close();assert.deepEqual(await next(host,m=>m.type==='gone'),{type:'gone',protocol:P,peer:2});
 host.close();await next(a,m=>m.type==='closed');await next(c,m=>m.type==='closed');
});

test('C2 relais : la présence 200 et le 217 coexistent sur le même relais sans se voir',async t=>{
 const {client}=await relay(t),p1=await client(),p2=await client(),host=await client(),guest=await client();
 for(const p of [p1,p2])json(p,{type:'join',room:'salle',name:'P'});await next(p1,m=>m.type==='joined');await next(p2,m=>m.type==='joined');
 json(host,{type:'host',protocol:P,code:CODE});await next(host,m=>m.type==='hosting');json(guest,hello());await next(host,m=>m.type==='relay');
 json(p1,{type:'ping',room:'salle',x:10,y:20});assert.equal((await next(p2,m=>m.type==='ping')).x,10);
 // Un hôte 217 ne rejoint pas une salle de présence ; un membre de présence ne parle pas 217.
 json(host,{type:'ping',room:'salle',x:1,y:1});json(p1,hello());await quiet(120);
 assert.equal(p2.inbox.filter(m=>m.type==='ping').length,0);assert.equal(host.inbox.filter(m=>m.type==='relay').length,0);
});

// ---------- Hôte dans une vraie partie (C3, C4, C5) ----------
function campaign(){
 const {g,doc}=bootDocument134();
 assert.equal(globalThis.DeadwallCoopHost217.install(g,doc),true);globalThis.DeadwallCoopUI217.install(g,doc);
 g.startNew('standard','17117');g.campaignIntro132?.skip?.();
 return{g,doc};
}
// Session dans le même processus : un lien factice entre l'adaptateur hôte et des invités C1.
function seatGuests(g,names=['Lise']){
 const out=[],link={send:m=>out.push(JSON.parse(JSON.stringify(m))),close(){}};
 assert.equal(g.coopHost217.open({link,code:CODE}).ok,true);g.coopHost217.receive({type:'hosting',protocol:P,code:CODE});
 const guests=names.map((name,i)=>({peer:i+1,guest:S.createGuest({name,role:'district'})}));
 const deliver=()=>{for(const m of out.splice(0))if(m.type==='send')guests.find(x=>x.peer===m.peer)?.guest.receive(m.message);};
 for(const x of guests)g.coopHost217.receive({type:'relay',protocol:P,peer:x.peer,message:x.guest.hello(CODE)});
 deliver();
 const push=(i,kind,data)=>{const m=guests[i].guest.intent(kind,data);assert.ok(m,kind);return g.coopHost217.receive({type:'relay',protocol:P,peer:guests[i].peer,message:m});};
 return{out,guests,deliver,push};
}
const steps=(g,n,dt=1/30)=>{for(let i=0;i<n;i++)g.update(dt);};
const stamp=d=>{const c={...d};delete c.timestamp;return JSON.stringify(c);};

test('C3 hôte : une session sans invité ne change rien ; image bornée sans écriture ni référence',()=>{
 const {g}=campaign();
 assert.equal(g.coopHost217.live(),false);assert.equal(g.coopHost217.overview().status,'idle');
 const before=stamp(g.serialize());
 const {guests,deliver}=seatGuests(g);
 assert.equal(guests[0].guest.overview().status,'seated');assert.equal(g.coopHost217.live(),true);
 // Lire l'image ne modifie pas la partie (hors chargeur pris au dépôt, compté dans la sauvegarde).
 const view=g.coopHost217.view(1),saved=stamp(g.serialize());assert.equal(saved,before,'la sauvegarde compte le chargeur : identique à celle d’avant l’arrivée');
 assert.equal(stamp(g.serialize()),saved);
 for(const k of ['wave','phase','b','z','masses','self','host','districts','pings'])assert.ok(k in view,k);
 assert.ok(view.z.length<=R.frame.maxZombies&&view.b.length<=R.frame.maxBuildings);
 assert.ok(Buffer.byteLength(JSON.stringify(view))<=R.relay.hostChars);
 view.self.x=-999;view.b.length=0;assert.notEqual(g.coopHost217.avatars()[0].x,-999);
 steps(g,30);deliver();const v=guests[0].guest.view();assert.ok(v&&v.self&&guests[0].guest.overview().tick>0,'l’invité a reçu une image');
});

test('C3 hôte : cadence des images bornée et ordre des pas croissant',()=>{
 const {g}=campaign();const s=seatGuests(g);
 const frames=[];const send=s.out;steps(g,60);for(const m of send)if(m.type==='send'&&m.message.type==='frame')frames.push(m.message.tick);
 assert.ok(frames.length>=R.frame.hz*2-2&&frames.length<=R.frame.hz*2+1,'images en 2 s : '+frames.length);
 assert.deepEqual([...frames].sort((a,b)=>a-b),frames);
});

test('C4 responsable de district : se déplace, tire sur le stock de l’hôte, est ciblé par les infectés',()=>{
 const {g}=campaign();const {push,deliver}=seatGuests(g);
 const av=()=>g.coopHost217.avatars()[0],start={x:av().x,y:av().y},stock=g.resources.ammo;
 assert.equal(av().carry.ammo,R.avatar.magazine,'chargeur pris au dépôt');
 push(0,'move',{x:1,y:0});steps(g,30);assert.ok(av().x>start.x+40,'déplacement par intention');
 push(0,'move',{x:0,y:0});steps(g,Math.ceil(R.avatar.invulnerable*30));
 // Un infecté collé à l'avatar l'attaque comme un défenseur.
 g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=av().x+16;z.y=av().y;z.attackCooldown=0;
 const health=av().health;steps(g,60);
 assert.ok(av().health<health||av().dead,'l’avatar a été frappé');
 assert.equal(g.units.some(u=>u.guest217),false,'l’avatar ne reste jamais dans g.units');
 // Tir : visée vers l'infecté, munitions prises dans le chargeur.
 const z2=g.zombies.find(q=>!q.dead);if(z2){push(0,'aim',{a:Math.atan2(z2.y-av().y,z2.x-av().x)});}
 push(0,'fire',{on:true});const mag=av().carry.ammo;steps(g,6);
 assert.ok(av().carry.ammo<mag||av().dead,'le chargeur se vide');
 push(0,'fire',{on:false});steps(g,2);deliver();
 assert.ok(g.resources.ammo<=stock,'aucune munition créée');
});

test('C4 D4 : sauvegarde sans clé nouvelle, chargeur compté au dépôt ; départ et mort rendent le sac',()=>{
 const {g}=campaign();const {push}=seatGuests(g);
 const keys=Object.keys(g.serialize()).sort();
 push(0,'fire',{on:true});steps(g,20);push(0,'fire',{on:false});steps(g,2);
 const av=g.coopHost217.avatars()[0];assert.ok(av.carry.ammo>0&&av.carry.ammo<R.avatar.magazine);
 const seated=g.serialize();assert.deepEqual(Object.keys(seated).sort(),keys);
 assert.ok(!JSON.stringify(seated).includes('guest217'),'aucun avatar dans la sauvegarde');
 assert.equal(seated.resources.ammo,Math.min(g.storage,g.resources.ammo+av.carry.ammo),'le chargeur est compté au dépôt');
 g.coopHost217.receive({type:'gone',protocol:P,peer:1});
 assert.equal(g.coopHost217.avatars().length,0);assert.equal(g.coopHost217.live(),false);
 assert.equal(stamp(g.serialize()),stamp(seated),'départ : sac versé au dépôt, aucune perte ni duplication');
});

test('C4 : mort de l’avatar, retour au dépôt ; rôle de sortie refusé tant que C7 manque ; Commandant unique',()=>{
 const {g}=campaign();const s=seatGuests(g);
 const av=()=>g.coopHost217.avatars()[0];
 g.damageUnit(g.coopHost217.avatars()[0],1);assert.equal(av().health,R.avatar.health,'invulnérable à l’arrivée');
 steps(g,Math.ceil(R.avatar.invulnerable*30)+2);
 // `damageUnit` est le chemin des coups des infectés : l'avatar y est reconnu sans toucher aux pertes de la cité.
 const lost=g.stats.unitsLost;
 // Coup mortel par le chemin réel : un infecté fort collé à l'avatar.
 for(let i=0;i<6;i++){g.spawnZombie('armored');const z=g.zombies.at(-1);z.x=av().x+14;z.y=av().y+(i-3)*4;z.attackCooldown=0;}
 for(let i=0;i<30*30&&!av().dead;i++)g.update(1/30);
 assert.equal(av().dead,true,'avatar à terre');assert.equal(av().carry.ammo,0,'chargeur rendu au dépôt à la mort');assert.equal(g.stats.unitsLost,lost);
 for(const z of g.zombies)z.dead=true;g.zombies.length=0;
 steps(g,Math.ceil(R.avatar.respawnSeconds*30)+4);
 const c=g.core();assert.equal(av().dead,false);assert.ok(Math.hypot(av().x-c.x,av().y-c.y)<200,'retour au dépôt');
 // Rôle `sortie` : refusé proprement (tranche C7) ; `commandant` : jamais admis.
 const other=S.createGuest({name:'Sam',role:'sortie'});g.coopHost217.receive({type:'relay',protocol:P,peer:7,message:other.hello(CODE)});
 const reply=s.out.filter(m=>m.peer===7);assert.equal(reply[0].message.reason,'role');assert.deepEqual(reply[1],{type:'drop',protocol:P,peer:7});
 g.coopHost217.receive({type:'relay',protocol:P,peer:8,message:{type:'hello',protocol:P,code:CODE,name:'X',role:'commandant'}});
 assert.equal(s.out.filter(m=>m.peer===8)[0].message.reason,'invalid');assert.equal(g.coopHost217.overview().guests.length,1);
});

test('C4 : trois invités dans le protocole, intentions appliquées dans l’ordre (siège, numéro), signal et district tenu',()=>{
 const {g}=campaign();const s=seatGuests(g,['A','B','C']);
 assert.deepEqual(g.coopHost217.overview().guests.map(x=>x.seat),[1,2,3]);
 const fourth=S.createGuest({name:'D',role:'district'});g.coopHost217.receive({type:'relay',protocol:P,peer:9,message:fourth.hello(CODE)});
 assert.equal(s.out.filter(m=>m.peer===9)[0].message.reason,'full');
 // Arrivée entrelacée : C puis A ; au pas suivant, A agit avant C ; deux visées de A : la seconde l'emporte.
 s.push(2,'aim',{a:1});s.push(0,'aim',{a:.5});s.push(0,'aim',{a:-.5});steps(g,1);
 const [a,,c]=g.coopHost217.avatars();assert.equal(a.facing,-.5);assert.equal(c.facing,1);
 s.push(1,'ping',{x:100,y:200});steps(g,1);s.deliver();
 const view=g.coopHost217.view(1);assert.deepEqual(view.pings.map(p=>[p[0],p[1],p[2]]),[[2,100,200]]);
 // Tenir un district : seulement un district qui existe ; sinon rien n'est retenu.
 s.push(0,'hold',{district:'ring:99'});steps(g,1);assert.equal(g.coopHost217.avatars()[0].district,null);
});

test('C5 D3 : avec un invité assis, pause et dossiers ne gèlent pas le temps ; sans invité, la pause solo reste',()=>{
 const {g,doc}=campaign();
 // `elapsed` avance avant le test de pause de `update` : on mesure l'horloge de sauvegarde, comptée après lui.
 const advance=(n=10)=>{g.saveTimer=0;steps(g,n);return g.saveTimer;};
 // Hors session : la pause gèle.
 g.togglePause(true);assert.equal(advance(),0);g.togglePause(false);
 seatGuests(g);
 const paths=[
  ['pause',()=>g.togglePause(true),()=>g.togglePause(false)],
  ['poste de commandement',()=>g.showCommand?.(true),()=>g.showCommand?.(false)],
  ['aide',()=>g.toggleHelp?.(true),()=>g.toggleHelp?.(false)],
  ['dossier quelconque',()=>{g.paused=true;g.activeOverlay=doc.getElementById('settingsModal');},()=>{g.paused=false;g.activeOverlay=null;}],
 ];
 for(const [name,open,close] of paths){
  open();const paused=g.paused,overlay=g.activeOverlay;
  assert.ok(advance()>0,name+' : le temps continue');
  assert.equal(g.paused,paused,name+' : la pause reste affichée');assert.equal(g.activeOverlay,overlay,name+' : le dossier reste ouvert');
  close();
 }
 // La boucle de l'écran elle-même avance sous la pause en session.
 g.togglePause(true);const e=g.elapsed;g.lastFrame=1000;g.loop(1033);assert.ok(g.elapsed>e,'boucle : un pas sous pause');g.togglePause(false);
 // Départ du dernier invité : la pause solo revient.
 g.coopHost217.receive({type:'gone',protocol:P,peer:1});g.togglePause(true);assert.equal(advance(),0);
 const f=g.elapsed;g.lastFrame=2000;g.loop(2033);assert.equal(g.elapsed,f);
});

test('C5 D3 : onglet caché — pas réduits par minuterie, puis interruption annoncée',()=>{
 const {g,doc}=campaign();const s=seatGuests(g);
 let clock=0;const perf=globalThis.performance.now;globalThis.performance.now=()=>clock;
 try{
  g.coopHost217.watch();doc.hidden=true;doc.visibilityState='hidden';
  const e=g.elapsed;clock+=250;g.coopHost217.watch();clock+=5000;g.coopHost217.watch();
  const advanced=g.elapsed-e;assert.ok(advanced>.2&&advanced<=.25+R.clock.hiddenMaxSeconds+1e-9,'pas réduits : '+advanced);
  clock+=R.clock.hiddenGraceSeconds*1000+10;g.coopHost217.watch();
  assert.equal(g.coopHost217.overview().status,'idle');assert.equal(g.coopHost217.live(),false);
  s.deliver();assert.equal(s.guests[0].guest.overview().status,'closed','l’invité apprend la fermeture');
 }finally{globalThis.performance.now=perf;doc.hidden=false;doc.visibilityState='visible';}
});

test('C3 : quitter la campagne ferme la session ; l’invité n’emporte rien',()=>{
 const {g}=campaign();const s=seatGuests(g);
 g.startNew('standard','42');s.deliver();
 assert.equal(s.guests[0].guest.overview().status,'closed');assert.equal(g.coopHost217.overview().status,'idle');
 assert.ok(s.out.length===0||s.out.every(m=>m.type!=='send'));
});

// ---------- Bout en bout par le vrai relais (C2 + C3 + client invité) ----------
test('C2/C3 bout en bout : hôte et invité reliés par le relais, image reçue et intention appliquée',async t=>{
 const {url}=await relay(t);const {g}=campaign();
 const prior=globalThis.WebSocket;globalThis.WebSocket=WebSocket;t.after(()=>{globalThis.WebSocket=prior;g.coopHost217.close();});
 assert.equal(g.coopHost217.open({url,code:CODE}).ok,true);
 for(let i=0;i<100&&g.coopHost217.overview().status!=='open';i++)await quiet(10);
 assert.equal(g.coopHost217.overview().status,'open');
 const client=UI.createClient({WebSocket});client.join(url,CODE.toLowerCase(),'Lise','district');
 for(let i=0;i<100&&client.overview().status!=='seated';i++)await quiet(10);
 assert.equal(client.overview().status,'seated');assert.equal(g.coopHost217.live(),true);
 const x0=g.coopHost217.avatars()[0].x;client.setMove({x:1,y:0});
 for(let i=0;i<60;i++){g.update(1/30);await quiet(2);}
 for(let i=0;i<100&&!client.frameState();i++)await quiet(10);
 const st=client.frameState();assert.ok(st&&st.cur.self,'image reçue par le relais');
 assert.ok(g.coopHost217.avatars()[0].x>x0+20,'intention appliquée par l’hôte');
 client.leave();for(let i=0;i<100&&g.coopHost217.live();i++)await quiet(10);
 assert.equal(g.coopHost217.live(),false,'départ de l’invité vu par l’hôte');
});

// ---------- Client invité et peintre (C6 partiel) ----------
test('C6 peintre de l’invité : dessine l’image sans la modifier ; mouvement unitaire seulement',()=>{
 const {createCanvas}=require('@napi-rs/canvas');
 const {g}=campaign();const s=seatGuests(g);g.spawnZombie('walker');steps(g,20);s.deliver();
 const raw=s.guests[0].guest.view(),copy=JSON.stringify(raw),cur=UI.decode(raw);
 const canvas=createCanvas(320,200),ctx=canvas.getContext('2d');
 assert.equal(UI.paint(ctx,{prev:null,cur,t:1,self:cur.self,width:320,height:200}),true);
 assert.equal(JSON.stringify(raw),copy,'image intacte');
 const px=ctx.getImageData(160,100,1,1).data;assert.ok(px[0]+px[1]+px[2]>0);
 assert.deepEqual(UI.moveOf(new Set(['KeyD','KeyW'])),{x:.7071,y:-.7071});
 assert.ok(Math.hypot(...Object.values(UI.moveOf(new Set(['KeyD','KeyS','KeyA']))))<=1);
 assert.match(UI.hud(cur,''),/Vague \d+/);
 // Sources : la présentation ne tire ni n'écrit la partie.
 const src=read('src/coop-ui217.js').replace(/\/\/.*$/gm,'');
 assert.ok(!/Math\.random|g\.random|resources\.[a-z]+\s*[-+]?=|\.update\(/.test(src));
});

test('C3/C6 interface : rejoindre dans le menu principal, ouvrir sa cité dans le menu de pause, scripts dans l’ordre',()=>{
 const {g,doc}=campaign();
 assert.ok(doc.getElementById('coop217Join'));assert.ok(doc.getElementById('coop217Host'));assert.ok(doc.getElementById('coop217Guest'));
 const html=read('index.html'),at=n=>html.indexOf('<script src="src/'+n+'"></script>');
 assert.ok(at('coop.js')<at('coop-session217.js')&&at('coop-session217.js')<at('coop-host217.js')&&at('coop-host217.js')<at('coop-ui217.js'));
 // Ouvrir sans relais valable : refus lisible, aucune session.
 assert.equal(g.coopHost217.open({url:'http://exemple'}).ok,false);assert.equal(g.coopHost217.overview().status,'error');
 // Aucune clé de sauvegarde, aucun module d'extension : la coopération est une session, pas une règle de campagne.
 assert.ok(!read('src/expansion-kit.js').includes('coop'));assert.ok(!read('src/coop-host217.js').includes('expansions.register'));
});

// ---------- Vues de l'invité (C6.2) : image v2, le peintre de dessus reste le repli ----------
test('C6.2 : image v2 lue par les vues 2,5D et FPS ; le peintre de dessus la peint toujours',()=>{
 const {createCanvas}=require('@napi-rs/canvas');
 const {g}=campaign();const s=seatGuests(g);g.spawnZombie('walker');steps(g,20);s.deliver();
 const view=g.coopHost217.view(1);assert.equal(view.v,2);
 for(const k of ['seed','e','w','u','ukinds','decks'])assert.ok(k in view,k);
 assert.ok(Buffer.byteLength(JSON.stringify(view))<=R.relay.hostChars);
 const cur=UI.decode(s.guests[0].guest.view());assert.ok(Array.isArray(cur.units)&&Array.isArray(cur.decks));
 assert.ok(cur.zombies.every(z=>Number.isFinite(z.facing)&&Number.isFinite(z.hp)));
 const canvas=createCanvas(200,120);assert.equal(UI.paint(canvas.getContext('2d'),{prev:null,cur,t:1,self:cur.self,width:200,height:120}),true);
 // L'interface propose les trois vues ; la 2,5D d'abord.
 assert.equal(g.coopUI217.view(),'iso');
});

test('C6.2 (vu en navigateur) : une sauvegarde pendant le pas des infectés ne garde pas l’avatar prêté à `units`',()=>{
 const {g}=campaign();seatGuests(g);
 const before=stamp(g.serialize());
 // Même situation que pendant `updateZombies` : l'avatar est dans `units` le temps du pas.
 const av=g.coopHost217.avatars()[0];g.units.push(av);
 try{const d=g.serialize();assert.ok(!d.units.some(u=>u.kind==='guest217'));assert.equal(stamp(d),before);
  g.save(false);assert.notEqual(g.lastSaveStatus?.code,'invalid-state','la sauvegarde passe la validation');}
 finally{g.units.splice(g.units.indexOf(av),1);}
});
