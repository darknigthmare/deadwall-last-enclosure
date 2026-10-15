# DEADWALL 1.61 — Codex détaillé, échelles et citadelle verticale

Cette intégration réunit les ajouts du Codex détaillé (PR #2), les dimensions et dessertes physiques (PR #5), puis la citadelle verticale et son personnel (PR #6, suites 175 à 181). Elle conserve la base 1.60, les programmes G10 et leurs services de terrain. Les paquets de préparation 173 et 175 sont matérialisés en sources examinables ; leurs anciens workflows d'application automatique sont retirés.

Ce document décrit le périmètre et les limites de l'intégration. Les reçus de validation et de publication identifient le commit effectivement contrôlé ; les anciens rapports de branches ne certifient pas la version réunie.

## Codex, mobilier et dimensions

Le Guide conserve les identités des 4 000 programmes et ajoute les prescriptions détaillées : pièces, niveaux, quantités, équipements, cours et jardins. Son inspecteur compare les prescriptions avec les objets réellement placés. Les compléments successifs sont facultatifs et activables depuis le dépôt de D-17 dans **Monde & relais** ; **COMPLÉTER LES TRAVÉES INTÉRIEURES** correspond à la révision de détail 10. Cette révision est distincte de la génération régionale G8, G9 ou G10.

La génération des compléments est déterministe et bornée. Elle conserve les anciennes présences et réserve les accès ; une demande de mobilier peut être refusée faute d'espace. Les minima de conception ne garantissent donc pas leur réalisation dans chaque plan. La consultation du Guide ne révèle aucun lieu inconnu et ne fournit pas de butin. Les services G10 achevés et les prélèvements restent dans leurs registres propriétaires.

Le **laboratoire d'architecture native et de réseaux** accessible depuis une fiche construit une scène séparée avec niveaux, escaliers, pièces, extérieurs et circuit électrique. Son carburant d'essai appartient au banc. Les modèles de tunnel, échangeur et port sont également des scénarios du laboratoire. Ils ne remplacent pas les lieux d'une campagne et n'y ajoutent ni train ni bateau pilotable. Certaines parcelles dépassent encore l'enveloppe auteur et certains niveaux sont déduits : les audits les signalent. Détails : [CHANTIERS_PARALLELES_173.md](codex/CHANTIERS_PARALLELES_173.md).

Les contrats métriques distinguent mètres régionaux, unités locales, emprise physique et image projetée. La calibration volontaire d'un véhicule possédé utilise ses dimensions à D-17, avec contrôle de l'espace disponible. Le véhicule calibré emploie son rectangle orienté pour les manœuvres ; une rotation ou sortie impossible est refusée. Les anciennes voitures non calibrées conservent leur comportement. Les raccords routiers partagent un résolveur et un contrôle de largeur, d'obstacles et de niveau ; un accès impossible reste signalé. Détails : [METRIC_FRONTAGE_174.md](METRIC_FRONTAGE_174.md) et [METRIC_RIGID_175.md](METRIC_RIGID_175.md).

## Enceintes et quartiers en hauteur

Le catalogue vertical comprend **39 supports, 31 équipements et 11 kits de passerelle** répartis sur les onze âges. Les ouvrages se financent et se construisent dans le monde ; consulter le catalogue ne débloque pas un âge. Les nouvelles dalles suivent les plafonds de financement de 2 à 72 m selon la progression, les limites propres au support et sa charge. Les étages déjà acquis d'une sauvegarde compatible sont conservés.

Les remparts, portes et bastions portent des chemins de ronde ; les fondations compatibles acceptent plusieurs paliers. Les équipements apportent logement, stockage, production, éclairage, soins ou défense avec leurs coûts et besoins réels. Les passerelles relient des paliers compatibles. La dépose, la réparation et la reconfiguration vérifient les occupants, les attaches et les stocks ; elles ne recréent pas les réserves d'un équipement.

Rejoindre l'entrée d'un support achevé puis utiliser **MONTER**. Les escaliers font parcourir une liaison temporisée jusqu'au palier ; ce ne sont pas des intérieurs libres marche par marche. Les ascenseurs financés requièrent de l'énergie et les escaliers restent disponibles. Un affût doit être rejoint et ravitaillé physiquement. **V / VUE FPS** change la caméra, **I / QUITTER L'AFFÛT** libère son contrôle. Les deux vues partagent tirs, munitions, chaleur et cibles ; la vue perspective utilise une géométrie WebGL procédurale.

Des survivants déjà présents peuvent être affectés aux paliers pour livrer des munitions, garder, réparer ou soigner. Les trajets utilisent escaliers et passerelles ; les matériaux transportés sont finis. Une affectation ne recrute personne et ne crée aucune réserve. Le registre vertical versionné conserve les supports, équipements, liaisons et affectations compatibles avec le reste de la sauvegarde.

Le siège vertical ajoute grimpeurs, pression sur les accès et trois profils de géants de 6, 12 et 20 m, avec conditions d'apparition, attaques annoncées et points faibles. Ces profils appartiennent à cette extension. Les plafonds de population et les budgets de simulation restent bornés. Les règles autoritaires de coûts, portée, charge, accès et apparition résident dans `src/core.js`.

Guides détaillés : [citadelle](vertical175/README.md), [âges](vertical175/AGES_177.md), [maintenance](vertical175/MAINTENANCE_178.md), [réseau](vertical175/NETWORK_180.md) et [personnel](vertical175/PERSONNEL_181.md). Les comptes rendus de ces branches sont historiques ; leurs nombres de tests et fichiers publics ne décrivent pas automatiquement la version réunie.

Audit des corrections et limites : [AUDIT_1_61.md](AUDIT_1_61.md).

## Vérifications de la version réunie

```sh
npm ci
DEADWALL_SOAK=1 npm run check
npm start
```

La CI principale conserve le contrôle natif complet avec reçu de sources, les parcours web existants, le paquet Windows et ses deux lancements. Elle ajoute les parcours du Codex détaillé, des compléments, des commandes tactiles, des métriques et des sept suites verticales. Les scénarios navigateur verticaux doivent fournir un contexte WebGL ; leurs journaux et captures sont conservés avec les autres preuves du groupe. Chaque échec reste enregistré, même lorsque les autres suites du groupe poursuivent leur exécution.

Les tests de campagne distinguent les commandes réelles des scènes préparées. Des matériaux, murs ou paliers préparés pour vérifier une transaction ne représentent pas une campagne naturellement jouée. La cible Standard de **6 à 10 heures** exige encore des campagnes humaines complètes. Les vues mobiles émulées et le GPU cloud ne certifient pas la fluidité sur téléphone physique.

Le rendu vertical reste procédural. Les logements individuels, toute la vie civile, le fret autonome de modules, les cabines libres et l'effondrement structurel général restent des chantiers distincts. La calibration des emprises ne certifie pas chaque pixel de toutes les façades ou meubles. Les limites des 18 références G10 partiellement adaptées restent décrites dans [LIVRAISON_1_60.md](LIVRAISON_1_60.md). Les conditions de distribution et notices demeurent dans [DESKTOP.md](DESKTOP.md) et [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
