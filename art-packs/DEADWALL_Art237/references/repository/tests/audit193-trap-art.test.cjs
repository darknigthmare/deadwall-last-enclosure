'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const{createCanvas,loadImage}=require('@napi-rs/canvas');
const T=require('../src/trap-art159.js'),C=require('../src/core.js');
const kinds=['runnerCable193','breachClamp193','enduranceRack193','shieldTongs193','quickCable193','siegeBrake193'];
let images;
test.before(async()=>{images={};for(const[key,a]of Object.entries(T.ASSETS))images[key]=await loadImage(path.resolve(__dirname,'..',a.url));});
function render(kind,variant,motion){
 const c=createCanvas(96,96).getContext('2d'),d=C.BUILDINGS.spikes,w=d.size[0]*C.TILE,h=d.size[1]*C.TILE,b={id:29,type:'spikes',completed:true,dead:false,health:d.health,rotation:0,left:48-w/2,right:48+w/2,top:48-h/2,bottom:48+h/2};
 const art={images,blit(ctx,key,r,...dest){ctx.drawImage(images[key],...r,...dest);return true;}};
 assert.ok(T.drawMechanism(c,art,b,{kind,charges:C.FortificationPackRules.mechanisms[kind].charges},{variant,presentation:{phase:motion?'action':'armed',motion}}));
 return crypto.createHash('sha256').update(c.getImageData(0,0,96,96).data).digest('hex');
}
test('193 all six specialized traps have distinct native-size visible hardware in both structural forms',()=>{
 for(const variant of[0,1])for(const motion of[0,.5,1])assert.equal(new Set(kinds.map(kind=>render(kind,variant,motion))).size,kinds.length,'individual native silhouettes remain distinguishable');
});
test('193 specialized trap silhouettes differ from their reused source family at rest and in action',()=>{
 for(const kind of kinds)for(const variant of[0,1])for(const motion of[0,.5,1])assert.notEqual(render(kind,variant,motion),render(T.PROFILES193[kind].family,variant,motion),kind+' has original visible hardware');
});
