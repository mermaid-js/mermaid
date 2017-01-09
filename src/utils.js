/**
 * Created by knut on 14-11-23.
 */
var Logger = require('./logger');
var log = new Logger.Log();

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
var detectType = function(text){
    text = text.replace(/^\s*%%.*\n/g,'\n');
    if(text.match(/^\s*sequenceDiagram/)){
        return 'sequenceDiagram';
    }

    if(text.match(/^\s*digraph/)) {
        //log.debug('Detected dot syntax');
        return 'dotGraph';
    }

    if(text.match(/^\s*info/)) {
        //log.debug('Detected info syntax');
        return 'info';
    }

    if(text.match(/^\s*gantt/)) {
        //log.debug('Detected info syntax');
        return 'gantt';
    }

    if(text.match(/^\s*classDiagram/)) {
        log.debug('Detected classDiagram syntax');
        return 'classDiagram';
    }

    if(text.match(/^\s*gitGraph/)) {
        log.debug('Detected gitGraph syntax');
        return 'gitGraph';
    }
    return 'graph';
};
exports.detectType= detectType;

/**
 * Copies all relevant CSS content into the graph SVG.
 * This allows the SVG to be copied as is while keeping class based styling
 * @param {element} svg The root element of the SVG
 * @param {object} Hash table of class definitions from the graph definition
 */
var cloneCssStyles = function(svg, classes){
    var usedStyles = '';
    var sheets = document.styleSheets;
    var rule;
    for (var i = 0; i < sheets.length; i++) {
        // Avoid multiple inclusion on pages with multiple graphs
        if (sheets[i].title !== 'mermaid-svg-internal-css') {
            try {

                var rules = sheets[i].cssRules;
                if (rules !== null) {
                    for (var j = 0; j < rules.length; j++) {
                        rule = rules[j];
                        if (typeof(rule.style) !== 'undefined') {
                            var elems;
                            elems = svg.querySelectorAll(rule.selectorText);
                            if (elems.length > 0) {
                                usedStyles += rule.selectorText + ' { ' + rule.style.cssText + '}\n';
                            }
                        }
                    }
                }
            }
            catch (err) {
                if (typeof(rule) !== 'undefined') {
                    log.warn('Invalid CSS selector "' + rule.selectorText + '"', err);
                }
            }
        }
    }

    var defaultStyles = '';
    var embeddedStyles = '';

    for (var className in classes) {
        if (classes.hasOwnProperty(className) && typeof(className) != 'undefined') {
            if (className === 'default') {
                if (classes.default.styles instanceof Array) {
                    defaultStyles += '#' + svg.id.trim() + ' .node' + '>rect { ' + classes[className].styles.join('; ') + '; }\n';
                }
                if (classes.default.nodeLabelStyles instanceof Array) {
                    defaultStyles += '#' + svg.id.trim() + ' .node text ' + ' { ' + classes[className].nodeLabelStyles.join('; ') + '; }\n';
                }
                if (classes.default.edgeLabelStyles instanceof Array) {
                    defaultStyles += '#' + svg.id.trim() + ' .edgeLabel text ' + ' { ' + classes[className].edgeLabelStyles.join('; ') + '; }\n';
                }
                if (classes.default.clusterStyles instanceof Array) {
                    defaultStyles += '#' + svg.id.trim() + ' .cluster rect ' + ' { ' + classes[className].clusterStyles.join('; ') + '; }\n';
                }
            } else {
                if (classes[className].styles instanceof Array) {
                    embeddedStyles += '#' + svg.id.trim() + ' .' + className + '>rect, .' + className + '>polygon, .' + className + '>circle, .' + className + '>ellipse { ' + classes[className].styles.join('; ') + '; }\n';
                }
            }
        }
    }

    if (usedStyles !== '' || defaultStyles !== '' || embeddedStyles !== '') {
        var s = document.createElement('style');
        s.setAttribute('type', 'text/css');
        s.setAttribute('title', 'mermaid-svg-internal-css');
        s.innerHTML = '/* <![CDATA[ */\n';
        // Make this CSS local to this SVG
        if (defaultStyles !== '') {
            s.innerHTML += defaultStyles;
        }
        if (usedStyles !== '') {
            s.innerHTML += usedStyles;
        }
        if (embeddedStyles !== '') {
            s.innerHTML += embeddedStyles;
        }
        s.innerHTML += '/* ]]> */\n';
        svg.insertBefore(s, svg.firstChild);
    }
};

exports.cloneCssStyles = cloneCssStyles;


/**
 * @function isSubstringInArray
 * Detects whether a substring in present in a given array
 * @param {string} str The substring to detect
 * @param {array} arr The array to search
 * @returns {number} the array index containing the substring or -1 if not present
 **/
var isSubstringInArray = function (str, arr) {
  for (var i = 0; i < arr.length; i++) {
      if (arr[i].match(str)) return i;
  }
  return -1;
};

exports.isSubstringInArray = isSubstringInArray;