import { defineConfig } from 'tsup';

/**
 * Matches a bare package specifier (`luxon`, `node:fs`), so dependencies stay external rather than bundled.
 * The DTS build (rollup) also tests this against already-resolved absolute paths. A Windows path such as
 * `C:\code\common\src\extensions\index.ts` must not match, or rollup marks every own module external and
 * emits an empty `dist/index.d.mts` of `export * from './extensions/index.ts'` lines; a POSIX path starts
 * with `/`, which is why the build only broke on Windows.
 */
const BARE_SPECIFIER = /^(?![./\\]|[a-zA-Z]:[\\/])/;

export default defineConfig({
  // `node` is the Node-only entry (`@anupheaus/common/node`): see src/node.ts.
  entry: { index: 'src/index.ts', node: 'src/node.ts' },
  format: ['esm'],
  // ignoreDeprecations silences the TS6 baseUrl warning that tsup injects into
  // its DTS worker (it defaults baseUrl to "." when the tsconfig omits it).
  dts: { compilerOptions: { skipLibCheck: true, ignoreDeprecations: '6.0', types: ['node'], module: 'ESNext', moduleResolution: 'node' } },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [BARE_SPECIFIER],
  target: 'es2020',
  platform: 'neutral',
});
