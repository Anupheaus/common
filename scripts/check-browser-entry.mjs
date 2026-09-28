#!/usr/bin/env node
// The main entry (`dist/index.mjs`) is imported by browser bundles (Vision's web, device and widget apps), so it must
// not import any Node built-in, statically or dynamically: a bundler would fail on it ("Can't resolve 'zlib'", common
// 0.2.10). Node-only code goes in the `/node` entry (src/node.ts), or loads its built-in at call time through
// `nodeBuiltin` (src/logger/nodeBuiltins.ts). Run after `pnpm build`; CI runs it before every publish.
import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';

const ENTRY = 'dist/index.mjs';
const builtins = new Set(builtinModules.flatMap(name => [name, `node:${name}`]));
const source = readFileSync(ENTRY, 'utf8');
const specifiers = [
  ...source.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g),
  ...source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
  ...source.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm),
  ...source.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
].map(([, specifier]) => specifier);
const offending = [...new Set(specifiers.filter(specifier => builtins.has(specifier) || builtins.has(specifier.split('/')[0])))].sort();

if (offending.length > 0) {
  console.error(`${ENTRY} imports Node built-ins a browser bundle cannot resolve: ${offending.join(', ')}.\nMove that code to src/node.ts (the "/node" entry), or load the built-in at call time with nodeBuiltin().`);
  process.exit(1);
}
console.log(`${ENTRY} is browser-safe: it imports no Node built-ins.`);
