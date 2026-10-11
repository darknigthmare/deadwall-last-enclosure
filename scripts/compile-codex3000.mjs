import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
/* Reproducible compiler; never modifies the original 3,000 source records. */
const root=fileURLToPath(new URL('..',import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const index=read('codex-3000/INDEX_3000.json');
const originals=[...read('codex-3000/originaux/DEADWALL_CODEX_1.22/CATALOGUE_500.json').fiches,
  ...read('codex-3000/originaux/DEADWALL_CODEX_SUPPLEMENT_1.23/CATALOGUE_501_1000.json').fiches];
const contexts=read('codex-3000/source/CONTEXTES.json');
const states=read('codex-3000/source/ETATS.json');
const modules=read('codex-3000/source/MODULES.json');
const assert=(yes,why)=>{if(!yes)throw Error('Codex 3000: '+why);};
assert(index.count===3000&&index.entries?.length===3000,'index incomplet');
assert(originals.length===1000&&new Set(originals.map(x=>x.id)).size===1000,'parents incomplets');
assert(states.length===8&&modules.length>=59,'modules ou états manquants');
const str=v=>String(v??'').replace(/\s+/g,' ').trim().slice(0,130);
const res=v=>{const text=String(v??'scrap').toLowerCase();for(const [word,key] of [['medicine','medicine'],['medicament','medicine'],['soin','medicine'],['food','food'],['aliment','food'],['nourrit','food'],['wood','wood'],['bois','wood'],['fuel','fuel'],['carburant','fuel'],['stone','stone'],['pierre','stone'],['ammo','ammo'],['munition','ammo']])if(text.includes(word))return key;return 'scrap';};
const source=new Map();
for(const p of originals){
  const parts=p.espaces?.length?p.espaces:p.zones?.length?p.zones:[];
  const rooms=parts.map((x,i)=>[str(typeof x==='string'?x:x?.nom??x?.zone??x?.name??'Salle '+(i+1)),
   res(x?.ressource??x?.ressource_dominante??x?.resource),Number(x?.z??x?.niveau??0)||0]).filter(x=>x[0]).slice(0,18);
  if(!rooms.length)rooms.push(['Accueil','scrap',0],['Service','wood',0],['Réserve','scrap',0]);
  const dim=[Math.max(17,Math.min(78,Math.round(22+rooms.length*2))),Math.max(15,Math.min(70,Math.ceil(rooms.length/2)*8+4))];
  const family=str(p.famille??p.family),name=str(p.nom??p.name);
  assert(name&&family,'parent incomplet '+p.id);
  source.set(p.id,[name,family,dim,rooms]);
}
const rows=index.entries.map((x,i)=>{
  const id='DW-'+String(i+1).padStart(4,'0'),parent=x.parent??x.id,p=source.get(parent);
  assert(id===x.id&&!!p,'identifiant ou parent invalide '+id);
  assert((x.family??p[1])===p[1],'famille parent incohérente '+id);
  if(i>=1000){assert(contexts[p[1]]?.includes(x.module),'contexte invalide '+id);assert(states.some(s=>s.id===x.state),'état invalide '+id);}
  return [i+1,str(x.name??p[0]),p[1],Number(parent.slice(3)),x.module||'',x.state||''];
});
const data={version:1,count:3000,
 parents:Object.fromEntries([...source].map(([id,row])=>[Number(id.slice(3)),row])),
 programmes:rows,
 modules:Object.fromEntries(modules.map(x=>[x.id,[str(x.title),x.status]])),
 states:Object.fromEntries(states.map(x=>[x.id,[str(x.name),str(x.cause)]]))};
assert(rows.length===3000&&new Set(rows.map(x=>x[0])).size===3000,'couverture non exhaustive');
const dest=path.join(root,'src/codex3000-live-data.js');
const text='/* Generated from original Codex 3000. Do not hand-edit. */\n(function(root){const data='+
 JSON.stringify(data).replace(/</g,'\\u003c')+
 ';root.DeadwallCodex3000Data=data;if(typeof module==="object"&&module.exports)module.exports=data;})(typeof globalThis!=="undefined"?globalThis:this);\n';
if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==text)fs.writeFileSync(dest,text);
console.log('Codex live : '+rows.length+' fiches, '+source.size+' parents, '+modules.length+' contextes ; '+Buffer.byteLength(text)+' octets');
