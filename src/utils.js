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
        console.log('Detected sequenceDiagram syntax');
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
 * @param {string} defaultStyle Default style definitions (for elements without classes)
 */
module.exports.cloneCssStyles = function(svg, defaultStyle){
    var used = "";
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
        var rules = sheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            if (typeof(rule.style) != "undefined") {
                var elems = svg.querySelectorAll(rule.selectorText);
                if (elems.length > 0) {
                    used += rule.selectorText + " { " + rule.style.cssText + " }\n";
                }
            }
        }
    }

    var s = document.createElement('style');
    s.setAttribute('type', 'text/css');
    s.innerHTML = "/* <![CDATA[ */\n" + defaultStyle + "\n" + used + "\n/* ]]> */";
    svg.insertBefore(s, svg.firstChild);
};
