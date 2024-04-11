import type { Selection } from 'd3-selection';

type IconResolver = (
  parent: Selection<SVGGElement, unknown, Element | null, unknown>,
  width?: number
) => Selection<SVGGElement, unknown, Element | null, unknown>;
type IconLibrary = Record<string, IconResolver>;

const createIcon = (icon: string, originalSize: number): IconResolver => {
  return (
    parent: Selection<SVGGElement, unknown, Element | null, unknown>,
    size: number = originalSize
  ) => {
    parent.html(`<g style="transform: scale(${size / originalSize})">${icon}</g>`);
    return parent;
  };
};

const icons: IconLibrary = {};

const isIconNameInUse = (name: string): boolean => {
  return icons[name] !== undefined;
};

const registerIcon = (name: string, resolver: IconResolver) => {
  if (!isIconNameInUse(name)) {
    icons[name] = resolver;
  }
};

const registerIcons = (library: IconLibrary) => {
  Object.entries(library).forEach(([name, resolver]) => {
    if (!isIconNameInUse(name)) {
      icons[name] = resolver;
    }
  });
};

const getIcon = (name: string): IconResolver | null => {
  if (isIconNameInUse(name)) {
    return icons[name];
  }
  return icons['unknown'];
};

export { registerIcon, registerIcons, getIcon, isIconNameInUse, createIcon, IconLibrary, IconResolver };
