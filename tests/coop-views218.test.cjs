'use strict';
// Coopération, tranche C6.2 (specs/cooperation) : l'invité voit l'image de l'hôte en 2,5D et en FPS, peinte par les
// peintres existants (méthodes de dessin de la cité, peintre WebGL de la citadelle) à travers une façade de lecture.
// Règles, image v2 bornée sur une cité chargée, interpolation, prédiction, non-mutation, repli sans WebGL, solo inchangé.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),S=require('../src/coop-session217.js'),UI=require('../src/coop-ui217.js'),VW=require('../src/coop-views218.js');
const Render=require('../src/vertical-citadel175-render.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const ROOT=path.join(__dirname,'..'),R=C.CoopPlay217Rules,RV=C.CoopViews217Rules,P=217,CODE='VIEW2181';
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');

function campaign(){
 const {g,doc}=bootDocument134();
 globalThis.DeadwallCoopHost217.install(g,doc);globalThis.DeadwallCoopUI217.install(g,doc);VW.install(g);
 g.startNew('standard','17117');g.campaignIntro132?.skip?.();
 return{g,doc};
}
function seat(g){
 const out=[],link={send:m=>out.push(JSON.parse(JSON.stringify(m))),close(){}};
 assert.equal(g.coopHost217.open({link,code:CODE}).ok,true);g.coopHost217.receive({type:'hosting',protocol:P,code:CODE});
 const guest=S.createGuest({name:'Lise',role:'district'});
 g.coopHost217.receive({type:'relay',protocol:P,peer:1,message:guest.hello(CODE)});
 const deliver=()=>{for(const m of out.splice(0))if(m.type==='send')guest.receive(m.message);};deliver();
 return{guest,deliver,push:(kind,data)=>g.coopHost217.receive({type:'relay',protocol:P,peer:1,message:guest.intent(kind,data)})};
}
const steps=(g,n,dt=1/30)=>{for(let i=0;i<n;i++)g.update(dt);};
const stamp=d=>{const c={...d};delete c.timestamp;return JSON.stringify(c);};
// Cité chargée de vague tardive : quatre enceintes de murs et de portes, maisons, 700 infectés autour du centre (sous la borne de sauvegarde).
function loaded(g){
 const c=g.core(),Building=c.constructor;let n=0;
 const put=(type,gx,gy)=>{if(g.world.atCell(gx,gy))return;const b=new Building(g.nextId++,type,gx,gy,0,1);if(g.world.placement(b.def,gx,gy,0).valid){g.world.add(b);n++;}};
 for(let r=8;r<=26;r+=6)for(let a=-r;a<=r;a++)for(const [x,y] of [[a,-r],[a,r],[-r,a],[r,a]])put(x===0||y===0?'gate':'woodWall',c.gx+x,c.gy+y);
 for(let i=0;i<64;i++)put(i%4?'house':'turret',c.gx-14+(i%8)*4,c.gy-14+Math.floor(i/8)*4);
 g.wave=30;
 for(let i=0;i<700;i++){g.spawnZombie(['walker','runner','armored','crawler','howler'][i%5]);const z=g.zombies.at(-1),a=i*2.4,r=140+(i%60)*22;z.x=c.x+Math.cos(a)*r;z.y=c.y+Math.sin(a)*r;}
 g.world.navigationVersion++;return n;
}
// Contexte WebGL factice : enregistre les appels et les tampons envoyés (comme tests/terrain-fps217.test.cjs).
function recorder(){
 const calls=[],listeners=new Map(),data=[];let sequence=0;
 const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,DYNAMIC_DRAW:6,FLOAT:7,TRIANGLES:8,COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,DEPTH_TEST:9,CULL_FACE:10,STATIC_DRAW:11,
  createShader:()=>({}),createProgram:()=>({}),getShaderParameter:()=>true,getProgramParameter:()=>true,createBuffer:()=>({id:++sequence}),getAttribLocation:()=>0,getUniformLocation:()=>({}),isContextLost:()=>false};
 for(const name of ['shaderSource','compileShader','attachShader','linkProgram','deleteShader','deleteProgram','deleteBuffer','bindBuffer','bufferData','bufferSubData','enableVertexAttribArray','vertexAttribPointer','drawArrays','viewport','clearColor','clear','enable','disable','useProgram','uniform3f','uniform2f','uniform1f'])
  gl[name]=(...args)=>{calls.push([name,...args]);if(name==='bufferSubData'||name==='bufferData'){const a=args.find(x=>ArrayBuffer.isView(x));if(a)data.push(Float32Array.from(a));}};
 const canvas={width:0,height:0,getContext:()=>gl,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:(e,f)=>listeners.set(e,f),removeEventListener:e=>listeners.delete(e)};
 return{gl,canvas,calls,data,listeners};
}
// Aucun tirage pendant une peinture : `Math.random` et le flux du jeu lèvent une erreur s'ils sont appelés.
function noRandom(g,fn){
 const mr=Math.random,gr=g.random?.range,gn=g.random?.next;let hits=0;
 Math.random=()=>{hits++;return .5;};if(g.random){g.random.range=()=>{hits++;return 0;};g.random.next=()=>{hits++;return .5;};}
 try{return[fn(),hits];}finally{Math.random=mr;if(g.random){g.random.range=gr;g.random.next=gn;}}
}

test('C6.2 règles : objet gelé dans core.js, vues dans l’ordre de bascule, champs d’image bornés',()=>{
 assert.ok(Object.isFrozen(RV)&&Object.isFrozen(RV.frame)&&Object.isFrozen(RV.fps));
 assert.deepEqual([...RV.views],['iso','fps','top']);
 assert.ok(RV.frame.maxUnits>0&&RV.frame.maxUnits<=64&&RV.frame.maxDecks>0&&RV.frame.maxDecks<=64);
 assert.ok(RV.fps.pitchLimit<Math.PI/2&&RV.fps.moveSteps>=8);
 assert.match(read('src/core.js'),/C\.CoopViews217Rules=Object\.freeze\(/);
});

test('C6.2 image v2 : champs des peintres, sous 30 000 octets sur une cité chargée de vague tardive',()=>{
 const {g}=campaign();const s=seat(g);const added=loaded(g);assert.ok(added>200,'cité chargée : '+added);
 steps(g,20);s.deliver();
 const view=g.coopHost217.view(1),bytes=Buffer.byteLength(JSON.stringify(view));
 assert.equal(view.v,2);for(const k of ['seed','e','w','ukinds','u','decks'])assert.ok(k in view,k);
 assert.equal(view.seed,Number(g.world.seed)>>>0);assert.ok(view.e>0);
 assert.ok(view.b.every(b=>b.length===11&&[0,1,2,3].includes(b[9])&&[0,1].includes(b[10])),'rotation et révision de géométrie');
 assert.ok(view.z.every(z=>z.length===6&&Number.isInteger(z[4])&&z[5]>=0&&z[5]<=100),'orientation et santé');
 assert.ok(view.u.length<=RV.frame.maxUnits&&view.decks.length<=RV.frame.maxDecks);
 assert.ok(view.z.length<=R.frame.maxZombies&&view.b.length<=R.frame.maxBuildings&&view.hidden>0);
 assert.ok(bytes<=R.relay.hostChars,'image de '+bytes+' octets');
 // Trace de mesure pour le rapport (cité chargée, 700 infectés, vague 30).
 console.log('# C6.2 image chargée : '+bytes+' octets, '+view.b.length+' bâtiments, '+view.z.length+' corps, '+view.u.length+' membres, '+view.hidden+' hors vue');
 // La trame reçue par l'invité garde la même borne.
 const frame=s.guest.view();assert.ok(frame&&Buffer.byteLength(JSON.stringify(frame))<=R.relay.hostChars);
});

test('C6.2 décodage : image v1 (hôte ancien) et v2 lues sans erreur, sans modifier l’image',()=>{
 const v1={v:1,wave:3,phase:'calm',types:['woodWall'],kinds:['walker'],b:[[5,0,10,10,1,1,100,1,0]],z:[[9,0,40,50]],self:{x:1,y:2,a:0,hp:100,max:100}};
 const copy=JSON.stringify(v1),d1=UI.decode(v1);assert.equal(JSON.stringify(v1),copy);
 assert.deepEqual(d1.buildings[0],{id:5,type:'woodWall',gx:10,gy:10,w:1,h:1,hp:100,flags:1,corpses:0,rotation:0,gv:0});
 assert.deepEqual(d1.zombies[0],{id:9,kind:'walker',x:40,y:50,facing:0,hp:100});assert.deepEqual(d1.units,[]);assert.deepEqual(d1.decks,[]);
 const v2={...v1,v:2,b:[[5,0,10,10,1,1,80,5,3,1,1]],z:[[9,0,40,50,157,40]],ukinds:['soldier'],u:[[3,0,70,80,-50,90]],decks:[[5,10,10,6,2,2,.4,0],[5,'x',1,1,1,1,1,1]]};
 const d2=UI.decode(v2);
 assert.equal(d2.buildings[0].rotation,1);assert.equal(d2.buildings[0].gv,1);assert.equal(d2.zombies[0].facing,1.57);assert.equal(d2.zombies[0].hp,40);
 assert.deepEqual(d2.units[0],{id:3,kind:'soldier',x:70,y:80,facing:-.5,hp:90});
 assert.equal(d2.decks.length,1,'une boîte mal formée est ignorée');assert.equal(d2.decks[0].module,false);
});

test('C6.2 interpolation et prédiction : positions et temps de l’hôte entre deux images ; objets d’affichage stables',()=>{
 const scene=VW.createScene();
 const mk=(x,e)=>UI.decode({v:2,e,size:4096,types:[],kinds:['walker'],b:[],z:[[1,0,x,100,0,100],[2,0,500,500,0,100]],ukinds:[],u:[],decks:[],mates:[[2,'Sam',x,0,0,0]],host:{x,y:0,a:0},self:{x:10,y:10,a:0,hp:100,max:100}});
 const prev=mk(100,10),cur=mk(200,10.5);
 const a=scene.read({prev,cur,t:.5,self:{...cur.self,x:30}});
 const z=a.zombies.find(q=>q.id===1);assert.equal(z.x,150);assert.equal(a.elapsed,10.25);assert.equal(a.self.x,30,'avatar prédit par le client');
 assert.equal(a.mates[0].x,150);assert.equal(a.mates[0].name,'Sam');assert.equal(a.host.x,150);
 const b=scene.read({prev,cur,t:1,self:cur.self});assert.equal(b.zombies.find(q=>q.id===1),z,'même objet d’affichage');assert.equal(z.x,200);
 const next=UI.decode({v:2,e:11,types:[],kinds:['walker'],b:[],z:[[2,0,510,500,0,100]],self:{x:10,y:10,a:0,hp:100,max:100},host:{x:0,y:0,a:0}});
 const c=scene.read({prev:cur,cur:next,t:1,self:next.self});assert.deepEqual(c.zombies.map(q=>q.id),[2],'un corps sorti de l’image est oublié');
 // Client : seule sa propre position est prédite (dernière intention, un quart de seconde au plus) ; les corps restent ceux de l'image.
 let clock=0,sock=null;const client=UI.createClient({now:()=>clock,WebSocket:function(){sock=this;this.readyState=1;this.send=()=>{};this.close=()=>{};}});
 assert.equal(client.join('ws://relais',CODE,'Lise','district'),true);sock.onopen();
 client.receive({type:'welcome',protocol:P,seat:1,role:'district',name:'Lise',tick:0});
 const view=t=>({type:'frame',protocol:P,tick:t,seat:1,ack:0,view:{v:2,e:t,types:[],kinds:['walker'],b:[],z:[[1,0,100*t,0,0,100]],self:{x:100,y:100,a:0,hp:100,max:100,dead:0,speed:R.avatar.speed},host:{x:0,y:0,a:0}}});
 client.receive(view(1));clock=125;client.receive(view(2));
 client.setMove({x:1,y:0});clock=125+5000;
 const st=client.frameState();assert.ok(Math.abs(st.self.x-(100+R.avatar.speed*.25))<1e-9,'prédiction bornée à 0,25 s');
 assert.equal(st.cur.zombies[0].x,200);assert.equal(st.t,1);
});

test('C6.2 vue 2,5D : peintres de la cité sur l’image, sans tirage, sans écriture dans la partie ni dans l’image',()=>{
 const {createCanvas}=require('@napi-rs/canvas');
 const {g}=campaign();const s=seat(g);loaded(g);steps(g,20);s.deliver();
 const raw=s.guest.view(),copy=JSON.stringify(raw),cur=UI.decode(raw),before=stamp(g.serialize());
 const camera=JSON.stringify(g.camera),elapsed=g.elapsed,zombies=g.zombies.length,units=g.units.length;
 const canvas=createCanvas(960,600),ctx=canvas.getContext('2d'),faults=[];
 const [ok,hits]=noRandom(g,()=>g.coopViews218.iso(ctx,{prev:null,cur,t:1,self:cur.self},{width:960,height:600,faults}));
 assert.equal(ok,true);assert.deepEqual(faults,[],'aucun peintre en erreur');assert.equal(hits,0,'aucun tirage');
 assert.equal(JSON.stringify(raw),copy,'image intacte');assert.equal(stamp(g.serialize()),before,'partie intacte');
 assert.equal(JSON.stringify(g.camera),camera);assert.equal(g.elapsed,elapsed);assert.equal(g.zombies.length,zombies);assert.equal(g.units.length,units);
 // L'image est réellement peinte : du contenu autour de l'avatar (centre) et des bâtiments.
 const px=ctx.getImageData(0,0,960,600).data;let lit=0;for(let i=0;i<px.length;i+=16)if(px[i]+px[i+1]+px[i+2]>90)lit++;
 assert.ok(lit>500,'pixels peints : '+lit);
 assert.equal(g.coopViews218.diagnostics().isoPaints,1);
 // Sans peintres de cité (prototype absent), la vue 2,5D refuse : l'interface garde la vue de dessus.
 assert.equal(VW.createViews({game:null}).iso(ctx,{prev:null,cur,t:1,self:cur.self},{width:10,height:10}),false);
});

test('C6.2 vue 2,5D : étages de citadelle lus dans l’image, peints au-dessus du socle',()=>{
 const {createCanvas}=require('@napi-rs/canvas');const {g}=campaign();
 const type=Object.keys(C.VerticalCitadel175.bases)[0],def=C.CityGeometry202.definition(type,0);
 const view={v:2,e:1,size:4096,seed:7,types:[type],kinds:[],b:[[50,0,60,60,def.size[0],def.size[1],100,0,0,0,0]],z:[],ukinds:[],u:[],
  decks:[[50,60,60,7.6,def.size[0],def.size[1],.4,0],[50,60.5,60.5,8,1,1,1.2,1]],self:{x:61*32,y:63*32+80,a:0,hp:100,max:100},host:{x:0,y:0,a:0,away:1}};
 const cur=UI.decode(view),canvas=createCanvas(640,480),ctx=canvas.getContext('2d'),faults=[];
 const scene=VW.createScene().read({prev:null,cur,t:1,self:cur.self});assert.equal(scene.decks.get(50).length,2);assert.equal(scene.host.dead,true,'Commandant en sortie : non peint');
 assert.equal(g.coopViews218.iso(ctx,{prev:null,cur,t:1,self:cur.self},{width:640,height:480,faults}),true);assert.deepEqual(faults,[]);
});

test('C6.2 vue FPS : le peintre WebGL de la citadelle peint depuis l’œil de l’avatar, sans effet ; repli sans WebGL',()=>{
 const {g}=campaign();const s=seat(g);loaded(g);steps(g,20);s.deliver();
 const raw=s.guest.view(),copy=JSON.stringify(raw),cur=UI.decode(raw),before=stamp(g.serialize()),elapsed=g.elapsed;
 const r=recorder(),views=VW.createViews({game:g}),F=[];
 const [ok,hits]=noRandom(g,()=>views.fps(r.canvas,{prev:null,cur,t:1,self:cur.self},{aim:.5,pitch:-.2,faults:F}));assert.deepEqual(F,[]);
 assert.equal(ok,true);assert.equal(hits,0);assert.equal(views.webgl(),true);
 // Œil de l'avatar (cases), regard de l'invité ; décor statique (bâtiments) et acteurs (corps de l'image).
 const eye=r.calls.find(c=>c[0]==='uniform3f'),angles=r.calls.find(c=>c[0]==='uniform2f');
 // Appels enregistrés : [nom, emplacement de l'uniforme, valeurs…].
 assert.ok(Math.abs(eye[2]-cur.self.x/C.TILE)<1e-6&&Math.abs(eye[3]-cur.self.y/C.TILE)<1e-6&&eye[4]===C.VerticalCitadel175.eyeHeight);
 assert.ok(Math.abs(angles[2]-.5)<1e-6&&Math.abs(angles[3]+.2)<1e-6);
 const d=views.diagnostics().renderer;assert.ok(d.staticVertices>36*100,'murs et maisons en relief : '+d.staticVertices);assert.ok(d.dynamicVertices>=36*6*20,'corps : '+d.dynamicVertices);
 assert.equal(JSON.stringify(raw),copy);assert.equal(stamp(g.serialize()),before);assert.equal(g.elapsed,elapsed);
 assert.equal(g.vertical175.presentation().controlled,null,'la citadelle de la partie n’est pas prise');
 // Repli : sans contexte WebGL, la vue FPS refuse et le dit ; l'interface repasse sur la vue de dessus.
 const none=VW.createViews({game:g}),canvas={getContext:()=>null,addEventListener(){},removeEventListener(){},getBoundingClientRect:()=>({width:10,height:10})};
 assert.equal(none.fps(canvas,{prev:null,cur,t:1,self:cur.self},{aim:0}),false);assert.equal(none.webgl(),false);
 views.dispose();assert.equal(r.listeners.size,0,'contexte libéré');
});

test('C6.2 marche FPS : l’avant suit le regard ; intention toujours unitaire',()=>{
 assert.deepEqual(VW.turnMove({x:0,y:-1},0),{x:1,y:0});
 const back=VW.turnMove({x:0,y:1},Math.PI/2);assert.ok(Math.abs(back.x)<1e-4&&Math.abs(back.y+1)<1e-4);
 const side=VW.turnMove({x:1,y:0},0);assert.ok(Math.abs(side.x)<1e-4&&Math.abs(side.y-1)<1e-4,'droite = +y à regard nul');
 assert.deepEqual(VW.turnMove({x:0,y:0},1),{x:0,y:0});
 for(let a=-3;a<=3;a+=.37){const m=VW.turnMove(UI.moveOf(new Set(['KeyW','KeyD'])),a);assert.ok(Math.abs(Math.hypot(m.x,m.y)-1)<1e-3);}
});

test('C6.2 interface : vue 2,5D par défaut, bascule 2,5D → FPS → dessus, bouton et touche V annoncés',()=>{
 const {g,doc}=campaign();
 assert.equal(g.coopUI217.view(),'iso');assert.ok(doc.getElementById('coop217Fps'));const btn=doc.getElementById('coop217View');assert.ok(btn);
 btn.dispatchEvent?.({type:'click'});if(g.coopUI217.view()==='iso')btn.click?.();
 assert.equal(g.coopUI217.view(),'fps');assert.equal(g.coopUI217.setView('top'),true);assert.equal(g.coopUI217.view(),'top');assert.equal(g.coopUI217.setView('3d'),false);
 assert.match(read('src/coop-ui217.js'),/V : changer de vue/);
});

test('C6.2 sans session : rien n’est enveloppé, sauvegarde identique ; présentation sans tirage ni écriture',()=>{
 const a=bootDocument134();a.g.startNew('standard','17117');a.g.campaignIntro132?.skip?.();
 const update=a.g.update,serialize=a.g.serialize,render=a.g.render;
 VW.install(a.g);assert.equal(VW.install(a.g),false,'installation unique');
 assert.equal(a.g.update,update);assert.equal(a.g.serialize,serialize);assert.equal(a.g.render,render);
 const s0=stamp(a.g.serialize());steps(a.g,30);const s1=stamp(a.g.serialize());
 const b=bootDocument134();b.g.startNew('standard','17117');b.g.campaignIntro132?.skip?.();steps(b.g,30);
 assert.equal(typeof s0,'string');assert.equal(JSON.parse(s1).version,JSON.parse(stamp(b.g.serialize())).version);
 assert.deepEqual(Object.keys(JSON.parse(s1)).sort(),Object.keys(JSON.parse(stamp(b.g.serialize()))).sort(),'aucune clé de sauvegarde');
 const src=read('src/coop-views218.js').replace(/\/\/.*$/gm,'');
 assert.ok(!/Math\.random|g\.random|\.random\(|resources\.[a-z]+\s*[-+]?=|\.update\(|setInterval|Date\.now|expansions\.register/.test(src));
 // Script public : chargé après l'interface coop, mis en cache par le service de travail.
 const html=read('index.html'),at=n=>html.indexOf('<script src="src/'+n+'"></script>');
 assert.ok(at('coop-ui217.js')>0&&at('coop-ui217.js')<at('coop-views218.js'));assert.ok(read('sw.js').includes('"src/coop-views218.js"'));
});
