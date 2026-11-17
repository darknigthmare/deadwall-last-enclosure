'use strict';

// CI-only preload: register both weights before any Canvas can cache a missing
// generic family. Keep the package's system-font loading and other families.
const fs = require('node:fs');
const {GlobalFonts} = require('@napi-rs/canvas');
const family = 'DejaVu Sans';
const alias = 'sans-serif';
const files = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
];

try {
  for (const filename of files) {
    if (!fs.statSync(filename).isFile()) throw new Error('Not a font file: ' + filename);
    for (const name of [family, alias]) {
      if (!GlobalFonts.registerFromPath(filename, name)) {
        throw new Error('Canvas rejected ' + filename + ' for ' + name);
      }
    }
  }
} catch (error) {
  const inventory = GlobalFonts.families.map(entry => entry.family).sort();
  throw new Error('Native Canvas font bootstrap failed. Install fonts-dejavu-core before Node starts. ' +
    error.message + '; registered families: ' + JSON.stringify(inventory), {cause: error});
}

// Diagnostic provenance only; actual glyphs are checked by ci-native-fonts.mjs.
module.exports = Object.freeze({kind: 'native-canvas-font-bootstrap', family, alias, files});
