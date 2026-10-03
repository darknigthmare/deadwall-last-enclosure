# DEADWALL 1.47 — Fronts & ravitaillement

Cette passe ajoute deux plans de migration, deux appoints transportés dans le sac et un briefing qui distingue arrivées prévues et contacts observés. Elle corrige la composition des Colonnes de rupture et conserve l’ordre des prochains ennemis lors d’une reprise. La boucle demeure récolter, porter, déposer, financer, construire, équiper et tenir la horde.

## Assauts

Le catalogue contient huit formes de migration. La Prise en tenaille devient éligible à la vague 10 : deux côtés opposés au premier échelon, les deux côtés latéraux au deuxième, puis les quatre côtés au troisième. Le Débordement latéral devient éligible à la vague 13 : côté initial, deux côtés latéraux, puis côté opposé. La graine et la vague choisissent le profil parmi ceux éligibles ; son seuil ne garantit pas sa sélection à chaque vague.

Le premier côté enregistré sert d’ancre ; les directions opposées et latérales suivent la géométrie cardinale. Les effectifs, les huit types d’infectés, leurs points de vie et la cadence ordinaire de ces deux profils restent conservés. Les trois échelons, les deux pauses de six secondes, le plafond simultané de 720 et le buffer de 64 restent ceux du directeur existant. Les ennemis déjà présents continuent de combattre pendant une pause des arrivées.

Les Colonnes de rupture utilisent désormais la clé réelle `breacher` : leur poids de composition 2,8 s’applique aux Briseurs. Le profil historique garde son identifiant `breakers`, sa cadence et ses autres poids. Le total est réparti entre les types existants et disponibles, sans inflation de santé.

## Appoints physiques

| Action | Livraison maximale | Coût dans le sac | Durée | Plafond du support |
| --- | --- | --- | --- | --- |
| Conditionner un appoint de cartouches | 6 cartouches | 6 cartouches, 1 bois, 1 ferraille | 6 s | 24 cartouches |
| Compléter la cassette de réparation | 80 points de réserve | 4 ferrailles, 2 bois | 8 s | 200 points |

Approchez le support achevé par un accès libre, à pied et les mains libres. Les cartouches demandent un poste de tir. Le sac fournit les ingrédients ; le dépôt commun n’est pas débité. Un espace restant inférieur au lot donne une quantité réduite, avec chaque ingrédient arrondi au supérieur proportionnellement. Le devis fixe cette quantité au démarrage ; si sa place n’est plus disponible à la fin, le travail s’interrompt sans paiement.

Le paiement et l’ajout à la réserve sont atomiques à l’achèvement. Déplacement au-delà de deux unités locales depuis le point de travail, blessure, menace physique, tir, recharge, changement d’outil, perte du support ou autre tâche incompatible interrompent le travail. La pause et le commandement suspendent son temps. Un poste qui tire peut vider son ancien caisson pendant la préparation ; l’appoint fini retrouve le même support valide, sans créer de réserve gratuite. Le travail ne se reporte pas sur un bâtiment remplacé, même avec le même identifiant.

L’appoint de réparation remplit la cassette ; il ne soigne pas directement la structure. La réparation manuelle existante consomme ensuite sa réserve à huit points par seconde et conserve ses contraintes. Les filets, équipements, débris et régulateurs historiques restent disponibles. Le plateau de travail affiche l’action, sa progression et sa pause ; le devis annonce la durée et les boutons exposent les raisons réelles de refus. Un support compatible sans équipement peut recevoir sa première petite réserve par un appoint payé.

## Briefing et observation

Les préparatifs montrent les trois échelons du profil sauvegardé, l’échelon actuel et les pauses des arrivées. Ils donnent accès aux portes, sections et entretien ordinaires. L’état des remparts concerne les structures alliées : fragilité, amas franchissables, portes ouvertes et absorption restante des étais. La consultation n’exécute aucune intervention.

Les secteurs du HUD, de Situation et du briefing utilisent une nouvelle frame du service physique `visibility146`. Ils indiquent les contacts actuellement observés avec leurs directions. Le total vivant du directeur reste un compteur global de vague, sans fournir de position ; les fronts annoncés sont un plan d’arrivées. Perdre les observateurs retire immédiatement les directions observées. Portées en mètres, obscurité, murs, portes, étages et intérieurs restent ceux de la 1.46. Aucun calcul de préparation/vision ne s’exécute pour un panneau masqué et aucune consultation ne consomme de RNG ni de stock.

## Reprise et compatibilité

Le format général reste v20 et les registres de packs gardent leurs versions. Le profil déjà enregistré dans `siege.lastWave` pilote l’assaut sauvegardé ; aucun nouveau profil n’est recalculé à la reprise. Un profil historique ou absent garde les groupes de fronts historiques. Les générations G1–G7, la géométrie, les stocks finis et les coordonnées des décors courants sont conservés.

Le buffer validé contenant au plus 64 prochains types d’ennemis reste séparé des effectifs non encore tirés et garde son ordre exact. Continuer ne retire pas de nouveaux types de la RNG et conserve le timer. Les longues files héritées de plus de 64 entrées restent compactées en effectifs pour respecter la borne historique. Une préparation d’appoint inachevée est transitoire et annulée au chargement sans débit ; ses réserves achevées utilisent le registre existant.

## Vérification et livrables

```sh
npm ci
npm start
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:preparations
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:visibility
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:campaign
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:terrain
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:tactics
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:assault
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:standalone -- --transport http
npm run package:web
npm run package:source
```

Les rapports courants conservent codes de sortie, comptes exacts, erreurs, captures et empreintes des sources exécutées. Les scènes avancées de tenaille, débordement, réserves et observation sont des fixtures explicitement déclarées ; les départs de campagne, commandes, récoltes et reprises natives restent distingués. Aucun résultat 1.46 ne sert de preuve de réussite 1.47.

Trois variantes sont prévues : Web-PWA, Standalone et Sources. Les archives sont contrôlées par CRC, chemins sûrs, ensemble exact des fichiers et SHA-256, puis les octets extraits passent leurs parcours web/PWA et autonome. Sources conserve tests/docs/codex. Les manifests déclarent le commit Git réel et les modifications locales. Les références 1.41–1.46 et leurs dix-neuf ZIP sélectionnés sont préservés séparément.

## Publication et limites

Destination demandée : https://deadwall-last-enclosure.vercel.app/. La publication doit viser le projet existant propriétaire de cette origine, résolu par API authentifiée. Le staging statique vient du web extrait vérifié avec Build Output API v3, cache PWA et en-têtes de sécurité conservés. Le jeton `VERCEL_TOKEN` doit être lié dans les paramètres sécurisés de l’environnement, avec les accès réseau effectifs ; aucun secret dans le chat ou les fichiers de livraison. Une préparation ne prouve pas une publication. Le résultat distant, la version publique, les principaux payloads et les en-têtes doivent être vérifiés après déploiement. Preuves sous `/workspace/deadwall-cloud/1.47.0/vercel`.

La PWA HTTPS est le support mobile. Chromium en formats tactiles ne certifie pas les appareils physiques. Le cloud refuse `file://` ; le contrôle autonome HTTP utilise le HTML livré et reste distinct d’une ouverture locale. Le portable Windows doit être fabriqué et lancé sur Windows 10/11 x64. Les essais humains longs, la signature éditeur et la mise en boutique restent nécessaires avant commercialisation. La coopération actuelle relaie la présence et ne synchronise pas le combat.
