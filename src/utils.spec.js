/**
 * Created by knut on 14-11-23.
 */

describe('when detecting chart type ',function() {
    var utils = require('./utils');
    beforeEach(function () {

    });

    it('should handle a sequence defintion', function () {
        str = 'sequence TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('sequence');
    });
    it('should handle a sequence defintion with leading spaces', function () {
        str = '    sequence TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('sequence');
    });

    it('should handle a graph defintion', function () {
        str = 'graph TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('graph');
    });
    it('should handle a graph defintion with leading spaces', function () {
        str = '    graph TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('graph');
    });

    it('should handle a graph defintion with leading spaces and newline', function () {
        str = '  \n  graph TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('graph');
    });
    it('should handle a sequence defintion with leading spaces and newline', function () {
        str = '  \n  sequence TB\nbfs1:queue';

        var type = utils.detectType(str);
        expect(type).toBe('sequence');
    });
});

describe('when cloning CSS ',function() {
    var utils = require('./utils');

    beforeEach(function () {
            var MockBrowser = require('mock-browser').mocks.MockBrowser;
            var mock = new MockBrowser();

            // and in the run-code inside some object
            document = mock.getDocument();
            //document.body.innerHTML = '';
            //document.body.innerHTML = '';
    });

    function stylesToArray(svg) {
        var styleSheets = svg.getElementsByTagName("style");
        expect(styleSheets.length).toBe(1);
        var styleSheet = styleSheets[0];

        var innerStyle = styleSheet.innerHTML;
        var styleArr = innerStyle.split("\n");

        // Remove first and last two lines to remove the CDATA
        expect(styleArr.length).toBeGreaterThan(2);
        var styleArrTrim = styleArr.slice(1,-2);

        // Remove all empty lines
        for (var i = 0; i < styleArrTrim.length; i++) {
            if (styleArrTrim[i].trim() === '') {
                styleArrTrim.splice(i,1);
                i--;
            }
        }

        return styleArrTrim;
    }

    function addStyleToDocument() {
        var s = document.createElement('style');
        s.innerHTML = '.node { stroke:#eee; }\n.node-square { stroke:#bbb; }\n';
        document.body.appendChild(s);
    }

    function addSecondStyleToDocument() {
        var s = document.createElement('style');
        s.innerHTML = '.node2 { stroke:#eee; }\n.node-square { stroke:#beb; }\n';
        document.body.appendChild(s);
    }

    function generateSVG() {
        var svg = document.createElement('svg');
        var g1 = document.createElement('g');
        g1.setAttribute('class', 'node');
        svg.appendChild(g1);
        var g2 = document.createElement('g');
        g2.setAttribute('class', 'node-square');
        svg.appendChild(g2);
        return svg;
    }

    function addSVGwithStyleToDocument() {
        var svg = document.createElement('svg');
        var s = document.createElement('style');
        s.innerHTML = '.node2 { stroke:#eee; }\n.node-square { stroke:#bfb; }\n';
        svg.appendChild(s);
        document.body.appendChild(svg); 
    }

    function addMermaidSVGwithStyleToDocument(id) {
        var svg = document.createElement('svg');
        var s = document.createElement('style');
        s.setAttribute('type', 'text/css');
        s.setAttribute('title', 'mermaid-svg-internal-css');
        s.innerHTML = '.node2 { stroke:#eee; }\n.node-square { stroke:#bfe; }\n';
        svg.appendChild(s);
        document.body.appendChild(svg); 
        // The Mock-browser seems not to support stylesheets title attribute, so we add it manually
        var sheets = document.styleSheets;
        sheets[id].title = "mermaid-svg-internal-css";
    }

    it('should handle an empty set of classes', function () {
        var svg = document.createElement('svg');

        utils.cloneCssStyles(svg, {});
        // Should not create style element if not needed
        expect(svg.innerHTML).toBe('');
    });

    it('should handle a default class', function () {
        var svg = document.createElement('svg');

        utils.cloneCssStyles(svg, { "default": { "styles": ["stroke:#fff","stroke-width:1.5px"] } });
        expect(stylesToArray(svg)).toEqual([ '.node { stroke:#fff; stroke-width:1.5px; }']);
        // Also verify the elements around the styling
        expect(svg.innerHTML).toBe('<style type="text/css" title="mermaid-svg-internal-css">/* <![CDATA[ */\n.node { stroke:#fff; stroke-width:1.5px; }\n/* ]]> */\n</style>');
    });

    it('should handle stylesheet in document with no classes in SVG', function () {
        var svg = document.createElement('svg');
        addStyleToDocument();
        utils.cloneCssStyles(svg, {});
        // Should not create style element if not needed
        expect(svg.innerHTML).toBe('');
    });

    it('should handle stylesheet in document with classes in SVG', function () {
        var svg = generateSVG();
        addStyleToDocument();
        utils.cloneCssStyles(svg, {});
        expect(stylesToArray(svg)).toEqual([ '.node { stroke: #eee; }', '.node-square { stroke: #bbb; }']);
    });

    it('should handle multiple stylesheets in document with classes in SVG', function () {
        var svg = generateSVG();
        addStyleToDocument();
        addSecondStyleToDocument();
        utils.cloneCssStyles(svg, {});
        expect(stylesToArray(svg)).toEqual([ '.node { stroke: #eee; }', '.node-square { stroke: #bbb; }', '.node-square { stroke: #beb; }']);
    });

    it('should handle multiple stylesheets + styles in other SVG', function () {
        var svg = generateSVG();
        addStyleToDocument();
        addSecondStyleToDocument();
        addSVGwithStyleToDocument();
        utils.cloneCssStyles(svg, {});
        expect(stylesToArray(svg)).toEqual([ '.node { stroke: #eee; }', '.node-square { stroke: #bbb; }', '.node-square { stroke: #beb; }', '.node-square { stroke: #bfb; }']);
    });

    it('should handle multiple stylesheets + ignore styles in mermaid SVG', function () {
        var svg = generateSVG();
        addStyleToDocument();
        addSecondStyleToDocument();
        addSVGwithStyleToDocument();
        addMermaidSVGwithStyleToDocument(3);
        utils.cloneCssStyles(svg, {});
        expect(stylesToArray(svg)).toEqual([ '.node { stroke: #eee; }', '.node-square { stroke: #bbb; }', '.node-square { stroke: #beb; }', '.node-square { stroke: #bfb; }']);
    });

    it('should handle a default class together with stylesheet in document with classes in SVG', function () {
        var svg = generateSVG();
        addStyleToDocument();
        utils.cloneCssStyles(svg, { "default": { "styles": ["stroke:#fff","stroke-width:1.5px"] } });
        expect(stylesToArray(svg)).toEqual([ '.node { stroke:#fff; stroke-width:1.5px; }', '.node { stroke: #eee; }', '.node-square { stroke: #bbb; }']);
    });

    xit('should handle a default class together with stylesheet in document and classDefs', function () {
        var svg = generateSVG();
        addStyleToDocument();
        utils.cloneCssStyles(svg, { "default": { "styles": ["stroke:#fff","stroke-width:1.5px"] }, 
                                    "node-square": { "styles": ["fill:#eee", "stroke:#aaa"] },
                                    "node-circle": { "styles": ["fill:#444", "stroke:#111"] } });
        expect(stylesToArray(svg)).toEqual([ '.node { stroke:#fff; stroke-width:1.5px; }', 
                                             '.node { stroke: #eee; }', 
                                             '.node-square { stroke: #bbb; }',
                                             '.node-square { fill:#eee; stroke:#aaa; }',
                                             '.node-circle { fill:#444; stroke:#111; }' ]);
    });
});

