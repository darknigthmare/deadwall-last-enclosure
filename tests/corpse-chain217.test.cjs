'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),K=require('../src/corpse-chain217.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.CorpseChain217Rules,P=R.pyre,F=R.pit,S=R.sickness,W=R.weather,TILE=C.TILE,T=b=>globalThis.DeadwallTactics.footprint(b);
const none=()=>({version:1,active:false,pending:0,burned:0,buried:0,pyre:null,pitLeft:0,pitOpen:false,pitFill:0,pitsClosed:0,exposure:0,sick:0,deaths:0,ill:0,died:0,saved:0});
const fresh=()=>({...none(),active:true});
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-6,(message||'')+' : '+a+' ≠ '+b);

function campaign(){const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip?.();g.__doc=doc;return g;}
const calm=g=>{g.phase='calm';g.phaseTime=1e6;g.weather=g.weatherTarget=.3;return g;};
const toAge=(g,age)=>{const data=g.serialize();data.urban.peakScore=Math.max(data.urban.peakScore,C.CITY_TIERS[age].requiredScore);data.urban.progression151={version:1,age};assert.equal(g.restoreSave(data),true);g.refreshMetrics(true);assert.equal(g.tier.id,age);return calm(g);};
function outpost(age=R.startAge){return toAge(campaign(),age);}
const state=g=>g.serialize().expansions127.modules.corpseChain217;
// Pose un état de filière par la sauvegarde : le chemin d'une reprise ordinaire.
function withState(g,patch,others={}){const data=JSON.parse(JSON.stringify(g.serialize()));data.expansions127.modules.corpseChain217={...fresh(),...patch};Object.assign(data.expansions127.modules,others);assert.equal(g.restoreSave(data),true);return calm(g);}
const run=(g,seconds,dt=1)=>{for(let t=0;t<seconds-1e-9;t+=dt)g.corpseChain217.tick(dt);};
const watch=g=>{const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};return notes;};
const mine=notes=>notes.filter(t=>/^(Bûcher|Fosse|Salubrité|Maladie)/.test(t));
const row=(g,label)=>g.corpseChain217.overview().rows.find(r=>r.label===label).value;
function wallWithWorker(g){
  const type=Object.values(C.BUILDINGS).find(d=>d.wall&&!d.gate).id,core=g.core(),B=core.constructor;
  const wall=new B(g.nextId++,type,T(core).x+10,T(core).y,0,1);wall.health=wall.def.health;g.world.add(wall);g.refreshMetrics(true);
  const worker=g.units.find(u=>u.kind==='worker'),point=g.workerCleanupPoint(worker,wall);worker.x=point.x;worker.y=point.y;
  assert.ok(wall.completed&&g.workerCanWorkAt(worker,point,C.WORKER_RULES.cleanupRange));return {wall,worker};
}
const ok=(result,label)=>assert.deepEqual(result,{ok:true},label+' : '+result.reason);

test('filière des corps : règles gelées dans le cœur, fonctions pures',()=>{
  for(const o of [R,P,P.cost,F,F.cost,S,S.medicine,W])assert.ok(Object.isFrozen(o));
  assert.equal(C.CITY_TIERS[R.startAge].name,'AVANT-POSTE');
  assert.deepEqual(K.FUELS,['wood','fuel']);for(const k of [...K.FUELS,...Object.keys(F.cost)])assert.ok(C.RESOURCE_KEYS.includes(k));
  assert.ok(P.perSecond>F.perSecond,'le bûcher est rapide, la fosse lente');assert.ok(P.signature>0&&F.capacity>0&&F.digSeconds>0);
  // Paliers ordonnés, annoncés avant d'arriver.
  assert.ok(0<S.graceSeconds&&S.graceSeconds<S.sickWarnSeconds&&S.sickWarnSeconds<S.sickSeconds&&S.sickSeconds<S.deathWarnSeconds&&S.deathWarnSeconds<S.deathSeconds);
  assert.ok(S.clearRatio>0&&S.clearRatio<1&&S.sickDamage>0&&S.sickDamage<1&&S.medicine.clinic<S.medicine.plain);
  assert.deepEqual([0,1,S.graceSeconds-1,S.graceSeconds,S.sickWarnSeconds,S.sickSeconds,S.deathWarnSeconds,S.deathSeconds,S.deathSeconds+1e5].map(K.stage),[0,1,1,2,3,4,5,6,6]);
  assert.equal(K.sickSlots(S.sickSeconds-1),0);assert.equal(K.sickSlots(S.sickSeconds),1);assert.equal(K.sickSlots(S.sickSeconds+S.sickInterval),2);
  assert.equal(K.sickSlots(S.deathSeconds+1e4),K.sickSlots(S.deathSeconds-1),'plus de nouveaux malades quand les morts commencent');
  assert.equal(K.deathSlots(S.deathSeconds-1),0);assert.equal(K.deathSlots(S.deathSeconds),1);assert.equal(K.deathSlots(S.deathSeconds+S.deathInterval),2);
  assert.equal(K.threshold(0),S.base);assert.equal(K.threshold(10),S.base+10*S.perPerson);assert.throws(()=>K.threshold(-1));assert.throws(()=>K.threshold(NaN));
  assert.equal(K.weatherFactor(.9),W.wet);assert.equal(K.weatherFactor(0),W.dry);assert.equal(K.weatherFactor(.3),1);assert.equal(K.weatherFactor(NaN),1);
  assert.ok(W.wet>1&&W.dry<1);
});

test('filière des corps : état validé strictement, absent des anciennes sauvegardes = inactif',()=>{
  assert.deepEqual(K.validate(undefined),none());assert.deepEqual(K.initial(),none());assert.deepEqual(K.validate(fresh()),fresh());
  const good={version:1,active:true,pending:42.5,burned:10,buried:3,pyre:'wood',pitLeft:0,pitOpen:true,pitFill:7.5,pitsClosed:2,exposure:S.deathSeconds+1,sick:K.sickSlots(S.deathSeconds),deaths:1,ill:4,died:1,saved:1};
  assert.deepEqual(K.validate(good),good);assert.notEqual(K.validate(good),good);
  assert.deepEqual(K.validate({...good,pyre:null,pitOpen:false,pitFill:0,pitLeft:12}).pitLeft,12);
  for(const bad of [null,[],'corps',{},{...good,version:2},{...good,active:1},{...good,extra:1},(({saved,...rest})=>rest)(good),
    {...good,pending:-1},{...good,pending:NaN},{...good,pending:'3'},{...good,burned:-1},{...good,buried:Infinity},{...good,pyre:'scrap'},{...good,pyre:true},
    {...good,pyre:'wood',pending:0},{...good,pitLeft:F.digSeconds+1},{...good,pitLeft:5},{...good,pitOpen:1},{...good,pitOpen:false},{...good,pitFill:F.capacity},
    {...good,pitFill:-1},{...good,pitsClosed:1.5},{...good,pitsClosed:-1},{...good,exposure:-1},{...good,exposure:NaN},
    {...good,sick:K.sickSlots(S.deathSeconds)+1},{...good,sick:.5},{...good,deaths:2},{...good,exposure:0},{...good,ill:-1},{...good,died:1.5},{...good,saved:1e7},
    {...good,active:false},{...none(),pending:1},{...none(),pitsClosed:1},{...none(),died:1},{...none(),pitLeft:3}])assert.throws(()=>K.validate(bad),/Filière des corps 217 invalide/);
});

test('filière des corps : active en nouvelle campagne, fermée avant l’âge Avant-poste où un corps déblayé disparaît comme avant',()=>{
  const g=calm(campaign()),notes=watch(g),A=g.corpseChain217;
  assert.ok(g.expansions.get('corpseChain217'));assert.equal(A.active(),true);assert.equal(A.open(),false);
  assert.match(A.overview().summary,/viendra à l’âge Avant-poste/);assert.deepEqual(A.actions(),[]);
  const {wall,worker}=wallWithWorker(g);wall.corpseLoad=200;
  near(g.clearCorpsesWithWorker(worker,wall,2),2*C.WORKER_RULES.cleanupPerSecond);assert.equal(A.pending(),0);
  assert.equal(A.receive(5),0);assert.equal(A.light('wood').ok,false);assert.match(A.openPit().reason,/viendra/);
  run(g,S.deathSeconds+400);
  assert.deepEqual(state(g),fresh());assert.equal(mine(notes).length,0);assert.equal(A.marks().length,0);
});

test('filière des corps : chaque corps déblayé d’un mur (ouvrier, Commandant) ou d’un fossé reste à traiter ; la charge du mur garde ses règles',()=>{
  const g=outpost(),A=g.corpseChain217,rate=C.WORKER_RULES.cleanupPerSecond,{wall,worker}=wallWithWorker(g);
  assert.equal(A.open(),true);wall.corpseLoad=20;
  near(g.clearCorpsesWithWorker(worker,wall,2),2*rate);near(wall.corpseLoad,20-2*rate,'charge retirée à la cadence du moteur');near(A.pending(),2*rate);
  // Commandant : même geste, même compte.
  const point=g.workerCleanupPoint(g.player,wall);g.player.x=point.x;g.player.y=point.y;
  const done=g.clearCorpsesWithWorker(g.player,wall,1);near(done,rate);near(A.pending(),3*rate);near(wall.corpseLoad,20-3*rate);
  // Rien de retiré, rien de compté : mur vide, ouvrier trop loin.
  const far={...worker,x:worker.x+900};Object.setPrototypeOf(far,Object.getPrototypeOf(worker));
  assert.equal(g.clearCorpsesWithWorker(far,wall,1),0);near(A.pending(),3*rate);
  wall.corpseLoad=.5;near(g.clearCorpsesWithWorker(worker,wall,5),.5);near(A.pending(),3*rate+.5,'jamais plus que la charge présente');
  assert.equal(g.clearCorpsesWithWorker(worker,wall,5),0);near(A.pending(),3*rate+.5);
  // La charge au pied du mur n'est touchée ni par la filière ni par le temps de la filière.
  wall.corpseLoad=33;const before=A.pending();run(g,30);assert.equal(wall.corpseLoad,33);near(A.pending(),before);
  // Fossé : un ouvrier à l'ordre « déblayer » en sort les corps, qui restent à traiter.
  const core=g.core(),x=C.grid(core.x)+6,y=C.grid(core.y)+1,pending=A.pending();
  const data=JSON.parse(JSON.stringify(g.serialize()));data.expansions127.modules.earthworks217={version:1,active:true,ditches:[{x,y,dug:C.Earthworks217Rules.digSeconds,fill:4}]};
  assert.equal(g.restoreSave(data),true);calm(g);near(g.corpseChain217.pending(),pending,'reprise sans perte');
  g.workerOrder='clear';for(const w of g.world.buildings.values())w.corpseLoad=0;
  const digger=g.units.find(u=>u.kind==='worker');digger.x=x*TILE+TILE/2;digger.y=y*TILE+TILE/2;digger.carry=0;digger.state='idle';
  for(let i=0;i<40&&g.earthworks217.at(x,y).fill>0;i++)g.earthworks217.updateAssignedUnit(digger,.25);
  assert.equal(g.earthworks217.at(x,y).fill,0);near(g.corpseChain217.pending(),pending+4,'les quatre corps du fossé');
});

test('filière des corps : la Nécropole achevée et la corvée accélèrent le déblaiement, donc l’arrivée des corps à traiter',()=>{
  const g=outpost(C.GreatWorks217Rules.startAge),rate=C.WORKER_RULES.cleanupPerSecond,N=C.GreatWorks217Rules.works.necropolis,D=C.CityLaws217Rules.clearingDuty;
  let {wall,worker}=wallWithWorker(g);wall.corpseLoad=500;
  near(g.clearCorpsesWithWorker(worker,wall,1),rate);near(g.corpseChain217.pending(),rate);
  // Nécropole achevée et corvée en cours, posées par la sauvegarde.
  const data=JSON.parse(JSON.stringify(g.serialize()));
  data.expansions127.modules.greatWorks217.works.necropolis={steps:N.steps.length,left:0,wave:1};
  Object.assign(data.expansions127.modules.cityLaws217,{clearingDuty:{on:true,wait:0},dutyLeft:D.seconds,dutyResume:'auto',dutyServed:1});
  data.expansions127.modules.corpseChain217={...fresh()};
  assert.equal(g.restoreSave(data),true);calm(g);
  assert.equal(g.greatWorks217.done('necropolis'),true);assert.ok(g.cityLaws217.duty()>0);
  wall=g.world.buildings.get(wall.id);worker=g.units.find(u=>u.kind==='worker');const p=g.workerCleanupPoint(worker,wall);worker.x=p.x;worker.y=p.y;
  const load=wall.corpseLoad,got=g.clearCorpsesWithWorker(worker,wall,1);
  near(got,rate*N.clearSpeed*D.speed,'les deux cadences se composent');near(g.corpseChain217.pending(),got);near(wall.corpseLoad,load-got);
  // Le Commandant n'en profite pas, et son déblaiement est compté de même.
  const q=g.workerCleanupPoint(g.player,wall);g.player.x=q.x;g.player.y=q.y;
  near(g.clearCorpsesWithWorker(g.player,wall,1),rate);near(g.corpseChain217.pending(),got+rate);
});

test('filière des corps : le bûcher paie exactement son combustible, ne pèse sur la signature que tant qu’il brûle, et s’éteint seul',()=>{
  const g=withState(outpost(),{pending:30}),A=g.corpseChain217,notes=watch(g);
  g.refreshMetrics(true);const signature=g.signature,wood=g.resources.wood,fuel=g.resources.fuel;
  assert.deepEqual(A.actions().map(a=>a.id),['light-wood','light-fuel','open-pit']);
  assert.equal(A.light('scrap').reason,'Combustible inconnu.');
  ok(A.light('wood'),'allumage');assert.equal(A.burning(),'wood');assert.equal(g.resources.wood,wood,'rien n’est payé à l’allumage');
  near(g.signature,signature+P.signature,'signature dès l’allumage');g.refreshMetrics(true);g.refreshMetrics(true);near(g.signature,signature+P.signature,'ajoutée une seule fois par calcul');
  assert.equal(A.light('fuel').reason,'Le bûcher brûle déjà.');assert.deepEqual(A.actions().map(a=>a.id),['douse','open-pit']);
  assert.deepEqual(A.marks().map(m=>[m.id,m.smoke]),[['pyre',true]]);
  // Par l'économie du moteur : 10 s de combustion.
  for(let i=0;i<10;i++)g.economyTick(1);
  near(A.pending(),30-10*P.perSecond);near(g.resources.wood,wood-10*P.perSecond*P.cost.wood,'bois par corps');assert.equal(g.resources.fuel,fuel);
  near(state(g).burned,10*P.perSecond);
  // Plus de corps : extinction, signature rendue.
  run(g,30);assert.equal(A.pending(),0);assert.equal(A.burning(),null);near(g.resources.wood,wood-30*P.cost.wood,'jamais plus que les corps brûlés');
  g.refreshMetrics(true);near(g.signature,signature,'signature revenue');assert.equal(A.marks().length,0);
  assert.deepEqual(mine(notes).map(t=>t.split(' : ')[0]),['Bûcher allumé au bois','Bûcher éteint']);assert.match(mine(notes)[1],/tous les corps sont brûlés/);
  assert.match(A.light('wood').reason,/Aucun corps à brûler/);
  // Au carburant, puis panne de combustible.
  withState(g,{pending:100});const B=g.corpseChain217,more=watch(g);g.resources.fuel=2;g.resources.wood=500;
  ok(B.light('fuel'),'carburant');run(g,60);
  assert.equal(B.burning(),null);near(g.resources.fuel,0);assert.equal(g.resources.wood,500);near(B.pending(),100-2/P.cost.fuel,'brûlés à hauteur du carburant');
  assert.match(mine(more).at(-1),/^Bûcher éteint faute de carburant : 80 corps restent/);
  assert.match(B.light('fuel').reason,/Pas de carburant/);
  // Éteint à la main : la signature retombe aussitôt, rien n'est rendu.
  ok(B.light('wood'),'rallumage');g.refreshMetrics(true);near(g.signature,signature+P.signature);run(g,2);const left=B.pending(),stock=g.resources.wood;
  ok(B.douse(),'extinction');assert.equal(B.burning(),null);near(g.signature,signature);assert.equal(B.pending(),left);assert.equal(g.resources.wood,stock);
  assert.equal(B.douse().reason,'Aucun bûcher ne brûle.');
});

test('filière des corps : la fosse coûte du bois et du travail, ensevelit lentement, se referme pleine ; il faut en rouvrir une',()=>{
  const g=withState(outpost(),{pending:F.capacity+30}),A=g.corpseChain217,notes=watch(g);
  g.refreshMetrics(true);const signature=g.signature,wood=g.resources.wood;
  g.resources.wood=F.cost.wood-1;assert.match(A.openPit().reason,/Stock insuffisant/);g.resources.wood=wood;
  g.phase='warning';assert.match(A.openPit().reason,/de l’alerte à la fin de l’assaut/);g.phase='calm';
  ok(A.openPit(),'ouverture');assert.equal(g.resources.wood,wood-F.cost.wood);assert.match(A.openPit().reason,/Fosse en chantier/);
  assert.deepEqual(A.pit(),{digging:true,left:F.digSeconds,open:false,fill:0,closed:0});assert.deepEqual(A.marks().map(m=>[m.id,m.digging]),[['pit',true]]);
  // Chantier arrêté pendant l'assaut et sans ouvrier présent.
  g.phase='assault';run(g,20);assert.equal(A.pit().left,F.digSeconds);g.phase='calm';
  const workers=g.units.filter(u=>u.kind==='worker');for(const u of workers)u.regionAbsent=true;run(g,20);assert.equal(A.pit().left,F.digSeconds);for(const u of workers)u.regionAbsent=false;
  run(g,F.digSeconds-1);assert.equal(A.pit().digging,true);assert.equal(A.pending(),F.capacity+30,'rien n’est enseveli pendant le chantier');
  run(g,1);assert.equal(A.pit().open,true);assert.match(A.openPit().reason,/déjà ouverte/);assert.deepEqual(A.actions().map(a=>a.id),['light-wood','light-fuel']);
  run(g,40);near(A.pit().fill,40*F.perSecond);near(A.pending(),F.capacity+30-40*F.perSecond);
  g.phase='assault';run(g,40);near(A.pit().fill,40*F.perSecond,'arrêtée pendant l’assaut');g.phase='calm';
  g.refreshMetrics(true);assert.equal(g.signature,signature,'aucune signature');assert.equal(g.resources.wood,wood-F.cost.wood,'aucun combustible');
  // Pleine : refermée, les corps en trop restent à traiter.
  run(g,F.capacity/F.perSecond);
  assert.deepEqual(A.pit(),{digging:false,left:0,open:false,fill:0,closed:1});near(A.pending(),30);near(state(g).buried,F.capacity);
  run(g,60);near(A.pending(),30,'sans fosse, rien ne s’ensevelit');
  assert.deepEqual(notes.filter(t=>t.startsWith('Fosse')).map(t=>t.split(' : ')[0]),['Fosse en chantier','Fosse ouverte','Fosse pleine']);
  assert.match(row(g,'Fosse'),/^Aucune fosse ouverte · 1 fosse refermée/);
  ok(A.openPit(),'nouvelle fosse');assert.equal(g.resources.wood,wood-2*F.cost.wood);
  // Fosse vidée de son travail : moins de corps que de place, elle reste ouverte.
  run(g,F.digSeconds+30/F.perSecond+5);assert.equal(A.pending(),0);near(A.pit().fill,30);assert.equal(A.pit().open,true);
});

test('filière des corps : la maladie vient par paliers annoncés, aux délais des règles, et l’assainissement arrête tout',()=>{
  const g=withState(outpost(),{pending:1000}),A=g.corpseChain217,notes=watch(g);g.resources.medicine=0;
  const cap=K.threshold(g.population);assert.equal(A.threshold(),cap);assert.ok(A.left()>=cap);
  const count=re=>notes.filter(t=>re.test(t)).length,health=()=>g.units.map(u=>u.health);
  g.morale=100;run(g,1);assert.equal(A.stage(),1);assert.equal(count(/^Salubrité : trop de corps/),1);
  run(g,S.graceSeconds-2);assert.equal(A.stage(),1);assert.equal(g.morale,100,'aucun effet pendant la grâce');
  assert.match(row(g,'Ensuite'),/^Le moral baissera dans 00:01\./);
  run(g,1);assert.equal(A.stage(),2);assert.equal(count(/^Salubrité : l’odeur/),1);near(g.morale,100-S.moraleDrain);
  run(g,S.sickWarnSeconds-S.graceSeconds);assert.equal(A.stage(),3);assert.equal(count(/premières fièvres/),1);
  const full=health();run(g,S.sickSeconds-S.sickWarnSeconds-1);assert.deepEqual(health(),full,'annoncé, pas encore de malade');assert.equal(count(/est tombé malade/),0);
  // Premier malade : le mieux portant, plus petit identifiant ; affaibli, jamais tué.
  run(g,1);assert.equal(A.stage(),4);assert.equal(count(/est tombé malade/),1);
  const first=[...g.units].sort((a,b)=>a.id-b.id)[0];near(first.health,first.maxHealth*(1-S.sickDamage));assert.equal(g.units.filter(u=>u.health<u.maxHealth).length,1);
  run(g,S.sickInterval-1);assert.equal(count(/est tombé malade/),1);run(g,1);assert.equal(count(/est tombé malade/),2);
  assert.equal(g.units.filter(u=>u.health<u.maxHealth).length,2,'le mal gagne un autre habitant');
  // Un pas de temps très long ne fait qu'un malade.
  const ill=state(g).ill;A.tick(S.sickInterval*3);assert.equal(state(g).ill,ill+1);
  run(g,S.deathWarnSeconds-state(g).exposure);assert.equal(A.stage(),5);assert.equal(count(/Les plus fragiles mourront/),1);
  const alive=g.units.filter(u=>!u.dead).length;
  run(g,S.deathSeconds-S.deathWarnSeconds-1);assert.equal(g.units.filter(u=>!u.dead).length,alive,'annoncé, pas encore de mort');
  assert.match(row(g,'Ensuite'),/mort dans 00:01\./);
  run(g,1);assert.equal(A.stage(),6);assert.equal(g.units.filter(u=>!u.dead).length,alive-1);assert.equal(count(/est mort dans les murs, emporté par la fièvre des charniers/),1);assert.equal(state(g).died,1);
  run(g,S.deathInterval-1);assert.equal(state(g).died,1);run(g,1);assert.equal(state(g).died,2);
  // Le dernier ouvrier est épargné.
  run(g,S.deathInterval*4);assert.equal(g.units.filter(u=>!u.dead&&u.kind==='worker').length,1);
  // Chaque palier n'a été annoncé qu'une fois.
  for(const re of [/^Salubrité : trop de corps/,/^Salubrité : l’odeur/,/premières fièvres/,/Les plus fragiles mourront/])assert.equal(count(re),1,String(re));
  // Assainir : sous le seuil de sortie, tout s'arrête ; entre les deux seuils, la maladie continue.
  const data=state(g);withState(g,{...data,pending:cap*S.clearRatio+5});const B=g.corpseChain217,more=watch(g);
  const exposure=state(g).exposure;run(g,3);assert.equal(state(g).exposure,exposure+3,'encore au-dessus du seuil de sortie');assert.deepEqual(mine(more),[]);
  withState(g,{...state(g),pending:1});const D=g.corpseChain217,last=watch(g);run(g,1);
  assert.equal(D.stage(),0);assert.deepEqual([state(g).exposure,state(g).sick,state(g).deaths],[0,0,0]);assert.deepEqual(mine(last),['Salubrité : la cité est assainie. La maladie recule.']);
  const morale=g.morale;run(g,600);assert.equal(g.morale,morale);assert.equal(mine(last).length,1);
  // Sous le seuil d'entrée, une cité saine le reste.
  withState(g,{pending:K.threshold(g.population)-1});run(g,600);assert.equal(g.corpseChain217.stage(),0);
});

test('filière des corps : la charge restée au pied des murs compte ; la pluie hâte la maladie, le temps sec la ralentit',()=>{
  const g=outpost(),A=g.corpseChain217,{wall}=wallWithWorker(g),cap=A.threshold();
  wall.corpseLoad=cap-1;run(g,10);assert.equal(A.stage(),0);near(A.left(),cap-1);
  wall.corpseLoad=cap+1;run(g,10);assert.equal(state(g).exposure,10,'temps neutre');assert.equal(wall.corpseLoad,cap+1,'la charge du mur n’est pas modifiée');
  g.weather=.9;run(g,10);near(state(g).exposure,10+10*W.wet);assert.match(row(g,'Ensuite'),/la pluie hâte le mal/);
  g.weather=0;run(g,10);near(state(g).exposure,10+10*W.wet+10*W.dry);assert.match(row(g,'Ensuite'),/le temps sec le ralentit/);
  // L'échéance affichée tient compte du rythme : il reste (grâce − exposition) / facteur.
  near(S.graceSeconds-state(g).exposure,S.graceSeconds-10-10*W.wet-10*W.dry);
  assert.match(row(g,'Ensuite'),new RegExp('^Le moral baissera dans '+C.formatTime((S.graceSeconds-state(g).exposure)/W.dry).replace(':','\\:')));
});

test('filière des corps : les médicaments évitent une mort, à moindre dose avec une clinique en service',()=>{
  const g=withState(outpost(),{pending:1000,exposure:S.deathSeconds-1,sick:K.sickSlots(S.deathSeconds-1)}),A=g.corpseChain217,notes=watch(g);
  const alive=()=>g.units.filter(u=>!u.dead).length,n=alive();
  g.resources.medicine=S.medicine.plain+1;
  run(g,1);assert.equal(alive(),n);assert.equal(g.resources.medicine,1);assert.equal(state(g).saved,1);assert.equal(state(g).died,0);
  assert.match(notes.at(-1),new RegExp('^Maladie : un ouvrier a été sauvé par '+S.medicine.plain+' médicaments'));
  assert.match(row(g,'Médicaments'),new RegExp('contre '+S.medicine.plain+' médicaments'));
  // Pas assez : rien n'est consommé, quelqu'un meurt.
  run(g,S.deathInterval);assert.equal(alive(),n-1);assert.equal(g.resources.medicine,1);assert.equal(state(g).died,1);
  // Clinique en service : dose réduite.
  const core=g.core(),B=core.constructor,clinic=new B(g.nextId++,'clinic',T(core).x+12,T(core).y+6,0,1);clinic.health=clinic.def.health;clinic.powered=true;g.world.add(clinic);
  assert.match(row(g,'Médicaments'),/clinique en service/);
  g.resources.medicine=S.medicine.clinic;run(g,S.deathInterval);assert.equal(alive(),n-1);assert.equal(g.resources.medicine,0);assert.equal(state(g).saved,2);
  clinic.powered=false;g.resources.medicine=S.medicine.clinic;run(g,S.deathInterval);assert.equal(g.resources.medicine,S.medicine.clinic,'clinique sans courant : dose pleine exigée');
});

test('filière des corps : sauvegarde et reprise fidèles, sans réannonce ni échéance rejouée',()=>{
  const g=withState(outpost(),{pending:1000}),A=g.corpseChain217;g.resources.medicine=0;g.resources.wood=5000;
  ok(A.light('wood'),'bûcher');ok(A.openPit(),'fosse');
  withState(g,{...state(g),pending:5000});run(g,S.sickSeconds+5);
  g.refreshMetrics(true);const signature=g.signature,saved=JSON.parse(JSON.stringify(g.serialize())),mod=saved.expansions127.modules.corpseChain217;
  assert.equal(mod.pyre,'wood');assert.equal(mod.pitOpen,true);assert.equal(mod.sick,1);assert.equal(mod.ill,1);assert.ok(mod.exposure>=S.sickSeconds);
  assert.equal(g.restoreSave(JSON.parse(JSON.stringify(saved))),true);calm(g);const B=g.corpseChain217,notes=watch(g);
  assert.deepEqual(state(g),mod);assert.equal(B.burning(),'wood');near(g.signature,signature,'le bûcher repris pèse toujours sur la signature');
  const hp=g.units.map(u=>u.health);run(g,10);
  assert.equal(mine(notes).length,0,'aucune annonce à la reprise');assert.deepEqual(g.units.map(u=>u.health),hp,'aucun malade rétroactif');
  assert.equal(state(g).ill,1);assert.ok(B.pending()<mod.pending,'bûcher et fosse reprennent leur travail');
  // Une sauvegarde corrompue est refusée en bloc.
  const bad=JSON.parse(JSON.stringify(saved));bad.expansions127.modules.corpseChain217.sick=99;
  assert.throws(()=>g.restoreSave(bad),/Filière des corps 217 invalide/);assert.equal(g.corpseChain217.burning(),'wood');
});

test('filière des corps : ancienne campagne inchangée — corps déblayés disparus, ni bûcher, ni fosse, ni maladie',()=>{
  const g=outpost(),old=JSON.parse(JSON.stringify(g.serialize()));delete old.expansions127.modules.corpseChain217;
  assert.equal(g.restoreSave(old),true);calm(g);const A=g.corpseChain217,notes=watch(g);
  assert.equal(A.active(),false);assert.equal(A.open(),false);assert.deepEqual(A.actions(),[]);assert.deepEqual(state(g),none());
  assert.match(A.overview().summary,/ne suit pas la filière des corps/);
  const {wall,worker}=wallWithWorker(g),rate=C.WORKER_RULES.cleanupPerSecond;wall.corpseLoad=900;
  g.refreshMetrics(true);const signature=g.signature,morale=g.morale=80,hp=g.units.map(u=>u.health),stock={...g.resources};
  near(g.clearCorpsesWithWorker(worker,wall,2),2*rate);near(wall.corpseLoad,900-2*rate);assert.equal(A.pending(),0);
  assert.match(A.light('wood').reason,/ne suit pas/);assert.match(A.openPit().reason,/ne suit pas/);assert.equal(A.receive(10),0);
  run(g,S.deathSeconds+600);
  assert.equal(g.morale,morale);assert.deepEqual(g.units.map(u=>u.health),hp);assert.deepEqual({...g.resources},stock);
  g.refreshMetrics(true);assert.equal(g.signature,signature);assert.equal(mine(notes).length,0);assert.deepEqual(state(g),none());assert.equal(A.marks().length,0);
});

test('filière des corps : carte « Corps et salubrité » et repères de carte, lecture seule',()=>{
  const g=withState(outpost(),{pending:12}),A=g.corpseChain217,doc=g.__doc;g.resources.wood=500;
  assert.equal(A.render(),false,'sans lecture de siège posée, pas de carte');
  assert.equal(require('../src/siege-readout.js').install(g,doc),true);
  assert.equal(A.render(),true);const card=doc.getElementById('corpseChainCard');assert.ok(card);assert.equal(card.hidden,false);
  assert.equal(doc.getElementById('corpseChainTitle').textContent,'Des corps attendent');assert.equal(doc.getElementById('corpseChain-pending').textContent,'12');
  assert.equal(doc.getElementById('corpseChain-pyre').textContent,'Éteint');assert.equal(doc.getElementById('corpseChain-health').textContent,'Salubre');
  assert.match(doc.getElementById('corpseChain-left').textContent,new RegExp('^12 · seuil '+K.threshold(g.population)+'$'));
  ok(A.light('wood'),'bûcher');ok(A.openPit(),'fosse');A.render();
  assert.equal(doc.getElementById('corpseChainTitle').textContent,'Le bûcher brûle');assert.match(doc.getElementById('corpseChain-pyre').textContent,/^Brûle au bois · signature \+60$/);
  assert.match(doc.getElementById('corpseChain-pit').textContent,/^En chantier · 00:45$/);assert.match(doc.getElementById('corpseChainNote').textContent,/Signature du bûcher : \+60/);
  const snap=()=>JSON.stringify({...g.serialize(),timestamp:0}),before=snap();
  const calls=[],ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...a)=>{calls.push(k);},set:(o,k,v)=>{o[k]=v;return true;}});
  assert.equal(A.drawMarks(ctx),2);assert.ok(calls.includes('arc')&&calls.includes('fillText')&&calls.includes('strokeRect'));
  A.render();A.overview();A.actions();assert.ok(snap()===before,'ni la carte ni les repères ne modifient la campagne');
  // Palier de maladie et prochaine échéance sur la carte.
  withState(g,{pending:1000,exposure:S.graceSeconds+10});require('../src/siege-readout.js').install(g,doc);g.corpseChain217.render();
  assert.equal(doc.getElementById('corpseChainTitle').textContent,'Premier temps : le moral baisse');assert.match(doc.getElementById('corpseChain-next').textContent,/^Premier malade dans 04:50\./);
  // Avant l'âge : carte masquée.
  const young=campaign();require('../src/siege-readout.js').install(young,young.__doc);young.corpseChain217.render();
  assert.equal(young.__doc.getElementById('corpseChainCard').hidden,true);
});

test('filière des corps : aucun hasard, aucun texte d’infection, script publié et enregistré',()=>{
  const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8'),source=read('src/corpse-chain217.js');
  for(const forbidden of ['Math.random','.random.','.random(','localStorage','Date.now','setTimeout','C.add(','world.add','new Building','corpseLoad='])assert.equal(source.includes(forbidden),false,forbidden);
  assert.equal(source.match(/C\.spend\(/g).length,1,'un seul paiement au stock, la fosse');
  // Textes joueur : la maladie n'est jamais rapprochée de ce qui relève les morts.
  const strings=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
  for(const word of [/infect/i,/contamin/i,/réanim/i,/relèv/i,/zombie/i,/morsure/i])assert.equal(word.test(strings),false,String(word));
  for(const file of ['index.html','sw.js'])assert.ok(read(file).includes('src/corpse-chain217.js'),file);
  const html=read('index.html'),at=name=>html.indexOf(name);
  assert.ok(at('src/earthworks217.js')>0&&at('src/great-works217.js')<at('src/corpse-chain217.js')&&at('src/corpse-chain217.js')<at('src/siege-readout.js'),'après les règles de cité qu’elle compose');
  {const kit=read('src/expansion-kit.js');assert.ok(kit.includes("'corpseChain217'")&&kit.indexOf("'corpseChain217'")<kit.indexOf("'balance217','breach217']"));}
  const ui=read('src/expansion-ui.js');assert.equal(ui.match(/corpseChain217/g).length,5);assert.ok(ui.includes("corpseChain217:'Corps et salubrité'"));
  assert.ok(read('src/earthworks217.js').includes('g.corpseChain217?.receive?.(before-d.fill)'));
});

test('filière des corps : corps laissés lus par district, la maladie reste comptée pour toute la cité',()=>{
  const g=withState(outpost(),{pending:12}),A=g.corpseChain217;
  assert.deepEqual(A.byDistrict(),{districts:[{rank:0,name:'Dehors',walls:0,pending:12,bodies:12}],moat:0},'sans module des districts, tout est dehors');
  assert.equal(require('../src/districts.js').install(g,g.__doc),true);
  // Une enceinte de palissades à trois cases du centre, et un mur isolé dehors.
  const core=g.core(),c=T(core),B=core.constructor,placed=[];
  const put=(type,gx,gy)=>{const b=new B(g.nextId++,type,gx,gy,0,1);b.progress=1;b.health=b.def.health;g.world.add(b);placed.push(b);return b;};
  const x0=c.x-3,x1=c.x+c.width+2,y0=c.y-3,y1=c.y+c.height+2;
  for(let x=x0;x<=x1;x++){put('woodWall',x,y0);put('woodWall',x,y1);}for(let y=y0+1;y<y1;y++){put('woodWall',x0,y);put('woodWall',x1,y);}
  const loose=put('woodWall',c.x+12,c.y);g.world.navigationVersion++;g.refreshMetrics(true);
  placed[3].corpseLoad=20;placed[7].corpseLoad=5;loose.corpseLoad=8;
  const before=JSON.stringify({...g.serialize(),timestamp:0}),exposure=state(g).exposure;
  const view=A.byDistrict();
  assert.deepEqual(view.districts.map(d=>[d.rank,d.name,d.walls,d.pending,d.bodies]),[[1,'Enceinte intérieure',25,12,37],[0,'Dehors',8,0,8]]);
  assert.equal(view.districts.reduce((n,d)=>n+d.bodies,0)+view.moat,A.left(),'la répartition recouvre exactement les corps laissés');
  assert.equal(row(g,'Par district'),'Enceinte intérieure 37 (dont 12 à traiter au dépôt) · Dehors 8. La salubrité se compte pour toute la cité : le seuil suit la population entière.');
  assert.equal(JSON.stringify({...g.serialize(),timestamp:0}),before,'lecture seule');assert.equal(state(g).exposure,exposure);
  assert.throws(()=>{view.districts[0].bodies=0;},TypeError,'relevé figé');
  // Une ancienne campagne ne lit rien.
  const old=JSON.parse(JSON.stringify(g.serialize()));delete old.expansions127.modules.corpseChain217;assert.equal(g.restoreSave(old),true);
  assert.deepEqual(g.corpseChain217.byDistrict(),{districts:[],moat:0});
});

test('filière des corps : la fosse qui prend les derniers corps pendant que le bûcher brûle l’éteint, l’état reste valide',()=>{
  const g=withState(outpost(),{pending:1.6,pyre:'wood',pitOpen:true});
  g.resources.wood=Math.max(g.resources.wood||0,100);
  const notes=watch(g);g.corpseChain217.tick(1);
  const s=state(g);assert.equal(s.pending,0);assert.equal(s.pyre,null);
  assert.ok(K.validate(s),'état sauvegardable');assert.ok(g.serialize());
  assert.ok(mine(notes).some(t=>/^Bûcher éteint/.test(t)));
});

test('filière des corps : pendant l’assaut et la sécurisation, la maladie ne compte qu’une part de la charge des murs ; au calme, toute',()=>{
  assert.ok(S.siegeWalls>0&&S.siegeWalls<1,'une part, jamais rien ni tout');
  const g=outpost(),A=g.corpseChain217,{wall}=wallWithWorker(g),cap=A.threshold();
  // Assez de corps au pied du mur pour rendre malade au calme, pas assez pour leur part pendant l'assaut.
  const load=Math.ceil(cap/S.siegeWalls*S.clearRatio)-2;assert.ok(load>=cap&&load*S.siegeWalls<cap*S.clearRatio);
  wall.corpseLoad=load;
  run(g,10);assert.equal(state(g).exposure,10,'au calme, toute la charge compte');near(A.counted(),A.left());
  for(const phase of ['assault','aftermath']){
    g.phase=phase;near(A.left(),load,'les corps laissés restent tous affichés');near(A.counted(),load*S.siegeWalls,phase);
    assert.match(row(g,'Corps laissés'),new RegExp('pendant l’assaut, la maladie n’en compte que '+Math.ceil(load*S.siegeWalls-1e-9)+' : les corps au pied des murs pour '+Math.round(S.siegeWalls*100)+' %'));
  }
  g.phase='assault';run(g,30);assert.equal(state(g).exposure,0,'les corps frais d’un mur assiégé ne rendent pas malade');assert.equal(A.stage(),0);
  // La charge mécanique du mur n'est pas touchée : rampes et brèches lisent toujours toute la charge.
  assert.equal(wall.corpseLoad,load);
  g.phase='warning';near(A.counted(),load,'l’alerte précède l’assaut : la charge restée compte en entier');
  calm(g);assert.doesNotMatch(row(g,'Corps laissés'),/pendant l’assaut/);run(g,10);assert.equal(state(g).exposure,10,'non déblayés, les corps comptent de nouveau au calme');
  // Les corps à traiter comptent toujours en entier : une cité qui ne brûle ni n'ensevelit reste punie pendant l'assaut.
  wall.corpseLoad=0;const h=withState(g,{pending:cap+5});h.phase='assault';run(h,S.graceSeconds);
  near(h.corpseChain217.counted(),cap+5);assert.equal(h.corpseChain217.stage(),2);
});

test('filière des corps : la part des murs pendant l’assaut ne change ni la sauvegarde, ni les anciennes campagnes',()=>{
  const g=outpost(),{wall}=wallWithWorker(g),cap=g.corpseChain217.threshold();wall.corpseLoad=cap*3;
  g.phase='assault';g.corpseChain217.tick(5);
  const data=JSON.parse(JSON.stringify(g.serialize())),mod=data.expansions127.modules.corpseChain217;
  assert.deepEqual(Object.keys(mod),Object.keys(none()),'aucune clé ajoutée à l’état sauvegardé');assert.equal(mod.version,1);
  assert.equal(data.phase,'assault','la phase qui règle la part est celle que le moteur sauvegarde déjà');
  // Reprise pendant l'assaut : même compte, aucune horloge propre à rejouer.
  assert.equal(g.restoreSave(JSON.parse(JSON.stringify(data))),true);const A=g.corpseChain217;
  assert.equal(g.phase,'assault');near(A.counted(),cap*3*S.siegeWalls);near(A.left(),cap*3);assert.deepEqual(state(g),mod);
  // Ancienne campagne (sans filière) : inactive, rien n'est compté ni annoncé, même mur chargé pendant l'assaut.
  const old=JSON.parse(JSON.stringify(data));delete old.expansions127.modules.corpseChain217;assert.equal(g.restoreSave(old),true);
  const B=g.corpseChain217,notes=watch(g);assert.equal(B.active(),false);g.phase='assault';run(g,S.graceSeconds+10);calm(g);run(g,S.graceSeconds+10);
  assert.equal(B.stage(),0);assert.deepEqual(state(g),none());assert.equal(mine(notes).length,0);
});
