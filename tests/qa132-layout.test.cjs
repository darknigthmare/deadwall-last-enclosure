'use strict';
// Structural CSS checks only: these do not emulate browser layout or certify a viewport.
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(m => fs.readFileSync(path.join(root, m[1]), 'utf8')).join('\n');
function rules(source, conditions = []) {
  const result = []; source = source.replace(/\/\*[\s\S]*?\*\//g, '');
  for (let start = 0; start < source.length;) {
    const open = source.indexOf('{', start); if (open < 0) break;
    let end = open + 1, depth = 1;
    for (; end < source.length && depth; end++) { if (source[end] === '{') depth++; if (source[end] === '}') depth--; }
    const selector = source.slice(start, open).trim(), body = source.slice(open + 1, end - 1); start = end;
    if (selector.startsWith('@media')) result.push(...rules(body, [...conditions, selector.slice(6)]));
    else if (!selector.startsWith('@')) result.push({ selector, conditions, declarations: body.split(';').map(s => { const n = s.indexOf(':'); return [s.slice(0, n).trim(), s.slice(n + 1).trim()]; }).filter(([k]) => k) });
  }
  return result;
}
const sheet = rules(styles);
function active(condition, width, height) {
  if (/prefers-|forced-colors|hover|pointer/.test(condition)) return false;
  for (const [, bound, axis, amount] of condition.matchAll(/\((min|max)-(width|height)\s*:\s*(\d+)px\)/g)) {
    const size = axis === 'width' ? width : height;
    if (bound === 'min' ? size < +amount : size > +amount) return false;
  }
  if (/orientation\s*:\s*landscape/.test(condition) && width <= height) return false;
  return true;
}
function declarations(selectors, width, height = 800) {
  const values = new Map();
  for (const rule of sheet) {
    if (!rule.conditions.every(c => active(c, width, height))) continue;
    for (const selector of rule.selector.split(',').map(s => s.trim())) {
      if (!selectors.includes(selector)) continue;
      const specificity = (selector.match(/#[\w-]+/g)?.length || 0) * 100 + (selector.match(/\.[\w-]+/g)?.length || 0) * 10;
      for (let [property, value] of rule.declarations) {
        if (property === 'grid-template') { property = 'grid-template-columns'; value = value.split('/').at(-1).trim(); }
        const priority = specificity + (value.includes('!important') ? 10000 : 0), old = values.get(property);
        if (!old || priority >= old.priority) values.set(property, { value: value.replace(/\s*!important/, ''), priority });
      }
    }
  }
  return Object.fromEntries([...values].map(([k, v]) => [k, v.value]));
}
function inlinePadding(value) {
  const parts = value.split(/\s+/).map(v => { assert.match(v, /^\d+(?:\.\d+)?(?:px)?$/, 'Only the audited command px paddings are evaluated'); return parseFloat(v); });
  return parts.length === 1 ? parts[0] * 2 : parts.length === 4 ? parts[1] + parts[3] : parts[1] * 2;
}
for (const width of [360, 560, 800, 801, 835, 1100, 1366]) {
  test(`QA132 CSS : les minima du tableau de commandement tiennent à ${width}px`, () => {
    const modal = declarations(['.overlay', '.overlay:not(.menu-overlay)', '.command129', '.presentation132 .command129'], width);
    const post = declarations(['.command-post', '.command129 .command-post', '.presentation132 .command129 .command-post'], width);
    const body = declarations(['.command-body', '.command129 .command-body', '.presentation132 .command129 .command-body'], width);
    const dashboard = declarations(['.command-dashboard129', '.presentation132 .command-dashboard129'], width);
    const sideBar = +(post['grid-template-columns'].match(/^(\d+)px\s/)?.[1] || 0);
    const minima = [...dashboard['grid-template-columns'].matchAll(/minmax\(\s*(\d+)px\s*,/g)].map(m => +m[1]);
    const required = minima.reduce((sum, n) => sum + n, 0) + Math.max(0, minima.length - 1) * parseFloat(dashboard.gap || 0);
    const available = Math.min(1480, width - inlinePadding(modal.padding)) - 2 - sideBar - inlinePadding(body.padding);
    assert.ok(required <= available, `Colonnes: ${required}px requis, ${available}px disponibles; la rupture responsive ne doit pas introduire de défilement horizontal.`);
  });
}
function luminance(hex) {
  const rgb = hex.replace('#', '').match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
test('QA132 CSS : le thème illustré conserve le renforcement des variables de contraste', () => {
  const normal = declarations([':root', '.presentation132', '.presentation132:not(.high-contrast)'], 1366);
  const contrast = declarations([':root', '.high-contrast', '.presentation132', '.presentation132.high-contrast'], 1366);
  for (const key of ['--muted', '--line', '--accent']) assert.ok(luminance(contrast[key]) > luminance(normal[key]) + .1, `${key} doit conserver le renforcement du mode contraste élevé.`);
});
