'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { readFileSync } = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');

function request(server, url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: url, method }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', data => { body += data; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('serveur: le lancement CLI démarre sur une adresse de boucle locale', { timeout: 10000 }, async t => {
  const child = spawn(process.execPath, [path.join(root, 'scripts/server.mjs')], {
    cwd: root, env: { ...process.env, PORT: '0' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => new Promise(resolve => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    child.once('exit', resolve);
    child.kill();
  }));
  const port = await new Promise((resolve, reject) => {
    let output = '';
    let errors = '';
    child.on('error', reject);
    child.once('exit', code => reject(new Error(`Serveur arrêté (${code}): ${errors}`)));
    child.stderr.on('data', data => { errors += data; });
    child.stdout.on('data', data => {
      output += data;
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) resolve(Number(match[1]));
    });
  });
  const response = await request({ address: () => ({ port }) }, '/');
  assert.equal(response.status, 200);
  assert.match(response.body, /DEADWALL/);
});

test('serveur: seules les ressources publiques sont accessibles, sans traversée ni fuite par jonction', async t => {
  const { createGameServer } = await import(pathToFileURL(path.join(root, 'scripts/server.mjs')).href);
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'deadwall-server-'));
  const publicRoot = path.join(fixture, 'public');
  const sibling = path.join(fixture, 'public-secret');
  let server;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    await fs.rm(fixture, { recursive: true, force: true });
  });
  const files = {
    'public/index.html': '<h1>DEADWALL</h1>', 'public/styles.css': 'body{}',
    'public/src/core.js': 'window.core = true;', 'public/src/game.js': 'window.game = true;',
    'public/sw.js': '/* worker */', 'public/manifest.json': '{}',
    'public/assets/icon.svg': '<svg/>', 'public/assets/fonts/command.woff2': 'font',
    'public/.env': 'secret', 'public/.git/config': 'secret', 'public/AGENTS.md': 'secret',
    'public/docs/GAME_DESIGN.md': 'secret', 'public/docs/private.svg': 'secret', 'public/scripts/server.mjs': 'secret',
    'public/assets/private.json': 'secret', 'public-secret/leak.svg': 'secret'
  };
  for (const [name, contents] of Object.entries(files)) {
    const filename = path.join(fixture, name);
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, contents);
  }
  server = createGameServer({ rootDirectory: publicRoot });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  for (const url of ['/', '/index.html', '/styles.css?release=1', '/src/core.js', '/src/game.js', '/sw.js', '/manifest.json', '/assets/icon.svg', '/assets/fonts/command.woff2']) {
    const result = await request(server, url);
    assert.equal(result.status, 200, url);
    assert.equal(result.headers['x-content-type-options'], 'nosniff');
    assert.equal(result.headers['cache-control'], 'no-store');
  }
  const head = await request(server, '/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.equal(Number(head.headers['content-length']), Buffer.byteLength(files['public/index.html']));
  const post = await request(server, '/', 'POST');
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
  for (const url of ['/.env', '/.git/config', '/%2egit/config', '/AGENTS.md', '/docs/GAME_DESIGN.md', '/scripts/server.mjs', '/assets/private.json', '/assets/', '/missing', '/%ZZ', '/assets/%00icon.svg', '/assets/../.env', '/assets/%2e%2e/.env', '/assets/%2e%2e/%2e%2e/public-secret/leak.svg', '/assets/%5c..%5c..%5cpublic-secret/leak.svg', '/../public-secret/leak.svg', '/%2e%2e/public-secret/leak.svg', '//index.html', '/index.html::$DATA']) {
    const result = await request(server, url);
    assert.equal(result.status, 404, url);
    assert.doesNotMatch(result.body, /secret/, url);
  }
  await t.test('un asset ne peut pas sortir de la racine par un lien symbolique', async subtest => {
    try {
      await fs.symlink(sibling, path.join(publicRoot, 'assets/escape'), process.platform === 'win32' ? 'junction' : 'dir');
      await fs.symlink(path.join(publicRoot, 'docs'), path.join(publicRoot, 'assets/private'), process.platform === 'win32' ? 'junction' : 'dir');
    } catch (error) {
      if (error.code === 'EPERM' || error.code === 'EACCES') return subtest.skip('Création de liens symboliques interdite sur cette machine.');
      throw error;
    }
    const result = await request(server, '/assets/escape/leak.svg');
    assert.equal(result.status, 404);
    assert.doesNotMatch(result.body, /secret/);
    const privateAsset = await request(server, '/assets/private/private.svg');
    assert.equal(privateAsset.status, 404);
    assert.doesNotMatch(privateAsset.body, /secret/);
  });
});

function serviceWorkerHarness() {
  const listeners = {};
  const stores = new Map();
  const scope = 'https://deadwall.example/game/';
  const key = request => new URL(typeof request === 'string' ? request : request.url, scope).href;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        addAll: async urls => { for (const url of urls) store.set(key(url), new Response('precache')); },
        match: async request => store.get(key(request))?.clone(),
        put: async (request, response) => { store.set(key(request), response); }
      };
    }
  };
  let fetchHandler = async () => { throw new Error('offline'); };
  const context = vm.createContext({
    URL, Response, caches, fetch: request => fetchHandler(request),
    self: { registration: { scope }, location: { origin: new URL(scope).origin }, addEventListener: (type, listener) => { listeners[type] = listener; }, skipWaiting: async () => {}, clients: { claim: async () => {} } }
  });
  vm.runInContext(readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
  const cacheName = vm.runInContext('CACHE', context);
  async function dispatch(type, request) {
    const pending = [];
    let response;
    listeners[type]({ request, waitUntil: promise => pending.push(promise), respondWith: promise => { response = promise; } });
    const result = await response;
    await Promise.all(pending);
    return result;
  }
  return { caches, stores, cacheName, scope, dispatch, setFetch: callback => { fetchHandler = callback; } };
}

test('PWA: activation limitée aux anciens caches DEADWALL', async () => {
  const worker = serviceWorkerHarness();
  await worker.caches.open('another-game-v1');
  await worker.caches.open('deadwall-v0-obsolete');
  await worker.dispatch('install');
  await worker.dispatch('activate');
  assert.ok(worker.stores.has('another-game-v1'));
  assert.ok(worker.stores.has(worker.cacheName));
  assert.equal(worker.stores.has('deadwall-v0-obsolete'), false);
});

test('PWA: hors ligne, seules les réponses du cache courant sont utilisées', async () => {
  const worker = serviceWorkerHarness();
  const stale = await worker.caches.open('another-game-v1');
  await stale.put(worker.scope + 'styles.css', new Response('foreign css'));
  const cached = await worker.caches.open(worker.cacheName);
  await cached.put(worker.scope + 'index.html', new Response('DEADWALL offline'));
  const home = await worker.dispatch('fetch', { method: 'GET', url: worker.scope, mode: 'navigate' });
  assert.equal(await home.text(), 'DEADWALL offline');
  const autostart = await worker.dispatch('fetch', { method: 'GET', url: worker.scope + '?autostart=1', mode: 'navigate' });
  assert.equal(await autostart.text(), 'DEADWALL offline');
  const missing = await worker.dispatch('fetch', { method: 'GET', url: worker.scope + 'styles.css', mode: 'same-origin' });
  assert.equal(missing.type, 'error', 'aucun cache étranger ne doit fournir le CSS');
  for (const url of [worker.scope + '.env', worker.scope + 'docs/GAME_DESIGN.md', 'https://other.example/index.html']) {
    assert.equal(await worker.dispatch('fetch', { method: 'GET', url, mode: 'navigate' }), undefined, url);
  }
});

test('PWA: une réponse HTTP valide est mise en cache, sans mémoriser les erreurs', async () => {
  const worker = serviceWorkerHarness();
  worker.setFetch(async () => new Response('new css'));
  const request = { method: 'GET', url: worker.scope + 'styles.css', mode: 'same-origin' };
  const response = await worker.dispatch('fetch', request);
  assert.equal(await response.text(), 'new css');
  const cached = await worker.caches.open(worker.cacheName);
  assert.equal(await (await cached.match(request)).text(), 'new css');
  const queryResponse = await worker.dispatch('fetch', { ...request, url: request.url + '?release=current' });
  assert.equal(await queryResponse.text(), 'new css');
  assert.equal((await cached.match(request.url + '?release=current')), undefined, 'les paramètres ne créent pas de copies du cache');
  worker.setFetch(async () => new Response('server error', { status: 503 }));
  assert.equal((await worker.dispatch('fetch', request)).status, 503);
  assert.equal(await (await cached.match(request)).text(), 'new css');
  assert.equal(await worker.dispatch('fetch', { ...request, method: 'POST' }), undefined);
});
