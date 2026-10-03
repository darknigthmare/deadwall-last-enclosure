(function initDeadwallOptions() {
  'use strict';
  const game=globalThis.DEADWALL, Save=globalThis.DeadwallSave, C=globalThis.DeadwallCore;
  if(!game||!Save)return;
  const get=id=>document.getElementById(id), modal=get('settingsModal');if(!modal)return;
  let previousPause=null, pendingImport=null, importRevision=0, exportedCampaign=null, pendingUnstoredImport=null, importSummary='';
  const importConfirmLabel=get('settingsImportConfirm').textContent;
  const status=text=>{get('settingsStatus').textContent=text;};
  function clearImport(forgetExport=false){importRevision++;pendingImport=null;pendingUnstoredImport=null;importSummary='';if(forgetExport)exportedCampaign=null;get('settingsImportFile').value='';get('settingsImportReview').classList.add('hidden');get('settingsImportConfirm').textContent=importConfirmLabel;}
  const campaignFingerprint=data=>{const {timestamp,...campaign}=data;return JSON.stringify(campaign);};
  function exportedCurrentCampaign(){
    if(!exportedCampaign||exportedCampaign.world!==game.world||exportedCampaign.state!==game.state)return null;
    const current=campaignFingerprint(exportData());
    if(current!==exportedCampaign.fingerprint){exportedCampaign=null;pendingUnstoredImport=null;get('settingsImportConfirm').textContent=importConfirmLabel;get('settingsImportSummary').textContent=importSummary;return null;}
    return current;
  }
  function refresh(){
    get('settingsVolume').value=Math.round(game.settings.volume*100);get('settingsVolumeValue').textContent=`${Math.round(game.settings.volume*100)} %`;
    get('settingsMuted').checked=game.settings.muted;get('settingsContrast').checked=game.settings.highContrast;get('settingsMotion').checked=game.settings.reducedMotion;get('settingsQuality').value=game.settings.quality;
    get('settingsSaveNow').disabled=game.state!=='playing'||game.gameOver;
    status(game.lastSaveStatus?.message||'Sauvegarde automatique toutes les 30 secondes. Une copie exportée reste sous votre contrôle.');
  }
  game.showSettings=show=>{
    const visible=!modal.classList.contains('hidden');if(visible===Boolean(show))return;
    if(show){previousPause=game.state==='playing'&&!game.gameOver?game.paused:null;if(previousPause!==null){game.paused=true;game.save(false);}refresh();}
    else{if(previousPause!==null&&game.state==='playing'&&!game.gameOver){game.paused=previousPause;game.ui.pauseMenu.classList.toggle('hidden',!game.paused);}previousPause=null;clearImport(true);}
    modal.classList.toggle('hidden',!show);game.syncOverlayFocus();
  };
  const suspendForFocusLoss=game.suspendForFocusLoss.bind(game);
  game.suspendForFocusLoss=(...args)=>{
    if(previousPause!==null&&!modal.classList.contains('hidden')&&game.state==='playing'&&!game.gameOver){previousPause=true;game.ui.pauseMenu.classList.remove('hidden');}
    const result=suspendForFocusLoss(...args);if(!modal.classList.contains('hidden'))game.syncOverlayFocus();return result;
  };
  for(const id of ['menuSettingsButton','pauseSettingsButton'])get(id)?.addEventListener('click',()=>game.showSettings(true));
  get('settingsClose').addEventListener('click',()=>game.showSettings(false));
  get('settingsVolume').addEventListener('input',event=>{game.settings.volume=C.clamp(Number(event.target.value)/100,0,1);game.audio.setVolume(game.settings.volume);game.audio.unlock();game.saveSettings();get('settingsVolumeValue').textContent=`${Math.round(game.settings.volume*100)} %`;});
  for(const [id,key]of [['settingsMuted','muted'],['settingsContrast','highContrast'],['settingsMotion','reducedMotion']])get(id).addEventListener('change',event=>{game.settings[key]=event.target.checked;game.audio.setMuted(game.settings.muted);game.audio.unlock();document.body.classList.toggle('high-contrast',game.settings.highContrast);document.body.classList.toggle('reduced-motion',game.settings.reducedMotion);game.saveSettings();});
  get('settingsQuality').addEventListener('change',event=>{game.settings.quality=event.target.value==='low'?'low':'auto';game.saveSettings();game.resize();});
  get('settingsSaveNow').addEventListener('click',()=>{game.save(true);status(game.lastSaveStatus.message);});

  function exportData(){
    if(game.state==='playing'&&!game.gameOver)return Save.validate(game.serialize());
    for(const key of [C.SAVE_KEY,C.SAVE_BACKUP_KEY,...C.LEGACY_SAVE_KEYS])try{const raw=localStorage.getItem(key);if(raw)return Save.parse(raw);}catch{}
    throw new Error('Aucune partie à exporter.');
  }
  function protectImportBackup(){
    const active=game.state==='playing'&&!game.gameOver;
    if(active&&!game.save(false))return false;
    let previous=null,sourceKey=null;
    for(const key of [C.SAVE_KEY,C.SAVE_BACKUP_KEY,...C.LEGACY_SAVE_KEYS]){
      try{const raw=localStorage.getItem(key);if(raw){Save.parse(raw);previous=raw;sourceKey=key;break;}}catch{}
    }
    if(!previous)return !active;
    try{
      if(active&&campaignFingerprint(Save.parse(previous))!==campaignFingerprint(Save.validate(game.serialize())))return false;
      if(sourceKey===C.SAVE_BACKUP_KEY)return true;
      // Preserve the exact campaign before replacing its primary slot, even if
      // the imported campaign later exhausts storage or its backup write fails.
      localStorage.setItem(C.SAVE_BACKUP_KEY,previous);
      return localStorage.getItem(C.SAVE_BACKUP_KEY)===previous;
    }catch{return false;}
  }
  get('settingsExport').addEventListener('click',()=>{
    let url,link;
    try{const data=exportData(),payload=Save.stringify(data);url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));link=document.createElement('a');link.href=url;link.download=`DEADWALL-vague-${data.wave}-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(link);link.click();exportedCampaign={world:game.world,state:game.state,fingerprint:campaignFingerprint(data)};status('Téléchargement de la copie lancé. Vérifiez que le fichier est conservé pour transférer ou restaurer votre cité.');}
    catch(error){status(error.message);}
    finally{link?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
  });
  get('settingsImport').addEventListener('click',()=>get('settingsImportFile').click());
  get('settingsImportFile').addEventListener('change',async event=>{
    const file=event.target.files?.[0];clearImport();const revision=importRevision;
    try{
      if(!file)return;
      if(file.size>Save.MAX_FILE_BYTES)throw new Error('Fichier trop volumineux : maximum 8 Mio.');
      const text=await file.text();
      // A newer choice, cancellation or closed dialog owns the UI now.
      if(revision!==importRevision)return;
      pendingImport=Save.parse(text);
      const scenario = globalThis.DeadwallScenarios.get(pendingImport.scenarioId);
      importSummary=`Vague ${pendingImport.wave} · ${pendingImport.units.length+1} survivants · ${pendingImport.buildings.length} structures · Départ : ${scenario.name} · ${C.DIFFICULTIES[pendingImport.difficulty].label} · Carte ${pendingImport.worldSeed}. Confirmez pour remplacer la partie en cours.`;get('settingsImportSummary').textContent=importSummary;
      get('settingsImportReview').classList.remove('hidden');get('settingsImportConfirm').focus();status('Fichier vérifié. Aucune donnée remplacée avant confirmation.');
    }catch(error){if(revision===importRevision)status(`Import refusé. ${error.message} La partie actuelle reste intacte.`);}
  });
  get('settingsImportCancel').addEventListener('click',()=>{clearImport(true);get('settingsImport').focus();status('Import annulé.');});
  get('settingsImportConfirm').addEventListener('click',()=>{
    if(!pendingImport)return;
    try{
      if(!protectImportBackup()){
        const fingerprint=exportedCurrentCampaign();
        if(!fingerprint)throw new Error('Copie de secours indisponible. Exportez la partie actuelle, conservez le fichier, puis confirmez de nouveau l’import.');
        if(pendingUnstoredImport?.revision!==importRevision||pendingUnstoredImport.fingerprint!==fingerprint){
          pendingUnstoredImport={revision:importRevision,fingerprint};get('settingsImportSummary').textContent=importSummary+' Copie locale de secours indisponible : vérifiez que votre fichier exporté est conservé avant le remplacement.';get('settingsImportConfirm').textContent='REMPLACER SANS COPIE LOCALE DE SECOURS';status('Copie locale de secours indisponible. Vérifiez votre copie exportée, puis confirmez de nouveau pour remplacer la partie. Conservez aussi le fichier à importer.');get('settingsImportConfirm').scrollIntoView?.({block:'nearest'});return;
        }
      }
      game.restoreSave(pendingImport);previousPause=null;clearImport(true);const stored=game.save(false);game.notify(stored?'Partie importée et sauvegardée.':'Partie importée en mémoire. Stockage indisponible : conservez le fichier source.',stored?'good':'danger');
    }
    catch(error){status(error.message);}
  });
  get('settingsFullscreen').addEventListener('click',async()=>{try{if(globalThis.deadwallDesktop?.isDesktop)await globalThis.deadwallDesktop.toggleFullscreen();else if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{status('Plein écran indisponible dans cet environnement.');}});
  const quit=get('settingsQuit');quit.classList.toggle('hidden',!globalThis.deadwallDesktop?.isDesktop);quit.addEventListener('click',()=>{if(game.state==='playing'&&!game.gameOver&&!game.save(false)){status('Sauvegarde impossible : exportez votre partie avant de fermer.');return;}globalThis.deadwallDesktop?.quit();});

  const commands={reload:()=>game.startReload(),melee:()=>game.melee(),weapon:()=>{if(game.arsenal134){const state=game.arsenal134.snapshot(),catalog=C.Arsenal134Rules.catalog,carried=state.carried.filter(item=>catalog[item.id].category!=='deployed'&&catalog[item.id].tier<=game.tier.id),index=carried.findIndex(item=>item.uid===state.equipped);if(carried.length)game.arsenal134.equip(carried[(index+1)%carried.length].uid);return;}const unlocked=Object.values(C.WEAPONS).filter(weapon=>weapon.tier<=game.tier.id),index=unlocked.findIndex(weapon=>weapon.id===game.player.weapon);if(unlocked.length)game.switchWeapon(unlocked[(index+1)%unlocked.length].id);},rotate:()=>{if(game.selectedBuild&&!game.isLineWall(C.BUILDINGS[game.selectedBuild]))game.buildRotation=(game.buildRotation+1)%4;},cancel:()=>game.cancelPlacement(),zoomIn:()=>game.zoomView(1.15),zoomOut:()=>game.zoomView(1/1.15)};
  for(const button of document.querySelectorAll('[data-game-command]'))button.addEventListener('click',()=>{if(game.state==='playing'&&!game.paused&&!game.gameOver)commands[button.dataset.gameCommand]?.();});
  // Use the same pointer ownership and focus-loss cleanup as movement and fire.
  game.bindHeldControl(get('touchSprint'), 'ShiftLeft');
  document.body.classList.toggle('reduced-motion',game.settings.reducedMotion);
})();
