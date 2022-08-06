import mindmapDB from './mindmapDb';

describe('when parsing a mindmap ', function () {
  var mindmap;
  beforeEach(function () {
    mindmap = require('./parser/mindmap').parser;
    mindmap.yy = require('./mindmapDb');
    mindmap.yy.clear();
  });
  describe('hiearchy', function () {
    it('should handle a simple root definition', function () {
      var str = `mindmap
    root`;

      mindmap.parse(str);
      // console.log('Time for checks', mindmap.yy.getMindmap().descr);
      expect(mindmap.yy.getMindmap().descr).toEqual('root');
    });
    it('should handle a hierachial mindmap definition', function () {
      var str = `mindmap
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
    it('should handle a hierachial mindmap definition', function () {
      var str = `mindmap
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
    it('Multiple roots are illegal', function () {
      var str = `mindmap
    root
    fakeRoot`;

      try {
        mindmap.parse(str);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe(
          'There can be only one root. No parent could be found for ("fakeRoot")'
        );
      }
    });
    it('real root in wrong place', function () {
      var str = `mindmap
          root
        fakeRoot
    realRootWrongPlace`;

      try {
        mindmap.parse(str);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe(
          'There can be only one root. No parent could be found for ("fakeRoot")'
        );
      }
    });
  });
  describe('nodes', function () {
    it('should handle an id and type for a node definition', function () {
      var str = `mindmap
    root[The root]
      `;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('The root');
      expect(mm.type).toEqual(mindmap.yy.nodeType.RECT);
    });
    it('should handle an id and type for a node definition', function () {
      var str = `mindmap
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
    it('should handle an id and type for a node definition', function () {
      var str = `mindmap
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
    it('mutiple types (circle)', function () {
      var str = `mindmap
root((the root))
`;

      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.descr).toEqual('the root');
      expect(mm.children.length).toEqual(0);
      expect(mm.type).toEqual(mindmap.yy.nodeType.CIRCLE);
    });
  });
  describe('decorations', function () {
    it('should be possible to set an icon for the node', function () {
      var str = `mindmap
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
    it('should be possible to set classes for the node', function () {
      var str = `mindmap
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
    it('should be possible to set both classes and icon for the node', function () {
      var str = `mindmap
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
  });
  describe('descriptions', function () {
    it('should be possible to use node syntax in the descriptions', function () {
      var str = `mindmap
    root["String containing []"]
`;
      mindmap.parse(str);
      const mm = mindmap.yy.getMindmap();
      expect(mm.nodeId).toEqual('root');
      expect(mm.descr).toEqual('String containing []');
    });
    it('should be possible to use node syntax in the descriptions in children', function () {
      var str = `mindmap
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
    it('should be possible to have a child after a class assignment', function () {
      var str = `mindmap
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
});
