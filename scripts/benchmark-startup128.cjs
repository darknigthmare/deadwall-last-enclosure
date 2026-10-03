'use strict';
/* CPU-only lifecycle benchmark. Fresh child process per version/round; fake DOM, no FPS claims. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);
const option=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const summarize=samples=>{const sorted=[...samples].sort((a,b)=>a-b);return{samples:samples.length,meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p50Ms:sorted[Math.floor((sorted.length-1)*.5)],p95Ms:sorted[Math.floor((sorted.length-1)*.95)],maxMs:sorted.at(-1)};};
function random(seed){let value=seed>>>0;return()=>{value=(Math.imul(1664525,value)+1013904223)>>>0;return value/4294967296;};}
function child(){
 const project=path.resolve(option('--project',root));Math.random=random(128031);Date.now=()=>1801000000000;
 const W=require(path.join(project,'src/frontier-world.js')),create=W.create,geometry=[];
 let phase='bootstrap';W.create=(...a)=>{const start=performance.now(),w=create(...a);geometry.push({phase,ms:performance.now()-start,seed:a[0],generation:a[1],pois:w.pois.length});return w;};
 const phases=[];function measure(name,fn){phase=name;const t=performance.now(),n=geometry.length,value=fn();phases.push({name,ms:performance.now()-t,geometryCreated:geometry.length-n});return value;}
 const env=measure('bootstrap',()=>{const e=require(path.join(project,'tests/helpers/expansions127.cjs')).boot127();e.game.startNew('standard','17117');return e;});
 const g=env.game;g.random=new globalThis.DeadwallCore.Random(17117);g.phaseTime=9999;g.exploration125.wildNext=1e8;
 measure('closed-essential-hud',()=>{
  // Both versions use their actual essential-ui module; only browser layout and the parent dossier are mocked.
  const original=document.getElementById.bind(document);
  document.getElementById=id=>document.body.querySelectorAll('#'+id)[0]||original(id);
  const recon=original('reconPanel'),host=original('frontierDossier');document.body.appendChild(recon);recon.appendChild(host);recon.classList.add('hidden');
  g.frontierUI={open(){recon.classList.remove('hidden');},refresh(){}};
  Object.getPrototypeOf(host).scrollIntoView=function(){};
  document.readyState='complete';require(path.join(project,'src/essential-ui.js'));
 });
 measure('first-local-update',()=>g.update(.04));
 const localSamples=[];measure('local-updates',()=>{for(let i=0;i<600;i++){const t=performance.now();g.update(.04);localSamples.push(performance.now()-t);}});
 assert.equal(g.frontier.active(),false);assert.equal(g.gameOver,false);
 const beforeEntry={resources:{...g.resources},elapsed:g.elapsed,geometryCreated:geometry.length,localState:g.frontier.snapshot()};
 measure('first-region-entry',()=>{g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());});
 assert.equal(g.frontier.active(),true);assert.equal(g.frontier.world().seed,17117);
 const world=g.frontier.world(),f=g.frontier.position?.()||g.frontier.snapshot();
 const result={version:require(path.join(project,'package.json')).version,phases,geometry,localUpdates:summarize(localSamples),beforeEntry,afterEntry:{active:f.active,x:f.x,y:f.y,z:f.z,pois:world.pois.length,seed:world.seed,generation:world.generation},totalMeasuredMs:phases.reduce((n,p)=>n+p.ms,0),browser:false};
 process.stdout.write(JSON.stringify(result));
}
if(args.includes('--child'))child();else{
 const baseline=path.resolve(option('--baseline-root',path.join(root,'..','..','baseline128','DEADWALL_1.27.0_OPERATIONS'))),rounds=Math.max(1,Number(option('--rounds','3'))),runs=[];
 assert.ok(fs.existsSync(path.join(baseline,'src/frontier.js')),'baseline source is required');
 for(let round=1;round<=rounds;round++)for(const [label,project]of(round%2?[['1.27 baseline',baseline],['current',root]]:[['current',root],['1.27 baseline',baseline]])){
  const r=spawnSync(process.execPath,[__filename,'--child','--project',project],{encoding:'utf8',maxBuffer:8*1024*1024});if(r.status!==0)throw Error(r.stderr||r.stdout);
  runs.push({round,label,...JSON.parse(r.stdout)});process.stderr.write('Round '+round+' '+label+' complete\n');
 }
 const data={generatedAt:new Date().toISOString(),protocol:'Fresh child process per version and round, alternating order. Seeded Math.random and fixed Date.now make initial worker placement comparable; performance.now remains real. Actual simulation and essential HUD module under fake DOM; 600 local updates at .04 seconds, no warm-up for startup. The first explicit regional entry is measured separately. CPU timings only: no browser, CSS layout, image decode or GPU.',environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length},runs};
 const directory=path.join(root,'reports/1.28.0');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'PERFORMANCE_STARTUP.json'),JSON.stringify(data,null,2)+'\n');
 const rows=[];for(const name of runs[0].phases.map(p=>p.name))for(const label of ['1.27 baseline','current']){const sample=runs.filter(r=>r.label===label).map(r=>r.phases.find(p=>p.name===name));rows.push('| '+name+' | '+label+' | '+(sample.reduce((s,p)=>s+p.ms,0)/sample.length).toFixed(3)+' | '+sample.map(p=>p.geometryCreated).join(' / ')+' |');}
 for(const label of ['1.27 baseline','current']){const sample=runs.filter(r=>r.label===label);rows.push('| Total des phases, première sortie comprise | '+label+' | '+(sample.reduce((s,r)=>s+r.totalMeasuredMs,0)/sample.length).toFixed(3)+' | '+sample.map(r=>r.geometry.length).join(' / ')+' |');}
 const sameState=runs.every(r=>JSON.stringify(r.beforeEntry.resources)===JSON.stringify(runs[0].beforeEntry.resources)&&JSON.stringify(r.afterEntry)===JSON.stringify(runs[0].afterEntry));assert.ok(sameState,'fixture outcome differs');
 const text='# Démarrage et première sortie régionale — 1.28\n\n'+data.protocol+'\n\nCommande : `node scripts/benchmark-startup128.cjs --baseline-root <source-1.27> --rounds '+rounds+'`. Hôte partagé : '+data.environment.cpu+', '+data.environment.logicalCpus+' processeurs logiques, '+process.version+'. Les valeurs sont indicatives et aucun seuil de temps ne conditionne la réussite des tests.\n\n| Étape | Version | Durée moyenne ms | Régions générées par round |\n|---|---|---:|---|\n'+rows.join('\n')+'\n\nLa génération de la région reste synchrone et coûteuse à sa première consultation utile (dossier détaillé, carte ou sortie physique). Elle n’est plus déclenchée pour simplement lire une position, une voiture ou le résumé du matériel dans D-17. Le coût différé est affiché séparément, pas retiré du total. Deux modèles sont construits au total : le modèle jouable et celui de la validation de sauvegarde. Dans la version précédente, l’un était payé inutilement dès le HUD fermé ; ils sont maintenant tous deux payés à la première sortie si aucun dossier régional n’a été consulté. Le temps total de cette fixture reste voisin : le bénéfice est le démarrage local plus rapide, sans accélération annoncée de la sortie régionale. Les ressources locales et le point d’arrivée de cette fixture sont identiques entre versions.\n\nLe JSON conserve chaque phase et chaque génération. Le test ne mesure ni FPS, ni mise en page réelle, ni audio, ni sortie tactile. Il ne représente pas une longue campagne humaine ou une région saturée d’acteurs.\n';fs.writeFileSync(path.join(directory,'PERFORMANCE_STARTUP.md'),text);process.stdout.write(JSON.stringify({report:path.join(directory,'PERFORMANCE_STARTUP.json'),runs:runs.length,sameState})+'\n');
}
