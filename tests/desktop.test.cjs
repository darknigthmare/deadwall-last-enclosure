'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resolvePublicFile, isGameDocument, isWithin, desktopHtml, isSaveExport, windowBounds, CONTENT_SECURITY_POLICY } = require('../desktop/policy.cjs');
const root = path.resolve('desktop-test-public');

test('desktop protocol serves only the public game surface', () => {
  for (const file of ['index.html','styles.css','settings.css','command.css','manifest.json','src/core.js','src/game.js','src/tactics.js','src/profile.js','src/command-ui.js','assets/art/terrain-v2.webp']) assert.equal(resolvePublicFile(root, `deadwall://game/${file}`), path.join(root, file));
  for (const file of ['package.json','.env','.git/config','desktop/main.cjs','sw.js','assets/private.txt','assets/key.pem','src/../../package.json','../package.json','%2e%2e/package.json','assets/%2e%2e/%2e%2e/package.json','assets/%252e%252e/test.png','assets%2ficon.png','assets\\icon.png','assets/icon.png%00','assets/icon.png:secret']) assert.equal(resolvePublicFile(root, `deadwall://game/${file}`), null, file);
});

test('desktop rejects other origins, credentials, ports and malformed URLs', () => {
  for (const url of ['https://game/index.html','file:///index.html','deadwall://evil/index.html','deadwall://game.evil/index.html','deadwall://user@game/index.html','deadwall://game:80/index.html','deadwall://game/assets/%xy.png','javascript:alert(1)']) {
    assert.equal(resolvePublicFile(root, url), null);
    assert.equal(isGameDocument(url), false);
  }
  assert.equal(isGameDocument('deadwall://game/index.html'), true);
  assert.equal(isGameDocument('deadwall://game/src/game.js'), false);
  assert.equal(isWithin(root, path.join(root, 'assets', 'image.webp')), true);
  assert.equal(isWithin(root, root), false);
  assert.equal(isWithin(root, path.join(root, '..', 'outside')), false);
});

test('desktop removes only service-worker bootstrap and enforces self-contained CSP', () => {
  const html = '<script src="src/game.js"></script>\n<script>if (\'serviceWorker\' in navigator) navigator.serviceWorker.register(\'sw.js\').catch(() => {});</script>';
  assert.equal(desktopHtml(html), '<script src="src/game.js"></script>');
  assert.match(CONTENT_SECURITY_POLICY, /script-src 'self';/);
  assert.match(CONTENT_SECURITY_POLICY, /worker-src 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /frame-ancestors 'none'/);
  assert.ok(!CONTENT_SECURITY_POLICY.includes('unsafe-eval'));
});

test('desktop bounds survive corrupt settings and small or changed displays', () => {
  assert.deepEqual(windowBounds({}, {workArea:{width:1920,height:1080}}), {width:1440,height:900,fullscreen:false,maximized:false});
  assert.deepEqual(windowBounds({width:99999,height:Infinity,fullscreen:'yes'}, {workArea:{width:1024,height:768}}), {width:1024,height:768,fullscreen:false,maximized:false});
  assert.deepEqual(windowBounds({width:-10,height:100,fullscreen:true,maximized:true}, {workArea:{width:700,height:500}}), {width:700,height:500,fullscreen:true,maximized:true});
});

test('desktop allows only bounded JSON save exports from its own blob origin', () => {
  const valid = { url:'blob:deadwall://game/abc-123', filename:'deadwall-2026-08-31.json', mimeType:'application/json', bytes:2048 };
  assert.equal(isSaveExport(valid), true);
  for (const invalid of [{url:'https://example.com/save.json'},{url:'blob:deadwall://evil/abc'},{url:'blob:deadwall://game.evil/abc'},{filename:'../deadwall.json'},{filename:'deadwall.exe'},{filename:'other.json'},{mimeType:'application/x-msdownload'},{bytes:0},{bytes:Infinity},{bytes:8*1024*1024+1}]) assert.equal(isSaveExport({...valid,...invalid}), false);
});
