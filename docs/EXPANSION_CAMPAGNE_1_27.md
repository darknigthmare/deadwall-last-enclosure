# Campagne et secours — 1.27

Ce module ajoute cinq opérations facultatives accessibles depuis le centre d’opérations. Les chapitres régionaux, objectifs historiques, services essentiels et récits existants restent disponibles. Une seule opération de ce module peut être active.

| Opération | Préparation au dépôt | Terrain | Résultat après retour |
| --- | --- | --- | --- |
| Patrouille de liaison | 4 nourriture | Trois accès de lieux déjà découverts, relevé de 6 s à chacun | 1 point d’analyse |
| Ravitaillement civil | Colis scellé de 18 nourriture et 3 médicaments | Livrer au point civil indiqué en restant 5 s sur place | Jusqu’à 6 moral, plafonné à 100 |
| Réserve de protection civile | 4 nourriture | Ouvrir une caisse industrielle durant 9 s avec 3 ferraille du sac | Caisse de 24 ferraille et 6 carburant, livrée physiquement |
| Évacuation sanitaire | 6 nourriture et 2 médicaments | Stabiliser le blessé durant 8 s avec 2 médicaments supplémentaires dans le sac | Un ouvrier réel, si une place de logement est disponible |
| Engagement de garnison | 16 nourriture et 24 munitions | Repousser la prochaine vague en maintenant le centre à au moins 65 % d’intégrité | 12 munitions restituées et 1 point d’analyse |

Les chiffres de gameplay sont dans `DeadwallCore.CampaignPackRules`. Les fournitures initiales partent du stock collectif au début. Les consommables d’intervention partent du sac uniquement à la fin du travail. Les lieux sont choisis parmi les sites découverts compatibles : maisons et services civils pour l’aide, établissements industriels pour les caisses, lieux habités ou sanitaires pour les évacuations. La cible est un accès extérieur praticable, au niveau du sol. Le bouton de repérage utilise la même épingle que la carte régionale.

Le colis industriel constitue une nouvelle réserve de mission, limitée à une occurrence par site. Il ne modifie pas le butin historique des meubles. Le point humanitaire reçoit des fournitures destinées aux survivants ; il n’ajoute pas une population civile animée dans chaque bâtiment. Le blessé dispose d’un rendu au point de prise en charge et durant le transport ; son arrivée crée ensuite un véritable ouvrier de la simulation locale.

Une tentative par type et par vague est permise. Les accès engagés sont conservés dans un registre et ne peuvent pas être réutilisés pour le même type, y compris après abandon. Le budget d’un abandon est perdu. Cette limite évite de répéter indéfiniment le contrat le plus proche et donne une raison d’explorer d’autres quartiers. L’engagement de défense reste renouvelable d’une vague à l’autre, contre son coût intégral ; sa restitution de munitions est inférieure à l’engagement initial.

Le portage est exclusif avec les modules essentiels et les ballots d’exploration. Il supprime le sprint et limite l’allure à 82 % pour un colis, 72 % pour un blessé. Le commandant peut utiliser un véhicule et ses consommations normales ; la mission reste attachée au porteur et ne se dédouble pas dans le coffre. La livraison exige le retour à pied au dépôt. Chaque point de dégâts subi enlève un point d’intégrité au colis, ou 1,5 au blessé. À intégrité nulle, ou si le commandant tombe, l’opération échoue. Les fournitures ne sont pas téléportées au dépôt lors de l’évacuation du commandant.

Les travaux exigent une distance maximale de 3 m, un accès dégagé, l’absence de rechargement, d’infecté individuel proche visible et de horde sauvage proche. Ils peuvent avoir lieu la nuit : éclairage et discrétion restent donc utiles. Bouger, utiliser une commande d’action, tirer ou subir un coup interrompt le travail sans dépenser les consommables de terrain. Les soins automatiques des compagnons attendent la fin d’une intervention afin de ne pas consommer ses médicaments. La pause suspend le chronomètre. Charger une sauvegarde conserve l’opération et le transport mais annule un travail inachevé.

Le dépôt refuse une caisse si le stockage est insuffisant, et conserve alors le transport. Un blessé attend sa place de logement ; il arrive avec au plus l’intégrité conservée pendant son trajet. Les gains sont accordés uniquement par une action de livraison valide, jamais au chargement. Le journal conserve les 16 derniers résultats, les compteurs restent bornés et les recherches de cibles sont mises en cache.

La sauvegarde additive utilise `expansions127.modules.campaign`, version 1. Les anciennes parties reçoivent un registre vide, sans ressources ni objectifs accomplis. Toutes les valeurs, étapes, identifiants, découvertes et familles des lieux sont vérifiés avant que la sauvegarde ne remplace le monde. L’API `g.campaignPack` expose aperçu, engagement, travail, annulation, livraison, abandon, affichage, portage et état sérialisable. L’intégration des cinq packs assure les exclusions entre systèmes.

Vérification : `node --test tests/campaign-pack.test.cjs`. Les tests couvrent les cinq parcours, le transport, l’accueil réel, la perte, les limites, les pauses, les coûts, la reprise et les aperçus sans effet. Le test de durée exerce 24 engagements successifs et vérifie le plafonnement du journal ; il ne remplace pas une mesure de fluidité dans un navigateur ni une campagne humaine complète.
