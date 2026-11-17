import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const REQUIRED_FAMILY = 'DejaVu Sans';
const FONT_PROBES = ['bold 11px sans-serif', 'bold 11px "DejaVu Sans"'];
const LATIN_GLYPHS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÂÇÉÈÊËÎÏÔÙÛÜŸàâçéèêëîïôùûüÿŒœ'];
const MISSING_CHARACTER = '\u{10FFFF}';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function drawProbe(context, text) {
  context.clearRect(0, 0, 128, 64);
  const measured = context.measureText(text);
  const metrics = Object.fromEntries(['width', 'actualBoundingBoxLeft', 'actualBoundingBoxRight',
    'actualBoundingBoxAscent', 'actualBoundingBoxDescent'].map(key => [key, measured[key]]));
  context.fillText(text, 16, 40);
  const pixels = context.getImageData(0, 0, 128, 64).data;
  let inkPixels = 0;
  for (let offset = 3; offset < pixels.length; offset += 4) if (pixels[offset] > 0) inkPixels++;
  return {text, metrics, finiteMetrics: Object.values(metrics).every(Number.isFinite),
    inkPixels, rasterSha256: hash(pixels)};
}

// Inspect the same system-loaded registry as a subsequent test process. Do not
// register a font here: that would repair only this process and conceal a bad job.
export function inspectNativeFonts() {
  const report = {version: 1, kind: 'native-canvas-latin-fonts', checkedAt: new Date().toISOString(),
    node: process.version, platform: process.platform, canvasVersion: null, requiredFamily: REQUIRED_FAMILY,
    registeredFamilies: [], resolvedFamily: null,
    resolutionNote: 'Canvas does not expose its resolved family; registered families are an inventory, not a resolution claim.',
    probes: [], errors: [], accepted: false};
  try {
    const {createCanvas, GlobalFonts} = require('@napi-rs/canvas');
    report.canvasVersion = require('@napi-rs/canvas/package.json').version;
    report.registeredFamilies = [...new Set(GlobalFonts.families.map(entry => entry.family))].sort();
    if (!report.registeredFamilies.includes(REQUIRED_FAMILY)) {
      report.errors.push({reason: 'required-family-unavailable', family: REQUIRED_FAMILY});
    }
    for (const font of FONT_PROBES) {
      const context = createCanvas(128, 64).getContext('2d');
      context.font = font;
      context.textAlign = 'left';
      context.textBaseline = 'alphabetic';
      context.fillStyle = '#ffffff';
      const missing = drawProbe(context, MISSING_CHARACTER);
      const glyphs = LATIN_GLYPHS.map(text => drawProbe(context, text));
      for (const glyph of glyphs) {
        const reasons = [];
        if (!glyph.finiteMetrics || glyph.metrics.width <= 0) reasons.push('invalid-metrics');
        if (glyph.inkPixels === 0) reasons.push('invisible-glyph');
        if (glyph.inkPixels > 0 && glyph.rasterSha256 === missing.rasterSha256) reasons.push('missing-glyph-placeholder');
        if (reasons.length) report.errors.push({font, text: glyph.text, reasons});
      }
      const distinctRasters = new Set(glyphs.map(glyph => glyph.rasterSha256)).size;
      if (distinctRasters < 2) report.errors.push({font, reason: 'indistinguishable-latin-glyphs'});
      report.probes.push({font, parsedFont: context.font, missingCharacter: missing, glyphs, distinctRasters});
    }
  } catch (error) {
    report.errors.push({reason: 'native-canvas-probe-failed', message: error.message});
  }
  report.accepted = report.errors.length === 0;
  return report;
}

export function main(argv) {
  if (argv.length !== 1 || !argv[0]) throw new Error('Usage: node scripts/ci-native-fonts.mjs OUTPUT.json');
  const report = inspectNativeFonts();
  fs.mkdirSync(path.dirname(argv[0]), {recursive: true});
  fs.writeFileSync(argv[0], JSON.stringify(report, null, 2) + '\n');
  const summary = {accepted: report.accepted, canvasVersion: report.canvasVersion,
    registeredFamilies: report.registeredFamilies, fonts: report.probes.map(probe => probe.font),
    checkedGlyphs: report.probes.reduce((count, probe) => count + probe.glyphs.length, 0),
    errors: report.errors.slice(0, 8), errorCount: report.errors.length, report: argv[0]};
  console.log(JSON.stringify(summary));
  if (!report.accepted) {
    console.error('Native Canvas cannot render the required Latin glyphs. Install fonts-dejavu-core before starting Node; inspect the JSON glyph metrics and registered-family inventory. A fontconfig match alone does not prove Canvas rendering.');
    process.exitCode = 1;
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
