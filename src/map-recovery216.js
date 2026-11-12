// Carte impraticable (docs/GAME_BIBLE.md §11.2) : sur de rares graines, le décor métrique ne trouve
// aucune parcelle libre et la création de campagne s'interrompait à mi-chemin. Ce module, chargé en
// dernier, reprend alors la création avec une autre carte et le dit au joueur. Il ne modifie la
// génération d'aucune carte : une graine qui fonctionne donne exactement le même monde qu'avant.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallMapRecovery216=api;
 // Installé dès le chargement quand le jeu existe déjà, sinon à la fin du chargement du document.
 if(root.document){
  if(root.DEADWALL)api.install(root.DEADWALL);
  else root.document.addEventListener('DOMContentLoaded',()=>{if(root.DEADWALL)api.install(root.DEADWALL);},{once:true});
 }
})(globalThis,function(){
 'use strict';
 const MAX_REDRAWS=8,UNFIT=/^Décor métrique sans parcelle libre/;
 const unfit=error=>error instanceof Error&&UNFIT.test(error.message);
 function install(g){
  if(!g||typeof g.startNew!=='function'||typeof g.freshMapSeed!=='function'||g.mapRecovery216)return false;
  const start=g.startNew;let last=null;
  g.startNew=function startNew216(...args){
   let current=args,first=null;
   for(let redraw=0;;redraw++){
    try{
     const result=start.apply(this,current);
     if(first!==null&&result!==false){
      last=Object.freeze({refused:first,seed:this.world?.seed??null,redraws:redraw});
      this.notify?.('La carte '+first+' ne pouvait pas accueillir D-17 : une autre carte a été tirée ('+last.seed+').','normal');
     }else if(first===null)last=null;
     return result;
    }catch(error){
     // Une recette de carte rejouée fixe sa graine : on ne la remplace pas en silence.
     if(!unfit(error)||current[5]!==undefined||redraw>=MAX_REDRAWS)throw error;
     if(first===null)first=this.world?.seed??String(current[1]??'');
     current=[...current];while(current.length<2)current.push(undefined);
     if(current[0]===undefined)current[0]='standard';
     current[1]=String(this.freshMapSeed());
    }
   }
  };
  g.mapRecovery216=Object.freeze({last:()=>last,maxRedraws:MAX_REDRAWS});
  return true;
 }
 return Object.freeze({install,unfit,MAX_REDRAWS});
});
