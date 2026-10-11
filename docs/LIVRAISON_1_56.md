# DEADWALL 1.56 — Accès, soins et fortifications

Cette passe part de la version 1.55.0, commit `4a402dd811c80e2992a6cec4ef6ee13e47ba2e03`. Elle traite les incohérences reproduites entre obstacles, visibilité, soins, travail manuel et commandes. Les vérifications et limites sont documentées dans [l'audit 1.56](AUDIT_1_56.md).

## Changements jouables

- Les cadavres, filets payés et opérations de déblaiement prennent en compte les extrémités des portes et leur rotation. La proximité se mesure depuis leur emprise réelle ; le rayon de 52 unités, les charges et les débits restent inchangés.
- Les fondations d'annexes forment désormais les mêmes obstacles pour la marche, les véhicules, les tirs, les menaces et l'observation. Une tour ignore uniquement sa propre emprise pour regarder dehors, jamais une autre annexe.
- Une blessure interrompt immédiatement l'assemblage ou la réparation d'armurerie, même si un soin arrive pendant le même pas. Les matériaux non encore payés restent disponibles ; l'invulnérabilité sans blessure n'interrompt pas le travail.
- La clinique conserve ses débits de 1,6 PV/s pour le commandant et 2,2 PV/s par unité, contre **0,025 médicament par PV**. Les soins sont limités au stock disponible, aux personnes vivantes et présentes, à l'accès physique et à l'électricité. Les hôpitaux ne soignent plus le commandant parti dans la région depuis sa position locale mémorisée.
- Les devis de courte relève, bâche et lanterne refusent un camp dont la durée restante ne permet pas de terminer le travail. Les coûts, durées et annulations restent ceux des opérations existantes.
- Monde, Flotte, Districts et Équipe conservent les boutons encore présents pendant leurs rafraîchissements. Les commandes et disponibilités restent actualisées ; une seconde activation AFFECTER devenue RETIRER utilise bien l'action courante. La flotte indique ses refus hors D-17. Les cibles tactiles du panneau atteignent 44 px de haut.

## Campagnes et compatibilité

La boucle récolter → déposer → construire → automatiser → fortifier → survivre → réparer, les onze âges, les générateurs G1–G7 et le format général de sauvegarde **v20** sont conservés. Aucun nouveau stock ni ressource de migration n'est accordé. Une seed reproduit la géographie ; elle ne garantit pas une simulation compétitive déterministe. La cible Standard de **6 à 10 heures** jusqu'au onzième âge reste à vérifier dans des campagnes humaines complètes.

Les seuils de progression et les stocks finis restent ceux de la campagne. Le catalogue décrit les conditions réellement appliquées à la clinique et aux recettes : courant, accès, fournitures et travail physique. Les images existantes sont conservées ; cette passe ne prétend pas avoir inspecté visuellement chaque sprite et chaque animation.

Le site de livraison est https://deadwall-last-enclosure.vercel.app/. Ce guide décrit le candidat ; le compte rendu final et les reçus HTTPS attesteront sa publication après validation.

## Lancement et validation

Avec Node.js ≥22.12, lancer `npm ci`, puis `npm start`. `npm run check` vérifie syntaxe, build et tests natifs. `test:browser` inclut la PWA ; les campagnes et le HTML autonome gardent leurs parcours propres. Les tests Chromium/Linux avec tactile émulé ne certifient pas Windows natif, les appareils physiques ou une publication en boutique.

Les performances sont mesurées séparément à 1280×720 et DPR 2, avec des scènes calmes et des scènes préparées de 120, 300 et 720 infectés. Les scènes préparées ne mesurent pas l'acquisition des ressources en campagne. Les grandes hordes sur GPU logiciel restent lentes ; aucune cadence commerciale ou configuration minimale physique n'est garantie. La navigation régionale bornée ne garantit pas un contournement complet de tous les grands bâtiments.
