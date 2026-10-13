/* Separate mechanical parts. Their owners supply simulation-time presentation. */
(function(root,factory){
 'use strict';const api=factory();root.DeadwallTrapArt159=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ASSETS=Object.freeze({
  trap159MechanismsA:Object.freeze({url:'assets/art159/traps-mechanisms-a.png',width:1536,height:1024,matte:'none'}),
  trap159MechanismsB:Object.freeze({url:'assets/art159/traps-mechanisms-b.png',width:1536,height:1024,matte:'none'}),
  trap159SuppliesA:Object.freeze({url:'assets/art159/traps-supplies-a.png',width:1536,height:1024,matte:'none'}),
  trap159SuppliesB:Object.freeze({url:'assets/art159/traps-supplies-b.png',width:1536,height:1024,matte:'none'})
 });
 const MECHANISM_TYPES=Object.freeze(['ankle','blades','guideRail','ratchet','clamp','counterweight']);
 const SUPPLY_TYPES=Object.freeze(['spikes','net','ammo','repair','work','regulator']);
 const PHASES=Object.freeze(['armed','trigger','action','held','return','exhausted']);
 const freezeCuts=rows=>Object.freeze(rows.map(Object.freeze));
 // Tight measured alpha bounds retain the raw originals, including their
 // intentionally uneven gutters. No nominal grid can cut a neighbouring jaw.
 const CUTS=Object.freeze({
  trap159MechanismsA:freezeCuts([[30,161,253,178],[314,50,133,288],[599,50,123,287],[762,130,255,207],[1033,194,303,83],[1349,214,157,62],[18,466,274,111],[314,487,217,136],[558,479,188,103],[768,421,245,198],[1026,479,297,90],[1336,428,181,158],[19,704,277,246],[324,715,189,223],[573,715,186,223],[762,761,244,168],[1007,747,370,114],[1380,679,122,274]]),
  trap159MechanismsB:freezeCuts([[87,23,424,145],[624,33,275,129],[1056,33,275,129],[101,199,372,122],[607,201,474,110],[1152,227,324,65],[86,353,424,106],[634,346,367,118],[1136,345,326,118],[111,492,377,148],[655,490,403,143],[1126,512,345,107],[66,657,467,154],[633,651,335,154],[1131,658,329,146],[78,836,443,148],[591,875,579,83],[1227,848,263,133]]),
  trap159SuppliesA:freezeCuts([[18,161,349,109],[403,136,355,153],[810,94,326,231],[1206,110,307,207],[17,417,345,232],[403,432,347,186],[798,421,336,225],[1181,438,336,198],[15,736,349,232],[392,776,389,144],[890,757,184,190],[1226,775,292,168]]),
  trap159SuppliesB:freezeCuts([[22,135,350,126],[402,105,361,140],[797,64,351,231],[1200,73,297,218],[22,412,349,225],[409,429,346,191],[787,398,351,250],[1176,409,341,222],[28,720,344,238],[406,811,348,65],[819,714,278,245],[1212,753,303,169]])
 });
 function hash(seed,id,family){let value=(Number.isFinite(seed)?seed>>>0:0)^2166136261;const text=String(id??'')+':'+family;for(let i=0;i<text.length;i++)value=Math.imul(value^text.charCodeAt(i),16777619);value=Math.imul(value^(value>>>16),0x7feb352d);value=Math.imul(value^(value>>>15),0x846ca68b);return(value^(value>>>16))>>>0;}
 function variantFor(seed,id,family,variant){return Number.isInteger(variant)?((variant%2)+2)%2:hash(seed,id,family)%2;}
 function partsFor(kind,id,{seed=0,variant}={}){
  let types,keys,count;if(MECHANISM_TYPES.includes(kind)){types=MECHANISM_TYPES;keys=['trap159MechanismsA','trap159MechanismsB'];count=3;}else if(SUPPLY_TYPES.includes(kind)){types=SUPPLY_TYPES;keys=['trap159SuppliesA','trap159SuppliesB'];count=2;}else return null;
  const form=variantFor(seed,id,'trap:'+kind,variant),atlas=keys[form],row=types.indexOf(kind);
  return Object.freeze({kind,variant:form,atlas,parts:Object.freeze(Array.from({length:count},(_,n)=>Object.freeze({atlas,rect:CUTS[atlas][row*count+n],role:n===0?'base':'mobile'+n}))) });
 }
 const clamp01=value=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
 function mechanismMotion(view,reduced){if(!view||!PHASES.includes(view.phase))return 0;if(reduced)return ['trigger','action','held'].includes(view.phase)?1:0;return clamp01(view.motion);}
 function contactMotion(view,reduced){if(!view||!['action','return','service'].includes(view.phase))return 0;if(reduced)return view.phase==='return'?0:1;return clamp01(view.motion);}
 function ownerFrame(b,{construction=false}={}){
  if(!b||b.dead||!construction&&!b.completed||![b.left,b.top,b.right,b.bottom].every(Number.isFinite)||b.right<=b.left+6||b.bottom<=b.top+6)return null;
  const angle=Number.isInteger(b.rotation)?((b.rotation%4)+4)%4:0,w=b.right-b.left-6,h=b.bottom-b.top-6;
  return{x:(b.left+b.right)/2,y:(b.top+b.bottom)/2,w:angle%2?h:w,h:angle%2?w:h,angle:angle*Math.PI/2};
 }
 function available(c,art,sets){return !!(c?.drawImage&&c?.save&&c?.restore&&sets.every(s=>s&&art?.images?.[s.atlas]));}
 function paint(c,art,p,x,y,w,h,angle=0,pivot=[.5,.5],foldY=1){
  if(!(w>0&&h>0))return false;const r=p.rect,scale=Math.min(w/r[2],h/r[3]),dw=r[2]*scale,dh=r[3]*scale;
  c.save();c.translate(x,y);if(angle)c.rotate(angle);if(foldY!==1)c.scale(1,foldY);
  try{if(art.blit)return !!art.blit(c,p.atlas,r,-dw*pivot[0],-dh*pivot[1],dw,dh);c.drawImage(art.images[p.atlas],...r,-dw*pivot[0],-dh*pivot[1],dw,dh);return true;}finally{c.restore();}
 }
 function onOwner(c,frame,draw){c.save();c.translate(frame.x,frame.y);c.rotate(frame.angle);c.beginPath();c.rect(-frame.w/2,-frame.h/2,frame.w,frame.h);c.clip();try{return draw(frame.w,frame.h);}finally{c.restore();}}
 function drawMechanism(c,art,b,m,options={}){
  if(!m||!MECHANISM_TYPES.includes(m.kind))return false;const f=ownerFrame(b),set=partsFor(m.kind,b?.id,options);if(!f||!available(c,art,[set]))return false;
  const view=options.presentation,motion=mechanismMotion(view,!!options.reducedMotion),exhausted=view?.phase==='exhausted'||!view&&m.charges<=0;
  return onOwner(c,f,(w,h)=>{
   if(exhausted)c.globalAlpha*=.43;const [base,one,two]=set.parts;paint(c,art,base,0,0,w,h);
   if(m.kind==='ankle'){const a=set.variant===0,height=h*(a?.55:.75);paint(c,art,one,-w*.25,0,w*.54,height,-.48+motion*(a?1.2:.72),a?[.2,.89]:[.1,.6]);paint(c,art,two,w*.25,0,w*.54,height,.48-motion*(a?1.2:.72),a?[.8,.89]:[.9,.6]);}
   else if(m.kind==='blades'){paint(c,art,one,0,0,w*.52,h*.55,-.13+motion*Math.PI*.8,[.08,.5]);paint(c,art,two,0,0,w*.38,h*.46,Math.PI+.13-motion*Math.PI*.58,[.08,.5]);}
   else if(m.kind==='guideRail'){paint(c,art,one,-w*.21+motion*w*.39,0,w*.43,h*.64,Math.PI/2);paint(c,art,two,w*.2-motion*w*.3,0,w*.27,h*.65);}
   else if(m.kind==='ratchet'){paint(c,art,one,-w*.27,0,w*.53,h*.55,-.24+motion*.72,[.1,.5]);paint(c,art,two,w*.22-motion*w*.08,0,w*.35*(1-motion*.24),h*.7);}
   else if(m.kind==='clamp'){const a=set.variant===0;paint(c,art,one,-w*.25,0,w*.54,h*.67,-.46+motion*.7,a?[.16,.58]:[.1,.6]);paint(c,art,two,w*.25,0,w*.54,h*.67,.46-motion*.7,a?[.84,.58]:[.9,.6]);}
   else{paint(c,art,one,-w*.15,0,w*.6,h*.58,-.2+motion*.55,[.06,.5]);paint(c,art,two,w*.3-motion*w*.16,-h*.17+motion*h*.34,w*.25,h*.55);}
   return true;
  });
 }
 function drawSpikes(c,art,b,options={}){
  if(b?.type!=='spikes')return false;const f=ownerFrame(b),set=partsFor('spikes',b.id,options);if(!f||!available(c,art,[set]))return false;const motion=contactMotion(options.presentation,!!options.reducedMotion);
  return onOwner(c,f,(w,h)=>{paint(c,art,set.parts[0],0,0,w,h);paint(c,art,set.parts[1],-motion*w*.035,motion*h*.065,w*.9,h*.72,-motion*.08);return true;});
 }
 function drawNet(c,art,b,options={}){
  const view=options.presentation;if(!view||!(view.remaining>0)&&!['action','return'].includes(view.phase))return false;const f=ownerFrame(b),set=partsFor('net',b?.id,options);if(!f||!available(c,art,[set]))return false;const motion=contactMotion(view,!!options.reducedMotion);
  return onOwner(c,f,(w,h)=>{if(view.remaining<=0)c.globalAlpha*=Math.max(.15,1-clamp01(view.progress));paint(c,art,set.parts[0],0,0,w,h);paint(c,art,set.parts[1],motion*w*.035,motion*h*.07,w*.9*(1-motion*.11),h*.79*(1-motion*.13));return true;});
 }
 function preparationSlots(view){
  if(!view||typeof view!=='object')return [];
  const slots=[];
  if(view.ammo>0)slots.push({kind:'ammo',bank:0,slot:0,motion:0});
  if(view.repair>0)slots.push({kind:'repair',bank:0,slot:1,motion:0});
  if(view.regulator)slots.push({kind:'regulator',bank:0,slot:2,motion:0,heading:0});
  if(view.maintenance&&Object.values(view.maintenance.remaining||{}).some(n=>n>0))slots.push({kind:'repair',bank:1,slot:0,view:view.maintenance});
  if(view.work?.remaining>0)slots.push({kind:'work',bank:1,slot:1,view:view.work});
  if(view.gate)slots.push({kind:'regulator',bank:1,slot:2,motion:0,heading:view.gate.enabled?Math.PI*.15:-Math.PI*.4});
  return slots;
 }
 function drawPreparation(c,art,b,options={}){
  const slots=preparationSlots(options.presentation),f=ownerFrame(b,{construction:slots.some(s=>s.kind==='work')});if(!slots.length||!f)return false;
  const sets=slots.map(s=>partsFor(s.kind,b.id,options));if(!available(c,art,sets))return false;
  return onOwner(c,f,(w,h)=>{
   const sw=Math.min(23,w*.29),sh=Math.min(12,h*.29);
   // The legacy defense badges occupy the lower fourteen pixels. Its reserve
   // pieces sit above those badges, in a second bank below the ammo fittings.
   slots.forEach((slot,i)=>{const x=(slot.slot-1)*w*.32,y=(slot.bank===0?-.31:0)*h,motion=slot.view?contactMotion(slot.view,!!options.reducedMotion):slot.motion;
    const base=sets[i].parts[0],ratio=Math.min(sw/base.rect[2],sh/base.rect[3]),bw=base.rect[2]*ratio,bh=base.rect[3]*ratio;
    paint(c,art,base,x,y,bw,bh);
    if(slot.kind==='regulator')paint(c,art,sets[i].parts[1],x,y,bw*.7,bh*.8,slot.heading||0);
    else paint(c,art,sets[i].parts[1],x,y-motion*bh*.24,bw*.95,bh*.78,slot.kind==='work'?motion*.22:0,[.5,.5],slot.kind==='work'?1:1-motion*.68);
   });return true;
  });
 }
 return Object.freeze({ASSETS,CUTS,MECHANISM_TYPES,SUPPLY_TYPES,PHASES,hash,variantFor,partsFor,ownerFrame,mechanismMotion,contactMotion,preparationSlots,drawMechanism,drawSpikes,drawNet,drawPreparation});
});
