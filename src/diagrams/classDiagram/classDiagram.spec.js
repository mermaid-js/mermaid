/**
 * Created by knut on 14-11-18.
 */
describe('class diagram, ', function () {
    describe('when parsing an info graph it', function () {
        var cd, cDDb;
        beforeEach(function () {
            cd = require('./parser/classDiagram').parser;
            cDDb = require('./classDb');
            cd.yy = cDDb;
        });

        it('should handle relation definitions', function () {
            var str = 'classDiagram\n'+
'Class01 <|-- Class02\n'+
'Class03 *-- Class04\n'+
'Class05 o-- Class06\n'+
'Class07 .. Class08\n'+
'Class09 -- Class1';

            cd.parse(str);
        });
        it('should handle relation definition of different types and directions', function () {
            var str = 'classDiagram\n'+
'Class11 <|.. Class12\n'+
'Class13 --> Class14\n'+
'Class15 ..> Class16\n'+
'Class17 ..|> Class18\n'+
'Class19 <--* Class20';

            cd.parse(str);
        });

        it('should handle cardinality and labels', function () {
            var str = 'classDiagram\n'+
'Class01 "1" *-- "many" Class02 : contains\n'+
'Class03 o-- Class04 : aggregation\n'+
'Class05 --> "1" Class06';

            cd.parse(str);
        });
        it('should handle class definitions', function () {
            var str = 'classDiagram\n'+
'class Car\n'+
'Driver -- Car : drives >\n'+
'Car *-- Wheel : have 4 >\n'+
'Car -- Person : < owns';

            cd.parse(str);
        });

        it('should handle method statements', function () {
            var str = 'classDiagram\n'+
'Object <|-- ArrayList\n'+
'Object : equals()\n'+
'ArrayList : Object[] elementData\n'+
'ArrayList : size()';

            cd.parse(str);
        });
        it('should handle parsing of method statements  grouped by brackets', function () {
            var str = 'classDiagram\n'+
'class Dummy {\n'+
'String data\n'+
'  void methods()\n'+
'}\n'+
'\n'+
'class Flight {\n'+
'   flightNumber : Integer\n'+
'   departureTime : Date\n'+
'}';

            cd.parse(str);
        });

        it('should handle parsing of separators', function () {
            var str = 'classDiagram\n'+
                'class Foo1 {\n'+
                '  You can use\n'+
                '  several lines\n'+
                '..\n'+
                'as you want\n'+
                'and group\n'+
                '==\n'+
                'things together.\n'+
                '__\n'+
                'You can have as many groups\n'+
                'as you want\n'+
                '--\n'+
                'End of class\n'+
                '}\n'+
                '\n'+
                'class User {\n'+
                '.. Simple Getter ..\n'+
                '+ getName()\n'+
                '+ getAddress()\n'+
                '.. Some setter ..\n'+
                '+ setName()\n'+
                '__ private data __\n'+
                'int age\n'+
                '-- encrypted --\n'+
                'String password\n'+
                '}';

            cd.parse(str);
        });

    });

    describe('when fetching data from an classDiagram graph it', function () {
        var cd, cDDb;
        beforeEach(function () {
            cd = require('./parser/classDiagram').parser;
            cDDb = require('./classDb');
            cd.yy = cDDb;
            cd.yy.clear();
        });
        it('should handle relation definitions EXTENSION', function () {
            var str =   'classDiagram\n'+
                        'Class01 <|-- Class02';

            cd.parse(str);

            var relations = cd.yy.getRelations();

            expect(cd.yy.getClass('Class01').id).toBe('Class01');
            expect(cd.yy.getClass('Class02').id).toBe('Class02');
            expect(relations[0].relation.type1).toBe(cDDb.relationType.EXTENSION);
            expect(relations[0].relation.type2).toBe('none');
            expect(relations[0].relation.lineType).toBe(cDDb.lineType.LINE);
        });
        it('should handle relation definitions AGGREGATION and dotted line', function () {
            var str =   'classDiagram\n'+
                        'Class01 o.. Class02';

            cd.parse(str);

            var relations = cd.yy.getRelations();

            expect(cd.yy.getClass('Class01').id).toBe('Class01');
            expect(cd.yy.getClass('Class02').id).toBe('Class02');
            expect(relations[0].relation.type1).toBe(cDDb.relationType.AGGREGATION);
            expect(relations[0].relation.type2).toBe('none');
            expect(relations[0].relation.lineType).toBe(cDDb.lineType.DOTTED_LINE);
        });
        it('should handle relation definitions COMPOSITION on both sides', function () {
            var str =  'classDiagram\n'+
                       'Class01 *--* Class02';

            cd.parse(str);

            var relations = cd.yy.getRelations();

            expect(cd.yy.getClass('Class01').id).toBe('Class01');
            expect(cd.yy.getClass('Class02').id).toBe('Class02');
            expect(relations[0].relation.type1).toBe(cDDb.relationType.COMPOSITION);
            expect(relations[0].relation.type2).toBe(cDDb.relationType.COMPOSITION);
            expect(relations[0].relation.lineType).toBe(cDDb.lineType.LINE);
        });
        it('should handle relation definitions no types', function () {
            var str =   'classDiagram\n'+
                        'Class01 -- Class02';

            cd.parse(str);

            var relations = cd.yy.getRelations();

            expect(cd.yy.getClass('Class01').id).toBe('Class01');
            expect(cd.yy.getClass('Class02').id).toBe('Class02');
            expect(relations[0].relation.type1).toBe('none');
            expect(relations[0].relation.type2).toBe('none');
            expect(relations[0].relation.lineType).toBe(cDDb.lineType.LINE);
        });
        it('should handle relation definitions with type only on right side', function () {
            var str =  'classDiagram\n'+
                       'Class01 --|> Class02';

            cd.parse(str);

            var relations = cd.yy.getRelations();

            expect(cd.yy.getClass('Class01').id).toBe('Class01');
            expect(cd.yy.getClass('Class02').id).toBe('Class02');
            expect(relations[0].relation.type1).toBe('none');
            expect(relations[0].relation.type2).toBe(cDDb.relationType.EXTENSION);
            expect(relations[0].relation.lineType).toBe(cDDb.lineType.LINE);
        });

        it('should handle multiple classes and relation definitions', function () {
            var str =   'classDiagram\n'+
                        'Class01 <|-- Class02\n'+
                        'Class03 *-- Class04\n'+
                        'Class05 o-- Class06\n'+
                        'Class07 .. Class08\n'+
                        'Class09 -- Class10';

            cd.parse(str);

            var relations = cd.yy.getRelations();

            expect(cd.yy.getClass('Class01').id).toBe('Class01');
            expect(cd.yy.getClass('Class10').id).toBe('Class10');

            expect(relations.length).toBe(5);

            expect(relations[0].relation.type1).toBe(cDDb.relationType.EXTENSION);
            expect(relations[0].relation.type2).toBe('none');
            expect(relations[0].relation.lineType).toBe(cDDb.lineType.LINE);
            expect(relations[3].relation.type1).toBe('none');
            expect(relations[3].relation.type2).toBe('none');
            expect(relations[3].relation.lineType).toBe(cDDb.lineType.DOTTED_LINE);
        });
    });
});