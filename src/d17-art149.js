/* Native original D-17 artwork. Presentation follows existing paid supports only. */
(function(root, factory) {
  'use strict';
  const api = factory(root);
  root.DeadwallD17Art149 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  'use strict';
  const ASSETS = Object.freeze({
    d17Core149: Object.freeze({url:'assets/art149/core-atlas.png',width:1536,height:1024,matte:'none'}),
    d17Housing149: Object.freeze({url:'assets/art149/housing-atlas.png',width:1536,height:1024,matte:'none'}),
    d17Industry149: Object.freeze({url:'assets/art149/industry-atlas.png',width:1536,height:1024,matte:'none'}),
    d17Services149: Object.freeze({url:'assets/art149/services-atlas.png',width:1536,height:1024,matte:'none'}),
    d17Construction149: Object.freeze({url:'assets/art149/construction-atlas.png',width:2172,height:724,matte:'none'}),
    d17Yard149: Object.freeze({url:'assets/art149/working-yard.png',width:1254,height:1254,matte:'none'})
  });
  // Measured alpha gutters: the first hall and low row housing cross nominal cells.
  const SPRITES = Object.freeze(Object.fromEntries(Object.entries({
    coreRefuge:{atlas:'d17Core149',rect:[13,205,488,599]},
    coreSteel:{atlas:'d17Core149',rect:[523,166,497,639]},
    coreConcrete:{atlas:'d17Core149',rect:[1035,104,488,705]},
    housingLow:{atlas:'d17Housing149',rect:[82,191,409,250]},
    housingApartment:{atlas:'d17Housing149',rect:[624,61,319,394]},
    housingBlock:{atlas:'d17Housing149',rect:[1111,7,303,449]},
    housingComplex:{atlas:'d17Housing149',rect:[90,529,368,474]},
    housingFortified:{atlas:'d17Housing149',rect:[588,490,361,517]},
    housingTower:{atlas:'d17Housing149',rect:[1166,464,233,549]},
    manufacture:{atlas:'d17Industry149',rect:[14,194,538,631]},
    power:{atlas:'d17Industry149',rect:[569,171,430,658]},
    food:{atlas:'d17Industry149',rect:[1014,254,515,575]},
    hospital:{atlas:'d17Services149',rect:[9,155,766,625]},
    storage:{atlas:'d17Services149',rect:[790,146,744,681]},
    foundation:{atlas:'d17Construction149',rect:[46,159,641,483]},
    frame:{atlas:'d17Construction149',rect:[768,119,638,534]},
    scaffold:{atlas:'d17Construction149',rect:[1480,23,666,637]}
  }).map(([key, value])=>[key,Object.freeze({atlas:value.atlas,rect:Object.freeze(value.rect)})])));
  const URBAN = Object.freeze({hospital:'hospital',storage:'storage',food:'food',power:'power',fuel:'power',scrap:'manufacture',stone:'manufacture',ammo:'manufacture'});
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  function coreSprite(tier) { return tier < 2 ? 'coreRefuge' : tier < 4 ? 'coreSteel' : 'coreConcrete'; }
  function urbanSprite(def) {
    if (!def) return null;
    if (def.urbanKind==='housing') return def.floors<=2?'housingLow':def.floors<=4?'housingApartment':def.floors<=8?'housingBlock':def.floors<=12?'housingComplex':def.floors<=15?'housingFortified':'housingTower';
    return Object.hasOwn(URBAN,def.urbanKind)?URBAN[def.urbanKind]:null;
  }
  function constructionSprite(progress) { return progress<.34?'foundation':progress<.72?'frame':'scaffold'; }
  function measure(type,b,{rise=0,inset=3}={}) {
    const spec=Object.hasOwn(SPRITES,type)?SPRITES[type]:null;
    if(!spec||!b||![b.x,b.y,b.w,b.h,rise,inset].every(Number.isFinite)||b.w<=0||b.h<=0||rise<0||inset<0)return null;
    const w=b.w*32,h=b.h*32,scale=Math.min(Math.max(1,w-inset*2)/spec.rect[2],Math.max(1,h+rise-inset*2)/spec.rect[3]);
    const width=spec.rect[2]*scale,height=spec.rect[3]*scale;
    return {atlas:spec.atlas,source:spec.rect,destination:[b.x-width/2,b.y+h/2-inset-height,width,height]};
  }
  function drawSprite(c,art,type,b,options) {
    const frame=measure(type,b,options);
    if(!frame||!c?.drawImage||!art?.images?.[frame.atlas])return false;
    if(typeof art.blit==='function')return art.blit(c,frame.atlas,frame.source,...frame.destination);
    c.drawImage(art.images[frame.atlas],...frame.source,...frame.destination);return true;
  }
  function drawCore(c,art,b,tier=0) {
    if(b?.type!=='core'||b.dead||b.completed===false)return false;
    return drawSprite(c,art,coreSprite(tier),b,{rise:56});
  }
  function drawUrban(c,art,b) {
    const type=urbanSprite(b?.def);if(!type||b.dead||b.completed===false)return false;
    const rise=b.def.urbanKind==='housing'?Math.min(108,(b.def.floors||3)*5):b.def.urbanKind==='hospital'?38:18;
    c.save();
    // Baked sodium highlights become subdued when the real services lose power.
    if(b.def.powerUse&&(!b.powered||b.siegeOffline||b.territoryOffline)&&'filter' in c)c.filter='brightness(.50) saturate(.55)';
    const painted=drawSprite(c,art,type,b,{rise});c.restore();return painted;
  }
  function eligibleSite(b) { return !!(b&&!b.dead&&b.completed===false&&Number.isFinite(b.progress)&&b.progress>=0&&b.progress<1&&!b.def?.wall&&b.type!=='spikes'&&b.def?.urbanKind!=='lamp'); }
  function drawConstruction(c,art,b,{suspended=false}={}) {
    if(!eligibleSite(b))return false;
    const type=constructionSprite(b.progress);if(!art?.images?.d17Construction149)return false;
    c.save();
    if(suspended)c.globalAlpha*=.65;
    const painted=drawSprite(c,art,type,b,{rise:type==='scaffold'?20:0,inset:4});
    // The exact existing work fraction remains visible over the generated site.
    c.fillStyle=suspended?'#819083':'#d2a84a';c.fillRect(b.left,b.bottom+4,b.w*32*clamp(b.progress,0,1),3);
    c.restore();return painted;
  }
  const surfaces=new WeakMap();
  function drawSurface(c,art,b) {
    const image=art?.images?.d17Yard149;if(!image||!c?.createPattern||!b||![b.left,b.top,b.w,b.h].every(Number.isFinite))return false;
    let entry=surfaces.get(c);if(!entry||entry.image!==image){entry={image,pattern:c.createPattern(image,'repeat')};surfaces.set(c,entry);}
    if(!entry.pattern)return false;
    const scale=96/ASSETS.d17Yard149.width;
    c.save();c.beginPath();c.rect(b.left+3,b.top+3,b.w*32-6,b.h*32-6);c.clip();c.globalAlpha*=.36;c.scale(scale,scale);c.fillStyle=entry.pattern;
    c.fillRect((b.left+3)/scale,(b.top+3)/scale,(b.w*32-6)/scale,(b.h*32-6)/scale);c.restore();
    if(art.diagnostics?.draws)art.diagnostics.draws.d17Yard149=(art.diagnostics.draws.d17Yard149||0)+1;
    return true;
  }
  function install(g) {
    if(!g?.art||g.d17Art149)return g?.d17Art149||null;
    const previous=g.art.drawBuilding.bind(g.art);
    g.art.drawBuilding=(c,b,...args)=>drawCore(c,g.art,b,g.tier?.id||0)||previous(c,b,...args);
    if(typeof g.drawBuilding==='function') {
      const original=g.drawBuilding.bind(g);
      g.drawBuilding=(c,b,...args)=>{const result=original(c,b,...args);drawConstruction(c,g.art,b);return result;};
    }
    if(typeof g.drawGround==='function') {
      const original=g.drawGround.bind(g);
      g.drawGround=(c,view,...args)=>{
        const result=original(c,view,...args);
        for(const b of g.world?.buildings?.values?.()||[]) {
          if(b.dead||!(b.type==='core'||urbanSprite(b.def)||eligibleSite(b)))continue;
          if(view&&(b.right<view.left||b.left>view.right||b.bottom<view.top||b.top>view.bottom))continue;
          drawSurface(c,g.art,b);
        }
        return result;
      };
    }
    g.d17Art149=Object.freeze({coreSprite,urbanSprite,constructionSprite,measure});return g.d17Art149;
  }
  return Object.freeze({ASSETS,SPRITES,coreSprite,urbanSprite,constructionSprite,measure,drawSprite,drawCore,drawUrban,eligibleSite,drawConstruction,drawSurface,install});
});
