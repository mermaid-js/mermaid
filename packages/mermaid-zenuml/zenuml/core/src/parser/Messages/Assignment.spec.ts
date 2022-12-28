import { Assignment } from '../../parser/Messages/MessageContext';

describe('Assignment', function () {
  test.each([
    ['A', 'B', 'A:B'],
    ['A', undefined, 'A'],
  ])('getText: assignee: %s, type: %s, text: %s', function (assignee, type, text) {
    let assignment = new Assignment(assignee, type);
    expect(assignment.getText()).toEqual(text);
  });

  // expect throws error if assignee is undefined and type is defined
  test('throws error if assignee is undefined and type is defined', function () {
    expect(() => new Assignment(undefined, 'B')).toThrow(
      'assignee must be defined if type is defined'
    );
  });
});
