import { findCommonAncestor, TreeData } from './render-utils';
describe('when rendering a flowchart using elk ', () => {
  let lookupDb: TreeData;
  beforeEach(() => {
    lookupDb = {
      parentById: {
        B4: 'inner',
        B5: 'inner',
        C4: 'inner2',
        C5: 'inner2',
        B2: 'Ugge',
        B3: 'Ugge',
        inner: 'Ugge',
        inner2: 'Ugge',
        B6: 'outer',
      },
      childrenById: {
        inner: ['B4', 'B5'],
        inner2: ['C4', 'C5'],
        Ugge: ['B2', 'B3', 'inner', 'inner2'],
        outer: ['B6'],
      },
    };
  });
  it('to find parent of siblings in a subgraph', () => {
    expect(findCommonAncestor('B4', 'B5', lookupDb)).toBe('inner');
  });
  it('to find an uncle', () => {
    expect(findCommonAncestor('B4', 'B2', lookupDb)).toBe('Ugge');
  });
  it('to find a cousin', () => {
    expect(findCommonAncestor('B4', 'C4', lookupDb)).toBe('Ugge');
  });
  it('to find a grandparent', () => {
    expect(findCommonAncestor('B4', 'B6', lookupDb)).toBe('root');
  });
  it('to find ancestor of siblings in the root', () => {
    expect(findCommonAncestor('B1', 'outer', lookupDb)).toBe('root');
  });
});
