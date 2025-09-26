// @ts-ignore: jison doesn't export types
import block from './parser/block.jison';
import db from './blockDB.js';
import { layout, calculateBlockPosition } from './layout.js';

const setupParser = () => {
  block.parser.yy = db;
  block.parser.yy.clear();
  block.parser.yy.getLogger = () => console;
};

describe('Layout', function () {
  beforeEach(() => {
    setupParser();
  });

  it('should calculate position correctly', () => {
    expect(calculateBlockPosition(2, 0)).toEqual({ px: 0, py: 0 });
    expect(calculateBlockPosition(2, 1)).toEqual({ px: 1, py: 0 });
    expect(calculateBlockPosition(2, 2)).toEqual({ px: 0, py: 1 });
    expect(calculateBlockPosition(2, 3)).toEqual({ px: 1, py: 1 });
    expect(calculateBlockPosition(2, 4)).toEqual({ px: 0, py: 2 });
    expect(calculateBlockPosition(1, 3)).toEqual({ px: 0, py: 3 });
  });

  it('spreads nodes according to widthInColumns', () => {
    const definition = `block-beta
  columns 3
  block:bucket:2
    columns 2
    nodeA[("alpha")]:1
    assertBase{{"beta"}}:1
    nodeC["gamma"]:1
    nodeD["delta"]:1
    assertDouble:2
  end
  outerSingle:1

  assertTriple["epsilon"]:3

outerSingle-->assertBase
`;

    block.parse(definition);

    const presetIds = [
      'nodeA',
      'assertBase',
      'nodeC',
      'nodeD',
      'assertDouble',
      'outerSingle',
      'assertTriple',
    ];
    for (const id of presetIds) {
      const node = db.getBlock(id);
      if (node) {
        node.size = { width: 12, height: 10, x: 0, y: 0 };
        db.setBlock(node);
      }
    }

    layout(db);

    const getBlockWidth = (id: string) => db.getBlock(id)?.size?.width ?? 0;
    const baseWidth = getBlockWidth('assertBase');
    const doubleWidth = getBlockWidth('assertDouble');
    const tripleWidth = getBlockWidth('assertTriple');

    expect(baseWidth).toBeGreaterThan(0);
    expect(doubleWidth).toBeGreaterThan(baseWidth * 1.9);
    expect(tripleWidth).toBeGreaterThan(baseWidth * 2.9);
  });
});
