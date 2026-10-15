'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const U=require('../src/codex-usage163.js'),R=require('../src/codex3000-runtime.js');
function source(id,name){
 const programme=R.describe(id),room=programme.rooms.find(r=>r.name===name);
 assert.ok(room,'Published source room missing: '+id+' / '+name);
 return {room,context:{family:programme.family,programmeName:programme.name}};
}
function role(id,name){const {room,context}=source(id,name);return U.classify(room,context)?.id??null;}

test('163 source roles retain public reception instead of reading its paperwork as an archive',()=>{
 assert.equal(role('DW-3001','Vestibule des affaires de séjour'),'reception');
 assert.equal(role('DW-3185','Accueil et préparation des dossiers'),'reception');
});
test('163 food, parts and sanitary-module stocks keep a storage role',()=>{
 for(const [id,name] of [
  ['DW-3029','Réserve des ingrédients identifiés'],['DW-3029','Stock froid arrêté'],
  ['DW-3236','Réserve des raccords de pompage'],['DW-3321','Stock des montures électriques'],
  ['DW-3624','Rangement des outils sanitaires'],['DW-3772','Stockage des modules sanitaires'],
  ['DW-3937','Préparation des coffrets sanitaires']])assert.equal(role(id,name),'storage',id+' / '+name);
});
test('163 documentary rooms retain archives with actual bookshelves or consultation tables',()=>{
 assert.equal(role('DW-3500','Salle des actes consultables'),'archives');
 assert.equal(role('DW-3500','Table des index de décision'),'archives');
 assert.equal(role('DW-3500','Archives des recueils communaux'),'archives');
});
test('163 authored beds distinguish a household room and a collective dormitory',()=>{
 assert.equal(role('DW-3001','Chambre du foyer'),'sleeping');
 assert.equal(role('DW-3075','Couchage des résidents'),'dormitory');
 assert.equal(role('DW-3026','Salle de repos de jour'),'sleeping');
});
test('163 industrial baths and loose sanitary parts never become bedrooms or bathrooms',()=>{
 assert.equal(role('DW-3258','Chambre noire des bains'),null);
 assert.notEqual(role('DW-3312','Zone des bains de couleur'),'bathroom');
 for(const [id,name] of [['DW-3771','Préparation des cartons sanitaires'],['DW-3786','Inspection des lots sanitaires']]){
  assert.equal(role(id,name),'storage');assert.notEqual(role(id,name),'medical');
 }
 assert.equal(U.classify({name:'Chambre climatique de prototype',sourceProps158:[{kind:'bed'}]}),null);
});
test('163 washing tools uses a work sink and textile laundry needs textile evidence',()=>{
 assert.equal(role('DW-3005','Lavage des outils'),'workshop');
 assert.equal(role('DW-3026','Buanderie du retour'),'laundry');
 assert.equal(role('DW-3075','Rangement du linge de séjour'),'storage');
});
test('163 education context identifies real lesson rooms without treating a parts reserve as a classroom',()=>{
 assert.equal(role('DW-3201','Poste de pompes pédagogiques arrêté'),'classroom');
 assert.equal(role('DW-3236','Salle des dessins de pompage'),'classroom');
 assert.equal(role('DW-3236','Réserve des raccords de pompage'),'storage');
 assert.equal(U.classify({name:'Cours de service',sourceProps158:[{kind:'table'}]},{family:'Entrepôts et réserves'}),null);
});
test('163 group orders and group rehearsals do not imply electrical equipment',()=>{
 assert.notEqual(role('DW-3196','Table de répartition par groupe'),'technical');
 assert.notEqual(role('DW-3196','Comptoir des commandes groupées'),'technical');
 assert.notEqual(role('DW-3456','Salle des répétitions de groupe'),'technical');
 assert.equal(U.classify({name:'Local du groupe électrogène',sourceProps158:[{kind:'generator'}]})?.id,'technical');
});
test('163 kitchen and workshop sources keep distinct real equipment roles',()=>{
 assert.equal(role('DW-3001','Cuisine des occupants'),'kitchen');
 assert.equal(role('DW-3001','Presse de reliure arrêtée'),'workshop');
 assert.equal(role('DW-3075','Salle de repas résidentiels'),'dining');
 assert.equal(U.classify({name:'Module prototype de cuisson',sourceProps158:[{kind:'oven'}]},{programmeName:'Restaurant pédagogique'})?.id??null,null);
});
test('163 material engraving and equipment inspection require their actual work support',()=>{
 assert.equal(role('DW-3960','Vérification des appareils confiés'),'workshop');
 assert.equal(role('DW-3560','Gravure des indications'),'workshop');
 assert.equal(role('DW-3560','Contrôle des poinçonnages'),'workshop');
 assert.equal(role('DW-3460','Comptoir des réservations adaptées'),null);
 assert.equal(U.classify({name:'Contrôle des dossiers confiés',sourceProps158:[{kind:'steelTable'}]})?.id??null,null);
 assert.equal(U.classify({name:'Gravure des indications',sourceProps158:[{kind:'shelf'}]})?.id??null,null);
});
test('163 retail display uses shop context without converting stock or workbenches into a sales floor',()=>{
 assert.equal(role('DW-3321','Mur des interrupteurs'),'retail');
 assert.equal(role('DW-3321','Stock des montures électriques'),'storage');
 assert.equal(U.classify({name:'Atelier de réparation',sourceProps158:[{kind:'workbench'}]},{family:'Commerces non alimentaires'})?.id,'workshop');
});
test('163 authored asset inventories and independent slots are accepted, name-only kits are not',()=>{
 assert.equal(role('DW-0012','sanitaires'),'bathroom');
 assert.equal(role('DW-0201','sanitaires'),'bathroom');
 assert.equal(U.classify({name:'Salle de bain',authoredProps:[{asset:'sink'},{asset:'shower'}]})?.id,'bathroom');
 assert.equal(U.classify({name:'Salle de bain',props:[{kind:'sink'}]})?.id,'bathroom');
 assert.equal(U.classify({name:'Salle de bain',kit:{id:'bathroom'},props:[0,1]}),null);
 assert.equal(U.classify({name:'Dortoir',exterior:true,sourceProps158:[{kind:'bed'}]}),null);
 assert.equal(U.classify({name:'Préparation des modules sanitaires',sourceProps158:[{kind:'sink'}]}),null);
 assert.deepEqual(U.kinds({sourceProps158:[{kind:'shelf'},{kind:'shelf'}],props:[1,{kind:'crate'}]}),['crate','shelf']);
});
test('163 classification is deterministic, immutable and read-only across all4000 published programmes',()=>{
 const allowed=new Set(U.ROLES);let classified=0,parents=0;
 for(const record of R.records){
  if(record.id===record.parent)parents++;
  const description=R.describe(record.id),before=JSON.stringify(description),context={family:record.family,programmeName:record.name};
  for(const room of description.rooms){
   const a=U.classify(room,context),b=U.classify(room,context);assert.deepEqual(a,b);
   if(!a)continue;classified++;assert.ok(allowed.has(a.id));assert.ok(['high','medium'].includes(a.confidence));
   assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.evidence)&&a.evidence.length>=1);assert.notEqual(room.exterior,true);
  }
  assert.equal(JSON.stringify(description),before,record.id+' source mutated');
 }
 assert.equal(R.records.length,4000);assert.equal(parents,2000);assert.ok(classified>0);
});
