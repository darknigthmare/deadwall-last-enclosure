# DEADWALL 1.46 — Veille & expéditions

Cette passe ajoute des contacts cartographiques observés et treize options de terrain, d’équipe et de construction. La boucle reste récolter, porter, déposer, financer, construire, équiper et tenir la horde.

## Vision partagée des cartes

Un marqueur ennemi demande un acteur physique vivant : commandant, unité alliée, compagnon, poste achevé et opérationnel, ou annexe habitée achevée. Chaque observateur a une portée en mètres. La vue exige une ligne physique libre, le même étage et un accès cohérent à l’intérieur. Le commandant parti en région ne garde pas une vue fictive à D-17 ; la garnison et les postes demeurent ses observateurs locaux.

Les portées de jour sont : commandant 20 m ; ouvriers/secouristes/ingénieurs 10 m ; soldats 16 m ; Léa 24 m, Samir et Inès 12 m, Malik 18 m. Postes D-17 : centre et caserne 12 m, clinique et atelier 10 m, mirador 22 m, tourelle 14 m, tourelle lourde 18 m. Une fondation, un mur ou une lampe ne constitue pas un poste d’observation. Les postes électriques doivent être alimentés ; pertes, arrêt territorial et incendie interrompent leur observation.

La portée ambiante suit 20 % + 80 % de la luminosité diurne. Le noir impose le minimum ; une cible réellement éclairée peut retrouver la portée de jour. Un phare ou une torche garde son cône et ses obstacles physiques. La caméra et le zoom n’augmentent pas la portée. Les lumières seules ne révèlent aucun infecté.

Le GPS D-17, les contacts du Commandement, le GPS régional et l’atlas partagent `visibility146`. Les populations abstraites des groupes ne fournissent plus de radar cartographique ; les membres physiques et dépouilles réanimées sont soumis aux mêmes règles. Une cible perdue de vue disparaît au prochain dessin, sans position mémorisée. Les cartes persistent la géographie et les lieux déjà reconnus ; elles ne persistent pas les positions ennemies. La coopération réseau existante transmet des repères de présence, sans santé/campagne/intérieur attestés : ces silhouettes réseau ne servent pas d’observateurs.

## Options jouables

| Domaine | Ajout | Coût et contrepartie |
| --- | --- | --- |
| Survie | Ration de marche | 2 vivres, 2 s, jusqu’à 30 endurance ; bivouac réel et gain utile requis. |
| Survie | Relève abritée | 6 vivres + 1 médicament, 20 s, jusqu’à 30 PV ; camp et bâche encore actifs jusqu’au bout. |
| Survie | Pansement léger | 1 médicament, 3 s ; 9 PV sur 15 s, interruption conservée en cas de blessure. |
| Exploration | Ballot compact | 1 bois + 1 ferraille, 3 s, jusqu’à 12 ressources réellement prélevées sur un gisement relevé ; vitesse ×0,86, sprint suspendu. |
| Exploration | Mettre en cache | 3 s, accès physique à une cache ; capacité 54, reliquat porté, aucun crédit au dépôt ni livraison comptée. |
| Fortification | Caisson compact | 2 bois + 2 ferrailles + 12 cartouches ; réserve finie de 12, munitions prélevées une fois. |
| Fortification | Filet large | 26 bois + 16 ferrailles, palier 2 et atelier ; 24 points finis, anciens filets conservés à leur reliquat. |
| Équipe | Exercice d’escorte | 24 vivres + 14 ferrailles, 60 s, après spécialité ; Suivre + File réduit l’écart de 30 %, sans accélérer ni traverser les obstacles. |
| Équipe | Exercice d’appui | 30 vivres + 20 ferrailles + 8 cartouches, 75 s, après escorte ; Tenir + Défense : Malik 8 m, services ×1,15, repérage Léa ×1,10, consommations habituelles. |
| Contrats | Relais sanitaire | Dépôt 6 vivres + 6 médicaments, sac 2 ferrailles, 12 s sur un accès médical découvert ; colis sortant fragile, récompense 2 connaissances + 3 moral. |
| Contrats | Retour de réserve | Dépôt 8 vivres, sac 5 ferrailles, 14 s sur un accès industriel découvert ; colis entrant fragile, récompense 8 médicaments + 18 cartouches. |
| D-17 | Relais de veille | Deux miradors, entrepôt et halte : 215 bois + 135 ferrailles + 40 cartouches + 10 vivres ; quatre fondations, axe libre, aucune enceinte offerte. |
| D-17 | Cour de soins | Clinique, générateur, entrepôt et halte : 165 bois + 175 ferrailles + 8 médicaments + 20 carburants + 10 vivres ; soins après achèvement, alimentation et accès réels. |

Chaque nouveau contrat autorise une seule tentative dans la campagne et expire au troisième changement de vague depuis son départ. Les frais ne sont pas remboursés à l’échec. Le contenu arrive uniquement par le trajet et la restitution ordinaires ; un dépôt plein conserve une récompense en attente. Les préparations chronométrées démarrent sur le terrain ; les équipements et restitutions utilisent leur transaction ordinaire. Les descriptions demeurent lisibles lorsqu’une condition manque, en plus de la raison du refus.

Le bureau de chantier prépare les ensembles. L’aperçu ne débite rien ; la confirmation revalide cellules, palier, prérequis et ressources avant financement. Les bâtiments ne procurent ni score, ni capacité, ni vision tant que les chantiers ne sont pas achevés. L’illustration est calculée depuis leurs empreintes effectives.

## Sauvegardes et cartes

Le format général reste v20. Les registres de packs gardent leurs versions et propriétaires de stocks. Les nouvelles clés de contrats absentes d’une ancienne sauvegarde valent zéro ; aucun stock, entraînement ou capacité n’est octroyé par migration. Les entraînements nouveaux exigent les étapes antérieures payées.

Les coordonnées des décors d’une sauvegarde courante sont restaurées sans packing supplémentaire. Une construction autorisée peut toucher l’ancienne réserve d’un véhicule tout en restant hors de son collider ; Continuer ne doit pas déplacer ce véhicule. Le packing initial et les migrations de terrains antérieurs restent conservés, y compris lorsque l’ancien fichier a déjà été normalisé par le lecteur de sauvegarde. Les générations G1–G7, la graine et les quantités finies ne sont pas reroulées.

## Vérification et variantes

```sh
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:visibility
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:campaign
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:terrain
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:tactics
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:standalone -- --transport http
npm run package:web
npm run package:source
```

Les codes de sortie, comptes exacts, erreurs collectées et empreintes des sources figées sont produits par l’exécution courante. Le rapport final est distinct de ce guide ; aucune assertion de test historique n’est une preuve de réussite 1.46. Les scènes avancées préparées pour observer murs, portes, étages, pertes et nuit sont indiquées comme fixtures ; les parcours natifs utilisent les vrais contrôles. Les archives extraites doivent passer les contrôles web/PWA et autonome après vérification de chaque payload.

Trois variantes sont prévues : Web-PWA, Standalone et Sources. Sources comprend tests/docs/codex ; les paquets joueur restent séparés. Les manifests portent les SHA-256 et la provenance Git réelle, avec état local modifié. Références 1.41–1.45 et anciens ZIP conservés, sans réécriture.

## Publication Vercel

Destination demandée : https://deadwall-last-enclosure.vercel.app/. Le déploiement doit viser le projet existant propriétaire de cette origine, résolu par l’API authentifiée ; ne pas créer un autre projet homonyme. Le staging statique est issu du web extrait et vérifié, déployé à la racine avec Build Output API v3, politique de cache, service worker et en-têtes de sécurité conservés. Les identifiants secrets se renseignent dans les paramètres sécurisés de l’environnement, jamais dans ce guide ou le chat.

Le préflight doit obtenir un accès API effectif et le jeton `VERCEL_TOKEN`. Une configuration ou un paquet préparé ne prouve pas une publication. Après déploiement, vérifier l’origine publique, la version servie, les payloads importants, les en-têtes et une reprise de sauvegarde. Les preuves sont conservées hors dépôt sous `/workspace/deadwall-cloud/1.46.0/vercel`.

## Limites de livraison

Le cloud Chromium administré refuse `file://` ; le contrôle autonome HTTP sert les octets du HTML sans dépendance externe, distinct d’une ouverture locale. Le mobile est une PWA HTTPS ; des formats tactiles simulés ne certifient pas les appareils physiques. Le portable Windows doit être fabriqué et exécuté sur Windows 10/11 x64. Les sessions humaines longues, la signature éditeur et une publication boutique restent à vérifier avant commercialisation. La coopération est un relais de présence, sans combat synchronisé.
