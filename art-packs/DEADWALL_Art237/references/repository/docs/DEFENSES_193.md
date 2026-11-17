# Défenses193 : montages spécialisés et réarmement

Cette extension ajoute six choix mécaniques jouables au Hérisson anti-horde. Il faut d’abord financer et achever le support ordinaire, acquérir l’âge indiqué et terminer un atelier. Le commandant rejoint un accès libre et sûr, transporte les pièces dans son sac et reste sur place pendant le montage. Un seul mécanisme équipe chaque Hérisson. Les six recettes tiennent dans le sac natif de 36 unités ; aucun agrandissement de sac n’est nécessaire.

Les valeurs viennent de `DeadwallCore.FortificationPackRules.mechanisms` ; le contrôleur ne possède aucun second barème.

| Montage | Âge affiché (1–11) | Pièces transportées | Travail | Charges | Impact | Entrave | Cycle minimal | Cibles |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Câble anti-coureurs | 3 | 8 bois, 16 ferraille | 16s | 8 | 5 | 4,2s | 1,1s | Récents, rampants, traqueurs, fonceurs |
| Mâchoire anti-briseurs | 5 | 6 bois, 24 ferraille, 4 pierre | 20s | 5 | 26 | 2s | 1,8s | Briseurs, protégés, engorgés, porte-boucliers |
| Râtelier de dents de relève | 6 | 6 bois, 30 ferraille | 30s | 18 | 18 | Aucune | 0,55s | Tous les infectés au contact |
| Pinces anti-protections | 7 | 4 bois, 26 ferraille, 6 pierre | 24s | 4 | 48 | Aucune | 2,8s | Protégés, porte-boucliers |
| Bobines de couverture rapide | 9 | 10 bois, 24 ferraille, 2 carburant | 28s | 12 | **0** | 2,2s | 0,6s | Récents, rampants, traqueurs, fonceurs |
| Frein à chaîne de siège | 11 | 6 bois, 22 ferraille, 8 pierre | 32s | 2 | 6 | 10s | 4s | Briseurs, protégés, engorgés |

Le ciblage spécialisé préserve les charges face aux autres profils. Une cible déjà entravée ne consomme pas une autre prise. Les bobines rapides donnent du temps aux défenseurs sans infliger de dégâts. Le frein de siège ignore les géants ; deux prises longues ne remplacent pas la défense du flanc. Les mécanismes historiques conservent leurs cibles et leurs règles. Les contacts exigent toujours portée physique et ligne libre ; les règles verticales empêchent un piège au sol d’attraper un infecté séparé par un étage.

## Réarmer sur place

Dans Terrain → Extensions → Défense → Défenses & ateliers, sélectionner le Hérisson équipé puis choisir **Réarmer**. Le bouton annonce le nombre de charges manquantes, le prix réel et le temps de travail. Les cibles retenues doivent être libérées avant cette opération. L’atelier et l’âge du mécanisme restent requis.

Pour chaque ressource, le prix est `ceil(coût initial × 0,8 × charges manquantes / capacité)`. Le temps est `temps initial × 0,6 × charges manquantes / capacité`. Chaque ressource s’arrondit séparément : une petite recharge n’est jamais une fourniture gratuite. Exemple : rendre une charge au câble anti-coureurs coûte 1 bois et 2 ferraille, avec 1,2 s de travail.

L’opération débite le sac une seule fois, à l’achèvement. Elle conserve le cycle de refroidissement et les autres réserves du support. Un déplacement, une blessure constatée pendant le travail, une recharge d’arme, un outil de construction, la disparition de l’atelier/support ou un chargement de sauvegarde interrompent le travail sans pièces consommées ni charges produites. La pause fige son avancement. La perte du support détruit ses réserves ; retirer un mécanisme ne rembourse rien.

## Dessins et sauvegarde

Les six silhouettes dérivent des composants transparents séparés d’art159 : base fixe, deux pièces mobiles et deux formes d’atlas par montage. Des pièces de quincaillerie Canvas originales distinguent crochets, amortisseurs, dents de relève, pinces, bobines et chaîne. Les quatre PNG sources et leurs 60 composants sont conservés ; cette extension n’affirme pas produire de nouveaux atlas illustrés. Les pièces s’animent sur un déclenchement, une entrave et un retour réels, avec les poses discrètes d’accessibilité existantes. Aucun tirage aléatoire ni horloge indépendante n’est ajouté.

Le format sauvegardé reste le mécanisme versionné existant : type, charges, refroidissement et cibles retenues. Le travail inachevé est volontairement transitoire. Les nouveaux profils utilisent le même validateur, les mêmes collisions et les mêmes propriétaires de dégâts que les anciens.

## Qualification ciblée

`tests/audit193-fortification.test.cjs` vérifie les six paiements finaux au sac natif de 36, les prérequis, les cibles réellement présentes, les impacts et entraves, l’épuisement, le prix partiel, les interruptions, la pause et le retour exact de sauvegarde. Le test d’un contact à 48 m confirme que la protection verticale existante est déjà fonctionnelle : l’hypothèse de pièges ignorant l’altitude n’était pas un bug.

`tests/trap-art159.test.cjs` parcourt les douze profils avec leurs deux formes, rotations et phases, contrôle les composants séparés, les limites physiques et les originales PNG. `tests/audit193-trap-art.test.cjs` compare également les nouveaux rendus entre eux et à leurs familles sources.

`scripts/browser-defense193.mjs` exerce les boutons réels d’installation et de réarmement, l’écoulement ordinaire des images, la pause puis Sauver/Quitter/Recharger/Continuer. Les scènes avancées déclarent explicitement les infrastructures achevées, les pièces finies et les contacts physiques préparés. Elles ne représentent pas une partie organique menée jusqu’à ces âges, une mesure de fluidité sur téléphone physique ou un équilibrage complet de campagne.
