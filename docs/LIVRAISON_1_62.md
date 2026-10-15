# DEADWALL 1.62 — Codex, mobilier et cohérence des plans

Cette passe raccorde les aperçus du Codex aux plans territoriaux réellement utilisés par G10, complète les intérieurs et améliore les contrôles de dimensions et d’accès. Les 4 000 programmes conservent leurs identifiants et leurs sources. Une recette disponible reste un candidat à l’implantation : chaque graine garde ses contrôles de terrain, d’emprise et de desserte.

## Activer le mobilier de révision 11

Rejoindre le dépôt de D17, puis ouvrir **Monde & relais**. Après activation des programmes G9 ou G10, choisir **COMPLÉTER LE MOBILIER PAR USAGE**. L’action vérifie les positions et les possessions avant de restaurer la sauvegarde préparée. Une lampe, un personnage, un bivouac ou un véhicule qui occuperait un nouvel obstacle peut empêcher l’activation ; déplacer l’élément concerné avant de réessayer.

La révision 11 est facultative. Une ancienne sauvegarde conserve sa révision et ses collisions ; les révisions 0 à 10 ne reçoivent pas silencieusement les nouveaux meubles. La génération régionale et la révision de mobilier restent deux axes indépendants. L’activation ne donne ni ressource, ni population, ni équipement alimenté.

### Intérieurs territoriaux

Les 326 contrats G10 qui conservent un intérieur historique étaient exclus des couches de détails par un retour anticipé du générateur. La révision 11 les raccorde aux mêmes couches de mobilier que les autres bâtiments, sur leur vrai plan G10. Les contenants, leurs identités et leurs budgets finis ne sont pas remplacés.

Les obstacles de terrain, les portes et les points de travail du contexte sont réservés pendant le placement. Ces réserves ne deviennent pas de faux murs ou de décors. Le rendu, les collisions et les lignes de vue lisent les mêmes détails produits et mis en cache.

Les 300 programmes spécialisés conservent leurs ouvrages et leurs terrains : cette passe ne leur substitue pas un intérieur de bureaux. Les dix-huit références multiniveaux partiellement adaptées gardent leurs domaines fermés et leur avertissement auteur ; elles ne sont pas déclarées intégralement réalisées.

### Programmes indépendants

Les 1 000 programmes indépendants n’ont pas les mêmes prescriptions quantitatives que les fiches historiques. Leur mobilier complémentaire utilise les indices fiables de la pièce, les meubles déjà présents et sa place accessible. Les cas ambigus sont refusés.

Ces choix de composition sont annoncés comme tels : ils ne constituent pas des quantités auteur. Le nombre d’ajouts reste borné par pièce, étage et lieu. Les gabarits viennent du catalogue physique existant ; les objets ne sont pas réduits pour entrer dans un passage. Les anciens meubles et leurs identifiants sont conservés.

## Consulter les plans et les dimensions

Dans le Guide, ouvrir la fiche puis **Accès, ressources et précautions**. L’aperçu utilise désormais les vrais contrats G10, y compris leurs emprises spécialisées, au lieu de les annoncer absents ou de réutiliser un ancien gabarit. Le choix de graine et de niveau reste une inspection isolée : il ne découvre ni ne crée un lieu dans la campagne.

Le bilan sépare deux mesures : le nombre d’objets du type demandé et le nombre d’objets dont l’emprise correspond à la source. Un surplus de chaises adaptées ne satisfait donc pas artificiellement un minimum de chaises aux dimensions conformes. Les premiers écarts affichent l’emprise source et les emprises mesurées. Ces comparaisons portent sur le sol ; elles ne certifient pas toute la hauteur ou chaque pixel du sprite.

L’option de révision 11 montre les compléments dans l’aperçu. L’activation dans une campagne reste une action distincte au dépôt.

## Routes, surfaces et graines

Les lecteurs de surfaces des rondpoints distinguent l’ellipse extérieure, l’anneau circulable et l’îlot central. Les coins du rectangle englobant ne deviennent plus une chaussée ou une eau inexistante. La marge d’une recherche suit le bord courbe au lieu de remplir l’îlot.

Le résolveur de desserte complète sa recherche dans les secteurs que peut atteindre un accès alternatif. Cela évite d’omettre une route valide ou une chaussée intervenante. Le correctif conserve les accès initiaux déjà acceptés et ne redessine pas les routes ou les parcelles.

La graine continue de reproduire les lieux et leurs détails, indépendamment de l’ordre de consultation et de l’éviction des caches. Elle ne promet pas une simulation de combat compétitive déterministe. Les audits échantillonnés ne sont pas une preuve sur les quatre milliards de graines.

## Vérification

```sh
DEADWALL_SOAK=1 npm run check
node scripts/browser-codex162.mjs
```

La CI conserve les suites existantes et ajoute le parcours de régression de cette livraison. Les audits du Codex distinguent les recettes historiques, les programmes indépendants et les contextes G10 ; leurs filtres permettent aussi une inspection ciblée sans annoncer un échantillon comme un catalogue entièrement parcouru.

Les emprises historiques adaptées ne sont pas redimensionnées dans les sauvegardes. Certaines prescriptions peuvent encore manquer faute de place ou d’accès. Les architectures spécialisées, les variantes artistiques, les performances sur appareils physiques et la durée Standard de 6 à 10 heures gardent leurs limites de qualification documentées dans les livraisons précédentes.
