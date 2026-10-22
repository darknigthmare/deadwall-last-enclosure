/** Shared native preparation for the husbandry and product-transport scenarios.
 * Only controller time is stepped; the knife, payment and custody are never injected. */
export function preparePaidKnife191() {
  const g = globalThis.DEADWALL, C = globalThis.DeadwallCore;
  if (g.paused || g.activeOverlay) throw Error('Paid knife preparation requires an unpaused campaign outside menus');
  const before = g.arsenal134.snapshot(), resources = { ...g.resources }, rng = g.random.state;
  const quote = g.arsenal134.preview('craft', 'knife');
  if (!quote.ok) throw Error('Paid knife preparation refused: ' + quote.reason);
  const begun = g.arsenal134.begin('craft', 'knife');
  if (!begun.ok) throw Error('Paid knife construction refused: ' + begun.reason);
  let steps = 0;
  while (steps < Math.ceil(quote.seconds / .1) + 1 && g.arsenal134.busy()) { g.arsenal134.step(.1); steps++; }
  if (g.arsenal134.busy()) throw Error('Native knife construction did not finish');
  const previous = new Set([...before.carried, ...before.locker].map(item => item.uid));
  const added = g.arsenal134.snapshot().locker.filter(item => item.id === 'knife' && !previous.has(item.uid));
  if (added.length !== 1 || added[0].condition !== 100) throw Error('One freshly completed native knife is required');
  for (const key of C.RESOURCE_KEYS) {
    if (g.resources[key] !== resources[key] - (quote.cost[key] || 0)) throw Error('Native knife cost mismatch: ' + key);
  }
  const knife = added[0], transferred = g.arsenal134.transfer(knife.uid, 'carried');
  if (!transferred.ok) throw Error('Paid knife withdrawal refused: ' + transferred.reason);
  const equipped = g.arsenal134.equip(knife.uid);
  if (!equipped.ok) throw Error('Paid knife equipment refused: ' + equipped.reason);
  const after = g.arsenal134.snapshot(), held = after.carried.find(item => item.uid === knife.uid);
  if (after.equipped !== knife.uid || !held || held.condition <= 0 || after.locker.some(item => item.uid === knife.uid)) throw Error('Paid knife is not carried and equipped in usable condition');
  if (g.random.state !== rng) throw Error('Native knife preparation unexpectedly consumed campaign RNG');
  return { kind: 'native-paid-knife-preparation', item: held, cost: { ...quote.cost }, resourcesBefore: resources,
    resourcesAfter: { ...g.resources }, steps, dt: .1, rngPreserved: true,
    note: 'Existing depot materials pay the ordinary craft cost. Native controller work creates one knife in the locker; real transfer and equip owners place it in hand. No possession, condition, stock or random state is assigned. This preparation is not a claim of naturally elapsed campaign time or DOM interaction with the armory.' };
}
