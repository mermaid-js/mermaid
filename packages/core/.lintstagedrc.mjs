import baseConfig from '../../.lintstagedrc.mjs';
export default {
  ...baseConfig,
  'src/(defaultConfig|config|mermaidAPI).ts': ['pnpm --filter mermaid run docs:build --git'],
  'src/schemas/config.schema.yaml': ['pnpm --filter @mermaid-js/core run types:build-config --git'],
};
