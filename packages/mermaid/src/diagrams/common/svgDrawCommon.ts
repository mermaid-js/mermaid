import { sanitizeUrl } from '@braintree/sanitize-url';
import type { SVG, SVGGroup } from '../../diagram-api/types.js';
import { lineBreakRegex } from './common.js';
import type {
  Bound,
  D3ImageElement,
  D3RectElement,
  D3TSpanElement,
  D3TextElement,
  D3UseElement,
  RectData,
  TextData,
  TextObject,
} from './commonTypes.js';

export const drawRect = (element: SVG | SVGGroup, rectData: RectData): D3RectElement => {
  const rectElement: D3RectElement = element.append('rect');
  rectElement.attr('x', rectData.x);
  rectElement.attr('y', rectData.y);
  rectElement.attr('fill', rectData.fill);
  rectElement.attr('stroke', rectData.stroke);
  rectElement.attr('width', rectData.width);
  rectElement.attr('height', rectData.height);
  if (rectData.name) {
    rectElement.attr('name', rectData.name);
  }
  if (rectData.rx) {
    rectElement.attr('rx', rectData.rx);
  }
  if (rectData.ry) {
    rectElement.attr('ry', rectData.ry);
  }

  if (rectData.attrs !== undefined) {
    for (const attrKey in rectData.attrs) {
      rectElement.attr(attrKey, rectData.attrs[attrKey]);
    }
  }

  if (rectData.class) {
    rectElement.attr('class', rectData.class);
  }

  return rectElement;
};

/**
 * Draws a background rectangle
 *
 * @param element - Diagram (reference for bounds)
 * @param bounds - Shape of the rectangle
 */
export const drawBackgroundRect = (element: SVG | SVGGroup, bounds: Bound): void => {
  const rectData: RectData = {
    x: bounds.startx,
    y: bounds.starty,
    width: bounds.stopx - bounds.startx,
    height: bounds.stopy - bounds.starty,
    fill: bounds.fill,
    stroke: bounds.stroke,
    class: 'rect',
  };
  const rectElement: D3RectElement = drawRect(element, rectData);
  rectElement.lower();
};

export const drawText = (element: SVG | SVGGroup, textData: TextData): D3TextElement => {
  const nText: string = textData.text.replace(lineBreakRegex, ' ');

  const textElem: D3TextElement = element.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.attr('class', 'legend');

  textElem.style('text-anchor', textData.anchor);
  if (textData.class) {
    textElem.attr('class', textData.class);
  }

  const tspan: D3TSpanElement = textElem.append('tspan');
  tspan.attr('x', textData.x + textData.textMargin * 2);
  tspan.text(nText);

  return textElem;
};

export const drawImage = (elem: SVG | SVGGroup, x: number, y: number, link: string): void => {
  const imageElement: D3ImageElement = elem.append('image');
  imageElement.attr('x', x);
  imageElement.attr('y', y);
  const sanitizedLink: string = sanitizeUrl(link);
  imageElement.attr('xlink:href', sanitizedLink);
};

export const drawEmbeddedImage = (
  element: SVG | SVGGroup,
  x: number,
  y: number,
  link: string
): void => {
  const imageElement: D3UseElement = element.append('use');
  imageElement.attr('x', x);
  imageElement.attr('y', y);
  const sanitizedLink: string = sanitizeUrl(link);
  imageElement.attr('xlink:href', `#${sanitizedLink}`);
};

export const getNoteRect = (): RectData => {
  const noteRectData: RectData = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fill: '#EDF2AE',
    stroke: '#666',
    anchor: 'start',
    rx: 0,
    ry: 0,
  };
  return noteRectData;
};

export const getTextObj = (): TextObject => {
  const testObject: TextObject = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    'text-anchor': 'start',
    style: '#666',
    textMargin: 0,
    rx: 0,
    ry: 0,
    tspan: true,
  };
  return testObject;
};
