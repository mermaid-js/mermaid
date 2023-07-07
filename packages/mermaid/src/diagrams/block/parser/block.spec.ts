// @ts-ignore: jison doesn't export types
import block from './block.jison';
import db from '../blockDB.js';
import { cleanupComments } from '../../../diagram-api/comments.js';
import { prepareTextForParsing } from '../blockUtils.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Sankey diagram', function () {
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
    });
    it('a diagram with multiple nodes', async () => {
      const str = `block-beta
          id1
          id2
      `;

      block.parse(str);
    });
    it('a node with a square shape and a label', async () => {
      const str = `block-beta
          id["A label"]
          id2`;

      block.parse(str);
    });
    it('a diagram with multiple nodes with edges', async () => {
      const str = `block-beta
          id1["first"]  -->   id2["second"]
      `;

      block.parse(str);
    });
    // it('a diagram with column statements', async () => {
    //   const str = `block-beta
    //       columns 1
    //       block1["Block 1"]
    //   `;

    //   block.parse(str);
    // });
    // it('a diagram with block hierarchies', async () => {
    //   const str = `block-beta
    //     columns 1
    //     block1[Block 1]

    //     block
    //       columns 2
    //       block2[Block 2]
    //       block3[Block 3]
    //     end %% End the compound block
    //   `;

    //   block.parse(str);
    // });
    // it('a diagram with differernt column values in different blocks', async () => {
    //   const str = `block-beta
    //     columns 1
    //     block1[Block 1]

    //     block
    //       columns 2
    //       block2[Block 2]
    //       block3[Block 3]
    //     end %% End the compound block
    //   `;

    //   block.parse(str);

    //   // Todo check that the different blocks have different column values
    // });
  });
});
