import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createGameServer} from '../scripts/server.mjs';

// HTTP-only integration gate: no browser, user profile or external service.
const root=fileURLToPath(new URL('..',import.meta.url)),dist=path.join(root,'dist');
const label=new Date().toISOString().replace(/[^a-zA-Z0-9_-]/g,'_'),output=path.join(process.env.DEADWALL_QA_OUTPUT_ROOT||path.join(root,'artifacts'),'http-qa',label);
const server=createGameServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port,results=[];
const hash=value=>createHash('sha256').update(value).digest('hex');
try{
  const entries=await fs.readdir(dist,{recursive:true,withFileTypes:true});
  for(const entry of entries.filter(item=>item.isFile())){
    const filename=path.join(entry.parentPath,entry.name),relative=path.relative(dist,filename).replaceAll('\\','/');
    const response=await fetch(base+'/'+relative),body=Buffer.from(await response.arrayBuffer()),expected=await fs.readFile(filename);
    assert.equal(response.status,200,relative);assert.equal(hash(body),hash(expected),relative+' stale or unexpected bytes');
    results.push({file:relative,status:200,bytes:body.length,sha256:hash(body)});
  }
  const sensitive=['/.git/config','/.env','/package.json','/package-lock.json','/AGENTS.md','/docs/ORIGINAL_BRIEF.txt','/desktop/main.cjs','/tests/narrative.test.cjs','/artifacts/save.json','/scripts/build.mjs','/assets/..%2F..%2Fpackage.json'];
  for(const file of sensitive){const response=await fetch(base+file);assert.equal(response.status,404,file);await response.arrayBuffer();results.push({file,status:404});}
  const post=await fetch(base+'/',{method:'POST'});assert.equal(post.status,405);results.push({file:'/',method:'POST',status:405});await post.arrayBuffer();
  const head=await fetch(base+'/src/narrative.js',{method:'HEAD'});assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);assert.equal(head.headers.get('x-content-type-options'),'nosniff');results.push({file:'/src/narrative.js',method:'HEAD',status:200});
  await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'report.json'),JSON.stringify({date:new Date().toISOString(),scope:'Loopback HTTP against current source, exact comparison with local build. Not production or browser validation.',pass:true,publicFiles:entries.filter(item=>item.isFile()).length,sensitivePaths:sensitive.length,results},null,2));
  console.log(JSON.stringify({pass:true,publicFiles:results.filter(item=>item.sha256).length,sensitivePaths:sensitive.length,checks:results.length,report:path.join(output,'report.json')}));
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
