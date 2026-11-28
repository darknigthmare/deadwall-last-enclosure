# Guide joueur — Coopération hôte/invité

1. **Lancer le relais** sur une machine joignable par tous les joueurs : `npm run coop` (port 4290 par défaut), ou
   `PORT=<port> node scripts/coop-server.mjs`.
2. **Héberger** : en partie, ouvrir le menu de pause, section « COOPÉRATION · OUVRIR MA CITÉ ». Saisir l'adresse du relais
   (`ws://<machine>:4290`), cliquer « OUVRIR MA CITÉ » et donner le code affiché (8 caractères). Un bandeau rappelle le code
   et le nombre d'invités. « FERMER LA CITÉ » renvoie les invités ; ils n'emportent rien.
3. **Rejoindre** : au menu principal, « COOPÉRATION · REJOINDRE UNE CITÉ » ; saisir l'adresse du relais, le code et un nom,
   choisir « Responsable de district », puis « REJOINDRE ».
4. **Commandes de l'invité** : ZQSD/WASD pour se déplacer, souris pour viser, clic gauche pour tirer, F (ou clic droit) pour
   un signal, 1 à 8 pour tenir un district, 0 pour n'en tenir aucun, Échap ou « QUITTER LA CITÉ » pour partir. On peut
   revenir avec le même code.
   **Vues** : la cité s'affiche en 2,5D ; V (ou le bouton « VUE ») passe en FPS depuis les yeux de l'avatar (souris pour
   tourner, ZQSD pour marcher selon le regard), puis en vue de dessus. Sans WebGL, la vue FPS repasse d'elle-même sur la vue
   de dessus.
5. **Règles** : trois invités au plus. L'hôte reste le Commandant unique (construction, lois, ordres, dépenses). Tant qu'un
   invité est assis, la pause et les dossiers n'arrêtent plus le temps ; un onglet d'hôte caché continue au ralenti puis
   ferme la session au bout de 90 s. L'avatar d'invité n'est pas sauvegardé : il réapparaît au dépôt.

À venir : rôle de chef de sortie en région, reconnexion automatique.
