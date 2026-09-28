import { defineConfig } from 'tsup';

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
  external: [/^[^./]/],
  target: 'es2020',
  platform: 'neutral',
});
