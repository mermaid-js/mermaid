let seqDsl = require('../../../src/parser/index');

describe('Declared participant', () => {
  test.each([
    ['A', 'A'],
    ['"A"', 'A'],
  ])('Code %s, first participant %s', (code, p) => {
    let rootContext = seqDsl.RootContext(code);
    let participants = rootContext.head().participant();
    expectText(participants[0]).toBe(p);
  });
});
test('A participant - A', () => {
  let rootContext = seqDsl.RootContext('A');
  let participants = rootContext.head().participant();
  expectText(participants[0]).toBe('A');
});

test('A participant - A B', () => {
  let rootContext = seqDsl.RootContext('A B');
  let participants = rootContext.head().participant();
  expectText(participants[0]).toBe('A');
  expectText(participants[1]).toBe('B');
});

// If you declare a participant twice, two participants will be created.
test('A participant - A A', () => {
  let rootContext = seqDsl.RootContext('A A');
  let participants = rootContext.head().participant();
  expectText(participants[0]).toBe('A');
  expectText(participants[1]).toBe('A');
});

test('A participant - A \nB', () => {
  let rootContext = seqDsl.RootContext('A \nB');
  let participants = rootContext.head().participant();
  expectText(participants[0]).toBe('A');
  expectText(participants[1]).toBe('B');
});

test('A participant - A 100', () => {
  let rootContext = seqDsl.RootContext('A 100');
  let participants = rootContext.head().participant();
  expectText(participants[0].name()).toBe('A');
  expectText(participants[0].width()).toBe('100');
});

test('A participant - A as "long name"', () => {
  let rootContext = seqDsl.RootContext('A as "long name"');
  let participants = rootContext.head().participant();
  expectText(participants[0].name()).toBe('A');
  expectText(participants[0].label().name()).toBe('long name');
});

test('A participant - A 100 as "long name"', () => {
  let rootContext = seqDsl.RootContext('A 100 as "long name"');
  let participants = rootContext.head().participant();
  expectText(participants[0].name()).toBe('A');
  expectText(participants[0].width()).toBe('100');
  expectText(participants[0].label().name()).toBe('long name');
});

test('A participant - @actor A', () => {
  let rootContext = seqDsl.RootContext('@actor A');
  let participants = rootContext.head().participant();
  expectText(participants[0].name()).toBe('A');
  expectText(participants[0].participantType()).toBe('@actor');
});

test('A participant -  @actor <<Repo>> A 100 as label', () => {
  let rootContext = seqDsl.RootContext(' @actor <<Repo>> A 100 as label');
  let participants = rootContext.head().participant();
  expectText(participants[0].stereotype()).toBe('<<Repo>>');
  expectText(participants[0].participantType()).toBe('@actor');
  expectText(participants[0].name()).toBe('A');
  expectText(participants[0].width()).toBe('100');
  expectText(participants[0].label().name()).toBe('label');
});

test('A participant -  A #123456', () => {
  let rootContext = seqDsl.RootContext('A #12345');
  let participants = rootContext.head().participant();
  expectText(participants[0].name()).toBe('A');
  expect(participants[0].COLOR().getText()).toBe('#12345');
});

test('A participant with comments', () => {
  let rootContext = seqDsl.RootContext('\n// comment\nA\nA.method');
  let participants = rootContext.head().participant();
  expectText(participants[0].name()).toBe('A');
  expect(participants[0].getComment()).toBe(' comment\n');
});

function expectText(context) {
  return expect(context.getFormattedText());
}
