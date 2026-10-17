/* In-world cage/cookery and upper-body work cues; no new fullscreen overlay. */
(function(root){'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Husbandry191Rules;
const Wildlife=root.DeadwallWildlifeArt189||(typeof require==='function'?require('./wildlife-art189.js'):null);
function stroke(c,points,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
function drawPen(c,p,animals,{reducedMotion=false}={}){c.save();try{const k=R.penSize/2;c.fillStyle=p.health>0?'rgba(124,107,65,.32)':'rgba(68,61,43,.25)';c.fillRect(p.x-k,p.y-k,R.penSize,R.penSize);
 for(const[dx,dy]of[[-k,-k],[k,-k],[k,k],[-k,k]]){c.fillStyle='#786f50';c.fillRect(p.x+dx-.06,p.y+dy-.36,.12,.4);}
 stroke(c,[[p.x-k,p.y+k],[p.x-k,p.y-k],[p.x+k,p.y-k],[p.x+k,p.y+k],[p.x+.4,p.y+k]],p.health>0?'#b7ab7b':'#625d48',.08);
 stroke(c,[[p.x-k,p.y+k],[p.x-.4,p.y+k]],'#b7ab7b',.08);
 if(p.health>0)stroke(c,[[p.x-.4,p.y+k],[p.x+.4,p.y+k]],'#667d63',.07);
 for(let i=0;i<animals.length;i++){const a=animals[i],x=p.x+((i%2)-.5)*1.1,y=p.y+(Math.floor(i/2)-.5)*1.0;
  c.save();c.translate(x,y);if(a.age<R.matureSeconds)c.scale(.6,.6);Wildlife.draw(c,{...a,id:a.source||'B191_'+a.id,x:0,y:0,a:0,hp:a.health,stride165:0,moving:false,variant:a.id%4},{reducedMotion});c.restore();}
 c.fillStyle='#2f4d49';c.fillRect(p.x-k-.35,p.y-.35,.3,.6);c.fillStyle='#91b3a4';c.fillRect(p.x-k-.32,p.y-.32,.24,.54*p.water/R.stockCapacity);
 c.fillStyle='#756547';c.fillRect(p.x+k+.05,p.y-.35,.35,.6);c.fillStyle='#bdab73';c.fillRect(p.x+k+.08,p.y-.32,.29,.54*p.food/R.stockCapacity);
 c.fillStyle='#c9c2a6';c.font='.24px sans-serif';c.textAlign='center';c.fillText('ENCLOS '+p.id,p.x,p.y-k-.28);
 if(p.meat>0){c.fillStyle='#985a45';c.fillRect(p.x+k+.12,p.y+.5,.22,.18);}if(p.leather>0){c.fillStyle='#ab895d';c.fillRect(p.x+k+.08,p.y+.8,.32,.18);}
}finally{c.restore();}return true;}
function drawWork(c,work,{reducedMotion=false}={}){if(!work||!Number.isFinite(work.x)||!Number.isFinite(work.y)||!Number.isFinite(work.progress)||work.progress<0||work.progress>1||!Number.isFinite(work.a??0))return false;const phase=reducedMotion?0:Math.sin(work.progress*Math.PI*18)*.09;
 c.save();try{c.translate(work.x,work.y);c.rotate(work.a||0);
 // Forearms attached to fixed shoulder anchors, tool held at the moving right hand.
 stroke(c,[[0,-.22],[.18,-.22],[.44+phase,-.08]],'#899279',.12);stroke(c,[[0,.22],[.21,.21],[.40+phase,.12]],'#899279',.12);
 if(['slaughter','harvest'].includes(work.kind))stroke(c,[[.4+phase,.12],[.67+phase,.15]],'#c2c8bb',.04);
 else if(work.kind==='capture'){c.strokeStyle='#c2b486';c.lineWidth=.035;c.strokeRect(.45,-.28,.55,.55);for(let j=0;j<4;j++)stroke(c,[[.45+j*.18,-.28],[.45+j*.18,.27]],'#c2b486',.02);}
 else if(work.kind==='cook'){c.fillStyle='#303b33';c.beginPath();c.arc(.7,0,.22,0,Math.PI*2);c.fill();stroke(c,[[.55,-.02],[.85,-.02]],'#c38347',.08);}
 else if(work.kind==='tan'){c.fillStyle='#977b53';c.fillRect(.5,-.18,.35,.36);}
}finally{c.restore();}return true;}
function depthEntries(g,v,view){if(v?.z!==0||!g.husbandry191)return[];const state=g.husbandry191.view(),vision=g.visibility?.frame?.(),entries=[];
 for(const p of state.pens)if(p.x+3>=view.l&&p.x-3<=view.r&&p.y+3>=view.t&&p.y-3<=view.b&&vision?.canSeeRegionalPoint?.(p))entries.push({kind:'husbandry191',id:'pen191:'+p.id,depth:p.y+1.5,draw:c=>drawPen(c,p,state.animals.filter(a=>a.pen===p.id&&a.status==='held'),{reducedMotion:!!g.settings?.reducedMotion})});
 const task=state.task||g.wildHarvest190?.overview().task;if(task&&task.kind!=='fish'){const p=g.frontier.position();entries.push({kind:'husbandry191-work',id:'work191',depth:p.y+.02,draw:c=>drawWork(c,{...task,x:p.x,y:p.y,a:p.a},{reducedMotion:!!g.settings?.reducedMotion})});}return entries;
}
const api=Object.freeze({drawPen,drawWork,depthEntries});root.DeadwallHusbandryArt191=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
