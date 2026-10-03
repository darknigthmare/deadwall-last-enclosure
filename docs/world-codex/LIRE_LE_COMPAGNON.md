# Compagnon inclus — version 1.26

Le catalogue complet est désormais inclus dans `codex-3000/` à la racine du projet. Ouvrir `codex-3000/LIRE_CODEX_3000.html` pour consulter hors ligne les 3 000 fiches : 1 000 originales préservées, puis 2 000 compositions de conception. Le guide intégré propose 59 modules avec statuts de disponibilité. Consulter `docs/codex/README.md` pour la modularité.

La notice ci-dessous est conservée comme historique ; sa demande de fichier externe ne concerne plus la livraison 1.26.

---

# Compagnon de conception du monde

Le codex de 500 lieux est livré séparément sous `DEADWALL_CODEX_500_LIEUX_COMPLET.zip`, avec un lecteur autonome `DEADWALL_CODEX_MONDE_500.html`. Il est conçu pour les prochaines générations de sources, **pas pour une interface administrative en jeu**.

Ses 25 familles contiennent chacune 20 types distincts. Les fiches donnent parcelle, programme de pièces et sous-zones, mobilier dimensionné, orientations, voies publiques et service, niveaux, règles d’abandon, ressources finies et critères QA. Les plages de dimensions sont des propositions de level design : ne jamais combiner tous les maxima dans l’enveloppe minimale.

Les plans effectivement présents dans `src/frontier-geometry.js` sont reliés à 22 identifiants du codex. Les 478 autres types sont des conceptions, pas du contenu jouable annoncé. Le plan pilote d’un centre commercial ne contient pas automatiquement toutes les variantes du programme documenté.

La hiérarchie de génération à préserver est : région, relief/biome, réseau, quartier, parcelle, volumes, étages, pièces, zones d’usage, props, contenants. Ne pas répartir d’abord des ressources puis les habiller de bâtiments miniatures. Une ressource appartient à un lieu, un usage et un contenant persistants.

Les prochaines intégrations doivent reprendre les tests généraux du jeu, conserver les identifiants persistants et documenter les migrations. Un rendu, une carte consultée ou l’éviction du cache ne doit jamais consommer l’aléatoire du combat ou remplir de nouveau un contenant.
