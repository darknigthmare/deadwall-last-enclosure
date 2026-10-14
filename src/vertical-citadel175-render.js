/* Procedural integration geometry. The FPS is WebGL with a depth buffer, not a zoomed 2D canvas. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.VerticalCitadel175;
 const S=root.DeadwallVertical175State||(typeof require==='function'?require('./vertical-citadel175-state.js'):null);
 const alive=b=>b&&!b.dead&&b.health>0;
 function install(g){if(!g.vertical175||g.vertical175Art)return;const V=g.vertical175;
  function structure(ctx,b){const state=V.presentation(),s=state.sites.find(s=>s.id===b.id),def=R.bases[b.type];if(!s||!b.completed)return false;
   const q=S.bounds(b),w=q.w*R.tile,h=q.h*R.tile,p=V.pose(),cut=p.site===b.id?p.level:s.decks.length-1;
   const top=Math.min(cut,s.decks.length-1),z=def.height+top*R.deckRise,H=z*R.projectedHeight,left=b.left,y=b.top-H;
   ctx.save();ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(left+18,b.top+12,w+H*.4,h);
   ctx.fillStyle=def.age177?def.color:'#414940';ctx.beginPath();ctx.moveTo(left,y+h);ctx.lineTo(left+w,y+h);ctx.lineTo(left+w,b.bottom);ctx.lineTo(left,b.bottom);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#252d28';ctx.lineWidth=3;ctx.stroke();
   for(let k=0;k<Math.ceil(z/3);k++){const line=b.bottom-k*3*R.projectedHeight;ctx.strokeStyle=k%2?'#596053':'#353f36';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left,line);ctx.lineTo(left+w,line);ctx.stroke();}
   if(!def.wall){ctx.fillStyle='#2b352e';for(let k=0;k<4;k++)ctx.fillRect(left+18+k*(w-48)/3,b.top-H+14,12,H+h-14);}
   ctx.fillStyle=def.age177?def.roof:'#b2aa90';ctx.fillRect(left,y,w,h);ctx.fillStyle=def.age177?def.color:'#8d907e';ctx.fillRect(left+7,y+7,w-14,h-14);
   ctx.strokeStyle='#d2c7a0';ctx.lineWidth=5;for(const rail of V.network.railGeometry(b,top)){if(rail.type!=='edgeRail')continue;ctx.beginPath();ctx.moveTo(rail.x*R.tile,rail.y*R.tile-H);ctx.lineTo((rail.x+rail.w)*R.tile,(rail.y+rail.h)*R.tile-H);ctx.stroke();}
   ctx.strokeStyle='#535e51';ctx.lineWidth=1;for(let j=24;j<h;j+=32){ctx.beginPath();ctx.moveTo(left+8,y+j);ctx.lineTo(left+w-8,y+j);ctx.stroke();}
   const entry=V.entrance(b);ctx.fillStyle='#202a25';ctx.fillRect(b.x-16,b.y-H-20,32,40);ctx.strokeStyle='#dec475';ctx.lineWidth=2;ctx.strokeRect(b.x-16,b.y-H-20,32,40);
   for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(b.x-14,b.y-H-17+i*6);ctx.lineTo(b.x+14,b.y-H-17+i*6);ctx.stroke();}
   ctx.fillStyle='#c6b985';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(z+' m · '+(top+1)+' palier'+(top?'s':''),b.x,y-10);
   if(p.site!==b.id&&Math.hypot(g.player.x-entry.x,g.player.y-entry.y)<180){ctx.fillStyle='#d8c17d';ctx.beginPath();ctx.arc(entry.x,entry.y,7,0,Math.PI*2);ctx.fill();ctx.fillText('ENTRÉE',entry.x,entry.y+20);}
   for(const m of s.decks[top].modules){const d=R.modules[m.kind],box=S.moduleBox(b,m,z),x=box.x*R.tile,yy=box.y*R.tile-H,mw=box.w*R.tile,mh=box.h*R.tile;
    ctx.globalAlpha=m.progress<1?.45:1;ctx.fillStyle=d.range?'#455449':!!d.production?.food?'#6b8e6b':!!d.light?'#d1bb73':'#626c59';ctx.fillRect(x,yy,mw,mh);ctx.strokeStyle='#303b32';ctx.lineWidth=3;ctx.strokeRect(x,yy,mw,mh);
    if(d.range){const sx=x+mw/2,sy=yy+mh/2;ctx.fillStyle='#2e3831';ctx.beginPath();ctx.arc(sx,sy,mw*.34,0,Math.PI*2);ctx.fill();ctx.strokeStyle=state.controlled===m.id?'#f0d38b':'#9da894';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(m.yaw)*mw*.85,sy+Math.sin(m.yaw)*mw*.85);ctx.stroke();ctx.fillStyle='#d0bf92';ctx.font='10px sans-serif';ctx.fillText(m.ammo+' · '+Math.round(m.heat)+'°',sx,yy+mh+13);}
    else{ctx.fillStyle='#d1c49d';ctx.font='10px sans-serif';ctx.fillText(d.name.split(' ')[0].toUpperCase(),x+mw/2,yy+mh/2);}
    if(m.progress<1){ctx.fillStyle='#e1bb63';ctx.fillRect(x,yy+mh+4,mw*m.progress,3);}ctx.globalAlpha=1;
   }
   if(def.gate){const gh=def.gateClearance*R.projectedHeight;ctx.fillStyle=b.gateMode==='open'?'#18231b':'#75796b';ctx.fillRect(left+7,b.bottom-gh,w-14,gh);ctx.strokeStyle='#c3af78';ctx.lineWidth=3;ctx.strokeRect(left+7,b.bottom-gh,w-14,gh);ctx.fillStyle='#ecd395';ctx.fillText(b.gateMode==='open'?'PASSAGE OUVERT':'PORTE '+(b.gateMode==='closed'?'VERROUILLÉE':'AUTOMATIQUE'),b.x,b.bottom+16);}
   const next=s.decks[top+1];if(next&&next.progress<1){ctx.strokeStyle='#d5b567';ctx.setLineDash([9,6]);ctx.lineWidth=3;ctx.strokeRect(left+9,y-R.deckRise*R.projectedHeight+9,w-18,h-18);ctx.setLineDash([]);ctx.fillStyle='#e2c779';ctx.fillText('DALLE EN CHANTIER '+Math.round(next.progress*100)+' %',b.x,y-R.deckRise*R.projectedHeight-7);}
   ctx.restore();return true;
  }
  const draw=g.drawBuilding.bind(g);g.drawBuilding=(ctx,b,...a)=>R.bases[b.type]&&structure(ctx,b)?undefined:draw(ctx,b,...a);
  function crate(ctx,x,y,z){ctx.save();ctx.translate(x,y-z*R.projectedHeight);ctx.fillStyle='#907147';ctx.fillRect(-11,-17,22,16);ctx.strokeStyle='#d3bd86';ctx.lineWidth=2;ctx.strokeRect(-11,-17,22,16);ctx.beginPath();ctx.moveTo(-10,-16);ctx.lineTo(10,-2);ctx.moveTo(10,-16);ctx.lineTo(-10,-2);ctx.stroke();ctx.restore();}
  function bridge(ctx,q){const x=q.x*R.tile,y=q.y*R.tile-q.z*R.projectedHeight,w=q.w*R.tile,h=q.h*R.tile,horizontal=q.ports[0].y===q.ports[1].y,done=q.link.progress===1;ctx.save();ctx.globalAlpha=done?1:.45;ctx.fillStyle=q.definition.tier<2?'#856941':'#667061';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#252e28';ctx.lineWidth=2;
   for(let i=0;i<(horizontal?w:h);i+=16){ctx.beginPath();if(horizontal){ctx.moveTo(x+i,y);ctx.lineTo(x+i,y+h);}else{ctx.moveTo(x,y+i);ctx.lineTo(x+w,y+i);}ctx.stroke();}
   ctx.strokeStyle='#c1b383';ctx.lineWidth=4;ctx.beginPath();if(horizontal){ctx.moveTo(x,y+3);ctx.lineTo(x+w,y+3);ctx.moveTo(x,y+h-3);ctx.lineTo(x+w,y+h-3);}else{ctx.moveTo(x+3,y);ctx.lineTo(x+3,y+h);ctx.moveTo(x+w-3,y);ctx.lineTo(x+w-3,y+h);}ctx.stroke();
   ctx.globalAlpha=1;ctx.fillStyle='#ece1bb';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('LIAISON '+q.link.id+' · '+q.z+' m'+(done?'':' · '+Math.round(q.link.progress*100)+' %'),x+w/2,y-6);ctx.restore();}
  const player=g.drawPlayer.bind(g);g.drawPlayer=(ctx,...a)=>{const p=V.pose();if(p.z){ctx.save();ctx.translate(0,-p.z*R.projectedHeight);player(ctx,...a);ctx.restore();}else player(ctx,...a);if(V.network.carrying())crate(ctx,g.player.x+12,g.player.y-3,p.z);};
  const zombie=g.drawZombie.bind(g);g.drawZombie=(ctx,e,...args)=>{const p=V.enemyPose(e);ctx.save();ctx.translate(0,-p.z*R.projectedHeight);zombie(ctx,e,...args);ctx.restore();};
  const depth=g.depthEntries.bind(g);g.depthEntries=v=>{const entries=depth(v),p=V.pose();if(p.site){const b=g.world.buildings.get(p.site),entry=entries.find(e=>e.entity===g.player);if(b&&entry)entry.depth=b.bottom+.1;}
   for(const entry of entries)if(entry.entity&&entry.kind===3){const q=V.enemyPose(entry.entity),b=q.site&&g.world.buildings.get(q.site);if(b&&q.z>0)entry.depth=b.bottom+.05;}
   for(const e of V.presentation().giants){if(!g.visible(e.x,e.y,250,v))continue;entries.push({depth:e.y,id:e.id,kind:9,draw:ctx=>{const d=R.siege.kinds[e.kind],H=d.height*R.projectedHeight,w=d.radius*R.tile;ctx.save();ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(e.x,e.y,w*1.3,w*.45,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=e.windup?'#996b4b':'#665f4a';ctx.fillRect(e.x-w/2,e.y-H,w,H*.65);ctx.fillStyle='#918373';ctx.fillRect(e.x-w*.3,e.y-H-w*.4,w*.6,w*.5);ctx.fillStyle='#434b3c';ctx.fillRect(e.x-w/2,e.y-H*.4,w*.38,H*.4);ctx.fillRect(e.x+w*.12,e.y-H*.4,w*.38,H*.4);if(e.windup){ctx.strokeStyle='#e6b16b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,(d.reach+d.radius)*R.tile,0,Math.PI*2);ctx.stroke();}ctx.fillStyle='#dfc38b';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(d.name,e.x,e.y-H-w*.6);ctx.restore();}});}
   const network=V.network.presentation();
   for(const {link,shape:q}of network.links){if(!q)continue;const a=g.world.buildings.get(link.a.site),b=g.world.buildings.get(link.b.site),d=Math.max(a.bottom,b.bottom)+.04;entries.push({depth:d,id:link.id,kind:8,draw:ctx=>bridge(ctx,q)});
    const entry=entries.find(e=>e.entity===g.player);if(entry&&Math.abs(p.z-q.z)<.01&&g.player.x>=q.x*R.tile&&g.player.x<=(q.x+q.w)*R.tile&&g.player.y>=q.y*R.tile&&g.player.y<=(q.y+q.h)*R.tile)entry.depth=Math.max(entry.depth,d+.1);
   }
   for(const c of network.crates){const b=g.world.buildings.get(c.site);entries.push({depth:b?b.bottom+.09:c.y,id:c.module.id,kind:8,draw:ctx=>crate(ctx,c.x,c.y,c.z)});}
   entries.sort((a,b)=>a.depth-b.depth||a.kind-b.kind||a.id-b.id);return entries;};
  const render=g.render.bind(g);g.render=(...a)=>{render(...a);const state=V.presentation();if(!state.traces.length||g.frontier?.active())return;const ctx=g.ctx;ctx.save();ctx.setTransform(g.dpr,0,0,g.dpr,0,0);ctx.translate(g.width/2,g.height/2);ctx.scale(g.camera.zoom,g.camera.zoom);ctx.translate(-g.camera.x,-g.camera.y);ctx.strokeStyle='#f1d09a';ctx.lineWidth=2;for(const t of state.traces){ctx.beginPath();ctx.moveTo(t.from.x*R.tile,t.from.y*R.tile-t.from.z*R.projectedHeight);ctx.lineTo(t.to.x*R.tile,t.to.y*R.tile-t.to.z*R.projectedHeight);ctx.stroke();}ctx.restore();};
  g.vertical175Art={structure};
 }
 function createFPS(canvas){const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:false});if(!gl)return null;
  const vs=`attribute vec3 position; attribute vec3 color; uniform vec3 eye; uniform vec2 angles; uniform float aspect; varying vec3 tint; varying float distance;
  void main(){float y=angles.x,p=angles.y;vec3 right=vec3(-sin(y),cos(y),0.);vec3 forward=vec3(cos(y)*cos(p),sin(y)*cos(p),sin(p));vec3 up=cross(right,forward)*-1.;vec3 v=position-eye;float z=dot(v,forward);gl_Position=vec4(dot(v,right)*1.3/aspect,dot(v,up)*1.3,z*1.0005-.20005,z);tint=color;distance=length(v);}`;
  const fs=`precision mediump float; varying vec3 tint; varying float distance; uniform float light; void main(){vec3 fog=mix(vec3(.065,.08,.067),vec3(.31,.36,.31),light);gl_FragColor=vec4(mix(tint*(.28+light*.72),fog,clamp(distance/190.,0.,.9)),1.);}`;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(log);}return s;};
  let program,vertex,fragment;try{program=gl.createProgram();vertex=shader(gl.VERTEX_SHADER,vs);fragment=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){if(program)gl.deleteProgram(program);return null;}finally{if(vertex)gl.deleteShader(vertex);if(fragment)gl.deleteShader(fragment);}
  const buffer=gl.createBuffer(),position=gl.getAttribLocation(program,'position'),color=gl.getAttribLocation(program,'color'),eye=gl.getUniformLocation(program,'eye'),angles=gl.getUniformLocation(program,'angles'),aspect=gl.getUniformLocation(program,'aspect'),light=gl.getUniformLocation(program,'light');let lost=false;
  const onLost=e=>{e.preventDefault();lost=true;};canvas.addEventListener('webglcontextlost',onLost);
  function cube(out,box,tint){const {x,y,z,w,h,d}=box,pts=[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]],faces=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]];
   faces.forEach((face,i)=>{const shade=[.5,1,.68,.83,.6,.75][i];for(const k of [0,1,2,0,2,3])out.push(...pts[face[k]],...tint.map(c=>c*shade));});
  }
  function humanoid(out,x,y,H,r,yaw,time,telegraph=false,floor=0){const skin=telegraph?[.56,.30,.20]:[.39,.42,.31],stride=Math.sin(time*3+x)*r*.3;
   cube(out,{x:x-r*.65,y:y-r*.45,z:floor+H*.35,w:r*1.3,h:r*.9,d:H*.45},skin);
   cube(out,{x:x-r*.42,y:y-r*.42,z:floor+H*.82,w:r*.84,h:r*.84,d:H*.18},[.60,.56,.43]);
   cube(out,{x:x-r*.6,y:y-r*.25+stride,z:floor,w:r*.43,h:r*.5,d:H*.38},[.22,.27,.21]);cube(out,{x:x+r*.17,y:y-r*.25-stride,z:floor,w:r*.43,h:r*.5,d:H*.38},[.22,.27,.21]);
   for(const s of [-1,1])cube(out,{x:x+s*r*.85-r*.16,y:y-r*.2,z:floor+(telegraph?H*.7:H*.38),w:r*.32,h:r*.4,d:H*.4},skin);
  }
  function draw(g){if(lost)return false;const V=g.vertical175,state=V.presentation(),q=V.moduleRef(state.controlled);if(!q)return false;
   const rect=canvas.getBoundingClientRect(),scale=Math.min(root.devicePixelRatio||1,1.5),w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   gl.viewport(0,0,w,h);const day=g.nightwatch?.isBlackout?.()?0:(g.daylight?.()??.6);gl.clearColor(.16*day+.04,.20*day+.04,.18*day+.04,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(program);
   const camera=V.muzzle(q),out=[];gl.uniform3f(eye,camera.x,camera.y,camera.z+.15);gl.uniform2f(angles,q.m.yaw,q.m.pitch);gl.uniform1f(aspect,w/h);gl.uniform1f(light,day);
   cube(out,{x:0,y:0,z:-.2,w:C.WORLD_SIZE/R.tile,h:C.WORLD_SIZE/R.tile,d:.2},[.27,.31,.23]);
   for(const b of V.geometry()){if(b.module===q.m.id)continue;const def=R.bases[g.world.buildings.get(b.owner)?.type];let tint=b.type==='deck'?[.60,.59,.48]:b.type==='module'?[.35,.42,.34]:[.50,.52,.43];if(def?.age177&&b.type==='structure')tint=[1,3,5].map(i=>parseInt(def.color.slice(i,i+2),16)/255);cube(out,b,tint);}
   for(const s of state.sites){const b=g.world.buildings.get(s.id);if(!alive(b)||!b.completed)continue;const box=S.bounds(b);for(let i=0;i<s.decks.length;i++){if(s.decks[i].progress<1)continue;const z=R.bases[b.type].height+i*R.deckRise;
     for(const rail of V.network.railGeometry(b,i))cube(out,rail,[.68,.64,.47]);
    }}
   for(const pile of V.pressure()){if(pile.height<.3)continue;const b=g.world.buildings.get(pile.site);if(!alive(b))continue;const box=S.bounds(b),N=C.VerticalSiege176.pressureSteps,apron=C.VerticalSiege176.apron;
    for(let i=0;i<N;i++){const size=apron*(N-i)/N,vertical=pile.height/N,z=i*vertical,side=pile.side;const shape=side===0?{x:box.x,y:box.y-size,w:box.w,h:size}:side===1?{x:box.x+box.w,y:box.y,w:size,h:box.h}:side===2?{x:box.x,y:box.y+box.h,w:box.w,h:size}:{x:box.x-size,y:box.y,w:size,h:box.h};cube(out,{...shape,z,d:vertical},[.32,.29,.23]);}
   }
   const visible=V.sightQuery(camera,q.def.range,q.m.id);
   for(const e of g.zombies)if(visible(e))humanoid(out,e.x/R.tile,e.y/R.tile,e.kind==='crawler'?.6:1.8,e.radius/R.tile,e.facing||0,g.elapsed,false,V.enemyPose(e).z);
   for(const e of state.giants){if(!visible(e))continue;const d=R.siege.kinds[e.kind];humanoid(out,e.x/R.tile,e.y/R.tile,d.height,d.radius,e.yaw,g.elapsed,e.windup>0);}
   for(const c of V.network.presentation().crates)cube(out,{x:c.x/R.tile-.325,y:c.y/R.tile-.325,z:c.z,w:.65,h:.65,d:.65},[.56,.44,.28]);
   for(const u of g.units)if(alive(u))humanoid(out,u.x/R.tile,u.y/R.tile,1.8,.28,0,0);
   for(const n of g.world.nodes)if(!n.depleted&&n.amount>0){const x=n.x/R.tile,y=n.y/R.tile;if(n.type==='wood'){cube(out,{x:x-.12,y:y-.12,z:0,w:.24,h:.24,d:2.5},[.35,.27,.17]);cube(out,{x:x-.8,y:y-.8,z:1.8,w:1.6,h:1.6,d:2.2},[.18,.28,.16]);}else cube(out,{x:x-.5,y:y-.5,z:0,w:1,h:1,d:.7},[.40,.42,.34]);}
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(out),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(color);gl.vertexAttribPointer(color,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,out.length/6);return !gl.isContextLost();
  }
  return{draw,dispose(){canvas.removeEventListener('webglcontextlost',onLost);if(!lost){gl.deleteBuffer(buffer);gl.deleteProgram(program);}},get lost(){return lost;}};
 }
 const api={install,createFPS};root.DeadwallVertical175Render=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
