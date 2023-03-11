import { parser } from './gantt.js';
import ganttDb from '../ganttDb.js';
import { convert } from '../../../tests/util.js';
import { vi } from 'vitest';
const spyOn = vi.spyOn;
const parserFnConstructor = (str) => {
  return () => {
    parser.parse(str);
  };
};

describe('when parsing a gantt diagram it', function () {
  beforeEach(function () {
    parser.yy = ganttDb;
    parser.yy.clear();
  });

  it('should handle a dateFormat definition', function () {
    const str = 'gantt\ndateFormat yyyy-mm-dd';

    expect(parserFnConstructor(str)).not.toThrow();
  });

  it('should handle a inclusive end date definition', function () {
    const str = 'gantt\ndateFormat yyyy-mm-dd\ninclusiveEndDates';

    expect(parserFnConstructor(str)).not.toThrow();
  });
  it('should handle a title definition', function () {
    const str = 'gantt\ndateFormat yyyy-mm-dd\ntitle Adding gantt diagram functionality to mermaid';

    expect(parserFnConstructor(str)).not.toThrow();
  });
  it('should handle an excludes definition', function () {
    const str =
      'gantt\ndateFormat yyyy-mm-dd\ntitle Adding gantt diagram functionality to mermaid\nexcludes weekdays 2019-02-01';

    expect(parserFnConstructor(str)).not.toThrow();
  });
  it('should handle a todayMarker definition', function () {
    spyOn(ganttDb, 'setTodayMarker');
    const str =
      'gantt\ndateFormat yyyy-mm-dd\ntitle Adding gantt diagram functionality to mermaid\nexcludes weekdays 2019-02-01\ntodayMarker off';

    expect(parserFnConstructor(str)).not.toThrow();
    expect(ganttDb.setTodayMarker).toHaveBeenCalledWith('off');
  });
  it('should handle a section definition', function () {
    const str =
      'gantt\n' +
      'dateFormat yyyy-mm-dd\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'excludes weekdays 2019-02-01\n' +
      'section Documentation';

    expect(parserFnConstructor(str)).not.toThrow();
  });
  it('should handle multiline section titles with different line breaks', function () {
    const str =
      'gantt\n' +
      'dateFormat yyyy-mm-dd\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'excludes weekdays 2019-02-01\n' +
      'section Line1<br>Line2<br/>Line3</br />Line4<br\t/>Line5';

    expect(parserFnConstructor(str)).not.toThrow();
  });
  it('should handle a task definition', function () {
    const str =
      'gantt\n' +
      'dateFormat YYYY-MM-DD\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'Design jison grammar:des1, 2014-01-01, 2014-01-04';

    expect(parserFnConstructor(str)).not.toThrow();

    const tasks = parser.yy.getTasks();

    expect(tasks[0].startTime).toEqual(new Date(2014, 0, 1));
    expect(tasks[0].endTime).toEqual(new Date(2014, 0, 4));
    expect(tasks[0].id).toEqual('des1');
    expect(tasks[0].task).toEqual('Design jison grammar');
  });
  it.each(convert`
    tags                     | milestone | done     | crit     | active
    ${'milestone'}           | ${true}   | ${false} | ${false} | ${false}
    ${'done'}                | ${false}  | ${true}  | ${false} | ${false}
    ${'crit'}                | ${false}  | ${false} | ${true}  | ${false}
    ${'active'}              | ${false}  | ${false} | ${false} | ${true}
    ${'crit,milestone,done'} | ${true}   | ${true}  | ${true}  | ${false}
  `)('should handle a task with tags $tags', ({ tags, milestone, done, crit, active }) => {
    const str =
      'gantt\n' +
      'dateFormat YYYY-MM-DD\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'test task:' +
      tags +
      ', 2014-01-01, 2014-01-04';

    const allowedTags = ['active', 'done', 'crit', 'milestone'];

    expect(parserFnConstructor(str)).not.toThrow();

    const tasks = parser.yy.getTasks();

    allowedTags.forEach(function (t) {
      if (eval(t)) {
        expect(tasks[0][t]).toBeTruthy();
      } else {
        expect(tasks[0][t]).toBeFalsy();
      }
    });
  });
  it('should parse callback specifier with no args', function () {
    spyOn(ganttDb, 'setClickEvent');
    const str =
      'gantt\n' +
      'dateFormat  YYYY-MM-DD\n' +
      'section Clickable\n' +
      'Visit mermaidjs           :active, cl1, 2014-01-07, 3d\n' +
      'Calling a callback        :cl2, after cl1, 3d\n\n' +
      'click cl1 href "https://mermaidjs.github.io/"\n' +
      'click cl2 call ganttTestClick()\n';

    expect(parserFnConstructor(str)).not.toThrow();
    expect(ganttDb.setClickEvent).toHaveBeenCalledWith('cl2', 'ganttTestClick', null);
  });
  it('should parse callback specifier with arbitrary number of args', function () {
    spyOn(ganttDb, 'setClickEvent');
    const str =
      'gantt\n' +
      'dateFormat  YYYY-MM-DD\n' +
      'section Clickable\n' +
      'Visit mermaidjs           :active, cl1, 2014-01-07, 3d\n' +
      'Calling a callback        :cl2, after cl1, 3d\n\n' +
      'click cl1 href "https://mermaidjs.github.io/"\n' +
      'click cl2 call ganttTestClick("test0", test1, test2)\n';

    expect(parserFnConstructor(str)).not.toThrow();
    const args = '"test1", "test2", "test3"';
    expect(ganttDb.setClickEvent).toHaveBeenCalledWith(
      'cl2',
      'ganttTestClick',
      '"test0", test1, test2'
    );
  });

  it('should allow for a accessibility title and description (accDescr)', function () {
    const expectedTitle = 'Gantt Diagram';
    const expectedAccDescription = 'Tasks for Q4';
    const ganttString = `gantt
       accTitle: ${expectedTitle}
       accDescr: ${expectedAccDescription}
       dateFormat  YYYY-MM-DD
       section Section
       A task :a1, 2014-01-01, 30d\n`;

    parser.parse(ganttString);

    expect(ganttDb.getAccTitle()).toBe(expectedTitle);
    expect(ganttDb.getAccDescription()).toBe(expectedAccDescription);
  });
  it('should allow for a accessibility title and multiline description (accDescr)', function () {
    const expectedTitle = 'Gantt Diagram';
    const expectedAccDescription = `Tasks for Q4 row1
row2`;
    const ganttString = `gantt
       accTitle: ${expectedTitle}
       accDescr {
         ${expectedAccDescription}
       }
       dateFormat  YYYY-MM-DD
       section Section
       A task :a1, 2014-01-01, 30d\n`;

    parser.parse(ganttString);

    expect(ganttDb.getAccTitle()).toBe(expectedTitle);
    expect(ganttDb.getAccDescription()).toBe(expectedAccDescription);
  });
});
