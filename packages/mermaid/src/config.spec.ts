/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as configApi from './config.js';
import type { MermaidConfig } from './config.type.js';

describe('when working with site config', () => {
  beforeEach(() => {
    // Resets the site config to default config
    configApi.setSiteConfig({});
  });
  it('should set site config and config properly', () => {
    const config0 = { fontFamily: 'foo-font', fontSize: 150 };
    configApi.setSiteConfig(config0);
    const config1 = configApi.getSiteConfig();
    const config2 = configApi.getConfig();
    expect(config1.fontFamily).toEqual(config0.fontFamily);
    expect(config1.fontSize).toEqual(config0.fontSize);
    expect(config1).toEqual(config2);
  });
  it('should respect secure keys when applying directives', () => {
    const config0: MermaidConfig = {
      fontFamily: 'foo-font',
      securityLevel: 'strict', // can't be changed
      fontSize: 12345, // can't be changed
      secure: [...configApi.defaultConfig.secure!, 'fontSize'],
    };
    configApi.setSiteConfig(config0);
    const directive: MermaidConfig = {
      fontFamily: 'baf',
      // fontSize and securityLevel shouldn't be changed
      fontSize: 54321,
      securityLevel: 'loose',
    };
    const cfg: MermaidConfig = configApi.updateCurrentConfig(config0, [directive]);
    expect(cfg.fontFamily).toEqual(directive.fontFamily);
    expect(cfg.fontSize).toBe(config0.fontSize);
    expect(cfg.securityLevel).toBe(config0.securityLevel);
  });
  it('should allow setting partial options', () => {
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
  it('should set reset config properly', () => {
    const config0 = { fontFamily: 'foo-font', fontSize: 150 };
    configApi.setSiteConfig(config0);
    const config1 = { fontFamily: 'baf' };
    configApi.setConfig(config1);
    const config2 = configApi.getConfig();
    expect(config2.fontFamily).toEqual(config1.fontFamily);
    configApi.reset();
    const config3 = configApi.getConfig();
    expect(config3.fontFamily).toEqual(config0.fontFamily);
    const config4 = configApi.getSiteConfig();
    expect(config4.fontFamily).toEqual(config0.fontFamily);
  });
  it('should set global reset config properly', () => {
    const config0 = { fontFamily: 'foo-font', fontSize: 150 };
    configApi.setSiteConfig(config0);
    const config1 = configApi.getSiteConfig();
    expect(config1.fontFamily).toEqual(config0.fontFamily);
    const config2 = configApi.getConfig();
    expect(config2.fontFamily).toEqual(config0.fontFamily);
    configApi.setConfig({ altFontFamily: 'bar-font' });
    const config3 = configApi.getConfig();
    expect(config3.altFontFamily).toEqual('bar-font');
    configApi.reset();
    const config4 = configApi.getConfig();
    expect(config4.altFontFamily).toBeUndefined();
  });
});
