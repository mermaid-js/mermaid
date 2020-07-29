/* eslint-env jasmine */
import * as configApi from './config';

describe('when working with site config', function() {
  beforeEach(() => {
    // Resets the site config to default config
    configApi.setSiteConfig({});
  });
  it('should set site config and config properly', function() {
    let config_0 = { foo: 'bar', bar: 0 };
    configApi.setSiteConfig(config_0);
    let config_1 = configApi.getSiteConfig();
    let config_2 = configApi.getConfig();
    expect(config_1.foo).toEqual(config_0.foo);
    expect(config_1.bar).toEqual(config_0.bar);
    expect(config_1).toEqual(config_2);
  });
  it('should respect secure keys when applying directives', function() {
    let config_0 = { foo: 'bar', bar: 'cant-be-changed', secure: [...configApi.defaultConfig.secure, 'bar'] };
    configApi.setSiteConfig(config_0);
    const directive = { foo: 'baf', bar: 'should-not-be-allowed'};
    const cfg = configApi.updateCurrentConfig(config_0,[directive]);
    expect(cfg.foo).toEqual(directive.foo);
    expect(cfg.bar).toBe(config_0.bar)
  });
  it('should set reset config properly', function() {
    let config_0 = { foo: 'bar', bar: 0};
    configApi.setSiteConfig(config_0);
    let config_1 = { foo: 'baf'};
    configApi.setConfig(config_1);
    let config_2 = configApi.getConfig();
    expect(config_2.foo).toEqual(config_1.foo);
    configApi.reset();
    let config_3 = configApi.getConfig();
    expect(config_3.foo).toEqual(config_0.foo);
    let config_4 = configApi.getSiteConfig();
    expect(config_4.foo).toEqual(config_0.foo);
  });
  it('should set global reset config properly', function() {
    let config_0 = { foo: 'bar', bar: 0};
    configApi.setSiteConfig(config_0);
    let config_1 = configApi.getSiteConfig();
    expect(config_1.foo).toEqual(config_0.foo);
    let config_2 = configApi.getConfig();
    expect(config_2.foo).toEqual(config_0.foo);
    configApi.setConfig({ foobar: 'bar0' })
    let config_3 = configApi.getConfig();
    expect(config_3.foobar).toEqual('bar0');
    configApi.reset();
    let config_4 = configApi.getConfig();
    expect(config_4.foobar).toBeUndefined();
  });
});
