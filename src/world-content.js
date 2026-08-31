(function initWorldContent(root, factory) {
  const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.DeadwallCore);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DeadwallWorldContent=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C) {
  'use strict';

  const THEMES = [
    {name:'Les Maisons sans voix',theme:'housing',required:['ruinedHouse','burntTree','streetLamp'],pool:['ruinedHouse','burntTree','rubble','waterTank','tent']},
    {name:'Les Arcades muettes',theme:'market',required:['ruinedShop','warehouseShell','container'],pool:['ruinedShop','container','utilityTruck','rubble','streetLamp']},
    {name:'Le Camp des veilleurs',theme:'aid',required:['ambulance','tent','guardBooth'],pool:['tent','guardBooth','waterTank','concreteBarricade','bus']},
    {name:'La Cour des citernes',theme:'industry',required:['tanker','powerPylon','waterTank'],pool:['warehouseShell','container','powerPylon','utilityTruck','rubble']},
    {name:'Le Terminus des cendres',theme:'transit',required:['bus','utilityTruck'],pool:['bus','utilityTruck','guardBooth','streetLamp','burntTree','rubble']},
    {name:'Le Passage du dernier feu',theme:'checkpoint',required:['concreteBarricade','rubble'],pool:['concreteBarricade','guardBooth','burntTree','tent','ruinedHouse','streetLamp']}
  ];
  const round = number => Math.round(number*100)/100;

  function generate(seed) {
    if(typeof seed!=='number'||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('Graine de quartier invalide.');
    if(!C?.SCENERY_DEFS||!C.Random)throw new Error('Catalogue de décors DEADWALL absent.');
    // This generator never consumes the base-map or simulation RNG streams.
    const random=new C.Random((seed^0xd17c0de5)>>>0),center=C.WORLD_SIZE/2;
    const orientation=random.range(0,Math.PI*2),districts=random.shuffle(THEMES.slice());
    const sites=[],props=[];
    districts.forEach((district,index)=>{
      // One site per radial sector: even opposite jitters leave > 450 units between sites.
      const angle=orientation+index*Math.PI/3+random.range(-.11,.11),distance=random.range(1000,1600);
      const site={id:'site-'+(index+1),name:district.name,theme:district.theme,x:round(center+Math.cos(angle)*distance),y:round(center+Math.sin(angle)*distance)};
      sites.push(site);
      const kinds=district.required.slice();
      while(kinds.length<8)kinds.push(random.pick(district.pool));
      random.shuffle(kinds);
      const rotation=random.range(0,Math.PI*2);
      kinds.forEach((sceneryKind,slot)=>{
        const def=C.SCENERY_DEFS[sceneryKind],a=rotation+slot*Math.PI/4,radius=random.range(110,145);
        props.push({sceneryKind,siteId:site.id,x:round(site.x+Math.cos(a)*radius),y:round(site.y+Math.sin(a)*radius),type:def.resource,amount:def.amount,radius:def.radius,renderSize:def.renderSize});
      });
    });
    return {sites,props};
  }

  return Object.freeze({generate});
});
