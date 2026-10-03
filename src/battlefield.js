(function initBattlefield(global) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./core.js') : global.DeadwallCore;
  const DIRECTIONS = Object.freeze([
    Object.freeze({ id: 'north', label: 'NORD' }), Object.freeze({ id: 'east', label: 'EST' }),
    Object.freeze({ id: 'south', label: 'SUD' }), Object.freeze({ id: 'west', label: 'OUEST' })
  ]);
  function direction(origin, point) {
    const dx = point.x - origin.x, dy = point.y - origin.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'east' : 'west') : (dy >= 0 ? 'south' : 'north');
  }
  function inspect(core, zombies, buildings) {
    const sectors = DIRECTIONS.map(item => ({ ...item, contacts: 0, innerContacts: 0, walls: 0, fragileWalls: 0 }));
    const byId = Object.fromEntries(sectors.map(sector => [sector.id, sector]));
    if (!core || core.dead) return { sectors, contacts: 0, innerContacts: 0, fragileWalls: 0 };
    let contacts = 0, innerContacts = 0, fragileWalls = 0;
    for (const zombie of zombies) {
      if (zombie.dead || zombie.health <= 0) continue;
      const sector = byId[direction(core, zombie)]; sector.contacts++; contacts++;
      if ((zombie.x - core.x) ** 2 + (zombie.y - core.y) ** 2 <= C.BATTLEFIELD_RULES.innerRadius ** 2) {
        sector.innerContacts++; innerContacts++;
      }
    }
    for (const building of buildings) {
      if (building.dead || !building.completed || !building.def?.wall || building.health <= 0) continue;
      const sector = byId[direction(core, building)]; sector.walls++;
      if (building.health / building.maxHealth <= C.BATTLEFIELD_RULES.fragileWallRatio) {
        sector.fragileWalls++; fragileWalls++;
      }
    }
    return { sectors, contacts, innerContacts, fragileWalls };
  }
  function debrief(stats, resources) {
    const values = [
      ['VAGUES REPOUSSÉES', stats.wavesSurvived], ['INFECTÉS ÉLIMINÉS', stats.kills],
      ['PIC DE POPULATION', stats.peakPopulation], ['PIC DE STRUCTURES', stats.peakBuildings],
      ['ÉQUIPIERS PERDUS', stats.unitsLost], ['STRUCTURES PERDUES', stats.buildingsLost]
    ].map(([label, value]) => ({ label, value: Math.max(0, Math.floor(value || 0)) }));
    const lessons = [];
    // These are observed conditions, not an invented cause of defeat.
    if (resources.ammo < 1) lessons.push('La réserve commune de munitions était vide : anticipez la production et le coût des défenses.');
    if (resources.food <= .01) lessons.push('Les rations étaient épuisées : protégez une production alimentaire avant de recruter davantage.');
    if (resources.fuel <= 0) lessons.push('La réserve de carburant était vide : les générateurs ne pouvaient plus alimenter la ligne.');
    if (stats.unitsLost > 0) lessons.push('Des équipiers ont été perdus : repliez les sections et ouvriers avant la rupture de la ligne.');
    if (lessons.length < 2) lessons.push('Une seconde enceinte laisse du temps pour se replier. Gardez ses portes couvertes et le pied des murs dégagé.');
    return { values, lessons: lessons.slice(0, 3) };
  }
  // Presentation sees contacts through the same disposable frame as the maps.
  // The director's living total stays separate; it supplies no hostile position.
  function observedSnapshot(game, inspectContacts = inspect) {
    const actors = game.zombies.filter(z => !z.dead && z.health > 0);
    const vision = game.visibility?.frame?.();
    const seen = actors.filter(z => vision?.canSeeLocal?.(z));
    const result = inspectContacts(game.core(), seen, game.world.buildings.values());
    return { ...result, observedContacts: result.contacts, contacts: actors.length };
  }
  function assaultStatus(snapshot, incoming, announcedFronts, night, spawnTimer, pattern) {
    const present = snapshot.contacts;
    const activeFronts = snapshot.sectors.filter(sector => sector.contacts > 0)
      .map(({ id, label, contacts }) => ({ id, label, contacts }));
    const next = incoming > 0 ? (night ? C.Dayworks.frontGroup(night, pattern) : announcedFronts) : [];
    const nextFronts = DIRECTIONS.filter(item => next.includes(item.id)).map(item => ({ ...item }));
    const echelon = night ? Math.min(3, Math.floor(night.emitted * 3 / night.total) + 1) : null;
    // The saved spawn timer already includes the pause at each exact stage boundary.
    // While it expires, contacts on the field remain a live assault.
    const boundary = night && night.pauses > 0 && night.emitted < night.total
      && night.emitted === Math.ceil(night.total * night.pauses / 3);
    const pauseSeconds = boundary && spawnTimer > 0 ? Math.ceil(spawnTimer) : 0;
    return { present, incoming, observed: snapshot.observedContacts, activeFronts, nextFronts, echelon, pauseSeconds };
  }
  function assaultText(status) {
    const lines = [`${C.formatNumber(status.present)} présents · ${C.formatNumber(status.incoming)} encore à venir.`];
    if (status.activeFronts.length) lines.push((status.observed === undefined ? 'Contacts : ' : 'Contacts observés : ') + status.activeFronts.map(front => `${front.label} ${C.formatNumber(front.contacts)}`).join(' / ') + '.');
    else if (status.observed === 0) lines.push('Aucun contact actuellement observé.');
    if (status.nextFronts.length) lines.push('Arrivées annoncées : ' + status.nextFronts.map(front => front.label).join(' / ') + '.');
    if (status.echelon) lines.push(`Échelon ${status.echelon}/3${status.pauseSeconds ? ` · reprise des arrivées dans ${status.pauseSeconds} s, assaut toujours actif` : ''}.`);
    return lines.join(' ');
  }
  function assaultCompactText(status) {
    const lines = [assaultCountsText(status).slice(0,-1) + (status.echelon ? ` · échelon ${status.echelon}/3.` : '.')];
    if (status.activeFronts.length) lines.push((status.observed === undefined ? 'Contacts : ' : 'Observés : ') + status.activeFronts.map(front => front.label).join(' / ') + '.');
    else if (status.nextFronts.length) lines.push('Arrivées : ' + status.nextFronts.map(front => front.label).join(' / ') + '.');
    if (status.pauseSeconds) lines.push(`Reprise des arrivées dans ${status.pauseSeconds} s.`);
    return lines.join(' ');
  }
  function assaultCountsText(status) { return `${C.formatNumber(status.present)} présents · ${C.formatNumber(status.incoming)} à venir.`; }
  const api = Object.freeze({ DIRECTIONS, direction, inspect, observedSnapshot, debrief, assaultStatus, assaultText, assaultCompactText, assaultCountsText });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DeadwallBattlefield = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
