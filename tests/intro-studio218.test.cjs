'use strict';
// Intro cinématique du studio et écran d'accueil (présentation seule, avant le menu principal).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const Intro=require('../src/intro-studio218.js');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/intro-studio218.js'),'utf8');
const find=(node,id)=>node.id===id?node:(node.children||[]).reduce((hit,c)=>hit||find(c,id),null);
// Rejoue l'intro sous le harnais : `?intro=0` reste le chemin du jeu, l'intro est installée à la main.
function forced(opts={}){
 const e=bootDocument134();const {g,doc}=e;delete g.introStudio218;
 let clock=0;const now=()=>clock;
 assert.equal(Intro.install(g,doc,{mode:'intro',manual:true,immediate:true,reduced:false,now,...opts}),true);
 const overlay=find(doc.body,'studioIntro218');
 return {...e,overlay,api:g.introStudio218,tick:ms=>{clock+=ms;}};
}

test('218 décision de lancement : pilotage, URL, harnais et préférence locale',()=>{
 assert.equal(Intro.decide({}),'intro');
 assert.equal(Intro.decide({webdriver:true}),'off');
 assert.equal(Intro.decide({hasCanvas:false}),'off');
 assert.equal(Intro.decide({search:'?intro=0'}),'off');
 assert.equal(Intro.decide({search:'?tools=1&intro=0',skipIntro:true}),'off');
 assert.equal(Intro.decide({skipIntro:true}),'title');
 assert.equal(Intro.decide({search:'?intro=1',webdriver:true}),'intro');
 assert.equal(Intro.decide({search:'?intro=title',webdriver:true}),'title');
});

test('218 calendrier : trois cartons puis la séquence, environ 15 s, orthographe du studio',()=>{
 const T=Intro.TIMELINE;
 assert.deepEqual(T.cards.map(c=>c.text),['Darknigthmare Kingdoms Games Productions','présente','un jeu de Darknigthmare']);
 assert.ok(T.end>=14&&T.end<=16);
 assert.equal(Intro.cardAt(1.8).id,'studio');assert.equal(Intro.cardAt(4.6).id,'presents');assert.equal(Intro.cardAt(6.8).id,'author');
 assert.equal(Intro.cardAt(9),null);assert.ok(Intro.cardAt(0).alpha<.01);
 const s=Intro.sceneState(13,false);assert.equal(s.scene,1);assert.equal(s.crack,1);assert.ok(s.reveal>.9);
 assert.equal(Intro.sceneState(13,true).crack,0,'mouvement réduit : pas de fissure, un fondu');
 assert.equal(Intro.sceneState(15,false).done,true);
 assert.match(source,/Darknigthmare Kingdoms Games Productions/);assert.doesNotMatch(source,/Darknightmare/);
});

test('218 aléa de présentation séparé : décor stable, aucun tirage de simulation',()=>{
 assert.deepEqual(Intro.scenery(),Intro.scenery());
 assert.notDeepEqual(Intro.scenery(1).horde[0],Intro.scenery(2).horde[0]);
 assert.doesNotMatch(source,/Math\.random|\.random\s*\(|g\.random|startNew|serialize|\b(?:g|game|this)\.save\(|SAVE_KEY|SETTINGS_KEY/);
});

test('218 harnais Node : passage automatique, menu principal et boutons intacts',async()=>{
 const {g,doc}=bootDocument134();await new Promise(r=>setTimeout(r,0));
 assert.equal(g.introStudio218.mode,'off');assert.equal(g.introStudio218.isOpen(),false);
 assert.equal(find(doc.body,'studioIntro218'),null);
 assert.equal(g.ui.mainMenu.inert,false);assert.equal(g.ui.mainMenu.classList.contains('hidden'),false);
 g.startupReady=true;doc.getElementById('newGameButton').click();
 assert.equal(g.state,'playing');g.campaignIntro132?.skip?.();
});

test('218 parcours complet : cartons, accueil, puis menu principal avec le focus',()=>{
 const {g,doc,overlay,api}=forced();
 assert.ok(overlay);assert.equal(api.phase(),'intro');
 assert.equal(g.ui.mainMenu.inert,true,'le menu reste sous le rideau, inerte');
 const count=(n,id)=>(n.id===id?1:0)+(n.children||[]).reduce((k,c)=>k+count(c,id),0);
 assert.equal(count(doc.body,'settingsSkipIntro218'),1,'un seul réglage, même réinstallé');
 assert.equal(overlay.getAttribute('role'),'dialog');assert.equal(overlay.getAttribute('aria-modal'),'true');
 const live=find(overlay,'studioIntroLive218'),skip=find(overlay,'studioIntroSkip218'),prompt=find(overlay,'studioIntroPrompt218'),footer=find(overlay,'studioIntroFooter218');
 assert.equal(live.getAttribute('aria-live'),'polite');assert.equal(doc.activeElement,skip);
 api.advance(4.5);assert.equal(live.textContent,'présente');
 const cards=overlay.children.filter(n=>n.dataset?.card);assert.equal(cards.length,3);
 assert.ok(Number(cards.find(c=>c.dataset.card==='presents').style.opacity)>.9);
 api.advance(2.5);assert.equal(live.textContent,'un jeu de Darknigthmare');
 g.syncOverlayFocus();assert.equal(g.ui.mainMenu.inert,true,'une synchronisation du jeu ne rouvre pas le menu');
 api.advance(9);assert.equal(api.phase(),'title');
 assert.equal(prompt.hidden,false);assert.equal(prompt.textContent,'Appuyez pour commencer');
 assert.equal(footer.hidden,false);assert.equal(footer.textContent,'Darknigthmare Kingdoms Games Productions');
 assert.equal(skip.hidden,true);assert.equal(doc.activeElement,prompt);
 assert.equal(find(overlay,'studioIntroTitle218').getAttribute('aria-label'),'DEADWALL — The Last Enclosure');
 assert.equal(api.start(),true);assert.equal(api.phase(),'menu');
 assert.equal(find(doc.body,'studioIntro218'),null);assert.equal(g.ui.mainMenu.inert,false);
 assert.equal(doc.activeElement,doc.getElementById('newGameButton'));
});

test('218 passage à tout moment : touche, pointeur, puis interaction d’accueil distincte',()=>{
 const {overlay,api,dispatchWindow,tick}=forced();
 api.advance(1);dispatchWindow('keydown',{code:'Escape',key:'Escape'});assert.equal(api.phase(),'title');
 // La même touche maintenue ne franchit pas l'accueil.
 dispatchWindow('keydown',{code:'Escape',key:'Escape',repeat:true});assert.equal(api.phase(),'title');
 // Un pointeur levé sans appui commencé sur l'accueil ne lance rien.
 tick(400);dispatchWindow('pointerup',{target:overlay});assert.equal(api.phase(),'title');
 dispatchWindow('keydown',{code:'Tab',key:'Tab'});assert.equal(api.phase(),'title','Tab reste une navigation');
 dispatchWindow('pointerdown',{target:overlay});dispatchWindow('pointerup',{target:overlay});assert.equal(api.phase(),'menu');
 const b=forced();b.api.advance(.5);b.dispatchWindow('pointerdown',{target:b.overlay});assert.equal(b.api.phase(),'title');
 b.dispatchWindow('pointerup',{target:b.overlay});assert.equal(b.api.phase(),'title','le geste qui passe l’intro ne franchit pas l’accueil');
 b.tick(300);b.dispatchWindow('keydown',{code:'Enter',key:'Enter'});assert.equal(b.api.phase(),'menu');
});

test('218 l’accueil débloque l’audio ; le son grave ne joue que si l’audio est déjà actif',()=>{
 const {g,api}=forced({mode:'title'});let unlocked=0;g.audio.unlock=()=>{unlocked++;return true;};
 api.start();assert.equal(unlocked,1);
 const nodes=[],param=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>{const n={frequency:param(),gain:param(),connect(t){n.to=t;},disconnect(){},start(){},stop(){}};nodes.push(n);return n;};
 const audio={enabled:true,muted:false,volume:.7,master:{},ctx:{state:'suspended',currentTime:0,createOscillator:node,createGain:node}};
 assert.equal(Intro.rumble({audio}),false,'audio verrouillé : silence');
 audio.ctx.state='running';assert.equal(Intro.rumble({audio}),true);assert.ok(nodes.some(n=>n.to===audio.master));
 audio.muted=true;assert.equal(Intro.rumble({audio}),false);
 assert.equal(Intro.rumble({}),false);
});

test('218 réglage « Passer l’intro au lancement » : préférence locale hors campagne',()=>{
 const {g,doc,storage}=bootDocument134();const C=globalThis.DeadwallCore;
 const input=doc.getElementById('settingsSkipIntro218'),row=doc.getElementById('settingsSkipIntroRow218');
 assert.ok(input&&row);assert.equal(input.type,'checkbox');assert.equal(row.textContent,'Passer l’intro au lancement');
 assert.equal(row.parentNode,doc.getElementById('settingsMotion').closest('label').parentNode,'dans les réglages existants');
 const before=new Map([...storage].filter(([k])=>k!==Intro.PREF_KEY));
 input.checked=true;input.dispatch('change',{target:input});
 assert.deepEqual(JSON.parse(storage.get(Intro.PREF_KEY)),{skipIntro:true});
 assert.deepEqual(new Map([...storage].filter(([k])=>k!==Intro.PREF_KEY)),before,'ni sauvegarde ni réglages du jeu touchés');
 assert.equal(storage.has(C.SAVE_KEY),false);
 assert.equal(Intro.decide({skipIntro:Intro.readPref(globalThis.localStorage).skipIntro}),'title');
 input.checked=false;input.dispatch('change',{target:input});assert.equal(Intro.readPref(globalThis.localStorage).skipIntro,false);
 assert.equal(g.settings.skipIntro,undefined);
});

test('218 mouvement réduit : fondus simples, pas de fissure ni de clignotement',()=>{
 const {overlay,api}=forced({reduced:true});
 assert.equal(api.reduced,true);assert.ok(overlay.classList.contains('reduced218'));
 api.advance(12.4);const title=find(overlay,'studioIntroTitle218');
 assert.equal(title.style['--reveal'],'1','aucune ouverture par fissure');assert.ok(Number(title.style['--title-alpha'])>0);
});

test('218 aucune trace : campagne identique octet pour octet, aucun tirage consommé',async()=>{
 const run=async(withIntro)=>{
  // Horloge, hasard et identifiant de partie figés : seule l'intro peut faire diverger les deux parties.
  const realNow=Date.now,realRandom=Math.random,realUUID=globalThis.crypto?.randomUUID;let calls=0,seed=7;
  if(globalThis.crypto)globalThis.crypto.randomUUID=()=>'00000000-0000-4000-8000-000000000218';
  Date.now=()=>1767225600000;Math.random=()=>{calls++;seed=(seed*16807)%2147483647;return seed/2147483647;};
  try{
   const e=withIntro?forced():bootDocument134();await new Promise(r=>setTimeout(r,0));
   const store=new Map(e.storage);let introCalls=0;
   if(withIntro){const c0=calls;e.api.advance(16);e.api.start();introCalls=calls-c0;assert.deepEqual(new Map(e.storage),store,'l’intro n’écrit rien');}
   seed=7;e.g.startNew('standard','17117');e.g.campaignIntro132?.skip?.();
   return {introCalls,save:JSON.stringify(e.g.serialize()),stored:e.storage.get(globalThis.DeadwallCore.SAVE_KEY)};
  }finally{Date.now=realNow;Math.random=realRandom;if(globalThis.crypto)globalThis.crypto.randomUUID=realUUID;}
 };
 const plain=await run(false),played=await run(true);
 assert.equal(played.introCalls,0,'aucun tirage pendant l’intro');
 assert.equal(played.save,plain.save);assert.equal(played.stored,plain.stored);
});

test('218 manifeste public : script après le jeu et les menus, présent hors ligne',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const at=f=>html.indexOf('<script src="'+f+'"></script>');
 assert.ok(at('src/intro-studio218.js')>0);
 for(const before of ['src/game.js','src/ui.js','src/player-menus194.js'])assert.ok(at(before)>=0&&at(before)<at('src/intro-studio218.js'),before);
 assert.match(sw,/"src\/intro-studio218\.js"/);
 assert.doesNotMatch(source,/url\(|https?:\/\/|\.png|\.webp|\.mp3|\.ogg/,'aucune ressource externe');
});
