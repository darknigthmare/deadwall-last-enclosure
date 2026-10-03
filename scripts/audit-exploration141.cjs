'use strict';
const path=require('node:path'),fs=require('node:fs');
const project=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const {g}=require(path.join(project,'scripts/qa-startup134.cjs')).bootDocument134();
g.startNew('standard','17117');g.campaignIntro132.skip();
if(process.argv[4]){const s=g.serialize(),generation=Number(process.argv[4]),home=globalThis.DeadwallGeography135.home(s.worldSeed,generation);Object.assign(s.frontier,{generation,x:home.maxX+2,y:home.y});g.restoreSave(s);}
const w=g.frontier.world(),P=globalThis.DeadwallAtlasProjection,gate=P.gatesFor(g).find(p=>p.id==='east');
const routeRoad=w.roads.find(r=>Math.hypot(r.a.x-gate.x,r.a.y-gate.y)>300&&Math.hypot(r.a.x-gate.x,r.a.y-gate.y)<1500);
if(!routeRoad)throw Error('No regional road fixture near the current D-17.');
const position={x:(routeRoad.a.x+routeRoad.b.x)/2,y:(routeRoad.a.y+routeRoad.b.y)/2};
const site=w.pois.find(p=>Math.hypot(p.x-position.x,p.y-position.y)>500),save=g.serialize();
Object.assign(save.frontier,{active:true,x:position.x,y:position.y,z:0,inside:null,car:null,anchor:{x:save.player.x,y:save.player.y},seen:[site.id]});
g.restoreSave(save);g.fieldAtlas.add(site.id);g.fieldAtlas.configure('car','east');g.fieldAtlas.start();
const plan=g.fieldAtlas.planning(),origin=plan.legs[0]?.path[0],f=g.frontier.snapshot();
const tree=w.chunk(0,0).trees[0],Survey=globalThis.DeadwallFrontierSurvey;
const harvested=tree&&Survey.targets(w,{x:tree.x+tree.r+.3,y:tree.y,z:0,inside:null},{},1.6).find(p=>p.id===tree.id);
const result={generation:w.generation,seed:g.world.seed,site:site.id,commandant:{x:f.x,y:f.y},origin,originKind:plan.originKind,vehicleUsable:plan.vehicleUsable,errorMetres:origin?Math.hypot(origin.x-f.x,origin.y-f.y):null,routeMetres:plan.loopMetres,harvestLabel:tree?{id:tree.id,species:tree.species,expected:tree.label,selected:harvested?.label??null}:null};
if(process.argv[3])fs.writeFileSync(path.resolve(process.argv[3]),JSON.stringify(result,null,2)+'\n');
process.stdout.write(JSON.stringify(result,null,2)+'\n');
