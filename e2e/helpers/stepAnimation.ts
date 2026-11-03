import type { Locator } from '@playwright/test';

/** Freezes every SVG animation in the diagram at `seconds` so a screenshot is repeatable. */
export const pauseStepAnimationAt =
  (seconds: number) =>
  async (svg: Locator): Promise<void> => {
    await svg.evaluate((element: SVGSVGElement, time: number) => {
      element.pauseAnimations();
      element.setCurrentTime(time);
    }, seconds);
    await svg
      .page()
      .evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      );
  };

/** The `data-step` of every element matching `selector` that is drawn with a non-zero size. */
export const visibleSteps = (svg: Locator, selector: string): Promise<(string | null)[]> =>
  svg.evaluate(
    (element: SVGSVGElement, query: string) =>
      [...element.querySelectorAll(query)]
        .filter((node) => node.getBoundingClientRect().width > 0)
        .map((node) => node.getAttribute('data-step')),
    selector
  );
