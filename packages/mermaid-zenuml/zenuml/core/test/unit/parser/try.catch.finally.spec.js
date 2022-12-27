import { Fixture } from './fixture/Fixture';

import { describe, expect, test } from 'vitest';

test('Empty `try`', () => {
  let tcf = Fixture.firstStatement('try {}').tcf();
  expectText(tcf).toBe('try{}');
  let tryBlock = tcf.tryBlock();
  expectText(tryBlock).toBe('try{}');
  expectText(tryBlock.braceBlock()).toBe('{}');
});

test('`try` with a block', () => {
  let braceBlock = braceBlockOfTry('try { doSomething() \n\r}');
  expectText(braceBlock.block().stat()[0]).toBe('doSomething()');
});

test('`if` with comments only', () => {
  let braceBlock = braceBlockOfTry('try { // comment \n\r}');
  expect(braceBlock.getComment()).toBe(' comment \n');
});

test('`if` with comments and a block', () => {
  let braceBlock = braceBlockOfTry('try { // comment \n\r doSomething \n\r}');
  expect(braceBlock.getComment()).toBeNull();
});

describe('if - incomplete', () => {
  test('', () => {
    expect(Fixture.firstStatement('try').tcf().getText()).toBe('try');
  });
});

function braceBlockOfTry(code) {
  return Fixture.firstStatement(code).tcf().tryBlock().braceBlock();
}

function expectText(context) {
  return expect(context.getText());
}
