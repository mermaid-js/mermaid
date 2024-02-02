// @ts-expect-error No types available for JISON
import { parser as mindmap } from './parser/mindmap.jison';
import mindmapDB from './mindmapDb.js';
// Todo fix utils functions for tests
import { setLogLevel } from '../../diagram-api/diagramAPI.js';

describe('when parsing a mindmap ', function () {
  beforeEach(function () {
    mindmap.yy = mindmapDB;
    mindmap.yy.clear();
    setLogLevel('trace');
  });
  describe('hiearchy', function () {
    it('MMP-1 should handle a simple root definition abc122', function () {
      const str = `mindmap
    root`;

      mindmap.parse(str);
      // console.log('Time for checks', mindmap.yy.getMindmap().descr);
      expect(mindmap.yy.getMindmap().descr).toEqual('root');
    });
    it('MMP-2 should handle a hierachial mindmap definition', function () {
      const str = `mindmap
    root
      child1
      child2
 `;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.descr).toEqual('root');
      expect(mm.children.length).toEqual(2);
      expect(mm.children[0].descr).toEqual('child1');
      expect(mm.children[1].descr).toEqual('child2');
    });

    it('3 should handle a simple root definition with a shape and without an id abc123', function () {
      const str = `mindmap
    (root)`;

      mindmap.parse(str);
      // console.log('Time for checks', mindmap.yy.getMindmap().descr);
      expect(mindmap.yy.getMindmap().descr).toEqual('root');
    });

    it('MMP-4 should handle a deeper hierachial mindmap definition', function () {
      const str = `mindmap
    root
      child1
        leaf1
      child2`;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.descr).toEqual('root');
      expect(mm.children.length).toEqual(2);
      expect(mm.children[0].descr).toEqual('child1');
      expect(mm.children[0].children[0].descr).toEqual('leaf1');
      expect(mm.children[1].descr).toEqual('child2');
    });
    it('5 Multiple roots are illegal', function () {
      const str = `mindmap
    root
    fakeRoot`;

      expect(() => mindmap.parse(str)).toThrow(
        'There can be only one root. No parent could be found for ("fakeRoot")'
      );
    });
    it('MMP-6 real root in wrong place', function () {
      const str = `mindmap
          root
        fakeRoot
    realRootWrongPlace`;
      expect(() => mindmap.parse(str)).toThrow(
        'There can be only one root. No parent could be found for ("fakeRoot")'
      );
    });
  });
  describe('nodes', function () {
    it('MMP-7 should handle an id and type for a node definition', function () {
      const str = `mindmap
    root[The root]
      `;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(mindmap.yy.nodeType.RECT);
    });
    it('MMP-8 should handle an id and type for a node definition', function () {
      const str = `mindmap
    root
      theId(child1)`;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.descr).toEqual('root');
      expect(mm.children.length).toEqual(1);
      const child = mm.children[0];
      expect(child.descr).toEqual('child1');
      expect(child.nodeId).toEqual('theId');
      expect(child.type).toEqual(mindmap.yy.nodeType.ROUNDED_RECT);
    });
    it('MMP-9 should handle an id and type for a node definition', function () {
      const str = `mindmap
root
      theId(child1)`;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.descr).toEqual('root');
      expect(mm.children.length).toEqual(1);
      const child = mm.children[0];
      expect(child.descr).toEqual('child1');
      expect(child.nodeId).toEqual('theId');
      expect(child.type).toEqual(mindmap.yy.nodeType.ROUNDED_RECT);
    });
    it('MMP-10 multiple types (circle)', function () {
      const str = `mindmap
 root((the root))
 `;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.descr).toEqual('the root');
      expect(mm.children.length).toEqual(0);
      expect(mm.type).toEqual(mindmap.yy.nodeType.CIRCLE);
    });

    it('MMP-11 multiple types (cloud)', function () {
      const str = `mindmap
 root)the root(
`;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.descr).toEqual('the root');
      expect(mm.children.length).toEqual(0);
      expect(mm.type).toEqual(mindmap.yy.nodeType.CLOUD);
    });
    it('MMP-12 multiple types (bang)', function () {
      const str = `mindmap
 root))the root((
`;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.descr).toEqual('the root');
      expect(mm.children.length).toEqual(0);
      expect(mm.type).toEqual(mindmap.yy.nodeType.BANG);
    });

    it('MMP-12-a multiple types (hexagon)', function () {
      const str = `mindmap
 root{{the root}}
`;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.type).toEqual(mindmap.yy.nodeType.HEXAGON);
      expect(mm.descr).toEqual('the root');
      expect(mm.children.length).toEqual(0);
    });
  });
  describe('decorations', function () {
    it('MMP-13 should be possible to set an icon for the node', function () {
      const str = `mindmap
    root[The root]
    ::icon(bomb)
    `;
      // ::class1 class2

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(mindmap.yy.nodeType.RECT);
      expect(mm.icon).toEqual('bomb');
    });
    it('MMP-14 should be possible to set classes for the node', function () {
      const str = `mindmap
    root[The root]
    :::m-4 p-8
    `;
      // ::class1 class2

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(mindmap.yy.nodeType.RECT);
      expect(mm.class).toEqual('m-4 p-8');
    });
    it('MMP-15 should be possible to set both classes and icon for the node', function () {
      const str = `mindmap
    root[The root]
    :::m-4 p-8
    ::icon(bomb)
    `;
      // ::class1 class2

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(mindmap.yy.nodeType.RECT);
      expect(mm.class).toEqual('m-4 p-8');
      expect(mm.icon).toEqual('bomb');
    });
    it('MMP-16 should be possible to set both classes and icon for the node', function () {
      const str = `mindmap
    root[The root]
    ::icon(bomb)
    :::m-4 p-8
    `;
      // ::class1 class2

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(mindmap.yy.nodeType.RECT);
      expect(mm.class).toEqual('m-4 p-8');
      expect(mm.icon).toEqual('bomb');
    });
  });
  describe('descriptions', function () {
    it('MMP-17 should be possible to use node syntax in the descriptions', function () {
      const str = `mindmap
    root["String containing []"]
`;
      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('String containing []');
    });
    it('MMP-18 should be possible to use node syntax in the descriptions in children', function () {
      const str = `mindmap
    root["String containing []"]
      child1["String containing ()"]
`;
      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('String containing []');
      expect(mm.children.length).toEqual(1);
      expect(mm.children[0].descr).toEqual('String containing ()');
    });
    it('MMP-19 should be possible to have a child after a class assignment', function () {
      const str = `mindmap
  root(Root)
    Child(Child)
    :::hot
      a(a)
      b[New Stuff]`;
      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
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
  it('MMP-20 should be possible to have meaningless empty rows in a mindmap abc124', function () {
    const str = `mindmap
  root(Root)
    Child(Child)
      a(a)

      b[New Stuff]`;
    mindmap.parse(str);
    const mm = mindmap.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.descr).toEqual('Root');
    expect(mm.children.length).toEqual(1);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('Child');
    expect(child.children[0].nodeId).toEqual('a');
    expect(child.children.length).toEqual(2);
    expect(child.children[1].nodeId).toEqual('b');
  });
  it('MMP-21 should be possible to have comments in a mindmap', function () {
    const str = `mindmap
  root(Root)
    Child(Child)
      a(a)

      %% This is a comment
      b[New Stuff]`;
    mindmap.parse(str);
    const mm = mindmap.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.descr).toEqual('Root');
    expect(mm.children.length).toEqual(1);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('Child');
    expect(child.children[0].nodeId).toEqual('a');
    expect(child.children.length).toEqual(2);
    expect(child.children[1].nodeId).toEqual('b');
  });

  it('MMP-22 should be possible to have comments at the end of a line', function () {
    const str = `mindmap
  root(Root)
    Child(Child)
      a(a) %% This is a comment
      b[New Stuff]`;
    mindmap.parse(str);
    const mm = mindmap.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.descr).toEqual('Root');
    expect(mm.children.length).toEqual(1);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('Child');
    expect(child.children[0].nodeId).toEqual('a');
    expect(child.children.length).toEqual(2);
    expect(child.children[1].nodeId).toEqual('b');
  });
  it('MMP-23 Rows with only spaces should not interfere', function () {
    const str = 'mindmap\nroot\n A\n \n\n B';
    mindmap.parse(str);
    const mm = mindmap.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.children.length).toEqual(2);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('A');
    const child2 = mm.children[1];
    expect(child2.nodeId).toEqual('B');
  });
  it('MMP-24 Handle rows above the mindmap declarations', function () {
    const str = '\n \nmindmap\nroot\n A\n \n\n B';
    mindmap.parse(str);
    const mm = mindmap.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.children.length).toEqual(2);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('A');
    const child2 = mm.children[1];
    expect(child2.nodeId).toEqual('B');
  });
  it('MMP-25 Handle rows above the mindmap declarations, no space', function () {
    const str = '\n\n\nmindmap\nroot\n A\n \n\n B';
    mindmap.parse(str);
    const mm = mindmap.yy.getMindmap();
    expect(mm.nodeId).toEqual('root');
    expect(mm.children.length).toEqual(2);

    const child = mm.children[0];
    expect(child.nodeId).toEqual('A');
    const child2 = mm.children[1];
    expect(child2.nodeId).toEqual('B');
  });
});
