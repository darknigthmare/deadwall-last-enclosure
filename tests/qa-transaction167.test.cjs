'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('167 transaction differences compare every value, array order and missing key without depending on object key order',async()=>{
 const {differencePaths:d}=await import('../scripts/qa-transaction167.mjs');
 assert.deepEqual(d({a:1,b:2},{b:2,a:1}),[]);
 assert.deepEqual(d({inventory:[1,2]},{inventory:[2,1]}),['/inventory/0','/inventory/1']);
 assert.deepEqual(d({x:1},{x:'1'}),['/x']);assert.deepEqual(d({x:null},{}),['/x']);
 assert.deepEqual(d({'a/b':1},{'a/b':2}),['/a~1b']);
 assert.deepEqual(d({timestamp:1},{timestamp:2}),['/timestamp'],'metadata is excluded only by the explicit serializer boundary');
});
