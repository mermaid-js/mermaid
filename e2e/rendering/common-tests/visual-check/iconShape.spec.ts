import { registerIconShapeTests } from '../../../helpers/iconShapeTests.ts';
import { renderShared, test } from '../../../helpers/workerPage.ts';

// Base form (no explicit `form`). The square/circle/rounded slices of the same
// matrix live in sibling iconShape-<form>.spec.ts files so the whole matrix is
// not one ~250s spec (the heaviest in the suite). See iconShapeTests.ts.
registerIconShapeTests([undefined]);

test.describe('Test iconShape with different h', () => {
  test('with different h', async ({ workerPage, browser }, testInfo) => {
    let flowchartCode = `flowchart TB\n`;
    const icon = 'fa:bell';
    const iconHeight = 64;
    flowchartCode += `  nA --> nAA@{ icon: '${icon}', label: 'icon with different h', h: ${iconHeight} }\n`;
    await renderShared(workerPage, browser, testInfo, flowchartCode);
  });
});

test.describe('Test colored iconShape', () => {
  test('with no styles', async ({ workerPage, browser }, testInfo) => {
    let flowchartCode = `flowchart TB\n`;
    const icon = 'fluent-emoji:tropical-fish';
    flowchartCode += `  nA --> nAA@{ icon: '${icon}', form: 'square', label: 'icon with color' }\n`;
    await renderShared(workerPage, browser, testInfo, flowchartCode);
  });

  test('with styles', async ({ workerPage, browser }, testInfo) => {
    let flowchartCode = `flowchart TB\n`;
    const icon = 'fluent-emoji:tropical-fish';
    flowchartCode += `  nA --> nAA@{ icon: '${icon}', form: 'square', label: 'icon with color' }\n`;
    flowchartCode += `  style nAA fill:#f9f,stroke:#333,stroke-width:4px \n`;
    await renderShared(workerPage, browser, testInfo, flowchartCode);
  });
});
