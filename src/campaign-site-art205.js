/* Original campaign furniture for explicitly versioned authored sites.
 * Pictures never create stock, power, services, colliders or saved state. */
(function(root,factory){
 'use strict';const api=factory(root);root.DeadwallCampaignSiteArt205=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const SPECIALISED_KINDS=Object.freeze(['singleBunk','feedTrough','waterTrough','fodderRack','milkingUnit','milkVat','nestBox','wineVat','wineBarrel','grapePress','veterinaryTable','growingBench','growingBed','conveyor','dosingUnit','foodMixer','heatChamber','metalSaw','lathe','millingMachine','assemblyStation','inspectionBench','loom','sewingStation','cuttingTable','materialMixer','formingPress','curingRack']);
 const specialised=new Set(SPECIALISED_KINDS);
 const STRUCTURAL_KINDS=Object.freeze(['fence','garden-shed','rain-barrel','compost-bin','touring-caravan','abandoned-caravan','closed-pool']);
 const structural=new Set(STRUCTURAL_KINDS);
 const AREA_KINDS=Object.freeze(['vegetable-garden','flower-garden','gravel-garden','herb-garden','meadow-garden','communal-garden','terrace','parking','court']);
 const PALETTES=Object.freeze([
  Object.freeze({wood:'#947658',grain:'#b59a73',metal:'#78857c',edge:'#aab3a5',dark:'#33453c',cloth:'#a9b59d',paper:'#d7d0b5',water:'#507b81',rust:'#976c54',green:'#687f51'}),
  Object.freeze({wood:'#817361',grain:'#b3a389',metal:'#718588',edge:'#b1beb6',dark:'#34434a',cloth:'#a3b5b4',paper:'#d1d3c0',water:'#567e92',rust:'#a68a60',green:'#687b58'}),
  Object.freeze({wood:'#a08a65',grain:'#c2b18b',metal:'#858677',edge:'#bbc0ab',dark:'#494b3b',cloth:'#b6a88d',paper:'#ded6b9',water:'#638a86',rust:'#8e6051',green:'#77814e'})
 ]);
 const dependency=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 function catalogue(){return dependency('DeadwallCodexFurnishings2026','./codex-furnishings2026.js')?.CATALOGUE||{};}
 function routeFor(kind){
  if(structural.has(kind))return 'structural205';
  if(typeof kind!=='string'||!Object.hasOwn(catalogue(),kind))return null;
  if(specialised.has(kind))return 'procedural205';
  const interior=dependency('DeadwallInteriorArt153','./interior-art153.js');
  if(Object.hasOwn(interior?.FURNITURE||{},kind))return 'atlas153';
  return dependency('DeadwallSeedDetailArt157','./seed-detail-art157.js')?.presentationFor(kind)?'detail157':null;
 }
 function variantFor(prop,{seed=0,floor=0,variant,count=3}={}){
  if(!Number.isSafeInteger(count)||count<1)return 0;
  if(Number.isSafeInteger(variant))return ((variant%count)+count)%count;
  let h=(Number.isFinite(seed)?seed>>>0:0)^2166136261;
  for(const ch of String(prop?.id??'')+':'+String(prop?.kind??'')+':'+floor)h=Math.imul(h^ch.charCodeAt(0),16777619);
  return (h>>>0)%count;
 }
 function frameFor(prop){
  if(!prop||prop.campaign205!==true||typeof prop.id!=='string'||!prop.id||!routeFor(prop.kind)||
   ![prop.x,prop.y,prop.w,prop.h,prop.x+prop.w,prop.y+prop.h].every(Number.isFinite)||prop.w<=0||prop.h<=0)return null;
  if(structural.has(prop.kind)&&prop.campaign205Structural!==true)return null;
  const angle=prop.rotationRad??0,turns=angle/(Math.PI/2),nearest=Math.round(turns);
  if(!Number.isFinite(angle)||!Number.isSafeInteger(nearest)||Math.abs(turns-nearest)>1e-8)return null;
  const turn=((nearest%4)+4)%4;
  return {turn,w:turn%2?prop.h:prop.w,h:turn%2?prop.w:prop.h};
 }
 function tools(c,p){
  const fill=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const box=(x,y,w,h,color=p.dark,width=.025)=>{c.strokeStyle=color;c.lineWidth=width;c.strokeRect(x,y,w,h);};
  const line=(points,color=p.dark,width=.025)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  const oval=(x,y,rx,ry,color,edge=false)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();if(edge){c.strokeStyle=p.dark;c.lineWidth=.02;c.stroke();}};
  const polygon=(points,color,edge=false)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(edge){c.strokeStyle=p.dark;c.lineWidth=.02;c.stroke();}};
  const bolt=(x,y)=>oval(x,y,.018,.018,p.dark);
  const feet=()=>{for(const x of [.12,.79])for(const y of [.13,.79])fill(x,y,.09,.08,p.dark);};
  const slats=(vertical,count,color=p.grain)=>{for(let i=0;i<count;i++){const t=.15+i*.7/Math.max(1,count-1);line(vertical?[[t,.18],[t,.82]]:[[.15,t],[.85,t]],color,.025);}};
  const panel=(x,y,w,h)=>{fill(x,y,w,h,p.metal);box(x,y,w,h);line([[x+.04,y+.045],[x+w-.04,y+.045]],p.edge,.025);};
  return {fill,box,line,oval,polygon,bolt,feet,slats,panel};
 }
 function specialisedProp(c,kind,v,p){
  const {fill,box,line,oval,polygon,bolt,feet,slats,panel}=tools(c,p);
  // These are unpowered, unattended objects. No timer or decorative movement
  // may suggest that a disconnected appliance is operating.
  switch(kind){
   case 'singleBunk':{
    feet();fill(.08,.10,.84,.79,p.metal);fill(.13,.15,.74,.68,p.cloth);
    // The two-metre axis is the sleeping length; the pillow belongs at its
    // short end, even when the final campaign footprint is quarter-turned.
    fill(v===1?.70:.14,.19,.16,.60,p.paper);
    line([[.10,.12],[.10,.87]],p.edge,.045);line([[.90,.12],[.90,.87]],p.edge,.045);
    if(v<2){const y=v===1?.03:.77;for(const x of [.43,.70])line([[x,y],[x,y+.20]],p.dark,.025);for(const dy of [.035,.10,.17])line([[.41,y+dy],[.72,y+dy]],p.edge,.025);}
    else{for(const x of [.83,.97])line([[x,.31],[x,.70]],p.dark,.025);for(const y of [.35,.48,.63])line([[.82,y],[.98,y]],p.edge,.025);fill(.49,.17,.045,.64,p.rust);}break;
   }
   case 'feedTrough':case 'waterTrough':{
    feet();const wet=kind==='waterTrough';
    if(v===0){polygon([[.06,.25],[.16,.13],[.86,.13],[.95,.25],[.88,.86],[.12,.86]],p.metal,true);fill(.16,.25,.68,.48,wet?p.water:p.grain);}
    else if(v===1){panel(.07,.15,.86,.69);for(const x of [.12,.54]){fill(x,.23,.34,.51,wet?p.water:p.grain);box(x,.23,.34,.51,p.edge,.035);}}
    else{oval(.5,.51,.45,.38,p.metal,true);oval(.5,.51,.37,.28,wet?p.water:p.grain);fill(.07,.36,.15,.27,p.dark);fill(.09,.39,.11,.21,p.edge);}
    if(wet){line([[.29,.45],[.65,.45]],p.edge,.018);fill(v===2?.12:.82,.19,.07,.10,p.edge);}
    else{for(let i=0;i<7;i++)line([[.22+i*.085,.38],[.27+i*.085,.59]],p.wood,.016);}break;
   }
   case 'fodderRack':{
    fill(.10,.14,.80,.72,p.grain);box(.07,.11,.86,.78,p.wood,.065);
    for(let i=0;i<7;i++){const x=.15+i*.11;line([[x,.23],[Math.min(.86,x+.07),.76]],p.green,.025);}
    if(v===0)slats(true,6,p.wood);
    else if(v===1){for(let i=0;i<5;i++)line([[.13+i*.15,.13],[.27+i*.15,.87]],p.wood,.055);line([[.1,.51],[.9,.51]],p.wood,.045);}
    else{for(const y of [.20,.47,.74])line([[.08,y],[.92,y]],p.wood,.055);line([[.12,.13],[.88,.87]],p.metal,.04);line([[.88,.13],[.12,.87]],p.metal,.04);}break;
   }
   case 'milkingUnit':{
    feet();panel(.07,.11,.86,.77);
    const xs=v===0?[.38]:v===1?[.28,.68]:[.6];
    for(const x of xs){oval(x,.51,v===1?.16:.23,.28,p.edge,true);oval(x,.32,.07,.055,p.metal);line([[x,.26],[x,.17],[.86,.17],[.86,.7]],p.dark,.035);}
    const at=v===2?.2:.82;for(let i=0;i<4;i++){fill(at-.055+i*.027,.63,.019,.18,p.dark);oval(at-.044+i*.027,.64,.013,.02,p.edge);}
    if(v===2){fill(.12,.20,.18,.28,p.paper);box(.12,.20,.18,.28);line([[.13,.81],[.82,.81]],p.rust,.045);}break;
   }
   case 'milkVat':case 'wineVat':{
    const wine=kind==='wineVat';feet();
    if(v===0){oval(.5,.52,.43,.37,p.metal,true);oval(.5,.49,.36,.29,p.edge);oval(.5,.47,.12,.10,wine?p.wood:p.paper,true);line([[.15,.65],[.85,.65]],p.dark,.035);}
    else if(v===1){panel(.11,.16,.78,.68);oval(.5,.5,.31,.28,p.edge,true);fill(.20,.18,.6,.07,p.dark);oval(.5,.48,.09,.08,wine?p.wood:p.paper);for(const x of [.18,.82])bolt(x,.77);}
    else{polygon([[.19,.16],[.77,.16],[.91,.34],[.91,.69],[.73,.85],[.23,.85],[.09,.66],[.09,.33]],p.edge,true);oval(.5,.5,.24,.23,p.metal,true);line([[.27,.23],[.73,.77]],p.dark,.04);oval(.5,.5,.08,.08,wine?p.wood:p.paper);}
    line([[.49,.85],[.49,.94],[.70,.94]],p.dark,.05);fill(.63,.91,.12,.055,p.rust);break;
   }
   case 'nestBox':{
    fill(.07,.11,.86,.77,p.wood);box(.07,.11,.86,.77,p.dark,.04);
    const count=v===0?3:v===1?2:4;
    for(let i=0;i<count;i++){const x=.10+i*.82/count,w=.76/count;fill(x,.22,w,.52,p.dark);oval(x+w/2,.53,w*.37,.19,p.grain);oval(x+w*.45,.54,.027,.048,p.paper);if(v===2)fill(x,.13,w,.08,p.grain);}
    if(v===1){line([[.1,.15],[.89,.15]],p.metal,.05);line([[.1,.84],[.89,.84]],p.grain,.05);}else line([[.1,.79],[.89,.79]],p.grain,.045);break;
   }
   case 'wineBarrel':{
    oval(.5,.5,v===1?.38:.43,v===1?.46:.40,p.wood,true);
    if(v===0){for(let i=0;i<6;i++)line([[.22+i*.11,.21],[.22+i*.11,.79]],p.grain,.022);for(const y of [.27,.72])line([[.16,y],[.84,y]],p.metal,.065);}
    else if(v===1){for(const x of [.30,.69])line([[x,.12],[x,.88]],p.metal,.06);for(let i=0;i<5;i++)line([[.18,.25+i*.12],[.82,.25+i*.12]],p.grain,.02);oval(.52,.51,.06,.055,p.dark);}
    else{oval(.5,.5,.33,.29,p.grain,true);for(const y of [.34,.48,.62])line([[.24,y],[.76,y]],p.wood,.025);oval(.58,.44,.05,.055,p.dark);for(const x of [.24,.76])bolt(x,.5);}break;
   }
   case 'grapePress':{
    feet();panel(.08,.11,.84,.77);oval(.5,.55,.3,.26,p.wood,true);
    const count=v===2?7:5;for(let i=0;i<count;i++){const x=.25+i*.5/(count-1);line([[x,.39],[x,.72]],p.grain,.035);}
    if(v===0){for(const x of [.15,.80])fill(x,.18,.055,.61,p.dark);line([[.15,.22],[.85,.22]],p.wood,.08);line([[.5,.1],[.5,.59]],p.metal,.055);line([[.30,.12],[.70,.12]],p.dark,.045);}
    else if(v===1){for(const x of [.12,.83])fill(x,.14,.05,.70,p.wood);fill(.11,.15,.78,.12,p.metal);fill(.43,.26,.14,.22,p.edge);line([[.22,.11],[.80,.37]],p.dark,.045);}
    else{polygon([[.17,.19],[.29,.10],[.79,.10],[.87,.21],[.76,.28],[.27,.28]],p.wood,true);fill(.46,.20,.08,.35,p.dark);line([[.21,.21],[.79,.21]],p.edge,.03);line([[.17,.78],[.83,.78]],p.metal,.05);}break;
   }
   case 'veterinaryTable':{
    feet();panel(.07,.12,.86,.75);fill(.12,.19,.76,.59,p.paper);
    if(v===0){for(const x of [.31,.67]){fill(x,.17,.045,.64,p.cloth);fill(x-.018,.46,.081,.08,p.metal);}fill(.15,.21,.17,.14,p.cloth);}
    else if(v===1){line([[.13,.24],[.87,.24]],p.dark,.04);line([[.13,.72],[.87,.72]],p.dark,.04);fill(.19,.32,.25,.31,p.cloth);fill(.72,.30,.09,.37,p.edge);}
    else{fill(.16,.25,.59,.44,p.cloth);box(.16,.25,.59,.44,p.edge,.04);line([[.23,.30],[.67,.63]],p.paper,.025);fill(.79,.23,.065,.5,p.dark);for(const y of [.31,.54])bolt(.82,y);}break;
   }
   case 'growingBench':case 'growingBed':{
    const raised=kind==='growingBench';if(raised)feet();fill(.08,.13,.84,.74,p.wood);box(.08,.13,.84,.74,raised?p.metal:p.grain,.055);fill(.13,.20,.74,.59,p.dark);
    if(v===0){for(let row=0;row<3;row++)for(let col=0;col<4;col++){const x=.22+col*.18,y=.29+row*.19;oval(x-.02,y,.05,.055,p.green);oval(x+.025,y+.025,.045,.047,p.cloth);}}
    else if(v===1){for(const x of [.18,.56]){fill(x,.24,.26,.50,p.wood);for(let i=0;i<4;i++){line([[x+.04,.29+i*.12],[x+.22,.29+i*.12]],p.grain,.025);oval(x+.13,.31+i*.12,.05,.035,p.green);}}}
    else{for(let i=0;i<4;i++){const y=.25+i*.15;line([[.17,y],[.83,y]],p.grain,.02);for(const x of [.24,.48,.72])polygon([[x,y-.03],[x-.045,y+.04],[x+.045,y+.04]],p.green);}}
    if(raised){for(const x of [.11,.88])line([[x,.13],[x,.87]],p.edge,.03);}else for(const y of [.15,.84])line([[.12,y],[.88,y]],p.grain,.025);break;
   }
   case 'conveyor':{
    feet();panel(.06,.14,.88,.72);fill(.12,.23,.76,.54,p.dark);
    if(v===0){for(let i=0;i<7;i++){const x=.16+i*.11;fill(x,.25,.055,.50,p.metal);line([[x+.015,.26],[x+.015,.73]],p.edge,.018);}}
    else if(v===1){fill(.13,.27,.74,.46,p.cloth);for(let i=0;i<5;i++)line([[.18+i*.15,.28],[.18+i*.15,.72]],p.dark,.025);oval(.13,.50,.04,.20,p.metal);oval(.87,.50,.04,.20,p.metal);}
    else{for(let i=0;i<6;i++){const x=.14+i*.125;polygon([[x,.26],[x+.09,.26],[x+.12,.50],[x+.09,.74],[x,.74],[x+.025,.50]],p.metal);}}
    for(const y of [.17,.82])line([[.08,y],[.92,y]],p.edge,.03);break;
   }
   case 'dosingUnit':{
    feet();panel(.08,.11,.84,.77);
    if(v===0){polygon([[.15,.18],[.67,.18],[.61,.49],[.42,.62],[.23,.48]],p.edge,true);fill(.37,.52,.12,.23,p.dark);fill(.64,.39,.19,.36,p.rust);}
    else if(v===1){for(const x of [.17,.57]){oval(x+.12,.31,.16,.16,p.edge,true);polygon([[x,.32],[x+.24,.32],[x+.17,.57],[x+.08,.57]],p.metal);}line([[.30,.57],[.30,.75],[.70,.75],[.70,.57]],p.dark,.055);}
    else{fill(.15,.19,.23,.58,p.dark);panel(.42,.16,.39,.30);polygon([[.44,.46],[.79,.46],[.69,.65],[.54,.65]],p.edge,true);fill(.57,.65,.10,.13,p.rust);line([[.17,.32],[.34,.32]],p.edge,.04);}break;
   }
   case 'foodMixer':case 'materialMixer':{
    feet();const food=kind==='foodMixer';panel(.08,.11,.84,.77);
    const cx=v===0?.38:v===1?.62:.5,cy=v===2?.58:.50;oval(cx,cy,.27,.29,food?p.edge:p.wood,true);oval(cx,cy,.20,.22,p.dark);
    if(v===0){fill(.72,.19,.13,.54,p.metal);line([[.77,.24],[cx,.24],[cx,cy]],p.edge,.07);}
    else if(v===1){fill(.13,.18,.15,.59,p.metal);line([[.20,.23],[cx,.23],[cx,cy]],p.edge,.065);line([[cx-.1,cy+.12],[cx+.12,cy-.1]],food?p.metal:p.rust,.04);}
    else{for(const x of [.18,.76])fill(x,.18,.06,.59,p.metal);line([[.18,.22],[.82,.22]],p.edge,.08);line([[cx,.22],[cx,cy+.13]],p.metal,.05);line([[cx-.13,cy],[cx+.13,cy]],food?p.edge:p.rust,.04);}
    if(!food){for(let i=0;i<4;i++)oval(cx-.12+i*.08,cy+.07,.027,.025,p.grain);fill(.08,.77,.16,.08,p.rust);}break;
   }
   case 'heatChamber':{
    feet();panel(.08,.11,.84,.77);fill(.15,.19,.70,.59,p.paper);box(.15,.19,.70,.59,p.metal,.06);
    if(v===0){fill(.23,.28,.54,.40,p.dark);line([[.28,.34],[.72,.34]],p.rust,.04);line([[.28,.59],[.72,.59]],p.rust,.04);fill(.72,.40,.05,.15,p.edge);}
    else if(v===1){for(const x of [.23,.60]){fill(x,.25,.18,.46,p.dark);fill(x+.05,.41,.08,.05,p.rust);}line([[.5,.21],[.5,.76]],p.metal,.045);}
    else{polygon([[.25,.24],[.74,.24],[.82,.37],[.74,.70],[.25,.70],[.17,.37]],p.dark,true);line([[.26,.45],[.74,.45]],p.edge,.055);for(const x of [.29,.68])bolt(x,.31);fill(.39,.61,.23,.035,p.rust);}break;
   }
   case 'metalSaw':{
    feet();panel(.08,.13,.84,.73);fill(.16,.26,.69,.48,p.edge);
    if(v===0){oval(.37,.48,.19,.22,p.dark,true);line([[.23,.32],[.51,.64]],p.edge,.025);fill(.63,.20,.11,.51,p.metal);line([[.20,.76],[.82,.76]],p.rust,.035);}
    else if(v===1){fill(.17,.19,.15,.58,p.dark);line([[.24,.22],[.75,.22],[.75,.49]],p.metal,.10);oval(.63,.48,.16,.20,p.dark,true);fill(.46,.65,.36,.09,p.rust);}
    else{panel(.13,.16,.20,.66);oval(.24,.31,.085,.10,p.edge,true);oval(.24,.66,.085,.10,p.edge,true);line([[.28,.28],[.28,.69]],p.dark,.025);line([[.20,.49],[.83,.49]],p.rust,.04);fill(.39,.61,.42,.09,p.metal);}break;
   }
   case 'lathe':{
    feet();panel(.07,.13,.86,.73);fill(.17,.35,.67,.36,p.dark);const reverse=v===1;
    const head=reverse?.70:.15;panel(head,.22,.15,.50);oval(head+.075,.46,.08,.15,p.edge,true);
    line([[.29,.47],[.74,.47]],p.edge,.10);line([[.29,.63],[.75,.63]],p.metal,.04);
    if(v===2){panel(.48,.56,.17,.21);oval(.56,.69,.04,.05,p.dark);fill(.43,.25,.12,.15,p.rust);}
    else{const x=reverse?.35:.62;panel(x,.55,.14,.22);oval(x+.07,.70,.035,.045,p.dark);fill(reverse?.16:.78,.35,.07,.22,p.rust);}break;
   }
   case 'millingMachine':{
    feet();panel(.08,.12,.84,.76);fill(.19,.58,.62,.19,p.edge);slats(false,3,p.metal);
    if(v===0){fill(.15,.19,.19,.48,p.dark);panel(.21,.19,.58,.15);fill(.61,.32,.07,.28,p.metal);oval(.65,.56,.04,.04,p.dark);}
    else if(v===1){for(const x of [.16,.76])fill(x,.20,.08,.53,p.dark);panel(.17,.22,.65,.14);fill(.45,.36,.10,.23,p.metal);oval(.50,.57,.05,.045,p.dark);}
    else{panel(.65,.18,.18,.53);fill(.25,.24,.45,.14,p.dark);fill(.28,.37,.08,.25,p.metal);oval(.32,.58,.05,.05,p.rust);fill(.18,.74,.57,.04,p.dark);}break;
   }
   case 'assemblyStation':case 'inspectionBench':case 'cuttingTable':{
    feet();const assembly=kind==='assemblyStation',inspection=kind==='inspectionBench';fill(.07,.14,.86,.71,assembly?p.wood:p.edge);box(.07,.14,.86,.71,p.dark,.035);
    if(assembly){
     if(v===0){panel(.13,.18,.22,.22);fill(.48,.28,.32,.37,p.dark);for(let i=0;i<3;i++)fill(.17+i*.22,.72,.13,.06,p.rust);}
     else if(v===1){panel(.69,.20,.17,.26);for(const x of [.15,.36]){fill(x,.29,.15,.32,p.metal);bolt(x+.075,.45);}line([[.16,.73],[.61,.73]],p.edge,.04);}
     else{panel(.16,.20,.68,.14);fill(.28,.45,.43,.26,p.metal);line([[.2,.68],[.8,.41]],p.rust,.04);for(const x of [.15,.82])bolt(x,.76);}
    }else if(inspection){
     if(v===0){panel(.13,.20,.22,.42);oval(.65,.47,.18,.21,p.paper,true);line([[.65,.27],[.65,.47],[.76,.52]],p.dark,.025);}
     else if(v===1){for(const x of [.27,.66]){oval(x,.40,.14,.16,p.paper,true);line([[x,.40],[x+.05,.31]],p.rust,.022);}panel(.24,.65,.54,.10);}
     else{fill(.17,.24,.45,.43,p.dark);for(let i=0;i<4;i++)line([[.23,.3+i*.09],[.56,.3+i*.09]],p.edge,.016);panel(.71,.23,.13,.49);oval(.77,.42,.045,.065,p.paper);}
    }else{
     fill(.13,.21,.74,.54,v===1?p.cloth:p.green);
     if(v===0){for(let i=0;i<5;i++)line([[.21+i*.14,.24],[.21+i*.14,.73]],p.edge,.012);for(let i=0;i<4;i++)line([[.16,.29+i*.13],[.84,.29+i*.13]],p.edge,.012);}
     else if(v===1){polygon([[.19,.29],[.48,.24],[.76,.45],[.67,.66],[.24,.64]],p.paper,true);line([[.33,.3],[.63,.60]],p.metal,.015);}
     else{fill(.17,.26,.35,.43,p.paper);line([[.56,.25],[.83,.69]],p.dark,.02);line([[.58,.70],[.82,.26]],p.dark,.02);oval(.70,.49,.045,.065,p.rust);}
     fill(.12,.79,.72,.035,p.paper);
    }break;
   }
   case 'loom':{
    feet();fill(.08,.11,.84,.77,p.wood);box(.08,.11,.84,.77,p.dark,.045);fill(.17,.21,.66,.57,p.cloth);
    const vertical=v!==1;slats(vertical,v===2?8:6,p.paper);slats(!vertical,5,p.wood);
    if(v===0){for(const x of [.11,.84])fill(x,.16,.045,.64,p.metal);line([[.18,.56],[.82,.40]],p.rust,.05);}
    else if(v===1){for(const y of [.15,.81])line([[.10,y],[.90,y]],p.metal,.06);fill(.39,.33,.11,.35,p.rust);}
    else{line([[.12,.18],[.88,.82]],p.metal,.045);fill(.19,.72,.63,.065,p.rust);}break;
   }
   case 'sewingStation':{
    feet();fill(.07,.14,.86,.71,p.wood);box(.07,.14,.86,.71,p.dark,.035);fill(v===1?.17:.55,.51,.28,.22,p.paper);
    if(v===0){panel(.19,.27,.45,.29);fill(.53,.40,.10,.23,p.dark);oval(.24,.40,.065,.11,p.edge,true);line([[.57,.58],[.57,.72]],p.metal,.018);}
    else if(v===1){panel(.39,.25,.42,.31);fill(.40,.39,.10,.23,p.dark);oval(.75,.40,.065,.10,p.edge,true);line([[.45,.59],[.45,.74]],p.metal,.018);}
    else{panel(.29,.23,.43,.34);fill(.53,.43,.12,.20,p.dark);oval(.34,.40,.07,.11,p.rust,true);line([[.59,.60],[.59,.75]],p.metal,.018);fill(.16,.22,.065,.17,p.cloth);line([[.19,.23],[.51,.25]],p.paper,.014);}break;
   }
   case 'formingPress':{
    feet();panel(.08,.11,.84,.77);fill(.23,.29,.54,.42,p.dark);
    if(v===0){for(const x of [.15,.78])fill(x,.17,.08,.63,p.metal);fill(.15,.17,.71,.15,p.edge);fill(.15,.69,.71,.11,p.edge);fill(.45,.32,.10,.29,p.metal);}
    else if(v===1){for(const x of [.20,.71])for(const y of [.22,.68]){oval(x,y,.065,.07,p.edge,true);}fill(.20,.22,.57,.10,p.metal);fill(.20,.67,.57,.10,p.metal);fill(.36,.38,.28,.18,p.edge);}
    else{fill(.70,.17,.15,.64,p.metal);fill(.24,.17,.60,.15,p.edge);fill(.24,.68,.60,.13,p.edge);fill(.34,.30,.11,.32,p.metal);line([[.20,.58],[.61,.58]],p.rust,.035);}break;
   }
   case 'curingRack':{
    feet();fill(.07,.11,.86,.77,p.metal);box(.07,.11,.86,.77,p.dark,.035);
    if(v===0){for(let i=0;i<3;i++){const y=.18+i*.24;fill(.14,y,.72,.14,p.edge);for(const x of [.29,.62])oval(x,y+.07,.08,.04,p.rust);}}
    else if(v===1){for(let i=0;i<4;i++){const x=.15+i*.19;fill(x,.18,.12,.64,p.edge);line([[x+.025,.24],[x+.095,.75]],p.rust,.025);}}
    else{for(let row=0;row<4;row++)for(let col=0;col<3;col++){const x=.14+col*.245+(row%2?.035:0),y=.19+row*.17;fill(x,y,.18,.10,p.edge);oval(x+.09,y+.05,.05,.025,p.rust);}}
    for(const x of [.10,.88])line([[x,.14],[x,.85]],p.edge,.025);break;
   }
   default:return false;
  }
  return true;
 }
 function conventionalFallback(c,kind,v,p){
  const {fill,box,line,oval,feet,panel}=tools(c,p);feet();
  if(kind==='dentalChair'){fill(.25,.14,.49,.69,p.cloth);fill(.31,.11,.37,.17,p.paper);fill(.20,.36,.61,.08,p.metal);line([[.14,.19],[.14,.69],[.26,.69]],p.edge,.055);if(v===1)fill(.42,.61,.35,.13,p.dark);else fill(.27,.57,.46,.10,p.metal);}
  else if(kind==='sterilizer'){panel(.09,.14,.82,.73);oval(.5,.51,.29,.27,p.edge,true);oval(.5,.51,.22,.20,p.dark);line([[.35,.5],[.65,.5]],p.metal,.04);fill(v?.72:.18,.21,.08,.055,p.rust);}
  else if(kind==='steelTable'){panel(.07,.14,.86,.71);fill(.13,.21,.74,.56,p.edge);for(const x of [.16,.81])for(const y of [.24,.73])oval(x,y,.017,.02,p.dark);if(v)line([[.18,.69],[.76,.31]],p.metal,.018);}
  else if(kind==='dishRack'){panel(.08,.12,.84,.75);for(let i=0;i<6;i++){const x=.18+i*.125;oval(x,.50,.045,.28,p.edge,true);}line([[.12,.78],[.88,.78]],p.dark,.03);}
  else if(kind==='generator'){panel(.08,.12,.84,.75);for(let i=0;i<(v?2:3);i++){const x=.25+i*(v?.39:.25);oval(x,.51,v?.14:.10,.24,p.dark,true);oval(x,.51,.045,.10,p.metal);}fill(.12,.17,.50,.055,p.edge);fill(.75,.19,.09,.10,p.rust);}
  else if(kind==='pump'){panel(.08,.12,.84,.75);const x=v?.62:.39;oval(x,.49,.22,.25,p.edge,true);oval(x,.49,.10,.13,p.dark);line([[.12,.74],[.25,.74],[.25,.49],[x-.15,.49]],p.metal,.10);line([[x+.15,.49],[.87,.49],[.87,.22]],p.edge,.09);}
  else return false;
  return true;
 }
 function structuralProp(c,kind,v,p,vertical,length){
  const {fill,box,line,oval,polygon,bolt,panel}=tools(c,p);
  c.save();try{
   if(vertical){c.translate(.5,.5);c.rotate(Math.PI/2);c.translate(-.5,-.5);}
   if(kind==='fence'){
    for(const y of [.30,.68])line([[.03,y],[.97,y]],v===2?p.metal:p.wood,.10);
    // A118m boundary must not turn five ordinary posts into five huge blocks.
    const count=Math.min(192,Math.max(3,Math.ceil(length/(v===1?1.2:v===2?2.1:1.6)))),post=Math.min(.12/length,.08),centres=[];
    for(let i=0;i<count;i++){const x=.03+post/2+i*(.94-post)/(count-1);centres.push(x);fill(x-post/2,.10,post,.80,v===2?p.edge:p.grain);}
    if(v===1)for(let i=1;i<centres.length;i++){const left=centres[i-1],right=centres[i];polygon([[left,.16],[left+post,.16],[right,.84],[right-post,.84]],p.wood);}
    else if(v===2)for(let i=1;i<centres.length;i++){const left=centres[i-1],right=centres[i];line([[left,.14],[right,.86]],p.dark,.02/length);line([[right,.14],[left,.86]],p.dark,.02/length);}
   }else if(kind==='garden-shed'){
    fill(.04,.06,.92,.88,p.dark);fill(.08,.10,.84,.80,v===1?p.metal:p.wood);box(.08,.10,.84,.80,p.edge,.045);
    if(v===0){line([[.50,.11],[.50,.87]],p.edge,.06);for(let i=0;i<5;i++){const y=.18+i*.14;line([[.13,y],[.47,y+.06]],p.grain,.02);line([[.53,y+.06],[.87,y]],p.grain,.02);}}
    else if(v===1){line([[.12,.5],[.88,.5]],p.edge,.06);for(let i=0;i<6;i++)line([[.17+i*.13,.15],[.17+i*.13,.85]],p.dark,.02);}
    else{fill(.17,.17,.53,.45,p.metal);box(.17,.17,.53,.45,p.dark,.025);panel(.66,.69,.15,.12);for(const x of [.21,.62])bolt(x,.22);}
    fill(.37,.84,.26,.04,p.dark);
   }else if(kind==='rain-barrel'){
    oval(.5,.5,.42,.44,v===1?p.metal:p.wood,true);oval(.5,.48,.34,.34,p.dark);oval(.5,.48,.28,.28,v===2?p.metal:p.grain);
    if(v===0){for(const y of [.31,.65])line([[.21,y],[.79,y]],p.metal,.04);oval(.59,.35,.035,.04,p.dark);}
    else if(v===1){oval(.5,.48,.20,.21,p.metal,true);fill(.35,.43,.30,.065,p.edge);for(const x of [.26,.74])bolt(x,.49);}
    else{line([[.28,.25],[.72,.70]],p.edge,.035);oval(.37,.35,.055,.06,p.dark);oval(.63,.60,.04,.045,p.dark);}fill(.75,.75,.12,.07,p.rust);
   }else if(kind==='compost-bin'){
    fill(.08,.10,.84,.79,p.wood);box(.08,.10,.84,.79,p.dark,.04);fill(.16,.19,.68,.62,p.dark);
    for(let i=0;i<9;i++){const x=.23+(i%3)*.25,y=.29+Math.floor(i/3)*.19;oval(x,y,.06,.05,i%2?p.green:p.grain);}
    if(v===0){for(const y of [.2,.43,.67,.85])line([[.09,y],[.91,y]],p.grain,.055);}
    else if(v===1){for(const x of [.12,.35,.65,.88])line([[x,.13],[x,.86]],p.grain,.05);line([[.13,.15],[.87,.85]],p.wood,.05);}
    else{for(const y of [.16,.83])line([[.11,y],[.89,y]],p.metal,.055);fill(.13,.20,.29,.58,p.wood);for(let i=0;i<4;i++)line([[.16,.27+i*.13],[.39,.27+i*.13]],p.grain,.025);}
   }else if(kind==='closed-pool'){
    fill(.035,.055,.93,.89,p.dark);fill(.065,.08,.87,.84,p.edge);
    const water=v===0?'#426c70':v===1?'#596c58':'#557b73';
    if(v===2)polygon([[.18,.15],[.82,.15],[.88,.24],[.88,.76],[.81,.85],[.19,.85],[.12,.76],[.12,.24]],water,true);
    else{fill(.12,.15,.76,.70,water);box(.12,.15,.76,.70,p.dark,.022);}
    // Residue and a fixed ladder describe a closed, unattended basin. There
    // is no swimmer, pump motion, potable-water marker or collectible stock.
    for(let i=0;i<5;i++)oval(.23+(i%3)*.22,.29+Math.floor(i/3)*.37,.04+i*.002,.026,p.green);
    const x=v===1?.73:.32;for(const a of [x,x+.10])line([[a,.075],[a,.27]],p.metal,.018);for(const y of [.12,.18,.24])line([[x,y],[x+.10,y]],p.edge,.018);
    if(v===1)for(const y of [.35,.65])line([[.19,y],[.80,y]],'#83917b',.012);else if(v===2)line([[.22,.77],[.46,.72],[.66,.77]],'#87a193',.018);
   }else if(kind==='touring-caravan'||kind==='abandoned-caravan'){
    const ruined=kind==='abandoned-caravan';for(const x of [.27,.66])for(const y of [.09,.82])fill(x,y,.12,.09,p.dark);
    polygon([[.08,.22],[.17,.14],[.85,.14],[.93,.24],[.93,.75],[.84,.85],[.17,.85],[.08,.76]],ruined?p.metal:p.paper,true);
    fill(.14,.22,.71,.55,ruined?p.edge:p.cloth);for(const y of [.20,.77])line([[.20,y],[.80,y]],p.dark,.025);
    if(v===0){panel(.31,.35,.18,.29);fill(.68,.34,.13,.30,p.dark);line([[.69,.37],[.79,.59]],p.edge,.02);}
    else if(v===1){for(const x of [.23,.60])panel(x,.37,.15,.24);box(.31,.27,.42,.47,p.dark,.035);for(const y of [.32,.67])line([[.34,y],[.70,y]],p.edge,.025);}
    else{panel(.32,.32,.24,.36);fill(.65,.26,.16,.30,p.wood);line([[.65,.26],[.81,.56]],p.dark,.025);fill(.19,.59,.51,.08,p.metal);}
    fill(.02,.45,.09,.10,p.dark);line([[.01,.45],[.01,.55]],p.metal,.025);
    if(ruined){for(const x of [.19,.72]){line([[x,.28],[x+.09,.35],[x+.03,.42],[x+.12,.48]],p.dark,.025);fill(x,.64,.10,.04,p.rust);}line([[.38,.72],[.62,.64]],p.rust,.04);}
   }else return false;
   return true;
  }finally{c.restore();}
 }
 function roofTypeFor(family){
  const interior=dependency('DeadwallInteriorArt153','./interior-art153.js');
  if(interior?.roofFamily(family))return family;
  return Object.entries(interior?.ROOF_ALIASES||{}).find(([,value])=>value===family)?.[0]||null;
 }
 function drawRoomFloor(c,art,poi,plan,room,{seed=0,floor=0}={}){
  if(!c||typeof c.save!=='function'||typeof c.fillRect!=='function'||!poi?.campaign205||!plan?.campaign205||!room||![room.x,room.y,room.w,room.h].every(Number.isFinite)||room.w<=0||room.h<=0)return false;
  const cx=room.x+room.w/2,cy=room.y+room.h/2,volume=(plan.volumes160||[]).find(o=>(o.z??0)===floor&&cx>=o.x&&cx<=o.x+o.w&&cy>=o.y&&cy<=o.y+o.h);
  const interior=dependency('DeadwallInteriorArt153','./interior-art153.js'),type=roofTypeFor(volume?.roofFamily)||'warehouse',item={id:room.id||poi.id,type},family=interior?.floorFamily(item,floor);
  const fillBefore=c.fillStyle,strokeBefore=c.strokeStyle;c.save();try{c.beginPath();c.rect(room.x,room.y,room.w,room.h);c.clip();c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;c.fillStyle=family==='wood'?'#9a8c72':family==='tile'?'#a9b3a3':family==='rubber'?'#6c7965':'#899184';c.fillRect(room.x,room.y,room.w,room.h);interior?.drawFloor(c,art,item,room,{seed,floor});return true;}finally{c.restore();c.fillStyle=fillBefore;c.strokeStyle=strokeBefore;}
 }
 function drawAreas(c,poi,plan,{seed=0,floor=0}={}){
  if(!c||typeof c.save!=='function'||!poi?.campaign205||!plan?.campaign205||!Array.isArray(plan.areas205))return false;
  let painted=false;
  for(const area of plan.areas205){
   if(!AREA_KINDS.includes(area.kind)||(area.level??area.z??0)!==floor||![area.x,area.y,area.w,area.h].every(Number.isFinite)||area.w<=0||area.h<=0)continue;
   const v=variantFor(area,{seed,floor}),p=PALETTES[v],fillBefore=c.fillStyle,strokeBefore=c.strokeStyle,point=index=>{
    const h=variantFor({id:area.id+':'+index,kind:area.kind},{seed,floor,count:1048576});return{x:area.x+.15+((h&1023)/1023)*Math.max(0,area.w-.3),y:area.y+.15+((h>>>10)/1023)*Math.max(0,area.h-.3)};
   };
   c.save();try{
    c.beginPath();c.rect(area.x,area.y,area.w,area.h);c.clip();c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;
    const planted=['vegetable-garden','flower-garden','herb-garden'].includes(area.kind),meadow=['meadow-garden','communal-garden'].includes(area.kind);
    c.fillStyle=planted?'#665741':meadow?'#63734e':area.kind==='gravel-garden'?'#99937e':area.kind==='terrace'?'#8e8168':area.kind==='parking'?'#7e8274':'#96967f';c.fillRect(area.x,area.y,area.w,area.h);
    if(planted){
     c.strokeStyle=p.wood;c.lineWidth=.06;c.strokeRect(area.x+.06,area.y+.06,Math.max(.01,area.w-.12),Math.max(.01,area.h-.12));
     const cols=Math.min(32,Math.max(1,Math.floor((area.w-.25)/.65))),rows=Math.min(Math.floor(256/cols),Math.max(1,Math.floor((area.h-.25)/.65)));
     for(let row=0;row<rows;row++){const y=area.y+(row+.5)*area.h/rows;c.strokeStyle='#88704e';c.lineWidth=.045;c.beginPath();c.moveTo(area.x+.12,y+.14);c.lineTo(area.x+area.w-.12,y+.14);c.stroke();
      for(let col=0;col<cols;col++){const x=area.x+(col+.5)*area.w/cols;c.fillStyle=(row+col+v)%2?p.green:'#809261';c.beginPath();c.ellipse(x-.045,y,.08,.05,-.5,0,Math.PI*2);c.ellipse(x+.04,y-.015,.08,.055,.55,0,Math.PI*2);c.fill();if(area.kind==='flower-garden'){c.fillStyle=(row+col)%3?'#bfaf82':'#c1bca2';c.beginPath();c.arc(x,y-.025,.042,0,Math.PI*2);c.fill();}}
     }
    }else if(meadow||area.kind==='gravel-garden'){
     const count=Math.min(128,Math.max(3,Math.ceil(area.w*area.h/(meadow?1.7:.8))));
     for(let i=0;i<count;i++){const q=point(i);if(meadow){c.strokeStyle=i%2?'#7b8e5c':'#4c6542';c.lineWidth=.025;c.beginPath();c.moveTo(q.x-.07,q.y+.08);c.lineTo(q.x,q.y-.05);c.lineTo(q.x+.07,q.y+.07);c.stroke();}else{c.fillStyle=i%2?'#747969':'#bab49c';c.beginPath();c.ellipse(q.x,q.y,.035+(i%3)*.012,.025+(i%2)*.012,v*.6,0,Math.PI*2);c.fill();}}
    }else if(area.kind==='terrace'){
     const vertical=area.h>area.w,length=vertical?area.w:area.h,count=Math.min(128,Math.max(2,Math.ceil(length/.24)));c.strokeStyle='#625c49';c.lineWidth=.02;
     for(let i=1;i<count;i++){c.beginPath();if(vertical){const x=area.x+i*area.w/count;c.moveTo(x,area.y);c.lineTo(x,area.y+area.h);}else{const y=area.y+i*area.h/count;c.moveTo(area.x,y);c.lineTo(area.x+area.w,y);}c.stroke();}
    }else if(area.kind==='parking'){
     c.strokeStyle='#bdb99b';c.lineWidth=.065;c.strokeRect(area.x+.14,area.y+.14,Math.max(.01,area.w-.28),Math.max(.01,area.h-.28));c.fillStyle='#666e60';for(let i=0;i<12;i++){const q=point(i);c.fillRect(q.x,q.y,.055,.035);}
    }else{
     c.strokeStyle='#827f69';c.lineWidth=.025;const count=Math.min(96,Math.ceil(area.w/.8));for(let i=1;i<count;i++){const x=area.x+i*area.w/count;c.beginPath();c.moveTo(x,area.y);c.lineTo(x,area.y+area.h);c.stroke();}
    }
    painted=true;
   }finally{c.restore();c.fillStyle=fillBefore;c.strokeStyle=strokeBefore;}
  }
  return painted;
 }
 function drawProp(c,art,prop,{seed=0,floor=prop?.z??0,variant,taken=0,stateAlpha=true,scale=32}={}){
  const frame=frameFor(prop);
  if(!frame||!c||!['save','restore','fillRect','rect','clip','translate','rotate','scale','ellipse'].every(name=>typeof c[name]==='function')||
   !Number.isFinite(scale)||scale<=0||![prop.w*scale,prop.h*scale].every(Number.isFinite)||(variant!==undefined&&!Number.isSafeInteger(variant)))return false;
  const route=routeFor(prop.kind),v=variantFor(prop,{seed,floor,variant}),p=PALETTES[v],fillBefore=c.fillStyle,strokeBefore=c.strokeStyle;
  c.save();try{
   c.beginPath();c.rect(prop.x,prop.y,prop.w,prop.h);c.clip();c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;c.setLineDash([]);c.lineCap='butt';c.lineJoin='miter';
   if(stateAlpha&&Number.isFinite(prop.amount)&&Number.isFinite(taken)&&taken>=prop.amount-.001)c.globalAlpha*=.55;
   const {turn}=frame;if(turn===0)c.translate(prop.x,prop.y);else if(turn===1)c.translate(prop.x+prop.w,prop.y);else if(turn===2)c.translate(prop.x+prop.w,prop.y+prop.h);else c.translate(prop.x,prop.y+prop.h);c.rotate(turn*Math.PI/2);
   const local={...prop,x:0,y:0,w:frame.w,h:frame.h,rotationRad:0};
   const interior=dependency('DeadwallInteriorArt153','./interior-art153.js');
   if(route==='atlas153'&&interior?.drawFurniture(c,art,local,{seed,floor,variant,taken,stateAlpha:false,alignLongAxis:true}))return true;
   const detail=dependency('DeadwallSeedDetailArt157','./seed-detail-art157.js');
   if((route==='atlas153'||route==='detail157')&&detail?.presentationFor(prop.kind)&&detail.draw(c,local,{art,seed}))return true;
   c.scale(frame.w,frame.h);const pixels=Math.min(prop.w,prop.h)*scale;
   if(pixels<3){c.fillStyle=specialised.has(prop.kind)?p.metal:p.wood;c.fillRect(.05,.05,.90,.90);return true;}
   return route==='procedural205'?specialisedProp(c,prop.kind,v,p):route==='structural205'?structuralProp(c,prop.kind,v,p,frame.h>frame.w,Math.max(frame.w,frame.h)):conventionalFallback(c,prop.kind,v,p);
  }finally{c.restore();c.fillStyle=fillBefore;c.strokeStyle=strokeBefore;}
 }
 return Object.freeze({version:1,scope:'versioned-campaign-furniture',SPECIALISED_KINDS,STRUCTURAL_KINDS,AREA_KINDS,routeFor,variantFor,frameFor,roofTypeFor,drawRoomFloor,drawAreas,drawProp});
});
