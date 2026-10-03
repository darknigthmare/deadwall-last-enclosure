# Interventions physiques — 1.34

## Contenu jouable

- Cinq contextes de crochetage sur des objets existants : coffres de véhicules, casiers personnels, armoires médicales, caisses et baies techniques. Les réserves scellées des régions lointaines utilisent également le mini-jeu au contact de leur caisse.
- Serrures déterministes par graine ; 34 % des contenants compatibles non entamés sont verrouillés. Les réserves spéciales restent toujours scellées. Les contenants déjà entamés dans une sauvegarde antérieure restent accessibles.
- Deux à quatre goupilles selon le contenant, sept positions de réglage et retour de résistance. Gauche/droite ajustent, Entrée confirme. Trois erreurs terminent une tentative. Aucun script de temps ne remplace la résolution.
- Révision des groupes électrogènes déjà placés dans les locaux techniques et certaines caves : quatre cadrans à aligner sur les repères du diagnostic.
- Tableaux de distribution près de l'entrée intérieure des sites dotés d'un groupe, un tableau par étage ; quatre circuits à positionner selon le diagnostic. Il s'agit d'un puzzle abstrait, sans schéma électrique pratique.
- Réparation au contact des générateurs construits à D-17 : la même interface restaure jusqu'à 200 PV réels, sans augmenter leur production nominale ni supprimer leurs dépenses habituelles de carburant.

## Effets et contraintes

Toutes les interventions demandent le même domaine, le même étage et une approche physiquement libre. Elles sont interrompues par une blessure, un déplacement, une menace à proximité (y compris un ancien survivant relevé), une mort, le commandement ou une perte de focus. Le petit établi de terrain n'est pas une pause : le monde continue pendant la manipulation.

Les consommables proviennent du sac du commandant et sont engagés au début de la tentative : 1 ferraille pour un crochet, 5 pour une révision régionale, 3 pour le tableau, 6 pour une réparation D-17. Une tentative annulée, échouée ou interrompue au chargement ne rembourse pas ses fournitures. Chaque nouvelle tentative a un diagnostic déterministe différent, et son compteur est conservé.

Un groupe révisé démarre seulement avec du carburant ; son réservoir conserve jusqu'à 12 unités, transférées depuis le sac par lots maximaux de 4, moteur arrêté. Il consomme 0,01 carburant et 0,004 point d'état par seconde de simulation. Il attire les infectés par son bruit, s'arrête à sec ou à l'usure totale, et cesse de fonctionner si le site est détruit. Les parties en pause ne consomment rien. Un groupe en marche doit être arrêté avant de récupérer ses pièces.

Un groupe en marche et le tableau rétabli alimentent effectivement les lumières des pièces de l'étage. Les murs arrêtent cette lumière par le masque lumineux existant. Les machines, pompes, stérilisateurs, lave-linge et bancs de découpe de cet étage se récupèrent 25 % plus vite ; leurs stocks restent finis. Les caisses, arbres et armoires ne bénéficient pas de ce bonus. L'électricité d'un lieu régional ne téléporte aucune énergie vers le réseau de D-17.

## Sauvegarde et anciens chemins

`expansions127.modules.interventions134`, version 1, conserve verrous ouverts, compteurs d'essais, état/réservoir/marche des groupes et tableaux d'étages rétablis. Les sessions de mini-jeu sont volontairement volatiles. L'import valide les IDs, lieux découverts, objets réellement présents, étages et nombres avant de modifier la campagne.

Le registre historique `world131.opened` demeure propriétaire des réserves spéciales. Son ancienne commande d'ouverture appelle le nouveau mini-jeu si le module 1.34 est installé. Le point de validation finale est protégé par l'autorisation de la session réussie ; aucune attente chronométrée concurrente n'ouvre gratuitement le même scellé. Les autres opérations de relais sont conservées.

`frontier.takenAmount(id)` permet de lire les prélèvements sans normaliser toute la sauvegarde à chaque image. Les coordonnées statiques des groupes sont mémorisées par monde/ID ; le rendu lumineux utilise les plans de pièces existants. Les tableaux sont visibles comme équipements muraux à l'intérieur, sous le toit ouvert, et ne créent pas de collision invisible.

## Limites explicites

Les serrures portent sur les contenants et réserves existants ; les portes extérieures ordinaires ne reçoivent pas de verrou arbitraire. Les barricades appartiennent au module séparé et utilisent leurs ouvertures physiques. Les centrales régionales ne distribuent pas entre plusieurs sites. Aucune nouvelle ressource infinie, PNJ électricien, télécommande de générateur ou simulation réaliste de câblage n'est annoncée.
