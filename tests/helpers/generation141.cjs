'use strict';
// Explicit legacy campaign fixture. Fresh campaigns are G8; historical G6/G7
// compatibility stories must exercise their requested geometry and finite stock.
function legacy(g,generation=6){
 const data=g.serialize();if(data.frontier.generation===generation)return;
 if(data.frontier.active||data.frontier.seen.length||Object.keys(data.frontier.taken).length)throw Error('Legacy fixture requires a fresh campaign');
 data.frontier.generation=generation;data.frontier.ecologyVersion=0;data.frontier.hydrologyVersion=0;
 const h=globalThis.DeadwallGeography135.home(data.worldSeed,generation);
 data.frontier.x=h.maxX+2;data.frontier.y=h.y;
 if(data.expansions127?.modules?.lore131)data.expansions127.modules.lore131.siteGeneration=generation;
 g.restoreSave(data);
}
function selectLegacyStarts(g,generation=6){
 if(![6,7].includes(generation))throw Error('Modern legacy fixture requires G6 or G7');
 const original=g.startNew.bind(g);
 g.startNew=(...args)=>{const result=original(...args);if(result!==false&&g.state==='playing'){legacy(g,generation);g.save(false);}return result;};
 return g;
}
module.exports={legacy,selectLegacyStarts};
