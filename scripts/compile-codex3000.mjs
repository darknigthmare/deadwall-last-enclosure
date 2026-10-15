import fs from 'node:fs';
import Recipes159 from '../src/codex3000-recipes159.js';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LOTS,validateAll} from '../codex-3000/addendum-1.58/validation.mjs';
import {makeIndex,renderReader} from '../codex-3000/addendum-1.58/reader.mjs';
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
function authoredEnvelope(p){
  const n=Number(p.id.slice(3)),rootPart=n<=500
    ?'codex-3000/originaux/DEADWALL_CODEX_1.22/fiches/'
    :'codex-3000/originaux/DEADWALL_CODEX_SUPPLEMENT_1.23/FICHES_501_1000/';
  const raw=fs.readFileSync(path.join(root,rootPart+p.id+'.md'),'utf8');
  const old=/Enveloppe de parcelle proposée\s*:\s*de\s*(\d+)\s*[×x]\s*(\d+)\s*m\s*à\s*(\d+)\s*[×x]\s*(\d+)\s*m/i.exec(raw);
  const next=/\*\*Emprise\s*:\*\*\s*(\d+)\s*[×x]\s*(\d+)\s*m/i.exec(raw);
  const dims=old?{min:[+old[1],+old[2]],max:[+old[3],+old[4]]}
    :next?{min:[+next[1],+next[2]],max:[+next[1],+next[2]]}:null;
  const floorText=/Niveaux proposés\s*:\s*([-\d,\s]+)/i.exec(raw)?.[1]
    ||/\*\*Niveaux\s*:\*\*\s*(\d+)/i.exec(raw)?.[1]||'0';
  const sourceLevels=[...new Set(old?floorText.split(',').map(Number).filter(Number.isInteger)
    :Array.from({length:Math.max(1,Number(floorText)||1)},(_,i)=>i))].sort((a,b)=>a-b);
  let levels=sourceLevels.filter(v=>v>=-1&&v<=2);
  if(!levels.includes(0))levels.push(0);
  levels=[...new Set(levels)].sort((a,b)=>a-b);
  assert(dims&&dims.min.every(v=>v>0)&&levels.length>0,'emprise/niveaux non reconnus '+p.id);
  return {sourceMin:dims.min,sourceMax:dims.max,sourceLevels,levels};
}
for(const p of originals){
  const parts=p.espaces?.length?p.espaces:p.zones?.length?p.zones:[];
  const rooms=parts.map((x,i)=>[str(typeof x==='string'?x:x?.nom??x?.zone??x?.name??'Salle '+(i+1)),
   res(x?.ressource??x?.ressource_dominante??x?.resource),Number(x?.z??x?.niveau??0)||0]).filter(x=>x[0]).slice(0,18);
  if(!rooms.length)rooms.push(['Accueil','scrap',0],['Service','wood',0],['Réserve','scrap',0]);
  const envelope=authoredEnvelope(p);
  const [originalW,originalH]=envelope.sourceMin;
  const neededW=Math.max(17,Math.min(78,Math.round(20+rooms.length*1.25)));
  const neededH=Math.max(18,Math.min(75,Math.ceil(rooms.length/2)*7+1));
  const dim=[Math.min(78,Math.max(neededW,Math.min(originalW,78))),Math.min(75,Math.max(neededH,Math.min(originalH,75)))];
  for(let i=0;i<rooms.length;i++){
    if(!envelope.levels.includes(rooms[i][2])){
      const title=rooms[i][0].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      if(envelope.levels.includes(-1)&&/cave|sous.sol|galerie|reserve|chaufferie|local technique/.test(title))rooms[i][2]=-1;
      else if(envelope.levels.includes(1)&&/chambre|dortoir|repos|etage|bureau|archives/.test(title))rooms[i][2]=1;
      else rooms[i][2]=0;
    }
  }
  const family=str(p.famille??p.family),name=str(p.nom??p.name);
  assert(name&&family,'parent incomplet '+p.id);
  source.set(p.id,[name,family,dim,rooms,envelope]);
}
const rows=index.entries.map((x,i)=>{
  const id='DW-'+String(i+1).padStart(4,'0'),parent=x.parent??x.id,p=source.get(parent);
  assert(id===x.id&&!!p,'identifiant ou parent invalide '+id);
  assert((x.family??p[1])===p[1],'famille parent incohérente '+id);
  if(i>=1000){assert(contexts[p[1]]?.includes(x.module),'contexte invalide '+id);assert(states.some(s=>s.id===x.state),'état invalide '+id);}
  return [i+1,str(x.name??p[0]),p[1],Number(parent.slice(3)),x.module||'',x.state||''];
});
// The historical archive is immutable. Each additional card is a new parent,
// not a third contextual copy of an existing design.
const extension=validateAll(LOTS.map(file=>read('codex-3000/addendum-1.58/'+file)),
  rows.map(row=>row[1]));
for(const p of extension){
 const a=p.architecture,rooms=p.spaces.map(s=>[s.name,s.resource,s.z]);
 const most=Math.max(...a.levels.map(z=>p.spaces.filter(s=>s.z===z).length));
 const lobby=a.layout==='gallery'?3.2:2.2,cross=a.layout==='cross'?3.2:0;
 const dim=[a.width,Math.max(a.height,Math.ceil(Math.ceil(most/2)*6.7+lobby*2+cross+.8))];
 assert(dim[1]<=75,'nouveau programme trop haut '+p.id);
 const envelope={sourceMin:[a.width,a.height],sourceMax:[a.width,a.height],
  sourceLevels:a.levels,levels:a.levels};
 source.set(p.id,[p.name,p.family,dim,rooms,envelope,p]);
 const n=Number(p.id.slice(3));rows.push([n,p.name,p.family,n,'','']);
}
const data={version:1,count:4000,legacyCount:3000,extensionVersion:'1.58.0',
 parents:Object.fromEntries([...source].map(([id,row])=>[Number(id.slice(3)),row])),
 programmes:rows,
 modules:Object.fromEntries(modules.map(x=>[x.id,[str(x.title),x.status]])),
 states:Object.fromEntries(states.map(x=>[x.id,[str(x.name),str(x.cause)]]))};
assert(rows.length===4000&&source.size===2000&&new Set(rows.map(x=>x[0])).size===4000,'couverture non exhaustive');
data.details159=Recipes159.compact(Recipes159.compile(originals,states));
// Author-supported nouns are indexed once per parent, not 3000 times per search.
// Each source keeps its dimensions and constraints; this is a read-only index.
data.details159.search160=Object.fromEntries(originals.map(p=>[p.id,(p.espaces||p.zones||[]).map(r=>[r.nom||r.zone,...(r.props||[]).map(o=>o.nom),...Recipes159.kitFor(r.nom||r.zone).inventory].join(' ')).join(' ')]));
const dest=path.join(root,'src/codex3000-live-data.js');
const text=fs.readFileSync(path.join(root,'src/codex-gardens171.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-stations170.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-infill169-art.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-infill169.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-fill168.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-coverage167.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-ensembles165.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-plan165.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-quantities164.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-sites162.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-anchors160.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex-dressing160.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/codex3000-recipes159.js'),'utf8')+'\n'+'/* Generated from original Codex 3000. Do not hand-edit. */\n(function(root){const data='+
 JSON.stringify(data).replace(/</g,'\\u003c')+
 ';root.DeadwallCodex3000Data=data;if(typeof module==="object"&&module.exports)module.exports=data;})(typeof globalThis!=="undefined"?globalThis:this);\n';
if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==text)fs.writeFileSync(dest,text);
for(const [file,content]of [['INDEX_1000.json',JSON.stringify(makeIndex(extension),null,2)+'\n'],
 ['LIRE_1000_NOUVEAUX.html',renderReader(extension)]]){
 const output=path.join(root,'codex-3000/addendum-1.58',file);
 if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==content)fs.writeFileSync(output,content);
}
console.log('Codex live : '+rows.length+' fiches, '+source.size+' parents, '+modules.length+' modules, 8 états ; '+Buffer.byteLength(text)+' octets');
