import { expect, test } from 'vitest';
import { parseOption, parseOptions } from './util.js';

test('--target=ES2018 parsed to ES2018', () => {
  expect(parseOption('--target', ['cmd', '--target=ES2018', 'arg'])).toBe('ES2018');
});

test('missing =, ignored', () => {
  expect(parseOption('--target', ['cmd', '--target'])).toBe(undefined);
});

test('option not found', () => {
  expect(parseOption('--target', ['cmd', '--mermaid'])).toBe(undefined);
});

test(
  '--supported:bigint=false --supported:class-static-blocks=false ' +
    'parsed to {bigint:false, class-static-blocks:false}',
  () => {
    expect(
      parseOptions('--supported', [
        'cmd',
        '--supported:bigint=false',
        '--supported:class-static-blocks=false',
      ])
    ).toStrictEqual({ bigint: false, 'class-static-blocks': false });
  }
);

test('default', () => {
  expect(parseOption('--target', ['cmd'])).toBe(undefined);
  expect(parseOptions('--supported', ['cmd'])).toStrictEqual({});
});

function buildConfig(supported: Record<string, boolean>, target: string | undefined) {
  return {
    bundle: true,
    ...(Object.keys(supported).length === 0 ? {} : { supported }),
    ...(target === undefined ? {} : { target }),
  };
}

test('spread with no options', () => {
  const supported = {};
  const target = parseOption('--target', ['cmd']);
  const config = buildConfig(supported, target);
  expect(config).toStrictEqual({ bundle: true });
});

test('spread', () => {
  const argv = ['cmd', '--supported:class-static-blocks=false', '--target=ES2018'];
  const supported = parseOptions('--supported', argv);
  const target = parseOption('--target', argv);
  const config = buildConfig(supported, target);
  expect(config).toStrictEqual({
    bundle: true,
    supported: { 'class-static-blocks': false },
    target: 'ES2018',
  });
});
