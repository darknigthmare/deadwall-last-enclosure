'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{bootDocument134}=require('../scripts/qa-startup134.cjs');
function start(seed='17117'){const e=bootDocument134();e.g.startNew('standard',seed);e.g.campaignIntro132.skip();return e;}
function show(g,doc){doc.getElementById('reconPanel').classList.remove('hidden');g.frontierUI.refresh(true);return g.frontierUI.atlas;}
function stable(g){const s=g.serialize();delete s.timestamp;return JSON.stringify(s);}
function clickWorld(doc,atlas,x,y){const canvas=doc.getElementById('frontierMap'),q=atlas.screen(x,y),r=canvas.getBoundingClientRect(),p=atlas.position(),e={clientX:r.left+q.x*r.width/p.width,clientY:r.top+q.y*r.height/p.height,pointerType:'mouse'};canvas.dispatch('pointerdown',e);canvas.dispatch('pointerup',e);}
test('atlas 1.41 : première lecture cadre toute la région au lieu de son ancien carré nord-ouest',()=>{
 const{g,doc}=start(),atlas=show(g,doc),w=g.frontier.world(),p=atlas.position(),b=atlas.bounds();
 assert.equal(p.x,w.size/2);assert.equal(p.y,w.size/2);assert.ok(b.left<=0&&b.top<=0&&b.right>=w.size&&b.bottom>=w.size);
 assert.ok(w.home.x>=b.left&&w.home.x<=b.right&&w.home.y>=b.top&&w.home.y<=b.bottom);
 const provenance=doc.getElementById('atlasWorld').textContent;assert.match(provenance,/Graine 17117/);assert.ok(provenance.includes('G'+w.generation));assert.ok(provenance.includes((w.home.x/1000).toFixed(3)));
});
test('atlas 1.41 : ouvrir depuis le refuge donne la vue régionale, sans déplacer ou découvrir',()=>{
 const{g}=start(),before=stable(g);assert.equal(g.frontierUI.open(),true);const a=g.frontierUI.atlas,w=g.frontier.world();assert.equal(a.position().x,w.size/2);assert.equal(a.position().y,w.size/2);assert.equal(stable(g),before);
});
test('atlas 1.41 : nouvelle graine réinitialise sélection et mesure puis recadre les quatre côtés',()=>{
 const{g,doc}=start(),atlas=show(g,doc);atlas.city();const old=g.frontier.world();assert.equal(atlas.selected().kind,'home');
 g.startNew('standard','84329');g.campaignIntro132.skip();show(g,doc);const w=g.frontier.world(),b=atlas.bounds();assert.notEqual(w,old);assert.equal(atlas.selected(),null);assert.deepEqual(atlas.measure(),[]);assert.ok(b.left<=0&&b.top<=0&&b.right>=w.size&&b.bottom>=w.size);assert.match(doc.getElementById('atlasWorld').textContent,/84329/);
});
test('atlas 1.41 : terrain inspecté partage le biome réel sans révéler de lieux ou modifier la sauvegarde',()=>{
 const{g,doc}=start(),a=show(g,doc),w=g.frontier.world(),x=w.size*.9,y=w.size*.84,b=w.biomeAt(x,y),before=stable(g);clickWorld(doc,a,x,y);
 assert.equal(a.selected().kind,'terrain');assert.ok(doc.getElementById('atlasInspector').children[0].textContent.includes(b.name));assert.equal(doc.getElementById('atlasPin').hidden,true);assert.equal(stable(g),before);
 doc.getElementById('atlasLayer-biomes').checked=true;doc.getElementById('atlasLayer-biomes').dispatch('change');assert.equal(a.layers().biomes,true);assert.equal(stable(g),before);
});
test('atlas 1.41 : noms bornés au canvas et réservés loin de la règle et du nord',()=>{
 const A=globalThis.DeadwallAtlasRender||require('../src/atlas-render.js'),r=A.labelBounds(180,5,40,300,200);assert.equal(r.x,8);assert.ok(r.x+r.w<=292);
 assert.equal(A.labelBounds(400,150,40,300,200),null);assert.equal(A.labelBounds(30,150,199,300,200),null);
 assert.equal(A.labelBounds(80,250,20,300,200,[{x:240,y:8,w:50,h:25}],[],true),null);
 assert.equal(A.labelBounds(80,100,180,300,200,[{x:10,y:157,w:150,h:36}],[],true),null);
});
test('atlas 1.41 : noms des biomes utilisent l’autorité du monde et un cache de présentation borné',()=>{
 const A=globalThis.DeadwallAtlasRender,P=globalThis.DeadwallAtlasProjection;let calls=0;const w={size:24576,generation:7,biomeAt(x,y){calls++;return{id:x<12288?'a':'b',name:x<12288?'Bois humide':'Prairie',blend:0,palette:{accent:'#aabbcc'}};}},cam=P.camera(850,600);cam.regionSize(w.size);cam.fit(w.size/2,w.size/2,w.size);
 const names=A.biomeLabels(w,cam);assert.deepEqual(names.map(n=>n.text).sort(),['Bois humide','Prairie']);const cold=calls;assert.equal(A.biomeLabels(w,cam),names);assert.equal(calls,cold);cam.pan(20,0);A.biomeLabels(w,cam);assert.ok(calls>cold);cam.fit(12000,12000,128);assert.deepEqual(A.biomeLabels(w,cam),[]);
});
test('carnet 1.41 : compléter par biome ajoute uniquement des lieux confirmés et respecte les six étapes',()=>{
 const{g,doc}=start(),w=g.frontier.world(),groups=new Map();for(const p of w.pois){const list=groups.get(p.biome)||[];list.push(p);groups.set(p.biome,list);}const sites=[...groups.values()].sort((a,b)=>b.length-a.length)[0].slice(0,10),d=g.serialize();d.frontier.seen=sites.map(p=>p.id);g.restoreSave(d);g.frontierUI.open();doc.getElementById('fieldAtlasPanel').open=true;g.fieldAtlasUI.refresh(true);
 const select=doc.getElementById('fieldAtlasBiome'),add=doc.getElementById('fieldAtlasBiomeAdd');select.value=sites[0].biome;select.dispatch('change');assert.equal(add.disabled,false);const stock={...g.resources};add.click();const planned=g.fieldAtlas.snapshot().tour;assert.equal(planned.stops.length,6);assert.ok(planned.stops.every(id=>d.frontier.seen.includes(id)));assert.deepEqual(g.resources,stock);assert.equal(add.disabled,true);
 assert.ok(g.fieldAtlas.start());g.fieldAtlasUI.refresh(true);assert.equal(select.disabled,true);assert.equal(add.disabled,true);const before=g.fieldAtlas.snapshot();add.dispatch('click');assert.deepEqual(g.fieldAtlas.snapshot(),before);assert.deepEqual(g.resources,stock);
});
test('carnet 1.41 : aucun biome de lieux inconnu n’est proposé avant exploration',()=>{
 const{g,doc}=start();g.frontierUI.open();doc.getElementById('fieldAtlasPanel').open=true;g.fieldAtlasUI.refresh(true);const select=doc.getElementById('fieldAtlasBiome');assert.equal(select.disabled,true);assert.equal(doc.getElementById('fieldAtlasBiomeAdd').disabled,true);assert.equal(select.children.length,1);assert.match(select.children[0].textContent,/Aucun lieu confirmé/);assert.deepEqual(g.fieldAtlas.snapshot().tour.stops,[]);
});
test('atlas 1.41 : D-17 garde le sol réel des biomes au lieu d’un carré sombre peint par-dessus',()=>{
 const{g}=start(),A=globalThis.DeadwallAtlasRender,h=globalThis.DeadwallAtlasProjection.home(g),world=g.frontier.world(),fills=[],stub=new Proxy({},{get(_,k){if(k==='fillRect')return(...args)=>fills.push(args);return()=>{};},set(){return true;}});
 const options={model:{bounds:{x:h.minX,y:h.minY,w:h.size,h:h.size},buildings:[],units:[]},resources:false,units:false,terrainWorld:world};A.drawHome(stub,g,options);assert.equal(fills.some(a=>a[0]===h.minX&&a[1]===h.minY&&a[2]===h.size&&a[3]===h.size),false);
 A.drawHome(stub,g,{...options,terrainWorld:null});assert.equal(fills.some(a=>a[0]===h.minX&&a[1]===h.minY&&a[2]===h.size&&a[3]===h.size),true);
});
test('atlas 1.41 : un guidage G7 depuis le refuge distingue le segment régional de la sortie locale',()=>{
 const{g,doc}=start(),w=g.frontier.world(),p=w.pois[0],d=g.serialize();d.frontier.seen=[p.id];g.restoreSave(d);assert.ok(g.frontier.pin(p.id));const route=g.frontier.guidance();assert.equal(route.localSegmentRequired,true);g.frontierUI.open();assert.match(doc.getElementById('frontierRoute').textContent,/Trajet régional : rejoindre une sortie locale dégagée/);
});
test('retour 1.41 : le dossier distingue les kilomètres régionaux et les portions locales réellement vérifiées',()=>{
 const{g,doc}=start(),before=stable(g),plan=g.fieldSupplies.routePlan();assert.equal(plan.localSegmentVerified,true);assert.ok(Number.isFinite(plan.localMetres)&&Number.isFinite(plan.regionalMetres));g.fieldSuppliesUI.open();const text=doc.getElementById('supplyRoute').textContent;
 assert.ok(text.includes('Région '+(plan.regionalMetres/1000).toFixed(2)+' km'));assert.ok(text.includes('portions dans D-17 '+(plan.localMetres/1000).toFixed(3)+' km'));assert.ok(text.includes(plan.note));assert.match(text,/peuvent changer après une construction/);assert.equal(stable(g),before);
});
