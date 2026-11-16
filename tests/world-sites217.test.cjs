'use strict';
// Lieux complets et obstacles régionaux du monde G12 hors jeu (specs/monde-sans-bord/ouverture.md, tranche O2).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../src/core.js'),K=require('../src/world-cantons217.js'),Gen=require('../src/world-canton-gen217.js'),O=require('../src/world-open217.js');
const S=require('../src/world-sites217.js'),F=require('../src/frontier-geometry.js'),X=require('../src/codex3000-runtime.js'),Sp=require('../src/world-spawns131.js'),Wd=require('../src/frontier-world.js');
const ROOT=path.resolve(__dirname,'..'),R=C.WorldSites217Rules,read=file=>fs.readFileSync(path.join(ROOT,file),'utf8'),CELL=Gen.CELL,N=Gen.CELLS;
const SEEDS=[0,1,42,17117,84329,967313470,1947648717,4294967295];
const far=(dx,dy)=>Math.sqrt(dx*dx+dy*dy);
const DEFS=Object.fromEntries([...C.BiomeRules135.defs,...C.EcologyRules164.defs].map(d=>[d.id,d]));
const lotBox=p=>({x:-R.lot.side,y:-R.lot.front,w:p.w+2*R.lot.side,h:p.h+R.lot.front+R.lot.back});
const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};};
// Arêtes possédées par un canton (maille ouest ou nord dans le canton) : chacune comptée une fois.
const ownedEdges=(w,cx,cy)=>{const b=K.bounds(cx,cy);return w.edgesIn(b.x,b.y,b.x+b.w,b.y+b.h).filter(e=>Math.floor(e.gx/N)===cx&&Math.floor(e.gy/N)===cy);};
// Lecture indépendante du canton : palier d'une maille monde et bit de passage de l'arête qu'elle possède.
const levelOf=(seed,gx,gy)=>Gen.levelAt(seed,(gx+.5)*CELL,(gy+.5)*CELL);
const passOf=(w,gx,gy,dir)=>{const cx=Math.floor(gx/N),cy=Math.floor(gy/N),c=w.canton(cx,cy);return c.passes[(gy-cy*N)*N+gx-cx*N]>>dir&1;};

test('lieux 217 : règles gelées, accesseurs de la région finie présents, monde d’O1 conservé',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.lot)&&Object.isFrozen(R.trees)&&Object.isFrozen(S)&&S.RULES===R);
  assert.equal((read('src/core.js').match(/WorldSites217Rules=/g)||[]).length,1);
  assert.ok(read('src/core.js').indexOf('C.WorldSites217Rules=')>read('src/core.js').indexOf('C.WorldOpen217Rules='));
  assert.ok(R.lot.front>R.prohibited.front-1e-9&&R.setback>R.lot.front,'le lot ne touche pas la chaussée');
  const w=S.create(17117),o=O.create(17117);
  for(const name of Object.keys(o))if(typeof o[name]==='function')assert.equal(typeof w[name],'function',name);
  for(const name of ['site','sitesNear','nearPOI','plan','detailAt','chunk','around','blocked','line','vehicleClear','opticalBlocked','movementLine','threatCount','occupants','connectionFor','drive','lineOfSight','levelAt'])assert.equal(typeof w[name],'function',name);
  assert.equal(w.generation,12);assert.equal(w.unbounded,true);assert.ok(Object.isFrozen(w));
  for(const name of ['roads','pois','size','bounds'])assert.equal(w[name],undefined,name);
  assert.deepEqual(w.home,o.home);
  // Le monde d'O1 rend toujours les candidats bruts ; `candidate` y donne accès depuis O2.
  const c=w.canton(0,0);for(const s of c.sites)assert.deepEqual(w.candidate(s.id),s);
});

test('lieux 217 : chaque lieu a emprise, genre, programme du codex, plan, accès et occupants, comme un lieu G8+',()=>{
  let total=0,codex=0,candidates=0;const types=new Set();
  for(const seed of [17117,84329,42]){
    const w=S.create(seed);
    for(let cy=-1;cy<=1;cy++)for(let cx=-1;cx<=1;cx++){
      const c=w.canton(cx,cy),places=w.placesOf(cx,cy);candidates+=c.sites.length;
      for(const p of places){
        total++;types.add(p.type);const s=c.sites.find(q=>q.id===p.id),def=DEFS[s.biome];
        assert.ok(s,'un lieu vient d’un candidat de son canton');assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.reserve)&&Object.isFrozen(p.drive));
        assert.equal(p.canton,c.id);assert.equal(p.level,s.level);assert.equal(p.biome,s.biome);assert.equal(p.road,s.road);assert.equal(p.generation,12);
        assert.ok(p.w>0&&p.h>0&&Number.isFinite(p.a)&&p.levels.includes(0));
        // Le bâtiment fait face à sa route : l'entrée est du côté de la route.
        const road=c.roads.find(r=>r.id===p.road),entry=F.global(p,p.w/2,-1),back=F.global(p,p.w/2,p.h+1);
        const d=q=>Math.min(...road.points.slice(1).map((b,k)=>{const a=road.points[k],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/(dx*dx+dy*dy)));return far(q.x-a.x-dx*t,q.y-a.y-dy*t);}));
        assert.ok(d(entry)<d(back),p.id+' tourné vers sa route');
        // Genre tiré du milieu (ou repli), programme du codex compatible avec ce milieu.
        if(p.programme3000){codex++;const card=X.get(p.programme3000);assert.ok(card&&X.enabled(card,{biome:p.biome,biomeAliases:p.biomeAliases,townKind:p.townKind||undefined}));assert.equal(p.type,'codex3000-'+p.programme3000.slice(3));assert.equal(p.codex,p.programme3000);
          const pl=w.plan(p,0);assert.equal(pl.style,'codex3000');assert.equal(pl.programme,p.programme3000);}
        else{assert.ok(Object.hasOwn(def.buildings,p.type)||R.fallback.includes(p.type),p.type+' dans '+def.id);assert.deepEqual(w.plan(p,0),F.plan(p,0));}
        for(const z of p.levels){const pl=w.plan(p,z);assert.ok(pl.walls.length>0&&Array.isArray(pl.objects),p.id+' étage '+z);}
        assert.throws(()=>w.plan(p,7),/Étage absent/);
        // Accès : allée de frontage174 raccordée à la route du lieu.
        const join=w.connectionFor(p);assert.ok(join&&join.width===R.drive.width);assert.deepEqual(w.drive(p),p.drive);
        // Occupation et nombre d'occupants : mêmes tirages que les lieux de la région finie.
        const roll=Sp.roll({seed,id:p.id,biome:def.spawnBiome,distance:far(s.x-w.home.x,s.y-w.home.y)});
        assert.equal(p.occupation,roll.kind);assert.equal(p.distanceBand,roll.band);
        assert.equal(w.threatCount(p),Wd.threatCount(seed,p),'même nombre d’occupants que frontier-world');
        const occ=w.occupants(p);assert.equal(occ.length,w.threatCount(p));
        occ.forEach((e,n)=>{assert.equal(e.id,p.id+':e'+n);assert.ok(K.ENTITY_ID.test(p.id)&&/^K-?\d+_-?\d+:site:\d+:e\d+$/.test(e.id));assert.equal(e.z,p.levels[F.hash(p.id,n)%p.levels.length]);assert.ok(Object.hasOwn(def.enemies,e.kind)&&e.health>0);});
        assert.ok(w.sitesNear(p.x,p.y,1).includes(p));assert.equal(w.site(p.id),p);
      }
    }
  }
  // Richesse : au moins une quinzaine de genres, une part notable de programmes natifs du codex.
  assert.ok(total>=60,total+' lieux');assert.ok(types.size>=15,types.size+' genres');assert.ok(codex/total>=.25,codex+'/'+total+' programmes du codex');
  assert.ok(total/candidates>=.35,total+' lieux pour '+candidates+' candidats');
});

test('lieux 217 : aucune parcelle sur une falaise, dans l’eau, sur une route, ni à cheval sur une couture',()=>{
  let checked=0;
  for(const seed of [0,17117,1947648717,4294967295]){
    const w=S.create(seed);
    for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++){
      const c=w.canton(cx,cy),b=c.bounds;
      for(const p of w.placesOf(cx,cy)){
        checked++;const L=lotBox(p),body={...F.global(p,L.x+L.w/2,L.y+L.h/2),w:L.w,h:L.h,a:p.a},box=F.bounds(body);
        assert.deepEqual(p.reserve,box);
        assert.ok(box.l>=b.x+R.seamMargin&&box.t>=b.y+R.seamMargin&&box.r<=b.x+b.w-R.seamMargin&&box.b<=b.y+b.h-R.seamMargin,p.id+' à cheval sur une couture');
        // Lu indépendamment dans le champ de relief : toute maille touchée par le lot est au palier du lieu.
        for(let gy=Math.floor(box.t/CELL);gy<=Math.floor(box.b/CELL);gy++)for(let gx=Math.floor(box.l/CELL);gx<=Math.floor(box.r/CELL);gx++)
          if(F.obb(body,{x:(gx+.5)*CELL,y:(gy+.5)*CELL,w:CELL,h:CELL,a:0})){assert.equal(levelOf(seed,gx,gy),p.level,p.id+' sur deux paliers');const i=(gy-cy*N)*N+gx-cx*N;assert.equal(c.water[i],0,p.id+' dans l’eau');}
        assert.ok(!w.edgesIn(box.l,box.t,box.r,box.b).some(e=>F.segmentRect(F.local(p,e.a.x,e.a.y),F.local(p,e.b.x,e.b.y),L)),p.id+' coupé par une arête de palier');
        for(const r of c.roads)for(let k=1;k<r.points.length;k++){const pad=r.width/2,q={x:L.x+2-pad,y:L.y+2-pad,w:L.w-4+2*pad,h:L.h-4+2*pad};assert.ok(!F.segmentRect(F.local(p,r.points[k-1].x,r.points[k-1].y),F.local(p,r.points[k].x,r.points[k].y),q),p.id+' sur la route '+r.id);}
        // Tout ce que le lieu pose dehors reste dans son lot.
        for(const o of [...p.outdoor,...w.plan(p,0).walls])assert.ok(o.x>=L.x&&o.y>=L.y&&o.x+o.w<=L.x+L.w&&o.y+o.h<=L.y+L.h,p.id+' '+o.id);
        for(const v of p.parking){const q=F.local(p,v.x,v.y);assert.ok(q.x>L.x&&q.y>L.y&&q.x<L.x+L.w&&q.y<L.y+L.h,v.id);}
        // L'allée reste sur le palier du lieu, au sec.
        for(let t=0;t<=1;t+=.05){const x=p.drive.a.x+(p.drive.b.x-p.drive.a.x)*t,y=p.drive.a.y+(p.drive.b.y-p.drive.a.y)*t;assert.equal(Gen.levelAt(seed,x,y),p.level,p.id+' allée');}
        for(const q of w.placesOf(cx,cy))if(q!==p)assert.ok(!F.overlap(p.reserve,q.reserve),p.id+' / '+q.id);
        if(c.id===w.home.canton)assert.ok(!F.overlap(box,{l:w.home.minX,r:w.home.maxX,t:w.home.minY,b:w.home.maxY}),'site de fondation libre');
      }
    }
  }
  assert.ok(checked>=250,checked+' lieux vérifiés');
});

test('lieux 217 : plan, détails et occupants identiques quel que soit l’ordre de chargement et le cache',()=>{
  const seed=967313470,ids=[];const ref=S.create(seed);
  for(const[cx,cy]of [[0,0],[3,-2],[-4,1]])for(const p of ref.placesOf(cx,cy))ids.push(p.id);
  assert.ok(ids.length>=6);
  const print=(w,id)=>{const p=w.site(id);return JSON.stringify([p,p.levels.map(z=>w.plan(p,z)),w.occupants(p),w.threatCount(p)]);};
  const want=Object.fromEntries(ids.map(id=>[id,print(ref,id)]));
  const sample=ids.filter((_,i)=>i%4===0);for(const id of sample)want[id+'#d']=JSON.stringify(ref.detailAt(ref.site(id),0));
  for(const order of [[...ids].reverse(),ids.filter((_,i)=>i%2).concat(ids.filter((_,i)=>!(i%2)))]){
    const w=S.create(seed,{open:{cache:{capacity:25}}});w.sitesNear(9000,-9000,800);w.chunk(-40,40);
    for(const id of order){assert.equal(print(w,id),want[id],id);if(want[id+'#d'])assert.equal(JSON.stringify(w.detailAt(w.site(id),0)),want[id+'#d']);}
  }
  // Un candidat refusé reste refusé ; un identifiant étranger n'est pas un lieu.
  const c=ref.canton(0,0),refused=c.sites.filter(s=>!ref.site(s.id));for(const s of refused)assert.equal(S.create(seed).site(s.id),undefined);
  for(const bad of ['P0001','K0_0:route:0','K0_0:site:999',null,undefined,12])assert.equal(ref.site(bad),undefined);
});

test('lieux 217 : sitesNear par emprise tournée — même critère que la région finie',()=>{
  const w=S.create(84329),all=[];for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++)all.push(...w.placesOf(cx,cy));
  for(const p of all.slice(0,30)){
    const corner=F.global(p,p.w,p.h),out={x:corner.x+(corner.x-p.x)*.05,y:corner.y+(corner.y-p.y)*.05},r=far(out.x-corner.x,out.y-corner.y)+.01;
    assert.ok(far(out.x-p.x,out.y-p.y)>r,'centre hors du rayon');assert.ok(w.sitesNear(out.x,out.y,r).includes(p),p.id+' trouvé par son emprise');
  }
  for(const[x,y,r]of [[w.home.x,w.home.y,900],[-1500,800,700],[2000,-300,350]]){
    const got=w.sitesNear(x,y,r),want=all.filter(p=>{if(!(far(p.x-x,p.y-y)>r))return true;const l=F.local(p,x,y),dx=Math.max(-l.x,0,l.x-p.w),dy=Math.max(-l.y,0,l.y-p.h);return!(dx*dx+dy*dy>r*r);});
    assert.deepEqual(got.map(p=>p.id).sort(),want.map(p=>p.id).sort());
    const key=p=>{const e=K.parseEntity(p.id);return[e.cy,e.cx,e.index];};
    for(let i=1;i<got.length;i++){const a=key(got[i-1]),b=key(got[i]);assert.ok(a[0]<b[0]||a[0]===b[0]&&(a[1]<b[1]||a[1]===b[1]&&a[2]<b[2]));}
  }
  assert.deepEqual(w.sitesNear(NaN,0,10),[]);assert.throws(()=>w.sitesNear(0,0,O.RULES.nearMaxRadius+1));
});

test('obstacles 217 : blocked vrai sur toute arête de falaise de 200 cantons, faux sur toute rampe de col',()=>{
  let cliffs=0,ramps=0,wet=0;
  for(const seed of [17117,4294967295]){
    const w=S.create(seed);
    for(let cy=-5;cy<5;cy++)for(let cx=-5;cx<5;cx++){
      for(const e of ownedEdges(w,cx,cy)){
        // Classement relu dans le canton, pas dans le module : écart de palier, bit de passage.
        const a=levelOf(seed,e.gx,e.gy),b=e.axis==='v'?levelOf(seed,e.gx+1,e.gy):levelOf(seed,e.gx,e.gy+1),pass=passOf(w,e.gx,e.gy,e.axis==='v'?0:1);
        assert.equal(e.before,a);assert.equal(e.after,b);
        const shore=(a===0||b===0)&&Math.abs(a-b)===1;
        assert.equal(e.kind,pass?'ramp':shore?'shore':'cliff');
        const mx=(e.a.x+e.b.x)/2,my=(e.a.y+e.b.y)/2;
        if(e.kind==='cliff'){cliffs++;assert.ok(w.blocked(mx,my),seed+' falaise '+mx+','+my);assert.ok(w.blocked(mx,my,0));
          // À pied comme en voiture : ni le pas ni la caisse ne passent l'arête.
          const n=e.axis==='v'?{x:1,y:0}:{x:0,y:1};assert.equal(w.movementLine({x:mx-n.x*2,y:my-n.y*2},{x:mx+n.x*2,y:my+n.y*2}),false);
          assert.equal(w.vehicleClear(mx,my,e.axis==='v'?0:Math.PI/2),false);}
        if(e.kind==='ramp'){ramps++;assert.equal(w.terrainBlocked(mx,my),false,seed+' rampe '+mx+','+my);
          // Une rampe se prend : seul un plan d'eau (règle G8+) peut encore barrer le pas.
          if(w.blocked(mx,my)){assert.ok(w.waterBlocked(mx,my,R.footRadius),seed+' rampe bloquée hors de l’eau '+mx+','+my);wet++;}}
      }
    }
  }
  assert.ok(cliffs>15000&&ramps>3000,cliffs+' falaises, '+ramps+' rampes');assert.ok(wet<ramps*.02,wet+' rampes mouillées');
});

test('obstacles 217 : 10 000 pas aléatoires — aucun ne traverse une falaise, l’eau bloque hors des ponts',()=>{
  const seed=17117,w=S.create(seed),draw=rng(217002);let steps=0,moved=0,refused=0,climbs=0;
  const walkers=[];for(let k=0;k<30;k++){let p;do p={x:-1500+draw()*3000,y:-1500+draw()*3000};while(w.blocked(p.x,p.y));walkers.push(p);}
  // Dix marcheurs partent au pied ou en haut d'une rampe : le pas doit pouvoir changer de palier par elle.
  const ramps=[];for(let cy=-1;cy<=1;cy++)for(let cx=-1;cx<=1;cx++)ramps.push(...ownedEdges(w,cx,cy).filter(e=>e.kind==='ramp'));
  for(let k=0;walkers.length<40&&k<ramps.length;k+=Math.max(1,Math.floor(ramps.length/10))){const e=ramps[k],n=e.axis==='v'?{x:1,y:0}:{x:0,y:1},p={x:(e.a.x+e.b.x)/2-n.x*1.5,y:(e.a.y+e.b.y)/2-n.y*1.5};if(!w.blocked(p.x,p.y))walkers.push(p);}
  for(;steps<10000;steps++){
    const p=walkers[steps%walkers.length],a=draw()*Math.PI*2,step=1+draw()*3,q={x:p.x+Math.cos(a)*step,y:p.y+Math.sin(a)*step};
    if(!w.movementLine(p,q)){refused++;continue;}
    // Contrôle indépendant : relevé tous les 10 cm, tout changement de maille et de palier passe une rampe.
    let gx=Math.floor(p.x/CELL),gy=Math.floor(p.y/CELL);
    for(let t=.01;t<=1.0001;t+=.01){const x=p.x+(q.x-p.x)*t,y=p.y+(q.y-p.y)*t,nx=Math.floor(x/CELL),ny=Math.floor(y/CELL);
      if(nx!==gx||ny!==gy){const l0=levelOf(seed,gx,gy),l1=levelOf(seed,nx,ny);
        if(l0!==l1){assert.ok(nx===gx||ny===gy,'passage en coin');const pass=nx!==gx?passOf(w,Math.min(gx,nx),gy,0):passOf(w,gx,Math.min(gy,ny),1);assert.equal(pass,1,'pas à travers une falaise en '+x+','+y);climbs++;}
        gx=nx;gy=ny;}
      if(Math.round(t*100)%10===0)assert.equal(w.waterBlocked(x,y,0),false,'pas dans l’eau');}
    p.x=q.x;p.y=q.y;moved++;
  }
  assert.ok(moved>5000&&refused>100,moved+' pas faits, '+refused+' refusés');
  assert.ok(climbs>0,'au moins un pas par une rampe ('+climbs+')');
});

test('obstacles 217 : eau — mer, lac et cours d’eau bloquent comme en G8+, un pont se franchit',()=>{
  let sea=0,lake=0,river=0,bridges=0;
  for(const seed of [0,17117,84329,42]){
    const w=S.create(seed);
    for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++){
      const c=w.canton(cx,cy),b=c.bounds;
      for(let i=0;i<N*N;i+=7){const x=b.x+(i%N+.5)*CELL,y=b.y+(Math.floor(i/N)+.5)*CELL;
        if(c.water[i]===Gen.WATER.sea&&!c.roads.some(r=>r.cells.includes(i))){sea++;assert.ok(w.waterBlocked(x,y,0)&&w.blocked(x,y));}
        if(c.water[i]===Gen.WATER.lake){lake++;assert.ok(w.waterBlocked(x,y,0));}}
      for(const r of c.rivers)for(let k=1;k<r.points.length;k+=3){const a=r.points[k-1],q=r.points[k],x=(a.x+q.x)/2,y=(a.y+q.y)/2;if(c.roads.some(rd=>rd.points.slice(1).some((p,j)=>{const o=rd.points[j];return Math.min(far(p.x-x,p.y-y),far(o.x-x,o.y-y))<40;})))continue;river++;assert.ok(w.waterBlocked(x,y,0),r.id);assert.equal(w.movementLine({x:x-3,y:y-3},{x:x+3,y:y+3}),false);}
      for(const br of c.bridges){const road=c.roads[br.road],near=road.points.reduce((m,p)=>far(p.x-br.x,p.y-br.y)<far(m.x-br.x,m.y-br.y)?p:m);bridges++;assert.equal(w.waterBlocked(near.x,near.y,0),false,'pont '+road.id);}
    }
  }
  assert.ok(sea>50&&river>50&&bridges>5,JSON.stringify({sea,lake,river,bridges}));
});

test('obstacles 217 : vehicleClear sur les routes — seules quelques arêtes coupées par le tracé adouci résistent',()=>{
  let points=0,cut=0;
  for(const seed of [17117,84329,0]){
    const w=S.create(seed);
    for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++){
      const c=w.canton(cx,cy);
      for(const r of c.roads)for(let k=1;k<r.points.length;k++){
        const a=r.points[k-1],b=r.points[k],L=far(b.x-a.x,b.y-a.y),ang=Math.atan2(b.y-a.y,b.x-a.x);
        for(let t=0;t<L;t+=6){const x=a.x+(b.x-a.x)*t/L,y=a.y+(b.y-a.y)*t/L,car={x,y,w:R.car.w,h:R.car.h,a:ang};points++;
          if(w.vehicleClear(x,y,ang))continue;
          // Seule exception admise : la caisse touche une arête de falaise (coin coupé près d'une rampe).
          assert.ok(w.edgesIn(x-4,y-4,x+4,y+4).some(e=>e.kind==='cliff'&&F.segmentRect(F.local(car,e.a.x,e.a.y),F.local(car,e.b.x,e.b.y),{x:0,y:0,w:car.w,h:car.h})),seed+' '+r.id+' bloquée en '+x+','+y);cut++;}
      }
      // Les rampes que les routes empruntent se passent en voiture, de face.
      for(const q of c.ramps){const road=c.roads[q.road],cells=road.cells;for(let k=1;k<cells.length;k++){const i=cells[k-1],j=cells[k],xi=c.bounds.x+(i%N+.5)*CELL,yi=c.bounds.y+(Math.floor(i/N)+.5)*CELL,xj=c.bounds.x+(j%N+.5)*CELL,yj=c.bounds.y+(Math.floor(j/N)+.5)*CELL;
        if(far((xi+xj)/2-q.x,(yi+yj)/2-q.y)<1e-6&&!w.waterBlocked(q.x,q.y,1))assert.ok(w.vehicleClear(q.x,q.y,Math.atan2(yj-yi,xj-xi)),seed+' rampe '+q.x+','+q.y);}}
    }
  }
  assert.ok(points>25000&&cut<points*.002,cut+' sur '+points+' points de route');
});

test('vue et tir 217 (D-O1) : une falaise arrête ce qui vient d’en bas, pas ce qui vient d’en haut',()=>{
  // Règle pure.
  assert.equal(S.SIGHT.blocks(2,2,1),false,'descendre depuis le haut');
  assert.equal(S.SIGHT.blocks(1,1,2),true,'monter depuis le pied');
  assert.equal(S.SIGHT.blocks(2,1,2),false,'remonter au palier du tireur par-dessus une vallée');
  assert.equal(S.SIGHT.blocks(1,1,3),true);assert.equal(S.SIGHT.blocks(3,2,3),false);assert.equal(S.SIGHT.blocks(1,2,3),true,'crête plus haute que le tireur');
  assert.equal(S.edgeKind(1,2,1),'ramp');assert.equal(S.edgeKind(0,1,0),'shore');assert.equal(S.edgeKind(0,2,0),'cliff');assert.equal(S.edgeKind(2,2,0),'none');
  let edges=0,valleys=0,ramps=0;
  for(const seed of [17117,42,84329]){
    const w=S.create(seed);
    for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++)for(const e of ownedEdges(w,cx,cy)){
      const mx=(e.a.x+e.b.x)/2,my=(e.a.y+e.b.y)/2,n=e.axis==='v'?{x:1,y:0}:{x:0,y:1},A={x:mx-n.x*8,y:my-n.y*8},B={x:mx+n.x*8,y:my+n.y*8};
      if(e.kind==='cliff'&&e.before>0&&e.after>0){edges++;const[low,high]=e.before<e.after?[A,B]:[B,A];
        assert.equal(w.lineOfSight(high,low),true,'d’en haut on voit en contrebas');assert.equal(w.lineOfSight(low,high),false,'d’en bas on ne voit pas au-dessus');
        assert.equal(w.line(low,high,0,null,null,.05,'optical'),false,'le tir d’en bas est arrêté');}
      if(e.kind==='ramp'){ramps++;assert.equal(w.lineOfSight(A,B),true);assert.equal(w.lineOfSight(B,A),true,'une rampe n’est pas une falaise');}
      // Plateau – vallée – plateau de même hauteur : la vue passe d'un haut à l'autre, pas du fond vers le haut.
      if(e.axis==='v'&&e.kind==='cliff'){const g=[0,1,2].map(k=>levelOf(seed,e.gx+k,e.gy));
        if(g[0]===g[2]&&g[1]<g[0]&&g[1]>0&&!passOf(w,e.gx,e.gy,0)&&!passOf(w,e.gx+1,e.gy,0)){valleys++;const y=(e.gy+.5)*CELL,P=k=>({x:(e.gx+k+.5)*CELL,y});
          assert.equal(w.lineOfSight(P(0),P(2)),true);assert.equal(w.lineOfSight(P(1),P(0)),false);assert.equal(w.lineOfSight(P(0),P(1)),true);}}
    }
  }
  assert.ok(edges>3000&&ramps>300,edges+' falaises, '+ramps+' rampes');assert.ok(valleys>0,'au moins une vallée étroite');
  const w=S.create(0);assert.equal(w.lineOfSight(null,{x:0,y:0}),false);assert.equal(w.lineOfSight({x:NaN,y:0},{x:0,y:0}),false);
  assert.throws(()=>w.lineOfSight({x:0,y:0},{x:R.maxLine+1,y:0}),/trop long/);
});

test('décor 217 : arbres et rochers par morceaux de 256 m à clé signée, stables, hors falaise, eau, route et lot',()=>{
  const seed=1947648717,w=S.create(seed);let trees=0,rocks=0;
  const keys=[[0,0],[-1,-1],[-7,3],[5,-6],[-12,-12],[3,7],[-4,0],[1,-9]];
  const want=keys.map(([x,y])=>JSON.stringify(w.chunk(x,y)));
  const v=S.create(seed);keys.slice().reverse().forEach(([x,y],i)=>{v.chunk(x+30,y-30);assert.equal(JSON.stringify(v.chunk(x,y)),want[keys.length-1-i]);});
  for(const[x,y]of keys){
    const c=w.chunk(x,y),k=K.at(x*256,y*256);assert.equal(c.canton,K.id(k.cx,k.cy));
    const places=w.placesOf(k.cx,k.cy),ct=w.canton(k.cx,k.cy);
    for(const t of [...c.trees,...c.rocks]){
      t.kind==='tree'?trees++:rocks++;const e=K.parseEntity(t.id);assert.ok(e&&e.canton===c.canton&&e.kind===(t.kind==='tree'?'arbre':'roche'));
      assert.ok(t.x>=x*256&&t.x<(x+1)*256&&t.y>=y*256&&t.y<(y+1)*256);
      assert.ok(Gen.levelAt(seed,t.x,t.y)>0&&!w.waterBlocked(t.x,t.y,0),t.id+' au sec');
      const pad=(t.canopy||t.r)+.6;assert.ok(!w.edgesIn(t.x-pad-3,t.y-pad-3,t.x+pad+3,t.y+pad+3).some(q=>q.kind!=='shore'&&(q.axis==='v'?Math.abs(q.a.x-t.x):Math.abs(q.a.y-t.y))<pad+2.99&&(q.axis==='v'?t.y>=q.a.y-pad&&t.y<=q.b.y+pad:t.x>=q.a.x-pad&&t.x<=q.b.x+pad)),t.id+' au bord d’une falaise ou d’une rampe');
      for(const p of places)assert.ok(!(t.x>p.reserve.l&&t.x<p.reserve.r&&t.y>p.reserve.t&&t.y<p.reserve.b),t.id+' dans '+p.id);
      for(const r of ct.roads)for(let j=1;j<r.points.length;j++){const a=r.points[j-1],b=r.points[j],dx=b.x-a.x,dy=b.y-a.y,s=Math.max(0,Math.min(1,((t.x-a.x)*dx+(t.y-a.y)*dy)/(dx*dx+dy*dy)));assert.ok(far(t.x-a.x-dx*s,t.y-a.y-dy*s)>=r.width/2+4.9,t.id+' sur la route');}
      assert.ok(t.amount>0&&(t.resource==='wood'||t.resource==='stone'));
    }
  }
  assert.ok(trees>200&&rocks>10,trees+' arbres, '+rocks+' rochers');
  assert.deepEqual(w.chunk(1.5,0).trees,[]);assert.deepEqual(w.chunk(1e9,0).trees,[]);
  // Un arbre arrête le pas et la vue, pas un arbre abattu.
  const t=w.chunk(0,0).trees[0]||w.chunk(-1,-1).trees[0];assert.ok(t);assert.ok(w.blocked(t.x,t.y)&&w.opticalBlocked(t.x,t.y));
  const felled=S.create(seed,{effects:{resourceTaken:id=>id===t.id?t.amount:0}});assert.ok(!felled.around(t.x,t.y,1).some(c=>c.trees.some(q=>q.id===t.id&&q.r<=.18)));
});

test('lieux 217 : coût mesuré par canton et par morceau (budget de 8 ms par image)',()=>{
  const w=S.create(84329),furnish=[],chunks=[];
  X.forParcel(84329,{id:'K0_0:site:0',type:'house',codex:'DW-0001',generation:12},{});w.placesOf(9,9);
  for(let cy=-3;cy<=3;cy++)for(let cx=-3;cx<=3;cx++){w.canton(cx,cy);const t=process.hrtime.bigint();w.placesOf(cx,cy);furnish.push(Number(process.hrtime.bigint()-t)/1e6);}
  for(let cy=-6;cy<6;cy++)for(let cx=-6;cx<6;cx++){const t=process.hrtime.bigint();w.chunk(cx,cy);chunks.push(Number(process.hrtime.bigint()-t)/1e6);}
  const med=a=>[...a].sort((x,y)=>x-y)[a.length>>1];
  console.log('# lieux d’un canton : médiane '+med(furnish).toFixed(2)+' ms, max '+Math.max(...furnish).toFixed(2)+' ms ; morceau de 256 m : médiane '+med(chunks).toFixed(2)+' ms, max '+Math.max(...chunks).toFixed(2)+' ms');
  assert.ok(med(furnish)<5*R.budgetMs,'lieux d’un canton trop coûteux : '+med(furnish));assert.ok(med(chunks)<5*R.budgetMs,'morceau trop coûteux : '+med(chunks));
  const st=w.streamStats();assert.ok(st.placeCache<=R.placeCache&&st.chunkCache<=R.chunkCache&&st.planCache<=R.planCache);
  assert.equal(st.plans,0,'plans d’intérieur paresseux : aucun calculé pour meubler les cantons');
});

test('lieux 217 : module isolé, génération 12 refusée, mondes G1–G11 intouchés',()=>{
  const source=read('src/world-sites217.js'),code=source.replace(/\/\/.*$/gm,'');
  assert.ok(!/Math\.random|Math\.hypot|Math\.pow|Date\.now|performance\.|localStorage|document\b|setTimeout|setInterval/.test(code),'module pur et portable');
  assert.deepEqual([...source.matchAll(/require\('([^']+)'\)/g)].map(m=>m[1]),['./core.js','./world-cantons217.js','./world-canton-gen217.js','./world-open217.js','./frontier-geometry.js','./codex3000-runtime.js','./world-spawns131.js','./biomes135.js','./frontage174.js','./seed-detail157.js']);
  assert.ok(!/F\.rng|G\.rng|Geography135|geography141|WorldContent|expansions|\.taken\b|Biomes\.sample|scatter\(|pickBuilding/.test(code),'aucun flux des générations 1 à 11');
  for(const file of ['index.html','sw.js','scripts/server.mjs','scripts/build.mjs','scripts/public-manifest183.cjs','src/expansion-kit.js','src/expansion-ui.js'])assert.ok(!read(file).includes('world-sites217')&&!read(file).includes('WorldSites217'),file);
  for(const file of fs.readdirSync(path.join(ROOT,'src')))if(!['world-sites217.js','core.js'].includes(file)){const text=read('src/'+file);assert.ok(!text.includes('WorldSites217')&&!text.includes('world-sites217'),file+' ne doit pas dépendre des lieux G12');}
  const dist=path.join(ROOT,'dist');if(fs.existsSync(dist))assert.ok(!fs.existsSync(path.join(dist,'src','world-sites217.js')));
  const St=require('../src/frontier-state.js');
  assert.throws(()=>Wd.create(17117,12),/Version du monde inconnue/);assert.throws(()=>St.normalize({...St.initial(),generation:12}),/Génération inconnue/);
  assert.ok(!/sans bord/i.test(read('index.html')),'aucune option de menu');
  const print=world=>crypto.createHash('sha256').update(JSON.stringify([world.size,world.home,world.roads,world.pois.map(p=>[p.id,p.x,p.y,p.a,p.type,p.name,p.programme3000||null]),world.towns])).digest('hex');
  const old=Wd.create(42,11),before=[print(Wd.create(17117,4)),print(old)],p=old.pois[40],floor=JSON.stringify(old.plan(p,0));
  for(const seed of SEEDS.slice(0,3)){const w=S.create(seed);for(const q of w.placesOf(0,0)){w.plan(q,0);w.detailAt(q,0);}w.chunk(0,0);w.blocked(w.home.x,w.home.y);}
  assert.deepEqual([print(Wd.create(17117,4)),print(Wd.create(42,11))],before);assert.equal(JSON.stringify(Wd.create(42,11).plan(p,0)),floor);
});
