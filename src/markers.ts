import { getConfig } from './config';

/**
 * Append a marker to a graphics element assigning it a unique id.
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
const absoluteUrl = function () {
  // @ts-ignore TODO Fix ts errors
  if (getConfig().state.arrowMarkerAbsolute) {
    const location = window.location;
    const absolute = location.protocol + '//' + location.host + location.pathname + location.search;
    return absolute.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  return '';
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
  return 'url(' + absoluteUrl() + '#' + markerId(path, name) + ')';
};

/**
 * Returns the diagram id for an element.
 *
 * The id returned is the "id" attribute of the element's SVG node.
 *
 * @param {SVGElement} elem An element
 * @returns {string | null} The diagram id
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
