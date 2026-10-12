'use strict';

const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {EventEmitter}=require('node:events');
const {inspectBattlefieldUI,verifyWindow}=require('../desktop/smoke.cjs');
const {bootGame}=require('./helpers/browser.cjs');

function battlefieldFixture(){
  const {game}=bootGame();game.startNew('story','17117','rearguard');game.paused=true;
  const core=game.core();
  const visible={id:91,x:core.x+100,y:core.y,health:60,dead:false};
  const hidden={id:92,x:core.x-100,y:core.y,health:60,dead:false};
  game.zombies=[visible,hidden];game.visibility={frame:()=>({canSeeLocal:actor=>actor===visible})};
  const filename=require.resolve('../src/battlefield-ui.js');delete require.cache[filename];require(filename);
  // The small legacy DOM fixture does not reflect className into classList.
  for(const card of document.getElementById('battlefieldSectors').children)card.classList.add('battlefield-sector');
  return {game,document,battlefield:globalThis.DeadwallBattlefield};
}

test('desktop smoke checks observed fronts in the real UI without revealing hidden contacts or changing the campaign',()=>{
  const {game,document,battlefield}=battlefieldFixture();
  const before=JSON.stringify({random:game.random.state,resources:game.resources,zombies:game.zombies,stats:game.stats});
  const probe=vm.runInNewContext('('+inspectBattlefieldUI.toString()+')(game,document,battlefield)',{game,document,battlefield});
  assert.deepEqual(JSON.parse(JSON.stringify(probe)),{fronts:4,directions:['NORD','EST','SUD','OUEST'],contacts:2});
  const cards=document.getElementById('battlefieldSectors').children;
  assert.equal(cards[1].querySelector('strong').textContent,'1 contact(s) observé(s)');
  assert.equal(cards[3].querySelector('strong').textContent,'0 contact(s) observé(s)');
  assert.equal(cards[3].dataset.alert,'false');
  assert.equal(JSON.stringify({random:game.random.state,resources:game.resources,zombies:game.zombies,stats:game.stats}),before);
});

test('desktop smoke rejects an omniscient or stale front label instead of silently accepting it',()=>{
  const {game,document,battlefield}=battlefieldFixture(),refresh=game.battlefieldUI.refresh;
  for(const text of ['1 contact(s) observé(s)','0 contacts actifs']){
    game.battlefieldUI={refresh(){refresh(true);document.getElementById('battlefieldSectors').children[3].querySelector('strong').textContent=text;}};
    assert.throws(()=>inspectBattlefieldUI(game,document,battlefield),/disagrees with observed campaign contacts: OUEST/);
  }
});

test('desktop smoke logs the original renderer error before Electron returns a generic execution failure',async()=>{
  const reportRoot=fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-smoke-error-')),messages=[],previous=console.error;
  const webContents=new EventEmitter();
  webContents.session={webRequest:{onCompleted(){},onErrorOccurred(){}}};
  webContents.executeJavaScript=async()=>{
    webContents.emit('console-message',{level:'error',message:'Uncaught Error: In-game local records are missing',sourceId:'deadwall://game/index.html',lineNumber:212});
    throw Error('Script failed to execute, this normally means an error was thrown.');
  };
  const window={webContents,setContentSize(){},async loadURL(){}};
  console.error=(...args)=>messages.push(args.join(' '));
  try{
    await assert.rejects(verifyWindow({window,reportRoot,stage:'create',gameURL:'deadwall://game/index.html'}),/Script failed to execute/);
    assert.equal(messages.length,1);
    assert.match(messages[0],/desktop create renderer.*In-game local records are missing/);
    assert.match(messages[0],/deadwall:\/\/game\/index.html:212/);
  }finally{console.error=previous;fs.rmSync(reportRoot,{recursive:true,force:true});}
});
