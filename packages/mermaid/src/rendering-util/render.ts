import type { SVG } from '../diagram-api/types.js';
import type { InternalHelpers } from '../internals.js';
import { internalHelpers } from '../internals.js';
import { log } from '../logger.js';
import type { LayoutData } from './types.js';

export interface RenderOptions {
  algorithm?: string;
}

export interface LayoutAlgorithm {
  render(
    layoutData: LayoutData,
    svg: SVG,
    helpers: InternalHelpers,
    options?: RenderOptions
  ): Promise<void>;
}

export type LayoutLoader = () => Promise<LayoutAlgorithm>;
export interface LayoutLoaderDefinition {
  name: string;
  loader: LayoutLoader;
  algorithm?: string;
}

const layoutAlgorithms: Record<string, LayoutLoaderDefinition> = {};

export const registerLayoutLoaders = (loaders: LayoutLoaderDefinition[]) => {
  for (const loader of loaders) {
    layoutAlgorithms[loader.name] = loader;
  }
};

// TODO: Should we load dagre without lazy loading?
const registerDefaultLayoutLoaders = () => {
  registerLayoutLoaders([
    {
      name: 'dagre',
      loader: async () => await import('./layout-algorithms/dagre/index.js'),
    },
  ]);
};

registerDefaultLayoutLoaders();

export const render = async (data4Layout: LayoutData, svg: SVG) => {
  if (!(data4Layout.layoutAlgorithm in layoutAlgorithms)) {
    throw new Error(`Unknown layout algorithm: ${data4Layout.layoutAlgorithm}`);
  }

  const layoutDefinition = layoutAlgorithms[data4Layout.layoutAlgorithm];
  const layoutRenderer = await layoutDefinition.loader();
  return layoutRenderer.render(data4Layout, svg, internalHelpers, {
    algorithm: layoutDefinition.algorithm,
  });
};

/**
 * Get the registered layout algorithm. If the algorithm is not registered, use the fallback algorithm.
 */
export const getRegisteredLayoutAlgorithm = (algorithm = '', { fallback = 'dagre' } = {}) => {
  if (algorithm in layoutAlgorithms) {
    return algorithm;
  }
  if (fallback in layoutAlgorithms) {
    log.warn(`Layout algorithm ${algorithm} is not registered. Using ${fallback} as fallback.`);
    return fallback;
  }
  throw new Error(`Both layout algorithms ${algorithm} and ${fallback} are not registered.`);
};
