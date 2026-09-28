import type * as AsyncHooks from 'async_hooks';
import type * as Fs from 'fs';
import type * as FsPromises from 'fs/promises';
import type * as Path from 'path';

/** The Node built-ins the main entry's Node-only code needs (types only: nothing here is imported at runtime). */
interface NodeBuiltins {
  'async_hooks': typeof AsyncHooks;
  'fs': typeof Fs;
  'fs/promises': typeof FsPromises;
  'path': typeof Path;
}

/**
 * A Node built-in for code in the main (browser-safe) entry that only ever runs on Node, loaded at call time through
 * `process.getBuiltinModule`, which a browser bundler never sees. The main entry therefore has no static or dynamic
 * import of a Node built-in (`scripts/check-browser-entry.mjs` enforces it). Throws when called outside Node.
 */
export function nodeBuiltin<ID extends keyof NodeBuiltins>(id: ID): NodeBuiltins[ID] {
  const getBuiltinModule = globalThis.process?.getBuiltinModule;
  if (getBuiltinModule == null) throw new Error(`The Node built-in "${id}" is not available here (Node 20.16+ or 22.3+ is required).`);
  return getBuiltinModule(id) as NodeBuiltins[ID];
}
