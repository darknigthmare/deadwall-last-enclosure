'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// No filesystem, generic IPC, Node.js objects or arbitrary URLs cross this bridge.
contextBridge.exposeInMainWorld('deadwallDesktop', Object.freeze({
  isDesktop: true,
  platform: process.platform,
  toggleFullscreen: () => ipcRenderer.invoke('deadwall:fullscreen'),
  quit: () => ipcRenderer.invoke('deadwall:quit')
}));
