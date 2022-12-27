let seqDsl = require('../../../src/parser/index');

describe('Starter', () => {
  test.each([
    ['A', 'A'],
    ['A B', 'A'],
    ['group {A B}', 'A'],
    ['A group {B C}', 'A'],
    ['A B.m', '_STARTER_'],
    ['A A->B.m', 'A'],
    ['@Starter(A)', 'A'],
    ['@starter(A)', 'A'],
    ['@Starter("A B")', 'A B'],
    ['@Starter("A B")', 'A B'],
    ['A1 @Starter(A)', 'A'],
    ['@starter(A) B', 'A'],
    ['@starter(A) A1->B.m', 'A'],
    ['A1 @starter(A) A2->B.m', 'A'],
  ])('For code: %s, starter is %s', (code, starter) => {
    let rootContext = seqDsl.RootContext(code);
    let actualStarter = rootContext.Starter();
    expect(actualStarter).toBe(starter);
  });
});
