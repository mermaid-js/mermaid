import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

/**
 * Composite states and concurrency regions take a per-container colour under the redux
 * colour themes. The unit tests cover the two halves separately -- `dataFetcher` hands out
 * the slots, `state/styles.js` emits the rules -- but only a render proves the stamped
 * `data-color-id` actually meets the emitted selector on the element, which is where a
 * container-shaped change is most likely to come apart: state composites are drawn by
 * `roundedWithTitle` and `divider` rather than by the plain `rect` cluster the other
 * diagrams use.
 *
 * The monochrome pair is included deliberately. `redux` and `redux-dark` carry no palette,
 * so they must stay exactly as they render today -- these snapshots are what would catch
 * the gate leaking colour into a theme that never asked for it.
 */
const reduxThemes = ['redux', 'redux-color', 'redux-dark', 'redux-dark-color'] as const;

/** Three depths plus a sibling, so a cycle that failed to advance would be obvious. */
const nested = `
  stateDiagram-v2
    [*] --> Boot
    state Boot {
      [*] --> Firmware
      state Kernel {
        [*] --> Sched
        state Drivers {
          [*] --> Probe
        }
      }
    }
    Boot --> Running
    state Running {
      [*] --> Serving
    }
    Running --> [*]
`;

/**
 * Three concurrency regions in one composite. Three rather than two: with two, a rule that
 * paired them by declaration order rather than by parent would still look right.
 */
const concurrency = `
  stateDiagram-v2
    [*] --> Active
    state Active {
      [*] --> NumOff
      NumOff --> NumOn
      --
      [*] --> CapsOff
      CapsOff --> CapsOn
      --
      [*] --> ScrollOff
      ScrollOff --> ScrollOn
    }
    Active --> [*]
`;

/**
 * The two rules pulling against each other in one diagram: the regions of `Concurrent`
 * must match each other, while `Machine`, `Concurrent`, `Finish` and `Deep` must all
 * differ.
 */
const regionsInsideNesting = `
  stateDiagram-v2
    state Machine {
      state Concurrent {
        [*] --> Left
        --
        [*] --> Right
      }
      Concurrent --> Finish
      state Finish {
        [*] --> Flush
        state Deep {
          [*] --> Done
        }
      }
    }
`;

/**
 * A composite the author has styled keeps its own colours and takes no palette slot at
 * all. Half-and-half is the failure this guards: a state `classDef` compiles to
 * `.name > * { ... }`, which reaches the body rect but not the title strip, so a composite
 * that stayed in the cycle would show the author's fill under a palette-coloured title.
 */
const userStyled = `
  stateDiagram-v2
    classDef pinned fill:#111827,stroke:#F59E0B,color:#F9FAFB
    state Outer {
      [*] --> Step
      state Pinned {
        [*] --> Held
      }
      state Plain {
        [*] --> Free
      }
    }
    class Pinned pinned
`;

const diagrams = {
  nested,
  concurrency,
  'regions inside nesting': regionsInsideNesting,
  'user-styled': userStyled,
} as const;

test.describe('State diagram - Redux colour theme composites', () => {
  for (const theme of reduxThemes) {
    test.describe(`Theme: ${theme}`, () => {
      for (const [name, diagram] of Object.entries(diagrams)) {
        test(`should render ${name} composite containers`, async ({ page }, testInfo) => {
          await imgSnapshotTest(page, testInfo, diagram, { theme });
        });
      }
    });
  }
});
