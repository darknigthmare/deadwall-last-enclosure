# Relève de survivant — présentation 1.33

Le dossier « La garde continue » apparaît lorsqu’une mort attend le choix du prochain survivant. Il présente le nom et le dernier lieu connu du défunt, le maintien du corps et du sac, puis les archétypes fournis par le moteur. Les avantages et contreparties affichés sont les valeurs descriptives de `succession133` : la présentation ne recalcule aucun bonus et ne distribue aucune ressource.

Le portrait réutilise l’illustration originale `assets/loadout-character129.png`, traitée par CSS comme une fiche commémorative. Le fond reprend le dépôt de `assets/intro-bastion132.webp`. Ces images ne représentent pas de nouvelles variantes de personnage ou de nouveaux lieux simulés. Les pictogrammes SVG du module sont originaux. Le dossier ne révèle ni le résultat du tirage de réanimation ni un compte à rebours caché ; il rappelle seulement qu’un corps peut se relever.

## Choisir et reprendre

1. Sélectionner un archétype, au pointeur ou avec les flèches dans la liste. Début / Fin rejoignent le premier / dernier profil.
2. Lire ses avantages et contreparties, puis confirmer « Prendre la relève ».
3. Le moteur crée le prochain survivant au dépôt. Le sac précédent se récupère physiquement ; les armes et munitions ne sont pas offertes par ce choix.

La sélection d’une fiche ne confirme pas le choix. Échap ne réanime pas le personnage : il rappelle les possibilités et focalise « Sauvegarder et quitter ». Cette sortie conserve l’état en attente via la sauvegarde du moteur. Si l’enregistrement échoue, la campagne reste ouverte et le message explique comment reprendre un survivant puis exporter depuis les paramètres.

La simulation et les commandes sont bloquées pendant le dossier. Les autres éléments de page sont inertes, le focus clavier reste dans la fenêtre et le défilement est conservé pendant les mises à jour. Une perte de focus maintient la pause après confirmation ; la reprise exige alors une action volontaire. Le chargement d’un décès ferme les contrôleurs d’inventaire, de carte ou de commandement précédents avant d’afficher la relève. La destruction du centre donne la priorité à la défaite.

## Armurerie

Le tiroir « Armurerie » rejoint le ruban d’outils existant près du dépôt, lorsqu’il reste une arme à réquisitionner. Son contenu vient de `view().requisitions` : arme, coût, possession, disponibilité et raison d’un refus. Le bouton appelle `requisition(id)` ; le moteur vérifie la présence physique, le palier et les ressources. Le tiroir annonce explicitement que les armes sont vides et que leurs munitions doivent être prises dans les stocks existants.

## Installation

Charger `src/succession-ui133.js` après `src/succession133.js`, `src/campaign-intro132.js` et `src/presentation132.js`. Le montage navigateur se termine à `DOMContentLoaded` pour envelopper les contrôleurs déjà installés. Charger `succession-ui133.css` après les feuilles de présentation précédentes.

API de présentation : `g.successionUI133.refresh()`, `choose(id)`, `confirm()`, `isOpen()`, `view()` et `element`. La logique appelle `refresh()` après décès, sélection ou restauration. Le moteur reste propriétaire de l’état persistant, des calculs, de la récupération et des peintres du corps / sac / infecté.

## Vérification

`tests/succession-ui133.test.cjs` vérifie les interactions de présentation sous DOM simulé : sélection explicite, isolation des entrées, navigation clavier, inertie, perte de focus, fermeture des autres modales, nouvelle campagne, départ invalide, défaite et armurerie. Les tests de logique et d’intégration sont séparés. Ces contrôles ne constituent pas une session de navigateur ni une certification visuelle CSS ou tactile ; le navigateur local est indisponible dans cet environnement.
