'use strict';
// Integration smoke with the real HTML script order and a simulated DOM; no CSS/browser claim.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const env=require('../tests/helpers/browser.cjs').installFakeBrowser({readyState:'loading',currentScript:{tagName:'SCRIPT'}});
const doc=globalThis.document,proto=Object.getPrototypeOf(doc.body);
Object.defineProperty(proto,'className',{configurable:true,set(v){this.classList.values=new Set(String(v).split(/\s+/).filter(Boolean));},get(){return [...this.classList.values].join(' ');}});
proto.insertBefore=function(n,s){n.remove();const i=this.children.indexOf(s);this.children.splice(i<0?this.children.length:i,0,n);n.parentNode=this;};
proto.before=function(n){this.parentNode?.insertBefore(n,this);};
proto.replaceWith=function(n){if(this.parentNode){this.parentNode.insertBefore(n,this);this.remove();}};
proto.after=function(n){const p=this.parentNode;if(p){const i=p.children.indexOf(this);p.children.splice(i+1,0,n);n.parentNode=p;}};
proto.scrollIntoView=function(){};proto.setCustomValidity=function(s){this.validationMessage=s;};
const append=proto.appendChild;proto.appendChild=function(n){if(n?.parentNode)n.remove();return append.call(this,n);};
doc.createElementNS=(_,tag)=>doc.createElement(tag);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const body=html.split(/<body[^>]*>/)[1].split('<script')[0],stack=[doc.body];doc.body.replaceChildren();
for(const token of body.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)){
 if(token.startsWith('<!--'))continue;
 if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}
 if(!token.startsWith('<')){if(token.trim())stack.at(-1).textContent+=token.trim();continue;}
 const tag=/^<(\w+)/.exec(token)?.[1];if(!tag)continue;
 const id=/\bid="([^"]+)"/.exec(token)?.[1],n=id?doc.getElementById(id):doc.createElement(tag);n.tagName=tag.toUpperCase();
 for(const a of token.matchAll(/([\w-]+)="([^"]*)"/g)){if(a[1]==='class')n.className=a[2];else if(['value','type','name'].includes(a[1]))n[a[1]]=a[2];else if(a[1].startsWith('data-'))n.dataset[a[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=a[2];else n.setAttribute(a[1],a[2]);}
 n.checked=/\schecked(?:\s|>)/.test(token);stack.at(-1).appendChild(n);if(!['input','img','br','hr','meta','link','source'].includes(tag))stack.push(n);
}
const fallback=doc.getElementById.bind(doc);doc.getElementById=id=>doc.body.querySelectorAll('#'+id)[0]||fallback(id);
globalThis.Image=class{constructor(){this.width=this.height=0;}set src(v){this._src=v;}get src(){return this._src;}};
for(const [,file]of html.matchAll(/<script src="([^"]+)"/g))new Function('module','require','exports',fs.readFileSync(path.join(root,file),'utf8')+'\n//# sourceURL='+file)(undefined,undefined,undefined);
doc.readyState='interactive';doc.currentScript=null;env.dispatchDocument('DOMContentLoaded');
const g=globalThis.DEADWALL;
g.startNew('standard','17117');
console.log(JSON.stringify({stage:'intro',state:g.state,intro:g.campaignIntro132.isOpen(),revision:g.exploration125.layoutRevision,modules:['succession133','successionUI133','heroActions133'].map(k=>[k,!!g[k]])}));
g.campaignIntro132.skip();g.player.invulnerable=0;g.player.carry.scrap=7;g.damagePlayer(10000);
console.log(JSON.stringify({stage:'death',pending:g.succession133.pending(),overlay:g.activeOverlay?.id,stored:globalThis.DeadwallSave.validate(g.serialize()).succession133.remains.length}));
const confirm=doc.getElementById('succession133Confirm');confirm.click();
console.log(JSON.stringify({stage:'successor',dead:g.player.dead,pending:g.succession133.pending(),paused:g.paused,overlay:g.activeOverlay?.id,profile:g.succession133.view().current.profile,save:g.save(false)}));
g.returnToMenu();g.load();
console.log(JSON.stringify({stage:'reload',dead:g.player.dead,pending:g.succession133.pending(),profile:g.succession133.view().current.profile,save:g.save(false)}));
