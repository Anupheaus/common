import fs from 'fs';
import path from 'path';
import type { AnyObject } from '../extensions';

function stripToOnlyPrintableCharacters(str: string) {
  // eslint-disable-next-line no-useless-escape
  return str.replace(/[^a-zA-Z0-9\s\.,;:<>!@#$%^&*()_+={}\[\]|\-`~\\/?'"<>]/g, '');
}

let hasRaisedError = false;
const checkedFiles = new Set<string>();

export function writeToFile(filename: string, message: string, meta: AnyObject | undefined) {
  message = stripToOnlyPrintableCharacters(message);
  const fullMessage = `${message}\n${meta != null ? `${JSON.stringify(meta, undefined, 2)}\n` : ''}`;
  try {
    if (!checkedFiles.has(filename)) {
      checkedFiles.add(filename);
      if (!fs.existsSync(path.dirname(filename))) fs.mkdirSync(path.dirname(filename), { recursive: true });
      if (fs.existsSync(filename)) fs.rmSync(filename);
    }
    fs.writeFileSync(filename, fullMessage, { flag: 'a', mode: 0o666, encoding: 'utf8' });
  } catch (err) {
    if (hasRaisedError) return;
    hasRaisedError = true;
    // eslint-disable-next-line no-console
    console.error(`Error writing to file: ${filename}`, err);
  }
}
