import * as configApi from './config.js';
import isObject from 'lodash-es/isObject.js';
import type { MermaidConfig } from './config.type.js';

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

  it('test new default config', async function () {
    const { default: oldDefault } = (await import('./oldDefaultConfig.js')) as {
      default: Required<MermaidConfig>;
    };
    // gitGraph used to not have this option (aka it was `undefined`)
    oldDefault.gitGraph.useMaxWidth = false;

    // class diagrams used to not have these options set (aka they were `undefined`)
    oldDefault.class.htmlLabels = false;

    const { default: newDefault } = await import('./defaultConfig.js');

    // check subsets of the objects, to improve vitest error messages
    // we can't just use `expect(newDefault).to.deep.equal(oldDefault);`
    // because the functions in the config won't be the same
    expect(new Set(Object.keys(newDefault))).to.deep.equal(new Set(Object.keys(oldDefault)));

    // @ts-ignore: Expect that all the keys in newDefault are valid MermaidConfig keys
    Object.keys(newDefault).forEach((key: keyof MermaidConfig) => {
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
    });
  });
});
