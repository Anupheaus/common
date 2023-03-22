import fs from 'fs';
import path from 'path';
import { AnyObject } from '../extensions';

const fileName = path.join(__dirname, 'log.txt');

export function writeToFile(message: string, meta: AnyObject | undefined) {
  fs.writeFileSync(fileName, `${message} ${JSON.stringify(meta)}`, { flag: 'a', mode: 0o666, encoding: 'utf8' });
}
