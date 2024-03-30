import fs from 'fs';
import { AnyObject } from '../extensions';

function stripToOnlyPrintableCharacters(str: string) {
  // eslint-disable-next-line no-useless-escape
  return str.replace(/[^a-zA-Z0-9\s\.,;:<>!@#$%^&*()_+={}\[\]|\-`~\\/?'"<>]/g, '');
}

export function writeToFile(filename: string, message: string, meta: AnyObject | undefined) {
  message = stripToOnlyPrintableCharacters(message);
  const fullMessage = `${message}\n${meta != null ? `${JSON.stringify(meta, undefined, 2)}\n` : ''}`;
  fs.writeFileSync(filename, fullMessage, { flag: 'a', mode: 0o666, encoding: 'utf8' });
}
