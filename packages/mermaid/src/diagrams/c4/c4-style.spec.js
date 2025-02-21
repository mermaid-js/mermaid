import { C4DB } from './c4Db.js';
import c4 from './parser/c4Diagram.jison';
import { setConfig } from '../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe.each([['C4Context'], ['C4Container'], ['C4Component'], ['C4Dynamic'], ['C4Deployment']])(
  'parsing styles for C4 %s',
  function (diagramType) {
    beforeEach(function () {
      c4.parser.yy = new C4DB();
      c4.parser.yy.clear();
    });

    it('should handle styles for nodes', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nstyle person background:#fff;\n`
      );

      const node = c4.parser.yy.getNodes().get('person');

      expect(node.cssStyles.length).toBe(1);
      expect(node.cssStyles[0]).toBe('background:#fff;');
    });

    it('should handle multiple styles for a node', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nstyle person background:#fff,fill:blue\n`
      );

      const node = c4.parser.yy.getNodes().get('person');

      expect(node.cssStyles.length).toBe(2);
      expect(node.cssStyles[0]).toBe('background:#fff');
      expect(node.cssStyles[1]).toBe('fill:blue');
    });

    it('should handle styles for multiple nodes', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nPerson("customer")\nstyle person,customer background:#fff,fill:blue\n`
      );

      const person = c4.parser.yy.getNodes().get('person');
      const customer = c4.parser.yy.getNodes().get('customer');

      expect(person.cssStyles.length).toBe(2);
      expect(person.cssStyles[0]).toBe('background:#fff');
      expect(person.cssStyles[1]).toBe('fill:blue');

      expect(customer.cssStyles.length).toBe(2);
      expect(customer.cssStyles[0]).toBe('background:#fff');
      expect(customer.cssStyles[1]).toBe('fill:blue');
    });

    it('should handle multiple style statements', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nPerson("customer")\nstyle person background:#aaa;\nstyle customer fill:blue\n`
      );

      const person = c4.parser.yy.getNodes().get('person');
      const customer = c4.parser.yy.getNodes().get('customer');

      expect(person.cssStyles.length).toBe(1);
      expect(person.cssStyles[0]).toBe('background:#aaa;');

      expect(customer.cssStyles.length).toBe(1);
      expect(customer.cssStyles[0]).toBe('fill:blue');
    });

    it('should be possible to declare a class', function () {
      const res = c4.parser.parse(`${diagramType}\nclassDef exClass background:#bbb,fill:blue;\n`);

      const classes = c4.parser.yy.getClasses();

      expect(classes.get('exClass').styles.length).toBe(2);
      expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('exClass').styles[1]).toBe('fill:blue;');
    });

    it('should be possible to declare multiple classes at once', function () {
      const res = c4.parser.parse(
        `${diagramType}\nclassDef firstClass,secondClass background:#bbb,fill:blue;\n`
      );

      const classes = c4.parser.yy.getClasses();

      expect(classes.get('firstClass').styles.length).toBe(2);
      expect(classes.get('firstClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('firstClass').styles[1]).toBe('fill:blue;');

      expect(classes.get('secondClass').styles.length).toBe(2);
      expect(classes.get('secondClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('secondClass').styles[1]).toBe('fill:blue;');
    });

    it('should be possible to declare a class with a dot in the style', function () {
      const res = c4.parser.parse(
        `${diagramType}\nclassDef exClass background:#bbb,stroke-width: 1.5px\n`
      );

      const classes = c4.parser.yy.getClasses();

      expect(classes.get('exClass').styles.length).toBe(2);
      expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('exClass').styles[1]).toBe('stroke-width: 1.5px');
    });

    it('should be possible to declare a class with a space in the style', function () {
      const res = c4.parser.parse(
        `${diagramType}\nclassDef exClass background:  #bbb,border:1.5px solid red;\n`
      );

      const classes = c4.parser.yy.getClasses();

      expect(classes.get('exClass').styles.length).toBe(2);
      expect(classes.get('exClass').styles[0]).toBe('background:  #bbb');
      expect(classes.get('exClass').styles[1]).toBe('border:1.5px solid red;');
    });

    it('should be possible to apply a class to a node using the class keyword', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nclassDef exClass background:#bbb,border:1px solid red\nclass person exClass\n`
      );

      const classes = c4.parser.yy.getClasses();

      expect(classes.get('exClass').styles.length).toBe(2);
      expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
    });

    it('should be possible to apply multiple classes to multiple nodes using the class keyword', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nPerson("customer")\nclassDef firstClass,secondClass background:#bbb,border:1px solid red\nclass person,customer firstClass, secondClass\n`
      );

      const classes = c4.parser.yy.getClasses();
      const person = c4.parser.yy.getNodes().get('person');
      const customer = c4.parser.yy.getNodes().get('customer');

      expect(classes.get('firstClass').styles.length).toBe(2);
      expect(classes.get('firstClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('firstClass').styles[1]).toBe('border:1px solid red');
      expect(classes.get('secondClass').styles.length).toBe(2);
      expect(classes.get('secondClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('secondClass').styles[1]).toBe('border:1px solid red');
      expect(person.classes.length).toBe(3);
      expect(person.classes).toEqual(['default', 'firstClass', 'secondClass']);
      expect(customer.classes.length).toBe(3);
      expect(customer.classes).toEqual(['default', 'firstClass', 'secondClass']);
    });

    it('should be possible to apply a class to a node directly via the shorthand syntax', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nclassDef exClass background:#bbb,border:1px solid red\nperson:::exClass\n`
      );

      const nodes = c4.parser.yy.getNodes();
      const classes = c4.parser.yy.getClasses();

      expect(classes.get('exClass').styles.length).toBe(2);
      expect(nodes.get('person').classes[1]).toBe('exClass');
      expect(classes.get('exClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('exClass').styles[1]).toBe('border:1px solid red');
    });

    it('should be possible to apply multiple classes to a node directly via the shorthand syntax', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nclassDef firstClass,secondClass background:#bbb,border:1px solid red\nperson:::firstClass, secondClass\n`
      );

      const nodes = c4.parser.yy.getNodes();
      const classes = c4.parser.yy.getClasses();

      expect(classes.get('firstClass').styles.length).toBe(2);
      expect(nodes.get('person').classes[1]).toBe('firstClass');
      expect(classes.get('secondClass').styles.length).toBe(2);
      expect(nodes.get('person').classes[2]).toBe('secondClass');
      expect(classes.get('firstClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('firstClass').styles[1]).toBe('border:1px solid red');
      expect(classes.get('secondClass').styles[0]).toBe('background:#bbb');
      expect(classes.get('secondClass').styles[1]).toBe('border:1px solid red');
    });

    it('should handle be possible to update an element style', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nUpdateElementStyle(person, $fontColor="red", $bgColor="grey", $borderColor="blue")`
      );

      const person = c4.parser.yy.getNodes().get('person');

      expect(person.fontColor).toBe('red');
      expect(person.bgColor).toBe('grey');
      expect(person.borderColor).toBe('blue');

      const node = c4.parser.yy.getData().nodes.find((n) => n.id === 'person');
      expect(node.cssStyles).toEqual([
        'background-color: grey',
        'color: red',
        'border-color: blue',
      ]);
    });

    it('should handle be possible to update a relation style', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nPerson("customer")\nBiRel(person, customer, "Talks to")\nUpdateRelStyle(person, customer, $textColor="red", $lineColor="blue")`
      );

      const rel = c4.parser.yy.getRels().find((r) => r.from === 'person' && r.to === 'customer');

      expect(rel.textColor).toBe('red');
      expect(rel.lineColor).toBe('blue');

      const edge = c4.parser.yy.getData().edges.find((e) => e.id === 'person-customer-0');
      expect(edge.style).toEqual(['fill: none', 'stroke: blue', 'color: red']);
    });

    it('should handle classDefs with % in classes', function () {
      const res = c4.parser.parse(
        `${diagramType}\nclassDef exClass fill:#f96,stroke:#333,stroke-width:4px,font-size:50%,font-style:bold;\n`
      );

      const classes = c4.parser.yy.getClasses();

      expect(classes.get('exClass').styles.length).toBe(5);
      expect(classes.get('exClass').styles).toEqual([
        'fill:#f96',
        'stroke:#333',
        'stroke-width:4px',
        'font-size:50%',
        'font-style:bold;',
      ]);
    });

    it('should handle element tags with styles', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nAddElementTag(myElementTag, $bgColor="red", $fontColor="green", $borderColor="yellow", $shadowing="true", $borderStyle="DottedLine()", $borderThickness="10")\n`
      );

      const tag = c4.parser.yy.getElementTags().get('myElementTag');

      expect(tag.bgColor).toBe('red');
      expect(tag.fontColor).toBe('green');
      expect(tag.borderColor).toBe('yellow');
      expect(tag.shadowing).toBe('true');
      expect(tag.borderStyle).toBe('dotted');
      expect(tag.borderThickness).toBe('10');
    });

    it('should handle relation tags with styles', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person")\nAddRelTag(myRelTag, $lineStyle="BoldLine()", $lineColor="blue", $textColor="green", $lineThickness="5")\n`
      );

      const tag = c4.parser.yy.getRelTags().get('myRelTag');

      expect(tag.lineStyle).toBe('bold');
      expect(tag.lineColor).toBe('blue');
      expect(tag.textColor).toBe('green');
      expect(tag.lineThickness).toBe('5');
    });

    it('should apply styles to elements and relations from defined tags', function () {
      const res = c4.parser.parse(
        `${diagramType}\nPerson("person", "personLabel", $tags="myElementTag")\nPerson("customer")\nBiRel(person, customer, "Talks to", $tags="myRelTag")\nAddElementTag(myElementTag, $bgColor="red", $fontColor="green", $borderColor="yellow", $shadowing="true", $borderStyle="DottedLine()", $borderThickness="10")\nAddRelTag(myRelTag, $lineStyle="BoldLine()", $lineColor="blue", $textColor="green", $lineThickness="5")\n`
      );

      const node = c4.parser.yy.getData().nodes.find((n) => n.id === 'person');
      const edge = c4.parser.yy.getData().edges.find((e) => e.id === 'person-customer-0');

      expect(node.cssStyles).toEqual([
        'fill: red',
        'color: green',
        'stroke: yellow',
        'filter: drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.5))',
        'stroke-dasharray: 2, 2',
        'stroke-width: 10',
      ]);
      expect(edge.style).toEqual([
        'fill: none',
        'color: green',
        'stroke: blue',
        'stroke-width: 2',
        'stroke-width: 5',
      ]);
    });
  }
);
