import { test, expect, type Locator } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

// Characterization tests for C4 that assert rendered DOM in addition to a
// snapshot. Pure-snapshot C4 characterization cases live as .mmd fixtures under
// e2e/diagrams/c4/characterization/; these stay here because they make
// assertions imgSnapshotTest fixtures can't express.
test.describe('C4 characterization', () => {
  test.describe('styling and layout macros', () => {
    test('CHAR.update-element-shape should accept the $shape override (ignored by renderer)', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `C4Container
title UpdateElementStyle shape override (ignored by renderer)
Container(a, "Default", "Tech", "no override")
Container(b, "As Folder", "Tech", "shape override")
Container(c, "As Cylinder", "Tech", "shape override")
UpdateElementStyle(b, $shape="folder")
UpdateElementStyle(c, $shape="cylinder")
`,
        {},
        undefined,
        async (svg: Locator) => {
          // $shape is currently ignored: every container still renders as a rect.
          await expect(svg.locator('rect')).toHaveCount(3);
        }
      );
    });
  });

  test.describe('element attributes', () => {
    test('CHAR.tags should accept $tags on elements (not yet supported by renderer)', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `C4Context
title Tags attribute (not shown by current renderer)
Person(p, "Person", "desc", $tags="v1.0")
System(s, "System", "desc", $tags="v1.0")
Rel(p, s, "Uses")
`,
        {},
        undefined,
        async (svg: Locator) => {
          await expect(svg).not.toContainText('v1.0');
        }
      );
    });

    test('CHAR.link should accept $link on elements (not yet supported by renderer)', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `C4Context
title Link attribute (not shown by current renderer)
Person(p, "Person", "desc", $link="https://example.com")
System(s, "System", "desc")
Rel(p, s, "Uses")
`,
        {},
        undefined,
        async (svg: Locator) => {
          await expect(svg.locator('a')).toHaveCount(0);
        }
      );
    });

    test('CHAR.sprite should accept the $sprite attribute (not yet supported by renderer)', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `C4Container
title Sprite attribute (not shown by current renderer)
Container(a, "Browser", "Tech", "single-page app", $sprite="browser")
Container(b, "Terminal", "Tech", "server-side app", $sprite="terminal")
`,
        {},
        undefined,
        async (svg: Locator) => {
          await expect(svg.locator('rect')).toHaveCount(2);
          await expect(svg.locator('image')).toHaveCount(0);
          await expect(svg.locator('svg')).toHaveCount(0);
        }
      );
    });

    test('CHAR.descr-wrapping should not wrap long descriptions (wrap is currently a no-op, see #7949)', async ({
      page,
    }, testInfo) => {
      const longDescr =
        'A customer of the bank with personal bank accounts and a long description that should wrap across multiple lines';
      const otherDescr =
        'Allows customers to view information about their bank accounts and make payments';
      await imgSnapshotTest(
        page,
        testInfo,
        `C4Context
title Description wrapping (currently a no-op)
Person(p, "Person", "${longDescr}")
System(s, "System", "${otherDescr}")
Rel(p, s, "Uses")
`,
        {},
        undefined,
        async (svg: Locator) => {
          // wrap is a no-op: each full description stays in a single tspan.
          await expect(svg.locator('tspan', { hasText: longDescr })).toHaveCount(1);
          await expect(svg.locator('tspan', { hasText: otherDescr })).toHaveCount(1);
        }
      );
    });
  });
});
