# Audit indépendant d’intégration — 1.34

## Méthode

`scripts/qa-startup134.cjs` reconstruit le document à partir du `index.html` livré, exécute tous ses scripts dans leur ordre réel, déclenche `DOMContentLoaded`, puis utilise les contrôleurs et les boutons montés par le jeu. Chaque scénario tourne dans un processus Node isolé. Les règles de gameplay, validateurs, coûts et collisions restent ceux du jeu.

Le document du harness est simulé. Ces résultats vérifient les transactions, le montage et le cycle de vie des interfaces, **pas leur mise en page CSS, le tactile physique, l’audio ni les FPS GPU**. Les scènes de terrain sont préparées avec positions et lieux explicitement choisis : ce ne sont pas des campagnes humaines parcourues intégralement.

Les rapports de la version 1.32 documentent `ERR_BLOCKED_BY_CLIENT` sur le serveur local et le refus du protocole fichier par le navigateur cloud. Aucun lancement alternatif ni contournement n’a été tenté pendant cet audit.

## Résultats : cinq parcours réussis

| Scénario | Actions et résultat vérifiés |
|---|---|
| `campaign` | Première sauvegarde contenant les trois extensions ; introduction avec temps et ressources figés ; commandement → inventaire → perte de focus → pause maintenue ; mort → choix par bouton → reprise de campagne ; graine invalide sans réinitialisation des registres. |
| `interventions` | Générateur D-17 placé sur une empreinte valide et rejoint par un accès physique ; ouverture du panneau et réglages par les vrais boutons ; temps continu pendant la réparation ; refus de fabrication simultanée ; reprise et perte de focus annulant la tentative ; consommables du sac conservés comme dépensés ; PV du vrai bâtiment augmentés de 350 à 550. |
| `render` | Chevalet à pointes assemblé avec les réserves, pris et posé ; matériaux de barricade prélevés au dépôt ; fenêtre brisée de la station barricadée après travail ; les deux objets passent dans la vraie file de profondeur, `Game.render()` et la projection D-17 ; collision et persistance après reprise. |
| `arsenal` | Revolver assemblé via l’atelier UI, pris, équipé, rechargé et tiré ; son chargeur reste distinct du pistolet malgré leur ancienne famille commune ; usure réelle ; transfert de toutes les armes au décès, relève sans cadeau puis récupération physique sans duplication ; import falsifié refusé avant mutation. |
| `region` | Site G5 `P0655` aux coordonnées (14022, 547), étage 1 : barricade construite, collision conservée après éviction de 40 chunks, aucun obstacle fantôme au RDC et démontage refusé depuis le mauvais étage ; armoire crochetée par les boutons, ouverture persistante sans collecte automatique ; sauvegarde et reprise conservant étage, contenant et barricade. |

Les quatre premiers parcours ont passé `node --test tests/qa134-integration.test.cjs` avant ajout du dernier parcours. Le parcours régional a ensuite passé `node scripts/qa-startup134.cjs region`. Les cinq sont maintenant enregistrés dans le même fichier de tests et inclus dans la vérification générale de la livraison.

## Constats de revue croisée et corrections

- La sécurité des interventions régionales ne comptait initialement pas les anciens survivants réanimés. Les contacts de succession sont maintenant inclus dans le contrôle des menaces ; le test ciblé du module vérifie l’interruption.
- La vérification d’une intervention pouvait copier le carnet régional à chaque image. La lecture légère `takenAmount` et le cache des sites alimentés remplacent ces copies pendant la mise à jour ; le module possède un test qui interdit explicitement l’appel à `snapshot()` sur ce chemin.
- L’ancien contrôle de possession précédait le dispatch de mêlée au clic dans la région. Ce raccord a été transmis à la passe centrale pour que la nouvelle arme puisse décider de l’action avant la garde historique.
- Les entrées de profondeur avec un callback `draw` doivent être exécutées avant le dispatch historique par type. Le rendu complet du test vérifie ce raccord pour les barricades, qui étaient sinon dirigées vers le peintre des camions.

Une limitation du faux document (`lastChild` absent) a également été identifiée. Le titre de l’armurerie utilise désormais une référence explicite ; ce problème de fixture n’est pas présenté comme un bug de navigateur.

## Vérification Canvas native

Commande : `node scripts/qa-startup134.cjs capture`.

Les captures chargent les véritables atlas du jeu et exécutent `Game.render`, `DeadwallAtlasRender.drawHomeScene` et `DeadwallAtlasRender.drawHome` dans `@napi-rs/canvas`. La fenêtre barricadée et le poste ont été réellement financés et installés par leurs APIs. Les images ont été ouvertes et inspectées.

Fichiers dans `reports/1.34.0/captures/` :

- `integration134-game-render.png` : rendu complet avec le personnage près de la fenêtre et du poste ;
- `integration134-d17-local.png` : scène D-17 en unités locales ;
- `integration134-d17-region.png` : même scène à travers sa projection régionale ;
- `integration134-render.json` : provenance et métriques.

La comparaison couvre **1 152 000 pixels**, y compris chaque pixel des nouveaux objets. Le commandant se trouve hors des deux vues comparées ; seule la bordure explicite de la carte peut être exclue. **8 pixels** dépassent une différence maximale de 4/255 entre les canaux ; erreur moyenne maximale par pixel **0,12675/255**. Cette faible différence correspond à la rasterisation des transformations. Le contrôle ne mesure pas une cadence GPU et n’est pas une capture de navigateur.

## Correctif ciblé du catalogue d’armurerie

Une dernière lecture a trouvé un recalcul du catalogue complet pour chaque carte de l’armurerie. `refresh()` transmet maintenant son aperçu unique à `card()`. Les 37 profils restent affichés ; coûts, disponibilité et état proviennent du même aperçu.

Mesure du passage Harnais → Atelier dans le document complet, instrumentée sans modifier les résultats des fonctions :

| Compteur | Avant | Après |
|---|---:|---:|
| Appels `arsenal134.view()` | 38 | 1 |
| Appels `workerCanWorkAt()` | 1 481 | 75 |
| Temps observé du clic/rafraîchissement | 35,38 ms | 13,69 ms |

Les compteurs montrent la suppression du travail quadratique. Les durées sont deux observations ponctuelles sur cette machine pendant d’autres contrôles ; elles ne constituent ni une mesure statistique ni une promesse de FPS. Le test `tests/arsenal-ui-perf134.test.cjs` passe : un aperçu, nombre d’accès borné linéairement et catalogue complet.
