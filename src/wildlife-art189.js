/* Original procedural silhouettes for the expanded roster, in world metres. */
(function(root){'use strict';
 const core=()=>root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 const legacyColors=()=>root.DeadwallWildlifeArt165?.COLOURS||(typeof require==='function'?require('./wildlife-art165.js').COLOURS:null);
 const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.001,rx),Math.max(.001,ry),0,0,Math.PI*2);c.fill();};
 const path=(c,points,color,width=0)=>{c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(width){c.strokeStyle=color;c.lineWidth=width;c.stroke();}else{c.closePath();c.fillStyle=color;c.fill();}};
 function draw(c,a,{reducedMotion=false,corpse=false}={}){
  const R=core()?.Landscape189Rules,W=root.DeadwallWildlife189||(typeof require==='function'?require('./wildlife189.js'):null),d=W?.species()[a?.species];
  if(!d||!(a.id?.startsWith('A189_')||/^B191_[1-9]\d*$/.test(a.id||''))||![a.x,a.y,a.a??0].every(Number.isFinite)||!corpse&&(a.hp??0)<=0)return false;
  const l=d.length,w=d.width,v=Number.isInteger(a.variant)?((a.variant%4)+4)%4:0,colors=d.colors||legacyColors()?.[a.species]||['#826c4d','#96805e','#6e5f48','#ab9470'];
  const fur=colors[v],dark='#343e34',light='#c5bb9c',phase=!corpse&&a.moving&&!reducedMotion&&Number.isFinite(a.stride165)?a.stride165:0,s=Math.sin(phase),flying=!corpse&&d.mode==='air'&&a.moving;
  c.save();try{
   if(corpse)c.globalAlpha*=.62;c.translate(a.x,a.y);oval(c,0,w*.1,l*.4,w*.4,'rgba(15,24,18,.2)');if(flying)c.translate(0,-R.population.flightHeight);c.rotate(a.a||0);
   if(d.shape==='fish'){
    oval(c,0,0,l*.36,w*.45,fur);path(c,[[-l*.26,0],[-l*.5,-w*(.5+s*.14)],[-l*.5,w*(.5-s*.14)]],dark);
    path(c,[[0,0],[-l*.09,-w*.75],[l*.1,-w*.21]],fur);oval(c,l*.24,-w*.12,l*.025,w*.04,dark);
   }else if(d.shape==='frog'){
    for(const side of [-1,1])path(c,[[-l*.05,side*w*.22],[-l*.42,side*w*(.7+s*.14)],[-l*.44,side*w*.12]],fur,w*.14);
    oval(c,0,0,l*.3,w*.3,fur);oval(c,l*.26,0,l*.2,w*.28,fur);for(const side of[-1,1])oval(c,l*.3,side*w*.2,l*.04,w*.055,dark);
   }else if(d.shape==='bat'){
    // Membrane wings and ears keep the mammal distinct from a beaked bird.
    for(const side of[-1,1]){
     const span=flying?w*(.78+Math.abs(s)*.38):w*.35;
     path(c,[[l*.12,side*w*.08],[-l*.06,side*span],[-l*.30,side*span*.62],[-l*.18,side*w*.08]],fur);
     if(flying)path(c,[[l*.1,side*w*.08],[-l*.06,side*span],[-l*.15,side*span*.49]],light,w*.022);
     oval(c,l*.2,side*w*.12,l*.09,w*.075,fur);
    }
    oval(c,-l*.08,0,l*.30,w*.15,fur);oval(c,l*.24,0,l*.16,w*.13,fur);
    for(const side of[-1,1])oval(c,l*.3,side*w*.06,l*.018,w*.025,dark);
   }else if(['bird','duck','heron','gull','owl','pheasant'].includes(d.shape)){
    if(flying){const wing=l*(d.shape==='bat'?1.4:1.0)*(1+Math.abs(s)*.35);
     for(const side of[-1,1])path(c,[[l*.1,side*w*.12],[-l*.12,side*wing],[-l*.42,side*wing*.7],[-l*.2,side*w*.05]],fur);
    }else for(const side of[-1,1]){
     const footX=-l*.09+s*side*l*(d.shape==='duck'?.08:.03),footY=side*w*.42;
     path(c,[[0,side*w*.14],[footX,footY]],dark,w*.06);
     if(d.shape==='duck')path(c,[[footX,footY],[footX+l*.06,footY+side*w*.1],[footX-l*.04,footY+side*w*.1]],'#a58b59');
    }
    oval(c,-l*.07,0,l*.30,w*.36,fur);oval(c,l*.26,0,l*(d.shape==='owl'?.2:.13),w*.24,d.shape==='owl'?light:fur);
    path(c,[[l*.35,-w*.04],[l*(d.shape==='heron'?.65:.47),0],[l*.35,w*.04]],'#ab9870');
    const tail=d.shape==='pheasant'?l*.72:l*.46;path(c,[[-l*.25,-w*.12],[-tail,0],[-l*.25,w*.12]],dark);
    if(d.shape==='owl')for(const side of[-1,1])oval(c,l*.29,side*w*.10,l*.045,w*.05,dark);else oval(c,l*.30,-w*.12,l*.024,w*.03,dark);
   }else{
    for(const front of[-1,1])for(const side of[-1,1])path(c,[[front*l*.20,side*w*.17],[front*l*.20+s*front*side*l*.035,side*w*.48]],dark,w*.105);
    oval(c,-l*.07,0,l*.32,w*.35,fur);oval(c,l*.28,0,l*.17,w*.23,fur);oval(c,l*.43,0,l*.045,w*.08,dark);
    for(const side of[-1,1])oval(c,l*.22,side*w*.25,d.shape==='hare'?l*.15:l*.06,w*.085,fur);
    if(['fox','squirrel','otter','beaver'].includes(d.shape)){
     const thick=d.shape==='beaver'?.23:d.shape==='squirrel'?.24:.14;
     path(c,[[-l*.26,0],[-l*.49,w*.13],[-l*.72,w*(.2+s*.12)]],d.shape==='beaver'?dark:fur,l*thick);
     if(d.shape==='fox')oval(c,-l*.72,w*(.2+s*.12),l*.065,w*.14,light);
    }
    if(d.shape==='badger')for(const side of[-1,1])path(c,[[l*.15,side*w*.1],[l*.41,side*w*.06]],light,w*.10);
    if(d.shape==='hedgehog')for(let i=0;i<9;i++){const x=-l*.32+i*l*.065;path(c,[[x,-w*.12],[x-l*.07,-w*.37]],dark,w*.035);}
    if(['horned','antlered'].includes(d.shape))for(const side of[-1,1]){path(c,[[l*.27,side*w*.14],[l*.14,side*w*.49],[l*.06,side*w*.39]],light,w*.055);if(d.shape==='antlered')path(c,[[l*.15,side*w*.43],[l*.23,side*w*.58]],light,w*.035);}
    oval(c,l*.32,-w*.12,l*.02,w*.028,dark);
   }
  }finally{c.restore();}return true;
 }
 const api=Object.freeze({draw});root.DeadwallWildlifeArt189=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
