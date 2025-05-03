import { expect, test } from 'vitest';

import { parseOption } from './util.js';

test('--target=ES2018 parsed to ES2018', () => {
  expect(parseOption('--target', ['cmd', '--target=ES2018', 'arg'])).toBe('ES2018');
});

test('missing =, ignored', () => {
  expect(parseOption('--target', ['cmd', '--target'])).toBe(undefined);
});

test('option not found', () => {
  expect(parseOption('--target', ['cmd', '--mermaid'])).toBe(undefined);
});
