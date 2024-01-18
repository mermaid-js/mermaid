// .vite/jisonTransformer.ts
import jison from 'file:///Users/knsv/source/git/mermaid/node_modules/.pnpm/jison@0.4.18/node_modules/jison/lib/jison.js';
var transformJison = (src) => {
  const parser = new jison.Generator(src, {
    moduleType: 'js',
    'token-stack': true,
  });
  const source = parser.generate({ moduleMain: '() => {}' });
  const exporter = `
	parser.parser = parser;
	export { parser };
	export default parser;
	`;
  return `${source} ${exporter}`;
};

// .vite/jisonPlugin.ts
var fileRegex = /\.(jison)$/;
function jison2() {
  return {
    name: 'jison',
    transform(src, id) {
      if (fileRegex.test(id)) {
        return {
          code: transformJison(src),
          map: null,
          // provide source map if available
        };
      }
    },
  };
}

// .vite/jsonSchemaPlugin.ts
import {
  load,
  JSON_SCHEMA,
} from 'file:///Users/knsv/source/git/mermaid/node_modules/.pnpm/js-yaml@4.1.0/node_modules/js-yaml/dist/js-yaml.mjs';
import assert from 'node:assert';
import Ajv2019 from 'file:///Users/knsv/source/git/mermaid/node_modules/.pnpm/ajv@8.12.0/node_modules/ajv/dist/2019.js';
var MERMAID_CONFIG_DIAGRAM_KEYS = [
  'flowchart',
  'sequence',
  'gantt',
  'journey',
  'class',
  'state',
  'er',
  'pie',
  'quadrantChart',
  'requirement',
  'mindmap',
  'timeline',
  'gitGraph',
  'c4',
  'sankey',
];
function generateDefaults(mermaidConfigSchema) {
  const ajv = new Ajv2019({
    useDefaults: true,
    allowUnionTypes: true,
    strict: true,
  });
  ajv.addKeyword({
    keyword: 'meta:enum',
    // used by jsonschema2md
    errors: false,
  });
  ajv.addKeyword({
    keyword: 'tsType',
    // used by json-schema-to-typescript
    errors: false,
  });
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
    };
    const validate2 = ajv.compile(subSchema);
    mermaidDefaultConfig[key] = {};
    for (const required of subSchema.required ?? []) {
      if (subSchema.properties[required] === void 0 && baseDiagramConfig.properties[required]) {
        mermaidDefaultConfig[key][required] = baseDiagramConfig.properties[required].default;
      }
    }
    if (!validate2(mermaidDefaultConfig[key])) {
      throw new Error(
        `schema for subconfig ${key} does not have valid defaults! Errors were ${JSON.stringify(
          validate2.errors,
          void 0,
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
        void 0,
        2
      )}`
    );
  }
  return mermaidDefaultConfig;
}
function jsonSchemaPlugin() {
  return {
    name: 'json-schema-plugin',
    transform(src, id) {
      const idAsUrl = new URL(id, 'file:///');
      if (!idAsUrl.pathname.endsWith('schema.yaml')) {
        return;
      }
      if (idAsUrl.searchParams.get('only-defaults')) {
        const jsonSchema = load(src, {
          filename: idAsUrl.pathname,
          // only allow JSON types in our YAML doc (will probably be default in YAML 1.3)
          // e.g. `true` will be parsed a boolean `true`, `True` will be parsed as string `"True"`.
          schema: JSON_SCHEMA,
        });
        return {
          code: `export default ${JSON.stringify(generateDefaults(jsonSchema), void 0, 2)};`,
          map: null,
          // no source map
        };
      } else {
        return {
          code: `export default ${JSON.stringify(
            load(src, {
              filename: idAsUrl.pathname,
              // only allow JSON types in our YAML doc (will probably be default in YAML 1.3)
              // e.g. `true` will be parsed a boolean `true`, `True` will be parsed as string `"True"`.
              schema: JSON_SCHEMA,
            }),
            void 0,
            2
          )};`,
          map: null,
          // provide source map if available
        };
      }
    },
  };
}

// vite.config.ts
import typescript from 'file:///Users/knsv/source/git/mermaid/node_modules/.pnpm/@rollup+plugin-typescript@11.1.1_typescript@5.1.3/node_modules/@rollup/plugin-typescript/dist/es/index.js';
import { defineConfig } from 'file:///Users/knsv/source/git/mermaid/node_modules/.pnpm/vitest@0.33.0_@vitest+ui@0.33.0_jsdom@22.0.0/node_modules/vitest/dist/config.js';
var vite_config_default = defineConfig({
  resolve: {
    extensions: ['.js'],
  },
  plugins: [
    jison2(),
    jsonSchemaPlugin(),
    // handles .schema.yaml JSON Schema files
    // @ts-expect-error According to the type definitions, rollup plugins are incompatible with vite
    typescript({ compilerOptions: { declaration: false } }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    // TODO: should we move this to a mermaid-core package?
    setupFiles: ['packages/mermaid/src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/vitest',
      exclude: ['**/node_modules/**', '**/tests/**', '**/__mocks__/**'],
    },
  },
  build: {
    /** If you set esmExternals to true, this plugins assumes that
     all external dependencies are ES modules */
    commonjsOptions: {
      esmExternals: true,
    },
  },
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLnZpdGUvamlzb25UcmFuc2Zvcm1lci50cyIsICIudml0ZS9qaXNvblBsdWdpbi50cyIsICIudml0ZS9qc29uU2NoZW1hUGx1Z2luLnRzIiwgInZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2tuc3Yvc291cmNlL2dpdC9tZXJtYWlkLy52aXRlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMva25zdi9zb3VyY2UvZ2l0L21lcm1haWQvLnZpdGUvamlzb25UcmFuc2Zvcm1lci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMva25zdi9zb3VyY2UvZ2l0L21lcm1haWQvLnZpdGUvamlzb25UcmFuc2Zvcm1lci50c1wiO2ltcG9ydCBqaXNvbiBmcm9tICdqaXNvbic7XG5cbmV4cG9ydCBjb25zdCB0cmFuc2Zvcm1KaXNvbiA9IChzcmM6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IHBhcnNlciA9IG5ldyBqaXNvbi5HZW5lcmF0b3Ioc3JjLCB7XG4gICAgbW9kdWxlVHlwZTogJ2pzJyxcbiAgICAndG9rZW4tc3RhY2snOiB0cnVlLFxuICB9KTtcbiAgY29uc3Qgc291cmNlID0gcGFyc2VyLmdlbmVyYXRlKHsgbW9kdWxlTWFpbjogJygpID0+IHt9JyB9KTtcbiAgY29uc3QgZXhwb3J0ZXIgPSBgXG5cdHBhcnNlci5wYXJzZXIgPSBwYXJzZXI7XG5cdGV4cG9ydCB7IHBhcnNlciB9O1xuXHRleHBvcnQgZGVmYXVsdCBwYXJzZXI7XG5cdGA7XG4gIHJldHVybiBgJHtzb3VyY2V9ICR7ZXhwb3J0ZXJ9YDtcbn07XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9rbnN2L3NvdXJjZS9naXQvbWVybWFpZC8udml0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2tuc3Yvc291cmNlL2dpdC9tZXJtYWlkLy52aXRlL2ppc29uUGx1Z2luLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9rbnN2L3NvdXJjZS9naXQvbWVybWFpZC8udml0ZS9qaXNvblBsdWdpbi50c1wiO2ltcG9ydCB7IHRyYW5zZm9ybUppc29uIH0gZnJvbSAnLi9qaXNvblRyYW5zZm9ybWVyLmpzJztcbmNvbnN0IGZpbGVSZWdleCA9IC9cXC4oamlzb24pJC87XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGppc29uKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdqaXNvbicsXG5cbiAgICB0cmFuc2Zvcm0oc3JjOiBzdHJpbmcsIGlkOiBzdHJpbmcpIHtcbiAgICAgIGlmIChmaWxlUmVnZXgudGVzdChpZCkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb2RlOiB0cmFuc2Zvcm1KaXNvbihzcmMpLFxuICAgICAgICAgIG1hcDogbnVsbCwgLy8gcHJvdmlkZSBzb3VyY2UgbWFwIGlmIGF2YWlsYWJsZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0sXG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9rbnN2L3NvdXJjZS9naXQvbWVybWFpZC8udml0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2tuc3Yvc291cmNlL2dpdC9tZXJtYWlkLy52aXRlL2pzb25TY2hlbWFQbHVnaW4udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2tuc3Yvc291cmNlL2dpdC9tZXJtYWlkLy52aXRlL2pzb25TY2hlbWFQbHVnaW4udHNcIjtpbXBvcnQgeyBsb2FkLCBKU09OX1NDSEVNQSB9IGZyb20gJ2pzLXlhbWwnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdub2RlOmFzc2VydCc7XG5pbXBvcnQgQWp2MjAxOSwgeyB0eXBlIEpTT05TY2hlbWFUeXBlIH0gZnJvbSAnYWp2L2Rpc3QvMjAxOS5qcyc7XG5pbXBvcnQgeyBQbHVnaW5PcHRpb24gfSBmcm9tICd2aXRlJztcblxuaW1wb3J0IHR5cGUgeyBNZXJtYWlkQ29uZmlnLCBCYXNlRGlhZ3JhbUNvbmZpZyB9IGZyb20gJy4uL3BhY2thZ2VzL21lcm1haWQvc3JjL2NvbmZpZy50eXBlLmpzJztcblxuLyoqXG4gKiBBbGwgb2YgdGhlIGtleXMgaW4gdGhlIG1lcm1haWQgY29uZmlnIHRoYXQgaGF2ZSBhIG1lcm1haWQgZGlhZ3JhbSBjb25maWcuXG4gKi9cbmNvbnN0IE1FUk1BSURfQ09ORklHX0RJQUdSQU1fS0VZUyA9IFtcbiAgJ2Zsb3djaGFydCcsXG4gICdzZXF1ZW5jZScsXG4gICdnYW50dCcsXG4gICdqb3VybmV5JyxcbiAgJ2NsYXNzJyxcbiAgJ3N0YXRlJyxcbiAgJ2VyJyxcbiAgJ3BpZScsXG4gICdxdWFkcmFudENoYXJ0JyxcbiAgJ3JlcXVpcmVtZW50JyxcbiAgJ21pbmRtYXAnLFxuICAndGltZWxpbmUnLFxuICAnZ2l0R3JhcGgnLFxuICAnYzQnLFxuICAnc2Fua2V5Jyxcbl0gYXMgY29uc3Q7XG5cbi8qKlxuICogR2VuZXJhdGUgZGVmYXVsdCB2YWx1ZXMgZnJvbSB0aGUgSlNPTiBTY2hlbWEuXG4gKlxuICogQUpWIGRvZXMgbm90IHN1cHBvcnQgbmVzdGVkIGRlZmF1bHQgdmFsdWVzIHlldCAob3IgZGVmYXVsdCB2YWx1ZXMgd2l0aCAkcmVmKSxcbiAqIHNvIHdlIG5lZWQgdG8gbWFudWFsbHkgZmluZCB0aGVtICh0aGlzIG1heSBiZSBmaXhlZCBpbiBhanYgdjkpLlxuICpcbiAqIEBwYXJhbSBtZXJtYWlkQ29uZmlnU2NoZW1hIC0gVGhlIE1lcm1haWQgSlNPTiBTY2hlbWEgdG8gdXNlLlxuICogQHJldHVybnMgVGhlIGRlZmF1bHQgbWVybWFpZCBjb25maWcgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZURlZmF1bHRzKG1lcm1haWRDb25maWdTY2hlbWE6IEpTT05TY2hlbWFUeXBlPE1lcm1haWRDb25maWc+KSB7XG4gIGNvbnN0IGFqdiA9IG5ldyBBanYyMDE5KHtcbiAgICB1c2VEZWZhdWx0czogdHJ1ZSxcbiAgICBhbGxvd1VuaW9uVHlwZXM6IHRydWUsXG4gICAgc3RyaWN0OiB0cnVlLFxuICB9KTtcblxuICBhanYuYWRkS2V5d29yZCh7XG4gICAga2V5d29yZDogJ21ldGE6ZW51bScsIC8vIHVzZWQgYnkganNvbnNjaGVtYTJtZFxuICAgIGVycm9yczogZmFsc2UsXG4gIH0pO1xuICBhanYuYWRkS2V5d29yZCh7XG4gICAga2V5d29yZDogJ3RzVHlwZScsIC8vIHVzZWQgYnkganNvbi1zY2hlbWEtdG8tdHlwZXNjcmlwdFxuICAgIGVycm9yczogZmFsc2UsXG4gIH0pO1xuXG4gIC8vIGFqdiBjdXJyZW50bHkgZG9lc24ndCBzdXBwb3J0IG5lc3RlZCBkZWZhdWx0IHZhbHVlcywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hanYtdmFsaWRhdG9yL2Fqdi9pc3N1ZXMvMTcxOFxuICAvLyAobWF5IGJlIGZpeGVkIGluIHY5KSBzbyB3ZSBuZWVkIHRvIG1hbnVhbGx5IHVzZSBzdWItc2NoZW1hc1xuICBjb25zdCBtZXJtYWlkRGVmYXVsdENvbmZpZyA9IHt9O1xuXG4gIGFzc2VydC5vayhtZXJtYWlkQ29uZmlnU2NoZW1hLiRkZWZzKTtcbiAgY29uc3QgYmFzZURpYWdyYW1Db25maWcgPSBtZXJtYWlkQ29uZmlnU2NoZW1hLiRkZWZzLkJhc2VEaWFncmFtQ29uZmlnO1xuXG4gIGZvciAoY29uc3Qga2V5IG9mIE1FUk1BSURfQ09ORklHX0RJQUdSQU1fS0VZUykge1xuICAgIGNvbnN0IHN1YlNjaGVtYVJlZiA9IG1lcm1haWRDb25maWdTY2hlbWEucHJvcGVydGllc1trZXldLiRyZWY7XG4gICAgY29uc3QgW3Jvb3QsIGRlZnMsIGRlZk5hbWVdID0gc3ViU2NoZW1hUmVmLnNwbGl0KCcvJyk7XG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKHJvb3QsICcjJyk7XG4gICAgYXNzZXJ0LnN0cmljdEVxdWFsKGRlZnMsICckZGVmcycpO1xuICAgIGNvbnN0IHN1YlNjaGVtYSA9IHtcbiAgICAgICRzY2hlbWE6IG1lcm1haWRDb25maWdTY2hlbWEuJHNjaGVtYSxcbiAgICAgICRkZWZzOiBtZXJtYWlkQ29uZmlnU2NoZW1hLiRkZWZzLFxuICAgICAgLi4ubWVybWFpZENvbmZpZ1NjaGVtYS4kZGVmc1tkZWZOYW1lXSxcbiAgICB9IGFzIEpTT05TY2hlbWFUeXBlPEJhc2VEaWFncmFtQ29uZmlnPjtcblxuICAgIGNvbnN0IHZhbGlkYXRlID0gYWp2LmNvbXBpbGUoc3ViU2NoZW1hKTtcblxuICAgIG1lcm1haWREZWZhdWx0Q29uZmlnW2tleV0gPSB7fTtcblxuICAgIGZvciAoY29uc3QgcmVxdWlyZWQgb2Ygc3ViU2NoZW1hLnJlcXVpcmVkID8/IFtdKSB7XG4gICAgICBpZiAoc3ViU2NoZW1hLnByb3BlcnRpZXNbcmVxdWlyZWRdID09PSB1bmRlZmluZWQgJiYgYmFzZURpYWdyYW1Db25maWcucHJvcGVydGllc1tyZXF1aXJlZF0pIHtcbiAgICAgICAgbWVybWFpZERlZmF1bHRDb25maWdba2V5XVtyZXF1aXJlZF0gPSBiYXNlRGlhZ3JhbUNvbmZpZy5wcm9wZXJ0aWVzW3JlcXVpcmVkXS5kZWZhdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXZhbGlkYXRlKG1lcm1haWREZWZhdWx0Q29uZmlnW2tleV0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBzY2hlbWEgZm9yIHN1YmNvbmZpZyAke2tleX0gZG9lcyBub3QgaGF2ZSB2YWxpZCBkZWZhdWx0cyEgRXJyb3JzIHdlcmUgJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICB2YWxpZGF0ZS5lcnJvcnMsXG4gICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgIDJcbiAgICAgICAgKX1gXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHZhbGlkYXRlID0gYWp2LmNvbXBpbGUobWVybWFpZENvbmZpZ1NjaGVtYSk7XG5cbiAgaWYgKCF2YWxpZGF0ZShtZXJtYWlkRGVmYXVsdENvbmZpZykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgTWVybWFpZCBjb25maWcgSlNPTiBTY2hlbWEgZG9lcyBub3QgaGF2ZSB2YWxpZCBkZWZhdWx0cyEgRXJyb3JzIHdlcmUgJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgdmFsaWRhdGUuZXJyb3JzLFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIDJcbiAgICAgICl9YFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gbWVybWFpZERlZmF1bHRDb25maWc7XG59XG5cbi8qKlxuICogVml0ZSBwbHVnaW4gdGhhdCBoYW5kbGVzIEpTT04gU2NoZW1hcyBzYXZlZCBhcyBhIGAuc2NoZW1hLnlhbWxgIGZpbGUuXG4gKlxuICogVXNlIGBteS1leGFtcGxlLnNjaGVtYS55YW1sP29ubHktZGVmYXVsdHM9dHJ1ZWAgdG8gb25seSBsb2FkIHRoZSBkZWZhdWx0IHZhbHVlcy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ganNvblNjaGVtYVBsdWdpbigpOiBQbHVnaW5PcHRpb24ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdqc29uLXNjaGVtYS1wbHVnaW4nLFxuICAgIHRyYW5zZm9ybShzcmM6IHN0cmluZywgaWQ6IHN0cmluZykge1xuICAgICAgY29uc3QgaWRBc1VybCA9IG5ldyBVUkwoaWQsICdmaWxlOi8vLycpO1xuXG4gICAgICBpZiAoIWlkQXNVcmwucGF0aG5hbWUuZW5kc1dpdGgoJ3NjaGVtYS55YW1sJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaWRBc1VybC5zZWFyY2hQYXJhbXMuZ2V0KCdvbmx5LWRlZmF1bHRzJykpIHtcbiAgICAgICAgY29uc3QganNvblNjaGVtYSA9IGxvYWQoc3JjLCB7XG4gICAgICAgICAgZmlsZW5hbWU6IGlkQXNVcmwucGF0aG5hbWUsXG4gICAgICAgICAgLy8gb25seSBhbGxvdyBKU09OIHR5cGVzIGluIG91ciBZQU1MIGRvYyAod2lsbCBwcm9iYWJseSBiZSBkZWZhdWx0IGluIFlBTUwgMS4zKVxuICAgICAgICAgIC8vIGUuZy4gYHRydWVgIHdpbGwgYmUgcGFyc2VkIGEgYm9vbGVhbiBgdHJ1ZWAsIGBUcnVlYCB3aWxsIGJlIHBhcnNlZCBhcyBzdHJpbmcgYFwiVHJ1ZVwiYC5cbiAgICAgICAgICBzY2hlbWE6IEpTT05fU0NIRU1BLFxuICAgICAgICB9KSBhcyBKU09OU2NoZW1hVHlwZTxNZXJtYWlkQ29uZmlnPjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb2RlOiBgZXhwb3J0IGRlZmF1bHQgJHtKU09OLnN0cmluZ2lmeShnZW5lcmF0ZURlZmF1bHRzKGpzb25TY2hlbWEpLCB1bmRlZmluZWQsIDIpfTtgLFxuICAgICAgICAgIG1hcDogbnVsbCwgLy8gbm8gc291cmNlIG1hcFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb2RlOiBgZXhwb3J0IGRlZmF1bHQgJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgIGxvYWQoc3JjLCB7XG4gICAgICAgICAgICAgIGZpbGVuYW1lOiBpZEFzVXJsLnBhdGhuYW1lLFxuICAgICAgICAgICAgICAvLyBvbmx5IGFsbG93IEpTT04gdHlwZXMgaW4gb3VyIFlBTUwgZG9jICh3aWxsIHByb2JhYmx5IGJlIGRlZmF1bHQgaW4gWUFNTCAxLjMpXG4gICAgICAgICAgICAgIC8vIGUuZy4gYHRydWVgIHdpbGwgYmUgcGFyc2VkIGEgYm9vbGVhbiBgdHJ1ZWAsIGBUcnVlYCB3aWxsIGJlIHBhcnNlZCBhcyBzdHJpbmcgYFwiVHJ1ZVwiYC5cbiAgICAgICAgICAgICAgc2NoZW1hOiBKU09OX1NDSEVNQSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgMlxuICAgICAgICAgICl9O2AsXG4gICAgICAgICAgbWFwOiBudWxsLCAvLyBwcm92aWRlIHNvdXJjZSBtYXAgaWYgYXZhaWxhYmxlXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2tuc3Yvc291cmNlL2dpdC9tZXJtYWlkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMva25zdi9zb3VyY2UvZ2l0L21lcm1haWQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2tuc3Yvc291cmNlL2dpdC9tZXJtYWlkL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IGppc29uIGZyb20gJy4vLnZpdGUvamlzb25QbHVnaW4uanMnO1xuaW1wb3J0IGpzb25TY2hlbWFQbHVnaW4gZnJvbSAnLi8udml0ZS9qc29uU2NoZW1hUGx1Z2luLmpzJztcbmltcG9ydCB0eXBlc2NyaXB0IGZyb20gJ0Byb2xsdXAvcGx1Z2luLXR5cGVzY3JpcHQnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHJlc29sdmU6IHtcbiAgICBleHRlbnNpb25zOiBbJy5qcyddLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgamlzb24oKSxcbiAgICBqc29uU2NoZW1hUGx1Z2luKCksIC8vIGhhbmRsZXMgLnNjaGVtYS55YW1sIEpTT04gU2NoZW1hIGZpbGVzXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBBY2NvcmRpbmcgdG8gdGhlIHR5cGUgZGVmaW5pdGlvbnMsIHJvbGx1cCBwbHVnaW5zIGFyZSBpbmNvbXBhdGlibGUgd2l0aCB2aXRlXG4gICAgdHlwZXNjcmlwdCh7IGNvbXBpbGVyT3B0aW9uczogeyBkZWNsYXJhdGlvbjogZmFsc2UgfSB9KSxcbiAgXSxcbiAgdGVzdDoge1xuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgLy8gVE9ETzogc2hvdWxkIHdlIG1vdmUgdGhpcyB0byBhIG1lcm1haWQtY29yZSBwYWNrYWdlP1xuICAgIHNldHVwRmlsZXM6IFsncGFja2FnZXMvbWVybWFpZC9zcmMvdGVzdHMvc2V0dXAudHMnXSxcbiAgICBjb3ZlcmFnZToge1xuICAgICAgcHJvdmlkZXI6ICd2OCcsXG4gICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24nLCAnaHRtbCcsICdsY292J10sXG4gICAgICByZXBvcnRzRGlyZWN0b3J5OiAnLi9jb3ZlcmFnZS92aXRlc3QnLFxuICAgICAgZXhjbHVkZTogWycqKi9ub2RlX21vZHVsZXMvKionLCAnKiovdGVzdHMvKionLCAnKiovX19tb2Nrc19fLyoqJ10sXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICAvKiogSWYgeW91IHNldCBlc21FeHRlcm5hbHMgdG8gdHJ1ZSwgdGhpcyBwbHVnaW5zIGFzc3VtZXMgdGhhdFxuICAgICBhbGwgZXh0ZXJuYWwgZGVwZW5kZW5jaWVzIGFyZSBFUyBtb2R1bGVzICovXG5cbiAgICBjb21tb25qc09wdGlvbnM6IHtcbiAgICAgIGVzbUV4dGVybmFsczogdHJ1ZSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdTLE9BQU8sV0FBVztBQUVuVCxJQUFNLGlCQUFpQixDQUFDLFFBQXdCO0FBQ3JELFFBQU0sU0FBUyxJQUFJLE1BQU0sVUFBVSxLQUFLO0FBQUEsSUFDdEMsWUFBWTtBQUFBLElB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QUEsSUFDTixVQUFVLEtBQWEsSUFBWTtBQUNqQyxZQUFNLFVBQVUsSUFBSSxJQUFJLElBQUksVUFBVTtBQUV0QyxVQUFJLENBQUMsUUFBUSxTQUFTLFNBQVMsYUFBYSxHQUFHO0FBQzdDO0FBQUEsTUFDRjtBQUVBLFVBQUksUUFBUSxhQUFhLElBQUksZUFBZSxHQUFHO0FBQzdDLGNBQU0sYUFBYSxLQUFLLEtBQUs7QUFBQSxVQUMzQixVQUFVLFFBQVE7QUFBQTtBQUFBO0FBQUEsVUFHbEIsUUFBUTtBQUFBLFFBQ1YsQ0FBQztBQUNELGVBQU87QUFBQSxVQUNMLE1BQU0sa0JBQWtCLEtBQUssVUFBVSxpQkFBaUIsVUFBVSxHQUFHLFFBQVcsQ0FBQztBQUFBLFVBQ2pGLEtBQUs7QUFBQTtBQUFBLFFBQ1A7QUFBQSxNQUNGLE9BQU87QUFDTCxlQUFPO0FBQUEsVUFDTCxNQUFNLGtCQUFrQixLQUFLO0FBQUEsWUFDM0IsS0FBSyxLQUFLO0FBQUEsY0FDUixVQUFVLFFBQVE7QUFBQTtBQUFBO0FBQUEsY0FHbEIsUUFBUTtBQUFBLFlBQ1YsQ0FBQztBQUFBLFlBQ0Q7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsS0FBSztBQUFBO0FBQUEsUUFDUDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOzs7QUNuSkEsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxvQkFBb0I7QUFFN0IsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsWUFBWSxDQUFDLEtBQUs7QUFBQSxFQUNwQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1BDLE9BQU07QUFBQSxJQUNOLGlCQUFpQjtBQUFBO0FBQUE7QUFBQSxJQUVqQixXQUFXLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxNQUFNLEVBQUUsQ0FBQztBQUFBLEVBQ3hEO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixhQUFhO0FBQUEsSUFDYixTQUFTO0FBQUE7QUFBQSxJQUVULFlBQVksQ0FBQyxxQ0FBcUM7QUFBQSxJQUNsRCxVQUFVO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixVQUFVLENBQUMsUUFBUSxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ3pDLGtCQUFrQjtBQUFBLE1BQ2xCLFNBQVMsQ0FBQyxzQkFBc0IsZUFBZSxpQkFBaUI7QUFBQSxJQUNsRTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBO0FBQUEsSUFJTCxpQkFBaUI7QUFBQSxNQUNmLGNBQWM7QUFBQSxJQUNoQjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJqaXNvbiIsICJ2YWxpZGF0ZSIsICJqaXNvbiJdCn0K
