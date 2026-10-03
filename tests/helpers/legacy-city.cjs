'use strict';

// Prepared historical knowledge only. Current campaigns earn future ages
// through the 1.51 campaign requirements; this helper grants no material stock.
function legacyAge(g,score){
 const raw=g.serialize();
 raw.urban.peakScore=Math.max(score,raw.urban.peakScore);
 delete raw.urban.progression151;
 g.restoreSave(raw);
 g.refreshMetrics(true);
 return g.tier;
}

module.exports={legacyAge};
