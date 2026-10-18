/* Original, low ground props. Cosmetic variants never alter finite yields or collisions. */
(function(root){'use strict';
const STYLES=Object.freeze({
 blackberry:{kind:'berry',leaf:'#3f5635',fruit:'#292332'},blackthorn:{kind:'sloe',leaf:'#586145',fruit:'#3e4e68'},rosehip:{kind:'hip',leaf:'#53613a',fruit:'#ae4b35'},
 hazelnut:{kind:'hazel',fruit:'#987447'},walnut:{kind:'walnut',fruit:'#786044'},chestnut:{kind:'chestnut',fruit:'#6e412b'},
 apple:{kind:'apple',fruit:'#ab5440'},pear:{kind:'pear',fruit:'#a4984b'},plum:{kind:'plum',fruit:'#58435d'},
 raspberry:{kind:'raspberry',leaf:'#5c7043',fruit:'#ac3f46'},blueberry:{kind:'blueberry',leaf:'#526247',fruit:'#4e5c84'},wildStrawberry:{kind:'strawberry',leaf:'#536b3a',fruit:'#b84938'},
 chanterelle:{kind:'chanterelle',fruit:'#bb9248'},bolete:{kind:'bolete',fruit:'#76553a'},fallenBranch:{kind:'wood',fruit:'#7d6545'},flint:{kind:'stone',fruit:'#88918a'}
});
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function line(c,points,color,width=.035){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
function draw(c,q,{time=0,reducedMotion=false,task=null}={}){
 const style=STYLES[q?.species];if(!style||![q.x,q.y,q.length,q.width].every(Number.isFinite)||q.length<=0||q.width<=0)return false;
 const variant=(q.variant||0)%4,working=task?.species===q.species&&Math.hypot(task.target.x-q.x,task.target.y-q.y)<.01;
 c.save();try{
  c.translate(q.x,q.y);c.rotate(q.a||0);c.scale(q.length,q.width);c.rotate((variant-1.5)*.12);ellipse(c,0,.12,.47,.25,'rgba(13,20,13,.2)');
  const sway=working&&!reducedMotion?Math.sin(time*12)*.025:0;c.translate(sway,0);
  if(['berry','sloe','hip','raspberry','blueberry','strawberry'].includes(style.kind)){
   line(c,[[-.28,.3],[-.05,-.28],[.23,-.38]],'#6c6141',.045);
   for(let i=0;i<5;i++){const a=i*2.4+variant*.35;ellipse(c,Math.cos(a)*.25,Math.sin(a)*.22,.13,.08,style.leaf);}
   for(let i=0;i<4+variant;i++){const a=i*2.15+variant,px=Math.cos(a)*.27,py=Math.sin(a)*.26;
    if(style.kind==='strawberry'){c.fillStyle=style.fruit;c.beginPath();c.moveTo(px-.085,py-.06);c.lineTo(px+.085,py-.06);c.lineTo(px,py+.13);c.closePath();c.fill();ellipse(c,px,py-.07,.07,.025,'#779044');}
    else if(style.kind==='raspberry'){for(let n=0;n<5;n++)ellipse(c,px+Math.cos(n*1.3)*.04,py+Math.sin(n*1.3)*.04,.035,.04,style.fruit);}
    else{ellipse(c,px,py,.065,style.kind==='hip'?.105:.065,style.fruit);ellipse(c,px-.018,py-.022,.018,.018,style.kind==='hip'?'#d17a4b':'#8c8992');}
   }
  }else if(style.kind==='wood'){
   line(c,[[-.45,.29],[-.1,.02],[.42,-.27]],style.fruit,.12);line(c,[[-.1,.02],[.06,-.32]],'#8b7454',.07);line(c,[[.11,-.11],[.42,.12]],'#6b533a',.075);line(c,[[-.38,.21],[.36,-.27]],'#b49b6d',.024);
  }else if(style.kind==='stone'){
   for(let i=0;i<3+variant%2;i++){const x=(i%2-.5)*.46,y=(Math.floor(i/2)-.5)*.34;c.fillStyle=i%2?'#a5aaa0':style.fruit;c.beginPath();c.moveTo(x-.15,y+.1);c.lineTo(x-.18,y-.07);c.lineTo(x+.02,y-.19);c.lineTo(x+.2,y-.01);c.lineTo(x+.13,y+.15);c.closePath();c.fill();line(c,[[x-.15,y-.07],[x+.02,y-.14],[x+.13,y]],'#c4c6b6',.025);}
  }else if(style.kind==='chanterelle'||style.kind==='bolete'){
   for(let i=0;i<3;i++){const x=(i-1)*.27,y=(i%2-.5)*.23;line(c,[[x,y+.26],[x+.015,y-.02]],'#c3ae7a',style.kind==='bolete'?.12:.07);
    if(style.kind==='chanterelle'){c.fillStyle=style.fruit;c.beginPath();c.moveTo(x-.19,y-.08);c.quadraticCurveTo(x,y+.12,x+.19,y-.08);c.lineTo(x+.11,y-.2);c.quadraticCurveTo(x,y-.09,x-.14,y-.19);c.closePath();c.fill();line(c,[[x-.1,y-.12],[x,y-.01],[x+.1,y-.12]],'#dfba65',.025);}
    else{ellipse(c,x,y-.06,.21,.13,style.fruit);ellipse(c,x-.06,y-.095,.08,.03,'#a48459');}}
  }else{
   for(let i=0;i<3+variant%2;i++){const a=i*2.4+variant*.5,x=Math.cos(a)*.27,y=Math.sin(a)*.25;
    if(style.kind==='chestnut'){for(let n=0;n<9;n++){const a=n*Math.PI*2/9;line(c,[[x+Math.cos(a)*.105,y+Math.sin(a)*.1],[x+Math.cos(a)*.18,y+Math.sin(a)*.17]],'#71834c',.025);}ellipse(c,x,y,.12,.12,'#7a884e');ellipse(c,x+.035,y,.085,.1,style.fruit);}
    else if(style.kind==='pear'){ellipse(c,x,y+.055,.12,.125,style.fruit);ellipse(c,x,y-.045,.07,.1,style.fruit);line(c,[[x,y-.11],[x+.025,y-.19]],'#675439');}
    else{ellipse(c,x,y,style.kind==='plum'?.1:.125,style.kind==='hazel'?.11:.12,style.fruit);if(style.kind==='walnut'){line(c,[[x-.04,y-.09],[x+.01,y],[x-.025,y+.095]],'#493b29',.025);line(c,[[x+.045,y-.07],[x+.065,y+.07]],'#b3986c',.02);}else if(style.kind==='hazel'){ellipse(c,x-.02,y+.065,.105,.04,'#657242');}else{ellipse(c,x-.035,y-.045,.035,.035,style.kind==='plum'?'#9887a1':'#d6a576');line(c,[[x,y-.09],[x+.03,y-.17]],'#6b5538');ellipse(c,x+.065,y-.145,.075,.025,'#667d41');}}
   }
  }
 }finally{c.restore();}return true;
}
function gesture(c,p,time,reducedMotion){
 const a=Math.atan2(p.target.y-p.y,p.target.x-p.x),wave=reducedMotion?0:Math.sin(time*10)*.055;
 c.save();try{c.translate(p.x,p.y);c.rotate(a);line(c,[[.11,-.12],[.26+wave,-.16],[.42+wave,-.07]],'#a69b77',.08);line(c,[[.1,.12],[.27+wave,.16],[.43+wave,.08]],'#847e64',.08);ellipse(c,.44+wave,-.065,.07,.055,'#c6b48e');ellipse(c,.45+wave,.075,.07,.055,'#b5a483');c.strokeStyle='#ceb16c';c.lineWidth=.025;c.beginPath();c.arc(0,0,.54,-Math.PI/2,-Math.PI/2+Math.PI*2*p.progress);c.stroke();}finally{c.restore();}
}
function depthEntries(g,v,view){
 if(!g.forage193?.active()||v.z!==0||!view)return[];const entries=[],task=g.forage193.presentation();
 for(const q of g.forage193.visible())if(q.x>=view.l-q.length&&q.x<=view.r+q.length&&q.y>=view.t-q.width&&q.y<=view.b+q.width)entries.push({kind:'forage193',id:q.id,depth:q.y+q.width*.2,draw:c=>draw(c,q,{time:g.elapsed,reducedMotion:!!g.settings?.reducedMotion,task})});
 if(task&&task.x>=view.l-1&&task.x<=view.r+1&&task.y>=view.t-1&&task.y<=view.b+1)entries.push({kind:'forage193-task',id:'forage193-hands',depth:task.y+.02,draw:c=>gesture(c,task,g.elapsed,!!g.settings?.reducedMotion)});
 return entries;
}
const api=Object.freeze({draw,depthEntries,styles:STYLES});root.DeadwallForageArt193=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
