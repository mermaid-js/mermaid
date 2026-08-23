import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- fixture needs the raw singleton
import fastdomRaw from 'fastdom';
import { createFastdomWrapper } from './fastdom.js';

// https://github.com/mermaid-js/mermaid/issues/8095
// fastdom's UMD tail prefers an AMD `define` over CommonJS
// `module.exports`. On pages that define a global `define` function, the
// bundled copy takes the AMD branch and the bundler's interop default export
// arrives empty, which used to crash `.extend`. The wrapper must recover via
// the `window.fastdom` singleton fastdom always publishes, and must not
// depend on the equally affected `fastdom-promised` UMD export at all.

const asCore = (value: unknown) => value as Parameters<typeof createFastdomWrapper>[0];

describe('fastdom wrapper', () => {
	it('works with a healthy module default export', () => {
		const fastdom = createFastdomWrapper(asCore({ default: fastdomRaw }));
		expect(typeof fastdom.measure).toBe('function');
		expect(typeof fastdom.mutate).toBe('function');
		const result = fastdom.measure(() => 42) as unknown as Promise<number>;
		expect(result).toBeInstanceOf(Promise);
		return (result as Promise<number>).then((value) => expect(value).toBe(42));
	});

	it('recovers via the window.fastdom singleton when the interop default is empty', () => {
		// Simulates the AMD branch having swallowed `module.exports`.
		const globalScope = { fastdom: fastdomRaw as unknown as Record<string, never> };
		const fastdom = createFastdomWrapper(asCore({}), globalScope);
		expect(typeof fastdom.measure).toBe('function');
		expect(typeof fastdom.mutate).toBe('function');
		return Promise.resolve(fastdom.measure(() => 'ok') as unknown as Promise<string>).then((value) =>
			expect(value).toBe('ok'),
		);
	});

	it('applies the promised extension even when the extension module export is lost', () => {
		// The promised extension is vendored, so a broken UMD export for it
		// cannot affect the wrapper - verified by measure/mutate returning
		// promises on the recovered instance.
		const globalScope = { fastdom: fastdomRaw as unknown as Record<string, never> };
		const fastdom = createFastdomWrapper(asCore(undefined), globalScope);
		expect(fastdom.measure(() => null)).toBeInstanceOf(Promise);
		expect(fastdom.mutate(() => null)).toBeInstanceOf(Promise);
	});

	it('the real module-level wrapper exposes the promisified API', async () => {
		vi.resetModules();
		const { default: fastdom } = await import('./fastdom.js');
		expect(typeof fastdom.measure).toBe('function');
		expect(fastdom.measure(() => 1)).toBeInstanceOf(Promise);
	});
});