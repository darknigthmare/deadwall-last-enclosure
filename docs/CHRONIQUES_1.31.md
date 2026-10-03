# Chroniques de D-17 · 1.31

## Contenu réellement raccordé

Huit dossiers de trois documents, soit **24 collectables** : portes de D-17, eau, lumière de retour, trajet routier, voisinage, soins, chantier de carrière, liaison radio. Huit copies initiales sont conservées au dépôt ; seize autres occupent seize accès régionaux distincts, choisis selon la graine parmi les familles de lieux compatibles. Le générateur réutilise les POI et leurs transformations physiques. Il vérifie la place libre et la liaison avec l’allée avant de placer une pochette au sol. Si aucun lieu compatible n’existe, le carnet l’annonce sans inventer d’emplacement.

Les documents ne garantissent ni ressource, ni refuge actuel, ni sort des auteurs. Ils restent des traces historiques. Les trois transcriptions sont des **copies écrites**, explicitement sans enregistrement sonore conservé. Elles ne proposent aucun faux bouton de lecture audio.

Quatre entretiens courts concernent les compagnons existants : Léa, Samir, Inès et Malik. La parole exige leur affectation réelle, leur santé positive et le retour au dépôt. Le carnet conserve ensuite des « propos recueillis auparavant » : décès et retrait d’équipe ne deviennent jamais une présence vivante ni une résurrection.

## Parcours du joueur

Ouvrir Opérations → Chroniques de D-17. Chaque dossier présente une page à la fois. La première copie exige le contact physique avec le dépôt ; les suivantes exigent la précédente, la découverte du lieu, son accès extérieur, le rez-de-chaussée et l’absence d’infecté immédiatement menaçant. Un repère GPS n’est disponible que pour un lieu reconnu. Le relevé prend trois secondes de simulation active. Mouvement, tir, blessure, décès, changement de domaine ou d’étage l’interrompent. Les copies se lisent ensuite en pause au carnet.

Les choix de deux dossiers complets se prennent une seule fois au dépôt. Afficher les règles ou les transmettre à la relève modifie les consignes des enquêtes Voisinage et Radio. Restreindre les transmissions aux faits datés ou conserver aussi les appels incertains modifie les prochains textes Route, Soins et Radio. Les effets sont éditoriaux et persistants : aucun gain de matériel ni mission de sauvetage fictive n’est attribué.

## Premiers gestes

Le prologue est facultatif : récolter huit matériaux, en déposer huit personnellement par l’interaction du terrain, terminer une nouvelle construction. Les livraisons des ouvriers ne valident pas le dépôt personnel. Il n’avance ni l’heure ni les vagues et ne crée aucune ressource. Le joueur peut le passer depuis le carnet. Les anciennes campagnes migrent avec le prologue passé ; aucun écran ne les interrompt.

## Mise en scène et accessibilité

Trois séquences courtes cadrent le premier dépôt personnel, la première sortie et la première migration tenue. Elles montrent un extrait réellement capturé de la minimap active, un cadre sombre, deux phrases successives et un signal radio procédural. Ce sont des **séquences de liaison illustrées**, pas des cinématiques animées avec acteurs ou voix enregistrées. Elles ne déplacent pas la caméra, ne capturent pas les touches, ne suspendent pas les risques et se passent par un bouton accessible. Elles disparaissent sous un menu modal ou une pause. Le réglage de mouvement réduit désactive leur apparition animée.

## Persistance, charge et contrats

- Module `lore131` dans le registre commun des opérations ; validation avant mutation du monde.
- Bornes : 24 collectables, 24 lectures, deux décisions, quatre entretiens, trois séquences.
- Les accès sont déterministes ; le calcul est mis en cache par objet monde. Les peintres filtrent la vue, l’étage, l’intérieur et la ligne de vue.
- L’extension volontaire d’une campagne G4 vers G5 ancre les pistes dans leur génération d’origine (`siteGeneration`, champ optionnel du registre). Les lieux annoncés et les pages déjà relevées ne se déplacent pas. Les nouvelles campagnes G5 utilisent aussi les accès lointains ; une nouvelle partie efface l’ancrage précédent.
- Le rendu réutilise la file commune de profondeur régionale. Aucun document n’est peint à travers un étage fermé.
- Une collecte sauvegarde la découverte avant la lecture. Une reprise annule le geste incomplet ; la pochette reste disponible.
- Les séquences vues ne redémarrent pas après chargement. La migration ancienne neutralise leurs déclencheurs.
- Valeurs de réglage dans `DeadwallCore.Chronicles131Rules`.

Validation automatisée dans `tests/chronicles131.test.cjs`. Les tests couvrent accès, ordre, reprise, corruptions, pause, mort/réanimation, auteur absent, compagnon mort, absence de ressources gratuites et couche de rendu. Ils ne constituent pas une certification de FPS ni une lecture humaine complète en partie longue.

L’audit intégré `tests/qa09-lore131.test.cjs` ajoute les 24 collectes sans injection de progression narrative, les approches finales par les collisions réelles, les deux branches de chaque décision et la stabilité de la migration G4 → G5. Les longs trajets entre sites et le nettoyage préalable des scènes sont préparés : ce parcours ne remplace pas une campagne humaine complète.
