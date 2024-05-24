import { load, JSON_SCHEMA } from 'js-yaml';
import assert from 'node:assert';
import Ajv2019, { type JSONSchemaType } from 'ajv/dist/2019.js';
import type { MermaidConfig, BaseDiagramConfig } from '../packages/mermaid/src/config.type.js';

/**
 * All of the keys in the mermaid config that have a mermaid diagram config.
 */
const MERMAID_CONFIG_DIAGRAM_KEYS = [
  'flowchart',
  'sequence',
  'gantt',
  'journey',
  'class',
  'state',
  'er',
  'pie',
  'quadrantChart',
  'xyChart',
  'requirement',
  'mindmap',
  'timeline',
  'gitGraph',
  'c4',
  'sankey',
  'block',
  'packet',
] as const;

/**
 * Generate default values from the JSON Schema.
 *
 * AJV does not support nested default values yet (or default values with $ref),
 * so we need to manually find them (this may be fixed in ajv v9).
 *
 * @param mermaidConfigSchema - The Mermaid JSON Schema to use.
 * @returns The default mermaid config object.
 */
function generateDefaults(mermaidConfigSchema: JSONSchemaType<MermaidConfig>) {
  const ajv = new Ajv2019({
    useDefaults: true,
    allowUnionTypes: true,
    strict: true,
  });

  ajv.addKeyword({
    keyword: 'meta:enum', // used by jsonschema2md
    errors: false,
  });
  ajv.addKeyword({
    keyword: 'tsType', // used by json-schema-to-typescript
    errors: false,
  });

  // ajv currently doesn't support nested default values, see https://github.com/ajv-validator/ajv/issues/1718
  // (may be fixed in v9) so we need to manually use sub-schemas
  const mermaidDefaultConfig = {};

  assert.ok(mermaidConfigSchema.$defs);
  const baseDiagramConfig = mermaidConfigSchema.$defs.BaseDiagramConfig;

  for (const key of MERMAID_CONFIG_DIAGRAM_KEYS) {
    const subSchemaRef = mermaidConfigSchema.properties[key].$ref;
    const [root, defs, defName] = subSchemaRef.split('/');
    assert.strictEqual(root, '#');
    assert.strictEqual(defs, '$defs');
    const subSchema = {
      $schema: mermaidConfigSchema.$schema,
      $defs: mermaidConfigSchema.$defs,
      ...mermaidConfigSchema.$defs[defName],
    } as JSONSchemaType<BaseDiagramConfig>;

    const validate = ajv.compile(subSchema);

    mermaidDefaultConfig[key] = {};

    for (const required of subSchema.required ?? []) {
      if (subSchema.properties[required] === undefined && baseDiagramConfig.properties[required]) {
        mermaidDefaultConfig[key][required] = baseDiagramConfig.properties[required].default;
      }
    }
    if (!validate(mermaidDefaultConfig[key])) {
      throw new Error(
        `schema for subconfig ${key} does not have valid defaults! Errors were ${JSON.stringify(
          validate.errors,
          undefined,
          2
        )}`
      );
    }
  }

  const validate = ajv.compile(mermaidConfigSchema);

  if (!validate(mermaidDefaultConfig)) {
    throw new Error(
      `Mermaid config JSON Schema does not have valid defaults! Errors were ${JSON.stringify(
        validate.errors,
        undefined,
        2
      )}`
    );
  }

  return mermaidDefaultConfig;
}

export const loadSchema = (src: string, filename: string): JSONSchemaType<MermaidConfig> => {
  const jsonSchema = load(src, {
    filename,
    // only allow JSON types in our YAML doc (will probably be default in YAML 1.3)
    // e.g. `true` will be parsed a boolean `true`, `True` will be parsed as string `"True"`.
    schema: JSON_SCHEMA,
  }) as JSONSchemaType<MermaidConfig>;
  return jsonSchema;
};

export const getDefaults = (schema: JSONSchemaType<MermaidConfig>) => {
  return `export default ${JSON.stringify(generateDefaults(schema), undefined, 2)};`;
};

export const getSchema = (schema: JSONSchemaType<MermaidConfig>) => {
  return `export default ${JSON.stringify(schema, undefined, 2)};`;
};
