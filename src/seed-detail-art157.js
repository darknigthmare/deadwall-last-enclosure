/* Deterministic regional prop visuals, metres rather than pixels. */
(function(root,factory){'use strict';const api=factory();root.DeadwallSeedDetailArt157=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const colors={pool:'#307a93',fence:'#727664',hedge:'#55744a',tree:'#54754c',flowerbed:'#68834c',planter:'#65764f',cropbed:'#6a6249',bench:'#9b8867',shed:'#7e7966',compost:'#565946',patio:'#9e9785',barbecue:'#4b514a',clothesline:'#aba993',playset:'#8d875e',waterButt:'#5c8690',trash:'#686d61',bikeRack:'#969f94',laundryLine:'#a7a390',pallet:'#a18a69',lamp:'#d8c99d',barrel:'#76796b',crateStack:'#91836b',sign:'#bca884',cart:'#777c71',canopy:'#898d76',container:'#848a7c',tire:'#424740',worktable:'#7c7b64',scrapHeap:'#5f665d',bollard:'#b4ab8d',rug:'#9b8470',chair:'#937f69',paper:'#d3c9b0',tv:'#455450',smallCabinet:'#8a8171',toy:'#b7a37b',laundryBasket:'#ac987c',display:'#a9a48b',basket:'#a7906e',countertop:'#c2b9a1',fallenStock:'#827459',shelfEnd:'#85836b',menu:'#d2c49f',tray:'#b4b6a7',screen:'#acc5b9',notice:'#d3ccb1',toolbox:'#616c66',palletMark:'#aba385'};
const fill=(c,x,y,w,h,s)=>{c.fillStyle=s;c.fillRect(x,y,w,h);};
const box=(c,x,y,w,h,s,width=.06)=>{c.strokeStyle=s;c.lineWidth=width;c.strokeRect(x,y,w,h);};
const dot=(c,x,y,rx,ry,s)=>{c.fillStyle=s;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function draw(c,o){if(!c||!o)return false;const{x,y,w,h,kind}=o;c.save();
if(!o.surface)fill(c,x+.08,y+.1,w,h,'rgba(16,32,23,.22)');
switch(kind){
case 'pool':fill(c,x,y,w,h,'#cabf9d');fill(c,x+.2,y+.2,w-.4,h-.4,'#5c9cab');fill(c,x+.38,y+.38,w-.76,h-.76,'#317d93');box(c,x+.13,y+.13,w-.26,h-.26,'#e6d6b3',.1);for(let i=0;i<4;i++){c.strokeStyle='rgba(221,235,228,.34)';c.lineWidth=.04;c.beginPath();const q=y+.65+i*.52;c.moveTo(x+.7,q);c.quadraticCurveTo(x+w/2,q-.17,x+w-.7,q);c.stroke();}break;
case 'fence':case 'hedge':fill(c,x,y,w,h,colors[kind]||'#62705a');for(let j=0;j<Math.floor(Math.max(w,h)/.56);j++){const vertical=h>w;fill(c,vertical?x:y+j*.56,vertical?y+j*.56:y,vertical?w:.1,vertical?.1:h,kind==='fence'?'#9d9b80':'#6d8b57');}break;
case 'tree':dot(c,x+w/2+.12,y+h/2+.2,w*.48,h*.42,'rgba(23,41,27,.24)');fill(c,x+w*.43,y+h*.42,w*.14,h*.25,'#715d45');for(let j=0;j<5;j++)dot(c,x+w*(.26+(j%3)*.23),y+h*(.29+Math.floor(j/3)*.26),w*.23,h*.25,['#496d48','#63814e','#567850'][j%3]);break;
case 'cropbed':case 'flowerbed':case 'planter':fill(c,x,y,w,h,'#66553e');box(c,x,y,w,h,'#aa9972',.1);for(let i=0;i<Math.floor(w/.4);i++)for(let j=0;j<Math.floor(h/.45);j++)dot(c,x+.23+i*.4,y+.23+j*.45,.12,.12,(i+j)%2?'#638348':'#8b9959');break;
case 'shed':case 'container':fill(c,x,y,w,h,colors[kind]);box(c,x,y,w,h,'#c0b99e',.09);for(let i=0;i<w/.5;i++)fill(c,x+.14+i*.5,y+.12,.06,h-.24,'rgba(28,47,37,.21)');fill(c,x+w*.62,y+h*.24,w*.25,h*.63,'#51584d');break;
case 'playset':box(c,x+.22,y+.22,w-.44,h-.44,'#ad956f',.18);fill(c,x+.7,y+h-.65,.7,.25,'#7d9673');break;
case 'poolside':case 'patio':case 'rug':case 'palletMark':fill(c,x,y,w,h,colors[kind]||'#9e9785');box(c,x+.05,y+.05,w-.1,h-.1,'#bfb5a0',.05);for(let i=1;i<w/.8;i++)fill(c,x+i*.8,y,.035,h,'rgba(39,52,40,.14)');break;
case 'bench':case 'chair':case 'worktable':case 'smallCabinet':case 'shelfEnd':case 'display':fill(c,x,y,w,h,colors[kind]);box(c,x+.06,y+.06,w-.12,h-.12,'#c2b699',.065);for(let i=0;i<w/.45;i++)fill(c,x+.15+i*.45,y+.12,.08,h-.24,'rgba(40,53,41,.2)');break;
case 'trash':case 'waterButt':case 'barrel':case 'basket':case 'laundryBasket':case 'compost':case 'tire':dot(c,x+w/2,y+h/2,w*.48,h*.48,colors[kind]);dot(c,x+w/2,y+h/2,w*.31,h*.31,kind==='waterButt'?'#448a9a':'#506058');break;
case 'pallet':case 'crateStack':case 'fallenStock':case 'scrapHeap':fill(c,x,y,w,h,colors[kind]);for(let i=0;i<3;i++)fill(c,x+.13,y+.15+i*h/3,w-.26,.07,'rgba(220,209,174,.52)');break;
case 'lamp':dot(c,x+w/2,y+h/2,w*.47,h*.47,'#e2d5a8');break;
case 'bikeRack':for(let i=0;i<4;i++)box(c,x+.15+i*.46,y+.05,.3,h-.1,'#b8bba7',.07);break;
case 'clothesline':case 'laundryLine':fill(c,x,y,w,h,'#a9a58a');for(let i=0;i<5;i++)fill(c,x+.1+i*w/5,y+.06,w/10,h*.63,['#d1c7aa','#99ada5','#8f9f82'][i%3]);break;
case 'paper':case 'notice':case 'menu':case 'tray':case 'countertop':case 'screen':case 'toy':fill(c,x,y,w,h,colors[kind]);for(let i=0;i<3;i++)fill(c,x+.07,y+.06+i*.075,w-.14,.02,'rgba(70,65,50,.28)');break;
default:fill(c,x,y,w,h,colors[kind]||'#89836f');box(c,x+.04,y+.04,w-.08,h-.08,'rgba(206,205,171,.67)',.05);
}
c.restore();return true;}
return Object.freeze({draw});
});