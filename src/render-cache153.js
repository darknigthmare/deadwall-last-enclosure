/* Bounded presentation rasters. Owners retain every pose, resource and world state. */
(function(root,factory){
  'use strict';
  const api=factory(root);
  root.DeadwallRenderCache153=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const LIMITS=Object.freeze({bytes:8*1024*1024,entries:384,oversample:2,minEdge:16});
  // Historical chroma-key actors contain isolated matte fringe pixels. A second
  // resampling pass can reveal those fragments beside a small hand or weapon.
  // Keep their original sampling path and all eight poses intact.
  const NATIVE_ACTORS=Object.freeze(['survivors','infected','infectedExpansion','specialists']);
  function levelFor(c,rect,w,h){
    if(c.imageSmoothingEnabled===false||typeof c.getTransform!=='function'||!rect||rect.length!==4)return 0;
    const [x,y,sw,sh]=rect;
    if(![x,y,sw,sh,w,h].every(Number.isFinite)||x<0||y<0||sw<=0||sh<=0||w===0||h===0)return 0;
    const m=c.getTransform();
    if(!m||![m.a,m.b,m.c,m.d].every(Number.isFinite))return 0;
    const target=Math.max(Math.hypot(m.a,m.b)*Math.abs(w)/sw,Math.hypot(m.c,m.d)*Math.abs(h)/sh)*LIMITS.oversample;
    if(!(target>0)||target>=.5)return 0;
    let level=0,scale=1;
    while(scale*.5>=target&&Math.min(sw,sh)*scale*.5>=LIMITS.minEdge){scale*=.5;level++;}
    return level;
  }
  class Cache{
    constructor({bytes=LIMITS.bytes,entries=LIMITS.entries,canvas}={}){
      this.maxBytes=bytes;this.maxEntries=entries;this.makeCanvas=canvas||(()=>root.document?.createElement?.('canvas'));
      this.items=new Map();this.bytes=0;this.stats={hits:0,misses:0,evictions:0};
    }
    remove(key){const old=this.items.get(key);if(!old)return;this.items.delete(key);this.bytes-=old.bytes;}
    get(c,atlas,image,rect,w,h){
      if(NATIVE_ACTORS.includes(atlas))return null;
      const level=levelFor(c,rect,w,h);if(!level||!image)return null;
      const [x,y,sw,sh]=rect;
      // Art publishes immutable decoded sources. Identity and size changes
      // invalidate these copies; live scene canvases must never be passed here.
      if(x+sw>(image.width||image.naturalWidth)||y+sh>(image.height||image.naturalHeight))return null;
      const key=atlas+':'+rect.join(',')+':'+level,old=this.items.get(key);
      if(old&&old.source===image&&old.sourceWidth===image.width&&old.sourceHeight===image.height){
        this.items.delete(key);this.items.set(key,old);this.stats.hits++;return old;
      }
      if(old)this.remove(key);
      const width=Math.ceil(sw/2**level),height=Math.ceil(sh/2**level),bytes=width*height*4;
      if(bytes>this.maxBytes||this.maxEntries<1)return null;
      const canvas=this.makeCanvas();if(!canvas)return null;
      canvas.width=width;canvas.height=height;
      const context=canvas.getContext?.('2d');if(!context)return null;
      // Reduce only the source sampling workload. Destination transforms,
      // opacity, filters, depth and physical dimensions stay on the live context.
      context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
      context.drawImage(image,x,y,sw,sh,0,0,width,height);
      while(this.items.size>=this.maxEntries||this.bytes+bytes>this.maxBytes){this.remove(this.items.keys().next().value);this.stats.evictions++;}
      const entry={image:canvas,width,height,bytes,source:image,sourceWidth:image.width,sourceHeight:image.height,level};
      this.items.set(key,entry);this.bytes+=bytes;this.stats.misses++;return entry;
    }
    clear(){this.items.clear();this.bytes=0;}
  }
  return Object.freeze({LIMITS,NATIVE_ACTORS,levelFor,create:options=>new Cache(options)});
});
