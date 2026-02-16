import { imgSnapshotTest } from '../../helpers/util.ts';

const aliasSet1 = ['process', 'rect', 'proc', 'rectangle'] as const;

const aliasSet2 = ['event', 'rounded'] as const;

const aliasSet3 = ['stadium', 'pill', 'terminal'] as const;

const aliasSet4 = ['fr-rect', 'subproc', 'subprocess', 'framed-rectangle', 'subroutine'] as const;

const aliasSet5 = ['db', 'database', 'cylinder', 'cyl'] as const;

const aliasSet6 = ['diam', 'decision', 'diamond'] as const;

const aliasSet7 = ['hex', 'hexagon', 'prepare'] as const;

const aliasSet8 = ['lean-r', 'lean-right', 'in-out'] as const;

const aliasSet9 = ['lean-l', 'lean-left', 'out-in'] as const;

const aliasSet10 = ['trap-b', 'trapezoid-bottom', 'priority'] as const;

const aliasSet11 = ['trap-t', 'trapezoid-top', 'manual'] as const;

const aliasSet12 = ['dbl-circ', 'double-circle'] as const;

const aliasSet13 = ['notched-rectangle', 'card', 'notch-rect'] as const;

const aliasSet14 = [
  'lin-rect',
  'lined-rectangle',
  'lin-proc',
  'lined-process',
  'shaded-process',
] as const;

const aliasSet15 = ['sm-circ', 'small-circle', 'start'] as const;

const aliasSet16 = ['fr-circ', 'framed-circle', 'stop'] as const;

const aliasSet17 = ['fork', 'join'] as const;
// brace-r', 'braces'
const aliasSet18 = ['comment', 'brace-l'] as const;

const aliasSet19 = ['bolt', 'com-link', 'lightning-bolt'] as const;

const aliasSet20 = ['doc', 'document'] as const;

const aliasSet21 = ['delay', 'half-rounded-rectangle'] as const;

const aliasSet22 = ['h-cyl', 'das', 'horizontal-cylinder'] as const;

const aliasSet23 = ['lin-cyl', 'disk', 'lined-cylinder'] as const;

const aliasSet24 = ['curv-trap', 'display', 'curved-trapezoid'] as const;

const aliasSet25 = ['div-rect', 'div-proc', 'divided-rectangle', 'divided-process'] as const;

const aliasSet26 = ['extract', 'tri', 'triangle'] as const;

const aliasSet27 = ['win-pane', 'internal-storage', 'window-pane'] as const;

const aliasSet28 = ['f-circ', 'junction', 'filled-circle'] as const;

const aliasSet29 = ['lin-doc', 'lined-document'] as const;

const aliasSet30 = ['notch-pent', 'loop-limit', 'notched-pentagon'] as const;

const aliasSet31 = ['flip-tri', 'manual-file', 'flipped-triangle'] as const;

const aliasSet32 = ['sl-rect', 'manual-input', 'sloped-rectangle'] as const;

const aliasSet33 = ['docs', 'documents', 'st-doc', 'stacked-document'] as const;

const aliasSet34 = ['procs', 'processes', 'st-rect', 'stacked-rectangle'] as const;

const aliasSet35 = ['flag', 'paper-tape'] as const;

const aliasSet36 = ['bow-rect', 'stored-data', 'bow-tie-rectangle'] as const;

const aliasSet37 = ['cross-circ', 'summary', 'crossed-circle'] as const;

const aliasSet38 = ['tag-doc', 'tagged-document'] as const;

const aliasSet39 = ['tag-rect', 'tag-proc', 'tagged-rectangle', 'tagged-process'] as const;

const aliasSet40 = ['collate', 'hourglass'] as const;

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
        flowchartCode += ` n${index}@{ shape: ${alias}, label: "${alias}" }\n`;
      });
      imgSnapshotTest(flowchartCode);
    });
  });
});
