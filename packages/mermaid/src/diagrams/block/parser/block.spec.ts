// @ts-ignore: jison doesn't export types
import block from './block.jison';
import db from '../blockDB.js';
import { cleanupComments } from '../../../diagram-api/comments.js';
import { prepareTextForParsing } from '../blockUtils.js';
import { setConfig } from '../../../config.js';

describe('Block diagram', function () {
  describe('when parsing an block diagram graph it should handle > ', function () {
    beforeEach(function () {
      block.parser.yy = db;
      block.parser.yy.clear();
      block.parser.yy.getLogger = () => console;
    });

    it('a diagram with a node', async () => {
      const str = `block-beta
          id
      `;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);
      expect(blocks[0].id).toBe('id');
      expect(blocks[0].label).toBe('id');
    });
    it('a node with a square shape and a label', async () => {
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
    it('a diagram with multiple nodes', async () => {
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
    it('a diagram with multiple nodes', async () => {
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

    it('a node with a square shape and a label', async () => {
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
    it('a diagram with multiple nodes with edges', async () => {
      const str = `block-beta
          id1["first"]  -->   id2["second"]
      `;

      block.parse(str);
    });
    it('a diagram with column statements', async () => {
      const str = `block-beta
          columns 2
          block1["Block 1"]
      `;

      block.parse(str);
      expect(db.getColumns('root')).toBe(2);
      // Todo: DB check that the we have one block and that the root block has one column
    });
    it('a diagram withput column statements', async () => {
      const str = `block-beta
          block1["Block 1"]
      `;

      block.parse(str);
      expect(db.getColumns('root')).toBe(-1);
      // Todo: DB check that the we have one block and that the root block has one column
    });
    it('a diagram with auto column statements', async () => {
      const str = `block-beta
          columns auto
          block1["Block 1"]
      `;

      block.parse(str);
      expect(db.getColumns('root')).toBe(-1);
      // Todo: DB check that the we have one block and that the root block has one column
    });

    it('blocks next to each other', async () => {
      const str = `block-beta
          columns 2
          block1["Block 1"]
          block2["Block 2"]
        `;

      block.parse(str);

      // Todo: DB check that the we have two blocks and that the root block has two columns
    });

    it('blocks on top of each other', async () => {
      const str = `block-beta
          columns 1
          block1["Block 1"]
          block2["Block 2"]
        `;

      block.parse(str);

      // Todo: DB check that the we have two blocks and that the root block has one column
    });

    it('compound blocks 2', async () => {
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
    it('compound blocks of compound blocks', async () => {
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
    it('compound blocks with title', async () => {
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
    it('blocks mixed with compound blocks', async () => {
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

    it('Arrow blocks', async () => {
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
      console.log('blockArrow', blockArrow);
    });
    it.skip('Arrow blocks with multiple points', async () => {
      const str = `block-beta
        columns 1
        A
        blockArrow(1,3)
        block
          columns 3
            B
            C
            D
        end`;

      block.parse(str);
    });
    it('blocks with different widths', async () => {
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
      console.log('Obe and Two', one, two);
      expect(two.w).toBe(2);
    });
    it('empty blocks', async () => {
      const str = `block-beta
        columns 3
        space
        middle["In the middle"]
        `;

      block.parse(str);
    });
    it.skip('classDef statements applied to a block', async () => {
      const str = `block-beta
        classDef black color:#ffffff, fill:#000000;

        mc["Memcache"]:::black
        `;

      block.parse(str);
    });
    it.skip('classDef statements applied to a block with a width', async () => {
      const str = `block-beta
        classDef black color:#ffffff, fill:#000000;
        columns 2
        mc["Memcache"]:2::black
        `;
      const apa = 'apan hopar i träden';
      block.parse(str);
    });

    it.skip('classDef statements', async () => {
      const str = `block-beta
        classDef black color:#ffffff, fill:#000000;

        block DataServices["Data Services"]
          columns H
          block Relational
            mssql["Microsoft SQL<br/>Server"]
          end
          block Tabular
            columns 3
            gds["Google Data Store"]:1
            mc["Memcache"]:2:::black
          end
        end`;

      block.parse(str);
    });
  });
});
