export interface PackageOptions {
  name: string;
  packageName: string;
  file: string;
}

/**
 * Shared common options for both ESBuild and Vite
 */
export const packageOptions = {
  parser: {
    name: 'mermaid-parser',
    packageName: 'parser',
    file: 'index.ts',
  },
  mermaid: {
    name: 'mermaid',
    packageName: 'mermaid',
    file: 'mermaid.ts',
  },
  'mermaid-example-diagram': {
    name: 'mermaid-example-diagram',
    packageName: 'mermaid-example-diagram',
    file: 'detector.ts',
  },
  'mermaid-zenuml': {
    name: 'mermaid-zenuml',
    packageName: 'mermaid-zenuml',
    file: 'detector.ts',
  },
  'mermaid-layout-elk': {
    name: 'mermaid-layout-elk',
    packageName: 'mermaid-layout-elk',
    file: 'layouts.ts',
  },
} as const satisfies Record<string, PackageOptions>;
