import type { LayoutLoaderDefinition } from 'mermaid';

const loader = async () => await import(`./render.js`);
const algos = ['elk.stress', 'elk.force', 'elk.mrtree', 'elk.sporeOverlap'];

const layouts: LayoutLoaderDefinition[] = [
  {
    name: 'elk',
    loader,
    algorithm: 'elk.layered',
  },
  ...algos.map((algo) => ({
    name: algo,
    loader,
    algorithm: algo,
  })),
];

export default layouts;
