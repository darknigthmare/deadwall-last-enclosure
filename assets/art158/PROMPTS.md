# Art 1.58 — descriptions des briefs ImageGen

Ces descriptions normalisent les intentions des générations OpenAI ImageGen de la passe 1.58. **Elles ne sont pas des transcriptions verbatim de l'historique des appels.** Les originaux retenus, dimensions réellement livrées, empreintes et rectangles runtime sont consignés dans `PROVENANCE.json`. Les résolutions et grilles demandées ne remplacent pas les mesures des PNG livrés.

Direction commune : DEADWALL, survie zombie crédible, rendu semi-réaliste peint, matériaux usés, couleurs terre/olive/acier/rouille, silhouettes humaines sans pouvoir fantastique. PNG à fond transparent demandé, objets complets séparés par des marges, aucun texte, logo, grille, interface ou référence à une franchise. Aucun service OpenAI n'est appelé dans le jeu distribué.

## Acteurs

- `actors-a.png` : grille de huit poses par rangée et quatre rangées. Infecté récent en vêtement à capuche, ancien pompier protégé, rampant au sol, hurleur humain en manteau usé. Direction vers la droite, phases de déplacement cohérentes et pivots stables. Le runtime retient les rangées récent/protégé/hurleur ; le rampant de cette source reste exclu.
- `actors-b.png` : même grille. Briseur ancien ouvrier, traqueur mobile, engorgé humain massif, porte-bouclier équipé. Variations de tenue et d'équipement, pas de mutation spectaculaire. Le runtime retient briseur/traqueur/porte-bouclier ; l'engorgé de cette source reste exclu.
- `actors-c.png` : huit poses pour le fonceur et chacun des deux spécialistes. Le secouriste et l'ingénieur sont des survivants vivants, reconnaissables à leur équipement de soin ou de réparation, sans visage ni mains d'infecté. Trois rangées utilisées dans la grille livrée de quatre.
- `crawler.png` : huit poses réparties en quatre colonnes et deux rangées, corps bas avec jambes traînantes, progression vers la droite et espacement accru. Cette génération distincte remplace la rangée trop serrée de l'atlas A.
- `bloated.png` : huit poses en quatre colonnes et deux rangées ; humain lourd, corpulent et lent, vêtements ordinaires usés, épaules et silhouette larges. Il reste un infecté crédible, sans explosion ni attribut fantastique. La source définitive remplace la rangée de l'atlas B et une tentative séparée trop étroite.

Huit poses désignent les phases d'un cycle d'une variante, pas huit variantes cosmétiques. Les autres actions, équipements, états immobiles et mouvement réduit restent ceux des propriétaires natifs.

## Véhicules

`vehicles.png` demande neuf modèles en grille 3 × 3, caméra orthographique directement au-dessus, axe longitudinal horizontal, avant vers la droite : planche à roulettes, vélo à cadre bas, moto équipée, compacte arrondie, break à galerie, buggy à arceau, fourgon haut, bus et camion à plateau. Les changements portent sur silhouettes et carrosseries, au-delà d'une recoloration.

Les sept premiers modèles sont retenus. Le bus et le camion livrés dans cette planche sont trop courts pour leurs profils physiques : ils restent exclus. `heavy-vehicles.png` demande donc deux silhouettes longues en une colonne et deux rangées, bus en haut et camion à plateau en bas, même caméra et même orientation. Le rendu ajuste chaque modèle uniformément dans son véritable rectangle, avec les états de service, dégâts, éclairage et orientation du moteur.

## Montages, détails et commandant

`mechanisms.png` demande douze montages en grille 4 × 3 : deux formes pour entrave de cheville, lames, rail de guidage, cliquet, bride et contrepoids. Métal, câble et bois récupérés ; pièces terrestres plausibles vues d'en haut, sans explosion ni effet magique. Leur financement, support et charges ne sont pas dessinés comme des ressources supplémentaires.

`details.png` demande deux formes pour patio, haie, déchets, papiers, jouet, panier à linge, panier, menu, plateau, écran, panneau d'information, marques de palette et clôture. Objets usés de décors domestiques ou de service, isolés et lisibles dans leurs emprises natives. Les inscriptions éventuelles restent des marques picturales illisibles, sans interface ajoutée.

`player-gear.png` demande deux sacs récupérés, l'un souple et réparé, l'autre à armature métallique. Les sprites isolés s'attachent au torse du commandant ; ils ne représentent pas de nouveaux cycles de marche, armes, capacités de portage ou recettes.

## Tentatives conservées et exclusions

Les premières générations d'acteurs A/B comportaient des contacts ou fragments partagés ; une première C représentait les spécialistes comme infectés. Elles n'ont pas été retenues. Les PNG finaux conservent encore seize poses A/B et deux véhicules lourds exclus de l'usage. Les tentatives restent conservées hors dépôt dans le dossier de génération de la session ; les exclusions et leurs raisons figurent dans la provenance. Aucun pixel n'est effacé ou repeint pour faire passer un contrôle.
