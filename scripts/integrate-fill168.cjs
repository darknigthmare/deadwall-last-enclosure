/* One-time integration helper. Exact anchors, all-or-nothing staging, no Git or network writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const staged=new Map(),original=new Map();
const read=file=>{if(!staged.has(file)){const text=fs.readFileSync(file,'utf8');staged.set(file,text);original.set(file,text);}return staged.get(file);};
function replace(file,old,next,count=1){const text=read(file),parts=text.split(old);if(parts.length!==count+1)throw Error(file+': expected '+count+' occurrences of '+old.slice(0,90)+', found '+(parts.length-1));staged.set(file,parts.join(next));}
if(fs.readFileSync('src/frontier-world.js','utf8').includes('Codex3000.fill(')){console.log('FILL168 already integrated');process.exit(0);}
replace('src/codex3000-runtime.js',' function searchDocument(id){'," function fill(options){const api=globalThis.DeadwallCodexFill168||(typeof require==='function'?require('./codex-fill168.js'):null);if(!api)throw Error('Complément mobilier non chargé');return api.enrich({...options,description:describe(options.programme||options.p.codex),geometry:G,recipes:Recipes159,anchors:Anchors160});}\n function searchDocument(id){");
replace('src/codex3000-runtime.js','quantities,ensembles,searchDocument','quantities,ensembles,fill,searchDocument');
const world='src/frontier-world.js',line=read(world).split('\n').find(l=>l.includes('if(effects.detailVersion>=5')&&l.includes('Codex3000.ensembles'));
if(!line)throw Error('Explicit detail layering hook missing');
replace(world,line,line+"\n if(effects.detailVersion>=6&&programme)dressed=Codex3000.fill({seed,p,z,plan:plan(p,z),detail:dressed,programme:programme.id});");
replace('src/frontier-state.js','![0,1,2,3,4,5].includes(raw.detailVersion)','![0,1,2,3,4,5,6].includes(raw.detailVersion)');
replace('src/world-pack131.js','![2,3,4,5].includes(target)','![2,3,4,5,6].includes(target)');
replace('src/world-pack131.js','||(target===5&&!root.DeadwallCodex3000Runtime?.ensembles))','||(target>=5&&!root.DeadwallCodex3000Runtime?.ensembles)||(target===6&&!root.DeadwallCodex3000Runtime?.fill))');
replace('src/world-pack131.js','function actions(){const p=nearby(),a=[];if(pos().generation>=7){',"function actions(){const p=nearby(),a=[];if(pos().generation>=7){const fill=detailUpgradeStatus159(6);a.push({id:'fillDetails168',label:'COMPLÉTER LES ÉQUIPEMENTS MANQUANTS',reason:fill.reason||'Au dépôt : minima auteur, cuisines, rangements et postes de travail. Meubles, passages et stocks conservés ; aucun appareil alimenté automatiquement.',disabled:!fill.ok,run:()=>upgradeDetails159(6),close:true});");
const plan='src/codex-plan165.js';
replace(plan,'function inspect(id,rawSeed=0,z=0){',"function inspect(id,rawSeed=0,z=0,detailVersion=5){\n  if(![5,6].includes(detailVersion))throw Error('Révision d’aperçu inconnue.');");
replace(plan,'  details=R.ensembles({seed,p,z,plan,detail:details,programme:id});','  details=R.ensembles({seed,p,z,plan,detail:details,programme:id});\n  if(detailVersion===6)details=R.fill({seed,p,z,plan,detail:details,programme:id});');
replace(plan,'return {id,seed,z,levels:','return {id,seed,z,detailVersion,levels:');
replace(plan,"  const show=el('button','AFFICHER LE PLAN');", "  const fillLabel=el('label','Compléter les minima auteur (révision 6)'),fillToggle=el('input');fillToggle.type='checkbox';fillToggle.dataset.fill168='revision';fillToggle.style.width='24px';fillLabel.append(fillToggle);\n  const show=el('button','AFFICHER LE PLAN');");
replace(plan,'const preview=inspect(id,seed.value,Number(floor.value));','const preview=inspect(id,seed.value,Number(floor.value),fillToggle.checked?6:5);');
replace(plan,"controls.append(seedLabel,floorLabel,show);","fillToggle.addEventListener('change',()=>{if(visible)generate();});\n  controls.append(seedLabel,floorLabel,fillLabel,show);");
replace(plan,"ensembles non posés. Aperçu de la révision 5, activation volontaire au dépôt.'","ensembles non posés. Aperçu de la révision '+preview.detailVersion+', activation volontaire au dépôt.'\n     +(preview.details.fill168?' '+preview.details.fill168.added+' équipements manquants effectivement ajoutés ; aucun stock ni branchement supplémentaire.':'')");
replace('src/codex-coverage167.js',"['recipe159','anchors160','quantities164','ensembles165']","['recipe159','anchors160','quantities164','ensembles165','fill168']");
replace('scripts/compile-codex3000.mjs',"const text=fs.readFileSync(path.join(root,'src/codex-coverage167.js')", "const text=fs.readFileSync(path.join(root,'src/codex-fill168.js'),'utf8')+'\\n'+fs.readFileSync(path.join(root,'src/codex-coverage167.js')");
replace('tests/distribution.test.cjs',"return ['src/codex-coverage167.js'","return ['src/codex-fill168.js','src/codex-coverage167.js'");
replace('scripts/browser-plan165.mjs',"host.locator('input')","host.locator('input[type=number]')",4);
// Negative next-revision checks remain strict; prior implemented revisions remain valid.
for(const file of fs.readdirSync('tests').filter(n=>/\.test\.cjs$/.test(n)&&!n.includes('fill168'))){
 const name='tests/'+file;let text=fs.readFileSync(name,'utf8'),next=text;
 next=next.replace(/detailVersion:\s*6\b/g,'detailVersion:7').replace(/upgradeDetails159\(6\)/g,'upgradeDetails159(7)');
 next=next.replace(/\[6,-1,1\.5/g,'[7,-1,1.5').replace(/\[-1,6,'1'/g,"[-1,7,'1'");
 if(next!==text){read(name);staged.set(name,next);}
}
// This older test still rejected revision 4, which was already implemented before this pass.
replace('tests/codex-recipes159.test.cjs','state.detailVersion=4;assert.throws(()=>S.normalize(state));',"for(const v of [0,1,2,3,4,5,6])assert.equal(S.normalize({...state,detailVersion:v}).detailVersion,v);for(const v of [7,-1,1.5,'6',true,null,NaN,Infinity])assert.throws(()=>S.normalize({...state,detailVersion:v}));");
const sw=read('sw.js'),match=sw.match(/^const CACHE = '([^']+)';/);if(!match)throw Error('Cache marker absent');replace('sw.js',match[0],"const CACHE = 'deadwall-v1.57.0-fill168';");
const dir='artifacts/qa/fill168-integration';fs.mkdirSync(dir,{recursive:true});
const records=[];for(const [file,text]of staged){if(text===original.get(file))continue;const sha=s=>crypto.createHash('sha256').update(s).digest('hex');records.push({file,before:sha(original.get(file)),after:sha(text)});}
for(const {file}of records)fs.writeFileSync(file,staged.get(file));
fs.writeFileSync(path.join(dir,'changed.json'),JSON.stringify(records,null,2)+'\n');console.log('FILL168_INTEGRATED '+JSON.stringify(records.map(r=>r.file)));
