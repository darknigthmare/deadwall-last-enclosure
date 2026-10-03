'use strict';
// Reproducible captures of shipped Canvas painters; simulated DOM, no browser HUD.
// NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node scripts/capture-engine127.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const project=path.resolve(__dirname,'..'),out=path.join(project,'reports/1.27.0/captures');
fs.mkdirSync(out,{recursive:true});
const {game:g}=require('../tests/helpers/expansions127.cjs').boot127();
const {standAt}=require('../tests/helpers/physical-fixtures.cjs');
const A=require('../src/art.js'),C=require('../src/core.js');
globalThis.Image=class{set src(_){this.onerror?.();}};g.art=A.create();
const canvas=createCanvas(1440,900),mini=createCanvas(220,220);
g.ctx=canvas.getContext('2d');g.mctx=mini.getContext('2d');g.width=1440;g.height=900;g.dpr=1;
const evidence=[];
function save(name,description){fs.writeFileSync(path.join(out,name+'.png'),canvas.toBuffer('image/png'));evidence.push({file:name+'.png',description,width:canvas.width,height:canvas.height});console.log(name);}
function checked(result,label){assert.ok(result?.ok===true||result===true,label+': '+(result?.reason||''));}
function supplies(){g.player.carryCapacity=100;Object.assign(g.player.carry,{wood:32,scrap:14,stone:4,fuel:6,food:12,medicine:2,ammo:0});}
function stepPack(pack,n){for(let i=0;i<Math.ceil(n/.04);i++)pack.step(.04);}
function render(day=true){g.settings.reducedMotion=true;g.camera.shake=0;g.phase=day?'calm':'assault';g.wave=day?1:4;g.dayClock=day?.44:.99;g.weather=0;g.nightwatch.invalidate();for(let i=0;i<105;i++){g.elapsed+=.1;g.render();}}
function setView(x,y,zoom){g.camera.x=x;g.camera.y=y;g.camera.zoom=zoom;}
function fresh(){g.startNew('standard','17117');g.phaseTime=999;g.input.keys.clear();g.input.pressed.clear();g.zombies=[];g.rebuildBuckets();g.resources.wood=g.resources.scrap=g.resources.stone=g.resources.ammo=g.resources.food=g.resources.fuel=300;}
function addBuilding(type,x,y){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);return b;}
(async()=>{
 await g.art.ready;
 for(const [key,spec]of Object.entries(A.ASSETS)){
  const img=await loadImage(path.join(project,spec.url));assert.equal(img.width,spec.width);assert.equal(img.height,spec.height);
  if(['magenta','neutral'].includes(spec.matte)){const c=createCanvas(img.width,img.height),ctx=c.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,c.width,c.height);A.decodeMatte(data.data,c.width,c.height,spec.matte);ctx.putImageData(data,0,0);g.art.images[key]=c;const rects=key==='buildings'?A.BUILDINGS:key==='props'?A.PROPS:key==='defenses'?A.DEFENSES:key==='districtProps'?A.DISTRICT_PROPS:{};for(const[id,r]of Object.entries(rects))g.art.rects[key+':'+id]=A.tightRect(data.data,c.width,r);}else g.art.images[key]=img;
 }
 fresh();
 const domCreate=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):domCreate(tag);
 // Campsite is prepared through the actual paid actions near a visitable station.
 const s=g.exploration125.plan.stations[0];supplies();g.player.facing=0;let found=false;
 for(let y=s.y+s.h/2+80;y<s.y+s.h/2+420&&!found;y+=32)for(let x=s.x+160;x<s.x+540&&!found;x+=32){g.player.x=x;g.player.y=y;const q=g.survivalPack.preview('camp');found=q.ok&&!g.exploration125.plan.roads.some(road=>require('../src/exploration-125.js').roadContains(road,q.target.x,q.target.y,100));}
 assert.ok(found,'clear outdoor camp position');checked(g.survivalPack.begin('camp'),'camp');stepPack(g.survivalPack,7);const c=g.survivalPack.snapshot().camps[0];
 checked(g.survivalPack.begin('cover'),'cover');stepPack(g.survivalPack,7);
 // Physical campfire outside the bed, under the edge of the rain shelter.
 g.player.x=c.x-42;g.player.y=c.y+74;g.player.facing=0;
 checked(g.nightGear.craft('campfire'),'campfire craft');stepPack(g.nightGear,5);const fire=g.nightGear.snapshot().devices.find(d=>d.kind==='campfire');let firePlaced=false;for(let i=0;i<16&&!firePlaced;i++){const a=Math.PI/2+i*Math.PI/8;g.player.x=c.x+Math.cos(a)*90-C.NightGearRules.placeDistance*32;g.player.y=c.y+Math.sin(a)*90;g.player.facing=0;if(g.friendlyPositionClear(g.player,g.player.x,g.player.y))firePlaced=g.nightGear.place(fire.id).ok;}assert.ok(firePlaced,'campfire physical placement');checked(g.nightGear.ignite(fire.id),'campfire lighting');
 g.player.x=c.x-65;g.player.y=c.y+52;g.player.facing=.4;g.player.action='idle';g.actorPresentation?.update?.(.04);
 setView(c.x-30,c.y-5,2.35);render(true);save('01-bivouac-jour','Bivouac, bâche et foyer créés par les API de préparation, près de la station visitable.');
 const night=g.serialize();night.fieldcraft.opacity=1;g.restoreSave(night);setView(c.x-30,c.y-5,2.35);render(false);save('02-bivouac-nuit','Même équipement au cours de la nuit noire, éclairé par le foyer réel et les sources nocturnes existantes du moteur.');
 // A local route: finite source, paid marker/cache, actual extraction and dropped bundle.
 fresh();supplies();
 let source=null;for(const n of g.world.nodes){if(n.type!=='wood'||n.depleted||n.amount<24)continue;try{standAt(g,g.player,n);}catch{continue;}if(g.explorationPack.preview('survey',n.id).ok){source=n;break;}}
 assert.ok(source,'surveyable wood source');checked(g.explorationPack.survey(source.id),'survey');stepPack(g.explorationPack,C.ExplorePackRules.surveySeconds);checked(g.explorationPack.extract(source.id),'bundle extraction');stepPack(g.explorationPack,C.ExplorePackRules.extractSeconds);
 const base={x:g.player.x,y:g.player.y};
 const free=(dx,dy)=>{const x=base.x+dx,y=base.y+dy;return g.friendlyPositionClear(g.player,x,y)?{x,y}:null;};
 const positions=[];for(let y=-160;y<=160;y+=40)for(let x=-180;x<=180;x+=40){const p=free(x,y);if(p)positions.push(p);}
 const drop=positions.find(p=>Math.hypot(p.x-source.x,p.y-source.y)>55)||base;Object.assign(g.player,drop);checked(g.explorationPack.drop(),'bundle drop');
 const make=(kind,min,from)=>{for(const p of positions){if(Math.hypot(p.x-from.x,p.y-from.y)<min)continue;Object.assign(g.player,p);if(g.explorationPack.preview(kind).ok){checked(kind==='cache'?g.explorationPack.placeCache():g.explorationPack.markRoute(),kind);stepPack(g.explorationPack,kind==='cache'?C.ExplorePackRules.cacheSeconds:C.ExplorePackRules.markerSeconds);return p;}}throw Error('No '+kind+' placement');};
 const cache=make('cache',52,drop);checked(g.explorationPack.cacheTransfer(g.explorationPack.snapshot().caches[0].id,'store'),'cache supplies');supplies();const m1=make('marker',60,cache),m2=make('marker',C.ExplorePackRules.markerSpacing,m1);g.player.x=drop.x+28;g.player.y=drop.y+28;g.player.facing=-.2;
 const all=[source,drop,cache,m1,m2],mx=all.reduce((n,p)=>n+p.x,0)/all.length,my=all.reduce((n,p)=>n+p.y,0)/all.length;setView(mx,my,2.3);render(true);save('03-logistique-terrain','Gisement relevé et diminué de 24 bois, ballot posé, cache payée et remplie, deux piquets reliés.');
 // Deliberate defense fixture made from genuine buildings and paid fittings.
 fresh();g.world.nodes.forEach(n=>{if(Math.hypot(n.x-2350,n.y-2200)<500)n.depleted=true;});
 const tower=addBuilding('watchtower',73,67),wall=addBuilding('woodWall',71,70),wall2=addBuilding('woodWall',72,70),gate=addBuilding('gate',73,70),wall3=addBuilding('woodWall',75,70);
 g.selectBuilding(tower);standAt(g,g.player,tower);checked(g.fortificationPack.equip('ammo',tower.id),'ammo case');checked(g.fortificationPack.equip('repair',tower.id),'repair cassette');
 for(const b of[wall,wall2,wall3]){g.selectBuilding(b);standAt(g,g.player,b);checked(g.fortificationPack.equip('net',b.id),'corpse net');}
 g.selectBuilding(tower);standAt(g,g.player,tower);tower.health-=160;checked(g.fortificationPack.startRepair(tower.id),'manual repair');for(let i=0;i<20;i++)g.fortificationPack.step(.1);g.fortificationPack.stop();
 setView(tower.x-10,wall.y-65,2.7);render(true);save('04-poste-fortifie','Mirador avec caisson de 24 cartouches et cassette partiellement consommée ; filets posés sur trois palissades et porte entre les lignes.');
 // Regional campaign fixture: revealed clinic only; fees and orders use the normal APIs.
 fresh();for(const file of ['region-roadkit','atlas-render','essential-art','world-evolution-art','frontier-art'])require('../src/'+file+'.js');
 if(g.population<4)checked(g.recruit('worker'),'fourth colony member');
 checked(g.worldEvolution.assignCompanion('samir'),'Samir assignment');checked(g.worldEvolution.assignCompanion('malik'),'Malik assignment');
 const clinic=g.frontier.world().pois.find(p=>p.type==='clinic')||g.frontier.world().pois.find(p=>p.type==='house');assert.ok(clinic);const learned=g.serialize();learned.frontier.seen=[...new Set([...learned.frontier.seen,clinic.id])];learned.resources.medicine=30;g.restoreSave(learned);standAt(g,g.player,g.core());
 checked(g.campaignPack.start('evacuation'),'evacuation contract');g.player.x=4058;g.player.y=2048;checked(g.frontier.enter(),'region entry');
 const target=g.campaignPack.overview().target,regional=g.serialize();assert.ok(target);const side=[{x:target.x-2,y:target.y},{x:target.x+2,y:target.y},{x:target.x,y:target.y+2}].find(p=>!g.frontier.world().blocked(p.x,p.y,.4,0,null));assert.ok(side,'clear viewpoint beside casualty');regional.frontier.x=side.x;regional.frontier.y=side.y;regional.frontier.z=0;regional.frontier.inside=null;regional.fieldcraft.opacity=0;g.restoreSave(regional);
 checked(g.companionsPack.setFormation('spread'),'spread formation');checked(g.companionsPack.setDiscipline('silent'),'silent discipline');g.input.mouseX=1440;g.input.mouseY=450;
 for(let i=0;i<80;i++){g.update(.04);g.input.pressed.clear();}checked(g.companionsPack.setOrder('hold'),'hold position');g.frontier.scale(38);render(true);save('05-equipe-secours-region','Opération d’évacuation engagée au dépôt par API, point SOS de la clinique révélée en fixture, Samir et Malik en formation espacée puis ordre de tenir.');
 fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify({kind:'real-engine-canvas-simulated-dom',seed:17117,dimensions:[1440,900],browser:false,fixtures:true,captures:evidence},null,2)+'\n');
 console.log('Actual shipped Canvas rendering. Staged fixtures; no browser DOM/HUD screenshots.');
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
