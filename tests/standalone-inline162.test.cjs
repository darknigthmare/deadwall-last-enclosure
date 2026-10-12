'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createImageInliner,inlineDocument}=require('../scripts/standalone-inline162.cjs');
const root=path.join(__dirname,'..');
test('162: actual document and source references produce the same bytes as the legacy include algorithm',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]),scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
 const sources=new Map([...styles,...scripts].map(name=>[name,fs.readFileSync(path.join(root,name),'utf8')]));
 const images=[...new Set([...sources.values()].flatMap(text=>[...text.matchAll(/assets\/[A-Za-z0-9_./-]+\.(?:png|webp|svg)/g)].map(m=>m[0])))];
 const urls=Object.fromEntries(images.map((name,index)=>[name,'data:image/png;base64,'+Buffer.from('fixture '+index).toString('base64')]));
 const legacy=text=>{for(const [name,url]of Object.entries(urls))text=text.replaceAll(name,url);return text;};
 let expected=html;
 for(const name of styles)expected=expected.replace('<link rel="stylesheet" href="'+name+'">',()=>'<style>\n'+legacy(sources.get(name))+'\n</style>');
 for(const name of scripts)expected=expected.replace('<script src="'+name+'"></script>',()=>'<script>\n'+legacy(sources.get(name))+'\n</script>');
 const inlineImages=createImageInliner(urls);
 for(const text of sources.values())assert.equal(inlineImages(text),legacy(text));
 assert.equal(inlineDocument(html,{styles,scripts,read:name=>sources.get(name),inlineImages}),expected);
 console.log('INLINE162 '+JSON.stringify({styles:styles.length,scripts:scripts.length,assetReferences:images.length}));
});
test('162: include order is retained and unknown dependencies remain visible to final validation',()=>{
 const html='<script src="b.js"></script>\n<link rel="stylesheet" href="a.css">\n<script src="unknown.js"></script>';
 const reads=[],result=inlineDocument(html,{styles:['a.css'],scripts:['b.js'],read:name=>{reads.push(name);return '$& '+name;},inlineImages:createImageInliner({})});
 assert.deepEqual(reads,['b.js','a.css']);assert.equal(result,'<script>\n$& b.js\n</script>\n<style>\n$& a.css\n</style>\n<script src="unknown.js"></script>');
});
test('162: embedded replacements are literal, regexp-safe and are not recursively replaced',()=>{
 const embed=createImageInliner({'a[1].png':'$& b.png','b.png':'SECOND'});
 assert.equal(embed('a[1].png b.png aX1Zpng'),'$& b.png SECOND aX1Zpng');
 assert.throws(()=>embed(null),TypeError);assert.throws(()=>createImageInliner({'': 'bad'}),TypeError);
});
test('162: unreadable includes fail instead of producing a partial successful build',()=>{
 assert.throws(()=>inlineDocument('<script src="x.js"></script>',{scripts:['x.js'],styles:[],inlineImages:createImageInliner({}),read:()=>{throw Error('missing source');}}),/missing source/);
});
