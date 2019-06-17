import { IMap } from '../extensions';

export function getJsonFileKeys<E extends IMap>(name?: string): E {
  if (name) { return (() => name) as any; }
  let fs: typeof import('fs');
  try {
    fs = require('fs');
  } catch (error) {
    return (() => name) as any;
  }
  let maxCount = 15;
  let foundFile = false;
  return ((file: string) => {
    while (!(foundFile = fs.existsSync(file)) && maxCount > 0) { file = `../${file}`; maxCount--; }
    return foundFile ? file : undefined;
  }) as any;
}