# Qualification 201 — commande complète et continuation des plans

La suite existante, ses six partitions natives, ses navigateurs et Windows restent inchangés. Le workflow supplémentaire `fullcheck201.yml` qualifie deux périmètres séparés sur la tête explicite de la PR (`github.event.pull_request.head.sha`), ou le commit de l’événement pour `push` et `workflow_dispatch`. Il ne valide pas implicitement le SHA de fusion créé par GitHub.

## Commande native réellement exécutée

Le job distinct, limité à 90 minutes, installe Node 24 et les dépendances avec `npm ci`, puis exécute littéralement :

```sh
DEADWALL_SOAK=1 npm run check
```

Cette commande conserve la syntaxe, le build, le prétest et l’intégralité de `tests/*.test.cjs`, avec les quatre processus configurés dans le projet. Aucun filtre, partition ou remplacement du test n’est introduit dans cette commande. Le shell conserve séparément `PIPESTATUS[0]` de npm et `PIPESTATUS[1]` de `tee`. Un échec de journalisation invalide aussi la qualification.

`scripts/full-check201.mjs start/finish` conserve l’identité demandée, HEAD et arbre Git réels, propreté avant/après, empreinte SHA-256, nombre d’octets et permissions de chaque fichier suivi, liste exacte des fichiers de test et scripts npm. Toute mutation, entrée native non suivie, commande modifiée ou option Node héritée invalide le reçu. Le journal original est conservé avec sa taille et son SHA-256.

L’acceptation est recalculée depuis ces données, jamais depuis un booléen `accepted`. Elle exige les sept compteurs finaux `tests/suites/pass/fail/cancelled/skipped/todo`, au moins les **5 191 cas et 480 fichiers** de la version livrée précédente, tous les cas réussis, zéro échec/annulation/ignoré/à faire et les deux sorties réelles à zéro. Ces planchers ne prédisent pas le nombre final des ajouts 201 : le reçu rapporte les nombres réellement exécutés. Un footer absent ou un démarrage rejeté n’est jamais une réussite.

Chaque tentative utilise un répertoire distinct `artifacts/qa/fullcheck201/RUN-ATTEMPT/`. Le journal de démarrage, le journal complet, les refus et le reçu final sont archivés avec `if: always()`. Un job interrompu peut conserver seulement son démarrage et son journal partiel ; l’absence de reçu final positif signifie que la qualification n’est pas acquise.

## Parcours Chromium séparé

`scripts/browser-continuation201.mjs` sert le build réel et ouvre l’entrée joueur sans les paramètres d’outillage historique. Il prévoit trois écrans : 1366 × 768, 390 × 844 tactile et 844 × 390 tactile. Chaque profil conserve captures, contrôles de visibilité et erreurs JavaScript/console/HTTP/requêtes.

Le parcours consulte le Carnet et les six plans `returnService201`, `craftCourt201`, `staggeredLines201`, `powerCourt201`, `medicalRecovery201` et `siegeSupply201`. Une cité avancée est **explicitement préparée** : âge, infrastructures prérequises achevées sur des emplacements légaux et stocks plafonnés par son stockage. Cette préparation ne représente pas une progression naturelle jouée.

Les boutons natifs puis les événements réels souris/tactile ancrent chaque aperçu sur une cellule vérifiée par le devis natif. La caméra est préparée pour cadrer cette cellule. Consultation, aperçu et annulation doivent préserver tous les propriétaires persistants et le RNG, à l’exception du timestamp de sérialisation. Le financement d’un seul Relais de service utilise ensuite le vrai bouton de paiement : coûts exacts, quatre fondations non achevées, aucun gain anticipé de capacité, santé ou unités. Une sauvegarde/menu/rechargement/Continuer vérifie leur conservation.

Sur écran bureau, une scène isolée déclare aussi ses ressources, support achevé et pression de corps préparés. Un infecté récent monte au toit de 12 m avec le moteur natif, puis sa mort native doit conserver cette altitude et entrer dans la vraie file de profondeur sans charger la pression au sol. Cette scène n’est pas un relevé d’une campagne naturelle.

Le contrôle enregistre aussi les mêmes empreintes source avant/après et refuse une différence. Les captures prouvent les états réellement affichés. L’arrêt déclaré de RAF permet de comparer les propriétaires ; il ne mesure ni fluidité ni fréquence d’images. Aucun de ces contrôles n’est présenté comme un testeur humain, une campagne Standard de 6–10 h ou une validation commerciale/production.

## Vérification du qualificateur

`tests/full-check201.test.cjs` contient 39 cas : reçu complet, chacun des sept compteurs manquants, zéro cas, régression du total, échecs/ignorés/annulés/à faire masqués, sorties npm/tee non nulles, signal, endurance absente, filtre, mauvais SHA, source sale ou mutée, permissions changées, inventaire incomplet, faux compteurs, journal altéré et contrat du workflow. Un cas sur de vrais fichiers contrôle les octets, les permissions et le refus d’une substitution par lien symbolique.

Ces tests d’infrastructure et un contrôle de syntaxe peuvent être exécutés sans build. Ils ne remplacent pas le job complet ni le parcours Chromium. Seuls les reçus du HEAD effectivement lancé permettent d’affirmer leurs résultats ; l’ajout du workflow ne constitue pas une exécution réussie.
