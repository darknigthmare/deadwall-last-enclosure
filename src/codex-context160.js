/* Physical contracts for exactly the 626 historical programmes excluded in1.59.
 * Only G10 may materialize them; lookup creates no place, stock, service or actor. */
(function(root,factory){'use strict';
 const dependency=(globalName,file)=>root[globalName]||(typeof require==='function'?require(file):null);
 const api=factory(dependency('DeadwallCodexContext160Data','./codex-context160-data.js'),
  dependency('DeadwallCodex3000Runtime','./codex3000-runtime.js'));
 root.DeadwallCodexContext160=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(DATA,R){'use strict';
 if(!DATA||!R)throw Error('Contrats physiques160 ou programmes historiques absents.');
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 const ids=Object.freeze([...DATA.ids]),included=new Set(ids),cache=new Map(),presets=new Map();
 const has=id=>typeof id==='string'&&included.has(id);
 function get(id){
  if(!has(id))return null;if(cache.has(id))return cache.get(id);
  const record=R.get(id),template=R.template(id),profile=DATA.specialParents[record.parent]||null;
  const contextProfile=DATA.contexts[record.module]||null,special=!!profile;
  if(!profile&&!contextProfile)throw Error('Contexte physique160 absent : '+id);
  // Open networks and compound districts keep their actual authored minimum
  // envelope. Existing326 interiors retain the exact historical metric plan.
  const sourceMin=[...template.reference.min],sourceMax=[...template.reference.max],sourceLevels=[...template.reference.levels];
  const w=special?sourceMin[0]:template.w,h=special?sourceMin[1]:template.h,levels=special?sourceLevels:[...template.levels];
  const operationCandidates=[...new Set([...(profile?.geometry?.operationCandidates||[]),...(contextProfile?.operations||[])])];
  const value=freeze({id:record.id,parent:record.parent,name:record.name,family:record.family,module:record.module||null,
   state:record.state||null,original:record.original,generation:10,status:'contract',
   mode:profile?.mode||'building',archetype:profile?.archetype||'legacy-interior',context160:profile?.context160||record.module,
   w,h,levels,entry:[w/2,-1],exit:[w/2,h+1],sourceMin,sourceMax,sourceLevels,
   reference:{min:[...sourceMin],max:[...sourceMax],levels:[...sourceLevels]},
   parentRooms:template.rooms.map(room=>({...room})),profile,contextProfile,operationCandidates,implementation160:profile?.geometry?.implementation160||null,
   abandoned:true,resourcePolicy:'inherit-parent-finite',
   adaptation:{footprint:special?'authored-minimum':'historical-metric-plan',levels:special?'authored-levels':'historical-metric-plan',
    fromHistoricalFootprint:[template.w,template.h],fromHistoricalLevels:[...template.levels],
    footprintChangedFromHistorical:w!==template.w||h!==template.h,
    levelsChangedFromHistorical:levels.length!==template.levels.length||levels.some((z,index)=>z!==template.levels[index]),
    sourceWasAdaptedInHistoricalTemplate:template.adapted}});
  cache.set(id,value);return value;
 }
 function typeFor(id){return has(id)?'codex160-'+id.slice(3):null;}
 function programmeFor(type){return typeof type==='string'&&/^codex160-\d{4}$/.test(type)&&has('DW-'+type.slice(-4))?'DW-'+type.slice(-4):null;}
 function preset(type){
  const id=programmeFor(type);if(!id)return null;if(presets.has(type))return presets.get(type);
  const contract=get(id),value=freeze({id:type,type,name:contract.name,codex:id,layout:'codex160',generation:10,
   w:contract.w,h:contract.h,levels:contract.levels,entry:contract.entry,exit:contract.exit,family:contract.family,
   mode:contract.mode,archetype:contract.archetype,context160:contract.context160,module:contract.module,
   profile:contract.profile,contextProfile:contract.contextProfile,operationCandidates:contract.operationCandidates,implementation160:contract.implementation160,reference:contract.reference});
  presets.set(type,value);return value;
 }
 const records=Object.freeze(ids.map(get));
 function summary(){return Object.freeze({generation:10,programmes:ids.length,specialProgrammes:records.filter(record=>record.profile).length,
  contextualInteriors:records.filter(record=>!record.profile).length,parents:Object.keys(DATA.specialParents).length,contexts:Object.keys(DATA.contexts).length,
  idListSha256:DATA.idListSha256});}
 return Object.freeze({ids,records,has,get,typeFor,programmeFor,preset,summary});
});
