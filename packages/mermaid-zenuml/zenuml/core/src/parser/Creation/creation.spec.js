import { describe, expect, test } from 'vitest';
import { Fixture } from '../../../test/unit/parser/fixture/Fixture';
import { CreationContextFixture } from '../ContextsFixture';

describe('CreationContext', () => {
  test.each([
    ['new A', '«create»', 'A'],
    ['new A(x)', '«x»', 'A'],
    ['new A{m1}', '«create»', 'A'],
    ['x = new A{m1}', '«create»', 'x:A'],
    ['X x = new A{m1}', '«create»', 'x:A'],
    ['new', '«create»', 'Missing Constructor'],
    ['new{m1}', '«create»', 'Missing Constructor'],
  ])('should parse %s', (code, signature, owner) => {
    const creationContext = CreationContextFixture(code);
    expect(creationContext.SignatureText()).toBe(signature);
    expect(creationContext.Owner()).toBe(owner);
  });
});

describe('message - creation', () => {
  test('A.m', () => {
    let message = Fixture.firstStatement('new A').creation();
    expect(message.SignatureText()).toBe('«create»');
  });
});
