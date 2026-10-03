'use strict';
// Full-order integration fixture: shipped HTML and handlers under a simulated DOM.
// No CSS layout, GPU frame-rate, or human-playthrough claim.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function bootDocument134(){
const env=require('../tests/helpers/browser.cjs').installFakeBrowser({readyState:'loading',currentScript:{tagName:'SCRIPT'}});
const doc=globalThis.document,proto=Object.getPrototypeOf(doc.body);
Object.defineProperty(proto,'lastChild',{configurable:true,get(){return this.children.at(-1)||null;}});
Object.defineProperty(proto,'className',{configurable:true,set(v){this.classList.values=new Set(String(v).split(/\s+/).filter(Boolean));},get(){return [...this.classList.values].join(' ');}});
proto.insertBefore=function(n,s){n.remove();const i=this.children.indexOf(s);this.children.splice(i<0?this.children.length:i,0,n);n.parentNode=this;};
proto.before=function(n){this.parentNode?.insertBefore(n,this);};
proto.replaceWith=function(n){if(this.parentNode){this.parentNode.insertBefore(n,this);this.remove();}};
proto.after=function(n){const p=this.parentNode;if(p){const i=p.children.indexOf(this);p.children.splice(i+1,0,n);n.parentNode=p;}};
proto.scrollIntoView=function(){};proto.setCustomValidity=function(s){this.validationMessage=s;};
const append=proto.appendChild;proto.appendChild=function(n){if(n?.parentNode)n.remove();return append.call(this,n);};
doc.createElementNS=(_,tag)=>doc.createElement(tag);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const body=html.split(/<body[^>]*>/)[1].split('<script')[0],stack=[doc.body];doc.body.replaceChildren();
for(const token of body.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)){
 if(token.startsWith('<!--'))continue;
 if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}
 if(!token.startsWith('<')){if(token.trim())stack.at(-1).textContent+=token.trim();continue;}
 const tag=/^<(\w+)/.exec(token)?.[1];if(!tag)continue;
 const id=/\bid="([^"]+)"/.exec(token)?.[1],n=id?doc.getElementById(id):doc.createElement(tag);n.tagName=tag.toUpperCase();
 for(const a of token.matchAll(/([\w-]+)="([^"]*)"/g)){if(a[1]==='class')n.className=a[2];else if(['value','type','name'].includes(a[1]))n[a[1]]=a[2];else if(a[1].startsWith('data-'))n.dataset[a[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=a[2];else n.setAttribute(a[1],a[2]);}
 n.checked=/\schecked(?:\s|>)/.test(token);stack.at(-1).appendChild(n);if(!['input','img','br','hr','meta','link','source'].includes(tag))stack.push(n);
}
const fallback=doc.getElementById.bind(doc);doc.getElementById=id=>doc.body.querySelectorAll('#'+id)[0]||fallback(id);
globalThis.Image=class{constructor(){this.width=this.height=0;}set src(v){this._src=v;}get src(){return this._src;}};
for(const [,file]of html.matchAll(/<script src="([^"]+)"/g))new Function('module','require','exports',fs.readFileSync(path.join(root,file),'utf8')+'\n//# sourceURL='+file)(undefined,undefined,undefined);
doc.readyState='interactive';doc.currentScript=null;env.dispatchDocument('DOMContentLoaded');
const g=globalThis.DEADWALL;
return {...env,g,doc};
}
module.exports={bootDocument134};

function campaignScenario(){
 const assert=require('node:assert/strict'),{g,doc,dispatchWindow}=bootDocument134();
 const names=['arsenal134','interventions134','barricades134'];
 for(const name of names)assert.ok(g.expansions.get(name),name+' doit être installé dans l’ordre HTML livré');
 g.startNew('standard','17117');
 assert.equal(g.campaignIntro132.isOpen(),true);
 const first=globalThis.DeadwallSave.parse(localStorage.getItem(globalThis.DeadwallCore.SAVE_KEY));
 for(const name of names)assert.ok(first.expansions127.modules[name],'Première sauvegarde sans '+name);
 const elapsed=g.elapsed,clock=g.dayClock,stock={...g.resources};
 for(let i=0;i<60;i++)g.loop(g.lastFrame+40);
 assert.equal(g.elapsed,elapsed,'Introduction : temps gelé');assert.equal(g.dayClock,clock);
 assert.deepEqual(g.resources,stock,'Introduction : aucune consommation');
 g.campaignIntro132.skip();
 g.showCommand(true);g.loadoutUI.open();dispatchWindow('blur');
 g.loadoutUI.close();g.showCommand(false);
 assert.equal(g.paused,true,'Perte de focus : reprise volontaire nécessaire');
 assert.equal(g.activeOverlay,g.ui.pauseMenu);
 g.togglePause(false);assert.equal(g.paused,false);
 const runId=g.runId,seed=g.world.seed;
 g.player.carry.scrap=7;g.player.invulnerable=0;g.damagePlayer(10000);
 assert.equal(g.successionUI133.isOpen(),true);assert.equal(g.succession133.remains()[0].bag.scrap,7);
 assert.equal(g.lastSaveStatus.ok,true,'La mort doit se sauvegarder avec tous les nouveaux modules');
 const afterDeath=g.elapsed;for(let i=0;i<20;i++)g.loop(g.lastFrame+40);assert.equal(g.elapsed,afterDeath);
 assert.equal(g.successionUI133.choose('builder'),true);doc.getElementById('succession133Confirm').click();
 assert.equal(g.player.dead,false);assert.equal(g.succession133.pending(),false);
 assert.equal(g.player.carry.scrap,0,'La relève ne recopie pas le sac perdu');
 assert.equal(g.runId,runId);assert.equal(g.world.seed,seed);assert.equal(g.save(false),true);
 const stored=g.serialize();g.returnToMenu();assert.equal(g.load(),true);
 assert.equal(g.campaignIntro132.isOpen(),false,'Reprise : pas de nouvelle introduction');
 assert.equal(g.succession133.view().current.profile,'builder');
 assert.deepEqual(g.serialize().expansions127.modules,stored.expansions127.modules,'La reprise conserve tous les nouveaux registres');
 assert.equal(g.succession133.remains()[0].bag.scrap,7);
 const before=g.serialize(),world=g.world;
 assert.equal(g.startNew('standard','invalid-seed'),false);
 assert.equal(g.world,world,'Un départ refusé ne remplace pas le monde');
 assert.deepEqual(g.serialize().expansions127.modules,before.expansions127.modules,'Un départ refusé ne réinitialise aucune extension');
 return {scenario:'campaign',status:'passed',browser:false,modules:names,profile:g.succession133.view().current.profile,remains:g.succession133.remains().length};
}


function placeLocalFixture(g,type,health){
 const C=globalThis.DeadwallCore,core=g.core();
 for(let r=4;r<22;r+=2)for(const [dx,dy]of [[r,0],[-r,0],[0,r],[0,-r]]){
  const gx=core.gx+dx,gy=core.gy+dy;
  if(!g.world.placement(C.BUILDINGS[type],gx,gy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,type,gx,gy,0,1);
  b.health=health??b.maxHealth;g.world.add(b);g.refreshMetrics(true);
  const point=g.fieldcraft.service(g.player,b);
  if(!point)throw Error('Prepared fixture lacks a real exterior approach.');
  Object.assign(g.player,point);return b;
 }
 throw Error('No physically valid prepared placement for '+type);
}
function clickExisting(doc,id){
 const assert=require('node:assert/strict'),b=doc.getElementById(id);
 assert.ok(doc.body.contains(b),'Bouton réellement monté : '+id);
 assert.equal(b.disabled,false,'Bouton disponible : '+id);b.click();return b;
}
function interventionScenario(){
 const assert=require('node:assert/strict'),{g,doc,dispatchWindow}=bootDocument134();
 g.startNew('standard','17117');g.campaignIntro132.skip();
 const b=placeLocalFixture(g,'generator',350),id='local:'+b.id;
 g.player.carry.scrap=24;const resources={...g.resources};
 clickExisting(doc,'interventions134Button');
 clickExisting(doc,'interventions134Action-work-'+id);
 assert.equal(g.interventions134.busy(),true);assert.equal(g.paused,false);
 assert.equal(g.activeOverlay,null,'Le travail reste dans le monde');
 const start=g.elapsed;g.update(.04);assert.ok(g.elapsed>start,'Le temps et les menaces continuent');
 assert.equal(g.arsenal134.preview('craft','plank').ok,false,'Aucun assemblage simultané');
 assert.equal(g.player.carry.scrap,18);assert.equal(g.resources.scrap,resources.scrap,'Les consommables viennent du sac');
 assert.equal(g.save(false),true);const saved=g.serialize();
 assert.equal(g.restoreSave(saved),true);
 assert.equal(g.interventions134.busy(),false,'Une reprise ne restaure pas une tentative interactive');
 assert.equal(g.interventionsUI134.isOpen(),false);assert.equal(g.player.carry.scrap,18);
 clickExisting(doc,'interventions134Button');clickExisting(doc,'interventions134Action-work-'+id);
 while(g.interventions134.busy()){
  const s=g.interventions134.view().session;
  for(let i=0;i<s.target;i++)clickExisting(doc,'interventions134Right');
  clickExisting(doc,'interventions134Confirm');
 }
 assert.equal(g.world.buildings.get(b.id).health,550,'Réparation réelle, limitée au budget de santé');
 assert.equal(g.player.carry.scrap,12);assert.equal(g.interventionsUI134.isOpen(),false);
 clickExisting(doc,'interventions134Button');clickExisting(doc,'interventions134Action-work-'+id);
 dispatchWindow('blur');
 assert.equal(g.interventions134.busy(),false);assert.equal(g.interventionsUI134.isOpen(),false);
 assert.equal(g.paused,true,'Perte de focus : arrêt du travail puis pause');
 assert.equal(g.player.carry.scrap,6,'Les consommables engagés ne sont pas remboursés à répétition');
 assert.equal(g.save(false),true);
 return {scenario:'interventions',status:'passed',browser:false,device:id,repairedHealth:g.world.buildings.get(b.id).health,remainingScrap:g.player.carry.scrap};
}


function buildRenderScene(g){
 const assert=require('node:assert/strict');
 g.startNew('standard','17117');g.campaignIntro132.skip();
 const arm=g.arsenal134;
 assert.equal(arm.begin('craft','spikeFrame').ok,true,arm.preview('craft','spikeFrame').reason);
 for(let i=0;i<250&&arm.busy();i++)arm.step(.1);assert.equal(arm.busy(),false);
 const item=arm.snapshot().locker.find(i=>i.id==='spikeFrame');assert.ok(item);
 assert.equal(arm.transfer(item.uid,'carried').ok,true);
 assert.equal(g.loadout.transfer('depot','sac','wood',6).ok,true);
 assert.equal(g.loadout.transfer('depot','sac','scrap',1).ok,true);
 let target;
 const targets=globalThis.DeadwallBarricades134.localTargets(g.exploration125.plan);
 for(const t of targets.filter(t=>t.kind==='window')){
  for(const side of [1,-1]){
   const p={x:t.x-Math.sin(t.angle)*32*side,y:t.y+Math.cos(t.angle)*32*side};
   if(!g.friendlyPositionClear(g.player,p.x,p.y))continue;
   Object.assign(g.player,p);
   if(g.barricades134.begin('build',t.id,'planks').ok){target=t;break;}
  }
  if(target)break;
 }
 assert.ok(target,'Fenêtre réellement accessible pour la scène de contrôle');
 for(let i=0;i<24&&g.barricades134.busy();i++)g.barricades134.step(.25);
 assert.ok(g.barricades134.snapshot().records.some(r=>r.target===target.id),'Barricade construite par transaction');
 let deployed=false;
 for(const angle of [target.angle,target.angle+Math.PI,target.angle+Math.PI/2,target.angle-Math.PI/2]){
  g.player.facing=angle;if(arm.deploy(item.uid).ok){deployed=true;break;}
 }
 assert.equal(deployed,true,'Poste déployé sur un emplacement physique libre');
 assert.equal(g.save(false),true);
 return {target,item:item.uid};
}
function renderScenario(){
 const assert=require('node:assert/strict'),{g}=bootDocument134(),scene=buildRenderScene(g);
 const t=scene.target;Object.assign(g.camera,{x:t.x,y:t.y,zoom:1});g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;
 const v=g.viewBounds(),entries=g.depthEntries(v);
 assert.ok(entries.some(e=>typeof e.draw==='function'),'Callback direct de barricade dans la profondeur réelle');
 assert.ok(entries.some(e=>e.entity?.__arsenalDraw),'Poste dans la profondeur réelle');
 g.render();
 globalThis.DeadwallAtlasRender.drawHomeScene(g.ctx,g,{left:t.x-500,top:t.y-350,right:t.x+500,bottom:t.y+350,homeProjection:true});
 assert.equal(g.friendlyPositionClear(g.player,t.x,t.y),false,'La barricade peinte est un vrai obstacle');
 const saved=g.serialize();g.restoreSave(saved);g.render();
 assert.equal(g.barricades134.snapshot().records.length,1);assert.equal(g.arsenal134.snapshot().posts.length,1);
 return {scenario:'render',status:'passed',browser:false,barricade:t.id,post:scene.item};
}
async function captureScenario(){
 const assert=require('node:assert/strict'),{createCanvas,loadImage}=require('@napi-rs/canvas'),{g}=bootDocument134();
 const scene=buildRenderScene(g),Art=globalThis.DeadwallArt,Atlas=globalThis.DeadwallAtlasRender,P=globalThis.DeadwallAtlasProjection;
 const canvas=createCanvas(1280,900),ctx=canvas.getContext('2d');
 g.ctx=ctx;g.mctx=createCanvas(220,220).getContext('2d');g.width=1280;g.height=900;g.dpr=1;
 const create=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):create(tag);
 globalThis.Image=class{set src(_){this.onerror?.();}};g.art=Art.create();await g.art.ready;
 for(const [key,spec]of Object.entries(Art.ASSETS)){
  const img=await loadImage(path.join(root,spec.url));
  if(['magenta','neutral'].includes(spec.matte)){
   const bitmap=createCanvas(img.width,img.height),bc=bitmap.getContext('2d');bc.drawImage(img,0,0);
   const data=bc.getImageData(0,0,img.width,img.height);Art.decodeMatte(data.data,img.width,img.height,spec.matte);bc.putImageData(data,0,0);g.art.images[key]=bitmap;
   const rects=key==='buildings'?Art.BUILDINGS:key==='props'?Art.PROPS:key==='defenses'?Art.DEFENSES:key==='districtProps'?Art.DISTRICT_PROPS:{};
   for(const [id,r]of Object.entries(rects))g.art.rects[key+':'+id]=Art.tightRect(data.data,img.width,r);
  }else g.art.images[key]=img;
 }
 const t=scene.target,view={left:t.x-640,top:t.y-450,right:t.x+640,bottom:t.y+450};
 Object.assign(g.camera,{x:t.x,y:t.y,zoom:1,shake:0});g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;g.paused=true;
 const out=path.join(root,'reports/1.34.0/captures');fs.mkdirSync(out,{recursive:true});
 g.render();fs.writeFileSync(path.join(out,'integration134-game-render.png'),canvas.toBuffer('image/png'));
 // The comparison camera observes the finished work with the commander outside
 // the viewport in both domains; this keeps every barricade/post pixel in scope.
 let outside=false;
 for(let y=160;y<3950&&!outside;y+=160)for(let x=160;x<3950;x+=160){
  if(Math.hypot(x-t.x,y-t.y)<1500||!g.friendlyPositionClear(g.player,x,y))continue;
  Object.assign(g.player,{x,y});outside=true;break;
 }
 assert.equal(outside,true);
 const clear=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#171c18';ctx.fillRect(0,0,1280,900);};
 clear();ctx.save();ctx.translate(640-t.x,450-t.y);Atlas.drawHomeScene(ctx,g,view);ctx.restore();
 const local=ctx.getImageData(0,0,1280,900).data;fs.writeFileSync(path.join(out,'integration134-d17-local.png'),canvas.toBuffer('image/png'));
 const region=g.serialize();Object.assign(region.frontier,{active:true,...P.toRegion(2048,2048,g),z:0,inside:null,anchor:{x:g.player.x,y:g.player.y},car:null});
 g.restoreSave(region);g.paused=true;g.settings.reducedMotion=true;
 const center=P.toRegion(t.x,t.y,g),a=P.toRegion(view.left,view.top,g),b=P.toRegion(view.right,view.bottom,g);
 clear();ctx.save();ctx.translate(640,450);ctx.scale(32,32);ctx.translate(-center.x,-center.y);Atlas.drawHome(ctx,g,{world:true,scale:32,view:{left:a.x,top:a.y,right:b.x,bottom:b.y}});ctx.restore();
 const remote=ctx.getImageData(0,0,1280,900).data;fs.writeFileSync(path.join(out,'integration134-d17-region.png'),canvas.toBuffer('image/png'));
 let total=0,strong=0,totalError=0,maxError=0;
 for(let y=0;y<900;y++)for(let x=0;x<1280;x++){
  const wx=view.left+x,wy=view.top+y;if(wx<8||wx>4088||wy<8||wy>4088)continue;
  const i=(y*1280+x)*4,error=Math.max(Math.abs(local[i]-remote[i]),Math.abs(local[i+1]-remote[i+1]),Math.abs(local[i+2]-remote[i+2]));
  total++;totalError+=error;maxError=Math.max(maxError,error);if(error>4)strong++;
 }
 const evidence={scenario:'capture',status:'passed',browser:false,prepared:true,painters:['Game.render','DeadwallAtlasRender.drawHomeScene','DeadwallAtlasRender.drawHome'],barricade:t.id,post:scene.item,pixels:total,strongPixels:strong,strongRatio:strong/total,meanError:totalError/total,maxError,excluded:'8 local-unit map border only; commander outside both comparison views',files:['integration134-game-render.png','integration134-d17-local.png','integration134-d17-region.png']};
 fs.writeFileSync(path.join(out,'integration134-render.json'),JSON.stringify(evidence,null,2)+'\n');
 assert.ok(strong/total<.002&&totalError/total<.5,'Scène D-17 identique dans la projection régionale, hors bordure');
 return evidence;
}


function clickAction(g,doc,action){
 const assert=require('node:assert/strict'),b=[...g.arsenalUI134.element.querySelectorAll('button')].find(b=>b.dataset.action===action);
 assert.ok(b,'Commande armurerie montée : '+action);assert.equal(b.disabled,false,'Commande disponible : '+action);b.click();return b;
}
function arsenalScenario(){
 const assert=require('node:assert/strict'),{g,doc}=bootDocument134();
 g.startNew('standard','17117');g.campaignIntro132.skip();
 const before=g.resources.scrap,ammo=g.resources.ammo;
 assert.equal(g.arsenalUI134.open(),true);const elapsed=g.elapsed;for(let i=0;i<20;i++)g.loop(g.lastFrame+40);assert.equal(g.elapsed,elapsed);
 clickAction(g,doc,'tab:catalog');clickAction(g,doc,'craft:revolver');
 assert.equal(g.arsenalUI134.isOpen(),false,'Le chantier reprend sur le terrain');
 for(let i=0;i<200&&g.arsenal134.busy();i++)g.update(.04);
 assert.equal(g.arsenal134.busy(),false);const item=g.arsenal134.snapshot().locker.find(i=>i.id==='revolver');assert.ok(item);
 assert.equal(g.resources.scrap,before-16);assert.equal(item.rounds,0,'Une fabrication ne fournit pas de cartouches');
 g.arsenalUI134.open();clickAction(g,doc,'tab:locker');clickAction(g,doc,'move:'+item.uid);
 clickAction(g,doc,'tab:carried');clickAction(g,doc,'equip:'+item.uid);g.arsenalUI134.close();
 g.startReload();for(let i=0;i<80&&g.player.reload>0;i++)g.update(.04);
 assert.equal(g.arsenal134.snapshot().carried.find(i=>i.uid===item.uid).rounds,6);
 assert.equal(g.resources.ammo,ammo-6);
 g.player.shootCooldown=0;g.shootPlayer();
 const fired=g.arsenal134.snapshot().carried.find(i=>i.uid===item.uid);assert.equal(fired.rounds,5);assert.ok(fired.condition<100);
 const pistol=g.arsenal134.snapshot().carried.find(i=>i.id==='pistol');
 assert.equal(g.arsenal134.equip(pistol.uid).ok,true);assert.equal(g.player.magazine.pistol,12,'Le pistolet garde son propre chargeur');
 assert.equal(g.arsenal134.equip(item.uid).ok,true);assert.equal(g.player.magazine.pistol,5,'Le revolver retrouve ses cartouches restantes');
 const inventory=g.arsenal134.snapshot().carried,point={x:g.player.x,y:g.player.y};
 g.player.invulnerable=0;g.damagePlayer(10000);
 assert.equal(g.arsenal134.snapshot().carried.length,0);assert.deepEqual(g.arsenal134.snapshot().fallen[0].items,inventory);
 assert.ok(Object.values(g.succession133.remains()[0].magazine).every(v=>v===0),'Pas de second exemplaire des chargeurs dans le vieux registre');
 g.successionUI133.choose('porter');clickExisting(doc,'succession133Confirm');
 assert.equal(g.arsenal134.snapshot().carried.length,0,'Relève sans armes offertes');
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 Object.assign(g.player,point);assert.equal(g.succession133.loot(1),true);
 assert.deepEqual(g.arsenal134.snapshot().carried,inventory,'État et cartouches sont repris une seule fois');
 assert.equal(g.arsenal134.snapshot().fallen.length,0);
 const good=g.serialize(),world=g.world,bad=JSON.parse(JSON.stringify(good));bad.expansions127.modules.arsenal134.carried[0].rounds=999;
 assert.throws(()=>g.restoreSave(bad),/armurerie/i);assert.equal(g.world,world);
 assert.deepEqual(g.arsenal134.snapshot().carried,inventory,'Import refusé avant toute mutation');
 return {scenario:'arsenal',status:'passed',browser:false,item:item.id,rounds:fired.rounds,condition:fired.condition,recovered:inventory.length};
}


function regionalScenario(){
 const assert=require('node:assert/strict'),{g,doc}=bootDocument134();
 g.startNew('standard','17117');g.campaignIntro132.skip();
 require('../tests/helpers/legacy-region135.cjs').pinLegacyRegion(g,5);
 assert.equal(g.loadout.transfer('depot','sac','wood',12).ok,true);assert.equal(g.loadout.transfer('depot','sac','scrap',4).ok,true);
 const w=g.frontier.world(),G=globalThis.DeadwallFrontierGeometry,B=globalThis.DeadwallBarricades134,I=globalThis.DeadwallInterventions134,S=globalThis.DeadwallFrontierSurvey;
 const p=w.pois.find(p=>p.id==='P0655');assert.ok(p?.generation===5&&p.x>12000&&p.levels.includes(1));
 function visit(point,z=1){
  const d=g.serialize();Object.assign(d.frontier,{active:true,x:point.x,y:point.y,z,inside:p.id,anchor:{x:g.player.x,y:g.player.y},car:null});
  if(!d.frontier.seen.includes(p.id))d.frontier.seen.push(p.id);
  for(let i=0;i<w.threatCount(p);i++)d.frontier.enemies[p.id+':e'+i]=0;
  d.frontier.kills=Object.values(d.frontier.enemies).filter(v=>v===0).length;g.restoreSave(d);
 }
 let aperture;
 for(const t of B.regionTargets(w,p,1)){
  for(const side of [1,-1]){
   const q={x:t.x-Math.sin(t.angle)*side,y:t.y+Math.cos(t.angle)*side},lp=G.local(p,q.x,q.y);
   if(lp.x<.4||lp.y<.4||lp.x>p.w-.4||lp.y>p.h-.4||w.blocked(q.x,q.y,.32,1,p.id))continue;
   visit(q);if(g.barricades134.begin('build',t.id,'planks').ok){aperture=t;break;}
  }
  if(aperture)break;
 }
 assert.ok(aperture,'Ouverture réelle accessible à l’étage lointain');
 for(let i=0;i<200&&g.barricades134.busy();i++)g.update(.04);
 assert.equal(g.barricades134.busy(),false);assert.equal(g.barricades134.snapshot().records.length,1);
 assert.equal(g.frontier.world().blocked(aperture.x,aperture.y,.15,1,p.id),true);
 assert.equal(g.barricades134.collision('region',aperture.x,aperture.y,.15,0,p.id),false,'Aucun mur fantôme au rez-de-chaussée');
 const upper=g.serialize();g.restoreSave(upper);
 for(let i=0;i<40;i++)g.frontier.world().chunk(55+i%12,60+Math.floor(i/12));
 assert.equal(g.barricades134.collision('region',aperture.x,aperture.y,.15,1,p.id),true,'Collision persistante après éviction de chunks');
 visit(g.frontier.position(),0);assert.equal(g.barricades134.eligibility('dismantle',aperture.id).ok,false,'Aucune interaction depuis le mauvais étage');
 g.restoreSave(upper);
 let lock,approach;
 for(const o of w.plan(p,1).objects){
  const candidate=I.objectIn(w,o.id);if(!g.interventions134.blocksLoot(candidate))continue;
  for(let d=.4;d<3.5&&!approach;d+=.2)for(let i=0;i<48;i++){
   const q={x:candidate.x+Math.cos(i*Math.PI/24)*d,y:candidate.y+Math.sin(i*Math.PI/24)*d,z:1,inside:p.id},lp=G.local(p,q.x,q.y);
   if(lp.x<.35||lp.y<.35||lp.x>p.w-.35||lp.y>p.h-.35||w.blocked(q.x,q.y,.32,1,p.id))continue;
   if(S.targets(w,q,{},1.7).some(t=>t.id===candidate.id)){lock=candidate;approach=q;break;}
  }
  if(approach)break;
 }
 assert.ok(lock,'Contenant verrouillé réellement accessible dans le même étage');visit(approach);
 const scrap=g.player.carry.scrap;clickExisting(doc,'interventions134Button');clickExisting(doc,'interventions134Action-work-'+lock.id);
 let confirmations=0;
 while(g.interventions134.busy()&&confirmations<8){
  for(let i=0;i<7&&g.interventions134.view().session.feedback!=='souple';i++)clickExisting(doc,'interventions134Right');
  clickExisting(doc,'interventions134Confirm');confirmations++;
 }
 assert.equal(g.interventions134.busy(),false);assert.equal(g.interventions134.blocksLoot(lock),false);
 assert.equal(g.player.carry.scrap,scrap-1);assert.equal(g.frontier.takenAmount(lock.id),0,'Ouvrir ne prélève pas automatiquement le stock');
 const final=g.serialize();assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 assert.equal(g.frontier.position().z,1);assert.equal(g.frontier.position().inside,p.id);assert.equal(g.interventions134.blocksLoot(lock),false);
 assert.deepEqual(g.serialize().expansions127.modules.barricades134,final.expansions127.modules.barricades134);
 return {scenario:'region',status:'passed',browser:false,poi:p.id,coordinates:[p.x,p.y],floor:1,barricade:aperture.id,lock:lock.id};
}


function armoryUIScenario(){
 const assert=require('node:assert/strict'),{performance}=require('node:perf_hooks'),{g}=bootDocument134();
 g.startNew('standard','17117');g.campaignIntro132.skip();g.arsenalUI134.open();
 let accesses=0,views=0;const original=g.arsenal134,work=g.workerCanWorkAt.bind(g);
 g.workerCanWorkAt=(...a)=>{accesses++;return work(...a);};
 g.arsenal134={...original,view(...a){views++;return original.view(...a);}};
 const tab=[...g.arsenalUI134.element.querySelectorAll('button')].find(b=>b.dataset.action==='tab:catalog');
 const start=performance.now();tab.click();const durationMs=performance.now()-start;
 const count=Object.keys(globalThis.DeadwallCore.Arsenal134Rules.catalog).length;
 assert.equal(views,1,'Un seul aperçu d’armurerie par rafraîchissement, partagé par toutes les cartes');
 assert.ok(accesses<=count*2+1,'Travail d’accès linéaire dans le nombre de profils');
 assert.equal(g.arsenalUI134.element.querySelectorAll('.arsenal134-card').length,count,'Toutes les cartes restent présentes');
 g.arsenal134=original;
 return {scenario:'armory_ui',status:'passed',browser:false,catalogProfiles:count,views,workerCanWorkAt:accesses,durationMs};
}

if(require.main===module){
 try{
  const scenarios={campaign:campaignScenario,interventions:interventionScenario,render:renderScenario,capture:captureScenario,arsenal:arsenalScenario,region:regionalScenario,armory_ui:armoryUIScenario},name=process.argv[2]||'campaign';
  if(!scenarios[name])throw Error('Unknown QA scenario: '+name);
  Promise.resolve(scenarios[name]()).then(result=>process.stdout.write(JSON.stringify(result)+'\n')).catch(error=>{console.error(error.stack);process.exitCode=1;});
 }catch(error){console.error(error.stack);process.exitCode=1;}
}
