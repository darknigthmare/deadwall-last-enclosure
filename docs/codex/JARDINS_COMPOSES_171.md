# Jardins composés — passe 171, révision optionnelle 9

Cette couche utilise les douze profils de jardin existants et les zones extérieures
attribuées par la révision 7. Elle complète les équipements du profil retenu après
les révisions 0–8, sans déplacer leurs objets ni modifier les plans historiques.

## Activation

Dépôt D-17 → Monde & relais → **COMPOSER LES JARDINS ET COURS**.
Dans l'inspecteur : **Composer les jardins et cours — révision 9**.
Les cases des révisions incluses sont désactivées tant que la 9 est cochée, mais
leurs choix antérieurs sont conservés quand on la décoche.

## Placement

Les variantes fleuries, potagères, repas, jeux, verger, piscine, serre, bricolage,
linge, friche, partage et repos sont filtrées par usage du bâtiment. Les cours
techniques de livraison, quais, parkings et jardins suspendus ne reçoivent pas de
jardin de substitution. Les usages publics ne reçoivent pas de piscine privée.

La sélection préfère les équipements déjà présents dans la même zone. Un objet
existant ne satisfait qu'un emplacement de kit. Une piscine, serre, remise ou aire
de jeux située ailleurs n'est ni dupliquée ni créditée arbitrairement à cette zone.
La superficie libre accessible est mesurée, pas déduite de la seule enveloppe.
Les maxima d'essais, zones et ajouts réutilisent les limites centrales 169.

Murs, clôtures, véhicules stationnés tournés, volumes existants, chemins métriques
et faces de service des huit couches précédentes sont préservés. Les nouveaux
potagers gardent deux côtés d'entretien, les piscines quatre. Les routes d'accès
aux nouveaux éléments n'empruntent pas les massifs ou les planches potagères.
Aucun portillon n'est ouvert et aucun équipement n'est réduit pour forcer la pose.

Le rendu utilise les atlas existants, avec rotation et découpe dans l'emprise de
l'objet ; 21 types sont pris en charge dans les kits. Pas de nouveau pack PNG.
La migration vérifie aussi les emprises VISUELLES : une surface traversable ne
peut pas être installée sur un camp, un appareil posé ou le véhicule sauvegardé.

## Portée des compteurs

Un kit composé n'est pas un jardin natif exhaustif. Ses modules sont distincts
des quantités minimales de mobilier auteur. Les 2 716 unités de mobilier intérieur
manquantes du dernier audit ne sont pas diminuées artificiellement par ces ajouts.
Les anciennes pièces « jardin » encore dans la coque restent signalées.
Les objets existants rapprochés prouvent une présence de type, pas une interaction.
Aucun objet nouveau ne possède de stock, alimentation, production ou récolte.

## Contrôles reproductibles

- `node --test tests/codex-gardens171.test.cjs`
- `node --test tests/codex-gardens171-raster.test.cjs`
- `node scripts/audit-gardens171.mjs`
- `node scripts/browser-gardens171.mjs`
- `node scripts/render-gardens171.mjs` : rendu isolé en mémoire, pas une campagne.

L'audit local initial, graine 17117, a parcouru les 3 000 programmes et les 2 951
plans des 2 374 recettes compatibles : 114 ajouts dans 101 compositions ; les
douze profils sont représentés. Les quantités incluent les variantes héritées.
Le tableau exact et les listes par zone sont produits par l'audit, sans sauvegarde
personnelle. Le navigateur local bloque l'ouverture HTTP du jeu ; son rendu isolé
ne remplace donc pas le parcours de campagne exécuté dans GitHub Actions.

L'ancien test G8 qui exigeait encore le rejet de la révision 4 est corrigé :
les révisions implémentées sont acceptées, la suivante et les types invalides
restent refusés. Aucun contrôle de stock, migration ou position n'a été supprimé.

Ports, tunnels, échangeurs, niveaux et répétitions de pièces, réseaux électriques
et jardins natifs complets restent des chantiers distincts. Aucun succès global
de la suite avec endurance n'est déduit des succès ciblés de cette passe.
