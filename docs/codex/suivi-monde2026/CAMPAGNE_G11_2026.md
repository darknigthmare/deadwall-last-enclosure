# Campagne G11 — modèles résidentiels et preuves distinctes

Le raccord G11 concerne quatre typologies : parc résidentiel de mobil-homes (T045), camping caravanes (T046), camp de travailleurs (T047) et parc de caravanes abandonné (T048). Chacune possède 50 adaptations potentielles. Le registre conserve l’identifiant auteur `EXT-MONDE-T045-V01` et son alias de campagne `campaign205-045-01`, sans transformer le plan d’inspection en un autre document.

**200 modèles éligibles ne signifient pas 200 sites dans une graine.** L’admission régionale reste bornée à huit sites, au plus deux par type, et dépend des emprises, routes, accès et du terrain effectivement disponibles. Un même modèle peut avoir deux instances physiques distinctes ; leur identifiant de site et leur graine sont alors conservés séparément dans les témoins.

## Réception par modèle et par graine

Le [rapport d’éligibilité G11](campagne205-eligibilite.json) est produit par `scripts/audit-campaign-sites205.cjs` après stabilisation des sources. Le suivi refuse un rapport absent, incomplet, une source dont les octets ont changé, un alias substitué, un contrôle négatif ou une implantation témoin invalide.

Chaque modèle doit posséder sa preuve de plan physique, de mobilier, de budget fini et de portes accessibles. Les témoins de graines donnent les sites effectivement admis, leurs identifiants et coordonnées. Une graine n’ayant admis aucun site reste un témoin explicite ; elle ne reçoit pas de quantité de remplacement. Les compteurs publiés sont recalculés depuis ces enregistrements, sans extrapolation aux autres graines.

La feuille dérivée **Campagne G11** du classeur présente les modèles et leurs observations. Les instances sont comptées séparément des graines : deux sites d’un même modèle dans une graine comptent pour deux instances et une seule graine. Les lignes sans témoin indiquent l’absence d’observation pour ce modèle dans cet audit, sans inventer une présence dans le monde.

## Audit G11 du 25 octobre 2026

Le [rapport historique de la 1.72](https://github.com/darknigthmare/deadwall-last-enclosure/blob/8780075f305e405e5aa94e593a70d11391b16e20/docs/codex/suivi-monde2026/campagne205-eligibilite.json) contrôle **200/200 adaptations** et **225 fichiers sources**, avec des captures strictement identiques avant et après exécution, puis comparées aux fichiers livrés. Son SHA-256 est `d9b849b19deaf80593abb81007c124fc551f0d3d43faaf60da85753b8587804c`.

La [réception distincte de la 1.73](https://github.com/darknigthmare/deadwall-last-enclosure/blob/70c790cdfab3c2c8b286c70269786872d8be5217/docs/codex/suivi-monde2026/campagne205-eligibilite.json) relit **226 sources** et conserve les mêmes 200 modèles et 63 implantations ci-dessous ; son SHA-256 est `21afaf14cca4ec979b356c31743d4e3576f84a0df74be459c1f2b9c8358c6841`. Le lien relatif en début de document désigne le rapport du checkout courant ; les anciens compteurs ne lui sont pas réattribués.

| Graine témoin | Sites réellement admis |
| --- | ---: |
| 0 | 8 |
| 1 | 8 |
| 42 | 8 |
| 17117 | 8 |
| 84329 | 8 |
| 967313470 | 7 |
| 1947648717 | 8 |
| 4294967295 | 8 |

Ces témoins totalisent **63 instances physiques de 58 modèles distincts**. Les 142 autres modèles restent éligibles mais ne sont pas observés dans ces huit graines. La graine `967313470` conserve sept sites après les refus natifs de placement ; aucune huitième présence n’est forcée. Chaque site retenu passe les contrôles de circulation intérieure, de porte, de liaison routière et de façade, tout en conservant les sites et routes historiques. Ces résultats ne garantissent aucune quantité pour une graine supplémentaire.

## Progression conservatrice

Les 4 000 variantes de la feuille d’inspection conservent `playable:false`, leur rapport auteur et leurs étapes distinctes. Le rapport G11 ne ferme aucune tâche globale. Le contrôle des budgets de modèles fait avancer **butin** à **En cours** ; des implantations réellement observées permettent le même avancement pour **seed**. Ces preuves ne remplacent ni une transaction de collecte, ni un service payé, ni une rencontre, ni une sauvegarde et une reprise, ni un parcours de campagne complet.

Les rencontres réemploient l’occupation et les contacts régionaux existants. Les services utilisent les propriétaires de sécurisation, de relais payé, de dépôt et de repos ; un équipement dessiné ne produit ni eau, ni courant, ni ressource. Leurs qualifications restent distinctes des contrôles de géométrie et des 200 modèles éligibles. Les règles d’éclairage, menace, portage, coût, interruption et persistance restent celles de leurs propriétaires.

Les treize feuilles historiques, leurs formules, filtres et styles sont conservés lors de l’ajout de cette feuille de preuves. La copie Drive initiale n’est pas remplacée. La qualification CI du commit final et le déploiement demeurent des réceptions séparées du classeur.
