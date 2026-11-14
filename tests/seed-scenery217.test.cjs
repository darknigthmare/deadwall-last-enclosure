'use strict';
// Graines impraticables (docs/GAME_BIBLE.md §11.2, §11.4) : la cause est traitée dans
// packMetricScenery202. Une carte saturée ne lance plus « Décor métrique sans parcelle libre » :
// la seule pièce restée sans parcelle reçoit un dégagement réduit (C.Scenery217Rules).
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),E=require('../src/exploration-125.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
// Trois graines relevées par la CI, une quatrième trouvée en balayant 300 graines ; identifiant,
// nature et corps (en unités) de la pièce qui restait sans parcelle.
const UNFIT=[['3033422227',443,'ruinedHouse',320,256],['139741324',440,'ruinedHouse',320,256],['4075956896',457,'ruinedHouse',320,256],['1168806633',469,'warehouseShell',384,320]];
const SHELLS=['ruinedHouse','ruinedShop','warehouseShell'];
const current=(g,seed)=>g.startNew('standard',seed,'classic','classic',true);
const rows=g=>g.world.nodes.map(n=>[n.id,n.type,n.sceneryKind||'',n.x,n.y,n.amount,n.depleted?1:0]);
const print=g=>crypto.createHash('sha256').update(JSON.stringify(rows(g))).digest('hex');
const padded=(b,m)=>({x:b.x-m,y:b.y-m,w:b.w+m*2,h:b.h+m*2});
// Enveloppe réellement peinte (toit et façade), mesurée sans passer par le code de placement.
function survey(g){
  const plan=g.exploration125.plan,u=C.TILE,scenery=g.world.nodes.filter(n=>n.sceneryKind);
  const ordinary=n=>{const b=g.fieldcraft.reserveRect(n);return{x:b.l,y:b.t,w:b.r-b.l,h:b.b-b.t};};
  const envelope=n=>{const q=ordinary(n);if(!SHELLS.includes(n.sceneryKind))return q;const p=C.CityGeometry202.presentation,o=p.roofOverhangMetres*u,h=p.storeyHeightMetres*p.projectedHeightUnitsPerMetre;return{x:q.x-o,y:q.y-h-o,w:q.w+o*2,h:q.h+h+o*2};};
  const settlements=plan.settlements.flatMap(s=>s.buildings).map(b=>{const q=E.buildingProjection134(b),o=q.roofOverhang;return{x:q.l-o,y:q.roofTop-o,w:b.w+o*2,h:q.b-q.roofTop+o*2};});
  const fixtures=[...[...g.world.buildings.values()].filter(b=>!b.dead).map(ordinary),...g.expeditions.sites().map(s=>ordinary({...s,renderSize:90})),...g.dayworks.snapshot().sites.map(s=>ordinary({...s,renderSize:50})),...g.world.sites.map(s=>ordinary({...s,renderSize:96})),...plan.buildExclusions.filter(b=>b.kind!=='settlement-reserve'),...settlements,...plan.buildableDistricts202,...E.physicalSolids134(plan)];
  const free=(n,margin)=>{const box=envelope(n);return !E.roadFootprint202(plan,box,margin)&&![...fixtures,...scenery.filter(o=>o!==n).map(envelope)].some(o=>E.rectsOverlap(o,padded(box,margin)));};
  const inside=n=>{const b=envelope(n);return b.x>=38&&b.y>=38&&b.x+b.w<=plan.worldSize-38&&b.y+b.h<=plan.worldSize-38;};
  return {plan,scenery,free,inside,u};
}

test('217 règles du repli : paliers décroissants, jamais plus larges que le mètre déclaré, jamais négatifs',()=>{
  const tiers=C.Scenery217Rules.fallbackClearanceMetres;
  assert.ok(Object.isFrozen(C.Scenery217Rules)&&Object.isFrozen(tiers));
  assert.deepEqual([...tiers],[1,.5,0]);
  assert.equal(tiers[0],C.CityGeometry202.localParcels.clearanceMetres,'le premier palier garde le mètre entier');
  for(let i=1;i<tiers.length;i++)assert.ok(tiers[i]<tiers[i-1]&&tiers[i]>=0);
});

test('217 les graines relevées démarrent avec leur graine, sans reprise de carte',{timeout:900000},()=>{
  const {g}=bootDocument134();assert.ok(g.mapRecovery216,'le filet de sécurité reste chargé');
  let drawn=0;const draw=g.freshMapSeed.bind(g);g.freshMapSeed=()=>{drawn++;return draw();};
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
  for(const [seed,failedId,kind,w,h] of UNFIT){
    notes.length=0;
    assert.notEqual(current(g,seed),false);g.campaignIntro132?.skip?.();
    assert.equal(g.state,'playing');assert.equal(g.world.seed,Number(seed),'la carte porte la graine demandée');
    assert.equal(g.mapRecovery216.last(),null,'aucune reprise');assert.equal(drawn,0,'aucune autre graine tirée');
    assert.equal(notes.some(text=>text.includes('ne pouvait pas accueillir')),false);
    // Aucun gisement perdu : mêmes identités et même stock nominal que le tirage brut de la carte.
    const {plan,scenery,free,inside,u}=survey(g),source=new g.world.constructor(g.world.seed,1).nodes.filter(n=>n.sceneryKind);
    assert.equal(scenery.length,48);
    assert.deepEqual(scenery.map(n=>[n.id,n.type,n.sceneryKind,n.siteId,n.amount,n.maxAmount,n.depleted]),source.map(n=>[n.id,n.type,n.sceneryKind,n.siteId,n.amount,n.amount,false]));
    // Interdits stricts conservés : monde, chaussées, bâtis, épaves et autres pièces, sans recouvrement.
    let under=0;
    for(const n of scenery){
      assert.equal(inside(n),true,`graine ${seed} : ${n.id} sort du secteur`);
      assert.equal(free(n,0),true,`graine ${seed} : ${n.id}/${n.sceneryKind} recouvre une chaussée, un bâti ou une autre pièce`);
      assert.equal(free(n,u/2),true,`graine ${seed} : ${n.id}/${n.sceneryKind} garde au moins un demi-mètre`);
      if(!free(n,u)){under++;assert.ok(SHELLS.includes(n.sceneryKind),'seules les grandes ruines et leurs voisines sont concernées');}
    }
    assert.ok(under>0,`graine ${seed} : carte saturée, le repli a bien servi`);assert.ok(under<=8,`graine ${seed} : le dégagement réduit reste l’exception (${under})`);
    const failed=scenery.find(n=>n.id===failedId);assert.equal(failed.sceneryKind,kind);assert.deepEqual(failed.body202,{w,h});
    const access=g.fieldcraft.service(g.player,failed);assert.ok(access,'la pièce replacée se fouille depuis un point d’appui réel');
    for(const actor of [g.player,...g.units])assert.equal(g.friendlyPositionClear(actor,actor.x,actor.y),true,`graine ${seed} : ${actor.id} enfermé`);
    assert.equal(plan.seed,Number(seed));
    // Sauvegarde, reprise et synchronisation tardive : les coordonnées retenues font autorité.
    const before=rows(g),runId=g.runId;
    assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);g.campaignIntro132?.skip?.();
    assert.equal(g.runId,runId);assert.deepEqual(rows(g),before,`graine ${seed} : Continuer a déplacé le décor`);
    g.exploration125.syncPlan();assert.deepEqual(rows(g),before);
    // Recette de carte rejouée : même graine, même décor, toujours sans reprise.
    if(seed===UNFIT[0][0]){
      assert.notEqual(g.replayCurrentMap(),false);g.campaignIntro132?.skip?.();
      assert.equal(g.world.seed,Number(seed));assert.deepEqual(rows(g),before,'la recette rejouée redonne la même carte');
      assert.equal(g.mapRecovery216.last(),null);assert.equal(drawn,0);
    }
  }
});

// Empreintes relevées AVANT le correctif (commit 19a67c53), module de reprise absent ou non.
// 17117 : placement direct. 967313470 et 1947648717 : cartes qui passaient déjà par la disposition
// compacte de la branche d'échec, celle que le correctif prolonge.
const FROZEN={
  '17117':[469,'db847f5c6cbc3551e8c076274faf68abe732e862bddf52a190f3431862edcd63'],
  '967313470':[482,'0fe092f888f40cb7cc292c11d7b4f29309bce5b9a016fa527b172514e1914385'],
  '1947648717':[493,'b6eacf8f8f7c25f61c984a4597d0583f75798e48006047822bd5f67b92b433c6']
};
test('217 une graine saine garde son décor au bit près, et son mètre de dégagement',{timeout:600000},()=>{
  const {g}=bootDocument134();
  for(const [seed,[count,hash]] of Object.entries(FROZEN)){
    assert.notEqual(current(g,seed),false);
    assert.equal(g.world.nodes.length,count);assert.equal(print(g),hash,`graine ${seed} : le décor a changé`);
    assert.equal(g.mapRecovery216.last(),null);
    const {scenery,free,u}=survey(g);
    for(const n of scenery)assert.equal(free(n,u),true,`graine ${seed} : ${n.id} a perdu son mètre de dégagement`);
  }
});
