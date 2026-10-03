'use strict';

const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{bootGame}=require('./helpers/browser.cjs');

function fresh(){const env=bootGame();env.game.startNew('standard','17117');env.game.world.nodes=[];return env;}
function put(g,type,x=70,y=64){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);return b;}
function mount(g,type='watchtower'){
 const b=put(g,type),point=g.fieldcraft.service(g.player,b);assert.ok(point);Object.assign(g.player,point);
 assert.equal(g.fieldcraft.control(b),true);return b;
}
function hold(g,b){g.input.mouseDown=true;g.input.touchFire=true;g.input.mouseWorldX=b.x+200;g.input.mouseWorldY=b.y;}

test('QA gameplay : le commandant à terre quitte immédiatement le poste, sans tir ni réanimation gelée',()=>{
 const{game:g}=fresh(),b=mount(g);hold(g,b);const ammo=g.resources.ammo;
 g.player.dead=true;g.player.health=0;g.player.downTimer=.02;g.player.carry.wood=12;
 g.updatePlayer(.04);
 assert.equal(g.fieldcraft.context().mounted,null);assert.equal(g.projectiles.length,0);assert.equal(g.resources.ammo,ammo);
 assert.equal(g.input.mouseDown,false);assert.equal(g.input.touchFire,false);
 assert.equal(g.player.dead,false);assert.equal(g.player.health,g.player.maxHealth);assert.equal(g.player.carry.wood,6);
});

for(const flag of ['siegeOffline','territoryOffline','gridOffline','dayOffline'])test('QA gameplay : '+flag+' interdit prise de contrôle et tir manuel après une panne',()=>{
 const{game:g}=fresh(),b=mount(g);hold(g,b);const ammo=g.resources.ammo,mag=g.player.magazine.pistol;
 b[flag]=true;g.updatePlayer(.04);
 assert.equal(g.fieldcraft.context().mounted,null);assert.equal(g.projectiles.length,0);assert.equal(g.resources.ammo,ammo);assert.equal(g.player.magazine.pistol,mag);
 assert.equal(g.fieldcraft.control(b),false);b[flag]=false;assert.equal(g.fieldcraft.control(b),true);
});

test('QA gameplay : une coupure électrique du poste rend la main sans consommer de munition',()=>{
 const{game:g}=fresh();put(g,'generator',74,64);const b=mount(g,'turret');hold(g,b);const ammo=g.resources.ammo;
 b.powered=false;g.updatePlayer(.04);
 assert.equal(g.fieldcraft.context().mounted,null);assert.equal(g.resources.ammo,ammo);assert.equal(g.projectiles.length,0);assert.equal(g.fieldcraft.control(b),false);
});

test('QA gameplay : un rempart terminé entre opérateur et poste coupe le contrôle à distance',()=>{
 const{game:g}=fresh(),b=put(g,'watchtower');Object.assign(g.player,{x:b.left-60,y:b.y});
 assert.equal(g.fieldcraft.control(b),true);hold(g,b);const ammo=g.resources.ammo;
 put(g,'woodWall',69,65);assert.equal(g.fieldcraft.workAt(g.player,b,C.Fieldcraft.RULES.range),false);
 g.updatePlayer(.04);assert.equal(g.fieldcraft.context().mounted,null);assert.equal(g.resources.ammo,ammo);assert.equal(g.projectiles.length,0);
});

test('QA gameplay : démontage du poste ne déclenche pas un tir de l’arme portée',()=>{
 const{game:g}=fresh(),b=mount(g);hold(g,b);const mag=g.player.magazine.pistol;
 g.world.remove(b);b.dead=true;g.updatePlayer(.04);
 assert.equal(g.fieldcraft.context().mounted,null);assert.equal(g.player.magazine.pistol,mag);assert.equal(g.projectiles.length,0);
});

test('QA gameplay : monter dans un véhicule libère le poste de tir précédent',()=>{
 const{game:g}=fresh();put(g,'expeditionGarage',58,57);put(g,'expeditionOffice',67,57);g.resources=C.makeBag(Object.fromEntries(C.RESOURCE_KEYS.map(k=>[k,500])));
 assert.equal(g.expeditions.buildCar().ok,true);const car=g.expeditions.car(),b=mount(g);
 car.x=g.player.x;car.y=g.player.y;car.fuel=10;
 assert.equal(g.expeditions.board().ok,true);g.updatePlayer(.04);
 assert.equal(g.fieldcraft.context().mounted,null);assert.equal(g.expeditions.driving(),true);assert.equal(g.projectiles.length,0);
 assert.match(g.interactionText,/volant|guidon/);
});

test('QA gameplay : retour au poste actif garde un seul débit et aucune seconde salve automatique',()=>{
 const{game:g}=fresh(),b=mount(g);hold(g,b);const ammo=g.resources.ammo;
 g.updatePlayer(.04);g.updateBuildings(.04);
 assert.equal(g.fieldcraft.context().mounted,b.id);assert.equal(g.resources.ammo,ammo-1);assert.equal(g.projectiles.length,1);
});
