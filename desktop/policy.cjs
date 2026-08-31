'use strict';

const path = require('node:path');

const GAME_ORIGIN = 'deadwall://game';
const GAME_URL = `${GAME_ORIGIN}/index.html`;
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'", "script-src 'self'", "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:", "font-src 'self'", "media-src 'self' blob:",
  "connect-src 'self'", "worker-src 'none'", "object-src 'none'",
  "base-uri 'none'", "frame-src 'none'", "frame-ancestors 'none'", "form-action 'none'"
].join('; ');

function isGameDocument(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'deadwall:' && url.host === 'game' && !url.username && !url.password && url.pathname === '/index.html';
  } catch { return false; }
}

function isWithin(root, filename) {
  const relative = path.relative(path.resolve(root), path.resolve(filename));
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

function resolvePublicFile(root, value) {
  // Reject encoded separators and dot segments before URL normalization can erase them.
  if (typeof value !== 'string' || /[\\\x00-\x20]|%(?:2e|2f|5c|00)|\/(?:\.{1,2})(?:\/|$)/i.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'deadwall:' || url.host !== 'game' || url.username || url.password) return null;
    const pathname = decodeURIComponent(url.pathname);
    if (!/^\/(?:index\.html|(?:styles|settings|command|content|narrative|squads|finish)\.css|manifest\.json|src\/[a-z0-9_-]+\.js|assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_.-]+\.(?:png|webp|jpg|jpeg|svg|ico|woff2|ogg|wav|json))$/i.test(pathname)) return null;
    const filename = path.resolve(root, `.${pathname}`);
    return isWithin(root, filename) ? filename : null;
  } catch { return null; }
}

function desktopHtml(html) {
  // Desktop serves the same built game; a service worker is neither needed nor allowed here.
  return html.replace(/\s*<script>if \('serviceWorker'[\s\S]*?<\/script>/g, '');
}

function isSaveExport({ url, filename, mimeType, bytes }) {
  return /^blob:deadwall:\/\/game\/[a-z0-9-]+$/i.test(url) && /^deadwall[-_a-z0-9.]*\.json$/i.test(filename) && mimeType === 'application/json' && Number.isFinite(bytes) && bytes > 0 && bytes <= 8 * 1024 * 1024;
}

function windowBounds(saved, display) {
  const area = display.workArea;
  const width = Math.min(area.width, Math.max(800, Number.isFinite(saved.width) ? saved.width : 1440));
  const height = Math.min(area.height, Math.max(600, Number.isFinite(saved.height) ? saved.height : 900));
  return { width: Math.round(width), height: Math.round(height), fullscreen: saved.fullscreen === true, maximized: saved.maximized === true };
}

module.exports = { GAME_ORIGIN, GAME_URL, CONTENT_SECURITY_POLICY, isGameDocument, isWithin, resolvePublicFile, desktopHtml, isSaveExport, windowBounds };
