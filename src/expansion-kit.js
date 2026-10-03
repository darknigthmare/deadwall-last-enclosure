/* Shared extension lifecycle: validate every module before replacing a campaign. */
(function(root){
'use strict';
const copy=value=>JSON.parse(JSON.stringify(value));
const known=new Map();
function normalize(raw,full,validators=known){
 const invalid=()=>{throw Error('Registre des opérations 1.27 invalide.');};
 if(raw!==undefined&&(!raw||Array.isArray(raw)||raw.version!==1||!raw.modules||Array.isArray(raw.modules)||typeof raw.modules!=='object'))invalid();
 if(raw&&Object.keys(raw).some(k=>!['version','modules'].includes(k)))invalid();
 for(const key of Object.keys(raw?.modules||{}))if(!validators.has(key))invalid();
 const modules={};
 for(const [id,validate]of validators)modules[id]=validate(raw?.modules?.[id],full);
 const a=modules.campaign?.active;
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),cargo=C?.CampaignPackRules?.definitions[a?.kind]?.cargo;
 const campaignLoad=!!a&&((cargo==='outbound'||a.kind==='aid')&&a.stage==='field'||(cargo==='inbound'||['salvage','evacuation'].includes(a.kind))&&a.stage==='return');
 const loads=Number(campaignLoad)+Number(!!modules.exploration?.cargo?.some(c=>c.stage==='held'))+Number(Object.values(full?.essentials?.jobs||{}).some(j=>j.stage==='player'));
 if(loads>1)throw Error('Un seul chargement peut être porté par le commandant.');
 return{version:1,modules};
}
function install(g){
 if(g.expansions)return g.expansions;
 const registry=new Map(),S=root.DeadwallSave;
 const ownValidators=()=>new Map([...registry].map(([id,d])=>[id,d.validate]));
 const canAct=()=>g.state==='playing'&&!g.gameOver&&!!g.player&&!g.player.dead&&g.player.health>0&&g.canIssueCommand()&&(!g.activeOverlay||g.activeOverlay===g.ui.commandModal);
 function register(d){
  if(!d||!['exploration','survival','fortification','companions','campaign','defense131','exploration131','player131','world131','lore131','arsenal134','interventions134','barricades134'].includes(d.id)||registry.has(d.id)||typeof d.title!=='string'||['overview','actions','validate','snapshot','restore','reset'].some(k=>typeof d[k]!=='function'))throw Error('Module d’opérations invalide ou dupliqué.');
  d.validate(undefined);registry.set(d.id,Object.freeze({...d}));known.set(d.id,d.validate);return true;
 }
 function snapshot(){const modules={};for(const [id,d]of registry)modules[id]=copy(d.snapshot());return{version:1,modules};}
 function busy(except){
  return [...registry].some(([id,d])=>id!==except&&Boolean(d.busy?.()||(g[id+'Pack']||g[id==='fortification'?'defensePack':'_'])?.busy?.()))||['essentials','fieldSupplies','nightGear'].some(id=>id!==except&&Boolean(g[id]?.busy?.()));
 }
 const api=Object.freeze({register,entries:()=>[...registry.values()],get:id=>registry.get(id),canAct,busy,snapshot});g.expansions=api;
 if(S&&!S.__expansionKit127){
  const old=S.validate.bind(S);S.validate=raw=>{const data=old(raw);data.expansions127=normalize(raw?.expansions127,data);return data;};
  S.__expansionKit127=true;
 }
 const serialize=g.serialize.bind(g);g.serialize=(...a)=>({...serialize(...a),expansions127:snapshot()});
 const restore=g.restoreSave.bind(g);g.restoreSave=raw=>{
  // No module restore/reset and no world mutation happens until all validators pass.
  const data=S.validate(raw),next=normalize(raw?.expansions127,data,ownValidators());
  const result=restore(data);if(result===false)return false;for(const [id,d]of registry)d.restore(copy(next.modules[id]));
  g.expansionUI?.refresh?.(true);return result;
 };
 const start=g.startNew.bind(g);g.startNew=(...a)=>{
  // Preserve the active run if the seed or scenario is rejected by the base UI.
  try{root.DeadwallProfile?.normalizeSeed(a[1]??'');}catch(error){const input=root.document?.getElementById('mapSeed');input?.setCustomValidity?.(error.message);input?.reportValidity?.();return false;}
  try{root.DeadwallScenarios?.initialState(a[2]??'classic',typeof a[0]==='string'&&Object.hasOwn(root.DeadwallCore.DIFFICULTIES,a[0])?a[0]:'standard');}catch(error){g.notify?.(error.message,'danger');return false;}
  for(const d of registry.values())d.reset();return start(...a);
 };
 return api;
}
const api={install,normalize};root.DeadwallExpansionKit=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
