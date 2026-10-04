import { test, expect, type Locator } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

/**
 * Check whether the SVG Element has an Event Modeling root.
 *
 * @param svg - The diagram SVG locator to check.
 */
async function shouldHaveRoot(svg: Locator) {
  await expect(svg).toHaveJSProperty('nodeName', 'svg');

  expect(await svg.locator('.em-box').count()).toBeGreaterThanOrEqual(1);
}

test.describe('Event Modeling Diagram', () => {
  test('renders a state view pattern', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem
tf 03 evt ItemAdded
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('renders a state change pattern', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem
tf 03 evt ItemAdded
tf 04 cmd RemoveItem
tf 05 evt ItemRemoved
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('renders a translation pattern', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem
tf 03 evt ItemAdded
tf 04 rmo CartItems ->> 03
tf 05 evt AccountingItemAdded
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('renders with data block reference', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem { productId: 7 }
tf 03 evt ItemAdded [[ItemAddedData]]

data ItemAddedData
{
  productId: 7,
  quantity: 1
}
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('renders with qualified names', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd Inventory.AddItem
tf 03 evt Inventory.ItemAdded
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  test('renders with multiple source relations', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem
tf 03 cmd RemoveItem
tf 04 evt ItemChanged ->> 02 ->> 03
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
});
