'use strict';
// Explicit historical fixture selection, never a runtime migration or player option.
function pinLegacyRegion(g,generation=5){
 const data=g.serialize(),f=data.frontier;
 if(![4,5].includes(generation)||f.active||f.seen.length||Object.keys(f.taken).length||Object.keys(f.enemies).length)throw Error('Legacy fixture must be selected before regional play.');
 if(f.generation===generation)return g;
 f.generation=generation;f.x=4162;f.y=4096;f.z=0;f.inside=null;f.anchor=null;f.car=null;
 g.restoreSave(data);g.save(false);return g;
}
function selectLegacyStarts(g,generation=5){
 const original=g.startNew.bind(g);g.startNew=(...args)=>{const result=original(...args);if(result!==false&&g.state==='playing')pinLegacyRegion(g,generation);return result;};return g;
}
module.exports={pinLegacyRegion,selectLegacyStarts};
