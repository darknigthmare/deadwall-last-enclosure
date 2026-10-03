'use strict';
const {fixture:base}=require('./navigation130.cjs');
function boot131({ui=false,seed='17117',generation=5}={}){
 const env=base({ui,seed}),g=env.game;
 require('../../src/world-spawns131.js');require('../../src/world-stream131.js');
 for(const name of ['defense-pack131','exploration-pack131','player-pack131','world-pack131','chronicles131','loadout129','departure130'])require('../../src/'+name+'.js').install(g);
 if(generation<6)require('./legacy-region135.cjs').selectLegacyStarts(g,generation);
 g.startNew('standard',seed);
 if(generation===6)require('./generation141.cjs').legacy(g,6);
 if(ui){for(const name of ['expansion-ui','loadout-ui129','chronicles131-ui'])require('../../src/'+name+'.js').install(g,document);}
 return{...env,g};
}
module.exports={boot131};
