'use strict';
// Explicit legacy campaign fixture. Fresh campaigns are G7; historical G6
// compatibility stories must continue exercising G6 instead of silently moving.
function legacy(g,generation=6){
 const data=g.serialize();if(data.frontier.generation===generation)return;
 if(data.frontier.active||data.frontier.seen.length||Object.keys(data.frontier.taken).length)throw Error('Legacy fixture requires a fresh campaign');
 data.frontier.generation=generation;
 const h=globalThis.DeadwallGeography135.home(data.worldSeed,generation);
 data.frontier.x=h.maxX+2;data.frontier.y=h.y;
 if(data.expansions127?.modules?.lore131)data.expansions127.modules.lore131.siteGeneration=generation;
 g.restoreSave(data);
}
module.exports={legacy};
