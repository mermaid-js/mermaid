import * as d3 from 'd3';
import { logger } from './logger';
import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * @function detectType
 * Detects the type of the graph text.
 * ```mermaid
 * graph LR
 *  a-->b
 *  b-->c
 *  c-->d
 *  d-->e
 *  e-->f
 *  f-->g
 *  g-->h
 * ```
 *
 * @param {string} text The text defining the graph
 * @returns {string} A graph definition key
 */
export const detectType = function(text) {
  text = text.replace(/^\s*%%.*\n/g, '\n');
  logger.debug('Detecting diagram type based on the text ' + text);
  if (text.match(/^\s*sequenceDiagram/)) {
    return 'sequence';
  }

  if (text.match(/^\s*gantt/)) {
    return 'gantt';
  }

  if (text.match(/^\s*classDiagram/)) {
    return 'class';
  }

  if (text.match(/^\s*stateDiagram/)) {
    return 'state';
  }

  if (text.match(/^\s*gitGraph/)) {
    return 'git';
  }

  if (text.match(/^\s*info/)) {
    return 'info';
  }
  if (text.match(/^\s*pie/)) {
    return 'pie';
  }

  return 'flowchart';
};

/**
 * @function isSubstringInArray
 * Detects whether a substring in present in a given array
 * @param {string} str The substring to detect
 * @param {array} arr The array to search
 * @returns {number} the array index containing the substring or -1 if not present
 **/
export const isSubstringInArray = function(str, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].match(str)) return i;
  }
  return -1;
};

export const interpolateToCurve = (interpolate, defaultCurve) => {
  if (!interpolate) {
    return defaultCurve;
  }
  const curveName = `curve${interpolate.charAt(0).toUpperCase() + interpolate.slice(1)}`;
  return d3[curveName] || defaultCurve;
};

export const sanitize = (text, config) => {
  let txt = text;
  let htmlLabels = true;
  if (
    config.flowchart &&
    (config.flowchart.htmlLabels === false || config.flowchart.htmlLabels === 'false')
  )
    htmlLabels = false;

  if (config.securityLevel !== 'loose' && htmlLabels) { // eslint-disable-line
    txt = txt.replace(/<br\s*\/?>/gi, '#br#');
    txt = txt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    txt = txt.replace(/=/g, '&equals;');
    txt = txt.replace(/#br#/g, '<br/>');
  }

  return txt;
};

export const formatUrl = (linkStr, config) => {
  let url = linkStr.trim();

  if (url) {
    if (config.securityLevel !== 'loose') {
      return sanitizeUrl(url);
    }

    return url;
  }
};

const distance = (p1, p2) =>
  p1 && p2 ? Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) : 0;

const traverseEdge = points => {
  let prevPoint;
  let totalDistance = 0;

  points.forEach(point => {
    totalDistance += distance(point, prevPoint);
    prevPoint = point;
  });

  // Traverse half of total distance along points
  const distanceToLabel = totalDistance / 2;

  let remainingDistance = distanceToLabel;
  let center;
  prevPoint = undefined;
  points.forEach(point => {
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
            y: (1 - distanceRatio) * prevPoint.y + distanceRatio * point.y
          };
        }
      }
    }
    prevPoint = point;
  });
  return center;
};

const calcLabelPosition = points => {
  const p = traverseEdge(points);
  return p;
};

const calcCardinalityPosition = (isRelationTypePresent, points, initialPosition) => {
  let prevPoint;
  let totalDistance = 0; // eslint-disable-line
  if (points[0] !== initialPosition) {
    points = points.reverse();
  }
  points.forEach(point => {
    totalDistance += distance(point, prevPoint);
    prevPoint = point;
  });

  // Traverse only 25 total distance along points to find cardinality point
  const distanceToCardinalityPoint = 25;

  let remainingDistance = distanceToCardinalityPoint;
  let center;
  prevPoint = undefined;
  points.forEach(point => {
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
            y: (1 - distanceRatio) * prevPoint.y + distanceRatio * point.y
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

export const getStylesFromArray = arr => {
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

export default {
  detectType,
  isSubstringInArray,
  interpolateToCurve,
  calcLabelPosition,
  calcCardinalityPosition,
  sanitize,
  formatUrl,
  getStylesFromArray
};
