/* In-world enclosures and upper-body work cues; no new fullscreen overlay. */
(function(root){'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Husbandry191Rules;
const Wildlife=root.DeadwallWildlifeArt189||(typeof require==='function'?require('./wildlife-art189.js'):null);
const Geometry=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
function stroke(c,points,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
function drawPen(c,p,animals,{reducedMotion=false,worldSeed=0}={}){if(!finitePoint(p)||!Array.isArray(animals))return false;c.save();try{const k=R.penSize/2;c.fillStyle=p.health>0?'rgba(124,107,65,.32)':'rgba(68,61,43,.25)';c.fillRect(p.x-k,p.y-k,R.penSize,R.penSize);
 for(const[dx,dy]of[[-k,-k],[k,-k],[k,k],[-k,k]]){c.fillStyle='#786f50';c.fillRect(p.x+dx-.06,p.y+dy-.36,.12,.4);}
 if(p.health>0){
  stroke(c,[[p.x-k,p.y+k],[p.x-k,p.y-k],[p.x+k,p.y-k],[p.x+k,p.y+k],[p.x+.4,p.y+k]],'#b7ab7b',.08);
  stroke(c,[[p.x-k,p.y+k],[p.x-.4,p.y+k]],'#b7ab7b',.08);
  stroke(c,[[p.x-.4,p.y+k],[p.x+.4,p.y+k]],'#667d63',.07);
 }else{
  // A destroyed pen has no blocking fence: show actual gaps, not an intact dark cage.
  for(const dx of[-k,k])for(const dy of[-k,k])stroke(c,[[p.x+dx,p.y+dy],[p.x+dx-Math.sign(dx)*.42,p.y+dy-Math.sign(dy)*.14]],'#625d48',.08);
  for(const[dx,dy]of[[-.9,-.8],[.65,-.6],[-.5,.8]])stroke(c,[[p.x+dx,p.y+dy],[p.x+dx+.42,p.y+dy+.17]],'#7b7050',.06);
 }
 for(let i=0;i<Math.min(animals.length,R.penCapacity);i++){const a=animals[i],x=p.x+((i%2)-.5)*1.1,y=p.y+(Math.floor(i/2)-.5)*1.0;
  const id=a.source||'B191_'+a.id,variant=a.source?Geometry.hash(worldSeed,a.source,'appearance')%4:a.id%4;
  c.save();c.translate(x,y);if(a.age<R.matureSeconds)c.scale(.6,.6);Wildlife.draw(c,{...a,id,x:0,y:0,a:0,hp:a.health,stride165:0,moving:false,variant},{reducedMotion});c.restore();}
 c.fillStyle='#2f4d49';c.fillRect(p.x-k-.35,p.y-.35,.3,.6);c.fillStyle='#91b3a4';c.fillRect(p.x-k-.32,p.y-.32,.24,.54*p.water/R.stockCapacity);
 c.fillStyle='#756547';c.fillRect(p.x+k+.05,p.y-.35,.35,.6);c.fillStyle='#bdab73';c.fillRect(p.x+k+.08,p.y-.32,.29,.54*p.food/R.stockCapacity);
 c.fillStyle='#c9c2a6';c.font='.24px sans-serif';c.textAlign='center';c.fillText('ENCLOS '+p.id+(p.health>0?'':' · DÉTRUIT'),p.x,p.y-k-.28);
 if(p.meat>0){c.fillStyle='#985a45';c.fillRect(p.x+k+.12,p.y+.5,.22,.18);}
 if(p.hides>0){c.fillStyle='#756045';c.fillRect(p.x+k+.08,p.y+.75,.32,.18);}
 if(p.leather>0){c.fillStyle='#ab895d';c.fillRect(p.x+k+.08,p.y+1,.32,.18);}
}finally{c.restore();}return true;}
function drawConstruction(c,task){
 if(!['build','rebuild'].includes(task?.kind)||!finitePoint(task.point)||!Number.isFinite(task.progress)||task.progress<0||task.progress>1)return false;
 const {x,y}=task.point,k=R.penSize/2,progress=task.progress;
 c.save();try{
  c.fillStyle='rgba(159,139,89,.13)';c.fillRect(x-k,y-k,R.penSize,R.penSize);
  c.setLineDash([.13,.1]);c.strokeStyle='#b8aa78';c.lineWidth=.035;c.strokeRect(x-k,y-k,R.penSize,R.penSize);c.setLineDash([]);
  for(const[dx,dy]of[[-k,-k],[k,-k],[k,k],[-k,k]]){c.fillStyle='#8f7d53';c.fillRect(x+dx-.055,y+dy-.10-.26*progress,.11,.14+.26*progress);}
  const points=[[x-k,y+k],[x-k,y-k],[x+k,y-k],[x+k,y+k]];
  for(let i=0;i<points.length-1;i++){const part=Math.max(0,Math.min(1,progress*3-i));if(!part)continue;const a=points[i],b=points[i+1];stroke(c,[a,[a[0]+(b[0]-a[0])*part,a[1]+(b[1]-a[1])*part]],'#b7ab7b',.065);}
  c.fillStyle='#d0c59e';c.font='.22px sans-serif';c.textAlign='center';c.fillText((task.kind==='rebuild'?'RECONSTRUCTION ':'CHANTIER ')+Math.floor(progress*100)+' %',x,y-k-.28);
 }finally{c.restore();}return true;
}
function drawWork(c,work,{reducedMotion=false}={}){if(!finitePoint(work)||!['slaughter','harvest','capture','cook','tan','build','rebuild','water','repair','fill-bucket','water-carried'].includes(work.kind)||!Number.isFinite(work.progress)||work.progress<0||work.progress>1||!Number.isFinite(work.a??0))return false;const phase=reducedMotion?0:Math.sin(work.progress*Math.PI*18)*.09;
 c.save();try{c.translate(work.x,work.y);c.rotate(work.a||0);
 // Forearms attached to fixed shoulder anchors, tool held at the moving right hand.
 stroke(c,[[0,-.22],[.18,-.22],[.44+phase,-.08]],'#899279',.12);stroke(c,[[0,.22],[.21,.21],[.40+phase,.12]],'#899279',.12);
 for(const[x,y]of[[.44+phase,-.08],[.40+phase,.12]]){c.fillStyle='#b7a182';c.beginPath();c.arc(x,y,.047,0,Math.PI*2);c.fill();}
 if(['slaughter','harvest'].includes(work.kind))stroke(c,[[.4+phase,.12],[.67+phase,.15]],'#c2c8bb',.04);
 else if(work.kind==='capture'){
  stroke(c,[[.4+phase,.12],[.77+phase,.02]],'#9f8958',.04);c.save();c.translate(.95+phase,-.03);
  c.strokeStyle='#c2b486';c.lineWidth=.028;c.beginPath();c.ellipse(0,0,.23,.27,0,0,Math.PI*2);c.stroke();
  c.beginPath();c.ellipse(0,0,.23,.27,0,0,Math.PI*2);c.clip();for(let j=-2;j<=2;j++){stroke(c,[[j*.1,-.3],[j*.1,.3]],'#b4aa85',.012);stroke(c,[[-.3,j*.1],[.3,j*.1]],'#b4aa85',.012);}c.restore();
 }else if(work.kind==='cook'){c.fillStyle='#303b33';c.beginPath();c.arc(.7,0,.22,0,Math.PI*2);c.fill();stroke(c,[[.55,-.02],[.85,-.02]],'#c38347',.08);stroke(c,[[.4+phase,.12],[.7+phase*.6,-.03]],'#a99b74',.035);
 }else if(work.kind==='tan'){c.fillStyle='#977b53';c.fillRect(.5,-.18,.35,.36);stroke(c,[[.4+phase,.12],[.65+phase,0]],'#c3c7ac',.045);
 }else if(work.kind==='build'||work.kind==='rebuild'||work.kind==='repair'){stroke(c,[[.4+phase,.12],[.64+phase,-.02]],'#aa8c59',.045);stroke(c,[[.57+phase,-.10],[.71+phase,.05]],'#87948b',.09);
 }else if(['water','fill-bucket','water-carried'].includes(work.kind)){stroke(c,[[.4+phase,.12],[.60+phase,.08]],'#b6bdab',.025);c.fillStyle='#697e74';c.fillRect(.51+phase,.08,.22,.24);stroke(c,[[.53+phase,.12],[.71+phase,.12]],'#a1beb1',.025);}
}finally{c.restore();}return true;}
function depthEntries(g,v,view){if(v?.z!==0||!g.husbandry191)return[];const state=g.husbandry191.view(),vision=g.visibility?.frame?.(),entries=[];
 const l=view.l??view.left,r=view.r??view.right,t=view.t??view.top,b=view.b??view.bottom,onscreen=p=>p.x+3>=l&&p.x-3<=r&&p.y+3>=t&&p.y-3<=b;
 for(const p of state.pens)if(onscreen(p)&&vision?.canSeeRegionalPoint?.(p))entries.push({kind:'husbandry191',id:'pen191:'+p.id,depth:p.y+1.5,draw:c=>drawPen(c,p,state.animals.filter(a=>a.pen===p.id&&['held','stranded'].includes(a.status)),{reducedMotion:!!g.settings?.reducedMotion,worldSeed:g.world?.seed??0})});
 const task=state.task||g.wildHarvest190?.overview().task;
 if(['build','rebuild'].includes(task?.kind)&&finitePoint(task.point)&&onscreen(task.point)&&vision?.canSeeRegionalPoint?.(task.point))entries.push({kind:'husbandry191-construction',id:'construction191',depth:task.point.y+1.51,draw:c=>drawConstruction(c,task)});
 if(task&&task.kind!=='fish'){const p=g.frontier.position();entries.push({kind:'husbandry191-work',id:'work191',depth:p.y+.02,draw:c=>drawWork(c,{...task,x:p.x,y:p.y,a:p.a},{reducedMotion:!!g.settings?.reducedMotion})});}return entries;
}
const api=Object.freeze({drawPen,drawConstruction,drawWork,depthEntries});root.DeadwallHusbandryArt191=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
