import { createSettings } from './createSettings';
import { getJsonFileKeys } from './getJsonFileKeys';
import * as path from 'path';
import * as packageJson from '../../package.json';

describe.only('createSettings', () => {

  it('can get settings from a .json file for environment variables and the package.json file for settings', () => {
    const settings = createSettings({
      environmentVariableKeys: getJsonFileKeys<typeof import('../../tests/test-envs.json')>(path.join(__dirname, '../../tests/test-envs.json')),
      packageJsonKeys: getJsonFileKeys<typeof import('../../package.json')>(),
    }, from => ({
      testSetting: from.env('TEST_SETTING'),
      testPort: from.env('TEST_PORT', port => parseInt(port, 10)),
      packageVersion: from.packageJson('version'),
      packageName: from.packageJson('name'),
    }));

    expect(settings.testSetting).to.eql('MySetting');
    expect(settings.testPort).to.eql(8080);
    expect(settings.packageVersion).to.eql(packageJson.version);
    expect(settings.packageName).to.eql(packageJson.name);
  });

});
