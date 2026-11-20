import { expect } from '@playwright/test';
import { diagramSvg } from './util.ts';

// Checks shared by the grid layout specs in e2e/rendering/grid/<tier>/.

export const assertFiniteViewBox = async (page: Parameters<typeof diagramSvg>[0]) => {
  const svg = diagramSvg(page).first();
  const viewBox = (await svg.getAttribute('viewBox')) ?? '';
  const numbers = viewBox.split(/\s+/).map((value) => Number(value));
  expect(numbers).toHaveLength(4);
  for (const value of numbers) {
    expect(Number.isFinite(value)).toBe(true);
  }
  expect(numbers[2]).toBeGreaterThan(0);
  expect(numbers[3]).toBeGreaterThan(0);
};

export const assertFiniteEdgePaths = async (page: Parameters<typeof diagramSvg>[0]) => {
  const pathData = await page
    .locator('svg .edgePaths path')
    .evaluateAll((paths) => paths.map((path) => path.getAttribute('d') ?? ''));
  expect(pathData.length).toBeGreaterThan(0);
  for (const d of pathData) {
    expect(d.length).toBeGreaterThan(0);
    expect(d.includes('NaN')).toBe(false);
    expect(d.includes('undefined')).toBe(false);
  }
};
