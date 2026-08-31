'use strict';

const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, screen, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { GAME_URL, CONTENT_SECURITY_POLICY, isGameDocument, isWithin, resolvePublicFile, desktopHtml, isSaveExport, windowBounds } = require('./policy.cjs');

app.setName('DEADWALL');
app.enableSandbox();
app.setAppUserModelId('com.darknigthmare.deadwall');
protocol.registerSchemesAsPrivileged([{ scheme: 'deadwall', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

const smokeIndex = process.argv.indexOf('--desktop-smoke');
const smokeRoot = smokeIndex >= 0 ? path.resolve(process.argv[smokeIndex + 1]) : null;
const smokeStage = smokeIndex >= 0 ? process.argv[smokeIndex + 2] : null;
const profile = smokeRoot ? path.join(smokeRoot, 'profile') : path.join(app.getPath('appData'), 'DEADWALL');
fs.mkdirSync(profile, { recursive: true });
app.setPath('userData', profile);
app.setPath('sessionData', profile);

const publicRoot = path.join(app.getAppPath(), 'dist');
const preferencesFile = path.join(profile, 'window.json');
const mimeTypes = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon', '.woff2':'font/woff2', '.ogg':'audio/ogg', '.wav':'audio/wav' };
let mainWindow = null;
let closePending = false;
let closeAllowed = false;

function readPreferences() {
  try { const data = JSON.parse(fs.readFileSync(preferencesFile, 'utf8')); return data && typeof data === 'object' ? data : {}; }
  catch { return {}; }
}

function writePreferences() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { width, height } = mainWindow.getNormalBounds();
  try {
    fs.writeFileSync(`${preferencesFile}.tmp`, JSON.stringify({ width, height, fullscreen: mainWindow.isFullScreen(), maximized: mainWindow.isMaximized() }));
    fs.renameSync(`${preferencesFile}.tmp`, preferencesFile);
  } catch (error) { console.error('Impossible de conserver les réglages de fenêtre.', error.message); }
}

async function serveGame(request) {
  const headers = { 'Content-Security-Policy': CONTENT_SECURITY_POLICY, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' };
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status:405, headers:{ ...headers, Allow:'GET, HEAD' } });
  const filename = resolvePublicFile(publicRoot, request.url);
  if (!filename) return new Response(null, { status:404, headers });
  try {
    const real = await fs.promises.realpath(filename);
    if (!isWithin(await fs.promises.realpath(publicRoot), real)) return new Response(null, { status:404, headers });
    const extension = path.extname(filename).toLowerCase();
    let body = await fs.promises.readFile(filename);
    if (extension === '.html') body = desktopHtml(body.toString('utf8'));
    return new Response(request.method === 'HEAD' ? null : body, { headers:{ ...headers, 'Content-Type':mimeTypes[extension] || 'application/octet-stream' } });
  } catch { return new Response(null, { status:404, headers }); }
}

function trustedSender(event) {
  return mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents && event.senderFrame === mainWindow.webContents.mainFrame && isGameDocument(event.senderFrame.url);
}

function toggleFullscreen() {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
  return mainWindow.isFullScreen();
}

async function closeSafely() {
  if (closePending || !mainWindow || mainWindow.isDestroyed()) return;
  closePending = true;
  let timeout;
  try {
    // A timestamp readback catches localStorage quota/write failures swallowed by the game.
    const saved = await Promise.race([
      mainWindow.webContents.executeJavaScript(`(() => {
        const game = globalThis.DEADWALL;
        if (!game || game.state !== 'playing' || game.gameOver) return true;
        const started = Date.now(); const result = game.save(false);
        if (result === false) return false;
        return Object.keys(localStorage).some(key => {
          if (!/^deadwall-save-v\\d+$/.test(key)) return false;
          try { const save = JSON.parse(localStorage.getItem(key)); return save.timestamp >= started && save.worldSeed === game.world.seed; } catch { return false; }
        });
      })()`),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('La sauvegarde ne répond pas.')), 5000); })
    ]);
    if (!saved) throw new Error('La sauvegarde locale n’a pas pu être confirmée.');
  } catch (error) {
    if (smokeRoot) { console.error(error); closePending = false; app.exit(1); return; }
    const answer = await dialog.showMessageBox(mainWindow, {
      type:'warning', title:'DEADWALL — sauvegarde non confirmée',
      message:'La dernière sauvegarde n’a pas pu être confirmée.', detail:'Revenez au jeu pour réessayer. Quitter maintenant peut perdre les dernières actions.',
      buttons:['Revenir au jeu','Quitter quand même'], defaultId:0, cancelId:0, noLink:true
    });
    if (answer.response !== 1) { closePending = false; return; }
  } finally { clearTimeout(timeout); }
  writePreferences();
  mainWindow.webContents.session.flushStorageData();
  closeAllowed = true;
  mainWindow.close();
}

async function createWindow() {
  const bounds = windowBounds(readPreferences(), screen.getPrimaryDisplay());
  mainWindow = new BrowserWindow({
    width:bounds.width, height:bounds.height, minWidth:Math.min(800,bounds.width), minHeight:Math.min(600,bounds.height),
    title:'DEADWALL — La Dernière Enceinte', backgroundColor:'#101612', show:false,
    icon:path.join(publicRoot, 'assets', 'icon-512.png'), autoHideMenuBar:true,
    webPreferences:{ preload:path.join(__dirname, 'preload.cjs'), nodeIntegration:false, nodeIntegrationInWorker:false, nodeIntegrationInSubFrames:false, contextIsolation:true, sandbox:true, webSecurity:true, allowRunningInsecureContent:false, webviewTag:false, devTools:!app.isPackaged, spellcheck:false }
  });
  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action:'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.webContents.on('will-redirect', event => event.preventDefault());
  mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.alt && input.key === 'Enter')) { event.preventDefault(); if (!input.isAutoRepeat) toggleFullscreen(); }
    if (input.key === 'F5' || ((input.control || input.meta) && ['r','R','+','-','0'].includes(input.key))) event.preventDefault();
  });
  mainWindow.on('blur', () => {
    if (!mainWindow.isDestroyed() && isGameDocument(mainWindow.webContents.getURL())) mainWindow.webContents.executeJavaScript("if(globalThis.DEADWALL?.state === 'playing' && !globalThis.DEADWALL.gameOver && !globalThis.DEADWALL.paused) globalThis.DEADWALL.togglePause(true)").catch(() => {});
  });
  mainWindow.on('close', event => { if (!closeAllowed) { event.preventDefault(); void closeSafely(); } });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (smokeRoot) { console.error(details); app.exit(1); return; }
    dialog.showErrorBox('DEADWALL — interruption', 'Le moteur s’est arrêté. Relancez le jeu puis choisissez Continuer pour reprendre la dernière sauvegarde.');
  });
  if (smokeRoot) {
    const { verifyWindow } = require('./smoke.cjs');
    await verifyWindow({ app, window:mainWindow, serveGame, toggleFullscreen, closeSafely, reportRoot:smokeRoot, stage:smokeStage, gameURL:GAME_URL });
  } else {
    await mainWindow.loadURL(GAME_URL);
    if (bounds.maximized) mainWindow.maximize();
    if (bounds.fullscreen) mainWindow.setFullScreen(true);
    mainWindow.show();
  }
}

const hasLock = smokeRoot || app.requestSingleInstanceLock();
if (!hasLock) app.quit();
else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } });
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    session.defaultSession.protocol.handle('deadwall', serveGame);
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setDevicePermissionHandler(() => false);
    session.defaultSession.webRequest.onBeforeRequest({ urls:['http://*/*','https://*/*','ws://*/*','wss://*/*','ftp://*/*','file://*/*'] }, (_details, callback) => callback({ cancel:true }));
    session.defaultSession.on('will-download', (event, item, contents) => {
      const allowed = mainWindow && contents === mainWindow.webContents && isGameDocument(contents.getURL()) && isSaveExport({ url:item.getURL(), filename:item.getFilename(), mimeType:item.getMimeType(), bytes:item.getTotalBytes() });
      if (!allowed) { event.preventDefault(); return; }
      if (smokeRoot) item.setSavePath(path.join(smokeRoot, `${smokeStage}-export.json`));
      else item.setSaveDialogOptions({ title:'Exporter la sauvegarde DEADWALL', defaultPath:item.getFilename(), filters:[{ name:'Sauvegarde DEADWALL', extensions:['json'] }] });
    });
    ipcMain.handle('deadwall:fullscreen', event => { if (!trustedSender(event)) throw new Error('Accès refusé.'); return toggleFullscreen(); });
    ipcMain.handle('deadwall:quit', event => { if (!trustedSender(event)) throw new Error('Accès refusé.'); void closeSafely(); });
    await createWindow();
  }).catch(error => { console.error(error); if (!smokeRoot) dialog.showErrorBox('DEADWALL — démarrage impossible', 'Les fichiers du jeu sont manquants ou illisibles. Réextrayez l’archive complète dans un dossier accessible.'); app.exit(1); });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', event => { if (mainWindow && !closeAllowed) { event.preventDefault(); void closeSafely(); } });
}
