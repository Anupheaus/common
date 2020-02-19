// import { IMap } from '../extensions';
// import { getFS } from './utils';

// export function getJsonFileKeys<E extends IMap>(name?: string): E {
//   if (name) { return (() => name) as unknown as E; }
//   const fs = getFS(false);
//   if (!fs) { return (() => name) as unknown as E; }
//   let maxCount = 15;
//   let foundFile = false;
//   return ((file: string) => {
//     while (!(foundFile = fs.existsSync(file)) && maxCount > 0) { file = `../${file}`; maxCount--; }
//     return foundFile ? file : undefined;
//   }) as unknown as E;
// }
