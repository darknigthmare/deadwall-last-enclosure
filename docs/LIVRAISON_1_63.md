# DEADWALL 1.63 — Composition des pièces et inspection des ouvrages

Les 4 000 programmes conservent leurs sources et identités. Cette passe améliore leur réalisation : usages de pièces mieux reconnus, mobilier adapté à la surface disponible, emprises de certains détails corrigées et parcours d’inspection dans 18 références d’ouvrages.

## Activer et consulter

Au dépôt de D17, après activation des programmes G9 ou G10, ouvrir **Monde & relais**, puis **COMPLÉTER LES PIÈCES ET OUVRAGES**. La révision 12 est facultative et vérifie les positions et possessions avant application. Un personnage, équipement, bivouac ou véhicule gêné par un nouvel obstacle peut empêcher l’activation : libérer cet emplacement avant de réessayer. Les révisions historiques ne sont pas converties silencieusement.

Dans le Guide, ouvrir une fiche puis son aperçu et cocher **Composer le mobilier et ouvrir les parcours d’inspection**. Le sélecteur de niveau présente les parcours réellement disponibles pour cette révision. Une inspection du Guide ne modifie pas la campagne.

## Pièces, dimensions et rendu

Le classement distingue notamment réserves, archives, dortoirs, ateliers, sanitaires et locaux techniques. Des dossiers d’accueil ne suffisent pas à faire une archive ; une caisse de modules sanitaires ne devient pas une salle d’eau. Les usages ambigus restent sans composition inventée.

Les grandes pièces peuvent recevoir du mobilier en îlots lorsque les accès le permettent ; les petites pièces ont des plafonds plus bas. Les murs, escaliers, contenants, accès de maintenance et points de travail contraignent chaque ajout. Le rapport indique les compléments réellement posés, sans présenter les choix de composition comme des minima auteur.

Les chaises et panneaux non récupérables ne sont ajustés que lorsqu’une emprise auteur est attribuable sans ambiguïté et tient dans leur ancienne emprise. Les centres et identifiants sont conservés et les anciennes cellules accessibles sont vérifiées. Cette correction ne redimensionne pas les bâtiments historiques et ne certifie pas les hauteurs de tous les sprites. Les panneaux concernés gardent une silhouette lisible avec une emprise cohérente. Les troncs physiques de forêt utilisent leurs arbres botaniques et variantes stables plutôt que des rectangles génériques.

## Ouvrages

Les références de viaduc, passage inférieur, échangeur, pont ferroviaire, aqueduc et métro disposent d’un parcours piéton d’inspection associé à leurs escaliers. Les anciens contenants, travaux et ennemis restent au niveau historique ; aucun butin ou ennemi gratuit n’est ajouté à l’étage.

Ces parcours n’achèvent pas la circulation automobile à plusieurs hauteurs ni toutes les distributions des références auteur. Les limites restent signalées dans les fiches. Les 18 références restent partiellement adaptées.

Constats mesurés et manques restants : [AUDIT_1_63.md](AUDIT_1_63.md).

## Vérifier

```sh
DEADWALL_SOAK=1 npm run check
node scripts/browser-codex163.mjs
```

Les contrôles de cette version et sa publication sont attestés par des reçus propres. Les audits échantillonnés ne constituent pas une inspection de toutes les graines, une certification de chaque sprite ou une mesure des performances sur appareils physiques. Certaines prescriptions et familles de mobilier restent à compléter ; les bâtiments historiquement adaptés gardent des écarts d’emprise signalés. La durée Standard de 6 à 10 heures attend encore des campagnes humaines complètes.
