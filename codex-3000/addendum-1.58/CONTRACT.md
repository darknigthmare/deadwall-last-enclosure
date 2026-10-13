# Contrat auteur — 1 000 programmes indépendants, 1.58

Les lots `PROGRAMMES_A.json` à `PROGRAMMES_D.json` contiennent chacun exactement 250 fiches, dans l’ordre : A DW-3001–3250, B DW-3251–3500, C DW-3501–3750, D DW-3751–4000. Enveloppe : `{ "schemaVersion": 1, "version": "1.58.0", "count": 250, "fiches": [...] }`.

Chaque fiche est un programme parent indépendant. Aucun champ parent, module, état, ni nom obtenu par une numérotation de variantes. Les 3 000 fiches et 1 000 parents historiques restent intacts. La compilation totale expose 4 000 programmes, 2 000 parents. Les programmes nouveaux sont candidats pour une extension volontaire G9 ; une fiche ne prouve pas sa présence dans une région.

Importer les listes et `validateLot` depuis `./validation.mjs`. Le compilateur importe le même validateur. Les ressources se limitent aux sept stocks existants, et chaque meuble à un identifiant réel `PROPS`. Aucun nouveau pouvoir, métier simulé, lumière, production ou service ne découle d’un texte.

Champs obligatoires : `id`, `name`, `family`, `purpose`, `architecture`, `spaces`, `access`, `placement`, `supplies`, `risks`, `night`, `variants`, `interactions`, `qa`, `story`. Les textes décrivent le lieu concret, ses flux, contenants, traces et contraintes ; ils ne répètent pas uniquement un modèle partagé.

`architecture` : width entier 24–78, height entier 24–75, levels triés et contigus parmi -1/0/1/2, incluant 0, **trois niveaux maximum au total**, layout parmi axial/offset/cross/gallery, roofFamily parmi `ROOFS`, material descriptif. Au moins six espaces au total, au plus dix par niveau et dix-huit au total ; chaque niveau a au moins deux espaces. Ne pas placer tous les maxima de pièces dans le plus petit bâtiment.

Les quatre distributions sont effectivement différentes : axial = couloir médian ; offset = couloir décentré et pièces inégales ; cross = axe longitudinal avec dégagement transversal ; gallery = galerie centrale élargie et réserve avant/arrière. Aucune cour à ciel ouvert ou boucle périphérique n’est sous-entendue. Entrée et retour traversent des ouvertures physiques ; les couloirs, paliers et centres des portes sont réservés avant les meubles.

`spaces` : `{id, name, z, usage, resource, props:[{kind,resource}]}` ; identité locale ASCII distincte, un ou deux meubles à ressource existante, fonction précise. Le moteur donne aux contenants des quantités finies suivant les mêmes bornes que les lieux historiques. Les décors supplémentaires n’ajoutent aucune réserve. Les risques d’incendie, d’infection, d’eau ou de produits chimiques sont des **traces narratives**, à distinguer des mécanismes effectivement simulés.

`access` : `{public, service, return, width_m}` ; largeur 1.4–3.4 m. `placement` : `{mode:'any'|'town'|'rural', biomes:[...BIOMES], townKinds:[...TOWNS]}`. Le raccord routier, la réservation de parcelle et les exclusions de recouvrement du moteur restent obligatoires. Ne pas faire passer une galerie technique terrestre pour un tunnel, une station d’eau pour un réseau aquatique ni un bâtiment ferroviaire pour une voie fonctionnelle.

`supplies`, `night`, `story` sont des textes ; `risks`, `variants`, `interactions` ont au moins deux éléments ; `qa` au moins trois. Les variations proposées ne comptent pas comme entrées supplémentaires. Les interactions relient réellement exploration, fouille, charge limitée, retour, médecine, logistique, défense ou reconstruction. La sauvegarde conserve les identités du lieu, de ses étages et contenants.

Exemple structurel (à développer ; ce nom est réservé au contrat et ne doit pas remplacer une fiche complète) :

```json
{
  "id": "DW-3001", "name": "Maison de relais intergénérationnel",
  "family": "Habitat individuel", "purpose": "Deux foyers partageaient une salle commune et conservaient des stocks séparés ; les espaces de repos restent distincts des livraisons.",
  "architecture": {"width": 32, "height": 30, "levels": [0,1], "layout": "offset", "roofFamily": "cottage", "material": "Maçonnerie réparée, tuiles brunes et appentis de service en zinc."},
  "spaces": [
    {"id":"accueil", "name":"Vestibule partagé", "z":0, "usage":"Séparer les retours de terrain et la circulation domestique.", "resource":"scrap", "props":[{"kind":"desk","resource":"scrap"}]},
    {"id":"sejour", "name":"Salle commune", "z":0, "usage":"Préparer les sacs et réunir les foyers près du retour.", "resource":"wood", "props":[{"kind":"table","resource":"wood"}]},
    {"id":"cuisine", "name":"Cuisine partagée", "z":0, "usage":"Conserver un petit reliquat alimentaire dans le froid arrêté.", "resource":"food", "props":[{"kind":"fridge","resource":"food"}]},
    {"id":"reserve", "name":"Réserve de relais", "z":0, "usage":"Garder des pièces d’entretien sans créer de production autonome.", "resource":"scrap", "props":[{"kind":"crate","resource":"scrap"}]},
    {"id":"repos-ouest", "name":"Chambre du premier foyer", "z":1, "usage":"Accéder à une chambre et son matériel domestique depuis le palier.", "resource":"wood", "props":[{"kind":"bed","resource":"wood"}]},
    {"id":"repos-est", "name":"Chambre du second foyer", "z":1, "usage":"Accéder au deuxième espace privé sans traverser la première chambre.", "resource":"wood", "props":[{"kind":"wardrobe","resource":"wood"}]}
  ],
  "access":{"public":"Entrée avant donnant sur le couloir décentré et la salle commune.","service":"Livraisons par la sortie arrière sans traverser les chambres.","return":"Retour par le même axe dégagé jusqu’au raccord de route.","width_m":1.8},
  "placement":{"mode":"town","biomes":["meadow","bocage"],"townKinds":["hameau","village"]},
  "supplies":"Reliquats finis de nourriture et mobilier, partagés par des identités de contenants persistantes ; aucun ravitaillement au retour.",
  "risks":["L’étage impose de reconnaître le palier avant de remplir le sac.","L’entrée reste un passage à couvrir contre les contacts régionaux."],
  "night":"Les prises et appliques hors service sont décoratives ; seule une lampe réellement portée ou posée peut éclairer le trajet.",
  "variants":["Toiture réparée avec une zone de zinc distincte.","Deux volumes domestiques articulés autour du même accès de service."],
  "interactions":["Fouiller les reliquats avant de revenir au dépôt.","Comparer charge utile et trajet de retour pour préparer la reconstruction."],
  "qa":["Parcourir chaque pièce depuis l’entrée avec le rayon réel du joueur.","Vérifier les paliers et le retour après changement d’étage.","Reprendre la sauvegarde sans reconstituer les réserves prélevées."],
  "story":"Deux listes de livraison et des chaussures rangées par foyer racontent un partage de tâches interrompu, sans présumer de survivants présents."
}
```
