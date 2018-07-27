/* eslint-env jasmine */
import { parser } from './parser/componentDiagram'
import componentDb from './componentDb'

describe('component diagram, ', function () {
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = componentDb
    })

    it('should handle relation definitions', function () {
      const str = 'componentDiagram\n' +
'Component01 <|-- Component02\n' +
'Component03 *-- Component04\n' +
'Component05 o-- Component06\n' +
'Component07 .. Component08\n' +
'Component09 -- Component1'

      parser.parse(str)
    })
    it('should handle relation definition of different types and directions', function () {
      const str = 'componentDiagram\n' +
'Component11 <|.. Component12\n' +
'Component13 --> Component14\n' +
'Component15 ..> Component16\n' +
'Component17 ..|> Component18\n' +
'Component19 <--* Component20'

      parser.parse(str)
    })

    it('should handle cardinality and labels', function () {
      const str = 'componentDiagram\n' +
'Component01 "1" *-- "many" Component02 : contains\n' +
'Component03 o-- Component04 : aggregation\n' +
'Component05 --> "1" Component06'

      parser.parse(str)
    })
    it('should handle component definitions', function () {
      const str = 'componentDiagram\n' +
'component Car\n' +
'Driver -- Car : drives >\n' +
'Car *-- Wheel : have 4 >\n' +
'Car -- Person : < owns'

      parser.parse(str)
    })

    it('should handle a single component with no stereotype statement', function () {
      const str = 'componentDiagram\n' +
'component Dummy'

      parser.parse(str)
    })

    it('should handle a single component with no stereotype statement and a label', function () {
      const str = 'componentDiagram\n' +
'component Dummy : DummyLabel'

      parser.parse(str)
    })

    it('should handle a bare component with no label', function () {
      const str = 'componentDiagram\n' +
'Dummy'

      parser.parse(str)
    })

    it('should handle a bare component with a label', function () {
      const str = 'componentDiagram\n' +
'Dummy : DummyLabel'

      parser.parse(str)
    })

    it('should handle a bare component with a stereotype', function () {
      const str = 'componentDiagram\n' +
'Dummy { datastore }'

      parser.parse(str)
    })

    it('should handle a bare component with a stereotype and a label', function () {
      const str = 'componentDiagram\n' +
'Dummy { datastore } : DummyLabel'

      parser.parse(str)
    })

    it('should handle a single component with one stereotype statement', function () {
      const str = 'componentDiagram\n' +
'component Dummy { datastore }'

      parser.parse(str)
    })

    it('should handle a single component with one stereotype statement and a label', function () {
      const str = 'componentDiagram\n' +
'component Dummy { datastore } : DummyLabel'

      parser.parse(str)
    })

    it('should handle a single component with one stereotype statement on several lines', function () {
      const str = 'componentDiagram\n' +
'component Dummy {\n' +
'  datastore\n' +
'}'

      parser.parse(str)
    })

    it('should handle a single component with mulitple stereotypes', function () {
      const str = 'componentDiagram\n' +
'component Dummy {\n' +
'  datastore\n' +
'  application\n' +
'}'

      parser.parse(str)
    })

    it('should handle parsing of stereotype statements grouped by brackets', function () {
      const str = 'componentDiagram\n' +
'component Dummy {\n' +
'  datastore\n' +
'  application\n' +
'}\n' +
'\n' +
'component Flight {\n' +
'   scheduledItem\n' +
'   tripEntity\n' +
'}'

      parser.parse(str)
    })

    it('should handle parsing of separators', function () {
      const str = 'componentDiagram\n' +
                'component Foo1 {\n' +
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
                'End of component\n' +
                '}\n' +
                '\n' +
                'component User {\n' +
                '.. Simple Stereoptype..\n' +
                'component\n' +
                '.. Complex Sterotype ..\n' +
                'framework\n' +
                'datastore\n' +
                '}'

      parser.parse(str)
    })
  })

  describe('when fetching data from an componentDiagram graph it', function () {
    beforeEach(function () {
      parser.yy = componentDb
      parser.yy.clear()
    })
    it('should handle relation definitions EXTENSION', function () {
      const str = 'componentDiagram\n' +
                        'Component01 <|-- Component02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getComponent('Component01').id).toBe('Component01')
      expect(parser.yy.getComponent('Component02').id).toBe('Component02')
      expect(relations[0].relation.type1).toBe(componentDb.relationType.EXTENSION)
      expect(relations[0].relation.type2).toBe('none')
      expect(relations[0].relation.lineType).toBe(componentDb.lineType.LINE)
    })
    it('should handle relation definitions AGGREGATION and dotted line', function () {
      const str = 'componentDiagram\n' +
                        'Component01 o.. Component02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getComponent('Component01').id).toBe('Component01')
      expect(parser.yy.getComponent('Component02').id).toBe('Component02')
      expect(relations[0].relation.type1).toBe(componentDb.relationType.AGGREGATION)
      expect(relations[0].relation.type2).toBe('none')
      expect(relations[0].relation.lineType).toBe(componentDb.lineType.DOTTED_LINE)
    })
    it('should handle relation definitions COMPOSITION on both sides', function () {
      const str = 'componentDiagram\n' +
                       'Component01 *--* Component02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getComponent('Component01').id).toBe('Component01')
      expect(parser.yy.getComponent('Component02').id).toBe('Component02')
      expect(relations[0].relation.type1).toBe(componentDb.relationType.COMPOSITION)
      expect(relations[0].relation.type2).toBe(componentDb.relationType.COMPOSITION)
      expect(relations[0].relation.lineType).toBe(componentDb.lineType.LINE)
    })
    it('should handle relation definitions no types', function () {
      const str = 'componentDiagram\n' +
                        'Component01 -- Component02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getComponent('Component01').id).toBe('Component01')
      expect(parser.yy.getComponent('Component02').id).toBe('Component02')
      expect(relations[0].relation.type1).toBe('none')
      expect(relations[0].relation.type2).toBe('none')
      expect(relations[0].relation.lineType).toBe(componentDb.lineType.LINE)
    })
    it('should handle relation definitions with type only on right side', function () {
      const str = 'componentDiagram\n' +
                       'Component01 --|> Component02'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getComponent('Component01').id).toBe('Component01')
      expect(parser.yy.getComponent('Component02').id).toBe('Component02')
      expect(relations[0].relation.type1).toBe('none')
      expect(relations[0].relation.type2).toBe(componentDb.relationType.EXTENSION)
      expect(relations[0].relation.lineType).toBe(componentDb.lineType.LINE)
    })

    it('should handle multiple components and relation definitions', function () {
      const str = 'componentDiagram\n' +
                        'Component01 <|-- Component02\n' +
                        'Component03 *-- Component04\n' +
                        'Component05 o-- Component06\n' +
                        'Component07 .. Component08\n' +
                        'Component09 -- Component10'

      parser.parse(str)

      const relations = parser.yy.getRelations()

      expect(parser.yy.getComponent('Component01').id).toBe('Component01')
      expect(parser.yy.getComponent('Component10').id).toBe('Component10')

      expect(relations.length).toBe(5)

      expect(relations[0].relation.type1).toBe(componentDb.relationType.EXTENSION)
      expect(relations[0].relation.type2).toBe('none')
      expect(relations[0].relation.lineType).toBe(componentDb.lineType.LINE)
      expect(relations[3].relation.type1).toBe('none')
      expect(relations[3].relation.type2).toBe('none')
      expect(relations[3].relation.lineType).toBe(componentDb.lineType.DOTTED_LINE)
    })
  })
})
