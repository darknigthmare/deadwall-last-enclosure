# DEADWALL 1.36.0 — Réparations & matières

## Lancer et reprendre

Extraire toute l'archive, puis ouvrir `DEADWALL_Standalone.html`. Les images et scripts nécessaires y sont intégrés. Pour travailler sur les sources avec Node.js 22.12 ou plus récent : `npm run build`, ou `npm start` puis `http://127.0.0.1:4173/`.

**Continuer une sauvegarde 1.35 G6 applique cette mise à jour sans refaire de campagne.** Sa graine, D-17, les villes, les bâtiments, les ressources et leurs identifiants sont conservés. Les générations G1–G5 restent dans leur terrain historique ; elles ne sont pas converties silencieusement en G6. Le format général demeure v20 avec les registres existants.

La génération G6 introduite en 1.35 reste celle des nouveaux départs : douze biomes et une région de 24,576 km de côté, D-17 variable selon la graine, routes et agglomérations irrégulières. Une graine explicite reproduit le terrain de sa génération ; un champ vide tire une nouvelle graine au prochain départ volontaire.

## Corrections intégrées

| Domaine | Défaut corrigé et comportement obtenu |
|---|---|
| HUD tactile | Les deux tiroirs du pied d'écran n'occupent plus la même cellule de grille. Ils se rangent dans une pile défilante à côté des commandes de déplacement. Les indications d'interaction ne sont plus masquées par une ancienne règle compensant le chevauchement. |
| Tiroirs et modales | Actions rejoint le groupe exclusif Situation / Carte / Matériel. Le retour d'armurerie, d'inventaire ou de pause restitue le tiroir et son focus pour la même campagne. Échap annule les opérations de terrain avant la minimap lorsque le joueur contrôle le terrain. |
| Mini-jeux | Entrée déclenche le bouton réellement focalisé, notamment Ajuster ou Fermer. Le changement de cible vers le mini-jeu ne laisse plus le focus sur un bouton supprimé. Les diagnostics et interrupteurs restent interactifs. |
| Équipement | Arme suivante parcourt les objets portés, y compris plusieurs variantes d'une famille et la mêlée. L'inventaire représente l'objet exact. Les outils tenus n'affichent plus un pistolet sous leur silhouette ; la hachette et le marteau ont des proportions compactes adaptées. |
| Voiture et collisions | Après une reprise au volant, descendre restitue l'emprise du personnage à pied. Le rayon du véhicule ne reste plus appliqué au survivant. |
| Relève et atelier | La réquisition propose l'assemblage payé existant, puis le retrait et l'équipement de l'objet prêt au râtelier. Elle n'annonce plus une arme immédiate et ne prélève pas un second prix lors du retrait. Les chargeurs restent attachés aux objets. |
| Combat régional | Crosse et poings peuvent toucher les infectés ordinaires, les groupes et les corps relevés. Portée, angle, obstacle, étage et délai restent contrôlés. Le bonus de crosse dépend de l'arme effectivement tenue. |
| Générateurs et distribution | Un groupe détruit ou cannibalisé refuse le ravitaillement et le démarrage avant tout débit de carburant. Détruire le support pendant une intervention annule celle-ci ; une installation invalide cesse d'alimenter ses lecteurs d'énergie et de lumière. |
| Reconnaissance G6 | Les analyses ciblent les vraies villes de la graine. Le sélecteur se renouvelle au changement de monde. Les dossiers 1.35 portant un ancien tag sont conservés lorsque leur association était valide, sans produire de ville fictive pour de nouvelles commandes. |
| Carte et performance | Le dessin lit les marqueurs utiles sans reconstruire les devis du bureau. Une couche routière par canvas est réutilisée puis invalidée quand la vue ou le monde change. Acteurs, constructions, découvertes et itinéraires restent vivants. |
| Étiquettes régionales | Les noms de lieux et de retours D-17 restent à 12 px écran quel que soit le zoom. Les noms trop longs sont abrégés et les chevauchements supprimés, avec priorité au lieu actuel, au repère et aux interactions proches. |
| Routes de D-17 | Le plan local révision 3 utilise les passes communes accotements / chaussées / marquages de RoadKit. Les intersections sont raccordées sans modifier les tracés ni les collisions. Les révisions 1 et 2 gardent leur peintre historique. |

Les barricades, réparations, éclairages, étages, ressources finies, morts et récupérations restent raccordés aux mêmes propriétaires de données. Cette livraison conserve les systèmes antérieurs ; elle corrige notamment les anciens chemins de commandes devenus incohérents avec l'armurerie et G6.

## Images réellement intégrées

Les **27 PNG individuels** se trouvent dans `assets/art136/`. Leur provenance et leurs empreintes sont dans `assets/PROVENANCE_1_36.json` ; `src/assets136.js` fournit le catalogue commun.

| Lot | Nombre | Usage réel |
|---|---:|---|
| Chêne, hêtre, bouleau, pin, sapin, saule, peuplier, aulne, fruitier | 9 | Canopées des neuf essences G6, avec tronc, rotation, transparence de proximité et dégagements existants. |
| Calcaire, granite, schiste, amas de pierres | 4 | Les quatre familles minérales G6 récoltables, chacune liée à sa quantité et à son emprise. |
| Litière forestière, sol humide | 2 | Matières fondues dans les tuiles de sol selon les poids écologiques. |
| Groupe, tableau, coffre verrouillé | 3 | Générateur régional et miniatures descriptives de l'établi ; aucun contrôle peint dans une image. |
| Fusil à pompe, pied-de-biche, hachette, marteau, machette | 5 | Armurerie et équipement personnel. |
| Affût léger, nid lourd, lance-traits, chevalet | 4 | Inventaire et postes déployés, reliés à leur orientation et à leur état. |

Les autres armes et outils emploient les SVG adaptés ou les atlas conservés. Les armes de contact en main utilisent des compositions vectorielles et les animations existantes ; ces images ne représentent pas 37 nouvelles illustrations ni un nouveau cycle animé propre à chaque profil. Les peintres géométriques des essences et familles minérales restent disponibles en secours ; les générations antérieures conservent leur présentation historique.

Les textures sont préparées puis mises en cache en coordonnées du monde. Le chargement des images se fait avec le paquet local ; une partie ne dépend pas d'une génération ou d'un téléchargement réseau. Les peintres de secours restent disponibles pour le terrain et les sprites.

## Vérification et portée

Les résultats finaux de la commande `DEADWALL_SOAK=1 npm run check`, des parcours d'intégration et des captures se trouvent dans `reports/1.36.0/` et dans `RAPPORT_CORRECTIONS_1.36.0.html`. Les suites ciblées examinent les transactions, l'annulation, les collisions après reprise, les chargeurs, les interventions, la reconnaissance, le focus et les générations antérieures. Le rapport final reste la référence pour les résultats consolidés.

Les captures du monde exécutent les vrais peintres Canvas et chargent les images du jeu ; les scènes et certaines positions sont préparées pour les essais. Les contrôles HTML sont exercés sous DOM simulé. **Le rendu CSS interactif dans un navigateur, le tactile sur appareil, l'audio et les FPS GPU ne sont pas certifiés.** Les profils CPU de carte décrivent leur scénario mesuré et ne constituent pas une promesse de fluidité sur tout matériel.

Cette passe ne garantit pas l'absence de tout défaut sur chaque graine ou pendant une campagne entière. Elle n'ajoute ni relief physique 3D, ni nage, ni nouvelles factions humaines. Les fiches de conception historiques ne deviennent pas des lieux jouables du seul fait de leur présence dans le codex. Aucun nouveau déploiement distant ni exécutable Windows signé n'est annoncé.

## Documentation détaillée

- `HUD_1_36.md` : disposition, focus, clavier et commandes tactiles.
- `ETAT_CAMPAGNE_1_36.md` : conduite, relève et reprise.
- `REPARATIONS_GAMEPLAY_1_36.md` : armement, contacts et interventions.
- `MONDE_CORRECTIONS_1_36.md` : reconnaissance G6 et atlas.
- `ROUTES_RENDU_1_36.md` : raccordements visuels de D-17.
- `ART_1_36.md` : images, équipement et peintres de secours.

Les catalogues `codex-3000/` et ses addenda d'armement, de biomes et de routes sont conservés avec leurs statuts de conception et de disponibilité.
