# DEADWALL 1.57 — Lieux, intérieurs et variantes

Cette version intègre le PR #1 (`bb1a08de7a88f68b03ac57b2626c3353c76b3862`) sur la base 1.56.0 (`ae10a4583c604b0ad7536d6c92c08449b27f1743`). Elle enrichit les lieux régionaux, raccorde le Codex 3000 au jeu et ajoute des variantes structurelles de sprites. Les preuves finales de compilation, tests, navigateurs et publication sont consignées après exécution dans le compte rendu de livraison ; ce guide décrit le candidat.

## Lieux et extension régionale

Les 62 gabarits G7 reçoivent des cours, jardins, équipements et petits meubles compatibles avec leur famille. Portes, parkings, escaliers et passages sont réservés avant de placer les détails. Piscines, bancs, jeux, barbecues, vélos, compost, chaises, télévisions et tapis ont des dessins dédiés ; les autres objets conservent leurs atlas ou une forme Canvas spécifique.

Une nouvelle campagne démarre en G7. Depuis le dépôt de D-17, **ÉTENDRE AUX 3 000 PROGRAMMES** active G8 avec un commandant libre. Le catalogue est compilé depuis les sources auteur ; le terrain filtre les implantations, donc une seed ne comporte pas forcément les 3 000 programmes. Les fiches conservent les niveaux auteur et indiquent leur adaptation : les plans jouables utilisent au maximum trois niveaux hors souterrain. Les autoroutes séparées, ponts, échangeurs et ascenseurs décrits dans le catalogue ne deviennent pas des systèmes jouables par cette seule compilation.

L'extension respecte les prélèvements historiques et les secteurs déjà relevés. Un site nouveau qui couvrirait une voiture, un bivouac ou un éclairage placé fait refuser l'activation avec une raison explicite ; le joueur peut ensuite déplacer ou retirer ce support dans le jeu. Aucun stock n'est offert par la migration.

Les anciennes sauvegardes sans `frontier.detailVersion` gardent leurs collisions historiques (valeur 0), même quand les nouveaux détails sont dessinés. Les nouvelles campagnes portent la valeur 1 ; les sites natifs G8 disposent de leurs détails physiques. Le format général de sauvegarde reste **v20**.

## Art et variété

Les variantes changent la structure des toits et les équipements visibles, avec des matériaux crédibles. Les toits résidentiels, collectifs, industriels et de services ont des choix supplémentaires ; les cabanes excluent les formes incompatibles. Les quatre familles maison, entrepôt, atelier et clinique reçoivent quatre nouveaux dessins chacune, également utilisés par leurs annexes régionales.

Les 79 modèles encore sans alternative reçoivent une nouvelle silhouette. Cela couvre les 83 modèles terminés distincts des 91 définitions de construction, en distinguant les trois états du centre. Cinq groupes de définitions partagent réellement un modèle ; ils ne sont pas présentés comme des dessins uniques. Les logements conservent leur classe de hauteur (2, 4, 8, 12, 15 ou 20 niveaux), et les défenses leurs canons, charges et points de tir.

Le choix dépend de la seed et de l'identité stable de l'objet. Il survit aux rafraîchissements et à la reprise, sans consommer le générateur aléatoire de la simulation. L'emprise, les fonctions, les coûts, les étages et les points de contact restent gérés par leur système d'origine. Les atlas précédents restent disponibles en cas d'image manquante ou pour les états fonctionnels tels que chantier, panne et dommages. Les 143 nouveaux dessins utilisés sont répartis dans neuf atlas et un PNG individuel. La provenance des dix PNG et leurs prompts sont conservés avec les assets. Une case incorrecte de l’atlas A est ignorée et une case de B reste vide ; elles ne gonflent pas le nombre de dessins utilisés.

## Compatibilité et validation

Les onze âges, stocks finis et exigences de progression sont conservés. La cible Standard de **6 à 10 heures** jusqu'au onzième âge reste à vérifier dans des campagnes humaines complètes. Cette livraison ne certifie pas chaque appareil, toutes les seeds ni une qualité commerciale complète.

Avec Node.js ≥22.12, lancer `npm ci`, puis `npm start`. La compilation du Codex précède le démarrage, les tests et le build. `DEADWALL_SOAK=1 npm run check` effectue syntaxe, build et suite native avec endurance. `test:browser` inclut la PWA ; campagnes et HTML autonome HTTP sont vérifiés séparément. Les contrôles Chromium/Linux et tactiles émulés ne remplacent pas une validation Windows native ou sur téléphone physique.

Le site demandé est https://deadwall-last-enclosure.vercel.app/. La publication n'est attestée qu'après vérification du commit distant, du statut Vercel et des octets HTTPS.
