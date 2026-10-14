import {createHarness,recorder,ready} from './browser-qa-common142.mjs';
const h=await createHarness('vertical175','Real menu/new campaign followed by an explicitly prepared late-age QA fixture; not a human campaign or a performance benchmark.');
try{
 const page=await h.browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const q=recorder(page,h.report,h.output);
 await page.goto(h.base,{waitUntil:'domcontentloaded'});await ready(page);
 q.check('vertical runtime installed in distributed HTML',await page.evaluate(()=>!!DEADWALL.verticalCitadel175));
 await q.screenshot('01-menu');
 if(!await page.locator('#campaignMap132').evaluate(e=>e.open))await page.locator('#campaignMap132>summary').click();
 await page.locator('#mapSeed').fill('175123');await page.locator('#newGameButton').click();
 await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.campaignIntro132.isOpen());
 await page.locator('#campaignIntro132Skip').click();await page.waitForFunction(()=>!DEADWALL.campaignIntro132.isOpen());
 q.check('new campaign gifts no raised city',await page.evaluate(()=>!DEADWALL.verticalCitadel175.height()&&!DEADWALL.verticalCitadel175.snapshot().structures.length));
 await q.screenshot('02-new-game');
 h.report.fixture=await page.evaluate(()=>{
  const g=DEADWALL,C=DeadwallCore,a=g.verticalCitadel175;
  g.paused=true;g.activeOverlay=null;
  const save=g.serialize();save.urban.peakScore=2000;save.urban.progression151={version:1,age:10};
  if(!g.restoreSave(save))throw Error('QA age fixture rejected');g.paused=false;g.activeOverlay=null;
  g.resources=C.makeBag({wood:100000,scrap:100000,stone:100000,ammo:100000,food:100000,fuel:100000});g.tier=C.CITY_TIERS[10];
  let b;for(let y=60;y<110&&!b;y+=12)for(let x=60;x<110&&!b;x+=12)if(g.placeOne('bastion12',x,y))b=[...g.world.buildings.values()].find(b=>b.type==='bastion12');
  if(!b)throw Error('No legal QA footprint');b.progress=1;b.health=b.maxHealth;a.reconcile();g.tier=C.CITY_TIERS[10];
  const advance=seconds=>{for(let i=0;i<Math.ceil(seconds/.2);i++){g.elapsed+=.2;a.step(.2);}};
  let p=a.entry(b.id);g.player.x=p.x*32;g.player.y=p.y*32;
  if(!a.travelTo(b.id,12).ok)throw Error('Stair refused');advance(12/C.VerticalRules175.stairsSpeed+1);
  p=a.landing(b.id);g.player.x=p.x*32;g.player.y=p.y*32;
  if(!a.startWork('module',b.id,12,0,'gun').ok)throw Error('Gun work refused');advance(C.VerticalRules175.modules.gun.seconds+1);
  p=a.modulePoint(b.id,0);g.player.x=(p.x+1)*32;g.player.y=p.y*32;g.player.carry.ammo=120;
  if(!a.startWork('reload',b.id,12,0).ok)throw Error('Reload refused');advance(4);b.powered=true;
  if(!a.mount(b.id,12,0).ok)throw Error('Station refused');g.camera.x=g.player.x;g.camera.y=g.player.y;g.camera.zoom=1;
  const enemies=['colossusRam',...Array.from({length:24},(_,i)=>i%2?'runner':'walker')];
  for(const [i,kind]of enemies.entries()){
   if(!g.spawnZombie(kind))throw Error('QA contact spawn refused');const z=g.zombies.at(-1);
   z.x=(p.x-25+(i%6)*4)*32;z.y=(p.y-32-Math.floor(i/6)*4)*32;z.lastX=z.x;z.lastY=z.y;
  }
  g.paused=true;g.activeOverlay=null;g.render();globalThis.vertical175Fixture={id:b.id,point:p};
  return{id:b.id,height:a.height(),module:a.snapshot().structures.find(s=>s.id===b.id).modules[0],seed:175123,explicitlyPrepared:true};
 });
 q.check('interior stair reaches a real 12m floor',h.report.fixture.height===12);
 q.check('installed gun contains only transferred cartridges',h.report.fixture.module.ammo===120);
 await q.screenshot('03-classic-bastion');
 const switched=await page.evaluate(()=>{const g=DEADWALL,a=g.verticalCitadel175;g.paused=false;g.activeOverlay=null;g.world.buildings.get(vertical175Fixture.id).powered=true;const result=a.switchView();a.setAim(-2.2,-.22);g.paused=true;g.render();return result;});
 q.check('same weapon enters perspective FPS',switched.view==='fps');await q.screenshot('04-fps-bastion');
 const shot=await page.evaluate(()=>{const g=DEADWALL,a=g.verticalCitadel175;g.paused=false;g.activeOverlay=null;g.world.buildings.get(vertical175Fixture.id).powered=true;const before=a.snapshot().structures.find(s=>s.id===vertical175Fixture.id).modules[0].ammo,hit=a.fireMounted(),after=a.snapshot().structures.find(s=>s.id===vertical175Fixture.id).modules[0].ammo;g.paused=true;return{before,hit,after};});
 q.check('FPS shot spends exactly one cartridge',shot.hit&&shot.after===shot.before-1);
 q.check('rendering does not tick simulation',await page.evaluate(()=>{const g=DEADWALL,a=g.verticalCitadel175,s=JSON.stringify(a.snapshot()),t=g.elapsed;for(let i=0;i<4;i++)g.render();return s===JSON.stringify(a.snapshot())&&t===g.elapsed;}));
 const reload=await page.evaluate(()=>{const g=DEADWALL,a=g.verticalCitadel175,s=g.serialize(),before=a.snapshot();g.restoreSave(s);g.paused=true;return{same:JSON.stringify(before)===JSON.stringify(a.snapshot()),view:a.view,height:a.height()};});
 q.check('native reload retains floor/ammo and resets camera safely',reload.same&&reload.view==='classic'&&reload.height===12);
 q.check('no page errors',h.report.pageErrors.length===0);
 q.check('no HTTP asset errors',h.report.httpErrors.length===0);
 h.report.pass=true;
}catch(error){h.report.pass=false;h.report.failure=error.stack;process.exitCode=1;}
finally{await h.close();await h.finish();}
