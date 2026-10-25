/* Operational Codex links. Reads actual catalogues and known sites only;
 * navigation never buys, constructs, surveys or materializes a programme.
 */
(function(root,factory){'use strict';
 const dependency=(globalName,file)=>root[globalName]||(typeof require==='function'?require(file):null);
 const api=factory(dependency('DeadwallCore','./core.js'),dependency('DeadwallCityCatalogue150','./city-catalogue150.js'),
  dependency('DeadwallCodex3000Runtime','./codex3000-runtime.js'),dependency('DeadwallBiomes135','./biomes135.js'),
  dependency('DeadwallCodexContext160','./codex-context160.js'));
 root.DeadwallCodexActions159=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C,City,R,B,X){'use strict';
 const catalogue=C&&City?City.create(C):null,choices=new Map((catalogue?.items||[]).map(item=>[item.key,item]));
 const contexts=(B?.defs||[]).flatMap(b=>['',...Object.keys(C?.WorldTownRules141?.required||{}),'cite-industrielle'].map(townKind=>({biome:b.id,townKind})));
 const capabilities=new Map();
 const COST_SOURCE=Object.freeze({bag:'dans le sac',depot:'au dépôt'});
 const STEPS=Object.freeze({
  building:'Ouvrir le catalogue de construction, choisir un emplacement libre, financer la fondation puis achever le chantier. Les évolutions utilisent une structure achevée sur place.',
  road:'Rejoindre la voirie, tracer les cellules accessibles, financer le revêtement et terminer le travail physique.',
  mechanism:'Rejoindre un Hérisson achevé, choisir le montage dans Fortifications et terminer la préparation avec les matériaux du sac. Les charges doivent être refaites après usage.',
  fitting:'Rejoindre un support achevé compatible, choisir son équipement dans Fortifications puis payer son installation. Sa réserve reste finie et attachée au support.',
  exercise:'Affecter un accompagnateur compatible, acquérir l’entraînement préalable puis terminer la formation payée. Les ordres et la position restent nécessaires.',
  plan:'Rejoindre les ensembles de chantiers, choisir une emprise accessible et financer chacune de ses fondations. Achever les bâtiments avant leur mise en service.',
  recipe:'Rejoindre le dépôt ou l’atelier requis, choisir la recette dans l’armurerie et terminer l’assemblage. Prendre ensuite l’équipement au râtelier.',
  role:'Ouvrir le personnel, disposer d’un logement et des prérequis, puis payer le recrutement. Prévoir les rations et fournitures du rôle.',
  doctrine:'Ouvrir les doctrines, disposer des analyses et ressources demandées, puis acquérir la doctrine une seule fois.',
  vehicle:'Ouvrir la flotte, sélectionner le véhicule au garage puis le remettre en service. Les réserves du coffre et du réservoir sont payées séparément.'
 });
 function resourceText(cost){return Object.keys(cost||{}).length?C.resourceText(cost):'aucun matériau demandé';}
 const entries=Object.freeze((catalogue?.items||[]).map(item=>{
  const age=C.CITY_TIERS[item.tier],steps=item.upgradeOnly?'Sélectionner une porte achevée et financer son amélioration sur place depuis les structures. Aucun placement libre de cette évolution.':STEPS[item.kind];
  return Object.freeze({id:'city159-'+item.key,title:item.name+' · D-17',family:'systemes',status:'jouable',choice159:item.key,
   summary:catalogue.groups[item.kind]+'. '+(item.description||'Choix réel du catalogue de D-17.')+' Disponible à partir de l’âge '+(item.tier+1)+' : '+age.name+'.',
   layout:'Âge '+(item.tier+1)+' — '+age.name+'. '+(item.facts.join(' ')||'Les effets proviennent du support, de son achèvement et du contrôleur existant.'),
   access:(item.conditions.map(c=>c.text).join(' ')||'Conditions de base : commandant vivant, accès physique et opération autorisée.')+' '+steps,
   supplies:(item.kind==='road'?'Par cellule : ':item.upgradeOnly?'Évolution sur place : ':'Coût '+COST_SOURCE[item.payment]+' : ')+resourceText(item.cost)+'.'+(item.insight?' '+item.insight+' point(s) d’analyse requis.':'')+(item.upgradeCost&&!item.upgradeOnly?' Évolution : '+resourceText(item.upgradeCost)+'.':''),
   risks:item.tradeoffs.join(' ')||'Les ressources sont payées par le contrôleur ; le terrain, les accès et les capacités restent à vérifier au moment de l’opération.',
   night:'Le cycle nocturne, la visibilité et l’alimentation réels restent actifs. Cette consultation ne produit ni lumière, ni courant, ni soin supplémentaire.',
   variants:(item.upgradeFrom?.length?'Évolution depuis '+item.upgradeFrom.map(id=>C.BUILDINGS[id].name).join(' / ')+'. ':'')+'Option '+item.id+' du registre '+catalogue.groups[item.kind]+'. Les paramètres et coûts suivent les règles installées.',
   interactions:steps+' '+item.facts.join(' '),
   qa:'Âge acquis, supports achevés, plans relevés, ressources disponibles et accès libres sont vérifiés séparément. Ouvrir cette fiche ou son catalogue ne dépense rien.',
   source:'Catalogue fonctionnel dérivé de src/city-catalogue150.js et src/core.js ; action vers le catalogue réel des âges. Aucun nouveau bâtiment ou service créé par le guide.'});
 }));
 function capability(programmeId){
  const id=String(programmeId||'').replace(/^programme-/,''),cached=capabilities.get(id);if(cached)return cached;
  const record=R?.get(id);if(!record)return null;
  const historicalPreset=R.preset('codex3000-'+record.id.slice(3)),historicalEligible=!!historicalPreset&&contexts.some(context=>R.enabled(record,context));
  const contract=X?.get(record.id),contextPreset=contract&&X.preset(X.typeFor(record.id));
  const preset=contract?contextPreset:historicalPreset,eligible=contract?!!contextPreset:historicalEligible;
  const scope=contract?'Site abandonné à explorer, avec réserves finies. '+
   (contract.operationCandidates.length?'Les services indiqués demandent une intervention physique payée sur place. ':'')+
   'Les accès suivent la géométrie réelle du lieu. '+(contract.implementation160?.text||''):null;
  const value=Object.freeze({id:record.id,hasPlan:!!preset,eligible,generation:contract?10:record.extension===158?9:8,
   context160:contract?.context160||null,scope,
   historicalHasPlan:!!historicalPreset,historicalEligible,
   supportedGenerations:Object.freeze(contract?[10,11]:record.extension===158?[9,10,11]:[8,9,10,11]),
   adaptation:contract?.adaptation||null,implementation160:contract?.implementation160||null,
   text:contract?'Programme territorial compatible avec G10, à activer volontairement au dépôt depuis Monde & relais. '+scope+' Une fiche ne garantit pas un emplacement sur chaque graine.':
    !preset?'Programme spécialisé sans plan additionnel implantable dans les générations actuelles : eau, ouvrages, rail ou composition de quartier. Les lieux partiels déjà repérés restent visitables.':
    !eligible?'Plan métrique consultable ; son contexte complet spécialisé n’est pas implanté dans les générations actuelles. Les lieux partiels déjà repérés restent visitables.':
    record.extension===158?'Programme compatible avec G9, activée volontairement au dépôt. Une fiche ne garantit pas un emplacement sur chaque graine.':
    'Programme compatible avec les implantations G8 et G9. Une fiche ne garantit pas un emplacement sur chaque graine.'});
  capabilities.set(id,value);return value;
 }
 function knownPlaces(game,programmeId){
  const id=String(programmeId||'').replace(/^programme-/,''),frontier=game?.frontier;
  if(!/^DW-\d{4}$/.test(id)||!R?.get(id)||typeof frontier?.discoveries!=='function'||typeof frontier?.world!=='function')return [];
  const known=new Set(frontier.discoveries());if(!known.size)return [];
  // Filter saved discoveries before inspecting any site's programme or name.
  return(frontier.world()?.pois||[]).filter(p=>known.has(p.id)&&(p.programme3000||p.codex)===id)
   .map(p=>Object.freeze({id:p.id,name:p.name,programme:id,levels:Object.freeze([...(p.levels||[0])])}));
 }
 function canNavigate(game){return game?.state==='playing'&&!game.gameOver&&!game.player?.dead&&game.canIssueCommand?.()===true;}
 function programmeStatus(game,programmeId){
  const c=capability(programmeId);if(!c)return null;
  // Position is a lightweight owner read. A guide refresh must not prepare a
  // territorial preview or inspect a region absent from the discovery notebook.
  const currentGeneration=game?.frontier?.position?.().generation??null;
  const active=Number.isInteger(currentGeneration)&&c.supportedGenerations.includes(currentGeneration);
  const inherited11=active&&currentGeneration===11;
  return Object.freeze({...c,currentGeneration,active,needsActivation160:!!c.context160&&!active,
   text:c.context160?(active?(inherited11?'Programme territorial G10 conservé dans cette campagne G11. ':'Programme territorial pris en charge par G10, activée dans cette campagne. ')+c.scope+
    ' Une fiche ne garantit pas un emplacement sur chaque graine. Seuls les lieux réellement repérés figurent ci-dessous.':
    c.text+' G10 n’est pas activée dans cette campagne. Rejoignez le dépôt pour consulter son activation après G8 ou G9.'):
    inherited11?'Programme issu de G'+c.generation+', conservé dans cette campagne G11. Une fiche ne garantit pas un emplacement sur chaque graine. Seuls les lieux réellement repérés figurent ci-dessous.':c.text});
 }
 function canOpenTerritories160(game,programmeId){
  const c=capability(programmeId);
  if(!c?.context160||!canNavigate(game)||typeof game.expansionUI?.open!=='function'||
   typeof game.worldOps131?.previewTerritories160!=='function'||typeof game.worldOps131?.activateTerritories160!=='function')return false;
  return [8,9].includes(game.frontier?.position?.().generation);
 }
 function openTerritories160(game,programmeId){
  if(!canOpenTerritories160(game,programmeId))return false;
  // Only navigation: the controller retains its preview, physical guards and
  // explicit activation button. Reading a Codex card never runs that action.
  return game.expansionUI.open('world131')!==false;
 }
 function knownProgrammes(game){
  const frontier=game?.frontier;if(typeof frontier?.discoveries!=='function'||typeof frontier?.world!=='function')return [];
  const known=new Set(frontier.discoveries());if(!known.size)return [];
  return [...new Set((frontier.world()?.pois||[]).filter(p=>known.has(p.id)).map(p=>p.programme3000||p.codex).filter(id=>R?.get(id)))];
 }
 function placeAction(game,programmeId,placeId,kind='map'){
  if(!['map','pin'].includes(kind)||!canNavigate(game)||!knownPlaces(game,programmeId).some(p=>p.id===placeId))return false;
  const ui=game.frontierUI;if(typeof ui?.open!=='function'||typeof ui.atlas?.focusPOI!=='function'||kind==='pin'&&typeof game.frontier?.pin!=='function')return false;
  if(ui.open()===false||ui.atlas.focusPOI(placeId)===false)return false;
  return kind==='pin'?game.frontier.pin(placeId)===true:true;
 }
 function choiceContext(game){return game?.world?.buildings?City.context(game):null;}
 function choiceStatus(game,key,context=choiceContext(game)){
  const item=choices.get(key);if(!item||!game?.world?.buildings)return null;
  const state=City.status(item,context),missing=[];
  if(!state.known)missing.push('Âge '+(item.tier+1)+' à atteindre : '+C.CITY_TIERS[item.tier].name+'.');
  if(state.missingBuildings.length)missing.push('Supports achevés manquants : '+state.missingBuildings.map(id=>C.BUILDINGS[id]?.name||id).join(', ')+'.');
  if(Object.keys(state.missing).length)missing.push('Manque '+COST_SOURCE[item.payment]+' : '+resourceText(state.missing)+'.');
  if(state.storageShortfall)missing.push('Capacité nécessaire : '+state.minimumStorage+' par ressource ; '+game.storage+' actuellement.');
  if(state.missingInsight)missing.push(state.missingInsight+' point(s) d’analyse manquant(s).');
  return Object.freeze({...state,conditions:Object.freeze(state.extraConditions.map(c=>c.text)),text:state.completed?'Doctrine déjà acquise.':missing.length?missing.join(' '):
   'Âge, supports et matériaux de base présents ; conditions physiques, plans et opération restent à vérifier dans le contrôleur.'});
 }
 function openChoice(game,key,document){
  const item=choices.get(key),ui=game?.cityCatalogueUI150;
  if(!item||!canNavigate(game)||typeof ui?.open!=='function'||typeof ui.selectAge!=='function')return false;
  if(ui.open()===false||ui.selectAge(item.tier)===false)return false;
  const card=[...(ui.element?.querySelectorAll?.('article')||[])].find(n=>n.dataset.choice===key);
  if(card){const group=card.closest('details');if(group)group.open=true;const button=card.querySelector('button');button?.focus?.({preventScroll:true});card.scrollIntoView?.({block:'nearest',inline:'nearest'});}
  else document?.getElementById?.('cityCatalogueAge150')?.focus?.({preventScroll:true});
  return true;
 }
 function availabilitySummary(){let missingPlan=0,unsupported=0,contextual160=0,historicalMissingPlan=0,historicalUnsupported=0;
  for(const record of R?.records||[]){const c=capability(record.id);if(!c.hasPlan)missingPlan++;if(!c.eligible)unsupported++;if(c.context160)contextual160++;if(!c.historicalHasPlan)historicalMissingPlan++;if(!c.historicalEligible)historicalUnsupported++;}
  return Object.freeze({programmes:R?.records.length||0,choices:choices.size,missingPlan,unsupported,contextual160,historicalMissingPlan,historicalUnsupported});}
 return Object.freeze({entries,catalogue,capability,programmeStatus,canOpenTerritories160,openTerritories160,knownPlaces,knownProgrammes,canNavigate,placeAction,choiceContext,choiceStatus,openChoice,availabilitySummary});
});
