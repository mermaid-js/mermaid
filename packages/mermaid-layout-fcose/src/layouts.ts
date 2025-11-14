import type { LayoutLoaderDefinition } from 'mermaid';

const loader = async () => await import(`./render.js`);

const fcoseLayout: LayoutLoaderDefinition[] = [
  {
    name: 'architecture-fcose',
    loader,
    algorithm: 'architecture-fcose',
  },
];

export default fcoseLayout;
