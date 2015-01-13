/**
 * Created by knut on 14-11-23.
 */
/**
 * Detects the type of the graph text.
 * @param {string} text The text defining the graph
 * @param {string} text The second text defining the graph
 * @returns {string} A graph definition key
 */
module.exports.detectType = function(text,a){
    if(text.match(/^\s*sequenceDiagram/)){
        return "sequenceDiagram";
    }

    if(text.match(/^\s*sequence/)){
        //console.log('Detected sequence syntax');
        return "sequence";
    }

    if(text.match(/^\s*digraph/)) {
        console.log('Detected flow syntax');
        return "dotGraph";
    }

    return "graph";
};

/**
 * Copies all relevant CSS content into the graph SVG.
 * This allows the SVG to be copied as is while keeping class based styling
 * @param {element} svg The root element of the SVG
 * @param {object} Hash table of class definitions from the graph definition
 */
module.exports.cloneCssStyles = function(svg, classes){
    var usedStyles = "";
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
        // Avoid multiple inclusion on pages with multiple graphs
        if (sheets[i].title !== 'mermaid-svg-internal-css') {
            var rules = sheets[i].cssRules;
            if(rules !== null) {
                for (var j = 0; j < rules.length; j++) {
                    var rule = rules[j];
                    if (typeof(rule.style) !== 'undefined') {
                        var elems = svg.querySelectorAll(rule.selectorText);
                        if (elems.length > 0) {
                            usedStyles += rule.selectorText + " { " + rule.style.cssText + " }\n";
                        }
                    }
                }
            }
        } 
    }

    var defaultStyles = "";
    var embeddedStyles = "";

    for (var className in classes) {
        if (classes.hasOwnProperty(className) && typeof(className) != "undefined") {
            if (className === 'default') {
                if (classes.default.styles instanceof Array) {
                    defaultStyles += '.node' + ' { ' + classes[className].styles.join("; ") + '; }\n';
                }
                if (classes.default.nodeLabelStyles instanceof Array) {
                    defaultStyles += '.node text ' + ' { ' + classes[className].nodeLabelStyles.join("; ") + '; }\n';
                }
                if (classes.default.edgeLabelStyles instanceof Array) {
                    defaultStyles += '.edgeLabel text ' + ' { ' + classes[className].edgeLabelStyles.join("; ") + '; }\n';
                }
            } else {
                if (classes[className].styles instanceof Array) {
                    embeddedStyles += '.' + className + ' { ' + classes[className].styles.join("; ") + '; }\n';            
                }
            }
        }
    }

    if (usedStyles !== "" || defaultStyles !== "" || embeddedStyles !== "") {
        var s = document.createElement('style');
        s.setAttribute('type', 'text/css');
        s.setAttribute('title', 'mermaid-svg-internal-css');
        s.innerHTML = "/* <![CDATA[ */\n";
        // Make this CSS local to this SVG
        s.innerHTML += "#" + svg.id.trim() + " {\n"; 
        if (defaultStyles !== "") {
            s.innerHTML += defaultStyles;
        }
        if (usedStyles !== "") {
            s.innerHTML += usedStyles;
        }
        if (embeddedStyles !== "") {
            s.innerHTML += embeddedStyles;
        }
        s.innerHTML += "}\n";
        s.innerHTML += "/* ]]> */\n";
        svg.insertBefore(s, svg.firstChild);
    }
};

var equals = function (val, variable){
    if(typeof variable === 'undefined'){
        return false;
    }
    else{
        return (val === variable);
    }
};

var mermaid_config_exists = function() {
    return (typeof mermaid_config !== 'undefined');
};

var mermaid_config_item_exists = function(item) {
    return mermaid_config_exists() && (typeof mermaid_config[item] !== 'undefined');
};

module.exports.config = {};

module.exports.config.startOnLoad = function() {
    if (mermaid_config_item_exists(startOnLoad)) {
        return mermaid_config.startOnLoad === true;
    } else {
        return false;
    }
};

module.exports.config.labelStyle = function() {
    if (mermaid_config_item_exists(labelStyle)) {
        return mermaid_config.labelStyle === 'html';
    } else {
        return false;
    }
};
