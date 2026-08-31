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
  const api = Object.freeze({ DIRECTIONS, direction, inspect, debrief });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DeadwallBattlefield = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
