/* eslint-env jasmine */
import configApi from './config';

describe('when working with site config', function() {
  beforeEach(() => {
    configApi.reset(configApi.defaultConfig);
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
  it('should set config and respect secure keys', function() {
    let config_0 = { foo: 'bar', bar: 0, secure: [...configApi.defaultConfig.secure, 'bar'] };
    configApi.setSiteConfig(config_0);
    let config_1 = { foo: 'baf', bar: 'foo'};
    configApi.setConfig(config_1);
    let config_2 = configApi.getConfig();
    expect(config_2.foo).toEqual(config_1.foo);
    expect(config_2.bar).toEqual(0); // Should be siteConfig.bar
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
    configApi.reset(configApi.defaultConfig);
    let config_3 = configApi.getSiteConfig();
    expect(config_3.foo).toBeUndefined();
    let config_4 = configApi.getConfig();
    expect(config_4.foo).toBeUndefined();
  });
});
