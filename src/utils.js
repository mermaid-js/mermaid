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

  if (text.match(/^\s*digraph/)) {
    return 'dot'
  }

  if (text.match(/^\s*info/)) {
    return 'example'
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

const interpolates = {
  basis: d3.curveBasis,
  linear: d3.curveLinear,
  cardinal: d3.curveCardinal
}
export const interpolateToCurve = (interpolate, defaultCurve) => {
  return interpolates[interpolate] || defaultCurve
}

export default {
  detectType,
  isSubstringInArray,
  interpolateToCurve
}
