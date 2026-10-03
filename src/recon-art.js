/* Eighteen separate, deterministic field props. No atlas replacement and no collision added. */
(function(root){
 'use strict';
 const STYLE={
  'housing-1':'garden','housing-2':'timber','housing-3':'roof',
  'market-1':'drawers','market-2':'shutter','market-3':'pantry',
  'aid-1':'stretcher','aid-2':'stove','aid-3':'blankets',
  'industry-1':'blueprints','industry-2':'sleepers','industry-3':'parts',
  'transit-1':'lockers','transit-2':'cart','transit-3':'ballast',
  'checkpoint-1':'ammo','checkpoint-2':'airlock','checkpoint-3':'barrier'
 };
 const fill=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 const line=(c,pts,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()};
 const disc=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()};
 function box(c,x,y,w,h,color){fill(c,x+2,y+3,w,h,'#131a17');fill(c,x,y,w,h,color);line(c,[[x,y+h],[x,y],[x+w,y]],'#a9a694',1);}
 function draw(c,s,{selected=false,label=false}={}){
  const kind=STYLE[s?.id];if(!kind||!Number.isFinite(s.x)||!Number.isFinite(s.y))return false;
  const spent=s.survey>=6&&s.remaining<=.001;
  c.save();c.translate(s.x,s.y);c.globalAlpha=spent?.45:1;
  c.fillStyle='rgba(13,20,15,.3)';c.beginPath();c.ellipse(1,7,23,13,0,0,Math.PI*2);c.fill();
  switch(kind){
   case 'garden':
    box(c,-20,-13,40,28,'#77614c');fill(c,-17,-10,34,21,'#433b2c');
    for(let i=0;i<3;i++){line(c,[[-14,-6+i*8],[14,-6+i*8]],'#241f18',2);if(!spent)for(let j=0;j<4;j++){const x=-12+j*8,y=-6+i*8;line(c,[[x-3,y-3],[x,y],[x+4,y-2]],'#7c925b',2)}}break;
   case 'timber':
    box(c,-19,-12,38,28,'#51574d');fill(c,-18,-15,36,7,'#766851');for(let i=0;i<(spent?2:5);i++){fill(c,-16,-5+i*4,32,3,i%2?'#b7a077':'#9b815e');line(c,[[-14,-4+i*4],[13,-4+i*4]],'#6a5238',.6)}break;
   case 'roof':
    for(let i=0;i<9;i++){const x=-18+(i%3)*12,y=-12+Math.floor(i/3)*9;box(c,x+(i%2)*3,y,12,8,i%2?'#8a6752':'#a08567')}line(c,[[-19,13],[18,-8]],'#4e463c',4);break;
   case 'drawers':
    box(c,-17,-17,34,33,'#686c61');for(let i=0;i<3;i++){box(c,-14,-13+i*10,28,8,spent?'#3a443a':'#a09e85');fill(c,-3,-10+i*10,6,1,'#292f28')}if(!spent){fill(c,7,-21,9,8,'#d2cfb4');line(c,[[11,-20],[11,-14]],'#6d846d',2);line(c,[[8,-17],[14,-17]],'#6d846d',2)}break;
   case 'shutter':
    box(c,-20,-13,40,26,'#565b55');for(let y=-11;y<12;y+=4)line(c,[[-17,y],[17,y]],'#9b9e8c',1.6);line(c,[[-19,15],[18,15]],'#3b413b',3);break;
   case 'pantry':
    box(c,-19,-14,38,28,'#73664e');fill(c,-16,-11,32,22,'#303b2f');if(!spent)for(let i=0;i<8;i++){const x=-12+i%4*8,y=-6+Math.floor(i/4)*11;box(c,x-3,y-3,6,8,i%3?'#aaa485':'#7b8c69');disc(c,x,y-3,3,'#babcaa')}break;
   case 'stretcher':
    line(c,[[-17,-18],[-17,19]],'#9eaa9c',2);line(c,[[17,-18],[17,19]],'#9eaa9c',2);box(c,-14,-13,28,27,'#7c8564');fill(c,-9,-10,18,6,'#c5c7ad');line(c,[[-14,8],[14,8]],'#464f39',2);break;
   case 'stove':
    box(c,-17,-6,21,22,'#676e64');disc(c,-7,-6,10,'#202924');disc(c,-7,-6,6,'#899286');box(c,8,-12,11,27,spent?'#4a5447':'#819071');line(c,[[13,-13],[13,-18],[9,-18]],'#c3c3aa',2);line(c,[[9,10],[4,6]],'#2e3931',2);break;
   case 'blankets':
    box(c,-19,-10,38,23,'#6d634a');for(let i=0;i<(spent?1:3);i++){box(c,-15,-14+i*8,30,7,['#96977a','#77836e','#b2aa87'][i]);disc(c,13,-10+i*8,3,'#4b5d47');line(c,[[-5,-14+i*8],[-5,-7+i*8]],'#c5bba0',1.2)}break;
   case 'blueprints':
    box(c,-20,-15,40,31,'#827256');fill(c,-15,-11,25,22,spent?'#8d978c':'#a9bfaf');for(let i=0;i<3;i++)line(c,[[-12,-7+i*6],[6,-7+i*6]],'#557975',1);line(c,[[13,-11],[13,11]],'#c9b380',3);break;
   case 'sleepers':
    for(let i=0;i<(spent?2:5);i++){box(c,-19,-14+i*6,38,5,i%2?'#82694f':'#a08a66');disc(c,-13,-12+i*6,1,'#424a40');disc(c,13,-12+i*6,1,'#424a40')}break;
   case 'parts':
    box(c,-20,-13,40,27,'#6e7d72');fill(c,-16,-9,32,19,'#2d3c32');if(!spent)for(let i=0;i<7;i++){const x=-12+i%4*8,y=-4+Math.floor(i/4)*9;disc(c,x,y,4,'#afb7a8');disc(c,x,y,2,'#2d3c32')}break;
   case 'lockers':
    box(c,-19,-17,38,34,'#7c8980');for(let i=0;i<3;i++){box(c,-17+i*12,-14,10,27,spent?'#354a40':'#8e9c90');fill(c,-10+i*12,-2,1,5,'#ded7b6');line(c,[[-15+i*12,-10],[-10+i*12,-10]],'#445e50',1)}break;
   case 'cart':
    box(c,-20,-12,37,28,'#817c5c');box(c,3,-17,15,20,'#a2a083');fill(c,5,-15,11,7,'#3c5655');for(const x of [-15,13])for(const y of [-15,15])box(c,x-4,y-2,8,5,'#222d28');if(!spent){box(c,-16,-8,8,15,'#89966c');box(c,-5,-8,8,15,'#a98c59')}break;
   case 'ballast':
    for(let i=0;i<(spent?2:6);i++){const x=-18+i%3*12,y=-9+Math.floor(i/3)*12;box(c,x,y,11,11,i%2?'#aaa692':'#8e9a8c');line(c,[[x+2,y+3],[x+9,y+3]],'#627668',1)}break;
   case 'ammo':
    box(c,-19,-12,38,28,'#576547');box(c,-19,-17,38,7,'#788262');if(!spent)for(let i=0;i<7;i++){fill(c,-14+i*4,-6,2,14,'#baa56d');fill(c,-14+i*4,-8,2,3,'#e2c68a')}line(c,[[-15,13],[15,13]],'#b6b392',1);break;
   case 'airlock':
    box(c,-19,-15,38,31,'#847559');fill(c,-15,-11,30,22,'#c0c5a8');c.strokeStyle='#476f69';c.lineWidth=1;c.strokeRect(-11,-8,22,16);fill(c,-4,-9,8,3,'#b4b89a');fill(c,-4,6,8,3,'#b4b89a');line(c,[[-10,-2],[10,-2]],'#557e72',1);break;
   case 'barrier':
    line(c,[[-18,12],[-12,-12]],'#676e5a',4);line(c,[[14,12],[18,-12]],'#676e5a',4);box(c,-21,-7,41,7,'#a99d6e');for(let x=-17;x<14;x+=10)fill(c,x,-6,5,5,'#565f4c');line(c,[[-16,10],[15,1]],'#90784e',3);break;
  }
  c.globalAlpha=1;
  if(selected){c.strokeStyle='#f4d994';c.lineWidth=1.5;c.setLineDash([4,3]);c.beginPath();c.arc(0,0,28,0,Math.PI*2);c.stroke();c.setLineDash([]);}
  else if(s.survey<6){disc(c,20,-19,5,'#d4bd80');fill(c,19,-22,2,5,'#3c4c3f');fill(c,19,-16,2,1,'#3c4c3f');}
  if(label){c.font='bold 10px sans-serif';c.textAlign='center';c.fillStyle='#ead7aa';c.fillText(spent?'ÉPUISÉ':s.survey<6?'RELEVÉ':'RÉCUPÉRATION',0,-33);}
  c.restore();return true;
 }
 const API=Object.freeze({STYLES:Object.freeze(STYLE),draw});root.DeadwallReconArt=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof globalThis!=='undefined'?globalThis:this);
