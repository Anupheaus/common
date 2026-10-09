# Node-only code and browser safety

> Which parts of the package are Node-only and the rule that keeps the main browser entry free of Node built-ins.
>
> Status: accepted · Version 1

The main entry (`dist/index.mjs`) is bundled into browser apps, so it imports no Node built-in, statically or dynamically. Anything that needs one either lives in the Node-only entry `@anupheaus/common/node` (`src/node.ts` — for example `useAxiom`, which needs `zlib`) or loads the built-in at call time through `nodeBuiltin(id)`. `pnpm run check:browser-entry` fails the build when the main entry breaks this, and CI runs it before every publish; Common 0.2.10 shipped `zlib`, `fs` and `util` and broke every browser build.

Node-only in this package, so never call them from browser code:

- `createSettings`, which reads `process.env`.
- `is.production`, which reads `process.env.NODE_ENV`.
- `captureConsole`, used in tests.
- The Logger's file output (`filename` in `LoggerSettings`), `useClippedFileLog`, and `Logger.provide`'s `AsyncLocalStorage`.
