# Reprise maritime et suivi reproductible — 21 octobre 2026

> Rapport historique de l’étape maritime. Les compteurs, validations et états de publication ci-dessous décrivent cette étape du 21 octobre. L’état courant des inspections et du classeur est consigné dans [PUBLICATION.md](PUBLICATION.md) et [INSPECTION_PHYSIQUE_2026.md](INSPECTION_PHYSIQUE_2026.md).

## Base et périmètre
Suite de `2a246d6f13933e6f8246b3694df9f47a947f8314`, PR #16, sur main 1.68 `6c6fbb6cf563bea6c89ade99c65f18c438481532`. **Outillage auteur uniquement**, sans ajout dans la carte jouée, sans modification de src, des sauvegardes, ressources, rencontres ou du hasard. Les 212 fichiers src de l'archive récupérée sont identiques à leurs empreintes après compilation.

## Travail repris
La passe interrompue avait publié trois tâches de dimensions validées (T060, T065, T066), 150 gabarits et huit tâches en cours, sans mettre à jour le classeur Drive. Ces acquis sont conservés. Une assertion ancienne attendait encore zéro validation : elle exige maintenant les trois identifiants exacts et leur preuve, pas un nombre arbitraire de tâches terminées.

## Cinq familles et 250 avant-projets
T005 cargo, T006 pétrolier, T007 croiseur déclassé, T008 sous-marin en surface et T011 soutien offshore ont chacun 50 compartimentages paramétriques distincts et déterministes. Les 250 sorties contiennent 8 280 occurrences de compartiments. Ce ne sont ni 250 navires réels relevés, ni 250 modèles artistiques, ni 250 lieux jouables.

Les longueurs, largeurs, tirants et dimensions de cale réutilisent les références primaires `references-metriques2026.json` : Damen CF5000, Socatra Alcyone, Buffalo Naval Park USS Little Rock, notice US Navy Torsk et Damen PSV3300CD. Les références Damen ont été relues ; la notice Torsk reste limitée à son extrait primaire indexé, pas à un plan général consulté. Chaque source a une portée explicite.

**Le tirant, le creux moulé, le niveau d'un pont et la hauteur totale sont différents.** `realTotalHeightM` reste null. Les positions de ponts, le sommet et le tirant d'air du gabarit sont marqués auteur. Les modèles utilisent une enveloppe rectangulaire, pas les formes exactes de coque. La cale du cargo conserve ses cotes publiées mais sa position est auteur ; les réservoirs et le pont de travail demeurent des réservations non accessibles.

Le programme prévoit locaux de vie, cuisine, mess, sanitaires, soins, ateliers, navigation et communications selon famille et pont. Les portes ont une position, une largeur et leurs deux espaces. Les liaisons verticales désignent escalier ou échelle ; une ligne de circulation ne change pas implicitement de pont. Tous les nœuds déclarés rejoignent le point d'embarquement interne, lequel reste **non relié au monde**. Ni passerelle à travers la mer, ni accès cargo, ni escalier du moteur ne sont prétendus construits.

## Contrôles et corrections
Les contrôles couvrent les volumes qui se chevauchent, les sorties d'enveloppe, le dégagement vertical, les passages trop larges, portes hors face, extrémités absentes, identifiants répétés, sauts verticaux et fausses connexions à la campagne. Les valeurs non finies et schémas incomplets échouent proprement. Aucun stock ni budget de spawn n'est ajouté.

Les premiers essais ont révélé des compartiments trop étroits dans les petits volumes arrière et des écarts trop grands entre ponts. Le nombre de travées et les ponts intermédiaires ont été corrigés, plutôt que réduire les largeurs de passage pour masquer l'erreur. Un test négatif déplaçait une pièce sur sa propre coordonnée X et ne créait aucun chevauchement ; il place maintenant réellement deux rectangles au même endroit. Les tests négatifs et leurs assertions sont conservés.

## Suivi
**800 tâches : 3 Validé, 13 En cours, 784 À faire.** Aucune nouvelle tâche d'architecture complète n'est fermée par cette passe. Les cinq architectures maritimes passent En cours ; leurs dimensions restent En cours tant que les références complètes manquent.

**4 000 variantes cibles : 150 Gabarit métrique, 250 Avant-projet maritime, 3 600 À concevoir ; zéro variante jouable validée.** Les 4 000 programmes historiques, 2 000 parents, 12 060 espaces et 13 539 références d'objets restent conservés.

`OBJECTIFS80.json` et le générateur compact reproduisent exactement les 80 typologies, 4 000 cibles et 800 tâches initiales du paquet corrigé. L'exporteur relit le catalogue du dépôt. Le build des données refuse une destination déjà remplie ; les patches de progression refusent les statuts ou preuves modifiés par un autre auteur. Aucune feuille éditée manuellement n'est écrasée par un générateur lancé automatiquement.

## Reproduction
Depuis un clone de la branche, sans dépendance supplémentaire pour ces commandes :

```sh
node --test tests/codex-world-foundations2026.test.cjs tests/codex-tracker2026.test.cjs tests/codex-maritime2026.test.cjs tests/codex-maritime-progress2026.test.cjs
node scripts/build-codex-tracker2026.cjs artifacts/qa/codex-tracker2026
node scripts/codex-maritime2026.cjs artifacts/qa/codex-maritime2026
```

Le premier groupe a terminé **44/44**, zéro échec, annulation, ignoré ou TODO. L'audit maritime produit 250 plans et 8 280 compartiments ; le groupe des fondations conserve ses 150 plans. Les ensembles de tests ne sont pas additionnés une seconde fois.

`npm run check` réellement exécuté : syntaxe 387 fichiers, build 358 fichiers publics et compilation réussis ; la suite générale a atteint le délai local de 150 secondes, sortie 124. **Pas de qualification générale, endurance, navigateur, Windows ou campagne revendiquée pour ce nouveau code.** Les anciennes validations CI ne lui sont pas réattribuées.

## Excel et publication
Le classeur reste le même fichier Drive, sans changement de permissions. Son accueil et ses statuts sont synchronisés séparément ; une feuille de références métriques est ajoutée. Les preuves et données générées accompagnent la sauvegarde. Le vérificateur XLSX compare les 4 880 identifiants/statuts, compte les formules, refuse leurs erreurs ou caches absents et contrôle les totaux du tableau de bord.

**Le binaire Excel n'est toujours pas commité dans GitHub.** Le mécanisme de transfert automatisé précédemment bloqué n'a pas été recréé ou contourné. La PR versionne ici les sources texte et les preuves de conception, et conserve le lien vers le XLSX sur Drive. Les étapes de production d'architecture, réseaux du seed, graphismes, services et gameplay restent distinctes. Aucune fusion ni publication de production.
