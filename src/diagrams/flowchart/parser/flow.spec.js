/**
* Created by knut on 14-11-03.
*/

var graph = require('../graphDb');
var flow = require('./flow');

describe('when parsing ',function(){
    beforeEach(function(){
        flow.parser.yy = require('../graphDb');
        flow.parser.yy.clear();
        /*flow.parser.parse.parseError= function parseError(str, hash) {
            console.log(str);
        }*/
    });

    it('should handle a nodes and edges',function(){
        var res = flow.parser.parse('graph TD;A-->B;');


        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow');
        expect(edges[0].text).toBe('');
    });

    it('should handle a nodes and edges and a space between link and node',function(){
        var res = flow.parser.parse('graph TD;A --> B;');


        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow');
        expect(edges[0].text).toBe('');
    });

    it('should handle a comments',function(){
        var res = flow.parser.parse('graph TD;\n%% CComment\n A-->B;');


        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow');
        expect(edges[0].text).toBe('');
    });

    it('should handle a comments with blank rows in-between',function(){
        var res = flow.parser.parse('graph TD;\n\n\n %% CComment\n A-->B;');


        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow');
        expect(edges[0].text).toBe('');
    });

    it('should handle a comments mermaid flowchart code in them',function(){
        var res = flow.parser.parse('graph TD;\n\n\n %% Test od>Odd shape]-->|Two line<br>edge comment|ro;\n A-->B;');


        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(1);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow');
        expect(edges[0].text).toBe('');
    });

    it('it should handle a trailing whitespaces after statememnts',function(){
        var res = flow.parser.parse('graph TD;\n\n\n %% CComment\n A-->B; \nB-->C;');


        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(2);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].type).toBe('arrow');
        expect(edges[0].text).toBe('');
    });

    it('should handle open ended edges',function(){
        var res = flow.parser.parse('graph TD;A---B;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();


        expect(edges[0].type).toBe('arrow_open');
    });

    it('should handle cross ended edges',function(){
        var res = flow.parser.parse('graph TD;A--xB;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();


        expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle open ended edges',function(){
        var res = flow.parser.parse('graph TD;A--oB;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();


        expect(edges[0].type).toBe('arrow_circle');
    });

    it('should handle text on edges without space',function(){
        var res = flow.parser.parse('graph TD;A--x|textNoSpace|B;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();


        expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle text on edges without space and space between vertices and link',function(){
        var res = flow.parser.parse('graph TD;A --x|textNoSpace| B;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();


        expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle text on edges with space',function(){
        var res = flow.parser.parse('graph TD;A--x|text including space|B;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();


        expect(edges[0].type).toBe('arrow_cross');
    });

    it('should handle text on edges with space',function(){
        var res = flow.parser.parse('graph TD;A--x|text with / should work|B;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();


        expect(edges[0].text).toBe('text with / should work');
    });

    it('should handle text on edges with space CAPS',function(){
        var res = flow.parser.parse('graph TD;A--x|text including CAPS space|B;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();


        expect(edges[0].type).toBe('arrow_cross');
    });
    it('should handle text on edges with space dir',function(){
        var res = flow.parser.parse('graph TD;A--x|text including URL space|B;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();


        expect(edges[0].type).toBe('arrow_cross');
        expect(edges[0].text).toBe('text including URL space');

    });
    it('should handle text on edges with graph keyword',function(){
        var res = flow.parser.parse('graph TD;A--x|text including graph space|B;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges[0].text).toBe('text including graph space');

    });
    it('should handle multi-line text',function(){
        var res = flow.parser.parse('graph TD;A--o|text space|B;\n B-->|more text with space|C;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges[0].type).toBe('arrow_circle');
        expect(edges[1].type).toBe('arrow');
        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(vert['C'].id).toBe('C');
        expect(edges.length).toBe(2);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        //expect(edges[0].text).toBe('text space');
        expect(edges[1].start).toBe('B');
        expect(edges[1].end).toBe('C');
        expect(edges[1].text).toBe('more text with space');
    });

    it('should handle multiple edges',function(){
        var res = flow.parser.parse('graph TD;A---|This is the 123 s text|B;\nA---|This is the second edge|B;');
        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].id).toBe('A');
        expect(vert['B'].id).toBe('B');
        expect(edges.length).toBe(2);
        expect(edges[0].start).toBe('A');
        expect(edges[0].end).toBe('B');
        expect(edges[0].text).toBe('This is the 123 s text');
        expect(edges[1].start).toBe('A');
        expect(edges[1].end).toBe('B');
        expect(edges[1].text).toBe('This is the second edge');
    });

    it('should handle text in vertices with space',function(){
        var res = flow.parser.parse('graph TD;A[chimpansen hoppar]-->C;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].type).toBe('square');
        expect(vert['A'].text).toBe('chimpansen hoppar');
    });

    it('should handle text in vertices with space with spaces between vertices and link',function(){
        var res = flow.parser.parse('graph TD;A[chimpansen hoppar] --> C;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].type).toBe('square');
        expect(vert['A'].text).toBe('chimpansen hoppar');
    });

    it('should handle text in circle vertices with space',function(){
        var res = flow.parser.parse('graph TD;A((chimpansen hoppar))-->C;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].type).toBe('circle');
        expect(vert['A'].text).toBe('chimpansen hoppar');
    });

    it('should handle text in diamond vertices with space',function(){
        var res = flow.parser.parse('graph TD;A(chimpansen hoppar)-->C;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].type).toBe('round');
        expect(vert['A'].text).toBe('chimpansen hoppar');
    });

    it('should handle text in with ?',function(){
        var res = flow.parser.parse('graph TD;A(?)-->|?|C;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].text).toBe('?');
        expect(edges[0].text).toBe('?');
    });
    it('should handle text in with éèêàçô',function(){
        var res = flow.parser.parse('graph TD;A(éèêàçô)-->|éèêàçô|C;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].text).toBe('éèêàçô');
        expect(edges[0].text).toBe('éèêàçô');
    });

    it('should handle text in with ,.?!+-*',function(){
        var res = flow.parser.parse('graph TD;A(,.?!+-*)-->|,.?!+-*|C;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['A'].text).toBe(',.?!+-*');
        expect(edges[0].text).toBe(',.?!+-*');
    });


    it('should handle text in vertices with space',function(){
        var res = flow.parser.parse('graph TD;A-->C(Chimpansen hoppar);');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['C'].type).toBe('round');
        expect(vert['C'].text).toBe('Chimpansen hoppar');
    });

    it('should handle text in vertices with åäö and minus',function(){
        var res = flow.parser.parse('graph TD;A-->C{Chimpansen hoppar åäö-ÅÄÖ};');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['C'].type).toBe('diamond');
        expect(vert['C'].text).toBe('Chimpansen hoppar åäö-ÅÄÖ');
    });
    it('should handle text in vertices with åäö, minus and space and br',function(){
        var res = flow.parser.parse('graph TD;A-->C(Chimpansen hoppar åäö  <br> -  ÅÄÖ);');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['C'].type).toBe('round');
        expect(vert['C'].text).toBe('Chimpansen hoppar åäö  <br> -  ÅÄÖ');
    });
    it('should handle text in vertices with unicode chars',function(){
        var res = flow.parser.parse('graph TD;A-->C(Начало);');

        var vert = flow.parser.yy.getVertices();

        expect(vert['C'].text).toBe('Начало');
    });
    it('should handle text in vertices with CAPS',function(){
        var res = flow.parser.parse('graph TD;A-->C(some CAPS);');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['C'].type).toBe('round');
        expect(vert['C'].text).toBe('some CAPS');
    });
    it('should handle text in vertices with directions',function(){
        var res = flow.parser.parse('graph TD;A-->C(some URL);');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['C'].type).toBe('round');
        expect(vert['C'].text).toBe('some URL');
    });
    it('should handle a single node',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;A;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['A'].styles.length).toBe(0);
    });

    it('should handle a single square node',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;a[A];');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['a'].styles.length).toBe(0);
        expect(vert['a'].type).toBe('square');
    });
    it('should handle a single round square node',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;a[A];');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['a'].styles.length).toBe(0);
        expect(vert['a'].type).toBe('square');
    });
    it('should handle a single circle node',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;a((A));');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['a'].type).toBe('circle');
    });
    it('should handle a single round node',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;a(A);');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['a'].type).toBe('round');
    });
    it('should handle a single odd node',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;a>A];');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['a'].type).toBe('odd');
    });
    it('should handle a single diamond node',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;a{A};');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['a'].type).toBe('diamond');
    });
    it('should handle a single diamond node with html in it',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;a{A <br> end};');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['a'].type).toBe('diamond');
        expect(vert['a'].text).toBe('A <br> end');
    });
    it('should handle a single round node with html in it',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;a(A <br> end);');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['a'].type).toBe('round');
        expect(vert['a'].text).toBe('A <br> end');
    });
    it('should handle a single node with alphanumerics starting on a char',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;id1;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['id1'].styles.length).toBe(0);
    });
    it('should handle a single node with alphanumerics starting on a num',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;1id;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['1id'].styles.length).toBe(0);
    });
    it('should handle a single node with alphanumerics containing a minus sign',function(){
        // Silly but syntactically correct
        var res = flow.parser.parse('graph TD;i-d;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(0);
        expect(vert['i-d'].styles.length).toBe(0);
    });
    //console.log(flow.parser.parse('graph TD;style Q background:#fff;'));
    it('should handle styles for vertices',function(){
        var res = flow.parser.parse('graph TD;style Q background:#fff;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        var style = vert['Q'].styles[0];

        expect(vert['Q'].styles.length).toBe(1);
        expect(vert['Q'].styles[0]).toBe('background:#fff');
    });

    //console.log(flow.parser.parse('graph TD;style Q background:#fff;'));
    it('should handle styles for edges',function(){
        var res = flow.parser.parse('graph TD;a-->b;\nstyle #0 stroke: #f66;');

        var edges = flow.parser.yy.getEdges();

        expect(edges.length).toBe(1);
    });

    it('should handle multiple styles for a vortex',function(){
        var res = flow.parser.parse('graph TD;style R background:#fff,border:1px solid red;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['R'].styles.length).toBe(2);
        expect(vert['R'].styles[0]).toBe('background:#fff');
        expect(vert['R'].styles[1]).toBe('border:1px solid red');
    });

    it('should handle multiple styles in a graph',function(){
        var res = flow.parser.parse('graph TD;style S background:#aaa;\nstyle T background:#bbb,border:1px solid red;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['S'].styles.length).toBe(1);
        expect(vert['T'].styles.length).toBe(2);
        expect(vert['S'].styles[0]).toBe('background:#aaa');
        expect(vert['T'].styles[0]).toBe('background:#bbb');
        expect(vert['T'].styles[1]).toBe('border:1px solid red');
    });

    it('should handle styles and graph definitons in a graph',function(){
        var res = flow.parser.parse('graph TD;S-->T;\nstyle S background:#aaa;\nstyle T background:#bbb,border:1px solid red;');

        var vert = flow.parser.yy.getVertices();
        var edges = flow.parser.yy.getEdges();

        expect(vert['S'].styles.length).toBe(1);
        expect(vert['T'].styles.length).toBe(2);
        expect(vert['S'].styles[0]).toBe('background:#aaa');
        expect(vert['T'].styles[0]).toBe('background:#bbb');
        expect(vert['T'].styles[1]).toBe('border:1px solid red');
    });
    it('should handle styles and graph definitons in a graph',function(){
        var res = flow.parser.parse('graph TD;style T background:#bbb,border:1px solid red;');
        //var res = flow.parser.parse('graph TD;style T background: #bbb;');

        var vert = flow.parser.yy.getVertices();

        expect(vert['T'].styles.length).toBe(2);
        expect(vert['T'].styles[0]).toBe('background:#bbb');
        expect(vert['T'].styles[1]).toBe('border:1px solid red');
    });

    describe('special characters should be be handled.',function(){
        var charTest = function(char){
            var res = flow.parser.parse('graph TD;A('+char+')-->B;');

            var vert = flow.parser.yy.getVertices();
            var edges = flow.parser.yy.getEdges();

            expect(vert['A'].id).toBe('A');
            expect(vert['B'].id).toBe('B');
            expect(vert['A'].text).toBe(char);
        };

        it('it should be able to parse a \'.\'',function(){
            charTest('.');
            charTest('Start 103a.a1');
        });

        it('it should be able to parse text containing \'_\'',function(){
            charTest('_');
        });

        it('it should be able to parse a \':\'',function(){
            charTest(':');
        });

        it('it should be able to parse a \',\'',function(){
            charTest(',');
        });

        it('it should be able to parse text containing \'-\'',function(){
            charTest('a-b');
        });

        it('it should be able to parse a \'+\'',function(){
            charTest('+');
        });

        it('it should be able to parse a \'*\'',function(){
            charTest('*');
        });

        it('it should be able to parse a \'<\'',function(){
            charTest('<');
        });

        it('it should be able to parse a \'>\'',function(){
            charTest('>');
        });

        it('it should be able to parse a \'=\'',function(){
            charTest('=');
        });

    });

    it('should be possible to declare a class',function(){
        var res = flow.parser.parse('graph TD;classDef exClass background:#bbb,border:1px solid red;');
        //var res = flow.parser.parse('graph TD;style T background: #bbb;');

        var classes = flow.parser.yy.getClasses();

        expect(classes['exClass'].styles.length).toBe(2);
        expect(classes['exClass'].styles[0]).toBe('background:#bbb');
        expect(classes['exClass'].styles[1]).toBe('border:1px solid red');
    });

    it('should be possible to declare a class with a dot in the style',function(){
        var res = flow.parser.parse('graph TD;classDef exClass background:#bbb,border:1.5px solid red;');
        //var res = flow.parser.parse('graph TD;style T background: #bbb;');

        var classes = flow.parser.yy.getClasses();

        expect(classes['exClass'].styles.length).toBe(2);
        expect(classes['exClass'].styles[0]).toBe('background:#bbb');
        expect(classes['exClass'].styles[1]).toBe('border:1.5px solid red');
    });
    it('should be possible to declare a class with a space in the style',function(){
        var res = flow.parser.parse('graph TD;classDef exClass background:  #bbb,border:1.5px solid red;');
        //var res = flow.parser.parse('graph TD;style T background  :  #bbb;');

        var classes = flow.parser.yy.getClasses();

        expect(classes['exClass'].styles.length).toBe(2);
        expect(classes['exClass'].styles[0]).toBe('background:  #bbb');
        expect(classes['exClass'].styles[1]).toBe('border:1.5px solid red');
    });
    it('should be possible to apply a class to a vertex',function(){
        var statement = '';

        statement = statement + 'graph TD;' + '\n';
        statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n';
        statement = statement + 'a-->b;' + '\n';
        statement = statement + 'class a exClass;';

        var res = flow.parser.parse(statement);

        var classes = flow.parser.yy.getClasses();

        expect(classes['exClass'].styles.length).toBe(2);
        expect(classes['exClass'].styles[0]).toBe('background:#bbb');
        expect(classes['exClass'].styles[1]).toBe('border:1px solid red');
    });
    it('should be possible to apply a class to a comma separated list of vertices',function(){
        var statement = '';

        statement = statement + 'graph TD;' + '\n';
        statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n';
        statement = statement + 'a-->b;' + '\n';
        statement = statement + 'class a,b exClass;';

        var res = flow.parser.parse(statement);

        var classes = flow.parser.yy.getClasses();
        var vertices  = flow.parser.yy.getVertices();

        expect(classes['exClass'].styles.length).toBe(2);
        expect(classes['exClass'].styles[0]).toBe('background:#bbb');
        expect(classes['exClass'].styles[1]).toBe('border:1px solid red');
        expect(vertices['a'].classes[0]).toBe('exClass');
        expect(vertices['b'].classes[0]).toBe('exClass');
    });
});


