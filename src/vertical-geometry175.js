/* Shared metric geometry for elevated movement, occlusion and the station's 3D view. */
(function(root){
 'use strict';
 const EPS=1e-8;
 const finite=(...values)=>values.every(Number.isFinite);
 function rayBox(origin,direction,box,limit=Infinity){
  if(!finite(origin.x,origin.y,origin.z,direction.x,direction.y,direction.z)||!(limit>0))return null;
  let near=0,far=limit;
  for(const axis of ['x','y','z']){
   const lo=box[axis+'0'],hi=box[axis+'1'],p=origin[axis],d=direction[axis];
   if(!finite(lo,hi)||hi<lo)return null;
   if(Math.abs(d)<EPS){if(p<lo||p>hi)return null;continue;}
   let a=(lo-p)/d,b=(hi-p)/d;if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)return null;
  }
  return near<=limit&&far>EPS?near:null;
 }
 function direction(yaw,pitch){const c=Math.cos(pitch);return{x:Math.cos(yaw)*c,y:Math.sin(yaw)*c,z:Math.sin(pitch)};}
 function lookAt(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz);return l>EPS?{x:dx/l,y:dy/l,z:dz/l}:null;}
 function firstHit(origin,ray,boxes,limit,skip=()=>false){
  let best=null,range=limit;
  for(const box of boxes){if(skip(box))continue;const distance=rayBox(origin,ray,box,range);if(distance!==null&&(distance<range-EPS||!best)){range=distance;best={box,distance,point:{x:origin.x+ray.x*range,y:origin.y+ray.y*range,z:origin.z+ray.z*range}};}}
  return best;
 }
 function contains(rect,x,y,margin=0){return x>=rect.x0+margin-EPS&&x<=rect.x1-margin+EPS&&y>=rect.y0+margin-EPS&&y<=rect.y1-margin+EPS;}
 function supported(rects,x,y,radius=0){
  if(!finite(x,y,radius)||radius<0)return false;
  return [[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius]].every(([dx,dy])=>rects.some(r=>contains(r,x+dx,y+dy)));
 }
 // Positive camera-space depth points forward. All dimensions are metres.
 function cameraPoint(p,camera){
  const dx=p.x-camera.x,dy=p.y-camera.y,dz=p.z-camera.z,cy=Math.cos(camera.yaw),sy=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch);
  const forward=dx*cy+dy*sy;return{x:-dx*sy+dy*cy,y:dz*cp-forward*sp,z:forward*cp+dz*sp};
 }
 function clipNear(points,near){
  const result=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],insideA=a.z>=near,insideB=b.z>=near;
   if(insideA)result.push(a);
   if(insideA!==insideB){const t=(near-a.z)/(b.z-a.z);result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:near});}
  }
  return result;
 }
 function project(point,width,height,fov){const scale=width/(2*Math.tan(fov/2));return{x:width/2+point.x*scale/point.z,y:height/2-point.y*scale/point.z};}
 function corners(b){return[{x:b.x0,y:b.y0,z:b.z0},{x:b.x1,y:b.y0,z:b.z0},{x:b.x1,y:b.y1,z:b.z0},{x:b.x0,y:b.y1,z:b.z0},{x:b.x0,y:b.y0,z:b.z1},{x:b.x1,y:b.y0,z:b.z1},{x:b.x1,y:b.y1,z:b.z1},{x:b.x0,y:b.y1,z:b.z1}];}
 const FACES=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
 function polygons(boxes,camera,width,height,rules){
  const result=[];
  for(const box of boxes){
   const cx=(box.x0+box.x1)/2,cy=(box.y0+box.y1)/2,cz=(box.z0+box.z1)/2;
   if(Math.hypot(cx-camera.x,cy-camera.y,cz-camera.z)>rules.far+Math.max(box.x1-box.x0,box.y1-box.y0,box.z1-box.z0))continue;
   const pts=corners(box).map(p=>cameraPoint(p,camera));
   if(pts.every(p=>p.z<rules.near))continue;
   for(let f=0;f<FACES.length;f++){
    const poly=clipNear(FACES[f].map(i=>pts[i]),rules.near);if(poly.length<3)continue;
    const screen=poly.map(p=>project(p,width,height,rules.fov));
    if(screen.every(p=>p.x<0)||screen.every(p=>p.x>width)||screen.every(p=>p.y<0)||screen.every(p=>p.y>height))continue;
    result.push({points:screen,depth:poly.reduce((n,p)=>n+p.z,0)/poly.length,color:box.color||'#68746b',face:f,kind:box.kind});
   }
  }
  return result.sort((a,b)=>b.depth-a.depth);
 }
 function draw(ctx,width,height,camera,boxes,rules,info={}){
  ctx.save();
  const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#303d47');sky.addColorStop(.6,'#737c79');sky.addColorStop(1,'#1b2623');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  for(const p of polygons(boxes,camera,width,height,rules)){
   ctx.beginPath();ctx.moveTo(p.points[0].x,p.points[0].y);for(const v of p.points.slice(1))ctx.lineTo(v.x,v.y);ctx.closePath();ctx.fillStyle=p.color;ctx.fill();
   ctx.fillStyle='rgba(0,0,0,'+([.3,0,.16,.24,.08,.2][p.face])+')';ctx.fill();ctx.strokeStyle='rgba(13,20,18,.28)';ctx.lineWidth=.7;ctx.stroke();
  }
  ctx.fillStyle='#192522';ctx.fillRect(width*.43,height*.78,width*.14,height*.22);ctx.fillStyle='#788079';ctx.fillRect(width*.477,height*.64,width*.046,height*.24);
  ctx.fillStyle='#313e39';ctx.fillRect(width*.486,height*.615,width*.028,height*.055);
  ctx.strokeStyle=info.hot?'#e3a276':'#e5dbc0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(width/2-16,height/2);ctx.lineTo(width/2-5,height/2);ctx.moveTo(width/2+5,height/2);ctx.lineTo(width/2+16,height/2);ctx.moveTo(width/2,height/2-16);ctx.lineTo(width/2,height/2-5);ctx.stroke();
  ctx.fillStyle='rgba(12,19,17,.86)';ctx.fillRect(14,height-88,Math.min(width-28,630),72);ctx.fillStyle='#d9decc';ctx.font='14px sans-serif';ctx.textAlign='left';
  ctx.fillText('POSTE 3D · '+(info.name||'Rempart')+' · altitude '+Math.round(camera.z-rules.eyeHeight)+' m',26,height-62);
  ctx.fillText('Munitions '+(info.ammo??0)+' · chaleur '+Math.round((info.heat||0)*100)+' % · '+(info.powered?'alimenté':'COUPURE'),26,height-41);
  ctx.fillText('Déplacer la souris pour viser · clic : tirer · V : vue classique · Échap : quitter le poste',26,height-20);
  ctx.restore();
 }
 const api={rayBox,direction,lookAt,firstHit,contains,supported,cameraPoint,clipNear,project,polygons,draw};
 root.DeadwallVerticalGeometry175=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
