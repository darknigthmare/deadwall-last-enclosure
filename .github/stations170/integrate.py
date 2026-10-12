"""One-time exact integration, staged in memory before any write. No network or Git writes."""
from pathlib import Path
import hashlib,json,subprocess
BASE='884eb2b6bf0e038f53a1d2c0581ff6353a6981ed'
staged={};original={}
def read(name):
 if name not in staged:
  data=Path(name).read_bytes()
  expected=subprocess.check_output(['git','show',BASE+':'+name])
  if data!=expected:raise RuntimeError('Source diverged before integration: '+name)
  original[name]=data;staged[name]=data.decode('utf8')
 return staged[name]
def rep(name,a,b,count=1):
 s=read(name)
 if s.count(a)!=count:raise RuntimeError(name+': expected '+str(count)+' exact anchors: '+a[:90])
 staged[name]=s.replace(a,b)
rep('src/codex3000-runtime.js',' function searchDocument(id){'," function stations(options){const api=globalThis.DeadwallCodexStations170||(typeof require==='function'?require('./codex-stations170.js'):null);if(!api)throw Error('Postes et stocks au sol non chargés');return api.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159});}\n function searchDocument(id){")
rep('src/codex3000-runtime.js','fill,infill,searchDocument','fill,infill,stations,searchDocument')
line=next(l for l in read('src/frontier-world.js').splitlines() if 'effects.detailVersion>=7' in l and 'Codex3000.infill' in l)
rep('src/frontier-world.js',line,line+"\n if(effects.detailVersion>=8&&programme)dressed=Codex3000.stations({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});")
rep('src/frontier-state.js','![0,1,2,3,4,5,6,7].includes(raw.detailVersion)','![0,1,2,3,4,5,6,7,8].includes(raw.detailVersion)')
rep('src/world-pack131.js','![2,3,4,5,6,7].includes(target)','![2,3,4,5,6,7,8].includes(target)')
rep('src/world-pack131.js','(target===7&&!root.DeadwallCodex3000Runtime?.infill)','(target>=7&&!root.DeadwallCodex3000Runtime?.infill)||(target===8&&!root.DeadwallCodex3000Runtime?.stations)')
rep('src/world-pack131.js','function actions(){const p=nearby(),a=[];if(pos().generation>=7){',"function actions(){const p=nearby(),a=[];if(pos().generation>=7){const station=detailUpgradeStatus159(8);a.push({id:'stations170',label:'COMPLÉTER ATELIERS ET STOCKAGES',reason:station.reason||'Au dépôt : machines statiques et stockage au sol selon les sources. Accès de maintenance préservés, aucun courant ni stock supplémentaire.',disabled:!station.ok,run:()=>upgradeDetails159(8),close:true});")
rep('src/codex-plan165.js','![5,6,7].includes(detailVersion)','![5,6,7,8].includes(detailVersion)')
rep('src/codex-plan165.js','  if(detailVersion>=7)details=R.infill({seed,p,z,plan,detail:details,programme:id});','  if(detailVersion>=7)details=R.infill({seed,p,z,plan,detail:details,programme:id});\n  if(detailVersion>=8)details=R.stations({seed,p,z,plan,detail:details,programme:id});')
rep('src/codex-plan165.js',"  const show=el('button','AFFICHER LE PLAN');","  const stationLabel=el('label','Compléter ateliers et stockages (révision 8, inclut 6–7)'),stationToggle=el('input');stationToggle.type='checkbox';stationToggle.dataset.stations170='revision';stationToggle.style.width='24px';stationLabel.append(stationToggle);\n  const show=el('button','AFFICHER LE PLAN');")
rep('src/codex-plan165.js','yardToggle.checked?7:fillToggle.checked?6:5','stationToggle.checked?8:yardToggle.checked?7:fillToggle.checked?6:5')
rep('src/codex-plan165.js',"  yardToggle.addEventListener('change',()=>{fillToggle.disabled=yardToggle.checked;if(visible)generate();});","  const syncRevisions=()=>{yardToggle.disabled=stationToggle.checked;fillToggle.disabled=stationToggle.checked||yardToggle.checked;if(visible)generate();};\n  yardToggle.addEventListener('change',syncRevisions);stationToggle.addEventListener('change',syncRevisions);")
rep('src/codex-plan165.js','controls.append(seedLabel,floorLabel,fillLabel,yardLabel,show)','controls.append(seedLabel,floorLabel,fillLabel,yardLabel,stationLabel,show)')
rep('src/codex-plan165.js',"     +(s.adapted?' Dimensions adaptées", "     +(preview.details.stations170?' '+preview.details.stations170.added+' machines, palettes ou caisses placées ; zones de service libres, appareils non alimentés.':'')\n     +(s.adapted?' Dimensions adaptées")
rep('src/codex-coverage167.js',"'ensembles165','fill168','infill169'","'ensembles165','fill168','infill169','stations170'")
rep('src/codex-coverage167.js','o.spriteWidth169||o.w','o.spriteWidth169||o.spriteWidth170||o.w')
rep('src/codex-coverage167.js','o.spriteHeight169||o.h','o.spriteHeight169||o.spriteHeight170||o.h')
rep('src/codex-coverage167.js','  return freeze({complements169,source:ref,',"  const stations170=detail.stations170?copy(detail.stations170):null;\n  return freeze({stations170,complements169,source:ref,")
rep('src/codex-coverage167.js',"  if(report.scope==='unsupported')", "  if(inspected&&report.stations170){const s=report.stations170;host.appendChild(el('h6','ATELIERS ET STOCKAGES — RÉVISION 8'));host.appendChild(el('p',s.added+' équipements statiques ajoutés. Les machines gardent quatre faces de maintenance ; les stocks posés au sol gardent leur accès. Aucune alimentation ni ressource supplémentaire.'));for(const r of s.requests)if(r.unplaced)host.appendChild(el('p',r.name+' — '+r.kind+' : '+r.unplaced+' élément(s) non posé(s), motif '+r.reason+'.'));}\n  if(report.scope==='unsupported')")
rep('scripts/compile-codex3000.mjs','const text=fs.readFileSync',"const text=fs.readFileSync(path.join(root,'src/codex-stations170.js'),'utf8')+'\\n'+fs.readFileSync")
rep('tests/distribution.test.cjs',"return ['src/codex-infill169.js'","return ['src/codex-stations170.js','src/codex-infill169.js'")
rep('src/seed-detail-art157.js',"  table:route('furniture','table'),","  machine:route('furniture','machine'),crate:route('furniture','crate'),\n  table:route('furniture','table'),")
rep('src/seed-detail-art157.js',"  if(o?.dressing160){", "  if(o?.station170){\n   const {spriteWidth170:w,spriteHeight170:h,angle170:a}=o;if(!c||![o.x,o.y,o.w,o.h,w,h,a].every(Number.isFinite)||w<=0||h<=0)return false;\n   c.save();try{c.beginPath();c.rect(o.x,o.y,o.w,o.h);c.clip();c.translate(o.x+o.w/2,o.y+o.h/2);c.rotate(a);return draw(c,{...o,station170:false,x:-w/2,y:-h/2,w,h},{art,seed});}finally{c.restore();}\n  }\n  if(o?.dressing160){")
rep('src/seed-detail-art157.js',"   case 'pallet':case 'crateStack':","   case 'crate':case 'pallet':case 'crateStack':")
rep('src/seed-detail-art157.js',"   case 'bed':case 'sofa':case 'shelf':", "   case 'machine':fill(.04,.07,.92,.86,'#53675e');box(.06,.09,.88,.81,metal,.05);fill(.12,.2,.30,.60,'#8a9a8c');fill(.47,.24,.42,.52,'#293f35');for(let k=0;k<4;k++)fill(.52+k*.08,.25,.03,.5,metal);oval(.28,.49,.10,.18,'#334e42');fill(.14,.13,.20,.05,'#b6a574');break;\n   case 'bed':case 'sofa':case 'shelf':")
s=read('sw.js');rep('sw.js',s.splitlines()[0],"const CACHE = 'deadwall-v1.57.0-stations170';")
import re
for p in Path('tests').glob('*.test.cjs'):
 if 'stations170' in p.name:continue
 s=p.read_text();s2=re.sub(r'(detailVersion\s*:\s*)8\b',r'\g<1>9',s)
 s2=s2.replace('upgradeDetails159(8)','upgradeDetails159(9)').replace('[8,-1,1.5','[9,-1,1.5').replace("[-1,8,'1'","[-1,9,'1'")
 if p.name=='codex-infill169.test.cjs':s2=s2.replace('[0,1,2,3,4,5,6,7]','[0,1,2,3,4,5,6,7,8]').replace('[-1,8,1.5','[-1,9,1.5')
 if s2!=s:
  name=p.as_posix();read(name);staged[name]=s2
records=[]
for name,text in staged.items():
 data=text.encode();records.append({'path':name,'before':hashlib.sha256(original[name]).hexdigest(),'after':hashlib.sha256(data).hexdigest()})
for name,text in staged.items():Path(name).write_text(text)
out=Path('artifacts/qa/stations170-preflight');out.mkdir(parents=True,exist_ok=True)
(out/'integration.json').write_text(json.dumps({'base':BASE,'files':records},indent=2))
print('INTEGRATED170 '+json.dumps([r['path'] for r in records]))
