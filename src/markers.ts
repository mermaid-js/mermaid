import { getConfig } from './config';

/**
 * Append a marker to a graphics element assigning it an id that includes the id of it's parent SVG
 * element.
 *
 * The marker's id will be the concatenation of the id of g's parent SVG element (if found) and the
 * given name using '-' as a separator.
 *
 * @param {SVGGraphicsElement} g
 * @param {string} name
 * @returns {SVGMarkerElement} SVG element.
 */
export const appendMarker = function (g: SVGGraphicsElement, name: string): SVGMarkerElement {
  // @ts-ignore TODO Fix ts errors
  return g.append('defs').append('marker').attr('id', markerId(g, name));
};

/**
 * Returns the url for a marker.
 *
 * The fragment portion of the url will be the marker's id.
 *
 * @param {SVGElement} elem
 * @param {string} name
 * @returns {string} A marker url.
 */
export const markerUrl = function (elem: SVGElement, name: string): string {
  return 'url(' + url() + '#' + markerId(elem, name) + ')';
};

const markerId = function (elem: SVGElement, name: string) {
  return diagramId(elem) ? diagramId(elem) + '-' + name : name;
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

const url = function () {
  return urlShouldBeAbsolute() ? window.location.href : '';
};

const urlShouldBeAbsolute = function () {
  // @ts-ignore TODO Fix ts errors
  return getConfig().flowchart.arrowMarkerAbsolute || getConfig().state.arrowMarkerAbsolute;
};

export default {
  appendMarker,
  markerUrl,
};
