import { sanitizeUrl } from '@braintree/sanitize-url';

export const drawRect = function (elem, rectData) {
  const rectElem = elem.append('rect');
  rectElem.attr('x', rectData.x);
  rectElem.attr('y', rectData.y);
  rectElem.attr('fill', rectData.fill);
  rectElem.attr('stroke', rectData.stroke);
  rectElem.attr('width', rectData.width);
  rectElem.attr('height', rectData.height);
  rectElem.attr('rx', rectData.rx);
  rectElem.attr('ry', rectData.ry);

  if (rectData.attrs !== 'undefined' && rectData.attrs !== null) {
    for (let attrKey in rectData.attrs) {
      rectElem.attr(attrKey, rectData.attrs[attrKey]);
    }
  }

  if (rectData.class !== 'undefined') {
    rectElem.attr('class', rectData.class);
  }

  return rectElem;
};

/**
 * Draws a background rectangle
 *
 * @param {any} elem Diagram (reference for bounds)
 * @param {any} bounds Shape of the rectangle
 */
export const drawBackgroundRect = function (elem, bounds) {
  const rectElem = drawRect(elem, {
    x: bounds.startx,
    y: bounds.starty,
    width: bounds.stopx - bounds.startx,
    height: bounds.stopy - bounds.starty,
    fill: bounds.fill,
    stroke: bounds.stroke,
    class: 'rect',
  });
  rectElem.lower();
};

export const drawText = function (elem, textData) {
  // Remove and ignore br:s
  const nText = textData.text.replace(/<br\s*\/?>/gi, ' ');

  const textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.attr('class', 'legend');

  textElem.style('text-anchor', textData.anchor);

  if (textData.class !== undefined) {
    textElem.attr('class', textData.class);
  }

  const span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.text(nText);

  return textElem;
};

export const drawImage = function (elem, x, y, link) {
  const imageElem = elem.append('image');
  imageElem.attr('x', x);
  imageElem.attr('y', y);
  var sanitizedLink = sanitizeUrl(link);
  imageElem.attr('xlink:href', sanitizedLink);
};

export const drawEmbeddedImage = function (elem, x, y, link) {
  const imageElem = elem.append('use');
  imageElem.attr('x', x);
  imageElem.attr('y', y);
  var sanitizedLink = sanitizeUrl(link);
  imageElem.attr('xlink:href', '#' + sanitizedLink);
};

export const getNoteRect = function () {
  return {
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
};

export const getTextObj = function () {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fill: undefined,
    anchor: undefined,
    'text-anchor': 'start',
    style: '#666',
    textMargin: 0,
    rx: 0,
    ry: 0,
    tspan: true,
    valign: undefined,
  };
};

export default {
  drawRect,
  drawImage,
  drawText,
  getNoteRect,
  getTextObj,
};
