/* Observe an actual trusted DOM action without replacing its controller. */
export function differencePaths(a,b,path=''){
 if(Object.is(a,b))return [];
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return [path||'/'];
 const keys=[...new Set([...Object.keys(a),...Object.keys(b)])].sort(),out=[];
 for(const k of keys){const p=path+'/'+k.replaceAll('~','~0').replaceAll('/','~1');
  if(!Object.hasOwn(a,k)||!Object.hasOwn(b,k))out.push(p);else out.push(...differencePaths(a[k],b[k],p));}
 return out;
}
export async function armTransaction(page,selector){
 await page.locator(selector).evaluate(button=>{
  const g=DEADWALL,original=g.restoreSave,clean=value=>{const s=JSON.parse(JSON.stringify(value));delete s.timestamp;return s;};
  const state={armed:clean(g.serialize()),started:null,beforeRestore:null,input:null,after:null,calls:0,trusted:false};
  const begin=event=>{state.trusted=event.isTrusted;state.started=clean(g.serialize());};
  button.addEventListener('click',begin,{capture:true,once:true});
  const wrapper=function(...args){state.calls++;state.beforeRestore=clean(g.serialize());state.input=clean(args[0]);
   const result=original.apply(this,args);state.ok=result===true;state.after=clean(g.serialize());return result;};
  g.restoreSave=wrapper;
  globalThis.__transaction167={state,cleanup(){if(g.restoreSave===wrapper)g.restoreSave=original;button.removeEventListener('click',begin,true);}};
 });
}
export async function readTransaction(page,revision){
 const data=await page.evaluate(()=>{
  const audit=globalThis.__transaction167;if(!audit)throw Error('Transaction probe absent');audit.cleanup();
  const stored=DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));delete stored.timestamp;
  const result={...audit.state,stored};delete globalThis.__transaction167;return result;
 });
 const {started,beforeRestore,input,after,stored}=data;
 if(!started||!after||!input)return {ok:false,calls:data.calls,trusted:data.trusted,reason:'actual-action-not-observed'};
 const currentRevision=after.frontier.detailVersion,savedRevision=stored.frontier.detailVersion;
 const normalize=s=>{const result=structuredClone(s);result.frontier.detailVersion=started.frontier.detailVersion;return result;};
 const beforeClickChanges=differencePaths(data.armed,started),preRestoreChanges=differencePaths(started,beforeRestore),submittedChanges=differencePaths(started,normalize(input)),restoredChanges=differencePaths(started,normalize(after)),storedChanges=differencePaths(started,normalize(stored));
 return {ok:data.ok&&data.calls===1&&data.trusted,revision:currentRevision,savedRevision,expectedRevision:revision,
  beforeClickChanges,preRestoreChanges,submittedChanges,restoredChanges,storedChanges,
  onlyRevision:currentRevision===revision&&preRestoreChanges.length===0&&submittedChanges.length===0&&restoredChanges.length===0,
  storedOnlyRevision:savedRevision===revision&&storedChanges.length===0};
}
