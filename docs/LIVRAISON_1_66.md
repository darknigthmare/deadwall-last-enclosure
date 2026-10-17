# DEADWALL 1.66 — Faune et survie

## Contenu jouable

Cette version intègre la chasse, la pêche et les enclos de la branche de la PR #9 après correction. La PR #7, prototype vertical ancien, reste conservée séparément : son format de sauvegarde et son architecture ne correspondent pas aux fortifications actuelles. Les deux PR ont été fermées à la demande du propriétaire ; leurs branches restent disponibles.

Les profils de nouvelle campagne « Régions naturelles », « Grands biomes » et « Mosaïque naturelle » proposent 26 espèces, dont les six espèces historiques. Le profil fait partie de l’identité du monde avec la graine : le changer peut aussi déplacer les implantations, routes et eaux. Continuer reprend le profil enregistré. Une ancienne sauvegarde sans hydrologie ne reçoit pas rétroactivement des lacs ou des animaux supplémentaires.

À pied dans une région naturelle, **Opérations → Expéditions → Récoltes sauvages** permet de préparer une dépouille visible avec un couteau ou une machette équipé, ou de pêcher un poisson réellement présent depuis une berge praticable. La pêche consomme une ligne de fortune au départ. Les récoltes ont une quantité finie ; le sac et le dépôt gardent leurs fonctions habituelles. Une interruption n’accorde aucune production et ne rembourse pas les intrants engagés.

**Enclos & transformation** ajoute des enclos physiques, la capture locale de cinq espèces, nourriture et eau douce sur place, reproduction des lapins et canards, viande brute, peaux, cuisson, tannage et réparation au cuir. Les coûts et durées sont dans `WildlifeHarvest190Rules` et `Husbandry191Rules` de `src/core.js`. La chaîne complète et ses limites sont décrites dans [EXTENSION_SURVIE_191.md](EXTENSION_SURVIE_191.md).

## Corrections de cohérence

- Les trajectoires aquatiques vérifient les milieux traversés et les emprises physiques des ponts, y compris un très petit déplacement qui coupe un angle du tablier.
- Les poses et reconstructions d’enclos vérifient les vrais gabarits orientés des véhicules, les occupants et les différents propriétaires de contacts hostiles. La conduite utilise aussi le rectangle réel du véhicule.
- Une blessure régionale interrompt immédiatement le travail, même si un soin rend la santé avant la prochaine étape. Un coup sans perte de santé pendant l’invulnérabilité n’interrompt pas l’action.
- Un enclos détruit peut être reconstruit avec paiement, sans effacer son identité, ses produits ou son historique. Les périssables continuent de vieillir dans une ruine. La remise en liberté refuse une origine devenue occupée.
- Le canard possède un pas animé ; la chauve-souris garde une silhouette de mammifère. Filet, couteau, cuisine, tannage, construction et puisage ont des gestes distincts attachés aux mains. Un chantier montre sa progression avant la création de l’enclos physique.
- Le Guide décrit les capacités actuelles et distingue espèces capturables, reproductibles et comportements facultatifs. Le cache PWA porte une nouvelle identité de version.
- Le raccourci **Faune & récoltes** se trouve dans le volet régional **Terrain & trajet**, accessible sur ordinateur et tactile ; il n’est plus attaché à l’ancien HUD masqué.

## Vérification et limites

`DEADWALL_SOAK=1 npm run check` reste la commande complète locale. La CI partitionne également tous les tests natifs sur six lots distincts, puis vérifie leurs journaux et la couverture exhaustive. Le groupe navigateur `wildlife` exécute les trois parcours 189, 190 et 191 sur la distribution construite, en complément des parcours de campagne, construction, assaut, sauvegarde et interface.

Les scénarios automatisés déclarent leurs préparations de ressources et de position ; le parcours d’élevage injecte explicitement du temps dans le contrôleur après les clics réels. Ils ne constituent pas une campagne humaine de 6 à 10 heures. Les appels animaliers sont synthétiques et les animations restent procédurales. Cette livraison n’ajoute ni navigation maritime, migration à longue distance, élevage de toutes les espèces, commerce du cuir, ni certification de performances sur téléphone physique. Les résultats effectifs de chaque exécution doivent être rapportés séparément avec leur commit.
