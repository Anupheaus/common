import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['cjs', 'esm'],
  dts: { compilerOptions: { skipLibCheck: true, declarationMap: true } },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [/^[^./]/],
  target: 'es2020',
  platform: 'neutral',
});
