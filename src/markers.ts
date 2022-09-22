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

/**
 * Get the url of a marker.
 *
 * The url will have a unique id based on the given name.
 *
 * @param {SVGElement} path En element using the marker
 * @param {string} name Marker name
 * @returns {string} A marker id
 */
export const markerUrl = function (path: SVGElement, name: string): string {
  return 'url(' + url() + '#' + markerId(path, name) + ')';
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
  if (!name) {
    return null;
  }

  return diagramId(elem) ? diagramId(elem) + '-' + name : name;
};

const absoluteUrl = function () {
  return window.location.href.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
};

const url = function () {
  return urlShouldBeAbsolute() ? absoluteUrl() : '';
};

const urlShouldBeAbsolute = function () {
  // @ts-ignore TODO Fix ts errors
  return getConfig().flowchart.arrowMarkerAbsolute || getConfig().state.arrowMarkerAbsolute;
};

const diagramId = function (elem: SVGElement): string {
  // @ts-ignore TODO Fix ts errors
  let node = elem && elem.node && elem.node();

  while (node && node.tagName && node.tagName.toLowerCase() !== 'svg') {
    node = node.parentNode;

    if (!node.tagName) {
      node = null;
    }
  }

  // @ts-ignore TODO Fix ts errors
  return node && node.getAttribute('id');
};

export default {
  appendMarker,
  markerUrl,
};
