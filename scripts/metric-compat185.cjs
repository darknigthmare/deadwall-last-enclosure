'use strict';
// Comparison adapter for the documented, non-colliding dressing added after
// 5b8f0ad. Raw fingerprints remain in the receipt; current-base equality is
// checked separately. No geometric or finite-resource field is normalized.
const assert = require('node:assert/strict');
const visualKeys = new Set(['id','kind','style','label','x','y','w','h','z','solid','surface','decor157','dressing160','supportId','plane','variant','room','supportBounds']);
const summaryKeys = ['collisionAdded','interior','lootAdded','outdoor','wallMounted'];
const closedText = 'Le parcours visitable reste au sol. Les parties hautes ou basses de la référence auteur sont fermées et ne donnent aucun passage supplémentaire.';
function historicalPOI(poi) {
  const impl = poi.context160?.implementation160;
  if (!impl || !Object.hasOwn(impl,'text') && !Object.hasOwn(impl,'closedDomain')) return poi;
  const notes={
    'single-ground-plane-visitable-route':[closedText,'unavailable-upper-or-lower-reference-route'],
    'covered-station-on-authored-floor-zero':['La station abandonnée se visite sur son niveau auteur 0, sous couverture. Les sous-passages de la référence complète restent fermés.','unavailable-subpassage-reference-route']
  };
  const note=notes[impl.scope];
  if(!note||impl.text!==note[0]||impl.closedDomain!==note[1])return poi;
  const {text,closedDomain,...historical} = impl;
  assert.deepEqual(Object.keys(historical).sort(),['closedDomains','fullyImplementedReference','scope'],'Unknown implementation metadata');
  // Preserve the original serialization order too; the old probe hashes raw JSON.
  const originalOrder={fullyImplementedReference:historical.fullyImplementedReference,scope:historical.scope,closedDomains:historical.closedDomains};
  return {...poi,context160:{...poi.context160,implementation160:originalOrder}};
}
function historicalDetail(detail) {
  if (!detail || !Object.hasOwn(detail,'dressing160')) return detail;
  const summary=detail.dressing160;
  assert.deepEqual(Object.keys(summary).sort(),summaryKeys,'Unknown dressing summary');
  assert.equal(summary.collisionAdded,0,'Dressing introduced collisions');
  assert.equal(summary.lootAdded,0,'Dressing introduced resources');
  const copy={...detail};let wallMounted=0;
  for (const domain of ['interior','outdoor']) {
    const rows=detail[domain];assert.ok(Array.isArray(rows),'Missing detail array');
    const added=rows.filter(row=>row.dressing160===true);
    assert.equal(added.length,summary[domain],'Dressing count mismatch');
    for (const row of added) {
      assert.ok(Object.keys(row).every(key=>visualKeys.has(key)),'Unreviewed dressing field');
      assert.equal(row.kind,'dressing160');assert.equal(row.solid,false);assert.equal(row.surface,false);assert.equal(row.decor157,true);
      assert.ok(['wall','furniture','yard'].includes(row.plane),'Unreviewed dressing support');
      assert.ok(['x','y','w','h','z'].every(key=>Number.isFinite(row[key]))&&row.w>0&&row.h>0,'Invalid dressing geometry');
      assert.deepEqual(Object.keys(row.supportBounds).sort(),['h','w','x','y'],'Unreviewed support metadata');
      if (row.plane==='wall') wallMounted++;
    }
    copy[domain]=rows.filter(row=>row.dressing160!==true);
  }
  assert.equal(summary.wallMounted,wallMounted,'Wall dressing count mismatch');
  if (Object.hasOwn(copy,'colliders160')) {
    const derived={interior:copy.interior.filter(row=>row.solid),outdoor:copy.outdoor.filter(row=>row.solid)};
    assert.deepEqual(copy.colliders160,derived,'Collider cache must exactly duplicate the retained solid objects');
    delete copy.colliders160;
  }
  delete copy.dressing160;
  return copy;
}
module.exports={historicalPOI,historicalDetail};
