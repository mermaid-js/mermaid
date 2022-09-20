// @ts-nocheck : TODO Fix ts errors
import { getConfig } from './config';

/**
 * Gets the SVG node for an element.
 *
 * @param {SVGElement} elem Element within an SVG node
 * @returns {Node?} SVG node
 */
const svgNode: Node? = function (elem: SVGElement) {
  const node = elem.node();

  if (node.tagName.toLowerCase() === 'svg') {
    return node;
  }

  return node.nearestViewportElement;
};

/**
 * Returns a marker id pre-fixed with its SVG element id.
 *
 * This ensures that markers are correctly referenced
 * when they are multiple diagrams on a page.
 *
 * @param {SVGElement} elem Element referencing the marker
 * @param {string} name Name of the marker
 * @returns {string} A marker id
 */
const markerId: string = function (elem: SVGElement, name: string) {
  const svg = svgNode(elem);

  if (svg) {
    return svg.getAttribute('id') + '-' + name;
  }

  return name;
};

/**
 * Gets a marker url.
 *
 * @param {SVGPathElement} path Path element referencing the marker
 * @param {string} name Name of the marker
 * @returns {string} A marker id
 */
export const markerUrl = function (path: SVGPathElement, name: string) {
  let absolute = '';

  if (getConfig().state.arrowMarkerAbsolute) {
    absolute =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    absolute = absolute.replace(/\(/g, '\\(');
    absolute = absolute.replace(/\)/g, '\\)');
  }

  return `url(${absolute}#${markerId(path, name)})`;
};

export const appendMarker = function (elem, name) {
  return elem.append('defs').append('marker').attr('id', markerId(elem, name));
};

export default {
  appendMarker,
  markerUrl,
};
