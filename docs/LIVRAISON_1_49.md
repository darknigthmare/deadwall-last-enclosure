# DEADWALL 1.49 — D-17, du refuge à la mégaville

Cette passe vérifie le développement de D-17 jusqu’au dernier âge existant, explique les limites du stockage et complète les graphismes de construction et d’architecture urbaine. La base est le commit `67bcb1f2f3adf90a4f76669e676cfb03cec90e73`, publié sur `main` pour la version 1.48. Les prix, seuils, ressources, collisions et sauvegardes restent ceux du jeu existant.

## Les onze âges effectivement jouables

| Âge | Score construit requis | Exemples de modèles ouverts à cet âge |
| --- | ---: | --- |
| Refuge | 0 | Dortoir, ferme, entrepôt, palissade |
| Camp fortifié | 10 | Caserne, générateur, scierie, recyclage, mirador |
| Avant-poste | 24 | Atelier, clinique, acier, maisons en bande, cour solaire |
| Forteresse | 48 | Béton, manufacture de munitions, immeuble, magasin central |
| Ville | 85 | Tourelle lourde, hôpital, halle, centre logistique |
| Grande ville | 135 | Centrale, usine de valorisation, cuisine industrielle |
| Métropole | 210 | Tour résidentielle, granulats, arsenal métropolitain |
| Grande métropole | 420 | Plateforme métropolitaine, ensemble résidentiel, centre hospitalier |
| Mégaville I | 750 | Grand ensemble fortifié, raffinerie urbaine, réserve électrique |
| Mégaville II | 1 200 | Tour de mégaville, complexe nourricier |
| Mégaville III | 1 850 | Centrale de mégaville, réserve stratégique |

Les noms et seuils proviennent de `DeadwallCore.CITY_TIERS` après installation des extensions. Les sept noms historiques ne décrivaient plus le catalogue courant. Le centre initial apporte déjà 8 points. Une fondation financée n’apporte aucun point avant son achèvement. Le meilleur score construit conserve les connaissances après une perte, tandis que logements, stockage, énergie et prérequis exigent toujours les bâtiments vivants et achevés. Aucun minimum de population ou de vague ne conditionne ces âges. Le dernier âge prolonge la construction et les hordes ; il ne termine pas la partie.

## Parcours et limites du diagnostic

Le parcours de régression finance les constructions par les transactions ordinaires, termine les travaux par les interactions réelles, vérifie les prérequis, les gains de capacité et les recrutements, puis exerce Sauvegarder et Continuer. Pour les étapes tardives, une réserve finie de scénario est explicitement préparée et transportée par le sac. Elle permet de vérifier les transitions sans prétendre jouer une campagne complète.

Le parcours navigateur sépare le début natif, commandé au clavier ou au tactile, des colonies tardives préparées à chaque seuil. Les images de ville et de dossier, les ressources, les sauvegardes et les erreurs du navigateur sont contrôlées séparément. Les résultats définitifs et les codes de sortie sont conservés après exécution dans `/workspace/deadwall-cloud/d17-audit-20261003/` ; les anciennes preuves 1.48 restent historiques.

## Combien de temps prend le développement ?

Il n’existe pas de durée fixe ni de dernière vague à attendre : les âges suivent les constructions, pas le calendrier. Le scénario classique Standard offre 210 secondes avant sa première alerte ; les calmes suivants durent `max(180, 240 − (vague − 1) × 1,25)` secondes, modulées par la difficulté. Les assauts ajoutent leur propre durée. Les pauses de gestion ne consomment pas de temps de simulation.

Un robot de déplacement et d’action, sans injection de stocks ni de score, atteint le Camp fortifié vers 3,52 secondes et l’Avant-poste vers 10,6 secondes dans neuf essais optimisés couvrant trois graines et trois difficultés. Une séquence navigateur distincte, avec véritables commandes et récolte/dépôt, atteint son premier Camp vers 13,34 secondes de simulation. Ces résultats révèlent des déblocages initiaux rapides ; ils ne sont pas des temps d’apprentissage humain.

Le parcours transactionnel dans la composition réellement livrée en G7 finance 60 chantiers au total, effectue 2 424 dépôts et reprend 12 sauvegardes identiques hors horodatage. Les dix seuils successifs sont franchis, puis la Centrale et la Réserve stratégique de mégaville sont achevées. Le travail manuel isolé dure 765,75 secondes jusqu’au dernier âge, soit **12 minutes 46 secondes** ; les deux bâtiments finaux portent le total à 802,75 secondes, soit **13 minutes 23 secondes**. Après l’Avant-poste, la réserve matérielle est préparée et finie, et les points de service sont positionnés par la fixture ; collecte tardive, déplacements, combats, recherche de placement et décisions sont exclus de cette durée. Le paiement total de ce parcours est de 14 765 bois, 32 960 ferrailles, 36 635 pierres, 625 carburants, 111 médicaments, 110 nourritures et 45 munitions.

La valeur `buildTime` du catalogue est une quantité de travail, pas une attente fixe. Le joueur apporte 3,7 unités par seconde au contact ; les ouvriers 1,05 chacun et le chantier dispose d’une progression passive de 0,075 par seconde. Accès, arrivées, doctrines et interventions peuvent changer le rythme effectif. Un dortoir à 18 unités se termine donc bien plus vite avec le joueur et les trois ouvriers déjà proches.

Les temps nominaux de production expliquent pourquoi la durée totale est bien supérieure au seul chantier : 1 000 bois demandent environ 34 min 43 s à une scierie à 0,48/s ; 1 000 ferrailles environ 46 min 18 s à un recyclage à 0,36/s ; 1 000 pierres environ 49 min 1 s à un concasseur à 0,34/s. Les industries avancées, les productions parallèles et la collecte accélèrent l’approvisionnement ; énergie, intrants, capacités, trajets et défenses peuvent le ralentir. Ces calculs à rendement nominal ne sont pas une simulation de toute l’économie.

**La durée humaine du Refuge à Mégaville III n’a pas encore été établie.** Aucune fourchette de plusieurs heures n’est annoncée sans campagne chronométrée. Les métriques et hypothèses reproductibles sont conservées dans le dossier `pacing/` de l’audit courant.

## Stockage et conditions d’exploitation

Le dépôt initial contient au plus 500 de chaque ressource. Un entrepôt achevé ajoute 600, donc un entrepôt porte la capacité à 1 100 et deux à 1 700. La tour de mégaville exige 1 600 pierres : un seul entrepôt ne suffit pas. Les bâtiments de stockage plus avancés peuvent aussi fournir cette capacité. Une fondation, même entièrement payée, ne fournit aucune capacité ; perdre le bâtiment la retire.

Le dossier Préparatifs affiche désormais la capacité requise et le stockage manquant pour chaque modèle concerné. Il ne dépense rien. Les nouveaux champs sont dérivés des coûts actuels et du stockage vivant, sans nouveau registre sauvegardé.

Un palier débloqué ne garantit pas une cité viable : alimentation électrique, carburant, intrants industriels, nourriture, logements, munitions, accès et défenses doivent fonctionner ensemble. Un prix de construction peut consommer la dernière réserve de carburant ; il faut alors ravitailler l’installation. Une raffinerie peut consommer plus de bois qu’une seule scierie n’en produit.

## Graphismes intégrés

Six images originales générées par OpenAI fournissent dix-sept sprites et une matière de cour : trois centres visuels, six gabarits de logements (2, 4, 8, 12, 15 et 20 niveaux), trois familles industrielles, hôpital et stockage, trois états de chantier, sol compacté. Les atlas natifs conservent leur transparence. Les centres changent de présentation selon l’âge connu ; ce changement décoratif n’accorde ni santé, ni énergie, ni surface supplémentaires. Les immeubles restent des volumes extérieurs, sans étages visitables ajoutés.

Le module `d17-art149.js` réutilise le chargeur d’art, les emprises et la profondeur du moteur. Les lampes orientées, panneaux solaires, états électriques, noms et indications de chantier restent issus des propriétaires existants. La provenance et les rectangles de sprites sont consignés dans `assets/art149/`. Les images sont distribuées dans le web, le cache PWA et le HTML autonome.

## Points à renforcer ensuite

Le score seul autorise la répétition de bâtiments précoces pour obtenir un âge tardif. Le système de déblocage fonctionne, mais il ne prouve pas un développement civique équilibré. Une prochaine passe de conception devrait introduire des objectifs facultatifs de viabilité par âge — réserves, effectifs, production, secteurs réellement fermés — puis chronométrer des campagnes humaines sur plusieurs graines. Les seuils et anciennes sauvegardes ne sont pas changés sans validation de ces objectifs.

## Vérification

```bash
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:d17
```

Le cloud contrôle Chromium et des formats tactiles simulés. Une fixture tardive ne certifie ni la durée d’une partie humaine, ni l’équilibrage d’un siège extrême, ni un téléphone physique. La publication Vercel conserve sa preuve distincte sur l’origine demandée.
