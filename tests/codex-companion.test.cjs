'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../codex-3000'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('compagnon : 1000 originaux et 2000 compositions liées, distinctes et accessibles',()=>{
 const index=read('INDEX_3000.json'),children=read('CATALOGUE_1001_3000.json').fiches,modules=new Set(read('source/MODULES.json').map(x=>x.id)),states=new Set(read('source/ETATS.json').map(x=>x.id)),parents=new Map();
 assert.equal(index.entries.length,3000);assert.equal(new Set(index.entries.map(x=>x.id)).size,3000);assert.equal(children.length,2000);
 for(const e of index.entries)assert.equal(fs.existsSync(path.join(root,e.path)),true,e.id);
 for(const e of children){assert.ok(modules.has(e.module));assert.ok(states.has(e.state));assert.equal(e.status,'conception_non_integree');if(!parents.has(e.parent))parents.set(e.parent,[]);parents.get(e.parent).push(e);}
 assert.equal(parents.size,1000);for(const pair of parents.values()){assert.equal(pair.length,2);assert.notEqual(pair[0].module,pair[1].module);assert.notEqual(pair[0].state,pair[1].state);}
});
test('compagnon : conservation de chaque fichier historique par empreinte',()=>{
 const manifest=read('ORIGINAUX_SHA256.json');assert.equal(Object.keys(manifest).length,1051);
 for(const[p,hash]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),hash,p);
});
test('lecteur autonome : recherche, pagination, détail hérité, fermeture et filtre pilote',()=>{
 const {installFakeBrowser}=require('./helpers/browser.cjs');installFakeBrowser();
 const proto=Object.getPrototypeOf(document.createElement('div'));proto.append=function(...nodes){for(const n of nodes)this.appendChild(n);};proto.showModal=function(){this.open=true;};proto.close=function(){this.open=false;this.dispatch('close');};
 const html=fs.readFileSync(path.join(root,'LIRE_CODEX_3000.html'),'utf8'),data=html.split('<script id="codex-data" type="application/json">')[1].split('</script>')[0],script=html.split('</script><script>')[1].split('</script>')[0];
 document.getElementById('codex-data').textContent=data;const context=vm.createContext({document});vm.runInContext(script,context);
 const results=document.getElementById('results'),search=document.getElementById('search'),kind=document.getElementById('kind'),modal=document.getElementById('modal');
 assert.equal(results.children.length,24);assert.equal(document.getElementById('count').textContent,'3000 fiches sur 3 000');
 document.getElementById('next').dispatch('click');assert.equal(document.getElementById('page').textContent,'Page 2 / 125');
 search.value='DW-1001';search.dispatch('input');assert.equal(results.children.length,1);
 const button=results.querySelectorAll('button')[0];button.dispatch('click');assert.equal(modal.open,true);assert.match(document.getElementById('title').textContent,/DW-1001/);
 const text=document.getElementById('detail').querySelectorAll('h3').map(n=>n.textContent).join(' ');assert.match(text,/Programme complet du parent DW-0001/);
 document.getElementById('close').dispatch('click');assert.equal(modal.open,false);
 search.value='';kind.value='pilote';kind.dispatch('change');assert.equal(document.getElementById('count').textContent,'62 fiches sur 3 000');
 search.value='aucunmotnecorrespond';search.dispatch('input');assert.equal(results.querySelectorAll('article').length,0);
});
