'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../src/core.js'),B=require('../src/biomes135.js'),Geo=require('../src/geography135.js');
const reader=path.join(__dirname,'../codex-3000/addendum-1.41'),data=JSON.parse(fs.readFileSync(path.join(reader,'BIOMES_1_41.json'),'utf8'));
test('141 : le compagnon décrit le contenu réellement généré et les ancres de quatre graines',()=>{
 assert.equal(data.generation,7);assert.equal(data.entries.length,115);assert.deepEqual(data.ecology,JSON.parse(JSON.stringify(C.EcologyRules141)));assert.equal(data.counts.habitats,9);
 for(const s of data.samples){assert.deepEqual(s.home,Geo.home(s.seed,7));assert.equal(s.communities.length,s.n*s.n);assert.equal(s.pixels.length,s.n*s.n);assert.equal(Object.keys(s.counts).length,9);for(const i of [0,613,4317,9215]){const x=(i%s.n+.5)*C.GeographyRules135.size/s.n,y=(Math.floor(i/s.n)+.5)*C.GeographyRules135.size/s.n,b=B.sample(s.seed,x,y,true,{generation:7});assert.equal(s.communities[i],b.habitat.id);assert.equal(s.pixels[i],b.palette.base.slice(1));}}
 assert.equal(new Set(data.samples.map(s=>s.home.x+':'+s.home.y)).size,4);
});
test('141 : le lecteur autonome dessine les deux relevés et filtre les neuf communautés avec accents',()=>{
 const html=fs.readFileSync(path.join(reader,'LIRE_BIOMES_1_41.html'),'utf8'),code=html.match(/<script>([\s\S]*?)<\/script>/)[1],decode=s=>s.replace(/&(amp|lt|gt|quot|#39);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[k]));
 const articles=[...html.matchAll(/<article id="([^"]+)" data-category="([^"]+)" data-search="([^"]+)">/g)].map(m=>({id:m[1],dataset:{category:m[2],search:decode(m[3])},hidden:false}));assert.equal(articles.length,115);
 const nodes=new Map(),paint=[];const element=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='layer'?'soil':'',textContent:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},getContext(){return{fillStyle:'',fillRect(x,y,w,h){paint.push({color:this.fillStyle,x,y,w,h});},strokeRect(){},strokeText(){},fillText(){}};}});return nodes.get(id);};
 const document={getElementById:element,querySelectorAll:selector=>selector==='article'?articles:[]};vm.runInNewContext(code,{document},{timeout:1000});
 assert.equal(element('count').textContent,'115 fiches affichées sur 115');assert.equal(element('communityLegend').hidden,true);assert.equal(paint.length,4*96*96);const soil=paint[0].color;element('layer').value='communities';element('layer').listeners.change();assert.equal(element('communityLegend').hidden,false);assert.equal(paint.length,8*96*96);assert.notEqual(paint[4*96*96].color,soil);
 element('category').value='habitat';element('category').listeners.change();assert.equal(element('count').textContent,'9 fiches affichées sur 115');
 element('search').value='clairiere';element('search').listeners.input();const visible=articles.filter(a=>!a.hidden);assert.equal(visible.length,1);assert.equal(visible[0].id,'habitat141-clearing');
 element('search').value='';element('category').value='rock';element('category').listeners.change();assert.equal(element('count').textContent,'4 fiches affichées sur 115');
});
