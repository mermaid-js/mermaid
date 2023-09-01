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
      expect(blocks[0].ID).toBe('id');
      expect(blocks[0].label).toBe('id');
    });
    it('a node with a square shape and a label', async () => {
      const str = `block-beta
          id["A label"]
          `;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(1);
      expect(blocks[0].ID).toBe('id');
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
      expect(blocks[0].ID).toBe('id1');
      expect(blocks[0].label).toBe('id1');
      expect(blocks[0].type).toBe('square');
      expect(blocks[1].ID).toBe('id2');
      expect(blocks[1].label).toBe('id2');
      expect(blocks[1].type).toBe('square');
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
      expect(blocks[0].ID).toBe('id1');
      expect(blocks[0].label).toBe('id1');
      expect(blocks[0].type).toBe('square');
      expect(blocks[1].ID).toBe('id2');
      expect(blocks[1].label).toBe('id2');
      expect(blocks[1].type).toBe('square');
      expect(blocks[2].ID).toBe('id3');
      expect(blocks[2].label).toBe('id3');
      expect(blocks[2].type).toBe('square');
    });

    it('a node with a square shape and a label', async () => {
      const str = `block-beta
          id["A label"]
          id2`;

      block.parse(str);
      const blocks = db.getBlocks();
      expect(blocks.length).toBe(2);
      expect(blocks[0].ID).toBe('id');
      expect(blocks[0].label).toBe('A label');
      expect(blocks[0].type).toBe('square');
      expect(blocks[1].ID).toBe('id2');
      expect(blocks[1].label).toBe('id2');
      expect(blocks[1].type).toBe('square');
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
            aBlock["Block"]
            bBlock["Block"]
          end
        `;

      block.parse(str);
      const blocks = db.getBlocks();
      console.log('blocks', blocks);
      expect(blocks.length).toBe(1);
      expect(blocks[0].children.length).toBe(2);
      expect(blocks[0].id).toBe('id');
      expect(blocks[0].label).toBe('A label');
      expect(blocks[0].type).toBe('square');
      // expect(blocks[1].ID).toBe('id2');
      // expect(blocks[1].label).toBe('id2');
      // expect(blocks[1].type).toBe('square');
    });
    it.only('compound blocks', async () => {
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

      const aBlockPos = blocks[0].children[0];
      const bBlockPos = blocks[0].children[1].children[0];

      const root = db.getNodeById(blocks[0].id);
      expect(blocks.length).toBe(1);
      expect(blocks[0].id).not.toBe(undefined);
      expect(root?.label).toBe(blocks[0].id);
      expect(blocks[0].children.length).toBe(2);
      expect(root?.type).toBe('composite');

      const aBlock = db.getNodeById(aBlockPos.id);
      console.log('aBlock', aBlock);
      expect(aBlock?.label).toBe('ABlock');
      expect(aBlock?.type).toBe('square');

      const bBlock = db.getNodeById(bBlockPos.id);

      expect(bBlock.id).toBe('bBlock');
      expect(bBlock.label).toBe('BBlock');
      expect(bBlock.type).toBe('square');
    });
    it.skip('compound blocks with title', async () => {
      const str = `block
          block compoundBlock["Compound block"]
            columns 1
            block2["Block 1"]
          end
        `;

      block.parse(str);
    });
    it.skip('blocks mixed with compound blocks', async () => {
      const str = `block
          columns 1
          block1["Block 1"]

          block
            columns 2
            block2["Block 2"]
            block3["Block 3"]
          end
        `;

      block.parse(str);
    });

    it.skip('Arrow blocks', async () => {
      const str = `block
        columns 3
        block1["Block 1"]
        blockArrow
        block2["Block 2"]`;

      block.parse(str);
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
    it.skip('blocks with different widths', async () => {
      const str = `block-beta
        columns 3
        one["One Slot"]
        two["Two slots"]:2
        `;

      block.parse(str);
    });
    it.skip('empty blocks', async () => {
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
