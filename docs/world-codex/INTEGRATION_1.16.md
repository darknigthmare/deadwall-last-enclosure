# Intégration des lieux du codex — 1.16

Les plans supplémentaires sont définis dans `src/frontier-places.js`. Les composants de cour sont des contenants physiques avec identifiants `Pxxxx:out:n`, quantités finies et le même transformateur que leurs murs. Les 22 plans précédents restent dans `frontier-geometry.js`.

Les nouvelles régions sont de génération 2. La génération 1 reproduit exactement la géométrie 1.15 pour les graines testées, y compris les prises et les chunks. Les sauvegardes du carnet retiennent la génération, les annotations et le repère. Ne jamais modifier silencieusement le sens d’un identifiant existant.

Les futures intégrations doivent suivre région, réseau, parcelle, volume, étage, pièce, usage, prop et contenant. Un décor de machine ne doit pas être décrit comme productif sans un système explicite. Les scènes de test ne prouvent pas une campagne entière ni la fluidité de toutes les populations.

Le codex complet reste un paquet compagnon (`DEADWALL_CODEX_500_LIEUX_1.16.zip`). Il n’est pas chargé dans les écrans publics. Sa couverture passe à 34 plans pilotes et 466 conceptions ; les fiches décrivent un programme souvent plus riche que le plan déjà implémenté.

| Fiche | Plan | Volume principal | Niveaux |
|---|---|---|---|
| DW-0065 | bakery — boulangerie | 22 × 17 m | RDC |
| DW-0153 | library — bibliothèque | 32 × 24 m | RDC, étage 1 |
| DW-0046 | garden — jardinerie | 36 × 28 m | RDC |
| DW-0097 | veterinary — clinique vétérinaire | 26 × 20 m | RDC |
| DW-0085 | laundry — laverie | 21 × 15 m | RDC |
| DW-0181 | firestation — caserne de pompiers | 36 × 28 m | RDC, étage 1 |
| DW-0224 | selfstorage — garde-meubles | 36 × 26 m | RDC |
| DW-0367 | marketgarden — maraîchage | 32 × 24 m | RDC |
| DW-0082 | postoffice — bureau postal | 28 × 22 m | RDC |
| DW-0444 | gym — gymnase | 38 × 28 m | RDC |
| DW-0104 | inn — auberge | 28 × 23 m | RDC, étage 1 |
| DW-0251 | scrapyard — casse automobile | 35 × 25 m | RDC |
