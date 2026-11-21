'use strict';
const fs=require('node:fs');
const {boot127}=require('./expansions127.cjs');
function fixture({ui=false,seed='17117'}={}){
 const env=boot127(),g=env.game,doc=document,proto=Object.getPrototypeOf(doc.body);
 Object.defineProperty(proto,'className',{configurable:true,set(value){this.classList.values=new Set(String(value).split(/\s+/).filter(Boolean));},get(){return[...this.classList.values].join(' ');}});
 proto.before=function(n){this.parentNode?.insertBefore(n,this);};proto.after=function(n){const parent=this.parentNode;if(!parent)return;const i=parent.children.indexOf(this);parent.children.splice(i+1,0,n);n.parentNode=parent;};proto.scrollIntoView=function(){};
 doc.createTextNode=s=>{const n=doc.createElement('span');n.textContent=s;return n;};
 const label=doc.createElement('div');label.className='minimap-label';doc.getElementById('minimapWrap').append(label);g.ui.hud.append(doc.getElementById('minimapWrap'));
 const fallbackGet=doc.getElementById.bind(doc);doc.getElementById=id=>doc.body.querySelectorAll('#'+id)[0]||fallbackGet(id);
 for(const name of ['coordination','region-roadkit','atlas-render','frontier-art','recon-art','atlas-view']){delete require.cache[require.resolve('../../src/'+name+'.js')];require('../../src/'+name+'.js');}
 g.startNew('standard',seed);
 if(ui){
  const html=fs.readFileSync(require.resolve('../../index.html'),'utf8').split('<div id="commandModal"')[1].split('<div id="settingsModal"')[0],content=html.slice(html.indexOf('>')+1).replace(/<\/div>\s*$/,'');
  const stack=[g.ui.commandModal];
  for(const token of content.match(/<[^>]+>|[^<]+/g)){
   if(token.startsWith('</')){stack.pop();continue;}
   if(token.startsWith('<')){const m=/^<(\w+)/.exec(token);if(!m)continue;const n=doc.createElement(m[1]);for(const a of token.matchAll(/([\w-]+)="([^"]*)"/g)){if(a[1]==='id'){n.id=a[2];env.elements.set(n.id,n);}else if(a[1]==='class')n.className=a[2];else n.setAttribute(a[1],a[2]);}stack.at(-1).appendChild(n);if(!['input','br','img','hr'].includes(m[1]))stack.push(n);}else if(token.trim())stack.at(-1).textContent+=token.trim();
  }
  doc.readyState='complete';for(const name of ['command-ui','recon-ui','frontier-ui','world-evolution-ui']){delete require.cache[require.resolve('../../src/'+name+'.js')];require('../../src/'+name+'.js');}
 }
 return{...env,g,doc,label};
}
function pose(g,point,extra={}){const d=g.serialize();d.frontier={...d.frontier,active:true,anchor:{x:g.player.x,y:g.player.y},x:point.x,y:point.y,z:0,inside:null,...extra};g.restoreSave(d);return g.frontier.overview();}
function trace(){const calls=[];return new Proxy({calls,measureText:t=>({width:String(t).length*7}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get(t,k){if(k in t)return t[k];return(...a)=>calls.push([k,...a]);},set(t,k,v){calls.push(['set',k,v]);t[k]=v;return true;}});}
module.exports={fixture,pose,trace};
