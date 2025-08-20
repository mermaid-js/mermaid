import * as configApi from './config.js';
import type { MermaidConfig } from './config.type.js';

describe('when working with site config', () => {
  beforeEach(() => {
    // Resets the site config to default config
    configApi.setSiteConfig({});
  });
  it('should set site config and config properly', () => {
    const config_0 = { fontFamily: 'foo-font', fontSize: 150 };
    configApi.setSiteConfig(config_0);
    const config_1 = configApi.getSiteConfig();
    const config_2 = configApi.getConfig();
    expect(config_1.fontFamily).toEqual(config_0.fontFamily);
    expect(config_1.fontSize).toEqual(config_0.fontSize);
    expect(config_1).toEqual(config_2);
  });
  it('should respect secure keys when applying directives', () => {
    const config_0: MermaidConfig = {
      fontFamily: 'foo-font',
      securityLevel: 'strict', // can't be changed
      fontSize: 12345, // can't be changed
      secure: [...configApi.defaultConfig.secure!, 'fontSize'],
    };
    configApi.setSiteConfig(config_0);
    const directive: MermaidConfig = {
      fontFamily: 'baf',
      // fontSize and securityLevel shouldn't be changed
      fontSize: 54321,
      securityLevel: 'loose',
    };
    const cfg: MermaidConfig = configApi.updateCurrentConfig(config_0, [directive]);
    expect(cfg.fontFamily).toEqual(directive.fontFamily);
    expect(cfg.fontSize).toBe(config_0.fontSize);
    expect(cfg.securityLevel).toBe(config_0.securityLevel);
  });

  it('should respect nested secure keys when applying directives', () => {
    const config_0: MermaidConfig = {
      fontFamily: 'foo-font',
      themeVariables: {
        fontSize: 16,
        fontFamily: 'default-font',
      },
      secure: [
        ...configApi.defaultConfig.secure!,
        'themeVariables.fontSize',
        'themeVariables.fontFamily',
      ],
    };
    configApi.setSiteConfig(config_0);
    const directive: MermaidConfig = {
      fontFamily: 'baf',
      themeVariables: {
        fontSize: 24, // shouldn't be changed
        fontFamily: 'new-font', // shouldn't be changed
        primaryColor: '#ff0000', // should be allowed
      },
    };
    const cfg: MermaidConfig = configApi.updateCurrentConfig(config_0, [directive]);
    expect(cfg.fontFamily).toEqual(directive.fontFamily);
    expect(cfg.themeVariables!.fontSize).toBe(config_0.themeVariables!.fontSize);
    expect(cfg.themeVariables!.fontFamily).toBe(config_0.themeVariables!.fontFamily);
    expect(cfg.themeVariables!.primaryColor).toBe(directive.themeVariables!.primaryColor);
  });

  it('should handle deeply nested secure keys', () => {
    const config_0: MermaidConfig = {
      flowchart: {
        nodeSpacing: 50,
        rankSpacing: 50,
        curve: 'basis',
        htmlLabels: true,
        useMaxWidth: true,
        diagramPadding: 8,
      },
      secure: [
        ...configApi.defaultConfig.secure!,
        'flowchart.nodeSpacing',
        'flowchart.rankSpacing',
      ],
    };
    configApi.setSiteConfig(config_0);
    const directive: MermaidConfig = {
      flowchart: {
        nodeSpacing: 100, // shouldn't be changed
        rankSpacing: 100, // shouldn't be changed
        curve: 'linear', // should be allowed
        htmlLabels: false, // should be allowed
      },
    };
    const cfg: MermaidConfig = configApi.updateCurrentConfig(config_0, [directive]);
    expect(cfg.flowchart!.nodeSpacing).toBe(config_0.flowchart!.nodeSpacing);
    expect(cfg.flowchart!.rankSpacing).toBe(config_0.flowchart!.rankSpacing);
    expect(cfg.flowchart!.curve).toBe(directive.flowchart!.curve);
    expect(cfg.flowchart!.htmlLabels).toBe(directive.flowchart!.htmlLabels);
    expect(cfg.flowchart!.diagramPadding).toBe(config_0.flowchart!.diagramPadding);
  });

  it('should handle mixed top-level and nested secure keys', () => {
    const config_0: MermaidConfig = {
      fontFamily: 'foo-font',
      themeVariables: {
        fontSize: 16,
        primaryColor: '#000000',
      },
      secure: [...configApi.defaultConfig.secure!, 'fontFamily', 'themeVariables.fontSize'],
    };
    configApi.setSiteConfig(config_0);
    const directive: MermaidConfig = {
      fontFamily: 'new-font', // shouldn't be changed
      themeVariables: {
        fontSize: 24, // shouldn't be changed
        primaryColor: '#ff0000', // should be allowed
      },
    };
    const cfg: MermaidConfig = configApi.updateCurrentConfig(config_0, [directive]);
    expect(cfg.fontFamily).toBe(config_0.fontFamily);
    expect(cfg.themeVariables!.fontSize).toBe(config_0.themeVariables!.fontSize);
    expect(cfg.themeVariables!.primaryColor).toBe(directive.themeVariables!.primaryColor);
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
  it('should set global reset config properly', () => {
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
