// import * as path from 'path';
// import * as packageJson from '../../package.json';
import { createSettings } from './createSettings';
// import { getJsonFileKeys } from './getJsonFileKeys';

describe('createSettings', () => {
  let existingProcessEnvKeys: string[] = [];

  beforeEach(() => {
    existingProcessEnvKeys = Object.keys(process.env);
  });

  afterEach(() => {
    Object.keys(process.env).forEach(key => {
      if (existingProcessEnvKeys.includes(key)) { return; }
      delete process.env[key];
    });
  });

  // it('can get settings from a .json file for environment variables and the package.json file for settings', () => {
  //   const settings = createSettings({
  //     environmentVariableKeys: getJsonFileKeys<typeof import('../../tests/test-envs.json')>(path.join(__dirname, '../../tests/test-envs.json')),
  //     packageJsonKeys: getJsonFileKeys<typeof import('../../package.json')>(),
  //   }, from => ({
  //     testSetting: from.env('TEST_SETTING'),
  //     testPort: from.env('TEST_PORT', port => parseInt(port, 10)),
  //     packageVersion: from.packageJson('version'),
  //     packageName: from.packageJson('name'),
  //   }));

  //   expect(settings.testSetting).to.eql('MySetting');
  //   expect(settings.testPort).to.eql(8080);
  //   expect(settings.packageVersion).to.eql(packageJson.version);
  //   expect(settings.packageName).to.eql(packageJson.name);
  // });

  it('can get settings from process.env', () => {
    process.env['something'] = 'else';
    process.env['someNumber'] = '20';
    process.env['arrayItems'] = '1|2|3|4';
    process.env['someObject'] = '{ "hey": 2 }';
    process.env['noDefault'] = 'black';

    const settings = createSettings(from => ({
      something: from.env('something', { defaultValue: 'boohoo' }),
      somethingOther: from.env('somethingOther', { defaultValue: 'bah' }),
      somethingNotSet: from.env('somethingNotSet', { isRequired: false }),
      someNumber: from.env('someNumber', { defaultValue: 10 }),
      arrayItems: from.env('arrayItems', { defaultValue: [] }),
      someObject: from.env('someObject', { defaultValue: { hey: 5 } }),
      noDefault: from.env('noDefault'),
    }));

    expect(settings).to.have.property('something', 'else');
    expect(settings).to.have.property('somethingOther', 'bah');
    expect(settings).to.have.property('somethingNotSet', undefined);
    expect(settings).to.have.property('someNumber', 20);
    expect(settings).to.have.property('arrayItems').and.to.eql(['1', '2', '3', '4']);
    expect(settings).to.have.property('someObject').and.to.eql({ hey: 2 });
    expect(settings).to.have.property('noDefault', 'black');
  });

  it('raises an exception if a setting is required but not found', () => {
    expect(() => {
      createSettings(from => ({
        something: from.env('something'),
      }));
    }).to.throw('The setting "something" was not found in the environment variables, but this is a required setting.');
  });

});
