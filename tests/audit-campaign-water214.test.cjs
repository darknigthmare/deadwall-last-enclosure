'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Audit = require('../scripts/audit-campaign-water214.cjs');
const Services = require('../scripts/audit-campaign-services208.cjs');
const Supports = require('../src/campaign-water-supports214.js');
const P = require('../src/codex-physical2026.js');

test('214 audit facade ignores the actual addressed outdoor solid, retaining all other geometry', () => {
  const model = Services.makeModel('EXT-MONDE-T045', 1);
  const world = Audit.modelWorld(model), oldFurnitureFacade = Services.modelWorld(model);
  const descriptors = Supports.supportsFor(model.p, model.plan, model.details);
  assert.ok(descriptors.length > 0);
  const result = Audit.inspectSupport(world, model.p, model.details, descriptors[0]);
  assert.equal(result.accessible, true, result.reason);
  assert.equal(world.movementLine(result.anchor, result.workTarget, 0, null, result.supportId, P.DEFAULT_RADIUS), true);
  assert.equal(world.movementLine(result.anchor, result.workTarget, 0, null, null, P.DEFAULT_RADIUS), false,
    'The barrel remains a real obstacle when its exact ID is not explicitly ignored for the gesture.');
  assert.equal(oldFurnitureFacade.movementLine(result.anchor, result.workTarget, 0, null, result.supportId, P.DEFAULT_RADIUS), false,
    'The historical furniture-only facade does not know the structural ID mapping.');
});

test('214 audit rejects a fabricated service face even when its values are finite', () => {
  const model = Services.makeModel('EXT-MONDE-T045', 1), world = Audit.modelWorld(model);
  const descriptor = JSON.parse(JSON.stringify(Supports.supportsFor(model.p, model.plan, model.details)[0]));
  descriptor.approaches[0].workTarget.x += 1;
  const result = Audit.inspectSupport(world, model.p, model.details, descriptor);
  assert.equal(result.accessible, false);
  assert.equal(result.reason, 'canonical-approaches-or-geometry-invalid');
});

test('214 isolated witnesses retain the published geometry and count physical barrels separately from transfers', () => {
  for (const [type, number] of [['EXT-MONDE-T045', 1], ['EXT-MONDE-T048', 50]]) {
    const result = Audit.auditModel214(type, number);
    assert.equal(result.pass, true, JSON.stringify(result.refusals));
    assert.equal(result.geometryUnchanged, true);
    assert.equal(result.readsPure, true);
    assert.equal(result.supportInventoryComplete, true);
    assert.equal(result.supportsOffered, result.barrelsPresent);
    assert.equal(result.supportsAccessible, result.barrelsPresent);
    assert.equal(result.modelScope, 'isolated-authored-model-geometry-not-a-seeded-instance');
    assert.equal(Object.hasOwn(result, 'transactions'), false);
  }
});
