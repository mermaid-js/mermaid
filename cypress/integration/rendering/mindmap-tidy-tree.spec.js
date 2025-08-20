import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Mindmap Tidy Tree', () => {
  it('1-tidy-tree: should render a simple mindmap without children', () => {
    imgSnapshotTest(
      `
      mindmap
      root((mindmap))
        A
        B
      `
    );
  });
  it('2-tidy-tree: should render a simple mindmap', () => {
    imgSnapshotTest(
      `
      mindmap
      root((mindmap is a long thing))
        A
        B
        C
        D
      `
    );
  });
  it('3-tidy-tree: should render a  mindmap with different shapes', () => {
    imgSnapshotTest(
      `
      mindmap
      root((mindmap))
        Origins
          Long history
          ::icon(fa fa-book)
          Popularisation
            British popular psychology author Tony Buzan
        Research
          On effectiveness&lt;br/>and features
          On Automatic creation
            Uses
                Creative techniques
                Strategic planning
                Argument mapping
        Tools
              id)I am a cloud(
                  id))I am a bang((
                    Tools
      `
    );
  });
  it('4-tidy-tree: should render a mindmap with children', () => {
    imgSnapshotTest(
      `
       mindmap
      ((This is a mindmap))
        child1
         grandchild 1
         grandchild 2
        child2
         grandchild 3
         grandchild 4
        child3
         grandchild 5
         grandchild 6
      `
    );
  });
});
