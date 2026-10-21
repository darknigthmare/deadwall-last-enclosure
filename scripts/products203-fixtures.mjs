// Explicit QA preparation, not a gameplay shortcut. The browser serializes this
// function, so every dependency must come from the real game's public owners.
export function prepareProductsTool203(){
 const g=globalThis.DEADWALL,C=globalThis.DeadwallCore;
 if(!g?.arsenal134||!C)throw Error('Native arsenal unavailable');
 const before={...g.resources},cost={};let state=g.arsenal134.snapshot();
 let knife=[...state.carried,...state.locker].find(i=>i.id==='knife'&&i.condition>0),crafted=false;
 if(!knife){
  const quote=g.arsenal134.preview('craft','knife');if(!quote.ok)throw Error('Knife preparation refused: '+quote.reason);
  const result=g.arsenal134.begin('craft','knife');if(!result.ok)throw Error(result.reason);
  for(let i=0;i<300&&g.arsenal134.busy();i++)g.arsenal134.step(.1);
  if(g.arsenal134.busy())throw Error('Native knife construction did not finish');
  state=g.arsenal134.snapshot();knife=state.locker.find(i=>i.id==='knife'&&i.condition>0);
  if(!knife)throw Error('Paid knife absent');crafted=true;Object.assign(cost,C.Arsenal134Rules.catalog.knife.cost);
 }
 if(!g.arsenal134.snapshot().carried.some(i=>i.uid===knife.uid)){
  const taken=g.arsenal134.transfer(knife.uid,'carried');if(!taken.ok)throw Error(taken.reason);
 }
 const equipped=g.arsenal134.equip(knife.uid);if(!equipped.ok)throw Error(equipped.reason);
 for(const key of C.RESOURCE_KEYS)if(Math.abs(g.resources[key]-(before[key]-(cost[key]||0)))>1e-8)throw Error('Unexpected knife preparation balance: '+key);
 const final=g.arsenal134.snapshot(),actual=final.carried.find(i=>i.uid===final.equipped);
 if(actual?.uid!==knife.uid||actual.id!=='knife'||actual.condition<=0)throw Error('Working knife is not equipped');
 return{crafted,uid:actual.uid,condition:actual.condition,cost,depotBefore:before,depotAfter:{...g.resources},controllerTimeAdvanced:true};
}
