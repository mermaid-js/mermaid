import { logger } from './logger'

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
    return 'sequenceDiagram'
  }

  if (text.match(/^\s*digraph/)) {
    return 'dotGraph'
  }

  if (text.match(/^\s*info/)) {
    return 'info'
  }

  if (text.match(/^\s*gantt/)) {
    return 'gantt'
  }

  if (text.match(/^\s*classDiagram/)) {
    logger.debug('Detected classDiagram syntax')
    return 'classDiagram'
  }

  if (text.match(/^\s*gitGraph/)) {
    logger.debug('Detected gitGraph syntax')
    return 'gitGraph'
  }
  return 'graph'
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

export default {
  detectType,
  isSubstringInArray
}
