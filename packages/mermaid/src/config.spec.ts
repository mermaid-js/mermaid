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

describe('getUserDefinedConfig', () => {
  beforeEach(() => {
    configApi.reset();
  });

  it('should return empty object when no user config is defined', () => {
    const userConfig = configApi.getUserDefinedConfig();
    expect(userConfig).toEqual({});
  });

  it('should return config from initialize only', () => {
    const initConfig: MermaidConfig = { theme: 'dark', fontFamily: 'Arial' };
    configApi.saveConfigFromInitialize(initConfig);

    const userConfig = configApi.getUserDefinedConfig();
    expect(userConfig).toEqual(initConfig);
  });

  it('should return config from directives only', () => {
    const directive1: MermaidConfig = { layout: 'elk', fontSize: 14 };
    const directive2: MermaidConfig = { theme: 'forest' };

    configApi.addDirective(directive1);
    configApi.addDirective(directive2);

    const userConfig = configApi.getUserDefinedConfig();
    expect(userConfig.layout).toBe('elk');
    expect(userConfig.fontSize).toBe(14);
    expect(userConfig.theme).toBe('forest');
  });

  it('should combine initialize config and directives', () => {
    const initConfig: MermaidConfig = { theme: 'dark', fontFamily: 'Arial', layout: 'dagre' };
    const directive1: MermaidConfig = { layout: 'elk', fontSize: 14 };
    const directive2: MermaidConfig = { theme: 'forest' };

    configApi.saveConfigFromInitialize(initConfig);
    configApi.addDirective(directive1);
    configApi.addDirective(directive2);

    const userConfig = configApi.getUserDefinedConfig();
    expect(userConfig.theme).toBe('forest');
    expect(userConfig.fontFamily).toBe('Arial');
    expect(userConfig.layout).toBe('elk');
    expect(userConfig.fontSize).toBe(14);
  });

  it('should handle nested config objects properly', () => {
    const initConfig: MermaidConfig = {
      flowchart: { nodeSpacing: 50, rankSpacing: 100 },
      theme: 'default',
    };
    const directive: MermaidConfig = {
      flowchart: { nodeSpacing: 75, curve: 'basis' },
      mindmap: { padding: 20 },
    };

    configApi.saveConfigFromInitialize(initConfig);
    configApi.addDirective(directive);

    const userConfig = configApi.getUserDefinedConfig();
    expect(userConfig).toEqual({
      theme: 'default',
      flowchart: {
        nodeSpacing: 75,
        rankSpacing: 100,
        curve: 'basis',
      },
      mindmap: {
        padding: 20,
      },
    });
  });

  it('should handle complex nested overrides', () => {
    const initConfig: MermaidConfig = {
      flowchart: {
        nodeSpacing: 50,
        rankSpacing: 100,
        curve: 'linear',
      },
      theme: 'default',
    };
    const directive1: MermaidConfig = {
      flowchart: {
        nodeSpacing: 75,
      },
      fontSize: 12,
    };
    const directive2: MermaidConfig = {
      flowchart: {
        curve: 'basis',
        nodeSpacing: 100,
      },
      mindmap: {
        padding: 15,
      },
    };

    configApi.saveConfigFromInitialize(initConfig);
    configApi.addDirective(directive1);
    configApi.addDirective(directive2);

    const userConfig = configApi.getUserDefinedConfig();
    expect(userConfig).toEqual({
      theme: 'default',
      fontSize: 12,
      flowchart: {
        nodeSpacing: 100,
        rankSpacing: 100,
        curve: 'basis',
      },
      mindmap: {
        padding: 15,
      },
    });
  });

  it('should return independent copies (not references)', () => {
    const initConfig: MermaidConfig = { theme: 'dark', flowchart: { nodeSpacing: 50 } };
    configApi.saveConfigFromInitialize(initConfig);

    const userConfig1 = configApi.getUserDefinedConfig();
    const userConfig2 = configApi.getUserDefinedConfig();

    userConfig1.theme = 'neutral';
    userConfig1.flowchart!.nodeSpacing = 999;

    expect(userConfig2.theme).toBe('dark');
    expect(userConfig2.flowchart!.nodeSpacing).toBe(50);
  });

  it('should handle edge cases with undefined values', () => {
    const initConfig: MermaidConfig = { theme: 'dark', layout: undefined };
    const directive: MermaidConfig = { fontSize: 14, fontFamily: undefined };

    configApi.saveConfigFromInitialize(initConfig);
    configApi.addDirective(directive);

    const userConfig = configApi.getUserDefinedConfig();
    expect(userConfig.theme).toBe('dark');
    expect(userConfig.layout).toBeUndefined();
    expect(userConfig.fontFamily).toBeUndefined();
    expect(userConfig.fontSize).toBe(14);
  });

  it('should work correctly after reset', () => {
    const initConfig: MermaidConfig = { theme: 'dark' };
    const directive: MermaidConfig = { layout: 'elk' };

    configApi.saveConfigFromInitialize(initConfig);
    configApi.addDirective(directive);

    let userConfig = configApi.getUserDefinedConfig();
    expect(userConfig).toEqual({ theme: 'dark', layout: 'elk' });

    configApi.reset();

    userConfig = configApi.getUserDefinedConfig();
    expect(userConfig).toEqual({ theme: 'dark' });
  });
});
