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

const schema = configSchema as ConfigSchema;
const usecaseDefinition = schema.$defs.UsecaseDiagramConfig;
const baseDefinition = schema.$defs.BaseDiagramConfig;

const supportedConfig = {
  actorFontSize: 14,
  actorFontFamily: '"Open Sans", sans-serif',
  actorFontWeight: 'normal',
  usecaseFontSize: 12,
  usecaseFontFamily: '"Open Sans", sans-serif',
  usecaseFontWeight: 'normal',
  nodeSpacing: 50,
  rankSpacing: 50,
  diagramPadding: 20,
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
        actorFontSize: { default: 14 },
        actorFontFamily: { default: '"Open Sans", sans-serif' },
        actorFontWeight: { default: 'normal' },
        usecaseFontSize: { default: 12 },
        usecaseFontFamily: { default: '"Open Sans", sans-serif' },
        usecaseFontWeight: { default: 'normal' },
        nodeSpacing: { default: 50 },
        rankSpacing: { default: 50 },
        diagramPadding: { default: 20 },
      },
    });
    expect(baseDefinition.properties?.useMaxWidth).toMatchObject({ default: true });
    expect(Object.keys(usecaseDefinition.properties ?? {})).toEqual([
      'actorFontSize',
      'actorFontFamily',
      'actorFontWeight',
      'usecaseFontSize',
      'usecaseFontFamily',
      'usecaseFontWeight',
      'nodeSpacing',
      'rankSpacing',
      'diagramPadding',
    ]);
  });

  it.each(['actorMargin', 'usecaseMargin'])('rejects removed %s in the JSON Schema', (key) => {
    const ajv = new Ajv2019({ allErrors: true, allowUnionTypes: true, strict: true });
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
});
