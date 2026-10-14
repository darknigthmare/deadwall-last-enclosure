const test=require('node:test');
const assert=require('node:assert/strict');

test('180 offline shell retains the real network dependency and no invented routing script',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert.match(sw,/deadwall-v1\.60\.0-g10-vertical-routing180/);
 const assets=JSON.parse(sw.match(/const ASSETS = (\[[^;]+\]);/)[1]);
 assert.ok(assets.includes('src/vertical-network179.js'));assert.ok(!assets.includes('src/vertical-routing180.js'));
 for(const name of assets.filter(p=>p.startsWith('src/vertical')))assert.ok(fs.existsSync(path.join(root,name)),name);
});
