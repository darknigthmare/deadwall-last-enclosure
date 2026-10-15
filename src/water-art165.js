/* Metric water geometry shared by the landscape, GPS and regional atlas. */
(function(root,factory){'use strict';const api=factory();root.DeadwallWaterArt165=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis,function(){'use strict';
 const TAU=Math.PI*2,NAMES=Object.freeze({land:'Terrain sec',shore:'Berge',pool:'Mare',pond:'Étang',lake:'Lac',stream:'Ruisseau',river:'Cours d’eau',sea:'Mer',ocean:'Océan'});
 const STYLE=Object.freeze({pond:{water:'#526f62',deep:'#415d54',bank:'#858364'},pool:{water:'#647a66',deep:'#506751',bank:'#929174'},lake:{water:'#527b7b',deep:'#3d646c',bank:'#969174'},stream:{water:'#78918a',deep:'#5f7f7c',bank:'#938a6b'},river:{water:'#5f8380',deep:'#436a71',bank:'#958a6b'},sea:{water:'#4d7b83',deep:'#345d71',bank:'#b2a184'},ocean:{water:'#355d77',deep:'#274a65',bank:'#a5967a'}});
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 const bounds=v=>({l:v?.l??v?.left??v?.x,r:v?.r??v?.right??(v?.x+v?.w),t:v?.t??v?.top??v?.y,b:v?.b??v?.bottom??(v?.y+v?.h)});
 function validView(v){return v&&[v.l,v.r,v.t,v.b].every(Number.isFinite)&&v.r>v.l&&v.b>v.t;}
 function enabled(w){return w?.hydrologyVersion===1&&typeof w.hydrology?.featuresIn==='function';}
 function ellipse(f){const e=f.ellipse;if(!e)return null;const cx=e.cx??e.x,cy=e.cy??e.y;return[cx,cy,e.rx,e.ry,e.a??0].every(Number.isFinite)&&e.rx>0&&e.ry>0?{cx,cy,rx:e.rx,ry:e.ry,a:e.a??0}:null;}
 function shape(c,f,pad=0){
  c.beginPath();
  const points=f.points;if(!Array.isArray(points)||points.length<2||!points.every(finite))return null;
  for(let i=0;i<points.length;i++)i?c.lineTo(points[i].x,points[i].y):c.moveTo(points[i].x,points[i].y);
  if(f.shape==='polygon'||f.closed||f.polygon||['sea','ocean'].includes(f.kind)){c.closePath();return'fill';}
  if(!Number.isFinite(f.width)||f.width<=0)return null;
  c.lineWidth=f.width+pad*2;c.lineCap='round';c.lineJoin='round';return'stroke';
 }
 function paint(c,f,color,pad=0){const mode=shape(c,f,pad);if(!mode)return false;c.fillStyle=c.strokeStyle=color;c[mode]();if(mode==='fill'&&pad>0){c.lineWidth=pad*2;c.lineJoin='round';c.stroke();}return true;}
 function features(w,v){return w.hydrology.featuresIn({x:v.l,y:v.t,w:v.r-v.l,h:v.b-v.t})||[];}
 function flowMarks(c,f,v,time,scale){
  const points=f.points;if(!f.flowing||!Array.isArray(points)||points.length<2)return 0;
  let total=0,drawn=0;const spacing=Math.max(4,3/scale),offset=((time*.65)%spacing+spacing)%spacing;
  c.strokeStyle='rgba(208,224,208,.29)';c.lineWidth=Math.max(.035,.7/scale);c.lineCap='round';
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)continue;
   for(let s=spacing-Math.abs(total-offset)%spacing;s<len;s+=spacing){const x=a.x+dx*s/len,y=a.y+dy*s/len;if(x<v.l-2||x>v.r+2||y<v.t-2||y>v.b+2)continue;
    const wing=Math.min((f.width||1)*.22,.42),tail=Math.min(1.15,(f.width||1)*.6),ux=dx/len,uy=dy/len;c.beginPath();c.moveTo(x-ux*tail-uy*wing,y-uy*tail+ux*wing);c.lineTo(x,y);c.lineTo(x-ux*tail+uy*wing,y-uy*tail-ux*wing);c.stroke();if(++drawn>=160)return drawn;
   }total+=len;
  }return drawn;
 }
 function stillMarks(c,f,v,time,scale){
  const e=ellipse(f);if(!e)return 0;const step=Math.max(2.8,10/scale),extent=Math.max(e.rx,e.ry),left=Math.max(v.l,e.cx-extent),right=Math.min(v.r,e.cx+extent),top=Math.max(v.t,e.cy-extent),bottom=Math.min(v.b,e.cy+extent),cos=Math.cos(e.a),sin=Math.sin(e.a);let count=0;
  c.strokeStyle='rgba(209,225,211,.21)';c.lineWidth=Math.max(.025,.55/scale);
  for(let row=Math.floor(top/step);row<=Math.ceil(bottom/step);row++)for(let col=Math.floor(left/step);col<=Math.ceil(right/step);col++){
   const x=(col+.5)*step,y=(row+.5)*step,dx=x-e.cx,dy=y-e.cy,lx=cos*dx+sin*dy,ly=-sin*dx+cos*dy;
   if(lx*lx/(e.rx*e.rx)+ly*ly/(e.ry*e.ry)>.78)continue;
   const phase=Math.sin(time*.55+col*1.73+row*.91)*.09,width=Math.min(.6,step*.13);c.beginPath();c.moveTo(x-width,y+phase);c.quadraticCurveTo(x,y-.08+phase,x+width,y+phase);c.stroke();if(++count>=144)return count;
  }return count;
 }
 function coastalMarks(c,f,v,time,scale){
  if(!['sea','ocean'].includes(f.kind))return;const step=Math.max(3.5,10/scale);let count=0;
  c.save();try{shape(c,f);c.clip();c.strokeStyle='rgba(205,222,214,.19)';c.lineWidth=Math.max(.035,.6/scale);
   for(let y=Math.floor(v.t/step)*step;y<v.b;y+=step)for(let x=Math.floor(v.l/step)*step;x<v.r;x+=step){const phase=Math.sin(time*.6+x*.3+y*.4)*.10,dx=Math.sin(x*.7+y*.3)*step*.16;c.beginPath();c.moveTo(x+dx,y+phase);c.quadraticCurveTo(x+dx+.7,y+phase-.12,x+dx+1.4,y+phase);c.stroke();if(++count>=196)return;}
  }finally{c.restore();}
 }
 function draw(c,w,rawView,{scale=32,map=false,time=0,reducedMotion=false}={}){
  if(!enabled(w)||!Number.isFinite(scale)||scale<=0)return false;const v=bounds(rawView);if(!validView(v))return false;
  const list=features(w,{l:v.l-20,r:v.r+20,t:v.t-20,b:v.b+20});if(!Array.isArray(list))return false;
  c.save();try{c.beginPath();c.rect(v.l,v.t,v.r-v.l,v.b-v.t);c.clip();
   // Every bank precedes every body: a tributary never paints earth over its receiving water.
   for(const f of list){const s=Object.hasOwn(STYLE,f.kind)&&STYLE[f.kind];if(s)paint(c,f,s.bank,Math.max(0,f.bankWidth||0));}
   for(const f of list){const s=Object.hasOwn(STYLE,f.kind)&&STYLE[f.kind];if(s)paint(c,f,s.water);}
   if(!map&&scale>=2){const clock=reducedMotion?0:Number.isFinite(time)?Math.max(0,time):0;
    for(const f of list){const s=Object.hasOwn(STYLE,f.kind)&&STYLE[f.kind];if(!s)continue;c.save();
     if(shape(c,f)==='fill')c.clip();
     // Interior depth remains within the same authoritative footprint.
     const e=ellipse(f);if(e&&Math.min(e.rx,e.ry)>1){c.save();shape(c,f);c.clip();c.fillStyle=s.deep;c.globalAlpha*=.28;c.beginPath();c.ellipse(e.cx,e.cy,e.rx*.78,e.ry*.78,e.a,0,TAU);c.fill();c.restore();}
     flowMarks(c,f,v,clock,scale);stillMarks(c,f,v,clock,scale);coastalMarks(c,f,v,clock,scale);c.restore();
    }
   }
  }finally{c.restore();}return true;
 }
 function drawCrossings(c,w,rawView,{scale=32,map=false}={}){
  if(!enabled(w)||!Number.isFinite(scale)||scale<=0)return 0;const v=bounds(rawView);if(!validView(v))return 0;let count=0;
  c.save();try{for(const q of w.hydrology.crossings||[]){if(!finite(q)||![q.a,q.width,q.length].every(Number.isFinite)||q.width<=0||q.length<=0)continue;const pad=Math.hypot(q.width,q.length)/2;if(q.x+pad<v.l||q.x-pad>v.r||q.y+pad<v.t||q.y-pad>v.b)continue;
    c.save();c.translate(q.x,q.y);c.rotate(q.a);c.fillStyle='#333f3b';c.fillRect(-q.length/2,-q.width/2,q.length,q.width);c.fillStyle='#737b70';c.fillRect(-q.length/2,-q.width/2,q.length,q.width);
    c.strokeStyle='#b5b5a1';c.lineWidth=Math.max(.12,(map?.7:.8)/scale);c.lineCap='butt';c.beginPath();c.moveTo(-q.length/2,-q.width/2);c.lineTo(q.length/2,-q.width/2);c.moveTo(-q.length/2,q.width/2);c.lineTo(q.length/2,q.width/2);c.stroke();
    if(!map&&scale>=3){c.strokeStyle='#414f47';c.lineWidth=.08;c.beginPath();for(const x of[-q.length/2,q.length/2]){c.moveTo(x,-q.width/2);c.lineTo(x,q.width/2);}c.stroke();}
    c.restore();count++;
   }}finally{c.restore();}return count;
 }
 function describe(sample){if(!sample||!Object.hasOwn(NAMES,sample.kind))return'';const name=NAMES[sample.kind];return name+(sample.water?' · eau '+(sample.salinity==='salt'?'salée':'douce'):'')+(sample.crossing?' · franchissement routier':'');}
 return Object.freeze({STYLE,NAMES,describe,draw,drawCrossings});
});
