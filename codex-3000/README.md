# DEADWALL — Codex étendu, édition 1.58

L’[addendum 1.58](addendum-1.58/CONTRACT.md) ajoute exactement **1 000 programmes indépendants**, DW-3001 à DW-4000. Les quatre lots auteur sont compilés avec les sources historiques : **4 000 fiches, 2 000 parents**, dont les 2 000 compositions contextuelles historiques restent distinguées des programmes indépendants. Aucun état d’abandon, matériau ou simple changement de nom ne compte comme nouveau programme.

Ouvrir [LIRE_1000_NOUVEAUX.html](addendum-1.58/LIRE_1000_NOUVEAUX.html) pour rechercher les fiches nouvelles hors ligne et lire tous leurs champs. [INDEX_1000.json](addendum-1.58/INDEX_1000.json) et les lots PROGRAMMES_A/B/C/D.json en conservent les identités. Le guide du jeu permet aussi de consulter les 4 000 fiches.

Les nouveaux plans disposent de quatre distributions réelles, de pièces fonctionnelles, de mobilier natif et de contenants finis. Au maximum trois niveaux jouables **au total, souterrain compris**. La présence dans la région dépend des parcelles compatibles ; une fiche ne prouve pas sa présence sur une seed. Les anciennes activités, réseaux et risques narratifs ne deviennent pas des simulations supplémentaires. Depuis le dépôt, activer G8 puis G9 ouvre les implantations sans changer les anciens sites. Voir [livraison 1.58](../docs/LIVRAISON_1_58.md).

## Archive documentaire — édition 1.26

Les informations ci-dessous décrivent le périmètre de cette archive lors de sa rédaction. Les intégrations ultérieures sont documentées dans la livraison courante.

# DEADWALL — Codex 3 000, édition 1.26

Ouvrir **LIRE_CODEX_3000.html** directement dans un navigateur. Le lecteur fonctionne hors ligne, sans serveur ni téléchargement. Il propose recherche, famille, type de fiche et pagination de 24 résultats. Chaque composition affiche son programme parent complet dans son détail.

## Ce qui a été triplé

Le fonds retrouvé comprend 1 000 fiches : le catalogue historique de 500 lieux, actualisé en 1.22, puis le supplément 501–1000 de la 1.23. Ces deux ensembles sont conservés intégralement dans `originaux/`, avec leurs fichiers, lecteurs, versions et notices historiques. Leur texte n’a pas été réécrit ; il faut lire leur couverture ancienne comme une information historique.

Cette édition ajoute les fiches **DW-1001 à DW-3000** : 2 000 compositions documentaires, soit deux par programme parent. Chaque composition relie explicitement :

- le programme spatial complet du parent, ses pièces, meubles, dimensions et ressources ;
- un module de territoire compatible avec sa famille d’usage ;
- un état causé qui modifie ensemble accès, ressources, risques, éclairage et critères de contrôle.

Les deux dérivés d’un parent utilisent des contextes et états différents. Les 2 000 ajouts sont des variantes composées, **pas 2 000 architectures conçues indépendamment**, ni 2 000 nouveaux lieux implantés dans la partie. Le total de 3 000 fiches ne compte pas les copies JSON, Markdown ou HTML comme des fiches supplémentaires.

## Couverture réelle du jeu

Le moteur possède 62 gabarits simplifiés reliés à des identifiants historiques. Leur présence ne couvre pas toutes les variantes de la fiche de conception. Les fiches DW-1001–3000 restent au statut conception. Les camps alliés/hostiles, climats, eau, relief et mécanismes futurs ne deviennent pas jouables par leur inscription au catalogue.

Le guide « ATLAS & GUIDE » intégré au jeu ajoute 59 fiches de milieux, activités et systèmes. Ses filtres distinguent contenu présent, plan pilote et projet. `COUVERTURE_JEU.json` conserve la correspondance exacte avec les 62 gabarits du moteur. Le vocabulaire et les limites des anciens lecteurs restent préservés dans `originaux/`.

## Organisation modulaire

| Chemin | Usage |
|---|---|
| `LIRE_CODEX_3000.html` | Lecteur complet autonome et filtrable |
| `INDEX_3000.json` | Index stable des 3 000 identifiants et chemins |
| `CATALOGUE_1001_3000.json` | Données complètes des 2 000 compositions |
| `catalogues/` | Découpage des compositions par famille historique |
| `compositions/` | 2 000 fiches Markdown regroupées par famille |
| `originaux/` | Les deux ensembles historiques intacts |
| `modules/` | 59 modules partagés et contrat de génération |
| `source/MODULES.json` | Source structurée des modules |
| `source/CONTEXTES.json` | Compatibilités par famille de programme |
| `source/ETATS.json` | Prescriptions des huit états causaux |
| `source/generate.py` | Générateur déterministe, sans dépendance externe |
| `ORIGINAUX_SHA256.json` | Empreintes des 1 051 fichiers originaux |
| `MESURE.json` | Comptage explicite et méthode |
| `VALIDATION.json` | Résultat du contrôle structurel et de conservation |

Pour régénérer depuis les sources conservées : `python source/generate.py`. Un troisième argument peut fournir le projet du jeu pour mettre à jour les modules et la correspondance des plans, selon l’aide du script. Les identifiants parent ne changent pas lorsqu’un fichier est déplacé.

## Règles avant génération d’un lieu

Lire d’abord le parent complet, puis les prescriptions territoriales et l’état. Ne pas cumuler les maxima des pièces dans l’enveloppe minimale. Garder voies, réserves, sorties et espaces d’interaction avant le mobilier. Une incompatibilité de relief, d’eau ou de réseau doit entraîner une adaptation explicitement conçue ou le refus de la parcelle.

Les quantités sont finies et partagées entre les zones ; un déplacement de réserve n’en crée pas une deuxième. Toute source lumineuse doit conserver domaine, niveau, position, état et durée selon le système réellement implémenté. L’ouverture d’une fiche ne découvre aucun lieu et ne modifie aucune sauvegarde.

La validation du catalogue vérifie les identités, liens, champs, comptes et originaux. Elle ne simule pas les 3 000 géométries et ne prouve pas qu’elles sont toutes jouables. Seules des intégrations avec accès, collision, ressources, sauvegarde, tests et preuve visuelle peuvent changer ce statut.
