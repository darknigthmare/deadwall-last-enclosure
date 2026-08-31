'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {bootGame}=require('./helpers/browser.cjs'),C=require('../src/core.js'),N=require('../src/narrative.js'),Save=require('../src/save.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const descendants=node=>node.children.flatMap(child=>[child,...descendants(child)]);
const textTree=node=>[node.textContent,...node.children.map(textTree)].join(' ');
const click=node=>node.dispatch('click',{currentTarget:node});
function journalFixture({playing=true}={}){
  const env=bootGame(),{game}=env,get=id=>document.getElementById(id);
  const attach=(parent,id)=>{
    const node=get(id),tag=html.match(new RegExp('<([a-z]+)[^>]*\\bid="'+id+'"[^>]*>'));
    if(tag){node.tagName=tag[1].toUpperCase();const classes=tag[0].match(/class="([^"]*)"/);if(classes)node.classList.add(...classes[1].split(' '));for(const attribute of ['role','tabindex','aria-selected']){const value=tag[0].match(new RegExp(attribute+'="([^"]*)"'));if(value)node.setAttribute(attribute,value[1]);}}
    get(parent).appendChild(node);return node;
  };
  const tabIds=['enclosure','workers','research','records','field','journal'];
  attach('commandModal','commandClose');
  for(const id of tabIds){attach('commandModal','commandTab-'+id);attach('commandModal','commandPanel-'+id);}
  for(const id of ['commandStatus','commandContext'])attach('commandModal',id);
  for(const id of ['narrativeSummary','narrativeReadAll','narrativeBrief','narrativeContext','narrativeChapters','narrativeOperations'])attach('commandPanel-journal',id);
  attach('commandPanel-enclosure','commandCrisisCard');
  for(const id of ['commandCrisisTitle','commandCrisisText','commandCrisisTimer','commandCrisisA','commandCrisisB'])attach('commandCrisisCard',id);
  for(const id of ['perimeterResult','perimeterDetails','perimeterAdvice','commandGate','gateEmpty','gateMode-auto','gateMode-open','gateMode-closed'])attach('commandPanel-enclosure',id);
  for(const id of ['workerSummary','workerAccess','workerOrders'])attach('commandPanel-workers',id);
  for(const id of ['researchBudget','researchLibrary'])attach('commandPanel-research',id);
  for(const id of ['recordBoard','recentCampaigns','profileStatus'])attach('commandPanel-records',id);
  attach('rightPanel','journalCommandButton');attach('journalCommandButton','journalUnread');
  for(const module of ['command-ui','narrative-ui']){const filename=require.resolve('../src/'+module+'.js');delete require.cache[filename];require(filename);}
  if(playing)game.startNew('standard','17117');
  const open=()=>game.showCommand(true,'journal');
  const card=theme=>descendants(get('narrativeOperations')).find(node=>node.dataset.narrativeSector===theme);
  const choice=(theme,key)=>descendants(card(theme)).find(node=>node.dataset.narrativeChoice===key);
  const observe=theme=>{game.narrative.sectors[theme].survey=C.NARRATIVE_RULES.surveySeconds;game.narrative.unread.push('sector:'+theme);};
  const core=()=>Object.assign(game.player,{x:game.core().x,y:game.core().y});
  return {...env,get,open,card,choice,observe,core};
}

test('journal UI : DOM, scripts locaux, six onglets et causes visibles sont raccordés',()=>{
  const code=fs.readFileSync(path.join(__dirname,'../src/narrative-ui.js'),'utf8');
  for(const match of code.matchAll(/get\('([^']+)'\)/g))assert.ok(html.includes('id="'+match[1]+'"'),match[1]);
  for(const name of ['narrative.js','narrative-ui.js'])assert.ok(html.includes('src/'+name));
  assert.ok(html.includes('href="narrative.css"'));assert.ok(html.indexOf('src/narrative.js')<html.indexOf('src/save.js'));
  assert.ok(html.indexOf('src/narrative-ui.js')>html.indexOf('src/content-ui.js'));
  assert.equal((html.match(/role="tab" aria-controls="commandPanel-/g)||[]).length,6);
  assert.match(html,/Une seule campagne active/);assert.match(html,/fichiers exportés restent intacts/);
  assert.ok(!/https?:\/\//.test(code));
});

test('journal UI : consultation au menu, six traces fermées, un chapitre et aucune commande de campagne',()=>{
  const {game,get,open,card,choice}=journalFixture({playing:false}),before=JSON.stringify(game.resources);open();
  assert.equal(game.state,'menu');assert.equal(get('commandTab-journal').getAttribute('aria-selected'),'true');
  assert.equal(get('commandTab-enclosure').disabled,true);assert.equal(get('commandTab-journal').disabled,false);
  assert.equal(get('narrativeReadAll').disabled,true);assert.match(get('narrativeContext').textContent,/Consultation/);
  assert.equal(get('narrativeChapters').children.filter(node=>!node.classList.contains('hidden')).length,1);
  for(const sector of N.SECTORS){assert.equal(card(sector.id).tagName,'DETAILS');assert.ok(!card(sector.id).open);assert.equal(choice(sector.id,'A').disabled,true);assert.ok(descendants(card(sector.id)).find(node=>node.tagName==='BLOCKQUOTE').classList.contains('hidden'));}
  click(choice('housing','A'));assert.equal(JSON.stringify(game.resources),before);assert.equal(game.narrative.sectors.housing.choice,null);
  get('commandTab-journal').dispatch('keydown',{code:'ArrowRight'});assert.equal(get('commandTab-records').getAttribute('aria-selected'),'true');
  get('commandTab-records').dispatch('keydown',{code:'End'});assert.equal(document.activeElement,get('commandTab-journal'));
});

test('journal UI : Tab ignore les commandes des dossiers fermés et boucle sur leur dernier résumé',()=>{
  const {game,get,open,card}=journalFixture();open();
  const marker=theme=>descendants(card(theme)).find(node=>node.dataset.narrativeMark===theme),housing=card('housing'),last=card('checkpoint').children[0];
  for(const sector of N.SECTORS){
    assert.ok(game.overlayFocusable(game.ui.commandModal).includes(card(sector.id).children[0]));
    assert.ok(!game.overlayFocusable(game.ui.commandModal).includes(marker(sector.id)));
  }
  housing.open=true;assert.ok(game.overlayFocusable(game.ui.commandModal).includes(marker('housing')));
  housing.open=false;assert.ok(!game.overlayFocusable(game.ui.commandModal).includes(marker('housing')));
  last.focus();let prevented=false;game.trapOverlayFocus({shiftKey:false,preventDefault(){prevented=true;}});
  assert.ok(prevented);assert.equal(document.activeElement,get('commandClose'));
  prevented=false;game.trapOverlayFocus({shiftKey:true,preventDefault(){prevented=true;}});
  assert.ok(prevented);assert.equal(document.activeElement,last);
});

test('journal UI : relevé partiel conservé, trace masquée avant huit secondes et retour réel exigé',()=>{
  const {game,open,card,choice,observe}=journalFixture();game.narrative.sectors.housing.survey=3.5;open();
  const housing=card('housing'),progress=descendants(housing).find(node=>node.tagName==='PROGRESS'),trace=descendants(housing).find(node=>node.tagName==='BLOCKQUOTE');
  assert.equal(progress.value,3.5);assert.ok(trace.classList.contains('hidden'));assert.equal(choice('housing','A').disabled,true);
  observe('housing');const site=game.world.sites.find(site=>site.theme==='housing');Object.assign(game.player,{x:site.x,y:site.y});game.narrativeUI.refresh();
  assert.ok(!trace.classList.contains('hidden'));assert.equal(choice('housing','A').disabled,true);assert.match(textTree(housing),/Retournez près du centre/);
});

test('journal UI : repère de secteur réversible sans mouvement, collecte ni récompense',()=>{
  const {game,open,card}=journalFixture();open();const before=JSON.stringify({x:game.player.x,y:game.player.y,resources:game.resources,insight:game.research.insight,narrative:game.narrative});
  const marker=descendants(card('housing')).find(node=>node.dataset.narrativeMark==='housing'),site=game.world.sites.find(site=>site.theme==='housing');
  click(marker);assert.equal(game.fieldMarker,site.id);click(marker);assert.equal(game.fieldMarker,null);
  assert.equal(JSON.stringify({x:game.player.x,y:game.player.y,resources:game.resources,insight:game.research.insight,narrative:game.narrative}),before);
});

test('journal UI : première ouverture active les choix puis une décision paie une seule fois et conserve le focus',()=>{
  const {game,get,open,card,choice,observe,core,storage}=journalFixture();observe('housing');core();open();
  assert.equal(game.activeOverlay,game.ui.commandModal);assert.equal(game.paused,true);assert.equal(choice('housing','A').disabled,false);
  const option=N.SECTORS.find(sector=>sector.id==='housing').choices.A,before={...game.resources},insight=game.research.insight;card('housing').open=true;click(choice('housing','A'));
  assert.equal(game.narrative.sectors.housing.choice,'A');assert.equal(game.research.insight,insight+option.reward.insight);
  for(const [key,value]of Object.entries(option.cost))assert.equal(game.resources[key],before[key]-value);
  assert.equal(Save.parse(storage.get(C.SAVE_KEY)).narrative.sectors.housing.choice,'A');assert.match(get('commandStatus').textContent,/Décision consignée/);
  const summary=card('housing').children[0];assert.equal(document.activeElement,summary);assert.ok(game.overlayFocusable(game.ui.commandModal).includes(summary));
  const paid=JSON.stringify(game.resources);click(choice('housing','A'));click(choice('housing','B'));game.narrativeUI.refresh();assert.equal(JSON.stringify(game.resources),paid);assert.equal(game.research.insight,insight+1);
});

test('journal UI : réserves insuffisantes expliquées individuellement et plafond de moral annoncé',()=>{
  const {game,open,card,choice,observe,core}=journalFixture();observe('housing');core();game.resources.scrap=0;game.morale=100;open();
  const button=choice('housing','A'),reason=descendants(card('housing')).find(node=>node.id===button.getAttribute('aria-describedby'));
  assert.equal(button.disabled,true);assert.ok(reason&&!reason.classList.contains('hidden'));assert.match(reason.textContent,/Réserves insuffisantes/);
  assert.equal(choice('housing','B').disabled,false);assert.match(textTree(card('housing')),/Moral \+0 \(plafond 100 ; maximum \+4\)/);
  const food=game.resources.food;click(choice('housing','B'));assert.equal(game.morale,100);assert.equal(game.resources.food,food-8);
});

test('journal UI : marquer lu conserve les stocks et les choix, sauvegarde et rend le focus à l’onglet',()=>{
  const {game,get,open,observe,storage}=journalFixture();observe('housing');open();
  const before=JSON.stringify({resources:game.resources,insight:game.research.insight,sectors:game.narrative.sectors});click(get('narrativeReadAll'));
  assert.deepEqual(game.narrative.unread,[]);assert.equal(get('narrativeReadAll').disabled,true);assert.equal(document.activeElement,get('commandTab-journal'));
  assert.equal(JSON.stringify({resources:game.resources,insight:game.research.insight,sectors:game.narrative.sectors}),before);
  assert.deepEqual(Save.parse(storage.get(C.SAVE_KEY)).narrative.unread,[]);assert.match(get('commandStatus').textContent,/Aucun coût ni récompense/);
});

test('commandement UI : crise décidable dès l’ouverture, minuterie suspendue et focus après choix',()=>{
  const {game,get}=journalFixture();game.activeCrisis={id:'blackout',wave:3,status:'pending',remaining:20,targetId:null,choice:null};
  game.showCommand(true,'enclosure');assert.equal(game.activeOverlay,game.ui.commandModal);assert.equal(get('commandCrisisB').disabled,false);assert.match(get('commandCrisisTimer').textContent,/Décision suspendue/);
  const remaining=game.activeCrisis.remaining;game.updateCrisis(3);assert.equal(game.activeCrisis.remaining,remaining);
  click(get('commandCrisisB'));assert.equal(game.activeCrisis.choice,'B');assert.equal(game.activeCrisis.status,'resolved');assert.ok(get('commandCrisisB').classList.contains('hidden'));assert.equal(document.activeElement,get('commandTab-enclosure'));assert.ok(get('commandStatus').textContent.length>20);
});
