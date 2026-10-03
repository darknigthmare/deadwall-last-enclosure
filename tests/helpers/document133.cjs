'use strict';
// Executes the shipped classic scripts in index order with a simulated document.
// This checks registration/lifecycle; it is not a layout engine or browser QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {installFakeBrowser}=require('./browser.cjs');
function bootDocument133(){
 const env=installFakeBrowser({readyState:'loading',currentScript:{tagName:'SCRIPT'}}),proto=Object.getPrototypeOf(document.body),root=path.resolve(__dirname,'../..');
 proto.insertBefore=function(n,s){const i=this.children.indexOf(s);this.children.splice(i<0?this.children.length:i,0,n);n.parentNode=this;};
 proto.before=function(n){this.parentNode?.insertBefore(n,this);};
 proto.after=function(n){const p=this.parentNode;if(!p)return;p.children.splice(p.children.indexOf(this)+1,0,n);n.parentNode=p;};
 proto.replaceWith=function(n){const p=this.parentNode;if(!p)return;const i=p.children.indexOf(this);p.children.splice(i,1,n);n.parentNode=p;this.parentNode=null;};
 proto.scrollIntoView=function(){};
 Object.defineProperty(proto,'className',{configurable:true,set(v){this.classList.values=new Set(String(v).split(/\s+/).filter(Boolean));},get(){return[...this.classList.values].join(' ');}});
 globalThis.DEADWALL=undefined;globalThis.Image=class{set src(_){this.onerror?.();}};globalThis.ResizeObserver=class{observe(){}disconnect(){}};
 const files=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
 for(const file of files)vm.runInThisContext('(function(module, require){'+fs.readFileSync(path.join(root,file),'utf8')+'\n})(undefined, undefined);',{filename:file});
 return{...env,g:globalThis.DEADWALL,files,ready(){document.readyState='interactive';document.currentScript=null;env.dispatchDocument('DOMContentLoaded');}};
}
module.exports={bootDocument133};
