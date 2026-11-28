// Intro cinématique du studio et écran d'accueil, avant le menu principal existant.
// Présentation seulement : ce module ne lit ni n'écrit la campagne, n'appelle aucun tirage de
// simulation (son aléa est un générateur de présentation à graine fixe, calculé une fois) et
// n'avance aucune horloge de jeu. Il recouvre le menu principal, qui reste dans le document,
// intact et atteignable dès que l'écran d'accueil est franchi.
// Passage automatique : navigateur piloté (`navigator.webdriver`), `?intro=0`, harnais sans canvas.
// `?intro=1` force l'intro complète, `?intro=title` ouvre directement l'écran d'accueil.
(function(root,factory){
 'use strict';
 const api=factory(root);root.DeadwallIntroStudio218=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 else if(root.document&&root.DEADWALL){
  // Montage synchrone : le menu ne doit jamais apparaître une image avant l'intro.
  try{api.install(root.DEADWALL,root.document);}catch(error){/* une présentation facultative ne bloque jamais le jeu */}
 }
})(globalThis,function(root){
 'use strict';
 const PREF_KEY='deadwall-intro218-v1';
 const STUDIO='Darknigthmare Kingdoms Games Productions';
 const AUTHOR='un jeu de Darknigthmare';
 const TITLE='DEADWALL — The Last Enclosure';
 // Calendrier de l'intro, en secondes depuis le lancement (environ 15 s au total).
 const TIMELINE=Object.freeze({
  cards:Object.freeze([
   Object.freeze({id:'studio',from:0,to:3.6,text:STUDIO}),
   Object.freeze({id:'presents',from:3.6,to:5.6,text:'présente'}),
   Object.freeze({id:'author',from:5.6,to:8,text:AUTHOR})
  ]),
  fadeIn:.8,fadeOut:.6,
  scene:8,sceneFade:1.4,crack:11,crackSpan:.9,reveal:11.6,revealSpan:1.2,end:15
 });
 // Graine de présentation fixe : les mêmes silhouettes à chaque lancement, aucun flux de jeu.
 const PRESENTATION_SEED=0x218D17;
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
 function prng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 // Décor précalculé une seule fois ; le dessin n'est ensuite qu'une fonction du temps de présentation.
 function scenery(seed=PRESENTATION_SEED){
  const r=prng(seed),n=(k,f)=>Array.from({length:k},f);
  return Object.freeze({
   stars:n(70,()=>({x:r(),y:r()*.5,a:.08+r()*.22,s:.5+r()*1.1})),
   ridge:n(48,(_,i)=>({x:i/47,h:.012+r()*.035+(r()<.18?r()*.05:0),flat:r()<.35})),
   fires:n(5,()=>({x:.08+r()*.84,s:.6+r()*.8,p:r()*6.28})),
   horde:n(220,()=>({u:r(),d:Math.pow(r(),.7),p:r()*6.28,s:.75+r()*.5,lean:(r()-.5)*.5,arm:r()<.45})).sort((a,b)=>a.d-b.d),
   embers:n(64,()=>({x:r(),y:r(),v:.55+r()*.9,w:.4+r()*1.4,p:r()*6.28,s:.7+r()*1.6,warm:r()})),
   crack:n(15,(_,i)=>({x:i/14,y:(i===0||i===14)?0:(r()-.5)*.5})),
   branches:n(4,()=>({at:.15+r()*.7,dx:(r()-.5)*.12,dy:(r()<.5?-1:1)*(.25+r()*.3)}))
  });
 }
 // Décision de lancement, pure : 'off' (menu direct), 'title' (accueil seul) ou 'intro'.
 function decide({search='',webdriver=false,hasCanvas=true,skipIntro=false}={}){
  let mode=null;try{mode=new URLSearchParams(search||'').get('intro');}catch{mode=null;}
  if(mode==='0'||mode==='off')return 'off';
  if(mode==='1')return 'intro';
  if(mode==='title')return 'title';
  if(webdriver||!hasCanvas)return 'off';
  return skipIntro?'title':'intro';
 }
 function readPref(storage){try{const raw=JSON.parse(storage?.getItem(PREF_KEY)||'{}');return{skipIntro:raw?.skipIntro===true};}catch{return{skipIntro:false};}}
 function writePref(storage,pref){try{storage?.setItem(PREF_KEY,JSON.stringify({skipIntro:pref.skipIntro===true}));return true;}catch{return false;}}
 // Carton actif et son opacité à l'instant t de l'intro.
 function cardAt(t){
  for(const c of TIMELINE.cards)if(t>=c.from&&t<c.to){
   const a=Math.min(smooth((t-c.from)/TIMELINE.fadeIn),smooth((c.to-t)/TIMELINE.fadeOut));
   return{id:c.id,text:c.text,alpha:a};
  }
  return null;
 }
 function sceneState(t,reduced){
  const T=TIMELINE;
  return{
   scene:smooth((t-T.scene)/T.sceneFade),
   crack:reduced?0:clamp((t-T.crack)/T.crackSpan,0,1),
   reveal:smooth((t-T.reveal)/T.revealSpan),
   done:t>=T.end
  };
 }

 /* ---------- Peinture ---------- */
 function drawLogo(ctx,cx,cy,S,t,m){
  ctx.save();ctx.translate(cx,cy);
  const gold='#8f7b4f',bone='#b8b1a0';
  const shield=()=>{ctx.beginPath();ctx.moveTo(-S*.42,-S*.34);ctx.lineTo(S*.42,-S*.34);ctx.lineTo(S*.42,S*.08);
   ctx.quadraticCurveTo(S*.4,S*.42,0,S*.6);ctx.quadraticCurveTo(-S*.4,S*.42,-S*.42,S*.08);ctx.closePath();};
  // Écu de fer sombre, double filet.
  const g=ctx.createLinearGradient(0,-S*.4,0,S*.6);g.addColorStop(0,'#1d2022');g.addColorStop(1,'#0a0b0c');
  shield();ctx.fillStyle=g;ctx.fill();ctx.lineWidth=Math.max(1.5,S*.018);ctx.strokeStyle=gold;ctx.stroke();
  ctx.save();ctx.scale(.86,.86);ctx.translate(0,-S*.01);shield();ctx.lineWidth=Math.max(1,S*.008);ctx.strokeStyle='#5d5038';ctx.stroke();ctx.restore();
  // Lune pâle derrière l'enceinte.
  ctx.save();shield();ctx.clip();
  ctx.beginPath();ctx.arc(S*.1,-S*.08,S*.15,0,Math.PI*2);ctx.fillStyle=bone;ctx.globalAlpha=.72;ctx.fill();
  ctx.beginPath();ctx.arc(S*.16,-S*.12,S*.14,0,Math.PI*2);ctx.fillStyle='#14171a';ctx.globalAlpha=1;ctx.fill();
  // Mur crénelé en silhouette, porte au centre.
  const top=S*.12,mer=S*.07;ctx.beginPath();ctx.moveTo(-S*.5,S*.7);ctx.lineTo(-S*.5,top);
  for(let x=-S*.5;x<S*.5;x+=mer*2){ctx.lineTo(x,top-mer);ctx.lineTo(x+mer,top-mer);ctx.lineTo(x+mer,top);ctx.lineTo(x+mer*2,top);}
  ctx.lineTo(S*.5,S*.7);ctx.closePath();ctx.fillStyle='#2a2d2f';ctx.fill();ctx.strokeStyle=gold;ctx.lineWidth=Math.max(1,S*.01);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-S*.07,S*.7);ctx.lineTo(-S*.07,S*.27);ctx.arc(0,S*.27,S*.07,Math.PI,0);ctx.lineTo(S*.07,S*.7);ctx.closePath();ctx.fillStyle='#0b0c0d';ctx.fill();
  // Fissure rouge sombre : la nuit qui entre.
  ctx.beginPath();ctx.moveTo(-S*.02,-S*.34);ctx.lineTo(S*.03,-S*.18);ctx.lineTo(-S*.03,-S*.02);ctx.lineTo(S*.02,S*.12);ctx.strokeStyle='#6a1d16';ctx.lineWidth=Math.max(1,S*.014);ctx.stroke();
  // Reflet qui balaie l'écu, une seule fois.
  if(m){const k=clamp((t-.9)/1.6,0,1);if(k>0&&k<1){const x=-S*.6+k*S*1.2,h=ctx.createLinearGradient(x-S*.1,0,x+S*.1,0);h.addColorStop(0,'#ffffff00');h.addColorStop(.5,'#f3e2b81c');h.addColorStop(1,'#ffffff00');ctx.fillStyle=h;ctx.fillRect(-S*.6,-S*.6,S*1.2,S*1.3);}}
  ctx.restore();
  // Couronne stylisée à trois fleurons.
  ctx.beginPath();const cw=S*.3,cb=-S*.4,ch=S*.2;
  ctx.moveTo(-cw,cb);ctx.lineTo(-cw,cb-ch*.55);ctx.lineTo(-cw*.5,cb-ch*.3);ctx.lineTo(0,cb-ch);ctx.lineTo(cw*.5,cb-ch*.3);ctx.lineTo(cw,cb-ch*.55);ctx.lineTo(cw,cb);ctx.closePath();
  ctx.fillStyle='#151719';ctx.fill();ctx.strokeStyle=gold;ctx.lineWidth=Math.max(1.2,S*.014);ctx.stroke();
  for(const [x,y]of [[-cw,cb-ch*.55],[0,cb-ch],[cw,cb-ch*.55]]){ctx.beginPath();ctx.arc(x,y-S*.022,S*.022,0,Math.PI*2);ctx.fillStyle=gold;ctx.fill();}
  ctx.restore();
 }
 function drawWalker(ctx,x,y,s,a,lean,arm,bob){
  ctx.save();ctx.translate(x,y+bob);ctx.rotate(lean*.25);
  ctx.beginPath();ctx.moveTo(-s*.32,0);ctx.lineTo(-s*.26,-s*1.25);ctx.quadraticCurveTo(0,-s*1.5,s*.26,-s*1.25);ctx.lineTo(s*.32,0);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.arc(s*.05,-s*1.62,s*.24,0,Math.PI*2);ctx.fill();
  if(arm){ctx.beginPath();ctx.moveTo(s*.18,-s*1.2);ctx.lineTo(s*.62,-s*1.0);ctx.lineTo(s*.58,-s*.9);ctx.lineTo(s*.14,-s*1.02);ctx.closePath();ctx.fill();}
  ctx.restore();
 }
 // Enceinte la nuit, horde au loin, braises. `t` : temps de présentation ; `m` : 0 si mouvement réduit.
 function drawScene(ctx,w,h,t,m,D,alpha=1){
  if(alpha<=0)return;
  ctx.save();ctx.globalAlpha=alpha;
  const hy=h*.6,wallTop=h*.74;
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#040608');sky.addColorStop(.45,'#0a0f13');sky.addColorStop(.6,'#24150f');sky.addColorStop(.62,'#0c0d0c');sky.addColorStop(1,'#050605');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#d8d4c8';for(const s of D.stars){ctx.globalAlpha=alpha*s.a;ctx.fillRect(s.x*w,s.y*h,s.s,s.s);}
  // Lueurs d'incendies lointains sur l'horizon.
  for(const f of D.fires){const k=.75+.25*Math.sin(t*1.7*m+f.p),r=h*.16*f.s,gl=ctx.createRadialGradient(f.x*w,hy,0,f.x*w,hy,r);gl.addColorStop(0,`rgba(150,62,26,${.34*k})`);gl.addColorStop(1,'rgba(150,62,26,0)');ctx.globalAlpha=alpha;ctx.fillStyle=gl;ctx.fillRect(f.x*w-r,hy-r,r*2,r*2);}
  // Crête en ruine.
  ctx.globalAlpha=alpha;ctx.fillStyle='#0a0c0c';ctx.beginPath();ctx.moveTo(0,hy+2);
  for(const p of D.ridge){const y=hy-p.h*h;if(p.flat){ctx.lineTo(p.x*w,y);ctx.lineTo(p.x*w+w/60,y);}else ctx.lineTo(p.x*w,y);}
  ctx.lineTo(w,hy+2);ctx.closePath();ctx.fill();
  // Plaine sombre et brume.
  const plain=ctx.createLinearGradient(0,hy,0,wallTop);plain.addColorStop(0,'#2a1a12');plain.addColorStop(.35,'#16120f');plain.addColorStop(1,'#0b0c0b');ctx.fillStyle=plain;ctx.fillRect(0,hy,w,wallTop-hy+2);
  // Horde : elle avance lentement vers la porte, toujours plus nombreuse que menaçante une à une.
  const adv=clamp(t/18,0,1)*.32,unit=h/900;
  ctx.fillStyle='#030303';
  for(const z of D.horde){
   const d=clamp(z.d*.62+adv*m+(m?0:.12),0,1),y=hy+3+Math.pow(d,1.5)*(wallTop-hy+h*.02),s=(2.2+d*11)*unit*z.s;
   if(y-s*1.9>wallTop)continue;
   const x=w*(.5+(z.u-.5)*(1.25-d*.55))+Math.sin(t*1.1*m+z.p)*s*.25,bob=Math.abs(Math.sin(t*2.2*m+z.p))*s*.06;
   ctx.globalAlpha=alpha*(.7+d*.3);drawWalker(ctx,x,y,s,1,z.lean,z.arm,-bob);
  }
  ctx.globalAlpha=alpha;
  const mist=ctx.createLinearGradient(0,hy-h*.02,0,wallTop);mist.addColorStop(0,'rgba(60,66,64,0)');mist.addColorStop(.5,'rgba(60,66,64,.16)');mist.addColorStop(1,'rgba(60,66,64,0)');
  ctx.fillStyle=mist;ctx.fillRect(0,hy-h*.02,w,wallTop-hy+h*.02);
  // Projecteur de la tour gauche, balayage lent vers la horde.
  const tx=w*.17,ty=h*.5,ang=-.08+Math.sin(t*.35*m)*.18,len=w*.9;
  ctx.save();ctx.translate(tx,ty);ctx.rotate(ang);const beam=ctx.createLinearGradient(0,0,len,0);beam.addColorStop(0,'rgba(196,208,206,.22)');beam.addColorStop(1,'rgba(196,208,206,0)');
  ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(0,-3*unit);ctx.lineTo(len,h*.05);ctx.lineTo(len,h*.16);ctx.lineTo(0,3*unit);ctx.closePath();ctx.fill();ctx.restore();
  // Enceinte : palissade, sacs, tours, porte.
  ctx.fillStyle='#030404';ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,wallTop);
  const post=Math.max(8,w/90);for(let x=0;x<=w+post;x+=post){const g=Math.abs(x-w*.5)<w*.07;const top=g?wallTop+h*.02:wallTop-(((x/post)|0)%2?h*.012:0);ctx.lineTo(x,top);ctx.lineTo(x+post*.5,top-h*.012);}
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();
  for(const [cx,top]of [[w*.17,h*.46],[w*.82,h*.5]]){const tw=Math.max(26,w*.045);ctx.fillRect(cx-tw/2,top,tw,h-top);ctx.beginPath();ctx.moveTo(cx-tw*.75,top);ctx.lineTo(cx,top-tw*.55);ctx.lineTo(cx+tw*.75,top);ctx.closePath();ctx.fill();
   ctx.fillStyle='rgba(214,160,90,.55)';ctx.fillRect(cx-tw*.18,top+tw*.35,tw*.36,tw*.22);ctx.fillStyle='#030404';}
  // Porte : deux poteaux hauts, une lampe chaude, les vantaux plus sombres que le mur.
  const gx=w*.5,gw=w*.13;ctx.fillRect(gx-gw/2-6,wallTop-h*.07,10,h);ctx.fillRect(gx+gw/2-4,wallTop-h*.07,10,h);
  const lamp=ctx.createRadialGradient(gx,wallTop-h*.05,0,gx,wallTop-h*.05,h*.12);lamp.addColorStop(0,`rgba(230,170,96,${.28+.06*Math.sin(t*3*m)})`);lamp.addColorStop(1,'rgba(230,170,96,0)');ctx.fillStyle=lamp;ctx.fillRect(gx-h*.12,wallTop-h*.17,h*.24,h*.24);
  // Barbelés.
  ctx.strokeStyle='rgba(120,126,122,.35)';ctx.lineWidth=1;ctx.beginPath();const loop=Math.max(10,w/70);
  for(let x=0;x<w;x+=loop){ctx.moveTo(x,wallTop-h*.014);ctx.arc(x+loop/2,wallTop-h*.014,loop/2,Math.PI,0);}ctx.stroke();
  // Braises qui montent de la cité.
  for(const e of D.embers){
   const travel=(e.y+t*.06*e.v*m)%1.15,y=h*(1.05-travel),x=e.x*w+Math.sin(t*e.w*m+e.p)*18*unit,fade=clamp(1-travel/1.05,0,1)*(m?1:.6);
   if(fade<=0)continue;const rr=e.s*unit*1.5;const col=e.warm>.5?'255,150,70':'255,196,120';
   ctx.globalAlpha=alpha*fade*.85;ctx.fillStyle=`rgba(${col},1)`;ctx.fillRect(x-rr/2,y-rr/2,rr,rr*1.4);
   ctx.globalAlpha=alpha*fade*.1;ctx.beginPath();ctx.arc(x,y,rr*1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=alpha;
  const v=ctx.createRadialGradient(w/2,h*.55,Math.min(w,h)*.3,w/2,h*.55,Math.max(w,h)*.8);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.72)');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
  ctx.restore();
 }
 // Fond des cartons : noir, quelques braises éteintes.
 function drawCardBackground(ctx,w,h,t,m,D){
  ctx.fillStyle='#030404';ctx.fillRect(0,0,w,h);const unit=h/900;
  for(const e of D.embers.slice(0,22)){const travel=(e.y+t*.03*e.v*m)%1.15,y=h*(1.05-travel),x=e.x*w,fade=clamp(1-travel,0,1)*.4;ctx.globalAlpha=fade;ctx.fillStyle='#b86a36';ctx.fillRect(x,y,e.s*unit*1.6,e.s*unit*1.6);}
  ctx.globalAlpha=1;
 }
 // Fissure du titre, sur le calque au-dessus du texte. `rect` : boîte du titre en pixels du calque.
 function drawCrack(ctx,rect,p,glow,D){
  if(!rect||p<=0)return;
  const pts=D.crack,last=Math.floor(p*(pts.length-1)),part=p*(pts.length-1)-last;
  const at=pt=>[rect.x+pt.x*rect.w,rect.y+rect.h*(.5+pt.y*.5)];
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const [width,color]of [[6,`rgba(255,140,60,${.22*glow})`],[2,`rgba(255,214,160,${.9*glow})`],[1,`rgba(40,10,6,${.85*(1-glow)})`]]){
   ctx.beginPath();let [x,y]=at(pts[0]);ctx.moveTo(x,y);
   for(let i=1;i<=last;i++){[x,y]=at(pts[i]);ctx.lineTo(x,y);}
   if(last<pts.length-1){const [ax,ay]=at(pts[last]),[bx,by]=at(pts[last+1]);ctx.lineTo(ax+(bx-ax)*part,ay+(by-ay)*part);}
   for(const b of D.branches)if(b.at<p){const [bx,by]=at({x:b.at,y:0});ctx.moveTo(bx,by);ctx.lineTo(bx+b.dx*rect.w,by+b.dy*rect.h*.5);}
   ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
  }
  ctx.restore();
 }

 /* ---------- Son grave discret ---------- */
 // Uniquement si le contexte audio du jeu est déjà débloqué et actif ; sinon silence.
 function rumble(g,{freq=46,duration=2.4,level=.5}={}){
  const a=g?.audio,ctx=a?.ctx;
  if(!ctx||!a.master||!a.enabled||a.muted||!(a.volume>0)||ctx.state!=='running')return false;
  try{
   const now=ctx.currentTime,o=ctx.createOscillator(),o2=ctx.createOscillator(),gain=ctx.createGain();
   o.type='sine';o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(freq*.78,now+duration);
   o2.type='triangle';o2.frequency.setValueAtTime(freq*1.5,now);
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(level,now+.25);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
   o.connect(gain);o2.connect(gain);gain.connect(a.master);o.start(now);o2.start(now);o.stop(now+duration+.05);o2.stop(now+duration+.05);
   o.onended=()=>{try{gain.disconnect();}catch{}};return true;
  }catch{return false;}
 }

 /* ---------- Styles ---------- */
 const CSS=`
#studioIntro218{position:fixed;inset:0;z-index:9000;display:block;overflow:hidden;background:#030404;color:#e9e5d8;font-family:"Bahnschrift","Arial Narrow",system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-user-select:none;transition:opacity .45s ease}
#studioIntro218.leaving218{opacity:0}
#studioIntro218 canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#studioIntro218 .fx218{pointer-events:none;z-index:3}
#studioIntro218 .card218{position:absolute;left:16px;right:16px;top:50%;transform:translateY(-50%);margin:0;text-align:center;opacity:0;z-index:2;letter-spacing:.18em;text-transform:uppercase;color:#d9d2bf;font-weight:600}
#studioIntro218 .card218[data-card="studio"]{top:calc(40% + min(100vw,100vh)*.19);transform:none;font-size:clamp(14px,2.3vw,26px);color:#cbbd94}
#studioIntro218 .card218[data-card="presents"]{font-size:clamp(14px,1.9vw,20px);letter-spacing:.5em;text-transform:lowercase;color:#a9a391;font-weight:400}
#studioIntro218 .card218[data-card="author"]{font-size:clamp(16px,2.4vw,26px);letter-spacing:.24em;text-transform:none;font-style:italic;font-weight:400;color:#c9c2ae}
#studioIntro218 .title218{position:absolute;left:16px;right:16px;top:clamp(36px,16vh,180px);margin:0;text-align:center;z-index:2;opacity:var(--title-alpha,0);clip-path:inset(calc((1 - var(--reveal,0)) * 50%) -4% calc((1 - var(--reveal,0)) * 50%) -4%);line-height:.92}
#studioIntro218 .title218 .main218{display:inline-block;font-size:clamp(46px,min(11vw,17vh),128px);font-weight:900;letter-spacing:-.05em;color:#eeecdf;text-shadow:0 4px 26px #000c}
#studioIntro218 .title218 .main218 span{color:#dfbd77}
#studioIntro218 .title218 .sub218{display:block;margin-top:.7em;font-size:clamp(13px,min(2.2vw,3.6vh),24px);font-weight:500;letter-spacing:.34em;text-transform:uppercase;color:#bfb69c}
#studioIntro218 .prompt218{position:absolute;left:50%;bottom:calc(16% + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:4;min-width:0;max-width:calc(100% - 32px);padding:12px 22px;border:1px solid #806b4280;background:#05070699;color:#f1d390;font:inherit;font-size:clamp(13px,1.8vw,18px);font-weight:700;letter-spacing:.3em;text-transform:uppercase;white-space:nowrap;cursor:pointer;animation:blink218 1.6s ease-in-out infinite}
#studioIntro218 .prompt218:hover{background:#0a0d0bcc;color:#fff4d8}
#studioIntro218 .skip218{position:absolute;right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:4;padding:8px 14px;border:1px solid #5b564a80;background:#0006;color:#a9a391;font:inherit;font-size:12px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer}
#studioIntro218 .skip218:hover{color:#f1d390;border-color:#806b42}
#studioIntro218 .footer218{position:absolute;left:16px;right:16px;bottom:calc(14px + env(safe-area-inset-bottom,0px));margin:0;z-index:4;text-align:center;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:#7f7a6b}
#studioIntro218 .sr218{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
#studioIntro218 [hidden]{display:none!important}
#studioIntro218 :focus-visible{outline:2px solid #f1d390;outline-offset:3px}
@keyframes blink218{0%,100%{opacity:1}50%{opacity:.28}}
#studioIntro218.reduced218 .prompt218{animation:none}
@media (prefers-reduced-motion: reduce){#studioIntro218 .prompt218{animation:none}#studioIntro218{transition:none}}
@media (max-height:500px) and (orientation:landscape){#studioIntro218 .title218{top:clamp(16px,9vh,60px)}#studioIntro218 .prompt218{bottom:calc(20% + env(safe-area-inset-bottom,0px));padding:8px 16px}#studioIntro218 .footer218{bottom:calc(6px + env(safe-area-inset-bottom,0px));font-size:9px}}
@media (max-width:520px){#studioIntro218 .prompt218{letter-spacing:.18em}#studioIntro218 .footer218{font-size:9px;letter-spacing:.18em}#studioIntro218 .title218 .sub218{letter-spacing:.22em}}
`;

 /* ---------- Installation ---------- */
 function environment(doc){
  let hasCanvas=false;
  // Le harnais Node n'a ni HTMLCanvasElement ni vraie boucle d'images : menu direct.
  try{hasCanvas=typeof root.HTMLCanvasElement==='function'&&typeof root.requestAnimationFrame==='function';}catch{hasCanvas=false;}
  return{search:root.location?.search||'',webdriver:root.navigator?.webdriver===true,hasCanvas,skipIntro:readPref(root.localStorage).skipIntro};
 }
 function prefersReduced(g){
  if(g?.settings?.reducedMotion===true)return true;
  try{return Boolean(root.matchMedia?.('(prefers-reduced-motion: reduce)').matches);}catch{return false;}
 }
 // Réglage « Passer l'intro au lancement » : préférence locale, jamais dans la sauvegarde de campagne.
 // Marque portée par le document : une seule ligne de réglage, même si le module est chargé deux fois.
 const SETTING_MARK=Symbol.for('deadwall.intro218.setting');
 function installSetting(doc){
  if(doc[SETTING_MARK])return doc[SETTING_MARK];
  const motion=doc.getElementById?.('settingsMotion');const anchor=motion?.closest?.('label')||null;
  const label=doc.createElement('label');label.className='settings-row';label.classList?.add?.('settings-row');label.setAttribute('for','settingsSkipIntro218');label.id='settingsSkipIntroRow218';
  label.textContent='Passer l’intro au lancement';
  const input=doc.createElement('input');input.id='settingsSkipIntro218';input.type='checkbox';input.setAttribute('type','checkbox');
  input.setAttribute('aria-describedby','settingsSkipIntroNote218');input.checked=readPref(root.localStorage).skipIntro;label.appendChild(input);
  const note=doc.createElement('p');note.id='settingsSkipIntroNote218';note.className='settings-status';note.classList?.add?.('settings-status');note.textContent='Coché : le lancement ouvre directement l’écran d’accueil. Réglage propre à cet appareil.';
  input.addEventListener('change',event=>{writePref(root.localStorage,{skipIntro:event?.target?.checked===true||input.checked===true});});
  doc[SETTING_MARK]=input;
  const parent=anchor?.parentNode;
  if(parent&&typeof anchor.after==='function'){anchor.after(label);label.after?label.after(note):parent.appendChild(note);}
  else if(parent&&typeof parent.insertBefore==='function'&&anchor.nextSibling!==undefined){parent.insertBefore(label,anchor.nextSibling);parent.insertBefore(note,label.nextSibling??null);}
  else{const host=doc.querySelector?.('#settingsModal fieldset')||doc.getElementById?.('settingsModal');if(!host?.appendChild)return input;host.appendChild(label);host.appendChild(note);}
  return input;
 }
 function install(g,doc,options={}){
  if(!g||!doc?.body||g.introStudio218)return false;
  const setting=installSetting(doc);
  const env={...environment(doc),...(options.env||{})};
  const mode=options.mode||decide(env);
  let phase='menu';
  const api={mode,phase:()=>phase,isOpen:()=>phase!=='menu',setting,skip:()=>false,start:()=>false,time:()=>0};
  g.introStudio218=api;
  if(mode==='off')return true;
  const menu=g.ui?.mainMenu||doc.getElementById('mainMenu');
  // Une campagne déjà en cours (rechargement à chaud) n'est jamais recouverte.
  if(g.state&&g.state!=='menu'){return true;}
  const reduced=options.reduced??prefersReduced(g),m=reduced?0:1,D=scenery();
  const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls){n.className=cls;n.classList?.add?.(...cls.split(' '));}if(text!==undefined)n.textContent=text;return n;};
  if(!doc.getElementById('studioIntroStyle218')&&doc.head?.appendChild){const st=el('style');st.id='studioIntroStyle218';st.textContent=CSS;doc.head.appendChild(st);}
  const overlay=el('div',reduced?'reduced218':undefined);overlay.id='studioIntro218';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Introduction de DEADWALL');
  const bg=el('canvas','bg218');bg.setAttribute('aria-hidden','true');
  const fx=el('canvas','fx218');fx.setAttribute('aria-hidden','true');
  const cards=TIMELINE.cards.map(c=>{const p=el('p','card218',c.text);p.dataset.card=c.id;p.setAttribute('aria-hidden','true');return p;});
  const title=el('h1','title218');title.id='studioIntroTitle218';title.setAttribute('aria-label',TITLE);
  const main=el('span','main218','DEAD');const wall=el('span',undefined,'WALL');main.appendChild(wall);main.setAttribute('aria-hidden','true');
  const sub=el('span','sub218','— The Last Enclosure');sub.setAttribute('aria-hidden','true');title.append(main,sub);
  const live=el('p','sr218');live.setAttribute('aria-live','polite');live.id='studioIntroLive218';
  const skipButton=el('button','skip218','Passer ›');skipButton.type='button';skipButton.id='studioIntroSkip218';skipButton.setAttribute('aria-label','Passer l’introduction');
  const prompt=el('button','prompt218','Appuyez pour commencer');prompt.type='button';prompt.id='studioIntroPrompt218';prompt.setAttribute('aria-describedby','studioIntroTitle218');prompt.hidden=true;
  const footer=el('p','footer218',STUDIO);footer.id='studioIntroFooter218';footer.hidden=true;
  overlay.append(bg,...cards,title,fx,live,skipButton,prompt,footer);
  doc.body.appendChild(overlay);doc.body.classList?.add('intro218-open');
  // Le menu reste en place sous le rideau, inerte tant que le rideau est levé.
  const inertBefore=new Map();
  const shield=()=>{if(phase==='menu')return;for(const n of [menu,g.ui?.hud])if(n){if(!inertBefore.has(n))inertBefore.set(n,n.inert);n.inert=true;}overlay.inert=false;};
  const baseSync=typeof g.syncOverlayFocus==='function'?g.syncOverlayFocus.bind(g):null;
  if(baseSync)g.syncOverlayFocus=(...args)=>{const r=baseSync(...args);shield();return r;};
  let t=0,last=null,frame=0,announced=null,phaseAt=0,downPhase=null,sounded={studio:false,title:false},leaving=false;
  const nowMs=options.now||(()=>root.performance?.now?.()??Date.now());
  const sizeCanvas=c=>{const dpr=Math.min(2,root.devicePixelRatio||1),w=Math.max(1,overlay.clientWidth||root.innerWidth||1280),h=Math.max(1,overlay.clientHeight||root.innerHeight||720);
   if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}return{w,h,dpr};};
  const titleRect=()=>{try{const a=title.getBoundingClientRect(),b=overlay.getBoundingClientRect(),s=main.getBoundingClientRect();return{x:s.left-b.left,y:s.top-b.top,w:s.width||a.width,h:s.height||a.height};}catch{return null;}};
  const setPhase=next=>{phase=next;phaseAt=nowMs();overlay.dataset.phase=next;};
  function announce(text){if(text&&text!==announced){announced=text;live.textContent=text;}}
  function paint(){
   const b=bg.getContext?.('2d'),f=fx.getContext?.('2d');if(!b||!f)return;
   const {w,h,dpr}=sizeCanvas(bg);sizeCanvas(fx);
   b.setTransform(dpr,0,0,dpr,0,0);f.setTransform(dpr,0,0,dpr,0,0);f.clearRect(0,0,w,h);
   const s=phase==='title'?{scene:1,crack:1,reveal:1}:sceneState(t,reduced),card=phase==='intro'?cardAt(t):null;
   if(s.scene<1)drawCardBackground(b,w,h,t,m,D);
   drawScene(b,w,h,t,m,D,s.scene);
   if(card?.id==='studio'){const S=Math.min(w,h)*.28;b.save();b.globalAlpha=card.alpha;drawLogo(b,w/2,h*.4,S,t,m);b.restore();}
   for(const c of cards){const on=card?.id===c.dataset.card;const a=on?card.alpha:0;if(c.style)c.style.opacity=String(Math.round(a*1000)/1000);}
   const titleAlpha=phase==='title'?1:s.reveal;
   title.style?.setProperty?.('--title-alpha',String(reduced?titleAlpha:Math.min(1,titleAlpha*1.4)));
   title.style?.setProperty?.('--reveal',String(reduced?1:titleAlpha));
   if(!reduced&&s.crack>0){const glow=phase==='title'?0:clamp(1-(t-TIMELINE.reveal-TIMELINE.revealSpan)/1.6,0,1);drawCrack(f,titleRect(),s.crack,Math.max(glow,.0),D);}
  }
  function tick(ms){
   if(phase==='menu')return;
   const dt=last===null?0:clamp((ms-last)/1000,0,.1);last=ms;t+=dt;
   if(phase==='intro'){
    const card=cardAt(t);
    if(card)announce(card.id==='studio'?STUDIO:card.text);
    if(card?.id==='studio'&&!sounded.studio){sounded.studio=true;rumble(g,{freq:41,duration:2.6,level:.35});}
    if(t>=TIMELINE.crack&&!sounded.title){sounded.title=true;rumble(g,{freq:38,duration:3.2,level:.55});}
    if(t>=TIMELINE.scene)announce(TITLE);
    if(t>=TIMELINE.end)toTitle();
   }
   paint();
  }
  function loop(ms){if(phase==='menu')return;tick(ms);frame=root.requestAnimationFrame?.(loop)||0;}
  function toTitle(){
   if(phase!=='intro')return false;
   setPhase('title');if(t<TIMELINE.end)t=Math.max(t,TIMELINE.end);
   overlay.setAttribute('aria-label','Écran d’accueil de DEADWALL');
   for(const c of cards)if(c.style)c.style.opacity='0';
   skipButton.hidden=true;prompt.hidden=false;footer.hidden=false;
   announce(TITLE+'. Appuyez pour commencer.');
   prompt.focus?.({preventScroll:true});paint();return true;
  }
  // L'interaction de l'écran d'accueil débloque l'audio, puis rend la main au menu principal.
  function start(){
   if(phase!=='title'||leaving)return false;
   leaving=true;
   try{g.audio?.unlock?.();}catch{}
   const ctx=g.audio?.ctx;
   try{Promise.resolve(ctx&&ctx.state!=='running'?ctx.resume?.():null).then(()=>rumble(g,{freq:52,duration:1.4,level:.4}),()=>{});}catch{}
   overlay.classList?.add('leaving218');
   const finish=()=>close();
   // Le rideau garde les pointeurs le temps du fondu : le clic qui suit ne tombe pas sur le menu.
   if(options.immediate||!root.setTimeout)finish();else root.setTimeout(finish,reduced?250:450);
   return true;
  }
  function close(){
   if(phase==='menu')return false;
   setPhase('menu');if(frame&&root.cancelAnimationFrame)root.cancelAnimationFrame(frame);frame=0;
   for(const [type,h]of listeners)root.removeEventListener?.(type,h,true);
   overlay.remove?.();doc.body.classList?.remove('intro218-open');
   for(const [n,inert]of inertBefore)n.inert=inert;inertBefore.clear();
   g.syncOverlayFocus?.();
   const target=[doc.getElementById('continueButton'),doc.getElementById('newGameButton')].find(b=>b&&!b.disabled&&!b.closest?.('[inert], .hidden'));
   if(g.state==='menu')target?.focus?.({preventScroll:true});
   return true;
  }
  const ignoredKeys=new Set(['Tab','ShiftLeft','ShiftRight','ControlLeft','ControlRight','AltLeft','AltRight','MetaLeft','MetaRight','CapsLock','OSLeft','OSRight']);
  const fresh=()=>nowMs()-phaseAt>=250;
  const listeners=[
   ['keydown',event=>{
    if(phase==='menu')return;
    if(event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.code==='Tab'||event.key==='Tab'){event.preventDefault?.();(phase==='title'?prompt:skipButton).focus?.({preventScroll:true});event.stopImmediatePropagation?.();return;}
    if(ignoredKeys.has(event.code))return;
    event.preventDefault?.();event.stopImmediatePropagation?.();
    if(event.repeat)return;
    if(phase==='intro')toTitle();else if(fresh())start();
   }],
   ['keyup',event=>{if(phase!=='menu'&&!ignoredKeys.has(event.code)){event.preventDefault?.();event.stopImmediatePropagation?.();}}],
   ['pointerdown',event=>{if(phase==='menu'||!overlay.contains?.(event.target))return;downPhase=phase;event.preventDefault?.();if(phase==='intro')toTitle();}],
   ['pointerup',event=>{if(phase==='menu'||!overlay.contains?.(event.target))return;event.preventDefault?.();if(phase==='title'&&downPhase==='title'&&fresh())start();downPhase=null;}],
  ];
  for(const [type,h]of listeners)root.addEventListener?.(type,h,true);
  // Activation sans pointeur ni touche (lecteur d'écran, curseur virtuel) : le clic suffit.
  skipButton.addEventListener('click',event=>{event?.stopPropagation?.();if(phase==='intro'&&downPhase===null)toTitle();});
  prompt.addEventListener('click',event=>{event?.stopPropagation?.();if(phase==='title'&&downPhase===null&&fresh())start();});
  // Aucun clic du rideau n'atteint les écouteurs du jeu.
  overlay.addEventListener('click',event=>{event?.stopPropagation?.();});
  setPhase('intro');shield();
  if(mode==='title')toTitle();else{announce(STUDIO);skipButton.focus?.({preventScroll:true});}
  Object.assign(api,{
   skip:()=>phase==='intro'?toTitle():false,
   start,close,time:()=>t,
   // Avance de présentation pour les tests et les captures ; jamais appelé par le jeu.
   advance:seconds=>{let base=last??0;last=base;for(let left=Math.max(0,seconds);left>0&&phase!=='menu';left-=.1){base+=Math.min(.1,left)*1000;tick(base);}return phase;},
   reduced,overlay
  });
  if(!options.manual&&root.requestAnimationFrame)frame=root.requestAnimationFrame(loop);
  return true;
 }
 return Object.freeze({install,decide,readPref,writePref,cardAt,sceneState,scenery,prng,drawScene,drawLogo,drawCrack,rumble,TIMELINE,PREF_KEY,PRESENTATION_SEED,STUDIO,AUTHOR,TITLE});
});
