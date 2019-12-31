/* eslint-env jasmine */
import moment from 'moment-mini';
import ganttDb from './ganttDb';

describe('when using the ganttDb', function() {
  beforeEach(function() {
    ganttDb.clear();
  });

  describe('when using relative times', function() {
    it.each`
      diff     | date                    | expected
      ${' 1d'} | ${moment('2019-01-01')} | ${moment('2019-01-02').toDate()}
      ${' 1w'} | ${moment('2019-01-01')} | ${moment('2019-01-08').toDate()}
    `('should add $diff to $date resulting in $expected', ({ diff, date, expected }) => {
      expect(ganttDb.durationToDate(diff, date)).toEqual(expected);
    });
  });

  describe('when calling the clear function', function() {
    beforeEach(function() {
      ganttDb.setDateFormat('YYYY-MM-DD');
      ganttDb.enableInclusiveEndDates();
      ganttDb.setExcludes('weekends 2019-02-06,friday');
      ganttDb.addSection('weekends skip test');
      ganttDb.addTask('test1', 'id1,2019-02-01,1d');
      ganttDb.addTask('test2', 'id2,after id1,2d');
      ganttDb.clear();
    });

    it.each`
      fn                        | expected
      ${'getTasks'}             | ${[]}
      ${'getTitle'}             | ${''}
      ${'getDateFormat'}        | ${''}
      ${'getAxisFormat'}        | ${''}
      ${'getExcludes'}          | ${[]}
      ${'getSections'}          | ${[]}
      ${'endDatesAreInclusive'} | ${false}
    `('should clear $fn', ({ fn, expected }) => {
      expect(ganttDb[fn]()).toEqual(expected);
    });
  });

  it.each`
    testName                                                                             | section     | taskName   | taskData                       | expStartDate            | expEndDate                       | expId      | expTask
    ${'should handle fixed dates'}                                                       | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2013-01-12'} | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 12)}         | ${'id1'}   | ${'test1'}
    ${'should handle duration (days) instead of fixed date to determine end date'}       | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2d'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 3)}          | ${'id1'}   | ${'test1'}
    ${'should handle duration (hours) instead of fixed date to determine end date'}      | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2h'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 1, 2)}       | ${'id1'}   | ${'test1'}
    ${'should handle duration (minutes) instead of fixed date to determine end date'}    | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2m'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 1, 0, 2)}    | ${'id1'}   | ${'test1'}
    ${'should handle duration (seconds) instead of fixed date to determine end date'}    | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2s'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 1, 0, 0, 2)} | ${'id1'}   | ${'test1'}
    ${'should handle duration (weeks) instead of fixed date to determine end date'}      | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2w'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 15)}         | ${'id1'}   | ${'test1'}
    ${'should handle fixed dates without id'}                                            | ${'testa1'} | ${'test1'} | ${'2013-01-01,2013-01-12'}     | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 12)}         | ${'task1'} | ${'test1'}
    ${'should handle duration instead of a fixed date to determine end date without id'} | ${'testa1'} | ${'test1'} | ${'2013-01-01,4d'}             | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 5)}          | ${'task1'} | ${'test1'}
  `('$testName', ({ section, taskName, taskData, expStartDate, expEndDate, expId, expTask }) => {
    ganttDb.setDateFormat('YYYY-MM-DD');
    ganttDb.addSection(section);
    ganttDb.addTask(taskName, taskData);
    const tasks = ganttDb.getTasks();
    expect(tasks[0].startTime).toEqual(expStartDate);
    expect(tasks[0].endTime).toEqual(expEndDate);
    expect(tasks[0].id).toEqual(expId);
    expect(tasks[0].task).toEqual(expTask);
  });

  it.each`
    section     | taskName1  | taskName2  | taskData1              | taskData2             | expStartDate2                                | expEndDate2              | expId2     | expTask2
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'id2,after id1,1d'} | ${new Date(2013, 0, 15)}                     | ${undefined}             | ${'id2'}   | ${'test2'}
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'id2,after id3,1d'} | ${new Date(new Date().setHours(0, 0, 0, 0))} | ${undefined}             | ${'id2'}   | ${'test2'}
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'after id1,1d'}     | ${new Date(2013, 0, 15)}                     | ${undefined}             | ${'task1'} | ${'test2'}
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'2013-01-26'}       | ${new Date(2013, 0, 15)}                     | ${new Date(2013, 0, 26)} | ${'task1'} | ${'test2'}
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'2d'}               | ${new Date(2013, 0, 15)}                     | ${new Date(2013, 0, 17)} | ${'task1'} | ${'test2'}
  `(
    '$testName',
    ({
      section,
      taskName1,
      taskName2,
      taskData1,
      taskData2,
      expStartDate2,
      expEndDate2,
      expId2,
      expTask2
    }) => {
      ganttDb.setDateFormat('YYYY-MM-DD');
      ganttDb.addSection(section);
      ganttDb.addTask(taskName1, taskData1);
      ganttDb.addTask(taskName2, taskData2);
      const tasks = ganttDb.getTasks();
      expect(tasks[1].startTime).toEqual(expStartDate2);
      if (!expEndDate2 === undefined) {
        expect(tasks[1].endTime).toEqual(expEndDate2);
      }
      expect(tasks[1].id).toEqual(expId2);
      expect(tasks[1].task).toEqual(expTask2);
    }
  );

  it('should handle relative start date based on id regardless of sections', function() {
    ganttDb.setDateFormat('YYYY-MM-DD');
    ganttDb.addSection('testa1');
    ganttDb.addTask('test1', 'id1,2013-01-01,2w');
    ganttDb.addTask('test2', 'id2,after id3,1d');
    ganttDb.addSection('testa2');
    ganttDb.addTask('test3', 'id3,after id1,2d');

    const tasks = ganttDb.getTasks();

    expect(tasks[1].startTime).toEqual(new Date(2013, 0, 17));
    expect(tasks[1].endTime).toEqual(new Date(2013, 0, 18));
    expect(tasks[1].id).toEqual('id2');
    expect(tasks[1].task).toEqual('test2');

    expect(tasks[2].id).toEqual('id3');
    expect(tasks[2].task).toEqual('test3');
    expect(tasks[2].startTime).toEqual(new Date(2013, 0, 15));
    expect(tasks[2].endTime).toEqual(new Date(2013, 0, 17));
  });
  it('should ignore weekends', function() {
    ganttDb.setDateFormat('YYYY-MM-DD');
    ganttDb.setExcludes('weekends 2019-02-06,friday');
    ganttDb.addSection('weekends skip test');
    ganttDb.addTask('test1', 'id1,2019-02-01,1d');
    ganttDb.addTask('test2', 'id2,after id1,2d');
    ganttDb.addTask('test3', 'id3,after id2,7d');
    ganttDb.addTask('test4', 'id4,2019-02-01,2019-02-20'); // Fixed endTime
    ganttDb.addTask('test5', 'id5,after id4,1d');
    ganttDb.addSection('full ending taks on last day');
    ganttDb.addTask('test6', 'id6,2019-02-13,2d');
    ganttDb.addTask('test7', 'id7,after id6,1d');

    const tasks = ganttDb.getTasks();

    expect(tasks[0].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate());
    expect(tasks[0].endTime).toEqual(moment('2019-02-04', 'YYYY-MM-DD').toDate());
    expect(tasks[0].renderEndTime).toEqual(moment('2019-02-02', 'YYYY-MM-DD').toDate());
    expect(tasks[0].id).toEqual('id1');
    expect(tasks[0].task).toEqual('test1');

    expect(tasks[1].startTime).toEqual(moment('2019-02-04', 'YYYY-MM-DD').toDate());
    expect(tasks[1].endTime).toEqual(moment('2019-02-07', 'YYYY-MM-DD').toDate());
    expect(tasks[1].renderEndTime).toEqual(moment('2019-02-06', 'YYYY-MM-DD').toDate());
    expect(tasks[1].id).toEqual('id2');
    expect(tasks[1].task).toEqual('test2');

    expect(tasks[2].startTime).toEqual(moment('2019-02-07', 'YYYY-MM-DD').toDate());
    expect(tasks[2].endTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate());
    expect(tasks[2].renderEndTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate());
    expect(tasks[2].id).toEqual('id3');
    expect(tasks[2].task).toEqual('test3');

    expect(tasks[3].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate());
    expect(tasks[3].endTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate());
    expect(tasks[3].renderEndTime).toBeNull(); // Fixed end
    expect(tasks[3].id).toEqual('id4');
    expect(tasks[3].task).toEqual('test4');

    expect(tasks[4].startTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate());
    expect(tasks[4].endTime).toEqual(moment('2019-02-21', 'YYYY-MM-DD').toDate());
    expect(tasks[4].renderEndTime).toEqual(moment('2019-02-21', 'YYYY-MM-DD').toDate());
    expect(tasks[4].id).toEqual('id5');
    expect(tasks[4].task).toEqual('test5');

    expect(tasks[5].startTime).toEqual(moment('2019-02-13', 'YYYY-MM-DD').toDate());
    expect(tasks[5].endTime).toEqual(moment('2019-02-18', 'YYYY-MM-DD').toDate());
    expect(tasks[5].renderEndTime).toEqual(moment('2019-02-15', 'YYYY-MM-DD').toDate());
    expect(tasks[5].id).toEqual('id6');
    expect(tasks[5].task).toEqual('test6');

    expect(tasks[6].startTime).toEqual(moment('2019-02-18', 'YYYY-MM-DD').toDate());
    expect(tasks[6].endTime).toEqual(moment('2019-02-19', 'YYYY-MM-DD').toDate());
    expect(tasks[6].id).toEqual('id7');
    expect(tasks[6].task).toEqual('test7');
  });

  it('should work when end date is the 31st', function() {
    ganttDb.setDateFormat('YYYY-MM-DD');
    ganttDb.addSection('Task endTime is on the 31st day of the month');
    ganttDb.addTask('test1', 'id1,2019-09-30,11d');
    ganttDb.addTask('test2', 'id2,after id1,20d');
    const tasks = ganttDb.getTasks();

    expect(tasks[0].startTime).toEqual(moment('2019-09-30', 'YYYY-MM-DD').toDate());
    expect(tasks[0].endTime).toEqual(moment('2019-10-11', 'YYYY-MM-DD').toDate());
    expect(tasks[1].renderEndTime).toBeNull(); // Fixed end
    expect(tasks[0].id).toEqual('id1');
    expect(tasks[0].task).toEqual('test1');

    expect(tasks[1].startTime).toEqual(moment('2019-10-11', 'YYYY-MM-DD').toDate());
    expect(tasks[1].endTime).toEqual(moment('2019-10-31', 'YYYY-MM-DD').toDate());
    expect(tasks[1].renderEndTime).toBeNull(); // Fixed end
    expect(tasks[1].id).toEqual('id2');
    expect(tasks[1].task).toEqual('test2');
  });

  describe('when setting inclusive end dates', function() {
    beforeEach(function() {
      ganttDb.setDateFormat('YYYY-MM-DD');
      ganttDb.enableInclusiveEndDates();
      ganttDb.addTask('test1', 'id1,2019-02-01,1d');
      ganttDb.addTask('test2', 'id2,2019-02-01,2019-02-03');
    });
    it('should automatically add one day to all end dates', function() {
      const tasks = ganttDb.getTasks();
      expect(tasks[0].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate());
      expect(tasks[0].endTime).toEqual(moment('2019-02-02', 'YYYY-MM-DD').toDate());
      expect(tasks[0].id).toEqual('id1');
      expect(tasks[0].task).toEqual('test1');

      expect(tasks[1].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate());
      expect(tasks[1].endTime).toEqual(moment('2019-02-04', 'YYYY-MM-DD').toDate());
      expect(tasks[1].renderEndTime).toBeNull(); // Fixed end
      expect(tasks[1].manualEndTime).toBeTruthy();
      expect(tasks[1].id).toEqual('id2');
      expect(tasks[1].task).toEqual('test2');
    });
  });
});
