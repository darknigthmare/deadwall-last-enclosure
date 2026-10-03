'use strict';
const assert=require('node:assert/strict');
// Test setup only: legacy fixtures used to put actors at a building's centre.
// The production engine is never bypassed; the selected exterior point must be physically free.
function standAt(game,actor,target){
 const point=game.fieldcraft.service(actor,target);
 assert.ok(point,'La scène de test doit proposer un accès extérieur.');
 actor.x=point.x;actor.y=point.y;actor.navigation=null;
 assert.ok(game.friendlyPositionClear(actor,actor.x,actor.y));
 return point;
}
module.exports={standAt};
