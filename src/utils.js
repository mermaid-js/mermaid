import { sanitizeUrl } from '@braintree/sanitize-url';
import {
  curveBasis,
  curveBasisClosed,
  curveBasisOpen,
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
const anyComment = /\s*%%.*\n/gm;

/**
 * @function detectInit Detects the init config object from the text
 *
 *   ```mermaid
 *   %%{init: {"theme": "debug", "logLevel": 1 }}%%
 *   graph LR
 *    a-->b
 *    b-->c
 *    c-->d
 *    d-->e
 *    e-->f
 *    f-->g
 *    g-->h
 * ```
 *
 *   Or
 *
 *   ```mermaid
 *   %%{initialize: {"theme": "dark", logLevel: "debug" }}%%
 *   graph LR
 *    a-->b
 *    b-->c
 *    c-->d
 *    d-->e
 *    e-->f
 *    f-->g
 *    g-->h
 * ```
 * @param {string} text The text defining the graph
 * @param {any} cnf
 * @returns {object} The json object representing the init passed to mermaid.initialize()
 */
export const detectInit = function (text, cnf) {
  let inits = detectDirective(text, /(?:init\b)|(?:initialize\b)/);
  let results = {};

  if (Array.isArray(inits)) {
    let args = inits.map((init) => init.args);
    directiveSanitizer(args);

    results = assignWithDepth(results, [...args]);
  } else {
    results = inits.args;
  }
  if (results) {
    let type = detectType(text, cnf);
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
 * @function detectDirective Detects the directive from the text. Text can be single line or
 *   multiline. If type is null or omitted the first directive encountered in text will be returned
 *
 *   ```mermaid
 *   graph LR
 *    %%{somedirective}%%
 *    a-->b
 *    b-->c
 *    c-->d
 *    d-->e
 *    e-->f
 *    f-->g
 *    g-->h
 * ```
 * @param {string} text The text defining the graph
 * @param {string | RegExp} type The directive to return (default: null)
 * @returns {object | Array} An object or Array representing the directive(s): { type: string, args:
 *   object|null } matched by the input type if a single directive was found, that directive object
 *   will be returned.
 */
export const detectDirective = function (text, type = null) {
  try {
    const commentWithoutDirectives = new RegExp(
      `[%]{2}(?![{]${directiveWithoutOpen.source})(?=[}][%]{2}).*\n`,
      'ig'
    );
    text = text.trim().replace(commentWithoutDirectives, '').replace(/'/gm, '"');
    log.debug(
      `Detecting diagram directive${type !== null ? ' type:' + type : ''} based on the text:${text}`
    );
    let match,
      result = [];
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
        let type = match[1] ? match[1] : match[2];
        let args = match[3] ? match[3].trim() : match[4] ? JSON.parse(match[4].trim()) : null;
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
 * @function detectType Detects the type of the graph text. Takes into consideration the possible
 *   existence of an %%init directive
 *
 *   ```mermaid
 *   %%{initialize: {"startOnLoad": true, logLevel: "fatal" }}%%
 *   graph LR
 *    a-->b
 *    b-->c
 *    c-->d
 *    d-->e
 *    e-->f
 *    f-->g
 *    g-->h
 * ```
 * @param {string} text The text defining the graph
 * @param {{
 *   class: { defaultRenderer: string } | undefined;
 *   state: { defaultRenderer: string } | undefined;
 *   flowchart: { defaultRenderer: string } | undefined;
 * }} [cnf]
 * @returns {string} A graph definition key
 */
export const detectType = function (text, cnf) {
  text = text.replace(directive, '').replace(anyComment, '\n');
  if (text.match(/^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/)) {
    return 'c4';
  }

  if (text.match(/^\s*sequenceDiagram/)) {
    return 'sequence';
  }

  if (text.match(/^\s*gantt/)) {
    return 'gantt';
  }
  if (text.match(/^\s*classDiagram-v2/)) {
    return 'classDiagram';
  }
  if (text.match(/^\s*classDiagram/)) {
    if (cnf && cnf.class && cnf.class.defaultRenderer === 'dagre-wrapper') return 'classDiagram';
    return 'class';
  }

  if (text.match(/^\s*stateDiagram-v2/)) {
    return 'stateDiagram';
  }

  if (text.match(/^\s*stateDiagram/)) {
    if (cnf && cnf.class && cnf.state.defaultRenderer === 'dagre-wrapper') return 'stateDiagram';
    return 'state';
  }

  if (text.match(/^\s*gitGraph/)) {
    return 'gitGraph';
  }
  if (text.match(/^\s*flowchart/)) {
    return 'flowchart-v2';
  }

  if (text.match(/^\s*info/)) {
    return 'info';
  }
  if (text.match(/^\s*pie/)) {
    return 'pie';
  }

  if (text.match(/^\s*erDiagram/)) {
    return 'er';
  }

  if (text.match(/^\s*journey/)) {
    return 'journey';
  }

  if (text.match(/^\s*requirement/) || text.match(/^\s*requirementDiagram/)) {
    return 'requirement';
  }
  if (cnf && cnf.flowchart && cnf.flowchart.defaultRenderer === 'dagre-wrapper')
    return 'flowchart-v2';

  return 'flowchart';
};

/**
 * Caches results of functions based on input
 *
 * @param {Function} fn Function to run
 * @param {Function} resolver Function that resolves to an ID given arguments the `fn` takes
 * @returns {Function} An optimized caching function
 */
const memoize = (fn, resolver) => {
  let cache = {};
  return (...args) => {
    let n = resolver ? resolver.apply(this, args) : args[0];
    if (n in cache) {
      return cache[n];
    } else {
      let result = fn(...args);
      cache[n] = result;
      return result;
    }
  };
};

/**
 * @function isSubstringInArray Detects whether a substring in present in a given array
 * @param {string} str The substring to detect
 * @param {Array} arr The array to search
 * @returns {number} The array index containing the substring or -1 if not present
 */
export const isSubstringInArray = function (str, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].match(str)) return i;
  }
  return -1;
};

/**
 * Returns a d3 curve given a curve name
 *
 * @param {string | undefined} interpolate The interpolation name
 * @param {any} defaultCurve The default curve to return
 * @returns {import('d3-shape').CurveFactory} The curve factory to use
 */
export const interpolateToCurve = (interpolate, defaultCurve) => {
  if (!interpolate) {
    return defaultCurve;
  }
  const curveName = `curve${interpolate.charAt(0).toUpperCase() + interpolate.slice(1)}`;
  return d3CurveTypes[curveName] || defaultCurve;
};

/**
 * Formats a URL string
 *
 * @param {string} linkStr String of the URL
 * @param {{ securityLevel: string }} config Configuration passed to MermaidJS
 * @returns {string | undefined} The formatted URL
 */
export const formatUrl = (linkStr, config) => {
  let url = linkStr.trim();

  if (url) {
    if (config.securityLevel !== 'loose') {
      return sanitizeUrl(url);
    }

    return url;
  }
};

/**
 * Runs a function
 *
 * @param {string} functionName A dot seperated path to the function relative to the `window`
 * @param {...any} params Parameters to pass to the function
 */
export const runFunc = (functionName, ...params) => {
  const arrPaths = functionName.split('.');

  const len = arrPaths.length - 1;
  const fnName = arrPaths[len];

  let obj = window;
  for (let i = 0; i < len; i++) {
    obj = obj[arrPaths[i]];
    if (!obj) return;
  }

  obj[fnName](...params);
};

/**
 * @typedef {object} Point A (x, y) point
 * @property {number} x The x value
 * @property {number} y The y value
 */

/**
 * Finds the distance between two points using the Distance Formula
 *
 * @param {Point} p1 The first point
 * @param {Point} p2 The second point
 * @returns {number} The distance
 */
const distance = (p1, p2) =>
  p1 && p2 ? Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) : 0;

/**
 * @param {Point[]} points List of points
 * @returns {Point}
 * @todo Give this a description
 */
const traverseEdge = (points) => {
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
        if (distanceRatio <= 0) center = prevPoint;
        if (distanceRatio >= 1) center = { x: point.x, y: point.y };
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
};

/**
 * Alias for `traverseEdge`
 *
 * @param {Point[]} points List of points
 * @returns {Point} Return result of `transverseEdge`
 */
const calcLabelPosition = (points) => {
  if (points.length === 1) {
    return points[0];
  }
  return traverseEdge(points);
};

const calcCardinalityPosition = (isRelationTypePresent, points, initialPosition) => {
  let prevPoint;
  let totalDistance = 0; // eslint-disable-line
  log.info('our points', points);
  if (points[0] !== initialPosition) {
    points = points.reverse();
  }
  points.forEach((point) => {
    totalDistance += distance(point, prevPoint);
    prevPoint = point;
  });

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
        if (distanceRatio <= 0) center = prevPoint;
        if (distanceRatio >= 1) center = { x: point.x, y: point.y };
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
  let d = isRelationTypePresent ? 10 : 5;
  //Calculate Angle for x and y axis
  let angle = Math.atan2(points[0].y - center.y, points[0].x - center.x);
  let cardinalityPosition = { x: 0, y: 0 };
  //Calculation cardinality position using angle, center point on the line/curve but pendicular and with offset-distance
  cardinalityPosition.x = Math.sin(angle) * d + (points[0].x + center.x) / 2;
  cardinalityPosition.y = -Math.cos(angle) * d + (points[0].y + center.y) / 2;
  return cardinalityPosition;
};

/**
 * Position ['start_left', 'start_right', 'end_left', 'end_right']
 *
 * @param {any} terminalMarkerSize
 * @param {any} position
 * @param {any} _points
 * @returns {any}
 */
const calcTerminalLabelPosition = (terminalMarkerSize, position, _points) => {
  // Todo looking to faster cloning method
  let points = JSON.parse(JSON.stringify(_points));
  let prevPoint;
  let totalDistance = 0; // eslint-disable-line
  log.info('our points', points);
  if (position !== 'start_left' && position !== 'start_right') {
    points = points.reverse();
  }

  points.forEach((point) => {
    totalDistance += distance(point, prevPoint);
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
        if (distanceRatio <= 0) center = prevPoint;
        if (distanceRatio >= 1) center = { x: point.x, y: point.y };
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
  let d = 10 + terminalMarkerSize * 0.5;
  //Calculate Angle for x and y axis
  let angle = Math.atan2(points[0].y - center.y, points[0].x - center.x);

  let cardinalityPosition = { x: 0, y: 0 };

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
};

/**
 * Gets styles from an array of declarations
 *
 * @param {string[]} arr Declarations
 * @returns {{ style: string; labelStyle: string }} The styles grouped as strings
 */
export const getStylesFromArray = (arr) => {
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
};

let cnt = 0;
export const generateId = () => {
  cnt++;
  return 'id-' + Math.random().toString(36).substr(2, 12) + '-' + cnt;
};

/**
 * @param {any} length
 * @returns {any}
 */
function makeid(length) {
  var result = '';
  var characters = '0123456789abcdef';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const random = (options) => {
  return makeid(options.length);
};

/**
 * @function assignWithDepth Extends the functionality of {@link ObjectConstructor.assign} with the
 *   ability to merge arbitrary-depth objects For each key in src with path `k` (recursively)
 *   performs an Object.assign(dst[`k`], src[`k`]) with a slight change from the typical handling of
 *   undefined for dst[`k`]: instead of raising an error, dst[`k`] is auto-initialized to {} and
 *   effectively merged with src[`k`]<p> Additionally, dissimilar types will not clobber unless the
 *   config.clobber parameter === true. Example:
 *
 *   ```js
 *   let config_0 = { foo: { bar: 'bar' }, bar: 'foo' };
 *   let config_1 = { foo: 'foo', bar: 'bar' };
 *   let result = assignWithDepth(config_0, config_1);
 *   console.log(result);
 *   //-> result: { foo: { bar: 'bar' }, bar: 'bar' }
 *   ```
 *
 *   Traditional Object.assign would have clobbered foo in config_0 with foo in config_1. If src is a
 *   destructured array of objects and dst is not an array, assignWithDepth will apply each element
 *   of src to dst in order.
 * @param dst
 * @param src
 * @param config
 * @param dst
 * @param src
 * @param config
 * @param dst
 * @param src
 * @param config
 * @param {any} dst - The destination of the merge
 * @param {any} src - The source object(s) to merge into destination
 * @param {{ depth: number; clobber: boolean }} [config={ depth: 2, clobber: false }] - Depth: depth
 *   to traverse within src and dst for merging - clobber: should dissimilar types clobber (default:
 *   { depth: 2, clobber: false }). Default is `{ depth: 2, clobber: false }`
 * @returns {any}
 */
export const assignWithDepth = function (dst, src, config) {
  const { depth, clobber } = Object.assign({ depth: 2, clobber: false }, config);
  if (Array.isArray(src) && !Array.isArray(dst)) {
    src.forEach((s) => assignWithDepth(dst, s, config));
    return dst;
  } else if (Array.isArray(src) && Array.isArray(dst)) {
    src.forEach((s) => {
      if (dst.indexOf(s) === -1) {
        dst.push(s);
      }
    });
    return dst;
  }
  if (typeof dst === 'undefined' || depth <= 0) {
    if (dst !== undefined && dst !== null && typeof dst === 'object' && typeof src === 'object') {
      return Object.assign(dst, src);
    } else {
      return src;
    }
  }
  if (typeof src !== 'undefined' && typeof dst === 'object' && typeof src === 'object') {
    Object.keys(src).forEach((key) => {
      if (
        typeof src[key] === 'object' &&
        (dst[key] === undefined || typeof dst[key] === 'object')
      ) {
        if (dst[key] === undefined) {
          dst[key] = Array.isArray(src[key]) ? [] : {};
        }
        dst[key] = assignWithDepth(dst[key], src[key], { depth: depth - 1, clobber });
      } else if (clobber || (typeof dst[key] !== 'object' && typeof src[key] !== 'object')) {
        dst[key] = src[key];
      }
    });
  }
  return dst;
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
 * @param {SVGElement} elem Element to add text to
 * @param {{
 *   text: string;
 *   x: number;
 *   y: number;
 *   anchor: 'start' | 'middle' | 'end';
 *   fontFamily: string;
 *   fontSize: string | number;
 *   fontWeight: string | number;
 *   fill: string;
 *   class: string | undefined;
 *   textMargin: number;
 * }} textData
 * @returns {SVGTextElement} Text element with given styling and content
 */
export const drawSimpleText = function (elem, textData) {
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
    `${label}-${maxWidth}-${config.fontSize}-${config.fontWeight}-${config.fontFamily}-${config.joinWith}`
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
    `${word}-${maxWidth}-${hyphenCharacter}-${config.fontSize}-${config.fontWeight}-${config.fontFamily}`
);

/**
 * This calculates the text's height, taking into account the wrap breaks and both the statically
 * configured height, width, and the length of the text (in pixels).
 *
 * If the wrapped text text has greater height, we extend the height, so it's value won't overflow.
 *
 * @param {any} text The text to measure
 * @param {any} config - The config for fontSize, fontFamily, and fontWeight all impacting the resulting size
 * @returns {any} - The height for the given text
 */
export const calculateTextHeight = function (text, config) {
  config = Object.assign(
    { fontSize: 12, fontWeight: 400, fontFamily: 'Arial', margin: 15 },
    config
  );
  return calculateTextDimensions(text, config).height;
};

/**
 * This calculates the width of the given text, font size and family.
 *
 * @param {any} text - The text to calculate the width of
 * @param {any} config - The config for fontSize, fontFamily, and fontWeight all impacting the resulting size
 * @returns {any} - The width for the given text
 */
export const calculateTextWidth = function (text, config) {
  config = Object.assign({ fontSize: 12, fontWeight: 400, fontFamily: 'Arial' }, config);
  return calculateTextDimensions(text, config).width;
};

/**
 * This calculates the dimensions of the given text, font size, font family, font weight, and margins.
 *
 * @param {any} text - The text to calculate the width of
 * @param {any} config - The config for fontSize, fontFamily, fontWeight, and margin all impacting
 *   the resulting size
 * @returns - The width for the given text
 */
export const calculateTextDimensions = memoize(
  function (text, config) {
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
    let dims = [];

    const body = select('body');
    // We don't want to leak DOM elements - if a removal operation isn't available
    // for any reason, do not continue.
    if (!body.remove) {
      return { width: 0, height: 0, lineHeight: 0 };
    }

    const g = body.append('svg');

    for (let fontFamily of fontFamilies) {
      let cheight = 0;
      let dim = { width: 0, height: 0, lineHeight: 0 };
      for (let line of lines) {
        const textObj = getTextObj();
        textObj.text = line;
        const textElem = drawSimpleText(g, textObj)
          .style('font-size', fontSize)
          .style('font-weight', fontWeight)
          .style('font-family', fontFamily);

        let bBox = (textElem._groups || textElem)[0][0].getBBox();
        dim.width = Math.round(Math.max(dim.width, bBox.width));
        cheight = Math.round(bBox.height);
        dim.height += cheight;
        dim.lineHeight = Math.round(Math.max(dim.lineHeight, cheight));
      }
      dims.push(dim);
    }

    g.remove();

    let index =
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
  (text, config) => `${text}-${config.fontSize}-${config.fontWeight}-${config.fontFamily}`
);

/**
 * Applys d3 attributes
 *
 * @param {any} d3Elem D3 Element to apply the attributes onto
 * @param {[string, string][]} attrs Object.keys equivalent format of key to value mapping of attributes
 */
const d3Attrs = function (d3Elem, attrs) {
  for (let attr of attrs) {
    d3Elem.attr(attr[0], attr[1]);
  }
};

/**
 * Gives attributes for an SVG's size given arguments
 *
 * @param {number} height The height of the SVG
 * @param {number} width The width of the SVG
 * @param {boolean} useMaxWidth Whether or not to use max-width and set width to 100%
 * @returns {Map<'height' | 'width' | 'style', string>} Attributes for the SVG
 */
export const calculateSvgSizeAttrs = function (height, width, useMaxWidth) {
  let attrs = new Map();
  attrs.set('height', height);
  if (useMaxWidth) {
    attrs.set('width', '100%');
    attrs.set('style', `max-width: ${width}px;`);
  } else {
    attrs.set('width', width);
  }
  return attrs;
};

/**
 * Applies attributes from `calculateSvgSizeAttrs`
 *
 * @param {SVGSVGElement} svgElem The SVG Element to configure
 * @param {number} height The height of the SVG
 * @param {number} width The width of the SVG
 * @param {boolean} useMaxWidth Whether or not to use max-width and set width to 100%
 */
export const configureSvgSize = function (svgElem, height, width, useMaxWidth) {
  const attrs = calculateSvgSizeAttrs(height, width, useMaxWidth);
  d3Attrs(svgElem, attrs);
};
export const setupGraphViewbox = function (graph, svgElem, padding, useMaxWidth) {
  const svgBounds = svgElem.node().getBBox();
  const sWidth = svgBounds.width;
  const sHeight = svgBounds.height;

  let width = graph._label.width;
  let height = graph._label.height;
  let tx = 0;
  let ty = 0;
  if (sWidth > width) {
    tx = (sWidth - width) / 2 + padding;
    width = sWidth + padding * 2;
  } else {
    if (Math.abs(sWidth - width) >= 2 * padding + 1) {
      width = width - padding;
    }
  }
  if (sHeight > height) {
    ty = (sHeight - height) / 2 + padding;
    height = sHeight + padding * 2;
  }
  configureSvgSize(svgElem, height, width, useMaxWidth);

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  const vBox = `0 0 ${width} ${height}`;
  log.debug(
    'Grpah.label',
    graph._label,
    'swidth',
    sWidth,
    'sheight',
    sHeight,
    'width',
    width,
    'height',
    height,
    'tx',
    tx,
    'ty',
    ty,
    'vBox',
    vBox
  );
  svgElem.attr('viewBox', vBox);
  svgElem.select('g').attr('transform', `translate(${tx}, ${ty})`);
};

export const initIdGeneratior = class iterator {
  constructor(deterministic, seed) {
    this.deterministic = deterministic;
    this.seed = seed;

    this.count = seed ? seed.length : 0;
  }

  next() {
    if (!this.deterministic) return Date.now();

    return this.count++;
  }
};

let decoder;

/**
 * Decodes HTML, source: {@link https://github.com/shrpne/entity-decode/blob/v2.0.1/browser.js}
 *
 * @param {string} html HTML as a string
 * @returns Unescaped HTML
 */
export const entityDecode = function (html) {
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
 * @param {object} args Directive's JSON
 */
export const directiveSanitizer = (args) => {
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

export default {
  assignWithDepth,
  wrapLabel,
  calculateTextHeight,
  calculateTextWidth,
  calculateTextDimensions,
  calculateSvgSizeAttrs,
  configureSvgSize,
  setupGraphViewbox,
  detectInit,
  detectDirective,
  detectType,
  isSubstringInArray,
  interpolateToCurve,
  calcLabelPosition,
  calcCardinalityPosition,
  calcTerminalLabelPosition,
  formatUrl,
  getStylesFromArray,
  generateId,
  random,
  memoize,
  runFunc,
  entityDecode,
  initIdGeneratior,
  directiveSanitizer,
  sanitizeCss,
};
