# Diagnostic ciblé du relevé narratif Windows — 22 octobre 2026

## Conclusion

Le refus `Native survey action did not advance` est reproduit localement dans Chromium au **premier pas de 0,25 seconde du secteur market**, avec le même état de départ que le smoke : story, rearguard, graine 17117, entrée joueur actuelle. La seule condition de refus observée est l'obstruction physique de la position.

La même reproduction est obtenue avec les sources publiques de la référence `74a62084e96dd7e78463bd4e15b9ec2897887704`, où les nouveaux modules d'inspection n'existent pas. La défaillance reproduite ne provient donc pas des nouvelles inspections. L'origine locale est une incohérence d'accessibilité préexistante du secteur narratif market dans la géométrie métrique actuelle.

Cette preuve locale ne remplace pas une exécution réussie du paquet Electron sous Windows. Le journal Windows ne contient pas les valeurs des gardes ; rattacher son refus précis à la même obstruction reste une inférence étayée par la reproduction déterministe.

## Preuve archivée

- [Résumé, emprise et empreintes](diagnostic-survey-20261022.json).
- [Rapport complet compressé](diagnostic-survey-rapport-20261022.json.gz).
- [Script de diagnostic exact compressé](diagnostic-survey-script-20261022.mjs.gz).
- Source actuelle : `7ec448a552c6ad65cc3b167e9e4974d7f8772585`.
- Référence comparée : `74a62084e96dd7e78463bd4e15b9ec2897887704`.
- Navigateur local déjà présent : Chromium `153.0.8010.0`.

Les archives gzip sont déterministes : niveau 9, `mtime=0`, sans nom de fichier original dans l'en-tête. Leur décompression restitue exactement les octets des fichiers de diagnostic conservés. Les contenus bruts ne sont pas dupliqués dans ce dossier ; les noms d'extraction indiqués dans le résumé ne désignent pas des fichiers bruts présents. L'emprise de l'obstacle est intégrée au résumé.

| Contenu | SHA-256 du gzip | SHA-256 des octets décompressés |
|---|---|---|
| Rapport | `c9e6f8c06572e4f7b0939d719a220dd290e36b4b6f097c72343a468e805f3999` | `93da83293ffe5e5f1d929fcdbb15143030a6d6b8ae3949557840b0650aa2af52` |
| Script | `6d18ab6b5d46e8c39db3619fb965f1cf066983e6184d097bb27d73c13b8c5f10` | `41208aa891a94cbbc0b9c253c9350dd948c9b1fb4de6326de955b616081a53cd` |

Le champ `pass: true` du rapport signifie que le **diagnostic** a abouti. Il ne signifie pas que le smoke Windows a réussi : les refus market des deux entrées actuelles figurent explicitement dans `profiles[].survey.runs`.

Les métadonnées génériques héritées du harness ont été corrigées après le passage : le champ global `base` indique désormais l'origine sans paramètres et chaque profil indique son URL demandée. Les deux profils default ont utilisé `http://127.0.0.1:41601/` ; seul le profil legacy a utilisé `http://127.0.0.1:41601/?tools=1&fixture=legacy`. Les substitutions effectivement observées sont détaillées et empreintées par profil. La même correction de métadonnées figure dans le script reproductible ; la logique du relevé et de la comparaison n'a pas changé.

## Comparaison effectuée

Trois contextes Chromium neufs ont utilisé le serveur localhost et le harness existants (`scripts/browser-qa-common142.mjs`). Les service workers étaient bloqués. Les contrôles DOM ont sélectionné story/rearguard/17117, sauté l'introduction, conservé la pause, reproduit la modification de bois et de position déjà déclarée dans le smoke, puis les ouvertures/fermetures du commandement, ordres des équipes et rendu du bilan caché. Le bloc de relevé appelle réellement `updateNarrativeSurvey(.25)` après `togglePause(false)` et ajout de `KeyE` ; aucun résultat du relevé n'est forcé.

| Profil | Génération / géométrie locale | Inspections | Market au centre | Housing au centre |
|---|---|---|---|---|
| Commit actuel, URL sans paramètres | G10 / cityGeometry202=1 | Module chargé ; 0 panneau monté | Refus dès le premier pas ; progression 0 | 32 pas acceptés ; progression 8 s |
| Référence main74a, URL sans paramètres | G10 / cityGeometry202=1 | Module absent (`undefined`) | Refus identique ; progression 0 | 32 pas acceptés ; progression 8 s |
| Commit actuel, `tools=1&fixture=legacy` | G8 / cityGeometry202=0 | Module chargé ; 1 panneau monté | 8 pas acceptés ; progression 2 s | 32 pas acceptés ; progression 8 s |

Les trois profils n'ont enregistré aucune erreur JavaScript ni réponse HTTP en erreur. Les ressources, l'insight et le moral sont restés identiques avant/après les relevés.

La comparaison de référence est une substitution de réponses HTTP dans le navigateur, sans checkout ni construction d’un paquet main. Seuls les trois fichiers publics nécessaires et modifiés depuis main ont été effectivement remplacés par leurs blobs Git main :

| Fichier | SHA-256 du contenu main |
|---|---|
| index.html | 1e3684c7bf4e282a5f79020588ae42da4058b2473db4c72b5a03fb7eaecd6538 |
| src/coordination.js | e05d45d0d3aed397d166f1ec320937f98e518f788e61e2db2445c4dd515a5c22 |
| src/world-codex.js | 7dd24b943e89d49b05d112af0071ef9d258e2235e66dc22204b730a13936b74a |

Le blob main de `sw.js` était aussi préparé mais n'a pas été demandé, puisque les service workers étaient bloqués. Le HTML main ne charge aucun des nouveaux fichiers d'inspection. Les autres sources publiques et assets de ces pages sont inchangés dans le diff avec main. Il ne s'agit pas d'une nouvelle compilation du paquet Windows main.

## Conditions exactes du refus market

Pour les deux entrées actuelles, le premier appel donne :

- `state = playing`, `paused = false`, `gameOver = false`.
- `player.dead = false`, `health = 100`, rayon du joueur 13.
- `KeyE = true`, `dt = 0.25` valide.
- Site `site-2`, thème `market`, « Les Arcades muettes ».
- Centre et position du joueur : `(1767.75, 3062.87)`.
- Enregistrement narratif présent, `survey = 0`, donc relevé non achevé.
- `friendlyPositionClear = false`.
- Les quatre sondes du moteur touchent la sentinelle de collision `{id:-125,type:'world125'}`.
- `updateNarrativeSurvey(.25) = false`, progression inchangée à 0.

La sentinelle `world125` est émise par `src/exploration-125.js` pour les solides de son plan natif ; ce n'est pas l'identité d'un nouveau bâtiment d'inspection.

Le générateur natif `createFeaturePlan(17117, 4096, 4)` identifie le solide concerné :

```json
{
  "x": 1566,
  "y": 2957,
  "w": 320,
  "h": 256,
  "kind": "settlement-building",
  "settlement": "settlement-2",
  "building": "settlement-2-building-2"
}
```

Son emprise contient **tout le disque narratif de rayon 90** autour du centre market. La plus faible distance du centre à un bord est 105,87. Il n'existe donc pas de position admissible dans ce disque, même avant de tenir compte du rayon du joueur. Le diagnostic navigateur a également cherché des points libres sur 89 rayons et 32 directions sans en trouver ; la preuve rectangulaire ci-dessus ne dépend pas de cet échantillonnage.

Housing, au point `(511.08, 2469.53)`, reste praticable et progresse de 0 à 8 secondes dans les trois profils.

## Recommandation en lecture seule

Un durcissement minimal du smoke peut sélectionner un point physiquement libre dans le rayon de chaque secteur, puis vérifier que le premier site choisi par la logique native est bien le thème attendu. Il doit conserver l'appel réel à `updateNarrativeSurvey`, la progression exacte attendue et les vérifications de sauvegarde/reprise.

Si aucun point n'existe, ce helper doit produire un échec explicite contenant thème, graine, révision géométrique, centre et gardes observées. Il ne doit ni ignorer le secteur, ni injecter une progression, ni désactiver les collisions.

**Ce seul durcissement ne rendra pas vert le market de la graine 17117 en géométrie actuelle**, puisque le disque entier est obstrué. Une correction réelle exigerait de résoudre l'accessibilité du marqueur narratif par rapport au plan métrique, puis de conserver une régression sur cette graine. Changer le seed ou passer le smoke en mode legacy contournerait le cas reproduit et ne constitue pas la correction de cette incohérence.

## Trace d'exécution et réutilisation

Le script archivé est une **trace exacte du diagnostic local**, pas un outil utilisateur portable. Il conserve intentionnellement les chemins absolus de la session : dépôt `/workspace/scratch/b8ff726dd748/deadwall`, navigateur `/tmp/yautja-chromium/chromium` et sorties sous `/tmp/deadwall-survey-20261022/`. Il importe le harness du dépôt à ce chemin. Ces valeurs ne garantissent pas une exécution sur une autre machine.

La commande utilisée dans cet environnement était `node /tmp/deadwall-survey-20261022.mjs`, avec les permissions permettant les sous-processus et le serveur localhost. Pour une réutilisation ailleurs, il faut d'abord extraire le script, disposer du dépôt et du navigateur compatibles, puis adapter explicitement les chemins et l'environnement. Aucun téléchargement automatique ni certification de portabilité n'est fourni par cette archive.

Le rapport et le script archivés incluent la clarification de métadonnées réalisée après l'exécution : intitulé global, URL demandée par profil et substitutions réellement observées. La logique du relevé et les résultats observés sont inchangés ; ces corrections de métadonnées ne sont pas présentées comme un nouveau passage. Les SHA-256 ci-dessus portent sur ces fichiers conservés et clarifiés.

## Limites

Cette reproduction cible le bloc de relevé et les transitions de pause/commandement qui le précèdent. Elle ne rejoue pas le chargement explicite de tous les atlas optionnels, les contrôles d'isolation Electron, les réglages de la fenêtre native, tout le smoke de création/reprise, ni une campagne complète. La mutation des coordonnées du joueur est la fixture de diagnostic déjà employée par le smoke ; ce n'est pas un déplacement naturel. Aucun correctif produit n'a été appliqué.
