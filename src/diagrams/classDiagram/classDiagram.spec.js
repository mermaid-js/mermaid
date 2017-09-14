/* eslint-env jasmine */
import { parser } from './parser/classDiagram'
import classDb from './classDb'

describe('class diagram, ', function () {
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = classDb
    })

    it('should handle relation definitions', function () {
      const str = 'classDiagram\n' +
'Class01 <|-- Class02\n' +
'Class03 *-- Class04\n' +
'Class05 o-- Class06\n' +
'Class07 .. Class08\n' +
'Class09 -- Class1'

      parser.parse(str)
    })
    it('should handle relation definition of different types and directions', function () {
      const str = 'classDiagram\n' +
'Class11 <|.. Class12\n' +
'Class13 --> Class14\n' +
'Class15 ..> Class16\n' +
'Class17 ..|> Class18\n' +
'Class19 <--* Class20'

      parser.parse(str)
    })

    it('should handle cardinality and labels', function () {
      const str = 'classDiagram\n' +
'Class01 "1" *-- "many" Class02 : contains\n' +
'Class03 o-- Class04 : aggregation\n' +
'Class05 --> "1" Class06'

      parser.parse(str)
    })
    it('should handle class definitions', function () {
      const str = 'classDiagram\n' +
'class Car\n' +
'Driver -- Car : drives >\n' +
'Car *-- Wheel : have 4 >\n' +
'Car -- Person : < owns'

      parser.parse(str)
    })

    it('should handle method statements', function () {
      const str = 'classDiagram\n' +
'Object <|-- ArrayList\n' +
'Object : equals()\n' +
'ArrayList : Object[] elementData\n' +
'ArrayList : size()'

      parser.parse(str)
    })
    it('should handle parsing of method statements  grouped by brackets', function () {
      const str = 'classDiagram\n' +
'class Dummy {\n' +
'String data\n' +
'  void methods()\n' +
'}\n' +
'\n' +
'class Flight {\n' +
'   flightNumber : Integer\n' +
'   departureTime : Date\n' +
'}'

      parser.parse(str)
    })

    it('should handle parsing of separators', function () {
      const str = 'classDiagram\n' +
                'class Foo1 {\n' +
                '  You can use\n' +
                '  several lines\n' +
                '..\n' +
                'as you want\n' +
                'and group\n' +
                '==\n' +
                'things together.\n' +
                '__\n' +
                'You can have as many groups\n' +
                'as you want\n' +
                '--\n' +
                'End of class\n' +
                '}\n' +
                '\n' +
                'class User {\n' +
                '.. Simple Getter ..\n' +
                '+ getName()\n' +
                '+ getAddress()\n' +
                '.. Some setter ..\n' +
                '+ setName()\n' +
                '__ private data __\n' +
                'int age\n' +
                '-- encrypted --\n' +
                'String password\n' +
                '}'

      parser.parse(str)
    })
  })

  describe('when fetching data from an classDiagram graph it', function () {
    beforeEach(function () {
      parser.yy = classDb
      parser.yy.clear()
    })
    it('should handle relation definitions EXTENSION', function () {
      const str = 'classDiagram\n' +
                        'Class01 <|-- Class02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getClass('Class01').id).toBe('Class01')
      expect(parser.yy.getClass('Class02').id).toBe('Class02')
      expect(relations[0].relation.type1).toBe(classDb.relationType.EXTENSION)
      expect(relations[0].relation.type2).toBe('none')
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE)
    })
    it('should handle relation definitions AGGREGATION and dotted line', function () {
      const str = 'classDiagram\n' +
                        'Class01 o.. Class02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getClass('Class01').id).toBe('Class01')
      expect(parser.yy.getClass('Class02').id).toBe('Class02')
      expect(relations[0].relation.type1).toBe(classDb.relationType.AGGREGATION)
      expect(relations[0].relation.type2).toBe('none')
      expect(relations[0].relation.lineType).toBe(classDb.lineType.DOTTED_LINE)
    })
    it('should handle relation definitions COMPOSITION on both sides', function () {
      const str = 'classDiagram\n' +
                       'Class01 *--* Class02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getClass('Class01').id).toBe('Class01')
      expect(parser.yy.getClass('Class02').id).toBe('Class02')
      expect(relations[0].relation.type1).toBe(classDb.relationType.COMPOSITION)
      expect(relations[0].relation.type2).toBe(classDb.relationType.COMPOSITION)
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE)
    })
    it('should handle relation definitions no types', function () {
      const str = 'classDiagram\n' +
                        'Class01 -- Class02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getClass('Class01').id).toBe('Class01')
      expect(parser.yy.getClass('Class02').id).toBe('Class02')
      expect(relations[0].relation.type1).toBe('none')
      expect(relations[0].relation.type2).toBe('none')
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE)
    })
    it('should handle relation definitions with type only on right side', function () {
      const str = 'classDiagram\n' +
                       'Class01 --|> Class02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getClass('Class01').id).toBe('Class01')
      expect(parser.yy.getClass('Class02').id).toBe('Class02')
      expect(relations[0].relation.type1).toBe('none')
      expect(relations[0].relation.type2).toBe(classDb.relationType.EXTENSION)
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE)
    })

    it('should handle multiple classes and relation definitions', function () {
      const str = 'classDiagram\n' +
                        'Class01 <|-- Class02\n' +
                        'Class03 *-- Class04\n' +
                        'Class05 o-- Class06\n' +
                        'Class07 .. Class08\n' +
                        'Class09 -- Class10'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getClass('Class01').id).toBe('Class01')
      expect(parser.yy.getClass('Class10').id).toBe('Class10')

      expect(relations.length).toBe(5)

      expect(relations[0].relation.type1).toBe(classDb.relationType.EXTENSION)
      expect(relations[0].relation.type2).toBe('none')
      expect(relations[0].relation.lineType).toBe(classDb.lineType.LINE)
      expect(relations[3].relation.type1).toBe('none')
      expect(relations[3].relation.type2).toBe('none')
      expect(relations[3].relation.lineType).toBe(classDb.lineType.DOTTED_LINE)
    })
  })
})
