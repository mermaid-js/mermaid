// @ts-expect-error No types available for JISON
import { parser as kanban } from './parser/kanban.jison';
import kanbanDB from './kanbanDb.js';
// Todo fix utils functions for tests
import { setLogLevel } from '../../diagram-api/diagramAPI.js';

describe('when parsing a kanban ', function () {
  beforeEach(function () {
    kanban.yy = kanbanDB;
    kanban.yy.clear();
    setLogLevel('trace');
  });
  describe('hiearchy', function () {
    it('KNBN-1 should handle a simple root definition abc122', function () {
      const str = `kanban
    root`;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections.length).toEqual(1);
      expect(sections[0].descr).toEqual('root');
    });
    it('KNBN-2 should handle a hierachial kanban definition', function () {
      const str = `kanban
    root
      child1
      child2
 `;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections.length).toEqual(1);
      expect(sections[0].descr).toEqual('root');
      expect(sections[0].children.length).toEqual(2);
      expect(sections[0].children[0].descr).toEqual('child1');
      expect(sections[0].children[1].descr).toEqual('child2');
    });

    /** CATCH case when a lower level comes later, should throw
     *    a
     *   b
     *    c
     */

    it('3 should handle a simple root definition with a shape and without an id abc123', function () {
      const str = `kanban
    (root)`;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].descr).toEqual('root');
    });

    it('KNBN-4 should not dsitinguis between deeper hierachial levels in thr kanban definition', function () {
      const str = `kanban
    root
      child1
        leaf1
      child2`;

      // less picky is better
      //       expect(() => kanban.parse(str)).toThrow(
      //   'There can be only one root. No parent could be found for ("fakeRoot")'
      // );

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections.length).toBe(1);
      expect(sections[0].children.length).toBe(3);
    });
    it('5 Multiple sections are ok', function () {
      const str = `kanban
    section1
    section2`;
      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections.length).toBe(2);
      expect(sections[0].descr).toBe('section1');
      expect(sections[1].descr).toBe('section2');

      // expect(() => kanban.parse(str)).toThrow(
      //   'There can be only one root. No parent could be found for ("fakeRoot")'
      // );
    });
    it('KNBN-6 real root in wrong place', function () {
      const str = `kanban
          root
        fakeRoot
    realRootWrongPlace`;
      expect(() => kanban.parse(str)).toThrow(
        'Items without section detected, found section ("fakeRoot")'
      );
    });
  });
  describe('nodes', function () {
    it('KNBN-7 should handle an id and type for a node definition', function () {
      const str = `kanban
    root[The root]
      `;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].nodeId).toEqual('root');
      expect(sections[0].descr).toEqual('The root');
      expect(sections[0].type).toEqual(kanban.yy.nodeType.RECT);
    });
    it('KNBN-8 should handle an id and type for a node definition', function () {
      const str = `kanban
    root
      theId(child1)`;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].descr).toEqual('root');
      expect(sections[0].children.length).toEqual(1);
      const child = sections[0].children[0];
      expect(child.descr).toEqual('child1');
      expect(child.nodeId).toEqual('theId');
      expect(child.type).toEqual(kanban.yy.nodeType.ROUNDED_RECT);
    });
    it('KNBN-9 should handle an id and type for a node definition', function () {
      const str = `kanban
root
      theId(child1)`;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].descr).toEqual('root');
      expect(sections[0].children.length).toEqual(1);
      const child = sections[0].children[0];
      expect(child.descr).toEqual('child1');
      expect(child.nodeId).toEqual('theId');
      expect(child.type).toEqual(kanban.yy.nodeType.ROUNDED_RECT);
    });
    it('KNBN-10 multiple types (circle)', function () {
      const str = `kanban
 root((the root))
 `;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].descr).toEqual('the root');
      expect(sections[0].children.length).toEqual(0);
      expect(sections[0].type).toEqual(kanban.yy.nodeType.CIRCLE);
    });

    it('KNBN-11 multiple types (cloud)', function () {
      const str = `kanban
 root)the root(
`;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].descr).toEqual('the root');
      expect(sections[0].children.length).toEqual(0);
      expect(sections[0].type).toEqual(kanban.yy.nodeType.CLOUD);
    });
    it('KNBN-12 multiple types (bang)', function () {
      const str = `kanban
 root))the root((
`;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].descr).toEqual('the root');
      expect(sections[0].children.length).toEqual(0);
      expect(sections[0].type).toEqual(kanban.yy.nodeType.BANG);
    });

    it('KNBN-12-a multiple types (hexagon)', function () {
      const str = `kanban
 root{{the root}}
`;

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].type).toEqual(kanban.yy.nodeType.HEXAGON);
      expect(sections[0].descr).toEqual('the root');
      expect(sections[0].children.length).toEqual(0);
    });
  });
  describe('decorations', function () {
    it('KNBN-13 should be possible to set an icon for the node', function () {
      const str = `kanban
    root[The root]
    ::icon(bomb)
    `;
      // ::class1 class2

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].nodeId).toEqual('root');
      expect(sections[0].descr).toEqual('The root');
      expect(sections[0].type).toEqual(kanban.yy.nodeType.RECT);
      expect(sections[0].icon).toEqual('bomb');
    });
    it('KNBN-14 should be possible to set classes for the node', function () {
      const str = `kanban
    root[The root]
    :::m-4 p-8
    `;
      // ::class1 class2

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].nodeId).toEqual('root');
      expect(sections[0].descr).toEqual('The root');
      expect(sections[0].type).toEqual(kanban.yy.nodeType.RECT);
      expect(sections[0].class).toEqual('m-4 p-8');
    });
    it('KNBN-15 should be possible to set both classes and icon for the node', function () {
      const str = `kanban
    root[The root]
    :::m-4 p-8
    ::icon(bomb)
    `;
      // ::class1 class2

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].nodeId).toEqual('root');
      expect(sections[0].descr).toEqual('The root');
      expect(sections[0].type).toEqual(kanban.yy.nodeType.RECT);
      expect(sections[0].class).toEqual('m-4 p-8');
      expect(sections[0].icon).toEqual('bomb');
    });
    it('KNBN-16 should be possible to set both classes and icon for the node', function () {
      const str = `kanban
    root[The root]
    ::icon(bomb)
    :::m-4 p-8
    `;
      // ::class1 class2

      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].nodeId).toEqual('root');
      expect(sections[0].descr).toEqual('The root');
      expect(sections[0].type).toEqual(kanban.yy.nodeType.RECT);
      expect(sections[0].class).toEqual('m-4 p-8');
      expect(sections[0].icon).toEqual('bomb');
    });
  });
  describe('descriptions', function () {
    it('KNBN-17 should be possible to use node syntax in the descriptions', function () {
      const str = `kanban
    root["String containing []"]
`;
      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].nodeId).toEqual('root');
      expect(sections[0].descr).toEqual('String containing []');
    });
    it('KNBN-18 should be possible to use node syntax in the descriptions in children', function () {
      const str = `kanban
    root["String containing []"]
      child1["String containing ()"]
`;
      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].nodeId).toEqual('root');
      expect(sections[0].descr).toEqual('String containing []');
      expect(sections[0].children.length).toEqual(1);
      expect(sections[0].children[0].descr).toEqual('String containing ()');
    });
    it('KNBN-19 should be possible to have a child after a class assignment', function () {
      const str = `kanban
  root(Root)
    Child(Child)
    :::hot
      a(a)
      b[New Stuff]`;
      kanban.parse(str);
      const sections = kanban.yy.getSections();
      expect(sections[0].nodeId).toEqual('root');
      expect(sections[0].descr).toEqual('Root');
      expect(sections[0].children.length).toEqual(3);

      const item1 = sections[0].children[0];
      const item2 = sections[0].children[1];
      const item3 = sections[0].children[2];
      expect(item1.nodeId).toEqual('Child');
      expect(item2.nodeId).toEqual('a');
      expect(item3.nodeId).toEqual('b');
    });
  });
  it('KNBN-20 should be possible to have meaningless empty rows in a kanban abc124', function () {
    const str = `kanban
  root(Root)
    Child(Child)
      a(a)

      b[New Stuff]`;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].descr).toEqual('Root');
    expect(sections[0].children.length).toEqual(3);

    const item1 = sections[0].children[0];
    const item2 = sections[0].children[1];
    const item3 = sections[0].children[2];
    expect(item1.nodeId).toEqual('Child');
    expect(item2.nodeId).toEqual('a');
    expect(item3.nodeId).toEqual('b');
  });
  it('KNBN-21 should be possible to have comments in a kanban', function () {
    const str = `kanban
  root(Root)
    Child(Child)
      a(a)

      %% This is a comment
      b[New Stuff]`;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].descr).toEqual('Root');

    const child = sections[0].children[0];
    expect(child.nodeId).toEqual('Child');
    expect(sections[0].children[1].nodeId).toEqual('a');
    expect(sections[0].children[2].nodeId).toEqual('b');
    expect(sections[0].children.length).toEqual(3);
  });

  it('KNBN-22 should be possible to have comments at the end of a line', function () {
    const str = `kanban
  root(Root)
    Child(Child)
      a(a) %% This is a comment
      b[New Stuff]`;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].descr).toEqual('Root');
    expect(sections[0].children.length).toEqual(3);

    const child1 = sections[0].children[0];
    expect(child1.nodeId).toEqual('Child');
    const child2 = sections[0].children[1];
    expect(child2.nodeId).toEqual('a');
    const child3 = sections[0].children[2];
    expect(child3.nodeId).toEqual('b');
  });
  it('KNBN-23 Rows with only spaces should not interfere', function () {
    const str = 'kanban\nroot\n A\n \n\n B';
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].children.length).toEqual(2);

    const child = sections[0].children[0];
    expect(child.nodeId).toEqual('A');
    const child2 = sections[0].children[1];
    expect(child2.nodeId).toEqual('B');
  });
  it('KNBN-24 Handle rows above the kanban declarations', function () {
    const str = '\n \nkanban\nroot\n A\n \n\n B';
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].children.length).toEqual(2);

    const child = sections[0].children[0];
    expect(child.nodeId).toEqual('A');
    const child2 = sections[0].children[1];
    expect(child2.nodeId).toEqual('B');
  });
  it('KNBN-25 Handle rows above the kanban declarations, no space', function () {
    const str = '\n\n\nkanban\nroot\n A\n \n\n B';
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].children.length).toEqual(2);

    const child = sections[0].children[0];
    expect(child.nodeId).toEqual('A');
    const child2 = sections[0].children[1];
    expect(child2.nodeId).toEqual('B');
  });
});
describe('item data data', function () {
  beforeEach(function () {
    kanban.yy = kanbanDB;
    kanban.yy.clear();
    setLogLevel('trace');
  });
  it('KNBN-30 should be possible to set the priority', function () {
    let str = `kanban
    root
  `;
    str = `kanban
        root@{ priority: high }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].priority).toEqual('high');
  });
  it('KNBN-31 should be possible to set the assignment', function () {
    const str = `kanban
        root@{ assigned: knsv }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].assigned).toEqual('knsv');
  });
  it('KNBN-32 should be possible to set the icon', function () {
    const str = `kanban
        root@{ icon: star }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].icon).toEqual('star');
  });
  it('KNBN-33 should be possible to set the icon', function () {
    const str = `kanban
        root@{ icon: star }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].icon).toEqual('star');
  });
  it('KNBN-34 should be possible to set the metadata using multiple lines', function () {
    const str = `kanban
        root@{
          icon: star
          assigned: knsv
        }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].icon).toEqual('star');
    expect(sections[0].assigned).toEqual('knsv');
  });
  it('KNBN-35 should be possible to set the metadata using one line', function () {
    const str = `kanban
        root@{ icon: star, assigned: knsv }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].icon).toEqual('star');
    expect(sections[0].assigned).toEqual('knsv');
  });
  it('KNBN-36 should be possible to set the label using the new syntax', function () {
    const str = `kanban
        root@{ icon: star, label: 'fix things' }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].descr).toEqual('fix things');
  });
  it('KNBN-37 should be possible to set the external id', function () {
    const str = `kanban
        root@{ ticket: MC-1234 }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].nodeId).toEqual('root');
    expect(sections[0].ticket).toEqual('MC-1234');
  });
});
