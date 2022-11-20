// @ts-nocheck : TODO Fix ts errors
import { sanitizeUrl } from '@braintree/sanitize-url';
import {
  curveBasis,
  curveBasisClosed,
  curveBasisOpen,
  CurveFactory,
  curveLinear,
  curveLinearClosed,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  select,
} from 'd3';
import common from './diagrams/common/common';
import { configKeys } from './defaultConfig';
import { log } from './logger';
import { detectType } from './diagram-api/detectType';
import assignWithDepth from './assignWithDepth';
import { MermaidConfig } from './config.type';
import memoize from 'lodash-es/memoize';

// Effectively an enum of the supported curve types, accessible by name
const d3CurveTypes = {
  curveBasis: curveBasis,
  curveBasisClosed: curveBasisClosed,
  curveBasisOpen: curveBasisOpen,
  curveLinear: curveLinear,
  curveLinearClosed: curveLinearClosed,
  curveMonotoneX: curveMonotoneX,
  curveMonotoneY: curveMonotoneY,
  curveNatural: curveNatural,
  curveStep: curveStep,
  curveStepAfter: curveStepAfter,
  curveStepBefore: curveStepBefore,
};
const directive =
  /[%]{2}[{]\s*(?:(?:(\w+)\s*:|(\w+))\s*(?:(?:(\w+))|((?:(?![}][%]{2}).|\r?\n)*))?\s*)(?:[}][%]{2})?/gi;
const directiveWithoutOpen =
  /\s*(?:(?:(\w+)(?=:):|(\w+))\s*(?:(?:(\w+))|((?:(?![}][%]{2}).|\r?\n)*))?\s*)(?:[}][%]{2})?/gi;

/**
 * Detects the init config object from the text
 *
 * @param text - The text defining the graph. For example:
 *
 * ```mermaid
 * %%{init: {"theme": "debug", "logLevel": 1 }}%%
 * graph LR
 *      a-->b
 *      b-->c
 *      c-->d
 *      d-->e
 *      e-->f
 *      f-->g
 *      g-->h
 * ```
 *
 * Or
 *
 * ```mermaid
 * %%{initialize: {"theme": "dark", logLevel: "debug" }}%%
 * graph LR
 *    a-->b
 *    b-->c
 *    c-->d
 *    d-->e
 *    e-->f
 *    f-->g
 *    g-->h
 * ```
 *
 * @param config - Optional mermaid configuration object.
 * @returns The json object representing the init passed to mermaid.initialize()
 */
export const detectInit = function (text: string, config?: MermaidConfig): MermaidConfig {
  const inits = detectDirective(text, /(?:init\b)|(?:initialize\b)/);
  let results = {};

  if (Array.isArray(inits)) {
    const args = inits.map((init) => init.args);
    directiveSanitizer(args);

    results = assignWithDepth(results, [...args]);
  } else {
    results = inits.args;
  }
  if (results) {
    let type = detectType(text, config);
    ['config'].forEach((prop) => {
      if (typeof results[prop] !== 'undefined') {
        if (type === 'flowchart-v2') {
          type = 'flowchart';
        }
        results[type] = results[prop];
        delete results[prop];
      }
    });
  }

  // Todo: refactor this, these results are never used
  return results;
};

/**
 * Detects the directive from the text.
 *
 * Text can be single line or multiline. If type is null or omitted,
 * the first directive encountered in text will be returned
 *
 * ```mermaid
 * graph LR
 * %%{someDirective}%%
 *    a-->b
 *    b-->c
 *    c-->d
 *    d-->e
 *    e-->f
 *    f-->g
 *    g-->h
 * ```
 *
 * @param text - The text defining the graph
 * @param type - The directive to return (default: `null`)
 * @returns An object or Array representing the directive(s) matched by the input type.
 * If a single directive was found, that directive object will be returned.
 */
export const detectDirective = function (
  text: string,
  type: string | RegExp = null
): { type?: string; args?: any } | { type?: string; args?: any }[] {
  try {
    const commentWithoutDirectives = new RegExp(
      `[%]{2}(?![{]${directiveWithoutOpen.source})(?=[}][%]{2}).*\n`,
      'ig'
    );
    text = text.trim().replace(commentWithoutDirectives, '').replace(/'/gm, '"');
    log.debug(
      `Detecting diagram directive${type !== null ? ' type:' + type : ''} based on the text:${text}`
    );
    let match;
    const result = [];
    while ((match = directive.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === directive.lastIndex) {
        directive.lastIndex++;
      }
      if (
        (match && !type) ||
        (type && match[1] && match[1].match(type)) ||
        (type && match[2] && match[2].match(type))
      ) {
        const type = match[1] ? match[1] : match[2];
        const args = match[3] ? match[3].trim() : match[4] ? JSON.parse(match[4].trim()) : null;
        result.push({ type, args });
      }
    }
    if (result.length === 0) {
      result.push({ type: text, args: null });
    }

    return result.length === 1 ? result[0] : result;
  } catch (error) {
    log.error(
      `ERROR: ${error.message} - Unable to parse directive
      ${type !== null ? ' type:' + type : ''} based on the text:${text}`
    );
    return { type: null, args: null };
  }
};

/**
 * Detects whether a substring in present in a given array
 *
 * @param str - The substring to detect
 * @param arr - The array to search
 * @returns The array index containing the substring or -1 if not present
 */
export const isSubstringInArray = function (str: string, arr: string[]): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].match(str)) {
      return i;
    }
  }
  return -1;
};

/**
 * Returns a d3 curve given a curve name
 *
 * @param interpolate - The interpolation name
 * @param defaultCurve - The default curve to return
 * @returns The curve factory to use
 */
export function interpolateToCurve(interpolate?: string, defaultCurve: CurveFactory): CurveFactory {
  if (!interpolate) {
    return defaultCurve;
  }
  const curveName = `curve${interpolate.charAt(0).toUpperCase() + interpolate.slice(1)}`;
  return d3CurveTypes[curveName] || defaultCurve;
}

/**
 * Formats a URL string
 *
 * @param linkStr - String of the URL
 * @param config - Configuration passed to MermaidJS
 * @returns The formatted URL or `undefined`.
 */
export function formatUrl(linkStr: string, config: { securityLevel: string }): string | undefined {
  const url = linkStr.trim();

  if (url) {
    if (config.securityLevel !== 'loose') {
      return sanitizeUrl(url);
    }

    return url;
  }
}

/**
 * Runs a function
 *
 * @param functionName - A dot separated path to the function relative to the `window`
 * @param params - Parameters to pass to the function
 */
export const runFunc = (functionName: string, ...params) => {
  const arrPaths = functionName.split('.');

  const len = arrPaths.length - 1;
  const fnName = arrPaths[len];

  let obj = window;
  for (let i = 0; i < len; i++) {
    obj = obj[arrPaths[i]];
    if (!obj) {
      return;
    }
  }

  obj[fnName](...params);
};

/** A (x, y) point */
interface Point {
  /** The x value */
  x: number;
  /** The y value */
  y: number;
}

/**
 * Finds the distance between two points using the Distance Formula
 *
 * @param p1 - The first point
 * @param p2 - The second point
 * @returns The distance between the two points.
 */
function distance(p1: Point, p2: Point): number {
  return p1 && p2 ? Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) : 0;
}

/**
 * TODO: Give this a description
 *
 * @param points - List of points
 */
function traverseEdge(points: Point[]): Point {
  let prevPoint;
  let totalDistance = 0;

  points.forEach((point) => {
    totalDistance += distance(point, prevPoint);
    prevPoint = point;
  });

  // Traverse half of total distance along points
  let remainingDistance = totalDistance / 2;
  let center = undefined;
  prevPoint = undefined;
  points.forEach((point) => {
    if (prevPoint && !center) {
      const vectorDistance = distance(point, prevPoint);
      if (vectorDistance < remainingDistance) {
        remainingDistance -= vectorDistance;
      } else {
        // The point is remainingDistance from prevPoint in the vector between prevPoint and point
        // Calculate the coordinates
        const distanceRatio = remainingDistance / vectorDistance;
        if (distanceRatio <= 0) {
          center = prevPoint;
        }
        if (distanceRatio >= 1) {
          center = { x: point.x, y: point.y };
        }
        if (distanceRatio > 0 && distanceRatio < 1) {
          center = {
            x: (1 - distanceRatio) * prevPoint.x + distanceRatio * point.x,
            y: (1 - distanceRatio) * prevPoint.y + distanceRatio * point.y,
          };
        }
      }
    }
    prevPoint = point;
  });
  return center;
}

/**
 * {@inheritdoc traverseEdge}
 */
function calcLabelPosition(points: Point[]): Point {
  if (points.length === 1) {
    return points[0];
  }
  return traverseEdge(points);
}

const calcCardinalityPosition = (isRelationTypePresent, points, initialPosition) => {
  let prevPoint;
  log.info(`our points ${JSON.stringify(points)}`);
  if (points[0] !== initialPosition) {
    points = points.reverse();
  }
  // Traverse only 25 total distance along points to find cardinality point
  const distanceToCardinalityPoint = 25;

  let remainingDistance = distanceToCardinalityPoint;
  let center;
  prevPoint = undefined;
  points.forEach((point) => {
    if (prevPoint && !center) {
      const vectorDistance = distance(point, prevPoint);
      if (vectorDistance < remainingDistance) {
        remainingDistance -= vectorDistance;
      } else {
        // The point is remainingDistance from prevPoint in the vector between prevPoint and point
        // Calculate the coordinates
        const distanceRatio = remainingDistance / vectorDistance;
        if (distanceRatio <= 0) {
          center = prevPoint;
        }
        if (distanceRatio >= 1) {
          center = { x: point.x, y: point.y };
        }
        if (distanceRatio > 0 && distanceRatio < 1) {
          center = {
            x: (1 - distanceRatio) * prevPoint.x + distanceRatio * point.x,
            y: (1 - distanceRatio) * prevPoint.y + distanceRatio * point.y,
          };
        }
      }
    }
    prevPoint = point;
  });
  // if relation is present (Arrows will be added), change cardinality point off-set distance (d)
  const d = isRelationTypePresent ? 10 : 5;
  //Calculate Angle for x and y axis
  const angle = Math.atan2(points[0].y - center.y, points[0].x - center.x);
  const cardinalityPosition = { x: 0, y: 0 };
  //Calculation cardinality position using angle, center point on the line/curve but pendicular and with offset-distance
  cardinalityPosition.x = Math.sin(angle) * d + (points[0].x + center.x) / 2;
  cardinalityPosition.y = -Math.cos(angle) * d + (points[0].y + center.y) / 2;
  return cardinalityPosition;
};

/**
 * Calculates the terminal label position.
 *
 * @param terminalMarkerSize - Terminal marker size.
 * @param position - Position of label relative to points.
 * @param _points - Array of points.
 * @returns - The `cardinalityPosition`.
 */
function calcTerminalLabelPosition(
  terminalMarkerSize: number,
  position: 'start_left' | 'start_right' | 'end_left' | 'end_right',
  _points: Point[]
): Point {
  // Todo looking to faster cloning method
  let points = JSON.parse(JSON.stringify(_points));
  let prevPoint;
  log.info('our points', points);
  if (position !== 'start_left' && position !== 'start_right') {
    points = points.reverse();
  }

  points.forEach((point) => {
    prevPoint = point;
  });

  // Traverse only 25 total distance along points to find cardinality point
  const distanceToCardinalityPoint = 25 + terminalMarkerSize;

  let remainingDistance = distanceToCardinalityPoint;
  let center;
  prevPoint = undefined;
  points.forEach((point) => {
    if (prevPoint && !center) {
      const vectorDistance = distance(point, prevPoint);
      if (vectorDistance < remainingDistance) {
        remainingDistance -= vectorDistance;
      } else {
        // The point is remainingDistance from prevPoint in the vector between prevPoint and point
        // Calculate the coordinates
        const distanceRatio = remainingDistance / vectorDistance;
        if (distanceRatio <= 0) {
          center = prevPoint;
        }
        if (distanceRatio >= 1) {
          center = { x: point.x, y: point.y };
        }
        if (distanceRatio > 0 && distanceRatio < 1) {
          center = {
            x: (1 - distanceRatio) * prevPoint.x + distanceRatio * point.x,
            y: (1 - distanceRatio) * prevPoint.y + distanceRatio * point.y,
          };
        }
      }
    }
    prevPoint = point;
  });
  // if relation is present (Arrows will be added), change cardinality point off-set distance (d)
  const d = 10 + terminalMarkerSize * 0.5;
  //Calculate Angle for x and y axis
  const angle = Math.atan2(points[0].y - center.y, points[0].x - center.x);

  const cardinalityPosition = { x: 0, y: 0 };

  //Calculation cardinality position using angle, center point on the line/curve but pendicular and with offset-distance

  cardinalityPosition.x = Math.sin(angle) * d + (points[0].x + center.x) / 2;
  cardinalityPosition.y = -Math.cos(angle) * d + (points[0].y + center.y) / 2;
  if (position === 'start_left') {
    cardinalityPosition.x = Math.sin(angle + Math.PI) * d + (points[0].x + center.x) / 2;
    cardinalityPosition.y = -Math.cos(angle + Math.PI) * d + (points[0].y + center.y) / 2;
  }
  if (position === 'end_right') {
    cardinalityPosition.x = Math.sin(angle - Math.PI) * d + (points[0].x + center.x) / 2 - 5;
    cardinalityPosition.y = -Math.cos(angle - Math.PI) * d + (points[0].y + center.y) / 2 - 5;
  }
  if (position === 'end_left') {
    cardinalityPosition.x = Math.sin(angle) * d + (points[0].x + center.x) / 2 - 5;
    cardinalityPosition.y = -Math.cos(angle) * d + (points[0].y + center.y) / 2 - 5;
  }
  return cardinalityPosition;
}

/**
 * Gets styles from an array of declarations
 *
 * @param arr - Declarations
 * @returns The styles grouped as strings
 */
export function getStylesFromArray(arr: string[]): { style: string; labelStyle: string } {
  let style = '';
  let labelStyle = '';

  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== 'undefined') {
      // add text properties to label style definition
      if (arr[i].startsWith('color:') || arr[i].startsWith('text-align:')) {
        labelStyle = labelStyle + arr[i] + ';';
      } else {
        style = style + arr[i] + ';';
      }
    }
  }

  return { style: style, labelStyle: labelStyle };
}

let cnt = 0;
export const generateId = () => {
  cnt++;
  return 'id-' + Math.random().toString(36).substr(2, 12) + '-' + cnt;
};

/**
 * Generates a random hexadecimal id of the given length.
 *
 * @param length - Length of ID.
 * @returns The generated ID.
 */
function makeid(length: number): string {
  let result = '';
  const characters = '0123456789abcdef';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const random = (options) => {
  return makeid(options.length);
};

export const getTextObj = function () {
  return {
    x: 0,
    y: 0,
    fill: undefined,
    anchor: 'start',
    style: '#666',
    width: 100,
    height: 100,
    textMargin: 0,
    rx: 0,
    ry: 0,
    valign: undefined,
  };
};

/**
 * Adds text to an element
 *
 * @param elem - SVG Element to add text to
 * @param textData - Text options.
 * @returns Text element with given styling and content
 */
export const drawSimpleText = function (
  elem: SVGElement,
  textData: {
    text: string;
    x: number;
    y: number;
    anchor: 'start' | 'middle' | 'end';
    fontFamily: string;
    fontSize: string | number;
    fontWeight: string | number;
    fill: string;
    class: string | undefined;
    textMargin: number;
  }
): SVGTextElement {
  // Remove and ignore br:s
  const nText = textData.text.replace(common.lineBreakRegex, ' ');

  const textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.style('text-anchor', textData.anchor);
  textElem.style('font-family', textData.fontFamily);
  textElem.style('font-size', textData.fontSize);
  textElem.style('font-weight', textData.fontWeight);
  textElem.attr('fill', textData.fill);
  if (typeof textData.class !== 'undefined') {
    textElem.attr('class', textData.class);
  }

  const span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.attr('fill', textData.fill);
  span.text(nText);

  return textElem;
};

export const wrapLabel = memoize(
  (label, maxWidth, config) => {
    if (!label) {
      return label;
    }
    config = Object.assign(
      { fontSize: 12, fontWeight: 400, fontFamily: 'Arial', joinWith: '<br/>' },
      config
    );
    if (common.lineBreakRegex.test(label)) {
      return label;
    }
    const words = label.split(' ');
    const completedLines = [];
    let nextLine = '';
    words.forEach((word, index) => {
      const wordLength = calculateTextWidth(`${word} `, config);
      const nextLineLength = calculateTextWidth(nextLine, config);
      if (wordLength > maxWidth) {
        const { hyphenatedStrings, remainingWord } = breakString(word, maxWidth, '-', config);
        completedLines.push(nextLine, ...hyphenatedStrings);
        nextLine = remainingWord;
      } else if (nextLineLength + wordLength >= maxWidth) {
        completedLines.push(nextLine);
        nextLine = word;
      } else {
        nextLine = [nextLine, word].filter(Boolean).join(' ');
      }
      const currentWord = index + 1;
      const isLastWord = currentWord === words.length;
      if (isLastWord) {
        completedLines.push(nextLine);
      }
    });
    return completedLines.filter((line) => line !== '').join(config.joinWith);
  },
  (label, maxWidth, config) =>
    `${label}${maxWidth}${config.fontSize}${config.fontWeight}${config.fontFamily}${config.joinWith}`
);

const breakString = memoize(
  (word, maxWidth, hyphenCharacter = '-', config) => {
    config = Object.assign(
      { fontSize: 12, fontWeight: 400, fontFamily: 'Arial', margin: 0 },
      config
    );
    const characters = word.split('');
    const lines = [];
    let currentLine = '';
    characters.forEach((character, index) => {
      const nextLine = `${currentLine}${character}`;
      const lineWidth = calculateTextWidth(nextLine, config);
      if (lineWidth >= maxWidth) {
        const currentCharacter = index + 1;
        const isLastLine = characters.length === currentCharacter;
        const hyphenatedNextLine = `${nextLine}${hyphenCharacter}`;
        lines.push(isLastLine ? nextLine : hyphenatedNextLine);
        currentLine = '';
      } else {
        currentLine = nextLine;
      }
    });
    return { hyphenatedStrings: lines, remainingWord: currentLine };
  },
  (word, maxWidth, hyphenCharacter = '-', config) =>
    `${word}${maxWidth}${hyphenCharacter}${config.fontSize}${config.fontWeight}${config.fontFamily}`
);

/**
 * This calculates the text's height, taking into account the wrap breaks and both the statically
 * configured height, width, and the length of the text (in pixels).
 *
 * If the wrapped text text has greater height, we extend the height, so it's value won't overflow.
 *
 * @param text - The text to measure
 * @param config - The config for fontSize, fontFamily, and fontWeight all impacting the
 *   resulting size
 * @returns The height for the given text
 */
export function calculateTextHeight(
  text: Parameters<typeof calculateTextDimensions>[0],
  config: Parameters<typeof calculateTextDimensions>[1]
): ReturnType<typeof calculateTextDimensions>['height'] {
  config = Object.assign(
    { fontSize: 12, fontWeight: 400, fontFamily: 'Arial', margin: 15 },
    config
  );
  return calculateTextDimensions(text, config).height;
}

/**
 * This calculates the width of the given text, font size and family.
 *
 * @param text - The text to calculate the width of
 * @param config - The config for fontSize, fontFamily, and fontWeight all impacting the
 *   resulting size
 * @returns The width for the given text
 */
export function calculateTextWidth(
  text: Parameters<typeof calculateTextDimensions>[0],
  config: Parameters<typeof calculateTextDimensions>[1]
): ReturnType<typeof calculateTextDimensions>['width'] {
  config = Object.assign({ fontSize: 12, fontWeight: 400, fontFamily: 'Arial' }, config);
  return calculateTextDimensions(text, config).width;
}

/**
 * This calculates the dimensions of the given text, font size, font family, font weight, and
 * margins.
 *
 * @param text - The text to calculate the width of
 * @param config - The config for fontSize, fontFamily, fontWeight, and margin all impacting
 *   the resulting size
 * @returns The dimensions for the given text
 */
export const calculateTextDimensions = memoize(
  function (
    text: string,
    config: {
      fontSize?: number;
      fontWeight?: number;
      fontFamily?: string;
    }
  ) {
    config = Object.assign({ fontSize: 12, fontWeight: 400, fontFamily: 'Arial' }, config);
    const { fontSize, fontFamily, fontWeight } = config;
    if (!text) {
      return { width: 0, height: 0 };
    }

    // We can't really know if the user supplied font family will render on the user agent;
    // thus, we'll take the max width between the user supplied font family, and a default
    // of sans-serif.
    const fontFamilies = ['sans-serif', fontFamily];
    const lines = text.split(common.lineBreakRegex);
    const dims = [];

    const body = select('body');
    // We don't want to leak DOM elements - if a removal operation isn't available
    // for any reason, do not continue.
    if (!body.remove) {
      return { width: 0, height: 0, lineHeight: 0 };
    }

    const g = body.append('svg');

    for (const fontFamily of fontFamilies) {
      let cheight = 0;
      const dim = { width: 0, height: 0, lineHeight: 0 };
      for (const line of lines) {
        const textObj = getTextObj();
        textObj.text = line;
        const textElem = drawSimpleText(g, textObj)
          .style('font-size', fontSize)
          .style('font-weight', fontWeight)
          .style('font-family', fontFamily);

        const bBox = (textElem._groups || textElem)[0][0].getBBox();
        dim.width = Math.round(Math.max(dim.width, bBox.width));
        cheight = Math.round(bBox.height);
        dim.height += cheight;
        dim.lineHeight = Math.round(Math.max(dim.lineHeight, cheight));
      }
      dims.push(dim);
    }

    g.remove();

    const index =
      isNaN(dims[1].height) ||
      isNaN(dims[1].width) ||
      isNaN(dims[1].lineHeight) ||
      (dims[0].height > dims[1].height &&
        dims[0].width > dims[1].width &&
        dims[0].lineHeight > dims[1].lineHeight)
        ? 0
        : 1;
    return dims[index];
  },
  (text, config) => `${text}${config.fontSize}${config.fontWeight}${config.fontFamily}`
);

export const initIdGenerator = class iterator {
  constructor(deterministic, seed) {
    this.deterministic = deterministic;
    // TODO: Seed is only used for length?
    this.seed = seed;

    this.count = seed ? seed.length : 0;
  }

  next() {
    if (!this.deterministic) {
      return Date.now();
    }

    return this.count++;
  }
};

let decoder;

/**
 * Decodes HTML, source: {@link https://github.com/shrpne/entity-decode/blob/v2.0.1/browser.js}
 *
 * @param html - HTML as a string
 * @returns Unescaped HTML
 */
export const entityDecode = function (html: string): string {
  decoder = decoder || document.createElement('div');
  // Escape HTML before decoding for HTML Entities
  html = escape(html).replace(/%26/g, '&').replace(/%23/g, '#').replace(/%3B/g, ';');
  // decoding
  decoder.innerHTML = html;
  return unescape(decoder.textContent);
};

/**
 * Sanitizes directive objects
 *
 * @param args - Directive's JSON
 */
export const directiveSanitizer = (args: any) => {
  log.debug('directiveSanitizer called with', args);
  if (typeof args === 'object') {
    // check for array
    if (args.length) {
      args.forEach((arg) => directiveSanitizer(arg));
    } else {
      // This is an object
      Object.keys(args).forEach((key) => {
        log.debug('Checking key', key);
        if (key.indexOf('__') === 0) {
          log.debug('sanitize deleting __ option', key);
          delete args[key];
        }

        if (key.indexOf('proto') >= 0) {
          log.debug('sanitize deleting proto option', key);
          delete args[key];
        }

        if (key.indexOf('constr') >= 0) {
          log.debug('sanitize deleting constr option', key);
          delete args[key];
        }

        if (key.indexOf('themeCSS') >= 0) {
          log.debug('sanitizing themeCss option');
          args[key] = sanitizeCss(args[key]);
        }
        if (key.indexOf('fontFamily') >= 0) {
          log.debug('sanitizing fontFamily option');
          args[key] = sanitizeCss(args[key]);
        }
        if (key.indexOf('altFontFamily') >= 0) {
          log.debug('sanitizing altFontFamily option');
          args[key] = sanitizeCss(args[key]);
        }
        if (configKeys.indexOf(key) < 0) {
          log.debug('sanitize deleting option', key);
          delete args[key];
        } else {
          if (typeof args[key] === 'object') {
            log.debug('sanitize deleting object', key);
            directiveSanitizer(args[key]);
          }
        }
      });
    }
  }
  if (args.themeVariables) {
    const kArr = Object.keys(args.themeVariables);
    for (let i = 0; i < kArr.length; i++) {
      const k = kArr[i];
      const val = args.themeVariables[k];
      if (val && val.match && !val.match(/^[a-zA-Z0-9#,";()%. ]+$/)) {
        args.themeVariables[k] = '';
      }
    }
  }
  log.debug('After sanitization', args);
};
export const sanitizeCss = (str) => {
  let startCnt = 0;
  let endCnt = 0;

  for (let i = 0; i < str.length; i++) {
    if (startCnt < endCnt) {
      return '{ /* ERROR: Unbalanced CSS */ }';
    }
    if (str[i] === '{') {
      startCnt++;
    } else if (str[i] === '}') {
      endCnt++;
    }
  }
  if (startCnt !== endCnt) {
    return '{ /* ERROR: Unbalanced CSS */ }';
  }
  // Todo add more checks here
  return str;
};

export interface DetailedError {
  str: string;
  hash: any;
  error?: any;
  message?: string;
}

/** @param error - The error to check */
export function isDetailedError(error: unknown): error is DetailedError {
  return 'str' in error;
}

/** @param error - The error to convert to an error message */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export default {
  assignWithDepth,
  wrapLabel,
  calculateTextHeight,
  calculateTextWidth,
  calculateTextDimensions,
  detectInit,
  detectDirective,
  isSubstringInArray,
  interpolateToCurve,
  calcLabelPosition,
  calcCardinalityPosition,
  calcTerminalLabelPosition,
  formatUrl,
  getStylesFromArray,
  generateId,
  random,
  runFunc,
  entityDecode,
  initIdGenerator: initIdGenerator,
  directiveSanitizer,
  sanitizeCss,
};
