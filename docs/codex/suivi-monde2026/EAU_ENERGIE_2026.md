# Eau et énergie — plans T057 à T059 et T061 à T064

Cette extension produit 350 compositions auteur originales : sept activités, cinquante géométries distinctes chacune. Elles sont destinées à l’inspection du Guide ; leur présence ne crée aucune centrale ou station dans une campagne.

| Type | Activité | Composition de procédé |
| --- | --- | --- |
| T057 | Centrale thermique | Combustible, chaudière, turboalternateur, refroidissement, fumées et sortie électrique |
| T058 | Centrale hydroélectrique | Bassin amont, conduite fermée, turbine, restitution aval et transformateur |
| T059 | Poste électrique régional | Arrivée, deux transformateurs, départs, réactance et rétention |
| T061 | Épuration urbaine | Dégrillage, décantation, aération, clarification, digestion et stockage des boues |
| T062 | Lagunage | Prétraitement, lagunes primaire et secondaire, finition et lit planté |
| T063 | Eaux industrielles | Égalisation, neutralisation, séparation, filtration, eau traitée et boues |
| T064 | Potabilisation | Eau brute, coagulation, décantation, filtres, désinfection et réservoir |

Chaque site comporte cinq bâtiments inspectables : administration, personnel, maintenance, alimentations auxiliaires et conduite du procédé. Les 22 pièces hors circulation reçoivent du mobilier correspondant à leur usage. Les appareils extérieurs conservent leurs dimensions physiques. Les bassins et lagunes sont des volumes fermés infranchissables ; aucun sol d’inspection ne permet de marcher sur leur eau.

Les installations restent arrêtées, vides et non raccordées. Les circuits de procédé indiquent les branches et les milieux concernés : les boues ne sont pas une étape de traitement de l’eau potable ; la sortie électrique d’une turbine ne passe pas par le bassin aval. Ces schémas ne créent ni tuyau fonctionnel, ni énergie, ni réaction chimique, ni rendement. Le graphe des trajets de service est distinct : il relie à pied les points d’arrêt extérieurs, sur des voies sèches contrôlées par collision.

## Variantes et échelle

Cinq tailles de parcelle sont combinées à dix dispositions. Les sites mesurent 440 à 520 m de large et 430 à 502 m de long. L’ordre des bâtiments, leurs faces d’accès, les dimensions et positions des équipements évoluent selon la variante. Le changement de taille représente une composition auteur choisie ; aucune voiture, machine ou pièce de mobilier n’est réduite pour passer entre deux volumes.

Toutes les emprises, hauteurs et distances sont des choix auteur originaux en mètres. Elles ne sont ni des relevés d’installations existantes, ni des normes de sécurité ou de dimensionnement technique. Les équipements ne sont inspectables que depuis leur pourtour. Intérieurs de machines, ouvrages hydrauliques complets, supports dénivelés, girations et séparation des flux industriels restent ouverts.

## Vérification et étapes restantes

Le générateur est `scripts/codex-utilities2026.cjs`. Les tests dans `tests/codex-utilities2026.test.cjs` vérifient toutes les variantes : identité, déterminisme, géométries distinctes, pièces reliées, mobilier, fronts de service, obstacles d’eau et trajets piétons. Les tests négatifs refusent un bassin praticable, une route traversant un volume fermé, un schéma de procédé altéré, un stock fictif ou un service déclaré raccordé.

La qualification complète de campagne exige encore implantation cohérente dans les seeds, relief amont/aval et raccords réels, intrants finis, opérations payées, retours visuels et sonores, rencontres, persistance et reprise de sauvegarde. L’inspection n’achève pas ces étapes du classeur.
