import { findCommonAncestor } from './render-utils';
describe('when rendering a flowchart using elk ', function () {
  let lookupDb;
  beforeEach(function () {
    /**
     * root:
     *   B1
     *   outer
     *     B6
     *   Ugge
     *     B2
     *     B3
     *     inner
     *       B4
     *       B5
     *     inner2
     *       C4
     *       C5
     */
    lookupDb = JSON.parse(
      '{"parentById":{"B4":"inner","B5":"inner","C4":"inner2","C5":"inner2","B2":"Ugge","B3":"Ugge","inner":"Ugge","inner2":"Ugge","B6":"outer"},"childrenById":{"inner":["B4","B5"],"inner2":["C4","C5"],"Ugge":["B2","B3","inner","inner2"],"outer":["B6"]}}'
    );
  });
  it('Sieblings in a subgraph', function () {
    expect(findCommonAncestor('B4', 'B5', lookupDb)).toBe('inner');
  });
  it('Find an uncle', function () {
    expect(findCommonAncestor('B4', 'B2', lookupDb)).toBe('Ugge');
  });
  it('Find a cousin', function () {
    expect(findCommonAncestor('B4', 'C4', lookupDb)).toBe('Ugge');
  });
  it('Find a grandparent', function () {
    expect(findCommonAncestor('B4', 'B6', lookupDb)).toBe('root');
  });
  it('Sieblings in the root', function () {
    expect(findCommonAncestor('B1', 'outer', lookupDb)).toBe('root');
  });
});
