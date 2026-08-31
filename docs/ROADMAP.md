# Roadmap de production

Le jeu actuel utilise un moteur Canvas 2D/2.5D, livré en application Windows Electron autonome et en navigateur/PWA. Une présentation commerciale ne nécessite pas, à elle seule, un changement de moteur. Ce document sépare les systèmes présents des pistes futures ; il ne constitue ni un engagement de contenu ni une certification de sortie.

## Déjà présent dans la base actuelle

- mode graphique léger, contraste, mouvements réduits et volume persistants ;
- sauvegarde/reprise et export/import JSON validés, avec secours ;
- ordres ouvriers dont déblaiement physique et repli ;
- portes automatiques, ouvertes ou verrouillées et diagnostic de périmètre ;
- six doctrines et records locaux, dix campagnes récentes ;
- secouristes et ingénieurs, soins/réparations payés sur stock ;
- six secteurs nommés, 48 vestiges récupérables et dossiers de terrain ;
- huit profils d'infectés, dix atlas/textures originaux et seize cycles animés ;
- édition PC hors ligne, sandbox et archives portables non signées.
- quatre conditions de départ, douze combinaisons avec les difficultés et records séparés ;
- trois sections de fusiliers, points indépendants, repli et raccourcis 4/5/6/G/T ;
- situation par front, alerte de proximité du centre et bilan de défaite mesuré.

Ces intitulés ne promettent pas de véhicules pilotables, de gestion de morsures, de population abritée automatiquement ou de coopération. Le récit et ses opérations sont documentés par leur module propre ; ils ne remplacent pas une campagne de combat intégralement scénarisée.

## Pistes — Consolidation de la version actuelle

- essais matériels élargis et suivi du budget de rendu sur petites configurations ;
- enrichissement des statistiques et des retours d'action selon les essais humains ;
- scénarios de non-régression supplémentaires pour imports et mises à jour ;
- affectations individuelles plus fines, au-delà des trois sections livrées ;
- variantes supplémentaires au-delà des quatre conditions de départ livrées.

## Pistes — Simulation urbaine avancée, non livrée

- routes logistiques visibles ;
- brouettes, chariots, camionnettes et camions ;
- métiers supplémentaires au-delà des secouristes et ingénieurs existants ;
- incendies et propagation ;
- eau potable, canalisations et contamination ;
- quarantaine, morsures et tests ;
- évacuation/fermeture administrée des quartiers, au-delà des sites nommés actuels ;
- opérations de reconquête rue par rue ;
- avant-postes reliés à la cité.

## Option distincte — Port 3D semi-réaliste, non implémenté

### Exemple de cible à évaluer

Une réécriture sous Unreal Engine 5 pourrait être étudiée, avec :

- caméra troisième personne et vue stratégique continue ;
- World Partition ;
- Mass Entity pour les foules ;
- Niagara pour poussière, pluie, fumée et impacts ;
- Navigation Invokers et coûts de zones pour les hordes ;
- DataTables reprenant `src/core.js` ;
- Instanced Static Mesh pour les remparts ;
- sauvegarde versionnée reprenant le schéma actuel ;
- Blueprints privilégiés, C++ uniquement pour les systèmes de foule et de sauvegarde nécessitant des performances supplémentaires.

Aucun projet Unreal, Blueprint, système Mass, Niagara ou port Godot n'est livré ici. Ce chantier demanderait une décision séparée, une production d'assets adaptée et ses propres tests ; il n'est pas une condition déclarée pour vendre une édition 2D aboutie.

### Verticale 3D initiale

- dépôt routier central ;
- personnage, récolte et portage ;
- dix bâtiments ;
- palissade traçable ;
- ouvriers ;
- fusiliers ;
- cent à cinq cents zombies ;
- brèche et repli ;
- sauvegarde ;
- cycle jour/nuit.

## Pistes lointaines — Mégacité et sièges, non livrées

- remparts habitables ;
- voies ferrées internes ;
- casernes intégrées ;
- artillerie et dépôts de munitions ;
- milliers d’habitants simulés par niveaux de détail ;
- migrations visibles à plusieurs kilomètres ;
- sièges durant plusieurs jours ;
- plusieurs fronts commandés en coopération.

## Pistes — Modes supplémentaires, non livrés

- campagne scénarisée ;
- variantes du mode infini déjà jouable ;
- simulation réaliste ;
- scénarios spécialisés ;
- coopération jusqu’à quatre joueurs ;
- défis hebdomadaires locaux ou serveur optionnel sans avantage payant.

## Sortie commerciale : travail distinct du contenu

Signature et identité éditeur, distribution choisie, conditions pour les joueurs, support, classifications éventuellement applicables et validation matérielle/humaine restent à préparer. Les limites sont consignées dans [DESKTOP.md](DESKTOP.md) et [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Un ZIP généré, un build vert ou un hébergement opérationnel ne valent pas certification commerciale.
