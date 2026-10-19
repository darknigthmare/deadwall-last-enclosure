# Fiabilité transversale 199 — après les menus 194–196

Base exacte : `5fccf78b553300fc7fc1411ee339d68a6f381be3`, PR #10 prête pour revue, non fusionnée au début de cette passe. Cette suite est séparée afin de ne pas remplacer sa qualification. « 199 » désigne un lot technique, pas une version commerciale.

## Manques traités

### Audio optionnel, transactions obligatoires

`AudioSystem.tone` et `noise` pouvaient laisser une allocation, une connexion ou un démarrage WebAudio interrompre une action du moteur. La création d'une voix est désormais transactionnelle : toutes les allocations connues sont libérées en cas d'échec, le compteur est décrémenté une seule fois, un échec temporaire n'interdit pas les sons suivants. Une fermeture de contexte, le silence, le volume nul et le budget de voix empêchent les allocations. Paramètres non finis et durées négatives refusés ; budgets maximaux centralisés dans `Audio199Rules`. Les effets existants conservent leurs timbres, volumes et durées usuelles.

Les tests provoquent des échecs précis de périphérique, dont après allocation partielle et au démarrage. Un contrat du moteur finance réellement une palissade, vérifie coût, chantier, compteur et sauvegarde/reprise malgré une erreur d'oscillateur. Ce n'est ni une certification sonore ni un test matériel de tous les navigateurs.

### Sauvegardes automatiques visibles lorsqu'elles échouent

Le premier échec automatique de validation, d'écriture ou de vérification d'écriture produit une alerte ; les répétitions de la même erreur restent silencieuses pour éviter le spam. Un changement de cause et les essais manuels restent signalés. Le retour d'un stockage utilisable produit une seule confirmation de récupération. Le traitement existant des copies de secours reste conservé.

Cette notification ne rembourse aucune action et ne modifie ni le format de sauvegarde ni ses limites. Les tests comparent séparément la campagne, la copie principale et la sauvegarde secondaire. Les erreurs volontairement injectées sont conservées comme telles ; aucun quota de téléphone réel n'est annoncé mesuré. Un échec reste visible dans les Paramètres via le dernier statut ; le toast n'est pas un nouveau bandeau permanent.

### Survie et altitude réelle

Le repère local de survie traitait auparavant le commandant comme étant toujours au sol. Il utilise maintenant l'altitude du contrôleur vertical. Un enclos de bivouac au sol ne permet pas de repos, de démontage ou de préparation à travers une dalle ; monter interrompt un travail engagé au sol. Construire un bivouac depuis un étage est explicitement refusé, sans inventer de camp posé sur une dalle non gérée par son registre.

Une bâche au sol ne protège pas une flamme portée au-dessus d'elle ; une lampe réellement laissée sous la bâche reste protégée. Les soins portables restent disponibles en hauteur. Les menaces sont comparées à l'altitude du commandant. Le dernier fragment de durée d'un pansement ne soigne plus au-delà de son temps restant.

Quatre bancs isolent ces frontières par une pose verticale contrôlée ; un autre utilise le vrai contrôleur d'escalier sur un support payé préparé par la fixture verticale existante. Il ne remplace pas une campagne montée naturellement jusqu'à cet âge. Les valeurs de guérison, consommations, coûts et durées des soins restent inchangées.

### Suivi des élevages éloignés

Le dossier d'élevage ne détaillait auparavant que l'enclos à portée. Son registre présente désormais tous les enclos déjà possédés, dans l'ordre de leurs identifiants : adultes et jeunes, sujets restés sous garde en ruine, état de clôture, rations/eau, autonomie estimée aux besoins actuels, délai de reproduction en cours, produits et temps restant avant péremption, coordonnées régionales.

L'estimation d'autonomie exclut les futures naissances et n'invente pas une réserve infinie pour un site vide. Un animal libéré, mort ou transformé ne compte plus comme un consommateur. Les données retournées sont détachées ; consulter le registre depuis D-17 ne fait pas avancer l'entretien, ne génère pas de région, ne révèle pas de lieu inconnu et n'accorde pas de ravitaillement distant. Nourrir, puiser, préparer, cuire et tanner exigent toujours la présence et les ressources natives.

## Vérifications et protocole

- `tests/quality199-audio.test.cjs` : 21 cas, erreurs WebAudio simulées, nettoyage, bornes et construction native.
- `tests/quality199-persistence.test.cjs` : 2 cas, échecs automatiques, transition, reprise et copies.
- `tests/quality199-survival.test.cjs` : 5 cas, altitude, interruptions, abri, pansement et escalier natif.
- `tests/quality199-husbandry.test.cjs` : 4 cas, rapports isolés et captive réellement générée puis reprise à D-17.

Ces 32 tests s'ajoutent aux régressions existantes, sans les retirer. Les tentatives négatives puis positives sont conservées séparément. Deux défauts des nouveaux tests ont été corrigés sans modifier leurs exigences : nom natif `woodWall` et assertion Node `doesNotMatch`. Une tentative de régressions lancée avant cette correction reste classée en échec.

`browser-quality199.mjs` suit le menu joueur sans configuration sur `dist`, puis injecte explicitement deux erreurs de stockage et un défaut WebAudio pendant la pause. Les ordres passent par les boutons natifs ; sauvegarde/menu/rechargement/Continuer restent réels. Aucun inventaire, graine, position ou temps n'est injecté. Les erreurs de console marquées `STORAGE_FAULT_199` doivent être exactement les deux erreurs prévues ; toute autre erreur reste bloquante. L'ouverture d'un registre vide ne crée rien.

Le parcours d'élevage existant ajoute la lecture du registre d'un vrai animal capturé, avec comparaison des données et capture d'écran. Son checkpoint, son sac et ses pas de simulation restent des fixtures déclarées ; ce n'est pas une nouvelle campagne humaine. Le navigateur local refuse la navigation avec `ERR_BLOCKED_BY_ADMINISTRATOR`, sans contournement. Les preuves visuelles doivent provenir d'une exécution distante réussie sur le SHA exact.

`DEADWALL_SOAK=1 npm run check` est exécuté. Seuls les résultats effectivement terminés sont indiqués dans la PR et l'archive ; un job commencé, arrêté ou ignoré ne vaut pas succès.

## Couverture restante : priorités, pas annonce de complétion

| Domaine | Ce que cette passe vérifie ou améliore | Travail toujours distinct |
|---|---|---|
| Menus et nouveau départ | Réutilisation intacte de la base qualifiée, parcours normal rejoué | Refonte des écrans métier et du HUD de combat, tests d'accessibilité sur appareils physiques |
| Survie / citadelle | Séparation sol/étage et transaction de soins | Bivouacs sur dalle, intérieurs libres, cabines, évacuation et files communes |
| Sauvegardes | Signalement et conservation en cas d'erreur | Endurance de très grandes campagnes, saturation réelle du stockage, transitions multi-onglets |
| Élevage | Registre de tous les sites et absence de transfert distant | Cages portables, transport des produits bruts, métiers de soigneurs et ravitaillement physique par PNJ |
| Faune | Population et sauvegardes historiques gardées, prédation existante inchangée | Migrations longues, chaînes de consommation détaillées, vols au-dessus des bâtiments, finitions artistiques et sons fidèles |
| Monde / bâtiments | Pas de changement de graine, profil, recette, route ou ressource | Sous-minima de mobilier, parcours naturels des ouvrages complexes, détour des accès refusés |
| Combat / siège | Actions préservées malgré la panne audio | Grandes foules distantes, débris et rupture structurelle, équilibre de longs sièges sur matériel cible |
| Population civile | Besoins des captifs observables depuis la cité | Logements individualisés, relèves, fret et entretien autonomes de tous les habitants |
| Coopération | Aucun changement de protocole ni fausse autorité partagée | Identité de carte entre clients, simulation autoritaire commune, reconnect et conflits de transactions |

Cette matrice est une revue des frontières de systèmes, **pas un pourcentage de couverture d'exécution**. L'existence d'un grand nombre de tests ne démontre pas qu'une campagne de 6–10 heures a été jouée humainement.
