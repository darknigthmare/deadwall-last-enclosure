'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot131}=require('./helpers/expansions131.cjs');
const C=require('../src/core.js');
function fixture(){
 const env=boot131({ui:true}),g=env.g,doc=env.doc,menu=g.ui.mainMenu;
 const originals=new Map(['newGameButton','continueButton','howToButton','menuSettingsButton','mapSeed','startScenario','randomMapSeedButton','menuRecordsButton'].map(id=>[id,doc.getElementById(id)]));
 const proto=Object.getPrototypeOf(doc.body),append=proto.appendChild,prepend=proto.prepend;
 proto.appendChild=function(n){if(n.parentNode)n.remove();return append.call(this,n);};
 proto.prepend=function(n){if(n.parentNode)n.remove();return prepend.call(this,n);};
 proto.setCustomValidity=function(message){this.validationMessage=message;};
 menu.replaceChildren();
 const html=fs.readFileSync(require.resolve('../index.html'),'utf8').split('<div id="mainMenu"')[1].split('<div id="pauseMenu"')[0];
 const content=html.slice(html.indexOf('>')+1).replace(/<\/div>\s*$/,''),stack=[menu];
 // Actual title markup with original event-bearing nodes; this fixture has no CSS layout engine.
 for(const token of content.match(/<[^>]+>|[^<]+/g)){
  if(token.startsWith('</')){stack.pop();continue;}
  if(token.startsWith('<')){
   const m=/^<(\w+)/.exec(token);if(!m)continue;
   const id=/id="([^"]+)"/.exec(token)?.[1],n=originals.get(id)||doc.createElement(m[1]);n.tagName=m[1].toUpperCase();
   for(const a of token.matchAll(/([\w-]+)="([^"]*)"/g)){
    if(a[1]==='id'){n.id=a[2];env.elements.set(n.id,n);}else if(a[1]==='class')n.className=a[2];
    else if(['value','type','name'].includes(a[1]))n[a[1]]=a[2];else n.setAttribute(a[1],a[2]);
   }
   n.checked=/\schecked(?:\s|>)/.test(token);stack.at(-1).appendChild(n);if(!['input','br','img','hr'].includes(m[1]))stack.push(n);
  }else if(token.trim())stack.at(-1).textContent+=token.trim();
 }
 const query=doc.querySelector.bind(doc);doc.querySelector=s=>s==='input[name="difficulty"]:checked'?menu.querySelectorAll('input').find(n=>n.name==='difficulty'&&n.checked):query(s);
 for(const file of ['ui','scenario-ui']){const p=require.resolve('../src/'+file+'.js');delete require.cache[p];require(p);}
 g.returnToMenu();require('../src/command-presentation129.js').install(g,doc);
 require('../src/campaign-intro132.js').install(g,doc);require('../src/presentation132.js').install(g,doc);
 return{...env,g,doc,q:id=>doc.getElementById(id),intro:g.campaignIntro132};
}

test('QA132 raccord menu : choix réels, briefing, récit, paramètres, retour et reprise gardent leurs données',()=>{
 const{g,doc,q,intro}=fixture(),confirmation=globalThis.confirm;
 try{
  q('startScenario').value='convoy';q('startScenario').dispatch('change');
  const radios=g.ui.mainMenu.querySelectorAll('input').filter(n=>n.name==='difficulty');
  for(const radio of radios)radio.checked=radio.value==='brutal';radios.find(n=>n.checked).dispatch('change');
  const expected=globalThis.DeadwallScenarios.initialState('convoy','brutal');
  assert.match(q('startScenarioFacts').textContent,/5 ouvriers/);
  assert.ok(q('startScenarioFacts').textContent.includes(C.formatTime(expected.calmSeconds)));
  assert.equal(doc.body.querySelector('.title-portrait132').dataset.scenario,'convoy');
  globalThis.confirm=()=>true;q('newGameButton').click();
  assert.equal(g.difficulty.id,'brutal');assert.equal(g.scenarioId,'convoy');assert.equal(intro.view().scenario,'convoy');
  assert.deepEqual(g.resources,expected.resources);intro.skip();
  g.togglePause(true);g.showSettings(true);assert.equal(g.activeOverlay,g.ui.settingsModal);
  q('settingsMotion').checked=true;q('settingsMotion').dispatch('change');
  assert.equal(g.settings.reducedMotion,true);assert.equal(doc.body.classList.contains('reduced-motion'),true);
  q('settingsClose').click();assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.pauseMenu);
  assert.equal(intro.replay(),true);assert.equal(intro.element.classList.contains('campaign132-static'),true);intro.skip();
  assert.equal(g.paused,true);q('resumeButton').click();assert.equal(g.paused,false);
  g.returnToMenu();const seed=g.world.seed;q('continueButton').click();assert.equal(g.world.seed,seed);
  assert.equal(intro.isOpen(),false);assert.equal(g.difficulty.id,'brutal');assert.equal(g.scenarioId,'convoy');
  assert.equal(g.chronicles131.snapshot().prologue.status,'active');assert.equal(g.activeOverlay,null);
 }finally{globalThis.confirm=confirmation;}
});

test('QA132 raccord archives : réutiliser une vraie carte révèle le champ et conserve la campagne active',()=>{
 const{g,doc,q,intro}=fixture();g.startNew('standard','835711','convoy');intro.skip();g.returnToMenu();
 const world=g.world,run=g.runId,resources={...g.resources};q('menuRecordsButton').click();
 assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(q('commandTab-records').getAttribute('aria-selected'),'true');
 const reuse=q('recentCampaigns').querySelectorAll('button').find(b=>b.getAttribute('aria-label')==='Réutiliser la carte 835711');
 assert.ok(reuse);q('campaignMap132').open=false;reuse.click();
 assert.equal(g.world,world);assert.equal(g.runId,run);assert.deepEqual(g.resources,resources);
 assert.equal(q('mapSeed').value,'835711');assert.equal(q('startScenario').value,'convoy');
 assert.equal(q('campaignMap132').open,true);assert.equal(doc.activeElement,q('mapSeed'));
 assert.equal(doc.body.querySelector('.title-portrait132').dataset.scenario,'convoy');assert.equal(g.activeOverlay,g.ui.mainMenu);
 assert.equal(intro.isOpen(),false);
});
