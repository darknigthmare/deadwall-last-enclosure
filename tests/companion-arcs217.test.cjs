'use strict';
// Arcs des compagnons (bible §2.7) : seize entretiens, quatre étapes par personne,
// chacune ouverte par un fait de jeu et sans aucune récompense de lecture.
const test=require('node:test'),assert=require('node:assert/strict'),{bootGame}=require('./helpers/browser.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const Kit=require('../src/expansion-kit.js'),Pack=require('../src/chronicles131.js'),D=require('../src/chronicles131-data.js'),N=require('../src/narrative.js'),C=require('../src/core.js');
const SURVEY=C.NARRATIVE_RULES.surveySeconds,VILLE=C.CITY_TIERS.find(t=>t.name==='VILLE');
const copy=x=>JSON.parse(JSON.stringify(x));
function fresh(){
  const env=bootGame(),g=env.game;Kit.install(g);Pack.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());
  g.population=10;g.resources.food=100;
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
  return {g,notes,talks:()=>notes.filter(text=>text.startsWith('Entretien : '))};
}
// Une seconde de simulation active : assez pour deux lectures des faits.
const settle=g=>{for(let i=0;i<26;i++)g.chronicles131.tick(.04);};
const stages=g=>[...g.chronicles131.snapshot().arcs].sort();
const assign=(g,id)=>assert.equal(g.worldEvolution.assignCompanion(id),true,id);
const night=(g,{lost=[],breach=null,wave=g.wave}={})=>{g.fallbackOrder={nightLog:()=>({wave,lost,retaken:[]}),status:()=>({lastBreach:breach})};};

test('arcs : seize entretiens, quatre par compagnon, étapes dans l’ordre, liens de la bible',()=>{
  const A=D.companionArcs;
  assert.deepEqual(A.map(a=>a.id),['lea','samir','ines','malik']);
  assert.deepEqual(A.map(a=>a.id),D.voices.map(v=>v.id),'les mêmes quatre personnes que les propos existants');
  assert.equal(A.flatMap(a=>a.steps).length,16);
  assert.deepEqual(A.map(a=>a.link),['Lina et Solène','Nora et Héloïse','Émile R.','le barrage']);
  assert.deepEqual(A.map(a=>a.sector),['housing','aid','industry','checkpoint']);
  const titles=new Set();
  for(const a of A){
    assert.equal(a.steps.length,4);
    assert.deepEqual(a.steps.map(s=>s.stage),[1,2,3,4]);
    assert.deepEqual(a.steps.map(s=>s.label),['Rencontre','Trace','Épreuve','Choix']);
    assert.ok(N.SECTORS.some(s=>s.id===a.sector),a.sector);assert.ok(D.arcs.some(x=>x.id===a.dossier),a.dossier);
    if(a.record){const r=D.records.find(r=>r.id===a.record);assert.ok(r&&r.types,'document relevé sur place, pas au dépôt');assert.equal(r.arc,a.dossier);}
    assert.ok(a.origin.length>20&&a.question.endsWith('?'));
    for(const s of a.steps){
      assert.ok(s.title.length>3&&s.title.length<=32,s.title);titles.add(s.title);
      assert.match(s.text,/^« .+[.?] »$/,'propos rapporté');
      const sentences=s.text.slice(2,-2).replace(/Émile R\./g,'Émile R').split(/[.?!](?=\s|$)/).filter(part=>part.trim()).length;
      assert.ok(sentences>=2&&sentences<=5,a.id+':'+s.stage+' compte '+sentences+' phrases');
      assert.ok(s.text.length<360);
    }
    assert.doesNotMatch(a.steps[3].text,/il faut|je dois|j’ai compris|désormais/i,'le choix ne se résout pas par une morale');
  }
  assert.equal(titles.size,16);
});

test('arcs : aucun mot interdit dans les entretiens ni dans les sources retouchées',()=>{
  const arcText=D.companionArcs.flatMap(a=>[a.origin,a.question,a.link,...a.steps.flatMap(s=>[s.title,s.text])]);
  const allText=[...arcText,...D.records.flatMap(r=>[r.title,r.source,r.text]),...D.voices.flatMap(v=>[v.title,v.text]),...N.SECTORS.flatMap(s=>[s.title,s.source,s.excerpt,s.discovery,s.choices.A.outcome,s.choices.B.outcome]),...N.CHAPTERS.map(c=>c.text)];
  for(const text of arcText)assert.doesNotMatch(text,/guérison|guéri|origine|sauvetage|secours|évacuation|vague|migration/i,text);
  for(const text of allText){
    assert.doesNotMatch(text,/virus|épidémie|vaccin|D17/i,text);
    assert.doesNotMatch(text,/Sami(?!r\b| V\.)/,text);
    assert.doesNotMatch(text.replace(/le mot « guérison » reste barré/g,'').replace(/ni de guérison\./g,''),/guérison/i,text);
  }
  // Personne « d’avant » n’est déclaré vivant, retrouvé ou mort.
  for(const text of arcText)assert.doesNotMatch(text,/(Lina|Solène|Nora|Héloïse|Émile R\.)[^.]*\b(est|sont) (vivant|morte?s?|revenue?s?|retrouvée?s?|sauvée?s?)/,text);
  assert.ok(D.records.filter(r=>r.arc==='grid'&&r.source.includes('Émile')).every(r=>r.source.includes('Émile R.')));
  assert.match(N.SECTORS.find(s=>s.id==='aid').source,/Nora, soignante du dispensaire/);
  assert.match(D.records.find(r=>r.id==='care-0').source,/Héloïse, soignante du dispensaire/);
  assert.match(D.records.find(r=>r.id==='neighbors-0').source,/Solène, voisine de Lina/);
});

test('arcs : la rencontre attend la première affectation réelle et ne se rejoue pas',()=>{
  const {g,talks}=fresh();
  settle(g);assert.deepEqual(stages(g),[]);assert.equal(talks().length,0);
  assign(g,'ines');settle(g);
  assert.deepEqual(stages(g),['ines:1']);assert.deepEqual(talks(),['Entretien : Inès — L’apprentie du dépôt.']);
  settle(g);settle(g);assert.equal(talks().length,1,'une seule fois');
  assign(g,'lea');settle(g);
  assert.deepEqual(stages(g),['ines:1','lea:1']);assert.equal(talks().length,2);
  assert.deepEqual(g.chronicles131.companionArcs().find(c=>c.id==='samir').steps,[],'un compagnon non affecté ne parle pas');
});

test('arcs : la trace attend le relevé achevé du dossier lié, pas un autre dossier ni un relevé partiel',()=>{
  const {g,talks}=fresh();assign(g,'lea');assign(g,'malik');settle(g);
  g.narrative.sectors.housing.survey=SURVEY-1;g.narrative.sectors.market.survey=SURVEY;g.narrative.sectors.industry.survey=SURVEY;settle(g);
  assert.deepEqual(stages(g),['lea:1','malik:1']);
  g.narrative.sectors.housing.survey=SURVEY;settle(g);
  assert.deepEqual(stages(g),['lea:1','lea:2','malik:1']);assert.equal(talks().at(-1),'Entretien : Léa — Mon nom sur le papier.');
  g.narrative.sectors.checkpoint.survey=SURVEY;settle(g);settle(g);
  assert.deepEqual(stages(g),['lea:1','lea:2','malik:1','malik:2']);assert.equal(talks().length,4);
});

test('arcs : la trace accepte aussi le document de terrain des Chroniques lié au compagnon',()=>{
  const {g}=fresh();assign(g,'samir');settle(g);
  const s=g.chronicles131.snapshot();s.collected=['care-0'];g.chronicles131.restore(s);settle(g);
  assert.deepEqual(stages(g),['samir:1'],'la copie du dépôt n’est pas la trace relevée sur place');
  s.arcs=['samir:1'];s.collected=['care-0','care-1'];g.chronicles131.restore(s);settle(g);
  assert.deepEqual(stages(g),['samir:1','samir:2']);
});

test('arcs : l’épreuve attend une brèche ou un secteur perdu pendant l’assaut de la nuit en cours',()=>{
  const {g,talks}=fresh();assign(g,'malik');g.phase='assault';settle(g);
  assert.deepEqual(stages(g),['malik:1'],'sans module de repli, l’étape ne se déclenche pas');
  night(g);settle(g);assert.deepEqual(stages(g),['malik:1'],'nuit sans brèche');
  night(g,{lost:['north'],wave:g.wave-1});settle(g);assert.deepEqual(stages(g),['malik:1'],'secteur perdu une autre nuit');
  night(g,{breach:{side:'north',wave:g.wave-1}});settle(g);assert.deepEqual(stages(g),['malik:1'],'brèche d’une autre nuit');
  g.phase='calm';night(g,{lost:['north']});settle(g);assert.deepEqual(stages(g),['malik:1'],'hors assaut');
  g.phase='assault';settle(g);
  assert.deepEqual(stages(g),['malik:1','malik:3']);assert.equal(talks().at(-1),'Entretien : Malik — Sans consigne.');
  const other=fresh();assign(other.g,'lea');other.g.phase='assault';night(other.g,{breach:{side:'east',wave:other.g.wave}});settle(other.g);
  assert.deepEqual(stages(other.g),['lea:1','lea:3'],'une brèche nommée suffit');
  settle(other.g);assert.equal(other.talks().length,2);
});

test('arcs : le choix attend l’âge Ville avec le compagnon vivant',()=>{
  const {g,talks}=fresh();assert.equal(VILLE.id,4);assign(g,'samir');
  g.tier=C.CITY_TIERS[VILLE.id-1];settle(g);assert.deepEqual(stages(g),['samir:1']);
  g.tier=VILLE;settle(g);
  assert.deepEqual(stages(g),['samir:1','samir:4']);assert.equal(talks().at(-1),'Entretien : Samir — Ce que je peux signer.');
  settle(g);assert.equal(talks().length,2);
});

test('arcs : aucune étape ne modifie les ressources, le moral ni l’insight',()=>{
  const {g,talks}=fresh();assign(g,'ines');assign(g,'samir');
  const before={resources:copy(g.resources),morale:g.morale,insight:g.insight,carry:copy(g.player.carry),score:g.cityScore};
  settle(g);g.narrative.sectors.industry.survey=SURVEY;g.narrative.sectors.aid.survey=SURVEY;settle(g);
  g.phase='assault';night(g,{lost:['south']});settle(g);g.tier=VILLE;settle(g);
  assert.equal(stages(g).length,8);assert.equal(talks().length,8);
  assert.deepEqual({resources:copy(g.resources),morale:g.morale,insight:g.insight,carry:copy(g.player.carry),score:g.cityScore},before);
  assert.equal(typeof g.morale,'number');
  const source=require('node:fs').readFileSync(require.resolve('../src/chronicles131.js'),'utf8'),body=source.slice(source.indexOf('function arcFacts'),source.indexOf('function trigger('));
  for(const forbidden of ['Math.random','resources','morale','insight','.health=','.health+=','rng'])assert.equal(body.includes(forbidden),false,forbidden);
});

test('arcs : sauvegarde et reprise conservent les étapes, sans rejouer d’annonce, et restent lisibles au carnet',()=>{
  const {g,notes,talks}=fresh();assign(g,'ines');settle(g);g.narrative.sectors.industry.survey=SURVEY;settle(g);
  assert.deepEqual(stages(g),['ines:1','ines:2']);
  const s=g.serialize();assert.deepEqual(s.expansions127.modules.lore131.arcs,['ines:1','ines:2']);
  notes.length=0;g.restoreSave(copy(s));settle(g);settle(g);
  assert.deepEqual(stages(g),['ines:1','ines:2']);assert.equal(talks().length,0);
  assert.ok(g.save(false));assert.ok(g.load());settle(g);assert.deepEqual(stages(g),['ines:1','ines:2']);assert.equal(talks().length,0);
  const state=g.chronicles131.snapshot();state.selected=D.arcs.findIndex(a=>a.id==='grid');g.chronicles131.restore(state);
  const rows=g.chronicles131.overview().rows;
  assert.ok(rows.some(r=>r.label==='Parcours · Inès'&&r.value.includes('2 / 4')));
  assert.deepEqual(rows.filter(r=>r.label.startsWith('Entretien · Inès')).map(r=>r.label),['Entretien · Inès · 1. Rencontre · L’apprentie du dépôt','Entretien · Inès · 2. Trace · La liste d’Émile R.']);
  state.selected=D.arcs.findIndex(a=>a.id==='road');g.chronicles131.restore(state);
  assert.equal(g.chronicles131.overview().rows.some(r=>r.label.startsWith('Entretien · ')),false,'rangé dans le dossier lié seulement');
});

test('arcs : une sauvegarde antérieure se charge sans annonce ; ce qui est déjà vrai est consigné en silence, jamais la nuit passée',()=>{
  const {g,notes,talks}=fresh();assign(g,'lea');assign(g,'malik');
  g.narrative.sectors.housing.survey=SURVEY;g.tier=VILLE;
  const old=g.serialize();delete old.expansions127.modules.lore131.arcs;
  assert.equal(Object.hasOwn(old.expansions127.modules.lore131,'arcs'),false);
  assert.deepEqual(Pack.normalize(old.expansions127.modules.lore131).arcs,[]);
  const stock=copy(g.resources),morale=g.morale;notes.length=0;
  g.restoreSave(copy(old));assert.deepEqual(stages(g),[],'le chargement ne déclenche rien');
  g.tier=VILLE;g.phase='assault';night(g,{lost:['north'],breach:{side:'north',wave:g.wave}});
  g.chronicles131.tick(.04);
  assert.deepEqual(stages(g),['lea:1','lea:2','lea:4','malik:1','malik:4'],'archives sans annonce ; pas d’épreuve rétroactive');
  assert.equal(talks().length,0);assert.deepEqual(copy(g.resources),stock);assert.equal(g.morale,morale);
  // Sauvegarde sans module de chroniques du tout : même règle.
  const older=copy(old);delete older.expansions127.modules.lore131;notes.length=0;
  g.restoreSave(older);assert.deepEqual(stages(g),[]);g.phase='calm';g.chronicles131.tick(.04);assert.equal(talks().length,0);
  assert.equal(stages(g).includes('lea:3'),false);
  // Une fois la reprise passée, un fait nouveau s’annonce normalement.
  g.phase='assault';night(g,{lost:['north']});settle(g);assert.ok(stages(g).includes('lea:3'));assert.equal(talks().length,2);
});

test('arcs : validation stricte du champ additif',()=>{
  const ok=Pack.initial();ok.arcs=['lea:1','lea:3','malik:1'];assert.deepEqual(Pack.normalize(ok).arcs,['lea:1','lea:3','malik:1']);
  assert.deepEqual(Pack.initial().arcs,[]);assert.deepEqual(Pack.normalize(undefined).arcs,[]);
  for(const bad of [['lea:2'],['lea:1','lea:1'],['lea:5'],['luc:1'],['lea:1','samir:4'],'lea:1',null,{},[1],['lea:1',null],Array(17).fill('lea:1')]){
    const s=Pack.initial();s.arcs=bad;assert.throws(()=>Pack.normalize(s),/Chroniques de D-17 invalides/,JSON.stringify(bad));
  }
  const {g}=fresh(),before=g.serialize(),bad=copy(before);bad.expansions127.modules.lore131.arcs=['ines:4'];
  assert.throws(()=>g.restoreSave(bad));const after=g.serialize();delete after.timestamp;delete before.timestamp;assert.deepEqual(after,before);
});

test('arcs : un compagnon mort ne parle plus ; ses entretiens restent au carnet',()=>{
  const {g,notes,talks}=fresh();assign(g,'malik');assign(g,'lea');settle(g);
  const s=g.serialize();s.worldEvolution.companions.find(c=>c.id==='malik').health=0;notes.length=0;g.restoreSave(s);
  g.narrative.sectors.checkpoint.survey=SURVEY;g.narrative.sectors.housing.survey=SURVEY;g.tier=VILLE;g.phase='assault';night(g,{lost:['west']});
  settle(g);settle(g);
  assert.deepEqual(stages(g).filter(id=>id.startsWith('malik')),['malik:1'],'l’arc s’arrête où il en était');
  assert.deepEqual(stages(g).filter(id=>id.startsWith('lea')),['lea:1','lea:2','lea:3','lea:4']);
  assert.equal(talks().some(text=>text.includes('Malik')),false);
  assert.equal(g.worldEvolution.snapshot().companions.find(c=>c.id==='malik').health,0,'aucune résurrection');
  const state=g.chronicles131.snapshot();state.selected=D.arcs.findIndex(a=>a.id==='doors');g.chronicles131.restore(state);
  assert.ok(g.chronicles131.overview().rows.some(r=>r.label==='Entretien · Malik · 1. Rencontre · Réserviste'));
});

test('arcs : avec le vrai module de repli, un mur tombé pendant l’assaut ouvre l’épreuve',()=>{
  const {bootDocument134}=require('../scripts/qa-startup134.cjs'),Fallback=require('../src/fallback-order.js'),T=globalThis.DeadwallTactics||require('../src/tactics.js');
  const {g,doc}=bootDocument134();Fallback.install(g,doc);g.startNew('standard','17117');g.campaignIntro132?.skip?.();
  assert.ok(g.chronicles131&&g.fallbackOrder);
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
  g.population=10;g.resources.food=100;assign(g,'ines');
  const core=g.core(),cells=T.footprint(core),r=3,placed=[];
  const put=(type,gx,gy)=>{const B=core.constructor,b=new B(g.nextId++,type,gx,gy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);placed.push(b);};
  const x0=cells.x-r,x1=cells.x+cells.width+r-1,y0=cells.y-r,y1=cells.y+cells.height+r-1;
  for(let x=x0;x<=x1;x++){put(x===cells.x?'gate':'woodWall',x,y0);put('woodWall',x,y1);}
  for(let y=y0+1;y<y1;y++){put('woodWall',x0,y);put('woodWall',x1,y);}
  g.world.navigationVersion++;g.refreshMetrics(true);
  g.fallbackOrder.tick();g.phase='assault';settle(g);
  assert.deepEqual(stages(g),['ines:1'],'enceinte intacte : pas d’épreuve');
  const north=placed.find(b=>!T.isGate(b)&&b.gy===y0&&b.gx===cells.x+3);
  north.health=0;north.dead=true;g.world.navigationVersion++;g.elapsed+=10;g.fallbackOrder.tick();
  assert.equal(g.fallbackOrder.status().lastBreach.wave,g.wave);
  const stock=copy(g.resources),morale=g.morale;settle(g);
  assert.deepEqual(stages(g),['ines:1','ines:3']);assert.ok(notes.includes('Entretien : Inès — Refaire à l’identique.'));
  assert.deepEqual(copy(g.resources),stock);assert.equal(g.morale,morale);
});

test('arcs : la boucle de jeu réelle ouvre la rencontre, en pause rien ne progresse',()=>{
  const {g,talks}=fresh();assign(g,'samir');
  g.paused=true;for(let i=0;i<40;i++)g.chronicles131.tick(.04);assert.deepEqual(stages(g),[]);
  g.paused=false;for(let i=0;i<20;i++){g.update(.04);g.input.pressed.clear();}
  assert.deepEqual(stages(g),['samir:1']);assert.deepEqual(talks(),['Entretien : Samir — Aide-soignant.']);
});
