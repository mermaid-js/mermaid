import { imgSnapshotTest } from '../../../helpers/util.ts';

const themes = [
  'neo',
  'neo-dark',
  'redux',
  'redux-dark',
  'redux-color',
  'redux-dark-color',
] as const;

const comprehensiveMindmap = `mindmap
  root((All Shapes))
    Square Branch
      sq[Square Node]
        sq1[Nested Square]
        sq2[Another Square]
    Rounded Branch
      rd(Rounded Node)
        rd1(Nested Rounded)
        rd2(Another Rounded)
    Circle Branch
      ci((Circle Node))
        ci1((Nested Circle))
        ci2((Another Circle))
    Bang Branch
      bg))Bang Node((
        bg1))Nested Bang((
        bg2))Another Bang((
    Cloud Branch
      cl)Cloud Node(
        cl1)Nested Cloud(
        cl2)Another Cloud(
    Hexagon Branch
      hx{{Hexagon Node}}
        hx1{{Nested Hexagon}}
        hx2{{Another Hexagon}}
    Default Branch
      df Default Node
        df1 Nested Default
        df2 Another Default
`;

themes.forEach((theme) => {
  describe(`Mindmap neo look — all shapes — ${theme} theme`, () => {
    it('renders all shapes in a single comprehensive diagram', () => {
      imgSnapshotTest(comprehensiveMindmap, { look: 'neo', theme });
    });
  });
});
