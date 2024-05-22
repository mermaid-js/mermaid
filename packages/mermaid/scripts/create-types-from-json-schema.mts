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

import _Ajv2019, { type JSONSchemaType } from 'ajv/dist/2019.js';
import { JSON_SCHEMA, load } from 'js-yaml';
import { compile, type JSONSchema } from 'json-schema-to-typescript';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import prettier from 'prettier';

// Workaround for wrong AJV types, see
// https://github.com/ajv-validator/ajv/issues/2132#issuecomment-1290409907
const Ajv2019 = _Ajv2019 as unknown as typeof _Ajv2019.default;

// !!! -- The config.type.js file is created by this script -- !!!
import type { MermaidConfigWithDefaults } from '../src/config.type.js';

// options for running the main command
const verifyOnly = process.argv.includes('--verify');
/** If `true`, automatically `git add` any changes (i.e. during `pnpm run pre-commit`)*/
const git = process.argv.includes('--git');

/**
 * Loads the MermaidConfigWithDefaults JSON schema YAML file.
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
function validateSchema(
  jsonSchema: unknown
): asserts jsonSchema is JSONSchemaType<MermaidConfigWithDefaults> {
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
async function generateTypescript(mermaidConfigSchema: JSONSchemaType<MermaidConfigWithDefaults>) {
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

  assert.ok(mermaidConfigSchema.$defs);
  const modifiedSchema = {
    ...mermaidConfigSchema,
    $defs: Object.fromEntries(
      Object.entries(mermaidConfigSchema.$defs).map(([key, subSchema]) => {
        return [key, replaceAllOfWithExtends(subSchema as JSONSchemaType<Record<string, any>>)];
      })
    ),
  };

  const typescriptFile = await compile(
    modifiedSchema as unknown as JSONSchema, // json-schema-to-typescript only allows JSON Schema 4 as input type
    'MermaidConfigWithDefaults',
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

/**
 * Workaround for type duplication when a $ref property has siblings.
 *
 * @param json - The input JSON object.
 *
 * @see https://github.com/bcherny/json-schema-to-typescript/issues/193
 */
function removeProp(json: any, name: string) {
  for (const prop in json) {
    if (prop === name) {
      delete json[prop];
    } else if (typeof json[prop] === 'object') {
      removeProp(json[prop], name);
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
  // TODO: Add code to mark objects with default values as required

  removeProp(configJsonSchema, 'default');

  validateSchema(configJsonSchema);

  // Generate types from JSON Schema
  await generateTypescript(configJsonSchema);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
