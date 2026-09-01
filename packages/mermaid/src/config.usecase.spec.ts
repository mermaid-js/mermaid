import _Ajv2019 from 'ajv/dist/2019.js';
import { defaultConfig } from './config.js';
import type { UsecaseDiagramConfig } from './config.type.js';
// @ts-expect-error Vite's JSON Schema plugin supplies this module during tests.
import configSchema from './schemas/config.schema.yaml';

const Ajv2019 = _Ajv2019 as unknown as typeof _Ajv2019.default;

interface SchemaDefinition {
  allOf?: { $ref: string }[];
  unevaluatedProperties?: boolean;
  required?: string[];
  properties?: Record<string, { default?: unknown }>;
}

interface ConfigSchema {
  $schema: string;
  $defs: Record<string, SchemaDefinition>;
}

/**
 * `BaseDiagramConfig` carries the shared `theme` definition, whose `meta:enum` is
 * documentation for jsonschema2md rather than a validation keyword. Ajv's strict mode
 * refuses to compile a schema containing a keyword it has never heard of, so declare it
 * here the same way the schema build scripts do.
 */
const compileUsecaseSchema = () => {
  const ajv = new Ajv2019({ allErrors: true, allowUnionTypes: true, strict: true });
  ajv.addKeyword({ keyword: 'meta:enum', errors: false });
  ajv.addKeyword({ keyword: 'tsType', errors: false });
  return ajv;
};

const schema = configSchema as ConfigSchema;
const usecaseDefinition = schema.$defs.UsecaseDiagramConfig;
const baseDefinition = schema.$defs.BaseDiagramConfig;

const supportedConfig = {
  // The usecase diagram is one of the types that declares its own appearance
  // defaults, so they are part of its runtime config surface.
  theme: 'redux-color',
  look: 'neo',
  actorFontSize: 14,
  actorFontFamily: '"Open Sans", sans-serif',
  actorFontWeight: 'normal',
  usecaseFontSize: 12,
  usecaseFontFamily: '"Open Sans", sans-serif',
  usecaseFontWeight: 'normal',
  nodeSpacing: 50,
  rankSpacing: 50,
  diagramPadding: 20,
  colorScheme: 'role',
  useMaxWidth: true,
} satisfies UsecaseDiagramConfig;

describe('usecase configuration', () => {
  it('provides the schema-backed runtime defaults', () => {
    expect(defaultConfig.usecase).toStrictEqual(supportedConfig);
  });

  it('generates the supported TypeScript properties without removed margins', () => {
    const actorMargin: UsecaseDiagramConfig = {
      // @ts-expect-error actorMargin was removed from the generated configuration contract.
      actorMargin: 50,
    };
    const usecaseMargin: UsecaseDiagramConfig = {
      // @ts-expect-error usecaseMargin was removed from the generated configuration contract.
      usecaseMargin: 50,
    };

    expect(actorMargin).toBeDefined();
    expect(usecaseMargin).toBeDefined();
  });

  it('defines the exact usecase defaults in the authoritative schema', () => {
    expect(usecaseDefinition).toMatchObject({
      allOf: [{ $ref: '#/$defs/BaseDiagramConfig' }],
      unevaluatedProperties: false,
      required: ['useMaxWidth'],
      properties: {
        theme: { default: 'redux-color' },
        look: { default: 'neo' },
        actorFontSize: { default: 14 },
        actorFontFamily: { default: '"Open Sans", sans-serif' },
        actorFontWeight: { default: 'normal' },
        usecaseFontSize: { default: 12 },
        usecaseFontFamily: { default: '"Open Sans", sans-serif' },
        usecaseFontWeight: { default: 'normal' },
        nodeSpacing: { default: 50 },
        rankSpacing: { default: 50 },
        diagramPadding: { default: 20 },
        // `role` is the default deliberately: colour keyed to the kind of element is
        // invariant under insertion and reordering, where the rotating palette is not.
        colorScheme: { default: 'role' },
      },
    });
    expect(baseDefinition.properties?.useMaxWidth).toMatchObject({ default: true });
    expect(Object.keys(usecaseDefinition.properties ?? {})).toEqual([
      'theme',
      'look',
      'actorFontSize',
      'actorFontFamily',
      'actorFontWeight',
      'usecaseFontSize',
      'usecaseFontFamily',
      'usecaseFontWeight',
      'nodeSpacing',
      'rankSpacing',
      'diagramPadding',
      'colorScheme',
    ]);
  });

  it.each(['actorMargin', 'usecaseMargin'])('rejects removed %s in the JSON Schema', (key) => {
    const ajv = compileUsecaseSchema();
    const validate = ajv.compile({
      $schema: schema.$schema,
      $defs: { BaseDiagramConfig: baseDefinition },
      ...usecaseDefinition,
    });

    expect(validate({ ...supportedConfig, [key]: 50 })).toBe(false);
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        keyword: 'unevaluatedProperties',
        params: { unevaluatedProperty: key },
      })
    );
  });

  // These four values are written verbatim into inline CSS custom properties and read back
  // through var(), so the schema states the accepted surface rather than relying on the
  // implicit guarantees of addDirective's sanitize() and setProperty().
  describe('font pattern constraints', () => {
    const compile = () => {
      const ajv = compileUsecaseSchema();
      return ajv.compile({
        $schema: schema.$schema,
        $defs: { BaseDiagramConfig: baseDefinition },
        ...usecaseDefinition,
      });
    };

    it.each(['actorFontFamily', 'usecaseFontFamily'])('accepts real font stacks for %s', (key) => {
      const validate = compile();
      for (const value of [
        '"Open Sans", sans-serif',
        "'Segoe UI', Roboto, Helvetica, sans-serif",
        'Arial Black',
        'Noto Sans JP, sans-serif',
        '',
      ]) {
        expect(validate({ ...supportedConfig, [key]: value })).toBe(true);
      }
    });

    it.each(['actorFontFamily', 'usecaseFontFamily'])(
      'rejects CSS-terminating characters for %s',
      (key) => {
        const validate = compile();
        for (const value of [
          'Arial; background: red',
          'url(https://example.com/x)',
          '<script>',
          'Arial} .node {fill:red',
          String.raw`Arial\3b `,
        ]) {
          expect(validate({ ...supportedConfig, [key]: value })).toBe(false);
        }
      }
    );

    it.each(['actorFontWeight', 'usecaseFontWeight'])('accepts CSS weights for %s', (key) => {
      const validate = compile();
      for (const value of ['normal', 'bold', 'bolder', 'lighter', '400', '700', '1000']) {
        expect(validate({ ...supportedConfig, [key]: value })).toBe(true);
      }
    });

    it.each(['actorFontWeight', 'usecaseFontWeight'])('rejects arbitrary text for %s', (key) => {
      const validate = compile();
      for (const value of ['normal; background: red', 'heavy', '', '0', 'url(x)']) {
        expect(validate({ ...supportedConfig, [key]: value })).toBe(false);
      }
    });
  });
});
