import type { JSONSchemaType } from 'ajv/dist/2019.js';
import type { MermaidConfig } from '../packages/mermaid/src/config.type.js';
import { readFile } from 'node:fs/promises';
import { getDefaults, getSchema, loadSchema } from '../.build/jsonSchema.js';

/**
 * ESBuild plugin that handles JSON Schemas saved as a `.schema.yaml` file.
 *
 * Use `my-example.schema.yaml?only-defaults=true` to only load the default values.
 */

export const jsonSchemaPlugin = {
  name: 'json-schema-plugin',
  setup(build) {
    let schema: JSONSchemaType<MermaidConfig> | undefined = undefined;
    let content = '';

    build.onLoad({ filter: /config\.schema\.yaml$/ }, async (args) => {
      // Load the file from the file system
      const source = await readFile(args.path, 'utf8');
      const resolvedSchema: JSONSchemaType<MermaidConfig> =
        content === source && schema ? schema : loadSchema(source, args.path);
      if (content !== source) {
        content = source;
        schema = resolvedSchema;
      }
      const contents = args.suffix.includes('only-defaults')
        ? getDefaults(resolvedSchema)
        : getSchema(resolvedSchema);
      return { contents, warnings: [] };
    });
  },
};

export default jsonSchemaPlugin;
