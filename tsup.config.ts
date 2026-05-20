import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  // ignoreDeprecations silences the TS6 baseUrl warning that tsup injects into
  // its DTS worker (it defaults baseUrl to "." when the tsconfig omits it).
  dts: { compilerOptions: { skipLibCheck: true, declarationMap: true, ignoreDeprecations: '6.0', types: ['node'] } },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [/^[^./]/],
  target: 'es2020',
  platform: 'neutral',
});
