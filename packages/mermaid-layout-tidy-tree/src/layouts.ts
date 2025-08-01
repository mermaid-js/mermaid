import type { LayoutLoaderDefinition } from 'mermaid';

const loader = async () => await import(`./render.js`);

const layouts: LayoutLoaderDefinition[] = [
  {
    name: 'tidy-tree',
    loader,
    algorithm: 'tidy-tree',
  },
];

export default layouts;
