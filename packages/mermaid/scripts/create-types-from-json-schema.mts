/**
 * Script to load Mermaid Config JSON Schema from YAML and to:
 *
 * - Validate JSON Schema
 *
 * Then to generate:
 *
 * - config.types.ts TypeScript file
 */

/* eslint-disable no-console */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { load, JSON_SCHEMA } from 'js-yaml';
import { compile, type JSONSchema } from 'json-schema-to-typescript';
import prettier from 'prettier';

import _Ajv2019, { type JSONSchemaType } from 'ajv/dist/2019.js';

// Workaround for wrong AJV types, see
// https://github.com/ajv-validator/ajv/issues/2132#issuecomment-1290409907
const Ajv2019 = _Ajv2019 as unknown as typeof _Ajv2019.default;

// !!! -- The config.type.js file is created by this script -- !!!
import type { MermaidConfig } from '../src/config.type.js';

// options for running the main command
const verifyOnly = process.argv.includes('--verify');
/** If `true`, automatically `git add` any changes (i.e. during `pnpm run pre-commit`)*/
const git = process.argv.includes('--git');

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
];

/**
 * Loads the MermaidConfig JSON schema YAML file.
 *
 * @returns The loaded JSON Schema, use {@link validateSchema} to confirm it is a valid JSON Schema.
 */
async function loadJsonSchemaFromYaml() {
  const configSchemaFile = join('src', 'schemas', 'config.schema.yaml');
  const contentsYaml = await readFile(configSchemaFile, { encoding: 'utf8' });
  const jsonSchema = load(contentsYaml, {
    filename: configSchemaFile,
    // only allow JSON types in our YAML doc (will probably be default in YAML 1.3)
    // e.g. `true` will be parsed a boolean `true`, `True` will be parsed as string `"True"`.
    schema: JSON_SCHEMA,
  });
  return jsonSchema;
}

/**
 * Asserts that the given value is a valid JSON Schema object.
 *
 * @param jsonSchema - The value to validate as JSON Schema 2019-09
 * @throws {Error} if the given object is invalid.
 */
function validateSchema(jsonSchema: unknown): asserts jsonSchema is JSONSchemaType<MermaidConfig> {
  if (typeof jsonSchema !== 'object') {
    throw new Error(`jsonSchema param is not an object: actual type is ${typeof jsonSchema}`);
  }
  if (jsonSchema === null) {
    throw new Error('jsonSchema param must not be null');
  }
  const ajv = new Ajv2019({
    allErrors: true,
    allowUnionTypes: true,
    strict: true,
  });

  ajv.addKeyword({
    keyword: 'meta:enum', // used by jsonschema2md (in docs.mts script)
    errors: false,
  });
  ajv.addKeyword({
    keyword: 'tsType', // used by json-schema-to-typescript
    errors: false,
  });

  ajv.compile(jsonSchema);
}

/**
 * Generate a typescript definition from a JSON Schema using json-schema-to-typescript.
 *
 * @param mermaidConfigSchema - The input JSON Schema.
 */
async function generateTypescript(mermaidConfigSchema: JSONSchemaType<MermaidConfig>) {
  /**
   * Replace all usages of `allOf` with `extends`.
   *
   * `extends` is only valid JSON Schema in very old versions of JSON Schema.
   * However, json-schema-to-typescript creates much nicer types when using
   * `extends`, so we should use them instead when possible.
   *
   * @param schema - The input schema.
   * @returns The schema with `allOf` replaced with `extends`.
   */
  function replaceAllOfWithExtends(schema: JSONSchemaType<Record<string, any>>) {
    if (schema['allOf']) {
      const { allOf, ...schemaWithoutAllOf } = schema;
      return {
        ...schemaWithoutAllOf,
        extends: allOf,
      };
    }
    return schema;
  }

  /**
   * For backwards compatibility with older Mermaid Typescript defs,
   * we need to make all value optional instead of required.
   *
   * This is because the `MermaidConfig` type is used as an input, and everything is optional,
   * since all the required values have default values.s
   *
   * In the future, we should make make the input to Mermaid `Partial<MermaidConfig>`.
   *
   * @todo TODO: Remove this function when Mermaid releases a new breaking change.
   * @param schema - The input schema.
   * @returns The schema with all required values removed.
   */
  function removeRequired(schema: JSONSchemaType<Record<string, any>>) {
    return { ...schema, required: [] };
  }

  /**
   * This is a temporary hack to control the order the types are generated in.
   *
   * By default, json-schema-to-typescript outputs the $defs in the order they
   * are used, then any unused schemas at the end.
   *
   * **The only purpose of this function is to make the `git diff` simpler**
   * **We should remove this later to simplify the code**
   *
   * @todo TODO: Remove this function in a future PR.
   * @param schema - The input schema.
   * @returns The schema with all `$ref`s removed.
   */
  function unrefSubschemas(schema: JSONSchemaType<Record<string, any>>) {
    return {
      ...schema,
      properties: Object.fromEntries(
        Object.entries(schema.properties).map(([key, propertySchema]) => {
          if (MERMAID_CONFIG_DIAGRAM_KEYS.includes(key)) {
            const { $ref, ...propertySchemaWithoutRef } = propertySchema as JSONSchemaType<unknown>;
            if ($ref === undefined) {
              throw Error(
                `subSchema ${key} is in MERMAID_CONFIG_DIAGRAM_KEYS but does not have a $ref field`
              );
            }
            const [
              _root, // eslint-disable-line @typescript-eslint/no-unused-vars
              _defs, // eslint-disable-line @typescript-eslint/no-unused-vars
              defName,
            ] = $ref.split('/');
            return [
              key,
              {
                ...propertySchemaWithoutRef,
                tsType: defName,
              },
            ];
          }
          return [key, propertySchema];
        })
      ),
    };
  }

  assert.ok(mermaidConfigSchema.$defs);
  const modifiedSchema = {
    ...unrefSubschemas(removeRequired(mermaidConfigSchema)),

    $defs: Object.fromEntries(
      Object.entries(mermaidConfigSchema.$defs).map(([key, subSchema]) => {
        return [key, removeRequired(replaceAllOfWithExtends(subSchema))];
      })
    ),
  };

  const typescriptFile = await compile(
    modifiedSchema as JSONSchema, // json-schema-to-typescript only allows JSON Schema 4 as input type
    'MermaidConfig',
    {
      additionalProperties: false, // in JSON Schema 2019-09, these are called `unevaluatedProperties`
      unreachableDefinitions: true, // definition for FontConfig is unreachable
      style: (await prettier.resolveConfig('.')) ?? {},
    }
  );

  // TODO, should we somehow use the functions from `docs.mts` instead?
  if (verifyOnly) {
    const originalFile = await readFile('./src/config.type.ts', { encoding: 'utf-8' });
    if (typescriptFile !== originalFile) {
      console.error('❌ Error: ./src/config.type.ts will be changed.');
      console.error("Please run 'pnpm run --filter mermaid types:build-config' to update this");
      process.exitCode = 1;
    } else {
      console.log('✅ ./src/config.type.ts will be unchanged');
    }
  } else {
    console.log('Writing typescript file to ./src/config.type.ts');
    await writeFile('./src/config.type.ts', typescriptFile, { encoding: 'utf8' });
    if (git) {
      console.log('📧 Git: Adding ./src/config.type.ts changed');
      await promisify(execFile)('git', ['add', './src/config.type.ts']);
    }
  }
}

/** Main function */
async function main() {
  if (verifyOnly) {
    console.log(
      'Verifying that ./src/config.type.ts is in sync with src/schemas/config.schema.yaml'
    );
  }

  const configJsonSchema = await loadJsonSchemaFromYaml();

  validateSchema(configJsonSchema);

  // Generate types from JSON Schema
  await generateTypescript(configJsonSchema);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
