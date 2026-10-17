/* Original top-down animal silhouettes. Gait phase comes from real travel, never wall-clock time. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallWildlifeArt165=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis,function(root){'use strict';
 const TAU=Math.PI*2,SPECIES=Object.freeze(['duck','heron','roeDeer','boar','hare','gull']);
 const COLOURS=Object.freeze({duck:['#655d43','#6b7352','#84735b','#5c6456'],heron:['#919b97','#7d8c8b','#a8ada1','#8b9692'],roeDeer:['#93714c','#aa8359','#806047','#9d7951'],boar:['#554d41','#655b48','#49463f','#736653'],hare:['#8e8066','#a19375','#776e5b','#a0957c'],gull:['#c4c6b7','#b3bcb2','#cfd0bf','#bfc4b8']});
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 function oval(c,x,y,rx,ry,color,a=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.0001,rx),Math.max(.0001,ry),a,0,TAU);c.fill();}
 function line(c,points,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();for(let i=0;i<points.length;i++)i?c.lineTo(...points[i]):c.moveTo(...points[i]);c.stroke();}
 function polygon(c,points,color){c.fillStyle=color;c.beginPath();for(let i=0;i<points.length;i++)i?c.lineTo(...points[i]):c.moveTo(...points[i]);c.closePath();c.fill();}
 function quadruped(c,s,l,w,v,phase){
  const fur=COLOURS[s][v],hoof=s==='hare'?'#69634f':'#3c3b33',step=Math.sin(phase)*l*(s==='hare'?.075:.045),thickness=w*(s==='boar'?.19:.125);
  for(const front of[-1,1])for(const side of[-1,1]){const dx=step*front*side,xx=front*l*.22,yy=side*w*.34;line(c,[[xx,yy*.65],[xx+dx,yy]],hoof,thickness);}
  const body=s==='boar'?[.32,.36]:s==='hare'?[.29,.30]:[.30,.29];oval(c,-l*.06,0,l*body[0],w*body[1],fur);
  oval(c,-l*.09,-w*.045,l*.25,w*.18,v%2?'rgba(220,201,159,.17)':'rgba(31,34,27,.14)');
  if(s==='roeDeer'){
   oval(c,l*.19,0,l*.13,w*.19,fur);oval(c,l*.34,0,l*.13,w*.17,fur);oval(c,l*.435,0,l*.035,w*.095,'#3b4036');
   for(const side of[-1,1])oval(c,l*(v===1?.25:.29),side*w*(v===2?.24:.20),l*(v===3?.09:.075),w*.085,fur,side*(v===2?.75:.42));
   oval(c,-l*.35,0,l*.045,w*.15,'#c4b798');
   if(v===1||v===3)for(const side of[-1,1]){const y=side*w*.15;line(c,[[l*.32,y],[l*.24,side*w*.36],[l*.13,side*w*.40]],'#72694f',w*.035);if(v===3)line(c,[[l*.24,side*w*.35],[l*.25,side*w*.46]],'#72694f',w*.028);}
  }else if(s==='boar'){
   oval(c,l*.19,0,l*.19,w*.27,fur);polygon(c,[[l*.26,-w*.19],[l*.47,-w*.10],[l*.48,w*.10],[l*.26,w*.19]],fur);oval(c,l*.45,0,l*.045,w*.12,'#a18e74');
   for(const side of[-1,1])polygon(c,[[l*.16,side*w*.13],[l*(v===2?.06:.12),side*w*(v===1?.39:.30)],[l*.29,side*w*.21]],fur);
   line(c,[[-l*.29,0],[-l*.37,(v-1.5)*w*.09],[-l*.44,w*.08]],fur,w*.045);
   if(v!==0)for(const side of[-1,1])line(c,[[l*.37,side*w*.11],[l*.41,side*w*(v===3?.22:.17)]],'#c3bda1',w*.035);
   for(let n=0;n<3+v;n++){const x=-l*.23+n*l*.07;line(c,[[x,-w*.09],[x-l*.04,-w*(.17+v*.015)]],'#423f35',w*.025);}
  }else{
   oval(c,-l*.16,0,l*.22,w*.34,fur);oval(c,l*.24,0,l*.16,w*.22,fur);oval(c,l*.38,0,l*.045,w*.09,'#5a5c4c');
   for(const side of[-1,1]){const a=side*(v===0?.24:v===1?.50:v===2?.72:.35),earX=l*(v===2?.14:.11),earY=side*w*(v===3?.27:.21);oval(c,earX,earY,l*(v===3?.16:.20),w*.065,fur,a);oval(c,earX,earY,l*.13,w*.026,'#bdad8e',a);}
   oval(c,-l*.37,0,l*(v===1?.07:.05),w*.12,'#beb79e');
  }
  for(const side of[-1,1])oval(c,l*(s==='boar'?.31:.34),side*w*.11,l*.012,w*.024,'#202b24');
 }
 function bird(c,s,l,w,v,phase){
  const feather=COLOURS[s][v],step=Math.sin(phase)*l*.045;
  if(s==='heron'){
   for(const side of[-1,1])line(c,[[-l*.02,side*w*.12],[-l*.21+step*side,side*w*.36],[-l*.32+step*side,side*w*(v===2?.43:.34)]],'#454f46',w*.045);
   oval(c,-l*.06,0,l*.23,w*.30,feather);for(const side of[-1,1])oval(c,-l*.09,side*w*.105,l*.20,w*.11,'#657b7b',side*.10);
   const bend=(v-1.5)*w*.085;line(c,[[l*.08,0],[l*.20,bend],[l*.32,0]],feather,w*.17);oval(c,l*.34,0,l*.07,w*.12,'#bac0ae');polygon(c,[[l*.38,-w*.035],[l*.50,0],[l*.38,w*.035]],'#b6a171');
   line(c,[[l*.29,-w*.08],[l*(v===1?.17:.22),-w*(v===3?.23:.13)]],'#374c49',w*.04);
  }else{
   const gull=s==='gull';for(const side of[-1,1])line(c,[[l*.02,side*w*.18],[-l*.05+step*side,side*w*.31],[-l*.12+step*side,side*w*.33]],gull?'#a38e66':'#ab9061',w*.07);
   oval(c,-l*.045,0,l*.30,w*(v===1?.31:v===3?.40:.34),feather);polygon(c,[[-l*.25,-w*.15],[-l*(v===2?.48:.42),0],[-l*.25,w*.15]],gull?'#586b69':feather);
   for(const side of[-1,1]){const y=side*w*(v===2?.12:.105);oval(c,-l*(v===3?.10:.04),y,l*(v===1?.20:.24),w*.13,gull?'#929f9c':v===0?'#4d6254':'#575e4d',side*(v===3?.20:.10));if(gull)polygon(c,[[-l*.16,y],[-l*.31,side*w*.19],[-l*.27,side*w*.04]],'#3c5151');}
   oval(c,l*.26,0,l*.14,w*.22,gull?'#d9d8c2':v===0?'#425f4b':feather);polygon(c,[[l*.35,-w*.065],[l*(v===3?.50:.48),0],[l*.35,w*.065]],gull?'#b2a16c':'#c0a46b');
   if(!gull&&v===0)line(c,[[l*.15,-w*.16],[l*.15,w*.16]],'#c7c4a0',w*.045);
  }
  oval(c,l*(s==='heron'?.35:.29),-w*.09,l*.012,w*.023,'#24352d');
 }
 function drawAnimal(c,a,{reducedMotion=false}={}){
  if(a?.id?.startsWith('A189_'))return (root.DeadwallWildlifeArt189||(typeof require==='function'?require('./wildlife-art189.js'):null))?.draw(c,a,{reducedMotion})||false;
  if(!a||!SPECIES.includes(a.species)||!finite(a)||(a.hp??a.health??0)<=0)return false;
  const rule=root.DeadwallCore?.BiomePopulation165Rules?.species?.[a.species],l=a.length??rule?.length,w=a.width??rule?.width;
  if(![l,w,a.a??0].every(Number.isFinite)||l<=0||w<=0)return false;
  const v=Number.isInteger(a.variant)?((a.variant%4)+4)%4:0,phase=a.moving&&!reducedMotion&&Number.isFinite(a.stride165)?a.stride165:0;
  c.save();try{c.translate(a.x,a.y);c.rotate(a.a||0);oval(c,-l*.035,w*.065,l*.40,w*.31,'rgba(18,30,23,.20)');
   if(['roeDeer','boar','hare'].includes(a.species))quadruped(c,a.species,l,w,v,phase);else bird(c,a.species,l,w,v,phase);
  }finally{c.restore();}return true;
 }
 function contacts(g){const list=g?.frontier?.wildlife165?.();return Array.isArray(list)?list:[];}
 function observed(g,v,vision){return v?.z===0?contacts(g).filter(a=>finite(a)&&(a.hp??a.health??0)>0&&(a.z??0)===0&&vision?.canSeeRegional(a)):[];}
 function depthEntries(g,v,view){const vision=g.visibility?.frame?.(),l=view.l??view.left,r=view.r??view.right,t=view.t??view.top,b=view.b??view.bottom;
  return observed(g,v,vision).filter(a=>a.x+(a.length||2)>=l&&a.x-(a.length||2)<=r&&a.y+(a.length||2)>=t&&a.y-(a.length||2)<=b).map(a=>({kind:'wildlife165',id:a.id,depth:a.y,draw:c=>drawAnimal(c,a,{reducedMotion:!!g.settings?.reducedMotion})}));
 }
 function map(c,g,v,cam,vision){let count=0;c.save();try{for(const a of observed(g,v,vision)){const q=cam.screen(a.x,a.y);if(q.x<-4||q.y<-4||q.x>cam.width+4||q.y>cam.height+4)continue;c.fillStyle='#c2b895';c.beginPath();c.moveTo(q.x,q.y-2.5);c.lineTo(q.x+2.5,q.y);c.lineTo(q.x,q.y+2.5);c.lineTo(q.x-2.5,q.y);c.closePath();c.fill();count++;}}finally{c.restore();}return count;}
 return Object.freeze({SPECIES,COLOURS,drawAnimal,depthEntries,observed,map});
});
