'use strict';
// Apply only the exact reviewed integration edits; preflight every byte before writing.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const recipe=JSON.parse(fs.readFileSync(path.join(__dirname,'vertical175-integration.json'),'utf8'));
const allowed=['desktop/policy.cjs','index.html','scripts/build.mjs','scripts/server.mjs','src/core.js','src/expansion-kit.js','src/expansion-ui.js','src/fieldcraft.js','src/game.js','sw.js'];
const sources=['src/vertical-citadel175-state.js','src/vertical-citadel175.js','src/vertical-citadel175-render.js','src/vertical-citadel175-ui.js','vertical-citadel175.css','tests/vertical-citadel175.test.cjs'];
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function read(name){const full=path.join(root,name);if(fs.realpathSync(full)!==full||!fs.statSync(full).isFile())throw Error('Not a regular in-root file: '+name);return fs.readFileSync(full);}
if(recipe.version!==1||recipe.offsetUnit!=='utf8-bytes'||recipe.baseMain!=='5b8f0ade7f7e93d3fc3ea23f762cac93ded43d90')throw Error('Unexpected integration recipe');
if(JSON.stringify(recipe.files.map(f=>f.path))!==JSON.stringify(allowed)||JSON.stringify(Object.keys(recipe.requiredSources))!==JSON.stringify(sources))throw Error('Unexpected integration paths');
for(const name of sources)if(digest(read(name))!==recipe.requiredSources[name])throw Error('Reviewed source mismatch: '+name);
const prepared=[];
for(const item of recipe.files){
 const input=read(item.path),hash=digest(input);
 if(hash===item.after){prepared.push({path:item.path,before:hash,after:hash,changed:false});continue;}
 if(hash!==item.before)throw Error('Refusing unreviewed baseline: '+item.path);
 let end=0;
 for(const [a,b,text]of item.edits){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<end||b<a||b>input.length||typeof text!=='string')throw Error('Invalid edit: '+item.path);end=b;}
 let output=input;
 for(const [a,b,text]of [...item.edits].reverse())output=Buffer.concat([output.subarray(0,a),Buffer.from(text,'utf8'),output.subarray(b)]);
 if(digest(output)!==item.after)throw Error('Reviewed output mismatch: '+item.path);
 prepared.push({path:item.path,before:hash,after:item.after,changed:true,output});
}
for(const item of prepared)if(item.changed)fs.writeFileSync(path.join(root,item.path),item.output);
console.log(JSON.stringify({baseMain:recipe.baseMain,files:prepared.map(({output,...entry})=>entry),requiredSources:recipe.requiredSources},null,2));
