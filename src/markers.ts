import { getConfig } from './config';

/**
 * Append a marker to a graphics element.
 *
 * A marker will be appended with a unique id based on the given name.
 *
 * @param {SVGGraphicsElement} g The graphics element
 * @param {string} name Marker name
 * @returns {SVGMarkerElement} A new marker element with a unique id
 */
export const appendMarker = function (g: SVGGraphicsElement, name: string): SVGMarkerElement {
  // @ts-ignore TODO Fix ts errors
  return g.append('defs').append('marker').attr('id', markerId(g, name));
};

/** @returns {string} A new marker element with a unique id */
const absolute = function () {
  let absolute = '';

  // @ts-ignore TODO Fix ts errors
  if (getConfig().state.arrowMarkerAbsolute) {
    absolute =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    absolute = absolute.replace(/\(/g, '\\(');
    absolute = absolute.replace(/\)/g, '\\)');
    return absolute;
  }
};

/**
 * Get a marker url.
 *
 * The url will have a unique id based on the given name.
 *
 * @param {SVGPathElement} path Path element using the marker
 * @param {string} name Marker name
 * @returns {string} A marker id
 */
export const markerUrl = function (path: SVGPathElement, name: string): string {
  let absolute = '';

  // @ts-ignore TODO Fix ts errors
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

  return 'url(' + absolute + '#' + markerId(path, name) + ')';
};

/**
 * Get the SVG id for an element.
 *
 * @param {SVGElement} elem Element within an SVG node
 * @returns {Node | null} SVG node
 */
const diagramId = function (elem: SVGElement): string {
  // @ts-ignore TODO Fix ts errors
  let node = elem && elem.node && elem.node();

  if (node && node.tagName.toLowerCase() !== 'svg') {
    node = node.nearestViewportElement;
  }

  // @ts-ignore TODO Fix ts errors
  return node && node.getAttribute('id');
};

/**
 * Return a unique marker id based on the given name.
 *
 * This ensures that markers are correctly referenced when they are multiple diagrams on a page.
 *
 * @param {SVGElement} elem Element referencing the marker
 * @param {string | null} name Marker name
 * @returns {string | null} A marker id
 */
const markerId = function (elem: SVGElement, name: string) {
  if (name) {
    return diagramId(elem) ? diagramId(elem) + '-' + name : name;
  }

  return null;
};

export default {
  appendMarker,
  markerUrl,
};
