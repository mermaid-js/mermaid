import { expect, test } from 'vitest';

import { Fixture } from './fixture/Fixture';

test('chain method', () => {
  expect(Fixture.firstStatement('B.method().toString()').message().SignatureText()).toBe(
    'method().toString()'
  );
});

test('chain method call as a parameter', () => {
  expect(Fixture.firstStatement('B.method(getCount(1).toString())').message().SignatureText()).toBe(
    'method(getCount(1).toString())'
  );
});

test('chain method call as implementation', () => {
  expect(
    Fixture.firstStatement('B.method() { getCount().toString() }').message().SignatureText()
  ).toBe('method()');
  expect(
    Fixture.firstStatement('B.method() { getCount().toString() }')
      .message()
      .braceBlock()
      .block()
      .getFormattedText()
  ).toBe('getCount().toString()');
});

test('chain method call as if condition', () => {
  expect(
    Fixture.firstStatement('if(getCount().toString().isEmpty()) { doSomething() }')
      .alt()
      .ifBlock()
      .parExpr()
      .getText()
  ).toBe('(getCount().toString().isEmpty())');
});

test('chain method call as while condition', () => {
  expect(
    Fixture.firstStatement('while(getCount().toString().isEmpty()) { doSomething() }')
      .loop()
      .parExpr()
      .getText()
  ).toBe('(getCount().toString().isEmpty())');
});
