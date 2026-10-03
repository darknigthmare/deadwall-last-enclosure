'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),Art=require('../src/art.js'),G=require('../src/frontier-geometry.js');
globalThis.DeadwallCore=C;
const A=require('../src/world-evolution-art.js');
function fixture(ids=['samir']){
 const calls=[],arcs=[],transforms=[];
 const members=ids.map((id,i)=>({id,x:20+i,y:30+i,z:0,inside:null,health:100,a:.6}));
 const ctx={save(){},restore(){},scale(...a){transforms.push(a);},translate(){},rotate(){},beginPath(){},arc(...a){arcs.push(a);},fill(){},stroke(){},ellipse(){}};
 const g={state:'playing',world:{},player:{},settings:{reducedMotion:false},elapsed:1,
  worldEvolution:{overview:()=>({districts:[],groups:[],companions:members.map(p=>({...p}))}),structureDestroyed:()=>false},
  art:{drawActor(_ctx,p,kind,time,reducedMotion){calls.push({p,kind,time,reducedMotion,snapshot:{...p}});return true;}}};
 const v={x:20,y:30,z:0,inside:null,world:{nearPOI:()=>[]}},view={l:0,r:60,t:0,b:60};
 const paint=()=>{calls.length=0;arcs.length=0;A.draw(ctx,g,v,view);return calls;};
 return{g,ctx,v,view,members,calls,arcs,transforms,paint};
}
test('1.28 art régional : quatre rôles existants, échelle métrique et objets stables sans mutation',()=>{
 const f=fixture(['lea','samir','ines','malik']),before=JSON.stringify(f.members);f.paint();
 assert.deepEqual(f.calls.map(c=>c.kind),['workerAlt','medic','engineer','soldier']);
 const proxies=f.calls.map(c=>c.p);
 for(const[c,i]of f.calls.map((c,i)=>[c,i])){assert.equal(c.p.x,f.members[i].x*32);assert.equal(c.p.y,f.members[i].y*32);assert.equal(c.p.facing,.6);assert.ok(Art.ACTORS[c.kind]);}
 assert.ok(f.transforms.every(a=>a[0]===1/32&&a[1]===1/32));
 f.paint();assert.deepEqual(f.calls.map(c=>c.p),proxies);assert.equal(JSON.stringify(f.members),before);assert.equal(f.arcs.length,0);
});
test('1.28 art régional : seuls les déplacements continus font marcher ; arrêt sans pas résiduel',()=>{
 const f=fixture();f.paint();const p=f.calls[0].p;assert.equal(p.visualMotionReset,true);
 f.g.elapsed+=.05;f.members[0].x+=C.WorldEvolution.RULES.companionRules.speed*.05;f.paint();
 assert.equal(f.calls[0].p,p);assert.equal(p.visualMoving,true);assert.equal(p.visualMotionReset,false);
 f.paint();assert.equal(p.visualMoving,true,'deux peintures du même pas conservent sa pose');
 f.g.elapsed+=.05;f.paint();assert.equal(p.visualMoving,false);assert.equal(p.visualMotionReset,true);
});
test('1.28 art régional : pause, modale et déplacement sans temps ne fabriquent pas de pas',()=>{
 const f=fixture();f.paint();const move=()=>{f.g.elapsed+=.05;f.members[0].x+=.1;f.paint();return f.calls[0].p;};
 assert.equal(move().visualMoving,true);f.g.paused=true;f.paint();assert.equal(f.calls[0].p.visualMoving,false);
 f.g.paused=false;f.paint();assert.equal(f.calls[0].p.visualMoving,false);assert.equal(move().visualMoving,true);
 f.g.activeOverlay={};assert.equal(move().visualMoving,false);f.g.activeOverlay=null;assert.equal(move().visualMoving,true);
 f.members[0].x+=.1;f.paint();assert.equal(f.calls[0].p.visualMoving,false);
 f.g.elapsed+=.05;f.members[0].x+=15;f.paint();assert.equal(f.calls[0].p.visualMoving,false);
});
test('1.28 art régional : reprise et changements de scène ne reprennent pas un ancien cycle',()=>{
 const f=fixture();f.paint();const old=f.calls[0].p;f.g.elapsed+=.05;f.members[0].x+=.1;f.paint();assert.equal(old.visualMoving,true);
 f.g.world={};f.paint();assert.notEqual(f.calls[0].p,old);assert.equal(f.calls[0].p.visualMotionReset,true);
 f.members[0].inside=f.v.inside='P0001';f.g.elapsed+=.05;f.members[0].x+=.1;f.paint();assert.equal(f.calls[0].p.visualMoving,false);
 f.members[0].z=f.v.z=1;f.g.elapsed+=.05;f.members[0].x+=.1;f.paint();assert.equal(f.calls[0].p.visualMoving,false);
 f.members.length=0;f.paint();f.members.push({id:'samir',x:20,y:30,z:1,inside:'P0001',health:100});f.paint();assert.notEqual(f.calls[0].p,old);assert.equal(f.calls[0].p.visualMotionReset,true);
});
test('1.28 art régional : morts, passagers, autre étage/intérieur et hors champ restent masqués',()=>{
 const f=fixture();for(const patch of[{health:0},{riding:true},{z:1,inside:'P0001'},{x:62},{y:NaN}]){Object.assign(f.members[0],{health:100,riding:false,z:0,inside:null,x:20,y:30},patch);f.paint();assert.equal(f.calls.length,0,JSON.stringify(patch));}
 Object.assign(f.members[0],{x:20,y:30,z:1,inside:'P0002'});f.v.z=1;f.v.inside='P0001';f.paint();assert.equal(f.calls.length,0);
 f.members[0].inside='P0001';f.paint();assert.equal(f.calls.length,1);
});
test('1.28 art régional : occultation par toit réel, y compris bâtiment tourné, ruine et destruction',()=>{
 const f=fixture(),place={id:'P0001',type:'house',x:20,y:30,w:12,h:4,a:Math.PI/3};
 f.v.world.nearPOI=()=>[place];Object.assign(f.members[0],G.global(place,3,2));f.paint();assert.equal(f.calls.length,0);
 f.v.inside=place.id;f.paint();assert.equal(f.calls.length,1);
 f.v.inside=null;place.type='ruin';f.paint();assert.equal(f.calls.length,1);
 place.type='house';f.g.worldEvolution.structureDestroyed=()=>true;f.paint();assert.equal(f.calls.length,1);
 f.g.worldEvolution.structureDestroyed=()=>false;Object.assign(f.members[0],G.global(place,-1,2));f.paint();assert.equal(f.calls.length,1);
});
test('1.28 art régional : texture absente conserve le repère de secours à la vraie position',()=>{
 const f=fixture();f.g.art.drawActor=()=>false;f.paint();assert.equal(f.arcs.length,1);assert.deepEqual(f.arcs[0].slice(0,3),[20,30,.34]);
 f.g.art=null;f.paint();assert.equal(f.arcs.length,1);
});
test('1.28 art régional : peintre atlas réel anime la marche puis fixe arrêt et mouvement réduit',async()=>{
 const image=globalThis.Image;globalThis.Image=class{set src(_){this.onerror();}};
 try{
  const f=fixture(),art=Art.create();await art.ready;art.images.specialists={};f.g.art=art;
  const frames=[];art.blit=(_c,atlas,rect)=>{frames.push({atlas,rect});return true;};
  f.paint();assert.deepEqual(frames.at(-1).rect,Art.frameRect('specialists',0,0));
  f.g.elapsed=1.05;f.members[0].x+=.15;f.paint();assert.notDeepEqual(frames.at(-1).rect,Art.frameRect('specialists',0,0));
  f.g.elapsed=1.10;f.paint();assert.deepEqual(frames.at(-1).rect,Art.frameRect('specialists',0,0),'aucun reliquat de marche à l’arrêt');
  f.g.settings.reducedMotion=true;f.g.elapsed=1.15;f.members[0].x+=.15;f.paint();assert.deepEqual(frames.at(-1).rect,Art.frameRect('specialists',0,0));
  assert.equal(art.namedMotion.size,0,'identités stables via WeakMap, sans registre nommé supplémentaire');
 }finally{globalThis.Image=image;}
});
test('1.28 art régional : suivre, tenir et recharger une vraie campagne conservent le contrat visuel',()=>{
 const {game:g}=require('./helpers/expansions127.cjs').boot127();g.startNew('standard','17117');g.worldEvolution.enableWorld4();g.population=10;g.resources.food=100;
 assert.ok(g.worldEvolution.assignCompanion('samir'));g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());
 const captured=[],f=fixture();g.art={drawActor(_c,p){captured.push({...p});return true;}};
 const paint=()=>{const v=g.frontier.overview(),view={l:v.x-60,r:v.x+60,t:v.y-60,b:v.y+60};captured.length=0;A.draw(f.ctx,g,v,view);return captured[0];};
 g.update(.05);assert.equal(paint().visualMoving,false);g.input.keys.add('KeyD');
 let walked=false;for(let i=0;i<30;i++){g.update(.05);walked ||= paint()?.visualMoving;}
 assert.ok(walked);g.input.keys.clear();assert.ok(g.companionsPack.setOrder('hold').ok);g.update(.05);assert.equal(paint().visualMoving,false);
 const saved=g.serialize();g.restoreSave(saved);g.update(.05);assert.equal(paint().visualMoving,false);
 const after=g.serialize();delete saved.timestamp;delete after.timestamp;
 assert.deepEqual(after.expansions127.modules.companions.positions,saved.expansions127.modules.companions.positions);
 assert.equal(Object.hasOwn(after,'regionalPresentation'),false);
});
