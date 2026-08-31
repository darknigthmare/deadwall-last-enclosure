# Contacts physiques et résolution des tirs

Passe moteur du 31 août 2026. Les corrections conservent les coûts, cadences, dégâts et portées du jeu ; elles portent sur la validité des contacts.

## Interactions du commandant

Le dépôt, la construction et la récolte conservent cet ordre de priorité. Chaque candidat proche doit avoir un trajet de contact libre selon la collision alliée déjà utilisée par les ouvriers. Un rempart ou un verrou fermé interdit donc une action à travers son empreinte, y compris près d'un angle. Une porte automatique ou ouverte reste utilisable. Un candidat inaccessible ne masque pas une autre cible accessible.

La pause, le menu, la défaite et la mise à terre interdisent ces actions. Quand aucun dépôt, chantier ou gisement n'est sélectionné, le relevé narratif peut proposer son interaction ; il n'est pas exécuté simultanément à une récolte ou à une construction.

## Corps-à-corps, recul et soins

La mêlée du commandant et celle du soldat à court de munitions vérifient le segment contre les remparts avant de toucher. Le recul historique du commandant de 20 pixels est fractionné en cinq pas : chacun s'arrête avant une structure physique ou le bord du monde. Cela ne téléporte pas une cible de l'autre côté d'un mur et ne l'enfonce pas dans une porte fermée. Une porte ouverte laisse passer le recul.

Les dégâts de 36, la récupération de 0,65 seconde et l'étourdissement de 0,35 seconde du commandant sont conservés, ainsi que les 18 dégâts du soldat. Ce correctif ne refond ni les collisions des foules ni les rampes de corps.

Une clinique alimentée exige un contact accessible avant de soigner dans son rayon historique de 130 pixels. Les remparts et les verrous fermés bloquent les soins, pas les portes automatiques ou ouvertes. Les débits de 2,2 PV/s pour les survivants et de 1,6 PV/s pour le commandant restent inchangés, sans ajout d'un coût matériel. Aucun personnage mort ou à zéro PV n'est ressuscité par ces soins passifs.

## Tirs

La collision est calculée sur le segment parcouru pendant la mise à jour, et non seulement à sa dernière position. Elle retient le premier impact physique, quelle que soit la position de l'infecté dans la liste. Le trajet est tronqué à la portée de la balle et aux limites du monde : un impact avant la limite reste valide, une cible après la limite ne l'est pas.

Le voisinage spatial des infectés est conservé ; il couvre le segment et les rayons des cibles. Les huit profils sont testés avec un pas de 0,02 et de 0,04 seconde. Un scénario synthétique de 720 cibles et 720 tirs contrôle les impacts, le rayon local des requêtes et le plafond des effets après leur mise à jour. Ce test n'est pas une mesure de fréquence d'image sur un PC ou un mobile.

**Convention conservée : les tirs passent au-dessus des remparts.** Cela concerne le commandant, les soldats et les tourelles. Il n'y a pas de simulation balistique 3D, de hauteur individuelle ou d'occlusion des balles par les bâtiments. Le blocage des coups physiques n'est donc pas une promesse de blocage des projectiles.

## Crises en pause tactique

Seules les réponses `A` et `B` sont admises. Les clés inconnues ou héritées d'objet sont refusées sans coût ni effet. Un ordre explicite est permis dans le poste de commandement suspendu, mais pas derrière une pause ordinaire, les paramètres ou l'aide. Le délai de décision et les conséquences temporaires n'avancent dans aucune pause. La réponse automatique est elle aussi bloquée tant que le jeu est suspendu.

La résolution reste atomique : une réponse déjà appliquée ne dépense pas une seconde fois les réserves et n'ajoute pas un second effet.

## Vérification

`tests/physical-interactions.test.cjs` reproduit les défauts initiaux et contrôle les contacts, les portes, les cibles alternatives, la portée, le premier impact, la charge synthétique et les permissions des crises. Les suites stratégiques, tactiques, infectés et récupération couvrent les systèmes voisins. Le contrôle global, le navigateur et la publication doivent être rapportés séparément lorsqu'ils ont réellement été exécutés.
