import { expect, test } from '@playwright/test';
import { diagramSvg, imgSnapshotTest } from '../../helpers/util.ts';

test.describe('C4 characterization', () => {
  test('CHAR.update-element-shape should apply supported shape overrides', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `C4Container
title UpdateElementStyle shape override (folder not yet supported)
Container(a, "Default", "Tech", "no override")
Container(b, "As Folder", "Tech", "shape override")
Container(c, "As Cylinder", "Tech", "shape override")
UpdateElementStyle(b, $shape="folder")
UpdateElementStyle(c, $shape="cylinder")
      `
    );

    const svg = diagramSvg(page);
    await expect(svg.locator('.node path')).toHaveCount(1);
    await expect(svg.locator('.node > rect')).toHaveCount(2);
  });

  for (const shapesInRow of [2, 4]) {
    test(`CHAR.update-layout-config should render ${shapesInRow} shapes per row`, async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `C4Context
title UpdateLayoutConfig ($c4ShapeInRow=${shapesInRow})
System(a, "A")
System(b, "B")
System(c, "C")
System(d, "D")
UpdateLayoutConfig($c4ShapeInRow="${shapesInRow}", $c4BoundaryInRow="1")
        `
      );
    });
  }

  test('CHAR.tags should accept but not render $tags', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `C4Context
title Tags attribute (not shown by current renderer)
Person(p, "Person", "desc", $tags="v1.0")
System(s, "System", "desc", $tags="v1.0")
Rel(p, s, "Uses")
      `
    );

    await expect(diagramSvg(page)).not.toContainText('v1.0');
  });

  test('CHAR.link should accept but not render $link', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `C4Context
title Link attribute (not shown by current renderer)
Person(p, "Person", "desc", $link="https://example.com")
System(s, "System", "desc")
Rel(p, s, "Uses")
      `
    );

    await expect(diagramSvg(page).locator('a')).toHaveCount(0);
  });

  test('CHAR.sprite should accept but not render $sprite', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `C4Container
title Sprite attribute (not shown by current renderer)
Container(a, "Browser", "Tech", "single-page app", $sprite="browser")
Container(b, "Terminal", "Tech", "server-side app", $sprite="terminal")
      `
    );

    const svg = diagramSvg(page);
    await expect(svg.locator('image')).toHaveCount(0);
    await expect(svg.locator('svg')).toHaveCount(0);
    await expect(svg.locator('.node > rect')).toHaveCount(2);
  });

  test('CHAR.show-stereotypes should hide every stereotype when turned off', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `C4Context
title Stereotypes hidden
Enterprise_Boundary(b1, "Bank") {
Person(p, "Person", "desc")
System(s, "System", "desc")
}
Rel(p, s, "Uses")
      `,
      { c4: { showStereotypes: false } }
    );

    const svg = diagramSvg(page);
    await expect(svg).not.toContainText('[Person]');
    await expect(svg).not.toContainText('[Software System]');
    await expect(svg).not.toContainText('[ENTERPRISE]');
    // The names and descriptions still lay out; only the type line goes.
    await expect(svg).toContainText('Person');
    await expect(svg).toContainText('desc');
  });

  test('CHAR.show-stereotypes should let one element opt out', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `C4Context
title One element opts out of its stereotype
System(a, "Shown", "desc")
System(b, "Hidden", "desc")
UpdateElementStyle(b, $showStereotype="false")
      `
    );

    const svg = diagramSvg(page);
    await expect(svg.locator('.c4-shape .c4-type')).toHaveCount(1);
    await expect(svg).toContainText('[Software System]');
  });

  test('CHAR.descr-wrapping should use wrapped SVG text', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `C4Context
title Description wrapping
Person(p, "Person", "A customer of the bank with personal bank accounts and a long description that should wrap across multiple lines")
System(s, "System", "Allows customers to view information about their bank accounts and make payments")
Rel(p, s, "Uses")
      `,
      { wrap: true }
    );

    const svg = diagramSvg(page);
    await expect(svg.locator('.node foreignObject')).toHaveCount(0);

    const descriptions = svg.locator('.node .c4-descr');
    await expect(descriptions).toHaveCount(2);

    const wrappedLines = descriptions.first().locator('tspan.text-outer-tspan');
    expect(await wrappedLines.count()).toBeGreaterThan(1);
    await expect(wrappedLines.first()).toContainText('A customer');
  });
});
