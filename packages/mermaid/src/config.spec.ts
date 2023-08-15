import * as configApi from './config.js';

describe('when working with site config', function () {
  beforeEach(() => {
    // Resets the site config to default config
    configApi.setSiteConfig({});
  });
  it('should set site config and config properly', function () {
    const config_0 = { fontFamily: 'foo-font', fontSize: 150 };
    configApi.setSiteConfig(config_0);
    const config_1 = configApi.getSiteConfig();
    const config_2 = configApi.getConfig();
    expect(config_1.fontFamily).toEqual(config_0.fontFamily);
    expect(config_1.fontSize).toEqual(config_0.fontSize);
    expect(config_1).toEqual(config_2);
  });
  it('should respect secure keys when applying directives', function () {
    const config_0 = {
      fontFamily: 'foo-font',
      fontSize: 12345, // can't be changed
      secure: [...configApi.defaultConfig.secure!, 'fontSize'],
    };
    configApi.setSiteConfig(config_0);
    const directive = { fontFamily: 'baf', fontSize: 54321 /* fontSize shouldn't be changed */ };
    const cfg = configApi.updateCurrentConfig(config_0, [directive]);
    expect(cfg.fontFamily).toEqual(directive.fontFamily);
    expect(cfg.fontSize).toBe(config_0.fontSize);
  });
  it('should allow setting partial options', function () {
    const defaultConfig = configApi.getConfig();

    configApi.setConfig({
      quadrantChart: {
        chartHeight: 600,
      },
    });

    const updatedConfig = configApi.getConfig();

    // deep options we didn't update should remain the same
    expect(defaultConfig.quadrantChart!.chartWidth).toEqual(
      updatedConfig.quadrantChart!.chartWidth
    );
  });
  it('should set reset config properly', function () {
    const config_0 = { fontFamily: 'foo-font', fontSize: 150 };
    configApi.setSiteConfig(config_0);
    const config_1 = { fontFamily: 'baf' };
    configApi.setConfig(config_1);
    const config_2 = configApi.getConfig();
    expect(config_2.fontFamily).toEqual(config_1.fontFamily);
    configApi.reset();
    const config_3 = configApi.getConfig();
    expect(config_3.fontFamily).toEqual(config_0.fontFamily);
    const config_4 = configApi.getSiteConfig();
    expect(config_4.fontFamily).toEqual(config_0.fontFamily);
  });
  it('should set global reset config properly', function () {
    const config_0 = { fontFamily: 'foo-font', fontSize: 150 };
    configApi.setSiteConfig(config_0);
    const config_1 = configApi.getSiteConfig();
    expect(config_1.fontFamily).toEqual(config_0.fontFamily);
    const config_2 = configApi.getConfig();
    expect(config_2.fontFamily).toEqual(config_0.fontFamily);
    configApi.setConfig({ altFontFamily: 'bar-font' });
    const config_3 = configApi.getConfig();
    expect(config_3.altFontFamily).toEqual('bar-font');
    configApi.reset();
    const config_4 = configApi.getConfig();
    expect(config_4.altFontFamily).toBeUndefined();
  });
});
