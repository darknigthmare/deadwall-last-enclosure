'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.DEADWALL_QA_ROOT||path.resolve(__dirname,'..');
const {bootDocument134}=require(path.join(root,'scripts/qa-startup134.cjs'));
const {standAt}=require(path.join(root,'tests/helpers/physical-fixtures.cjs'));
let context;
function run(action='equip',lock='reload'){
 context ||= bootDocument134();const {g,doc}=context,C=globalThis.DeadwallCore;
 g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;
 standAt(g,g.player,g.core());g.resources.wood=g.resources.scrap=g.resources.fuel=400;
 assert.ok(g.nightGear.craft('lantern').ok);
 for(let i=0;i<100&&g.nightGear.busy();i++)g.nightGear.step(.04);
 assert.equal(g.nightGear.busy(),false);const id=g.nightGear.snapshot().devices[0].id;
 if(action!=='equip'&&action!=='craft')assert.ok(g.nightGear.transfer(id,'equip').ok);
 if(action==='refill'){assert.ok(g.nightGear.ignite(id).ok);g.nightGear.step(.1);assert.ok(g.nightGear.ignite(id).ok);}
 function aim(){for(let i=0;i<48;i++){g.player.facing=i*Math.PI/24;const p={x:g.player.x+Math.cos(g.player.facing)*C.NightGearRules.placeDistance*32,y:g.player.y+Math.sin(g.player.facing)*C.NightGearRules.placeDistance*32};if(g.friendlyPositionClear({radius:9},p.x,p.y)&&g.nightGear.localLineClear(g.player,p))return;}throw Error('No physically free light placement');}
 if(action==='pickup'){aim();assert.ok(g.nightGear.place(id).ok);}
 if(lock==='mounted'){
  const core=g.core();let mounted;
  for(let dy=-7;dy<=7&&!mounted;dy++)for(let dx=-7;dx<=7&&!mounted;dx++){
   if(!g.world.placement(C.BUILDINGS.watchtower,core.gx+dx,core.gy+dy,0).valid)continue;
   const b=new(core.constructor)(g.nextId++,'watchtower',core.gx+dx,core.gy+dy,0,1);g.world.add(b);const p=g.fieldcraft.service(g.player,b);
   if(p){Object.assign(g.player,p);if(g.nightGear.previewCraft('torch').ok){g.refreshMetrics(true);assert.ok(g.fieldcraft.control(b));mounted=b;}}
   if(!mounted)g.world.remove(b);
  }
  assert.ok(mounted,'Real tower with shared depot access');
 }else if(lock==='reload'){
  g.player.carry.ammo=20;g.player.magazine.pistol=0;g.startReload();assert.equal(g.player.reload,1.35);
 }else if(lock==='work'){
  assert.ok(g.arsenal134.begin('craft','plank').ok);assert.ok(g.arsenal134.busy());
 }else throw Error('Unknown lock '+lock);
 if(action==='place')aim();
 const panel=doc.getElementById('nightGearQuick');panel.open=true;panel.dispatch('toggle');
 const suffix={equip:'equip',store:'store',place:'place',pickup:'place',refill:'refill',remove:'remove',ignite:'toggle'}[action];
 const button=action==='craft'?panel.querySelectorAll('button').find(b=>b.dataset.kind==='torch'):doc.getElementById('night-device-'+id+'-'+suffix);
 assert.ok(button&&doc.body.contains(button),'Real shipped light control');
 const before={devices:g.nightGear.snapshot(),resources:{...g.resources},carry:{...g.player.carry},mounted:g.fieldcraft.context().mounted};
 const enabled=!button.disabled;button.click();
 const after={devices:g.nightGear.snapshot(),resources:{...g.resources},carry:{...g.player.carry},mounted:g.fieldcraft.context().mounted};
 const result={action,lock,browser:false,enabled,before,after,busy:g.nightGear.busy()};
 if(require.main===module)process.stdout.write(JSON.stringify(result,null,2)+'\n');
 assert.deepEqual(after,before,'A real material action waits for the existing hand operation');
 assert.equal(g.nightGear.busy(),false,'No second task is created');
 const invoke=()=>action==='craft'?g.nightGear.craft('torch'):action==='equip'||action==='store'?g.nightGear.transfer(id,action):g.nightGear[action](id);
 assert.equal(invoke().ok,false,'The controller also protects a stale enabled button');
 if(lock==='reload'){for(let i=0;i<100&&g.player.reload>0;i++)g.updatePlayer(.04);assert.equal(g.player.reload,0);}
 if(lock==='mounted')assert.ok(g.fieldcraft.control());
 if(lock==='work')g.arsenal134.cancel();
 if(action==='place')aim();
 const resumed=invoke();assert.ok(resumed.ok,'Same physical operation becomes available once hands are free: '+resumed.reason);
 if(action==='craft')for(let i=0;i<100&&g.nightGear.busy();i++)g.nightGear.step(.04);
 const final=g.nightGear.snapshot(),stock={...g.resources};assert.ok(g.save(false));assert.ok(g.load());
 assert.deepEqual(g.nightGear.snapshot(),final);assert.deepEqual(g.resources,stock);
 return{...result,status:'passed',released:true,saveRoundTrip:true};
}
if(require.main===module)run(process.argv[2],process.argv[3]);
module.exports={run};
