'use strict';
// Vraie coopération, tranche C1 (specs/cooperation/) : protocole hôte autoritaire / invité à intentions.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../src/core.js'),S=require('../src/coop-session217.js'),R=C.CoopSession217Rules;
const ROOT=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const wire=m=>JSON.parse(JSON.stringify(m)); // le réseau ne transporte que du JSON
const CODE='D17NUIT';

// Un hôte et un invité dans le même processus, reliés par un transport JSON en mémoire.
function pair(role='district',name='Lise'){
 const host=S.createHost({code:CODE}),guest=S.createGuest({name,role});
 const admitted=host.admit(wire(guest.hello(CODE)));
 assert.equal(admitted.ok,true);assert.equal(guest.receive(wire(admitted.reply)),true);
 return{host,guest,seat:admitted.seat};
}
const send=(host,seat,message)=>host.receive(seat,wire(message));

test('coop 217 : règles gelées, protocole distinct de la présence 200',()=>{
 assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.roles)&&Object.isFrozen(R.view));
 assert.equal(R.protocol,217);assert.notEqual(R.protocol,200);assert.equal(R.maxGuests,3);
 assert.deepEqual(Object.keys(R.roles),['district','sortie']);assert.ok(!Object.hasOwn(R.roles,'commandant'),'le Commandant reste unique : aucun invité ne le réclame');
 assert.equal(S.RULES,R);assert.equal(S.PROTOCOL,217);
});

test('coop 217 : un hôte et un invité jouent une session à deux sans interface',()=>{
 const{host,guest,seat}=pair();
 assert.equal(seat,1);assert.deepEqual(guest.overview(),{name:'Lise',role:'district',seat:1,status:'seated',reason:'',tick:-1,seq:0,pending:0});
 // L'avatar de l'invité appartient à l'hôte : l'invité ne fait que demander.
 const avatar={x:100,y:100,a:0,firing:false,district:null},speed=6;
 const apply=list=>{for(const i of list){
  if(i.kind==='move'){avatar.x+=i.data.x*speed;avatar.y+=i.data.y*speed;}
  if(i.kind==='aim')avatar.a=i.data.a;if(i.kind==='fire')avatar.firing=i.data.on;if(i.kind==='hold')avatar.district=i.data.district;
 }};
 for(const m of [guest.intent('hold',{district:'porte-nord'}),guest.intent('move',{x:1,y:0}),guest.intent('aim',{a:1.5}),guest.intent('fire',{on:true})])assert.equal(send(host,seat,m).ok,true);
 assert.equal(guest.pending().length,4);
 const first=host.step(1);apply(first);
 assert.deepEqual(first.map(i=>[i.tick,i.seat,i.seq,i.kind]),[[1,1,1,'hold'],[1,1,2,'move'],[1,1,3,'aim'],[1,1,4,'fire']]);
 assert.deepEqual(avatar,{x:106,y:100,a:1.5,firing:true,district:'porte-nord'});
 // L'image renvoyée confirme les intentions appliquées ; l'invité oublie ce qui est confirmé.
 assert.equal(guest.receive(wire(host.frame(seat,S.shareView({wave:3,phase:'assault',zombies:[{id:9,kind:'walker',x:130,y:100,health:40}]},avatar)))),true);
 assert.equal(guest.pending().length,0);assert.equal(guest.view().wave,3);assert.equal(guest.view().zombies[0].id,9);
 // Une image plus ancienne ou rejouée ne remplace jamais la plus récente.
 const stale=host.frame(seat,{wave:1});assert.equal(guest.receive(wire(stale)),false);
 send(host,seat,guest.intent('move',{x:0,y:-1}));
 assert.equal(guest.receive(wire(host.frame(seat,{wave:3}))),false,'même pas, image refusée');
 apply(host.step(2));assert.deepEqual([avatar.x,avatar.y],[106,94]);
 assert.equal(guest.receive(wire(host.frame(seat,{wave:3}))),true);assert.equal(guest.overview().tick,2);
 assert.deepEqual(host.overview().guests,[{seat:1,name:'Lise',role:'district',ack:5,pending:0,refused:0,district:'porte-nord'}]);
 // Fermeture par l'hôte : l'invité perd son siège, n'emporte rien et ne peut plus rien envoyer.
 const notices=host.close();assert.deepEqual(notices,[{seat:1,message:{type:'closed',protocol:217,tick:2}}]);
 assert.equal(guest.receive(wire(notices[0].message)),true);assert.equal(guest.overview().status,'closed');
 assert.equal(guest.intent('move',{x:0,y:1}),null);assert.equal(host.admit(wire(S.createGuest({}).hello(CODE))).reply.reason,'closed');
});

test('coop 217 : admission — code, forme, rôle, trois invités au plus, siège libéré au départ',()=>{
 assert.throws(()=>S.createHost({code:'abc'}),RangeError);assert.throws(()=>S.createHost({}),RangeError);
 const host=S.createHost({code:CODE}),hello=(code=CODE,role='district')=>wire(S.createGuest({name:'X',role}).hello(code));
 assert.equal(host.admit(hello('AUTRECODE')).reply.reason,'code');
 assert.equal(host.admit({...hello(),role:'commandant'}).reply.reason,'invalid');
 assert.equal(host.admit({...hello(),admin:true}).reply.reason,'invalid');
 assert.equal(host.admit({...hello(),protocol:200}).reply.reason,'invalid');
 assert.equal(host.admit(null).reply.reason,'invalid');
 const seats=[host.admit(hello()),host.admit(hello(CODE,'sortie')),host.admit(hello())].map(r=>r.seat);
 assert.deepEqual(seats,[1,2,3]);assert.equal(host.admit(hello()).reply.reason,'full');
 assert.equal(host.leave(2),true);assert.equal(host.leave(2),false);
 const back=host.admit(hello(CODE,'sortie'));assert.equal(back.seat,2,'le plus petit siège libre');
 assert.equal(host.overview().guests.length,3);
 // Un invité refusé le sait et ne peut rien envoyer.
 const lost=S.createGuest({name:'Y'});lost.hello('AUTRECODE');assert.equal(lost.receive(wire(host.admit(wire(lost.hello('AUTRECODE'))).reply)),true);
 assert.equal(lost.overview().status,'refused');assert.equal(lost.overview().reason,'code');assert.equal(lost.intent('move',{x:0,y:0}),null);
 // Nom nettoyé et borné.
 const named=S.createGuest({name:'\u0007'+'N'.repeat(80)});assert.equal(named.overview().name.length,R.nameChars);
});

test('coop 217 : triche — aucune position, aucun état, aucune répétition ni intention hors rôle',()=>{
 const{host,seat}=pair('sortie');
 const intent=(seq,kind,data)=>({type:'intent',protocol:217,seq,kind,data});
 const refused=m=>{const r=host.receive(seat,wire(m));assert.equal(r.ok,false,JSON.stringify(m));return r.reason;};
 assert.equal(refused(intent(1,'move',{x:1,y:1})),'invalid','vitesse au-delà de l’unité');
 assert.equal(refused(intent(1,'move',{x:1,y:0,speed:9})),'invalid','champ supplémentaire');
 assert.equal(refused(intent(1,'teleport',{x:1,y:0})),'invalid');
 assert.equal(refused({type:'state',protocol:217,seq:1,kind:'move',data:{x:0,y:0}}),'invalid');
 assert.equal(refused({...intent(1,'move',{x:0,y:0}),player:{x:9}}),'invalid');
 assert.equal(refused(intent(1,'hold',{district:'porte-nord'})),'invalid','un chef de sortie ne tient pas de district');
 assert.equal(refused(intent(0,'aim',{a:0})),'invalid');assert.equal(refused(intent(1.5,'aim',{a:0})),'invalid');
 assert.equal(refused(intent(1,'aim',{a:Infinity})),'invalid');assert.equal(refused(intent(1,'fire',{on:1})),'invalid');
 assert.equal(refused(intent(1,'ping',{x:2e6,y:0})),'invalid');
 assert.equal(refused(JSON.parse('{"type":"intent","protocol":217,"seq":1,"kind":"move","data":{"__proto__":{"x":1},"x":0,"y":0}}')),'invalid');
 assert.equal(host.receive(seat,wire(intent(5,'aim',{a:0}))).ok,true);
 assert.equal(refused(intent(5,'aim',{a:0})),'replay');assert.equal(refused(intent(3,'aim',{a:0})),'replay');
 assert.equal(host.receive(99,wire(intent(6,'aim',{a:0}))).reason,'seat');
 assert.equal(host.frame(99,{}),null);assert.equal(host.frame(seat,undefined),null);assert.equal(host.frame(seat,[1]),null);
 for(let i=6;i<5+R.maxPending;i++)assert.equal(host.receive(seat,wire(intent(i,'aim',{a:0}))).ok,true);
 assert.equal(refused(intent(100,'aim',{a:0})),'busy','file bornée');
 // Au plus perStep intentions par siège et par pas : la file s'écoule sans rafale.
 assert.equal(host.step(1).length,R.perStep);assert.equal(host.overview().guests[0].pending,R.maxPending-R.perStep);
 assert.throws(()=>host.step(1),RangeError,'le pas ne recule jamais');
 assert.ok(host.overview().guests[0].refused>=14);
 // Le résultat d'un pas est gelé : l'adaptateur ne peut pas réécrire l'historique.
 const [first]=host.step(2);assert.ok(Object.isFrozen(first)&&Object.isFrozen(first.data));
 // Côté invité : une intention mal formée n'est ni numérotée ni gardée.
 const g=S.createGuest({role:'sortie'});g.hello(CODE);g.receive({type:'welcome',protocol:217,seat:1,role:'sortie'});
 assert.equal(g.intent('hold',{district:'x'}),null);assert.equal(g.intent('move',{x:2,y:0}),null);assert.equal(g.overview().seq,0);
 assert.equal(g.receive({type:'welcome',protocol:217,seat:2,role:'sortie'}),false,'déjà assis');
 assert.equal(g.receive({type:'frame',protocol:217,tick:1,seat:2,ack:0,view:{}}),false,'image d’un autre siège');
 assert.equal(g.receive({type:'frame',protocol:217,tick:1,seat:1,ack:4,view:{}}),false,'accusé d’une intention jamais envoyée');
});

test('coop 217 : ordre stable — l’arrivée entrelacée des sièges ne change pas le pas',()=>{
 const make=()=>{const host=S.createHost({code:CODE}),guests=[S.createGuest({name:'A'}),S.createGuest({name:'B',role:'sortie'}),S.createGuest({name:'C'})];
  for(const g of guests)g.receive(wire(host.admit(wire(g.hello(CODE))).reply));return{host,guests};};
 const script=guests=>guests.map((g,n)=>[0,1,2].map(k=>({seat:n+1,message:wire(g.intent('move',{x:k/4,y:-n/4}))})));
 const one=make(),two=make(),a=script(one.guests),b=script(two.guests);
 for(const row of a)for(const m of row)one.host.receive(m.seat,m.message);
 for(let k=0;k<3;k++)for(const row of b.slice().reverse())two.host.receive(row[k].seat,row[k].message); // sièges entrelacés, ordre inversé
 const x=one.host.step(1),y=two.host.step(1);
 assert.deepEqual(x,y);assert.deepEqual(x.map(i=>i.seat+':'+i.seq),['1:1','1:2','1:3','2:1','2:2','2:3','3:1','3:2','3:3']);
});

test('coop 217 : l’image partagée lit la vraie partie sans la modifier ni la référencer',()=>{
 const{bootGame}=require('./helpers/browser.cjs'),{game:g}=bootGame();
 g.startNew('standard','17117');g.campaignIntro132?.skip?.();
 const digest=()=>{const{timestamp,...rest}=g.serialize();return crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex');}; // l’horodatage seul suit l’horloge
 const saved=g.serialize(),before=digest(),core=g.core();
 const view=S.shareView(saved,{x:core.x,y:core.y});
 assert.equal(digest(),before,'lecture sans effet');
 assert.deepEqual(wire(view),view,'image transportable telle quelle');
 assert.ok(view.buildings.length>0&&view.buildings.length<=R.view.maxBuildings);
 assert.ok(view.buildings.some(b=>b.type==='core'));assert.ok(view.zombies.length<=R.view.maxZombies);
 assert.equal(view.zombies.length+view.hidden,saved.zombies.length);
 assert.deepEqual(Object.keys(view.resources),Object.keys(view.resources).slice().sort());
 view.buildings[0].health=-1;view.resources.wood=-1;assert.equal(digest(),before,'aucune référence vers la partie');
 // Lecture bornée et triée par distance puis identifiant.
 const crowd={wave:2,phase:'assault',phaseTime:1.234,zombies:Array.from({length:R.view.maxZombies+50},(_,i)=>({id:i+1,kind:'walker',x:10+(i%7),y:0,health:50})).concat([{id:9999,x:5000,y:0},{id:'x',x:0,y:0},null])};
 const v=S.shareView(crowd,{x:0,y:0});
 assert.equal(v.zombies.length,R.view.maxZombies);assert.equal(v.hidden,51);assert.equal(v.phaseTime,1.2);
 for(let i=1;i<v.zombies.length;i++){const p=v.zombies[i-1],q=v.zombies[i];assert.ok(p.x<q.x||p.x===q.x&&p.id<q.id);}
 assert.throws(()=>S.shareView(null,{}),TypeError);
 assert.equal(S.shareView({},{x:NaN}).focus.x,0);
});

test('coop 217 : brique isolée — aucun script public, aucun module du jeu ne la lit, présence 200 inchangée',()=>{
 const source=read('src/coop-session217.js');
 assert.ok(!/Math\.random|Date\.now|performance\.|localStorage|document\b|setTimeout|setInterval|WebSocket/.test(source.replace(/\/\/.*$/gm,'')),'module pur');
 assert.deepEqual([...source.matchAll(/require\('([^']+)'\)/g)].map(m=>m[1]),['./core.js']);
 assert.ok(!read('index.html').includes('coop-session217'));assert.ok(!read('sw.js').includes('coop-session217'));
 for(const file of fs.readdirSync(path.join(ROOT,'src')))if(file!=='coop-session217.js'&&file!=='core.js'){
  const text=read('src/'+file);assert.ok(!text.includes('coop-session217')&&!text.includes('DeadwallCoopSession217')&&!text.includes('CoopSession217Rules'),file);
 }
 assert.equal((read('src/core.js').match(/CoopSession217Rules/g)||[]).length,1);
 // La préversion de présence garde son protocole et son relais sans autorité.
 const P=require('../src/coop.js');assert.deepEqual(Object.keys(P).sort(),['LIMITS','coordinate','install','label','normalizeSpace','normalizeState','parseMessage','spaceKey']);
 assert.ok(read('scripts/coop-server.mjs').includes('protocol:200'));assert.ok(!read('scripts/coop-server.mjs').includes('217'));
});
