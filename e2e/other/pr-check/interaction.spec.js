import { test, expect } from '@playwright/test';

test.describe('Interaction', () => {
  test.describe('Security level loose', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/click_security_loose.html');
    });

    test('Graph: should handle a click on a node with a bound function', async ({ page }) => {
      await page.locator('.node').filter({ hasText: 'FunctionTest1' }).click();
      await expect(page.locator('.created-by-click')).toHaveText('Clicked By Flow');
    });

    test('Graph: should handle a click on a node with a bound function with args', async ({
      page,
    }) => {
      await page.locator('.node').filter({ hasText: 'FunctionArgTest2' }).click();
      await expect(page.locator('.created-by-click-2')).toHaveText('Clicked By Flow: ARGUMENT');
    });

    test('Flowchart: should handle a click on a node with a bound function where the node starts with a number', async ({
      page,
    }) => {
      await page.locator('.node').filter({ hasText: '2FunctionArg' }).click();
      await expect(page.locator('.created-by-click-2')).toHaveText('Clicked By Flow: ARGUMENT');
    });

    test('Graph: should handle a click on a node with a bound url', async ({ page }) => {
      await page.locator('svg .node').filter({ hasText: 'URLTest1' }).click();
      await expect(page).toHaveURL('/empty.html');
    });

    test('Graph: should handle a click on a node with a bound url where the node starts with a number', async ({
      page,
    }) => {
      await page.locator('svg .node').filter({ hasText: '2URL' }).click();
      await expect(page).toHaveURL('/empty.html');
    });

    test('Flowchart-v2: should handle a click on a node with a bound function', async ({
      page,
    }) => {
      await page.locator('.node').filter({ hasText: 'FunctionTest2' }).click();
      await expect(page.locator('.created-by-click')).toHaveText('Clicked By Flow');
    });

    test('Flowchart-v2: should handle a click on a node with a bound function where the node starts with a number', async ({
      page,
    }) => {
      await page.locator('.node').filter({ hasText: '10Function' }).click();
      await expect(page.locator('.created-by-click')).toHaveText('Clicked By Flow');
    });

    test('Flowchart-v2: should handle a click on a node with a bound url', async ({ page }) => {
      await page.locator('svg .node').filter({ hasText: 'URLTest2' }).click();
      await expect(page).toHaveURL('/empty.html');
    });

    test('Flowchart-v2: should handle a click on a node with a bound url where the node starts with a number', async ({
      page,
    }) => {
      await page.locator('svg .node').filter({ hasText: '20URL' }).click();
      await expect(page).toHaveURL('/empty.html');
    });

    test('should handle a click on a task with a bound URL clicking on the rect', async ({
      page,
    }) => {
      await page.locator('rect[id$="-cl1"]').click({ force: true });
      await expect(page).toHaveURL('/empty.html');
    });

    test('should handle a click on a task with a bound URL clicking on the text', async ({
      page,
    }) => {
      await page.locator('text[id$="-cl1-text"]').click({ force: true });
      await expect(page).toHaveURL('/empty.html');
    });

    test('should handle a click on a task with a bound function without args', async ({ page }) => {
      await page.locator('rect[id$="-cl2"]').click({ force: true });
      await expect(page.locator('.created-by-gant-click')).toHaveText('Clicked By Gant cl2');
    });

    test('should handle a click on a task with a bound function with args', async ({ page }) => {
      await page.locator('rect[id$="-cl3"]').click({ force: true });
      await expect(page.locator('.created-by-gant-click')).toHaveText(
        'Clicked By Gant test1 test2 test3'
      );
    });

    test('should handle a click on a task with a bound function without args clicking on text', async ({
      page,
    }) => {
      await page.locator('text[id$="-cl2-text"]').click({ force: true });
      await expect(page.locator('.created-by-gant-click')).toHaveText('Clicked By Gant cl2');
    });

    test('should handle a click on a task with a bound function with args ', async ({ page }) => {
      await page.locator('text[id$="-cl3-text"]').click({ force: true });
      await expect(page.locator('.created-by-gant-click')).toHaveText(
        'Clicked By Gant test1 test2 test3'
      );
    });
  });

  test.describe('Interaction - security level tight', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/click_security_strict.html');
    });
    test('should handle a click on a node without a bound function', async ({ page }) => {
      await page.locator('.node').filter({ hasText: 'Function1' }).click();
      await expect(page.locator('.created-by-click')).toHaveCount(0);
    });

    test('should handle a click on a node with a bound function where the node starts with a number', async ({
      page,
    }) => {
      await page.locator('.node').filter({ hasText: '1Function' }).click();
      await expect(page.locator('.created-by-click')).toHaveCount(0);
    });

    test('should handle a click on a node with a bound url', async ({ page }) => {
      await page.locator('svg .node').filter({ hasText: 'URL1' }).click();
      await expect(page).toHaveURL('/empty.html');
    });

    test('should handle a click on a node with a bound url where the node starts with a number', async ({
      page,
    }) => {
      await page.locator('svg .node').filter({ hasText: '2URL' }).click();
      await expect(page).toHaveURL('/empty.html');
    });

    test('should handle a click on a task with a bound URL clicking on the rect', async ({
      page,
    }) => {
      await page.locator('rect[id$="-cl1"]').click({ force: true });
      await expect(page).toHaveURL('/empty.html');
    });

    test('should handle a click on a task with a bound URL clicking on the text', async ({
      page,
    }) => {
      await page.locator('text[id$="-cl1-text"]').click({ force: true });
      await expect(page).toHaveURL('/empty.html');
    });

    test('should handle a click on a task with a bound function clicking on rect', async ({
      page,
    }) => {
      await page.locator('rect[id$="-cl2"]').click({ force: true });
      await expect(page.locator('.created-by-gant-click')).toHaveCount(0);
    });

    test('should handle a click on a task with a bound function clicking on text', async ({
      page,
    }) => {
      await page.locator('text[id$="-cl2-text"]').click({ force: true });
      await expect(page.locator('.created-by-gant-click')).toHaveCount(0);
    });
  });

  test.describe('Interaction - security level other, misspelling', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/click_security_other.html');
    });

    test('should handle a click on a node with a bound function', async ({ page }) => {
      await page.locator('.node').filter({ hasText: 'Function1' }).click();
      await expect(page.locator('.created-by-click')).toHaveCount(0);
    });

    test('should handle a click on a node with a bound function where the node starts with a number', async ({
      page,
    }) => {
      await page.locator('.node').filter({ hasText: '1Function' }).click();
      await expect(page.locator('.created-by-click')).toHaveCount(0);
    });

    test('should handle a click on a node with a bound url', async ({ page }) => {
      await page.locator('svg .node').filter({ hasText: 'URL1' }).click();
      await expect(page).toHaveURL('/empty.html');
    });

    test('should handle a click on a task with a bound function clicking on rect', async ({
      page,
    }) => {
      await page.locator('rect[id$="-cl2"]').click({ force: true });
      await expect(page.locator('.created-by-gant-click')).toHaveCount(0);
    });

    test('should handle a click on a task with a bound function clicking on text', async ({
      page,
    }) => {
      await page.locator('text[id$="-cl2-text"]').click({ force: true });
      await expect(page.locator('.created-by-gant-click')).toHaveCount(0);
    });
  });
});
