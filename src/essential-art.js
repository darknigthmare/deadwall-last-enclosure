(function(root){'use strict';const C=root.DeadwallCore;function symbol(c,x,y,kind,size=1,g=null,identity=kind){if(root.DeadwallWorldPropsArt153?.drawEssential(c,g?.art,kind,x,y,size,{identity,seed:g?.world?.seed??0}))return;c.save();c.translate(x,y);c.scale(size,size);c.fillStyle=kind==='aid'?'#90c5b4':kind==='brace'?'#bd9d78':kind==='decoy'?'#d28c6f':'#e8dba3';c.strokeStyle='#f0e7c9';c.lineWidth=.08;c.fillRect(-.35,-.24,.7,.48);c.strokeRect(-.35,-.24,.7,.48);c.strokeStyle='#293e35';c.lineWidth=.065;c.beginPath();if(kind==='aid'){c.moveTo(-.18,0);c.lineTo(.18,0);c.moveTo(0,-.15);c.lineTo(0,.15);}else{c.moveTo(-.23,-.13);c.lineTo(.23,.13);c.moveTo(-.23,.13);c.lineTo(.23,-.13);}c.stroke();c.restore();}
function depthEntries(g,domain,v,view,s=g.essentials?.snapshot()){
 if(!s)return[];const scale=domain==='local'?32:1,entries=[];
 const visible=p=>domain==='local'?(!view||g.visible(p.x,p.y,32,view)):
  (!view||p.x>=view.l-1&&p.x<=view.r+1&&p.y>=view.t-1&&p.y<=view.b+1)&&
  (root.DeadwallFrontierArt?.visiblePoint?.(g,p,v)??(p.z===v.z&&(v.z===0||p.inside===v.inside)));
 const add=(id,p,kind,size,extra,effect=false)=>{if(!visible(p))return;entries.push({kind:'equipment',id:'essential:'+id,x:p.x,y:p.y,depth:p.y+.24*scale,draw(c){const painted=effect&&kind==='light'&&root.DeadwallWorldPropsArt153?.drawLight(c,g.art,'worklight',p.x,p.y,size*scale,{identity:id,seed:g.world?.seed??0,on:p.left>0,time:g.elapsed,reducedMotion:g.settings?.reducedMotion});if(!painted)symbol(c,p.x,p.y,kind,size*scale,g,id);extra?.(c);}});};
 if(domain==='region')for(const t of g.essentials.targets()){
  if(!v.seen.includes(t.poi)||v.z!==t.z||!['surveyed',undefined].includes(s.jobs[t.id]?.stage)||Math.hypot(t.x-v.x,t.y-v.y)>40||v.inside!==t.poi)continue;
  add(t.id,{...t,inside:t.poi},t.family,.8,c=>{if(Math.hypot(t.x-v.x,t.y-v.y)<4){c.fillStyle='#e8dab5';c.font='.35px sans-serif';c.textAlign='center';c.fillText('Matériel technique',t.x,t.y-.65);}});
 }
 for(const[id,j]of Object.entries(s.jobs))if(j.stage==='ground'&&j.point.domain===domain)add(id,j.point,C.Essentials.content.byId[id].family,1);
 for(const e of s.effects)if(e.domain===domain)add('effect:'+e.id,e,e.kind,domain==='local'?.75:.9,undefined,true);
 return entries;
}
function region(c,g,v){for(const entry of depthEntries(g,'region',v))entry.draw(c);}
function carried(c,g,x,y,scale){const s=g.essentials?.snapshot(),id=s&&Object.keys(s.jobs).find(k=>s.jobs[k].stage==='player');if(id)symbol(c,x-.36*scale,y+.15*scale,C.Essentials.content.byId[id].family,.6*scale,g,id);}
function local(c,g,options={}){const s=g.essentials?.snapshot();if(!s)return;for(const entry of depthEntries(g,'local',null,null,s))entry.draw(c);if(options.carried!==false&&!g.player.dead&&!g.expeditions.driving())carried(c,g,g.player.x,g.player.y,32);}
root.DeadwallEssentialArt={region,local,carried,symbol,depthEntries};})(globalThis);
