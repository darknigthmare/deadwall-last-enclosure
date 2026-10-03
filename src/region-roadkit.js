(function(root){'use strict';
const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null),cross=(a,b)=>a.x*b.y-a.y*b.x,sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y}),key=p=>Math.round(p.x*100)+','+Math.round(p.y*100);
function classify(a){if(a.length===1)return'end';if(a.length===2){let d=Math.abs(a[1].angle-a[0].angle);d=Math.min(d,Math.PI*2-d);return Math.abs(d-Math.PI)<.10?'straight':d<1.18?'bend45':d>2.05?'bend135':'bend90';}if(a.length===3)return a.some(x=>a.some(y=>Math.abs(Math.abs(Math.atan2(Math.sin(x.angle-y.angle),Math.cos(x.angle-y.angle)))-Math.PI)<.18))?'tee':'fork';return a.length===4?'cross':'multi';}
function topology(roads,seed=0){const cuts=roads.map(()=>[0,1]);for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){const a=roads[i],b=roads[j],u=sub(a.b,a.a),v=sub(b.b,b.a),w=sub(b.a,a.a),den=cross(u,v);if(Math.abs(den)<1e-8)continue;const t=cross(w,v)/den,s=cross(w,u)/den;if(t>=-1e-7&&t<=1+1e-7&&s>=-1e-7&&s<=1+1e-7){cuts[i].push(Math.max(0,Math.min(1,t)));cuts[j].push(Math.max(0,Math.min(1,s)));}}
const nodes=new Map(),segments=[],seen=new Set(),node=p=>{const k=key(p);if(!nodes.has(k))nodes.set(k,{id:'j'+k,x:p.x,y:p.y,arms:[]});return nodes.get(k);};
for(let i=0;i<roads.length;i++){const r=roads[i],ts=[...new Set(cuts[i].map(n=>Math.round(n*1e8)/1e8))].sort((a,b)=>a-b);for(let n=1;n<ts.length;n++){const at=t=>({x:r.a.x+(r.b.x-r.a.x)*t,y:r.a.y+(r.b.y-r.a.y)*t}),a=at(ts[n-1]),b=at(ts[n]),tag=[key(a),key(b)].sort().join('/');if(Math.hypot(a.x-b.x,a.y-b.y)<.03||seen.has(tag))continue;seen.add(tag);const seg={...r,id:'r'+segments.length,parent:r.id,a,b};segments.push(seg);for(const[p,q]of [[a,b],[b,a]]){const nd=node(p),angle=Math.atan2(q.y-p.y,q.x-p.x);if(!nd.arms.some(t=>Math.abs(Math.atan2(Math.sin(t.angle-angle),Math.cos(t.angle-angle)))<.025))nd.arms.push({angle,width:r.width,length:Math.hypot(q.x-p.x,q.y-p.y),road:seg.id});}}}
return{roads:segments,junctions:[...nodes.values()].map(n=>{n.arms.sort((a,b)=>a.angle-b.angle);return{...n,kind:classify(n.arms),variant:G.hash(seed,n.id,'junction')%4,radius:Math.max(...n.arms.map(a=>a.width/2))+2.7};})};}
// Rendering uses the unchanged road centre lines. All shoulders precede every
// asphalt surface, so a driveway never paints its kerb across another road.
const STYLE=Object.freeze({shoulder:'#94917a',surface:'#505c53',marking:'#c0bb97',shoulderWidth:1.4});
function validRoad(r){return r&&Number.isFinite(r.width)&&r.width>0&&r.a&&r.b&&[r.a.x,r.a.y,r.b.x,r.b.y].every(Number.isFinite)&&Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y)>.0001;}
function inView(r,view,pad=0){const m=r.width/2+pad;return !view||Math.max(r.a.x,r.b.x)+m>=view.l&&Math.min(r.a.x,r.b.x)-m<=view.r&&Math.max(r.a.y,r.b.y)+m>=view.t&&Math.min(r.a.y,r.b.y)-m<=view.b;}
function mergeIntervals(intervals){const result=[];for(const [a,b]of intervals.filter(q=>q[1]>q[0]).sort((a,b)=>a[0]-b[0])){const last=result.at(-1);if(last&&a<=last[1]+.0001)last[1]=Math.max(last[1],b);else result.push([a,b]);}return result;}
// Parameter intervals where a centre line crosses the actual capsule of another
// road. Oblique junctions and joins at the other road's endpoint both count.
function coveredIntervals(r,other,clearance=.7){
 const dx=r.b.x-r.a.x,dy=r.b.y-r.a.y,len=Math.hypot(dx,dy),ox=other.b.x-other.a.x,oy=other.b.y-other.a.y,ol=Math.hypot(ox,oy);
 if(len<.0001||ol<.0001||Math.abs((dx*oy-dy*ox)/(len*ol))<.025)return[];
 const u={x:ox/ol,y:oy/ol},rx=r.a.x-other.a.x,ry=r.a.y-other.a.y,qx=rx*u.x+ry*u.y,qy=-rx*u.y+ry*u.x,vx=dx*u.x+dy*u.y,vy=-dx*u.y+dy*u.x,rad=other.width/2+clearance,intervals=[];
 let lo=0,hi=1;
 for(const[p,q]of[[-vx,qx],[vx,ol-qx],[-vy,qy+rad],[vy,rad-qy]]){if(Math.abs(p)<1e-9){if(q<0){hi=-1;break;}}else{const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);}}
 if(hi>lo)intervals.push([lo*len,hi*len]);
 for(const e of[other.a,other.b]){const ex=r.a.x-e.x,ey=r.a.y-e.y,b=2*(ex*dx+ey*dy),cc=ex*ex+ey*ey-rad*rad,disc=b*b-4*len*len*cc;if(disc<0)continue;const root=Math.sqrt(disc),a=Math.max(0,(-b-root)/(2*len*len)),z=Math.min(1,(-b+root)/(2*len*len));if(z>a)intervals.push([a*len,z*len]);}
 return mergeIntervals(intervals);
}
function markingSpans(r,roads){
 if(!validRoad(r)||r.width<=4)return[];
 const len=Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y),bounds={l:Math.min(r.a.x,r.b.x),r:Math.max(r.a.x,r.b.x),t:Math.min(r.a.y,r.b.y),b:Math.max(r.a.y,r.b.y)},cuts=[];
 for(const other of roads)if(other!==r&&validRoad(other)&&inView(other,bounds,.7))cuts.push(...coveredIntervals(r,other));
 const spans=[];let at=0;for(const[a,b]of mergeIntervals(cuts)){if(a>at+.04)spans.push([at,a]);at=Math.max(at,b);}if(at<len-.04)spans.push([at,len]);return spans;
}
function drawNetwork(c,roads,options={}){
 const visible=roads.filter(r=>validRoad(r)&&inView(r,options.view,STYLE.shoulderWidth));
 if(!visible.length)return{roads:0,spans:0};
 const scale=options.scale||1,minWidth=options.minWidth||0,width=r=>Math.max(r.width,minWidth/scale),shoulder=options.shoulderWidth??STYLE.shoulderWidth;
 c.save();c.lineCap='round';c.lineJoin='round';c.setLineDash([]);
 for(const layer of['shoulder','surface']){for(const r of visible){c.strokeStyle=options[layer]||r[layer+'Color']||STYLE[layer];c.lineCap=r.lineCap||'round';c.lineWidth=width(r)+(layer==='shoulder'?shoulder:0);c.beginPath();c.moveTo(r.a.x,r.a.y);c.lineTo(r.b.x,r.b.y);c.stroke();}}
 let count=0;
 if(options.markings!==false){c.strokeStyle=options.marking||STYLE.marking;c.lineWidth=.09;c.lineCap='butt';c.setLineDash([2.5,4]);for(const r of visible){if(r.markings===false)continue;const dx=r.b.x-r.a.x,dy=r.b.y-r.a.y,len=Math.hypot(dx,dy);for(const[a,b]of options.spans?.get(r)??markingSpans(r,visible)){c.lineDashOffset=-a;c.beginPath();c.moveTo(r.a.x+dx*a/len,r.a.y+dy*a/len);c.lineTo(r.a.x+dx*b/len,r.a.y+dy*b/len);c.stroke();count++;}}}
 c.restore();return{roads:visible.length,spans:count};
}
// Compatibility for consumers drawing one junction: no invented circular island.
function draw(c,j){if(!j?.arms?.length||j.kind==='straight')return;const roads=j.arms.map(a=>({a:{x:j.x,y:j.y},b:{x:j.x+Math.cos(a.angle)*(j.radius+3),y:j.y+Math.sin(a.angle)*(j.radius+3)},width:a.width}));drawNetwork(c,roads,{markings:false,shoulderWidth:0});}
const api=Object.freeze({topology,classify,draw,drawNetwork,markingSpans,coveredIntervals,STYLE});root.DeadwallRoadKit=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;})(globalThis);
