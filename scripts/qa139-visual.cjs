'use strict';
// Real production painters on prepared finite game scenes; no browser/CSS claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,Image}=require('@napi-rs/canvas');
const {bootDocument134}=require('./qa-startup134.cjs');
const root=path.resolve(__dirname,'..');
async function boot(type){
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 const canvas=createCanvas(1440,960);g.ctx=canvas.getContext('2d');g.mctx=createCanvas(220,220).getContext('2d');g.width=1440;g.height=960;g.dpr=1;
 const create=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):create(tag);
 globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'&&!v.startsWith('data:')?path.join(root,v):v;}};
 const fresh=globalThis.DeadwallArt.create();await fresh.ready;assert.deepEqual(fresh.diagnostics.failed,[]);
 for(const key of ['images','rects','actionFrames133','diagnostics','ready'])g.art[key]=fresh[key];
 const C=globalThis.DeadwallCore,c=g.core();let garage;
 for(let x=67;x<82&&!garage;x++)for(let y=59;y<77;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){garage=new(c.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(garage);break;}
 assert.ok(garage);g.refreshMetrics(true);g.tier={id:4};g.resources.wood=g.resources.scrap=500;
 assert.equal(g.worldEvolution.selectVehicle(type),true);assert.equal(g.expeditions.buildCar().ok,true);
 g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;g.paused=true;
 return{g,canvas};
}
async function run(phase='before'){
 const out=path.join(root,'reports/1.39.0/captures');fs.mkdirSync(out,{recursive:true});const scenes=[],assets=[];
 for(const type of ['bus','truck']){
  const {g,canvas}=await boot(type),profile=g.worldEvolution.vehicleProfile(),local=g.expeditions.car(),base=g.serialize(),A=globalThis.DeadwallFrontierArt;
  function write(name,meta={}){const file=`qa139-${phase}-${name}.png`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));scenes.push({name,file,type,...meta});}
  Object.assign(g.camera,{x:local.x,y:local.y,zoom:4,shake:0});g.render();
  write('d17-'+type,{domain:'local',vehicle:{...local},profile,entries:g.depthEntries(g.viewBounds()).filter(e=>e.kind===6).map(e=>({kind:e.kind,id:e.id,depth:e.depth}))});
  const w=g.frontier.world(),q={x:w.home.maxX+30,y:w.home.y};assert.equal(w.vehicleClear(q.x,q.y,0,profile.w,profile.h),true);
  const raw=structuredClone(base);Object.assign(raw.frontier,{active:true,anchor:{x:raw.player.x,y:raw.player.y},...q,z:0,inside:null,a:0,car:{id:local.id,...q,a:0,driving:false}});raw.expeditions.vehicle.fuel=10;raw.expeditions.vehicle.cargo.food=3.125;
  assert.equal(g.restoreSave(raw),true);g.paused=true;g.dayClock=.44;g.weather=0;g.frontier.scale(48);const v=g.frontier.overview();A.render(g,v);
  write('region-'+type,{domain:'region',pose:g.frontier.position(),profile,entries:A.depthEntries(g,v,{l:v.x-20,r:v.x+20,t:v.y-15,b:v.y+15}).filter(e=>e.kind==='car').map(e=>({kind:e.kind,id:e.id,depth:e.depth}))});
  const saved=structuredClone(g.serialize()),bag=structuredClone(g.expeditions.car().cargo),fuel=g.expeditions.car().fuel;assert.equal(g.restoreSave(saved),true);assert.deepEqual(g.expeditions.car().cargo,bag);assert.equal(g.expeditions.car().fuel,fuel);
  const plate=createCanvas(1440,960),c=plate.getContext('2d');c.fillStyle='#6d7962';c.fillRect(0,0,1440,960);
  const states=[{name:'intact',a:0},{name:'rotation 90°',a:Math.PI/2},{name:'rotation 180°',a:Math.PI},{name:'rotation -90°',a:-Math.PI/2},{name:'coffre fouillé',a:.38,opened:true},{name:'épave',a:-.38,hp:0},{name:'démontée',a:.38,dismantled:true},{name:'épuisée',a:-.38,dismantled:true,exhausted:true}];
  states.forEach((state,i)=>{const x=180+(i%4)*360,y=180+Math.floor(i/4)*470;c.save();c.translate(x,y);c.scale(22,22);A.car(c,{x:0,y:0,w:profile.w,h:profile.h,type,a:state.a,opened:state.opened,dismantled:state.dismantled,exhausted:state.exhausted},false,state.hp??profile.health);c.restore();c.fillStyle='#eee2bd';c.font='20px sans-serif';c.textAlign='center';c.fillText(type+' · '+state.name,x,y+200);});
  const file=`qa139-${phase}-${type}-states.png`;fs.writeFileSync(path.join(out,file),plate.toBuffer('image/png'));scenes.push({name:type+'-states',file,type,method:'Production regional car painter; physical profile dimensions and shared alpha asset',states});
  if(type==='truck'){
   let place,parked,point;
   for(const p of w.pois){for(const cv of p.parking){if(cv.type!=='truck')continue;const q={x:cv.x-Math.cos(cv.a)*(cv.w/2+.7),y:cv.y-Math.sin(cv.a)*(cv.w/2+.7)};if(!g.interventions134.blocksLoot(cv)&&!w.blocked(q.x,q.y,.32)){place=p;parked=cv;point=q;break;}}if(parked)break;}
   assert.ok(parked);const raw=g.serialize();Object.assign(raw.frontier,{active:true,...point,z:0,inside:place.id,seen:[...new Set([...raw.frontier.seen,place.id])]});
   // Finite nearby threats are prepared as already cleared for the real E action.
   for(const near of w.nearPOI(point.x,point.y,150))for(let i=0;i<w.threatCount(near);i++){const id=near.id+':e'+i;raw.frontier.enemies[id]=0;delete raw.frontier.tracks[id];}raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
   assert.equal(g.restoreSave(raw),true);g.paused=false;g.update(.04);g.frontier.scale(32);for(let i=0;g.frontier.overview().focus?.id!==parked.id&&i<12;i++)g.frontier.cycle();assert.equal(g.frontier.overview().focus?.id,parked.id);assert.equal(g.frontier.takenAmount(parked.id),0);
   A.render(g,g.frontier.overview());write('region-truck-closed-loot',{domain:'region',poi:place.id,vehicle:parked.id,taken:0,method:'Generated parked truck before the physical E interaction'});
   g.input.keys.add('KeyE');for(let i=0;i<12;i++){g.update(.04);g.input.pressed.clear();}g.input.keys.clear();const taken=g.frontier.takenAmount(parked.id),loot=structuredClone(g.player.carry);assert.ok(taken>0);assert.ok(loot.scrap>0);
   A.render(g,g.frontier.overview());write('region-truck-opened-loot',{domain:'region',poi:place.id,vehicle:parked.id,taken,loot,method:'Real twelve active E input ticks; trunk state derived from finite taken amount'});
   assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.frontier.takenAmount(parked.id),taken);assert.deepEqual(g.player.carry,loot);g.frontier.scale(32);A.render(g,g.frontier.overview());write('region-truck-reloaded-loot',{domain:'region',poi:place.id,vehicle:parked.id,taken,loot,method:'Actual save/load preserves collected scrap and the open rear hatch'});
  }
  assets.push({type,ready:g.art.diagnostics.ready.length,failed:g.art.diagnostics.failed,draws:g.art.diagnostics.draws,cargoAfterSave:bag,fuelAfterSave:fuel});
 }
 const meta={phase,seed:17117,prepared:true,browser:false,method:'bootDocument134 in production HTML order, native Art.load with installed instance preserved, Game.render, DeadwallFrontierArt.render/car',assets,scenes};fs.writeFileSync(path.join(out,`qa139-${phase}-visual.json`),JSON.stringify(meta,null,2)+'\n');return meta;
}
module.exports={run};if(require.main===module)run(process.argv[2]||'before').then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.stack);process.exitCode=1;});
