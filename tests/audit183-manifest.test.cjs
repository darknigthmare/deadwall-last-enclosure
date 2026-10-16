'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const M=require('../scripts/public-manifest183.cjs'),root=path.join(__dirname,'..');
function fixture(t,body){const p=fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-manifest-'));t.after(()=>fs.rmSync(p,{recursive:true,force:true}));fs.writeFileSync(path.join(p,'index.html'),body);return p;}
const style='<link rel="stylesheet" href="styles.css">';
test('183 public manifest preserves actual entry order and bundled modules execute once',()=>{
 const {scripts,styles}=M.readPublicEntries(root);assert.equal(scripts.length,164);assert.equal(styles.length,24);
 assert.equal(new Set([...scripts,...styles]).size,188);assert.equal(M.BUNDLED_MODULES.length,32);
 assert.ok(M.BUNDLED_MODULES.includes('src/hydrology165.js'));assert.ok(M.BUNDLED_MODULES.includes('src/biomes164.js'));
 assert.ok(scripts.indexOf('src/codex3000-live-data.js')<scripts.indexOf('src/core.js'));assert.equal(M.verifyBundle(root),true);
});
for(const value of ['https://evil.invalid/game.js','src/../secret.js','src/core.js?q=1','/src/core.js','scripts/secret.js'])test('183 invalid public path rejected: '+value,t=>{
 const p=fixture(t,style+'<script src="'+value+'"></script>');assert.throws(()=>M.readPublicEntries(p),/Invalid public/);
});
test('183 duplicated or double-bundled scripts fail before packaging',t=>{
 const p=fixture(t,style+'<script src="src/core.js"></script><script src="src/core.js"></script>');assert.throws(()=>M.readPublicEntries(p),/Duplicate public/);
 fs.writeFileSync(path.join(p,'index.html'),style+'<script src="src/hydrology165.js"></script>');assert.throws(()=>M.readPublicEntries(p),/execute twice/);
});
test('183 comment examples do not add public permissions and attribute order is irrelevant',t=>{
 const p=fixture(t,"<!-- <script src='src/sample.js'></script> -->"+"<link href='styles.css' rel='stylesheet'><script defer src='src/core.js'></script>");
 assert.deepEqual(M.readPublicEntries(p).scripts,['src/core.js']);assert.deepEqual(M.readPublicEntries(p).styles,['styles.css']);
});
test('183 a stale embedded source is rejected rather than silently packaged',t=>{
 const p=fixture(t,style+'<script src="src/core.js"></script>');fs.mkdirSync(path.join(p,'src'));
 for(const file of M.BUNDLED_MODULES)fs.writeFileSync(path.join(p,file),'/* '+file+' */');
 fs.writeFileSync(path.join(p,'src/codex3000-live-data.js'),M.bundledPrefix(p)+'/* Generated from original Codex 3000. */');assert.equal(M.verifyBundle(p),true);
 fs.appendFileSync(path.join(p,M.BUNDLED_MODULES[0]),' changed');assert.throws(()=>M.verifyBundle(p),/absent, stale or reordered/);
});

for(const quote of ['"',"'"])test('186 quoted angle brackets and multiline notes never hide a later public path: '+quote,t=>{
 const note=quote+'a > b\n and c < d'+quote;
 const p=fixture(t,style+'<script src="src/core.js"></script><script data-note='+note+' src='+quote+'src/new.js'+quote+'></script><link data-note='+note+' rel="stylesheet" href="extra.css">');
 assert.deepEqual(M.readPublicEntries(p),{scripts:['src/core.js','src/new.js'],styles:['styles.css','extra.css']});
});
test('186 raw text and quoted attribute examples cannot invent public entries',t=>{
 const p=fixture(t,style+`<div data-note="<script src='src/fake.js'>"></div><script>const example='<link rel="stylesheet" href="fake.css">';</script><textarea><script src="src/fake2.js"></script></textarea><script src="src/core.js"></script>`);
 assert.deepEqual(M.readPublicEntries(p),{scripts:['src/core.js'],styles:['styles.css']});
});
test('186 an unquoted src is rejected even after a quoted greater-than note',t=>{
 const p=fixture(t,style+'<script src="src/core.js"></script><script data-note="a > b" src=src/new.js></script>');
 assert.throws(()=>M.readPublicEntries(p),/must be quoted/);
});
