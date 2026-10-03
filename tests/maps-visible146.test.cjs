'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),{boot127}=require('./helpers/expansions127.cjs');
const C=require('../src/core.js');

function trace(){
 const calls=[],stack=[],c=new Proxy({calls,measureText:t=>({width:String(t).length*6})},{
  get(target,key){if(key in target)return target[key];return(...args)=>{if(key==='save')stack.push({fillStyle:target.fillStyle,strokeStyle:target.strokeStyle});if(key==='restore')Object.assign(target,stack.pop()||{});calls.push({name:key,args,color:target.fillStyle,stroke:target.strokeStyle});};},
  set(target,key,value){target[key]=value;return true;}
 });return c;
}
const marks=(c,color,name='fillRect')=>c.calls.filter(call=>call.name===name&&call.color===color).map(call=>call.args);
function visibility(g){let frames=0;const seen=new Set();g.visibility={frame(){frames++;return{canSeeLocal:e=>seen.has(e.id),canSeeRegional:e=>seen.has(e.id)};}};return{seen,frames:()=>frames};}
const enemy=(id,x,y,z=0)=>({id,x,y,z,hp:50,health:50,dead:false});

test('map 1.46: base local GPS and offscreen arrows consume current observation instead of daylight omniscience',()=>{
 const {game:g}=bootGame();g.startNew('standard','903145');const c=trace(),v=visibility(g);g.mctx=c;g.nightwatch={visible:()=>true};
 g.zombies=[enemy(901,900,800),enemy(902,3600,3600)];v.seen.add(901);
 Object.getPrototypeOf(g).renderMinimap.call(g);
 assert.deepEqual(marks(c,'#b64f45'),[[900*g.minimap.width/C.WORLD_SIZE,800*g.minimap.height/C.WORLD_SIZE,1.5,1.5]]);assert.equal(v.frames(),1);
 c.calls.length=0;v.seen.clear();Object.getPrototypeOf(g).drawThreatArrows.call(g,c);assert.equal(marks(c,'rgba(197,83,73,.9)','fill').length,0);
 c.calls.length=0;v.seen.add(902);Object.getPrototypeOf(g).drawThreatArrows.call(g,c);assert.equal(marks(c,'rgba(197,83,73,.9)','fill').length,1);
 delete g.visibility;c.calls.length=0;Object.getPrototypeOf(g).renderMinimap.call(g);assert.equal(marks(c,'#b64f45').length,0,'No permissive fallback if visibility service is unavailable');
});

test('map 1.46: the installed exploration GPS override refreshes its own observation frame',()=>{
 const {game:g}=boot127();g.startNew('standard','903145');const c=trace(),v=visibility(g);g.mctx=c;g.nightwatch={visible:()=>true};
 g.zombies=[enemy(901,900,800),enemy(902,1000,800)];v.seen.add(902);g.renderMinimap();assert.equal(marks(c,'#b64f45').length,1);assert.equal(v.frames(),1);
 c.calls.length=0;v.seen.clear();g.renderMinimap();assert.equal(marks(c,'#b64f45').length,0);assert.equal(v.frames(),2,'A map cannot retain contacts after its observer leaves');
});

test('map 1.46: regional GPS filters POI, wild-group and risen contacts by current vision and floor',()=>{
 const {game:g}=boot127();g.startNew('standard','903145');require('../src/frontier-art.js');require('../src/atlas-render.js');
 g.player.x=4058;g.player.y=2068;assert.ok(g.frontier.enter());const v=g.frontier.overview(),c=trace(),control=visibility(g);g.mctx=c;
 const a=enemy('poi:1',v.x+4,v.y),b=enemy('group:1',v.x+6,v.y),d=enemy('fallen:1',v.x+8,v.y),hidden=enemy('poi:2',v.x+10,v.y),upper=enemy('poi:3',v.x+12,v.y,1);
 v.enemies=[a,hidden,upper];g.worldEvolution={groupMembers:()=>[b]};g.succession133={contacts:()=>[d,a]};for(const e of [a,b,d,upper])control.seen.add(e.id);
 globalThis.DeadwallFrontierArt.minimap(g,v);assert.deepEqual(marks(c,'#cb8270','arc').map(q=>q.slice(0,2)),[[a.x,a.y],[b.x,b.y],[d.x,d.y]]);assert.equal(control.frames(),1);
 c.calls.length=0;control.seen.clear();globalThis.DeadwallFrontierArt.minimap(g,v);assert.equal(marks(c,'#cb8270','arc').length,0);
});

test('map 1.46: wild atlas dots use observed members, never the remembered group centre or total',()=>{
 const c=trace(),shown=enemy('wild:1',12,18),hidden=enemy('wild:2',50,70),control={canSeeRegional:e=>e.id===shown.id};
 require('../src/world-evolution-art.js');const g={worldEvolution:{overview:()=>({districts:[],visibleGroups:[{x:500,y:700,alive:300,kind:'frenzied'}]}),groupMembers:()=>[shown,hidden]}};
 globalThis.DeadwallWorldEvolutionArt.atlas(c,g,{active:true,z:0},{scale:1,screen:(x,y)=>({x,y})},()=>{},control);
 assert.deepEqual(marks(c,'#cb8270','arc'),[[12,18,2.5,0,Math.PI*2]]);assert.equal(c.calls.some(call=>call.name==='arc'&&call.args[0]===500),false);
 c.calls.length=0;globalThis.DeadwallWorldEvolutionArt.atlas(c,g,{active:true,z:1},{scale:1,screen:(x,y)=>({x,y})},()=>{},control);assert.equal(marks(c,'#cb8270','arc').length,0);
});

test('map 1.46: the atlas shares one observation frame for D17, regional sources and its visible floor legend',()=>{
 const {game:g}=boot127();g.startNew('standard','903145');const A=require('../src/atlas-render.js'),P=require('../src/atlas-projection.js');require('../src/world-evolution-art.js');
 const view=g.frontier.overview(),h=P.home(g),c=trace(),control=visibility(g),a=enemy('poi:1',h.x+80,h.y),b=enemy('group:1',h.x+85,h.y),d=enemy('fallen:1',h.x+90,h.y);
 const local=enemy(901,2200,2000),localHidden=enemy(902,2400,2000),wrong=enemy('poi:2',h.x+80,h.y,1);g.zombies=[local,localHidden];view.enemies=[a,wrong];
 g.worldEvolution={overview:()=>({districts:[],visibleGroups:[{x:h.x+500,y:h.y,alive:300}]}),groupMembers:()=>[b]};g.succession133={contacts:()=>[d,a]};for(const e of [local,a,b,d,wrong])control.seen.add(e.id);
 const cam=P.camera(640,480);cam.fit(h.x,h.y,300);A.render(c,g,view,cam,{city:true});
 const expected=[a,d,local,b].map(e=>{const p=typeof e.id==='number'?P.toRegion(e.x,e.y,g):e,q=cam.screen(p.x,p.y);return[q.x,q.y];});
 assert.deepEqual(marks(c,'#cb8270','arc').map(q=>q.slice(0,2)),expected);assert.equal(control.frames(),1);
 assert.ok(c.calls.some(call=>call.name==='fillText'&&call.args[0]==='CONTACTS OBSERVÉS · RDC'));
 c.calls.length=0;control.seen.clear();A.render(c,g,view,cam,{city:true});assert.equal(marks(c,'#cb8270','arc').length,0);assert.equal(control.frames(),2);
});

test('map 1.46: Commandement paints only observed D17 contacts and refreshes while paused',()=>{
 const env=require('./helpers/document133.cjs').bootDocument133();env.ready();const g=env.g;g.startNew('standard','903145');
 if(g.campaignIntro132?.isOpen())g.campaignIntro132.skip();g.showCommand(true);document.getElementById('commandPanel-enclosure').classList.remove('hidden');
 const c=trace(),control=visibility(g);g.commandPresentation.map.getContext=()=>c;g.nightwatch={visible:()=>true};g.zombies=[enemy(901,900,800),enemy(902,1000,800)];control.seen.add(902);
 g.commandPresentation.refresh(true);assert.equal(marks(c,'#aa3934').length,1);assert.equal(control.frames(),1);assert.match(g.commandPresentation.map.getAttribute('aria-label'),/actuellement observés/);
 c.calls.length=0;control.seen.clear();g.commandPresentation.refresh(true);assert.equal(marks(c,'#aa3934').length,0);assert.equal(control.frames(),2);
});

test('map 1.46: physical wall, departing observer and Continue change map dots without consuming stocks or RNG',()=>{
 const {game:g}=bootGame();g.startNew('standard','903145');g.daylight=()=>1;g.player.x=1000;g.player.y=1000;
 const e={...enemy(901,1200,1000),kind:'walker',attackCooldown:0};g.zombies=[e];g.nextId=902;const Vision=require('../src/visibility146.js');delete g.visibility;Vision.install(g);const c=trace();g.mctx=c;
 const material=()=>{const {timestamp,...d}=g.serialize();return JSON.stringify(d);};
 let before=material();Object.getPrototypeOf(g).renderMinimap.call(g);assert.equal(marks(c,'#b64f45').length,1);assert.equal(material(),before);
 const wall=new(g.core().constructor)(g.nextId++,'woodWall',34,31,0,1);g.world.add(wall);c.calls.length=0;before=material();Object.getPrototypeOf(g).renderMinimap.call(g);assert.equal(marks(c,'#b64f45').length,0);assert.equal(material(),before);
 const checkpoint=g.serialize();g.restoreSave(checkpoint);c.calls.length=0;before=material();Object.getPrototypeOf(g).renderMinimap.call(g);assert.equal(marks(c,'#b64f45').length,0);assert.equal(material(),before);
 g.world.remove(g.world.buildings.get(wall.id));g.player.x=200;g.player.y=200;c.calls.length=0;before=material();Object.getPrototypeOf(g).renderMinimap.call(g);assert.equal(marks(c,'#b64f45').length,0);assert.equal(material(),before);
});
