'use strict';
// Coopération, tranche C8 (specs/cooperation) : reprise d'un siège après une coupure du relais ou de l'onglet (même siège,
// même rôle, délai borné), hôte qui perd puis retrouve le relais, fermeture propre. Protocole (jeton de reprise), adaptateur
// hôte dans une vraie partie, client invité, et bout en bout par le vrai relais `ws`.
const test=require('node:test'),assert=require('node:assert/strict'),{once}=require('node:events');
const {WebSocket}=require('ws');
const C=require('../src/core.js'),S=require('../src/coop-session217.js'),UI=require('../src/coop-ui217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const RS=C.CoopResume217Rules,P=217,CODE='REPRISE8';
const stamp=d=>{const c={...d};delete c.timestamp;return JSON.stringify(c);};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check,ms=15000,step=50){const end=Date.now()+ms;while(Date.now()<end){if(check())return true;await wait(step);}return check();}
const memory=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),map:m};};

test('C8 protocole : jeton de reprise dans hello, siège repris avec ses numéros remis à zéro, rôle et code vérifiés',()=>{
 const token='ABCDEFGH23456789';
 assert.equal(RS.tokenChars,token.length);
 const hello=(extra={})=>({type:'hello',protocol:P,code:CODE,name:'Lise',role:'district',...extra});
 assert.deepEqual(S.normalizeHello(hello({resume:token})),{code:CODE,name:'Lise',role:'district',resume:token});
 for(const bad of ['abc','ABCDEFGH2345678!','ABCDEFGH234567890',42,null])assert.equal(S.normalizeHello(hello({resume:bad})),null,String(bad));
 assert.equal(S.normalizeHello(hello({resume:token,extra:1})),null,'aucun autre champ');
 assert.deepEqual(S.normalizeHello(hello()),{code:CODE,name:'Lise',role:'district'},'hello sans jeton inchangé');
 const host=S.createHost({code:CODE}),g1=S.createGuest({name:'Lise'});
 const r=host.admit(g1.hello(CODE));assert.equal(r.ok,true);g1.receive({...r.reply,resume:token});assert.equal(g1.token(),token);
 for(let i=0;i<5;i++)assert.equal(host.receive(r.seat,g1.intent('aim',{a:i/10})).ok,true);host.step(1);
 // Un nouvel invité (nouvel onglet) reprend le siège : ses numéros repartent de 1.
 const g2=S.createGuest({name:'Lise'}),h2=g2.hello(CODE,token);assert.equal(h2.resume,token);
 assert.equal(host.resume(r.seat,{...h2,role:'sortie'}).reply.reason,'role','même rôle exigé');
 assert.equal(host.resume(r.seat,{...h2,code:'AUTRE1'}).reply.reason,'code');
 assert.equal(host.resume(9,h2).reply.reason,'invalid','siège inconnu');
 const back=host.resume(r.seat,h2);assert.equal(back.ok,true);assert.equal(back.reply.seat,r.seat);
 g2.receive({...back.reply,resume:token});assert.equal(host.receive(r.seat,g2.intent('aim',{a:1})).ok,true,'numéro 1 accepté après reprise');
 assert.equal(host.overview().guests.length,1);
 host.close();assert.equal(host.resume(r.seat,h2).reply.reason,'closed');
});

function campaign(){
 const {g,doc}=bootDocument134();
 globalThis.DeadwallCoopHost217.install(g,doc);globalThis.DeadwallCoopUI217.install(g,doc);
 g.startNew('standard','17117');g.campaignIntro132?.skip?.();
 return{g,doc};
}

test('C8 hôte : coupure d’un invité, siège et rôle gardés, sac au dépôt, reprise par jeton ; délai dépassé, siège libéré',t=>{
 const {g}=campaign();
 const out=[],link={send:m=>out.push(JSON.parse(JSON.stringify(m))),close(){}};
 assert.equal(g.coopHost217.open({link,code:CODE}).ok,true);g.coopHost217.receive({type:'hosting',protocol:P,code:CODE});
 const lise=S.createGuest({name:'Lise',role:'district'}),sam=S.createGuest({name:'Sam',role:'sortie'});
 const reply=peer=>out.filter(m=>m.type==='send'&&m.peer===peer).map(m=>m.message);
 g.coopHost217.receive({type:'relay',protocol:P,peer:1,message:lise.hello(CODE)});g.coopHost217.receive({type:'relay',protocol:P,peer:2,message:sam.hello(CODE)});
 const w1=reply(1)[0],w2=reply(2)[0];lise.receive(w1);sam.receive(w2);
 assert.equal(w1.seat,1);assert.equal(w2.seat,2);assert.notEqual(w1.resume,w2.resume);
 const before=stamp(g.serialize());
 // Coupure des deux invités : sièges gardés, avatars retirés (sac au dépôt), le temps peut de nouveau s'arrêter.
 g.coopHost217.receive({type:'gone',protocol:P,peer:1});g.coopHost217.receive({type:'gone',protocol:P,peer:2});
 const o=g.coopHost217.overview();
 assert.deepEqual(o.waiting.map(x=>[x.seat,x.role]),[[1,'district'],[2,'sortie']]);assert.ok(o.waiting.every(x=>x.seconds<=RS.graceSeconds&&x.seconds>0));
 assert.equal(g.coopHost217.live(),false);assert.equal(o.guests.length,0);
 assert.equal(stamp(g.serialize()),before,'aucune perte ni duplication');
 // Un nouvel arrivant n'obtient pas un siège gardé.
 const noe=S.createGuest({name:'Noé'});g.coopHost217.receive({type:'relay',protocol:P,peer:3,message:noe.hello(CODE)});assert.equal(reply(3)[0].seat,3);
 // Reprise : même siège, même rôle, même jeton ; intentions de nouveau acceptées.
 const lise2=S.createGuest({name:'Lise',role:'district'});g.coopHost217.receive({type:'relay',protocol:P,peer:4,message:lise2.hello(CODE,w1.resume)});
 const back=reply(4)[0];assert.equal(back.type,'welcome');assert.equal(back.seat,1);assert.equal(back.resume,w1.resume);lise2.receive(back);
 const sam2=S.createGuest({name:'Sam',role:'sortie'});g.coopHost217.receive({type:'relay',protocol:P,peer:5,message:sam2.hello(CODE,w2.resume)});
 assert.equal(reply(5)[0].seat,2);assert.equal(g.coopHost217.sorties().length,1,'bulle régionale rétablie aux portes');
 assert.equal(g.coopHost217.receive({type:'relay',protocol:P,peer:4,message:lise2.intent('aim',{a:.25})}),true);g.update(1/30);
 assert.equal(+g.coopHost217.avatars().find(a=>a.seat===1).facing.toFixed(2),.25);
 assert.equal(g.coopHost217.overview().waiting.length,0);
 // Socket à moitié fermé : le même jeton depuis un autre socket remplace l'ancien sans doubler l'avatar.
 const lise3=S.createGuest({name:'Lise',role:'district'});g.coopHost217.receive({type:'relay',protocol:P,peer:6,message:lise3.hello(CODE,w1.resume)});
 assert.equal(reply(6)[0].seat,1);assert.ok(out.some(m=>m.type==='drop'&&m.peer===4),'ancien socket lâché');
 assert.equal(g.coopHost217.avatars().filter(a=>a.seat===1).length,1);
 // Délai dépassé : le siège est libéré, le jeton oublié ; un retour tardif reçoit un siège libre ordinaire.
 g.coopHost217.receive({type:'gone',protocol:P,peer:6});
 const now=performance.now.bind(performance);let shift=0;performance.now=()=>now()+shift;t.after(()=>{delete performance.now;});
 shift=RS.graceSeconds*1000+10;g.coopHost217.watch();
 assert.equal(g.coopHost217.overview().waiting.length,0);
 const late=S.createGuest({name:'Lise',role:'district'});g.coopHost217.receive({type:'relay',protocol:P,peer:7,message:late.hello(CODE,w1.resume)});
 const r7=reply(7)[0];assert.equal(r7.type,'welcome');assert.equal(r7.seat,1,'plus petit siège libre');assert.notEqual(r7.resume,w1.resume,'nouveau jeton');
 // Fermeture propre : chaque invité reçoit `closed`, plus rien n'est gardé.
 g.coopHost217.close();assert.equal(g.coopHost217.overview().status,'idle');assert.equal(g.coopHost217.overview().waiting.length,0);
 assert.ok(out.filter(m=>m.type==='send'&&m.message.type==='closed').length>=3);
});

test('C8 client invité : reconnexion bornée après coupure, puis abandon annoncé ; billet de reprise effacé',()=>{
 const timers=[],sockets=[];let clock=0;
 class Fake{constructor(url){this.url=url;this.readyState=0;this.sent=[];sockets.push(this);}send(t){this.sent.push(JSON.parse(t));}close(){if(this.readyState===3)return;this.readyState=3;this.onclose?.();}open(){this.readyState=1;this.onopen?.();}msg(m){this.onmessage?.({data:JSON.stringify(m)});}}
 const store=memory();
 const client=UI.createClient({WebSocket:Fake,now:()=>clock,wall:()=>clock,storage:store,setTimeout:(f,ms)=>{timers.push({f,at:clock+ms});return timers.length;},clearTimeout:id=>{if(timers[id-1])timers[id-1].f=null;}});
 const run=()=>{for(const x of timers.splice(0)){if(x.f&&x.at<=clock)x.f();else if(x.f)timers.push(x);}};
 client.join('ws://relais',CODE,'Lise','district');sockets[0].open();
 assert.equal(sockets[0].sent[0].resume,undefined,'premier hello sans jeton');
 sockets[0].msg({type:'welcome',protocol:P,seat:2,role:'district',name:'Lise',tick:0,resume:'ABCDEFGH23456789'});
 assert.equal(client.overview().status,'seated');assert.equal(JSON.parse(store.getItem(RS.storageKey)).token,'ABCDEFGH23456789','billet enregistré');
 // Coupure : reconnexion au même siège avec le jeton.
 sockets[0].readyState=3;sockets[0].onclose();assert.equal(client.overview().status,'reconnecting');
 clock+=RS.retryMs[0];run();assert.equal(sockets.length,2);sockets[1].open();assert.equal(sockets[1].sent[0].resume,'ABCDEFGH23456789');
 // L'hôte n'est pas encore revenu sur le relais : ce n'est pas un refus définitif.
 sockets[1].msg({type:'refused',protocol:P,reason:'absent'});assert.equal(client.overview().status,'reconnecting');
 clock+=RS.retryMs[1];run();sockets[2].open();sockets[2].msg({type:'welcome',protocol:P,seat:2,role:'district',name:'Lise',tick:9,resume:'ABCDEFGH23456789'});
 assert.equal(client.overview().status,'seated');assert.match(client.overview().notice,/Reconnecté au siège 2/);
 // Nouvelle coupure, relais muet : essais bornés par le délai de grâce, puis abandon annoncé.
 sockets[2].readyState=3;sockets[2].onclose();
 let tries=0;while(client.overview().status==='reconnecting'&&tries<200){clock+=1000;run();const s=sockets.at(-1);if(s.readyState===0){s.readyState=3;s.onclose();}tries++;}
 assert.equal(client.overview().status,'closed');assert.ok(clock<=RS.graceSeconds*1000+RS.retryMs.at(-1)*2+20000);
 assert.equal(store.getItem(RS.storageKey),null,'billet effacé');
 // Refus définitif (code) pendant une reprise : aucun nouvel essai.
 const c2=UI.createClient({WebSocket:Fake,now:()=>clock,wall:()=>clock,storage:store,setTimeout:(f,ms)=>{timers.push({f,at:clock+ms});return timers.length;},clearTimeout:()=>{}});
 assert.equal(c2.resume({url:'ws://relais',code:CODE,name:'Lise',role:'district',token:'ABCDEFGH23456789',at:clock-RS.graceSeconds*1000-1}),false,'billet trop vieux');
 assert.equal(c2.resume({url:'ws://relais',code:CODE,name:'Lise',role:'district',token:'ABCDEFGH23456789',at:clock-1000}),true);
 sockets.at(-1).open();sockets.at(-1).msg({type:'refused',protocol:P,reason:'code'});assert.equal(c2.overview().status,'refused');
 // Départ volontaire : billet effacé, aucune reprise.
 c2.leave();assert.equal(store.getItem(RS.storageKey),null);
});

test('C8 bout en bout par le vrai relais : coupure de l’invité, onglet rouvert, relais redémarré ; même siège, même rôle',async t=>{
 const {createCoopRelay}=await import('../scripts/coop-server.mjs');
 let relay=createCoopRelay({port:0,host:'127.0.0.1'});await once(relay,'listening');const port=relay.address().port,url='ws://127.0.0.1:'+port;
 const {g}=campaign();
 t.after(async()=>{try{g.coopHost217.close();}catch(error){}for(const s of relay.clients)s.terminate();await new Promise(r=>relay.close(r));});
 assert.equal(g.coopHost217.open({url,WebSocket,code:CODE}).ok,true);
 assert.ok(await until(()=>g.coopHost217.overview().status==='open'),'cité ouverte');
 const store=memory(),a=UI.createClient({WebSocket,storage:store}),b=UI.createClient({WebSocket,storage:memory()});
 a.join(url,CODE,'Lise','district');b.join(url,CODE,'Sam','sortie');
 assert.ok(await until(()=>a.overview().status==='seated'&&b.overview().status==='seated'),'deux invités assis');
 const seatA=a.overview().seat,seatB=b.overview().seat;
 // 1. Coupure réseau de l'invité A (socket tué côté relais) : reprise automatique au même siège.
 const victim=[...relay.clients].at(-2);victim.terminate();
 assert.ok(await until(()=>a.overview().status==='reconnecting'||b.overview().status==='reconnecting',4000),'coupure vue');
 assert.ok(await until(()=>a.overview().status==='seated'&&b.overview().status==='seated'),'reprise');
 assert.equal(a.overview().seat,seatA);assert.equal(b.overview().seat,seatB);
 assert.deepEqual(g.coopHost217.overview().guests.map(x=>[x.seat,x.role]).sort(),[[seatA,'district'],[seatB,'sortie']].sort());
 // 2. Onglet de A fermé puis rouvert : un nouveau client lit le billet et reprend le siège.
 a.leave(false);
 assert.ok(await until(()=>g.coopHost217.overview().waiting.length===1,4000),'siège gardé chez l’hôte');
 const a2=UI.createClient({WebSocket,storage:store});assert.equal(a2.resume(a2.stored()),true);
 assert.ok(await until(()=>a2.overview().status==='seated'));assert.equal(a2.overview().seat,seatA);
 // 3. Relais redémarré : l'hôte rouvre la même cité, les invités reprennent leurs sièges.
 for(const s of relay.clients)s.terminate();await new Promise(r=>relay.close(r));
 assert.ok(await until(()=>g.coopHost217.overview().status==='reconnecting',4000),'hôte en reprise');
 relay=createCoopRelay({port,host:'127.0.0.1'});await once(relay,'listening');
 assert.ok(await until(()=>g.coopHost217.overview().status==='open',20000),'hôte revenu');
 assert.ok(await until(()=>a2.overview().status==='seated'&&b.overview().status==='seated',20000),'invités revenus');
 assert.equal(a2.overview().seat,seatA);assert.equal(b.overview().seat,seatB);assert.equal(g.coopHost217.overview().guests.length,2);
 // Fermeture propre : chaque invité voit la campagne fermée, aucun billet ne reste.
 g.coopHost217.close();
 assert.ok(await until(()=>a2.overview().status==='closed'&&b.overview().status==='closed'));
 assert.equal(store.getItem(RS.storageKey),null);
 a2.leave();b.leave();
});
