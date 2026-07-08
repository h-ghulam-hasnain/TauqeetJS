/**
 * flatten-vsop87.mjs
 *
 * Converts vsop87Coefficients.ts from:
 *   export const L0: VSOPSeries = [ { a: X, b: Y, c: Z }, ... ];
 * To:
 *   export const L0 = new Float64Array([ X, Y, Z, ... ]);
 *
 * Regex used on each term line:
 *   /^\s*\{ a: ([^,]+), b: ([^,]+), c: ([^}]+) \},?\s*$/
 *
 * Run with:  node scripts/flatten-vsop87.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const inFile  = resolve(__dir, '../src/astronomy/theories/vsop87/vsop87Coefficients.ts');

const src = readFileSync(inFile, 'utf8');
const lines = src.split('\n');
const out = [];

// Term line regex: captures a, b, c numeric literals (including scientific notation)
const TERM_RE = /^\s*\{ a: ([^,]+), b: ([^,]+), c: ([^}]+) \},?\s*(?:\/\/.*)?$/;
// Series open: export const Xy: VSOPSeries = [
const OPEN_RE = /^export const (\w+): VSOPSeries = \[$/;
// Series close: ];
const CLOSE_RE = /^\];$/;

// State
let insideSeries = false;

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  const line = raw.trimEnd();   // preserve raw for fallback

  // ── Drop the old interface and type alias ──────────────────────────────────
  if (
    line === 'export interface VSOPTerm {' ||
    line === '  readonly a: number; // Amplitude' ||
    line === '  readonly b: number; // Phase (radians)' ||
    line === '  readonly c: number; // Frequency (radians per millennium)' ||
    line === '}' ||
    line === "export type VSOPSeries = readonly VSOPTerm[];"
  ) {
    // Skip these lines; they will be replaced by the new type below.
    continue;
  }

  // ── Inject the new type alias immediately after the header comment ─────────
  if (line === '' && i <= 5 && !out.some(l => l.startsWith('export type VSOPSeries'))) {
    out.push('');
    out.push('/**');
    out.push(' * Flat interleaved Float64Array layout: [a0, b0, c0, a1, b1, c1, ...]');
    out.push(' * Each stride of 3 encodes one VSOP87 trigonometric term.');
    out.push(' * - index i+0: amplitude (a)');
    out.push(' * - index i+1: phase     (b, radians)');
    out.push(' * - index i+2: frequency (c, radians per millennium)');
    out.push(' */');
    out.push('export type VSOPSeries = Float64Array;');
    continue;
  }

  // ── Rewrite series open bracket ───────────────────────────────────────────
  const openMatch = OPEN_RE.exec(line);
  if (openMatch) {
    insideSeries = true;
    out.push(`export const ${openMatch[1]} = new Float64Array([`);
    continue;
  }

  // ── Rewrite series close bracket ──────────────────────────────────────────
  if (insideSeries && CLOSE_RE.test(line)) {
    insideSeries = false;
    out.push(']);');
    out.push('');
    continue;
  }

  // ── Rewrite each term line ─────────────────────────────────────────────────
  if (insideSeries) {
    const m = TERM_RE.exec(raw);
    if (m) {
      const a = m[1].trim();
      const b = m[2].trim();
      const c = m[3].trim();
      out.push(`  ${a}, ${b}, ${c},`);
      continue;
    }
    // Empty line or unmatched inside series — pass through
    if (line.trim() === '') {
      continue;
    }
    // Fallback: emit as-is so we don't silently lose data
    out.push(raw.trimEnd());
    continue;
  }

  // ── All other lines pass through unchanged ─────────────────────────────────
  out.push(raw.trimEnd());
}

const result = out.join('\n') + '\n';
writeFileSync(inFile, result, 'utf8');

// Quick sanity check: count Float64Array declarations
const seriesCount = (result.match(/new Float64Array\(\[/g) || []).length;
console.log(`Done. Rewrote ${seriesCount} series as Float64Array in:`);
console.log(inFile);
