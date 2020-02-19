// type typeofFS = typeof import('fs');

// export function getFS(throwErrorOnFSNotFound = true): typeofFS {
//   const fsModule = `${'f'}s`;
//   if (!require.resolve(fsModule)) {
//     if (throwErrorOnFSNotFound) { throw new Error('Trying to use fs in a client environment.'); }
//   }
//   return require(fsModule);
// }