import { sanitizeUrl } from '@braintree/sanitize-url';
import type { BaseType, CurveFactory } from 'd3';
import {
  curveBasis,
  curveBasisClosed,
  curveBasisOpen,
  curveBumpX,
  curveBumpY,
  curveBundle,
  curveCardinalClosed,
  curveCardinalOpen,
  curveCardinal,
  curveCatmullRomClosed,
  curveCatmullRomOpen,
  curveCatmullRom,
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
import common from './diagrams/common/common.js';
import { sanitizeDirective } from './utils/sanitizeDirective.js';
import { log } from './logger.js';
import { detectType } from './diagram-api/detectType.js';
import assignWithDepth from './assignWithDepth.js';
import type { MermaidConfig } from './config.type.js';
import memoize from 'lodash-es/memoize.js';
import merge from 'lodash-es/merge.js';
import { directiveRegex } from './diagram-api/regexes.js';
import type { D3Element, Point, TextDimensionConfig, TextDimensions } from './types.js';

export const ZERO_WIDTH_SPACE = '\u200b';

// Effectively an enum of the supported curve types, accessible by name
const d3CurveTypes = {
  curveBasis: curveBasis,
  curveBasisClosed: curveBasisClosed,
  curveBasisOpen: curveBasisOpen,
  curveBumpX: curveBumpX,
  curveBumpY: curveBumpY,
  curveBundle: curveBundle,
  curveCardinalClosed: curveCardinalClosed,
  curveCardinalOpen: curveCardinalOpen,
  curveCardinal: curveCardinal,
  curveCatmullRomClosed: curveCatmullRomClosed,
  curveCatmullRomOpen: curveCatmullRomOpen,
  curveCatmullRom: curveCatmullRom,
  curveLinear: curveLinear,
  curveLinearClosed: curveLinearClosed,
  curveMonotoneX: curveMonotoneX,
  curveMonotoneY: curveMonotoneY,
  curveNatural: curveNatural,
  curveStep: curveStep,
  curveStepAfter: curveStepAfter,
  curveStepBefore: curveStepBefore,
} as const;

const directiveWithoutOpen =
  /\s*(?:(\w+)(?=:):|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi;
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
export const detectInit = function (
  text: string,
  config?: MermaidConfig
): MermaidConfig | undefined {
  const inits = detectDirective(text, /(?:init\b)|(?:initialize\b)/);
  let results: MermaidConfig & { config?: unknown } = {};

  if (Array.isArray(inits)) {
    const args = inits.map((init) => init.args);
    sanitizeDirective(args);
    results = assignWithDepth(results, [...args]);
  } else {
    results = inits.args as MermaidConfig;
  }

  if (!results) {
    return;
  }

  let type = detectType(text, config);

  // Move the `config` value to appropriate diagram type value
  const prop = 'config';
  if (results[prop] !== undefined) {
    if (type === 'flowchart-v2') {
      type = 'flowchart';
    }
    results[type as keyof MermaidConfig] = results[prop];
    delete results[prop];
  }

  return results;
};

interface Directive {
  type?: string;
  args?: unknown;
}
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
  type: string | RegExp | null = null
): Directive | Directive[] {
  try {
    const commentWithoutDirectives = new RegExp(
      `[%]{2}(?![{]${directiveWithoutOpen.source})(?=[}][%]{2}).*\n`,
      'ig'
    );
    text = text.trim().replace(commentWithoutDirectives, '').replace(/'/gm, '"');
    log.debug(
      `Detecting diagram directive${type !== null ? ' type:' + type : ''} based on the text:${text}`
    );
    let match: RegExpExecArray | null;
    const result: Directive[] = [];
    while ((match = directiveRegex.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === directiveRegex.lastIndex) {
        directiveRegex.lastIndex++;
      }
      if ((match && !type) || (type && match[1]?.match(type)) || (type && match[2]?.match(type))) {
        const type = match[1] ? match[1] : match[2];
        const args = match[3] ? match[3].trim() : match[4] ? JSON.parse(match[4].trim()) : null;
        result.push({ type, args });
      }
    }
    if (result.length === 0) {
      return { type: text, args: null };
    }

    return result.length === 1 ? result[0] : result;
  } catch (error) {
    log.error(
      `ERROR: ${
        (error as Error).message
      } - Unable to parse directive type: '${type}' based on the text: '${text}'`
    );
    return { type: undefined, args: null };
  }
};

export const removeDirectives = function (text: string): string {
  return text.replace(directiveRegex, '');
};

/**
 * Detects whether a substring in present in a given array
 *
 * @param str - The substring to detect
 * @param arr - The array to search
 * @returns The array index containing the substring or -1 if not present
 */
export const isSubstringInArray = function (str: string, arr: string[]): number {
  for (const [i, element] of arr.entries()) {
    if (element.match(str)) {
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
export function interpolateToCurve(
  interpolate: string | undefined,
  defaultCurve: CurveFactory
): CurveFactory {
  if (!interpolate) {
    return defaultCurve;
  }
  const curveName = `curve${interpolate.charAt(0).toUpperCase() + interpolate.slice(1)}`;

  // @ts-ignore TODO: Fix issue with curve type
  return d3CurveTypes[curveName as keyof typeof d3CurveTypes] ?? defaultCurve;
}

/**
 * Formats a URL string
 *
 * @param linkStr - String of the URL
 * @param config - Configuration passed to MermaidJS
 * @returns The formatted URL or `undefined`.
 */
export function formatUrl(linkStr: string, config: MermaidConfig): string | undefined {
  const url = linkStr.trim();

  if (!url) {
    return undefined;
  }

  if (config.securityLevel !== 'loose') {
    return sanitizeUrl(url);
  }

  return url;
}

/**
 * Runs a function
 *
 * @param functionName - A dot separated path to the function relative to the `window`
 * @param params - Parameters to pass to the function
 */
export const runFunc = (functionName: string, ...params: unknown[]) => {
  const arrPaths = functionName.split('.');

  const len = arrPaths.length - 1;
  const fnName = arrPaths[len];

  let obj = window;
  for (let i = 0; i < len; i++) {
    obj = obj[arrPaths[i] as keyof typeof obj];
    if (!obj) {
      log.error(`Function name: ${functionName} not found in window`);
      return;
    }
  }

  obj[fnName as keyof typeof obj](...params);
};

/**
 * Finds the distance between two points using the Distance Formula
 *
 * @param p1 - The first point
 * @param p2 - The second point
 * @returns The distance between the two points.
 */
function distance(p1?: Point, p2?: Point): number {
  if (!p1 || !p2) {
    return 0;
  }
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * TODO: Give this a description
 *
 * @param points - List of points
 */
function traverseEdge(points: Point[]): Point {
  let prevPoint: Point | undefined;
  let totalDistance = 0;

  points.forEach((point) => {
    totalDistance += distance(point, prevPoint);
    prevPoint = point;
  });

  // Traverse half of total distance along points
  const remainingDistance = totalDistance / 2;
  return calculatePoint(points, remainingDistance);
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

export const roundNumber = (num: number, precision = 2) => {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
};

export const calculatePoint = (points: Point[], distanceToTraverse: number): Point => {
  let prevPoint: Point | undefined = undefined;
  let remainingDistance = distanceToTraverse;
  for (const point of points) {
    if (prevPoint) {
      const vectorDistance = distance(point, prevPoint);
      if (vectorDistance < remainingDistance) {
        remainingDistance -= vectorDistance;
      } else {
        // The point is remainingDistance from prevPoint in the vector between prevPoint and point
        // Calculate the coordinates
        const distanceRatio = remainingDistance / vectorDistance;
        if (distanceRatio <= 0) {
          return prevPoint;
        }
        if (distanceRatio >= 1) {
          return { x: point.x, y: point.y };
        }
        if (distanceRatio > 0 && distanceRatio < 1) {
          return {
            x: roundNumber((1 - distanceRatio) * prevPoint.x + distanceRatio * point.x, 5),
            y: roundNumber((1 - distanceRatio) * prevPoint.y + distanceRatio * point.y, 5),
          };
        }
      }
    }
    prevPoint = point;
  }
  throw new Error('Could not find a suitable point for the given distance');
};

const calcCardinalityPosition = (
  isRelationTypePresent: boolean,
  points: Point[],
  initialPosition: Point
) => {
  log.info(`our points ${JSON.stringify(points)}`);
  if (points[0] !== initialPosition) {
    points = points.reverse();
  }
  // Traverse only 25 total distance along points to find cardinality point
  const distanceToCardinalityPoint = 25;
  const center = calculatePoint(points, distanceToCardinalityPoint);
  // if relation is present (Arrows will be added), change cardinality point off-set distance (d)
  const d = isRelationTypePresent ? 10 : 5;
  //Calculate Angle for x and y axis
  const angle = Math.atan2(points[0].y - center.y, points[0].x - center.x);
  const cardinalityPosition = { x: 0, y: 0 };
  //Calculation cardinality position using angle, center point on the line/curve but perpendicular and with offset-distance
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
  const points = structuredClone(_points);
  log.info('our points', points);
  if (position !== 'start_left' && position !== 'start_right') {
    points.reverse();
  }

  // Traverse only 25 total distance along points to find cardinality point
  const distanceToCardinalityPoint = 25 + terminalMarkerSize;
  const center = calculatePoint(points, distanceToCardinalityPoint);

  // if relation is present (Arrows will be added), change cardinality point off-set distance (d)
  const d = 10 + terminalMarkerSize * 0.5;
  //Calculate Angle for x and y axis
  const angle = Math.atan2(points[0].y - center.y, points[0].x - center.x);

  const cardinalityPosition: Point = { x: 0, y: 0 };
  //Calculation cardinality position using angle, center point on the line/curve but perpendicular and with offset-distance

  if (position === 'start_left') {
    cardinalityPosition.x = Math.sin(angle + Math.PI) * d + (points[0].x + center.x) / 2;
    cardinalityPosition.y = -Math.cos(angle + Math.PI) * d + (points[0].y + center.y) / 2;
  } else if (position === 'end_right') {
    cardinalityPosition.x = Math.sin(angle - Math.PI) * d + (points[0].x + center.x) / 2 - 5;
    cardinalityPosition.y = -Math.cos(angle - Math.PI) * d + (points[0].y + center.y) / 2 - 5;
  } else if (position === 'end_left') {
    cardinalityPosition.x = Math.sin(angle) * d + (points[0].x + center.x) / 2 - 5;
    cardinalityPosition.y = -Math.cos(angle) * d + (points[0].y + center.y) / 2 - 5;
  } else {
    cardinalityPosition.x = Math.sin(angle) * d + (points[0].x + center.x) / 2;
    cardinalityPosition.y = -Math.cos(angle) * d + (points[0].y + center.y) / 2;
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

  for (const element of arr) {
    if (element !== undefined) {
      // add text properties to label style definition
      if (element.startsWith('color:') || element.startsWith('text-align:')) {
        labelStyle = labelStyle + element + ';';
      } else {
        style = style + element + ';';
      }
    }
  }

  return { style, labelStyle };
}

let cnt = 0;
export const generateId = () => {
  cnt++;
  return 'id-' + Math.random().toString(36).substr(2, 12) + '-' + cnt;
};

/**
 * Generates a random hexadecimal id of the given length.
 *
 * @param length - Length of string.
 * @returns The generated string.
 */
function makeRandomHex(length: number): string {
  let result = '';
  const characters = '0123456789abcdef';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const random = (options: { length: number }) => {
  return makeRandomHex(options.length);
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
    text: '',
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

  const [, _fontSizePx] = parseFontSize(textData.fontSize);

  const textElem = elem.append('text') as any;
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.style('text-anchor', textData.anchor);
  textElem.style('font-family', textData.fontFamily);
  textElem.style('font-size', _fontSizePx);
  textElem.style('font-weight', textData.fontWeight);
  textElem.attr('fill', textData.fill);

  if (textData.class !== undefined) {
    textElem.attr('class', textData.class);
  }

  const span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.attr('fill', textData.fill);
  span.text(nText);

  return textElem;
};

interface WrapLabelConfig {
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  joinWith: string;
}

export const wrapLabel: (label: string, maxWidth: number, config: WrapLabelConfig) => string =
  memoize(
    (label: string, maxWidth: number, config: WrapLabelConfig): string => {
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
      const words = label.split(' ').filter(Boolean);
      const completedLines: string[] = [];
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

interface BreakStringOutput {
  hyphenatedStrings: string[];
  remainingWord: string;
}

const breakString: (
  word: string,
  maxWidth: number,
  hyphenCharacter: string,
  config: WrapLabelConfig
) => BreakStringOutput = memoize(
  (
    word: string,
    maxWidth: number,
    hyphenCharacter = '-',
    config: WrapLabelConfig
  ): BreakStringOutput => {
    config = Object.assign(
      { fontSize: 12, fontWeight: 400, fontFamily: 'Arial', margin: 0 },
      config
    );
    const characters = [...word];
    const lines: string[] = [];
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
export const calculateTextDimensions: (
  text: string,
  config: TextDimensionConfig
) => TextDimensions = memoize(
  (text: string, config: TextDimensionConfig): TextDimensions => {
    const { fontSize = 12, fontFamily = 'Arial', fontWeight = 400 } = config;
    if (!text) {
      return { width: 0, height: 0 };
    }

    const [, _fontSizePx] = parseFontSize(fontSize);

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
      let cHeight = 0;
      const dim = { width: 0, height: 0, lineHeight: 0 };
      for (const line of lines) {
        const textObj = getTextObj();
        textObj.text = line || ZERO_WIDTH_SPACE;
        // @ts-ignore TODO: Fix D3 types
        const textElem = drawSimpleText(g, textObj)
          // @ts-ignore TODO: Fix D3 types
          .style('font-size', _fontSizePx)
          .style('font-weight', fontWeight)
          .style('font-family', fontFamily);

        const bBox = (textElem._groups || textElem)[0][0].getBBox();
        if (bBox.width === 0 && bBox.height === 0) {
          throw new Error('svg element not in render tree');
        }
        dim.width = Math.round(Math.max(dim.width, bBox.width));
        cHeight = Math.round(bBox.height);
        dim.height += cHeight;
        dim.lineHeight = Math.round(Math.max(dim.lineHeight, cHeight));
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

export class InitIDGenerator {
  private count = 0;
  public next: () => number;
  constructor(deterministic = false, seed?: string) {
    // TODO: Seed is only used for length?
    // v11: Use the actual value of seed string to generate an initial value for count.
    this.count = seed ? seed.length : 0;
    this.next = deterministic ? () => this.count++ : () => Date.now();
  }
}

let decoder: HTMLDivElement;

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
  decoder.innerHTML = html;

  return unescape(decoder.textContent!);
};

export interface DetailedError {
  str: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hash: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
  message?: string;
}

/** @param error - The error to check */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDetailedError(error: any): error is DetailedError {
  return 'str' in error;
}

/** @param error - The error to convert to an error message */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Appends <text> element with the given title and css class.
 *
 * @param parent - d3 svg object to append title to
 * @param cssClass - CSS class for the <text> element containing the title
 * @param titleTopMargin - Margin in pixels between title and rest of the graph
 * @param title - The title. If empty, returns immediately.
 */
export const insertTitle = (
  parent: D3Element,
  cssClass: string,
  titleTopMargin: number,
  title?: string
): void => {
  if (!title) {
    return;
  }
  const bounds = parent.node()?.getBBox();
  if (!bounds) {
    return;
  }
  parent
    .append('text')
    .text(title)
    .attr('text-anchor', 'middle')
    .attr('x', bounds.x + bounds.width / 2)
    .attr('y', -titleTopMargin)
    .attr('class', cssClass);
};

/**
 * Parses a raw fontSize configuration value into a number and string value.
 *
 * @param fontSize - a string or number font size configuration value
 *
 * @returns parsed number and string style font size values, or nulls if a number value can't
 * be parsed from an input string.
 */
export const parseFontSize = (fontSize: string | number | undefined): [number?, string?] => {
  // if the font size is a number, assume a px string representation
  if (typeof fontSize === 'number') {
    return [fontSize, fontSize + 'px'];
  }

  const fontSizeNumber = parseInt(fontSize ?? '', 10);
  if (Number.isNaN(fontSizeNumber)) {
    // if a number value can't be parsed, return null for both values
    return [undefined, undefined];
  } else if (fontSize === String(fontSizeNumber)) {
    // if a string input doesn't contain any units, assume px units
    return [fontSizeNumber, fontSize + 'px'];
  } else {
    return [fontSizeNumber, fontSize];
  }
};

export function cleanAndMerge<T>(defaultData: T, data?: Partial<T>): T {
  return merge({}, defaultData, data);
}

export default {
  assignWithDepth,
  wrapLabel,
  calculateTextHeight,
  calculateTextWidth,
  calculateTextDimensions,
  cleanAndMerge,
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
  insertTitle,
  parseFontSize,
  InitIDGenerator,
};

/**
 * @param  text - text to be encoded
 * @returns
 */
export const encodeEntities = function (text: string): string {
  let txt = text;

  txt = txt.replace(/style.*:\S*#.*;/g, function (s): string {
    return s.substring(0, s.length - 1);
  });
  txt = txt.replace(/classDef.*:\S*#.*;/g, function (s): string {
    return s.substring(0, s.length - 1);
  });

  txt = txt.replace(/#\w+;/g, function (s) {
    const innerTxt = s.substring(1, s.length - 1);

    const isInt = /^\+?\d+$/.test(innerTxt);
    if (isInt) {
      return 'ﬂ°°' + innerTxt + '¶ß';
    } else {
      return 'ﬂ°' + innerTxt + '¶ß';
    }
  });

  return txt;
};

/**
 *
 * @param  text - text to be decoded
 * @returns
 */
export const decodeEntities = function (text: string): string {
  return text.replace(/ﬂ°°/g, '&#').replace(/ﬂ°/g, '&').replace(/¶ß/g, ';');
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const getEdgeId = (
  from: string,
  to: string,
  {
    counter = 0,
    prefix,
    suffix,
  }: {
    counter?: number;
    prefix?: string;
    suffix?: string;
  },
  id?: string
) => {
  if (id) {
    return id;
  }
  return `${prefix ? `${prefix}_` : ''}${from}_${to}_${counter}${suffix ? `_${suffix}` : ''}`;
};

/**
 * D3's `selection.attr` method doesn't officially support `undefined`.
 *
 * However, it seems if you do pass `undefined`, it seems to be treated as `null`
 * (e.g. it removes the attribute).
 */
export function handleUndefinedAttr(
  attrValue: Parameters<d3.Selection<BaseType, unknown, HTMLElement, any>['attr']>[1] | undefined
) {
  return attrValue ?? null;
}
