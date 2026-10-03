'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

function fixture(){
 const env=bootDocument134(),{g}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.setBuildCollapsed(true);g.updateUI();return env;
}
function openDrawer(node){node.open=true;node.dispatch('toggle');}
function generator(g){
 const C=globalThis.DeadwallCore,core=g.core();
 for(let r=4;r<22;r+=2)for(const[dx,dy]of[[r,0],[-r,0],[0,r],[0,-r]]){
  const gx=core.gx+dx,gy=core.gy+dy;if(!g.world.placement(C.BUILDINGS.generator,gx,gy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'generator',gx,gy,0,1);b.health=200;g.world.add(b);g.refreshMetrics(true);
  const point=g.fieldcraft.service(g.player,b);assert.ok(point);Object.assign(g.player,point);g.player.carry.scrap=24;return b;
 }
 throw Error('No physical approach for the prepared generator');
}
function beginFromHud(g,doc,b){
 openDrawer(g.hud135.regions().tools);const launch=doc.getElementById('interventions134Button');launch.focus();launch.click();
 const start=doc.getElementById('interventions134Action-work-local:'+b.id);assert.ok(doc.body.contains(start));assert.equal(start.disabled,false);start.focus();start.click();
 assert.equal(g.interventions134.busy(),true);assert.equal(g.player.carry.scrap,18);assert.equal(g.paused,false);
}

for(const [label,id,close]of[
 ['inventaire','carryIndicator',g=>g.loadoutUI.close()],
 ['paramètres','hudSettings14',g=>g.showSettings(false)]
])test('UI 1.38 : ouvrir '+label+' par le HUD interrompt immédiatement la tentative payée',()=>{
 const {g,doc}=fixture(),b=generator(g),resources={...g.resources};beginFromHud(g,doc,b);
 const button=doc.getElementById(id);assert.ok(doc.body.contains(button));button.focus();button.click();
 assert.ok(g.activeOverlay);assert.equal(g.paused,true);
 assert.equal(g.interventions134.busy(),false,'Une modale ne conserve pas un mini-jeu gelé');
 assert.equal(g.interventionsUI134.isOpen(),false);assert.equal(g.interventionsUI134.element.inert,true);
 assert.ok(g.activeOverlay.contains(doc.activeElement));
 const elapsed=g.elapsed;for(let i=0;i<30;i++)g.loop(g.lastFrame+40);
 assert.equal(g.elapsed,elapsed);close(g);
 assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.equal(g.interventions134.busy(),false);
 assert.equal(g.player.carry.scrap,18,'L’annulation ne rembourse ni ne paie une seconde fois');
 assert.deepEqual(g.resources,resources);assert.equal(b.health,200);assert.ok(doc.body.contains(doc.activeElement));
});

test('UI 1.38 : fermer l’établi retrouve un bouton visible ou le terrain après changement de tiroir',()=>{
 const {g,doc}=fixture(),r=g.hud135.regions(),launch=doc.getElementById('interventions134Button');
 // isConnected is native DOM state absent from the common simulated element.
 Object.defineProperty(launch,'isConnected',{get:()=>doc.body.contains(launch)});
 openDrawer(r.tools);launch.focus();launch.click();doc.getElementById('interventions134Close').focus();doc.getElementById('interventions134Close').click();
 assert.ok(doc.activeElement===launch,'Le lanceur encore visible reprend le focus');
 launch.click();openDrawer(r.map);assert.equal(r.tools.open,false);
 doc.getElementById('interventions134Close').focus();g.onEscape();
 assert.equal(g.interventionsUI134.isOpen(),false);assert.equal(g.paused,false);
 assert.ok(doc.activeElement===g.canvas,'Le bouton d’un tiroir fermé ne reprend pas le focus');
 assert.equal(r.map.open,true,'Fermer l’établi ne modifie pas le tiroir choisi ensuite');
});

test('UI 1.38 : une interruption de l’établi non modal respecte le focus déjà déplacé',()=>{
 const {g,doc}=fixture(),b=generator(g);beginFromHud(g,doc,b);
 const summary=g.hud135.regions().map.querySelector('summary');summary.focus();
 g.interventions134.cancel('Intervention interrompue.');
 assert.equal(g.interventionsUI134.isOpen(),false);assert.equal(g.interventions134.busy(),false);
 assert.ok(doc.activeElement===summary,'Le focus déjà hors de l’établi reste sur place');assert.equal(g.player.carry.scrap,18);assert.equal(g.paused,false);
});
