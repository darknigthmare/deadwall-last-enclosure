'use strict';
// A deliberately limited static cascade evaluator, not a layout engine. It reads
// the shipped HUD sheet, resolves its selectors/media/specificity/custom property,
// and compares the declared panel width with the column allocated to that panel.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const current=fs.readFileSync(path.join(__dirname,'../hud135.css'),'utf8');
const baseline=fs.readFileSync(path.join(__dirname,'fixtures/hud135-v136.css'),'utf8');
function splitOutside(source,separator){let level=0,start=0,out=[];for(let i=0;i<source.length;i++){if('(['.includes(source[i]))level++;else if(')]'.includes(source[i]))level--;else if(!level&&separator.test(source[i])){if(i>start)out.push(source.slice(start,i).trim());start=i+1;}}if(start<source.length)out.push(source.slice(start).trim());return out;}
function parse(source,media=[]){const out=[];source=source.replace(/\/\*[\s\S]*?\*\//g,'');for(let start=0;start<source.length;){const open=source.indexOf('{',start);if(open<0)break;let end=open+1,level=1;for(;end<source.length&&level;end++)if(source[end]==='{')level++;else if(source[end]==='}')level--;assert.equal(level,0,'Balanced stylesheet blocks');const prelude=source.slice(start,open).trim(),body=source.slice(open+1,end-1);start=end;if(prelude.startsWith('@media'))out.push(...parse(body,[...media,prelude.slice(6)]));else if(!prelude.startsWith('@'))for(const selector of splitOutside(prelude,/,/))out.push({selector,media,declarations:splitOutside(body,/;/).map(s=>{const i=s.indexOf(':');return[s.slice(0,i).trim(),s.slice(i+1).trim()];})});}return out;}
function active(condition,screen){return splitOutside(condition,/,/).some(part=>part.trim().split(/\s+and\s+/).every(term=>{const m=/^\(\s*([\w-]+)\s*:\s*([^)]*)\)$/.exec(term.trim());assert.ok(m,'Supported HUD media expression: '+term);const [,key,value]=m;if(key==='pointer')return value===screen.pointer;if(key==='prefers-reduced-motion')return value==='no-preference';const size=/^(min|max)-(width|height)$/.exec(key);assert.ok(size,'Supported media feature: '+key);assert.match(value,/^\d+px$/);return size[1]==='min'?screen[size[2]]>=parseFloat(value):screen[size[2]]<=parseFloat(value);}));}
function node(tag,classes=[],attributes={},children=[]){const n={tag,classes,attributes,children,parent:null};for(const c of children)c.parent=n;return n;}
function scene({build=false,region=false,open=false}){const details=node('details',['hud135-drawer'],open?{open:''}:{}),right=node('div',['hud135-right'],{},[details]),main=node('div',['hud135-main'],{},[node('div',['hud135-left']),node('div',['hud135-center']),right]);node('div',['hud135'],{id:'hud','data-build':String(build),'data-region':String(region)},[main]);return{main,right};}
const descendants=n=>n.children.flatMap(c=>[c,...descendants(c)]);
function hasArgument(source){const at=source.indexOf(':has(');if(at<0)return null;let end=at+5,level=1;for(;end<source.length&&level;end++){if(source[end]==='(')level++;if(source[end]===')')level--;}assert.equal(level,0);return{at,end,value:source.slice(at+5,end-1)};}
function compound(n,source){const has=hasArgument(source);if(has){if(!descendants(n).some(child=>matches(child,has.value)))return false;source=source.slice(0,has.at)+source.slice(has.end);}const tokens=source.match(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|^[\w-]+|\*/g)||[];assert.equal(tokens.join(''),source,'Supported HUD selector: '+source);return tokens.every(t=>{if(t[0]==='#')return n.attributes.id===t.slice(1);if(t[0]==='.')return n.classes.includes(t.slice(1));if(t[0]==='['){const a=/^\[([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]$/.exec(t);assert.ok(a);return Object.hasOwn(n.attributes,a[1])&&(a[2]??a[3]??a[4])===undefined||Object.hasOwn(n.attributes,a[1])&&n.attributes[a[1]]===(a[2]??a[3]??a[4]);}return t==='*'||n.tag===t;});}
function matches(n,selector){const parts=splitOutside(selector,/\s/);let i=parts.length-1;if(!compound(n,parts[i]))return false;while(--i>=0){assert.notEqual(parts[i],'>','Only descendant selectors are used by the audited column rules');n=n.parent;while(n&&!compound(n,parts[i]))n=n.parent;if(!n)return false;}return true;}
function specificity(source){let sum=[0,0,0],has=hasArgument(source);if(has){sum=specificity(has.value);source=source.slice(0,has.at)+source.slice(has.end);}for(const token of source.match(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|[\w-]+/g)||[])sum[token[0]==='#'?0:'.['.includes(token[0])?1:2]++;return sum;}
function compare(a,b){for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;}
function declarations(sheet,target,screen){const values=new Map();sheet.forEach((rule,index)=>{
 // These classes are unique to this final HUD stylesheet. Ignore unrelated
 // controls rather than claim support for arbitrary browser selector grammar.
 const last=splitOutside(rule.selector,/\s/).at(-1);if(!/^\.hud135-(?:main|right)(?=:|$)/.test(last))return;
 if(!rule.media.every(m=>active(m,screen))||!matches(target,rule.selector))return;
 for(const[property,raw]of rule.declarations){const priority=[Number(/!important\s*$/.test(raw)),...specificity(rule.selector),index],old=values.get(property);if(!old||compare(priority,old.priority)>=0)values.set(property,{value:raw.replace(/\s*!important\s*$/,''),priority,selector:rule.selector});}
 });return values;}
function resolve(value,style){return value.replace(/var\((--[\w-]+)\)/g,(_,key)=>{assert.ok(style.has(key),'Defined custom property '+key);return resolve(style.get(key).value,style);});}
function dimensions(sheet,config){const screen={width:1000,height:800,pointer:'fine',...config},tree=scene(config),main=declarations(sheet,tree.main,screen),right=declarations(sheet,tree.right,screen),columns=splitOutside(resolve(main.get('grid-template-columns').value,main),/\s/);assert.equal(columns.length,3,'Three columns expected in the audited desktop state');const allocated=Number.parseFloat(columns[2]);assert.match(columns[2],/^\d+px$/);const declared=right.get('width')?.value||'auto',panel=declared==='auto'?allocated:declared==='100%'?allocated:Number.parseFloat(declared);assert.ok(Number.isFinite(panel),'Resolved panel width');return{left:parseFloat(columns[0]),allocated,panel,overflow:Math.max(0,panel-allocated),columnSelector:main.get('grid-template-columns').selector};}
const sheet=parse(current),old=parse(baseline);

test('HUD CSS 1.37 : le calcul statique reproduit les 84 px de débordement de la feuille 1.36',()=>{
 assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'),'eb9fba4e52ff30fea903f4b5ff319d7c09b1401f273e2ee5784d5851c64197d9','The historical stylesheet is an unmodified regression fixture');
 for(const state of [{build:true},{region:true}]){const actual=dimensions(old,{...state,open:true,width:1000});assert.equal(actual.allocated,146);assert.equal(actual.panel,230);assert.equal(actual.overflow,84);}
 assert.equal(dimensions(old,{open:true,width:1000}).overflow,0,'The old failure depends on the higher-specificity campaign state');
});

test('HUD CSS 1.37 : Situation/Carte tiennent dans leur colonne entre 721 et 1 440 px',()=>{
 for(const width of [721,900,1000,1100,1101,1440])for(const state of [{},{build:true},{region:true},{build:true,region:true}])for(const open of [false,true]){
  const actual=dimensions(sheet,{width,...state,open}),label=JSON.stringify({width,...state,open});
  assert.equal(actual.overflow,0,label);assert.equal(actual.panel,actual.allocated,label);
  assert.equal(actual.allocated,width>1100?218:open?230:146,label);
  assert.equal(actual.left,state.region?0:state.build?(width<=1100?230:260):44,label);
 }
});

test('HUD CSS 1.37 : le paysage court conserve une colonne complète pour un tiroir ouvert',()=>{
 for(const width of [721,1000,1100,1440])for(const state of [{},{build:true},{region:true}])for(const open of [false,true]){
  const actual=dimensions(sheet,{width,height:500,...state,open});assert.equal(actual.overflow,0);
  assert.equal(actual.allocated,width<=1100&&open?230:130);
 }
});
