import { parser } from './journey';
import journeyDb from '../journeyDb';

const parserFnConstructor = (str) => {
  return () => {
    parser.parse(str);
  };
};

describe('when parsing a journey diagram it', function () {
  beforeEach(function () {
    parser.yy = journeyDb;
    parser.yy.clear();
  });

  it('should handle a title definition', function () {
    const str = 'journey\ntitle Adding journey diagram functionality to mermaid';

    expect(parserFnConstructor(str)).not.toThrow();
  });

  it('it should handle an accessibility description (accDescr)', function () {
    const str =
      'journey\n' +
      'accDescr: A user journey for family shopping\n' +
      'title Adding journey diagram functionality to mermaid\n' +
      'section Order from website';

    expect(parserFnConstructor(str)).not.toThrow();
  });
  it('it should handle an accessibility multiline description (accDescr)', function () {
    const str =
      'journey\n' +
      `accDescr {
        A user journey for
        family shopping
      }` +
      'title Adding journey diagram functionality to mermaid\n' +
      'accTitle: Adding acc journey diagram functionality to mermaid\n' +
      'section Order from website';

    expect(parserFnConstructor(str)).not.toThrow();
    expect(journeyDb.getAccDescription()).toBe('A user journey for\nfamily shopping');
    expect(journeyDb.getDiagramTitle()).toBe('Adding journey diagram functionality to mermaid');
    expect(journeyDb.getAccTitle()).toBe('Adding acc journey diagram functionality to mermaid');
  });
  it('it should handle an accessibility title (accDescr)', function () {
    const str = `journey
    accTitle: The title
    section Order from website`;

    expect(parserFnConstructor(str)).not.toThrow();
    expect(journeyDb.getAccDescription()).toBe('');
    expect(journeyDb.getAccTitle()).toBe('The title');
  });

  it('should handle a section definition', function () {
    const str =
      'journey\n' +
      'title Adding journey diagram functionality to mermaid\n' +
      'section Order from website';

    expect(parserFnConstructor(str)).not.toThrow();
  });
  it('should handle multiline section titles with different line breaks', function () {
    const str =
      'journey\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Line1<br>Line2<br/>Line3</br />Line4<br\t/>Line5';

    expect(parserFnConstructor(str)).not.toThrow();
  });

  it('should handle a task definition', function () {
    const str =
      'journey\n' +
      'title Adding journey diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'A task: 5: Alice, Bob, Charlie\n' +
      'B task: 3:Bob, Charlie\n' +
      'C task: 5\n' +
      'D task: 5: Charlie, Alice\n' +
      'E task: 5:\n' +
      'section Another section\n' +
      'P task: 5:\n' +
      'Q task: 5:\n' +
      'R task: 5:';
    expect(parserFnConstructor(str)).not.toThrow();

    const tasks = parser.yy.getTasks();
    expect(tasks.length).toEqual(8);

    expect(tasks[0]).toEqual({
      score: 5,
      people: ['Alice', 'Bob', 'Charlie'],
      section: 'Documentation',
      task: 'A task',
      type: 'Documentation',
    });
    expect(tasks[1]).toEqual({
      score: 3,
      people: ['Bob', 'Charlie'],
      section: 'Documentation',
      type: 'Documentation',
      task: 'B task',
    });
    expect(tasks[2]).toEqual({
      score: 5,
      people: [],
      section: 'Documentation',
      type: 'Documentation',
      task: 'C task',
    });
    expect(tasks[3]).toEqual({
      score: 5,
      people: ['Charlie', 'Alice'],
      section: 'Documentation',
      task: 'D task',
      type: 'Documentation',
    });
    expect(tasks[4]).toEqual({
      score: 5,
      people: [''],
      section: 'Documentation',
      type: 'Documentation',
      task: 'E task',
    });
    expect(tasks[5]).toEqual({
      score: 5,
      people: [''],
      section: 'Another section',
      type: 'Another section',
      task: 'P task',
    });
    expect(tasks[6]).toEqual({
      score: 5,
      people: [''],
      section: 'Another section',
      type: 'Another section',
      task: 'Q task',
    });
    expect(tasks[7]).toEqual({
      score: 5,
      people: [''],
      section: 'Another section',
      type: 'Another section',
      task: 'R task',
    });
  });
});
