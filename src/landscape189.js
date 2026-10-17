/* Continuous, seed-keyed fields. No chunk RNG, global provider mutation or save writes. */
(function(root){'use strict';
 const core=()=>root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 function normalize(value){const key=value===undefined?'classic':value;if(typeof key!=='string'||!Object.hasOwn(core().Landscape189Rules.presets,key))throw Error('Profil de paysage189 invalide.');return key;}
 function create({base,seed,preset='balanced'}={}){
  preset=normalize(preset);if(!base?.noise||!base?.hash||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Graine ou fournisseur de paysage189 invalide.');
  if(preset==='classic')return base;
  const R=core().Landscape189Rules,k=R.climate,unit=(...key)=>base.hash(seed,'landscape189',...key)/4294967296;
  const scale=R.presets[preset].scale*(k.seedScaleRange[0]+unit('size')*(k.seedScaleRange[1]-k.seedScaleRange[0]));
  const angle=unit('rotation')*Math.PI*2,cos=Math.cos(angle),sin=Math.sin(angle),offsetX=unit('offset-x')*32000,offsetY=unit('offset-y')*32000;
  function field(salt,x,y){let value=0,total=0,weight=1;for(let i=0;i<k.octaves;i++){value+=base.noise(seed^salt^(i*1013),x,y,k.scale*scale/2**i)*weight;total+=weight;weight*=k.persistence;}return value/total;}
  function climate(sampleSeed,x,y){
   if(sampleSeed!==seed||!Number.isFinite(x)||!Number.isFinite(y))throw Error('Coordonnées ou graine du paysage189 incompatibles.');
   const px=x*cos-y*sin+offsetX,py=x*sin+y*cos+offsetY;
   const wx=px+(base.noise(seed^189017,px,py,k.warpScale*scale)-.5)*k.warpAmplitude*scale;
   const wy=py+(base.noise(seed^189037,px,py,k.warpScale*scale)-.5)*k.warpAmplitude*scale;
   const channel=salt=>Math.max(0,Math.min(1,.5+(field(salt,wx,wy)-.5)*k.contrast));
   return{temperature:channel(189101),moisture:channel(189107),elevation:channel(189121)};
  }
  return Object.freeze({...base,climate,landscape189:preset,landscapeScale189:scale});
 }
 const api=Object.freeze({normalize,create});root.DeadwallLandscape189=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
