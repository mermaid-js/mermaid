// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchColorScheme } from './colorScheme.js';

/** MutationObserver callbacks run as microtasks. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('watchColorScheme', () => {
  const root = document.documentElement;
  let stop: () => void = () => undefined;

  afterEach(() => {
    stop();
    root.className = '';
    root.removeAttribute('lang');
    root.removeAttribute('niceapa_docid');
  });

  it('reports a switch to dark mode and back', async () => {
    const onChange = vi.fn();
    stop = watchColorScheme(onChange);

    root.classList.add('dark');
    await flush();
    root.classList.remove('dark');
    await flush();

    expect(onChange.mock.calls).toEqual([[true], [false]]);
  });

  it('ignores attributes other than class, such as those set by VitePress or extensions', async () => {
    const onChange = vi.fn();
    stop = watchColorScheme(onChange);

    root.setAttribute('lang', 'en-US');
    root.setAttribute('niceapa_docid', '79016570');
    await flush();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores class writes that leave the color scheme unchanged', async () => {
    root.classList.add('dark');
    const onChange = vi.fn();
    stop = watchColorScheme(onChange);

    root.classList.add('some-other-class');
    root.setAttribute('class', root.getAttribute('class')!);
    await flush();

    expect(onChange).not.toHaveBeenCalled();
  });
});
