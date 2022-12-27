import { describe, expect, test } from 'vitest';
import { RootContext } from '../../../src/parser/index';

test('<<Person>> Bob', () => {
  let rootContext = RootContext('<<Person>> Bob\n');
  let participant = rootContext.head().participant()[0];
  expectText(participant).toBe('<<Person>>Bob');
  let stereotype = participant.stereotype();
  expectText(stereotype).toBe('<<Person>>');
});

describe('Error recovery', () => {
  test('<<', () => {
    let rootContext = RootContext('<<');
    let participant = rootContext.head().participant()[0];
    expectText(participant).toBe('<<');
    let stereotype = participant.stereotype();
    expectText(stereotype).toBe('<<');
  });
});

function expectText(context) {
  return expect(context.getText());
}
