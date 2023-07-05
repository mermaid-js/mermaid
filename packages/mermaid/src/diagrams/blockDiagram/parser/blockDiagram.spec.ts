// @ts-ignore: jison doesn't export types
import blockDiagram from './blockDiagram.jison';
import db from '../blockDB.js';
import { cleanupComments } from '../../../diagram-api/comments.js';
import { prepareTextForParsing } from '../blockDiagramUtils.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Sankey diagram', function () {
  describe('when parsing an block diagram graph it should handle > ', function () {
    beforeEach(function () {
      blockDiagram.parser.yy = db;
      blockDiagram.parser.yy.clear();
      blockDiagram.parser.yy.getLogger = () => console;
    });

    it('a diagram with a node', async () => {
      const str = `blockDiagram-beta
          id
      `;

      blockDiagram.parse(str);
    });
    it('a diagram with multiple nodes', async () => {
      const str = `blockDiagram-beta
          id1
          id2
      `;

      blockDiagram.parse(str);
    });
    it('a node with a square shape and a label', async () => {
      const str = `blockDiagram-beta
          id["A label"]
          id2`;

      blockDiagram.parse(str);
    });
    it('a diagram with multiple nodes with edges', async () => {
      const str = `blockDiagram-beta
          id1["first"]  -->   id2["second"]
      `;

      blockDiagram.parse(str);
    });
    // it('a diagram with column statements', async () => {
    //   const str = `blockDiagram-beta
    //       columns 1
    //       block1["Block 1"]
    //   `;

    //   blockDiagram.parse(str);
    // });
    // it('a diagram with block hierarchies', async () => {
    //   const str = `blockDiagram-beta
    //     columns 1
    //     block1[Block 1]

    //     block
    //       columns 2
    //       block2[Block 2]
    //       block3[Block 3]
    //     end %% End the compound block
    //   `;

    //   blockDiagram.parse(str);
    // });
    // it('a diagram with differernt column values in different blocks', async () => {
    //   const str = `blockDiagram-beta
    //     columns 1
    //     block1[Block 1]

    //     block
    //       columns 2
    //       block2[Block 2]
    //       block3[Block 3]
    //     end %% End the compound block
    //   `;

    //   blockDiagram.parse(str);

    //   // Todo check that the different blocks have different column values
    // });
  });
});
