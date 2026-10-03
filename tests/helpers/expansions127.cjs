'use strict';
const {bootGame}=require('./browser.cjs');
function boot127(){
 const env=bootGame(),g=env.game;
 const proto=Object.getPrototypeOf(document.createElement('div'));
 if(!proto.append)proto.append=function(...nodes){nodes.forEach(n=>this.appendChild(n));};
 if(!proto.insertBefore)proto.insertBefore=function(n,s){const i=this.children.indexOf(s);this.children.splice(i<0?this.children.length:i,0,n);n.parentNode=this;};
 require('../../src/night-gear.js').install(g);
 require('../../src/exploration-125.js').install(g,document);
 require('../../src/actor-presentation.js').install(g);
 require('../../src/operations-art.js').install(g);
 for(const name of ['expansion-kit','exploration-pack','survival-pack','fortification-pack','companions-pack','campaign-pack'])require('../../src/'+name+'.js').install(g);
 return env;
}
module.exports={boot127};
