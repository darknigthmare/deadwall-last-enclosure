'use strict';
// Read-only replay: compare newly rendered buffers with the archived canonical bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'../deadwall-art236');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const selection=JSON.parse(fs.readFileSync(path.join(__dirname,'selection-and-prompts.json')));
for(const s of selection.sourceFiles)assert.equal(sha(fs.readFileSync(path.join(repo,s.repositoryPath))),s.sha256,'Source changed: '+s.repositoryPath);
const {createCanvas}=require(path.join(repo,'node_modules/@napi-rs/canvas'));
const Art=require(path.join(repo,'src/campaign-site-art205.js'));
const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'canonical-render-receipt.json')));
const results=[];
for(const r of [...receipt.targets,...receipt.v0Replays]){
 const fixture=structuredClone(r.fixture),before=JSON.stringify(fixture),canvas=createCanvas(r.canvas.width,r.canvas.height),c=canvas.getContext('2d');
 c.translate(r.canvas.origin.x,r.canvas.origin.y);c.scale(r.canvas.pixelsPerMetre,r.canvas.pixelsPerMetre);
 assert.equal(Art.drawProp(c,null,fixture,r.options),true);assert.equal(JSON.stringify(fixture),before);
 const png=canvas.toBuffer('image/png'),original=fs.readFileSync(path.join(__dirname,r.file));
 assert.equal(sha(png),r.sha256);assert.equal(png.equals(original),true);
 results.push({key:r.key,sha256:sha(png),byteIdentical:true,fixtureUnchanged:true});
}
console.log(JSON.stringify({scope:'Read-only canonical replay; no file or pixel edits',renderer:'exported campaign-site-art205.drawProp',canvasVersion:require(path.join(repo,'node_modules/@napi-rs/canvas/package.json')).version,results},null,2));
