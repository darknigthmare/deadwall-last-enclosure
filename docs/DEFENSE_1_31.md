# Préparer D-17 — 1.31

Quatre extensions raccordent la défense aux longues sorties. Elles se commandent sur une structure sélectionnée, à pied, à portée physique et hors de portée des infectés. Elles ne remplacent ni les caissons de munitions, ni les cassettes de réparation manuelle, ni les ingénieurs, ni les chantiers existants.

| Préparation | Mise en place | Fonction réelle | Contrepartie |
|---|---|---|---|
| Consigne de porte | Porte achevée ; 6 bois, 10 ferraille | Passage allié au calme, verrouillage après deux secondes à l’alerte et pendant la nuit ; arrêt si passage occupé ou équipement indisponible | Un accès verrouillé bloque aussi les alliés. Une commande manuelle prévaut jusqu’au changement de phase. |
| Caisse de réfection | Structure achevée ; 12 ferraille, 6 bois, 6 pierre | Les ingénieurs réellement présents y consomment les matériaux réservés, à cadence et coût habituels, jusqu’à 90 % d’intégrité | Pas d’ingénieur, pas de réparation. Pas de téléportation, de soin instantané ou de réparation après destruction. |
| Poste d’outillage | Chantier en phase calme ; 6 bois, 8 ferraille, 3 carburant | Le travail physique des ouvriers augmente de 35 %, avec seulement 8 unités de travail supplémentaire | Aucune accélération passive ou du joueur. Les ouvriers arrêtent de récolter pendant leur travail normal. Suspension et évacuation restent prioritaires. |
| Secteur de tir | Mirador/tourelle achevé ; 2 bois, 4 ferraille | Limite le tir automatique à 90° vers le nord, sud, est ou ouest, y compris avec le caisson local | Les autres directions sont laissées sans couverture par ce poste. Aucun bonus de dégâts ou de détection nocturne. |

## Intégration

Le registre additif est `expansions127.modules.defense131`, version 1, limité à 128 supports. Les stocks de réfection et d’outillage appartiennent au support ; une destruction les perd. Le reliquat de réfection est récupérable à portée du support dans la limite du stockage. Le balisage et la consigne ne se remboursent pas. Réorienter un secteur existant ne facture rien ; le supprimer puis le réinstaller facture un nouveau balisage.

Les consignes et ingénieurs restent actifs lorsque le commandant explore la région ou est momentanément à terre. La simulation s’arrête en pause, dans les modales et à la défaite. Aucune instruction ne garantit que D-17 tiendra la nuit. Les avertissements de départ continuent d’examiner les défenses et les réserves réelles.

Le moteur du chantier reste responsable de l’occupation de son empreinte, des dégâts et de l’achèvement. L’outillage enveloppe le travail existant uniquement pendant `updateUnits`; il ne contourne pas les suspensions de chantier. Les réserves ne créent pas de matériaux et les postes ne ressuscitent pas.

Le rendu place quatre petits indicateurs sur leur support, dans sa passe de profondeur. Le secteur de tir de la sélection est dessiné au sol. Les coordonnées des bâtiments restent celles de D-17 ; la projection régionale réutilise le même peintre. Les règles sont centralisées dans `DeadwallCore.Defense131Rules`.

## Vérification

`tests/defense-pack131.test.cjs` couvre les quatre extensions, les coûts et pénuries, les accès occupés, la pause, la priorité manuelle, la marche et le travail réels des ingénieurs, la réserve finie des ouvriers, les secteurs de tir et les caissons, l’obscurité, la destruction, la migration et le rejet transactionnel des sauvegardes corrompues.

Les captures du peintre Canvas sont des scènes préparées avec les API réellement livrées. Elles ne remplacent pas une session humaine longue ni une mesure de cadence dans un navigateur.
