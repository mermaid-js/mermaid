import { imgSnapshotTest } from '../../helpers/util';
import { registerIconShapeTests } from '../../helpers/iconShapeTests';

// Base form (no explicit `form`). The square/circle/rounded slices of the same
// matrix live in sibling iconShape-<form>.spec.ts files so the whole matrix is
// not one ~250s spec (the heaviest in the suite). See iconShapeTests.ts.
registerIconShapeTests([undefined]);

describe('Test iconShape with different h', () => {
  it('with different h', () => {
    let flowchartCode = `flowchart TB\n`;
    const icon = 'fa:bell';
    const iconHeight = 64;
    flowchartCode += `  nA --> nAA@{ icon: '${icon}', label: 'icon with different h', h: ${iconHeight} }\n`;
    imgSnapshotTest(flowchartCode);
  });
});

describe('Test colored iconShape', () => {
  it('with no styles', () => {
    let flowchartCode = `flowchart TB\n`;
    const icon = 'fluent-emoji:tropical-fish';
    flowchartCode += `  nA --> nAA@{ icon: '${icon}', form: 'square', label: 'icon with color' }\n`;
    imgSnapshotTest(flowchartCode);
  });

  it('with styles', () => {
    let flowchartCode = `flowchart TB\n`;
    const icon = 'fluent-emoji:tropical-fish';
    flowchartCode += `  nA --> nAA@{ icon: '${icon}', form: 'square', label: 'icon with color' }\n`;
    flowchartCode += `  style nAA fill:#f9f,stroke:#333,stroke-width:4px \n`;
    imgSnapshotTest(flowchartCode);
  });
});
