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

  it('reads a number from an env var', () => {
    process.env['TEST_SETTINGS_NUM'] = '42';
    const settings = createSettings(from => ({ port: from.env('TEST_SETTINGS_NUM', { defaultValue: 0 }) }));
    expect(settings.port).to.equal(42);
    delete process.env['TEST_SETTINGS_NUM'];
  });

  it('uses the numeric defaultValue when env var is absent', () => {
    delete process.env['TEST_SETTINGS_MISSING_NUM'];
    const settings = createSettings(from => ({ port: from.env('TEST_SETTINGS_MISSING_NUM', { defaultValue: 9000 }) }));
    expect(settings.port).to.equal(9000);
  });

  it('reads true from an env var', () => {
    process.env['TEST_SETTINGS_BOOL'] = 'true';
    const settings = createSettings(from => ({ enabled: from.env('TEST_SETTINGS_BOOL', { defaultValue: false }) }));
    expect(settings.enabled).to.be.true;
    delete process.env['TEST_SETTINGS_BOOL'];
  });

  it('reads false from an env var', () => {
    process.env['TEST_SETTINGS_BOOL'] = 'false';
    const settings = createSettings(from => ({ enabled: from.env('TEST_SETTINGS_BOOL', { defaultValue: true }) }));
    expect(settings.enabled).to.be.false;
    delete process.env['TEST_SETTINGS_BOOL'];
  });

  it('reads a string from an env var', () => {
    process.env['TEST_SETTINGS_STR'] = 'hello';
    const settings = createSettings(from => ({ greeting: from.env('TEST_SETTINGS_STR', { defaultValue: '' }) }));
    expect(settings.greeting).to.equal('hello');
    delete process.env['TEST_SETTINGS_STR'];
  });

  it('uses the string defaultValue when env var is absent', () => {
    delete process.env['TEST_SETTINGS_MISSING_STR'];
    const settings = createSettings(from => ({ greeting: from.env('TEST_SETTINGS_MISSING_STR', { defaultValue: 'default' }) }));
    expect(settings.greeting).to.equal('default');
  });

  it('throws when a required env var is missing', () => {
    delete process.env['TEST_SETTINGS_REQUIRED'];
    expect(() => createSettings(from => ({ val: from.env('TEST_SETTINGS_REQUIRED', { isRequired: true, defaultValue: '' }) }))).to.throw();
  });

  it('returns "production" when NODE_ENV is production', () => {
    const prev = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';
    const settings = createSettings(from => ({ mode: from.preset.mode }));
    expect(settings.mode).to.equal('production');
    if (prev === undefined) { delete process.env['NODE_ENV']; } else { process.env['NODE_ENV'] = prev; }
  });

  it('returns "development" when NODE_ENV is development', () => {
    const prev = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';
    const settings = createSettings(from => ({ mode: from.preset.mode }));
    expect(settings.mode).to.equal('development');
    if (prev === undefined) { delete process.env['NODE_ENV']; } else { process.env['NODE_ENV'] = prev; }
  });

  describe('env with object defaultValue', () => {
    afterEach(() => {
      delete process.env['TEST_OBJ_SETTING'];
    });

    it('should throw a descriptive error when env var contains invalid JSON', () => {
      process.env['TEST_OBJ_SETTING'] = 'not-valid-json{';
      expect(() => createSettings(from => ({
        obj: from.env('TEST_OBJ_SETTING', { defaultValue: {} as any }),
      }))).to.throw(/invalid json|could not be parsed/i);
    });

    it('should parse valid JSON object from env var', () => {
      process.env['TEST_OBJ_SETTING'] = '{"key":"value"}';
      const settings = createSettings(from => ({
        obj: from.env<{ key: string }>('TEST_OBJ_SETTING', { defaultValue: {} as any }),
      }));
      expect(settings.obj).to.eql({ key: 'value' });
    });
  });

});
