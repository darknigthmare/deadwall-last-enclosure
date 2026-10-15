'use strict';

const fronts = ['north', 'east', 'south', 'west'];

// Arrival edges and current sectors are different facts. Derive the latter
// independently from contact bearings, rather than assuming a seeded position.
function positionFrontCounts(core, contacts) {
  const finite = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
  if (!finite(core) || !Array.isArray(contacts) || contacts.some(p => !finite(p))) return null;
  const counts = Object.fromEntries(fronts.map(id => [id, 0]));
  for (const point of contacts) {
    const dx = point.x - core.x, dy = point.y - core.y, angle = Math.atan2(dy, dx);
    // atan2 can round a bearing one ULP beside a diagonal onto that diagonal.
    // Only there, use the unrounded diagonal half-planes to resolve its side.
    const diagonal = Math.abs(angle) === Math.PI / 4 || Math.abs(angle) === 3 * Math.PI / 4;
    const id = dx === 0 && dy === 0 ? 'south'
      : diagonal ? (dx - dy) * (dx + dy) > 0 ? dx > 0 ? 'east' : 'west' : dy >= 0 ? 'south' : 'north'
      : angle >= -3 * Math.PI / 4 && angle <= -Math.PI / 4 ? 'north'
      : angle >= Math.PI / 4 && angle <= 3 * Math.PI / 4 ? 'south'
      : Math.cos(angle) > 0 ? 'east' : 'west';
    counts[id]++;
  }
  return counts;
}

function unobservedEchelonTerms(snapshot) {
  const expected = positionFrontCounts(snapshot.core, snapshot.zombies);
  const observed = snapshot.observedFronts;
  return {
    eightPositionedContacts: !!expected && snapshot.zombies.length === 8 && Object.values(expected).reduce((a, b) => a + b, 0) === 8,
    exactCurrentSectors: !!expected && fronts.every(id => snapshot.fronts?.[id] === expected[id]),
    noObservedContacts: snapshot.observed === 0,
    noObservedSectors: !!observed && fronts.every(id => observed[id] === 0) && Object.values(observed).every(count => count === 0),
    emptyObservationLabel: snapshot.detail.includes('Aucun contact actuellement observé.'),
    noNorthDisclosure: !snapshot.detail.includes('NORD'),
    eastArrivalLabel: snapshot.detail.includes('Arrivées annoncées : EST.')
  };
}

module.exports = { positionFrontCounts, unobservedEchelonTerms };
