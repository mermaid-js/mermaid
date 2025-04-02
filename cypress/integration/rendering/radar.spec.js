import { imgSnapshotTest } from '../../helpers/util';

describe('radar structure', () => {
  it('should render a simple radar diagram', () => {
    imgSnapshotTest(
      `radar-beta
                title Best Radar Ever
                axis A, B, C
                curve c1{1, 2, 3}
            `
    );
  });

  it('should render a radar diagram with multiple curves', () => {
    imgSnapshotTest(
      `radar-beta
                title Best Radar Ever
                axis A, B, C
                curve c1{1, 2, 3}
                curve c2{2, 3, 1}
            `
    );
  });

  it('should render a complex radar diagram', () => {
    imgSnapshotTest(
      `radar-beta 
                title My favorite ninjas
                axis Agility, Speed, Strength
                axis Stam["Stamina"] , Intel["Intelligence"]

                curve Ninja1["Naruto Uzumaki"]{
                    Agility 2, Speed 2,
                    Strength 3, Stam 5,
                    Intel 0
                }
                curve Ninja2["Sasuke"]{2, 3, 4, 1, 5}
                curve Ninja3 {3, 2, 1, 5, 4}

                showLegend true
                ticks 3
                max 8
                min 0
                graticule polygon
            `
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.length(1);
    });
  });

  it('should render radar diagram with config override', () => {
    imgSnapshotTest(
      `radar-beta
                title Best Radar Ever
                axis A,B,C
                curve mycurve{1,2,3}`,
      { radar: { marginTop: 100, axisScaleFactor: 0.5 } }
    );
  });

  it('should parse radar diagram with theme override', () => {
    imgSnapshotTest(
      `radar-beta
                axis A,B,C
                curve mycurve{1,2,3}`,
      { theme: 'base', themeVariables: { fontSize: 80, cScale0: '#FF0000' } }
    );
  });

  it('should handle radar diagram with radar style override', () => {
    imgSnapshotTest(
      `radar-beta
                axis A,B,C
                curve mycurve{1,2,3}`,
      { theme: 'base', themeVariables: { radar: { axisColor: '#FF0000' } } }
    );
  });
});
