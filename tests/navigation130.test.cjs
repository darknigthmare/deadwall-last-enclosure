'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,pose,trace}=require('./helpers/navigation130.cjs');
const G=require('../src/frontier-geometry.js'),P=require('../src/atlas-projection.js');
function state(g){const d=g.serialize();delete d.timestamp;return JSON.stringify(d);}
function known(g){const p=g.frontier.world().pois.find(p=>p.levels.includes(1)),d=g.serialize();d.frontier.seen=[p.id];g.restoreSave(d);assert.ok(g.frontier.pin(p.id));return p;}

test('GPS 1.30 : vraie chaîne minimap régionale, ancien calque D-17 exclu',()=>{
 const{g,label}=fixture();g.mctx=trace();g.renderMinimap();assert.match(label.textContent,/D-17/);
 const v=pose(g,{x:4800,y:4200});g.mctx=trace();const result=g.renderMinimap();assert.equal(result.seed,17117);assert.deepEqual(result.position,{x:v.x,y:v.y});assert.match(label.textContent,/GPS RÉGIONAL/);
 assert.equal(g.mctx.calls.some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]==='#89b6ac'),false,'les repères de reconnaissance locale ne doivent pas être peints dans le repère régional');
 assert.ok(g.mctx.calls.some(c=>c[0]==='translate'&&c[1]===-v.x&&c[2]===-v.y));
});

test('GPS 1.30 : déplacement, orientation et sauvegarde suivent la position régionale',()=>{
 const{g}=fixture(),p=known(g);pose(g,{x:4600,y:4096});const a=g.frontier.guidance();assert.equal(a.id,p.id);assert.deepEqual(a.path[0],{x:4600,y:4096});
 const d=g.serialize();d.frontier.x=5100;d.frontier.y=4300;d.frontier.a=1.3;g.restoreSave(d);g.mctx=trace();const result=g.renderMinimap();assert.deepEqual(result.position,{x:5100,y:4300});assert.equal(result.destination,p.id);assert.ok(g.mctx.calls.some(c=>c[0]==='rotate'&&c[1]===1.3));assert.deepEqual(g.frontier.guidance().path[0],{x:5100,y:4300});
 const persisted=state(g);g.renderMinimap();assert.equal(state(g),persisted,'dessiner ne modifie pas la campagne');
});

test('GPS 1.30 : repère routier visible et direction D-17 même hors écran',()=>{
 const{g}=fixture(),p=known(g);pose(g,{x:4800,y:4300});g.mctx=trace();g.renderMinimap();assert.ok(g.mctx.calls.some(c=>c[0]==='fillText'&&c[1]==='D-17'));assert.ok(g.mctx.calls.some(c=>c[0]==='fillText'&&c[1]===p.name));assert.ok(g.mctx.calls.some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]==='#f5d278'));assert.match(g.minimap.getAttribute('aria-label'),/4800\.0.*4300\.0/);
});

test('GPS 1.30 : étage affiché avec son vrai plan, aucun itinéraire horizontal trompeur',()=>{
 const{g,label}=fixture(),p=known(g),plan=g.frontier.world().plan(p,1),stairs=plan.stairs[0],q=G.global(p,stairs.x+stairs.w/2,stairs.y+stairs.h/2);pose(g,q,{z:1,inside:p.id});g.mctx=trace();const result=g.renderMinimap(),route=g.frontier.guidance();assert.equal(route.status,'level-required');assert.deepEqual(route.path,[]);assert.equal(result.level,1);assert.ok(result.scale>g.minimap.width/320);assert.match(label.textContent,/ÉTAGE 1/);assert.ok(g.mctx.calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('rez-de-chaussée')));assert.ok(g.mctx.calls.some(c=>c[0]==='fillRect'&&c[1]===stairs.x&&c[2]===stairs.y&&c[3]===stairs.w&&c[4]===stairs.h));
 pose(g,{x:p.drive.b.x,y:p.drive.b.y});assert.equal(g.frontier.guidance().status,'guiding');assert.ok(g.frontier.guidance().path.length);
});

test('GPS 1.30 : le monde de la graine restaurée est utilisé après une nouvelle partie',()=>{
 const{g}=fixture(),p=known(g);pose(g,{x:4700,y:4300});const save=g.serialize();g.startNew('standard','8931');pose(g,{x:4700,y:4300});const second=g.renderMinimap();assert.equal(second.seed,8931);assert.equal(second.destination,null);g.restoreSave(save);const back=g.renderMinimap();assert.equal(back.seed,17117);assert.equal(back.destination,p.id);assert.deepEqual(back.position,{x:4700,y:4300});
});

test('GPS 1.30 : pied et volant lisent le même registre régional',()=>{
 const{g}=fixture();g.world.add(new(g.core().constructor)(g.nextId++,'expeditionGarage',77,65,0,1));g.refreshMetrics(true);g.fieldcraft.setup();require('./helpers/physical-fixtures.cjs').standAt(g,g.player,g.core());g.resources.wood=g.resources.scrap=300;assert.ok(g.expeditions.buildCar().ok);const v=g.expeditions.car();v.x=g.player.x=4058;v.y=g.player.y=2048;v.fuel=20;v.driving=true;g.player.radius=22;assert.ok(g.frontier.enter());const d=g.serialize();d.frontier.x=d.frontier.car.x=4300;d.frontier.y=d.frontier.car.y=4096;g.restoreSave(d);g.mctx=trace();const driving=g.renderMinimap();assert.deepEqual(driving.position,{x:4300,y:4096});assert.ok(g.frontier.position().car.driving);const stop=g.serialize();stop.frontier.car.driving=false;stop.frontier.x+=2;g.restoreSave(stop);assert.deepEqual(g.renderMinimap().position,{x:4302,y:4096});
});

test('GPS 1.30 : CARTE puis M ouvrent la carte réelle autour du joueur régional',()=>{
 const{g,doc,dispatchWindow}=fixture({ui:true});pose(g,{x:4900,y:4100});assert.ok(g.frontierUI.open());let cam=g.frontierUI.atlas.position();assert.equal(cam.x,4900);assert.equal(cam.y,4100);assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(g.paused,true);g.showCommand(false);assert.equal(g.paused,false);
 pose(g,{x:5900,y:4500});doc.activeElement=doc.body;dispatchWindow('keydown',{code:'KeyM',target:doc.body});cam=g.frontierUI.atlas.position();assert.equal(cam.x,5900);assert.equal(cam.y,4500);assert.equal(g.activeOverlay,g.ui.commandModal);dispatchWindow('keydown',{code:'KeyM',target:doc.body});assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
});

test('GPS 1.30 : bouton JOUEUR rafraîchit une ancienne vue et ruban courant comporte la destination',()=>{
 const{g,doc}=fixture({ui:true}),p=known(g);pose(g,{x:4800,y:4100});g.frontierUI.open();g.showCommand(false);pose(g,{x:5300,y:4300});g.frontierUI.atlas.locate();const cam=g.frontierUI.atlas.position();assert.equal(cam.x,5300);assert.equal(cam.y,4300);g.worldEvolutionUI.refresh(true);const gps=doc.getElementById('fieldDockGps');assert.match(gps.textContent,/GPS/);assert.ok(gps.textContent.includes(p.name));assert.ok(doc.getElementById('fieldDock').contains(gps));
});

test('GPS 1.30 : chemin absent ou entrée non finie ne casse pas le rendu',()=>{
 const R=require('../src/frontier-routing.js'),point={x:1,y:1};assert.equal(R.route({roads:[]},point,{drive:{a:point,b:point}}),null);assert.equal(R.route({roads:[{}]},point,{drive:{a:point,b:{x:NaN,y:0}}}),null);assert.equal(R.route({roads:[{}]}, {x:'1',y:1},{drive:{a:point,b:point}}),null);
});

test('GPS 1.30 : commandes d’étage et de tournée gardent le focus au rafraîchissement du ruban',()=>{
 const{g,doc}=fixture({ui:true}),p=known(g),pad=g.frontier.world().plan(p,0).stairs[0];pose(g,G.global(p,pad.x+pad.w/2,pad.y+pad.h/2),{inside:p.id});g.worldEvolutionUI.refresh(true);const up=doc.getElementById('dockUp');up.focus();assert.equal(doc.activeElement,up);g.worldEvolutionUI.refresh(true);assert.notEqual(doc.activeElement,up);assert.equal(doc.activeElement.id,'dockUp');assert.ok(doc.getElementById('fieldDock').contains(doc.activeElement));
 assert.ok(g.fieldAtlas.add(p.id));assert.ok(g.fieldAtlas.start());g.worldEvolutionUI.refresh(true);doc.getElementById('fieldDockNext').focus();g.worldEvolutionUI.refresh(true);assert.equal(doc.activeElement.id,'fieldDockNext');assert.ok(doc.getElementById('fieldDock').contains(doc.activeElement));assert.ok(g.fieldAtlas.next());g.worldEvolutionUI.refresh(true);assert.equal(doc.activeElement.id,'fieldDockMap');
});
