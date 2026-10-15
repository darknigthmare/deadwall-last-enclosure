# DEADWALL 1.65 — Eaux et peuplement des biomes

Cette extension ajoute une hydrographie déterministe aux nouvelles campagnes : lacs, étangs, mares, ruisseaux, rivières, mer et océan. Les animaux et les infectés régionaux lisent le territoire de la campagne. Les campagnes antérieures conservent leur terrain, leurs lieux, leurs prélèvements et leurs identifiants.

## Lire le réseau d’eau

La côte rejoint une bordure réelle de la région. La mer côtière et l’océan du large appartiennent à la même étendue ; ils ne deviennent pas des poches salées isolées dans les terres. Les cours principaux sont orientés vers la côte et les affluents possèdent un receveur déclaré. Les lacs traversés ont un exutoire. Les étangs et les mares sont des bassins fermés choisis dans les sols humides ; ils ne prétendent pas posséder un écoulement permanent invisible.

L’hydrographie est une donnée commune du terrain. Les cartes, les berges dessinées, les collisions et le placement du contenu lisent le même fournisseur. Une route ne transforme pas l’eau en terre : les franchissements retenus disposent d’un ouvrage et d’une largeur physique. Les implantations terrestres qui ne disposent pas d’une emprise sèche compatible sont refusées.

Les dimensions sont exprimées en mètres dans le Guide. Les indices écologiques ne constituent pas une simulation de relief 3D, de débit hydraulique ou de crue. La profondeur et la classe d’eau servent à distinguer les milieux et leurs limites de déplacement ; elles ne créent ni plongée ni nage.

## Accès, ressources et nuits

L’eau impose un détour ou le passage par un franchissement réel. Les sorties, rayons des acteurs et véhicules, objets posés et accès aux lieux restent prioritaires. L’eau visible ne distribue aucun stock : pas de pêche, de boisson, de carburant ou de soins gratuits. Les ressources restent dans les gisements et les contenants identifiés, avec leurs quantités finies.

La nuit conserve le service de visibilité et les sources lumineuses existants. Une surface d’eau ne produit pas sa propre lumière. Une fiche du Guide ne révèle aucun contact inconnu et ne crée ni ressources, ni animaux, ni infectés.

## Animaux et infectés dans leur milieu

Six espèces composent la faune régionale : chevreuil, sanglier, lièvre, canard colvert, héron cendré et goéland. Les mammifères sont pondérés par les milieux terrestres ; canards et hérons fréquentent les berges d’eau douce, les goélands les rives salées. Le placement recherche un sol sec et écarte le refuge, les voies et les parcelles occupées. Ces probabilités et ces contrôles ne garantissent pas chaque espèce dans chaque secteur.

Les animaux se déplacent, errent et fuient les survivants visibles, les infectés proches ou le bruit. Chaque espèce possède son gabarit métrique, son rayon physique et sa vitesse. Les quatre variantes de présentation n’ajoutent ni capacité ni ressource. Les animaux ne nagent pas, ne volent pas et n’attaquent pas ; ce sont des déplacements au sol, y compris pour les oiseaux. Les blessures et morts enregistrées ne sont pas effacées par la sortie d’un secteur ou par **Continuer**. Il n’existe ni élevage, ni viande offerte, ni économie de chasse.

Les contacts naturels reprennent les six profils régionaux existants et leurs statistiques. La composition dépend du biome, les apparitions refusent l’eau et les réservations physiques. Leurs déplacements, poursuites, blessures et morts utilisent le registre régional existant. Ces rencontres ne gonflent pas le budget des hordes de D-17. La carte conserve la règle de vision effective par un observateur allié.

## Guide et portée

Les nouvelles fiches décrivent séparément les sept familles d’eau, leurs berges, les animaux et les contacts régionaux. Les anciennes fiches de conception — base nautique, plage aménagée, gué, port ou falaise — conservent leur statut lorsque leurs aménagements complets ne sont pas livrés. Une étendue d’eau ne valide pas automatiquement tous les bâtiments et services qui pourraient l’accompagner.

Créer une nouvelle campagne pour explorer cette hydrographie. **Continuer** conserve la version sauvegardée ; consulter le Guide n’active aucune extension et ne redistribue pas les ressources historiques.

## Vérification

```sh
node --test tests/hydrology-guide165.test.cjs tests/ecology-guide164.test.cjs
DEADWALL_SOAK=1 npm run check
node scripts/browser-hydrology165.mjs
```

Les quatre contrôles ciblés du nouveau Guide vérifient les sept familles d’eau réelles, les mesures dérivées des règles, le chargement avant `Core`, les profils des six espèces et des six contacts, la recherche et la conservation des projets historiques. Cette vérification documentaire ne remplace pas les contrôles physiques du monde.

Les résultats des contrôles globaux et les reçus de publication de cette version sont consignés après leur exécution. Les résultats des versions précédentes ne qualifient pas cette extension. Les limites sur la navigation, le peuplement, la sauvegarde et le rendu sont précisées avec les règles réellement intégrées.
