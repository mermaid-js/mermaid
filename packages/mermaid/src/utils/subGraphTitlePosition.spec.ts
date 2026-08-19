import { getSubGraphTitlePosition, type SubGraphTitleRect } from './subGraphTitlePosition.js';

const cluster: SubGraphTitleRect = { x: 0, y: 0, width: 100, height: 80 };
const label = { width: 20, height: 10 };
const allCandidateRects: SubGraphTitleRect[] = [
  { x: 40, y: 0, width: 20, height: 10 },
  { x: 0, y: 0, width: 20, height: 10 },
  { x: 40, y: 70, width: 20, height: 10 },
  { x: 0, y: 70, width: 20, height: 10 },
  { x: 80, y: 0, width: 20, height: 10 },
  { x: 80, y: 70, width: 20, height: 10 },
];

describe('getSubGraphTitlePosition', () => {
  it('uses top as the first auto position', () => {
    expect(getSubGraphTitlePosition({ cluster, label })).toEqual(allCandidateRects[0]);
  });

  it('tries the configured auto order before falling back to top', () => {
    expect(
      getSubGraphTitlePosition({ cluster, label, occupiedRects: allCandidateRects.slice(0, 1) })
    ).toEqual(allCandidateRects[1]);
    expect(
      getSubGraphTitlePosition({ cluster, label, occupiedRects: allCandidateRects.slice(0, 2) })
    ).toEqual(allCandidateRects[2]);
    expect(
      getSubGraphTitlePosition({ cluster, label, occupiedRects: allCandidateRects.slice(0, 3) })
    ).toEqual(allCandidateRects[3]);
    expect(
      getSubGraphTitlePosition({ cluster, label, occupiedRects: allCandidateRects.slice(0, 4) })
    ).toEqual(allCandidateRects[4]);
    expect(
      getSubGraphTitlePosition({ cluster, label, occupiedRects: allCandidateRects.slice(0, 5) })
    ).toEqual(allCandidateRects[5]);
    expect(getSubGraphTitlePosition({ cluster, label, occupiedRects: allCandidateRects })).toEqual(
      allCandidateRects[0]
    );
  });

  it('applies title margins to top and bottom candidates', () => {
    expect(
      getSubGraphTitlePosition({
        cluster,
        label,
        position: 'bottom-left',
        topMargin: 5,
        bottomMargin: 7,
      })
    ).toEqual({ x: 0, y: 63, width: 20, height: 10 });
  });
});
