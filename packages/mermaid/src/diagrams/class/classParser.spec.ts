import { setConfig } from '../../config.js';
import classParser from './classParser.js';
// @ts-ignore - no types in jison
import classDiagram from './parser/classDiagram.jison';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing class diagram', function () {
  beforeEach(function () {
    classDiagram.parser.yy = classParser;
    classDiagram.parser.yy.clear();
  });

  it('should parse diagram with direction', () => {
    classDiagram.parser.parse(`classDiagram
        direction TB
        class Student {
          -idCard : IdCard
        }
        class IdCard{
          -id : int
          -name : string
        }
        class Bike{
          -id : int
          -name : string
        }
        Student "1" --o "1" IdCard : carries
        Student "1" --o "1" Bike : rides`);

    expect(Object.keys(classParser.getClasses()).length).toBe(3);
    expect(classParser.getClasses().Student).toMatchInlineSnapshot(`
      {
        "annotations": [],
        "cssClasses": [],
        "domId": "classId-Student-0",
        "id": "Student",
        "label": "Student",
        "members": [
          "-idCard : IdCard",
        ],
        "methods": [],
        "type": "",
      }
    `);
    expect(classParser.getRelations().length).toBe(2);
    expect(classParser.getRelations()).toMatchInlineSnapshot(`
      [
        {
          "id1": "Student",
          "id2": "IdCard",
          "relation": {
            "lineType": 0,
            "type1": "none",
            "type2": 0,
          },
          "relationTitle1": "1",
          "relationTitle2": "1",
          "title": "carries",
        },
        {
          "id1": "Student",
          "id2": "Bike",
          "relation": {
            "lineType": 0,
            "type1": "none",
            "type2": 0,
          },
          "relationTitle1": "1",
          "relationTitle2": "1",
          "title": "rides",
        },
      ]
    `);
  });
});
