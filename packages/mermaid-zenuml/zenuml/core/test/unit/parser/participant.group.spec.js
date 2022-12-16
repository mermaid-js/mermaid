let seqDsl = require('../../../src/parser/index');

describe('Participant Group', () => {
  test('', () => {
    const rootContext = seqDsl.RootContext('group');
    const group = rootContext.head().group()[0];
    expectText(group).toBe('group');
  });
  test('', () => {
    const rootContext = seqDsl.RootContext('group {A\nB}');
    const group = rootContext.head().group()[0];
    const participants = group.participant();
    expectText(participants[0]).toBe('A');
    expectText(participants[1]).toBe('B');
  });
  test('', () => {
    const rootContext = seqDsl.RootContext('A\ngroup {B\nC}');
    const group = rootContext.head().group()[0];
    const participants = group.participant();
    expectText(participants[0]).toBe('B');
    expectText(participants[1]).toBe('C');
  });
});

function expectText(context) {
  return expect(context.getText());
}
