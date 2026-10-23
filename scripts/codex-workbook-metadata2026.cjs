'use strict';

const GITHUB = 'https://github.com/darknigthmare/deadwall-last-enclosure';

function text(meta, key, fallback) {
  if (meta[key] === undefined) return fallback;
  if (typeof meta[key] !== 'string' || !meta[key].trim()) {
    throw Error('Métadonnée de publication invalide : ' + key);
  }
  return meta[key];
}

function resolve(meta = {}) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    throw Error('Métadonnées de publication invalides');
  }
  const number = meta.pullRequest === undefined ? 16 : meta.pullRequest;
  if (!Number.isSafeInteger(number) || number < 1) {
    throw Error('Numéro de PR invalide : pullRequest');
  }
  const url = GITHUB + '/pull/' + number;
  if (meta.pullRequestURL !== undefined && meta.pullRequestURL !== url) {
    throw Error('URL de PR différente du dépôt ou du numéro annoncé');
  }
  const label = 'PR #' + number;
  return {
    number, url, label,
    subtitle: `Base 1.68 · ${label} · Suivi actualisé depuis les sources du dépôt`,
    tracking: `Suivi de la ${label}. Conception, contrôles et intégration en campagne gardent des statuts distincts.`,
    publication: `L’archive source initiale de Drive reste un instantané historique. Les contrôles ci-dessous décrivent le lot de reprise de la ${label}.`,
    integrationChange: text(meta, 'integrationChange', 'Inchangée'),
    integrationDetail: text(meta, 'integrationDetail', `Travail dans la ${label}. Fusion et déploiement distincts.`),
    integrationState: text(meta, 'integrationState', 'PR en cours'),
  };
}

module.exports = {GITHUB, resolve};
