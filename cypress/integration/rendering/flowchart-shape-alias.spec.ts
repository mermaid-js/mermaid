import { imgSnapshotTest } from '../../helpers/util.ts';

const aliasSet1 = ['process', 'rect', 'proc', 'rectangle'] as const;

const aliasSet2 = ['event', 'rounded'] as const;

const aliasSet3 = ['stadium', 'pill', 'term'] as const;

const aliasSet4 = ['fr', 'subproc', 'framed-rectangle', 'subroutine'] as const;

const aliasSet5 = ['db', 'cylinder', 'cyl'] as const;

const aliasSet6 = ['diam', 'decision', 'diamond'] as const;

const aliasSet7 = ['hex', 'hexagon', 'prepare'] as const;

const aliasSet8 = ['l-r', 'lean-right', 'in-out'] as const;

const aliasSet9 = ['l-l', 'lean-left', 'out-in'] as const;

const aliasSet10 = ['trap-b', 'trapezoid-bottom', 'priority', 'trapezoid'] as const;

const aliasSet11 = ['trap-t', 'trapezoid-top', 'manual', 'inv-trapezoid'] as const;

const aliasSet12 = ['dc', 'double-circle'] as const;

const aliasSet13 = ['notched-rect', 'card', 'notch-rect'] as const;

const aliasSet14 = ['lined-rect', 'lined-proc', 'shaded-proc'] as const;

const aliasSet15 = ['sm-circ', 'small-circle', 'start'] as const;

const aliasSet16 = ['framed-circle', 'stop'] as const;

const aliasSet17 = ['fork', 'join', 'long-rect'] as const;

const aliasSet18 = ['brace', 'comment', 'brace-l'] as const;

const aliasSet19 = ['bolt', 'com-link', 'lightning-bolt'] as const;

const aliasSet20 = ['we-rect', 'doc', 'wave-edge-rect', 'wave-edged-rectangle'] as const;

const aliasSet21 = ['delay', 'half-rounded-rect'] as const;

const aliasSet22 = ['t-cyl', 'das', 'tilted-cylinder'] as const;

const aliasSet23 = ['l-cyl', 'disk', 'lined-cylinder'] as const;

const aliasSet24 = ['cur-trap', 'disp', 'display', 'curved-trapezoid'] as const;

const aliasSet25 = ['div-rect', 'div-proc', 'divided-rectangle'] as const;

const aliasSet26 = ['sm-tri', 'extract', 'small-triangle', 'triangle'] as const;

const aliasSet27 = ['win-pane', 'internal-storage', 'window-pane'] as const;

const aliasSet28 = ['fc', 'junction', 'filled-circle'] as const;

const aliasSet29 = ['lin-we-rect', 'lin-doc', 'lined-wave-edged-rect'] as const;

const aliasSet30 = ['notch-pent', 'loop-limit', 'notched-pentagon'] as const;

const aliasSet31 = ['flip-tri', 'manual-file', 'flipped-triangle'] as const;

const aliasSet32 = ['sloped-rect', 'manual-input', 'sloped-rectangle'] as const;

const aliasSet33 = ['mul-we-rect', 'mul-doc', 'multi-wave-edged-rectangle'] as const;

const aliasSet34 = ['mul-rect', 'mul-proc', 'multi-rect'] as const;

const aliasSet35 = ['flag', 'paper-tape'] as const;

const aliasSet36 = ['bt-rect', 'stored-data', 'bow-tie-rect'] as const;

const aliasSet37 = ['cross-circle', 'summary', 'crossed-circle'] as const;

const aliasSet38 = ['tag-we-rect', 'tag-doc', 'tagged-wave-edged-rectangle'] as const;

const aliasSet39 = ['tag-rect', 'tag-proc', 'tagged-rect'] as const;

// Aggregate all alias sets into a single array
const aliasSets = [
  aliasSet1,
  aliasSet2,
  aliasSet3,
  aliasSet4,
  aliasSet5,
  aliasSet6,
  aliasSet7,
  aliasSet8,
  aliasSet9,
  aliasSet10,
  aliasSet11,
  aliasSet12,
  aliasSet13,
  aliasSet14,
  aliasSet15,
  aliasSet16,
  aliasSet17,
  aliasSet18,
  aliasSet19,
  aliasSet20,
  aliasSet21,
  aliasSet22,
  aliasSet23,
  aliasSet24,
  aliasSet25,
  aliasSet26,
  aliasSet27,
  aliasSet28,
  aliasSet29,
  aliasSet30,
  aliasSet31,
  aliasSet32,
  aliasSet33,
  aliasSet34,
  aliasSet35,
  aliasSet36,
  aliasSet37,
  aliasSet38,
  aliasSet39,
] as const;

aliasSets.forEach((aliasSet) => {
  describe(`Test ${aliasSet.join(',')} `, () => {
    it(`All ${aliasSet.join(',')} should render same shape`, () => {
      let flowchartCode = `flowchart \n`;
      aliasSet.forEach((alias, index) => {
        flowchartCode += ` n${index}@{ shape: ${alias}, label: "${alias}" }@\n`;
      });
      imgSnapshotTest(flowchartCode);
    });
  });
});
