# Audit et corrections 1.54 — DEADWALL

Cette passe part du jeu 1.53.1. Elle associe les captures d'un parcours réel aux reproductions techniques des interactions problématiques. Les scénarios préparés de combat et de migration ne sont pas des campagnes gagnées par un joueur ; les entrées natives du navigateur sont rapportées séparément.

## Problèmes reproduits et comportement corrigé

| Domaine | Problème observé | Correction |
| --- | --- | --- |
| Temps de jeu | À 10 Hz, cinq secondes réelles ne comptaient que deux secondes de jeu ; à 20 Hz, quatre. | Une frame active est intégrée en sous-pas de 40 ms maximum. Sept sous-pas maximum ; les interruptions de plus de 250 ms sont abandonnées. Les actions ponctuelles sont livrées une fois, les menus et changements de focus ne sont pas rattrapés. |
| Enceintes | Un Errant pouvait pénétrer l'angle d'une palissade sans l'endommager. La séparation de foule ne vérifiait l'obstacle que pour le Fonceur. | Déplacement hostile borné à cinq unités et collision avec le rayon réel ; poussée revalidée pour tous les profils. Les rampes de cadavres des Récents et Rampants restent utilisables. |
| Reprise de combat | La sauvegarde effaçait la proie et le prochain examen de chasse du Traqueur. | Référence vers un survivant vivant et échéance conservées ; les anciennes copies sans ces champs gardent leur comportement de migration. Références et durées invalides sont refusées avant remplacement de la partie. |
| Information ennemie | Une bande sauvage annonçait automatiquement son lieu et son effectif à sa naissance. | L'annonce exige l'observation physique actuelle et compte seulement ses membres visibles. Le directeur conserve sa génération et ses effectifs. |
| Exploration et sécurité | Les opérations de fournitures ignoraient les dépouilles régionales réanimées. | Ces contacts participent au diagnostic de danger et à l'interruption du travail. Les matériaux et réserves restent conservés lors du refus. |
| Survie | Un soin reçu dans la même frame pouvait masquer les dégâts et laisser un pansement poursuivre son effet. | Le dommage réellement reçu interrompt immédiatement le pansement et le travail de préparation, localement et dans la région. Une attaque absorbée ou refusée par l'invulnérabilité ne supprime pas un soin légitime. |
| Tactile | Le texte du bouton de torche dépassait sa case et son état était coupé en portrait. | Le bouton occupe sa rangée ; le contrôle navigateur vérifie le texte dessiné, la zone atteignable et l'activation réelle. |
| Navigation | Un raccourci ouvrait Préparatifs avec l'onglet sélectionné hors de la portion visible de la barre tactile. | L'onglet sélectionné est ramené dans la barre sans déplacer le contenu du dossier ; le focus conserve sa position. |
| Sprites | Les cellules de deux rangées d'acteurs coupaient des doigts ou une extrémité de fusil et empruntaient des fragments voisins. | Seize poses du Rampant et de la variante Fusilier utilisent des rectangles mesurés sur les PNG originaux, avec le pivot et l'échelle nominaux conservés. Les autres rangées et la provenance restent inchangées. |
| Préparation économique | Le catalogue ne décrivait pas la consommation du générateur de départ, déjà appliquée par le moteur. | Le profil commun expose son débit nominal de 0,018 carburant/s, soit 1,08/min ; la recherche électrique conserve sa réduction existante. Aucun prélèvement supplémentaire. |
| PWA | Une nouvelle page HTTP 200 et un ancien script repris après HTTP 503 pouvaient partager la même session installée. | Le cache installé conserve ses fichiers. Le prochain service worker prend la relève après succès du précache complet ; les entrées manquantes restent réparables par réseau. |
| Relais coopératif | JSON `null` provoquait une exception, le changement de salon ne retirait pas le repère précédent, et la fermeture tardive d'une ancienne connexion annulait la nouvelle. Le panneau ne suivait pas les changements de statut. | Messages invalides refusés, départ annoncé au salon précédent et événements associés à leur propre connexion ; statut annoncé sans reconstruire les champs. Le relais reste un échange de positions et repères, sans synchronisation des combats. |

Le rendu nocturne partage également les sources entre masque et teinte dans une même frame ; la torche régionale utilise une lecture scalaire plutôt qu'une copie de l'état urbain. Ces changements conservent les portées et les occlusions.

Les chiffres d'équilibrage, le contenu des cartes G1–G7, les ressources finies, les coûts de préparation et les conditions des onze âges restent ceux de la campagne. La sauvegarde générale reste v20, avec champs de chasse facultatifs et contrôlés.

## Progression et contenu existant

Le catalogue effectivement installé comporte respectivement **6, 19, 18, 7, 6, 6, 5, 6, 7, 5 et 5 modèles de construction** pour les onze âges. Les cibles d'évolution sont incluses dans ces nombres. Les routes, montages de pièges, recettes, formations, plans et rôles sont comptés séparément dans la matrice du rapport de progression. Les dépendances analysées existent sans cycle ; les entrepôts accessibles permettent de financer les gros coûts unitaires. Les conditions de population, variété, services, reconnaissances et vagues restent obligatoires.

Un scénario technique du directeur, supprimant immédiatement chaque apparition et imposant une signature de 288, émet 92 724 contacts en 60 vagues : **6,98 heures de simulation avec les jours normaux**, contre **3,58 heures avec tous les assauts anticipés**. Ce calcul exclut les combats, le financement, les déplacements et les pertes. Il mesure une borne de cadence et le choix d'anticipation ; il ne mesure pas la durée d'une véritable campagne.

## Vérification à exécuter sur les sources finales

`npm run check` reste obligatoire : syntaxe, fabrication web/PWA/autonome et totalité des tests natifs. Les nouveaux tests isolent collisions, chasse/reprise, dégâts/soins, annonces de contacts et risques de récupération. Les contrôles du relais utilisent de vraies connexions WebSocket ; le test du client provoque l'arrivée tardive des événements de l'ancienne connexion.

Les parcours navigateur à entrées natives couvrent menu, nouvelle campagne, déplacement, récolte, dépôt, placement, chantier, recrutement, portes, premier assaut, sauvegarde et Continuer. Le contrôle PWA ouvre une campagne et la reprend hors ligne ; le contrôle autonome porte sur les octets du HTML fabriqué. Le scénario de mise à jour du service worker utilise deux versions préparées et une panne de précache, à distinguer du parcours natif du jeu.

Les rapports d'exécution, captures fraîches, empreintes et codes de sortie de cette passe sont consignés dans `/workspace/deadwall-cloud/audit154/`. Les rapports des versions précédentes conservent leur statut historique.

## Limites de cet audit

Le respect des onze conditions d'âge ne chronomètre pas une campagne humaine complète. La cible Standard de 6 à 10 heures reste à vérifier par plusieurs parties réelles. Une graine reproduit la carte et ses stocks initiaux, sans garantir une compétition parfaitement déterministe.

Le décodage et l'inspection des images ne garantissent pas toutes les animations dans tous les combats. Les captures et gestes tactiles utilisent Chromium sous Linux et du tactile émulé. Cette passe ne certifie ni 60 FPS sur chaque appareil, ni Windows natif, ni les boutiques, ni l'accessibilité complète aux technologies d'assistance. L'intégration du temps à faible cadence améliore le rythme de simulation ; elle n'augmente pas à elle seule la cadence d'affichage. En cas d'interruptions répétées supérieures à 250 ms, le temps abandonné reste une limite mesurable.

Une mesure Chromium exclusive à 1280×720, DPR 2, avec 720 contacts injectés dans une enceinte préparée et sans tirs alliés, a relevé 7,35 FPS en automatique et 9,61 FPS en qualité basse. La simulation avançait respectivement à 97,9 % et 100,0 % du temps réel. La scène calme atteignait environ 50–56 FPS. Ce profil précède les deux petits correctifs de rendu nocturne ; il ne prouve aucun gain après ceux-ci. Le GPU logiciel du cloud et cette scène artificielle ne définissent pas une configuration minimale commerciale. La fluidité des grandes hordes reste un chantier.

Le succès du précache n'atteste pas à lui seul la provenance identique de toutes les réponses HTTP 200 d'un serveur. La publication finale vérifie séparément les empreintes des fichiers HTTPS du site Vercel.
