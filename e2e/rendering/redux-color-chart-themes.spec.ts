import { test } from '@playwright/test';
import { imgSnapshotTest } from '../helpers/util.ts';

/**
 * pie, gantt, user-journey and state are the diagrams whose palettes the redux colour
 * themes actually change, and until now none of them were rendered under those themes
 * anywhere in the suite. The existing redux/neo theme specs cover er, gitGraph, mindmap,
 * requirement, sequence and timeline — so the diagrams with the largest visual delta had
 * no safety net, which is how the original fork-and-drift went unnoticed.
 *
 * Unlike `sequenceDiagram-redux-themes.spec.ts` these run under the default `classic`
 * look: none of the four is neo-specific, and the palette wiring under test is
 * look-independent.
 */
const reduxThemes = ['redux', 'redux-color', 'redux-dark', 'redux-dark-color'] as const;

/** Twelve slices, so the whole categorical scale is exercised and wrap-around is visible. */
const pieDiagram = `
  pie title Slice palette
    "Alpha" : 20
    "Bravo" : 16
    "Charlie" : 14
    "Delta" : 12
    "Echo" : 10
    "Foxtrot" : 8
    "Golf" : 7
    "Hotel" : 6
    "India" : 3
    "Juliett" : 2
    "Kilo" : 1
    "Lima" : 1
`;

/**
 * Four sections, because gantt cycles four band classes: `.section0` takes
 * `sectionBkgColor`, `.section1` and `.section3` take `altSectionBkgColor`, and
 * `.section2` takes `sectionBkgColor2`. Three sections would cover `altSectionBkgColor`
 * only once and hide that it is half of every gantt's banding. Also exercises the active,
 * done and crit task states, which read separate variables.
 */
const ganttDiagram = `
  gantt
    title Section banding
    dateFormat YYYY-MM-DD
    section Discovery
      Interviews      :done, a1, 2024-01-01, 12d
      Synthesis       :active, a2, after a1, 8d
    section Design
      Wireframes      :b1, 2024-01-10, 10d
      Review          :crit, b2, after b1, 6d
    section Build
      Backend         :c1, 2024-01-20, 14d
      Frontend        :c2, after c1, 12d
    section Launch
      Beta            :d1, 2024-02-10, 8d
`;

/** Eight sections, so all of fillType0..7 are exercised rather than just the first few. */
const journeyDiagram = `
  journey
    title Task and section fills
    section Browse
      Land on site: 5: Visitor
      Search: 3: Visitor
    section Cart
      Add item: 4: Visitor
      View cart: 3: Visitor
    section Pay
      Enter card: 2: Visitor
      Confirm: 5: Visitor
    section Fulfil
      Pack: 4: Warehouse
      Ship: 3: Warehouse
    section Deliver
      Handover: 5: Courier
    section Support
      Contact: 2: Visitor
    section Return
      Request: 1: Visitor
    section Close
      Archive: 4: Visitor
`;

/**
 * Composite states and transition labels, which is what exercises
 * `compositeTitleBackground`, `altBackground` and `stateEdgeLabelBackground` — the three
 * variables that were missing or untuned in the colour themes.
 */
const stateDiagram = `
  stateDiagram-v2
    [*] --> Idle
    Idle --> Working: start
    state Working {
      [*] --> Fetching
      Fetching --> Parsing: bytes ready
      Parsing --> [*]
    }
    Working --> Idle: done
    Working --> Failed: error
    Failed --> Idle: retry
    Failed --> [*]
`;

const diagrams = {
  pie: pieDiagram,
  gantt: ganttDiagram,
  'user-journey': journeyDiagram,
  state: stateDiagram,
} as const;

test.describe('Chart diagrams - Redux colour themes', () => {
  for (const theme of reduxThemes) {
    test.describe(`Theme: ${theme}`, () => {
      for (const [name, diagram] of Object.entries(diagrams)) {
        test(`should render ${name} with the theme palette`, async ({ page }, testInfo) => {
          await imgSnapshotTest(page, testInfo, diagram, { theme });
        });
      }
    });
  }
});
