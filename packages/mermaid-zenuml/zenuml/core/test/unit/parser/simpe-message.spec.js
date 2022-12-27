import { describe, expect, test } from 'vitest';
import { Fixture } from './fixture/Fixture';
import { Assignment } from '../../../src/parser/Messages/MessageContext';

describe('message - complete', () => {
  test('A.m', () => {
    let message = Fixture.firstStatement('200=A.m').message();
    expect(message.SignatureText()).toBe('m');
    expect(message.Assignment()).toBeDefined();
    expect(message.Assignment()).toStrictEqual(new Assignment('200', undefined));
  });

  test.each([
    ['A.m', 'm', undefined],
    ['A.m()', 'm()', undefined],
    ['A.m(1)', 'm(1)', undefined],
    ['A.m(1,2)', 'm(1,2)', undefined],
    ['A.m(" const, static ")', 'm(" const,static ")', undefined], // See StringUtil.spec for why the space after ',' was removed
    ['ret = A.m', 'm', new Assignment('ret', undefined)],
    ['const ret = A.m', 'm', new Assignment('ret', undefined)],
    ['readonly ret = A.m', 'm', new Assignment('ret', undefined)],
    ['static ret = A.m', 'm', new Assignment('ret', undefined)],
    ['const ret = await A.m', 'm', new Assignment('ret', undefined)],
  ])(' %s, signature: %s and assignment: %s', (text, signature, assignment) => {
    let message = Fixture.firstStatement(text).message();
    expect(message.SignatureText()).toBe(signature);
    let actual = message.Assignment();
    expect(actual).toStrictEqual(assignment);
  });

  test('compare assignment', () => {
    const assignment1 = new Assignment('ret', undefined);
    const assignment2 = new Assignment('ret', undefined);
    expect(assignment1).toStrictEqual(assignment2);
  });
});

describe('message - incomplete', () => {
  test('A.', () => {
    let message = Fixture.firstStatement('A.').message();
    expect(message.messageBody().to().getText()).toBe('A');
  });

  // This will be parsed as to statements: `A.` and `m(`, so the first statement has a null func.
  // The editor should close the () in most cases. We do not add alternative rules to allow this
  // to be parsed as one statement, because it causes other issues.
  test('A.m(', () => {
    let message = Fixture.firstStatement('A.m(').message();
    let signatureElement = message.messageBody().func();
    expect(signatureElement).toBeNull();
  });
});

test('seqDsl should parse a simple method with a method call as parameter', () => {
  let signatureText = Fixture.firstStatement('B.method(getCount(1))').message().SignatureText();
  expect(signatureText).toBe('method(getCount(1))');
});

test('seqDsl should parse a simple method with quoted method name', () => {
  let signatureElement = Fixture.firstStatement('B."method. {a,b} 1"(1,2)')
    .message()
    .SignatureText();
  expect(signatureElement).toBe('"method.{a,b} 1"(1,2)');
});

test('Simple method: A->B.method()', () => {
  const message = Fixture.firstStatement('A->B.method()').message();
  let messageBody = message.messageBody();
  expect(messageBody.from().getText()).toBe('A');
  expect(message.SignatureText()).toBe('method()');
});

test('Simple method: "A".method()', () => {
  const message = Fixture.firstStatement('"A".method()').message();
  let messageBody = message.messageBody();
  expect(messageBody.to().getFormattedText()).toBe('A');
  expect(message.SignatureText()).toBe('method()');
});
