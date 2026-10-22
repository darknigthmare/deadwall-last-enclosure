(function initNarrative(root, factory) {
  'use strict';
  const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.DeadwallCore);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DeadwallNarrative=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C) {
  'use strict';
  // Authored traces belong to places, not living units. No hidden survivor or rescue is promised.
  const CHAPTERS=[
    {id:'departure',title:'I · Le point de retour',text:'D-17 était un dépôt municipal. Trois ouvriers ont choisi d’y rester avec vous. Il reste des outils, un peu de vivres et une règle écrite sur la porte : personne ne part sans savoir où revenir. Commencez par rapporter des matériaux ; une cité ne tient pas dans un sac.'},
    {id:'shelter',title:'II · Une place derrière les murs',text:'Un dortoir et une ferme ne rendent personne invulnérable. Ils donnent une raison de revenir. Gardez des portes praticables, des réserves et une ligne de repli : les bâtiments ne mettront pas automatiquement vos équipes à l’abri.'},
    {id:'initiative',title:'III · Ce qu’ils ont laissé',text:'Les quartiers n’étaient pas vides avant votre arrivée. Leurs traces racontent des décisions prises avec trop peu de temps. Au dépôt, vous pouvez en tirer une méthode ou en faire un moment partagé avec l’équipe. Choisir l’un, c’est renoncer à l’autre pour ce dossier.'},
    {id:'network',title:'IV · La dernière enceinte',text:'Six quartiers ont retrouvé une place dans le registre de D-17. La ligne a tenu au moins trois migrations. Vous n’avez ni retrouvé tous les disparus, ni arrêté la contamination. Vous avez gardé leurs pratiques d’entraide et un point de retour. La dernière enceinte n’est pas le dernier mur : c’est la décision de ne pas abandonner ceux qui le défendent. Les migrations continuent.'}
  ];
  const definitions=[
    {id:'housing',title:'Les portes entrouvertes',source:'Liste au crayon · Lina, habitante · date illisible',
      excerpt:'« Troisième maison : deux personnes. Cinquième : une seule, qui entend mal. Laissez les clés chez moi. Si le convoi ne vient pas, on part ensemble. » La dernière case n’a jamais été cochée.',
      discovery:'Une liste de voisins, pas un inventaire de ruines. Leur destination reste inconnue.',
      a:['Formaliser les tournées','Vous recopiez les tournées rue par rue. À côté de chaque départ, vous laissez une case pour le retour. Le prochain responsable ne devra pas tout réapprendre.'],
      b:['Lire les noms à l’équipe','Au dépôt, vous prenez le temps de lire chaque nom. Aucun disparu n’est déclaré sauvé ; ceux qui sont ici savent qu’ils seront comptés.']},
    {id:'market',title:'Le registre des parts',source:'Cahier de comptoir · Sami, répartiteur bénévole · avant le dernier départ',
      excerpt:'« Les rations des absents restent à part jusqu’au soir. Ne rayez pas quelqu’un parce qu’il rentre en retard. Nous avons déjà fait cette erreur hier. » Sous la page, une balance est bloquée par la poussière.',
      discovery:'Le marché distribuait ses dernières réserves. Le registre parle de confiance avant de parler de quantités.',
      a:['Étudier la répartition','Vous séparez le registre en deux colonnes : distribué et attendu. La méthode ne remplit pas les étagères, mais elle montre enfin où les réserves disparaissent.'],
      b:['Partager un repas au dépôt','Une part des réserves devient un repas commun. Pour quelques minutes, les voix autour de la table couvrent les bruits venus du dehors.']},
    {id:'aid',title:'La colonne des incertains',source:'Fiche de triage · Nora, soignante · fin de permanence',
      excerpt:'« Blessure ne veut pas dire morsure. Morsure ne veut pas dire diagnostic certain. Séparez les couchages, gardez les noms et notez ce que vous avez réellement vu. » La fiche suivante manque.',
      discovery:'Le camp n’a laissé ni remède ni certitude. Seulement une consigne : soigner sans inventer de diagnostic.',
      a:['Consigner le protocole','Vous recopiez les observations avant les conclusions. Dans la marge, le mot « guérison » reste barré. Les équipes auront au moins une méthode commune pour parler des blessures.'],
      b:['Organiser une relève','Vous mettez des rations de côté pour la relève. Quelqu’un s’assoit enfin sans garder son équipement contre lui. Personne ne lui demande de se dépêcher.']},
    {id:'industry',title:'La lumière de service',source:'Cahier de quart · initiales E.R. · après le premier délestage',
      excerpt:'« Garder une lampe pour le retour des équipes. Couper le reste avant que la citerne soit vide. Le prochain quart doit trouver assez de carburant pour redémarrer. » Le fusible de rechange est déjà absent.',
      discovery:'Le site s’est arrêté pour économiser une reprise qui n’est peut-être jamais venue.',
      a:['Analyser le délestage','Vous reconstituez le raisonnement du dernier quart sur un schéma. Une ligne est soulignée deux fois : économiser assez pour pouvoir redémarrer.'],
      b:['Tenir la veillée','L’équipe partage ses rations sous la lampe du dépôt. Au-delà du halo, on entend toujours les grilles. À l’intérieur, chacun raconte un endroit qu’il aimerait revoir.']},
    {id:'transit',title:'Le trajet barré',source:'Feuille de route · Sami V., conducteur · dernier service connu',
      excerpt:'« Terminus fermé. Barrage fermé. D-17 reste praticable à pied. Je ne peux pas promettre un autre passage. J’ai laissé cette copie pour ceux qui arrivent après nous. » Aucun horaire de retour n’est inscrit.',
      discovery:'Les autobus sont immobilisés. La route indiquait un refuge possible, pas une évacuation garantie.',
      a:['Reporter les itinéraires','La feuille de route rejoint la carte du dépôt. Vous y marquez les interruptions connues, sans transformer un ancien itinéraire en promesse de passage sûr.'],
      b:['Transmettre le point de retour','Autour d’un repas, vous rappelez le nom de D-17 à ceux qui viennent d’arriver. Pas comme une destination finale. Comme un endroit où quelqu’un comptera leur retour.']},
    {id:'checkpoint',title:'Deux ordres sur le même billet',source:'Billet de barrage · auteur inconnu · après la fermeture',
      excerpt:'« Fermer le passage. » Au verso, d’une autre main : « Laisser sortir les familles à pied. Ne promettez pas que la route est sûre. » Les deux signatures ont été arrachées avec le bas du papier.',
      discovery:'Le barrage garde la trace d’un désaccord. Aucun document ne dit qui a finalement traversé.',
      a:['Étudier les points de rupture','Vous posez les deux ordres côte à côte. Un accès unique a transformé chaque décision en impasse. Le dossier de la prochaine enceinte commence par cette leçon.'],
      b:['Inscrire le droit au repli','Vous lisez le billet devant l’équipe, puis le retournez. Sur la face vide, vous écrivez qu’un quartier peut être perdu sans que ceux qui le défendent soient abandonnés.']}
  ];
  const SECTORS=definitions.map(def=>{
    const choices=Object.fromEntries(['A','B'].map((key,index)=>{
      const rule=C.NARRATIVE_OPERATIONS[def.id][key],copy=index?def.b:def.a;
      return [key,{label:copy[0],outcome:copy[1],cost:{...rule.cost},reward:{insight:rule.insight||0,morale:rule.morale||0,resources:{}}}];
    }));
    const {a,b,...text}=def;return {...text,choices};
  });
  const ids=SECTORS.map(item=>item.id),chapterIds=CHAPTERS.map(item=>item.id);
  const surveyOffsets=[];
  const surveyRules=C.NARRATIVE_RULES,steps=Math.floor(surveyRules.surveyPointSearchRadius/surveyRules.surveyPointStep);
  for(let y=-steps;y<=steps;y++)for(let x=-steps;x<=steps;x++){
    const dx=x*surveyRules.surveyPointStep,dy=y*surveyRules.surveyPointStep,d=dx*dx+dy*dy;
    if(d<=surveyRules.surveyPointSearchRadius**2)surveyOffsets.push({dx,dy,d});
  }
  surveyOffsets.sort((a,b)=>a.d-b.d||a.dy-b.dy||a.dx-b.dx);
  function createSurveyApproach(origin,clear,worldSize=C.WORLD_SIZE){
    const width=worldSize/C.TILE,radius=surveyRules.surveyPointClearance,unavailable=()=>false;
    if(!origin||![origin.x,origin.y,worldSize].every(Number.isFinite)||!Number.isInteger(width)||width<1||width>C.WORLD_TILES||typeof clear!=='function')return unavailable;
    const inside=p=>p.x>=radius&&p.y>=radius&&p.x<=worldSize-radius&&p.y<=worldSize-radius;
    const key=p=>C.grid(p.y)*width+C.grid(p.x),point=k=>({x:C.world(k%width),y:C.world(Math.floor(k/width))});
    const stand=p=>inside(p)&&clear(p,radius);
    const segment=(a,b)=>{const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/(C.TILE/8)));for(let i=1;i<count;i++)if(!stand({x:a.x+(b.x-a.x)*i/count,y:a.y+(b.y-a.y)*i/count}))return false;return true;};
    if(!stand(origin))return unavailable;
    const start=key(origin),startPoint=point(start);
    if(!stand(startPoint)||!segment(origin,startPoint))return unavailable;
    // Exhaust the finite native cardinal grid once. This proves connectivity,
    // including physical segments; no heuristic path budget can hide an area.
    const reached=new Uint8Array(width*width),free=new Int8Array(width*width),queue=new Int32Array(width*width);free.fill(-1);
    let head=0,tail=1;queue[0]=start;reached[start]=1;free[start]=1;
    while(head<tail){
      const current=queue[head++],x=current%width,y=Math.floor(current/width),from=point(current);
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=width)continue;
        const next=ny*width+nx;if(reached[next])continue;
        const to=point(next);if(free[next]===-1)free[next]=Number(stand(to));
        if(!free[next]||!segment(from,to))continue;
        reached[next]=1;queue[tail++]=next;
      }
    }
    return candidate=>Boolean(candidate&&Number.isFinite(candidate.x)&&Number.isFinite(candidate.y)&&stand(candidate)&&reached[key(candidate)]&&segment(point(key(candidate)),candidate));
  }
  function resolveSurveyPoint(site,clear,worldSize=C.WORLD_SIZE){
    if(!site||![site.x,site.y,worldSize].every(Number.isFinite)||worldSize<=0||typeof clear!=='function')return null;
    const radius=surveyRules.surveyPointClearance;
    // Resolve against immutable terrain only. Player construction must obstruct
    // an existing survey area, not make its marker move to the other side.
    for(const {dx,dy}of surveyOffsets){
      const point={x:site.x+dx,y:site.y+dy};
      if(point.x<radius||point.y<radius||point.x>worldSize-radius||point.y>worldSize-radius)continue;
      if(clear(point,radius))return point;
    }
    return null;
  }
  const fail=()=>{throw new Error('Sauvegarde invalide : registre narratif.');};
  const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
  const unique=(value,allowed,max)=>{
    if(!Array.isArray(value)||value.length>max||new Set(value).size!==value.length||value.some(id=>typeof id!=='string'||!allowed.includes(id)))fail();
    return value.slice();
  };
  function create(){
    return {version:1,sectors:Object.fromEntries(ids.map(id=>[id,{survey:0,choice:null}])),chapters:['departure'],unread:['chapter:departure']};
  }
  function normalize(raw){
    if(raw===undefined)return create();
    if(!plain(raw)||raw.version!==1||!plain(raw.sectors)||Object.keys(raw.sectors).some(id=>!ids.includes(id)))fail();
    const sectors=Object.fromEntries(ids.map(id=>{
      if(!Object.hasOwn(raw.sectors,id))fail();
      const item=raw.sectors[id];
      if(!plain(item)||typeof item.survey!=='number'||!Number.isFinite(item.survey)||item.survey<0||item.survey>C.NARRATIVE_RULES.surveySeconds||![null,'A','B'].includes(item.choice))fail();
      if(item.choice!==null&&item.survey!==C.NARRATIVE_RULES.surveySeconds)fail();
      return [id,{survey:item.survey,choice:item.choice}];
    }));
    const chapters=unique(raw.chapters,chapterIds,chapterIds.length);if(!chapters.includes('departure'))fail();
    const available=[...chapters.map(id=>'chapter:'+id),...ids.filter(id=>sectors[id].survey===C.NARRATIVE_RULES.surveySeconds).map(id=>'sector:'+id)];
    const unread=unique(raw.unread,available,chapterIds.length+ids.length);
    return {version:1,sectors,chapters,unread};
  }
  function status(state){
    return {observed:ids.filter(id=>state.sectors[id].survey===C.NARRATIVE_RULES.surveySeconds).length,resolved:ids.filter(id=>state.sectors[id].choice!==null).length,unread:state.unread.length};
  }
  function chaptersFor(state,facts){
    const next=[];
    if(facts.objectiveIndex>=3)next.push('shelter');
    if(status(state).observed>0)next.push('initiative');
    if(status(state).resolved===ids.length&&facts.wavesSurvived>=3)next.push('network');
    return next.filter(id=>!state.chapters.includes(id));
  }
  return Object.freeze({CHAPTERS,SECTORS,RULES:C.NARRATIVE_RULES,createSurveyApproach,resolveSurveyPoint,create,normalize,status,chaptersFor});
});
