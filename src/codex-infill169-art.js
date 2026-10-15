/* Original procedural silhouettes for newly supported static source props. */
(function(root,factory){'use strict';const api=factory();root.DeadwallCodexInfill169Art=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const KINDS=Object.freeze(['bin','cabinet','locker','stretcher','fuel_can']);
 function draw(c,o){
  if(!c||!KINDS.includes(o?.kind)||![o.x,o.y,o.w,o.h].every(Number.isFinite)||o.w<=0||o.h<=0)return false;
  c.save();try{
   c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.translate(o.x,o.y);c.scale(o.w,o.h);
   const fill=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
   const edge=(x,y,w,h,color,line=.035)=>{c.strokeStyle=color;c.lineWidth=line;c.strokeRect(x,y,w,h);};
   fill(.04,.04,.93,.94,'rgba(12,24,21,.38)');
   if(o.kind==='bin'){
    fill(.12,.12,.76,.72,'#687564');fill(.08,.07,.84,.16,'#83907a');fill(.19,.12,.62,.045,'#b6baa0');
    fill(.13,.82,.15,.13,'#263b32');fill(.72,.82,.15,.13,'#263b32');edge(.12,.18,.76,.66,'#3b5145');
    for(let i=0;i<3;i++)fill(.24+i*.21,.32,.025,.38,'#96a08a');fill(.35,.06,.30,.035,'#24392e');
   }else if(o.kind==='locker'){
    fill(.07,.03,.86,.91,'#6c7a74');fill(.14,.08,.72,.81,'#89978a');edge(.14,.08,.72,.81,'#314c43');
    for(let i=0;i<4;i++){fill(.25,.16+i*.065,.50,.025,'#3a584d');fill(.25,.65+i*.04,.50,.016,'#425e51');}
    fill(.68,.43,.08,.18,'#d2c4a2');fill(.65,.93,.14,.05,'#3a4a43');fill(.16,.93,.14,.05,'#3a4a43');
   }else if(o.kind==='cabinet'){
    fill(.04,.05,.92,.90,'#607871');fill(.10,.10,.80,.80,'#91a096');edge(.10,.10,.80,.80,'#30483f');
    fill(.49,.10,.025,.8,'#39584b');fill(.39,.44,.035,.21,'#d3cdb5');fill(.57,.44,.035,.21,'#d3cdb5');
    fill(.17,.19,.20,.16,'#3d5650');fill(.65,.21,.15,.08,'#b8aa73');
    for(let i=0;i<3;i++)fill(.15,.70+i*.055,.25,.023,'#496759');
   }else if(o.kind==='stretcher'){
    fill(.08,.18,.84,.64,'#bac0ab');fill(.12,.25,.74,.49,'#6b8b7d');fill(.13,.26,.19,.46,'#ddd5b8');
    edge(.10,.16,.8,.68,'#9fae9e',.05);fill(.35,.17,.38,.05,'#d0c4a6');fill(.35,.80,.38,.05,'#d0c4a6');
    for(const x of [.13,.77]){fill(x,.04,.09,.13,'#263b31');fill(x,.84,.09,.13,'#263b31');}
    fill(.045,.33,.04,.35,'#c1c8ae');fill(.92,.33,.035,.35,'#c1c8ae');fill(.43,.30,.025,.37,'#455f51');
   }else{
    fill(.13,.15,.76,.78,'#8c8a63');edge(.14,.17,.72,.71,'#515a3e');fill(.29,.02,.38,.14,'#a5a078');fill(.38,.05,.20,.06,'#2b4131');
    fill(.74,.13,.14,.13,'#404d37');fill(.26,.35,.50,.06,'#b7ae7e');fill(.26,.68,.50,.05,'#b7ae7e');
    c.strokeStyle='#656d4c';c.lineWidth=.035;c.beginPath();c.moveTo(.25,.34);c.lineTo(.74,.74);c.moveTo(.74,.34);c.lineTo(.25,.74);c.stroke();
   }
   return true;
  }finally{c.restore();}
 }
 return Object.freeze({KINDS,draw});
});
