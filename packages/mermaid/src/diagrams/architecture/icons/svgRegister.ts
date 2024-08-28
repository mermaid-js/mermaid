import { log } from '$root/logger.js';
import type { Selection } from 'd3-selection';

export type IconResolver = (
  parent: Selection<SVGGElement, unknown, Element | null, unknown>,
  width?: number
) => Selection<SVGGElement, unknown, Element | null, unknown>;
export type IconLibrary = Record<string, IconResolver>;

/**
 * Converts an SVG Icon passed as a string into a properly formatted IconResolver
 * @param icon - html code for the svg icon as a string (the SVG tag should not be included)
 * @param originalSize - the original size of the SVG Icon in pixels
 * @returns IconResolver
 */
export const createIcon: (icon: string, originalSize: number) => IconResolver = (
  icon,
  originalSize
) => {
  return (
    parent: Selection<SVGGElement, unknown, Element | null, unknown>,
    size: number = originalSize
  ) => {
    parent.html(`<g style="transform: scale(${size / originalSize})">${icon}</g>`);
    return parent;
  };
};

const icons: IconLibrary = {};

export const isIconNameInUse = (name: string): boolean => {
  return icons[name] !== undefined;
};

export const registerIconLibrary = (library: IconLibrary) => {
  Object.entries(library).forEach(([name, resolver]) => {
    if (!isIconNameInUse(name)) {
      icons[name] = resolver;
    } else {
      log.warn(`Icon with name ${name} already exists. Skipping registration.`);
    }
  });
};

export const getIcon = (name: string): IconResolver | null => {
  if (isIconNameInUse(name)) {
    return icons[name];
  }
  return icons.unknown;
};
