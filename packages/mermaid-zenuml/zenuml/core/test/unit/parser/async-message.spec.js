import { describe, expect, test } from 'vitest';
import { Fixture } from './fixture/Fixture';

describe('Async Message', () => {
  test.each([
    ['A->B:m', 'A', 'B'],
    ['"A B"->"C D":m', '"A B"', '"C D"'],
  ])('with ID', (code, source, target) => {
    const asyncMessage = Fixture.firstStatement(code).asyncMessage();
    let actualSource = asyncMessage.from();
    const actualTarget = asyncMessage.to();
    expectText(actualSource).toBe(source);
    expectText(actualTarget).toBe(target);
  });
});

function expectText(context) {
  return expect(context.getText());
}
