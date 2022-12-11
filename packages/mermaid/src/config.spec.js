import isObject from 'lodash-es/isObject.js';
import * as configApi from './config.js';

describe('when working with site config', function () {
  beforeEach(() => {
    // Resets the site config to default config
    configApi.setSiteConfig({});
  });
  it('should set site config and config properly', function () {
    let config_0 = { foo: 'bar', bar: 0 };
    configApi.setSiteConfig(config_0);
    let config_1 = configApi.getSiteConfig();
    let config_2 = configApi.getConfig();
    expect(config_1.foo).toEqual(config_0.foo);
    expect(config_1.bar).toEqual(config_0.bar);
    expect(config_1).toEqual(config_2);
  });
  it('should respect secure keys when applying directives', function () {
    let config_0 = {
      foo: 'bar',
      bar: 'cant-be-changed',
      secure: [...configApi.defaultConfig.secure, 'bar'],
    };
    configApi.setSiteConfig(config_0);
    const directive = { foo: 'baf', bar: 'should-not-be-allowed' };
    const cfg = configApi.updateCurrentConfig(config_0, [directive]);
    expect(cfg.foo).toEqual(directive.foo);
    expect(cfg.bar).toBe(config_0.bar);
  });
  it('should set reset config properly', function () {
    let config_0 = { foo: 'bar', bar: 0 };
    configApi.setSiteConfig(config_0);
    let config_1 = { foo: 'baf' };
    configApi.setConfig(config_1);
    let config_2 = configApi.getConfig();
    expect(config_2.foo).toEqual(config_1.foo);
    configApi.reset();
    let config_3 = configApi.getConfig();
    expect(config_3.foo).toEqual(config_0.foo);
    let config_4 = configApi.getSiteConfig();
    expect(config_4.foo).toEqual(config_0.foo);
  });
  it('should set global reset config properly', function () {
    let config_0 = { foo: 'bar', bar: 0 };
    configApi.setSiteConfig(config_0);
    let config_1 = configApi.getSiteConfig();
    expect(config_1.foo).toEqual(config_0.foo);
    let config_2 = configApi.getConfig();
    expect(config_2.foo).toEqual(config_0.foo);
    configApi.setConfig({ foobar: 'bar0' });
    let config_3 = configApi.getConfig();
    expect(config_3.foobar).toEqual('bar0');
    configApi.reset();
    let config_4 = configApi.getConfig();
    expect(config_4.foobar).toBeUndefined();
  });

  it('test new default config', async function () {
    const { default: oldDefault } = await import('./oldDefaultConfig.js');
    // gitGraph used to not have this option (aka it was `undefined`)
    oldDefault.gitGraph.useMaxWidth = false;

    // class diagrams used to not have these options set (aka they were `undefined`)
    oldDefault.class.htmlLabels = false;

    const { default: newDefault } = await import('./defaultConfig.js');

    // check subsets of the objects, to improve vitest error messages
    // we can't just use `expect(newDefault).to.deep.equal(oldDefault);`
    // because the functions in the config won't be the same
    expect(new Set(Object.keys(newDefault))).to.deep.equal(new Set(Object.keys(oldDefault)));

    for (const key in newDefault) {
      // recurse through object, since we want to treat functions differently
      if (!Array.isArray(newDefault[key]) && isObject(newDefault[key])) {
        expect(new Set(Object.keys(newDefault[key]))).to.deep.equal(
          new Set(Object.keys(oldDefault[key]))
        );
        for (const key2 in newDefault[key]) {
          if (typeof newDefault[key][key2] === 'function') {
            expect(newDefault[key][key2].toString()).to.deep.equal(
              oldDefault[key][key2].toString()
            );
          } else {
            expect(newDefault[key]).to.have.deep.property(key2, oldDefault[key][key2]);
          }
        }
      } else {
        expect(newDefault[key]).to.deep.equal(oldDefault[key]);
      }
    }
  });
});
