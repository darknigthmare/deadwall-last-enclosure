'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

test('Zoom 1.37 : boutons et molette agissent sur la vue jouée, avec bornes et verrou modal',()=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 const buttons=[...doc.querySelectorAll('[data-game-command]')],click=command=>{
  const b=buttons.find(b=>b.dataset.gameCommand===command);assert.ok(b);b.click();
 };
 const local=g.camera.zoom;click('zoomIn');assert.ok(g.camera.zoom>local);click('zoomOut');assert.ok(Math.abs(g.camera.zoom-local)<1e-10);
 // Prepared free boundary approach; entry uses the shipped command and G6 map.
 g.player.x=4050;g.player.y=2048;assert.equal(g.frontier.enter(),true);assert.equal(g.frontier.active(),true);
 const regional=g.frontier.scale();click('zoomIn');assert.ok(g.frontier.scale()>regional,'Le bouton doit rapprocher la région visible');assert.equal(g.camera.zoom,local);
 click('zoomOut');assert.ok(Math.abs(g.frontier.scale()-regional)<1e-10);
 g.canvas.dispatch('wheel',{deltaY:-1,clientX:640,clientY:360});assert.ok(g.frontier.scale()>regional,'La molette doit rapprocher la région visible');assert.equal(g.camera.zoom,local);
 for(let i=0;i<30;i++)click('zoomIn');assert.equal(g.frontier.scale(),44);
 for(let i=0;i<30;i++)click('zoomOut');assert.equal(g.frontier.scale(),12);
 g.arsenalUI134.open();click('zoomIn');g.canvas.dispatch('wheel',{deltaY:-1,clientX:640,clientY:360});assert.equal(g.frontier.scale(),12);assert.equal(g.camera.zoom,local);g.arsenalUI134.close();
});
