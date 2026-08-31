# DEADWALL — finition visuelle

Direction : poste de commandement de terrain, acier patiné, béton, éclairage sodium.
La simulation, les silhouettes tactiques et les sauvegardes restent la source de vérité.

## Livraison du 31 août 2026

- Menu illustré par OpenAI ; provenance et prompt exact dans ART_PROVENANCE.md.
- CSS consolidés : palette acier/olive/sodium, hiérarchie typographique, panneaux opaques,
  états de sélection, alertes, contraste renforcé, mouvement réduit.
- HUD compact : population/énergie/moral visibles, sept ressources consultables,
  catalogue escamotable, commandes tactiles sans superposition.
- Clavier : difficulté native, focus des modales, restauration du focus et régions masquées inertes.
- Simulation et format de sauvegarde v2 conservés ; correctifs de perte de focus et de rotation.
- Serveur local limité aux fichiers publics et à la boucle locale ; caches PWA isolés.

## Contrôles réellement exécutés avant publication

- npm run check : build public, génération autonome, tests données/runtime/serveur/PWA.
- Chromium : 1440×900, 1280×720, 390×844, 320×640, tablette tactile 1024×768,
  paysage tactile 844×390 ; aucun débordement horizontal ni erreur console sur les parcours.
- Menu, difficulté clavier, manuel, pause, focus, catalogue, contrôles tactiles,
  contraste, son, sauvegarde et reprise.
- Récolte/dépôt par maintien E, placement par clic, chantier achevé par E, recrutement,
  avertissement de horde et assaut. Des positions de joueur ont été préparées pour
  raccourcir les trajets ; la temporisation du directeur a été accélérée pour déclencher la horde.
- Service worker actif puis redémarrage hors ligne avec ?autostart=1 sur les six formats.

Ces contrôles ne constituent pas une certification console, une campagne longue durée,
ni une vérification sur appareils iOS/Android physiques. Le rendu du terrain reste procédural ;
l'illustration est une image de menu, pas une capture du gameplay.
