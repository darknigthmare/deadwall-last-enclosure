/* Original procedural pictograms for metre-based author inspection only.
 * Drawing never changes a prop's dimensions, collision, inventory or state. */
(function(root, factory) {
  'use strict';
  const api = factory();
  root.DeadwallCodexPlanArt204 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function() {
  'use strict';

  const GROUPS = Object.freeze({
    sleeping: 'bed singleBunk',
    seating: 'chair bench sofa',
    tables: 'desk table steelTable workbench cuttingTable inspectionBench assemblyStation',
    storage: 'wardrobe shelf smallCabinet toolbox crate crateStack dishRack laundryBasket curingRack',
    kitchen: 'counter oven fridge sink',
    sanitary: 'toilet shower washer',
    medical: 'medical dentalChair sterilizer veterinaryTable',
    electrical: 'electricalRack generator',
    fluids: 'pump milkVat wineVat wineBarrel',
    agriculture: 'feedTrough waterTrough fodderRack milkingUnit nestBox grapePress growingBench growingBed',
    machinery: 'machine conveyor dosingUnit foodMixer heatChamber metalSaw lathe millingMachine loom sewingStation materialMixer formingPress'
  });
  const CATEGORIES = Object.freeze(Object.fromEntries(Object.entries(GROUPS)
    .flatMap(([group,kinds]) => kinds.split(' ').map(kind => [kind,group]))));
  const PALETTES = Object.freeze([
    Object.freeze({wood:'#987653',metal:'#72827a',cloth:'#b8b99b',light:'#d7d2b8',dark:'#34433b',water:'#66929a',accent:'#9b5b48'}),
    Object.freeze({wood:'#81735d',metal:'#657d7c',cloth:'#9babac',light:'#c9d1c2',dark:'#344047',water:'#5b8496',accent:'#bd9561'}),
    Object.freeze({wood:'#a18a64',metal:'#868477',cloth:'#b5a391',light:'#ded4b9',dark:'#49463d',water:'#789a91',accent:'#78584a'})
  ]);
  const categoryFor = kind => Object.prototype.hasOwnProperty.call(CATEGORIES,kind) ? CATEGORIES[kind] : 'generic';

  function variantFor(prop) {
    const text = String(prop?.kind || '') + ':' + String(prop?.id || '');
    let hash = 2166136261;
    for (let i=0;i<text.length;i++) hash = Math.imul(hash ^ text.charCodeAt(i),16777619) >>> 0;
    return hash % PALETTES.length;
  }

  function drawProp(ctx, prop, scale = 1) {
    if (!ctx || typeof ctx.save !== 'function' || typeof ctx.fillRect !== 'function' ||
        !prop || ![prop.x,prop.y,prop.w,prop.h,scale].every(Number.isFinite) || prop.w<=0 || prop.h<=0 || scale<=0 ||
        ![prop.x+prop.w,prop.y+prop.h,prop.w*scale,prop.h*scale].every(Number.isFinite) ||
        typeof prop.id !== 'string' || !prop.id || typeof prop.kind !== 'string' || !prop.kind) return false;
    const angle = prop.rotationRad === undefined ? 0 : prop.rotationRad;
    const turns = angle / (Math.PI / 2), nearest = Math.round(turns);
    if (!Number.isFinite(angle) || !Number.isSafeInteger(nearest) || Math.abs(turns-nearest)>1e-8) return false;
    const quarter = ((nearest % 4) + 4) % 4;
    const width = quarter % 2 ? prop.h : prop.w, height = quarter % 2 ? prop.w : prop.h;
    const variant = variantFor(prop), p = PALETTES[variant], group = categoryFor(prop.kind), k = prop.kind;
    const pixels = Math.min(prop.w,prop.h) * scale;
    const previousFill = ctx.fillStyle, previousStroke = ctx.strokeStyle;
    ctx.save();
    try {
      // Clip in world space first: rotated strokes, shadows and future details
      // cannot extend a visual object into its service clearance or neighbour.
      ctx.beginPath(); ctx.rect(prop.x,prop.y,prop.w,prop.h); ctx.clip();
      if (quarter===0) ctx.translate(prop.x,prop.y);
      else if (quarter===1) ctx.translate(prop.x+prop.w,prop.y);
      else if (quarter===2) ctx.translate(prop.x+prop.w,prop.y+prop.h);
      else ctx.translate(prop.x,prop.y+prop.h);
      ctx.rotate(quarter*Math.PI/2); ctx.scale(width,height);
      ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;
      ctx.setLineDash([]); ctx.lineCap='butt'; ctx.lineJoin='miter';
      const fill = (x,y,w,h,color) => {ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
      const line = (points,color=p.dark,stroke=.025) => {
        ctx.strokeStyle=color;ctx.lineWidth=stroke;ctx.beginPath();
        points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));ctx.stroke();
      };
      const oval = (x,y,rx,ry,color,stroke=false) => {
        ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
        if(stroke){ctx.strokeStyle=p.dark;ctx.lineWidth=.025;ctx.stroke();}
      };
      const wood = ['sleeping','seating','tables','storage'].includes(group);
      fill(0,0,1,1,wood?p.wood:p.metal);
      if(pixels<3) return true;
      ctx.strokeStyle=p.dark;ctx.lineWidth=.035;ctx.strokeRect(.025,.025,.95,.95);
      if(pixels<7) return true;

      if(group==='sleeping') {
        fill(.09,.12,.82,.76,p.cloth);fill(.12,.15,.76,.2,p.light);
        line([[.08,.39],[.92,.39]],p.dark,.018);
        if(k==='bed') line([[.5,.15],[.5,.33]],p.wood,.02);
        else {line([[.07,.09],[.93,.09]],p.dark,.05);line([[.07,.91],[.93,.91]],p.dark,.05);}
      } else if(group==='seating') {
        fill(.1,.19,.8,.64,p.cloth);fill(.1,.08,.8,.17,p.light);
        if(k==='sofa') {fill(.06,.2,.12,.66,p.light);fill(.82,.2,.12,.66,p.light);line([[.5,.27],[.5,.79]]);}
        else if(k==='bench') {for(let y=.3;y<.8;y+=.16)line([[.13,y],[.87,y]],p.dark,.02);}
        else {line([[.13,.85],[.13,.94]],p.dark,.05);line([[.87,.85],[.87,.94]],p.dark,.05);}
      } else if(group==='tables') {
        fill(.09,.12,.82,.74,k==='steelTable'||k==='veterinaryTable'?p.light:p.wood);
        for(const [x,y] of [[.12,.15],[.8,.15],[.12,.75],[.8,.75]])fill(x,y,.08,.08,p.dark);
        if(k==='desk') {fill(.13,.18,.27,.26,p.metal);fill(.58,.25,.2,.22,p.light);}
        else if(k==='workbench') {fill(.12,.12,.2,.19,p.metal);line([[.46,.3],[.77,.3],[.77,.5]],p.dark,.05);}
        else if(k==='cuttingTable') {line([[.15,.5],[.85,.5]],p.light,.015);line([[.5,.18],[.5,.8]],p.light,.015);}
        else if(k==='inspectionBench') {fill(.15,.2,.24,.3,p.metal);oval(.65,.45,.12,.18,p.light,true);}
        else if(k==='assemblyStation') {fill(.23,.27,.54,.38,p.metal);line([[.28,.46],[.72,.46]],p.light,.04);}
      } else if(group==='storage') {
        fill(.1,.1,.8,.8,p.light);
        if(k==='crate'||k==='crateStack') {
          fill(.12,.12,.76,.76,p.wood);line([[.15,.15],[.85,.85]],p.dark,.045);line([[.85,.15],[.15,.85]],p.dark,.045);
          if(k==='crateStack')ctx.strokeRect(.26,.23,.55,.53);
        } else if(k==='wardrobe') {
          line([[.5,.1],[.5,.9]]);fill(.42,.45,.035,.1,p.dark);fill(.545,.45,.035,.1,p.dark);
        } else if(k==='smallCabinet') {
          for(let y=.16;y<.85;y+=.25){ctx.strokeRect(.14,y,.72,.2);fill(.42,y+.08,.16,.025,p.dark);}
        } else if(k==='toolbox') {fill(.29,.14,.42,.12,p.dark);line([[.12,.53],[.88,.53]],p.wood,.04);fill(.46,.47,.08,.13,p.dark);}
        else if(k==='laundryBasket') {oval(.5,.5,.33,.32,p.cloth,true);for(let x=.3;x<.8;x+=.15)line([[x,.29],[x,.72]],p.dark,.015);}
        else if(k==='dishRack') {for(let x=.2;x<.9;x+=.18)oval(x,.5,.065,.3,p.metal,true);}
        else if(k==='curingRack') {for(let y=.2;y<.85;y+=.2){fill(.14,y,.72,.12,p.metal);oval(.3,y+.06,.05,.04,p.wood);oval(.65,y+.06,.05,.04,p.wood);}}
        else {for(let y=.25;y<.9;y+=.2)line([[.12,y],[.88,y]],p.dark,.035);fill(.14,.12,.2,.11,p.wood);fill(.58,.34,.24,.1,p.cloth);}
      } else if(group==='kitchen') {
        if(k==='oven') {for(const x of [.3,.7])for(const y of [.32,.68])oval(x,y,.13,.15,p.dark);fill(.2,.08,.6,.05,p.light);}
        else if(k==='sink') {fill(.12,.18,.76,.64,p.light);oval(.5,.51,.26,.23,p.water,true);line([[.5,.1],[.5,.35]],p.dark,.05);}
        else if(k==='fridge') {fill(.12,.12,.76,.76,p.light);line([[.12,.35],[.88,.35]]);line([[.8,.47],[.8,.74]],p.dark,.04);}
        else {fill(.09,.17,.82,.65,p.light);fill(.12,.64,.76,.16,p.wood);}
      } else if(group==='sanitary') {
        if(k==='toilet') {fill(.17,.1,.66,.24,p.light);oval(.5,.59,.28,.29,p.light,true);oval(.5,.6,.14,.18,p.water);}
        else if(k==='washer') {fill(.13,.12,.74,.76,p.light);oval(.5,.57,.27,.26,p.dark);oval(.5,.57,.2,.19,p.water);fill(.22,.18,.46,.06,p.dark);}
        else {fill(.1,.1,.8,.8,p.light);line([[.14,.14],[.86,.86]],p.water,.025);line([[.14,.86],[.86,.14]],p.water,.025);oval(.72,.25,.08,.08,p.dark);}
      } else if(group==='medical') {
        fill(.12,.13,.76,.74,p.light);
        if(k==='medical') {fill(.4,.25,.2,.48,p.accent);fill(.26,.39,.48,.2,p.accent);}
        else if(k==='sterilizer') {fill(.21,.23,.58,.5,p.metal);oval(.5,.48,.17,.17,p.light,true);}
        else {fill(.25,.27,.5,.45,p.cloth);fill(.31,.12,.38,.17,p.light);if(k==='dentalChair')line([[.18,.3],[.09,.3],[.09,.65]],p.dark,.05);}
      } else if(group==='electrical') {
        if(k==='generator') {oval(.38,.53,.22,.28,p.dark);fill(.58,.23,.27,.53,p.light);line([[.2,.84],[.82,.84]],p.dark,.05);}
        else {fill(.12,.12,.76,.76,p.dark);for(let y=.19;y<.85;y+=.16){fill(.18,y,.57,.075,p.metal);fill(.8,y,.035,.075,p.accent);}}
      } else if(group==='fluids') {
        if(k==='pump') {line([[.1,.7],[.3,.7],[.3,.45],[.86,.45]],p.light,.13);oval(.47,.45,.2,.25,p.dark,true);oval(.47,.45,.1,.12,p.metal);}
        else {oval(.5,.5,.37,.39,k==='wineBarrel'?p.wood:p.light,true);line([[.18,.35],[.82,.35]],p.dark,.035);line([[.18,.65],[.82,.65]],p.dark,.035);oval(.5,.5,k==='wineVat'?.13:.06,k==='wineVat'?.13:.06,k==='wineVat'?p.accent:p.metal);if(k==='milkVat')fill(.42,.14,.16,.1,p.metal);}
      } else if(group==='agriculture') {
        if(k==='feedTrough'||k==='waterTrough') {fill(.09,.2,.82,.6,p.light);fill(.16,.28,.68,.44,k==='waterTrough'?p.water:p.wood);}
        else if(k==='nestBox') {for(let x=.1;x<.9;x+=.27){fill(x,.14,.23,.72,p.wood);oval(x+.115,.55,.07,.13,p.light);}}
        else if(k==='growingBed'||k==='growingBench') {fill(.1,.13,.8,.74,p.wood);for(let x=.23;x<.85;x+=.22)for(let y=.28;y<.8;y+=.22)oval(x,y,.07,.08,p.cloth);if(k==='growingBench')for(const [x,y]of[[.1,.13],[.8,.13],[.1,.77],[.8,.77]])fill(x,y,.1,.1,p.dark);}
        else if(k==='fodderRack') {fill(.1,.14,.8,.72,p.cloth);for(let x=.2;x<.9;x+=.2)line([[x,.14],[x,.86]],p.wood,.04);}
        else if(k==='milkingUnit') {oval(.38,.47,.21,.29,p.light,true);line([[.64,.2],[.78,.2],[.78,.78]],p.dark,.07);}
        else {oval(.5,.52,.3,.32,p.wood,true);line([[.2,.25],[.8,.25]],p.dark,.07);line([[.5,.14],[.5,.84]],p.light,.07);}
      } else if(group==='machinery') {
        fill(.12,.12,.76,.76,p.light);
        if(k==='conveyor') {for(let x=.2;x<.85;x+=.16){fill(x,.2,.07,.6,p.metal);}line([[.15,.17],[.85,.17]],p.dark,.04);line([[.15,.83],[.85,.83]],p.dark,.04);}
        else if(k==='loom') {for(let x=.22;x<.85;x+=.13)line([[x,.18],[x,.82]],p.wood,.035);for(let y=.25;y<.85;y+=.16)line([[.18,y],[.82,y]],p.cloth,.025);}
        else if(k==='heatChamber') {fill(.2,.2,.6,.6,p.dark);fill(.27,.27,.46,.46,p.accent);line([[.2,.5],[.8,.5]],p.light,.025);}
        else if(k==='dosingUnit') {fill(.2,.2,.6,.29,p.metal);fill(.42,.49,.16,.2,p.dark);fill(.3,.7,.4,.12,p.wood);line([[.18,.2],[.18,.83]],p.dark,.04);line([[.82,.2],[.82,.83]],p.dark,.04);}
        else if(k==='foodMixer'||k==='materialMixer') {oval(.43,.47,.25,.29,k==='foodMixer'?p.metal:p.wood,true);line([[.43,.24],[.43,.7]],p.dark,.06);if(k==='materialMixer')line([[.22,.3],[.64,.65]],p.dark,.05);fill(.74,.19,.1,.58,p.dark);}
        else if(k==='millingMachine') {fill(.2,.15,.19,.62,p.dark);fill(.2,.15,.57,.17,p.metal);line([[.66,.3],[.66,.58]],p.dark,.07);fill(.45,.6,.37,.14,p.metal);}
        else if(k==='lathe'||k==='metalSaw') {fill(.17,.36,.66,.37,p.metal);oval(k==='lathe'?.7:.4,.43,.16,.19,p.dark,true);fill(.2,.18,.2,.25,p.metal);if(k==='metalSaw')line([[.28,.3],[.52,.56]],p.light,.035);line([[.2,.79],[.8,.79]],p.dark,.06);}
        else if(k==='sewingStation') {fill(.25,.28,.52,.42,p.dark);fill(.42,.5,.22,.2,p.light);line([[.32,.2],[.32,.77]],p.metal,.055);}
        else if(k==='formingPress') {fill(.2,.18,.6,.19,p.metal);fill(.2,.68,.6,.15,p.metal);fill(.2,.18,.1,.6,p.dark);fill(.7,.18,.1,.6,p.dark);line([[.5,.35],[.5,.61]],p.dark,.1);}
        else {fill(.23,.24,.54,.52,p.metal);oval(.5,.5,.15,.17,p.dark,true);fill(.71,.18,.1,.1,p.accent);}
      } else {
        // Future kinds remain visible without masquerading as a known device.
        line([[.18,.18],[.82,.82]],p.light,.045);line([[.18,.82],[.82,.18]],p.light,.045);
      }
      if(pixels>=18) {
        const y=.06+variant*.025;
        line([[.06,y],[.17,y]],p.light,.015);line([[.83,1-y],[.94,1-y]],p.dark,.015);
      }
      return true;
    } finally {
      ctx.restore();
      // Native canvas implementations can retain their JS style getters after
      // restore(), so preserve the caller's styles explicitly as well.
      ctx.fillStyle=previousFill;ctx.strokeStyle=previousStroke;
    }
  }

  return Object.freeze({version:1,scope:'author-inspection-pictograms-not-campaign',drawProp,variantFor,categoryFor,CATEGORIES});
});
