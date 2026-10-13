import journeyDb from './journeyDb.js';
import { convert } from '../../tests/util.js';

describe('when using the journeyDb', function () {
  beforeEach(function () {
    journeyDb.clear();
  });

  describe('when calling the clear function', function () {
    beforeEach(function () {
      journeyDb.addSection('weekends skip test');
      journeyDb.addTask('test1', '4: id1, id3');
      journeyDb.addTask('test2', '2: id2');
      journeyDb.clear();
    });

    it.each(convert`
      fn               | expected
      ${'getTasks'}    | ${[]}
      ${'getAccTitle'} | ${''}
      ${'getSections'} | ${[]}
      ${'getActors'}   | ${[]}
    `)('should clear $fn', ({ fn, expected }) => {
      expect(journeyDb[fn]()).toEqual(expected);
    });
  });

  describe('when calling the clear function', function () {
    beforeEach(function () {
      journeyDb.addSection('weekends skip test');
      journeyDb.addTask('test1', '3: id1, id3');
      journeyDb.addTask('test2', '1: id2');
      journeyDb.clear();
    });
    it.each(convert`
      fn                     | expected
      ${'getTasks'}          | ${[]}
      ${'getAccTitle'}       | ${''}
      ${'getAccDescription'} | ${''}
      ${'getSections'}       | ${[]}
    `)('should clear $fn', ({ fn, expected }) => {
      expect(journeyDb[fn]()).toEqual(expected);
    });
  });

  it('should return each task once across repeated reads and additions', function () {
    journeyDb.addSection('Morning');
    journeyDb.addTask('Make tea', ':5:Me');

    expect(journeyDb.getTasks()).toHaveLength(1);
    expect(journeyDb.getTasks()).toHaveLength(1);

    journeyDb.addTask('Drink tea', ':4:Me, You');
    expect(journeyDb.getTasks().map((task) => task.task)).toEqual(['Make tea', 'Drink tea']);
    expect(journeyDb.getTasks()).toHaveLength(2);
    expect(journeyDb.getActors()).toEqual(['Me', 'You']);
  });

  it('should preserve tasks added directly before and after a read', function () {
    journeyDb.addTaskOrg('First');
    journeyDb.addTask('Make tea', ':5:Me');
    expect(journeyDb.getTasks()).toHaveLength(2);

    journeyDb.addTaskOrg('Last');
    expect(journeyDb.getTasks().map((task) => task.task)).toEqual(['First', 'Make tea', 'Last']);
  });

  it('should include new tasks after clearing previously read tasks', function () {
    journeyDb.addTask('Old task', ':1:Me');
    journeyDb.getTasks();
    journeyDb.clear();
    journeyDb.addSection('Morning');
    journeyDb.addTask('Make tea', ':5:You');

    expect(journeyDb.getTasks().map((task) => task.task)).toEqual(['Make tea']);
    expect(journeyDb.getTasks()).toHaveLength(1);
    expect(journeyDb.getActors()).toEqual(['You']);
  });

  it('tasks and actors should be added', function () {
    journeyDb.setAccTitle('Shopping');
    journeyDb.setAccDescription('A user journey for family shopping');
    journeyDb.addSection('Journey to the shops');
    journeyDb.addTask('Get car keys', ':5:Dad');
    journeyDb.addTask('Go to car', ':3:Dad, Mum, Child#1, Child#2');
    journeyDb.addTask('Drive to supermarket', ':4:Dad');
    journeyDb.addSection('Do shopping');
    journeyDb.addTask('Go shopping', ':5:Mum');

    expect(journeyDb.getAccTitle()).toEqual('Shopping');
    expect(journeyDb.getAccDescription()).toEqual('A user journey for family shopping');
    expect(journeyDb.getTasks()).toEqual([
      {
        score: 5,
        people: ['Dad'],
        section: 'Journey to the shops',
        task: 'Get car keys',
        type: 'Journey to the shops',
      },
      {
        score: 3,
        people: ['Dad', 'Mum', 'Child#1', 'Child#2'],
        section: 'Journey to the shops',
        task: 'Go to car',
        type: 'Journey to the shops',
      },
      {
        score: 4,
        people: ['Dad'],
        section: 'Journey to the shops',
        task: 'Drive to supermarket',
        type: 'Journey to the shops',
      },
      {
        score: 5,
        people: ['Mum'],
        section: 'Do shopping',
        task: 'Go shopping',
        type: 'Do shopping',
      },
    ]);
    expect(journeyDb.getActors()).toEqual(['Child#1', 'Child#2', 'Dad', 'Mum']);

    expect(journeyDb.getSections()).toEqual(['Journey to the shops', 'Do shopping']);
  });
});
