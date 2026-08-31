(function initDeadwallOptions() {
  'use strict';
  const game=globalThis.DEADWALL, Save=globalThis.DeadwallSave, C=globalThis.DeadwallCore;
  if(!game||!Save)return;
  const get=id=>document.getElementById(id), modal=get('settingsModal');if(!modal)return;
  let previousPause=null, pendingImport=null, importRevision=0;
  const status=text=>{get('settingsStatus').textContent=text;};
  function clearImport(){importRevision++;pendingImport=null;get('settingsImportFile').value='';get('settingsImportReview').classList.add('hidden');}
  function refresh(){
    get('settingsVolume').value=Math.round(game.settings.volume*100);get('settingsVolumeValue').textContent=`${Math.round(game.settings.volume*100)} %`;
    get('settingsMuted').checked=game.settings.muted;get('settingsContrast').checked=game.settings.highContrast;get('settingsMotion').checked=game.settings.reducedMotion;get('settingsQuality').value=game.settings.quality;
    get('settingsSaveNow').disabled=game.state!=='playing'||game.gameOver;
    status(game.lastSaveStatus?.message||'Sauvegarde automatique toutes les 30 secondes. Une copie exportée reste sous votre contrôle.');
  }
  game.showSettings=show=>{
    const visible=!modal.classList.contains('hidden');if(visible===Boolean(show))return;
    if(show){previousPause=game.state==='playing'&&!game.gameOver?game.paused:null;if(previousPause!==null){game.paused=true;game.save(false);}refresh();}
    else{if(previousPause!==null&&game.state==='playing'&&!game.gameOver){game.paused=previousPause;game.ui.pauseMenu.classList.toggle('hidden',!game.paused);}previousPause=null;clearImport();}
    modal.classList.toggle('hidden',!show);game.syncOverlayFocus();
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
  get('settingsExport').addEventListener('click',()=>{
    try{const data=exportData(),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`DEADWALL-vague-${data.wave}-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Copie exportée. Conservez ce fichier pour transférer ou restaurer votre cité.');}
    catch(error){status(error.message);}
  });
  get('settingsImport').addEventListener('click',()=>get('settingsImportFile').click());
  get('settingsImportFile').addEventListener('change',async event=>{
    const file=event.target.files?.[0];clearImport();const revision=importRevision;
    try{
      if(!file)return;
      if(file.size>Save.MAX_FILE_BYTES)throw new Error('Fichier trop volumineux : maximum 8 Mo.');
      const text=await file.text();
      // A newer choice, cancellation or closed dialog owns the UI now.
      if(revision!==importRevision)return;
      pendingImport=Save.parse(text);
      get('settingsImportSummary').textContent=`Vague ${pendingImport.wave} · ${pendingImport.units.length+1} survivants · ${pendingImport.buildings.length} structures. Confirmez pour remplacer la partie en cours.`;
      get('settingsImportReview').classList.remove('hidden');get('settingsImportConfirm').focus();status('Fichier vérifié. Aucune donnée remplacée avant confirmation.');
    }catch(error){if(revision===importRevision)status(`Import refusé. ${error.message} La partie actuelle reste intacte.`);}
  });
  get('settingsImportCancel').addEventListener('click',()=>{clearImport();get('settingsImport').focus();status('Import annulé.');});
  get('settingsImportConfirm').addEventListener('click',()=>{
    if(!pendingImport)return;
    try{if(game.state==='playing'&&!game.gameOver&&!game.save(false))throw new Error('Exportez votre partie actuelle puis revenez au menu avant l’import : le stockage local est indisponible.');game.restoreSave(pendingImport);clearImport();const stored=game.save(false);game.notify(stored?'Partie importée et sauvegardée.':'Partie importée en mémoire. Stockage indisponible : conservez le fichier source.',stored?'good':'danger');}
    catch(error){status(error.message);}
  });
  get('settingsFullscreen').addEventListener('click',async()=>{try{if(globalThis.deadwallDesktop?.isDesktop)await globalThis.deadwallDesktop.toggleFullscreen();else if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{status('Plein écran indisponible dans cet environnement.');}});
  const quit=get('settingsQuit');quit.classList.toggle('hidden',!globalThis.deadwallDesktop?.isDesktop);quit.addEventListener('click',()=>{if(game.state==='playing'&&!game.gameOver&&!game.save(false)){status('Sauvegarde impossible : exportez votre partie avant de fermer.');return;}globalThis.deadwallDesktop?.quit();});

  const commands={reload:()=>game.startReload(),melee:()=>game.melee(),weapon:()=>{const unlocked=Object.values(C.WEAPONS).filter(weapon=>weapon.tier<=game.tier.id),index=unlocked.findIndex(weapon=>weapon.id===game.player.weapon);game.switchWeapon(unlocked[(index+1)%unlocked.length].id);},rotate:()=>{if(game.selectedBuild&&!game.isLineWall(C.BUILDINGS[game.selectedBuild]))game.buildRotation=(game.buildRotation+1)%4;},cancel:()=>game.cancelPlacement(),zoomIn:()=>{game.camera.zoom=C.clamp(game.camera.zoom*1.15,.52,1.65);},zoomOut:()=>{game.camera.zoom=C.clamp(game.camera.zoom/1.15,.52,1.65);}};
  for(const button of document.querySelectorAll('[data-game-command]'))button.addEventListener('click',()=>{if(game.state==='playing'&&!game.paused&&!game.gameOver)commands[button.dataset.gameCommand]?.();});
  const sprint=get('touchSprint');sprint.addEventListener('pointerdown',event=>{if(game.paused||game.state!=='playing')return;event.preventDefault();game.input.keys.add('ShiftLeft');sprint.setPointerCapture?.(event.pointerId);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])sprint.addEventListener(type,()=>game.input.keys.delete('ShiftLeft'));
  document.body.classList.toggle('reduced-motion',game.settings.reducedMotion);
})();
