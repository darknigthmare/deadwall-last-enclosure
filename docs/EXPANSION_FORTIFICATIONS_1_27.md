# Défenses & ateliers — cinq extensions jouables, 1.27

Ces cinq fonctions étendent les constructions déjà présentes dans D-17. Elles n’ajoutent pas de bâtiment fictif, ne remplacent ni les étais Aube & Bastions, ni les sapeurs, ni les citernes incendie. Ouvrir **Opérations → Défenses & ateliers**, sélectionner une structure dans le monde puis rejoindre son contour accessible. Le support courant et ses réserves sont indiqués dans le panneau.

| Extension | Préparation | Usage réel et contrepartie |
|---|---|---|
| Caisson local de munitions | 4 bois, 3 ferraille et 24 munitions auprès d’un mirador ou d’une tourelle | 24 cartouches réservées à ce poste. Dépense seulement lorsque le tir ordinaire manque de stock disponible, avec la portée, l’occultation, l’alimentation, les dommages et la cadence de sa défense. Continue pendant les sorties du commandant. Perdu si son support tombe. |
| Cassette de maintenance | 10 ferraille et 4 bois sur une structure achevée | Réserve finie de 200 points, utilisée manuellement à 8 points/s. Requiert de rester sur place en sécurité, hors assaut et sans incendie actif du support. Le reliquat reste disponible après interruption. Un surcoût logistique par rapport à une réparation depuis les stocks communs. |
| Filet de rétention | 12 bois et 6 ferraille sur un mur ou une porte | Retient 12 unités de charge de corps supplémentaires avant saturation. Les morts, cadavres visuels et butins restent présents ; seules les premières unités de pression sont retenues. Le déblaiement existant reste nécessaire. |
| Tri des débris de construction | Après destruction effective d’une structure achevée autre que le centre | Jusqu’à 12 % des coûts bois/ferraille/pierre, arrondis à l’inférieur, dans une réserve unique. Tri sur place à 6 matériaux/s vers le sac personnel ; dépôt ensuite nécessaire. Aucun débris créé par démontage, aucun renouvellement au chargement. |
| Régulateur d’intrants | 6 ferraille auprès d’une industrie consommant des matériaux | Utilise seulement l’excédent au-dessus de 25 unités de chaque intrant. Production réduite puis arrêtée si nécessaire ; aucun bonus de rendement. Électricité, pannes, météo/jour, stockage et crises conservent leur effet. Le retrait ne rembourse pas le régulateur. |

## Interactions et rendu

Le caisson apparaît comme une boîte verte, la cassette comme une boîte de réparation brune, le filet comme une maille sur le mur, et le régulateur comme un petit boîtier sur l’industrie. Des pièces récupérables marquent le contour des ruines. Le HUD des opérations donne les quantités exactes ; les travaux manuels se lancent par une action explicite puis ferment le panneau pour laisser avancer la simulation.

Les cartouches non utilisées peuvent être remises dans le stock commun depuis le caisson. Si ce stock est plein, le reliquat demeure dans le caisson : rien n’est supprimé. Les matériaux de cassette et les filets sont consommés à l’installation et ne se remboursent pas. Déplacement hors portée, dégâts, tir, rechargement, autre travail ou perte du support interrompent le travail manuel. Une pause ou une modale suspend le travail. Entrer dans la région abandonne le travail manuel ; le caisson est autonome.

Le régulateur n’empêche pas les autres systèmes de dépenser leurs propres stocks : nourriture des habitants, générateurs et ateliers non régulés gardent leur comportement. La réserve de 25 est respectée par chaque atelier régulé au moment de sa propre production, après les services existants. Plusieurs ateliers régulés se partagent le même excédent sans le dupliquer. Les fenêtres d’énergie accumulées par le réseau natif sont réutilisées.

## Sauvegarde et limites

Registre `expansions127.modules.fortification`, version interne 1. Migration des anciennes parties : registre vide, sans récompense. Réserves de caisson, cassette, filet, régulateurs et débris sont persistants. Les tâches manuelles ne reprennent pas automatiquement au chargement. La validation de tous les modules précède le remplacement de la campagne.

Limites : 128 supports équipés et 128 réserves de débris. Un support épuisé sans équipement actif libère son entrée. Les destructions supplémentaires n’ajoutent plus de débris lorsque le registre est plein ; elles conservent tous leurs effets natifs. Les débris sont issus de structures payées, ne créent ni carburant, ni munitions, ni médicaments. Une reconstruction reçoit un nouvel identifiant et constitue un nouvel investissement ; la réserve de sa destruction est distincte.

La recherche des supports rejette d’abord les distances lointaines avant de calculer l’accès physique. Les débris hors de la vue ne sont pas dessinés. Toutes les valeurs de gameplay restent dans `DeadwallCore.FortificationPackRules`, à la fin de `src/core.js`.

## Vérification ciblée

`node --test tests/fortification-pack.test.cjs` : 21 tests réussis après revue indépendante. Couverture : coûts, incompatibilités, accès obstrué, portée, autonomie, cadences, panne, pause/modale, saturation, récupération, destruction/démolition, intrants partagés, sauvegarde transactionnelle, identifiants futurs, nouvelle campagne. Ces tests exécutent le moteur natif dans sa fixture DOM ; ils ne constituent pas une session de jeu interactive dans un navigateur.
