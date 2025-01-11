// @ts-ignore: jison doesn't export types
import block from './block.jison';
import db from '../blockDB.js';

describe('Block diagram', function () {
  describe('when parsing an block diagram graph it should handle > ', function () {
    beforeEach(function () {
      block.parser.yy = db;
      block.parser.yy.clear();
      block.parser.yy.getLogger = () => console;
    });

    it('a diagram with a node', () => {
      const str = `block-beta
          id
      `;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);
      expect(blocks[0].id).toBe('id');
      expect(blocks[0].label).toBe('id');
    });
    it('a node with a square shape and a label', () => {
      const str = `block-beta
          id["A label"]
          `;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);
      expect(blocks[0].id).toBe('id');
      expect(blocks[0].label).toBe('A label');
      expect(blocks[0].type).toBe('square');
    });
    it('a diagram with multiple nodes', () => {
      const str = `block-beta
          id1
          id2
      `;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(2);
      expect(blocks[0].id).toBe('id1');
      expect(blocks[0].label).toBe('id1');
      expect(blocks[0].type).toBe('na');
      expect(blocks[1].id).toBe('id2');
      expect(blocks[1].label).toBe('id2');
      expect(blocks[1].type).toBe('na');
    });
    it('a diagram with multiple nodes', () => {
      const str = `block-beta
          id1
          id2
          id3
      `;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(3);
      expect(blocks[0].id).toBe('id1');
      expect(blocks[0].label).toBe('id1');
      expect(blocks[0].type).toBe('na');
      expect(blocks[1].id).toBe('id2');
      expect(blocks[1].label).toBe('id2');
      expect(blocks[1].type).toBe('na');
      expect(blocks[2].id).toBe('id3');
      expect(blocks[2].label).toBe('id3');
      expect(blocks[2].type).toBe('na');
    });

    it('a node with a square shape and a label', () => {
      const str = `block-beta
          id["A label"]
          id2`;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(2);
      expect(blocks[0].id).toBe('id');
      expect(blocks[0].label).toBe('A label');
      expect(blocks[0].type).toBe('square');
      expect(blocks[1].id).toBe('id2');
      expect(blocks[1].label).toBe('id2');
      expect(blocks[1].type).toBe('na');
    });
    it('a diagram with multiple nodes with edges abc123', () => {
      const str = `block-beta
          id1["first"]  -->   id2["second"]
      `;

      block.parse(str);
      const blocks = db.getBlocks();
      const edges = db.getEdges();
      expect(blocks.length).toBe(2);
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('id1');
      expect(edges[0].end).toBe('id2');
      expect(edges[0].arrowTypeEnd).toBe('arrow_point');
    });
    it('a diagram with multiple nodes with edges abc123', () => {
      const str = `block-beta
          id1["first"]  -- "a label" -->   id2["second"]
      `;

      block.parse(str);
      const blocks = db.getBlocks();
      const edges = db.getEdges();
      expect(blocks.length).toBe(2);
      expect(edges.length).toBe(1);
      expect(edges[0].start).toBe('id1');
      expect(edges[0].end).toBe('id2');
      expect(edges[0].arrowTypeEnd).toBe('arrow_point');
      expect(edges[0].label).toBe('a label');
    });
    it('a diagram with column statements', () => {
      const str = `block-beta
          columns 2
          block1["Block 1"]
      `;

      block.parse(str);
      expect(db.getColumns('root')).toBe(2);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);
    });
    it('a diagram withput column statements', () => {
      const str = `block-beta
          block1["Block 1"]
      `;

      block.parse(str);
      expect(db.getColumns('root')).toBe(-1);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);
    });
    it('a diagram with auto column statements', () => {
      const str = `block-beta
          columns auto
          block1["Block 1"]
      `;

      block.parse(str);
      expect(db.getColumns('root')).toBe(-1);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);
    });

    it('blocks next to each other', () => {
      const str = `block-beta
          columns 2
          block1["Block 1"]
          block2["Block 2"]
        `;

      block.parse(str);

      const blocks = db.getBlocks();
      expect(db.getColumns('root')).toBe(2);
      expect(blocks.length).toBe(2);
    });

    it('blocks on top of each other', () => {
      const str = `block-beta
          columns 1
          block1["Block 1"]
          block2["Block 2"]
        `;

      block.parse(str);

      const blocks = db.getBlocks();
      expect(db.getColumns('root')).toBe(1);
      expect(blocks.length).toBe(2);
    });

    it('compound blocks 2', () => {
      const str = `block-beta
          block
            aBlock["ABlock"]
            bBlock["BBlock"]
          end
        `;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);

      expect(blocks[0].children.length).toBe(2);
      expect(blocks[0].id).not.toBe(undefined);
      expect(blocks[0].label).toBe('');
      expect(blocks[0].type).toBe('composite');

      const aBlock = blocks[0].children[0];

      expect(aBlock.id).not.toBe(aBlock);
      expect(aBlock.label).toBe('ABlock');
      expect(aBlock.type).toBe('square');

      const bBlock = blocks[0].children[1];
      expect(bBlock.id).not.toBe(bBlock);
      expect(bBlock.label).toBe('BBlock');
      expect(bBlock.type).toBe('square');
    });
    it('compound blocks of compound blocks', () => {
      const str = `block-beta
          block
            aBlock["ABlock"]
            block
              bBlock["BBlock"]
            end
          end
        `;

      block.parse(str);
      const blocks = db.getBlocks();

      const aBlock = blocks[0].children[0];
      const secondComposite = blocks[0].children[1];
      const bBlock = blocks[0].children[1].children[0];

      expect(blocks[0].children.length).toBe(2);
      expect(blocks[0].id).not.toBe(undefined);
      expect(blocks[0].label).toBe('');
      expect(blocks[0].type).toBe('composite');

      expect(secondComposite.children.length).toBe(1);
      expect(secondComposite.id).not.toBe(undefined);
      expect(secondComposite.label).toBe('');
      expect(secondComposite.type).toBe('composite');

      expect(aBlock.id).not.toBe(aBlock);
      expect(aBlock.label).toBe('ABlock');
      expect(aBlock.type).toBe('square');

      expect(bBlock.id).not.toBe(bBlock);
      expect(bBlock.label).toBe('BBlock');
      expect(bBlock.type).toBe('square');
    });
    it('compound blocks with title', () => {
      const str = `block-beta
          block:compoundBlock["Compound block"]
            columns 1
            block2["Block 2"]
          end
        `;

      block.parse(str);

      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);

      const compoundBlock = blocks[0];
      const block2 = compoundBlock.children[0];

      expect(compoundBlock.children.length).toBe(1);
      expect(compoundBlock.id).toBe('compoundBlock');
      expect(compoundBlock.label).toBe('Compound block');
      expect(compoundBlock.type).toBe('composite');

      expect(block2.id).toBe('block2');
      expect(block2.label).toBe('Block 2');
      expect(block2.type).toBe('square');
    });
    it('blocks mixed with compound blocks', () => {
      const str = `block-beta
          columns 1
          block1["Block 1"]

          block
            columns 2
            block2["Block 2"]
            block3["Block 3"]
          end
        `;

      block.parse(str);

      const blocks = db.getBlocks();
      expect(blocks.length).toBe(2);

      const compoundBlock = blocks[1];
      const block2 = compoundBlock.children[0];

      expect(compoundBlock.children.length).toBe(2);

      expect(block2.id).toBe('block2');
      expect(block2.label).toBe('Block 2');
      expect(block2.type).toBe('square');
    });

    it('Arrow blocks', () => {
      const str = `block-beta
        columns 3
        block1["Block 1"]
        blockArrow<["&nbsp;&nbsp;&nbsp;"]>(right)
        block2["Block 2"]`;

      block.parse(str);

      const blocks = db.getBlocks();
      expect(blocks.length).toBe(3);

      const block1 = blocks[0];
      const blockArrow = blocks[1];
      const block2 = blocks[2];

      expect(block1.id).toBe('block1');
      expect(blockArrow.id).toBe('blockArrow');
      expect(block2.id).toBe('block2');
      expect(block2.label).toBe('Block 2');
      expect(block2.type).toBe('square');
      expect(blockArrow.type).toBe('block_arrow');
      expect(blockArrow.directions).toContain('right');
    });
    it('Arrow blocks with multiple points', () => {
      const str = `block-beta
        columns 1
        A
        blockArrow<["&nbsp;&nbsp;&nbsp;"]>(up, down)
        block
          columns 3
            B
            C
            D
        end`;

      block.parse(str);

      const blocks = db.getBlocks();
      expect(blocks.length).toBe(3);

      const blockArrow = blocks[1];
      expect(blockArrow.type).toBe('block_arrow');
      expect(blockArrow.directions).toContain('up');
      expect(blockArrow.directions).toContain('down');
      expect(blockArrow.directions).not.toContain('right');
    });
    it('blocks with different widths', () => {
      const str = `block-beta
        columns 3
        one["One Slot"]
        two["Two slots"]:2
        `;

      block.parse(str);

      const blocks = db.getBlocks();
      expect(blocks.length).toBe(2);
      const one = blocks[0];
      const two = blocks[1];
      expect(two.widthInColumns).toBe(2);
    });
    it('empty blocks', () => {
      const str = `block-beta
        columns 3
        space
        middle["In the middle"]
        space
        `;

      block.parse(str);

      const blocks = db.getBlocks();
      expect(blocks.length).toBe(3);
      const sp1 = blocks[0];
      const middle = blocks[1];
      const sp2 = blocks[2];
      expect(sp1.type).toBe('space');
      expect(sp2.type).toBe('space');
      expect(middle.label).toBe('In the middle');
    });
    it('classDef statements applied to a block', () => {
      const str = `block-beta
        classDef black color:#ffffff, fill:#000000;

        mc["Memcache"]
        class mc black
        `;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);
      const mc = blocks[0];
      expect(mc.classes).toContain('black');
      const classes = db.getClasses();
      const black = classes.get('black')!;
      expect(black.id).toBe('black');
      expect(black.styles[0]).toEqual('color:#ffffff');
    });
    it('style statements applied to a block', () => {
      const str = `block-beta
columns 1
    B["A wide one in the middle"]
  style B fill:#f9F,stroke:#333,stroke-width:4px
        `;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);
      const B = blocks[0];
      expect(B.styles).toContain('fill:#f9F');
    });
  });

  describe('prototype properties', function () {
    function validateProperty(prop: string) {
      expect(() => block.parse(`block-beta\n${prop}`)).not.toThrow();
      expect(() =>
        block.parse(`block-beta\nA; classDef ${prop} color:#ffffff,fill:#000000; class A ${prop}`)
      ).not.toThrow();
    }

    it('should work with a __proto__ property', function () {
      validateProperty('__proto__');
    });

    it('should work with a constructor property', function () {
      validateProperty('constructor');
    });
  });
});
