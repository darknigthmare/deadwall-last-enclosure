const test=require('node:test');
const assert=require('node:assert/strict');

test('180 offline shell retains the real network dependency and no invented routing script',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const version=require('../package.json').version;
 assert.ok(sw.startsWith("const CACHE = 'deadwall-v"+version+"-"),'offline shell matches the current release');
 const assets=JSON.parse(sw.match(/const ASSETS = (\[[^;]+\]);/)[1]);
 assert.ok(assets.includes('src/vertical-network179.js'));assert.ok(!assets.includes('src/vertical-routing180.js'));
 for(const name of assets.filter(p=>p.startsWith('src/vertical')))assert.ok(fs.existsSync(path.join(root,name)),name);
});
