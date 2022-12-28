import { DividerContextFixture } from '../../parser/ContextsFixture';
import '../../parser/Divider/DividerContext';
import { Fixture } from '../../../test/unit/parser/fixture/Fixture';

describe('Divider', function () {
  test.each([
    ['==A===', 'A'],
    ['  ==A===', 'A'],
    ['\n ==A===', 'A'],
    ['\n===A B===', 'A B'],
    ['\n===A, B===', 'A,B'], // TODO: should be 'A, B'. Fix is in StringUtil.ts
    // ['a ===A, B===', 'A,B'],  // will throw error
  ])('Divider: code: %s, notes: %s', function (code, note) {
    let dividerContext = DividerContextFixture(code);
    expect(dividerContext.Note()).toEqual(note);
  });

  test('from RootContext', function () {
    let divider = Fixture.firstStatement('==A, B==').divider();
    expect(divider.Note()).toBe('A,B');
  });

  test('throws error if divider note does not start with ==', function () {
    expect(() => DividerContextFixture('a ==A===').Note()).toThrowError(
      'Divider note must start with =='
    );
  });
});
