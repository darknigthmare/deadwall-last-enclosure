/* Shared author contract. Importing this module does not generate or mutate files. */
export const FAMILIES=Object.freeze(['Habitat individuel','Habitat collectif','Commerces non alimentaires','Alimentation et restauration','Services et petits ateliers','Hôtellerie et hébergement','Santé','Éducation et connaissance','Administration et communauté','Secours et protection civile','Abris et souterrains','Entrepôts et réserves','Automobile et carburant','Industrie et production','Énergie et communication','Agriculture','Forêts et filière bois','Mines et matériaux','Loisirs et culture','Ruines et lieux dégradés visitables']);
export const PROPS=Object.freeze(['dentalChair','sterilizer','steelTable','dishRack','timberRack','sawBench','clampRack','palletStack','generator','electricalRack','counter','oven','washer','kennel','plantTray','tirePile','hoseRack','bench','bed','sofa','table','desk','wardrobe','shelf','crate','fridge','medical','fuel','workbench','logs','rubble','machine','sink','pump','car']);
export const RESOURCES=Object.freeze(['wood','scrap','stone','food','fuel','ammo','medicine']);
export const BIOMES=Object.freeze(['meadow','bocage','deciduous','mixed','conifer','riparian','wetland','heath','limestone','rockyHighland','orchard','brownfield']);
export const TOWNS=Object.freeze(['hameau','village','bourg','ville','grande-ville']);
export const ROOFS=Object.freeze(['cottage','collective','retail','workshop','hotel','clinic','school','civic','service','industrial','farm','ruin','greenhouse','chapel','underground']);
export const LAYOUTS=Object.freeze(['axial','offset','cross','gallery']);
export const LOTS=Object.freeze(['PROGRAMMES_A.json','PROGRAMMES_B.json','PROGRAMMES_C.json','PROGRAMMES_D.json']);
const normalized=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
export function validateRecord(p,expectedId){
 const fail=why=>{throw Error('Codex 1.58 '+(p?.id||expectedId||'?')+': '+why);};
 const text=(v,label,min=12,max=2400)=>{if(typeof v!=='string'||v.trim().length<min||v.length>max)fail(label+' absent ou hors longueur');};
 const strings=(v,label,min=1)=>{if(!Array.isArray(v)||v.length<min||v.length>20)fail(label+' incomplet');for(const s of v)text(s,label,8);};
 const choices=(v,allowed,label,min=1)=>{if(!Array.isArray(v)||v.length<min||new Set(v).size!==v.length||v.some(x=>!allowed.includes(x)))fail(label+' invalide');};
 if(!p||typeof p!=='object'||Array.isArray(p))fail('fiche absente');
 if(!/^DW-(3\d{3}|4000)$/.test(p.id)||Number(p.id.slice(3))<3001||expectedId&&p.id!==expectedId)fail('identifiant nouveau invalide');
 text(p.name,'nom',8,120);text(p.purpose,'usage',30);if(!FAMILIES.includes(p.family))fail('famille non prise en charge');
 const a=p.architecture;if(!a||typeof a!=='object')fail('architecture absente');
 if(!Number.isInteger(a.width)||a.width<24||a.width>78||!Number.isInteger(a.height)||a.height<24||a.height>75)fail('emprise hors 24–78 × 24–75 m');
 choices(a.levels,[-1,0,1,2],'niveaux');if(!a.levels.includes(0)||a.levels.length>3||a.levels.some((z,i)=>i&&z!==a.levels[i-1]+1))fail('niveaux non contigus, sans RDC ou plus de trois');
 if(!LAYOUTS.includes(a.layout)||!ROOFS.includes(a.roofFamily))fail('distribution ou famille de toit invalide');text(a.material,'matières',12);
 if(!Array.isArray(p.spaces)||p.spaces.length<6||p.spaces.length>18)fail('6–18 espaces requis');
 const ids=new Set();for(const s of p.spaces){
  if(!s||typeof s!=='object'||typeof s.id!=='string'||!/^[a-z][a-z0-9-]{1,39}$/.test(s.id)||ids.has(s.id))fail('identité de pièce invalide');ids.add(s.id);
  text(s.name,'nom de pièce',4,120);text(s.usage,'usage de pièce',15);if(!a.levels.includes(s.z)||!RESOURCES.includes(s.resource))fail('niveau ou ressource de pièce invalide');
  if(!Array.isArray(s.props)||s.props.length<1||s.props.length>2)fail('1–2 meubles par pièce requis');
  for(const o of s.props)if(!o||!PROPS.includes(o.kind)||!RESOURCES.includes(o.resource))fail('meuble ou ressource inconnus');
 }
 for(const z of a.levels)if(p.spaces.filter(s=>s.z===z).length<2||p.spaces.filter(s=>s.z===z).length>10)fail('chaque niveau exige 2–10 pièces');
 const acc=p.access;if(!acc||!Number.isFinite(acc.width_m)||acc.width_m<1.4||acc.width_m>3.4)fail('largeur d’accès invalide');
 for(const k of ['public','service','return'])text(acc[k],'accès '+k,20);
 const pl=p.placement;if(!pl||!['any','town','rural'].includes(pl.mode))fail('implantation invalide');choices(pl.biomes,BIOMES,'biomes');choices(pl.townKinds,TOWNS,'communautés',0);if(pl.mode==='town'&&!pl.townKinds.length)fail('implantation urbaine sans communauté');
 text(p.supplies,'ressources finies',35);strings(p.risks,'risques',2);text(p.night,'nuit',35);strings(p.variants,'variations',2);strings(p.interactions,'interactions',2);strings(p.qa,'contrôles',3);text(p.story,'traces',35);
 return p;
}
export function validateLot(lot,letter){
 const start=3001+'ABCD'.indexOf(letter)*250;if(start<3001||!lot||lot.schemaVersion!==1||lot.version!=='1.58.0'||lot.count!==250||!Array.isArray(lot.fiches)||lot.fiches.length!==250)throw Error('Lot Codex 1.58 invalide '+letter);
 const names=new Set();lot.fiches.forEach((p,i)=>{validateRecord(p,'DW-'+(start+i));const key=normalized(p.name);if(names.has(key))throw Error('Nom dupliqué '+p.id);names.add(key);});return lot;
}
export function validateAll(lots,existingNames=[]){
 const names=new Set(existingNames.map(normalized)),signatures=new Set();let count=0;
 lots.forEach((lot,i)=>{validateLot(lot,'ABCD'[i]);for(const p of lot.fiches){const key=normalized(p.name);if(names.has(key))throw Error('Nom réutilisé '+p.id);names.add(key);
  const sig=JSON.stringify([p.family,normalized(p.purpose),p.spaces.map(s=>[normalized(s.name),s.usage,s.z,s.props])]);if(signatures.has(sig))throw Error('Programme répété '+p.id);signatures.add(sig);count++;}});
 if(count!==1000)throw Error('Extension Codex 1.58 incomplète');return lots.flatMap(l=>l.fiches);
}
