(function initDeadwallSquads(global) {
  'use strict';
  const C=typeof module!=='undefined'&&module.exports?require('./core.js'):global.DeadwallCore;
  const RULES=C.SQUAD_RULES,validIndex=value=>Number.isInteger(value)&&value>=0&&value<RULES.count;
  const invalid=label=>{throw new RangeError('Sections invalides : '+label+'.');};
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  function point(value){
    if(!object(value)||!Number.isFinite(value.x)||!Number.isFinite(value.y)||value.x< -64||value.y< -64||value.x>C.WORLD_SIZE+64||value.y>C.WORLD_SIZE+64)invalid('ralliement');
    return{x:value.x,y:value.y};
  }
  function create(rally={x:C.WORLD_SIZE/2,y:C.WORLD_SIZE/2}){
    return{version:1,selected:0,groups:Array.from({length:RULES.count},()=>({order:'rally',rally:point(rally)}))};
  }
  function normalize(raw,legacyRally){
    if(raw===undefined)return create(legacyRally);
    if(!object(raw)||raw.version!==1||!validIndex(raw.selected)||!Array.isArray(raw.groups)||raw.groups.length!==RULES.count)invalid('format');
    return{version:1,selected:raw.selected,groups:raw.groups.map(group=>{
      if(!object(group)||!['rally','retreat'].includes(group.order))invalid('ordre');
      return{order:group.order,rally:point(group.rally)};
    })};
  }
  function unitGroup(kind,value){
    if(value===undefined||value===null)return null;
    if(kind!=='soldier'||!validIndex(value))invalid('affectation');
    return value;
  }
  function counts(units){
    const result=Array(RULES.count).fill(0);
    for(const unit of units)if(unit.kind==='soldier'&&!unit.dead&&unit.health>0&&validIndex(unit.squad))result[unit.squad]++;
    return result;
  }
  function nextGroup(units){const totals=counts(units);return totals.indexOf(Math.min(...totals));}
  function assignments(units){
    const totals=counts(units),assigned=new Map();
    // Stable IDs, not array order or campaign RNG, decide ties for legacy saves.
    for(const unit of units.filter(unit=>unit.kind==='soldier'&&!unit.dead&&unit.health>0).slice().sort((a,b)=>a.id-b.id)){
      let squad=unitGroup(unit.kind,unit.squad);
      if(squad===null){squad=totals.indexOf(Math.min(...totals));totals[squad]++;}
      assigned.set(unit.id,squad);
    }
    return assigned;
  }
  function withOrder(state,index,order,rally){
    if(!validIndex(index)||!['rally','retreat'].includes(order))return null;
    const result=normalize(state);
    result.groups[index]={order,rally:order==='rally'?point(rally):result.groups[index].rally};
    return result;
  }
  const api={RULES,validIndex,create,normalize,unitGroup,counts,nextGroup,assignments,withOrder};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.DeadwallSquads=api;
})(typeof globalThis!=='undefined'?globalThis:this);
