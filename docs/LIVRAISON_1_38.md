# DEADWALL 1.38.0 — Passages & survie

## Lancer et reprendre

Extraire l’archive complète puis ouvrir `DEADWALL_Standalone.html`. `dist/` contient la version web. Sources, tests et images sont inclus. Aucune nouvelle campagne n’est nécessaire : cartes, générations G1–G6, plan de D-17, inventaires et possessions sont conservés.

## Corrections livrées

- **Véhicules** : bus et camion peuvent atteindre le seuil de sortie de D-17 ; les portières déposent le personnage hors de leur gabarit. Après destruction, une sortie libre est recherchée. Une ancienne reprise dans une épave peut dégager ce seul chevauchement.
- **Collisions** : déplacement et rotation des véhicules respectent leur rectangle orienté devant les annexes. Les barricades locales prennent le vrai rayon des véhicules et convois.
- **Combat** : les barricades trop proches du canon interceptent la balle, qui les endommage normalement. Recharge et travail manuel se refusent mutuellement dans les chemins corrigés.
- **Logistique** : inventaire, soin, assemblage, devis de déplacement et anciens boutons d’expédition revérifient l’occupation des mains avant paiement ou transfert. Le soin local ne traverse plus les bâtiments pleins.
- **Travaux et énergie** : ravitaillement et démarrage d’un groupe exigent la sécurité annoncée ; son arrêt reste permis sous menace. Un menu prioritaire ferme immédiatement le mini-jeu et annule la tentative payée sans remboursement ni réparation gratuite.
- **Interface** : le focus revient à un contrôle réellement accessible après fermeture d’un tiroir ; une interruption ne vole plus le focus déjà placé ailleurs.
- **Images** : tôle patinée et béton intérieur pour les types industriels compatibles, avec ombres gardant une direction monde commune.

Les coûts et statistiques existants sont conservés. Le soin régional et le cycle d’ouverture de l’inventaire ont passé leur reproduction : aucun correctif artificiel de ces deux logiques n’a été ajouté. Les anciennes générations ne sont pas des systèmes obsolètes à supprimer : elles permettent la reprise exacte des campagnes existantes.

## Preuves et limites

Le rapport final `reports/1.38.0/RAPPORT_CORRECTIONS_1.38.0.html` rassemble les résultats de `DEADWALL_SOAK=1 npm run check`, les contrôles intégrés de boucle de survie et de voyage, ainsi que les comparaisons avant/après. Les documents `MONDE`, `COMBAT`, `PROJECTILES`, `LOGISTIQUE`, `INTERVENTIONS`, `UI` et `VISUEL` suffixés `_1_38.md` détaillent les cas reproduits.

Les tests utilisent l’ordre de scripts HTML livré sous DOM simulé, avec états et approches préparés explicitement. Les captures utilisent le véritable chargeur et les peintres du jeu avec Canvas natif. CSS interactif, tactile matériel, audio et FPS GPU restent non certifiés. Ces contrôles ne prouvent pas toutes les graines ni une campagne humaine entière. Le rendu conserve des atlas historiques obliques et des objets régionaux géométriques ; il ne devient pas une projection 3D uniforme.

Les deux nouvelles images PNG d’origine sont dans `assets/art138/`, leurs prompts dans `PROMPTS.md`, leurs dimensions et empreintes dans `assets/PROVENANCE_1_38.json`. Les images précédentes et les originaux du codex sont conservés. Aucun déploiement distant n’a été effectué.
