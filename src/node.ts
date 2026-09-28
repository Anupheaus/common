// Node-only entry: `@anupheaus/common/node`. Anything that needs a Node built-in (zlib, util, fs…) and must never reach
// a browser bundle is exported from here, not from the main entry (`src/index.ts`). The main entry is checked for
// that on every build (`scripts/check-browser-entry.mjs`).
export { useAxiom } from './logger/logger-axiom';
export type { AxiomLogOptions } from './logger/logger-axiom';
