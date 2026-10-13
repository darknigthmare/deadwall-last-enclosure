/* Native fixtures for the twelve existing finite expedition sites. */
(function(root,factory){
 'use strict';const api=factory();root.DeadwallExpeditionSprites159=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 const ASSETS=freeze({expeditionSites159:{url:'assets/art159/expedition-sites.png',width:1536,height:1024,matte:'none'}});
 const CUTS=freeze([[56,69,320,242],[407,75,332,234],[786,69,329,249],[1170,68,321,238],[59,379,291,254],[420,398,313,242],[805,377,297,263],[1185,371,292,275],[45,697,313,249],[414,702,314,242],[803,697,304,246],[1177,696,310,248]]);
 const FAMILIES=freeze(Object.fromEntries(['fuel','garage','supply','archives','medical','ammo'].map((kind,row)=>[kind,[0,1].map(variant=>({atlas:'expeditionSites159',rect:CUTS[row*2+variant],variant}))])));
 function variantFor(seed,identity,kind){let h=(Number.isFinite(seed)?seed>>>0:0)^2166136261;for(const ch of String(identity)+':site159:'+kind)h=Math.imul(h^ch.charCodeAt(0),16777619);h=Math.imul(h^(h>>>16),0x7feb352d);return(h^(h>>>15))>>>0&1;}
 function select(kind,identity,seed=0){return Object.hasOwn(FAMILIES,kind)?FAMILIES[kind][variantFor(seed,identity,kind)]:null;}
 function draw(c,art,d,s,{seed=0}={}){
  const sprite=select(d?.kind,d?.id,seed);
  if(!sprite||!c?.drawImage||!art?.images?.[sprite.atlas]||![d.x,d.y].every(Number.isFinite))return false;
  const r=sprite.rect,scale=Math.min(76/r[2],52/r[3]),w=r[2]*scale,h=r[3]*scale;
  const exhausted=s?.stock&&Object.values(s.stock).every(n=>Number.isFinite(n)&&n<=0);
  c.save();try{
   if(exhausted)c.globalAlpha*=.52;else if(s?.reported)c.globalAlpha*=.84;
   if(art.blit)return art.blit(c,sprite.atlas,r,d.x-w/2,d.y-h/2,w,h)!==false;
   c.drawImage(art.images[sprite.atlas],...r,d.x-w/2,d.y-h/2,w,h);return true;
  }finally{c.restore();}
 }
 return freeze({ASSETS,CUTS,FAMILIES,variantFor,select,draw});
});
