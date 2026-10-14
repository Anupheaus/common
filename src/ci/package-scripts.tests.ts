import { readFileSync } from 'fs';
import path from 'path';

/**
 * Guards the default test script staying one-shot.
 *
 * `pnpm run test` is the script Forge's full suite (and humans) run to verify the repo. A `--watch`
 * flag there makes mocha wait for file changes after the last test, so the suite never exits and any
 * CI run is killed by its timeout. Watch mode belongs in its own script.
 */
interface PackageJson {
  scripts?: Record<string, string>;
}

const PACKAGE_PATH = path.resolve(process.cwd(), 'package.json');

function readPackageScripts(): Record<string, string> {
  const packageJson = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8')) as PackageJson;
  return packageJson.scripts ?? {};
}

describe('package scripts', () => {
  it('keeps the default test script one-shot so the suite exits', () => {
    expect(readPackageScripts().test).to.not.contain('--watch');
  });

  it('keeps watch mode in its own script for development', () => {
    expect(readPackageScripts()['test:watch']).to.contain('--watch');
  });
});
