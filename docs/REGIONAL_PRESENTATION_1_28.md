# Compagnons visibles en région — 1.28

Les accompagnateurs régionaux utilisent maintenant les atlas originaux déjà chargés par le moteur. Leur emplacement, leur santé et leur orientation viennent du registre Monde vivant. La conversion reste de 32 unités de dessin par mètre, comme celle du commandant.

| Compagnon | Silhouette réutilisée |
|---|---|
| Léa, éclaireuse | Survivante non armée, variante `workerAlt` |
| Samir, secouriste | Spécialiste médical, `medic` |
| Inès, mécanicienne | Spécialiste technique, `engineer` |
| Malik, tireur | Fusilier, `soldier` |

Ces silhouettes indiquent le rôle ; elles ne constituent pas quatre portraits originaux des personnages nommés. La marche utilise leurs huit poses existantes. Aucun nouveau tir, soin, rechargement ou outil animé n’est annoncé par ce raccordement : les atlas partagés ne contiennent pas ces actions distinctes.

`src/world-evolution-art.js` garde un objet de présentation par identité, dans un `WeakMap` attaché à l’instance du jeu. Ce suivi ne modifie aucun acteur de simulation et n’ajoute rien à la sauvegarde. Seules les quatre identités du catalogue sont admises, et les entrées absentes sont retirées. Aucun chargement d’image, timer ou boucle de simulation n’est ajouté.

La marche est déduite des déplacements continus observés entre deux rendus, avec le temps de simulation et la vitesse autorisée du compagnon. Une peinture répétée du même pas n’avance pas l’animation. L’arrêt réinitialise aussitôt la pose ; la pause, une interface modale, un changement de monde, d’étage ou d’intérieur, une disparition, un saut de position ou un intervalle de plus de 250 ms réinitialisent le suivi. Le mouvement réduit garde la pose zéro. À très faible fréquence de rendu, la pose fixe est donc préférée à une marche supposée.

Les morts, passagers, compagnons d’un autre étage, intérieurs distincts en sous-sol/étage, coordonnées invalides et silhouettes hors écran ne sont pas dessinés. Au rez-de-chaussée, la géométrie tournée des bâtiments masque ceux qui se trouvent réellement sous un toit fermé ; entrer dans le bâtiment, une ruine ou sa destruction retire ce masque. Ce contrôle se fonde sur la position, car le champ `inside` du compagnon peut suivre celui du commandant avant que le compagnon ait franchi la porte. Les arbres et le masque nocturne restent dessinés par les étapes existantes du moteur.

Les compagnons sont classés entre eux par ordonnée. L’ordre global historique — compagnons, infectés locaux, commandant, végétation — reste celui du peintre régional. Cette livraison n’ajoute pas un nouveau tri de profondeur de toute la scène. Un atlas indisponible conserve le petit repère coloré de secours à la position réelle.

Vérification : `tests/regional-companion-art.test.cjs` couvre le contrat visuel, le vrai peintre d’atlas et un scénario moteur de suivi, immobilisation et reprise. Les tests des compagnons, du commandant et de l’art existant sont conservés. La validation navigateur interactive reste distincte de ces preuves Canvas et Node.
