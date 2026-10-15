'use strict';
// Build-time only. Replace original references once; never rescan a growing
// document or reinterpret $-sequences in replacement payloads as templates.
function createImageInliner(urls){
 const entries=Object.entries(urls);
 if(entries.some(([name,value])=>!name||typeof value!=='string'))throw new TypeError('Invalid embedded asset');
 const names=entries.map(([name])=>name);
 // Paths may contain regexp metacharacters. Longest-first prevents a shorter
 // filename from consuming the prefix of a distinct source reference.
 const pattern=names.length?new RegExp(names.sort((a,b)=>b.length-a.length).map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g'):null;
 return text=>{
  if(typeof text!=='string')throw new TypeError('Source must be UTF-8 text');
  return pattern?text.replace(pattern,name=>urls[name]):text;
 };
}
function inlineDocument(html,{styles,scripts,read,inlineImages}){
 if(typeof html!=='string'||typeof read!=='function'||typeof inlineImages!=='function')throw new TypeError('Invalid standalone input');
 const styleNames=new Set(styles),scriptNames=new Set(scripts);
 return html.replace(/<link rel="stylesheet" href="([^"]+)">|<script src="([^"]+)"><\/script>/g,(tag,style,script)=>{
  const name=style||script;
  if(!(style?styleNames:scriptNames).has(name))return tag;
  const wrapper=style?'style':'script';
  return '<'+wrapper+'>\n'+inlineImages(read(name))+'\n</'+wrapper+'>';
 });
}
module.exports={createImageInliner,inlineDocument};
