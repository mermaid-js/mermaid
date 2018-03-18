import * as d3 from 'd3'

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
export const detectType = function (text) {
  text = text.replace(/^\s*%%.*\n/g, '\n')
  if (text.match(/^\s*sequenceDiagram/)) {
    return 'sequence'
  }

  if (text.match(/^\s*gantt/)) {
    return 'gantt'
  }

  if (text.match(/^\s*classDiagram/)) {
    return 'class'
  }

  if (text.match(/^\s*gitGraph/)) {
    return 'git'
  }
  return 'flowchart'
}

/**
 * @function isSubstringInArray
 * Detects whether a substring in present in a given array
 * @param {string} str The substring to detect
 * @param {array} arr The array to search
 * @returns {number} the array index containing the substring or -1 if not present
 **/
export const isSubstringInArray = function (str, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].match(str)) return i
  }
  return -1
}

export const interpolateToCurve = (interpolate, defaultCurve) => {
  if (!interpolate) {
    return defaultCurve
  }
  const curveName = `curve${interpolate.charAt(0).toUpperCase() + interpolate.slice(1)}`
  return d3[curveName] || defaultCurve
}

export default {
  detectType,
  isSubstringInArray,
  interpolateToCurve
}
