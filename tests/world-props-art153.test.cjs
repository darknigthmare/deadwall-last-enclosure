'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),A=require('../src/world-props-art153.js');
const root=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(root,'assets/art153/PROPS_PROVENANCE.json'),'utf8'));
const artPromise=(async()=>{const art={images:{},blit(c,key,r,...d){c.drawImage(this.images[key],...r,...d);return true;}};for(const[key,s]of Object.entries(A.ASSETS))art.images[key]=await loadImage(path.join(root,s.url));return art;})();
const c=()=>createCanvas(280,280).getContext('2d');
test('153 props: seven unretouched native RGBA PNGs match all provenance SHA bytes and dimensions',async()=>{
 const art=await artPromise;assert.equal(meta.images.length,7);assert.equal(meta.spriteCount,112);assert.equal(meta.familyCount,55);assert.equal(meta.pixelEdits,false);assert.deepEqual(meta.measurementErrors,[]);
 for(const item of meta.images){const bytes=fs.readFileSync(path.join(root,item.runtime));assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert.equal(bytes.length,item.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);assert.deepEqual([art.images[item.id].width,art.images[item.id].height],item.dimensions);assert.equal(item.alpha_extrema[0],0);assert.equal(item.pixelEdits,false);}
});
test('153 props: 112 measured cuts contain complete significant alpha, empty edges and no neighbour fragments',async()=>{
 const art=await artPromise;
 for(const item of meta.images){const im=art.images[item.id],ctx=createCanvas(im.width,im.height).getContext('2d');ctx.drawImage(im,0,0);const p=ctx.getImageData(0,0,im.width,im.height).data,covered=new Uint8Array(im.width*im.height);
  for(const r of Object.values(item.sprites)){const[x,y,w,h]=r;assert.ok(x>=0&&y>=0&&x+w<=im.width&&y+h<=im.height);let solid=0;
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const at=yy*im.width+xx;if(p[at*4+3]>8){assert.equal(covered[at],0,item.id+' duplicate solid from neighbour');covered[at]=1;solid++;assert.ok(yy>y&&yy<y+h-1&&xx>x&&xx<x+w-1,'No cut clips a significant alpha edge.');}}
   assert.ok(solid>150,'Every cut contains a real silhouette.');
  }
  for(let at=0;at<covered.length;at++)if(p[at*4+3]>8)assert.equal(covered[at],1,item.id+' uncaptured object fragment');
 }
});
test('153 props: all family forms are distinct cuts and stable pure selectors reject inherited/unknown keys',()=>{
 const before=JSON.stringify(A.FAMILIES);for(const[family,forms]of Object.entries(A.FAMILIES)){assert.equal(forms.length,family==='scrap'?4:2);assert.equal(new Set(forms.map(f=>f.atlas+':'+f.rect.join(','))).size,forms.length);for(let n=0;n<40;n++){const x=A.select(family,'object:'+n,903145);assert.equal(A.select(family,'object:'+n,903145),x);assert.ok(forms.includes(x));}assert.equal(A.select(family,'x',0,-1),forms.at(-1));assert.ok(Object.isFrozen(forms));assert.ok(Object.isFrozen(forms[0].rect));}
 for(const family of['__proto__','constructor','unavailable'])assert.equal(A.select(family,'x',42),null);assert.equal(JSON.stringify(A.FAMILIES),before);
});
test('153 props: native sprites uniformly fit their owner rectangle and restore alpha/filter/transform for four rotations',async()=>{
 const art=await artPromise,ctx=c();ctx.translate(7,9);ctx.scale(.8,.8);ctx.globalAlpha=.45;ctx.filter='contrast(1.2)';const matrix=ctx.getTransform().toJSON(),alpha=ctx.globalAlpha,filter=ctx.filter;
 for(const[family,forms]of Object.entries(A.FAMILIES))for(let variant=0;variant<forms.length;variant++)for(let r=0;r<4;r++){const m=A.measure(family,'test',140,140,73,51,{variant});const[x,y,w,h]=m.destination;assert.ok(x>=140-73/2-1e-9&&x+w<=140+73/2+1e-9);assert.ok(y>=140-51/2-1e-9&&y+h<=140+51/2+1e-9);assert.ok(Math.abs(w/h-m.source[2]/m.source[3])<1e-9);assert.equal(A.drawSprite(ctx,art,family,'test',140,140,73,51,{variant,alpha:.7,angle:r*Math.PI/2}),true);assert.deepEqual(ctx.getTransform().toJSON(),matrix);assert.equal(ctx.globalAlpha,alpha);assert.equal(ctx.filter,filter);}
 for(const bad of[{pivot:null},{pivot:[2,.5]},{pivot:[.5]},{pivot:[NaN,.5]}])assert.equal(A.measure('tent','id',0,0,32,32,bad),null);
 assert.equal(A.drawSprite(ctx,{images:{}},'tent','id',0,0,32,32),false);assert.equal(A.drawSprite(ctx,art,'tent','id',0,0,-1,32),false);
});
test('153 props: each of 112 original forms renders visible native pixels without a blank placeholder',async()=>{
 const art=await artPromise;for(const[family,forms]of Object.entries(A.FAMILIES))for(let variant=0;variant<forms.length;variant++){const ctx=c();assert.equal(A.drawSprite(ctx,art,family,'gallery',140,140,120,100,{variant}),true);const p=ctx.getImageData(0,0,280,280).data;let alpha=0;for(let i=3;i<p.length;i+=4)if(p[i]>8)alpha++;assert.ok(alpha>100,family+':'+variant);}
});
test('153 props: inactive lights never draw emissions, active state is explicit and fixtures/restorable device data stay unchanged',async()=>{
 const art=await artPromise,ctx=c(),emissions=[];const old=ctx.fill.bind(ctx);ctx.fill=()=>{emissions.push(ctx.fillStyle);old();};
 for(const kind of A.LIGHTS){const options={identity:'gear1',seed:42,on:false,time:2};const before=JSON.stringify(options);let n=emissions.length;assert.equal(A.drawLight(ctx,art,kind,140,140,40,options),true);assert.equal(emissions.length,n,kind+' off produces no emission');assert.equal(JSON.stringify(options),before);assert.equal(A.drawLight(ctx,art,kind,140,140,40,{...options,on:true}),true);assert.ok(emissions.length>n);n=emissions.length;A.drawLight(ctx,art,kind,140,140,40,{...options,on:'true'});assert.equal(emissions.length,n);}
 assert.equal(A.drawLight(ctx,art,'unknown',140,140,40,{on:true}),false);
});
test('153 props: node painters use current owner resource ratio and supplied collider without rewriting IDs, amounts, seed or reserves',async()=>{
 const art=await artPromise,ctx=c(),calls=[],draw=art.blit.bind(art);const recorder={...art,blit(c,key,r,...d){calls.push({key,r,d,alpha:c.globalAlpha});return draw(c,key,r,...d);}};
 for(const family of A.SCENERY){const node={id:123,x:140,y:140,radius:20,renderSize:98,sceneryKind:family,amount:25,maxAmount:50,flash:0};const rect={l:116,t:124,r:164,b:156},before=JSON.stringify(node);assert.equal(A.drawSceneryNode(ctx,recorder,node,{seed:42,rect}),true);const q=calls.at(-1);assert.ok(Math.abs(q.alpha-.5)<=1/255,'Native Canvas alpha is quantized to eight bits.');assert.ok(q.d[0]>=rect.l&&q.d[0]+q.d[2]<=rect.r);assert.ok(q.d[1]>=rect.t&&q.d[1]+q.d[3]<=rect.b);assert.equal(JSON.stringify(node),before);node.amount=50;A.drawSceneryNode(ctx,recorder,node,{rect});assert.equal(calls.at(-1).alpha,1);}
 for(const node of[{type:'wood',variant:2},{type:'stone'},{type:'scrap',variant:2},{type:'scrap',variant:3},{type:'fuel',variant:1}])assert.equal(A.resourceFamily(node),null);
 assert.equal(A.resourceFamily({type:'food',variant:3}),'supplies');assert.equal(A.resourceFamily({type:'food',variant:1}),'crops');assert.equal(A.resourceFamily({type:'scrap',variant:1}),'sedan');
});
test('153 props: technical kits, paid operations and local props retain fallback and immutable owner data',async()=>{
 const art=await artPromise,ctx=c();for(const kind of['light','aid','brace','decoy'])assert.equal(A.drawEssential(ctx,art,kind,140,140,55,{identity:'target',seed:42}),true);
 for(const type of Object.keys(A.OPERATIONS))assert.equal(A.drawOperation(ctx,art,type,140,140,90,{identity:'paid:'+type,seed:42}),true);
 for(const kind of['cone','roadSign','barrier','bollard','tirePile','luggage','shoppingCart','pallet','toolbox','crate','tarp']){const p={id:'road:'+kind,kind,x:140,y:140,size:30,angle:.6},before=JSON.stringify(p);assert.equal(A.drawRoadProp(ctx,art,p,{seed:42}),true);assert.equal(JSON.stringify(p),before);}
 for(const kind of['shed','barrel','mailbox']){const p={kind,x:140,y:140,size:30},before=JSON.stringify(p);assert.equal(A.drawYardProp(ctx,art,p),true);assert.equal(JSON.stringify(p),before);}
 for(const kind of['drain','manhole','marker','crack','litter'])assert.equal(A.drawTerrainDecor(ctx,art,{kind,x:140,y:140,angle:.8}),true);
 assert.equal(A.drawEssential(ctx,{images:{}},'light',140,140,50),false);assert.equal(A.drawOperation(ctx,art,'unknown',140,140,50),false);assert.equal(A.drawRoadProp(ctx,art,{kind:'debris',x:140,y:140}),false);assert.equal(A.drawYardProp(ctx,art,{kind:'woodpile',x:140,y:140}),false);
 assert.equal(A.drawOperation(ctx,art,'casualty',140,140,50),false,'Belongings never substitute a living casualty.');
});
test('153 props: road silhouettes preserve actual per-family bounds and headings rather than culling sizes',async()=>{
 const art=await artPromise,ctx=c(),draws=[],rotations=[],blit=art.blit.bind(art),rotate=ctx.rotate.bind(ctx);
 const recorder={...art,blit(c,key,r,...d){draws.push({key,r,d});return blit(c,key,r,...d);}};ctx.rotate=a=>{rotations.push(a);rotate(a);};
 for(const[kind,[w,h]]of Object.entries(A.ROAD_BOUNDS))for(let turn=0;turn<4;turn++){const prop={kind,id:'owner:'+kind,x:140,y:140,size:150,angle:turn*Math.PI/2},before=JSON.stringify(prop),matrix=ctx.getTransform().toJSON();assert.equal(A.drawRoadProp(ctx,recorder,prop),true);const[x,y,dw,dh]=draws.at(-1).d;
  const origin=turn?0:140;assert.ok(x>=origin-w/2-1e-9&&x+dw<=origin+w/2+1e-9);assert.ok(y>=origin-h/2-1e-9&&y+dh<=origin+h/2+1e-9);assert.equal(JSON.stringify(prop),before);assert.deepEqual(ctx.getTransform().toJSON(),matrix);if(turn)assert.equal(rotations.at(-1),prop.angle);
 }
});
