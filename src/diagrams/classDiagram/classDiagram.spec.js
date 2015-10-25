/**
 * Created by knut on 14-11-18.
 */
fdescribe('when parsing an info graph it',function() {
    var ex, cd;
    beforeEach(function () {
        cd = require('./parser/classDiagram').parser;
        //cd.yy = require('./classeDb');
    });

    it('should handle parsing of relation definitions', function () {
        var str = `classDiagram
Class01 <|-- Class02
Class03 *-- Class04
Class05 o-- Class06
Class07 .. Class08
Class09 -- Class1`;

        cd.parse(str);
    });
    it('should handle parsing of relation definition of different types and directions', function () {
        var str = `classDiagram
Class11 <|.. Class12
Class13 --> Class14
Class15 ..> Class16
Class17 ..|> Class18
Class19 <--* Class20`;

        cd.parse(str);
    });

    it('should handle parsing of cardinality and labels', function () {
        var str = `classDiagram
Class01 "1" *-- "many" Class02 : contains
Class03 o-- Class04 : aggregation
Class05 --> "1" Class06`;

        cd.parse(str);
    });
    it('should handle parsing of class definitions', function () {
        var str = `classDiagram
class Car
Driver -- Car : drives >
Car *-- Wheel : have 4 >
Car -- Person : < owns`;

        cd.parse(str);
    });

    it('should handle parsing of method statements', function () {
        var str = `classDiagram
Object <|-- ArrayList
Object : equals()
ArrayList : Object[] elementData
ArrayList : size()`;

        cd.parse(str);
    });

});