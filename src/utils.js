import { Log } from './logger'

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
    Log.debug('Detected classDiagram syntax')
    return 'classDiagram'
  }

  if (text.match(/^\s*gitGraph/)) {
    Log.debug('Detected gitGraph syntax')
    return 'gitGraph'
  }
  return 'graph'
}

/**
 * Copies all relevant CSS content into the graph SVG.
 * This allows the SVG to be copied as is while keeping class based styling
 * @param {element} svg The root element of the SVG
 * @param {object} Hash table of class definitions from the graph definition
 */
export const cloneCssStyles = function (svg, classes) {
  let usedStyles = ''
  const sheets = document.styleSheets
  let rule
  for (let i = 0; i < sheets.length; i++) {
    // Avoid multiple inclusion on pages with multiple graphs
    if (sheets[i].title !== 'mermaid-svg-internal-css') {
      try {
        const rules = sheets[i].cssRules
        if (rules !== null) {
          for (let j = 0; j < rules.length; j++) {
            rule = rules[j]
            if (typeof (rule.style) !== 'undefined') {
              const elems = svg.querySelectorAll(rule.selectorText)
              if (elems.length > 0) {
                usedStyles += rule.selectorText + ' { ' + rule.style.cssText + '}\n'
              }
            }
          }
        }
      } catch (err) {
        if (typeof (rule) !== 'undefined') {
          Log.warn('Invalid CSS selector "' + rule.selectorText + '"', err)
        }
      }
    }
  }

  let defaultStyles = ''
  let embeddedStyles = ''
  for (const className in classes) {
    if (classes.hasOwnProperty(className) && typeof (className) !== 'undefined') {
      if (className === 'default') {
        if (classes.default.styles instanceof Array) {
          defaultStyles += '#' + svg.id.trim() + ' .node' + '>rect { ' + classes[className].styles.join('; ') + '; }\n'
        }
        if (classes.default.nodeLabelStyles instanceof Array) {
          defaultStyles += '#' + svg.id.trim() + ' .node text ' + ' { ' + classes[className].nodeLabelStyles.join('; ') + '; }\n'
        }
        if (classes.default.edgeLabelStyles instanceof Array) {
          defaultStyles += '#' + svg.id.trim() + ' .edgeLabel text ' + ' { ' + classes[className].edgeLabelStyles.join('; ') + '; }\n'
        }
        if (classes.default.clusterStyles instanceof Array) {
          defaultStyles += '#' + svg.id.trim() + ' .cluster rect ' + ' { ' + classes[className].clusterStyles.join('; ') + '; }\n'
        }
      } else {
        if (classes[className].styles instanceof Array) {
          embeddedStyles += '#' + svg.id.trim() + ' .' + className + '>rect, .' + className + '>polygon, .' + className + '>circle, .' + className + '>ellipse { ' + classes[className].styles.join('; ') + '; }\n'
        }
      }
    }
  }

  if (usedStyles !== '' || defaultStyles !== '' || embeddedStyles !== '') {
    const s = document.createElement('style')
    s.setAttribute('type', 'text/css')
    s.setAttribute('title', 'mermaid-svg-internal-css')
    s.innerHTML = '/* <![CDATA[ */\n'
    // Make this CSS local to this SVG
    if (defaultStyles !== '') {
      s.innerHTML += defaultStyles
    }
    if (usedStyles !== '') {
      s.innerHTML += usedStyles
    }
    if (embeddedStyles !== '') {
      s.innerHTML += embeddedStyles
    }
    s.innerHTML += '/* ]]> */\n'
    svg.insertBefore(s, svg.firstChild)
  }
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
