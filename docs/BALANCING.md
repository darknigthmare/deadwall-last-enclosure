# Équilibrage de référence

## Campagne — 1.51

Les nouveaux âges exigent un crédit de développement diversifié et des conditions de population, ravitaillement, exploration et survie. Les répétitions gardent leur score physique et leur effet sur la signature, mais leur contribution au développement est plafonnée par modèle. Voir [LIVRAISON_1_51.md](LIVRAISON_1_51.md) et les règles de `core.js`. La cible Standard de 6 à 10 heures devra être confrontée à des campagnes humaines ; les simulations de cadence sont des bornes optimistes.

## Extension des âges — 1.50

Les valeurs autoritaires sont dans `core.js` : `CityContent150`, `Infrastructure.SURFACES`, `FortificationPackRules.mechanisms` et `CompanionPackRules.exercises`. Les paliers, coûts et supports affichés proviennent de ces objets ; le guide [LIVRAISON_1_50.md](LIVRAISON_1_50.md) explique les contreparties. Les six évolutions gardent l'emprise et la proportion de santé, avec le coût d'évolution ordinaire du moteur.

Le parc solaire produit pendant la phase calme seulement. L'accumulateur de front commence vide. Les armes consomment les munitions communes et les soins consomment les médicaments. Les serres éclairées suppriment l'intrant bois de la conserverie au prix d'un autre rendement et d'une demande électrique supérieure. Les routes avancées accélèrent aussi les ennemis, et leur rénovation exige paiement et travail réel. Ces options nécessitent des essais de campagne humaine pour affiner les arbitrages ; des scènes automatisées préparées ne mesurent pas une campagne complète.

## Ressources initiales — Standard

| Bois | Ferraille | Pierre | Nourriture | Carburant | Munitions | Médicaments |
|---:|---:|---:|---:|---:|---:|---:|
| 180 | 120 | 70 | 130 | 45 | 180 | 12 |

Le mode Survivant ajoute 50 bois, 35 ferraille, 50 nourriture et 50 munitions. Le mode Brutal conserve la réserve initiale, mais réduit le rendement de collecte et renforce les attaques.

## Formule des vagues

```text
base = 10 + vague × 5 + vague^1,62 × 2,35
attraction = 1 + clamp(signature / 360, 0, 0,8)
total = max(8, floor(base × multiplicateur_difficulté × attraction))
```

Le nombre de fronts augmente d'un tous les trois niveaux et atteint quatre fronts. L'intervalle vaut `clamp(0,52 − vague × 0,012 ; 0,07 ; 0,52)` seconde. Le plafond simultané est de **720 infectés** ; les autres contacts restent dans dix compteurs et un tampon de 64 apparitions maximum. Les anciens budgets à huit types reçoivent seulement deux comptes nuls à la reprise.

Les profils deviennent éligibles aux vagues : Errant 1, Infecté récent 2, Briseur 3, Protégé 4, Rampant 5, Traqueur 6, Hurleur 7, Engorgé 8, Porte-bouclier 9 et Fonceur 11. Les poids exacts sont dans `ENEMY_RULES.waveWeights` ; les profils spéciaux partagent au plus 82 % du total, puis les arrondis laissent le solde aux Errants. Les nouveaux profils ne gonflent pas le nombre total d'une vague.

La santé suit `santé_base × difficulté.enemyHealth × (1 + clamp(log2(max(1, vague)) × 0,055 ; 0 ; 0,34))` : hausse liée aux vagues plafonnée à 34 %, sans boss à santé infinie.

Depuis Aube & Bastions, le premier calme vaut `(210 + durée_historique_du_scénario − 82) × difficulté.calmTime` : 210 secondes en classique Standard. Les jours suivants valent `max(180, 240 − (vague − 1) × 1,25) × difficulté.calmTime`. La reprise conserve le temps restant. L’alerte de base dure 10 secondes, ou 15 avec reconnaissance ; la vigie peut ajouter son bonus non cumulable. La sécurisation dure 8 secondes. Les valeurs historiques du moteur avant extension étaient 82 secondes puis `max(38, 84 − vague × 1,15)` ; elles ne décrivent plus le cycle intégré.

## Difficultés

| Mode | Nombre | Santé | Dégâts | Rendement | Temps calme |
|---|---:|---:|---:|---:|---:|
| Survivant | 0,72 | 0,85 | 0,75 | 1,30 | 1,20 |
| Standard | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 |
| Brutal | 1,35 | 1,15 | 1,30 | 0,85 | 0,82 |

## Signature

```text
signature = score_bâtiments
          + population × 2
          + consommation_électrique × 2
          + nombre_de_structures × 0,35
```

La signature influe uniquement sur la quantité des contacts ; elle ne renforce pas artificiellement chaque ennemi.

## Paliers

| Palier | Score requis |
|---|---:|
| Refuge | 0 |
| Camp fortifié | 10 |
| Avant-poste | 24 |
| Forteresse | 48 |
| Ville | 85 |
| Grande ville | 135 |
| Métropole | 210 |
| Grande métropole | 420 |
| Mégaville I | 750 |
| Mégaville II | 1200 |
| Mégaville III | 1850 |

Les segments de mur rapportent un faible score afin qu’une enceinte aide à progresser sans permettre de débloquer rapidement toute la technologie en construisant uniquement des palissades. Les âges utilisent le pic du score achevé ; aucun minimum de population ou de vague ne les conditionne. La répétition de bâtiments précoces reste possible : il faut la distinguer d’une cité viable. Le tableau décrit le catalogue installé courant ; les seuils sont conservés par la passe 1.49.

## Énergie

```text
ratio = production / demande, borné entre 0 et 1
```

Ce ratio décrit le réseau global, pas le rendement uniforme de tous les bâtiments. La distribution réelle sert d'abord les défenses, puis la clinique, les industries et les autres consommateurs ; la priorité choisie départage les bâtiments d'une même catégorie. Les défenses ont besoin de leur allocation complète pour tirer. Une industrie incomplètement alimentée utilise `part_reçue × 0,35`, ou `× 0,7` avec Réseau prioritaire ; elle ne produit pas si ce facteur est inférieur ou égal à 0,05. À pleine allocation, son facteur est 1.

Le centre fournit 8 unités d'énergie ; chaque générateur ajoute 24 tant qu'il reste du carburant. Un générateur consomme 0,018 carburant/seconde, ou 0,0135 avec Réseau prioritaire. Un délestage choisi lors de Noir électrique réduit encore de moitié la production des industries électriques pendant sa durée.

Le stockage est un plafond par ressource : 500 au centre, +600 par entrepôt terminé. Une industrie dont la sortie est saturée ne consomme pas ses intrants ; à capacité partielle, production et consommation diminuent dans la même proportion. Les ouvriers conservent la cargaison non déposée. Les fermes produisent 0,42 nourriture/seconde à plein rendement ; les autres débits restent centralisés dans `BUILDINGS`.

## Population et nourriture

```text
consommation = population × 0,0065 nourriture / seconde
```

La population comprend le commandant et les unités vivantes. À nourriture au plus 0,01, le moral perd 0,7 point/seconde ; sinon il regagne 0,08 point/seconde, dans [0 ; 100]. Sous 20 % de moral, la vitesse des unités tombe à 82 %.

Les recrutements consomment une place de logement et les coûts de `SURVIVORS` : ouvrier 25 nourriture ; fusilier 15 nourriture, 20 munitions, 10 ferraille (caserne, palier 1) ; secouriste 35 nourriture, 8 médicaments (clinique, palier 2) ; ingénieur 35 nourriture, 35 ferraille (atelier, palier 2). Les soins et réparations des spécialistes consomment ensuite les stocks, à l'inverse d'un bonus gratuit permanent.

## Pression des corps

- mort normale près d’un mur : +1 ;
- infecté protégé : +2,2 ;
- Engorgé : +3,4 ;
- avec Brigades sanitaires : +0,65 pour chaque profil ;
- érosion passive de 0,012 unité/seconde ; un ouvrier au contact déblaye 0,9 unité/seconde ;
- franchissement quand la charge est strictement supérieure à `15 + (id_infecté % 18)`, soit un seuil de 15 à 32 ;
- seuls les infectés récents et rampants exploitent les rampes.

Les 48 décors de quartiers ajoutent de petites réserves éloignées du centre ; leurs valeurs sont dans `SCENERY_DEFS`. Le plafond observé de 6,72 % des réserves historiques provient d'un échantillon de 133 graines, pas d'une preuve exhaustive. Voir [WORLD_CONTENT.md](WORLD_CONTENT.md).

Les six doctrines s'achètent instantanément une seule fois, contre ressources et points d'analyse, sans branche exclusive. Les points gagnés à la fin d'une vague valent 1, plus 1 aux multiples de cinq. Les quatre crises utilisent les coûts et effets explicites de `CRISIS_CHOICES` ; leur décision expire après 45 secondes sur le choix B sans dépense préalable. Voir [AUDIT_COMMERCIAL.md](AUDIT_COMMERCIAL.md).

## Philosophie de réglage

### Entretien des structures

`MAINTENANCE_RULES` conserve les valeurs historiques : réparation individuelle = plafond(dégâts / 45) ferraille, plus plafond(ratio de dégâts × 12) bois pour une palissade ou plafond(ratio × 16) pierre pour un rempart en béton. Amélioration = coût du modèle suivant × 0,72, arrondi supérieur par ressource ; le ratio de dégâts est conservé. Réparation collective des seules défenses achevées vivantes = plafond(dégâts / 85) ferraille, / 180 bois et / 220 pierre.

Le démontage demande désormais une confirmation. Son remboursement potentiel garde le coefficient 0,4 arrondi supérieur par ressource, puis est limité à l’espace réellement disponible. Retirer un entrepôt réduit la capacité ; l’excédent déjà présent est annoncé avant confirmation et écrêté immédiatement lors du démontage, au lieu d’attendre le prochain tick économique. Les chantiers n’apportent aucune capacité avant leur achèvement. Aucun coût n’est prélevé pendant l’aperçu.

### Opérations facultatives

Les six opérations narratives facultatives donnent chacune soit 1 insight contre un coût sectoriel, soit au plus 4 moral contre 8 nourriture et la présence d’un équipier vivant. Un relevé demande 8 secondes actives à moins de 90 unités du centre du secteur ; une décision demande le retour accessible à moins de 180 unités du dépôt. Chaque choix est unique et ne crée aucune ressource. Les règles exactes sont centralisées dans `NARRATIVE_RULES` / `NARRATIVE_OPERATIONS` ; la borne technique d’insight est `RESEARCH_INSIGHT_MAX`. Voir [NARRATIVE.md](NARRATIVE.md).

- rendre chaque nouvelle enceinte utile sans la rendre absolue ;
- augmenter surtout le nombre, les fronts et la durée ;
- conserver des ennemis lisibles et vulnérables ;
- créer des choix entre croissance, énergie, munitions et signature ;
- empêcher les blocages définitifs grâce à une production minimale et aux récompenses de vague ;
- garder un début actif, puis déplacer progressivement l’attention vers le commandement.

## Équipes de récupération 1.10

Bureau et entrepôt achevés ; deux places par entrepôt, quatre au maximum. Coût : 4 nourriture par aller-retour. Sac : 10, prélèvement local : 1,5/seconde ; aucun multiplicateur caché de difficulté. Réserve Dayworks finie, rations non remboursées, aucune récompense de fin. Coûts des quatre nouveaux ensembles : somme des constructions dans `Dayworks.PLANS`, sans remise. Détail dans SALVAGE_1.10.md.

## Extension 1.11

Les paliers et l’éclairage actuels sont détaillés dans VILLES_SANS_LUNE_1.11.md. Les anciens seuils 0/10/24/48/85/135/210 sont conservés ; 420/750/1200/1850 prolongent la croissance. Le plus haut score construit débloque durablement les connaissances, sans préserver les capacités des bâtiments perdus. Nuits noires : 4 + 3k.


## Nuits et accompagnateurs — 1.26

Les seules valeurs de gameplay de l’éclairage autonome résident dans `DeadwallCore.NightGearRules` : coût, portée en mètres, durée en secondes de simulation, recharge, pluie et limites. Les appareils consomment du matériel existant ; aucun stock n’est offert par migration. Le partage de la ceinture doit être vérifié dans les deux sens avec les kits essentiels. Pause et menus modaux ne doivent pas user les appareils.

Les compagnons utilisent `WorldEvolution.RULES.companionRules` : portées, coût d’affectation, médicaments par point de vie, ferraille par réparation, munitions et cadence. Ils ne fabriquent pas de ressources. La pression des hordes doit rester fondée sur les effectifs, fronts et accès physiques.

## Compléments 1.27

Les cinq familles ont leurs constantes dans `ExplorePackRules`, `SurvivalPackRules`, `FortificationPackRules`, `CompanionPackRules` et `CampaignPackRules` de `src/core.js`. Les nouvelles réserves sont financées par le joueur ou retirées de gisements finis. Les contrats ont coûts, opportunités limitées et récompenses uniques ; les entraînements ne sont pas hérités par une nouvelle campagne.

La vérification automatisée couvre conservation, expiration, conditions de travail, plafonds et reprise. Elle ne remplace pas un équilibrage de plusieurs campagnes jouées par des humains. Les variantes de difficulté, la progression des hordes et les seuils de bâtiments existants sont conservés.


## Terrain et succession — 1.33

`TerrainRules133` centralise la rétention des gisements des nouvelles campagnes (0,62), le rayon de dégagement (850 unités locales), les deux réserves de départ par type, l’espacement (70), la marge végétale (12) et la cible de 70 petits décors. Il ne redistribue pas les stocks d’une ancienne sauvegarde.

`SuccessionRules` fixe le risque de réanimation à 30 %, le délai à 75–150 secondes actives, la reprise physique à 1,8 m, et la protection initiale de relève à 3 secondes. Les trois profils sont éclaireuse (90 PV, vitesse +8 %, capacité 32), manutentionnaire (100 PV, vitesse −6 %, capacité 44) et bâtisseuse (100 PV, vitesse −2 %, capacité 38, construction manuelle +15 %). Le premier commandant conserve son profil 100 PV / capacité 36. Les réquisitions de pistolet, fusil et fusil à pompe coûtent 8, 20 et 16 ferrailles, avec les paliers d’armes existants ; elles n’ajoutent aucune cartouche.


## Armement et interventions — 1.34

`Arsenal134Rules`, `InterventionRules134` et `BarricadeRules134` dans `src/core.js` centralisent portée, dégâts, cadence, munitions, masse, usure, coûts et durées. Le guide d’armement est dérivé directement du catalogue. Les règles et contreparties sont détaillées dans `ARSENAL_1_34.md`, `INTERVENTIONS_1_34.md` et `BARRICADES_1.34.md`.


## Écologie — 1.35

`BiomeRules135` et `GeographyRules135` centralisent les poids de milieux, d’essences, de gabarits et d’infectés, les rendements finis, les espacements et les dimensions régionales. Les milieux modifient les surfaces existantes herbe/sous-bois/boue/gravier ; les routes et intérieurs gardent leur priorité. Les six profils de contacts régionaux restent à 42–65 PV et n’ajoutent pas de monstres à vie démesurée. Les tableaux du codex sont dérivés directement des règles.

## Règles effectivement appliquées — 1.36

La passe de correction conserve les coûts et statistiques des catalogues. La crosse régionale applique la valeur existante de 36 dégâts uniquement avec une arme à feu en main ; les poings conservent 18 dégâts. Porter une arme sans la tenir ne donne plus le bonus. Les outils et armes de mêlée restent régis par leur propre portée, angle, endurance, usure et cadence dans `Arsenal134Rules`.

La relève utilise désormais l'atelier temporisé du même arsenal : pistolet 8 ferrailles et 6 secondes, fusil 20 ferrailles et 8 secondes, fusil à pompe 16 ferrailles et 8 secondes. Ces valeurs sont dérivées du coût du profil et de `craftSeconds + ceil(kg)`, et non d'une nouvelle table de réquisition. Le retrait d'un objet prêt ne paie pas une seconde fabrication et n'offre aucune cartouche. Poids, palier, accès au dépôt, menace et occupation des mains continuent de conditionner l'action.

La reconnaissance G6 retrouve ses règles existantes : 5 rations, 40 secondes de travail effectif, au plus 3 indices par analyse et 6 étapes par tournée. Les anciens dossiers valides ne sont ni remboursés ni réinitialisés au chargement. Un groupe détruit ou cannibalisé refuse le service avant de consommer du carburant ; l'annulation d'une tentative déjà engagée conserve le coût d'intervention existant. Les nouvelles illustrations, textures et optimisations de carte ne modifient ni rendements ni collisions ni santé des objets.

## Respect des règles existantes — 1.37

Aucune statistique d’arme, aucun coût, rendement, seuil de biome ni schéma de sauvegarde n’est ajouté. Les actions vérifient mieux les mains occupées et la disponibilité du support. Un coup multicible distribue les dégâts existants à chaque cible sélectionnée, sans les concentrer par erreur sur la première. La touche de fouille interrompt la barricade avant une deuxième activité. Le rayon d’un bus ou d’un camion est celui du profil déjà employé pour sa conduite, y compris avant son achat.

## Transactions et obstacles — 1.38

Aucun coût ni statistique du catalogue n’est changé. Une tentative d’intervention payée reste consommée lorsqu’elle est interrompue, y compris par une modale ; une action refusée avant démarrage n’est pas débitée. Une barricade paie une seule fois après achèvement. Une balle interceptée conserve son coût de munition et son usure, et inflige ses dégâts à la barricade au lieu de naître derrière elle. Un refus de conduite contre une annexe ne consomme pas de distance ni de carburant. Les textures et ombres sont uniquement décoratives.


## Mains occupées et relève — 1.39

Coûts, santé, dégâts, cadence, usure, portée et catalogues restent inchangés. Une action refusée ne débite ni sac ni dépôt. La recharge finit avec ses règles et munitions habituelles avant le travail manuel. Une intervention payée avant un décès reste consommée ; une barricade inachevée ne prélève pas son paiement de fin. Les menaces réanimées ou sauvages utilisent leurs statistiques existantes. Les deux nouvelles silhouettes de véhicule n’ajoutent aucune capacité.


## Consolidation 1.40

Aucun nouveau coût, dégât, durée, portée, cadence, rayon, plafond ou rendement. Les refus matériels préservent le paiement existant, et les devis d’annexes réemploient les formules historiques. Le compteur de dépôt observe la quantité acceptée, sans accorder de ressources supplémentaires. Les deux nouveaux sprites suivent les profils de véhicule existants.


## Communautés et programmes territoriaux — 1.41

GeographyRules141, WorldTownRules141 et EcologyRules141 centralisent les nouvelles valeurs G7. Elles ne rééquilibrent pas les anciennes quantités. D17 est positionné entre 23 % et 77 % des axes de la région ; les tailles, coûts, santé et réserves des 62 plans restent ceux du catalogue. Les neuf communautés modulent les probabilités et regroupements du scatter G7, sans ressource renouvelable ni bonus à la migration. Les anciens biomes et profils d’infectés gardent leurs statistiques. La tournée par biome occupe les six emplacements existants, sans coût ni révélation gratuite. Le budget de déplacement G7 distingue les longueurs et taux de carburant locaux/régionaux existants, avec la marge historique.


## Repli et récompenses — 1.43

Les coûts, rendements, portées, dégâts et critères des huit objectifs restent ceux du catalogue. Une récompense d’objectif ne disparaît plus dans un dépôt saturé : elle reste en attente jusqu’à ce que chaque ressource puisse être reçue en entier. L’objectif accompli reste acquis pendant cette attente, même si sa construction est ensuite détruite. Dépenser des matériaux ou augmenter la capacité permet son versement, sans dépasser le plafond.

Le repli vers une redoute conserve la vitesse et la riposte des sections ; il suspend la poursuite et exige des accès physiques. Une porte verrouillée peut bloquer le trajet. Aucun déplacement instantané, soin ou munition supplémentaire n’est accordé.

## 1.46 — Veille & expéditions

Les contacts de carte utilisent `VisibilityRules146` : commandant20m ; worker/medic/engineer10m, soldier16m ; lea24/samir12/ines12/malik18m. Postes core/barracks12, clinic/workshop10, watchtower22, turret14, heavyTurret18m. Annexes watch22/clinic10/workshop10/depot10/housing8m. Ambiance = .2+.8×daylight, blackout minimum. Une lumière physiquement reçue rend la portée diurne possible sans ajouter d’observateur. Portées torche9m/cone.52rad, phare22m/cone.46rad ; facteur de détection du projecteur .94 existant. Cellule d’index16m, conversionD17 32unités/m, rayon ligne régionale.015m. Aucune augmentation par zoom ni inflation de PV ennemi.

Survie : ration2s/food2/stamina30 ; relève abritée20s/food6+medicine1/heal30 ; petit pansement3s/medicine1/heal9 en15s (.6PV/s historique). Support et gain utile revalidés, risque pendant le travail. Exploration compact3s/wood1+scrap1/amount12/speed.86, au-dessus12 speed.72 conservée ; stash3s capacitécache54, transfert physique fini, aucun dépôt compté.

Fortification : ammoCompact12, ammo12+wood2+scrap2, tier1 ; netWide24, wood26+scrap16, tier2+workshop. Caisson24/filet12 historiques inchangés. Exercices escort60s/food24+scrap14/gap.7 aprèsspécialité ; support75s/food30+scrap20+ammo8 aprèsescorte, Tenir+Défense : Malikrange8, services1.15/scout1.1. Les anciens entraînements restent valides sans bonus gratuit.

Contrats uniques, délai3changementsdevague : medical12s feefood6+medicine6 fieldScrap2 rewardinsight2+morale3 ; recovery14s feefood8 fieldScrap5 rewardmedicine8+ammo18. Récompense après trajet réel, colis fragile et frais perdus à l’échec. Relais de veille : wood215/scrap135/ammo40/food10 ; cour de soins : wood165/scrap175/medicine8/fuel20/food10. Chaque ensemble quatre chantiers à financer et construire, coûts intégralement issus du catalogue, sans réduction automatique.

Les règles de génération G1–G7, stocks initiaux, plafonds de santé et pression des fronts/échelons restent conservés. Les nouveaux contenus offrent des choix de préparation et de transport ; leurs coûts n’altèrent pas les seuils des âges. Voir guide1.46 et rapport courant pour les preuves effectives.

## 1.47 — Fronts & ravitaillement

Profils `pincer` minWave10 et `flank` minWave13 : interval1, poids ordinaires, total inchangé. Tenaille oppose le front initial au premier échelon, côtés latéraux au deuxième puis quatre fronts au troisième. Débordement : initial, latéraux, opposé. Les deux pauses6s, cap720 et buffer64 restent inchangés. Le profil `breakers` applique son poids2.8 au vrai `breacher` ; ses autres poids et sa cadence1.12 sont conservés. Aucun PV, dégât ou type supplémentaire.

Appoint ammo : amount6, seconds6, bagammo6+wood1+scrap1, plafond24. Appoint repair : amount80, seconds8, bagscrap4+wood2, plafond200. Quantité limitée par la place, chaque coût arrondi au supérieur au prorata ; paiement final unique. Tolérance de déplacement2unités locales, reach72, danger145 et pasmax.25s existants. La cassette conserve sa réparationmanuelle8points/s ; l’appoint ne soigne pas le support directement. Aucun débit du dépôt ni gain de cadence.

Les consultations n’ajoutent ni information de position ennemie hors vision physique ni dépense/RNG. Les échelons restent un plan annoncé et le total vivant un compteur du directeur. Seuils urbains, géographie G1–G7, stocks initiaux et rendements historiques conservés.


## 1.48 — Bastions & ateliers

Avant-porte hérissée : 17 fondations, wood255/scrap119/ammo40, palier1. Redoute de maintenance : 27 fondations, wood270/scrap520/stone105/ammo40/fuel20, palier2. Sommes exactes du catalogue de constructions, sans réduction ni équipement supplémentaire ; côtés ouverts, passages conservés et chantier physique obligatoire.

Montages au Hérisson : ankle8s/bagwood6+scrap10/6charges/damage12/hold2.5s/cooldown1s/tier1 ; blades12s/bagwood6+scrap18/6charges/damage28/cooldown.7s/tier2+atelier. Reach22unités depuis le bord, avec rayon réel du contact et ligne physique libre ; maximum un impact par support et par tick. L’entrave utilise le ralentissement historique stagger ; dégâts et attaques des autres effets ne sont pas multipliés. Supports perdus, travail interrompu et changement de campagne n’offrent aucune réserve.

Porte-bouclier : health90/speed29/damage15/rate.7/radius12/unlock9/structure1/corpse1. Arc frontal55° de chaque côté, balle×.35 ; flanc/dos/mêlée/pièges×1. Fonceur : health64/speed42/damage13/rate.9/radius10/unlock11/structure1/corpse1 ; préparation.65s immobile, ruée.7s droite×2.2, récupération3s×.55 ; pas de mouvement borné à5unités. Aucun bonus d’impact contre les structures. Poids shielded .02+.001(vague−9), max.045 ; charger .025+.0015(vague−11), max.05. Masse totale, cap720, buffer64 et plafond partagé spécial.82 conservés.

Recettes : assemblyHammer wood4/scrap12/7s/2.1kg, tier2+atelier, barricade×1.45/usure de travail.18point/s ; wreckingBar wood3/scrap18/8s/3.7kg, tier2+atelier, dismantle×1.5/usure de travail.22point/s ; singleShot wood6/scrap18/7s/2.4kg, tier1, damage68/rate.6/range28m/magazine1/reload1.9/spread.025/wear.35. Coût et usure centralisés dans `Arsenal134Rules.catalog` ; durées dérivées de craftSeconds4+ceil(kg). Aucun remboursement accru ni munition offerte. L’ancien catalogue et les autres opérations conservent leurs valeurs.

Ces valeurs créent des contreparties testables, pas une preuve d’équilibrage humain ou de cadence sur tout appareil. Les cas avancés préparés et les parcours natifs ont des preuves distinctes dans les rapports courants.
