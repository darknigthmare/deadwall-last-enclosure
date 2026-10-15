/* Source-room roles for additive revision 12. Classification grants no service,
 * stock or equipment: the density owner still validates placement and access. */
(function(root,factory){'use strict';const api=factory();root.DeadwallCodexUsage163=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const ROLES=Object.freeze(['sleeping','dormitory','archives','storage','changing','reception','office',
  'workshop','kitchen','medical','laundry','living','dining','classroom','technical','retail','bathroom','sport']);
 const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[’'_-]+/g,' ').replace(/\s+/g,' ').trim();
 function kinds(source){
  const found=new Set();
  for(const values of [source?.sourceProps158,source?.authoredProps,source?.props]){
   if(!Array.isArray(values))continue;
   for(const item of values){const id=item&&typeof item==='object'?(item.kind||item.asset):null;
    if(typeof id==='string'&&id)found.add(id);
   }
  }
  return Object.freeze([...found].sort());
 }
 function classify(source,context={}){
  if(!source||source.exterior===true)return null;
  const name=norm(source.name),inventory=kinds(source),has=(...ids)=>ids.some(id=>inventory.includes(id));
  if(!name||!inventory.length)return null;
  const family=norm(context.family),programme=norm(context.programmeName);
  const result=(id,confidence,...evidence)=>Object.freeze({id,confidence,evidence:Object.freeze(evidence)});
  const bench=has('workbench','sawBench','clampRack','steelTable','worktable','toolbox');
  const writing=has('desk','officeDesk'),table=has('table','steelTable','worktable');
  const storage=has('shelf','bookshelf','crate','crateStack','pallet','palletStack','wardrobe','smallCabinet',
   'fridge','electricalRack','medical','fuel','timberRack','logs','tirePile','bed','sterilizer');
  const stockName=/\b(stock|stockage|reserve|rangement|rayonnage|entrepot|cellier|garde manger|magasin de pieces)\b/.test(name);
  const documents=/\b(archive\w*|documentation|document\w*|bibliothe\w*|livres?|registres?|dossiers?|index|actes|papiers|classement|lecture)\b/.test(name);
  const documentaryUse=/\b(archive\w*|documentation|bibliothe\w*|livres?|registres?|index|actes|classement|lecture)\b/.test(name);
  const simulation=/\b(prototype\w*|essais?|simulation|simulateur\w*|demonstration)\b/.test(name);
  const educational=/education|connaissance/.test(family)||/\b(ecole|formation|enseignement|apprentissage)\b/.test(programme);
  const foodUse=/alimentation|restauration/.test(family)||/\b(restaurant|cuisine|cantine|boulangerie|patisserie)\b/.test(programme);
  const shop=/commerces?/.test(family)||/\b(boutique|magasin)\b/.test(programme);

  if(/^(vestibule|reception|accueil|entree|guichet|hall|sas|porche|salle d attente)\b/.test(name)&&
    (writing||has('counter','bench','chair','sign')))
   return result('reception','high','public-reception','reception-support');

  // A stock of sanitary/medical/electrical parts is still a stock. Its name
  // does not turn shelves into a washroom, clinic or powered plant.
  if((documentaryUse||documents&&(stockName||has('shelf','bookshelf')))&&(has('shelf','bookshelf')||writing||table))
   return result('archives','high','documentary-use','compatible-document-support');
  if(stockName&&storage)return result('storage','high','explicit-storage','compatible-stock-support');
  if(storage&&/\b(preparation|tri|reception|inspection|fermeture|composition)\b/.test(name)&&
    /\b(lots?|cartons?|coffrets?|paquets?|trousses|palettes?|colis|depart|restitutions)\b/.test(name))
   return result('storage','high','goods-handling','compatible-stock-support');

  const sanitaryParts=/\b(outils|modules?|cartons?|coffrets?|lots?|emballages|appareils|preparation|inspection|demontes|deposes|reconditionnement)\b/.test(name);
  if(/\b(wc|toilettes?|douches?|sanitaires?|salle d eau|salle de bain|cabine de lavage)\b/.test(name)&&
    has('sink','shower','toilet')&&!simulation&&!sanitaryParts)
   return result('bathroom','high','personal-washroom','sanitary-fixture');
  if(/\b(buanderie|blanchisserie|laverie|lingerie|lavage (du |des )?(linge|textile\w*))\b/.test(name)&&
    has('washer','sink')&&!simulation)
   return result('laundry','high','textile-washing','washing-fixture');

  const teaching=/\b(classe|salle de cours|enseignement|pedagogi\w*|formation|apprentissage|eleves?|atelier documentaire)\b/.test(name);
  if((teaching||educational&&/^(salle|atelier|poste|banc)\b/.test(name))&&
    (writing||table||bench||has('electricalRack','pump','machine')))
   return result('classroom',teaching?'high':'medium',teaching?'explicit-teaching':'education-context','learning-support');

  if(/\b(consultation|infirmer\w*|soins|clinique|urgence\w*|triage|sterilis\w*|hospitalisation|reanimation|dentaire)\b/.test(name)&&
    has('medical','dentalChair','sterilizer','bed')&&!simulation)
   return result('medical','high','care-use','clinical-fixture');
  const nonSleeping=/\b(chambre (noire|froide|climatique)|bains? de couleur|essais?|prototype\w*|module\w*|composant\w*)\b/.test(name);
  if(has('bed')&&!nonSleeping&&/\b(chambre|couchage\w*|dortoir|repos|logement|hebergement)\b/.test(name)){
   const collective=/\b(dortoir|collectif\w*|residents|couchages)\b/.test(name);
   return result(collective?'dormitory':'sleeping','high',collective?'collective-rest':'personal-rest','actual-bed');
  }
  if(/\bvestiaire\w*\b/.test(name)&&has('wardrobe','locker','bench')&&
    !/\b(outils|pieces|materiaux|prototype\w*|module\w*)\b/.test(name))
   return result('changing','high','personal-changing','clothing-support');

  if(/\b(cuisine|plonge|fournil|preparation alimentaire|preparation froide|cuisson des repas)\b/.test(name)&&
    has('fridge','oven','sink','steelTable','worktable')&&!simulation)
   return result('kitchen','high','food-preparation','kitchen-fixture');
  if(foodUse&&!simulation&&has('oven','sink','steelTable','worktable')&&
    /\b(preparation|table|pates|chauffe|lavage|cuisson|ustensiles)\b/.test(name))
   return result('kitchen','medium','food-context','food-work-support');
  if(/\b(repas|refectoire|cantine|salle de restauration|salle des convives)\b/.test(name)&&
    (table||has('chair','bench','fridge','counter'))&&!simulation)
   return result('dining','high','meal-use','meal-support');
  if(/^(salon|sejour|salle commune|vie commune|espace de detente|salle de detente)\b/.test(name)&&
    (table||has('sofa','bench','chair','tv')))
   return result('living','high','shared-living','living-support');

  if(/\b(technique|chaufferie|chauffage|pompes?|ventilation|electrique\w*|energie|groupe electrogene|maintenance)\b/.test(name)&&
    has('electricalRack','generator','pump','machine','fuel'))
   return result('technical','high','technical-use','technical-fixture');
  if(/\b(atelier|entretien|reparation|fabrication|assemblage|usinage|coupe|decoupe|taille|polissage|poncage|serrage|pressage|presse|outils|travail)\b/.test(name)&&bench)
   return result('workshop','high','material-work','work-support');
  if(/\b(gravure|poinconnage\w*|percage|soudure)\b/.test(name)&&(bench||has('machine')))
   return result('workshop','high','material-transformation','work-support');
  if(/\b(verification|controle|reglage\w*)\b/.test(name)&&
    /\b(appareils?|machines?|pieces|materiel|poinconnage\w*|assemblages?|outils)\b/.test(name)&&bench)
   return result('workshop','high','material-inspection','work-support');
  if(has('sink')&&/\b(lavage|nettoyage) (des |du )?(outils|pieces|bacs|materiel|contenants)\b/.test(name))
   return result('workshop','high','material-washing','work-sink');
  if(/\b(vente|boutique|rayon|caisse|clients?)\b/.test(name)&&
    has('counter','display','shelf','shelfEnd','wardrobe'))
   return result('retail','high','customer-sales','sales-support');
  if(shop&&/^(mur|table|vitrine|etagere|presentation|casier|salle des)\b/.test(name)&&
    (table||has('counter','display','shelf','shelfEnd','wardrobe')))
   return result('retail','medium','shop-context','goods-display-support');
  if(/\b(sport|gymnastique|gymnase|entrainement|exercice physique)\b/.test(name)&&
    has('bench','wardrobe','locker','shelf','crate'))
   return result('sport','high','physical-training','sport-support');
  if(writing)return result('office','medium','writing-desk');
  return null;
 }
 return Object.freeze({ROLES,kinds,classify});
});
