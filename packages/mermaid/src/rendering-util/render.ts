import type { SVG } from '$root/diagram-api/types.js';
import type { InternalHelpers } from '$root/internals.js';
import { internalHelpers } from '$root/internals.js';
import { log } from '$root/logger.js';
import type { LayoutData } from './types.js';

export interface RenderOptions {
  algorithm?: string;
}

export interface LayoutAlgorithm {
  render(
    layoutData: LayoutData,
    svg: SVG,
    element: any,
    helpers: InternalHelpers,
    options?: RenderOptions,
    positions: any
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
    {
      name: 'fixed',
      loader: async () => await import('./layout-algorithms/fixed/index.js'),
    },
  ]);
};

registerDefaultLayoutLoaders();

export const render = async (data4Layout: any, svg: any, element: any, positions?: any) => {
  if (!(data4Layout.layoutAlgorithm in layoutAlgorithms)) {
    throw new Error(`Unknown layout algorithm: ${data4Layout.layoutAlgorithm}`);
  }

  const layoutDefinition = layoutAlgorithms[data4Layout.layoutAlgorithm];
  const layoutRenderer = await layoutDefinition.loader();

  const { useGradient, gradientStart, gradientStop } = data4Layout.config.themeVariables;

  // console.log('IPI data4Layout', svg.attr('id'));

  if (useGradient) {
    const gradient = svg
      .append('linearGradient')
      .attr('id', svg.attr('id') + '-gradient')
      .attr('gradientUnits', 'objectBoundingBox') // Changed to objectBoundingBox for relative sizing
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient
      .append('svg:stop')
      .attr('offset', '0%')
      .attr('stop-color', gradientStart)
      .attr('stop-opacity', 1);

    gradient
      .append('svg:stop')
      .attr('offset', '100%') // Adjusted to 100% to ensure full gradient spread
      .attr('stop-color', gradientStop)
      .attr('stop-opacity', 1);
  }
  return layoutRenderer.render(
    data4Layout,
    svg,
    element,
    internalHelpers,
    {
      algorithm: layoutDefinition.algorithm,
    },
    positions
  );
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
