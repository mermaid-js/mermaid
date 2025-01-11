import type { PluginOption } from 'vite';
import { getDefaults, getSchema, loadSchema } from '../.build/jsonSchema.js';

/**
 * Vite plugin that handles JSON Schemas saved as a `.schema.yaml` file.
 *
 * Use `my-example.schema.yaml?only-defaults=true` to only load the default values.
 */
export default function jsonSchemaPlugin(): PluginOption {
  return {
    name: 'json-schema-plugin',
    transform(src: string, id: string) {
      const idAsUrl = new URL(id, 'file:///');

      if (!idAsUrl.pathname.endsWith('schema.yaml')) {
        return;
      }

      const jsonSchema = loadSchema(src, idAsUrl.pathname);
      return {
        code: idAsUrl.searchParams.get('only-defaults')
          ? getDefaults(jsonSchema)
          : getSchema(jsonSchema),
        map: null, // no source map
      };
    },
  };
}
