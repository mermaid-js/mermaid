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
      // console.log('Time for checks', kanban.yy.getMindmap().descr);
      expect(kanban.yy.getMindmap().descr).toEqual('root');
    });
    it('KNBN-2 should handle a hierachial kanban definition', function () {
      const str = `kanban
    root
      child1
      child2
 `;

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.descr).toEqual('root');
      expect(mm.children.length).toEqual(2);
      expect(mm.children[0].descr).toEqual('child1');
      expect(mm.children[1].descr).toEqual('child2');
    });

    it('3 should handle a simple root definition with a shape and without an id abc123', function () {
      const str = `kanban
    (root)`;

      kanban.parse(str);
      // console.log('Time for checks', kanban.yy.getMindmap().descr);
      expect(kanban.yy.getMindmap().descr).toEqual('root');
    });

    it('KNBN-4 should handle a deeper hierachial kanban definition', function () {
      const str = `kanban
    root
      child1
        leaf1
      child2`;

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.descr).toEqual('root');
      expect(mm.children.length).toEqual(2);
      expect(mm.children[0].descr).toEqual('child1');
      expect(mm.children[0].children[0].descr).toEqual('leaf1');
      expect(mm.children[1].descr).toEqual('child2');
    });
    it('5 Multiple roots are illegal', function () {
      const str = `kanban
    root
    fakeRoot`;

      expect(() => kanban.parse(str)).toThrow(
        'There can be only one root. No parent could be found for ("fakeRoot")'
      );
    });
    it('KNBN-6 real root in wrong place', function () {
      const str = `kanban
          root
        fakeRoot
    realRootWrongPlace`;
      expect(() => kanban.parse(str)).toThrow(
        'There can be only one root. No parent could be found for ("fakeRoot")'
      );
    });
  });
  describe('nodes', function () {
    it('KNBN-7 should handle an id and type for a node definition', function () {
      const str = `kanban
    root[The root]
      `;

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(kanban.yy.nodeType.RECT);
    });
    it('KNBN-8 should handle an id and type for a node definition', function () {
      const str = `kanban
    root
      theId(child1)`;

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.descr).toEqual('root');
      expect(mm.children.length).toEqual(1);
      const child = mm.children[0];
      expect(child.descr).toEqual('child1');
      expect(child.nodeId).toEqual('theId');
      expect(child.type).toEqual(kanban.yy.nodeType.ROUNDED_RECT);
    });
    it('KNBN-9 should handle an id and type for a node definition', function () {
      const str = `kanban
root
      theId(child1)`;

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.descr).toEqual('root');
      expect(mm.children.length).toEqual(1);
      const child = mm.children[0];
      expect(child.descr).toEqual('child1');
      expect(child.nodeId).toEqual('theId');
      expect(child.type).toEqual(kanban.yy.nodeType.ROUNDED_RECT);
    });
    it('KNBN-10 multiple types (circle)', function () {
      const str = `kanban
 root((the root))
 `;

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.descr).toEqual('the root');
      expect(mm.children.length).toEqual(0);
      expect(mm.type).toEqual(kanban.yy.nodeType.CIRCLE);
    });

    it('KNBN-11 multiple types (cloud)', function () {
      const str = `kanban
 root)the root(
`;

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.descr).toEqual('the root');
      expect(mm.children.length).toEqual(0);
      expect(mm.type).toEqual(kanban.yy.nodeType.CLOUD);
    });
    it('KNBN-12 multiple types (bang)', function () {
      const str = `kanban
 root))the root((
`;

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.descr).toEqual('the root');
      expect(mm.children.length).toEqual(0);
      expect(mm.type).toEqual(kanban.yy.nodeType.BANG);
    });

    it('KNBN-12-a multiple types (hexagon)', function () {
      const str = `kanban
 root{{the root}}
`;

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.type).toEqual(kanban.yy.nodeType.HEXAGON);
      expect(mm.descr).toEqual('the root');
      expect(mm.children.length).toEqual(0);
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
      const mm = kanban.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(kanban.yy.nodeType.RECT);
      expect(mm.icon).toEqual('bomb');
    });
    it('KNBN-14 should be possible to set classes for the node', function () {
      const str = `kanban
    root[The root]
    :::m-4 p-8
    `;
      // ::class1 class2

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(kanban.yy.nodeType.RECT);
      expect(mm.class).toEqual('m-4 p-8');
    });
    it('KNBN-15 should be possible to set both classes and icon for the node', function () {
      const str = `kanban
    root[The root]
    :::m-4 p-8
    ::icon(bomb)
    `;
      // ::class1 class2

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(kanban.yy.nodeType.RECT);
      expect(mm.class).toEqual('m-4 p-8');
      expect(mm.icon).toEqual('bomb');
    });
    it('KNBN-16 should be possible to set both classes and icon for the node', function () {
      const str = `kanban
    root[The root]
    ::icon(bomb)
    :::m-4 p-8
    `;
      // ::class1 class2

      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(kanban.yy.nodeType.RECT);
      expect(mm.class).toEqual('m-4 p-8');
      expect(mm.icon).toEqual('bomb');
    });
  });
  describe('descriptions', function () {
    it('KNBN-17 should be possible to use node syntax in the descriptions', function () {
      const str = `kanban
    root["String containing []"]
`;
      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('String containing []');
    });
    it('KNBN-18 should be possible to use node syntax in the descriptions in children', function () {
      const str = `kanban
    root["String containing []"]
      child1["String containing ()"]
`;
      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('String containing []');
      expect(mm.children.length).toEqual(1);
      expect(mm.children[0].descr).toEqual('String containing ()');
    });
    it('KNBN-19 should be possible to have a child after a class assignment', function () {
      const str = `kanban
  root(Root)
    Child(Child)
    :::hot
      a(a)
      b[New Stuff]`;
      kanban.parse(str);
      const mm = kanban.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('Root');
      expect(mm.children.length).toEqual(1);

      const child = mm.children[0];
      expect(child.nodeId).toEqual('Child');
      expect(child.children[0].nodeId).toEqual('a');
      expect(child.children.length).toEqual(2);
      expect(child.children[1].nodeId).toEqual('b');
    });
  });
  it('KNBN-20 should be possible to have meaningless empty rows in a kanban abc124', function () {
    const str = `kanban
  root(Root)
    Child(Child)
      a(a)

      b[New Stuff]`;
    kanban.parse(str);
    const mm = kanban.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.descr).toEqual('Root');
    expect(mm.children.length).toEqual(1);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('Child');
    expect(child.children[0].nodeId).toEqual('a');
    expect(child.children.length).toEqual(2);
    expect(child.children[1].nodeId).toEqual('b');
  });
  it('KNBN-21 should be possible to have comments in a kanban', function () {
    const str = `kanban
  root(Root)
    Child(Child)
      a(a)

      %% This is a comment
      b[New Stuff]`;
    kanban.parse(str);
    const mm = kanban.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.descr).toEqual('Root');
    expect(mm.children.length).toEqual(1);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('Child');
    expect(child.children[0].nodeId).toEqual('a');
    expect(child.children.length).toEqual(2);
    expect(child.children[1].nodeId).toEqual('b');
  });

  it('KNBN-22 should be possible to have comments at the end of a line', function () {
    const str = `kanban
  root(Root)
    Child(Child)
      a(a) %% This is a comment
      b[New Stuff]`;
    kanban.parse(str);
    const mm = kanban.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.descr).toEqual('Root');
    expect(mm.children.length).toEqual(1);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('Child');
    expect(child.children[0].nodeId).toEqual('a');
    expect(child.children.length).toEqual(2);
    expect(child.children[1].nodeId).toEqual('b');
  });
  it('KNBN-23 Rows with only spaces should not interfere', function () {
    const str = 'kanban\nroot\n A\n \n\n B';
    kanban.parse(str);
    const mm = kanban.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.children.length).toEqual(2);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('A');
    const child2 = mm.children[1];
    expect(child2.nodeId).toEqual('B');
  });
  it('KNBN-24 Handle rows above the kanban declarations', function () {
    const str = '\n \nkanban\nroot\n A\n \n\n B';
    kanban.parse(str);
    const mm = kanban.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.children.length).toEqual(2);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('A');
    const child2 = mm.children[1];
    expect(child2.nodeId).toEqual('B');
  });
  it('KNBN-25 Handle rows above the kanban declarations, no space', function () {
    const str = '\n\n\nkanban\nroot\n A\n \n\n B';
    kanban.parse(str);
    const mm = kanban.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.children.length).toEqual(2);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('A');
    const child2 = mm.children[1];
    expect(child2.nodeId).toEqual('B');
  });
});
