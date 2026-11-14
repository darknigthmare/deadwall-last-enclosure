'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),M=require('../src/remarkable217.js'),W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const R=C.Remarkable217Rules,root=path.join(__dirname,'..'),OPT={detailVersion:1,ecologyVersion:1,hydrologyVersion:1};
const copy=v=>JSON.parse(JSON.stringify(v));

function campaign(seed='17117'){const {g,doc}=bootDocument134();g.startNew('standard',seed);g.campaignIntro132?.skip?.();return{g,doc};}
const saved=g=>g.serialize().expansions127.modules.remarkable217;
function old(g){const data=copy(g.serialize());delete data.expansions127.modules.remarkable217;assert.equal(g.restoreSave(data),true);return g;}
const site=(g,id)=>g.frontier.world().pois.find(p=>p.id===id);
// Place le commandant en sortie, à pied, devant la façade du lieu, par une sauvegarde validée.
function enterAt(g,p){
  const base=JSON.stringify(g.serialize());
  for(const d of [3,5,8,12,20,30])for(const t of [.5,.2,.8]){
    const data=JSON.parse(base),q=G.global(p,p.w*t,p.h+d);
    Object.assign(data.frontier,{active:true,anchor:{x:data.player.x,y:data.player.y},x:q.x,y:q.y});
    try{if(g.restoreSave(data)!==false)return true;}catch(error){/* point refusé : essai suivant */}
  }
  return false;
}
const step=(g,n=6)=>{for(let i=0;i<n;i++)g.update(.05);};
const at=(g,id)=>g.frontier.contacts().filter(e=>e.poi===id);
const kill=(g,v)=>{for(let i=0;i<v.nest;i++)assert.equal(g.frontier.hitEnemy(v.id+':e'+i,1e6),true,v.id+':e'+i);};
// Premier lieu remarquable de plain-pied : tout son nid est au rez-de-chaussée.
const groundSite=g=>g.remarkable217.list().find(v=>{const p=site(g,v.id);return(p.legacyLevels160||p.levels).every(z=>z===0);});

test('lieux remarquables 217 : règles gelées dans le cœur, état validé strictement',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.kinds));
  assert.deepEqual({...R,kinds:null},{cantonSize:4096,perCanton:2,spacing:1000,minArea:400,maxGeneration:8,nestMin:10,nestMax:16,sight:2500,claimReach:12,kinds:null});
  assert.ok(R.nestMin>4,'un nid dépasse nettement les un à quatre occupants ordinaires');
  assert.ok(R.nestMax<W.RULES.maxEnemy,'un nid tient sous le plafond de contacts vivants');
  assert.deepEqual(M.KINDS,['water','hospital','barracks','fuel','silo','station','dam','transmitter','power']);
  for(const id of M.KINDS){
    const k=R.kinds[id];assert.ok(Object.isFrozen(k)&&Object.isFrozen(k.reward),id);
    assert.ok(['tower','chimney','pylon'].includes(k.silhouette),id);
    assert.ok(['fuel','ammo','medicine'].includes(k.reward.resource),id+' : ressource rare existante');
    assert.ok(k.reward.amount>0&&k.reward.amount<=36,id+' : lot borné, au plus un sac');
  }
  const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
  assert.ok(core.indexOf('C.GreatWorks217Rules=')<core.indexOf('C.Remarkable217Rules=')&&core.indexOf('C.Remarkable217Rules=')<core.indexOf('C.Weather193Rules='));
  assert.deepEqual(M.validate(undefined),{version:1,active:false,objective:null,sighted:[],cleared:[],taken:{}});
  assert.deepEqual(M.fresh(),{version:1,active:true,objective:null,sighted:[],cleared:[],taken:{}});
  const ok={version:1,active:true,objective:'P0002',sighted:['P0001','P0002'],cleared:['P0001'],taken:{P0001:12.5}};
  assert.deepEqual(M.validate(ok),ok);assert.notEqual(M.validate(ok),ok);
  const bad=patch=>({...copy(ok),...patch});
  for(const raw of [null,[],'217',{},{version:1,active:true},bad({version:2}),bad({active:1}),bad({extra:1}),bad({objective:'P0003'}),bad({objective:7}),bad({sighted:['P0002','P0001']}),
    bad({sighted:['P0001','P0001','P0002']}),bad({sighted:['P0001','P2']}),bad({cleared:['P0009']}),bad({taken:{P0002:3}}),bad({taken:{P0001:0}}),bad({taken:{P0001:37}}),bad({taken:{P0001:'3'}}),bad({taken:[]}),
    {version:1,active:false,objective:null,sighted:['P0001'],cleared:[],taken:{}}])assert.throws(()=>M.validate(raw),/Lieux remarquables 217/);
  // Un nid déclaré vidé doit l'être dans le registre régional de la même sauvegarde.
  const dead=Object.fromEntries(Array.from({length:R.nestMin},(_,i)=>['P0001:e'+i,0]));
  assert.deepEqual(M.validate(ok,{frontier:{enemies:dead}}),ok);
  assert.throws(()=>M.validate(ok,{frontier:{enemies:{...dead,'P0001:e0':12}}}),/Lieux remarquables 217/);
  assert.throws(()=>M.validate(ok,{frontier:{enemies:{}}}),/Lieux remarquables 217/);
});

test('sélection pure : même graine, mêmes lieux ; aucun lieu créé, déplacé, renommé ni modifié',()=>{
  const a=W.create(17117,8,OPT),before=JSON.stringify(a.pois),keys=Object.keys(a).join();
  const list=M.select(a);
  assert.equal(JSON.stringify(a.pois),before,'le monde n’est pas touché');assert.equal(Object.keys(a).join(),keys);
  assert.equal(M.select(a),list,'résultat gardé par monde');assert.ok(Object.isFrozen(list)&&list.every(Object.isFrozen));
  const b=W.create(17117,8,OPT);assert.notEqual(a,b);assert.deepEqual(M.select(b),list,'même graine, monde reconstruit : mêmes lieux');
  assert.notDeepEqual(M.select(W.create(42,8,OPT)).map(e=>e.id),list.map(e=>e.id));
  assert.ok(list.length>=20&&list.length<=R.perCanton*Math.ceil(a.size/R.cantonSize)**2,'quelques-uns par canton : '+list.length);
  const by=new Map(a.pois.map(p=>[p.id,p])),cantons=new Map();
  for(const e of list){
    const p=by.get(e.id);assert.ok(p,'lieu déjà généré');
    assert.deepEqual([e.name,e.x,e.y],[p.name,p.x,p.y],'nom et position d’origine');
    assert.equal(M.kindOf(p),e.kind);assert.ok(R.kinds[e.kind]);assert.notEqual(p.occupation,'allied');assert.ok(p.w*p.h>=R.minArea);assert.ok(p.generation<=R.maxGeneration);
    assert.ok(e.nest>=R.nestMin&&e.nest<=R.nestMax);assert.equal(e.reward,R.kinds[e.kind].reward);
    assert.equal(M.extra(a,p),e.nest-a.threatCount(p));
    const key=Math.floor(p.x/R.cantonSize)+':'+Math.floor(p.y/R.cantonSize);cantons.set(key,(cantons.get(key)||0)+1);
  }
  assert.ok([...cantons.values()].every(n=>n<=R.perCanton));
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++)assert.ok(Math.hypot(list[i].x-list[j].x,list[i].y-list[j].y)>=R.spacing,'espacés');
  const chosen=new Set(list.map(e=>e.id));
  for(const p of a.pois)if(!chosen.has(p.id))assert.equal(M.extra(a,p),0,'lieu ordinaire : aucun infecté ajouté');
  // Une maison, un relais allié, un lieu trop petit ou ajouté par une extension de monde ne sont jamais promus.
  const model={id:'P0001',name:'Hôpital général · Les Granges',w:30,h:20,occupation:'infected',generation:8};
  assert.equal(M.kindOf(model),'hospital');assert.equal(M.kindOf({...model,occupation:'allied'}),null);assert.equal(M.kindOf({...model,w:10}),null);
  assert.equal(M.kindOf({...model,generation:9}),null);assert.equal(M.kindOf({...model,name:'Petite maison ouvrière · Les Granges 1'}),null);
  assert.equal(M.kindOf({...model,name:'Caserne de pompiers · Saint-Orme'}),null);assert.equal(M.kindOf({...model,name:'Cuisine centrale · Saint-Orme'}),null);
  assert.equal(M.kindOf({...model,name:'Boucherie — Station-service et aire routière / reprise'}),null,'le contexte après le titre ne compte pas');
  // Les extensions de monde ajoutent des lieux sans changer la sélection : un nid entamé reste valide après migration.
  assert.deepEqual(M.select(W.create(17117,11,OPT)),list);
});

test('nouvelle campagne : module actif, inscrit partout, contrat de list() et nearest()',()=>{
  const {g}=campaign();
  assert.equal(g.remarkable217.active(),true);assert.deepEqual(saved(g).active,true);
  const before=JSON.stringify(g.frontier.world().pois),list=g.remarkable217.list();
  assert.equal(list.length,M.select(g.frontier.world()).length);assert.ok(list.length>=20);
  for(const v of list){
    for(const key of ['id','name','kind','x','y','distance','state'])assert.ok(key in v,key);
    assert.equal(v.state,'nest');assert.ok(M.KINDS.includes(v.kind));assert.ok(Number.isFinite(v.distance)&&v.distance>=0);
    assert.equal(v.name,site(g,v.id).name);
  }
  assert.deepEqual(list.map(v=>v.distance),list.map(v=>v.distance).sort((a,b)=>a-b),'du plus proche au plus lointain');
  assert.deepEqual(g.remarkable217.nearest(),list[0]);
  assert.equal(JSON.stringify(g.frontier.world().pois),before,'lire la liste ne modifie aucun lieu');
  // Relevé : les lieux à portée de vue de la cité sont repérés, en silence au premier relevé.
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
  g.remarkable217.tick();
  const seen=saved(g).sighted;assert.deepEqual(seen,list.filter(v=>v.distance<=R.sight).map(v=>v.id).sort());assert.ok(seen.length>=1,'graine 17117 : un repère en vue de la cité');
  assert.equal(notes.filter(t=>t.includes('epère')).length,0);
  const view=g.remarkable217.overview();
  assert.match(view.summary,/nid de 10 à 16 infectés immobiles/);assert.match(view.summary,/une seule fois/);
  assert.match(view.rows.find(r=>r.label==='Lieux en vue').value,new RegExp('^'+seen.length+' sur '+list.length+' '));
  const first=list[0],row=view.rows.find(r=>r.value.startsWith(first.name));
  assert.match(row.value,new RegExp('nid de '+first.nest+' infectés'));assert.match(row.value,new RegExp('lot annoncé : '+first.reward.amount+' '),'la récompense est annoncée avant la sortie');
  const ui=fs.readFileSync(path.join(root,'src/expansion-ui.js'),'utf8');
  for(const table of ['ORDER','GROUPS','API_NAMES','LABELS'])assert.ok(ui.split('\n').find(l=>l.includes(table+' ')||l.includes(table+'=')).includes('remarkable217'),table);
  assert.ok(fs.readFileSync(path.join(root,'src/expansion-kit.js'),'utf8').includes("'remarkable217'"));
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('"src/remarkable217.js"'));
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),tag=html.indexOf('<script src="src/remarkable217.js"></script>');
  assert.ok(tag>html.indexOf('src/expansion-kit.js')&&tag>html.indexOf('src/frontier.js"')&&tag>html.indexOf('src/atlas-render.js'),'chargé après le registre, la région et l’atlas');
  assert.equal(g.expansions.get('remarkable217').title,'Lieux remarquables');
});

test('objectif de sortie : un seul à la fois, lieu en vue seulement, cap et distance affichés',()=>{
  const {g}=campaign();g.remarkable217.tick();
  const list=g.remarkable217.list(),seen=list.filter(v=>v.sighted),hidden=list.find(v=>!v.sighted);
  assert.equal(g.remarkable217.objective(),null);
  assert.equal(g.remarkable217.designate(hidden.id).ok,false,'un lieu hors de vue ne se désigne pas');assert.equal(g.remarkable217.designate('P9999').ok,false);
  assert.deepEqual(g.remarkable217.designate(seen[0].id),{ok:true});
  let target=g.remarkable217.objective();
  assert.equal(target.id,seen[0].id);assert.equal(target.objective,true);assert.match(target.bearing,/^(N|NE|E|SE|S|SO|O|NO)$/);
  assert.match(g.remarkable217.hudText(),/^Objectif : .+ · cap (N|NE|E|SE|S|SO|O|NO) · \d+(,\d km| m) · nid de \d+$/);
  assert.equal(g.remarkable217.designate(seen[0].id).ok,false,'déjà désigné');
  assert.equal(g.remarkable217.list().filter(v=>v.objective).length,1);
  if(seen[1]){assert.deepEqual(g.remarkable217.designate(seen[1].id),{ok:true});assert.equal(g.remarkable217.list().filter(v=>v.objective).length,1);assert.equal(saved(g).objective,seen[1].id);}
  const actions=g.remarkable217.actions();
  assert.ok(actions.some(a=>a.id==='abandon'));assert.ok(actions.every(a=>typeof a.run==='function'&&typeof a.label==='string'));
  assert.ok(!actions.some(a=>a.id==='designate-'+hidden.id));
  // Sauvegarde et reprise : l'objectif est conservé.
  const data=copy(g.serialize());assert.equal(g.restoreSave(data),true);assert.equal(g.remarkable217.objective().id,data.expansions127.modules.remarkable217.objective);
  assert.deepEqual(g.remarkable217.abandon(),{ok:true});assert.equal(g.remarkable217.objective(),null);assert.equal(g.remarkable217.abandon().ok,false);
});

test('nid : nombre nettement plus grand, mêmes infectés, immobiles ; vidé, il ouvre un lot unique',()=>{
  const {g}=campaign();
  const v=groundSite(g),p=site(g,v.id),w=g.frontier.world(),ordinary=w.threatCount(p);
  assert.ok(ordinary<=4&&v.nest>=R.nestMin);
  assert.equal(g.remarkable217.claimQuote(v.id).ok,false,'pas de lot depuis la cité');
  assert.ok(enterAt(g,p),'entrée devant le lieu');
  step(g,2);
  const nest=at(g,v.id);
  assert.equal(nest.length,v.nest,'tout le nid est présent');
  assert.deepEqual(nest.map(e=>e.id).sort(),Array.from({length:v.nest},(_,i)=>v.id+':e'+i).sort(),'identifiants d’occupants ordinaires');
  // Pression par le nombre : chaque infecté garde le profil de biome d'un occupant ordinaire.
  const B=w.biomes||globalThis.DeadwallBiomes135;
  for(const e of nest){const profile=B.enemyProfile(w.seed,p.x,p.y,e.id,{generation:8});assert.equal(e.maxHealth,profile.health);assert.equal(e.hp,profile.health);assert.equal(e.kind,profile.kind);}
  assert.ok(nest.filter(e=>e.mode==='idle').length>=v.nest/2,'le nid stagne tant qu’on ne le dérange pas');
  // Un lieu ordinaire voisin garde ses un à quatre occupants.
  for(const q of w.nearPOI(p.x,p.y,130))if(q.id!==v.id)assert.ok(at(g,q.id).length<=w.threatCount(q)&&w.threatCount(q)<=4);
  assert.equal(g.remarkable217.list().find(x=>x.id===v.id).state,'nest');
  assert.match(g.remarkable217.claimQuote(v.id).reason,/nid n’est pas vidé/);
  // Vider tout sauf un : toujours un nid.
  for(let i=1;i<v.nest;i++)assert.equal(g.frontier.hitEnemy(v.id+':e'+i,1e6),true);
  step(g,12);assert.equal(g.remarkable217.list().find(x=>x.id===v.id).state,'nest');assert.equal(g.remarkable217.claim(v.id).ok,false);
  const notes=[],notify=g.notify.bind(g);g.notify=(text,tone)=>{notes.push(String(text));return notify(text,tone);};
  assert.equal(g.frontier.hitEnemy(v.id+':e0',1e6),true);step(g,12);
  assert.equal(g.remarkable217.list().find(x=>x.id===v.id).state,'cleared');
  assert.equal(notes.filter(t=>t.startsWith('Nid vidé : ')).length,1);step(g,12);assert.equal(notes.filter(t=>t.startsWith('Nid vidé : ')).length,1,'annoncé une fois');
  assert.deepEqual(saved(g).cleared,[v.id]);
  // Lot : exactement l'annonce, dans le sac, borné par la place disponible, une seule fois.
  const res=v.reward.resource,amount=v.reward.amount,cap=g.player.carryCapacity;
  for(const k of Object.keys(g.player.carry))g.player.carry[k]=0;
  g.player.carry.wood=cap-10;
  let got=g.remarkable217.claim(v.id);
  assert.deepEqual(got,{ok:true,amount:10,resource:res});assert.equal(g.player.carry[res],10);assert.equal(g.remarkable217.list().find(x=>x.id===v.id).state,'cleared');
  assert.match(g.remarkable217.claim(v.id).reason,/Sac plein/);assert.equal(g.player.carry[res],10);
  g.player.carry.wood=0;
  got=g.remarkable217.claim(v.id);assert.deepEqual(got,{ok:true,amount:amount-10,resource:res});
  assert.equal(g.player.carry[res],amount,'le lot annoncé, pas plus');assert.ok(C.bagTotal(g.player.carry)<=cap);
  assert.equal(g.remarkable217.list().find(x=>x.id===v.id).state,'rewarded');
  assert.match(g.remarkable217.claim(v.id).reason,/déjà été emporté/);assert.equal(g.player.carry[res],amount);
  assert.equal(g.remarkable217.designate(v.id).ok,false,'un lieu récompensé n’est plus un objectif');
  // Sauvegarde et reprise : nid vidé et lot emporté sont conservés ; rien ne revient.
  const data=copy(g.serialize());
  assert.deepEqual(data.expansions127.modules.remarkable217,{version:1,active:true,objective:null,sighted:data.expansions127.modules.remarkable217.sighted,cleared:[v.id],taken:{[v.id]:amount}});
  assert.equal(data.frontier.kills,v.nest);assert.ok(Object.keys(data.frontier.enemies).some(id=>Number(id.split(':e')[1])>=ordinary),'le registre régional porte les infectés du nid');
  assert.equal(g.restoreSave(copy(data)),true);
  assert.equal(g.remarkable217.list().find(x=>x.id===v.id).state,'rewarded');assert.equal(g.remarkable217.claim(v.id).ok,false);
  step(g,6);assert.equal(at(g,v.id).length,0,'le nid vidé ne se repeuple pas');
  // Une sauvegarde qui déclare le nid vidé sans les morts du registre est refusée en entier.
  const forged=copy(data);for(let i=0;i<=v.nest-R.nestMin;i++){delete forged.frontier.enemies[v.id+':e'+i];forged.frontier.kills--;}
  assert.throws(()=>g.restoreSave(forged),/Lieux remarquables 217/);
  // La même sauvegarde sans le module (ancienne campagne) ne peut pas porter d'infectés de nid.
  const stripped=copy(data);delete stripped.expansions127.modules.remarkable217;
  assert.throws(()=>g.restoreSave(stripped),/Menace régionale inexistante/);
});

test('ancienne campagne : inactive, monde identique, occupants ordinaires, aucun repère',()=>{
  const {g}=campaign();
  const v=groundSite(g),p=site(g,v.id),before=JSON.stringify(g.frontier.world().pois),ordinary=g.frontier.world().threatCount(p);
  old(g);
  assert.equal(g.remarkable217.active(),false);assert.deepEqual(saved(g),{version:1,active:false,objective:null,sighted:[],cleared:[],taken:{}});
  assert.deepEqual(g.remarkable217.list(),[]);assert.equal(g.remarkable217.nearest(),null);assert.equal(g.remarkable217.objective(),null);
  assert.deepEqual(g.remarkable217.actions(),[]);assert.equal(g.remarkable217.hudText(),'');
  assert.equal(g.remarkable217.designate(v.id).ok,false);assert.equal(g.remarkable217.claim(v.id).ok,false);
  assert.equal(g.remarkable217.nestExtra(g.frontier.world(),p),0);
  assert.match(g.remarkable217.overview().summary,/commencé avant cette règle/);
  g.remarkable217.tick();step(g,12);assert.deepEqual(saved(g).sighted,[]);
  assert.equal(JSON.stringify(g.frontier.world().pois),before,'monde identique');
  // Sur place : le lieu garde ses occupants ordinaires, un à quatre au plus.
  assert.ok(enterAt(g,p));step(g,2);
  assert.equal(g.remarkable217.active(),false,'la reprise ne réactive rien');
  assert.equal(at(g,v.id).length,ordinary);assert.ok(ordinary<=4);
  assert.equal(JSON.stringify(g.frontier.world().pois),before);
  // Une nouvelle campagne lancée ensuite est de nouveau active.
  g.startNew('standard','17117');g.campaignIntro132?.skip?.();assert.equal(g.remarkable217.active(),true);
});

test('présentation : silhouettes sur un contexte factice, sans stock ni tirage ni écriture d’état',()=>{
  const {g}=campaign();g.remarkable217.tick();
  const calls=[],ctx=new Proxy({measureText:t=>({width:String(t).length*7})},{get:(t,k)=>k in t?t[k]:typeof k==='symbol'?undefined:(...a)=>{calls.push(k);},set:(t,k,v)=>{t[k]=v;return true;}});
  for(const shape of ['tower','chimney','pylon'])M.silhouette(ctx,shape,10,10,30,'#fff');
  assert.ok(calls.includes('stroke')&&calls.includes('fill'));
  const pure=()=>{const d=g.serialize();return JSON.stringify([d.expansions127,d.frontier,d.resources,g.player.carry]);},state=pure(),random=Math.random;let draws=0;Math.random=()=>{draws++;return random();};
  try{
    calls.length=0;g.remarkable217.drawAtlas(ctx,{screen:(x,y)=>({x:x/100,y:y/100}),width:400,height:400,scale:.2});
    assert.ok(calls.includes('fillText'),'nom et distance écrits sur l’atlas');
    g.remarkable217.drawRegion();g.remarkable217.hudText();g.remarkable217.overview();g.remarkable217.actions();g.remarkable217.list();
  }finally{Math.random=random;}
  assert.equal(draws,0,'aucun tirage');assert.equal(pure(),state,'aucune écriture');
});
