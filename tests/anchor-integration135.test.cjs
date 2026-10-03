'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
test('135 : carte, sorties, retour, reprise et campagnes successives partagent le même dépôt régional',()=>{
  const {g,doc}=bootDocument134(),P=globalThis.DeadwallAtlasProjection;
  g.startNew('standard','17117');g.campaignIntro132.skip();require('./helpers/generation141.cjs').legacy(g);
  const first=g.frontier.world(),anchor=first.home;assert.equal(first.generation,6);assert.deepEqual(P.home(g),anchor);
  assert.ok(anchor.minX>8192&&anchor.minY>8192,'Région présente au nord et à l’ouest du dépôt');
  const model=P.model(g);assert.equal(model.bounds.x,anchor.minX);assert.equal(model.bounds.y,anchor.minY);
  g.frontierUI.atlas.draw(g.frontier.overview());g.frontierUI.atlas.city();
  assert.equal(g.frontierUI.atlas.position().x,anchor.x);assert.equal(g.frontierUI.atlas.position().y,anchor.y);
  for(const [side,point]of [['east',{x:4058,y:2048}],['west',{x:38,y:2048}],['north',{x:2048,y:38}],['south',{x:2048,y:4058}]]){
    Object.assign(g.player,point);assert.equal(g.frontier.enter(),true,side+' départ');
    const pos=g.frontier.position(),edge=P.gatesFor(g).find(gate=>gate.id===side);
    assert.ok(Math.hypot(pos.x-edge.x,pos.y-edge.y)<5,'Sortie près de la jonction '+side);
    assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(P.home(g),anchor);
    const saved=g.serialize();saved.frontier.x=edge.x;saved.frontier.y=edge.y;g.restoreSave(saved);
    assert.equal(g.frontier.leave(),true,side+' retour');assert.equal(g.player.regionAbsent,false);
    assert.ok(g.player.x>=0&&g.player.x<=4096&&g.player.y>=0&&g.player.y<=4096);
  }
  g.startNew('standard','84329');g.campaignIntro132.skip();require('./helpers/generation141.cjs').legacy(g);const second=g.frontier.world();
  assert.notDeepEqual(second.home,anchor);assert.deepEqual(P.home(g),second.home);
  g.frontierUI.atlas.draw(g.frontier.overview());g.frontierUI.atlas.city();
  assert.equal(g.frontierUI.atlas.position().x,second.home.x);assert.equal(g.frontierUI.atlas.position().y,second.home.y);
  const east=P.gatesFor(g).find(gate=>gate.id==='east');
  doc.getElementById('atlasGate-east').dispatch('click');
  assert.equal(g.frontierUI.atlas.position().x,east.x);assert.equal(g.frontierUI.atlas.position().y,east.y);
  const records=g.serialize();g.restoreSave(records);assert.deepEqual(P.home(g),second.home);assert.equal(g.frontier.world().seed,84329);
  const historical=g.serialize();historical.frontier.generation=5;historical.frontier.x=4162;historical.frontier.y=4096;
  g.restoreSave(historical);assert.equal(g.frontier.world().generation,5);assert.equal(P.home(g).x,4096);assert.equal(P.home(g).y,4096);
  assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.frontier.world().generation,5,'Une reprise ne reconstruit pas une ancienne campagne en G6');
  g.frontierUI.atlas.draw(g.frontier.overview());g.frontierUI.atlas.city();assert.equal(g.frontierUI.atlas.position().x,4096);assert.equal(g.frontierUI.atlas.position().y,4096);
});
