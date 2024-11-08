// @ts-expect-error No types available for JISON
import { parser as kanban } from './parser/kanban.jison';
import kanbanDB from './kanbanDb.js';
import type { KanbanNode } from '../../rendering-util/types.js';
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
      expect(sections[0].label).toEqual('root');
    });
    it('KNBN-2 should handle a hierachial kanban definition', function () {
      const str = `kanban
    root
      child1
      child2
 `;

      kanban.parse(str);

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections.length).toEqual(1);
      expect(sections[0].label).toEqual('root');
      expect(children.length).toEqual(2);
      expect(children[0].label).toEqual('child1');
      expect(children[1].label).toEqual('child2');
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
      expect(sections[0].label).toEqual('root');
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

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections.length).toBe(1);
      expect(children.length).toBe(3);
    });
    it('5 Multiple sections are ok', function () {
      const str = `kanban
    section1
    section2`;
      kanban.parse(str);

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections.length).toBe(2);
      expect(sections[0].label).toBe('section1');
      expect(sections[1].label).toBe('section2');

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

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].id).toEqual('root');
      expect(sections[0].label).toEqual('The root');
    });
    it('KNBN-8 should handle an id and type for a node definition', function () {
      const str = `kanban
    root
      theId(child1)`;

      kanban.parse(str);

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].label).toEqual('root');
      expect(children.length).toEqual(1);
      const child = children[0];
      expect(child.label).toEqual('child1');
      expect(child.id).toEqual('theId');
    });
    it('KNBN-9 should handle an id and type for a node definition', function () {
      const str = `kanban
root
      theId(child1)`;

      kanban.parse(str);

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].label).toEqual('root');
      expect(children.length).toEqual(1);
      const child = children[0];
      expect(child.label).toEqual('child1');
      expect(child.id).toEqual('theId');
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

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].id).toEqual('root');
      expect(sections[0].label).toEqual('The root');

      expect(sections[0].icon).toEqual('bomb');
    });
    it('KNBN-14 should be possible to set classes for the node', function () {
      const str = `kanban
    root[The root]
    :::m-4 p-8
    `;
      // ::class1 class2

      kanban.parse(str);

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].id).toEqual('root');
      expect(sections[0].label).toEqual('The root');
      expect(sections[0].cssClasses).toEqual('m-4 p-8');
    });
    it('KNBN-15 should be possible to set both classes and icon for the node', function () {
      const str = `kanban
    root[The root]
    :::m-4 p-8
    ::icon(bomb)
    `;
      // ::class1 class2

      kanban.parse(str);

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].id).toEqual('root');
      expect(sections[0].label).toEqual('The root');
      expect(sections[0].cssClasses).toEqual('m-4 p-8');
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

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].id).toEqual('root');
      expect(sections[0].label).toEqual('The root');
      // expect(sections[0].type).toEqual('rect');
      expect(sections[0].cssClasses).toEqual('m-4 p-8');
      expect(sections[0].icon).toEqual('bomb');
    });
  });
  describe('descriptions', function () {
    it('KNBN-17 should be possible to use node syntax in the descriptions', function () {
      const str = `kanban
    root["String containing []"]
`;
      kanban.parse(str);

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].id).toEqual('root');
      expect(sections[0].label).toEqual('String containing []');
    });
    it('KNBN-18 should be possible to use node syntax in the descriptions in children', function () {
      const str = `kanban
    root["String containing []"]
      child1["String containing ()"]
`;
      kanban.parse(str);

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].id).toEqual('root');
      expect(sections[0].label).toEqual('String containing []');
      expect(children.length).toEqual(1);
      expect(children[0].label).toEqual('String containing ()');
    });
    it('KNBN-19 should be possible to have a child after a class assignment', function () {
      const str = `kanban
  root(Root)
    Child(Child)
    :::hot
      a(a)
      b[New Stuff]`;
      kanban.parse(str);

      const data = kanban.yy.getData();
      const sections = kanban.yy.getSections();
      const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

      expect(sections[0].id).toEqual('root');
      expect(sections[0].label).toEqual('Root');
      expect(children.length).toEqual(3);

      const item1 = children[0];
      const item2 = children[1];
      const item3 = children[2];
      expect(item1.id).toEqual('Child');
      expect(item2.id).toEqual('a');
      expect(item3.id).toEqual('b');
    });
  });
  it('KNBN-20 should be possible to have meaningless empty rows in a kanban abc124', function () {
    const str = `kanban
  root(Root)
    Child(Child)
      a(a)

      b[New Stuff]`;
    kanban.parse(str);

    const data = kanban.yy.getData();
    const sections = kanban.yy.getSections();
    const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

    expect(sections[0].id).toEqual('root');
    expect(sections[0].label).toEqual('Root');
    expect(children.length).toEqual(3);

    const item1 = children[0];
    const item2 = children[1];
    const item3 = children[2];
    expect(item1.id).toEqual('Child');
    expect(item2.id).toEqual('a');
    expect(item3.id).toEqual('b');
  });
  it('KNBN-21 should be possible to have comments in a kanban', function () {
    const str = `kanban
  root(Root)
    Child(Child)
      a(a)

      %% This is a comment
      b[New Stuff]`;
    kanban.parse(str);

    const data = kanban.yy.getData();
    const sections = kanban.yy.getSections();
    const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

    expect(sections[0].id).toEqual('root');
    expect(sections[0].label).toEqual('Root');

    const child = children[0];
    expect(child.id).toEqual('Child');
    expect(children[1].id).toEqual('a');
    expect(children[2].id).toEqual('b');
    expect(children.length).toEqual(3);
  });

  it('KNBN-22 should be possible to have comments at the end of a line', function () {
    const str = `kanban
  root(Root)
    Child(Child)
      a(a) %% This is a comment
      b[New Stuff]`;
    kanban.parse(str);

    const data = kanban.yy.getData();
    const sections = kanban.yy.getSections();
    const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

    expect(sections[0].id).toEqual('root');
    expect(sections[0].label).toEqual('Root');
    expect(children.length).toEqual(3);

    const child1 = children[0];
    expect(child1.id).toEqual('Child');
    const child2 = children[1];
    expect(child2.id).toEqual('a');
    const child3 = children[2];
    expect(child3.id).toEqual('b');
  });
  it('KNBN-23 Rows with only spaces should not interfere', function () {
    const str = 'kanban\nroot\n A\n \n\n B';
    kanban.parse(str);

    const data = kanban.yy.getData();
    const sections = kanban.yy.getSections();
    const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

    expect(sections[0].id).toEqual('root');
    expect(children.length).toEqual(2);

    const child = children[0];
    expect(child.id).toEqual('A');
    const child2 = children[1];
    expect(child2.id).toEqual('B');
  });
  it('KNBN-24 Handle rows above the kanban declarations', function () {
    const str = '\n \nkanban\nroot\n A\n \n\n B';
    kanban.parse(str);

    const data = kanban.yy.getData();
    const sections = kanban.yy.getSections();
    const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

    expect(sections[0].id).toEqual('root');
    expect(children.length).toEqual(2);

    const child = children[0];
    expect(child.id).toEqual('A');
    const child2 = children[1];
    expect(child2.id).toEqual('B');
  });
  it('KNBN-25 Handle rows above the kanban declarations, no space', function () {
    const str = '\n\n\nkanban\nroot\n A\n \n\n B';
    kanban.parse(str);
    const data = kanban.yy.getData();
    const sections = kanban.yy.getSections();
    const children = data.nodes.filter((n: KanbanNode) => n.parentId === sections[0].id);

    expect(sections[0].id).toEqual('root');
    expect(children.length).toEqual(2);

    const child = children[0];
    expect(child.id).toEqual('A');
    const child2 = children[1];
    expect(child2.id).toEqual('B');
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
    expect(sections[0].id).toEqual('root');
    expect(sections[0].priority).toEqual('high');
  });
  it('KNBN-31 should be possible to set the assignment', function () {
    const str = `kanban
        root@{ assigned: knsv }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].id).toEqual('root');
    expect(sections[0].assigned).toEqual('knsv');
  });
  it('KNBN-32 should be possible to set the icon', function () {
    const str = `kanban
        root@{ icon: star }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].id).toEqual('root');
    expect(sections[0].icon).toEqual('star');
  });
  it('KNBN-33 should be possible to set the icon', function () {
    const str = `kanban
        root@{ icon: star }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].id).toEqual('root');
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
    expect(sections[0].id).toEqual('root');
    expect(sections[0].icon).toEqual('star');
    expect(sections[0].assigned).toEqual('knsv');
  });
  it('KNBN-35 should be possible to set the metadata using one line', function () {
    const str = `kanban
        root@{ icon: star, assigned: knsv }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].id).toEqual('root');
    expect(sections[0].icon).toEqual('star');
    expect(sections[0].assigned).toEqual('knsv');
  });
  it('KNBN-36 should be possible to set the label using the new syntax', function () {
    const str = `kanban
        root@{ icon: star, label: 'fix things' }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    expect(sections[0].label).toEqual('fix things');
  });
  it('KNBN-37 should be possible to set the external id', function () {
    const str = `kanban
        root@{ ticket: MC-1234 }
    `;
    kanban.parse(str);
    const sections = kanban.yy.getSections();
    const data = kanban.yy.getData();
    expect(sections[0].id).toEqual('root');
    expect(sections[0].ticket).toEqual('MC-1234');
  });
});
