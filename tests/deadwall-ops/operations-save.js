/* Appended to src/save.js after the original validator. */
(function installOperationsSave(root){
  'use strict';
  const C=root.DeadwallCore,O=root.DeadwallOperations,S=root.DeadwallSave;
  if(!C||!O||!S)throw new Error('Dépendances de sauvegarde des sorties absentes.');
  if(S.fieldOperationsVersion)return;
  const original=S.validate;
  function validate(input){
    // Do not let the old validator discard the extension's state.
    const fieldOps=O.normalize(input?.version===3?input.fieldOps:undefined);
    if(input?.version===3&&input.fieldOps===undefined)throw new Error('Sauvegarde v3 sans registre des sorties.');
    const base=original(input);
    return {...base,fieldOps};
  }
  function parse(text){
    if(typeof text!=='string'||text.length>S.MAX_FILE_BYTES||new TextEncoder().encode(text).byteLength>S.MAX_FILE_BYTES)throw new Error('Sauvegarde trop volumineuse (8 Mio maximum).');
    return validate(JSON.parse(text));
  }
  S.validate=validate;S.parse=parse;S.fieldOperationsVersion=O.RULES.version;
})(typeof globalThis!=='undefined'?globalThis:this);
