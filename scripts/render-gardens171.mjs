// In-memory rendering only: actual project atlases and recipe painter, no campaign.
import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';import {chromium} from 'playwright';
const require=createRequire(import.meta.url),output=path.resolve('artifacts/qa/gardens171-render');await fs.mkdir(output,{recursive:true});
const html=await fs.readFile('index.html','utf8'),prefix=[...html.matchAll(/<script src="src\/([^"]+)\.js"/g)].map(m=>m[1]);
const core=prefix.indexOf('core');if(core<0)throw Error('Canonical dependency order unavailable');
const modules=[...prefix.slice(0,core+1),'world-props-art153','nature-art153','interior-art153','frontier-art'];
const specs=Object.assign({},...['world-props-art153','interior-art153','nature-art153'].map(n=>require('../src/'+n+'.js').ASSETS));
const payload=await Promise.all(Object.entries(specs).map(async([key,s])=>[key,'data:image/'+(s.url.endsWith('.svg')?'svg+xml':'png')+';base64,'+(await fs.readFile(s.url)).toString('base64')]));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
const report={scope:'Isolated in-memory recipe rendering with decoded project atlases, not a live campaign or mobile input check.',browser:browser.version(),examples:[],errors:[]};
try{const page=await browser.newPage({viewport:{width:1000,height:820}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.setContent('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#16251b;color:#e1d8b9;font:16px sans-serif}canvas{display:block}h1{font-size:18px}</style><h1 id="title"></h1><canvas id="view" width="900" height="720"></canvas>');
 for(const name of modules)await page.addScriptTag({content:await fs.readFile('src/'+name+'.js','utf8')});
 report.atlases=await page.evaluate(async data=>{const images={};for(const[key,url]of data){const i=new Image();i.src=url;await i.decode();images[key]=i;}globalThis.DEADWALL={world:{seed:17117},art:{images,blit(c,key,source,...destination){if(!images[key])return false;c.drawImage(images[key],...source,...destination);return true;}}};return Object.keys(images).length;},payload);
 for(const id of ['DW-0001','DW-0365','DW-1237']){
  const example={id,seed:17117};
  for(const revision of [8,9]){const detail=await page.evaluate(({id,revision})=>{const p=DeadwallCodexPlan165.inspect(id,17117,0,revision),before=JSON.stringify(p),c=document.getElementById('view');DeadwallCodexPlan165.render(c,p);document.getElementById('title').textContent=id+' — recette isolée, révision '+revision;return{unchanged:before===JSON.stringify(p),png:c.toDataURL(),groups:p.details.gardens171?.groups||[],added:p.details.gardens171?.added||0};},{id,revision});if(!detail.unchanged)throw Error('Renderer mutated recipe');
   await fs.writeFile(path.join(output,id+'-r'+revision+'.png'),Buffer.from(detail.png.split(',')[1],'base64'));delete detail.png;example['revision'+revision]=detail;
  }report.examples.push(example);
 }
 report.pass=report.examples.length===3&&report.examples.every(e=>e.revision9.added>0)&&report.errors.length===0;
}finally{await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));}
if(!report.pass)process.exitCode=1;console.log(JSON.stringify(report));
