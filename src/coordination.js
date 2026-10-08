(function initCoordination(root) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./core.js') : root.DeadwallCore;
  const B = typeof module !== 'undefined' && module.exports ? require('./battlefield.js') : root.DeadwallBattlefield;
  const VERSION = '1.52.0';
  function searchable(value) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').trim(); }
  function matches(def, query) {
    const haystack = searchable([def?.name, def?.description, def?.category].join(' '));
    return searchable(query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
  }
  function tactical(game) {
    if (!game || game.state !== 'playing' || game.gameOver) return null;
    const snapshot = game.battlefieldUI?.snapshot() || B.observedSnapshot(game);
    const incoming = game.spawnQueue.length + C.spawnCount(game.pendingSpawns);
    const day = game.dayworks?.snapshot();
    const actualNight = day?.night?.wave === game.wave ? day.night : null;
    const warning = game.phase === 'warning';
    const night = actualNight || (warning && game.wavePlan ? C.Dayworks.beginNight(game.wave, game.wavePlan.total, game.fronts) : null);
    const pattern = game.siege?.assaultPattern();
    const status = B.assaultStatus(snapshot, warning ? game.wavePlan?.total || 0 : incoming, game.fronts, night, game.spawnTimer, pattern);
    // Projection of the saved director only. No wave selection, emission or RNG.
    const stages = night ? [0, 1, 2].map(index => ({ number: index + 1,
      fronts: C.Dayworks.frontGroup({ ...night, emitted: Math.ceil(night.total * index / 3) }, pattern)
        .map(id => B.DIRECTIONS.find(d => d.id === id)?.label).filter(Boolean) })) : [];
    const walls = [...game.world.buildings.values()].filter(b => !b.dead && b.health > 0 && b.completed && b.def.wall);
    const braces = (day?.braces || []).filter(b => b.wave === game.wave && b.hp > 0 && walls.some(w => w.id === b.id));
    return { phase: game.phase, status, stages, pattern: pattern || null,
      title: pattern === 'pincer' ? 'Prise en tenaille' : pattern === 'flank' ? 'Débordement latéral' : 'Arrivées de la nuit',
      observed: snapshot.observedContacts, inner: snapshot.innerContacts,
      fragile: walls.filter(b => b.health / b.maxHealth <= C.BATTLEFIELD_RULES.fragileWallRatio).length,
      corpseRamps: walls.filter(b => (b.corpseLoad || 0) > C.LINECARE_RULES.rampMin).length,
      openGates: walls.filter(b => b.def.gate && b.gateMode === 'open').length,
      braces: braces.length, visible: warning || game.phase === 'assault' };
  }
  function inspect(game) {
    if (!game || game.state !== 'playing' || game.gameOver) return null;
    const buildings = [...game.world.buildings.values()].filter(b => !b.dead && b.health > 0);
    const finished = buildings.filter(b => b.completed);
    const pending = buildings.filter(b => !b.completed);
    const enclosure = game.getEnclosureStatus();
    const population = game.population, food = game.resources.food, ammo = game.resources.ammo;
    const power = game.powerGenerated+(game.powerBatteryOutput||0), demand = game.powerUsed;
    const fires = game.siege?.overview().fires.length || 0;
    const citizen = game.citadel?.overview();
    const commonShotAvailable = game.citadel?.canFire(1) ?? ammo >= 1;
    const roads = game.infrastructure?.overview();
    const detached = game.territories?.snapshot();
    const fieldWorkers = Object.values(detached?.sectors || {}).filter(s => s.workerId !== null).length;
    const convoys = (detached?.trucks || []).filter(t => !t.dead).length;
    const escorts = citizen?.active || 0, roadWorkers = roads?.crew.length || 0;
    const salvagers=game.salvage?.snapshot().crews.length||0;
    const damage = finished.filter(b => b.health < b.maxHealth - .01).length;
    const gates = finished.filter(b => b.def.gate), open = gates.filter(b => b.gateMode === 'open').length;
    return { version: VERSION, phase: game.phase, wave: game.wave, seconds: Math.max(0, game.phaseTime),
      cards: [
        { id:'perimeter', title:enclosure.enclosed ? 'Centre ceinturé' : 'Un accès reste ouvert', tone:enclosure.enclosed ? 'good' : 'warn',
          detail: `${gates.length} porte(s), dont ${open} ouverte(s) à tous. ${damage} structure(s) achevée(s) endommagée(s). Une enceinte fermée reste vulnérable aux dégâts et aux amas de corps.`, action:'Inspecter les enceintes' },
        { id:'build', title:`${pending.length} chantier(s) à terminer`, tone:pending.length ? 'warn' : 'good',
          detail:'Les travaux financés restent à construire. Vérifiez leurs priorités et les chantiers suspendus avant de rappeler les équipes.', action:'Organiser les chantiers' },
        { id:'supply', title:`${Math.floor(food)} rations · ${population} personnes`, tone:food < population * 3 || !commonShotAvailable ? 'warn' : 'good',
          detail:`${Math.floor(ammo)} munitions communes ; consigne de réserve : ${citizen?.reserve || 0}. ${commonShotAvailable ? '' : 'Pas assez de munitions communes au-dessus de la consigne pour un tir. '}Ce bilan ne prévoit ni les futures dépenses ni les futures productions.`, action:'Consulter la logistique' },
        { id:'power', title:`${Math.floor(power)} / ${Math.ceil(demand)} énergie`, tone:power < demand ? 'warn' : 'good',
          detail:`${Math.floor(game.resources.fuel)} carburant en réserve. L'alimentation est répartie par priorité ; un bâtiment terminé peut manquer de courant.`, action:'Vérifier les équipements' },
        { id:'teams', title:`${escorts} escorte(s) · ${convoys} fourgon(s)`, tone:escorts || convoys || roadWorkers || fieldWorkers || salvagers ? 'warn' : 'good',
          detail:`${salvagers} récupérateur(s) ; ${roadWorkers} ouvrier(s) de voirie ; ${fieldWorkers} affectation(s) aux quartiers. Ce sont des affectations, pas un diagnostic de leur position ou de la sécurité de leur trajet.`, action:'Consulter les équipes' },
        { id:'fire', title: fires ? `${fires} foyer(s) actif(s)` : 'Aucun incendie actif', tone:fires ? 'danger' : 'good',
          detail: fires ? "Protégez les accès aux citernes et laissez une issue aux secours. L'extinction ne répare pas les bâtiments." : "Préparez l'accès aux citernes avant l'attaque. L'eau doit être transportée jusqu'aux foyers.", action:'Ouvrir les secours' }
      ] };
  }
  const api = Object.freeze({VERSION,searchable,matches,inspect,tactical});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DeadwallCoordination = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
